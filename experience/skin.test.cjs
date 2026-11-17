'use strict';
// "SAHA" görünümü, ÇELİK BÖRÜ adı ve logosu, sadeleşen menü: geri dönmesin diye denetimler.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const html=read('index.html'),skin=read('experience/skin.css'),sw=read('sw.js');
// gömülü görseller ve ses verileri aramayı yanıltmasın
const code=html.replace(/data:[a-z]+\/[-a-z0-9+.]+;base64,[A-Za-z0-9+/=]+/g,'data:,');

test('theme file is linked after the layout file and cached for offline play',()=>{
 const a=html.indexOf('experience/ui.css'),b=html.indexOf('experience/skin.css');assert.ok(a>0&&b>a);
 for(const f of ['experience/skin.css','experience/fonts/hisar-dar-700.woff','experience/fonts/hisar-dar-400.woff','assets/brand/celik-boru.jpg'])assert.ok(sw.includes("'"+f+"'"),f+' is precached');
});
test('the game ships its own condensed typeface with Turkish letters',()=>{
 for(const w of [400,700]){const b=fs.readFileSync(path.join(root,'experience/fonts/hisar-dar-'+w+'.woff'));assert.equal(b.subarray(0,4).toString('latin1'),'wOFF');assert.ok(b.length>8000&&b.length<60000);}
 assert.match(skin,/@font-face\{font-family:"Hisar Dar";src:url\(fonts\/hisar-dar-700\.woff\)/);
 assert.match(skin,/--sf:"Hisar Dar",/);
 assert.match(read('experience/fonts/LISANS.txt'),/GUST Font License/);
});
test('theme loads nothing from other sites',()=>{assert.doesNotMatch(skin,/url\(\s*["']?(?:https?:)?\/\//);assert.doesNotMatch(skin,/@import/);});
test('menu has four icon tabs and no settings tab',()=>{
 assert.match(code,/<div class="tabs"><button data-t="g">Savaş<\/button><button data-t="u">Garaj<\/button><button data-t="k">Kontroller<\/button><\/div>/);
 assert.doesNotMatch(code,/<button data-t="a"/);
 for(const t of ['b','u','k'])assert.match(skin,new RegExp('\\.tabs button\\[data-t="'+t+'"\\]::before\\{'));
 assert.match(skin,/grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
});
test('start button is the ember-coloured primary action; resume shows only while paused',()=>{
 assert.match(code,/<button id="go">BAŞLAT<\/button><button id="rs" style="display:none">DEVAM<\/button>/);
 assert.match(skin,/html body #go\{background:linear-gradient\(180deg,var\(--kirmizi\),var\(--kirmizi2\)\)!important/);assert.match(skin,/--kirmizi:#d0172b;--kirmizi2:#9b0f1f;/);
 assert.match(skin,/#rs\[style\*="none"\]\{display:none!important\}/);
});
test('old duplicate resume buttons and the menu difficulty row are deleted, not hidden',()=>{
 for(const gone of ["id='mX'","id='mRes'",'#mRes','▶ OYUNA DÖN','data-m="kolay"','<h3>ZORLUK</h3>'])assert.ok(!code.includes(gone),gone);
});
test('kill replay camera is removed from the engine and the modules',()=>{
 assert.ok(!code.includes('YAVAŞ ÇEKİM'));assert.ok(!code.includes('TEKRAR İZLEME'));
 assert.doesNotMatch(code,/\bkc\.(?:t|x|z)\b/);assert.doesNotMatch(code,/\brpOn\b/);
 for(const f of ['gameplay.js','polish.js','immersive.js','simple-settings.js'])assert.doesNotMatch(read('experience/'+f),/\bkc\b/,f);
});
test('the game is named ÇELİK BÖRÜ everywhere the player sees a name',()=>{
 assert.match(code,/<title>ÇELİK BÖRÜ<\/title>/);assert.match(code,/apple-mobile-web-app-title" content="ÇELİK BÖRÜ"/);
 assert.match(code,/<h1>ÇELİK BÖRÜ<\/h1>/);assert.ok(!code.includes('HİSAR SİMÜLATÖR'));
 const m=JSON.parse(read('manifest.webmanifest'));assert.equal(m.name,'ÇELİK BÖRÜ');assert.equal(m.short_name,'ÇELİK BÖRÜ');
});
test('installed app starts on the game page that exists',()=>{
 const m=JSON.parse(read('manifest.webmanifest'));assert.equal(m.start_url,'./');assert.equal(m.scope,'./');assert.equal(m.orientation,'any');
 for(const ic of m.icons)assert.ok(fs.existsSync(path.join(root,ic.src.split('?')[0])),ic.src);
});
test('icons and cover art are real images of the expected size',()=>{
 const png=f=>{const b=fs.readFileSync(path.join(root,f));assert.equal(b.subarray(1,4).toString('latin1'),'PNG');return [b.readUInt32BE(16),b.readUInt32BE(20)];};
 assert.deepEqual(png('icon-192.png'),[192,192]);assert.deepEqual(png('icon-512.png'),[512,512]);assert.deepEqual(png('icon-maskable-512.png'),[512,512]);assert.deepEqual(png('apple-touch-icon.png'),[180,180]);assert.deepEqual(png('favicon-32.png'),[32,32]);
 const j=fs.readFileSync(path.join(root,'assets/brand/celik-boru.jpg'));assert.equal(j[0],0xff);assert.equal(j[1],0xd8);assert.ok(j.length>40000&&j.length<400000);
});
test('opening screen is part of the page itself, so a slow first load never shows the bare engine',()=>{
 const head=code.slice(0,code.indexOf('</head>')),body=code.slice(code.indexOf('<body>'));
 assert.match(head,/<style id="spl-style">\n#spl\{position:fixed;inset:0;z-index:100;/);assert.match(head,/#spl \.art\{[^}]*url\(assets\/brand\/celik-boru\.jpg\)/);
 assert.ok(body.startsWith('<body>\n<div id="spl"><div class="art"></div><div class="tx"><h1>ÇELİK BÖRÜ</h1><small>GELİŞTİRİCİ · <b>EMİN KAAN BOYACI</b></small><small id="splV">YÜKLENİYOR</small><i></i></div></div>'),'splash is the first thing in the body');
 assert.ok(body.indexOf('id="spl"')<body.indexOf('<script'),'splash comes before any script');
 assert.doesNotMatch(head,/#spl\{[^}]*pointer-events:none/,'splash blocks taps while loading');assert.match(head,/#spl\.out\{opacity:0;pointer-events:none\}/);
 assert.ok(!code.includes("sp.id='spl'"),'no second, late splash');assert.ok(code.includes("const sp=document.getElementById('spl');if(sp){const v=document.getElementById('splV');if(v)v.textContent='HAZIRLANIYOR';"));
 assert.ok(code.includes('HisarGameBridge.snapshot().ready'),'splash waits until the game is ready');
 assert.ok(code.includes("HisarGameBridge.snapshot().ready&&window.HisarSimpleSettings&&document.getElementById('mpBody')"),'and until the last menu module has built the scroll box');
});
test('garage upgrade cards have their own layout and drawn icons',()=>{
 const g=code.slice(code.indexOf('// ===== m_garage ====='),code.indexOf('// ===== m_ovl ====='));
 assert.ok(g.includes('<div class="ut"><b>'),'text block uses its own class');assert.ok(!g.includes('class="ub"'),'not the in-game button class');assert.ok(!code.includes('.uc .ub'));
 assert.match(g,/\.uc\{display:grid;grid-template-columns:40px minmax\(0,1fr\) auto;/);assert.doesNotMatch(g,/\p{Extended_Pictographic}/u);
 assert.equal((g.match(/\{k:'\w+',g:'[tdb]',ic:'M/g)||[]).length,17,'every upgrade has a drawn icon');
 for(const gone of ['ALINABİLİR','id="rk"','REKORLAR','id="rcd"',"getElementById('gkr')",'const UPG='])assert.ok(!code.includes(gone),gone);
 const d=code.slice(code.indexOf('// ===== m_drone2 ====='),code.indexOf('// ===== m_units2 ====='));assert.doesNotMatch(d.slice(0,d.indexOf('function bodyUI')),/ic:'\p{Extended_Pictographic}/u);assert.ok(d.includes('#dBody button{display:grid;grid-template-columns:40px minmax(0,1fr) auto;'));
});
test('update button steps aside when the menu is scrolled',()=>{
 assert.ok(code.includes("if(t&&t.id==='mpBody'){const k=t.scrollTop>24;box.classList.toggle('away',k);document.body.classList.toggle('kaydi',k)}"));assert.match(skin,/html body #mp #updBox\.away\{display:none!important\}/);
 assert.match(skin,/html body\.kaydi #mp \.hd\{background:#0b0e12!important;/,'top bar turns solid over scrolled content');
});
test('phones render lighter: fast shadows, small shadow map, other tanks and trees use blob shadows',()=>{
 const m=code.slice(code.indexOf('// ---------------- MOBIL KALITE'),code.indexOf('// ===== m_armor ====='));
 assert.ok(m.includes('const sz=hi?2048:1024;'));assert.ok(m.includes('R.shadowMap.type=THREE.PCFShadowMap'));assert.ok(m.includes("R.shadowMap.autoUpdate=false;FRAME_HOOKS.push(()=>{fr++;if(qlv==='yuksek'||(fr&1))R.shadowMap.needsUpdate=true})"));
 assert.ok(m.includes("window.TREE_BLOB=!hi;"));assert.ok(m.includes("for(const a of AL)lite(a.g);for(const e of E)if(e.type==='tank'||e.type==='apc')lite(e.g)"));
 const t=code.slice(code.indexOf('// ===== m_trees ====='),code.indexOf('// ===== m_nature ====='));assert.ok(t.includes("const mv=OV?8:20;if(force||DIRTY||Math.abs(cx-lcx)>mv||Math.abs(cz-lcz)>mv||"),'trees are repacked only when needed');
});
test('tank drives heavy (speed and turn ramp up), allies keep up',()=>{
 assert.ok(code.includes('const DRV=Object.freeze({vf:12,vr:4.5,off:.8,acc:3.4,brk:9,turn:1.05,tacc:7});'));assert.ok(code.includes('drive(ix,iy,sp,dt);ramB();pushOut(P,2.6);'));assert.ok(code.includes("mv=Math.min(a.cmd==='attack'?15.5:14.5,d*.8)"));
 assert.ok(code.includes('gg.index.updateRange.offset=0;gg.index.updateRange.count=o;gg.index.needsUpdate=true;'),'only the used part of the ground index is uploaded');
});
test('save can be backed up as a code and restored without losing progress',()=>{
 for(const part of ["function backupCode(){","function restoreCode(text){","window.HISAR_BACKUP={code:backupCode,restore:restoreCode,merge:mergeMax};",'data-bk="copy">KAYDI YEDEKLE','data-bk="open">YEDEK KODU GİR'])assert.ok(code.includes(part),part);
});
test('map header is plain text and garage tabs carry no emoji',()=>{
 assert.match(code,/<div id="fmT"><b>HARİTA<\/b><small><\/small><\/div>/);
 assert.match(code,/\[\['t','Tank'\],\['d','Uçangöz'\],\['b','Birlik'\]\]/);
});
test('menu camera follows the tank window instead of a fixed offset',()=>{
 assert.match(code,/SP\.getBoundingClientRect\(\)/);assert.match(skin,/html body #menu #heroSp\{display:block!important;flex:0 0 clamp\(104px,19vh,176px\);min-height:0\}/);
 assert.match(skin,/html body\[data-tab="g"\] #menu #heroSp\{flex:1 1 auto;min-height:150px\}/,'on the home tab the tank scene takes all free space');assert.ok(code.includes("document.body.dataset.tab=t;"));assert.ok(code.includes("document.body.dataset.tab='g';"));
});
test('menu header has no rank badge (removed in build 94)',()=>{
 assert.ok(!skin.includes('#rb2'));assert.ok(!code.includes("'rb2'"));assert.ok(!code.includes('id="rb2"'));
});
test('result screen has a two-column layout for landscape phones and the full map opens on the safe zone',()=>{
 assert.match(code,/@media \(orientation:landscape\) and \(max-height:520px\)\{#rep \.c\{width:min\(780px,100%\);display:grid;/);
 assert.ok(code.includes('const v=window.MAPVIEW&&window.MAPVIEW();if(v){vx=v.x;vz=v.z;s=clamp(Math.min(W,H)/(2*v.r),s0*.9,s0*40);clampView()}'));
 assert.match(read('experience/battle.js'),/root\.MAPVIEW=\(\)=>\{if\(!B\|\|B\.over\)return null;/);
});
test('menu is the "hangar" design: dark panels over the full-screen tank scene, floating tab bar',()=>{
 assert.match(skin,/:root\{--cam:rgba\(13,14,13,\.86\);--cam-koyu:rgba\(8,9,8,\.95\);/);
 assert.match(skin,/html body #mpBody>\.tabs\{position:fixed!important;z-index:8;left:calc\(var\(--kenar\) \+ env\(safe-area-inset-left,0px\)\);right:calc\(var\(--kenar\) \+ env\(safe-area-inset-right,0px\)\);bottom:calc\(10px \+ env\(safe-area-inset-bottom,0px\)\);/);
 assert.match(skin,/html body:not\(\[data-tab="g"\]\) #mpBody>section\{[^}]*background:var\(--cam-koyu\);/);
 assert.match(skin,/@media \(prefers-reduced-motion:reduce\)\{html body #go::after\{animation:none;display:none\}\}/,'the button shine respects reduced motion');
 assert.doesNotMatch(skin.slice(skin.indexOf('ANA MENÜ "HANGAR"'),skin.indexOf('eski ayarlar bölümü')),/border-radius:3px/,'no leftover flat corners in the menu');
 assert.ok(code.includes('<div class="hd"><div class="logo"></div><h1>ÇELİK BÖRÜ</h1>'),'no emoji logo in the page source');
});
test('team size is chosen on the home card',()=>{const b=read('experience/battle.js');
 assert.ok(b.includes("for(const [k,n,sub] of [[0,'TEK','1 tank'],[1,'KISIM','2 tank'],[3,'TAKIM','4 tank']])"));assert.ok(b.includes("SV.form=+b.dataset.bf;root.save();"));assert.ok(b.includes('#btCard .bt-seg button.sel{background:linear-gradient(180deg,var(--kor1,#ffc247),var(--kor2,#ff8a1e));'));
});
test('menus never blur what is behind them: on iPhone a blurred panel over the 3D view can turn invisible',()=>{
 assert.doesNotMatch(skin,/backdrop-filter:\s*blur/);assert.doesNotMatch(read('experience/battle.js'),/backdrop-filter:\s*blur/);
 assert.match(skin,/html body #hisar-experience\{[^}]*background:linear-gradient\(180deg,#181d25,#0d1014\)!important/,'settings sheet is opaque');
 assert.match(skin,/html body #rep \.c,html body #rep2 \.c,html body #tutEnd \.c\{[^}]*background:linear-gradient\(180deg,#181d25,#0d1014\)!important/);
});
test('3D view fills the whole screen: no safe-area padding on the root element',()=>{
 assert.ok(code.includes(':root{--fg:#e6efd8;--ac:#8fbf4d;--bg:#10150f}'));
 assert.doesNotMatch(code.slice(0,code.indexOf('</style>')),/:root\{[^}]*padding-(top|bottom):env\(safe-area/,'a padded root pushes the canvas below the notch and out of line with the sight overlays');
});
test('controls tab is a short list for touch and for keyboard, built in one place',()=>{
 assert.ok(code.includes('<section id="tk"></section>'));assert.ok(!code.includes("'#tk .kl'"),'no module patches the old text block');
 assert.ok(code.includes("tk.innerHTML='<div class=\"kseg\"><button type=\"button\" data-k=\"d\">Dokunmatik</button><button type=\"button\" data-k=\"k\">Klavye</button></div>'"));
 assert.ok(code.includes("sec(document.body.classList.contains('tc')||matchMedia('(pointer:coarse)').matches?'d':'k')"),'opens on the list that fits the device');
 assert.match(skin,/html body #tk\[data-k="d"\] \.klist\[data-k="d"\],html body #tk\[data-k="k"\] \.klist\[data-k="k"\]\{display:block\}/);
 for(const k of ['W','A','S','D','V','C','T','G','B','Q','Z','N','O','P'])assert.ok(code.includes("'"+k+"'"),k);
});
test('garage list shows the country as text, not as an emoji flag',()=>{
 const g=code.slice(code.indexOf('// ---------- TANK TANIMLARI ----------'),code.indexOf('// 3B onizleme'));
 assert.ok(!g.includes('flag:'));assert.doesNotMatch(g,/\p{Regional_Indicator}|☭|✔/u);
 assert.ok(g.includes("'</em><small>'+q.u+' · '+q.cap+'</small></button>'"));assert.ok(g.includes("o.u.toLocaleUpperCase('tr-TR')"));
 assert.match(skin,/html body #menu #galL button\{display:grid!important;grid-template-columns:minmax\(0,1fr\) auto;/);
});
test('profile card is styled by classes and upper-cases rank names by Turkish rules',()=>{
 const m=code.slice(code.indexOf('// ---- profil karti'),code.indexOf('// ---- kayıt yedeği'));
 assert.ok(m.includes("cur[1].toLocaleUpperCase('tr-TR')"));assert.doesNotMatch(m,/style="(?!width:)/,'only the progress width is inline');
 assert.ok(code.includes("#rep2{position:fixed;inset:0;z-index:34;display:none;"));
});
test('landscape menu keeps the scroll box full-screen so its fixed bars are never clipped',()=>{
 const l=skin.slice(skin.indexOf('@media (min-aspect-ratio:1/1){'),skin.indexOf('@media (min-aspect-ratio:1/1) and (min-width:1100px)'));
 assert.doesNotMatch(l,/#mp>#mpBody\{[^}]*width:calc\(var\(--panel\)/,'the scroller is not narrowed to the panel');
 assert.match(l,/html body #mpBody>section,html body:not\(\[data-tab="g"\]\) #mpBody>section\{[^}]*width:calc\(var\(--panel\) \+ env\(safe-area-inset-right,0px\)\)!important;margin:0 0 0 auto!important;/);
 assert.match(l,/html body #mp \.acts\{left:auto;right:0;bottom:0!important;height:auto!important;/);
});
test('menu scroll box is built by the page itself, not by a module that loads later',()=>{
 const g=code.slice(code.indexOf('// ===== m_govde ====='));
 assert.ok(g.includes("const b=document.createElement('div');b.id='mpBody';for(const ch of [...mp.children])if(!ch.classList.contains('acts'))b.appendChild(ch);mp.insertBefore(b,mp.firstChild);"));
 assert.ok(!read('experience/radio-missions.js').includes('mpBody'),'the radio module no longer rearranges the menu');
});
test('upgrades added by later modules also use drawn icons',()=>{
 const m=code.slice(code.indexOf('// ---------------- 0) garaj: yeni donanimlar'),code.indexOf('// ---------------- 1) YAKIT'));
 assert.equal((m.match(/ic:cz\('M/g)||[]).length,3);assert.doesNotMatch(m,/\p{Extended_Pictographic}/u);
});

