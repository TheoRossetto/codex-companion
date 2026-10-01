// Original synthesized cues; no Coucou audio assets are used.
export const SOUND_NAMES=['peek','open','close','hover','blip','slap','annoyed','dizzy','greet','work','finish','error','approval','question','approve','gulp','tick','send','love','pop','proud','wink','yawn','attach','think','search','rate','sleep'] as const;
export type SoundName=(typeof SOUND_NAMES)[number];
class SoundEngine {enabled=true;volume=.12;private ctx:AudioContext|null=null;private idleTimer:number|undefined;
 async preload(){this.ctx??=new AudioContext()}
 resume(){clearTimeout(this.idleTimer);void this.ctx?.resume()}
 idle(){this.idleTimer=window.setTimeout(()=>void this.ctx?.suspend(),1500)}
 setVolume(v:number){this.volume=Math.max(0,Math.min(.2,v))}setEnabled(v:boolean){this.enabled=v}
 play(name:SoundName|string){if(!this.enabled||!this.ctx)return;this.resume();const c=this.ctx;const i=Math.max(0,SOUND_NAMES.indexOf(name as SoundName));const base=220*Math.pow(2,(i%12)/12);const count=['greet','finish','approval','error'].includes(name)?3:1;for(let n=0;n<count;n++){const osc=c.createOscillator(),gain=c.createGain(),t=c.currentTime+n*.075;osc.type='sine';osc.frequency.setValueAtTime(base*(1+n*.25),t);osc.frequency.exponentialRampToValueAtTime(base*(name==='error'?.65:1.15),t+.10);gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(this.volume*.22,t+.012);gain.gain.exponentialRampToValueAtTime(.0001,t+.16);osc.connect(gain);gain.connect(c.destination);osc.start(t);osc.stop(t+.18)}}
}export const Sound=new SoundEngine();
