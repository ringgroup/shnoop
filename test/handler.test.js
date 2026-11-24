import {test} from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/index.js';
async function call(url,method='GET',headers={},body) { const res={headers:{},setHeader(k,v){this.headers[k]=v;},end(v){this.body=v;}};await handler({url,method,headers,body},res);return res; }
test('privacy describes a single-owner deployment',async()=>{const r=await call('/privacy');assert.equal(r.statusCode,200);assert.ok(r.body.includes('single-owner'));assert.ok(r.body.includes('Neon'));});
test('unconfigured service fails closed',async()=>{delete process.env.APP_ORIGIN;const r=await call('/mcp','POST',{},{});assert.equal(r.statusCode,503);});
test('private routes require caller auth',async()=>{process.env.APP_ORIGIN='https://fixture.invalid';process.env.CONNECTOR_API_KEY='fixture';for(const route of ['/mcp','/oauth/start','/status','/verify','/disconnect']){const r=await call(route,'POST');assert.equal(r.statusCode,401);}});
test('configured origin alone cannot enable callback',async()=>{const r=await call('/oauth/callback?code=fixture&state=fixture');assert.equal(r.statusCode,503);});
