/* HİSAR SİMÜLATÖR · Şantiye iş makineleri (model kütüphanesi)
 * Kaynak: santiye-250888c5/index.html. Model kodu satır satır taşındı (değiştirilmedi):
 *   289-293 sabitler · 294-491 Soup/DOME kütüphanesi · 499 MV/ME · 774-777 geometri ve doku yardımcıları
 *   1225-1470 model yardımcıları · 1471-1841 makineler (TYPES, buildModel)
 * Kaynağın geri kalanı (arazi, işler, oyun döngüsü, diyaloglar, karakterler, tank) taşınmadı.
 * Dışa açılan: H.santiye = { build(tip), TYPES, SP }   tip: ex dz bh ld tr gr gt
 */
(function () {
  'use strict';
  var H = window.HISAR;
  // ---- shim: kaynağın ortam değişkenleri ----
  var FRAME_HOOKS = [], ENV = null, tod = 0, heightAt = function () { return 0; };
  var pileMat = new THREE.MeshLambertMaterial({ color: 0xa9a08a });
  var window_hs = {};
  var __hs = window_hs;
const PI=Math.PI,Y90=PI/2;
const MZ=window.MZ={tz:.1,ty:1.70,z:1.0,d:4.8,gy:.44};MZ.y=MZ.ty+MZ.gy;       // tur halkasi, top pivotu, namlu boyu
const RUB=0x141516,STL=0x24272a,ALU=0x6f757b,HUB=0x3b3f43,BLT=0x1b1d20,GUN=0x2b2f34,GUN2=0x3a3f45,GLS=0x17303b,LMP=0xfff0b0,TAIL=0xd02020,DRK=0x1b1d1f,TRP=0x6b6247,ROP=0x4d4331,KHK=0x4f5640,CBL=0x2c2e2c;
const UB=new THREE.BoxGeometry(1,1,1);
const T4=new THREE.Matrix4(),TQ=new THREE.Quaternion(),TE=new THREE.Euler(0,0,0,'YXZ'),TV=new THREE.Vector3(),TS=new THREE.Vector3(),TN=new THREE.Matrix3(),TC=new THREE.Color(),TW=new THREE.Vector3(),UYv=new THREE.Vector3(0,1,0);
class Soup{
 constructor(){this.p=[];this.n=[];this.c=[]}
 gm(g,col){const q=g.index?g.toNonIndexed():g;TN.getNormalMatrix(T4);TC.set(col==null?0x808080:col);const P=q.attributes.position.array,N=q.attributes.normal.array,n=P.length/3;
  for(let i=0;i<n;i++){TW.set(P[i*3],P[i*3+1],P[i*3+2]).applyMatrix4(T4);this.p.push(TW.x,TW.y,TW.z);TW.set(N[i*3],N[i*3+1],N[i*3+2]).applyMatrix3(TN).normalize();this.n.push(TW.x,TW.y,TW.z);this.c.push(TC.r,TC.g,TC.b)}
  if(q!==g)q.dispose();return this}
 geo(g,x,y,z,col,rx,ry,rz,sx,sy,sz){TE.set(rx||0,ry||0,rz||0);TQ.setFromEuler(TE);TV.set(x,y,z);TS.set(sx==null?1:sx,sy==null?1:sy,sz==null?1:sz);T4.compose(TV,TQ,TS);return this.gm(g,col)}
 box(w,h,d,x,y,z,col,rx,ry,rz){return this.geo(UB,x,y,z,col,rx,ry,rz,w,h,d)}
 cyl(rt,rb,h,x,y,z,col,ax,seg,rx,ry,rz){const g=new THREE.CylinderGeometry(rt,rb,h,seg||12,1);if(ax==='z')g.rotateX(Y90);else if(ax==='x')g.rotateZ(-Y90);return this.geo(g,x,y,z,col,rx,ry,rz)}
 sph(sx,sy,sz,x,y,z,col,seg,rx,ry,rz){const n=seg||10;return this.geo(new THREE.SphereGeometry(1,n,Math.max(4,n>>1)),x,y,z,col,rx,ry,rz,sx,sy,sz)}
 rod(a,b,r,col,seg){TV.set(b[0]-a[0],b[1]-a[1],b[2]-a[2]);const L=TV.length();TV.normalize();TQ.setFromUnitVectors(UYv,TV);TS.set(1,1,1);const m=new THREE.Vector3((a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2);T4.compose(m,TQ,TS);return this.gm(new THREE.CylinderGeometry(r,r,L,seg||6,1),col)}
 tri(a,b,c,col,na,nb,nc){if(!na){const ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2];let nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;const l=Math.hypot(nx,ny,nz);if(l<1e-9)return this;na=nb=nc=[nx/l,ny/l,nz/l]}
  TC.set(col==null?0x808080:col);for(const[v,n]of[[a,na],[b,nb],[c,nc]]){this.p.push(v[0],v[1],v[2]);this.n.push(n[0],n[1],n[2]);this.c.push(TC.r,TC.g,TC.b)}return this}
 quad(a,b,c,d,col,h){// h: disari bakan ipucu vektoru; yuzey tersse sarmal cevrilir
  const ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2];const nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;
  if(h&&nx*h[0]+ny*h[1]+nz*h[2]<0){this.tri(a,d,c,col);this.tri(a,c,b,col)}else{this.tri(a,b,c,col);this.tri(a,c,d,col)}return this}
obox(w,h,d,x,y,z,col,ry){const hw=w/2,hh=h/2,hd=d/2,c=Math.cos(ry||0),s=Math.sin(ry||0),Q=(a,b,e)=>[x+a*c+e*s,y+b,z-a*s+e*c],A=Q(-hw,-hh,hd),Bq=Q(hw,-hh,hd),Cq=Q(hw,hh,hd),Dq=Q(-hw,hh,hd),E=Q(-hw,-hh,-hd),F=Q(hw,-hh,-hd),G=Q(hw,hh,-hd),H=Q(-hw,hh,-hd);
  this.quad(A,Bq,Cq,Dq,col,[s,0,c]);this.quad(Bq,F,G,Cq,col,[c,0,-s]);this.quad(E,A,Dq,H,col,[-c,0,s]);this.quad(Dq,Cq,G,H,col,[0,1,0]);this.quad(E,F,Bq,A,col,[0,-1,0]);return this}
 loft(sc,col){// kesitler: [z,w0,w1,y0,y1] -> kutu benzeri govde (alt yarim genislik w0, ust w1)
  const V=s=>({L0:[s[1],s[3],s[0]],R0:[-s[1],s[3],s[0]],R1:[-s[2],s[4],s[0]],L1:[s[2],s[4],s[0]]});
  const f=V(sc[0]),l=V(sc[sc.length-1]);this.quad(f.L0,f.R0,f.R1,f.L1,col,[0,0,-1]);this.quad(l.L0,l.R0,l.R1,l.L1,col,[0,0,1]);
  for(let i=0;i<sc.length-1;i++){const a=V(sc[i]),b=V(sc[i+1]);this.quad(a.L1,a.R1,b.R1,b.L1,col,[0,1,0]);this.quad(a.L0,a.R0,b.R0,b.L0,col,[0,-1,0]);this.quad(a.L0,a.L1,b.L1,b.L0,col,[1,0,0]);this.quad(a.R0,a.R1,b.R1,b.R0,col,[-1,0,0])}return this}
 mesh(mat,uv){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(this.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(this.n,3));g.setAttribute('color',new THREE.Float32BufferAttribute(this.c,3));
  if(uv){const P=this.p,u=[];for(let i=0;i<P.length;i+=9){const ax=P[i+3]-P[i],ay=P[i+4]-P[i+1],az=P[i+5]-P[i+2],bx=P[i+6]-P[i],by=P[i+7]-P[i+1],bz=P[i+8]-P[i+2],nx=Math.abs(ay*bz-az*by),ny=Math.abs(az*bx-ax*bz),nz=Math.abs(ax*by-ay*bx);
    for(let k=0;k<3;k++){const x=P[i+k*3],y=P[i+k*3+1],z=P[i+k*3+2];if(ny>=nx&&ny>=nz)u.push(x*.3+.17,z*.3+.05);else if(nx>=nz)u.push(z*.3+.31,y*.3);else u.push(x*.3+.07,y*.3+.4)}}
   g.setAttribute('uv',new THREE.Float32BufferAttribute(u,2))}
  g.computeBoundingSphere();return g}}
// smooth govde (turret kubbesi): profil [rho,y] x oval plan
function domeInto(S,prof,nA,AXf,AXb,AZf,AZb,tp,CZ,opt){opt=opt||{};const R=prof.length,P=[],N=[];
 for(let j=0;j<R;j++){const row=[];for(let i=0;i<nA;i++){const a=i/nA*PI*2,cu=Math.cos(a),su=Math.sin(a),r=prof[j][0],fr=su>0;row.push([r*(fr?AXf:AXb)*cu*(fr?1-tp*su*su:1),prof[j][1],CZ+r*(fr?AZf:AZb)*su]);}P.push(row);N.push(row.map(()=>[0,0,0]))}
 const fc=[];
 for(let j=0;j<R-1;j++)for(let i=0;i<nA;i++){const i2=(i+1)%nA,a=P[j][i],b=P[j][i2],c=P[j+1][i2],d=P[j+1][i];
  if(opt.hole&&Math.hypot((a[0]+b[0]+c[0]+d[0])/4-opt.hole.x,(a[2]+b[2]+c[2]+d[2])/4-opt.hole.z)<opt.hole.r)continue;
  for(const t of[[[j,i],[j+1,i],[j,i2]],[[j,i2],[j+1,i],[j+1,i2]]]){const A=P[t[0][0]][t[0][1]],B=P[t[1][0]][t[1][1]],C=P[t[2][0]][t[2][1]];let ux=B[0]-A[0],uy=B[1]-A[1],uz=B[2]-A[2],vx=C[0]-A[0],vy=C[1]-A[1],vz=C[2]-A[2];let nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;
   const l=Math.hypot(nx,ny,nz);if(l<1e-7)continue;const cx=(A[0]+B[0]+C[0])/3,cy=(A[1]+B[1]+C[1])/3-.35,cz=(A[2]+B[2]+C[2])/3-CZ;let tt=t;if(nx*cx+ny*cy+nz*cz<0){tt=[t[0],t[2],t[1]];nx=-nx;ny=-ny;nz=-nz}
   for(const[jj,ii]of tt){const q=N[jj][ii];q[0]+=nx;q[1]+=ny;q[2]+=nz}fc.push(tt)}}
 for(const row of N)for(const q of row){const l=Math.hypot(q[0],q[1],q[2])||1;q[0]/=l;q[1]/=l;q[2]/=l}
 const cl=opt.col!=null?opt.col:0x808080,ng=q=>[-q[0],-q[1],-q[2]];
 for(const t of fc){const v=t.map(([j,i])=>P[j][i]),n=t.map(([j,i])=>N[j][i]);if(opt.inv)S.tri(v[0],v[2],v[1],cl,ng(n[0]),ng(n[2]),ng(n[1]));else S.tri(v[0],v[1],v[2],cl,n[0],n[1],n[2])}}
// -------- palet bandi (konveks zarf, dokulu) --------
function hull2(pts){pts.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);const lo=[];for(const p of pts){while(lo.length>=2&&cr(lo[lo.length-2],lo[lo.length-1],p)<=0)lo.pop();lo.push(p)}
 const up=[];for(let i=pts.length-1;i>=0;i--){const p=pts[i];while(up.length>=2&&cr(up[up.length-2],up[up.length-1],p)<=0)up.pop();up.push(p)}up.pop();lo.pop();return lo.concat(up)}
const WZ=[1.95,1.21,.47,-.27,-1.01,-1.75],IDL=[2.80,.72,.36],SPR=[-2.75,.78,.37],TKX=1.46,TKW=.35,TKT=.09;
function trackGeo(){const circ=[[IDL[0],IDL[1],IDL[2]+TKT],[SPR[0],SPR[1],SPR[2]+TKT]];for(const z of WZ)circ.push([z,.42,.33+TKT]);
 let pts=[];for(const[z,y,r]of circ)for(let k=0;k<20;k++){const a=k/20*PI*2;pts.push([z+Math.cos(a)*r,y+Math.sin(a)*r])}
 const H=hull2(pts),n=H.length,O=[],I=[],Nn=[];
 for(let k=0;k<n;k++){const a=H[(k+n-1)%n],b=H[k],c=H[(k+1)%n];const e1=[b[0]-a[0],b[1]-a[1]],e2=[c[0]-b[0],c[1]-b[1]],l1=Math.hypot(...e1)||1,l2=Math.hypot(...e2)||1;let nx=e1[1]/l1+e2[1]/l2,ny=-e1[0]/l1-e2[0]/l2;const l=Math.hypot(nx,ny)||1;nx/=l;ny/=l;Nn.push([nx,ny]);O.push(b);I.push([b[0]-nx*TKT,b[1]-ny*TKT])}
 let L=0;const S=[0];for(let k=0;k<n;k++){L+=Math.hypot(H[(k+1)%n][0]-H[k][0],H[(k+1)%n][1]-H[k][1]);S.push(L)}
 const cnt=Math.max(1,Math.round(L/.72)),tl=L/cnt,pos=[],nor=[],uv=[];
 const push=(x,y,z,nx,ny,nz,u,v)=>{pos.push(x,y,z);nor.push(nx,ny,nz);uv.push(u,v)};
 for(let k=0;k<n;k++){const k2=(k+1)%n,u1=S[k]/tl,u2=S[k+1]/tl;
  // dis yuzey
  const A=O[k],B=O[k2],nA=Nn[k],nB=Nn[k2];
  const q=(xa,xb,pa,pb,na,nb,ua,ub,va,vb,s)=>{};
  push(-TKW,A[1],A[0],0,nA[1],nA[0],u1,0);push(TKW,A[1],A[0],0,nA[1],nA[0],u1,1);push(TKW,B[1],B[0],0,nB[1],nB[0],u2,1);
  push(-TKW,A[1],A[0],0,nA[1],nA[0],u1,0);push(TKW,B[1],B[0],0,nB[1],nB[0],u2,1);push(-TKW,B[1],B[0],0,nB[1],nB[0],u2,0);
  // ic yuzey
  const Ia=I[k],Ib=I[k2];
  push(-TKW,Ia[1],Ia[0],0,-nA[1],-nA[0],u1,.5);push(TKW,Ib[1],Ib[0],0,-nB[1],-nB[0],u2,.5);push(TKW,Ia[1],Ia[0],0,-nA[1],-nA[0],u1,.5);
  push(-TKW,Ia[1],Ia[0],0,-nA[1],-nA[0],u1,.5);push(-TKW,Ib[1],Ib[0],0,-nB[1],-nB[0],u2,.5);push(TKW,Ib[1],Ib[0],0,-nB[1],-nB[0],u2,.5);
  // yan yuzler
  for(const sx of[-1,1]){const x=sx*TKW;const a=[x,A[1],A[0]],b=[x,B[1],B[0]],c=[x,Ib[1],Ib[0]],d=[x,Ia[1],Ia[0]];
   const o=sx>0?[a,d,c,a,c,b]:[a,c,d,a,b,c];const uu=[u1,u1,u2,u1,u2,u2];for(let i=0;i<6;i++)push(o[i][0],o[i][1],o[i][2],sx,0,0,uu[i],.03)}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.computeBoundingSphere();g.userData.tl=tl;return g}
function trackTex(){const k=document.createElement('canvas');k.width=128;k.height=32;const c=k.getContext('2d');c.fillStyle='#17191b';c.fillRect(0,0,128,32);
 for(let i=0;i<4;i++){const x=i*32;c.fillStyle='#3a3e42';c.fillRect(x+3,5,26,22);c.fillStyle='#50555a';c.fillRect(x+4,6,24,3);c.fillStyle='#2a2d30';c.fillRect(x+4,22,24,4);c.fillStyle='#202326';c.fillRect(x+13,4,6,24);c.fillStyle='#5a5f64';c.fillRect(x+14,10,4,4)}
 for(let i=0;i<60;i++){c.fillStyle='rgba(0,0,0,.22)';c.fillRect(Math.random()*128,Math.random()*32,2,2)}
 const t=new THREE.CanvasTexture(k);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t}
// -------- govde --------
function buildHull(C,V,E){
 // ana govde (dokme celik, sivri burun)
 C.loft([[-3.45,1.05,1.18,.66,1.44],[-3.38,1.30,1.42,.56,1.56],[-3.20,1.40,1.50,.50,1.62],[-1.0,1.40,1.50,.46,1.62],[1.15,1.40,1.50,.46,1.60],[1.55,1.40,1.50,.46,1.50],[2.20,1.30,1.38,.52,1.26],[2.85,1.10,1.14,.62,1.08],[3.25,.84,.86,.76,.98],[3.50,.60,.62,.86,.94]]);
 // tur halkasi yakasi
 V.cyl(1.2,1.26,.2,0,1.66,MZ.tz,DRK,'y',24);
 for(const s of[1,-1]){const xc=s*TKX;
  // camurluk + on kanat
  C.box(.42,.05,6.2,s*1.70,1.43,-.15);C.box(.42,.05,.75,s*1.70,1.52,3.02,0,-.28);
  // yol tekerlekleri
  for(const z of WZ){V.cyl(.33,.33,.30,xc,.42,z,RUB,'x',14);V.cyl(.285,.285,.31,xc,.42,z,0x3b3f43,'x',14);V.cyl(.24,.24,.33,xc,.42,z,ALU,'x',14);V.cyl(.105,.105,.38,xc,.42,z,HUB,'x',10);
   for(let k=0;k<6;k++){const a=k*PI/3;V.cyl(.024,.024,.03,xc+s*.2,.42+Math.sin(a)*.165,z+Math.cos(a)*.165,BLT,'x',5)}}
  // tasiyici makaralar
  for(const z of[1.25,.2,-.95]){V.cyl(.14,.14,.27,xc,1.0,z,RUB,'x',12);V.cyl(.07,.07,.31,xc,1.0,z,HUB,'x',8)}
  // avare (on) ve tahrik dislisi (arka) - yukseltilmis
  V.cyl(IDL[2],IDL[2],.30,xc,IDL[1],IDL[0],0x33373b,'x',16);V.cyl(.29,.29,.33,xc,IDL[1],IDL[0],ALU,'x',14);V.cyl(.1,.1,.4,xc,IDL[1],IDL[0],HUB,'x',10);
  for(let k=0;k<8;k++){const a=k*PI/4;V.cyl(.05,.05,.345,xc,IDL[1]+Math.sin(a)*.19,IDL[0]+Math.cos(a)*.19,BLT,'x',8)}
  V.cyl(SPR[2],SPR[2],.30,xc,SPR[1],SPR[0],0x2d3034,'x',14);V.cyl(.3,.3,.33,xc,SPR[1],SPR[0],0x50565c,'x',14);V.cyl(.13,.13,.4,xc,SPR[1],SPR[0],HUB,'x',10);
  for(let k=0;k<10;k++){const a=k*PI/5;V.cyl(.022,.022,.03,xc+s*.2,SPR[1]+Math.sin(a)*.22,SPR[0]+Math.cos(a)*.22,BLT,'x',5);V.box(.28,.09,.1,xc,SPR[1]+Math.sin(a)*.385,SPR[0]+Math.cos(a)*.385,0x2a2d30,-a)}
  // amortisorler (1,2,6. tekerlek)
  for(const z of[1.95,1.21,-1.75])V.rod([xc+s*.16,.95,z-.12],[xc+s*.16,.6,z+.14],.05,0x555a60,6);
  // yakit depolari (harici) ve alet kutulari
  C.box(.40,.62,1.2,s*1.70,1.795,-2.55);V.box(.43,.66,.05,s*1.70,1.795,-2.95,0x24272a);V.box(.43,.66,.05,s*1.70,1.795,-2.15,0x24272a);V.cyl(.06,.06,.05,s*1.70,2.13,-2.55,0x555a60,'y',8);
  if(s>0){C.box(.36,.30,1.5,s*1.70,1.62,.35);V.box(.38,.05,.05,s*1.70,1.78,-.35,0x2b2e30);V.box(.38,.05,.05,s*1.70,1.78,1.05,0x2b2e30);
   // kuru'k ve balta (on camurluk)
   V.box(.05,.035,1.1,s*1.62,1.50,2.0,0x4b3b24);V.box(.26,.03,.30,s*1.62,1.50,2.6,0x5b6068);V.box(.04,.04,.9,s*1.80,1.50,1.95,0x4b3b24);V.box(.08,.03,.2,s*1.80,1.50,2.5,0x6a7077)}
  else{C.box(.36,.28,1.0,s*1.70,1.60,.85);C.box(.36,.28,.9,s*1.70,1.60,-.75);V.cyl(.24,.24,.13,s*1.70,1.52,2.0,ROP,'y',12);V.cyl(.12,.12,.15,s*1.70,1.52,2.0,0x23262a,'y',8)}
  // on camurluk lambasi
  V.box(.14,.14,.16,s*1.62,1.60,3.12,STL);E.cyl(.058,.058,.03,s*1.62,1.60,3.215,LMP,'z',10);
 }
 // motor guvertesi: izgaralar, omurga, kapaklar
 for(const s of[1,-1]){V.box(.98,.035,1.55,s*.58,1.635,-2.2,DRK);for(let i=0;i<8;i++)V.box(.94,.035,.055,s*.58,1.66,-2.88+i*.2,0x34383c)}
 C.box(.3,.07,3.0,0,1.65,-1.95);V.cyl(.2,.2,.04,0,1.69,-1.1,0x33373b,'y',12);V.cyl(.2,.2,.04,0,1.69,-2.6,0x33373b,'y',12);
 V.box(2.2,.04,.42,0,1.63,-.78,DRK);for(let i=0;i<5;i++)V.box(2.1,.03,.04,0,1.655,-.92+i*.075,0x34383c);
 // arka levha: egzoz, cekme, stop lambalari
 for(const s of[1,-1]){V.box(.62,.3,.08,s*.62,.95,-3.46,DRK);for(let i=0;i<4;i++)V.box(.58,.022,.1,s*.62,.84+i*.07,-3.46,0x35393d);E.box(.1,.06,.05,s*1.0,1.3,-3.47,TAIL);V.cyl(.07,.07,.1,s*.9,.7,-3.5,0x3a3e42,'z',8);V.box(.14,.14,.12,s*.45,1.32,-3.44,STL)}
 V.cyl(.08,.08,.18,0,.8,-3.52,0x555a60,'z',8);
 // surucu kapagi, periskoplar, farlar, cekme halatlari
 const gz=1.85,gy=1.37;V.cyl(.37,.40,.1,0,gy+.02,gz,DRK,'y',14);C.cyl(.30,.34,.08,0,gy+.1,gz,0,'y',14);
 for(const a of[-.55,0,.55])V.box(.13,.07,.06,Math.sin(a)*.31,gy+.1,gz+Math.cos(a)*.31,GLS,0,a);
 V.box(.2,.04,.05,0,gy+.15,gz-.05,0x555a60);
 for(const s of[1,-1]){V.rod([s*.5,1.45,1.75],[s*.46,1.06,3.2],.034,CBL,6);V.cyl(.07,.07,.05,s*.46,1.04,3.26,0x4a4e52,'z',8);V.rod([s*.95,1.5,1.55],[s*.5,1.45,1.75],.03,CBL,6)}
 // kapalı kaporta/golge'lik: on alt levha cekme gozu
 for(const s of[1,-1])V.cyl(.07,.07,.07,s*.3,.92,3.52,0x555a60,'z',8)
}
// -------- tur --------
const DOME={AXf:1.5,AXb:1.62,AZf:1.75,AZb:2.25,tp:.26,CZ:-.15,prof:[[1,-.06],[1,.30],[.99,.46],[.95,.62],[.88,.76],[.78,.88],[.64,.98],[.46,1.05],[.24,1.09],[0,1.10]]};
function domeR(y){const p=DOME.prof;if(y<=p[0][1])return p[0][0];for(let i=0;i<p.length-1;i++){const a=p[i],b=p[i+1];if(y<=b[1])return a[0]+(b[0]-a[0])*(y-a[1])/(b[1]-a[1])}return 0}
function domeW(z,y){const r=domeR(y==null?.2:y),D=DOME,dz=z-D.CZ,fr=dz>0,su=dz/(r*(fr?D.AZf:D.AZb));if(Math.abs(su)>=1)return 0;return r*(fr?D.AXf:D.AXb)*Math.sqrt(1-su*su)*(fr?1-D.tp*su*su:1)}
function domeSlope(z,y){return(domeW(z+.03,y)-domeW(z-.03,y))/.06}
const CUP={x:-.62,z:-.55};
function buildTurret(C,V,E,D){
 domeInto(D,DOME.prof,40,DOME.AXf,DOME.AXb,DOME.AZf,DOME.AZb,DOME.tp,DOME.CZ,{hole:{x:CUP.x,z:CUP.z,r:.5}});
 // tur gövde dikişi ve alt kenar
 V.cyl(1.0,1.0,.04,0,-.07,0,DRK,'y',10);
 // M19 komutan kulesi (sag, -x): 6 gozetleme pencereli halka, kapak, mesnet
 const cx=CUP.x,cz=CUP.z,NCU=24,RC=.56,AO=-2.5/24*PI*2;
 const band=(y0,y1,skip)=>{for(let k=0;k<NCU;k++){if(skip&&skip(k))continue;const a0=k/NCU*PI*2+AO,a1=(k+1)/NCU*PI*2+AO,am=(a0+a1)/2;
  V.quad([cx+Math.sin(a0)*RC,y0,cz+Math.cos(a0)*RC],[cx+Math.sin(a1)*RC,y0,cz+Math.cos(a1)*RC],[cx+Math.sin(a1)*RC,y1,cz+Math.cos(a1)*RC],[cx+Math.sin(a0)*RC,y1,cz+Math.cos(a0)*RC],KHK,[Math.sin(am),0,Math.cos(am)])}};
 band(.9,1.0);band(1.0,1.34,k=>k%4!==0);band(1.34,1.42);
 C.cyl(.50,.54,.12,cx,1.43,cz,0,'y',20);V.cyl(.39,.39,.05,cx,1.51,cz,DRK,'y',16);C.cyl(.34,.36,.07,cx,1.56,cz,0,'y',16);
 for(let m=0;m<6;m++){const a=(4*m+2.5)/NCU*PI*2+AO;V.obox(.32,.3,.06,cx+Math.sin(a)*(RC+.03),1.17,cz+Math.cos(a)*(RC+.03),GLS,a);
  for(const q of[-1,1])V.box(.025,.33,.075,cx+Math.sin(a)*(RC+.03)+Math.cos(a)*q*.17,1.17,cz+Math.cos(a)*(RC+.03)-Math.sin(a)*q*.17,STL,0,a)}
 V.box(.28,.04,.06,cx,1.62,cz-.1,0x555a60);V.rod([cx+.16,1.6,cz-.3],[cx+.3,1.57,cz-.08],.025,0x555a60,6);
 V.box(.26,.22,.3,cx,1.50,cz+.38,STL);                          // M85 mesnedi (tabanda sabit)
 // yukleyici kapagi (sol, +x)
 const lx=.72,lz=-.9;V.cyl(.42,.44,.15,lx,1.07,lz,KHK,'y',16);C.cyl(.36,.4,.07,lx,1.17,lz,0,'y',16);V.cyl(.08,.08,.05,lx,1.23,lz,0x555a60,'y',8);
 // nisan nisangah kaputu + periskop (sag-on)
 V.box(.4,.2,.5,-.5,.98,.62,STL);V.box(.32,.1,.04,-.5,1.0,.9,GLS);V.box(.14,.18,.3,-.9,.95,.55,GUN2);V.cyl(.06,.06,.2,-.9,1.1,.55,GLS,'y',6);
 // tur arkasi: havalandirma, kaldirma halkalari, anten tabanlari
 C.box(.95,.18,.7,0,.76,-1.75);for(let i=0;i<5;i++)V.box(.9,.03,.05,0,.87,-1.95+i*.12,0x34383c);
 for(const s of[1,-1]){V.cyl(.09,.11,.12,s*.78,.84,-1.45,STL,'y',10);V.rod([s*.78,.9,-1.45],[s*.7,2.45,-1.5],.012,0x1c1c1c,5);V.box(.05,.14,.05,s*.35,1.1,.12,0x555a60)}
 // sis atici (duman) kovanlari: iki yanda 2 sira x 3 tup, tur govdesine oturur
 for(const s of[1,-1]){const zc=.78,w0=domeW(zc,.2),ph=Math.atan2(1,-domeSlope(zc,.2)),th=s*ph,tx=Math.cos(th),tz=-Math.sin(th),nx=Math.sin(th),nz=Math.cos(th);
  V.box(.5,.34,.05,s*(w0+.012),.22,zc,STL,0,th);
  for(let r=0;r<2;r++)for(let c=0;c<3;c++){const o=(c-1)*.13,y=.13+r*.13,px=s*(w0+.012)+tx*o+nx*.04,pz=zc+tz*o+nz*.04;
   V.rod([px,y,pz],[px+nx*.3,y+.04,pz+nz*.3],.04,0x30343a,7);V.rod([px+nx*.29,y+.038,pz+nz*.29],[px+nx*.31,y+.042,pz+nz*.31],.031,0x0b0c0d,7)}}
 // arka depolama sepeti (kompakt): tur kubbesinin arkasindan .4 m
 for(const s of[1,-1])V.box(.04,.5,.4,s*1.02,.18,-2.6,0x23262a);
 V.box(2.1,.04,.04,0,.5,-2.8,0x23262a);V.box(2.1,.04,.04,0,.2,-2.8,0x23262a);for(const x of[-1,0,1])V.box(.05,.5,.05,x*1.0,.35,-2.8,0x23262a);
 V.box(2.0,.04,.46,0,-.02,-2.6,0x23262a);V.cyl(.19,.19,.95,-.5,.2,-2.6,TRP,'x',10);V.box(.8,.26,.34,.5,.2,-2.6,0x3b4033);V.cyl(.12,.12,.5,.5,.46,-2.6,0x4b4a3a,'x',8);
 // tur kenar tutamaclari (govdeden .05 acik, govde egimine paralel)
 for(const s of[1,-1])for(const z of[-1.35,-.45,.45]){const w=domeW(z,.34),sl=domeSlope(z,.34),th=s*Math.atan(sl),hx=s*(w+.05);
  V.box(.035,.035,.22,hx,.34,z,0x555a60,0,th);V.box(.05,.035,.035,s*(w+.026),.34,z-.09,0x555a60,0,th);V.box(.05,.035,.035,s*(w+.026),.34,z+.09,0x555a60,0,th)}
}
// -------- M85 12,7 mm ucaksavar (kule tavaninda, +z ileri, mapa = tapa ekseni) --------
function buildM85(V){
 V.box(.2,.2,.7,0,0,.28,GUN2);V.box(.14,.14,.3,0,.02,-.2,STL);V.cyl(.032,.032,1.05,0,0,.97,GUN,'z',8);V.cyl(.05,.05,.42,0,0,.7,GUN2,'z',10);V.cyl(.052,.052,.12,0,0,1.55,STL,'z',8);
 V.box(.22,.2,.16,.2,-.08,.2,0x3d4a38);V.box(.08,.06,.2,0,.14,-.05,STL);V.box(.34,.32,.03,0,.02,.62,0x2c3032);V.box(.08,.1,.1,0,-.13,.1,0x555a60)}
// -------- top (namlu): 105 mm M68, termal kilif + gaz tahliye --------
function buildGun(C,V,E){
 V.box(.32,.38,1.1,0,0,-.55,GUN2);V.box(.22,.26,.5,0,-.05,-1.25,GUN);        // surgu / geri tepme (kabin ici)
 V.cyl(.118,.108,1.3,0,0,1.25,GUN,'z',14);                                    // namlu tabani
 V.cyl(.123,.123,1.25,0,0,2.05,GUN2,'z',14);for(const z of[1.55,2.05,2.55])V.cyl(.137,.137,.05,0,0,z,STL,'z',14); // termal kilif + bantlar
 V.cyl(.123,.152,.14,0,0,2.74,GUN,'z',14);V.cyl(.152,.152,.46,0,0,3.04,GUN2,'z',16);V.cyl(.152,.108,.14,0,0,3.34,GUN,'z',14); // gaz tahliye
 for(let k=0;k<6;k++){const a=k*PI/3;V.box(.04,.04,.1,Math.cos(a)*.152,Math.sin(a)*.152,3.04,STL,0,0,a)}
 V.cyl(.088,.1,1.35,0,0,4.08,GUN,'z',12);V.cyl(.108,.108,.18,0,0,4.72,STL,'z',12);V.cyl(.082,.082,.04,0,0,4.82,DRK,'z',10); // namlu + agiz bandi
 V.box(.08,.07,.14,0,.145,4.35,GUN2);V.box(.035,.1,.035,0,.1,4.35,STL);                                       // namlu referans aynasi
}
// -------- siper (mantlet) + telemetre + projektor --------
function buildMantlet(C,V,E){
 {const g=new THREE.CylinderGeometry(.55,.56,.55,20,1,true);g.rotateX(Y90);C.geo(g,0,0,.675,0)}C.sph(.55,.55,.34,0,0,.95,0,16);
 C.box(.9,.34,.62,0,.6,.42);                                                     // lazer telemetre kutusu
 V.box(.2,.15,.04,-.2,.62,.74,GLS);V.box(.2,.15,.04,.2,.62,.74,GLS);V.box(.08,.08,.05,0,.62,.74,0x555a60);V.box(.94,.04,.66,0,.8,.42,STL);
 V.cyl(.18,.18,.06,0,0,1.07,DRK,'z',14);                                       // namlu girisi
 V.cyl(.12,.25,.38,0,0,1.25,0x2b2e2a,'z',14);                                   // toz kilifi
 // koaksiyel makineli (sag, -x)
 V.box(.2,.17,.55,-.38,-.1,.85,STL);V.cyl(.032,.032,.6,-.38,-.1,1.28,GUN,'z',8);V.cyl(.045,.04,.1,-.38,-.1,1.62,STL,'z',8);
 // projektor (sol, +x): AN/VSS-1
 C.box(.46,.4,.52,.74,.16,.5);V.box(.5,.44,.05,.74,.16,.76,STL);E.cyl(.17,.17,.045,.74,.16,.8,LMP,'z',14);V.cyl(.19,.19,.04,.74,.16,.77,0x555a60,'z',14);V.box(.05,.5,.3,.58,.12,.3,STL);
 for(const s of[-1,1])V.box(.05,.05,.1,s*.5,.4,.8,0x555a60);
}
// -------- Ucangoz inis platformu (yalniz oyuncu tanki): arka guvertenin USTUNDE, tufek/anten yok --------
function buildDock(D,L){
 const cz=-3.4,LZ=1.3,WX=2.2,y0=1.76,H0=0x2b3036,H1=0x3a4048,H2=0x353a40,WH=0xf0f0f0;      // z: -4.05 .. -2.75
 D.box(WX,.06,LZ,0,y0,cz,H0);                                                              // zemin
 for(const s of[1,-1])D.box(.06,.1,LZ+.06,s*WX/2,y0+.02,cz,H1);                            // yan kenarlar
 D.box(WX+.06,.1,.06,0,y0+.02,cz-LZ/2,H1);D.box(WX+.06,.08,.06,0,y0+.01,cz+LZ/2,H1);       // arka kenar, on dudak
 for(let i=0;i<6;i++)D.box(WX-.2,.012,.05,0,y0+.036,cz-.5+i*.2,H2);                        // kaymaz nervurler
 D.geo(new THREE.RingGeometry(.42,.48,32),0,y0+.05,cz,WH,-Y90,0,0);                       // inis halkasi
 D.box(.07,.008,.4,-.15,y0+.048,cz,WH);D.box(.07,.008,.4,.15,y0+.048,cz,WH);D.box(.3,.008,.07,0,y0+.048,cz,WH); // H
 for(const s of[1,-1]){D.box(.1,.1,.8,s*.88,1.7,-3.1,H1);                                  // guverteye oturan tasiyici raylar
  D.rod([s*.8,1.22,-3.5],[s*.8,y0-.04,cz-LZ/2+.06],.04,H1,6)}                              // arka tasma altindaki capraz destekler
 for(const a of[-1,1])for(const b of[-1,1])L.box(.26,.02,.26,a*.82,y0+.04,cz+b*.45);       // durum pedleri (stM)
 L.box(1.5,.045,.06,0,y0+.07,cz-LZ/2+.02)}                                                // arka isik cubugu (stM)
// anten bayragi: tum tanklar tek geometriyi paylasir, her karede dalgalanir
let FGg=null,FGb=null;
function flagGeo(){if(FGg)return FGg;const g=new THREE.PlaneGeometry(.39,.26,7,2);g.rotateY(Y90);g.translate(0,.13,-.195);g.userData.sh=true;FGb=g.attributes.position.array.slice();FGg=g;return g}
FRAME_HOOKS.push(()=>{if(!FGg)return;const t=performance.now()/1000,p=FGg.attributes.position,a=p.array,b=FGb;
 for(let i=0;i<p.count;i++){const d=-b[i*3+2],k=d/.39;a[i*3]=.055*k*Math.sin(d*17-t*10+b[i*3+1]*5)+.012*k*Math.sin(t*6+d*31);a[i*3+2]=b[i*3+2]*(1-.1*k*Math.abs(Math.sin(d*17-t*10)))}p.needsUpdate=true});
const W=THREE;let GEO=null;window.M60X={Soup,domeInto,DOME,domeW,domeR,CUP,hull2};
const MV=new THREE.MeshLambertMaterial({vertexColors:true}),ME=new THREE.MeshBasicMaterial({vertexColors:true});
const MC = {};
function mat(c, o) { const k = c + (o ? JSON.stringify(o) : ""); return MC[k] || (MC[k] = new THREE.MeshLambertMaterial(Object.assign({color: c}, o || {}))); }
const BOX = new THREE.BoxGeometry(1, 1, 1), CYL = new THREE.CylinderGeometry(1, 1, 1, 14), CONE = new THREE.ConeGeometry(1, 1, 14);
function texCanvas(w, h, fn) { const c = document.createElement("canvas"); c.width = w; c.height = h; fn(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t; }
const X = window.M60X;
const SP = () => new X.Soup();
const GLASSM = new THREE.MeshStandardMaterial({color: 0x8fa9b6, transparent: true, opacity: .3, roughness: .04, metalness: .85, envMap: ENV, envMapIntensity: 1.2, side: THREE.DoubleSide, depthWrite: false});
const STEELM = new THREE.MeshStandardMaterial({color: 0xd9dcdd, roughness: .22, metalness: .95, envMap: ENV}), HOSEM = new THREE.MeshStandardMaterial({color: 0x1d1c1a, roughness: .5, metalness: .3, envMap: ENV, envMapIntensity: .6});
const CHROME = 0xd2d5d6, TI = 0x171615, BK = 0x1d1c1a, DG = 0x3a3833, ST = 0x6e6a63, LIT = 0xfff2c4, AMB = 0xff9a1a, RLT = 0xd4231c;
const Y = 0xf0b20a, YD = 0xc28a08, WH = 0xeceae4, KO = 0xd8952a, KOD = 0xa86c18, BLKB = 0x262626;
function put(par, s, m, cast) { if (!s.p.length) return null; const me = new THREE.Mesh(s.mesh(null, false), m || MV); me.castShadow = cast !== false; me.receiveShadow = true; par.add(me); return me; }
function grp(par, x, y, z) { const g = new THREE.Group(); g.position.set(x || 0, y || 0, z || 0); if (par) par.add(g); return g; }
function anchor(par, x, y, z) { const o = new THREE.Object3D(); o.position.set(x, y, z); par.add(o); return o; }
const UCYL = new THREE.CylinderGeometry(1, 1, 1, 10);
function rodTo(mesh, a, b, r) { TV.subVectors(b, a); const L = TV.length() || .001; mesh.position.addVectors(a, b).multiplyScalar(.5); TV.divideScalar(L); mesh.quaternion.setFromUnitVectors(UPV, TV); mesh.scale.set(r, L, r); }

// ---- tyre geometry (axis z) ----
const WG = {};
function wheelGeo(r, w, rim) {
  const k = r + "_" + w + "_" + rim; if (WG[k]) return WG[k]; const s = SP();
  s.cyl(r * .95, r * .95, w * .92, 0, 0, 0, TI, 'z', 28); s.cyl(r * .9, r * .9, w, 0, 0, 0, TI, 'z', 28);
  const n = Math.round(r * 30);
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; for (const sd of [-1, 1]) s.box(r * .1, r * .17, w * .44, Math.cos(a + sd * .07) * r * .965, Math.sin(a + sd * .07) * r * .965, sd * w * .24, 0x24221f, 0, 0, a + sd * .4); }
  s.cyl(r * .6, r * .6, w * 1.01, 0, 0, 0, rim, 'z', 22); s.cyl(r * .5, r * .5, w * 1.04, 0, 0, 0, rim === Y ? YD : 0x8c8c86, 'z', 22);
  s.cyl(r * .2, r * .2, w * 1.1, 0, 0, 0, ST, 'z', 12);
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; for (const sd of [-1, 1]) s.cyl(.025, .025, .05, Math.cos(a) * r * .33, Math.sin(a) * r * .33, sd * w * .54, CHROME, 'z', 6); }
  return WG[k] = s.mesh(null, false);
}
const TYREM = new THREE.MeshStandardMaterial({vertexColors: true, roughness: .8, metalness: .05, envMap: ENV, envMapIntensity: .5});
function wheel(P, par, r, w, x, y, z, rim, steer) { const pv = grp(par, x, y, z); const m = new THREE.Mesh(wheelGeo(r, w, rim), TYREM); m.castShadow = true; pv.add(m); P.wheels.push({pv, m, r, steer: !!steer, z}); return pv; }

// ---- crawler track assembly (textured band + running gear) ----
function shoeTex() {
  return texCanvas(64, 64, (g) => { g.fillStyle = "#23211e"; g.fillRect(0, 0, 64, 64); g.fillStyle = "#4b4740"; g.fillRect(0, 0, 18, 64); g.fillStyle = "#6c665c"; g.fillRect(2, 0, 5, 64);
    g.fillStyle = "#151412"; g.fillRect(40, 0, 3, 64); g.fillStyle = "#3a3732"; for (const y of [10, 32, 54]) { g.beginPath(); g.arc(30, y, 3, 0, 7); g.fill(); } });
}
function bandGeo(circles, w, zc, shoe) {
  const pts = []; for (const [x, y, r] of circles) for (let i = 0; i < 22; i++) { const a = i / 22 * Math.PI * 2; pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); }
  const H = X.hull2(pts); let A = 0; for (let i = 0; i < H.length; i++) { const a = H[i], b = H[(i + 1) % H.length]; A += a[0] * b[1] - b[0] * a[1]; } if (A < 0) H.reverse();
  const pos = [], nor = [], uv = []; let acc = 0; const z0 = zc - w / 2, z1 = zc + w / 2;
  for (let i = 0; i < H.length; i++) { const a = H[i], b = H[(i + 1) % H.length], dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy); if (len < 1e-5) continue; const nx = dy / len, ny = -dx / len, u0 = acc / shoe, u1 = (acc + len) / shoe; acc += len;
    const V = [[a[0], a[1], z0, u0, 0], [b[0], b[1], z0, u1, 0], [b[0], b[1], z1, u1, 1], [a[0], a[1], z0, u0, 0], [b[0], b[1], z1, u1, 1], [a[0], a[1], z1, u0, 1]];
    for (const v of V) { pos.push(v[0], v[1], v[2]); nor.push(nx, ny, 0); uv.push(v[3], v[4]); } }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.computeBoundingSphere();
  return g;
}
function trackAsm(P, par, o) {
  const t = .08, xs = -o.L / 2, xi = o.L / 2, rs = o.rs, ri = o.ri, rr = o.rr || .19;
  for (const side of [-1, 1]) {
    const zc = side * o.z, circ = [[xs, rs + t + .02, rs + t], [xi, ri + t + .04, ri + t]];
    const nR = o.n || 6; for (let i = 0; i < nR; i++) { const x = xs + rs + (i + .5) * (o.L - rs - ri) / nR; circ.push([x, rr + t, rr + t]); }
    const tex = shoeTex(); tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    const band = new THREE.Mesh(bandGeo(circ, o.w, zc, .22), new THREE.MeshLambertMaterial({map: tex, side: THREE.DoubleSide})); band.castShadow = true; band.receiveShadow = true; par.add(band);
    const s = SP(), fc = o.frame || DG;
    s.box(o.L * .82, .34, o.w * .5, 0, Math.max(rs, ri) * .9 + .1, zc, fc);
    s.box(o.L * .7, .06, o.w * .9, 0, Math.max(rs, ri) * .9 + .3, zc, fc);
    s.cyl(rs, rs, o.w * .4, xs, rs + t + .02, zc, ST, 'z', 16); for (let i = 0; i < 11; i++) { const a = i / 11 * Math.PI * 2; s.box(.09, .1, o.w * .38, xs + Math.cos(a) * (rs + .03), rs + t + .02 + Math.sin(a) * (rs + .03), zc, BK, 0, 0, a); }
    s.cyl(rs * .4, rs * .4, o.w * .62, xs, rs + t + .02, zc, BK, 'z', 10);
    s.cyl(ri, ri, o.w * .42, xi, ri + t + .04, zc, ST, 'z', 16); s.cyl(ri * .35, ri * .35, o.w * .6, xi, ri + t + .04, zc, BK, 'z', 10);
    for (let i = 0; i < nR; i++) { const x = xs + rs + (i + .5) * (o.L - rs - ri) / nR; s.cyl(rr, rr, o.w * .45, x, rr + t, zc, ST, 'z', 12); }
    for (const x of [-o.L * .2, o.L * .2]) s.cyl(.11, .11, o.w * .35, x, Math.max(rs, ri) * 2 + t - .04, zc, ST, 'z', 10);
    put(par, s);
    P.tracks.push({tex, side});
  }
}
// ---- hydraulic cylinder between two anchors ----
function hydro(P, root, pa, a, pb, b, rb, col) {
  const A = anchor(pa, a[0], a[1], a[2]), B = anchor(pb, b[0], b[1], b[2]);
  const bar = new THREE.Mesh(UCYL, col && col !== BK ? new THREE.MeshStandardMaterial({color: col, roughness: .5, metalness: .2, envMap: ENV}) : HOSEM), rod = new THREE.Mesh(UCYL, STEELM); bar.castShadow = rod.castShadow = true; root.add(bar, rod);
  P.hyd.push({A, B, bar, rod, rb, root, d0: 0});
}
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _d = new THREE.Vector3(), _e = new THREE.Vector3();
function updHyd(P) {
  for (const h of P.hyd) {
    h.A.getWorldPosition(_a); h.B.getWorldPosition(_b); h.root.worldToLocal(_a); h.root.worldToLocal(_b);
    const d = _a.distanceTo(_b); if (!h.d0) h.d0 = d;
    _c.subVectors(_b, _a).normalize(); const Lb = h.d0 * .58, Lr = Math.max(.12, d - h.d0 * .5);
    _d.copy(_a).addScaledVector(_c, Lb); rodTo(h.bar, _a, _d, h.rb);
    _e.copy(_b).addScaledVector(_c, -Lr); rodTo(h.rod, _e, _b, h.rb * .55);
  }
}
// ---- shading: phong + slight per-face colour jitter so paint looks worn, not flat ----
const MVP = new THREE.MeshStandardMaterial({vertexColors: true, roughness: .58, metalness: .12, envMap: ENV, envMapIntensity: .9});
function putP(par, s, cast, jit) {
  if (!s.p.length) return null; const geo = s.mesh(null, false);
  if (jit !== 0) { const c = geo.attributes.color.array, j = jit || .05; for (let i = 0; i < c.length; i += 9) { const k = 1 + (Math.random() - .5) * j; for (let q = 0; q < 9; q++) c[i + q] = Math.min(1, c[i + q] * k); } }
  const me = new THREE.Mesh(geo, MVP); me.castShadow = cast !== false; me.receiveShadow = true; par.add(me); return me;
}
// ---- shape helpers ----
function tri3(s, a, b, c, col, n) { const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2]; const cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx; if (cx * n[0] + cy * n[1] + cz * n[2] < 0) s.tri(a, c, b, col, n, n, n); else s.tri(a, b, c, col, n, n, n); }
// side profile in XY, extruded along Z
function prof(s, pts, z0, z1, col) {
  const n = pts.length; let A = 0; for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n]; A += a[0] * b[1] - b[0] * a[1]; }
  const P = A < 0 ? pts.slice().reverse() : pts;
  for (let i = 0; i < n; i++) { const a = P[i], b = P[(i + 1) % n], dx = b[0] - a[0], dy = b[1] - a[1]; if (Math.hypot(dx, dy) < 1e-6) continue; s.quad([a[0], a[1], z0], [b[0], b[1], z0], [b[0], b[1], z1], [a[0], a[1], z1], col, [dy, -dx, 0]); }
  const T = THREE.ShapeUtils.triangulateShape(P.map(p => new THREE.Vector2(p[0], p[1])), []);
  for (const [i, j, k] of T) { const a = P[i], b = P[j], c = P[k]; tri3(s, [a[0], a[1], z1], [b[0], b[1], z1], [c[0], c[1], z1], col, [0, 0, 1]); tri3(s, [a[0], a[1], z0], [b[0], b[1], z0], [c[0], c[1], z0], col, [0, 0, -1]); }
  return s;
}
// plan outline in XZ, extruded along Y
function plan(s, pts, y0, y1, col) {
  const n = pts.length; let A = 0; for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n]; A += a[0] * b[1] - b[0] * a[1]; }
  const P = A < 0 ? pts.slice().reverse() : pts;
  for (let i = 0; i < n; i++) { const a = P[i], b = P[(i + 1) % n], dx = b[0] - a[0], dz = b[1] - a[1]; s.quad([a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]], col, [dz, 0, -dx]); }
  const T = THREE.ShapeUtils.triangulateShape(P.map(p => new THREE.Vector2(p[0], p[1])), []);
  for (const [i, j, k] of T) { const a = P[i], b = P[j], c = P[k]; tri3(s, [a[0], y1, a[1]], [b[0], y1, b[1]], [c[0], y1, c[1]], col, [0, 1, 0]); tri3(s, [a[0], y0, a[1]], [b[0], y0, b[1]], [c[0], y0, c[1]], col, [0, -1, 0]); }
  return s;
}
// curved plate (arc in XY) extruded along Z
function arcPlate(s, cx, cy, r, t, a0, a1, z0, z1, col, n) {
  n = n || 12; const o = [], i2 = [];
  for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + Math.cos(a) * (r + t), cy + Math.sin(a) * (r + t)]); i2.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
  return prof(s, o.concat(i2.reverse()), z0, z1, col);
}
// rounded rectangle side profile
function rrect(x0, y0, x1, y1, r, n) { n = n || 4; const p = []; const c = [[x1 - r, y1 - r, 0], [x0 + r, y1 - r, Math.PI / 2], [x0 + r, y0 + r, Math.PI], [x1 - r, y0 + r, Math.PI * 1.5]]; for (const [cx, cy, a0] of c) for (let i = 0; i <= n; i++) { const a = a0 + i / n * Math.PI / 2; p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } return p; }
function grille(s, x, y, z, w, h, col, bars, ax) { // ax 'x': on a face normal x (spans z); 'z': on face normal z (spans x)
  if (ax === 'z') { s.box(w, h, .04, x, y, z, 0x1c1b19); for (let i = 0; i < bars; i++) s.box(.03, h * .92, .06, x - w / 2 + (i + .5) * w / bars, y, z, col); }
  else { s.box(.04, h, w, x, y, z, 0x1c1b19); for (let i = 0; i < bars; i++) s.box(.06, .03, w * .92, x, y - h / 2 + (i + .5) * h / bars, z, col); }
}
function decal(par, text, w, h, x, y, z, ry, bg, fg, both) {
  const t = texCanvas(512, Math.round(512 * h / w), (c, W, H) => { if (bg) { c.fillStyle = bg; c.fillRect(0, 0, W, H); } else c.clearRect(0, 0, W, H); c.font = `700 ${Math.round(H * .86)}px Teko, Impact, sans-serif`; c.fillStyle = fg; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(text, W / 2, H * .55); });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshLambertMaterial({map: t, transparent: !bg, polygonOffset: true, polygonOffsetFactor: -2}));
  m.position.set(x, y, z); m.rotation.y = ry || 0; par.add(m);
  if (both) { const m2 = m.clone(); m2.position.z = -z; m2.rotation.y = (ry || 0) + Math.PI; par.add(m2); }
  return m;
}
function hazard(par, w, h, x, y, z, ry) { // yellow/black chevron plate
  const t = texCanvas(128, 64, (c) => { c.fillStyle = "#f2b705"; c.fillRect(0, 0, 128, 64); c.fillStyle = "#151515"; for (let i = -64; i < 160; i += 32) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i + 16, 0); c.lineTo(i - 16, 64); c.lineTo(i - 32, 64); c.fill(); } });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshLambertMaterial({map: t, polygonOffset: true, polygonOffsetFactor: -2})); m.position.set(x, y, z); m.rotation.y = ry || 0; par.add(m); return m;
}
// ---- instrument textures ----
function gaugeTex(kind) {
  return texCanvas(512, 256, (c, W, H) => {
    c.fillStyle = "#0e0f10"; c.fillRect(0, 0, W, H); c.strokeStyle = "#2b2d30"; c.lineWidth = 6; c.strokeRect(3, 3, W - 6, H - 6);
    const dial = (x, y, r, label, val) => { c.fillStyle = "#16181a"; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.strokeStyle = "#7c8187"; c.lineWidth = 3; c.stroke();
      for (let i = 0; i <= 10; i++) { const a = Math.PI * .75 + i / 10 * Math.PI * 1.5; c.strokeStyle = i > 7 ? "#e0472a" : "#e8e8e8"; c.lineWidth = i % 5 ? 2 : 4; c.beginPath(); c.moveTo(x + Math.cos(a) * r * .78, y + Math.sin(a) * r * .78); c.lineTo(x + Math.cos(a) * r * .92, y + Math.sin(a) * r * .92); c.stroke(); }
      const a = Math.PI * .75 + val * Math.PI * 1.5; c.strokeStyle = "#ff6a1a"; c.lineWidth = 5; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * r * .8, y + Math.sin(a) * r * .8); c.stroke();
      c.fillStyle = "#cfd2d6"; c.font = `600 ${r * .26}px Barlow, sans-serif`; c.textAlign = "center"; c.fillText(label, x, y + r * .55); };
    if (kind === "monitor") {
      c.fillStyle = "#0b2a3a"; c.fillRect(14, 14, W - 28, H - 28); c.fillStyle = "#38c6f4"; c.font = "600 30px Barlow, sans-serif"; c.textAlign = "left"; c.fillText("HİSAR · P-MOD", 30, 52);
      const bars = [["YAKIT", .72, "#f2b705"], ["SICAKLIK", .48, "#6cc24a"], ["HİDROLİK", .55, "#38c6f4"]];
      bars.forEach(([n, v, col], i) => { const y = 84 + i * 50; c.fillStyle = "#cfe9f5"; c.font = "500 22px Barlow, sans-serif"; c.fillText(n, 30, y + 18); c.fillStyle = "#123b4f"; c.fillRect(170, y, 300, 22); c.fillStyle = col; c.fillRect(170, y, 300 * v, 22); });
      c.fillStyle = "#cfe9f5"; c.font = "500 22px Barlow, sans-serif"; c.fillText("1842,6 s", 380, 52);
    } else {
      dial(110, 128, 92, "x100 dev/dk", .35); dial(402, 128, 92, "km/s", .1);
      c.fillStyle = "#1b2a1b"; c.fillRect(208, 70, 96, 50); c.fillStyle = "#9dff8a"; c.font = "600 30px Barlow, sans-serif"; c.textAlign = "center"; c.fillText("N", 256, 106);
      [["#6cc24a", 220], ["#f2b705", 256], ["#38c6f4", 292]].forEach(([col, x]) => { c.fillStyle = col; c.beginPath(); c.arc(x, 160, 9, 0, 7); c.fill(); });
      c.fillStyle = "#cfd2d6"; c.font = "500 18px Barlow, sans-serif"; c.fillText("YAKIT ▮▮▮▮▮▯", 256, 206);
    }
  });
}
const SCRM = {};
function screen(par, kind, w, h, x, y, z, ry, rx) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), SCRM[kind] || (SCRM[kind] = new THREE.MeshBasicMaterial({map: gaugeTex(kind)})));
  m.position.set(x, y, z); m.rotation.order = "YXZ"; m.rotation.y = ry; m.rotation.x = rx || 0; par.add(m); return m;
}

// ---- cab shell: lower tub, slanted front glass, pillars, roof, glass panes ----
function cab(Sb, Sg, Sl, o) {
  const {x, y, z, L, W, H} = o, col = o.col, fr = o.frame || BK, roof = o.roof || col;
  const sl = o.slant == null ? .14 : o.slant, low = o.low == null ? .42 : o.low, lowF = o.lowF == null ? low : o.lowF;
  const xf = x + L / 2, xb = x - L / 2, zl = z - W / 2, zr = z + W / 2, yt = y + H, ys = y + H * low, yf = y + H * lowF;
  prof(Sb, lowF < low - .01 ? [[xb, y], [xf, y], [xf, yf], [xf - .3, ys], [xb, ys]] : [[xb, y], [xf, y], [xf, ys], [xb, ys]], zl, zr, col);
  Sb.box(.04, ys - y - .1, .03, x - L * .08, (y + ys) / 2, zl - .005, fr); // door gap
  // the door (left side) opens: its window, panel and handle hang on a hinge at the front pillar
  const gx = x - L * .08, hx = xf - .07 - sl * .5, D = SP(), DG = SP();
  D.box(xf - .05 - gx, ys - y - .1, .024, (gx + xf - .05) / 2 - hx, (y + ys) / 2 + .03, -.016, col);
  D.box(.12, .04, .03, x + L * .1 - hx, ys - .2, -.04, CHROME);
  D.box(.035, yt - ys - .07, .03, gx + .025 - hx, (ys + yt) / 2 - .01, .012, fr);
  // pillars
  for (const zz of [zl + .035, zr - .035]) { Sb.rod([xf - .02, yf, zz], [xf - sl - .02, yt, zz], .04, fr, 8); Sb.box(.07, yt - ys, .07, xb + .035, (ys + yt) / 2, zz, fr); Sb.box(.05, yt - ys, .05, x - L * .08, (ys + yt) / 2, zz, fr); }
  Sb.box(L, .05, .05, x, ys + .025, zl + .03, fr); Sb.box(L, .05, .05, x, ys + .025, zr - .03, fr);
  Sb.box(.06, .05, W - .1, xf - .02, yf + .02, z, fr);
  // roof: rounded front edge + overhang
  prof(Sb, [[xb - .06, yt - .02], [xf - sl + .06, yt - .02], [xf - sl + .14, yt + .03], [xf - sl + .12, yt + .1], [xb - .02, yt + .13], [xb - .08, yt + .06]], zl - .05, zr + .05, roof);
  Sb.box(L - .1, .02, W - .1, x, yt - .035, z, 0xbdbab2);
  // glass
  const gz = .012;
  Sg.quad([xf - .01, yf + .03, zl + .06], [xf - .01, yf + .03, zr - .06], [xf - sl - .01, yt - .02, zr - .06], [xf - sl - .01, yt - .02, zl + .06], 0xffffff, [1, .2, 0]);
  const yBF = Math.max(yf, ys - .2) + .05, yb = px => ys + .05 + (yBF - ys - .05) * (px - xb - .06) / (xf - .05 - xb - .06);
  prof(Sg, [[xb + .06, ys + .05], [xf - .05, yBF], [xf - sl - .05, yt - .03], [xb + .06, yt - .03]], zr - .02 - gz, zr - .02 + gz, 0xffffff);
  prof(Sg, [[xb + .06, ys + .05], [gx - .02, yb(gx - .02)], [gx - .02, yt - .03], [xb + .06, yt - .03]], zl + .02 - gz, zl + .02 + gz, 0xffffff);
  prof(DG, [[gx + .03 - hx, yb(gx + .03)], [xf - .05 - hx, yBF], [xf - sl - .05 - hx, yt - .03], [gx + .03 - hx, yt - .03]], .02 - gz, .02 + gz, 0xffffff);
  Sg.box(.02, yt - ys - .1, W - .14, xb + .03, (ys + yt) / 2, z, 0xffffff);
  // wiper parked at the bottom of the screen
  Sb.rod([xf + .01, yf + .07, z + .05], [xf - sl * .45 + .01, yf + .55, z - .2], .012, BK, 5);
  // lights, beacon, mirrors
  Sl.box(.14, .1, .14, xb + .25, yt + .2, zr - .25, AMB); Sb.cyl(.07, .08, .06, xb + .25, yt + .14, zr - .25, BK, null, 10);
  for (const zz of [zl + .25, zr - .25]) { Sb.box(.1, .14, .24, xf - sl + .1, yt + .2, zz, BK); Sl.box(.02, .1, .2, xf - sl + .16, yt + .2, zz, LIT); }
  for (const sd of [-1, 1]) { const zz = sd < 0 ? zl : zr; Sb.rod([xf - .06, ys + .4, zz], [xf + .18, ys + .55, zz + sd * .3], .013, BK, 5); Sb.box(.04, .3, .19, xf + .2, ys + .55, zz + sd * .38, BK); Sl.box(.01, .26, .15, xf + .22, ys + .55, zz + sd * .38, 0x9fb7c4); }
  const sx = x - L * .12;
  return {seat: [sx, y + .56, z], eye: [sx + .08, y + 1.37, z], x, y, z, L, W, H, xf, xb, yf, ys, yt, zl, zr, door: {D, DG, hx, hz: zl}, gx};
}
// ---- interior: seat, consoles, dash, pedals, roof liner, screens ----
function interior(P, par, ci, kind) {
  const s = SP(), [sx, sy, sz] = ci.seat, [ex, ey] = ci.eye, D = 0x2a2c2e, F = 0x3b4148, xf = ci.xf;
  s.box(ci.L - .12, .03, ci.W - .12, ci.x, ci.y + .015, ci.z, 0x26282a);
  for (let i = 0; i < 6; i++) s.box(.02, .015, ci.W - .3, xf - .35 - i * .12, ci.y + .035, ci.z, 0x1b1c1d);
  // suspension seat
  s.box(.36, .26, .36, sx, sy - .25, sz, 0x1d1e1f); s.box(.52, .13, .52, sx + .02, sy - .06, sz, F); s.box(.44, .03, .44, sx + .03, sy + .01, sz, 0x4a515a);
  s.box(.13, .74, .5, sx - .28, sy + .32, sz, F, 0, 0, .13); s.box(.11, .22, .34, sx - .34, sy + .78, sz, F, 0, 0, .13);
  for (const sd of [-1, 1]) s.box(.18, .5, .07, sx - .26, sy + .26, sz + sd * .24, 0x30353b, 0, 0, .13);
  // pedals
  for (const k of [-.13, .13]) { s.box(.04, .2, .1, xf - .32, ci.y + .18, sz + k, 0x111, 0, 0, -.5); s.box(.06, .02, .12, xf - .26, ci.y + .27, sz + k, 0x555); }
  // roof liner + lamp + visor
  s.box(.28, .03, .14, ci.x + .1, ci.yt - .06, ci.z, 0xdedcd4); s.box(.02, .07, ci.W * .34, xf - ci.L * .07, ci.yt - .08, sz, 0x2e2e2e, 0, 0, .3);
  const cons = (sd, len) => { s.box(len, .12, .17, sx + .06, sy + .16, sz + sd * .34, D); s.box(len - .05, .05, .15, sx + .06, sy + .25, sz + sd * .34, 0x3a3d40); s.box(.25, .3, .16, sx - .02, sy - .02, sz + sd * .34, D); };
  if (kind === "ex" || kind === "dz" || kind === "gt") { cons(-1, .55); cons(1, .55); }
  else if (kind === "wheel") cons(1, .45);
  if (kind === "wheel" || kind === "truck") {
    const wx = ex + .47, wy = ey - .52;
    // pedestal / dash with instrument cluster facing the driver
    const dW = kind === "truck" ? ci.W - .14 : .62, dz = kind === "truck" ? ci.z : sz;
    s.box(.32, wy - ci.y - .05, dW, xf - .2, (ci.y + wy - .05) / 2, dz, D);
    s.box(.4, .08, dW, xf - .26, wy - .02, dz, 0x232527, 0, 0, -.35);
    if (kind === "truck") { s.box(.5, .1, ci.W - .14, xf - .22, wy + .06, ci.z, 0x3a2c2a, 0, 0, -.25); screen(par, "monitor", .26, .17, xf - .35, wy + .08, ci.z + .25, -Math.PI / 2, -.55); }
    screen(par, "gauge", .3, .15, xf - .42, wy + .02, sz, -Math.PI / 2, -.75);
    steeringWheel(P, par, [wx, wy, sz], kind === "truck" ? .23 : .2);
    s.rod([wx + .06, wy - .05, sz], [xf - .25, wy - .4, sz], .03, 0x1d1d1d, 8);
  }
  if (kind === "ex" || kind === "dz") { const zz = ci.zr - .16; s.box(.06, .2, .26, xf - .2, ey - .2, zz, 0x111); screen(par, "monitor", .24, .16, xf - .235, ey - .2, zz, -Math.PI / 2 + .35, 0); s.rod([xf - .16, ey - .3, zz], [xf - .05, ey - .55, zz + .05], .015, 0x222, 6);
    s.box(.24, .3, .46, xf - .13, ci.y + .15, sz, D); }
  if (kind === "gt") { s.box(.3, .45, .7, xf - .2, ci.y + .48, sz, D); screen(par, "gauge", .26, .13, xf - .36, ci.y + .72, sz, -Math.PI / 2, -.6); }
  putP(par, s, false, .02);
}
// ---- driver controls ----
function steeringWheel(P, par, pos, r) {
  const col = grp(par, pos[0], pos[1], pos[2]); col.rotation.z = -.62;
  const wy = grp(col); wy.rotation.y = -Math.PI / 2;
  const sp = grp(wy); const s = SP(); s.geo(new THREE.TorusGeometry(r, .024, 8, 30), 0, 0, 0, 0x1c1c1c); s.box(r * 2, .035, .03, 0, 0, 0, 0x2a2a2a); s.box(.035, r, .03, 0, -r / 2, 0, 0x2a2a2a); s.cyl(.065, .065, .05, 0, 0, 0, 0x333, 'z', 12);
  s.sph(.035, .035, .035, r * .7, r * .7, .02, 0xb22, 6); put(sp, s, MV, false);
  P.sw = sp; P.hand.wL = anchor(sp, -r, 0, 0); P.hand.wR = anchor(sp, r, 0, 0);
}
function joystick(P, par, pos, key) {
  const b = grp(par, pos[0], pos[1], pos[2]); const s = SP(); s.box(.16, .06, .14, 0, 0, 0, 0x2a2a2a); s.cyl(.05, .07, .05, 0, .04, 0, 0x111, null, 10); put(b, s, MV, false);
  const st = grp(b, 0, .05, 0); const k = SP(); k.cyl(.012, .012, .16, 0, .08, 0, 0x777, null, 6); k.cyl(.032, .026, .11, 0, .2, 0, 0x151515, null, 10); k.box(.02, .015, .02, .025, .25, 0, 0xc0392b); k.box(.02, .015, .02, .025, .22, .02, 0xf2b705); put(st, k, MV, false);
  P.ctl[key] = st; P.hand[key] = anchor(st, 0, .2, 0);
}
function lever(P, par, pos, key, len, col) {
  const b = grp(par, pos[0], pos[1], pos[2]); const s = SP(); s.box(.06, .05, .06, 0, 0, 0, 0x2a2a2a); put(b, s, MV, false);
  const st = grp(b); const k = SP(); k.cyl(.012, .012, len, 0, len / 2, 0, 0x888, null, 6); k.sph(.03, .04, .03, 0, len, 0, col || 0x151515, 8); put(st, k, MV, false);
  P.ctl[key] = st; P.hand[key] = anchor(st, 0, len, 0);
}
// ---- the operator ----
function operator(P, par, ci, kind) { // the seat: a soldier sits here when somebody drives (see soldier.js)
  P.opPar = par; P.arms = null; P.head = null; P.kind = kind;
}
const _t = new THREE.Vector3(), _p = new THREE.Vector3(), _q = new THREE.Vector3();
function updArms(P, tL, tR) { if (P.seated) seatedArms(P, tL, tR); }
// ======================= machines =======================
const TYPES = {
  gt: {name: "KEMPAR", L: 11, Wd: 3.3, tracked: true, r: 2.2, front: 3.4, back: -3.2, maxV: 3.2, maxR: 2, acc: 1.4, brk: 3, turn: .55, engSnd: "diesel", sp: .85},
  ex: {name: "EKSKAVATÖR", L: 6.5, Wd: 3.2, tracked: true, r: 2.4, maxV: 6, maxR: 5, acc: 2.4, brk: 5, turn: .85, engSnd: "diesel", sp: 1},
  dz: {name: "DOZER", L: 5.6, Wd: 3.6, tracked: true, r: 2.4, maxV: 7, maxR: 6, acc: 2.6, brk: 5, turn: .9, engSnd: "dozer", sp: 1},
  bh: {name: "BEKOLODER", L: 6.8, Wd: 2.4, tracked: false, r: 2.2, maxV: 14, maxR: 7, acc: 3.6, brk: 7, WB: 2.25, maxSt: .62, engSnd: "tractor", sp: 1.15},
  ld: {name: "KEPÇE", L: 7.6, Wd: 3, tracked: false, r: 2.5, maxV: 12, maxR: 7, acc: 3.2, brk: 7, WB: 3.0, maxSt: .7, engSnd: "tractor", sp: .9},
  tr: {name: "KAMYON", L: 9, Wd: 2.6, tracked: false, r: 2.5, maxV: 22, maxR: 6, acc: 3.4, brk: 8, WB: 5.0, maxSt: .55, engSnd: "tractor", sp: .8},
  gr: {name: "GREYDER", L: 10, Wd: 2.6, tracked: false, r: 2.4, maxV: 14, maxR: 7, acc: 3, brk: 7, WB: 7.4, maxSt: .6, engSnd: "tractor", sp: 1},
  tk: {name: "M60A3 TANK", L: 7, Wd: 3.8, tracked: true, r: 2.3, maxV: 15, maxR: 6, acc: 4, brk: 7, turn: 1.0, engSnd: "diesel", sp: .62}
};
function dirtBlob(par, sx, sy, sz, x, y, z) { const m = new THREE.Mesh(new THREE.SphereGeometry(.5, 12, 7), pileMat); m.scale.set(sx, sy, sz); m.position.set(x, y, z); m.visible = false; m.castShadow = true; par.add(m); return m; }
function fender(s, cx, cy, r, z0, z1, col, a0, a1) { arcPlate(s, cx, cy, r, .045, a0 == null ? .15 : a0, a1 == null ? Math.PI - .15 : a1, z0, z1, col, 14); }
function stepsLadder(s, x, y0, y1, z, col) { s.box(.04, y1 - y0, .04, x - .18, (y0 + y1) / 2, z, col); s.box(.04, y1 - y0, .04, x + .18, (y0 + y1) / 2, z, col); for (let yy = y0 + .15; yy < y1; yy += .3) s.box(.4, .03, .12, x, yy, z, 0x555); }
function rail(s, pts, col) { for (let i = 0; i < pts.length - 1; i++) s.rod(pts[i], pts[i + 1], .022, col, 6); for (const p of pts) s.rod(p, [p[0], p[1] - .32, p[2]], .018, col, 6); }

function buildModel(type) {
  const g = new THREE.Group(), P = {wheels: [], tracks: [], hyd: [], ctl: {}, hand: {}, root: g};
  const s = SP(), G = SP(), L = SP();
  switch (type) {
    case "ex": { // 22 t crawler excavator (white house, black boom)
      trackAsm(P, g, {L: 3.9, z: 1.28, w: .6, rs: .4, ri: .36, rr: .18, n: 7});
      plan(s, [[-1.2, -.95], [1.2, -.95], [1.45, -.4], [1.45, .4], [1.2, .95], [-1.2, .95], [-1.45, .4], [-1.45, -.4]], .7, 1.15, DG);
      for (const sd of [-1, 1]) s.box(3.5, .08, .7, 0, .96, sd * 1.28, 0x2c2a27);
      s.cyl(1.0, 1.0, .22, 0, 1.25, 0, BK, null, 28);
      putP(g, s);
      const up = P.up = grp(g, 0, 1.36, 0); const U = SP(), UG = SP(), UL = SP();
      plan(U, [[1.75, -1.42], [1.75, 1.42], [-1.6, 1.45], [-2.4, 1.45], [-2.95, 1.15], [-3.15, .6], [-3.2, 0], [-3.15, -.6], [-2.95, -1.15], [-2.4, -1.45], [-1.6, -1.45]], 0, .2, DG);
      // engine hood + counterweight (rounded rear)
      plan(U, [[-.6, -1.42], [-.6, 1.42], [-2.3, 1.42], [-2.85, 1.12], [-3.08, .58], [-3.12, 0], [-3.08, -.58], [-2.85, -1.12], [-2.3, -1.42]], .2, 1.12, WH);
      plan(U, [[-.65, -1.36], [-.65, 1.36], [-2.25, 1.36], [-2.75, 1.06], [-2.98, .55], [-3.02, 0], [-2.98, -.55], [-2.75, -1.06], [-2.25, -1.36]], 1.12, 1.25, 0xdcdad3);
      plan(U, [[-2.1, -1.47], [-2.1, 1.47], [-2.45, 1.47], [-2.98, 1.17], [-3.2, .6], [-3.25, 0], [-3.2, -.6], [-2.98, -1.17], [-2.45, -1.47]], .2, .62, 0x2f3236);
      U.box(.02, .05, 2.6, -3.255, .66, 0, 0xc8102e);
      for (const sz of [-1, 1]) UL.box(.04, .12, .2, -3.22, .45, sz * 1.0, RLT);
      grille(U, -1.6, .72, 1.43, 1.2, .5, 0x555, 14, 'z'); grille(U, -1.6, .72, -1.43, 1.2, .5, 0x555, 14, 'z');
      // right side toolbox / tank housing with rounded top
      prof(U, [[-.55, .2], [1.75, .2], [1.75, .95], [1.55, 1.12], [-.55, 1.12]], .3, 1.42, WH);
      U.cyl(.07, .07, .75, -1.55, 1.55, .78, BK, null, 10); U.cyl(.1, .08, .1, -1.55, 1.95, .78, 0x444, null, 10);
      U.box(.3, .2, .3, -1.9, 1.32, -.6, 0x333); // air filter
      rail(U, [[-2.4, 1.6, 1.36], [-1.0, 1.6, 1.36], [.6, 1.42, 1.36]], Y);
      U.box(1.2, .04, .3, .9, 1.13, 1.2, 0x444); for (let i = 0; i < 5; i++) U.box(.04, .02, .28, .4 + i * .24, 1.155, 1.2, 0x666);
      // boom foot bracket
      prof(U, [[.65, .2], [1.75, .2], [1.75, .55], [1.35, 1.05], [.8, 1.05], [.65, .7]], -.04 + .15 - .36, .15 + .36, 0x2c2c2c);
      const ci = P.ci = cab(U, UG, UL, {x: .9, y: .2, z: -.8, L: 1.75, W: 1.02, H: 1.82, col: WH, frame: BK, roof: 0x1c1c1c, slant: .14, low: .25, lowF: .12});
      putP(up, U); put(up, UG, GLASSM, false); put(up, UL, ME, false);
      decal(up, "HİSAR 220", 1.3, .28, -1.5, .82, 1.43, 0, "#2f3236", "#eceae4");
      decal(up, "HİSAR", 1.1, .26, -3.27, .4, 0, -Math.PI / 2, "#2f3236", "#eceae4");
      interior(P, up, ci, "ex"); operator(P, up, ci, type);
      const [sx, sy, sz] = ci.seat;
      joystick(P, up, [sx + .26, sy + .26, sz - .34], "jL"); joystick(P, up, [sx + .26, sy + .26, sz + .34], "jR");
      lever(P, up, [ci.xf - .45, ci.y + .3, sz - .1], "tL", .42); lever(P, up, [ci.xf - .45, ci.y + .3, sz + .1], "tR", .42);
      // boom: banana profile
      const bm = P.boom = grp(up, 1.25, .78, .15); const B = SP();
      prof(B, [[-.35, -.32], [-.35, .32], [.8, .78], [2.25, 1.18], [2.8, 1.18], [4.7, .34], [4.86, 0], [4.65, -.3], [2.65, .52], [2.2, .58], [.9, .16]], -.27, .27, BLKB);
      prof(B, [[-.2, .3], [.8, .74], [2.25, 1.12], [2.75, 1.12], [2.75, 1.2], [2.2, 1.21], [.8, .82], [-.2, .38]], -.2, .2, 0x3c3c3c);
      B.cyl(.2, .2, .62, 0, 0, 0, 0x555, 'z', 14); B.cyl(.17, .17, .6, 4.6, 0, 0, 0x555, 'z', 14);
      B.rod([.3, .5, .2], [2.4, 1.24, .2], .025, BK, 6); B.rod([2.6, 1.24, .2], [4.4, .45, .2], .025, BK, 6); B.rod([.3, .5, -.2], [2.4, 1.24, -.2], .025, BK, 6); B.rod([2.6, 1.24, -.2], [4.4, .45, -.2], .025, BK, 6);
      putP(bm, B); const BL = SP(); BL.box(.12, .16, .2, 2.1, 1.3, .3, LIT); put(bm, BL, ME, false);
      decal(bm, "HİSAR", 1.1, .26, 2.0, .86, .275, -.36 + Math.PI * 0, null, "#eceae4", true).rotation.z = .27;
      const sk = P.stick = grp(bm, 4.6, 0, 0); const K = SP();
      prof(K, [[-.82, .42], [-.25, .48], [2.95, .22], [3.08, 0], [2.95, -.22], [.25, -.28], [-.78, -.05]], -.22, .22, BLKB);
      K.cyl(.13, .13, .5, 2.95, 0, 0, 0x555, 'z', 12); K.rod([-.3, .5, .15], [2.6, .28, .15], .02, BK, 6);
      putP(sk, K);
      const bk = P.bucket = grp(sk, 2.95, 0, 0); const Q = SP();
      for (const zz of [-.56, .52]) prof(Q, [[-.12, .18], [.22, .28], [.62, .1], [.96, -.55], [.92, -.82], [.6, -.92], [.15, -.82], [-.1, -.45]], zz, zz + .04, BLKB);
      arcPlate(Q, .42, -.36, .52, .04, Math.PI * .5, Math.PI * 1.78, -.53, .53, BLKB, 16);
      Q.box(.3, .3, .5, 0, .06, 0, DG); Q.box(.35, .06, 1.12, .06, .26, 0, BLKB);
      Q.box(.5, .06, 1.12, .78, -.78, 0, 0x2f2f2f, 0, 0, .65);
      for (let i = 0; i < 5; i++) { Q.box(.26, .07, .09, .99, -.95, -.44 + i * .22, 0x8a8a84, 0, 0, .65); Q.geo(CONE, 1.1, -1.03, -.44 + i * .22, 0x9a9a92, 0, 0, -2.2, .045, .16, .045); }
      putP(bk, Q); P.tip = anchor(bk, .98, -.92, 0);
      P.dirt = dirtBlob(bk, 1.6, .9, 2.0, .42, -.4, 0);
      for (const z of [-.36, .36]) hydro(P, up, up, [1.45, .25, .15 + z], bm, [1.9, .5, z], .11, BK);
      hydro(P, up, bm, [1.7, 1.15, 0], sk, [-.6, .4, 0], .1, BK);
      hydro(P, up, sk, [.3, .38, 0], bk, [-.05, .22, 0], .085, BK);
      P.seatPar = up;
      break;
    }
    case "dz": { // D6-class dozer
      trackAsm(P, g, {L: 3.2, z: 1.35, w: .56, rs: .45, ri: .42, rr: .2, n: 5});
      s.box(3.6, .5, 1.5, -.1, 1.15, 0, DG);
      for (const sd of [-1, 1]) { prof(s, [[-1.85, 1.3], [1.6, 1.3], [1.75, 1.45], [-1.85, 1.45]], sd * .8, sd * 1.66, Y); }
      prof(s, [[-.5, 1.3], [1.95, 1.3], [1.95, 1.95], [1.75, 2.3], [-.5, 2.35]], -.68, .68, Y);
      prof(s, [[-.45, 2.3], [1.7, 2.26], [1.7, 2.32], [-.45, 2.38]], -.6, .6, YD);
      grille(s, 1.96, 1.68, 0, 1.2, .6, 0x555, 9, 'x'); s.box(.08, .1, 1.3, 2.0, 2.02, 0, Y);
      for (const sd of [-1, 1]) for (let i = 0; i < 4; i++) s.box(.4, .02, .02, 1.0, 1.55 + i * .16, sd * .69, 0x333);
      s.cyl(.09, .09, .9, 1.1, 2.75, .35, BK, null, 10); s.cyl(.12, .09, .1, 1.1, 3.22, .35, 0x444, null, 10); s.cyl(.17, .17, .32, 1.1, 2.45, -.3, 0x333, null, 12);
      prof(s, [[-2.3, 1.2], [-1.0, 1.2], [-1.0, 2.25], [-2.1, 2.25], [-2.3, 2.0]], -.85, .85, Y); // fuel tank / rear
      s.box(.5, .5, 1.6, -2.15, .9, 0, YD);
      const ci = P.ci = cab(s, G, L, {x: -1.0, y: 1.45, z: 0, L: 1.55, W: 1.55, H: 1.82, col: Y, frame: BK, roof: Y, low: .3, lowF: .2, slant: .1});
      // ROPS posts
      for (const sd of [-1, 1]) for (const xx of [-1.74, -.26]) s.box(.12, 1.95, .12, xx, 2.35, sd * .86, Y);
      s.box(1.62, .1, 1.84, -1.0, 3.36, 0, Y);
      // ripper
      prof(s, [[-2.3, .9], [-2.6, 1.1], [-2.75, .35], [-2.6, -.05], [-2.45, .3], [-2.45, .9]], -.1, .1, YD);
      s.box(.25, .25, 1.6, -2.55, 1.05, 0, YD); for (const sd of [-1, 1]) s.box(.6, .12, .12, -2.35, .9, sd * .7, YD, 0, 0, .4);
      stepsLadder(s, -.3, .5, 1.3, 1.75, BK);
      putP(g, s); put(g, G, GLASSM, false); put(g, L, ME, false);
      decal(g, "HİSAR D6", 1.0, .26, .6, 1.9, .685, 0, null, "#1b1712", true);
      interior(P, g, ci, "dz"); operator(P, g, ci, type);
      const [sx, sy, sz] = ci.seat;
      joystick(P, g, [sx + .26, sy + .26, sz - .34], "jL"); joystick(P, g, [sx + .26, sy + .26, sz + .34], "jR");
      // blade group: curved moldboard, push arms, end bits
      const bl = P.blade = grp(g, -.1, .72, 0); const D = SP();
      for (const sd of [-1, 1]) prof(D, [[.2, .12], [2.55, .32], [2.6, -.2], [.3, -.18]], sd * 1.3, sd * 1.48, Y);
      arcPlate(D, 3.55, .25, .95, .09, Math.PI * .78, Math.PI * 1.22, -1.85, 1.85, Y, 14);
      D.box(.12, .35, 3.7, 2.6, 1.0, 0, Y, 0, 0, -.2);
      D.box(.14, .1, 3.7, 2.72, -.62, 0, 0x8c8c86);
      for (const sd of [-1, 1]) { prof(D, [[2.55, -.66], [2.8, -.6], [2.75, .9], [2.55, 1.05]], sd * 1.82, sd * 1.9, YD); }
      for (let i = 0; i < 5; i++) D.box(.32, 1.25, .06, 2.42, .2, -1.4 + i * .7, YD);
      D.box(.3, .2, 3.4, 2.35, .85, 0, YD);
      putP(bl, D); P.tip = anchor(bl, 2.75, -.62, 0);
      for (const z of [-.62, .62]) hydro(P, g, g, [1.65, 2.05, z], bl, [2.3, .55, z * 1.3], .09, BK);
      hydro(P, g, g, [.8, 1.0, 1.2], bl, [2.3, .95, 1.55], .07, BK);
      P.seatPar = g;
      break;
    }
    case "bh": { // backhoe loader (Mastaş 444 style)
      wheel(P, g, .78, .55, -1.3, .78, 1.0, Y); wheel(P, g, .78, .55, -1.3, .78, -1.0, Y);
      wheel(P, g, .52, .4, 1.45, .52, .92, Y, true); wheel(P, g, .52, .4, 1.45, .52, -.92, Y, true);
      s.box(3.8, .5, .9, -.1, .9, 0, BK); s.box(.4, .3, 1.6, 1.45, .55, 0, DG); s.box(.4, .35, 1.8, -1.3, .78, 0, DG);
      for (const sd of [-1, 1]) { fender(s, -1.3, .78, .86, sd * .7, sd * 1.32, Y); fender(s, 1.45, .52, .6, sd * .7, sd * 1.14, Y, .35, Math.PI - .2); }
      prof(s, [[.25, 1.0], [2.3, 1.0], [2.3, 1.62], [2.1, 1.95], [.25, 2.08]], -.6, .6, Y);
      prof(s, [[.25, 2.04], [2.1, 1.92], [2.12, 1.98], [.25, 2.1]], -.55, .55, YD);
      grille(s, 2.31, 1.3, 0, 1.0, .5, 0x777, 8, 'x');
      for (const sd of [-1, 1]) { L.box(.04, .16, .2, 2.3, 1.72, sd * .38, LIT); s.box(.08, .2, .26, 2.28, 1.72, sd * .38, BK); }
      s.box(.15, .25, 1.4, 2.4, .95, 0, BK); // counterweight bumper
      s.cyl(.07, .07, .85, 1.1, 2.4, .42, BK, null, 10);
      const ci = P.ci = cab(s, G, L, {x: -.55, y: 1.18, z: 0, L: 1.8, W: 1.85, H: 1.8, col: Y, frame: BK, roof: Y, low: .32, lowF: .2, slant: .12});
      // rear frame, stabilizers, swing post
      s.box(.55, .85, 2.3, -2.05, 1.22, 0, Y);
      for (const sd of [-1, 1]) { prof(s, [[-2.0, 1.55], [-1.75, 1.55], [-2.05, .15], [-2.35, .15]], sd * 1.1, sd * 1.3, Y); s.box(.5, .08, .45, -2.2, .06, sd * 1.25, BK); s.cyl(.06, .06, .9, -1.95, 1.2, sd * 1.32, CHROME, null, 8); }
      prof(s, [[-2.3, .95], [-2.75, 1.15], [-2.75, 2.0], [-2.3, 2.0]], -.3, .3, YD);
      hazard(g, .5, .3, -2.33, 1.25, 1.16, 0); hazard(g, .5, .3, -2.33, 1.25, -1.16, Math.PI);
      putP(g, s); put(g, G, GLASSM, false); put(g, L, ME, false);
      decal(g, "HİSAR 444", .9, .22, 1.3, 1.6, .605, 0, null, "#1b1712", true);
      // rear boom (curved)
      const rb = grp(g, -2.6, 1.6, 0); rb.rotation.z = 1.95; const RB = SP();
      prof(RB, [[-.2, -.2], [-.2, .2], [1.2, .5], [2.6, .25], [2.65, -.15], [1.25, .1]], -.16, .16, Y); RB.cyl(.12, .12, .4, 2.45, .05, 0, 0x555, 'z', 10); putP(rb, RB);
      decal(rb, "HİSAR", .9, .18, 1.2, .3, .165, 0, null, "#1b1712", true);
      const rd = grp(rb, 2.45, 0, 0); rd.rotation.z = 2.55; const RD = SP(); prof(RD, [[-.35, .2], [1.9, .1], [1.95, -.1], [-.2, -.15]], -.13, .13, Y); putP(rd, RD);
      const rk = grp(rd, 1.9, 0, 0); rk.rotation.z = -.9; const RK = SP();
      for (const zz of [-.3, .27]) prof(RK, [[-.05, .1], [.5, .05], [.62, -.35], [.35, -.55], [.0, -.35]], zz, zz + .03, BK);
      arcPlate(RK, .3, -.2, .32, .03, Math.PI * .5, Math.PI * 1.75, -.28, .28, BK, 12);
      for (let i = 0; i < 4; i++) RK.box(.14, .05, .07, .58, -.48, -.2 + i * .13, 0x8a8a84, 0, 0, .7); putP(rk, RK);
      hydro(P, g, g, [-2.3, 2.0, 0], rb, [1.3, .4, 0], .08, BK); hydro(P, g, rb, [1.6, -.15, .0], rd, [-.35, -.2, 0], .07, BK);
      // loader arms (bent) + bucket
      const fa = P.front = grp(g, .5, 1.85, 0); const F = SP();
      for (const sd of [-1, 1]) prof(F, [[-.2, .14], [1.05, .06], [2.4, -1.05], [2.5, -1.28], [2.25, -1.28], [.95, -.18], [-.2, -.14]], sd * .7, sd * .86, Y);
      F.box(.2, .2, 1.6, 1.4, -.55, 0, Y); putP(fa, F);
      const bf = P.bucketF = grp(fa, 2.35, -1.2, 0); const BF = SP();
      for (const sd of [-1, 1]) prof(BF, [[-.08, .45], [.25, .5], [.75, -.38], [.1, -.45], [-.08, -.2]], sd * 1.12, sd * 1.17, YD);
      arcPlate(BF, .32, .02, .42, .04, Math.PI * .45, Math.PI * 1.55, -1.13, 1.13, YD, 14);
      BF.box(.55, .05, 2.3, .5, -.4, 0, YD); BF.box(.1, .05, 2.3, .78, -.4, 0, 0x8c8c86);
      putP(bf, BF); P.tip = anchor(bf, .75, -.4, 0);
      P.dirt = dirtBlob(bf, 1.4, .75, 4.0, .32, -.1, 0);
      for (const z of [-.6, .6]) hydro(P, g, g, [.95, 1.05, z], fa, [1.1, -.4, z], .075, BK);
      hydro(P, g, fa, [1.2, -.1, 0], bf, [-.05, .4, 0], .07, BK);
      interior(P, g, ci, "wheel"); operator(P, g, ci, type);
      const [sx, sy, sz] = ci.seat;
      joystick(P, g, [sx + .26, sy + .26, sz + .34], "jR");
      lever(P, g, [sx + .55, ci.y + .3, sz - .32], "gear", .35, 0xc0392b);
      P.seatPar = g;
      break;
    }
    case "ld": { // articulated wheel loader
      wheel(P, g, .86, .62, -1.6, .86, 1.12, Y); wheel(P, g, .86, .62, -1.6, .86, -1.12, Y);
      const art = P.art = grp(g, .15, 0, 0);
      wheel(P, art, .86, .62, 1.25, .86, 1.12, Y); wheel(P, art, .86, .62, 1.25, .86, -1.12, Y);
      prof(s, [[-3.35, .75], [-.35, .75], [-.35, 1.32], [-.9, 1.32], [-1.0, 2.2], [-2.75, 2.28], [-3.3, 2.05], [-3.5, 1.5], [-3.5, .95]], -.82, .82, Y);
      prof(s, [[-2.7, 2.24], [-1.05, 2.18], [-1.05, 2.26], [-2.7, 2.32]], -.7, .7, YD);
      grille(s, -3.51, 1.65, 0, 1.3, .55, 0x666, 10, 'x');
      for (const sd of [-1, 1]) { grille(s, -2.1, 1.75, sd * .83, 1.0, .5, 0x666, 12, 'z'); L.box(.04, .12, .12, -3.52, 1.12, sd * .65, RLT); s.box(.1, .45, .4, -3.45, .95, sd * .55, DG); }
      s.box(.5, .7, 2.0, -3.25, 1.0, 0, YD); // counterweight
      for (const sd of [-1, 1]) fender(s, -1.6, .86, .95, sd * .78, sd * 1.46, Y, .2, Math.PI - .5);
      s.cyl(.08, .08, .95, -2.5, 2.7, .45, BK, null, 10); s.box(.4, .4, .3, -2.0, 2.4, -.5, 0x333);
      stepsLadder(s, -.6, .4, 1.35, -.98, BK);
      const ci = P.ci = cab(s, G, L, {x: -.55, y: 1.35, z: 0, L: 1.65, W: 1.8, H: 1.95, col: Y, frame: BK, roof: Y, low: .3, lowF: .15, slant: .1});
      putP(g, s); put(g, G, GLASSM, false); put(g, L, ME, false);
      decal(g, "HİSAR 950", 1.1, .28, -2.0, 1.25, .825, 0, null, "#1b1712", true);
      const A = SP();
      prof(A, [[.15, .75], [2.2, .75], [2.35, 1.0], [2.35, 1.5], [.9, 1.75], [.15, 1.55]], -.55, .55, Y);
      for (const sd of [-1, 1]) fender(A, 1.1, .86, .95, sd * .78, sd * 1.46, Y, .4, Math.PI - .25);
      putP(art, A);
      const AL = SP(); for (const sd of [-1, 1]) AL.box(.05, .14, .22, 2.36, 1.3, sd * .42, LIT); put(art, AL, ME, false);
      const fa = P.front = grp(art, .75, 1.75, 0); const F = SP();
      for (const sd of [-1, 1]) prof(F, [[-.25, .2], [1.0, .05], [2.8, -.95], [2.85, -1.2], [2.55, -1.2], [.95, -.25], [-.25, -.2]], sd * .54, sd * .74, Y);
      F.box(.25, .28, 1.3, 1.65, -.5, 0, Y); putP(fa, F);
      const tl = grp(fa, 1.3, -.1, 0); const T2 = SP(); prof(T2, [[-.1, .1], [.7, 1.0], [.85, .9], [.05, -.1]], -.12, .12, Y); putP(tl, T2);
      const bf = P.bucketF = grp(fa, 2.65, -1.12, 0); const BF = SP();
      for (const sd of [-1, 1]) prof(BF, [[-.1, .6], [.35, .66], [1.05, -.5], [.15, -.58], [-.1, -.25]], sd * 1.47, sd * 1.53, YD);
      arcPlate(BF, .42, .02, .55, .05, Math.PI * .45, Math.PI * 1.55, -1.48, 1.48, YD, 16);
      BF.box(.7, .06, 3.0, .7, -.52, 0, YD); BF.box(.12, .06, 3.0, 1.06, -.53, 0, 0x8c8c86);
      for (let i = 0; i < 7; i++) BF.box(.22, .07, .1, 1.14, -.53, -1.35 + i * .45, 0x8c8c86);
      putP(bf, BF); P.tip = anchor(bf, 1.05, -.52, 0);
      P.dirt = dirtBlob(bf, 1.8, .9, 5.2, .42, -.12, 0);
      for (const z of [-.45, .45]) hydro(P, g, art, [.55, .9, z], fa, [1.25, -.5, z], .1, BK);
      hydro(P, g, art, [.9, 1.7, 0], bf, [-.1, .6, 0], .09, BK);
      interior(P, g, ci, "wheel"); operator(P, g, ci, type);
      const [sx, sy, sz] = ci.seat;
      joystick(P, g, [sx + .26, sy + .26, sz + .34], "jR");
      P.seatPar = g;
      break;
    }
    case "tr": { // 6x4 tipper truck
      wheel(P, g, .56, .44, 3.0, .56, 1.08, 0xb9b9b2, true); wheel(P, g, .56, .44, 3.0, .56, -1.08, 0xb9b9b2, true);
      for (const x of [-1.35, -2.65]) for (const sz of [-1, 1]) wheel(P, g, .56, .5, x, .56, sz * 1.06, 0xb9b9b2);
      for (const sz of [-1, 1]) s.box(8.0, .3, .16, -.3, .88, sz * .46, BK);
      for (const x of [-3.5, -1.0, 1.0, 2.2]) s.box(.12, .2, .9, x, .88, 0, BK);
      // cab: body + slanted windscreen + grille + bumper
      const R0 = 0xb3261e;
      const ci = P.ci = cab(s, G, L, {x: 3.35, y: 1.22, z: 0, L: 2.05, W: 2.48, H: 1.95, col: R0, frame: 0x2a2a2a, roof: R0, low: .42, lowF: .4, slant: .22});
      s.box(1.0, .4, 2.48, 3.85, 1.05, 0, R0);
      grille(s, 4.39, 1.45, 0, 1.4, .45, 0x777, 7, 'x');
      s.box(.25, .38, 2.5, 4.42, .84, 0, 0x2a2a2a); s.box(.06, .08, 2.5, 4.56, .98, 0, 0x555);
      for (const sd of [-1, 1]) { L.box(.04, .16, .34, 4.56, .88, sd * .95, LIT); L.box(.04, .08, .12, 4.56, .99, sd * 1.12, AMB); s.box(.4, .06, .38, 3.8, .85, sd * 1.05, 0x444); s.box(.4, .06, .38, 3.8, .55, sd * 1.05, 0x444); }
      for (const sd of [-1, 1]) fender(s, 3.0, .56, .64, sd * .82, sd * 1.32, 0x2a2a2a, .25, Math.PI - .25);
      s.box(.5, .12, 2.3, 3.6, 3.32, 0, 0x2a2a2a); for (let i = 0; i < 5; i++) L.box(.04, .07, .1, 3.86, 3.32, -.6 + i * .3, AMB);
      s.box(.06, .3, 2.3, 4.12, 3.0, 0, 0x6b1914, 0, 0, -.4); // sun visor
      // behind cab
      s.cyl(.32, .32, 1.1, 1.0, 1.0, -1.0, 0xb9b9b2, 'x', 18); s.box(.55, .5, .5, 1.6, 1.0, 1.05, 0x333);
      s.cyl(.12, .12, .8, 1.6, .9, .9, 0x888, 'x', 12);
      s.cyl(.07, .07, 1.7, 2.2, 2.85, 1.0, 0x333, null, 10); s.cyl(.09, .07, .3, 2.2, 3.8, 1.0, 0x777, null, 10);
      for (const x of [-1.35, -2.65]) for (const sd of [-1, 1]) fender(s, x, .56, .64, sd * .78, sd * 1.34, 0x2a2a2a, .2, Math.PI - .2);
      for (const sd of [-1, 1]) L.box(.04, .12, .2, -4.3, .9, sd * .9, RLT);
      s.box(.08, .3, 2.2, -4.3, .78, 0, 0x2a2a2a); hazard(g, 1.6, .24, -4.35, .78, 0, -Math.PI / 2);
      putP(g, s); put(g, G, GLASSM, false); put(g, L, ME, false);
      decal(g, "HİSAR", 1.0, .25, 4.40, 1.82, 0, Math.PI / 2, null, "#ece6d4");
      // dump body
      const bed = P.bed = grp(g, -4.1, 1.15, 0); const B = SP();
      B.box(6.0, .14, 2.5, 3.0, .08, 0, 0x7a756d);
      for (const sd of [-1, 1]) { prof(B, [[.0, .0], [6.0, .0], [6.0, 1.45], [.2, 1.2]], sd * 1.22, sd * 1.27, 0x7a756d); for (let i = 0; i < 7; i++) B.box(.1, 1.2, .08, .45 + i * .85, .62, sd * 1.3, 0x5e5a53); B.box(5.9, .12, .12, 3.0, 1.28, sd * 1.3, 0x5e5a53); }
      prof(B, [[5.95, 0], [6.1, 0], [6.1, 1.55], [6.9, 1.85], [6.9, 1.95], [5.95, 1.6]], -1.27, 1.27, 0x7a756d);
      B.box(.08, 1.15, 2.42, .03, .62, 0, 0x6a655e); B.box(.12, .1, 2.5, .03, 1.2, 0, 0x5e5a53);
      for (let i = 0; i < 4; i++) B.box(.12, .14, 2.5, 1 + i * 1.4, -.04, 0, 0x5e5a53);
      putP(bed, B);
      P.dirt = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), pileMat); P.dirt.scale.set(2.8, .9, 1.15); P.dirt.position.set(3.1, .14, 0); P.dirt.visible = false; P.dirt.castShadow = true; bed.add(P.dirt);
      hydro(P, g, g, [1.7, .95, 0], bed, [5.6, .05, 0], .13, BK);
      interior(P, g, ci, "truck"); operator(P, g, ci, type);
      const [sx, sy, sz] = ci.seat;
      lever(P, g, [sx + .42, sy - .1, sz + .4], "gear", .3, 0x151515); lever(P, g, [sx + .2, sy - .05, sz + .5], "tip", .25, 0xc0392b);
      P.seatPar = g;
      break;
    }
    case "gr": { // motor grader
      wheel(P, g, .62, .42, 4.3, .62, 1.0, Y, true); wheel(P, g, .62, .42, 4.3, .62, -1.0, Y, true);
      for (const x of [-2.4, -3.8]) for (const sz of [-1, 1]) wheel(P, g, .66, .46, x, .66, sz * 1.08, Y);
      prof(s, [[4.7, .95], [4.4, 1.65], [3.6, 1.95], [-1.1, 1.95], [-1.1, 1.45], [3.4, 1.45], [4.1, 1.1], [4.4, .7]], -.28, .28, Y);
      s.box(.5, .3, 2.2, 4.3, .62, 0, YD); s.box(.12, .55, 2.1, 4.98, .78, 0, Y); for (const sd of [-1, 1]) L.box(.04, .14, .22, 4.6, 1.5, sd * .3, LIT);
      for (const sd of [-1, 1]) prof(s, [[-1.9, .5], [-4.3, .5], [-4.45, .85], [-1.75, .85]], sd * .5, sd * .86, YD);
      prof(s, [[-1.95, .9], [-4.55, .9], [-4.6, 1.5], [-4.3, 2.4], [-2.0, 2.5], [-1.95, 1.4]], -1.0, 1.0, Y);
      prof(s, [[-2.0, 2.45], [-4.3, 2.36], [-4.3, 2.45], [-2.0, 2.53]], -.9, .9, YD);
      grille(s, -4.61, 1.6, 0, 1.4, .6, 0x666, 10, 'x');
      for (const sd of [-1, 1]) { grille(s, -3.2, 1.8, sd * 1.01, 1.4, .55, 0x666, 14, 'z'); L.box(.04, .14, .14, -4.62, 1.15, sd * .8, RLT); }
      s.cyl(.08, .08, .9, -2.6, 2.95, .5, BK, null, 10);
      const ci = P.ci = cab(s, G, L, {x: -1.15, y: 1.3, z: 0, L: 1.75, W: 1.95, H: 2.0, col: Y, frame: BK, roof: Y, low: .26, lowF: .12, slant: .12});
      s.box(3.0, .14, .3, 2.6, 1.08, 0, Y); s.cyl(1.05, 1.05, .12, .6, 1.0, 0, DG, null, 28);
      for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; s.box(.08, .1, .08, .6 + Math.cos(a) * 1.05, 1.0, Math.sin(a) * 1.05, BK); }
      stepsLadder(s, -.3, .4, 1.3, 1.05, BK);
      putP(g, s); put(g, G, GLASSM, false); put(g, L, ME, false);
      decal(g, "HİSAR 140", 1.1, .26, 1.6, 1.7, .285, 0, null, "#1b1712", true);
      const bl = P.blade = grp(g, .6, .55, 0); bl.rotation.y = .38; const D = SP();
      arcPlate(D, .55, .25, .55, .05, Math.PI * .72, Math.PI * 1.25, -1.85, 1.85, Y, 12);
      D.box(.14, .1, 3.7, .08, -.2, 0, 0xc0c0b8); D.box(.3, .25, .7, -.3, .4, 0, DG); for (const sd of [-1, 1]) D.box(.08, .6, .1, -.05, .15, sd * 1.86, YD);
      putP(bl, D);
      for (const sd of [-1, 1]) hydro(P, g, g, [.8, 2.0, sd * .55], bl, [-.15, .4, sd * 1.0], .07, BK);
      interior(P, g, ci, "wheel"); operator(P, g, ci, type);
      const [sx, sy, sz] = ci.seat; const [ex, ey] = ci.eye;
      for (let i = 0; i < 6; i++) lever(P, g, [ex + .32, ey - .6, sz - .5 + i * .2 + (i > 2 ? .0 : 0)], "g" + i, .2, i === 2 || i === 3 ? 0xc0392b : 0x151515);
      P.seatPar = g;
      break;
    }
    case "gt": { // KEMPAR galeri ve tünel açma makinesi
      trackAsm(P, g, {L: 4.2, z: 1.3, w: .7, rs: .45, ri: .42, rr: .2, n: 6, frame: KOD});
      prof(s, [[-3.3, .8], [1.55, .8], [2.35, 1.25], [2.35, 2.05], [1.2, 2.32], [-3.3, 2.32]], -1.15, 1.15, KO);
      prof(s, [[-3.25, 2.3], [1.15, 2.3], [1.15, 2.36], [-3.25, 2.36]], -1.1, 1.1, 0xc98a26);
      grille(s, .3, 1.55, 1.16, 1.3, .95, 0x5a5650, 16, 'z');
      s.box(.5, .6, .18, -1.0, 1.7, 1.2, 0xd9d5cb); s.box(.12, .12, .05, -1.0, 1.55, 1.3, RLT); s.box(.55, .65, .2, -1.0, 1.85, -1.2, 0xd9d5cb);
      s.rod([-1.4, 2.4, .9], [1.2, 2.45, .5], .035, 0x9a9a94, 8); s.rod([-.6, 2.3, 1.05], [1.45, 2.05, .75], .035, 0x9a9a94, 8); s.rod([-.8, 2.4, -1.0], [1.3, 2.5, -.4], .035, 0x9a9a94, 8);
      // chain drive (rear)
      s.cyl(.32, .32, .08, -2.95, 1.65, -1.25, 0x3a3a3a, 'z', 18); s.cyl(.2, .2, .08, -2.95, .85, -1.25, 0x3a3a3a, 'z', 16);
      for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; s.box(.06, .06, .05, -2.95 + Math.cos(a) * .34, 1.65 + Math.sin(a) * .34, -1.29, 0x222); }
      s.box(.06, .82, .06, -2.65, 1.25, -1.28, 0x222); s.box(.06, .82, .06, -3.25, 1.25, -1.28, 0x222);
      s.cyl(.065, .065, 1.6, .6, 3.0, -.95, BK, null, 10);
      s.box(6.5, .3, .8, -.1, 1.0, 0, 0x2f2c28);
      prof(s, [[2.4, .1], [4.05, .1], [4.05, .24], [2.45, .62]], -1.6, 1.6, 0x2c2a27);
      for (const sd of [-1, 1]) prof(s, [[2.4, .1], [3.9, .1], [2.6, .9]], sd * 1.55, sd * 1.62, 0x2c2a27);
      s.box(.1, .08, 3.2, 4.02, .14, 0, 0x777);
      s.cyl(.75, .75, .28, 1.6, 2.32, 0, 0xb87e22, null, 26); s.cyl(.6, .62, .5, 1.6, 2.6, 0, KO, null, 22);
      hazard(g, .8, .25, 2.36, 1.5, .6, Math.PI / 2); hazard(g, .8, .25, 2.36, 1.5, -.6, Math.PI / 2);
      const ci = P.ci = cab(s, G, L, {x: -1.75, y: 2.32, z: -.55, L: 1.55, W: 1.1, H: 1.5, col: KO, frame: BK, roof: 0x7d8186, low: .3, lowF: .3, slant: .12});
      putP(g, s, true, .08); put(g, G, GLASSM, false); put(g, L, ME, false);
      decal(g, "KEMPAR", 2.0, .38, -1.75, 1.85, 1.152, 0, "#d8952a", "#3a2a10", true);
      P.stars = [grp(g, 3.0, .32, .85), grp(g, 3.0, .32, -.85)];
      P.stars.forEach(st => { const k = SP(); for (let i = 0; i < 3; i++) { const a = i * 2.094; k.box(.85, .12, .16, Math.cos(a) * .35, 0, Math.sin(a) * .35, KO, 0, -a); } k.cyl(.18, .18, .16, 0, 0, 0, KOD, null, 12); putP(st, k); });
      const sw = P.swing = grp(g, 1.6, 2.6, 0); const bm = P.boom = grp(sw, 0, 0, 0); bm.rotation.z = -.12;
      const B = SP();
      prof(B, [[-.45, -.5], [-.45, .5], [2.6, .46], [3.3, .36], [3.3, -.36], [2.6, -.46]], -.48, .48, KO);
      prof(B, [[-.4, .5], [2.6, .46], [2.6, .56], [-.4, .6]], -.5, .5, KOD);
      for (const sd of [-1, 1]) B.box(.5, .5, .08, .2, -.25, sd * .52, KOD);
      B.cyl(.42, .48, .55, 3.35, 0, 0, 0x3a3733, 'x', 18); B.rod([.4, .55, .3], [2.6, .52, .35], .03, 0x9a9a94, 6);
      putP(bm, B, true, .08);
      const ct = P.cutter = grp(bm, 3.75, 0, 0); const C = SP();
      C.cyl(.55, .6, .85, 0, 0, 0, 0x4a4743, 'x', 22); C.cyl(.3, .55, .35, .6, 0, 0, 0x4a4743, 'x', 22);
      for (let i = 0; i < 52; i++) { const a = i * 2.39, xx = -.4 + (i % 10) * .1; const r = .6 - Math.max(0, xx - .4) * .5; C.geo(CONE, xx, Math.cos(a) * r, Math.sin(a) * r, 0x9a9a92, a, 0, 0, .05, .2, .05); }
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; C.geo(CONE, .8, Math.cos(a) * .22, Math.sin(a) * .22, 0x9a9a92, 0, 0, -Math.PI / 2, .05, .2, .05); }
      putP(ct, C); P.tip = anchor(ct, .3, 0, 0);
      for (const z of [-.42, .42]) hydro(P, g, sw, [.3, -.55, z], bm, [1.9, -.42, z], .13, KOD);
      // rear discharge conveyor: troughed belt rising steeply so a truck can reverse under its head
      const CL = 7.4, CA = .36, cv = P.conv = grp(g, -3.1, 1.85, 0); cv.rotation.z = -CA; const CV = SP();
      for (const sd of [-1, 1]) {
        CV.box(CL + .4, .28, .07, -CL / 2, 0, sd * .58, KO); CV.box(CL + .4, .06, .14, -CL / 2, .15, sd * .6, KOD); CV.box(CL + .4, .06, .14, -CL / 2, -.15, sd * .6, KOD);
        for (let i = 0; i <= 8; i++) { const x = -.2 - i * (CL / 8); CV.box(.06, .5, .06, x, -.4, sd * .58, KOD); if (i < 8) CV.rod([x, -.62, sd * .58], [x - CL / 8, -.15, sd * .58], .028, KOD, 6); }
        CV.box(CL, .06, .06, -CL / 2, -.64, sd * .58, KOD);
        CV.box(.08, .55, .06, -CL + .2, .45, sd * .62, KO); // skirt boards
      }
      for (let i = 0; i < 13; i++) { const x = -.25 - i * (CL - .4) / 12;
        CV.cyl(.055, .055, .36, x, .02, 0, 0x8a8a84, 'z', 8);
        for (const sd of [-1, 1]) { CV.geo(new THREE.CylinderGeometry(.05, .05, .3, 8), x, .12, sd * .3, 0x8a8a84, -sd * (Math.PI / 2 - .5), 0, 0); }
        CV.box(.05, .05, 1.1, x, -.06, 0, 0x444);
        if (i % 2 === 0) CV.cyl(.05, .05, .95, x, -.48, 0, 0x555, 'z', 8); }
      CV.cyl(.22, .22, 1.08, -CL, .04, 0, 0x555, 'z', 16); CV.cyl(.18, .18, 1.08, 0, .04, 0, 0x555, 'z', 16);
      CV.box(.45, .4, .35, -CL + .05, .05, .82, 0x3a3a3a); CV.cyl(.16, .16, .45, -CL + .05, .05, 1.15, 0x2f6b9a, 'z', 14); // drive motor
      arcPlate(CV, -CL, .04, .34, .05, -Math.PI * .1, Math.PI * .95, -.66, .66, KO, 12); // head hood
      prof(CV, [[-CL - .38, -.1], [-CL - .2, -.95], [-CL + .25, -.95], [-CL + .05, -.15]], -.5, .5, KOD); // discharge chute
      putP(cv, CV, true, .08);
      hazard(cv, .6, .25, -CL + .1, .45, .69, 0); hazard(cv, .6, .25, -CL + .1, .45, -.69, Math.PI);
      // A-frame supports from the machine's rear to the conveyor
      { const SS = SP(), c = Math.cos(CA), sn = Math.sin(CA), pt = (d, dy) => [-3.1 - d * c, 1.85 + d * sn + (dy || 0)];
        for (const sd of [-1, 1]) { const a = pt(3.0, -.66), b2 = pt(1.2, -.66); SS.rod([-3.25, 2.3, sd * .5], [a[0], a[1], sd * .58], .06, KOD, 8); SS.rod([-3.3, .95, sd * .5], [a[0], a[1], sd * .58], .06, KOD, 8); SS.rod([-3.3, .95, sd * .5], [b2[0], b2[1], sd * .58], .05, KOD, 8); }
        putP(g, SS, true, .06); }
      // troughed belt: centre strip + two inclined wings, textured and scrolling
      const btex = texCanvas(64, 64, (c) => { c.fillStyle = "#23211f"; c.fillRect(0, 0, 64, 64); c.fillStyle = "#3f3b35"; c.fillRect(0, 0, 8, 64); c.fillStyle = "#2c2a27"; for (let i = 0; i < 60; i++) c.fillRect(Math.random() * 64, Math.random() * 64, 2, 2); c.fillStyle = "rgba(190,150,110,.25)"; for (let i = 0; i < 30; i++) c.fillRect(Math.random() * 64, Math.random() * 64, 3, 2); });
      btex.wrapS = btex.wrapT = THREE.RepeatWrapping; btex.repeat.set(CL / .32, 1);
      const bm2 = new THREE.MeshLambertMaterial({map: btex, side: THREE.DoubleSide});
      const belt = new THREE.Mesh(new THREE.PlaneGeometry(CL, .38), bm2); belt.rotation.x = -Math.PI / 2; belt.position.set(-CL / 2, .085, 0); belt.receiveShadow = true; cv.add(belt);
      for (const sd of [-1, 1]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(CL, .34), bm2); w.rotation.order = "XYZ"; w.rotation.x = -Math.PI / 2 + sd * .5; w.position.set(-CL / 2, .16, sd * .33); w.receiveShadow = true; cv.add(w); }
      P.beltTex = btex; P.beltL = CL; P.beltEnd = anchor(cv, -CL - .3, -.9, 0); P.beltN = 24;
      P.slots = new Float32Array(P.beltN); P.chunks = [];
      for (let i = 0; i < P.beltN; i++) { const c = new THREE.Mesh(new THREE.SphereGeometry(.3, 7, 5), pileMat); c.visible = false; c.castShadow = true; cv.add(c); P.chunks.push(c); }
      interior(P, g, ci, "gt"); operator(P, g, ci, type);
      const [sx, sy, sz] = ci.seat;
      for (let i = 0; i < 4; i++) lever(P, g, [ci.xf - .3, ci.y + .7, sz - .25 + i * .16], "k" + i, .25, i === 3 ? 0xc0392b : 0x151515);
      joystick(P, g, [sx + .26, sy + .26, sz + .34], "jR");
      P.seatPar = g;
      break;
    }
    case "tk": {
      const m = window.mkM60(0x4a5a38, 0, 0); m.traverse(o => { if (o.material === X.MV0) o.material = MV; }); m.rotation.y = Math.PI / 2; g.add(m); P.m60 = m; P.u = m.userData;
      m.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      P.flash = new THREE.Mesh(new THREE.SphereGeometry(.6, 10, 8), new THREE.MeshBasicMaterial({color: 0xffd27a, transparent: true, opacity: .95})); P.flash.visible = false; P.u.gn.add(P.flash); P.flash.position.set(0, 0, 5.2); P.muzzle = anchor(P.u.gn, 0, 0, 5.0);
      P.ci = {seat: [2.15, .7, 0], eye: [2.3, 1.52, 0]};
      operator(P, g, P.ci, type);
      const T = grp(g, 2.55, 1.78, 0); T.rotation.z = -.35; const tb = grp(T); tb.rotation.y = -Math.PI / 2; const sp = grp(tb); const k = SP(); k.box(.5, .04, .04, 0, 0, 0, 0x222); k.box(.04, .2, .04, 0, -.1, 0, 0x222); k.sph(.035, .035, .035, -.25, 0, 0, 0x111, 6); k.sph(.035, .035, .035, .25, 0, 0, 0x111, 6); put(sp, k, MV, false);
      P.sw = sp; P.hand.wL = anchor(sp, -.25, 0, 0); P.hand.wR = anchor(sp, .25, 0, 0);
      P.seatPar = g;
      break;
    }
  }
  if (P.ci && P.ci.door && P.seatPar) { const d = P.ci.door; const dg = grp(P.seatPar, d.hx, 0, d.hz); putP(dg, d.D, true, 0); put(dg, d.DG, GLASSM, false); P.door = dg; }
  const EX = {ex: [-1.55, 3.4, .78], dz: [1.1, 3.28, .35], bh: [1.1, 2.86, .42], ld: [-2.5, 3.18, .45], tr: [2.2, 3.97, 1.0], gr: [-2.6, 3.42, .5], gt: [.6, 3.82, -.95], tk: [-3.3, 1.5, .6]}[type];
  if (EX) P.exh = anchor(g, EX[0], EX[1], EX[2]);
  // weathering: limestone dust settles on the lower parts, buckets and blades
  if (type !== "tk") { g.updateMatrixWorld(true); const v3 = new THREE.Vector3(), DU = [.47, .41, .33];
    g.traverse(o => { if (!o.isMesh || o.material !== MVP) return; const p = o.geometry.attributes.position, c = o.geometry.attributes.color; if (!c) return;
      for (let i = 0; i < p.count; i++) { v3.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld); const k = Math.min(.62, Math.pow(Math.max(0, 1.5 - v3.y) / 1.5, 1.3) * .62 + (Math.sin(v3.x * 7.1 + v3.z * 5.3) * .5 + .5) * .06);
        c.setXYZ(i, c.getX(i) + (DU[0] - c.getX(i)) * k, c.getY(i) + (DU[1] - c.getY(i)) * k, c.getZ(i) + (DU[2] - c.getZ(i)) * k); } c.needsUpdate = true; }); }
  const T = TYPES[type]; const sh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({color: 0, transparent: true, opacity: .2, depthWrite: false}));
  sh.rotation.x = -Math.PI / 2; sh.scale.set(T.L * (type === "gt" ? .7 : 1.05), T.Wd * 1.15, 1); sh.position.set(type === "gt" ? .5 : 0, .03, 0); g.add(sh);
  return {g, P};
}

  H.santiye = { build: buildModel, TYPES: TYPES, SP: SP };
})();
