const test=require('node:test'),assert=require('node:assert'),fs=require('fs');
const c=require('./koy.js'),html=fs.readFileSync(__dirname+'/../index.html','utf8'),sw=fs.readFileSync(__dirname+'/../sw.js','utf8'),src=fs.readFileSync(__dirname+'/koy.js','utf8'),sn=fs.readFileSync(__dirname+'/sinir.js','utf8');
test('children salute a nearby tank once, then wait before saluting again',()=>{assert.equal(c.wantsSalute(10,0,false),true);assert.equal(c.wantsSalute(10,5,false),false);assert.equal(c.wantsSalute(40,0,false),false);assert.equal(c.wantsSalute(5,0,true),false);});
test('animals and villagers run away from danger',()=>{const e=c.flee(10,0,0,0);assert.deepEqual(e,{x:1,z:0});});
test('flowers grow in patches, the same flowers in the same place every time',()=>{let n=0,k=new Set();for(let i=0;i<120;i++)for(let j=0;j<120;j++){const f=c.flower(i,j);if(f){n++;k.add(f.k);assert.deepEqual(f,c.flower(i,j));}}
 assert.ok(n>1000&&n<6000,'flowers '+n);assert.equal(k.size,4,'poppy, daisy, yellow and purple');});
test('animal poses: grazing lowers the head, storks flap',()=>{assert.ok(c.animalPose('otla',0).H[0]>.8);assert.ok(Math.abs(c.animalPose('uc',1).WL[2])>.1);assert.ok(c.animalPose('yuru',1).LL);});
test('villagers include headscarved women, capped elders, school children with bags',()=>{for(const k of["c:'bas',only:'kadin'","c:'kasket',only:'adam'","c:'canta',only:'cocuk|kiz'"])assert.ok(sn.includes(k),k);
 for(const k of["'Komutanım, çocuklar selam veriyor.'","wrap('sndBoom'","koyun:[","inek:[","kopek:[","tavuk:[","leylek:["])assert.ok(src.includes(k),k);});
test('loads after the border module and is precached',()=>{assert.ok(html.indexOf('experience/sinir.js?v=')<html.indexOf('experience/koy.js?v='));assert.ok(sw.includes("'experience/koy.js'"));});
test('villagers and animals give way to vehicles: they run sideways out of the path, are pushed clear of the hull at once, and do not step into the path',()=>{
 assert.ok(Math.abs(c.sideStep({need:3,push:0},4.6,.1)-.46)<1e-9);assert.equal(c.sideStep({need:.2,push:0},4.6,.1),.2,'never further than needed');assert.equal(c.sideStep({need:3,push:1.4},4.6,.1),1.4,'under the hull: out at once');assert.ok(Math.abs(c.sideStep({need:3},4.6,.1)-.46)<1e-9);
 for(const k of['insan','koyun','kopek','inek','tavuk'])assert.ok(c.GIVE[k]>=4&&c.GIVE[k]<=7,k);
 assert.ok(src.includes("WAYF=fig.way||null;"),'the rule comes from the border module, shared with the soldiers');
 assert.ok(src.includes("const w=WAYF?WAYF(f.x,f.z):null;if(w){const st=sideStep(w,GIVE.insan,dt);f.x+=w.x*st;f.z+=w.z*st;f.yaw=Math.atan2(w.x,w.z);f.act='kos';p.hold=0;"),'a saluting child also runs aside');
 assert.ok(src.indexOf("const st=sideStep(w,GIVE.insan,dt)")<src.indexOf("if(p.hold>0){p.hold-=dt;"),'giving way comes before saluting');
 assert.ok(src.includes("const w=WAYF?WAYF(f.x,f.z):null;if(w){const st=sideStep(w,GIVE[a.kind]||GIVE.koyun,dt);"),'animals too');
 assert.ok(src.includes("if(WAYF&&WAYF(nx,nz)){f.wait=1;return false;}"),'nobody walks into the path of a vehicle');
 assert.ok(/const VERSION='1\.3\.0'/.test(src)&&/experience\/koy\.js\?v=\d+/.test(html));});
test('villagers keep off the carriageway: along a road they walk on the shoulder, across it they go straight over and hurry',()=>{const roads=[{w:6,pts:[[0,-100],[0,100]]},{w:8,pts:[[0,0],[200,0]]}],R=c.roadAt(roads,1,-50,c.ROAD.pad);
 assert.ok(R&&Math.abs(R.lat-1)<1e-9&&R.half===3&&R.ux===0&&R.uz===1&&R.nx===1,'one metre right of the centre line of a road running north');assert.equal(c.roadAt(roads,3+c.ROAD.pad+.1,-50,c.ROAD.pad),null,'beyond the shoulder the rule does not apply');
 const along=c.roadWalk(R,1,0,1);assert.equal(along.mode,'kenar');assert.ok(along.x>.3&&along.z>.5,'walking along: drifts out to his own side while going on');
 const over=c.roadWalk(R,-20,-1,0);assert.deepEqual([over.x,over.z,over.mode],[-1,0,'gec'],'goal on the far side: straight across');assert.ok(c.ROAD.cross>1);
 /* yolun ortasındaki hedefe yürüyen: asfaltın dışına çıkar, hedefin hizasında durur */
 let x=1,z=-50;const tx=0,tz=-20;let mode='';for(let i=0;i<400;i++){const dx=tx-x,dz=tz-z,d=Math.hypot(dx,dz);if(d<.3)break;const Q=c.roadAt(roads,x,z,c.ROAD.pad);let ux=dx/d,uz=dz/d;if(Q){const w=c.roadWalk(Q,(tx-Q.ax)*Q.nx+(tz-Q.az)*Q.nz,ux,uz);mode=w.mode;if(mode==='vardi')break;ux=w.x;uz=w.z;}x+=ux*.2;z+=uz*.2;}
 assert.equal(mode,'vardi');assert.ok(Math.abs(x)>=3+c.ROAD.edge-.21&&Math.abs(z-tz)<1.2,'he ends beside the road, level with the goal, not on the asphalt: '+x+','+z);
 /* yol boyunca uzun yürüyüş: asfaltta geçen adım sayısı çok az */
 x=.5;z=-90;let on=0,n=0;for(let i=0;i<1200;i++){const dx=2-x,dz=90-z,d=Math.hypot(dx,dz);if(d<.5)break;const Q=c.roadAt(roads.slice(0,1),x,z,c.ROAD.pad);let ux=dx/d,uz=dz/d;if(Q){const w=c.roadWalk(Q,(2-Q.ax)*Q.nx+(90-Q.az)*Q.nz,ux,uz);if(w.mode==='vardi')break;ux=w.x;uz=w.z;}x+=ux*.2;z+=uz*.2;n++;if(Math.abs(x)<3)on++;}
 assert.ok(n>300&&on<25,'180 m along the road: '+on+' of '+n+' steps on the asphalt (only while leaving it)');
 assert.deepEqual(c.offRoad(roads,{x:9,z:-50}),{x:9,z:-50},'a stop well off the road stays');const st=c.offRoad(roads,{x:1,z:-50});assert.ok(Math.abs(st.x-(3+c.ROAD.clear+.05))<1e-9&&st.z===-50,'a stop on the road is moved to its own side of it');assert.ok(c.offRoad(roads,{x:-.5,z:-50}).x<-4);
 for(const k of["moveTo(f,w.x,w.z,p.sp*(p.kid?1.15:1),dt,true)","moveTo(f,d.x,d.z,4,dt,true)","].map(q=>offRoad(ROADS(),q));p.school=1;","if(WETF&&WETF(nx,nz)&&!WETF(f.x,f.z)){f.wait=2;stat.dry++;return false;}","if(f.wait===2&&p.st==='walk'&&p.path.length){p.path.shift();if(!p.path.length){p.school=0;p.st='idle';p.t=3+Math.random()*6;}}","if(f.wait===2){a.st='idle';a.t=1+Math.random()*3;}"])assert.ok(src.includes(k),k);});

