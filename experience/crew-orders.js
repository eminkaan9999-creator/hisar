/* HİSAR mürettebat emirleri 1.3: komutan ateş emri verir, nişancı "Hazır!" der ve atış o anda çıkar;
 * sürücü görünüşüne geçince sürücü, mühimmat değişince doldurucu sesli bildirir. Kurgusal oyun sesleridir.
 * (Araç çarpışmaları, mermi isabetleri ve tank mevzileri experience/field.js içindedir.)
 */
(function(root){
'use strict';
const AMMO=Object.freeze(['APDS','HEAT','duman','HEP']);
const SPOKEN=Object.freeze({APDS:'a pe de es',HEAT:'hit',duman:'duman',HEP:'hep'});
function ammoLine(i){const n=AMMO[i];return n?'Komutanım, '+n+' mühimmatı yüklendi.':'';}
function shouldDelay(s){return !!s&&s.playing&&s.tank&&!s.aa&&s.ready&&!s.pending;}
const core=Object.freeze({AMMO,ammoLine,shouldDelay});
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
function boot(){install();if(Array.isArray(safe(()=>FRAME_HOOKS,null))&&!boot.done){boot.done=true;FRAME_HOOKS.push(frame);}}
// Diğer modüller ateşi sardıktan sonra en dışa yerleşmek için ilk dokunuşta ya da tuşta kurulur.
root.addEventListener('pointerdown',boot,{capture:true,once:true});root.addEventListener('keydown',boot,{capture:true,once:true});
root.HisarCrewOrders=Object.freeze({core,diagnostics:()=>({installed,pending,fired,blocked,lastAmmo,lastView})});
})(typeof window!=='undefined'?window:globalThis);
