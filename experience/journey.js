/* Çelik Börü — Yol Defteri. Images, chapter browsing and personal results are local. */
(function (root) {
  'use strict';
  const TITLES = ['Batı yolu', 'Taş geçit', 'Kayıp konvoy', 'Onarım molası', 'Dönüş yolu', 'Karakol'];
  const CAPTIONS = [
    'Sabahın ilk ışığı batı yoluna düşüyor. Yolculuk karakol kapısında başlıyor.',
    'Dar yol nehir yatağına iniyor. Geçidin ötesinde konvoydan hâlâ haber yok.',
    'Yol kenarında hareketsiz bir kamyon görünüyor. Kayıp ekip burada.',
    'Kaput açık. Ekibin işi bitene kadar yolculuğa aynı noktada ara veriliyor.',
    'Bu kez dikiz aynasında konvoy var. İki araç aynı yoldan eve dönüyor.',
    'Karakol ışıkları göründü. Yolculuk, konvoy da kapıdan geçtiğinde tamamlanıyor.'
  ];
  const DIFFICULTY = {kolay:'Kolay', normal:'Normal', zor:'Zor', serbest:'Serbest'};
  const PREFIX = 'celik-boru-sefer-v1:';
  const fold = text => String(text || '').toLocaleLowerCase('tr').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i').trim();
  const time = value => {
    const seconds = Math.max(0, Math.round(value) || 0);
    return Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
  };
  function recent(rows) {
    return rows.filter(r => r && typeof r.id === 'string' && typeof r.mission === 'string' && typeof r.name === 'string' && typeof r.won === 'boolean' &&
      Object.hasOwn(DIFFICULTY, r.difficulty) && Number.isFinite(r.at) && Number.isFinite(r.elapsed) && r.elapsed >= 0)
      .sort((a,b) => b.at - a.at || b.id.localeCompare(a.id)).slice(0, 8);
  }
  function previousBest(rows, run) {
    const times = recent(rows).filter(r => r.won && r.id !== run.id && r.mission === run.mission && r.difficulty === run.difficulty).map(r => r.elapsed);
    return times.length ? Math.min(...times) : null;
  }
  const core = {fold, time, recent, previousBest};
  if (typeof module === 'object' && module.exports) module.exports = core;
  const doc = root.document;
  if (!doc) return;
  const by = id => doc.getElementById(id);
  const make = (tag, name, text) => {
    const el = doc.createElement(tag);
    if (name) el.className = name;
    if (text != null) el.textContent = text;
    return el;
  };
  const put = (el, text) => { if (el.textContent !== text) el.textContent = text; };
  let memory = [], preview = null, routeContext = '', preferences = {};
  try {
    const saved=JSON.parse(root.localStorage.getItem('celik-boru-okuma-v1'));
    if(saved && typeof saved==='object')preferences={read:saved.read===true,still:saved.still===true};
  } catch {}
  function ledger() {
    const rows = new Map(memory.map(r => [r.id, r]));
    try {
      for (let i = 0; i < root.localStorage.length; i++) {
        const key = root.localStorage.key(i);
        if (!key?.startsWith(PREFIX)) continue;
        try { const r = JSON.parse(root.localStorage.getItem(key)); if (r && key === PREFIX + r.id) rows.set(r.id, r); } catch {}
      }
    } catch {}
    return recent([...rows.values()]);
  }
  function postcard(canvas, stage) {
    if (canvas.dataset.stage === String(stage)) return;
    canvas.dataset.stage = stage;
    const g = canvas.getContext('2d');
    if (!g) return;
    const palettes = [
      ['#24455c','#f7cb93','#fce7b4','#7d8b84','#4d6866','#243f44'],
      ['#314554','#d8c6a5','#fff0bf','#888982','#526866','#354d51'],
      ['#52869a','#e8d9a3','#fff7c7','#95a394','#66847d','#354f50'],
      ['#689298','#f4d4a0','#fff0b2','#a6aa91','#788670','#414e43'],
      ['#4a576e','#e6a682','#ffdc9e','#9d8786','#746971','#484a59'],
      ['#192944','#ad8895','#ffdcaa','#626b7c','#464e64','#28364a']
    ];
    const c = palettes[stage], w = canvas.width, h = canvas.height;
    g.save(); g.scale(w / 600, h / 180);
    const sky = g.createLinearGradient(0,0,0,138);
    sky.addColorStop(0,c[0]); sky.addColorStop(1,c[1]); g.fillStyle=sky; g.fillRect(0,0,600,180);
    g.fillStyle=c[2]; g.beginPath(); g.arc(480-stage*49,48+Math.abs(2-stage)*5,13,0,Math.PI*2);g.fill();
    function shape(color, pts) {
      g.fillStyle=color; g.beginPath(); pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fill();
    }
    function ridge(base, amp, offset, color) {
      const pts=[[0,180]];
      for(let x=0;x<=600;x+=12) pts.push([x,base+amp*(Math.sin(x/72+offset)*.46+Math.sin(x/39+offset)*.34+Math.cos(x/16+offset)*.2)]);
      pts.push([600,180]);shape(color,pts);
    }
    ridge(91,26,stage*.36,c[3]);ridge(108,18,stage*.5+1,c[4]);ridge(129,15,stage*.65+4,c[5]);
    shape(c[3],[[0,140],[240,122],[309,113],[321,113],[276,126],[167,145],[118,180],[0,180]]);
    shape(c[1],[[31,180],[167,146],[260,131],[303,118],[267,131],[178,147],[66,180]]);
    g.fillStyle=c[5];
    if(stage===1){g.fillRect(202,114,132,4);for(let x=205;x<334;x+=22){g.fillRect(x,116,3,11);g.fillRect(x,110,2,5);}g.fillRect(202,110,132,1);}
    if(stage>=2 && stage<=4){
      const x=stage===4?182:258,y=stage===4?129:116;
      g.fillRect(x,y,24,10);shape(c[5],[[x+25,y+3],[x+33,y+3],[x+38,y+9],[x+38,y+12],[x+25,y+12]]);
      g.fillStyle=c[2];g.fillRect(x+28,y+5,5,3);g.fillStyle=c[5];
      for(const a of [6,30]){g.beginPath();g.arc(x+a,y+12,3,0,Math.PI*2);g.fill();}
      if(stage===3){g.fillRect(x+38,y+4,2,8);g.fillRect(x+38,y+3,9,2);}
    }
    if(stage===0||stage===5){
      const x=stage===5?227:388;g.fillRect(x,98,52,21);shape(c[5],[[x-4,99],[x+24,87],[x+57,99]]);
      g.fillRect(x+60,78,11,41);g.fillRect(x+57,77,17,4);g.fillStyle=c[2];g.fillRect(x+62,81,7,4);
      for(let i=0;i<4;i++)g.fillRect(x+5+i*12,104,5,5);
    }
    g.restore();
  }
  function route(plan, op, hk, cp, active) {
    if (!plan || !op) return;
    const actual = Math.min(5, Math.max(0, active ? hk.ph : cp ? cp.phase : 0));
    const context = [active, actual, cp?.sessionStartedAt, Boolean(hk.done[op.id])].join('/');
    if (context !== routeContext) { routeContext=context; preview=null; }
    const selected = preview ?? actual;
    let card = by('journey-postcard');
    if (!card) {
      card=make('figure','journey-postcard'); card.id='journey-postcard';
      const art=make('canvas'); art.width=600; art.height=180; art.setAttribute('aria-hidden','true');
      const caption=make('figcaption'); caption.append(make('strong'),make('span'));
      card.append(art,caption); plan.before(card);
    }
    postcard(card.firstElementChild,selected);
    put(card.querySelector('strong'),TITLES[selected]);
    put(card.querySelector('span'),CAPTIONS[selected]);
    for (const [i,li] of [...plan.children].entries()) {
      let b=li.firstElementChild;
      if (!b) {
        b=make('button','journey-stop'); b.type='button';
        b.append(make('small',null,String(i+1).padStart(2,'0')),make('span',null,TITLES[i]));
        b.title=op.phases[i].n;
        b.onclick=()=>{preview=i; root.HisarCampaign.render();};
        li.replaceChildren(b);
      }
      b.setAttribute('aria-label',(i+1)+'. '+op.phases[i].n);
      b.setAttribute('aria-pressed',String(i===selected));
      if ((active||cp) && i===actual) b.setAttribute('aria-current','step'); else b.removeAttribute('aria-current');
      li.classList.toggle('done',(active||!!cp) && i<actual);
    }
    if (cp && !active) {
      const note=by('sf-checkpoint-note');
      if(note && !note.hidden) put(note,'Son kayıt · '+new Date(cp.updatedAt).toLocaleString('tr-TR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})+
        ' · '+time(cp.elapsed)+' · Tank %'+Math.round(cp.player.hp/cp.player.mx*100)+' · Konvoy %'+Math.round(cp.convoy.hp/op.escort.hp*100));
    }
  }
  function end(run) {
    const before=ledger();
    if (before.some(r=>r.id===run.id)) return;
    const best=previousBest(before,run);
    const keep=recent([run,...before]);
    if (!keep.some(r=>r.id===run.id)) return;
    memory=keep;
    let saved=true;
    try {
      root.localStorage.setItem(PREFIX+run.id,JSON.stringify(run));
      for(const old of before) if(!keep.some(r=>r.id===old.id)) root.localStorage.removeItem(PREFIX+old.id);
    } catch { saved=false; }
    const panel=by('rep')?.querySelector('.c');
    if (!panel) return;
    const section=make('section','journey-recap');section.id='journey-recap';
    if(run.mission==='eve-donus'){
      const canvas=make('canvas');canvas.width=600;canvas.height=180;canvas.setAttribute('aria-hidden','true');
      postcard(canvas,Math.min(5,run.step));section.append(canvas);
    }
    section.append(make('strong',null,run.name),make('p',null,run.mission==='son-takim'?run.last:run.won?'Yolculuk tamamlandı.':'Ulaşılan aşama · '+run.last));
    const parts=[DIFFICULTY[run.difficulty],time(run.elapsed)];
    if(run.convoy!=null)parts.push('Konvoy %'+run.convoy);
    section.append(make('small',null,parts.join(' · ')));
    if(run.mission!=='son-takim' && run.won && best!=null){
      const diff=Math.round(run.elapsed)-Math.round(best);
      section.append(make('p',null,diff<0?'Önceki en iyi süreden '+time(-diff)+' daha hızlı.':diff===0?'Önceki en iyi süreyle eşit.':'Önceki en iyi süre '+time(best)+'.'));
    }
    if(!saved)section.append(make('small',null,'Sefer bu oturumda görünüyor. Cihaza yazılamadı.'));
    const buttons=panel.querySelector('.bt');panel.insertBefore(section,buttons);
    const cp=run.mission==='eve-donus'?root.HisarCampaign:run.mission==='safak-1'?root.HisarCheckpoint:null;
    const snapshot=!run.won && cp?.read();
    if(snapshot && snapshot.sessionStartedAt===run.session && buttons){
      const resume=make('button','a','Kayıttan devam et');resume.type='button';resume.id='journey-retry';
      resume.onclick=()=>{
        const ok=run.mission==='eve-donus'?root.HisarHarekat.resumeCampaignCheckpoint():root.HisarHarekat.resumeCheckpoint();
        if(ok)by('rep').classList.remove('on');else put(resume,'Kayıt açılamadı');
      };
      buttons.prepend(resume);
    }
  }
  function profile(panel) {
    if (!panel) return;
    const rows=ledger(), section=make('details','journey-history');
    section.id='journey-history';section.append(make('summary',null,'Sefer defteri · '+rows.length+'/8'));
    if(!rows.length)section.append(make('p',null,'Tamamladığın veya yarıda biten harekâtlar burada görünür.'));
    for(const row of rows){
      const line=make('div','journey-entry');
      const date=new Date(row.at).toLocaleDateString('tr-TR',{day:'numeric',month:'short'});
      line.append(make('strong',null,row.name),make('span',null,(row.mission==='son-takim'?row.last:row.won?'Tamamlandı':row.last)+' · '+DIFFICULTY[row.difficulty]),make('small',null,date+' · '+time(row.elapsed)));
      section.append(line);
    }
    panel.querySelector('.ps')?.after(section);
  }
  function searchBox(id, label) {
    const bar=make('div','journey-tools');bar.id=id;
    const input=make('input');input.type='search';input.setAttribute('aria-label',label);input.placeholder=label;input.autocomplete='off';
    const status=make('small','journey-count');status.setAttribute('role','status');bar.append(input,status);
    return {bar,input,status};
  }
  function archive(cards,hk) {
    let bar=by('journey-archive');
    if(hk.sel==='eve-donus'||hk.mode!=='harekat'){ if(bar)bar.remove(); return; }
    if(!bar){
      const ui=searchBox('journey-archive','Görev adı veya türü ara');
      bar=ui.bar;
      const select=make('select');select.setAttribute('aria-label','Görev durumu');
      for(const [k,t] of [['all','Tümü'],['new','Tamamlanmamış'],['done','Tamamlanmış']]){const o=make('option',null,t);o.value=k;select.append(o);}
      ui.status.before(select);cards.before(bar);
      bar.addEventListener('input',()=>archive(cards,root.HisarHarekat.diagnostics()));
      select.addEventListener('change',()=>archive(cards,root.HisarHarekat.diagnostics()));
    }
    const term=fold(bar.querySelector('input').value), filter=bar.querySelector('select').value;
    let count=0;
    for(const b of cards.querySelectorAll('[data-op]')){
      const name=b.querySelector('.hk-tx>b')?.textContent, kind=b.querySelector('.hk-tur')?.textContent;
      const found=fold(name+' '+kind).includes(term), done=!!hk.done[b.dataset.op];
      b.hidden=!(found && (filter==='all'||(filter==='done')===done));if(!b.hidden)count++;
    }
    put(bar.querySelector('small'),count?count+' görev':'Eşleşen görev yok');
  }
  function controls() {
    const pane=by('tk');if(!pane || by('journey-controls') || !pane.querySelector('.kseg'))return;
    const {bar,input,status}=searchBox('journey-controls','Kontrol veya tuş ara');
    pane.querySelector('.kseg').after(bar);
    const filter=()=>{
      let count=0;
      for(const list of pane.querySelectorAll('.klist'))for(const row of list.children){
        row.hidden=!fold(row.textContent).includes(fold(input.value));
        if(!row.hidden && list.dataset.k===pane.dataset.k)count++;
      }
      put(status,count?count+' kontrol':'Eşleşen kontrol yok');
      for(const b of pane.querySelectorAll('.kseg button'))b.setAttribute('aria-pressed',String(b.dataset.k===pane.dataset.k));
    };
    input.addEventListener('input',filter);pane.querySelector('.kseg').addEventListener('click',filter);filter();
  }
  function garage(panel,credits) {
    if(!panel)return;
    let bar=by('journey-garage');
    if(!bar){
      bar=make('div','journey-tools');bar.id='journey-garage';
      const label=make('label'),input=make('input');input.type='checkbox';label.append(input,doc.createTextNode(' Alabileceklerim'));
      bar.append(label,make('small','journey-count')); panel.before(bar);
      input.onchange=()=>root.renderGar();
    }
    const filter=bar.querySelector('input').checked;let count=0;
    for(const row of panel.querySelectorAll('.uc')){
      const b=row.querySelector('[data-u]'), cost=Number(row.dataset.cost);
      const max=row.classList.contains('mx'), affordable=!max && cost<=credits;
      if(affordable)count++;
      row.hidden=filter&&!affordable;
      if(!max && !affordable){
        b.disabled=true;
        const missing=make('small','journey-short',Math.ceil(cost-credits)+' kredi eksik');row.querySelector('.ut').append(missing);
      }
      b.setAttribute('aria-label',row.querySelector('.ut>b').textContent+' · '+b.textContent);
    }
    put(bar.querySelector('small'),credits+' kredi · '+(count?count+' seçenek alınabilir':'Bu grupta alınabilir parça yok'));
  }
  function preferencesUI(){
    const panel=by('hs-simple');
    let access=by('journey-access');
    if(panel&&!access){access=make('details');access.id='journey-access';access.append(make('summary',null,'Okuma ve hareket'));panel.querySelector('#hs-note')?.after(access);}
    for (const [key,label] of [['read','Büyük menü yazıları'],['still','Menü hareketlerini azalt']]){
      doc.body.classList.toggle('journey-'+key,preferences[key]===true);
      if (!panel || by('journey-'+key)) continue;
      const row=make('label'), input=make('input');input.id='journey-'+key;input.type='checkbox';input.checked=preferences[key]===true;
      row.append(make('span',null,label),input);access.append(row);
      input.onchange=()=>{preferences[key]=input.checked;doc.body.classList.toggle('journey-'+key,input.checked);
        try{root.localStorage.setItem('celik-boru-okuma-v1',JSON.stringify(preferences));}catch{}};
    }
  }
  function pause(){
    const header=by('cm-header');if(!header)return;
    let panel=by('journey-pause');
    if(typeof game==='undefined'||game!=='pause'){
      if(panel)panel.remove();return;
    }
    const hk=root.HisarHarekat.diagnostics();
    if(!hk.active || !hk.phase){if(panel)panel.remove();return;}
    if(!panel){panel=make('details','journey-pause');panel.id='journey-pause';header.after(panel);}
    panel.replaceChildren(make('summary',null,'Sefer özeti · '+hk.phase.n),make('p',null,'Oyun süresi '+time(hk.t)+(hk.convoy?' · Konvoy %'+Math.round(hk.convoy.hp/hk.convoy.mx*100):'')));
    const feed=root.HisarOperations?.diagnostics().feed || [];
    if(feed.length){const q=feed[feed.length-1];panel.append(make('p',null,'Son telsiz · '+q.who+' '+q.text));}
    if(hk.phase.why)panel.append(make('p',null,hk.phase.why));
  }
  function loadout() {
    const pane=by('tb'),list=by('ld');
    if(!pane||!list||by('journey-undo'))return;
    const button=make('button','journey-undo','Son düzenlemeyi geri al');
    button.id='journey-undo';button.type='button';button.hidden=true;list.after(button);
    let last=null;
    pane.addEventListener('click',event=>{
      if(!event.target.closest('[data-ld],[data-f],[data-pre]')||typeof SV==='undefined')return;
      const before={form:SV.form,load:SV.load.slice()};
      root.queueMicrotask(()=>{
        if(before.form===SV.form && before.load.every((x,i)=>SV.load[i]===x))return;
        last=before;button.hidden=false;
      });
    },true);
    button.onclick=()=>{
      if(!last)return;
      SV.form=last.form;SV.load=last.load.slice();last=null;button.hidden=true;
      root.save();root.ldRender();
    };
  }
  function install() {
    loadout();controls();preferencesUI();
    const gar=by('upl');if(gar && !by('journey-garage') && typeof root.renderGar==='function')root.renderGar();
    root.HisarCampaign?.render();
  }
  root.HisarJourney={version:'1.0.0',route,archive,garage,profile,end,pause,install};
  doc.addEventListener('DOMContentLoaded',install);doc.addEventListener('hisar:ui-ready',install);
  if(doc.readyState!=='loading')install();
})(typeof window !== 'undefined' ? window : globalThis);
