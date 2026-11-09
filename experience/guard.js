/* Load before the legacy game: modal typing must never become game shortcuts. */
(function(){'use strict';const held=new Map();
 function modal(){const el=document.getElementById('hisar-experience');return el&&el.open;}
 addEventListener('keydown',e=>{
  if(modal()){
   if(e.key==='Escape'){e.preventDefault();if(window.HisarExperience)window.HisarExperience.close();}
   e.stopImmediatePropagation();return;
  }
  held.set(e.code,{key:e.key,code:e.code,keyCode:e.keyCode});
 },true);
 addEventListener('keyup',e=>{held.delete(e.code);if(modal())e.stopImmediatePropagation();},true);
 window.HisarInputGuard={release(){const keys=[...held.values()];held.clear();for(const key of keys)dispatchEvent(new KeyboardEvent('keyup',{...key,bubbles:true}));dispatchEvent(new Event('blur'));}};
})();
