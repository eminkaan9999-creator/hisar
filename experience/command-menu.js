/* ÇELİK BÖRÜ — karargâh menüsü. Existing controls and saves stay connected. */
(function(root){'use strict';
const doc=root.document;if(!doc)return;
const safe=(f,d)=>{try{return f();}catch(e){return d;}},by=id=>doc.getElementById(id);
const hooks={};let pausedMode=null,installed=false;
function release(){safe(()=>root.HisarInputGuard.release(),null);safe(()=>root.dispatchEvent(new root.Event('hisar:release-inputs')),null);}
function closeLayers(){
 safe(()=>root.HisarOperations.close(),null);
 if(root.mapOpen)safe(()=>root.toggleMap(),null);
 if(root.WHEEL&&root.WHEEL.open)safe(()=>root.WHEEL.hide(false),null);
 safe(()=>root.HisarExperience.close(),null);
 const brief=by('hk-brief');if(brief)brief.hidden=true;
 const profile=by('rep2');if(profile)profile.style.display='none';
 release();
}
function refresh(){
 if(!doc.body)return;
 const menu=by('menu'),paused=safe(()=>game==='pause',false),shown=!!(menu&&menu.style.display!=='none');
 doc.body.dataset.cmMenu=String(shown);
 const back=by('cm-return');if(back)back.hidden=!paused;
 const context=by('cm-context');if(context)context.textContent=paused?'OYUN DURAKLATILDI':'KARARGÂH';
 const tabs=doc.querySelectorAll('#mpBody>.tabs [data-t]');
 for(const b of tabs)b.setAttribute('aria-selected',String(b.classList.contains('sel')));
}
function wrap(name,f){if(hooks[name]||typeof root[name]!=='function')return;root[name]=f(root[name]);hooks[name]=true;}
function connect(){
 wrap('openMenu',old=>function(){
  if(pausedMode==null&&safe(()=>game==='play'||game==='pause',false))pausedMode=safe(()=>mis,null);
  closeLayers();const r=old.apply(this,arguments);refresh();root.HisarJourney?.pause();return r;
 });
 wrap('closeMenu',old=>function(){
  const resume=safe(()=>game==='pause',false);closeLayers();
  if(resume&&safe(()=>game!=='over',false)){
   if(pausedMode!=null)safe(()=>root.setG(pausedMode),null);
   // Closing a child dialog may resume the engine first; the parent still owns its menu.
   safe(()=>{game='pause';},null);
  }
  const r=old.apply(this,arguments);if(resume)pausedMode=null;refresh();root.HisarJourney?.pause();return r;
 });
 wrap('reset',old=>function(){closeLayers();pausedMode=null;const r=old.apply(this,arguments);refresh();root.HisarJourney?.pause();return r;});
 wrap('tab',old=>function(t){const r=old.apply(this,arguments);const pane=by('t'+t);if(pane)pane.scrollTop=0;refresh();return r;});
}
function escape(e){
 if(e.key!=='Escape'||e.repeat)return;
 const brief=by('hk-brief'),radio=by('hr-panel'),settings=by('hisar-experience'),profile=by('rep2'),result=by('rep');
 if(settings&&settings.open)safe(()=>root.HisarExperience.close(),null);
 else if(brief&&!brief.hidden){const back=safe(()=>brief.querySelector('.hk-back'),null);if(back)back.click();else brief.hidden=true;}
 else if(result&&result.classList.contains('on')){const back=safe(()=>result.querySelector('[data-r="menu"]'),null);if(back)back.click();else result.classList.remove('on');}
 else if(profile&&profile.style.display==='flex'){const back=safe(()=>profile.querySelector('[data-x]'),null);if(back)back.click();else profile.style.display='none';}
 else if(radio&&!radio.hidden)safe(()=>root.HisarOperations.close(),null);
 else if(root.WHEEL&&root.WHEEL.open)safe(()=>root.WHEEL.hide(false),null);
 else if(root.mapOpen)safe(()=>root.toggleMap(),null);
 else return;
 e.preventDefault();e.stopImmediatePropagation();release();
}
const paths={g:'M4 5h16v14H4zM8 5v14M8 10h12',b:'M5 19v-4M12 19v-7M19 19v-4M3 19h18M8 6a4 4 0 108 0 4 4 0 00-8 0',u:'M3 14l2-5h14l2 5v5H3zM7 9V6h8v3M7 16h10',k:'M8 8h8l4 3 1 7-3 1-3-4H9l-3 4-3-1 1-7zM7 10v4M5 12h4M16 11h.01M18 13h.01'};
function icon(path){const svg=doc.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');const p=doc.createElementNS('http://www.w3.org/2000/svg','path');p.setAttribute('d',path);svg.appendChild(p);return svg;}
function button(id,text,action){const b=doc.createElement('button');b.id=id;b.type='button';b.textContent=text;b.onclick=action;return b;}
function objective(){const card=by('hk-obj');if(!card||by('cm-objective-toggle'))return;
 const b=button('cm-objective-toggle','Küçült',()=>{const on=card.classList.toggle('cm-compact');b.textContent=on?'Genişlet':'Küçült';b.setAttribute('aria-expanded',String(!on));});
 b.setAttribute('aria-label','Görev bilgisini küçült veya genişlet');b.setAttribute('aria-expanded','true');card.appendChild(b);
}
function boot(){const go=by('go'),notice=by('cm-boot');if(!go||!notice)return;
 const graphics=safe(()=>!!R.getContext()&&!R.getContext().isContextLost(),false),ready=graphics&&safe(()=>root.HisarGameBridge.snapshot().ready,false);
 if(ready){go.disabled=false;notice.hidden=true;return true;}
 if(!graphics){go.disabled=true;notice.hidden=false;const text=notice.querySelector('span');if(text)text.textContent='Grafikler başlatılamadı. Oyunu yeniden açmayı dene.';const sp=by('spl');if(sp)sp.hidden=true;}
 return false;
}
function install(){
 if(!doc.body)return;connect();objective();if(installed){refresh();return;}
 const mp=by('mp');if(!mp)return;installed=true;doc.body.classList.add('command-ui');
 let body=by('mpBody');if(!body){body=doc.createElement('div');body.id='mpBody';for(const n of [...mp.children])if(!n.classList.contains('acts'))body.appendChild(n);mp.prepend(body);}
 const head=doc.createElement('header');head.id='cm-header';const brand=doc.createElement('div');brand.id='cm-brand';
 const context=doc.createElement('small');context.id='cm-context';context.textContent='KARARGÂH';brand.appendChild(context);
 const oldHead=mp.querySelector('.hd');if(oldHead)brand.appendChild(oldHead);head.appendChild(brand);
 const tools=doc.createElement('div');tools.id='cm-tools';
 const settings=by('hisar-experience-entry');if(settings){settings.textContent='Ayarlar';settings.setAttribute('aria-label','Ayarlar');tools.appendChild(settings);}
 const updater=by('updBox');if(updater)tools.appendChild(updater);
 tools.appendChild(button('cm-return','Oyuna dön',()=>safe(()=>root.closeMenu(),null)));head.appendChild(tools);body.prepend(head);
 const nav=body.querySelector('.tabs');if(nav){nav.setAttribute('role','tablist');nav.setAttribute('aria-label','Oyun menüsü');
  const names={g:'Harekât',b:'Birlik',u:'Garaj',k:'Kontroller'};
  for(const b of nav.querySelectorAll('[data-t]')){const key=b.dataset.t;if(!names[key])continue;
   b.textContent='';b.appendChild(icon(paths[key]));const label=doc.createElement('span');label.textContent=names[key];b.appendChild(label);
   b.setAttribute('role','tab');b.setAttribute('aria-controls','t'+key);
   b.onclick=()=>{release();if(typeof root.tab==='function')root.tab(key);else{for(const p of body.querySelectorAll('section'))p.classList.toggle('on',p.id==='t'+key);for(const n of nav.querySelectorAll('[data-t]'))n.classList.toggle('sel',n===b);refresh();}};
  }
 }
 const mt=by('mt');if(mt&&/^M60A3 tankınla/.test(mt.textContent))mt.textContent='Görevini seç. Birliğini hazırla. Harekâta çık.';
 const actions=mp.querySelector('.acts');if(actions){const notice=doc.createElement('div');notice.id='cm-boot';notice.hidden=true;notice.setAttribute('role','status');notice.appendChild(doc.createElement('span'));notice.appendChild(button('cm-retry','Yeniden dene',()=>root.location.reload()));actions.prepend(notice);}
 if(root.MutationObserver){const observer=new root.MutationObserver(refresh);observer.observe(by('menu'),{attributes:true,attributeFilter:['style']});}
 refresh();boot();let attempts=0;const timer=root.setInterval(()=>{if(boot()||++attempts>=24)root.clearInterval(timer);},250);
}
root.HisarCommandMenu=Object.freeze({version:'1.1.0',staticBackground:true,connect,install,closeLayers,refresh,escape,diagnostics:()=>({installed,hooks:{...hooks}})});
root.addEventListener('keydown',escape,true);doc.addEventListener('hisar:ui-ready',install);
if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',install);else install();
connect();
})(typeof window!=='undefined'?window:globalThis);
