/* Offline synthetic Turkish male acknowledgement. Generated with eSpeak tr+m3,
 * not an actor recording. Full replies use a local Turkish male TTS when present. */
(function(root){'use strict';if(root.HisarRadioSound)return;
const doc=root.document,base=new URL('../assets/radio/ack.mp3',doc.currentScript?.src||doc.baseURI);let ctx,buffer,loading,source,pending=0,epoch=0;
function context(){if(ctx)return ctx;ctx=typeof AC!=='undefined'&&AC?AC:new (root.AudioContext||root.webkitAudioContext)();return ctx;}
async function warm(){try{const c=context();if(c.state==='suspended')await c.resume();if(!loading)loading=root.fetch(base,{credentials:'same-origin'}).then(r=>{if(!r.ok)throw Error('audio');return r.arrayBuffer();}).then(b=>c.decodeAudioData(b)).then(b=>{buffer=b;return b;}).catch(()=>{loading=null;return null;});return await loading;}catch{return null;}}
function drain(){if(source||!pending||!buffer||doc.hidden||ctx?.state!=='running')return;pending--;const token=epoch;try{source=ctx.createBufferSource();source.buffer=buffer;const gain=ctx.createGain();gain.gain.value=.65;source.connect(gain);gain.connect(ctx.destination);source.onended=()=>{gain.disconnect();if(token===epoch){source=null;drain();}};source.start();}catch{source=null;pending=0;}}
async function play(){if(doc.hidden)return false;const token=epoch;pending=Math.min(4,pending+1);await warm();if(token!==epoch)return false;if(!buffer){pending=0;return false;}drain();return true;}
function stop(){epoch++;pending=0;const s=source;source=null;try{s?.stop();}catch{}}
root.HisarRadioSound=Object.freeze({warm,play,stop,diagnostics:()=>({ready:!!buffer,queued:pending,playing:!!source,source:'offline-espeak-tr-male'})});root.addEventListener('blur',stop);root.addEventListener('pagehide',stop);doc.addEventListener('visibilitychange',()=>{if(doc.hidden)stop();});
})(window);
