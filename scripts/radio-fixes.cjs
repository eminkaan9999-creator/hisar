'use strict';
const fs=require('node:fs'),vm=require('node:vm');const file='experience/radio-missions.js';let s=fs.readFileSync(file,'utf8');
function replace(old,next){if(s.includes(next))return;if(s.split(old).length!==2)throw Error('Source contract changed: '+old.slice(0,80));s=s.replace(old,next);}
replace("function paintRoster(){if(!roster)return;const old=selected;roster.replaceChildren();","let rosterSignature='';\nfunction paintRoster(){if(!roster)return;const signature=units().map(u=>u.cs+':'+Math.round(clamp(u.hp/(u.mx||100),0,1)*100)).join('|');if(signature===rosterSignature&&roster.options.length)return;rosterSignature=signature;const old=selected;roster.replaceChildren();");
replace("lastOrder.clear();sim=0;cleanup();","lastOrder.clear();sim=0;lastPaint=-1;cleanup();");
replace("if(e.code==='KeyX'&&playing()&&active){interacting=true;e.preventDefault();}","if(e.code==='KeyX'&&playing()&&mode==='tank'&&active&&!active.finished&&active.config.goals[active.step]?.type==='interact'){interacting=true;e.preventDefault();e.stopImmediatePropagation();}");
new vm.Script(s);fs.writeFileSync(file,s);console.log('Radio input/lifecycle fixes applied idempotently.');
