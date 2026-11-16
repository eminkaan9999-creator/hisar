/* ÇELİK BÖRÜ sivil 1.0 — köylerin araçları ve yol trafiği (özgün tasarımlar, marka ya da arma yok).
 * - Türkiye tarafında evlerin yanında park hâlinde binek otomobil, çift kabin pikap, traktör (çoğu römorklu, kimi saman balyalı);
 *   Suriye tarafında az sayıda eski pikap.
 * - Türkiye içindeki köy yollarında ağır giden trafik: sağ şeritte gider, tank ya da dost araç önündeyse durur, yolun sonunda döner.
 * - Tank üstünden geçerse araç ezilir (yassılaşır, kararır); yakınına mermi düşerse yanar.
 * Park araçlarının hepsi tek birleşik mesh'tir (tek çizim çağrısı); yoldaki her araç kendi birleşik mesh'idir.
 * Çekirdek saf işlevlerdir ve Node ile sınanır.
 */
(function(root){'use strict';
const VERSION='1.1.0';
const doc=root.document;
const safe=(f,d)=>{try{return f();}catch(e){return d;}};
// ---------- çekirdek ----------
// Parça: b kutu [g,y,d], c silindir [üst yarıçap, alt yarıçap, boy]; p konum; r dönüş; c renk. Araç +z yönüne bakar, zemin y=0.
const PAL=Object.freeze({sedan:[0xe9e9e4,0xd8c9a3,0xa83226,0x2b3d63,0x9a9ea2,0x5f6b4e],pikap:[0xeeeeea,0x8d9296,0x4a5a44,0x6b4a32],traktor:[0xb3261e,0x2c56a0,0x3d7a3a],syr:[0xb8ad94,0x8f8a7a,0x6d7468]});
const GLASS=0x1d2730,TIRE=0x181818,RIM=0x8a8d90,CHR=0x7a7d80;
function wheel(out,x,y,z,r,w){out.push({t:'c',s:[r,r,w],p:[x,y,z],r:[0,0,Math.PI/2],c:TIRE});out.push({t:'c',s:[r*.55,r*.55,w+.02],p:[x,y,z],r:[0,0,Math.PI/2],c:RIM});}
// Kaporta yan görünüşü: üst hat (arkadan öne) verilir, alt hatta çamurluk boşlukları yarım daire olarak oyulur
function profile(top,arches,r){const out=top.slice(),yb=top[top.length-1][1],n=8;for(const zc of arches.slice().sort((a,b)=>b-a)){for(let i=0;i<=n;i++){const a=i/n*Math.PI;out.push([zc+Math.cos(a)*r,yb+Math.sin(a)*r]);}}return out;}
function veh(kind,col){const o=[],b=(s,p,c,r)=>o.push({t:'b',s,p,r:r||[0,0,0],c});
 const x=(pr,w,c,bv)=>o.push({t:'x',pr,w,bv:bv||0,p:[0,0,0],r:[0,0,0],c});
 if(kind==='sedan'){x(profile([[-2.1,.3],[-2.16,.55],[-2.12,.9],[-1.6,.97],[-1.32,1],[-.8,1.4],[.3,1.42],[.92,1],[1.85,.9],[2.12,.8],[2.16,.5],[2.1,.3]],[1.32,-1.32],.37),1.68,col,.07);
  x([[-.02,1.04],[.8,1.04],[.34,1.36],[-.02,1.36]],1.7,GLASS);x([[-.12,1.04],[-1.2,1.04],[-.82,1.36],[-.12,1.36]],1.7,GLASS);
  b([1.42,.04,.7],[0,1.215,.62],GLASS,[.6,0,0]);b([1.42,.04,.62],[0,1.205,-1.07],GLASS,[-.66,0,0]);
  b([1.5,.16,.05],[0,.66,2.17],0x1a1a1a);b([.5,.12,.03],[0,.44,2.2],0xeeeeee);b([.5,.12,.03],[0,.5,-2.2],0xeeeeee);b([1.7,.14,.1],[0,.4,2.14],CHR);b([1.7,.14,.1],[0,.4,-2.14],CHR);
  for(const s of[-1,1]){b([.3,.14,.05],[s*.62,.68,2.15],0xf2f0e0);b([.28,.12,.05],[s*.62,.72,-2.14],0xb3201c);b([.14,.09,.1],[s*.9,1.06,.78],col);b([.012,.5,.012],[s*.845,.7,-.07],0x222222);b([.012,.03,.14],[s*.85,.92,.25],CHR);b([.012,.03,.14],[s*.85,.92,-.45],CHR);
   for(const z of[1.32,-1.32])wheel(o,s*.74,.33,z,.33,.2);}}
 else if(kind==='pikap'){x(profile([[-2.6,.42],[-2.63,.7],[-2.6,1.22],[-.3,1.22],[-.28,1.86],[.95,1.88],[1.5,1.3],[2.45,1.2],[2.62,1],[2.64,.6],[2.58,.42]],[1.62,-1.55],.47),1.8,col,.07);
  x([[.2,1.36],[1.36,1.36],[.92,1.8],[.2,1.8]],1.82,GLASS);x([[-.2,1.36],[.1,1.36],[.1,1.8],[-.2,1.8]],1.82,GLASS);b([1.5,.04,.78],[0,1.6,1.21],GLASS,[.81,0,0]);b([1.4,.4,.03],[0,1.58,-.3],GLASS);
  b([1.5,.04,2.1],[0,1.235,-1.45],0x2a2a28);b([1.4,.34,.05],[0,.98,2.63],0x1a1a1a);b([.5,.12,.03],[0,.62,2.66],0xeeeeee);b([1.82,.18,.14],[0,.52,2.6],CHR);b([1.82,.18,.12],[0,.56,-2.6],CHR);
  for(const s of[-1,1]){b([.32,.16,.05],[s*.66,1.02,2.62],0xf2f0e0);b([.14,.3,.05],[s*.78,1,-2.61],0xb3201c);b([.16,.12,.1],[s*.97,1.42,1.3],col);b([.012,.6,.012],[s*.905,.95,.15],0x222222);for(const z of[1.62,-1.55])wheel(o,s*.8,.42,z,.42,.26);}}
 else if(kind==='traktor'){b([.82,.72,1.7],[0,1.12,.75],col);b([.9,.12,1.8],[0,1.5,.75],col);b([.86,.06,.06],[0,.92,1.62],0x2a2a2a);b([1.05,.62,1.05],[0,1.0,-.55],0x3b3b38);
  b([.5,.55,.45],[0,1.45,-.7],0x2a2a2a);for(const[x,z]of[[-.62,-1.05],[.62,-1.05],[-.62,.05],[.62,.05]])b([.07,1.25,.07],[x,2.12,z],0x2a2a2a);b([1.4,.07,1.25],[0,2.76,-.5],col);
  o.push({t:'c',s:[.05,.06,1.1],p:[.32,2.0,1.35],r:[0,0,0],c:0x2a2a2a});
  for(const s of[-1,1]){wheel(o,s*.86,.76,-.62,.76,.42);wheel(o,s*.7,.42,1.15,.42,.26);b([.46,.08,1.3],[s*.86,1.58,-.62],col);}}
 else if(kind==='romork'){b([1.9,.12,3.2],[0,.95,0],0x6d6a5c);for(const s of[-1,1])b([.07,.5,3.2],[s*.92,1.26,0],col);for(const z of[-1.58,1.58])b([1.9,.5,.07],[0,1.26,z],col);
  b([.12,.1,1.3],[0,.72,2.2],0x2a2a2a);for(const s of[-1,1])wheel(o,s*.98,.38,-.2,.38,.24);}
 else if(kind==='balya'){for(let i=0;i<3;i++)for(const s of[-1,1])b([.85,.5,1.05],[s*.45,1.33,-1.05+i*1.05],0xd8b765);b([.85,.5,1.05],[0,1.83,0],0xcfae5c);}
 return o;}
// Römork traktörün arkasında: çeki demiri boyu kadar geride
const TOW=3.6;
// Çoklu çizgi uzunluğu ve s metrede nokta (gidiş-dönüş: sonu geçince geri döner)
function len(p){let L=0;for(let i=1;i<p.length;i++)L+=Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]);return L;}
function along(p,s){const L=len(p);if(!(L>0))return {x:p[0][0],z:p[0][1],h:0,back:false};let u=((s%(2*L))+2*L)%(2*L);const back=u>L;if(back)u=2*L-u;
 for(let i=1;i<p.length;i++){const ax=p[i-1][0],az=p[i-1][1],dx=p[i][0]-ax,dz=p[i][1]-az,l=Math.hypot(dx,dz);if(u<=l||i===p.length-1){const t=l?Math.min(1,u/l):0;let h=Math.atan2(dx,dz);if(back)h+=Math.PI;return {x:ax+dx*t,z:az+dz*t,h,back};}u-=l;}
 return {x:p[p.length-1][0],z:p[p.length-1][1],h:0,back};}
// Sağ şerit: gidiş yönünün sağına kaydır (görüntüde +z'ye bakarken sağ -x'tir)
function lane(q,off){return {x:q.x-Math.cos(q.h)*off,z:q.z+Math.sin(q.h)*off,h:q.h};}
// Önünde engel var mı: d metreden yakın, önde ve şeride wl metreden yakın (karşı şeritteki araç durdurmaz)
function blocked(car,obs,d,wl){const fx=Math.sin(car.h),fz=Math.cos(car.h);wl=wl||4;return obs.some(o=>{const dx=o.x-car.x,dz=o.z-car.z,dd=Math.hypot(dx,dz),f=dx*fx+dz*fz,l=Math.abs(dx*fz-dz*fx);return dd<d&&f>-2&&l<wl;});}
const core=Object.freeze({VERSION,PAL,veh,profile,len,along,lane,blocked,TOW});
if(typeof module==='object'&&module.exports)module.exports=core;
if(!doc)return;
// ---------- oyun ----------
const hooks={},stat={parked:0,moving:0,crushed:0,burned:0,meshes:0};let built=false,PARK=null,MOV=[],CARS=[];
const RV=x=>safe(()=>riv(x),120);
const hash=(x,z,k)=>{const v=Math.sin(x*12.9898+z*78.233+k*37.719)*43758.5453;return v-Math.floor(v);};
const pick=(a,u)=>a[Math.floor(u*a.length)%a.length];
// parçaları tek geometriye birleştir; köşe renkleri parça rengidir
// Yan görünüşü araç genişliğince kalınlaştırır; kenarlar pahlıdır (yuvarlak kaporta)
function extr(T,pr){const sh=new T.Shape();pr.pr.forEach((q,i)=>i?sh.lineTo(q[0],q[1]):sh.moveTo(q[0],q[1]));sh.closePath();const d=pr.w-2*pr.bv;
 const g=new T.ExtrudeGeometry(sh,{depth:d,bevelEnabled:pr.bv>0,bevelSize:pr.bv,bevelOffset:-pr.bv,bevelThickness:pr.bv,bevelSegments:2,curveSegments:1,steps:1});g.translate(0,0,-d/2);g.rotateY(-Math.PI/2);g.computeVertexNormals();return g;}
function merge(T,items){const pos=[],nor=[],col=[],idx=[],c=new T.Color(),m=new T.Matrix4(),q=new T.Quaternion(),e=new T.Euler(),cache={};let base=0;const ranges=[];
 for(const it of items){const st=base;for(const pr of it.parts){const key=pr.t==='x'?'x'+pr.w+pr.bv+pr.pr.join(','):pr.t+pr.s.join(',');let g=cache[key];if(!g)g=cache[key]=pr.t==='x'?extr(T,pr):pr.t==='b'?new T.BoxGeometry(pr.s[0],pr.s[1],pr.s[2]):new T.CylinderGeometry(pr.s[0],pr.s[1],pr.s[2],14);
   e.set(pr.r[0],pr.r[1],pr.r[2]);q.setFromEuler(e);const lm=new T.Matrix4().compose(new T.Vector3(pr.p[0],pr.p[1],pr.p[2]),q,new T.Vector3(1,1,1));m.multiplyMatrices(it.m,lm);
   const nm=new T.Matrix3().getNormalMatrix(m),P=g.attributes.position,N=g.attributes.normal,v=new T.Vector3();c.setHex(pr.c);
   for(let i=0;i<P.count;i++){v.fromBufferAttribute(P,i).applyMatrix4(m);pos.push(v.x,v.y,v.z);v.fromBufferAttribute(N,i).applyMatrix3(nm).normalize();nor.push(v.x,v.y,v.z);col.push(c.r,c.g,c.b);}
   if(g.index){const I=g.index.array;for(let i=0;i<I.length;i++)idx.push(I[i]+base);}else for(let i=0;i<P.count;i++)idx.push(i+base);base+=P.count;}
  ranges.push([st,base]);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('normal',new T.Float32BufferAttribute(nor,3));g.setAttribute('color',new T.Float32BufferAttribute(col,3));
 g.setIndex(base>65535?new T.Uint32BufferAttribute(idx,1):new T.Uint16BufferAttribute(idx,1));g.computeBoundingSphere();return {g,ranges};}
let MAT=null;const mat=T=>MAT||(MAT=new T.MeshLambertMaterial({vertexColors:true}));
function freeSpot(x,z,r,own){if(Math.abs(x)>safe(()=>WS,800)-15||Math.abs(z)>safe(()=>WS,800)-15)return false;if(Math.abs(z-RV(x))<40)return false;if(safe(()=>hAt(x,z),0)<-.4)return false;if(safe(()=>roadNear(x,z,.6),false))return false;
 if(safe(()=>BLD.some(b=>b!==own&&!b.dead&&Math.hypot(b.x-x,b.z-z)<b.r+r*.6),false))return false;if(safe(()=>COV.some(c=>Math.hypot(c.x-x,c.z-z)<c.r+r+1),false))return false;
 if(safe(()=>root.HisarField.positions().some(q=>Math.hypot(q.x-x,q.z-z)<14),false))return false;return !CARS.some(c=>Math.hypot(c.x-x,c.z-z)<5.5);}
// yan yana iki parça listesini bir araç kümesinde topla (traktör + römork + balya)
function kit(kind,u){if(kind==='sedan')return [{parts:veh('sedan',pick(PAL.sedan,u)),dz:0}];if(kind==='pikap')return [{parts:veh('pikap',pick(PAL.pikap,u)),dz:0}];
 if(kind==='eski')return [{parts:veh('pikap',pick(PAL.syr,u)),dz:0}];const c=pick(PAL.traktor,u),out=[{parts:veh('traktor',c),dz:0}];
 if(u<.75){const rk=veh('romork',u<.4?0x2c56a0:0x7a3a2a);if(u<.45)rk.push(...veh('balya'));out.push({parts:rk,dz:-TOW});}return out;}
function buildParked(T){const items=[];
 for(const b of safe(()=>BLD,[])){if(b.dead||!b.w||!b.kind)continue;const tr=b.z<RV(b.x)-40,sy=b.z>RV(b.x)+40;if(!tr&&!sy)continue;if(!['house','beton','shop','barn','kerpic'].includes(b.kind))continue;
  const u=hash(b.x,b.z,1);if(tr?u>.5:u>.22)continue;const v=hash(b.x,b.z,2),kind=sy?'eski':b.kind==='barn'?'traktor':v<.45?'sedan':v<.75?'pikap':'traktor';
  const side=hash(b.x,b.z,3)<.5?1:-1,c=Math.cos(b.rot||0),s=Math.sin(b.rot||0),lx=side*(b.w/2+4.4)/* avlu duvarının dışında */,lz=b.d*.1,x=b.x+lx*c+lz*s,z=b.z-lx*s+lz*c,h=(b.rot||0)+(hash(b.x,b.z,4)<.5?0:Math.PI);
  if(!freeSpot(x,z,3.2,b))continue;const y=safe(()=>hAt(x,z),0);const k=kit(kind,hash(b.x,b.z,5));
  const car={x,z,h,r:kind==='traktor'?3:2.6,kind,parked:true,items:[],y};for(const p of k){const ox=x+Math.sin(h)*p.dz,oz=z+Math.cos(h)*p.dz;const m=new T.Matrix4().compose(new T.Vector3(ox,safe(()=>hAt(ox,oz),y),oz),new T.Quaternion().setFromEuler(new T.Euler(0,h,0)),new T.Vector3(1,1,1));items.push({parts:p.parts,m,car});car.items.push(items.length-1);}
  CARS.push(car);}
 if(!items.length)return;const r=merge(T,items);r.ranges.forEach((rg,i)=>{const c=items[i].car;(c.rg||(c.rg=[])).push(rg);});
 PARK=new T.Mesh(r.g,mat(T));PARK.name='SV_PARK';PARK.castShadow=true;PARK.receiveShadow=true;S.add(PARK);stat.parked=CARS.length;stat.meshes++;}
// Türkiye içinde kalan en uzun yol parçaları (sınıra 45 m'den yakın kısım alınmaz)
function routes(){const out=[];for(const r of safe(()=>WROADS,[])){let cur=[];const flush=()=>{if(cur.length>1&&len(cur)>160){cur.w=r.w||6;out.push(cur);}cur=[];};
  for(const p of r.pts){if(p[1]<RV(p[0])-45&&Math.abs(p[0])<safe(()=>WS,800)-20)cur.push(p);else flush();}flush();}
 return out.sort((a,b)=>len(b)-len(a)).slice(0,6);}
function buildMoving(T){const rs=routes(),kinds=['sedan','pikap','traktor','sedan','pikap','sedan'];rs.forEach((p,i)=>{const kind=kinds[i%kinds.length],u=hash(i,7,9),k=kit(kind,u),items=k.map(q=>({parts:q.parts,m:new T.Matrix4().makeTranslation(0,0,q.dz),car:null}));
  const r=merge(T,items),mesh=new T.Mesh(r.g,mat(T));mesh.castShadow=true;mesh.name='SV_YOL';S.add(mesh);stat.meshes++;
  const car={kind,path:p,s:len(p)*hash(i,3,1),v:0,vmax:kind==='traktor'?4.2:kind==='pikap'?8:9,mesh,x:0,z:0,h:0,r:kind==='traktor'?3:2.6,rg:[[0,r.g.attributes.position.count]],y:0};
  place(car,0);MOV.push(car);CARS.push(car);});stat.moving=MOV.length;}
function place(c,dt){const q=lane(along(c.path,c.s),Math.min(1.7,(c.path.w||6)/4));let d=q.h-c.h;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;c.h+=dt?d*Math.min(1,dt*2.5):d;c.x=q.x;c.z=q.z;
 c.y=safe(()=>hAt(c.x,c.z),0);c.mesh.position.set(c.x,c.y,c.z);c.mesh.rotation.y=c.h;}
function build(){if(built||!root.THREE||typeof S==='undefined'||typeof BLD==='undefined'||typeof WROADS==='undefined'||!safe(()=>BLD.some(b=>b.kind==='house'&&b.w),false))return;built=true;const T=root.THREE;safe(()=>buildParked(T),null);safe(()=>buildMoving(T),null);}
// hasar: ezilme ve yanma köşe konumu/rengiyle gösterilir
function wreck(c,squash,dark){const g=c.mesh?c.mesh.geometry:PARK&&PARK.geometry;if(!g)return;const P=g.attributes.position,C=g.attributes.color,base=c.mesh?0:c.y;
 for(const[a,b]of c.rg||[])for(let i=a;i<b;i++){const y=P.getY(i),g0=c.mesh?0:base;P.setY(i,g0+(y-g0)*squash);C.setXYZ(i,C.getX(i)*dark,C.getY(i)*dark,C.getZ(i)*dark);}
 P.needsUpdate=true;C.needsUpdate=true;g.computeVertexNormals();}
function crush(c){if(c.dead)return;c.dead=1;wreck(c,.38,.5);stat.crushed++;}
function burn(c){if(c.burnt)return;c.burnt=1;c.dead=1;wreck(c,.85,.22);stat.burned++;}
const prev=new WeakMap();
function step(dt){if(!built)return;const movers=[];safe(()=>{if(mode==='tank')movers.push(P);},null);for(const a of safe(()=>AL,[]))if(!a.dead)movers.push(a);for(const e of safe(()=>E,[]))if(e.type==='tank'||e.type==='apc')movers.push(e);
 const sp=new Map();for(const m of movers){const q=prev.get(m);prev.set(m,[m.x,m.z]);sp.set(m,q?Math.hypot(m.x-q[0],m.z-q[1])/Math.max(dt,1e-3):0);}
 for(const c of CARS){if(c.dead)continue;for(const m of movers){if(sp.get(m)>1.2&&Math.hypot(m.x-c.x,m.z-c.z)<c.r){crush(c);break;}}}
 for(const c of MOV){if(c.dead)continue;const stop=blocked(c,movers,16,4.5)||blocked(c,CARS.filter(o=>o!==c),9,2.2);const tv=stop?0:c.vmax;c.v+=Math.max(-6*dt,Math.min(2*dt,tv-c.v));c.s+=c.v*dt;place(c,dt);}}
function reset(){/* yeni görevde yanmış ve ezilmiş araçlar yerine konur: dünya yeniden kurulmaz, köşeler ilk hâline döner */
 for(const c of CARS){if(!c.dead)continue;c.dead=0;c.burnt=0;}if(PARK){S.remove(PARK);PARK.geometry.dispose();PARK=null;}for(const c of MOV){S.remove(c.mesh);c.mesh.geometry.dispose();}MOV=[];CARS=[];built=false;stat.parked=stat.moving=stat.meshes=0;build();}
function wrap(name,factory){if(hooks[name]||typeof root[name]!=='function')return;root[name]=factory(root[name]);hooks[name]=true;}
function connect(){build();
 wrap('update',old=>function(dt){const r=old.apply(this,arguments);if(!built)safe(build,null);if(safe(()=>game==='play',false))safe(()=>step(Math.min(.1,+dt||0)),null);return r;});
 wrap('bigBoom',old=>function(x,z,r){const o=old.apply(this,arguments);safe(()=>{for(const c of CARS)if(!c.burnt&&Math.hypot(c.x-x,c.z-z)<(r||4)+2.5)burn(c);},null);return o;});
 wrap('startMission',old=>function(){if(stat.crushed||stat.burned)safe(reset,null);return old.apply(this,arguments);});}
root.HisarSivil=Object.freeze({version:VERSION,core,connect,cars:()=>CARS.map(c=>({kind:c.kind,x:Math.round(c.x*10)/10,z:Math.round(c.z*10)/10,h:c.h,parked:!!c.parked,dead:!!c.dead,burnt:!!c.burnt,v:c.v||0})),
 diagnostics:()=>({version:VERSION,built,hooks:{...hooks},...stat})});
connect();doc.addEventListener('hisar:ui-ready',connect);
})(typeof window!=='undefined'?window:globalThis);
