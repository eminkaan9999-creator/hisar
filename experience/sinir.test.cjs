const test=require('node:test'),assert=require('node:assert'),fs=require('fs');
const c=require('./sinir.js'),html=fs.readFileSync(__dirname+'/../index.html','utf8'),src=fs.readFileSync(__dirname+'/sinir.js','utf8'),sw=fs.readFileSync(__dirname+'/../sw.js','utf8');
const riv=x=>120+Math.sin((x+60)*.03)*15,F=[-560,-240,70,400,660];
test('Turkish flag follows the flag law proportions',()=>{const f=c.FLAG,G=f.h;
 assert.equal(f.w/G,1.5);assert.equal(f.outer.r*2,G/2);assert.ok(Math.abs((f.inner.x-f.outer.x)-G/16)<1e-9);assert.equal(f.inner.r*2,G*2/5);assert.equal(f.star.r*2,G/4);assert.equal(f.red,'#e30a17');
 const s=c.starPts(0,0,1);assert.equal(s.length,10);assert.ok(Math.abs(s[0][0]+1)<1e-9&&Math.abs(s[0][1])<1e-9,'one star point faces the crescent');});
test('the wall runs north of the river and only the gates are open',()=>{
 for(const x of[-700,-100,300,700])assert.ok(c.wallZ(riv,x)<riv(x)-20);for(const f of F)assert.ok(c.atGate(F,f+10)&&!c.atGate(F,f+20));
 const x=230,w=c.wallZ(riv,x);assert.equal(c.blocked(riv,F,x,w-1,x,w+1),true);assert.equal(c.blocked(riv,F,70,c.wallZ(riv,70)-1,70,c.wallZ(riv,70)+1),false);
 assert.equal(c.blocked(riv,F,x,w-1,x,w+40),false,'a teleport is not a crossing');assert.equal(c.turkish(riv,0,-300),true);assert.equal(c.turkish(riv,0,400),false);});
test('watchtowers keep clear of the gates; poses exist for salute and patrol',()=>{const t=c.towersAlong(F,800);assert.ok(t.length>=6);for(const x of t)assert.ok(F.every(f=>Math.abs(x-f)>50));
 const s=c.pose('selam',0);assert.ok(s.UR&&s.FR&&s.UR[2]<-1&&s.FR[2]<-2);const w=c.pose('nobet-yuru',1);assert.ok(w.LL&&w.FR);});
test('loaded after realism, precached, wired into the game',()=>{assert.ok(html.indexOf('experience/realism.js?v=')<html.indexOf('experience/sinir.js?v='));assert.ok(sw.includes("'experience/sinir.js'"));
 for(const k of["wrap('buildGrid'","wrap('impact'","Sivil yerleşim hedef alanında!","function kirpis(","function houseFlags(","function schools(","function karakol("])assert.ok(src.includes(k),k);});
test('the wall model is laid end to end between the gates: equal sections, no gaps, none inside a gate',()=>{const st=c.stretches(F,800,c.WALL.gate,2.8);assert.equal(st.length,F.length+1);
 assert.deepEqual(st[0],[-797.2,-574]);assert.deepEqual(st[st.length-1],[674,797.2]);for(const [a,b] of st){assert.ok(b>a);for(const f of F)assert.ok(b<=f-c.WALL.gate+1e-9||a>=f+c.WALL.gate-1e-9);}
 const t=c.tile(0,20,6.75);assert.equal(t.length,3);assert.equal(t[0][0],0);assert.equal(t[2][1],20);for(let i=1;i<t.length;i++)assert.equal(t[i][0],t[i-1][1]);assert.deepEqual(c.tile(0,2,6.75),[[0,2]]);
 assert.ok(src.includes("for(const m of WOLD||[]){S.remove(m);m.geometry.dispose();m.material.dispose();}WOLD=null;"),'the old block wall is removed once the model arrives');
 assert.ok(src.includes("const a=WM.assign(ds,lv);"));assert.ok(!/unimog/i.test(src),'patrol vehicles are the Kirpi model now');assert.ok(src.includes("g.name='SN_KIRPI'"));});
