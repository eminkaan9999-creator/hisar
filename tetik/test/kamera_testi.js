// Kamera ekranı testi (sahte sensör + sahte kamera): puanlamayı Kamera ekranından açma; önizleme; hedefi üç dokunuşla
// tanıtma; lazer noktasının görülmesi; sensörle sıfırlama; dört adımın ve durum rozetinin ilerlemesi; ekrandan çıkınca
// kameranın kapanması, dönünce açılması; ayarlardan dönüş; kapatma; kamera izni reddi; ayarlanan kamerayla oturumda puan.
// Gerçek kamera ve lazer donanım testi değildir.
'use strict';
const { serve, check, section, finish, openApp, chromium, fs, path, sleep } = require('./ortak');
const PORT = 8830;
const FAKE = fs.readFileSync(path.join(__dirname, 'sahte_sensor.js'), 'utf8');
const CAM = fs.readFileSync(path.join(__dirname, 'sahte_kamera.js'), 'utf8');
async function waitFor(page, fn, ms, arg) { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await page.evaluate(fn, arg)) return true; await sleep(100); } return false; }

(async () => {
  const srv = await serve(PORT); const browser = await chromium.launch();
  const { page, errs } = await openApp(browser, { port: PORT, init: [FAKE, CAM] });
  const H = (fn, a) => page.evaluate(fn, a);
  const durum = () => H(() => ({ rozet: (document.querySelector('#v-kamera .k-rozet') || {}).textContent, tamam: Array.from(document.querySelectorAll('#v-kamera .km-adim')).map(li => li.classList.contains('tamam')),
    on: window.__hisar.S.lazer.on, akis: !!window.__hisar.LZ.stream, not: (document.getElementById('kmDurum') || {}).textContent || '' }));
  const atis = o => H(o => { const F = window.__fake, C = window.__cam, seq = F.head + 80, tb = F.t0 + seq * 5;
    if (o.nokta) C.dots.push({ t0: tb - 500, t1: tb + 300, x: o.nokta[0], y: o.nokta[1] });
    F.addShot(seq, { dx: o.dx || 0, dy: o.dy || 0, click: null }); return tb; }, o);
  await H(() => { const h = window.__hisar; h.S.mic = 'kapali'; h.S.sensorShotBeep = false; h.S.mode = 'kuru'; h.S.dist = 25; h.S.sound = 'kapali'; h.applyCfg(); h.selectSource('sensor', true); });
  check(await waitFor(page, () => window.__hisar.ble.st === 'bagli', 9000), 'Sensör bağlandı');

  section('Kamera ekranı: puanlama kapalıyken');
  await H(() => window.__hisar.showView('kamera')); await sleep(300);
  let d = await durum();
  check(d.rozet === 'Kapalı' && !d.on && !d.akis && await H(() => window.__cam.opened === 0 && !!document.getElementById('kmAc')),
    'Kapalı rozeti, "Kamerayla puanlamayı aç" düğmesi; kamera izin istenmeden açılmadı', d);

  section('Açma: önizleme ve adımlar aynı ekranda');
  await page.click('#kmAc');
  check(await waitFor(page, () => /1920×1080/.test((document.getElementById('kmDurum') || {}).textContent || ''), 5000), 'Kamera açıldı, görüntü ekranda işleniyor (1920×1080)',
    await H(() => (document.getElementById('kmDurum') || {}).textContent));
  await sleep(600);
  d = await durum();
  check(d.on && d.akis && d.rozet === 'Ayar gerekli' && JSON.stringify(d.tamam) === '[true,false,false,false]', 'Puanlama açık; 1. adım (kamera) tamam; rozet "Ayar gerekli"', d);
  check(await H(() => window.__hisar.curView === 'kamera' && window.__hisar.pages.length === 0 && document.getElementById('kmSif').disabled && document.getElementById('kmBasla').disabled),
    'Ayar sayfasına gidilmedi; hedef tanıtılmadan sıfırlama ve başlatma kapalı');
  const px = await H(() => { const c = document.getElementById('kmCv'), x = c.getContext('2d').getImageData(4, 4, 1, 1).data; return [x[0], x[1], x[2]]; });
  check(Math.abs(px[0] - 118) < 12 && Math.abs(px[1] - 112) < 12 && Math.abs(px[2] - 100) < 12, 'Önizlemede kamera görüntüsü çiziliyor (köşede toprak set rengi)', px);

  section('Hedefi tanıtma: önizlemeye üç dokunuş');
  await page.click('#kmTan'); await sleep(300);
  check(await H(() => window.__hisar.LZ.adim === 'kaba' && /hedefe dokun/i.test(document.getElementById('kmTanN').textContent)), 'Tanıtma başladı: "hedefe dokun"');
  await H(() => document.getElementById('kmCv').scrollIntoView({ block: 'center' })); await sleep(200);
  const tap = async (fx, fy) => { const r = await H(([fx, fy]) => { const L = window.__hisar.LZ, g = L.gor, b = document.getElementById('kmCv').getBoundingClientRect();
    return { x: b.left + (fx / L.W - g.x) / g.w * b.width, y: b.top + (fy / L.W - g.y) / g.h * b.height }; }, [fx, fy]); await page.mouse.click(r.x, r.y); await sleep(350); };
  await tap(975, 530);
  check(await H(() => window.__hisar.LZ.adim === 'merkez' && window.__hisar.LZ.zm === 8 && /MERKEZ/.test(document.getElementById('kmTanN').textContent)), 'Hedefe dokununca 8× yakınlaştı; sıra merkezde');
  await tap(960, 540);
  await page.click('#kmZmE'); await sleep(300);
  check(await H(() => window.__hisar.LZ.adim === 'kenar' && window.__hisar.LZ.zm === 4), 'Merkez alındı; "−" ile 4×; sıra dış kenarda');
  await tap(1080, 540); await sleep(400);
  const cal = await H(() => { const h = window.__hisar, L = h.S.lazer; return { hz: h.lzHazir(), c: L.c.map(v => +(v * 1920).toFixed(1)), k: +(h.lzK() * 1920).toFixed(2) }; });
  d = await durum();
  check(cal.hz && Math.hypot(cal.c[0] - 960, cal.c[1] - 540) < 1.5 && Math.abs(cal.k - 4.8) < 0.12, `Hedef tanıtıldı: merkez ${cal.c} piksel (960, 540), ${cal.k} piksel/cm (4,80)`, cal);
  check(d.rozet === 'Sıfırlanmadı' && d.tamam[1] && !d.tamam[3] && await H(() => !document.getElementById('kmSif').disabled && !document.getElementById('kmBasla').disabled),
    '2. adım tamam; rozet "Sıfırlanmadı"; sıfırlama ve başlatma açıldı', d);

  section('Lazer noktası kamerada görülünce 3. adım tamamlanır');
  check(!(await durum()).tamam[2], 'Nokta görülmeden 3. adım açık');
  await H(() => { const t = performance.now(); window.__cam.dots.push({ t0: t, t1: t + 1500, x: 20, y: -12 }); });
  check(await waitFor(page, () => { const li = document.querySelectorAll('#v-kamera .km-adim')[2]; return !!li && li.classList.contains('tamam'); }, 4000), '3. adım tamam: "Lazer noktası görüldü"',
    await H(() => (document.querySelectorAll('#v-kamera .km-adim')[2] || {}).textContent));
  check(/görüldü/.test(await H(() => document.getElementById('kmLzN').textContent)), 'Adım notu noktanın görüldüğünü söylüyor');

  section('Sıfırlama: sensörle 3 atış, Kamera ekranında');
  const PX = 4.8, Z = [3 * PX, -2 * PX];
  await page.click('#kmSif'); await sleep(300);
  check(await H(() => !!window.__hisar.LZ.sifir && /0\/3/.test(document.getElementById('kmSif').textContent)), 'Sıfırlama başladı (0/3)');
  await atis({ nokta: [Z[0] + 0.6, Z[1] - 0.4] }); await sleep(1500);
  check(await H(() => /1\/3/.test(document.getElementById('kmSif').textContent)), 'İlk atış sayıldı (1/3), ekran güncellendi');
  for (const [nx, ny] of [[-0.5, 0.6], [0.2, -0.3]]) { await atis({ nokta: [Z[0] + nx, Z[1] + ny] }); await sleep(1500); }
  const z = await H(() => ({ z: window.__hisar.S.lazer.z, sur: !!window.__hisar.LZ.sifir }));
  d = await durum();
  check(z.z && Math.abs(z.z[0] - 3) < 0.3 && Math.abs(z.z[1] - 2) < 0.3 && !z.sur, `Lazer sıfırlandı: ${z.z} cm (gerçek 3, 2)`, z);
  check(d.rozet === 'Hazır' && JSON.stringify(d.tamam) === '[true,true,true,true]', 'Dört adım tamam; rozet "Hazır"', d);
  await H(() => window.__hisar.showView('merkez')); await sleep(300);
  check(/Hazır/.test(await H(() => Array.from(document.querySelectorAll('#mzTiles .k-tile')).map(t => t.innerText).join(' | '))), 'Kontrol Merkezi kamera kutusu "Hazır"');
  check(await waitFor(page, () => !window.__hisar.LZ.stream, 3000), 'Kamera ekranından çıkınca kamera kapandı (oturum yok)');

  section('Geri dönüş, ayarlar, oturumda puan');
  await H(() => window.__hisar.showView('kamera'));
  check(await waitFor(page, () => !!window.__hisar.LZ.stream && /1920×1080/.test((document.getElementById('kmDurum') || {}).textContent || ''), 5000), 'Kamera ekranına dönünce (hedef tanıtılı) kamera kendiliğinden açıldı');
  await page.click('#kmAyar'); await sleep(400);
  const sy = await H(() => ({ t: document.getElementById('pgTitle').textContent, cv: !!document.getElementById('lzCv') }));
  check(/Lazer/.test(sy.t) && sy.cv, 'Lazer ayarları sayfası açıldı (aynı kamera ayarlarıyla)', sy);
  await page.click('#pgBack'); await sleep(500);
  check(await H(() => window.__hisar.curView === 'kamera' && !document.getElementById('v-kamera').hidden && !!document.getElementById('kmCv')), 'Geri tuşu Kamera ekranına döndü');
  await page.click('#kmBasla'); await sleep(300);
  check(await H(() => window.__hisar.curView === 'alistirma'), '"Alıştırmaya geç" Eğitim Oturumları\'nı açtı');
  await H(() => { const h = window.__hisar; h.openDrill('serbest'); h.startRun(); });
  check(await waitFor(page, () => !!window.__hisar.LZ.stream && window.__hisar.LZ.kare.length > 20, 4000), 'Oturum başlayınca kamera açıldı');
  await sleep(600);
  await atis({ nokta: [Z[0], Z[1]] }); await sleep(1700);
  const q = await H(() => { const s = window.__hisar.cur.sess, q = s.shots[s.shots.length - 1]; return q && q.lz ? { gor: q.lz.gor, halka: q.lz.halka } : null; });
  check(q && q.gor && q.halka === 10, 'Oturumdaki atış kamerayla puanlandı: merkez, 10', q);
  await H(() => window.__hisar.stopRun(false)); await sleep(800);

  section('Kapatma ve izin reddi');
  await H(() => window.__hisar.showView('kamera')); await sleep(400);
  await page.click('#kmKapa'); await sleep(400);
  d = await durum();
  check(!d.on && d.rozet === 'Kapalı' && await H(() => !!document.getElementById('kmAc') && !document.getElementById('kmCv')), 'Puanlama kapatıldı: önizleme ve adımlar gizlendi', d);
  await H(() => { window.__hisar.LZ.stream && window.__hisar.LZ.stream.getTracks().forEach(t => t.stop()); window.__cam.denied = true; });
  await H(() => window.__hisar.showView('merkez')); await sleep(300); await H(() => window.__hisar.showView('kamera')); await sleep(300);
  await page.click('#kmAc'); await sleep(900);
  const red = await H(() => ({ t: document.getElementById('toast').textContent, not: (document.getElementById('kmDurum') || {}).textContent }));
  check(/izin/i.test(red.t) && /izin/i.test(red.not), 'Kamera izni verilmezse ne yapılacağı söyleniyor', red);
  check(errs.length === 0, 'Sayfa hatası yok', errs);

  await browser.close(); srv.close();
  process.exit(finish('Kamera ekranı testi') ? 1 : 0);
})();
