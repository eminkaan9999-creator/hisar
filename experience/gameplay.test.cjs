'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const api=require('./gameplay.js'),src=fs.readFileSync(__dirname+'/gameplay.js','utf8');
for(const input of [null,undefined,5,[],{},'bad',{droneView:'bad',targetLabels:'false',balancedDrops:0}])test('settings normalize '+JSON.stringify(input),()=>{const v=api.settings(input);assert.equal(Object.keys(v).length,7);assert.ok(['fpv','follow'].includes(v.droneView));});
test('unknown preference keys cannot enter settings',()=>assert.ok(!('intruder' in api.settings({intruder:true}))));
for(const d of [0,1,2,5,8,10,20])test('falloff bounded at '+d,()=>{const f=api.blastFactor(d,10,false);assert.ok(f>=0&&f<=1);if(d>=10)assert.equal(f,0);});
test('game blast diminishes outward and stops at cover',()=>{assert.ok(api.blastFactor(1,10,false)>api.blastFactor(8,10,false));assert.equal(api.blastFactor(1,10,true),0);});
test('invalid blast parameters neutral',()=>{for(const d of [NaN,Infinity])assert.equal(api.blastFactor(d,10,false),0);assert.equal(api.blastFactor(2,0,false),0);});
test('arcade carry is capped and rejects teleports',()=>{assert.ok(Math.hypot(...Object.values(api.carryVelocity(2,2,.01)))<=18.00001);assert.deepEqual(api.carryVelocity(20,20,.02),{x:0,z:0});assert.deepEqual(api.carryVelocity(1,1,0),{x:0,z:0});});
const ready={playing:true,on:true,falling:false,returning:false,spin:1,ammo:5,pending:0,cooldown:0};
for(const [change,reason]of [[{playing:false},'paused'],[{on:false},'not-ready'],[{falling:true},'not-ready'],[{returning:true},'not-ready'],[{spin:.3},'not-ready'],[{ammo:0},'empty'],[{pending:12},'busy'],[{cooldown:.4},'cooldown']])test('drop guard '+reason+JSON.stringify(change),()=>assert.equal(api.canDrop({...ready,...change}),reason));
test('ready drone can drop',()=>assert.equal(api.canDrop(ready),''));
test('mission progress uses native outcomes',()=>{assert.equal(api.progress({total:4,remaining:3}),.25);assert.equal(api.progress({total:0}),0);assert.equal(api.progress({finished:true}),1);});
function fixture(){const store=new Map([['m60v2','UNCHANGED']]),removed=[],spoken=[],events={};const root={
 console,document:{body:null,hidden:false,addEventListener:(t,f)=>events[t]=f,querySelector:()=>null},addEventListener:(t,f)=>events[t]=f,
 localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},game:'play',mode:'drone',iv:0,mis:'op_temas',lvSel:'normal',ammo:5,ammoT:0,
 DR:{on:true,x:0,y:4,z:0,sp:1,g:{visible:true,scale:{setScalar(v){this.value=v;}}}},P:{x:0,z:0},E:[],AL:[],bombs:[],shells:[],SV:{voice:1,radioV:1,U:{bmb:0}},L:{cone:0},FRAME_HOOKS:[],
 hAt:()=>0,los:()=>true,blockedAt:()=>null,spotted:()=>true,emx:()=>100,ENT:{tank:'TANK'},
 bigBoom(){},rm(m){removed.push(m);},killE(e){root.E=root.E.filter(x=>x!==e);},hurt(e,d){e.hp-=d;if(e.hp<=0)root.killE(e);},
 camUpdate(){root.DR.g.visible=true;root.DR.g.scale.setScalar(.25);return 777;},
 fire(){if(root.game!=='play')return;root.ammo--;root.bombs.push({m:{position:{x:root.DR.x,y:root.DR.y-.6,z:root.DR.z},rotation:{y:0}},vy:0});return 123;},
 update(dt){root.ammoT+=dt;if(root.ammoT>2){root.ammo++;root.ammoT=0;}root.DR.x+=10*dt;return 42;},
 reset(){root.game='play';root.bombs=[];root.E=[{hp:100,type:'tank',x:0,z:0}];return 'reset';},setG(k){root.mis=k;},endGame(){root.game='over';return 'end';},
 radio(t){if(root.SV.voice)spoken.push('OLD:'+t);return 'caption';},CREW:{say(t){if(root.SV.voice)spoken.push('OLD:'+t);},radio(t){if(root.SV.voice)spoken.push('OLD:'+t);}},HisarImmersive:{speak(t){spoken.push(t);return true;}}
 };root.window=root;vm.runInNewContext(src,root);return {root,store,removed,spoken,events,api:root.HisarGameplay};}
test('module installs verified native hooks once',()=>{const f=fixture();assert.equal(f.root.FRAME_HOOKS.length,1);f.api.connect();assert.equal(f.root.FRAME_HOOKS.length,1);assert.equal(f.api.diagnostics().hooks.update,true);});
test('drop cooldown does not consume ammo when blocked',()=>{const f=fixture();assert.equal(f.root.fire(),123);assert.equal(f.root.ammo,4);f.root.fire();assert.equal(f.root.ammo,4);assert.equal(f.root.bombs.length,1);});
test('paused fire is prevented and stock unchanged',()=>{const f=fixture();f.root.game='pause';f.root.fire();assert.equal(f.root.ammo,5);});
test('returning or not-ready drone cannot release',()=>{const f=fixture();f.root.DR.rt=1;f.root.fire();assert.equal(f.root.bombs.length,0);f.root.DR.rt=0;f.root.DR.sp=.2;f.root.fire();assert.equal(f.root.bombs.length,0);});
test('native camera result retained and model visibility follows setting',()=>{const f=fixture();assert.equal(f.root.camUpdate(),777);assert.equal(f.root.DR.g.scale.value,.58);f.api.set({droneView:'fpv'});f.root.camUpdate();assert.equal(f.root.DR.g.visible,false);});
test('midair ammunition cannot regenerate',()=>{const f=fixture();for(let i=0;i<80;i++)f.root.update(.05);assert.equal(f.root.ammo,5);});
test('native dock regeneration remains available',()=>{const f=fixture();f.root.DR.on=false;for(let i=0;i<50;i++)f.root.update(.05);assert.equal(f.root.ammo,6);});
test('bomb inherits bounded game movement and lands once',()=>{const f=fixture();f.root.update(.05);f.root.fire();const b=f.root.bombs[0];assert.ok(b.hg.vx>0);for(let i=0;i<30;i++)f.root.update(.05);assert.equal(f.api.diagnostics().customImpacts,1);assert.equal(f.root.bombs.length,0);assert.equal(f.removed.length,1);});
test('game blast has no damage through blocked cover',()=>{const f=fixture();f.root.E=[{hp:1000,x:0,z:0,type:'tank'}];f.root.los=()=>false;f.root.fire();for(let i=0;i<30;i++)f.root.update(.05);assert.equal(f.root.E[0].hp,1000);});
test('nearby target receives more game damage than edge target',()=>{const f=fixture();f.root.E=[{hp:1000,x:0,z:0,type:'tank'},{hp:1000,x:4.8,z:0,type:'tank'}];f.root.fire();for(let i=0;i<30;i++)f.root.update(.05);assert.ok(f.root.E[0].hp<f.root.E[1].hp);});
test('inflight drops finish under their starting policy when option changes',()=>{const f=fixture();f.root.fire();f.api.set({balancedDrops:false});for(let i=0;i<30;i++)f.root.update(.05);assert.equal(f.api.diagnostics().customImpacts,1);});
test('native subtitles preserved without duplicated legacy speech',()=>{const f=fixture();assert.equal(f.root.radio('Bağlantı tamam'),'caption');assert.deepEqual(f.spoken,['Bağlantı tamam']);assert.equal(f.root.SV.voice,1);});
test('crew and radio are connected to the new voice adapter',()=>{const f=fixture();f.root.CREW.say('Merhaba',1,'test',3);f.root.CREW.radio('Duyuldu');assert.deepEqual(f.spoken,['Merhaba','Duyuldu']);});
test('muted native voice preference is honored',()=>{const f=fixture();f.root.SV.voice=0;f.root.radio('Sessiz');f.root.CREW.say('Sessiz');assert.equal(f.spoken.length,0);});
test('reset clears cooldown and preserves game progress key',()=>{const f=fixture();f.root.fire();assert.equal(f.root.reset(),'reset');assert.equal(f.api.diagnostics().cooldown,0);assert.equal(f.store.get('m60v2'),'UNCHANGED');});

test('old story chapters are gone',()=>{assert.equal(api.CHAPTERS,undefined);assert.equal(api.storyData,undefined);const src=require('node:fs').readFileSync(__dirname+'/gameplay.js','utf8');assert.doesNotMatch(src,/startStory|hisar-story-v1|kesif|konvoy|kopru/);});
