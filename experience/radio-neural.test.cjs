'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const {selectKey}=require('./radio-sound.js');
for(const [text,key]of [
 ['KAPLAN 1-2: Emredersiniz komutanım. Sizi takip ediyorum.','follow'],
 ['Emredersiniz komutanım. Burada bekliyorum.','hold'],
 ['Emredersiniz komutanım. İşaretli oyun hedefine yöneliyorum.','target'],
 ['Emredersiniz komutanım. Anlaşıldı.','free'],
 ['Emredersiniz komutanım. Ateşi kestim.','cease'],
 ['Emredersiniz komutanım. Aralık açıyorum.','spread'],
 ['Emredersiniz komutanım. Geri geliyorum.','back'],
 ['Emredersiniz komutanım. Yanınızda toplanıyorum.','regroup'],
 ['Komutanım, takipteyim. Araç durumu yüzde 80.','status'],
 ['Emredersiniz komutanım. Konvoy bekliyor.','convoy-wait'],
 ['Emredersiniz komutanım. Konvoy devam ediyor.','convoy-go'],
 ['Emredersiniz komutanım.','ack'],
 ['Kayıp ekibin işaretini uçangözle bul.','rescue'],
 ['İstasyondaki iki bağlantıyı onar.','relay'],
 ['Görev tamamlandı.','success']])test('neural clip chosen for '+key,()=>assert.equal(selectKey(text),key));
test('unknown dialogue stays in subtitles instead of substituting robotic speech',()=>{for(const v of ['',null,{},'Tanımsız bir oyun bildirimi'])assert.equal(selectKey(v),null);});
test('54 verified Microsoft Turkish clips use unmodified normal rate and pitch',()=>{const m=JSON.parse(fs.readFileSync('assets/radio/tr/manifest.json','utf8'));assert.equal(m.voice,'tr-TR-AhmetNeural');assert.equal(m.rate,'+0%');assert.equal(m.pitch,'+0Hz');assert.equal(m.playbackRate,1);assert.equal(Object.keys(m.clips).length,54);for(const clip of Object.values(m.clips)){assert.match(clip.file,/^[-a-z0-9]+\.mp3$/);const b=fs.readFileSync('assets/radio/tr/'+clip.file);assert.equal(crypto.createHash('sha256').update(b).digest('hex'),clip.sha256);assert.ok(clip.duration>.5&&clip.duration<45);}});
test('legacy ack URL contains the native Turkish clip, not the earlier English-accented recording',()=>{const h=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');assert.equal(h('assets/radio/ack.mp3'),h('assets/radio/tr/ack.mp3'));});
test('all native Turkish recordings are precached for offline play',()=>{const m=JSON.parse(fs.readFileSync('assets/radio/tr/manifest.json','utf8')),sw=fs.readFileSync('sw.js','utf8');assert.ok(sw.includes("'assets/radio/tr/manifest.json'"));for(const c of Object.values(m.clips))assert.ok(sw.includes("'assets/radio/tr/"+c.file+"'"));});
test('neural playback stays at 1x and uses no pitch effect',()=>{const s=fs.readFileSync('experience/radio-sound.js','utf8');assert.match(s,/playbackRate\.value=1/);assert.doesNotMatch(s,/SpeechSynthesisUtterance|\.detune|createBiquadFilter/);});
test('main dialogue adapter prefers the neural bank',()=>{const calls=[],root={HisarRadioSound:{neural:true,speak:m=>{calls.push(m);return true;},stop:()=>{}}};root.window=root;vm.runInNewContext(fs.readFileSync('experience/immersive.js','utf8'),root);assert.equal(root.HisarImmersive.speak('Emredersiniz komutanım.'),true);assert.deepEqual(calls,['Emredersiniz komutanım.']);root.HisarImmersive.save({radioVoice:false});assert.equal(root.HisarImmersive.speak('Emredersiniz komutanım.'),false);});
