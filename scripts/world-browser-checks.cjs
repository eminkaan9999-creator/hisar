'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
exports.menu=async(p,{label,ok})=>{
 await p.waitForFunction(()=>window.HisarCampaign?.diagnostics().installed&&window.HisarMobility?.diagnostics().hooks.buildGrid);
 const world=await p.evaluate(()=>({width:WS*2,shared:window.WS,grid:GN2,axis:terrainAxis(WS).length,points:gg.attributes.position.count,roads:WROADS.filter(r=>r.extension).map(r=>r.n)}));assert.equal(world.width,2000);assert.equal(world.shared,1000);assert.equal(world.grid,250);assert.ok(world.axis<410);assert.equal(world.roads.length,2);ok(label+': 2 km square map, navigation grid and bounded terrain mesh agree');
 const cache=await p.evaluate(()=>{buildGrid();const before=HisarMobility.diagnostics().waterGrid;const b={x:-884,z:-852,r:4,h:5,dead:0},i=Math.floor((b.z+WS)/GSZ)*GN2+Math.floor((b.x+WS)/GSZ);let added,cleared;
  BLD.push(b);try{added=buildGrid()[i];}finally{BLD.splice(BLD.indexOf(b),1);}cleared=buildGrid()[i];return {before,after:HisarMobility.diagnostics().waterGrid,added,cleared};});
 assert.equal(cache.before.builds,cache.after.builds);assert.equal(cache.before.samples,cache.after.samples);assert.ok(cache.added>1e8&&cache.cleared<1e8);ok(label+': repeated routes reuse water samples while added/removed buildings still update collision costs');
 for(const id of ['kuzey-yolu','guney-yolu']){
  const route=await p.evaluate(id=>{
   const stop=pois().find(point=>point.id===id);
   const path=astar(-880,stop.z,stop.x,stop.z);
   return {points:path?.length,end:path?.at(-1),stop,dry:path?.every(([x,z])=>HisarMobility.core.depth(hAt,riv,x,z)===0)};
  },id);
  assert.ok(route.points>=2);
  assert.ok(Math.hypot(route.end[0]-route.stop.x,route.end[1]-route.stop.z)<12);
  assert.ok(route.dry);
  ok(label+': route reaches '+route.stop.n+' on dry ground');
 }

};
exports.play=async(p,{out,ok})=>{
 await p.waitForFunction(()=>game==='pause');await p.evaluate(()=>{P.x=-880;P.z=-850;P.h=P.th=yaw=Math.PI/2;P.v=P.w=0;});
 await p.locator('#cm-return').click();
 await p.bringToFront();
 await p.keyboard.press('g');
 await p.locator('#fmL button').filter({hasText:'Kuzey Manevra Yolu'}).click();
 await p.locator('#fmC [data-a="nav"]').click();
 assert.equal(await p.evaluate(()=>NAV.on&&NAV.to.id),'kuzey-yolu');
 await p.screenshot({path:path.join(out,'world-road-selection-desktop.png')});
 await p.locator('#fmX').click();
 ok('the player selects the northern road and starts its route from the map list');
 const before=await p.evaluate(()=>({x:P.x,z:P.z}));await p.keyboard.down('w');try{await p.waitForFunction(x=>P.x>x+15,before.x,{timeout:120000});}finally{await p.keyboard.up('w');}
 const after=await p.evaluate(()=>({x:P.x,z:P.z,hp:P.hp,game,grid:typeof gridRef==='function'?gridRef(P.x,P.z):null}));assert.equal(after.game,'play');assert.ok(after.hp>0);assert.ok(after.z< -820&&after.x>before.x+15);await p.screenshot({path:path.join(out,'world-northern-drive-desktop.png')});await p.keyboard.press('p');ok('ordinary W driving works beyond the old map boundary on the new maneuver road');
};
