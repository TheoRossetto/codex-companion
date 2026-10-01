// Local Codex app-server client. Authentication stays with Codex.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawn, execFileSync } = require('node:child_process');
const { randomUUID } = require('node:crypto');
function findCodex() {
  if (process.env.ORBIT_CODEX_PATH && path.isAbsolute(process.env.ORBIT_CODEX_PATH)) return process.env.ORBIT_CODEX_PATH;
  let shims=[];
  try {
    const discovered = execFileSync(process.platform === 'win32' ? 'where.exe' : 'which', ['codex'], {encoding:'utf8',windowsHide:true,timeout:3000}).trim().split(/\r?\n/);shims=discovered;
    const found=discovered.find(p=>process.platform==='win32'?/\.exe$/i.test(p):!/\.(cmd|ps1|bat)$/i.test(p));
    if (found) return found;
  } catch {}
  const npmRoots=[...shims.map(p=>path.join(path.dirname(p),'node_modules','@openai')),path.join(process.env.APPDATA||os.homedir(),'npm','node_modules','@openai'),path.join(path.dirname(process.execPath),'node_modules','@openai')];
  function search(root,depth=0){if(depth>7||!fs.existsSync(root))return null;for(const e of fs.readdirSync(root,{withFileTypes:true})){if(e.isSymbolicLink())continue;const p=path.join(root,e.name);if(e.isFile()&&e.name==='codex.exe')return p;if(e.isDirectory()){const result=search(p,depth+1);if(result)return result}}return null}
  for(const root of npmRoots){try{const result=search(root);if(result)return result}catch{}}
  const extensions = path.join(os.homedir(), '.vscode', 'extensions');
  try {
    for (const name of fs.readdirSync(extensions).filter(n => n.startsWith('openai.chatgpt-')).sort().reverse()) {
      const exe = path.join(extensions,name,'bin','windows-x86_64','codex.exe');
      if(fs.existsSync(exe)) return exe;
    }
  } catch {}
  throw new Error('Instale o Codex no VS Code ou o Codex CLI e reabra o Orbit.');
}
class Codex {
  constructor({emit=()=>{}, executable, args=[], env=process.env}={}) {
    this.emit=emit;this.executable=executable;this.args=args;this.env=env;
    this.sequence=0;this.pending=new Map();this.approvals=new Map();this.items=new Map();this.thread=null;this.active=null;this.starting=null;
  }
  async start() {
    if(this.stopping)await this.stopping;
    if(this.starting)return this.starting;
    this.starting=this.initialize().catch(e=>{this.starting=null;throw e});
    return this.starting;
  }
  async initialize() {
    const child=this.child=spawn(this.executable||findCodex(),['app-server','--stdio',...this.args],{env:this.env,windowsHide:true,stdio:['pipe','pipe','pipe']});
    let buffer='';
    child.stdout.setEncoding('utf8');
    child.stdout.on('data',chunk=>{
      if(this.child!==child)return;
      buffer+=chunk;
      if(buffer.length>16*1024*1024){this.fail(new Error('Resposta do Codex excedeu o limite.'));child.kill();return}
      for(let n;(n=buffer.indexOf('\n'))>=0;){const line=buffer.slice(0,n);buffer=buffer.slice(n+1);try{this.receive(JSON.parse(line))}catch{}}
    });
    // Diagnostic stderr may contain sensitive context; do not persist or send it.
    child.stderr.resume();
    child.on('error',e=>this.fail(e));child.on('exit',()=>{if(this.child!==child)return;this.fail(new Error('Codex desconectou. Reenvie para reconectar.'));this.starting=null;this.child=null;this.thread=null});
    await this.rpc('initialize',{clientInfo:{name:'orbit_for_codex',version:require('../package.json').version},capabilities:{experimentalApi:true}});
    this.write({method:'initialized',params:{}});
  }
  write(value){if(!this.child?.stdin.writable)throw new Error('Codex não está conectado.');this.child.stdin.write(JSON.stringify(value)+'\n')}
  rpc(method,params){return new Promise((resolve,reject)=>{const id=++this.sequence;const timer=setTimeout(()=>{this.pending.delete(id);const error=new Error('Codex não respondeu: '+method);reject(error);void this.disconnect(error)},30000);this.pending.set(id,{resolve,reject,timer});try{this.write({id,method,params})}catch(e){clearTimeout(timer);this.pending.delete(id);reject(e)}})}
  receive(m) {
    if(m.method&&m.id!==undefined){this.request(m);return}
    if(m.id!==undefined){const p=this.pending.get(m.id);if(p){this.pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(new Error(m.error.message||'Erro do Codex')):p.resolve(m.result)}return}
    const p=m.params||{};
    if(m.method==='serverRequest/resolved'){for(const [key,a] of this.approvals)if(a.id===p.requestId){this.approvals.delete(key);this.emit('approval-resolved',{requestId:key})}return}
    if(!this.active||p.threadId!==this.thread?.id)return;
    const eventTurn=p.turnId??p.turn?.id;
    if(this.active.turnId&&eventTurn&&eventTurn!==this.active.turnId)return;
    if(m.method==='turn/started'){this.active.turnId=p.turn.id;this.emit('chat-progress',{state:'thinking',label:'Codex está pensando'})}
    if(m.method==='item/started'||m.method==='item/completed'){
      const item=p.item;this.items.set(item.id,item);
      if(item.type==='agentMessage'&&m.method==='item/completed')this.active.messages.set(item.id,item.text||'');
      else if(item.type!=='userMessage')this.emit('chat-progress',{state:item.type==='webSearch'?'searching':'working',label:item.command||item.type});
    }
    if(m.method==='item/agentMessage/delta'){this.active.messages.set(p.itemId,(this.active.messages.get(p.itemId)||'')+p.delta);this.emit('chat-delta',{text:[...this.active.messages.values()].join('\n\n')})}
    if(m.method==='turn/plan/updated')this.emit('chat-plan',{plan:p.plan});
    if(m.method==='turn/completed'){
      const active=this.active;this.active=null;this.clearApprovals();
      if(p.turn.status==='failed')active.reject(new Error(p.turn.error?.message||'O turno falhou.'));
      else active.resolve({text:[...active.messages.values()].join('\n\n')||(p.turn.status==='interrupted'?'Interrompido.':'Turno concluído.'),threadId:this.thread.id});
      this.emit('chat-progress',{state:p.turn.status==='failed'?'error':'finished',label:p.turn.status==='interrupted'?'Interrompido':'Concluído'});
    }
  }
  request(m){
    const p=m.params||{};
    if(!this.active||p.threadId!==this.thread?.id||(this.active.turnId&&p.turnId&&p.turnId!==this.active.turnId)){this.write({id:m.id,error:{code:-32600,message:'No active Orbit turn'}});return}
    const key=randomUUID();
    if(['item/commandExecution/requestApproval','item/fileChange/requestApproval'].includes(m.method)){
      const item=this.items.get(p.itemId);const details=m.method.includes('commandExecution')?JSON.stringify({...p,command:p.command||item?.command},null,2):JSON.stringify({reason:p.reason,grantRoot:p.grantRoot,changes:item?.changes},null,2);
      const canAllow=(!p.availableDecisions||p.availableDecisions.includes('accept'))&&(m.method.includes('commandExecution')?!!(p.command||item?.command||p.networkApprovalContext):!!item?.changes?.length);
      this.approvals.set(key,{id:m.id,method:m.method,params:p,canAllow});
      this.emit('approval',{requestId:key,sessionId:p.threadId,tool:m.method.includes('commandExecution')?'Comando':'Alteração de arquivo',command:details,canAllow});
     }else if(m.method==='item/permissions/requestApproval'){
      this.approvals.set(key,{id:m.id,method:m.method,params:p});this.emit('approval',{requestId:key,sessionId:p.threadId,tool:'Permissões deste turno',command:[p.cwd,p.reason,JSON.stringify(p.permissions,null,2)].filter(Boolean).join('\n'),canAllow:true});
    }else if(m.method==='item/tool/requestUserInput'){
      this.approvals.set(key,{id:m.id,method:m.method,params:p});this.emit('question',{requestId:key,questions:p.questions});
    }else {
      // Unknown approval contracts are never granted with a generic response.
      this.write({id:m.id,error:{code:-32601,message:'Unsupported interactive request: '+m.method}});
      this.emit('chat-progress',{state:'error',label:'Pedido não suportado: '+m.method});
    }
  }
  decide(requestId,decision){const a=this.approvals.get(requestId);if(!a||!['allow','deny'].includes(decision))throw new Error('Pedido expirado ou inválido.');if(a.method==='item/tool/requestUserInput')throw new Error('Este pedido exige uma resposta.');if(decision==='allow'&&a.canAllow===false)throw new Error('Detalhes insuficientes para autorizar.');if(decision==='allow'&&a.params.availableDecisions&&!a.params.availableDecisions.includes('accept'))throw new Error('Codex não permite esta decisão.');this.write({id:a.id,result:a.method==='item/permissions/requestApproval'?{permissions:decision==='allow'?a.params.permissions:{},scope:'turn'}:{decision:decision==='allow'?'accept':'decline'}});this.approvals.delete(requestId);this.emit('approval-resolved',{requestId})}
  answer(requestId,answers){const a=this.approvals.get(requestId);if(!a||a.method!=='item/tool/requestUserInput')throw new Error('Pergunta expirada.');const result={};for(const q of a.params.questions){const value=answers[q.id];if(typeof value!=='string'||value.length>10000)throw new Error('Resposta inválida.');result[q.id]={answers:[value]}}this.write({id:a.id,result:{answers:result}});this.approvals.delete(requestId);this.emit('approval-resolved',{requestId})}
  clearApprovals(){for(const key of this.approvals.keys())this.emit('approval-resolved',{requestId:key});this.approvals.clear()}
  async send({query,cwd,model,input=[]}){
    if(typeof query!=='string'||!query.trim()||query.length>100000)throw new Error('Mensagem vazia ou muito longa.');
    if(this.active||this.sending)throw new Error('Aguarde ou interrompa o turno atual.');this.sending=true;
    try{
      await this.start();
      if(!this.thread)this.thread=(await this.rpc('thread/start',{cwd,approvalPolicy:'on-request',approvalsReviewer:'user',...(model?{model}:{})})).thread;
      const completed=new Promise((resolve,reject)=>this.active={resolve,reject,messages:new Map(),turnId:null});completed.catch(()=>{});
      try{const result=await this.rpc('turn/start',{threadId:this.thread.id,input:[{type:'text',text:query},...input],...(model?{model}:{})});if(this.active)this.active.turnId=result.turn.id}catch(e){await this.disconnect(e)}
      return await completed;
    }finally{this.sending=false}
  }
  async disconnect(error){const child=this.child;this.child=null;this.thread=null;this.starting=null;this.fail(error);if(child){this.stopping=new Promise(resolve=>{const timer=setTimeout(resolve,5000);child.once('exit',()=>{clearTimeout(timer);resolve()});child.kill()});await this.stopping;this.stopping=null}}
  async cancel(){if(this.sending&&!this.active?.turnId){await this.disconnect(new Error('Turno interrompido.'));return}if(this.active?.turnId)await this.rpc('turn/interrupt',{threadId:this.thread.id,turnId:this.active.turnId})}
  async reset(){if(this.active)throw new Error('Interrompa o turno antes de iniciar outra conversa.');this.thread=null;this.items.clear()}
  async models(){await this.start();return this.rpc('model/list',{})}
  fail(e){for(const p of this.pending.values()){clearTimeout(p.timer);p.reject(e)}this.pending.clear();if(this.active){this.active.reject(e);this.active=null}this.clearApprovals()}
  close(){this.fail(new Error('Orbit foi fechado.'));this.child?.kill()}
}
module.exports={Codex,findCodex};
