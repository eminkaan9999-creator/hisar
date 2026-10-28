// Sensör yazılımını telefondan güncelleme (Bluetooth OTA) testi: sahte sensörle uçtan uca.
// Normal güncelleme, kaybolan parça (geri sarma), CRC hatası, bozuk indirme, aktarım sırasında kopma, vazgeçme.
'use strict';
const { serve, check, section, finish, openApp, chromium, fs, path, sleep, ROOT } = require('./ortak');
const PORT = 8784;
const FAKE = fs.readFileSync(path.join(__dirname, 'sahte_sensor.js'), 'utf8');
const BIN = path.join(ROOT, 'tetik', 'firmware');
const realInfo = JSON.parse(fs.readFileSync(path.join(BIN, 'ota.json'), 'utf8'));

async function waitFor(page, fn, ms, arg) { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await page.evaluate(fn, arg)) return true; await sleep(100); } return false; }
async function setup(browser, { info = Object.assign({}, realInfo, { fw: 3 }), corrupt = false } = {}) {
  const r = await openApp(browser, { port: PORT, init: [FAKE] });
  await r.page.route('**/firmware/ota.json*', rt => rt.fulfill({ contentType: 'application/json', body: JSON.stringify(info) }));
  if (corrupt) await r.page.route('**/firmware/' + realInfo.file + '*', async rt => { const b = fs.readFileSync(path.join(BIN, realInfo.file)); b[1000] ^= 0xFF; rt.fulfill({ contentType: 'application/octet-stream', body: b }); });
  await r.page.click('#srcSensor');
  await waitFor(r.page, () => window.__hisar.ble.st === 'bagli' && window.__hisar.ble.fw === 2, 8000);
  await r.page.evaluate(() => window.__hisar.openSettings('baglanti'));
  await waitFor(r.page, () => !!document.getElementById('otaGo'), 5000);
  return r;
}
const cardText = page => page.evaluate(() => (document.getElementById('sbFw') || {}).textContent || '');
async function startOta(page) { await page.click('#otaGo'); await sleep(200); await page.click('#askOk'); }

(async () => {
  const srv = await serve(PORT); const browser = await chromium.launch();

  section('Normal güncelleme (sürüm 2 → 3)');
  { const { ctx, page, errs } = await setup(browser);
    check(/sürüm 2.*sürüm 3 hazır/s.test(await cardText(page)), 'Yeni sürüm bildiriliyor ve "Telefondan güncelle" düğmesi var');
    const t0 = Date.now(); await startOta(page);
    const mid = await waitFor(page, () => /Yükleniyor: %[1-9]/.test(document.getElementById('sbFw').textContent), 8000);
    check(mid, 'İlerleme yüzdesi görünüyor');
    const stall = await page.evaluate(() => document.getElementById('srcStatus').textContent);
    const done = await waitFor(page, () => window.__fake.events.some(e => e[0] === 'ota-bitti'), 60000);
    const o = await page.evaluate(() => ({ off: window.__fake.ota.off, size: window.__fake.ota.size, c: window.__fake.ota.c, crc: window.__fake.ota.crc, chunks: window.__fake.ota.chunks }));
    check(done && o.off === realInfo.size && o.c === o.crc && o.crc === (realInfo.crc32 >>> 0), 'Yazılımın tamamı aktarıldı, CRC sensörde doğrulandı', o);
    check(o.chunks >= Math.floor(realInfo.size / 177), 'Parça boyu MTU\'ya göre (177 bayt)', o.chunks);
    check(!/ölçüm gelmiyor/.test(stall), 'Güncelleme sırasında yanlış "ölçüm gelmiyor" uyarısı yok', stall);
    const back = await waitFor(page, () => window.__hisar.ble.st === 'bagli' && window.__hisar.ble.fw === 3, 10000);
    check(back, 'Sensör yeni yazılımla yeniden başladı, uygulama kendiliğinden bağlandı (sürüm 3)');
    await sleep(600); await page.click('#otaOk').catch(() => {}); await sleep(300);
    check(/güncel/.test(await cardText(page)), 'Kart "güncel" gösteriyor', await cardText(page));
    console.log('    (aktarım süresi ' + ((Date.now() - t0) / 1000).toFixed(1) + ' sn, sahte sensörle)');
    check(errs.length === 0, 'Sayfa hatası yok', errs); await ctx.close(); }

  section('Kaybolan parça: sensör uyarır, uygulama geri sarar');
  { const { ctx, page, errs } = await setup(browser);
    await page.evaluate(() => { window.__fake.ota.dropOnce = 300000; });
    await startOta(page);
    const done = await waitFor(page, () => window.__fake.events.some(e => e[0] === 'ota-bitti'), 60000);
    const ev = await page.evaluate(() => window.__fake.events.filter(e => e[0] === 'ota-kayip').length);
    const o = await page.evaluate(() => ({ c: window.__fake.ota.c, crc: window.__fake.ota.crc }));
    check(done && ev === 1 && o.c === o.crc, 'Kayıp parça yeniden gönderildi, yazılım eksiksiz', { ev, o });
    check(errs.length === 0, 'Sayfa hatası yok', errs); await ctx.close(); }

  section('Sensörde CRC hatası');
  { const { ctx, page, errs } = await setup(browser);
    await page.evaluate(() => { window.__fake.ota.failCrc = true; });
    await startOta(page);
    const err = await waitFor(page, () => /doğrulanamadı \(CRC\)/.test(document.getElementById('sbFw').textContent), 60000);
    check(err, 'Hata gösteriliyor: "dosya doğrulanamadı (CRC)" ve eski yazılımın çalıştığı söyleniyor');
    check(await page.evaluate(() => window.__fake.fw === 2 && window.__hisar.ble.st === 'bagli'), 'Sensör eski yazılımda, bağlantı sürüyor');
    check(errs.length === 0, 'Sayfa hatası yok', errs); await ctx.close(); }

  section('Bozuk indirme');
  { const { ctx, page, errs } = await setup(browser, { corrupt: true });
    await startOta(page);
    const err = await waitFor(page, () => /indirilen dosya bozuk/.test(document.getElementById('sbFw').textContent), 15000);
    const started = await page.evaluate(() => window.__fake.events.some(e => e[0] === 'ota-basla'));
    check(err && !started, 'Bozuk dosya sensöre hiç gönderilmedi');
    check(errs.length === 0, 'Sayfa hatası yok', errs); await ctx.close(); }

  section('Aktarım sırasında bağlantı kopması');
  { const { ctx, page, errs } = await setup(browser);
    await startOta(page);
    await waitFor(page, () => window.__fake.ota.off > 200000, 30000);
    await page.evaluate(() => window.__fake.drop());
    const err = await waitFor(page, () => /Güncelleme yapılamadı/.test(document.getElementById('sbFw').textContent), 20000);
    check(err, 'Hata gösterildi, eski yazılımın çalıştığı söylendi');
    const back = await waitFor(page, () => window.__hisar.ble.st === 'bagli', 10000);
    check(back && await page.evaluate(() => window.__fake.fw === 2), 'Uygulama yeniden bağlandı, sensör eski sürümde (bozulmadı)');
    check(errs.length === 0, 'Sayfa hatası yok', errs); await ctx.close(); }

  section('Vazgeçme');
  { const { ctx, page, errs } = await setup(browser);
    await startOta(page);
    await waitFor(page, () => window.__fake.ota.off > 100000, 30000);
    await page.click('#otaStop');
    const err = await waitFor(page, () => /vazgeçildi/.test(document.getElementById('sbFw').textContent), 10000);
    const ab = await page.evaluate(() => window.__fake.events.some(e => e[0] === 'ota-vazgec'));
    check(err && ab, 'Vazgeç: sensöre iptal gönderildi, eski yazılım kaldı');
    check(errs.length === 0, 'Sayfa hatası yok', errs); await ctx.close(); }

  await browser.close(); srv.close();
  process.exit(finish('Güncelleme testi') ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
