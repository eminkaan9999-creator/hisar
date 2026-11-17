/* ÇELİK BÖRÜ köy hayatı 1.2 — Türkiye tarafındaki köylerde gündelik hayat ve bütün arazide doğa.
 * - Köylüler: kadınlar (başörtüsü, uzun etek), kasketli yaşlılar, gençler; evler arasında yürür, kapı önünde durur.
 *   Tank yaklaşınca el sallar; yakına mermi düşünce en yakın eve koşup saklanır, ortalık sakinleşince çıkar.
 * - Çocuklar: okul olan köylerde evlerinden okula yürür (çantalı), okula girer, bir süre sonra evden yeniden çıkar.
 *   Asker ya da tank görünce durur, döner ve asker selamı verir.
 * - Hayvanlar: çobanı ve kangal köpeğiyle koyun sürüleri, ahırların yanında inekler, evlerin önünde tavuklar, köylerin üstünde
 *   süzülen leylekler. Tank yaklaşınca kaçışırlar.
 * - Yol verme: köylü de hayvan da üstüne gelen tankın (ve öbür askerî araçların) önünden yana kaçar, araç geçene kadar yoluna adım atmaz;
 *   hiçbir canlının içinden araç geçmez.
 * - Çiçekler: kameranın çevresinde gelincik, papatya, sarı çiçek ve mor çiçek öbekleri (sabit tohumlu; aynı yerde hep aynı).
 * Çekirdek saf işlevlerdir ve Node ile sınanır.
 */
(function(root){'use strict';
const VERSION='1.2.0';
const doc=root.document;
const safe=(f,d)=>{try{return f();}catch(e){return d;}};
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
// ---------- çekirdek ----------
const SAL=Object.freeze({r:26,hold:3.2,cool:30,wave:20});
// Araca yol verirken yana kaçış hızı (m/sn): insan, koyun/köpek, inek, tavuk
const GIVE=Object.freeze({insan:4.6,koyun:6,kopek:6.5,inek:4.5,tavuk:4});
// Yana atılacak adım: gereken yoldan ve hızın izin verdiğinden büyüğü olmaz; gövdenin altındaysa (push) hemen o kadar çıkar
function sideStep(w,speed,dt){return Math.max(Math.min(w.need,speed*dt),w.push||0);}
// Selam: çocuk tankı görür (yakın), soğuma bitmişse selam verir
const wantsSalute=(d,cool,hidden)=>!hidden&&cool<=0&&d<SAL.r;
// Kaçış yönü: tehlikeden uzağa birim vektör
function flee(x,z,tx,tz){const dx=x-tx,dz=z-tz,l=Math.hypot(dx,dz)||1;return {x:dx/l,z:dz/l};}
// Çiçek hücresi: lekeli dağılım; tür öbek başına sabit
function hash(ix,iz){let h=Math.imul(ix,374761393)+Math.imul(iz,668265263)|0;h=Math.imul(h^h>>>13,1274126177);return ((h^h>>>16)>>>0)/4294967296;}
const FCELL=2.2;
function flower(ix,iz){const p=hash(ix>>4,iz>>4),a=hash(ix,iz);if(p<.38||a>(p-.38)*1.25)return null;const k=Math.floor(hash((ix>>4)+31,(iz>>4)-17)*4);
 return {k,x:(ix+hash(iz,ix))*FCELL,z:(iz+hash(ix+7,iz-3))*FCELL,s:.75+hash(ix-5,iz+9)*.6,r:hash(ix+3,iz+11)*6.283};}
// Hayvan duruşları (eklem açıları)
function animalPose(act,t){const P={};const s=Math.sin(t);
 if(act==='yuru'||act==='kos'){const a=act==='kos'?.75:.45;P.LL=[s*a,0,0];P.LR=[-s*a,0,0];P.H=[.1,0,0];P.K=[.5+s*.2,0,0];}
 if(act==='otla'){P.H=[.95+Math.sin(t*.7)*.1,0,0];}
 if(act==='gagala'){P.H=[Math.max(0,Math.sin(t*3))*1.1,0,0];}
 if(act==='dur'){P.H=[Math.sin(t*.3)*.15,Math.sin(t*.21)*.4,0];P.K=[.6,0,0];}
 if(act==='uc'){const f=Math.sin(t*1.6);P.WL=[0,0,f*.45];P.WR=[0,0,-f*.45];}
 if(act==='suzul'){P.WL=[0,0,.06];P.WR=[0,0,-.06];}
 return P;}
const core=Object.freeze({VERSION,SAL,GIVE,sideStep,wantsSalute,flee,flower,FCELL,animalPose});
if(typeof module==='object'&&module.exports)module.exports=core;
if(!doc)return;

// ---------- iskeletler ----------
const b=(u,p,o,s,c,j)=>({g:'b',u,p,o,s,c,j});const sp=(u,p,o,s,c,j)=>({g:'s',u,p,o,s,c,j});
const RIGS={
 koyun:[sp(-1,[0,.62,0],[0,0,0],[.6,.55,.95],'yun','G'),sp(0,[0,.12,.45],[0,0,.13],[.24,.26,.32],'bas','H'),
  b(0,[.16,-.18,.28],[0,-.2,0],[.09,.42,.09],'bacak','LL'),b(0,[-.16,-.18,.28],[0,-.2,0],[.09,.42,.09],'bacak','LR'),b(0,[.16,-.18,-.28],[0,-.2,0],[.09,.42,.09],'bacak','LR'),b(0,[-.16,-.18,-.28],[0,-.2,0],[.09,.42,.09],'bacak','LL')],
 inek:[b(-1,[0,1.1,0],[0,0,0],[.8,.82,1.75],'govde','G'),b(0,[0,.25,.88],[0,-.08,.25],[.42,.44,.55],'bas','H'),b(1,[0,.2,.05],[0,0,0],[.6,.06,.06],'boynuz'),
  b(0,[.26,-.38,.62],[0,-.36,0],[.17,.74,.17],'bacak','LL'),b(0,[-.26,-.38,.62],[0,-.36,0],[.17,.74,.17],'bacak','LR'),b(0,[.26,-.38,-.62],[0,-.36,0],[.17,.74,.17],'bacak','LR'),b(0,[-.26,-.38,-.62],[0,-.36,0],[.17,.74,.17],'bacak','LL'),
  b(0,[0,.25,-.88],[0,-.32,0],[.06,.64,.06],'kuyruk'),b(0,[.25,.12,.1],[0,0,0],[.36,.42,.5],'leke')],
 kopek:[b(-1,[0,.62,0],[0,0,0],[.34,.36,.9],'govde','G'),b(0,[0,.2,.46],[0,0,.12],[.26,.26,.32],'govde','H'),b(1,[0,0,0],[0,-.04,.26],[.15,.13,.14],'maske'),
  b(1,[.1,.12,.02],[0,0,0],[.07,.13,.05],'maske'),b(1,[-.1,.12,.02],[0,0,0],[.07,.13,.05],'maske'),
  b(0,[.11,-.16,.32],[0,-.22,0],[.1,.46,.1],'govde','LL'),b(0,[-.11,-.16,.32],[0,-.22,0],[.1,.46,.1],'govde','LR'),b(0,[.11,-.16,-.32],[0,-.22,0],[.1,.46,.1],'govde','LR'),b(0,[-.11,-.16,-.32],[0,-.22,0],[.1,.46,.1],'govde','LL'),
  b(0,[0,.14,-.45],[0,.13,-.04],[.07,.28,.07],'govde','K')],
 tavuk:[sp(-1,[0,.24,0],[0,0,0],[.24,.24,.32],'govde','G'),sp(0,[0,.14,.13],[0,.04,.02],[.13,.14,.14],'govde','H'),b(1,[0,0,0],[0,.11,0],[.03,.07,.09],'ibik'),b(1,[0,0,0],[0,.03,.09],[.04,.04,.07],'gaga'),
  b(0,[.05,-.1,0],[0,-.08,0],[.025,.16,.025],'gaga','LL'),b(0,[-.05,-.1,0],[0,-.08,0],[.025,.16,.025],'gaga','LR'),b(0,[0,.05,-.16],[0,.06,-.02],[.04,.16,.12],'kuyruk')],
 leylek:[b(-1,[0,0,0],[0,0,0],[.22,.22,.85],'beyaz','G'),b(0,[0,.04,.42],[0,0,.2],[.07,.07,.42],'beyaz'),sp(1,[0,0,.42],[0,0,0],[.11,.11,.14],'beyaz'),b(2,[0,0,.07],[0,0,.18],[.04,.04,.34],'gaga'),
  b(0,[.11,.03,0],[.62,0,0],[1.24,.03,.42],'beyaz','WL'),b(0,[-.11,.03,0],[-.62,0,0],[1.24,.03,.42],'beyaz','WR'),b(4,[1.24,0,0],[.22,0,0],[.44,.03,.4],'siyah'),b(5,[-1.24,0,0],[-.22,0,0],[.44,.03,.4],'siyah'),
  b(0,[0,-.04,-.42],[0,0,-.32],[.03,.03,.6],'gaga')]};
// ---------- oyun ----------
const hooks={},stat={people:0,kids:0,adults:0,saluting:0,salutes:0,waves:0,hidden:0,animals:{},flowers:0,frebuild:0,fled:0,gaveWay:0};
let built=false,T=null,folk=null,beasts={},P_=[],A_=[],FL=null,fgx=1e9,fgz=1e9,clock=0,sayT=-1e9;
const RV=x=>safe(()=>riv(x),120),WZ=x=>RV(x)-26,TR=(x,z)=>z<WZ(x)-4;
const HOUSE={house:1,beton:1,apt:1,shop:1,kerpic:1};
const pick=a=>a[Math.floor(Math.random()*a.length)%a.length];
function door(h){const r=h.rot||0;return {x:h.x+Math.sin(r)*((h.d||6)/2+1.6),z:h.z+Math.cos(r)*((h.d||6)/2+1.6)};}
function clearAt(x,z,m){return safe(()=>BLD.every(q=>q.dead||Math.hypot(q.x-x,q.z-z)>q.r+m),true)&&safe(()=>COV.every(c=>Math.hypot(c.x-x,c.z-z)>c.r+m),true)&&safe(()=>root.HisarField.positions().every(q=>Math.hypot(q.x-x,q.z-z)>m+12),true)&&!safe(()=>roadNear(x,z,2),false)&&safe(()=>hAt(x,z)>-.6,true)&&Math.abs(z-RV(x))>40;}
const CLOTH={adam:{alt:[0x3b3a38,0x4a4237,0x2f3a4a],ust:[0x7a6a55,0x5d6a7a,0x8a7a62,0x4f5a46],bot:[0x2a2620],kasket:[0x3a3530,0x4a4038]},
 genc:{alt:[0x2f3f5f,0x3a3a3a],ust:[0xb8b2a6,0x9a3a30,0x2f6a8a,0x5a7a3a],bot:[0xdddddd,0x2a2a2a]},
 kadin:{alt:[0x3a3a40],ust:[0x7a4a5a,0x4a6a7a,0x8a6a3a,0x5a4a6a],etek:[0x6a3a4a,0x3a4a6a,0x5a5a3a,0x7a5a4a],bas:[0xf2f0ea,0xd8c27a,0x9a5a6a,0x6a8aaa],bot:[0x2a2620]},
 cocuk:{alt:[0x5a5f66,0x3d4552],ust:[0x2b3f74,0x3b5b9a],canta:[0xd33b2f,0x2f8ad3,0xf2b134,0x5ab04a],bot:[0x1f1f1f],sac:[0x2a2018,0x4a3020]},
 kiz:{alt:[0x5a5f66],ust:[0x2b3f74,0x3b5b9a],etek:[0x2b3f74,0x5a5f66],canta:[0xe0457b,0x8a4ad3,0xf2b134],bot:[0x1f1f1f],sac:[0x2a2018,0x6a4020]}};
const col=k=>{const c=CLOTH[k],o={};for(const n in c)o[n]=pick(c[n]);return o;};
function villages(){const out=[];const sch=safe(()=>root.HisarSinir.schools(),[]);safe(()=>VILS.forEach((v,i)=>{if(!TR(v[0],v[1]))return;
  const hs=BLD.filter(q=>q.parts&&HOUSE[q.kind]&&!q.dead&&Math.hypot(q.x-v[0],q.z-v[1])<80);if(hs.length<3)return;out.push({i,x:v[0],z:v[1],hs,school:sch.find(s=>s.vi===i)||null});}),null);return out;}
function person(kind,colors,v,o){const sc=kind==='cocuk'||kind==='kiz'?.62+Math.random()*.08:kind==='adam'?.97+Math.random()*.06:.93+Math.random()*.06;
 const d=door(pick(v.hs)),f=folk.add(kind==='genc'?'adam2':kind,colors,{x:d.x,y:safe(()=>hAt(d.x,d.z),0),z:d.z,sc,act:'dur'});
 const p={f,v,kind,kid:kind==='cocuk'||kind==='kiz',st:'idle',t:1+Math.random()*6,path:[],cool:Math.random()*8,hold:0,sp:kind==='adam'?1.05:1.3};P_.push(p);return p;}
function buildFolk(){const fig=safe(()=>root.HisarSinir.fig(),null);if(!fig)return false;WAYF=fig.way||null;
 const pf=(act,t,o)=>fig.pose(act==='kos'?'yuru':act,act==='kos'?t*1.6:t,o);folk=fig.Crowd(150,fig.RIG,pf,'KH_INSAN');
 for(const v of villages()){for(let i=0;i<5;i++){const k=i<2?'kadin':i<4?'adam':'genc';person(k,col(k==='genc'?'genc':k),v);}
  const nk=v.school?8:3;for(let i=0;i<nk;i++){const k=i%2?'kiz':'cocuk';const p=person(k,col(k),v);if(v.school){p.st='home';p.t=Math.random()*25;p.f.live=false;}}}
 stat.people=P_.length;stat.kids=P_.filter(p=>p.kid).length;stat.adults=stat.people-stat.kids;return true;}
// sürüler ve hayvanlar
function herdSpot(near,dmin,dmax){for(let k=0;k<60;k++){const a=Math.random()*6.283,d=dmin+Math.random()*(dmax-dmin),x=near.x+Math.cos(a)*d,z=near.z+Math.sin(a)*d;if(Math.abs(x)>safe(()=>WS,800)-40||Math.abs(z)>safe(()=>WS,800)-40)continue;if(clearAt(x,z,10))return {x,z};}return null;}
function beast(kind,colors,x,z,o){const c=beasts[kind];const f=c.add(kind,colors,{x,y:safe(()=>hAt(x,z),0),z,yaw:Math.random()*6.28,act:'dur'});const a=Object.assign({f,kind,st:'idle',t:Math.random()*5,tx:x,tz:z,sp:kind==='inek'?.9:kind==='tavuk'?1.2:1.1},o||{});A_.push(a);return a;}
function buildAnimals(){const fig=safe(()=>root.HisarSinir.fig(),null);if(!fig)return;const cap={koyun:220,inek:40,kopek:12,tavuk:120,leylek:24};
 for(const k in RIGS)beasts[k]=fig.Crowd(cap[k],RIGS[k],animalPose,'KH_'+k.toUpperCase());
 const vs=villages();let flocks=0;for(const v of vs.concat(safe(()=>VILS.filter(q=>!TR(q[0],q[1])).map(q=>({x:q[0],z:q[1]})),[]))){if(flocks>=8)break;const c=herdSpot(v,90,190);if(!c)continue;flocks++;
  const herd={x:c.x,z:c.z};for(let i=0;i<14;i++){const a=Math.random()*6.28,d=Math.random()*14;beast('koyun',{yun:pick([0xeae4d4,0xe2dccb,0xd8d0bc,0x4a4038]),bas:pick([0x2a2420,0xe2dccb]),bacak:0x2a2420},c.x+Math.cos(a)*d,c.z+Math.sin(a)*d,{herd});}
  beast('kopek',{govde:0xc9a46a,maske:0x1e1a16},c.x+8,c.z+6,{herd,dog:1});if(folk&&TR(c.x,c.z)){const sh=folk.add('adam',col('adam'),{x:c.x-6,y:safe(()=>hAt(c.x-6,c.z),0),z:c.z,sc:1,act:'dur'});P_.push({f:sh,v:null,kind:'coban',st:'herd',herd,t:2,path:[],cool:5,hold:0,sp:1});}}
 stat.flocks=flocks;
 for(const bn of safe(()=>BLD.filter(q=>q.kind==='barn'&&TR(q.x,q.z)),[]).slice(0,16))for(let i=0;i<2;i++){const s=herdSpot(bn,10,18);if(s)beast('inek',{govde:pick([0x6b4a32,0x2a2522,0xd9c7a8,0x8a5a3a]),bas:0x4a3a2a,boynuz:0xe8e0c8,bacak:0x3a2a1e,kuyruk:0x2a2018,leke:pick([0xf0ece4,0x2a2522,0x6b4a32])},s.x,s.z,{home:{x:s.x,z:s.z}});}
 for(const v of vs)for(const h of v.hs.slice(0,6))if(Math.random()<.7){const d=door(h);for(let i=0;i<4;i++)beast('tavuk',{govde:pick([0xf2efe6,0x9a5a2a,0x6a3a1a,0xd8b48a]),ibik:0xd0261d,gaga:0xe0a020,kuyruk:0x3a2a1a},d.x+(Math.random()-.5)*6,d.z+(Math.random()-.5)*6,{home:{x:d.x,z:d.z}});}
 for(const v of vs.slice(0,5)){const n=4;for(let i=0;i<n;i++){const s=beast('leylek',{beyaz:0xf4f4f0,siyah:0x1d1d1d,gaga:0xd2462a},v.x,v.z,{sky:{x:v.x,z:v.z,r:60+Math.random()*50,h:38+Math.random()*20,a:Math.random()*6.28,w:(.12+Math.random()*.06)*(Math.random()<.5?-1:1)}});s.st='sky';}}
 for(const k in beasts)stat.animals[k]=beasts[k].figs.length;}
// çiçekler
function flowerTex(k){const c=doc.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');const P=[['#d6211b','#2a0c08'],['#ffffff','#f2c21c'],['#f4d21c','#c48a10'],['#9a5ad8','#5a2a90']][k];
 for(let i=0;i<5;i++){const x=10+Math.random()*44,y=8+Math.random()*26,h=64-y;g.strokeStyle='#4f7a2a';g.lineWidth=2;g.beginPath();g.moveTo(x,64);g.quadraticCurveTo(x+(Math.random()-.5)*8,y+h*.5,x,y);g.stroke();
  const r=k===2?4:6;g.fillStyle=P[0];for(let j=0;j<6;j++){const a=j/6*6.283;g.beginPath();g.ellipse(x+Math.cos(a)*r*.7,y+Math.sin(a)*r*.7,r*.62,r*.4,a,0,7);g.fill();}g.fillStyle=P[1];g.beginPath();g.arc(x,y,r*.38,0,7);g.fill();}
 const t=new T.CanvasTexture(c);t.anisotropy=2;return t;}
function crossGeo(){const pos=[],uv=[],nor=[],idx=[],W=.35,H=.5;for(let k=0;k<2;k++){const a=k*Math.PI/2,cx=Math.cos(a)*W,cz=Math.sin(a)*W,b0=pos.length/3;pos.push(-cx,0,-cz,cx,0,cz,cx,H,cz,-cx,H,-cz);uv.push(0,0,1,0,1,1,0,1);for(let i=0;i<4;i++)nor.push(0,1,0);idx.push(b0,b0+1,b0+2,b0,b0+2,b0+3);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('normal',new T.Float32BufferAttribute(nor,3));g.setIndex(idx);return g;}
function buildFlowers(){const geo=crossGeo();FL=[0,1,2,3].map(k=>{const m=new T.InstancedMesh(geo,new T.MeshLambertMaterial({map:flowerTex(k),alphaTest:.5,side:T.DoubleSide}),1400);m.count=0;m.frustumCulled=false;m.name='KH_CICEK';S.add(m);return m;});}
function flowerStep(force){if(!FL)return;const c=safe(()=>CAM.position,null);if(!c)return;if(!force&&Math.hypot(c.x-fgx,c.z-fgz)<15)return;fgx=c.x;fgz=c.z;stat.frebuild++;const R=70,low=safe(()=>qlv==='dusuk',false);
 const o=new T.Object3D(),n=[0,0,0,0];const i0=Math.floor((c.x-R)/FCELL),i1=Math.floor((c.x+R)/FCELL),j0=Math.floor((c.z-R)/FCELL),j1=Math.floor((c.z+R)/FCELL);
 for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const f=flower(i,j);if(!f)continue;if(low&&(i+j)%2)continue;const dx=f.x-c.x,dz=f.z-c.z;if(dx*dx+dz*dz>R*R||n[f.k]>=1400)continue;
  const h=safe(()=>hAt(f.x,f.z),0);if(h<-.5||Math.abs(f.z-RV(f.x))<22||safe(()=>roadNear(f.x,f.z,1),false))continue;o.position.set(f.x,h-.03,f.z);o.rotation.set(0,f.r,0);o.scale.set(f.s,f.s,f.s);o.updateMatrix();FL[f.k].setMatrixAt(n[f.k]++,o.matrix);}
 FL.forEach((m,k)=>{m.count=n[k];m.instanceMatrix.needsUpdate=true;});stat.flowers=n.reduce((a,b2)=>a+b2,0);}
// ---------- köy meydanı: cami ve minare, çeşme; Suriye tarafında savaşın izleri ----------
let CAMI=[],RUIN=[],WRECK=null;
function spot(v,dmin,dmax,m){for(let k=0;k<40;k++){const a=k*.9+dmin*.1,d=dmin+(k%8)*(dmax-dmin)/8,x=v.x+Math.cos(a)*d,z=v.z+Math.sin(a)*d;if(clearAt(x,z,m))return {x,z,rot:Math.atan2(v.x-x,v.z-z)};}return null;}
function buildSquare(){const vs=villages().filter(v=>v.hs.length>=7).slice(0,7),stone=new T.MeshLambertMaterial({color:0xe9e4d6}),lead=new T.MeshLambertMaterial({color:0x8d9399}),dark=new T.MeshLambertMaterial({color:0x3a3d40});
 for(const v of vs){const s=spot(v,20,60,9);if(!s)continue;const b=safe(()=>BX.make(s.x,s.z,s.rot,6.5,7,'cami',(b,part,win)=>{part('t',0,-.5,0,10.6,2,10.6,0,0x8a857a);part('w',0,3,0,10,6,10,0,0xece6d6);part('t',0,6.1,0,10.3,.25,10.3,0,0xd8d2c2);
  for(const x of[-3,0,3]){win(x,3.4,5.03,1.1,2.2,0);win(x,3.4,-5.03,1.1,2.2,0);}part('d',0,1.6,5.03,1.8,3,.12,0,0x5a3a22);return 6.3;}),null);if(!b)continue;
  const g=new T.Group(),y=safe(()=>hAt(s.x,s.z),0);g.position.set(s.x,y,s.z);g.rotation.y=s.rot;
  const dome=new T.Mesh(new T.SphereGeometry(4.3,20,10,0,Math.PI*2,0,Math.PI/2),lead);dome.position.y=6.2;g.add(dome);const fin=new T.Mesh(new T.CylinderGeometry(.06,.06,1.4,6),dark);fin.position.y=11.2;g.add(fin);
  const mn=new T.Mesh(new T.CylinderGeometry(.75,.9,22,12),stone);mn.position.set(5.6,11,-5.6);g.add(mn);const ser=new T.Mesh(new T.CylinderGeometry(1.25,1.1,.5,14),stone);ser.position.set(5.6,17.5,-5.6);g.add(ser);
  const cap=new T.Mesh(new T.ConeGeometry(.8,3.6,12),lead);cap.position.set(5.6,23.8,-5.6);g.add(cap);g.name='KH_CAMI';S.add(g);CAMI.push({b,g});
  const c=spot(v,6,22,4);if(c)safe(()=>BX.make(c.x,c.z,c.rot,1.6,999,'cesme',(b,part)=>{part('t',0,.8,0,2.6,1.6,1,0,0xcfc7b4);part('t',0,1.7,.5,1.8,.15,.6,0,0x9a9284);part('t',0,.2,.9,2.4,.4,.8,0,0x8a8274);return 1.8;}),null);}
 // Suriye tarafı: evlerin bir bölümü savaşta yıkılmış, yollarda yanmış araçlar
 const south=safe(()=>BLD.filter(q=>q.parts&&HOUSE[q.kind]&&!TR(q.x,q.z)),[]);south.forEach((q,i)=>{if((i*7)%10<4)RUIN.push(q);});ruin();
 const roads=safe(()=>WROADS,[]),pts=[];for(const r of roads)for(let i=1;i<r.pts.length;i++){const a=r.pts[i-1],b=r.pts[i],x=(a[0]+b[0])/2,z=(a[1]+b[1])/2;if(!TR(x,z)&&Math.abs(z-RV(x))>50)pts.push([x+6,z,Math.atan2(b[0]-a[0],b[1]-a[1])]);}
 WRECK=new T.InstancedMesh(new T.BoxGeometry(1,1,1),new T.MeshLambertMaterial({color:0x1d1b19}),pts.length*2);const o=new T.Object3D();let n=0;
 for(const[x,z,h]of pts){const y=safe(()=>hAt(x,z),0);o.position.set(x,y+.7,z);o.rotation.set(.06,h+.4,.1);o.scale.set(2,1.2,4.6);o.updateMatrix();WRECK.setMatrixAt(n++,o.matrix);o.position.set(x,y+1.55,z-.3);o.scale.set(1.8,.7,2.2);o.updateMatrix();WRECK.setMatrixAt(n++,o.matrix);}
 WRECK.count=n;WRECK.frustumCulled=false;WRECK.name='KH_ENKAZ';S.add(WRECK);stat.mosques=CAMI.length;stat.ruins=RUIN.length;stat.wrecks=pts.length;}
// yıkık evler her yeni savaşta da yıkık kalır (sessiz: toz ve ses yok)
function ruin(){for(const q of RUIN){q.ruin=1;q.dead=1;q.hp=0;q.g.scale.y=.28;if(q.sync)q.sync();}}
function squareStep(){for(const c of CAMI)c.g.visible=!c.b.dead;}
function build(){if(built||!root.THREE||typeof S==='undefined'||typeof BLD==='undefined'||!root.HisarSinir)return;T=root.THREE;if(!buildFolk())return;built=true;buildAnimals();buildFlowers();safe(buildSquare,null);}
// ---------- davranış ----------
function threats(){const out=[];safe(()=>{if(mode==='tank'&&game==='play')out.push(P);},null);for(const a of safe(()=>AL,[]))if(!a.dead)out.push(a);return out;}
let WAYF=null;
// Hedefe yürür; atacağı adım bir aracın yoluna düşüyorsa atmaz, bekler (f.wait)
function moveTo(f,tx,tz,sp,dt){const dx=tx-f.x,dz=tz-f.z,d=Math.hypot(dx,dz);if(d<.3)return true;const s=Math.min(d,sp*dt),nx=f.x+dx/d*s,nz=f.z+dz/d*s;if(WAYF&&WAYF(nx,nz)){f.wait=1;return false;}f.x=nx;f.z=nz;let a=Math.atan2(dx,dz)-f.yaw;while(a>Math.PI)a-=6.283;while(a<-Math.PI)a+=6.283;f.yaw+=a*Math.min(1,dt*6);return false;}
function faceTo(f,x,z,dt){let a=Math.atan2(x-f.x,z-f.z)-f.yaw;while(a>Math.PI)a-=6.283;while(a<-Math.PI)a+=6.283;f.yaw+=a*Math.min(1,dt*5);}
function nearestDoor(p){let best=null,bd=1e9;for(const h of (p.v?p.v.hs:[])){if(h.dead)continue;const d=door(h),k=Math.hypot(d.x-p.f.x,d.z-p.f.z);if(k<bd){bd=k;best=d;}}return best;}
// uzaktakiler (tanktan yaklaşık 320 m) beklemede kalır: işlemci yalnız görünen çevre için çalışır
const far=(f,c)=>c&&Math.abs(f.x-c.x)+Math.abs(f.z-c.z)>450;
function peopleStep(dt){const th=threats(),cam=safe(()=>({x:P.x,z:P.z}),null);
 for(const p of P_){const f=p.f;if(far(f,cam)&&p.st!=='home'&&p.st!=='hidden')continue;f.t+=dt*(f.act==='yuru'?p.sp*4.2:f.act==='kos'?7:1);p.cool-=dt;
  if(p.st==='hidden'){p.t-=dt;if(p.t<=0){p.st='idle';f.live=true;p.t=2;}continue;}
  if(p.st==='home'){p.t-=dt;if(p.t<=0){const d=door(pick(p.v.hs));f.x=d.x;f.z=d.z;f.live=true;p.st='walk';const s=p.v.school;p.path=[{x:p.v.x+(Math.random()-.5)*10,z:p.v.z+(Math.random()-.5)*10},s.gate,s.door];p.school=1;}continue;}
  /* tanka yol ver: üstüne araç gelen köylü (selam duruyor olsa da) yana koşar */
  const w=WAYF?WAYF(f.x,f.z):null;if(w){const st=sideStep(w,GIVE.insan,dt);f.x+=w.x*st;f.z+=w.z*st;f.yaw=Math.atan2(w.x,w.z);f.act='kos';p.hold=0;f.y=safe(()=>hAt(f.x,f.z),f.y);stat.gaveWay++;continue;}
  // tank yakında: selam ya da el sallama; çok yakında kenara çekilme
  let near=null,nd=1e9;for(const o of th){const d=Math.hypot(o.x-f.x,o.z-f.z);if(d<nd){nd=d;near=o;}}
  if(near&&nd<7&&p.st!=='run'){const e=flee(f.x,f.z,near.x,near.z),nx=f.x+e.x*3*dt,nz=f.z+e.z*3*dt;if(!WAYF||!WAYF(nx,nz)){f.x=nx;f.z=nz;}}
  if(p.hold>0){p.hold-=dt;if(near)faceTo(f,near.x,near.z,dt);if(p.hold<=0){f.act='dur';}else{f.y=safe(()=>hAt(f.x,f.z),f.y);continue;}}
  if(near&&p.st!=='run'){if(p.kid&&wantsSalute(nd,p.cool,false)){f.act='selam';p.hold=SAL.hold;p.cool=SAL.cool;stat.salutes++;if(clock-sayT>90){sayT=clock;safe(()=>root.CREW.say('Komutanım, çocuklar selam veriyor.',1,'selam',90),null);}continue;}
   if(!p.kid&&p.kind!=='coban'&&nd<SAL.wave&&p.cool<=0){f.act='el-salla';p.hold=2.6;p.cool=40;stat.waves++;continue;}}
  if(p.st==='run'){const d=p.to;if(!d||moveTo(f,d.x,d.z,4,dt)){p.st='hidden';f.live=false;p.t=40+Math.random()*20;stat.fled++;}else f.act='kos';}
  else if(p.st==='walk'){const w=p.path[0];if(!w){p.st='idle';p.t=3+Math.random()*8;f.act='dur';}else if(moveTo(f,w.x,w.z,p.sp*(p.kid?1.15:1),dt)){p.path.shift();if(!p.path.length){if(p.school){p.school=0;p.st='home';f.live=false;p.t=20+Math.random()*40;}else{p.st='idle';p.t=4+Math.random()*10;f.act='dur';}}}else f.act='yuru';}
  else if(p.st==='herd'){const h=p.herd;if(moveTo(f,h.x-7,h.z-3,1,dt))f.act='dur';else f.act='yuru';}
  else{p.t-=dt;f.act='dur';if(p.t<=0&&p.v){const d=door(pick(p.v.hs));p.path=Math.random()<.5?[{x:p.v.x+(Math.random()-.5)*14,z:p.v.z+(Math.random()-.5)*14},d]:[d];p.st='walk';}}
  if(f.wait){f.wait=0;f.act='dur';}f.y=safe(()=>hAt(f.x,f.z),f.y);}
 stat.hidden=P_.filter(p=>p.st==='hidden'||p.st==='home').length;stat.saluting=P_.filter(p=>p.f.act==='selam'&&p.f.live).length;}
function animalStep(dt){const th=threats(),cam=safe(()=>({x:P.x,z:P.z}),null);for(const a of A_){const f=a.f;if(a.st!=='sky'&&far(f,cam))continue;f.t+=dt*(f.act==='kos'?9:f.act==='yuru'?5:1);
  if(a.st==='sky'){const s=a.sky;s.a+=s.w*dt;f.x=s.x+Math.cos(s.a)*s.r;f.z=s.z+Math.sin(s.a)*s.r;f.y=safe(()=>hAt(s.x,s.z),0)+s.h+Math.sin(clock*.3+s.r)*2;f.yaw=Math.atan2(-Math.sin(s.a)*Math.sign(s.w),Math.cos(s.a)*Math.sign(s.w));f.act=Math.sin(clock*.4+s.r)>.2?'uc':'suzul';continue;}
  /* araca yol ver: üstüne araç gelen hayvan yana kaçar */
  const w=WAYF?WAYF(f.x,f.z):null;if(w){const st=sideStep(w,GIVE[a.kind]||GIVE.koyun,dt);f.x+=w.x*st;f.z+=w.z*st;f.yaw=Math.atan2(w.x,w.z);f.act='kos';a.st='idle';a.t=1.2;f.y=safe(()=>hAt(f.x,f.z),f.y);stat.gaveWay++;continue;}
  let near=null,nd=1e9;for(const o of th){const d=Math.hypot(o.x-f.x,o.z-f.z);if(d<nd){nd=d;near=o;}}const fr=a.kind==='inek'?18:a.kind==='tavuk'?10:30;
  if(near&&nd<fr){const e=flee(f.x,f.z,near.x,near.z);a.tx=f.x+e.x*14;a.tz=f.z+e.z*14;a.st='kos';if(a.herd&&!a.dog){a.herd.x+=e.x*dt*2;a.herd.z+=e.z*dt*2;}}
  if(a.st==='kos'){if(moveTo(f,a.tx,a.tz,a.kind==='tavuk'?3:a.kind==='inek'?3.5:4.5,dt)){a.st='idle';a.t=2;}f.act='kos';}
  else if(a.st==='walk'){if(moveTo(f,a.tx,a.tz,a.sp,dt)){a.st='idle';a.t=3+Math.random()*8;}f.act='yuru';}
  else{a.t-=dt;f.act=a.kind==='tavuk'?'gagala':a.kind==='kopek'?'dur':'otla';if(a.t<=0){const c=a.herd||a.home||{x:f.x,z:f.z},r=a.dog?18:a.herd?13:a.kind==='tavuk'?4:8,an=Math.random()*6.283;a.tx=c.x+Math.cos(an)*Math.random()*r;a.tz=c.z+Math.sin(an)*Math.random()*r;a.st='walk';}}
  if(f.wait){f.wait=0;f.act=a.kind==='tavuk'?'gagala':'dur';}f.y=safe(()=>hAt(f.x,f.z),f.y);}}
function boomNear(x,z){for(const p of P_){if(p.st==='hidden'||p.st==='home'||p.kind==='coban')continue;if(Math.hypot(p.f.x-x,p.f.z-z)<140){p.st='run';p.hold=0;p.to=nearestDoor(p);}}
 for(const a of A_){if(a.st==='sky')continue;if(Math.hypot(a.f.x-x,a.f.z-z)<90){const e=flee(a.f.x,a.f.z,x,z);a.tx=a.f.x+e.x*25;a.tz=a.f.z+e.z*25;a.st='kos';}}}
function reset(){for(const p of P_){if(p.v&&p.v.school&&p.kid){p.st='home';p.t=Math.random()*25;p.f.live=false;}else if(p.st==='hidden'||p.st==='run'){p.st='idle';p.f.live=true;p.t=1;}p.hold=0;}}
function frame(dt){if(!built)build();if(!built)return;squareStep();const c=safe(()=>CAM.position,null);if(!c)return;folk.frame(c.x,c.z,230);for(const k in beasts)beasts[k].frame(c.x,c.z,k==='leylek'?420:220);flowerStep(false);}
function wrap(name,factory){if(hooks[name]||typeof root[name]!=='function')return;root[name]=factory(root[name]);hooks[name]=true;}
function connect(){build();
 wrap('update',old=>function(dt){const r=old.apply(this,arguments);const d=clamp(+dt||0,0,.1);clock+=d;if(built)safe(()=>{peopleStep(d);animalStep(d);},null);return r;});
 wrap('sndBoom',old=>function(x,z){safe(()=>boomNear(x,z),null);return old.apply(this,arguments);});
 wrap('startMission',old=>function(){safe(reset,null);const r=old.apply(this,arguments);safe(ruin,null);return r;});
 if(!hooks.frame&&typeof FRAME_HOOKS!=='undefined'){hooks.frame=true;FRAME_HOOKS.push(dt=>safe(()=>frame(dt),null));}}
function diagnostics(){return {version:VERSION,built,hooks:{...hooks},...stat,animals:{...stat.animals},
 kidsOut:P_.filter(p=>p.kid&&p.f.live).map(p=>({x:Math.round(p.f.x),z:Math.round(p.f.z),act:p.f.act,st:p.st})).slice(0,40)};}
root.HisarKoy=Object.freeze({version:VERSION,core,connect,diagnostics,flowers:()=>flowerStep(true),people:()=>P_,animals:()=>A_});
connect();doc.addEventListener('hisar:ui-ready',connect);
})(typeof window!=='undefined'?window:globalThis);
