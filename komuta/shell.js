/* A separate app. Original game engines are private, self-hosted scene copies. */
(function(){'use strict';const C=KomutaCore,$=id=>document.getElementById(id);
let state;try{state=C.normalize(JSON.parse(localStorage.getItem(C.KEY)||'null'));}catch{state=C.normalize(null);}
let frame=null,api=null,kind='site',token=0,loading=false,paused=false,timeout=null,noticeTimer=null,bootAt=0;const metrics=[];
const paths={site:'site/index.html',range:'poligon/index.html',tank:'tank/index.html'},names={site:'Üs · yaya / araç',range:'Poligon',tank:'Tank · iç / dış'};
function persist(){try{localStorage.setItem(C.KEY,JSON.stringify(state));}catch{notice('Tarayıcı kayda izin vermiyor; oyun bu oturumda devam eder.');}}
function notice(t){$('notice').textContent=t;$('notice').hidden=false;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('notice').hidden=true,3800);}
function mute(){if(api?.sound)api.sound(state.sound);$('sound').textContent=state.sound?'SESİ KAPAT':'SESİ AÇ';}
function saveScene(){if(api?.snapshot){const s=api.snapshot();if(s.position)state.position=C.normalize({position:s.position}).position;if(s.drone)state.drone=C.normalize({drone:s.drone}).drone;if(s.weapon)state.range.weapon=s.weapon;persist();}}
function setPause(v){paused=!!v;try{api?.pause(paused);}catch(e){console.warn(e);} $('paused').hidden=!paused;$('pause').textContent=paused?'DEVAM':'DURAKLAT';}
function dispose(){if(api){try{saveScene();api.pause(true);api.dispose?.();}catch(e){console.warn('scene cleanup',e);}} api=null;if(frame){frame.src='about:blank';frame.remove();frame=null;}}
function load(next){if(!paths[next])return;clearTimeout(timeout);const id=++token;dispose();kind=next;loading=true;paused=false;bootAt=performance.now();$('welcome').hidden=true;$('loading').hidden=false;$('paused').hidden=true;$('retry').hidden=true;$('pause').disabled=true;$('back').hidden=next==='site';$('load-title').textContent=next==='site'?'Üs hazırlanıyor':names[next]+' hazırlanıyor';$('load-message').textContent='Yalnız bu alanın araçları ve görüntüleri yükleniyor.';$('place').textContent=names[next];frame=document.createElement('iframe');frame.title='HİSAR KOMUTA · '+names[next];frame.allow='fullscreen; microphone';frame.allowFullscreen=true;frame.src=paths[next]+'?komuta=1&session='+id;$('stage').replaceChildren(frame);timeout=setTimeout(()=>{if(loading&&id===token){$('load-message').textContent='Alan açılamadı. Yeniden deneyebilir veya üsse dönebilirsin.';$('retry').hidden=false;}},30000);}
window.KomutaHost=Object.freeze({
 snapshot:()=>JSON.parse(JSON.stringify(state)),notice,
 connect(scene,engine){if(scene!==kind||!frame||engine.owner!==frame.contentWindow)return false;api=engine;loading=false;clearTimeout(timeout);$('loading').hidden=true;$('pause').disabled=false;mute();metrics.push({scene,readyMs:Math.round(performance.now()-bootAt)});frame.contentWindow.focus();return true;},
 transfer(next){if(loading||paused||!api||!paths[next])return false;if(next!=='site'&&!api.canTravel?.(next)){notice('Önce ilgili alana yürüyerek yaklaş.');return false;}if(api.canLeave&&!api.canLeave()){notice('Önce Uçangözü geri getir.');return false;}saveScene();load(next);return true;},
 update(p){if(p.drone)state.drone=C.normalize({drone:{...state.drone,...p.drone}}).drone;if(p.position)state.position=C.normalize({position:p.position}).position;persist();},
 status(text){$('place').textContent=String(text).slice(0,70);},
 diagnostics:()=>({version:C.VERSION,scene:kind,loading,paused,frames:$('stage').querySelectorAll('iframe').length,metrics:metrics.slice(),state:JSON.parse(JSON.stringify(state))})
});
$('enter').onclick=()=>load('site');$('retry').onclick=()=>load(kind);$('cancel-load').onclick=()=>{if(kind!=='site')load('site');else{++token;clearTimeout(timeout);dispose();loading=false;$('loading').hidden=true;$('welcome').hidden=false;}};
$('back').onclick=()=>KomutaHost.transfer('site');$('pause').onclick=()=>setPause(!paused);$('resume').onclick=()=>setPause(false);$('sound').onclick=()=>{state.sound=!state.sound;persist();mute();};
$('full').onclick=async()=>{try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen?.();if(screen.orientation?.lock)await screen.orientation.lock('landscape');}catch{notice('Yatay kullanmak için ekran dönüş kilidini kapatıp telefonu çevir.');}};
function rotate(){$('rotation').hidden=innerWidth>=innerHeight;}addEventListener('resize',rotate);rotate();
document.addEventListener('visibilitychange',()=>{if(document.hidden&&api&&!loading){saveScene();setPause(true);}});addEventListener('pagehide',()=>{try{saveScene();api?.pause(true);api?.dispose?.();}catch{}});
if('serviceWorker'in navigator&&/^https?:/.test(location.protocol))navigator.serviceWorker.register('sw.js',{scope:'./'}).catch(()=>{});
})();
