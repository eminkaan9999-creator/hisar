/* HİSAR arazi 1.1: araçlar iç içe geçmez; oyuncu mermisi dost tanka, ağaca, kayaya ve toprak sipere çarpar;
 * tank mevzileri (yığılmış toprak siper) oyun açılırken düz, atış alanı açık yerlere kurulur. Kurgusal oyun mekaniğidir.
 */
(function(root){
'use strict';
// ---------- saf işlevler (testlerde de kullanılır) ----------
// Araçlar iç içe geçmesin: üst üste binen iki gövde merkez çizgisi boyunca ayrılır. Sabit olan (fixed) yerinden oynamaz.
function separate(bodies){let moved=0;for(let i=0;i<bodies.length;i++)for(let j=i+1;j<bodies.length;j++){const a=bodies[i],b=bodies[j];if(a.fixed&&b.fixed)continue;
  let dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz);const min=a.r+b.r;if(d>=min)continue;const push=min-d;if(d<1e-4){dx=1;dz=0;d=1;}
  const ux=dx/d,uz=dz/d,wa=a.fixed?0:b.fixed?1:(a.w||.5),wb=1-wa;a.x-=ux*push*wa;a.z-=uz*push*wa;b.x+=ux*push*wb;b.z+=uz*push*wb;moved++;}
 return moved;}
// (a→b) doğru parçasının p noktasına en yakın yatay uzaklığı. Hızlı mermi nesnenin içinden atlamasın diye adım doğrusu ölçülür.
function segDist(ax,az,bx,bz,px,pz){const vx=bx-ax,vz=bz-az,l2=vx*vx+vz*vz;let t=l2?((px-ax)*vx+(pz-az)*vz)/l2:0;t=Math.max(0,Math.min(1,t));return Math.hypot(ax+vx*t-px,az+vz*t-pz);}
// Aynı doğru parçası üzerinde p'ye en yakın nokta: patlama, merminin o karede ulaştığı yerde değil çarptığı yerde görünsün diye.
function segPoint(ax,az,bx,bz,px,pz){const vx=bx-ax,vz=bz-az,l2=vx*vx+vz*vz;let t=l2?((px-ax)*vx+(pz-az)*vz)/l2:0;t=Math.max(0,Math.min(1,t));return {x:ax+vx*t,z:az+vz*t};}
// Dost tank oyuncuya en az "gap" kadar uzak tutulur; oyuncu itilmez.
function keepAway(player,ally,gap){const dx=ally.x-player.x,dz=ally.z-player.z,d=Math.hypot(dx,dz);if(d>=gap)return false;const ux=d>1e-4?dx/d:1,uz=d>1e-4?dz/d:0;ally.x=player.x+ux*gap;ally.z=player.z+uz*gap;return true;}
const norm=a=>Math.atan2(Math.sin(a),Math.cos(a));
const sm=t=>{t=t<0?0:t>1?1:t;return t*t*(3-2*t);};
// Tohumlu değer gürültüsü (0–1): aynı tohum her zaman aynı engebeyi verir.
function hash2(ix,iz,seed){let h=(Math.imul(ix,374761393)+Math.imul(iz,668265263)+Math.imul(seed|0,1442695041))|0;h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;return (h>>>0)/4294967296;}
function vnoise(x,z,seed){const ix=Math.floor(x),iz=Math.floor(z),fx=x-ix,fz=z-iz,u=fx*fx*(3-2*fx),v=fz*fz*(3-2*fz),a=hash2(ix,iz,seed),b=hash2(ix+1,iz,seed),c=hash2(ix,iz+1,seed),d=hash2(ix+1,iz+1,seed);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;}
// Çizilen arazinin yüksekliği: arazi ağı 5 metrelik karelerden ve her karede iki üçgenden oluşur; toprak tam o yüzeye oturtulur.
function terrainY(ground,x,z,cell,origin){cell=cell||5;origin=origin===undefined?-450:origin;const ix=Math.floor((x-origin)/cell),iz=Math.floor((z-origin)/cell),x0=origin+ix*cell,z0=origin+iz*cell,u=(x-x0)/cell,v=(z-z0)/cell;
 const hb=ground(x0,z0+cell),hd=ground(x0+cell,z0);if(u+v<=1){const ha=ground(x0,z0);return ha+(hd-ha)*u+(hb-ha)*v;}const hc=ground(x0+cell,z0+cell);return hc+(hb-hc)*(1-u)+(hd-hc)*(1-v);}

// ---------- tank mevzileri: yer seçimi ----------
// Yollar (orta çizgi noktaları, genişlik) ve çapalar (üs + görev noktaları) haritada sabittir; ağaç ve kayalar her açılışta değişir.
const ROADS=Object.freeze([[[[70,-190],[70,190]],9],[[[24,22],[30,8],[60,-30],[80,-68],[96,-80]],6],[[[0,22],[-30,38],[-70,52],[-100,58]],6]]);
const ANCHORS=Object.freeze([[0,0],[30,35],[-31,64],[62,-34]]);
function roadDist(x,z,roads){let d=Infinity;for(const [pts,w] of roads||ROADS)for(let i=0;i<pts.length-1;i++)d=Math.min(d,segDist(pts[i][0],pts[i][1],pts[i+1][0],pts[i+1][1],x,z)-w/2);return d;}
// h yönünde atış alanı ne kadar açık (metre, en çok 70): dar koni (±29°) içindeki ağaç, bina, iri kaya ve hemen yükselen yamaç atışı keser;
// yakındaki (25 m) engeller geniş yayda da (±57°) sayılır: mevzinin önü ve çaprazları açık olmalıdır.
function clearAhead(x,z,h,env){const sx=Math.sin(h),cz=Math.cos(h),cone=Math.cos(.5),wide=Math.cos(1);let d=70;
 const scan=(px,pz,r)=>{const ux=px-x,uz=pz-z,f=ux*sx+uz*cz;if(f<=0)return;const l=Math.hypot(ux,uz),gap=Math.max(0,l-r);if(f/l>cone||(gap<25&&f/l>wide))d=Math.min(d,gap);};
 for(const t of env.trees||[])scan(t.x,t.z,0);for(const b of env.blds||[])scan(b.x,b.z,b.r||0);for(const r of env.rocks||[])if((r.r||0)>=1.6)scan(r.x,r.z,r.r);
 // Top yerden yaklaşık 2 m yukarıdadır: önündeki zemin tankın durduğu yerden 1,2 m'den fazla yükseliyorsa atış orada kesilir.
 const g0=env.ground(x,z);for(let s=8;s<d;s+=4)if(env.ground(x+sx*s,z+cz*s)-g0>1.2){d=s;break;}
 return d;}
// Düzgün, yoldan/binadan/ağaçtan/kayadan/nehirden uzak ve önü açık yerleri bulur; her çapanın yakınından en çok perAnchor mevzi seçer.
// Mevzi görev noktasının üstüne kurulmaz (anchor), önü yükselen yere kurulmaz (rise): top siperin üstünden atabilmelidir.
// Oyun −1,2 m'nin altındaki zemini ıslak sayar (mermi su sıçratır, araç yavaşlar); mevzi oraya da kurulmaz (low).
function findPositions(env,opts){
 const o=Object.assign({span:120,step:3,flat:1.8,flatMax:2.4,min:6,low:-1,tree:13,rock:9,bld:14,road:11,river:30,anchor:18,reach:58,reachMax:92,gap:24,perAnchor:2,max:8,minClear:30,wantClear:42,rise:.3,turns:[0,.5,-.5,1,-1,1.57,-1.57]},opts||{});
 const anchors=env.anchors||ANCHORS,trees=env.trees||[],rocks=env.rocks||[],blds=env.blds||[],avoid=env.avoid||[],roughMax=Math.max(o.flat,o.flatMax);
 // Çapalara uzaklığı (inner, outer] aralığında olan uygun hücreler.
 const collect=(inner,outer)=>{const cells=[];
  for(let x=-o.span;x<=o.span;x+=o.step)for(let z=-o.span;z<=o.span;z+=o.step){
   let near=Infinity;for(const a of anchors)near=Math.min(near,Math.hypot(a[0]-x,a[1]-z));if(near<o.anchor||near<=inner||near>outer)continue;
   if(env.river&&Math.abs(z-env.river(x))<o.river)continue;
   if(roadDist(x,z,env.roads)<o.road)continue;
   let mn=Infinity,mx=-Infinity;for(let dx=-7;dx<=7;dx+=3.5)for(let dz=-7;dz<=7;dz+=3.5){const h=env.ground(x+dx,z+dz);if(h<mn)mn=h;if(h>mx)mx=h;}
   if(mx-mn>roughMax||mn<o.low)continue;
   if(blds.some(b=>Math.hypot(b.x-x,b.z-z)-(b.r||0)<o.bld))continue;
   if(rocks.some(r=>Math.hypot(r.x-x,r.z-z)-(r.r||0)<o.rock))continue;
   if(trees.some(t=>Math.hypot(t.x-x,t.z-z)<o.tree))continue;
   if(avoid.some(a=>Math.hypot(a.x-x,a.z-z)<a.r))continue;
   // Tercih: üsten dışarı bakmak. Önü kapalıysa ya da önü yükseliyorsa en yakın uygun yöne döner; üsse doğru bakan mevzi kurulmaz.
   const out=Math.atan2(x,z),g0=env.ground(x,z);let best=null;
   for(const d of o.turns){const h=out+d;if(env.ground(x+Math.sin(h)*6.2,z+Math.cos(h)*6.2)-g0>o.rise)continue;
    const c=clearAhead(x,z,h,env);if(!best||c>best.c)best={h,c};if(c>=o.wantClear){best={h,c};break;}}
   if(!best||best.c<o.minClear)continue;
   cells.push({x,z,h:norm(best.h),clear:best.c,rough:mx-mn});
  }return cells;};
 // Önce yakın ve düz yerler seçilir. Sayı "min"in altında kalırsa önce biraz daha eğimli (flatMax), sonra biraz daha uzak (reachMax)
 // yerlerle tamamlanır; ağaç, bina, yol ve atış alanı kuralları hiçbir aşamada gevşetilmez.
 const chosen=[],count=anchors.map(()=>0);
 const pick=(cells,rough,reach,per,stopAtMin)=>anchors.forEach((a,ai)=>{const score=c=>Math.hypot(c.x-a[0],c.z-a[1])+c.rough*9-Math.min(c.clear,70)*.12,near=cells.filter(c=>c.rough<=rough&&Math.hypot(c.x-a[0],c.z-a[1])<=reach).sort((p,q)=>score(p)-score(q));
  for(const c of near){if(count[ai]>=per||chosen.length>=o.max||(stopAtMin&&chosen.length>=o.min))break;if(chosen.some(k=>Math.hypot(k.x-c.x,k.z-c.z)<o.gap))continue;chosen.push({x:c.x,z:c.z,h:c.h,clear:c.clear});count[ai]++;}});
 const nearCells=collect(-1,o.reach);pick(nearCells,o.flat,o.reach,o.perAnchor,false);
 if(chosen.length<o.min)pick(nearCells,roughMax,o.reach,o.perAnchor,true);
 if(chosen.length<o.min&&o.reachMax>o.reach)pick(collect(o.reach,o.reachMax),roughMax,o.reachMax,o.perAnchor+1,true);
 return chosen;}

// ---------- tank mevzileri: biçim ----------
// Yerel eksen: +z ileri (namlu yönü), +x sağ. Toprak tankın önüne ve iki yanına U biçiminde yığılır; arka taraf giriş için açıktır.
function toWorld(p,lx,lz){const sn=Math.sin(p.h),cs=Math.cos(p.h);return {x:p.x+cs*lx+sn*lz,z:p.z-sn*lx+cs*lz};}
function toLocal(p,x,z){const dx=x-p.x,dz=z-p.z,sn=Math.sin(p.h),cs=Math.cos(p.h);return {x:dx*cs-dz*sn,z:dx*sn+dz*cs};}
// Siperin sırt çizgisi: sol arka uç → sol kenar → yuvarlak köşe → ön → köşe → sağ kenar → sağ arka uç. Her nokta: [x, z, yol uzunluğu, dış yön x, dış yön z].
const SIDE=4.9,FRONT=6.2,REAR=-4.8,CORNER=2.6;
const PATH=(()=>{const raw=[],add=(x,z)=>raw.push([x,z]);
 for(let z=REAR;z<FRONT-CORNER-1e-9;z+=.6)add(-SIDE,z);
 for(let i=0;i<=8;i++){const a=Math.PI-i/8*Math.PI/2;add(-SIDE+CORNER+Math.cos(a)*CORNER,FRONT-CORNER+Math.sin(a)*CORNER);}
 for(let x=-SIDE+CORNER+.575;x<SIDE-CORNER-1e-9;x+=.575)add(x,FRONT);
 for(let i=0;i<=8;i++){const a=Math.PI/2-i/8*Math.PI/2;add(SIDE-CORNER+Math.cos(a)*CORNER,FRONT-CORNER+Math.sin(a)*CORNER);}
 for(let z=FRONT-CORNER-.6;z>REAR+1e-9;z-=.6)add(SIDE,z);add(SIDE,REAR);
 let s=0;return Object.freeze(raw.map((q,i)=>{if(i)s+=Math.hypot(q[0]-raw[i-1][0],q[1]-raw[i-1][1]);const a=raw[Math.max(0,i-1)],b=raw[Math.min(raw.length-1,i+1)],tx=b[0]-a[0],tz=b[1]-a[1],l=Math.hypot(tx,tz)||1;return Object.freeze([q[0],q[1],s,-tz/l,tx/l]);}));})();
// Dış etekteki döküntü yığınları (kepçeden dökülmüş toprak): tohumdan üretilir.
function spoil(seed){const out=[];for(let i=0;i<6;i++){const k=PATH[2+Math.floor(hash2(i,7,seed)*(PATH.length-4))],off=1.5+hash2(i,8,seed)*1.1;out.push([k[0]+k[3]*off,k[1]+k[4]*off,.28+hash2(i,9,seed)*.3,1+hash2(i,10,seed)*.6]);}return out;}
// (lx,lz) noktasında toprağın yüksekliği (b, metre), çıplak toprak örtüsü (a, 0–1) ve renk çarpanı (c).
// Ön sırt alçaktır (top üstünden atar), yanlar yüksektir; uçlar incelerek biter. İç zemin ve arkadaki giriş boştur.
// Sırt çizgisine en yakın nokta: [uzaklık, o noktanın z'si, yol uzunluğu]. Biçim her mevzide aynı olduğundan oyunda bir kez hesaplanır.
function nearest(lx,lz){let d=Infinity,bi=0,bt=0;for(let i=0;i<PATH.length-1;i++){const a=PATH[i],b=PATH[i+1],vx=b[0]-a[0],vz=b[1]-a[1];let t=((lx-a[0])*vx+(lz-a[1])*vz)/(vx*vx+vz*vz);t=t<0?0:t>1?1:t;const q=Math.hypot(a[0]+vx*t-lx,a[1]+vz*t-lz);if(q<d){d=q;bi=i;bt=t;}}
 const p0=PATH[bi],p1=PATH[bi+1];return [d,p0[1]+(p1[1]-p0[1])*bt,p0[2]+(p1[2]-p0[2])*bt];}
function surface(lx,lz,seed,heaps,near){seed=seed|0;const n=near||nearest(lx,lz),d=n[0],pz=n[1],s=n[2],end=sm((pz-REAR)/1.7);
 const H=(1.5-.45*sm((pz-(FRONT-CORNER))/CORNER))*end*(.84+.32*vnoise(s*.55,3.7,seed)),W=(1.75+.5*vnoise(s*.4+9,1.3,seed+5))*(.7+.3*end),t=d/W;
 let b=t<1?H*(.5+.5*Math.cos(Math.PI*t)):0;if(b>0)b+=(.16*vnoise(lx*.9+31,lz*.9+17,seed+11)-.08)*Math.min(1,b*2);
 for(const k of heaps||spoil(seed)){const q=Math.hypot(lx-k[0],lz-k[1])/k[3];if(q<1)b+=k[2]*(.5+.5*Math.cos(Math.PI*q));}
 const e=1.4*(vnoise(lx*.45+3,lz*.45+7,seed+21)-.5);
 const aB=1-sm((d-W-.4+e)/1.3),aF=1-sm((Math.max(Math.abs(lx)-4.4,lz-5.4,-(lz+5.2))+e*.6)/.9+.2),aL=(1-sm((Math.max(Math.abs(lx)-2.3,-(lz+9.2),lz+4.6)+e*.5)/.9+.2))*(.5+.5*sm((lz+9.2)/3));
 const a=Math.max(aB,aF,aL,b>.04?1:0);
 let c=.8+.32*vnoise(lx*.7+50,lz*.7+60,seed+31);c*=b>.25?1.05:.9;
 const rut=Math.min(Math.abs(lx-1.5),Math.abs(lx+1.5));if(rut<.6&&lz<1.6&&lz>-9.4&&b<.1)c*=.72+.28*rut/.6;
 return {b:Math.max(0,b),a,c};}
// Çarpışma ve mermi engeli daireleri: [x, z, yarıçap, yükseklik]. Oyunun kendi siper listesine (COV) eklenir:
// araçlar içinden geçemez, mermiler çarpar, görüş kesilir, rota çevresinden dolanır. Araç merkezi daireye (yarıçap×0,85 + 2,6) m'den fazla yaklaşamaz.
const BLOCKS=Object.freeze([[0,FRONT,3,1.05],[-3.6,5.3,1.7,1.3],[3.6,5.3,1.7,1.3],[-SIDE,3.3,1.3,1.5],[SIDE,3.3,1.3,1.5],[-SIDE,1.3,1.3,1.5],[SIDE,1.3,1.3,1.5],[-SIDE,-.7,1.3,1.5],[SIDE,-.7,1.3,1.5],[-SIDE,-2.7,1.3,1.4],[SIDE,-2.7,1.3,1.4],[-SIDE,-4.3,1,.9],[SIDE,-4.3,1,.9]]);
function blocksOf(p){return BLOCKS.map(([lx,lz,r,h])=>{const w=toWorld(p,lx,lz);return {x:w.x,z:w.z,r,h};});}
function entryOf(p,back){return toWorld(p,0,-(back||9.5));}
function inPosition(x,z,list,radius){for(const p of list||[])if(Math.hypot(x-p.x,z-p.z)<(radius||3))return p;return null;}
// "Mevzilen" yaklaşması: önde ya da yanda kalan tank siperin çevresinden dolanır (0), arkadaki girişe gelir (1), giriş hattından içeri girer (2).
function approach(p,a){const l=toLocal(p,a.x,a.z);
 // Dost tank hedefine 2 m kala durur; bu yüzden giriş noktasının çevresi de "içeri gir" bölgesidir.
 if((Math.abs(l.x)<=2.6&&l.z>-12.5&&l.z<3)||Math.hypot(l.x,l.z+9.5)<=3.2)return {x:p.x,z:p.z,stage:2};
 if(l.z>-7){const w=toWorld(p,(l.x>=0?1:-1)*12,-12);return {x:w.x,z:w.z,stage:0};}
 const e=entryOf(p);return {x:e.x,z:e.z,stage:1};}
// Mevziye emirle girmeyen araç için mevzinin tamamı tek bir daire sayılır [x, z, yarıçap]: dümdüz giden araç U'nun içine girip
// sıkışmaz, köşe aralarına takılmaz, çevresinden dolanır.
// Daireye dümdüz dayanan araç olduğu yerde kalmasın diye (slide verilirse) burnunun baktığı yana doğru çember boyunca kaydırılır.
const PLUG=Object.freeze([0,.8,10.6]);
function plugPush(p,o,slide){const c=toWorld(p,PLUG[0],PLUG[1]),R=PLUG[2],dx=o.x-c.x,dz=o.z-c.z,d=Math.hypot(dx,dz);if(d>=R)return false;let ux=d>1e-4?dx/d:-Math.sin(p.h),uz=d>1e-4?dz/d:-Math.cos(p.h);
 if(slide){const hx=Math.sin(o.h||0),hz=Math.cos(o.h||0),head=Math.max(0,-(hx*ux+hz*uz)),side=(-uz*hx+ux*hz)>=0?1:-1,a=slide*head/R*side,cs=Math.cos(a),sn=Math.sin(a),nx=ux*cs-uz*sn,nz=ux*sn+uz*cs;ux=nx;uz=nz;}
 o.x=c.x+ux*R;o.z=c.z+uz*R;return true;}
// İki yan siperin arasında mı (mevzinin içi)?
function insideRing(p,x,z){const l=toLocal(p,x,z);return Math.abs(l.x)<3.5&&l.z>-5.5&&l.z<4.6;}
// Mevziden çıkış: tank geri geri, giriş hattını ortalayarak arkadan çıkar. ex={lx,lz,h} izlenen yerel konumdur; hat bitince done döner.
function exitStep(p,ex,dt){ex.lz-=6*dt;ex.lx*=1-Math.min(1,dt*2.5);ex.h+=norm(p.h-ex.h)*Math.min(1,dt*3);const w=toWorld(p,ex.lx,ex.lz);return {x:w.x,z:w.z,h:ex.h,done:ex.lz<=-9.9};}
// Mevzide siper önü ve yanları korur; arkadan gelen isabet korunmaz.
function covered(pos,from,at){if(!pos)return false;if(!from||from.x==null||!at)return true;const dx=from.x-at.x,dz=from.z-at.z,l=Math.hypot(dx,dz)||1;return (dx*Math.sin(pos.h)+dz*Math.cos(pos.h))/l>-.3;}
const core=Object.freeze({separate,segDist,segPoint,keepAway,vnoise,terrainY,ROADS,ANCHORS,roadDist,clearAhead,findPositions,PATH,BLOCKS,nearest,surface,spoil,toWorld,toLocal,blocksOf,entryOf,inPosition,approach,PLUG,plugPush,insideRing,exitStep,covered});
if(typeof module==='object'&&module.exports)module.exports=core;

// ---------- oyun içi ----------
const doc=root.document;if(!doc||root.HisarField)return;
const safe=(fn,d)=>{try{return fn();}catch(e){return d;}};
let positions=null,pushes=0,worldHits=0,lastHit='',lastFF=0,coverHits=0,coverNote=0,sink=0,buildMs=0,tris=0;
const MOVING=new Set(['tank','apc','truck']),SOLID=new Set(['tank','apc','truck','aa','arty','bunker']);
let rockList=null;
function rocksOf(){if(rockList)return rockList;rockList=[];safe(()=>{const m=new THREE.Matrix4(),p=new THREE.Vector3(),q=new THREE.Quaternion(),sc=new THREE.Vector3();for(let i=0;i<rocks.count;i++){rocks.getMatrixAt(i,m);m.decompose(p,q,sc);rockList.push({x:p.x,y:p.y,z:p.z,r:Math.max(.6,sc.x*.95)});}},null);return rockList;}
function envNow(){return {ground:hAt,river:safe(()=>typeof riv==='function'?riv:null,null),trees:(root.TREES||[]).map(t=>({x:t.x,z:t.z})),rocks:rocksOf().map(r=>({x:r.x,z:r.z,r:r.r})),
 blds:safe(()=>BLD.filter(b=>!b.dead).map(b=>({x:b.x,z:b.z,r:b.r})),[]),avoid:safe(()=>[{x:SUP.x,z:SUP.z,r:22}],[])};}
// Toprak siper tek parça bir yüzeydir: araziye oturur, sırtı inişli çıkışlıdır, kenarı çimene karışarak biter.
const X0=-10,Z0=-10,ST=.5,NX=41,NZ=45;let nearGrid=null;
function earthMesh(p,mat,seed){const heaps=spoil(seed),pos=[],uv=[],col=[],al=[],idx=[];
 if(!nearGrid){nearGrid=[];for(let j=0;j<NZ;j++)for(let i=0;i<NX;i++)nearGrid.push(nearest(X0+i*ST,Z0+j*ST));}
 for(let j=0;j<NZ;j++)for(let i=0;i<NX;i++){const lx=X0+i*ST,lz=Z0+j*ST,s=surface(lx,lz,seed,heaps,nearGrid[j*NX+i]),w=toWorld(p,lx,lz);
  pos.push(w.x,terrainY(hAt,w.x,w.z)+.045+s.b,w.z);uv.push(w.x*.23,w.z*.23);col.push(s.c,s.c,s.c,s.a);al.push(s.a);}
 for(let j=0;j<NZ-1;j++)for(let i=0;i<NX-1;i++){const a=j*NX+i,b=a+NX,c=b+1,d=a+1;if(al[a]+al[b]+al[c]+al[d]<.02)continue;idx.push(a,b,d,b,c,d);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setAttribute('color',new THREE.Float32BufferAttribute(col,4));g.setIndex(idx);g.computeVertexNormals();
 tris+=idx.length/3;const m=new THREE.Mesh(g,mat);m.castShadow=true;m.receiveShadow=true;m.userData.position=1;return m;}
function build(){if(positions)return;positions=[];const t0=performance.now();
 safe(()=>{const found=findPositions(envNow()),base=safe(()=>root.DOZER.mat,null),earth=base?base.clone():new THREE.MeshLambertMaterial({color:0x6a5338});
  earth.color=new THREE.Color(0xc2ad8e);earth.vertexColors=true;earth.transparent=true;earth.depthWrite=true;earth.polygonOffset=true;earth.polygonOffsetFactor=-2;earth.polygonOffsetUnits=-2;
  found.forEach((f,pi)=>{const p={x:f.x,z:f.z,h:f.h,clear:f.clear};S.add(earthMesh(p,earth,pi*97+13));p.blocks=blocksOf(p);
   // Oyunun kendi siper listesi: çarpışma, mermi, görüş ve rota bu listeye bakar.
   safe(()=>{for(const b of p.blocks)COV.push({x:b.x,z:b.z,r:b.r,h:b.h,pos:1});},null);positions.push(p);});
 },null);buildMs=Math.round(performance.now()-t0);}
// Araç–araç ayrımı ve dost tankın oyuncudan uzak tutulması. Mevzideki dost tank yerinden itilmez. (Araç–siper çarpışmasını oyunun kendi itme işlevi yapar.)
function collide(){const list=[],refs=[],add=(o,r,fixed,w)=>{list.push({x:o.x,z:o.z,r,fixed,w});refs.push(o);};
 const dugIn=a=>!!(a.hold&&a.hold.position&&a.hold.in)||!!a._exit;
 for(const a of AL)if(!a.dead&&!dugIn(a)&&keepAway(P,a,9)){pushes++;if(a.g&&a.g.position){a.g.position.x=a.x;a.g.position.z=a.z;}}
 add(P,3.7,false,.25);for(const a of AL)if(!a.dead)add(a,3.7,dugIn(a),.75);for(const e of E)if(SOLID.has(e.type))add(e,3.5,!MOVING.has(e.type),.75);
 for(let pass=0;pass<2;pass++)if(!separate(list))break;
 for(let i=0;i<list.length;i++){const o=refs[i],n=list[i];if(o.x===n.x&&o.z===n.z)continue;pushes++;o.x=n.x;o.z=n.z;if(o.g&&o.g.position){o.g.position.x=n.x;o.g.position.z=n.z;}}}
// Mevzideki tank biraz gömülür. "Mevzilen" emri alan dost tank siperin çevresinden dolanır, arkadan girer ve dışarı döner.
const place=(o)=>{if(o.g&&o.g.position){o.g.position.x=o.x;o.g.position.z=o.z;}};
function settle(dt){const near=positions.find(p=>{const c=toWorld(p,PLUG[0],PLUG[1]);return Math.hypot(P.x-c.x,P.z-c.z)<PLUG[2];})||null,here=inPosition(P.x,P.z,positions,2.6),dug=safe(()=>!!root.DOZER.cur,false);sink=here&&mode==='tank'&&!dug?Math.min(.35,sink+dt*.7):Math.max(0,sink-dt*1.4);if(sink>0&&P.g)P.g.position.y-=sink;
 if(!inPosition(P.x,P.z,positions,3))coverNote=0;
 for(const a of AL){if(a.dead)continue;const h=a.hold,mine=a.cmd==='hold'&&h&&h.position?inPosition(h.cx,h.cz,positions,.5):null;let inside=false;
  if(mine){a._exit=null;const t=approach(mine,a);h.x=t.x;h.z=t.z;h.stage=t.stage;inside=t.stage===2&&Math.hypot(a.x-mine.x,a.z-mine.z)<2.6;h.in=inside;if(inside)a.h+=norm(mine.h-a.h)*Math.min(1,dt*2);}
  else if(h&&h.position){h.position=false;h.in=false;}
  // Başka emir alan tank mevziden geri geri çıkar; emirsiz hiçbir tank mevzinin içine giremez.
  if(a._exit){const p=a._exit.p,e=exitStep(p,a._exit,dt);a.x=e.x;a.z=e.z;a.h=e.h;place(a);pushes++;if(e.done)a._exit=null;}
  else for(const p of positions){if(p===mine||Math.hypot(a.x-p.x,a.z-p.z)>14)continue;
   if(insideRing(p,a.x,a.z)){const l=toLocal(p,a.x,a.z);a._exit={p,lx:l.x,lz:l.z,h:a.h};break;}if(plugPush(p,a,p===near?0:dt*4)){place(a);pushes++;}}
  a._sink=inside?Math.min(.35,(a._sink||0)+dt*.7):Math.max(0,(a._sink||0)-dt*1.4);if(a._sink>0&&a.g)a.g.position.y-=a._sink;}
 // Düşman araçları mevziye giremez; sabit hedefler (korugan, top, hava savunma) toprağın içine denk gelmişse bir kez kenara alınır.
 for(const e of E){if(!SOLID.has(e.type))continue;const moving=MOVING.has(e.type);if(!moving&&e._fieldOk)continue;e._fieldOk=1;
  for(const p of positions){if(Math.hypot(e.x-p.x,e.z-p.z)>14)continue;if(plugPush(p,e,moving&&p!==near?dt*4:0)){place(e);if(!moving&&e.g&&e.g.position)e.g.position.y=hAt(e.x,e.z);pushes++;}}}}
// Hedef olmayan şeyler de vurulur: dost tank, ağaç, kaya ve toprak siper mermiyi durdurur ve patlama olur.
function shellWorld(){for(const s of shells){const q=s.m.position,ax=s._px===undefined?q.x:s._px,az=s._pz===undefined?q.z:s._pz;s._px=q.x;s._pz=q.z;if(s.life<=0)continue;
  let hit=null;
  for(const a of AL){if(a.dead)continue;if(q.y<hAt(a.x,a.z)+4.5&&segDist(ax,az,q.x,q.z,a.x,a.z)<3.4){hit={kind:'ally',ally:a,x:a.x,z:a.z};break;}}
  if(!hit&&root.TREES)for(const t of TREES){if(t.st===3)continue;if(q.y<hAt(t.x,t.z)+7*(t.s||1)&&segDist(ax,az,q.x,q.z,t.x,t.z)<1.1*(t.s||1)){hit={kind:'tree',x:t.x,z:t.z};break;}}
  if(!hit)for(const r of rocksOf()){if(Math.abs(q.y-r.y)<r.r+.6&&segDist(ax,az,q.x,q.z,r.x,r.z)<r.r){const at=segPoint(ax,az,q.x,q.z,r.x,r.z);hit={kind:'rock',x:at.x,z:at.z};break;}}
  if(!hit&&positions)for(const p of positions){if(Math.hypot(q.x-p.x,q.z-p.z)>16)continue;for(const b of p.blocks){if(q.y<hAt(b.x,b.z)+b.h&&segDist(ax,az,q.x,q.z,b.x,b.z)<b.r){const at=segPoint(ax,az,q.x,q.z,b.x,b.z);hit={kind:'berm',x:at.x,z:at.z};break;}}if(hit)break;}
  if(!hit)continue;worldHits++;lastHit=hit.kind;s.life=0;impact(s,hit.x,q.y,hit.z,null);
  if(hit.kind==='tree'&&s.k!==2)root.bigBoom(hit.x,hit.z,1);
  if(hit.ally&&s.k!==2){safe(()=>hitAl(hit.ally,3),null);const now=performance.now();if(now-lastFF>4000){lastFF=now;safe(()=>root.radio('Dost ateşi! Ateşi kes!'),null);}}}}
// Mevzideyken önden ve yandan gelen hasar yarıya iner (oyuncu ve dost tanklar için): gövde toprağın arkasındadır.
safe(()=>{const hp=root.hitP;if(typeof hp!=='function'||hp.hisarField)return;const w=function(k,p){const pos=inPosition(P.x,P.z,positions,3);
  if(pos&&covered(pos,p,P)){coverHits++;if(!coverNote){coverNote=1;safe(()=>say('🛡 MEVZİDE · hasar yarıya indi',1.4),null);}return hp.call(this,k*.5,p);}
  return hp.apply(this,arguments);};w.hisarField=true;root.hitP=w;},null);
safe(()=>{const ha=root.hitAl;if(typeof ha!=='function'||ha.hisarField)return;const w=function(a,k){if(a&&a.hold&&a.hold.position&&a.hold.in)return ha.call(this,a,k*.5);return ha.apply(this,arguments);};w.hisarField=true;root.hitAl=w;},null);
// Her oyun adımından sonra çalışır (dokunuş beklemez).
safe(()=>{const up=root.update;if(typeof up!=='function'||up.hisarField)return;const w=function(dt){const r=up.apply(this,arguments);
  safe(()=>{if(game!=='play')return;build();shellWorld();collide();settle(Math.min(.1,+dt||0));},null);return r;};w.hisarField=true;root.update=w;},null);
// Mevziler menüdeyken kurulur ki oyunun ilk karesi takılmasın; olmadıysa ilk oyun adımı kurar.
(function early(n){root.setTimeout(()=>{if(positions)return;if(safe(()=>typeof hAt==='function'&&!!S&&!!root.TREES&&root.TREES.length>0&&BLD.length>0,false))build();else if(n<20)early(n+1);},n?1500:2500);})(0);
root.HisarField=Object.freeze({core,positions:()=>{safe(build,null);return (positions||[]).map(p=>({x:p.x,z:p.z,h:p.h,clear:p.clear}));},
 diagnostics:()=>({pushes,worldHits,lastHit,positions:positions?positions.length:0,coverHits,sink,buildMs,tris})});
})(typeof window!=='undefined'?window:globalThis);
