// Bağlantı ve sensör uyumu testi: sahte sensörle (sahte_sensor.js) gerçek bağlantı akışı.
// Bağlanma, kısa/uzun kopma, kayıpsız devam, bekçi (sessiz bağlantı), elle kesme, yeniden başlama,
// sensör ayarları komutları, otomatik bağlanma, küçük MTU, gecikmeli paket patlamaları,
// 12 yönde atış → saat yönü ve teşhis, kanting, gerçek atışta sensör sınırı, oturum raporu.
'use strict';
const { serve, check, section, finish, openApp, chromium, fs, path, sleep } = require('./ortak');
const PORT = 8783;
const FAKE = fs.readFileSync(path.join(__dirname, 'sahte_sensor.js'), 'utf8');

const st = (page) => page.evaluate(() => { const b = window.__hisar.ble; return { st: b.st, recv: b.recv, drops: b.drops, dup: b.dup, reconnects: b.reconnects, lastSeq: b.lastSeq, v2: b.v2, fw: b.fw, bat: b.bat, rssi: b.rssi, busy: b.busy, retry: b.retry, cfg: b.cfg }; });
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
    check(iw >= 0 && is > iw && JSON.stringify(ev[iw][1]) === JSON.stringify([7, 0, 0, 0, 0, 0]), 'Akış başlangıç komutu (canlı) bildirimler açılmadan önce yazılıyor', ev.slice(0, 4));
    const f = await fake(page, () => window.__fake.lastFilters);
    check(JSON.stringify(f.filters.map(x => x.namePrefix || 'svc')) === JSON.stringify(['svc', 'HISAR', 'WT']), 'Sensör listesi HİSAR ve WitMotion sensörlerini gösterecek şekilde süzülüyor');
    await sleep(2200);
    const s = await st(page);
    const chip = await page.evaluate(() => document.getElementById('srcChip').textContent);
    const rate = await page.evaluate(() => +document.getElementById('rateNote').textContent.replace(/\D/g, ''));
    check(s.v2 && s.fw === 2 && s.bat === 80 && s.rssi === -58, 'Durum okundu: yazılım 2, pil %80, sinyal −58 dBm', s);
    check(/SENSÖR %80/.test(chip), 'Üst çubukta "SENSÖR %80"', chip);
    check(rate >= 180 && rate <= 220, 'Saniyede ~200 ölçüm', rate);
    check(s.drops === 0 && s.dup === 0, 'Kayıp ve yineleme yok', s);
    const link = await page.evaluate(() => document.getElementById('srcLinkTxt').textContent);
    check(/−?-?58 dBm/.test(link) && /pil %80/.test(link), 'Ana ekranda sinyal ve pil satırı', link);
    // aynı anda tekrar Sensör'e basmak bağlantıyı bozmamalı
    await page.click('#srcSensor'); await sleep(300);
    check((await st(page)).st === 'bagli' && (await fake(page, () => window.__fake.requests)) === 1, 'Bağlıyken Sensör\'e tekrar basmak listeyi açmıyor, bağlantı sürüyor');
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
    check(resumeCmd && resumeCmd[1] === 1 && resumeSeq === lastAtDrop + 1, 'Devam isteği gönderildi: kip 1, kopmadan önce alınan son ölçümün bir sonrası', { resumeSeq, lastAtDrop });
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
    check(/bağlanılamadı/.test(txt) && /deneme/.test(txt), 'Sensör kapalıyken: "bağlanılamadı, yeniden deneniyor"', txt);
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
