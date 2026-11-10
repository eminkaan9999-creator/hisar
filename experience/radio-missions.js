/* HİSAR 1.3: fictional AI squad radio + six objective-driven game missions.
 * Uses existing game units, navigation and rendering. No hardware or real-world weapon data.
 */
(function(root){
'use strict';
const VERSION='1.3.0', SAVE='hisar-operations-v1';
const safe=(fn,d)=>{try{return fn();}catch{return d;}}, clamp=(v,a,b)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:a));
const clean=t=>typeof t==='string'?t.slice(0,160).toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i').replace(/[^a-z0-9\s-]/g,' ').replace(/\s+/g,' ').trim():'';
const ORDERS=Object.freeze({
 1:{title:'Beni takip et',reply:'Sizi takip ediyorum.'},2:{title:'Burada bekle',reply:'Burada bekliyorum.'},
 3:{title:'İşaretli oyun hedefi',reply:'İşaretli oyun hedefine yöneliyorum.'},4:{title:'Oyunda ateş serbest',reply:'Anlaşıldı.'},
 5:{title:'Ateşi kes',reply:'Ateşi kestim.'},6:{title:'Aralık aç',reply:'Aralık açıyorum.'},
 7:{title:'Geri gel',reply:'Geri geliyorum.'},8:{title:'Durum bildir',reply:''},9:{title:'Yanımda toplan',reply:'Yanınızda toplanıyorum.'}
});
function parse(text,selected='all'){
 const s=clean(text);if(!s||(/\b(yapma|etme|durma|bekleme|takip etme)\b/.test(s)&&!s.includes('ates etme')))return null;
 const t=s.replace(/\bbir\b/g,'1').replace(/\biki\b/g,'2').replace(/\buc\b/g,'3').replace(/\bdort\b/g,'4');
 let recipient=selected, explicit=t.match(/\b(?:kaplan\s*)?1\s*-?\s*([234])\b/);
 if(/\b(tum birlik|butun birlik|herkes|tum tanklar)\b/.test(s))recipient='all';else if(explicit)recipient='KAPLAN 1-'+explicit[1];else if(/\bikmal\b/.test(s))recipient='İKMAL 1';
 const tests=[[5,/\b(atesi kes|ates kes|ates etme)\b/],[8,/\b(durum bildir|durumunuz|durum raporu|ses kontrol|duyuyor musun)\b/],[9,/\b(toplan|yanima gel|yanimda toplan)\b/],[1,/\b(takip et|takip edin|pesimden gel|beni izle)\b/],[2,/\b(bekle|bekleyin|dur|durun)\b/],[7,/\b(geri gel|geri don|geri cekil)\b/],[6,/\b(aralik ac|dagil)\b/],[4,/\b(ates serbest)\b/],[3,/\b(isaretli hedef|hedefe ates)\b/]];
 const match=tests.find(([,r])=>r.test(s));return match?{recipient,code:match[0]}:null;
}
function applyOrder(unit,code,target){
 if(!unit||unit.dead||unit.hp<=0)return {ok:false,reason:'unavailable'};
 if(!ORDERS[code])return {ok:false,reason:'unknown'};
 if(code===3&&!target)return {ok:false,reason:'no-target'};
 if(unit.convoy){if(![1,2,8,9].includes(code))return {ok:false,reason:'unsupported'};if(code!==8)unit.waiting=code===2;return {ok:true};}
 if(code===1||code===9){unit.cmd='follow';unit.tgt=null;}
 if(code===2){unit.cmd='hold';unit.hold={x:unit.x,z:unit.z};unit.tgt=null;}
 if(code===3){unit.cmd='attack';unit.tgt=target;unit.fire=1;}
 if(code===4)unit.fire=1;
 // The legacy AI can fire in attack mode even with fire=0, so clear that mode too.
 if(code===5){unit.fire=0;unit.tgt=null;if(unit.cmd==='attack'){unit.cmd='hold';unit.hold={x:unit.x,z:unit.z};}}
 if(code===6){unit.cmd='disperse';unit.tgt=null;}
 if(code===7){unit.cmd='retreat';unit.fire=0;unit.tgt=null;}
 return {ok:true};
}
function reply(unit,code){
 if(code===8){const h=Math.round(clamp(unit.hp/(unit.mx||100),0,1)*100);return 'Komutanım, '+(unit.convoy?(unit.waiting?'bekliyorum':'yoldayım'):({follow:'takipteyim',hold:'bekliyorum',attack:'oyun hedefindeyim',disperse:'aralık açıyorum',retreat:'geri geliyorum'}[unit.cmd]||'hazırım'))+'. Araç durumu yüzde '+h+'.';}
 return 'Emredersiniz komutanım. '+(unit.convoy?(unit.waiting?'Konvoy bekliyor.':'Konvoy devam ediyor.'):ORDERS[code].reply);
}
const goal=(type,at,text,seconds=0)=>Object.freeze({type,at,text,seconds});
const SCENARIOS=Object.freeze([
 {id:'hr_rescue',title:'Karanlıkta Çağrı',tag:'KEŞİF · KURTARMA',weather:'gece',brief:'Kayıp ekibin işaretini uçangözle bul. Tankla ulaş, ekibi al ve dost araçlarla üsse dön.',goals:[goal('scan','a','Uçangözle ışıklı işareti tara',3),goal('interact','a','Tankla işarete ulaş; X / Etkileş ile ekibi al',4),goal('regroup','base','En az bir dost tankla üsse dön',2)]},
 {id:'hr_convoy',title:'Konvoy Yolu',tag:'EŞLİK · TELSİZ',weather:'gunduz',brief:'İkmal aracı yalnız bırakıldığında durur. Telsizden devam/bekle komutu ver, yanından ayrılmadan iki kontrol noktasına götür.',goals:[goal('escort','a','İKMAL 1 ile ilk kontrol noktasına ilerle'),goal('interact','a','Kontrol noktasında X / Etkileş ile geçiş kaydını al',3),goal('escort','b','İkmal aracını varış noktasına ulaştır')]},
 {id:'hr_relay',title:'Son İstasyon',tag:'ONARIM · DAYANMA',weather:'gunduz',brief:'İstasyondaki iki bağlantıyı onar. Ardından oyun saldırısı boyunca bölgede kal; süre dolduğunda kalan oyun hedeflerini temizle.',goals:[goal('interact','a','Birinci röleyi X / Etkileş ile onar',4),goal('interact','b','İkinci röleyi X / Etkileş ile onar',4),goal('defend','b','Bağlantı tamamlanana kadar bölgede kal',35)]},
 {id:'hr_fog',title:'Sisli Geçit',tag:'ROTA · BİRLİK',weather:'yagmur',brief:'Yağmurda üç kontrol noktasını sırayla geç. Son noktada birliğini telsizle topla; yalnız varmak görevi bitirmez.',goals:[goal('reach','a','Birinci rota işaretine ulaş',1),goal('reach','b','İkinci rota işaretine ulaş',1),goal('regroup','c','Son işarette en az bir dost tankı bekle',3)]},
 {id:'hr_record',title:'Kayıp Kayıt',tag:'UÇANGÖZ · ARAMA',weather:'gunduz',brief:'Üç ayrı işareti uçangözle incele. Son kaydı tankla al ve üsse getir. Tarama sırasında işaretin üzerinde kal.',goals:[goal('scan','a','Birinci işareti uçangözle incele',3),goal('scan','b','İkinci işareti uçangözle incele',3),goal('scan','c','Son işareti uçangözle incele',3),goal('interact','c','Tankla kayda ulaş; X / Etkileş ile al',4),goal('reach','base','Kaydı üsse getir',2)]},
 {id:'hr_return',title:'Kimse Geride Kalmasın',tag:'DAYANMA · GERİ DÖNÜŞ',weather:'gece',brief:'İleri noktaya ekibinle ulaş. Kısa oyun saldırısını atlat ve hayatta kalan dost araçları üsse getir; birlik kaybı görev değerlendirmesine yansır.',goals:[goal('regroup','a','En az bir dost tankla buluşma alanına gel',2),goal('defend','a','Oyun saldırısı bitene kadar bölgede kal',25),goal('all-home','base','Hayatta kalan bütün dost tankları üsse getir',2)]}
].map(s=>Object.freeze({...s,goals:Object.freeze(s.goals)})));
function objectiveStep(g,previous,s,dt){
 dt=clamp(dt,0,.1);let valid=false;
 if(g.type==='scan')valid=s.drone&&s.droneNear&&s.signal>.15;
 if(g.type==='interact')valid=s.tank&&s.playerNear&&s.interacting;
 if(g.type==='reach')valid=s.tank&&s.playerNear;
 if(g.type==='regroup')valid=s.tank&&s.playerNear&&s.nearAllies>=1;
 if(g.type==='all-home')valid=s.tank&&s.playerNear&&s.aliveAllies>0&&s.nearAllies===s.aliveAllies;
 if(g.type==='escort')valid=s.playerNear&&s.convoyNear;
 if(g.type==='defend')valid=s.playerNear;
 const amount=valid?previous+dt:(['scan','interact','regroup','all-home'].includes(g.type)?0:previous);
 const duration=g.seconds||.5;
 return {amount:Math.min(duration,amount),done:valid&&amount>=duration&&(g.type!=='defend'||s.enemies===0)};
}
const core=Object.freeze({VERSION,clean,parse,ORDERS,SCENARIOS,applyOrder,reply,objectiveStep});
if(typeof module==='object'&&module.exports)module.exports=core;
const doc=root.document;if(!doc||root.HisarOperations)return;
let sim=0,queue=[],feed=[],history=[],selected='all',lastOrder=new Map(),versions=new Map(),serial=0,opened=false,active=null,preparing=null,finishing=false,interacting=false,missionChoice=0,microphone=null,micTimer=null,micEpoch=0,lastPaint=-1;
let radioPanel,roster,log,radioStatus,micButton,missionsPanel,objectivePanel,marker,convoy,returnFocus;
const props=[],hooks={},data=safe(()=>JSON.parse(root.localStorage.getItem(SAVE)||'{}'),{});
const record=data&&typeof data==='object'&&!Array.isArray(data)?data:{};
const playing=()=>safe(()=>game==='play',false);
const allies=()=>safe(()=>AL.filter(a=>a&&!a.dead&&a.hp>0),[]);
const units=()=>convoy?[...allies(),convoy]:allies();
function write(){safe(()=>root.localStorage.setItem(SAVE,JSON.stringify(record)),null);}
function emit(who,text,voice=true,fallback=true){
 const message=who+': '+text;feed.push({who,text,at:sim});if(feed.length>12)feed.shift();
 const prior=safe(()=>SV.voice,undefined);try{if(typeof SV!=='undefined')SV.voice=0;safe(()=>root.radio(message),null);}finally{if(typeof SV!=='undefined'){if(prior===undefined)delete SV.voice;else SV.voice=prior;}}
 const enabled=voice&&playing()&&!doc.hidden&&safe(()=>SV.voice!==0&&SV.radioV!==0,true)&&safe(()=>root.HisarImmersive.getSettings().radioVoice,true);
 if(enabled&&!safe(()=>root.HisarImmersive.speak(message),false)&&fallback)safe(()=>root.HisarRadioSound.play(),null);
 paintFeed();
}
function warn(text){if(radioStatus)radioStatus.textContent=text;safe(()=>root.say(text,2),null);}
function issue(recipient,code){
 if(!playing()||doc.hidden)return {ok:false,reason:'paused'};
 code=Number(code);if(!ORDERS[code])return {ok:false,reason:'unknown'};
 const available=units(),chosen=recipient==='all'?available.filter(u=>!u.convoy):available.filter(u=>u.cs===recipient);
 if(!chosen.length){warn('Seçilen dost araç bu görevde yok. Birlik menüsünden Kısım veya Takım seçebilirsin.');return {ok:false,reason:'unavailable'};}
 const token=recipient+'|'+code;if(sim-(lastOrder.get(token)??-99)<.6)return {ok:false,reason:'duplicate'};
 const target=code===3?safe(()=>root.designate(),null):null;
 if(code===3&&!target){warn('İşaretli oyun hedefi bulunamadı.');return {ok:false,reason:'no-target'};}
 let accepted=[];for(const u of chosen){const result=applyOrder(u,code,target);if(result.ok)accepted.push(u);}
 if(!accepted.length){warn('Bu araç seçilen komutu uygulayamıyor.');return {ok:false,reason:'unsupported'};}
 safe(()=>root.HisarRadioSound.warm(),null);lastOrder.set(token,sim);if(lastOrder.size>64)lastOrder.delete(lastOrder.keys().next().value);
 emit('SİZ',(recipient==='all'?'Tüm birlik':recipient)+', '+ORDERS[code].title.toLocaleLowerCase('tr-TR')+'.',false);
 for(const u of accepted){const version=++serial;versions.set(u,version);queue=queue.filter(q=>q.unit!==u);queue.push({unit:u,code,version,due:sim+.45+queue.length*1.05});}
 if(queue.length>8)queue=queue.slice(-8);
 history.push({at:sim,recipient,code,units:accepted.map(u=>u.cs)});if(history.length>40)history.shift();paintRoster();
 return {ok:true,accepted:accepted.length};
}
function pump(){
 if(!playing()||doc.hidden)return;const q=queue[0];if(!q||q.due>sim)return;queue.shift();
 if(!units().includes(q.unit)||versions.get(q.unit)!==q.version)return;
 emit(q.unit.cs,reply(q.unit,q.code),true,q.code!==8);
 if(queue.length)queue[0].due=Math.max(queue[0].due,sim+1.05);
}
function cancelMic(){micEpoch++;if(micTimer!==null){root.clearTimeout(micTimer);micTimer=null;}const old=microphone;microphone=null;if(old)safe(()=>old.abort(),null);if(micButton)micButton.textContent='Mikrofonla komut';}
async function listen(){
 if(microphone){cancelMic();return;}if(!playing())return;const Recognition=root.SpeechRecognition||root.webkitSpeechRecognition;if(!Recognition){warn('Bu tarayıcı mikrofonla komutu desteklemiyor. Telsiz düğmeleri kullanılabilir.');return;}
 const epoch=++micEpoch;let r;try{r=new Recognition();r.lang='tr-TR';r.continuous=false;r.interimResults=false;r.maxAlternatives=1;
 let local=false;if('processLocally'in r&&typeof Recognition.available==='function')local=await Recognition.available({langs:['tr-TR'],processLocally:true})==='available';
 if(epoch!==micEpoch||!playing()||!opened||doc.hidden)return;
 const allowRemote=!!doc.getElementById('hr-cloud-consent')?.checked;
 if(!local&&!allowRemote){warn('Yerel Türkçe tanıma yok. Çevrimiçi tanımayı kullanmak için sesin tarayıcı hizmetine gönderilmesine izin kutusunu seç; düğmeler internetsiz çalışır.');return;}
 if('processLocally'in r)r.processLocally=local;microphone=r;
 r.onresult=e=>{if(microphone!==r||epoch!==micEpoch||!playing()||doc.hidden)return;const text=e.results?.[0]?.[0]?.transcript||'';const cmd=parse(text,selected);if(radioStatus)radioStatus.textContent='Duyulan: '+text.slice(0,120);if(cmd)issue(cmd.recipient,cmd.code);else warn('Komut anlaşılmadı. Örnek: Kaplan bir iki, beni takip et.');};
 r.onerror=e=>{if(microphone!==r)return;warn(e.error==='not-allowed'?'Mikrofon izni verilmedi; telsiz düğmeleri çalışıyor.':'Ses tanıma durdu; düğmelerle devam edebilirsin.');cancelMic();};
 r.onend=()=>{if(microphone===r){microphone=null;if(micTimer!==null)root.clearTimeout(micTimer);micTimer=null;if(micButton)micButton.textContent='Mikrofonla komut';}};
 safe(()=>root.HisarImmersive.stop(),null);safe(()=>root.HisarRadioSound.stop(),null);r.start();if(micButton)micButton.textContent='Dinleniyor · durdur';micTimer=root.setTimeout(cancelMic,8000);
 }catch{cancelMic();warn('Mikrofon bu cihazda başlatılamadı; telsiz düğmeleri çalışıyor.');}
}
function paintFeed(){if(!log)return;log.replaceChildren();for(const m of feed.slice(-6)){const p=doc.createElement('p'),b=doc.createElement('b');b.textContent=m.who+' ';p.append(b,doc.createTextNode(m.text));log.appendChild(p);}log.scrollTop=log.scrollHeight;}
let rosterSignature='';
function paintRoster(){if(!roster)return;const signature=units().map(u=>u.cs+':'+Math.round(clamp(u.hp/(u.mx||100),0,1)*100)).join('|');if(signature===rosterSignature&&roster.options.length)return;rosterSignature=signature;const old=selected;roster.replaceChildren();const all=doc.createElement('option');all.value='all';all.textContent='Tüm dost tanklar';roster.appendChild(all);for(const u of units()){const o=doc.createElement('option');o.value=u.cs;o.textContent=u.cs+' · %'+Math.round(clamp(u.hp/(u.mx||100),0,1)*100);roster.appendChild(o);}selected=old==='all'||units().some(u=>u.cs===old)?old:'all';roster.value=selected;}
function close(){opened=false;if(radioPanel)radioPanel.hidden=true;cancelMic();safe(()=>{cmdOpen=0;},null);if(returnFocus?.isConnected)safe(()=>returnFocus.focus({preventScroll:true}),null);returnFocus=null;}
function toggle(){if(opened){close();return;}if(!playing())return;opened=true;returnFocus=doc.activeElement;radioPanel.hidden=false;safe(()=>{cmdOpen=1;cmdStep=1;},null);safe(()=>root.dispatchEvent(new root.Event('hisar:release-inputs')),null);paintRoster();roster.focus({preventScroll:true});}
function wrap(name,factory){if(hooks[name]||typeof root[name]!=='function')return;root[name]=factory(root[name]);hooks[name]=true;}
function point(x,z){
 for(let ring=0;ring<7;ring++)for(let j=0;j<(ring?16:1);j++){const a=j/16*Math.PI*2,px=clamp(x+Math.cos(a)*ring*5,-155,155),pz=clamp(z+Math.sin(a)*ring*5,-155,155);if(safe(()=>hAt(px,pz)>-.5&&!BLD.some(b=>!b.dead&&Math.hypot(b.x-px,b.z-pz)<(b.r||5)+8),false))return {x:px,z:pz};}
 return {x:0,z:0};
}
function cleanup(){for(const p of props){safe(()=>S.remove(p),null);p.traverse?.(o=>{if(o.userData?.hrOwn){safe(()=>o.geometry.dispose(),null);safe(()=>o.material.dispose(),null);}});}props.length=0;marker=null;convoy=null;interacting=false;doc.body?.classList.remove('hr-mission-active');if(objectivePanel)objectivePanel.hidden=true;}
function placeMarker(p){if(!marker)return;marker.position.set(p.x,hAt(p.x,p.z)+.15,p.z);}
function initMission(config){
 const pts={base:point(0,0),a:point(30,35),b:point(-35,55),c:point(-58,8)};
 active={id:config.id,config,step:0,amount:0,elapsed:0,finished:false,initial:allies().length,points:pts,orders:history.length,defenceSpawned:false};
 safe(()=>{if(root.STG){STG.q=[];STG.tot=0;STG.cur=0;}mT=0;},null);
 if(root.THREE&&typeof S!=='undefined'){
 marker=new THREE.Group();const ring=new THREE.Mesh(new THREE.RingGeometry(8,8.6,48),new THREE.MeshBasicMaterial({color:0x93efc6,side:THREE.DoubleSide,transparent:true,opacity:.85,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.userData.hrOwn=true;marker.add(ring);
 const mast=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,4,6),new THREE.MeshBasicMaterial({color:0xafffe0}));mast.position.y=2;mast.userData.hrOwn=true;marker.add(mast);S.add(marker);props.push(marker);
 if(config.id==='hr_convoy'){const p=point(8,16),g=safe(()=>root.mkE('truck'),null);if(g){g.name='HSR_IKMAL_1';S.add(g);props.push(g);convoy={g,x:p.x,z:p.z,h:0,cs:'İKMAL 1',hp:100,mx:100,convoy:true,waiting:true,path:[],goal:-1};g.position.set(p.x,hAt(p.x,p.z),p.z);}}
 }
 doc.body.classList.add('hr-mission-active');safe(()=>root.setW(config.weather),null);enterGoal();emit('KOMUTA',config.brief,true,false);
}
function enterGoal(){
 if(!active||active.finished)return;active.amount=0;active.defenceSpawned=false;interacting=false;
 const g=active.config.goals[active.step];if(!g){finishMission(true);return;}const p=active.points[g.at];placeMarker(p);
 safe(()=>root.startNav({x:p.x,z:p.z,n:g.text}),null);
 if(convoy){convoy.goal=-1;convoy.path=[];}
 if(g.type==='defend'){active.defenceSpawned=true;const positions=[point(p.x+65,p.z+20),point(p.x-60,p.z+35)];for(const q of positions)safe(()=>root.addE('apc',q.x,q.z),null);}
 warn(g.text);paintObjective();
}
function convoyStep(dt,g,p){if(!convoy||g.type!=='escort')return;
 if(convoy.goal!==active.step){const path=safe(()=>root.astar(convoy.x,convoy.z,p.x,p.z),null);convoy.path=Array.isArray(path)?path:[[convoy.x,convoy.z],[p.x,p.z]];convoy.goal=active.step;convoy.index=1;}
 if(convoy.waiting||Math.hypot(P.x-convoy.x,P.z-convoy.z)>42)return;
 const route=convoy.path,way=route[convoy.index]||[p.x,p.z],dx=way[0]-convoy.x,dz=way[1]-convoy.z,d=Math.hypot(dx,dz);if(d<3){if(convoy.index<route.length-1)convoy.index++;return;}
 const step=Math.min(d,6*dt);convoy.x+=dx/d*step;convoy.z+=dz/d*step;safe(()=>root.pushOut(convoy,2.8),null);convoy.h=Math.atan2(dx,dz);convoy.g.position.set(convoy.x,hAt(convoy.x,convoy.z),convoy.z);convoy.g.rotation.y=convoy.h;
}
function updateMission(dt){if(!active||active.finished||!playing())return;active.elapsed+=dt;if(active.elapsed>720){finishMission(false,'Görev süresi bitti.');return;}
 const living=allies();if(!living.length){finishMission(false,'Dost araç kalmadı. Görevi yeniden deneyebilirsin.');return;}
 const g=active.config.goals[active.step],p=active.points[g.at];if(!g)return;safe(()=>{edT=Math.max(edT,15);},null);convoyStep(dt,g,p);
 const near=Math.hypot(P.x-p.x,P.z-p.z)<14,nearAllies=living.filter(a=>Math.hypot(a.x-p.x,a.z-p.z)<30).length;
 const s={tank:mode==='tank',drone:mode==='drone'&&DR.on&&!DR.rt&&!DR.fall,droneNear:Math.hypot(DR.x-p.x,DR.z-p.z)<18,signal:DR.sig??1,playerNear:near,interacting,nearAllies,aliveAllies:living.length,convoyNear:!!convoy&&Math.hypot(convoy.x-p.x,convoy.z-p.z)<12,enemies:E.length};
 const r=objectiveStep(g,active.amount,s,dt);active.amount=r.amount;
 if(r.done){score+=100;emit('KOMUTA','Aşama tamamlandı. '+g.text,true,false);active.step++;enterGoal();}
 if(sim-lastPaint>.15){lastPaint=sim;paintObjective();if(opened)paintRoster();}
}
function finishMission(ok,text){if(!active||active.finished)return;finishing=true;try{root.endGame(ok,text||(ok?active.config.title+' tamamlandı.':'Görev tamamlanamadı.'));}finally{finishing=false;}}
function paintObjective(){if(!objectivePanel||!active)return;objectivePanel.hidden=!playing()||active.finished;if(objectivePanel.hidden)return;const g=active.config.goals[active.step],p=active.points[g.at];
 objectivePanel.querySelector('strong').textContent=active.config.title+' · '+(active.step+1)+'/'+active.config.goals.length;objectivePanel.querySelector('p').textContent=g.text;
 const percent=clamp(active.amount/(g.seconds||.5),0,1);objectivePanel.querySelector('progress').value=percent;
 objectivePanel.querySelector('small').textContent=Math.round(Math.hypot(P.x-p.x,P.z-p.z))+' oyun m · '+allies().length+' dost araç'+(g.seconds?' · '+Math.ceil(active.amount)+'/'+g.seconds+' sn':'')+(g.type==='escort'&&convoy?(convoy.waiting?' · İKMAL 1 bekliyor: telsizden Takip et de.':' · Konvoy yakındaysan ilerler.'):'');
 const b=objectivePanel.querySelector('button');b.hidden=g.type!=='interact';b.disabled=mode!=='tank'||Math.hypot(P.x-p.x,P.z-p.z)>=14;
}
function debrief(a,ok){const parent=doc.querySelector('#rep .c')||doc.getElementById('mp');if(!parent)return;doc.getElementById('hr-debrief')?.remove();const box=doc.createElement('div');box.className='hr-card';box.id='hr-debrief';const h=doc.createElement('h3');h.textContent=ok?'GÖREV TAMAMLANDI':'YENİDEN DENE';const p=doc.createElement('p');p.textContent=a.config.title+' · '+Math.round(a.elapsed)+' saniye · '+allies().length+'/'+a.initial+' dost araç döndü · '+history.length+' telsiz emri';const b=doc.createElement('button');b.type='button';b.textContent=ok?'Farklı göreve geç':'Bu görevi yeniden oyna';const idx=SCENARIOS.findIndex(c=>c.id===a.id);b.onclick=()=>start(ok?(idx+1)%SCENARIOS.length:idx);box.append(h,p,b);parent.appendChild(box);}
function start(index){if(!Number.isInteger(index)||!SCENARIOS[index])return false;close();safe(()=>root.HisarImmersive.stop(),null);doc.querySelector('#rep')?.classList.remove('on');root.setG(SCENARIOS[index].id);root.reset(typeof lvSel==='string'?lvSel:'normal');return !!active;}
function connect(){
 if(typeof MI!=='undefined')for(const c of SCENARIOS)MI[c.id]={n:c.title,t:c.goals[0].text,r:c.brief,w:c.title+' tamamlandı'};
 wrap('cmdApply',old=>function(who,c){const recipient=typeof who==='string'?who:who===0?'all':safe(()=>AL[who-1].cs,'missing');return issue(recipient,c);});
 wrap('cmdToggle',()=>toggle);wrap('cmdClose',old=>function(){close();return old.apply(this,arguments);});
 wrap('cmdKey',old=>function(n){if(opened&&ORDERS[n])return issue(selected,n);return old.apply(this,arguments);});
 wrap('initExtra',old=>function(){const prev=SV.form;try{if(preparing)SV.form=3;return old.apply(this,arguments);}finally{SV.form=prev;}});
 wrap('startMission',old=>function(){if(preparing){initMission(preparing);return;}return old.apply(this,arguments);});
 wrap('openMenu',old=>function(){close();interacting=false;if(objectivePanel)objectivePanel.hidden=true;return old.apply(this,arguments);});
 wrap('stagePending',old=>function(){return !!(active&&!active.finished)||old.apply(this,arguments);});
 wrap('reset',old=>function(){close();queue=[];history=[];feed=[];versions.clear();lastOrder.clear();sim=0;lastPaint=-1;cleanup();active=null;preparing=SCENARIOS.find(c=>c.id===mis)||null;try{return old.apply(this,arguments);}finally{preparing=null;paintFeed();}});
 wrap('endGame',old=>function(ok){if(active&&!active.finished&&ok&&!finishing)return false;const a=active&&!active.finished?active:null;const r=old.apply(this,arguments);if(a&&!playing()){a.finished=true;close();queue=[];interacting=false;safe(()=>root.HisarRadioSound.stop(),null);if(ok){const prior=record[a.id];record[a.id]={completed:true,best:Math.min(prior?.best||Infinity,Math.round(a.elapsed)),survivors:allies().length};write();}debrief(a,!!ok);paintObjective();}return r;});
 wrap('update',old=>function(dt){const running=playing()&&!doc.hidden;const r=old.apply(this,arguments);if(running&&playing()){dt=clamp(dt,0,.1);sim+=dt;pump();updateMission(dt);}return r;});
}
function el(tag,text){const n=doc.createElement(tag);if(text)n.textContent=text;return n;}
function installUI(){if(!doc.body||radioPanel)return;
 const entry=el('button','📻 TELSİZ');entry.id='hr-radio-entry';entry.type='button';entry.hidden=true;entry.onclick=toggle;doc.body.appendChild(entry);
 const style=el('style');style.id='hr-style';style.textContent=`
#hr-radio-entry{position:fixed;right:12px;top:120px;z-index:22;min-height:44px;background:#1c4539;color:white;border:1px solid #82b39c;border-radius:9px;font:700 13px system-ui;padding:8px 12px}#hr-radio-entry[hidden]{display:none!important}
.hr-card{background:#101d22;color:#eef5ef;border:1px solid #54766a;border-radius:14px;padding:14px;margin:12px 0;font:14px/1.45 system-ui;box-sizing:border-box;min-width:0}.hr-card h3{margin:0 0 10px}.hr-card p{margin:8px 0}.hr-card button,.hr-card select{min-height:44px;border:1px solid #648c7a;background:#203d35;color:#f6fff9;border-radius:8px;padding:8px 10px;font:inherit;max-width:100%;cursor:pointer}.hr-card button:focus-visible,.hr-card select:focus-visible{outline:3px solid #c6ffdc;outline-offset:2px}.hr-card button:disabled{opacity:.45;cursor:default}.hr-card [hidden],#hr-panel[hidden],#hr-objective[hidden]{display:none!important}
#hr-panel{position:fixed;z-index:65;left:12px;bottom:max(12px,env(safe-area-inset-bottom));width:min(420px,calc(100vw - 24px));max-height:calc(100dvh - 30px);overflow-y:auto;overscroll-behavior:contain;margin:0;box-shadow:0 10px 40px #000b}#hr-panel header{display:flex;justify-content:space-between;align-items:center;gap:8px}#hr-roster{width:100%}.hr-orders{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;margin:10px 0}.hr-orders button{text-align:left;font-size:12px}#hr-log{max-height:125px;overflow:auto;border-top:1px solid #47725a;margin-top:8px;font-size:12px}#hr-log b{color:#9cf6c9}#hr-panel small{display:block;font-size:11px;color:#b9d2c8}#hr-panel label{display:flex;align-items:flex-start;gap:8px;margin:10px 0;font-size:11px}#hr-panel input{flex:none;width:18px;height:18px}#hr-status{font-size:12px;color:#ffd99f}
#hr-missions select,#hr-missions>button{width:100%;margin-top:8px}#hr-missions .hr-tag{color:#9de5c5;letter-spacing:1px;font-size:11px}#hg-story{display:none!important}
#hr-objective{position:fixed;left:12px;top:max(96px,env(safe-area-inset-top));z-index:14;width:min(300px,calc(100vw - 24px));margin:0;padding:10px;pointer-events:none;font-size:12px}#hr-objective p{font-size:12px}#hr-objective small{display:block}#hr-objective progress{width:100%;height:6px;accent-color:#8df7bd}#hr-objective button{pointer-events:auto;touch-action:none;width:100%;margin-top:7px}body.hr-mission-active #hg-hud{display:none!important}
@media(max-width:600px){#hr-panel{font-size:13px}#hr-objective{top:126px;width:205px;font-size:11px}#hr-objective p{font-size:11px}}@media(max-height:470px){#hr-panel{max-height:calc(100dvh - 12px);bottom:6px;padding:9px}#hr-log{max-height:70px}#hr-objective{top:84px;width:210px;padding:7px}.hr-orders{grid-template-columns:repeat(3,minmax(0,1fr))}}`;
 doc.head.appendChild(style);
 radioPanel=el('section');radioPanel.id='hr-panel';radioPanel.className='hr-card';radioPanel.hidden=true;radioPanel.setAttribute('role','dialog');radioPanel.setAttribute('aria-label','Dost tank telsizi');const header=el('header'),title=el('h3','DOST TANK TELSİZİ'),exit=el('button','Kapat');exit.type='button';exit.onclick=close;header.append(title,exit);radioPanel.appendChild(header);
 roster=el('select');roster.id='hr-roster';roster.setAttribute('aria-label','Emir alacak dost araç');roster.onchange=()=>{selected=roster.value;};radioPanel.appendChild(roster);
 const cmds=el('div');cmds.className='hr-orders';for(const [key,value]of Object.entries(ORDERS)){const b=el('button',key+' · '+value.title);b.type='button';b.dataset.hrOrder=key;b.onclick=()=>issue(selected,+key);cmds.appendChild(b);}radioPanel.appendChild(cmds);
 micButton=el('button','Mikrofonla komut');micButton.type='button';micButton.id='hr-mic';micButton.onclick=listen;radioPanel.appendChild(micButton);
 const consent=el('label'),check=el('input');check.type='checkbox';check.id='hr-cloud-consent';consent.append(check,doc.createTextNode('Yerel tanıma yoksa sesimin tarayıcının çevrimiçi tanıma hizmetine gönderilmesine izin veriyorum.'));radioPanel.appendChild(consent);
 radioPanel.appendChild(el('small','Örnek: “Kaplan bir iki, beni takip et.” Mikrofon yalnız düğmeye bastığında açılır. Yanıtlar oyundaki yapay zekâ araçlarına aittir.'));
 radioStatus=el('p','T / Esc: kapat · 1–9: komut');radioStatus.id='hr-status';radioStatus.setAttribute('role','status');radioPanel.appendChild(radioStatus);
 log=el('div');log.id='hr-log';log.setAttribute('role','log');log.setAttribute('aria-live','polite');radioPanel.appendChild(log);radioPanel.addEventListener('pointerdown',e=>e.stopPropagation());doc.body.appendChild(radioPanel);
 objectivePanel=el('section');objectivePanel.id='hr-objective';objectivePanel.className='hr-card';objectivePanel.hidden=true;objectivePanel.append(el('strong'),el('p'),el('progress'),el('small'));objectivePanel.querySelector('progress').max=1;
 const interact=el('button','Basılı tut · ETKİLEŞ (X)');interact.type='button';interact.addEventListener('pointerdown',e=>{if(interact.disabled)return;e.preventDefault();interacting=true;safe(()=>interact.setPointerCapture(e.pointerId),null);});for(const type of ['pointerup','pointercancel','lostpointercapture'])interact.addEventListener(type,()=>{interacting=false;});objectivePanel.appendChild(interact);doc.body.appendChild(objectivePanel);
 const mp=doc.getElementById('mp');if(mp){missionsPanel=el('div');missionsPanel.id='hr-missions';missionsPanel.className='hr-card';missionsPanel.appendChild(el('h3','YENİ GÖREVLER · TANK BİRLİĞİ'));
 const select=el('select');select.setAttribute('aria-label','Yeni görev seç');SCENARIOS.forEach((s,i)=>{const o=el('option',(i+1)+'. '+s.title);o.value=i;select.appendChild(o);});const tag=el('p');tag.className='hr-tag';const brief=el('p'),startButton=el('button','Birlikle göreve başla');startButton.type='button';const refresh=()=>{const c=SCENARIOS[missionChoice];tag.textContent=c.tag;brief.textContent=c.brief;};select.onchange=()=>{missionChoice=+select.value;refresh();};startButton.onclick=()=>start(missionChoice);missionsPanel.append(select,tag,brief,startButton,el('small','Altı görev de açık. Komutlar gerçek oyunculara değil, oyundaki üç dost tanka gider. Eski kayıtların korunur.'));(doc.getElementById('tg')||mp).prepend(missionsPanel);refresh();}
 root.addEventListener('keydown',e=>{if(/input|textarea|select/i.test(e.target?.tagName||''))return;if(e.code==='KeyX'&&playing()&&mode==='tank'&&active&&!active.finished&&active.config.goals[active.step]?.type==='interact'){interacting=true;e.preventDefault();e.stopImmediatePropagation();}},true);
 root.addEventListener('keyup',e=>{if(e.code==='KeyX')interacting=false;},true);
}
function leave(){close();interacting=false;queue=[];safe(()=>root.HisarRadioSound.stop(),null);}
root.HisarOperations=Object.freeze({version:VERSION,core,issue,parse,start,toggle,close,listen,connect,diagnostics:()=>({version:VERSION,hooks:{...hooks},queued:queue.length,feed:feed.map(m=>({...m})),orders:history.map(h=>({...h})),microphone:!!microphone,selected,allies:allies().map(a=>({cs:a.cs,cmd:a.cmd,fire:a.fire,x:a.x,z:a.z})),mission:active?{id:active.id,step:active.step,amount:active.amount,elapsed:active.elapsed,finished:active.finished,goal:active.config.goals[active.step]||null,points:active.points}:null,convoy:convoy?{x:convoy.x,z:convoy.z,waiting:convoy.waiting,path:convoy.path.length}:null})});
installUI();connect();if(typeof FRAME_HOOKS!=='undefined')FRAME_HOOKS.push(()=>{const b=doc.getElementById('hr-radio-entry');if(b)b.hidden=!playing()||!allies().length;if(objectivePanel&&!playing())objectivePanel.hidden=true;});doc.addEventListener('hisar:ui-ready',()=>{installUI();connect();});root.addEventListener('blur',leave);root.addEventListener('pagehide',leave);doc.addEventListener('visibilitychange',()=>{if(doc.hidden)leave();});
})(typeof window!=='undefined'?window:globalThis);
