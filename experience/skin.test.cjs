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
 assert.match(code,/<div class="tabs"><button data-t="g">Görev<\/button><button data-t="u">Garaj<\/button><button data-t="k">Kontroller<\/button><\/div>/);
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
test('opening screen shows the cover art, the name and the developer',()=>{
 assert.match(code,/sp\.id='spl';sp\.innerHTML='<div class="art"><\/div><div class="tx"><h1>ÇELİK BÖRÜ<\/h1><small>GELİŞTİRİCİ · <b>EMİN KAAN BOYACI<\/b><\/small>/);
 assert.match(code,/#spl \.art\{[^}]*url\(assets\/brand\/celik-boru\.jpg\)/);
});
test('map header is plain text and garage tabs carry no emoji',()=>{
 assert.match(code,/<div id="fmT"><b>HARİTA<\/b><small><\/small><\/div>/);
 assert.match(code,/\[\['t','Tank'\],\['d','Uçangöz'\],\['b','Birlik'\]\]/);
});
test('menu camera follows the tank window instead of a fixed offset',()=>{
 assert.match(code,/SP\.getBoundingClientRect\(\)/);assert.match(skin,/#heroSp\{display:block!important;flex:0 1 min\(27vh,240px\);min-height:118px\}/);
});
