const test=require('node:test'),assert=require('node:assert'),fs=require('fs');
const o=require('./ortam.js'),html=fs.readFileSync(__dirname+'/../index.html','utf8'),sw=fs.readFileSync(__dirname+'/../sw.js','utf8'),src=fs.readFileSync(__dirname+'/ortam.js','utf8');
test('distant fighting is heard more often and louder across the border',()=>{for(const r of [0,.5,1]){assert.ok(o.nextGap(true,r)<o.nextGap(false,r));const a=o.rumble(true,r),b=o.rumble(false,r);assert.ok(a.vol>b.vol&&a.cut>b.cut);}
 assert.ok(o.nextGap(true,0)>=7&&o.nextGap(false,1)<=36);});
test('machine-gun bursts are short, evenly spaced rounds',()=>{const b=o.burst(.5);assert.ok(b.length>=4&&b.length<=10);for(let i=1;i<b.length;i++)assert.ok(Math.abs(b[i]-b[i-1]-(b[1]-b[0]))<1e-9);assert.ok(b[b.length-1]<1.2);});
test('synthesised through the game mix, silent in the menu, loaded last and precached',()=>{assert.ok(src.includes('g.connect(MG)'));assert.ok(!/\.mp3|\.ogg|new Audio/.test(src));assert.ok(src.includes("wrap('openMenu'"));
 assert.ok(html.indexOf('experience/arazi.js?v=')<html.indexOf('experience/ortam.js?v='));assert.ok(sw.includes("'experience/ortam.js'"));});
