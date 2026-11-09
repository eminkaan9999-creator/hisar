/* ================= BİTKİLER: dallı gövde + yaprak kartlı gerçekçi ağaçlar, çimen tutamları ================= */
const BITKI={ ruzgar:{value:0} };
function _rng(t){ let s=t>>>0||1; return ()=>{ s=(s*1664525+1013904223)>>>0; return s/4294967296; }; }
// yaprak dokusu: 2x2 atlas (dört farklı küme), şeffaf zemin
function yaprakDoku(tur){
  const anah="d_"+tur; if(BITKI[anah]) return BITKI[anah];
  const S=512, H=S/2; const c=document.createElement("canvas"); c.width=c.height=S; const x=c.getContext("2d"); const R=_rng(tur.length*977+13);
  const hsl=(h,s,l,a=1)=>`hsla(${h},${s}%,${l}%,${a})`;
  const yaprak=(cx,cy,uz,en,aci,renk,damar)=>{ x.save(); x.translate(cx,cy); x.rotate(aci); x.fillStyle=renk; x.beginPath(); x.moveTo(-uz,0); x.quadraticCurveTo(0,-en*1.15,uz,0); x.quadraticCurveTo(0,en*1.15,-uz,0); x.fill();
    if(damar){ x.strokeStyle=damar; x.lineWidth=.8; x.beginPath(); x.moveTo(-uz*.9,0); x.lineTo(uz*.85,0); x.stroke(); } x.restore(); };
  for(let q=0;q<4;q++){ const ox=(q%2)*H, oy=(q>>1)*H, cx0=ox+H/2, cy0=oy+H/2;
    x.save(); x.beginPath(); x.rect(ox+2,oy+2,H-4,H-4); x.clip();
    const icinde=()=>{ for(;;){ const a=R()*Math.PI*2, r=Math.sqrt(R())*H*.43; const px=cx0+Math.cos(a)*r, py=cy0+Math.sin(a)*r*.92; return [px,py,r/(H*.43)]; } };
    if(tur==="cam"){ // iğne tutamları: dal üzerinde ışınsal iğneler
      x.strokeStyle=hsl(25,35,22); x.lineWidth=3; x.beginPath(); x.moveTo(ox+10,cy0+R()*20-10); x.quadraticCurveTo(cx0,cy0-8,ox+H-12,cy0+R()*30-15); x.stroke();
      for(let k=0;k<34;k++){ const t=R(); const bx=ox+14+t*(H-30), by=cy0+(R()-.5)*34; const n=30;
        for(let i=0;i<n;i++){ const a=-Math.PI/2+(R()-.5)*2.6+(R()<.5?Math.PI:0), L=H*(.07+R()*.1); x.strokeStyle=hsl(100+R()*35,22+R()*20,22+R()*22+(i%5===0?12:0)); x.lineWidth=1.4+R()*1.0;
          x.beginPath(); x.moveTo(bx,by); x.lineTo(bx+Math.cos(a)*L,by+Math.sin(a)*L*1.1); x.stroke(); } }
    } else if(tur==="selvi"){
      for(let i=0;i<2600;i++){ const [px,py,r]=icinde(); const l=20+R()*20-(1-r)*4; x.fillStyle=hsl(105+R()*30,28+R()*16,l); x.beginPath(); x.ellipse(px,py,2.2+R()*2.5,3.5+R()*4,R()*3,0,7); x.fill(); }
    } else if(tur==="cicek"){
      for(let i=0;i<70;i++){ const [px,py]=icinde(); yaprak(px,py,9+R()*7,4+R()*2,R()*6.3,hsl(95+R()*25,35+R()*15,30+R()*14),hsl(95,30,22)); }
      for(let i=0;i<300;i++){ const [px,py]=icinde(); const r0=4.2+R()*3.4; const pemb=R(); const L=78+R()*14;
        for(let k=0;k<5;k++){ const a=k/5*Math.PI*2+R()*.3; x.fillStyle=hsl(338+R()*10,55+pemb*35,L-k%2*3); x.beginPath(); x.ellipse(px+Math.cos(a)*r0*.75,py+Math.sin(a)*r0*.75,r0*.62,r0*.42,a,0,7); x.fill(); }
        x.fillStyle=hsl(330,60,48); x.beginPath(); x.arc(px,py,1.6,0,7); x.fill(); }
    } else {
      const P={yesil:[[88,118],[32,55],[22,40]], sonbahar:[[18,48],[60,85],[34,55]], zeytin:[[70,95],[10,22],[38,58]]}[tur]||[[88,118],[32,55],[22,40]];
      const n=tur==="zeytin"?480:440;
      for(let i=0;i<n;i++){ const [px,py,r]=icinde(); const h=P[0][0]+R()*(P[0][1]-P[0][0]), s=P[1][0]+R()*(P[1][1]-P[1][0]), l=P[2][0]+R()*(P[2][1]-P[2][0])-(1-r)*8;
        if(tur==="zeytin") yaprak(px,py,8+R()*5,1.8+R()*1.1,R()*6.3,hsl(h,s,l),null);
        else yaprak(px,py,8+R()*6,4.5+R()*2.6,R()*6.3,hsl(h,s,l),hsl(h,s,l-8)); } }
    x.restore(); }
  const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; t.anisotropy=4; t.__kalici=true; BITKI[anah]=t; return t;
}
function kabukDoku(){
  if(BITKI.kabuk) return BITKI.kabuk;
  const c=document.createElement("canvas"); c.width=128; c.height=256; const x=c.getContext("2d"); const R=_rng(71);
  x.fillStyle="#6b5a4a"; x.fillRect(0,0,128,256);
  for(let i=0;i<260;i++){ const px=R()*128, py=R()*256, h=10+R()*40; x.fillStyle=`rgba(${R()<.5?30:120},${R()<.5?24:100},${R()<.5?18:84},${.12+R()*.25})`; x.fillRect(px,py,2+R()*5,h); }
  for(let i=0;i<40;i++){ const py=R()*256; x.strokeStyle=`rgba(25,18,12,${.25+R()*.3})`; x.lineWidth=1+R()*1.5; x.beginPath(); x.moveTo(R()*128,py); x.lineTo(R()*128,py+(R()-.5)*14); x.stroke(); }
  const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.encoding=THREE.sRGBEncoding; t.__kalici=true; BITKI.kabuk=t; return t;
}
// rüzgârda hafif salınım (yapraklar için gölgelendirici eki)
function _ruzgarEkle(m,guc,taban=1){ m.onBeforeCompile=s=>{ s.uniforms.uRuzgar=BITKI.ruzgar;
  s.vertexShader="uniform float uRuzgar;\n"+s.vertexShader.replace("#include <begin_vertex>",`#include <begin_vertex>
    { vec4 wp=modelMatrix*vec4(transformed,1.0);
      #ifdef USE_INSTANCING
        wp=modelMatrix*instanceMatrix*vec4(transformed,1.0);
      #endif
      float h=max(transformed.y-${taban.toFixed(2)},0.0)*${guc.toFixed(3)};
      transformed.x+=sin(uRuzgar*1.7+wp.x*.35+wp.z*.21)*h; transformed.z+=cos(uRuzgar*1.3+wp.z*.31)*h*.7; }`); }; m.customProgramCacheKey=()=>"ruzgar"+guc+"_"+taban; }
function _malzeme(tur){
  const anah="m_"+tur; if(BITKI[anah]) return BITKI[anah];
  const map=yaprakDoku(tur);
  const m=new THREE.MeshLambertMaterial({map,alphaTest:.48,side:THREE.DoubleSide,vertexColors:true}); // yapraklar: köşe başı ışık (ucuz, yumuşak)
  _ruzgarEkle(m,tur==="cam"||tur==="selvi"?.006:.012); m.userData.kalici=true;
  const d=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,map,alphaTest:.48,side:THREE.DoubleSide}); d.userData.kalici=true;
  const k=new THREE.MeshStandardMaterial({map:kabukDoku(),vertexColors:true,roughness:.95,metalness:0,bumpMap:kabukDoku(),bumpScale:.03}); k.userData.kalici=true;
  BITKI[anah]={yaprak:m,derinlik:d,kabuk:k}; return BITKI[anah];
}
const _Y=new THREE.Vector3(0,1,0);
/* tek bir ağaç türü için gövde/dal ve yaprak geometrisi (1 birim ölçekte) */
function _agacGeo(tur,tohum){
  const R=_rng(tohum); const rnd_=(a,b)=>a+R()*(b-a);
  const dallar=[], kartlar=[]; // dal: a,b,r0,r1 ; kart: p, boy, normalYon
  const dal=(a,yon,uz,r0,r1)=>{ const b=a.clone().addScaledVector(yon,uz); dallar.push({a,b,r0,r1}); return b; };
  const sapma=(yon,aci)=>{ const p=new THREE.Vector3(R()-.5,R()-.5,R()-.5).cross(yon).normalize(); return yon.clone().applyAxisAngle(p,aci).normalize(); };
  let tepe=new THREE.Vector3(), yaricap=2;
  if(tur==="cam"){
    const H=rnd_(9,12.5); let p=new THREE.Vector3(); let yon=new THREE.Vector3(rnd_(-.03,.03),1,rnd_(-.03,.03)).normalize();
    const seg=8; for(let i=0;i<seg;i++){ const t=i/seg; const yeni=sapma(yon,.05); p=dal(p,yeni,H/seg,.34*(1-t)+.05,.34*(1-(i+1)/seg)+.05); yon=yeni; }
    tepe.copy(p).multiplyScalar(.75); yaricap=3;
    for(let y=H*.42;y<H*.98;y+=rnd_(.5,.85)){ const t=(y-H*.42)/(H*.56); const n=Math.round(rnd_(3,5)); const L=((1-t)*rnd_(2.2,3.1)+.5)*.85;
      for(let k=0;k<n;k++){ const a=k/n*Math.PI*2+rnd_(0,1.2); const d=new THREE.Vector3(Math.cos(a),rnd_(-.25,.12)-t*.0,Math.sin(a)).normalize(); const bas=new THREE.Vector3(0,y,0);
        const uc=dal(bas,d,L,.07*(1-t)+.03,.015);
        // iğne kümeleri dalın dış yarısı boyunca, hafif sarkık
        const m=Math.max(3,Math.round(L*2.8)); for(let j=0;j<m;j++){ const q=bas.clone().lerp(uc,.25+.8*(j+.5)/m); q.y-=(j/m)*.3; q.x+=rnd_(-.15,.15); q.z+=rnd_(-.15,.15); kartlar.push({p:q,boy:rnd_(1.25,1.85),yon:d.clone().setY(.75).normalize(),yatay:true}); } } }
    for(let k=0;k<5;k++) kartlar.push({p:new THREE.Vector3(rnd_(-.3,.3),H*rnd_(.95,1.02),rnd_(-.3,.3)),boy:rnd_(.9,1.3),yon:_Y.clone(),yatay:false});
  } else if(tur==="selvi"){
    const H=rnd_(6.5,8); dal(new THREE.Vector3(),_Y.clone(),H*.85,.16,.05); tepe.set(0,H*.5,0); yaricap=1;
    const n=210; for(let i=0;i<n;i++){ const t=Math.pow(R(),.85); const y=.6+t*(H-.6); const r=(.85*Math.sin(Math.PI*Math.pow(1-t,.75)*.95+.1))*rnd_(.75,1.05); const a=R()*Math.PI*2;
      kartlar.push({p:new THREE.Vector3(Math.cos(a)*r,y,Math.sin(a)*r),boy:rnd_(.7,1.05),yon:new THREE.Vector3(Math.cos(a),.3,Math.sin(a)).normalize(),yatay:false}); }
  } else {
    const zeytin=tur==="zeytin";
    const h0=zeytin?rnd_(1.1,1.5):rnd_(2.1,2.8); let p=new THREE.Vector3(); let yon=new THREE.Vector3(rnd_(-.08,.08),1,rnd_(-.08,.08)).normalize();
    for(let i=0;i<3;i++){ const yeni=sapma(yon,zeytin?.22:.07); p=dal(p,yeni,h0/3,(zeytin?.24:.2)*(1-i*.12),(zeytin?.24:.2)*(1-(i+1)*.12)); yon=yeni; }
    const ana=Math.round(rnd_(3,5)); const uclar=[];
    const buyu=(a,y_,uz,r,der)=>{ const b=dal(a,y_,uz,r,r*.62); if(der===0){ uclar.push({p:b,yon:y_}); return; }
      const n=der===2?Math.round(rnd_(2,3)):Math.round(rnd_(2,4)); for(let k=0;k<n;k++){ const yy=sapma(y_,rnd_(.35,.8)); yy.y=Math.max(yy.y,-.15); yy.normalize(); buyu(b,yy,uz*rnd_(.6,.78),r*.6,der-1); }
      if(der<2) uclar.push({p:a.clone().lerp(b,.6),yon:y_}); };
    for(let k=0;k<ana;k++){ const a=k/ana*Math.PI*2+rnd_(0,.8); const yy=new THREE.Vector3(Math.cos(a)*rnd_(.45,.8),1,Math.sin(a)*rnd_(.45,.8)).normalize(); buyu(p.clone(),yy,zeytin?rnd_(1,1.4):rnd_(1.3,1.8),.13,2); }
    tepe.set(0,p.y+(zeytin?1.2:1.7),0); yaricap=zeytin?1.8:2.4;
    for(const u of uclar){ const n=zeytin?4:6; for(let k=0;k<n;k++){ const q=u.p.clone().add(new THREE.Vector3(rnd_(-.55,.55),rnd_(-.25,.55),rnd_(-.55,.55))); kartlar.push({p:q,boy:rnd_(zeytin?.95:1.2,zeytin?1.4:1.9),yon:q.clone().sub(tepe).normalize(),yatay:false}); } }
  }
  // gövde/dal örgüsü: her dal kesik koni (7 kenar), köke doğru koyu
  const kp=[], kn=[], ku=[], kc=[], ki=[]; const S=7;
  for(const d of dallar){ const ax=d.b.clone().sub(d.a); const L=ax.length(); ax.normalize(); const t1=new THREE.Vector3(1,0,0); if(Math.abs(ax.x)>.9) t1.set(0,0,1); const u=t1.cross(ax).normalize(), v=ax.clone().cross(u);
    const taban=kp.length/3; const koyu=.55+.45*Math.min(1,d.a.y/4);
    for(let j=0;j<=1;j++){ const c0=j?d.b:d.a, r=j?d.r1:d.r0; for(let i=0;i<=S;i++){ const a=i/S*Math.PI*2; const n=u.clone().multiplyScalar(Math.cos(a)).addScaledVector(v,Math.sin(a));
        const q=c0.clone().addScaledVector(n,r); kp.push(q.x,q.y,q.z); kn.push(n.x,n.y,n.z); ku.push(i/S*2,(j?L:0)*1.3+d.a.y*1.3); const cc=tur==="cam"? (q.y>4?[1.25,.88,.7]:[.85,.8,.78]) : [koyu,koyu,koyu]; kc.push(cc[0],cc[1],cc[2]); } }
    for(let i=0;i<S;i++){ const a=taban+i, b=taban+i+1, c_=taban+S+1+i, d_=taban+S+2+i; ki.push(a,c_,b, b,c_,d_); } }
  const gG=new THREE.BufferGeometry(); gG.setAttribute("position",new THREE.Float32BufferAttribute(kp,3)); gG.setAttribute("normal",new THREE.Float32BufferAttribute(kn,3)); gG.setAttribute("uv",new THREE.Float32BufferAttribute(ku,2)); gG.setAttribute("color",new THREE.Float32BufferAttribute(kc,3)); gG.setIndex(ki);
  // yaprak kartları: rastgele yönlü kareler; normaller taç merkezinden dışa (hacimli ışık), içeride koyu (gölge)
  const yp=[], yn=[], yu=[], yc=[], yi=[];
  for(const k of kartlar){ const q=new THREE.Quaternion(); if(k.yatay){ q.setFromUnitVectors(new THREE.Vector3(0,0,1),k.yon); q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),R()*6.28)); }
      else q.setFromEuler(new THREE.Euler(R()*6.28,R()*6.28,R()*6.28));
    const ex=new THREE.Vector3(1,0,0).applyQuaternion(q).multiplyScalar(k.boy/2), ey=new THREE.Vector3(0,1,0).applyQuaternion(q).multiplyScalar(k.boy/2);
    const at=Math.floor(R()*4); const u0=(at%2)*.5, v0=(at>>1)*.5;
    const disa=k.p.clone().sub(tepe); const uzak=Math.min(1,disa.length()/yaricap); const nn=disa.normalize().multiplyScalar(.75).add(new THREE.Vector3(0,.35,0)).normalize();
    const parlak=(.62+.45*uzak)*(.88+R()*.24), ton=R()*.08;
    const taban=yp.length/3;
    for(const [sx,sy,uu,vv] of [[-1,-1,0,0],[1,-1,1,0],[1,1,1,1],[-1,1,0,1]]){ const p_=k.p.clone().addScaledVector(ex,sx).addScaledVector(ey,sy); yp.push(p_.x,p_.y,p_.z); yn.push(nn.x,nn.y,nn.z); yu.push(u0+.01+uu*.48,v0+.01+vv*.48); yc.push(parlak*(1-ton*.5),parlak,parlak*(1-ton)); }
    yi.push(taban,taban+1,taban+2, taban,taban+2,taban+3); }
  const gY=new THREE.BufferGeometry(); gY.setAttribute("position",new THREE.Float32BufferAttribute(yp,3)); gY.setAttribute("normal",new THREE.Float32BufferAttribute(yn,3)); gY.setAttribute("uv",new THREE.Float32BufferAttribute(yu,2)); gY.setAttribute("color",new THREE.Float32BufferAttribute(yc,3)); gY.setIndex(yi);
  gG.computeBoundingSphere(); gY.computeBoundingSphere();
  return {gG,gY};
}
function agac(tur="yesil",o=1){
  if(tur==="selvi"||tur==="cam"||tur==="zeytin"||tur==="cicek"||tur==="sonbahar"||tur==="yesil"); else tur="yesil";
  const v=Math.floor(Math.random()*3); const anah="g_"+tur+v;
  if(!BITKI[anah]){ BITKI[anah]=_agacGeo(tur,tur.length*1000+v*97+7); BITKI[anah].gG.userData={kalici:true}; }
  const G=BITKI[anah], M=_malzeme(tur);
  const g=new THREE.Group();
  const govde=new THREE.Mesh(G.gG,M.kabuk); govde.castShadow=true; govde.receiveShadow=true; govde.userData.kalici=true; g.add(govde);
  const yap=new THREE.Mesh(G.gY,M.yaprak); yap.castShadow=true; yap.receiveShadow=true; yap.customDepthMaterial=M.derinlik; yap.userData.kalici=true; g.add(yap);
  g.scale.setScalar(o*(tur==="cam"?.95:1)); g.rotation.y=Math.random()*6.28;
  g.userData.engel=tur==="cam"?.34:tur==="selvi"?.3:.3;
  return g;
}
/* çimen: üç çapraz kartlık tutamlar (ince yapraklar, kökte koyu), örnekli çizim */
function cimDoku(){
  if(BITKI.cim) return BITKI.cim;
  const W=256,H=256; const c=document.createElement("canvas"); c.width=W; c.height=H; const x=c.getContext("2d"); const R=_rng(5);
  for(let i=0;i<90;i++){ const bx=10+R()*(W-20), h=H*(.45+R()*.55), egim=(R()-.5)*60, w=2+R()*3.5;
    const gr=x.createLinearGradient(0,H,0,H-h); gr.addColorStop(0,"rgba(112,138,64,1)"); gr.addColorStop(.5,`hsl(${78+R()*28},${38+R()*18}%,${46+R()*12}%)`); gr.addColorStop(1,`hsl(${68+R()*24},${34+R()*18}%,${58+R()*14}%)`);
    x.fillStyle=gr; x.beginPath(); x.moveTo(bx-w,H); x.quadraticCurveTo(bx+egim*.3,H-h*.6,bx+egim,H-h); x.quadraticCurveTo(bx+egim*.3+w*.4,H-h*.55,bx+w,H); x.fill(); }
  const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; t.__kalici=true; BITKI.cim=t; return t;
}
function otlar(alan,adet,renkH="#6f9443",yuk=.35,haric){
  if(!BITKI.cimG){ const gs=[]; for(let k=0;k<3;k++){ const p=new THREE.PlaneGeometry(.55,.5); p.translate(0,.25,0); p.rotateY(k*Math.PI/3); gs.push(p); }
    const g=new THREE.BufferGeometry(); const pos=[], uv=[], nor=[], idx=[]; let o=0;
    for(const p of gs){ const a=p.attributes.position, u=p.attributes.uv, ix=p.index.array; for(let i=0;i<a.count;i++){ pos.push(a.getX(i),a.getY(i),a.getZ(i)); uv.push(u.getX(i),u.getY(i)); nor.push(0,1,0); } for(const i of ix) idx.push(i+o); o+=a.count; }
    g.setAttribute("position",new THREE.Float32BufferAttribute(pos,3)); g.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2)); g.setAttribute("normal",new THREE.Float32BufferAttribute(nor,3)); g.setIndex(idx); BITKI.cimG=g; }
  const m=new THREE.MeshLambertMaterial({map:cimDoku(),alphaTest:.42,side:THREE.DoubleSide,color:renk(renkH).lerp(new THREE.Color(1,1,1),.62)});
  _ruzgarEkle(m,.09,0);
  const im=new THREE.InstancedMesh(BITKI.cimG,m,adet); const o=new THREE.Object3D(); const cl=new THREE.Color();
  for(let i=0;i<adet;i++){ let p=alan(); for(let k=0;k<12&&haric&&haric(p);k++) p=alan(); if(haric&&haric(p)){ o.scale.setScalar(0); o.updateMatrix(); im.setMatrixAt(i,o.matrix); continue; }
    o.position.set(p.x,p.y||0,p.z); o.rotation.set(0,Math.random()*6.3,0); const s=rnd(.55,1.05); o.scale.set(s,s*yuk/.35*rnd(.7,1.2),s); o.updateMatrix(); im.setMatrixAt(i,o.matrix);
    cl.setRGB(rnd(.92,1.12),rnd(.96,1.14),rnd(.86,1.04)); im.setColorAt(i,cl); }
  if(im.instanceColor) im.instanceColor.needsUpdate=true; im.receiveShadow=true; im.frustumCulled=false; return im;
}
