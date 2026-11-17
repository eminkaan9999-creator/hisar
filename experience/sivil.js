/* ÇELİK BÖRÜ sivil 1.3 — köylerin araçları, yol trafiği ve asker taşıyan kamyonlar; hepsi kullanıcının gönderdiği 3B modellerle çizilir.
 * - Köy araçları (dost ve düşman köylerinde) gönderilen pikap modelidir, araca göre renk tonu alır: Türkiye'de evlerin yanında park hâlinde
 *   pikap ve traktör (çoğu römorklu, kimi saman balyalı), Suriye'de az sayıda tozlu pikap.
 * - Türkiye içindeki köy yollarında ağır giden trafik: sağ şeritte gider, tank ya da dost araç önündeyse durur, yolun sonunda döner.
 * - Asker taşıyan kamyon (gönderilen model: kasada askerler, tepede nişancı) sınıra inen yollarda gider gelir; sınır ucunda bir süre bekler.
 * - Tank üstünden geçerse köy aracı ezilir (yassılaşır, kararır); yakınına mermi düşerse yanar. Asker taşıyan kamyon ezilmez: katıdır, tank
 *   içinden geçemez. Yoldaki araçlar da yol verilen araçlardır: köylü, hayvan ve asker önlerinden çekilir.
 * Çizim: her model üç örnekli mesh'tir. Kameraya en yakın araçlar ayrıntılı örgüyle (yaklaşık 20 bin üçgen), ötekiler hafif örgüyle
 * (yaklaşık 3 bin üçgen) çizilir; araç yamaçta burnunu yokuşa verir. Römork ve saman balyası kodla kurulur (modeli yok).
 * Model dosyası gelmezse o türün araçları kurulmaz. Çekirdek saf işlevlerdir ve Node ile sınanır.
 */
(function(root){'use strict';
const VERSION='1.3.0';
const doc=root.document;
const safe=(f,d)=>{try{return f();}catch(e){return d;}};
// ---------- çekirdek ----------
const PAL=Object.freeze({pikap:[0xe9e9e4,0xd8c9a3,0xa83226,0x2b3d63,0x9a9ea2,0x5f6b4e,0xeeeeea,0x8d9296,0x4a5a44,0x6b4a32],syr:[0xb8ad94,0x8f8a7a,0x6d7468],romork:[0x2c56a0,0x7a3a2a]});
// Model tanımları: sc ölçek (model birimi → metre), rot örgünün dönüşü (araç +z'ye baksın), tint araca göre renk tonu oranı,
// r ezilme yarıçapı (m), v yol hızı (m/sn), wb dingil arası (yamaç eğimi bu aralıkta ölçülür), sh leke gölgenin eni ve boyu, gain dokunun parlaklık çarpanı
const MDL=Object.freeze({pikap:Object.freeze({sc:5.4,rot:Math.PI/2,tint:.65,r:2.6,v:8.5,wb:3.2,sh:[2.9,6.2],gain:1}),traktor:Object.freeze({sc:4.5,rot:0,tint:0,r:3,v:4.2,wb:2.4,sh:[3,5],gain:1.25}),
 kamyon:Object.freeze({sc:6.4,rot:0,tint:0,r:3.4,v:7,wb:3.8,sh:[3.4,7.2],gain:1.2})});
// Ayrıntı düzeyleri: yakın (ayrıntılı örgü), orta (hafif örgü, gölge atar), uzak (hafif örgü); far'dan ötesi çizilmez
const LOD=Object.freeze({near:45,maxHi:3,mid:85,maxMid:8,far:440});
// Asker taşıyan kamyonun engeli: boyu eninden uzun olduğu için ekseninde önde ve arkada birer daire (yarıçap r, eksenden uzaklık off, yükseklik h)
const TRUCK_COV=Object.freeze({r:2.8,off:2,h:2.8});
// Tank yalnız köy araçlarını ezer; asker taşıyan kamyon ezilmez
const crushable=c=>!!c&&!c.dead&&c.kind!=='kamyon';
// Kamyon sınır ucunda ve geri ucunda bekler (sn); yolun sınıra yakın son shuttle metresinde gidip gelir, ilk kamyon sınıra first metre kala yola çıkar
const PAUSE=Object.freeze({border:12,back:6,shuttle:480,first:150,gap:170});
const TIRE=0x181818,RIM=0x8a8d90;
// Parça: b kutu [g,y,d], c silindir [üst yarıçap, alt yarıçap, boy]; p konum; r dönüş; c renk. Çeki demiri +z'dedir, zemin y=0.
function wheel(out,x,y,z,r,w){out.push({t:'c',s:[r,r,w],p:[x,y,z],r:[0,0,Math.PI/2],c:TIRE});out.push({t:'c',s:[r*.55,r*.55,w+.02],p:[x,y,z],r:[0,0,Math.PI/2],c:RIM});}
// Römork: yan tahtalar beyazdır, rengini örnek rengi verir
function romork(){const o=[],b=(s,p,c)=>o.push({t:'b',s,p,r:[0,0,0],c});b([1.9,.12,3.2],[0,.95,0],0xa8a498);for(const s of[-1,1])b([.07,.5,3.2],[s*.92,1.26,0],0xffffff);for(const z of[-1.58,1.58])b([1.9,.5,.07],[0,1.26,z],0xffffff);
 b([.12,.1,1.3],[0,.72,2.2],0x2a2a2a);for(const s of[-1,1])wheel(o,s*.98,.38,-.2,.38,.24);return o;}
function balya(){const o=[];for(let i=0;i<3;i++)for(const s of[-1,1])o.push({t:'b',s:[.85,.5,1.05],p:[s*.45,1.33,-1.05+i*1.05],r:[0,0,0],c:0xd8b765});o.push({t:'b',s:[.85,.5,1.05],p:[0,1.83,0],r:[0,0,0],c:0xcfae5c});return o;}
// Römork traktörün arkasında: çeki demiri boyu kadar geride
const TOW=4.6;
// Çoklu çizgi uzunluğu ve s metrede nokta (gidiş-dönüş: sonu geçince geri döner)
function len(p){let L=0;for(let i=1;i<p.length;i++)L+=Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]);return L;}
function along(p,s){const L=len(p);if(!(L>0))return {x:p[0][0],z:p[0][1],h:0,back:false};let u=((s%(2*L))+2*L)%(2*L);const back=u>L;if(back)u=2*L-u;
 for(let i=1;i<p.length;i++){const ax=p[i-1][0],az=p[i-1][1],dx=p[i][0]-ax,dz=p[i][1]-az,l=Math.hypot(dx,dz);if(u<=l||i===p.length-1){const t=l?Math.min(1,u/l):0;let h=Math.atan2(dx,dz);if(back)h+=Math.PI;return {x:ax+dx*t,z:az+dz*t,h,back};}u-=l;}
 return {x:p[p.length-1][0],z:p[p.length-1][1],h:0,back};}
// Çoklu çizgiyi en çok step metrelik parçalara böler (yolun sınıra en yakın noktasına kadar gidilebilsin)
function dense(p,step){const out=[p[0]];for(let i=1;i<p.length;i++){const a=p[i-1],b=p[i],n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/step));for(let k=1;k<=n;k++)out.push([a[0]+(b[0]-a[0])*k/n,a[1]+(b[1]-a[1])*k/n]);}return out;}
// Sağ şerit: gidiş yönünün sağına kaydır (görüntüde +z'ye bakarken sağ -x'tir)
function lane(q,off){return {x:q.x-Math.cos(q.h)*off,z:q.z+Math.sin(q.h)*off,h:q.h};}
// Önünde engel var mı: d metreden yakın, önde ve şeride wl metreden yakın (karşı şeritteki araç durdurmaz)
function blocked(car,obs,d,wl){const fx=Math.sin(car.h),fz=Math.cos(car.h);wl=wl||4;return obs.some(o=>{const dx=o.x-car.x,dz=o.z-car.z,dd=Math.hypot(dx,dz),f=dx*fx+dz*fz,l=Math.abs(dx*fz-dz*fx);return dd<d&&f>-2&&l<wl;});}
// Yolun sınıra bakan ucu: rv(x) nehrin z'si. end 0 ilk nokta, 1 son nokta; gap o ucun nehre uzaklığı (m)
function borderEnd(p,rv){const g=q=>rv(q[0])-q[1],a=g(p[0]),b=g(p[p.length-1]);return a<b?{end:0,gap:a}:{end:1,gap:b};}
// Yolun sınır ucuna yakın son L metresi; dönen yol sınır ucunda biter (end: sınır ucu yolun başıysa 0, sonuysa 1)
function tail(p,end,L){const q=end?p.slice():p.slice().reverse();let acc=0,i=q.length-1;for(;i>0&&acc<L;i--)acc+=Math.hypot(q[i][0]-q[i-1][0],q[i][1]-q[i-1][1]);const out=q.slice(i);out.w=p.w;return out;}
// Yol ucuna varış: gidiş-dönüşte s, L'nin katını geçince bir uca varılmıştır (tek kat: son nokta, çift kat: ilk nokta). Varılan ucu döndürür, yoksa -1.
function arrived(s0,s1,L){const k0=Math.floor(s0/L),k1=Math.floor(s1/L);return k1===k0?-1:(k1%2===1?1:0);}
// Yamaç eğimi: ön ve arka dingildeki zemin yüksekliğinden (burun yukarı eksi açı; three.js x dönüşü)
function pitch(hf,hb,wb){return -Math.atan2(hf-hb,wb);}
const core=Object.freeze({VERSION,PAL,MDL,LOD,PAUSE,TOW,romork,balya,len,dense,along,lane,blocked,borderEnd,tail,arrived,pitch,TRUCK_COV,crushable});
if(typeof module==='object'&&module.exports)module.exports=core;
if(!doc)return;
// ---------- oyun ----------
const hooks={},stat={parked:0,moving:0,trucks:0,trailers:0,crushed:0,burned:0,hi:0,mid:0,far:0,state:'bekliyor',error:null,tris:{}};let built=false,MOV=[],CARS=[],G=null,TRL=null,started=false;
const RV=x=>safe(()=>riv(x),120),WSZ=()=>safe(()=>WS,800),H=(x,z)=>safe(()=>hAt(x,z),0);
const hash=(x,z,k)=>{const v=Math.sin(x*12.9898+z*78.233+k*37.719)*43758.5453;return v-Math.floor(v);};
const pick=(a,u)=>a[Math.floor(u*a.length)%a.length];
function freeSpot(x,z,r,own){if(Math.abs(x)>WSZ()-15||Math.abs(z)>WSZ()-15)return false;if(Math.abs(z-RV(x))<40)return false;if(H(x,z)<-.4)return false;if(safe(()=>roadNear(x,z,.6),false))return false;
 if(safe(()=>BLD.some(b=>b!==own&&!b.dead&&Math.hypot(b.x-x,b.z-z)<b.r+r*.6),false))return false;if(safe(()=>COV.some(c=>Math.hypot(c.x-x,c.z-z)<c.r+r+1),false))return false;
 if(safe(()=>root.HisarField.positions().some(q=>Math.hypot(q.x-x,q.z-z)<14),false))return false;return !CARS.some(c=>Math.hypot(c.x-x,c.z-z)<5.5);}
function slope(c){const d=MDL[c.model],fx=Math.sin(c.h)*d.wb/2,fz=Math.cos(c.h)*d.wb/2;c.pitch=pitch(H(c.x+fx,c.z+fz),H(c.x-fx,c.z-fz),d.wb);}
function trailer(c,u){if(c.model!=='traktor'||u>=.75)return;c.trailer={col:u<.4?PAL.romork[0]:PAL.romork[1],hay:u<.45};}
function buildParked(){for(const b of safe(()=>BLD,[])){if(b.dead||!b.w||!b.kind)continue;const tr=b.z<RV(b.x)-40,sy=b.z>RV(b.x)+40;if(!tr&&!sy)continue;if(!['house','beton','shop','barn','kerpic'].includes(b.kind))continue;
  const u=hash(b.x,b.z,1);if(tr?u>.5:u>.22)continue;const v=hash(b.x,b.z,2),kind=sy?'eski':b.kind==='barn'||v>=.75?'traktor':'pikap',model=kind==='traktor'?'traktor':'pikap';
  const side=hash(b.x,b.z,3)<.5?1:-1,c=Math.cos(b.rot||0),s=Math.sin(b.rot||0),lx=side*(b.w/2+4.4)/* avlu duvarının dışında */,lz=b.d*.1,x=b.x+lx*c+lz*s,z=b.z-lx*s+lz*c,h=(b.rot||0)+(hash(b.x,b.z,4)<.5?0:Math.PI);
  if(!freeSpot(x,z,3.2,b))continue;const w=hash(b.x,b.z,5),car={x,z,h,y:H(x,z),r:MDL[model].r,kind,model,parked:true,col:kind==='eski'?pick(PAL.syr,w):kind==='pikap'?pick(PAL.pikap,w):0xffffff};slope(car);trailer(car,w);CARS.push(car);}
 stat.parked=CARS.length;}
// Türkiye içinde kalan yol parçaları (sınıra 45 m'den yakın kısım alınmaz)
function stretches(){const out=[];for(const r of safe(()=>WROADS,[])){let cur=[];const flush=()=>{if(cur.length>1&&len(cur)>160){cur.w=r.w||6;out.push(cur);}cur=[];};
  for(const p of dense(r.pts,8)){if(p[1]<RV(p[0])-45&&Math.abs(p[0])<WSZ()-20)cur.push(p);else flush();}flush();}return out;}
function mover(kind,model,p,s,u){const d=MDL[model],car={kind,model,path:p,L:len(p),s,v:0,vmax:d.v,x:0,z:0,y:0,h:0,pitch:0,r:d.r,wait:0,col:kind==='pikap'?pick(PAL.pikap,u):0xffffff};trailer(car,u);
 /* asker taşıyan kamyon katıdır: engeli araçla birlikte yürür (düşman siper diye kullanmaz: pos) */
 if(kind==='kamyon'){car.cov=[1,-1].map(k=>({x:0,z:0,r:TRUCK_COV.r,h:TRUCK_COV.h,pos:1,kam:k}));safe(()=>COV.push(...car.cov),null);}
 place(car,0);MOV.push(car);CARS.push(car);return car;}
function buildMoving(){const all=stretches(),kinds=['pikap','pikap','traktor','pikap','pikap','pikap'];
 all.slice().sort((a,b)=>len(b)-len(a)).slice(0,6).forEach((p,i)=>{const kind=kinds[i%kinds.length];mover(kind,kind,p,len(p)*hash(i,3,1),hash(i,7,9));});
 /* kamyonlar: ucu sınıra en yakın iki yol; yolun sınıra yakın kesiminde gidip gelir, sınıra doğru yola çıkar */
 all.map(p=>({p,e:borderEnd(p,RV)})).filter(q=>q.e.gap<110).sort((a,b)=>a.e.gap-b.e.gap).slice(0,2).forEach((q,i)=>{const p=tail(q.p,q.e.end,PAUSE.shuttle),L=len(p),c=mover('kamyon','kamyon',p,Math.max(0,L-PAUSE.first-PAUSE.gap*i),0);c.border=1;stat.trucks++;});
 stat.moving=MOV.length;}
function place(c,dt){const q=lane(along(c.path,c.s),Math.min(1.7,(c.path.w||6)/4));let d=q.h-c.h;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;c.h+=dt?d*Math.min(1,dt*(c.kind==='kamyon'?1.1:2.5)):d;c.x=q.x;c.z=q.z;c.y=H(c.x,c.z);slope(c);if(c.cov)for(const k of c.cov){k.x=c.x+Math.sin(c.h)*TRUCK_COV.off*k.kam;k.z=c.z+Math.cos(c.h)*TRUCK_COV.off*k.kam;}}
// ---------- gönderilen 3B modeller ----------
const FILES={pikap:['pikap','pikap_uzak','pikap_col'],traktor:['traktor','traktor_uzak','traktor_col'],kamyon:['kamyon','kamyon_uzak','kamyon_col']};
function inst(T,geo,mat,n,name,shadow){const m=new T.InstancedMesh(geo,mat,Math.max(1,n));m.instanceColor=new T.InstancedBufferAttribute(new Float32Array(Math.max(1,n)*3).fill(1),3);m.count=0;m.frustumCulled=false;m.castShadow=!!shadow;m.receiveShadow=false;m.name=name;S.add(m);return m;}
function blobTex(T){const c=doc.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),gr=x.createRadialGradient(32,32,4,32,32,31);gr.addColorStop(0,'rgba(0,0,0,.5)');gr.addColorStop(.6,'rgba(0,0,0,.34)');gr.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=gr;x.fillRect(0,0,64,64);return new T.CanvasTexture(c);}
async function load(){const M=root.HisarModel,T=root.THREE;if(started||!M||!T||!built)return;started=true;stat.state='yükleniyor';const errs=[],g={};
 await Promise.all(Object.keys(FILES).map(async k=>{try{const f=FILES[k],[a,b]=await Promise.all([M.load('assets/mdl/'+f[0]+'.bin?v=1'),M.load('assets/mdl/'+f[1]+'.bin?v=1')]),d=MDL[k],n=CARS.filter(c=>c.model===k).length;
   const hi=M.geometry(a,{rotY:d.rot}),lo=M.geometry(b,{rotY:d.rot}),mat=M.material(M.texture('assets/tex/'+f[2]+'.jpg?v=1'),{gain:d.gain});
   g[k]={def:d,lv:[inst(T,hi,mat,LOD.maxHi,'SV_MODEL_'+k,true),inst(T,lo,mat,LOD.maxMid,'SV_ORTA_'+k,true),inst(T,lo,mat,n,'SV_UZAK_'+k,false)],n:[0,0,0]};stat.tris[k]=[a.ni/3,b.ni/3];}catch(e){errs.push(String(e&&e.message||e));}}));
 /* modeli gelmeyen türün araçları kurulmaz (görünmez araç kalmasın) */
 for(const c of MOV)if(!g[c.model]&&c.cov)safe(()=>{for(const k of c.cov){const i=COV.indexOf(k);if(i>=0)COV.splice(i,1);}},null);
 CARS=CARS.filter(c=>g[c.model]);MOV=MOV.filter(c=>g[c.model]);stat.parked=CARS.filter(c=>c.parked).length;stat.moving=MOV.length;stat.trucks=MOV.filter(c=>c.kind==='kamyon').length;
 const nt=CARS.filter(c=>c.trailer).length,vm=new T.MeshLambertMaterial({vertexColors:true});stat.trailers=nt;
 TRL={r:inst(T,M.merge(romork()),vm,nt,'SV_ROMORK',false),b:inst(T,M.merge(balya()),vm,nt,'SV_BALYA',false)};
 const bg=new T.PlaneGeometry(1,1);bg.rotateX(-Math.PI/2);const bl=new T.InstancedMesh(bg,new T.MeshBasicMaterial({map:blobTex(T),transparent:true,depthWrite:false}),Math.max(1,CARS.length+nt));bl.count=0;bl.frustumCulled=false;bl.renderOrder=1;bl.userData.blob=1;bl.name='SV_GOLGE';S.add(bl);TRL.s=bl;
 G=g;G.o=new T.Object3D();G.o.rotation.order='YXZ';G.c=new T.Color();G.w=new T.Color(0xffffff);G.ds=[];G.levels=[{r:LOD.near,max:LOD.maxHi},{r:LOD.mid,max:LOD.maxMid},{r:LOD.far}];
 stat.state=errs.length?'hata: '+errs.join('; '):'hazır';stat.error=errs.length?errs.join('; '):null;draw();}
// Her kare: araçları kameraya uzaklığa göre düzeylere dağıtır ve örnek matrislerini yazar
function draw(){if(!G)return;const cam=safe(()=>CAM.position,null),M=root.HisarModel;if(!cam)return;const n=CARS.length,ds=G.ds,o=G.o,col=G.c;ds.length=n;for(let i=0;i<n;i++)ds[i]=Math.hypot(CARS[i].x-cam.x,CARS[i].z-cam.z);
 const lv=M.core.assign(ds,G.levels),blob=!!root.TREE_BLOB;for(const k in FILES)if(G[k]){const q=G[k].n;q[0]=q[1]=q[2]=0;}let nt=0,nb=0,ns=0;
 for(let i=0;i<n;i++){const c=CARS[i],l=lv[i];if(l<0)continue;const g=G[c.model],d=g.def,sq=c.burnt?.85:c.dead?.38:1,dk=c.burnt?.2:c.dead?.5:1;
  o.position.set(c.x,c.y,c.z);o.rotation.set(c.pitch||0,c.h,0);o.scale.set(d.sc,d.sc*sq,d.sc);o.updateMatrix();col.setHex(c.col).lerp(G.w,1-d.tint).multiplyScalar(dk);const im=g.lv[l],j=g.n[l]++;im.setMatrixAt(j,o.matrix);im.setColorAt(j,col);
  if(blob&&ds[i]<150){o.rotation.set(0,c.h,0);o.position.y=c.y+.08;o.scale.set(d.sh[0],1,d.sh[1]);o.updateMatrix();TRL.s.setMatrixAt(ns++,o.matrix);}
  if(c.trailer){const tx=c.x-Math.sin(c.h)*TOW,tz=c.z-Math.cos(c.h)*TOW,ty=c.parked?(c.ty==null?(c.ty=H(tx,tz)):c.ty):H(tx,tz);o.position.set(tx,ty,tz);o.rotation.set(0,c.h,0);o.scale.set(1,sq,1);o.updateMatrix();
   col.setHex(c.trailer.col).multiplyScalar(dk);TRL.r.setMatrixAt(nt,o.matrix);TRL.r.setColorAt(nt,col);nt++;if(c.trailer.hay){col.setScalar(dk);TRL.b.setMatrixAt(nb,o.matrix);TRL.b.setColorAt(nb,col);nb++;}
   if(blob&&ds[i]<150){o.position.y=ty+.08;o.scale.set(2.6,1,4.2);o.updateMatrix();TRL.s.setMatrixAt(ns++,o.matrix);}}}
 let h=0,m=0,f=0;for(const k in FILES){const g=G[k];if(!g)continue;g.lv.forEach((im,l)=>{im.count=g.n[l];im.instanceMatrix.needsUpdate=true;im.instanceColor.needsUpdate=true;});h+=g.n[0];m+=g.n[1];f+=g.n[2];}
 for(const [im,c] of [[TRL.r,nt],[TRL.b,nb],[TRL.s,ns]]){im.count=c;im.instanceMatrix.needsUpdate=true;if(im.instanceColor)im.instanceColor.needsUpdate=true;}stat.hi=h;stat.mid=m;stat.far=f;}
function build(){if(built||!root.THREE||typeof S==='undefined'||typeof BLD==='undefined'||typeof WROADS==='undefined'||!safe(()=>BLD.some(b=>b.kind==='house'&&b.w),false))return;built=true;safe(buildParked,null);safe(buildMoving,null);/* yoldaki araçlar da yol verilen araçlardır: köylü, hayvan ve asker önlerinden çekilir */safe(()=>root.HisarSinir.vehicleSource(()=>MOV),null);load();}
// hasar: ezilen araç yassılaşır ve kararır, yanan araç kapkara kalır (çizimde ölçek ve renkle)
function crush(c){if(c.dead)return;c.dead=1;stat.crushed++;}
function burn(c){if(c.burnt)return;c.burnt=1;c.dead=1;stat.burned++;}
const prev=new WeakMap();
function step(dt){if(!built)return;const movers=[];safe(()=>{if(mode==='tank')movers.push(P);},null);for(const a of safe(()=>AL,[]))if(!a.dead)movers.push(a);for(const e of safe(()=>E,[]))if(e.type==='tank'||e.type==='apc')movers.push(e);
 const sp=new Map();for(const m of movers){const q=prev.get(m);prev.set(m,[m.x,m.z]);sp.set(m,q?Math.hypot(m.x-q[0],m.z-q[1])/Math.max(dt,1e-3):0);}
 for(const c of CARS){if(!crushable(c))continue;for(const m of movers){if(sp.get(m)>1.2&&Math.hypot(m.x-c.x,m.z-c.z)<c.r){crush(c);break;}}}
 for(const c of MOV){if(c.dead)continue;if(c.wait>0){c.wait-=dt;c.v=0;place(c,dt);continue;}const stop=blocked(c,movers,16,c.cov?5.4:4.5)/* katı kamyon yanındaki tankı itmesin diye daha geniş bakar */||blocked(c,CARS.filter(o=>o!==c),9+c.r,2.2);/* uzun araç daha erken durur */const tv=stop?0:c.vmax;c.v+=Math.max(-6*dt,Math.min(2*dt,tv-c.v));
  const s0=c.s;c.s+=c.v*dt;if(c.kind==='kamyon'){const e=arrived(s0,c.s,c.L);if(e>=0){c.wait=e===c.border?PAUSE.border:PAUSE.back;c.v=0;}}place(c,dt);}}
function reset(){/* yeni görevde yanmış ve ezilmiş araçlar yerine konur */for(const c of CARS){c.dead=0;c.burnt=0;}stat.crushed=stat.burned=0;}
function wrap(name,factory){if(hooks[name]||typeof root[name]!=='function')return;root[name]=factory(root[name]);hooks[name]=true;}
function connect(){build();
 wrap('update',old=>function(dt){const r=old.apply(this,arguments);if(!built)safe(build,null);else if(!started)load();if(safe(()=>game==='play',false))safe(()=>step(Math.min(.1,+dt||0)),null);return r;});
 wrap('bigBoom',old=>function(x,z,r){const o=old.apply(this,arguments);safe(()=>{for(const c of CARS)if(!c.burnt&&Math.hypot(c.x-x,c.z-z)<(r||4)+2.5)burn(c);},null);return o;});
 wrap('startMission',old=>function(){if(stat.crushed||stat.burned)safe(reset,null);return old.apply(this,arguments);});
 if(!hooks.frame&&typeof FRAME_HOOKS!=='undefined'){hooks.frame=true;FRAME_HOOKS.push(()=>safe(draw,null));}}
root.HisarSivil=Object.freeze({version:VERSION,core,connect,cars:()=>CARS.map(c=>({kind:c.kind,x:Math.round(c.x*10)/10,z:Math.round(c.z*10)/10,y:c.y,h:c.h,pitch:c.pitch||0,parked:!!c.parked,dead:!!c.dead,burnt:!!c.burnt,v:c.v||0,wait:c.wait||0,trailer:!!c.trailer})),
 diagnostics:()=>({version:VERSION,built,hooks:{...hooks},...stat})});
connect();doc.addEventListener('hisar:ui-ready',connect);
})(typeof window!=='undefined'?window:globalThis);
