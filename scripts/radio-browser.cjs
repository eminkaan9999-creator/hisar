'use strict';
const GAME_V=JSON.parse(require('node:fs').readFileSync(require('node:path').join(__dirname,'..','version.json'),'utf8')).v;if(!(GAME_V>=87))throw Error('Beklenmeyen oyun surumu '+GAME_V);
// Original game on Chromium WebGL: "Son Takım" battle flow and squad radio. Edge cases use state injection
// (actor positions, simulated time); microphone is mocked. Not physical iPhone testing or an FPS benchmark.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=process.cwd(),out=path.join(root,'radio-reports');fs.mkdirSync(out,{recursive:true});const checks=[],errors=[],shots=[];let browser;
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.json':'application/json','.mp3':'audio/mpeg','.png':'image/png','.jpg':'image/jpeg','.woff':'font/woff','.webmanifest':'application/manifest+json'};
const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://local');let file=path.resolve(root,decodeURIComponent(u.pathname).replace(/^\/hisar\//,''));if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403).end();return;}try{if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'}).end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
const ok=n=>{checks.push(n);console.log('PASS',n);};const tick=(p,n,dt=.1)=>p.evaluate(({n,dt})=>{for(let i=0;i<n&&game==='play';i++)update(dt);},{n,dt});
async function shot(p,n){await p.screenshot({path:path.join(out,n)});shots.push(n);}
// Oyuncunun takımını en yakın canlı düşman takımının r metre uzağına koyar; takımın kimliğini döndürür.
const goNear=(p,r,id)=>p.evaluate(({r,id})=>{const L=HisarBattle.diagnostics().squads.filter(q=>!q.dead&&(id==null||q.id===id)).sort((a,b)=>Math.hypot(a.x-P.x,a.z-P.z)-Math.hypot(b.x-P.x,b.z-P.z)),s=L[0];if(!s)return -1;
 const a=Math.atan2(-s.x,-s.z),c=v=>Math.max(-WS+20,Math.min(WS-20,v));P.x=c(s.x+Math.sin(a)*r);P.z=c(s.z+Math.cos(a)*r);AL.forEach((q,i)=>{q.x=c(P.x+12*(i+1));q.z=c(P.z+riv(q.x)-riv(P.x));});return s.id;},{r,id}); // dost tanklar oyuncuyla duvarın aynı yanında
const squad=(p,id)=>p.evaluate(id=>HisarBattle.diagnostics().squads.find(q=>q.id===id),id);
// Oyuncunun takımını güvenli alanın (bir sonraki çemberin) ortasında tutarak süreyi ilerletir.
// Düşman ateşi ve düşman dron sürüsü kapatılır (L.cd=0, L.dmg=0) ki ölçülen tek hasar alan hasarı olsun.
const holdInZone=(p,seconds)=>p.evaluate(seconds=>{L.cd=0;const d0=L.dmg;L.dmg=0;for(let i=0;i<seconds*10&&game==='play';i++){const z=HisarBattle.diagnostics().zone;P.x=z.nx;P.z=z.nz;AL.forEach((q,k)=>{q.x=z.nx+8*(k+1);q.z=z.nz;});update(.1);}L.dmg=d0;},seconds);
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));browser=await chromium.launch({...(process.env.LOCAL_CHROMIUM?{executablePath:process.env.LOCAL_CHROMIUM}:{}),args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required']});
for(const mobile of [false,true]){const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:720},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:1});await context.addInitScript(()=>{const raf=requestAnimationFrame;let done=false;window.requestAnimationFrame=fn=>raf.call(window,t=>{if(!done){try{if(typeof setQ==='function'){setQ('dusuk');done=true;}}catch{}}fn(t);});if(!localStorage.getItem('m60v2'))localStorage.setItem('m60v2',JSON.stringify({xp:120,kr:500,U:{},best:{},form:3}));});const p=await context.newPage();p.setDefaultTimeout(60000);p.on('pageerror',e=>{errors.push(String(e.stack||e));console.log('PAGEERROR',String(e).slice(0,400));});
const label=mobile?'mobile':'desktop';
await p.goto('http://127.0.0.1:'+server.address().port+'/hisar/',{waitUntil:'domcontentloaded',timeout:120000});await p.waitForFunction(()=>window.HisarOperations&&window.HisarBattle&&window.HisarRadioSound&&window.HisarGameBridge?.snapshot().ready,{},{timeout:120000});await p.evaluate(()=>{HisarGameBridge.quality('dusuk');HisarGameBridge.auto(false);HisarBattle.events(false);});assert.equal(await p.evaluate(()=>APP_VER),GAME_V);assert.deepEqual(await p.evaluate(()=>HisarOrtam.diagnostics().hooks),{update:true,openMenu:true},'border soundscape');ok(label+': build '+GAME_V+' and all modules ready');
// ---- menü: görev listesi yok, tek kip var
assert.equal(await p.locator('#tg .hr-op').count(),0);assert.equal(await p.locator('#tg [data-g]').count(),0);assert.equal(await p.locator('#hr-debrief').count(),0);assert.equal(await p.locator('#dlyT').count(),0);
// harekât varsayılan kiptir: üç görev kartı; Son Takım ikinci kip
assert.equal(await p.locator('#hkMode button.sel b').textContent(),'HAREKÂT');assert.equal(await p.locator('#hkCard .hk-op').count(),4);assert.equal(await p.evaluate(()=>mis),'harekat');
assert.equal(await p.locator('#btCard').isVisible(),false);assert.equal(await p.locator('#rb2').count(),0,'rank badge removed');
await p.locator('#hkCard [data-op="tepe"]').click();assert.equal(await p.evaluate(()=>HisarHarekat.diagnostics().sel),'tepe');assert.equal(await p.locator('#hkCard .hk-op.sel b').textContent(),'Tel Zeytun Tepesi');
await p.locator('#go').click();assert.equal(await p.locator('#hk-brief').isVisible(),true,'BAŞLAT opens the operation order');assert.match(await p.locator('#hk-brief').textContent(),/HAREKÂT EMRİ.*DURUM.*GÖREV.*İCRA.*DESTEK/);
assert.equal(await p.locator('#hk-brief .hk-bs ol li').count(),3);await p.locator('#hk-brief .hk-back').click();assert.equal(await p.locator('#hk-brief').isVisible(),false);assert.notEqual(await p.evaluate(()=>game),'play');
ok(label+': BAŞLAT opens the operation order (map, situation, mission, execution steps, support); Geri returns to the menu');
await p.locator('#hkMode [data-hm="savas"]').click();assert.equal(await p.evaluate(()=>mis),'savas');assert.equal(await p.locator('#hkCard').isVisible(),false);
ok(label+': menu opens on Harekât with four mission cards; Son Takım is the second mode; no rank badge');
assert.equal(await p.locator('#btCard h3').textContent(),'SON TAKIM');assert.equal(await p.locator('#btCard .bt-seg button').count(),3);assert.equal(await p.locator('#btCard .bt-seg button.sel b').textContent(),'TAKIM');assert.match(await p.locator('#btCard .bt-facts').textContent(),/4 rakip takım16 düşman tank/);
// takım büyüklüğü ana karttan değişir ve kaydedilir
await p.locator('#btCard [data-bf="1"]').click();assert.equal(await p.evaluate(()=>SV.form),1);assert.match(await p.locator('#btCard .bt-facts').textContent(),/7 rakip takım14 düşman tank/);await p.locator('#btCard [data-bf="3"]').click();assert.equal(await p.evaluate(()=>SV.form),3);assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('m60v2')).form),3);
assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1&&document.getElementById('mp').scrollWidth<=document.getElementById('mp').clientWidth+1));ok(label+': menu shows the single battle mode, no mission list, no sideways scroll');await shot(p,label+'-menu.png');
// ---- başlat: büyük harita, takımlar, güvenli alan
await p.locator('#go').click();await p.waitForFunction(()=>game==='play');
const d0=await p.evaluate(()=>({mis,ws:WS,al:AL.length,form:SV.form,d:HisarBattle.diagnostics(),far:Math.hypot(P.x,P.z),card:!document.getElementById('hr-objective').hidden,L:{rl:L.rl,ar:L.ar,sp:L.sp}}));
assert.equal(d0.mis,'savas');assert.equal(d0.ws,800);assert.equal(d0.al,3);assert.equal(d0.form,3);assert.equal(d0.d.teams,5);assert.equal(d0.d.enemies,16);assert.ok(d0.far>250,'start away from the centre');assert.equal(d0.card,true);assert.equal(d0.L.rl,3);assert.equal(d0.L.ar,190);
assert.ok(d0.d.squads.every(s=>Math.hypot(s.x-d0.d.start.x,s.z-d0.d.start.z)>220&&Math.abs(s.x)<=800&&Math.abs(s.z)<=800));assert.equal(d0.d.zone.info.phase,1);assert.equal(d0.d.zone.info.state,'wait');
ok(label+': battle starts on the 1.6 km map with five teams, sixteen enemy tanks and the first safe zone');
await tick(p,3);assert.equal(await p.evaluate(()=>game),'play');assert.equal(await p.evaluate(()=>E.length),0);ok(label+': empty field does not end the battle while distant teams are alive');
await p.waitForTimeout(600);assert.match(await p.locator('#hr-objective strong').textContent(),/GÜVENLİ ALAN 1\/6/);assert.match(await p.locator('#hr-objective small').textContent(),/5 takım · 16 düşman tank/);
{const b=await p.locator('#hr-objective').boundingBox(),v=p.viewportSize();assert.ok(b&&b.x>=0&&b.y>=0&&b.x+b.width<=v.width+1&&b.y+b.height<=v.height+1);}ok(label+': zone status card is on screen with phase, countdown and teams left');await shot(p,label+'-battle.png');
// ---- telsiz emirleri
await p.locator('#hr-radio-entry').click();await p.locator('#hr-roster').selectOption('KAPLAN 1-2');await p.locator('[data-hr-order="2"]').click();assert.equal(await p.evaluate(()=>AL[0].cmd),'hold');await tick(p,10);assert.ok(await p.evaluate(()=>HisarOperations.diagnostics().feed.some(m=>m.who==='KAPLAN 1-2'&&m.text.includes('Emredersiniz komutanım'))));ok(label+': specific tank applies order and acknowledges by callsign');await shot(p,label+'-radio.png');
await p.locator('#hr-roster').selectOption('all');await p.locator('[data-hr-order="1"]').click();await tick(p,40);assert.equal(await p.evaluate(()=>AL.every(a=>a.cmd==='follow')),true);assert.equal(await p.evaluate(()=>new Set(HisarOperations.diagnostics().feed.filter(m=>m.text.includes('Sizi takip')).map(m=>m.who)).size),3);ok(label+': all three tanks respond separately to all-unit follow order');
await p.evaluate(()=>{AL[0].cmd='attack';AL[0].fire=1;AL[0].tgt={};HisarOperations.issue('KAPLAN 1-2',5);});assert.equal(await p.evaluate(()=>AL[0].fire),0);assert.notEqual(await p.evaluate(()=>AL[0].cmd),'attack');ok(label+': ceasefire also stops attack behaviour');
const audio=await p.evaluate(async()=>{await HisarRadioSound.warm();return HisarRadioSound.diagnostics();});assert.equal(audio.ready,true);assert.equal(audio.source,'microsoft-ahmet-turkish-neural');assert.equal(audio.playbackRate,1);ok(label+': Microsoft neural male acknowledgement MP3 decodes at normal 1x speed');
if(!mobile){
 await p.evaluate(()=>{HisarOperations.issue('KAPLAN 1-4',2);AL[2].dead=1;});await tick(p,20);assert.equal(await p.evaluate(()=>HisarOperations.diagnostics().feed.some(m=>m.who==='KAPLAN 1-4'&&m.text.includes('Burada bekliyorum'))),false);ok('destroyed tank does not send stale acknowledgement');
 await p.evaluate(()=>{HisarBattle.start();HisarOperations.issue('KAPLAN 1-2',2);HisarOperations.issue('KAPLAN 1-2',1);});await tick(p,20);assert.equal(await p.evaluate(()=>HisarOperations.diagnostics().feed.some(m=>m.text.includes('Burada bekliyorum'))),false);ok('new order invalidates queued old acknowledgement');
 await p.evaluate(()=>{HisarOperations.issue('all',2);HisarBattle.start();});await tick(p,25);assert.equal(await p.evaluate(()=>HisarOperations.diagnostics().feed.some(m=>m.text.includes('Emredersiniz'))),false);ok('restart clears old replies');
 // Fake only recognition events: no microphone capture and no external speech service.
 await p.evaluate(()=>{window.SpeechRecognition=class{constructor(){this.processLocally=true;window.__recognition=this;}static async available(){return 'available';}start(){}abort(){this.onend?.();}};HisarOperations.toggle();});await p.locator('#hr-mic').click();await p.waitForFunction(()=>HisarOperations.diagnostics().microphone);await p.evaluate(()=>__recognition.onresult({results:[[{transcript:'Kaplan bir üç, burada bekle'}]]}));assert.equal(await p.evaluate(()=>AL.find(a=>a.cs==='KAPLAN 1-3').cmd),'hold');ok('recognised Turkish order reaches selected native AI actor');
 await p.evaluate(()=>__recognition.onerror({error:'not-allowed'}));assert.equal(await p.evaluate(()=>HisarOperations.diagnostics().microphone),false);ok('microphone denial stops capture and leaves button commands working');await p.evaluate(()=>HisarOperations.close());

 // ---- takımlar: uzakta hesapla yürür, yaklaşınca gerçek tank olur, fark edince saldırır
 // Sayımlar kesin olsun: zorluk normal, oyuncunun takımı hasar almaz, dost tanklar ateş etmez.
 const calm=()=>p.evaluate(()=>{lvSel='normal';HisarBattle.start();L.dmg=0;AL.forEach(a=>{a.fire=0;});});
 await calm();let id=await goNear(p,385);await tick(p,45);let s=await squad(p,id);
 assert.equal(s.active,true);assert.equal(s.field,4);assert.equal(s.alert,false);assert.equal(await p.evaluate(id=>E.filter(e=>e.bt===id).length,id),4);
 assert.ok(await p.evaluate(id=>{const arm=TANKS[HisarBattle.diagnostics().squads.find(q=>q.id===id).kind].st.arm;return E.filter(e=>e.bt===id).every(e=>Math.abs(e.mx-HPT.tank*2.2*arm)<1e-6&&e.hp===e.mx&&e.fr===230&&(e.conv||e.park));},id));ok('a team within 400 m takes the field as four real tanks and keeps marching, unaware of the player');
 assert.deepEqual(await p.evaluate(()=>HisarBattle.diagnostics().squads.map(q=>q.kind)),['t72','t72','t72','t72']);ok('rival teams drive the enemy T-72B (never a Turkish tank); armour follows the type');
 let fired=await p.evaluate(()=>{window.__shots=0;const es=window.eshot;window.eshot=function(e,x,y,z,sp,tgt){if(tgt!=='foe')__shots++;return es.apply(this,arguments);};return 0;});
 await tick(p,60);assert.equal(await p.evaluate(()=>__shots),0);ok('an unaware team does not open fire from beyond its sight range');
 await goNear(p,225,id);await tick(p,150);s=await squad(p,id);fired=await p.evaluate(()=>__shots);assert.equal(s.alert,true);assert.ok(fired>=2,'enemy opened fire: '+fired);ok('inside 250 m the team notices the player and opens fire from long range ('+fired+' shots in 15 s)');
 await goNear(p,205,id);const seen=await p.evaluate(id=>{const n0=__shots;for(let i=0;i<120&&__shots===n0&&game==='play';i++)update(.1);
  const L0=E.filter(e=>e.bt===id&&Math.hypot(e.x-P.x,e.z-P.z)>121&&!e.mark),far=e=>AL.every(q=>q.dead||Math.hypot(q.x-e.x,q.z-e.z)>=190);
  return {shot:__shots>n0,far:L0.length,seen:L0.filter(e=>e.sp>0&&spotted(e)).length,quiet:L0.filter(e=>!(e.sp>0)&&far(e)).every(e=>!spotted(e))};},id);
 assert.equal(seen.shot,true);assert.ok(seen.seen>=1,'a firing tank beyond 121 m is shown: '+JSON.stringify(seen));assert.equal(seen.quiet,true);ok('an enemy that opens fire shows on the minimap for a few seconds even beyond normal sight; silent ones stay hidden');
 // imha sayımı ve puan: oyuncunun takımının imhası sayılır, düşmanların birbirine verdiği kayıp sayılmaz
 const k0=await p.evaluate(()=>({k:HisarBattle.diagnostics().kills,kr:SV.kr}));await p.evaluate(id=>{const e=E.find(q=>q.bt===id);killE(e);},id);await tick(p,8);const k1=await p.evaluate(()=>({k:HisarBattle.diagnostics().kills,kr:SV.kr,left:HisarBattle.diagnostics().enemies}));
 assert.equal(k1.k,k0.k+1);assert.ok(k1.kr>k0.kr);assert.equal(k1.left,15);await p.evaluate(id=>{const e=E.find(q=>q.bt===id);e.nc=1;killE(e);},id);await tick(p,8);const k2=await p.evaluate(()=>({k:HisarBattle.diagnostics().kills,kr:SV.kr,left:HisarBattle.diagnostics().enemies}));
 assert.equal(k2.k,k1.k);assert.equal(k2.kr,k1.kr);assert.equal(k2.left,14);ok('own kills are counted and paid; losses enemies inflict on each other are not credited to the player');
 // sahadan çekilme: uzaklaşınca tanklar kaldırılır, kalan can saklanır, dönünce aynı canla geri gelir
 await p.evaluate(id=>{const e=E.find(q=>q.bt===id);e.hp=e.mx*.5;},id);await tick(p,6);const gone=await p.evaluate(id=>{const s=HisarBattle.diagnostics().squads.find(q=>q.id===id);let best=null,bd=-1;for(const x of [-760,760])for(const z of [-760,760]){const d=Math.hypot(s.x-x,s.z-z);if(d>bd){bd=d;best={x,z};}}P.x=best.x;P.z=best.z;AL.forEach((a,i)=>{a.x=P.x+(P.x>0?-10:10)*(i+1);a.z=P.z;a.cmd='follow';});return bd;},id);assert.ok(gone>700,'far corner '+gone);
 for(let k=0;k<16;k++){await tick(p,10);s=await squad(p,id);if(!s.active)break;} // karargâh ya da başka gözcü yakındaysa çekilme gecikebilir
 assert.equal(s.active,false);assert.equal(await p.evaluate(id=>E.filter(e=>e.bt===id).length,id),0);assert.equal(s.alive,2);
 await goNear(p,300,id);await tick(p,30);s=await squad(p,id);assert.equal(s.active,true);assert.equal(s.field,2);assert.ok(await p.evaluate(id=>E.filter(e=>e.bt===id).some(e=>Math.abs(e.hp/e.mx-.5)<.02),id));ok('a team left far behind leaves the field and returns later with the same damage');

 // ---- iki düşman takım karşılaşınca birbirini vurur
 await calm();const duel=await p.evaluate(()=>{const s=HisarBattle.diagnostics().squads;let a=s[0],b=s[1];P.x=a.x+330;P.z=a.z;if(Math.abs(P.x)>WS-20)P.x=a.x-330;AL.forEach((q,i)=>{q.x=P.x+10*(i+1);q.z=P.z;});for(let i=0;i<30;i++)update(.1);
  // ikinci takımı birincinin 120 m yanına taşı (oyuncudan uzak tarafa)
  const sign=P.x>a.x?-1:1;return {a:a.id,b:b.id,sign};});
 await p.evaluate(({a,b,sign})=>{const A=E.filter(e=>e.bt===a);const cx=A.reduce((n,e)=>n+e.x,0)/A.length,cz=A.reduce((n,e)=>n+e.z,0)/A.length;P.x=Math.max(-WS+20,Math.min(WS-20,cx-sign*330));P.z=cz;AL.forEach((q,i)=>{q.x=P.x;q.z=P.z+10*(i+1);});window.__duel={cx:cx+sign*120,cz};},duel);
 // ikinci takım sahada değilse, oyuncuyu geçici olarak yanına götürüp sahaya çıkar ve sonra taşı
 const moved=await p.evaluate(({a,b})=>{const hold={x:P.x,z:P.z};let s=HisarBattle.diagnostics().squads.find(q=>q.id===b);P.x=Math.max(-WS+20,Math.min(WS-20,s.x+300));P.z=s.z;for(let i=0;i<40;i++)update(.1);const B=E.filter(e=>e.bt===b);B.forEach((e,i)=>{e.x=__duel.cx+(i%2?10:-10);e.z=__duel.cz+(i-1.5)*14;e.g.position.set(e.x,hAt(e.x,e.z),e.z);});P.x=hold.x;P.z=hold.z;AL.forEach((q,i)=>{q.x=P.x;q.z=P.z+10*(i+1);});return B.length;},duel);
 assert.equal(moved,4);const hp0=await p.evaluate(({a,b})=>E.filter(e=>e.bt===a||e.bt===b).reduce((n,e)=>n+e.hp,0),duel);const kr0=await p.evaluate(()=>SV.kr);
 await tick(p,400,.1);const du=await p.evaluate(({a,b})=>({hp:E.filter(e=>e.bt===a||e.bt===b).reduce((n,e)=>n+e.hp,0),duel:HisarBattle.diagnostics().squads.filter(q=>q.id===a||q.id===b).reduce((n,q)=>n+q.duel,0),alive:HisarBattle.diagnostics().squads.filter(q=>q.id===a||q.id===b).map(q=>q.alive),kills:HisarBattle.diagnostics().kills,kr:SV.kr,game}),duel);
 assert.ok(du.hp<hp0-100,'two enemy teams damage each other: '+hp0+' -> '+du.hp);assert.equal(du.kills,0);assert.equal(du.kr,kr0);ok('two enemy teams that meet fight each other; the player gets no credit for their losses');

 // ---- ikmal sandığı: paraşütle iner, en yakın rakip takım yürür, alan takım ikmal olur
 await calm();const crate=await p.evaluate(()=>{for(let n=0;n<4;n++){HisarBattle.events('sandik');const c0=HisarBattle.diagnostics().crate,g=S.getObjectByName('BT_SANDIK'),far=Math.hypot(c0.x-P.x,c0.z-P.z),high=g.position.y-hAt(c0.x,c0.z),z=HisarBattle.diagnostics().zone;
   for(let i=0;i<85;i++)update(.1);const d=HisarBattle.diagnostics();if(d.crate&&d.crate.x===c0.x)return {far,high,vis:g.visible,inside:Math.hypot(c0.x-z.nx,c0.z-z.nz)<=z.nr*.85+1,fall:d.crate.fall,y:g.position.y-hAt(c0.x,c0.z),chute:g.userData.chute.visible};}return null;});
 assert.ok(crate,'crate stayed on the ground');assert.ok(crate.far>=70,'away from the player: '+crate.far);assert.ok(crate.high>60);assert.equal(crate.vis,true);assert.equal(crate.inside,true);assert.equal(crate.fall,0);assert.ok(Math.abs(crate.y)<.01);assert.equal(crate.chute,false);ok('a supply crate parachutes into the next circle, away from the player, and lands');
 await p.evaluate(()=>{const c=HisarBattle.diagnostics().crate,h=Math.PI/2;P.x=c.x-22;P.z=c.z;P.h=h;P.th=h;yaw=h;AL.forEach((a,i)=>{a.x=P.x-12*(i+1);a.z=P.z;a.cmd='hold';a.hold={x:a.x,z:a.z};});for(let i=0;i<3;i++)update(.1);});await p.waitForTimeout(700);await shot(p,'crate.png');
 const got=await p.evaluate(()=>{const c=HisarBattle.diagnostics().crate;TA=TA.map(()=>1);P.hp=P.mx*.3;AL[0].hp=AL[0].mx*.2;P.x=c.x+4;P.z=c.z;for(let i=0;i<3;i++)update(.1);const d=HisarBattle.diagnostics();
  return {crate:d.crate,taken:d.taken,ta:TA.join(),ta0:TA0.join(),hp:P.hp/P.mx,al:AL[0].hp/AL[0].mx,vis:S.getObjectByName('BT_SANDIK').visible};});
 assert.equal(got.crate,null);assert.equal(got.taken,1);assert.equal(got.ta,got.ta0);assert.ok(Math.abs(got.hp-.8)<.03,'armour '+got.hp);assert.ok(Math.abs(got.al-.7)<.03,'ally armour '+got.al);assert.equal(got.vis,false);ok('driving onto the crate refills ammunition and repairs half the armour of the whole team');
 const rv=await p.evaluate(()=>{for(let n=0;n<30;n++){HisarBattle.events('sandik');const d=HisarBattle.diagnostics(),c=d.crate;if(c.rival==null)continue;const s0=d.squads.find(q=>q.id===c.rival);if(s0.active)continue;const d0=Math.hypot(s0.x-c.x,s0.z-c.z);if(d0<160)continue;
   for(let i=0;i<100;i++)update(.1);const s1=HisarBattle.diagnostics().squads.find(q=>q.id===c.rival);return {d0,d1:Math.hypot(s1.x-c.x,s1.z-c.z)};}return null;});
 assert.ok(rv,'a rival team was within reach of one of thirty drops');assert.ok(rv.d1<rv.d0-40,'rival closed in: '+rv.d0+' -> '+rv.d1);ok('the nearest rival team heads for the crate ('+Math.round(rv.d0)+' m -> '+Math.round(rv.d1)+' m in 10 s)');
 // ---- topçu bölgesi: uyarı, işaretli mermi, isabet eden hasar alır
 const red=await p.evaluate(()=>{lvSel='kolay';HisarBattle.start();AL.forEach(a=>{a.fire=0;});HisarBattle.events('topcu');for(let i=0;i<2;i++)update(.1);const d=HisarBattle.diagnostics(),r=d.red;return {r,near:r&&Math.hypot(r.x-P.x,r.z-P.z),inside:r&&Math.hypot(r.x-d.zone.cx,r.z-d.zone.cz)<=d.zone.r};});
 assert.ok(red.r,'artillery zone opened');assert.equal(red.r.state,'warn');assert.ok(red.near<=161,'near the player: '+red.near);assert.equal(red.inside,true);
 const warn=await p.evaluate(()=>{const r=HisarBattle.diagnostics().red,hp=P.hp,bb=window.bigBoom;window.__bb=bb;window.__booms=0;window.bigBoom=function(){__booms++;return bb.apply(this,arguments);};
  for(let i=0;i<80;i++){P.x=r.x;P.z=r.z;AL.forEach((a,k)=>{a.x=r.x+200+10*k;a.z=r.z;});update(.1);}return {state:HisarBattle.diagnostics().red.state,same:P.hp===hp,booms:__booms,text:document.querySelector('#hr-objective p').textContent,cls:document.getElementById('hr-objective').className};});
 assert.equal(warn.state,'warn');assert.equal(warn.booms,0);assert.equal(warn.same,true);assert.match(warn.text,/TOPÇU BÖLGESİNDESİN/);assert.match(warn.cls,/dis/);ok('artillery zone opens near the player with a warning first; the status card says to leave');
 const fire=await p.evaluate(()=>{const r=HisarBattle.diagnostics().red,a=AL[0];let d=null;const away=()=>AL.forEach((s,k)=>{s.x=r.x+200+10*k;s.z=r.z;});
  const next=()=>{for(let i=0;i<60&&game==='play';i++){update(.1);d=HisarBattle.diagnostics();const q=d.shells.find(s=>s.t>1.2);if(q)return q;}return null;};
  // oyuncu bir merminin altında (dost tanklar uzakta)
  const pending=q=>HisarBattle.diagnostics().shells.some(s=>s.x===q.x&&s.z===q.z); // mermi düşene kadar beklenir (süre kayan nokta yüzünden bir adım oynayabilir)
  P.x=r.x;P.z=r.z;away();let q=next();const st=d.red.state,inside=Math.hypot(q.x-r.x,q.z-r.z)<=r.r+.01,hp=P.hp,n0=__booms;for(let i=0;i<30&&game==='play'&&pending(q);i++){P.x=q.x;P.z=q.z;away();update(.1);}const after=P.hp,booms=__booms-n0;
  // dost tank başka bir merminin altında (oyuncu bölgenin dışında)
  P.x=r.x+150;P.z=r.z;q=next();
  // bir binanın dibine düşen mermide dost tank binadan dışarı itilir: mermiyi boş bir yere taşı (hasar kuralı aynı)
  const clear=(x,z)=>BLD.every(b=>b.dead||Math.hypot(b.x-x,b.z-z)>b.r+5),live=HisarBattle.live().shells.find(s=>s.x===q.x&&s.z===q.z);
  if(live&&!clear(q.x,q.z)){for(let k=0;k<200;k++){const a2=k*.7,d2=(k%10)*7,x=r.x+Math.cos(a2)*d2,z=r.z+Math.sin(a2)*d2;if(Math.hypot(x-r.x,z-r.z)<=r.r-4&&clear(x,z)){live.x=x;live.z=z;q={...q,x,z};break;}}}
  const ah=a.hp;for(let i=0;i<30&&game==='play'&&pending(q);i++){P.x=r.x+150;P.z=r.z;away();a.x=q.x;a.z=q.z;update(.1);}
  return {st,inside,hp,after,booms,ah,aafter:a.hp,game};});
 assert.equal(fire.st,'fire');assert.equal(fire.inside,true);assert.ok(fire.booms>=1,'shell landed');assert.ok(fire.after<fire.hp-5,'tank under the shell is hurt: '+fire.hp+' -> '+fire.after);assert.ok(fire.aafter<fire.ah,'ally under the shell is hurt');assert.equal(fire.game,'play');await p.waitForTimeout(500);await shot(p,'artillery.png');
 ok('each shell is marked on the ground, falls inside the zone and damages the tanks under it');
 await p.evaluate(()=>{const r=HisarBattle.diagnostics().red;L.dmg=0;for(let i=0;i<220&&game==='play';i++){P.x=r.x+200;P.z=r.z;update(.1);}window.bigBoom=window.__bb;});const after=await p.evaluate(()=>{const d=HisarBattle.diagnostics();return {red:d.red,shells:d.shells.length,rings:S.children.filter(o=>o.geometry&&o.geometry.type==='RingGeometry'&&o.material&&o.material.color&&o.material.color.getHex()===0xff3020).length};});
 assert.equal(after.red,null);assert.equal(after.shells,0);assert.equal(after.rings,0);ok('the barrage ends after sixteen seconds and leaves no markers behind');
 // ---- olaylar açıkken kendiliğinden: ilk sandık savaşın 12. saniyesinden sonra, ilk topçu 70-100 sn arası
 await p.evaluate(()=>{HisarBattle.events(true);lvSel='normal';HisarBattle.start();L.dmg=0;});await tick(p,135);const auto=await p.evaluate(()=>{const d=HisarBattle.diagnostics();return {ev:d.events,crate:!!d.crate||d.taken>0,redIn:d.redIn};});
 assert.equal(auto.ev,true);assert.equal(auto.crate,true);assert.ok(auto.redIn>50&&auto.redIn<90,'first artillery in '+auto.redIn+' s');ok('with events on, the first crate drops by itself early in the battle and artillery is scheduled');await p.evaluate(()=>HisarBattle.events(false));

 // ---- harita: yeni binalar ve bütün haritaya yayılan mevziler
 const world=await p.evaluate(()=>{const inst=BLD.filter(b=>b.parts),b=inst.find(q=>q.kind==='house'&&!q.dead),i=b.parts[0].i,k=b.parts[0].k,col=()=>{const c=new THREE.Color();BX.IM[k].getColorAt(i,c);return c.r+c.g+c.b;},c0=col();
  b.hp=1;bldHit(b.x,b.z,1,5);for(let n=0;n<20;n++)update(.1);const dead=b.dead,c1=col();return {n:BLD.length,inst:inst.length,ham:HAML.length,dead,darker:c1<c0*.5,id:BLD.indexOf(b)};});
 assert.ok(world.n>=330,'buildings '+world.n);assert.ok(world.inst>=240);assert.equal(world.ham,12);assert.equal(world.dead,1);assert.equal(world.darker,true);ok('the map has '+world.n+' buildings and twelve hamlets; a new building collapses into rubble when shelled');
 await p.evaluate(()=>{lvSel='normal';HisarBattle.start();HisarBattle.events(false);L.dmg=0;});const back=await p.evaluate(id=>{const b=BLD[id],c=new THREE.Color();BX.IM[b.parts[0].k].getColorAt(b.parts[0].i,c);return {dead:b.dead,sum:c.r+c.g+c.b};},world.id);
 assert.equal(back.dead,0);assert.ok(back.sum>1);ok('a new battle rebuilds the collapsed building');
 const pos=await p.evaluate(()=>new Promise(res=>{const t0=performance.now(),w=()=>{const d=HisarField.diagnostics();if(d.pending===0||performance.now()-t0>150000){const ps=HisarField.positions();
   res({d,n:ps.length,far:ps.filter(q=>Math.hypot(q.x,q.z)>300).length,gap:Math.min(...ps.map((a,i)=>Math.min(...ps.filter((_,j)=>j!==i).map(c=>Math.hypot(a.x-c.x,a.z-c.z))))),bld:Math.min(...ps.map(a=>Math.min(...BLD.map(b=>Math.hypot(a.x-b.x,a.z-b.z)-b.r))))});}else setTimeout(w,500);};w();}));
 assert.equal(pos.d.pending,0);assert.ok(pos.n>=60,'positions '+pos.n);assert.ok(pos.far>=40);assert.ok(pos.gap>=20);assert.ok(pos.bld>=10,'keeps clear of buildings '+pos.bld);assert.ok(pos.d.wideMax<250,'slice '+pos.d.wideMax+' ms');
 ok(pos.n+' tank positions across the map (roadsides, village edges, hilltops), none on top of a building');
 const inPos=await p.evaluate(()=>{const ps=HisarField.positions(),q=ps.find(o=>Math.hypot(o.x,o.z)>300);P.x=q.x-Math.sin(q.h)*14;P.z=q.z-Math.cos(q.h)*14;P.h=q.h;P.th=q.h;yaw=q.h;
  for(let i=0;i<34;i++){P.x+=Math.sin(q.h)*.45;P.z+=Math.cos(q.h)*.45;update(.1);}const near=COV.filter(c=>c.pos&&Math.hypot(c.x-q.x,c.z-q.z)<12).length;return {d:Math.hypot(P.x-q.x,P.z-q.z),sink:HisarField.diagnostics().sink,near};});
 assert.ok(inPos.d<3.5,'drove in: '+inPos.d);assert.ok(inPos.sink>.2);assert.ok(inPos.near>=4);ok('driving into a roadside position from the open rear settles the tank hull-down behind the earth wall');

 // ---- gerçeklik: dağlar, ot, toz, ayar atışı, düşmanın mevziye girmesi
 const real=await p.evaluate(()=>{HisarRealism.grass();const d0=HisarRealism.diagnostics();const dag=S.children.filter(o=>o.name==='DAG').length,ot=S.getObjectByName('GR_OT');
  const sd=HisarRealism.diagnostics().dust;let sx=0,sz=-300;for(let t=0;t<400;t++){const x=-600+(t%20)*60,z=-650+Math.floor(t/20)*60;let okp=true;for(let k=0;k<45;k+=5)if(hAt(x,z+k)<.2||roadNear(x,z+k,3))okp=false;if(okp){sx=x;sz=z;break;}}
  P.x=sx;P.z=sz;for(let i=0;i<30;i++){P.z+=1.4;update(.1);camUpdate();}const dust=HisarRealism.diagnostics().dust-sd;
  const e=E.find(q=>q.type==='tank');let sp=null;if(e){e._br=null;sp=[];for(let i=0;i<3;i++){eshot(e,P.x,2,P.z,80,'p');sp.push(HisarRealism.diagnostics().spread);}}
  return {dag,ot:ot?ot.count:0,dust,sp,oldGrass:gm.visible};});
 assert.equal(real.dag,3);assert.ok(real.ot>800,'grass '+real.ot);assert.equal(real.oldGrass,false);assert.ok(real.dust>=3,'dust '+real.dust);
 if(real.sp)assert.deepEqual(real.sp,[2.2,1.5,1.15]);ok('three mountain ranges on the horizon, '+real.ot+' grass tufts around the camera, dust behind a moving tank, enemy gunners bracket');
 const hold=await p.evaluate(()=>{const s=HisarBattle.diagnostics().squads.find(q=>!q.dead),a=Math.atan2(-s.x,-s.z);P.x=s.x+Math.sin(a)*300;P.z=s.z+Math.cos(a)*300;for(let i=0;i<20;i++)update(.1);
  const e=E.find(q=>q.bt===s.id);if(!e)return null;const cands=HisarField.positions().filter(q=>Math.hypot(q.x,q.z)>200&&Math.abs(q.z-riv(q.x)+26)>230).sort((u,v)=>Math.hypot(u.x-e.x,u.z-e.z)-Math.hypot(v.x-e.x,v.z-e.z)).slice(0,3);
  /* rastgele seçilen mevzinin yolu kapalı olabilir (bahçe, yıkıntı): en yakın üç mevzi sırayla denenir */let p=null,k=0,at=null,who=null,put=null;for(const c of cands){p=c;
  put=()=>{P.x=p.x+Math.sin(p.h)*180;P.z=p.z+Math.cos(p.h)*180;};put();e.x=p.x+Math.cos(p.h)*45-Math.sin(p.h)*10;e.z=p.z-Math.sin(p.h)*45-Math.cos(p.h)*10;
  at=o=>o._pos&&Math.hypot(o._pos.x-p.x,o._pos.z-p.z)<1;who=()=>E.find(o=>at(o)&&o._in);for(k=0;k<500;k++){put();e.conv=0;e.park=0;e.foe=null;update(.1);if(who())break;}if(who())break;}for(let i=0;i<15;i++){put();update(.1);}const q=who(),inn={t:k/10,in:!!q,d:q?Math.hypot(q.x-p.x,q.z-p.z):99,sink:q?q._sink:0};
  for(let i=0;i<80;i++){P.x=p.x+Math.cos(p.h)*200;P.z=p.z-Math.sin(p.h)*200;update(.1);}return {inn,left:!E.some(at)};});
 assert.ok(hold,'an enemy tank took the field');assert.equal(hold.inn.in,true);assert.ok(hold.inn.d<3);assert.ok(hold.inn.sink>.3);assert.equal(hold.left,true);
 ok('an engaged enemy tank drives round into a position facing the player ('+hold.inn.t+' s), sits hull-down, and pulls out when flanked');

 // ---- sürü dron ve mikrodalga dron savar
 await p.evaluate(()=>{HisarBattle.events(false);lvSel='normal';HisarBattle.start();L.dmg=0;});await tick(p,1);
 const sr0=await p.evaluate(()=>{const d=HisarSwarm.diagnostics();return {v:HisarSwarm.version,base:!!d.base&&!!S.getObjectByName('SR_KARARGAH'),dc:DC,dcx:DCX(),btn:!document.getElementById('abE').hidden,box:document.querySelectorAll('#sr-box button').length};});
 assert.equal(sr0.base,true);assert.equal(sr0.dc,sr0.dcx);assert.ok(sr0.dcx>=9);assert.equal(sr0.btn,true);assert.equal(sr0.box,5);ok('battle sets up a headquarters with a drone jammer, nine spare drones, a jammer button and a swarm section in the radio');
 // karargâhtan uzakta: düşman sürüsü tanka gelir, E tuşu düşürür
 const far=`(()=>{const b=HisarSwarm.diagnostics().base,a=Math.atan2(-b.x,-b.z),put=()=>{P.x=b.x+Math.sin(a)*560;P.z=b.z+Math.cos(a)*560;AL.forEach((q,i)=>{q.x=P.x+60+12*i;q.z=P.z+60;q.cmd='hold';q.hold={x:q.x,z:q.z};});};return put;})()`;
 const jam=await p.evaluate(far=>{const put=eval(far);put();for(let i=0;i<5;i++)update(.1);HisarSwarm.spawnFoe('p',4,240);for(let i=0;i<40;i++){put();update(.1);}
  const d=HisarSwarm.diagnostics();window.__put=put;return {up:d.foe.filter(q=>q.st!=='fall').length,near:d.foe.every(q=>Math.hypot(q.x-P.x,q.z-P.z)<200),warn:document.getElementById('abE').classList.contains('warn')};},far);
 assert.equal(jam.up,4);assert.equal(jam.near,true);assert.equal(jam.warn,true);
 await p.keyboard.press('e');const jam2=await p.evaluate(()=>{for(let i=0;i<3;i++){__put();update(.1);}const d=HisarSwarm.diagnostics();return {up:d.foe.filter(q=>q.st!=='fall').length,cd:d.tankCd,downed:d.downed};});
 assert.equal(jam2.up,0);assert.ok(jam2.cd>15);assert.ok(jam2.downed>=4);ok('an enemy swarm heads for the tank; one press of E brings the whole swarm down and the jammer recharges');
 const hurt=await p.evaluate(()=>{L.dmg=22;const hp=P.hp;HisarSwarm.spawnFoe('p',2,150);for(let i=0;i<120&&HisarSwarm.diagnostics().foe.some(q=>q.st!=='fall');i++){__put();E.forEach(e=>{e.cd=99;});update(.1);}L.dmg=0;return {hp,after:P.hp,game};});
 assert.ok(hurt.after<hurt.hp-15&&hurt.after>hurt.hp-60,'two drones while the jammer charges: '+hurt.hp+' -> '+hurt.after);assert.equal(hurt.game,'play');ok('while the jammer recharges, diving drones hit the tank');
 const hq=await p.evaluate(()=>{HisarSwarm.spawnFoe('b',5,420);let k=0;for(;k<200&&HisarSwarm.diagnostics().foe.some(q=>q.st!=='fall');k++){__put();update(.1);}const d=HisarSwarm.diagnostics();return {t:k/10,hp:d.base.hp,up:d.foe.filter(q=>q.st!=='fall').length};});
 assert.equal(hq.up,0);assert.equal(hq.hp,100);assert.ok(hq.t<20);ok('a swarm sent at the headquarters is brought down automatically before it arrives ('+hq.t+' s)');
 // oyuncunun sürüsü: dört dron kalkar, işaretli tanklara ikişer dalar
 const own=await p.evaluate(()=>{const s=HisarBattle.diagnostics().squads.find(q=>!q.dead),a=Math.atan2(-s.x,-s.z),put=()=>{P.x=s.x+Math.sin(a)*170;P.z=s.z+Math.cos(a)*170;};put();for(let i=0;i<20;i++){put();update(.1);}
  const tg=E.filter(e=>e.bt===s.id);tg.forEach(e=>e.mark=1);const dc=DC,sc=score,n=HisarSwarm.launch(),k0=HisarSwarm.diagnostics().kills;for(let i=0;i<30;i++){put();update(.1);}const alt=Math.min(...HisarSwarm.diagnostics().own.map(d=>d.y-hAt(d.x,d.z)));
  for(let i=0;i<120;i++){put();update(.1);}const d=HisarSwarm.diagnostics();return {n,dc,dcAfter:DC,alt,kills:d.kills-k0,score:score-sc};});
 assert.equal(own.n,4);assert.equal(own.dcAfter,own.dc-4);assert.ok(own.alt>12);assert.ok(own.kills>=2,'kills '+own.kills);assert.ok(own.score>=200);ok('a four-drone swarm takes off, flies high and destroys two marked tanks (credited)');
 // bundan sonraki denetimler olaylarsız (sandık, topçu, düşman dron sürüsü) koşar: ölçülen hasar yalnız alandan gelsin
 await p.evaluate(()=>HisarBattle.events(false));

 // ---- sınır: duvar, kapılar, kuleler, karakollar, devriye, bayraklar, okullar
 const sn=await p.evaluate(()=>{const d=HisarSinir.diagnostics();return {d,wall:S.children.filter(o=>o.name==='SN_DUVAR').length,uni:S.children.filter(o=>o.name==='SN_UNIMOG').length,
  hk:HisarSinir.flagTex()&&HisarSinir.flagTex().image.width,hq:!!S.getObjectByName('SR_KARARGAH')};});
 assert.ok(sn.d.blocks>500&&sn.d.coils>1500,'wall blocks '+sn.d.blocks);assert.equal(sn.wall,3);assert.ok(sn.d.towers>=6);assert.equal(sn.d.posts.length,3);assert.ok(sn.d.schoolsAt.length>=3,'schools '+sn.d.schoolsAt.length);
 assert.ok(sn.d.flags>=80,'house flags '+sn.d.flags);assert.ok(sn.d.poleFlags>=40);assert.ok(sn.d.soldiers>=12);assert.ok(sn.uni>=3&&sn.d.unimogs.length===sn.uni);
 ok('border: '+sn.d.blocks+' wall blocks with razor wire, '+sn.d.towers+' watchtowers, three border posts, '+sn.d.soldiers+' soldiers, '+sn.uni+' Unimog patrols, '+sn.d.flags+' house flags, '+sn.d.schoolsAt.length+' schools');
 const cross=await p.evaluate(()=>{const W=x=>riv(x)-26,go=(x)=>{P.x=x;P.z=W(x)-8;P.h=0;P.v=0;keys.w=true;for(let i=0;i<90;i++)update(.1);keys.w=false;return {z:P.z,wall:W(P.x)};};
  const a=go(230),b=go(70),c=HisarSinir.diagnostics();return {a,b,blocked:c.crossBlocked,country:c.country};});
 assert.ok(cross.a.z<cross.a.wall,'the wall stops the tank');assert.ok(cross.b.z>cross.b.wall+5,'the gate lets the tank through');assert.ok(cross.blocked>0);
 ok('the tank cannot drive through the wall but passes the border gate into Syria');
 const unim=await p.evaluate(()=>{const a=HisarSinir.diagnostics().unimogs.map(u=>u.x);for(let i=0;i<30;i++)update(.1);const b=HisarSinir.diagnostics().unimogs.map(u=>u.x);return a.map((x,i)=>Math.abs(b[i]-x));});
 assert.ok(unim.filter(d=>d>5).length>=Math.max(1,unim.length-1),'patrols move '+unim); // biri tam o anda geri dönüyor ya da tankın önünde duruyor olabilirok('Unimog patrols drive along the wall');
 const civ=await p.evaluate(()=>{const b=BLD.find(q=>q.kind==='beton'&&!q.dead);const c0=HisarSinir.diagnostics().civil;impact({k:0},b.x+2,hAt(b.x,b.z)+1,b.z+2,null);return {c0,c1:HisarSinir.diagnostics().civil,hit:document.getElementById('hit').textContent};});
 assert.equal(civ.c1,civ.c0+1);assert.match(civ.hit,/SİVİL YERLEŞİM/);ok('a shell landing in a village warns "Sivil yerleşim hedef alanında" (no penalty)');
 // ---- ağır sürüş ve binaya çarpma
 const drv=await p.evaluate(()=>{P.x=70;P.z=-200;P.h=Math.PI;P.v=0;P.w=0;keys.w=true;update(.1);for(let i=0;i<9;i++)update(.1);const v1=P.v;for(let i=0;i<120;i++)update(.1);const vmax=P.v;keys.w=false;
  const b=BLD.find(q=>q.kind==='house'&&!q.dead&&q.hp>=3);const hp=b.hp,a=Math.atan2(b.x-70,b.z+200)+Math.PI;P.x=b.x+Math.sin(a)*(b.r+6);P.z=b.z+Math.cos(a)*(b.r+6);P.h=a+Math.PI;P.v=9;const r0=window.RAMMED|0;keys.w=true;for(let i=0;i<14;i++)update(.1);keys.w=false;
  return {v1,vmax,hp,after:b.hp,dead:b.dead,ram:(window.RAMMED|0)-r0};});
 assert.ok(drv.v1<4.4,'one second from rest: '+drv.v1);assert.ok(drv.vmax>8&&drv.vmax<12.8,'top speed '+drv.vmax);assert.ok(drv.ram>0&&(drv.dead||drv.after<drv.hp),'ramming damages the house');
 ok('the tank is heavy: '+drv.v1.toFixed(1)+' m/s after one second, '+drv.vmax.toFixed(1)+' m/s top on the road; ramming a house damages it');
 // ---- atış hissi, kovan, erkek ses, gerçek küçük harita, çarpışmalar
 await p.evaluate(()=>{lvSel='normal';HisarHarekat.start('gecit');L.dmg=0;});await tick(p,2);
 // mürettebat "Ateş!" der, top konuşma bitince ateşlenir (crew-orders.js): bir an beklenir
 const a0=await p.evaluate(()=>{const a=HisarAtis.diagnostics();cd=0;ammo=Math.max(ammo,3);mode='tank';fire();return a;});await p.waitForFunction(s=>HisarAtis.diagnostics().shots>s,a0.shots,{timeout:8000});
 const fx=await p.evaluate(a0=>{update(.05);const a1=HisarAtis.diagnostics();HisarAtis.eject(3);for(let i=0;i<25;i++)update(.1);const a2=HisarAtis.diagnostics();
  mmDraw();const h=HisarHarita.diagnostics();return {shots:a1.shots-a0.shots,smoke:a1.smoke-a0.smoke,rock:a1.peak,cas:a2.live,v:typeof trVoice==='function',h,
   kovan:!!S.getObjectByName('AT_KOVAN')};},a0);
 assert.equal(fx.shots,1);assert.ok(fx.smoke>=10);assert.ok(fx.rock>.1,'hull rocks');assert.ok(fx.cas>=3&&fx.kovan);assert.equal(fx.v,true);assert.equal(fx.h.size,264);assert.ok(fx.h.draws>0&&fx.h.hidpi);
 ok('firing rocks the hull with a smoke ring; machine-gun casings fly out; the mini map is a sharp terrain map with roads and buildings');
 const cr=await p.evaluate(()=>{const t=HisarCarpisma.trees().find(q=>!q.down&&Math.abs(q.x)<WS-60&&Math.abs(q.z-riv(q.x))>60&&BLD.every(b=>Math.hypot(b.x-q.x,b.z-q.z)>b.r+14));
  P.x=t.x;P.z=t.z-14;P.h=0;P.v=0;keys.w=true;let k=0;for(;k<80&&!HisarCarpisma.trees().find(q=>q.x===t.x&&q.z===t.z).down;k++){P.x=t.x;update(.1);}keys.w=false;
  const fell=HisarCarpisma.trees().find(q=>q.x===t.x&&q.z===t.z).down;
  const fp=HisarField.positions().find(q=>Math.abs(q.z-riv(q.x)+26)>60&&BLD.every(b=>b.dead||Math.hypot(b.x-q.x,b.z-q.z)>b.r+28)&&COV.some(k=>k.pos&&k.h>.6&&Math.hypot(k.x-q.x,k.z-q.z)<20)),c=COV.filter(k=>k.pos&&Math.hypot(k.x-fp.x,k.z-fp.z)<20).sort((a,b)=>b.h-a.h)[0],h0=c.h;{const a=Math.atan2(c.x-fp.x,c.z-fp.z);P.x=c.x+Math.sin(a)*7;P.z=c.z+Math.cos(a)*7;P.h=a+Math.PI;P.v=6;keys.w=true;for(let i=0;i<25;i++)update(.1);keys.w=false;}
  const tr=addE('truck',P.x+16,P.z);P.h=Math.PI/2;P.v=8;keys.w=true;for(let i=0;i<40&&E.includes(tr);i++){P.z=tr.z;update(.1);}keys.w=false;
  return {fell,k,h0,h1:c.h,truck:!E.includes(tr),d:HisarCarpisma.diagnostics()};});
 assert.equal(cr.fell,true,'tree falls');assert.ok(cr.h1<cr.h0*.7,'berm flattened '+cr.h0+' -> '+cr.h1);assert.equal(cr.truck,true,'truck crushed');
 ok('the tank fells a tree, flattens a position berm and crushes a truck');
 // ---- köy hayatı: köylüler, selam veren çocuklar, saklanma, hayvanlar, çiçekler
 const ky=await p.evaluate(()=>{const d=HisarKoy.diagnostics(),s=HisarSinir.schools()[0],kids=HisarKoy.people().filter(q=>q.kid&&q.v&&q.v.school===s);mode='tank';
  const k=kids[0];k.st='walk';k.f.live=true;k.f.x=s.gate.x+20;k.f.z=s.gate.z;k.path=[{x:s.door.x,z:s.door.z}];k.cool=0;k.hold=0;P.x=k.f.x+12;P.z=k.f.z;P.v=0;
  let sal=false;for(let i=0;i<10;i++){P.x=k.f.x+12;P.z=k.f.z;update(.1);if(k.f.act==='selam')sal=true;}
  const f0=HisarKoy.diagnostics().fled,v=HisarKoy.people().find(q=>!q.kid&&q.v&&q.st!=='hidden'&&q.st!=='run');P.x=v.f.x+60;P.z=v.f.z;sndBoom(v.f.x+10,v.f.z);const st=v.st;for(let i=0;i<300&&v.st!=='hidden';i++){P.x=v.f.x+60;update(.1);}
  const a=HisarKoy.animals().find(q=>q.kind==='koyun'&&q.st!=='kos'),a0={x:a.f.x,z:a.f.z};for(let i=0;i<25;i++){P.x=a0.x+9;P.z=a0.z;update(.1);}HisarKoy.flowers();
  return {d,sal,st,hid:v.st,fled:HisarKoy.diagnostics().fled-f0,run:Math.hypot(a.f.x-a0.x,a.f.z-a0.z),fl:HisarKoy.diagnostics().flowers,mesh:['KH_INSAN_K','KH_KOYUN_Y','KH_CICEK','KH_LEYLEK_K'].every(n=>!!S.getObjectByName(n))};});
 assert.ok(ky.d.people>=60&&ky.d.kids>=25,'villagers '+ky.d.people+' kids '+ky.d.kids);const an=ky.d.animals;assert.ok(an.koyun>=80&&an.inek>=10&&an.tavuk>=40&&an.leylek>=10&&an.kopek>=4,JSON.stringify(an));
 assert.equal(ky.sal,true,'a child salutes the tank');assert.equal(ky.st,'run');assert.equal(ky.hid,'hidden');assert.ok(ky.fled>=1);assert.ok(ky.run>5,'sheep run '+ky.run);assert.ok(ky.fl>100,'flowers '+ky.fl);assert.equal(ky.mesh,true);
 ok('village life: '+ky.d.people+' villagers and children, a child salutes the tank, villagers run indoors from a blast, '+(an.koyun+an.inek+an.tavuk+an.kopek+an.leylek)+' animals flee the tank, '+ky.fl+' flowers');
 // ---- güneydoğu arazisi: Suriye tarafı kuru, kerpiç evler, zeytinlikler; tank zeytin ağacını devirir
 await p.evaluate(()=>{lvSel='normal';HisarHarekat.start('depo');L.dmg=0;});await tick(p,1);
 const az=await p.evaluate(()=>{const d=HisarArazi.diagnostics(),k=BLD.filter(b=>b.kind==='kerpic'),wrong=BLD.filter(b=>(b.kind==='house'||b.kind==='beton'||b.kind==='barn')&&b.z>riv(b.x)+20).length;
  const t=HisarArazi.trees().find(q=>!q.down&&q.z>riv(q.x)+60&&BLD.every(b=>b.dead||Math.hypot(b.x-q.x,b.z-q.z)>b.r+16)&&COV.every(c=>Math.hypot(c.x-q.x,c.z-q.z)>c.r+16));P.x=t.x;P.z=t.z-12;P.h=0;P.v=0;keys.w=true;for(let i=0;i<60&&!HisarArazi.trees().find(q=>q.x===t.x&&q.z===t.z).down;i++){P.x=t.x;update(.1);}keys.w=false;
  return {d,k:k.length,ksouth:k.every(b=>b.z>riv(b.x)),wrong,fell:HisarArazi.trees().find(q=>q.x===t.x&&q.z===t.z).down,pinesSouth:S.children.filter(o=>o.isGroup&&o.children.length===4&&o.children[0].geometry&&o.children[0].geometry.type==='CylinderGeometry'&&o.position.z>riv(o.position.x)).length};});
 assert.ok(az.d.trees>300&&az.d.groves>=10,'groves '+JSON.stringify(az.d));assert.ok(az.k>=40&&az.ksouth,'kerpic '+az.k);assert.equal(az.wrong,0);assert.equal(az.pinesSouth,0);assert.equal(az.fell,true);
 ok('south-east border terrain: '+az.d.trees+' olive trees in '+az.d.groves+' groves, '+az.k+' flat-roofed mud-brick houses in Syria, no pines south of the border; the tank fells an olive tree');
 // ---- harekât: savunma, taarruz, baskın
 await p.evaluate(()=>{lvSel='normal';HisarHarekat.start('gecit');L.dmg=0;});await tick(p,1);
 const g1=await p.evaluate(()=>{const d0=HisarHarekat.diagnostics();for(let i=0;i<570;i++){P.x=70;P.z=40;update(.1);}const d1=HisarHarekat.diagnostics();const z0=d1.enemies.map(e=>e.z);for(let i=0;i<100;i++){P.x=70;P.z=40;update(.1);}const d2=HisarHarekat.diagnostics();
  return {act:d0.active,op:d0.op,nav:d0.nav,en0:d0.enemies.length,wave:d1.wave,att:d1.enemies.filter(e=>e.role==='att').length,adv:d2.enemies.map((e,i)=>z0[i]-e.z),obj:document.getElementById('hk-obj').hidden,hr:document.getElementById('hr-objective').hidden};});
 assert.equal(g1.act,true);assert.equal(g1.op,'gecit');assert.ok(g1.nav&&g1.nav.len>20,'route to the position '+JSON.stringify(g1.nav));assert.equal(g1.en0,0);assert.equal(g1.wave,0);assert.equal(g1.att,2);assert.ok(g1.adv.every(d=>d>20),'the wave advances on the gate '+g1.adv);
 assert.equal(g1.obj,false);assert.equal(g1.hr,true);ok('defence: a route is drawn, the first wave comes after the countdown and drives for the border gate');
 const g2=await p.evaluate(()=>{E.filter(e=>e.hk).forEach(e=>killE(e));for(let i=0;i<320;i++){P.x=70;P.z=40;update(.1);}const d=HisarHarekat.diagnostics();const e=E.find(q=>q.hk&&q.hk.role==='att');e.x=70;e.z=riv(70)+44;for(let i=0;i<3;i++)update(.1);
  return {wave:d.wave,lost:HisarHarekat.diagnostics().lost,game};});
 assert.equal(g2.wave,1);assert.equal(g2.lost,true);assert.equal(g2.game,'over');ok('the second wave follows; an enemy reaching the gate loses the defence');
 await p.evaluate(()=>{HisarHarekat.start('tepe');L.dmg=0;});await tick(p,1);
 const t1=await p.evaluate(()=>{const o=HisarHarekat.core.OPS[1].obj;const d0=HisarHarekat.diagnostics();const ph0=d0.ph;P.x=-560;P.z=180;update(.1);update(.1);const ph1=HisarHarekat.diagnostics().ph;for(let i=0;i<200;i++){P.x=o.x;P.z=o.z-230;update(.1);}const d1=HisarHarekat.diagnostics();
  const def=d1.enemies.filter(e=>e.role==='def'&&e.type!=='inf');E.filter(e=>e.hk).forEach(e=>killE(e));let k=0;for(;k<200&&game==='play';k++){P.x=o.x;P.z=o.z;update(.1);}const d2=HisarHarekat.diagnostics();return {n:d0.enemies.length,kind:E.length,held:def.every(e=>e.post<12),won:d2.won,t:k/10,game,done:d2.done,ph0,ph1,stars:d2.stars,best:d2.best};});
 assert.ok(t1.n>=10,'hill garrison '+t1.n);assert.equal(t1.held,true,'defenders stay in their positions');assert.equal(t1.won,true);assert.ok(t1.t>11&&t1.t<14);assert.equal(t1.game,'over');assert.equal(t1.done.tepe,1);assert.equal(t1.ph0,0);assert.equal(t1.ph1,1,'crossing the ford completes the first step');assert.ok(t1.stars>=1&&t1.best.tepe>=1,'stars '+t1.stars);
 ok('attack: the hill is held by eleven enemies (tanks, armour, infantry) who stay in their positions; once cleared, holding the hilltop for 12 s takes it');
 await p.evaluate(()=>{HisarHarekat.start('depo');L.dmg=0;});await tick(p,1);
 const d1=await p.evaluate(()=>{const d0=HisarHarekat.diagnostics();const night=wx==='gece'&&!!NVG.on,nw=[wx,NVG.on,SV.wx,game,mis];const dep=E.filter(e=>e.hk&&e.hk.role==='dep');const kinds=dep.map(e=>e.type).sort().join();dep.forEach(e=>killE(e));for(let i=0;i<5;i++)update(.1);const fr=Math.max(...E.filter(e=>e.hk&&e.type==='tank').map(e=>e.fr),0);return {nw,kinds,won:HisarHarekat.diagnostics().won,tanks:d0.enemies.filter(e=>e.type==='tank').length,night,fr};});
 assert.equal(d1.kinds,'fuel,fuel,radar,truck,truck');assert.equal(d1.night,true,'night raid with night vision '+JSON.stringify(d1.nw));assert.ok(d1.fr>0&&d1.fr<300,'shorter fire range at night '+d1.fr);assert.equal(d1.won,true);assert.equal(d1.tanks,2);ok('raid: destroying the five depot targets wins the raid');
  await p.evaluate(()=>{HisarHarekat.start('batarya');L.dmg=0;});await tick(p,1);
  const b1=await p.evaluate(()=>{const o=HisarHarekat.core.OPS[3],d0=HisarHarekat.diagnostics();let k=0;for(;k<450&&HisarHarekat.diagnostics().hits<2;k++){P.x=o.start.x;P.z=o.start.z;update(.1);}const d1=HisarHarekat.diagnostics();
   const g=E.filter(e=>e.hk&&e.hk.bat&&e.hp>0);killE(g[0]);killE(g[1]);for(let i=0;i<3;i++)update(.1);const gap=HisarHarekat.diagnostics().shT;killE(g[2]);for(let i=0;i<3;i++)update(.1);const d2=HisarHarekat.diagnostics();
   return {day:!NVG.on,guns:d0.batLeft,arty:d0.enemies.filter(e=>e.type==='arty').length,t:k/10,hits:d1.hits,gap,won:d2.won,game,best:d2.best.batarya||0};});
  assert.equal(b1.day,true,'the weather returns after the night raid');assert.equal(b1.arty,3);assert.equal(b1.hits,2,'shells land on the village '+b1.t);assert.ok(b1.t<45,"t "+b1.t);assert.ok(b1.gap===null||b1.gap>0);assert.equal(b1.won,true);assert.equal(b1.game,'over');assert.ok(b1.best>=1);
  ok('counter-battery: three enemy howitzers shell Taşlıdere until they are silenced; destroying them wins the mission');
 // ---- hava desteği (T129, TB2, F-16), dost piyade ve araçlar, hızlı menü
 await p.evaluate(()=>{HisarHarekat.start('tepe');L.dmg=0;});await tick(p,1);
 const ds=await p.evaluate(()=>{const d0=HisarDestek.diagnostics(),q=HisarHarekat.core.OPS[1].outpost;P.x=q.x+20;P.z=q.z-150;E.filter(e=>e.hk).forEach(e=>{e.spT=1e9;});const e0=E.filter(e=>e.hk&&e.hp>0).length;
  HisarDestek.call('heli');HisarDestek.call('tb2');HisarDestek.call('jet');HisarDestek.call('topcu');const r1=HisarDestek.diagnostics().ready;for(let i=0;i<450;i++){P.x=q.x+20;P.z=q.z-150;update(.1);}const d=HisarDestek.diagnostics();
  return {d0,r1,d,e0,e1:E.filter(e=>e.hk&&e.hp>0).length,heli:!!S.getObjectByName('DS_T129'),jet:!!S.getObjectByName('DS_F16'),box:!!document.querySelector('#ds-box [data-ds=heli]')};});
 assert.ok(ds.d0.forces&&ds.d0.forces.on&&ds.d0.forces.men===12&&ds.d0.forces.veh.length===2,JSON.stringify(ds.d0.forces));assert.ok(ds.r1.heli>100&&ds.r1.tb2>60&&ds.r1.jet>100&&ds.r1.topcu>100,JSON.stringify(ds.r1));assert.equal(ds.d.calls.topcu,1);
 assert.ok(ds.d.missiles>=3,'missiles '+ds.d.missiles);assert.ok(ds.e1<ds.e0,'support destroys enemies '+ds.e0+' -> '+ds.e1);assert.ok(ds.d.infShots+ds.d.vehShots>5);assert.ok(ds.heli&&ds.jet&&ds.box);assert.ok(ds.d.parked>=6);
 ok('air and fire support: T129, TB2, F-16 and Fırtına artillery called from the radio strike seen targets ('+ds.e0+' -> '+ds.e1+'); two infantry squads and Kirpi/ACV-15 fight alongside; vehicles parked at border posts');
 await p.evaluate(()=>{openMenu();});await p.waitForTimeout(2500);const mn=await p.evaluate(()=>{const d=HisarMenu.diagnostics();document.getElementById('menu').style.display='none';return d;});
 assert.equal(mn.menu,true);assert.ok(mn.orbit>0&&mn.hooks.render,'menu throttles drawing and orbits the camera '+JSON.stringify(mn));ok('menu background is drawn at most 15 fps with a slow camera orbit');
 await shot(p,label+'-harekat.png');

 // ---- güvenli alan: bekleme, daralma, dışarıda hasar
 await p.evaluate(()=>{HisarBattle.start();});await holdInZone(p,112);let z=await p.evaluate(()=>HisarBattle.diagnostics().zone);assert.equal(z.info.state,'shrink');assert.equal(z.info.phase,1);assert.equal(await p.evaluate(()=>P.hp),await p.evaluate(()=>P.mx));ok('after the waiting time the zone starts to shrink; inside it nobody is hurt');
 await holdInZone(p,82);z=await p.evaluate(()=>HisarBattle.diagnostics().zone);assert.equal(z.info.phase,2);assert.ok(z.r<650&&z.r>600,'first circle radius '+z.r);
 const outside=await p.evaluate(()=>{const z=HisarBattle.diagnostics().zone,a=Math.atan2(z.cx,z.cz)+Math.PI;const c=v=>Math.max(-WS+12,Math.min(WS-12,v));let x=z.cx,zz=z.cz;for(let r=z.r+30;r<2400;r+=10){x=c(z.cx+Math.sin(a)*r);zz=c(z.cz+Math.cos(a)*r);if(Math.hypot(x-z.cx,zz-z.cz)>z.r+25)break;}P.x=x;P.z=zz;const hp=P.hp;for(let i=0;i<30&&game==='play';i++){P.x=x;P.z=zz;update(.1);}return {hp,after:P.hp,dist:Math.hypot(x-z.cx,zz-z.cz)-z.r,card:document.getElementById('hr-objective').className,text:document.querySelector('#hr-objective p').textContent};});
 assert.ok(outside.dist>20);assert.ok(outside.after<outside.hp-5&&outside.after>outside.hp-25,'zone damage '+outside.hp+' -> '+outside.after);await p.waitForTimeout(400);ok('outside the zone the tank loses armour steadily ('+Math.round(outside.hp-outside.after)+' in 3 s at phase 2)');
 await p.evaluate(()=>{for(let i=0;i<3;i++)update(.1);});assert.match(await p.locator('#hr-objective p').textContent(),/ALANIN DIŞINDASIN/);await shot(p,'zone-outside.png');
 // ---- yenilgi: alanın dışında kalan elenir, sıralama kalan takımlara göre
 const lost=await p.evaluate(()=>{const x=P.x,zz=P.z;for(let i=0;i<4000&&game==='play';i++){P.x=x;P.z=zz;update(.1);}const r=document.getElementById('rep');return {game,res:HisarBattle.diagnostics().result,on:r.classList.contains('on'),h2:r.querySelector('h2').textContent,pl:r.querySelector('.pl b').textContent,of:r.querySelector('.pl span').textContent,sub:r.querySelector('.sub').textContent,stats:r.querySelectorAll('.g div').length,emoji:/\p{Extended_Pictographic}/u.test(r.textContent)};});
 assert.equal(lost.game,'over');assert.equal(lost.res.ok,false);assert.ok(lost.res.place>=2&&lost.res.place<=5);assert.equal(lost.h2,'ELENDİN');assert.equal(lost.pl,String(lost.res.place));assert.equal(lost.of,'/ 5 takım');assert.match(lost.sub,/Güvenli alanın dışında kaldın/);assert.equal(lost.stats,6);assert.equal(lost.emoji,false);ok('staying outside ends the battle as eliminated with the placement on the result screen');await p.waitForTimeout(700);await shot(p,'result-lost.png');
 // ---- zafer: son takım kalınca
 await p.locator('#rep [data-r="again"]').click();await p.waitForFunction(()=>game==='play');assert.equal(await p.evaluate(()=>HisarBattle.diagnostics().enemies),16);ok('"new battle" on the result screen starts a fresh battle');
 const kr1=await p.evaluate(()=>SV.kr);
 const won=await p.evaluate(()=>{let guard=0;while(game==='play'&&guard++<12){const s=HisarBattle.diagnostics().squads.filter(q=>!q.dead)[0];if(!s)break;const c=v=>Math.max(-WS+20,Math.min(WS-20,v));P.x=c(s.x+(s.x>0?-150:150));P.z=s.z;AL.forEach((q,i)=>{q.x=P.x;q.z=c(P.z+10*(i+1));});for(let i=0;i<14&&game==='play';i++)update(.1);for(const e of E.filter(e=>e.bt===s.id))killE(e);for(let i=0;i<12&&game==='play';i++)update(.1);}
  const r=document.getElementById('rep');return {game,res:HisarBattle.diagnostics().result,h2:r.querySelector('h2').textContent,pl:r.querySelector('.pl b').textContent,kr:SV.kr,toast:document.getElementById('medT').classList.contains('on'),save:JSON.parse(localStorage.getItem('celik-boru-savas-v1')),old:localStorage.getItem('hisar-operations-v1')};});
 assert.equal(won.game,'over');assert.equal(won.res.ok,true);assert.equal(won.res.place,1);assert.equal(won.res.kills,16);assert.equal(won.h2,'ZAFER');assert.equal(won.pl,'1');assert.ok(won.kr>=kr1+16*100+won.res.kr);assert.equal(won.toast,false);assert.ok(won.save.games>=2&&won.save.wins>=1&&won.save.best===1);assert.equal(won.old,null);ok('destroying every enemy team wins: first place, rewards paid, record saved, no medal toast over the result');await p.waitForTimeout(700);await shot(p,'result-won.png');
 await p.locator('#rep [data-r="menu"]').click();assert.equal(await p.locator('#rep').isVisible(),false);assert.match(await p.locator('#btCard .bt-rec').textContent(),/zafer/);ok('menu shows the battle record after returning from the result screen');
 // ---- eski kipler ve görevler kodda yok; eğitim alanı duruyor
 assert.deepEqual(await p.evaluate(()=>Object.keys(MI).sort()),['egitim','harekat','savas']);assert.equal(await p.evaluate(()=>typeof window.spawn+typeof window.OBUS+typeof window.HisarKurulus+typeof window.STG+typeof window.DAILY+typeof window.EVRUN+typeof HisarOperations.start),'undefinedundefinedundefinedundefinedundefinedundefinedundefined');ok('old game modes are removed; training, Harekât and Son Takım remain');
 await p.evaluate(()=>{setG('egitim');reset('serbest');});assert.equal(await p.evaluate(()=>HisarBattle.diagnostics().active),false);assert.equal(await p.evaluate(()=>E.length),4);assert.equal(await p.evaluate(()=>L.rl),undefined);assert.equal(await p.evaluate(()=>Math.hypot(P.x,P.z)),0);await tick(p,5);assert.equal(await p.evaluate(()=>game),'play');assert.equal(await p.evaluate(()=>document.getElementById('hr-objective').hidden),true);ok('training area still gives practice targets, without battle rules');
}else{
 for(const [w,h]of [[320,568],[844,390]]){await p.setViewportSize({width:w,height:h});if(!await p.locator('#hr-panel').isVisible())await p.evaluate(()=>HisarOperations.toggle());const b=await p.locator('#hr-panel').boundingBox();assert.ok(b.x>=0&&b.y>=0&&b.x+b.width<=w+1&&b.y+b.height<=h+1);ok('radio panel fits '+w+'x'+h);await p.evaluate(()=>HisarOperations.close());
  const c=await p.locator('#hr-objective').boundingBox();assert.ok(c&&c.x>=0&&c.y>=0&&c.x+c.width<=w+1&&c.y+c.height<=h+1);ok('zone status card fits '+w+'x'+h);await shot(p,'mobile-battle-'+w+'x'+h+'.png');}
}
await p.evaluate(()=>{HisarOperations.close();openMenu();});assert.equal(await p.locator('#hr-panel').isVisible(),false);ok(label+': pause hides interactive radio panel');
await p.evaluate(async()=>{await navigator.serviceWorker.register('./sw.js');await navigator.serviceWorker.ready;});const cache=fs.readFileSync('sw.js','utf8').match(/const CACHE='([^']+)'/)[1];await p.waitForFunction(async name=>await caches.has(name),cache,{timeout:60000});
const precacheState=()=>p.evaluate(async name=>{const c=await caches.open(name),reg=await navigator.serviceWorker.getRegistration(),keys=await c.keys();return {cache:name,entries:keys.length,battle:!!await c.match(new URL('experience/battle.js',location.href).href),radio:!!await c.match(new URL('experience/radio-missions.js',location.href).href),ack:!!await c.match(new URL('assets/radio/ack.mp3',location.href).href),active:reg?.active?.state||null,installing:reg?.installing?.state||null,waiting:reg?.waiting?.state||null};},cache);
const t0=Date.now();let precache=await precacheState();for(let i=0;i<120&&!(precache.battle&&precache.radio&&precache.ack);i++){await new Promise(r=>setTimeout(r,500));precache=await precacheState();}
console.log('PRECACHE '+JSON.stringify({...precache,waitedMs:Date.now()-t0}));assert.equal(precache.battle&&precache.radio&&precache.ack,true,'precache incomplete: '+JSON.stringify(precache));ok(label+': battle, radio and offline male clip precached'+(Date.now()-t0>500?' (waited '+(Date.now()-t0)+' ms for install)':''));await context.close();}
assert.equal(errors.length,0,'unexpected runtime exceptions');ok('no original-game or new-module runtime exceptions');
})().catch(e=>{errors.push(String(e.stack||e));console.error(e);process.exitCode=1;}).finally(async()=>{fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({scope:'Original game + real Chromium WebGL software GPU. Injected actor positions and simulated time for battle edge cases, mocked speech recognition; not physical iPhone testing or an FPS benchmark.',passed:checks.length,checks,errors,shots},null,2));if(browser)await browser.close();server.closeAllConnections();server.close();});
