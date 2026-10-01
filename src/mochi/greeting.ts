import { BotEngine } from './engine';
import { Sound } from '../core/sound';
export const GREETING_END=2.8;
export class Greeting {
 onComplete:(()=>void)|null=null; private time=0;private fired=false;private timer:number|undefined;private bot=new BotEngine();
 get elapsed(){return (performance.now()-this.time)/1000} get done(){return this.fired}
 start(){clearTimeout(this.timer);this.time=performance.now();this.fired=false;Sound.play('greet');this.timer=window.setTimeout(()=>{this.fired=true;this.onComplete?.()},GREETING_END*1000)}
 hover(){} interrupt(){clearTimeout(this.timer);this.fired=true}
 draw(ctx:CanvasRenderingContext2D){ctx.clearRect(0,0,640,150);ctx.save();ctx.globalAlpha=Math.min(1,this.elapsed*3);ctx.translate(225,35);this.bot.update(1/60);this.bot.draw(ctx,100,100);ctx.restore();ctx.fillStyle='#eef7ff';ctx.font='600 18px system-ui';ctx.fillText('Orbit',337,82);ctx.fillStyle='#929cae';ctx.font='12px system-ui';ctx.fillText('Seu Codex, por perto.',337,104)}
}
