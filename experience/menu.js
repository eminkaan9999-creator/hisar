/* ÇELİK BÖRÜ karargâh menüsü 1.0 — menü hızlı ve sinematik.
 * - Menü açıkken arka plandaki 3B sahne saniyede 15 kare çizilir (oyunda tam hız). Dokunuşlar ve sekme geçişleri bekletilmez,
 *   telefon ısınmaz.
 * - Arka planda kamera tankı sabit, üç çeyrek önden gösterir (dönen kamera düşük kare hızında takılıyordu); kenarlarda karartma.
 * - Ağır dünya kurulumları (sınır, köy hayatı) menü göründükten sonra boş anlarda yapılır; açılış beklemez.
 * Çekirdek saf işlevlerdir ve Node ile sınanır.
 */
(function(root){'use strict';
const VERSION='1.1.0';
const doc=root.document;
const safe=(f,d)=>{try{return f();}catch(e){return d;}};
// ---------- çekirdek ----------
const MENU_FPS=15,ORBIT=Object.freeze({r:11.5,h:2.8,w:0,look:1.5});
// Kare kısıcı: menüde en az 1000/fps ms arayla çiz
const shouldDraw=(menu,now,last,fps)=>!menu||now-last>=1000/(fps||MENU_FPS)-1;
// Yörünge kamerası: tankın çevresinde t saniyede açı
function orbit(px,py,pz,t,o){o=o||ORBIT;const a=t*o.w+2.2;return {x:px+Math.sin(a)*o.r,y:py+o.h,z:pz+Math.cos(a)*o.r,lx:px,ly:py+o.look,lz:pz};}
const core=Object.freeze({VERSION,MENU_FPS,ORBIT,shouldDraw,orbit});
if(typeof module==='object'&&module.exports)module.exports=core;
if(!doc)return;
const hooks={},stat={drawn:0,skipped:0,orbit:0};let last=0,t0=performance.now();
function inMenu(){return safe(()=>game!=='play'&&doc.getElementById('menu').style.display!=='none',false);}
function wrapRender(){const renderer=safe(()=>R,null);if(hooks.render||!renderer||!renderer.render)return;const r0=renderer.render.bind(renderer);hooks.render=true;
 renderer.render=function(s,c){const now=performance.now(),m=inMenu();if(m&&root.HisarCommandMenu&&root.HisarCommandMenu.staticBackground){stat.skipped++;return;}if(!shouldDraw(m,now,last)){stat.skipped++;return;}last=now;stat.drawn++;return r0(s,c);};}
function wrap(name,factory){if(hooks[name]||typeof root[name]!=='function')return;root[name]=factory(root[name]);hooks[name]=true;}
function connect(){wrapRender();
 wrap('camUpdate',old=>function(){const r=old.apply(this,arguments);if(inMenu())safe(()=>{const t=(performance.now()-t0)/1000,y=hAt(P.x,P.z),o=orbit(P.x,y,P.z,t);const gy=hAt(o.x,o.z)+1.2;CAM.position.set(o.x,Math.max(o.y,gy),o.z);CAM.lookAt(o.lx,o.ly,o.lz);stat.orbit++;},null);return r;});
 if(!hooks.style&&doc.head){hooks.style=true;const st=doc.createElement('style');st.id='km-style';
  st.textContent=`#km-vin{position:fixed;inset:0;z-index:1;pointer-events:none;background:radial-gradient(120% 90% at 30% 45%,transparent 45%,rgba(0,0,0,.55) 100%),linear-gradient(180deg,rgba(0,0,0,.45),transparent 22%,transparent 70%,rgba(0,0,0,.55));opacity:0;transition:opacity .4s}
body:not(.inplay) #km-vin{opacity:1}`;doc.head.appendChild(st);const v=doc.createElement('div');v.id='km-vin';doc.body.appendChild(v);}}
root.HisarMenu=Object.freeze({version:VERSION,core,connect,diagnostics:()=>({version:VERSION,hooks:{...hooks},...stat,menu:inMenu()})});
connect();doc.addEventListener('hisar:ui-ready',connect);
})(typeof window!=='undefined'?window:globalThis);
