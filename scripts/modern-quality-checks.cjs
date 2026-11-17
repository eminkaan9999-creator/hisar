'use strict';
// Controlled engine impacts and cleared-wave setup; persistence is exercised by a
// real page reload and the same Continue button a player uses. No FPS benchmark.
const assert=require('node:assert/strict'),path=require('node:path');
async function impact(p){
 await p.waitForFunction(()=>window.HisarTankFeel?.diagnostics().installed);
 const hit=await p.evaluate(()=>{const before=P.hp,n=ebul.length,e={x:P.x+60,z:P.z,fr:120,bl:2,dk:1};eshot(e,P.x,hAt(P.x,P.z)+1.4,P.z,80,'tank');const b=ebul[ebul.length-1];if(ebul.length<=n||!b.hitSource)return {error:'projectile lost its source'};
  const source=b.hitSource;hitP(1,{x:P.x+2,y:hAt(P.x,P.z)+1.4,z:P.z},source);P.dz={trk:100,tur:100,eng:40};for(const q of ebul)S.remove(q.m);ebul.length=0;return {before,hp:P.hp,feedback:HisarTankFeel.diagnostics()};});
 assert.ok(!hit.error,JSON.stringify(hit));assert.ok(hit.hp<hit.before);assert.equal(hit.feedback.impact.sector,2);assert.ok(hit.feedback.hits>0);
 await p.waitForFunction(()=>document.getElementById('tf-condition')?.textContent.includes('MOTOR %40'));await p.locator('#tf-condition').waitFor({state:'visible'});assert.match(await p.locator('#tf-condition').innerText(),/MOTOR %40/);await p.locator('#tf-impact').waitFor({state:'visible'});assert.match(await p.locator('#tf-impact').innerText(),/SAĞ.*İSABET/);
}
exports.mobile=impact;
exports.desktop=async function(p,{out,ok}){
 const point=await p.evaluate(()=>HisarCheckpoint.read());assert.ok(point&&point.clearedWave===-1);ok('ordinary opening drive created a valid safe-position checkpoint');
 await p.waitForFunction(()=>game==='play'&&mode==='tank'&&cd<=0&&TA[st]>0,{},{timeout:120000});const shots=await p.evaluate(()=>HisarTankFeel.diagnostics().shots);await p.keyboard.press('Space');
 // The existing crew order deliberately fires after its two short spoken lines.
 await p.waitForFunction(n=>HisarTankFeel.diagnostics().shots>n,shots,{timeout:60000});assert.equal(await p.evaluate(()=>HisarTankFeel.diagnostics().shots),shots+1);assert.equal(await p.evaluate(()=>Object.values(SUSP).filter(v=>typeof v==='number').every(Number.isFinite)),true);ok('real fire input and the native crew-order delay produce one bounded hull recoil');
 await impact(p);await p.evaluate(()=>setQ('orta'));await p.screenshot({path:path.join(out,'modern-quality-hit-desktop.png')});await p.evaluate(()=>setQ('dusuk'));ok('native projectile source and native health loss drive the visible hit direction and damaged-part HUD');
 const saved=await p.evaluate(()=>{for(let i=0;i<400&&HisarHarekat.diagnostics().wave<0;i++)HisarHarekat.step(.1);for(const e of [...E])killE(e);P.hp=110;P.dz={trk:100,eng:40,tur:100};TA=[10,5,2,0];HisarHarekat.step(.1);return {checkpoint:HisarCheckpoint.read(),xp:SV.xp,credits:SV.kr};});
 assert.equal(saved.checkpoint.clearedWave,0);assert.deepEqual(saved.checkpoint.ammunition.shells,[10,5,2,0]);
 await p.reload({waitUntil:'domcontentloaded',timeout:120000});await p.waitForFunction(()=>window.HisarSimpleSettings?.diagnostics().ready&&window.HisarTankFeel?.diagnostics().installed,{},{timeout:90000});await p.locator('#sf-resume').waitFor({state:'visible'});assert.match(await p.locator('#sf-resume').innerText(),/1\/3 dalga/);await p.screenshot({path:path.join(out,'modern-quality-continue-menu.png')});
 await p.locator('#sf-resume').evaluate(e=>e.addEventListener('click',()=>{window.__sfRestored={mission:HisarHarekat.diagnostics(),hp:P.hp,parts:{...P.dz},shells:TA.slice(),score,tP,xp:SV.xp,credits:SV.kr};},{once:true}));await p.locator('#sf-resume').click();await p.waitForFunction(()=>game==='play'&&HisarHarekat.diagnostics().wave===0);const restored=await p.evaluate(()=>window.__sfRestored);
 assert.equal(restored.mission.ph,1);assert.equal(restored.score,saved.checkpoint.score);assert.ok(restored.tP>=saved.checkpoint.elapsed);assert.equal(restored.mission.won,false);assert.equal(restored.mission.enemies.length,0);assert.equal(restored.hp,110);assert.equal(restored.parts.eng,40);assert.deepEqual(restored.shells,[10,5,2,0]);assert.equal(restored.xp,saved.xp);assert.equal(restored.credits,saved.credits);ok('real page reload and Continue button restore cleared-wave progress, damage and ammo while retaining XP/credits');
};
