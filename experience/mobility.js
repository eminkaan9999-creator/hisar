/* Ground movement rules shared by the tank, combat infantry and vehicle routes. */
(function(root){'use strict';
const VERSION='1.2.0',LIMIT=Object.freeze({forward:14.5,reverse:5.5,acceleration:3.2,brake:6,turn:.62,turnAcceleration:1.5,lateral:2,foot:4.2,depth:.55,slope:.7});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),angle=a=>Math.atan2(Math.sin(a),Math.cos(a));
function advance(p,input,dt){dt=clamp(Number.isFinite(dt)?dt:0,0,.1);const raw=Number.isFinite(input.engine)?input.engine:0,eng=clamp(raw,0,5),power=raw<0?clamp(1+.07*raw,0,1):1+eng*.025,road=input.road?1:.75,condition=clamp(input.condition||0,0,1.2);
 const target=(input.tracks===false?0:1)*clamp(input.forward||0,-1,1)*(input.forward<0?LIMIT.reverse:LIMIT.forward)*power*road*condition;
 const v=p.v||0,a=target*v>=0&&Math.abs(target)>Math.abs(v)?LIMIT.acceleration*(1+eng*.025):LIMIT.brake;
 p.v=v+clamp(target-v,-a*dt,a*dt);
 const maxTurn=Math.min(LIMIT.turn,LIMIT.lateral/Math.max(1,Math.abs(p.v))),targetTurn=-clamp(input.steer||0,-1,1)*maxTurn*(input.tracks===false||condition<=0||power<1e-4?0:1);
 p.w=clamp((p.w||0)+clamp(targetTurn-(p.w||0),-LIMIT.turnAcceleration*dt,LIMIT.turnAcceleration*dt),-maxTurn,maxTurn);
 p.h+=p.w*dt;p.x+=Math.sin(p.h)*p.v*dt;p.z+=Math.cos(p.h)*p.v*dt;return p;
}
function waterDepth(y,river,x,z){return Math.abs(z-river(x))<17?Math.max(0,-1.6-y):0;}
function depth(h,river,x,z){return waterDepth(h(x,z),river,x,z);}
const HULL=[[0,0],[2.8,1.6],[2.8,-1.6],[-2.8,1.6],[-2.8,-1.6]],FOOT=[[0,0]];
// A corner follows an arc during a pivot, even when the vehicle centre stays still.
function terrainAllowed(from,to,h,river,foot=false){
 const dx=to.x-from.x,dz=to.z-from.z,distance=Math.hypot(dx,dz);
 const start=from.h??0,turn=foot?0:angle((to.h??start)-start);
 if(!Number.isFinite(distance)||!Number.isFinite(turn)||distance>8)return false;
 const sweep=distance+Math.abs(turn)*Math.hypot(2.8,1.6);
 const steps=Math.max(1,Math.ceil(sweep/.6)),maxSlope=foot?.9:LIMIT.slope,maxDepth=foot?.2:LIMIT.depth;
 for(const [front,side] of foot?FOOT:HULL){
  let lastX,lastZ,lastY,lastDepth;
  for(let i=0;i<=steps;i++){
   const t=i/steps,heading=start+turn*t,s=Math.sin(heading),c=Math.cos(heading);
   const x=from.x+dx*t+s*front+c*side,z=from.z+dz*t+c*front-s*side;
   const y=h(x,z),water=waterDepth(y,river,x,z);
   if(!Number.isFinite(y))return false;
   if(i>0){
    if(water>maxDepth&&water>lastDepth+1e-4)return false;
    if(Math.abs(y-lastY)>maxSlope*Math.hypot(x-lastX,z-lastZ)+1e-8)return false;
   }
   lastX=x;lastZ=z;lastY=y;lastDepth=water;
  }
 }
 return true;
}
// Only static water is cached. The engine supplies a fresh building/cover grid
// on every request, so demolished buildings and moving blockers stay current.
function waterGridCache(){let saved=null,indices=null,builds=0,samples=0,requests=0;
 return {apply(grid,n,cell,half,h,river){requests++;
  if(!saved||saved.n!==n||saved.cell!==cell||saved.half!==half||saved.h!==h||saved.river!==river){const blocked=[];
   for(let z=0;z<n;z++)for(let x=0;x<n;x++){samples++;if(depth(h,river,-half+(x+.5)*cell,-half+(z+.5)*cell)>LIMIT.depth)blocked.push(z*n+x);}
   indices=Uint32Array.from(blocked);saved={n,cell,half,h,river};builds++;
  }for(const i of indices)grid[i]=1e9;return grid;
 },invalidate(){saved=null;indices=null;},diagnostics:()=>({builds,samples,requests,blocked:indices?indices.length:0})};
}
const core=Object.freeze({VERSION,LIMIT,advance,depth,terrainAllowed,angle,waterGridCache});if(typeof module==='object'&&module.exports)module.exports=core;
const doc=root.document;if(!doc)return;const safe=(f,d)=>{try{return f();}catch(e){return d;}};
const hooks={},stat={waterStops:0,terrainStops:0,footLimited:0},waterGrid=waterGridCache();let warning=0,contact=null;
const ground=(a,b,foot)=>terrainAllowed(a,b,(x,z)=>hAt(x,z),x=>riv(x),foot);
function wrap(n,f){if(hooks[n]||typeof root[n]!=='function')return;hooks[n]=true;root[n]=f(root[n]);}
function stopped(){stat.terrainStops++;if(safe(()=>depth(hAt,riv,P.x+Math.sin(P.h)*4,P.z+Math.cos(P.h)*4)>.55,false))stat.waterStops++;const t=Date.now();if(t-warning>8000){warning=t;safe(()=>root.radio('Sürücü: Geçiş uygun değil. Yol veya kuru geçit kullan.'),null);}}
function sync(o){safe(()=>{o.g.position.set(o.x,hAt(o.x,o.z),o.z);o.g.rotation.y=o.h;},null);}
function connect(){
 wrap('drive',old=>function(ix,iy,sp,dt){if(!safe(()=>P&&SV.U,false))return old.apply(this,arguments);const before={x:P.x,z:P.z,h:P.h},n={...before,v:P.v||0,w:P.w||0};advance(n,{steer:ix,forward:iy,condition:sp,engine:SV.U.eng,tracks:P.dz.trk>0,road:roadNear(P.x,P.z,1)},dt);
  const travel=Math.hypot(n.x-before.x,n.z-before.z),latched=contact&&Math.hypot(before.x-contact.x,before.z-contact.z)<.5&&Math.sign(n.v)===contact.direction&&Math.abs(angle(n.h-contact.h))<.1,reach=Math.max(.25,latched?contact.reach:0),probe=travel>1e-6&&travel<reach?{x:before.x+Math.sin(n.h)*Math.sign(n.v)*reach,z:before.z+Math.cos(n.h)*Math.sign(n.v)*reach,h:n.h}:n;
  if(ground(before,n,false)&&(probe===n||ground(before,probe,false))){if(travel>1e-6)contact=null;P.x=clamp(n.x,-WS+10,WS-10);P.z=clamp(n.z,-WS+10,WS-10);P.v=n.v;P.w=n.w;P.h=n.h;}else{contact={...before,h:n.h,direction:Math.sign(n.v),reach:Math.max(reach,travel)};P.v=P.w=0;stopped();}});
 wrap('startMission',old=>function(){contact=null;return old.apply(this,arguments);});
 wrap('buildGrid',old=>function(){const grid=old.apply(this,arguments);safe(()=>waterGrid.apply(grid,GN2,GSZ,WS,hAt,riv),null);return grid;});
 wrap('update',old=>function(dt){if(!safe(()=>game==='play',false)||doc.hidden)return old.apply(this,arguments);const d=clamp(+dt||0,0,.1),list=safe(()=>[P,...AL.filter(a=>!a.dead),...E.filter(e=>['tank','apc','truck','inf'].includes(e.type))],[]),before=new Map(list.map(o=>[o,{x:o.x,z:o.z,h:o.h||0}]));
  const r=old.apply(this,arguments);for(const [o,b]of before){if(!Number.isFinite(o.x)||!Number.isFinite(o.z)){o.x=b.x;o.z=b.z;sync(o);continue;}const foot=o.type==='inf',distance=Math.hypot(o.x-b.x,o.z-b.z);
   if(distance<1e-8&&Math.abs(angle((o.h||0)-b.h))<1e-8)continue;
   let corrected=false;
   if(foot&&distance>LIMIT.foot*d&&distance>0){const k=LIMIT.foot*d/distance;o.x=b.x+(o.x-b.x)*k;o.z=b.z+(o.z-b.z)*k;stat.footLimited++;corrected=true;}
   if(!ground(b,o,foot)){o.x=b.x;o.z=b.z;if(!foot)o.h=b.h;if(o===safe(()=>P,null))P.v=P.w=0;else o.vx=o.vz=0;stat.terrainStops++;corrected=true;}if(corrected)sync(o);
  }return r;});
 safe(()=>{G0=null;},null);
}
root.HisarMobility=Object.freeze({version:VERSION,core,connect,allows:ground,invalidateTerrain:()=>waterGrid.invalidate(),diagnostics:()=>({version:VERSION,hooks:{...hooks},...stat,waterGrid:waterGrid.diagnostics()})});
connect();doc.addEventListener('hisar:ui-ready',connect);
})(typeof window!=='undefined'?window:globalThis);
