'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
function replaceOnce(s,a,b){if(s.includes(b))return s;if(s.split(a).length!==2)throw Error('Range integration anchor changed: '+a.slice(0,70));return s.replace(a,b);}
let s=fs.readFileSync('poligon/index.html','utf8');
const helper='function rangeFrameDelta(now,previous){return Number.isFinite(now)&&Number.isFinite(previous)?Math.max(0,Math.min(.05,(now-previous)/1000)):0;}';
s=replaceOnce(s,'let last=performance.now(),t=0,hudT=0,windT=0;',helper+'\nlet last=performance.now(),t=0,hudT=0,windT=0;');
s=replaceOnce(s,'  const dt=Math.min(.05,(now-last)/1000);last=now;t+=dt;',`  // A first requestAnimationFrame timestamp can precede the initialization clock.
  now=Number.isFinite(now)?now:performance.now();
  const dt=rangeFrameDelta(now,last);last=now;
  if(window.HisarKurulusSession?.diagnostics?.().paused){requestAnimationFrame(frame);return;}
  t+=dt;`);
s=replaceOnce(s,'function render(now){','function render(now){\n  if(!Number.isFinite(W)||!Number.isFinite(H)||W<=0||H<=0){resize();if(!Number.isFinite(W)||!Number.isFinite(H)||W<=0||H<=0)return;}');
s=replaceOnce(s,'function metalFill(x0,y0,x1,y1,base,hi){const g=',"function metalFill(x0,y0,x1,y1,base,hi){if(![x0,y0,x1,y1].every(Number.isFinite))throw Error('Poligon geometry: '+JSON.stringify({W,H,mis:S.mis,pos:S.pos,rifle:S.rifle,hr:S.hr,clock:last}));const g=");
for(const m of s.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){if(/src\s*=|type=['"](?:module|application\/json)/i.test(m[1]))continue;new vm.Script(m[2]);}
fs.writeFileSync('poligon/index.html',s);
const context={};vm.runInNewContext(helper+';this.delta=rangeFrameDelta;',context);
for(const [now,previous,expected]of [[9,10,0],[10,10,0],[25,10,.015],[9000,10,.05],[NaN,10,0],[10,Infinity,0]])assert.equal(context.delta(now,previous),expected);
// User-visible naming only, without renaming native JavaScript control identifiers.
let site=fs.readFileSync('santiye-250888c5/index.html','utf8');
for(const [a,b]of [['🛸 DRON','🛸 UÇANGÖZ'],['DRONU İNDİR','UÇANGÖZÜ İNDİR'],['Yedek dronu','Yedek uçangözü'],['Yedek dron havada','Yedek uçangöz havada']])site=site.split(a).join(b);
fs.writeFileSync('santiye-250888c5/index.html',site);
console.log('Range first-frame/paused-clock checks passed; invalid viewports cannot enter rendering.');
