'use strict';
require('./kurulus-fixes.cjs');
const fs=require('node:fs'),vm=require('node:vm');
function edit(p,a,b){let s=fs.readFileSync(p,'utf8');if(s.includes(b))return;if(s.split(a).length!==2)throw Error('Unexpected source '+p);s=s.replace(a,b);new vm.Script(s);fs.writeFileSync(p,s);}
// Measure after the real pause click, not while the game is still advancing before the click.
edit('scripts/kurulus-browser.cjs',"const pauseBat=await f.evaluate(()=>HisarKurulusSession.drone().battery);await p.locator('#pause').click();", "await p.locator('#pause').click();const pauseBat=await f.evaluate(()=>{if(!HisarKurulusSession.diagnostics().paused)throw Error('Pause not applied');return HisarKurulusSession.drone().battery;});");
edit('scripts/kurulus-browser.cjs',"await context.close();","await require('./kurulus-story.cjs')({p,base,ok,shot});await context.close();");
edit('shared/tank-adapter.js',"mgn:'Destek aracı'","mgn:'Destek aracı',ew:'Elektronik destek aracı'");
console.log('Pause measurement race removed; eight-chapter predicate suite connected.');
