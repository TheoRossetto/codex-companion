const fs=require('node:fs'),net=require('node:net'),path=require('node:path');
const {LIMIT,metadata,storageDir,pipeName,sign,verify}=require('./protocol.cjs');
const {permission}=require('./permission.cjs');
let socket,ended=false,timer;
function finish(value={}){if(ended)return;ended=true;clearTimeout(timer);socket?.destroy();process.stdout.write(JSON.stringify(value)+'\n',()=>process.exit(0))}
timer=setTimeout(()=>finish(),1200);process.on('uncaughtException',()=>finish());process.on('unhandledRejection',()=>finish());
let input='';process.stdin.setEncoding('utf8');process.stdin.on('data',c=>{input+=c;if(Buffer.byteLength(input)>1024*1024)finish()});process.stdin.on('error',()=>finish());
process.stdin.on('end',()=>{try{
 const raw=JSON.parse(input),payload=metadata(raw);if(!payload)return finish();const details=permission(raw);if(details)payload.permission=details;
 const dir=storageDir(),key=fs.readFileSync(path.join(dir,'transport.key'),'utf8').trim();if(!/^[a-f0-9]{64}$/.test(key))return finish();
 socket=net.createConnection(pipeName(dir));socket.setEncoding('utf8');socket.setTimeout(350,()=>finish());socket.on('error',()=>finish());socket.on('end',()=>finish());let buffer='',nonce=null;
 socket.on('data',chunk=>{buffer+=chunk;if(Buffer.byteLength(buffer)>LIMIT)return finish();for(let n;(n=buffer.indexOf('\n'))>=0;){const line=buffer.slice(0,n);buffer=buffer.slice(n+1);const frame=JSON.parse(line);
  if(!nonce){if(typeof frame.nonce!=='string'||!verify(key,'server:'+frame.nonce,frame.proof))return finish();nonce=frame.nonce;const body=JSON.stringify(payload);socket.write(JSON.stringify({body,proof:sign(key,nonce+':'+body)})+'\n')}
  else if(frame.waiting&&details&&verify(key,'waiting:'+nonce,frame.proof)){clearTimeout(timer);timer=setTimeout(()=>finish(),92000);socket.setTimeout(92000,()=>finish())}
  else if(typeof frame.body==='string'&&verify(key,'decision:'+nonce+':'+frame.body,frame.proof)){const value=JSON.parse(frame.body);const output=value.hookSpecificOutput;if(output?.hookEventName==='PermissionRequest'&&['allow','deny'].includes(output.decision?.behavior))return finish({hookSpecificOutput:{hookEventName:'PermissionRequest',decision:{behavior:output.decision.behavior}}});return finish()}
  else return finish();
 }});
}catch{finish()}});
