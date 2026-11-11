// Installed inside the existing construction scene closure; no legacy save is reset.
if(window.HisarKurulus){
 const K=window.HisarKurulus,H=K.host,ch=H.chapter(),free=ch.mode==='free',number=Number(new URLSearchParams(location.search).get('chapter'));
 const nativeDroneStart=droneStart,nativePilotEnd=pilotEnd,nativeDroneCam=droneCam;
 let session,wasRunning=false,scan=H.snapshot().progress['scan']||0,roadStart=stats.road,roadSaved=H.snapshot().progress['road']||0,elapsed=0,done=false,transport=false,travel=0,previous=null;
 const dest={x:-42,z:-27};let routeMarker=null;
 function markAt(x,z,color){if(routeMarker)scene.remove(routeMarker);routeMarker=new THREE.Mesh(new THREE.RingGeometry(4,4.5,32),new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide,transparent:true,opacity:.9}));routeMarker.rotation.x=-Math.PI/2;routeMarker.position.set(x,heightAt(x,z)+.2,z);scene.add(routeMarker);}
 if(!free){GM.on=false;PROJ.active=false;if(typeof HAY!=='undefined')HAY.on=false;}
 const oldMenu=document.getElementById('menu');oldMenu.hidden=true;document.getElementById('hud').hidden=false;document.getElementById('ctl').hidden=false;
 if(free){start(vehicles[cur].type,cur);}
 else if(number===1){start('gr');const v=vehicles[cur];v.x=ROAD.x+2;v.z=ROAD.y+ROAD.h/2;v.a=0;v.v=0;pose(v,0);setZone({rect:ROAD,beam:[ROAD.x+16,ROAD.y+ROAD.h/2]});}
 else if(number===7){start('tk');const v=vehicles[cur];dest.x=v.x;dest.z=v.z;v.z+=20;v.a=-Math.PI/2;v.v=0;pose(v,0);markAt(dest.x,dest.z,0xb8eb95);}
 else{start('tk');footInstant(-62,-30,0);if(number===4)markAt(dest.x,dest.z,0xf2cd6c);}
 // Use one shared model, not a differently styled drone in each game.
 for(const child of DRONE.children)child.visible=false;const common=K.model(THREE);DRONE.add(common);DRONE.pilot=true;DRONE.visible=false;
 const a={scene:'site',model:common,ground:heightAt,bounds:{x0:-400,x1:250,z0:-140,z1:190},
 origin:()=>({x:FOOT.on?FOOT.x:vehicles[cur].x,y:heightAt(FOOT.on?FOOT.x:vehicles[cur].x,FOOT.on?FOOT.z:vehicles[cur].z)+1,z:FOOT.on?FOOT.z:vehicles[cur].z}),
 launch(d){if(!FOOT.on)footInstant(vehicles[cur].x+3,vehicles[cur].z,0);if(SEAT.on)standUp(true);AUTO.on=false;nativeDroneStart();if(PILOT.mode!=='drone')return false;this.pose(d,0);return true;},
 pose(d,dt){const p=d.flight.pos;Object.assign(PD,{x:p.x,y:p.y,z:p.z,yaw:Math.PI/2-d.camera.yaw,bat:d.battery*1.5});DRONE.pilot=true;DRONE.visible=d.flight.status!=='docked';DRONE.position.set(p.x,p.y,p.z);DRONE.scale.setScalar(1);DRONE.rotation.set(-d.flight.vz*.015,d.camera.yaw,d.flight.vx*.015,'YXZ');for(const r of common.userData.rot)r.rotation.y+=dt*50;},
 land(){nativePilotEnd();DRONE.pilot=true;DRONE.visible=false;cam.up.set(0,1,0);},
 release(){for(const key of Object.keys(keys))delete keys[key];L.x=L.y=Rj.x=Rj.y=0;L.on=Rj.on=false;},
 pause(v){if(v){wasRunning=running;running=false;if(ac)master.gain.value=0;}else{running=wasRunning;if(ac)master.gain.value=soundOn?VOL.v:0;}},save(){saveWorld(false);},
 catalogue(){return [...vehicles.map((v,i)=>({id:'vehicle:'+i,label:v.name+' · '+(i+1),group:'Bütün sürülebilen araçlar'})),...CAMS.map((n,i)=>({id:'camera:'+i,label:n,group:'Kameralar'})),...(free?[{id:'native-menu',label:'Bütün şantiye projeleri, garnizon ve mevcut menü',group:'Tam içerik'}]:[])];},
 activate(key){const [kind,id]=String(key).split(':');if(kind==='vehicle'&&/^\d+$/.test(id)&&vehicles[+id]){switchTo(+id);return {ok:true};}if(kind==='camera'&&['0','1','2','3'].includes(id)){camMode=+id;camSnap=true;return {ok:true};}if(key==='native-menu'&&free)return {ok:true,after:()=>openMenu()};return {ok:false};},
 tick(dt,d){elapsed+=dt;if(elapsed>3){elapsed=0;const report={};vehicles.forEach((v,i)=>{report['site:'+v.type+'-'+i]={name:v.name,fuel:v.fuel||0,load:v.load||0,used:cur===i?1:0,lastSeen:new Date().toISOString()};});H.fleet(report);}if(done||free)return;const f=d.flight;
  if(number===0){H.goal(f.status==='docked'?'Uçangözü KALDIR ile başlat.':'İlk uçuş: '+Math.min(8,Math.floor(f.seconds))+'/8 sn · sonra GERİ ÇAĞIR.');}
  if(number===1){const earned=Math.max(H.snapshot().progress['road']||0,roadSaved+stats.road-roadStart);H.goal('Yolu düzelt: '+Math.min(6,Math.floor(earned))+'/6 bölüm · bıçak aşağıda, yavaş ilerle.');if(earned>0&&Math.floor(earned)>(H.snapshot().progress['road']||0))H.progress('road',Math.floor(earned));if(earned>=6||stats.road>=roadCells.length*.8){done=true;saveWorld(false);session.done();}}
  if(number===4){
   if(scan<2&&f.status==='airborne'&&Math.hypot(f.pos.x-dest.x,f.pos.z-dest.z)<8){scan+=dt;if(scan>=2)H.progress('scan',2);}
   if(scan<2)H.goal('Uçangöz ile sarı halka üzerine gel · orada iki saniye kal.');
   else if(f.status!=='docked')H.goal('İşaret bulundu. Uçangözü geri çağır.');
   else{if(!transport){transport=true;start('tr');const v=vehicles[cur];v.x=-64;v.z=-27;v.a=0;v.v=0;pose(v,0);}const v=vehicles[cur];H.goal('Hizmet aracını sarı halkaya götür · '+Math.round(Math.hypot(v.x-dest.x,v.z-dest.z))+' m');if(Math.hypot(v.x-dest.x,v.z-dest.z)<5){done=true;saveWorld(false);session.done();}}
  }
  if(number===7){const v=vehicles[cur];if(previous)travel+=Math.min(3,Math.hypot(v.x-previous.x,v.z-previous.z));previous={x:v.x,z:v.z};H.goal('Tankı yeşil halkaya park et · '+Math.round(Math.hypot(v.x-dest.x,v.z-dest.z))+' m');if(travel>8&&Math.hypot(v.x-dest.x,v.z-dest.z)<5&&Math.abs(v.v)<1.3){done=true;saveWorld(false);session.done();}}
 }
 };
 session=K.mount(a);window.HisarSiteCampaign={session,metrics:()=>({road:stats.road,roadStart,scan,travel,done,dest:{...dest}})};
 droneStart=()=>session.start();pilotEnd=function(){if(PILOT.mode==='drone'&&session.active()){session.recall();return;}return nativePilotEnd();};
 droneFrame=dt=>{
  locoSoldier(PLAYER,0,dt);
  // Preserve the original construction parkour objectives under shared movement.
  const n=gateN();for(let i=0;i<n;i++){
   if(PD.gates.includes(i))continue;const [gx,gz]=DGATES[i];
   if(Math.hypot(PD.x-gx,PD.z-gz)<2.4&&PD.y<heightAt(gx,gz)+4.2){
    PD.gates.push(i);toast('KAPI '+(i+1)+' ✓ · '+PD.gates.length+'/'+n,1.4);shot('beep',.3,1.4);
    if(PD.gates.length>=n&&n>=3&&!PD.done){PD.done=true;GM.droneShow=true;satAdd(2,'uçangözle bütün kapılardan geçtin');toast('UÇANGÖZ GÖSTERİSİ · bütün kapılar geçildi!',3);}
   }
  }
  PILOT.t+=dt;
 };droneCam=dt=>{if(!session.camera(cam))nativeDroneCam(dt);};
 UPD.push(dt=>session.frame(dt));window.__hs.droneStart=droneStart;window.__hs.pilotEnd=pilotEnd;
 const oldCamera=updateCam;updateCam=function(dt){oldCamera(dt);if(session.active())session.camera(cam);else{DRONE.visible=false;cam.up.set(0,1,0);}};
 document.getElementById('bPilB')?.setAttribute('hidden','');
}
