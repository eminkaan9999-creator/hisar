"""Retire only KOMUTA's construction game. Other applications stay untouched."""
from pathlib import Path
import hashlib,json,re,shutil,sys
R=Path(sys.argv[1] if len(sys.argv)>1 else 'komuta').resolve()
assert (R/'tank/index.html').is_file() and (R/'poligon/index.html').is_file()
before={str(p.relative_to(R)):hashlib.sha256(p.read_bytes()).hexdigest() for p in R.rglob('*') if p.is_file()}
def put(n,s):
 p=R/n;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(s,encoding='utf-8')
put('index.html','''<!doctype html><html lang="tr"><head><meta charset="utf-8"><script src="storage-scope.js"></script><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><meta name="theme-color" content="#121a1d"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="HİSAR KOMUTA"><link rel="manifest" href="manifest.webmanifest"><link rel="icon" href="favicon-32.png"><link rel="apple-touch-icon" href="apple-touch-icon.png"><link rel="stylesheet" href="app.css"><title>HİSAR: KOMUTA</title></head><body>
<header id="bar"><strong>HİSAR <span>KOMUTA</span></strong><span id="place">Ana menü</span><span class="spacer"></span><button id="back" hidden>ANA MENÜ</button><button id="full" aria-label="Tam ekran">TAM EKRAN</button><button id="pause" disabled>DURAKLAT</button></header>
<main id="stage" aria-label="Oyun alanı"></main>
<section id="welcome" class="overlay"><div class="sheet"><p class="eyebrow">TANK · POLİGON · UÇANGÖZ</p><h1>HİSAR<br><em>KOMUTA</em></h1><p>Tankını ve görevini seç veya doğrudan poligona geç. Uçangözü tank oyununda kullan.</p><div class="game-choices"><button class="primary" id="enter">TANKI AÇ</button><button id="range-enter">POLİGONU AÇ</button></div><p class="hint">Telefonu yatay çevir. Sol el: hareket · Sağ el: bakış.</p><p class="small">Sürüm 1.2.0 · Kayıtların korunur.</p></div></section>
<section id="loading" class="overlay" hidden><div class="sheet"><p class="eyebrow">HİSAR KOMUTA</p><h2 id="load-title">Oyun hazırlanıyor</h2><p id="load-message" role="status">Yalnız seçtiğin alan yükleniyor.</p><div class="progress" aria-hidden="true"><i></i></div><button id="retry" hidden>YENİDEN DENE</button><button id="cancel-load">ANA MENÜYE DÖN</button></div></section>
<section id="paused" class="overlay" hidden><div class="sheet"><h2>Duraklatıldı</h2><p>Devam ettiğinde aynı yerden oynarsın.</p><button id="resume" class="primary">DEVAM ET</button><button id="sound">SESİ KAPAT</button><p class="small">Yatay ekranda iki elle daha rahat oynanır.</p></div></section>
<div id="rotation" hidden>İki elle oynamak için telefonu yatay çevir.</div><div id="notice" role="status" hidden></div>
<script src="core.js"></script><script src="shell.js"></script></body></html>
''')
put('shell.js',r'''/* KOMUTA 1.2.0: tank and range only. No construction engine or entry. */
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
''')
for n in ['rocky_terrain_02_d.jpg','rubble_d.jpg','bush1.webp']:
 src=R/'site/assets'/n;dest=R/'environment'/n;dest.parent.mkdir(exist_ok=True)
 if src.exists():shutil.copyfile(src,dest)
 assert dest.is_file(),n
p=R/'poligon/index.html';s=p.read_text();assert '../site/assets/' in s or '../environment/' in s;p.write_text(s.replace('../site/assets/','../environment/'),encoding='utf-8')
for n in ['site','shared/vendor','assets/ucangoz']:
 p=R/n
 if p.exists():shutil.rmtree(p)
p=R/'native-ucangoz.js'
if p.exists():p.unlink()
p=R/'tank-komuta.js';s=p.read_text().replace('loaded at the garage','selected directly from the main menu').replace('Üsse dönüp yeniden dene.','Ana menüye dönüp yeniden dene.');p.write_text(s,encoding='utf-8')
p=R/'core.js';p.write_text(re.sub(r"VERSION='[^']+'","VERSION='1.2.0'",p.read_text(),count=1),encoding='utf-8')
p=R/'manifest.webmanifest';m=json.loads(p.read_text());m['description']='Tank, poligon ve Uçangöz. Ayrı oyun, doğrudan alan seçimi.';put('manifest.webmanifest',json.dumps(m,ensure_ascii=False,indent=2)+'\n')
p=R/'app.css';s=p.read_text()
if '.game-choices{' not in s:s+='\n.game-choices{display:flex;gap:10px;flex-wrap:wrap}.game-choices button{flex:1;min-width:160px;margin:6px 0;min-height:48px}\n'
p.write_text(s,encoding='utf-8')
v=json.loads((R/'version.json').read_text());v.update(v='1.2.0',independent=True,construction=False,availableScenes=['tank','range'],changes=['İnşaat oyunu ve zorunlu yaya üs girişi kaldırıldı','Tank ve poligon doğrudan açılır','Tankın özgün iç/dış görünümleri ve Uçangözü korunur','Eski inşaat dosyaları ve önbelleği kaldırılır']);put('version.json',json.dumps(v,ensure_ascii=False,indent=2)+'\n')
put('sw.js',r'''/* Only this app's cache is managed; other HİSAR apps remain untouched. */
'use strict';const CACHE='hisar-komuta-site-1.2.0',BASE=new URL('./',self.location.href),CORE=['storage-scope.js','index.html','app.css','core.js','shell.js','manifest.webmanifest','icon-192.png'];
const own=u=>u.origin===BASE.origin&&u.pathname.startsWith(BASE.pathname);
self.addEventListener('install',e=>e.waitUntil((async()=>{const c=await caches.open(CACHE);await c.addAll(CORE.map(p=>new Request(new URL(p,BASE),{cache:'reload'})));await self.skipWaiting();})()));
self.addEventListener('activate',e=>e.waitUntil((async()=>{for(const k of await caches.keys())if(k.startsWith('hisar-komuta-site-')&&k!==CACHE)await caches.delete(k);await self.clients.claim();})()));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||!own(u))return;const path=u.pathname.slice(BASE.pathname.length);
 if(path.startsWith('site/')){e.respondWith(Promise.resolve(new Response('Bu bölüm KOMUTA’dan kaldırıldı. Ana menüden tank veya poligonu aç.',{status:410,headers:{'Content-Type':'text/plain;charset=utf-8'}})));return;}
 if(path==='version.json')return;
 const key=new Request(new URL(path||'index.html',BASE));
 e.respondWith((async()=>{const c=await caches.open(CACHE);const fresh=e.request.mode==='navigate'||/\.(?:js|css|webmanifest)$/.test(path);if(!fresh){const hit=await c.match(key);if(hit)return hit;}
 try{const r=await fetch(e.request,{cache:fresh?'no-cache':'default'});if(r.ok&&r.type!=='opaque')await c.put(key,r.clone());return r;}catch(err){const hit=await c.match(key);if(hit)return hit;throw err;}
 })().catch(()=>new Response('Bu alan henüz çevrimdışı hazır değil. İnternet bağlantısıyla yeniden aç.',{status:503,headers:{'Content-Type':'text/plain;charset=utf-8'}})));});
''')
p=R/'publication-tests.json'
if p.exists():p.unlink()
assert not (R/'site').exists()
assert 'site/index.html' not in (R/'shell.js').read_text()
assert not re.search(r'ÜSSE GİR|şantiye|inşaat',(R/'index.html').read_text(),re.I)
assert before['tank/index.html']==hashlib.sha256((R/'tank/index.html').read_bytes()).hexdigest()
after={str(p.relative_to(R)):hashlib.sha256(p.read_bytes()).hexdigest() for p in R.rglob('*') if p.is_file() and p.name not in ['publication-hashes.json','removal-report.json']}
removed=sorted(set(before)-set(after)-{'publication-hashes.json','removal-report.json'})
put('removal-report.json',json.dumps({'version':'1.2.0','constructionRemoved':True,'removedFiles':removed,'removedCount':len(removed),'tankEngineUnchanged':True,'availableScenes':['tank','range'],'checks':['no construction entry','no construction engine','original tank engine unchanged','range textures retained','save keys unchanged'],'testScope':'Static package assertions; separate browser report covers runtime.'},ensure_ascii=False,indent=2)+'\n')
after['removal-report.json']=hashlib.sha256((R/'removal-report.json').read_bytes()).hexdigest();put('publication-hashes.json',json.dumps(dict(sorted(after.items())),indent=2)+'\n')
# The live verifier must check the new version rather than the previous release.
p=Path('.github/workflows/komuta-pages-live.yml')
if p.exists():p.write_text(p.read_text().replace('1.1.1','1.2.0'),encoding='utf-8')
print(json.dumps({'version':'1.2.0','removedFiles':len(removed),'publishedFiles':len(after),'tankEngineUnchanged':True}))
