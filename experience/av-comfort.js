/* HİSAR optional audiovisual comfort module. Does not modify weapon or targeting logic. */
(function(root){'use strict';
 const KEY='hisar-av-comfort-v1';
 const defaults={maleRadio:true,radioVolume:.65,greenThermal:true,reduceMotion:false};
 let opts={...defaults};try{opts={...opts,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{}
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,Number.isFinite(Number(x))?Number(x):a));
 function save(change){opts={...opts,...change};opts.radioVolume=clamp(opts.radioVolume,0,1);try{localStorage.setItem(KEY,JSON.stringify(opts))}catch{}apply();return {...opts}}
 function apply(){document.documentElement.classList.toggle('hisar-green-thermal',!!opts.greenThermal);document.documentElement.classList.toggle('hisar-reduce-motion',!!opts.reduceMotion)}
 function radio(message){if(!opts.maleRadio||!('speechSynthesis'in root)||!('SpeechSynthesisUtterance'in root))return false;
  const s=String(message||'').trim().slice(0,180);if(!s)return false;
  const utter=new SpeechSynthesisUtterance(s);utter.lang='tr-TR';utter.rate=1.03;utter.pitch=.82;utter.volume=clamp(opts.radioVolume,0,1);
  const voices=root.speechSynthesis.getVoices();const turkish=voices.filter(v=>v.lang.toLowerCase().startsWith('tr'));
  const male=turkish.find(v=>/male|erkek|ahmet|cem|emre|murat/i.test(v.name));if(male)utter.voice=male;else if(turkish[0])utter.voice=turkish[0];
  root.speechSynthesis.speak(utter);return true;
 }
 function stopRadio(){try{root.speechSynthesis.cancel()}catch{}}
 function init(){apply();const style=document.createElement('style');style.textContent=`
 .hisar-green-thermal [data-hisar-camera="thermal"],.hisar-green-thermal .hisar-thermal-view{filter:grayscale(1) sepia(1) hue-rotate(62deg) saturate(3) contrast(1.25)!important}
 .hisar-reduce-motion [data-hisar-camera],.hisar-reduce-motion .hisar-camera-transition{transition-duration:.08s!important;animation-duration:.08s!important}
 `;document.head.appendChild(style);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
 root.HisarAV=Object.freeze({getSettings:()=>({...opts}),set:save,radio,stopRadio,version:'1.0'});
})(window);
