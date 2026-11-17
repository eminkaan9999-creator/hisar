'use strict';
// Executes the shipped module, with controlled engine inputs. It does not
// simulate WebGL, collisions, aiming, pathfinding or a human playthrough.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const key='celik-boru-harekat-v1';
const root=path.join(__dirname,'../..');
function production(file){return process.env.HISAR_AUDIT_BASELINE==='1'
 ?require('node:child_process').execFileSync('git',['show','dd4d52ddcda238438587e7f825c2a19d62ba5486:'+file],{cwd:root,encoding:'utf8',maxBuffer:32*1024*1024})
 :fs.readFileSync(path.join(root,file),'utf8');}
const missionSource=production('experience/harekat.js'),indexSource=production('index.html');
function runtime(options={}){
 const data=options.data||new Map();
 if(options.saved!==undefined)data.set(key,JSON.stringify(options.saved));
 const events=[],writes=[],listeners={},math=Object.create(Math);math.random=()=>.5;
 const doc={body:null,hidden:false,head:null,getElementById:()=>null,
  addEventListener(n,f){(listeners[n]||(listeners[n]=[])).push(f);}};
 const c={document:doc,Math:math,console,game:'menu',mis:'harekat',lvKey:'normal',lvSel:'normal',
  LV:{normal:{hp:100,sp:5},kolay:{hp:130},zor:{hp:80},serbest:{hp:100}},L:{},
  P:{x:0,z:0,h:0,th:0,hp:100,mx:100,v:0,w:0,dz:{trk:100,eng:100,tur:100}},E:[],AL:Array.from({length:3},(_,idx)=>({idx,hp:100,mx:100,dead:false,g:{position:{set(){}},rotation:{}}})),
  HPT:{tank:100,apc:80,inf:40,arty:80,truck:80,fuel:80,radar:80,aa:80,bunker:100},
  HELI:[],ED:[],MI:{},MAPX:[],NAV:{on:false},NVG:{on:options.nvg||0},wx:options.weather||'gunduz',
  SV:{wx:options.weather||'gunduz'},ammo:6,AMX:()=>6,TA:[26,16,7,14],TA0:[26,16,7,14],yaw:0,cd:0,DC:9,dk:1,chg:100,mode:'tank',DR:{on:false},
  hAt:()=>0,riv:x=>120+Math.sin((x+60)*.03)*15,
  astar:(x,z,tx,tz)=>[[x,z],[tx,tz]],setTimeout(){},
  localStorage:{getItem:k=>data.get(k)??null,setItem(k,v){if(c.denyWrite)throw Error('storage unavailable');data.set(k,v);writes.push(k);}},
  save(){c.localStorage.setItem('m60v2',JSON.stringify(c.SV));},
  setW(w){c.wx=w;c.SV.wx=w;c.save();},setG(g){c.mis=g;},
  addE(type,x,z,o){const e={type,x,z,h:o.h||0,hp:100,mx:100};c.E.push(e);return e;},
  killE(e){e.hp=0;c.E=c.E.filter(q=>q!==e);},
  radio:t=>events.push({kind:'radio',text:t}),say:t=>events.push({kind:'say',text:t}),
  sndBoom:(x,z)=>events.push({kind:'shot',x,z}),bigBoom:(x,z)=>events.push({kind:'impact',x,z}),
  startNav(t){c.NAV={on:true,to:t,len:Math.hypot(c.P.x-t.x,c.P.z-t.z)};},stopNav(){c.NAV.on=false;},
  S:{remove(){}},
  startMission(){},stagePending:()=>false,spotted:()=>false,eshot(){events.push({kind:'enemy-shot'});},
  pickTgt:(e,d)=>({x:c.P.x,z:c.P.z,d,al:null}),hitAl(a,k){a.hp-=k;},
  spawnHeli(){c.HELI.push({});},spawnED(){c.ED.push({});},
  openMenu(){if(c.game==='play')c.game='pause';},
  endGame(ok,text){if(c.game!=='play')return;c.game='over';events.push({kind:'end',ok,text});c.openMenu();},
  reset(k){c.lvKey=k;c.E=[];c.game='play';c.P.hp=c.P.mx=100;c.startMission();},
  update(dt){if(c.engineStep)c.engineStep(dt);}
 };
 c.window=c;vm.createContext(c);
 const source=options.source||missionSource;
 vm.runInContext(production('experience/checkpoint.js'),c,{filename:'experience/checkpoint.js'});
 vm.runInContext(source,c,{filename:'experience/harekat.js'});
 if(options.campaign)vm.runInContext(production('experience/safak.js'),c,{filename:'experience/safak.js'});
 doc.body={classList:{add(){},remove(){}}};
 return {c,data,events,writes,hk:c.HisarHarekat,doc,
  start(id){return c.HisarHarekat.start(id);},
  to(p){c.P.x=p.x;c.P.z=p.z;},
  clear(pred=()=>true){for(const e of [...c.E])if(pred(e))c.killE(e);},
  run(seconds,dt=.1){for(let t=0;t<seconds-1e-8;t+=dt)c.update(Math.min(dt,seconds-t));},
  snapshot(){return JSON.parse(JSON.stringify(c.HisarHarekat.diagnostics()));}
 };
}
function backup(data=new Map()){
 const html=indexSource;
 const start=html.indexOf('const BKEYS=['),endMark='window.HISAR_BACKUP={code:backupCode,restore:restoreCode,merge:mergeMax};';
 const end=html.indexOf(endMark,start);if(start<0||end<0)throw Error('backup production block missing');
 const writes=[],c={window:{HisarCheckpoint:{core:require('../checkpoint.js')}},localStorage:{getItem:k=>data.get(k)??null,setItem(k,v){data.set(k,v);writes.push(k);}},persist(){},
  btoa:s=>Buffer.from(s,'binary').toString('base64'),atob:s=>Buffer.from(s,'base64').toString('binary'),encodeURIComponent,decodeURIComponent,escape,unescape};
 vm.createContext(c);vm.runInContext(html.slice(start,end+endMark.length),c,{filename:'index.html:backup'});
 return {api:c.window.HISAR_BACKUP,data,writes};
}
module.exports={runtime,backup,key,production};
