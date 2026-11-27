import {modes,order,acts,shapes,bits,hash,dayKey,rotate,connected,roundFor,createGame,resultFor} from './arcade.mjs?v=27';

const screen=document.getElementById('screen'), nav=document.getElementById('nav');
const pages={oyunlar:'Oyunlar',bolumler:'Bölümler',kayitlar:'Kayıtlar',ayarlar:'Ayarlar'};
const glyphs={
 oyunlar:'<rect x="2" y="4" width="8" height="7" rx="2"/><rect x="14" y="4" width="8" height="7" rx="2"/><rect x="2" y="15" width="8" height="6" rx="2"/><rect x="14" y="15" width="8" height="6" rx="2"/>',
 bolumler:'<path d="M5 5h10a4 4 0 0 1 0 8H9a3 3 0 0 0 0 6h10"/><circle cx="4" cy="5" r="2"/><circle cx="20" cy="19" r="2"/>',
 kayitlar:'<path d="M4 4v16h17M8 15v-4m5 4V6m5 9v-7"/>',
 ayarlar:'<path d="M3 7h4m5 0h9M3 17h10m5 0h3"/><circle cx="9" cy="7" r="2.5"/><circle cx="15" cy="17" r="2.5"/>',
 memory:'<circle cx="8" cy="8" r="4"/><path d="M16 4l5 8h-9z"/><rect x="5" y="15" width="6" height="6" rx="1"/><path d="m18 14 4 4-4 4-4-4z"/>',
 circuit:'<path d="M4 18v-6h8V5h7"/><circle cx="4" cy="19" r="2"/><circle cx="20" cy="5" r="2"/>',
 rhythm:'<path d="M3 13h3m3-5v10m4-15v18m4-13v10m4-7v4"/>',
 daily:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v5m10-5v5M3 10h18m-13 5h4"/>',
 arrow:'<path d="M4 12h15m-6-6 6 6-6 6"/>',back:'<path d="m14 5-7 7 7 7"/>',
 lock:'<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
 play:'<path d="m8 4 12 8-12 8z"/>',pause:'<path d="M8 5v14m8-14v14"/>',
 star:'<path d="m12 3 2.7 5.8 6.3.9-4.5 4.4 1 6.2-5.5-2.9-5.5 2.9 1-6.2L3 9.7l6.3-.9z"/>',
 sound:'<path d="M3 9h4l5-5v16l-5-5H3zm13-1a6 6 0 0 1 0 8m3-10a9 9 0 0 1 0 12"/>',
 trophy:'<path d="M7 4h10v5c0 4-2 6-5 6s-5-2-5-6zM7 6H3c0 4 1 6 5 6m9-6h4c0 4-1 6-5 6m-4 3v4m-4 2h8"/>',
 layers:'<path d="m3 8 9-5 9 5-9 5zM3 13l9 5 9-5m-18 5 9 5 9-5"/>'
};
function icon(name){return '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+glyphs[name]+'</svg>';}
const fmt=new Intl.NumberFormat('tr-TR');
const num=v=>fmt.format(v);
const recordPrefix='hisar-arena:run:';
const pendingKey='hisar-arena:active:1';
const preferencesKey='poligon-appearance-v1';
function readJson(store,key){try{return JSON.parse(store.getItem(key));}catch{return null;}}
function localData(key){try{return readJson(localStorage,key);}catch{return null;}}
const prefs=Object.assign({arenaContrast:'standard',arenaMotion:'system',audio:false,touch:false},localData(preferencesKey));
function applyPrefs(){document.documentElement.dataset.contrast=prefs.arenaContrast;document.documentElement.dataset.motion=prefs.arenaMotion;}
applyPrefs();
let records=[], volatileRecords=new Map();
function readRecords(){
 const rows=new Map(volatileRecords);
 try{for(let i=0;i<localStorage.length;i++){
   const key=localStorage.key(i);
   if(!key?.startsWith(recordPrefix))continue;
   const row=localData(key);
   if(row && typeof row.id==='string' && typeof row.at==='number' && Number.isFinite(row.score) &&
     Number.isFinite(row.xp) && (row.kind==='daily'||order.includes(row.mode))) rows.set(row.id,row);
 }}catch{}
 records=[...rows.values()].sort((a,b)=>b.at-a.at);
}
function sessionRead(){try{return readJson(sessionStorage,pendingKey);}catch{return null;}}
const tabGame=sessionRead();
let game=tabGame || localData(pendingKey);
if(!game || !game.puzzle || !order.includes(game.puzzle.mode) || !Number.isInteger(game.round) || game.round<0 || game.round>2 || !['free','campaign','daily'].includes(game.kind))game=null;
function saveSession(){
 if(!game)return;
 const snapshot=JSON.stringify(game);
 try { sessionStorage.setItem(pendingKey,snapshot); } catch {}
 try {
   if(!['won','lost'].includes(game.phase))localStorage.setItem(pendingKey,snapshot);
   else if(localData(pendingKey)?.id===game.id)localStorage.removeItem(pendingKey);
 } catch {}
}
if(game && !['won','lost'].includes(game.phase) && localData(recordPrefix+game.id))game=null;
function completed(){return records.filter(r=>r.won);}
function bestStage(i){return Math.max(0,...records.filter(r=>r.won&&r.kind==='campaign'&&r.stage===i).map(r=>r.stars));}
function unlocked(){let i=0;while(i<18 && bestStage(i))i++;return i;}
function totalXP(){return records.reduce((sum,r)=>sum+r.xp,0);}
function bestScore(mode){return Math.max(0,...records.filter(r=>r.mode===mode&&r.kind!=='daily').map(r=>r.score));}
function titleOf(r){return r.kind==='daily'?'Günün parkuru':modes[r.mode]?.name||'Oyun';}
function stars(n){return '<span class="stars" aria-label="'+n+' yıldız">'+'★'.repeat(n)+'<i>'+'☆'.repeat(3-n)+'</i></span>';}
function action(label,id,cls='button',extra=''){return '<button type="button" class="'+cls+'" data-action="'+id+'" '+extra+'>'+label+'</button>';}
function chapterTitle(i){return acts[Math.floor(i/3)]+' · '+(i%3+1);}
function sectionTitle(name,addon=''){return '<div class="section-title"><h2>'+name+'</h2>'+addon+'</div>';}
function pageHead(title,description){return '<header class="page-head"><h1>'+title+'</h1><p>'+description+'</p></header>';}
function modeArt(mode){
 if(mode==='memory')return '<div aria-hidden="true" class="cover-art memory-art"><i></i><i></i><i></i><i></i></div>';
 if(mode==='rhythm')return '<div aria-hidden="true" class="cover-art wave-art">'+[19,35,58,85,55,96,68,40,72,54,33,16].map(h=>'<i style="--h:'+h+'%"></i>').join('')+'</div>';
 return '<div aria-hidden="true" class="cover-art wire-art"><svg viewBox="0 0 160 84" fill="none"><g stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path stroke="#367b88" d="M9 35h33V16h28m40 52h38"/><path stroke="#8cf8db" d="M12 68h35V44h48V20h52"/></g><circle cx="12" cy="68" r="6" fill="#a8ffe5"/><circle cx="147" cy="20" r="6" fill="#a8ffe5"/></svg></div>';
}
function home(){
 const day=dayKey(), daily=records.filter(r=>r.kind==='daily'&&r.day===day&&r.won);
 const date=new Intl.DateTimeFormat('tr-TR',{day:'numeric',month:'long'}).format(new Date());
 const active=game&&!['won','lost'].includes(game.phase);
 return (active?'<div class="resume panel"><span>'+icon('pause')+' <b>'+titleOf(game)+'</b> · Tur '+(game.round+1)+'/3</span>'+action('Devam et','resume','sub-button')+'</div>':'')+
 '<section class="daily-hero"><div><span class="daily-date">'+icon('daily')+date+'</span><h1>Günün<br>parkuru</h1><p>Üç oyun, üç tur. '+(daily.length?'Bugünkü rekorun '+num(Math.max(...daily.map(r=>r.score)))+' puan.':'Bugünün dizisini, devresini ve ritmini çöz.')+'</p>'+action((daily.length?'Tekrar oyna':'Parkura gir')+icon('arrow'),'daily','button')+'</div></section>'+
 sectionTitle('Oyun salonu')+'<div class="games-grid">'+order.map(key=>{
  const m=modes[key];return '<button type="button" class="game-card '+key+'" data-action="free" data-mode="'+key+'"><div class="card-art">'+modeArt(key)+'</div><div class="card-copy"><small>'+m.type+'</small><strong>'+m.name+'</strong><span>'+m.tip+'</span></div><i class="card-arrow">'+icon('arrow')+'</i></button>';
 }).join('')+'</div><a class="classic-row panel" href="klasik.html">'+icon('layers')+'<span><b>Klasik poligon</b><small>Önceki simülatör ve kayıtların</small></span>'+icon('arrow')+'</a>';
}
function journey(){
 const step=unlocked();
 return pageHead('Bölümler','Her bölümü tamamladığında sıradaki açılır. Kazandığın yıldızları artırmak için tekrar oynayabilirsin.')+
 '<div class="progress-box panel"><strong>'+step+' / 18 bölüm</strong><progress aria-label="Bölüm ilerlemesi" value="'+step+'" max="18"></progress></div>'+
 '<div class="chapters">'+acts.map((act,k)=>'<section class="chapter panel"><div class="chapter-head"><span>KISIM '+(k+1)+'</span><h2>'+act+'</h2></div><div class="stage-list">'+order.map((mode,j)=>{
 const i=k*3+j,st=bestStage(i),locked=i>step;return '<button type="button" class="stage-row '+mode+'" data-action="stage" data-stage="'+i+'" '+(locked?'disabled':'')+'><span class="mode-icon">'+icon(locked?'lock':mode)+'</span><span>'+modes[mode].name+'</span>'+(st?stars(st):locked?'<small>Kilitli</small>':icon('arrow'))+'</button>';
 }).join('')+'</div></section>').join('')+'</div>';
}
let filter='all';
function stats(){
 const wins=completed(),xp=totalXP();
 const chosen=records.filter(r=>filter==='all'||(filter==='daily'?r.kind==='daily':r.mode===filter&&r.kind!=='daily'));
 return pageHead('Kayıtlar','Bu cihazdaki oyun geçmişin, kişisel rekorların ve kazandığın rozetler.')+
 '<div class="metrics">'+[['Tamamlanan',wins.length],['Deneyim',num(xp)+' XP'],['Bölüm yıldızı',Array.from({length:18},(_,i)=>bestStage(i)).reduce((a,b)=>a+b,0)]].map(([a,b])=>'<div class="panel"><small>'+a+'</small><b>'+b+'</b></div>').join('')+'</div>'+
 sectionTitle('Kişisel rekorlar')+'<div class="best-grid">'+order.map(k=>'<div class="best panel '+k+'"><span class="mode-icon">'+icon(k)+'</span><span>'+modes[k].name+'</span><b>'+num(bestScore(k))+'</b></div>').join('')+'</div>'+
 sectionTitle('Rozetler')+'<div class="badges-grid">'+[['İlk zafer','Bir oyunu tamamla',wins.length>0],['Üç yıldız','Bir oyunu hatasız bitir',wins.some(r=>r.stars===3)],['Günlük usta','Üç farklı gün parkuru bitir',new Set(wins.filter(r=>r.kind==='daily').map(r=>r.day)).size>=3]].map(([t,d,on])=>'<div class="badge-item panel '+(on?'earned':'')+'">'+icon(on?'trophy':'lock')+'<span><b>'+t+'</b><small>'+d+'</small></span></div>').join('')+'</div>'+
 sectionTitle('Son oyunlar')+'<label class="history-filter">Oyun <select id="history-filter">'+[['all','Tümü'],['daily','Günün parkuru'],...order.map(k=>[k,modes[k].name])].map(([k,v])=>'<option value="'+k+'" '+(filter===k?'selected':'')+'>'+v+'</option>').join('')+'</select></label>'+
 (chosen.length?'<ul class="history panel">'+chosen.slice(0,20).map(r=>'<li><span><b>'+titleOf(r)+'</b><small>'+new Intl.DateTimeFormat('tr-TR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(r.at)+' · '+(r.won?'Tamamlandı':'Tur '+(r.rounds+1))+'</small></span><strong>'+num(r.score)+' <small>puan</small></strong></li>').join('')+'</ul>':'<p class="empty panel">Bu seçim için henüz oyun kaydı yok.</p>');
}
function settings(){
 function options(name,title,rows){return '<fieldset class="setting panel"><legend>'+title+'</legend>'+rows.map(([key,label])=>'<label><input type="radio" name="'+name+'" value="'+key+'" '+(String(prefs[name])===key?'checked':'')+'><span>'+label+'</span></label>').join('')+'</fieldset>';}
 return pageHead('Ayarlar','Görünümü ve oyun geri bildirimlerini bu cihaz için ayarla.')+'<div class="settings-grid">'+
 options('arenaContrast','Tema',[['standard','Gece mavisi'],['high','Yüksek kontrast']])+options('arenaMotion','Hareket',[['system','Cihaz ayarını kullan'],['reduce','Hareketi azalt']])+options('audio','Oyun sesleri',[['false','Kapalı'],['true','Açık']])+options('touch','Dokunsal geri bildirim',[['false','Kapalı'],['true','Desteklenen cihazlarda açık']])+
 '</div><div class="version-box panel"><span><b>HİSAR Arena</b><small>Geliştirici · Emin Kaan Boyacı</small></span><span>Sürüm 27</span></div>';
}
let route='',timer=0,beatClock=0,lastBeat=-1,audioContext;
let rhythmStart=0,beatUsed=-1,recallStart=0;
const shapeSigns=['●','▲','■','◆'];
function stopTimers(){clearTimeout(timer);clearInterval(beatClock);timer=0;beatClock=0;lastBeat=-1;beatUsed=-1;}
function tone(index=0){
 if(!prefs.audio)return;
 try{
  audioContext??=new (window.AudioContext||window.webkitAudioContext)();
  if(audioContext.state==='suspended')audioContext.resume().catch(()=>{});
  const osc=audioContext.createOscillator(),gain=audioContext.createGain(),t=audioContext.currentTime;
  osc.frequency.value=[330,415,494,622][index%4];gain.gain.setValueAtTime(.038,t);gain.gain.exponentialRampToValueAtTime(.001,t+.10);
  osc.connect(gain);gain.connect(audioContext.destination);osc.start(t);osc.stop(t+.12);
 }catch{}
}
function tap(index){tone(index);if(prefs.touch)try{navigator.vibrate?.(16);}catch{}}
function pause(){
 stopTimers();
 if(game && ['show','input','running'].includes(game.phase)){
   game.phase='paused';
   if(game.puzzle.mode==='memory')game.puzzle.cursor=0;
   saveSession();
 }
}
if(game){pause();if(!tabGame)saveSession();}
function start(kind,mode='memory',stage=-1){
 const begin=()=>{
  stopTimers();const day=dayKey();
  const difficulty=kind==='campaign'?Math.floor(stage/3)+1:kind==='daily'?2+hash(day)%3:Math.min(6,1+Math.floor(completed().filter(r=>r.mode===mode&&r.kind==='free').length/2));
  const id=globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+Math.random().toString(36).slice(2);
  game=createGame(kind,mode,difficulty,stage,day,id);saveSession();go('tur');tone(1);
 };
 if(game&&!['won','lost'].includes(game.phase)){
   const dlg=document.createElement('dialog');dlg.className='replace-dialog';
   dlg.innerHTML='<h2>Yeni oyun açılsın mı?</h2><p>Devam eden oyunun kapanacak. Tamamladığın oyunların kayıtları korunur.</p><div>'+action('Vazgeç','cancel','sub-button')+action('Yeni oyunu aç','replace')+'</div>';
   document.body.appendChild(dlg);dlg.addEventListener('close',()=>dlg.remove(),{once:true});
   dlg.addEventListener('click',e=>{const b=e.target.closest('button');if(b){dlg.close();if(b.dataset.action==='replace')begin();}});
   dlg.showModal();
 }else begin();
}
function updateNav(){
 nav.innerHTML=Object.entries(pages).map(([key,name])=>'<a href="#'+key+'" '+(key===route?'aria-current="page"':'')+'>'+icon(key)+'<span>'+name+'</span></a>').join('');
 document.body.classList.toggle('playing',route==='tur');
 document.getElementById('xp').textContent=num(totalXP())+' XP';
}
function render(){
 readRecords();updateNav();
 if(route==='tur'&&game){renderGame();return;}
 screen.innerHTML=({oyunlar:home,bolumler:journey,kayitlar:stats,ayarlar:settings}[route]||home)();
}
function go(page){if(location.hash==='#'+page){switchPage();}else location.hash=page;}
function switchPage(){
 const key=location.hash.slice(1);
 if(route==='tur'&&key!=='tur')pause();
 route=(Object.hasOwn(pages,key)||(key==='tur'&&game))?key:'oyunlar';
 render();window.scrollTo(0,0);screen.focus({preventScroll:true});
}
function scoreRound(){
 stopTimers();
 const p=game.puzzle;
 let bonus;
 if(p.mode==='circuit')bonus=Math.max(0,75-2*p.board.moves);
 else if(p.mode==='rhythm')bonus=p.precision||0;
 else bonus=Math.max(0,Math.round(70-(performance.now()-recallStart)/120));
 game.points+=100+game.difficulty*20+game.hearts*15+bonus;
 game.phase=game.round===2?'won':'between';

 if(game.phase==='won')finish();else saveSession();
 tap(3);render();
}
function finish(){
 const row=localData(recordPrefix+game.id)||resultFor(game);
 volatileRecords.set(row.id,row);
 try{localStorage.setItem(recordPrefix+row.id,JSON.stringify(row));}catch{}
 saveSession();readRecords();updateNav();
}
function mistake(){
 stopTimers();game.hearts--;game.phase=game.hearts?'retry':'lost';
 if(game.puzzle.mode==='memory')game.puzzle.cursor=0;
 if(!game.hearts)finish();else saveSession();
 renderGame();
}
function nextRound(){
 if(!game||game.phase!=='between')return;
 game.round++;game.puzzle=roundFor(game);game.phase='ready';
 saveSession();renderGame();
}
function play(){
 if(!game||!['ready','retry','paused'].includes(game.phase))return;
 stopTimers();tap(0);
 if(game.puzzle.mode==='memory'){
  const p=game.puzzle;p.cursor=0;game.phase='show';saveSession();renderGame();
  let i=0;
  const next=()=>{
   if(route!=='tur'||game.phase!=='show')return;
   if(i>=p.sequence.length){recallStart=performance.now();game.phase='input';saveSession();renderGame();return;}
   const k=p.sequence[i++], el=screen.querySelector('[data-cell="'+k+'"]');
   if(!el)return;
   el.classList.add('lit');tone(k);
   const status=screen.querySelector('.live-status');
   status.textContent=i+' / '+p.sequence.length+' · '+shapes[k];
   timer=setTimeout(()=>{el.classList.remove('lit');timer=setTimeout(next,250);},Math.max(420,730-45*game.difficulty));
  };
  timer=setTimeout(next,430);
 }else{
  game.phase='running';saveSession();renderGame();
  if(game.puzzle.mode==='rhythm'){
   rhythmStart=performance.now();tick();beatClock=setInterval(tick,35);
  }
 }
}
function tick(){
 if(!game||game.phase!=='running'||game.puzzle.mode!=='rhythm')return;
 const p=game.puzzle;const beat=Math.floor((performance.now()-rhythmStart)/p.period);
 if(beat===lastBeat)return;
 lastBeat=beat;
 screen.querySelectorAll('.beat').forEach((el,i)=>el.classList.toggle('now',i===beat%8));
 const counter=document.getElementById('beat-counter');if(counter)counter.textContent=String(beat%8+1);
 if(prefs.audio&&beat%8===p.targets[p.hits])tone(2);
}
function rhythmTap(){
 if(game?.phase!=='running'||game.puzzle.mode!=='rhythm')return;
 tick();
 if(lastBeat===beatUsed)return;beatUsed=lastBeat;
 const p=game.puzzle;
 if(lastBeat%8!==p.targets[p.hits]){mistake();return;}
 const position=((performance.now()-rhythmStart)%p.period)/p.period;
 p.precision=(p.precision||0)+Math.round(24*(1-Math.abs(.5-position)*2));
 tap(3);p.hits++;
 if(p.hits===p.targets.length){scoreRound();return;}
 saveSession();
 screen.querySelectorAll('.beat').forEach((el,i)=>el.classList.toggle('target',i===p.targets[p.hits]));
 screen.querySelector('.live-status').textContent='Doğru · '+p.hits+' / '+p.targets.length+' • Sıradaki vuruş '+(p.targets[p.hits]+1);
}
function memoryTap(index){
 if(game?.phase!=='input'||game.puzzle.mode!=='memory')return;
 const p=game.puzzle;
 if(index!==p.sequence[p.cursor]){mistake();return;}
 tap(index);p.cursor++;
 if(p.cursor===p.sequence.length){scoreRound();return;}
 saveSession();screen.querySelector('.live-status').textContent='Doğru · '+p.cursor+' / '+p.sequence.length;
}
function wireCell(p,i,on){
 const m=p.tiles[i],dirs=['yukarı','sağa','aşağı','sola'];
 const lines=['M24 24V0','M24 24h24','M24 24v24','M24 24H0'];
 const side=i===p.start?'start':i===p.end?'end':'';
 const label=(side==='start'?'Giriş. ':side==='end'?'Çıkış. ':'')+(Math.floor(i/p.size)+1)+'. satır, '+(i%p.size+1)+'. sütun. '+bits.flatMap((b,j)=>m&b?[dirs[j]]:[]).join(' ve ')+'. Döndür';
 return '<button type="button" class="wire '+side+(on?' connected':'')+'" data-wire="'+i+'" aria-label="'+label+'"><svg viewBox="0 0 48 48" aria-hidden="true"><path d="'+bits.flatMap((b,j)=>m&b?[lines[j]]:[]).join(' ')+'"/><circle cx="24" cy="24" r="3.7"/></svg></button>';
}
function wireMarkup(board){const active=connected(board).seen;return board.tiles.map((_,i)=>wireCell(board,i,active.has(i))).join('');}
function turnTile(i){
 if(game?.phase!=='running'||game.puzzle.mode!=='circuit')return;
 const b=game.puzzle.board;if(i<0||i>=b.tiles.length)return;
 b.tiles[i]=rotate(b.tiles[i]);b.moves++;tap(i);
 if(connected(b).solved){scoreRound();return;}
 const focus=screen.querySelector('[data-wire="'+i+'"]')===document.activeElement;
 screen.querySelector('.wire-board').innerHTML=wireMarkup(b);
 if(focus)screen.querySelector('[data-wire="'+i+'"]').focus({preventScroll:true});
 screen.querySelector('.live-status').textContent=b.moves+' hamle';
 saveSession();
}
function puzzleControls(){
 const p=game.puzzle;
 if(p.mode==='memory'){
  return '<div class="memory-pad">'+shapes.map((s,i)=>'<button type="button" class="pad pad-'+i+'" data-cell="'+i+'" '+(game.phase!=='input'?'disabled':'')+' aria-label="'+s+'"><span>'+shapeSigns[i]+'</span><small>'+s+'</small></button>').join('')+'</div>'+
   '<p class="live-status" role="status">'+(game.phase==='input'?'Sıra sende · '+p.cursor+' / '+p.sequence.length:'Diziyi izle')+'</p>';
 }
 if(p.mode==='circuit'){
  return '<div class="port-legend"><span>→ Giriş</span><span>Çıkış →</span></div><div class="wire-board" style="--n:'+p.board.size+'">'+wireMarkup(p.board)+'</div><p class="live-status" role="status">'+p.board.moves+' hamle</p>';
 }
 return '<div class="rhythm-board"><div class="beat-counter" id="beat-counter" aria-hidden="true">1</div><div class="beat-row" aria-hidden="true">'+Array.from({length:8},(_,i)=>'<i class="beat '+(i===p.targets[p.hits]?'target':'')+'">'+(i+1)+'</i>').join('')+'</div>'+
   '<p class="live-status" role="status">İşaretli vuruş '+(p.targets[p.hits]+1)+' · '+p.hits+' / '+p.targets.length+' tamamlandı</p>'+
   action(icon('rhythm')+'Vuruş yap','beat','button beat-button')+'</div>';
}
function gameBody(){
 const p=game.puzzle,m=modes[p.mode];
 if(['won','lost','between'].includes(game.phase)){
  const won=game.phase==='won',between=game.phase==='between';
  let buttons='';
  if(between)buttons=action('Sonraki tur '+icon('arrow'),'next');
  else {
   if(won && game.kind==='campaign' && game.stage<17)buttons+=action('Sonraki bölüm '+icon('arrow'),'next-stage');
   else buttons+=action('Tekrar oyna','replay');
   buttons+='<a class="sub-button" href="#oyunlar">Oyun salonu</a>';
  }
  return '<div class="result"><span class="result-mark">'+icon(won?'trophy':between?'star':m.icon)+'</span><h2>'+(won?(game.kind==='daily'?'Parkur tamamlandı':game.kind==='campaign'?'Bölüm tamamlandı':'Oyun tamamlandı'):between?'Tur tamamlandı':'Oyun sona erdi')+'</h2><p>'+num(game.points)+' puan'+(won?' · +'+(50+game.hearts*15)+' XP':'')+'</p>'+(won?stars(game.hearts):'')+'<div class="actions">'+buttons+'</div></div>';
 }
 if(['ready','paused','retry'].includes(game.phase)){
  const label=game.phase==='paused'?'Oyun duraklatıldı':game.phase==='retry'?'Bir kez daha':m.name;
  return '<div class="brief"><div class="preview '+p.mode+'">'+modeArt(p.mode)+'</div><h2>'+label+'</h2><p>'+m.tip+'</p>'+
  (p.mode==='rhythm'?'<small>Sekiz vuruşluk döngüde işaretli sayıyı bekle.</small>':'')+
  action((game.phase==='paused'?'Devam et':p.mode==='memory'?'Diziyi göster':'Tura başla')+' '+icon('play'),'play')+'</div>';
 }
 return puzzleControls();
}
function renderGame(){
 const mode=game.puzzle.mode, title=game.kind==='daily'?'Günün parkuru':game.kind==='campaign'?chapterTitle(game.stage):'Serbest oyun';
 const active=['input','running','show'].includes(game.phase);
 screen.innerHTML='<div class="run '+mode+'"><div class="run-top"><a class="back" href="#oyunlar">'+icon('back')+'Salon</a><span>'+title+'</span>'+(active?action(icon('pause')+'Duraklat','pause','sub-button'):'')+'</div><section class="run-panel panel"><header><div class="run-mode"><small>Tur '+(game.round+1)+' / 3</small><h1>'+modes[mode].name+'</h1></div><div class="run-stats"><b>'+num(game.points)+' puan</b><span aria-label="'+game.hearts+' can">'+('♥'.repeat(game.hearts))+('♡'.repeat(3-game.hearts))+'</span></div></header><div class="round-line" aria-hidden="true">'+[0,1,2].map(i=>'<i class="'+(i<=game.round?'on':'')+'"></i>').join('')+'</div><div class="run-body">'+gameBody()+'</div></section></div>';
}
screen.addEventListener('click',e=>{
 const wire=e.target.closest('[data-wire]'),cell=e.target.closest('[data-cell]');
 if(wire){turnTile(Number(wire.dataset.wire));return;}if(cell){memoryTap(Number(cell.dataset.cell));return;}
 const b=e.target.closest('[data-action]');if(!b)return;
 const a=b.dataset.action;
 if(a==='daily')start('daily');
 else if(a==='free'&&order.includes(b.dataset.mode))start('free',b.dataset.mode);
 else if(a==='stage'){const i=Number(b.dataset.stage);if(i>=0&&i<18&&i<=unlocked())start('campaign',order[i%3],i);}
 else if(a==='resume')go('tur');
 else if(a==='play')play();
 else if(a==='beat')rhythmTap();
 else if(a==='pause'){pause();renderGame();}
 else if(a==='next')nextRound();
 else if(a==='replay'&&game)start(game.kind,game.mode,game.stage);
 else if(a==='next-stage'&&game&&game.stage<17)start('campaign',order[(game.stage+1)%3],game.stage+1);
});
screen.addEventListener('change',e=>{
 const el=e.target;
 if(el.id==='history-filter'){filter=el.value;render();document.getElementById('history-filter')?.focus();return;}
 if(route!=='ayarlar'||el.type!=='radio')return;
 prefs[el.name]=['audio','touch'].includes(el.name)?el.value==='true':el.value;
 try{localStorage.setItem(preferencesKey,JSON.stringify(prefs));}catch{}
 applyPrefs();if(el.name==='audio'&&prefs.audio)tone(2);if(el.name==='touch'&&prefs.touch)try{navigator.vibrate?.(15);}catch{}
});
window.addEventListener('keydown',e=>{
 if(route!=='tur'||!game||e.repeat||document.querySelector('dialog[open]'))return;
 if(e.key==='Escape'){if(['input','running','show'].includes(game.phase)){pause();renderGame();}else go('oyunlar');return;}
 if(game.phase==='input'&&game.puzzle.mode==='memory'&&/^[1-4]$/.test(e.key)){e.preventDefault();memoryTap(Number(e.key)-1);}
 if(game.phase==='running'&&game.puzzle.mode==='rhythm'&&e.code==='Space'&&!e.target.closest('button,a')){e.preventDefault();rhythmTap();}
});
window.addEventListener('hashchange',switchPage);
window.addEventListener('pagehide',pause);
window.addEventListener('pageshow',e=>{if(e.persisted)switchPage();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&route==='tur'){pause();renderGame();}});
window.addEventListener('storage',e=>{if(e.key?.startsWith(recordPrefix)&&route!=='tur')render();});
switchPage();
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
