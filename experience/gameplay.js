/* HİSAR Oynanış 1.3.0. Fictional game presentation/balance, not real equipment data. */
(function(root){
'use strict';
const VERSION='1.3.0', KEY='hisar-gameplay-v1';
const safe=(fn,fallback)=>{try{return fn();}catch{return fallback;}};
const num=(v,d=0)=>safe(()=>Number.isFinite(Number(v))?Number(v):d,d);
const clamp=(v,a,b,d=0)=>Math.max(a,Math.min(b,num(v,d)));
const defaults=Object.freeze({droneView:'follow',clearDrone:true,vehicleDetail:true,targetLabels:true,hitFeedback:true,balancedDrops:true});
function settings(v){v=v&&typeof v==='object'?v:{};return {droneView:v.droneView==='fpv'?'fpv':'follow',clearDrone:v.clearDrone!==false,vehicleDetail:v.vehicleDetail!==false,targetLabels:v.targetLabels!==false,hitFeedback:v.hitFeedback!==false,balancedDrops:v.balancedDrops!==false};}
// Unitless arcade balance. These values do not model any real munition or weapon.
function blastFactor(distance,radius,blocked){if(blocked||!Number.isFinite(distance)||!Number.isFinite(radius)||radius<=0||distance>=radius)return 0;return Math.max(.12,1-Math.pow(Math.max(0,distance)/radius,1.35));}
function carryVelocity(dx,dz,dt){if(!(dt>0&&dt<=.1)||![dx,dz].every(Number.isFinite)||Math.hypot(dx,dz)>8)return {x:0,z:0};let x=dx/dt*.55,z=dz/dt*.55,s=Math.hypot(x,z);if(s>18){x*=18/s;z*=18/s;}return {x,z};}
function canDrop(s){if(!s||!s.playing)return 'paused';if(!s.on||s.falling||s.returning||s.spin<.6)return 'not-ready';if(s.ammo<=0)return 'empty';if(s.pending>=12)return 'busy';if(s.cooldown>0)return 'cooldown';return '';}
const core=Object.freeze({VERSION,defaults,settings,blastFactor,carryVelocity,canDrop});
if(typeof module==='object'&&module.exports)module.exports=core;
const doc=root.document;if(!doc||root.HisarGameplay)return;
let opts=settings(safe(()=>JSON.parse(root.localStorage.getItem(KEY)),null));
let sim=0,dropAt=-1,nextInfo=0,nextLabels=0,nextDetail=0,noticeEnd=0,noticeText='';
let velocity={x:0,z:0},stats={shots:0,drops:0,hits:0,destroyed:0},panel,targetLayer,notice;
let labels=[],lastTargets=[],patched=Object.create(null),nativeVoiceCalls=0,detailGroups=0,customImpacts=0;
const detailed=new WeakSet(),textureOriginal=new Map(),radioTimes=new Map();
let seenTextures=new WeakSet();
const watch=()=>safe(()=>({playing:game==='play',mode,view:iv,on:!!DR.on,drone:mode==='drone'&&DR.on,falling:!!DR.fall,returning:!!DR.rt,spin:DR.sp,ammo,pending:bombs.length,cooldown:Math.max(0,dropAt-sim),mission:mis,remaining:E.length,marked:E.filter(e=>e.mark).length,finished:false}),{playing:false,drone:false,mode:'',view:-1,mission:'',remaining:0,marked:0,total:0});
function announce(text){noticeText=String(text).slice(0,180);noticeEnd=sim+2; if(notice){notice.textContent=noticeText;notice.hidden=false;}}
function speak(text,key,cool=5){const now=sim;if(key&&radioTimes.has(key)&&now-radioTimes.get(key)<cool)return false;if(key){radioTimes.set(key,now);if(radioTimes.size>48)radioTimes.delete(radioTimes.keys().next().value);}return !!safe(()=>root.HisarImmersive.speak(String(text)),false);}
function noLegacyVoice(fn,self,args){const prior=safe(()=>SV.voice,undefined);try{if(typeof SV!=='undefined')SV.voice=0;return fn.apply(self,args);}finally{if(typeof SV!=='undefined'){if(prior===undefined)delete SV.voice;else SV.voice=prior;}}}
function wrap(name,factory){if(patched[name]||typeof root[name]!=='function')return false;const original=root[name];root[name]=factory(original);patched[name]=true;return true;}
function set(values){const previous=opts;opts=settings({...opts,...values});safe(()=>root.localStorage.setItem(KEY,JSON.stringify(opts)),null);if(previous.balancedDrops!==opts.balancedDrops)announce('Yeni bırakılan bombalar seçilen oyun dengesini kullanır.');if(previous.vehicleDetail&&!opts.vehicleDetail){for(const [t,a]of textureOriginal){t.anisotropy=a;t.needsUpdate=true;}textureOriginal.clear();seenTextures=new WeakSet();}nextDetail=0;refreshPanel();return {...opts};}
function patchVoices(){if(!root.HisarImmersive)return;
 wrap('radio',old=>function(t){const enabled=safe(()=>SV.voice!==0&&SV.radioV!==0&&game==='play',false);const r=noLegacyVoice(old,this,arguments);if(enabled){nativeVoiceCalls++;speak(t,'radio:'+t,6);}return r;});
 if(root.CREW&&!patched.crew){const c=root.CREW;
  for(const name of ['say','radio'])if(typeof c[name]==='function'){const old=c[name];c[name]=function(t,p,key,cool){const enabled=safe(()=>SV.voice!==0&&(game==='play'||key==='t')&&(name!=='radio'||SV.radioV!==0),false);const r=noLegacyVoice(old,this,arguments);if(enabled){nativeVoiceCalls++;speak(t,key||name+':'+t,cool||5);}return r;};}
  patched.crew=true;
 }
}
function impactBomb(b){if(b.done)return;b.done=1;customImpacts++;const p=b.m.position;
 const radius=safe(()=>(5+L.cone*12)*(1+.06*SV.U.bmb),6),power=safe(()=>200*(1+.15*SV.U.bmb),200);
 safe(()=>root.bigBoom(p.x,p.z,radius*.8),null);
 const enemies=safe(()=>E.slice(),[]);
 for(const e of enemies){const distance=Math.max(0,Math.hypot(e.x-p.x,e.z-p.z)-Math.min(num(e.r,1),4));const y=safe(()=>hAt(e.x,e.z)+1.8,1.8);
  const blocked=typeof root.los==='function'&&!safe(()=>root.los(p.x,p.y+.6,p.z,e.x,y,e.z),false);
  const factor=blastFactor(distance,radius,blocked);if(factor>0)safe(()=>root.hurt(e,power*factor),null);
 }
 safe(()=>root.rm(b.m),null);
}
function stepBombs(items,dt){const live=[];for(const b of items){if(!b?.m?.position||b.done)continue;let remaining=dt;
 while(remaining>0&&!b.done){const step=Math.min(remaining,1/60);remaining-=step;b.hg.age+=step;b.vy+=30*step;
  b.m.position.x+=b.hg.vx*step;b.m.position.z+=b.hg.vz*step;b.m.position.y-=b.vy*step;b.m.rotation.y+=step*3;
  const p=b.m.position,ground=safe(()=>hAt(p.x,p.z)+.4,-Infinity),cover=safe(()=>root.blockedAt(p),null);
  if(p.y<=ground||cover){if(p.y<=ground)p.y=ground;impactBomb(b);}
  else if(b.hg.age>20||![p.x,p.y,p.z].every(Number.isFinite)){b.done=1;safe(()=>root.rm(b.m),null);}
 }
 if(!b.done)live.push(b);
 }return live;}
function installHooks(){patchVoices();
 wrap('fire',old=>function(){const s=watch();if(s.drone&&opts.balancedDrops){const reason=canDrop(s);if(reason){const texts={empty:'Bomba kalmadı · tanka dönerek ikmal yap.',cooldown:'Bırakma mekanizması hazırlanıyor.',busy:'Havadaki bombaların tamamlanmasını bekle.','not-ready':'Uçangöz uçuşa hazır değil.',paused:'Oyun duraklatıldı.'};announce(texts[reason]);return false;}}
 const before=safe(()=>shells.length,0),n=safe(()=>bombs.length,0);const result=old.apply(this,arguments);
 const added=safe(()=>bombs.slice(n),[]);if(added.length){stats.drops+=added.length;stats.shots+=added.length;dropAt=sim+.65;for(const b of added)if(opts.balancedDrops)b.hg={vx:velocity.x,vz:velocity.z,age:0};announce('Bomba bırakıldı · '+safe(()=>ammo,0)+' kaldı');}
 else if(safe(()=>shells.length,0)>before)stats.shots++;
 return result;});
 wrap('update',old=>function(dt){dt=clamp(dt,0,.1);if(!watch().playing)return old.apply(this,arguments);sim+=dt;
 const x=safe(()=>DR.x,0),z=safe(()=>DR.z,0),owned=safe(()=>bombs.filter(b=>b.hg&&!b.done),[]);
 if(owned.length)bombs=bombs.filter(b=>!b.hg||b.done);
 // Original infinite mid-air regeneration is suppressed; native dock/wave resupply remains intact.
 if(opts.balancedDrops&&safe(()=>DR.on,false))ammoT=0;
 let result;try{result=old.call(this,dt);}finally{if(owned.length){if(watch().playing)bombs.push(...stepBombs(owned,dt));else for(const b of owned)safe(()=>root.rm(b.m),null);}}
 velocity=carryVelocity(safe(()=>DR.x,0)-x,safe(()=>DR.z,0)-z,dt);return result;
 });
 wrap('hurt',old=>function(e,damage){const before=e?.hp;const r=old.apply(this,arguments);if(e&&Number.isFinite(before)&&before>0&&e.hp<before){stats.hits++;if(opts.hitFeedback)announce(e.hp<=0?'Hedef devre dışı':'İsabet · −'+Math.round(before-Math.max(0,e.hp)));e.hgHitUntil=sim+1.4;}return r;});
 wrap('killE',old=>function(e){const was=safe(()=>E.includes(e),false);const r=old.apply(this,arguments);if(was&&!safe(()=>E.includes(e),false))stats.destroyed++;return r;});
 wrap('reset',old=>function(){for(const [t,a]of textureOriginal){t.anisotropy=a;t.needsUpdate=true;}textureOriginal.clear();seenTextures=new WeakSet();sim=0;dropAt=-1;velocity={x:0,z:0};stats={shots:0,drops:0,hits:0,destroyed:0};radioTimes.clear();clearLabels();const r=old.apply(this,arguments);stats.total=safe(()=>E.length,0);nextDetail=0;nextInfo=0;updatePresentation();return r;});
 wrap('endGame',old=>function(ok){const was=watch().playing;const r=old.apply(this,arguments);if(!was||watch().playing)return r;clearLabels();if(notice)notice.hidden=true;return r;});
 wrap('camUpdate',old=>function(){const r=old.apply(this,arguments),s=watch();if(s.playing&&s.drone&&!safe(()=>root.PHOTO?.on||root.BCAM?.on||root.mapOpen,false)){if(opts.droneView==='fpv')DR.g.visible=false;else{DR.g.visible=true;DR.g.scale.setScalar(.58);}}return r;});
 if(!patched.frame&&Array.isArray(safe(()=>FRAME_HOOKS,null))){FRAME_HOOKS.push(updatePresentation);patched.frame=true;}
}
function detail(){if(!opts.vehicleDetail||typeof R==='undefined')return;const max=clamp(safe(()=>R.capabilities.getMaxAnisotropy(),1),1,8,1);
 const groups=safe(()=>[P.g,DR.g,...E.map(e=>e.g),...AL.map(a=>a.g)],[]);
 for(const group of groups){if(!group)continue;if(!detailed.has(group)){detailed.add(group);detailGroups++;}
 group.traverse(o=>{for(const m of(Array.isArray(o.material)?o.material:[o.material]))if(m)for(const key of ['map','normalMap']){const tex=m[key];if(!tex?.isTexture||seenTextures.has(tex))continue;seenTextures.add(tex);if(tex.anisotropy<max){textureOriginal.set(tex,tex.anisotropy);tex.anisotropy=max;tex.needsUpdate=true;}}});}
}
function clearLabels(){for(const label of labels)label.hidden=true;lastTargets=[];}
function updateTargets(s){if(!targetLayer||!opts.targetLabels||!s.playing||safe(()=>root.mapOpen||root.PHOTO?.on,false)){clearLabels();return;}
 const list=safe(()=>E,[]),camera=safe(()=>CAM,null);if(!camera?.position||!root.THREE)return;
 let count=0;lastTargets=[];
 for(const e of list){if(count>=4)break;if(!(e.mark||e.hgHitUntil>sim)||e.hp<=0||!safe(()=>root.spotted(e),false))continue;
 const height=safe(()=>hAt(e.x,e.z)+(e.top||4.5)+1,5);
 if(typeof root.los==='function'&&!safe(()=>root.los(camera.position.x,camera.position.y,camera.position.z,e.x,height,e.z),false))continue;
 const p=new THREE.Vector3(e.x,height,e.z).project(camera);if(p.z<-1||p.z>1||Math.abs(p.x)>.92||Math.abs(p.y)>.88)continue;
 const label=labels[count++];label.hidden=false;label.style.left=((p.x+1)*.5*root.innerWidth)+'px';label.style.top=((1-p.y)*.5*root.innerHeight)+'px';
 label.firstChild.textContent=safe(()=>ENT[e.type],e.type||'HEDEF');label.lastChild.firstChild.style.width=(clamp(e.hp/safe(()=>emx(e),100),0,1)*100)+'%';lastTargets.push(e.type);
 }for(let i=count;i<labels.length;i++)labels[i].hidden=true;
}
function updatePresentation(){const s=watch();if(doc.hidden)return;
 doc.body?.classList.toggle('hg-clear-drone',!!(opts.clearDrone&&s.playing&&s.drone));
 if(!s.playing){clearLabels();if(notice)notice.hidden=true;return;}
 if(notice){notice.hidden=!opts.hitFeedback||sim>=noticeEnd;}
 if(sim>=nextDetail){nextDetail=sim+2;safe(detail,null);}
 if(sim>=nextLabels){nextLabels=sim+.12;safe(()=>updateTargets(s),null);}
 if(sim<nextInfo)return;nextInfo=sim+.1;
 const b=doc.querySelector('#kmd [data-k="bomb"]');if(b){b.setAttribute('aria-disabled',String(!!canDrop(s)));b.classList.toggle('hg-reloading',!!s.cooldown);b.title=s.ammo<=0?'Mühimmat bitti · ikmal için tanka dön':s.cooldown>0?'Bırakma mekanizması hazırlanıyor':'Oyun bombası bırak';}
}
function refreshPanel(){if(!panel)return;for(const input of panel.querySelectorAll('[data-hg]')){const k=input.dataset.hg;if(input.type==='checkbox')input.checked=opts[k];else input.value=opts[k];}}
function installUI(){if(!doc.body)return;
 if(!doc.getElementById('hisar-gameplay-style')){const style=doc.createElement('style');style.id='hisar-gameplay-style';style.textContent=`
.hg-card{border:1px solid #46605a;border-radius:12px;background:#111c20;color:#edf3ed;padding:14px;margin:12px 0;font:14px/1.5 system-ui;box-sizing:border-box;min-width:0}.hg-card h3{margin:0 0 8px;font-size:15px;letter-spacing:.5px}.hg-card p{margin:8px 0;color:#bdcec6}.hg-card button,.hg-card select{min-height:44px;border:1px solid #6a8277;border-radius:8px;background:#233b35;color:#fff;padding:8px 12px;max-width:100%;font:inherit}.hg-card label{display:flex;align-items:center;justify-content:space-between;gap:14px;margin:10px 0}.hg-card input{width:22px;height:22px}.hg-card button:focus-visible,.hg-card select:focus-visible{outline:3px solid #a0f4c5}.hg-card small{display:block;color:#abc3b6}
#hg-notice{position:fixed;top:24%;left:50%;transform:translateX(-50%);z-index:13;pointer-events:none;max-width:88vw;background:#0d211ee6;border:1px solid #b8ebd4;border-radius:7px;padding:8px 13px;color:#effff5;font:700 14px system-ui;text-align:center}#hg-targets{position:fixed;inset:0;z-index:11;pointer-events:none}.hg-target{position:absolute;transform:translate(-50%,-100%);max-width:150px;padding:4px 7px;background:#101818da;border:1px solid #e7bc75;color:#fff;font:700 11px system-ui;border-radius:4px;text-align:center}.hg-target .bar{height:3px;background:#472923;margin-top:3px}.hg-target .bar i{display:block;height:100%;background:#edb171}.hg-reloading{opacity:.55!important}body.hg-clear-drone #fpvG{opacity:.3!important}body.hg-clear-drone #kmd{filter:drop-shadow(0 -3px 8px #0006)}#hg-notice[hidden],#hg-targets [hidden]{display:none!important}
@media(max-width:600px){.hg-card{padding:10px}.hg-target{font-size:10px}#hg-notice{font-size:12px}}`;
 doc.head.appendChild(style);}
 if(!notice){notice=doc.createElement('div');notice.id='hg-notice';notice.setAttribute('role','status');notice.hidden=true;doc.body.appendChild(notice);
 targetLayer=doc.createElement('div');targetLayer.id='hg-targets';doc.body.appendChild(targetLayer);for(let i=0;i<4;i++){const l=doc.createElement('div');l.className='hg-target';l.hidden=true;l.innerHTML='<b></b><div class="bar"><i></i></div>';targetLayer.appendChild(l);labels.push(l);}}
 const parent=doc.getElementById('hx-settings');if(parent&&!doc.getElementById('hg-settings')){panel=doc.createElement('section');panel.id='hg-settings';panel.className='hg-card';const h=doc.createElement('h3');h.textContent='Oynanış ve görünüm · '+VERSION;panel.appendChild(h);
 for(const [key,title]of[['clearDrone','Net drone görüntüsü'],['vehicleDetail','Araç dokularını netleştir'],['targetLabels','Görünen işaretli hedef etiketleri'],['hitFeedback','Vuruş geri bildirimi'],['balancedDrops','Dengeli bomba / ikmal sistemi']]){const l=doc.createElement('label'),s=doc.createElement('span'),i=doc.createElement('input');s.textContent=title;i.type='checkbox';i.dataset.hg=key;i.onchange=()=>set({[key]:i.checked});l.append(s,i);panel.appendChild(l);}
 const label=doc.createElement('label'),text=doc.createElement('span'),select=doc.createElement('select');text.textContent='Drone kamerası';select.dataset.hg='droneView';for(const [v,t]of[['follow','Takip · gövde görünür'],['fpv','FPV · temiz ekran']]){const o=doc.createElement('option');o.value=v;o.textContent=t;select.appendChild(o);}select.onchange=()=>set({droneView:select.value});label.append(text,select);panel.appendChild(label);const note=doc.createElement('small');note.textContent='Oyun dengesi ve görsel ayarlardır; gerçek araç/nişangâh kalibrasyonu değildir. Sinyal kaybı uyarıları korunur.';panel.appendChild(note);parent.appendChild(panel);refreshPanel();}
}
function diagnostics(){return {version:VERSION,settings:{...opts},hooks:{...patched},stats:{...stats},customImpacts,nativeVoiceCalls,detailGroups,visibleTargetTypes:lastTargets.slice(),cooldown:Math.max(0,dropAt-sim),scene:watch()};}
root.HisarGameplay=Object.freeze({version:VERSION,core,getSettings:()=>({...opts}),set,diagnostics,connect:installHooks});
installUI();installHooks();doc.addEventListener('hisar:ui-ready',()=>{installUI();installHooks();});
root.addEventListener('blur',()=>{velocity={x:0,z:0};clearLabels();});doc.addEventListener('visibilitychange',()=>{if(doc.hidden){velocity={x:0,z:0};clearLabels();}});
})(typeof window!=='undefined'?window:globalThis);
