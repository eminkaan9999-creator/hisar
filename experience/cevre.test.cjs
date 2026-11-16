const test=require('node:test'),assert=require('node:assert'),fs=require('fs');
const c=require('./cevre.js'),html=fs.readFileSync(__dirname+'/../index.html','utf8'),sw=fs.readFileSync(__dirname+'/../sw.js','utf8'),src=fs.readFileSync(__dirname+'/cevre.js','utf8');
test('power poles stand every 46 m beside the road, off the carriageway',()=>{const p=c.poles([[0,0],[0,200]],6);assert.equal(p.length,4);assert.deepEqual(p.map(q=>Math.round(q.z)),[23,69,115,161]);
 for(const q of p)assert.ok(Math.abs(Math.abs(q.x)-(3+c.POLE.off))<1e-9);const b=c.poles([[0,0],[100,0],[100,100]],6);assert.equal(b.length,4,'spacing carries round the bend');});
test('wires sag between poles',()=>{const w=c.sag([0,8,0],[46,8,0],6,.9);assert.equal(w.length,7);assert.deepEqual(w[0],[0,8,0]);assert.ok(Math.abs(w[3][1]-7.1)<1e-9);assert.ok(w[1][1]<8&&w[1][1]>w[3][1]);});
test('distant smoke rises, drifts, swells and fades',()=>{const a=c.puff(.1,95),b=c.puff(.6,95),e=c.puff(.99,95);assert.ok(b.y>a.y&&b.drift>a.drift&&b.s>a.s);assert.ok(e.a<.02&&c.puff(0,95).a===0&&b.a>.1);});
test('Syria has a dead grid and shell craters; poles fall to tanks; loaded after the civil vehicles and precached',()=>{assert.ok(src.includes("if(sy&&hash(all.length,chain)<.45)"));assert.ok(src.includes("p.prev=(!sy&&prev&&!prev.sy"),'no wires in Syria');
 assert.ok(src.includes('function buildCraters')&&src.includes('function cutWire'));assert.ok(html.indexOf('experience/sivil.js?v=')<html.indexOf('experience/cevre.js?v='));assert.ok(sw.includes("'experience/cevre.js'"));});
