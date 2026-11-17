'use strict';
// Real menu/pointer/keyboard interaction against the original game. Result
// markup is exercised by a controlled native endGame call, not a full battle.
const assert=require('node:assert/strict'),path=require('node:path');
exports.menu=async function(p,{mobile,label,out,ok}){
 await p.waitForFunction(()=>window.HisarInterface?.diagnostics().installed);
 await require('./campaign-browser-checks.cjs').menu(p,{mobile,label,out,ok});
 if(await p.evaluate(()=>HisarHarekat.diagnostics().sel==='eve-donus'))await p.locator('#sf-archive').click();
 const tab=k=>p.locator('#mp .tabs [data-t="'+k+'"]');
 await tab('g').press('ArrowRight');assert.equal(await tab('b').getAttribute('aria-selected'),'true');assert.equal(await tab('b').evaluate(e=>document.activeElement===e),true);
 await tab('b').press('End');assert.equal(await tab('k').getAttribute('aria-selected'),'true');await tab('k').press('Home');assert.equal(await tab('g').getAttribute('aria-selected'),'true');
 assert.equal(await p.locator('#mp .tabs [tabindex="0"]').count(),1);ok(label+': arrow/Home/End navigation moves focus and the actual selected pane together');
 const sizes=mobile?[[320,568],[844,390],[390,844]]:[[1280,800]];
 for(const [w,h]of sizes){await p.setViewportSize({width:w,height:h});
  for(const key of ['b','u','k','g']){await tab(key).click();const b=await p.locator('#t'+key).boundingBox();assert.ok(b&&b.x>=0&&b.y>=0&&b.x+b.width<=w+1&&b.y+b.height<=h+1,key+' pane fits '+w+'x'+h+': '+JSON.stringify(b));assert.equal(await p.locator('#t'+key).evaluate(e=>e.scrollWidth>e.clientWidth+1),false,key+' has no horizontal clipping');
   if((w===390&&h===844)||!mobile)await p.screenshot({path:path.join(out,'interface-pane-'+key+'-'+label+'.png')});}
  for(const id of ['ci-profile','hisar-experience-entry']){const b=await p.locator('#'+id).boundingBox();assert.ok(b&&b.width>=39&&b.height>=39&&b.x>=0&&b.x+b.width<=w+1&&b.y>=0&&b.y+b.height<=h+1,id+' fits '+w+'x'+h+': '+JSON.stringify(b));}
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);ok(label+': all four modern panes and record/settings buttons fit '+w+'x'+h);
 }
 await p.locator('[data-op="safak-2"]').click();await p.waitForFunction(()=>document.getElementById('ci-mission').textContent==='Kırık Bağlantı');await p.locator('[data-op="safak-1"]').click();await p.waitForFunction(()=>document.getElementById('ci-mission').textContent==='İlk Işık');
 await p.screenshot({path:path.join(out,'interface-menu-'+label+'.png')});ok(label+': selected mission hero follows the actual campaign choice');
 const read=p.locator('#sf-campaign .sf-campaign-actions>button').first();await read.click();await p.locator('#ci-brief-close').waitFor({state:'visible'});assert.equal(await p.locator('#menu').evaluate(e=>e.inert),true);
 assert.equal(await p.locator('#ci-brief-close').evaluate(e=>e===document.activeElement),true);await p.keyboard.press('Shift+Tab');assert.equal(await p.locator('.hk-go').evaluate(e=>e===document.activeElement),true);await p.keyboard.press('Tab');assert.equal(await p.locator('#ci-brief-close').evaluate(e=>e===document.activeElement),true);
 await p.screenshot({path:path.join(out,'interface-brief-'+label+'.png')});await p.locator('#ci-brief-close').click();await p.waitForFunction(()=>!document.getElementById('menu').inert);assert.equal(await read.evaluate(e=>e===document.activeElement),true);
 await read.press('Space');await p.locator('#ci-brief-close').waitFor({state:'visible'});await p.keyboard.press('F2');assert.equal(await p.locator('#hisar-experience').evaluate(e=>e.open),true);await p.keyboard.press('Escape');assert.equal(await p.locator('#hisar-experience').evaluate(e=>e.open),false);assert.equal(await p.locator('#hk-brief').isVisible(),true);
 await p.keyboard.press('Escape');await p.waitForFunction(()=>document.getElementById('hk-brief').hidden&&!document.getElementById('menu').inert);assert.equal(await p.evaluate(()=>game==='play'),false);ok(label+': briefing traps focus, closes by X/Escape and returns to its opener without launching');
 const before=await p.evaluate(()=>({xp:SV.xp,credits:SV.kr,records:['celik-boru-safak-v1','celik-boru-harekat-v1','celik-boru-ilk-isik-v1'].map(k=>localStorage.getItem(k))}));
 await p.locator('#ci-profile').click();await p.locator('#prof').waitFor({state:'visible'});assert.equal(await p.locator('#menu').evaluate(e=>e.inert),true);await p.screenshot({path:path.join(out,'interface-records-'+label+'.png')});
 await p.locator('[data-bk="open"]').click();const world=await p.evaluate(()=>({weather:wx,vehicle:mode}));await p.locator('#prof textarea').pressSequentially('ncp');assert.deepEqual(await p.evaluate(()=>({weather:wx,vehicle:mode})),world);assert.equal(await p.locator('#prof textarea').inputValue(),'ncp');await p.locator('.ci-backup-close').click();assert.equal(await p.locator('#prof .bkb').isVisible(),false);await p.keyboard.press('Escape');await p.waitForFunction(()=>document.getElementById('rep2').style.display==='none'&&!document.getElementById('menu').inert);assert.equal(await p.locator('#ci-profile').evaluate(e=>document.activeElement===e),true);
 assert.deepEqual(await p.evaluate(()=>({xp:SV.xp,credits:SV.kr,records:['celik-boru-safak-v1','celik-boru-harekat-v1','celik-boru-ilk-isik-v1'].map(k=>localStorage.getItem(k))})),before);ok(label+': records and backup cancellation close cleanly without changing XP, credits, stars or checkpoint data');
 await p.evaluate(()=>{HisarInterface.install();HisarSimpleSettings.install();HisarInterface.refresh();});assert.equal(await p.locator('#ci-profile').count(),1);assert.equal(await p.locator('#ci-brand-mark').count(),1);assert.equal(await p.locator('#hisar-experience-entry svg').count(),1);ok(label+': repeated installation retains one header, one record button and the settings icon');
};
exports.active=async function(p,{ok}){
 const shots=await p.evaluate(()=>HisarTankFeel.diagnostics().shots);await p.keyboard.press('F2');assert.equal(await p.evaluate(()=>game),'pause');await p.locator('#hisar-experience').waitFor({state:'visible'});
 // Click outside the native dialog, not a synthetic close() call.
 await p.mouse.click(1,1);await p.waitForFunction(()=>!document.getElementById('hisar-experience').open&&game==='play');assert.equal(await p.evaluate(()=>HisarTankFeel.diagnostics().shots),shots);ok('settings backdrop closes and resumes the actual battle without an unintended shot');
};
exports.result=async function(p,{label,out,ok}){
 if(await p.evaluate(()=>game==='pause'))await p.locator('#cm-return').click();
 await p.locator('#hr-radio-entry').click();await p.locator('#hr-panel').waitFor({state:'visible'});const radio=await p.locator('#hr-panel').boundingBox(),vp=p.viewportSize();assert.ok(radio&&radio.x>=0&&radio.y>=0&&radio.x+radio.width<=vp.width+1&&radio.y+radio.height<=vp.height+1,'radio sheet fits '+label);await p.screenshot({path:path.join(out,'interface-radio-'+label+'.png')});await p.locator('#hr-panel header button').click();assert.equal(await p.locator('#hr-panel').isVisible(),false);ok(label+': actual radio sheet and its close button remain reachable');
 await p.evaluate(()=>endGame(0,'Arayüz regresyon kontrolü'));await p.locator('#ci-result-close').waitFor({state:'visible'});assert.equal(await p.locator('#rep').getAttribute('aria-modal'),'true');assert.equal(await p.locator('#menu').evaluate(e=>e.inert),true);
 await p.screenshot({path:path.join(out,'interface-result-'+label+'.png')});await p.locator('#ci-result-close').click();await p.waitForFunction(()=>!document.getElementById('rep').classList.contains('on')&&!document.getElementById('menu').inert);assert.equal(await p.evaluate(()=>game),'over');assert.equal(await p.locator('#menu').isVisible(),true);ok(label+': controlled native result screen closes to the headquarters without reviving a finished battle');
};
