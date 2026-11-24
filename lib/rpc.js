const LIMIT=64*1024;
export class RpcError extends Error {constructor(code,message,id=null){super(message);this.code=code;this.id=id;}}
export function parseRpc(input){
 let body;
 try {
  if(Buffer.isBuffer(input)){if(input.length>LIMIT)throw new RpcError(-32600,'Request too large');body=JSON.parse(input.toString('utf8'));}
  else if(typeof input==='string'){if(Buffer.byteLength(input)>LIMIT)throw new RpcError(-32600,'Request too large');body=JSON.parse(input);}
  else {if(Buffer.byteLength(JSON.stringify(input)??'')>LIMIT)throw new RpcError(-32600,'Request too large');body=input;}
 }catch(e){if(e instanceof RpcError)throw e;throw new RpcError(-32700,'Parse error');}
 if(!body||Array.isArray(body)||typeof body!=='object'||body.jsonrpc!=='2.0'||typeof body.method!=='string')throw new RpcError(-32600,'Invalid request');
 if(Object.hasOwn(body,'id')&&!(typeof body.id==='string'||(typeof body.id==='number'&&Number.isFinite(body.id))||body.id===null))throw new RpcError(-32600,'Invalid id');
 if(body.params!==undefined&&(!body.params||typeof body.params!=='object'||Array.isArray(body.params)))throw new RpcError(-32602,'Invalid params',body.id??null);
 return body;
}
export function rpcError(error,id=null){return{jsonrpc:'2.0',id:error instanceof RpcError?error.id:id,error:{code:error instanceof RpcError?error.code:-32603,message:error instanceof RpcError?error.message:'Request failed safely'}};}
