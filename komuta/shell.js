/* KOMUTA 1.2.0: tank and range only. No construction engine or entry. */
(function(){'use strict';const C=KomutaCore,$=id=>document.getElementById(id);
let state;try{state=C.normalize(JSON.parse(localStorage.getItem(C.KEY)||'null'));}catch{state=C.normalize(null);}
let frame=null,api=null,kind=null,token=0,loading=false,paused=false,timeout=null,noticeTimer=null,bootAt=0;const metrics=[];
const paths=Object.freeze({tank:'tank/index.html',range:'poligon/index.html'}),names={tank:'Tank · iç / dış',range:'Poligon'};
const valid=k=>Object.prototype.hasOwnProperty.call(paths,k);
function persist(){try{localStorage.setItem(C.KEY,JSON.stringify(state));}catch{notice('Tarayıcı kayda izin vermiyor; oyun bu oturumda devam eder.');}}
function notice(t){$('notice').textContent=String(t);$('notice').hidden=false;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('notice').hidden=true,3800);}
function mute(){if(api?.sound)api.sound(state.sound);$('sound').textContent=state.sound?'SESİ KAPAT':'SESİ AÇ';}
function saveScene(){if(api?.snapshot){const s=api.snapshot();if(s.position)state.position=C.normalize({position:s.position}).position;if(s.drone)state.drone=C.normalize({drone:s.drone}).drone;if(s.weapon)state.range.weapon=s.weapon;persist();}}
function setPause(v){if(!api||loading)return;paused=!!v;try{api.pause(paused);}catch(e){console.warn(e);}$('paused').hidden=!paused;$('pause').textContent=paused?'DEVAM':'DURAKLAT';}
function dispose(){if(api){try{saveScene();api.pause(true);api.dispose?.();}catch(e){console.warn('scene cleanup',e);}}api=null;if(frame){frame.src='about:blank';frame.remove();frame=null;}}
function canLeave(){if(api?.canLeave&&!api.canLeave()){notice('Önce Uçangözü geri getir.');return false;}return true;}
function home(){if(!loading&&!canLeave())return false;++token;clearTimeout(timeout);dispose();kind=null;loading=false;paused=false;$('stage').replaceChildren();$('loading').hidden=true;$('paused').hidden=true;$('welcome').hidden=false;$('back').hidden=true;$('pause').disabled=true;$('pause').textContent='DURAKLAT';$('place').textContent='Ana menü';$('enter').focus();return true;}
function load(next){if(!valid(next))return false;clearTimeout(timeout);const id=++token;dispose();kind=next;loading=true;paused=false;bootAt=performance.now();$('welcome').hidden=true;$('loading').hidden=false;$('paused').hidden=true;$('retry').hidden=true;$('pause').disabled=true;$('pause').textContent='DURAKLAT';$('back').hidden=false;$('load-title').textContent=names[next]+' hazırlanıyor';$('load-message').textContent='Yalnız seçtiğin alanın görüntüleri yükleniyor.';$('place').textContent=names[next];frame=document.createElement('iframe');frame.title='HİSAR KOMUTA · '+names[next];frame.allow='fullscreen; microphone';frame.allowFullscreen=true;frame.src=paths[next]+'?komuta=1&release=1.2.0&session='+id;$('stage').replaceChildren(frame);timeout=setTimeout(()=>{if(loading&&id===token){$('load-message').textContent='Alan açılamadı. Yeniden dene veya ana menüye dön.';$('retry').hidden=false;}},30000);return true;}
window.KomutaHost=Object.freeze({snapshot:()=>JSON.parse(JSON.stringify(state)),notice,
 connect(scene,engine){if(scene!==kind||!frame||engine.owner!==frame.contentWindow)return false;api=engine;loading=false;clearTimeout(timeout);$('loading').hidden=true;$('pause').disabled=false;mute();metrics.push({scene,readyMs:Math.round(performance.now()-bootAt)});if(metrics.length>30)metrics.shift();if(document.hidden)setPause(true);else frame.contentWindow.focus();return true;},
 transfer(next){if(!valid(next)||loading||paused||!api||!canLeave())return false;saveScene();return load(next);},
 update(p){if(p.drone)state.drone=C.normalize({drone:{...state.drone,...p.drone}}).drone;if(p.position)state.position=C.normalize({position:p.position}).position;persist();},
 status(text){$('place').textContent=String(text).slice(0,70);},
 diagnostics:()=>({version:C.VERSION,scene:kind,availableScenes:Object.keys(paths),loading,paused,frames:$('stage').querySelectorAll('iframe').length,metrics:metrics.slice(),state:JSON.parse(JSON.stringify(state))})});
$('enter').onclick=()=>load('tank');$('range-enter').onclick=()=>load('range');$('retry').onclick=()=>load(kind);$('cancel-load').onclick=home;$('back').onclick=home;
$('pause').onclick=()=>setPause(!paused);$('resume').onclick=()=>setPause(false);$('sound').onclick=()=>{state.sound=!state.sound;persist();mute();};
$('full').onclick=async()=>{try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen?.();if(screen.orientation?.lock)await screen.orientation.lock('landscape');}catch{notice('Yatay kullanmak için ekran dönüş kilidini kapatıp telefonu çevir.');}};
function rotate(){$('rotation').hidden=innerWidth>=innerHeight;}addEventListener('resize',rotate);rotate();
document.addEventListener('visibilitychange',()=>{if(document.hidden&&api&&!loading){saveScene();setPause(true);}});addEventListener('pagehide',()=>{try{saveScene();api?.pause(true);api?.dispose?.();}catch{}});
if('serviceWorker'in navigator&&/^https?:/.test(location.protocol))navigator.serviceWorker.register('sw.js',{scope:'./',updateViaCache:'none'}).catch(()=>{});
})();
