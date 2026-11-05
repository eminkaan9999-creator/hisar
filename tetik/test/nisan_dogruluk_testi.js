// Nişan hatası doğruluk testi (uçtan uca): gerçekçi silah hareketi → sensör ham verisi (ivme + jiroskop, sapma ve gürültüyle)
// → uygulamanın kendi işlemcisi (proc.feed) → ölçüm, skor ve teşhis. Gerçek hareket bilindiği için teşhisin doğruluğu ölçülür.
// Kapsam: 8 montaj (alt/üst/sağ/sol × ileri/arka), sağ/sol el, 3 tetik hareketi biçimi, iki titreme modeli,
// temiz tetik + titreme, karışık atıcılar (480 atış), kanting ve takip. Rastgelelik sabit tohumlu: sonuç her çalıştırmada aynı.
'use strict';
const { serve, check, section, finish, openApp, chromium } = require('./ortak');
const PORT = 8789;

// ---------------------------------------------------------------- sayfada çalışan simülatör
function pageSide() {
  const H = window.__hisar, P = H.proc;
  let seed = 12345; const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const gauss = () => { let u = 0; while (!u) u = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rnd()); };
  const V = { add: (a, b) => a.map((x, i) => x + b[i]), mul: (a, k) => a.map(x => x * k), dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
    cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]] };
  const RT = [1, 0, 0], F = [0, 1, 0], U = [0, 0, 1], neg = v => v.map(x => -x);
  // sensör eksenleri (dünya cinsinden): montaj yeri (alt/üst/sağ/sol) ve yönü (ileri/arka)
  const axes = (yer, yon) => { const y = yon === 'arka' ? neg(F) : F; const z = { alt: U, ust: neg(U), sag: RT, sol: neg(RT) }[yer]; return [V.cross(y, z), y, z]; };
  const rot = (v, k, a) => { const c = Math.cos(a), s = Math.sin(a); return V.add(V.add(V.mul(v, c), V.mul(V.cross(k, v), s)), V.mul(k, V.dot(k, v) * (1 - c))); };

  // Bir oturum: sensör masada (sapma ölçümü) → silah elde, nişan titremesi hiç durmadan sürer → atışlar.
  // Konum = çapa (A: atış sonrası ve sıfıra dönüş) + titreme (W) + tetik hatası (E). Hepsi derece; X sağ+, Y yukarı+.
  function session(yer, yon, shots, o) {
    o = o || {};
    const [xs, ys, zs] = axes(yer, yon);
    P.reset(); P.bias0 = null;
    Object.assign(P.cfg, { B: yon === 'arka' ? [0, -1, 0] : [0, 1, 0], invX: false, invY: false, U: null, yer, thr: 0.6, lockout: 450, mic: 'kapali' });
    P.micOn = false;
    const keep = ['onShot', 'onFire', 'onSample', 'onRaw', 'onCal', 'onGap'].map(k => [k, P[k]]);
    const got = []; P.onShot = m => got.push(m); P.onFire = P.onSample = P.onRaw = P.onCal = P.onGap = null;
    const bias = [0.4, -0.3, 0.2], gn = 0.05;
    let t = 0, X = 0, Y = 0, lx = null, ly = null, jerkNext = 0, cant = 0;
    const A = { x: 0, y: 0 }, E = { x: 0, y: 0 };
    const W = { x: 0, y: 0, ox: 0, oy: 0, vx: 0, vy: 0, ph: 0, sig: 0, mod: 'ou', tau: 0.35, on: false };
    const wobStep = () => {
      if (!W.on || !W.sig) return;
      if (W.mod === 'osc') {   // yumuşak salınım (~1.2 Hz) + küçük el titremesi (9 Hz)
        const w0 = 2 * Math.PI * 1.2, z = 0.6, qs = W.sig * Math.sqrt(4 * z * w0 * w0 * w0), dt = 0.001;
        W.vx += (-w0 * w0 * W.ox - 2 * z * w0 * W.vx) * dt + qs * Math.sqrt(dt) * gauss(); W.ox += W.vx * dt;
        W.vy += (-w0 * w0 * W.oy - 2 * z * w0 * W.vy) * dt + qs * Math.sqrt(dt) * gauss(); W.oy += W.vy * dt;
        W.ph += 2 * Math.PI * 9 * dt; W.x = W.ox + 0.15 * W.sig * Math.sin(W.ph); W.y = W.oy + 0.15 * W.sig * Math.cos(W.ph * 1.07);
      } else {                 // Ornstein–Uhlenbeck (pürüzlü gezinme)
        const k = Math.sqrt(2 / W.tau) * W.sig * Math.sqrt(0.001);
        W.x += -W.x / W.tau * 0.001 + k * gauss(); W.y += -W.y / W.tau * 0.001 + k * gauss();
      }
    };
    const step = (ms, fn) => {
      for (let i = 0; i < ms; i++) {
        wobStep(); if (fn) fn(i);
        X = A.x + W.x + E.x; Y = A.y + W.y + E.y;
        if ((t % 5) === 4) {
          const yawRate = lx == null ? 0 : (X - lx) / 0.005, pitchRate = ly == null ? 0 : (Y - ly) / 0.005; lx = X; ly = Y;
          // eğim (o.incl): silah sağ eksen çevresinde kalkık/eğik; sağ-sol kayma silahın kendi "yukarı" ekseni çevresinde
          const ia = (o.incl || 0) * Math.PI / 180, Ug = rot(U, RT, ia);
          const w = V.add(V.mul(Ug, -yawRate), V.mul(RT, pitchRate));
          const ca = cant * Math.PI / 180, ax = [rot(xs, F, ca), rot(ys, F, ca), rot(zs, F, ca)].map(a => rot(a, RT, ia));
          const om = ax.map((a, k) => V.dot(w, a) + bias[k] + gauss() * gn);
          const acc = ax.map(a => V.dot(U, a) + gauss() * 0.003);
          const jerk = jerkNext || 0.02; jerkNext = 0;
          P.feed(t, acc, om, jerk, null);
        }
        t++;
      }
    };
    step(4500, null);                                     // masada: jiroskop sapması ölçülür
    W.on = true; W.mod = o.mod || 'ou'; W.sig = o.hold == null ? 0.01 : o.hold; W.tau = o.tau || 0.35;
    step(2000, null);                                     // ele alındı, titreme oturdu
    P.startRef(); P.armed = true;
    const truth = [];
    for (const s of shots) {
      if (s.hold != null) W.sig = s.hold;
      if ((s.cant || 0) !== cant) { cant = s.cant || 0; step(900, null); }
      step(1300, null);                                   // nişan alma
      const prof = s.prof || 'yumusak';
      const f = u => prof === 'ani' ? Math.max(0, (u - 0.73) / 0.27) : prof === 'erken' ? Math.min(1, u / 0.4) : u * u * (3 - 2 * u);
      const w0 = [W.x, W.y];
      step(150, i => { const k = f((i + 1) / 150); E.x = (s.fx || 0) * k; E.y = (s.fy || 0) * k; });   // tetik
      jerkNext = s.live ? 60 : 3;                          // kırılma darbesi
      truth.push({ s, wx: W.x - w0[0], wy: W.y - w0[1] });
      A.x += E.x; A.y += E.y; E.x = E.y = 0;
      const a0 = [A.x, A.y];
      step(650, i => { const k = Math.min(1, i / 120); A.x = a0[0] + (s.postx || 0) * k; A.y = a0[1] + (s.posty || 0) * k; });   // takip
      step(250, () => { A.x *= 0.98; A.y *= 0.98; });     // sıfıra dönüş
    }
    step(800, null);
    P.flush(); P.armed = false;
    for (const [k, v] of keep) P[k] = v;
    return { got, truth };
  }

  const MAPP = { 12: ['bilek_yukari', 'geri_tepme'], 1: ['avucla_itme', 'geri_tepme'], 2: ['avucla_itme', 'basparmak'], 3: ['basparmak', 'az_parmak'], 4: ['siki_tutus', 'az_parmak'], 5: ['siki_tutus', 'bilek_asagi'], 6: ['bilek_asagi', 'ileri_itme'], 7: ['tokatlama', 'bilek_asagi'], 8: ['tokatlama', 'tum_el'], 9: ['fazla_parmak', 'tokatlama'], 10: ['geri_tepme', 'fazla_parmak'], 11: ['geri_tepme', 'bilek_yukari'] };
  const scale = H.scaleFor('pistol', 'normal');
  const sess = hand => ({ weapon: 'pistol', diff: 'normal', hand, handMode: 'normal', drill: 'serbest', mode: 'kuru' });
  const toQ = m => ({ sc: Math.max(0, Math.min(100, 100 * Math.exp(-(m.trig + 0.15 * m.hold) / scale))), h: H.hourOf(m.dx, m.dy), ca: m.cant, po: m.post, tr: m.trig, ho: m.hold, dx: m.dx, dy: m.dy, wv: m.wv == null ? null : m.wv });
  // her atış için düz kayıt: ölçüm + gerçek + yeni/eski teşhis
  const rec = (m, tr, hand) => {
    const q = toQ(m), s = tr.s; const F = Math.hypot(s.fx || 0, s.fy || 0);
    return { sc: q.sc, h: q.h, d: Math.hypot(m.dx, m.dy), wv: m.wv, tr: m.trig, ho: m.hold, po: m.post, ca: m.cant, ang: Math.atan2(m.dx, m.dy) * 180 / Math.PI,
      F, fang: F ? Math.atan2(s.fx, s.fy) * 180 / Math.PI : null, w: Math.hypot(tr.wx, tr.wy), hold: s.hold, prof: s.prof || 'yumusak', cant: s.cant || 0,
      yeni: H.diagnose(q, sess(hand || 'R')), eski: H.diagnose(Object.assign({}, q, { wv: null }), sess(hand || 'R')),
      yeniL: H.diagnose(q, sess('L')), eskiL: H.diagnose(Object.assign({}, q, { wv: null }), sess('L')) };
  };
  const run = (yer, yon, shots, o) => { const { got, truth } = session(yer, yon, shots, o); return got.length === truth.length ? got.map((m, i) => rec(m, truth[i])) : { hata: `atış sayısı ${got.length}/${truth.length}` }; };
  const dirShots = (mag, n, extra) => { const out = []; for (let i = 0; i < n; i++) { const h = 1 + (i % 12); const a = (h * 30 + (rnd() - 0.5) * 20) * Math.PI / 180; out.push(Object.assign({ fx: Math.sin(a) * mag, fy: Math.cos(a) * mag, hour: h }, extra)); } return out; };

  const R = { mounts: {}, profiles: {}, titreme: {}, karisik: {}, kant: {}, takip: null };
  // 1) Yön: 8 montaj × 12 saat × 3 büyüklük, sağlam tutuş
  for (const [yer, yon] of [['alt', 'ileri'], ['ust', 'ileri'], ['sag', 'ileri'], ['sol', 'ileri'], ['alt', 'arka'], ['ust', 'arka'], ['sag', 'arka'], ['sol', 'arka']]) {
    const shots = [...dirShots(0.06, 12), ...dirShots(0.15, 12), ...dirShots(0.35, 12)];
    R.mounts[yer + '/' + yon] = run(yer, yon, shots, { hold: 0.01 });
  }
  // 2) Tetik hareketi biçimi
  for (const prof of ['yumusak', 'ani', 'erken']) R.profiles[prof] = run('alt', 'ileri', dirShots(0.2, 12, { prof }), { hold: 0.02 });
  // 3) Yalnız titreme (tetik temiz) — iki titreme modeli
  for (const mod of ['ou', 'osc']) for (const hold of [0.03, 0.05, 0.1, 0.2]) {
    const shots = []; for (let i = 0; i < 30; i++) shots.push({ fx: 0, fy: 0 });
    R.titreme[mod + ' ' + hold] = run('alt', 'ileri', shots, { hold, mod });
  }
  // 4) Karışık atıcılar: her oturumda farklı titreme; atışların %35'i temiz, kalanında farklı büyüklük/yön/biçimde tetik hatası
  for (let k = 0; k < 24; k++) {
    const mod = k % 2 ? 'osc' : 'ou', hold = 0.02 + rnd() * 0.13; const shots = [];
    for (let i = 0; i < 20; i++) {
      if (rnd() < 0.35) { shots.push({ fx: 0, fy: 0 }); continue; }
      const mag = Math.exp(Math.log(0.03) + rnd() * Math.log(0.5 / 0.03)), a = rnd() * 2 * Math.PI;
      shots.push({ fx: Math.sin(a) * mag, fy: Math.cos(a) * mag, prof: ['yumusak', 'ani', 'erken'][Math.floor(rnd() * 3)] });
    }
    R.karisik['o' + k] = run(['alt', 'sag', 'ust', 'sol'][k % 4], k % 3 ? 'ileri' : 'arka', shots, { hold, mod });
  }
  // 5) Kanting
  for (const [yer, yon] of [['alt', 'ileri'], ['sag', 'ileri'], ['ust', 'arka']]) R.kant[yer + '/' + yon] = run(yer, yon, [0, 0, 1.5, 3, -3, 5].map(c => ({ fx: 0.01, fy: 0.01, cant: c })), { hold: 0.01 });
  // 6) Takibi bırakma (kuru)
  R.takip = run('alt', 'ileri', [{ fx: 0.02, fy: 0, posty: -0.6 }, { fx: 0.02, fy: 0 }, { fx: -0.1, fy: -0.1, postx: 0.5 }, { fx: 0.3, fy: 0 }], { hold: 0.01 });
  // 7) Eğimli atış: hedef aşağıda ya da yukarıda (namlu −40…+40°); sağ-sol ve yukarı-aşağı kayma nişan hattına göre ölçülmeli
  R.egim = {};
  for (const incl of [0, 15, -15, 30, -30, 40, -40]) {
    const { got, truth } = session('alt', 'ileri', dirShots(0.3, 12), { hold: 0.004, incl });
    R.egim[incl] = got.length === truth.length ? got.map((m, i) => ({ dx: m.dx, dy: m.dy, tx: truth[i].s.fx + truth[i].wx, ty: truth[i].s.fy + truth[i].wy, ca: m.cant }))
      : { hata: `atış sayısı ${got.length}/${truth.length}` };
  }
  R.MAPP = MAPP; R.scale = scale;
  return R;
}

// ---------------------------------------------------------------- değerlendirme
const hourOfDeg = a => { if (a < 0) a += 360; const h = Math.round(a / 30) % 12; return h === 0 ? 12 : h; };
const angDiff = (a, b) => { let d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };
const mirror = h => (12 - h) % 12 || 12;
const pct = (a, b) => b ? Math.round(a / b * 1000) / 10 : null;
function evaluate(R) {
  const MAPP = R.MAPP, CLOCK = new Set(Object.values(MAPP).flat()); const isClock = c => c && CLOCK.has(c);
  const E = { yon: {}, bicim: {}, titreme: {}, karisik: {}, kant: {}, takip: [] };
  // 1) yön ve neden (sağ/sol el)
  let all = { n: 0, saat: 0, saat1: 0, neden: 0, nedenL: 0, maxHata: 0 };
  for (const [k, v] of Object.entries(R.mounts)) {
    if (!Array.isArray(v)) { E.yon[k] = v; continue; }
    const e = { n: 0, saat: 0, saat1: 0, nedenR: 0, nedenL: 0, maxAci: 0, buyuklukHata: 0, yeniEskiAyni: 0 };
    for (const r of v) {
      const th = hourOfDeg(r.fang), err = angDiff(r.ang, r.fang); e.n++; if (r.h === th) e.saat++; if (err <= 30) e.saat1++; e.maxAci = Math.max(e.maxAci, err);
      e.buyuklukHata += Math.abs(r.d - r.F) / r.F;
      if (r.sc >= 85 || r.yeni[0] === MAPP[th][0]) e.nedenR++; if (r.sc >= 85 || r.yeniL[0] === MAPP[mirror(th)][0]) e.nedenL++;
      if (JSON.stringify(r.yeni) === JSON.stringify(r.eski)) e.yeniEskiAyni++;
    }
    e.buyuklukHata = +(e.buyuklukHata / e.n * 100).toFixed(1); e.maxAci = +e.maxAci.toFixed(1); E.yon[k] = e;
    all.n += e.n; all.saat += e.saat; all.saat1 += e.saat1; all.neden += e.nedenR; all.nedenL += e.nedenL; all.maxHata = Math.max(all.maxHata, e.maxAci);
  }
  E.yonOzet = { atis: all.n, saatTamYuzde: pct(all.saat, all.n), birSaatIcindeYuzde: pct(all.saat1, all.n), nedenSagElYuzde: pct(all.neden, all.n), nedenSolElYuzde: pct(all.nedenL, all.n), enBuyukAciHatasi: all.maxHata };
  for (const [k, v] of Object.entries(R.profiles)) E.bicim[k] = { atis: v.length, saatTam: v.filter(r => r.h === hourOfDeg(r.fang)).length, birSaat: v.filter(r => angDiff(r.ang, r.fang) <= 30).length, nedenDogru: v.filter(r => r.sc >= 85 || r.yeni[0] === MAPP[hourOfDeg(r.fang)][0]).length };
  // 3) temiz tetik + titreme: saat yönüne dayalı (yanlış) tetik hatası söylenme oranı
  for (const [k, v] of Object.entries(R.titreme)) {
    const low = v.filter(r => r.sc < 85);
    E.titreme[k] = { atis: v.length, skorOrt: +(v.reduce((a, r) => a + r.sc, 0) / v.length).toFixed(1), skor85alti: low.length,
      eskiYanlisTetik: low.filter(r => isClock(r.eski[0])).length, yeniYanlisTetik: low.filter(r => isClock(r.yeni[0])).length,
      yeniGezinme: low.filter(r => r.yeni[0] === 'gezinme').length, wvOrt: +(v.reduce((a, r) => a + (r.wv || 0), 0) / v.length).toFixed(4) };
  }
  // 4) karışık: her atışın gerçek "baskın sorunu" — tetik penceresindeki hareketi tetik hatası mı (F ≥ 1.5·|titreme|) yoksa titreme mi (F ≤ 0.5·|titreme|) belirledi
  const mixed = Object.values(R.karisik).flat().filter(r => r && r.sc != null);
  const lab = r => r.F >= 1.5 * r.w && r.F >= 0.03 ? 'tetik' : r.F <= 0.5 * r.w ? 'titreme' : 'belirsiz';
  const judge = (r, c) => { const L = lab(r); if (L === 'belirsiz') return null;
    if (L === 'tetik') return isClock(c[0]) && angDiff(r.ang, r.fang) <= 45 && c[0] === MAPP[r.h][0] ? (r.h === hourOfDeg(r.fang) ? 2 : 1) : 0;
    return isClock(c[0]) ? 0 : 2; };
  const low = mixed.filter(r => r.sc < 85);
  const sum = key => { let n = 0, ok = 0, ok1 = 0, byL = { tetik: [0, 0], titreme: [0, 0] };
    for (const r of low) { const j = judge(r, r[key]); if (j == null) continue; n++; const L = lab(r); byL[L][1]++; if (j === 2) { ok++; ok1++; byL[L][0]++; } else if (j === 1) { ok1++; byL[L][0]++; } }
    return { degerlendirilen: n, dogruYuzde: pct(ok, n), birSaatToleransliYuzde: pct(ok1, n), tetikHatasiniBulma: `${byL.tetik[0]}/${byL.tetik[1]} (%${pct(byL.tetik[0], byL.tetik[1])})`, titremeyiTetikSanmama: `${byL.titreme[0]}/${byL.titreme[1]} (%${pct(byL.titreme[0], byL.titreme[1])})` }; };
  E.karisik = { atis: mixed.length, skor85alti: low.length, etiketler: { tetik: low.filter(r => lab(r) === 'tetik').length, titreme: low.filter(r => lab(r) === 'titreme').length, belirsiz: low.filter(r => lab(r) === 'belirsiz').length },
    eski: sum('eski'), yeni: sum('yeni') };
  // eşik taraması (yalnız değerlendirme; uygulama TRIG_SNR kullanır)
  E.esikTaramasi = {};
  for (const Z of [1.25, 1.5, 1.75, 2, 2.5, 3]) {
    let n = 0, ok = 0, t = [0, 0], w = [0, 0];
    for (const r of low) { const L = lab(r); if (L === 'belirsiz') continue; n++;
      const clear = r.wv == null || (r.d >= Z * r.wv && r.d >= 0.1 * R.scale);
      const good = L === 'tetik' ? clear && angDiff(r.ang, r.fang) <= 45 : !clear;
      if (good) ok++; if (L === 'tetik') { t[1]++; if (good) t[0]++; } else { w[1]++; if (good) w[0]++; } }
    E.esikTaramasi['Z=' + Z] = { dogru: pct(ok, n), tetikBulma: pct(t[0], t[1]), titremeAyirma: pct(w[0], w[1]) };
  }
  for (const [k, v] of Object.entries(R.kant)) E.kant[k] = v.map(r => ({ gercek: r.cant, olculen: +r.ca.toFixed(2), uyari: r.yeni.includes('kanting') }));
  E.takip = R.takip.map(r => ({ post: +r.po.toFixed(3), yeni: r.yeni, eski: r.eski }));
  return E;
}

(async () => {
  const srv = await serve(PORT); const browser = await chromium.launch();
  const { page, errs } = await openApp(browser, { port: PORT });
  const R = await page.evaluate(pageSide);
  const E = evaluate(R);

  section('Yön: sağlam tutuş, 8 montaj × 12 saat × 3 büyüklük (0,06° / 0,15° / 0,35°)');
  const yo = E.yonOzet;
  console.log(`  saat tam: %${yo.saatTamYuzde} · bir saat içinde: %${yo.birSaatIcindeYuzde} · en büyük açı hatası ${yo.enBuyukAciHatasi}°`);
  for (const [k, e] of Object.entries(E.yon)) check(e.n === 36 && e.saat1 === e.n, `${k}: 36 atışın hepsi ölçüldü, yön bir saat içinde`, e);
  check(yo.saatTamYuzde >= 90, 'Saat yönü tam isabet en az %90', yo.saatTamYuzde);
  check(yo.nedenSagElYuzde >= 95 && yo.nedenSolElYuzde >= 95, 'Doğru neden (sağ el ve sol el şeması) en az %95', [yo.nedenSagElYuzde, yo.nedenSolElYuzde]);

  section('Tetik hareketinin biçimi: yumuşak, son anda ani, erken');
  for (const [k, e] of Object.entries(E.bicim)) check(e.atis === 12 && e.birSaat === 12 && e.nedenDogru >= 11, `${k}: 12 yönün hepsi bir saat içinde, neden en az 11/12`, e);

  section('Tetik temiz, yalnız nişan titremesi (iki titreme modeli, 0,03°–0,2°)');
  let low = 0, yanlis = 0, eskiYanlis = 0;
  for (const [k, e] of Object.entries(E.titreme)) {
    low += e.skor85alti; yanlis += e.yeniYanlisTetik; eskiYanlis += e.eskiYanlisTetik;
    check(e.yeniYanlisTetik <= Math.max(1, 0.2 * e.skor85alti), `${k}°: skoru 85 altı ${e.skor85alti} atışın ${e.yeniYanlisTetik}'inde tetik hatası söylendi (eski yöntem: ${e.eskiYanlisTetik})`);
  }
  check(yanlis <= 0.12 * low, `Toplam: titremeyi tetik hatası sanma %${Math.round(yanlis / low * 100)} (eski yöntem %${Math.round(eskiYanlis / low * 100)})`, { yanlis, low });

  section('Karışık atıcılar: 24 oturum, 480 atış (temiz tetik, küçük–büyük tetik hataları, farklı titremeler)');
  const k = E.karisik;
  console.log(`  değerlendirilen ${k.yeni.degerlendirilen} atış (tetik hatası baskın ${k.etiketler.tetik}, titreme baskın ${k.etiketler.titreme}; ${k.etiketler.belirsiz} belirsiz atış dışarıda)`);
  console.log(`  eski: doğru %${k.eski.dogruYuzde} · tetik hatasını bulma ${k.eski.tetikHatasiniBulma} · titremeyi tetik sanmama ${k.eski.titremeyiTetikSanmama}`);
  console.log(`  yeni: doğru %${k.yeni.dogruYuzde} · tetik hatasını bulma ${k.yeni.tetikHatasiniBulma} · titremeyi tetik sanmama ${k.yeni.titremeyiTetikSanmama}`);
  const num = s => parseFloat(String(s).split('%')[1]);
  check(k.yeni.dogruYuzde >= 65 && k.yeni.dogruYuzde >= k.eski.dogruYuzde + 30, 'Doğru teşhis en az %65 ve eski yöntemden en az 30 puan iyi', [k.eski.dogruYuzde, k.yeni.dogruYuzde]);
  check(num(k.yeni.tetikHatasiniBulma) >= 60, 'Baskın tetik hataları en az %60 bulunuyor (yön ±45°)', k.yeni.tetikHatasiniBulma);
  check(num(k.yeni.titremeyiTetikSanmama) >= 85, 'Baskın titreme en az %85 tetik hatası sanılmıyor', k.yeni.titremeyiTetikSanmama);
  console.log('  eşik taraması (uygulamada 1,75): ' + Object.entries(E.esikTaramasi).map(([z, v]) => `${z} %${v.dogru}`).join(' · '));

  section('Kanting (yana yatırma) ölçümü');
  for (const [m, v] of Object.entries(E.kant)) check(v.every(r => Math.abs(r.olculen - r.gercek) <= 0.3 && r.uyari === (Math.abs(r.gercek) >= 2.5)), `${m}: 0 / 1,5 / ±3 / 5° doğru ölçülüyor (±0,3°), uyarı 2,5°'den itibaren`, v);

  section('Takibi bırakma (kuru tetik)');
  const t = E.takip;
  check(t[0].yeni.includes('takip') && t[2].yeni.includes('takip') && !t[1].yeni.includes('takip') && !t[3].yeni.includes('takip'), 'Atış sonrası 0,5–0,6° düşme/kayma → takip; sabit kalınca yok', t);
  section('Eğimli atış: hedef aşağıda ya da yukarıda (namlu −40…+40°)');
  const med = a => { const o = a.slice().sort((x, y) => x - y); return o.length ? o[Math.floor((o.length - 1) / 2)] : NaN; };
  for (const [incl, arr] of Object.entries(R.egim)) {
    if (!Array.isArray(arr)) { check(false, `Namlu ${incl}°: ölçüm`, arr); continue; }
    const rx = med(arr.filter(a => Math.abs(a.tx) > 0.1).map(a => a.dx / a.tx)), ry = med(arr.filter(a => Math.abs(a.ty) > 0.1).map(a => a.dy / a.ty));
    const dir = arr.filter(a => angDiff(Math.atan2(a.dx, a.dy) * 180 / Math.PI, Math.atan2(a.tx, a.ty) * 180 / Math.PI) <= 12).length / arr.length;
    const caMax = Math.max(...arr.map(a => Math.abs(a.ca)));
    check(Math.abs(rx - 1) <= 0.05 && Math.abs(ry - 1) <= 0.05 && dir >= 0.95 && caMax < 1,
      `Namlu ${incl > 0 ? '+' : ''}${incl}°: sağ-sol ×${rx.toFixed(3)}, yukarı-aşağı ×${ry.toFixed(3)} (gerçeğe oran, ±%5), yön doğru %${Math.round(dir * 100)}, sahte kanting yok (en çok ${caMax.toFixed(2)}°)`,
      { rx, ry, dir, caMax });
  }
  check(errs.length === 0, 'Sayfa hatası yok', errs);
  await browser.close(); srv.close();
  process.exit(finish('Nişan doğruluk testi') ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
