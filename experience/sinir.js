/* ÇELİK BÖRÜ sınır 1.0 — haritanın kuzeyi Türkiye, güneyi Suriye; sınır nehir boyuncadır.
 * - Sınır duvarı: nehrin kuzey kıyısında beton bloklar, üstünde jiletli tel. Yalnız geçitlerdeki sınır kapılarından geçilir
 *   (oyuncu, dost ve düşman araçları için; rota bulma da duvarı bilir).
 * - Nöbetçi kuleleri (içinde nöbetçi), geçitlerin yanında sınır karakolları (bina, gönderde büyük bayrak, kum torbası, kapı nöbetçileri),
 *   duvar boyunca ikişerli devriye.
 * - Türkiye tarafındaki bütün evlerde Türk bayrağı (balkon, pencere, dam gönderi); köylerde okul ve okul bahçesinde bayrak.
 * - Sivil yerleşime düşen mermide "Sivil yerleşim hedef alanında" uyarısı.
 * - İnsan figürleri tek çizimli parçalardan kurulur (kutu ve küre); eklem açılarıyla yürür, durur, selam verir.
 * Çekirdek saf işlevlerdir ve Node ile sınanır.
 */
(function(root){'use strict';
const VERSION='1.0.0';
const doc=root.document;
const safe=(f,d)=>{try{return f();}catch(e){return d;}};
const clamp=(v,a,b)=>v<a?a:v>b?b:v;

// ---------- çekirdek (sınanabilir) ----------
// Türk bayrağı ölçüleri (Türk Bayrağı Kanunu; G = yükseklik). Değerler 1200×800 tuval birimindedir.
// Dış ay merkezi gönderden 1/2 G (+ gömlek 1/30 G), dış ay çapı 1/2 G, iki merkez arası 1/16 G, iç ay çapı 2/5 G,
// yıldızı çevreleyen çemberin çapı 1/4 G; yıldızın bir ucu aya bakar.
const FLAG=Object.freeze({w:1200,h:800,outer:Object.freeze({x:425,r:200}),inner:Object.freeze({x:475,r:160}),star:Object.freeze({x:666.67,r:100}),red:'#e30a17'});
// Beş köşeli yıldızın on noktası; ilk nokta sola (aya) bakar.
function starPts(cx,cy,R){const r=R*Math.sin(Math.PI/10)/Math.sin(7*Math.PI/10),out=[];for(let i=0;i<10;i++){const a=Math.PI+i*Math.PI/5,k=i%2?r:R;out.push([cx+Math.cos(a)*k,cy+Math.sin(a)*k]);}return out;}
// Duvar nehrin kuzey kıyısından 26 m içeridedir; geçitlerde 14 m açıklık (sınır kapısı) vardır.
const WALL=Object.freeze({back:26,gate:14,block:2.4,high:3.6,road:13,tower:150,towerSkip:55});
const wallZ=(riv,x)=>riv(x)-WALL.back;
const atGate=(fords,x)=>fords.some(f=>Math.abs(x-f)<WALL.gate);
// Önceki ve yeni konum duvarın iki ayrı yanındaysa ve kapıdan geçmiyorsa geçiş engellenir. Işınlama (6 m'den uzun sıçrama) sayılmaz.
function blocked(riv,fords,x0,z0,x1,z1){if(Math.hypot(x1-x0,z1-z0)>6)return false;const s0=z0<wallZ(riv,x0),s1=z1<wallZ(riv,x1);if(s0===s1)return false;return !atGate(fords,(x0+x1)/2)&&!atGate(fords,x1);}
// Dost tank duvarın öbür yanına gidecekse önce en yakın kapının önüne, oradan kapının öbür yanına yönelir.
function via(riv,fords,ax,az,tx,tz){const sa=az<wallZ(riv,ax),st=tz<wallZ(riv,tx);if(sa===st||atGate(fords,ax))return {x:tx,z:tz};
 let g=fords[0];for(const f of fords)if(Math.abs(f-ax)+Math.abs(f-tx)<Math.abs(g-ax)+Math.abs(g-tx))g=f;const w=wallZ(riv,g),near={x:g,z:w+(sa?-12:12)},far={x:g,z:w+(sa?12:-12)};
 return Math.hypot(ax-near.x,az-near.z)<6?far:near;}
function towersAlong(fords,ws){const out=[];for(let x=-ws+60;x<=ws-60;x+=WALL.tower)if(fords.every(f=>Math.abs(x-f)>WALL.towerSkip))out.push(x);return out;}
// Türkiye tarafı: duvarın kuzeyi
const turkish=(riv,x,z)=>z<wallZ(riv,x)-4;
// Figür duruşları: eklem adı → [x,y,z] açı. Sağ kol -x yanındadır (figür +z'ye bakar).
function pose(kind,t,o){o=o||{};const P={};
 if(kind==='yuru'||kind==='nobet-yuru'){const s=Math.sin(t),a=o.amp||.55;P.LL=[s*a,0,0];P.LR=[-s*a,0,0];P.G=[0,0,0];P.GY=Math.abs(Math.cos(t))*.04;if(kind==='yuru'){P.UL=[-s*a*.7,0,.06];P.UR=[s*a*.7,0,-.06];P.FL=[-.25,0,0];P.FR=[-.25,0,0];}}
 if(kind==='dur'){P.UL=[0,0,.07];P.UR=[0,0,-.07];P.FL=[-.12,0,0];P.FR=[-.12,0,0];}
 if(kind==='nobet'||kind==='nobet-yuru'){P.UL=[-.55,0,-.2];P.FL=[-1.25,0,0];P.UR=[-.45,0,.15];P.FR=[-1.45,0,0];}
 if(kind==='selam'){P.UL=[0,0,.07];P.FL=[-.1,0,0];P.UR=[-.35,0,-1.3];P.FR=[0,0,-2.55];P.H=[-.05,0,0];}
 if(kind==='el-salla'){P.UL=[0,0,.07];P.FL=[-.1,0,0];P.UR=[0,0,-2.6];P.FR=[0,0,Math.sin(t*7)*.45];}
 if(o.look)P.H=[(P.H||[0])[0],o.look,0];return P;}
const core=Object.freeze({VERSION,FLAG,starPts,WALL,wallZ,atGate,blocked,via,towersAlong,turkish,pose});
if(typeof module==='object'&&module.exports)module.exports=core;
if(!doc)return;

// ---------- oyun ----------
const hooks={};const stat={blocks:0,coils:0,towers:0,posts:0,flags:0,poleFlags:0,schools:[],soldiers:0,crossBlocked:0,civil:0,figuresDrawn:0};
let built=false,T=null,flagTex=null,crowd=null,waves=[],fhouse=[],clock=0;
const W=()=>root.WS||800,FD=()=>safe(()=>FORDS,[]),RV=x=>safe(()=>riv(x),120);

function drawFlag(c,w,h){const g=c.getContext('2d'),k=w/FLAG.w;g.fillStyle=FLAG.red;g.fillRect(0,0,w,h);g.fillStyle='#fff';
 g.beginPath();g.arc(FLAG.outer.x*k,h/2,FLAG.outer.r*k,0,7);g.fill();g.fillStyle=FLAG.red;g.beginPath();g.arc(FLAG.inner.x*k,h/2,FLAG.inner.r*k,0,7);g.fill();
 g.fillStyle='#fff';g.beginPath();starPts(FLAG.star.x*k,h/2,FLAG.star.r*k).forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.closePath();g.fill();}
function makeFlagTex(){const c=doc.createElement('canvas');c.width=240;c.height=160;drawFlag(c,240,160);const t=new T.CanvasTexture(c);t.anisotropy=4;return t;}
// Dalgalanan bayrak: gönder kenarı x=0'da; köşe noktaları her karede yeniden hesaplanır (iki ayrı evreli örgü)
function waveGeo(){const g=new T.PlaneGeometry(1,2/3,12,2);g.translate(.5,0,0);g.userData.x0=Float32Array.from(g.attributes.position.array);return g;}
function waveStep(t){for(const w of waves){const a=w.geometry.attributes.position.array,x0=w.geometry.userData.x0;for(let i=0;i<a.length;i+=3){const x=x0[i],y=x0[i+1];
  a[i+2]=Math.sin(x*5.2-t*5.4+w.userData.ph+y*.9)*.07*x+Math.sin(x*11-t*8.3)*.015*x;a[i+1]=y-x*x*.05;}w.geometry.attributes.position.needsUpdate=true;w.geometry.computeVertexNormals();}}
function flagMesh(n){const geo=waveGeo(),m=new T.InstancedMesh(geo,new T.MeshLambertMaterial({map:flagTex,side:T.DoubleSide}),n);m.count=0;m.frustumCulled=false;m.userData.ph=waves.length*1.7;waves.push(m);m.name='SN_BAYRAK';S.add(m);return m;}

// ---------- figürler: parçalar tek çizimli kutu/küre örgülerinde ----------
const SKIN=[0xc99a78,0xb98a68,0xd8aa88,0xa87a58];
// Parça: g kutu/küre, u üst parça, p eklem (üst parçaya göre), j eklem adı, o parça merkezi (ekleme göre), s boyut, c renk anahtarı
const RIG=[
 {g:'b',u:-1,p:[0,.92,0],j:'G',o:[0,0,0],s:[.34,.16,.22],c:'alt'},
 {g:'b',u:0,p:[.1,-.03,0],j:'LL',o:[0,-.43,0],s:[.15,.86,.17],c:'alt'},{g:'b',u:0,p:[-.1,-.03,0],j:'LR',o:[0,-.43,0],s:[.15,.86,.17],c:'alt'},
 {g:'b',u:1,p:[0,-.86,0],o:[0,-.03,.05],s:[.15,.1,.28],c:'bot'},{g:'b',u:2,p:[0,-.86,0],o:[0,-.03,.05],s:[.15,.1,.28],c:'bot'},
 {g:'b',u:0,p:[0,.06,0],j:'T',o:[0,.3,0],s:[.42,.6,.25],c:'ust'},
 {g:'b',u:5,p:[0,0,0],o:[0,.33,.01],s:[.46,.46,.3],c:'yel',only:'asker'},
 {g:'s',u:5,p:[0,.62,0],j:'H',o:[0,.12,.01],s:[.21,.25,.23],c:'ten'},
 {g:'s',u:7,p:[0,0,0],o:[0,.19,-.01],s:[.28,.19,.3],c:'kask',only:'asker'},
 {g:'b',u:5,p:[.27,.56,0],j:'UL',o:[0,-.15,0],s:[.11,.32,.12],c:'ust'},{g:'b',u:9,p:[0,-.3,0],j:'FL',o:[0,-.14,0],s:[.1,.3,.11],c:'ust'},{g:'s',u:10,p:[0,-.3,0],o:[0,-.04,0],s:[.08,.09,.08],c:'ten'},
 {g:'b',u:5,p:[-.27,.56,0],j:'UR',o:[0,-.15,0],s:[.11,.32,.12],c:'ust'},{g:'b',u:12,p:[0,-.3,0],j:'FR',o:[0,-.14,0],s:[.1,.3,.11],c:'ust'},{g:'s',u:13,p:[0,-.3,0],o:[0,-.04,0],s:[.08,.09,.08],c:'ten'},
 {g:'b',u:13,p:[0,-.27,0],o:[.24,0,.02],s:[.86,.07,.05],c:'tufek',only:'asker',rz:-.35}];
const ASKER={alt:0x4e5636,bot:0x2a2620,ust:0x5d6640,yel:0x46502f,kask:0x4a5233,tufek:0x1d1f1c};
function Crowd(cap){const box=new T.BoxGeometry(1,1,1),sph=new T.SphereGeometry(.5,10,8),mat=new T.MeshLambertMaterial({color:0xffffff});
 const mk=(geo,n,name)=>{const m=new T.InstancedMesh(geo,mat,n);m.instanceColor=new T.InstancedBufferAttribute(new Float32Array(n*3).fill(1),3);m.count=0;m.frustumCulled=false;m.name=name;S.add(m);return m;};
 const B=mk(box,cap*13,'SN_FIG_K'),Sp=mk(sph,cap*4,'SN_FIG_Y'),figs=[],m4=new T.Matrix4(),tmp=new T.Matrix4(),eu=new T.Euler(),col=new T.Color(),F=[],zero=new T.Matrix4().makeScale(0,0,0),t2=new T.Matrix4(),V=new T.Vector3();
 for(let i=0;i<RIG.length;i++)F.push(new T.Matrix4());
 function add(kind,colors,o){const f={kind,x:o.x,y:o.y,z:o.z,yaw:o.yaw||0,sc:o.sc||1,act:o.act||'dur',t:Math.random()*6,look:0,idx:[],vis:true,live:true};
  for(let i=0;i<RIG.length;i++){const q=RIG[i];if(q.only&&q.only!==kind){f.idx.push(null);continue;}const m=q.g==='b'?B:Sp;if(m.count>=(q.g==='b'?cap*13:cap*4)){f.idx.push(null);continue;}const k=m.count++;
   col.setHex(q.c==='ten'?SKIN[figs.length%SKIN.length]:(colors[q.c]!=null?colors[q.c]:0x808080));m.setColorAt(k,col);f.idx.push([m,k]);}
  B.instanceColor.needsUpdate=Sp.instanceColor.needsUpdate=true;figs.push(f);return f;}
 function draw(f){const P=pose(f.act,f.t,{look:f.look});const base=m4.makeRotationY(f.yaw).setPosition(f.x,f.y+(P.GY||0),f.z);if(f.sc!==1)base.scale(V.set(f.sc,f.sc,f.sc));
  for(let i=0;i<RIG.length;i++){const q=RIG[i],a=q.j&&P[q.j];const parent=q.u<0?base:F[q.u];F[i].copy(parent).multiply(t2.makeTranslation(q.p[0],q.p[1],q.p[2]));
   if(a){eu.set(a[0],a[1],a[2]);F[i].multiply(t2.makeRotationFromEuler(eu));}
   const id=f.idx[i];if(!id)continue;const M=tmp.copy(F[i]).multiply(t2.makeTranslation(q.o[0],q.o[1],q.o[2]));if(q.rz)M.multiply(t2.makeRotationZ(q.rz));M.scale(V.set(q.s[0],q.s[1],q.s[2]));id[0].setMatrixAt(id[1],M);}}
 function hide(f){for(const id of f.idx)if(id)id[0].setMatrixAt(id[1],zero);}
 function frame(cx,cz,range){let n=0;for(const f of figs){const near=f.live&&Math.hypot(f.x-cx,f.z-cz)<range;if(near){draw(f);n++;f.vis=true;}else if(f.vis){hide(f);f.vis=false;}}
  B.instanceMatrix.needsUpdate=Sp.instanceMatrix.needsUpdate=true;return n;}
 return {add,frame,figs};}

// ---------- sınır yapıları ----------
function buildWall(){const fords=FD(),ws=W(),xs=[];for(let x=-ws+4;x<=ws-4;x+=WALL.block)if(!atGate(fords,x))xs.push(x);
 const box=new T.BoxGeometry(1,1,1),con=new T.MeshLambertMaterial({color:0xcdc9be}),foot=new T.MeshLambertMaterial({color:0x8f8b82});
 const bl=new T.InstancedMesh(box,con,xs.length),ft=new T.InstancedMesh(box,foot,xs.length),coilG=new T.TorusGeometry(.3,.016,3,9),coilM=new T.MeshLambertMaterial({color:0x6c7073});
 const step=.7,nc=Math.ceil(xs.length*WALL.block/step),co=new T.InstancedMesh(coilG,coilM,nc),o=new T.Object3D();let k=0;
 xs.forEach((x,i)=>{const z=wallZ(RV,x),dz=RV(x+1)-RV(x-1),yaw=Math.atan2(2,dz)-Math.PI/2,h=Math.min(hAt(x,z),hAt(x,z-.6),hAt(x,z+.6));
  o.position.set(x,h+WALL.high/2-.25,z);o.rotation.set(0,-Math.atan2(dz,2),0);o.scale.set(WALL.block-.06,WALL.high,.32);o.updateMatrix();bl.setMatrixAt(i,o.matrix);
  o.position.set(x,h+.05,z);o.scale.set(WALL.block-.02,.6,1.1);o.updateMatrix();ft.setMatrixAt(i,o.matrix);
  for(let s=0;s<WALL.block-.1&&k<nc;s+=step){const xx=x-WALL.block/2+s+step/2;o.position.set(xx,h+WALL.high-.25+.28,wallZ(RV,xx));o.rotation.set(0,-Math.atan2(dz,2)+Math.PI/2,0);o.scale.set(1,1,1);o.updateMatrix();co.setMatrixAt(k++,o.matrix);}});
 co.count=k;for(const m of [bl,ft,co]){m.frustumCulled=false;m.name='SN_DUVAR';S.add(m);}stat.blocks=xs.length;stat.coils=k;}
// Devriye yolu: duvarın Türkiye yanında, duvara koşut çakıllı yol (kapılarda yola bağlanır)
function patrolRoad(){const ws=W(),xs=[];for(let x=-ws+6;x<=ws-6;x+=4)xs.push(x);const m=new T.InstancedMesh(new T.BoxGeometry(1,1,1),new T.MeshLambertMaterial({color:0xa99d80,polygonOffset:true,polygonOffsetFactor:-2}),xs.length),o=new T.Object3D();
 xs.forEach((x,i)=>{const z=wallZ(RV,x)-WALL.road,dz=RV(x+2)-RV(x-2);o.position.set(x,Math.max(hAt(x,z),hAt(x-2,z),hAt(x+2,z))+.04,z);o.rotation.set(0,-Math.atan2(dz,4),0);o.scale.set(4.3,.08,5);o.updateMatrix();m.setMatrixAt(i,o.matrix);});
 m.frustumCulled=false;m.name='SN_DEVRIYE_YOLU';S.add(m);}
// Unimog devriyesi: yeşil kasa, brandalı arka; devriye yolunda iki kapı arasında gider, uca varınca döner. Oyuncu önündeyse durur.
function mkUnimog(){const g=new T.Group(),M=c=>new T.MeshLambertMaterial({color:c}),b=(w,h,d,c,x,y,z)=>{const m=new T.Mesh(new T.BoxGeometry(w,h,d),M(c));m.position.set(x,y,z);g.add(m);return m;};
 b(2.1,.45,5.4,0x2a2c26,0,.95,0);b(2.15,1.45,1.9,0x55603c,0,1.85,1.55);b(1.9,.6,.06,0x1c2228,0,2.15,2.51);b(2.25,.35,2.1,0x4d5737,0,1.2,2.35);
 b(2.2,.45,3.2,0x4d5737,0,1.4,-1.05);b(2.2,1.3,3.1,0x6d6b4c,0,2.25,-1.05);b(2.2,.1,3.15,0x5d5b40,0,2.93,-1.05);
 const wg=new T.CylinderGeometry(.55,.55,.42,12);wg.rotateZ(Math.PI/2);const wm=M(0x1b1b1b),wheels=[];for(const[x,z]of[[-.98,1.7],[.98,1.7],[-.98,-1.8],[.98,-1.8]]){const w=new T.Mesh(wg,wm);w.position.set(x,.55,z);g.add(w);wheels.push(w);}
 g.userData.wheels=wheels;return g;}
let UNI=[];
function unimogs(){const f=FD().slice().sort((a,b)=>a-b),ws=W(),segs=[];let a=-ws+20;for(const x of f){if(x-a>120)segs.push([a,x-18]);a=x+18;}if(ws-20-a>120)segs.push([a,ws-20]);
 segs.filter((q,i)=>i%2===0||segs.length<4).slice(0,4).forEach((sg,i)=>{const g=mkUnimog();g.name='SN_UNIMOG';S.add(g);UNI.push({g,a:sg[0],b:sg[1],x:sg[0]+(sg[1]-sg[0])*(.2+.5*(i%2)),dir:i%2?-1:1,v:7,yaw:0,stop:0});});}
function unimogStep(dt){for(const u of UNI){const ahead={x:u.x+u.dir*9,z:wallZ(RV,u.x+u.dir*9)-WALL.road};const blockP=safe(()=>Math.hypot(P.x-ahead.x,P.z-ahead.z)<8,false);
  const v=blockP?0:u.v;u.x+=u.dir*v*dt;if(u.x>u.b){u.x=u.b;u.dir=-1;}if(u.x<u.a){u.x=u.a;u.dir=1;}const z=wallZ(RV,u.x)-WALL.road,dz=wallZ(RV,u.x+u.dir)-wallZ(RV,u.x);
  const ty=Math.atan2(u.dir,dz);let d=ty-u.yaw;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;u.yaw+=d*Math.min(1,dt*2.2);
  const y=safe(()=>hAt(u.x,z),0);u.g.position.set(u.x,y,z);u.g.rotation.y=u.yaw;for(const w of u.g.userData.wheels)w.rotation.x+=v*dt/.55;u.z=z;}}
// Ülke göstergesi: oyunda ekranın üstünde bulunduğun ülke ve sınıra uzaklık
let chip=null;
function chipStep(){if(!doc.body)return;if(!chip){chip=doc.createElement('div');chip.id='sn-ulke';const st=doc.createElement('style');st.textContent=`#sn-ulke{position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 84px);transform:translateX(-50%);z-index:12;display:flex;align-items:center;gap:8px;padding:5px 11px 5px 6px;border-radius:6px;background:rgba(12,13,12,.78);border:1px solid rgba(255,255,255,.12);color:#f4f2ec;font:800 13px/1 var(--sf,system-ui);letter-spacing:.1em;pointer-events:none;white-space:nowrap}
#sn-ulke img{width:27px;height:18px;border-radius:2px;display:block}#sn-ulke small{font:700 11.5px/1 var(--sf,system-ui);letter-spacing:.04em;color:#b9bbb3}#sn-ulke.sy{border-color:rgba(226,74,59,.7)}#sn-ulke.sy img{display:none}
body:not(.inplay) #sn-ulke{display:none}`;doc.head.appendChild(st);const im=doc.createElement('img');im.alt='';const c=doc.createElement('canvas');c.width=60;c.height=40;drawFlag(c,60,40);im.src=c.toDataURL();
  chip.append(im,doc.createElement('b'),doc.createElement('small'));doc.body.appendChild(chip);}
 const x=safe(()=>P.x,0),z=safe(()=>P.z,0),tr=z<wallZ(RV,x),d=Math.round(Math.abs(z-wallZ(RV,x)));chip.classList.toggle('sy',!tr);chip.children[1].textContent=tr?'TÜRKİYE':'SURİYE';chip.children[2].textContent='sınır '+d+' m';stat.country=tr?'TR':'SY';}
// Bina kurar: BX ile aynı çizim, çarpışma ve yıkılma düzeni
const make=(x,z,rot,r,hp,kind,fn)=>safe(()=>BX.make(x,z,rot,r,hp,kind,fn),null);
function gates(flags){for(const f of FD()){const z=wallZ(RV,f);
  for(const s of [-1,1]){const x=f+s*WALL.gate;make(x,z,0,1.1,999,'kapi',(b,part)=>{part('t',0,2,0,1.2,4.2,1.2,0,0xb5b1a8);part('t',0,4.2,0,1.5,.25,1.5,0,0x8f8b82);return 4.3;});}
  // kalkık bariyer kolu ve kulübe
  const bx=f-WALL.gate+2.4,bz=z-4;make(bx,bz-3,0,1.6,999,'kapi',(b,part,win)=>{part('w',0,1.4,0,2.2,2.8,2.2,0,0xe6e2d6);part('t',0,2.95,0,2.6,.2,2.6,0,0x6e6a64);win(0,1.6,1.12,1.2,.8,0);return 3;});
  make(f+WALL.gate-1.2,z-1.2,0,.6,999,'kapi',(b,part)=>{part('t',0,.6,0,.5,1.2,.5,0,0x2a2a2a);for(let i=0;i<6;i++)part('t',-.1,1.3+i*.75,0,.14,.75,.14,0,i%2?0xf2f2f2:0xd2261d);return 5.6;});
  flags.push({x:f-WALL.gate,z:z-.8,y:hAt(f-WALL.gate,z)+4.35,h:2.6,s:1.5});}}
function towers(){const out=[];for(const x of towersAlong(FD(),W())){const z=wallZ(RV,x)-8;
  const b=make(x,z,0,1.6,6,'kule',(b,part)=>{part('t',0,4,0,1.3,8,1.3,0,0xb5b2aa);part('t',0,8.55,0,2.9,1.1,2.9,0,0xd8d4c8);
   for(const[a,c]of[[-1,-1],[1,-1],[-1,1],[1,1]])part('t',a*1.35,9.75,c*1.35,.14,1.3,.14,0,0x8a8680);part('t',0,10.5,0,3.3,.25,3.3,0,0x6e6a64);return 10.6;});
  if(b)out.push({x,z,y:hAt(x,z)});}stat.towers=out.length;return out;}
function postSpot(f){const z0=wallZ(RV,f);for(const[dx,dz]of[[-34,-44],[34,-44],[-40,-58],[40,-58],[-30,-70],[30,-70],[-52,-48],[52,-48]]){const x=f+dx,z=z0+dz;
  if(safe(()=>roadNear(x,z,10),true))continue;if(BLD.some(b=>!b.dead&&Math.hypot(b.x-x,b.z-z)<b.r+13))continue;let mn=1e9,mx=-1e9;for(const[a,c]of[[-9,-9],[9,-9],[-9,9],[9,9],[0,0]]){const h=hAt(x+a,z+c);mn=Math.min(mn,h);mx=Math.max(mx,h);}if(mx-mn>3)continue;return {x,z};}return null;}
function karakol(f,flags,crowdAdd){const s=postSpot(f);if(!s)return null;const rot=Math.atan2(f-s.x,wallZ(RV,f)-s.z);
 const b=make(s.x,s.z,rot,8,9,'karakol',(b,part,win)=>{const w=13,d=8,H=6;part('t',0,-.6,0,w+.4,2.4,d+.4,0,0x77716a);part('w',0,H/2+.6,0,w,H,d,0,0xe7e1cf);part('t',0,.9,0,w+.05,.6,d+.05,0,0x7a4a3a);
  part('t',0,H+.75,0,w+.6,.3,d+.6,0,0x6e6a64);for(let f2=0;f2<2;f2++){for(const x of[-4.6,-2.3,2.3,4.6])win(x,2.2+3*f2,d/2+.03,1,1.1,0);for(const x of[-4,0,4])win(x,2.2+3*f2,-d/2-.03,1,1.1,0);}
  part('d',0,1.75,d/2+.03,1.6,2.3,.12,0,0x2e3a2a);part('t',0,3.1,d/2+.9,3.4,.15,1.8,0,0xbdb8ae);part('t',0,4.6,d/2+.06,5.2,.8,.08,0,0x1d3d7a);return H+1;});
 if(!b)return null;const c=Math.cos(rot),sn=Math.sin(rot),L=(lx,lz)=>({x:s.x+lx*c+lz*sn,z:s.z-lx*sn+lz*c});
 // kum torbası siperi (önde iki kanat) ve bayrak gönderi
 for(const[lx,lz,w,ry]of[[-6,9,6,0],[6,9,6,0],[-10,6,4,1.57]]){const q=L(lx,lz);make(q.x,q.z,rot+ry,1.4,999,'torba',(b,part)=>{for(let i=0;i<3;i++)part('t',0,.25+i*.36,0,w-i*.25,.36,.7,0,i%2?0x9a8a62:0x8b7c57);return 1.1;});}
 const fp=L(0,13);make(fp.x,fp.z,0,.5,999,'gonder',(b,part)=>{part('t',0,7,0,.14,14,.14,0,0xe8e8e8);part('t',0,.3,0,1.2,.6,1.2,0,0xb5b1a8);return 14;});
 flags.push({x:fp.x,z:fp.z,y:hAt(fp.x,fp.z)+13.9,h:rot,s:4.2,big:1});
 for(const lx of[-2.4,2.4]){const q=L(lx,7.2);crowdAdd({x:q.x,z:q.z,yaw:rot,act:'nobet',gate:1});}
 return {x:s.x,z:s.z,rot,f,b,flag:fp,door:L(0,6)};}
// ---------- Türkiye tarafındaki evlerde bayrak ----------
const HOUSE={house:1,beton:1,apt:1,shop:1};
function houseFlags(){const list=BLD.filter(b=>b.parts&&HOUSE[b.kind]&&turkish(RV,b.x,b.z)&&b.w);const slots=[],poles=[];
 for(const b of list){const r=(safe(()=>b.x*7.31+b.z*3.17,0)%1+1)%1,front=(b.wins||[]).filter(w=>!w[3]&&w[2]>0);
  if(b.kind==='beton')slots.push({b,x:0,y:4.1,z:b.d/2+1.42,w:1.6});
  else if(b.kind==='shop')slots.push({b,x:0,y:3.75,z:b.d/2+.08,w:1.5});
  else if(front.length){const ws=b.kind==='apt'?front.filter((w,i)=>i%2===0).slice(0,3):[front[Math.floor(r*front.length)]];for(const w of ws)slots.push({b,x:w[0],y:w[1]+.02,z:w[2]+.1,w:w[4]+.06});}
  if(b.kind==='apt'||(b.kind!=='shop'&&r<.38))poles.push({b,x:b.kind==='beton'||b.kind==='apt'?b.w*.32:b.w*.38,y:b.h-(b.kind==='house'?.9:.1),z:-b.d*.15});}
 const geo=new T.PlaneGeometry(1,2/3,4,1),pa=geo.attributes.position;for(let i=0;i<pa.count;i++)pa.setZ(i,Math.sin((pa.getX(i)+.5)*Math.PI*2)*.025);geo.computeVertexNormals();
 const m=new T.InstancedMesh(geo,new T.MeshLambertMaterial({map:flagTex,side:T.DoubleSide}),slots.length);m.frustumCulled=false;m.name='SN_EV_BAYRAK';S.add(m);
 slots.forEach((q,i)=>{q.i=i;});fhouse={m,slots,poles,dead:new Map()};stat.flags=slots.length;houseSync(true);return poles;}
function houseSync(all){const {m,slots}=fhouse;if(!m)return;const o=new T.Object3D(),M=new T.Matrix4(),Z=new T.Matrix4().makeScale(0,0,0);let ch=false;
 for(const q of slots){const d=!!q.b.dead;if(!all&&fhouse.dead.get(q.b)===d)continue;fhouse.dead.set(q.b,d);ch=true;
  if(d){m.setMatrixAt(q.i,Z);continue;}q.b.g.updateMatrix();o.position.set(q.x,q.y,q.z);o.rotation.set(0,0,0);o.scale.set(q.w,q.w,1);o.updateMatrix();M.multiplyMatrices(q.b.g.matrix,o.matrix);m.setMatrixAt(q.i,M);}
 if(ch)m.instanceMatrix.needsUpdate=true;}
// ---------- okullar ----------
const SCHOOL_VILS=[0,7,9,3,6];
function schoolTex(name){const c=doc.createElement('canvas');c.width=512;c.height=96;const g=c.getContext('2d');g.fillStyle='#1d3d7a';g.fillRect(0,0,512,96);g.strokeStyle='#fff';g.lineWidth=4;g.strokeRect(6,6,500,84);
 g.fillStyle='#fff';g.font='700 40px system-ui,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(name,256,50,480);return new T.CanvasTexture(c);}
function schoolSpot(v){for(let dd=74;dd<=130;dd+=14)for(let k=0;k<20;k++){const a=k*Math.PI/10+dd*.07,x=v[0]+Math.cos(a)*dd,z=v[1]+Math.sin(a)*dd;
  if(!turkish(RV,x,z)||z>wallZ(RV,x)-60||Math.abs(x)>W()-40||Math.abs(z)>W()-40)continue;if(safe(()=>roadNear(x,z,16),true))continue;if(BLD.some(b=>!b.dead&&Math.hypot(b.x-x,b.z-z)<b.r+17))continue;
  let mn=1e9,mx=-1e9;for(const[p,q]of[[-12,-10],[12,-10],[-12,10],[12,10],[0,0],[0,16]]){const h=hAt(x+p,z+q);mn=Math.min(mn,h);mx=Math.max(mx,h);}if(mx-mn>2.2||mn<-.3)continue;return {x,z,rot:Math.atan2(v[0]-x,v[1]-z)};}return null;}
function schools(flags){const out=[];for(const vi of SCHOOL_VILS){const v=safe(()=>VILS[vi],null);if(!v||!turkish(RV,v[0],v[1]))continue;const s=schoolSpot(v);if(!s)continue;
  const name=safe(()=>VNAME[vi],'Köy').replace(/ Köyü| Mahallesi/,'').toLocaleUpperCase('tr-TR')+' İLKOKULU';
  const b=make(s.x,s.z,s.rot,12.5,8,'okul',(b,part,win)=>{const w=22,d=9,H=7.2;part('t',0,-.6,0,w+.4,2.4,d+.4,0,0x77716a);part('w',0,H/2+.6,0,w,H,d,0,0xecd9a0);part('t',0,1.05,0,w+.05,.9,d+.05,0,0xa8442e);
   part('t',0,.6+3.6,0,w+.1,.18,d+.1,0,0xf1ece0);part('t',0,H+.75,0,w+.5,.3,d+.5,0,0xa8442e);
   for(let f=0;f<2;f++)for(let i=0;i<7;i++){const x=-w/2+1.6+i*(w-3.2)/6;if(!(f===0&&i===3))win(x,2.4+3.6*f,d/2+.03,1.5,1.5,0);win(x,2.4+3.6*f,-d/2-.03,1.5,1.5,0);}
   part('d',0,1.85,d/2+.03,2,2.5,.12,0,0x2c4a7a);part('t',0,3.3,d/2+1.1,4.6,.18,2.2,0,0xf1ece0);for(const x of[-2.1,2.1])part('t',x,1.6,d/2+2,.18,3.2,.18,0,0xf1ece0);
   // bahçe duvarı (önü açık)
   for(const[x,z,sx,sz]of[[-w/2-3,9,.3,18],[w/2+3,9,.3,18],[-w/2+2,18,9,.3],[w/2-2,18,9,.3]])part('t',x,.55,d/2+z-9,sx,1.1,sz,0,0xe0dccf);return H+1;});
  if(!b)continue;const c=Math.cos(s.rot),sn=Math.sin(s.rot),L=(lx,lz)=>({x:s.x+lx*c+lz*sn,z:s.z-lx*sn+lz*c});
  const sg=new T.Mesh(new T.PlaneGeometry(6.4,1.2),new T.MeshLambertMaterial({map:schoolTex(name)}));const sp=L(0,4.5+.08);sg.position.set(sp.x,hAt(s.x,s.z)+4.65,sp.z);sg.rotation.y=s.rot;sg.name='SN_OKUL_TABELA';S.add(sg);
  const fp=L(-6,13);make(fp.x,fp.z,0,.4,999,'gonder',(b,part)=>{part('t',0,4.5,0,.11,9,.11,0,0xe8e8e8);part('t',0,.2,0,.9,.4,.9,0,0xb5b1a8);return 9;});
  flags.push({x:fp.x,z:fp.z,y:hAt(fp.x,fp.z)+8.9,h:s.rot,s:2.2});out.push({x:s.x,z:s.z,rot:s.rot,name,vi,b,sign:sg,gate:L(0,20),door:L(0,6)});}
 stat.schools=out.map(o=>o.name);return out;}
// ---------- askerler ----------
let SOLD=[];
function soldiers(tw,posts){const add=o=>{const y=safe(()=>hAt(o.x,o.z),0)+(o.dy||0);const f=crowd.add('asker',ASKER,{x:o.x,y,z:o.z,yaw:o.yaw||0,act:o.act||'dur'});f.home={...o};SOLD.push(f);return f;};
 for(const t of tw)add({x:t.x,z:t.z,dy:8.05,yaw:Math.PI,act:'nobet',tower:1});
 // devriye: iki asker yan yana, iki kule arasında duvar boyunca gidip gelir
 for(let i=0;i+1<tw.length;i+=1){if(Math.abs(tw[i+1].x-tw[i].x)>WALL.tower+5)continue;if(i%2)continue;const a=tw[i].x+12,b=tw[i+1].x-12;
  for(const k of[0,1]){const f=add({x:a,z:wallZ(RV,a)-5-k*1.3,act:'nobet-yuru'});f.pat={a,b,u:Math.random(),dir:1,off:5+k*1.3};}}
 for(const p of posts)for(const g of p.sentries||[])add(g);stat.soldiers=SOLD.length;}
function soldierStep(dt){const sp=1.35;for(const f of SOLD){f.t+=dt*(f.pat?5.2:1.2);
  if(f.pat){const p=f.pat,L=p.b-p.a;p.u+=p.dir*sp*dt/L;if(p.u>1){p.u=1;p.dir=-1;}if(p.u<0){p.u=0;p.dir=1;}const x=p.a+L*p.u,z=wallZ(RV,x)-p.off,dx=p.dir*1,dz=(wallZ(RV,x+p.dir)-wallZ(RV,x));
   f.x=x;f.z=z;f.y=safe(()=>hAt(x,z),0);f.yaw=Math.atan2(dx,dz);}
  else if(f.home.tower){f.look=Math.sin(clock*.25+f.home.x)*.9;}
  else if(f.home.gate){const d=safe(()=>Math.hypot(P.x-f.x,P.z-f.z),99);f.act=d<26&&safe(()=>game==='play',false)?'selam':'nobet';}}}
// ---------- sivil yerleşim uyarısı ----------
const CIVIL={house:1,beton:1,apt:1,shop:1,barn:1,shed:1,okul:1};
function civilNear(x,z,r){for(const b of BLD){if(b.dead||!CIVIL[b.kind])continue;if(Math.hypot(b.x-x,b.z-z)<b.r+(r||12))return b;}return null;}
let civT=0;
function warnCivil(){const now=performance.now();if(now-civT<4000)return;civT=now;stat.civil++;safe(()=>root.CREW.say('Sivil yerleşim hedef alanında!',2,'sivil',4),null);
 safe(()=>{const h=doc.getElementById('hit');if(h){h.textContent='SİVİL YERLEŞİM HEDEF ALANINDA';h.style.opacity=1;root.hitT=1.6;}},null);}
// ---------- kurulum ----------
let TW=[],POSTS=[],SCH=[],FLAGS=[],poleM=null,bigM=null;
function build(){if(built||!root.THREE||typeof S==='undefined'||typeof BLD==='undefined'||typeof BX==='undefined'||!BX.make)return;built=true;T=root.THREE;flagTex=makeFlagTex();
 crowd=Crowd(64);buildWall();patrolRoad();unimogs();const flags=[];gates(flags);TW=towers();
 for(const f of FD().filter((f,i,a)=>[-560,70,400].includes(f))){const sentries=[];const k=karakol(f,flags,o=>sentries.push(o));if(k){k.sentries=sentries;POSTS.push(k);}}
 SCH=schools(flags);const poles=houseFlags();
 // gönder bayrakları: evlerin dam gönderleri küçük, karakol ve okul gönderleri büyük
 const pm=new T.InstancedMesh(new T.BoxGeometry(1,1,1),new T.MeshLambertMaterial({color:0xdedede}),poles.length);pm.frustumCulled=false;pm.name='SN_GONDER';S.add(pm);
 poleM=flagMesh(poles.length+flags.length);const o=new T.Object3D(),M=new T.Matrix4();let n=0;
 poles.forEach((q,i)=>{q.b.g.updateMatrix();o.position.set(q.x,q.y+1.2,q.z);o.rotation.set(0,0,0);o.scale.set(.06,2.4,.06);o.updateMatrix();M.multiplyMatrices(q.b.g.matrix,o.matrix);pm.setMatrixAt(i,M);
  o.position.set(q.x+.03,q.y+2.05,q.z);o.scale.set(1.15,1.15,1.15);o.rotation.set(0,Math.PI/2,0);o.updateMatrix();M.multiplyMatrices(q.b.g.matrix,o.matrix);poleM.setMatrixAt(n++,M);});
 for(const f of flags){o.position.set(f.x+.07,f.y-f.s/3,f.z);o.rotation.set(0,(f.h||0)+Math.PI/2,0);o.scale.set(f.s,f.s,f.s);o.updateMatrix();poleM.setMatrixAt(n++,o.matrix);}
 poleM.count=n;FLAGS=flags;stat.poleFlags=n;stat.posts=POSTS.length;
 soldiers(TW,POSTS);safe(()=>{G0=null;},null);}
function frame(dt){if(!built)build();if(!built)return;clock+=dt||0;waveStep(clock);houseSync(false);if((stat.ct=(stat.ct||0)+(dt||0))>.3){stat.ct=0;safe(chipStep,null);}const c=safe(()=>CAM.position,null);if(c)stat.figuresDrawn=crowd.frame(c.x,c.z,260);}
// Duvar geçişi: oyuncu, dost ve düşman araçları duvarın içinden geçemez (kapılar açık)
const prev=new WeakMap();
function remember(){const f=FD();for(const o of [safe(()=>P,null),...safe(()=>AL,[]),...safe(()=>E,[])]){if(!o)continue;prev.set(o,[o.x,o.z]);}}
function enforce(){const f=FD();const chk=(o,isP)=>{const q=prev.get(o);if(!q)return;if(blocked(RV,f,q[0],q[1],o.x,o.z)){o.x=q[0];o.z=q[1];stat.crossBlocked++;if(isP){P.v=-(P.v||0)*.1;}}};
 safe(()=>chk(P,true),null);for(const a of safe(()=>AL,[]))chk(a);for(const e of safe(()=>E,[]))if(e.type!=='inf')chk(e);}
function wrap(name,factory){if(hooks[name]||typeof root[name]!=='function')return;root[name]=factory(root[name]);hooks[name]=true;}
function connect(){build();
 // devriye ve nöbetçiler oyun saatiyle yürür (güncelleme adımında)
 wrap('update',old=>function(dt){remember();const r=old.apply(this,arguments);enforce();const d=clamp(+dt||0,0,.1);safe(()=>{soldierStep(d);unimogStep(d);},null);return r;});
 // rota bulma duvarı bilir: duvar hücreleri kapalı, kapılar açık
 wrap('buildGrid',old=>function(){const g=old.apply(this,arguments);safe(()=>{const f=FD();for(let i=0;i<GN2;i++){const x=gcx(i);if(atGate(f,x))continue;const z=wallZ(RV,x),j=Math.floor((z+W())/GSZ);for(const jj of[j-1,j,j+1])if(jj>=0&&jj<GN2)g[jj*GN2+i]=1e9;}},null);return g;});
 wrap('impact',old=>function(s,x,y,z,e){if(!e&&civilNear(x,z,10))warnCivil();return old.apply(this,arguments);});
 if(!hooks.frame&&typeof FRAME_HOOKS!=='undefined'){hooks.frame=true;FRAME_HOOKS.push(dt=>safe(()=>frame(dt),null));}
 (root.MAPX=root.MAPX||[]).includes(drawMap)||root.MAPX.push(drawMap);root.ALLY_VIA=(a,x,z)=>via(RV,FD(),a.x,a.z,x,z);
 wrap('mmDraw',old=>function(){const r=old.apply(this,arguments);safe(drawMini,null);return r;});}
// büyük harita: sınır hattı, kapılar, karakollar, okullar ve ülke adları
function drawMap(c,SX,SY,s){c.save();c.strokeStyle='rgba(235,60,50,.95)';c.lineWidth=3;c.setLineDash([12,6]);c.beginPath();const ws=W();let first=true;
 for(let x=-ws;x<=ws;x+=10){const X=SX(x),Y=SY(wallZ(RV,x));if(first){c.moveTo(X,Y);first=false;}else c.lineTo(X,Y);}c.stroke();c.setLineDash([]);
 const font=(safe(()=>getComputedStyle(doc.body).getPropertyValue('--sf'),'')||'system-ui');c.textAlign='center';
 c.font='800 '+Math.max(14,Math.round(26*s*4))+'px '+font;c.fillStyle='rgba(255,255,255,.75)';c.strokeStyle='rgba(0,0,0,.55)';c.lineWidth=4;
 for(const[t,z]of[['TÜRKİYE',-ws*.45],['SURİYE',ws*.62]]){c.strokeText(t,SX(0),SY(z));c.fillText(t,SX(0),SY(z));}
 c.font='700 12px '+font;for(const p of POSTS){c.fillStyle='#e30a17';c.fillRect(SX(p.x)-6,SY(p.z)-6,12,12);c.fillStyle='#fff';c.fillText('KARAKOL',SX(p.x),SY(p.z)-10);}
 for(const k of SCH){c.fillStyle='#ffd34a';c.beginPath();c.arc(SX(k.x),SY(k.z),5,0,7);c.fill();}c.restore();}
function drawMini(){if(typeof mmx==='undefined'||typeof mmO!=='function')return;const W2=132,O=mmO(),X=x=>((x-O.x)/MMR+.5)*W2,Z=z=>((z-O.z)/MMR+.5)*W2;
 mmx.save();mmx.strokeStyle='rgba(235,60,50,.9)';mmx.lineWidth=1.6;mmx.setLineDash([4,3]);mmx.beginPath();let f=true;for(let x=O.x-MMR;x<=O.x+MMR;x+=6){const X0=X(x),Y0=Z(wallZ(RV,x));if(f){mmx.moveTo(X0,Y0);f=false;}else mmx.lineTo(X0,Y0);}mmx.stroke();mmx.restore();}
function diagnostics(){return {version:VERSION,built,hooks:{...hooks},...stat,posts:POSTS.map(p=>({x:Math.round(p.x),z:Math.round(p.z),f:p.f})),towersAt:TW.map(t=>Math.round(t.x)),
 unimogs:UNI.map(u=>({x:Math.round(u.x),z:Math.round(u.z),dir:u.dir})),schoolsAt:SCH.map(s=>({x:Math.round(s.x),z:Math.round(s.z),name:s.name})),sentries:SOLD.filter(f=>f.home.gate).map(f=>({x:f.x,z:f.z,act:f.act})),patrols:SOLD.filter(f=>f.pat).map(f=>({x:f.x,z:f.z,act:f.act}))};}
root.HisarSinir=Object.freeze({version:VERSION,core,flagTex:()=>{if(!flagTex&&root.THREE){T=T||root.THREE;flagTex=makeFlagTex();}return flagTex;},connect,posts:()=>POSTS.slice(),schools:()=>SCH.slice(),civilNear,diagnostics,crowd:()=>crowd});
connect();doc.addEventListener('hisar:ui-ready',connect);
})(typeof window!=='undefined'?window:globalThis);
