/* ÇELİK BÖRÜ çevre 1.0 — sınırın iki yakasını ayıran ayrıntılar.
 * - Türkiye: köy yolları boyunca elektrik direkleri ve aralarında sarkan teller. Tank direğe çarparsa direk devrilir, telleri düşer.
 * - Suriye: şebeke çökmüş; direklerin yarısı yok, kalanı eğik ve telsiz. Köy çevrelerinde ve yol kenarlarında mermi çukurları ve is lekeleri.
 * - Ufukta, Suriye içlerinde yükselen kara duman sütunları (uzak çatışma).
 * Direkler, traversler ve çukurlar örnekli (instanced) çizilir; bütün teller tek çizgi geometrisidir.
 * Çekirdek saf işlevlerdir ve Node ile sınanır.
 */
(function(root){'use strict';
const VERSION='1.0.0';
const doc=root.document;
const safe=(f,d)=>{try{return f();}catch(e){return d;}};
// ---------- çekirdek ----------
const POLE=Object.freeze({h:8,gap:46,off:3.2,arm:1.5,sag:.9,seg:6});
// Yol çizgisi boyunca, her gap metrede bir, yolun soluna off metre açıkta direk noktaları
function poles(pts,w,o){o=o||POLE;const out=[];let need=o.gap/2;for(let i=1;i<pts.length;i++){const ax=pts[i-1][0],az=pts[i-1][1],dx=pts[i][0]-ax,dz=pts[i][1]-az,l=Math.hypot(dx,dz);if(!l)continue;const ux=dx/l,uz=dz/l;let s=need;
  while(s<=l){out.push({x:ax+ux*s+uz*(w/2+o.off),z:az+uz*s-ux*(w/2+o.off),h:Math.atan2(ux,uz)});s+=o.gap;}need=s-l;}return out;}
// İki uç arasında sarkan tel: n parçalı, ortada d metre sarkar
function sag(a,b,n,d){const out=[];for(let i=0;i<=n;i++){const t=i/n;out.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t-4*d*t*(1-t),a[2]+(b[2]-a[2])*t]);}return out;}
function hash(a,b){let h=Math.imul(a|0,374761393)+Math.imul(b|0,668265263)|0;h=Math.imul(h^h>>>13,1274126177);return ((h^h>>>16)>>>0)/4294967296;}
// Duman topağı: p (0..1) yükselme evresi → yükseklik, yana sürüklenme, boyut, saydamlık
function puff(p,H){return {y:p*H,drift:p*p*H*.55,s:9+p*40,a:.5*Math.min(1,p*7)*(1-p)};}
const core=Object.freeze({VERSION,POLE,poles,sag,hash,puff});
if(typeof module==='object'&&module.exports)module.exports=core;
if(!doc)return;
// ---------- oyun ----------
const hooks={},stat={poles:0,spans:0,syria:0,craters:0,columns:0,felled:0};let built=false,PM=null,AM=null,WIRE=null,list=[],COLS=[],clock=0;
const RV=x=>safe(()=>riv(x),120),WSZ=()=>Math.min(800,safe(()=>WS,800));
function okSpot(x,z){if(Math.abs(x)>WSZ()-10||Math.abs(z)>WSZ()-10)return false;if(Math.abs(z-RV(x))<42)return false;if(safe(()=>hAt(x,z),0)<-.3)return false;if(safe(()=>roadNear(x,z,1),false))return false;
 if(safe(()=>BLD.some(b=>!b.dead&&Math.hypot(b.x-x,b.z-z)<b.r+1.5),false))return false;if(safe(()=>COV.some(c=>Math.hypot(c.x-x,c.z-z)<c.r+2),false))return false;
 return !safe(()=>root.HisarField.positions().some(q=>Math.hypot(q.x-x,q.z-z)<13),false);}
function put(p,o){o.position.set(p.x,p.y,p.z);o.rotation.set(0,p.h,0);if(p.tilt){o.rotateOnWorldAxis(AX.set(p.ax,0,p.az),p.tilt);}o.updateMatrix();PM.setMatrixAt(p.i,o.matrix);AM.setMatrixAt(p.i,o.matrix);}
let AX=null;
function buildPoles(T){AX=new T.Vector3();const all=[];let chain=0;
 for(const r of safe(()=>WROADS,[])){const ps=poles(r.pts,r.w||6);let prev=null;chain++;
  ps.forEach((p,k)=>{const sy=p.z>RV(p.x);if(!okSpot(p.x,p.z)){prev=null;return;}if(all.some(q=>Math.hypot(q.x-p.x,q.z-p.z)<14)){prev=null;return;}
   if(sy&&hash(all.length,chain)<.45){prev=null;return;}p.sy=sy;p.y=safe(()=>hAt(p.x,p.z),0)-.3;p.i=all.length;
   if(sy){const a=hash(p.i,5)*6.283;p.tilt=.05+hash(p.i,9)*.24;p.ax=Math.cos(a);p.az=Math.sin(a);stat.syria++;}
   p.prev=(!sy&&prev&&!prev.sy&&Math.hypot(prev.x-p.x,prev.z-p.z)<POLE.gap*1.4)?prev:null;all.push(p);prev=p;});}
 if(!all.length)return;const n=all.length,pg=new T.CylinderGeometry(.09,.13,POLE.h,7);pg.translate(0,POLE.h/2,0);const ag=new T.BoxGeometry(POLE.arm,.09,.09);ag.translate(0,POLE.h-.45,0);
 PM=new T.InstancedMesh(pg,new T.MeshLambertMaterial({color:0x6b5a45}),n);AM=new T.InstancedMesh(ag,new T.MeshLambertMaterial({color:0x4a4038}),n);const o=new T.Object3D();for(const p of all)put(p,o);
 for(const m of[PM,AM]){m.castShadow=true;m.frustumCulled=false;m.name='CV_DIREK';S.add(m);}
 // teller: her açıklıkta traversin iki ucundan iki tel
 const pos=[];const end=(p,s)=>[p.x+Math.cos(p.h)*s*POLE.arm*.45,p.y+POLE.h-.4,p.z-Math.sin(p.h)*s*POLE.arm*.45];
 for(const p of all){if(!p.prev)continue;p.w0=pos.length/3;for(const s of[-1,1]){const c=sag(end(p.prev,s),end(p,s),POLE.seg,POLE.sag);for(let i=1;i<c.length;i++)pos.push(...c[i-1],...c[i]);}p.w1=pos.length/3;stat.spans++;}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));WIRE=new T.LineSegments(g,new T.LineBasicMaterial({color:0x1b1b1b,transparent:true,opacity:.75}));WIRE.frustumCulled=false;WIRE.name='CV_TEL';S.add(WIRE);
 list=all;stat.poles=n;}
function cutWire(p){if(!WIRE||p.w0==null)return;const a=WIRE.geometry.attributes.position;for(let i=p.w0;i<p.w1;i++)a.setXYZ(i,0,-99,0);a.needsUpdate=true;p.cut=1;}
// Suriye: mermi çukurları ve is lekeleri (yere yatık, kenarı yumuşak koyu daireler)
function buildCraters(T){const pts=[];const seeds=[];safe(()=>VILS.forEach((v,i)=>{if(v[1]>RV(v[0])+40)for(let k=0;k<9;k++)seeds.push([v[0],v[1],i*20+k,25+hash(i,k)*110]);}),null);
 safe(()=>WROADS.forEach((r,i)=>r.pts.forEach((p,k)=>{if(p[1]>RV(p[0])+60&&hash(i,k)<.4)seeds.push([p[0],p[1],900+i*30+k,5+hash(k,i)*14]);})),null);
 for(const s of seeds){const a=hash(s[2],3)*6.283,x=s[0]+Math.cos(a)*s[3],z=s[1]+Math.sin(a)*s[3];if(Math.abs(x)>WSZ()-10||Math.abs(z)>WSZ()-10||z<RV(x)+35)continue;if(safe(()=>hAt(x,z),0)<-.2)continue;
  if(safe(()=>BLD.some(b=>!b.dead&&Math.hypot(b.x-x,b.z-z)<b.r+1),false))continue;pts.push({x,z,s:1.6+hash(s[2],7)*3.2});}
 if(!pts.length)return;const c=doc.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),gr=g.createRadialGradient(32,32,2,32,32,31);gr.addColorStop(0,'rgba(18,15,12,.92)');gr.addColorStop(.35,'rgba(35,28,22,.8)');gr.addColorStop(.7,'rgba(60,50,40,.35)');gr.addColorStop(1,'rgba(60,50,40,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);
 const geo=new T.CircleGeometry(1,18);geo.rotateX(-Math.PI/2);const m=new T.InstancedMesh(geo,new T.MeshBasicMaterial({map:new T.CanvasTexture(c),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}),pts.length),o=new T.Object3D();
 pts.forEach((p,i)=>{o.position.set(p.x,safe(()=>hAt(p.x,p.z),0)+.07,p.z);o.scale.set(p.s,1,p.s*(.8+hash(i,2)*.4));o.rotation.set(0,hash(i,4)*6.28,0);o.updateMatrix();m.setMatrixAt(i,o.matrix);});
 m.frustumCulled=false;m.renderOrder=1;m.name='CV_CUKUR';S.add(m);stat.craters=pts.length;}
// Ufukta duman sütunları: uzak çatışmanın işareti
const SMOKE=[[-420,720],[210,770],[640,735],[-735,650]],PUFFS=7,COLH=95;
function buildSmoke(T){const c=doc.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),gr=g.createRadialGradient(32,32,3,32,32,31);gr.addColorStop(0,'rgba(30,28,27,1)');gr.addColorStop(.5,'rgba(48,45,43,.7)');gr.addColorStop(1,'rgba(60,57,55,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);const tex=new T.CanvasTexture(c);
 SMOKE.forEach((q,ci)=>{if(Math.abs(q[0])>WSZ()-20||q[1]>WSZ()-20)return;const y=safe(()=>hAt(q[0],q[1]),0),col={x:q[0],z:q[1],y,sp:[],k:.035+hash(ci,1)*.02};
  for(let i=0;i<PUFFS;i++){const s=new T.Sprite(new T.SpriteMaterial({map:tex,transparent:true,depthWrite:false,opacity:0,fog:false}));s.name='CV_DUMAN';S.add(s);col.sp.push(s);}COLS.push(col);});
 stat.columns=COLS.length;smokeStep(0);}
function smokeStep(dt){clock+=dt;COLS.forEach((c,ci)=>c.sp.forEach((s,i)=>{const p=((clock*c.k+i/PUFFS+ci*.13)%1),q=puff(p,COLH);s.position.set(c.x+q.drift,c.y+4+q.y,c.z+Math.sin(clock*.2+i)*2);s.scale.set(q.s,q.s,1);s.material.opacity=q.a;}));}
function build(){if(built||!root.THREE||typeof S==='undefined'||typeof WROADS==='undefined'||!safe(()=>BLD.some(b=>b.kind==='house'&&b.w),false))return;built=true;const T=root.THREE;safe(()=>buildPoles(T),null);safe(()=>buildCraters(T),null);safe(()=>buildSmoke(T),null);}
const prev=new WeakMap();
function step(dt){if(!built)return;smokeStep(dt);if(!PM)return;const movers=[];safe(()=>{if(mode==='tank')movers.push(P);},null);for(const a of safe(()=>AL,[]))if(!a.dead)movers.push(a);for(const e of safe(()=>E,[]))if(e.type==='tank'||e.type==='apc')movers.push(e);let ch=false;const o=new root.THREE.Object3D();
 for(const m of movers){const q=prev.get(m);prev.set(m,[m.x,m.z]);if(!q)continue;const vx=(m.x-q[0])/Math.max(dt,1e-3),vz=(m.z-q[1])/Math.max(dt,1e-3),v=Math.hypot(vx,vz);if(v<1.2||v>40)continue;
  for(const p of list){if(p.t!=null||Math.abs(p.x-m.x)>2.4||Math.abs(p.z-m.z)>2.4)continue;p.t=0;p.t0=p.tilt||0;p.ax=vz/v;p.az=-vx/v;stat.felled++;cutWire(p);const nx=list.find(n=>n.prev===p);if(nx)cutWire(nx);}}
 for(const p of list){if(p.t==null||p.t>1)continue;p.t+=dt;p.tilt=p.t0+(1.5-p.t0)*Math.min(1,p.t*p.t);put(p,o);ch=true;}if(ch){PM.instanceMatrix.needsUpdate=true;AM.instanceMatrix.needsUpdate=true;}}
function reset(){if(!stat.felled||!PM)return;/* yeni görevde direkler ve teller yerine konur */for(const m of[PM,AM,WIRE]){if(!m)continue;S.remove(m);m.geometry.dispose();}PM=AM=WIRE=null;list=[];stat.poles=stat.spans=stat.syria=stat.felled=0;safe(()=>buildPoles(root.THREE),null);}
function wrap(name,factory){if(hooks[name]||typeof root[name]!=='function')return;root[name]=factory(root[name]);hooks[name]=true;}
function connect(){build();wrap('update',old=>function(dt){const r=old.apply(this,arguments);if(!built)safe(build,null);if(safe(()=>game==='play',false))safe(()=>step(Math.min(.1,+dt||0)),null);return r;});
 wrap('startMission',old=>function(){safe(reset,null);return old.apply(this,arguments);});}
root.HisarCevre=Object.freeze({version:VERSION,core,connect,poles:()=>list.map(p=>({x:p.x,z:p.z,sy:!!p.sy,down:p.t!=null,wired:!!p.prev&&!p.cut})),diagnostics:()=>({version:VERSION,built,hooks:{...hooks},...stat})});
connect();doc.addEventListener('hisar:ui-ready',connect);
})(typeof window!=='undefined'?window:globalThis);
