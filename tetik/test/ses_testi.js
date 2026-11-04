// Ses testi (sahte sensörle): sensör yazılımı 4'ün gür zili için uygulama tarafı.
// Alıştırma komutları zilin gür bandında (2-4,2 kHz) gidiyor mu; her atıştan sonra iyi/kötü bip doğru mu; hızlı
// alıştırmalarda atış sonrası bip çalmıyor mu; bip sırasında zilin titreşimi atış sayılmıyor mu (sessiz pencere),
// ama bipten sonra gelen atış sayılıyor mu; ayar kapalıyken çalmıyor mu; Ses testi düğmesi; eski ayarda kısık kalan
// sensör sesinin bir kez en yükseğe alınması; sensör bağlanınca telefonun karşılama sözü (bir kez, ayarla değişir).
'use strict';
const { serve, check, section, finish, openApp, chromium, fs, path, sleep } = require('./ortak');
const PORT = 8812;
const FAKE = fs.readFileSync(path.join(__dirname, 'sahte_sensor.js'), 'utf8');
// konuşmayı dinle: speechSynthesis.speak yerine söylenenleri kaydet (sessiz kilit açma " " sayılmaz)
const SPY = `window.__said=[]; try{ if(window.speechSynthesis) window.speechSynthesis.speak=function(u){ const t=String(u&&u.text||'').trim(); if(t) window.__said.push(t); }; }catch(e){}`;

async function waitFor(page, fn, ms, arg) { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await page.evaluate(fn, arg)) return true; await sleep(100); } return false; }
async function connected(browser, extra = []) {
  const r = await openApp(browser, { port: PORT, init: [FAKE, SPY, ...extra] });
  await r.page.evaluate(() => window.__hisar.selectSource('sensor', true));
  await waitFor(r.page, () => window.__hisar.ble.st === 'bagli' && window.__hisar.ble.recv > 200, 8000);
  await sleep(1500);
  return r;
}
const tones = page => page.evaluate(() => window.__fake.writes.filter(b => b[0] === 1).map(b => [(b[1] << 8) | b[2], b[3] * 10]));
const hz = (list, f) => list.filter(t => t[0] === f).length;

(async () => {
  const srv = await serve(PORT); const browser = await chromium.launch();

  section('Bağlanınca: karşılama sözü ve (eski ayarda) sensör sesi en yükseğe');
  {
    const { ctx, page, errs } = await connected(browser);
    const a = await page.evaluate(() => ({ said: window.__said.slice(), vol: window.__fake.cfg.vol, fix: window.__hisar.S.volFix, toast: document.getElementById('toast').textContent }));
    check(a.said.length === 1 && a.said[0] === 'Merhaba komutanım', 'Sensör bağlanınca telefon "Merhaba komutanım" dedi (bir kez)', a.said);
    check(a.vol === 100 && a.fix === true && /en yükseğe/.test(a.toast), 'Kısık kalmış sensör sesi (%60) bir kez %100\'e alındı ve bildirildi', a);
    // kopup yeniden bağlanınca: yeniden selamlamaz, ses ayarına dokunmaz
    await page.evaluate(() => { window.__fake.cfg.vol = 40; window.__fake.drop(); });
    const back = await waitFor(page, () => window.__hisar.ble.st === 'bagli' && window.__hisar.ble.reconnects >= 1, 12000); await sleep(1500);
    const b = await page.evaluate(() => ({ said: window.__said.length, vol: window.__fake.cfg.vol }));
    check(back && b.said === 1 && b.vol === 40, 'Kopup yeniden bağlanınca tekrar selamlamıyor, kullanıcının ses ayarını değiştirmiyor', b);
    check(errs.length === 0, 'Sayfa hatası yok', errs);
    await ctx.close();
  }
  {
    const meta = JSON.stringify({ v: 2, settings: { greet: true, greetText: 'Hoş geldin nişancı', volFix: true }, ids: [] });
    const { ctx, page } = await connected(browser, [`try{localStorage.setItem('hisarTetik.v2.meta',${JSON.stringify(meta)})}catch(e){}`]);
    const a = await page.evaluate(() => ({ said: window.__said.slice(), vol: window.__fake.cfg.vol }));
    check(a.said.length === 1 && a.said[0] === 'Hoş geldin nişancı' && a.vol === 60, 'Karşılama sözü ayardan değişiyor; ses daha önce düzeltildiyse dokunulmuyor', a);
    await ctx.close();
    const meta2 = JSON.stringify({ v: 2, settings: { greet: false, volFix: true }, ids: [] });
    const r2 = await connected(browser, [`try{localStorage.setItem('hisarTetik.v2.meta',${JSON.stringify(meta2)})}catch(e){}`]);
    const said2 = await r2.page.evaluate(() => window.__said.length);
    check(said2 === 0, 'Karşılama kapalıyken bir şey söylenmiyor', said2);
    // Ayarlar › Sesli geri bildirim: karşılama ayarı ve "Dinle"
    await r2.page.evaluate(() => window.__hisar.openSettings('ses')); await sleep(200);
    await r2.page.fill('#sGreetT', 'Merhaba başçavuşum'); await r2.page.click('#sGreetTry'); await sleep(100);
    const ui = await r2.page.evaluate(() => ({ said: window.__said.slice(), t: window.__hisar.S.greetText, saved: JSON.parse(localStorage.getItem('hisarTetik.v2.meta')).settings.greetText }));
    check(ui.said[0] === 'Merhaba başçavuşum' && ui.t === 'Merhaba başçavuşum' && ui.saved === 'Merhaba başçavuşum', 'Sesli geri bildirim sayfasında söz yazılıp "Dinle" ile duyuluyor ve kaydediliyor', ui);
    await r2.ctx.close();
  }

  section('Alıştırma komutları sensörde gür bantta');
  {
    const { ctx, page, errs } = await connected(browser);
    await page.evaluate(() => { window.__fake.writes.length = 0; const H = window.__hisar; H.openDrill('zamanlayici'); H.startRun(); });
    const go = await waitFor(page, () => window.__fake.writes.some(b => b[0] === 1), 9000);
    const t = await tones(page);
    check(go && hz(t, 3136) >= 1 && t.every(x => x[0] >= 1700 && x[0] <= 4200), '"Başla" bibi sensörde 3136 Hz (zilin gür bandı); hiçbir komut 1,7 kHz altında değil', t);
    await page.evaluate(() => window.__hisar.stopRun(false)); await sleep(900);
    const cue = await page.evaluate(() => { const S = window.__hisar.SCUE; return Object.values(S).flat().every(([f, ms]) => f >= 1700 && f <= 4200 && ms >= 50 && ms <= 600); });
    check(cue, 'Bütün komut sesleri (başla, tik, par, son, ateş, dur) 1,7-4,2 kHz arasında ve 50-600 ms', cue);
    check(errs.length === 0, 'Sayfa hatası yok', errs);
    await ctx.close();
  }

  section('Atıştan sonra sensör bibi; bip sırasında titreşim atış sayılmıyor');
  {
    const { ctx, page, errs } = await connected(browser);
    await page.evaluate(() => { const H = window.__hisar; H.S.mic = 'kapali'; H.applyCfg(); window.__fake.writes.length = 0; H.openDrill('serbest'); H.startRun(); });
    await sleep(600);
    await page.evaluate(() => { const F = window.__fake; F.addShot(F.head + 40, { dx: 0.004, dy: 0.003, click: null }); });        // çok iyi atış
    const s1 = await waitFor(page, () => window.__hisar.cur.sess.shots.length === 1, 4000);
    await sleep(60);
    // bip başladıktan hemen sonra (zil çalarken) gelen sarsıntı: sayılmamalı
    await page.evaluate(() => { const F = window.__fake; F.addShot(F.head + 6, { dx: 0.2, dy: 0.2, spike: 2.5, click: null }); });
    await sleep(1600);
    const t1 = await tones(page);
    const n2 = await page.evaluate(() => window.__hisar.cur.sess.shots.length);
    // bipten sonra gelen gerçek atış (kötü): sayılmalı, kalın bip
    await page.evaluate(() => { window.__fake.writes.length = 0; const F = window.__fake; F.addShot(F.head + 40, { dx: -0.9, dy: -0.8, click: null }); });
    const s3 = await waitFor(page, () => window.__hisar.cur.sess.shots.length === 2, 4000); await sleep(100);
    const t3 = await tones(page);
    const sc = await page.evaluate(() => window.__hisar.cur.sess.shots.map(q => q.sc));
    check(s1 && sc[0] >= 85 && hz(t1, 3136) === 1 && hz(t1, 4186) === 1, 'İyi atıştan sonra sensör iki ince bip çaldı (3136 + 4186 Hz)', { sc, t1 });
    check(n2 === 1, 'Bip çalarken gelen sarsıntı yeni atış sayılmadı (sessiz pencere)', n2);
    check(s3 && sc[1] < 85 && hz(t3, 1760) === 1 && hz(t3, 4186) === 0, 'Bipten sonraki atış sayıldı; kötü atışta kalın bip (1760 Hz)', { sc, t3 });
    await page.evaluate(() => window.__hisar.stopRun(false)); await sleep(900);
    // ayar kapalı: bip yok
    await page.evaluate(() => { const H = window.__hisar; H.S.sensorShotBeep = false; window.__fake.writes.length = 0; H.openDrill('serbest'); H.startRun(); });
    await sleep(500); await page.evaluate(() => { const F = window.__fake; F.addShot(F.head + 40, { dx: 0.004, dy: 0.003, click: null }); });
    await waitFor(page, () => window.__hisar.cur.sess.shots.length === 1, 4000); await sleep(60);
    await page.evaluate(() => { const F = window.__fake; F.addShot(F.head + 6, { dx: 0.2, dy: 0.2, spike: 2.5, click: null }); });   // karşı deneme: bip yokken aynı sarsıntı
    const cnt = await waitFor(page, () => window.__hisar.cur.sess.shots.length === 2, 3000);
    const off = await tones(page);
    check(off.length === 0, '"Atıştan sonra sensör ötsün" kapalıyken bip çalmıyor', off);
    check(cnt, 'Karşı deneme: bip yokken aynı sarsıntı atış sayılıyor (sessiz pencereyi bip açıyor)', cnt);
    await page.evaluate(() => { window.__hisar.stopRun(false); window.__hisar.S.sensorShotBeep = true; }); await sleep(900);
    // hızlı alıştırma (Ritim): atış sonrası bip yok, yalnız ritim bipleri
    await page.evaluate(() => { const H = window.__hisar; H.S.ritim = 1.2; window.__fake.writes.length = 0; H.openDrill('ritim'); H.startRun(); });
    await sleep(1500); await page.evaluate(() => { const F = window.__fake; F.addShot(F.head + 10, { dx: 0.004, dy: 0.003, click: null }); });
    await waitFor(page, () => window.__hisar.cur.sess.shots.length >= 1, 4000); await sleep(700);
    const rt = await tones(page);
    check(rt.length >= 1 && hz(rt, 4186) === 0 && hz(rt, 1760) === 0, 'Hızlı alıştırmada (Ritim) atış sonrası bip çalmıyor, ritim bipleri çalıyor', rt);
    await page.evaluate(() => window.__hisar.stopRun(false)); await sleep(900);
    // Sensör sekmesi › Ses testi
    await page.evaluate(() => { window.__fake.writes.length = 0; window.__hisar.showView('sensor'); }); await sleep(200);
    await page.click('#snSound'); await sleep(1400);
    const st = await tones(page);
    check(hz(st, 3136) === 1 && hz(st, 4186) === 1 && hz(st, 1760) === 1, 'Ses testi: önce iyi atış (iki ince), sonra kötü atış (kalın) sesi', st);
    check(errs.length === 0, 'Sayfa hatası yok', errs);
    await ctx.close();
  }

  await browser.close(); srv.close();
  process.exit(finish('Ses testi') ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
