// Sensör yazılımını telefondan güncelleme (Bluetooth OTA) testi: sahte sensörle uçtan uca.
// Normal güncelleme, kaybolan parça (geri sarma), takılma (sensör ikinci kez uyarmaz → yoklama), kaybolan onaylar,
// kaybolan son onay ve "tamam" yanıtı, CRC hatası, bozuk indirme, kopmada kendiliğinden yeniden deneme, hep kopma, vazgeçme.
'use strict';
const { serve, check, section, finish, openApp, chromium, fs, path, sleep, ROOT } = require('./ortak');
const PORT = 8784;
const FAKE = fs.readFileSync(path.join(__dirname, 'sahte_sensor.js'), 'utf8');
const BIN = path.join(ROOT, 'tetik', 'firmware');
const realInfo = JSON.parse(fs.readFileSync(path.join(BIN, 'ota.json'), 'utf8'));
// ekranı açık tutma (Wake Lock) taklidi: kaç kilit istendi, kaçı açık
const WL = `(()=>{ const W=window.__wl={req:0,rel:0,aktif:0}; const wl={ request: t => { W.req++; W.aktif++; const s=new EventTarget(); s.type=t; s.released=false;
  s.release=()=>{ if(!s.released){ s.released=true; W.rel++; W.aktif--; } return Promise.resolve(); }; return Promise.resolve(s); } };
  try{ Object.defineProperty(navigator,'wakeLock',{value:wl,configurable:true}); }catch(e){} })();`;

async function waitFor(page, fn, ms, arg) { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await page.evaluate(fn, arg)) return true; await sleep(100); } return false; }
async function setup(browser, { info = Object.assign({}, realInfo, { fw: 3 }), corrupt = false } = {}) {
  const r = await openApp(browser, { port: PORT, init: [FAKE, WL, 'window.__fake.fw=2;'] });      // eski yazılımlı sensör
  await r.page.route('**/firmware/ota.json*', rt => rt.fulfill({ contentType: 'application/json', body: JSON.stringify(info) }));
  if (corrupt) await r.page.route('**/firmware/' + realInfo.file + '*', async rt => { const b = fs.readFileSync(path.join(BIN, realInfo.file)); b[1000] ^= 0xFF; rt.fulfill({ contentType: 'application/octet-stream', body: b }); });
  await r.page.evaluate(() => window.__hisar.selectSource('sensor', true));
  await waitFor(r.page, () => window.__hisar.ble.st === 'bagli' && window.__hisar.ble.fw === 2, 8000);
  await r.page.evaluate(() => window.__hisar.openSettings('baglanti'));
  await waitFor(r.page, () => !!document.getElementById('otaGo'), 5000);
  return r;
}
const cardText = page => page.evaluate(() => (document.getElementById('sbFw') || {}).textContent || '');
const evCount = (page, k) => page.evaluate(k => window.__fake.events.filter(e => e[0] === k).length, k);
async function startOta(page) { await page.click('#otaGo'); await sleep(200); await page.click('#askOk'); }
const BITTI = () => /Tamam\. Sensör yeni yazılımla/.test((document.getElementById('sbFw') || {}).textContent || '');

(async () => {
  const srv = await serve(PORT); const browser = await chromium.launch();

  section('Normal güncelleme (sürüm 2 → 3)');
  { const { ctx, page, errs } = await setup(browser);
    check(/sürüm 2.*sürüm 3 hazır/s.test(await cardText(page)), 'Yeni sürüm bildiriliyor ve "Telefondan güncelle" düğmesi var');
    const t0 = Date.now(); await startOta(page);
    const mid = await waitFor(page, () => /Yükleniyor: %[1-9]/.test(document.getElementById('sbFw').textContent), 8000);
    check(mid, 'İlerleme yüzdesi görünüyor');
    check(await page.evaluate(() => window.__wl.aktif >= 1), 'Güncelleme sürerken ekran açık tutuluyor', await page.evaluate(() => window.__wl));
    const stall = await page.evaluate(() => document.getElementById('srcStatus').textContent);
    const done = await waitFor(page, () => window.__fake.events.some(e => e[0] === 'ota-bitti'), 60000);
    const o = await page.evaluate(() => ({ off: window.__fake.ota.off, size: window.__fake.ota.size, c: window.__fake.ota.c, crc: window.__fake.ota.crc, chunks: window.__fake.ota.chunks }));
    check(done && o.off === realInfo.size && o.c === o.crc && o.crc === (realInfo.crc32 >>> 0), 'Yazılımın tamamı aktarıldı, CRC sensörde doğrulandı', o);
    check(o.chunks >= Math.floor(realInfo.size / 177), 'Parça boyu MTU\'ya göre (177 bayt)', o.chunks);
    check(await evCount(page, 'ota-yokla') === 0, 'Sorunsuz aktarımda sensöre boşuna "nerede kaldın" sorulmadı');
    check(!/ölçüm gelmiyor/.test(stall), 'Güncelleme sırasında yanlış "ölçüm gelmiyor" uyarısı yok', stall);
    const back = await waitFor(page, () => window.__hisar.ble.st === 'bagli' && window.__hisar.ble.fw === 3, 10000);
    check(back, 'Sensör yeni yazılımla yeniden başladı, uygulama kendiliğinden bağlandı (sürüm 3)');
    check(await page.evaluate(() => window.__wl.aktif === 0 && window.__wl.req >= 1), 'Bitince ekran kilidi bırakıldı', await page.evaluate(() => window.__wl));
    await sleep(600); await page.click('#otaOk').catch(() => {}); await sleep(300);
    check(/güncel/.test(await cardText(page)), 'Kart "güncel" gösteriyor', await cardText(page));
    console.log('    (aktarım süresi ' + ((Date.now() - t0) / 1000).toFixed(1) + ' sn, sahte sensörle)');
    check(errs.length === 0, 'Sayfa hatası yok', errs); await ctx.close(); }

  section('Kaybolan parça: sensör uyarır, uygulama geri sarar');
  { const { ctx, page, errs } = await setup(browser);
    await page.evaluate(() => { window.__fake.ota.dropOnce = 300000; });
    await startOta(page);
    const done = await waitFor(page, () => window.__fake.events.some(e => e[0] === 'ota-bitti'), 60000);
    const ev = await evCount(page, 'ota-kayip');
    const o = await page.evaluate(() => ({ c: window.__fake.ota.c, crc: window.__fake.ota.crc }));
    check(done && ev === 1 && o.c === o.crc, 'Kayıp parça yeniden gönderildi, yazılım eksiksiz', { ev, o });
    check(errs.length === 0, 'Sayfa hatası yok', errs); await ctx.close(); }

  section('Yeniden gönderilen parça da kaybolursa (sensör ikinci kez uyarmaz): uygulama nerede kaldığını sorar');
  { const { ctx, page, errs } = await setup(browser);
    await page.evaluate(() => { window.__fake.ota.dropTwice = 250000; });
    await startOta(page);
    const done = await waitFor(page, () => window.__fake.events.some(e => e[0] === 'ota-bitti'), 60000);
    const ev = { k1: await evCount(page, 'ota-kayip'), k2: await evCount(page, 'ota-kayip2'), yokla: await evCount(page, 'ota-yokla'), basla: await evCount(page, 'ota-basla') };
    const o = await page.evaluate(() => ({ c: window.__fake.ota.c, crc: window.__fake.ota.crc }));
    check(done && ev.k1 === 1 && ev.k2 === 1 && ev.yokla >= 1 && ev.basla === 1 && o.c === o.crc, 'Takılma çözüldü: sensöre soruldu, kaldığı yerden sürdü (baştan başlamadan), yazılım eksiksiz', { ev, o });
    const ok = await waitFor(page, BITTI, 10000);
    check(ok, '"Tamam" gösterildi, hata yok', await cardText(page));
    check(errs.length === 0, 'Sayfa hatası yok', errs); await ctx.close(); }

  section('Onaylar kaybolursa');
  { const { ctx, page, errs } = await setup(browser);
    await page.evaluate(() => { window.__fake.ota.ackDropFrom = 200000; window.__fake.ota.ackDrop = 5; });
    await startOta(page);
    const done = await waitFor(page, () => window.__fake.events.some(e => e[0] === 'ota-bitti'), 60000);
    const ev = { kayip: await evCount(page, 'onay-kayip'), basla: await evCount(page, 'ota-basla') };
    const o = await page.evaluate(() => ({ c: window.__fake.ota.c, crc: window.__fake.ota.crc }));
    check(done && ev.kayip === 5 && ev.basla === 1 && o.c === o.crc, 'Art arda 5 onay kayboldu, aktarım durmadan tamamlandı', { ev, o });
    check(errs.length === 0, 'Sayfa hatası yok', errs); await ctx.close(); }

  section('Son onay ve "tamam" yanıtı kaybolursa: sensör yeni sürümle açılınca güncelleme tamam sayılır');
  { const { ctx, page, errs } = await setup(browser);
    await page.evaluate(() => { window.__fake.ota.dropLastAck = true; window.__fake.ota.dropDone = true; });
    await startOta(page);
    const ok = await waitFor(page, BITTI, 90000);
    const ev = { onay: await evCount(page, 'onay-kayip'), tamam: await evCount(page, 'tamam-kayip'), basla: await evCount(page, 'ota-basla') };
    check(ok && ev.onay === 1 && ev.tamam === 1 && ev.basla === 1, '"Tamam" gösterildi, güncelleme ikinci kez yapılmadı', { ev, kart: await cardText(page) });
    check(await page.evaluate(() => window.__fake.fw === 3 && window.__hisar.ble.fw === 3), 'Sensör yeni sürümde (3)');
    check(errs.length === 0, 'Sayfa hatası yok', errs); await ctx.close(); }

  section('Sensörde CRC hatası: yeniden dener, olmazsa söyler');
  { const { ctx, page, errs } = await setup(browser);
    await page.evaluate(() => { window.__fake.ota.failCrc = true; });
    await startOta(page);
    const err = await waitFor(page, () => /Güncelleme yapılamadı: dosya doğrulanamadı \(CRC\)/.test(document.getElementById('sbFw').textContent), 120000);
    check(err, 'Hata gösteriliyor: "dosya doğrulanamadı (CRC)" ve eski yazılımın çalıştığı söyleniyor', await cardText(page));
    check(await evCount(page, 'ota-basla') === 3, '3 kez denendi', await evCount(page, 'ota-basla'));
    check(/bilgisayara/.test(await cardText(page)), 'Bilgisayardan yükleme yolu söyleniyor');
    check(await page.evaluate(() => window.__fake.fw === 2 && window.__hisar.ble.st === 'bagli'), 'Sensör eski yazılımda, bağlantı sürüyor');
    check(await page.evaluate(() => window.__wl.aktif === 0), 'Ekran kilidi bırakıldı');
    check(errs.length === 0, 'Sayfa hatası yok', errs); await ctx.close(); }

  section('Bozuk indirme');
  { const { ctx, page, errs } = await setup(browser, { corrupt: true });
    await startOta(page);
    const err = await waitFor(page, () => /indirilen dosya bozuk/.test(document.getElementById('sbFw').textContent), 15000);
    const started = await page.evaluate(() => window.__fake.events.some(e => e[0] === 'ota-basla'));
    check(err && !started, 'Bozuk dosya sensöre hiç gönderilmedi');
    check(errs.length === 0, 'Sayfa hatası yok', errs); await ctx.close(); }

  section('Aktarım sırasında bağlantı kopması: yeniden bağlanınca kendiliğinden baştan dener');
  { const { ctx, page, errs } = await setup(browser);
    await page.evaluate(() => { window.__fake.ota.kopAt = 200000; });
    await startOta(page);
    const retry = await waitFor(page, () => /baştan denen/.test(document.getElementById('sbFw').textContent), 30000);
    check(retry, '"Yeniden bağlanınca baştan denenecek" yazıyor', await cardText(page));
    const ok = await waitFor(page, BITTI, 90000);
    check(ok && await evCount(page, 'ota-basla') === 2, 'İkinci denemede tamamlandı', { kart: await cardText(page), basla: await evCount(page, 'ota-basla') });
    check(await waitFor(page, () => window.__fake.fw === 3 && window.__hisar.ble.st === 'bagli' && window.__hisar.ble.fw === 3, 10000), 'Sensör yeni sürümde, bağlantı sürüyor');
    check(errs.length === 0, 'Sayfa hatası yok', errs); await ctx.close(); }

  section('Bağlantı hep kopuyorsa: 3 denemeden sonra durur, eski yazılım kalır');
  { const { ctx, page, errs } = await setup(browser);
    await page.evaluate(() => { window.__fake.ota.kopAt = 150000; window.__fake.ota.kopHep = true; });
    await startOta(page);
    const err = await waitFor(page, () => /Güncelleme yapılamadı: bağlantı koptu/.test(document.getElementById('sbFw').textContent), 150000);
    check(err && await evCount(page, 'ota-basla') === 3, '3 denemeden sonra "bağlantı koptu" hatası', { kart: await cardText(page), basla: await evCount(page, 'ota-basla') });
    check(await waitFor(page, () => window.__hisar.ble.st === 'bagli', 10000) && await page.evaluate(() => window.__fake.fw === 2), 'Uygulama yeniden bağlandı, sensör eski sürümde (bozulmadı)');
    check(errs.length === 0, 'Sayfa hatası yok', errs); await ctx.close(); }

  section('Vazgeçme');
  { const { ctx, page, errs } = await setup(browser);
    await startOta(page);
    await waitFor(page, () => window.__fake.ota.off > 100000, 30000);
    await page.click('#otaStop');
    const err = await waitFor(page, () => /vazgeçildi/.test(document.getElementById('sbFw').textContent), 10000);
    const ab = await page.evaluate(() => window.__fake.events.some(e => e[0] === 'ota-vazgec'));
    check(err && ab, 'Vazgeç: sensöre iptal gönderildi, eski yazılım kaldı');
    check(await evCount(page, 'ota-basla') === 1, 'Vazgeçince yeniden denenmedi');
    check(errs.length === 0, 'Sayfa hatası yok', errs); await ctx.close(); }

  await browser.close(); srv.close();
  process.exit(finish('Güncelleme testi') ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
