/* ÇELİK BÖRÜ destek 1.4 — bir savaş, yalnız tanklarla olmaz.
 * Hava desteği (telsizden istenir, her birinin hazırlanma süresi vardır):
 * - T129 ATAK: kuzeyden gelir, hedef bölgenin çevresinde döner, tanka UMTAS füzesi, zırhlı araca ve piyadeye Cirit roketi atar, sonra döner.
 * - Bayraktar TB2: yüksekten döner, iki MAM-L akıllı mühimmatı en yakın görülen hedefe bırakır.
 * - F-16: hedefe 8 saniyede gelir, alçak geçişle iki bomba bırakır; tank 150 m'den yakınsa "yakın atış" uyarısı.
 * - T-155 Fırtına: önce bir ayar atışı, düzeltmeden sonra altı mermilik tesir atışı.
 * Dost kuvvetler (harekât görevlerinde):
 * - İki piyade timi tankın önünde ilerler; düşman görülünce diz çöküp ateş eder (iz mermili), yakına mermi düşerse siper alır.
 * - Kirpi ve ACV-15 kolda tankın arkasından gelir; üstlerindeki makineli tüfekle ateş eder.
 * - Karakollarda park hâlinde Kirpi'ler ve ikmal kamyonları (tank içlerinden geçemez).
 * - Kol gerçek gibi yürür: sınır şeridini (duvar ve çay) yalnız geçitten aşar, binanın çevresinden dolanır, tanka yol verir; refakat
 *   araçları tankın içinden geçmez, çevresinden dolanır.
 * Çekirdek saf işlevlerdir ve Node ile sınanır.
 */
(function(root){'use strict';
const VERSION='1.4.0';
const doc=root.document;
const safe=(f,d)=>{try{return f();}catch(e){return d;}};
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
// ---------- çekirdek ----------
const SUP=Object.freeze({
 heli:{n:'T129 ATAK',cd:150,stay:30,alt:55,r:220,sp:60,every:5,umtas:240,cirit:90,range:900},
 tb2:{n:'Bayraktar TB2',cd:100,stay:22,alt:320,r:380,sp:45,shots:2,every:6,dmg:240},
 topcu:{n:'T-155 Fırtına',cd:120,ayar:6,tof:9,rounds:6,every:1.1,spread:22,dmg:160,blast:11},
 jet:{n:'F-16',cd:180,eta:8,alt:120,sp:220,dmg:420,blast:26,close:150}});
const INF=Object.freeze({ahead:32,spread:9,range:240,every:[1.6,2.6],dmgInf:34,dmgVeh:3,speed:2.4});
// Hedef seçimi: oyuncuya en yakın görülen düşman (kilitli hedef varsa o)
function pickTarget(list,px,pz,max){let b=null,bd=max||900;for(const e of list){if(!e||e.hp<=0||!e.seen)continue;const d=Math.hypot(e.x-px,e.z-pz);if(d<bd){bd=d;b=e;}}return b;}
// Yörünge noktası (helikopter, İHA)
const orbitPt=(c,r,a)=>({x:c.x+Math.cos(a)*r,z:c.z+Math.sin(a)*r});
// Hazırlık: kalan süre (sn), 0 ise hazır
const ready=(cdEnd,now)=>Math.max(0,Math.ceil(cdEnd-now));
// Piyade hedef noktası: tankın önünde, hedefe doğru, tim içinde yan yana
function squadSlot(px,pz,tx,tz,i,n,ahead,spread){const a=Math.atan2(tx-px,tz-pz),d=Math.min(ahead,Math.hypot(tx-px,tz-pz)),cx=px+Math.sin(a)*d,cz=pz+Math.cos(a)*d,o=(i-(n-1)/2)*spread;return {x:cx+Math.cos(a)*o,z:cz-Math.sin(a)*o,yaw:a};}
// Refakat kolu sınır şeridini (duvar ve çay) yalnız geçitten aşar. BAND: şeridin güney kıyısı (çayın ekseninden, m), geçidin kuzey ağzının duvara
// ve güney ağzının kıyıya uzaklığı, erin kendi şeridinde sayıldığı yarı en, ağıza varmış sayıldığı pay, geçit yolunda olmayan erin ve aracın şeride
// en az uzaklığı, şeritteki bir hedefin aynı geçide ait sayıldığı uzaklık (same) (keep, keepVeh: çay kıvrımlıdır; iki ucu aynı yanda olan düz yol şeridin içinden geçebilir, o zaman duvar ya da kıyı boyunca yürünür)
const BAND=Object.freeze({south:18,north:12,past:4,half:3,near:5,keep:3.5,keepVeh:8,same:40});
// ESC: refakat aracının tanka ve öbür araca en az uzaklığı (m), aracın ve erin bina payı, geçitte erler arası şerit aralığı, park hâlindeki aracın
// engeli (boyu eninden uzun: ekseninde önde ve arkada birer daire; yarıçap ve eksenden uzaklık)
const ESC=Object.freeze({tank:6.5,veh:5.5,body:2.2,man:.7,lane:1.6,parked:2.8,parkOff:{kirpi:1.8,acv:1.4}});
// NEAR: yakın engel listesinin yarıçapı (m), yenilenme aralığı (sn) ve yenilenmeyi tetikleyen yer değiştirme (m). Yürüyen engel (Kirpi 7 m/sn)
// aralık içinde en çok 5 m yol alır; liste yarıçapı bunu ve erin kendi yolunu fazlasıyla karşılar
const NEAR=Object.freeze({r:26,every:.6,move:8});
// Bölge: şeridin kuzeyi 0 (duvarın kuzeyi), şerit 1 (duvar ile çayın güney kıyısı arası), güneyi 2. back: duvarın çayın ekseninden uzaklığı
function zone(riv,back,x,z){const r=riv(x);return z<r-back?0:z>r+BAND.south?2:1;}
// Sıradaki ara hedef: aynı yandaysa doğrudan hedef; değilse en uygun geçidin kendi yanındaki ağzı, oradan şeridin içinden karşı ağız. lane: geçitte
// erin şeridi (m, geçidin ekseninden yana). gate: dönen nokta geçit yolundaysa true
function route(riv,fords,back,ax,az,tx,tz,lane){const sa=zone(riv,back,ax,az),st=zone(riv,back,tx,tz);if(sa===st&&sa!==1)return {x:tx,z:tz,gate:false};
 let g=fords[0];for(const f of fords)if(Math.abs(f-ax)+Math.abs(f-tx)<Math.abs(g-ax)+Math.abs(g-tx))g=f;
 const x=g+(lane||0),r=riv(g),N={x,z:r-back-BAND.north,gate:true},S={x,z:r+BAND.south+BAND.past,gate:true},inC=Math.abs(ax-x)<BAND.half,goal=st===0?N:st===2?S:{x,z:tz,gate:true};
 /* şeridin içindeyse önce içinde bulunduğu (kendisine en yakın) geçitten çıkar: hedefe en uygun geçit başkası olsa da şeridin içinden (suyun
    içinden) o geçide yürümez; kuzeye çıkar, oradan gider */
 if(sa===1){let g0=fords[0];for(const f of fords)if(Math.abs(f-ax)<Math.abs(g0-ax))g0=f;const x0=g0+(lane||0),r0=riv(g0);if(Math.abs(ax-x0)>=BAND.half)return {x:x0,z:az,gate:true};
  return st===2?{x:x0,z:r0+BAND.south+BAND.past,gate:true}:st===1&&Math.abs(tx-g0)<BAND.same?{x:x0,z:tz,gate:true}:{x:x0,z:r0-back-BAND.north,gate:true};}
 if(sa===0)return inC&&az>N.z-BAND.near?goal:N;
 return inC&&az<S.z+BAND.near?goal:S;}
// Geçit yolunda olmayan yürüyüş şeride girmez: z, bulunulan yanda (0 kuzey, 2 güney) şeridin pad kadar dışında tutulur (şeridin içindeyken dokunulmaz)
function keepSide(riv,back,zn,x,z,pad){if(zn===0)return Math.min(z,riv(x)-back-pad);if(zn===2)return Math.max(z,riv(x)+BAND.south+pad);return z;}
// Geçitte erin şeridi: altı er yan yana, iki tim yarım adım kaydırılmış (hepsi geçidin sığ yerinde kalır)
const laneOf=(i,sq)=>(i-2.5)*ESC.lane+(sq?-.4:.4);
// Hedefe giden doğru (x,z → tx,tz) merkezi (ox,oz), yarıçapı r olan bir tankın içinden geçiyorsa tankın yanındaki dolanma noktası; geçmiyorsa null
function around(x,z,tx,tz,ox,oz,r){const dx=tx-x,dz=tz-z,d=Math.hypot(dx,dz);if(d<1e-6)return null;const ux=dx/d,uz=dz/d,ex=ox-x,ez=oz-z,f=ex*ux+ez*uz;if(f<=0||f>=d+r)return null;
 const l=ex*uz-ez*ux;if(Math.abs(l)>=r)return null;const k=l>=0?-1:1;return {x:ox+uz*k*(r+1.5),z:oz-ux*k*(r+1.5),gate:false};}
const core=Object.freeze({VERSION,SUP,INF,BAND,ESC,NEAR,pickTarget,orbitPt,ready,squadSlot,zone,route,keepSide,laneOf,around});
if(typeof module==='object'&&module.exports)module.exports=core;
if(!doc)return;

// ---------- oyun ----------
const hooks={},stat={calls:{heli:0,tb2:0,jet:0,topcu:0},missiles:0,hits:0,kills:0,infShots:0,infDown:0,vehShots:0,parked:0,gaveWay:0,viaGate:0,detours:0,keptOff:0,nearBuilt:0};
let T=null,clock=0,H=null,D=null,J=null,A=null,missiles=[],cdEnd={heli:0,tb2:0,jet:0,topcu:0},ui=null,forces=null;
const playing=()=>safe(()=>game==='play',false);
// destek yalnız görülen (gözetlenen ya da ateş ederek kendini belli eden) hedefe atar
const enemies=()=>safe(()=>E.filter(e=>e.hp>0),[]).map(e=>{e.seen=safe(()=>spotted(e),false);return e;});
function say(t){safe(()=>root.radio(t),null);}
function M(c,o){return new T.MeshLambertMaterial(Object.assign({color:c},o||{}));}
function bx(g,w,h,d,c,x,y,z,mat){const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat||M(c));m.position.set(x,y,z);g.add(m);return m;}
// T129: ince gövde, ikili kokpit, kısa kanatlar, kuyruk, ana ve kuyruk pervanesi
function mkHeli(){const g=new T.Group(),c=0x56604c,mt=M(c);bx(g,1.1,1.3,6.2,c,0,0,0,mt);bx(g,.9,.8,2.6,0x22303a,0,.75,1.6);bx(g,.5,.5,5.6,c,0,.25,-5.4,mt);bx(g,.12,2,1.3,c,0,1.1,-8.1,mt);bx(g,2.4,.1,.7,c,0,.4,-7.9,mt);
 bx(g,4.2,.14,.9,c,0,-.1,-.2,mt);for(const s of[-1,1]){bx(g,.36,.36,1.6,0x2a2e26,s*1.8,-.4,-.2);bx(g,.3,.3,1.2,0xd8d8d0,s*1.3,-.38,-.1);}bx(g,.3,.4,.6,0x1d1f1c,0,-.75,2.7);
 bx(g,.7,.5,1.4,c,0,.95,-.4,mt);const rot=new T.Group();rot.position.set(0,1.35,-.4);for(let i=0;i<4;i++){const b=bx(rot,.32,.04,11.8,0x222,0,0,0);b.rotation.y=i*Math.PI/4;}g.add(rot);
 const tr=new T.Group();tr.position.set(.2,1.2,-8.1);for(let i=0;i<2;i++){const b=bx(tr,.05,2.2,.18,0x222,0,0,0);b.rotation.x=i*Math.PI/2;}g.add(tr);g.userData={rot,tr};g.name='DS_T129';g.visible=false;S.add(g);return g;}
function mkTB2(){const g=new T.Group(),c=0xd9dbd6;bx(g,.6,.6,6.5,c,0,0,0);bx(g,12,.12,.9,c,0,.25,.4);for(const s of[-1,1]){const t=bx(g,.1,1.1,1,c,s*.7,.35,-3.3);t.rotation.z=s*.7;}bx(g,.35,.35,.4,0x333,0,-.35,2.6);g.name='DS_TB2';g.visible=false;S.add(g);return g;}
function mkJet(){const g=new T.Group(),c=0x8a9098;bx(g,1.2,1.3,14.5,c,0,0,0);bx(g,.8,.7,2.6,0x26323d,0,.8,3.6);const w=bx(g,9.6,.16,4.2,c,0,-.1,-1.2);bx(g,.16,3,2.6,c,0,1.8,-6);bx(g,5,.14,1.8,c,0,0,-6.2);
 bx(g,1.1,1.1,.4,0x3a2a1a,0,0,-7.4);g.name='DS_F16';g.visible=false;S.add(g);return g;}
// mühimmat: duman izli küçük füze
function fire(kind,from,tgt,dmg,speed,splash){const m=new T.Mesh(new T.CylinderGeometry(.12,.12,1.6,6),M(0xe8e8e0,{emissive:0x332200}));m.rotation.x=Math.PI/2;S.add(m);
 missiles.push({m,x:from.x,y:from.y,z:from.z,t:tgt,tx:tgt.x,tz:tgt.z,dmg,speed,splash:splash||6,kind,age:0});stat.missiles++;}
function missileStep(dt){const fx=root.FXP;for(let i=missiles.length-1;i>=0;i--){const q=missiles[i];q.age+=dt;if(q.t&&q.t.hp>0){q.tx=q.t.x;q.tz=q.t.z;}const ty=safe(()=>hAt(q.tx,q.tz),0)+1.5;
  const dx=q.tx-q.x,dy=ty-q.y,dz=q.tz-q.z,d=Math.hypot(dx,dy,dz),s=Math.min(d,q.speed*dt);q.x+=dx/d*s;q.y+=dy/d*s;q.z+=dz/d*s;q.m.position.set(q.x,q.y,q.z);q.m.lookAt(q.tx,ty,q.tz);q.m.rotateX(Math.PI/2);
  if(fx&&fx.puff&&Math.random()<.8)fx.puff(q.x,q.y,q.z,0,.4,0,1.4,.3,1.6,0xe0ddd6,0x9a968e,.5,1.2);
  if(d<2||q.age>14){S.remove(q.m);q.m.geometry.dispose();missiles.splice(i,1);impact(q);}}}
function impact(q){safe(()=>root.bigBoom(q.tx,q.tz,q.kind==='bomba'?9:4.5),null);for(const e of enemies()){const d=Math.hypot(e.x-q.tx,e.z-q.tz);if(d<q.splash){const k=d<2.5?1:Math.max(.25,1-d/q.splash);const was=e.hp;safe(()=>root.hurt(e,q.dmg*k),null);stat.hits++;if(was>0&&e.hp<=0)stat.kills++;}}}
// ---------- helikopter ----------
function callHeli(){const now=clock;if(now<cdEnd.heli)return say('Komuta: ATAK hazırlanıyor, '+ready(cdEnd.heli,now)+' sn.');const t=pickTarget(enemies(),P.x,P.z,1400);
 if(!t)return say('Komuta: Görülen hedef yok, ATAK beklemede.');if(!H)H={g:mkHeli()};const g=H.g;Object.assign(H,{on:true,t:0,ph:'gel',c:{x:t.x,z:t.z},a:0,fireT:2,x:P.x+Math.sin(P.h+Math.PI)*600,z:P.z-700,y:hAt(P.x,P.z)+80});
 g.visible=true;cdEnd.heli=now+SUP.heli.cd;stat.calls.heli++;say('ATAK 1: Bölgeye giriyorum, hedefleri görüyorum. Ateş serbest.');}
function heliStep(dt){if(!H||!H.on)return;const s=SUP.heli,g=H.g;H.t+=dt;let tx,tz;
 if(H.ph==='gel'){tx=H.c.x+s.r;tz=H.c.z;if(Math.hypot(tx-H.x,tz-H.z)<40){H.ph='don';H.a=0;H.t=0;}}
 if(H.ph==='don'){H.a+=dt*s.sp/s.r;const o=orbitPt(H.c,s.r,H.a);tx=o.x;tz=o.z;if(H.t>s.stay){H.ph='git';say('ATAK 1: Mühimmat bitti, üsse dönüyorum.');}
  H.fireT-=dt;if(H.fireT<=0){H.fireT=s.every;const t=pickTarget(enemies(),H.x,H.z,s.range);if(t){const tank=t.type==='tank';const from={x:H.x,y:H.y-.6,z:H.z};
   if(tank)fire('umtas',from,t,s.umtas,140,5);else for(let k=0;k<3;k++)fire('cirit',{x:from.x+k*.5,y:from.y,z:from.z},{x:t.x+(Math.random()-.5)*6,z:t.z+(Math.random()-.5)*6,hp:1},s.cirit,190,7);H.c={x:(H.c.x*3+t.x)/4,z:(H.c.z*3+t.z)/4};}}}
 if(H.ph==='git'){tx=H.x;tz=H.z-900;if(H.t>s.stay+25){H.on=false;g.visible=false;return;}}
 const dx=tx-H.x,dz=tz-H.z,d=Math.hypot(dx,dz)||1,sp=H.ph==='don'?s.sp:s.sp*1.4,m=Math.min(d,sp*dt);H.x+=dx/d*m;H.z+=dz/d*m;const gy=safe(()=>hAt(H.x,H.z),0);H.y+=(gy+(H.ph==='gel'?75:s.alt)-H.y)*Math.min(1,dt*.8);
 const yaw=Math.atan2(dx,dz);g.position.set(H.x,H.y,H.z);g.rotation.set(.18,yaw,H.ph==='don'?-.22:0);g.userData.rot.rotation.y+=dt*28;g.userData.tr.rotation.x+=dt*40;}
// ---------- TB2 ----------
function callTB2(){const now=clock;if(now<cdEnd.tb2)return say('Komuta: TB2 hazırlanıyor, '+ready(cdEnd.tb2,now)+' sn.');const t=pickTarget(enemies(),P.x,P.z,1400);if(!t)return say('Komuta: Görülen hedef yok, TB2 beklemede.');
 if(!D)D={g:mkTB2()};Object.assign(D,{on:true,t:0,c:{x:t.x,z:t.z},a:0,shots:SUP.tb2.shots,fireT:4});D.g.visible=true;cdEnd.tb2=now+SUP.tb2.cd;stat.calls.tb2++;say('BAYRAKTAR: Hedef kilitlendi, MAM-L atış için hazırım.');}
function tb2Step(dt){if(!D||!D.on)return;const s=SUP.tb2;D.t+=dt;D.a+=dt*s.sp/s.r;const o=orbitPt(D.c,s.r,D.a),y=safe(()=>hAt(o.x,o.z),0)+s.alt;D.g.position.set(o.x,y,o.z);D.g.rotation.set(0,D.a+Math.PI,-.25);
 D.fireT-=dt;if(D.fireT<=0&&D.shots>0){D.fireT=s.every;const t=pickTarget(enemies(),D.c.x,D.c.z,700);if(t){D.shots--;fire('mam',{x:o.x,y:y-1,z:o.z},t,s.dmg,120,5);if(!D.shots)say('BAYRAKTAR: Mühimmat bitti.');}}
 if(D.t>s.stay){D.on=false;D.g.visible=false;}}
// ---------- F-16 ----------
function callJet(){const now=clock;if(now<cdEnd.jet)return say('Komuta: F-16 hazırlanıyor, '+ready(cdEnd.jet,now)+' sn.');const t=pickTarget(enemies(),P.x,P.z,1400);if(!t)return say('Komuta: Görülen hedef yok, F-16 beklemede.');
 if(!J)J={g:mkJet()};const close=Math.hypot(t.x-P.x,t.z-P.z)<SUP.jet.close;Object.assign(J,{on:true,t:0,tx:t.x,tz:t.z,drop:false,a:Math.atan2(t.x-P.x,t.z-P.z)});cdEnd.jet=now+SUP.jet.cd;stat.calls.jet++;
 say('ŞAHİN 1: Hedefe '+SUP.jet.eta+' saniye.'+(close?' YAKIN ATIŞ, siper alın!':''));}
function jetStep(dt){if(!J||!J.on)return;const s=SUP.jet;J.t+=dt;if(J.t<s.eta-3)return;const k=J.t-(s.eta-3),dist=(k-3)*s.sp,x=J.tx+Math.sin(J.a)*dist,z=J.tz+Math.cos(J.a)*dist,y=safe(()=>hAt(J.tx,J.tz),0)+s.alt;
 J.g.visible=true;J.g.position.set(x,y,z);J.g.rotation.set(0,J.a,0);if(!J.drop&&k>=2.2){J.drop=true;for(let i=0;i<2;i++)fire('bomba',{x:J.tx-Math.sin(J.a)*60,y:y-2,z:J.tz-Math.cos(J.a)*60},{x:J.tx+(i?6:-6),z:J.tz,hp:1},s.dmg,140,s.blast);jetSound();}
 if(k>9){J.on=false;J.g.visible=false;}}
function jetSound(){const A=safe(()=>AC,null);if(!A)return;const out=safe(()=>MG,null)||A.destination,t=A.currentTime,n=Math.floor(A.sampleRate*3),b=A.createBuffer(1,n,A.sampleRate),d=b.getChannelData(0);
 for(let i=0;i<n;i++){const u=i/n;d[i]=(Math.random()*2-1)*Math.sin(Math.PI*u)**2;}const s=A.createBufferSource(),f=A.createBiquadFilter(),g=A.createGain();s.buffer=b;f.type='lowpass';f.frequency.setValueAtTime(600,t);f.frequency.linearRampToValueAtTime(2400,t+1.5);f.frequency.linearRampToValueAtTime(300,t+3);g.gain.value=.9;s.connect(f);f.connect(g);g.connect(out);s.start(t);}
// ---------- topçu: T-155 Fırtına ateş desteği (önce ayar atışı, sonra tesir) ----------
function callTopcu(){const now=clock;if(now<cdEnd.topcu)return say('Komuta: Batarya hazırlanıyor, '+ready(cdEnd.topcu,now)+' sn.');const t=pickTarget(enemies(),P.x,P.z,1400);
 if(!t)return say('Komuta: Görülen hedef yok, topçu beklemede.');A={t:0,x:t.x,z:t.z,ph:'ayar',left:SUP.topcu.rounds,next:SUP.topcu.tof,near:Math.hypot(t.x-P.x,t.z-P.z)<120};cdEnd.topcu=now+SUP.topcu.cd;stat.calls.topcu++;
 say('FIRTINA: Ateş isteği alındı. Ayar atışı yolda, uçuş '+SUP.topcu.tof+' saniye.'+(A.near?' YAKIN ATIŞ!':''));}
function shell(x,z,dmg,blast){safe(()=>root.bigBoom(x,z,blast>10?7:5),null);for(const e of enemies()){const d=Math.hypot(e.x-x,e.z-z);if(d<blast){const was=e.hp;safe(()=>root.hurt(e,dmg*(1-d/blast*.7)),null);stat.hits++;if(was>0&&e.hp<=0)stat.kills++;}}}
function topcuStep(dt){if(!A)return;const s=SUP.topcu;A.t+=dt;if(A.t<A.next)return;
 if(A.ph==='ayar'){const ox=(Math.random()-.5)*60,oz=(Math.random()-.5)*60;shell(A.x+ox,A.z+oz,s.dmg*.6,s.blast);A.ph='tesir';A.next=A.t+s.ayar;say('FIRTINA: Ayar atışı düştü, düzeltildi. Tesir atışı geliyor!');return;}
 shell(A.x+(Math.random()-.5)*s.spread*2,A.z+(Math.random()-.5)*s.spread*2,s.dmg,s.blast);A.left--;A.next=A.t+s.every;if(A.left<=0){A=null;say('FIRTINA: Tesir atışı bitti.');}}
// ---------- dost kuvvetler ----------
const KIND={piyade:1};
// Kirpi'nin gövdesi kullanıcının gönderdiği 3B modeldir (hat.js giydirir); ACV-15 kodla kurulur.
function mkVeh(kind){const g=new T.Group(),c=0x5a6246,mt=M(c);
 if(kind==='kirpi')safe(()=>root.HisarHat.dress(g,'kirpi'),null);
 else{bx(g,2.6,1.4,5.2,c,0,1.15,0,mt);bx(g,2.5,.7,3.6,c,0,2.15,-.4,mt);bx(g,.7,.5,.9,0x2a2c26,.4,2.75,.8);bx(g,.08,.08,1.3,0x1a1a1a,.4,2.8,1.5);for(const s of[-1,1])bx(g,.45,.9,5.4,0x1c1c1a,s*1.32,.55,0);}
 g.name='DS_'+kind.toUpperCase();S.add(g);return g;}
function tracer(a,b){const fx=root.FXP;if(!fx||!fx.puff)return;const dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz)||1;for(let i=0;i<3;i++){const k=Math.random()*.8+.1;fx.puff(a.x+dx*k,a.y+(b.y-a.y)*k,a.z+dz*k,dx/d*200,0,dz/d*200,.08,.15,.2,0xffd27a,0xff9a30,.95,.1);}
 fx.puff(a.x+dx/d*.6,a.y,a.z+dz/d*.6,0,.3,0,.3,.15,.5,0xfff0b0,0xaaaaaa,.7,1);}
function buildForces(){const fig=safe(()=>root.HisarSinir.fig(),null);if(!fig||!T)return null;const crowd=fig.Crowd(14,fig.RIG,(act,t,o)=>poseInf(fig.pose,act,t,o),'DS_PIYADE');
 const ASK={alt:0x4e5636,bot:0x2a2620,ust:0x5d6640,yel:0x46502f,kask:0x4a5233,tufek:0x1d1f1c};const men=[];for(let i=0;i<12;i++){const f=crowd.add('asker',ASK,{x:0,y:-50,z:0,act:'dur'});f.live=false;men.push({f,sq:i<6?0:1,i:i%6,hp:1,cd:Math.random()*2,down:0});}
 const veh=[{kind:'kirpi',g:mkVeh('kirpi'),off:-28},{kind:'acv',g:mkVeh('acv'),off:-44}];veh.forEach(v=>{v.g.visible=false;v.x=0;v.z=0;v.yaw=0;v.cd=1;});
 // karakollarda park hâlindeki araçlar
 for(const p of safe(()=>root.HisarSinir.posts(),[])){const c=Math.cos(p.rot),s=Math.sin(p.rot);[[-9,-3,'kirpi'],[-13,-3,'kirpi'],[12,-4,'acv']].forEach(([lx,lz,k])=>{const g=mkVeh(k),x=p.x+lx*c+lz*s,z=p.z-lx*s+lz*c;g.position.set(x,safe(()=>hAt(x,z),0),z);g.rotation.y=p.rot+Math.PI/2;stat.parked++;/* tank içinden geçemez (düşman siper diye kullanmaz: pos) */safe(()=>{const a=p.rot+Math.PI/2,o=ESC.parkOff[k];for(const e of[1,-1])COV.push({x:x+Math.sin(a)*o*e,z:z+Math.cos(a)*o*e,r:ESC.parked,h:2.3,pos:1,park:e});},null);});}
 /* refakat araçları da yol verilen araçlardır: tankın ardından yerine dönen nöbetçi onların altında kalmaz */
 safe(()=>root.HisarSinir.vehicleSource(()=>forces&&forces.on?forces.veh:null),null);
 return {crowd,men,veh,on:false,way:fig.way||null,run:safe(()=>root.HisarSinir.core.WAY.run,5)};}
// Kolun yolu: sınır şeridi geçitten aşılır; duvar kapı dışında geçilmez
const WBACK=()=>safe(()=>root.HisarSinir.core.WALL.back,26);
const path=(ax,az,tx,tz,lane)=>safe(()=>route(riv,FORDS,WBACK(),ax,az,tx,tz,lane),null)||{x:tx,z:tz,gate:false};
const zoneAt=(x,z)=>safe(()=>zone(riv,WBACK(),x,z),0);
const keepZ=(x0,z0,x1,z1,pad)=>safe(()=>keepSide(riv,WBACK(),zone(riv,WBACK(),x0,z0),x1,z1,pad),z1);
const wallBlocks=(x0,z0,x1,z1)=>safe(()=>root.HisarSinir.core.blocked(riv,FORDS,x0,z0,x1,z1),false);
// Yakındaki engeller: her er ve araç çevresindeki (NEAR.r m) bina ve siperleri kısa bir listede tutar; liste NEAR.every sn'de bir ya da NEAR.move m
// yer değiştirince yenilenir. Bütün engelleri her adımda taramak (iki bin kayıt) telefonda kareyi yavaşlatır.
function nearList(a,x,z,dt){a.nbT=(a.nbT||0)-dt;if(a.nb&&a.nbT>0&&Math.abs(x-a.nbx)<NEAR.move&&Math.abs(z-a.nbz)<NEAR.move)return a.nb;const out=[],R=NEAR.r;
 safe(()=>{for(const c of BLD){if(c.dead)continue;const q=R+c.r,dx=x-c.x;if(dx>q||dx<-q)continue;const dz=z-c.z;if(dz>q||dz<-q)continue;out.push(c);}out.nb=out.length;
  for(const c of COV){const q=R+c.r,dx=x-c.x;if(dx>q||dx<-q)continue;const dz=z-c.z;if(dz>q||dz<-q)continue;out.push(c);}},null);
 a.nb=out;a.nbx=x;a.nbz=z;a.nbT=NEAR.every*(.8+Math.random()*.4);stat.nearBuilt++;return out;}
// Ana oyunun pushOut kuralının aynısı, yalnız yakındaki engellerle: bina dairesi r+m, siper dairesi r*0,85+m (ezilmiş mevzi setinin üstünden geçilir)
function pushNear(o,m,list){const nb=list.nb||0;for(let i=0;i<list.length;i++){const c=list[i],bld=i<nb;if(bld?c.dead:(c.pos&&c.h<.5))continue;const dx=o.x-c.x,dz=o.z-c.z,d=Math.hypot(dx,dz),mm=(bld?c.r:c.r*.85)+m;if(d<mm){o.x=c.x+(d?dx/d:1)*mm;o.z=c.z+(d?dz/d:0)*mm;}}}
// Bir adım (ux,uz yönünde s kadar): bina ya da siper adımı geri iterse itmeye dik yönde, hedefe yakın yana kayar (engelin çevresinden dolanır)
function stepAround(x,z,ux,uz,s,m,list){const o={x:x+ux*s,z:z+uz*s},wx=o.x,wz=o.z;pushNear(o,m,list);const qx=o.x-wx,qz=o.z-wz,q=Math.hypot(qx,qz);
 if(q>s*.3){let px=-qz/q,pz=qx/q;if(px*ux+pz*uz<0){px=-px;pz=-pz;}o.x=x+px*s;o.z=z+pz*s;pushNear(o,m,list);stat.detours++;}return o;}
// Araç (v) bir noktaya r'den çok yaklaşmışsa dışına alınır
function keepOff(v,ox,oz,r){const ex=v.x-ox,ez=v.z-oz,e=Math.hypot(ex,ez);if(e>=r)return false;if(e>.01){v.x=ox+ex/e*r;v.z=oz+ez/e*r;}else{v.x=ox+r;}return true;}
const tanksNow=()=>{const out=[];safe(()=>{out.push(P);},null);for(const a of safe(()=>AL,[]))if(!a.dead)out.push(a);return out;};
// diz çöküp nişan alma duruşu
function poseInf(base,act,t,o){if(act!=='diz'&&act!=='yat')return base(act,t,o);const P={};if(act==='diz'){P.G=[0,0,0];P.GY=-.42;P.LL=[-1.45,0,0];P.LR=[.35,0,0];P.UL=[-1.35,0,-.25];P.FL=[-.5,0,0];P.UR=[-1.2,0,.2];P.FR=[-.4,0,0];P.T=[.08,0,0];}
 else{P.G=[-1.45,0,0];P.GY=-.7;P.UL=[-2.6,0,0];P.UR=[-2.6,0,0];}return P;}
function forcesOn(on){if(!forces)forces=buildForces();if(!forces)return;forces.on=on;for(const m of forces.men){m.f.live=on;m.hp=1;m.down=0;}
 for(const v of forces.veh){v.g.visible=on;const o={x:P.x-Math.sin(P.h)*Math.abs(v.off),z:P.z-Math.cos(P.h)*Math.abs(v.off)};safe(()=>pushOut(o,ESC.body),null);v.x=o.x;v.z=o.z;v.yaw=v.h=P.h;}
 if(on){const zp=zoneAt(P.x,P.z);for(const m of forces.men){let sl=squadSlot(P.x,P.z,P.x+Math.sin(P.h)*100,P.z+Math.cos(P.h)*100,m.i,6,30+m.sq*14,INF.spread);
   /* görev sınır şeridinin dibinde başlıyorsa erler duvarın öbür yanına ya da suya konmaz: tankın arkasına dizilir, oradan geçitten geçerler */
   if(zoneAt(sl.x,sl.z)!==zp||safe(()=>hAt(sl.x,sl.z)<-.5,false))sl=squadSlot(P.x,P.z,P.x-Math.sin(P.h)*100,P.z-Math.cos(P.h)*100,m.i,6,14+m.sq*9,INF.spread);
   const o={x:sl.x,z:sl.z};safe(()=>pushOut(o,ESC.man),null);m.f.x=o.x;m.f.z=o.z;m.f.yaw=P.h;}}}
function objective(){const op=safe(()=>root.MAPVIEW_HK&&root.MAPVIEW_HK(),null);return op?op.obj:null;}
function forcesStep(dt){if(!forces||!forces.on)return;const obj=objective()||{x:P.x+Math.sin(P.h)*200,z:P.z+Math.cos(P.h)*200},en=enemies().filter(e=>e.seen);
 for(const m of forces.men){const f=m.f;
  /* tanka yol ver: üstüne tank gelen piyade (çömelmiş ateş ediyor ya da siper almış yatıyor olsa da) kalkıp yana koşar; vurulmuş er kalır */
  const w=m.hp>0&&f.live&&forces.way?forces.way(f.x,f.z):null;if(w){m.down=0;const st=Math.min(Math.max(w.need,w.push||0),forces.run*dt);f.x+=w.x*st;f.z+=w.z*st;f.yaw=Math.atan2(w.x,w.z);f.act='nobet-yuru';f.t+=dt*8;f.y=safe(()=>hAt(f.x,f.z),0);stat.gaveWay++;continue;}
  if(m.down>0){m.down-=dt;f.act='yat';if(m.down<=0&&m.hp<=0){f.live=false;}f.y=safe(()=>hAt(f.x,f.z),0);continue;}if(m.hp<=0)continue;
  let tgt=null,td=INF.range;for(const e of en){const d=Math.hypot(e.x-f.x,e.z-f.z);if(d<td){td=d;tgt=e;}}
  if(tgt){f.act='diz';f.t+=dt;let a=Math.atan2(tgt.x-f.x,tgt.z-f.z)-f.yaw;while(a>Math.PI)a-=6.283;while(a<-Math.PI)a+=6.283;f.yaw+=a*Math.min(1,dt*4);m.cd-=dt;
   if(m.cd<=0){m.cd=INF.every[0]+Math.random()*(INF.every[1]-INF.every[0]);const gy=safe(()=>hAt(f.x,f.z),0);tracer({x:f.x,y:gy+1.1,z:f.z},{x:tgt.x,y:safe(()=>hAt(tgt.x,tgt.z),0)+1.2,z:tgt.z});stat.infShots++;
    small(tgt,tgt.type==='inf'?INF.dmgInf:INF.dmgVeh);}}
  else{const sl=squadSlot(P.x,P.z,obj.x,obj.z,m.i,6,INF.ahead+m.sq*16,INF.spread),wp=path(f.x,f.z,sl.x,sl.z,laneOf(m.i,m.sq)),dx=wp.x-f.x,dz=wp.z-f.z,d=Math.hypot(dx,dz);if(wp.gate)stat.viaGate++;
   if(d>(wp.gate?.4:1.5)){const s=Math.min(d,(Math.hypot(sl.x-f.x,sl.z-f.z)>25?INF.speed*1.8:INF.speed)*dt),o=stepAround(f.x,f.z,dx/d,dz/d,s,ESC.man,nearList(m,f.x,f.z,dt));if(!wp.gate)o.z=keepZ(f.x,f.z,o.x,o.z,BAND.keep);const mv=Math.hypot(o.x-f.x,o.z-f.z);
    /* tankın önüne, duvarın içine adım atmaz; binanın çevresinden dolanır */
    if(mv<s*.15||wallBlocks(f.x,f.z,o.x,o.z)||(root.HisarMobility&&!root.HisarMobility.allows({x:f.x,z:f.z},o,true))||(forces.way&&forces.way(o.x,o.z)))f.act='nobet';else{f.yaw=Math.atan2(o.x-f.x,o.z-f.z);f.x=o.x;f.z=o.z;f.act='nobet-yuru';f.t+=dt*5.2;}}
   else{f.act='nobet';f.yaw=sl.yaw;}}
  f.y=safe(()=>hAt(f.x,f.z),0);}
 const tk=tanksNow();
 for(const v of forces.veh){const a=P.h,tx=P.x-Math.sin(a)*Math.abs(v.off),tz=P.z-Math.cos(a)*Math.abs(v.off),dT=Math.hypot(tx-v.x,tz-v.z);let wp=path(v.x,v.z,tx,tz,0);if(wp.gate)stat.viaGate++;
  /* hedefe giden yol bir tankın ya da öndeki refakat aracının içinden geçiyorsa çevresinden dolanır (öndeki araç yol hakkına sahiptir) */
  const lead=forces.veh.slice(0,forces.veh.indexOf(v));
  for(const o of tk){const w=around(v.x,v.z,wp.x,wp.z,o.x,o.z,ESC.tank);if(w){wp=w;break;}}
  for(const o of lead){const w=around(v.x,v.z,wp.x,wp.z,o.x,o.z,ESC.veh);if(w){wp=w;break;}}
  const dx=wp.x-v.x,dz=wp.z-v.z,d=Math.hypot(dx,dz);
  if(dT>2&&d>.3){const s=Math.min(d,(dT>30?16:Math.min(11,dT))*dt),o=stepAround(v.x,v.z,dx/d,dz/d,s,ESC.body,nearList(v,v.x,v.z,dt));if(!wp.gate)o.z=keepZ(v.x,v.z,o.x,o.z,BAND.keepVeh);const mx=o.x-v.x,mz=o.z-v.z;
   if(!wallBlocks(v.x,v.z,o.x,o.z)&&(!root.HisarMobility||root.HisarMobility.allows(v,{...o,h:v.yaw},false))){v.x=o.x;v.z=o.z;if(Math.hypot(mx,mz)>s*.1){let t2=Math.atan2(mx,mz)-v.yaw;while(t2>Math.PI)t2-=6.283;while(t2<-Math.PI)t2+=6.283;v.yaw+=t2*Math.min(1,dt*2.5);}}}
  /* tankın ve öbür aracın içine girmez (tank üstüne gelirse kenara çekilir) */
  {const x0=v.x,z0=v.z;let k=false;/* önce öndeki araç, sonra dost tanklar, en son oyuncunun tankı: araç tankların arasında sıkışsa da oyuncunun tankının içinde kalmaz */
   for(let it=0;it<3;it++){for(const o of lead)k=keepOff(v,o.x,o.z,ESC.veh)||k;for(let i=tk.length-1;i>=0;i--)k=keepOff(v,tk[i].x,tk[i].z,ESC.tank)||k;}if(k){stat.keptOff++;if(wallBlocks(x0,z0,v.x,v.z)){v.x=x0;v.z=z0;}}}
  const y=safe(()=>hAt(v.x,v.z),0);v.g.position.set(v.x,y,v.z);v.g.rotation.y=v.yaw;v.h=v.yaw;v.cd-=dt;
  if(v.cd<=0){v.cd=.9;let tg=null,td=260;for(const e of en){const d2=Math.hypot(e.x-v.x,e.z-v.z);if(d2<td){td=d2;tg=e;}}if(tg){tracer({x:v.x,y:y+3.4,z:v.z},{x:tg.x,y:safe(()=>hAt(tg.x,tg.z),0)+1.2,z:tg.z});stat.vehShots++;small(tg,tg.type==='inf'?40:2.5);}}}}
// hafif silah: ekrana isabet yazısı basmadan can düşürür
function small(e,d){if(e.hp==null)return;e.hp-=d;if(e.hp<=0)safe(()=>root.killE(e),null);}
function boomNear(x,z){if(!forces||!forces.on)return;for(const m of forces.men){if(m.hp<=0)continue;const d=Math.hypot(m.f.x-x,m.f.z-z);if(d<5){m.hp=0;m.down=6;stat.infDown++;}else if(d<14)m.f.act='yat';}}
// ---------- telsiz paneli ----------
function mountUI(){if(ui)return;const panel=doc.getElementById('hr-panel'),cmds=panel&&panel.querySelector('.hr-orders');if(!cmds)return;
 const st=doc.createElement('style');st.textContent=`#ds-box{margin:12px 0 0;padding:10px 0 0;border-top:1px solid var(--cizgi,#4a4f43)}#ds-box h4{margin:0 0 8px;font:800 14px/1 var(--sf,system-ui);letter-spacing:.08em;color:#fff}
#ds-box .ds-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}#ds-box button{display:flex;flex-direction:column;align-items:flex-start;gap:3px;text-align:left;min-height:52px}#ds-box button b{font:800 14px/1.1 var(--sf,system-ui)}#ds-box button small{font:600 11.5px/1 var(--sf,system-ui);color:#b9bdb2}
#ds-box button.cd{opacity:.55}`;doc.head.appendChild(st);
 const box=doc.createElement('div');box.id='ds-box';box.innerHTML='<h4>HAVA DESTEĞİ</h4><div class="ds-row"><button type="button" data-ds="heli"><b>T129 ATAK</b><small>Helikopter</small></button><button type="button" data-ds="tb2"><b>TB2</b><small>Akıllı mühimmat</small></button><button type="button" data-ds="jet"><b>F-16</b><small>Bomba</small></button><button type="button" data-ds="topcu"><b>FIRTINA</b><small>Topçu</small></button></div>';
 cmds.parentNode.insertBefore(box,cmds.nextSibling);box.onclick=e=>{const b=e.target.closest('[data-ds]');if(!b)return;call(b.dataset.ds);};ui={box};}
function paintUI(){if(!ui)mountUI();if(!ui)return;for(const b of ui.box.querySelectorAll('[data-ds]')){const k=b.dataset.ds,r=ready(cdEnd[k],clock);b.classList.toggle('cd',r>0);b.querySelector('small').textContent=r>0?r+' sn':{heli:'Helikopter',tb2:'Akıllı mühimmat',jet:'Bomba',topcu:'Topçu'}[k];}}
function call(k){if(!playing())return;T=T||root.THREE;if(k==='heli')callHeli();if(k==='tb2')callTB2();if(k==='jet')callJet();if(k==='topcu')callTopcu();paintUI();}
function reset(){cdEnd={heli:0,tb2:0,jet:0,topcu:0};A=null;clock=0;for(const q of missiles){S.remove(q.m);}missiles=[];if(H){H.on=false;H.g.visible=false;}if(D){D.on=false;D.g.visible=false;}if(J){J.on=false;J.g.visible=false;}
 forcesOn(safe(()=>mis==='harekat',false));}
function wrap(name,factory){if(hooks[name]||typeof root[name]!=='function')return;root[name]=factory(root[name]);hooks[name]=true;}
function connect(){T=root.THREE||null;mountUI();
 wrap('update',old=>function(dt){const r=old.apply(this,arguments);if(playing()){const d=clamp(+dt||0,0,.1);clock+=d;safe(()=>{heliStep(d);tb2Step(d);jetStep(d);topcuStep(d);missileStep(d);forcesStep(d);},null);if((stat.pt=(stat.pt||0)+d)>.5){stat.pt=0;paintUI();}}return r;});
 wrap('startMission',old=>function(){const r=old.apply(this,arguments);safe(reset,null);return r;});
 wrap('sndBoom',old=>function(x,z){safe(()=>boomNear(x,z),null);return old.apply(this,arguments);});
 if(!hooks.frame&&typeof FRAME_HOOKS!=='undefined'){hooks.frame=true;FRAME_HOOKS.push(()=>safe(()=>{if(forces&&forces.on){const c=CAM.position;forces.crowd.frame(c.x,c.z,320);}},null));}}
function diagnostics(){return {version:VERSION,hooks:{...hooks},...stat,calls:{...stat.calls},ready:{heli:ready(cdEnd.heli,clock),tb2:ready(cdEnd.tb2,clock),jet:ready(cdEnd.jet,clock),topcu:ready(cdEnd.topcu,clock)},topcu:A?{ph:A.ph,left:A.left}:null,
 heli:H&&H.on?{ph:H.ph,x:Math.round(H.x),z:Math.round(H.z),y:Math.round(H.y)}:null,tb2:!!(D&&D.on),jet:!!(J&&J.on),missilesLive:missiles.length,
 forces:forces?{on:forces.on,men:forces.men.filter(m=>m.hp>0&&m.f.live).length,acts:forces.men.map(m=>m.f.act).join(','),at:forces.men.filter(m=>m.hp>0&&m.f.live).map(m=>({x:m.f.x,z:m.f.z})),veh:forces.veh.map(v=>({x:Math.round(v.x),z:Math.round(v.z)})),vehAt:forces.veh.map(v=>({x:v.x,z:v.z,yaw:v.yaw}))}:null};}
root.HisarDestek=Object.freeze({version:VERSION,core,connect,call,diagnostics});
connect();doc.addEventListener('hisar:ui-ready',connect);
})(typeof window!=='undefined'?window:globalThis);
