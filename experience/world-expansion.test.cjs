'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(__dirname+'/../index.html','utf8');
function world(){const c={Math,clamp:(v,a,b)=>Math.max(a,Math.min(b,v))};c.window=c;vm.createContext(c);vm.runInContext(html.slice(html.search(/const WS=\d+/),html.indexOf('const gg=')),c);return {c,api:vm.runInContext('({WS,SEED_WS,WROADS,FORDS,terrainAxis})',c)};}
test('the playable terrain and global consumers agree on a continuous 2 km square',()=>{const {c,api}=world();assert.equal(api.WS,1000);assert.equal(c.WS,1000);assert.equal(api.SEED_WS,800);assert.equal((api.WS/800)**2,1.5625);});
test('the original five-metre terrain grid stays unchanged and the new band has a bounded mesh budget',()=>{const {api}=world(),a=Array.from(api.terrainAxis(1000));assert.ok(a.length<410);for(let i=1;i<a.length;i++)assert.ok(a[i]>a[i-1]);for(let x=-820;x<=820;x+=5)assert.ok(a.includes(x));assert.ok(a.includes(-1020)&&a.includes(1020));assert.ok(a[0]<=-1400&&a.at(-1)>=1400);assert.ok(api.terrainAxis(1000).length/api.terrainAxis(800).length<1.15);});
test('new maneuver roads connect to the extended highways and never draw a fake water crossing or change an old village footprint',()=>{const {c,api}=world(),roads=api.WROADS.filter(r=>r.extension);assert.equal(roads.length,2);for(const road of roads)for(let i=1;i<road.pts.length;i++){const a=road.pts[i-1],b=road.pts[i],n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1]));for(let j=0;j<=n;j++){const x=a[0]+(b[0]-a[0])*j/n,z=a[1]+(b[1]-a[1])*j/n;assert.ok(Math.abs(x)>800||Math.abs(z)>800);assert.ok(Math.abs(z-c.riv(x))>35);assert.ok(Math.abs(x)<990&&Math.abs(z)<990);}}});
test('native scenery retains its original seed bounds and the visible river reaches both expanded edges',()=>{assert.match(html,/wrnd\(-SEED_WS\+10,SEED_WS-10\)/);assert.doesNotMatch(html,/wrnd\(-WS\+10,WS-10\)/);assert.match(html,/Math\.ceil\(\(2\*WS\+880\)\/10\)\+1/);const src=fs.readFileSync(__dirname+'/sivil.js','utf8');assert.ok(src.includes('if(r.extension)continue;'));});
test('v117 mission and checkpoint coordinates retain exactly the same terrain height after expansion',()=>{const {c}=world(),old=require('./test-support/v117-world-samples.json');for(const p of old.points)assert.ok(Math.abs(c.hAt(p.x,p.z)-p.h)<1e-10,JSON.stringify(p));});

test('choosing another road refreshes the distance and arrival estimate while the map is open',()=>{
 const context={game:'pause',P:{x:0,z:0},tP:32,Math,rebuildRibbon(){},say(){},
  astar:(x,z,tx,tz)=>[[x,z],[tx,tz]]};
 vm.createContext(context);
 const start=html.indexOf('const NAV={'),end=html.indexOf('function stopNav(',start);
 vm.runInContext(html.slice(start,end),context);
 const run=code=>vm.runInContext(code,context);
 run("startNav({x:0,z:85});NAV.left=12;NAV.dev=40;NAV.off=1;NAV.tt=.5;startNav({x:0,z:850})");
 assert.equal(run('NAV.left'),850);
 assert.equal(run('NAV.eta'),100);
 assert.equal(run('NAV.dev+NAV.off+NAV.tt'),0);
});
