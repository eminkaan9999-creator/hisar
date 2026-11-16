'use strict';
// Gerçeklik 1.0: ayar atışı, toz, ot, dağlar; düşman tanklarının mevzi kullanması; iki katlı betonarme köy evleri.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const r=require('./realism.js'),field=require('./field.js');
test('realism module loads last and is precached',()=>{const html=read('index.html');
 assert.ok(html.indexOf('<script src="experience/swarm.js?v=')<html.indexOf('<script src="experience/realism.js?v='));
 assert.ok(read('sw.js').includes("'experience/swarm.js','experience/realism.js'"));assert.ok(read('.github/workflows/live-smoke.yml').includes("'experience/realism.js'"));});
test('enemy gunners bracket: the first round on a new target is wide, then they correct; moving 25 m or waiting 15 s starts over',()=>{
 assert.equal(r.shotIndex(null,0,0,0),0);let last={x:0,z:0,t:0,n:0};assert.equal(r.shotIndex(last,5,5,3),1);last={x:5,z:5,t:3,n:1};assert.equal(r.shotIndex(last,6,5,6),2);
 assert.equal(r.shotIndex(last,40,5,6),0,'target moved');assert.equal(r.shotIndex(last,5,5,19),0,'too long ago');
 assert.deepEqual([0,1,2,3,9].map(r.spread),[2.2,1.5,1.15,1,1]);});
test('dust rises with speed; little on roads, none when soaked or standing',()=>{assert.equal(r.dustRate(1,false,0),0);assert.ok(r.dustRate(16,false,0)>r.dustRate(8,false,0));
 assert.ok(r.dustRate(16,true,0)<r.dustRate(16,false,0)*.5);assert.equal(r.dustRate(16,false,.8),0);});
test('grass tufts are fixed to the world: the same cell always gives the same tuft',()=>{const a=r.tuft(120,-40),b=r.tuft(120,-40);assert.deepEqual(a,b);
 let n=0;for(let i=0;i<60;i++)for(let j=0;j<60;j++)if(r.tuft(i,j))n++;assert.ok(n>900&&n<2700,'patchy cover '+n);});
test('mountains: three ranges on the horizon blended into the fog; the playable edge rises into foothills',()=>{const s=read('experience/realism.js'),h=read('index.html');
 assert.ok(s.includes("const RANGES=Object.freeze([{r:440,"));assert.ok(s.includes("new T.MeshBasicMaterial({vertexColors:true,fog:false,depthWrite:false,side:T.DoubleSide})"));
 assert.ok(s.includes('out.copy(sn[i]?snow:rk).multiplyScalar(lum).lerp(fc,k[i])'),'colour follows the fog (weather, time of day)');
 assert.ok(h.includes('const e=Math.max(Math.abs(x),Math.abs(z));if(e>WS+10)h+=sm(e,WS+10,WS+420)*'),'foothills only outside the playable area');});
test('enemy tanks take a free position that faces the player, 70-300 m from him and within 110 m of themselves',()=>{const c=field;
 const pos=[{x:0,z:0,h:0},{x:50,z:0,h:Math.PI},{x:-60,z:20,h:0}],pl={x:0,z:200};
 assert.equal(c.pickFor({x:30,z:0},pl,pos),pos[0]);assert.equal(c.pickFor({x:30,z:0},{x:0,z:40},pos),null,'player too close');
 assert.equal(c.pickFor({x:30,z:0},pl,pos,p=>p===pos[0]),pos[2],'taken one is skipped');assert.equal(c.pickFor({x:400,z:0},pl,pos),null,'too far to drive');
 const src=read('experience/field.js');assert.ok(src.includes("function enemyPositions(dt){if(safe(()=>mis!=='savas',true))return;"));
 assert.ok(src.includes("if(e.rt>0||e.immob||e.conv||e.foe||faces(p,P.x,P.z)<EN.leave||d>EN.far+40||d<40){release(e);continue;}"),'leaves when flanked');});
test('village houses include two-storey concrete ones with rebar, water tank and solar heater; walls and roofs are textured',()=>{const h=read('index.html');
 assert.ok(h.includes('function beton(b,w,d){'));assert.ok(h.includes("part(b,'d',-w*.25,H+1.6,-d*.15,1.2,1.2,1.2,0,0x1b1b1b);"));
 assert.ok(h.includes("const MAP={w:TXW,r:TXR,t:TXT,s:TXS,f:TXF,g:TXG};"));assert.ok(h.includes('function paintFacade(g,W,H,syr){'),'painted facades with windows');assert.ok(h.includes('function tasev(b,w,d){'),'Kilis stone house');assert.ok(h.includes('function win(b,x,y,z,w,h,side){'));});
