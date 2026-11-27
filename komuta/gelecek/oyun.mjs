import {missions,eras,eraFor,nodeLabels,config,createRun,validRun,forecast,fleetAction,advanceWave,rating} from './model.mjs';
import {mountMap,positions} from './harita.mjs';
import {qualityModes,qualityNames} from './performans.mjs';
import {createSound} from '../ortak/ses.mjs';

const id=document.body.dataset.game;
const name=id==='boru'?'Çelik Börü':'HİSAR: KOMUTA';
const main=document.querySelector('main');
const key='hisar-future-3:'+id;
const sound=createSound();
function read(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}}
const saved=read(key,{});
let run=validRun(saved.run,id)?saved.run:null;
let history=Array.isArray(saved.history)?saved.history.filter(s=>validRun(s,id)&&s.done).slice(0,18):[];
let chosen=read('hisar-future-mission:'+id,id==='boru'?'ufuk':'birlesik');
if(!missions[id].some(m=>m.key===chosen))chosen=missions[id][0].key;
let era=eraFor(missions[id].find(m=>m.key===chosen)).key;
let quality=read('hisar-render-quality','auto');
if(!qualityModes.includes(quality))quality='auto';
let layer='network';
let screen='home',cleanup=null,token=0,reportIndex=0;
let assist=read('hisar-future-assist',true),cab=read('hisar-future-camera',false);
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const current=()=>run?config(run):missions[id].find(m=>m.key===chosen);
const shield='<svg viewBox="0 0 32 36" aria-hidden="true"><path d="M16 2 29 7v10c0 8-6 12-13 17C9 29 3 25 3 17V7z" fill="none" stroke="currentColor" stroke-width="2"/><path d="m8 20 8-9 8 9M10 24l6-7 6 7" fill="none" stroke="currentColor" stroke-width="2.5"/></svg>';
document.querySelector('header').innerHTML=`<div class="bar"><a class="brand" href="./"><span class="mark">${shield}</span><strong>${name}</strong></a><nav aria-label="Ana menü"><button data-nav="home">Üs</button><button data-nav="missions">Görevler</button><button data-nav="history">Kayıtlar</button><button data-nav="settings">Ayarlar</button></nav></div>`;
function save() {
  try{localStorage.setItem(key,JSON.stringify({run,history}));}
  catch{document.querySelector('#storage').hidden=false;}
}
function preference(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{}}
function leave(){token++;cleanup?.();cleanup=null;sound.silence();if(run)save();}
function best(mission){return Math.max(0,...history.filter(s=>s.mission===mission).map(rating));}
function eraTabs() {
  return `<div class="era-tabs" role="group" aria-label="Dönem seçimi">${eras.map(e=>`<button data-era="${e.key}" aria-pressed="${era===e.key}"><span>${e.title}</span><strong>${e.year}</strong></button>`).join('')}</div>`;
}
function missionCards() {
  const list=missions[id].filter(m=>eraFor(m).key===era);
  return `${eraTabs()}<div class="mission-grid">${list.map(m=>`<button class="mission-card" data-mission="${m.key}" ${run?'disabled':''}>
    <small>${eraFor(m).year} · ${m.region}</small><strong>${m.title}</strong><span>${m.waves} dalga · ${id==='boru'?'Araç kontrolü':'Filo komutası'}</span>
    <b>${best(m.key)?'★'.repeat(best(m.key)):'Görevi incele ›'}</b></button>`).join('')}</div>`;
}
function home() {
  const m=current();
  return `<section class="future-hero ${id}" data-era-view="${eraFor(m).key}"><div class="hero-copy"><p class="eyebrow">${eraFor(m).year} · ${m.region}</p><div class="national-tag"><span aria-hidden="true">🇹🇷</span> TÜRK ORDUSU · GELECEK VİZYONU</div><h1>${name}</h1><p class="hero-sub">${id==='boru'?'Bugünden geleceğin muharebe sahasına.':'Geleceğin muharebe sahasını yönet.'}</p><p class="hero-desc">${m.description}</p><div class="actions"><button class="primary" data-nav="${run?'play':'brief'}">${run?'Göreve devam et':'Göreve hazırlan'} <span>›</span></button><button class="glass" data-nav="missions">Görev seç</button></div></div><div class="hero-footer"><span>${m.title}</span><span>${m.tag}</span></div></section>
    <div class="technology-strip"><span><i></i> ${eraFor(m).vehicle}</span><span>${eraFor(m).system}</span><span>3 dönem · 4 görev</span></div><div class="section-heading"><h2>Görev alanları</h2><span>${id==='boru'?'Zırhlı araç · Enerji kalkanı · Otonom sürüler':'Drone filoları · Çekirdek ağı · Enerji yönetimi'}</span></div>${missionCards()}`;
}
function briefing() {
  const m=current();
  const rows=id==='boru'
    ?[['Hedef',m.waves+' dalgadaki '+m.waves*m.bots+' otonom birimi durdur.'],['Kontrol','Ok tuşları veya W A S D ile hareket et. Enerji darbesi için Boşluk veya ekran düğmesini basılı tut.'],['Sistemler','Q ile dört saniyelik koruma desteğini aç. E ile hedef değiştir. Enerji yenilenir, aşırı ısınma atış aralığını etkiler.']]
    :[['Hedef',m.waves+' dalga boyunca üç çekirdeği çalışır tut.'],['Filolar','Öncü filo sürü baskısını azaltır. Koruyucu filo iki dalga boyunca kalkanı destekler. İki filonun da yeniden göreve hazırlanması iki dalga sürer.'],['Enerji','Onarım sürüleri kalkanı yeniler. Eylemler ortak enerjiyi kullanır. Dalgayı ilerletmeden önce beklenen baskıyı kontrol et.']];
  return `<div class="page-lead"><p class="eyebrow">${eraFor(m).year} · ${eraFor(m).subtitle}</p><h1>${m.title}</h1><p>${m.description}</p></div><div class="brief-grid">${rows.map(([title,text])=>`<article class="panel"><h2>${title}</h2><p>${text}</p></article>`).join('')}</div><div class="actions end-actions"><button data-nav="missions">Görevler</button><button class="primary" data-nav="play">${run?'Göreve devam et':'Sisteme bağlan'} ›</button></div>`;
}
function meter(key,label,value) {
  return `<div class="meter ${key}" data-meter="${key}"><div><span>${label}</span><b>${Math.round(value)}%</b></div><progress value="${value}" max="100" aria-label="${label}"></progress></div>`;
}
function vehicle() {
  const m=config(run),period=eraFor(m);
  return `<div class="play-heading"><div><p class="eyebrow">${period.year} · ${config(run).region}</p><h1>${config(run).title}</h1></div><button data-nav="pause">Duraklat</button></div>
    <div class="vehicle-stats">${meter('hull','Gövde',run.hull)}${meter('shield','Kalkan',run.shield)}${meter('energy','Enerji',run.energy)}${meter('heat','Isı',run.heat)}</div>
    <section class="arena-wrap"><canvas class="arena" aria-label="${period.year} araç oyun alanı" data-era="${period.key}"></canvas><div class="arena-top"><span>DALGA <b class="wave">${run.wave} / ${config(run).waves}</b></span><span>BİRİM <b class="kills">${run.kills} / ${config(run).waves*config(run).bots}</b></span></div><div class="sensor-panel"><canvas class="sensor-radar" width="144" height="144" aria-label="Araç ve robotların çevre görünümü"></canvas><span>SENSÖR GÖRÜNÜMÜ</span></div><span class="performance-tag" data-perf>ÖLÇÜLÜYOR</span><div class="crosshair" aria-hidden="true"></div><span class="lock-status">HEDEF ARANIYOR</span><button class="camera-switch" data-camera>${cab?'Kabin':'Takip'}</button>
    <div class="arena-pad"><div class="steering"><button data-control="left" aria-label="Sola dön">←</button><button data-control="right" aria-label="Sağa dön">→</button><button data-control="back" aria-label="Fren ve geri">↓</button><button data-control="go" aria-label="İleri sür">↑</button></div><button class="fire-button" data-control="fire">${period.key==='far'?'ENERJİ DARBESİ':'DARBE'}</button></div></section>
    <div class="combat-tools"><label><input type="checkbox" data-assist ${assist?'checked':''}> Yön yardımı</label><div class="actions"><button data-target>Hedef değiştir · E</button><button data-dome>Koruma · Q</button></div></div>`;
}
function commandDesk() {
  const m=config(run),index=run.selected,n=run.nodes[index],incoming=forecast(run),labels=nodeLabels(run);
  return `<div class="play-heading"><div><p class="eyebrow">${eraFor(m).year} · ${m.region} · HİSAR AĞI</p><h1>${m.title}</h1></div><button data-nav="pause">Duraklat</button></div>
    <div class="command-summary"><div><small>Karşılanan dalga</small><strong>${run.turn} <span>/ ${m.waves}</span></strong></div>${meter('energy','Ağ enerjisi',run.energy)}<div><small>Filo durumu</small><strong>${run.fleets.filter(t=>t<=run.turn).length} <span>/ 2 hazır</span></strong></div></div>
    <div class="command-grid"><section class="panel holo-panel"><div class="panel-heading"><h2>${eraFor(m).key==='present'?'Sayısal saha haritası':'Birleşik saha görünümü'}</h2><span>CANLI AĞ</span></div><div class="map-layers" role="group" aria-label="Harita katmanı">${[['network','Birleşik ağ'],['relief','Arazi'],['systems','Birimler']].map(([key,title])=>`<button data-layer="${key}" aria-pressed="${layer===key}">${title}</button>`).join('')}</div><div class="holo-map"><canvas aria-hidden="true"></canvas>${positions.map(([x,y],i)=>`<button class="node-pin ${index===i?'selected':''}" data-node="${i}" style="left:${x}%;top:${y}%" aria-pressed="${index===i}"><strong>${labels[i]}</strong><span>Kalkan %${run.nodes[i].shield}</span></button>`).join('')}</div><div class="forecast">${run.nodes.map((node,i)=>`<button data-node="${i}" aria-pressed="${i===index}"><span>${labels[i]}</span><b>${Math.round(node.threat)} <small>+ ${incoming[i]}</small></b><small>Mevcut + yaklaşan baskı</small></button>`).join('')}</div></section>
    <section class="panel command-actions"><p class="eyebrow">SEÇİLİ SEKTÖR</p><h2>${labels[index]}</h2>${meter('shield','Çekirdek kalkanı',n.shield)}
      <button data-fleet="strike" ${run.energy<24||run.fleets[0]>run.turn||n.threat===0?'disabled':''}><span><strong>Öncü filosu</strong><small>Sürü baskısı −42 · 24 enerji</small></span><b>${run.fleets[0]>run.turn?(run.fleets[0]-run.turn)+' dalga':'GÖNDER ›'}</b></button>
      <button data-fleet="guard" ${run.energy<20||run.fleets[1]>run.turn||n.guardUntil>run.turn?'disabled':''}><span><strong>Koruyucu filo</strong><small>İki dalga kalkan desteği · 20 enerji</small></span><b>${run.fleets[1]>run.turn?(run.fleets[1]-run.turn)+' dalga':'GÖNDER ›'}</b></button>
      <button data-fleet="repair" ${run.energy<18||n.shield>=100?'disabled':''}><span><strong>Onarım sürüsü</strong><small>Kalkan +24 · 18 enerji</small></span><b>ETKİNLEŞTİR ›</b></button>
      <p class="sector-status">${n.guardUntil>run.turn?'Koruyucu filo bu sektörde etkin.':'Filoları haritadaki çekirdeklere yönlendirebilirsin.'}</p></section></div>
    <div class="network-insight"><span>DURUM ÖZETİ</span><p>${networkInsight()}</p></div><div class="wave-control"><p>${esc(run.log.at(-1))}</p><button class="primary" data-wave>Sonraki dalgayı karşıla ›</button></div>`;
}
function networkInsight() {
  const weakest=run.nodes.reduce((best,n,i)=>n.shield<run.nodes[best].shield?i:best,0);
  const incoming=forecast(run),highest=incoming.indexOf(Math.max(...incoming));
  return `${nodeLabels(run)[weakest]} bütünlüğü %${Math.round(run.nodes[weakest].shield)}. Yaklaşan en yüksek oyun baskısı ${nodeLabels(run)[highest].toLocaleLowerCase('tr-TR')} üzerinde. Hazır filo ${run.fleets.filter(t=>t<=run.turn).length}/2.`;
}
function result(s) {
  if(!s)return '<div class="panel">Görev kaydı bulunamadı.</div>';
  const score=rating(s),m=config(s);
  const integrity=id==='boru'?s.hull:s.nodes.reduce((sum,n)=>sum+n.shield,0)/3;
  const data=id==='boru'?[['Devre dışı birim',s.kills],['Geçen süre',Math.round(s.elapsed)+' sn'],['Gövde',Math.round(integrity)+'%']]
    :[['Karşılanan dalga',s.turn+' / '+m.waves],['Ortalama kalkan',Math.round(integrity)+'%'],['Kalan enerji',Math.round(s.energy)+'%']];
  return `<section class="result-banner ${s.won?'win':'loss'}"><p class="eyebrow">${m.title}</p><h1>${s.won?'Görev tamamlandı':'Bağlantı kesildi'}</h1><p>${s.won?'Bölge kontrolü sağlandı. Görev kaydı işlendi.':'Sistem bütünlüğü tükendi. Yeni bir deneme başlatabilirsin.'}</p><div class="stars" aria-label="${score} / 3 yıldız">${'★'.repeat(score)}<span>${'☆'.repeat(3-score)}</span></div><small>Görev başarısı · %45 bütünlük · %80 bütünlük</small></section>
    <div class="result-stats">${data.map(([label,value])=>`<article class="panel"><small>${label}</small><strong>${value}</strong></article>`).join('')}</div>
    <details class="panel journal"><summary>Görev günlüğü</summary><ol>${s.log.map(text=>'<li>'+esc(text)+'</li>').join('')}</ol></details>
    <div class="actions end-actions"><button data-nav="home">Üsse dön</button><button class="primary" data-retry="${s.mission}" ${run?'disabled':''}>Tekrar oyna ›</button></div>`;
}
function records() {
  return `<div class="page-lead"><p class="eyebrow">GÖREV ARŞİVİ</p><h1>Sonuçlar</h1></div>${run?'<div class="resume panel"><span>Devam eden görev · '+config(run).title+'</span><button data-nav="play">Devam et ›</button></div>':''}
    <div class="records">${history.length?history.map((s,i)=>`<button data-record="${i}"><span><strong>${config(s).title}</strong><small>${new Date(s.started).toLocaleDateString('tr-TR')} · ${s.won?'Tamamlandı':'Bağlantı kesildi'}</small></span><b>${rating(s)?'★'.repeat(rating(s)):'Yeniden dene'} ›</b></button>`).join(''):'<p class="panel empty">Tamamlanan görevler ve değerlendirmeleri burada görünür.</p>'}</div><a class="archive-link" href="?arsiv=1">Önceki görev arşivini aç ›</a>`;
}
function settings() {
  return `<div class="page-lead"><p class="eyebrow">SİSTEM AYARLARI</p><h1>Görüntü, ses ve kontrol</h1></div><section class="panel setting"><div><h2>Oyun sesleri</h2><p>Motor, enerji darbeleri ve filo bildirimleri.</p></div><button data-sound aria-pressed="${sound.enabled}" ${sound.supported?'':'disabled'}>${sound.enabled?'Açık':'Kapalı'}</button></section>
    ${id==='boru'?'<section class="panel setting"><div><h2>Sürüş kamerası</h2><p>Araç arkasından takip veya kabin görüşü.</p></div><button data-camera>'+(cab?'Kabin':'Takip')+'</button></section>':''}
    <section class="panel setting"><div><h2>Görüntü kalitesi</h2><p>Otomatik mod, kare süresini ölçerek çözünürlüğü cihaza uyarlar.</p></div><select data-quality aria-label="Görüntü kalitesi">${qualityModes.map(mode=>`<option value="${mode}" ${mode===quality?'selected':''}>${qualityNames[mode]}</option>`).join('')}</select></section><section class="panel controls-help"><h2>Kontroller</h2><p>${id==='boru'?'W A S D / ok tuşları ile sürüş, Boşluk ile enerji darbesi, Q ile kalkan, E ile hedef değişimi. Telefonda hareket ve enerji düğmelerini basılı tut.':'Haritadan çekirdeği seç, hazır filoyu gönder. Enerji ve kalkan değerlerini kontrol edip sonraki dalgayı karşıla.'}</p><p>Escape oyunu duraklatır. Uygulama arka plana alındığında görev kaydedilir.</p><p>Türk ordusunun geleceğine ilişkin kurgusal oyun vizyonu. Araçlar, sistemler ve oyun değerleri temsilidir.</p></section><div class="actions end-actions"><button data-nav="${run?'play':'home'}">${run?'Göreve devam et':'Üsse dön'} ›</button></div>`;
}
function complete() {
  if(!run?.done)return;
  history=[run,...history.filter(s=>s.started!==run.started)].slice(0,18);
  run=null;reportIndex=0;save();go('result');
}
function go(to) {
  leave();screen=to;
  for(const button of document.querySelectorAll('nav [data-nav]')) {
    const active=button.dataset.nav===to;button.classList.toggle('active',active);
    if(active)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');
  }
  if(to==='play'&&!run){run=createRun(id,chosen);save();}
  if(to==='play'&&run.done){complete();return;}
  const pages={home,brief:briefing,missions:()=>'<div class="page-lead"><p class="eyebrow">'+name+'</p><h1>Görev seçimi</h1></div>'+(run?'<div class="resume panel"><span>Devam eden görev · '+config(run).title+'</span><button data-nav="play">Devam et ›</button></div>':'')+missionCards(),history:records,settings,result:()=>result(history[reportIndex])};
  if(pages[to])main.innerHTML=pages[to]();
  if(to==='pause')main.innerHTML=`<div class="page-lead"><p class="eyebrow">${current().title}</p><h1>Görev duraklatıldı</h1><p>İlerlemen bu cihazda saklanıyor.</p></div><div class="actions"><button class="primary" data-nav="play">Göreve devam et ›</button><button data-nav="home">Üsse dön</button><button data-abandon>Görevi sonlandır</button></div><dialog><h2>Görev sonlandırılsın mı?</h2><p>Devam eden bu görevin ilerlemesi silinir.</p><div class="actions"><button data-keep>Göreve dön</button><button data-discard>Sonlandır</button></div></dialog>`;
  document.body.dataset.era=eraFor(current()).key;
  if(to==='play') {
    main.innerHTML=id==='boru'?vehicle():commandDesk();
    if(id==='komuta')cleanup=mountMap(main.querySelector('.holo-map canvas'),run,{layer:()=>layer,quality});
    else {
      const thisToken=token;
      import('./arena.mjs').then(({mountArena})=>{
        if(token!==thisToken)return;
        cleanup=mountArena(main,run,{save,finish:complete,sound,assist:()=>assist,camera:()=>cab,quality});
      }).catch(()=>{
        if(token!==thisToken)return;
        main.innerHTML='<div class="panel empty"><p>Oyun alanı yüklenemedi.</p><button data-nav="play">Yeniden dene</button></div>';
      });
    }
  }
  window.scrollTo(0,0);main.focus({preventScroll:true});
}
function refreshDesk() {
  const template=document.createElement('template');template.innerHTML=commandDesk();
  const focused=document.activeElement;
  const focusKey=focused?.dataset.fleet?'[data-fleet="'+focused.dataset.fleet+'"]':focused?.hasAttribute('data-wave')?'[data-wave]':null;
  for(const selector of ['.command-summary','.command-actions','.forecast','.network-insight','.wave-control']){
    main.querySelector(selector).replaceWith(template.content.querySelector(selector));
  }
  main.querySelectorAll('.node-pin').forEach((pin,i)=>{
    pin.classList.toggle('selected',run.selected===i);pin.setAttribute('aria-pressed',String(run.selected===i));
    pin.querySelector('span').textContent='Kalkan %'+run.nodes[i].shield;
  });
  cleanup?.update?.();
  if(focusKey){const next=main.querySelector(focusKey);(next?.disabled?main.querySelector('[data-wave]'):next)?.focus({preventScroll:true});}
}
document.addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button||button.disabled)return;
  sound.activate();
  if(button.dataset.era){era=button.dataset.era;go('missions');return;}
  if(button.dataset.layer){layer=button.dataset.layer;main.querySelectorAll('[data-layer]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.layer===layer)));cleanup?.update?.();return;}
  if(button.dataset.nav){go(button.dataset.nav);return;}
  if(button.hasAttribute('data-mission')&&!run){chosen=button.dataset.mission;era=eraFor(current()).key;preference('hisar-future-mission:'+id,chosen);go('brief');return;}
  if(button.hasAttribute('data-retry')&&!run){chosen=button.dataset.retry;go('play');return;}
  if(button.hasAttribute('data-record')){reportIndex=Number(button.dataset.record);go('result');return;}
  if(button.hasAttribute('data-sound')){sound.toggle();go('settings');return;}
  if(button.hasAttribute('data-camera')){cab=!cab;preference('hisar-future-camera',cab);button.textContent=cab?'Kabin':'Takip';return;}
  if(button.hasAttribute('data-abandon')){main.querySelector('dialog').showModal();return;}
  if(button.hasAttribute('data-keep')){go('play');return;}
  if(button.hasAttribute('data-discard')){run=null;save();go('missions');return;}
  if(screen!=='play'||id!=='komuta')return;
  if(button.hasAttribute('data-node')){run.selected=Number(button.dataset.node);save();refreshDesk();return;}
  if(button.dataset.fleet&&fleetAction(run,button.dataset.fleet,run.selected)){sound.cue();save();refreshDesk();}
  if(button.hasAttribute('data-wave')&&advanceWave(run)){sound.cue();save();if(run.done)complete();else refreshDesk();}
});
document.addEventListener('change',event=>{
  if(event.target.hasAttribute('data-quality')){quality=event.target.value;preference('hisar-render-quality',quality);}
  if(event.target.hasAttribute('data-assist')){assist=event.target.checked;preference('hisar-future-assist',assist);}
});
document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&!event.repeat&&!main.querySelector('dialog[open]')&&(screen==='play'||screen==='pause'))go(screen==='play'?'pause':'play');
});
document.addEventListener('visibilitychange',()=>{if(document.hidden){sound.suspend();if(screen==='play')go('pause');}});
window.addEventListener('pagehide',()=>{if(screen==='play')go('pause');else save();});
go('home');
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).catch(()=>{});
