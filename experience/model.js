/* ÇELİK BÖRÜ model 1.0 — kullanıcının gönderdiği 3B modellerin ortak altyapısı.
 * Gönderilen modeller yaklaşık 2 milyon üçgendir; telefonda dönmesi için çevrimdışı küçültülüp assets/mdl altına ikili dosya olarak konur.
 * Küçültme doku adalarına saygılıdır (renkler karışmaz) ve özgün modelin köşe normallerini taşır (yumuşak gölgeleme).
 * Bu modül: dosyayı çözer, geometri ve doku kurar, uzaklığa göre ayrıntı düzeyi seçer (yakın: ayrıntılı örgü, orta: hafif örgü,
 * uzak: modelin yandan çizilmiş resmini taşıyan kart) ve tek tek nesnelerde (araç, kule) yakın/uzak örgüyü kameraya göre değiştirir.
 * Çekirdek saf işlevlerdir ve Node ile sınanır.
 */
(function(root){'use strict';
const VERSION='1.0.2';
const doc=root.document;
const safe=(f,d)=>{try{return f();}catch(e){return d;}};
// ---------- çekirdek ----------
// İkili dosya: 'HMD1' ya da 'HMD2', köşe sayısı, indis sayısı, indis genişliği (2/4), sınır kutusu (6 float), konumlar (u16×3), uv (u16×2),
// [HMD2: normaller (i8×4)], indisler, isteğe bağlı 'GRID', n, n×n bayt (yükseklik ızgarası). x ve z kutu ortasına alınır, y olduğu gibi kalır;
// off kutu ortasının özgün modeldeki yeridir (aynı modelden ayrılan parçalar birbirine göre yerleştirilebilsin).
function parse(buf){const dv=new DataView(buf);const tag=String.fromCharCode(dv.getUint8(0),dv.getUint8(1),dv.getUint8(2),dv.getUint8(3));if(tag!=='HMD1'&&tag!=='HMD2')throw new Error('model: bilinmeyen dosya');
 const nv=dv.getUint32(4,true),ni=dv.getUint32(8,true),iw=dv.getUint32(12,true),bb=[];for(let i=0;i<6;i++)bb.push(dv.getFloat32(16+i*4,true));let o=40;
 const q=new Uint16Array(buf.slice(o,o+nv*6));o+=nv*6;const uq=new Uint16Array(buf.slice(o,o+nv*4));o+=nv*4;let nor=null;
 if(tag==='HMD2'){const n8=new Int8Array(buf.slice(o,o+nv*4));o+=nv*4;nor=new Float32Array(nv*3);for(let i=0;i<nv;i++){nor[i*3]=n8[i*4]/127;nor[i*3+1]=n8[i*4+1]/127;nor[i*3+2]=n8[i*4+2]/127;}}
 const idx=iw===4?new Uint32Array(buf.slice(o,o+ni*4)):new Uint16Array(buf.slice(o,o+ni*2));o+=ni*iw;
 const pos=new Float32Array(nv*3),uv=new Float32Array(nv*2),cx=(bb[0]+bb[3])/2,cz=(bb[2]+bb[5])/2;
 for(let i=0;i<nv;i++){pos[i*3]=bb[0]+(bb[3]-bb[0])*q[i*3]/65535-cx;pos[i*3+1]=bb[1]+(bb[4]-bb[1])*q[i*3+1]/65535;pos[i*3+2]=bb[2]+(bb[5]-bb[2])*q[i*3+2]/65535-cz;uv[i*2]=uq[i*2]/65535;uv[i*2+1]=uq[i*2+1]/65535;}
 let grid=null;if(o+5<=buf.byteLength&&dv.getUint8(o)===71&&dv.getUint8(o+1)===82){const n=dv.getUint8(o+4);grid={n,h:new Uint8Array(buf.slice(o+5,o+5+n*n))};}
 return {nv,ni,pos,uv,nor,idx,size:[bb[3]-bb[0],bb[4]-bb[1],bb[5]-bb[2]],min:[bb[0]-cx,bb[1],bb[2]-cz],off:[cx,cz],grid};}
// Bir yükseklik aralığındaki köşelerin yatay ortası (lo ve hi, modelin boyuna oranla 0..1). Tekerleklerin, gövde dibinin ya da başın ekseni böyle bulunur.
function axis(pos,lo,hi){let y0=1e9,y1=-1e9;for(let i=1;i<pos.length;i+=3){y0=Math.min(y0,pos[i]);y1=Math.max(y1,pos[i]);}const a=y0+(y1-y0)*lo,b=y0+(y1-y0)*hi;let sx=0,sz=0,n=0;
 for(let i=0;i<pos.length;i+=3)if(pos[i+1]>=a&&pos[i+1]<=b){sx+=pos[i];sz+=pos[i+2];n++;}return {x:n?sx/n:0,z:n?sz/n:0,y0,y1,n};}
// Köşeleri kaydırır ve ölçekler (yerinde değiştirir): önce (dx,dy,dz) eklenir, sonra (sx,sy,sz) ile çarpılır
function move(pos,dx,dy,dz,sx,sy,sz){sx=sx==null?1:sx;sy=sy==null?sx:sy;sz=sz==null?sx:sz;for(let i=0;i<pos.length;i+=3){pos[i]=(pos[i]+dx)*sx;pos[i+1]=(pos[i+1]+dy)*sy;pos[i+2]=(pos[i+2]+dz)*sz;}return pos;}
// Eksenlere farklı ölçek verilince normaller ters ölçekle düzeltilir (yerinde değiştirir)
function scaleNormals(nor,sx,sy,sz){if(!nor)return nor;for(let i=0;i<nor.length;i+=3){const x=nor[i]/sx,y=nor[i+1]/sy,z=nor[i+2]/sz,l=Math.hypot(x,y,z)||1;nor[i]=x/l;nor[i+1]=y/l;nor[i+2]=z/l;}return nor;}
// Ayrıntı düzeyi dağıtımı: ds uzaklıklar, levels yakından uzağa [{r,max}]. En yakın nesne en ayrıntılı düzeyi alır; bir düzey dolunca
// sıradaki bir sonrakine düşer. Hiçbir düzeye sığmayan -1 alır (çizilmez).
function assign(ds,levels){const n=ds.length,out=new Int8Array(n).fill(-1),ord=new Array(n),cnt=levels.map(()=>0);for(let i=0;i<n;i++)ord[i]=i;ord.sort((a,b)=>ds[a]-ds[b]);
 for(const i of ord){const d=ds[i];for(let l=0;l<levels.length;l++){const L=levels[l];if(d<L.r&&cnt[l]<(L.max==null?Infinity:L.max)){out[i]=l;cnt[l]++;break;}}}return out;}
// Kart köşeleri. Ağaç: gövde ekseninde kesişen iki dik dörtgen (yarı genişlik R, boy H); resmin sol yarısı +Z'den, sağ yarısı +X'ten bakıştır.
// Her dörtgen iki yüzüyle de çizilir (üçgenler ters sırayla yinelenir) ve normaller yukarı bakar: kart hangi yandan bakılırsa bakılsın aynı aydınlanır.
function treeCard(R,H){return {pos:[-R,0,0, R,0,0, R,H,0, -R,H,0,  0,0,R, 0,0,-R, 0,H,-R, 0,H,R],uv:[0,0, .5,0, .5,1, 0,1,  .5,0, 1,0, 1,1, .5,1],nor:[0,1,0,0,1,0,0,1,0,0,1,0, 0,1,0,0,1,0,0,1,0,0,1,0],idx:[0,1,2,0,2,3,0,2,1,0,3,2,4,5,6,4,6,7,4,6,5,4,7,6]};}
// Duvar: duvar düzleminde tek dörtgen (boy L, yükseklik y0..y1); resim +X'ten (Türkiye yanından) bakıştır, sağ = -Z.
function wallCard(L,y0,y1){const h=L/2;return {pos:[0,y0,h, 0,y0,-h, 0,y1,-h, 0,y1,h],uv:[0,0, 1,0, 1,1, 0,1],nor:[1,0,0,1,0,0,1,0,0,1,0,0],idx:[0,1,2,0,2,3]};}
const core=Object.freeze({VERSION,parse,axis,move,scaleNormals,assign,treeCard,wallCard});
if(typeof module==='object'&&module.exports)module.exports=core;
if(!doc)return;
// ---------- oyun ----------
const stat={loaded:0,failed:0,props:0,hi:0};const PROPS=[];let hooked=false;
async function load(url){const r=await fetch(url);if(!r.ok){stat.failed++;throw new Error(url+' '+r.status);}const d=parse(await r.arrayBuffer());stat.loaded++;return d;}
// Geometri: o.rotY (radyan) ve o.card (kart köşeleri) isteğe bağlı. Normal yoksa hesaplanır.
function geometry(d,o){o=o||{};const T=root.THREE,g=new T.BufferGeometry(),F=a=>a instanceof Float32Array?a:new Float32Array(a);g.setAttribute('position',new T.BufferAttribute(F(d.pos),3));g.setAttribute('uv',new T.BufferAttribute(F(d.uv),2));
 g.setIndex(new T.BufferAttribute(d.idx instanceof Uint32Array||d.idx instanceof Uint16Array?d.idx:new Uint16Array(d.idx),1));if(d.nor)g.setAttribute('normal',new T.BufferAttribute(F(d.nor),3));else g.computeVertexNormals();
 if(o.rotY)g.rotateY(o.rotY);g.computeBoundingSphere();return g;}
// Doku: model dokuları glTF düzenindedir (ters çevrilmez); kart resimleri olağan düzendedir.
function texture(url,card){const t=new root.THREE.TextureLoader().load(url);t.flipY=!!card;t.anisotropy=4;return t;}
// Malzeme: o.gain dokunun parlaklık çarpanıdır; tek sayı ya da [kırmızı, yeşil, mavi] (gönderilen modellerin dokusu yalın renktir; koyu olanlar
// oyunun ışığına göre açılır)
function opts(o){o=Object.assign({},o||{});if(o.gain!=null){const g=o.gain,a=Array.isArray(g)?g:[g,g,g];o.color=new root.THREE.Color(a[0],a[1],a[2]);delete o.gain;}return o;}
function material(tex,o){return new root.THREE.MeshLambertMaterial(Object.assign({map:tex},opts(o)));}
function cardMaterial(tex,o){return new root.THREE.MeshLambertMaterial(Object.assign({map:tex,alphaTest:.35,side:root.THREE.DoubleSide},opts(o)));}
// Kodla kurulan küçük parçalar (römork, saman balyası, dron): kutu ve silindirlerden tek geometri; köşe rengi parça rengidir.
// Parça: {t:'b' kutu [g,y,d] | 'c' silindir [üst yarıçap, alt yarıçap, boy], s ölçü, p konum, r dönüş (Euler), c renk}
function merge(parts){const T=root.THREE,pos=[],nor=[],col=[],idx=[],c=new T.Color(),q=new T.Quaternion(),e=new T.Euler(),v=new T.Vector3(),m=new T.Matrix4(),one=new T.Vector3(1,1,1);let base=0;
 for(const pr of parts){const g=pr.t==='b'?new T.BoxGeometry(pr.s[0],pr.s[1],pr.s[2]):new T.CylinderGeometry(pr.s[0],pr.s[1],pr.s[2],pr.n||14),r=pr.r||[0,0,0];e.set(r[0],r[1],r[2]);q.setFromEuler(e);m.compose(v.set(pr.p[0],pr.p[1],pr.p[2]),q,one);
  const nm=new T.Matrix3().getNormalMatrix(m),P=g.attributes.position,N=g.attributes.normal;c.setHex(pr.c);
  for(let i=0;i<P.count;i++){v.fromBufferAttribute(P,i).applyMatrix4(m);pos.push(v.x,v.y,v.z);v.fromBufferAttribute(N,i).applyMatrix3(nm).normalize();nor.push(v.x,v.y,v.z);col.push(c.r,c.g,c.b);}
  const I=g.index.array;for(let i=0;i<I.length;i++)idx.push(I[i]+base);base+=P.count;g.dispose();}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('normal',new T.Float32BufferAttribute(nor,3));g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.setIndex(idx);g.computeBoundingSphere();return g;}
// Tek nesne (araç, kule, mahalle): gruba yakın ve uzak örgü eklenir; her karede kameraya en yakın birkaç tanesi ayrıntılı, ötekiler hafif çizilir.
// o.near: ayrıntılı çizim uzaklığı (m), o.max: aynı anahtardan en çok kaç nesne ayrıntılı çizilir, o.key: anahtar.
// o.at: uzaklığı ölçülecek nesne (örgüler bir alt gruba eklendiyse dünyadaki kök grup), o.gone: kökü sahneden kaldırılınca listeden düşer
// (ölen piyade gibi geçici nesneler). Dönen kayıtta force=true yapılırsa nesne uzaklığa bakılmadan ayrıntılı çizilir (küçük pencere çekimi).
function prop(group,hiGeo,loGeo,mat,o){o=o||{};const T=root.THREE,hi=new T.Mesh(hiGeo,mat),lo=new T.Mesh(loGeo||hiGeo,o.loMat||mat);hi.castShadow=o.shadow!==false;lo.castShadow=false;hi.receiveShadow=lo.receiveShadow=o.receive!==false;hi.visible=false;hi.name='MD_YAKIN';lo.name='MD_UZAK';
 group.add(hi,lo);const p={g:group,at:o.at||group,hi,lo,near:o.near||60,max:o.max||2,key:o.key||'x',isHi:false,gone:!!o.gone,seen:false,age:0,force:false};PROPS.push(p);stat.props=PROPS.length;hook();return p;}
function tick(){const c=safe(()=>CAM.position,null);if(!c||!PROPS.length)return;const by={};let nh=0;
 for(let i=PROPS.length-1;i>=0;i--){const p=PROPS[i],a=p.at;p.isHi=false;if(!a.parent){if(p.gone&&(p.seen||++p.age>600)){p.hi.visible=false;p.lo.visible=true;PROPS.splice(i,1);stat.props=PROPS.length;}continue;}p.seen=true;if(!a.visible)continue;
  if(p.force){p.isHi=true;nh++;continue;}const w=a.position,d=Math.hypot(w.x-c.x,w.z-c.z);p.d=d;if(d<p.near)(by[p.key]||(by[p.key]=[])).push(p);}
 for(const k in by){const a=by[k];a.sort((p,q)=>p.d-q.d);for(let i=0;i<a.length&&i<a[i].max;i++){a[i].isHi=true;nh++;}}
 for(const p of PROPS){if(p.hi.visible!==p.isHi)p.hi.visible=p.isHi;if(p.lo.visible===p.isHi)p.lo.visible=!p.isHi;}stat.hi=nh;}
function hook(){if(hooked||typeof FRAME_HOOKS==='undefined')return;hooked=true;FRAME_HOOKS.push(()=>safe(tick,null));}
function release(p){const i=PROPS.indexOf(p);if(i<0)return false;PROPS.splice(i,1);stat.props=PROPS.length;return true;}
root.HisarModel=Object.freeze({version:VERSION,core,load,geometry,texture,material,cardMaterial,merge,prop,release,tick,props:()=>PROPS.map(p=>({key:p.key,hi:p.isHi,d:p.d})),diagnostics:()=>({version:VERSION,...stat})});
})(typeof window!=='undefined'?window:globalThis);
