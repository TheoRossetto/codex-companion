// Orbit's original satellite artwork. No upstream character geometry or animation.
import { Sound } from '../core/sound';
import type { BotStateName, BotEmoteName } from '../core/layout';
export type RGB = readonly [number,number,number];
export type EyeShape = 'pill'|'wide'|'dot'|'line'|'flat'|'happy'|'closed'|'spiral'|'heart'|'star'|'tired'|'wink'|'cup';
export function hexToRGB(hex:string):RGB { const n=parseInt(hex.replace('#',''),16); return [(n>>16&255)/255,(n>>8&255)/255,(n&255)/255]; }
const colors:Record<BotStateName,string>={idle:'#87d8ea',working:'#67b7ff',thinking:'#b399ff',searching:'#80caff',approval:'#ffc775',question:'#85ebe3',error:'#ff8896',finished:'#86e0bd',ratelimit:'#fbb879',sleeping:'#718da7',dizzy:'#e49ad7'};
export class BotEngine {
  isMini=false; bodyColor:RGB|null=null; particleOverhang=0; lookX=0; lookY=0; morph=0; slotHTarget=0; slotH=0; slotHVel=0; tgEs=1;
  permanentEye:EyeShape|null=null; eyeOverride:EyeShape|null=null; eyeOverrideUntil=0; onDizzy:(()=>void)|null=null;
  private state:BotStateName='idle'; private t=0; private pulse=0; private clicks:number[]=[]; private emote:BotEmoteName|null=null; private emoteUntil=0;
  get busy(){return !this.isMini && (this.state!=='idle'||this.pulse>0.01||this.emote!==null)}
  setState(s:BotStateName,_immediate=false){if(s===this.state)return;this.state=s;this.pulse=1;if(!this.isMini)Sound.play(({working:'work',thinking:'think',searching:'search',finished:'finish',ratelimit:'rate',sleeping:'sleep'} as Record<string,string>)[s]||s)}
  setPermanentEmote(e:BotEmoteName){this.emote=e;this.emoteUntil=Infinity}
  triggerEmote(e:BotEmoteName){this.emote=e;this.emoteUntil=performance.now()+1700;this.pulse=1;Sound.play(e)}
  blink(){this.pulse=.7}
  slap(){const now=performance.now();this.clicks=this.clicks.filter(t=>now-t<1200);this.clicks.push(now);this.triggerEmote('annoyed');if(this.clicks.length>=3){this.clicks=[];this.onDizzy?.()}}
  gulp(){this.pulse=1;Sound.play('attach')}
  resetMorph(){this.morph=0}
  animateMorph(n:number){this.morph=n;this.pulse=1}
  update(dt:number){this.t+=dt;this.pulse*=Math.exp(-dt*5);if(performance.now()>this.emoteUntil)this.emote=null}
  draw(ctx:CanvasRenderingContext2D,w:number,h:number){
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    const r=Math.min(w,h-this.particleOverhang*2)*.235;
    if(r<=0)return;
    ctx.save();ctx.translate(w/2,h/2);ctx.rotate(reduced?0:Math.sin(this.t*1.6)*.035+this.lookX*.045);
    const c=this.bodyColor?'rgb('+this.bodyColor.map(v=>Math.round(v*255)).join(',')+')':colors[this.state];
    ctx.strokeStyle=c;ctx.fillStyle='#1e3147';ctx.lineWidth=Math.max(1,r*.09);
    for(const side of [-1,1]){ctx.beginPath();ctx.roundRect(side<0?-r*1.82:r*.85,-r*.43,r*.96,r*.86,r*.12);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(side*r*1.35,-r*.36);ctx.lineTo(side*r*1.35,r*.36);ctx.stroke()}
    const grad=ctx.createLinearGradient(-r,-r,r,r);grad.addColorStop(0,c);grad.addColorStop(1,'#3d637b');
    ctx.fillStyle=grad;ctx.beginPath();ctx.arc(0,0,r*(1+this.pulse*.045),0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='rgba(215,245,255,.6)';ctx.lineWidth=Math.max(1,r*.045);ctx.stroke();
    ctx.fillStyle='#0a1928';ctx.beginPath();ctx.roundRect(-r*.65,-r*.35,r*1.3,r*.65,r*.26);ctx.fill();
    ctx.fillStyle='#d8ffff';ctx.strokeStyle='#d8ffff';ctx.lineWidth=Math.max(1,r*.07);
    const closed=this.state==='sleeping'; const happy=this.state==='finished'||this.emote==='happy'||this.emote==='love';
    for(const side of [-1,1]){const x=side*r*.28+this.lookX*r*.09,y=this.lookY*r*.07-r*.03;ctx.beginPath();if(closed){ctx.moveTo(x-r*.11,y);ctx.lineTo(x+r*.11,y);ctx.stroke()}else if(happy){ctx.arc(x,y+r*.04,r*.12,Math.PI,Math.PI*2);ctx.stroke()}else{ctx.arc(x,y,r*(this.state==='approval'?.115:.085),0,Math.PI*2);ctx.fill()}}
    ctx.strokeStyle=c;ctx.beginPath();ctx.moveTo(0,-r);ctx.lineTo(0,-r*1.32);ctx.stroke();ctx.fillStyle=c;ctx.beginPath();ctx.arc(0,-r*1.4,r*.09,0,Math.PI*2);ctx.fill();
    if(!this.isMini && this.state!=='idle'){ctx.strokeStyle=c;ctx.globalAlpha=.55;ctx.lineWidth=Math.max(1,r*.055);ctx.beginPath();const a=reduced?0:this.t;ctx.ellipse(0,0,r*2.12,r*1.2,-.3,a,a+Math.PI*.8);ctx.stroke()}
    if(this.emote==='love'||this.emote==='proud'){ctx.globalAlpha=1;ctx.fillStyle=c;ctx.font=Math.round(r*.55)+'px system-ui';ctx.fillText(this.emote==='love'?'♥':'✦',r,-r)}
    ctx.restore();
  }
}
