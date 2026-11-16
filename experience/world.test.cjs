'use strict';
// Yerleşim 2.0: köyler büyür, mezralar ve çiftlikler; binalar örnekli çizilir ve oyunun bina listesine girer.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8'),code=html.replace(/data:[a-z]+\/[-a-z0-9+.]+;base64,[A-Za-z0-9+/=]+/g,'data:,');
const w=code.slice(code.indexOf('// ---- YERLEŞİM 2.0'),code.indexOf('function mkRoad(pts,w){'));
test('new buildings are drawn as seven instanced meshes (wall, roof, dark, trim, cut stone, two painted facades), not one object each',()=>{assert.ok(w.length>1000);
 assert.ok(w.includes("const IM={w:mk(CAP.w,0xffffff,true,'w'),r:mk(CAP.r,0xffffff,true,'r'),d:mk(CAP.d,0xffffff,false),t:mk(CAP.t,0xffffff,true,'t'),s:mk(CAP.s,0xffffff,true,'s'),f:mk(CAP.f,0xffffff,true,'f'),g:mk(CAP.g,0xffffff,true,'g')};"));
 assert.doesNotMatch(w,/new THREE\.Mesh\(/,'no single meshes per building');});
test('every new building joins the game building list so collision, shells, collapse, routes and positions see it',()=>{
 assert.ok(w.includes('sync.call(b);BLD.push(b);return b}'));assert.ok(code.includes('function collapse(c){c.dead=1;c.g.scale.y=.28;if(c.parts){c.sync();BX.anim(c)}'));
 assert.equal((code.match(/b\.g\.scale\.set\(1,1,1\);b\.g\.traverse\(o=>\{if\(o\.mat0\)o\.material=o\.mat0\}\);if\(b\.sync\)b\.sync\(\)/g)||[]).length,2,'rebuilt on a new battle');
 assert.ok(code.indexOf('// ---- YERLEŞİM 2.0')<code.indexOf('function buildGrid(){'),'placed before the route grid is built');});
test('villages grow outward, hamlets line the roads and farms dot the countryside; placement keeps clear of roads, river, trees and rocks',()=>{
 assert.ok(w.includes("VILS.forEach((v,vi)=>{const n=vi<2?7:11;"));assert.ok(w.includes("const HN=['Kuyucak','Yenice','Çamlık','Ortaköy','Bağlar','Dikmen','Kayacık','Pınarbaşı','Yazlık','Gürpınar','Kocaoba','Sarıkaya'],SN=['Hirbet Saki',"),'Turkish and Syrian hamlet names');
 assert.ok(w.includes('farms<22'));assert.ok(w.includes('if(roadNear(x,z,rad+2.5))return false;'));assert.ok(w.includes('for(const t of TREE)if(Math.hypot(t.x-x,t.z-z)<rad+3)return false;'));
 assert.ok(code.includes(".concat(HAML.map((m,i)=>({id:'m'+i,n:m.n,k:'Yerleşim',"),'hamlets have names on the map');
 assert.ok(w.includes('let sd=9172031;'),'fixed seed: the same world every time');});
