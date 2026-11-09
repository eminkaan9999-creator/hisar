'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {integrate,check}=require('../scripts/experience-integrate.cjs');
const html='<html><head></head><body><script>const NAME=1, VER = 62;function loop(t){const dr=Math.min(.05,Math.max(0,(t-last)/1000)||0);last=t;fpsA+=dr;}</script></body></html>';
test('combined legacy version declaration preserves previous variables',()=>{
 const result=integrate(html);assert.match(result,/const NAME=1, VER = 63/);assert.equal(check(result),1);
});
test('real v62 quoted number version preserves logo declaration',()=>{
 const source=html.replace('const NAME=1, VER = 62',"const VER=+'62',LOGO=window.HISAR_LOGO");
 const result=integrate(source);assert.match(result,/const VER=63,LOGO=window.HISAR_LOGO/);assert.equal(check(result),1);
});
