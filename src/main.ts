// Entry point: boot the bridge, wire the island, start the greeting.

import "./style.css";
import { Bridge, IS_DESKTOP, onEvent } from "./core/bridge";
import { Sound } from "./core/sound";
import { State, type Settings } from "./core/state";
import { Island } from "./island/island";
import { registerIntegrationHandlers, refreshConfigured } from "./island/integrations";

async function main() {
  const root = document.getElementById("root");
  if (!root) return;

  void Sound.preload();

  const island = new Island(root);

  const boot = await Bridge.boot();
  if (boot) {
    State.settings = { ...State.settings, ...boot.settings };
  }
  island.applySettings();
  State.loadIntegrationTasks();

  await onEvent<{ x: number; y: number }>("cursor", ({ x, y }) => island.onCursor(x, y));

  /** Pause has to reach Rust too, or the pollers keep calling out. */
  const setPaused = (on: boolean) => {
    if (State.paused === on) return;
    State.paused = on;
    void Bridge.setPaused(on);
  };

  await onEvent<string>("tray", (what) => {
    switch (what) {
      case "settings":
        setPaused(false);
        island.alert("settings");
        break;
      case "open":
        setPaused(false);
        island.alert(State.defaultView());
        break;
      case "pause":
        setPaused(!State.paused);
        if (State.paused) island.fsm.forceHidden();
        else island.reveal();
        break;
    }
  });

  await onEvent<null>("screen-changed", () => void Bridge.reposition());

  // The settings window writes preferences; apply them here without a restart.
  await onEvent<Settings>("settings-changed", (s) => {
    State.settings = { ...State.settings, ...s };
    island.applySettings();
    State.loadIntegrationTasks();
    void refreshConfigured();
  });

  // Owned chat and observed IDE sessions retain independent task states.
  let lastSessionEvent=0;
  await onEvent<any[]>('sessions',items=>{
    const ids=new Set(items.map(s=>'session:'+s.id));
    State.tasks=State.tasks.filter(t=>!t.id.startsWith('session:')||ids.has(t.id));
    for(const item of items){const id='session:'+item.id;let task=State.tasks.find(t=>t.id===id);if(!task){task={id,name:item.project,color:'#94d9ef',source:'codex',isIntegration:false,state:'idle',steps:[],stepIndex:0};State.tasks.push(task)}task.name=item.project;task.state=['unknown','ended','interrupted'].includes(item.state)?'idle':item.state;task.steps=item.steps;task.stepIndex=Math.max(0,item.steps.length-1)}
    if(State.focusId?.startsWith('session:')&&!ids.has(State.focusId))State.focusId='integration_codex';
    const newest=items.reduce((a,b)=>a.updatedAt>b.updatedAt?a:b,{updatedAt:0});
    if(newest.updatedAt>lastSessionEvent){lastSessionEvent=newest.updatedAt;if(State.view!=='prompt'&&State.focusId==='integration_codex'&&State.focusTask?.state==='idle')State.setFocus('session:'+newest.id);if(State.focusId==='session:'+newest.id&&newest.state==='finished')island.alert('finished');else island.reveal()}
    State.notify();
  });
  // Hook events are represented by the independent session list above.

  registerIntegrationHandlers(island);

  const approvals: any[] = [];
  const showApproval = () => {
    const pending=approvals[0]; if(!pending)return;
    State.pendingApproval=pending; State.setFocus('integration_codex'); State.isPinned=true;
    island.alert('approval'); State.notify();
    requestAnimationFrame(()=>void Bridge.approvalAck(pending.requestId));
  };
  await onEvent<any>('approval',p=>{approvals.push(p);showApproval()});
  await onEvent<any>('approval-resolved',p=>{const index=approvals.findIndex(a=>a.requestId===p.requestId);if(index>=0)approvals.splice(index,1);if(State.pendingApproval?.requestId===p.requestId){State.pendingApproval=null;State.isPinned=false;island.dropPin();if(State.view==='approval')island.setView(p.requestId.startsWith('hook:')?'overview':'prompt')}showApproval();State.notify()});
  await onEvent<any>('question',()=>{State.isPinned=true;island.alert('prompt')});
  await onEvent<any>('chat-progress',p=>{State.updateTask('integration_codex',p.state);State.appendStep('integration_codex',p.label);island.ensureRunning()});
  await onEvent<any>('chat-plan',p=>{for(const step of p.plan||[])State.appendStep('integration_codex',step.status+' · '+step.step)});
  island.launch();

  // In a plain browser there is no wake strip behind the cursor: make the whole
  // page wake the island so the visuals can be checked with `npm run dev`.
  if (!IS_DESKTOP) {
    document.addEventListener("click", () => Sound.resume(), { once: true });
  }
}

void main();
