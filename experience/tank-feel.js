/* Bounded hull suspension and truthful hit feedback; weapon and drive rules stay native. */
(function(root){'use strict';
const VERSION='1.0.0',clamp=(v,a,b)=>Math.min(b,Math.max(a,v)),finite=(v,d=0)=>Number.isFinite(v)?v:d;
const SECTORS=['ÖN','SAĞ ÖN','SAĞ','SAĞ ARKA','ARKA','SOL ARKA','SOL','SOL ÖN'];
function resetMotion(s){Object.assign(s,{p:0,pv:0,r:0,rv:0,fw:0,acc:0,travel:0});return s;}
function advanceMotion(s,input,dt){dt=clamp(finite(dt),0,.15);if(!dt)return s;const speed=clamp(finite(input.speed),-25,25),turn=clamp(finite(input.turn),-3,3),rough=clamp(finite(input.rough),0,1)*(input.road?.18:1);
 for(const k of ['p','pv','r','rv','fw','acc','travel'])s[k]=finite(s[k]);const count=Math.max(1,Math.ceil(dt/.015)),h=dt/count;
 for(let i=0;i<count;i++){const acc=clamp((speed-s.fw)*8,-12,12);s.fw+=(speed-s.fw)*(1-Math.exp(-h*8));s.acc+=(acc-s.acc)*(1-Math.exp(-h*7));s.travel+=Math.abs(speed)*h;
  const moving=clamp(Math.abs(speed)/12,0,1),pitch=clamp(-s.acc*.0065+Math.sin(s.travel*2.4)*rough*moving*.012,-.065,.065),roll=clamp(-turn*speed*.003+Math.sin(s.travel*1.6)*rough*moving*.009,-.05,.05);
  s.pv+=(-70*(s.p-pitch)-13*s.pv)*h;s.p+=s.pv*h;s.rv+=(-65*(s.r-roll)-12*s.rv)*h;s.r+=s.rv*h;
  s.p=clamp(s.p,-.09,.09);s.r=clamp(s.r,-.065,.065);
 }return s;}
function impulse(s){s.pv=clamp(finite(s.pv)-.14,-.4,.4);}
function hitSector(p,source){if(!source||!Number.isFinite(source.x)||!Number.isFinite(source.z)||Math.hypot(source.x-p.x,source.z-p.z)<.2)return null;const angle=Math.atan2(source.x-p.x,source.z-p.z)-p.h;return (Math.round(angle/(Math.PI/4))%8+8)%8;}
function partsText(parts){if(!parts)return '';return [['trk','PALET'],['eng','MOTOR'],['tur','KULE']].filter(([k])=>Number.isFinite(parts[k])&&parts[k]<75).map(([k,n])=>n+' %'+Math.round(clamp(parts[k],0,100))).join(' · ');}
const core=Object.freeze({VERSION,SECTORS,resetMotion,advanceMotion,impulse,hitSector,partsText});if(typeof module==='object'&&module.exports)module.exports=core;
const doc=root.document;if(!doc)return;const safe=(f,d)=>{try{return f();}catch(e){return d;}};const hooks={};let installed=false,impact=null,condition=null,ttl=0,lastHit=null,frameTime=0;const stat={shots:0,hits:0};
function wrap(name,f){if(hooks[name]||typeof root[name]!=='function')return;root[name]=f(root[name]);hooks[name]=true;}
function clear(){ttl=0;lastHit=null;if(impact)impact.hidden=true;if(condition)condition.hidden=true;safe(()=>{resetMotion(SUSP);SUSP.lx=P.x;SUSP.lz=P.z;SUSP.lh=P.h;},null);}
function connect(){
 wrap('reset',old=>function(){const r=old.apply(this,arguments);clear();return r;});
 wrap('fire',old=>function(){const before=safe(()=>mode==='tank'&&game==='play'?TA[st]:null,null),r=old.apply(this,arguments);if(before!=null&&safe(()=>TA[st]<before,false)){safe(()=>impulse(SUSP),null);stat.shots++;}return r;});
 wrap('eshot',old=>function(e){const n=safe(()=>ebul.length,0),r=old.apply(this,arguments);safe(()=>{if(ebul.length>n&&Number.isFinite(e.x)&&Number.isFinite(e.z))ebul[ebul.length-1].hitSource={x:e.x,z:e.z};},null);return r;});
 wrap('hitP',old=>function(k,p,source){const before=safe(()=>P.hp,0),r=old.apply(this,arguments),lost=before-safe(()=>P.hp,before);if(lost>0){lastHit={damage:Math.round(lost),sector:safe(()=>hitSector(P,source||p),null)};ttl=3;stat.hits++;draw();}return r;});
}
function draw(){if(!impact||!condition)return;const active=safe(()=>game==='play'&&mode==='tank',false);impact.hidden=!active||ttl<=0||!lastHit;
 if(!impact.hidden){const s=lastHit.sector;impact.textContent=(s==null?'İSABET':SECTORS[s]+' · İSABET')+' −'+lastHit.damage+' ZIRH';impact.dataset.sector=s==null?'unknown':String(s);}
 const text=active?safe(()=>partsText(P.dz),''):'';condition.textContent=text;condition.hidden=!text;
}
function install(){connect();if(installed)return;const hud=doc.getElementById('sf-hud'),armour=hud&&hud.querySelector('.sf-armour');if(!hud||!armour)return;
 installed=true;impact=doc.createElement('output');impact.id='tf-impact';impact.hidden=true;impact.setAttribute('role','status');impact.setAttribute('aria-live','polite');hud.appendChild(impact);condition=doc.createElement('small');condition.id='tf-condition';condition.hidden=true;armour.appendChild(condition);
 safe(()=>root.HisarGameBridge.onFrame(dt=>{if(safe(()=>game==='play',false))ttl=Math.max(0,ttl-dt);frameTime+=dt;if(frameTime>=.1){frameTime=0;draw();}}),false);
}
root.HisarTankFeel=Object.freeze({version:VERSION,core,install,connect,clear,diagnostics:()=>({installed,...stat,hooks:{...hooks},impact:lastHit,remaining:ttl})});
if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',install);else install();doc.addEventListener('hisar:ui-ready',install);
})(typeof window!=='undefined'?window:globalThis);
