import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {validWebhook} from '../lib/security.js';
test('webhook signature authenticates exact raw payload and timestamp',()=>{const now=Date.now(),ts=String(now),raw=Buffer.from('{"fixture":true}'),key='fixture-only';const sig=createHmac('sha256',key).update(ts).update(raw).digest('base64');assert.equal(validWebhook(raw,ts,sig,key,now),true);assert.equal(validWebhook(Buffer.from('{}'),ts,sig,key,now),false);assert.equal(validWebhook(raw,ts,sig,key,now+300001),false);assert.equal(validWebhook(raw,ts,sig,'wrong',now),false);});
