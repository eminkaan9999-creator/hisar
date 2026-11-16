/* ÇELİK BÖRÜ arazi 1.0 — Güneydoğu sınır arazisi (Kilis–Azez, Akçakale–Tel Abyad hattı).
 * Zeytin ve fıstık bahçeleri: sıra sıra dikili, gri-yeşil yuvarlak taçlı alçak ağaçlar. Suriye tarafında köylerin çevresinde ve yol
 * boylarında, Türkiye tarafında sınıra yakın bahçeler. Kuru zemin, saman sarısı ot, karsız kahverengi ufuk ve düz damlı kerpiç evler
 * index.html ve realism.js içinde. Tank bahçeye girince ağaç devrilir (yerde kalır).
 * Çekirdek saf işlevlerdir ve Node ile sınanır.
 */
(function(root){'use strict';
const VERSION='1.0.0';
const doc=root.document;
const safe=(f,d)=>{try{return f();}catch(e){return d;}};
// ---------- çekirdek ----------
const GROVE=Object.freeze({row:6.5,col:6,w:7,d:6,jit:.8});
// Bahçe: merkez, yön ve boyuta göre sıra sıra ağaç noktaları
function grove(cx,cz,rot,cols,rows,o){o=o||GROVE;const c=Math.cos(rot),s=Math.sin(rot),out=[];for(let i=0;i<cols;i++)for(let j=0;j<rows;j++){const lx=(i-(cols-1)/2)*o.col,lz=(j-(rows-1)/2)*o.row;out.push({x:cx+lx*c+lz*s,z:cz-lx*s+lz*c});}return out;}
function hash(a,b){let h=Math.imul(a|0,374761393)+Math.imul(b|0,668265263)|0;h=Math.imul(h^h>>>13,1274126177);return ((h^h>>>16)>>>0)/4294967296;}
const core=Object.freeze({VERSION,GROVE,grove,hash});
if(typeof module==='object'&&module.exports)module.exports=core;
if(!doc)return;
const hooks={},stat={groves:0,trees:0,felled:0};let built=false,TR=null,CR=null,list=[];
const RV=x=>safe(()=>riv(x),120);
function free(x,z){if(Math.abs(x)>safe(()=>WS,800)-12||Math.abs(z)>safe(()=>WS,800)-12)return false;if(Math.abs(z-RV(x))<36)return false;if(safe(()=>hAt(x,z),0)<-.5)return false;if(safe(()=>roadNear(x,z,3),true))return false;
 if(safe(()=>BLD.some(b=>!b.dead&&Math.hypot(b.x-x,b.z-z)<b.r+4),false))return false;if(safe(()=>COV.some(c=>Math.hypot(c.x-x,c.z-z)<c.r+3),false))return false;return true;}
function build(){if(built||!root.THREE||typeof S==='undefined'||typeof BLD==='undefined')return;built=true;const T=root.THREE;const pts=[];let k=0;
 const seeds=[];safe(()=>VILS.forEach((v,i)=>{for(let n=0;n<(v[1]>RV(v[0])?4:2);n++)seeds.push({x:v[0],z:v[1],i:i*10+n});}),null);safe(()=>HAML.forEach((h,i)=>{if(h.sy)seeds.push({x:h.x,z:h.z,i:500+i});}),null);
 for(const sd of seeds){const a=hash(sd.i,7)*6.283,d=70+hash(sd.i,11)*70,cx=sd.x+Math.cos(a)*d,cz=sd.z+Math.sin(a)*d,rot=hash(sd.i,3)*1.2-.6,cols=5+Math.floor(hash(sd.i,5)*4),rows=4+Math.floor(hash(sd.i,9)*4);
  if(!(cz>RV(cx)-140))continue;let n0=0;for(const p of grove(cx,cz,rot,cols,rows)){const x=p.x+(hash(k,1)-.5)*GROVE.jit*2,z=p.z+(hash(k,2)-.5)*GROVE.jit*2;k++;if(!free(x,z))continue;pts.push({x,z,s:.8+hash(k,4)*.45,r:hash(k,6)*6.283,c:hash(k,8)});n0++;}if(n0>6)stat.groves++;}
 const n=pts.length,tg=new T.CylinderGeometry(.16,.26,1.5,6);tg.translate(0,.75,0);const cg=new T.IcosahedronGeometry(1.3,1);cg.scale(1.15,.72,1.15);cg.translate(0,2.2,0);
 TR=new T.InstancedMesh(tg,new T.MeshLambertMaterial({color:0x5a4a38}),n);CR=new T.InstancedMesh(cg,new T.MeshLambertMaterial({color:0xffffff}),n);CR.instanceColor=new T.InstancedBufferAttribute(new Float32Array(n*3),3);
 const o=new T.Object3D(),col=new T.Color();pts.forEach((p,i)=>{p.i=i;p.y=safe(()=>hAt(p.x,p.z),0);put(p,o,0);col.setHex(p.c<.55?0x7d8a5c:p.c<.85?0x6f7d50:0x8a8f62);CR.setColorAt(i,col);});
 for(const m of[TR,CR]){m.frustumCulled=false;m.castShadow=true;m.name='AR_ZEYTIN';m.instanceMatrix.needsUpdate=true;S.add(m);}CR.instanceColor.needsUpdate=true;list=pts;stat.trees=n;}
function put(p,o,tilt){o.position.set(p.x,p.y-.05,p.z);o.rotation.set(0,p.r,0);if(tilt){o.rotateOnWorldAxis(new root.THREE.Vector3(p.ax,0,p.az),tilt);}o.scale.set(p.s,p.s,p.s);o.updateMatrix();TR.setMatrixAt(p.i,o.matrix);CR.setMatrixAt(p.i,o.matrix);}
// tank bahçeye girerse ağacı devirir
const prev=new WeakMap();
function step(dt){if(!TR)return;const movers=[];safe(()=>{if(mode==='tank')movers.push(P);},null);for(const a of safe(()=>AL,[]))if(!a.dead)movers.push(a);let ch=false;const o=new root.THREE.Object3D();
 for(const m of movers){const q=prev.get(m);prev.set(m,[m.x,m.z]);if(!q)continue;const vx=(m.x-q[0])/Math.max(dt,1e-3),vz=(m.z-q[1])/Math.max(dt,1e-3),v=Math.hypot(vx,vz);if(v<1.2||v>40)continue;
  for(const p of list){if(p.t!=null)continue;if(Math.abs(p.x-m.x)>2.8||Math.abs(p.z-m.z)>2.8)continue;if(Math.hypot(p.x-m.x,p.z-m.z)>2.8)continue;p.t=0;p.ax=vz/v;p.az=-vx/v;stat.felled++;}}
 for(const p of list){if(p.t==null||p.t>1.2)continue;p.t+=dt;put(p,o,Math.min(1,(p.t/1.2)**2)*1.45);ch=true;}if(ch){TR.instanceMatrix.needsUpdate=true;CR.instanceMatrix.needsUpdate=true;}}
function reset(){if(!TR)return;const o=new root.THREE.Object3D();for(const p of list)if(p.t!=null){p.t=null;put(p,o,0);}TR.instanceMatrix.needsUpdate=true;CR.instanceMatrix.needsUpdate=true;}
function wrap(name,factory){if(hooks[name]||typeof root[name]!=='function')return;root[name]=factory(root[name]);hooks[name]=true;}
function connect(){build();wrap('update',old=>function(dt){const r=old.apply(this,arguments);if(safe(()=>game==='play',false))safe(()=>step(Math.min(.1,+dt||0)),null);return r;});
 wrap('startMission',old=>function(){safe(reset,null);return old.apply(this,arguments);});}
root.HisarArazi=Object.freeze({version:VERSION,core,connect,trees:()=>list.map(p=>({x:p.x,z:p.z,down:p.t!=null})),diagnostics:()=>({version:VERSION,built,hooks:{...hooks},...stat})});
connect();doc.addEventListener('hisar:ui-ready',connect);
})(typeof window!=='undefined'?window:globalThis);
