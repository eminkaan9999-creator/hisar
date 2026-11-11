/* One visible drone controller and one procedural model used by both existing scenes. */
(function(root){'use strict';
const C=root.HisarKurulusCore;let host=null;
try{if(root.parent!==root&&root.parent.location.origin===root.location.origin)host=root.parent.HisarCampaignHost;}catch{}
if(!C||!host||new URLSearchParams(location.search).get('kurulus')!=='1')return;
const clean=fn=>{try{return fn();}catch{return null;}};
function model(T){
 const THREE=T;
 const M=color=>new T.MeshStandardMaterial({color,roughness:.62,metalness:.3});
 function bx(g,w,h,d,m,x,y,z){const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x||0,y||0,z||0);g.add(o);return o;}
 function cy(g,a,b,h,m,x,y,z,rx){const o=new T.Mesh(new T.CylinderGeometry(a,b,h,12),m);o.position.set(x||0,y||0,z||0);if(rx)o.rotation.x=rx;g.add(o);return o;}
function build(){
 const g=new THREE.Group(),SH=M(0x30363b),DK=M(0x1b1f22),AR=M(0x24282c),GR=M(0x6a7077),PR=M(0x15181a),rot=[];
 bx(g,.62,.2,1,SH,0,.05,0);bx(g,.5,.14,.9,DK,0,-.1,0);bx(g,.4,.1,.5,GR,0,.2,-.15);bx(g,.5,.16,.35,SH,0,0,.62).rotation.x=.25;
 cy(g,.02,.02,.7,DK,.18,.35,-.55,-.5);cy(g,.02,.02,.7,DK,-.18,.35,-.55,-.5);
 const gb=new THREE.Mesh(new THREE.SphereGeometry(.17,12,10),DK);gb.position.set(0,-.2,.5);g.add(gb);cy(g,.07,.07,.1,new THREE.MeshBasicMaterial({color:0x3fa9d6}),0,-.2,.65,Math.PI/2);
 for(const[x,z]of[[-1.05,-1.05],[1.05,-1.05],[-1.05,1.05],[1.05,1.05]]){
  bx(g,.12,.08,Math.hypot(x,z),AR,x/2,.03,z/2).rotation.y=Math.atan2(x,z);cy(g,.14,.14,.22,DK,x,.12,z);
  cy(g,.03,.03,.45,DK,x*.8,-.2,z*.8);bx(g,.1,.03,.35,DK,x*.8,-.42,z*.8);
  const led=new THREE.Mesh(new THREE.SphereGeometry(.05,6,5),new THREE.MeshBasicMaterial({color:z>0?0x30ff60:0xff2a2a}));led.position.set(x*.92,.06,z*.92);g.add(led);
  const r=new THREE.Group();r.position.set(x,.26,z);g.add(r);bx(r,1.5,.015,.1,PR,0,0,0);cy(r,.05,.05,.05,GR,0,0,0);
  const dk=cy(r,.76,.76,.004,GR,0,0,0);dk.material=new THREE.MeshBasicMaterial({color:0xaab0b8,transparent:true,opacity:.1});rot.push(r)}
 cy(g,.09,.09,.55,M(0x4a5a3a),0,-.28,-.1,Math.PI/2);bx(g,.2,.02,.12,DK,0,-.28,-.35);bx(g,.02,.2,.12,DK,0,-.28,-.35);
 g.userData.rot=rot;return g}
 const g=build();g.name='UCANGOZ-1-SHARED';return g;
}
function mount(a){if(root.HisarKurulusSession)return root.HisarKurulusSession;
 document.documentElement.classList.add('kurulus-scene');if(host.chapter().mode==='free')document.documentElement.classList.add('kurulus-free');let drone=C.copy(host.snapshot().drone),timer=0,ready=false,paused=false,ending=false,cameraDefaults=null;
 const input={x:0,z:0,lookX:0,lookY:0,up:0,slow:false},held={},sticks=[];
 const panel=document.createElement('div');panel.id='kurulus-drone';panel.innerHTML='<div class="kd-toolbar"><strong>Uçangöz</strong><span id="kd-status"></span><button data-kd="launch">KALDIR</button><button data-kd="return">GERİ ÇAĞIR</button><button data-kd="view">KAMERA</button><button data-kd="down">AŞAĞI BAK</button><button data-kd="zoom">1×</button><button data-kd="actions" hidden>İŞLEVLER</button></div><div class="kd-actions" hidden></div><div class="kd-reticle" aria-hidden="true"><i></i><b></b></div><div class="kd-flight"><div class="kd-stick" data-stick="move" aria-label="Uçuş kumandası"><i></i><span>UÇUŞ</span></div><div class="kd-alt"><button data-rise="1" aria-label="Yüksel">YÜKSEL</button><button data-rise="-1" aria-label="Alçal">ALÇAL</button></div><div class="kd-stick" data-stick="look" aria-label="Kamera kumandası"><i></i><span>KAMERA</span></div></div>';
 document.body.appendChild(panel);
 const actionMenu=panel.querySelector('.kd-actions');
 for(const item of a.actions?.()||[]){const b=document.createElement('button');b.type='button';b.textContent=item.label;b.onclick=()=>{if(!paused&&drone.flight.status==='airborne')a.action?.(item.id);actionMenu.hidden=true;};actionMenu.appendChild(b);}
 const say=t=>host.goal(t);
 function flush(){host.drone(C.copy(drone));paint();}
 function release(){if(actionMenu)actionMenu.hidden=true;for(const k of Object.keys(held))delete held[k];input.x=input.z=input.lookX=input.lookY=input.up=0;for(const s of sticks){s.pid=null;s.knob.style.transform='translate(-50%,-50%)';}clean(()=>a.release?.());}
 function start(){if(paused)return false;const r=C.launch({...host.snapshot(),drone},a.scene,a.origin());if(!r.ok){say('Uçangöz hazır değil. Üste bakım yap veya mevcut uçuşa dön.');return false;}const previous=drone;drone=r.state.drone;release();if(a.launch(drone)===false){drone=previous;say('Önce aracı durdur ve uçuş için hazır ol.');return false;}flush();return true;}
 function recall(){if(drone.flight.status==='docked')return false;drone.flight.status='returning';release();flush();return true;}
 for(const b of panel.querySelectorAll('[data-kd]'))b.onclick=()=>{const k=b.dataset.kd;if(k==='actions'){actionMenu.hidden=!actionMenu.hidden;return;}if(k==='launch')start();if(k==='return')recall();if(k==='view'){const modes=['fpv','follow','down'];drone.camera.view=modes[(modes.indexOf(drone.camera.view)+1)%3];}if(k==='down'){drone.camera.view='down';drone.camera.pitch=-1.5;}if(k==='zoom')drone.camera.zoom=drone.camera.zoom>=3?1:drone.camera.zoom+1;flush();};
 for(const el of panel.querySelectorAll('[data-stick]')){
  const s={el,knob:el.querySelector('i'),pid:null};sticks.push(s);
  const set=e=>{const r=el.getBoundingClientRect(),rad=r.width*.34,dx=(e.clientX-r.left-r.width/2)/rad,dy=(e.clientY-r.top-r.height/2)/rad,len=Math.max(1,Math.hypot(dx,dy)),x=dx/len,y=dy/len;s.knob.style.transform=`translate(calc(-50% + ${x*rad}px),calc(-50% + ${y*rad}px))`;if(el.dataset.stick==='move'){input.x=x;input.z=-y;}else{input.lookX=x;input.lookY=y;}};
  el.onpointerdown=e=>{if(s.pid!==null)return;e.preventDefault();e.stopPropagation();s.pid=e.pointerId;el.setPointerCapture(e.pointerId);set(e);};el.onpointermove=e=>{if(e.pointerId===s.pid){e.preventDefault();set(e);}};
  const end=e=>{if(e.pointerId!==s.pid)return;s.pid=null;if(el.dataset.stick==='move'){input.x=input.z=0;}else{input.lookX=input.lookY=0;}s.knob.style.transform='translate(-50%,-50%)';};el.onpointerup=end;el.onpointercancel=end;el.onlostpointercapture=end;
 }
 for(const b of panel.querySelectorAll('[data-rise]')){b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);input.up=+b.dataset.rise;};for(const t of['pointerup','pointercancel','lostpointercapture'])b.addEventListener(t,()=>input.up=0);}
 root.addEventListener('keydown',e=>{if(drone.flight.status==='docked'||/input|select|textarea/i.test(e.target.tagName))return;if(['KeyW','KeyA','KeyS','KeyD','KeyQ','KeyE','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space'].includes(e.code)){held[e.code]=1;e.preventDefault();e.stopImmediatePropagation();}},true);
 root.addEventListener('keyup',e=>{delete held[e.code];},true);root.addEventListener('blur',release);document.addEventListener('visibilitychange',()=>{if(document.hidden){release();flush();}});root.addEventListener('pagehide',flush);
 function paint(){const f=drone.flight,flying=f.status!=='docked';panel.classList.toggle('kd-on',flying);document.documentElement.classList.toggle('kurulus-flying',flying);panel.querySelector('[data-kd="launch"]').hidden=flying;panel.querySelector('[data-kd="return"]').hidden=!flying;panel.querySelector('[data-kd="actions"]').hidden=!flying||!actionMenu.children.length;if(!flying)actionMenu.hidden=true;for(const b of panel.querySelectorAll('[data-kd="view"],[data-kd="down"],[data-kd="zoom"]'))b.hidden=!flying;panel.querySelector('[data-kd="zoom"]').textContent=drone.camera.zoom+'×';panel.querySelector('#kd-status').textContent='%'+Math.round(drone.battery)+(flying?' · '+Math.round(Math.max(0,f.pos.y-a.ground(f.pos.x,f.pos.z)))+' m'+(f.status==='returning'?' · DÖNÜYOR':''):' · YUVADA');}
 function frame(dt){if(!ready||paused||document.hidden)return;dt=C.clamp(dt,0,.1);if(!dt)return;const f=drone.flight;
  if(f.status!=='docked'){
   const before=f.status,ins={...input,x:input.x+(held.KeyD?1:0)-(held.KeyA?1:0),z:input.z+(held.KeyW?1:0)-(held.KeyS?1:0),up:input.up+(held.KeyE?1:0)-(held.KeyQ?1:0),lookX:input.lookX+(held.ArrowRight?1:0)-(held.ArrowLeft?1:0),lookY:input.lookY+(held.ArrowDown?1:0)-(held.ArrowUp?1:0)};
   const result=C.advance(drone,ins,dt,a.ground,a.bounds);a.pose(drone,dt);if(result.landed){if(cameraDefaults){const {cam,fov,near}=cameraDefaults;cam.fov=fov;cam.near=near;cam.up.set(0,1,0);cam.updateProjectionMatrix();cameraDefaults=null;}a.land(drone);host.event('drone-returned',{seconds:f.seconds});flush();}
  }
  clean(()=>a.tick?.(dt,drone));timer+=dt;if(timer>1){timer=0;flush();}if(ending&&drone.flight.status==='docked'){ending=false;host.complete();}
 }
 function camera(cam){if(drone.flight.status==='docked'||!cam)return false;if(!cameraDefaults)cameraDefaults={cam,fov:cam.fov,near:cam.near};const p=drone.flight.pos,c=drone.camera,heading=c.yaw,cos=Math.cos(heading),sin=Math.sin(heading);cam.up.set(0,1,0);
  if(c.view==='follow'){cam.position.set(p.x-sin*5,p.y+2,p.z-cos*5);cam.lookAt(p.x,p.y,p.z);}else if(c.view==='down'){cam.position.set(p.x,p.y-.16,p.z);cam.up.set(sin,0,cos);cam.lookAt(p.x,p.y-10,p.z);}else{cam.position.set(p.x+sin*.38,p.y-.15,p.z+cos*.38);cam.lookAt(p.x+sin*20,p.y+Math.sin(c.pitch)*20,p.z+cos*20);}
  cam.fov=65/c.zoom;cam.near=.08;cam.updateProjectionMatrix();a.model&&(a.model.visible=c.view==='follow');return true;}
 function done(){ending=true;if(drone.flight.status!=='docked')recall();else{ending=false;host.complete();}}
 const api={start,recall,frame,camera,done,release,catalogue:()=>a.catalogue?.()||[],activate:(key)=>{if(drone.flight.status!=='docked')return {ok:false,reason:'Önce Uçangözü geri çağır.'};release();return a.activate?.(key)||{ok:false,reason:'Bu seçenek bu alanda yok.'};},damage(loss){if(Number.isFinite(loss)){drone.health=Math.min(drone.health,Math.max(0,100-loss));if(drone.health<=0&&drone.flight.status!=='docked')recall();}},drone:()=>C.copy(drone),active:()=>drone.flight.status!=='docked',pause(v){if(paused===!!v)return;paused=!!v;release();a.pause?.(paused);flush();},dispose(){release();flush();a.save?.();},diagnostics:()=>({scene:a.scene,ready,paused,drone:C.copy(drone),input:{...input}})};
 root.HisarKurulusSession=api;host.connect(a.scene,api);ready=true;
 if(drone.flight.status!=='docked'&&drone.flight.scene===a.scene)a.launch(drone);else if(drone.flight.status!=='docked')say('Uçangöz başka bölgede. Kayıtlı uçuşa dönmelisin.');
 paint();return api;
}
root.HisarKurulus=Object.freeze({host,model,mount});
})(window);
