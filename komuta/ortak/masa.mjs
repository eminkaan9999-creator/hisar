import {requestsFor,durationFor,followUpPriority,configFor,teams,clock,occupied,pendingDecision} from './senaryo.mjs';
const statusText={new:'Teyit bekliyor',confirmed:'Ekip bekliyor',busy:'Ekip sahada',arrived:'Teslim bildirildi',closed:'Kapandı'};
const places=[[28,66],[49,27],[77,52],[79,82]];
export function desk(s,selected){
  const requests=requestsFor(s),morning=s.shift==='morning',r=requests[selected],j=s.jobs[selected],count=s.jobs.filter(k=>k.stage==='closed').length,total=requests.length,complete=count===total;
  const stations=requests.map((q,i)=>q.arrives>s.turn?'':`<button class="map-pin ${selected===i?'selected':''} ${s.jobs[i].stage==='closed'?'closed':''}" data-site="${i}" style="left:${places[i][0]}%;top:${places[i][1]}%" aria-label="${q.place}" aria-pressed="${selected===i}"><i></i><span>${q.place}</span></button>`).join('');
  const crewMarks=s.jobs.map((job,i)=>{
    if(job.stage!=='busy')return '';
    const fraction=Math.max(0,Math.min(1,1-(job.finish-s.turn)/durationFor(s,i)));
    const [destX,destY]=places[i],x=11+(destX-11)*fraction,y=92+(destY-92)*fraction;
    const offset=job.crew===1?-6:0;
    return `<span class="crew-marker" style="left:calc(${x}% + ${offset}px);top:calc(${y}% + ${offset}px)" aria-hidden="true">${job.crew===0?'U':'T'}</span>`;
  }).join('');
  const tabs=requests.map((q,i)=>q.arrives>s.turn?'':`<button class="ticket ${selected===i?'chosen':''}" data-site="${i}" aria-pressed="${selected===i}"><strong>${q.place}</strong><small>${statusText[s.jobs[i].stage]}</small></button>`).join('');
  let actions='';
  if(j.stage==='new')actions='<button class="primary" data-order="verify">Kaynağından teyit et</button>';
  if(j.stage==='confirmed')actions=r.teams.map(t=>`<button data-order="assign" data-team="${t}" ${occupied(s,t)?'disabled':''}>${teams[t]}${occupied(s,t)?' · görevde':' · görevlendir'}</button>`).join('');
  if(j.stage==='busy')actions=`<p class="notice">${teams[j.crew]} sahada. Beklenen dönüş ${clock(j.finish,s)}.</p>`;
  if(j.stage==='arrived')actions='<button class="primary" data-order="close">Teslimi kayda geçir</button>';
  if(j.stage==='closed')actions=`<p class="notice">Teslim kaydı ${clock(j.closed,s)} itibarıyla kapandı.</p>`;
  const priority=complete&&(!s.shift||s.shift==='night')?`<section class="panel next-shift"><p class="overline">DEVİR NOTU</p><h2>Sabah önce hangi nokta kontrol edilsin?</h2><p>Seçtiğin noktanın teyidi sabah vardiyasına aktarılır.</p><div class="actions">${requests.map((q,i)=>`<button data-priority="${i}" aria-pressed="${i===followUpPriority(s)}">${q.place}</button>`).join('')}</div></section>`:'';
  const last=s.log.at(-1);
  const decision=pendingDecision(s)?`<section class="panel event-panel" aria-labelledby="event-title"><p class="overline">YENİ BİLDİRİM · ${clock(s.turn,s)}</p><h2 id="event-title">Yağmur güçlendi</h2><p>Açık alandaki dağıtım taşınmalı. Teslim yerini ve ekibin görev süresini seç.</p><div class="road-cards"><button data-distribution="central"><strong>Kapalı pazara geç</strong><span>20 hane · 10 dakika · İki ekipten biri</span><small>Hedef saat 10.50</small></button><button data-distribution="local"><strong>Mahalleye servis götür</strong><span>28 hane · 30 dakika · Ulaştırma ekibi</span><small>Hedef saat 11.00</small></button></div></section>`:'';
  const remaining=(r.due-s.turn)*10;
  const deadline=j.stage==='closed'?'Teslim kaydı kapalı':remaining<0?Math.abs(remaining)+' dk gecikme':remaining===0?'Hedef saat geldi':'Hedefe '+remaining+' dk';
  const schedule=s.jobs.map((job,i)=>{
    if(requests[i].arrives>s.turn)return '';
    return '<div class="schedule-item '+job.stage+'"><span>'+requests[i].place+'</span><b>'+statusText[job.stage]+'</b><small>'+ (job.stage==='busy'?'Dönüş '+clock(job.finish,s):'Hedef '+clock(requests[i].due,s))+'</small></div>';
  }).join('');
  return `<div class="play-head"><div><p class="overline">KOORDİNASYON MERKEZİ</p><h1>${configFor('komuta',s).title}</h1></div><button data-nav="pause">Duraklat</button></div>
  ${decision}<div class="desk-grid"><section class="panel map-panel"><div class="panel-title"><h2>Durum haritası</h2><span class="clock">${clock(s.turn,s)}</span></div>
  <div class="district-map"><svg viewBox="0 0 600 280" preserveAspectRatio="none" aria-hidden="true"><defs><pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="#263e4a" stroke-width=".85"/></pattern></defs><rect width="600" height="280" fill="url(#grid)"/><g fill="none" stroke="#2c5156" stroke-width="1.5"><path d="M-8 70Q100 25 139 72T295 45T502 21T635 44 M-8 85Q91 36 136 85T300 57T504 33T635 57 M-8 100Q91 52 132 99T305 72T509 49T635 72 M-8 115Q91 67 128 114T310 87T514 64T635 87 M20 232Q68 180 130 219T255 225T431 188T626 214 M10 250Q70 196 125 234T252 243T427 204T626 231 M0 268Q70 213 122 250T249 260T424 220T626 249"/></g><path d="M-20 131C91 134 139 246 235 190S296 85 408 108S552 162 626 64" fill="none" stroke="#34667c" stroke-width="10"/><path d="M20 220L168 184L237 137L294 75L349 98L462 146L578 219" fill="none" stroke="#91a497" stroke-width="2" stroke-dasharray="6 4"/></svg><span class="north">K ↑</span><span class="desk-base">Merkez</span>${stations}${crewMarks}</div>
  <div class="crew-row">${teams.map((name,t)=>{const i=s.jobs.findIndex(k=>k.stage==='busy'&&k.crew===t);return `<div><small>${name}</small><strong>${i<0?'Hazır':requests[i].place}</strong>${i<0?'':'<small>Dönüş '+clock(s.jobs[i].finish,s)+'</small>'}</div>`;}).join('')}</div></section>
  <section class="panel request"><div class="panel-title"><p class="overline">TALEP MASASI</p><span>${count}/${total} kapalı</span></div><div class="tabs">${tabs}</div>
  <h2>${r.name}</h2><p class="deadline ${remaining<0&&j.stage!=='closed'?'late':''}">${deadline}</p><p>${r.message}</p><dl class="facts"><div><dt>Bildiren</dt><dd>${r.source}</dd></div><div><dt>Saha süresi</dt><dd>${durationFor(s,selected)*10} dk</dd></div><div><dt>Hedef saat</dt><dd>${clock(r.due,s)}</dd></div></dl>${morning&&s.late.includes(selected)?'<p class="notice">Gece teslimi gecikti. Takip süresine 10 dakika eklendi.</p>':''}${j.stage==='confirmed'?'<p class="notice">'+r.confirm+'</p>':''}<div class="actions">${actions}</div></section></div>
  <section class="panel schedule"><h2>Ekip ve teslim takvimi</h2><div class="schedule-grid">${schedule}</div></section>${priority}${last?'<div class="last-event" role="status"><b>Son kayıt</b> '+last.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))+'</div>':''}
  <div class="turn-panel"><div><strong>${complete?'Devir için hazır':'Vardiya saati'}</strong><small>${complete?total+' teslim kaydı kapandı.':'Her turda 10 dakika geçer. Yeni bildirimleri defterden takip et.'}</small></div><button class="primary" data-order="${complete?'finish':'tick'}" ${pendingDecision(s)?'disabled':''}>${complete?'Nöbeti devret':'10 dakika ilerlet'} →</button></div>`;
}
