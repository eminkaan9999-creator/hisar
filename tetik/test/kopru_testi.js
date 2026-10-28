// Android köprüsü testi: APK'daki sayfa (bridge.js ile) + sahte yerel katman (sahte_yerel.js) + sahte sensör.
// Web Bluetooth çağrılarının yerel Bluetooth'a doğru çevrildiğini, kopma/devam, ayarlar, güncelleme,
// otomatik bağlanma, ekranı açık tutma, dosya kaydetme/paylaşma ve geri tuşunu dener.
'use strict';
const { serve, check, section, finish, openApp, chromium, fs, path, sleep, ROOT } = require('./ortak');
const { execFileSync } = require('child_process');
const PORT = 8785;
const FAKE = fs.readFileSync(path.join(__dirname, 'sahte_sensor.js'), 'utf8');
const NATIVE = fs.readFileSync(path.join(__dirname, 'sahte_yerel.js'), 'utf8');
const PAGE_URL = '/tetik/android/app/src/main/assets/www/index.html';
const BIN = path.join(ROOT, 'tetik', 'firmware');
const realInfo = JSON.parse(fs.readFileSync(path.join(BIN, 'ota.json'), 'utf8'));

async function waitFor(page, fn, ms, arg) { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await page.evaluate(fn, arg)) return true; await sleep(100); } return false; }
const nlog = (page, kind) => page.evaluate(k => window.__nativeLog.filter(e => e[0] === k), kind);
async function open(browser, opts = {}) {
  const r = await openApp(browser, Object.assign({ port: PORT, url: PAGE_URL, init: [FAKE, NATIVE] }, opts));
  // APK sayfası OTA bilgisini barındırılan adresten alır: testte yerel dosyaya yönlendir
  await r.page.route('https://eminkaan9999-creator.github.io/hisar/tetik/**', async rt => {
    const u = new URL(rt.request().url()); const rel = u.pathname.replace('/hisar/', '/');
    if (/ota\.json$/.test(rel)) return rt.fulfill({ contentType: 'application/json', body: JSON.stringify(Object.assign({}, realInfo, { fw: 3 })) });
    const f = path.join(ROOT, rel); if (fs.existsSync(f)) return rt.fulfill({ body: fs.readFileSync(f) });
    return rt.fulfill({ status: 404, body: '' });
  });
  return r;
}

(async () => {
  execFileSync('python3', [path.join(ROOT, 'tetik', 'build.py'), '--apk']);
  const srv = await serve(PORT); const browser = await chromium.launch();

  section('APK sayfası ve köprü');
  {
    const { ctx, page, errs } = await open(browser);
    const env = await page.evaluate(() => ({ apk: !!window.HisarNative, bt: !!navigator.bluetooth && typeof navigator.bluetooth.requestDevice, wl: !!navigator.wakeLock, hn: !!window.__hn }));
    check(env.apk && env.bt === 'function' && env.wl && env.hn, 'Köprü yüklendi: navigator.bluetooth ve wakeLock yerel katmana bağlı', env);
    await page.click('#srcSensor');
    const ok = await waitFor(page, () => window.__hisar.ble.st === 'bagli' && window.__hisar.ble.recv > 100, 8000);
    check(ok, 'Yerel seçiciyle bağlandı, ölçümler köprüden akıyor');
    const req = await nlog(page, 'bleRequest');
    check(req.length === 1 && /HISAR/.test(req[0][1]) && /0000ffe5/.test(req[0][1]), 'Seçiciye HİSAR filtreleri gitti');
    const w = await nlog(page, 'bleWrite'); const ev = await page.evaluate(() => window.__fake.events.filter(e => e[0] === 'yaz' || e[0] === 'abone').map(e => e[0]));
    check(w.length && w[0][1][0] === 7 && w[0][2] === true && ev.indexOf('yaz') < ev.indexOf('abone'), 'Akış başlangıç komutu (yanıtlı yazma) bildirimlerden önce gitti', { w: w.slice(0, 2), ev: ev.slice(0, 3) });
    await sleep(2100);
    const s = await page.evaluate(() => { const b = window.__hisar.ble; return { fw: b.fw, bat: b.bat, drops: b.drops, dup: b.dup, recv: b.recv, rate: +document.getElementById('rateNote').textContent.replace(/\D/g, '') }; });
    check(s.fw === 2 && s.bat === 80 && s.drops === 0 && s.dup === 0 && s.rate >= 180 && s.rate <= 220, 'Durum ve ~200 ölçüm/sn, kayıp yok', s);

    section('Kopma ve kayıpsız devam (köprü üzerinden)');
    await page.evaluate(() => { window.__fake.inRange = false; window.__fake.drop(); });
    await sleep(1500);
    await page.evaluate(() => { window.__fake.inRange = true; });
    const back = await waitFor(page, () => window.__hisar.ble.st === 'bagli', 8000);
    await sleep(1500);
    const s2 = await page.evaluate(() => ({ drops: window.__hisar.ble.drops, dup: window.__hisar.ble.dup, rc: window.__hisar.ble.reconnects }));
    const cons = await nlog(page, 'bleConnect');
    check(back && s2.rc === 1 && cons.length >= 2, 'Yerel kopma olayı geldi, kendiliğinden yeniden bağlandı', { s2, cons: cons.length });
    check(s2.drops === 0 && s2.dup === 0, 'Kopma boyunca ölçüm kaybı yok', s2);

    section('Sensör ayarı ve sensörü bul (köprü üzerinden yazma)');
    await page.evaluate(() => window.__hisar.openSettings('baglanti')); await sleep(400);
    await page.evaluate(() => { const r = document.getElementById('dvBri'); r.value = '80'; r.dispatchEvent(new Event('input')); }); await sleep(700);
    await page.click('#sbFind'); await sleep(300);
    const cfg = await page.evaluate(() => ({ bri: window.__fake.cfg.bri, id: window.__fake.identified || 0 }));
    check(cfg.bri === 80 && cfg.id === 1, 'Parlaklık %80 ve "sensörü bul" sensöre ulaştı', cfg);

    section('Sensör yazılımını telefondan güncelleme (köprü üzerinden)');
    await waitFor(page, () => !!document.getElementById('otaGo'), 5000);
    await page.click('#otaGo'); await sleep(200); await page.click('#askOk');
    const done = await waitFor(page, () => window.__fake.events.some(e => e[0] === 'ota-bitti'), 90000);
    const o = await page.evaluate(() => ({ c: window.__fake.ota.c, crc: window.__fake.ota.crc, off: window.__fake.ota.off }));
    check(done && o.c === o.crc && o.off === realInfo.size, 'Güncelleme köprüden eksiksiz aktarıldı (CRC tuttu)', o);
    const fw3 = await waitFor(page, () => window.__hisar.ble.st === 'bagli' && window.__hisar.ble.fw === 3, 12000);
    check(fw3, 'Sensör yeni sürümle yeniden başladı, uygulama yeniden bağlandı');

    section('Ekranı açık tutma, dosya kaydetme, rapor paylaşma, geri tuşu');
    await page.evaluate(() => { const h = window.__hisar; h.openDrill('serbest'); h.startRun(); });
    await sleep(800);
    const k1 = await nlog(page, 'keepScreenOn');
    await page.evaluate(() => { window.__fake.addShot(window.__hisar.ble.lastSeq + 60, { dx: 0.2, dy: -0.1 }); window.__fake.addShot(window.__hisar.ble.lastSeq + 400, { dx: -0.1, dy: 0.05 }); });
    await sleep(3000);
    await page.evaluate(() => window.__hisar.stopRun(false)); await sleep(1500);
    const k2 = await nlog(page, 'keepScreenOn');
    check(k1.length >= 1 && k1[k1.length - 1][1] === true && k2[k2.length - 1][1] === false, 'Oturum sırasında ekran açık tutuldu, bitince bırakıldı', k2);
    const shots = await page.evaluate(() => window.__hisar.cur.sess ? window.__hisar.cur.sess.shots.length : 0);
    check(shots === 2, 'İki atış köprüden gelen veriden algılandı', shots);
    await page.evaluate(() => document.querySelector('#sheet [data-close]') && document.querySelector('#sheet [data-close]').click());
    await page.evaluate(() => window.__hisar.shareSession(window.__hisar.cur.sess.id, 'png')); await sleep(800);
    const sh = await nlog(page, 'shareFile');
    check(sh.length === 1 && sh[0][2] === 'image/png' && sh[0][3] > 20000, 'Rapor yerel paylaşım menüsüne gitti (PNG)', sh.map(x => [x[1], x[2], x[3]]));
    await page.evaluate(() => window.__hisar.shareSession(window.__hisar.cur.sess.id, 'pdf')); await sleep(800);
    const sh2 = await nlog(page, 'shareFile');
    check(sh2.length === 2 && sh2[1][2] === 'application/pdf', 'PDF rapor da paylaşıldı', sh2.length);
    await page.evaluate(() => window.__hisar.openSettings('veri')); await sleep(300);
    await page.click('#dExp'); await sleep(400);
    const sv = await nlog(page, 'saveFile');
    const toast = await page.evaluate(() => document.getElementById('toast').textContent);
    check(sv.length === 1 && sv[0][2] === 'application/json' && /kaydedildi/.test(toast), 'Dışa aktarma yerel "kaydet" penceresine gitti', { sv, toast });
    await page.evaluate(() => window.__hisar.openSettings('montaj')); await sleep(200);
    const b1 = await page.evaluate(() => window.__hisarBack());
    const pg = await page.evaluate(() => window.__hisar.setPage);
    const b2 = await page.evaluate(() => window.__hisarBack());
    const b3 = await page.evaluate(() => window.__hisarBack());
    check(b1 === true && pg === null && b2 === true && b3 === false, 'Geri tuşu: ayar sayfası → menü → ana sayfa → uygulamadan çık', { b1, pg, b2, b3 });
    await page.evaluate(() => window.__hisar.openSettings('uygulama')); await sleep(300);
    const ap = await page.evaluate(() => document.getElementById('v-ayarlar').textContent);
    check(/Android uygulaması olarak yüklü/.test(ap), 'Uygulama sayfası Android uygulamasını tanıyor');
    check(errs.length === 0, 'Sayfa hatası yok', errs);
    await ctx.close();
  }

  section('Açılışta bilinen sensöre listesiz bağlanma (yerel kayıt)');
  {
    const meta = JSON.stringify({ v: 2, settings: { lastSource: 'sensor', lastSensor: 'HISAR-SENSOR', autoConnect: true }, ids: [] });
    const { ctx, page, errs } = await open(browser, { storage: { 'hisarTetik.v2.meta': meta, 'hn.known': JSON.stringify({ id: 'sahte-1', name: 'HISAR-SENSOR' }) } });
    const ok = await waitFor(page, () => window.__hisar.ble.st === 'bagli' && window.__hisar.ble.recv > 50, 8000);
    const req = await nlog(page, 'bleRequest');
    check(ok && req.length === 0, 'Seçici açılmadan son sensöre bağlandı', { ok, req: req.length });
    check(errs.length === 0, 'Sayfa hatası yok', errs);
    await ctx.close();
  }

  section('Seçiciden vazgeçme ve izin reddi');
  {
    const { ctx, page, errs } = await open(browser, { init: [FAKE, 'window.__fake.cancelChooser=true;', NATIVE] });
    await page.click('#srcSensor'); await sleep(600);
    const st = await page.evaluate(() => ({ st: window.__hisar.ble.st, msg: document.getElementById('srcStatus').textContent }));
    check(st.st === 'off' && /Sensör seçilmedi/.test(st.msg), 'Vazgeçince "Sensör seçilmedi" (NotFoundError köprüden geldi)', st);
    await page.evaluate(() => { window.HisarNative.bleRequest = (id) => setTimeout(() => window.__hn.err(id, 'NotAllowedError', 'Bluetooth izni verilmedi.'), 5); });
    await page.click('#srcDemo'); await sleep(200); await page.click('#srcSensor'); await sleep(500);
    const msg = await page.evaluate(() => document.getElementById('srcStatus').textContent);
    check(/Yakındaki cihazlar/.test(msg), 'İzin reddinde Android için doğru yönlendirme', msg);
    check(errs.length === 0, 'Sayfa hatası yok', errs);
    await ctx.close();
  }

  await browser.close(); srv.close();
  process.exit(finish('Köprü testi') ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
