'use strict';
const fs=require('node:fs'),vm=require('node:vm');
function edit(file,old,next){const s=fs.readFileSync(file,'utf8');if(s.includes(next))return;if(s.split(old).length!==2)throw Error('Source contract changed: '+file+' / '+old.slice(0,70));const n=s.replace(old,next);if(file.endsWith('.js'))new vm.Script(n);fs.writeFileSync(file,n);}
const version=JSON.parse(fs.readFileSync('version.json','utf8'));
if(![65,66].includes(version.v))throw Error('Unexpected game version; do not overwrite');
edit('experience/ui.js',"function apply(){document.body", "function apply(){opts.quality='mevcut';opts.autoQuality=true;opts.cinematic=false;opts.contrastCrosshair=false;opts.showFPS=false;document.body");
edit('experience/ui.js',"function persist(){", "function automatic(){apply();persist();}\n function persist(){");
edit('experience/ui.js',"open,close,snapshot,getSettings:","open,close,snapshot,useAutomatic:automatic,getSettings:");
edit('experience/polish.js',"load('radio-missions',()=>!!root.HisarOperations,()=>{})", "load('radio-missions',()=>!!root.HisarOperations,()=>load('simple-settings',()=>!!root.HisarSimpleSettings,()=>{}))");
let sw=fs.readFileSync('sw.js','utf8');
sw=sw.replace(/const CACHE='hisar-main-[^']+';/,"const CACHE='hisar-main-v66-simple-1';");
if(!sw.includes("'experience/simple-settings.js'")){
 if(!sw.includes("'experience/radio-missions.js'"))throw Error('Worker module anchor missing');
 sw=sw.replace("'experience/radio-missions.js'","'experience/radio-missions.js','experience/simple-settings.js'");
}
new vm.Script(sw);fs.writeFileSync('sw.js',sw);
edit('index.html','const VER=65,LOGO=','const VER=66,LOGO=');
version.v=66;version.simpleSettings='1.0.0';
version.not='Grafikler artık cihazına göre otomatik. Ayrıntılı görüntü seçeneklerinin yerine yalnız ses, kumanda hassasiyeti ve zorluk bulunan sade ayarlar. Kolay başlangıç; kayıtlar ve önceki görevler korunur.';
fs.writeFileSync('version.json',JSON.stringify(version,null,2)+'\n');
// Keep legacy browser checks as a historical runner; exercise the replacement UI instead.
if(!fs.existsSync('scripts/experience-browser-legacy.cjs'))fs.copyFileSync('scripts/experience-browser.cjs','scripts/experience-browser-legacy.cjs');
fs.writeFileSync('scripts/experience-browser.cjs',"'use strict';\nrequire('./simple-browser.cjs');\n");
edit('scripts/gameplay-browser.cjs',"const panel=page.locator('#hg-settings');","const panel=page.locator('#hs-simple');");
edit('scripts/gameplay-browser.cjs',"await page.locator('[data-hg=\"droneView\"]').selectOption('fpv');","await page.evaluate(()=>HisarGameplay.set({droneView:'fpv'}));");
edit('scripts/gameplay-browser.cjs',"await page.locator('[data-hg=\"droneView\"]').selectOption('follow');","await page.evaluate(()=>HisarGameplay.set({droneView:'follow'}));");
console.log('Simple settings integrated; build 66; unrelated apps and game saves untouched.');
