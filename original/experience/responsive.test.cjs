'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const css=fs.readFileSync('experience/ui.css','utf8');
test('dialog respects dynamic viewport and device safe areas',()=>{
 assert.match(css,/max-height:calc\(100dvh - 16px\)/);
 assert.match(css,/env\(safe-area-inset-top\)/);
 assert.match(css,/env\(safe-area-inset-bottom\)/);
 assert.match(css,/overflow-x:hidden/);
});
test('compact landscape and narrow portrait have explicit layouts',()=>{
 assert.match(css,/@media\(max-height:500px\) and \(orientation:landscape\)/);
 assert.match(css,/@media\(max-width:360px\)/);
 assert.match(css,/\.hx-card\{min-width:0/);
});
