'use strict';
const fs=require('node:fs'),crypto=require('node:crypto'),vm=require('node:vm');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const plans=[];
function edit(path,marker,fn){const old=fs.readFileSync(path,'utf8');if(old.includes(marker))return;const value=fn(old);if(value===old)throw Error('No change for '+path);if(path.endsWith('.js'))new vm.Script(value);if(path.endsWith('.html'))for(const m of value.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){if(/src\s*=|type=['"](?:module|application\/json)/i.test(m[1]))continue;new vm.Script(m[2]);}plans.push({path,value});}
function once(s,from,to){if(s.split(from).length!==2)throw Error('Ambiguous integration anchor '+from.slice(0,80));return s.replace(from,to);}
function head(s,prefix){const tags=`\n<!-- hisar-kurulus-1 -->\n<link rel="stylesheet" href="${prefix}shared/kurulus.css?v=1">\n<script src="${prefix}shared/kurulus-core.js?v=1"></script>\n<script src="${prefix}shared/kurulus-runtime.js?v=1"></script>\n<script>if(window.HisarKurulus){document.write('<script src="${prefix}shared/radio-tr.js?v=1"><\\/script>');}</script>\n`;
 return once(s,'</head>',tags+'</head>');}
edit('index.html','<!-- hisar-kurulus-1 -->',s=>{s=head(s,'');return once(s,'</body>','<script src="shared/tank-adapter.js?v=1"></script><script src="shared/kurulus-entry.js?v=1"></script>\n</body>');});
edit('santiye-250888c5/index.html','<!-- hisar-kurulus-1 -->',s=>{s=head(s,'../');s=once(s,'})().catch(e => { console.error(e);',fs.readFileSync('shared/site-adapter.inc.js','utf8')+'\n})().catch(e => { console.error(e);');s=s.replace('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js','../three.min.js');s=s.replace(/https:\/\/cdn\.jsdelivr\.net\/npm\/three@0\.128\.0\/examples\/js\/[^"\s]+/g,u=>'../shared/vendor/three-r128/'+u.split('/').pop());return s;});
edit('poligon/index.html','<!-- hisar-kurulus-1 -->',s=>{s=head(s,'../');return once(s,'\n})();\n\n</script>','\n'+fs.readFileSync('shared/range-adapter.inc.js','utf8')+'\n})();\n\n</script>');});
edit('experience/radio-missions.js','pendingThreats?.()',s=>once(s,'enemies:E.length};',"enemies:E.length+(root.HisarKurulusSession?.pendingThreats?.()||0)};"));
// Visible terminology only; JavaScript identifiers and original systems stay unchanged.
for(const p of plans){if(p.path==='santiye-250888c5/index.html')p.value=p.value.replace(/\bDRONE\b(?= PARKURU| SIĞINAĞI| GÖSTERİSİ)/g,'UÇANGÖZ').replace(/\bDrone(?= parkur)/g,'Uçangöz').replace(/\bdrone(?= parkur| sığına)/g,'uçangöz').replace(/\bDron(?= şu|un pili| pili)/g,'Uçangöz').replace('DRON SENDE','UÇANGÖZ SENDE');fs.writeFileSync(p.path,p.value);}
console.log('Kuruluş integrated into',plans.map(x=>x.path).join(', '));
// Refresh only the main app cache; the other applications keep their own workers.
const production=['shared/kurulus-core.js','shared/kurulus-runtime.js','shared/kurulus.css','shared/tank-adapter.js','shared/radio-tr.js','shared/kurulus-entry.js','kurulus/index.html','kurulus/campaign.js','kurulus/manifest.webmanifest'];
const voices=JSON.parse(fs.readFileSync('assets/radio/tr/manifest.json','utf8'));
for(const c of Object.values(voices.clips)){if(!/^[a-z0-9-]+\.mp3$/.test(c.file))throw Error('Bad voice path');production.push('assets/radio/tr/'+c.file);}
production.push('assets/radio/tr/manifest.json');
let worker=fs.readFileSync('sw.js','utf8');worker=worker.replace(/const CACHE='hisar-main-[^']+';/,"const CACHE='hisar-main-v69-kurulus-11';");
for(const name of production){if(!fs.existsSync(name))throw Error('Missing production asset: '+name);if(!worker.includes("'"+name+"'"))worker=worker.replace('const CORE=[',"const CORE=['"+name+"',");}
new vm.Script(worker);fs.writeFileSync('sw.js',worker);
const index=fs.readFileSync('index.html','utf8');const version=JSON.parse(fs.readFileSync('version.json','utf8'));
if(![68,69].includes(version.v))throw Error('Newer game detected; reconcile instead of overwriting');
if(version.v===68){const replaced=once(index,'const VER=68,LOGO=','const VER=69,LOGO=');fs.writeFileSync('index.html',replaced);version.previousReleaseNotes=version.not;version.v=69;}
version.kurulus='1.1.0';version.not='HİSAR Kuruluş: tek hikâye ve üç tam oyun alanı; özgün tanklar, kabinler, şantiye araçları, poligon hedefleri korunur. Ortak Uçangöz, araç/görüş kataloğu, yatay iki elli kontrol ve Türkçe Ahmet sesi. Alanlar geçişle yüklenir; kesintisiz tek arazi değildir.';
fs.writeFileSync('version.json',JSON.stringify(version,null,2)+'\n');
const manifest=JSON.parse(fs.readFileSync('manifest.webmanifest','utf8'));manifest.start_url='./kurulus/';manifest.orientation='landscape';manifest.description='HİSAR Kuruluş: tank, şantiye ve poligon ortak oyun deneyimi';fs.writeFileSync('manifest.webmanifest',JSON.stringify(manifest,null,2)+'\n');
console.log('Build 69 integration complete; original standalone entry points remain usable.');
