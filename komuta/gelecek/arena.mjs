import '../../three.min.js';
import {stepVehicle,lockedEnemy,canFire,activateDome,cycleTarget,config,eraFor} from './model.mjs';
import {FrameBudget,fixedClock} from './performans.mjs';

function createScene(canvas,s,budget) {
  const mission=s.mission,era=eraFor(config(s)).key,earth=era!=='far';
  const eclipse=mission==='eclipse';
  const T=window.THREE;
  const renderer=new T.WebGLRenderer({canvas,antialias:false,powerPreference:'high-performance',alpha:false});
  renderer.setPixelRatio(budget.ratio);
  renderer.toneMapping=T.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.15;
  const scene=new T.Scene();
  scene.background=new T.Color(earth?(era==='present'?0x708d9a:0x344f65):eclipse?0x130b20:0x050b18);
  scene.fog=new T.FogExp2(earth?0x6e8182:eclipse?0x1b122c:0x080e20,earth?.004:.006);
  scene.add(new T.HemisphereLight(earth?0xd3e4df:0xa1d5ff,earth?0x574f3a:0x172139,.8));
  const sun=new T.DirectionalLight(earth?0xffe3ba:eclipse?0xffba99:0x9dd5ff,1.5);
  sun.position.set(-25,60,30);scene.add(sun);
  const camera=new T.PerspectiveCamera(60,1,.1,600);
  const metal=new T.MeshStandardMaterial({color:earth?(era==='present'?0x7c8260:0x526e7c):0x71899b,metalness:.25,roughness:.5});
  const dark=new T.MeshStandardMaterial({color:0x17273b,metalness:.25,roughness:.65});
  const cyan=new T.MeshBasicMaterial({color:0x55f7ee});
  const amber=new T.MeshBasicMaterial({color:0xff9770});
  const red=new T.MeshBasicMaterial({color:0xff567d});
  const box=new T.BoxGeometry(1,1,1);
  const staticBlocks=new Map();
  function mesh(geometry,material,parent=scene) {
    const item=new T.Mesh(geometry,material);parent.add(item);return item;
  }
  function block(parent,material,x,y,z,w,h,d) {
    if(parent===scene){
      if(!staticBlocks.has(material))staticBlocks.set(material,[]);
      staticBlocks.get(material).push({x,y,z,w,h,d});
      return;
    }
    const item=mesh(box,material,parent);
    item.position.set(x,y,z);item.scale.set(w,h,d);return item;
  }
  const tile=document.createElement('canvas');tile.width=256;tile.height=256;
  const ink=tile.getContext('2d');
  ink.fillStyle=earth?'#77715b':'#112334';ink.fillRect(0,0,256,256);
  let noise=81;
  for(let i=0;i<2800;i++){
    noise=(noise*1664525+1013904223)>>>0;
    const x=noise%256;noise=(noise*1664525+1013904223)>>>0;
    ink.fillStyle=earth?(i%2?'#958a6c':'#595f4f'):i%2?'#192b3a':'#0c1d2c';ink.fillRect(x,noise%256,earth?5:2,earth?3:1);
  }
  if(!earth){
    ink.strokeStyle='#365368';ink.lineWidth=3;ink.strokeRect(5,5,246,246);
    ink.strokeStyle='#081420';ink.lineWidth=2;ink.strokeRect(9,9,238,238);
    for(const x of [17,239])for(const y of [17,239]){ink.fillStyle='#547480';ink.fillRect(x-2,y-2,4,4);}
  }
  const floorTexture=new T.CanvasTexture(tile);
  floorTexture.wrapS=floorTexture.wrapT=T.RepeatWrapping;floorTexture.repeat.set(24,24);
  floorTexture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
  const groundMaterial=new T.MeshStandardMaterial({map:floorTexture,color:earth?0xc4b896:0x8295a6,roughness:.9,metalness:earth?0:.15});
  let closed=false,soil;
  if(earth){
    soil=new T.TextureLoader().load(new URL('../../assets/tex/t_tas.jpg',import.meta.url).href,texture=>{
      if(closed){texture.dispose();return;}
      texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(12,12);texture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
      groundMaterial.map=texture;groundMaterial.needsUpdate=true;
    });
  }
  const ground=mesh(new T.PlaneGeometry(190,190),groundMaterial);
  ground.rotation.x=-Math.PI/2;
  const grid=new T.GridHelper(180,36,earth?0x85917a:0x26727c,earth?0x6c7764:0x183444);grid.position.y=.025;scene.add(grid);grid.visible=!earth;
  for(let i=0;i<(earth?12:24);i++) {
    const side=i%2?-1:1,x=side*(57+(i%3)*8),z=(Math.floor(i/2)-5)*13;
    const height=earth?3+i%3:8+(i*17%25);
    block(scene,dark,x,height/2,z,8,height,9);
    block(scene,cyan,x-side*4.02,height*.58,z, .08,height*.65,.25);
    block(scene,metal,x,height+1,z,10,2,11);
  }
  if(earth){
    const terrainGeometry=new T.PlaneGeometry(550,550,90,90);terrainGeometry.rotateX(-Math.PI/2);
    const vertices=terrainGeometry.attributes.position;
    for(let i=0;i<vertices.count;i++){
      const x=vertices.getX(i),z=vertices.getZ(i),radius=Math.hypot(x,z),angle=Math.atan2(x,z);
      const ridge=Math.max(0,1-Math.abs(radius-175)/85);
      const detail=20+18*Math.sin(angle*5+1)**2+13*Math.sin(x*.032+z*.044)**2;
      vertices.setY(i,Math.max(-1,ridge*detail-2));
    }
    terrainGeometry.computeVertexNormals();
    const terrain=mesh(terrainGeometry,new T.MeshStandardMaterial({color:0x8b9179,roughness:1}));
    scene.add(terrain);
    const rocks=new T.InstancedMesh(new T.IcosahedronGeometry(1,0),new T.MeshStandardMaterial({color:0x777b69,roughness:1}),42),transform=new T.Object3D();
    for(let i=0;i<42;i++){
      const side=i%2?-1:1;transform.position.set(side*(48+i%7*4),.4,(i*19%160)-80);
      transform.scale.set(1+i%4*.5,.7+i%3*.2,1.6);transform.rotation.set(i*.2,i,0);transform.updateMatrix();rocks.setMatrixAt(i,transform.matrix);
    }
    scene.add(rocks);
  }
  for(const x of [-44,44]) {
    block(scene,metal,x,1.3,-8,2,2.6,78);
    for(let z=-40;z<30;z+=8)block(scene,cyan,x,2.65,z,1.7,.06,3);
  }
  for(const [material,blocks] of staticBlocks){
    const batch=new T.InstancedMesh(box,material,blocks.length),transform=new T.Object3D();
    blocks.forEach((b,i)=>{transform.position.set(b.x,b.y,b.z);transform.scale.set(b.w,b.h,b.d);transform.updateMatrix();batch.setMatrixAt(i,transform.matrix);});
    scene.add(batch);
  }
  const orbit=mesh(new T.TorusGeometry(66,1.5,6,80),new T.MeshBasicMaterial({color:0x4c798e,fog:false}));
  orbit.position.set(55,65,-180);orbit.rotation.set(.3,.5,.6);
  const orbitLight=mesh(new T.TorusGeometry(64.5,.18,4,80),new T.MeshBasicMaterial({color:0x55c4d5,fog:false}));
  orbitLight.position.copy(orbit.position);orbitLight.rotation.copy(orbit.rotation);
  const planet=mesh(new T.SphereGeometry(24,28,20),new T.MeshBasicMaterial({color:0x241827,fog:false}));
  planet.position.set(-100,44,-210);
  const rim=mesh(new T.TorusGeometry(24.2,.7,6,64),new T.MeshBasicMaterial({color:0xf88143,fog:false}));
  rim.position.copy(planet.position);rim.position.z+=1;
  for(const object of [orbit,orbitLight,planet,rim])object.visible=!earth;
  const stars=new Float32Array(280*3);
  for(let i=0;i<280;i++){stars[i*3]=Math.sin(i*18.7)*260;stars[i*3+1]=40+(i*37%130);stars[i*3+2]=-60-(i*29%220);}
  const starGeometry=new T.BufferGeometry();starGeometry.setAttribute('position',new T.BufferAttribute(stars,3));
  const starField=new T.Points(starGeometry,new T.PointsMaterial({color:0xa9d8ef,size:.48,fog:false}));scene.add(starField);starField.visible=!earth;

  const vehicle=new T.Group();scene.add(vehicle);
  const shade=document.createElement('canvas');shade.width=shade.height=64;
  const sh=shade.getContext('2d'),gradient=sh.createRadialGradient(32,32,8,32,32,32);
  gradient.addColorStop(0,'#000000b0');gradient.addColorStop(1,'#00000000');sh.fillStyle=gradient;sh.fillRect(0,0,64,64);
  const shadowTexture=new T.CanvasTexture(shade),shadow=mesh(new T.PlaneGeometry(8,10),new T.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;
  const armor=new T.Shape();
  armor.moveTo(-1.5,-2.8);armor.lineTo(-2,-1.8);armor.lineTo(-1.85,1.65);
  armor.lineTo(-1,3);armor.lineTo(1,3);armor.lineTo(1.85,1.65);armor.lineTo(2,-1.8);armor.lineTo(1.5,-2.8);armor.closePath();
  const hull=mesh(new T.ExtrudeGeometry(armor,{depth:.85,bevelEnabled:true,bevelThickness:.18,bevelSize:.15,bevelSegments:1,steps:1}),metal,vehicle);
  hull.rotation.x=Math.PI/2;hull.position.y=1.9;
  for(const side of [-1,1]){
    block(vehicle,cyan,side*1.45,1.12,1.8,.08,.14,1.2);
    for(let i=0;i<5;i++)block(vehicle,dark,side*.9,1.94,-1.8+i*.25,.95,.05,.07);
  }
  block(vehicle,dark,0,2.05,-.3,2.5,.65,3.2);
  block(vehicle,cyan,0,1.9,2.3,2.3,.08,.15);
  for(const side of [-1,1]) {
    const pod=block(vehicle,earth?dark:metal,side*2.05,1.05,0,1.05,1.1,5);
    pod.rotation.z=side*.1;
    if(era!=='present')block(vehicle,cyan,side*2.05,.52,0,.8,.12,4.4);
    if(earth){
      const wheelGeo=new T.CylinderGeometry(.46,.46,.12,12);
      for(const z of [-1.7,-.85,0,.85,1.7]){const wheel=mesh(wheelGeo,metal,vehicle);wheel.rotation.z=Math.PI/2;wheel.position.set(side*2.6,1.02,z);}
    } else for(const z of [-1.6,0,1.6])block(vehicle,cyan,side*2.59,1.2,z,.06,.25,.45);
  }
  const turret=new T.Group();turret.position.y=2.25;vehicle.add(turret);
  block(turret,metal,0,0,0,1.85,.75,2);
  const ring=mesh(new T.TorusGeometry(.55,.15,8,24),cyan,turret);ring.position.set(0,.06,1.8);
  block(turret,dark,0,0,1.1,1.1,.68,1.6);
  const innerRing=mesh(new T.TorusGeometry(.33,.055,6,24),amber,turret);innerRing.position.set(0,.06,1.85);
  if(earth){block(turret,dark,0,0,2.3,.28,.28,3.2);ring.visible=false;innerRing.visible=false;}
  const flag=document.createElement('canvas');flag.width=128;flag.height=80;
  const f=flag.getContext('2d');f.fillStyle='#c62839';f.fillRect(0,0,128,80);
  f.fillStyle='#fff';f.beginPath();f.arc(48,40,24,0,Math.PI*2);f.fill();f.fillStyle='#c62839';f.beginPath();f.arc(57,36,20,0,Math.PI*2);f.fill();
  f.fillStyle='#fff';f.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?6:15;const x=86+Math.cos(a)*r,y=40+Math.sin(a)*r;if(i)f.lineTo(x,y);else f.moveTo(x,y);}f.closePath();f.fill();
  const flagTexture=new T.CanvasTexture(flag),badge=mesh(new T.PlaneGeometry(.9,.56),new T.MeshBasicMaterial({map:flagTexture}),turret);badge.position.set(0,.01,-1.012);badge.rotation.y=Math.PI;
  const underglow=new T.PointLight(0x31dfd5,1.2,12,2);underglow.position.set(0,.6,0);vehicle.add(underglow);
  const dome=mesh(new T.SphereGeometry(4.2,24,16),new T.MeshBasicMaterial({color:0x41eadf,transparent:true,opacity:.2,wireframe:true,depthWrite:false}));
  const droneMeshes=[];
  for(let i=0;i<4;i++) {
    const drone=new T.Group();scene.add(drone);
    const body=mesh(new T.OctahedronGeometry(1.65,0),metal,drone);body.scale.set(1.5,.55,1);
    block(drone,red,0,0,1.25,1,.25,.12);
    for(const side of [-1,1]){
      block(drone,dark,side*2,0,0,2,.25,1.5);
      const rotor=mesh(new T.TorusGeometry(.7,.06,4,16),red,drone);
      rotor.rotation.x=Math.PI/2;rotor.position.set(side*2.2,.1,0);
    }
    droneMeshes.push(drone);
  }
  const lock=mesh(new T.TorusGeometry(2.7,.07,5,32),cyan);
  const burst=mesh(new T.IcosahedronGeometry(1,1),new T.MeshBasicMaterial({color:0xffb575,wireframe:true,transparent:true}));
  const beamGeometry=new T.BufferGeometry();beamGeometry.setAttribute('position',new T.BufferAttribute(new Float32Array(6),3));
  const beam=new T.Line(beamGeometry,new T.LineBasicMaterial({color:0x6ffff5}));scene.add(beam);
  const threatGeometry=new T.BufferGeometry();threatGeometry.setAttribute('position',new T.BufferAttribute(new Float32Array(6),3));
  const threat=new T.Line(threatGeometry,new T.LineBasicMaterial({color:0xff6489}));scene.add(threat);
  function drawBeam(line,event,time,fromY,toY) {
    line.visible=!!event&&time-event.time<.18;
    if(!line.visible)return;
    const p=line.geometry.attributes.position;
    p.setXYZ(0,event.x,fromY,-event.z);p.setXYZ(1,event.toX,toY,-event.toZ);p.needsUpdate=true;
  }
  let width=0,height=0;
  return {
    quality(){renderer.setPixelRatio(budget.ratio);width=0;},
    render(s,cab) {
      const w=canvas.clientWidth,h=canvas.clientHeight;
      if(!w||!h)return;
      if(w!==width||h!==height){width=w;height=h;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
      vehicle.position.set(s.x,earth?-.5:Math.sin(s.elapsed*2)*.1,-s.z);vehicle.rotation.y=-s.yaw;
      const target=lockedEnemy(s);
      if(target)turret.rotation.y=Math.PI-Math.atan2(target.x-s.x,target.z-s.z)+s.yaw;
      shadow.position.set(s.x,.04,-s.z);shadow.rotation.z=s.yaw;
      const tx=Math.sin(s.yaw),tz=Math.cos(s.yaw);
      if(cab){camera.position.set(s.x+tx*3,3.7,-s.z-tz*3);camera.lookAt(s.x+tx*25,3.2,-s.z-tz*25);}
      else {camera.position.set(s.x-tx*15,8,-s.z+tz*15);camera.lookAt(s.x+tx*10,2,-s.z-tz*10);}
      dome.position.set(s.x,1.8,-s.z);dome.visible=s.elapsed<s.domeUntil;
      dome.rotation.y=s.elapsed*.1;
      s.enemies.forEach((e,i)=>{
        const drone=droneMeshes[i];drone.visible=e.hp>0;
        drone.position.set(e.x,4+Math.sin(s.elapsed*2+e.phase)*.6,-e.z);
        drone.rotation.y=Math.atan2(s.x-e.x,-s.z+e.z);
      });
      for(let i=s.enemies.length;i<droneMeshes.length;i++)droneMeshes[i].visible=false;
      lock.visible=!!target;
      if(target){lock.position.set(target.x,4,-target.z);lock.lookAt(camera.position);lock.rotation.z=s.elapsed*.5;}
      burst.visible=!!s.lastBurst&&s.elapsed-s.lastBurst.time<.7;
      if(burst.visible){
        const age=s.elapsed-s.lastBurst.time;
        burst.position.set(s.lastBurst.x,4,-s.lastBurst.z);burst.scale.setScalar(1+age*10);
        burst.material.opacity=1-age/.7;burst.rotation.set(age,age*2,0);
      }
      drawBeam(beam,s.lastShot,s.elapsed,2.5,4);
      drawBeam(threat,s.lastThreat,s.elapsed,4,2);
      renderer.render(scene,camera);
      canvas.dataset.draws=renderer.info.render.calls;
    },
    close() {
      closed=true;
      const geometries=new Set(),materials=new Set();
      scene.traverse(item=>{if(item.geometry)geometries.add(item.geometry);if(item.material)materials.add(item.material);});
      geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());floorTexture.dispose();flagTexture.dispose();shadowTexture.dispose();soil?.dispose();renderer.dispose();renderer.forceContextLoss();
    }
  };
}
function fallback(canvas,s) {
  const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
  c.fillStyle='#081321';c.fillRect(0,0,w,h);
  const x=n=>(n+70)/140*w,y=n=>(70-n)/140*h;
  c.strokeStyle='#1b4857';
  for(let i=0;i<14;i++){c.beginPath();c.moveTo(i*w/14,0);c.lineTo(i*w/14,h);c.moveTo(0,i*h/14);c.lineTo(w,i*h/14);c.stroke();}
  for(const e of s.enemies)if(e.hp>0){c.fillStyle='#ff638b';c.beginPath();c.arc(x(e.x),y(e.z),7,0,Math.PI*2);c.fill();}
  c.save();c.translate(x(s.x),y(s.z));c.rotate(s.yaw);c.fillStyle='#6ff7ec';
  c.beginPath();c.moveTo(0,-9);c.lineTo(7,7);c.lineTo(-7,7);c.closePath();c.fill();c.restore();
}
export function mountArena(host,s,{save,finish,sound,assist,camera,quality='auto'}) {
  let canvas=host.querySelector('.arena'),view;
  const budget=new FrameBudget(quality,devicePixelRatio);
  try{view=createScene(canvas,s,budget);canvas.dataset.ready='3d';}
  catch {
    canvas.replaceWith(canvas=Object.assign(document.createElement('canvas'),{className:'arena',width:900,height:500}));
    canvas.dataset.ready='map';
  }
  function contextLost(event) {
    event.preventDefault();
    canvas.removeEventListener('webglcontextlost',contextLost);
    view?.close();view=null;
    canvas.replaceWith(canvas=Object.assign(document.createElement('canvas'),{className:'arena',width:900,height:500}));
    canvas.dataset.ready='map';
  }
  canvas.addEventListener('webglcontextlost',contextLost);
  const held=new Set(),mapping={ArrowUp:'go',w:'go',ArrowDown:'back',s:'back',ArrowLeft:'left',a:'left',ArrowRight:'right',d:'right',' ':'fire'};
  const key=event=>{
    if(event.target.closest('input,select')||event.ctrlKey||event.altKey||event.metaKey)return;
    if(mapping[event.key]){event.preventDefault();if(event.type==='keydown')held.add(mapping[event.key]);else held.delete(mapping[event.key]);}
    if(event.type==='keydown'&&!event.repeat&&event.key==='q')activateDome(s);
    if(event.type==='keydown'&&!event.repeat&&event.key==='e')cycleTarget(s);
  };
  window.addEventListener('keydown',key);window.addEventListener('keyup',key);
  const release=()=>held.clear();window.addEventListener('blur',release);
  for(const button of host.querySelectorAll('[data-control]')) {
    button.onpointerdown=event=>{button.setPointerCapture(event.pointerId);held.add(button.dataset.control);sound.activate();};
    button.onpointerup=button.onlostpointercapture=button.onpointercancel=()=>held.delete(button.dataset.control);
  }
  host.querySelector('[data-dome]').onclick=()=>{if(activateDome(s))sound.cue();};
  host.querySelector('[data-target]').onclick=()=>cycleTarget(s);
  const meters=['hull','shield','energy','heat'].map(key=>({key,label:host.querySelector('[data-meter="'+key+'"] b'),bar:host.querySelector('[data-meter="'+key+'"] progress')}));
  const wave=host.querySelector('.wave'),kills=host.querySelector('.kills'),lock=host.querySelector('.lock-status'),domeButton=host.querySelector('[data-dome]'),perf=host.querySelector('[data-perf]');
  const radar=host.querySelector('.sensor-radar'),radarContext=radar.getContext('2d');
  const tick=fixedClock(dt=>stepVehicle(s,held,dt));
  let frame,last=performance.now(),lastHud=0,lastSave=last,lastShots=s.shots;
  function animate(now) {
    const elapsed=Math.max(0,now-last);last=now;
    if(budget.sample(elapsed))view?.quality();
    if(assist())held.add('assist');else held.delete('assist');
    tick(elapsed/1000);
    if(view)view.render(s,camera());else fallback(canvas,s);
    if(s.shots!==lastShots){lastShots=s.shots;sound.cue();}
    if(now-lastHud>100) {
      lastHud=now;
      for(const {key,label,bar} of meters) {
        const value=Math.round(s[key]);
        if(bar.value!==value){label.textContent=value+'%';bar.value=value;}
      }
      const waveLabel=s.wave+' / '+config(s).waves,killsLabel=s.kills+' / '+config(s).waves*config(s).bots;
      if(wave.textContent!==waveLabel)wave.textContent=waveLabel;
      if(kills.textContent!==killsLabel)kills.textContent=killsLabel;
      const target=lockedEnemy(s);
      lock.textContent=target?(canFire(s)?'HEDEF KİLİTLİ':'ENERJİ / MENZİL BEKLENİYOR'):'ALAN TEMİZ';
      domeButton.disabled=s.energy<25||s.elapsed<s.nextDome;
      domeButton.textContent=s.elapsed<s.nextDome?'Koruma '+Math.ceil(s.nextDome-s.elapsed)+' sn':'Koruma · Q';
      perf.textContent=(budget.fps||'…')+' FPS · '+(view?'3B':'HARİTA');
      canvas.dataset.resolution=budget.ratio;canvas.dataset.fps=budget.fps;
      drawRadar(radarContext,s);
      sound.engine(s.speed,0);
    }
    if(now-lastSave>1500){lastSave=now;save();}
    if(s.done){save();finish();return;}
    frame=requestAnimationFrame(animate);
  }
  frame=requestAnimationFrame(animate);
  return ()=>{cancelAnimationFrame(frame);canvas.removeEventListener('webglcontextlost',contextLost);sound.silence();window.removeEventListener('keydown',key);window.removeEventListener('keyup',key);window.removeEventListener('blur',release);view?.close();};
}

function drawRadar(ctx,s) {
  const size=144,center=size/2,scale=.85;
  ctx.clearRect(0,0,size,size);ctx.fillStyle='#061722d9';ctx.fillRect(0,0,size,size);
  ctx.strokeStyle='#28616b';ctx.lineWidth=1;
  for(const r of [22,44,65]){ctx.beginPath();ctx.arc(center,center,r,0,Math.PI*2);ctx.stroke();}
  ctx.beginPath();ctx.moveTo(center,4);ctx.lineTo(center,size-4);ctx.moveTo(4,center);ctx.lineTo(size-4,center);ctx.stroke();
  ctx.save();ctx.translate(center,center);ctx.rotate(-s.yaw);
  for(const e of s.enemies)if(e.hp>0){
    const x=(e.x-s.x)*scale,y=-(e.z-s.z)*scale;
    if(Math.hypot(x,y)>64)continue;
    ctx.fillStyle=e.id===s.target?'#ffcf89':'#ff7195';ctx.fillRect(x-3,y-3,6,6);
  }
  ctx.restore();ctx.fillStyle='#8dfff2';ctx.beginPath();ctx.moveTo(center,center-7);ctx.lineTo(center+5,center+5);ctx.lineTo(center-5,center+5);ctx.fill();
}
