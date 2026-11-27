export const qualityModes=['auto','performance','quality'];
export const qualityNames={auto:'Otomatik',performance:'Akıcılık',quality:'Yüksek görüntü'};

// Measure complete frame intervals, including time spent waiting on the GPU.
// Change resolution only after sustained load, with a cooldown to avoid oscillation.
export class FrameBudget {
  constructor(mode='auto',dpr=1) {
    this.mode=qualityModes.includes(mode)?mode:'auto';
    this.dpr=Math.max(1,Math.min(2,dpr));
    this.level=this.mode==='performance'?0:this.mode==='quality'?2:1;
    this.frames=0;this.total=0;this.slow=0;this.fast=0;this.cooldown=0;this.fps=0;
  }
  get ratio(){return Math.min(this.dpr,[.85,1.15,1.5][this.level]);}
  sample(ms) {
    if(ms<=0||ms>250)return false;
    this.frames++;this.total+=ms;this.cooldown+=ms;
    if(this.total<1500)return false;
    const average=this.total/this.frames;
    this.fps=Math.round(1000/average);this.frames=0;this.total=0;
    if(this.mode!=='auto')return false;
    this.slow=average>25?this.slow+1:0;
    this.fast=average<18.5?this.fast+1:0;
    if(this.slow>=2&&this.level>0){this.level--;this.slow=0;this.fast=0;this.cooldown=0;return true;}
    if(this.fast>=5&&this.cooldown>12000&&this.level<2){this.level++;this.fast=0;this.cooldown=0;return true;}
    return false;
  }
}

// The same game time advances at 30, 60 or 120 Hz. A long stall never causes
// a burst of old inputs when the player returns to the tab.
export function fixedClock(step) {
  let remainder=0;
  return seconds=>{
    remainder+=Math.max(0,Math.min(.15,seconds));
    let steps=0;
    while(remainder+1e-9>=1/60&&steps<9){step(1/60);remainder-=1/60;steps++;}
    return steps;
  };
}
