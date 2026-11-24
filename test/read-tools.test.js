import {test} from 'node:test';
import assert from 'node:assert/strict';
import {toolList,readPath} from '../lib/read-tools.js';
test('all current member read endpoint families covered',()=>{assert.equal(toolList().length,11);assert.equal(readPath('whoop_profile'),'user/profile/basic');assert.equal(readPath('whoop_body_measurements'),'user/measurement/body');assert.equal(readPath('whoop_cycle_recovery',{cycle_id:123}),'cycle/123/recovery');});
test('no arbitrary path or unknown input',()=>{for(const name of ['__proto__','https://attacker.invalid','whoop_delete'])assert.throws(()=>readPath(name));assert.throws(()=>readPath('whoop_profile',{url:'https://attacker.invalid'}));assert.throws(()=>readPath('whoop_cycle',{cycle_id:'../user'}));assert.throws(()=>readPath('whoop_sleep_detail',{id:'../../profile'}));});
test('bounded pagination is explicit',()=>{assert.ok(readPath('whoop_workouts',{limit:2,next_token:'fixture'}).includes('nextToken=fixture'));assert.throws(()=>readPath('whoop_sleep',{limit:100}));});
