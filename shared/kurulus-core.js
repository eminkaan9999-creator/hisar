/* HİSAR Kuruluş: shared fictional campaign state and arcade drone controller.
 * This module never writes legacy tank, range or construction save keys. */
(function(root){'use strict';
const VERSION='1.1.0',KEY='hisar-kurulus-v1';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number.isFinite(n)?n:a));
const num=(n,d=0)=>Number.isFinite(n)?n:d;
const copy=o=>JSON.parse(JSON.stringify(o));
const CHAPTERS=Object.freeze([
 {id:'ilk-sabah',scene:'site',title:'İlk Sabah',brief:'Ekibinle tanış. Uçangözü kaldır, sekiz saniye uçur ve geri getir.',goal:'Uçangözü kaldır ve kamerayı dene.',reward:20},
 {id:'ilk-iz',scene:'site',title:'İlk İz',brief:'Greyderle işaretli yolun ilk altı bölümünü düzelt. Yaptığın çalışma şantiye kaydında kalır.',goal:'Bıçağı indir; işaretli yolda yavaşça ilerle.',reward:30},
 {id:'birlik-olmak',scene:'range',title:'Birlik Olmak',brief:'Sakin poligonda beş oyun atışı yap. İsabet zorunluluğu ve süre baskısı yok.',goal:'Beş oyun atışı ile kontrolleri tanı.',reward:20},
 {id:'ilk-konvoy',scene:'tank',mission:1,title:'İlk Konvoy',brief:'İkmal aracına eşlik et. Telsizden takip emri ver; kontrol noktalarını birlikte geç.',goal:'İKMAL 1’e takip emri ver.',reward:40},
 {id:'kesilen-baglanti',scene:'site',title:'Kesilen Bağlantı',brief:'Uçangöz ile sarı işareti bul. Uçangözü geri getir; hizmet aracını buluşma noktasına götür.',goal:'Uçangöz kamerasıyla sarı işareti incele.',reward:30},
 {id:'gece-vardiyasi',scene:'tank',mission:0,title:'Gece Vardiyası',brief:'Aynı Uçangöz ile ekibin işaretini bul. Tankla ekibi al, birliğinle üsse dön.',goal:'Kayıp ekibin işaretini uçangöz ile incele.',reward:40},
 {id:'son-konvoy',scene:'tank',mission:5,title:'Son Konvoy',brief:'Birliğinle buluş, sırayla gelen kara araçlarını karşıla ve hayatta kalan dostlarını geri getir.',goal:'Birliğinle buluşma alanına ilerle.',reward:50},
 {id:'eve-donus',scene:'site',title:'Eve Dönüş',brief:'Tankı işaretli üs alanına park et. Uçangözü bakım yerine teslim ederek hikâyeyi tamamla.',goal:'Tankla yeşil park alanına ilerle.',reward:20}
].map(Object.freeze));
function vector(v){v=v||{};return {x:clamp(num(v.x),-10000,10000),y:clamp(num(v.y),-100,1000),z:clamp(num(v.z),-10000,10000)};}
function camera(v){v=v||{};return {yaw:clamp(num(v.yaw),-Math.PI*2,Math.PI*2),pitch:clamp(num(v.pitch,-.3),-1.5,.5),zoom:clamp(num(v.zoom,1),1,3),view:['fpv','follow','down'].includes(v.view)?v.view:'fpv'};}
function normalizeFleet(value){
 const out={};if(!value||typeof value!=='object'||Array.isArray(value))return out;
 for(const [key,v]of Object.entries(value).slice(0,160)){
  if(!/^(site|tank|range):[a-z0-9_-]{1,40}$/.test(key)||!v||typeof v!=='object')continue;
  out[key]={name:String(v.name||key).slice(0,90),used:Math.max(0,Math.trunc(num(v.used))),lastSeen:typeof v.lastSeen==='string'?v.lastSeen.slice(0,32):''};
  for(const f of ['fuel','health','load'])if(Number.isFinite(v[f]))out[key][f]=clamp(v[f],0,10000);
 }
 return out;
}
function normalizeResume(v){return v&&['site','tank','range'].includes(v.scene)?{scene:v.scene,mode:v.mode==='free'?'free':'story'}:null;}
function normalize(v){
 v=v&&typeof v==='object'&&!Array.isArray(v)?v:{};
 if(num(v.schema)>1)throw Error('Bu kayıt daha yeni bir HİSAR sürümüne ait. Güncellemeyi aç.');
 const done=[];for(const c of CHAPTERS){if(Array.isArray(v.completed)&&v.completed.includes(c.id))done.push(c.id);else break;}
 const d=v.drone||{},f=d.flight||{},scene=['site','tank'].includes(f.scene)?f.scene:'site';
 const flight={status:['airborne','returning'].includes(f.status)?f.status:'docked',scene,pos:vector(f.pos),home:vector(f.home),heading:num(f.heading),vx:0,vy:0,vz:0,seconds:clamp(num(f.seconds),0,86400)};
 const progress={};for(const [k,n]of Object.entries(v.progress||{}))if(/^[a-z0-9-]{1,40}$/.test(k)&&Number.isFinite(n))progress[k]=clamp(n,0,1e6);
 return {schema:1,revision:Math.max(0,Math.trunc(num(v.revision))),chapter:done.length,completed:done,progress,
  supply:done.reduce((a,id)=>a+CHAPTERS.find(c=>c.id===id).reward,0),
  base:{roadReady:done.includes('ilk-iz'),droneWorkshop:done.includes('ilk-konvoy'),connectionRestored:done.includes('kesilen-baglanti')},
  drone:{id:'UCANGOZ-1',label:'Uçangöz',battery:clamp(num(d.battery,100),0,100),health:clamp(num(d.health,100),0,100),camera:camera(d.camera),flight},
  fleet:normalizeFleet(v.fleet),resume:normalizeResume(v.resume),
  settings:{sound:v.settings?.sound!==false,sensitivity:clamp(num(v.settings?.sensitivity,1),.5,1.5)},updatedAt:typeof v.updatedAt==='string'?v.updatedAt:''};
}
function complete(state,id){const s=normalize(state);const c=CHAPTERS[s.chapter];if(!c||c.id!==id||s.drone.flight.status!=='docked')return s;s.completed.push(id);s.chapter++;s.progress={};return normalize(s);}
function launch(state,scene,origin){const s=normalize(state);if(!['site','tank'].includes(scene)||s.drone.flight.status!=='docked'||s.drone.battery<8||s.drone.health<=0)return {ok:false,state:s};const p=vector(origin);s.drone.flight={status:'airborne',scene,pos:{...p,y:p.y+2},home:p,heading:0,vx:0,vy:0,vz:0,seconds:0};return {ok:true,state:s};}
function canTravel(s){return normalize(s).drone.flight.status==='docked';}
function service(state,scene){const s=normalize(state);if(scene!=='site'||!canTravel(s))return {ok:false,state:s};s.drone.battery=100;s.drone.health=100;return {ok:true,state:s};}
function advance(drone,input,dt,ground,bounds){
 // Shared game-scale movement, deliberately not a physical aircraft simulator.
 const d=drone,f=d.flight;if(f.status==='docked')return {landed:false};
 dt=clamp(dt,0,.1);if(!dt)return {landed:false};input=input||{};
 const n=Math.max(1,Math.ceil(dt/.025)),h=dt/n,b=bounds||{x0:-180,x1:180,z0:-180,z1:180};let landed=false;
 for(let k=0;k<n;k++){
  f.seconds+=h;d.battery=Math.max(0,d.battery-h*.22);
  if(d.battery<4)f.status='returning';
  const c=d.camera;c.yaw=((c.yaw+clamp(num(input.lookX),-1,1)*h*1.5)+Math.PI*3)%(Math.PI*2)-Math.PI;
  c.pitch=clamp(c.pitch-clamp(num(input.lookY),-1,1)*h*1.1,-1.5,.5);
  let tx=0,tz=0,ty=0;
  if(f.status==='returning'){
   const dx=f.home.x-f.pos.x,dz=f.home.z-f.pos.z,dist=Math.hypot(dx,dz),speed=Math.min(10,dist*1.8);
   tx=dist?dx/dist*speed:0;tz=dist?dz/dist*speed:0;const yy=dist>2?Math.max(ground(f.pos.x,f.pos.z)+5,f.home.y+5):f.home.y+1;
   ty=clamp((yy-f.pos.y)*2,-4,4);
   if(dist<.6&&Math.abs(f.pos.y-f.home.y-1)<.5){f.status='docked';f.pos={...f.home};f.vx=f.vy=f.vz=0;landed=true;break;}
  }else{
   const a=c.yaw,speed=input.slow?5:11,x=clamp(num(input.x),-1,1),z=clamp(num(input.z),-1,1),len=Math.max(1,Math.hypot(x,z));
   tx=(Math.cos(a)*x+Math.sin(a)*z)*speed/len;tz=(-Math.sin(a)*x+Math.cos(a)*z)*speed/len;ty=clamp(num(input.up),-1,1)*4;
  }
  const smooth=1-Math.exp(-6*h);f.vx+=(tx-f.vx)*smooth;f.vz+=(tz-f.vz)*smooth;f.vy+=(ty-f.vy)*smooth;
  f.pos.x=clamp(f.pos.x+f.vx*h,b.x0,b.x1);f.pos.z=clamp(f.pos.z+f.vz*h,b.z0,b.z1);
  const floor=ground(f.pos.x,f.pos.z)+1;f.pos.y=clamp(f.pos.y+f.vy*h,floor,ground(f.pos.x,f.pos.z)+70);if(f.pos.y===floor&&f.vy<0)f.vy=0;
  f.heading=c.yaw;
 }
 return {landed};
}
const api={VERSION,KEY,CHAPTERS,normalize,complete,launch,service,canTravel,advance,camera,vector,copy,clamp,normalizeFleet,normalizeResume};
if(typeof module==='object'&&module.exports)module.exports=api;root.HisarKurulusCore=Object.freeze(api);
})(typeof window!=='undefined'?window:globalThis);
