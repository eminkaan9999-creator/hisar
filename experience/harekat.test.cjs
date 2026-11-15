const test=require('node:test'),assert=require('node:assert'),fs=require('fs');
const c=require('./harekat.js'),html=fs.readFileSync(__dirname+'/../index.html','utf8'),src=fs.readFileSync(__dirname+'/harekat.js','utf8'),bt=fs.readFileSync(__dirname+'/battle.js','utf8'),sw=fs.readFileSync(__dirname+'/../sw.js','utf8');
const riv=x=>120+Math.sin((x+60)*.03)*15;
test('three missions: defence, attack, raid; every start is in Türkiye and every objective in Syria',()=>{assert.deepEqual(c.OPS.map(o=>o.tur),['SAVUNMA','TAARRUZ','BASKIN']);
 for(const o of c.OPS){assert.ok(o.start.z<riv(o.start.x)-26,o.id+' starts in Türkiye');assert.ok(o.obj.z>riv(o.obj.x),o.id+' objective is in Syria');assert.ok(o.emir.length>40);}
 assert.equal(c.OPS[0].waves.length,3);assert.deepEqual(c.OPS[2].depot.slice().sort(),['fuel','fuel','radar','truck','truck']);});
test('capture fills only when the area is clear and the tank is inside',()=>{let k=0;k=c.capture(k,1,true,false);assert.equal(k,0);k=c.capture(k,5,true,true);assert.equal(k,5);k=c.capture(k,2,false,true);assert.equal(k,4);k=c.capture(k,20,true,true);assert.equal(k,c.HOLD);});
test('defence posts face the approach; attackers halt to fire',()=>{const p=c.posts({x:0,z:0},{x:0,z:-100},3,50);assert.equal(p.length,3);for(const q of p)assert.ok(q.z<0&&Math.abs(Math.hypot(q.x,q.z)-50)<1e-9);
 const st={t:0,stop:false};const r=()=>.5;assert.equal(c.halt(st,.1,r),true);assert.ok(st.t>3);});
test('enemies never chase across the map and never get Turkish tanks',()=>{assert.ok(src.includes("e.pr=1e6;"));assert.ok(src.includes("if(tank)root.BT_KIND='t72';"));assert.ok(bt.includes("const SQUAD_KINDS=Object.freeze(['t72']);"));
 assert.ok(src.includes("safe(()=>root.startNav({x:o.obj.x,z:o.obj.z,n:o.obj.n,id:'hk'}),null);"),'route to the objective');assert.ok(!src.includes('dropCrate'),'no random crates in missions');});
test('loaded after the border, precached, default mode',()=>{assert.ok(html.indexOf('experience/sinir.js?v=')<html.indexOf('experience/harekat.js?v='));assert.ok(sw.includes("'experience/harekat.js'"));
 assert.ok(src.includes("let ST=Object.assign({mode:MODE,sel:'gecit',done:{}},load());"));});
