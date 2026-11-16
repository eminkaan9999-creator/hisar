/* ÇELİK BÖRÜ harita 1.0 — küçük harita gerçek arazi haritası olur.
 * Arazi gölgeli yükseklik görüntüsü (büyük haritanın görüntüsü), üstünde yollar, binalar, nehir, sınır duvarı ve Suriye tarafının hafif
 * kırmızı tonu; 100 metrelik ızgara ve kuzey işareti. Tuval iki kat çözünürlükle çizilir (telefonda keskin).
 * Çekirdek saf işlevlerdir ve Node ile sınanır.
 */
(function(root){'use strict';
const VERSION='1.0.0';
const doc=root.document;
const safe=(f,d)=>{try{return f();}catch(e){return d;}};
// ---------- çekirdek ----------
// Dünya noktasını küçük harita pikseline çevirir (merkez o, genişlik R metre, W piksel)
const toMini=(x,z,o,R,W)=>[((x-o.x)/R+.5)*W,((z-o.z)/R+.5)*W];
// Kaynak görüntüde (dünyanın tamamı, N piksel) görünen kare
function srcRect(o,R,ws,N){const k=N/(2*ws);return [(o.x-R/2+ws)*k,(o.z-R/2+ws)*k,R*k,R*k];}
const core=Object.freeze({VERSION,toMini,srcRect});
if(typeof module==='object'&&module.exports)module.exports=core;
if(!doc)return;
const stat={draws:0,hidpi:false,buildings:0};
function hidpi(){const c=doc.getElementById('mm');if(!c||typeof mmx==='undefined')return;if(c.width===132){c.width=c.height=264;stat.hidpi=true;}mmx.setTransform(2,0,0,2,0,0);}
// arka plan: mmDraw her karede çağırır
function bg(g,o,W){const R=safe(()=>MMR,440),ws=safe(()=>WS,800),X=x=>((x-o.x)/R+.5)*W,Z=z=>((z-o.z)/R+.5)*W,k=W/R;stat.draws++;
 g.save();g.fillStyle='#55704a';g.fillRect(0,0,W,W);const bm=safe(()=>BM,null);if(bm){const s=srcRect(o,R,ws,bm.width);g.imageSmoothingEnabled=true;g.drawImage(bm,s[0],s[1],s[2],s[3],0,0,W,W);}
 // Suriye tarafı: sınırın güneyi hafif kırmızımsı
 const wz=x=>safe(()=>riv(x),120)-26;g.beginPath();g.moveTo(-2,Z(wz(o.x-R/2)));for(let x=o.x-R/2;x<=o.x+R/2+8;x+=8)g.lineTo(X(x),Z(wz(x)));g.lineTo(W+2,W+2);g.lineTo(-2,W+2);g.closePath();g.fillStyle='rgba(150,60,40,.16)';g.fill();
 // ızgara
 g.strokeStyle='rgba(255,255,255,.1)';g.lineWidth=.6;for(let x=Math.ceil((o.x-R/2)/100)*100;x<o.x+R/2;x+=100){g.beginPath();g.moveTo(X(x),0);g.lineTo(X(x),W);g.stroke();}for(let z=Math.ceil((o.z-R/2)/100)*100;z<o.z+R/2;z+=100){g.beginPath();g.moveTo(0,Z(z));g.lineTo(W,Z(z));g.stroke();}
 // yollar
 g.lineCap='round';g.lineJoin='round';for(const r of safe(()=>WROADS,[])){g.beginPath();r.pts.forEach((p,i)=>i?g.lineTo(X(p[0]),Z(p[1])):g.moveTo(X(p[0]),Z(p[1])));g.strokeStyle='rgba(40,34,24,.55)';g.lineWidth=Math.max(2.2,(r.w+2)*k);g.stroke();g.strokeStyle='#e3d3a6';g.lineWidth=Math.max(1.3,r.w*k);g.stroke();}
 // binalar
 let nb=0;g.fillStyle='#3b3833';for(const b of safe(()=>BLD,[])){if(b.dead)continue;const x=X(b.x),y=Z(b.z);if(x<-8||y<-8||x>W+8||y>W+8)continue;nb++;
  if(b.w){g.save();g.translate(x,y);g.rotate(-(b.rot||0));g.fillRect(-b.w*k/2,-b.d*k/2,Math.max(1.4,b.w*k),Math.max(1.4,b.d*k));g.restore();}else{const s=Math.max(1.4,b.r*k*1.2);g.fillRect(x-s/2,y-s/2,s,s);}}stat.buildings=nb;
 // sınır duvarı
 g.strokeStyle='#d8262c';g.lineWidth=1.8;g.setLineDash([3,2]);g.beginPath();let f=true;for(let x=o.x-R/2-8;x<=o.x+R/2+8;x+=6){const p=[X(x),Z(wz(x))];if(f){g.moveTo(p[0],p[1]);f=false;}else g.lineTo(p[0],p[1]);}g.stroke();g.setLineDash([]);
 // kuzey
 g.fillStyle='rgba(255,255,255,.85)';g.font='800 9px system-ui';g.textAlign='center';g.fillText('K',W/2,10);g.restore();}
function connect(){hidpi();root.MMBG=bg;}
root.HisarHarita=Object.freeze({version:VERSION,core,connect,diagnostics:()=>({version:VERSION,...stat,size:safe(()=>doc.getElementById('mm').width,0)})});
connect();doc.addEventListener('hisar:ui-ready',connect);
})(typeof window!=='undefined'?window:globalThis);
