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
 if(!male)return false;utterance.voice=male;
 try{speechSynthesis.cancel();speechSynthesis.speak(utterance);return true;}catch{return false;}
 }
 function installPanel(){if(!root.document||document.getElementById('hisar-immersive-settings'))return false;
 const panel=document.createElement('section');panel.id='hisar-immersive-settings';panel.setAttribute('aria-label','HİSAR görüntü ve ses tercihleri');
 panel.style.cssText='position:fixed;right:12px;bottom:12px;z-index:9999;background:#10191eea;color:#fff;border:1px solid #6b8b87;border-radius:12px;padding:10px;font:13px system-ui;max-width:min(300px,90vw)';
 const toggle=document.createElement('button');toggle.type='button';toggle.textContent='Görüntü ve Ses';toggle.setAttribute('aria-expanded','false');toggle.style.cssText='background:#243b40;color:white;border:0;padding:8px 12px;border-radius:8px;cursor:pointer';panel.appendChild(toggle);
 const fields=document.createElement('div');fields.hidden=true;fields.style.cssText='display:grid;gap:8px;margin-top:8px';
 toggle.addEventListener('click',()=>{fields.hidden=!fields.hidden;fields.style.display=fields.hidden?'none':'grid';toggle.setAttribute('aria-expanded',String(!fields.hidden));});fields.style.display='none';
 for(const [key,label] of [['greenThermal','Yeşil gece görüş teması'],['motionReduction','Kamera hareketini azalt'],['radioVoice','Erkek telsiz sesi (varsa)']]){
 const row=document.createElement('label');row.style.cssText='display:flex;align-items:center;gap:8px';const input=document.createElement('input');input.type='checkbox';input.checked=state[key];input.addEventListener('change',()=>save({[key]:input.checked}));row.append(input,document.createTextNode(label));fields.appendChild(row);}
 panel.appendChild(fields);document.body.appendChild(panel);return true;}
 apply();
 if(root.document){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installPanel,{once:true});else installPanel();}
 root.HisarImmersive=Object.freeze({version:'1.0',defaults,normalize,load,save,speak,installPanel,getSettings:()=>({...state})});
})(typeof window!=='undefined'?window:globalThis);
