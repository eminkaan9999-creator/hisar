'use strict';const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ui=fs.readFileSync('experience/ui.js','utf8'),css=fs.readFileSync('experience/ui.css','utf8');
test('UI JavaScript parses',()=>assert.doesNotThrow(()=>new vm.Script(ui)));
test('cinematic and contrast toggles are opt-in',()=>{assert.match(ui,/cinematic:false,contrastCrosshair:false/);assert.match(ui,/hx-cinematic/);assert.match(ui,/hx-crosshair/);assert.match(ui,/hisar-cinematic/);assert.match(ui,/hisar-crosshair-contrast/);});
test('visual overlay never captures pointer input',()=>{assert.match(css,/body\.hisar-cinematic::after/);assert.match(css,/pointer-events:none/);});
test('no changes to simulator physics or save key',()=>{assert.match(ui,/const KEY='hisar-experience-v1'/);assert.doesNotMatch(ui,/m60v2/);});
