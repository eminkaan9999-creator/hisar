/* ÇELİK BÖRÜ arazi 1.2 — Güneydoğu sınır arazisi (Kilis–Azez, Akçakale–Tel Abyad hattı).
 * Bahçe ağaçları kullanıcının gönderdiği 3B zeytin ağacı modeliyle çizilir (setModel): en yakınlar ayrıntılı örgüyle, sonrakiler hafif örgüyle,
 * uzaktakiler modelin resmini taşıyan çapraz kartla. Model gelmezse hepsi yalın gövde ve taçla kalır.
 * Zeytin ve fıstık bahçeleri: sıra sıra dikili, gri-yeşil yuvarlak taçlı alçak ağaçlar. Suriye tarafında köylerin çevresinde ve yol
 * boylarında, Türkiye tarafında sınıra yakın bahçeler. Kuru zemin, saman sarısı ot, karsız kahverengi ufuk ve düz damlı kerpiç evler
 * index.html ve realism.js içinde. Tank bahçeye girince ağaç devrilir (yerde kalır).
 * Çekirdek saf işlevlerdir ve Node ile sınanır.
 */
(function(root){'use strict';
const VERSION='1.2.0';
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
const hooks={},stat={groves:0,trees:0,felled:0,rocks:0,hay:0,hi:0,mid:0,far:0,cleared:0};let built=false,TR=null,CR=null,list=[];
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
 for(const m of[TR,CR]){m.frustumCulled=false;m.castShadow=true;m.name='AR_ZEYTIN';m.instanceMatrix.needsUpdate=true;S.add(m);}CR.instanceColor.needsUpdate=true;list=pts;stat.trees=n;rocks(T);hay(T);}
// Kireç taşı kayalar: Türkiye tarafında tarla kenarlarında ve yamaçlarda krem-gri, Suriye tarafında daha koyu ve seyrek; yarı gömülü
function rocks(T){const ws=Math.min(800,safe(()=>WS,800))-20,pts=[];for(let i=0;pts.length<520&&i<6000;i++){const x=(hash(i,21)*2-1)*ws,z=(hash(i,22)*2-1)*ws;const sy=z>RV(x)+40;if(sy&&hash(i,23)<.6)continue;if(Math.abs(z-RV(x)+26)<22||!free(x,z))continue;if(safe(()=>root.HisarSinir.posts().some(q=>Math.hypot(q.x-x,q.z-z)<35),false))continue;
  pts.push({x,z,sy,s:.6+hash(i,24)*1.6,h:.35+hash(i,25)*.45,r:hash(i,26)*6.283,t:hash(i,27)});}
 const g=new T.IcosahedronGeometry(1,0),m=new T.InstancedMesh(g,new T.MeshLambertMaterial({color:0xffffff,flatShading:true}),pts.length),o=new T.Object3D(),c=new T.Color();m.instanceColor=new T.InstancedBufferAttribute(new Float32Array(pts.length*3),3);
 pts.forEach((p,i)=>{o.position.set(p.x,safe(()=>hAt(p.x,p.z),0)-p.s*.25,p.z);o.rotation.set(p.t*.6,p.r,p.t*.4);o.scale.set(p.s*(1+p.t*.6),p.s*p.h,p.s);o.updateMatrix();m.setMatrixAt(i,o.matrix);
  c.setHex(p.sy?(p.t<.5?0x9a9080:0x847a6a):(p.t<.33?0xd9d0bc:p.t<.66?0xc8bfa9:0xb5ad99));m.setColorAt(i,c);});
 m.castShadow=true;m.receiveShadow=true;m.frustumCulled=false;m.name='AR_KAYA';S.add(m);stat.rocks=pts.length;ROCK={m,pts};}
// Saman yığınları (Türkiye köyleri): ahırların yanında kubbe biçimli, üstü kararmış saman; balya istifi
function hay(T){const pts=[];for(const b of safe(()=>BLD,[])){if(b.dead||b.kind!=='barn'||b.z>RV(b.x)-40)continue;const n=1+Math.floor(hash(b.x|0,b.z|0)*3);
  for(let k=0;k<n;k++){const a=(b.rot||0)+1.2+k*.9,d=(b.r||5)+4+k*2.5,x=b.x+Math.sin(a)*d,z=b.z+Math.cos(a)*d;if(free(x,z))pts.push({x,z,s:1.5+hash(k,b.x|0)*.9});}}
 if(!pts.length)return;const g=new T.SphereGeometry(1,12,8,0,Math.PI*2,0,Math.PI/2),m=new T.InstancedMesh(g,new T.MeshLambertMaterial({color:0xc9a95a}),pts.length),o=new T.Object3D();
 pts.forEach((p,i)=>{o.position.set(p.x,safe(()=>hAt(p.x,p.z),0)-.1,p.z);o.rotation.set(0,hash(i,31)*6.28,0);o.scale.set(p.s*1.3,p.s*1.6,p.s*1.3);o.updateMatrix();m.setMatrixAt(i,o.matrix);});
 m.castShadow=true;m.receiveShadow=true;m.frustumCulled=false;m.name='AR_SAMAN';S.add(m);stat.hay=pts.length;}
function put(p,o,tilt){o.position.set(p.x,p.y-.05,p.z);o.rotation.set(0,p.r,0);if(tilt){o.rotateOnWorldAxis(new root.THREE.Vector3(p.ax,0,p.az),tilt);}o.scale.set(p.s,p.s,p.s);o.updateMatrix();(p.M||(p.M=new root.THREE.Matrix4())).copy(o.matrix);write(p);}
// ---------- gönderilen 3B zeytin ağacı: üç ayrıntı düzeyi ----------
const KS=.71;let OL=null,ZERO=null,ROCK=null,lcx=1e9,lcz=1e9;
// Eski yalın gövde ve taç: yalnız model gelmediğinde çizilir
function write(p){if(OL)return;ZERO=ZERO||new root.THREE.Matrix4().makeScale(0,0,0);TR.setMatrixAt(p.i,p.gone?ZERO:p.M);CR.setMatrixAt(p.i,p.gone?ZERO:p.M);}
function flush(){if(OL){pack();return;}TR.instanceMatrix.needsUpdate=true;CR.instanceMatrix.needsUpdate=true;}
// Ağaçları kameraya uzaklığa göre düzeylere dağıtır (en yakınlar ayrıntılı örgü, sonrakiler hafif örgü, uzaktakiler kart); telefonda altlarına leke gölge konur
function pack(){const cam=safe(()=>CAM.position,null);if(!OL||!cam)return;lcx=cam.x;lcz=cam.z;const act=OL.act,ds=OL.ds,B=OL.b,blob=!!root.TREE_BLOB;act.length=0;for(const p of list)if(!p.gone)act.push(p);ds.length=act.length;
 for(let i=0;i<act.length;i++)ds[i]=Math.hypot(act[i].x-cam.x,act[i].z-cam.z);const a=OL.assign(ds,OL.lv);for(const L of OL.lv)L.n=0;let nb=0;
 for(let i=0;i<act.length;i++){const l=a[i],p=act[i];if(l<0)continue;const L=OL.lv[l];L.m.setMatrixAt(L.n++,OL.t.multiplyMatrices(p.M,OL.K));if(blob&&p.t==null&&ds[i]<170){const r=6.4*p.s*KS;OL.o.position.set(p.x,p.y+.06,p.z);OL.o.scale.set(r,1,r);OL.o.updateMatrix();B.setMatrixAt(nb++,OL.o.matrix);}}
 for(const L of OL.lv){L.m.count=L.n;L.m.instanceMatrix.needsUpdate=true;}B.count=nb;B.instanceMatrix.needsUpdate=true;stat.hi=OL.lv[0].n;stat.mid=OL.lv.length>2?OL.lv[1].n:0;stat.far=OL.lv[OL.lv.length-1].n;}
function blobTex(T){const c=doc.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),gr=x.createRadialGradient(32,32,3,32,32,31);gr.addColorStop(0,'rgba(0,0,0,.42)');gr.addColorStop(.55,'rgba(0,0,0,.26)');gr.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=gr;x.fillRect(0,0,64,64);return new T.CanvasTexture(c);}
// levels: yakından uzağa {geo,mat,r,max,card}; assign: HisarModel.core.assign. Model gelince eski yalın gövde ve taç sahneden kaldırılır.
function setModel(levels,assign){if(!TR||OL||!levels||!levels.length||typeof assign!=='function')return false;const T=root.THREE;
 const lv=levels.map((L,i)=>{const max=Math.min(list.length,L.max||list.length),m=new T.InstancedMesh(L.geo,L.mat,Math.max(1,max));m.count=0;m.frustumCulled=false;m.castShadow=!L.card;m.name='AR_ZEYTIN_'+i;S.add(m);return {m,r:L.r,max,n:0};});
 const bg=new T.PlaneGeometry(1,1);bg.rotateX(-Math.PI/2);const b=new T.InstancedMesh(bg,new T.MeshBasicMaterial({map:blobTex(T),transparent:true,depthWrite:false}),Math.max(1,list.length));b.count=0;b.frustumCulled=false;b.renderOrder=1;b.userData.blob=1;b.name='AR_GOLGE';S.add(b);
 OL={lv,assign,b,K:new T.Matrix4().makeScale(KS,KS,KS),t:new T.Matrix4(),o:new T.Object3D(),ds:[],act:[]};S.remove(TR);S.remove(CR);pack();return true;}
// Bir alanı boşalt (eski mahalle gibi büyük bir model oturunca): içindeki bahçe ağaçları ve kayalar çizilmez
function clear(x,z,r){let n=0;for(const p of list)if(!p.gone&&Math.hypot(p.x-x,p.z-z)<r){p.gone=1;if(TR)write(p);n++;}if(ROCK){ZERO=ZERO||new root.THREE.Matrix4().makeScale(0,0,0);ROCK.pts.forEach((q,i)=>{if(!q.gone&&Math.hypot(q.x-x,q.z-z)<r+q.s){q.gone=1;ROCK.m.setMatrixAt(i,ZERO);n++;}});ROCK.m.instanceMatrix.needsUpdate=true;}
 if(TR)flush();stat.cleared+=n;return n;}
// tank bahçeye girerse ağacı devirir
const prev=new WeakMap();
function step(dt){if(!TR)return;const movers=[];safe(()=>{if(mode==='tank')movers.push(P);},null);for(const a of safe(()=>AL,[]))if(!a.dead)movers.push(a);let ch=false;const o=new root.THREE.Object3D();
 for(const m of movers){const q=prev.get(m);prev.set(m,[m.x,m.z]);if(!q)continue;const vx=(m.x-q[0])/Math.max(dt,1e-3),vz=(m.z-q[1])/Math.max(dt,1e-3),v=Math.hypot(vx,vz);if(v<1.2||v>40)continue;
  for(const p of list){if(p.t!=null||p.gone)continue;if(Math.abs(p.x-m.x)>2.8||Math.abs(p.z-m.z)>2.8)continue;if(Math.hypot(p.x-m.x,p.z-m.z)>2.8)continue;p.t=0;p.ax=vz/v;p.az=-vx/v;stat.felled++;}}
 for(const p of list){if(p.t==null||p.t>1.2)continue;p.t+=dt;put(p,o,Math.min(1,(p.t/1.2)**2)*1.45);ch=true;}if(ch)flush();
 if(OL&&!ch){const cam=safe(()=>CAM.position,null);if(cam&&(Math.abs(cam.x-lcx)>8||Math.abs(cam.z-lcz)>8))pack();}}
function reset(){if(!TR)return;const o=new root.THREE.Object3D();for(const p of list)if(p.t!=null){p.t=null;put(p,o,0);}flush();}
function wrap(name,factory){if(hooks[name]||typeof root[name]!=='function')return;root[name]=factory(root[name]);hooks[name]=true;}
function connect(){build();wrap('update',old=>function(dt){const r=old.apply(this,arguments);if(safe(()=>game==='play',false))safe(()=>step(Math.min(.1,+dt||0)),null);return r;});
 wrap('startMission',old=>function(){safe(reset,null);return old.apply(this,arguments);});}
root.HisarArazi=Object.freeze({version:VERSION,core,connect,setModel,clear,model:()=>OL?OL.lv.map(L=>L.m.count):null,trees:()=>list.filter(p=>!p.gone).map(p=>({x:p.x,z:p.z,down:p.t!=null})),diagnostics:()=>({version:VERSION,built,hooks:{...hooks},...stat})});
connect();doc.addEventListener('hisar:ui-ready',connect);
})(typeof window!=='undefined'?window:globalThis);
