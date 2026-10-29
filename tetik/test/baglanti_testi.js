// Bağlantı ve sensör uyumu testi: sahte sensörle (sahte_sensor.js) gerçek bağlantı akışı.
// Bağlanma, kısa/uzun kopma, kayıpsız devam, bekçi (sessiz bağlantı), elle kesme, yeniden başlama,
// sensör ayarları komutları, otomatik bağlanma, küçük MTU, gecikmeli paket patlamaları,
// 12 yönde atış → saat yönü ve teşhis, kanting, gerçek atışta sensör sınırı, oturum raporu.
'use strict';
const { serve, check, section, finish, openApp, chromium, fs, path, sleep } = require('./ortak');
const PORT = 8783;
const FAKE = fs.readFileSync(path.join(__dirname, 'sahte_sensor.js'), 'utf8');

const st = (page) => page.evaluate(() => { const b = window.__hisar.ble; return { st: b.st, recv: b.recv, drops: b.drops, dup: b.dup, reconnects: b.reconnects, lastSeq: b.lastSeq, v2: b.v2, fw: b.fw, bat: b.bat, rssi: b.rssi, busy: b.busy, retry: b.retry, cfg: b.cfg, mic: b.mic, snd: b.snd }; });
const fake = (page, fn, arg) => page.evaluate(fn, arg);
async function waitFor(page, fn, ms, arg) { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await page.evaluate(fn, arg)) return true; await sleep(100); } return false; }
async function connect(page) {
  await page.click('#srcSensor');
  return waitFor(page, () => window.__hisar.ble.st === 'bagli' && window.__hisar.ble.recv > 50, 8000);
}
async function newPage(browser, opts = {}) { return openApp(browser, Object.assign({ port: PORT, init: [FAKE] }, opts)); }
const statusText = page => page.evaluate(() => document.getElementById('srcStatus').textContent);

(async () => {
  const srv = await serve(PORT); const browser = await chromium.launch();

  section('Bağlanma');
  {
    const { ctx, page, errs } = await newPage(browser);
    const ok = await connect(page);
    check(ok, 'Sensör seçilip bağlanıyor, veri akıyor');
    const ev = await fake(page, () => window.__fake.events.filter(e => e[0] === 'yaz' || e[0] === 'abone').map(e => [e[0], e[2] || null]));
    const iw = ev.findIndex(e => e[0] === 'yaz' && e[1][0] === 7), is = ev.findIndex(e => e[0] === 'abone');
    check(iw >= 0 && is > iw && JSON.stringify(ev[iw][1]) === JSON.stringify([7, 0, 0, 0, 0, 0, 1]), 'Akış başlangıç komutu (canlı, ses verisi iste) bildirimler açılmadan önce yazılıyor', ev.slice(0, 4));
    const f = await fake(page, () => window.__fake.lastFilters);
    check(JSON.stringify(f.filters.map(x => x.namePrefix || 'svc')) === JSON.stringify(['svc', 'HISAR', 'WT']), 'Sensör listesi HİSAR ve WitMotion sensörlerini gösterecek şekilde süzülüyor');
    await sleep(2200);
    const s = await st(page);
    const chip = await page.evaluate(() => document.getElementById('srcChip').textContent);
    const rate = await page.evaluate(() => +document.getElementById('rateNote').textContent.replace(/\D/g, ''));
    check(s.v2 && s.fw === 3 && s.bat === 80 && s.rssi === -58, 'Durum okundu: yazılım 3, pil %80, sinyal −58 dBm', s);
    const mic = await page.evaluate(() => ({ mic: window.__hisar.ble.mic, snd: window.__hisar.ble.snd, db: window.__hisar.proc.sDb, on: window.__hisar.proc.micOn }));
    check(mic.mic && mic.snd && mic.db > 24 && mic.db < 32 && mic.on, 'Mikrofon biti okundu, sesli paketler geliyor, oda gürültüsü ~28 dB', mic);
    check(/SENSÖR %80/.test(chip), 'Üst çubukta "SENSÖR %80"', chip);
    check(rate >= 180 && rate <= 220, 'Saniyede ~200 ölçüm', rate);
    check(s.drops === 0 && s.dup === 0, 'Kayıp ve yineleme yok', s);
    const link = await page.evaluate(() => document.getElementById('srcLinkTxt').textContent);
    check(/−?-?58 dBm/.test(link) && /pil %80/.test(link), 'Ana ekranda sinyal ve pil satırı', link);
    // sensör eşlendi: ana ekranda üçlü seçim yerine sensör kartı; bağlıyken Bağlan düğmesi yok
    const card = await page.evaluate(() => ({ seg: document.getElementById('srcSeg').hidden, act: document.getElementById('srcAct').hidden, title: document.getElementById('srcTitle').textContent, last: window.__hisar.S.lastSensor }));
    check(card.seg && card.act && card.title === 'Sensör' && card.last === 'HISAR-SENSOR', 'Eşlendikten sonra ana ekranda üçlü seçim gizli, başlık "Sensör", bağlıyken düğme yok', card);
    // bağlıyken tekrar bağlanma isteği listeyi açmamalı, bağlantıyı bozmamalı
    await page.evaluate(() => window.__hisar.returnToSensor()); await sleep(300);
    check((await st(page)).st === 'bagli' && (await fake(page, () => window.__fake.requests)) === 1, 'Bağlıyken tekrar bağlan istemek listeyi açmıyor, bağlantı sürüyor');
    check(errs.length === 0, 'Sayfa hatası yok', errs);
    await ctx.close();
  }

  section('Kısa kopma (oturum sürerken): kendiliğinden yeniden bağlanma ve kayıpsız devam');
  {
    const { ctx, page, errs } = await newPage(browser);
    await connect(page); await sleep(2000);
    await page.evaluate(() => { window.__hisar.openDrill('serbest'); window.__hisar.startRun(); });
    // bir atış bağlantı varken, bir atış kopukken
    const h0 = await fake(page, () => window.__fake.head);
    await fake(page, h => { window.__fake.addShot(h + 300, { dx: 0.1, dy: -0.3 }); }, h0);
    await sleep(2400);
    const before = await st(page);
    const lastAtDrop = await page.evaluate(() => { window.__fake.inRange = false; window.__fake.drop(); return window.__hisar.ble.lastSeq; });
    const h1 = await fake(page, () => window.__fake.head);
    await fake(page, h => { window.__fake.addShot(h + 250, { dx: -0.3, dy: 0.1 }); }, h1);   // kopukken atış
    await sleep(600);
    const banner = await page.evaluate(() => { const b = document.getElementById('linkBanner'); return b.hidden ? '' : b.textContent; });
    const chip = await page.evaluate(() => document.getElementById('srcChip').textContent);
    check(/koptu/.test(banner) && /kaybolmayacak/.test(banner), 'Oturum ekranında kopma uyarısı: "ölçümler kaybolmayacak"', banner);
    check(/BAĞLANIYOR/.test(chip), 'Üst çubuk "BAĞLANIYOR"', chip);
    await sleep(1700);
    await fake(page, () => { window.__fake.inRange = true; });
    const back = await waitFor(page, () => window.__hisar.ble.st === 'bagli', 8000);
    await sleep(1500);
    const after = await st(page);
    const resumeCmd = await fake(page, () => window.__fake.writes.filter(w => w[0] === 7).pop());
    const resumeSeq = resumeCmd ? (resumeCmd[2] | (resumeCmd[3] << 8) | (resumeCmd[4] << 16) | (resumeCmd[5] << 24)) >>> 0 : -1;
    check(back, 'Sensör menzile dönünce kendiliğinden yeniden bağlandı');
    check(resumeCmd && resumeCmd[1] === 1 && resumeSeq === lastAtDrop + 1 && resumeCmd[6] === 1, 'Devam isteği gönderildi: kip 1, kopmadan önce alınan son ölçümün bir sonrası (ses verisiyle)', { resumeSeq, lastAtDrop });
    check(after.drops === 0 && after.reconnects === 1, 'Kopma boyunca hiçbir ölçüm kaybolmadı', after);
    const shots = await page.evaluate(() => window.__hisar.cur.sess.shots.length);
    check(shots >= 2, 'Kopukken yapılan atış da bağlantı gelince algılandı', shots);
    const msg = await statusText(page);
    check(/kaybı olmadı/.test(msg), 'Durum: "arada ölçüm kaybı olmadı"', msg);
    check(errs.length === 0, 'Sayfa hatası yok', errs);
    await ctx.close();
  }

  section('Uzun kopma (12 sn) ve bağlantı bekçisi');
  {
    const { ctx, page, errs } = await newPage(browser);
    await connect(page); await sleep(1500);
    await fake(page, () => { window.__fake.inRange = false; window.__fake.drop(); });
    await sleep(12000);
    const s1 = await st(page);
    const txt = await statusText(page);
    check(s1.st === 'yeniden' && s1.retry >= 5 && /deneme/.test(txt) && /BEKLİYOR/.test(txt), '12 sn boyunca denemeye devam ediyor, kullanıcıya ipucu veriyor', { s1, txt });
    await fake(page, () => { window.__fake.inRange = true; });
    check(await waitFor(page, () => window.__hisar.ble.st === 'bagli', 8000), 'Uzun kopmadan sonra da yeniden bağlandı');
    const lastCmd = await fake(page, () => window.__fake.writes.filter(w => w[0] === 7).pop());
    check(lastCmd && lastCmd[1] === 0, '10 saniyeyi aşan kopmada canlı akışa geçiliyor (eski veri gönderilmiyor)', lastCmd);
    await sleep(500);
    check(/Bağlantı geri geldi/.test(await statusText(page)), 'Durum: "Bağlantı geri geldi (… sn kesinti)"');
    // bekçi: bağlantı açık görünüyor ama hiç paket gelmiyor
    const dc0 = await fake(page, () => window.__fake.disconnectCalls);
    await fake(page, () => { window.__fake.silent = true; });
    const healed = await waitFor(page, (dc0) => window.__fake.disconnectCalls > dc0 && window.__hisar.ble.st === 'bagli' && window.__hisar.ble.recv > 0, 12000, dc0);
    const s2 = await st(page);
    check(healed, 'Sessiz kalan bağlantı 4 sn sonra bekçi tarafından yenilendi', s2);
    check(s2.drops === 0, 'Bekçi yenilemesinde de ölçüm kaybı yok', s2);
    check(errs.length === 0, 'Sayfa hatası yok', errs);
    await ctx.close();
  }

  section('Elle kesme, yeniden başlama, başka sensör seçiminden vazgeçme');
  {
    const { ctx, page, errs } = await newPage(browser);
    await connect(page); await sleep(1200);
    await page.evaluate(() => window.__hisar.openSettings('baglanti')); await sleep(300);
    await page.click('#sbDisc'); await sleep(200);
    const c0 = await fake(page, () => window.__fake.connects);
    await sleep(3000);
    const c1 = await fake(page, () => window.__fake.connects);
    check(c1 === c0 && (await st(page)).st === 'off', '"Bağlantıyı kes" sonrası yeniden bağlanma denenmiyor', { c0, c1 });
    await page.click('#sbConnect');
    check(await waitFor(page, () => window.__hisar.ble.st === 'bagli', 6000), '"Yeniden bağlan" ile liste açılmadan bağlanıyor');
    check((await fake(page, () => window.__fake.requests)) === 1, 'Sensör listesi tekrar açılmadı');
    // sensör yeniden başlıyor (pil, düğme)
    await sleep(1500);
    const r0 = (await st(page)).recv;
    await fake(page, () => window.__fake.reboot('test'));
    check(await waitFor(page, () => window.__hisar.ble.st === 'bagli', 8000), 'Sensör yeniden başlayınca kendiliğinden bağlandı');
    await sleep(2000);
    const s = await st(page);
    check(s.recv > r0 + 300 && s.dup < 60, 'Yeniden başlamadan sonra ölçümler kabul ediliyor (sayaç sıfırlandığı anlaşıldı)', { recv: s.recv - r0, dup: s.dup });
    // başka sensör seç → vazgeç: bağlantı sürmeli
    await fake(page, () => { window.__fake.cancelChooser = true; });
    await page.click('#sbOther'); await sleep(800);
    const s3 = await st(page); const recv3 = s3.recv; await sleep(600);
    check(s3.st === 'bagli' && (await st(page)).recv > recv3, '"Başka sensör seç" listesinden vazgeçilince mevcut bağlantı sürüyor', s3);
    check(errs.length === 0, 'Sayfa hatası yok', errs);
    await ctx.close();
  }

  section('Sensör ayarları komutları (Ayarlar › Sensör bağlantısı)');
  {
    const { ctx, page, errs } = await newPage(browser);
    await connect(page); await sleep(1500);
    await page.evaluate(() => window.__hisar.openSettings('baglanti')); await sleep(600);
    const has = await page.evaluate(() => !!document.getElementById('dvBri'));
    check(has, 'Sensör cihazı ayarları görünüyor (yazılım 2)');
    await page.evaluate(() => { const r = document.getElementById('dvBri'); r.value = '80'; r.dispatchEvent(new Event('input', { bubbles: true })); });
    await page.click('#dvScr [data-v="60"]'); await page.click('#dvOff [data-v="30"]');
    await page.evaluate(() => { const r = document.getElementById('dvVol'); r.value = '30'; r.dispatchEvent(new Event('input', { bubbles: true })); });
    await sleep(900);
    const cfg = await fake(page, () => window.__fake.cfg);
    check(cfg.bri === 80 && cfg.scr === 60 && cfg.off === 30 && cfg.vol === 30, 'Parlaklık, ekran süresi, otomatik kapanma, ses sensöre yazıldı', cfg);
    const tone = await fake(page, () => window.__fake.lastTone);
    check(tone && tone[0] === 1, 'Ses seviyesi değişince sensör deneme bipi çalıyor', tone);
    await sleep(1300);
    const echo = (await st(page)).cfg;
    check(echo && echo.bri === 80 && echo.vol === 30, 'Sensörün durum paketi yeni ayarları geri bildiriyor', echo);
    await page.click('#sbFind'); await sleep(200);
    check((await fake(page, () => window.__fake.identified)) === 1, '"Sensörü bul" komutu gitti');
    await page.selectOption('#dvNo', '2'); await sleep(200);
    await page.click('#askOk');
    check(await waitFor(page, () => window.__fake.cfg.no === 2, 2000), 'Sensör numarası onaydan sonra yazıldı');
    check(await waitFor(page, () => window.__hisar.ble.st === 'bagli' && window.__fake.name === 'HISAR-SENSOR-2', 8000), 'Sensör yeni adla (HISAR-SENSOR-2) yeniden başladı, uygulama kendiliğinden bağlandı');
    await sleep(600);
    await page.click('#dvRestart'); await page.click('#askOk');
    check(await waitFor(page, () => window.__fake.events.some(e => e[0] === 'yenidenbaslama' && e[2] === 'yeniden'), 2000), '"Yeniden başlat" komutu gitti');
    check(await waitFor(page, () => window.__hisar.ble.st === 'bagli', 8000), 'Yeniden başlatmadan sonra bağlandı');
    await sleep(500);
    await page.click('#dvOffNow'); await page.click('#askOk'); await sleep(1200);
    const s = await st(page);
    check((await fake(page, () => window.__fake.poweredOff)) && s.st === 'off', '"Sensörü kapat": sensör kapandı, uygulama boşuna yeniden denemiyor', s);
    check(errs.length === 0, 'Sayfa hatası yok', errs);
    await ctx.close();
  }

  section('Açılışta otomatik bağlanma, ilk bağlantıda menzil dışı, küçük MTU, gecikmeli patlamalar');
  {
    const meta = JSON.stringify({ v: 2, settings: { lastSource: 'sensor', lastSensor: 'HISAR-SENSOR', autoConnect: true }, ids: [] });
    const { ctx, page, errs } = await newPage(browser, { init: [FAKE, 'window.__fake.allowGetDevices=true;'], storage: { 'hisarTetik.v2.meta': meta } });
    check(await waitFor(page, () => window.__hisar.ble.st === 'bagli', 6000), 'Açılışta son sensöre listeyi açmadan bağlandı');
    check((await fake(page, () => window.__fake.requests)) === 0, 'Sensör listesi hiç açılmadı');
    check(errs.length === 0, 'Sayfa hatası yok', errs);
    await ctx.close();
  }
  {
    const { ctx, page, errs } = await newPage(browser, { init: [FAKE, 'window.__fake.inRange=false;'] });
    await page.click('#srcSensor'); await sleep(2500);
    const txt = await statusText(page);
    check(/Sensör bekleniyor/.test(txt) && /açılınca bağlanır/.test(txt) && /deneme/.test(txt), 'Sensör kapalıyken: "Sensör bekleniyor; açılınca bağlanır … deneme"', txt);
    await fake(page, () => { window.__fake.inRange = true; });
    check(await waitFor(page, () => window.__hisar.ble.st === 'bagli', 8000), 'Sensör açılınca kendiliğinden bağlandı');
    check(/Bağlı/.test(await statusText(page)), 'Durum "Bağlı"');
    check(errs.length === 0, 'Sayfa hatası yok', errs);
    await ctx.close();
  }
  {
    const { ctx, page, errs } = await newPage(browser, { init: [FAKE, 'window.__fake.mtu=23;'] });
    await connect(page); await sleep(4000);
    const s = await st(page);
    const rate = await page.evaluate(() => +document.getElementById('rateNote').textContent.replace(/\D/g, ''));
    check(s.drops === 0 && rate >= 180, 'Küçük paket (MTU 23, paket başına 1 ölçüm): kayıpsız, ~200 ölçüm/sn', { drops: s.drops, rate });
    await ctx.close();
  }
  {
    const { ctx, page, errs } = await newPage(browser);
    await connect(page);
    const taps = await page.evaluate(async () => {
      const out = []; window.__hisarTap = (sq, t) => out.push([sq, t]);
      const F = window.__fake; for (let i = 0; i < 4; i++) { F.holdUntil = performance.now() + 700; await new Promise(r => setTimeout(r, 1300)); }
      return out;
    });
    const s = await st(page);
    let maxErr = 0; const base = taps.length ? taps[taps.length - 1][1] - taps[taps.length - 1][0] * 5 : 0;
    for (const [sq, t] of taps) maxErr = Math.max(maxErr, Math.abs(t - sq * 5 - base));
    check(s.drops === 0 && taps.length > 800, '0,7 sn\'lik gecikme patlamalarında kayıp yok', { drops: s.drops, n: taps.length });
    check(maxErr < 30, 'Geç gelen ölçümler de doğru zamana yerleşiyor (sapma < 30 ms)', Math.round(maxErr));
    check(errs.length === 0, 'Sayfa hatası yok', errs);
    await ctx.close();
  }

  section('Eşlenmiş sensör: açılışta Deneme\'ye düşmeden bekleme, Deneme Ayarlar\'da, deneme oturumları kaydedilmez');
  {
    // sensör kapalı, tarayıcı izinli cihazı veriyor: açılışta kaynak sensör, açılınca kendiliğinden bağlanır
    const meta = JSON.stringify({ v: 2, settings: { lastSource: 'demo', lastSensor: 'HISAR-SENSOR', autoConnect: true }, ids: [] });
    const { ctx, page, errs } = await newPage(browser, { init: [FAKE, 'window.__fake.allowGetDevices=true; window.__fake.inRange=false;'], storage: { 'hisarTetik.v2.meta': meta } });
    await sleep(1500);
    const a = await page.evaluate(() => ({ src: window.__hisar.source, sim: !!window.__hisar.sim, chip: document.getElementById('srcChip').textContent, seg: document.getElementById('srcSeg').hidden,
      title: document.getElementById('srcTitle').textContent, status: document.getElementById('srcStatus').textContent }));
    check(a.src === 'sensor' && !a.sim && !/DENEME/.test(a.chip), 'Son kaynak Deneme olsa bile eşlenmiş sensör varken açılış sensörle (sanal atıcı çalışmıyor)', a);
    check(a.seg && a.title === 'Sensör' && /HISAR-SENSOR/.test(a.status), 'Ana ekran: üçlü seçim yok, "Sensör" başlığı, durum sensör adını söylüyor', a);
    await page.evaluate(() => { window.__hisar.openDrill('serbest'); window.__hisar.startRun(); }); await sleep(200);
    const run = await page.evaluate(() => !!(window.__hisar.cur.run && window.__hisar.cur.run.active));
    check(!run, 'Sensör bağlı değilken alıştırma başlamıyor (sanal atış üretilmiyor)');
    await page.evaluate(() => window.__hisar.showView('alistirma'));
    await fake(page, () => { window.__fake.inRange = true; });
    check(await waitFor(page, () => window.__hisar.ble.st === 'bagli', 9000), 'Sensör açılınca listeyi açmadan kendiliğinden bağlandı');
    check((await fake(page, () => window.__fake.requests)) === 0, 'Sensör listesi hiç açılmadı');
    check(errs.length === 0, 'Sayfa hatası yok', errs);
    await ctx.close();
  }
  {
    // tarayıcı izinli cihaz vermiyor: "Bağlan" düğmesi, dokununca liste ve bağlantı
    const meta = JSON.stringify({ v: 2, settings: { lastSource: 'sensor', lastSensor: 'HISAR-SENSOR', autoConnect: true }, ids: [] });
    const { ctx, page, errs } = await newPage(browser, { storage: { 'hisarTetik.v2.meta': meta } });
    await sleep(1200);
    const a = await page.evaluate(() => ({ src: window.__hisar.source, act: document.getElementById('srcAct').hidden, btn: document.getElementById('srcGo').textContent, status: document.getElementById('srcStatus').textContent }));
    check(a.src === 'sensor' && !a.act && a.btn === 'Bağlan' && /Sensör bekleniyor/.test(a.status) && /Bağlan/.test(a.status), 'Otomatik bağlanma yoksa: "Sensör bekleniyor … Bağlan\'a dokun" ve Bağlan düğmesi', a);
    await page.click('#srcGo');
    check(await waitFor(page, () => window.__hisar.ble.st === 'bagli', 6000), 'Bağlan\'a dokununca sensör seçilip bağlandı');
    check(await page.evaluate(() => document.getElementById('srcAct').hidden), 'Bağlanınca düğme gizlendi');
    // Deneme modu Ayarlar'dan; deneme oturumu kaydedilmez; Sensöre dön listeyi açmadan bağlanır
    await page.evaluate(() => window.__hisar.openSettings('baglanti')); await sleep(300);
    await page.click('#altDemo'); await sleep(400);
    const d = await page.evaluate(() => ({ src: window.__hisar.source, title: document.getElementById('srcTitle').textContent, btn: document.getElementById('srcGo').textContent, act: document.getElementById('srcAct').hidden, view: !document.getElementById('v-alistirma').hidden }));
    check(d.src === 'demo' && d.title === 'Deneme modu' && !d.act && d.btn === 'Sensöre dön' && d.view, 'Ayarlar › Deneme modu: ana ekranda "Deneme modu" ve "Sensöre dön"', d);
    const n0 = await page.evaluate(() => window.__hisar.sessions.filter(x => !x.sample).length);
    await page.evaluate(() => { window.__hisar.openDrill('serbest'); window.__hisar.startRun(); });
    await sleep(500);
    const tag = await page.evaluate(() => document.getElementById('sessSub').textContent);
    await page.evaluate(() => { for (let i = 0; i < 3; i++) setTimeout(() => window.__hisar.sim.fire(performance.now()), 200 + i * 700); });
    await sleep(3200);
    await page.evaluate(() => window.__hisar.stopRun(false)); await sleep(1200);
    const r = await page.evaluate(() => ({ shots: window.__hisar.cur.sess.shots.length, saved: window.__hisar.sessions.includes(window.__hisar.cur.sess), n: window.__hisar.sessions.filter(x => !x.sample).length,
      ls: Object.keys(localStorage).filter(k => k.startsWith('hisarTetik.v2.s.')).length, sheet: document.getElementById('sheetBody').textContent }));
    check(/kaydedilmez/i.test(tag), 'Deneme oturumunda "Deneme · kaydedilmez" etiketi', tag);
    check(r.shots >= 2 && !r.saved && r.n === n0 && r.ls === 0, 'Deneme oturumu atış sayıyor ama geçmişe ve depoya girmiyor', r);
    check(/kaydedilmedi/.test(r.sheet), 'Sonuç ekranında "geçmişe kaydedilmedi" notu', r.sheet.slice(0, 120));
    await page.evaluate(() => { const c = document.querySelector('#sheet [data-close]'); if (c) c.click(); window.__hisar.showView('alistirma'); });
    const req0 = await fake(page, () => window.__fake.requests);
    await page.click('#srcGo');
    check(await waitFor(page, () => window.__hisar.ble.st === 'bagli' && window.__hisar.source === 'sensor', 6000), '"Sensöre dön" ile tekrar sensöre bağlandı');
    check((await fake(page, () => window.__fake.requests)) === req0, '"Sensöre dön" listeyi açmadı (bilinen sensör)');
    // Sensörü unut: ilk kullanım görünümüne döner
    await page.evaluate(() => window.__hisar.openSettings('baglanti')); await sleep(300);
    await page.click('#sbForget'); await page.click('#sbFgYes'); await sleep(300);
    const f = await page.evaluate(() => ({ last: window.__hisar.S.lastSensor, src: window.__hisar.source, seg: document.getElementById('srcSeg').hidden }));
    check(f.last === '' && f.src === 'demo' && f.seg === false, '"Sensörü unut": kayıtlı sensör silindi, üçlü seçim geri geldi', f);
    check(errs.length === 0, 'Sayfa hatası yok', errs);
    await ctx.close();
  }
  {
    // önceki sürümde kaydedilmiş deneme oturumları açılışta temizlenir, gerçek oturumlar kalır
    const shot = { n: 1, at: 100, sc: 80, tr: 0.1, ho: 0.1, hx: 0.05, hy: 0.05, dx: 0.1, dy: 0, h: 3, ca: 0, po: 0, ri: 0, pg: 0, rc: null, c: [], x: {} };
    const mk = (id, src) => ({ id, v: 2, drill: 'serbest', date: Date.now() - 1000, dur: 10, src, mode: 'kuru', weapon: 'pistol', weaponName: '', hand: 'R', handMode: 'normal', diff: 'normal', notes: '', extra: {}, shots: [shot] });
    const meta = JSON.stringify({ v: 2, settings: {}, ids: ['sDemo1', 'sReal1'] });
    const { ctx, page, errs } = await newPage(browser, { storage: { 'hisarTetik.v2.meta': meta, 'hisarTetik.v2.s.sDemo1': JSON.stringify(mk('sDemo1', 'demo')), 'hisarTetik.v2.s.sReal1': JSON.stringify(mk('sReal1', 'sensor')) } });
    await sleep(2600);
    const r = await page.evaluate(() => ({ ids: window.__hisar.sessions.map(x => x.id), ls: Object.keys(localStorage).filter(k => k.startsWith('hisarTetik.v2.s.')), meta: JSON.parse(localStorage.getItem('hisarTetik.v2.meta')).ids, toast: document.getElementById('toast').textContent }));
    check(JSON.stringify(r.ids) === '["sReal1"]' && JSON.stringify(r.ls) === '["hisarTetik.v2.s.sReal1"]' && JSON.stringify(r.meta) === '["sReal1"]', 'Eski deneme oturumu geçmişten ve depodan silindi, sensör oturumu duruyor', r);
    check(/deneme oturumu geçmişten kaldırıldı/.test(r.toast), 'Kullanıcıya bildirildi', r.toast);
    check(errs.length === 0, 'Sayfa hatası yok', errs);
    await ctx.close();
  }

  section('Uçtan uca: 12 yönde atış → saat yönü ve teşhis (sağ ve sol el), kanting, gerçek atış');
  {
    const { ctx, page, errs } = await newPage(browser);
    await connect(page); await sleep(2500);                       // otomatik kalibrasyon için hareketsiz
    await page.evaluate(() => { window.__hisar.openDrill('serbest'); window.__hisar.startRun(); });
    let h0 = await fake(page, () => window.__fake.head);
    const hours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    await fake(page, ({ h0, hours }) => { hours.forEach((h, i) => { const a = h * 30 * Math.PI / 180; window.__fake.addShot(h0 + 400 + i * 460, { dx: 0.4 * Math.sin(a), dy: 0.4 * Math.cos(a) }); }); }, { h0, hours });
    await sleep(400 * 5 + 12 * 460 * 5 + 1500);
    const shots = await page.evaluate(() => window.__hisar.cur.sess.shots.map(q => ({ h: q.h, sc: q.sc, c: q.c, tr: q.tr })));
    const gotH = shots.map(q => q.h);
    check(JSON.stringify(gotH) === JSON.stringify(hours), '12 yönün hepsi doğru saate düştü', gotH);
    const expR = { 3: ['basparmak', 'az_parmak'], 9: ['fazla_parmak', 'tokatlama'], 6: ['bilek_asagi', 'ileri_itme'], 12: ['bilek_yukari', 'geri_tepme'] };
    const okR = [12, 3, 6, 9].every(h => { const q = shots[hours.indexOf(h)]; return q && JSON.stringify(q.c.slice(0, 2)) === JSON.stringify(expR[h]); });
    check(okR, 'Sağ el teşhisleri: 3:00 başparmak, 6:00 bilek aşağı, 9:00 fazla parmak, 12:00 bilek yukarı', [12, 3, 6, 9].map(h => shots[hours.indexOf(h)] && shots[hours.indexOf(h)].c));
    check(shots.every(q => q.tr > 0.3 && q.tr < 0.5), 'Tetik hareketi büyüklüğü doğru ölçüldü (0,4° ± 0,1°)', shots.map(q => q.tr));
    await page.evaluate(() => window.__hisar.stopRun(false)); await sleep(1200);
    await page.evaluate(() => { document.querySelector('#sheet [data-close]') && document.querySelector('#sheet [data-close]').click(); });
    // sol el: aynı yön → aynalanmış teşhis
    await page.evaluate(() => { window.__hisar.S.hand = 'L'; window.__hisar.openDrill('serbest'); window.__hisar.startRun(); });
    h0 = await fake(page, () => window.__fake.head);
    await fake(page, (h0) => { window.__fake.addShot(h0 + 400, { dx: 0.4, dy: 0 }); window.__fake.addShot(h0 + 860, { dx: -0.4, dy: 0 }); }, h0);
    await sleep(400 * 5 + 2 * 460 * 5 + 1200);
    const left = await page.evaluate(() => window.__hisar.cur.sess.shots.map(q => ({ h: q.h, c: q.c })));
    check(left.length === 2 && left[0].h === 3 && JSON.stringify(left[0].c.slice(0, 2)) === JSON.stringify(['fazla_parmak', 'tokatlama']) && JSON.stringify(left[1].c.slice(0, 2)) === JSON.stringify(['basparmak', 'az_parmak']),
      'Sol el: 3:00 → fazla parmak, 9:00 → başparmak (aynalanmış şema)', left);
    await page.evaluate(() => window.__hisar.stopRun(false)); await sleep(1200);
    await page.evaluate(() => { const c = document.querySelector('#sheet [data-close]'); if (c) c.click(); window.__hisar.S.hand = 'R'; });
    // kanting
    await page.evaluate(() => { window.__hisar.openDrill('serbest'); window.__hisar.startRun(); });
    h0 = await fake(page, () => window.__fake.head);
    await fake(page, (h0) => { window.__fake.addShot(h0 + 700, { dx: 0, dy: -0.05, tilt: 4 }); }, h0);
    await sleep(700 * 5 + 1500);
    const k = await page.evaluate(() => window.__hisar.cur.sess.shots.map(q => ({ ca: q.ca, c: q.c })));
    check(k.length === 1 && Math.abs(Math.abs(k[0].ca) - 4) < 0.6 && k[0].c.includes('kanting'), 'Silah 4° yatırılınca kanting ölçüldü ve teşhis edildi', k);
    await page.evaluate(() => window.__hisar.stopRun(false)); await sleep(1200);
    await page.evaluate(() => { const c = document.querySelector('#sheet [data-close]'); if (c) c.click(); });
    // gerçek atış: ivme ve jiroskop sınırı
    await page.evaluate(() => { const H = window.__hisar; H.S.mode = 'gercek'; H.openDrill('geritepme'); H.startRun(); });
    h0 = await fake(page, () => window.__fake.head);
    await fake(page, (h0) => { window.__fake.addShot(h0 + 400, { dx: 0.05, dy: -0.1, live: true }); }, h0);
    await sleep(400 * 5 + 1600);
    const live = await page.evaluate(() => window.__hisar.cur.sess.shots.map(q => ({ sat: q.x.sat, pg: q.pg, n: q.n })));
    check(live.length === 1 && live[0].sat === 3, 'Gerçek atış: ±16 g ve 2000 °/sn sınırına dayanma işaretlendi (tek atış algılandı)', live);
    await page.evaluate(() => window.__hisar.setSub('iz')); await sleep(300);
    const notes = await page.evaluate(() => document.getElementById('izKv').textContent);
    check(/±16 g/.test(notes) && /2000/.test(notes) && /etkilenmez/.test(notes), 'İz ekranında sınır notu ve "tetik ölçümü etkilenmez" açıklaması', notes.slice(0, 160));
    await page.evaluate(() => window.__hisar.stopRun(false)); await sleep(1200);
    // rapor
    const rep = await page.evaluate(async () => {
      const H = window.__hisar; const s = H.sessions.find(x => x.drill === 'serbest' && x.shots.length >= 12);
      const c = await H.buildReport(s); const png = await new Promise(r => c.toBlob(r, 'image/png'));
      const r2 = await new Promise(res => { const a = []; window.__shareLog = a; res(true); });
      return { w: c.width, h: c.height, png: png.size };
    });
    check(rep.w === 1080 && rep.h > 1500 && rep.png > 40000, 'Oturum raporu görseli üretildi (1080 px genişlik)', rep);
    check(errs.length === 0, 'Sayfa hatası yok', errs);
    await ctx.close();
  }

  await browser.close(); srv.close();
  process.exit(finish('Bağlantı testi') ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
