// Nişan dışı sarsıntı testi (sahte sensör): silahı yerden nişan hattına kaldırırken, şarjör/sürgü/indirme sırasında,
// namlu yere dönükken oluşan sarsıntılar atış sayılmamalı; nişanda yapılan atışlar (kaldırdıktan bir süre sonra,
// hızlı alıştırmada çekişten hemen sonra, gerçek atışta tepmeyle) sayılmalı.
'use strict';
const { serve, check, section, finish, openApp, chromium, fs, path, sleep } = require('./ortak');
const PORT = 8817;
const FAKE = fs.readFileSync(path.join(__dirname, 'sahte_sensor.js'), 'utf8');
async function waitFor(page, fn, ms, arg) { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await page.evaluate(fn, arg)) return true; await sleep(100); } return false; }

(async () => {
  const srv = await serve(PORT); const browser = await chromium.launch();
  const { page, errs, ctx } = await openApp(browser, { port: PORT, init: [FAKE] });
  const H = (fn, a) => page.evaluate(fn, a);
  const n = () => H(() => window.__hisar.cur.sess.shots.length);
  const toastTxt = () => H(() => { const t = document.getElementById('toast'); return t.hidden ? '' : t.textContent; });
  await H(() => { const h = window.__hisar; h.S.mic = 'kapali'; h.S.sensorShotBeep = false; h.S.mode = 'kuru'; h.applyCfg(); h.selectSource('sensor', true); });
  check(await waitFor(page, () => window.__hisar.ble.st === 'bagli', 9000), 'Sensör bağlandı');

  section('Kuru tetik, serbest antrenman');
  await H(() => { const h = window.__hisar; h.openDrill('serbest'); h.startRun(); }); await sleep(1500);
  // 1) silahı yerden nişan hattına kaldırma: 0,5 sn boyunca saniyede 120° yukarı, hareketin sonunda sarsıntı
  await H(() => { const F = window.__fake; F.addMove(F.head + 10, 100, [120, 0, 0]); F.addShot(F.head + 106, { click: null }); }); await sleep(1800);
  const t1 = await H(() => window.__hisar.cur.run.st.yokNe);
  check(await n() === 0 && t1 === 'hareket', 'Silahı kaldırırken oluşan sarsıntı atış sayılmadı ("nişana getirilirken" uyarısı)', { n: await n(), t1 });
  // 2) nişanda normal atış
  await H(() => { const F = window.__fake; F.addShot(F.head + 40, { dx: 0.004, dy: 0.003, click: null }); }); await sleep(1500);
  check(await n() === 1, 'Nişanda yapılan atış sayıldı', await n());
  // 3) kaldırdıktan bir saniye sonra atış: sayılır
  await H(() => { const F = window.__fake; F.addMove(F.head + 10, 100, [120, 0, 0]); F.addShot(F.head + 310, { dx: 0.01, dy: -0.01, click: null }); }); await sleep(2700);
  check(await n() === 2, 'Kaldırdıktan 1 saniye sonra nişanda yapılan atış sayıldı', await n());
  // 4) şarjör / sürgü: sarsıntının hemen ardından silah hızla dönüyor
  await H(() => { const F = window.__fake; F.addShot(F.head + 40, { click: null }); F.addMove(F.head + 60, 60, [0, 0, 200]); }); await sleep(1800);
  const t4 = await H(() => window.__hisar.cur.run.st.yokNe);
  check(await n() === 2 && t4 === 'sonra', 'Sarsıntının hemen ardından silah çok dönünce (şarjör, sürgü, indirme) atış sayılmadı', { n: await n(), t4 });
  // 5) çok küçük takip hareketi olan atış: sayılır
  await H(() => { const F = window.__fake; F.addShot(F.head + 40, { dx: -0.03, dy: 0.02, click: null }); F.addMove(F.head + 70, 40, [3, 0, 2]); }); await sleep(1800);
  check(await n() === 3, 'Atıştan sonra küçük takip hareketi olan atış sayıldı', await n());
  await H(() => window.__hisar.stopRun(false)); await sleep(1300);

  section('Namlu yere dönük (yön testi yapılmış)');
  await H(() => { const h = window.__hisar; h.S.mount.sensor.B = [0, 1, 0]; h.applyCfg(); h.openDrill('serbest'); h.startRun(); }); await sleep(1500);
  await H(() => { const F = window.__fake; F.addShot(F.head + 800, { click: null, elev: -70 }); }); await sleep(5200);
  const t6 = await H(() => window.__hisar.cur.run.st.yokNe);
  check(await n() === 0 && t6 === 'yon', 'Namlu yere dönükken (−70°) sarsıntı atış sayılmadı', { n: await n(), t6 });
  await H(() => { const F = window.__fake; F.addShot(F.head + 800, { dx: 0.005, dy: 0.004, click: null, elev: -20 }); }); await sleep(5200);
  check(await n() === 1, 'Aşağıdaki hedefe (−20°) yapılan atış sayıldı', await n());
  await H(() => window.__hisar.stopRun(false)); await sleep(1300);

  section('Hızlı alıştırma ve gerçek atış');
  await H(() => { const h = window.__hisar; h.S.mount.sensor.B = null; h.applyCfg(); h.openDrill('serbest'); h.S.mode = 'gercek'; h.applyCfg(); h.startRun(); }); await sleep(1500);
  await H(() => { const F = window.__fake; F.addShot(F.head + 40, { live: true, click: null }); }); await sleep(1500);
  await H(() => { const F = window.__fake; F.addShot(F.head + 40, { live: true, click: null }); }); await sleep(1500);
  check(await n() === 2, 'Gerçek atışta tepme hareketi atışı engellemiyor (2 atış sayıldı)', await n());
  await H(() => { window.__hisar.stopRun(false); window.__hisar.S.mode = 'kuru'; window.__hisar.applyCfg(); }); await sleep(1300);
  check(errs.length === 0, 'Sayfa hatası yok', errs.slice(0, 5));

  await ctx.close(); await browser.close(); srv.close();
  process.exit(finish('Nişan dışı sarsıntı testi') ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
