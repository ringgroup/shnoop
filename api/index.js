import { Store } from '../lib/store.js';
import { authorized, SCOPES, stateValue, validTokens, validatedOrigin } from '../lib/security.js';
import {READ_TOOLS,toolList,readPath} from '../lib/read-tools.js';
import {parseRpc,rpcError} from '../lib/rpc.js';
const publicPrivacy = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Shnoop privacy</title><style>body{max-width:680px;margin:64px auto;padding:24px;font:18px/1.6 system-ui;color:#182125}h1{line-height:1.2}</style><h1>Shnoop</h1><p>This is a private, single-owner service for reading the owner's WHOOP sleep, recovery, cycles, workouts, profile and body measurements. It is not available for other users.</p><h2>Data and access</h2><p>The service requests read permissions for sleep, recovery, cycles, workouts, profile and body measurements, plus offline access for token renewal. The configured scopes are requested only when the owner completes consent. No partner laboratory access is requested. Read requests are authenticated. Credentials are encrypted in storage and are never included in API responses.</p><h2>Providers and retention</h2><p>WHOOP provides the data, Vercel runs the service, Neon stores encrypted credentials, and Composio may route authenticated requests to the owner's assistant. No health history is stored by this service. Vercel request metadata may retain OAuth callback query parameters, including the short-lived single-use authorization code and random state. The service exchanges the code immediately, never logs it itself, and redirects to a clean URL. Provider operational metadata and backups follow their own retention policies. The service does not sell data or use it to train models.</p><h2>Disconnect</h2><p>The owner can revoke access in WHOOP. The service's authenticated disconnect action deletes its active credential and authorization-state records and attempts provider revocation. If provider revocation cannot be confirmed, it instructs the owner to remove app access in WHOOP. Encrypted backup copies may remain for the database provider's retention period.</p><p>Support: contact the owner through the private channel used to set up this connector.</p></html>`;
function send(res,status,value,type='application/json') { res.statusCode=status;res.setHeader('content-type',type);res.setHeader('cache-control','no-store');res.setHeader('referrer-policy','no-referrer');res.setHeader('x-content-type-options','nosniff');res.end(type==='application/json'?JSON.stringify(value):value); }
export default async function handler(req,res) {
  const url=new URL(req.url,'https://local.invalid');
  const route=url.pathname;
  if(route==='/privacy' && req.method==='GET') return send(res,200,publicPrivacy,'text/html; charset=utf-8');
  if(route==='/connected' && req.method==='GET') return send(res,200,'Authorization saved. Connection verification is still required. You may close this page.','text/plain');
  if(route==='/health' && req.method==='GET') return send(res,200,{service:'personal-connector',ready:!!process.env.DATABASE_URL});
  let origin;
  try {origin=validatedOrigin(process.env.APP_ORIGIN);}catch{return send(res,503,{error:'Service not configured'});}
  const caller=authorized(req.headers.authorization,process.env.CONNECTOR_API_KEY);
  if(route!=='/oauth/callback' && !caller) return send(res,401,{error:'Unauthorized'});
  let rpc;
  if(route==='/mcp') {
    if(req.method!=='POST') {res.setHeader('allow','POST');return send(res,405,{error:'Method not allowed'});}
    try{rpc=parseRpc(req.body);}catch(e){return send(res,400,rpcError(e));}
    if(!Object.hasOwn(rpc,'id')){res.statusCode=202;return res.end();}
    const reply=result=>send(res,200,{jsonrpc:'2.0',id:rpc.id,result});
    if(rpc.method==='initialize')return reply({protocolVersion:'2025-03-26',capabilities:{tools:{}},serverInfo:{name:'shnoop',version:'0.1.0'}});
    if(rpc.method==='ping')return reply({});
    if(rpc.method==='tools/list')return reply({tools:toolList()});
    if(rpc.method!=='tools/call'||!Object.hasOwn(READ_TOOLS,rpc.params?.name))return send(res,200,{jsonrpc:'2.0',id:rpc.id,error:{code:-32601,message:'Method not available'}});
    try{readPath(rpc.params.name,rpc.params.arguments);}catch{return send(res,200,{jsonrpc:'2.0',id:rpc.id,error:{code:-32602,message:'Invalid tool arguments'}});}
  }

  if(!process.env.DATABASE_URL || !process.env.WHOOP_CLIENT_ID || !process.env.WHOOP_CLIENT_SECRET || !process.env.TOKEN_ENCRYPTION_KEY) return send(res,503,{error:'Service not configured'});
  const store=new Store(process.env);
  try {
    if(route==='/oauth/start' && req.method==='POST') {
      const state=stateValue();await store.putState(state);
      const auth=new URL('https://api.prod.whoop.com/oauth/oauth2/auth');
      auth.search=new URLSearchParams({client_id:process.env.WHOOP_CLIENT_ID,response_type:'code',redirect_uri:`${origin}/oauth/callback`,scope:SCOPES.join(' '),state});
      return send(res,200,{authorization_url:auth.toString()});
    }
    if(route==='/oauth/callback' && req.method==='GET') {
      const state=url.searchParams.get('state'),code=url.searchParams.get('code');
      if(!state || !/^[a-f0-9]{64}$/.test(state) || !await store.consumeState(state)) return send(res,400,{error:'Invalid or expired authorization'});
      if(!code || url.searchParams.has('error')) return send(res,400,{error:'Authorization incomplete'});
      const response=await fetch('https://api.prod.whoop.com/oauth/oauth2/token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'authorization_code',code,redirect_uri:`${origin}/oauth/callback`,client_id:process.env.WHOOP_CLIENT_ID,client_secret:process.env.WHOOP_CLIENT_SECRET}),signal:AbortSignal.timeout(12000)});
      if(!response.ok) return send(res,400,{error:'Authorization failed; start again'});
      const tokens=validTokens(await response.json());await store.withLock(c=>store.saveTokens(c,tokens));
      res.statusCode=303;res.setHeader('location',`${origin}/connected`);res.setHeader('cache-control','no-store');res.setHeader('referrer-policy','no-referrer');return res.end();
    }
    if(route==='/status' && req.method==='GET') return send(res,200,{authorized:await store.connected(),verified:false});
    if(route==='/verify' && req.method==='POST') {
      const token=await store.token({forceRefresh:true});
      const r=await fetch('https://api.prod.whoop.com/developer/v2/cycle?limit=1',{headers:{authorization:`Bearer ${token.token}`},signal:AbortSignal.timeout(12000)});
      if(!r.ok) return send(res,502,{error:'Refresh completed but read failed'});
      const v=await r.json();return send(res,200,{refreshed:token.refreshed===true,read_ok:true,records:Array.isArray(v.records)?v.records.length:0});
    }
    if(route==='/disconnect' && req.method==='POST') return send(res,200,await store.disconnect());
    if(route==='/mcp') {
      const path=readPath(rpc.params.name,rpc.params.arguments);const {token}=await store.token();
      const r=await fetch(`https://api.prod.whoop.com/developer/v2/${path}`,{headers:{authorization:`Bearer ${token}`},signal:AbortSignal.timeout(12000)});
      if(!r.ok) return send(res,200,{jsonrpc:'2.0',id:rpc.id,result:{isError:true,content:[{type:'text',text:'WHOOP read failed; data is unavailable'}]}});
      return send(res,200,{jsonrpc:'2.0',id:rpc.id,result:{content:[{type:'text',text:JSON.stringify(await r.json())}]}});
    }
    return send(res,404,{error:'Not found'});
  }catch{return route==='/mcp'?send(res,200,rpcError(new Error(),rpc.id)):send(res,503,{error:'Request failed safely; check connection status'});}finally{await store.close();}
}
