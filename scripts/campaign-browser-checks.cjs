'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
exports.menu=async function(p,{mobile,label,out,ok}){
 await p.waitForFunction(()=>window.HisarCampaign?.diagnostics().installed&&window.HisarMobility?.diagnostics().hooks.drive);
 await require('./journey-browser-checks.cjs').menu(p,{label,ok});
 const site=await p.evaluate(()=>{const o=HisarCampaign.core.OP,q=o.obj,obstacles=[...BLD,...COV].filter(b=>!b.dead&&!b.sfConvoy&&Math.hypot(b.x-q.x,b.z-q.z)<(b.r||0)+2.4).map(b=>({x:b.x,z:b.z,r:b.r,kind:b.kind}));let visible=false;for(const r of[12,30,50,90,120])for(let i=0;i<24&&!visible;i++){const a=i*Math.PI/12,x=q.x+Math.sin(a)*r,z=q.z+Math.cos(a)*r;if(hAt(x,z)>=0&&los(x,hAt(x,z)+2.8,z,q.x,hAt(q.x,q.z)+3,q.z))visible=true;}return {obstacles,visible};});assert.deepEqual(site.obstacles,[],'convoy must start on open road: '+JSON.stringify(site));assert.equal(site.visible,true,'convoy must be observable from reachable ground');ok(label+': convoy site is clear of actual map buildings and obstacles and has an observation line');
 assert.equal(await p.evaluate(()=>HisarHarekat.diagnostics().sel),'eve-donus');assert.equal(await p.locator('#hkCard').isVisible(),false);assert.equal(await p.locator('#operation-plan li').count(),6);assert.equal(await p.locator('#operation-plan').isVisible(),true);assert.equal(await p.locator('#sf-campaign').isVisible(),true);assert.equal(await p.locator('#ci-mission').innerText(),'Eve Dönüş');
 await p.screenshot({path:path.join(out,'campaign-menu-'+label+'.png')});await p.locator('#sf-campaign .sf-campaign-actions>button').first().click();await p.locator('#ci-brief-close').waitFor({state:'visible'});assert.match(await p.locator('#hk-brief').innerText(),/AYNI HARİTADA 6 AŞAMA/);assert.match(await p.locator('#hk-brief').innerText(),/%75 konvoy/);await p.screenshot({path:path.join(out,'campaign-plan-'+label+'.png')});await p.locator('#ci-brief-close').click();
 await p.locator('#sf-archive').click();assert.equal(await p.locator('#hkCard [data-op]').count(),8);assert.equal(await p.locator('[data-op="tepe"]').isVisible(),true);await p.locator('#sf-archive').click();assert.equal(await p.evaluate(()=>HisarHarekat.diagnostics().sel),'eve-donus');ok(label+': one continuous operation is primary, its six-order plan closes cleanly, and eight old missions remain archived');
};
exports.play=async function(p,{out,ok}){
 await p.locator('#hkMode [data-hm="harekat"]').click();
 if(await p.evaluate(()=>HisarHarekat.diagnostics().sel!=='eve-donus'))await p.locator('#sf-archive').click();await p.locator('#go').click();await p.locator('.hk-go').click();await p.waitForFunction(()=>game==='play'&&HisarHarekat.diagnostics().op==='eve-donus');
 await p.waitForFunction(()=>HisarHarekat.diagnostics().convoy?.modelReady);
 const start=await p.evaluate(()=>({x:P.x,z:P.z,hp:P.hp,t:HisarHarekat.diagnostics().t}));await p.bringToFront();await p.keyboard.down('w');try{await p.waitForFunction(()=>HisarHarekat.diagnostics().ph===1,{},{timeout:120000});}finally{await p.keyboard.up('w');}
 const driven=await p.evaluate(()=>({x:P.x,z:P.z,hp:P.hp,t:HisarHarekat.diagnostics().t}));assert.ok(driven.z-start.z>20);assert.ok(driven.hp>0);assert.ok(driven.t>start.t);ok('continuous operation: ordinary W driving reaches the first order alive, without teleporting the player or skipping to the convoy');
 // Controlled boundary setup. Native repair, QRF and convoy collision logic stay enabled.
 const boundary=await p.evaluate(()=>{keys.w=0;P.v=P.w=0;HisarHarekat.step(.1);for(const e of [...E])killE(e);P.x=-572;P.z=236;HisarHarekat.step(.1);let visible=false;for(const r of[50,90,120])for(let j=0;j<12&&!visible;j++){const a=j*Math.PI/6,x=-605+Math.sin(a)*r,z=360+Math.cos(a)*r;if(hAt(x,z)>=0&&los(x,hAt(x,z)+2.8,z,-605,hAt(-605,360)+3,360)){P.x=x;P.z=z;visible=true;}}if(!visible)throw Error('No convoy observation line');const message=()=>document.querySelector('#hk-obj small').textContent;
  const advance=n=>{for(let i=0;i<n;i++)HisarHarekat.step(.1);};
  P.v=4;advance(4);const scanHint=message();
  P.v=0;advance(45);const found=HisarHarekat.diagnostics();
  P.x=-605;P.z=330;advance(30);const earned=HisarHarekat.diagnostics().phaseT;
  P.z=240;advance(5);const paused=HisarHarekat.diagnostics().phaseT,repairHint=message();
  P.z=330;advance(5);const resumed=HisarHarekat.diagnostics().phaseT;
  for(let i=0;i<110;i++)HisarHarekat.step(.1);for(const e of [...E])killE(e);for(let i=0;i<170;i++)HisarHarekat.step(.1);for(const e of [...E])killE(e);for(let i=0;i<130&&HisarHarekat.diagnostics().ph===3;i++)HisarHarekat.step(.1);P.hp=123;P.dz.eng=48;TA=[11,4,2,0];return {scanHint,repairHint,earned,paused,resumed,found,now:HisarHarekat.diagnostics(),checkpoint:HisarCampaign.read()};});
 assert.match(boundary.scanHint,/Tankı durdur/);assert.match(boundary.repairHint,/Onarım ekibine yaklaş/);
 assert.ok(boundary.earned>0);assert.equal(boundary.paused,boundary.earned);assert.ok(boundary.resumed>boundary.paused);
 ok('the objective explains why scanning or repair is waiting and the repair resumes from the earned time');
 assert.equal(boundary.found.ph,3);assert.equal(boundary.now.ph,4);assert.equal(boundary.checkpoint.phase,4);assert.equal(boundary.now.won,false);await p.screenshot({path:path.join(out,'campaign-convoy-desktop.png')});ok('controlled continuous operation: clearing, observation and two protected repair waves unlock the same truck for the return');
 // Convoy moves through the real map; only escort position and enemy survival are controlled.
 const route=await p.evaluate(()=>{let qrf=0,spawned=false,largest=0,blocked=0,last='';for(let i=0;i<2600&&HisarHarekat.diagnostics().ph===4;i++){const d=HisarHarekat.diagnostics(),c=d.convoy;P.x=c.x+19;P.z=c.z;P.v=0;for(const e of [...E]){if(e.hk&&e.hk.role==='qrf'){spawned=true;qrf++;}killE(e);}HisarHarekat.step(.1);const n=HisarHarekat.diagnostics().convoy;largest=Math.max(largest,Math.hypot(n.x-c.x,n.z-c.z));if(Math.hypot(n.x-c.x,n.z-c.z)<1e-6){blocked++;last=n.wait;}else blocked=0;if(blocked>100)break;}return {state:HisarHarekat.diagnostics(),qrf,spawned,largest,blocked,last};});
 assert.equal(route.state.ph,5,JSON.stringify(route));assert.equal(route.spawned,true);assert.equal(route.qrf,2);assert.ok(route.largest<=.551,'convoy never teleports');assert.equal(route.state.won,false);ok('controlled return: real map pathfinding and collisions deliver the convoy, one route-triggered counterattack appears and extraction remains mandatory');
 const saved=await p.evaluate(()=>({cp:HisarCampaign.read(),xp:SV.xp,credits:SV.kr,old:localStorage.getItem('celik-boru-ilk-isik-v1')}));assert.equal(saved.cp.phase,5);
 await p.reload({waitUntil:'domcontentloaded',timeout:120000});await p.waitForFunction(()=>window.HisarCampaign?.diagnostics().installed&&window.HisarSimpleSettings?.diagnostics().ready,{},{timeout:90000});await p.locator('#sf-resume').waitFor({state:'visible'});await p.screenshot({path:path.join(out,'campaign-continue-desktop.png')});await p.locator('#sf-resume').click();await p.waitForFunction(()=>game==='play'&&HisarHarekat.diagnostics().ph===5);
 const restored=await p.evaluate(()=>({d:HisarHarekat.diagnostics(),hp:P.hp,xp:SV.xp,credits:SV.kr,shells:TA.slice(),old:localStorage.getItem('celik-boru-ilk-isik-v1')}));assert.equal(restored.d.convoy.delivered,true);assert.equal(restored.hp,saved.cp.player.hp);assert.deepEqual(restored.shells,saved.cp.ammunition.shells);assert.equal(restored.xp,saved.xp);assert.equal(restored.credits,saved.credits);assert.equal(restored.old,saved.old);ok('continuous operation: real reload and Continue restore the delivered convoy, tank and ammo without changing the legacy checkpoint, XP or credits');
 const result=await p.evaluate(()=>{P.x=-548;P.z=20;P.v=P.w=0;for(let i=0;i<55;i++)HisarHarekat.step(.1);return {d:HisarHarekat.diagnostics(),cp:HisarCampaign.read()};});assert.equal(result.d.won,true);assert.ok(result.d.stars>=1);assert.equal(result.cp,null);await p.locator('#ci-result-close').waitFor({state:'visible'});assert.equal(await p.locator('#journey-recap>strong').innerText(),'Eve Dönüş');await p.screenshot({path:path.join(out,'campaign-success-desktop.png')});await p.locator('#ci-result-close').click();
 await p.locator('#ci-profile').click();await p.locator('#journey-history summary').click();assert.match(await p.locator('#journey-history').innerText(),/Eve Dönüş/);await p.locator('#prof [data-x]').click();ok('continuous operation: secure delivery completes the mission once, awards stars and clears its checkpoint with a backup-safe tombstone');
 // Real keyboard water approach. No enemies, fast-forward or position changes during the drive.
 await p.bringToFront();
 await p.evaluate(()=>{
  HisarCampaign.choose();HisarHarekat.start('eve-donus');
  for(const e of [...E])killE(e);
  P.x=-490;P.z=riv(P.x)+20;P.h=P.th=yaw=Math.PI;P.v=P.w=0;
 });
 const startZ=await p.evaluate(()=>P.z);
 await p.keyboard.down('w');
 try{
  await p.waitForFunction(start=>{
   const water=HisarMobility.core.depth(hAt,riv,P.x,P.z-5);
   return keys.w&&P.z<start-1&&P.v===0&&water>HisarMobility.core.LIMIT.depth;
  },startZ,{timeout:120000});
  const contact=await p.evaluate(()=>({z:P.z,t:tP}));
  await p.waitForFunction(t=>tP>t+.4,contact.t);
  const stopped=await p.evaluate(()=>({z:P.z,v:P.v,r:riv(P.x),h:hAt(P.x,P.z)}));
  assert.ok(Math.abs(stopped.z-contact.z)<.05,'held W cannot creep forward after water contact');
  assert.ok(stopped.z>stopped.r+8&&stopped.h>-2.15);assert.equal(stopped.v,0);
 }catch(error){
  const diagnostic=await p.evaluate(()=>({game,mode,x:P.x,z:P.z,speed:P.v,held:keys.w,hidden:document.hidden,terrain:HisarMobility.diagnostics()}));
  throw new Error('Water approach did not stop on the dry bank: '+JSON.stringify(diagnostic),{cause:error});
 }finally{await p.keyboard.up('w');}
 await p.screenshot({path:path.join(out,'campaign-water-stop-desktop.png')});await p.keyboard.press('p');ok('real W input stops the tank on the river bank away from a ford; deep water is no longer merely a speed penalty');
};
