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
