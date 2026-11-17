/* Sürüm damgası: yapı numarasını tek komutla her yere yazar. Sayfa (VER, BUILD), bölüm damgası (guard.js), bölüm ve biçem etiketleri (?v=),
 * hizmet işçisinin önbellek adı (sw.js CACHE ile sayfadaki SWC) ve version.json birbirini tutmalıdır; tutmazsa telefon yeni sürümü eski
 * bölümlerle karışık çalıştırır (experience/surum.test.cjs bunu sınar).
 * Kullanım: node scripts/surum-damga.cjs <yapı numarası> <önbellek adı eki>     örnek: node scripts/surum-damga.cjs 111 yol
 */
'use strict';
const fs=require('node:fs'),path=require('node:path');
function stamp(files,build,name){const cache='hisar-main-v'+build+'-'+name,out={...files};let n;
 const sub=(key,re,to,min)=>{n=0;out[key]=out[key].replace(re,(...m)=>{n++;return typeof to==='function'?to(...m):to;});if(n<(min||1))throw Error(key+': beklenen yer bulunamadı '+re);};
 sub('index.html',/const VER=\d+/,'const VER='+build);
 sub('index.html',/var BUILD=\d+,SWC='[^']*'/,"var BUILD="+build+",SWC='"+cache+"'");
 sub('index.html',/(<script src="experience\/guard\.js\?v=)[0-9.]+(")/,(m,a,b)=>a+build+b);
 sub('index.html',/(href="experience\/[a-z-]+\.css\?v=)[0-9.]+(")/g,(m,a,b)=>a+build+b,2);
 // oyun bölümleri: deneyim çatısı (core, bridge, ui) kendi sürümünde kalır
 sub('index.html',/<script( defer)? src="experience\/([a-z-]+)\.js\?v=[0-9.]+"><\/script>/g,(m,d,nm)=>['core','bridge','ui','guard'].includes(nm)?m:'<script'+(d||'')+' src="experience/'+nm+'.js?v='+build+'"></script>',20);
 sub('experience/guard.js',/window\.HISAR_BUILD=\d+;/,'window.HISAR_BUILD='+build+';');
 sub('sw.js',/const CACHE='[^']*';/,"const CACHE='"+cache+"';");
 sub('version.json',/"v":\s*\d+/,'"v": '+build);
 return {files:out,cache};}
if(require.main===module){const build=+process.argv[2],name=process.argv[3];if(!(build>0)||!/^[a-z0-9-]+$/.test(name||'')){console.error('Kullanım: node scripts/surum-damga.cjs <yapı numarası> <önbellek adı eki>');process.exit(2);}
 const root=path.join(__dirname,'..'),keys=['index.html','experience/guard.js','sw.js','version.json'],files={};for(const k of keys)files[k]=fs.readFileSync(path.join(root,k),'utf8');
 const r=stamp(files,build,name);let changed=0;for(const k of keys)if(r.files[k]!==files[k]){fs.writeFileSync(path.join(root,k),r.files[k]);changed++;}
 console.log('Yapı '+build+' · önbellek '+r.cache+' · değişen dosya '+changed);}
module.exports={stamp};
