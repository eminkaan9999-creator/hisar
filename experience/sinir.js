/* ÇELİK BÖRÜ sınır 1.3 — haritanın kuzeyi Türkiye, güneyi Suriye; sınır nehir boyuncadır.
 * - Sınır duvarı: nehrin kuzey kıyısında; kullanıcının gönderdiği 3B duvar modeliyle çizilir (beton levha, üstünde jiletli tel halkaları;
 *   hat.js verir), model gelmezse beton bloklarla. Yalnız geçitlerdeki sınır kapılarından geçilir (oyuncu, dost ve düşman araçları için;
 *   rota bulma da duvarı bilir).
 * - Devriye yolunda Kirpi araçları gezer (gövdeleri gönderilen Kirpi modelidir; hat.js giydirir).
 * - Askerler tanka yol verir: üstüne tank gelen asker yana çekilir, tank geçince yerine döner (tank askerin içinden geçmez).
 *   Aynı kuralı köylüler, hayvanlar ve refakat piyadesi de kullanır; yol verilen araçlar tank, dost tanklar, Kirpi devriyesi ve refakat araçlarıdır.
 * - Devriye Kirpi'si katıdır (tank içinden geçemez) ve önünde tank varsa durup bekler.
 * - Kimse suyun içinden yürümez: düşman piyadesi de duvarı yalnız kapıdan, çayı yalnız geçitten aşar; kıyıya gelince geçide doğru kıyı boyunca
 *   yürür. Yol verirken de kimse suya çekilmez.
 * - Nöbetçi kuleleri (içinde nöbetçi), geçitlerin yanında sınır karakolları (bina, gönderde büyük bayrak, kum torbası, kapı nöbetçileri),
 *   duvar boyunca ikişerli devriye.
 * - Türkiye tarafındaki bütün evlerde Türk bayrağı (balkon, pencere, dam gönderi); köylerde okul ve okul bahçesinde bayrak.
 * - Sivil yerleşime düşen mermide "Sivil yerleşim hedef alanında" uyarısı.
 * - İnsan figürleri tek çizimli parçalardan kurulur (kutu, silindir ve küre); eklem açılarıyla yürür, durur, selam verir. Askerlerin belden
 *   yukarısı gönderilen 3B asker modelidir (militan.js verir).
 * Çekirdek saf işlevlerdir ve Node ile sınanır.
 */
(function(root){'use strict';
const VERSION='1.3.0';
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
// Duvarın kapılar arasındaki kesintisiz parçaları (kenardan edge metre içeride başlar, kapının gate metre önünde biter)
function stretches(fords,ws,gate,edge){const f=fords.slice().sort((p,q)=>p-q),out=[];let a=-ws+edge;for(const x of f){if(x-gate-a>1)out.push([a,x-gate]);a=x+gate;}if(ws-edge-a>1)out.push([a,ws-edge]);return out;}
// Bir parçayı L metreye en yakın eşit dilimlere böler (dilimler arada boşluk bırakmaz)
function tile(a,b,L){const n=Math.max(1,Math.round((b-a)/L)),w=(b-a)/n,out=[];for(let i=0;i<n;i++)out.push([a+i*w,a+(i+1)*w]);return out;}
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
// Yol verme: üstüne tank gelen asker kenara çekilir, tank geçince yerine döner (tank askerin içinden geçmez).
// half: aracın eksenine en az yan uzaklık (m), wide: hareketli araçta hıza göre eklenen pay, body: duran aracın önünde ve arkasında boş kalan
// boy (gövdenin yarı boyu 3,5 m + burnunun önünde iki metreye yakın pay: namlunun altında, burnun dibinde kimse durmaz),
// look/max: hıza göre ileri bakış (sn) ve sınırı (m), run/back: çekilme ve yerine dönme hızı (m/sn), hold: araç geçtikten sonra bekleme (sn),
// hull/hullLen: gövdenin yarı eni ve yarı boyu; araç ani dönüp askerin üstüne gelirse asker gövdenin dışına hemen itilir
const WAY=Object.freeze({half:2.7,wide:1.3,body:5.4,look:1.7,max:15,run:5.2,back:1.5,hold:.9,hull:2.3,hullLen:4});
// Aracın yol verme ekseni ve o eksendeki hızı: eksen gövdenin eksenidir (duvara sürtünüp yana kayan aracın da altı boşalır), geri gidiyorsa
// arkası öndür; yönü bilinmeyen araçta gidiş yönüdür. Bir karede 40 m/sn'den hızlı yer değiştirme ışınlanmadır, hız sayılmaz.
function course(h,vx,vz){let sp=Math.hypot(vx,vz);if(!(sp<40)){vx=vz=sp=0;}if(typeof h!=='number'||h!==h)return {h:sp>.4?Math.atan2(vx,vz):0,v:sp};const al=vx*Math.sin(h)+vz*Math.cos(h);return al<-.4?{h:h+Math.PI,v:-al}:{h,v:Math.max(0,al)};}
// Araç {x,z,h gidiş yönü,v hız}; nokta aracın gövdesinde ya da önündeki koridordaysa çekileceği yan yön (birim), gereken yol ve koridorun
// yarı eni döner, değilse null (push: gövdenin içindeyse dışına çıkması için hemen gereken yol). Asker bulunduğu yana çekilir; o yan kapalıysa
// (bina, duvar) karşı yana geçer (oyun tarafında bakılır).
function giveWay(fx,fz,veh,cfg){cfg=cfg||WAY;const sx=Math.sin(veh.h),cz=Math.cos(veh.h),dx=fx-veh.x,dz=fz-veh.z,f=dx*sx+dz*cz,l=dx*cz-dz*sx,v=Math.abs(veh.v||0),half=cfg.half+Math.min(cfg.wide,v*.4),reach=cfg.body+Math.min(cfg.max,v*cfg.look);
 if(f<-cfg.body||f>reach||Math.abs(l)>=half)return null;const side=l>=0?1:-1;return {x:cz*side,z:-sx*side,need:half-Math.abs(l),half,f,push:Math.abs(f)<cfg.hullLen&&Math.abs(l)<cfg.hull?cfg.hull-Math.abs(l):0};}
// Su: çayın su şeridi eksenin iki yanında half m genişliğindedir, yüzeyi level yüksekliğindedir; zemin yüzeyin dip kadar altındaysa orası sudur
// (geçitlerde zemin suyun üstündedir: geçit kurudur)
const WATER=Object.freeze({half:16,level:-1.6,dip:.2,reach:17});
function wetAt(riv,h,x,z){return Math.abs(z-riv(x))<WATER.reach&&h(x,z)<WATER.level-WATER.dip;}
// Kıyıda ya da duvarın dibinde durdurulan piyadenin sıradaki adımı: en yakın geçide doğru, çaya uzaklığını koruyarak (kıyı boyunca) step kadar.
// Dönen nokta da su ya da duvarın öbür yanıysa null (yerinde kalır).
// Çay yer yer genişler: kıyı çizgisi suya düşüyorsa adım çaydan biraz daha uzağa (OUT sırasıyla) atılır.
const OUT=Object.freeze([0,.5,1,1.6,2.4,3.5]);
function bankStep(riv,h,fords,x,z,step){let g=fords[0];for(const k of fords)if(Math.abs(k-x)<Math.abs(g-x))g=k;const dir=g>=x?1:-1,nx=x+dir*step,nz=z+(riv(nx)-riv(x)),away=z>=riv(x)?1:-1;
 for(const o of OUT){const cz=nz+away*o;if(!wetAt(riv,h,nx,cz)&&!blocked(riv,fords,x,z,nx,cz))return {x:nx,z:cz,ford:g};}return null;}
const core=Object.freeze({VERSION,FLAG,starPts,WALL,WAY,WATER,wetAt,bankStep,giveWay,course,wallZ,atGate,blocked,via,towersAlong,stretches,tile,turkish,pose});
if(typeof module==='object'&&module.exports)module.exports=core;
if(!doc)return;

// ---------- oyun ----------
const hooks={};const stat={blocks:0,coils:0,towers:0,posts:0,flags:0,poleFlags:0,schools:[],soldiers:0,crossBlocked:0,civil:0,figuresDrawn:0,gaveWay:0,infHeld:0,infBank:0};
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
 {g:'c',u:0,p:[.1,-.03,0],j:'LL',o:[0,-.43,0],s:[.16,.86,.17],c:'alt'},{g:'c',u:0,p:[-.1,-.03,0],j:'LR',o:[0,-.43,0],s:[.16,.86,.17],c:'alt'},
 {g:'b',u:1,p:[0,-.86,0],o:[0,-.03,.05],s:[.15,.1,.28],c:'bot'},{g:'b',u:2,p:[0,-.86,0],o:[0,-.03,.05],s:[.15,.1,.28],c:'bot'},
 {g:'b',u:0,p:[0,.06,0],j:'T',o:[0,.3,0],s:[.42,.6,.25],c:'ust'},
 {g:'b',u:5,p:[0,0,0],o:[0,.33,.01],s:[.46,.46,.3],c:'yel',only:'asker'},
 {g:'s',u:5,p:[0,.62,0],j:'H',o:[0,.12,.01],s:[.21,.25,.23],c:'ten'},
 {g:'s',u:7,p:[0,0,0],o:[0,.19,-.01],s:[.28,.19,.3],c:'kask',only:'asker'},
 {g:'c',u:5,p:[.27,.56,0],j:'UL',o:[0,-.15,0],s:[.12,.32,.12],c:'ust'},{g:'c',u:9,p:[0,-.3,0],j:'FL',o:[0,-.14,0],s:[.1,.3,.1],c:'ust'},{g:'s',u:10,p:[0,-.3,0],o:[0,-.04,0],s:[.08,.09,.08],c:'ten'},
 {g:'c',u:5,p:[-.27,.56,0],j:'UR',o:[0,-.15,0],s:[.12,.32,.12],c:'ust'},{g:'c',u:12,p:[0,-.3,0],j:'FR',o:[0,-.14,0],s:[.1,.3,.1],c:'ust'},{g:'s',u:13,p:[0,-.3,0],o:[0,-.04,0],s:[.08,.09,.08],c:'ten'},
 {g:'b',u:13,p:[0,-.27,0],o:[.24,0,.02],s:[.86,.07,.05],c:'tufek',only:'asker',rz:-.35},
 // siviller: başörtüsü ve uzun etek (kadın), kasket (yaşlı adam), okul çantası (çocuk), saç (kız çocuk)
 {g:'s',u:7,p:[0,0,0],o:[0,.12,-.025],s:[.28,.31,.3],c:'bas',only:'kadin'},{g:'b',u:0,p:[0,0,0],o:[0,-.4,0],s:[.46,.84,.34],c:'etek',only:'kadin|kiz'},
 {g:'b',u:7,p:[0,0,0],o:[0,.2,.025],s:[.25,.07,.28],c:'kasket',only:'adam'},{g:'b',u:5,p:[0,0,0],o:[0,.34,-.2],s:[.34,.4,.16],c:'canta',only:'cocuk|kiz'},
 {g:'s',u:7,p:[0,0,0],o:[0,.06,-.07],s:[.24,.28,.22],c:'sac',only:'kiz|cocuk'}];
const ASKER={alt:0x4e5636,bot:0x2a2620,ust:0x5d6640,yel:0x46502f,kask:0x4a5233,tufek:0x1d1f1c};
// TSK dijital kamuflajı: haki, zeytin, koyu zeytin ve kahve pikseller. Askerin pantolon, ceket ve kask örtüsü bu desenle çizilir.
const CAMO_PARTS=new Set(['alt','ust','kask']);let camoTex=null;
function paintCamo(g,P){g.fillStyle=P[1];g.fillRect(0,0,64,64);for(let i=0;i<520;i++){const x=Math.floor(Math.random()*16)*4,y=Math.floor(Math.random()*16)*4,w=4*(1+Math.floor(Math.random()*3)),h=4*(1+Math.floor(Math.random()*2));g.fillStyle=P[Math.floor(Math.random()*P.length)];g.fillRect(x,y,w,h);}}
function camoMap(){if(camoTex)return camoTex;const c=doc.createElement('canvas');c.width=c.height=64;paintCamo(c.getContext('2d'),['#a39a6c','#7d7c52','#5c5f3a','#454630','#5a4632']);
 camoTex=new T.CanvasTexture(c);camoTex.magFilter=T.NearestFilter;camoTex.wrapS=camoTex.wrapT=T.RepeatWrapping;return camoTex;}
// Gönderilen 3B asker modeli (belden yukarı): asker figürlerinin gövdesi, yeleği, başı, kaskı, kolları ve tüfeği yerine bu büst çizilir; kalça ve
// bacaklar iskelette kalır (yürüme, diz çökme, yatma sürer) ve pantolon kamuflajı modelin renklerine boyanır. Model yoksa kodla kurulan asker görünür.
// Kameraya en yakın askerler (BUST.range metre, en çok BUST.max kişi) ayrıntılı büstle, BUST.far metreye kadar ötekiler hafif büstle çizilir;
// daha uzaktakiler kodla kurulan gövdeyle kalır.
let BUST=null;const UPPER=new Set([5,6,7,8,9,10,11,12,13,14,15]),TORSO=5;
function setBust(b){T=T||root.THREE;BUST=b&&b.geo&&b.mat?b:null;if(BUST&&b.palette){const t=camoMap();paintCamo(t.image.getContext('2d'),b.palette);t.needsUpdate=true;}return !!BUST;}
function Crowd(cap,rig,poseFn,tag){rig=rig||RIG;poseFn=poseFn||pose;tag=tag||'SN_FIG';const box=new T.BoxGeometry(1,1,1),sph=new T.SphereGeometry(.5,10,8),mat=new T.MeshLambertMaterial({color:0xffffff});
 const mk=(geo,n,name)=>{const m=new T.InstancedMesh(geo,mat,n);m.instanceColor=new T.InstancedBufferAttribute(new Float32Array(n*3).fill(1),3);m.count=0;m.frustumCulled=false;m.name=name;S.add(m);return m;};
 const nb=rig.filter(q=>q.g==='b').length,nc=rig.filter(q=>q.g==='c').length,ns=rig.length-nb-nc,cyl=new T.CylinderGeometry(.5,.5,1,10),Cy=mk(cyl,Math.max(1,cap*nc),tag+'_S'),B=mk(box,cap*nb,tag+'_K'),Sp=mk(sph,cap*ns,tag+'_Y'),cm=new T.MeshLambertMaterial({color:0xffffff,map:camoMap()}),BC=mk(box,cap*4,tag+'_KK'),SC=mk(sph,cap,tag+'_KY');const CC=mk(cyl,cap*6,tag+'_KS');BC.material=cm;SC.material=cm;CC.material=cm;const caps=new Map([[B,cap*nb],[Sp,cap*ns],[BC,cap*4],[SC,cap],[Cy,cap*nc],[CC,cap*6]]);let MB=null,ML=null,mbN=0,mlN=0;const figs=[],m4=new T.Matrix4(),tmp=new T.Matrix4(),eu=new T.Euler(),col=new T.Color(),F=[],zero=new T.Matrix4().makeScale(0,0,0),t2=new T.Matrix4(),V=new T.Vector3();
 for(let i=0;i<rig.length;i++)F.push(new T.Matrix4());
 function add(kind,colors,o){const f={kind,x:o.x,y:o.y,z:o.z,yaw:o.yaw||0,sc:o.sc||1,act:o.act||'dur',t:Math.random()*6,look:0,idx:[],vis:true,live:true};
  for(let i=0;i<rig.length;i++){const q=rig[i];if(q.only&&!q.only.split('|').includes(kind)){f.idx.push(null);continue;}const cam=kind==='asker'&&colors.camo!==false&&CAMO_PARTS.has(q.c);let m=q.g==='b'?(cam?BC:B):q.g==='c'?(cam?CC:Cy):(cam?SC:Sp);if(m.count>=caps.get(m)){m=q.g==='b'?B:q.g==='c'?Cy:Sp;if(m.count>=caps.get(m)){f.idx.push(null);continue;}}const k=m.count++;
   col.setHex(m===BC||m===SC||m===CC?0xffffff:q.c==='ten'?SKIN[figs.length%SKIN.length]:(colors[q.c]!=null?colors[q.c]:0x808080));m.setColorAt(k,col);f.idx.push([m,k]);}
  B.instanceColor.needsUpdate=Sp.instanceColor.needsUpdate=BC.instanceColor.needsUpdate=SC.instanceColor.needsUpdate=Cy.instanceColor.needsUpdate=CC.instanceColor.needsUpdate=true;figs.push(f);return f;}
 function bustMesh(){if(!MB&&BUST){const mk2=(g,n,nm)=>{const m=new T.InstancedMesh(g,BUST.mat,n);m.count=0;m.frustumCulled=false;m.castShadow=true;m.name=nm;S.add(m);return m;};MB=mk2(BUST.geo,Math.min(cap,BUST.max||8),tag+'_MODEL');if(BUST.lo)ML=mk2(BUST.lo,cap,tag+'_MODEL_UZAK');}return MB;}
 function draw(f){const P=poseFn(f.act,f.t,{look:f.look,f}),bm=f.bu&&BUST&&rig===RIG&&bustMesh()?(f.bu===1?MB:ML):null,bust=!!bm&&(bm===MB?mbN:mlN)<bm.instanceMatrix.count;const base=m4.makeRotationY(f.yaw).setPosition(f.x,f.y+(P.GY||0),f.z);if(f.sc!==1)base.scale(V.set(f.sc,f.sc,f.sc));
  for(let i=0;i<rig.length;i++){const q=rig[i],a=q.j&&P[q.j];const parent=q.u<0?base:F[q.u];F[i].copy(parent).multiply(t2.makeTranslation(q.p[0],q.p[1],q.p[2]));
   if(a){eu.set(a[0],a[1],a[2]);F[i].multiply(t2.makeRotationFromEuler(eu));}
   const id=f.idx[i];if(!id)continue;if(bust&&UPPER.has(i)){id[0].setMatrixAt(id[1],zero);continue;}const M=tmp.copy(F[i]).multiply(t2.makeTranslation(q.o[0],q.o[1],q.o[2]));if(q.rz)M.multiply(t2.makeRotationZ(q.rz));M.scale(V.set(q.s[0],q.s[1],q.s[2]));id[0].setMatrixAt(id[1],M);}
  if(bust)bm.setMatrixAt(bm===MB?mbN++:mlN++,tmp.copy(F[TORSO]).multiply(t2.makeTranslation(0,BUST.y,0)).scale(V.set(BUST.s,BUST.s,BUST.s)));}
 function hide(f){for(const id of f.idx)if(id)id[0].setMatrixAt(id[1],zero);}
 function frame(cx,cz,range){let n=0;mbN=mlN=0;
  if(BUST&&rig===RIG){const near=[],R1=BUST.range||45,R2=BUST.lo?(BUST.far||170):R1;for(const f of figs){f.bu=0;if(!f.live||f.kind!=='asker')continue;const d=Math.hypot(f.x-cx,f.z-cz);if(d<R2&&d<range)near.push([d,f]);}near.sort((a,b)=>a[0]-b[0]);const mx=Math.min(cap,BUST.max||8);let h=0;for(const q of near)q[1].bu=q[0]<R1&&h<mx?(h++,1):(BUST.lo?2:0);}
  for(const f of figs){const near=f.live&&Math.hypot(f.x-cx,f.z-cz)<range;if(near){draw(f);n++;f.vis=true;}else if(f.vis){hide(f);f.vis=false;}}
  B.instanceMatrix.needsUpdate=Sp.instanceMatrix.needsUpdate=BC.instanceMatrix.needsUpdate=SC.instanceMatrix.needsUpdate=Cy.instanceMatrix.needsUpdate=CC.instanceMatrix.needsUpdate=true;if(MB){MB.count=mbN;MB.instanceMatrix.needsUpdate=true;}if(ML){ML.count=mlN;ML.instanceMatrix.needsUpdate=true;}return n;}
 return {add,frame,figs,draw,hide,model:()=>MB?MB.count:0,modelFar:()=>ML?ML.count:0};}

// ---------- sınır yapıları ----------
function buildWall(){const fords=FD(),ws=W(),xs=[];for(let x=-ws+4;x<=ws-4;x+=WALL.block)if(!atGate(fords,x))xs.push(x);
 const box=new T.BoxGeometry(1,1,1),con=new T.MeshLambertMaterial({color:0xcdc9be}),foot=new T.MeshLambertMaterial({color:0x8f8b82});
 const bl=new T.InstancedMesh(box,con,xs.length),ft=new T.InstancedMesh(box,foot,xs.length),coilG=new T.TorusGeometry(.3,.016,3,9),coilM=new T.MeshLambertMaterial({color:0x6c7073});
 const step=.7,nc=Math.ceil(xs.length*WALL.block/step),co=new T.InstancedMesh(coilG,coilM,nc),o=new T.Object3D();let k=0;
 xs.forEach((x,i)=>{const z=wallZ(RV,x),dz=RV(x+1)-RV(x-1),yaw=Math.atan2(2,dz)-Math.PI/2,h=Math.min(hAt(x,z),hAt(x,z-.6),hAt(x,z+.6));
  o.position.set(x,h+WALL.high/2-.25,z);o.rotation.set(0,-Math.atan2(dz,2),0);o.scale.set(WALL.block-.06,WALL.high,.32);o.updateMatrix();bl.setMatrixAt(i,o.matrix);
  o.position.set(x,h+.05,z);o.scale.set(WALL.block-.02,.6,1.1);o.updateMatrix();ft.setMatrixAt(i,o.matrix);
  for(let s=0;s<WALL.block-.1&&k<nc;s+=step){const xx=x-WALL.block/2+s+step/2;o.position.set(xx,h+WALL.high-.25+.28,wallZ(RV,xx));o.rotation.set(0,-Math.atan2(dz,2)+Math.PI/2,0);o.scale.set(1,1,1);o.updateMatrix();co.setMatrixAt(k++,o.matrix);}});
 co.count=k;for(const m of [bl,ft,co]){m.frustumCulled=false;m.name='SN_DUVAR';S.add(m);}stat.blocks=xs.length;stat.coils=k;WOLD=[bl,ft,co];}
// ---------- gönderilen 3B duvar modeli ----------
// Duvar, kapılar arasında modelin boyuna yakın eşit dilimlere bölünür; her dilim modelin bir kopyasıdır (araziye ve duvarın eğrisine oturur).
// Kameraya en yakın dilimler ayrıntılı örgüyle, ortadakiler hafif örgüyle, uzaktakiler modelin yandan resmini taşıyan kartla çizilir.
// Model gelince eski beton bloklar ve tel sarmalları sahneden kaldırılır; model gelmezse onlar kalır. Geçiş kuralı (blocked) değişmez.
let WM=null,WOLD=null;
function wallModel(levels,o){if(WM||!built||!levels||!levels.length||!o||!o.assign||!(o.len>1))return false;T=T||root.THREE;const segs=[],ob=new T.Object3D(),gr=(x,z)=>Math.min(hAt(x,z),hAt(x,z-.6),hAt(x,z+.6));ob.rotation.order='YXZ';
 for(const st of stretches(FD(),W(),WALL.gate,2.8))for(const [x0,x1] of tile(st[0],st[1],o.len*.985)){const z0=wallZ(RV,x0),z1=wallZ(RV,x1),h0=gr(x0,z0),h1=gr(x1,z1),dx=x1-x0,dz=z1-z0,Lc=Math.hypot(dx,dz);
   ob.position.set((x0+x1)/2,(h0+h1)/2,(z0+z1)/2);ob.rotation.set(-Math.asin(Math.max(-.5,Math.min(.5,(h1-h0)/Lc))),Math.atan2(dx,dz),0);ob.scale.set(1,1,Lc/o.len);ob.updateMatrix();segs.push({x:(x0+x1)/2,z:(z0+z1)/2,M:ob.matrix.clone()});}
 const lv=levels.map((L,i)=>{const max=Math.min(segs.length,L.max||segs.length),m=new T.InstancedMesh(L.geo,L.mat,max);m.count=0;m.frustumCulled=false;m.castShadow=!L.card;m.receiveShadow=!L.card;m.name='SN_DUVAR_MODEL_'+i;S.add(m);return {m,r:L.r,max,n:0};});
 WM={segs,lv,assign:o.assign,cx:1e9,cz:1e9,ds:new Array(segs.length)};for(const m of WOLD||[]){S.remove(m);m.geometry.dispose();m.material.dispose();}WOLD=null;stat.wallSegs=segs.length;wallPack(true);return true;}
function wallPack(force){if(!WM)return;const c=safe(()=>CAM.position,null);if(!c)return;if(!force&&Math.abs(c.x-WM.cx)<5&&Math.abs(c.z-WM.cz)<5)return;WM.cx=c.x;WM.cz=c.z;const segs=WM.segs,lv=WM.lv,ds=WM.ds;
 for(let i=0;i<segs.length;i++)ds[i]=Math.hypot(segs[i].x-c.x,segs[i].z-c.z);const a=WM.assign(ds,lv);for(const L of lv)L.n=0;
 for(let i=0;i<segs.length;i++){const l=a[i];if(l<0)continue;const L=lv[l];L.m.setMatrixAt(L.n++,segs[i].M);}for(const L of lv){L.m.count=L.n;L.m.instanceMatrix.needsUpdate=true;}stat.wallNear=lv[0].n;stat.wallMid=lv.length>2?lv[1].n:0;}
// Kule modeli kapalı beton kuledir (üstünde durulmaz): kule nöbetçileri kulenin dibine, doğu yanına iner
function towerGuards(off){let n=0;for(const f of SOLD){if(!f.home||!f.home.tower)continue;f.x=f.home.x+off;f.z=f.home.z;f.y=safe(()=>hAt(f.x,f.z),0);f.home.dy=0;f.bx=null;n++;}return n;}
// Devriye yolu: duvarın Türkiye yanında, duvara koşut çakıllı yol (kapılarda yola bağlanır)
function patrolRoad(){const ws=W(),xs=[];for(let x=-ws+6;x<=ws-6;x+=4)xs.push(x);const m=new T.InstancedMesh(new T.BoxGeometry(1,1,1),new T.MeshLambertMaterial({color:0xa99d80,polygonOffset:true,polygonOffsetFactor:-2}),xs.length),o=new T.Object3D();
 xs.forEach((x,i)=>{const z=wallZ(RV,x)-WALL.road,dz=RV(x+2)-RV(x-2);o.position.set(x,Math.max(hAt(x,z),hAt(x-2,z),hAt(x+2,z))+.04,z);o.rotation.set(0,-Math.atan2(dz,4),0);o.scale.set(4.3,.08,5);o.updateMatrix();m.setMatrixAt(i,o.matrix);});
 m.frustumCulled=false;m.name='SN_DEVRIYE_YOLU';S.add(m);}
// Kirpi devriyesi: devriye yolunda iki kapı arasında gider, uca varınca döner; oyuncu önündeyse durur. Gövdesi kullanıcının gönderdiği
// 3B Kirpi modelidir (hat.js bu gruplara giydirir); burada yalnız yeri ve yönü yürütülür.
let KRP=[];
// Devriye aracının engeli: boyu eninden uzun olduğu için ekseni üzerinde önde ve arkada birer daire (yarıçap r, eksenden uzaklık off). Yarıçap,
// tankın burnu (tankın çarpışma yarıçapı 2,6 m, yarı boyu 3,5 m) aracın gövdesine girmeyecek kadar geniştir
const KIRPI_COV=Object.freeze({r:2.8,off:1.8,h:2.4});
function kirpis(){const f=FD().slice().sort((a,b)=>a-b),ws=W(),segs=[];let a=-ws+20;for(const x of f){if(x-a>120)segs.push([a,x-18]);a=x+18;}if(ws-20-a>120)segs.push([a,ws-20]);
 segs.filter((q,i)=>i%2===0||segs.length<4).slice(0,4).forEach((sg,i)=>{const g=new T.Group();g.name='SN_KIRPI';S.add(g);const u={g,a:sg[0],b:sg[1],x:sg[0]+(sg[1]-sg[0])*(.2+.5*(i%2)),dir:i%2?-1:1,v:7,yaw:0,stop:0,cov:[1,-1].map(k=>({x:0,z:0,r:KIRPI_COV.r,h:KIRPI_COV.h,pos:1,krp:k}))};KRP.push(u);
  /* devriye aracı katıdır: tank içinden geçemez (araçla birlikte yürüyen engel; düşman siper diye kullanmaz: pos) */safe(()=>COV.push(...u.cov),null);});
 /* devriye araçları kurulur kurulmaz yollarına yerleşir (menüde dünya merkezinde, tankın üstünde görünmesinler) */kirpiStep(1);}
function kirpiStep(dt){const tk=safe(()=>[P].concat(AL.filter(a=>!a.dead)),[]);for(const u of KRP){const ahead={x:u.x+u.dir*9,z:wallZ(RV,u.x+u.dir*9)-WALL.road};/* önünde tank (oyuncu ya da dost) varsa durur, bekler */const blockP=tk.some(o=>Math.hypot(o.x-ahead.x,o.z-ahead.z)<8);
  const v=blockP?0:u.v;u.x+=u.dir*v*dt;if(u.x>u.b){u.x=u.b;u.dir=-1;}if(u.x<u.a){u.x=u.a;u.dir=1;}const z=wallZ(RV,u.x)-WALL.road,dz=wallZ(RV,u.x+u.dir)-wallZ(RV,u.x);
  const ty=Math.atan2(u.dir,dz);let d=ty-u.yaw;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;u.yaw+=d*Math.min(1,dt*2.2);
  const y=safe(()=>hAt(u.x,z),0),fx=Math.sin(u.yaw)*1.9,fz=Math.cos(u.yaw)*1.9;u.g.position.set(u.x,y,z);u.g.rotation.order='YXZ';u.g.rotation.set(-Math.atan2(safe(()=>hAt(u.x+fx,z+fz),y)-safe(()=>hAt(u.x-fx,z-fz),y),3.8),u.yaw,0);u.z=z;for(const c of u.cov){c.x=u.x+Math.sin(u.yaw)*KIRPI_COV.off*c.krp;c.z=z+Math.cos(u.yaw)*KIRPI_COV.off*c.krp;}}}
// Ülke göstergesi: oyunda ekranın üstünde bulunduğun ülke ve sınıra uzaklık
let chip=null;
function chipStep(){if(!doc.body)return;if(!chip){chip=doc.createElement('div');chip.id='sn-ulke';const st=doc.createElement('style');st.textContent=`#sn-ulke{position:fixed;left:50%;top:calc(env(safe-area-inset-top,0px) + 10px);transform:translateX(-50%);z-index:12;display:flex;align-items:center;gap:8px;padding:5px 11px 5px 6px;border-radius:6px;background:rgba(12,13,12,.78);border:1px solid rgba(255,255,255,.12);color:#f4f2ec;font:800 13px/1 var(--sf,system-ui);letter-spacing:.1em;pointer-events:none;white-space:nowrap}
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
 for(const[lx,lz,w,ry]of[[-6,9,6,0],[6,9,6,0],[-10,6,4,1.57]]){const q=L(lx,lz);make(q.x,q.z,rot+ry,1.4,3,'torba',(b,part)=>{for(let i=0;i<3;i++)part('t',0,.25+i*.36,0,w-i*.25,.36,.7,0,i%2?0x9a8a62:0x8b7c57);return 1.1;});}
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
// Yol verilen araçlar: oyuncunun tankı, dost tanklar, sınırdaki Kirpi devriyesi ve öbür bölümlerin bildirdikleri (refakat araçları); hız ve gidiş
// yönü konum değişiminden bulunur (geri giden araç da sayılır)
let VEH=[];const vprev=new WeakMap(),VSRC=[];
function vehicles(dt){const out=[],put=o=>{const q=vprev.get(o);vprev.set(o,[o.x,o.z]);let vx=0,vz=0;if(q&&dt>0){vx=(o.x-q[0])/dt;vz=(o.z-q[1])/dt;}const c=course(o.h,vx,vz);out.push({x:o.x,z:o.z,h:c.h,v:c.v});};
 /* Uçangöz kipinde de tank yerinde durur: sayılır */safe(()=>{if(game==='play')put(P);},null);for(const a of safe(()=>AL,[]))if(!a.dead)put(a);for(const u of KRP){u.h=u.yaw;put(u);}for(const fn of VSRC)for(const o of safe(fn,null)||[])put(o);VEH=out;}
const HG=(x,z)=>safe(()=>hAt(x,z),0),wet=(x,z)=>wetAt(RV,HG,x,z);
// Çekilecek yer kapalı mı: bina (dikdörtgen tabanlıysa tabanı, değilse dairesi), sınır duvarı ya da su; hard değilse siper daireleri de (kaya,
// araç, eski mahalle) sayılır
function spotBlocked(x,z,hard){if(safe(()=>BLD.some(b=>{if(b.dead)return false;const dx=x-b.x,dz=z-b.z;if(Math.abs(dx)>30||Math.abs(dz)>30)return false;
   if(b.w&&b.d){const c=Math.cos(b.rot||0),s=Math.sin(b.rot||0);return Math.abs(dx*c-dz*s)<b.w/2+.7&&Math.abs(dx*s+dz*c)<b.d/2+.7;}return Math.hypot(dx,dz)<b.r*.8;}),false))return true;
 if(Math.abs(z-wallZ(RV,x))<1.6&&!atGate(FD(),x))return true;if(wet(x,z))return true;
 return !hard&&safe(()=>COV.some(c=>Math.abs(c.x-x)<c.r+.5&&Math.abs(c.z-z)<c.r+.5&&Math.hypot(c.x-x,c.z-z)<c.r+.4),false);}
// Bir noktanın çekilmesi gereken yön (birim) ve yol; tehlike yoksa null. Çekileceği yan kapalıysa karşı yana geçer; iki yanda da yalnız kaya ya da
// araç varsa yine yana çekilir (binaya ve duvara girmez); iki yan da bina ya da duvarsa aracın gidiş yönünde ileri kaçar. Birden çok araç varsa
// itmeler toplanır.
function way(x,z){let tx=0,tz=0,hit=false,push=0;for(const v of VEH){if(Math.abs(v.x-x)>24||Math.abs(v.z-z)>24)continue;const g=giveWay(x,z,v);if(!g)continue;let nx=g.x,nz=g.z,need=g.need,pp=g.push;
  const alt=2*g.half-need,own=h=>spotBlocked(x+g.x*need,z+g.z*need,h),oth=h=>spotBlocked(x-g.x*alt,z-g.z*alt,h),flip=()=>{nx=-g.x;nz=-g.z;need=alt;if(pp>0)pp=2*WAY.hull-pp;};
  if(own(false)){if(!oth(false))flip();else if(own(true)){if(!oth(true))flip();else{nx=Math.sin(v.h);nz=Math.cos(v.h);need=6;pp=Math.max(0,WAY.hullLen+.3-g.f);}}}
  tx+=nx*need;tz+=nz*need;hit=true;push=Math.max(push,pp);}if(!hit)return null;const l=Math.hypot(tx,tz)||1;return {x:tx/l,z:tz/l,need:l,push:Math.min(push,l)};}
function soldierStep(dt){const sp=1.35;vehicles(dt);for(const f of SOLD){f.t+=dt*(f.pat?5.2:1.2);if(f.bx==null){f.bx=f.x;f.bz=f.z;f.ax=f.az=0;f.hold=0;f.act0=f.act;f.yaw0=f.yaw;}
  if(f.pat){const p=f.pat,L=p.b-p.a;p.u+=p.dir*sp*dt/L;if(p.u>1){p.u=1;p.dir=-1;}if(p.u<0){p.u=0;p.dir=1;}const x=p.a+L*p.u,z=wallZ(RV,x)-p.off,dx=p.dir*1,dz=(wallZ(RV,x+p.dir)-wallZ(RV,x));
   f.bx=x;f.bz=z;f.yaw=Math.atan2(dx,dz);f.act='nobet-yuru';}
  else if(f.home.tower){f.look=Math.sin(clock*.25+f.home.x)*.9;}
  else if(f.home.gate){const d=safe(()=>Math.hypot(P.x-f.x,P.z-f.z),99);f.act0=d<26&&safe(()=>game==='play',false)?'selam':'nobet';if(!f.moved)f.act=f.act0;}
  /* yol verme: üstüne araç gelen asker yana koşar; araç yerinden çekilince yürüyerek döner (kule tepesindeki nöbetçi yerinde kalır) */
  const w=f.home.dy>1?null:way(f.bx+f.ax,f.bz+f.az);
  if(w){const st=Math.min(Math.max(w.need,w.push||0),WAY.run*dt);if(spotBlocked(f.bx+f.ax+w.x*st,f.bz+f.az+w.z*st,true)){f.act='nobet';continue;}f.ax+=w.x*st;f.az+=w.z*st;f.hold=WAY.hold;f.moved=1;f.yaw=Math.atan2(w.x,w.z);f.act='nobet-yuru';f.t+=dt*8;stat.gaveWay++;}
  else if(f.hold>0){f.hold-=dt;if(!f.pat)f.act='nobet';}
  else if(f.ax||f.az){if(way(f.bx,f.bz)){if(!f.pat)f.act='nobet';}else{const l=Math.hypot(f.ax,f.az),st=Math.min(l,WAY.back*dt);f.yaw=Math.atan2(-f.ax,-f.az);f.ax-=f.ax/l*st;f.az-=f.az/l*st;if(l-st<.03)f.ax=f.az=0;f.act='nobet-yuru';f.t+=dt*4;}}
  else if(f.moved){f.moved=0;if(!f.pat){f.act=f.act0;f.yaw=f.yaw0;}}
  if(f.pat||f.moved){f.x=f.bx+f.ax;f.z=f.bz+f.az;f.y=safe(()=>hAt(f.x,f.z),0);}}}
// ---------- sivil yerleşim uyarısı ----------
const CIVIL={house:1,beton:1,apt:1,shop:1,barn:1,shed:1,okul:1,kerpic:1};
function civilNear(x,z,r){for(const b of BLD){if(b.dead||!CIVIL[b.kind])continue;if(Math.hypot(b.x-x,b.z-z)<b.r+(r||12))return b;}return null;}
let civT=0;
function warnCivil(){const now=performance.now();if(now-civT<4000)return;civT=now;stat.civil++;safe(()=>root.CREW.say('Sivil yerleşim hedef alanında!',2,'sivil',4),null);
 safe(()=>{const h=doc.getElementById('hit');if(h){h.textContent='SİVİL YERLEŞİM HEDEF ALANINDA';h.style.opacity=1;root.hitT=1.6;}},null);}
// ---------- kurulum ----------
let TW=[],POSTS=[],SCH=[],FLAGS=[],poleM=null,bigM=null;
function build(){if(built||!root.THREE||typeof S==='undefined'||typeof BLD==='undefined'||typeof BX==='undefined'||!BX.make)return;built=true;T=root.THREE;flagTex=makeFlagTex();
 crowd=Crowd(64);buildWall();patrolRoad();kirpis();const flags=[];gates(flags);TW=towers();
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
function frame(dt){if(!built)build();if(!built)return;clock+=dt||0;waveStep(clock);houseSync(false);if((stat.ct=(stat.ct||0)+(dt||0))>.3){stat.ct=0;safe(chipStep,null);}const c=safe(()=>CAM.position,null);if(c)stat.figuresDrawn=crowd.frame(c.x,c.z,260);safe(()=>wallPack(false),null);}
// Duvar geçişi: oyuncu, dost ve düşman araçları duvarın içinden geçemez (kapılar açık)
const prev=new WeakMap();
function remember(){const f=FD();for(const o of [safe(()=>P,null),...safe(()=>AL,[]),...safe(()=>E,[])]){if(!o)continue;prev.set(o,[o.x,o.z]);}}
function enforce(){const f=FD();const chk=(o,isP)=>{const q=prev.get(o);if(!q)return;if(blocked(RV,f,q[0],q[1],o.x,o.z)){o.x=q[0];o.z=q[1];stat.crossBlocked++;if(isP){P.v=-(P.v||0)*.1;}}};
 safe(()=>chk(P,true),null);for(const a of safe(()=>AL,[]))chk(a);for(const e of safe(()=>E,[])){if(e.type!=='inf')chk(e);else foot(e,f);}}
// Düşman piyadesi: duvarı yalnız kapıdan, çayı yalnız geçitten aşar (suyun içinden yürümez). Durdurulan er yerinde saymaz: en yakın geçide doğru
// kıyı boyunca yürür. Zaten suyun içindeyse (oraya düşmüşse) çıkmasına izin verilir.
function foot(e,f){const q=prev.get(e);if(!q)return;const step=Math.hypot(e.x-q[0],e.z-q[1]);if(step<1e-4||step>6)return;const wall=blocked(RV,f,q[0],q[1],e.x,e.z),water=wet(e.x,e.z)&&!wet(q[0],q[1]);if(!wall&&!water)return;
 stat.infHeld++;let to=null;
 /* önce geçit yolu: oyuncunun bulunduğu yana, en uygun geçidin ağzına, oradan şeridin içinden karşıya (refakat kolunun kullandığı kural) */
 const rt=safe(()=>root.HisarDestek.core.route,null);if(rt){if(e._lane==null)e._lane=(Math.random()-.5)*8;const wp=safe(()=>rt(RV,f,WALL.back,q[0],q[1],P.x,P.z,e._lane),null);
  if(wp){const dx=wp.x-q[0],dz=wp.z-q[1],d=Math.hypot(dx,dz);if(d>.05){const k=Math.min(d,step)/d,nx=q[0]+dx*k,nz=q[1]+dz*k;if(!(wet(nx,nz)&&!wet(q[0],q[1]))&&!blocked(RV,f,q[0],q[1],nx,nz))to={x:nx,z:nz};}}}
 /* düz yol suya ya da duvara çıkıyorsa kıyı boyunca geçide doğru */
 if(!to)to=bankStep(RV,HG,f,q[0],q[1],step);
 if(to){e.x=to.x;e.z=to.z;e.h=Math.atan2(to.x-q[0],to.z-q[1]);stat.infBank++;}else{e.x=q[0];e.z=q[1];}safe(()=>{e.g.position.x=e.x;e.g.position.z=e.z;},null);}
function wrap(name,factory){if(hooks[name]||typeof root[name]!=='function')return;root[name]=factory(root[name]);hooks[name]=true;}
function connect(){build();
 // devriye ve nöbetçiler oyun saatiyle yürür (güncelleme adımında)
 wrap('update',old=>function(dt){remember();const r=old.apply(this,arguments);enforce();const d=clamp(+dt||0,0,.1);safe(()=>{soldierStep(d);kirpiStep(d);},null);return r;});
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
 c.font='800 '+Math.max(14,Math.round(26*s*4))+'px '+font;c.fillStyle='rgba(160,30,24,.8)';c.strokeStyle='rgba(255,255,255,.75)';c.lineWidth=4;
 for(const[t,z]of[['TÜRKİYE',-ws*.45],['SURİYE',ws*.62]]){c.strokeText(t,SX(0),SY(z));c.fillText(t,SX(0),SY(z));}
 c.font='700 12px '+font;for(const p of POSTS){c.fillStyle='#e30a17';c.fillRect(SX(p.x)-6,SY(p.z)-6,12,12);c.lineWidth=3;c.strokeStyle='rgba(255,255,255,.85)';c.strokeText('KARAKOL',SX(p.x),SY(p.z)-10);c.fillStyle='#24221e';c.fillText('KARAKOL',SX(p.x),SY(p.z)-10);}
 for(const k of SCH){c.fillStyle='#ffd34a';c.beginPath();c.arc(SX(k.x),SY(k.z),5,0,7);c.fill();}c.restore();}
function drawMini(){if(typeof mmx==='undefined'||typeof mmO!=='function')return;const W2=132,O=mmO(),X=x=>((x-O.x)/MMR+.5)*W2,Z=z=>((z-O.z)/MMR+.5)*W2;
 mmx.save();mmx.strokeStyle='rgba(235,60,50,.9)';mmx.lineWidth=1.6;mmx.setLineDash([4,3]);mmx.beginPath();let f=true;for(let x=O.x-MMR;x<=O.x+MMR;x+=6){const X0=X(x),Y0=Z(wallZ(RV,x));if(f){mmx.moveTo(X0,Y0);f=false;}else mmx.lineTo(X0,Y0);}mmx.stroke();mmx.restore();}
function diagnostics(){return {version:VERSION,built,hooks:{...hooks},...stat,posts:POSTS.map(p=>({x:Math.round(p.x),z:Math.round(p.z),f:p.f})),towersAt:TW.map(t=>Math.round(t.x)),
 kirpis:KRP.map(u=>({x:Math.round(u.x),z:Math.round(u.z),dir:u.dir})),schoolsAt:SCH.map(s=>({x:Math.round(s.x),z:Math.round(s.z),name:s.name})),sentries:SOLD.filter(f=>f.home.gate).map(f=>({x:f.x,z:f.z,act:f.act})),patrols:SOLD.filter(f=>f.pat).map(f=>({x:f.x,z:f.z,act:f.act})),
  vehicles:VEH.length,men:SOLD.map(f=>({x:f.x,z:f.z,act:f.act,off:Math.hypot(f.ax||0,f.az||0),kind:f.pat?'devriye':f.home.tower?'kule':f.home.gate?'kapi':'karakol'}))};}
root.HisarSinir=Object.freeze({version:VERSION,core,fig:()=>({Crowd:(...a)=>{T=T||root.THREE;return Crowd(...a);},RIG,pose,SKIN,way,wet}),vehicleSource:fn=>{if(typeof fn==='function'&&!VSRC.includes(fn))VSRC.push(fn);return VSRC.length;},flagTex:()=>{if(!flagTex&&root.THREE){T=T||root.THREE;flagTex=makeFlagTex();}return flagTex;},connect,posts:()=>POSTS.slice(),schools:()=>SCH.slice(),civilNear,diagnostics,crowd:()=>crowd,bust:setBust,hasBust:()=>!!BUST,wallModel,towerGuards,towers:()=>TW.map(t=>({x:t.x,z:t.z})),kirpis:()=>KRP.map(u=>u.g),wall:()=>WM?{segs:WM.segs.length,counts:WM.lv.map(L=>L.n),old:!!WOLD}:null});
connect();doc.addEventListener('hisar:ui-ready',connect);
})(typeof window!=='undefined'?window:globalThis);
