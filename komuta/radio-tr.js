/* Pre-recorded Microsoft Ahmet native Turkish, normal speed.
 * Fixed game dialogue only; no microphone upload, no robotic voice substitution. */
(function(root){'use strict';
const normalize=t=>typeof t==='string'?t.toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i'):'';
function selectKey(text){const t=normalize(text);if(!t.trim())return null;
 for(const [key,re]of [['status',/arac durumu yuzde|durum rapor/],['convoy-wait',/konvoy bekliyor/],['convoy-go',/konvoy devam ediyor/],['follow',/sizi takip ediyorum/],['hold',/burada bekliyorum/],['target',/isaretli (oyun )?hedef[ei]ne yoneliyorum/],['cease',/atesi kestim/],['spread',/aralik aciyorum/],['back',/geri geliyorum/],['regroup',/yaninizda toplaniyorum/],['free',/emredersiniz.*anlasildi/],['ack',/emredersiniz/],['rescue',/kayip ekibin isaretini/],['convoy',/ikmal araci yalniz/],['relay',/istasyondaki iki baglantiyi/],['fog',/yagmurda uc kontrol/],['record',/uc ayri isareti/],['return',/ileri noktaya ekibinle/],['success',/gorev tamamlandi|basardik/],['failure',/gorev basarisiz|tekrar deneyebilir/],['reload',/yeniden dolduruluyor|yukleniyor/],['hit',/hedef vuruldu/],['drone',/ucangoz (hazir|havada)/],['damage',/vurulduk|isabet aldik|arac hasar aldi/],['ready',/birlik hazir/],['rest',/bolge temiz/],['ground',/yeni bir kara hedefi/],['air',/sirada tek bir helikopter/],['phase',/asama tamamlandi/]])if(re.test(t))return key;
 return null;}
if(typeof module==='object'&&module.exports)module.exports={selectKey,normalize};
const doc=root.document;if(!doc||root.HisarRadioSound)return;
const base=new URL('assets/radio/tr/',doc.currentScript?.src||new URL('experience/radio-sound.js',doc.baseURI));
let ctx,manifest,pendingManifest,active=null,epoch=0,lastKey=null;const queue=[],buffers=new Map(),loading=new Map();
const allowed=()=>!doc.hidden&&(typeof sndOn==='undefined'||sndOn!==0)&&(typeof SV==='undefined'||(SV.voice!==0&&SV.radioV!==0));
function context(){if(!ctx)ctx=typeof AC!=='undefined'&&AC?AC:new(root.AudioContext||root.webkitAudioContext)();return ctx;}
async function loadManifest(){if(manifest)return manifest;if(!pendingManifest)pendingManifest=root.fetch(new URL('manifest.json',base),{credentials:'same-origin'}).then(r=>{if(!r.ok)throw Error('voice manifest unavailable');return r.json();}).then(m=>{if(m.voice!=='tr-TR-AhmetNeural'||m.playbackRate!==1||!m.clips)throw Error('unexpected voice manifest');manifest=m;return m;}).catch(()=>{pendingManifest=null;return null;});return pendingManifest;}
async function load(key){if(buffers.has(key))return buffers.get(key);if(loading.has(key))return loading.get(key);
 const p=(async()=>{try{const m=await loadManifest(),clip=m?.clips?.[key];if(!clip||!/^[-a-z0-9]+\.mp3$/.test(clip.file))return null;const r=await root.fetch(new URL(clip.file,base),{credentials:'same-origin'});if(!r.ok)return null;const b=await context().decodeAudioData(await r.arrayBuffer());buffers.set(key,b);return b;}catch{return null;}finally{loading.delete(key);}})();loading.set(key,p);return p;}
async function warm(){try{const c=context();if(c.state==='suspended')await c.resume();return await load('ack');}catch{return null;}}
async function drain(){if(active||!queue.length||!allowed())return;const item=queue.shift(),token=epoch,record={item,node:null};active=record;
 try{const c=context();if(c.state==='suspended')await c.resume();const buffer=await load(item.key);if(token!==epoch||active!==record)return;if(!buffer||!allowed()||c.state!=='running'){active=null;drain();return;}
 const node=c.createBufferSource(),gain=c.createGain();record.node=node;node.buffer=buffer;node.playbackRate.value=1;gain.gain.value=.85;node.connect(gain);gain.connect(c.destination);lastKey=item.key;
 node.onended=()=>{gain.disconnect();node.disconnect();if(token===epoch&&active===record){active=null;drain();}};node.start();
 }catch{if(token===epoch){active=null;queue.length=0;}}}
function speak(text){const key=selectKey(text);if(!key||!allowed()||queue.length>=4)return false;const id=String(text).slice(0,180);if(active?.item.id===id||queue.some(i=>i.id===id))return false;queue.push({key,id});drain();return true;}
async function play(){return speak('Emredersiniz komutanım.');}
function stop(){epoch++;queue.length=0;const old=active;active=null;try{old?.node?.stop();}catch{}}
root.HisarRadioSound=Object.freeze({neural:true,warm,play,speak,stop,selectKey,diagnostics:()=>({ready:buffers.has('ack'),queued:queue.length,playing:!!active,source:'microsoft-ahmet-turkish-neural',playbackRate:1,loaded:buffers.size,lastKey})});
root.addEventListener('blur',stop);root.addEventListener('pagehide',stop);doc.addEventListener('visibilitychange',()=>{if(doc.hidden)stop();});
})(typeof window!=='undefined'?window:globalThis);
