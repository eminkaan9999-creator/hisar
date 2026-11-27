import '../three.min.js';
import '../experience/model.js';
import {stops,stopDistance,routes,needsRoute,routePoint,passMarker} from '../komuta/ortak/senaryo.mjs';

const road=[[0,0],[-13,32],[-41,65],[-46,96],[-16,118],[12,134],[58,150],[52,100],[33,52],[0,0]];
const ridge=[[stops[1].x,stops[1].z],...routes.ridge.points,[stops[2].x,stops[2].z]];
const roads=[road,ridge];
const buildings=stops.map((p,i)=>({x:p.x+[-13,-14,15][i],z:p.z+[1,0,0][i]}));
const clamp=(x,min,max)=>Math.max(min,Math.min(max,x));
function roadGap(x,z){
  let best=Infinity;for(const path of roads)for(let i=1;i<path.length;i++){
    const [a,b]=path[i-1],[c,d]=path[i],u=clamp(((x-a)*(c-a)+(z-b)*(d-b))/((c-a)**2+(d-b)**2),0,1);
    best=Math.min(best,Math.hypot(x-a-u*(c-a),z-b-u*(d-b)));
  }return best;
}
const legs=road.slice(1).map(([x,z],i)=>Math.hypot(x-road[i][0],z-road[i][1]));
const mile=[0];for(const leg of legs)mile.push(mile.at(-1)+leg);
function guide(s){
  const total=mile.at(-1),destination=mile[[0,3,6][s.target]];
  let nearest=Infinity,at=0;
  legs.forEach((len,i)=>{const [x,z]=road[i],[bx,bz]=road[i+1];
    const u=clamp(((s.x-x)*(bx-x)+(s.z-z)*(bz-z))/(len*len),0,1),d=Math.hypot(s.x-x-u*(bx-x),s.z-z-u*(bz-z));
    if(d<nearest){nearest=d;at=mile[i]+u*len;}
  });
  const forward=(destination-at+total)%total,delta=forward<total/2?forward:forward-total;
  const look=(at+Math.sign(delta)*Math.min(Math.abs(delta),10)+total)%total;
  const i=Math.max(0,legs.findIndex((_,i)=>look<mile[i+1])),u=(look-mile[i])/legs[i];
  return {x:road[i][0]+(road[i+1][0]-road[i][0])*u,z:road[i][1]+(road[i+1][1]-road[i][1])*u};
}
const ground=(x,z)=>2.3*Math.sin(z/37)+1.2*Math.sin(x/25+z/53)+.8*Math.cos(x/23);
export function drive(s,speed,keys,dt,assist){
  if(needsRoute(s))return 0;
  const marker=routePoint(s),target=marker?{x:marker[0],z:marker[1]}:stops[s.target];
  const gap=Math.hypot(target.x-s.x,target.z-s.z),onCrossing=s.receipts.length===1&&!!s.passage;
  const roadSpeed=onCrossing&&s.passage.route==='creek'?9:roadGap(s.x,s.z)<7?19:13;
  const steer=Number(keys.has('right'))-Number(keys.has('left')),gas=keys.has('go'),reverse=keys.has('back');
  const desired=gas?roadSpeed:reverse?-8:0,rate=gas?9:reverse?15:20;
  speed+=clamp(desired-speed,-rate*dt,rate*dt);
  if(steer)s.yaw+=steer*(speed<-.5?-1:1)*dt*1.65;
  else if(assist&&gas&&gap>2){
    const aim=onCrossing||gap<13?target:guide(s);
    const targetAngle=Math.atan2(aim.x-s.x,aim.z-s.z);
    const diff=Math.atan2(Math.sin(targetAngle-s.yaw),Math.cos(targetAngle-s.yaw));
    s.yaw+=clamp(diff,-dt*1.65,dt*1.65);
    if(!marker&&gap<16)speed=Math.min(speed,Math.max(0,gap-3));
  }
  const x=clamp(s.x+Math.sin(s.yaw)*speed*dt,-110,112),z=clamp(s.z+Math.cos(s.yaw)*speed*dt,-37,192);
  if(buildings.some(p=>Math.abs(x-p.x)<4.4&&Math.abs(z-p.z)<3.4)){s.elapsed+=dt;return 0;}
  s.distance+=Math.hypot(x-s.x,z-s.z);s.elapsed+=dt;s.x=x;s.z=z;
  passMarker(s);return speed;
}
const mapX=x=>(x+112)/228, mapY=z=>(185-z)/222;
export function drawMap(canvas,state,labels=false){
  const ctx=canvas.getContext('2d');if(!ctx)return;
  const w=canvas.width,h=canvas.height,X=x=>mapX(x)*w,Y=z=>mapY(z)*h;
  ctx.fillStyle='#152d36';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#28424b';ctx.lineWidth=1;
  for(let x=0;x<w;x+=24){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}
  for(let y=0;y<h;y+=24){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
  ctx.lineJoin='round';ctx.beginPath();road.forEach(([x,z],i)=>i?ctx.lineTo(X(x),Y(z)):ctx.moveTo(X(x),Y(z)));ctx.strokeStyle='#6e8588';ctx.lineWidth=3;ctx.stroke();
  const line=(points,color,width)=>{ctx.beginPath();points.forEach(([x,z],i)=>i?ctx.lineTo(X(x),Y(z)):ctx.moveTo(X(x),Y(z)));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();};
  line(ridge,'#69898c',2);
  if(state.receipts.length===1){
    for(const [key,route] of Object.entries(routes)){
      if(state.passage&&state.passage.route!==key)continue;
      line([[stops[1].x,stops[1].z],...route.points,[stops[2].x,stops[2].z]],route.color,3);
    }
    const point=routePoint(state);if(point){ctx.fillStyle='#fff';ctx.fillRect(X(point[0])-3,Y(point[1])-3,6,6);}
  }
  stops.forEach((p,i)=>{ctx.beginPath();ctx.arc(X(p.x),Y(p.z),i===state.target?7:4,0,Math.PI*2);ctx.fillStyle=i===state.target?'#efbc70':'#83b5b6';ctx.fill();});
  if(labels){
    ctx.font='600 16px system-ui';ctx.textBaseline='bottom';
    for(const p of stops){ctx.lineWidth=4;ctx.strokeStyle='#152d36';ctx.strokeText(p.short,X(p.x)+9,Y(p.z)-2);ctx.fillStyle='#e6f1ef';ctx.fillText(p.short,X(p.x)+9,Y(p.z)-2);}
    ctx.textAlign='right';ctx.fillStyle='#c3dbda';ctx.fillText('K ↑',w-12,26);ctx.textAlign='left';
  }
  ctx.save();ctx.translate(X(state.x),Y(state.z));ctx.rotate(state.yaw);ctx.fillStyle='#75f2d9';ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(5,6);ctx.lineTo(0,3);ctx.lineTo(-5,6);ctx.closePath();ctx.fill();ctx.restore();
}
function worldView(canvas){
  const T=window.THREE;if(!T)throw Error('3D kullanılamıyor');
  const renderer=new T.WebGLRenderer({canvas,antialias:false,alpha:false,powerPreference:'low-power'});
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.92;
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
  const scene=new T.Scene();scene.background=new T.Color(0xadc4d2);scene.fog=new T.FogExp2(0xc3d1d3,.0048);
  const cam=new T.PerspectiveCamera(58,1,.2,900),sun=new T.DirectionalLight(0xffdeb1,1.35);
  sun.position.set(-90,100,40);scene.add(new T.HemisphereLight(0xe1f0ff,0x465b61,1.1),sun);
  const mat=(color)=>new T.MeshLambertMaterial({color,flatShading:true});
  const mesh=(geom,material,x,y,z,parent=scene)=>{const m=new T.Mesh(geom,material);m.position.set(x,y,-z);parent.add(m);return m;};
  const skyTexture=new T.TextureLoader().load(new URL('../assets/tex/sky_kapali.jpg',import.meta.url).href);
  const sky=new T.Mesh(new T.SphereGeometry(700,32,16),new T.MeshBasicMaterial({map:skyTexture,side:T.BackSide,fog:false}));scene.add(sky);
  const terrain=new T.PlaneGeometry(700,700,64,64);terrain.rotateX(-Math.PI/2);
  const pts=terrain.attributes.position;
  for(let i=0;i<pts.count;i++)pts.setY(i,ground(pts.getX(i),-pts.getZ(i)));
  terrain.computeVertexNormals();
  const snow=new T.TextureLoader().load(new URL('../assets/tex/t_tas.jpg',import.meta.url).href);
  snow.wrapS=snow.wrapT=T.RepeatWrapping;snow.repeat.set(60,60);
  const groundMat=mat(0xc3cfd5);groundMat.map=snow;groundMat.emissive.setHex(0x45525b);mesh(terrain,groundMat,0,0,0);
  const strip=[],ind=[];
  for(const path of roads)for(let i=1;i<path.length;i++){
    const [x,z]=path[i-1],[x1,z1]=path[i],n=Math.ceil(Math.hypot(x1-x,z1-z)/3);
    const angle=Math.atan2(x1-x,z1-z),dx=Math.cos(angle)*3.8,dz=-Math.sin(angle)*3.8;
    for(let j=0;j<=n;j++){
      const a=x+(x1-x)*j/n,b=z+(z1-z)*j/n,k=strip.length/3;
      strip.push(a-dx,ground(a-dx,b-dz)+.18,-b+dz,a+dx,ground(a+dx,b+dz)+.18,-b-dz);
      if(j>0)ind.push(k-2,k-1,k,k,k-1,k+1);
    }
  }
  const rg=new T.BufferGeometry();rg.setAttribute('position',new T.Float32BufferAttribute(strip,3));rg.setIndex(ind);rg.computeVertexNormals();
  const gravel=new T.MeshBasicMaterial({color:0x89949b});gravel.side=T.DoubleSide;mesh(rg,gravel,0,0,0);
  let seed=42;function random(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
  const trees=[],dummy=new T.Object3D();
  for(let i=0;i<235;i++){const x=random()*310-155,z=random()*305-64;if(roadGap(x,z)>12&&stops.every(p=>Math.hypot(p.x-x,p.z-z)>16))trees.push([x,z,3+random()*5]);}
  const forestTexture=new T.TextureLoader().load(new URL('../assets/tex/zeytin_uzak.png',import.meta.url).href);
  const foliage=window.HisarModel.geometry(window.HisarModel.core.treeCard(.62,1));
  const leaves=new T.MeshLambertMaterial({map:forestTexture,alphaTest:.42,color:0xc3cfc4,side:T.DoubleSide});
  const forest=new T.InstancedMesh(foliage,leaves,trees.length);
  trees.forEach(([x,z,h],i)=>{dummy.position.set(x,ground(x,z),-z);dummy.rotation.y=i*2.4;dummy.scale.setScalar(h);dummy.updateMatrix();forest.setMatrixAt(i,dummy.matrix);});scene.add(forest);
  const box=new T.BoxGeometry(1,1,1);
  const block=(parent,color,x,y,z,w,h,d)=>{const m=mesh(box,mat(color),x,y,z,parent);m.scale.set(w,h,d);return m;};
  // Reflective posts identify each pass even when the next ground ring is out of sight.
  for(const r of Object.values(routes)){
    for(const [x,z] of r.points){
      for(const side of [-1,1]){
        const px=x+side*5,y=ground(px,z);block(scene,0x455e61,px,y+1.05,z,.18,2.1,.18);
        block(scene,r.color,px,y+1.9,z,.32,.48,.32);
      }
    }
  }
  buildings.forEach((p,i)=>{const g=new T.Group();g.position.set(p.x,ground(p.x,p.z),-p.z);scene.add(g);block(g,0x6f8585,0,1.5,0,6,3,4);block(g,0xc7d5d7,0,3.2,0,7,.45,5);block(g,0xffce7c,-2,1.55,2.04,1.2,1.1,.08);block(g,0x456569,1,1,2.04,1.3,2,.08);if(i===0)block(g,0x9b7045,-4,.6,-3,2,1.2,2);});
  const vehicle=new T.Group();scene.add(vehicle);
  block(vehicle,0x314646,0,1.03,0,2.4,1.1,4.5);block(vehicle,0x517270,0,2.05,1.05,2.18,1.08,1.65);
  block(vehicle,0x263f4c,0,2.2,1.9,1.78,.58,.08);block(vehicle,0x587273,0,2,-.99,2.28,1.05,2.35);
  block(vehicle,0xe79c48,0,2.73,1.06,.36,.27,.35);
  for(const side of [-1,1]){block(vehicle,0x263437,side*1.23,.62,0,.56,.89,4.65);block(vehicle,0xffd1a1,side*.85,1.18,2.29,.39,.25,.09);
    for(let i=-1;i<=1;i++)block(vehicle,0x425759,side*1.52,.58,i*1.25,.13,.47,.82);}
  const tyre=mat(0x29383a),hub=mat(0x536763),wheel=new T.CylinderGeometry(.46,.46,.16,12),cap=new T.CylinderGeometry(.2,.2,.18,10);
  for(const side of [-1,1]){
    for(let i=0;i<5;i++){const z=-1.65+i*.83;mesh(wheel,tyre,side*1.51,.6,z,vehicle).rotation.z=Math.PI/2;mesh(cap,hub,side*1.55,.6,z,vehicle).rotation.z=Math.PI/2;}
    block(vehicle,0x243e4b,side*1.1,2.1,1.1,.04,.49,1.05);block(vehicle,0xa9472e,side*.91,1.04,-2.27,.28,.18,.09);
  }
  for(const z of [-1.95,-1.35,-.75,-.18])block(vehicle,0x324b50,0,2.53,z,2.3,.09,.09);
  const shadow=new T.Mesh(new T.CircleGeometry(1,22),new T.MeshBasicMaterial({color:0x41545a,transparent:true,opacity:.26,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.scale.set(2.1,3.8,1);vehicle.add(shadow);shadow.position.y=.14;
  let closed=false,truckTexture;
  const models=window.HisarModel;
  if(models)models.load(new URL('../assets/mdl/kamyon.bin',import.meta.url)).then(d=>{
    if(closed)return;
    truckTexture=models.texture(new URL('../assets/tex/kamyon_col.jpg',import.meta.url).href);
    const actual=new T.Mesh(models.geometry(d),new T.MeshLambertMaterial({map:truckTexture,color:0xdce8e4}));
    actual.scale.setScalar(6.4);actual.rotation.y=Math.PI;
    for(const child of vehicle.children)child.visible=child===shadow;
    vehicle.add(actual);
  }).catch(()=>{});
  const marker=mesh(new T.TorusGeometry(2,.16,8,36),new T.MeshBasicMaterial({color:0xffb94e}),0,0,0);marker.rotation.x=-Math.PI/2;
  let lastW=0,lastH=0;
  function render(s){const w=canvas.clientWidth,h=canvas.clientHeight;if(w<1||h<1)return;
    if(w!==lastW||h!==lastH){renderer.setSize(w,h,false);lastW=w;lastH=h;cam.aspect=w/h;cam.updateProjectionMatrix();}
    const y=ground(s.x,s.z);vehicle.position.set(s.x,y,-s.z);vehicle.rotation.y=-s.yaw;
    vehicle.rotation.x=Math.atan2(ground(s.x+Math.sin(s.yaw),s.z+Math.cos(s.yaw))-ground(s.x-Math.sin(s.yaw),s.z-Math.cos(s.yaw)),2);
    const tx=Math.sin(s.yaw),tz=Math.cos(s.yaw),p=stops[s.target],gate=routePoint(s);
    const [mx,mz]=gate||[p.x,p.z];marker.position.set(mx,ground(mx,mz)+.45,-mz);
    marker.material.color.setHex(gate?0x65ded2:0xffb94e);
    scene.fog.density=s.receipts.length===1&&s.passage?.route==='creek'?.025:.0048;
    cam.position.set(s.x-tx*10+tz*2,y+4.5,-s.z+tz*10+tx*2);cam.lookAt(s.x+tx*5,y+1.4,-s.z-tz*5);
    renderer.render(scene,cam);
  }
  return {render,close(){closed=true;const geometries=new Set(),materials=new Set();scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);if(o.isInstancedMesh)o.dispose?.();});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());truckTexture?.dispose();forestTexture.dispose();snow.dispose();skyTexture.dispose();renderer.dispose();renderer.forceContextLoss();}};
}
export function attachDrive(host,s,{assist,save,onAction}){
  let canvas=host.querySelector('.terrain'),view=null;
  const map=host.querySelector('.minimap'),keys=new Set(),mapped={ArrowUp:'go',w:'go',ArrowDown:'back',s:'back',ArrowLeft:'left',a:'left',ArrowRight:'right',d:'right'};
  function fallback(){canvas.replaceWith(canvas=Object.assign(document.createElement('canvas'),{className:'terrain',width:650,height:300}));canvas.setAttribute('aria-label','Vadi yol haritası');view=null;}
  try{view=worldView(canvas);}catch{fallback();}
  const lost=e=>{e.preventDefault();fallback();};canvas.addEventListener('webglcontextlost',lost);
  const key=e=>{if(dialog.open||e.target?.closest?.('select,input,textarea')||e.ctrlKey||e.altKey||e.metaKey||!Object.hasOwn(mapped,e.key))return;e.preventDefault();if(e.type==='keydown')keys.add(mapped[e.key]);else keys.delete(mapped[e.key]);};
  const dialog=host.querySelector('.map-dialog'),openMap=host.querySelector('.map-toggle');
  openMap.onclick=()=>{
    keys.clear();dialog.showModal();drawMap(dialog.querySelector('canvas'),s,true);
    dialog.querySelector('.map-status').textContent=s.receipts.length===1&&s.passage?routes[s.passage.route].name+' · '+stops[s.target].name:needsRoute(s)?'İki yol seçeneği açık.':stops[s.target].name;
  };
  dialog.querySelector('.close-map').onclick=()=>dialog.close();
  const release=()=>keys.clear();window.addEventListener('keydown',key);window.addEventListener('keyup',key);window.addEventListener('blur',release);
  for(const b of host.querySelectorAll('[data-drive]')){b.onpointerdown=e=>{b.setPointerCapture(e.pointerId);keys.add(b.dataset.drive);};b.onlostpointercapture=b.onpointerup=b.onpointercancel=()=>keys.delete(b.dataset.drive);}
  let id,speed=0,last=performance.now(),lastHud=-1000,lastSave=last;
  const progressEl=host.querySelector('.road-progress'),speedEl=host.querySelector('.speed'),distance=host.querySelector('.distance'),button=host.querySelector('.deliver'),bearing=host.querySelector('.bearing');
  function frame(now){
    const dt=clamp((now-last)/1000,0,.08);last=now;
    if(dialog.open){id=requestAnimationFrame(frame);return;}
    speed=drive(s,speed,keys,dt,assist());
    if(view)view.render(s);else drawMap(canvas,s);
    if(!canvas.dataset.ready){canvas.dataset.ready=view?'3d':'map';host.querySelector('.scene-load')?.remove();}
    if(now-lastHud>=100){lastHud=now;drawMap(map,s);const gap=stopDistance(s),p=stops[s.target],gate=routePoint(s),[x,z]=gate||[p.x,p.z];
      const route=s.receipts.length===1&&s.passage?routes[s.passage.route]:null;
      progressEl.textContent=route?(gate?route.name+' · İşaret '+(s.passage.step+1)+'/'+route.points.length:route.name+' · Teslim noktası'):'';
      progressEl.hidden=!route;
      speedEl.textContent=Math.round(Math.abs(speed)*3.6)+' km/sa';distance.textContent=Math.round(Math.hypot(x-s.x,z-s.z))+' m';
      bearing.style.transform='rotate('+(Math.atan2(x-s.x,z-s.z)-s.yaw)+'rad)';button.disabled=needsRoute(s)||!!gate||gap>9||Math.abs(speed)>1||(!s.loaded&&(!s.crewChecked||!s.loadChecked));}
    if(now-lastSave>=2000){lastSave=now;save();}
    id=requestAnimationFrame(frame);
  }
  button.onclick=()=>onAction(speed);
  id=requestAnimationFrame(frame);
  return ()=>{cancelAnimationFrame(id);canvas.removeEventListener('webglcontextlost',lost);window.removeEventListener('keydown',key);window.removeEventListener('keyup',key);window.removeEventListener('blur',release);view?.close();};
}
