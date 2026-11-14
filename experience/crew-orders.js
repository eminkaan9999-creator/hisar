/* HİSAR mürettebat emirleri 1.2 (araçlar iç içe geçmez, her nesne vurulur, tank mevzileri): komutan ateş emri verir, nişancı "Hazır!" der ve atış o anda çıkar;
 * sürücü görünüşüne geçince sürücü, mühimmat değişince doldurucu sesli bildirir. Kurgusal oyun sesleridir.
 */
(function(root){
'use strict';
const AMMO=Object.freeze(['APDS','HEAT','duman','HEP']);
const SPOKEN=Object.freeze({APDS:'a pe de es',HEAT:'hit',duman:'duman',HEP:'hep'});
function ammoLine(i){const n=AMMO[i];return n?'Komutanım, '+n+' mühimmatı yüklendi.':'';}
function shouldDelay(s){return !!s&&s.playing&&s.tank&&!s.aa&&s.ready&&!s.pending;}
// Araçlar iç içe geçmesin: üst üste binen iki gövde merkez çizgisi boyunca ayrılır. Sabit olan (fixed) yerinden oynamaz.
function separate(bodies){let moved=0;for(let i=0;i<bodies.length;i++)for(let j=i+1;j<bodies.length;j++){const a=bodies[i],b=bodies[j];if(a.fixed&&b.fixed)continue;
  let dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz);const min=a.r+b.r;if(d>=min)continue;const push=min-d;if(d<1e-4){dx=1;dz=0;d=1;}
  const ux=dx/d,uz=dz/d,wa=a.fixed?0:b.fixed?1:(a.w||.5),wb=1-wa;a.x-=ux*push*wa;a.z-=uz*push*wa;b.x+=ux*push*wb;b.z+=uz*push*wb;moved++;}
 return moved;}
// Merminin bu adımda kat ettiği doğru parçasının bir noktaya en yakın yatay uzaklığı (hızlı mermi nesnenin içinden atlamasın).
function segDist(ax,az,bx,bz,px,pz){const vx=bx-ax,vz=bz-az,l2=vx*vx+vz*vz;let t=l2?((px-ax)*vx+(pz-az)*vz)/l2:0;t=Math.max(0,Math.min(1,t));return Math.hypot(ax+vx*t-px,az+vz*t-pz);}
// Dost tank oyuncuya en az "gap" kadar uzak tutulur; oyuncu itilmez.
function keepAway(player,ally,gap){const dx=ally.x-player.x,dz=ally.z-player.z,d=Math.hypot(dx,dz);if(d>=gap)return false;const ux=d>1e-4?dx/d:1,uz=d>1e-4?dz/d:0;ally.x=player.x+ux*gap;ally.z=player.z+uz*gap;return true;}
// Tank mevzileri: görev noktalarının yakınında, kuru ve düz arazide, üsten dışarı bakan U biçimli toprak siperler.
const POSITIONS=Object.freeze([{x:2,z:-12},{x:44,z:12},{x:-6,z:62},{x:8,z:76},{x:56,z:-26},{x:70,z:-42},{x:80,z:22}].map(p=>Object.freeze({...p,h:Math.atan2(p.x,p.z)})));
function inPosition(x,z,list){for(const p of list||POSITIONS)if(Math.hypot(x-p.x,z-p.z)<4.2)return p;return null;}
const core=Object.freeze({AMMO,ammoLine,shouldDelay,separate,segDist,keepAway,POSITIONS,inPosition});
if(typeof module==='object'&&module.exports)module.exports=core;
const doc=root.document;if(!doc||root.HisarCrewOrders)return;
const safe=(fn,d)=>{try{return fn();}catch(e){return d;}};
let pending=false,installed=false,inner=null,lastAmmo=null,lastView=null,fired=0,blocked=0;
const voiceOn=()=>safe(()=>SV.voice!==0,true)&&!!root.speechSynthesis&&typeof root.SpeechSynthesisUtterance==='function';
// Bir cümleyi söyler; bitince (ya da en geç maxMs sonra) cb çalışır. Ses kapalıysa kısa bir bekleme yeter.
function sayThen(text,cb,maxMs){let done=false;const fin=()=>{if(done)return;done=true;cb();};
 if(!voiceOn()){root.setTimeout(fin,220);return;}
 safe(()=>{const u=new root.SpeechSynthesisUtterance(text.replace(/\b(APDS|HEAT|HEP)\b/g,m=>SPOKEN[m]));u.lang='tr-TR';u.rate=1.25;u.pitch=.9;u.onend=fin;u.onerror=fin;root.speechSynthesis.cancel();root.speechSynthesis.speak(u);},null);
 root.setTimeout(fin,maxMs);}
function state(){return safe(()=>({playing:game==='play',tank:mode==='tank',aa:!!(root.AA&&AA.on),ready:cd<=0&&(typeof TA==='undefined'||typeof st!=='number'||TA[st]>0),pending}),null);}
function install(){if(installed||typeof root.fire!=='function')return;installed=true;inner=root.fire;
 root.fire=function(){const self=this,args=arguments;
  if(!shouldDelay(state())){if(pending&&safe(()=>mode==='tank',false)){blocked++;return;}return inner.apply(self,args);}
  pending=true;
  // Komutan emri verir, nişancı "Hazır!" der; atış "Hazır"ın bittiği anda çıkar.
  sayThen('Nişancı, ateş!',()=>sayThen('Hazır!',()=>{pending=false;if(safe(()=>game==='play'&&mode==='tank',false)){fired++;inner.apply(self,args);}},650),1000);
 };}
function crewSay(text,key){safe(()=>root.CREW.say(text,1.5,key,1.5),null);}
function frame(){const s=safe(()=>({playing:game==='play',tank:mode==='tank',view:iv,ammo:typeof st==='number'?st:null}),null);
 if(!s||!s.playing){lastAmmo=null;lastView=null;if(s&&!s.playing)pending=false;return;}
 if(s.tank){if(lastView!==null&&s.view===3&&lastView!==3)crewSay('Sürücü sistemi açılıyor.','drv');lastView=s.view;
  if(s.ammo!==null){if(lastAmmo!==null&&s.ammo!==lastAmmo){const line=ammoLine(s.ammo);if(line)crewSay(line,'ld'+s.ammo);}lastAmmo=s.ammo;}}
}
const MOVING=new Set(['tank','apc','truck']),SOLID=new Set(['tank','apc','truck','aa','arty','bunker']);let pushes=0;
function collide(){safe(()=>{if(game!=='play')return;const list=[],refs=[];
  const add=(o,r,fixed,w)=>{list.push({x:o.x,z:o.z,r,fixed,w});refs.push(o);};
  for(const a of AL)if(!a.dead&&keepAway(P,a,9)){pushes++;if(a.g&&a.g.position){a.g.position.x=a.x;a.g.position.z=a.z;}}
  add(P,3.7,false,.25);for(const a of AL)if(!a.dead)add(a,3.7,false,.75);for(const e of E)if(SOLID.has(e.type))add(e,3.5,!MOVING.has(e.type),.75);
  for(let pass=0;pass<2;pass++)if(!separate(list))break;
  for(let i=0;i<list.length;i++){const o=refs[i],n=list[i];if(o.x===n.x&&o.z===n.z)continue;pushes++;o.x=n.x;o.z=n.z;if(o.g&&o.g.position){o.g.position.x=n.x;o.g.position.z=n.z;}}
 },null);}
// Hedef olmayan şeyler de vurulur: dost tank, ağaç ve kaya mermiyi durdurur ve patlama olur.
let rockList=null,worldHits=0,lastFF=0,lastHit='';
function rocksOf(){if(rockList)return rockList;rockList=[];safe(()=>{const m=new THREE.Matrix4(),p=new THREE.Vector3(),q=new THREE.Quaternion(),sc=new THREE.Vector3();for(let i=0;i<rocks.count;i++){rocks.getMatrixAt(i,m);m.decompose(p,q,sc);rockList.push({x:p.x,y:p.y,z:p.z,r:Math.max(.6,sc.x*.95)});}},null);return rockList;}
function shellWorld(){safe(()=>{if(game!=='play')return;for(const s of shells){const q=s.m.position;const ax=s._px===undefined?q.x:s._px,az=s._pz===undefined?q.z:s._pz;s._px=q.x;s._pz=q.z;if(s.life<=0)continue;
   let hit=null;
   for(const a of AL){if(a.dead)continue;if(q.y<hAt(a.x,a.z)+4.5&&segDist(ax,az,q.x,q.z,a.x,a.z)<3.4){hit={ally:a,x:a.x,z:a.z};break;}}
   if(!hit&&root.TREES)for(const t of TREES){if(t.st===3)continue;if(q.y<hAt(t.x,t.z)+7*(t.s||1)&&segDist(ax,az,q.x,q.z,t.x,t.z)<1.1*(t.s||1)){hit={tree:t,x:t.x,z:t.z};break;}}
   if(!hit)for(const r of rocksOf()){if(Math.abs(q.y-r.y)<r.r+.6&&segDist(ax,az,q.x,q.z,r.x,r.z)<r.r){hit={x:r.x,z:r.z};break;}}
   if(!hit)continue;worldHits++;lastHit=hit.ally?'ally':hit.tree?'tree':'rock';s.life=0;impact(s,hit.x,q.y,hit.z,null);
   if(hit.tree&&s.k!==2)root.bigBoom(hit.x,hit.z,1);
   if(hit.ally&&s.k!==2){safe(()=>hitAl(hit.ally,3),null);const now=performance.now();if(now-lastFF>4000){lastFF=now;safe(()=>root.radio('Dost ateşi! Ateşi kes!'),null);}}
 }},null);}
let built=0,coverHits=0,coverNote=0;
function buildPositions(){if(built)return;safe(()=>{const mat=new THREE.MeshLambertMaterial({color:0x6b5a3c}),bag=new THREE.MeshLambertMaterial({color:0x8a7a58});
  for(const p of POSITIONS){const g=new THREE.Group(),sn=Math.sin(p.h),cs=Math.cos(p.h);
   // ön siper + iki yan siper; arka taraf giriş için açık. Her parça kendi zemin yüksekliğine oturur.
   const parts=[[0,5.4,9.6,1.7,2.2],[-4.9,1.2,2.2,1.5,7.4],[4.9,1.2,2.2,1.5,7.4]];
   for(const [lx,lz,w,h,d] of parts){const wx=p.x+cs*lx+sn*lz,wz=p.z-sn*lx+cs*lz,m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(wx,hAt(wx,wz)+h/2-.25,wz);m.rotation.y=p.h;m.castShadow=true;m.receiveShadow=true;g.add(m);
    const top=new THREE.Mesh(new THREE.BoxGeometry(w*.92,.35,d*.8),bag);top.position.set(wx,hAt(wx,wz)+h-.1,wz);top.rotation.y=p.h;g.add(top);}
   S.add(g);built++;}
 },null);}
// Mevzideyken gelen hasar yarıya iner.
safe(()=>{const hp=root.hitP;if(typeof hp==='function'&&!hp.hisarCover){const w=function(k,p){if(inPosition(P.x,P.z)){coverHits++;const now=performance.now();if(now-coverNote>6000){coverNote=now;safe(()=>say('🛡 MEVZİDE · hasar yarıya indi',1.4),null);}return hp.call(this,k*.5,p);}return hp.apply(this,arguments);};w.hisarCover=true;root.hitP=w;}},null);
function boot(){install();if(Array.isArray(safe(()=>FRAME_HOOKS,null))&&!boot.done){boot.done=true;FRAME_HOOKS.push(frame);}}
// Çarpışma ayrımı her oyun adımından sonra çalışır (dokunuş beklemez).
safe(()=>{const up=root.update;if(typeof up==='function'&&!up.hisarCollide){const w=function(){buildPositions();const r=up.apply(this,arguments);shellWorld();collide();return r;};w.hisarCollide=true;root.update=w;}},null);
// Diğer modüller ateşi sardıktan sonra en dışa yerleşmek için ilk dokunuşta ya da tuşta kurulur.
root.addEventListener('pointerdown',boot,{capture:true,once:true});root.addEventListener('keydown',boot,{capture:true,once:true});
root.HisarCrewOrders=Object.freeze({core,diagnostics:()=>({installed,pending,fired,blocked,lastAmmo,lastView,pushes,worldHits,lastHit,positions:built,coverHits})});
})(typeof window!=='undefined'?window:globalThis);
