import {queryForRead} from './security.js';
const uuid = value => {if(typeof value!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value))throw new Error('Invalid ID');return value;};
const cycle = value => {if(!Number.isSafeInteger(value)||value<1)throw new Error('Invalid cycle');return String(value);};
const idProperties={id:{type:'string'}}, cycleProperties={cycle_id:{type:'integer',minimum:1}};
const pageProperties={start:{type:'string'},end:{type:'string'},limit:{type:'integer',minimum:1,maximum:25},next_token:{type:'string',maxLength:2048}};
function paged(path,args){const q=queryForRead(args);if(args.next_token){if(typeof args.next_token!=='string'||args.next_token.length>2048)throw new Error('Invalid cursor');q.set('nextToken',args.next_token);}return `${path}?${q}`;}
export const READ_TOOLS={
 whoop_cycles:{description:'Read physiological cycle summaries including strain, average/max HR, energy and steps. Not live heart rate.',props:pageProperties,path:a=>paged('cycle',a)},
 whoop_cycle:{description:'Read a cycle by ID.',props:cycleProperties,required:['cycle_id'],path:a=>`cycle/${cycle(a.cycle_id)}`},
 whoop_cycle_sleep:{description:'Read sleep linked to a cycle.',props:cycleProperties,required:['cycle_id'],path:a=>`cycle/${cycle(a.cycle_id)}/sleep`},
 whoop_cycle_recovery:{description:'Read recovery linked to a cycle.',props:cycleProperties,required:['cycle_id'],path:a=>`cycle/${cycle(a.cycle_id)}/recovery`},
 whoop_sleep:{description:'Read paginated sleep summaries, stages, respiratory rate and scores.',props:pageProperties,path:a=>paged('activity/sleep',a)},
 whoop_sleep_detail:{description:'Read a sleep by UUID.',props:idProperties,required:['id'],path:a=>`activity/sleep/${uuid(a.id)}`},
 whoop_recovery:{description:'Read paginated recovery summaries. Missing/pending values are not normal vital signs.',props:pageProperties,path:a=>paged('recovery',a)},
 whoop_workouts:{description:'Read paginated workouts with HR summary, zones, strain, energy and distance where available.',props:pageProperties,path:a=>paged('activity/workout',a)},
 whoop_workout_detail:{description:'Read a workout by UUID.',props:idProperties,required:['id'],path:a=>`activity/workout/${uuid(a.id)}`},
 whoop_profile:{description:'Read the owner basic WHOOP profile.',props:{},path:()=> 'user/profile/basic'},
 whoop_body_measurements:{description:'Read current height, weight and max HR. Not scale history or blood pressure.',props:{},path:()=> 'user/measurement/body'}
};
export function toolList(){return Object.entries(READ_TOOLS).map(([name,v])=>({name,description:v.description,inputSchema:{type:'object',additionalProperties:false,properties:v.props,...(v.required?{required:v.required}:{})}}));}
export function readPath(name,args={}){const tool=Object.hasOwn(READ_TOOLS,name)?READ_TOOLS[name]:null;if(!tool||!args||typeof args!=='object'||Array.isArray(args))throw new Error('Unknown read tool');for(const key of Object.keys(args)){if(!Object.hasOwn(tool.props,key))throw new Error('Unknown argument');}return tool.path(args);}
