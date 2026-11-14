/* ÇELİK BÖRÜ telsiz 2.0: dost tanklara on emir (düğme, klavye ve isteğe bağlı mikrofon) ve yanıtları.
 * Oyundaki mevcut dost tankları ve sesleri kullanır. Görevler bu sürümde kaldırıldı; oyun düzeni experience/battle.js içindedir.
 */
(function(root){
'use strict';
const VERSION='2.0.0';
const safe=(fn,d)=>{try{return fn();}catch{return d;}}, clamp=(v,a,b)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:a));
const clean=t=>typeof t==='string'?t.slice(0,160).toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i').replace(/[^a-z0-9\s-]/g,' ').replace(/\s+/g,' ').trim():'';
const ORDERS=Object.freeze({
 1:{title:'Beni takip et',reply:'Sizi takip ediyorum.'},2:{title:'Burada bekle',reply:'Burada bekliyorum.'},
 3:{title:'İşaretli oyun hedefi',reply:'İşaretli oyun hedefine yöneliyorum.'},4:{title:'Oyunda ateş serbest',reply:'Anlaşıldı.'},
 5:{title:'Ateşi kes',reply:'Ateşi kestim.'},6:{title:'Aralık aç',reply:'Aralık açıyorum.'},
 7:{title:'Geri gel',reply:'Geri geliyorum.'},8:{title:'Durum bildir',reply:''},9:{title:'Yanımda toplan',reply:'Yanınızda toplanıyorum.'},
 10:{title:'Mevzilen',reply:'Mevziye giriyorum.'}
});
// Her araca en yakın boş mevziyi verir; aynı mevzi iki araca verilmez. keepOut içindeki (oyuncunun durduğu) mevziler atlanır.
function assignPositions(list,positions,keepOut){const free=(positions||[]).filter(p=>!keepOut||Math.hypot(p.x-keepOut.x,p.z-keepOut.z)>=(keepOut.r||10)),out=new Map();
 for(const u of list||[]){let best=-1,bd=Infinity;for(let i=0;i<free.length;i++){const d=Math.hypot(free[i].x-u.x,free[i].z-u.z);if(d<bd){bd=d;best=i;}}if(best<0)break;out.set(u,free.splice(best,1)[0]);}
 return out;}
function parse(text,selected='all'){
 const s=clean(text);if(!s||(/\b(yapma|etme|durma|bekleme|takip etme)\b/.test(s)&&!s.includes('ates etme')))return null;
 const t=s.replace(/\bbir\b/g,'1').replace(/\biki\b/g,'2').replace(/\buc\b/g,'3').replace(/\bdort\b/g,'4');
 let recipient=selected, explicit=t.match(/\b(?:kaplan\s*)?1\s*-?\s*([234])\b/);
 if(/\b(tum birlik|butun birlik|herkes|tum tanklar)\b/.test(s))recipient='all';else if(explicit)recipient='KAPLAN 1-'+explicit[1];
 const tests=[[5,/\b(atesi kes|ates kes|ates etme)\b/],[8,/\b(durum bildir|durumunuz|durum raporu|ses kontrol|duyuyor musun)\b/],[9,/\b(toplan|yanima gel|yanimda toplan)\b/],[1,/\b(takip et|takip edin|pesimden gel|beni izle)\b/],[10,/\b(mevzilen|mevzilenin|mevziye gir|mevziye girin|mevzi al|mevzi alin)\b/],[2,/\b(bekle|bekleyin|dur|durun)\b/],[7,/\b(geri gel|geri don|geri cekil)\b/],[6,/\b(aralik ac|dagil)\b/],[4,/\b(ates serbest)\b/],[3,/\b(isaretli hedef|hedefe ates)\b/]];
 const match=tests.find(([,r])=>r.test(s));return match?{recipient,code:match[0]}:null;
}
function applyOrder(unit,code,target){
 if(!unit||unit.dead||unit.hp<=0)return {ok:false,reason:'unavailable'};
 if(!ORDERS[code])return {ok:false,reason:'unknown'};
 if(code===3&&!target)return {ok:false,reason:'no-target'};
 if(code===10&&!target)return {ok:false,reason:'no-position'};
 if(code===1||code===9){unit.cmd='follow';unit.tgt=null;}
 // Mevzideki tanka "burada bekle" denirse mevzide kalır.
 if(code===2){unit.cmd='hold';if(!(unit.hold&&unit.hold.position&&unit.hold.in))unit.hold={x:unit.x,z:unit.z};unit.tgt=null;}
 if(code===3){unit.cmd='attack';unit.tgt=target;unit.fire=1;}
 if(code===4)unit.fire=1;
 // The legacy AI can fire in attack mode even with fire=0, so clear that mode too.
 if(code===5){unit.fire=0;unit.tgt=null;if(unit.cmd==='attack'){unit.cmd='hold';unit.hold={x:unit.x,z:unit.z};}}
 if(code===6){unit.cmd='disperse';unit.tgt=null;}
 if(code===7){unit.cmd='retreat';unit.fire=0;unit.tgt=null;}
 // Mevziye arkadaki açık taraftan girilir: ilk hedef giriş noktasıdır; dolanma, içeri girme ve "mevzideyim" (hold.in) experience/field.js içinde yürür.
 if(code===10){const h=target.h||0;unit.cmd='hold';unit.hold={x:target.x-Math.sin(h)*9.5,z:target.z-Math.cos(h)*9.5,h,position:true,stage:1,cx:target.x,cz:target.z};unit.tgt=null;}
 return {ok:true};
}
function reply(unit,code){
 if(code===8){const h=Math.round(clamp(unit.hp/(unit.mx||100),0,1)*100);return 'Komutanım, '+({follow:'takipteyim',hold:unit.hold&&unit.hold.position?(unit.hold.in?'mevzideyim':'mevziye gidiyorum'):'bekliyorum',attack:'oyun hedefindeyim',disperse:'aralık açıyorum',retreat:'geri geliyorum'}[unit.cmd]||'hazırım')+'. Araç durumu yüzde '+h+'.';}
 return 'Emredersiniz komutanım. '+ORDERS[code].reply;
}
// Sessiz ekran: görünüm adı yazıları basılmaz (düğme zaten hangi görünüşte olduğunu gösterir). Savaş sırasında "vardınız" ve
// "rota yeniden hesaplanıyor" yazıları da basılmaz; dönüş uyarısı yalnız sesli verilir. Eğitimde hepsi görünür.
const VIEW_NOTE=/^(DIŞ GÖRÜŞ|NİŞANGÂH|KABİN ·|KABİN İÇİ|SÜRÜCÜ MAHALLİ|TANK kontrolü|UÇANGÖZ kontrolü)/;
function quietSay(text,st){const t=String(text||'');if(!st||st.tutorial)return false;return VIEW_NOTE.test(t)||(!!st.mission&&(/^📍 VARDINIZ/.test(t)||(!!st.goal&&t===st.goal)));}
function quietRadio(text,st){const t=String(text||'');if(!st||st.tutorial||!st.mission||!/^Navigasyon:/.test(t))return '';
 if(/metre sonra/.test(t))return 'voice';return /noktasına ulaştınız|Rota yeniden/.test(t)?'drop':'';}
const core=Object.freeze({VERSION,clean,parse,ORDERS,applyOrder,assignPositions,reply,quietSay,quietRadio});
if(typeof module==='object'&&module.exports)module.exports=core;
const doc=root.document;if(!doc||root.HisarOperations)return;
let sim=0,queue=[],feed=[],history=[],selected='all',lastOrder=new Map(),versions=new Map(),serial=0,opened=false,microphone=null,micTimer=null,micEpoch=0;
let radioPanel,roster,log,radioStatus,micButton,returnFocus;
const hooks={};
const playing=()=>safe(()=>game==='play',false);
const allies=()=>safe(()=>AL.filter(a=>a&&!a.dead&&a.hp>0),[]);
const units=()=>allies();
function emit(who,text,voice=true,fallback=true){
 const message=who+': '+text;feed.push({who,text,at:sim});if(feed.length>12)feed.shift();
 const prior=safe(()=>SV.voice,undefined);try{if(typeof SV!=='undefined')SV.voice=0;safe(()=>root.radio(message),null);safe(()=>{radT=Math.min(radT,3);},null);}finally{if(typeof SV!=='undefined'){if(prior===undefined)delete SV.voice;else SV.voice=prior;}}
 const enabled=voice&&playing()&&!doc.hidden&&safe(()=>SV.voice!==0&&SV.radioV!==0,true)&&safe(()=>root.HisarImmersive.getSettings().radioVoice,true);
 if(enabled&&!safe(()=>root.HisarImmersive.speak(message),false)&&fallback)safe(()=>root.HisarRadioSound.play(),null);
 paintFeed();
}
function warn(text){if(radioStatus)radioStatus.textContent=text;safe(()=>root.say(text,2),null);}
function issue(recipient,code){
 if(!playing()||doc.hidden)return {ok:false,reason:'paused'};
 code=Number(code);if(!ORDERS[code])return {ok:false,reason:'unknown'};
 const available=units(),chosen=recipient==='all'?available:available.filter(u=>u.cs===recipient);
 if(!chosen.length){warn('Seçilen dost araç yok. Birlik menüsünden Kısım veya Takım seçebilirsin.');return {ok:false,reason:'unavailable'};}
 const token=recipient+'|'+code;if(sim-(lastOrder.get(token)??-99)<.6)return {ok:false,reason:'duplicate'};
 const target=code===3?safe(()=>root.designate(),null):null;
 if(code===3&&!target){warn('İşaretli oyun hedefi bulunamadı.');return {ok:false,reason:'no-target'};}
 const spots=code===10?assignPositions(chosen,safe(()=>root.HisarField.positions(),[]),safe(()=>({x:P.x,z:P.z,r:10}),null)):null;
 if(code===10&&!spots.size){warn('Boş mevzi yok.');return {ok:false,reason:'no-position'};}
 let accepted=[];for(const u of chosen){const result=applyOrder(u,code,code===10?spots.get(u):target);if(result.ok)accepted.push(u);}
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
const quietState=()=>({tutorial:safe(()=>!!TUT.on,false),mission:safe(()=>game==='play'&&mis!=='egitim',false),goal:''});
function connect(){
 wrap('cmdApply',old=>function(who,c){const recipient=typeof who==='string'?who:who===0?'all':safe(()=>AL[who-1].cs,'missing');return issue(recipient,c);});
 wrap('cmdToggle',()=>toggle);wrap('cmdClose',old=>function(){close();return old.apply(this,arguments);});
 wrap('cmdKey',old=>function(n){if(opened&&ORDERS[n])return issue(selected,n);return old.apply(this,arguments);});
 wrap('say',old=>function(t){if(quietSay(t,quietState()))return;return old.apply(this,arguments);});
 wrap('radio',old=>function(t){const q=quietRadio(t,quietState());if(q==='drop')return;if(q==='voice'){safe(()=>{if(SV.radioV!==0)root.CREW.radio(String(t).replace(/^Navigasyon:\s*/,''));},null);return;}return old.apply(this,arguments);});
 wrap('openMenu',old=>function(){close();return old.apply(this,arguments);});
 wrap('reset',old=>function(){close();queue=[];history=[];feed=[];versions.clear();lastOrder.clear();sim=0;try{return old.apply(this,arguments);}finally{paintFeed();}});
 wrap('endGame',old=>function(){const r=old.apply(this,arguments);if(!playing()){close();queue=[];safe(()=>root.HisarRadioSound.stop(),null);}return r;});
 wrap('update',old=>function(dt){const running=playing()&&!doc.hidden;const r=old.apply(this,arguments);if(running&&playing()){dt=clamp(dt,0,.1);sim+=dt;pump();if(opened&&((sim*4|0)!==((sim-dt)*4|0)))paintRoster();}return r;});
}
function el(tag,text){const n=doc.createElement(tag);if(text)n.textContent=text;return n;}
function installUI(){if(!doc.body||radioPanel)return;const mpEl=doc.getElementById('mp');if(mpEl&&!doc.getElementById('mpBody')){const body=el('div');body.id='mpBody';for(const ch of [...mpEl.children])if(!ch.classList.contains('acts'))body.appendChild(ch);mpEl.insertBefore(body,mpEl.firstChild);}
 const entry=el('button','TELSİZ');entry.id='hr-radio-entry';entry.type='button';entry.hidden=true;entry.onclick=toggle;doc.body.appendChild(entry);
 const style=el('style');style.id='hr-style';style.textContent=`
#hr-radio-entry{position:fixed;right:12px;top:120px;z-index:22;min-height:44px;display:flex;align-items:center;gap:7px;background:rgba(38,50,24,.92);color:#fff;border:1.5px solid rgba(178,212,110,.6);border-radius:7px;font:800 15px/1 var(--sf,system-ui);letter-spacing:.06em;padding:8px 11px;box-shadow:0 3px 10px rgba(0,0,0,.4)}#hr-radio-entry::before{content:"";width:17px;height:20px;flex:none;background:currentColor;-webkit-mask:var(--ic-radio) center/contain no-repeat;mask:var(--ic-radio) center/contain no-repeat}#hr-radio-entry[hidden]{display:none!important}
.hr-card{background:var(--komur-cam,#1a1c18);color:var(--kemik,#f3f5ec);border:1px solid var(--cizgi,#4a4f43);border-radius:4px;padding:12px;margin:12px 0;font:600 15px/1.35 var(--sf,system-ui);box-sizing:border-box;min-width:0;box-shadow:0 6px 18px rgba(0,0,0,.45)}.hr-card h3{margin:0 0 10px;font:800 18px/1 var(--sf,system-ui);letter-spacing:.07em;text-transform:uppercase;color:#fff}.hr-card p{margin:8px 0}.hr-card button,.hr-card select{min-height:44px;border:1px solid var(--cizgi,#4a4f43);background:var(--zirh,#2b2e28);color:#fff;border-radius:3px;padding:8px 10px;font:700 15px/1.1 var(--sf,system-ui);letter-spacing:.02em;max-width:100%;cursor:pointer}.hr-card button:focus-visible,.hr-card select:focus-visible{outline:3px solid var(--sari,#f3c20f);outline-offset:2px}.hr-card button:disabled{opacity:.45;cursor:default}.hr-card [hidden],#hr-panel[hidden]{display:none!important}
#hr-panel{position:fixed;z-index:65;left:12px;bottom:max(12px,env(safe-area-inset-bottom));width:min(420px,calc(100vw - 24px));max-height:calc(100dvh - 30px);overflow-y:auto;overscroll-behavior:contain;margin:0;padding:0 12px 12px;box-shadow:0 10px 40px #000b}#hr-panel header{display:flex;justify-content:space-between;align-items:center;gap:8px;margin:0 -12px 10px;padding:8px 8px 8px 12px;background:#12140f;border-bottom:1px solid var(--cizgi,#4a4f43)}#hr-panel header h3{margin:0}#hr-panel header button{min-height:38px;text-transform:uppercase;letter-spacing:.06em;font-weight:800}#hr-roster{width:100%}.hr-orders{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;margin:10px 0}.hr-orders button{text-align:left;font-size:14.5px}.hr-orders button:active{background:var(--zeytin,#5b7332)}#hr-mic{background:linear-gradient(180deg,var(--yesil,#84c63c),var(--yesil2,#5a9a20));border:0;text-transform:uppercase;letter-spacing:.06em;font-weight:800;box-shadow:inset 0 -3px 0 rgba(30,70,0,.45)}#hr-log{max-height:125px;overflow:auto;border-top:1px solid var(--cizgi,#4a4f43);margin-top:8px;font-size:13.5px}#hr-log b{color:var(--yesil,#84c63c)}#hr-panel small{display:block;font-size:12.5px;color:var(--kemik2,#bdc3b2)}#hr-panel label{display:flex;align-items:flex-start;gap:8px;margin:10px 0;font-size:12.5px}#hr-panel input{flex:none;width:24px;height:24px;accent-color:var(--yesil,#84c63c)}#hr-status{font-size:13.5px;color:var(--sari,#f3c20f)}
@media(max-height:470px){#hr-panel{max-height:calc(100dvh - 12px);bottom:6px;padding:0 9px 9px}#hr-panel header{margin:0 -9px 8px}#hr-log{max-height:70px}.hr-orders{grid-template-columns:repeat(3,minmax(0,1fr))}}`;
 doc.head.appendChild(style);
 radioPanel=el('section');radioPanel.id='hr-panel';radioPanel.className='hr-card';radioPanel.hidden=true;radioPanel.setAttribute('role','dialog');radioPanel.setAttribute('aria-label','Dost tank telsizi');const header=el('header'),title=el('h3','DOST TANK TELSİZİ'),exit=el('button','Kapat');exit.type='button';exit.onclick=close;header.append(title,exit);radioPanel.appendChild(header);
 roster=el('select');roster.id='hr-roster';roster.setAttribute('aria-label','Emir alacak dost araç');roster.onchange=()=>{selected=roster.value;};radioPanel.appendChild(roster);
 const cmds=el('div');cmds.className='hr-orders';for(const [key,value]of Object.entries(ORDERS)){const b=el('button',key+' · '+value.title);b.type='button';b.dataset.hrOrder=key;b.onclick=()=>issue(selected,+key);cmds.appendChild(b);}radioPanel.appendChild(cmds);
 micButton=el('button','Mikrofonla komut');micButton.type='button';micButton.id='hr-mic';micButton.onclick=listen;radioPanel.appendChild(micButton);
 const consent=el('label'),check=el('input');check.type='checkbox';check.id='hr-cloud-consent';consent.append(check,doc.createTextNode('Yerel tanıma yoksa sesimin tarayıcının çevrimiçi tanıma hizmetine gönderilmesine izin veriyorum.'));radioPanel.appendChild(consent);
 radioPanel.appendChild(el('small','Örnek: “Kaplan bir iki, beni takip et.” Mikrofon yalnız düğmeye bastığında açılır. Yanıtlar oyundaki yapay zekâ araçlarına aittir.'));
 radioStatus=el('p','T / Esc: kapat · 1–9: komut');radioStatus.id='hr-status';radioStatus.setAttribute('role','status');radioPanel.appendChild(radioStatus);
 log=el('div');log.id='hr-log';log.setAttribute('role','log');log.setAttribute('aria-live','polite');radioPanel.appendChild(log);radioPanel.addEventListener('pointerdown',e=>e.stopPropagation());doc.body.appendChild(radioPanel);
 // Bildirimler dokununca kapanır.
 for(const id of ['radio','msg','hg-notice','coach']){const box=doc.getElementById(id);if(box&&!box.dataset.hrTap){box.dataset.hrTap='1';box.addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();box.style.opacity='0';box.classList.remove('on','pop');if(id==='radio')safe(()=>{radT=0;},null);if(id==='msg')safe(()=>{msgT=0;},null);if(id==='hg-notice')box.hidden=true;});}}
}
function leave(){close();queue=[];safe(()=>root.HisarRadioSound.stop(),null);}
root.HisarOperations=Object.freeze({version:VERSION,core,issue,parse,toggle,close,listen,connect,diagnostics:()=>({version:VERSION,hooks:{...hooks},queued:queue.length,feed:feed.map(m=>({...m})),orders:history.map(h=>({...h})),microphone:!!microphone,selected,allies:allies().map(a=>({cs:a.cs,cmd:a.cmd,fire:a.fire,x:a.x,z:a.z}))})});
connect();installUI();if(typeof FRAME_HOOKS!=='undefined')FRAME_HOOKS.push(()=>{const rb=doc.getElementById('radio');if(rb)rb.style.pointerEvents=+rb.style.opacity>0?'auto':'none';const b=doc.getElementById('hr-radio-entry');if(b)b.hidden=!playing()||!allies().length;});doc.addEventListener('hisar:ui-ready',()=>{connect();installUI();});root.addEventListener('blur',leave);root.addEventListener('pagehide',leave);doc.addEventListener('visibilitychange',()=>{if(doc.hidden)leave();});
})(typeof window!=='undefined'?window:globalThis);
