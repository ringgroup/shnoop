import pg from 'pg';
import { seal, unseal, stateHash, validTokens } from './security.js';
export class Store {
  constructor(env) { this.env = env; this.pool = new pg.Pool({ connectionString: env.DATABASE_URL, max: 2, connectionTimeoutMillis: 10000, idleTimeoutMillis: 1000 }); }
  async withLock(fn) {
    const c = await this.pool.connect();let locked=false,discard=false;
    try {
      await c.query("SET lock_timeout = '12s'");
      await c.query('SELECT pg_advisory_lock(705119782)');locked=true;
      await c.query('BEGIN');
      const result = await fn(c);
      await c.query('COMMIT');
      return result;
    } catch (e) { try{await c.query('ROLLBACK');}catch{discard=true;} throw e; }
    finally {try{if(locked)await c.query('SELECT pg_advisory_unlock(705119782)');}catch{discard=true;}finally{c.release(discard);}}
  }
  async disconnect() {
    return this.withLock(async c=>{
      const r=await c.query('SELECT token_cipher,needs_reconnect FROM whoop_owner WHERE id=1 FOR UPDATE');
      let remoteRevoked=!r.rowCount;
      if(r.rowCount){
        const current=unseal(r.rows[0].token_cipher,this.env.TOKEN_ENCRYPTION_KEY);
        try{
          const response=await fetch('https://api.prod.whoop.com/developer/v2/user/access',{method:'DELETE',headers:{authorization:`Bearer ${current.access_token}`},signal:AbortSignal.timeout(12000)});
          remoteRevoked=response.ok;
        }catch{remoteRevoked=false;}
      }
      await c.query('DELETE FROM whoop_owner');await c.query('DELETE FROM whoop_oauth_states');
      return {disconnected:true,remote_revoked:remoteRevoked,...(!remoteRevoked?{action_required:'Remove app access in WHOOP to confirm provider revocation'}:{})};
    });
  }
  async putState(value) {
    await this.pool.query('DELETE FROM whoop_oauth_states WHERE expires_at < now()');
    await this.pool.query('INSERT INTO whoop_oauth_states(hash, expires_at) VALUES($1, now() + interval \'10 minutes\')', [stateHash(value)]);
  }
  async consumeState(value) {
    const r = await this.pool.query('DELETE FROM whoop_oauth_states WHERE hash=$1 AND expires_at>now() RETURNING hash', [stateHash(value)]);
    return r.rowCount === 1;
  }
  async saveTokens(c, tokens) {
    await c.query('INSERT INTO whoop_owner(id,token_cipher,needs_reconnect) VALUES(1,$1,false) ON CONFLICT(id) DO UPDATE SET token_cipher=EXCLUDED.token_cipher,needs_reconnect=false', [seal(tokens,this.env.TOKEN_ENCRYPTION_KEY)]);
  }
  async connected() {
    const r = await this.pool.query('SELECT needs_reconnect FROM whoop_owner WHERE id=1');
    return r.rowCount > 0 && !r.rows[0].needs_reconnect;
  }
  async token({ forceRefresh = false } = {}) {
    const out = await this.withLock(async c => {
      const r = await c.query('SELECT token_cipher,needs_reconnect FROM whoop_owner WHERE id=1 FOR UPDATE');
      if (!r.rowCount || r.rows[0].needs_reconnect) return { error: 'Reconnect required' };
      const current = unseal(r.rows[0].token_cipher,this.env.TOKEN_ENCRYPTION_KEY);
      if (!forceRefresh && current.expires_at > Date.now()+60000) return { token: current.access_token };
      // Commit an uncertainty marker BEFORE an external rotating-token request.
      // A crash or ambiguous network result must not reuse an already-spent refresh token.
      await c.query('UPDATE whoop_owner SET needs_reconnect=true WHERE id=1');
      await c.query('COMMIT');
      await c.query('BEGIN');
      await c.query("SET LOCAL lock_timeout = '12s'");
      // Same session advisory lock remains held across COMMIT.
      try {
        const response = await fetch('https://api.prod.whoop.com/oauth/oauth2/token', {
          method:'POST', headers:{'content-type':'application/x-www-form-urlencoded'},
          body:new URLSearchParams({grant_type:'refresh_token',refresh_token:current.refresh_token,client_id:this.env.WHOOP_CLIENT_ID,client_secret:this.env.WHOOP_CLIENT_SECRET,scope:'offline'}),signal:AbortSignal.timeout(12000)
        });
        if(!response.ok) return {error:'Reconnect required'};
        const raw = await response.json();
        // WHOOP may omit unchanged scopes in refresh responses.
        const tokens=validTokens({...raw,scope:raw.scope || current.scope.join(' ')});
        await this.saveTokens(c,tokens);
        return {token:tokens.access_token,refreshed:true};
      } catch {return {error:'Reconnect required'};}
    });
    if(out.error) throw new Error(out.error);
    return out;
  }
  async close() { await this.pool.end(); }
}
