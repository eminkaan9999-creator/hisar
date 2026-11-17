'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const html=fs.readFileSync(__dirname+'/../index.html','utf8'),start=html.indexOf('let tabT=0,tabDown=0;'),stop=html.indexOf("addEventListener('pointermove',e=>{if(!open)return;",start),wheel=html.slice(start,stop);
function app(state='menu'){
 const listeners={},calls=[],timers=new Map();let id=0,overlay=false;
 const c={game:state,open:false,vx:0,vy:0,document:{querySelector:()=>overlay?{}:null},addEventListener:(t,f)=>listeners[t]=f,
 setTimeout:f=>{timers.set(++id,f);return id;},clearTimeout:i=>timers.delete(i),show:()=>{c.open=true;calls.push('show');},hide:commit=>{c.open=false;calls.push(commit?'commit':'cancel');},sw:()=>calls.push('switch')};
 vm.createContext(c);vm.runInContext(wheel,c);
 function key(type,editing=false){const e={key:'Tab',repeat:false,target:{closest:()=>editing?{}:null},prevented:false,stopped:false,preventDefault(){this.prevented=true;},stopImmediatePropagation(){this.stopped=true;}};listeners[type](e);return e;}
 return {c,calls,key,overlay:v=>overlay=v,hold(){for(const f of [...timers.values()])f();timers.clear();}};
}
test('native wheel leaves Tab and Shift+Tab available in menu, pause and result screens',()=>{for(const state of ['menu','pause','over']){const a=app(state);assert.equal(a.key('keydown').prevented,false);assert.equal(a.key('keyup').prevented,false);assert.deepEqual(a.calls,[]);}});
test('an orphan Tab release cannot change a vehicle after leaving a menu',()=>{const a=app('menu');a.key('keydown');a.c.game='play';a.key('keyup');assert.deepEqual(a.calls,[]);});
test('ordinary in-game Tab tap still changes vehicle exactly once',()=>{const a=app('play');assert.equal(a.key('keydown').prevented,true);a.key('keyup');a.key('keyup');assert.deepEqual(a.calls,['switch']);});
test('ordinary in-game Tab hold still opens and commits the original command wheel',()=>{const a=app('play');a.key('keydown');a.hold();a.key('keyup');assert.deepEqual(a.calls,['show','commit']);});
test('radio/briefing/form focus cannot launch the wheel and opening a panel cancels a pending hold',()=>{const a=app('play');a.overlay(true);assert.equal(a.key('keydown').prevented,false);a.key('keyup');assert.deepEqual(a.calls,[]);a.overlay(false);assert.equal(a.key('keydown',true).prevented,false);a.key('keyup',true);a.key('keydown');a.overlay(true);a.hold();a.key('keyup');assert.deepEqual(a.calls,[]);});
test('pausing during a held Tab releases it without selecting a vehicle',()=>{const a=app('play');a.key('keydown');a.c.game='pause';a.key('keyup');a.hold();assert.deepEqual(a.calls,[]);});
