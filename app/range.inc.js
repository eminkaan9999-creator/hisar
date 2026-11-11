// Open only after approaching the physical range entrance in the base.
(function(){const H=window.parent?.KomutaHost;if(!H||window.parent===window)return;let paused=false,disposed=false,before=true;
document.documentElement.classList.add('komuta-scene');OPT.voice=0;OPT.diff='kolay';OPT.motion=0;OPT.d3=false;document.getElementById('splash')?.remove();document.getElementById('menu').hidden=true;
const panel=document.createElement('section');panel.id='km-equipment';panel.innerHTML='<h2>Poligon · ekipmanını seç</h2><p>Atış alanına geldin. Ekipmanı ve oyun hedefini seç; süre baskısı olmadan dene.</p><div id="km-range-options"></div><div id="km-weapons"></div>';document.body.appendChild(panel);
function select(label,list,change){const w=document.createElement('label');w.textContent=label;const s=document.createElement('select');for(const [id,t]of list){const o=document.createElement('option');o.value=id;o.textContent=t;s.append(o);}s.onchange=()=>change(s.value);w.append(s);panel.querySelector('#km-range-options').append(w);return s;}
const target=select('Hedef',Object.entries(TG).map(([id,v])=>[id,v.name]),id=>S.target=id);target.value=S.target;
const mode=select('Oyun',Object.entries(TASKS).map(([id,v])=>[id,v.name]),()=>{});mode.value='serbest';
for(const [id,v]of Object.entries(RIFLES)){const b=document.createElement('button');b.textContent=v.name;b.dataset.equipment=id;b.onclick=()=>{S.rifle=id;S.target=target.value;startMode(mode.value||'serbest');document.getElementById('menu').hidden=true;document.getElementById('modal').hidden=true;S.started=true;panel.hidden=true;H.status('Poligon · '+v.name);};panel.querySelector('#km-weapons').append(b);}
const open=document.createElement('button');open.id='km-range-menu';open.textContent='EKİPMAN / HEDEF';document.body.appendChild(open);open.onclick=()=>{S.trig.down=false;S.started=false;panel.hidden=false;};
const nativeFire=fire;fire=function(){if(paused||disposed||!panel.hidden)return;return nativeFire.apply(this,arguments);};
S.started=false;
const api={owner:window,pause(v){if(paused===!!v)return;paused=!!v;if(v){before=S.started;S.started=false;S.trig.down=false;}else S.started=before&&panel.hidden;},snapshot:()=>({weapon:S.rifle}),sound(v){S.sound=!!v;OPT.voice=0;},canLeave:()=>true,dispose(){disposed=true;S.started=false;S.trig.down=false;saveST();},diagnostics:()=>({ready:true,paused,shots:S.shots.length,rifle:S.rifle,targets:Object.keys(TG).length,equipment:Object.keys(RIFLES).length,modes:Object.keys(TASKS).length,selecting:!panel.hidden})};window.KomutaScene=api;H.connect('range',api);
})();
