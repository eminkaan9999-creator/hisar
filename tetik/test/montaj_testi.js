// Montaj testi (uçtan uca): sensör silahın altına bantla, eğri takılmış (bant kayması) → gerçek dönme hareketleri →
// sensör ham verisi → uygulamanın yön testi sihirbazı → uygulamanın kendi oturumu (Başla, atış, teşhis).
// Sanal saat: performance.now sayfada değiştirilir; sihirbazın bekleme süreleri anında geçer, sonuç her seferinde aynıdır.
// Kapsam: ekran aşağı/yukarı, ileri/arka, yandan takma, yanlış elle ayar, yön testi yok, testten sonra farklı takma,
// gerçek atışta ters yön uyarısı, Başla'daki montaj sorusu, sensör testi sihirbazı.
'use strict';
const { serve, check, section, finish, openApp, chromium } = require('./ortak');
const PORT = 8795;

function pageSide(scn) {
  const H = window.__hisar, P = H.proc;
  let VT = performance.now() + 1e6;
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
  const out = { ayar: scn.ad };
  H.selectSource('sensor', false);                                   // kaynak sensör (Bluetooth bağlantısı kurmadan, veri doğrudan)
  const m = H.S.mount.sensor; Object.assign(m, { axis: '+y', yon: scn.ayarYon || 'ileri', yer: 'alt', B: null, U: null, invX: false, invY: false, at: 0, onay: 0 });
  H.applyCfg(); P.reset(); P.bias0 = null;
  for (let i = 0; i < 1000; i++) step5(0, 0, 0);                    // masada 5 sn: jiroskop sapması
  if (scn.sensorTesti) {
    Object.assign(H.ble, scn.sensorTesti.ble || {});
    H.wizardSensor();
    if (scn.sensorTesti.kipir) { move(2000, 4, 3); for (let i = 0; i < 700; i++) step5(0, 0, 0); } else for (let i = 0; i < 1100; i++) step5(0, 0, 0);
    out.sensorTesti = { satir: (window.__sensorTest || []).map(x => x.st + ':' + x.ad), sonuc: ((document.querySelector('#stSonuc') || document.querySelector('#stOut') || {}).textContent || '').trim(), sapma: P.bias.map(v => +v.toFixed(2)) };
    return out;
  }
  hold(1500, 0.2);                                                   // silah elde
  if (scn.yonTesti) {
    H.wizardAxis();
    hold(1600, 0.15);                                                // 1/3: düz ve sabit
    move(900, 15, 0); hold(300, 0.15); move(900, -15, 0); hold(500, 0.15);   // 2/3: kaldır, indir
    move(900, 0, 15); hold(400, 0.15); move(900, 0, -15); hold(300, 0.15);    // 3/3: sağa çevir, geri
    out.test = { tamam: !!m.B && /Tamam/.test((document.querySelector('#axMsg') || {}).textContent || ''), at: m.at };
    const c = document.querySelector('#sheet [data-close]'); if (c) c.click();
  }
  if (scn.sonra) { const k = scn.sonra === 'ters' ? Fg : Ug; S = S.map(v => rot(v, k, Math.PI)); for (let i = 0; i < 400; i++) step5(0, 0, 0); }
  if (scn.eskiTest) { m.at = Date.now() - 9 * 3600 * 1000; m.onay = 0; }
  out.soru = H.mountPrompt();
  // Başla düğmesi: montaj sorusu
  H.S.mode = scn.mod || 'kuru'; H.openDrill('serbest');
  const btn = document.querySelector('#btnStart'); if (btn) btn.click();
  out.pencere = document.querySelector('#sheet').hidden ? '' : document.querySelector('#sheetTitle').textContent;
  if (out.pencere) { const go = document.querySelector('#mpGo'); out.dugme = go ? go.textContent : ''; if (go) go.click(); }
  out.onay = m.onay;
  if (!(H.cur.run && H.cur.run.active)) { out.hata = 'oturum başlamadı'; return out; }
  const truth = []; const live = (scn.mod || 'kuru') !== 'kuru';
  for (let i = 0; i < (scn.atis || 24); i++) {
    const h = 1 + (i % 12), mag = i < 12 ? 0.15 : 0.35, a = h * 30 * D, fx = Math.sin(a) * mag, fy = Math.cos(a) * mag;
    hold(1300, 0.4);
    move(150, fy, fx);                                               // tetik hatası: yukarı fy, sağa fx
    jerkNext = live ? 60 : 3; truth.push(h);
    if (live) { move(70, 6, 0); move(330, -6, 0); hold(300, 0.4); } else hold(650, 0.4);   // gerçek atış: namlu her zaman yukarı kalkar
    move(250, -fy, -fx);
  }
  hold(900, 0.3);
  const s = H.cur.sess;
  out.toast = document.querySelector('#toast').hidden ? '' : document.querySelector('#toast').textContent;
  out.atis = s.shots.map((q, i) => ({ gercek: truth[i], saat: q.h, kant: q.ca, neden: q.c }));
  out.yt = s.yt; out.supheli = !!s.yonSupheli;
  H.stopRun(false);
  return out;
}

const near = (a, b) => { const d = Math.abs(a - b) % 12; return Math.min(d, 12 - d) <= 1; };
async function run(browser, scn) {
  const { ctx, page, errs } = await openApp(browser, { port: PORT });
  const r = await page.evaluate(pageSide, scn); r.errs = errs; await ctx.close();
  if (r.atis) { r.n = r.atis.length; r.tam = r.atis.filter(a => a.saat === a.gercek).length; r.yakin = r.atis.filter(a => near(a.saat, a.gercek)).length;
    r.kantMax = Math.max(...r.atis.map(a => Math.abs(a.kant))); r.kantUyari = r.atis.filter(a => a.neden.includes('kanting')).length; }
  return r;
}

(async () => {
  const srv = await serve(PORT); const browser = await chromium.launch();

  section('Yön testi ile: bantla eğri takılmış sensör, her yönde doğru ölçüm');
  for (const scn of [
    { ad: 'Silahın altı, ekran aşağı, ileri; bant kayması 6°/4°/5°', yuz: 'asagi', kayma: [6, 4, 5], yonTesti: true },
    { ad: 'Silahın altı, ekran yukarı, ARKAYA bakıyor (ayar İLERİ kalmış); kayma -7°/-3°/-6°', yuz: 'yukari', arka: true, kayma: [-7, -3, -6], yonTesti: true },
    { ad: 'Yandan takılı (ayar alt kalmış); kayma 3°/-5°/4°', yuz: 'sag', kayma: [3, -5, 4], yonTesti: true },
  ]) {
    const r = await run(browser, scn);
    check(r.test && r.test.tamam && !r.pencere && r.n === 24 && r.tam === 24 && r.kantMax < 0.5 && r.kantUyari === 0 && !r.errs.length,
      `${scn.ad}: yön testi tamam, 24/24 atış saati doğru, kanting ${r.kantMax != null ? r.kantMax.toFixed(1) : '?'}°`, { test: r.test, pencere: r.pencere, n: r.n, tam: r.tam, kantMax: r.kantMax, kantUyari: r.kantUyari, hata: r.hata, errs: r.errs });
  }

  section('Yön testi yapılmadan');
  { const r = await run(browser, { ad: 'D', yuz: 'asagi', kayma: [6, 4, 5], yonTesti: false });
    check(r.soru === 'yok' && r.pencere === 'Önce yön testi' && /Yine de başla/.test(r.dugme), 'Başla: "Önce yön testi" soruluyor', { soru: r.soru, pencere: r.pencere });
    check(r.n === 24 && r.tam === 24 && r.yt === false, 'Ayar doğruysa (ileri) yönler doğru', { n: r.n, tam: r.tam, yt: r.yt });
    check(r.kantMax > 3 && r.kantUyari === 0, `Bant yatıklığı (${r.kantMax.toFixed(1)}°) yön testi yokken her atışa "kanting" yazdırmıyor (eşik 6°)`, { kantMax: r.kantMax, kantUyari: r.kantUyari }); }
  { const r = await run(browser, { ad: 'C', yuz: 'yukari', arka: true, kayma: [-7, -3, -6], yonTesti: false });
    check(r.pencere === 'Önce yön testi' && r.tam <= 6, `Sensör ters ve test yok: yönler ters çıkıyor (${r.tam}/24) — bu yüzden Başla'da soruluyor`, { pencere: r.pencere, tam: r.tam }); }

  section('Yön testinden sonra sensör farklı takıldı');
  { const r = await run(browser, { ad: 'F', yuz: 'asagi', kayma: [6, 4, 5], yonTesti: true, sonra: 'ters' });
    check(r.n === 24 && /takılı değil/.test(r.toast) && r.supheli && r.kantUyari === 0, 'Ekran yüzü çevrilmiş: uyarı veriliyor, 180° "kanting" sayılmıyor', { toast: r.toast, supheli: r.supheli, kantUyari: r.kantUyari, n: r.n }); }
  { const r = await run(browser, { ad: 'G', yuz: 'asagi', kayma: [6, 4, 5], yonTesti: true, sonra: 'arkaya', eskiTest: true });
    check(r.soru === 'eski' && r.pencere === 'Sensör aynı şekilde mi takılı?' && /Aynı şekilde takılı/.test(r.dugme) && r.onay > 0, 'Önü arkaya dönük takılmış, test 9 saat önce: Başla\'da "aynı şekilde mi takılı?" soruluyor, onay kaydediliyor', { soru: r.soru, pencere: r.pencere, onay: r.onay }); }
  { const r = await run(browser, { ad: 'G2', yuz: 'asagi', kayma: [6, 4, 5], yonTesti: true, sonra: 'arkaya', mod: 'gercek', atis: 6 });
    check(r.n === 6 && /aşağı kalkıyor/.test(r.toast) && r.supheli, 'Gerçek atışta ters takılı sensör: "namlu aşağı kalkıyor, yön ters olabilir" uyarısı', { toast: r.toast, n: r.n }); }
  { const r = await run(browser, { ad: 'G3', yuz: 'asagi', kayma: [6, 4, 5], yonTesti: true, mod: 'gercek', atis: 6 });
    check(r.n === 6 && !/aşağı kalkıyor|takılı değil/.test(r.toast) && !r.supheli && r.tam === 6, 'Gerçek atışta doğru takılı sensör: uyarı yok, 6/6 yön doğru', { toast: r.toast, n: r.n, tam: r.tam }); }

  section('Sensör testi (5 sn masada)');
  const iyi = { st: 'bagli', kind: 'hisar', fw: 3, bat: 86, chg: false, imu: true, imuErr: 0, ovf: 0, mic: true, snd: true, temp: 31, hist: [[0, 0], [2000, 0]] };
  { const r = await run(browser, { ad: 'T1', sensorTesti: { ble: iyi } });
    const st = r.sensorTesti; const bad = st.satir.filter(x => !x.startsWith('ok'));
    check(/Sensör hazır/.test(st.sonuc) && !bad.length && st.satir.some(x => x === 'ok:Veri hızı') && st.satir.some(x => x === 'ok:Kalibrasyon'), 'Sağlam sensör: bütün satırlar ✓, kalibrasyon yapıldı', st);
    check(Math.abs(st.sapma[0] - 0.6) < 0.05 && Math.abs(st.sapma[1] + 0.4) < 0.05 && Math.abs(st.sapma[2] - 0.3) < 0.05, 'Jiroskop sapması doğru ölçüldü (0,6 / −0,4 / 0,3 °/sn)', st.sapma); }
  { const r = await run(browser, { ad: 'T2', sensorTesti: { ble: Object.assign({}, iyi, { bat: 12, imu: false, snd: false }) } });
    const st = r.sensorTesti;
    check(/Sorun var/.test(st.sonuc) && st.satir.includes('bad:Pil') && st.satir.includes('bad:Hareket sensörü (IMU)') && st.satir.includes('warn:Mikrofon') && !st.satir.some(x => /Kalibrasyon/.test(x)), 'Zayıf pil, IMU hatası, mikrofon yok: kırmızı/sarı satırlar, kalibrasyon yapılmıyor', st); }
  { const r = await run(browser, { ad: 'T3', sensorTesti: { ble: iyi, kipir: true } });
    check(/kıpırdadı/.test(r.sensorTesti.sonuc), 'Test sırasında kıpırdarsa "tekrar dene" deniyor', r.sensorTesti); }

  await browser.close(); srv.close();
  process.exit(finish('Montaj testi') ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
