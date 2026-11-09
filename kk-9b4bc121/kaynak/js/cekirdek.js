<script src="__THREE__"></script>
__EKLIB__
<script>
(function(){
"use strict";
const UI=document.getElementById("ui"), PERDE=document.getElementById("perde");
const MODEL_KOK=(window.__MODEL_KOK__||"model/");
const SES_KOK=(window.__SES_KOK__||"ses/");
const SESSIZ_WAV="data:audio/wav;base64,UklGRuQSAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YcASAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIA=";
const SU_NORMAL="data:image/jpeg;base64,__SUNORMAL__";
const BASLANGIC=new Date(2021,7,2);
const kayit={bitti:{}, ses:true};
try{ Object.assign(kayit, JSON.parse(localStorage.getItem("kk3d")||"{}")); }catch(e){}
const kaydet=()=>{ try{ localStorage.setItem("kk3d",JSON.stringify(kayit)); }catch(e){} };
const el=h=>{ const t=document.createElement("template"); t.innerHTML=h.trim(); return t.content.firstElementChild; };
let NESIL=0;
let ZAMAN_OLCEK=1; // ağır çekim anları için
const bekle=ms=>{ const n=NESIL; return new Promise(r=>setTimeout(()=>{ if(n===NESIL) r(); },ms/(window.__hiz||1))); }; // __hiz: yalnız otomatik testlerde
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const rnd=(a,b)=>a+Math.random()*(b-a);

if(!window.THREE){ UI.appendChild(el(`<div class="tam"><p class="yukleniyor">3D motoru yüklenemedi. İnternet bağlantını kontrol edip sayfayı yenile.</p></div>`)); PERDE.classList.remove("kapali"); return; }

/* ================= RENDERER ================= */
const canvas=document.getElementById("gl");
let renderer;
// kenar yumuşatma efekt zincirinin çok örneklemeli hedefinde yapılır; tuvalin kendi çok örneklemeli tamponu boşuna bellek ve bant genişliği harcıyordu
try{ renderer=new THREE.WebGLRenderer({canvas,antialias:!(window.WebGL2RenderingContext&&THREE.WebGLMultisampleRenderTarget&&THREE.EffectComposer),powerPreference:"high-performance"}); }
catch(e){ UI.appendChild(el(`<div class="tam"><p class="yukleniyor">Bu cihaz 3D grafiği açamadı.</p></div>`)); PERDE.classList.remove("kapali"); return; }
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.6));
renderer.outputEncoding=THREE.sRGBEncoding;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.05;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.debug.checkShaderErrors=false; // her yeni programda eşzamanlı derleme sorgusu sahne açılışlarını uzatıyordu
// su yüzeyinin yansıma hedefi kurucunun içinde yerel: sahne bırakılırken serbest kalsın diye yakalanır
if(THREE.Water&&!THREE.Water.__sarili){ const Asil=THREE.Water, RT=THREE.WebGLRenderTarget;
  const Su=function(g,o){ let rt=null; THREE.WebGLRenderTarget=function(a,b,c){ rt=new RT(a,b,c); return rt; }; let w; try{ w=new Asil(g,o); } finally{ THREE.WebGLRenderTarget=RT; } if(w) w.userData.rt=rt; return w; };
  Su.__sarili=true; THREE.Water=Su; }
const camera=new THREE.PerspectiveCamera(50,1,0.1,2000);
// iPhone'da ana ekrandan açılınca (siyah-saydam durum çubuğu) görünüm alanı durum çubuğu kadar kısa gelebiliyor; altta boş şerit kalmasın diye tam ekran yüksekliği kullanılır
function ekranYuksekligi(){ let h=innerHeight; try{ if(/iPhone|iPod/.test(navigator.userAgent)&&(navigator.standalone===true||matchMedia("(display-mode: standalone)").matches)){
    const dikey=innerHeight>=innerWidth, sh=dikey?Math.max(screen.width,screen.height):Math.min(screen.width,screen.height); if(sh>h&&sh-h<140) h=sh; } }catch(e){} return h; }
function boyut(){ const w=innerWidth,h=ekranYuksekligi(); document.documentElement.style.setProperty("--tamH",h+"px"); renderer.setSize(w,h,false); camera.aspect=w/h; camera.fov = w<h? 62 : 48; camera.updateProjectionMatrix(); }
addEventListener("resize",boyut); boyut();
let composer=null, bloom=null;
let sonPass=null;
function efektKur(){
  if(!THREE.EffectComposer||!THREE.UnrealBloomPass) return;
  try{
    const w=innerWidth, h=ekranYuksekligi(), pr=renderer.getPixelRatio();
    const ops={type:THREE.HalfFloatType,format:THREE.RGBAFormat};
    const rt=(renderer.capabilities.isWebGL2&&THREE.WebGLMultisampleRenderTarget)? new THREE.WebGLMultisampleRenderTarget(w*pr,h*pr,ops) : new THREE.WebGLRenderTarget(w*pr,h*pr,ops);
    composer=new THREE.EffectComposer(renderer,rt);
    // hazır hedefle kurulunca birleştirici piksel oranını 1 sanıyordu: ilk boyut değişiminde (iPhone'da açılışta, döndürünce) görüntü ekran
    // çözünürlüğünün yarısından da düşüğe iniyor, bulanıklaşıyordu. Boyut CSS pikseli, oran ayrı tutulur.
    composer._pixelRatio=pr; composer._width=w; composer._height=h;
    composer.addPass(new THREE.RenderPass(scene||new THREE.Scene(),camera));
    bloom=new THREE.UnrealBloomPass(new THREE.Vector2(w/2,h/2),.55,.55,.86); composer.addPass(bloom);
    // son geçiş: ACES ton eşleme + keskinleştirme + renk derecelendirme (hafif doygunluk, yumuşak S eğrisi, serin gölge / sıcak ışık) + vinyet + ince gren
    const son=new THREE.ShaderPass({uniforms:{tDiffuse:{value:null},pozlama:{value:1.05},zaman:{value:0},keskin:{value:.28},piksel:{value:new THREE.Vector2(1/(w*pr),1/(h*pr))}},
      vertexShader:"varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",
      fragmentShader:`uniform sampler2D tDiffuse; uniform float pozlama,zaman,keskin; uniform vec2 piksel; varying vec2 vUv;
        vec3 aces(vec3 x){ x*=pozlama*0.6; return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14),0.0,1.0); }
        float h12(vec2 p){ vec3 q=fract(vec3(p.xyx)*.1031); q+=dot(q,q.yzx+33.33); return fract((q.x+q.y)*q.z); }
        void main(){ vec3 c=texture2D(tDiffuse,vUv).rgb;
          vec3 o=(texture2D(tDiffuse,vUv+vec2(piksel.x,0.0)).rgb+texture2D(tDiffuse,vUv-vec2(piksel.x,0.0)).rgb+texture2D(tDiffuse,vUv+vec2(0.0,piksel.y)).rgb+texture2D(tDiffuse,vUv-vec2(0.0,piksel.y)).rgb)*0.25;
          c=max(c+(c-o)*keskin,0.0);
          vec3 m=pow(aces(c),vec3(1.0/2.2));
          float l=dot(m,vec3(0.2126,0.7152,0.0722));
          m=mix(vec3(l),m,1.07); m=mix(m,m*m*(3.0-2.0*m),0.14);
          m+=vec3(0.010,0.003,-0.010)*smoothstep(0.5,1.0,l)+vec3(-0.006,0.0,0.010)*(1.0-smoothstep(0.0,0.4,l));
          float v=smoothstep(1.15,.35,length(vUv-.5)*1.25); m*=mix(.84,1.0,v);
          m+=(h12(gl_FragCoord.xy+fract(zaman*13.7)*vec2(97.0,57.0))-0.5)*0.014;
          gl_FragColor=vec4(clamp(m,0.0,1.0),1.0); }`});
    composer.addPass(son); sonPass=son;
    renderer.toneMapping=THREE.NoToneMapping;
    addEventListener("resize",()=>{ composer.setSize(innerWidth,ekranYuksekligi()); pikselGuncelle(); });
  }catch(e){ composer=null; sonPass=null; renderer.toneMapping=THREE.ACESFilmicToneMapping; }
}
function pikselGuncelle(){ if(!sonPass) return; const pr=renderer.getPixelRatio(); sonPass.uniforms.piksel.value.set(1/(innerWidth*pr),1/(ekranYuksekligi()*pr)); }
/* uyarlamalı çözünürlük: kareler akıcıysa piksel oranı adım adım artar (en çok 2: daha keskin görüntü), kare kaçırmaya başlarsa eski değerine (1,6) döner.
   (1,6'nın altına inmez: düşük güç modunda iPhone kareleri zaten 30'a sabitliyor, çözünürlüğü düşürmek bir şey kazandırmaz)
   Düşürülen bir orana o oturumda bir daha çıkılmaz (sürekli inip çıkıp takılmasın); sahne yüklenirken ve geçişten hemen sonra ölçülmez. */
const CZ={pr:renderer.getPixelRatio(),n:0,top:0,bekle:3,tavan:Math.min(2,Math.max(1,devicePixelRatio||1)),taban:renderer.getPixelRatio()};
function cozunurlukAyarla(ham){
  if(YUKLENIYOR||document.hidden||!(ham>0)||ham>.2){ CZ.n=0; CZ.top=0; if(YUKLENIYOR) CZ.bekle=Math.max(CZ.bekle,2); return; }
  CZ.top+=ham; if(++CZ.n<90) return; const ort=CZ.top/CZ.n; CZ.n=0; CZ.top=0;
  if(CZ.bekle>0){ CZ.bekle--; return; }
  let yeni=CZ.pr;
  if(ort>1/48&&CZ.pr>CZ.taban+.01){ yeni=Math.max(CZ.taban,CZ.pr-.25); CZ.tavan=Math.min(CZ.tavan,CZ.pr-.05); }
  else if(ort<1/57.5&&CZ.pr<CZ.tavan-.01) yeni=Math.min(CZ.tavan,CZ.pr+.2);
  if(Math.abs(yeni-CZ.pr)<.01) return;
  CZ.pr=yeni; renderer.setPixelRatio(yeni); boyut(); if(composer) composer.setPixelRatio(yeni); pikselGuncelle(); CZ.bekle=1; }
efektKur();

const renk=h=>new THREE.Color(h).convertSRGBToLinear();
const mat=(h,o={})=>new THREE.MeshStandardMaterial(Object.assign({color:renk(h),roughness:.8,metalness:0},o));

/* ================= SES / MÜZİK ================= */
const Ses={
  ac:null, ana:null, calisiyor:false, akorZaman:0, akorNo:0, notaZaman:0, notaNo:0, deniz:null, ruzgar:null, ton:"sicak",
  baslat(){
    // iPhone sessiz modda da çalsın: ses oturumunu "oynatma" kipine al (iOS 17+ API; eskiler için sessiz <audio> hilesi)
    try{ if(navigator.audioSession&&navigator.audioSession.type!=="playback") navigator.audioSession.type="playback"; }catch(e){}
    try{ if(!this._kilit){ const a=document.createElement("audio"); a.setAttribute("x-webkit-airplay","deny"); a.setAttribute("playsinline",""); a.preload="auto"; a.loop=true; a.src=SESSIZ_WAV; this._kilit=a; }
      if(this._kilit.paused&&document.visibilityState==="visible") this._kilit.play().catch(()=>{}); }catch(e){}
    if(this.ac) { if(this.ac.state!=="running") this.ac.resume(); return; }
    try{
      const A=this.ac=new (window.AudioContext||window.webkitAudioContext)();
      this.ana=A.createGain(); this.ana.gain.value=.6; this.ana.connect(A.destination);
      // yankı
      const uz=A.sampleRate*2.6, buf=A.createBuffer(2,uz,A.sampleRate);
      for(let c=0;c<2;c++){ const d=buf.getChannelData(c); for(let i=0;i<uz;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/uz,2.4); }
      this.yanki=A.createConvolver(); this.yanki.buffer=buf; const yg=A.createGain(); yg.gain.value=.55; this.yanki.connect(yg); yg.connect(this.ana);
      this.kuru=A.createGain(); this.kuru.gain.value=.6; this.kuru.connect(this.ana);
      // müzik ayrı kanalda: ♪ düğmesi yalnız müziği kapatır; efektler ve tezahürat her zaman duyulur
      this.muzik=A.createGain(); this.muzik.gain.value=kayit.ses?1:0; this.mKuru=A.createGain(); this.mYanki=A.createGain();
      this.mKuru.connect(this.muzik); this.mYanki.connect(this.muzikY=A.createGain()); this.muzik.connect(this.kuru); this.muzikY.connect(this.yanki); this.muzikY.gain.value=kayit.ses?1:0;
      this.calisiyor=true;
      if(this._ortamBekle){ const [t,h]=this._ortamBekle; this._ortamBekle=null; this.ortam(t,h); }
    }catch(e){}
  },
  tampon:{},
  async yukle(ad){ if(this.tampon[ad]) return this.tampon[ad]; if(!this.ac) return null;
    try{ const r=await fetch(SES_KOK+ad); if(!r.ok) return null; const b=await r.arrayBuffer(); const d=await new Promise((ok,no)=>this.ac.decodeAudioData(b,ok,no)); this.tampon[ad]=d; return d; }catch(e){ console.warn("ses",ad,e); return null; } },
  async cal(ad,kazanc=1){ const d=await this.yukle(ad); if(!d||!this.ac) return null; const s=this.ac.createBufferSource(); s.buffer=d; const g=this.ac.createGain(); g.gain.value=kazanc; s.connect(g); g.connect(this.ana); s.start(); return s; },
  kis(acik){ if(!this.ac) return; const t=this.ac.currentTime; this.mKuru.gain.setTargetAtTime(acik?.12:1,t,.35); this.mYanki.gain.setTargetAtTime(acik?.12:1,t,.35); },
  sesAc(acik){ kayit.ses=acik; kaydet(); if(this.muzik){ this.muzik.gain.setTargetAtTime(acik?1:0,this.ac.currentTime,.3); this.muzikY.gain.setTargetAtTime(acik?1:0,this.ac.currentTime,.3); } },
  nota(f,zaman,sure,hacim,tip="sine",yankiOran=1){
    const A=this.ac; const o=A.createOscillator(), g=A.createGain(), o2=A.createOscillator();
    o.type=tip; o.frequency.value=f; o2.type="sine"; o2.frequency.value=f*2.001;
    const g2=A.createGain(); g2.gain.value=.18; o2.connect(g2); g2.connect(g);
    const hk=this._efektte?this.kuru:this.mKuru, hy=this._efektte?this.yanki:this.mYanki;
    o.connect(g); g.connect(hk); if(yankiOran>0){ const y=A.createGain(); y.gain.value=yankiOran; g.connect(y); y.connect(hy); }
    g.gain.setValueAtTime(0,zaman); g.gain.linearRampToValueAtTime(hacim,zaman+.015); g.gain.exponentialRampToValueAtTime(.0001,zaman+sure);
    o.start(zaman); o2.start(zaman); o.stop(zaman+sure+.05); o2.stop(zaman+sure+.05);
  },
  // keman sesi: testere dalga + vibrato + gövde rezonansı (bant geçiren) + yay hışırtısı; gicir>0 ise acemi gıcırtısı
  keman(f,sure=.8,hacim=.16,gicir=0){
    if(!this.ac) return; const A=this.ac, t=A.currentTime+.01;
    const o=A.createOscillator(); o.type="sawtooth"; o.frequency.value=f;
    const lfo=A.createOscillator(), lg=A.createGain(); lfo.frequency.value=5.6; lg.gain.setValueAtTime(0,t); lg.gain.linearRampToValueAtTime(f*.006,t+Math.min(.5,sure*.6)); lfo.connect(lg); lg.connect(o.frequency);
    const g=A.createGain(); const b1=A.createBiquadFilter(), b2=A.createBiquadFilter(), lp=A.createBiquadFilter();
    b1.type="peaking"; b1.frequency.value=480; b1.Q.value=1.2; b1.gain.value=7; b2.type="peaking"; b2.frequency.value=2800; b2.Q.value=1.4; b2.gain.value=5;
    lp.type="lowpass"; lp.frequency.value=gicir?7000:4200; o.connect(b1); b1.connect(b2); b2.connect(lp); lp.connect(g);
    // yay sürtünmesi: süzülmüş gürültü
    const uz=Math.floor(A.sampleRate*(sure+.3)), nb=A.createBuffer(1,uz,A.sampleRate), d=nb.getChannelData(0); for(let i=0;i<uz;i++) d[i]=Math.random()*2-1;
    const n=A.createBufferSource(); n.buffer=nb; const nf=A.createBiquadFilter(); nf.type="bandpass"; nf.frequency.value=gicir?3800:f*2.5; nf.Q.value=gicir?6:2.5; const ng=A.createGain(); ng.gain.value=gicir?.5:.08; n.connect(nf); nf.connect(ng); ng.connect(g);
    if(gicir){ const o2=A.createOscillator(); o2.type="square"; o2.frequency.value=f*3.02; const g2=A.createGain(); g2.gain.value=.12*gicir; o2.connect(g2); g2.connect(lp); o2.start(t); o2.stop(t+sure+.3); o2.frequency.setValueAtTime(f*3.02,t); o2.frequency.linearRampToValueAtTime(f*3.4,t+sure); }
    g.connect(this.kuru); const y=A.createGain(); y.gain.value=.7; g.connect(y); y.connect(this.yanki);
    g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(hacim,t+.09); g.gain.setValueAtTime(hacim,t+Math.max(.1,sure-.12)); g.gain.exponentialRampToValueAtTime(.0001,t+sure+.25);
    o.start(t); lfo.start(t); n.start(t); o.stop(t+sure+.3); lfo.stop(t+sure+.3); n.stop(t+sure+.3);
  },
  ped(frekanslar,zaman,sure){
    const A=this.ac;
    for(const f of frekanslar){ const o=A.createOscillator(), g=A.createGain(), fl=A.createBiquadFilter();
      o.type="triangle"; o.frequency.value=f; o.detune.value=rnd(-6,6); fl.type="lowpass"; fl.frequency.value=900;
      o.connect(fl); fl.connect(g); g.connect(this.mYanki); g.connect(this.mKuru);
      g.gain.setValueAtTime(0,zaman); g.gain.linearRampToValueAtTime(.022,zaman+1.4); g.gain.linearRampToValueAtTime(.0001,zaman+sure);
      o.start(zaman); o.stop(zaman+sure+.1); }
  },
  // akorlar: Fmaj7 Em7 Dm7 Cmaj7 / gece: Am F C G
  AKOR:{
    sicak:[[174.6,220,261.6,329.6],[164.8,196,246.9,293.7],[146.8,174.6,220,261.6],[130.8,164.8,196,246.9]],
    gece:[[110,220,261.6,329.6],[87.3,174.6,220,261.6],[130.8,196,261.6,329.6],[98,196,246.9,293.7]]
  },
  guncelle(){
    if(!this.calisiyor) return;
    const A=this.ac, n=A.currentTime, ak=this.AKOR[this.ton];
    const akorSure=4.8;
    if(n>=this.akorZaman-.1){
      const t=Math.max(n,this.akorZaman); const a=ak[this.akorNo%ak.length];
      this.ped(a.map(f=>f/2),t,akorSure+1);
      this.nota(a[0]/2,t,3.5,.12,"sine",.6);
      this.akorZaman=t+akorSure; this.akorNo++; this.notaZaman=t; this.notaNo=0; this.suanki=a;
    }
    const aralik=akorSure/8;
    while(this.suanki && this.notaZaman<n+.2 && this.notaNo<8){
      const desen=[0,1,2,3,2,1,3,2]; const f=this.suanki[desen[this.notaNo]]*2*(this.notaNo===3?2:1);
      if(Math.random()>.12) this.nota(f,this.notaZaman+rnd(0,.02),2.2,.05+Math.random()*.025,"sine",1);
      this.notaZaman+=aralik; this.notaNo++;
    }
  },
  denizBaslat(){
    if(!this.ac||this.deniz) return;
    const A=this.ac, uz=A.sampleRate*2, buf=A.createBuffer(1,uz,A.sampleRate), d=buf.getChannelData(0);
    let son=0; for(let i=0;i<uz;i++){ son=(son+.02*(Math.random()*2-1))/1.02; d[i]=son*3.5; }
    const s=A.createBufferSource(); s.buffer=buf; s.loop=true; const f=A.createBiquadFilter(); f.type="lowpass"; f.frequency.value=600;
    const g=A.createGain(); g.gain.value=0; const lfo=A.createOscillator(), lg=A.createGain(); lfo.frequency.value=.12; lg.gain.value=.18; lfo.connect(lg); lg.connect(g.gain);
    s.connect(f); f.connect(g); g.connect(this.ana); s.start(); lfo.start(); g.gain.setTargetAtTime(.22,A.currentTime,2);
    this.deniz={s,g,lfo};
  },
  denizDurdur(){ if(this.deniz){ const d=this.deniz; d.g.gain.setTargetAtTime(0,this.ac.currentTime,.8); setTimeout(()=>{ try{d.s.stop();d.lfo.stop();}catch(e){} },3000); this.deniz=null; } },
  // ortam sesi (efekt kanalında, ♪ düğmesinden bağımsız): "kalabalik" uğultu, "kus" hafif rüzgâr ve ara ara cıvıltı, "sehir" uzak trafik.
  // sahneKur her yeni sahnede susturur; ses bağlamı daha açılmadıysa ilk dokunuşta başlar.
  ortam(tur,hacim=1){
    if(!this.ac){ this._ortamBekle=[tur,hacim]; return; }
    this.ortamDur(); const A=this.ac;
    if(!this._gurB){ const uz=A.sampleRate*3, b=A.createBuffer(1,uz,A.sampleRate), d=b.getChannelData(0); for(let i=0;i<uz;i++) d[i]=Math.random()*2-1; this._gurB=b; }
    const cikis=A.createGain(); cikis.gain.value=0; cikis.connect(this.kuru); const yk=A.createGain(); yk.gain.value=.3; cikis.connect(yk); yk.connect(this.yanki);
    const O={tur,cikis,dugum:[],zaman:null}; const gur=(hiz=1)=>{ const s=A.createBufferSource(); s.buffer=this._gurB; s.loop=true; s.playbackRate.value=hiz; O.dugum.push(s); return s; };
    if(tur==="kalabalik"){ // konuşma bantları, her biri kendi hızında dalgalanır: uzaktan gelen uğultu
      for(const [f,q,g] of [[300,1.1,.5],[620,1.3,.42],[1100,1.5,.3],[2200,2,.12]]){ const s=gur(rnd(.92,1.08)); s.__ofs=rnd(0,2.5); const bp=A.createBiquadFilter(); bp.type="bandpass"; bp.frequency.value=f; bp.Q.value=q; const gg=A.createGain(); gg.gain.value=g*.55;
        const lfo=A.createOscillator(), lg=A.createGain(); lfo.frequency.value=rnd(1.8,4.5); lg.gain.value=g*.4; lfo.connect(lg); lg.connect(gg.gain);
        s.connect(bp); bp.connect(gg); gg.connect(cikis); s.start(0,s.__ofs); lfo.start(); O.dugum.push(lfo); }
      cikis.gain.setTargetAtTime(.3*hacim,A.currentTime,1.2); }
    else if(tur==="kus"){
      const s=gur(.8); const lp=A.createBiquadFilter(); lp.type="lowpass"; lp.frequency.value=380; const gg=A.createGain(); gg.gain.value=.35; s.connect(lp); lp.connect(gg); gg.connect(cikis); s.start();
      cikis.gain.setTargetAtTime(.32*hacim,A.currentTime,1.5);
      const civ=()=>{ if(this._ortam!==O||!this.ac) return; const n=A.currentTime+.05; const f0=rnd(2500,4300), k=Math.floor(rnd(2,6)), ar=rnd(.08,.15);
        for(let i=0;i<k;i++){ const t=n+i*ar; const o=A.createOscillator(), g=A.createGain(); o.type="sine"; o.frequency.setValueAtTime(f0*rnd(.92,1.08),t); o.frequency.exponentialRampToValueAtTime(f0*rnd(1.15,1.45),t+.06);
          g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(.022*hacim,t+.012); g.gain.exponentialRampToValueAtTime(.0001,t+.09); o.connect(g); g.connect(this.kuru); o.start(t); o.stop(t+.11); }
        O.zaman=setTimeout(civ,rnd(1800,5500)); };
      O.zaman=setTimeout(civ,900); }
    else if(tur==="sehir"){
      const s=gur(.55); const lp=A.createBiquadFilter(); lp.type="lowpass"; lp.frequency.value=240; const mod=A.createGain(); mod.gain.value=.75; s.connect(lp); lp.connect(mod); mod.connect(cikis); s.start(0,rnd(0,2));
      const lfo=A.createOscillator(), lg=A.createGain(); lfo.frequency.value=.06; lg.gain.value=.25; lfo.connect(lg); lg.connect(mod.gain); lfo.start(); O.dugum.push(lfo);
      cikis.gain.setTargetAtTime(.26*hacim,A.currentTime,1.5); }
    else if(tur==="gece"){ // cırcır böcekleri: 4–5 kHz'de kısa darbe grupları
      cikis.gain.setTargetAtTime(1,A.currentTime,.5);
      const cir=()=>{ if(this._ortam!==O||!this.ac) return; const n=A.currentTime+.05;
        for(let b=0;b<2;b++){ const f=rnd(4200,4900), t0=n+rnd(0,.5), k=Math.floor(rnd(3,5));
          const o=A.createOscillator(), g=A.createGain(); o.type="sine"; o.frequency.value=f; g.gain.value=0; o.connect(g); g.connect(cikis);
          for(let i=0;i<k;i++){ const t=t0+i*.045; g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(.012*hacim,t+.008); g.gain.linearRampToValueAtTime(0,t+.03); }
          o.start(t0); o.stop(t0+k*.045+.05); }
        O.zaman=setTimeout(cir,rnd(450,900)); };
      O.zaman=setTimeout(cir,400); }
    else if(tur==="ruzgar"){ // dağ rüzgârı: yavaşça kabarıp sönen, rengi değişen gürültü
      const s=gur(.7); const bp=A.createBiquadFilter(); bp.type="bandpass"; bp.frequency.value=520; bp.Q.value=.6; const mod=A.createGain(); mod.gain.value=.6; s.connect(bp); bp.connect(mod); mod.connect(cikis); s.start(0,rnd(0,2));
      const lfo=A.createOscillator(), lg=A.createGain(); lfo.frequency.value=.09; lg.gain.value=.4; lfo.connect(lg); lg.connect(mod.gain); const lf2=A.createGain(); lf2.gain.value=260; lfo.connect(lf2); lf2.connect(bp.frequency); lfo.start(); O.dugum.push(lfo);
      cikis.gain.setTargetAtTime(.2*hacim,A.currentTime,1.5); }
    this._ortam=O;
  },
  ortamDur(){ this._ortamBekle=null; const O=this._ortam; this._ortam=null; if(!O||!this.ac) return; clearTimeout(O.zaman); O.cikis.gain.cancelScheduledValues(this.ac.currentTime); O.cikis.gain.setTargetAtTime(0,this.ac.currentTime,.35);
    setTimeout(()=>{ for(const d of O.dugum){ try{ d.stop(); }catch(e){} } try{ O.cikis.disconnect(); }catch(e){} },2200); },
  efekt(t,hacim=1){
    if(!this.ac) return; this._efektte=true; try{ this._efekt(t,hacim); }finally{ this._efektte=false; } },
  _efekt(t,hacim){
    const n=this.ac.currentTime;
    if(t==="parilti"){ [1046.5,1318.5,1568,2093].forEach((f,i)=>this.nota(f,n+i*.07,1.2,.05,"sine",1)); }
    else if(t==="adim"){ const A=this.ac; if(!this._adimB){ const L=Math.floor(A.sampleRate*.09), b=A.createBuffer(1,L,A.sampleRate), d=b.getChannelData(0); for(let i=0;i<L;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/L,3); this._adimB=b; }
      const s=A.createBufferSource(); s.buffer=this._adimB; s.playbackRate.value=.8+Math.random()*.35; const f=A.createBiquadFilter(); f.type="lowpass"; f.frequency.value=(this.zemin==="tas"?2400:this.zemin==="kum"?900:this.zemin==="hali"?600:1500)*(.85+Math.random()*.3); const g=A.createGain(); g.gain.value=.11*hacim;
      s.connect(f); f.connect(g); g.connect(this.kuru); s.start(n); }
    else if(t==="buyuk"){ [523.3,659.3,784,1046.5,1318.5].forEach((f,i)=>this.nota(f,n+i*.12,2.5,.06,"triangle",1)); }
    else if(t==="vuru"){ this.nota(784,n,.6,.06,"sine",1); }
    else if(t==="ates"){ const A=this.ac,o=A.createOscillator(),g=A.createGain(); o.type="sawtooth"; o.frequency.setValueAtTime(90,n); o.frequency.linearRampToValueAtTime(60,n+.3); g.gain.setValueAtTime(.05,n); g.gain.exponentialRampToValueAtTime(.0001,n+.35); o.connect(g); g.connect(this.kuru); o.start(n); o.stop(n+.4); }
    else if(t==="deklansor"){ const A=this.ac,uz=A.sampleRate*.12,b=A.createBuffer(1,uz,A.sampleRate),d=b.getChannelData(0); for(let i=0;i<uz;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/uz,6)*(i<uz*.3||i>uz*.55?1:.2); const s=A.createBufferSource(); s.buffer=b; const g=A.createGain(); g.gain.value=.35; s.connect(g); g.connect(this.kuru); s.start(n); }
    else if(t==="kilic"){ const A=this.ac;
      // kından çıkış: yükselen metal sürtünmesi (filtreli gürültü) + çınlayan çelik (rezonanslar)
      const uz=Math.floor(A.sampleRate*.7), b=A.createBuffer(1,uz,A.sampleRate), d=b.getChannelData(0);
      for(let i=0;i<uz;i++){ const tt=i/A.sampleRate; d[i]=(Math.random()*2-1)*Math.min(1,tt/.03)*Math.exp(-Math.max(0,tt-.32)*9); }
      const s=A.createBufferSource(); s.buffer=b; const bp=A.createBiquadFilter(); bp.type="bandpass"; bp.Q.value=4.5; bp.frequency.setValueAtTime(1800,n); bp.frequency.exponentialRampToValueAtTime(7200,n+.4);
      const g=A.createGain(); g.gain.value=.55*hacim; s.connect(bp); bp.connect(g); g.connect(this.kuru); g.connect(this.yanki); s.start(n);
      [2960,4410,5890,7430,9120].forEach((f,i)=>{ const o=A.createOscillator(), og=A.createGain(); o.type="sine"; o.frequency.value=f*(1+Math.random()*.006);
        og.gain.setValueAtTime(0,n+.36); og.gain.linearRampToValueAtTime(.075*hacim/(1+i*.6),n+.38); og.gain.exponentialRampToValueAtTime(.0001,n+1.8+i*.15);
        o.connect(og); og.connect(this.kuru); og.connect(this.yanki); o.start(n+.36); o.stop(n+2.3); }); }
    else if(t==="alkis"){ const A=this.ac; for(let k=0;k<70;k++){ const tt=n+Math.random()*3.2; const uz=A.sampleRate*.03,b=A.createBuffer(1,uz,A.sampleRate),d=b.getChannelData(0); for(let i=0;i<uz;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/uz,3); const s=A.createBufferSource(); s.buffer=b; const f=A.createBiquadFilter(); f.type="bandpass"; f.frequency.value=rnd(900,2200); const g=A.createGain(); g.gain.value=rnd(.05,.14)*(1-(tt-n)/4); s.connect(f); f.connect(g); g.connect(this.kuru); s.start(tt); } }
    else if(t==="cay"){ const A=this.ac,uz=Math.floor(A.sampleRate*2.6),b=A.createBuffer(1,uz,A.sampleRate),d=b.getChannelData(0); for(let i=0;i<uz;i++){ const tt=i/A.sampleRate; const zarf=Math.min(1,tt/.08)*(tt<1.1||(tt>1.35&&tt<2.45)?1:.05); d[i]=(Math.random()*2-1)*zarf*(.7+.3*Math.sin(tt*31)); }
      const s=A.createBufferSource(); s.buffer=b; const f=A.createBiquadFilter(); f.type="bandpass"; f.frequency.value=1700; f.Q.value=.8; const f2=A.createBiquadFilter(); f2.type="lowpass"; f2.frequency.setValueAtTime(2600,n); f2.frequency.linearRampToValueAtTime(1500,n+1.1);
      const g=A.createGain(); g.gain.value=.16*hacim; s.connect(f); f.connect(f2); f2.connect(g); g.connect(this.kuru); s.start(n); }
    else if(t==="titresim"){ [0,.25].forEach(o=>{ const A=this.ac,os=A.createOscillator(),g=A.createGain(); os.type="square"; os.frequency.value=140; g.gain.setValueAtTime(.025,n+o); g.gain.setValueAtTime(0,n+o+.16); os.connect(g); g.connect(this.kuru); os.start(n+o); os.stop(n+o+.17); }); }
    else if(t==="kalp"){ [0,.28].forEach((o,i)=>{ const A=this.ac,os=A.createOscillator(),g=A.createGain(); os.type="sine"; os.frequency.setValueAtTime(70,n+o); os.frequency.exponentialRampToValueAtTime(42,n+o+.18); g.gain.setValueAtTime(.0001,n+o); g.gain.exponentialRampToValueAtTime(i?.16:.22,n+o+.02); g.gain.exponentialRampToValueAtTime(.0001,n+o+.25); os.connect(g); g.connect(this.kuru); os.start(n+o); os.stop(n+o+.3); }); }
    else if(t==="zil"){ this.nota(659.3,n,1.1,.09,"triangle",.8); this.nota(523.3,n+.42,1.4,.09,"triangle",.8); }
    else if(t==="mesaj"){ this.nota(1318.5,n,.25,.05,"sine",1); this.nota(1760,n+.07,.35,.045,"sine",1); }
    else if(t==="gonder"){ const A=this.ac,o=A.createOscillator(),g=A.createGain(); o.type="sine"; o.frequency.setValueAtTime(600,n); o.frequency.exponentialRampToValueAtTime(1400,n+.12); g.gain.setValueAtTime(.04,n); g.gain.exponentialRampToValueAtTime(.0001,n+.18); o.connect(g); g.connect(this.kuru); o.start(n); o.stop(n+.2); }
    else if(t==="havai"){ const A=this.ac,uz=A.sampleRate*.6,b=A.createBuffer(1,uz,A.sampleRate),d=b.getChannelData(0); for(let i=0;i<uz;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/uz,3); const s=A.createBufferSource(); s.buffer=b; const g=A.createGain(); g.gain.value=.25; s.connect(g); g.connect(this.yanki); g.connect(this.kuru); s.start(n); }
  }
};

/* ================= GİRDİ ================= */
const Girdi={x:0,y:0,aksiyon:false,aksiyonBas:false,tus:{}};
addEventListener("keydown",e=>{ Girdi.tus[e.code]=true; if(e.code==="Space"||e.code==="Enter"||e.code==="KeyE"){ if(!Girdi.aksiyon) Girdi.aksiyonBas=true; Girdi.aksiyon=true; e.preventDefault(); } Ses.baslat(); });
addEventListener("keyup",e=>{ Girdi.tus[e.code]=false; if(e.code==="Space"||e.code==="Enter"||e.code==="KeyE") Girdi.aksiyon=false; });
addEventListener("pointerdown",()=>Ses.baslat(),{capture:true});
addEventListener("touchend",()=>Ses.baslat(),{capture:true,passive:true});
document.addEventListener("visibilitychange",()=>{ if(document.hidden&&Ses._kilit){ try{ Ses._kilit.pause(); }catch(e){} } });
let joyVec={x:0,y:0};
function klavyeVek(){ const t=Girdi.tus; let x=(t.KeyD||t.ArrowRight?1:0)-(t.KeyA||t.ArrowLeft?1:0), y=(t.KeyS||t.ArrowDown?1:0)-(t.KeyW||t.ArrowUp?1:0); const L=Math.hypot(x,y); return L? {x:x/L,y:y/L}:{x:0,y:0}; }
function girdiVek(){ const k=klavyeVek(); return (k.x||k.y)? k : joyVec; }
let katman=null;
function katmanTemizle(){ if(camera&&camera.view&&camera.view.enabled) camera.clearViewOffset(); if(katman) katman.remove(); katman=el(`<div style="position:absolute;inset:0;pointer-events:none"></div>`); UI.insertBefore(katman,PERDE); joyVec={x:0,y:0}; Girdi.aksiyon=false; }
function joystickEkle(){
  const j=el(`<div class="joy" aria-label="Yürü"><i></i></div>`), top=j.firstElementChild; let id=null, cx0=0, cy0=0;
  const R=52;
  const hareket=e=>{ let dx=e.clientX-cx0, dy=e.clientY-cy0; const L=Math.hypot(dx,dy); if(L>R){dx*=R/L;dy*=R/L;} top.style.transform=`translate(${dx}px,${dy}px)`; joyVec={x:dx/R,y:dy/R}; };
  j.addEventListener("pointerdown",e=>{ e.preventDefault(); id=e.pointerId; j.setPointerCapture(id); const r=j.getBoundingClientRect(); cx0=r.left+r.width/2; cy0=r.top+r.height/2; hareket(e); });
  j.addEventListener("pointermove",e=>{ if(e.pointerId===id) hareket(e); });
  const bit=()=>{ id=null; top.style.transform=""; joyVec={x:0,y:0}; };
  j.addEventListener("pointerup",bit); j.addEventListener("pointercancel",bit); j.addEventListener("lostpointercapture",bit);
  katman.appendChild(j); if(typeof kameraIpucu==="function") kameraIpucu();
}
function aksiyonEkle(){
  const b=el(`<button class="aksiyon" hidden></button>`);
  b.addEventListener("pointerdown",e=>{ e.preventDefault(); b.setPointerCapture(e.pointerId); if(!Girdi.aksiyon) Girdi.aksiyonBas=true; Girdi.aksiyon=true; b.classList.add("bas"); });
  const bit=()=>{ Girdi.aksiyon=false; b.classList.remove("bas"); };
  b.addEventListener("pointerup",bit); b.addEventListener("pointercancel",bit); b.addEventListener("lostpointercapture",bit);
  b.addEventListener("contextmenu",e=>e.preventDefault());
  katman.appendChild(b); return b;
}
function aksiyonYazi(b,t){ if(!b) return; if(t){ b.hidden=false; if(b.textContent!==t) b.textContent=t; } else b.hidden=true; }
let hedefEl=null;
function hedef(t){ if(!hedefEl||!hedefEl.isConnected){ hedefEl=el(`<div class="hedef"></div>`); katman.appendChild(hedefEl);} hedefEl.style.opacity=t?1:0; if(t) hedefEl.textContent=t; }
function ustDugmeler(){
  const s=el(`<button class="ses-btn" aria-label="Ses">${kayit.ses?"♪":"✕"}</button>`);
  s.onclick=()=>{ Ses.baslat(); Ses.sesAc(!kayit.ses); s.textContent=kayit.ses?"♪":"✕"; };
  const m=el(`<button class="menu-btn" aria-label="Menü">☰</button>`); m.onclick=()=>gecis(()=>Menu.ac());
  katman.append(s,m);
}
async function altYazi(t,sure=3800){ const d=el(`<div class="alt-yazi">${t}</div>`); katman.appendChild(d); await bekle(50); d.classList.add("gor"); await bekle(sure); d.classList.remove("gor"); await bekle(1300); d.remove(); }
async function baslikKarti(b,a){ const d=el(`<div class="kart-baslik"><span class="ust-yazi">${a[0]}</span><h2>${b}</h2><p>${a[1]}</p></div>`); katman.appendChild(d); await bekle(60); d.classList.add("gor"); await bekle(3200); d.classList.remove("gor"); await bekle(1500); d.remove(); }
let YUKLENIYOR=false;
// küçük eşyalar (fincan, kalem, düğme, yaprak…) gölge haritasına çizilmez: gölgeleri birkaç piksel ama her biri ayrı çizim çağrısı
// (kafede kare başına 130 gölge çiziminin 90'ı bunlardı). Karakterler kendi kurallarıyla (golgeSadelestir) ayrıca sadeleşir.
const _kgV=new THREE.Vector3();
function kucukGolgeleriKapat(s){ if(!s) return; s.updateMatrixWorld(true); const kar=new Set(KARAKTERLER);
  const gez=o=>{ if(kar.has(o)) return;
    if(o.isMesh&&o.castShadow&&o.geometry){ const g=o.geometry; if(!g.boundingSphere) g.computeBoundingSphere(); o.getWorldScale(_kgV);
      if(g.boundingSphere.radius*Math.max(Math.abs(_kgV.x),Math.abs(_kgV.y),Math.abs(_kgV.z))<.25) o.castShadow=false; }
    for(const c of o.children) gez(c); };
  gez(s); }
/* çok malzemeli ağlar (ör. binalar: 6 yüzlü kutu, yüzlerin çoğu aynı renk) her yüz grubu için ayrı çizim çağrısı yapıyordu.
   Aynı görünen malzemeli yüz grupları dizinde yan yana getirilip birleştirilir: bina başına 6 çizim → 3 (gölge haritasında da). */
function _malzAnahtar(m){ if(!m) return "yok"; if(!/^Mesh(Standard|Lambert|Basic|Phong)Material$/.test(m.type)||m.onBeforeCompile!==THREE.Material.prototype.onBeforeCompile) return m.uuid;
  const t=x=>x?x.uuid:"-", c=x=>x?x.getHexString():"-";
  return [m.type,c(m.color),c(m.emissive),m.emissiveIntensity,m.roughness,m.metalness,t(m.map),t(m.normalMap),t(m.bumpMap),m.bumpScale,t(m.roughnessMap),t(m.metalnessMap),t(m.emissiveMap),t(m.alphaMap),t(m.aoMap),t(m.envMap),m.envMapIntensity,
    m.transparent,m.opacity,m.side,m.alphaTest,m.depthWrite,m.depthTest,m.vertexColors,m.flatShading,m.fog,m.wireframe,m.blending,m.skinning,m.morphTargets,c(m.specular),m.shininess,m.toneMapped,m.visible,m.colorWrite].join("|"); }
function cokluMalzemeSadelestir(s){ if(!s) return; const kul=new Map(); s.traverse(o=>{ if(o.isMesh&&o.geometry) kul.set(o.geometry,(kul.get(o.geometry)||0)+1); });
  s.traverse(o=>{ if(!o.isMesh||!Array.isArray(o.material)||o.isSkinnedMesh||o.isInstancedMesh) return; const g=o.geometry, M=o.material;
    if(!g||!g.index||!g.groups||g.groups.length<2||kul.get(g)!==1||g.userData.grupBirlesik) return;
    const anah=M.map(_malzAnahtar), kanon=anah.map(a=>anah.indexOf(a)); const sira=[], tip=new Map();
    for(const gr of g.groups){ const k=kanon[gr.materialIndex]; if(k===undefined||k<0) return; if(!tip.has(k)){ tip.set(k,[]); sira.push(k); } tip.get(k).push(gr); }
    if(sira.length===g.groups.length) return;
    const eski=g.index.array, yeni=new (eski.constructor)(eski.length); let p=0; g.clearGroups();
    for(const k of sira){ const bas=p; for(const gr of tip.get(k)){ yeni.set(eski.subarray(gr.start,gr.start+gr.count),p); p+=gr.count; } g.addGroup(bas,p-bas,k); }
    if(p!==eski.length){ const kalan=yeni.subarray(0,p); g.setIndex(new THREE.BufferAttribute(kalan.slice(),1)); } else g.setIndex(new THREE.BufferAttribute(yeni,1));
    g.userData.grupBirlesik=true;
    if(g.groups.length===1){ o.material=M[g.groups[0].materialIndex]; g.clearGroups(); } }); }
/* durağan çevre birleştirme: binalar, banklar, ağaçlar, masa-sandalye gibi hiç kıpırdamayan ağlar aynı görünen malzemeye göre tek ağda toplanır
   (meydanda kare başına çizim çağrısı ~%30 azalır; iPhone'da asıl yük çizim çağrısı sayısı). Asıl ağlar sahnede kalır ama çizilmez (katman 0 kapalı):
   konumları, çarpışma bilgileri, raycast dışı her şey aynen durur. Kod sonradan birini oynatır, gizler ya da malzemesini değiştirirse
   izleyici bunu görür ve o grubu hemen eski hâline döndürür. Bölüm nesnesinin tuttuğu, etkileşimli ya da işaretli nesnelere hiç dokunulmaz. */
let STATIK=[]; let _statikT=0;
function statikBirlestir(s){ if(!s||s.userData.statikYapildi) return; s.userData.statikYapildi=true; s.updateMatrixWorld(true);
  const ref=new Set(), ekle=v=>{ if(v&&v.isObject3D) ref.add(v); };
  const B=bolum; if(B) for(const k of Object.keys(B)){ const v=B[k]; if(!v||typeof v!=="object") continue; if(v.isObject3D) ekle(v);
    else if(Array.isArray(v)) v.forEach(x=>{ if(x&&x.isObject3D) ekle(x); else if(x&&typeof x==="object"&&!Array.isArray(x)) Object.values(x).forEach(ekle); else if(Array.isArray(x)) x.forEach(ekle); });
    else if(v.constructor===Object) Object.values(v).forEach(y=>{ if(y&&y.isObject3D) ekle(y); else if(Array.isArray(y)) y.forEach(ekle); }); }
  for(const e of (ETK||[])) if(e&&e.nesne) ekle(e.nesne); for(const c of KARAKTERLER) ekle(c);
  const refAlt=new Set(); ref.forEach(r=>r.traverse(x=>refAlt.add(x)));
  const uygun=o=>{ if(!o.isMesh||o.isSkinnedMesh||o.isInstancedMesh||!o.visible||refAlt.has(o)||o.layers.mask!==1||o.renderOrder!==0||o.customDepthMaterial||o.customDistanceMaterial||o.onBeforeRender!==THREE.Object3D.prototype.onBeforeRender) return false;
    for(let p=o;p&&p!==s;p=p.parent){ if(!p.visible) return false; const u=p.userData; if(u) for(const k in u) if(k!=="engel") return false; if(p!==o&&refAlt.has(p)) return false; }
    const g=o.geometry; if(!g||!g.attributes||!g.attributes.position||!g.attributes.normal||g.morphAttributes&&Object.keys(g.morphAttributes).length||g.drawRange.start!==0||g.drawRange.count!==Infinity) return false;
    const ms=Array.isArray(o.material)?o.material:[o.material];
    return ms.every(m=>m&&!m.transparent&&/^Mesh(Standard|Lambert|Basic|Phong)Material$/.test(m.type)&&!m.vertexColors&&!m.aoMap&&!m.lightMap&&!m.morphTargets&&!m.skinning&&m.alphaTest===0&&m.onBeforeCompile===THREE.Material.prototype.onBeforeCompile); };
  const adaylar=[];
  s.traverse(o=>{ if(!uygun(o)) return; const g=o.geometry, ms=Array.isArray(o.material)?o.material:[o.material];
    const pr=(Array.isArray(o.material)&&g.groups.length)? g.groups.map(gr=>({m:ms[gr.materialIndex],start:gr.start,count:gr.count})) : [{m:ms[0],start:0,count:g.index?g.index.count:g.attributes.position.count}];
    if(pr.some(x=>!x.m||(x.m.map&&!g.attributes.uv))) return;
    for(const x of pr) x.k=_malzAnahtar(x.m)+"|"+o.castShadow+"|"+o.receiveShadow+"|"+(g.attributes.uv?1:0);
    adaylar.push({o,pr:pr.filter(x=>x.m.visible&&x.count>0)}); });
  let aktif=adaylar;
  for(let tur=0;tur<10;tur++){ const say=new Map(); for(const a of aktif) for(const x of a.pr) say.set(x.k,(say.get(x.k)||0)+1);
    const yeni=aktif.filter(a=>a.pr.length&&a.pr.every(x=>say.get(x.k)>=2)); if(yeni.length===aktif.length) break; aktif=yeni; }
  if(!aktif.length) return;
  const kova=new Map(); for(const a of aktif) for(const x of a.pr){ if(!kova.has(x.k)) kova.set(x.k,{m:x.m,golge:a.o.castShadow,al:a.o.receiveShadow,uv:!!a.o.geometry.attributes.uv,list:[]}); kova.get(x.k).list.push({o:a.o,start:x.start,count:x.count}); }
  const nm=new THREE.Matrix3(), v=new THREE.Vector3(), parti=new Map();
  for(const kv of kova.values()){ let n=0; for(const it of kv.list) n+=it.count;
    const P=new Float32Array(n*3), N=new Float32Array(n*3), U=kv.uv?new Float32Array(n*2):null; let w=0;
    for(const it of kv.list){ const g=it.o.geometry, pa=g.attributes.position, na=g.attributes.normal, ua=g.attributes.uv, ix=g.index, M=it.o.matrixWorld; nm.getNormalMatrix(M); const ters=M.determinant()<0;
      for(let i=it.start;i<it.start+it.count;i++){ let q=i; if(ters){ const r=(i-it.start)%3; if(r===1) q=i+1; else if(r===2) q=i-1; } const j=ix?ix.getX(q):q;
        v.fromBufferAttribute(pa,j).applyMatrix4(M); P[w*3]=v.x; P[w*3+1]=v.y; P[w*3+2]=v.z; v.fromBufferAttribute(na,j).applyMatrix3(nm).normalize(); N[w*3]=v.x; N[w*3+1]=v.y; N[w*3+2]=v.z;
        if(U){ U[w*2]=ua.getX(j); U[w*2+1]=ua.getY(j); } w++; } }
    const G=new THREE.BufferGeometry(); G.setAttribute("position",new THREE.BufferAttribute(P,3)); G.setAttribute("normal",new THREE.BufferAttribute(N,3)); if(U) G.setAttribute("uv",new THREE.BufferAttribute(U,2));
    G.computeBoundingSphere(); const m=new THREE.Mesh(G,kv.m); m.castShadow=kv.golge; m.receiveShadow=kv.al; m.matrixAutoUpdate=false; m.userData.statikParti=true; s.add(m);
    for(const it of kv.list){ if(!parti.has(it.o)) parti.set(it.o,new Set()); parti.get(it.o).add(m); } }
  // asıllar çizimden çıkar; izleyici için ilk hâlleri saklanır
  const grup={s,partiler:new Set(),asil:[]};
  for(const a of aktif){ const o=a.o; o.layers.mask=0; const ms=Array.isArray(o.material)?o.material:[o.material];
    grup.asil.push({o,mw:o.matrixWorld.clone(),an:ms.map(_malzAnahtar).join("#"),mat:o.material,parti:parti.get(o)}); parti.get(o).forEach(m=>grup.partiler.add(m)); }
  STATIK.push(grup); }
// asıllardan biri değişirse (kıpırdadı, gizlendi, malzemesi değişti) o asılla aynı birleşik ağı paylaşanların hepsi eski hâline döner
function statikIzle(dt){ _statikT+=dt; if(_statikT<.2||!STATIK.length) return; _statikT=0;
  for(const g of STATIK){ if(g.s!==scene&&!EK_SAHNELER.includes(g.s)) continue; let bozuk=null;
    for(const a of g.asil){ if(a.bitti) continue; const o=a.o; let gor=false; for(let p=o;p;p=p.parent){ if(!p.visible) break; if(p===g.s){ gor=true; break; } }
      if(!gor||o.material!==a.mat||!o.matrixWorld.equals(a.mw)||(Array.isArray(o.material)?o.material:[o.material]).map(_malzAnahtar).join("#")!==a.an){ bozuk=a; break; } }
    if(!bozuk) continue;
    const coz=new Set(bozuk.parti); let degisti=true;
    while(degisti){ degisti=false; for(const a of g.asil){ if(a.bitti) continue; let dokun=false; a.parti.forEach(m=>{ if(coz.has(m)) dokun=true; }); if(dokun) a.parti.forEach(m=>{ if(!coz.has(m)){ coz.add(m); degisti=true; } }); } }
    for(const a of g.asil){ if(a.bitti) continue; let dokun=false; a.parti.forEach(m=>{ if(coz.has(m)) dokun=true; }); if(dokun){ a.o.layers.mask=1; a.bitti=true; } }
    coz.forEach(m=>{ if(m.parent) m.parent.remove(m); m.geometry.dispose(); g.partiler.delete(m); }); } }
const GECIS_OLC=[];
function isinmaTakimi(){ if(isinmaTakimi.k) return isinmaTakimi.k;
  const c=document.createElement("canvas"); c.width=c.height=2; const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; const tL=new THREE.CanvasTexture(c); /* kodlaması ayarlanmamış dokular (doğrusal) ayrı program ister */ const geo=new THREE.PlaneGeometry(.001,.001); const k=new THREE.Group();
  for(const m of [new THREE.MeshBasicMaterial({map:t}),new THREE.MeshBasicMaterial({map:t,side:THREE.DoubleSide}),new THREE.MeshBasicMaterial({map:t,toneMapped:false}),new THREE.MeshBasicMaterial(),
    new THREE.MeshBasicMaterial({map:tL}),new THREE.MeshStandardMaterial({map:tL}),new THREE.MeshStandardMaterial({map:t}),new THREE.MeshStandardMaterial({map:t,side:THREE.DoubleSide}),new THREE.MeshStandardMaterial(),new THREE.MeshStandardMaterial({flatShading:true})]) k.add(new THREE.Mesh(geo,m));
  k.add(parilti("#ffffff",.001)); k.add(new THREE.Sprite(new THREE.SpriteMaterial({map:parlakDokuAl(),transparent:true,depthWrite:false}))); // sisli ışıltı (nefes buharı, kalpler)
  const pg=new THREE.BufferGeometry(); pg.setAttribute("position",new THREE.Float32BufferAttribute([0,0,0],3)); k.add(new THREE.Points(pg,new THREE.PointsMaterial({map:parlakDokuAl(),size:1,transparent:true,depthWrite:false}))); k.add(new THREE.Points(pg,new THREE.PointsMaterial({map:parlakDokuAl(),size:1,transparent:true,depthWrite:false,fog:false}))); // toz / havai fişek
  k.traverse(o=>{ o.frustumCulled=false; o.userData.kalici=true; }); return isinmaTakimi.k=k; }
async function gecis(fn){ PERDE.classList.add("kapali"); await bekle(560); YUKLENIYOR=true; const t0=performance.now();
  try{ await fn(); } finally{ YUKLENIYOR=false; }
  // yan sahneler de (tren içi, telefondaki oda…) şimdi derlenir: bölüm onlardan biriyle açılırsa ilk karede donmasın
  // ısınma takımı: sahneye sonradan eklenen şeylerin (ışıltı, gizli kalp, yol tabelası, yazı levhası, havai fişek…) gölgelendiricileri de perde
  // kapalıyken bu sahnenin ışıklarıyla derlenir; takım hiç atılmaz, programlar önbellekte kalır (oyun sırasında derleme takılması olmasın)
  const kit=window.__kitYok?new THREE.Group():isinmaTakimi(); // __kitYok: yalnız ölçüm testleri
  // derleme, sahnenin gerçekte çizileceği hedefle yapılır: ana sahne efekt zincirinin ara hedefine (doğrusal çıkış) çizilir, telefon ekranındaki
  // oda doğrudan ekrana ve ACES ile. Önceden hep ekran ayarıyla derleniyordu; ana sahnenin programları ilk karede yeniden derleniyordu.
  const rtAna=composer?composer.readBuffer:null, tm0=renderer.toneMapping;
  const t1=performance.now(); for(const s of [scene,...EK_SAHNELER]){ if(!s) continue; try{ kucukGolgeleriKapat(s); cokluMalzemeSadelestir(s); statikBirlestir(s); isiklariDengele(s); if(s===scene) ortamYakala(s); s.add(kit);
      if(s.userData.pip){ renderer.setRenderTarget(null); renderer.toneMapping=THREE.ACESFilmicToneMapping; } else renderer.setRenderTarget(rtAna);
      renderer.compile(s,camera);
      // denizli sahnede su yansıması her şeyi bir de doğrusal hedefe çizer: o program çeşitleri de şimdi derlensin (ilk dalgada takılmasın)
      if(!s.userData.pip&&!rtAna){ let su=false; s.traverse(o=>{ if(!su&&o.material&&o.material.uniforms&&o.material.uniforms.mirrorSampler) su=true; });
        if(su){ if(!gecis.rtL) gecis.rtL=new THREE.WebGLRenderTarget(4,4); renderer.setRenderTarget(gecis.rtL); renderer.compile(s,camera); } }
    }catch(e){ console.warn("gecis derleme",e); } s.remove(kit); renderer.setRenderTarget(null); renderer.toneMapping=tm0; } const t2=performance.now();
  let n=3; const ac=()=>{ if(--n>0) requestAnimationFrame(ac); else { PERDE.classList.remove("kapali"); GECIS_OLC.push({kur:Math.round(t1-t0),derle:Math.round(t2-t1),kare:Math.round(performance.now()-t2)}); if(GECIS_OLC.length>30) GECIS_OLC.shift(); } }; requestAnimationFrame(ac); }

/* ================= SAHNE ORTAK ================= */
let scene=null, bolum=null, zaman=0;
// yeni sahne kurulunca kamera hâlâ eski sahnedeki yerinde durur; ilk kamera komutu oradan süzülerek başlamasın diye işaretlenir
let KAMERA_ESKI=false; const KAMERA_ESKI_POZ=new THREE.Vector3();
// kamera yeni sahne kurulduktan sonra hiç yerinden oynatılmadıysa hâlâ eski sahnededir
function kameraEskiMi(){ return KAMERA_ESKI&&camera.position.distanceToSquared(KAMERA_ESKI_POZ)<1e-8; }
/* ---------- kaynak yönetimi: sahne değişince eski sahnenin geometri, malzeme ve dokuları GPU'dan bırakılır ----------
   (önceden yalnız "map" bırakılıyordu; tümsek/normal dokuları ve kalabalığın kopya malzemeleri her sahnede birikip iPhone'u yavaşlatıyordu)
   Avatar şablonlarının ortak kaynakları ve __kalici işaretli dokular korunur; bırakılan bir kaynak yeniden kullanılırsa three.js onu tekrar yükler. */
const DOKU_ALAN=["map","normalMap","bumpMap","roughnessMap","metalnessMap","emissiveMap","alphaMap","aoMap","lightMap","displacementMap","specularMap","clearcoatMap","clearcoatNormalMap","clearcoatRoughnessMap","transmissionMap","gradientMap"];
const KALICI={mat:new Set(),doku:new Set(),geo:new Set(),hazir:false};
let EK_SAHNELER=[]; // sahneyle birlikte bırakılacak yan sahneler (telefondaki oda, tren içi)
function kaliciKaynaklar(){ if(KALICI.hazir||typeof AVATAR==="undefined") return; let n=0;
  for(const k in AVATAR){ const A=AVATAR[k]; if(!A||!A.sahne) continue; n++; A.sahne.traverse(o=>{ if(o.geometry) KALICI.geo.add(o.geometry);
    for(const m of (o.material?(Array.isArray(o.material)?o.material:[o.material]):[])){ KALICI.mat.add(m); for(const a of DOKU_ALAN) if(m[a]) KALICI.doku.add(m[a]); } }); }
  if(n>=2) KALICI.hazir=true; }
/* gölgelendirici program önbelleği: three.js dispose edilen malzemenin programını da siler, sonraki sahne aynı programları baştan derlerdi
   (iPhone'da sahne açılışını en çok yavaşlatan iş). Programlar "iğnelenir": sahne değişince silinmez, aynı ayarlı malzeme gelince hazır bulunur.
   Sayı PROG_SINIR'ı aşarsa en uzun süredir kullanılmayanlar bırakılır. */
const PROG_SINIR=130;
function programlariIgnele(malzemeler){ const P=renderer.info.programs; if(!P) return; const simdi=performance.now();
  for(const m of malzemeler){ const pr=renderer.properties.get(m); if(pr&&pr.programs) pr.programs.forEach(p=>{ p.__son=simdi; }); }
  for(const p of P){ if(!p.__ig){ p.__ig=true; p.usedTimes++; if(!p.__son) p.__son=simdi; } } }
// her yeni program derlendiği karede iğnelenir: sahne içinde kullanılıp atılan malzemeler (konfeti, parıltı…) programlarını sildirmesin,
// bir sonraki konfetide aynı program yeniden derlenip oyunu takmasın
let _progSay=0, _progKare=0;
function yeniProgramlariIgnele(){ const P=renderer.info.programs; if(!P||(P.length===_progSay&&++_progKare%30)) return; const t=performance.now(); for(const p of P) if(!p.__ig){ p.__ig=true; p.usedTimes++; p.__son=t; } _progSay=P.length; }
function programlariBuda(){ const P=renderer.info.programs; if(!P||P.length<=PROG_SINIR) return; let fazla=P.length-PROG_SINIR;
  for(const p of P.filter(p=>p.__ig).sort((a,b)=>a.__son-b.__son)){ if(fazla<=0) break; p.__ig=false;
    if(--p.usedTimes===0){ const i=P.indexOf(p); if(i>=0){ P[i]=P[P.length-1]; P.pop(); } try{ p.destroy(); }catch(e){} fazla--; } } _progSay=P.length; }
function sahneyiBirak(s){ if(!s) return; kaliciKaynaklar();
  const ML=new Set(); s.traverse(o=>{ if(o.material) for(const m of (Array.isArray(o.material)?o.material:[o.material])) ML.add(m); });
  try{ programlariIgnele(ML); }catch(e){}
  s.traverse(o=>{ if(o.userData&&o.userData.rt){ try{ o.userData.rt.dispose(); }catch(e){} }
    if(o.isSkinnedMesh&&o.skeleton&&o.skeleton.boneTexture) o.skeleton.dispose(); // kemik dokusu
    if(o.geometry&&!KALICI.geo.has(o.geometry)&&!(o.geometry.userData&&o.geometry.userData.kalici)) o.geometry.dispose();
    for(const m of (o.material?(Array.isArray(o.material)?o.material:[o.material]):[])){ if(KALICI.mat.has(m)) continue;
      for(const a of DOKU_ALAN){ const t=m[a]; if(t&&t.isTexture&&!t.__kalici&&!KALICI.doku.has(t)) t.dispose(); }
      if(m.uniforms&&m.uniforms.normalSampler&&m.uniforms.normalSampler.value&&m.uniforms.normalSampler.value.isTexture) m.uniforms.normalSampler.value.dispose();
      m.dispose(); } });
  try{ programlariBuda(); }catch(e){} }
// ışık sayısı aynı olan sahneler aynı gölgelendirici programlarını paylaşır: 1-3 noktasal ışıklı sahneler 4'e tamamlanır (karakter gölgelendiricileri yeniden derlenmez)
function isiklariDengele(s){ if(!s||s.userData.dengeli) return; s.userData.dengeli=true; let P=0; s.traverse(o=>{ if(o.isPointLight) P++; });
  if(P>0&&P<4) for(let i=P;i<4;i++){ const l=new THREE.PointLight(0x000000,0,1,2); l.position.set(0,-500,0); l.userData.bos=true; s.add(l); } }
/* gölge kutusu kameranın baktığı yere oturur: yakın çekimde dar (keskin, ayrıntılı gölge), uzak çekimde geniş. Kutu ışık uzayında gölge
   pikseline hizalanır: kamera kayarken gölge kenarları titremez. Boyut 2 m basamaklarla değişir; büyüme hemen, küçülme ancak iki basamak gerekince (sınırda gidip gelmesin). */
const _gk=[new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3()];
function golgeKadraj(s){ const gun=s&&s.userData.gun; if(!gun) return; const sc=gun.shadow.camera, yon=s.userData.gunesYon;
  const ileri=camera.getWorldDirection(_gk[0]); let ref=(Kamera.sinema&&camera.userData.bakis)? camera.userData.bakis : _gk[1].copy(Kamera.hedef).add(_gk[2].set(0,1,0));
  let D=_gk[3].copy(ref).sub(camera.position).dot(ileri); if(!(D>0)||!isFinite(D)) D=6; D=clamp(D,1.5,26);
  const M=_gk[1].copy(camera.position).addScaledVector(ileri,D*.92);
  let R=clamp(D*.95+5.5,8,24); R=Math.ceil(R/2)*2; const R0=gun.userData.R; if(!R0||R>R0||R<=R0-4){ gun.userData.R=R; sc.left=-R; sc.right=R; sc.top=R; sc.bottom=-R; sc.updateProjectionMatrix(); }
  R=gun.userData.R; const tex=2*R/gun.shadow.mapSize.x;
  const X=_gk[2].set(0,1,0).cross(yon); if(X.lengthSq()<1e-6) X.set(1,0,0); X.normalize(); const Y=_gk[3].copy(yon).cross(X);
  const px=Math.round(M.dot(X)/tex)*tex, py=Math.round(M.dot(Y)/tex)*tex, pz=M.dot(yon);
  gun.target.position.set(0,0,0).addScaledVector(X,px).addScaledVector(Y,py).addScaledVector(yon,pz); gun.position.copy(gun.target.position).addScaledVector(yon,60); }
/* ortam yansıması sahnenin kendisinden: sahne kurulunca karakterlerin durduğu yerden altı yöne çekilir (binalar, zemin, odanın duvarları, lambalar).
   Önceden yalnız gökyüzü yansıyordu: oda içinde parlak yüzeylerde gök mavisi görünüyor, karakterler alttan zeminin rengini almıyordu.
   Biçim gökyüzü dokusuyla aynı (8 bit sRGB küp, mipmap): gölgelendiriciler yeniden derlenmez. Karakterler çekimde gizlenir. */
let ORTAM_RT=null;
function ortamYakala(s){ if(!s||!renderer||!s.userData.gok) return;
  const gizli=[], gok=s.userData.gok, gun=s.userData.gun, gEski=gok.position.clone(), env=s.environment; let gK=null;
  try{ const P=new THREE.Vector3(); let n=0;
    for(const c of KARAKTERLER){ if(c.userData.kalabalik||!c.parent) continue; let r=c; while(r.parent) r=r.parent; if(r!==s) continue; P.add(c.getWorldPosition(new THREE.Vector3())); n++; }
    if(n) P.multiplyScalar(1/n).add(new THREE.Vector3(0,1.35,0)); else P.copy(camera.position);
    for(const c of KARAKTERLER) if(c.visible){ c.visible=false; gizli.push(c); }
    gok.position.copy(P);
    if(gun){ gK=[gun.position.clone(),gun.target.position.clone()]; gun.target.position.copy(P); gun.position.copy(P).addScaledVector(s.userData.gunesYon,60); }
    if(!ORTAM_RT) ORTAM_RT=new THREE.WebGLCubeRenderTarget(256,{format:THREE.RGBAFormat,generateMipmaps:true,minFilter:THREE.LinearMipmapLinearFilter,magFilter:THREE.LinearFilter,encoding:THREE.sRGBEncoding});
    const cc=new THREE.CubeCamera(.15,2000,ORTAM_RT); cc.position.copy(P); s.add(cc); cc.updateMatrixWorld(true);
    if(sahneKur.envRT) s.environment=sahneKur.envRT.texture; // çekim sırasında gökyüzü yansıması (hedef doku kendine yazılırken okunmasın)
    s.updateMatrixWorld(true); cc.update(renderer,s); s.remove(cc); s.environment=ORTAM_RT.texture;
  }catch(e){ console.warn("ortam yakala",e); s.environment=env; }
  gok.position.copy(gEski); if(gun&&gK){ gun.position.copy(gK[0]); gun.target.position.copy(gK[1]); }
  for(const c of gizli) c.visible=true; }
function sahneKur(ayar){
  DALGA=[]; // önceki sahnenin bayrakları güncellenmeye devam etmesin
  if(scene) sahneyiBirak(scene); for(const e of EK_SAHNELER) sahneyiBirak(e); EK_SAHNELER=[]; STATIK=[];
  KARAKTERLER=[]; Ses.zemin=null; Ses.ortamDur();
  Kamera.sinema=null; KAMERA_ESKI=true; KAMERA_ESKI_POZ.copy(camera.position); Kamera.poz.set(NaN,NaN,NaN); camera.userData.bakis=null;
  scene=new THREE.Scene();
  scene.fog=new THREE.Fog(renk(ayar.sis),ayar.sisYakin||40,ayar.sisUzak||260);
  const gok=gokyuzuYap(ayar); scene.add(gok); scene.userData.gok=gok;
  // ortam yansıması: gökyüzünden 8 bit küp doku (her cihazda çalışır; metal ve parlak yüzeyler gökyüzünü yansıtır)
  try{ if(sahneKur.envRT){ sahneKur.envRT.dispose(); sahneKur.envRT=null; }
    const crt=new THREE.WebGLCubeRenderTarget(128,{format:THREE.RGBAFormat,generateMipmaps:true,minFilter:THREE.LinearMipmapLinearFilter,magFilter:THREE.LinearFilter,encoding:THREE.sRGBEncoding});
    const gs=new THREE.Scene(); const gk=gokyuzuYap(ayar); gs.add(gk); const cc=new THREE.CubeCamera(.1,5000,crt); gs.add(cc); cc.update(renderer,gs);
    gk.geometry.dispose(); gk.material.dispose(); scene.environment=crt.texture; sahneKur.envRT=crt; }catch(e){ console.warn("ortam",e); }
  const hemi=new THREE.HemisphereLight(renk(ayar.ust),renk(ayar.zemin||"#6b5a4a"),ayar.hemi||.65); scene.add(hemi);
  const gun=new THREE.DirectionalLight(renk(ayar.isik||"#ffd2a1"),ayar.isikGuc||2.2);
  const isikYon=(ayar.isikYon||ayar.gunesYon).clone().normalize();
  gun.position.copy(isikYon.clone().multiplyScalar(60)); gun.castShadow=true;
  // gölge haritası 2048 ve kameranın baktığı yere göre daralan kutu (golgeKadraj): yakın çekimde 1 cm'lik gölge pikseli (önceden 1024 ve ±22 m: 4 cm)
  gun.shadow.mapSize.set(2048,2048); const sc=gun.shadow.camera; sc.left=-22; sc.right=22; sc.top=22; sc.bottom=-22; sc.near=1; sc.far=160; gun.shadow.bias=-.00035; gun.shadow.normalBias=.018;
  scene.add(gun); scene.add(gun.target); scene.userData.gun=gun; scene.userData.gunesYon=isikYon;
  const dolgu=new THREE.DirectionalLight(renk(ayar.dolguRenk||"#ffe6d0"),ayar.dolgu||.9); dolgu.position.set(-isikYon.x*40,25,-isikYon.z*40+20); scene.add(dolgu); scene.userData.dolgu=dolgu;
  return scene;
}
const GDOKU={};
function gurultuDoku(tekrar){
  if(!GDOKU.c){ const c=document.createElement("canvas"); c.width=c.height=256; const x=c.getContext("2d"), d=x.createImageData(256,256);
    for(let i=0;i<256*256;i++){ const v=110+Math.random()*90+Math.sin(i%256*.3)*8; d.data[i*4]=d.data[i*4+1]=d.data[i*4+2]=v; d.data[i*4+3]=255; }
    x.putImageData(d,0,0); GDOKU.c=c; }
  const t=new THREE.CanvasTexture(GDOKU.c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(tekrar,tekrar); return t;
}
function gokyuzuYap(a){
  const m=new THREE.ShaderMaterial({
    side:THREE.BackSide, depthWrite:false, fog:false,
    uniforms:{ ust:{value:renk(a.ust)}, ufuk:{value:renk(a.ufuk)}, alt:{value:renk(a.alt||a.ufuk)}, gunes:{value:a.gunesYon.clone().normalize()}, gRenk:{value:renk(a.gunesRenk||"#ffdca8")}, yildiz:{value:a.yildiz||0}, zaman:{value:0}, parlak:{value:a.parlak||1} },
    vertexShader:`varying vec3 vY; void main(){ vY=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader:`uniform vec3 ust,ufuk,alt,gunes,gRenk; uniform float yildiz,zaman,parlak; varying vec3 vY;
      float h21(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      void main(){ vec3 d=normalize(vY); float h=d.y;
        vec3 c = h>0.0 ? mix(ufuk,ust,pow(h,0.55)) : mix(ufuk,alt,pow(-h,0.4));
        float s=max(dot(d,normalize(gunes)),0.0);
        c += gRenk*pow(s,6.0)*0.55*parlak + gRenk*pow(s,60.0)*0.8*parlak + vec3(1.0,0.95,0.85)*smoothstep(0.9993,0.9997,s)*3.0*parlak;
        if(yildiz>0.0 && h>0.02){ vec2 u=vec2(atan(d.z,d.x)*80.0, h*160.0); vec2 g=floor(u); float r=h21(g); float tw=0.6+0.4*sin(zaman*2.0+r*30.0);
          float st=step(0.985,r)*smoothstep(0.45,0.0,length(fract(u)-0.5))*tw; c+=vec3(st)*yildiz*smoothstep(0.02,0.25,h); }
        gl_FragColor=vec4(c,1.0); }`
  });
  const g=new THREE.Mesh(new THREE.SphereGeometry(900,32,16),m); g.renderOrder=-1; return g;
}
let parlakDoku=null;
function parlakDokuAl(){
  if(parlakDoku) return parlakDoku;
  const c=document.createElement("canvas"); c.width=c.height=64; const x=c.getContext("2d");
  const g=x.createRadialGradient(32,32,0,32,32,32); g.addColorStop(0,"rgba(255,255,255,1)"); g.addColorStop(.25,"rgba(255,255,255,.55)"); g.addColorStop(1,"rgba(255,255,255,0)");
  x.fillStyle=g; x.fillRect(0,0,64,64); parlakDoku=new THREE.CanvasTexture(c); return parlakDoku;
}
function parilti(r,boy=1){ const s=new THREE.Sprite(new THREE.SpriteMaterial({map:parlakDokuAl(),color:renk(r),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,fog:false})); s.scale.set(boy,boy,boy); return s; }

/* ================= KARAKTERLER ================= */
