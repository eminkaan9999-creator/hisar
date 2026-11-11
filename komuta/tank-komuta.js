/* Complete original tank game, loaded at the garage, with no original-app navigation. */
(function(){'use strict';const H=window.parent?.KomutaHost;if(!H||window.parent===window)return;document.documentElement.classList.add('komuta-tank');let paused=false,wasPlaying=false,done=false;
const timer=setInterval(()=>{if(typeof game==='undefined'||!window.HisarGameBridge?.snapshot().ready)return;clearInterval(timer);
const api={owner:window,pause(v){paused=!!v;try{if(v){wasPlaying=game==='play';if(wasPlaying)game='pause';if(typeof keys==='object')Object.keys(keys).forEach(k=>keys[k]=0);HISAR_AUDIO_STOP();}else if(wasPlaying&&game==='pause')game='play';}catch{}},sound(v){try{sndOn=v?1:0;SV.voice=v?1:0;SV.radioV=v?1:0;}catch{}},snapshot:()=>({}),canLeave:()=>typeof DR==='undefined'||!DR.on,dispose(){done=true;try{game='menu';HISAR_AUDIO_STOP();}catch{}},diagnostics:()=>({ready:true,paused,vehicles:typeof MODELS==='undefined'?null:Object.keys(MODELS).length})};window.KomutaScene=api;H.connect('tank',api);},100);
function HISAR_AUDIO_STOP(){try{window.HisarRadioSound?.stop();window.HisarImmersive?.stop?.();}catch{}}
setTimeout(()=>{if(!window.KomutaScene){clearInterval(timer);H.notice('Tank alanı hazırlanamadı. Üsse dönüp yeniden dene.');}},25000);
})();
