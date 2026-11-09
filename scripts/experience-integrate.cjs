/* Idempotent integration. Retains the original 6 MB game and every embedded asset. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm');
function integrate(html){
 if(html.includes('<!-- HISAR EXPERIENCE v1 -->'))return html;
 if(!html.includes('</head>')||!html.includes('</body>'))throw Error('Unexpected game document');
 const link='<script src="experience/guard.js?v=63"></script>\n<link rel="stylesheet" href="experience/ui.css?v=63">\n';
 const scripts='<!-- HISAR EXPERIENCE v1 -->\n'+['core','bridge','ui'].map(n=>`<script defer src="experience/${n}.js?v=63"></script>`).join('\n')+'\n';
 // Accept standalone and comma-separated legacy version declarations.
 let count=0;
 html=html.replace(/((?:\b(?:const|let|var)\s+|,)\s*VER\s*=\s*)\d+\b/g,(_,prefix)=>{count++;return prefix+'63';});
 if(count!==1)throw Error('Expected exactly one game version declaration, found '+count+'; candidates: '+JSON.stringify(html.match(/.{0,50}\bVER\s*=.{0,80}/g)||[]));
 const fpsBefore='const dr=Math.min(.05,Math.max(0,(t-last)/1000)||0);last=t;fpsA+=dr;';
 const fpsAfter='const realDt=Math.max(0,(t-last)/1000)||0;const dr=Math.min(.05,realDt);last=t;fpsA+=Math.min(realDt,1);';
 if(html.split(fpsBefore).length!==2)throw Error('Active render loop contract changed');
 html=html.replace(fpsBefore,fpsAfter);
 return html.replace('</head>',link+'</head>').replace(/<\/body>(\s*<\/html>\s*)$/i,scripts+'</body>$1');
}
function check(html){
 let n=0;
 for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
  if(/\bsrc\s*=|application\/ld\+json|application\/json/.test(m[1]))continue;
  new vm.Script(m[2],{filename:'index-inline-'+(++n)+'.js'});
 }
 if(!n)throw Error('No inline game scripts found');
 if(!html.includes('experience/ui.js?v=63'))throw Error('Missing experience integration');
 return n;
}
if(require.main===module){
 const file='index.html';const before=fs.readFileSync(file,'utf8'),after=integrate(before);
 console.log('Syntax checked inline game scripts:',check(after));
 if(after!==before)fs.writeFileSync(file,after);
 const v=JSON.parse(fs.readFileSync('version.json','utf8'));
 if(Number(v.v)>63)throw Error('A newer version exists; do not overwrite it');
 v.v=63;v.not='Oyun içi İTİ ve ayar paneli, otomatik kalite ve doğru FPS ölçümü, FPS ve oturum raporları; ana oyun/İTİ çevrimdışı önbellek ayrımı düzeltildi.';
 fs.writeFileSync('version.json',JSON.stringify(v,null,2)+'\n');
 console.log(after===before?'Integration already present':'Integrated experience v1; preserved original game');
}
module.exports={integrate,check};
