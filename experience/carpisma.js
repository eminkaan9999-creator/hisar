/* ÇELİK BÖRÜ çarpışma 1.1 — tank dünyaya iz bırakır.
 * - Ağaç: tank (oyuncu, dost ya da düşman) gövdesine çarpınca ağaç gidiş yönüne devrilir, yerde kalır; tank biraz yavaşlar.
 * - Mevzi: toprak setin üstünden geçen tank seti ezer; set alçalır, siper korumasını yitirir (experience/field.js crush).
 * - Araç: hızla çarpılan kamyon, yakıt tankeri ve radar ezilir.
 * - Düşman piyadesi: hareket eden tankın (oyuncu ya da dost) gövdesinin altında kalan ezilir. Dost askerler tanka yol verir (sinir.js).
 * - Su: suya giren tank önünden ve yanlarından su sıçratır.
 * Yeni savaşta ağaçlar kalkar, setler yeniden kazılır. Çekirdek saf işlevlerdir ve Node ile sınanır.
 */
(function(root){'use strict';
const VERSION='1.2.0';
const doc=root.document;
const safe=(f,d)=>{try{return f();}catch(e){return d;}};
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
// ---------- çekirdek ----------
const TREE=Object.freeze({hit:2.9,min:1.5,fall:1.3,slow:.72});
// Devrilme açısı: önce yavaş, sonra hızlanarak 88°'ye (yerçekimi gibi)
const fallAngle=t=>Math.min(1,t/TREE.fall)**2*1.53;
// Devrilme ekseni: gidiş yönüne dik yatay eksen
function fallAxis(vx,vz){const l=Math.hypot(vx,vz)||1;return {x:vz/l,z:-vx/l};}
// Ezme alanı: tankın gövdesi (ekseni boyunca yarı boy len, yanlara yarı en half); min bu hızdan yavaş giden tank ezmez (m/sn), öyle bir tankın
// gövdesinin içinde kalan düşman eri yana, gövdenin clear kadar dışına çıkar (kimse tankın içinde durmaz)
const RUN=Object.freeze({len:3.8,half:1.9,min:.8,clear:.2});
// Nokta (dx,dz tanka göre) ekseni (vx,vz) yönünde olan tankın gövdesinin altında mı
function under(dx,dz,vx,vz){const v=Math.hypot(vx,vz);if(!(v>0))return false;return Math.abs(dx*vx+dz*vz)/v<RUN.len&&Math.abs(dx*vz-dz*vx)/v<RUN.half;}
// Gövdenin altındaki noktanın (dx,dz) bulunduğu yana, gövdenin dışına çıkması için gereken yer değiştirme (ux,uz gövde ekseni, birim)
function sideOut(dx,dz,ux,uz){const l=dx*uz-dz*ux,k=(l>=0?1:-1)*(RUN.half+RUN.clear-Math.abs(l));return {x:uz*k,z:-ux*k};}
const core=Object.freeze({VERSION,TREE,RUN,fallAngle,fallAxis,under,sideOut});
if(typeof module==='object'&&module.exports)module.exports=core;
if(!doc)return;
// ---------- oyun ----------
const hooks={},stat={trees:0,felled:0,crushed:0,flattened:0,splash:0,runOver:0,pushedOut:0};let trees=null;const prev=new WeakMap();
function findTrees(){if(trees||typeof S==='undefined')return;trees=[];for(const o of S.children){if(!o.isGroup||!o.children.length)continue;const c=o.children[0];
  if(c&&c.geometry&&c.geometry.type==='CylinderGeometry'&&o.children.length>=3&&o.children.length<=6)trees.push({g:o,x:o.position.x,z:o.position.z,q0:o.quaternion.clone(),t:-1,ax:null});}stat.trees=trees.length;}
function movers(){const out=[];safe(()=>{if(mode==='tank')out.push(P);},null);for(const a of safe(()=>AL,[]))if(!a.dead)out.push(a);for(const e of safe(()=>E,[]))if(e.type==='tank'||e.type==='apc'||e.type==='truck')out.push(e);return out;}
// Düşman piyadesi (yalnız oyuncunun ve dost tankların altında): hareket eden tankın gövdesi altında kalan ezilir (patlama olmaz: toz kalkar, tok bir
// ses gelir); duran ya da çok ağır giden tankın gövdesinin içinde de kimse duramaz, yana çıkar. Alan gövdenin eksenindedir (yana kayan tankta da).
function infantry(o,vx,vz,v){const hk=typeof o.h==='number',ax=hk?Math.sin(o.h):vx,az=hk?Math.cos(o.h):vz,al=Math.hypot(ax,az);if(!(al>0))return;const ux=ax/al,uz=az/al;
 for(const e of safe(()=>E.slice(),[])){/* makineli tüfek yuvasındaki er de ezilir (yuva yerinden oynamaz: duran tank onu itmez) */if(e.type!=='inf'&&e.type!=='mgn')continue;const dx=e.x-o.x,dz=e.z-o.z;if(Math.abs(dx)>6||Math.abs(dz)>6||!under(dx,dz,ux,uz))continue;
  if(v>RUN.min){const bb=root.bigBoom;root.bigBoom=function(){};try{root.killE(e);}catch(err){}finally{root.bigBoom=bb;}stat.runOver++;
   safe(()=>{const y=hAt(e.x,e.z);for(let i=0;i<4;i++)root.FXP.puff(e.x+(Math.random()-.5)*1.6,y+.3,e.z+(Math.random()-.5)*1.6,(Math.random()-.5)*2,1.2+Math.random(),(Math.random()-.5)*2,1,.6,2.2,0xb9a57e,0x8c7a58,.5,1.2);if(o===P)root.thump(110,45,.22,.3);},null);}
  else if(e.type==='inf'){const q=sideOut(dx,dz,ux,uz);e.x+=q.x;e.z+=q.z;safe(()=>{e.g.position.x=e.x;e.g.position.z=e.z;},null);stat.pushedOut++;}}}
function step(dt){findTrees();if(!trees)return;const T=root.THREE;
 for(const o of movers()){const p=prev.get(o);prev.set(o,[o.x,o.z]);if(!p)continue;const vx=(o.x-p[0])/Math.max(dt,1e-3),vz=(o.z-p[1])/Math.max(dt,1e-3),v=Math.hypot(vx,vz);if((o===P||!o.type)&&v<=40)infantry(o,vx,vz,v);if(v<TREE.min||v>40)continue;
  for(const t of trees){if(t.t>=0)continue;if(Math.abs(t.x-o.x)>TREE.hit||Math.abs(t.z-o.z)>TREE.hit)continue;if(Math.hypot(t.x-o.x,t.z-o.z)>TREE.hit)continue;
   t.t=0;t.ax=fallAxis(vx,vz);stat.felled++;if(o===P){safe(()=>{P.v*=TREE.slow;shake=Math.max(shake,.22);},null);safe(()=>root.thump(160,60,.25,.35),null);}}
  // mevzi seti
  const push=o===P?Math.abs(safe(()=>P.v,0)||0):v;// oyuncu sete dayanınca yer değiştirmez; itme gücü motor hızıdır
  if(push>2.2)stat.flattened+=safe(()=>root.HisarField.crush(o.x,o.z,3.2),0)||0;
  // araç ezme (yalnız oyuncu ve dost tank)
  if((o===P||!o.type)&&v>4){for(const e of safe(()=>E.slice(),[])){if(e.type!=='truck'&&e.type!=='fuel'&&e.type!=='radar')continue;if(Math.hypot(e.x-o.x,e.z-o.z)<4.2){safe(()=>root.killE(e),null);stat.crushed++;}}}
  // su sıçraması
  if(o===P&&v>2&&safe(()=>hAt(o.x,o.z)<-1.2,false)){const fx=root.FXP;if(fx&&fx.puff&&Math.random()<dt*14){stat.splash++;const s=Math.sin(o.h||0),c=Math.cos(o.h||0);for(const side of[-1,1])fx.puff(o.x+s*3+c*side*1.6,safe(()=>hAt(o.x,o.z),0)+.6,o.z+c*3-s*side*1.6,c*side*2.5+s*v*.3,2.2+Math.random(),-s*side*2.5+c*v*.3,1.1,.6,2.6,0xffffff,0xcfe0ea,.55,1.4);}}}
 for(const t of trees){if(t.t<0||t.t>TREE.fall+.01)continue;t.t+=dt;const a=fallAngle(t.t);const q=new T.Quaternion().setFromAxisAngle(new T.Vector3(t.ax.x,0,t.ax.z),a);t.g.quaternion.copy(q).multiply(t.q0);}}
function reset(){if(!trees)return;for(const t of trees){t.t=-1;t.g.quaternion.copy(t.q0);}safe(()=>root.HisarField.uncrush(),null);}
function wrap(name,factory){if(hooks[name]||typeof root[name]!=='function')return;root[name]=factory(root[name]);hooks[name]=true;}
function connect(){wrap('update',old=>function(dt){const r=old.apply(this,arguments);if(safe(()=>game==='play',false))safe(()=>step(clamp(+dt||0,0,.1)),null);return r;});
 wrap('startMission',old=>function(){reset();return old.apply(this,arguments);});}
root.HisarCarpisma=Object.freeze({version:VERSION,core,connect,trees:()=>{findTrees();return (trees||[]).map(t=>({x:t.x,z:t.z,down:t.t>=0}));},diagnostics:()=>({version:VERSION,hooks:{...hooks},...stat})});
connect();doc.addEventListener('hisar:ui-ready',connect);
})(typeof window!=='undefined'?window:globalThis);
