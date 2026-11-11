/* KOMUTA 1.2.1: isolated tank/range lifecycle, recoverable loads, no construction engine. */
(function(){
 'use strict';const C=KomutaCore,$=id=>document.getElementById(id);
 let state;try{state=C.normalize(JSON.parse(localStorage.getItem(C.KEY)||'null'));}catch{state=C.normalize(null);}
 let frame=null,api=null,kind=null,token=0,loading=false,paused=false,failed=false,noticeTimer=null,bootAt=0;
 const metrics=[],timers=new Set();
 const paths=Object.freeze({tank:'tank/index.html',range:'poligon/index.html'}),names={tank:'Tank · iç / dış',range:'Poligon'};
 const valid=k=>Object.prototype.hasOwnProperty.call(paths,k);
 function later(fn,ms){const t=setTimeout(()=>{timers.delete(t);fn();},ms);timers.add(t);return t;}
 function clearLoads(){for(const t of timers)clearTimeout(t);timers.clear();}
 function persist(){try{localStorage.setItem(C.KEY,JSON.stringify(state));}catch{notice('Tarayıcı kayda izin vermiyor; oyun bu oturumda devam eder.');}}
 function notice(text){$('notice').textContent=String(text);$('notice').hidden=false;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('notice').hidden=true,3800);}
 function mute(){try{api?.sound?.(state.sound);}catch(e){console.warn('audio',e);}$('sound').textContent=state.sound?'SESİ KAPAT':'SESİ AÇ';}
 function saveScene(){if(!api?.snapshot)return;try{const s=api.snapshot()||{};if(s.position)state.position=C.normalize({position:s.position}).position;if(s.drone)state.drone=C.normalize({drone:s.drone}).drone;if(typeof s.weapon==='string')state.range.weapon=s.weapon;persist();}catch(e){console.warn('scene save',e);}}
 function setPause(value){
  if(!api||loading)return false;const next=!!value;if(next===paused)return true;
  paused=next;try{api.pause(paused);}catch(e){console.warn('scene pause',e);}
  $('paused').hidden=!paused;$('pause').textContent=paused?'DEVAM':'DURAKLAT';
  if(!paused&&!document.hidden)frame?.contentWindow?.focus();return true;
 }
 function dispose(){
  const old=api;saveScene();api=null;
  if(old){try{old.pause(true);}catch(e){console.warn('pause cleanup',e);}try{old.dispose?.();}catch(e){console.warn('scene cleanup',e);}}
  if(frame){frame.src='about:blank';frame.remove();frame=null;}
 }
 function canLeave(){if(failed)return true;if(api?.canLeave&&!api.canLeave()){notice('Önce Uçangözü geri getir.');return false;}return true;}
 function home(){
  if(!loading&&!canLeave())return false;++token;clearLoads();dispose();kind=null;loading=false;paused=false;failed=false;
  $('stage').replaceChildren();$('stage').setAttribute('aria-busy','false');$('loading').hidden=true;$('paused').hidden=true;$('welcome').hidden=false;
  $('back').hidden=true;$('pause').disabled=true;$('pause').textContent='DURAKLAT';$('place').textContent='Ana menü';$('enter').focus();return true;
 }
 function fail(scene,owner,text){
  if(scene!==kind||!frame||owner!==frame.contentWindow)return false;
  clearLoads();failed=true;loading=true;try{api?.pause(true);}catch{}paused=false;
  $('stage').setAttribute('aria-busy','false');$('loading').hidden=false;$('paused').hidden=true;$('pause').disabled=true;
  $('load-title').textContent=names[kind]+' yeniden açılmalı';$('load-message').textContent=String(text||'Alan açılamadı. Yeniden dene veya ana menüye dön.');$('retry').hidden=false;return true;
 }
 function load(next){
  if(!valid(next))return false;clearLoads();const id=++token;dispose();kind=next;loading=true;paused=false;failed=false;bootAt=performance.now();
  $('welcome').hidden=true;$('loading').hidden=false;$('paused').hidden=true;$('retry').hidden=true;$('pause').disabled=true;$('pause').textContent='DURAKLAT';$('back').hidden=false;
  $('load-title').textContent=names[next]+' hazırlanıyor';$('load-message').textContent='Yalnız seçtiğin alanın görüntüleri yükleniyor.';$('place').textContent=names[next];$('stage').setAttribute('aria-busy','true');
  const nextFrame=document.createElement('iframe');frame=nextFrame;frame.title='HİSAR KOMUTA · '+names[next];frame.allow='fullscreen; microphone';frame.allowFullscreen=true;
  frame.addEventListener('error',()=>{if(id===token)fail(next,nextFrame.contentWindow,'Alan yüklenemedi. Bağlantını kontrol ederek yeniden dene.');});
  frame.src=paths[next]+'?komuta=1&release='+encodeURIComponent(C.VERSION)+'&session='+id;$('stage').replaceChildren(frame);
  later(()=>{if(loading&&!failed&&id===token)$('load-message').textContent='İlk açılışta görüntüler hazırlanıyor. Açılmazsa YENİDEN DENE veya ANA MENÜYE DÖN kullanabilirsin.';},12000);
  later(()=>{if(loading&&!failed&&id===token)fail(next,nextFrame.contentWindow,'Yükleme tamamlanamadı. Bağlantını kontrol ederek yeniden dene veya ana menüye dön.');},35000);
  return true;
 }
 window.KomutaHost=Object.freeze({snapshot:()=>JSON.parse(JSON.stringify(state)),notice,fail,
  connect(scene,engine){
   if(scene!==kind||!frame||engine?.owner!==frame.contentWindow||typeof engine.pause!=='function'||failed)return false;
   api=engine;loading=false;clearLoads();$('stage').setAttribute('aria-busy','false');$('loading').hidden=true;$('pause').disabled=false;mute();
   metrics.push({scene,readyMs:Math.round(performance.now()-bootAt)});if(metrics.length>30)metrics.shift();if(document.hidden)setPause(true);else frame.contentWindow.focus();return true;
  },
  transfer(next){if(!valid(next)||loading||paused||!api||!canLeave())return false;return load(next);},
  update(p){if(!p||typeof p!=='object')return;if(p.drone)state.drone=C.normalize({drone:{...state.drone,...p.drone}}).drone;if(p.position)state.position=C.normalize({position:p.position}).position;persist();},
  status(text){$('place').textContent=String(text).slice(0,70);},
  diagnostics:()=>({version:C.VERSION,scene:kind,availableScenes:Object.keys(paths),loading,paused,failed,frames:$('stage').querySelectorAll('iframe').length,metrics:metrics.slice(),state:JSON.parse(JSON.stringify(state))})
 });
 $('enter').onclick=()=>load('tank');$('range-enter').onclick=()=>load('range');$('retry').onclick=()=>load(kind);$('cancel-load').onclick=home;$('back').onclick=home;
 $('pause').onclick=()=>setPause(!paused);$('resume').onclick=()=>setPause(false);$('sound').onclick=()=>{state.sound=!state.sound;persist();mute();};
 $('full').onclick=async()=>{try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen?.();if(screen.orientation?.lock)await screen.orientation.lock('landscape');}catch{notice('Yatay kullanmak için ekran dönüş kilidini kapatıp telefonu çevir.');}};
 function rotate(){$('rotation').hidden=innerWidth>=innerHeight;}addEventListener('resize',rotate);rotate();
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&api&&!loading){saveScene();setPause(true);}});
 addEventListener('pagehide',()=>{saveScene();try{api?.pause(true);}catch{}});
 // A page kept in the browser back/forward cache must remain resumable, not disposed.
 if('serviceWorker'in navigator&&/^https?:/.test(location.protocol))navigator.serviceWorker.register('sw.js',{scope:'./',updateViaCache:'none'}).catch(()=>{});
})();
