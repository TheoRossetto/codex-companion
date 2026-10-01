import {h,clear,svg} from './dom';
import {ICONS} from './icons';
import {Bridge,onEvent,type ChatContext} from '../core/bridge';
import {State} from '../core/state';
import {Sound} from '../core/sound';
import type {ViewHost} from './views';
let sending=false,nextId=1,partial='',question:{requestId:string;questions:any[]}|null=null;
void onEvent<{text:string}>('chat-delta',p=>{partial=p.text;State.notify()});
void onEvent<any>('question',p=>{question=p;State.notify()});
void onEvent<{requestId:string}>('approval-resolved',p=>{if(question?.requestId===p.requestId){question=null;State.notify()}});
export function buildPrompt(onHeightChange:()=>void):ViewHost {
 const log=h('div',{class:'chat-log'}),chip=h('div',{class:'chip-row'});
 const input=h('input',{class:'chat-input',placeholder:'Converse com o Codex…','aria-label':'Mensagem para o Codex',spellcheck:'true'});
 const send=h('button',{class:'send-btn',title:'Enviar', 'aria-label':'Enviar'},svg(ICONS.arrowUp,11));
 const attach=h('button',{class:'link-btn',title:'Anexar arquivo','aria-label':'Anexar arquivo'},svg(ICONS.plus,13));
 const fresh=h('button',{class:'link-btn',title:'Nova conversa','aria-label':'Nova conversa'},svg(ICONS.bubble,13));
 const stop=h('button',{class:'link-btn',text:'Parar',title:'Interromper turno'});
 const questions=h('div',{class:'chat-question'});
 const el=h('div',{class:'view'},h('div',{class:'card wash chat-card'},h('div',{class:'chat-body'},chip,log,questions,h('div',{class:'chat-bar'},attach,fresh,input,stop,send))));
 let key='',questionKey='';
 const failure=(e:unknown)=>{State.chatHistory.push({id:nextId++,role:'assistant',content:'Erro: '+String(e).replace(/^Error:\s*/,'')});State.notify()};
 async function submit(){const query=input.value.trim();if(!query||sending)return;input.value='';sending=true;partial='';State.isPinned=true;Sound.play('send');State.chatHistory.push({id:nextId++,role:'user',content:query});State.stateOverride='thinking';State.notify();onHeightChange();const f=State.droppedFile;const context:ChatContext|null=f?{kind:'file',name:f.name,path:f.path}:null;
  try{const reply=await Bridge.chatSend(query,context);State.chatHistory.push({id:nextId++,role:'assistant',content:reply.text});State.droppedFile=null;Sound.play('finish')}catch(e){failure(e)}finally{sending=false;partial='';State.stateOverride=null;State.isPinned=false;State.notify();onHeightChange();input.focus()}}
 send.onclick=()=>void submit();input.onkeydown=e=>{if(e.key==='Escape')return;e.stopPropagation();if(e.key==='Enter'){e.preventDefault();void submit()}};
 stop.onclick=()=>{void window.orbit.invoke('chat_cancel').catch(failure)};
 fresh.onclick=async()=>{try{await Bridge.chatReset();State.chatHistory=[];State.droppedFile=null;partial='';State.notify();onHeightChange()}catch(e){failure(e)}};
 attach.onclick=async()=>{try{const file=await window.orbit.invoke('choose_file') as {name:string;path:string}|null;if(file){State.droppedFile=file;State.notify()}}catch(e){failure(e)}};
 return{el,focus(){input.focus()},sync(){
  input.disabled=sending;send.disabled=sending;fresh.disabled=sending;attach.disabled=sending;stop.style.display=sending?'':'none';
  const current=JSON.stringify([State.chatHistory,partial,sending,State.droppedFile]);if(current!==key){key=current;clear(log);clear(chip);if(State.droppedFile)chip.append(h('div',{class:'chip settled',text:State.droppedFile.name}));for(const m of State.chatHistory)log.append(h('div',{class:'chat-row '+(m.role==='user'?'user':'')},h('div',{class:m.role==='user'?'bubble':'reply',text:m.content})));if(sending)log.append(h('div',{class:'chat-row'},h('div',{class:'reply',text:partial||'Pensando…'})));log.scrollTop=log.scrollHeight}
  if(questionKey!==(question?.requestId||'')){questionKey=question?.requestId||'';clear(questions);if(question){const active=question;const fields=new Map<string,HTMLInputElement>();for(const q of active.questions){const field=h('input',{class:'chat-input',placeholder:'Sua resposta','aria-label':q.question});fields.set(q.id,field);questions.append(h('div',{text:q.question}),field);for(const option of q.options||[])questions.append(h('button',{class:'link-btn',text:option.label,onclick:()=>{field.value=option.label}}))}questions.append(h('button',{class:'link-btn',text:'Responder',onclick:()=>{const answers=Object.fromEntries([...fields].map(([id,f])=>[id,f.value]));void window.orbit.invoke('chat_answer',{requestId:active.requestId,answers}).catch(failure)}}))}}
 }};
}
