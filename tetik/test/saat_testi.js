// Akıllı saat testi (Android uygulaması: sahte yerel katman + sahte sensör): ayar sayfası ve bildirim izni,
// alıştırma açılınca "Hazır · Başla", saatten Başla/Dur, her atışta iyi/kötü bildirimi (skor, hata, Dur düğmesi),
// seri bitince özet (ortalama, iyi atış sayısı, en sık hata, Başla düğmesi), hızlı alıştırmada atış başına bildirim
// gitmemesi, kapatınca bildirimlerin silinmesi ve hiçbir şey gitmemesi.
'use strict';
const { serve, check, section, finish, openApp, chromium, fs, path, sleep, ROOT } = require('./ortak');
const { execFileSync } = require('child_process');
const PORT = 8816;
const FAKE = fs.readFileSync(path.join(__dirname, 'sahte_sensor.js'), 'utf8');
const NATIVE = fs.readFileSync(path.join(__dirname, 'sahte_yerel.js'), 'utf8');
const PAGE_URL = '/tetik/android/app/src/main/assets/www/index.html';

async function waitFor(page, fn, ms, arg) { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await page.evaluate(fn, arg)) return true; await sleep(100); } return false; }
const olaylar = page => page.evaluate(() => window.__nativeLog.filter(e => e[0] === 'saat').map(e => e[1]));
const temizle = page => page.evaluate(() => { const l = window.__nativeLog; for (let i = l.length - 1; i >= 0; i--) if (l[i][0] === 'saat' || l[i][0] === 'saatIzin') l.splice(i, 1); });

(async () => {
  execFileSync('python3', [path.join(ROOT, 'tetik', 'build.py'), '--apk']);
  const srv = await serve(PORT); const browser = await chromium.launch();
  const { page, errs, ctx } = await openApp(browser, { port: PORT, url: PAGE_URL, init: [FAKE, NATIVE] });
  await page.route('https://eminkaan9999-creator.github.io/**', rt => rt.fulfill({ status: 404, body: '' }));
  const H = (fn, a) => page.evaluate(fn, a);

  section('Ayarlar › Akıllı saat ve bildirim izni');
  await H(() => window.__hisar.showView('ayarlar')); await sleep(300);
  const kok = await H(() => { const b = document.getElementById('rtSaat'); return b ? b.textContent.replace(/\s+/g, ' ').trim() : null; });
  check(kok && /Akıllı saat/.test(kok) && /Kapalı/.test(kok), 'Ayarlar\'da "Akıllı saat · Kapalı" satırı var', kok);
  await page.click('#rtSaat'); await sleep(300);
  const sy = await H(() => ({ t: document.getElementById('pgTitle').textContent, on: document.getElementById('wOn').checked, dis: document.getElementById('wOn').disabled, test: !document.getElementById('wTest').disabled }));
  check(sy.t === 'Akıllı Saat' && !sy.on && !sy.dis && sy.test, 'Akıllı Saat sayfası açıldı: "Saate gönder" kapalı ve seçilebilir, "Saati dene" açık', sy);
  await H(() => { window.__saatIzinYok = true; }); await page.click('#wOn'); await sleep(300);
  const red = await H(() => ({ S: window.__hisar.S.saat, on: document.getElementById('wOn').checked, izin: window.__nativeLog.filter(e => e[0] === 'saatIzin').length, toast: document.getElementById('toast').textContent }));
  check(red.izin === 1 && !red.S && !red.on && /izni verilmedi/.test(red.toast), 'Bildirim izni verilmezse açılmıyor ve nedenini söylüyor', red);
  await H(() => { window.__saatIzinYok = false; }); await page.click('#wOn'); await sleep(300);
  const acik = await H(() => ({ S: window.__hisar.S.saat, on: document.getElementById('wOn').checked, kayit: JSON.parse(localStorage.getItem('hisarTetik.v2.meta')).settings.saat }));
  check(acik.S && acik.on && acik.kayit === true, 'İzin verilince "Saate gönder" açıldı ve kaydedildi', acik);
  await temizle(page); await page.click('#wTest'); await sleep(6500);
  const dene = await olaylar(page);
  check(dene.length === 3 && dene[0].iyi === true && dene[1].iyi === false && dene[2].t === 'ozet', '"Saati dene" saate üç bildirim gönderiyor: iyi atış, kötü atış, seri özeti', dene.map(e => e.t + ':' + e.baslik));

  section('Alıştırma: hazır, saatten Başla, her atış, saatten Dur, özet');
  await H(() => { const h = window.__hisar; h.popPage(); h.S.mic = 'kapali'; h.S.sensorShotBeep = false; h.applyCfg(); h.selectSource('sensor', true); });
  check(await waitFor(page, () => window.__hisar.ble.st === 'bagli', 9000), 'Sensör bağlandı');
  await temizle(page); await H(() => window.__hisar.openDrill('serbest')); await sleep(300);
  let ev = await olaylar(page);
  check(ev.length === 1 && ev[0].t === 'hazir' && ev[0].komut === 'basla' && /Serbest Antrenman/.test(ev[0].baslik), 'Alıştırma açılınca saate "Hazır · Serbest Antrenman" ve Başla düğmesi', ev);
  await temizle(page); await H(() => window.__hisarSaat('basla')); await sleep(1800);   // tutuş penceresi dolsun
  const bas = await H(() => !!(window.__hisar.cur.run && window.__hisar.cur.run.active));
  ev = await olaylar(page);
  check(bas && ev.some(e => e.t === 'temizle'), 'Saatteki Başla seriyi başlattı (eski hazır bildirimi silindi)', { bas, ev });
  await temizle(page);
  await H(() => { const F = window.__fake; F.addShot(F.head + 40, { dx: 0.004, dy: 0.003, click: null }); }); await sleep(1500);
  await H(() => { const F = window.__fake; F.addShot(F.head + 40, { dx: -0.9, dy: -0.8, click: null }); }); await sleep(1500);
  ev = await olaylar(page);
  const sk = await H(() => window.__hisar.cur.sess.shots.map(q => ({ sc: Math.round(q.sc), c: q.c[0] || '' })));
  check(ev.length === 2 && ev[0].t === 'atis' && ev[0].iyi === true && new RegExp('^' + sk[0].sc + ' · İyi atış$').test(ev[0].baslik) && /Serbest Antrenman · 1\. atış/.test(ev[0].metin) && ev[0].komut === 'dur',
    'İyi atış: "skor · İyi atış", "Serbest Antrenman · 1. atış", Dur düğmesi', { ev: ev[0], sk: sk[0] });
  const ad2 = await H(c => c && window.__hisar.CAUSES[c] ? window.__hisar.CAUSES[c].ad : '', sk[1] && sk[1].c);
  check(ev[1] && ev[1].iyi === false && ev[1].baslik === `${sk[1].sc} · ${ad2 || 'Kötü atış'}` && /2\. atış/.test(ev[1].metin), 'Kötü atış: skor ve hatanın adı, iki uzun titreşim kanalı', { ev: ev[1], sk: sk[1], ad2 });
  await temizle(page); await H(() => window.__hisarSaat('dur')); await sleep(1500);
  const dur = await H(() => !window.__hisar.cur.run);
  ev = await olaylar(page);
  const oz = ev.find(e => e.t === 'ozet');
  const ort = Math.round((sk[0].sc + sk[1].sc) / 2);
  check(dur && oz && oz.baslik === `Seri bitti · ortalama ${ort}` && /^2 atış · 1 iyi/.test(oz.metin) && oz.komut === 'basla', 'Saatteki Dur seriyi bitirdi; özet: ortalama, atış ve iyi atış sayısı, Başla düğmesi', { dur, oz, ort });
  check(!ad2 || (oz && oz.metin.includes('en sık: ' + ad2.toLocaleLowerCase('tr'))), 'Özette en sık hata yazıyor', oz && oz.metin);

  section('Hızlı alıştırma, kapatma');
  await H(() => { window.__hisar.openDrill('zamanlayici'); }); await sleep(200); await temizle(page);
  await H(() => window.__hisar.startRun()); await sleep(2500);
  await H(() => { const F = window.__fake; F.addShot(F.head + 40, { dx: 0.004, dy: 0.003, click: null }); }); await sleep(1500);
  ev = await olaylar(page);
  check(!ev.some(e => e.t === 'atis'), 'Zamanlayıcıda atış başına bildirim gitmiyor (komut seslerine karışmasın)', ev.map(e => e.t));
  await H(() => window.__hisar.stopRun(false)); await sleep(1200);
  await H(() => window.__hisar.openSetPage('saat')); await sleep(300); await temizle(page);
  await page.click('#wOn'); await sleep(300);
  ev = await olaylar(page);
  const kapali = await H(() => window.__hisar.S.saat);
  check(!kapali && ev.length === 1 && ev[0].t === 'temizle', 'Kapatınca saatteki bildirimler siliniyor', { kapali, ev });
  await H(() => { const h = window.__hisar; h.popPage(); h.openDrill('serbest'); h.startRun(); }); await sleep(400); await temizle(page);
  await H(() => { const F = window.__fake; F.addShot(F.head + 40, { dx: 0.004, dy: 0.003, click: null }); }); await sleep(1500);
  await H(() => window.__hisarSaat('dur')); await sleep(300);
  const hala = await H(() => !!(window.__hisar.cur.run && window.__hisar.cur.run.active));
  await H(() => window.__hisar.stopRun(false)); await sleep(1200);
  ev = await olaylar(page);
  check(ev.length === 0 && hala, 'Kapalıyken hiçbir bildirim gitmiyor, saatten gelen Dur da dikkate alınmıyor', { ev, hala });
  check(errs.length === 0, 'Sayfa hatası yok', errs.slice(0, 5));

  await ctx.close(); await browser.close(); srv.close();
  process.exit(finish('Akıllı saat testi') ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
