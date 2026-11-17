/* Modern presentation: colour-managed 3D, bounded shadows, live vehicle HUD and real convoy model. */
(function(root){'use strict';
const VERSION='1.1.0',clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const LOOKS=Object.freeze({
 gunduz:{exposure:1.0,sun:1.55,hemi:.48,color:0xffecd0,ground:0x5b5144,near:100,far:510},
 aksam:{exposure:1.08,sun:1.3,hemi:.4,color:0xffc58d,ground:0x51484a,near:85,far:470},
 gece:{exposure:1.15,sun:.32,hemi:.25,color:0x9dbbde,ground:0x202c39,near:25,far:240},
 sis:{exposure:1.04,sun:.55,hemi:.58,color:0xd4dfe4,ground:0x687270,near:12,far:180},
 yagmur:{exposure:1.08,sun:.48,hemi:.5,color:0xc7d9e5,ground:0x3b4c50,near:30,far:300},
 kar:{exposure:.95,sun:.65,hemi:.6,color:0xe7f0f5,ground:0x8c9aa2,near:55,far:360}
});
function budget(coarse,quality,ratio){return {pixelRatio:Math.min(Math.max(.5,ratio||1),coarse?1.5:2),shadowSize:quality==='dusuk'?512:coarse?1024:quality==='yuksek'?2048:1024,anisotropy:coarse?4:8};}
function musicMix(state,radio){return state==='play'?(radio?.18:.42):state==='pause'?0:.12;}
function percent(value,max){return Number.isFinite(value)&&Number.isFinite(max)&&max>0?Math.round(clamp(value/max*100,0,100)):0;}
function instanceColour(mesh,Attribute){if(!mesh.isInstancedMesh||mesh.instanceColor)return false;const n=mesh.instanceMatrix&&mesh.instanceMatrix.count;if(!(n>0))return false;mesh.instanceColor=new Attribute(new Float32Array(n*3).fill(1),3);return true;}
const colourGuards=new WeakSet();
// Models attached later to an existing group also need their colour buffer
// before WebGL uploads them, even when their material was already compiled.
function guardInstanceColours(Object3D,Attribute){const proto=Object3D&&Object3D.prototype;if(!proto||colourGuards.has(proto))return false;const add=proto.add;if(typeof add!=='function')return false;
 proto.add=function(){for(const child of arguments)if(child&&child.traverse)child.traverse(o=>instanceColour(o,Attribute));return add.apply(this,arguments);};colourGuards.add(proto);return true;}
function terrainPose(x,z,h,ground){const s=Math.sin(h),c=Math.cos(h),at=(a,b)=>{const y=ground(a,b);return Number.isFinite(y)?y:0;},f=at(x+s*2,z+c*2),b=at(x-s*2,z-c*2),r=at(x+c*1.2,z-s*1.2),l=at(x-c*1.2,z+s*1.2);return {y:Math.max(at(x,z),(f+b+r+l)/4),pitch:clamp(-Math.atan2(f-b,4),-.25,.25),roll:clamp(Math.atan2(r-l,2.4),-.2,.2)};}
const core=Object.freeze({VERSION,LOOKS,budget,musicMix,percent,instanceColour,guardInstanceColours,terrainPose});if(typeof module==='object'&&module.exports)module.exports=core;
const doc=root.document;if(!doc)return;const safe=(f,d)=>{try{return f();}catch(e){return d;}};
const stat={installed:false,graphics:false,materials:0,looks:0,assets:'idle',error:null,convoys:0,removed:0,hudUpdates:0},hooks={};let assetPromise=null,truck=null,hud=null,uiTime=0;
const coarse=()=>safe(()=>root.matchMedia('(pointer:coarse)').matches,false);
function wrap(name,f){if(hooks[name]||typeof root[name]!=='function')return;root[name]=f(root[name]);hooks[name]=true;}
function colourTexture(t){if(!t||t.userData&&t.userData.sfColor)return;t.userData=t.userData||{};t.userData.sfColor=true;t.encoding=root.THREE.sRGBEncoding;t.anisotropy=Math.min(safe(()=>R.capabilities.getMaxAnisotropy(),4),coarse()?4:8);t.needsUpdate=true;}
function materials(group){if(!group||!group.traverse)return;group.traverse(o=>{instanceColour(o,root.THREE.InstancedBufferAttribute);for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[]){if(m.userData&&m.userData.sfLook)continue;m.userData=m.userData||{};m.userData.sfLook=true;if(m.map)colourTexture(m.map);
  if(m.isMeshStandardMaterial){if(m.userData.m60x){m.roughness=.67;m.metalness=.18;m.envMapIntensity=.72;}else if(m.userData.drnx){m.roughness=.56;m.metalness=.18;}
   else if(!m.userData.pbr&&!m.transparent){m.roughness=clamp(m.roughness,.55,.96);m.envMapIntensity=Math.min(m.envMapIntensity||.6,.8);}m.needsUpdate=true;}stat.materials++;}});}
function quality(){const b=budget(coarse(),safe(()=>qlv,'orta'),safe(()=>R.getPixelRatio(),1));safe(()=>{if(R.getPixelRatio()>b.pixelRatio){R.setPixelRatio(b.pixelRatio);R.setSize(root.innerWidth,root.innerHeight);}if(sun.shadow.mapSize.x>b.shadowSize){if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}sun.shadow.mapSize.set(b.shadowSize,b.shadowSize);}sun.shadow.normalBias=.025;sun.shadow.bias=-.0003;},null);return b;}
function look(w){const q=LOOKS[w]||LOOKS.gunduz;safe(()=>{R.toneMappingExposure=q.exposure;sun.intensity=q.sun;sun.color.setHex(q.color);hemi.intensity=q.hemi;hemi.groundColor.setHex(q.ground);S.fog.near=q.near;S.fog.far=q.far;
 if(S.background&&S.background.isTexture)colourTexture(S.background);if(typeof WX!=='undefined'&&WX[w])WX[w].hi=q.hemi;stat.looks++;},null);}
function graphics(){if(stat.graphics||!root.THREE||!safe(()=>R.getContext(),null))return;stat.graphics=true;const T=root.THREE;
 guardInstanceColours(T.Object3D,T.InstancedBufferAttribute);
 safe(()=>{R.outputEncoding=T.sRGBEncoding;R.toneMapping=T.ACESFilmicToneMapping;R.toneMappingExposure=1;materials(S);const add=S.add;S.add=function(){const r=add.apply(this,arguments);for(const g of arguments)materials(g);return r;};},null);
 wrap('setW',old=>function(w){const r=old.apply(this,arguments);look(w);return r;});wrap('setQ',old=>function(){const r=old.apply(this,arguments);quality();return r;});
 const sky=root.onSky;root.onSky=function(w){const r=typeof sky==='function'?sky.apply(this,arguments):undefined;look(w);return r;};
 look(safe(()=>wx,'gunduz'));quality();loadTruck();}
function loadTruck(){if(assetPromise)return assetPromise;const M=root.HisarModel,T=root.THREE;if(!M||!T)return Promise.reject(Error('Model sistemi hazır değil'));
 stat.assets='loading';assetPromise=Promise.all([M.load('assets/mdl/kamyon.bin?v=1'),M.load('assets/mdl/kamyon_uzak.bin?v=1')]).then(([a,b])=>{
  const mat=M.material(M.texture('assets/tex/kamyon_col.jpg?v=1'),{gain:1.05});truck={hi:M.geometry(a),lo:M.geometry(b),mat};stat.assets='ready';return truck;
 }).catch(e=>{stat.assets='error';stat.error=String(e&&e.message||e);throw e;});assetPromise.catch(()=>{});return assetPromise;}
function spawnConvoy(c){loadTruck().then(d=>{if(c.disposed)return;const T=root.THREE,M=root.HisarModel,g=new T.Group(),body=new T.Group();g.name='SF_IKMAL_KAMYONU';body.scale.setScalar(6.4);g.add(body);safe(()=>S.add(g),null);c.detail=M.prop(body,d.hi,d.lo,d.mat,{at:g,key:'safak-konvoy',near:75,max:1,gone:true,receive:true});
  const plate=new T.Mesh(new T.BoxGeometry(1.3,.24,.05),new T.MeshStandardMaterial({color:0xdde8d3,roughness:.8}));plate.position.set(0,1,-3.3);g.add(plate);c.owned=[plate.geometry,plate.material];c.g=g;c.modelReady=true;c.colliders=[-1.65,1.65].map(off=>({x:c.x,z:c.z,r:2.25,sfConvoy:c,off}));safe(()=>COV.push(...c.colliders),null);stat.convoys++;syncConvoy(c);safe(()=>root.REAL.convObj(g),null);materials(g);
 }).catch(e=>{if(!c.disposed)c.error=String(e&&e.message||e);});}
function removeConvoy(c){c.disposed=true;if(c.g){safe(()=>S.remove(c.g),null);c.g=null;stat.removed++;}if(c.detail)safe(()=>root.HisarModel.release(c.detail),null);c.detail=null;for(const v of c.owned||[])safe(()=>v.dispose(),null);c.owned=[];if(c.colliders)safe(()=>{for(const q of c.colliders){const i=COV.indexOf(q);if(i>=0)COV.splice(i,1);}},null);c.colliders=[];}
function syncConvoy(c){if(!c.g)return;const h=c.h||0,s=Math.sin(h),k=Math.cos(h),pose=terrainPose(c.x,c.z,h,(x,z)=>safe(()=>hAt(x,z),0));if(c.terrain){for(const a of ['y','pitch','roll'])c.terrain[a]+=(pose[a]-c.terrain[a])*.3;}else c.terrain=pose;c.g.position.set(c.x,c.terrain.y,c.z);c.g.rotation.set(c.terrain.pitch,h,c.terrain.roll);for(const q of c.colliders||[]){q.x=c.x+s*q.off;q.z=c.z+k*q.off;}}
function convoyPassable(x,z,c){if(!c._near||Math.hypot(x-(c._nx||0),z-(c._nz||0))>8){c._nx=x;c._nz=z;c._near=safe(()=>[...COV,...BLD].filter(o=>!o.dead&&!o.sfConvoy&&Number.isFinite(o.x)&&Number.isFinite(o.z)&&Math.hypot(o.x-x,o.z-z)<45),[]);}
 if(root.HisarMobility&&!root.HisarMobility.allows(c,{x,z,h:c.h},false))return false;const water=safe(()=>hAt(x,z)<-1.2,false);if(water)return false;for(const o of c._near)if(Math.hypot(o.x-x,o.z-z)<(o.r||2)+2.4)return false;return true;}
function telemetry(){return safe(()=>{if(game!=='play')return {state:game};const drone=mode==='drone'&&DR.on,hk=root.HisarHarekat&&root.HisarHarekat.diagnostics();return {state:game,drone,hp:drone?percent(DR.hp,60*(1+.25*(SV.U.dar||0))):percent(P.hp,P.mx),speed:drone?Math.max(0,Math.round(DR.y-hAt(DR.x,DR.z))):Math.round(Math.abs(P.v||0)*3.6),unit:drone?'m':'km/sa',bearing:safe(()=>drone?yaw:P.h,0),ammo:drone?ammo:TA[st],weapon:drone?'UÇANGÖZ':(SH[st].n.split(' · ')[0]),ready:drone?'GÖREVDE':cd>0?'YÜKLENİYOR '+cd.toFixed(1):'ATIŞA HAZIR',chapter:hk&&hk.chapter,preparation:hk&&hk.preparation||0,convoy:hk&&hk.convoy};},null);}
function drawHUD(){const t=telemetry();if(!t||!hud)return;const set=(id,v)=>{const e=doc.getElementById(id);if(e&&e.textContent!==String(v))e.textContent=String(v);};
 if(t.state!=='play'){hud.hidden=true;return;}
 hud.hidden=t.state!=='play';set('sf-vehicle',t.drone?'UÇANGÖZ':'ÇELİK BÖRÜ');set('sf-health-value','%'+t.hp);const bar=doc.getElementById('sf-health');if(bar){bar.value=t.hp;bar.classList.toggle('critical',t.hp<30);}set('sf-motion-label',t.drone?'İRTİFA / İSTİKAMET':'HIZ / İSTİKAMET');set('sf-speed',t.speed+' '+t.unit);set('sf-weapon',t.weapon+' · '+t.ammo);set('sf-reload',t.ready);set('sf-bearing',safe(()=>String((Math.round(t.bearing*180/Math.PI)%360+360)%360).padStart(3,'0')+'°','000°'));
 const note=doc.getElementById('sf-status');if(note){note.hidden=!t.chapter;note.textContent=t.preparation>0?'HAZIRLIK · '+Math.ceil(t.preparation)+' sn':t.convoy?'İKMAL ARACI · %'+Math.round(t.convoy.hp/t.convoy.mx*100):'ŞAFAK HATTI · BÖLÜM '+t.chapter+'/4';}stat.hudUpdates++;}
function install(){if(stat.installed||!doc.body)return;stat.installed=true;doc.body.classList.add('sf-modern');hud=doc.createElement('section');hud.id='sf-hud';hud.hidden=true;hud.setAttribute('aria-label','Araç durumu');
 hud.innerHTML='<div class="sf-armour"><small id="sf-vehicle">ÇELİK BÖRÜ</small><b id="sf-health-value">%100</b><progress id="sf-health" max="100" value="100" aria-label="Araç dayanıklılığı"></progress></div><div class="sf-hud-cell"><small id="sf-motion-label">HIZ / İSTİKAMET</small><b id="sf-speed">0 km/sa</b><span id="sf-bearing">000°</span></div><div class="sf-hud-cell sf-ammunition"><small id="sf-reload">ATIŞA HAZIR</small><b id="sf-weapon">APDS</b></div><span id="sf-status" hidden></span>';
 doc.body.appendChild(hud);graphics();safe(()=>root.HisarGameBridge.onFrame(dt=>{uiTime+=dt;if(uiTime<.15)return;uiTime=0;drawHUD();safe(()=>root.MUSIC.mix(musicMix(game,!!(root.CREW&&root.CREW.busy))),null);}),false);
 root.addEventListener('pagehide',()=>safe(()=>root.MUSIC.mix(0),null));}
root.HisarModern=Object.freeze({version:VERSION,core,install,graphics,spawnConvoy,removeConvoy,syncConvoy,convoyPassable,telemetry,assets:()=>loadTruck(),diagnostics:()=>({...stat,hooks:{...hooks},budget:budget(coarse(),safe(()=>qlv,'orta'),safe(()=>R.getPixelRatio(),1)),look:safe(()=>wx,'gunduz')})});
if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',install);else install();doc.addEventListener('hisar:ui-ready',()=>{install();graphics();});
})(typeof window!=='undefined'?window:globalThis);
