/* HİSAR optional cinematic presentation settings; visual-only, no weapon logic. */
(function(root){'use strict';
 const KEY='hisar-immersive-v1';
 const defaults={greenThermal:true,motionReduction:false,radioVoice:true};
 function normalize(v){v=v&&typeof v==='object'?v:{};return {greenThermal:v.greenThermal!==false,motionReduction:v.motionReduction===true,radioVoice:v.radioVoice!==false};}
 function load(){try{return normalize(JSON.parse(localStorage.getItem(KEY)||'null'));}catch{return normalize({});}}
 let state=load();
 function save(v){state=normalize({...state,...v});try{localStorage.setItem(KEY,JSON.stringify(state));}catch{} apply();return {...state};}
 function apply(){if(!root.document)return;const d=document.documentElement;d.dataset.hisarGreenThermal=String(state.greenThermal);d.dataset.hisarReduceMotion=String(state.motionReduction);}
 function speak(message){if(!state.radioVoice||!root.speechSynthesis||!root.SpeechSynthesisUtterance)return false;
 const s=String(message||'').trim().slice(0,180);if(!s)return false;
 const utterance=new SpeechSynthesisUtterance(s);utterance.lang='tr-TR';utterance.rate=1.05;utterance.pitch=.78;
 const voices=speechSynthesis.getVoices();const male=voices.find(v=>/tr[-_]TR/i.test(v.lang)&&/male|erkek|tolga|cem/i.test(v.name));if(male)utterance.voice=male;
 speechSynthesis.speak(utterance);return !!male;
 }
 apply();
 root.HisarImmersive=Object.freeze({version:'1.0',defaults,normalize,load,save,speak,getSettings:()=>({...state})});
})(typeof window!=='undefined'?window:globalThis);
