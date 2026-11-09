'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {integrate,check}=require('../scripts/experience-integrate.cjs');
test('combined legacy version declaration preserves previous variables',()=>{
 const html='<html><head></head><body><script>const NAME=1, VER = 62;function loop(t){const dr=Math.min(.05,Math.max(0,(t-last)/1000)||0);last=t;fpsA+=dr;}</script></body></html>';
 const result=integrate(html);assert.match(result,/const NAME=1, VER = 63/);assert.equal(check(result),1);
});
