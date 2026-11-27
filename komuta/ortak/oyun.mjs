import {configFor,orderLabels,newRun,valid,stops,chooseStop,preparation,handover,command,requestsFor,clock,routes,needsRoute,pickRoute,followUpPriority,startMorning} from './senaryo.mjs';
import {desk} from './masa.mjs';
const id=document.body.dataset.game;
const content=document.querySelector('main'),key='hisar-oyun-2:'+id;
const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function read(k,def){try{return JSON.parse(localStorage.getItem(k))??def;}catch{return def;}}
let saved=read(key,{}),run=valid(saved.run,id)?saved.run:null,history=Array.isArray(saved.history)?saved.history.filter(x=>valid(x,id)&&x.done).slice(0,12):[];
let screen='home',selected=0,release=null,sceneToken=0,assist=read('hisar-oyun-yon',true)!==false;
const themeButton=document.querySelector('[data-theme]');
function applyTheme(light){document.documentElement.dataset.hisarTheme=light?'light':'dark';themeButton.textContent=light?'Koyu görünüm':'Açık görünüm';document.querySelector('[name="theme-color"]').content=light?'#f4f6f8':'#081527';}
try{applyTheme(localStorage.getItem('hisar-theme')==='light');}catch{applyTheme(false);}
function save(){
  try{localStorage.setItem(key,JSON.stringify({run,history}));}
  catch{document.querySelector('#storage').hidden=false;}
}
function leave(){sceneToken++;if(release){release();release=null;}if(run)save();}
const shield='<svg viewBox="0 0 32 36" aria-hidden="true"><path d="M16 2 29 7v10c0 8-6 12-13 17C9 29 3 25 3 17V7z" fill="none" stroke="currentColor" stroke-width="2"/><path d="m8 20 8-9 8 9M10 24l6-7 6 7" fill="none" stroke="currentColor" stroke-width="2.5"/></svg>';
document.querySelector('.mark').innerHTML=shield;
function navButtons(){for(const b of document.querySelectorAll('header [data-nav]')){const active=b.dataset.nav===screen;b.classList.toggle('on',active);if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');}}
const arrow='<span aria-hidden="true">→</span>';
function morningAction(night){
  if(id!=='komuta'||!night||night.shift==='morning'||!night.done)return '';
  const completed=history.findIndex(s=>s.shift==='morning'&&s.parent===night.started);
  if(completed>=0)return '<button data-record="'+completed+'">Sabah raporunu aç →</button>';
  if(run)return run.shift==='morning'&&run.parent===night.started?'<button data-nav="play">Sabah görevine devam et →</button>':'';
  return '<button data-morning="'+night.started+'">Sabah vardiyasını devral →</button>';
}
function home(){const config=configFor(id,run);
  const night=history.find(s=>s.shift!=='morning');
  const next=run?'':morningAction(night);
  return `<section class="hero ${id}"><div class="hero-copy"><p class="overline"><i></i> ${config.type} · ${config.start}</p><h1>${config.title}</h1><p>${config.intro}</p><div class="actions"><button class="primary" data-nav="${run?'play':'brief'}">${run?'Göreve devam et':'Görev emrini aç'} ${arrow}</button>${run?'<button class="glass" data-nav="brief">Görev emri</button>':''}</div></div></section>
  ${next?'<div class="turn-panel"><div><small>Gece nöbetinin devamı</small><strong>İlk Işık Vardiyası</strong></div>'+next+'</div>':''}
  <div class="section-head"><div><p class="overline">GÖREV MASASI</p><h2>Görev akışı</h2></div><span>${config.role}</span></div>
  <div class="stage-grid">${config.stages.map(([name,desc],i)=>`<article class="stage"><span class="phase-num">0${i+1}</span><h3>${name}</h3><p>${desc}</p></article>`).join('')}</div>`;}
function brief(){const config=configFor(id,run);return `<div class="page-lead"><p class="overline">${config.role} · ${config.start}</p><h1>Görev emri</h1><p>${config.title} · ${config.place}</p></div>
  <article class="panel order">${config.order.map((text,i)=>`<div><span>0${i+1}</span><div><h3>${orderLabels[i]}</h3><p>${text}</p></div></div>`).join('')}</article><div class="end-actions"><button data-nav="home">Görev masası</button><button class="primary" data-nav="play">${run?.shift==='morning'?'Sabah görev masasına geç':run?'Göreve devam et':id==='boru'?'Görevi teslim al':'Nöbeti devral'} ${arrow}</button></div>`;}
function logbook(s){return `<details class="panel log"><summary>Görev defteri <span>${s.log.length} kayıt</span></summary><ol>${s.log.map(t=>'<li>'+esc(t)+'</li>').join('')||'<li>Görev açıldı.</li>'}</ol></details>`;}
const driveButtons=[['left','←','Sola dön'],['right','→','Sağa dön'],['back','↓','Fren ve geri'],['go','↑','İleri sür']];
function statusDrive(){
  const p=stops[run.target];content.querySelector('.deliver').disabled=true;content.querySelector('.distance').textContent=Math.round(Math.hypot(p.x-run.x,p.z-run.z))+' m';content.querySelector('.objective').textContent=run.loaded?run.target?p.name+' · '+p.load:'Ana depoya dön':'Depoda yükleri teslim al';
  content.querySelector('.deliver').textContent=!run.loaded?'Yükleri teslim al':run.target?'Teslim fişini al':'Seferi kapat';
  const board=content.querySelector('.route-board');board.hidden=!needsRoute(run);
  if(!board.hidden){
    board.innerHTML='<p class="overline">YOL BÜLTENİ</p><h2>İkinci teslim için yolu seç</h2><div class="road-cards">'+Object.entries(routes).map(([key,r])=>{
      const pts=[[stops[1].x,stops[1].z],...r.points,[stops[2].x,stops[2].z]];
      const length=Math.round(pts.slice(1).reduce((n,p,i)=>n+Math.hypot(p[0]-pts[i][0],p[1]-pts[i][1]),0));
      return `<button data-route="${key}"><strong>${r.name}</strong><span>${r.detail}</span><small>${length} m · ${r.points.length} işaret</small></button>`;
    }).join('')+'</div>';
    content.querySelector('.objective').textContent='Yol bülteninden güzergâh seç';
  }
  const process=content.querySelector('.field-process');
  if(!run.loaded){
    process.innerHTML='<strong>Çıkış kontrolü</strong><div class="actions">'+[['crewChecked','Personel yoklaması · 3/3'],['loadChecked','Yük çizelgesi · 2 sandık']].map(([key,label])=>`<button data-check="${key}" aria-pressed="${!!run[key]}">${run[key]?'✓ ':''}${label}</button>`).join('')+'</div>';
  }else if(run.target){
    process.innerHTML='<strong>Teslim belgesi</strong><small>Alıcı · '+p.recipient+'</small><label>Verilecek yük <select class="cargo"><option value="">Sandık seç</option>'+[1,2].filter(i=>!run.receipts.includes(i)).map(i=>'<option value="'+i+'">'+stops[i].load+'</option>').join('')+'</select></label><span class="feedback" role="status"></span>';
  }else{process.innerHTML='<strong>Üs dönüşü</strong><small>İki imzalı fiş görev defterinde. Depoda durarak seferi kapat.</small>';}
  content.querySelector('.slips').textContent=run.receipts.length+'/2 teslim fişi';
  content.querySelector('.route-options').innerHTML=run.loaded&&run.receipts.length===0?'<span>İlk durak</span>'+[1,2].map(i=>`<button data-stop="${i}" aria-pressed="${run.target===i}">${stops[i].short}</button>`).join(''):'';
  content.querySelector('.journal-slot').innerHTML=logbook(run);
}
function driving(){return `<div class="play-head"><div><p class="overline">ARAÇ KOMUTANI · KUZEY VADİSİ</p><h1>Beyaz Geçit</h1></div><button data-nav="pause">Duraklat</button></div>
  <section class="panel route-board" hidden></section><div class="drive-view"><span class="scene-load" role="status">Vadi hazırlanıyor…</span><canvas class="terrain" aria-label="Kuzey vadisi sürüş alanı"></canvas><div class="telemetry"><span class="speed">0 km/sa</span><span class="slips"></span><span class="road-progress" hidden></span></div><button class="map-toggle" aria-label="Vadi haritasını büyüt" aria-haspopup="dialog"><canvas class="minimap" aria-hidden="true" width="156" height="110"></canvas></button><div class="pad">${driveButtons.map(([key,icon,label])=>`<button data-drive="${key}" aria-label="${label}" title="${label}">${icon}</button>`).join('')}</div></div>
  <div class="turn-panel"><div><small>Güncel görev</small><strong class="objective"></strong><small><b class="bearing">↑</b> <span class="distance">0 m</span></small></div><button class="primary deliver" disabled></button></div>
  <dialog class="map-dialog" aria-labelledby="full-map-title"><div class="panel-title"><h2 id="full-map-title">Vadi haritası</h2><button class="close-map">Haritayı kapat</button></div><canvas width="560" height="372" aria-label="Depo, yerleşimler, araç ve işaretli yollar"></canvas><div class="map-legend"><span>▲ Araç</span><span>■ Sıradaki işaret</span><b class="map-status"></b></div></dialog>
  <div class="panel field-process"></div><div class="drive-tools"><div class="route-options"></div><label><input type="checkbox" data-assist ${assist?'checked':''}> Yön yardımı</label></div><p class="help">Ok tuşları veya ekran kumandasıyla sür. Teslim için işarette dur. Yön yardımı açıkken ileri tuşu aracı seçili durağa yöneltir.</p><div class="journal-slot"></div>`;}
function finish(){
  if(!run?.done)return;
  history=[run,...history.filter(s=>s.started!==run.started)].slice(0,12);run=null;save();go('report');
}
function report(s){if(!s)return '<p>Görev kaydı bulunamadı.</p>';
  const config=configFor(id,s),requests=id==='komuta'?requestsFor(s):[];
  const rows=id==='boru'?[['Mürettebat','3 / 3'],['Teslim fişi',s.receipts.length+' / 2'],['Mesafe',Math.round(s.distance)+' m']]:
  [['Kapalı talep','3 / 3'],['Hedef saatte kapanan',s.jobs.filter((j,i)=>j.closed<=requests[i].due).length+' / 3'],['Devir saati',clock(s.turn,s)]];
  return `<div class="page-lead"><p class="overline">${config.title}</p><h1>${id==='boru'?'Sefer sonu raporu':s.shift==='morning'?'Sabah vardiya raporu':'Nöbet devir raporu'}</h1><p>${id==='boru'?'Yardım yükleri teslim edildi. Mürettebat üsse döndü.':'Üç talebin sonucu ve ekip durumu yeni vardiyaya aktarıldı.'}</p></div>
  <div class="stage-grid stats">${rows.map(([n,v])=>`<div class="stage"><small>${n}</small><strong>${v}</strong></div>`).join('')}</div>
  ${id==='komuta'?'<div class="panel summary-list">'+s.jobs.map((j,i)=>`<p><b>${requests[i].place}</b> · ${clock(j.closed,s)} · ${j.closed<=requests[i].due?'Zamanında':(j.closed-requests[i].due)*10+' dk gecikme'}</p>`).join('')+'</div>':''}${logbook(s)}
  ${id==='boru'&&Number.isFinite(s.passage?.metres)?`<div class="turn-panel"><div><small>İki yerleşim arası</small><strong>${routes[s.passage.route].name}</strong></div><b>${s.passage.metres} m · ${s.passage.seconds} sn</b></div>`:''}
  ${id==='komuta'&&s.shift!=='morning'?`<div class="turn-panel"><div><small>${Number.isInteger(s.priority)?'Sabaha aktarılan ön teyit':'Kayıttan önerilen sabah takibi'}</small><strong>${requests[followUpPriority(s)].place}</strong></div>${morningAction(s)}</div>`:''}
  <div class="end-actions"><button data-nav="history">Kayıtlar</button><button class="primary" data-nav="home">Görev masasına dön ${arrow}</button></div>`;}
function records(){const config=configFor(id,run);return `<div class="page-lead"><p class="overline">${config.name}</p><h1>Görev kayıtları</h1></div>${run?'<div class="turn-panel"><div><small>Devam eden görev</small><strong>'+config.title+'</strong></div><button data-nav="play">Devam et →</button></div>':''}${history.length?'<div class="panel recs">'+history.map((s,i)=>`<button data-record="${i}"><strong>${configFor(id,s).title}</strong><span>${new Date(s.started).toLocaleDateString('tr-TR')} · Raporu aç →</span></button>`).join('')+'</div>':'<div class="panel empty">Tamamlanan görevlerin raporları burada görünür.</div>'}`;}
let shownReport=0;
function go(to){
  leave();screen=to;navButtons();const config=configFor(id,run);
  if(to==='play'&&!run){run=newRun(id);save();}
  if(to==='play'&&id==='komuta'&&requestsFor(run)[selected].arrives>run.turn)selected=0;
  if(to==='home')content.innerHTML=home();
  if(to==='brief')content.innerHTML=brief();
  if(to==='history')content.innerHTML=records();
  if(to==='report')content.innerHTML=report(history[shownReport]);
  if(to==='pause')content.innerHTML=`<div class="page-lead"><p class="overline">${config.name}</p><h1>Görev duraklatıldı</h1><p>${config.title} · İlerleme bu cihazda saklanır.</p></div><div class="actions"><button class="primary" data-nav="play">Göreve devam et →</button><button data-nav="home">Görev masası</button></div>`;
  if(to==='play'&&id==='komuta')content.innerHTML=desk(run,selected)+logbook(run);
  if(to==='play'&&id==='boru'){
    content.innerHTML=driving();statusDrive();
    const token=sceneToken;import('../../oyun/surus.mjs').then(({attachDrive})=>{if(token!==sceneToken)return;
      release=attachDrive(content,run,{assist:()=>assist,save,onAction:speed=>{const cargo=Number(content.querySelector('.cargo')?.value);
      if(run.loaded&&run.target&&cargo!==run.target){content.querySelector('.feedback').textContent='Teslim belgesindeki yükü kontrol et: '+stops[run.target].load+'.';content.querySelector('.cargo').focus();return;}
      if(handover(run,speed,cargo)){save();if(run.done){shownReport=0;finish();}else statusDrive();}}});}).catch(()=>{if(token!==sceneToken)return;const note=content.querySelector('.scene-load');note.textContent='Sürüş alanı açılamadı. ';const retry=document.createElement('button');retry.dataset.nav='play';retry.textContent='Yeniden dene';note.append(retry);});
  }
  window.scrollTo(0,0);content.focus({preventScroll:true});
}
function updateDesk(){const top=window.scrollY,focus=document.activeElement?.dataset,open=!!content.querySelector('.log[open]');content.innerHTML=desk(run,selected)+logbook(run);content.querySelector('.log').open=open;if(focus?.site)content.querySelector('.ticket[data-site="'+selected+'"]')?.focus({preventScroll:true});window.scrollTo(0,top);}
document.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b||b.disabled)return;
  if(b.hasAttribute('data-theme')){const light=document.documentElement.dataset.hisarTheme!=='light';applyTheme(light);try{localStorage.setItem('hisar-theme',light?'light':'dark');}catch{}return;}
  if(b.hasAttribute('data-morning')&&!run){
    const night=history.find(s=>s.started===Number(b.dataset.morning));
    const next=night&&startMorning(night);
    if(next){run=next;selected=next.priority;go('brief');}return;
  }
  if(b.dataset.nav){go(b.dataset.nav);return;}
  if(b.hasAttribute('data-record')){shownReport=Number(b.dataset.record);go('report');return;}
  if(screen!=='play')return;
  if(b.hasAttribute('data-check')){if(preparation(run,b.dataset.check)){save();statusDrive();}return;}
  if(b.hasAttribute('data-stop')){if(chooseStop(run,Number(b.dataset.stop))){save();statusDrive();}return;}
  if(b.hasAttribute('data-route')){if(pickRoute(run,b.dataset.route)){save();statusDrive();content.querySelector('.drive-view').scrollIntoView({block:'nearest'});}return;}
  if(b.hasAttribute('data-priority')){if(command(run,'priority',Number(b.dataset.priority))){save();updateDesk();}return;}
  if(b.hasAttribute('data-site')){selected=Number(b.dataset.site);updateDesk();return;}
  if(b.dataset.order&&command(run,b.dataset.order,selected,Number(b.dataset.team))){save();if(run.done){shownReport=0;finish();}else updateDesk();}
});
document.addEventListener('change',e=>{if(e.target.hasAttribute('data-assist')){assist=e.target.checked;try{localStorage.setItem('hisar-oyun-yon',JSON.stringify(assist));}catch{}}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!content.querySelector('.map-dialog[open]')&&!e.repeat&&(screen==='play'||screen==='pause'))go(screen==='play'?'pause':'play');});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&screen==='play')go('pause');});
window.addEventListener('pagehide',()=>{if(screen==='play')go('pause');else if(run)save();});
window.addEventListener('storage',e=>{if(e.key==='hisar-theme')applyTheme(e.newValue==='light');});
go('home');
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).catch(()=>{});
