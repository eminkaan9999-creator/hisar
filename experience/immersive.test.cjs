'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(__dirname+'/immersive.js','utf8');
function setup(voices=[]){const calls=[];const store=new Map();const root={localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},speechSynthesis:{getVoices:()=>voices,cancel:()=>calls.push('cancel'),speak:u=>calls.push(u)},SpeechSynthesisUtterance:function(text){this.text=text;}};root.window=root;vm.runInNewContext(source,root);return {api:root.HisarImmersive,calls,store};}
test('immersive adapter parses',()=>assert.doesNotThrow(()=>new vm.Script(source)));
test('defaults and settings are allowlisted',()=>{const {api}=setup();assert.equal(api.getSettings().greenThermal,true);api.save({greenThermal:false,evil:true});assert.equal(api.getSettings().greenThermal,false);assert.equal('evil' in api.getSettings(),false);});
test('radio never substitutes an unknown voice for Turkish male',()=>{const {api,calls}=setup([{name:'Turkish Female',lang:'tr-TR'}]);assert.equal(api.speak('Kontrol'),false);assert.equal(calls.length,0);});
test('radio uses a matching Turkish male voice when available',()=>{const voice={name:'Tolga',lang:'tr-TR'};const {api,calls}=setup([voice]);assert.equal(api.speak('Anlaşıldı'),true);assert.equal(calls.length,2);assert.equal(calls[1].voice,voice);});
test('disabled radio produces no speech',()=>{const {api,calls}=setup([{name:'Tolga',lang:'tr-TR'}]);api.save({radioVoice:false});assert.equal(api.speak('Deneme'),false);assert.equal(calls.length,0);});
