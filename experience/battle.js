/* ÇELİK BÖRÜ savaş 1.0 — "Son Takım": büyük haritada takımlar, aşama aşama daralan güvenli alan, son kalan takım kazanır.
 * Rakip takımlar yapay zekâdır. Oyuncunun yakınındaki takımlar gerçek tank olarak sahaya çıkar: önce çembere doğru yürür,
 * oyuncunun takımını fark edince saldırır, başka bir takımla karşılaşınca onunla çatışır. Uzaktaki takımlar yalnız hesapla
 * yürür ve çatışır. Çekirdek saf işlevlerdir ve Node ile sınanır.
 */
(function(root){
'use strict';
const VERSION='1.0.0',SAVE='celik-boru-savas-v1';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:a)),lerp=(a,b,t)=>a+(b-a)*t;
const safe=(fn,d)=>{try{return fn();}catch{return d;}};

// ---------- güvenli alan ----------
// wait: daralma öncesi bekleme (sn), shrink: daralma süresi (sn), k: yeni yarıçapın eskiye oranı, dps: alan dışında saniyede can yüzdesi
const PHASES=Object.freeze([
 {wait:110,shrink:80,k:.55,dps:1.5},{wait:85,shrink:65,k:.58,dps:2.5},{wait:65,shrink:50,k:.56,dps:4},
 {wait:50,shrink:40,k:.52,dps:6},{wait:35,shrink:30,k:.42,dps:9},{wait:20,shrink:25,k:0,dps:14}].map(Object.freeze));
const TOTAL_TIME=PHASES.reduce((s,p)=>s+p.wait+p.shrink,0);
// Yeni çember eskisinin içinde kalır; merkezi haritanın dışına taşmaz.
function nextCircle(c,k,ws,rnd){
 const nr=c.r*k,room=Math.max(0,c.r-nr),bound=Math.max(0,ws-Math.min(nr,ws)*.75);
 for(let i=0;i<24;i++){const a=rnd()*Math.PI*2,d=Math.sqrt(rnd())*room*.9,x=c.x+Math.cos(a)*d,z=c.z+Math.sin(a)*d;if(Math.abs(x)<=bound&&Math.abs(z)<=bound)return {x,z,r:nr};}
 const x=clamp(c.x,-bound,bound),z=clamp(c.z,-bound,bound),d=Math.hypot(x-c.x,z-c.z);
 return d<=room?{x,z,r:nr}:{x:c.x,z:c.z,r:nr};
}
function zoneInit(ws,rnd){const r=Math.hypot(ws,ws)+20,n=nextCircle({x:0,z:0,r},PHASES[0].k,ws,rnd);
 return {i:0,state:'wait',t:0,cx:0,cz:0,r,fx:0,fz:0,fr:r,nx:n.x,nz:n.z,nr:n.r};}
function zoneStep(z,dt,ws,rnd){
 if(z.state==='closed'||!(dt>0))return z;z.t+=dt;
 for(let guard=0;guard<20&&z.state!=='closed';guard++){const ph=PHASES[z.i];
  if(z.state==='wait'){if(z.t<ph.wait)break;z.t-=ph.wait;z.state='shrink';z.fx=z.cx;z.fz=z.cz;z.fr=z.r;}
  const f=clamp(z.t/ph.shrink,0,1);z.cx=lerp(z.fx,z.nx,f);z.cz=lerp(z.fz,z.nz,f);z.r=lerp(z.fr,z.nr,f);
  if(f<1)break;z.t-=ph.shrink;z.i++;
  if(z.i>=PHASES.length){z.state='closed';z.r=0;z.i=PHASES.length-1;z.t=0;break;}
  z.state='wait';const n=nextCircle({x:z.cx,z:z.cz,r:z.r},PHASES[z.i].k,ws,rnd);z.nx=n.x;z.nz=n.z;z.nr=n.r;
 }
 return z;
}
const outsideBy=(z,x,y)=>Math.hypot(x-z.cx,y-z.cz)-z.r;
function zoneInfo(z){const ph=PHASES[z.i];if(z.state==='closed')return {phase:PHASES.length,total:PHASES.length,state:'closed',left:0,span:1,dps:ph.dps};
 const span=z.state==='wait'?ph.wait:ph.shrink;return {phase:z.i+1,total:PHASES.length,state:z.state,left:Math.max(0,span-z.t),span,dps:ph.dps};}
// Alanın dışında kalanın saniyelik can kaybı (yüzde): içeri girdikçe sıfır, dışarı uzaklaştıkça en çok iki katı.
function zoneDamage(z,dist,dt){if(!(dist>0)||!(dt>0))return 0;return PHASES[z.i].dps*(1+Math.min(1,dist/120))*dt;}

// ---------- takımlar ----------
// form: oyuncunun yanındaki dost tank sayısı (0 tek tank, 1 kısım, 3 takım)
function plan(form){const size=form>=3?4:form>=1?2:1,squads=size===4?4:size===2?7:14;return {size,squads,tanks:size*squads,teams:squads+1};}
function placeSquads(count,ws,ok,rnd,player,minPlayer=380,minSquad=230){
 const out=[];for(let pass=0;pass<3&&out.length<count;pass++){const mp=minPlayer*(1-pass*.2),ms=minSquad*(1-pass*.25);
  for(let i=0;i<2500&&out.length<count;i++){const x=(rnd()*2-1)*(ws-60),z=(rnd()*2-1)*(ws-60);
   if(!ok(x,z)||Math.hypot(x-player.x,z-player.z)<mp||out.some(q=>Math.hypot(q.x-x,q.z-z)<ms))continue;out.push({x,z});}}
 return out;
}
const SQUAD_NAMES=Object.freeze(['PARS','KARTAL','ŞAHİN','BOZAYI','YILDIRIM','POYRAZ','KASIRGA','TİPİ','AKREP','ÇAKAL','SIRTLAN','ENGEREK','DOĞAN','ATMACA']);
function makeSquads(points,size){return points.map((p,i)=>({id:i,name:SQUAD_NAMES[i%SQUAD_NAMES.length],x:p.x,z:p.z,active:false,dead:false,wx:p.x,wz:p.z,wt:0,wn:false,tanks:Array.from({length:size},()=>({hp:1,e:null}))}));}
const aliveTanks=s=>s.dead?0:s.tanks.reduce((n,t)=>n+(t.hp>0?1:0),0);
const tanksLeft=list=>list.reduce((n,s)=>n+aliveTanks(s),0);
const teamsLeft=list=>list.reduce((n,s)=>n+(aliveTanks(s)>0?1:0),0);
// Takımın gideceği nokta: bir sonraki çemberin dışındaysa içinde bir yer, içindeyse yakınında başka bir yer.
// Dönen: çembere yürümesi gerekiyor mu?
function squadGoal(s,z,dt,rnd,ws=1e9){
 const need=Math.hypot(s.x-z.nx,s.z-z.nz)>Math.max(20,z.nr*.8);s.wt-=dt;
 if(s.wt<=0||need!==s.wn){const a=rnd()*Math.PI*2,d=Math.sqrt(rnd())*(need?Math.max(10,z.nr*.6):110);
  s.wx=clamp((need?z.nx:s.x)+Math.cos(a)*d,-ws,ws);s.wz=clamp((need?z.nz:s.z)+Math.sin(a)*d,-ws,ws);s.wt=need?30:45+rnd()*40;}
 s.wn=need;return need;
}
// Sahada olmayan takım hedef noktasına yürür; sahadaki takımı oyun motoru sürer.
function driftSquad(s,z,dt,rnd,speed=6,ws=1e9){
 if(s.dead||s.active)return;const need=squadGoal(s,z,dt,rnd,ws);
 const dx=s.wx-s.x,dz=s.wz-s.z,l=Math.hypot(dx,dz);if(l>4){const v=Math.min(l,speed*dt*(need?1:.35));s.x+=dx/l*v;s.z+=dz/l*v;}
}
// İki düşman takım karşılaşınca: her tank karşı taraftan rastgele birine hasar verir. Dönen: bu adımda imha edilen tank sayısı.
function clashStep(a,b,dt,rnd,rate=.012){let kills=0;
 for(const [att,def] of [[a,b],[b,a]]){const n=aliveTanks(att);if(!n)continue;const alive=def.tanks.filter(t=>t.hp>0);if(!alive.length)continue;
  const t=alive[Math.floor(rnd()*alive.length)%alive.length],before=t.hp;t.hp=Math.max(0,t.hp-rate*n*dt*(.4+rnd()*1.2));if(before>0&&t.hp<=0)kills++;}
 for(const s of [a,b])if(!s.dead&&aliveTanks(s)===0)s.dead=true;
 return kills;
}
// Sıralama: oyuncu elendiğinde hayatta kalan düşman takım sayısı + 1; kazanınca 1.
const placement=(teamsAlive,won)=>won?1:teamsAlive+1;
function reward(r){const teams=Math.max(1,r.teams|0),place=clamp(r.place|0,1,teams),beaten=teams-place;
 return {kr:(place===1?300:0)+beaten*35+Math.round((r.kills|0)*10),xp:(place===1?400:0)+beaten*40};}
const clock=s=>{s=Math.max(0,Math.ceil(s));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');};

const core=Object.freeze({VERSION,PHASES,TOTAL_TIME,nextCircle,zoneInit,zoneStep,zoneInfo,zoneDamage,outsideBy,plan,placeSquads,makeSquads,aliveTanks,tanksLeft,teamsLeft,squadGoal,driftSquad,clashStep,placement,reward,clock,SQUAD_NAMES});
if(typeof module==='object'&&module.exports)module.exports=core;
const doc=root.document;if(!doc||root.HisarBattle)return;

// ================= oyun içi =================
const MODE='savas',ACTIVATE=400,SLEEP=560,ALERT=250,FOE=210,CLASH=110;
// Savaş dengesi: uzak menzil, ağır vuruş, yavaş dolum. sp düşman hızı (m/sn), cd düşman dolumu (sn), dmg isabet başına hasar,
// hp düşman tankının dayanıklılık katsayısı. Oyuncunun dolumu RELOAD, dost tankların görüş menzili ALLY_RANGE ile uzar.
const TUNE=Object.freeze({kolay:{sp:5.5,cd:5.6,dmg:12,hp:1.8},normal:{sp:6.5,cd:4.2,dmg:22,hp:2.2},zor:{sp:7.5,cd:3.2,dmg:30,hp:2.6},serbest:{sp:5.5,cd:0,dmg:0,hp:1.8}});
const RELOAD=3,ALLY_RANGE=190,FIRE_RANGE=230,SHELL_SPEED=80,SHELL_LIFE=3.2;
const hooks={},stats=safe(()=>JSON.parse(root.localStorage.getItem(SAVE)||'{}'),{})||{};
let B=null,card=null,feedBox=null,wall=null,finishing=false,cardBottom=0;
const rnd=()=>Math.random();
const playing=()=>safe(()=>game==='play'&&mis===MODE,false);
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
function wrap(name,factory){if(hooks[name]||typeof root[name]!=='function')return;root[name]=factory(root[name]);hooks[name]=true;}
function write(){safe(()=>root.localStorage.setItem(SAVE,JSON.stringify(stats)),null);}
// Araç koyulabilir yer: kuru, eğimi az, bina ve büyük kayaya değmiyor.
function okSpot(x,z){return safe(()=>{const h=hAt(x,z);if(h<-.4||Math.abs(z-riv(x))<34)return false;
 if(Math.abs(hAt(x+6,z)-h)>1.6||Math.abs(hAt(x,z+6)-h)>1.6)return false;
 for(const b of BLD)if(!b.dead&&Math.hypot(b.x-x,b.z-z)<b.r+14)return false;
 for(const c of COV)if(Math.hypot(c.x-x,c.z-z)<c.r+7)return false;return true;},false);}
function nearName(x,z){return safe(()=>{let b=null,bd=1e9;for(const p of POI0){const d=Math.hypot(p.x-x,p.z-z);if(d<bd){bd=d;b=p;}}return b?b.n:'';},'');}
function feed(text,kind){if(!feedBox)return;const p=doc.createElement('p');p.textContent=text;if(kind)p.dataset.k=kind;feedBox.appendChild(p);while(feedBox.children.length>3)feedBox.firstChild.remove();
 // şerit telsiz düğmesinin hemen altında durur (düğmenin yeri ekran yönüne göre değişir)
 safe(()=>{let y=0;for(const id of ['hr-radio-entry','mm']){const e=doc.getElementById(id),r=e&&e.getBoundingClientRect();if(r&&r.width&&r.right>root.innerWidth-260)y=Math.max(y,r.bottom);}feedBox.style.top=y?Math.round(y+8)+'px':'';},null);
 root.setTimeout(()=>{p.classList.add('out');root.setTimeout(()=>p.remove(),600);},5200);}
function enemiesLeft(){return B?tanksLeft(B.squads):0;}
const dmgOn=()=>safe(()=>L.dmg>0,true);
const inField=e=>safe(()=>E.includes(e),false);
// Diziliş: takımın yönüne göre tankların yan ve geri aralığı
function slot(i,h){const side=(i%2?1:-1)*Math.ceil(i/2)*14,back=Math.floor(i/2)*6;return {x:Math.cos(h)*side-Math.sin(h)*back,z:-Math.sin(h)*side-Math.cos(h)*back};}

function begin(){
 cleanup();const ws=WS,pl=plan(safe(()=>SV.form|0,0)),key=safe(()=>lvKey,'normal'),tune=TUNE[key]||TUNE.normal;
 safe(()=>{L=Object.assign({},LV[key]||LV.normal,{sp:tune.sp,cd:tune.cd,dmg:tune.dmg,rl:RELOAD,ar:ALLY_RANGE});},null);
 // başlangıç: haritanın rastgele bir yerinde, merkeze dönük
 let sp={x:0,z:0};for(let i=0;i<400;i++){const x=(rnd()*2-1)*(ws-90),z=(rnd()*2-1)*(ws-90);if(Math.hypot(x,z)>260&&okSpot(x,z)){sp={x,z};break;}}
 const h=Math.atan2(-sp.x,-sp.z);P.x=sp.x;P.z=sp.z;P.h=h;P.th=h;safe(()=>{yaw=h;},null);
 safe(()=>{AL.forEach((a,i)=>{const side=i===0?1:i===1?-1:0,back=i===2?16:9,x=sp.x+Math.cos(h)*side*13-Math.sin(h)*back,z=sp.z-Math.sin(h)*side*13-Math.cos(h)*back;a.x=x;a.z=z;a.h=h;a.g.position.set(x,hAt(x,z),z);a.g.rotation.y=h;a.cmd='follow';a.fire=1;});},null);
 const zone=zoneInit(ws,rnd),pts=placeSquads(pl.squads,ws,okSpot,rnd,sp,ACTIVATE+40),squads=makeSquads(pts,pl.size);
 B={plan:pl,tune,zone,squads,teams:squads.length+1,start:sp,time:0,kills:0,over:false,lastPhase:0,lastState:'wait',hits:[],tick:0,slow:0,paint:0,warn:0,drive:0};
 doc.body.classList.add('hr-mission-active');if(card)card.hidden=false;buildWall();
 const near=nearName(sp.x,sp.z);feed('Başlangıç: '+(near||'açık arazi')+' · '+B.teams+' takım sahada');
 safe(()=>root.radio('Komuta: '+B.teams+' takım sahada. Güvenli alan daralacak; son kalan takım kazanır.'),null);
 safe(()=>root.groundCull(true),null);
}
function cleanup(){if(wall){safe(()=>S.remove(wall),null);safe(()=>{wall.geometry.dispose();wall.material.map&&wall.material.map.dispose();wall.material.dispose();},null);wall=null;}
 if(B)for(const s of B.squads)for(const t of s.tanks)if(t.pool){safe(()=>S.remove(t.pool.g),null);t.pool=null;}
 B=null;doc.body.classList.remove('hr-mission-active');if(card)card.hidden=true;if(feedBox)feedBox.replaceChildren();}
function buildWall(){if(!root.THREE||typeof S==='undefined')return;
 const c=doc.createElement('canvas');c.width=64;c.height=256;const g=c.getContext('2d'),gr=g.createLinearGradient(0,0,0,256);
 gr.addColorStop(0,'rgba(120,190,255,0)');gr.addColorStop(.55,'rgba(120,190,255,.34)');gr.addColorStop(1,'rgba(150,210,255,.8)');g.fillStyle=gr;g.fillRect(0,0,64,256);
 g.fillStyle='rgba(255,255,255,.22)';for(let y=16;y<256;y+=32)g.fillRect(0,y,64,2);g.fillRect(0,0,2,256);
 const tex=new THREE.CanvasTexture(c);tex.wrapS=THREE.RepeatWrapping;tex.repeat.set(160,1);
 wall=new THREE.Mesh(new THREE.CylinderGeometry(1,1,1,160,1,true),new THREE.MeshBasicMaterial({map:tex,transparent:true,opacity:.75,side:THREE.DoubleSide,depthWrite:false,fog:false}));
 wall.frustumCulled=false;wall.renderOrder=4;wall.name='BT_ALAN';S.add(wall);placeWall();}
function placeWall(){if(!wall||!B)return;const z=B.zone,r=Math.max(.5,z.r);wall.visible=z.state!=='closed';wall.scale.set(r,150,r);wall.position.set(z.cx,safe(()=>hAt(clamp(z.cx,-WS,WS),clamp(z.cz,-WS,WS)),0)+60,z.cz);
 wall.material.map.repeat.x=Math.max(8,Math.round(r*2*Math.PI/14));}

// ---------- takımların sahaya çıkması ve sahadan çekilmesi ----------
function wake(s){const z=B.zone;s.active=true;s.alert=0;s.far=0;s.near=1e9;s.h=Math.atan2(z.nx-s.x,z.nz-s.z)||0;for(const t of s.tanks)if(t.hp>0)t.q=true;}
// Karede en çok bir tank kurulur; dört tank aynı anda kurulunca görüntü takılmasın.
function spawnOne(){for(const s of B.squads){if(!s.active||s.dead)continue;const i=s.tanks.findIndex(t=>t.q);if(i<0)continue;
  const t=s.tanks[i],o=slot(i,s.h),x=clamp(s.x+o.x,-WS+25,WS-25),z=clamp(s.z+o.z,-WS+25,WS-25);let e=t.pool;t.q=false;
  if(e){t.pool=null;e.x=x;e.z=z;e.h=s.h;e.g.visible=true;safe(()=>{e.g.position.set(x,hAt(x,z),z);e.g.rotation.y=s.h;E.push(e);},null);}
  else{e=safe(()=>root.addE('tank',x,z,{h:s.h}),null);if(!e){t.hp=0;return;}
   e.bt=s.id;e.mx=safe(()=>HPT.tank,100)*B.tune.hp;e.pr=110+rnd()*60;e.fr=FIRE_RANGE;e.bs=SHELL_SPEED;e.bl=SHELL_LIFE;}
  e.hp=e.mx*t.hp;e.sn=e.hp;e.cd=1.5+rnd()*3;e.fc=1+rnd()*3;e.foe=null;e.conv=0;e.park=1;t.near=1e9;t.e=e;return;}}
function sleep(s){for(const t of s.tanks){const e=t.e;t.q=false;if(!e)continue;
  if(inField(e)){t.hp=clamp(e.hp/e.mx,.01,1);e.g.visible=false;e.foe=null;safe(()=>{E=E.filter(o=>o!==e);},null);t.pool=e;}t.e=null;}
 s.active=false;s.alert=0;s.far=0;s.wt=0;}
function quietKill(e){e.nc=1;safe(()=>root.killE(e),null);}
function squadDown(s,mine){s.dead=true;if(s.told||!B)return;s.told=true;feed(s.name+' takımı elendi · kalan '+(teamsLeft(B.squads)+1)+' takım',mine?'iyi':'');}
// Sahadaki takımın sayımı: imha edilen tanklar düşülür, takımın yeri tankların ortasıdır.
function syncActive(s){let n=0,sx=0,sz=0,queued=0,mine=false;
 for(const t of s.tanks){if(t.hp<=0)continue;if(t.q){queued++;continue;}const e=t.e;
  if(!e||!inField(e)){t.hp=0;t.e=null;if(e&&!e.nc){B.kills++;mine=true;const left=aliveTanks(s);if(left>0)feed('İmha · '+s.name+' takımında '+left+' tank kaldı','iyi');}continue;}
  t.hp=clamp(e.hp/e.mx,.01,1);sx+=e.x;sz+=e.z;n++;}
 if(n){s.x=sx/n;s.z=sz/n;}else if(!queued)squadDown(s,mine);}

// ---------- sahadaki takımın davranışı ----------
function nearestFoe(e,s){let best=null,bd=FOE;for(const o of B.squads){if(o===s||!o.active||o.dead)continue;for(const t of o.tanks){const f=t.e;if(!f||t.hp<=0||t.q)continue;const d=dist(f,e);if(d<bd){bd=d;best=f;}}}return best?{e:best,d:bd}:null;}
// Fark edene kadar çembere doğru yürür; oyuncunun takımını fark edince motorun saldırı zekâsı devralır;
// başka bir takım daha yakınsa onunla çatışır; alanın dışında kalan tank önce alana döner.
function drive(s,dt,team){const z=B.zone;squadGoal(s,z,dt,rnd,WS-40);let alert=false,near=1e9;const live=[];
 if(Math.hypot(s.wx-s.x,s.wz-s.z)>25)s.h=Math.atan2(s.wx-s.x,s.wz-s.z);
 for(const t of s.tanks){const e=t.e;if(!e||t.hp<=0||t.q||!inField(e))continue;live.push(t);
  let d=1e9;for(const u of team)d=Math.min(d,dist(u,e));t.near=d;near=Math.min(near,d);
  if(d<ALERT||e.hp<e.sn-1)alert=true;e.sn=e.hp;}
 s.alert=alert?10:Math.max(0,(s.alert||0)-dt);s.near=near;
 for(const t of live){const e=t.e;
  if(outsideBy(z,e.x,e.z)>4&&z.state!=='closed'){e.foe=null;e.park=0;e.conv=1;e.ch=Math.atan2(z.cx-e.x,z.cz-e.z);continue;}
  const f=nearestFoe(e,s);if(f&&f.d<t.near-15){e.foe=f.e;e.conv=0;e.park=1;continue;}
  e.foe=null;if(s.alert>0){e.conv=0;e.park=0;continue;}
  const o=slot(s.tanks.indexOf(t),s.h),gx=s.wx+o.x,gz=s.wz+o.z;
  if(Math.hypot(gx-e.x,gz-e.z)>12){e.park=0;e.conv=1;e.ch=Math.atan2(gx-e.x,gz-e.z);}else{e.conv=0;e.park=1;}}}
// Düşman takımların birbirine atışı: mermi görünür, isabet uçuş süresi sonunda işlenir, oyuncuya puan yazılmaz.
function shootFoe(e,f){const d=dist(e,f),sp=e.bs||SHELL_SPEED;
 safe(()=>{root.eshot(e,f.x,hAt(f.x,f.z)+1.6,f.z,sp,'foe');const b=ebul[ebul.length-1];if(b)b.life=Math.min(b.life,d/sp);},null);
 if(rnd()<clamp(1.05-d/260,.25,.95))B.hits.push({t:d/sp,f,dmg:f.mx*(.2+rnd()*.12)});}

function step(dt){
 if(!B||B.over)return;const z=B.zone,ws=WS;B.time+=dt;zoneStep(z,dt,ws,rnd);placeWall();
 // aşama duyuruları
 if(z.state!==B.lastState||z.i!==B.lastPhase){if(z.state==='shrink'){safe(()=>root.say('ALAN DARALIYOR',2.2),null);safe(()=>root.radio('Komuta: Güvenli alan daralıyor, içeride kal.'),null);}
  else if(z.state==='closed')safe(()=>root.say('SON ALAN KAPANDI',2.2),null);B.lastState=z.state;B.lastPhase=z.i;
  if(z.i>=PHASES.length-1&&!B.last){B.last=true;safe(()=>root.grantMedal('son'),null);}}
 // alan dışı hasar: oyuncu ve dost tanklar
 const out=outsideBy(z,P.x,P.z);
 if(out>0&&dmgOn()){P.hp-=zoneDamage(z,out,dt)*P.mx/100;safe(()=>{dmgA=Math.max(dmgA,.28);},null);
  if(P.hp<=0){P.hp=0;finish(false,'Güvenli alanın dışında kaldın');return;}}
 B.warn-=dt;if(out>0&&B.warn<=0){B.warn=4;safe(()=>root.say('ALANA DÖN · '+Math.round(out)+' m',1.6),null);}
 safe(()=>{for(const a of AL){if(a.dead)continue;const d=outsideBy(z,a.x,a.z);if(d>0&&dmgOn()){a.hp-=zoneDamage(z,d,dt)*a.mx/100;if(a.hp<=0){a.hp=.01;root.hitAl(a,1e6);}}}},null);
 const team=[P].concat(safe(()=>AL.filter(a=>!a.dead),[]));
 // düşman takımların birbirine attığı mermilerin isabeti
 if(B.hits.length){for(const h of B.hits){h.t-=dt;if(h.t>0)continue;h.done=true;const f=h.f;if(!inField(f))continue;f.hp-=h.dmg;f.sn=f.hp;
   safe(()=>{root.boom(f.x,hAt(f.x,f.z)+2,f.z,2.4);root.sndBoom(f.x,f.z);},null);if(f.hp<=0)quietKill(f);}
  B.hits=B.hits.filter(h=>!h.done);}
 spawnOne();
 // sahadaki takımlar
 B.drive-=dt;const doDrive=B.drive<=0;if(doDrive)B.drive=.25;let hunted=false;
 for(const s of B.squads){if(!s.active||s.dead)continue;if(doDrive)drive(s,.25,team);if(s.alert>0&&s.near<320)hunted=true;
  for(const t of s.tanks){const e=t.e;if(!e||t.hp<=0||t.q)continue;
   const d=outsideBy(z,e.x,e.z);if(d>0&&dmgOn()){e.hp-=zoneDamage(z,d,dt)*e.mx/100;e.sn=e.hp;if(e.hp<=0){quietKill(e);continue;}}
   const f=e.foe;if(!f)continue;if(!inField(f)){e.foe=null;continue;}
   e.cd=Math.max(e.cd,.8);safe(()=>{const tu=e.g.userData.tu;if(tu)tu.rotation.y=angd(Math.atan2(f.x-e.x,f.z-e.z),e.h);},null);
   if(B.tune.cd>0){e.fc-=dt;if(e.fc<=0){e.fc=B.tune.cd*(1+rnd()*.6);shootFoe(e,f);}}}}
 // düşman Uçangözü yalnız yakında oyuncuyu fark etmiş bir takım varken kalkar
 if(!hunted)safe(()=>{if(edT<6)edT=6;},null);
 // takımlar: yakındakiler sahaya çıkar, uzakta kalanlar sahadan çekilir
 B.tick-=dt;if(B.tick<=0){B.tick=.5;const dr=safe(()=>mode==='drone'&&DR.on?DR:null,null),seers=dr?team.concat([dr]):team,within=(s,r)=>seers.some(u=>dist(u,s)<r);
  for(const s of B.squads){if(s.dead)continue;
   if(s.active){syncActive(s);if(s.dead)continue;s.far=within(s,SLEEP)?0:(s.far||0)+.5;if(s.far>=6)sleep(s);continue;}
   if(aliveTanks(s)===0){squadDown(s,false);continue;}
   if(within(s,ACTIVATE)||(within(s,SLEEP-40)&&B.squads.some(o=>o!==s&&o.active&&!o.dead&&dist(o,s)<FOE+30)))wake(s);}}
 // sahada olmayan takımlar: yürüyüş, alan dışı hasar ve kendi aralarında çatışma
 B.slow+=dt;if(B.slow>=1){const d=B.slow;B.slow=0;const idle=B.squads.filter(s=>!s.dead&&!s.active);
  for(const s of idle){driftSquad(s,z,d,rnd,6,ws-40);const o=outsideBy(z,s.x,s.z);if(o>0)for(const t of s.tanks)if(t.hp>0)t.hp=Math.max(0,t.hp-zoneDamage(z,o,d)/100);if(aliveTanks(s)===0)squadDown(s,false);}
  for(let i=0;i<idle.length;i++)for(let j=i+1;j<idle.length;j++){const a=idle[i],b=idle[j];if(a.dead||b.dead||dist(a,b)>CLASH)continue;
   clashStep(a,b,d,rnd);if(a.dead)squadDown(a,false);if(b.dead)squadDown(b,false);}}
 // bitiş: düşman tankı kalmadıysa son takım oyuncudur
 if(enemiesLeft()===0){finish(true,'Son kalan takım sensin');return;}
 B.paint-=dt;if(B.paint<=0){B.paint=.25;paintCard(out);}
}
function finish(ok,text){if(!B||B.over||finishing)return;finishing=true;try{root.endGame(ok,text);}finally{finishing=false;}}
function settle(ok){ // endGame sarmalayıcısından: sıralama, ödül, kayıt
 const left=teamsLeft(B.squads),place=placement(left,ok),kills=B.kills,rw=reward({place,teams:B.teams,kills});
 B.over=true;B.result={ok,place,teams:B.teams,kills,time:Math.round(B.time),kr:rw.kr,xp:rw.xp};
 safe(()=>{SV.kr+=rw.kr;SV.xp+=rw.xp;},null);
 stats.games=(stats.games|0)+1;if(place===1)stats.wins=(stats.wins|0)+1;stats.best=Math.min(stats.best||99,place);stats.kills=(stats.kills|0)+kills;stats.last={place,teams:B.teams,kills};write();
 doc.body.classList.remove('hr-mission-active');if(card)card.hidden=true;if(wall)wall.visible=false;paintMenu();
 root.BT_RESULT={place,teams:B.teams,kills};
}
function paintCard(out){if(!card||!B)return;const z=B.zone,inf=zoneInfo(z),[st,p,pr,sm]=card.children;
 {const b=Math.round(card.getBoundingClientRect().bottom);if(b!==cardBottom){cardBottom=b;doc.body.style.setProperty('--hrObjB',b+'px');}} // yaralanma kutusu kartın altına iner
 st.textContent=inf.state==='closed'?'SON ALAN':'GÜVENLİ ALAN '+inf.phase+'/'+inf.total;
 p.textContent=out>0?'ALANIN DIŞINDASIN · '+Math.round(out)+' m':inf.state==='wait'?'Daralmaya '+clock(inf.left):inf.state==='shrink'?'Alan daralıyor · '+clock(inf.left):'Alan kapandı';
 card.classList.toggle('dis',out>0);pr.value=inf.state==='closed'?1:1-inf.left/inf.span;
 sm.textContent=(teamsLeft(B.squads)+1)+' takım · '+enemiesLeft()+' düşman tank';}
function paintMenu(){const box=doc.getElementById('btCard');if(!box)return;const pl=plan(safe(()=>SV.form|0,0)),m=Math.round(TOTAL_TIME/60);
 const names={1:'TEK TANK',2:'KISIM · 2 TANK',4:'TAKIM · 4 TANK'};box.replaceChildren();
 const h=doc.createElement('h3');h.textContent='SON TAKIM';const p=doc.createElement('p');p.textContent='Takımlar büyük haritaya dağılır. Güvenli alan aşama aşama daralır; dışında kalan hasar alır. Son kalan takım kazanır.';
 const row=doc.createElement('div');row.className='bt-facts';for(const [k,v] of [['Senin takımın',names[pl.size]],['Rakip',pl.squads+' takım · '+pl.tanks+' tank'],['Süre','yaklaşık '+m+' dk'],['Harita','1,6 km × 1,6 km']]){const d=doc.createElement('div'),b=doc.createElement('b'),s=doc.createElement('span');s.textContent=k;b.textContent=v;d.append(s,b);row.appendChild(d);}
 box.append(h,p,row);
 if(stats.games){const r=doc.createElement('p');r.className='bt-rec';r.textContent=stats.games+' savaş · '+(stats.wins|0)+' zafer · en iyi sıralama '+(stats.best||'—')+(stats.last?' · son: '+stats.last.place+'/'+stats.last.teams:'');box.appendChild(r);}}

function drawMini(){if(!B||B.over||typeof mmx==='undefined')return;const z=B.zone,W=132,O=mmO(),X=x=>((x-O.x)/MMR+.5)*W,Z=y=>((y-O.z)/MMR+.5)*W,k=W/MMR;
 mmx.save();mmx.lineWidth=2;if(z.state!=='closed'){mmx.strokeStyle='rgba(120,190,255,.95)';mmx.beginPath();mmx.arc(X(z.cx),Z(z.cz),Math.max(1,z.r*k),0,7);mmx.stroke();
  mmx.strokeStyle='rgba(255,255,255,.9)';mmx.setLineDash([4,3]);mmx.beginPath();mmx.arc(X(z.nx),Z(z.nz),Math.max(1,z.nr*k),0,7);mmx.stroke();mmx.setLineDash([]);
  if(Math.hypot(O.x-z.nx,O.z-z.nz)>z.nr){const a=Math.atan2(z.nx-O.x,z.nz-O.z);mmx.strokeStyle='rgba(255,255,255,.85)';mmx.lineWidth=1.5;mmx.beginPath();mmx.moveTo(W/2,W/2);mmx.lineTo(W/2+Math.sin(a)*60,W/2+Math.cos(a)*60);mmx.stroke();}}
 mmx.restore();}
function drawMap(c,SX,SY,s){if(!B||B.over)return;const z=B.zone;c.save();if(z.state!=='closed'){c.lineWidth=3;c.strokeStyle='rgba(120,190,255,.95)';c.beginPath();c.arc(SX(z.cx),SY(z.cz),Math.max(1,z.r*s),0,7);c.stroke();
  c.fillStyle='rgba(60,120,220,.16)';c.beginPath();c.rect(SX(-WS),SY(-WS),2*WS*s,2*WS*s);c.arc(SX(z.cx),SY(z.cz),Math.max(1,z.r*s),0,7,true);c.fill('evenodd');
  c.lineWidth=2;c.strokeStyle='rgba(255,255,255,.95)';c.setLineDash([8,6]);c.beginPath();c.arc(SX(z.nx),SY(z.nz),Math.max(1,z.nr*s),0,7);c.stroke();c.setLineDash([]);}
 c.restore();}

function connect(){
 safe(()=>{if(typeof MI!=='undefined')MI[MODE]={n:'Son Takım',t:'Son kalan takım ol',r:'Takımlar büyük haritaya dağılır; güvenli alan daralır. Son kalan takım kazanır.',w:'Son kalan takım sensin'};},null);
 wrap('startMission',old=>function(){if(safe(()=>mis===MODE,false)){begin();return;}cleanup();return old.apply(this,arguments);});
 wrap('stagePending',old=>function(){return !!(B&&!B.over&&enemiesLeft()>0)||old.apply(this,arguments);});
 wrap('endGame',old=>function(ok){if(B&&!B.over&&safe(()=>game==='play',false)){if(ok&&!finishing&&enemiesLeft()>0)return false;settle(!!ok);}return old.apply(this,arguments);});
 wrap('update',old=>function(dt){const r=old.apply(this,arguments);if(playing()&&B&&!doc.hidden)step(clamp(dt,0,.1));return r;});
 wrap('mmDraw',old=>function(){const r=old.apply(this,arguments);drawMini();return r;});
 wrap('openMenu',old=>function(){const r=old.apply(this,arguments);if(!safe(()=>TUT.on,false)&&safe(()=>mis!==MODE,false))safe(()=>root.setG(MODE),null);paintMenu();return r;});
 (root.MAPX=root.MAPX||[]).includes(drawMap)||root.MAPX.push(drawMap);
 // harita, güvenli alanın tamamı ve oyuncu birlikte görünecek ölçekte açılır
 root.MAPVIEW=()=>{if(!B||B.over)return null;const z=B.zone;if(z.state==='closed')return null;return {x:z.cx,z:z.cz,r:Math.min(WS*1.12,Math.max(z.r,Math.hypot(P.x-z.cx,P.z-z.cz)+40)*1.08)};};
}
function installUI(){if(!doc.body||card)return;
 const style=doc.createElement('style');style.id='bt-style';style.textContent=`
#hr-objective{position:fixed;left:12px;top:max(96px,env(safe-area-inset-top));z-index:14;width:min(300px,calc(100vw - 24px));margin:0;padding:0 10px 8px;pointer-events:none;box-sizing:border-box;background:var(--komur-cam,#1a1c18);color:var(--kemik,#f3f5ec);border:1px solid var(--cizgi,#4a4f43);border-left:3px solid #78beff;border-radius:4px;font:600 14px/1.25 var(--sf,system-ui);box-shadow:0 6px 18px rgba(0,0,0,.45)}
#hr-objective[hidden]{display:none!important}
#hr-objective strong{display:block;margin:0 -10px 6px;padding:6px 10px;background:#12140f;border-bottom:1px solid var(--cizgi,#4a4f43);font:700 13px/1 var(--sf,system-ui);letter-spacing:.08em;color:#9fd0ff}
#hr-objective p{margin:0 0 6px;font:700 15px/1.2 var(--sf,system-ui)}
#hr-objective progress{display:block;width:100%;height:6px;accent-color:#78beff}
#hr-objective small{display:block;margin-top:5px;font:700 12.5px/1 var(--sf,system-ui);letter-spacing:.04em;color:var(--kemik2,#bdc3b2)}
#hr-objective.dis{border-left-color:var(--tehlike,#e24a3b)}#hr-objective.dis strong,#hr-objective.dis p{color:#ffb4aa}
#bt-feed{position:fixed;z-index:13;right:calc(12px + env(safe-area-inset-right,0px));top:calc(var(--mm,150px) + 64px + env(safe-area-inset-top,0px));width:min(250px,60vw);display:flex;flex-direction:column;align-items:flex-end;gap:4px;pointer-events:none}
#bt-feed p{margin:0;padding:5px 9px;background:rgba(22,24,20,.86);border-right:3px solid var(--cizgi,#4a4f43);color:var(--kemik,#f3f5ec);font:700 12.5px/1.2 var(--sf,system-ui);letter-spacing:.02em;text-align:right;transition:opacity .5s}
#bt-feed p[data-k=iyi]{border-right-color:var(--yesil,#84c63c)}#bt-feed p.out{opacity:0}
body:not(.inplay) #bt-feed{display:none}
#btCard{background:var(--zirh,#2b2e28);border:1px solid var(--cizgi,#4a4f43);border-left:3px solid var(--sari,#f3c20f);border-radius:3px;padding:12px 12px 10px}
#btCard h3{margin:0 0 6px!important;padding:0!important;border:0!important;font:700 22px/1 var(--sf,system-ui)!important;letter-spacing:.07em!important;color:#fff!important}#btCard h3:after{display:none}
#btCard p{margin:0 0 10px;font:400 15px/1.35 var(--sf,system-ui);color:var(--kemik,#f3f5ec)}
#btCard .bt-facts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}
#btCard .bt-facts div{background:rgba(0,0,0,.28);padding:7px 9px;min-width:0}
#btCard .bt-facts span{display:block;font:700 11.5px/1 var(--sf,system-ui);letter-spacing:.07em;color:var(--kemik2,#bdc3b2);text-transform:uppercase}
#btCard .bt-facts b{display:block;margin-top:4px;font:700 16px/1.1 var(--sf,system-ui);color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#btCard .bt-rec{margin:10px 0 0;font:700 13px/1.2 var(--sf,system-ui);color:var(--sari,#f3c20f)}`;
 doc.head.appendChild(style);
 card=doc.createElement('section');card.id='hr-objective';card.hidden=true;for(const t of ['strong','p','progress','small'])card.appendChild(doc.createElement(t));card.children[2].max=1;doc.body.appendChild(card);
 feedBox=doc.createElement('div');feedBox.id='bt-feed';feedBox.setAttribute('aria-live','polite');doc.body.appendChild(feedBox);
 paintMenu();safe(()=>{if(mis!=='egitim'||!TUT.on)root.setG(MODE);},null);
 doc.addEventListener('click',e=>{if(e.target&&e.target.closest&&e.target.closest('[data-f]'))root.setTimeout(paintMenu,0);},true);
}
function start(){safe(()=>root.setG(MODE),null);return safe(()=>{root.reset(typeof lvSel==='string'?lvSel:'normal');return !!B;},false);}
root.HisarBattle=Object.freeze({version:VERSION,core,start,connect,diagnostics:()=>({version:VERSION,hooks:{...hooks},active:!!B&&!B.over,result:B&&B.result||null,zone:B?{...B.zone,info:zoneInfo(B.zone)}:null,teams:B?teamsLeft(B.squads)+1:0,enemies:enemiesLeft(),kills:B?B.kills:0,
 squads:B?B.squads.map(s=>({id:s.id,name:s.name,x:Math.round(s.x),z:Math.round(s.z),active:s.active,dead:s.dead,alert:s.alert>0,alive:aliveTanks(s),field:s.tanks.filter(t=>t.e&&inField(t.e)).length,duel:s.tanks.filter(t=>t.e&&t.e.foe).length})):[],plan:B?B.plan:null,tune:B?B.tune:null,start:B?B.start:null,time:B?B.time:0,stats:{...stats}})});
connect();installUI();doc.addEventListener('hisar:ui-ready',()=>{connect();installUI();});
if(typeof FRAME_HOOKS!=='undefined')FRAME_HOOKS.push(()=>{if(card&&!safe(()=>game==='play',false))card.hidden=true;});
})(typeof window!=='undefined'?window:globalThis);
