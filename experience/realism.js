/* ÇELİK BÖRÜ gerçeklik 1.0
 * - Ayar atışı: düşman nişancısı yeni bir hedefe ilk mermiyi geniş dağılımla atar, sonrakilerde düzeltir. Hedef 25 m yer değiştirirse
 *   ya da 15 saniye atış olmazsa ayar baştan başlar: yer değiştirmek gerçekte olduğu gibi işe yarar.
 * - Toz: hareket eden araç hızına göre toz kaldırır; yolda ve yağmurda az, suda hiç. Uzaktaki aracı çoğu zaman önce tozu ele verir.
 * - Ot: bütün haritada, kameranın çevresinde dokulu ot öbekleri (sabit tohumlu; aynı yerde hep aynı ot).
 * - Dağlar: ufukta üç sıra dağ, uzak sıranın tepeleri karlı; renkleri havaya ve günün saatine göre sise karışır.
 */
(function(root){'use strict';
const VERSION='1.1.2';
const doc=root.document;
const safe=(f,d)=>{try{return f();}catch(e){return d;}};
const clamp=(v,a,b)=>v<a?a:v>b?b:v;

// ---------- çekirdek (sınanabilir) ----------
// Ayar atışı katsayıları: ilk, ikinci, üçüncü ve sonraki atışların dağılım çarpanı.
const BRACKET=Object.freeze([2.2,1.5,1.15,1]);
const RESET=Object.freeze({move:25,time:15});
// Aynı hedefe kaçıncı atış? Önceki atış kaydı (last) ile yeni hedef noktası ve zaman verilir.
function shotIndex(last,tx,tz,t){if(!last||t-last.t>RESET.time||Math.hypot(tx-last.x,tz-last.z)>RESET.move)return 0;return last.n+1;}
function spread(n){return BRACKET[Math.min(n,BRACKET.length-1)];}
// Toz: saniyede kaç bulut (hız m/sn, yol mu, ıslaklık 0–1).
function dustRate(v,road,wet){if(v<2.5||wet>.6)return 0;return clamp((v-2.5)/10,0,1)*6*(road?.35:1)*(1-wet);}
// Ot: dünya üzerinde 1,7 m'lik hücreler; her hücrede sabit tohumla ya bir öbek vardır ya yoktur.
const CELL=1.7;
function hash(ix,iz){let h=Math.imul(ix,374761393)+Math.imul(iz,668265263)|0;h=Math.imul(h^h>>>13,1274126177);return ((h^h>>>16)>>>0)/4294967296;}
function tuft(ix,iz){const a=hash(ix,iz);// öbekler lekeli dağılsın: düşük frekanslı ikinci gürültü
 const b=hash(ix>>3,iz>>3);if(a>.3+b*.45)return null;return {x:(ix+hash(iz,ix))*CELL,z:(iz+hash(ix+7,iz-3))*CELL,s:.7+hash(ix-5,iz+9)*1.2,r:hash(ix+3,iz+11)*6.283,c:hash(ix-11,iz-2)};}
const core=Object.freeze({VERSION,BRACKET,RESET,shotIndex,spread,dustRate,CELL,tuft});
if(typeof module==='object'&&module.exports)module.exports=core;
if(!doc)return;

// ---------- oyun ----------
const hooks={};let sim=0,note=0,grass=null,gx=1e9,gz=1e9;const stat={shots:0,first:0,spread:1,dust:0,grass:0,rebuilds:0};
function wrap(name,factory){if(hooks[name]||typeof root[name]!=='function')return;root[name]=factory(root[name]);hooks[name]=true;}
const playing=()=>safe(()=>game==='play',false);

// ayar atışı
function bracket(old){return function(e,tx,ty,tz,sp,tgt){if(!e||e.type!=='tank'||tgt==='drone'||typeof L==='undefined')return old.apply(this,arguments);
 const n=shotIndex(e._br,tx,tz,sim);e._br={x:tx,z:tz,t:sim,n};const c0=L.cone;stat.spread=spread(n);L.cone=c0*stat.spread;stat.shots++;if(!n)stat.first++;
 if(!n&&sim-note>25&&Math.hypot(tx-P.x,tz-P.z)<6&&Math.hypot(e.x-P.x,e.z-P.z)>150){note=sim;safe(()=>root.CREW.say('Ayar atışı geldi! Yerini değiştir.',2,'ayar',20),null);}
 try{return old.apply(this,arguments);}finally{L.cone=c0;}};}

// toz
const DUST=[0x9c8a68,0xc2b394];
function wet(){return safe(()=>clamp((root.RAINU&&root.RAINU.value)||0,0,1),0);}
function dustStep(dt){const fx=root.FXP||root.FX||null;if(!fx||!fx.puff)return;const c=safe(()=>CAM.position,null);if(!c)return;const w=wet(),q=safe(()=>root.FXQ||1,1);let budget=Math.ceil(40*dt*q)+1;
 const one=(o,h,body)=>{if(budget<=0)return;const px=o._dx,pz=o._dz;o._dx=o.x;o._dz=o.z;if(px===undefined)return;const v=Math.hypot(o.x-px,o.z-pz)/Math.max(dt,1e-3);if(v>40)return;// ışınlanma
  if(Math.hypot(o.x-c.x,o.z-c.z)>380)return;const gy=safe(()=>hAt(o.x,o.z),0);if(gy<-1)return;const road=safe(()=>roadNear(o.x,o.z,1),false);
  o._da=(o._da||0)+dustRate(v,road,w)*q*dt;while(o._da>=1&&budget>0){o._da--;budget--;stat.dust++;const s=Math.sin(h),k=Math.cos(h),side=(Math.random()<.5?-1:1)*body*.45,bx=o.x-s*body+k*side,bz=o.z-k*body-s*side,f=clamp(v/14,.4,1);
   fx.puff(bx,gy+.5,bz,-s*v*.12+(Math.random()-.5),.5+Math.random()*1.2,-k*v*.12+(Math.random()-.5),3+Math.random()*1.6,1.6+Math.random()*.8,6+Math.random()*4*f,DUST[0],DUST[1],.36*f,.6);}};
 safe(()=>{if(mode==='tank')one(P,P.h,3.4);},null);safe(()=>{for(const a of AL)if(!a.dead)one(a,a.h,3.4);},null);
 safe(()=>{for(const e of E)if(e.type==='tank'||e.type==='apc'||e.type==='truck')one(e,e.h||0,e.type==='truck'?3:3.4);},null);}

// ot: kameranın 95 m çevresi; kamera 18 m yer değiştirince öbekler yeniden dizilir. Öbek, çapraz duran üç dokulu yaprak düzlemidir.
const GR=95,GN=7000;
function bladeTex(T){const c=doc.createElement('canvas');c.width=128;c.height=128;const g=c.getContext('2d');g.clearRect(0,0,128,128);
 for(let i=0;i<26;i++){const x=8+Math.random()*112,h=55+Math.random()*70,lean=(Math.random()-.5)*36,w=2.2+Math.random()*2.4,l=60+Math.random()*50|0;
  const gr=g.createLinearGradient(0,128,0,128-h);gr.addColorStop(0,'rgb('+(l*.55+22|0)+','+(l*.62+30|0)+','+(l*.3+14|0)+')');gr.addColorStop(1,'rgb('+(l+58)+','+(l+62)+','+(l*.5+30|0)+')');/* doğal, soluk zeytin-saman tonu (fosforlu yeşil değil) */g.fillStyle=gr;
  g.beginPath();g.moveTo(x-w,128);g.quadraticCurveTo(x+lean*.3,128-h*.6,x+lean,128-h);g.quadraticCurveTo(x+lean*.3+w*.3,128-h*.6,x+w,128);g.closePath();g.fill();}
 const t=new T.CanvasTexture(c);t.anisotropy=2;return t;}
function clumpGeo(T){const pos=[],uv=[],nor=[],idx=[],W=.75,H=.62;for(let k=0;k<3;k++){const a=k*Math.PI/3,cx=Math.cos(a)*W,cz=Math.sin(a)*W,b=pos.length/3;
  pos.push(-cx,0,-cz, cx,0,cz, cx,H,cz, -cx,H,-cz);uv.push(0,0,1,0,1,1,0,1);for(let i=0;i<4;i++)nor.push(0,1,0);idx.push(b,b+1,b+2,b,b+2,b+3);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('normal',new T.Float32BufferAttribute(nor,3));g.setIndex(idx);return g;}
// Zemindeki tarla deseniyle aynı hesap (index.html zemin gölgelendiricisi): sürülmüş tarla ve anızda ot tutamı olmaz
function inField(x,z){const fx=(x*.96+z*.28)/74,fz=(-x*.28+z*.96)/48,cx=Math.floor(fx),cz=Math.floor(fz),rx=fx-cx,rz=fz-cz,v=Math.sin(cx*12.9898+cz*78.233)*43758.5453,hs=v-Math.floor(v);
 return hs>=.38&&rx>.06&&rx<.94&&rz>.08&&rz<.92;}
function buildGrass(){if(grass||!root.THREE||typeof S==='undefined')return;const T=root.THREE;
 const m=new T.InstancedMesh(clumpGeo(T),new T.MeshLambertMaterial({color:0xffffff,map:bladeTex(T),alphaTest:.45,side:T.DoubleSide}),GN);m.instanceColor=new T.InstancedBufferAttribute(new Float32Array(GN*3).fill(1),3);m.count=0;m.frustumCulled=false;m.name='GR_OT';S.add(m);
 safe(()=>{gm.visible=false;},null);// eski koni otlar yerine
 grass={m,o:new T.Object3D(),c:new T.Color()};}
function grassStep(force){if(!grass)buildGrass();if(!grass)return;const c=safe(()=>CAM.position,null);if(!c)return;if(!force&&Math.hypot(c.x-gx,c.z-gz)<18)return;gx=c.x;gz=c.z;stat.rebuilds++;
 const low=safe(()=>typeof qlv!=='undefined'&&qlv==='dusuk',false),m=grass.m,o=grass.o,col=grass.c,i0=Math.floor((c.x-GR)/CELL),i1=Math.floor((c.x+GR)/CELL),j0=Math.floor((c.z-GR)/CELL),j1=Math.floor((c.z+GR)/CELL);let n=0;
 for(let j=j0;j<=j1&&n<GN;j++)for(let i=i0;i<=i1&&n<GN;i++){const t=tuft(i,j);if(!t)continue;if(low&&t.c>.45)continue;const dx=t.x-c.x,dz=t.z-c.z;if(dx*dx+dz*dz>GR*GR)continue;
  if(Math.abs(t.x)>WS+40||Math.abs(t.z)>WS+40)continue;const h=hAt(t.x,t.z);if(h<-.6||Math.abs(t.z-riv(t.x))<21)continue;if(roadNear(t.x,t.z,.8))continue;
  o.position.set(t.x,h-.04,t.z);o.rotation.set(0,t.r,0);o.scale.set(t.s,t.s*(.75+t.c*.8),t.s);o.updateMatrix();m.setMatrixAt(n,o.matrix);
  // Suriye tarafı kuru: saman sarısı ve seyrek; Türkiye tarafı yaz sonu yeşili
  const sy=t.z>riv(t.x)+10;if(sy&&t.c<.38){continue;}if(!sy&&t.z<riv(t.x)-30&&inField(t.x,t.z)&&t.c<.85)continue;if(sy)col.setRGB(1.04+t.c*.08,.9+t.c*.06,.6+t.c*.08);else col.setRGB(1+t.c*.12,1+t.c*.1,.8+t.c*.14);m.setColorAt(n,col);n++;}
 m.count=n;m.instanceMatrix.needsUpdate=true;m.instanceColor.needsUpdate=true;stat.grass=n;}

// dağlar: ufukta üç sıra; kamerayı izler (çok uzaktaki dağ yaklaşınca büyümez), sisten etkilenmez, rengi o anki sis rengine göre
// havaya karışır. Eteği sis rengindedir: sisle kapanan uzak zemine dikişsiz bağlanır. Uzak sıranın tepeleri karlıdır.
// Güneydoğu ufku: karsız, çıplak, kahverengi kireçtaşı sırtları
const RANGES=Object.freeze([{r:440,lo:40,hi:86,haze:.62,seed:3.1,snow:9,rock:0x8a7a64},{r:425,lo:26,hi:58,haze:.45,seed:7.7,snow:9,rock:0x7f6f58},{r:410,lo:12,hi:32,haze:.3,seed:1.9,snow:9,rock:0x75684f}]);
function ridge(a,R){const s=R.seed;let h=.5+.22*Math.sin(a*3+s)+.16*Math.sin(a*7.3+s*2.1)+.09*Math.sin(a*17+s*3.7)+.05*Math.sin(a*41+s)+.03*Math.sin(a*97+s*5);
 h=Math.max(0,h);h=h*h*1.4;return R.lo+(R.hi-R.lo)*Math.min(1.2,h);}
let mtn=null,mtnFog=-1;
function buildMountains(){if(mtn||!root.THREE||typeof S==='undefined')return;const T=root.THREE,N=360,meshes=[];
 for(const R of RANGES){const pos=[],k=[],sn=[],idx=[];for(let i=0;i<=N;i++){const a=i/N*Math.PI*2,h=ridge(a,R),cx=Math.sin(a),cz=Math.cos(a);
   // dört sıra: etek (sis rengi), orta, omuz, tepe
   for(const [f,hz] of [[-.45,1],[.35,.82],[.75,.55],[1,.38]]){const y=f<0?-60:h*f,rr=R.r*(f<0?1:1-.04*f);pos.push(cx*rr,y,cz*rr);k.push(Math.min(1,hz+R.haze*(1-hz)));sn.push(f>=.75&&h>R.hi*R.snow?1:0);}}
  for(let i=0;i<N;i++)for(let j=0;j<3;j++){const a=i*4+j,b=a+4;idx.push(a,b,a+1,a+1,b,b+1);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(new Float32Array(pos.length),3));g.setIndex(idx);
  const m=new T.Mesh(g,new T.MeshBasicMaterial({vertexColors:true,fog:false,depthWrite:false,side:T.DoubleSide}));m.renderOrder=-1;m.frustumCulled=false;m.name='DAG';m.userData={k,sn,R};S.add(m);meshes.push(m);}
 mtn=meshes;}
function mountainsStep(){if(!mtn)buildMountains();if(!mtn)return;const c=safe(()=>CAM.position,null);if(!c)return;for(const m of mtn)m.position.set(c.x,Math.min(c.y,40)*.3,c.z);
 const fc=safe(()=>S.fog.color,null);if(!fc)return;const key=fc.r*1e6+fc.g*1e3+fc.b;if(Math.abs(key-mtnFog)<1e-3)return;mtnFog=key;const T=root.THREE,rk=new T.Color(),out=new T.Color(),snow=new T.Color(0xf4f6f8);
 for(const m of mtn){const {k,sn,R}=m.userData,col=m.geometry.attributes.color;rk.setHex(R.rock);// gece ve sisli havada dağ da kararır: kaya rengi sis parlaklığıyla ölçeklenir
  const lum=Math.min(1.1,(fc.r+fc.g+fc.b)/1.9);for(let i=0;i<k.length;i++){out.copy(sn[i]?snow:rk).multiplyScalar(lum).lerp(fc,k[i]);col.setXYZ(i,out.r,out.g,out.b);}col.needsUpdate=true;}}

function connect(){
 wrap('eshot',bracket);
 wrap('update',old=>function(dt){const r=old.apply(this,arguments);if(playing()&&!doc.hidden){const d=clamp(+dt||0,0,.1);sim+=d;safe(()=>dustStep(d),null);}return r;});
 if(!hooks.frame&&typeof FRAME_HOOKS!=='undefined'){hooks.frame=true;FRAME_HOOKS.push(()=>{safe(()=>grassStep(false),null);safe(mountainsStep,null);});}}
root.HisarRealism=Object.freeze({version:VERSION,core,connect,grass:()=>grassStep(true),diagnostics:()=>({version:VERSION,hooks:{...hooks},...stat,mountains:mtn?mtn.length:0,sim})});
connect();doc.addEventListener('hisar:ui-ready',connect);
})(typeof window!=='undefined'?window:globalThis);
