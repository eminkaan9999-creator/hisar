const test=require('node:test'),assert=require('node:assert'),fs=require('fs');
const d=require('./destek.js'),m=require('./menu.js'),html=fs.readFileSync(__dirname+'/../index.html','utf8'),sw=fs.readFileSync(__dirname+'/../sw.js','utf8'),src=fs.readFileSync(__dirname+'/destek.js','utf8');
test('air support only hits targets someone has seen; the nearest seen target is chosen',()=>{const L=[{x:100,z:0,hp:5,seen:true},{x:50,z:0,hp:5,seen:false},{x:300,z:0,hp:5,seen:true},{x:20,z:0,hp:0,seen:true}];assert.equal(d.pickTarget(L,0,0,900),L[0]);assert.equal(d.pickTarget([L[1]],0,0),null);});
test('every support asset has a ready time and the helicopter, drone and jet are distinct',()=>{assert.deepEqual(Object.keys(d.SUP),['heli','tb2','topcu','jet']);for(const k in d.SUP)assert.ok(d.SUP[k].cd>=60);assert.equal(d.ready(10,4.2),6);assert.equal(d.ready(3,9),0);
 const o=d.orbitPt({x:0,z:0},100,0);assert.deepEqual(o,{x:100,z:0});});
test('infantry squads advance ahead of the tank towards the objective, side by side',()=>{const a=d.squadSlot(0,0,0,500,0,6,32,9),b=d.squadSlot(0,0,0,500,5,6,32,9);assert.ok(Math.abs(a.z-32)<1e-9&&Math.abs(b.z-32)<1e-9);assert.ok(Math.abs(a.x-b.x-45)<1e-9||Math.abs(b.x-a.x-45)<1e-9);});
test('menu draws the background at 15 frames per second from a fixed camera (no spinning)',()=>{assert.equal(m.shouldDraw(true,1000,990),false);assert.equal(m.shouldDraw(true,1100,1000),true);assert.equal(m.shouldDraw(false,1000,999),true);
 const o=m.orbit(0,0,0,0),o2=m.orbit(0,0,0,60);assert.ok(Math.abs(Math.hypot(o.x,o.z)-m.ORBIT.r)<1e-9);assert.equal(m.ORBIT.w,0);assert.deepEqual(o,o2);});
test('support and menu modules load after village life and are precached; textures are files, not inline',()=>{let i=html.indexOf('experience/koy.js?v=');for(const k of['destek','menu']){const j=html.indexOf('experience/'+k+'.js?v=');assert.ok(j>i,k);i=j;assert.ok(sw.includes("'experience/"+k+".js'"));}
 assert.ok(html.length<2500000,'index.html is light: '+html.length);assert.ok(!/data:image\/jpeg;base64,[A-Za-z0-9+/=]{20000,}/.test(html));for(const t of['sky_gunduz','t_cim','m60x_col'])assert.ok(sw.includes("'assets/tex/"+t+".jpg?v=96'"),t);
 for(const k of["'T129 ATAK'","'Bayraktar TB2'","'F-16'","ATAK 1: Bölgeye giriyorum","YAKIN ATIŞ"])assert.ok(src.includes(k),k);});
test('escort infantry never get driven over: a man in the tank\'s path runs aside (at bounded speed if the hull swings onto him) and nobody steps in front of it',()=>{
 assert.ok(src.includes("const w=m.hp>0&&f.live&&forces.way?forces.way(f.x,f.z):null;if(w){m.down=0;const st=Math.min(Math.max(w.need,w.push||0),forces.run*dt);f.x+=w.x*st;f.z+=w.z*st;f.yaw=Math.atan2(w.x,w.z);f.act='nobet-yuru';"),'runs aside, also a man lying in cover gets up');
 assert.ok(src.indexOf("const w=m.hp>0&&f.live&&forces.way")<src.indexOf("if(m.down>0){m.down-=dt;f.act='yat';"),'giving way comes before lying down');
 assert.ok(src.indexOf("const w=m.hp>0&&f.live&&forces.way")<src.indexOf("if(tgt){f.act='diz';"),'giving way comes before kneeling to fire');
 assert.ok(src.includes("if(mv<s*.15||wallBlocks(f.x,f.z,o.x,o.z)||(root.HisarMobility&&!root.HisarMobility.allows({x:f.x,z:f.z},o,true))||(forces.way&&forces.way(o.x,o.z)))f.act='nobet';"),'does not step into the corridor, nor through the wall');
 assert.ok(src.includes("way:fig.way||null,run:safe(()=>root.HisarSinir.core.WAY.run,5)"),'same rule and running speed as the border soldiers');
 assert.ok(src.includes("root.HisarSinir.vehicleSource(()=>forces&&forces.on?forces.veh:null)")&&src.includes("v.h=v.yaw;"),'the escort vehicles are reported so soldiers clear their path too');
 assert.ok(/const VERSION='1\.4\.0'/.test(src)&&/experience\/destek\.js\?v=\d+/.test(html));});
test('the escort column crosses the border strip (wall and river) only through a gate',()=>{const riv=x=>100,F=[0,300],B=d.BAND,back=26;
 assert.deepEqual([d.zone(riv,back,0,60),d.zone(riv,back,0,80),d.zone(riv,back,0,100+B.south+1)],[0,1,2],'north of the wall, the strip, south of the river');
 assert.deepEqual(d.route(riv,F,back,50,20,60,40,0),{x:60,z:40,gate:false},'same side: straight to the slot');
 const n=d.route(riv,F,back,50,20,40,200,1.6);assert.deepEqual(n,{x:1.6,z:100-back-B.north,gate:true},'first to the mouth of the nearest gate, in his own lane');
 const s1=d.route(riv,F,back,n.x,n.z,40,200,1.6);assert.deepEqual(s1,{x:1.6,z:100+B.south+B.past,gate:true},'from the mouth straight through the strip to the far bank');
 assert.deepEqual(d.route(riv,F,back,1.6,90,40,200,1.6),s1,'in the strip he keeps going');assert.deepEqual(d.route(riv,F,back,1.6,s1.z+1,40,200,1.6),{x:40,z:200,gate:false},'across: straight to the slot');
 assert.deepEqual(d.route(riv,F,back,280,200,290,10,0),{x:300,z:100+B.south+B.past,gate:true},'coming back north he takes the gate nearest to him and his goal');
 assert.deepEqual(d.route(riv,F,back,30,100,40,200,0),{x:0,z:100,gate:true},'caught in the strip away from the gate, he moves along it to the gate');
 assert.deepEqual(d.route(riv,F,back,0,90,25,95,0),{x:0,z:95,gate:true},'a slot inside the strip is taken on the gate line, not in deep water');
 assert.deepEqual(d.route(riv,F,back,1,90,200,95,0),{x:0,z:100-back-B.north,gate:true},'standing in one gate with a goal by another: he leaves the strip northwards first, he never walks along the river to the other ford');
 assert.deepEqual(d.route(riv,F,back,1,90,290,20,0),{x:0,z:100-back-B.north,gate:true},'a goal north of the wall near another ford: out through his own gate');assert.deepEqual(d.route(riv,F,back,1,90,290,200,0),{x:0,z:100+B.south+B.past,gate:true},'a goal south: out to the south bank through his own ford');
 const ln=[0,1,2,3,4,5].map(i=>d.laneOf(i,0)).concat([0,5].map(i=>d.laneOf(i,1)));assert.ok(ln.every(v=>Math.abs(v)<6),'every lane stays on the shallow ford '+ln);assert.equal(new Set(ln).size,ln.length);
 for(const k of["wp=path(f.x,f.z,sl.x,sl.z,laneOf(m.i,m.sq))","let wp=path(v.x,v.z,tx,tz,0);","root.HisarSinir.core.blocked(riv,FORDS,x0,z0,x1,z1)","if(zoneAt(sl.x,sl.z)!==zp||safe(()=>hAt(sl.x,sl.z)<-.5,false))"])assert.ok(src.includes(k),k);});
test('escort vehicles drive round a tank, never through it; the column walks round buildings; parked vehicles are solid',()=>{const E=d.ESC;
 assert.deepEqual(d.around(0,0,0,30,0,15,E.tank),{x:-(E.tank+1.5),z:15,gate:false},'a tank dead ahead: aim beside it');assert.equal(d.around(0,0,0,30,E.tank+.1,15,E.tank),null,'a tank beside the path is no obstacle');
 const w=d.around(0,0,0,30,2,15,E.tank);assert.ok(w.x<2-E.tank,'pass on the side away from it');assert.equal(d.around(0,0,0,30,0,-5,E.tank),null,'behind');assert.equal(d.around(0,0,0,30,0,30+E.tank+1,E.tank),null,'beyond the goal');
 assert.ok(E.tank>5&&E.veh>4&&E.body>2&&E.man<1);
 for(const k of["for(const o of tk){const w=around(v.x,v.z,wp.x,wp.z,o.x,o.z,ESC.tank);if(w){wp=w;break;}}","for(let it=0;it<3;it++){for(const o of lead)k=keepOff(v,o.x,o.z,ESC.veh)||k;for(let i=tk.length-1;i>=0;i--)k=keepOff(v,tk[i].x,tk[i].z,ESC.tank)||k;}","for(const o of lead){const w=around(v.x,v.z,wp.x,wp.z,o.x,o.z,ESC.veh);if(w){wp=w;break;}}","o=stepAround(f.x,f.z,dx/d,dz/d,s,ESC.man,nearList(m,f.x,f.z,dt));if(!wp.gate)o.z=keepZ(f.x,f.z,o.x,o.z,BAND.keep);","o=stepAround(v.x,v.z,dx/d,dz/d,s,ESC.body,nearList(v,v.x,v.z,dt));if(!wp.gate)o.z=keepZ(v.x,v.z,o.x,o.z,BAND.keepVeh);",
  "pushNear(o,m,list);const qx=o.x-wx,qz=o.z-wz,q=Math.hypot(qx,qz);","const c=list[i],bld=i<nb;if(bld?c.dead:(c.pos&&c.h<.5))continue;const dx=o.x-c.x,dz=o.z-c.z,d=Math.hypot(dx,dz),mm=(bld?c.r:c.r*.85)+m;","for(const e of[1,-1])COV.push({x:x+Math.sin(a)*o*e,z:z+Math.cos(a)*o*e,r:ESC.parked,h:2.3,pos:1,park:e});"])assert.ok(src.includes(k),k);});
test('the column looks only at nearby blockers: each man keeps a short list, renewed every half second or so',()=>{const N=d.NEAR;assert.ok(N.r>=20&&N.every<=1&&N.move<N.r/2);
 assert.ok(N.r-N.move-7*N.every*1.2>8,'a Kirpi driving at 7 m/s cannot reach a man from outside his list before it is renewed');
 assert.ok(src.includes("if(a.nb&&a.nbT>0&&Math.abs(x-a.nbx)<NEAR.move&&Math.abs(z-a.nbz)<NEAR.move)return a.nb;"));
 assert.ok(html.includes("function pushOut(o,m){/* uzaktaki engeller karekök almadan elenir (kare başına onlarca kez çağrılır) */"),'the base rule also skips far blockers cheaply');});
test('a straight walk on one side of the border never cuts through the strip where the river bends: the column follows the wall or the bank',()=>{const riv=x=>100+Math.sin(x*.03)*15,back=26,B=d.BAND;
 assert.equal(d.keepSide(riv,back,0,50,60,B.keep),60,'well north of the wall: untouched');const w=riv(50)-back;assert.equal(d.keepSide(riv,back,0,50,w+4,B.keep),w-B.keep,'a step that would pass the wall is held a few metres north of it');
 assert.equal(d.keepSide(riv,back,2,50,riv(50)+5,B.keep),riv(50)+B.south+B.keep,'on the south side he is held on the bank, out of the water');assert.equal(d.keepSide(riv,back,1,50,riv(50),B.keep),riv(50),'inside the strip (on the gate route) nothing is changed');
 /* yürüyüş: kuzeyde, duvarın kıvrıldığı yerden geçen düz bir yol boyunca adım adım; hiçbir adım şeride girmez */
 let x=-80,z=riv(-80)-back-6;const tx=140,tz=riv(140)-back-6;let worst=1e9;for(let i=0;i<600&&Math.hypot(tx-x,tz-z)>1;i++){const l=Math.hypot(tx-x,tz-z),nx=x+(tx-x)/l*.5;let nz=z+(tz-z)/l*.5;nz=d.keepSide(riv,back,d.zone(riv,back,x,z),nx,nz,B.keep);x=nx;z=nz;assert.equal(d.zone(riv,back,x,z),0);worst=Math.min(worst,riv(x)-back-z);}
 assert.ok(worst>=B.keep-1e-9&&Math.hypot(tx-x,tz-z)<=1.01,'arrives, always at least '+B.keep+' m north of the wall: '+worst);assert.ok(B.keepVeh>B.keep);});

