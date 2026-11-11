/* HİSAR 63.2 — non-weapon analog driving/flight input comfort.
   Shapes only movement joystick axes; never changes mission or vehicle physics. */
(function(root){
 'use strict';
 const KEY='hisar-control-feel-v1';
 const profiles=Object.freeze({
  hassas:Object.freeze({deadzone:.12,curve:1.55,response:12}),
  dengeli:Object.freeze({deadzone:.08,curve:1.18,response:18}),
  seri:Object.freeze({deadzone:.04,curve:1,response:28})
 });
 function axis(value,profile){
  const p=profiles[profile]||profiles.dengeli;
  const n=Number(value),v=Number.isFinite(n)?Math.max(-1,Math.min(1,n)):0,a=Math.abs(v);
  if(a<=p.deadzone)return 0;
  return Math.sign(v)*Math.pow((a-p.deadzone)/(1-p.deadzone),p.curve);
 }
 function smoothing(previous,target,dt,profile){
  const p=profiles[profile]||profiles.dengeli;
  const n=Number(dt),time=Number.isFinite(n)?Math.max(0,Math.min(.1,n)):0;
  const a=1-Math.exp(-p.response*time);
  const v=previous+(target-previous)*a;
  return Math.abs(v)<.001&&target===0?0:v;
 }
 let profile='dengeli';try{const stored=localStorage.getItem(KEY);if(Object.hasOwn(profiles,stored))profile=stored;}catch{}
 let x=0,y=0,lastMode='',lastTime=0;
 function reset(){x=y=0;lastMode='';lastTime=0;}
 function setProfile(name){if(!Object.hasOwn(profiles,name))return false;profile=name;reset();try{localStorage.setItem(KEY,name);}catch{}return true;}
 const api=Object.freeze({profiles,axis,smoothing,setProfile,getProfile:()=>profile,reset});
 root.HisarControls=api;
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(!root.document)return;
 // Legacy update() is a global function. Preserve raw joystick values for the rest of the game.
 if(typeof root.update==='function'){
  const original=root.update;
  root.update=function(dt){
   if(typeof joy==='undefined'||!joy||typeof mode==='undefined'||typeof game==='undefined'||game!=='play'){reset();return original.apply(this,arguments);}
   if(mode!==lastMode){reset();lastMode=mode;}
   // Never change non-driving/non-flight input, including menus and aim modes.
   if(mode!=='tank'&&mode!=='drone')return original.apply(this,arguments);
   const rawX=joy.x,rawY=joy.y;
   const now=typeof performance!=='undefined'?performance.now():Date.now();
   const elapsed=Number.isFinite(dt)&&dt>0&&dt<=.1?dt:(lastTime?Math.min(.1,Math.max(0,(now-lastTime)/1000)):1/60);
   lastTime=now;
   x=smoothing(x,axis(rawX,profile),elapsed,profile);
   y=smoothing(y,axis(rawY,profile),elapsed,profile);
   joy.x=x;joy.y=y;
   try{return original.apply(this,arguments);}
   finally{joy.x=rawX;joy.y=rawY;}
  };
 }
 root.addEventListener('hisar:release-inputs',reset);
 root.addEventListener('blur',reset);
 root.document.addEventListener('visibilitychange',()=>{if(root.document.hidden)reset();});
 function attach(){
  const settings=root.document.getElementById('hx-settings');
  if(!settings||root.document.getElementById('hx-control-feel'))return;
  const row=root.document.createElement('label');row.className='hx-row';row.id='hx-control-feel';
  const title=root.document.createElement('span');title.textContent='Sürüş ve uçuş kontrol hissi';
  const hint=root.document.createElement('small');hint.className='hx-muted';hint.style.display='block';hint.textContent='Analog çubuk için hassas, dengeli veya seri tepki. Klavye ve görev kuralları değişmez.';title.appendChild(hint);
  const select=root.document.createElement('select');select.setAttribute('aria-label','Sürüş ve uçuş kontrol hissi');
  for(const [value,label]of [['hassas','Hassas'],['dengeli','Dengeli'],['seri','Seri']]){const o=root.document.createElement('option');o.value=value;o.textContent=label;select.appendChild(o);}
  select.value=profile;select.addEventListener('change',()=>setProfile(select.value));
  row.append(title,select);settings.appendChild(row);
 }
 attach();root.document.addEventListener('hisar:ui-ready',attach,{once:true});
})(typeof window!=='undefined'?window:globalThis);
