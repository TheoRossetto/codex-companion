const {contextBridge,ipcRenderer,webUtils}=require('electron');
const commands=new Set(['boot','save_settings','set_collapsed','set_island_rect','focus_window','reposition','open_url','open_in_vscode','quit_app','open_settings_window','log_line','hooks_status','hooks_preview','hooks_apply','approval_decision','approval_ack','approval_decline','chat_send','chat_reset','chat_cancel','chat_answer','ingest_file','choose_file','choose_project','models','secret_present','secret_set','secret_clear','refresh_integration','open_n8n','set_paused']);
const events=new Set(['cursor','tray','hook','sessions','screen-changed','settings-changed','integration','chat-delta','chat-progress','chat-plan','approval','approval-resolved','question']);
const drops=new Set();
window.addEventListener('DOMContentLoaded',()=>{
  let depth=0;
  document.addEventListener('dragenter',e=>{if(!e.isTrusted)return;e.preventDefault();depth++;for(const fn of drops)fn({type:'enter'})});
  document.addEventListener('dragover',e=>{e.preventDefault();if(e.isTrusted)for(const fn of drops)fn({type:'over'})});
  document.addEventListener('dragleave',e=>{if(!e.isTrusted)return;if(--depth<=0){depth=0;for(const fn of drops)fn({type:'leave'})}});
  document.addEventListener('drop',async e=>{e.preventDefault();depth=0;if(!e.isTrusted)return;const paths=[...e.dataTransfer.files].slice(0,1).map(f=>webUtils.getPathForFile(f));try{const grants=await ipcRenderer.invoke('orbit:drop',paths);for(const fn of drops)fn({type:'drop',paths:grants})}catch{for(const fn of drops)fn({type:'leave'})}});
});
contextBridge.exposeInMainWorld('orbit',{
 invoke:(command,args)=>{if(!commands.has(command))return Promise.reject(new Error('Invalid command'));return ipcRenderer.invoke('orbit:invoke',command,args)},
 onEvent:(name,fn)=>{if(!events.has(name))throw new Error('Invalid event');const listener=(_e,payload)=>fn(payload);ipcRenderer.on('orbit:event:'+name,listener);return()=>ipcRenderer.removeListener('orbit:event:'+name,listener)},
 onDragDrop:fn=>{drops.add(fn);return()=>drops.delete(fn)},
});
