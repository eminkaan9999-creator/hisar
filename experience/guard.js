/* Loaded before the game: dialog typing must not become gameplay input. */
/* Yapı damgası: sayfa (index.html) bu sayıyı kendi yapı numarasıyla karşılaştırır. Farklıysa bölümler önbellekten eski gelmiştir; sayfa eski hizmet
   işçisini bırakıp kendini bir kez yeniden yükler (index.html, "Sürüm tutarlılığı"). Her sürümde VER ile birlikte artırılır. */
window.HISAR_BUILD=117;
(function(){'use strict';const held=new Map();
 function modal(){const el=document.getElementById('hisar-experience');return el&&el.open;}
 addEventListener('keydown',e=>{if(modal()){if(e.key==='Escape'){e.preventDefault();window.HisarExperience?.close();}e.stopImmediatePropagation();return;}
  const target=e.target,editing=target&&target.closest&&target.closest('input,select,textarea,[contenteditable="true"]');
  if(editing&&!['Tab','Escape','F2'].includes(e.key)){e.stopImmediatePropagation();return;}
  if(e.code==='Space'&&target&&target.closest&&target.closest('#menu button,#hk-brief button,#rep button,#rep2 button,#hr-panel button')){e.stopImmediatePropagation();return;}
  held.set(e.code,{key:e.key,code:e.code,keyCode:e.keyCode});},true);
 addEventListener('keyup',e=>{held.delete(e.code);if(modal())e.stopImmediatePropagation();},true);
 window.HisarInputGuard={release(){const values=[...held.values()];held.clear();for(const key of values)dispatchEvent(new KeyboardEvent('keyup',{...key,bubbles:true}));dispatchEvent(new Event('hisar:release-inputs'));}};
})();
/* Dokunma: oyun sırasında bir parmak kumanda çubuğundayken telefon öteki parmağın dokunuşu için "click" üretmez (iOS ve Android böyledir); yalnız
   click dinleyen düğmeler (TELSİZ, telsiz panelindeki KAPAT ve emirler, ROTAYI KAPAT gibi bağlam düğmeleri) dokunulmaz olur. Oyun sırasında her
   düğme için parmak kalkınca click burada üretilir; ardından telefonun kendi click'i gelirse yutulur (çift tetik olmaz). Fare etkilenmez.
   Kendi yardımcısı olan düğmeler (görüş çubuğu: _mob) ellenmez. */
(function(){'use strict';const downs=new Map(),MOVE=16,SWALLOW=4000,NEAR=26;let at=0,px=0,py=0;
 const playing=()=>{try{return game==='play';}catch(e){return false;}};
 const btn=t=>{const b=t&&t.closest?t.closest('button'):null;if(!b||b.disabled)return null;for(let q=b;q;q=q.parentElement)if(q._mob)return null;return b;};
/* yeni bir dokunuş başladıysa önceki dokunuşun click'i artık gelmez: bekleme biter */
 function down(e){if(e.isTrusted!==false)at=0;if(e.pointerType==='mouse'||!playing())return;const b=btn(e.target);if(b)downs.set(e.pointerId,{b,x:e.clientX,y:e.clientY});else downs.delete(e.pointerId);}
 function up(e){const d=downs.get(e.pointerId);if(!d)return;downs.delete(e.pointerId);if(e.pointerType==='mouse'||!playing())return;
  /* parmak düğmenin üstünde kalkmalı (yakalanan dokunuşta hedef düğme olmayabilir: konuma bakılır) ve kaymamış olmalı */
  if(Math.hypot(e.clientX-d.x,e.clientY-d.y)>MOVE||!d.b.isConnected||d.b.disabled)return;const r=d.b.getBoundingClientRect();if(e.clientX<r.left-4||e.clientX>r.right+4||e.clientY<r.top-4||e.clientY>r.bottom+4)return;
  at=performance.now();px=e.clientX;py=e.clientY;d.b.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window,clientX:e.clientX,clientY:e.clientY}));}
 /* telefonun aynı dokunuş için ardından ürettiği click bir kez yutulur. Düğme o arada değişmiş bir ekranın altında kalmış olabilir (hayalet
    tıklama), bu yüzden hedefe değil konuma bakılır; telefon meşgulse click geç gelebilir, bu yüzden süre uzundur ama bekleme yeni bir dokunuş
    başlayınca biter. Klavyeyle verilen click (detail 0) yutulmaz. */
 function click(e){if(!e.isTrusted||e.detail===0||!at||performance.now()-at>SWALLOW)return;if(Math.hypot(e.clientX-px,e.clientY-py)<=NEAR){at=0;e.stopImmediatePropagation();e.preventDefault();}}
 addEventListener('pointerdown',down,true);addEventListener('pointerup',up,true);addEventListener('pointercancel',e=>downs.delete(e.pointerId),true);addEventListener('click',click,true);
 window.HisarTap={MOVE,SWALLOW,NEAR,down,up,click,pending:()=>downs.size,last:()=>({at,x:px,y:py})};
})();
