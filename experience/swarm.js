/* ÇELİK BÖRÜ sürü 1.0 — sürü dronlar ve mikrodalga dron savar ("Son Takım" savaşında).
 * Oyuncu telsizden ya da Y tuşuyla tek seferde dört dronluk bir sürü kaldırır; sürü işaretli ya da görünen düşmana dalar,
 * hedef yoksa tankın üstünde dolaşıp gelen düşman dronlarını çarparak düşürür.
 * Rakip takımlar da sürü gönderir. Karşılığı mikrodalga dron savardır: karargâhtaki cihaz menzile giren düşman dronlarını
 * kendiliğinden indirir, tanktaki cihaz tek tuşla (E) çevredeki bütün düşman dronlarını düşürür. Dost dronlara dokunmaz.
 */
(function(root){'use strict';
const VERSION='1.0.0';
const doc=root.document;
const safe=(f,d)=>{try{return f();}catch(e){return d;}};
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const rnd=()=>Math.random();

// ---------- ayarlar ----------
// OWN: oyuncunun sürüsü. n dron sayısı, alt seyir yüksekliği (m), sp seyir hızı, dive dalış hızı (m/sn), hit çarpma uzaklığı,
// dmg düşman tankına verdiği hasar (en yüksek canın oranı), range hedef arama menzili, life pil süresi (sn), guard korumada yakalama menzili.
const OWN=Object.freeze({n:4,alt:30,sp:26,dive:34,hit:4,dmg:.55,range:600,life:150,guard:150,orbit:26});
// FOE: rakip sürüsü. size zorluğa göre dron sayısı, range fırlatma menzili, cool iki sürü arası (sn), first ilk sürü,
// cap aynı anda havadaki en çok sürü, dmgP oyuncuya ve dosta isabet başına hasar katsayısı, dmgBase karargâha verdiği hasar.
const FOE=Object.freeze({alt:28,sp:22,dive:30,hit:4,life:110,range:520,cool:[55,85],first:[45,70],cap:2,dmgP:.9,dmgBase:14,
 size:Object.freeze({kolay:3,normal:4,zor:5,serbest:0})});
// MW: mikrodalga dron savar. tank: menzil ve dolum (sn); base: karargâhtaki cihaz; hp karargâhın dayanıklılığı.
const MW=Object.freeze({tank:Object.freeze({r:200,cd:18}),base:Object.freeze({r:330,cd:5}),hp:100,supply:60});
const POOL=16;

// ---------- çekirdek (sınanabilir, oyundan bağımsız) ----------
// Dronu hedef noktaya doğru en çok v*dt kadar götürür; kalan uzaklığı döndürür.
function steer(d,tx,ty,tz,v,dt){const dx=tx-d.x,dy=ty-d.y,dz=tz-d.z,l=Math.hypot(dx,dy,dz);if(l<1e-6)return 0;const s=Math.min(l,v*dt);
 d.x+=dx/l*s;d.y+=dy/l*s;d.z+=dz/l*s;d.h=Math.atan2(dx,dz);return l-s;}
// n dronu hedeflere ikişer ikişer dağıtır (en yakın önce; iki isabet bir tankı yok eder); hedef yoksa boş dizi.
function assign(targets,n,from,per=2){const t=targets.slice().sort((a,b)=>Math.hypot(a.x-from.x,a.z-from.z)-Math.hypot(b.x-from.x,b.z-from.z));
 if(!t.length)return [];const out=[];for(let i=0;i<n;i++)out.push(t[Math.floor(i/per)%t.length]);return out;}
// Mikrodalga darbesi: (x,z) çevresinde r içindeki düşman dronları (yerdekiler ve düşenler hariç) düşer; düşenleri döndürür.
function pulse(list,x,z,r){const hit=[];for(const d of list){if(d.side!=='foe'||d.st==='fall'||d.st==='gone')continue;if(Math.hypot(d.x-x,d.z-z)<=r){d.st='fall';d.vy=0;hit.push(d);}}return hit;}
function swarmSize(key){const n=FOE.size[key];return n==null?FOE.size.normal:n;}
// Karargâh yeri: başlangıcın arkasında, uygun zeminde.
function basePoint(sp,ok){const h=Math.atan2(-sp.x,-sp.z);for(const [back,side] of [[32,0],[32,14],[32,-14],[46,0],[24,22],[24,-22],[60,0]]){
  const x=sp.x-Math.sin(h)*back+Math.cos(h)*side,z=sp.z-Math.cos(h)*back-Math.sin(h)*side;if(!ok||ok(x,z))return {x,z,h};}
 return {x:sp.x-Math.sin(h)*32,z:sp.z-Math.cos(h)*32,h};}
const core=Object.freeze({VERSION,OWN,FOE,MW,steer,assign,pulse,swarmSize,basePoint});
if(typeof module==='object'&&module.exports)module.exports=core;
if(!doc)return; // Node sınamalarında yalnız çekirdek yüklenir

// ---------- oyun ----------
let W=null,gfx=null,ui=null,hooked=false;const hooks={};
const live=()=>safe(()=>root.HisarBattle.live(),null);
const playing=()=>safe(()=>game==='play'&&mis==='savas',false);
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const note=(t,k)=>safe(()=>root.HisarBattle.note(t,k),null);
const dcMax=()=>safe(()=>root.DCX(),9);

function mat(c,e){return new root.THREE.MeshLambertMaterial({color:c,emissive:e||0});}
function buildGfx(){if(gfx||!root.THREE||typeof S==='undefined')return;const T=root.THREE,mk=(geo,m)=>{const im=new T.InstancedMesh(geo,m,POOL);im.count=0;im.frustumCulled=false;S.add(im);return im;};
 const body=new T.BoxGeometry(.9,.26,.9),arms=new T.BoxGeometry(2.3,.08,.16),disc=new T.CylinderGeometry(.62,.62,.03,10),led=new T.SphereGeometry(.2,8,6);
 arms.rotateY(Math.PI/4);const arms2=arms.clone();arms2.rotateY(Math.PI/2);
 const side=(c,lc)=>({body:mk(body,mat(c)),arm:mk(arms,mat(0x1d1f1c)),arm2:mk(arms2,mat(0x1d1f1c)),disc:mk(disc,new T.MeshBasicMaterial({color:0x111111,transparent:true,opacity:.45,depthWrite:false})),led:mk(led,new T.MeshBasicMaterial({color:lc,fog:false}))});
 const wave=new T.Mesh(new T.SphereGeometry(1,28,14,0,Math.PI*2,0,Math.PI/2),new T.MeshBasicMaterial({color:0x9fe8ff,transparent:true,opacity:0,depthWrite:false,side:T.DoubleSide,wireframe:true}));wave.visible=false;S.add(wave);
 gfx={own:side(0x4b5a3a,0x5cf0ff),foe:side(0x7d6a4c,0xff3b2a),wave,wt:0,wr:0,_m:new T.Matrix4(),_q:new T.Quaternion(),_e:new T.Euler(),_s:new T.Vector3(1.6,1.6,1.6),_p:new T.Vector3()};}
function buildBase(b){const T=root.THREE;if(!T)return null;const g=new T.Group(),y=safe(()=>hAt(b.x,b.z),0);g.position.set(b.x,y,b.z);g.rotation.y=b.h;
 const olive=mat(0x55603f),dark=mat(0x2a2d27),sand=mat(0x9b8b68);
 const pad=new T.Mesh(new T.BoxGeometry(16,.4,12),sand);pad.position.y=.2;g.add(pad);
 const box=new T.Mesh(new T.BoxGeometry(6,2.6,2.6),olive);box.position.set(-3.2,1.7,-2.6);g.add(box);
 const box2=new T.Mesh(new T.BoxGeometry(4.6,2.3,2.4),olive);box2.position.set(4,1.55,-3);g.add(box2);
 const mast=new T.Mesh(new T.CylinderGeometry(.12,.16,12,6),dark);mast.position.set(5.6,6.4,3.2);g.add(mast);
 const tower=new T.Group();tower.position.set(1.2,1.2,2.4);g.add(tower);
 const ped=new T.Mesh(new T.CylinderGeometry(.55,.75,2.6,8),dark);ped.position.y=1.3;tower.add(ped);
 // anten çanağı: ızgaralı halka ve göbek; dikey durur, yavaşça döner
 const dish=new T.Group();dish.position.y=3.6;tower.add(dish);const ring=new T.Mesh(new T.TorusGeometry(2.4,.09,6,28),dark);dish.add(ring);
 const grid=new T.Mesh(new T.CircleGeometry(2.4,20),new T.MeshBasicMaterial({color:0x2a2d27,wireframe:true,transparent:true,opacity:.75}));dish.add(grid);
 for(let i=0;i<6;i++){const s=new T.Mesh(new T.BoxGeometry(4.8,.07,.07),dark);s.rotation.z=i*Math.PI/6;dish.add(s);}
 const hub=new T.Mesh(new T.CylinderGeometry(.35,.35,.9,8),olive);hub.rotation.x=Math.PI/2;hub.position.z=.4;dish.add(hub);
 const flag=new T.Mesh(new T.PlaneGeometry(1.6,1),new T.MeshBasicMaterial({color:0x5cf0ff,side:T.DoubleSide}));flag.position.set(6.4,11.8,3.2);g.add(flag);
 g.scale.setScalar(1.35);g.traverse(o=>{if(o.isMesh&&o.material.isMeshLambertMaterial){o.castShadow=true;o.receiveShadow=true;}});g.userData.dish=dish;g.name='SR_KARARGAH';S.add(g);return g;}

function reset(){if(W){if(W.base&&W.base.g)safe(()=>root.rm(W.base.g),null);}W=null;if(gfx){for(const k of ['own','foe'])for(const m of Object.values(gfx[k]))m.count=0;gfx.wave.visible=false;}paintUI();}
function begin(Bv){reset();buildGfx();const sp=Bv.start||{x:0,z:0},bp=basePoint(sp,(x,z)=>safe(()=>hAt(x,z)>-.4&&Math.abs(z-riv(x))>30,true));
 W={B:Bv,list:[],swarms:0,tankCd:0,kills:0,lost:0,downed:0,mode:'auto',base:{x:bp.x,z:bp.z,h:bp.h,hp:MW.hp,cd:0,sup:0,g:null},warn:0,warnFor:null};
 W.base.g=buildBase(W.base);paintUI();}

// ---------- oyuncunun sürüsü ----------
function enemies(){return safe(()=>E.filter(e=>e.hp>0&&e.type!=='bridge'&&dist(e,P)<OWN.range&&(e.mark||spotted(e))),[]);}
function ownTargets(){const ex=enemies();const pri=safe(()=>[cmdTgt,typeof lockE!=='undefined'?lockE:null].filter(e=>e&&ex.includes(e)),[]);
 if(pri.length)return pri.concat(ex.filter(e=>!pri.includes(e)&&e.type==='tank').slice(0,1));return ex.filter(e=>e.type==='tank').concat(ex.filter(e=>e.type!=='tank'));}
function launch(){if(!W||!playing())return 0;let n=Math.min(OWN.n,safe(()=>DC,0));if(n<=0){safe(()=>root.say('Yedek Uçangöz kalmadı · ikmal sandığına ya da karargâha git',2.2),null);return 0;}
 safe(()=>{DC-=n;},null);const tg=W.mode==='guard'?[]:assign(ownTargets(),n,P),y=safe(()=>hAt(P.x,P.z),0)+2.4;
 for(let i=0;i<n;i++){const a=i/n*Math.PI*2;W.list.push({side:'own',x:P.x+Math.cos(a)*2,y,z:P.z+Math.sin(a)*2,h:0,vy:0,st:'climb',t:0,a,tg:tg[i]||null,sw:0});}
 safe(()=>root.say('SÜRÜ HAVADA · '+n+' DRON',1.8),null);safe(()=>root.radio('Sürü: '+n+' dron havada, '+(tg.length?'hedefe gidiyoruz.':'tankın üstündeyiz.')),null);safe(()=>root.sndBip(),null);paintUI();return n;}
function order(m){if(!W)return;W.mode=m;const own=W.list.filter(d=>d.side==='own'&&d.st!=='fall'&&d.st!=='gone');
 if(m==='attack'){const tg=assign(ownTargets(),own.length,P);if(!tg.length){safe(()=>root.say('Görünen hedef yok · sürü tankı koruyor',1.6),null);for(const d of own){d.tg=null;d.st='guard';}return;}own.forEach((d,i)=>{d.tg=tg[i];d.st='cruise';});safe(()=>root.radio('Sürü: hedefe dalıyoruz.'),null);}
 else if(m==='guard'){for(const d of own){d.tg=null;d.st='guard';}safe(()=>root.radio('Sürü: tankın üstündeyiz, gelen dronları yakalarız.'),null);}
 else if(m==='home'){for(const d of own){d.tg=null;d.st='home';}safe(()=>root.radio('Sürü: geri dönüyoruz.'),null);}
 paintUI();}
function explode(d,big){safe(()=>root.boom(d.x,d.y,d.z,big?2.4:1.2),null);safe(()=>root.sndBoom(d.x,d.z),null);d.st='gone';}
function stepOwn(d,dt){d.t+=dt;const gy=safe(()=>hAt(d.x,d.z),0);
 if(d.t>OWN.life&&d.st!=='home')d.st='home';
 if(d.st==='climb'){d.y+=12*dt;if(d.y-gy>=OWN.alt*.7)d.st=d.tg?'cruise':'guard';return;}
 if(d.st==='cruise'||d.st==='dive'){const e=d.tg;if(!e||!(e.hp>0)||!safe(()=>E.includes(e),false)){const tg=assign(ownTargets(),1,d,1);d.tg=tg[0]||null;if(!d.tg){d.st='guard';return;}}
  const t=d.tg,ty=safe(()=>hAt(t.x,t.z),0)+1.6,hd=dist(d,t);
  if(d.st==='cruise'){steer(d,t.x,Math.max(ty,gy)+OWN.alt,t.z,OWN.sp,dt);if(hd<OWN.alt*1.1)d.st='dive';return;}
  const left=steer(d,t.x,ty,t.z,OWN.dive,dt);if(left<OWN.hit){explode(d,true);const k=safe(()=>t.mx||100,100);t.hp-=k*OWN.dmg;t.sn=t.hp;W.hits=(W.hits||0)+1;if(t.hp<=0){W.kills++;safe(()=>root.killE(t),null);}}return;}
 if(d.st==='guard'){// tankın üstünde daire çizer; korumada gelen düşman dronunu yakalar
  let f=null,fd=OWN.guard;for(const o of W.list){if(o.side!=='foe'||o.st==='fall'||o.st==='gone')continue;const k=dist(o,P);if(k<fd){fd=k;f=o;}}
  if(f){const left=steer(d,f.x,f.y,f.z,OWN.dive,dt);if(left<3){explode(d,false);f.st='fall';f.vy=0;W.downed++;note('Sürü bir düşman dronunu çarparak düşürdü','iyi');}return;}
  d.a+=dt*.55;steer(d,P.x+Math.cos(d.a)*OWN.orbit,gy+OWN.alt,P.z+Math.sin(d.a)*OWN.orbit,OWN.sp,dt);
  if(W.mode!=='guard'&&rnd()<dt*.5){const tg=assign(ownTargets(),1,d);if(tg[0]){d.tg=tg[0];d.st='cruise';}}return;}
 if(d.st==='home'){const left=steer(d,P.x,safe(()=>hAt(P.x,P.z),0)+2.5,P.z,OWN.sp,dt);if(left<4){d.st='gone';safe(()=>{DC=Math.min(dcMax(),DC+1);},null);}}}

// ---------- rakip sürüleri ----------
function foeTargets(o){const t=[];if(dist(P,o)<FOE.range)t.push({k:'p',x:P.x,z:P.z});safe(()=>{for(const a of AL)if(!a.dead&&dist(a,o)<FOE.range)t.push({k:'a',a,x:a.x,z:a.z});},null);
 const b=W.base;if(b&&b.hp>0&&dist(b,o)<FOE.range+120)t.push({k:'b',x:b.x,z:b.z});return t;}
function foeLaunch(s,o,n){const ts=foeTargets(o);if(!ts.length)return false;let pick=ts.find(t=>t.k==='b')&&rnd()<.45?ts.find(t=>t.k==='b'):ts[Math.floor(rnd()*ts.length)];
 const id=++W.swarms,y=safe(()=>hAt(o.x,o.z),0)+3;for(let i=0;i<n;i++)W.list.push({side:'foe',sw:id,x:o.x+(rnd()-.5)*8,y:y+rnd()*2,z:o.z+(rnd()-.5)*8,h:0,vy:0,st:'climb',t:0,a:rnd()*7,tg:pick,from:s.name});
 const at=pick.k==='b'?'karargâha':pick.k==='a'?'dost tanka':'sana';
 note(s.name+' takımı '+n+' dronluk sürü gönderdi · '+at,'kotu');
 if(pick.k==='b')safe(()=>root.radio('Karargâh: dron sürüsü geliyor, dron savar devrede.'),null);
 else{safe(()=>root.say('DÜŞMAN DRON SÜRÜSÜ · '+(safe(()=>document.body.classList.contains('tc'),false)?'DRON SAVAR':'E: DRON SAVAR'),2.4),null);safe(()=>root.radio('Telsiz: Düşman dron sürüsü geliyor, '+n+' dron! Dron savarı hazırla.'),null);}
 return true;}
function stepFoeLaunch(){const Bv=W.B,key=safe(()=>lvKey,'normal'),n=swarmSize(key);if(!n||safe(()=>!(L.dmg>0),false))return;
 const up=new Set(W.list.filter(d=>d.side==='foe'&&d.st!=='fall'&&d.st!=='gone').map(d=>d.sw));if(up.size>=FOE.cap)return;
 for(const s of Bv.squads){if(s.dead)continue;if(s.nd==null){s.nd=Bv.time+FOE.first[0]+rnd()*(FOE.first[1]-FOE.first[0]);continue;}if(Bv.time<s.nd)continue;
  let o=null;if(s.active){const t=s.tanks.find(q=>q.e&&q.hp>0&&safe(()=>E.includes(q.e),false));if(t)o={x:t.e.x,z:t.e.z};}else o={x:s.x,z:s.z};
  if(!o){s.nd=Bv.time+10;continue;}
  if(foeLaunch(s,o,n)){s.nd=Bv.time+FOE.cool[0]+rnd()*(FOE.cool[1]-FOE.cool[0]);return;}s.nd=Bv.time+8;}}
function foeAim(d){const t=d.tg;if(!t)return null;if(t.k==='p')return {x:P.x,z:P.z};if(t.k==='a'){if(t.a.dead)return null;return {x:t.a.x,z:t.a.z};}if(t.k==='b')return W.base.hp>0?{x:W.base.x,z:W.base.z}:null;return null;}
function foeHit(d){const t=d.tg;explode(d,true);
 if(t.k==='p'){if(dist(d,P)<FOE.hit+3)safe(()=>root.hitP(FOE.dmgP,{x:d.x,y:d.y,z:d.z}),null);}
 else if(t.k==='a'){if(!t.a.dead&&dist(d,t.a)<FOE.hit+3)safe(()=>root.hitAl(t.a,FOE.dmgP),null);}
 else if(t.k==='b'){const b=W.base;if(b.hp>0){b.hp=Math.max(0,b.hp-FOE.dmgBase);if(b.hp<=0){note('Karargâh vuruldu · dron savar devre dışı','kotu');safe(()=>root.radio('Karargâh: dron savar vuruldu, devre dışıyız!'),null);if(b.g&&b.g.userData.dish)b.g.userData.dish.rotation.z=.5;}}}}
function stepFoe(d,dt){d.t+=dt;const gy=safe(()=>hAt(d.x,d.z),0);
 if(d.st==='fall'){d.vy-=9.8*dt;d.y+=d.vy*dt;d.a+=dt*9;if(d.y<=gy+.3){d.y=gy+.3;d.st='gone';safe(()=>root.boom(d.x,d.y,d.z,.8),null);}return;}
 if(d.t>FOE.life){d.st='fall';d.vy=0;return;}
 if(d.st==='climb'){d.y+=11*dt;if(d.y-gy>=FOE.alt*.7)d.st='cruise';return;}
 let aim=foeAim(d);if(!aim){d.tg={k:'p'};aim={x:P.x,z:P.z};}
 const ty=safe(()=>hAt(aim.x,aim.z),0)+1.6,hd=Math.hypot(aim.x-d.x,aim.z-d.z);
 if(d.st==='cruise'){steer(d,aim.x,Math.max(ty,gy)+FOE.alt,aim.z,FOE.sp,dt);if(hd<FOE.alt)d.st='dive';return;}
 const left=steer(d,aim.x,ty,aim.z,FOE.dive,dt);if(left<FOE.hit)foeHit(d);
 // dost tanklar dalıştaki dronu makineliyle düşürmeye çalışır
 safe(()=>{for(const a of AL)if(!a.dead&&dist(a,d)<45&&rnd()<dt*.35){d.st='fall';d.vy=0;W.downed++;break;}},null);}

// ---------- mikrodalga dron savar ----------
function wave(x,z,r){if(!gfx)return;const w=gfx.wave;w.position.set(x,safe(()=>hAt(x,z),0),z);w.visible=true;gfx.wt=0;gfx.wr=r;w.scale.setScalar(2);w.material.opacity=.5;}
function zap(x,z,r,who){const hit=pulse(W.list,x,z,r);wave(x,z,r);safe(()=>{root.sndBip();root.setTimeout(()=>root.sndBip(),120);},null);
 if(hit.length){W.downed+=hit.length;note(who+' '+hit.length+' dron düşürdü','iyi');}return hit.length;}
function fireTank(){if(!W||!playing()||safe(()=>mode!=='tank',true))return -1;if(W.tankCd>0){safe(()=>root.say('Dron savar doluyor · '+Math.ceil(W.tankCd)+' sn',1.2),null);return -1;}
 W.tankCd=MW.tank.cd;const n=zap(P.x,P.z,MW.tank.r,'Dron savar');safe(()=>root.say(n?'DRON SAVAR · '+n+' DRON DÜŞTÜ':'DRON SAVAR · menzilde dron yok',1.6),null);paintUI();return n;}
function stepBase(dt){const b=W.base;if(!b||b.hp<=0)return;b.cd=Math.max(0,b.cd-dt);b.sup=Math.max(0,b.sup-dt);
 if(b.g&&b.g.userData.dish)b.g.userData.dish.parent.rotation.y+=dt*(b.cd>MW.base.cd-1?3:.5);
 if(b.cd<=0&&W.list.some(d=>d.side==='foe'&&d.st!=='fall'&&d.st!=='gone'&&dist(d,b)<=MW.base.r)){b.cd=MW.base.cd;zap(b.x,b.z,MW.base.r,'Karargâh dron savarı');}
 // karargâh ikmal noktasıdır
 if(b.sup<=0&&dist(P,b)<16&&safe(()=>mode==='tank',false)){b.sup=MW.supply;safe(()=>root.HisarBattle.resupply(),null);note('Karargâhta ikmal · mühimmat ve Uçangözler doldu, zırh onarıldı','iyi');safe(()=>root.say('İKMAL TAMAM',1.8),null);}}

// ---------- adım ve çizim ----------
function step(dt){const Bv=live();if(!Bv||Bv.over){if(W)reset();return;}if(!W||W.B!==Bv)begin(Bv);
 W.tankCd=Math.max(0,W.tankCd-dt);stepBase(dt);if(safe(()=>root.HisarBattle.eventsOn(),true))stepFoeLaunch();
 for(const d of W.list)if(d.side==='own')stepOwn(d,dt);else stepFoe(d,dt);
 W.list=W.list.filter(d=>d.st!=='gone');
 if(gfx){const w=gfx.wave;if(w.visible){gfx.wt+=dt;const k=Math.min(1,gfx.wt/.6);w.scale.setScalar(2+(gfx.wr-2)*k);w.material.opacity=.5*(1-k);if(k>=1)w.visible=false;}}
 const near=W.list.some(d=>d.side==='foe'&&d.st!=='fall'&&dist(d,P)<400);if(ui)ui.btn.classList.toggle('warn',near&&W.tankCd<=0);
 paintUI();}
function draw(){if(!gfx)return;const m=gfx._m,q=gfx._q,e=gfx._e,s=gfx._s,p=gfx._p,t=performance.now()/1000;
 for(const side of ['own','foe']){const g=gfx[side];let n=0;if(W)for(const d of W.list){if(d.side!==side||n>=POOL)continue;
   const tilt=d.st==='fall'?d.a:d.st==='dive'?.6:.15;e.set(tilt,d.h,d.st==='fall'?d.a*.7:0,'YXZ');q.setFromEuler(e);p.set(d.x,d.y,d.z);m.compose(p,q,s);
   g.body.setMatrixAt(n,m);g.arm.setMatrixAt(n,m);g.arm2.setMatrixAt(n,m);g.disc.setMatrixAt(n,m);
   p.set(d.x,d.y+.35,d.z);m.compose(p,q,s);g.led.setMatrixAt(n,m);n++;}
  for(const k of ['body','arm','arm2','disc','led']){g[k].count=n;g[k].instanceMatrix.needsUpdate=true;}
  g.led.material.opacity=1;g.led.visible=n>0&&((t*4|0)%2===0||side==='own');}}
function drawMini(){if(!W||typeof mmx==='undefined')return;safe(()=>{const Wd=132,O=mmO(),X=x=>((x-O.x)/MMR+.5)*Wd,Z=z=>((z-O.z)/MMR+.5)*Wd,b=W.base;mmx.save();
 if(b){let x=X(b.x),y=Z(b.z);const dx=x-Wd/2,dy=y-Wd/2,l=Math.hypot(dx,dy),mx=Wd/2-7;if(l>mx){x=Wd/2+dx/l*mx;y=Wd/2+dy/l*mx;}mmx.fillStyle=b.hp>0?'#5cf0ff':'#56636a';mmx.strokeStyle='#05232a';mmx.lineWidth=1.5;mmx.beginPath();mmx.rect(x-4.5,y-4.5,9,9);mmx.fill();mmx.stroke();}
 for(const d of W.list){if(d.st==='fall')continue;const x=X(d.x),y=Z(d.z);if(x<0||y<0||x>Wd||y>Wd)continue;mmx.fillStyle=d.side==='own'?'#5cf0ff':'#ff3b2a';mmx.beginPath();mmx.arc(x,y,d.side==='own'?2:2.4,0,7);mmx.fill();}
 mmx.restore();},null);}
function drawMap(c,SX,SY,s){if(!W)return;const b=W.base;c.save();
 if(b){const x=SX(b.x),y=SY(b.z);if(b.hp>0){c.strokeStyle='rgba(92,240,255,.55)';c.setLineDash([5,5]);c.lineWidth=1.5;c.beginPath();c.arc(x,y,MW.base.r*s,0,7);c.stroke();c.setLineDash([]);}
  c.fillStyle=b.hp>0?'#5cf0ff':'#56636a';c.strokeStyle='#05232a';c.lineWidth=2;c.beginPath();c.rect(x-8,y-8,16,16);c.fill();c.stroke();c.font='700 12px '+(safe(()=>getComputedStyle(doc.body).getPropertyValue('--sf'),'')||'system-ui');c.textAlign='center';c.fillStyle='#5cf0ff';c.fillText('KARARGÂH',x,y-13);}
 for(const d of W.list){if(d.st==='fall')continue;c.fillStyle=d.side==='own'?'#5cf0ff':'#ff3b2a';c.beginPath();c.arc(SX(d.x),SY(d.z),3,0,7);c.fill();}
 c.restore();}

// ---------- arayüz: dron savar düğmesi ve telsizdeki sürü bölümü ----------
const IC='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M12 13.5v8M9 21.5h6"/><path d="M5.2 6.8a9.6 9.6 0 0 0 13.6 13.6M8.4 9.9a5.2 5.2 0 0 0 5.7 5.7"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><path d="M15 3.2l1.6 2.6M19.2 6.4l2.4 1.8"/></svg>';
function installUI(){if(ui||!doc.body)return;const ab=doc.getElementById('uAb');if(!ab)return;
 const st=doc.createElement('style');st.id='sr-style';st.textContent=`
#abE[hidden]{display:none!important}#abE.warn{animation:srUyari .8s ease-in-out infinite}#abE.cd{opacity:.62}
body.tc #abE b{display:none}
@keyframes srUyari{50%{box-shadow:0 0 0 5px rgba(92,240,255,.55),0 0 22px rgba(92,240,255,.75)}}
@media (prefers-reduced-motion:reduce){#abE.warn{animation:none;box-shadow:0 0 0 4px rgba(92,240,255,.6)}}
#sr-box{margin:12px 0 0;padding:10px 0 0;border-top:1px solid var(--cizgi,#4a4f43)}#sr-box h4{margin:0 0 8px;font:800 14px/1 var(--sf,system-ui);letter-spacing:.08em;color:#fff}
#sr-box .sr-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}#sr-box .sr-row button{text-align:left;font-size:14.5px}#sr-box .sr-row button.on{border-color:#5cf0ff;box-shadow:inset 0 0 0 1px #5cf0ff}
#sr-box #sr-up{grid-column:1/-1;background:linear-gradient(180deg,#3d6f7a,#25474f);border-color:#5cf0ff;text-align:center;font-weight:800;letter-spacing:.05em}
#sr-box p{margin:8px 0 12px;font:600 13.5px/1.3 var(--sf,system-ui);color:var(--kemik2,#bdc3b2)}`;doc.head.appendChild(st);
 const btn=doc.createElement('button');btn.id='abE';btn.className='ab g1';btn.type='button';btn.title='Dron savar (E)';btn.hidden=true;btn.innerHTML=IC+'<b>E</b><small>SAVAR</small><i><s></s></i>';
 btn.addEventListener('click',e=>{e.stopPropagation();fireTank();});ab.insertBefore(btn,ab.firstChild);
 ui={btn,box:null};mountBox();}
function mountBox(){if(!ui||ui.box)return;const panel=doc.getElementById('hr-panel'),cmds=panel&&panel.querySelector('.hr-orders');if(!cmds)return;
 const box=doc.createElement('div');box.id='sr-box';box.innerHTML='<h4>SÜRÜ DRON</h4><div class="sr-row"><button type="button" id="sr-up">SÜRÜ KALDIR · 4 DRON (Y)</button><button type="button" data-sr="attack">Hedefe saldır</button><button type="button" data-sr="guard">Tankı koru</button><button type="button" data-sr="home">Geri çağır</button><button type="button" data-sr="auto">Kendi seçsin</button></div><p id="sr-st"></p>';
 cmds.insertAdjacentElement('afterend',box);box.querySelector('#sr-up').onclick=()=>launch();
 for(const b of box.querySelectorAll('[data-sr]'))b.onclick=()=>order(b.dataset.sr);ui.box=box;}
let paintT=0;
function paintUI(){if(!ui){installUI();if(!ui)return;}if(!ui.box)mountBox();const on=!!W&&playing()&&safe(()=>mode==='tank',false);ui.btn.hidden=!on;
 if(on){const k=W.tankCd>0?W.tankCd/MW.tank.cd:0;ui.btn.classList.toggle('cd',k>0);const s=ui.btn.querySelector('s');if(s)s.style.width=Math.round((1-k)*100)+'%';const sm=ui.btn.querySelector('small'),t=k>0?Math.ceil(W.tankCd)+' sn':'SAVAR';if(sm.textContent!==t)sm.textContent=t;}
 const now=performance.now();if(now-paintT<250)return;paintT=now;
 if(ui.box){ui.box.hidden=!W;if(W){const up=W.list.filter(d=>d.side==='own').length,f=W.list.filter(d=>d.side==='foe'&&d.st!=='fall').length,dc=safe(()=>DC,0);
   ui.box.querySelector('#sr-up').disabled=dc<1;for(const b of ui.box.querySelectorAll('[data-sr]'))b.classList.toggle('on',b.dataset.sr===W.mode);
   ui.box.querySelector('#sr-st').textContent='Havada '+up+' dron · yedek '+dc+(f?' · düşman sürüsü '+f+' dron':'')+(W.base.hp>0?' · karargâh %'+Math.round(W.base.hp):' · karargâh vuruldu');}}}

// ---------- bağlantı ----------
function wrap(name,factory){if(hooks[name]||typeof root[name]!=='function')return;root[name]=factory(root[name]);hooks[name]=true;}
function connect(){
 wrap('update',old=>function(dt){const r=old.apply(this,arguments);if(playing()&&!doc.hidden)step(clamp(dt,0,.1));else if(W&&!playing()&&safe(()=>game!=='play',true)&&!live())reset();draw();return r;});
 wrap('mmDraw',old=>function(){const r=old.apply(this,arguments);if(playing())drawMini();return r;});
 (root.MAPX=root.MAPX||[]).includes(drawMap)||root.MAPX.push(drawMap);
 if(!hooked){hooked=true;root.addEventListener('keydown',e=>{if(e.repeat||!playing()||e.target&&/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;const k=(e.key||'').toLowerCase();
   if(k==='e'){fireTank();e.preventDefault();}else if(k==='y'){launch();e.preventDefault();}});}
 installUI();}
function diagnostics(){return {version:VERSION,active:!!W,hooks:{...hooks},mode:W?W.mode:null,tankCd:W?W.tankCd:0,kills:W?W.kills:0,downed:W?W.downed:0,
 base:W&&W.base?{x:W.base.x,z:W.base.z,hp:W.base.hp,cd:W.base.cd,sup:W.base.sup}:null,
 own:W?W.list.filter(d=>d.side==='own').map(d=>({x:d.x,y:d.y,z:d.z,st:d.st})):[],foe:W?W.list.filter(d=>d.side==='foe').map(d=>({x:d.x,y:d.y,z:d.z,st:d.st,tg:d.tg&&d.tg.k,sw:d.sw})):[]};}
// Denetim için: düşman sürüsünü hemen gönderir (hedef 'p' oyuncu, 'b' karargâh).
function spawnFoe(k,n,r){if(!W)return 0;const tg=k==='b'?{k:'b',x:W.base.x,z:W.base.z}:{k:'p'},c=k==='b'?W.base:P,a=rnd()*7,o={x:c.x+Math.sin(a)*(r||300),z:c.z+Math.cos(a)*(r||300)},id=++W.swarms,y=safe(()=>hAt(o.x,o.z),0)+3;
 for(let i=0;i<(n||4);i++)W.list.push({side:'foe',sw:id,x:o.x+(rnd()-.5)*8,y,z:o.z+(rnd()-.5)*8,h:0,vy:0,st:'climb',t:0,a:0,tg});return id;}
root.HisarSwarm=Object.freeze({version:VERSION,core,connect,launch,order,fire:fireTank,spawnFoe,diagnostics});
connect();doc.addEventListener('hisar:ui-ready',connect);
})(typeof window!=='undefined'?window:globalThis);
