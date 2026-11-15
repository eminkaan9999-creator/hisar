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
test('start button is the yellow primary action; resume shows only while paused',()=>{
 assert.match(code,/<button id="go">BAŞLAT<\/button><button id="rs" style="display:none">DEVAM<\/button>/);
 assert.match(skin,/html body #go\{background:linear-gradient\(180deg,#ffdb4d,#f0b800\)/);
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
 assert.ok(!code.includes("sp.id='spl'"),'no second, late splash');assert.ok(code.includes("const sp=document.getElementById('spl');if(sp){const v=document.getElementById('splV');if(v)v.textContent='SÜRÜM '+VER;"));
 assert.ok(code.includes('HisarGameBridge.snapshot().ready'),'splash waits until the game is ready');
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
 assert.ok(code.includes("if(t&&t.id==='mpBody')box.classList.toggle('away',t.scrollTop>24)"));assert.match(skin,/html body #mp #updBox\.away\{display:none!important\}/);
});
test('phones render lighter: fast shadows, small shadow map, other tanks and trees use blob shadows',()=>{
 const m=code.slice(code.indexOf('// ---------------- MOBIL KALITE'),code.indexOf('// ===== m_armor ====='));
 assert.ok(m.includes('const sz=hi?2048:1024;'));assert.ok(m.includes('R.shadowMap.type=THREE.PCFShadowMap'));assert.ok(m.includes("R.shadowMap.autoUpdate=false;FRAME_HOOKS.push(()=>{fr++;if(qlv==='yuksek'||(fr&1))R.shadowMap.needsUpdate=true})"));
 assert.ok(m.includes("window.TREE_BLOB=!hi;"));assert.ok(m.includes("for(const a of AL)lite(a.g);for(const e of E)if(e.type==='tank'||e.type==='apc')lite(e.g)"));
 const t=code.slice(code.indexOf('// ===== m_trees ====='),code.indexOf('// ===== m_nature ====='));assert.ok(t.includes("if(force||DIRTY||Math.abs(cx-lcx)>20||Math.abs(cz-lcz)>20||"),'trees are repacked only when needed');
});
test('tank moves faster and allies keep up',()=>{
 assert.equal(code.split('*iy*16*(1+.07*SV.U.eng)*sp*dt').length-1,2);assert.ok(code.includes('P.h-=ix*1.7*(1+.06*SV.U.eng)'));assert.ok(code.includes("mv=Math.min(a.cmd==='attack'?15.5:14.5,d*.8)"));
 assert.ok(code.includes('gg.index.updateRange.offset=0;gg.index.updateRange.count=o;gg.index.needsUpdate=true;'),'only the used part of the ground index is uploaded');
});
test('save can be backed up as a code and restored without losing progress',()=>{
 for(const part of ["const BKEYS=['m60v2','celik-boru-savas-v1'];","function backupCode(){","function restoreCode(text){","window.HISAR_BACKUP={code:backupCode,restore:restoreCode,merge:mergeMax};",'data-bk="copy">KAYDI YEDEKLE','data-bk="open">YEDEK KODU GİR'])assert.ok(code.includes(part),part);
});
test('map header is plain text and garage tabs carry no emoji',()=>{
 assert.match(code,/<div id="fmT"><b>HARİTA<\/b><small><\/small><\/div>/);
 assert.match(code,/\[\['t','Tank'\],\['d','Uçangöz'\],\['b','Birlik'\]\]/);
});
test('menu camera follows the tank window instead of a fixed offset',()=>{
 assert.match(code,/SP\.getBoundingClientRect\(\)/);assert.match(skin,/#heroSp\{display:block!important;flex:0 1 min\(27vh,240px\);min-height:118px\}/);
});
test('rank and credits sit on two lines so the developer name is never cut off',()=>{
 assert.match(skin,/html body #rb2\.pill\{flex:none;display:flex!important;flex-direction:column;align-items:flex-end/);
 assert.ok(code.includes("$('rb2').innerHTML='<b>★ '+rankOf().n+'</b><i>'+SV.kr.toLocaleString('tr-TR')+' kr</i>';"));
});
test('result screen has a two-column layout for landscape phones and the full map opens on the safe zone',()=>{
 assert.match(code,/@media \(orientation:landscape\) and \(max-height:520px\)\{#rep \.c\{width:min\(780px,100%\);display:grid;/);
 assert.ok(code.includes('const v=window.MAPVIEW&&window.MAPVIEW();if(v){vx=v.x;vz=v.z;s=clamp(Math.min(W,H)/(2*v.r),s0*.9,s0*40);clampView()}'));
 assert.match(read('experience/battle.js'),/root\.MAPVIEW=\(\)=>\{if\(!B\|\|B\.over\)return null;/);
});
