'use strict';
const fs=require('node:fs'),vm=require('node:vm');
function edit(f,a,b){const s=fs.readFileSync(f,'utf8');if(s.includes(b))return;if(s.split(a).length!==2)throw Error('Source contract changed: '+f);const n=s.replace(a,b);new vm.Script(n);fs.writeFileSync(f,n);}
edit('scripts/gameplay-integrate.cjs','s=>s.includes("const CACHE=\'hisar-main-v64-gameplay-12\'")||s.includes("hisar-main-v65-operations-13")','s=>s.includes("const CACHE=\'hisar-main-v64-gameplay-12\'")||s.includes("hisar-main-v65-operations-13")||s.includes("experience/simple-settings.js")');
edit('scripts/gameplay-integrate.cjs',"s=>s.includes('const CACHE=fs.readFileSync')","s=>s.includes('const CACHE=fs.readFileSync')||s.includes(\"require('./simple-browser.cjs')\")");
edit('scripts/radio-integrate.cjs',"plan('sw.js',baseline['sw.js'],s=>s.includes('hisar-main-v65-operations-13')","plan('sw.js',baseline['sw.js'],s=>s.includes('hisar-main-v65-operations-13')||s.includes('experience/simple-settings.js')");
if(!fs.readFileSync('scripts/radio-integrate.cjs','utf8').includes('return !!m&&+m[1]>=65')){
edit('scripts/radio-integrate.cjs',"s=>s.includes('const VER=65,LOGO=window.HISAR_LOGO;')","s=>s.includes('const VER=65,LOGO=window.HISAR_LOGO;')||s.includes('const VER=67,LOGO=window.HISAR_LOGO;')");
}
edit('experience/immersive.js','  function speak(message) {','  function speak(message) {\n    if (root.HisarRadioSound?.neural) return state.radioVoice && !doc?.hidden ? root.HisarRadioSound.speak(message) : false;');
edit('experience/immersive.js','  function stop() {','  function stop() {\n    if (root.HisarRadioSound?.neural) root.HisarRadioSound.stop();');
if(!fs.readFileSync('scripts/radio-browser.cjs','utf8').includes('assert.equal(await p.evaluate(()=>APP_VER),GAME_V)')){
edit('scripts/radio-browser.cjs',"const root=process.cwd(),out=","const EXPECTED_VERSION=JSON.parse(fs.readFileSync('version.json','utf8')).v;\nconst root=process.cwd(),out=");
edit('scripts/radio-browser.cjs',"assert.equal(await p.evaluate(()=>APP_VER),65)","assert.equal(await p.evaluate(()=>APP_VER),EXPECTED_VERSION)");
edit('scripts/radio-browser.cjs',"': build 65 and all modules ready'","': build '+EXPECTED_VERSION+' and all modules ready'");
}
edit('scripts/radio-browser.cjs',"ok('offline synthetic male acknowledgement MP3 actually decodes');","assert.equal(audio.source,'microsoft-brian-multilingual-neural');assert.equal(audio.playbackRate,1);ok('Microsoft neural male acknowledgement MP3 decodes at normal 1x speed');");
const manifest=JSON.parse(fs.readFileSync('assets/radio/neural/manifest.json','utf8'));
if(manifest.voice!=='en-US-BrianMultilingualNeural'||manifest.rate!=='+0%'||manifest.pitch!=='+0Hz'||manifest.playbackRate!==1)throw Error('Unverified voice bank');
for(const clip of Object.values(manifest.clips)){if(!/^[-a-z0-9]+\.mp3$/.test(clip.file))throw Error('Invalid clip filename');const p='assets/radio/neural/'+clip.file;const crypto=require('node:crypto');if(crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')!==clip.sha256)throw Error('Voice checksum mismatch');}
fs.copyFileSync('assets/radio/neural/ack.mp3','assets/radio/ack.mp3');
let sw=fs.readFileSync('sw.js','utf8');
const assets=['assets/radio/neural/manifest.json',...Object.values(manifest.clips).map(c=>'assets/radio/neural/'+c.file)];
if(!sw.includes("'assets/radio/neural/manifest.json'"))sw=sw.replace("'assets/radio/ack.mp3'];","'assets/radio/ack.mp3',"+assets.map(x=>"'"+x+"'").join(',')+"];");
if(!sw.includes("'assets/radio/neural/manifest.json'"))throw Error('Worker neural anchor missing');
new vm.Script(sw);fs.writeFileSync('sw.js',sw);
const v=JSON.parse(fs.readFileSync('version.json','utf8'));v.radioVoice='Microsoft Brian Multilingual Neural';v.radioSpeed=1;v.not+=' Microsoft erkek telsiz kayıtları normal konuşma hızında; robotik yedek ses kaldırıldı.';if(v.not.split(' Microsoft erkek telsiz kayıtları').length>2)v.not=v.not.split(' Microsoft erkek telsiz kayıtları')[0]+' Microsoft erkek telsiz kayıtları normal konuşma hızında; robotik yedek ses kaldırıldı.';fs.writeFileSync('version.json',JSON.stringify(v,null,2)+'\n');
console.log('Newer build preserved by old integration scripts; normal-speed neural voice bank connected.');
