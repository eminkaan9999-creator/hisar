/* ÇELİK BÖRÜ ağaç 1.0 — bütün ağaçlar kullanıcının gönderdiği 3B zeytin ağacı modeliyle çizilir.
 * Model 1,9 milyon üçgenden üç düzeye indirildi: yakın (assets/mdl/zeytin.bin, yaklaşık 14 bin üçgen), orta (zeytin_orta.bin, yaklaşık
 * 4 bin üçgen) ve uzak (assets/tex/zeytin_uzak.png: modelin iki yandan çizilmiş resmini taşıyan çapraz kart, 8 üçgen).
 * - Ormanlık ve tek ağaçlar: index.html ağaç çizimine TREEX.setModel ile verilir; devrilme, kütük ve leke gölge aynen sürer.
 * - Köy bahçeleri (arazi.js): HisarArazi.setModel ile verilir.
 * Kameraya en yakın ağaçlar ayrıntılı, sonrakiler hafif örgüyle, uzaktakiler kartla çizilir. Model yüklenemezse eski ağaçlar kalır.
 * Çekirdek saf işlevlerdir ve Node ile sınanır.
 */
(function(root){'use strict';
const VERSION='1.0.0';
const doc=root.document;
const safe=(f,d)=>{try{return f();}catch(e){return d;}};
// ---------- çekirdek ----------
// height: ağacın oyundaki boyu (m); foot: gövde dibini bulmak için alttan alınan dilim; card: kartın yarı genişliğinin boya oranı (resmin ölçüsü);
// forest ve grove: düzeylerin uzaklık (m) ve sayı sınırları (yakın, orta, kart)
// gain: dokunun renk çarpanı [kırmızı, yeşil, mavi] (model dokusu koyu sarı-yeşildir; güneşte zeytinin gri-yeşili görünsün), cardGain: kart resmi için
const TREE=Object.freeze({height:4.8,foot:.06,card:.8493,gain:Object.freeze([1.45,1.5,1.95]),cardGain:Object.freeze([1.2,1.25,1.62]),forest:Object.freeze([{r:38,max:3},{r:105,max:14},{r:440}]),grove:Object.freeze([{r:38,max:2},{r:105,max:8},{r:440}])});
// Gövdenin dibini eksene alır (en alttaki köşelerin yatay ortası x=0,z=0) ve modeli istenen boya ölçekler. base verilirse aynı kaydırma ve ölçek
// kullanılır (orta düzey yakın düzeyle aynı yere otursun). {k ölçek, x, z kaydırma, lo taban} döndürür.
function fit(pos,height,foot,base){let b=base;if(!b){let hi=-1e9,lo=1e9;for(let i=1;i<pos.length;i+=3){hi=Math.max(hi,pos[i]);lo=Math.min(lo,pos[i]);}const h=hi-lo,cut=lo+h*foot;let sx=0,sz=0,n=0;
  for(let i=0;i<pos.length;i+=3)if(pos[i+1]<=cut){sx+=pos[i];sz+=pos[i+2];n++;}if(n){sx/=n;sz/=n;}b={k:height/h,x:sx,z:sz,lo};}
 for(let i=0;i<pos.length;i+=3){pos[i]=(pos[i]-b.x)*b.k;pos[i+1]=(pos[i+1]-b.lo)*b.k;pos[i+2]=(pos[i+2]-b.z)*b.k;}return b;}
// Yaprak normalleri: ince yaprak yüzeylerinin normali dağınıktır (ağaç lekeli ve koyu görünür). Taç bir kubbe gibi aydınlansın diye her köşenin
// normali taç ortasından dışarı ve biraz yukarı bakar; gövde (boyun trunk oranından aşağısı) kendi normalini korur.
function dome(pos,nor,height,trunk){const cy=height*.5,up=height*.35;for(let i=0;i<pos.length;i+=3){if(pos[i+1]<height*trunk)continue;const x=pos[i],y=pos[i+1]-cy+up,z=pos[i+2],l=Math.hypot(x,y,z)||1;nor[i]=x/l;nor[i+1]=y/l;nor[i+2]=z/l;}return nor;}
const core=Object.freeze({VERSION,TREE,fit,dome});
if(typeof module==='object'&&module.exports)module.exports=core;
if(!doc)return;
// ---------- oyun ----------
const stat={state:'bekliyor',tris:[0,0,8],forest:false,groves:false,error:null};let started=false;
async function start(){const M=root.HisarModel;if(started||!root.THREE||!M||!root.TREEX||!root.HisarArazi||!safe(()=>root.HisarArazi.diagnostics().built,false))return;started=true;stat.state='yükleniyor';
 try{const [a,b]=await Promise.all([M.load('assets/mdl/zeytin.bin?v=1'),M.load('assets/mdl/zeytin_orta.bin?v=1')]),f=fit(a.pos,TREE.height,TREE.foot);fit(b.pos,TREE.height,TREE.foot,f);for(const d of[a,b])if(d.nor)dome(d.pos,d.nor,TREE.height,.3);
  const mat=M.material(M.texture('assets/tex/zeytin_col.jpg?v=1'),{gain:TREE.gain}),cmat=M.cardMaterial(M.texture('assets/tex/zeytin_uzak.png?v=1',true),{gain:TREE.cardGain,side:root.THREE.FrontSide}),hi=M.geometry(a),mid=M.geometry(b),card=M.geometry(M.core.treeCard(TREE.height*TREE.card,TREE.height));
  const levels=q=>[{geo:hi,mat,r:q[0].r,max:q[0].max},{geo:mid,mat,r:q[1].r,max:q[1].max},{geo:card,mat:cmat,r:q[2].r,card:true}];stat.tris=[a.ni/3,b.ni/3,8];
  stat.forest=!!safe(()=>root.TREEX.setModel(levels(TREE.forest)),false);stat.groves=!!safe(()=>root.HisarArazi.setModel(levels(TREE.grove),M.core.assign),false);stat.state=stat.forest||stat.groves?'hazır':'hata';if(stat.state==='hata')stat.error='ağaç çizimi modeli almadı';}
 catch(e){stat.state='hata';stat.error=String(e&&e.message||e);}}
function connect(){start();if(!connect.w&&typeof root.update==='function'){connect.w=1;const old=root.update;root.update=function(){if(!started)start();return old.apply(this,arguments);};}}
root.HisarAgac=Object.freeze({version:VERSION,core,connect,diagnostics:()=>({version:VERSION,...stat,model:safe(()=>root.TREEX.model(),null),grove:safe(()=>root.HisarArazi.model(),null)})});
connect();doc.addEventListener('hisar:ui-ready',connect);
})(typeof window!=='undefined'?window:globalThis);
