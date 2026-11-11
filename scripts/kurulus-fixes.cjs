'use strict';
const fs=require('node:fs'),vm=require('node:vm');
function edit(file,from,to){const s=fs.readFileSync(file,'utf8');if(s.includes(to))return;if(s.split(from).length!==2)throw Error('Changed source anchor '+file+' / '+from.slice(0,50));fs.writeFileSync(file,s.replace(from,to));}
edit('kurulus/campaign.js',"if(!document.fullscreenElement&&$('play').requestFullscreen)await $('play').requestFullscreen();","if(!document.fullscreenElement&&document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();");
edit('shared/kurulus-runtime.js','<button data-kd="zoom">1×</button></div>','<button data-kd="zoom">1×</button><button data-kd="actions" hidden>İŞLEVLER</button></div><div class="kd-actions" hidden></div>');
edit('shared/kurulus-runtime.js',"document.body.appendChild(panel);","document.body.appendChild(panel);\n const actionMenu=panel.querySelector('.kd-actions');\n for(const item of a.actions?.()||[]){const b=document.createElement('button');b.type='button';b.textContent=item.label;b.onclick=()=>{if(!paused&&drone.flight.status==='airborne')a.action?.(item.id);actionMenu.hidden=true;};actionMenu.appendChild(b);}");
edit('shared/kurulus-runtime.js',"if(k==='launch')start();","if(k==='actions'){actionMenu.hidden=!actionMenu.hidden;return;}if(k==='launch')start();");
edit('shared/kurulus-runtime.js',"panel.querySelector('[data-kd=\"return\"]').hidden=!flying;","panel.querySelector('[data-kd=\"return\"]').hidden=!flying;panel.querySelector('[data-kd=\"actions\"]').hidden=!flying||!actionMenu.children.length;if(!flying)actionMenu.hidden=true;");
edit('shared/kurulus-runtime.js',"function release(){for(const k", "function release(){if(actionMenu)actionMenu.hidden=true;for(const k");
edit('shared/tank-adapter.js',"tick(dt){if(game!=='play')return;", "actions:()=>[{id:'release',label:'Bırak · mevcut oyun mühimmatı'},{id:'mark',label:'Görünen oyun hedefini işaretle'},{id:'heat',label:'Isı kamerasını aç / kapat'}],\n action(id){if(game!=='play'||mode!=='drone'||!DR.on)return false;if(id==='release'){root.fire();return true;}if(id==='mark'){root.markAim();return true;}if(id==='heat'){DR.th=!DR.th;return true;}return false;},\n tick(dt){if(game!=='play')return;");
edit('shared/site-adapter.inc.js',"droneFrame=dt=>{locoSoldier(PLAYER,0,dt);};",`droneFrame=dt=>{
  locoSoldier(PLAYER,0,dt);
  // Preserve the original construction parkour objectives under shared movement.
  const n=gateN();for(let i=0;i<n;i++){
   if(PD.gates.includes(i))continue;const [gx,gz]=DGATES[i];
   if(Math.hypot(PD.x-gx,PD.z-gz)<2.4&&PD.y<heightAt(gx,gz)+4.2){
    PD.gates.push(i);toast('KAPI '+(i+1)+' ✓ · '+PD.gates.length+'/'+n,1.4);shot('beep',.3,1.4);
    if(PD.gates.length>=n&&n>=3&&!PD.done){PD.done=true;GM.droneShow=true;satAdd(2,'uçangözle bütün kapılardan geçtin');toast('UÇANGÖZ GÖSTERİSİ · bütün kapılar geçildi!',3);}
   }
  }
  PILOT.t+=dt;
 };`);
const css='\n/* The shared controller replaces, rather than overlays, the legacy flight controls. */\n.kurulus-flying #kmd,.kurulus-flying #ui,.kurulus-flying #rc,.kurulus-flying #hg-hud{display:none!important}\n.kurulus-scene #hr-panel{z-index:9000!important;max-height:calc(100dvh - 24px)!important;overflow:auto!important}\n.kd-actions{position:absolute;top:64px;left:50%;transform:translateX(-50%);display:grid;gap:6px;width:min(300px,80vw);padding:10px;background:#10231ff5;border:1px solid #7d9e8f;border-radius:12px;pointer-events:auto}\n.kd-actions[hidden]{display:none!important}.kd-actions button{min-height:44px;background:#29483d;color:#f4fff8;border:1px solid #7d9e8f;border-radius:8px;font:600 12px system-ui;padding:7px 10px}\n@media(max-width:760px){.kd-on .kd-toolbar{left:10px;transform:none;max-width:calc(100% - 110px);flex-wrap:wrap}.kd-on .kd-toolbar strong{display:none}.kd-actions{top:92px}}\n';
let s=fs.readFileSync('shared/kurulus.css','utf8');if(!s.includes('replaces, rather than overlays'))fs.writeFileSync('shared/kurulus.css',s+css);
edit('scripts/kurulus-integrate.cjs',"for(const p of plans)fs.writeFileSync(p.path,p.value);",`// Visible terminology only; JavaScript identifiers and original systems stay unchanged.
for(const p of plans){if(p.path==='santiye-250888c5/index.html')p.value=p.value.replace(/\\bDRONE\\b(?= PARKURU| SIĞINAĞI| GÖSTERİSİ)/g,'UÇANGÖZ').replace(/\\bDrone(?= parkur)/g,'Uçangöz').replace(/\\bdrone(?= parkur| sığına)/g,'uçangöz').replace(/\\bDron(?= şu|un pili| pili)/g,'Uçangöz').replace('DRON SENDE','UÇANGÖZ SENDE');fs.writeFileSync(p.path,p.value);}`);
// Test actual buttons, single-controller visibility and original actions without changing game physics.
edit('scripts/kurulus-browser.cjs',"await shot(p,'tank-ucangoz.png');",`assert.equal(await f.locator('#kmd').isVisible(),false);assert.equal(await f.locator('#ui').isVisible(),false);ok('legacy controller and duplicate flight UI are hidden');
 const beforeAmmo=await f.evaluate(()=>ammo);await f.locator('[data-kd="actions"]').click();await f.locator('.kd-actions button').first().click();assert.equal(await f.evaluate(()=>ammo),beforeAmmo-1);ok('original release action consumes one game item through shared controls');
 await shot(p,'tank-ucangoz.png');`);
for(const file of ['kurulus/campaign.js','shared/kurulus-runtime.js','shared/tank-adapter.js','shared/site-adapter.inc.js','scripts/kurulus-integrate.cjs','scripts/kurulus-browser.cjs'])new vm.Script(fs.readFileSync(file,'utf8'));
console.log('Fullscreen scene transitions, original flight features and single-controller layout corrected.');
