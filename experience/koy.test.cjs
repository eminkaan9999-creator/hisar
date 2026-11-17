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
 assert.ok(/const VERSION='1\.2\.0'/.test(src)&&html.includes('experience/koy.js?v=4'));});
