/* HİSAR optional cinematic presentation settings; visual-only, no weapon logic. */
(function(root){'use strict';
 const KEY='hisar-immersive-v1';
 const defaults={greenThermal:true,motionReduction:false,radioVoice:true};
 function normalize(v){v=v&&typeof v==='object'?v:{};return {greenThermal:v.greenThermal!==false,motionReduction:v.motionReduction===true,radioVoice:v.radioVoice!==false};}
 function load(){try{return normalize(JSON.parse(root.localStorage.getItem(KEY)||'null'));}catch{return normalize({});}}
 let state=load();
 function save(v){state=normalize({...state,...v});try{root.localStorage.setItem(KEY,JSON.stringify(state));}catch{} apply();return {...state};}
 function apply(){if(!root.document)return;const d=document.documentElement;d.dataset.hisarGreenThermal=String(state.greenThermal);d.dataset.hisarReduceMotion=String(state.motionReduction);d.dataset.hisarRadioVoice=String(state.radioVoice);if(typeof root.Event==='function')root.document.dispatchEvent(new root.Event('hisar:immersive-settings'));}
 function speak(message){if(!state.radioVoice||!root.speechSynthesis||!root.SpeechSynthesisUtterance)return false;
 const s=String(message||'').trim().slice(0,180);if(!s)return false;
 const utterance=new root.SpeechSynthesisUtterance(s);utterance.lang='tr-TR';utterance.rate=1.05;utterance.pitch=.78;
 const voices=typeof root.speechSynthesis.getVoices==='function'?(root.speechSynthesis.getVoices()||[]):[];const male=voices.find(v=>/tr[-_]TR/i.test(v.lang)&&/male|erkek|tolga|cem/i.test(v.name));if(!male)return false;utterance.voice=male;
 try{if(typeof root.speechSynthesis.cancel==='function')root.speechSynthesis.cancel();root.speechSynthesis.speak(utterance);return true;}catch{return false;}
 }

 function addPresentationStyles(){if(!root.document||document.getElementById('hisar-immersive-style'))return;
 const style=document.createElement('style');style.id='hisar-immersive-style';style.textContent=`
 #hisar-immersive-settings{box-shadow:0 10px 32px #0008;backdrop-filter:blur(12px)}
 #hisar-immersive-settings button:focus-visible,#hisar-immersive-settings input:focus-visible{outline:2px solid #9fe9d7;outline-offset:3px}
 @media(max-width:600px){#hisar-immersive-settings{right:calc(8px + env(safe-area-inset-right));bottom:calc(8px + env(safe-area-inset-bottom));max-width:calc(100vw - 32px);font-size:14px!important}}
 @media(prefers-reduced-motion:reduce){#hisar-immersive-settings *{animation:none!important;transition:none!important}}
 html[data-hisar-reduce-motion="true"] #hisar-immersive-settings *{animation:none!important;transition:none!important}
 `;document.head.appendChild(style);}
 function installPanel(){if(!root.document||document.getElementById('hisar-immersive-settings'))return false;
 addPresentationStyles();const panel=document.createElement('section');panel.id='hisar-immersive-settings';panel.setAttribute('aria-label','HİSAR görüntü ve ses tercihleri');
 panel.style.cssText='position:fixed;right:12px;bottom:12px;z-index:9999;background:#10191eea;color:#fff;border:1px solid #6b8b87;border-radius:12px;padding:10px;font:13px system-ui;max-width:min(300px,90vw)';
 const toggle=document.createElement('button');toggle.type='button';toggle.textContent='Görüntü ve Ses';toggle.setAttribute('aria-expanded','false');toggle.style.cssText='background:#243b40;color:white;border:0;padding:8px 12px;border-radius:8px;cursor:pointer';panel.appendChild(toggle);
 const fields=document.createElement('div');fields.hidden=true;fields.style.cssText='display:grid;gap:8px;margin-top:8px';
 toggle.addEventListener('click',()=>{fields.hidden=!fields.hidden;fields.style.display=fields.hidden?'none':'grid';toggle.setAttribute('aria-expanded',String(!fields.hidden));});fields.style.display='none';
 for(const [key,label] of [['greenThermal','Yeşil gece görüş teması'],['motionReduction','Kamera hareketini azalt'],['radioVoice','Erkek telsiz sesi (varsa)']]){
 const row=document.createElement('label');row.style.cssText='display:flex;align-items:center;gap:8px';const input=document.createElement('input');input.type='checkbox';input.checked=state[key];input.addEventListener('change',()=>save({[key]:input.checked}));row.append(input,document.createTextNode(label));fields.appendChild(row);}
 panel.appendChild(fields);const settings=document.getElementById('hx-settings');if(settings){panel.style.cssText='position:relative;max-width:100%;background:#10191e;color:#fff;border:1px solid #6b8b87;border-radius:12px;padding:10px;font:13px system-ui';settings.appendChild(panel);}else{document.body.appendChild(panel);}return true;}
 apply();
 if(root.document){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installPanel,{once:true});else installPanel();document.addEventListener('hisar:ui-ready',()=>{const settings=document.getElementById('hx-settings'),panel=document.getElementById('hisar-immersive-settings');if(settings&&panel&&panel.parentNode!==settings){panel.style.cssText='position:relative;max-width:100%;background:#10191e;color:#fff;border:1px solid #6b8b87;border-radius:12px;padding:10px;font:13px system-ui';settings.appendChild(panel);}});}
 root.HisarImmersive=Object.freeze({version:'1.0',defaults,normalize,load,save,speak,installPanel,addPresentationStyles,getSettings:()=>({...state})});
})(typeof window!=='undefined'?window:globalThis);
