'use strict';
const fs=require('node:fs'),crypto=require('node:crypto'),vm=require('node:vm');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const plans=[];
function plan(path,expected,ready,change){const old=fs.readFileSync(path,'utf8');if(ready(old))return;if(hash(old)!==expected)throw Error('Source changed: '+path);const text=change(old);if(path.endsWith('.js'))new vm.Script(text);if(path.endsWith('.json'))JSON.parse(text);plans.push({path,text});}
// Hashes guard the last fully tested source. Never blindly replace a newer build.
const baseline={"index.html":"e32c7d1dd24148e1a6fdec58b1ddf91ca9a16a4a379d0b64ec2ce9aa7b06f693","experience/polish.js":"489469c66fa40ea53ade7dd20ad62e3522395252a51e69910ebb1b15fc387313","sw.js":"97ba7309ca3fb324d9cce1f72cfc993c077ed8a60ecbe019bbd0f6c8f17067f6","version.json":"6de63c764585ccd7fa8400ea016cf977c7a5b00b20c3076891a4ecb880a6da04","scripts/gameplay-integrate.cjs":"135dd4c7d8297876f54e22abbcab1aa36a586ab5965910200632f85fd46ffe58"};
plan('experience/polish.js',baseline['experience/polish.js'],s=>s.includes("load('radio-missions'"),s=>{
 const old="load('gameplay',()=>!!root.HisarGameplay,()=>{})";
 if(!s.includes(old))throw Error('Loader missing');return s.replace(old,"load('gameplay',()=>!!root.HisarGameplay,()=>load('radio-sound',()=>!!root.HisarRadioSound,()=>load('radio-missions',()=>!!root.HisarOperations,()=>{})))").replace("name+'.js?v=1.2.0'","name+'.js?v=1.3.0'");});
plan('sw.js',baseline['sw.js'],s=>s.includes('hisar-main-v65-operations-13'),s=>s.replace('hisar-main-v64-gameplay-12','hisar-main-v65-operations-13').replace("'experience/gameplay.js'];","'experience/gameplay.js','experience/radio-sound.js','experience/radio-missions.js','assets/radio/ack.mp3'];"));
plan('index.html',baseline['index.html'],s=>{const m=s.match(/const VER=(\d+),LOGO=window\.HISAR_LOGO;/);return !!m&&+m[1]>=65},s=>{const from='const VER=64,LOGO=window.HISAR_LOGO;';if(s.split(from).length!==2)throw Error('Version declaration changed');return s.replace(from,'const VER=65,LOGO=window.HISAR_LOGO;');});
plan('version.json',baseline['version.json'],s=>JSON.parse(s).operations==='1.3.0',s=>{const v=JSON.parse(s);v.v=65;v.operations='1.3.0';v.not='Dost tank telsizi: tek tek / tüm birliğe emir, Emredersiniz komutanım yanıtları, çevrimdışı sentetik erkek telsiz sesi; altı farklı hedef akışlı görev. Önceki drone, yeşil termal ve oynanış güncellemeleri bağlı.';v.operationNotes='Karanlıkta Çağrı, Konvoy Yolu, Son İstasyon, Sisli Geçit, Kayıp Kayıt, Kimse Geride Kalmasın. Mikrofon yalnız açık kullanım ve gerekiyorsa çevrimiçi tanıma izniyle çalışır.';return JSON.stringify(v,null,2)+'\n';});
plan('scripts/gameplay-integrate.cjs',baseline['scripts/gameplay-integrate.cjs'],s=>s.includes('hisar-main-v65-operations-13'),s=>s.replace("s=>s.includes(\"const CACHE='hisar-main-v64-gameplay-12'\")","s=>s.includes(\"const CACHE='hisar-main-v64-gameplay-12'\")||s.includes(\"hisar-main-v65-operations-13\")"));
for(const {path,text}of plans)fs.writeFileSync(path,text);
console.log('Operations 1.3 integration: '+plans.length+' files; game build 65.');
