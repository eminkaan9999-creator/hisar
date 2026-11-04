// Dayanıklılık testi: uzun gerçek atış oturumu (250 atış, ~12 dk sanal saat, ham kayıt açık) — bütün atışlar algılanıyor mu,
// yön doğru mu, işleme hızı sabit mi, oturum kaydedilip geri okunuyor mu, ekranlar açılıyor mu.
'use strict';
const { serve, check, section, finish, openApp, chromium } = require('./ortak');
const PORT = 8798;
function pageSide(scn) {
  const H = window.__hisar, P = H.proc;
  const realNow = performance.now.bind(performance); let VT = realNow() + 1e6;
  Object.defineProperty(performance, 'now', { value: () => VT, configurable: true });
  let seed = 777 + (scn.tohum || 0); const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const gauss = () => { let u = 0; while (!u) u = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rnd()); };
  const D = Math.PI / 180;
  const add = (a, b) => a.map((x, i) => x + b[i]), mul = (a, k) => a.map(x => x * k), dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const len = a => Math.hypot(a[0], a[1], a[2]);
  const rot = (v, k, ang) => { const c = Math.cos(ang), s = Math.sin(ang); return add(add(mul(v, c), mul(cross(k, v), s)), mul(k, dot(k, v) * (1 - c))); };
  const U = [0, 0, 1];
  let Fg = [0, 1, 0], Rg = [1, 0, 0], Ug = [0, 0, 1];              // silahın ileri, sağ, yukarı eksenleri (dünyada)
  const yAx = scn.arka ? mul(Fg, -1) : Fg, zAx = scn.yuz === 'yukari' ? Ug : scn.yuz === 'sag' ? Rg : mul(Ug, -1);
  let S = [cross(yAx, zAx), yAx, zAx];                               // sensör eksenleri
  const mis = scn.kayma || [0, 0, 0];                                // bant kayması: sapma, yunuslama, yatma (derece)
  S = S.map(v => rot(rot(rot(v, U, mis[0] * D), Rg, mis[1] * D), Fg, mis[2] * D));
  const bias = [0.6, -0.4, 0.3];
  let t = 0, jerkNext = 0;
  const turn = (w, dt) => { const m = len(w); if (m < 1e-12) return; const k = mul(w, 1 / m), a = m * dt * D; Fg = rot(Fg, k, a); Rg = rot(Rg, k, a); Ug = rot(Ug, k, a); S = S.map(v => rot(v, k, a)); };
  const step5 = (pr, yr, rr) => {                                    // 5 ms: yunuslama (yukarı +), sapma (sağ +), yatma (sağa +) °/sn
    const w = add(add(mul(Rg, pr), mul(U, -yr)), mul(Fg, rr));
    turn(w, 0.005); t += 5; VT += 5;
    const om = S.map((s, i) => dot(w, s) + bias[i] + gauss() * 0.05);
    const acc = S.map(s => dot(U, s) + gauss() * 0.003);
    const j = jerkNext || 0.02; jerkNext = 0;
    P.feed(t, acc, om, j, null);
  };
  const hold = (ms, sig) => { for (let i = 0; i < ms / 5; i++) step5(gauss() * (sig || 0.3), gauss() * (sig || 0.3), 0); };
  const move = (ms, pDeg, yDeg, rDeg) => { const n = ms / 5; for (let i = 0; i < n; i++) { const u = (i + 0.5) / n, k = 6 * u * (1 - u) / ms * 1000; step5(pDeg * k, yDeg * k, (rDeg || 0) * k); } };

  H.selectSource('sensor', false);
  const m = H.S.mount.sensor; Object.assign(m, { axis: '+y', yon: 'ileri', yer: 'alt', B: null, U: null, invX: false, invY: false });
  H.applyCfg(); P.reset(); P.bias0 = null;
  for (let i = 0; i < 1000; i++) step5(0, 0, 0);
  hold(1500, 0.2);
  H.wizardAxis(); hold(1600, 0.15); move(900, 15, 0); hold(300, 0.15); move(900, -15, 0); hold(500, 0.15); move(900, 0, 15); hold(400, 0.15); move(900, 0, -15); hold(300, 0.15);
  { const c = document.querySelector('#sheet [data-close]'); if (c) c.click(); }
  H.S.mode = 'gercek'; H.S.rawRec = true; H.openDrill('serbest'); H.startRun();
  if (!(H.cur.run && H.cur.run.active)) return { hata: 'oturum başlamadı' };
  const N = 250, blok = [], truth = []; let t0 = realNow();
  for (let i = 0; i < N; i++) {
    const clean = rnd() < 0.3, h = 1 + Math.floor(rnd() * 12), mag = clean ? 0 : 0.1 + rnd() * 0.4, a = h * 30 * D;
    const fx = Math.sin(a) * mag, fy = Math.cos(a) * mag;
    hold(1000 + Math.floor(rnd() * 200) * 5, 0.3 + rnd() * 0.5);
    move(150, fy, fx); jerkNext = 60; truth.push(clean ? 0 : h);
    const fp = 5 + rnd() * 3, fyw = (rnd() - 0.5) * 2; move(70, fp, fyw); move(330, -fp, -fyw);   // tepme: namlu kalkar, atıcı geri indirir hold(300, 0.4); move(250, -fy, -fx);
    if ((i + 1) % 50 === 0) { const e = realNow(); blok.push(+((e - t0) / 50).toFixed(1)); t0 = e; }
  }
  hold(900, 0.3);
  const s = H.cur.sess, shots = s.shots.length;
  const tam = s.shots.filter((q, i) => truth[i] && q.sc < 85 && H.trigClear(q, s) ? q.h === truth[i] : true).length;
  H.stopRun(false);
  const key = Object.keys(localStorage).find(k => k.endsWith('.s.' + s.id));
  const kayit = key ? localStorage.getItem(key).length : 0;
  const yeniden = key ? JSON.parse(localStorage.getItem(key)).shots.length : 0;
  const ham = H.raw && (H.raw.n || 0);
  // ekranlar: oturum özeti, grafik, iz, skor
  const ekran = []; try { H.openReview(s); for (const sub of ['ozet', 'grafik', 'iz', 'skor']) { H.setSub(sub); ekran.push(sub); } } catch (e) { ekran.push('HATA ' + e.message); }
  return { shots, N, tam, blok, kayit, yeniden, ham, ekran, toast: document.querySelector('#toast').hidden ? '' : document.querySelector('#toast').textContent };
}
(async () => {
  const srv = await serve(PORT); const browser = await chromium.launch();
  const { ctx, page, errs } = await openApp(browser, { port: PORT });
  const r = await page.evaluate(pageSide, { ad: 'dayaniklilik', yuz: 'asagi', kayma: [4, 3, 4] });
  section('Uzun gerçek atış oturumu: 250 atış (~12 dk), ham kayıt açık');
  console.log('  ' + JSON.stringify(r));
  check(r.shots === r.N, `Bütün atışlar algılandı (${r.shots}/${r.N})`);
  check(r.tam >= r.N - 5, `Tetik hatası belirgin atışlarda saat yönü doğru (${r.tam}/${r.N})`);
  check(r.blok.length === 5 && r.blok[4] < r.blok[0] * 2 + 30, `İşleme hızı oturum boyunca sabit (50 atışlık bloklar, ms/atış: ${r.blok.join(' · ')})`);
  check(r.yeniden === r.N && r.kayit > 0 && r.kayit < 600000, `Oturum kaydedildi ve geri okunuyor (${r.yeniden} atış, ${Math.round(r.kayit / 1024)} KB)`);
  check(r.ekran.length === 4 && !r.ekran.some(x => /HATA/.test(x)), 'Özet, grafik, iz ve skor ekranları açılıyor', r.ekran);
  check(!errs.length, 'Sayfa hatası yok', errs);
  await ctx.close(); await browser.close(); srv.close();
  process.exit(finish('Dayanıklılık testi') ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
