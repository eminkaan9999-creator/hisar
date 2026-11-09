/* ================= KABUK GİYSİ: vücut yüzeyinden kalınlık verilerek üretilen, aynı kemiklere bağlı mont / ceket =================
   Böylece giysi bedene tam oturur, kollarla birlikte bükülür, içinden vücut çıkmaz. Desen (kapitone kanallar, fermuar, cep)
   bağlama pozundaki konuma göre gölgelendiricide çizilir. */
function _agirliklar(geo,i){ const J=geo.attributes.skinIndex, W=geo.attributes.skinWeight; const wn=W.normalized?(W.array instanceof Uint8Array?255:W.array instanceof Uint16Array?65535:1):1;
  return [[J.getX(i),W.getX(i)/wn],[J.getY(i),W.getY(i)/wn],[J.getZ(i),W.getZ(i)/wn],[J.getW(i),W.getW(i)/wn]]; }
function _birlestirA(a,b,k=.5){ const m=new Map(); for(const [j,w] of a) if(w>0) m.set(j,(m.get(j)||0)+w*(1-k)); for(const [j,w] of b) if(w>0) m.set(j,(m.get(j)||0)+w*k);
  const L=[...m.entries()].sort((x,y)=>y[1]-x[1]).slice(0,4); const s=L.reduce((t,e)=>t+e[1],0)||1; while(L.length<4) L.push([0,0]); return L.map(([j,w])=>[j,w/s]); }
function kabukGiysi(model,ayar){
  // kaynak yüzey: vücut + üst kıyafet köşeleri (MetaPerson vücudu kıyafetin altında boş olabilir), bağlama uzayında
  let body=null; const kaynaklar=[]; model.traverse(o=>{ if(!o.isSkinnedMesh||!o.material) return; const n=o.material.name; if(n==="AvatarBody") body=o; if(n==="AvatarBody"||n==="outfit") kaynaklar.push(o); });
  if(!body) return null;
  const sk=body.skeleton, ad=sk.bones.map(b=>b.name.replace(/^mixamorig/,""));
  const grup=n=>/Hand/.test(n)?"el":/^(Head|Neck1|Neck2|HeadTop|LeftEye|RightEye)/.test(n)?"bas":/^Neck$/.test(n)?"boyun":/(Arm|Shoulder)/.test(n)?"kol":/(UpLeg|Leg|Foot|Toe)/.test(n)?"bacak":"govde";
  const gr=ad.map(grup), omuzK=ad.map(n=>/Shoulder/.test(n)); // köprücük (Shoulder) kemiği: boyun ile kol arası
  const kemikP=n=>{ const i=ad.indexOf(n); if(i<0) return null; return new THREE.Vector3().setFromMatrixPosition(new THREE.Matrix4().copy(sk.boneInverses[i]).invert()); };
  const elX=Math.abs((kemikP("LeftHand")||new THREE.Vector3(.7,0,0)).x), boyunY=(kemikP("Neck")||new THREE.Vector3(0,1.45,0)).y, omuzX=Math.abs((kemikP("LeftArm")||new THREE.Vector3(.17,0,0)).x);
  const kalcaY=(kemikP("Hips")||new THREE.Vector3(0,.95,0)).y;
  const etek=ayar.etek!==undefined?ayar.etek:kalcaY-.04+(ayar.etekPay||0), kolUc=elX-(ayar.kolPay||.035), yakaY=boyunY+(ayar.yakaPay||0);
  const N=[]; // kaynak noktalar
  for(const o of kaynaklar){ const g=o.geometry, P=g.attributes.position; const esle=o.skeleton.bones.map(b=>ad.indexOf(b.name.replace(/^mixamorig/,"")));
    const kim=o.material.name; const M=SINIF_MASKE[ayar.kim]; const UV=g.attributes.uv;
    for(let i=0;i<P.count;i++){ if(kim==="outfit"&&M&&UV){ const c=M[Math.min(255,(UV.getY(i)*256)|0)*256+Math.min(255,(UV.getX(i)*256)|0)]; if(c!==1&&c!==2) continue; if(c===2&&P.getY(i)<etek-.04) continue; }
      const w=_agirliklar(g,i).map(([j,x])=>[Math.max(0,esle[j]),x]); let kol=0, kolSaf=0, el=0, bas=0; for(const [j,x] of w){ if(gr[j]==="kol"){ kol+=x; if(!omuzK[j]) kolSaf+=x; } if(gr[j]==="el") el+=x; if(gr[j]==="bas") bas+=x; }
      N.push({x:P.getX(i),y:P.getY(i),z:P.getZ(i),w,kol,kolSaf,el,bas}); } }
  const A=32, ADIM=.011; const ss=(a,b,x)=>{ const t=Math.min(1,Math.max(0,(x-a)/(b-a))); return t*t*(3-2*t); };
  // dilimler: gövde (y ekseni) ve kollar (T pozunda x ekseni); her dilimde açıya göre en dış yarıçap
  const dilimle=(secici,eksenD,bas_,son_,adim)=>{ const D=[]; for(let t=bas_;t<=son_+1e-6;t+=adim){ const pts=N.filter(q=>Math.abs(eksenD.ek(q)-t)<adim*1.6&&secici(q,t)); D.push({t,pts}); } return D; };
  const profil=(D,merkezF,acıF,ekF)=>{ const R=[]; for(const d of D){ let cx=0,cy=0; if(d.pts.length){ for(const q of d.pts){ const m=merkezF(q); cx+=m[0]; cy+=m[1]; } cx/=d.pts.length; cy/=d.pts.length; }
      const r=new Float32Array(A).fill(-1), en=new Array(A).fill(null);
      for(const q of d.pts){ const m=merkezF(q); const a=Math.atan2(m[1]-cy,m[0]-cx); const k=((Math.round(a/(Math.PI*2)*A)%A)+A)%A; const L=Math.hypot(m[0]-cx,m[1]-cy); if(L>r[k]){ r[k]=L; en[k]=q; } }
      // boş açıları komşudan doldur
      for(let it=0;it<A;it++) for(let k=0;k<A;k++) if(r[k]<0){ const a1=r[(k+1)%A], a0=r[(k+A-1)%A]; if(a1>=0||a0>=0){ r[k]=Math.max(a1,a0); en[k]=en[(k+1)%A]||en[(k+A-1)%A]; } }
      R.push({cx,cy,r,en}); }
    // boş dilimler (o yükseklikte nokta yok): en yakın dolu dilimden kopyala
    const dolu=R.map(p=>p.r.some(v=>v>=0));
    for(let i=0;i<R.length;i++) if(!dolu[i]){ let j=-1; for(let d=1;d<R.length;d++){ if(i-d>=0&&dolu[i-d]){ j=i-d; break; } if(i+d<R.length&&dolu[i+d]){ j=i+d; break; } } if(j>=0){ R[i]={cx:R[j].cx,cy:R[j].cy,r:R[j].r.slice(),en:R[j].en.slice()}; } else R[i].r.fill(.12); }
    // 1) aykırı tek noktalar: açı komşularının ortancasının %25 üstüne kırp
    for(const p of R){ const r0=p.r.slice(); for(let k=0;k<A;k++){ const v=[]; for(let d=-3;d<=3;d++) v.push(r0[(k+d+A)%A]); v.sort((a,b)=>a-b); p.r[k]=Math.min(r0[k],v[3]*1.25+.005); } }
    // 2) genişlet (boşluk kalmasın): eksen boyunca ±2 dilim, açıda ±1 kutu en büyük
    const gen=R.map(p=>p.r.slice()); for(let i=0;i<R.length;i++) for(let k=0;k<A;k++){ let m=0; for(let d=-2;d<=2;d++){ const j=i+d; if(j<0||j>=R.length) continue; for(let e=-1;e<=1;e++) m=Math.max(m,gen[j][(k+e+A)%A]); } R[i].r[k]=m; }
    // 3) yumuşat: eksen boyunca ±2, açıda ±1 ortalama (testere dişi kalmaz)
    for(let tur=0;tur<2;tur++){ const c=R.map(p=>p.r.slice()); for(let i=0;i<R.length;i++) for(let k=0;k<A;k++){ let t=0,n=0; for(let d=-2;d<=2;d++){ const j=i+d; if(j<0||j>=R.length) continue; for(let e=-1;e<=1;e++){ t+=c[j][(k+e+A)%A]; n++; } } R[i].r[k]=t/n; } }
    // 4) parlak kumaşta şerit yansıması kalmasın: eksen boyunca ek yumuşatma, ama en çok 2 mm içeri (boşluk açılmaz)
    for(let tur=0;tur<2;tur++){ const c=R.map(p=>p.r.slice()); for(let i=0;i<R.length;i++) for(let k=0;k<A;k++){ let t=0,n=0; for(let d=-6;d<=6;d++){ const j=i+d; if(j<0||j>=R.length) continue; const w=7-Math.abs(d); t+=c[j][k]*w; n+=w; } R[i].r[k]=Math.max(t/n,c[i][k]-.008); } } // alttaki tişört kırışıkları ceket yüzeyine şerit olarak yansımaz (üst giysi zaten gizli)
    // merkezleri de eksen boyunca yumuşat
    { const cx=R.map(p=>p.cx), cy=R.map(p=>p.cy); for(let i=0;i<R.length;i++){ let a=0,b=0,n=0; for(let d=-3;d<=3;d++){ const j=i+d; if(j<0||j>=R.length) continue; a+=cx[j]; b+=cy[j]; n++; } R[i].cx=a/n; R[i].cy=b/n; } }
    return R; };
  // gövde: kol ağırlığı düşük noktalar + boynun iki yanındaki trapez (köprücüğe bağlı ama koldan değil): yaka ile omuz arasında açık kalmaz
  const govdeD=dilimle(q=>(q.kol<.35||(q.kolSaf<.25&&q.y>yakaY-.09&&Math.abs(q.x)<omuzX*.8))&&q.el<.05&&q.bas<.3&&Math.abs(q.x)<omuzX*1.05,{ek:q=>q.y},etek,yakaY,ADIM);
  const govdeR=profil(govdeD,q=>[q.x,q.z]);
  const pos=[], bind=[], kolA=[], si=[], sw=[], idx=[];
  const agirlik=(q)=>q?q.w:[[ad.indexOf("Spine2"),1],[0,0],[0,0],[0,0]];
  const halka=(merkez,eks1,eks2,R,kalinF,kolDeg,uF)=>{ const taban=pos.length/3; for(let k=0;k<=A;k++){ const kk=k%A; const a=kk/A*Math.PI*2; const c=Math.cos(a), s_=Math.sin(a);
      const r=R.r[kk]; const tx=merkez.x+(eks1.x*c+eks2.x*s_)*r, ty=merkez.y+(eks1.y*c+eks2.y*s_)*r, tz=merkez.z+(eks1.z*c+eks2.z*s_)*r;
      const d=kalinF(tx,ty,tz); const L=Math.max(r,1e-4);
      pos.push(tx+(eks1.x*c+eks2.x*s_)*d, ty+(eks1.y*c+eks2.y*s_)*d, tz+(eks1.z*c+eks2.z*s_)*d); bind.push(tx,ty,tz); kolA.push(kolDeg);
      const w=agirlik(R.en[kk]); for(let j=0;j<4;j++){ si.push(w[j]?Math.max(0,w[j][0]):0); sw.push(w[j]?w[j][1]:0); } } return taban; };
  const kalin=(u,etekMesafe)=>{ const p=ayar.kanal? .5-.5*Math.cos(Math.PI*2*u/ayar.kanal):1; return ayar.kalin+(ayar.sisme||0)*Math.pow(p,.6); };
  let onceki=-1;
  for(let i=0;i<govdeR.length;i++){ const R=govdeR[i], y=govdeD[i].t; const tb=halka(new THREE.Vector3(R.cx,y,R.cy),new THREE.Vector3(1,0,0),new THREE.Vector3(0,0,1),R,(x,y_,z)=>kalin(y_)*(.6+.4*ss(etek,etek+.05,y_))*(.75+.25*ss(yakaY,yakaY-.04,y_)),0);
    if(onceki>=0) for(let k=0;k<A;k++){ const a=onceki+k, b=onceki+k+1, c=tb+k, d=tb+k+1; idx.push(a,c,b, b,c,d); } onceki=tb; }
  for(const s_ of [-1,1]){ const D=dilimle(q=>q.kol>.3&&q.el<.3&&Math.sign(q.x)===s_,{ek:q=>Math.abs(q.x)},omuzX*.72,kolUc,ADIM);
    const R=profil(D,q=>[q.y,q.z]); onceki=-1;
    for(let i=0;i<R.length;i++){ const ax=D[i].t; const tb=halka(new THREE.Vector3(s_*ax,R[i].cx,R[i].cy),new THREE.Vector3(0,1,0),new THREE.Vector3(0,0,1),R[i],(x,y_,z)=>kalin(ax)*.85*(.62+.38*ss(kolUc,kolUc-.05,ax)),1);
      if(onceki>=0) for(let k=0;k<A;k++){ const a=onceki+k, b=onceki+k+1, c=tb+k, d=tb+k+1; if(s_>0) idx.push(a,b,c, b,d,c); else idx.push(a,c,b, b,c,d); } onceki=tb; } }
  const geo=new THREE.BufferGeometry(); geo.setAttribute("position",new THREE.Float32BufferAttribute(pos,3)); geo.setAttribute("aBind",new THREE.Float32BufferAttribute(bind,3)); geo.setAttribute("aKol",new THREE.Float32BufferAttribute(kolA,1));
  geo.setAttribute("skinIndex",new THREE.Uint16BufferAttribute(si,4)); geo.setAttribute("skinWeight",new THREE.Float32BufferAttribute(sw,4)); geo.setIndex(idx); geo.computeVertexNormals();
  const P=body.geometry.attributes.position;
  const mat=kabukMalzeme(ayar,{etek,omuzX,yakaY});
  const m=new THREE.SkinnedMesh(geo,mat); m.name="kabuk"; m.frustumCulled=false; m.castShadow=true; m.receiveShadow=true;
  body.parent.add(m); m.bind(sk,body.bindMatrix);
  // yaka (dik) ve kapüşon rulosu / atkı: boyun-göğüs kemiklerine bağlı
  const ekler=[]; const bi=nm=>ad.indexOf(nm);
  const parca=(geo2,mat2,agir)=>{ const c=geo2.attributes.position.count; const s4=new Uint16Array(c*4), w4=new Float32Array(c*4); for(let i=0;i<c;i++) agir.forEach(([nm,w],k)=>{ s4[i*4+k]=Math.max(0,bi(nm)); w4[i*4+k]=w; });
    geo2.setAttribute("skinIndex",new THREE.BufferAttribute(s4,4)); geo2.setAttribute("skinWeight",new THREE.BufferAttribute(w4,4)); const mm=new THREE.SkinnedMesh(geo2,mat2); mm.frustumCulled=false; mm.castShadow=true; body.parent.add(mm); mm.bind(sk,body.bindMatrix); ekler.push(mm); return mm; };
  const boyun=kemikP("Neck"), sp2=kemikP("Spine2")||boyun.clone().add(new THREE.Vector3(0,-.15,0));
  // boyun kesiti: yaka halkasının yarıçapı gövdeden ölçülür
  let rx=0, rz=0, zc=0, nz=0; const bn=N.filter(q=>Math.abs(q.y-yakaY-.02)<.015&&Math.abs(q.x)<omuzX*.55&&q.kol<.3); for(const q of bn){ rx=Math.max(rx,Math.abs(q.x)); zc+=q.z; nz++; } zc=nz?zc/nz:boyun.z;
  for(const q of bn) rz=Math.max(rz,Math.abs(q.z-zc));
  rx=Math.max(rx,.05); rz=Math.max(rz,.05);
  if(ayar.yaka){ const h=ayar.yaka, kat=ayar.kalin+(ayar.sisme||0)*.6+.006, RS=28, HS=4; const cg=new THREE.CylinderGeometry(1,1.015,h,RS,HS,true); cg.translate(0,h/2-.01,0);
    // dik yaka: her satırda vücut/boyun kesiti açıya göre ölçülür; yaka üstte boyna yaklaşır ama hiçbir satırda yüzeyin içine girmez
    const kesit=(y,cz)=>{ const r=new Float32Array(RS).fill(-1); for(const q of N){ if(Math.abs(q.y-y)>.011||q.kol>.2||q.el>.05||Math.abs(q.x)>.2) continue; const a=Math.atan2(q.x,q.z-cz); const k=((Math.round(a/(Math.PI*2)*RS)%RS)+RS)%RS; r[k]=Math.max(r[k],Math.hypot(q.x,q.z-cz)); }
      for(let it=0;it<RS;it++) for(let k=0;k<RS;k++) if(r[k]<0){ const a=r[(k+1)%RS], b=r[(k+RS-1)%RS]; if(a>=0||b>=0) r[k]=Math.max(a,b); } for(let k=0;k<RS;k++) if(r[k]<0) r[k]=.05; return r; };
    const yT=yakaY+h-.01, bt=N.filter(q=>Math.abs(q.y-yT)<.012&&q.kol<.2&&q.el<.05&&Math.abs(q.x)<.11); let zT=0; for(const q of bt) zT+=q.z; zT=bt.length?zT/bt.length:zc;
    const satir=[]; for(let r_=0;r_<=HS;r_++){ const t=r_/HS, y=yakaY-.01+h*t, cz=lerp(zc,zT,ss(0,1,t)); satir.push({t,cz,r:kesit(y,cz)}); }
    const p3=cg.attributes.position; for(let i=0;i<p3.count;i++){ const ux=p3.getX(i), y=p3.getY(i), uz=p3.getZ(i); const L=Math.hypot(ux,uz)||1, nx=ux/L, nz=uz/L;
      const r_=Math.min(HS,Math.max(0,Math.round((y+.01)/h*HS))), S=satir[r_], t=ss(0,1,S.t); const a=Math.atan2(nx,nz); const k=((Math.round(a/(Math.PI*2)*RS)%RS)+RS)%RS;
      const rTaban=1/Math.sqrt((nx*nx)/((rx+kat)*(rx+kat))+(nz*nz)/((rz+kat)*(rz+kat))); // tabandaki elips (gövdenin dışı)
      const rUst=satir[HS].r[k]+.016, rr=Math.max(lerp(rTaban,Math.min(rTaban,rUst),t),S.r[k]+.012);
      p3.setXYZ(i,nx*rr,yakaY+y,S.cz+nz*rr); }
    cg.computeVertexNormals(); const b=new Float32Array(p3.count*3); for(let i=0;i<p3.count;i++){ b[i*3]=p3.getX(i); b[i*3+1]=p3.getY(i); b[i*3+2]=p3.getZ(i); } cg.setAttribute("aBind",new THREE.BufferAttribute(b,3)); cg.setAttribute("aKol",new THREE.BufferAttribute(new Float32Array(p3.count),1));
    parca(cg,mat,[["Neck",.55],["Spine2",.45]]); }
  if(ayar.kapusonRulo){ const tg=new THREE.TorusGeometry(rx+.055,.052,12,24,Math.PI*1.1); tg.rotateX(Math.PI/2); tg.rotateY(-Math.PI*.05+Math.PI); tg.scale(1,.9,(rz+.065)/(rx+.055)); tg.translate(0,yakaY+.005,zc-.02);
    const p3=tg.attributes.position; const b=new Float32Array(p3.count*3); for(let i=0;i<p3.count;i++){ b[i*3]=p3.getX(i); b[i*3+1]=yakaY-1; b[i*3+2]=p3.getZ(i); } tg.setAttribute("aBind",new THREE.BufferAttribute(b,3)); tg.setAttribute("aKol",new THREE.BufferAttribute(new Float32Array(p3.count),1));
    parca(tg,mat,[["Spine2",.6],["Neck",.4]]); }
  if(ayar.atki){ const am=atkiMalzeme(ayar.atki); const kat=ayar.kalin+(ayar.sisme||0)*.6;
    // boyna iki tur sarılmış atkı: alttaki geniş ve yassı, üstteki daha ince (yastık gibi tek simit değil)
    const tur=(R,tup,yy,dz,sy)=>{ const tg=new THREE.TorusGeometry(R,tup,10,36); tg.rotateX(Math.PI/2); tg.scale(1,sy,(rz+kat+dz)/R); tg.translate(0,yy,zc+.006); tg.computeVertexNormals(); return tg; };
    parca(tur(rx+kat+.006,.011,yakaY+.016,.008,2.5),am,[["Spine2",.55],["Neck",.45]]);
    parca(tur(rx+.016,.0095,yakaY+.056,-.004,2.1),am,[["Neck",.75],["Spine2",.25]]);
    // önden sarkan iki uç: kalınlığı olan örgü şerit; göğüsten aşağı düz sarkar (göğüs altına girmez), uçta kısa püskül
    const onZ=(x0,y)=>{ let z=-1; for(const q of N){ if(Math.abs(q.y-y)<.014&&Math.abs(q.x-x0)<.03&&q.kol<.25&&q.el<.05&&q.z>z) z=q.z; } return z<0?.1:z; };
    const m2=am.clone(); m2.onBeforeCompile=am.onBeforeCompile; m2.customProgramCacheKey=()=>"atki2";
    for(const [x0,uz,egim] of [[.03,.29,.008],[-.034,.23,-.006]]){ const SY=12, W=.072, T=.009, pos2=[], idx2=[]; let zOnce=-1;
      const zH=[]; for(let r=0;r<=SY;r++){ const t=r/SY; zH.push(onZ(x0+egim*t,yakaY-.004-uz*t)); }
      for(let r=0;r<=SY;r++){ const t=r/SY, y=yakaY-.004-uz*t, xc=x0+egim*t; let zb_=-1; for(let d=-2;d<=2;d++){ const j=Math.min(SY,Math.max(0,r+d)); zb_=Math.max(zb_,zH[j]); }
        let z=zb_+ayar.kalin+(ayar.sisme||0)+.018; if(zOnce>0) z=Math.max(z,zOnce-.004); zOnce=z;
        const w=W*(1-.06*t)/2, dal=.0035*Math.sin(t*5.5+x0*90)*t, eg=.004*Math.sin(t*7.3+x0*60); // kumaş hafif dalgalı, kenarlar düz plaka gibi durmaz
        pos2.push(xc-w+dal,y,z+T+eg, xc+w+dal,y,z+T-eg, xc+w+dal,y,z-eg, xc-w+dal,y,z+eg); }
      for(let r=0;r<SY;r++) for(let k=0;k<4;k++){ const a=r*4+k, b=r*4+(k+1)%4, c=a+4, d=b+4; idx2.push(a,c,b, b,c,d); }
      { const sR=SY*4; idx2.push(sR,sR+2,sR+1, sR,sR+3,sR+2); } // alt kapak (aşağı bakar)
      const tb=pos2.length/3, yb=yakaY-.004-uz, xb=x0+egim, zb=pos2[SY*12+2]-T*.0+T*.5;
      for(let k=0;k<8;k++){ const fx=xb-W/2+.005+k*(W-.01)/7, L=.022+.006*Math.sin(k*1.9); pos2.push(fx-.0018,yb+.001,zb, fx+.0018,yb+.001,zb, fx+.0004,yb-L,zb+.001); idx2.push(tb+k*3,tb+k*3+2,tb+k*3+1); }
      const g2=new THREE.BufferGeometry(); g2.setAttribute("position",new THREE.Float32BufferAttribute(pos2,3)); g2.setIndex(idx2); g2.computeVertexNormals();
      parca(g2,m2,[["Spine2",.75],["Spine1",.25]]); }
  }
  return {m,ekler};
}
function kabukMalzeme(ayar,o){
  const m=new THREE.MeshStandardMaterial({color:renk(ayar.renk),roughness:ayar.puruz||.62,metalness:0,skinning:true,side:THREE.DoubleSide,envMapIntensity:ayar.parlak||.55});
  const kanal=(ayar.kanal||0).toFixed(4), sisme=ayar.kanal?1:0, deri=ayar.tur==="deri"?1:0, kot=ayar.tur==="kot"?1:0, acik=(ayar.acik||0).toFixed(4);
  m.onBeforeCompile=s=>{
    s.vertexShader="attribute vec3 aBind; attribute float aKol; varying vec3 vBind; varying float vKol;\n"+s.vertexShader.replace("#include <begin_vertex>","#include <begin_vertex>\n vBind=aBind; vKol=aKol;");
    s.fragmentShader="varying vec3 vBind; varying float vKol;\nfloat _h(vec3 p){ return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453); }\nfloat _n(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(mix(_h(i),_h(i+vec3(1,0,0)),f.x),mix(_h(i+vec3(0,1,0)),_h(i+vec3(1,1,0)),f.x),f.y),mix(mix(_h(i+vec3(0,0,1)),_h(i+vec3(1,0,1)),f.x),mix(_h(i+vec3(0,1,1)),_h(i+vec3(1,1,1)),f.x),f.y),f.z); }\n"+
      s.fragmentShader.replace("#include <color_fragment>",`#include <color_fragment>
      { vec3 b=vBind; float ax=abs(b.x); float g=1.0;
        if(${sisme}>0){ float u=mix(b.y,ax,step(.5,vKol))/${kanal}; float p=.5-.5*cos(6.2831*u); g*=mix(.58,1.04,pow(p,.42)); }
        if(${deri}>0){ float w=_n(b*vec3(42.,30.,42.))*.6+_n(b*140.)*.4; g*=.86+.22*w; float kr=smoothstep(.62,.7,_n(b*vec3(18.,80.,18.))); g*=1.0-kr*.18; }
        g*=.92+.08*_n(b*260.);
        if(${kot}>0){ float tw=sin((b.x+b.y)*1500.0)*.5+.5; g*=.9+.12*tw; g*=.9+.2*_n(b*vec3(30.,5.,30.)); g*=.96+.08*_n(b*vec3(4.,90.,4.));
          float yk=${(o.yakaY-.135).toFixed(3)}; if(abs(b.y-yk)<.0025&&vKol<.5) diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.78,.52,.26),.55);
          if(b.z>0.0&&vKol<.5){ float cx=abs(ax-.095), cy=b.y-(yk-.075); if((abs(cx-.042)<.0022&&cy>0.0&&cy<.07)||(abs(cy-.07)<.0022&&cx<.042)||(abs(cy)<.0022&&cx<.042)) diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.78,.52,.26),.5); }
          if(vKol>.5){ float bil=abs(ax-${(o.omuzX+.36).toFixed(3)}); }
        }
        if(${acik}>0.0 && b.z>0.0 && vKol<.5){ float ac=${acik}*(.8+.35*smoothstep(${(o.yakaY-.18).toFixed(3)},${o.yakaY.toFixed(3)},b.y)); if(ax<ac) discard; if(ax<ac+.007) g*=.72; }
        // fermuar (ön orta), dikiş çizgisi ve yan cepler
        if(${acik}==0.0 && b.z>0.0 && vKol<.5 && b.y>${o.etek.toFixed(3)} ){ float f=abs(b.x); if(f<.0055){ g*=.45; } else if(f<.008){ g*=.8; }
          float cy=${(o.etek+.11).toFixed(3)}; float cep=abs((ax-.105)-(b.y-cy)*.35); if(cep<.0035&&abs(b.y-cy)<.065) g*=.55; }
        diffuseColor.rgb*=g; }`);
  };
  m.customProgramCacheKey=()=>"kabuk"+kanal+deri+kot+acik+o.etek.toFixed(3); m.userData.kalici=true; return m;
}
function atkiMalzeme(renkH){
  const m=new THREE.MeshStandardMaterial({color:renk(renkH),roughness:.95,metalness:0,skinning:true});
  m.onBeforeCompile=s=>{ s.vertexShader="varying vec3 vP;\n"+s.vertexShader.replace("#include <begin_vertex>","#include <begin_vertex>\n vP=position;");
    s.fragmentShader="varying vec3 vP;\n"+s.fragmentShader.replace("#include <color_fragment>",`#include <color_fragment>
      { float k=sin(vP.y*900.0+sin(vP.x*300.0)*2.0)*.5+.5; float r=sin(atan(vP.z,vP.x)*90.0)*.5+.5; diffuseColor.rgb*=.8+.2*k*r; }`); };
  m.customProgramCacheKey=()=>"atki"; m.userData.kalici=true; return m;
}
// İlk buluşma (29 Ocak 2022): Kardelen haki şişme mont + krem atkı, Kaan kahverengi deri ceket
const KABUK_PLAN={
  kardelen_kis:{tur:"sisme",renk:"#5d5f3e",kalin:.022,sisme:.016,kanal:.085,yaka:.085,kapusonRulo:true,atki:"#e6dccb",puruz:.55,parlak:.7},
  kaan_kis:{tur:"deri",renk:"#2f2119",kalin:.014,yaka:.07,puruz:.5,parlak:.62,etekPay:.02},
  // balo: elbisenin üstüne kısa kot ceket (önü açık), "üşürsün" diye ısrar ettiğim
  kardelen_kot:{tur:"kot",renk:"#7d9cc4",kalin:.013,yaka:.055,puruz:.88,parlak:.35,etekPay:.1,acik:.072}
};
/* etek kabuğu: belden diz üstüne, iki bacağı birlikte saran, aşağı doğru açılan; üstte kalçaya, aşağıda bacaklara bağlı (yürürken bacakla salınır) */
function etekKabuk(model,ayar){
  let body=null; const kay=[]; model.traverse(o=>{ if(!o.isSkinnedMesh||!o.material) return; const n=o.material.name; if(n==="AvatarBody") body=o; if(n==="outfit") kay.push(o); });
  if(!body||!kay.length) return null;
  const sk=body.skeleton, ad=sk.bones.map(b=>b.name.replace(/^mixamorig/,"")), bi=n=>Math.max(0,ad.indexOf(n));
  const ust=ayar.ust||1.02, alt=ayar.alt||.63, A=44, ADIM=.011;
  const N=[]; for(const o of kay){ const P=o.geometry.attributes.position; for(let i=0;i<P.count;i++){ const y=P.getY(i), x=P.getX(i); if(y<alt-.05||y>ust+.05||Math.abs(x)>.3) continue; N.push([x,y,P.getZ(i)]); } }
  const D=[]; for(let y=ust;y>=alt-1e-6;y-=ADIM){ const pts=N.filter(q=>Math.abs(q[1]-y)<ADIM*1.6); let cx=0,cz=0; for(const q of pts){ cx+=q[0]; cz+=q[2]; } if(pts.length){ cx/=pts.length; cz/=pts.length; }
    const r=new Float32Array(A).fill(-1); for(const q of pts){ const a=Math.atan2(q[2]-cz,q[0]-cx); const k=((Math.round(a/(Math.PI*2)*A)%A)+A)%A; r[k]=Math.max(r[k],Math.hypot(q[0]-cx,q[2]-cz)); } D.push({y,cx,cz,r}); }
  for(const d of D){ for(let it=0;it<A;it++) for(let k=0;k<A;k++) if(d.r[k]<0){ const a=d.r[(k+1)%A], b=d.r[(k+A-1)%A]; if(a>=0||b>=0) d.r[k]=Math.max(a,b); }
    for(let k=0;k<A;k++) if(d.r[k]<0) d.r[k]=.15;
    for(let it=0;it<8;it++) for(let k=0;k<A;k++){ const m=.5*(d.r[(k+3)%A]+d.r[(k+A-3)%A]); if(m>d.r[k]) d.r[k]=m; } } // bacak arası köprülenir (içbükeylik kalmaz)
  for(let tur=0;tur<3;tur++){ const c=D.map(d=>d.r.slice()); for(let i=0;i<D.length;i++) for(let k=0;k<A;k++){ let t=0,n=0; for(let dd=-2;dd<=2;dd++){ const j=i+dd; if(j<0||j>=D.length) continue; for(let e=-1;e<=1;e++){ t+=c[j][(k+e+A)%A]; n++; } } D[i].r[k]=t/n; } }
  { const cx=D.map(d=>d.cx), cz=D.map(d=>d.cz); for(let i=0;i<D.length;i++){ let a=0,b=0,n=0; for(let dd=-3;dd<=3;dd++){ const j=i+dd; if(j<0||j>=D.length) continue; a+=cx[j]; b+=cz[j]; n++; } D[i].cx=a/n; D[i].cz=b/n; } }
  for(let i=1;i<D.length;i++) for(let k=0;k<A;k++) D[i].r[k]=Math.max(D[i].r[k],D[i-1].r[k]*.992); // kumaş aşağı sarkar, içeri girmez
  const pos=[], uv=[], si=[], sw=[], idx=[]; const H=bi("Hips"), SP=bi("Spine"), LL=bi("LeftUpLeg"), RL=bi("RightUpLeg");
  for(let i=0;i<D.length;i++){ const d=D[i], t=(ust-d.y)/(ust-alt), ek=(ayar.kalin||.012)+(ayar.acilim||.06)*Math.pow(t,1.5);
    for(let k=0;k<=A;k++){ const kk=k%A, a=kk/A*Math.PI*2, r=d.r[kk]+ek; const x=d.cx+Math.cos(a)*r, z=d.cz+Math.sin(a)*r; pos.push(x,d.y,z); uv.push(k/A,t);
      const bac=Math.min(.7,Math.max(0,t-.12)*.95), yan=Math.min(1,Math.max(0,.5+x/.17)), ust_=t<.12?(.12-t)/.12*.5:0;
      const w=[[SP,ust_],[H,(1-bac)*(1-ust_)],[LL,bac*yan],[RL,bac*(1-yan)]]; const s=w.reduce((q,e)=>q+e[1],0)||1; for(const [j,v] of w){ si.push(j); sw.push(v/s); } } }
  for(let i=0;i<D.length-1;i++) for(let k=0;k<A;k++){ const a=i*(A+1)+k, b=a+1, c=a+A+1, e=c+1; idx.push(a,b,c, b,e,c); }
  const geo=new THREE.BufferGeometry(); geo.setAttribute("position",new THREE.Float32BufferAttribute(pos,3)); geo.setAttribute("aEtek",new THREE.Float32BufferAttribute(uv,2));
  geo.setAttribute("skinIndex",new THREE.Uint16BufferAttribute(si,4)); geo.setAttribute("skinWeight",new THREE.Float32BufferAttribute(sw,4)); geo.setIndex(idx); geo.computeVertexNormals();
  const m=new THREE.MeshStandardMaterial({color:renk(ayar.renk||"#f2a7bf"),roughness:ayar.puruz||.55,metalness:0,skinning:true,side:THREE.DoubleSide,envMapIntensity:.6});
  m.onBeforeCompile=s=>{ s.vertexShader="attribute vec2 aEtek; varying vec2 vEtek;\n"+s.vertexShader.replace("#include <begin_vertex>","#include <begin_vertex>\n vEtek=aEtek;");
    s.fragmentShader="varying vec2 vEtek;\n"+s.fragmentShader.replace("#include <color_fragment>",`#include <color_fragment>
      { float pl=sin(vEtek.x*6.2831*13.0+sin(vEtek.x*40.0)*.4)*.5+.5; float k=smoothstep(.05,.95,vEtek.y); diffuseColor.rgb*=mix(1.0,.84+.18*pl,k); diffuseColor.rgb*=.96+.04*sin(vEtek.y*90.0);
        if(vEtek.y>.965) diffuseColor.rgb*=.86; }`); };
  m.customProgramCacheKey=()=>"etek"; m.userData.kalici=true;
  const mesh=new THREE.SkinnedMesh(geo,m); mesh.name="etek"; mesh.frustumCulled=false; mesh.castShadow=true; mesh.receiveShadow=true; body.parent.add(mesh); mesh.bind(sk,body.bindMatrix);
  return mesh;
}
