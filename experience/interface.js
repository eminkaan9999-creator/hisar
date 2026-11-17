/* ÇELİK BÖRÜ — one quiet command centre and one set of touch controls.
 * Presentation and focus only. No progress writes, renderer loop or input rebinding. */
(function(root){'use strict';
const VERSION='1.0.0',doc=root.document;if(!doc||root.HisarInterface)return;
const safe=(fn,fallback)=>{try{return fn();}catch(e){return fallback;}},by=id=>doc.getElementById(id);
const paths={
 shield:'M12 3l8 3v6c0 4-4 7-8 9-4-2-8-5-8-9V6zM8 12l3 3 5-6',
 settings:'M9 3h6l1 4 4 1v6l-4 1-1 5H9l-1-5-4-1V8l4-1zM15 11.5a3 3 0 11-6 0 3 3 0 016 0',
 back:'M14 6l-6 6 6 6M8 12h13', close:'M6 6l12 12M18 6L6 18',
 menu:'M4 6h16M4 12h16M4 18h10', scope:'M12 3v4M12 17v4M3 12h4M17 12h4M18 12a6 6 0 11-12 0 6 6 0 0112 0',
 eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM15 12a3 3 0 11-6 0 3 3 0 016 0',
 swap:'M4 8h15l-4-4M20 16H5l4 4', radio:'M8 7h9v14H7V7zM10 7V2M10 11h4M10 15h4M10 18h4',
 pin:'M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1114 0M14 10a2 2 0 11-4 0 2 2 0 014 0',
 map:'M3 5l6-2 6 2 6-2v16l-6 2-6-2-6 2zM9 3v16M15 5v16',
 records:'M5 3h14v18H5zM9 8h6M9 12h6M9 16h3'
};
let installed=false,queued=false,briefState=false,resultState=false,profileState=false;
const hooks={},watched=new Set(),focusBefore=new Map();let menuWasInert=false,menuLocked=false;
function svg(name){const s=doc.createElementNS('http://www.w3.org/2000/svg','svg');s.setAttribute('viewBox','0 0 24 24');s.setAttribute('aria-hidden','true');s.setAttribute('focusable','false');const p=doc.createElementNS(s.namespaceURI,'path');p.setAttribute('d',paths[name]||paths.shield);s.appendChild(p);return s;}
function node(tag,id,text){const n=doc.createElement(tag);if(id)n.id=id;if(text!=null)n.textContent=text;return n;}
function iconButton(id,name,label,action){const b=node('button',id);b.type='button';b.setAttribute('aria-label',label);b.title=label;b.append(svg(name));b.addEventListener('click',action);return b;}
function visible(el){return !!(el&&!el.hidden&&el.getClientRects().length);}
function focus(el){if(el&&visible(el)&&!el.disabled)safe(()=>el.focus({preventScroll:true}),null);}
function wrap(name,f){if(hooks[name]||typeof root[name]!=='function')return;hooks[name]=true;root[name]=f(root[name]);}
function connect(){
 for(const name of ['openMenu','tab','ldRender','renderGar'])wrap(name,old=>function(){const r=old.apply(this,arguments);refresh();return r;});
 wrap('openProfile',old=>function(){const r=old.apply(this,arguments);watch('rep2');syncModals();return r;});
}
function tabSemantics(){const tabs=[...doc.querySelectorAll('#mpBody>.tabs [data-t]')];for(const b of tabs){b.id=b.id||'ci-tab-'+b.dataset.t;b.tabIndex=b.classList.contains('sel')?0:-1;const panel=by('t'+b.dataset.t);if(panel){panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',b.id);}}}
function titleAndRecords(){
 const state=safe(()=>({xp:SV.xp,credits:SV.kr}),null),profile=by('ci-profile');
 if(profile){profile.disabled=typeof root.openProfile!=='function';const value=by('ci-record-value');if(value){const text=state?Math.max(0,state.xp||0).toLocaleString('tr-TR')+' XP · '+Math.max(0,state.credits||0).toLocaleString('tr-TR')+' kredi':'Kayıtlar ve başarılar';if(value.textContent!==text)value.textContent=text;}}
 const go=by('go'),hk=safe(()=>root.HisarHarekat.diagnostics(),null),paused=safe(()=>game==='pause',false);
 doc.body.dataset.ciPaused=String(paused);
 if(go)go.textContent=paused?'Yeni görevi incele':hk&&hk.mode==='harekat'?'Görevi incele':'Savaşa başla';
 const resume=by('rs');if(resume)resume.textContent='Oyuna devam et';
}
function campaign(){const box=by('sf-campaign');if(!box)return;let title=by('ci-mission');if(!title){title=node('h3','ci-mission');const heading=box.querySelector('.sf-heading');if(heading)heading.insertAdjacentElement('afterend',title);}
 const selected=doc.querySelector('#hkCard [data-op].sel'),name=selected&&selected.querySelector('.hk-tx>b'),hk=safe(()=>root.HisarHarekat.diagnostics(),null);
 const current=safe(()=>root.HisarSafak.core.OPS.find(o=>o.id===hk.sel),null);
 const text=name?name.textContent:current?current.n:'Harekâtını seç';if(title&&title.textContent!==text)title.textContent=text;
 const read=box.querySelector('.sf-campaign-actions>button');if(read&&read.id!=='sf-archive')read.textContent='Görev emri';
 box.dataset.chapter=current?String(current.chapter):'archive';
 const small=box.querySelector('.sf-heading>small');if(small)small.textContent=current?'HİKÂYE MODU · BÖLÜM '+String(current.chapter).padStart(2,'0')+' / 04':'HAREKÂT ARŞİVİ';
 for(const card of box.parentElement.querySelectorAll('#hkCard [data-op]')){const selected=card.classList.contains('sel');card.setAttribute('aria-label',(card.querySelector('.hk-tx>b')?.textContent||'Harekât')+(selected?', seçili':''));}
}
function decorateButton(id,name,label){const b=by(id);if(!b)return;b.setAttribute('aria-label',label);b.title=label;if(b.dataset.ciIcon)return;const old=b.querySelector('svg');if(old)old.replaceWith(svg(name));b.dataset.ciIcon='1';}
function decorateControls(){
 for(const [id,name,label]of [['uMenu','menu','Karargâh menüsünü aç'],['uScope','scope','Nişangâhı aç veya kapat'],['uSw','swap','Mühimmatı değiştir'],['uEye','eye','Görüşü değiştir'],['uMapB','map','Haritayı aç'],['abR','radio','Takım telsizini aç'],['abN','pin','İkmal rotasını aç']])decorateButton(id,name,label);
 for(const [id,label]of [['uFire','Ateş et'],['abD','Uçangöze geç veya tanka dön'],['uSquad','Takım emirleri']]){const b=by(id);if(b)b.setAttribute('aria-label',label);}
 const pad=by('uPad');if(pad){pad.setAttribute('role','group');pad.setAttribute('aria-label','Tank sürüş kumandası');}
}
function header(){const brand=by('cm-brand'),tools=by('cm-tools');if(!brand||!tools)return;
 if(!by('ci-brand-mark')){const mark=node('span','ci-brand-mark');mark.append(svg('shield'));brand.prepend(mark);}
 if(!by('ci-profile')){const b=iconButton('ci-profile','records','Kayıtlar ve başarılar',()=>safe(()=>root.openProfile(),null));b.append(node('span','ci-record-value','Kayıtlar ve başarılar'));tools.prepend(b);}
 const settings=by('hisar-experience-entry');if(settings&&!settings.querySelector('svg')){settings.textContent='';settings.append(svg('settings'),node('span',null,'Ayarlar'));}
 const updater=by('updB');if(updater)updater.setAttribute('aria-label','Oyunu güncelle');
 const back=by('cm-return');if(back&&!back.querySelector('svg')){back.textContent='';back.append(svg('close'),node('span',null,'Kapat'));back.setAttribute('aria-label','Karargâhı kapat ve oyuna dön');}
 const mt=by('mt');if(mt)mt.textContent='Görevini seç, birliğini hazırla.';
}
function prepareModal(id,el){
 el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');
 if(id==='hk-brief'){
  el.setAttribute('aria-label','Harekât emri');const head=el.querySelector('header');
  if(head&&!by('ci-brief-close'))head.append(iconButton('ci-brief-close','close','Görev emrini kapat',()=>el.querySelector('.hk-back')?.click()));
 }else if(id==='rep2'){
  el.setAttribute('aria-label','Kayıtlar ve başarılar');const box=el.querySelector('.bkb');
  if(box&&!box.querySelector('.ci-backup-close')){const close=iconButton('', 'close','Yedek kodu alanını kapat',()=>{box.hidden=true;focus(el.querySelector('[data-bk="open"]'));});close.className='ci-backup-close';box.prepend(close);}
 }else{
  el.setAttribute('aria-label','Görev sonucu');const panel=el.querySelector('.c');
  if(panel&&!by('ci-result-close'))panel.prepend(iconButton('ci-result-close','close','Sonuç ekranını kapat',()=>{const b=el.querySelector('[data-r="menu"]');if(b)b.click();else el.classList.remove('on');}));
 }
}
function blocking(){if(by('hisar-experience')?.open)return null;if(briefState)return by('hk-brief');if(resultState)return by('rep');if(profileState)return by('rep2');return null;}
function syncModals(){
 const next={ 'hk-brief':!!(by('hk-brief')&&!by('hk-brief').hidden),'rep':!!by('rep')?.classList.contains('on'),'rep2':by('rep2')?.style.display==='flex'};
 const old={'hk-brief':briefState,rep:resultState,rep2:profileState};let opened=null,closed=null;
 for(const id of Object.keys(next)){const el=by(id);if(!el)continue;if(next[id])prepareModal(id,el);if(next[id]&&!old[id]){focusBefore.set(id,doc.activeElement);opened=el;}if(!next[id]&&old[id])closed=focusBefore.get(id);}
 briefState=next['hk-brief'];resultState=next.rep;profileState=next.rep2;
 const menu=by('menu'),locked=briefState||resultState||profileState;
 if(menu&&locked&&!menuLocked){menuWasInert=menu.inert;menu.inert=true;menuLocked=true;}
 if(menu&&!locked&&menuLocked){menu.inert=menuWasInert;menuLocked=false;}
 if(opened&&!by('hisar-experience')?.open)focus(opened.querySelector('#ci-brief-close,#ci-result-close,[data-x],button'));
 else if(closed&&!locked&&!by('hisar-experience')?.open&&safe(()=>game!=='play',true))focus(visible(closed)?closed:doc.querySelector('#mp .tabs [aria-selected="true"]'));
}
function watch(id){const el=by(id);if(!el||watched.has(id)||!root.MutationObserver)return;watched.add(id);new root.MutationObserver(syncModals).observe(el,{attributes:true,attributeFilter:['hidden','style','class'],childList:true});}
function schedule(){if(queued)return;queued=true;root.queueMicrotask(()=>{queued=false;refresh();});}
function refresh(){if(!installed)return;connect();header();tabSemantics();titleAndRecords();campaign();decorateControls();for(const id of ['hk-brief','rep','rep2'])watch(id);syncModals();}
function keydown(e){
 const tab=e.target?.closest?.('#mpBody>.tabs [role="tab"]');
 if(tab&&['ArrowRight','ArrowLeft','ArrowDown','ArrowUp','Home','End'].includes(e.key)){
  const tabs=[...tab.parentElement.querySelectorAll('[role="tab"]')],i=tabs.indexOf(tab),n=e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(['ArrowRight','ArrowDown'].includes(e.key)?1:-1)+tabs.length)%tabs.length;
  e.preventDefault();e.stopImmediatePropagation();tabs[n].click();focus(tabs[n]);return;
 }
 const modal=blocking();if(!modal||e.key!=='Tab')return;
 const list=[...modal.querySelectorAll('button:not([disabled]),select:not([disabled]),input:not([disabled]),textarea:not([disabled]),a[href],[tabindex="0"]')].filter(visible);if(!list.length)return;
 const first=list[0],last=list[list.length-1],active=doc.activeElement;
 if(e.shiftKey&&(active===first||!modal.contains(active))){e.preventDefault();focus(last);}else if(!e.shiftKey&&(active===last||!modal.contains(active))){e.preventDefault();focus(first);}
}
function install(){if(!doc.body||!by('cm-header'))return false;if(!installed){installed=true;doc.body.classList.add('ci-modern');
 doc.addEventListener('keydown',keydown,true);doc.addEventListener('click',e=>{if(e.target?.closest?.('#hkCard,#hkMode,#sf-archive,[data-bk],#sf-next'))schedule();});
 doc.addEventListener('hisar:checkpoint',schedule);
 const cards=by('hkCard');if(cards&&root.MutationObserver)new root.MutationObserver(schedule).observe(cards,{childList:true});
 if(root.MutationObserver){const observer=new root.MutationObserver(()=>{watch('hk-brief');syncModals();if(watched.has('hk-brief'))observer.disconnect();});observer.observe(doc.body,{childList:true});}
 }refresh();return true;}
root.HisarInterface=Object.freeze({version:VERSION,install,refresh,diagnostics:()=>({installed,hooks:{...hooks},modals:{brief:briefState,result:resultState,profile:profileState}})});
if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',install);else install();doc.addEventListener('hisar:ui-ready',install);
})(typeof window!=='undefined'?window:globalThis);
