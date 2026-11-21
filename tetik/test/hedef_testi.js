// Şekilli hedef ve lazer eğitim fişeği testi (sahte sensör + sahte kamera; kamerada insan silüeti):
// Kamera ekranında hedef türünü "silüet" seçip görüntüde kenar boyunca noktalara dokunarak çerçeveleme, son noktayı silme,
// iç bölge (göğüs) çizme, hedefin dışına iç bölge noktası koyamama; boyla ölçek; lazer türü "eğitim fişeği" (sıfırlama gerekmez,
// nokta tetik düşünce bir an yanar); oturumda isabet / iç bölge / karavana / görülmedi; hedef görünümünde silüet; oturum özeti;
// türü değiştirince eski tanıtmanın silinmesi; Lazer ayarları sayfasında fişek. Gerçek kamera ve lazer donanım testi değildir.
'use strict';
const { serve, check, section, finish, openApp, chromium, fs, path, sleep } = require('./ortak');
const PORT = 8831;
const FAKE = fs.readFileSync(path.join(__dirname, 'sahte_sensor.js'), 'utf8');
const CAM = fs.readFileSync(path.join(__dirname, 'sahte_kamera.js'), 'utf8');
async function waitFor(page, fn, ms, arg) { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await page.evaluate(fn, arg)) return true; await sleep(100); } return false; }
// silüetin kenarı (kamera pikseli, hedef merkezine göre): baş üstü, baş yanları, boyun, omuzlar, alt köşeler
const KENAR = [[0, -130], [30, -100], [25, -70], [80, -45], [90, 130], [-90, 130], [-80, -45], [-25, -70], [-30, -100]];
const GOGUS = [[-40, -50], [40, -50], [40, 30], [-40, 30]];

(async () => {
  const srv = await serve(PORT); const browser = await chromium.launch();
  const { page, errs } = await openApp(browser, { port: PORT, init: [FAKE, CAM] });
  const H = (fn, a) => page.evaluate(fn, a);
  await H(() => { window.__cam.hedef = 'siluet'; const h = window.__hisar; h.S.mic = 'kapali'; h.S.sensorShotBeep = false; h.S.mode = 'kuru'; h.S.dist = 25; h.S.sound = 'kapali'; h.applyCfg(); h.selectSource('sensor', true); });
  check(await waitFor(page, () => window.__hisar.ble.st === 'bagli', 9000), 'Sensör bağlandı');
  const tap = async (fx, fy) => { await H(() => { const c = document.getElementById('kmCv'), b = c.getBoundingClientRect(); if (b.top < 0 || b.bottom > innerHeight) c.scrollIntoView({ block: 'center' }); }); await sleep(60);
    const r = await H(([fx, fy]) => { const L = window.__hisar.LZ, g = L.gor, b = document.getElementById('kmCv').getBoundingClientRect();
    return { x: b.left + (fx / L.W - g.x) / g.w * b.width, y: b.top + (fy / L.W - g.y) / g.h * b.height }; }, [fx, fy]); await page.mouse.click(r.x, r.y); await sleep(300); };
  const merkezeGore = ([x, y]) => [960 + x, 540 + y];

  section('Hedef türü: silüet ya da başka şekil');
  await H(() => window.__hisar.showView('kamera')); await sleep(200);
  await page.click('#kmAc');
  check(await waitFor(page, () => /1920×1080/.test((document.getElementById('kmDurum') || {}).textContent || ''), 5000), 'Kamera açıldı');
  await page.selectOption('#kmTip', 'sekil'); await sleep(300);
  const t0 = await H(() => ({ tip: window.__hisar.S.lazer.tip, lbl: document.querySelector('label.km-cap').textContent, D: window.__hisar.S.lazer.D }));
  check(t0.tip === 'sekil' && /Boyu/.test(t0.lbl) && t0.D === 75, 'Tür "silüet" seçildi; ölçü alanı "Boyu (cm)", varsayılan 75', t0);
  await page.fill('#kmD', '100'); await page.dispatchEvent('#kmD', 'change'); await sleep(150);
  check(await H(() => window.__hisar.S.lazer.D === 100 && window.__hisar.S.lazer.Hs === 100), 'Boy 100 cm');

  section('Görüntüde kenar boyunca noktalarla çerçeveleme');
  await page.click('#kmTan'); await sleep(250);
  await H(() => document.getElementById('kmCv').scrollIntoView({ block: 'center' })); await sleep(200);
  await tap(960, 540);
  check(await H(() => window.__hisar.LZ.adim === 'sekil' && window.__hisar.LZ.zm === 2 && !!document.getElementById('kmBitir')), 'Hedefe dokununca 2× yakınlaştı; "Çerçeveyi bitir" çıktı');
  for (const k of KENAR) await tap(...merkezeGore(k));
  check(await H(() => window.__hisar.LZ.tan.pts.length === 9 && /\(9 nokta\)/.test(document.getElementById('kmDurum').textContent)), '9 nokta kondu, önizlemenin altındaki durum satırı sayıyı gösteriyor');
  await page.click('#kmGeri'); await sleep(250);
  check(await H(() => window.__hisar.LZ.tan.pts.length === 8), '"Son noktayı sil": 8 nokta');
  await tap(...merkezeGore(KENAR[8]));
  check(await H(() => window.__hisar.LZ.tan.pts.length === 9), 'Yeniden 9 nokta');
  const ara = await H(() => { const b = document.getElementById('kmBitir').getBoundingClientRect(), c = document.getElementById('kmCv').getBoundingClientRect(); return Math.round(b.bottom - c.top); });
  check(ara < 520, `Şekil düğmeleri önizlemenin hemen altında: önizleme ile düğmeler birlikte ekrana sığıyor (${ara} px)`, ara);
  await page.click('#kmBitir'); await sleep(250);
  check(await H(() => window.__hisar.LZ.adim === 'ic' && !!document.getElementById('kmAtla') && /iç bölge/i.test(document.getElementById('kmDurum').textContent)), 'Çerçeve kapandı; sıra isteğe bağlı iç bölgede ("Atla" var)');
  await tap(960 + 150, 540);
  check(await H(() => window.__hisar.LZ.tan.ic.length === 0 && /içinde olmalı/.test(document.getElementById('toast').textContent)), 'Hedefin dışına iç bölge noktası konmuyor');
  for (const k of GOGUS) await tap(...merkezeGore(k));
  await page.click('#kmBitir'); await sleep(400);
  const c = await H(() => { const h = window.__hisar, L = h.S.lazer, xs = L.pcm.map(p => p[0]), ys = L.pcm.map(p => p[1]);
    return { hz: h.lzHazir(), tip: L.tip, n: L.poly.length, ic: L.ic && L.ic.length, boy: +(Math.max(...ys) - Math.min(...ys)).toFixed(1), en: +(Math.max(...xs) - Math.min(...xs)).toFixed(1),
      adim: h.LZ.adim, not: document.getElementById('kmTanN').textContent, tamam: document.querySelectorAll('#v-kamera .km-adim')[1].classList.contains('tamam') }; });
  check(c.hz && c.tip === 'sekil' && c.n === 9 && c.ic === 4 && !c.adim && c.tamam, 'Hedef çerçevelendi: 9 nokta, iç bölge 4 nokta; 2. adım tamam', c);
  check(Math.abs(c.boy - 100) < 0.5 && Math.abs(c.en - 180 / 2.6) < 1.5, `Ölçek boydan: boy ${c.boy} cm (100), en ${c.en} cm (${(180 / 2.6).toFixed(1)})`, c);
  check(/9 nokta, iç bölge, boy 100 cm/.test(c.not), 'Not çerçeveyi anlatıyor', c.not);
  await sleep(700);
  check(await H(() => !!window.__hisar.S.lazer.ref && !!window.__hisar.LZ.ref), 'Hedefin görüntüsü izleme için alındı');

  section('Lazer eğitim fişeği: sıfırlama gerekmez');
  await page.selectOption('#kmKyn', 'fisek'); await sleep(300);
  const f = await H(() => ({ k: window.__hisar.S.lazer.kaynak, renk: window.__hisar.S.lazer.renk, rozet: document.querySelector('#v-kamera .k-rozet').textContent,
    s4: document.querySelectorAll('#v-kamera .km-adim')[3].textContent, tamam4: document.querySelectorAll('#v-kamera .km-adim')[3].classList.contains('tamam'), sif: !!document.getElementById('kmSif') }));
  check(f.k === 'fisek' && f.renk === 'kirmizi', 'Lazer türü fişek; nokta rengi kırmızı', f);
  check(f.tamam4 && /gerekmez/.test(f.s4) && !f.sif && f.rozet === 'Hazır', 'Sıfırlama adımı "gerekmez" ve tamam; rozet "Hazır" (sıfırlamadan)', f);
  const lzn = await H(() => ({ t: document.getElementById('kmLzN').textContent, g: window.__hisar.LZ.goruldu }));
  check(/fişeği/.test(lzn.t), 'Lazer adımı fişeği anlatıyor', lzn);

  section('Oturum: isabet, iç bölge, karavana');
  await H(() => { const h = window.__hisar; h.openDrill('serbest'); h.startRun(); });
  check(await waitFor(page, () => !!window.__hisar.LZ.stream && window.__hisar.LZ.kare.length > 20, 4000), 'Oturum başlayınca kamera açıldı');
  const s0 = await H(() => { const s = window.__hisar.cur.sess; return { tip: s.lzTip, kyn: s.lzKyn, poly: s.lzPoly && s.lzPoly.length, ic: s.lzIc && s.lzIc.length }; });
  check(s0.tip === 'sekil' && s0.kyn === 'fisek' && s0.poly === 9 && s0.ic === 4, 'Oturuma hedefin şekli ve fişek yazıldı', s0);
  await sleep(600);
  // fişek: nokta tetik düştüğü anda yanar, ~0,1 sn
  const vurus = async nokta => {
    await H(o => { const F = window.__fake, C = window.__cam, seq = F.head + 80, tb = F.t0 + seq * 5;
      if (o) C.dots.push({ t0: tb, t1: tb + 100, x: o[0], y: o[1], renk: 'kirmizi' }); F.addShot(seq, { dx: 0, dy: 0, click: null }); }, nokta);
    await sleep(1600);
    return H(() => { const h = window.__hisar, s = h.cur.sess, q = s.shots[s.shots.length - 1];
      return { n: s.shots.length, lz: q && q.lz, metin: q ? h.hedefMetin(s, s.shots, q, h.cur.run, false, false).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ') : '' }; }); };
  let r = await vurus([0, 0]);
  check(r.n === 1 && r.lz.gor && r.lz.isabet && r.lz.ic && /İSABET · İÇ BÖLGE/.test(r.metin), 'Göğüse: İSABET · İÇ BÖLGE', { lz: r.lz, metin: r.metin.slice(0, 120) });
  r = await vurus([60, 70]);
  check(r.lz && r.lz.gor && r.lz.isabet && !r.lz.ic && /İSABET/.test(r.metin) && !/İÇ BÖLGE/.test(r.metin), 'Gövdenin alt yanına: İSABET (iç bölge değil)', r.lz);
  r = await vurus([0, -100]);
  check(r.lz && r.lz.gor && r.lz.isabet && !r.lz.ic, 'Başa: İSABET', r.lz);
  r = await vurus([150, 0]);
  check(r.lz && r.lz.gor && r.lz.isabet === false && /KARAVANA/.test(r.metin) && /dışına/.test(r.metin), 'Silüetin sağına: KARAVANA', { lz: r.lz, metin: r.metin.slice(0, 120) });
  r = await vurus(null);
  check(r.n === 5 && r.lz && r.lz.gor === false && /LAZER GÖRÜLMEDİ/.test(r.metin), 'Nokta yok: LAZER GÖRÜLMEDİ', r.lz);
  const koyu = await H(() => { const c = document.getElementById('ring'); if (!c || !c.offsetParent) return -1; const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0;
    for (let i = 0; i < d.length; i += 4) if (Math.abs(d[i] - 58) < 7 && Math.abs(d[i + 1] - 58) < 7 && Math.abs(d[i + 2] - 58) < 7) n++; return n; });
  check(koyu > 1500, `Hedef görünümünde halkalar yerine silüet çiziliyor (${koyu} koyu piksel)`, koyu);
  const oz = await H(() => { const h = window.__hisar, s = h.cur.sess; return h.hedefMetin(s, s.shots, s.shots[s.shots.length - 1], null, true, false).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '); });
  check(/Lazer 4\/5 atışta görüldü: 3 isabet \(1'i iç bölgede\), 1 karavana/.test(oz), 'Oturum özeti: 4/5 görüldü, 3 isabet (1 iç bölgede), 1 karavana', oz.slice(0, 260));
  await H(() => window.__hisar.stopRun(false)); await sleep(800);

  section('Tür değişince eski tanıtma silinir; Lazer ayarlarında fişek');
  await H(() => window.__hisar.showView('kamera')); await sleep(400);
  await page.selectOption('#kmTip', 'halka'); await sleep(300);
  const h0 = await H(() => { const h = window.__hisar, L = h.S.lazer; return { hz: h.lzHazir(), tip: L.tip, D: L.D, poly: L.poly, lbl: document.querySelector('label.km-cap').textContent }; });
  check(!h0.hz && h0.tip === 'halka' && h0.D === 50 && !h0.poly && /Çap/.test(h0.lbl), 'Halkalı hedefe dönünce şekil silindi, çap 50 cm', h0);
  await page.selectOption('#kmTip', 'sekil'); await sleep(300);
  check(await H(() => window.__hisar.S.lazer.D === 100), 'Silüete yeniden geçince boy (100 cm) hatırlanıyor');
  await H(() => window.__hisar.openSetPage('lazer')); await sleep(400);
  const lp = await H(() => ({ opt: Array.from(document.querySelectorAll('#lzKyn option')).map(o => o.value), sec: document.getElementById('lzKyn').value, txt: document.getElementById('pgBody').innerText }));
  check(JSON.stringify(lp.opt) === '["sensor","silah","fisek"]' && lp.sec === 'fisek' && /namlu ekseninden çıkar/.test(lp.txt) && /sıfırlama gerekmez/.test(lp.txt), 'Lazer ayarları: fişek seçeneği ve açıklaması', lp.opt);
  check(await H(() => document.getElementById('lzTip').value === 'sekil' && /Hedefin boyu/.test(document.getElementById('pgBody').innerText)), 'Lazer ayarlarında da hedef türü ve boy');
  check(errs.length === 0, 'Sayfa hatası yok', errs);

  await browser.close(); srv.close();
  process.exit(finish('Şekilli hedef ve fişek testi') ? 1 : 0);
})();
