import { randomBytes, createCipheriv, createDecipheriv, createHash, createHmac, timingSafeEqual } from 'node:crypto';
export const SCOPES = ['read:sleep', 'read:recovery', 'read:cycles', 'read:workout', 'read:profile', 'read:body_measurement', 'offline'];
export function authorized(header, secret) {
  if (!secret || typeof header !== 'string') return false;
  return timingSafeEqual(createHash('sha256').update(header).digest(), createHash('sha256').update(`Bearer ${secret}`).digest());
}
export function seal(value, hexKey) {
  if (!/^[a-f0-9]{64}$/i.test(hexKey || '')) throw new Error('Invalid encryption configuration');
  const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', Buffer.from(hexKey, 'hex'), iv);
  const data = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), data]).toString('base64');
}
export function unseal(value, hexKey) {
  const data = Buffer.from(value, 'base64');
  const decipher = createDecipheriv('aes-256-gcm', Buffer.from(hexKey, 'hex'), data.subarray(0, 12));
  decipher.setAuthTag(data.subarray(12, 28));
  return JSON.parse(Buffer.concat([decipher.update(data.subarray(28)), decipher.final()]).toString('utf8'));
}
export function stateValue() { return randomBytes(32).toString('hex'); }
export function stateHash(value) { return createHash('sha256').update(value).digest('hex'); }
export function validatedOrigin(value) {
  const u = new URL(value);
  if (u.protocol !== 'https:' || u.pathname !== '/' || u.search || u.hash || u.username || u.password) throw new Error('Invalid origin');
  return u.origin;
}
export function validTokens(value) {
  if (typeof value.access_token !== 'string' || !value.access_token || typeof value.refresh_token !== 'string' || !value.refresh_token || !Number.isFinite(value.expires_in) || value.expires_in <= 0) throw new Error('Invalid token response');
  const scope = new Set((value.scope || '').split(' '));
  if (!SCOPES.every(s => scope.has(s)) || [...scope].some(s => !SCOPES.includes(s))) throw new Error('Unexpected token scopes');
  return { access_token: value.access_token, refresh_token: value.refresh_token, expires_at: Date.now() + value.expires_in * 1000, scope: [...scope] };
}
export function queryForRead(args = {}) {
  const q = new URLSearchParams();
  if (args.start) { if (!Number.isFinite(Date.parse(args.start))) throw new Error('Invalid start'); q.set('start', new Date(args.start).toISOString()); }
  if (args.end) { if (!Number.isFinite(Date.parse(args.end))) throw new Error('Invalid end'); q.set('end', new Date(args.end).toISOString()); }
  const limit = args.limit ?? 7;
  if (!Number.isInteger(limit) || limit < 1 || limit > 25) throw new Error('Invalid limit');
  q.set('limit', String(limit));
  return q;
}

export function validWebhook(rawBody, timestamp, signature, secret, now=Date.now()) {
  if(!secret||typeof timestamp!=='string'||!/^\d{13}$/.test(timestamp)||Math.abs(now-Number(timestamp))>300000||typeof signature!=='string')return false;
  const expected=createHmac('sha256',secret).update(timestamp).update(rawBody).digest();
  const actual=Buffer.from(signature,'base64');
  return actual.length===expected.length&&timingSafeEqual(actual,expected);
}
