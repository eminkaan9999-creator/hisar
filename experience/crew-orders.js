/* HİSAR mürettebat emirleri 1.1 (araçlar iç içe geçmez): komutan ateş emri verir, nişancı "Hazır!" der ve atış o anda çıkar;
 * sürücü görünüşüne geçince sürücü, mühimmat değişince doldurucu sesli bildirir. Kurgusal oyun sesleridir.
 */
(function(root){
'use strict';
const AMMO=Object.freeze(['APDS','HEAT','duman','HEP']);
const SPOKEN=Object.freeze({APDS:'a pe de es',HEAT:'hit',duman:'duman',HEP:'hep'});
function ammoLine(i){const n=AMMO[i];return n?'Komutanım, '+n+' mühimmatı yüklendi.':'';}
function shouldDelay(s){return !!s&&s.playing&&s.tank&&!s.aa&&s.ready&&!s.pending;}
// Araçlar iç içe geçmesin: üst üste binen iki gövde merkez çizgisi boyunca ayrılır. Sabit olan (fixed) yerinden oynamaz.
function separate(bodies){let moved=0;for(let i=0;i<bodies.length;i++)for(let j=i+1;j<bodies.length;j++){const a=bodies[i],b=bodies[j];if(a.fixed&&b.fixed)continue;
  let dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz);const min=a.r+b.r;if(d>=min)continue;const push=min-d;if(d<1e-4){dx=1;dz=0;d=1;}
  const ux=dx/d,uz=dz/d,wa=a.fixed?0:b.fixed?1:(a.w||.5),wb=1-wa;a.x-=ux*push*wa;a.z-=uz*push*wa;b.x+=ux*push*wb;b.z+=uz*push*wb;moved++;}
 return moved;}
const core=Object.freeze({AMMO,ammoLine,shouldDelay,separate});
if(typeof module==='object'&&module.exports)module.exports=core;
const doc=root.document;if(!doc||root.HisarCrewOrders)return;
const safe=(fn,d)=>{try{return fn();}catch(e){return d;}};
let pending=false,installed=false,inner=null,lastAmmo=null,lastView=null,fired=0,blocked=0;
const voiceOn=()=>safe(()=>SV.voice!==0,true)&&!!root.speechSynthesis&&typeof root.SpeechSynthesisUtterance==='function';
// Bir cümleyi söyler; bitince (ya da en geç maxMs sonra) cb çalışır. Ses kapalıysa kısa bir bekleme yeter.
function sayThen(text,cb,maxMs){let done=false;const fin=()=>{if(done)return;done=true;cb();};
 if(!voiceOn()){root.setTimeout(fin,220);return;}
 safe(()=>{const u=new root.SpeechSynthesisUtterance(text.replace(/\b(APDS|HEAT|HEP)\b/g,m=>SPOKEN[m]));u.lang='tr-TR';u.rate=1.25;u.pitch=.9;u.onend=fin;u.onerror=fin;root.speechSynthesis.cancel();root.speechSynthesis.speak(u);},null);
 root.setTimeout(fin,maxMs);}
function state(){return safe(()=>({playing:game==='play',tank:mode==='tank',aa:!!(root.AA&&AA.on),ready:cd<=0&&(typeof TA==='undefined'||typeof st!=='number'||TA[st]>0),pending}),null);}
function install(){if(installed||typeof root.fire!=='function')return;installed=true;inner=root.fire;
 root.fire=function(){const self=this,args=arguments;
  if(!shouldDelay(state())){if(pending&&safe(()=>mode==='tank',false)){blocked++;return;}return inner.apply(self,args);}
  pending=true;
  // Komutan emri verir, nişancı "Hazır!" der; atış "Hazır"ın bittiği anda çıkar.
  sayThen('Nişancı, ateş!',()=>sayThen('Hazır!',()=>{pending=false;if(safe(()=>game==='play'&&mode==='tank',false)){fired++;inner.apply(self,args);}},650),1000);
 };}
function crewSay(text,key){safe(()=>root.CREW.say(text,1.5,key,1.5),null);}
function frame(){const s=safe(()=>({playing:game==='play',tank:mode==='tank',view:iv,ammo:typeof st==='number'?st:null}),null);
 if(!s||!s.playing){lastAmmo=null;lastView=null;if(s&&!s.playing)pending=false;return;}
 if(s.tank){if(lastView!==null&&s.view===3&&lastView!==3)crewSay('Sürücü sistemi açılıyor.','drv');lastView=s.view;
  if(s.ammo!==null){if(lastAmmo!==null&&s.ammo!==lastAmmo){const line=ammoLine(s.ammo);if(line)crewSay(line,'ld'+s.ammo);}lastAmmo=s.ammo;}}
}
const MOVING=new Set(['tank','apc','truck']),SOLID=new Set(['tank','apc','truck','aa','arty','bunker']);let pushes=0;
function collide(){safe(()=>{if(game!=='play')return;const list=[],refs=[];
  const add=(o,r,fixed,w)=>{list.push({x:o.x,z:o.z,r,fixed,w});refs.push(o);};
  add(P,3.7,false,.25);for(const a of AL)if(!a.dead)add(a,3.7,false,.75);for(const e of E)if(SOLID.has(e.type))add(e,3.5,!MOVING.has(e.type),.75);
  for(let pass=0;pass<2;pass++)if(!separate(list))break;
  for(let i=0;i<list.length;i++){const o=refs[i],n=list[i];if(o.x===n.x&&o.z===n.z)continue;pushes++;o.x=n.x;o.z=n.z;if(o.g&&o.g.position){o.g.position.x=n.x;o.g.position.z=n.z;}}
 },null);}
function boot(){install();if(Array.isArray(safe(()=>FRAME_HOOKS,null))&&!boot.done){boot.done=true;FRAME_HOOKS.push(frame);}}
// Çarpışma ayrımı her oyun adımından sonra çalışır (dokunuş beklemez).
safe(()=>{const up=root.update;if(typeof up==='function'&&!up.hisarCollide){const w=function(){const r=up.apply(this,arguments);collide();return r;};w.hisarCollide=true;root.update=w;}},null);
// Diğer modüller ateşi sardıktan sonra en dışa yerleşmek için ilk dokunuşta ya da tuşta kurulur.
root.addEventListener('pointerdown',boot,{capture:true,once:true});root.addEventListener('keydown',boot,{capture:true,once:true});
root.HisarCrewOrders=Object.freeze({core,diagnostics:()=>({installed,pending,fired,blocked,lastAmmo,lastView,pushes})});
})(typeof window!=='undefined'?window:globalThis);
