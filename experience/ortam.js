/* ÇELİK BÖRÜ ortam 1.0 — sınır hattının ses manzarası.
 * Uzaktan gelen topçu gümbürtüsü ve kısa makineli tüfek taramaları güneyden (Suriye tarafından) duyulur; sınırı geçince sıklaşır ve
 * yaklaşır. Gece cırcır böcekleri öter. Sesler oyunun ana ses yolundan (MG) geçer, menüde susar. Kayıtlı ses dosyası kullanılmaz.
 * Çekirdek saf işlevlerdir ve Node ile sınanır.
 */
(function(root){'use strict';
const VERSION='1.0.0';
const doc=root.document;
const safe=(f,d)=>{try{return f();}catch(e){return d;}};
// ---------- çekirdek ----------
// Bir sonraki uzak gümbürtüye kadar geçecek süre (sn): Suriye tarafında daha sık
function nextGap(south,r){return south?7+r*12:14+r*22;}
// Uzaklık hissi: Türkiye tarafında daha kısık ve boğuk
function rumble(south,r){return {vol:(south?.2:.11)*(.7+r*.6),cut:south?240:150,dur:1.4+r*1.2};}
// Makineli tüfek taraması: atım sayısı ve aralığı
function burst(r){const n=4+Math.floor(r*6);return Array.from({length:n},(_,i)=>i*(.085+r*.03));}
const core=Object.freeze({VERSION,nextGap,rumble,burst});
if(typeof module==='object'&&module.exports)module.exports=core;
if(!doc)return;
const hooks={},stat={rumbles:0,bursts:0,crickets:false};let T=6,CK=null;
const RV=x=>safe(()=>riv(x),120);
const ready=()=>safe(()=>AC&&AC.state==='running'&&typeof MG!=='undefined',false);
const south=()=>safe(()=>P.z>RV(P.x)-26,false);
function far(){const s=south(),r=Math.random(),q=rumble(s,r);
 safe(()=>{thump(52+r*14,20,q.dur,q.vol,0);nz(q.dur+.8,q.cut,q.vol*.7,'lowpass',.03);},null);stat.rumbles++;
 if(Math.random()<(s?.45:.25)){const v=s?.05:.025,dl=.6+Math.random()*1.5;for(const t of burst(Math.random()))safe(()=>nz(.05,1100,v,'bandpass',dl+t),null);stat.bursts++;}}
// cırcır böceği: yüksek perdeli, titreşimli, çok kısık
function crickets(on){if(on===!!CK)return;if(!on){safe(()=>{CK.g.gain.setTargetAtTime(0,AC.currentTime,.4);const c=CK;setTimeout(()=>safe(()=>{c.o.stop();c.l.stop();},null),1500);},null);CK=null;stat.crickets=false;return;}
 safe(()=>{const o=AC.createOscillator(),l=AC.createOscillator(),lg=AC.createGain(),am=AC.createGain(),g=AC.createGain();o.type='sine';o.frequency.value=4300;l.type='square';l.frequency.value=17;lg.gain.value=.5;am.gain.value=.5;
  l.connect(lg);lg.connect(am.gain);g.gain.value=0;o.connect(am);am.connect(g);g.connect(MG);o.start();l.start();g.gain.setTargetAtTime(.012,AC.currentTime,1.2);CK={o,l,g};stat.crickets=true;},null);}
function step(dt){if(!ready())return;T-=dt;if(T<=0){far();T=nextGap(south(),Math.random());}crickets(safe(()=>wx==='gece',false));}
function quiet(){crickets(false);T=6;}
function wrap(name,factory){if(hooks[name]||typeof root[name]!=='function')return;root[name]=factory(root[name]);hooks[name]=true;}
function connect(){wrap('update',old=>function(dt){const r=old.apply(this,arguments);if(safe(()=>game==='play',false))safe(()=>step(Math.min(.1,+dt||0)),null);else if(CK)quiet();return r;});
 wrap('openMenu',old=>function(){quiet();return old.apply(this,arguments);});}
root.HisarOrtam=Object.freeze({version:VERSION,core,connect,diagnostics:()=>({version:VERSION,hooks:{...hooks},...stat,next:T})});
connect();doc.addEventListener('hisar:ui-ready',connect);
})(typeof window!=='undefined'?window:globalThis);
