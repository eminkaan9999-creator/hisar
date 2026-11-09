// Lazer hedef testi (sahte sensör + sahte kamera): hedefi üç dokunuşla tanıtma, lazeri sıfırlama, atışın kağıttaki gerçek
// yeri (halka puanı, hedef dışı, lazer görülmedi), sensör izi ile birleştirme, telefon kıpırdayınca hedefi izleme, kamera izni.
'use strict';
const { serve, check, section, finish, openApp, chromium, fs, path, sleep } = require('./ortak');
const PORT = 8829;
const FAKE = fs.readFileSync(path.join(__dirname, 'sahte_sensor.js'), 'utf8');
const CAM = fs.readFileSync(path.join(__dirname, 'sahte_kamera.js'), 'utf8');
async function waitFor(page, fn, ms, arg) { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await page.evaluate(fn, arg)) return true; await sleep(100); } return false; }
const cm = d => Math.tan(d * Math.PI / 180) * 2500;          // derece → cm (25 m)

(async () => {
  const srv = await serve(PORT); const browser = await chromium.launch();
  const { page, errs, ctx } = await openApp(browser, { port: PORT, init: [FAKE, CAM] });
  const H = (fn, a) => page.evaluate(fn, a);
  await H(() => { const h = window.__hisar; h.S.mic = 'kapali'; h.S.sensorShotBeep = false; h.S.mode = 'kuru'; h.S.dist = 25; h.S.sound = 'kapali'; h.applyCfg(); h.selectSource('sensor', true); });
  check(await waitFor(page, () => window.__hisar.ble.st === 'bagli', 9000), 'Sensör bağlandı');
  // atış: 400 ms sonra tetik düşer; nokta [x,y] hedef merkezine göre piksel (tetiğe basılı kaldıkça: 500 ms önce – 300 ms sonra)
  // yol: [başlangıç, bitiş] — nokta tetik düşmeden önceki 150 ms'de başlangıçtan bitişe kayar (sensördeki tetik hareketiyle aynı)
  const atis = o => H(o => { const F = window.__fake, C = window.__cam, seq = F.head + 80, tb = F.t0 + seq * 5;
    if (o.nokta || o.yol) { const d = { t0: tb - 500, t1: tb + 300, x: o.nokta && o.nokta[0], y: o.nokta && o.nokta[1], zayif: !!o.zayif };
      if (o.yol) d.at = t => { const u = Math.max(0, Math.min(1, (t - tb + 150) / 150)); return [0, 1].map(i => o.yol[0][i] + u * (o.yol[1][i] - o.yol[0][i])); };
      C.dots.push(d); }
    F.addShot(seq, { dx: o.dx || 0, dy: o.dy || 0, click: null }); return tb; }, o);

  section('Lazer hedef sayfası ve kamera');
  await H(() => window.__hisar.openSetPage('lazer')); await sleep(400);
  check(await H(() => !!document.getElementById('lzCv') && /Kamera kapalı/.test(document.getElementById('lzDurum').textContent) && window.__cam.opened === 0),
    'Sayfa açıldı; kamera izin istenmeden kendiliğinden açılmadı');
  await page.click('#lzKam');
  check(await waitFor(page, () => /1920×1080/.test((document.getElementById('lzDurum') || {}).textContent || ''), 5000), 'Kamera açıldı: 1920×1080 görüntü işleniyor',
    await H(() => (document.getElementById('lzDurum') || {}).textContent));
  await sleep(1300);
  const k0 = await H(() => ({ fps: window.__hisar.LZ.fps, c: window.__cam.lastC, sec: [...document.querySelectorAll('#lzCam option')].map(o => o.textContent) }));
  check(k0.fps > 15 && k0.c.video.width.ideal === 1920 && k0.c.video.facingMode.ideal === 'environment' && !k0.c.audio, `Arka kamera, saniyede ${Math.round(k0.fps)} kare; ses alınmıyor`, k0);
  check(k0.sec.includes('Arka Telefoto Kamera'), 'Kamera listesinde telefoto seçilebiliyor', k0.sec);

  section('Hedefi tanıtma: üç dokunuş ve yakınlaştırma');
  await page.click('#lzTan'); await sleep(300);
  await H(() => document.getElementById('lzCv').scrollIntoView({ block: 'center' })); await sleep(200);
  const tap = async (fx, fy) => {                          // kamera pikselinde (fx,fy) noktasına önizlemede dokun
    const r = await H(([fx, fy]) => { const L = window.__hisar.LZ, g = L.gor, b = document.getElementById('lzCv').getBoundingClientRect();
      return { x: b.left + (fx / L.W - g.x) / g.w * b.width, y: b.top + (fy / L.W - g.y) / g.h * b.height }; }, [fx, fy]);
    await page.mouse.click(r.x, r.y); await sleep(300); };
  await tap(975, 530);
  const a1 = await H(() => ({ adim: window.__hisar.LZ.adim, zm: window.__hisar.LZ.zm }));
  check(a1.adim === 'merkez' && a1.zm === 8, 'Hedefe dokununca görüntü 8× yakınlaştı; sıra merkezde', a1);
  await tap(960, 540);
  check(await H(() => window.__hisar.LZ.adim === 'kenar' && /DIŞ KENARINA/.test(document.getElementById('lzTanN').textContent)), 'Merkez alındı; sıra dış kenarda');
  await page.click('#lzZmE'); await sleep(300);
  check(await H(() => window.__hisar.LZ.zm === 4), '"Uzaklaştır" ile 4×');
  await tap(960 + 120, 540);
  const cal = await H(() => { const h = window.__hisar, L = h.S.lazer; return { c: L.c.map(v => v * 1920), k: h.lzK() * 1920, adim: h.LZ.adim, hazir: h.lzHazir() }; });
  check(cal.hazir && !cal.adim && Math.hypot(cal.c[0] - 960, cal.c[1] - 540) < 1.5 && Math.abs(cal.k - 4.8) < 0.12,
    `Hedef tanıtıldı: merkez ${cal.c.map(v => v.toFixed(1)).join(', ')} piksel (960, 540), ölçek ${cal.k.toFixed(2)} piksel/cm (4,80)`, cal);
  await sleep(600);
  check(await H(() => { const h = window.__hisar; return !!h.S.lazer.ref && !!h.LZ.ref && !h.LZ.ref.duz; }), 'Hedefin görüntüsü izleme için alındı');

  section('Lazeri sıfırlama: nişangah merkezde, tetik 3 kez');
  const PX = 4.8, Z = [3 * PX, -2 * PX];                    // lazer nişangahın 3 cm sağına, 2 cm üstüne bakıyor
  await page.click('#lzSif'); await sleep(300);
  check(await H(() => !!window.__hisar.LZ.sifir && /0\/3/.test(document.getElementById('lzSif').textContent)), 'Sıfırlama başladı (0/3)');
  for (const [nx, ny] of [[0.8, -0.5], [-0.6, 0.7], [0.2, -0.4]]) { await atis({ nokta: [Z[0] + nx, Z[1] + ny] }); await sleep(1500); }
  const z = await H(() => ({ z: window.__hisar.S.lazer.z, zD: window.__hisar.S.lazer.zD, sur: !!window.__hisar.LZ.sifir, armed: window.__hisar.proc.armed }));
  check(z.z && Math.abs(z.z[0] - 3) < 0.3 && Math.abs(z.z[1] - 2) < 0.3 && z.zD === 25 && !z.sur && !z.armed,
    `Lazer sıfırlandı: nokta nişangahın ${z.z} cm sağ/üst (gerçek 3, 2), 25 m; algılama kapandı`, z);

  section('Lazer kapalıyken atış eskisi gibi');
  await H(() => { const h = window.__hisar; while (h.pages.length) h.popPage(); }); await sleep(400);
  check(await H(() => !window.__hisar.LZ.stream), 'Lazer sayfasından çıkınca kamera kapandı');
  await H(() => { const h = window.__hisar; h.S.lazer.on = false; h.openDrill('serbest'); h.startRun(); }); await sleep(1500);
  await atis({ dx: 0.2, dy: 0.1 }); await sleep(1600);
  const yon = await H(() => { const h = window.__hisar, s = h.cur.sess, q = s.shots[s.shots.length - 1], v = q && h.hdShot(q);
    return { n: s.shots.length, lz: q && q.lz, lzR: s.lzR, x: v && v.p[0] - v.iz[0][0], y: v && v.p[1] - v.iz[0][1], kam: !!h.LZ.stream }; });
  check(yon.n === 1 && !yon.lz && !yon.lzR && !yon.kam && Math.abs(Math.abs(yon.x) - 0.2) < 0.05 && Math.abs(Math.abs(yon.y) - 0.1) < 0.05,
    'Lazer kapalı: kamera açılmadı, atış yalnız sensörle ölçüldü', yon);
  const sx = Math.sign(yon.x), sy = Math.sign(yon.y);
  await H(() => window.__hisar.stopRun(false)); await sleep(1300);

  section('Lazer hedef oturumu: atışın kağıttaki gerçek yeri');
  await H(() => { const h = window.__hisar; h.S.lazer.on = true; h.openDrill('serbest'); h.startRun(); });
  check(await waitFor(page, () => !!window.__hisar.LZ.stream && window.__hisar.LZ.kare.length > 20, 4000), 'Oturum başlayınca kamera kendiliğinden açıldı');
  const lzR = await H(() => window.__hisar.cur.sess.lzR);
  check(Math.abs(lzR - Math.atan(2.5 / 2500) * 180 / Math.PI) < 1e-9, 'Halka genişliği gerçek hedeften: 50 cm hedefte 2,5 cm (25 m)', lzR);
  await sleep(800);
  const vurus = async (nokta, o) => {                     // nokta: nişangahın gittiği yer (cm, sağ/yukarı); lazer sıfır farkıyla görünür
    await atis(Object.assign({ nokta: nokta && [Z[0] + nokta[0] * PX, Z[1] - nokta[1] * PX] }, o || {})); await sleep(1600);
    return H(() => { const h = window.__hisar, s = h.cur.sess, q = s.shots[s.shots.length - 1];
      return { n: s.shots.length, lz: q && q.lz, metin: q ? h.hedefMetin(s, s.shots, q, h.cur.run, false, false).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ') : '' }; }); };
  const yer = r => r.lz && r.lz.p ? r.lz.p.map(cm).map(v => +v.toFixed(2)) : null;
  let r = await vurus([0, 0]);
  check(r.n === 1 && r.lz.gor && r.lz.halka === 10 && Math.hypot(...yer(r)) < 0.4 && /İSABET: 10/.test(r.metin) && /Tetik puanı/.test(r.metin),
    `Merkeze: 10 (yer ${yer(r)} cm)`, { lz: r.lz, metin: r.metin.slice(0, 160) });
  r = await vurus([6.5, 0]);
  check(r.lz && r.lz.gor && r.lz.halka === 8 && Math.abs(yer(r)[0] - 6.5) < 0.4 && Math.abs(yer(r)[1]) < 0.4 && /İSABET: 8/.test(r.metin),
    `6,5 cm sağa: 8 (yer ${yer(r)} cm)`, r.lz);
  r = await vurus([0, -14]);
  check(r.lz && r.lz.gor && r.lz.halka === 5 && Math.abs(yer(r)[1] + 14) < 0.4, `14 cm aşağı: 5 (yer ${yer(r)} cm)`, r.lz);
  r = await vurus([-60, 0]);
  check(r.lz && r.lz.gor && r.lz.halka === 0 && Math.abs(yer(r)[0] + 60) < 1.5 && /HEDEF DIŞI/.test(r.metin), `60 cm sola (kağıdın dışı): HEDEF DIŞI (yer ${yer(r)} cm)`, { lz: r.lz, metin: r.metin.slice(0, 120) });
  r = await vurus(null);
  check(r.n === 5 && r.lz && r.lz.gor === false && r.lz.kam === true && /LAZER GÖRÜLMEDİ/.test(r.metin), 'Nokta kamerada yok: LAZER GÖRÜLMEDİ (atış yine sayıldı, tetik puanıyla)', { lz: r.lz, metin: r.metin.slice(0, 160) });
  // tetik düşerken silah 0,1° sağa kayıyor: sensör de lazer de aynı hareketi görür; sonuç tetiğin düştüğü andaki yer
  const s01 = cm(0.1) * PX;
  r = await vurus(null, { dx: 0.1, yol: [[Z[0], Z[1]], [Z[0] + sx * s01, Z[1]]] });
  check(r.lz && r.lz.gor && r.lz.o && r.lz.halka === 9 && Math.abs(yer(r)[0] - sx * cm(0.1)) < 0.4 && Math.abs(yer(r)[1]) < 0.4,
    `Tetik koparma (0,1° = 4,4 cm): sensör izi lazere oturtuldu, 9 (yer ${yer(r)} cm)`, r.lz);

  section('Telefon tripodda kıpırdadı: hedef izleniyor');
  await H(() => { window.__cam.kayX = 14; window.__cam.kayY = -9; }); await sleep(1600);
  const kay = await H(() => ({ kay: window.__hisar.LZ.kay.map(v => +(v * 1920).toFixed(2)), iz: window.__hisar.LZ.iz, rho: +window.__hisar.LZ.rho.toFixed(3) }));
  check(kay.iz === 'iz' && Math.abs(kay.kay[0] - 14) < 0.8 && Math.abs(kay.kay[1] + 9) < 0.8, `Kayma ölçüldü: ${kay.kay} piksel (14, −9), ilinti ${kay.rho}`, kay);
  r = await vurus([0, 0]);
  check(r.lz && r.lz.gor && r.lz.halka === 10 && Math.hypot(...yer(r)) < 0.5, `Kaymadan sonra merkeze: 10 (yer ${yer(r)} cm)`, r.lz);
  r = await vurus([2.6, 2.6]);
  check(r.lz && r.lz.gor && r.lz.halka === 9 && Math.abs(yer(r)[0] - 2.6) < 0.5 && Math.abs(yer(r)[1] - 2.6) < 0.5, `Kaymadan sonra sağ üste 3,7 cm: 9 (yer ${yer(r)} cm)`, r.lz);
  const oz = await H(() => { const h = window.__hisar, s = h.cur.sess; return h.hedefMetin(s, s.shots, s.shots[s.shots.length - 1], null, true, false).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '); });
  check(/Lazer 7\/8 atışta görüldü: toplam 51 puan/.test(oz), 'Oturum özeti: lazer 7/8 atışta görüldü, toplam 51 puan', oz.slice(0, 260));

  section('Gürültülü görüntü, güneşte soluk nokta');
  await H(() => { window.__cam.gurultu = 3; }); await sleep(2500);
  const yanlis = await H(() => { const K = window.__hisar.LZ.kare, t = K.length ? K[K.length - 1].t : 0; return { n: K.filter(f => f.t > t - 2000).length, nokta: K.filter(f => f.d && f.t > t - 2000).length }; });
  check(yanlis.n > 40 && yanlis.nokta === 0, `Kamera gürültüsünde (kanal başına σ=3) ${yanlis.n} karede yanlış nokta yok`, yanlis);
  r = await vurus([3, -2], { zayif: true });
  check(r.lz && r.lz.gor && r.lz.halka === 9 && Math.abs(yer(r)[0] - 3) < 0.6 && Math.abs(yer(r)[1] + 2) < 0.6, `Gürültüde soluk nokta (yeşil %20) bulundu: 9 (yer ${yer(r)} cm)`, r.lz);
  await H(() => { window.__cam.gurultu = 0; });
  await H(() => window.__hisar.stopRun(false)); await sleep(1300);
  check(await H(() => !!window.__hisar.LZ.stream), 'Oturum bitince kamera hemen kapanmıyor (sıradaki oturum için 2 dk açık)');

  section('Kamera izni');
  const izin = await H(async () => { const h = window.__hisar; h.lzKapat(); window.__cam.denied = true; const ok = await h.lzAc(); const o = { ok, hata: h.LZ.hata }; window.__cam.denied = false; return o; });
  check(izin.ok === false && /izin verilmedi/.test(izin.hata), 'İzin verilmezse açık bir uyarı', izin);
  const iki = await H(async () => { const h = window.__hisar, n0 = window.__cam.opened; const [a, b] = await Promise.all([h.lzAc(), h.lzAc()]); return { a, b, acilan: window.__cam.opened - n0 }; });
  check(iki.a && iki.b && iki.acilan === 1, 'Aynı anda iki açma isteği tek kamera açar', iki);
  await H(() => window.__hisar.lzKapat());
  check(errs.length === 0, 'Sayfa hatası yok', errs.slice(0, 5));

  await ctx.close(); await browser.close(); srv.close();
  process.exit(finish('Lazer hedef testi') ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
