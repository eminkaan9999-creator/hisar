/* Explicit adapter to the existing simulator; no physics/weapon changes. */
(function(){'use strict';
 const safe=(fn,fallback)=>{try{return fn();}catch{return fallback;}};
 window.HisarGameBridge=Object.freeze({
  snapshot:()=>safe(()=>({ready:typeof R!=='undefined'&&!!R,state:typeof game==='string'?game:'unknown',quality:typeof qlv==='string'?qlv:'unknown',auto:typeof AQ==='number'?!!AQ:true,ratio:typeof R!=='undefined'?R.getPixelRatio():1,xp:typeof SV!=='undefined'?SV.xp:0,credits:typeof SV!=='undefined'?SV.kr:0}),{ready:false,state:'unknown',ratio:1,xp:0,credits:0}),
  pause:()=>safe(()=>{const resume=game==='play';if(resume)openMenu();return resume;},false),
  resume:()=>safe(()=>{if(game==='pause')closeMenu();},undefined),
  quality:q=>safe(()=>{if(!['dusuk','orta','yuksek'].includes(q)||typeof setQ!=='function')return false;if(typeof PRS==='number')PRS=1;if(typeof lowN==='number')lowN=0;setQ(q);return true;},false),
  auto:on=>safe(()=>{if(typeof AQ==='undefined')return false;AQ=on?1:0;return true;},false),
  onFrame:fn=>safe(()=>{if(typeof FRAME_HOOKS==='undefined'||!Array.isArray(FRAME_HOOKS))return false;FRAME_HOOKS.push(fn);return true;},false)
 });
})();
