/* HİSAR 63.1: presentation and input lifecycle. No weapon or mission physics changes. */
(function(root){
 'use strict';
 const KEY='hisar-polish-v1';
 const defaults=Object.freeze({smoothCamera:true,reduceShake:false,filmic:false,exposure:1,textureDetail:true,muteBackground:true,idleRendering:true});
 const number=(v,d)=>{try{const n=Number(v);return Number.isFinite(n)?n:d;}catch{return d;}};
 const bound=(v,a,b,d)=>Math.max(a,Math.min(b,number(v,d)));
 function settings(v){v=v&&typeof v==='object'?v:{};return {smoothCamera:v.smoothCamera!==false,reduceShake:v.reduceShake===true,filmic:v.filmic===true,exposure:bound(v.exposure,.7,1.4,1),textureDetail:v.textureDetail!==false,muteBackground:v.muteBackground!==false,idleRendering:v.idleRendering!==false};}
 function alpha(dt,rate=16){return 1-Math.exp(-bound(rate,1,60,16)*bound(dt,0,.25,0));}
 function textureLevel(quality,max){return Math.min(bound(max,1,16,1),quality==='yuksek'?8:quality==='orta'?4:1);}
 const api=Object.freeze({version:'63.1',defaults,settings,alpha,textureLevel});
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(!root.document)return;
 if(root.HisarPolish)return;
 let opts,storageOK=true;
 try{opts=settings(JSON.parse(localStorage.getItem(KEY)||'null'));}catch{opts=settings({});storageOK=false;}
 const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)');
 let ready=typeof R!=='undefined'&&typeof CAM!=='undefined'&&typeof THREE!=='undefined';
 const css=`
 :root{--hisar-vh:100vh;--hisar-vtop:0px}
 @supports(height:100dvh){:root{--hisar-vh:100dvh}}
 #menu{height:var(--hisar-vh)!important;top:var(--hisar-vtop)!important;bottom:auto!important}
 #menu #mp{touch-action:pan-y;min-height:0;min-width:0;overflow-y:auto!important;overflow-x:hidden!important;max-height:calc(var(--hisar-vh) - 20px)!important;overscroll-behavior:contain;scroll-padding-bottom:100px}
 #menu .hd{min-width:0;gap:10px}#menu .hd h1{min-width:0;overflow-wrap:anywhere}#menu #rb2{white-space:normal;max-width:40%;overflow-wrap:anywhere}
 #menu .row button,#menu .up>span{min-width:0;overflow-wrap:anywhere}#menu .row button{white-space:normal}
 #menu .grid,#menu .grid3{grid-template-columns:repeat(2,minmax(0,1fr))}
 #menu .tabs{scroll-padding-inline:12px}#menu button:focus-visible{outline:3px solid #8cf0d9;outline-offset:2px}
 #hisar-experience{top:calc(var(--hisar-vtop) + 8px)!important;bottom:auto!important;max-height:calc(var(--hisar-vh) - 16px)!important;margin:0 auto!important;scroll-padding-block:12px}
 #hx-polish{margin-top:18px;padding-top:12px;border-top:1px solid #3e6871}
 #hx-polish .hx-polish-range{display:flex;align-items:center;gap:10px;max-width:55%}
 #hx-polish input[type=range]{width:140px;max-width:100%;height:28px;flex:1;min-width:50px;accent-color:#6edcc5}
 #hx-polish output{font-size:12px;min-width:36px;text-align:right}
 #hx-polish legend{padding:0;font-size:17px;font-weight:700}#hx-polish fieldset{border:0;margin:0;padding:0;min-width:0}
 #hx-polish select{max-width:55%}#hx-polish-note{font-size:12px;color:#a9c4ce}
 body.hisar-comfort #go:after,body.hisar-comfort .logo{animation:none!important}
 @media(max-width:640px),(max-height:520px){#menu #mp{height:var(--hisar-vh)!important;max-height:var(--hisar-vh)!important}#menu .acts{position:sticky!important;bottom:0;flex-wrap:wrap;gap:8px}#menu .acts button{min-height:44px;min-width:0}#menu .tabs button{min-height:44px}#hisar-experience-entry{margin:8px auto;min-height:44px}}
 @media(max-width:360px){#menu .hd h1{font-size:15px!important}#menu .hd h1 small{letter-spacing:1px!important}#menu #rb2{font-size:10px;max-width:30%;padding:4px}#menu .hd .logo{width:42px!important;height:42px!important}#menu .row.grid3{grid-template-columns:repeat(2,minmax(0,1fr))!important}#menu #updBox{flex-wrap:wrap!important}#menu #updI{max-width:100%!important}#menu #ld .am2{gap:6px;padding:8px 6px}#menu #ld .am2 .st button{width:32px;height:40px}#menu #ld .am2 .tx b{font-size:12px}#menu #ld .am2 .tx small{white-space:normal}}
 @media(max-height:500px) and (orientation:landscape){#menu .hd .logo{width:36px!important;height:36px!important}#menu .hd h1{font-size:16px!important}#menu #mt{display:none}#menu #hisar-experience-entry{padding:6px;min-height:36px;margin:4px auto}#menu #updBox{margin:2px 0!important}#menu .row.grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}#menu .acts{padding-top:8px!important;padding-bottom:max(8px,env(safe-area-inset-bottom))!important}}
 @media(prefers-reduced-motion:reduce){#menu *,#hisar-experience *{animation:none!important;transition:none!important;scroll-behavior:auto!important}}
 `;
 const style=document.createElement('style');style.id='hisar-polish-styles';style.textContent=css;document.head.appendChild(style);
 function viewport(){const v=root.visualViewport;const h=v?Math.min(innerHeight,v.height):innerHeight;document.documentElement.style.setProperty('--hisar-vh',Math.max(120,h)+'px');document.documentElement.style.setProperty('--hisar-vtop',(v?v.offsetTop:0)+'px');}
 viewport();addEventListener('resize',viewport);if(root.visualViewport){visualViewport.addEventListener('resize',viewport);visualViewport.addEventListener('scroll',viewport);}
 const held=new Map();let releasing=false;
 addEventListener('pointerdown',e=>{if(e.target&&e.target.dispatchEvent)held.set(e.pointerId,e.target);},true);
 addEventListener('pointerup',e=>held.delete(e.pointerId),true);
 addEventListener('pointercancel',e=>{held.delete(e.pointerId);if(!releasing&&ready&&e.target===R.domElement)clearInputs();},true);
 function clearInputs(){if(releasing)return;releasing=true;try{
  for(const[id,target]of held){try{target.dispatchEvent(new PointerEvent('pointercancel',{pointerId:id,bubbles:true}));}catch{}}held.clear();
  if(typeof keys!=='undefined')for(const k of Object.keys(keys))keys[k]=0;
  if(typeof joy!=='undefined'){joy.x=0;joy.y=0;}
  if(typeof jid!=='undefined')jid=null;if(typeof lid!=='undefined')lid=null;
  if(typeof hold!=='undefined')hold=0;if(typeof sv!=='undefined')sv=0;
  if(typeof gix!=='undefined')gix=0;if(typeof giy!=='undefined')giy=0;if(typeof gv!=='undefined')gv=0;
  if(root.CRUISE)CRUISE.on=0;
 }finally{releasing=false;}}
 addEventListener('hisar:release-inputs',clearInputs);
 let audioSuspended=false;
 function suspendAudio(){if(!opts.muteBackground)return;try{if(typeof AC!=='undefined'&&AC&&AC.state==='running'){audioSuspended=true;Promise.resolve(AC.suspend()).catch(()=>{});}}catch{}}
 function resumeAudio(){if(document.hidden||!audioSuspended)return;try{if(typeof AC!=='undefined'&&AC){Promise.resolve(AC.resume()).then(()=>{audioSuspended=false;}).catch(()=>{});}}catch{}}
 function leave(){clearInputs();if(ready&&typeof game!=='undefined'&&game==='play'&&typeof openMenu==='function')openMenu();suspendAudio();}
 addEventListener('blur',leave);addEventListener('pagehide',leave);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)leave();});
 addEventListener('pointerdown',resumeAudio,true);addEventListener('keydown',resumeAudio,true);
 if(ready&&typeof openMenu==='function'){const original=openMenu;root.openMenu=function(){clearInputs();
  if(typeof document.exitPointerLock==='function')return original.apply(this,arguments);
  if(game==='play')game='pause';const menu=document.getElementById('menu'),resume=document.getElementById('rs'),start=document.getElementById('go');if(menu)menu.style.display='flex';if(resume)resume.style.display=game==='pause'?'':'none';if(start)start.textContent=game==='pause'?'↻ YENİ GÖREV':'▶ BAŞLAT';
 };}
 const textureOriginal=new WeakMap();let texturesChanged=0,lastQ=null,textureTimer=0;
 function textures(){if(!ready)return;const max=R.capabilities?.getMaxAnisotropy?.()||1;const level=textureLevel(typeof qlv==='string'?qlv:'orta',max);const seen=new Set();texturesChanged=0;
  S.traverse(o=>{for(const m of(Array.isArray(o.material)?o.material:[o.material])){if(!m)continue;for(const key of ['map','normalMap','roughnessMap','metalnessMap']){const t=m[key];if(!t?.isTexture||seen.has(t))continue;seen.add(t);if(!textureOriginal.has(t))textureOriginal.set(t,t.anisotropy||1);const n=opts.textureDetail?level:textureOriginal.get(t);if(t.anisotropy!==n){t.anisotropy=n;t.needsUpdate=true;texturesChanged++;}}}});
 }
 function queueTextures(){clearTimeout(textureTimer);textureTimer=setTimeout(textures,80);}
 if(ready&&typeof setQ==='function'){const original=setQ;root.setQ=function(){const r=original.apply(this,arguments);queueTextures();return r;};}
 if(ready&&typeof reset==='function'){const original=reset;root.reset=function(){clearInputs();cameraState='';const r=original.apply(this,arguments);queueTextures();return r;};}
 let cameraFrames=0,cameraState='',cameraTime=0;
 if(ready&&typeof camUpdate==='function'){
  const previousPosition=new THREE.Vector3(),previousRotation=new THREE.Quaternion(),original=camUpdate;
  root.camUpdate=function(){const now=performance.now(),dt=(now-cameraTime)/1000;cameraTime=now;const oldShake=typeof shake==='number'?shake:0;
   try{if(opts.reduceShake&&typeof shake==='number')shake=oldShake*.2;original.apply(this,arguments);}finally{if(typeof shake==='number')shake=oldShake;}
   const eligible=opts.smoothCamera&&!reduceMotion.matches&&game==='play'&&mode==='tank'&&iv===0&&!root.mapOpen&&!root.PHOTO?.on&&!root.BCAM?.on&&!(typeof kc!=='undefined'&&kc.t>0);
   const state=String(mode)+'|'+String(iv)+'|'+String(eligible);
   if(eligible&&state===cameraState&&dt>0&&dt<.25&&previousPosition.distanceToSquared(CAM.position)<2500){const a=alpha(dt);previousPosition.lerp(CAM.position,a);previousRotation.slerp(CAM.quaternion,a);CAM.position.copy(previousPosition);CAM.quaternion.copy(previousRotation);cameraFrames++;}
   else{previousPosition.copy(CAM.position);previousRotation.copy(CAM.quaternion);}cameraState=state;
  };
 }
 let originalTone=ready?R.toneMapping:0,originalExposure=ready?R.toneMappingExposure:1,rendered=0,skipped=0,lastRender=0;
 if(ready){const original=R.render;R.render=function(scene,camera){
  if(scene===S&&camera===CAM){const now=performance.now(),photo=!!root.PHOTO?.on;
   const menu=document.getElementById('menu'),fullMenu=menu&&getComputedStyle(menu).display!=='none';
   // Only throttle fully covered idle menus, never active play, photos or shader warm-up.
   if(opts.idleRendering&&game!=='play'&&!photo&&fullMenu&&R.getRenderTarget()===null&&now-lastRender<66){skipped++;return;}
   lastRender=now;const thermal=mode==='drone'&&typeof DR!=='undefined'&&!!DR.th;
   R.toneMapping=opts.filmic&&!thermal?THREE.ACESFilmicToneMapping:originalTone;
   R.toneMappingExposure=opts.filmic&&!thermal?opts.exposure:originalExposure;rendered++;
  }
  return original.apply(this,arguments);
 };}
 function persist(){try{localStorage.setItem(KEY,JSON.stringify(opts));return true;}catch{storageOK=false;return false;}}
 function notice(message){const el=document.getElementById('hx-status');if(el)el.textContent=message;}
 function refresh(){const box=document.getElementById('hx-polish');if(!box)return;for(const key of ['smoothCamera','reduceShake','filmic','textureDetail','muteBackground','idleRendering'])box.querySelector('[data-polish="'+key+'"]').checked=opts[key];box.querySelector('[data-polish="exposure"]').value=opts.exposure;box.querySelector('output').textContent=Math.round(opts.exposure*100)+'%';box.querySelector('[data-polish="exposure"]').disabled=!opts.filmic;document.body.classList.toggle('hisar-comfort',opts.reduceShake);}
 function change(key,value){if(!Object.prototype.hasOwnProperty.call(defaults,key))return;opts=settings({...opts,[key]:value});persist();refresh();cameraState='';if(key==='textureDetail')queueTextures();if(!storageOK)notice('Tercihler bu oturumda geçerli; kalıcı kayıt kullanılamıyor.');}
 function diagnostics(){return {schema:1,package:api.version,ready,preferences:{...opts},cameraSmoothedFrames:cameraFrames,renderedFrames:rendered,idleFramesSkipped:skipped,texturesUpdated:texturesChanged,gameBuild:root.APP_VER||null,viewport:{width:innerWidth,height:innerHeight,visualHeight:root.visualViewport?.height||innerHeight},renderer:ready?{calls:R.info?.render?.calls,triangles:R.info?.render?.triangles,textures:R.info?.memory?.textures}:null,errors:Array.isArray(root.HERR?.LOG)?root.HERR.LOG.slice(-8):[]};}
 function attach(){const parent=document.getElementById('hx-settings');if(!parent||document.getElementById('hx-polish'))return;const box=document.createElement('div');box.id='hx-polish';
  const flag=(key,title,hint)=>'<label class="hx-row"><span>'+title+'<small class="hx-muted" style="display:block">'+hint+'</small></span><input type="checkbox" data-polish="'+key+'"></label>';
  box.innerHTML='<fieldset><legend>Oynanış ve görüntü · 63.1</legend>'+flag('smoothCamera','Yumuşak takip kamerası','Dış tank görünümünde geçişleri yumuşatır; nişangâhı değiştirmez.')+flag('reduceShake','Azaltılmış kamera sarsıntısı','Görüntüdeki darbe sarsıntısını azaltır.')+flag('filmic','Sinematik ışık tonları','Işık geçişlerini ton eşleme ile düzenler; termal görüntü korunur.')+'<label class="hx-row"><span>Sinematik parlaklık</span><span class="hx-polish-range"><input type="range" data-polish="exposure" min="0.7" max="1.4" step="0.05" aria-label="Sinematik parlaklık"><output></output></span></label>'+flag('textureDetail','Daha net yüzey dokuları','Grafik profiline ve cihaz desteğine göre doku filtreleme.')+flag('muteBackground','Arka planda sesi durdur','Sekmeden ayrılınca ses durur; dokununca yeniden açılır.')+flag('idleRendering','Menüde enerji tasarrufu','Oyun duraklatılmışken gereksiz 3D çizimini azaltır.')+'<div class="hx-actions"><button type="button" id="hx-polish-reset">Görüntü tercihlerini sıfırla</button><button type="button" id="hx-diagnostic">Hata raporu indir</button></div><p id="hx-polish-note">Oyun kayıtları, görev kuralları ve araç fiziği değiştirilmez. Filmik görünüm isteğe bağlıdır.</p></fieldset>';
  parent.appendChild(box);box.addEventListener('change',e=>{const key=e.target.dataset.polish;if(key)change(key,key==='exposure'?e.target.value:e.target.checked);});
  box.querySelector('[data-polish="exposure"]').addEventListener('input',e=>{opts.exposure=bound(e.target.value,.7,1.4,1);box.querySelector('output').textContent=Math.round(opts.exposure*100)+'%';});
  box.querySelector('#hx-polish-reset').onclick=()=>{opts=settings({});persist();refresh();queueTextures();notice('Yalnızca görüntü ve konfor tercihleri sıfırlandı; oyun kayıtların korunuyor.');};
  box.querySelector('#hx-diagnostic').onclick=()=>{const a=document.createElement('a'),u=URL.createObjectURL(new Blob([JSON.stringify(diagnostics(),null,2)],{type:'application/json'}));a.href=u;a.download='hisar-hata-raporu.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),30000);};refresh();
 }
 function safeUpdate(){const button=document.getElementById('updB');if(!button)return;button.onclick=async()=>{const span=button.querySelector('span');button.disabled=true;if(span)span.textContent='GÜNCELLENİYOR…';try{
  if(!/^https?:$/.test(location.protocol)){location.reload();return;}
  const base=new URL('./',location.href),check=await fetch(new URL('version.json?check='+Date.now(),base),{cache:'no-store'});if(!check.ok)throw Error('Sürüm kontrolü başarısız.');
  // Never unregister sibling applications' workers or erase any progress.
  if('serviceWorker'in navigator){const registrations=await navigator.serviceWorker.getRegistrations();for(const r of registrations){if(r.scope!==base.href)continue;await r.update();if(r.waiting)r.waiting.postMessage('SKIP_WAITING');}}
  const next=new URL(location.href);next.searchParams.set('v',Date.now().toString(36));location.replace(next.href);
 }catch{if(span)span.textContent='GÜNCELLE';notice('Güncelleme alınamadı. Mevcut çevrimdışı sürüm ve kayıtların korundu.');}finally{button.disabled=false;}};}
 addEventListener('storage',e=>{if(e.key!==KEY)return;try{opts=settings(JSON.parse(e.newValue||'null'));refresh();queueTextures();}catch{}});
 root.HisarPolish=Object.freeze({version:api.version,getSettings:()=>({...opts}),set:change,diagnostics,clearInputs,attach});
 attach();safeUpdate();queueTextures();
 // Load the optional analog control adapter after the legacy game globals exist.
 // Failure leaves the original controls untouched.
 if(!root.HisarControls){const controlScript=document.createElement('script');controlScript.src=new URL('experience/controls.js',document.baseURI).href;controlScript.defer=true;controlScript.onerror=()=>notice('Analog kontrol modülü yüklenemedi; mevcut kumandalar kullanılabilir.');document.head.appendChild(controlScript);}
 // UI can finish loading after this module in inline/offline distributions.
 if(!document.getElementById('hx-settings'))document.addEventListener('hisar:ui-ready',attach,{once:true});
})(typeof window!=='undefined'?window:globalThis);

// HİSAR presentation/gameplay pack. Sequenced, same-origin and non-blocking.
(function(root){
 if(!root.document)return;
 const script=root.document.currentScript;
 const base=new URL('./',script&&script.src?script.src:new URL('experience/',root.document.baseURI).href);
 function load(name,ready,next){
  if(ready()){next();return;}
  const id='hisar-load-'+name;if(root.document.getElementById(id))return;
  const el=root.document.createElement('script');el.id=id;el.src=new URL(name+'.js?v=1.3.0',base).href;
  el.onload=next;el.onerror=()=>{const n=root.document.getElementById('hx-status');if(n)n.textContent='Yeni oyun modülü yüklenemedi; mevcut oyun korunuyor. GÜNCELLE ile yeniden dene.';};
  root.document.head.appendChild(el);
 }
 load('immersive',()=>!!root.HisarImmersive,()=>load('gameplay',()=>!!root.HisarGameplay,()=>load('radio-sound',()=>!!root.HisarRadioSound,()=>load('radio-missions',()=>!!root.HisarOperations,()=>load('simple-settings',()=>!!root.HisarSimpleSettings,()=>{})))));
})(typeof window!=='undefined'?window:globalThis);
