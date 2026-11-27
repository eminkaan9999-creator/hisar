import '../../three.min.js';
import {stepVehicle,lockedEnemy,canFire,activateDome,cycleTarget,config} from './model.mjs';

function createScene(canvas,mission) {
  const eclipse=mission==='eclipse';
  const T=window.THREE;
  const renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  renderer.toneMapping=T.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.15;
  const scene=new T.Scene();
  scene.background=new T.Color(eclipse?0x130b20:0x050b18);
  scene.fog=new T.FogExp2(eclipse?0x1b122c:0x080e20,.006);
  scene.add(new T.HemisphereLight(0xa1d5ff,0x172139,.95));
  const sun=new T.DirectionalLight(eclipse?0xffba99:0x9dd5ff,1.5);
  sun.position.set(-25,60,30);scene.add(sun);
  const camera=new T.PerspectiveCamera(60,1,.1,600);
  const metal=new T.MeshStandardMaterial({color:0x71899b,metalness:.25,roughness:.5});
  const dark=new T.MeshStandardMaterial({color:0x17273b,metalness:.25,roughness:.65});
  const cyan=new T.MeshBasicMaterial({color:0x55f7ee});
  const amber=new T.MeshBasicMaterial({color:0xff9770});
  const red=new T.MeshBasicMaterial({color:0xff567d});
  const box=new T.BoxGeometry(1,1,1);
  function mesh(geometry,material,parent=scene) {
    const item=new T.Mesh(geometry,material);parent.add(item);return item;
  }
  function block(parent,material,x,y,z,w,h,d) {
    const item=mesh(box,material,parent);
    item.position.set(x,y,z);item.scale.set(w,h,d);return item;
  }
  const tile=document.createElement('canvas');tile.width=256;tile.height=256;
  const ink=tile.getContext('2d');
  ink.fillStyle='#112334';ink.fillRect(0,0,256,256);
  let noise=81;
  for(let i=0;i<2800;i++){
    noise=(noise*1664525+1013904223)>>>0;
    const x=noise%256;noise=(noise*1664525+1013904223)>>>0;
    ink.fillStyle=i%2?'#192b3a':'#0c1d2c';ink.fillRect(x,noise%256,2,1);
  }
  ink.strokeStyle='#365368';ink.lineWidth=3;ink.strokeRect(5,5,246,246);
  ink.strokeStyle='#081420';ink.lineWidth=2;ink.strokeRect(9,9,238,238);
  for(const x of [17,239])for(const y of [17,239]){ink.fillStyle='#547480';ink.fillRect(x-2,y-2,4,4);}
  const floorTexture=new T.CanvasTexture(tile);
  floorTexture.wrapS=floorTexture.wrapT=T.RepeatWrapping;floorTexture.repeat.set(24,24);
  floorTexture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
  const ground=mesh(new T.PlaneGeometry(190,190),new T.MeshStandardMaterial({map:floorTexture,color:0x8295a6,roughness:.8,metalness:.15}));
  ground.rotation.x=-Math.PI/2;
  const grid=new T.GridHelper(180,36,0x26727c,0x183444);grid.position.y=.025;scene.add(grid);
  for(let i=0;i<24;i++) {
    const side=i%2?-1:1,x=side*(57+(i%3)*8),z=(Math.floor(i/2)-5)*13;
    const height=8+(i*17%25);
    block(scene,dark,x,height/2,z,8,height,9);
    block(scene,cyan,x-side*4.02,height*.58,z, .08,height*.65,.25);
    block(scene,metal,x,height+1,z,10,2,11);
  }
  for(const x of [-44,44]) {
    block(scene,metal,x,1.3,-8,2,2.6,78);
    for(let z=-40;z<30;z+=8)block(scene,cyan,x,2.65,z,1.7,.06,3);
  }
  const orbit=mesh(new T.TorusGeometry(66,1.5,6,80),new T.MeshBasicMaterial({color:0x4c798e,fog:false}));
  orbit.position.set(55,65,-180);orbit.rotation.set(.3,.5,.6);
  const orbitLight=mesh(new T.TorusGeometry(64.5,.18,4,80),new T.MeshBasicMaterial({color:0x55c4d5,fog:false}));
  orbitLight.position.copy(orbit.position);orbitLight.rotation.copy(orbit.rotation);
  const planet=mesh(new T.SphereGeometry(24,28,20),new T.MeshBasicMaterial({color:0x241827,fog:false}));
  planet.position.set(-100,44,-210);
  const rim=mesh(new T.TorusGeometry(24.2,.7,6,64),new T.MeshBasicMaterial({color:0xf88143,fog:false}));
  rim.position.copy(planet.position);rim.position.z+=1;
  const stars=new Float32Array(280*3);
  for(let i=0;i<280;i++){stars[i*3]=Math.sin(i*18.7)*260;stars[i*3+1]=40+(i*37%130);stars[i*3+2]=-60-(i*29%220);}
  const starGeometry=new T.BufferGeometry();starGeometry.setAttribute('position',new T.BufferAttribute(stars,3));
  scene.add(new T.Points(starGeometry,new T.PointsMaterial({color:0xa9d8ef,size:.48,fog:false})));

  const vehicle=new T.Group();scene.add(vehicle);
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
    const pod=block(vehicle,metal,side*2.05,1.05,0,1.05,1.1,5);
    pod.rotation.z=side*.1;
    block(vehicle,cyan,side*2.05,.52,0,.8,.12,4.4);
    for(const z of [-1.6,0,1.6])block(vehicle,cyan,side*2.59,1.2,z,.06,.25,.45);
  }
  const turret=new T.Group();turret.position.y=2.25;vehicle.add(turret);
  block(turret,metal,0,0,0,1.85,.75,2);
  const ring=mesh(new T.TorusGeometry(.55,.15,8,24),cyan,turret);ring.position.set(0,.06,1.8);
  block(turret,dark,0,0,1.1,1.1,.68,1.6);
  const innerRing=mesh(new T.TorusGeometry(.33,.055,6,24),amber,turret);innerRing.position.set(0,.06,1.85);
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
    render(s,cab) {
      const w=canvas.clientWidth,h=canvas.clientHeight;
      if(!w||!h)return;
      if(w!==width||h!==height){width=w;height=h;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
      vehicle.position.set(s.x,Math.sin(s.elapsed*2)*.1,-s.z);vehicle.rotation.y=-s.yaw;
      const target=lockedEnemy(s);
      if(target)turret.rotation.y=-Math.atan2(target.x-s.x,target.z-s.z)+s.yaw;
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
    },
    close() {
      const geometries=new Set(),materials=new Set();
      scene.traverse(item=>{if(item.geometry)geometries.add(item.geometry);if(item.material)materials.add(item.material);});
      geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());floorTexture.dispose();renderer.dispose();renderer.forceContextLoss();
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
export function mountArena(host,s,{save,finish,sound,assist,camera}) {
  let canvas=host.querySelector('.arena'),view;
  try{view=createScene(canvas,s.mission);canvas.dataset.ready='3d';}
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
  let frame,last=performance.now(),lastHud=0,lastSave=last,lastShots=s.shots;
  function animate(now) {
    const dt=Math.min((now-last)/1000,.06);last=now;
    if(assist())held.add('assist');else held.delete('assist');
    stepVehicle(s,held,dt);
    if(view)view.render(s,camera());else fallback(canvas,s);
    if(s.shots!==lastShots){lastShots=s.shots;sound.cue();}
    if(now-lastHud>100) {
      lastHud=now;
      for(const value of ['hull','shield','energy','heat']) {
        const element=host.querySelector('[data-meter="'+value+'"]');
        element.querySelector('b').textContent=Math.round(s[value])+'%';
        element.querySelector('progress').value=s[value];
      }
      host.querySelector('.wave').textContent=s.wave+' / '+config(s).waves;
      host.querySelector('.kills').textContent=s.kills+' / '+config(s).waves*config(s).bots;
      const target=lockedEnemy(s);
      host.querySelector('.lock-status').textContent=target?(canFire(s)?'HEDEF KİLİTLİ':'ENERJİ / MENZİL BEKLENİYOR'):'ALAN TEMİZ';
      host.querySelector('[data-dome]').disabled=s.energy<25||s.elapsed<s.nextDome;
      host.querySelector('[data-dome]').textContent=s.elapsed<s.nextDome?'Kalkan '+Math.ceil(s.nextDome-s.elapsed)+' sn':'Kalkan · Q';
      sound.engine(s.speed,0);
    }
    if(now-lastSave>1500){lastSave=now;save();}
    if(s.done){save();finish();return;}
    frame=requestAnimationFrame(animate);
  }
  frame=requestAnimationFrame(animate);
  return ()=>{cancelAnimationFrame(frame);canvas.removeEventListener('webglcontextlost',contextLost);sound.silence();window.removeEventListener('keydown',key);window.removeEventListener('keyup',key);window.removeEventListener('blur',release);view?.close();};
}
