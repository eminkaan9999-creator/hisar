const test=require('node:test'),assert=require('node:assert'),fs=require('fs');
const a=require('./atis.js'),h=require('./harita.js'),c=require('./carpisma.js');
const html=fs.readFileSync(__dirname+'/../index.html','utf8'),sw=fs.readFileSync(__dirname+'/../sw.js','utf8'),fld=fs.readFileSync(__dirname+'/field.js','utf8'),crew=fs.readFileSync(__dirname+'/crew-orders.js','utf8');
test('gun recoil rocks the hull and settles within a second',()=>{const r={a:0,v:a.ROCK.kick};let peak=0;for(let i=0;i<20;i++){a.rockStep(r,.05);peak=Math.max(peak,Math.abs(r.a));}assert.ok(peak>.02&&peak<=a.ROCK.max);assert.ok(Math.abs(r.a)<.004);});
test('spent casings fly out, fall and come to rest on the ground',()=>{const k={x:0,y:2,z:0,vx:3,vy:2,vz:0,r:0,w:20,t:0};for(let i=0;i<200;i++)a.casingStep(k,.02,0);assert.ok(k.x>1);assert.ok(Math.abs(k.y-.02)<1e-9);assert.ok(k.b>=1);});
test('crew voice is male: a Turkish male voice is preferred, otherwise the Turkish voice is read deeper',()=>{
 assert.equal(a.voicePick([{lang:'tr-TR',name:'Yelda'},{lang:'tr-TR',name:'Cem'}]).voice.name,'Cem');const f=a.voicePick([{lang:'tr-TR',name:'Yelda'}]);assert.equal(f.male,false);assert.ok(f.pitch<.6);
 assert.ok(html.includes("u.pitch=VMALE?(it.r?.85:.92):(it.r?.5:.56)"));assert.ok(crew.includes("const vp=safe(()=>root.trVoice(),null);"));});
test('mini map shows the real terrain around the tank',()=>{assert.deepEqual(h.toMini(10,20,{x:10,z:20},440,132),[66,66]);const s=h.srcRect({x:0,z:0},440,800,400);assert.equal(s[2],110);assert.equal(s[0],145);
 assert.ok(html.includes("if(window.MMBG)MMBG(mmx,O,W);else{"));});
test('trees fall away from the tank; berms flatten',()=>{assert.equal(c.fallAngle(0),0);assert.ok(c.fallAngle(c.TREE.fall)>1.5);const ax=c.fallAxis(0,5);assert.equal(ax.x,1);
 assert.ok(fld.includes('function crush(x,z,r){'));assert.ok(fld.includes('root.HisarField=Object.freeze({core,crush,uncrush,'));});
test('new modules load in order and are precached',()=>{let i=html.indexOf('experience/harekat.js?v=');for(const m of['atis','harita','carpisma']){const j=html.indexOf('experience/'+m+'.js?v=');assert.ok(j>i,m);i=j;assert.ok(sw.includes("'experience/"+m+".js'"));}});
