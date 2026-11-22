// Hata teşhisi testi: 21 hatanın hepsi, sağ/sol el, tabanca/tüfek, saat yönleri, özel hatalar.
// Beklenen değerler NRA / 4-H sağ el tabanca hata şemasından (MantisX de aynı şemayı kullanır). İz yoksa (eski kayıt) bu şema.
// T8 (sürüm 36): izden zamanlama (son anda ani / baskı boyunca / önceden), dikey kayma, nişan süresi, lazerle nişan noktası,
// oturum gözlemleri, ölçüm satırı ve kayıtlı oturumların yeni teşhisle yeniden değerlendirilmesi.
'use strict';
const { serve, check, section, finish, openApp, chromium } = require('./ortak');
const PORT = 8781;

const TABANCA_SAG = {
  12: ['Bileği yukarı kaldırma', 'Tepmeyi bekleyip irkilme'],
  1: ['Avuçla öne itme', 'Tepmeyi bekleyip irkilme'],
  2: ['Avuçla öne itme', 'Başparmakla yana itme'],
  3: ['Başparmakla yana itme', 'Tetiğe parmak ucuyla basma'],
  4: ['Tetik çekerken eli sıkma', 'Tetiğe parmak ucuyla basma'],
  5: ['Tetik çekerken eli sıkma', 'Bileği aşağı düşürme'],
  6: ['Bileği aşağı düşürme', 'Silahı öne itme'],
  7: ['Tetiğe ani basma', 'Bileği aşağı düşürme'],
  8: ['Tetiğe ani basma', 'Bütün parmakları kapatma'],
  9: ['Parmağı tetiğe çok sokma', 'Tetiğe ani basma'],
  10: ['Tepmeyi bekleyip irkilme', 'Parmağı tetiğe çok sokma'],
  11: ['Tepmeyi bekleyip irkilme', 'Bileği yukarı kaldırma'],
};
// Tüfek (omuzdan atış) için tabanca şemasından uyarlanmış şema
const TUFEK_SAG = {
  12: ['Tepmeyi bekleyip irkilme', 'Başı erken kaldırma'],
  1: ['Tepmeyi bekleyip irkilme', 'Tetik çekerken eli sıkma'],
  2: ['Tetik çekerken eli sıkma', 'Tetiğe parmak ucuyla basma'],
  3: ['Tetiğe parmak ucuyla basma', 'Tetik çekerken eli sıkma'],
  4: ['Tetik çekerken eli sıkma', 'Tetiğe ani basma'],
  5: ['Tetiğe ani basma', 'Silahı öne itme'],
  6: ['Silahı öne itme', 'Tetiğe ani basma'],
  7: ['Tetiğe ani basma', 'Silahı öne itme'],
  8: ['Tetiğe ani basma', 'Parmağı tetiğe çok sokma'],
  9: ['Parmağı tetiğe çok sokma', 'Tetiğe ani basma'],
  10: ['Parmağı tetiğe çok sokma', 'Tepmeyi bekleyip irkilme'],
  11: ['Tepmeyi bekleyip irkilme', 'Başı erken kaldırma'],
};
const mirror = h => (12 - h) % 12 || 12;

(async () => {
  const srv = await serve(PORT); const browser = await chromium.launch();
  const { page, errs } = await openApp(browser, { port: PORT });
  const R = await page.evaluate(({ TABANCA_SAG, TUFEK_SAG }) => {
    const H = window.__hisar; const ad = id => (H.CAUSES[id] || {}).ad || id;
    const sess = (o) => Object.assign({ weapon: 'pistol', diff: 'normal', hand: 'R', handMode: 'normal', drill: 'serbest', mode: 'kuru' }, o);
    const shot = (o) => Object.assign({ sc: 60, h: 12, ca: 0, ho: 0.01, tr: 0.2, po: 0 }, o);
    const out = { clock: [], seen: new Set(), misc: {} };
    for (const weapon of ['pistol', 'rifle']) for (const hand of ['R', 'L']) for (let h = 1; h <= 12; h++) {
      const spec = (weapon === 'pistol' ? TABANCA_SAG : TUFEK_SAG)[hand === 'L' ? ((12 - h) % 12 || 12) : h];
      const got = H.diagnose(shot({ h, sc: 60 }), sess({ weapon, hand })).map(ad);
      const got78 = H.diagnose(shot({ h, sc: 78 }), sess({ weapon, hand })).map(ad);
      const got90 = H.diagnose(shot({ h, sc: 90 }), sess({ weapon, hand })).map(ad);
      H.diagnose(shot({ h, sc: 60 }), sess({ weapon, hand })).forEach(x => out.seen.add(x));
      out.clock.push({ weapon, hand, h, spec, got, got78, got90 });
    }
    // destek eli alıştırması: sağ elli atıcı, destek (sol) eliyle → sol el şeması
    out.misc.weak = H.diagnose(shot({ h: 3, sc: 60 }), sess({ hand: 'R', handMode: 'weak' })).map(ad);
    const k = (o, so) => H.diagnose(shot(o), sess(so || {}));
    out.misc.kant26 = k({ sc: 90, ca: 2.6 }); out.misc.kantNeg = k({ sc: 90, ca: -3 }); out.misc.kant24 = k({ sc: 90, ca: 2.4 });
    out.misc.gez = k({ sc: 80, ho: 0.2, tr: 0.05 }); out.misc.gezSpeed = k({ sc: 80, ho: 0.2, tr: 0.05 }, { drill: 'zamanlayici' });
    out.misc.gezRifle = k({ sc: 80, ho: 0.12, tr: 0.05 }, { weapon: 'rifle' }); out.misc.gezSmall = k({ sc: 80, ho: 0.12, tr: 0.05 });
    out.misc.gezIyi = k({ sc: 90, ho: 0.2, tr: 0.05 });                            // T4: iyi atışta gezinme söylenmez
    // T4: tetik penceresinde namlu çevresinde dönme (dr, °) ve tutuştaki dönme titremesi (rv, °)
    out.misc.donSag = k({ sc: 90, dr: 2, rv: 0.3 }); out.misc.donSol = k({ sc: 90, dr: -2, rv: 0.3 });
    out.misc.donKucuk = k({ sc: 90, dr: 0.8, rv: 0.1 }); out.misc.donTitr = k({ sc: 90, dr: 2, rv: 1.5 });
    out.misc.donSpeed = k({ sc: 90, dr: 2, rv: 0.3 }, { drill: 'zamanlayici' }); out.misc.donEski = k({ sc: 90 });
    out.misc.takip = k({ sc: 90, po: 0.5, tr: 0.1 }); out.misc.takipLive = k({ sc: 90, po: 0.5, tr: 0.1 }, { mode: 'gercek' }); out.misc.takipSmall = k({ sc: 90, po: 0.3, tr: 0.1 });
    out.misc.max3 = k({ sc: 40, h: 7, ca: 4, ho: 0.5, tr: 0.2, po: 1 });
    // tetik penceresindeki hareket titreme düzeyinde mi (wv: tutuşta 150 ms'lik tipik hareket)
    out.misc.titr = k({ sc: 60, h: 7, dx: -0.05, dy: -0.05, wv: 0.08 });          // 0,07° hareket, titreme 0,08° → tetik hatası değil
    out.misc.net = k({ sc: 60, h: 7, dx: -0.15, dy: -0.15, wv: 0.08 });           // 0,21° hareket, titreme 0,08° → tetik hatası
    out.misc.sinir = [k({ sc: 60, h: 7, dx: -0.1, dy: -0.1, wv: 0.0808 }), k({ sc: 60, h: 7, dx: -0.1, dy: -0.1, wv: 0.0809 })];   // eşik 1,75×
    out.misc.taban = k({ sc: 80, h: 7, dx: -0.015, dy: -0.015, wv: 0.001 });      // titreme yok ama hareket önemsiz (<0,1×ölçek)
    out.misc.titrSpeed = k({ sc: 60, h: 7, dx: -0.05, dy: -0.05, wv: 0.08 }, { drill: 'zamanlayici' });
    out.misc.eskiKayit = k({ sc: 60, h: 7, dx: -0.05, dy: -0.05 });               // eski kayıt: wv yok → saat yönü kullanılır
    // kanting: yön testi yapılmadıysa (s.yt false) bant yatıklığı yüzünden eşik 6°; 25°'den büyüğü montaj değişikliğidir
    out.misc.kantYt = [k({ sc: 90, ca: 4.6 }, { yt: false }), k({ sc: 90, ca: 6.5 }, { yt: false }), k({ sc: 90, ca: 3 }, { yt: true }), k({ sc: 90, ca: 180 }), k({ sc: 90, ca: -30 })];
    for (const v of Object.values(out.misc)) v.forEach(x => out.seen.add(x));
    // T4: oturum geneli tetik hatası (atışların ortalaması). Sabit tohumlu rastgele atışlar
    let seed = 777; const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    const gauss = () => { let u = 0; while (!u) u = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rnd()); };
    const atislar = (n, mx, my, sig) => Array.from({ length: n }, (_, i) => ({ n: i + 1, sc: 70, dx: mx + gauss() * sig, dy: my + gauss() * sig, x: {} }));
    const sisS = (n, mx, my, sig, so) => sess(Object.assign({ shots: atislar(n, mx, my, sig) }, so || {}));
    const y7 = [Math.sin(210 * Math.PI / 180) * 0.06, Math.cos(210 * Math.PI / 180) * 0.06];   // saat 7 yönünde 0,06°
    const ortak = atislar(10, y7[0], y7[1], 0.03);
    out.sis = { yedi: H.sistematik(sess({ shots: ortak })), sol: H.sistematik(sess({ shots: ortak, hand: 'L' })),
      az: H.sistematik(sisS(5, y7[0], y7[1], 0.01)), hizli: H.sistematik(sisS(10, y7[0], y7[1], 0.01, { drill: 'zamanlayici' })),
      kucuk: H.sistematik(sisS(12, -0.015, -0.015, 0.001)) };
    // titreme: her atışta eksen başına σ = 0,08°; sabit kayma: 10 atışta σ'nın 1,5 katı, 20 atışta σ kadar
    let yanlis = 0, b10 = 0, b20 = 0; for (let i = 0; i < 300; i++) { if (H.sistematik(sisS(10, 0, 0, 0.08))) yanlis++; if (H.sistematik(sisS(10, 0.12, 0, 0.08))) b10++; if (H.sistematik(sisS(20, 0.08, 0, 0.08))) b20++; }
    out.sis.yanlis = yanlis; out.sis.b10 = b10; out.sis.b20 = b20;
    out.seen = [...out.seen];
    out.allIds = Object.keys(H.CAUSES); out.adlar = Object.fromEntries(Object.entries(H.CAUSES).map(([k, c]) => [k, c.ad]));
    out.causeShape = Object.entries(H.CAUSES).map(([id, c]) => ({ id, ok: !!(c.ad && c.ozet && c.neden && Array.isArray(c.duzelt) && c.duzelt.length && H.DR.some(d => d.id === c.al)) }));
    out.verdict = [85, 84.9, 70, 69.9, 50, 49.9].map(v => H.verdict(v)[0]);
    out.hours = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(a => H.hourOf(Math.sin(a * Math.PI / 180), Math.cos(a * Math.PI / 180)));
    out.scale = [H.scaleFor('pistol', 'normal'), H.scaleFor('rifle', 'normal'), H.scaleFor('pistol', 'kolay'), H.scaleFor('pistol', 'zor')];
    return out;
  }, { TABANCA_SAG, TUFEK_SAG });

  section('Saat yönüne göre teşhis (skor 60: iki neden, 78: bir neden, 90: neden yok)');
  let bad = R.clock.filter(c => JSON.stringify(c.got) !== JSON.stringify(c.spec) || JSON.stringify(c.got78) !== JSON.stringify([c.spec[0]]) || c.got90.length !== 0);
  for (const weapon of ['pistol', 'rifle']) for (const hand of ['R', 'L']) {
    const rows = R.clock.filter(c => c.weapon === weapon && c.hand === hand);
    const wrong = rows.filter(c => bad.includes(c));
    check(wrong.length === 0, `${weapon === 'pistol' ? 'Tabanca' : 'Tüfek'} · ${hand === 'R' ? 'sağ' : 'sol'} el · 12 yön`, wrong.slice(0, 3));
  }
  check(JSON.stringify(R.misc.weak) === JSON.stringify(TABANCA_SAG[mirror(3)]), 'Destek eli alıştırmasında yönler aynalanır (sağ elli atıcı, 3:00 → sol el şeması)', R.misc.weak);

  section('Özel hatalar');
  check(R.misc.kant26.includes('kanting') && R.misc.kantNeg.includes('kanting') && !R.misc.kant24.includes('kanting'), 'Kanting: 2,5° ve üstünde (iki yöne de), altında değil');
  check(R.misc.gez.includes('gezinme') && !R.misc.gezSpeed.includes('gezinme'), 'Nişan gezinmesi: serbest antrenmanda var, hızlı alıştırmada aranmaz');
  check(!R.misc.gezIyi.includes('gezinme'), 'İyi atışta (85+) nişan gezinmesi söylenmez (T4)', R.misc.gezIyi);
  check(R.misc.gezRifle.includes('gezinme') && !R.misc.gezSmall.includes('gezinme'), 'Gezinme eşiği tüfekte daha sıkı (0,12° tüfekte hata, tabancada değil)');
  check(R.misc.takip.includes('takip') && !R.misc.takipLive.includes('takip') && !R.misc.takipSmall.includes('takip'), 'Takibi bırakma: sadece kuru tetikte ve belirgin olduğunda');
  check(R.misc.max3.length === 3, 'Bir atışta en çok 3 neden gösterilir', R.misc.max3);
  check(R.misc.titr[0] === 'gezinme' && !R.misc.titr.includes('tokatlama'), 'Tetik anındaki hareket titreme düzeyindeyse tetik hatası değil, dengesiz tutuş söylenir', R.misc.titr);
  check(JSON.stringify(R.misc.net) === JSON.stringify(['tokatlama', 'bilek_asagi']), 'Hareket titremenin belirgin üstündeyse saat yönüne göre tetik hatası söylenir', R.misc.net);
  check(R.misc.sinir[0][0] === 'tokatlama' && R.misc.sinir[1][0] === 'gezinme', 'Ayırma eşiği: hareket titremenin 1,75 katı', R.misc.sinir);
  check(R.misc.taban[0] === 'gezinme', 'Önemsiz küçüklükteki hareketten yön çıkarılmaz', R.misc.taban);
  check(!R.misc.kantYt[0].includes('kanting') && R.misc.kantYt[1].includes('kanting') && R.misc.kantYt[2].includes('kanting') && !R.misc.kantYt[3].includes('kanting') && !R.misc.kantYt[4].includes('kanting'),
    'Kanting: yön testi yoksa 6° (bant yatıklığı), varsa 2,5°; 25° üstü kanting sayılmaz (montaj değişmiş)', R.misc.kantYt);
  check(R.misc.titrSpeed[0] === 'tokatlama' && R.misc.eskiKayit[0] === 'tokatlama', 'Hızlı alıştırmalarda ve titreme ölçüsü olmayan eski kayıtlarda saat yönü kullanılır', [R.misc.titrSpeed, R.misc.eskiKayit]);

  section('T4: tetik çekerken silahı döndürme');
  check(R.misc.donSag.includes('donme_sag') && R.misc.donSol.includes('donme_sol'), 'Tetik anında 2° dönme: sağa ve sola ayrı söylenir', [R.misc.donSag, R.misc.donSol]);
  check(!R.misc.donKucuk.some(x => /donme/.test(x)), '1°\'den küçük dönme söylenmez', R.misc.donKucuk);
  check(!R.misc.donTitr.some(x => /donme/.test(x)), 'Dönme, tutuştaki dönme titremesinin 1,75 katı değilse söylenmez', R.misc.donTitr);
  check(!R.misc.donSpeed.some(x => /donme/.test(x)) && !R.misc.donEski.some(x => /donme/.test(x)), 'Hızlı alıştırmada ve dönme ölçüsü olmayan eski kayıtta aranmaz', [R.misc.donSpeed, R.misc.donEski]);

  section('T4: oturum geneli tetik hatası (atışların ortalaması)');
  check(R.sis.yedi && R.sis.yedi.saat === 7 && R.sis.yedi.c === 'tokatlama' && R.sis.yedi.n === 10, 'Her atışta saat 7 yönüne küçük kayma (titreme kadar): oturumda "Tetiğe ani basma" bulunur', R.sis.yedi);
  check(R.sis.sol && R.sis.sol.saat === 7 && R.sis.sol.c === 'siki_tutus', 'Sol elde yön aynalanır (aynı atışlar: saat 7 → sol el şemasında saat 5: elini sıkma)', R.sis.sol);
  check(R.sis.az === null && R.sis.hizli === null && R.sis.kucuk === null, '6 atıştan azda, hızlı alıştırmada ve önemsiz küçüklükteki kaymada söylenmez', [R.sis.az, R.sis.hizli, R.sis.kucuk]);
  check(R.sis.yanlis <= 9, `Yalnız titreme (yönsüz): 300 oturumun ${R.sis.yanlis}'inde yanlış sistematik hata (en çok %3)`, R.sis.yanlis);
  check(R.sis.b10 >= 240 && R.sis.b20 >= 210, `Titreme altındaki sabit kayma bulunuyor: 10 atışta 1,5σ → ${R.sis.b10}/300 (en az %80), 20 atışta 1σ → ${R.sis.b20}/300 (en az %70)`, [R.sis.b10, R.sis.b20]);

  // ---------------------------------------------------------------- T8: izden zamanlama ve yeni hatalar
  const Z = await page.evaluate(() => {
    const H = window.__hisar, TRN = 161, out = {};
    const sess = o => Object.assign({ weapon: 'pistol', diff: 'normal', hand: 'R', handMode: 'normal', drill: 'serbest', mode: 'kuru', src: 'sensor' }, o);
    // iz: f(ms) → [x, y] derece; -1000..+600 ms, 10 ms
    const iz = f => { const a = new Float32Array(TRN * 2); for (let g = 0; g < TRN; g++) { const p = f(-1000 + g * 10); a[g * 2] = p[0]; a[g * 2 + 1] = p[1]; } return H.encTrace(a); };
    const ramp = (t0, t1, X, Y) => t => { const u = t <= t0 ? 0 : t >= t1 ? 1 : (t - t0) / (t1 - t0); return [X * u, Y * u]; };
    const a7 = 210 * Math.PI / 180, X7 = Math.sin(a7) * 0.2, Y7 = Math.cos(a7) * 0.2;      // saat 7 yönünde 0,2°
    const shot = (f, o) => { const tz = iz(f), a = H.decTrace(tz), i0 = 99, i150 = 85; const dx = a[i0 * 2] - a[i150 * 2], dy = a[i0 * 2 + 1] - a[i150 * 2 + 1];
      return Object.assign({ sc: 60, h: H.hourOf(dx, dy), dx, dy, wv: 0.005, ca: 0, ho: 0.02, tr: Math.hypot(dx, dy), po: 0, tz }, o); };
    const ani = shot(ramp(-60, -10, X7, Y7)), sur = shot(ramp(-150, -10, X7, Y7)), onc = shot(ramp(-450, -10, X7 * 3, Y7 * 3));
    out.sinif = [ani, sur, onc].map(q => H.tetikSinif(H.dinamik(q)));
    out.c = [ani, sur, onc].map(q => H.diagnose(q, sess({})));
    out.cL = H.diagnose(shot(ramp(-60, -10, -X7, Y7)), sess({ hand: 'L' }));           // sol el: saat 5 → aynalı 7
    out.cRifle = [ani, sur].map(q => H.diagnose(q, sess({ weapon: 'rifle' })));
    out.eskiIz = H.diagnose(Object.assign({}, sur, { tz: null }), sess({}));            // iz yoksa klasik şema
    out.hizli = H.diagnose(ani, sess({ drill: 'zamanlayici' }));                          // hızlı alıştırmada zamanlama aranmaz
    // dikey kayma: son saniye boyunca 0,3 °/sn aşağı (nefes / kol); tetikte ek hareket yok
    const dik = shot(t => [0, -0.3 * (t + 1000) / 1000], { sc: 70, ho: 0.09 });
    out.dikey = H.diagnose(dik, sess({})); out.dikeyIyi = H.diagnose(Object.assign({}, dik, { sc: 90 }), sess({}));
    // rastgele (düzgün olmayan) sallanma: 3 Hz ve 5 Hz salınım → dikey kayma değil, gezinme
    const gez = shot(t => [0.08 * Math.sin(t / 1000 * 2 * Math.PI * 3), 0.08 * Math.sin(t / 1000 * 2 * Math.PI * 5 + 1)], { sc: 70, ho: 0.09 });
    out.gez = H.diagnose(gez, sess({}));
    // nefesle önceden başlayan düzgün dikey kayma tetik penceresine uzanıyor → dikey kayma (kovalama değil)
    const nef = shot(t => [0, -0.25 * (t + 1000) / 1000 + (t > -300 ? -0.6 * (t + 300) / 1000 : 0)], { sc: 70, wv: 0.03 });
    out.nefes = H.diagnose(nef, sess({}));
    // nişan süresi
    out.uzun = [H.diagnose({ sc: 70, h: 12, ca: 0, ho: 0.02, tr: 0.05, po: 0, nt: 9000 }, sess({})), H.diagnose({ sc: 70, h: 12, ca: 0, ho: 0.02, tr: 0.05, po: 0, nt: 5000 }, sess({})),
      H.diagnose({ sc: 70, h: 12, ca: 0, ho: 0.02, tr: 0.05, po: 0, nt: 9000 }, sess({ weapon: 'rifle' })), H.diagnose({ sc: 70, h: 12, ca: 0, ho: 0.02, tr: 0.05, po: 0, nt: 11000 }, sess({ weapon: 'rifle' })),
      H.diagnose({ sc: 70, h: 12, ca: 0, ho: 0.02, tr: 0.05, po: 0, nt: 9000 }, sess({ src: 'demo' })), H.diagnose({ sc: 90, h: 12, ca: 0, ho: 0.02, tr: 0.05, po: 0, nt: 9000 }, sess({}))];
    // lazer: tetik temiz, lazer merkezin 0,3° sağında → nişan noktası; tetik 0,2° sağa kaydıysa değil
    const lzS = sess({ lzR: 0.05, dist: 10 }), lzq = o => Object.assign({ sc: 90, h: 3, dx: 0.01, dy: 0, ca: 0, ho: 0.01, tr: 0.01, po: 0, lz: { gor: true, p: [0.3, 0] } }, o);
    out.lz = [H.diagnose(lzq({}), lzS), H.diagnose(lzq({ dx: 0.2, sc: 60 }), lzS), H.diagnose(lzq({ lz: { gor: false } }), lzS), H.diagnose(lzq({}), sess({}))];
    // şekilli hedef: iç bölgenin ortası (10 m'de 10 cm yukarı = 0,573°) nişan noktası
    const ic = [[-5, 5], [5, 5], [5, 15], [-5, 15]], sk = sess({ lzR: 0.05, dist: 10, lzTip: 'sekil', lzIc: ic });
    out.lzSekil = [H.diagnose(lzq({ lz: { gor: true, p: [0, 0.5729] } }), sk), H.diagnose(lzq({ lz: { gor: true, p: [0, 0] } }), sk)];
    // ölçüm satırı
    const ks = sess({ dist: 25 }), kan = q => { q.c = H.diagnose(q, ks); return H.teshisKanit(q, ks); };
    out.kanit = { ani: kan(Object.assign({}, ani)), sur: kan(Object.assign({}, sur)), onc: kan(Object.assign({}, onc)), dik: kan(Object.assign({}, dik)),
      uzun: kan({ sc: 80, h: 12, dx: 0.01, dy: 0, wv: 0.03, ca: 0, ho: 0.03, tr: 0.02, po: 0, nt: 9000 }), kant: kan({ sc: 90, h: 12, ca: 4, ho: 0.01, tr: 0.01, po: 0 }),
      lz: (() => { const q = lzq({}); q.c = H.diagnose(q, lzS); return H.teshisKanit(q, lzS); })() };
    // oturum geneli: her atışta önceden başlayan aşağı itme → kovalama değil, yöne özgü neden
    const asagi = Array.from({ length: 8 }, (_, i) => Object.assign(shot(ramp(-450, -10, 0.01 * (i % 3 - 1), -0.3)), { n: i + 1, x: {} }));
    out.sisOnc = H.sistematik(sess({ shots: asagi }));
    // gözlemler
    const g = (shots, o) => H.oturumGozlem(sess(Object.assign({ shots }, o || {}))).map(x => x.t);
    const yon8 = Array.from({ length: 8 }, (_, i) => { const a = i * 45 * Math.PI / 180, q = { n: i + 1, sc: 60, dx: Math.sin(a) * 0.2, dy: Math.cos(a) * 0.2, ca: 0, ho: 0.02, tr: 0.2, po: 0, x: {} }; q.h = H.hourOf(q.dx, q.dy); q.c = H.diagnose(q, sess({})); return q; });
    const ayni = Array.from({ length: 8 }, (_, i) => { const q = { n: i + 1, sc: 60, dx: -0.1, dy: -0.17, ca: 0, ho: 0.02, tr: 0.2, po: 0, x: {} }; q.h = H.hourOf(q.dx, q.dy); q.c = H.diagnose(q, sess({})); return q; });
    const yor = Array.from({ length: 12 }, (_, i) => ({ n: i + 1, sc: 80, dx: 0, dy: 0, h: 12, ca: 0, ho: i < 4 ? 0.04 : i < 8 ? 0.07 : 0.12, tr: 0.02, po: 0, x: {}, c: [] }));
    const lzs = Array.from({ length: 5 }, (_, i) => ({ n: i + 1, sc: 90, dx: 0.005 * i, dy: 0, h: 3, ca: 0, ho: 0.01, tr: 0.01, po: 0, x: {}, c: [], lz: { gor: true, p: [0.3 + 0.01 * i, -0.02 * i] } }));
    const uzn = Array.from({ length: 5 }, (_, i) => ({ n: i + 1, sc: 80, dx: 0, dy: 0, h: 12, ca: 0, ho: 0.02, tr: 0.02, po: 0, x: {}, c: [], nt: i < 3 ? 9500 : 4000 }));
    out.gozlem = { daginik: g(yon8), ayni: g(ayni), yor: g(yor), yorAz: g(yor.slice(0, 8)), lz: g(lzs, { lzR: 0.05, dist: 10 }), lzYok: g(lzs), uzun: g(uzn), uzunDemo: g(uzn, { src: 'demo' }), hizli: g(yon8, { drill: 'zamanlayici' }) };
    // kart: ölçüm satırı, tekrar sayısı; oturum özetinde gözlem kartı, aynı neden iki kez yok
    const ss = sess({ id: 'kartT8', shots: [], dist: 25 });
    for (let i = 0; i < 3; i++) { const q = Object.assign(shot(ramp(-60, -10, X7, Y7)), { n: i + 1, at: i * 3000, x: {} }); q.c = H.diagnose(q, ss); ss.shots.push(q); }
    const kart = document.createElement('div'); kart.innerHTML = H.hedefMetin(ss, ss.shots, ss.shots[2], null, false, false); out.kart = kart.innerText;
    const oz = document.createElement('div'); oz.innerHTML = H.hedefMetin(Object.assign({}, ss, { shots: yon8 }), yon8, yon8[7], null, true, false); out.ozet = oz.innerText;
    const oz2 = document.createElement('div'); const sa = Object.assign(sess({ shots: ayni })); oz2.innerHTML = H.hedefMetin(sa, ayni, ayni[7], null, true, false);
    out.ozetAyni = { metin: oz2.innerText, sis: H.sistematik(sa) && H.sistematik(sa).c, kart: [...oz2.querySelectorAll('.hd-kart b')].map(b => b.textContent) };
    out.ver = H.TESHIS_V;
    return out;
  });
  const ad = id => R.adlar[id] || id;
  section('T8: tetik hareketinin zamanı (izden)');
  check(JSON.stringify(Z.sinif) === JSON.stringify(['ani', 'surekli', 'onceden']), 'Saat 7 yönüne 0,2°: son 50 ms\'de → ani, 150 ms boyunca → baskı boyunca, 450 ms önceden → önceden', Z.sinif);
  check(Z.c[0][0] === 'tokatlama' && Z.c[1][0] === 'tum_el' && Z.c[2][0] === 'kovalama', 'Aynı yön, farklı neden: ani → "Tetiğe ani basma", yavaş → "Bütün parmakları kapatma", önceden → "Nişan kayarken tetiği bitirme"', Z.c);
  check(Z.c[0][1] === 'geri_tepme' && Z.c[1][1] === 'bilek_asagi', 'Skor 70 altı: ikinci olası neden de zamanlamaya göre (ani: irkilme, yavaş: bilek)', Z.c);
  check(Z.cL[0] === 'tokatlama', 'Sol el: aynalı yönde aynı zamanlama şeması', Z.cL);
  check(Z.cRifle[0][0] === 'tokatlama' && Z.cRifle[1][0] === 'tum_el', 'Tüfek: saat 7 ani → ani basma, yavaş → bütün parmakları kapatma', Z.cRifle);
  check(Z.eskiIz[0] === 'tokatlama' && Z.hizli[0] === 'tokatlama', 'İzi olmayan eski kayıtta ve hızlı alıştırmada klasik şema (saat 7 → ani basma)', [Z.eskiIz, Z.hizli]);
  section('T8: nişandan gelen hatalar');
  check(Z.dikey[0] === 'dikey_kayma' && !Z.dikeyIyi.includes('dikey_kayma'), 'Son saniyede düzgün 0,3 °/sn aşağı kayma → "Nişanın aşağı-yukarı kayması" (iyi atışta söylenmez)', [Z.dikey, Z.dikeyIyi]);
  check(Z.gez[0] === 'gezinme' && !Z.gez.includes('dikey_kayma'), 'Düzgün olmayan sallanma → "Nişanın sallanması" (dikey kayma değil)', Z.gez);
  check(Z.nefes[0] === 'dikey_kayma', 'Nefesle düzgün dikey kayma atışa kadar sürüyor → dikey kayma, kovalama değil', Z.nefes);
  check(Z.uzun[0].includes('uzun_nisan') && !Z.uzun[1].includes('uzun_nisan') && !Z.uzun[2].includes('uzun_nisan') && Z.uzun[3].includes('uzun_nisan') && !Z.uzun[4].includes('uzun_nisan') && !Z.uzun[5].includes('uzun_nisan'),
    'Nişanı uzatma: tabancada 8 sn, tüfekte 10 sn üstü; deneme modunda ve iyi atışta söylenmez', Z.uzun);
  check(Z.lz[0][0] === 'nisan_noktasi' && !Z.lz[1].includes('nisan_noktasi') && !Z.lz[2].includes('nisan_noktasi') && !Z.lz[3].includes('nisan_noktasi'),
    'Lazer: tetik temiz ama lazer 0,3° sağda → "Gez-arpacık hizası bozuk"; tetik hareketi açıklıyorsa, lazer görülmediyse, lazersiz oturumda yok', Z.lz);
  check(!Z.lzSekil[0].includes('nisan_noktasi') && Z.lzSekil[1][0] === 'nisan_noktasi', 'Şekilli hedefte nişan noktası iç bölgenin ortası', Z.lzSekil);
  section('T8: ölçüm satırı (teşhisin dayanağı)');
  const k = Z.kanit;
  check(/saat 7/.test(k.ani) && /son 50 ms/.test(k.ani) && /25 m'de/.test(k.ani) && /yavaş yavaş/.test(k.sur) && /önce başlamıştı/.test(k.onc), 'Tetik nedenlerinde yön, büyüklük (25 m\'de cm) ve zamanlama yazıyor', k);
  check(/aşağı/.test(k.dik) && /9,0 saniye/.test(k.uzun) && /4,0° sağa/.test(k.kant) && /sağında/.test(k.lz), 'Dikey kayma, nişan süresi, kanting ve lazer için ölçüm yazıyor', k);
  section('T8: oturum geneli');
  check(Z.sisOnc && Z.sisOnc.sn === 'onceden' && Z.sisOnc.c === 'ileri_itme', 'Her atışta önceden başlayan aşağı itme: oturum genelinde kovalama değil yöne özgü neden (silahı öne itme)', Z.sisOnc);
  const G = Z.gozlem;
  check(G.daginik.includes('daginik') && !G.ayni.includes('daginik') && !G.hizli.length, 'Tetik hataları her atışta başka yönde → "Hatalar her atışta başka yönde"; hep aynı yönde ya da hızlı alıştırmada değil', G);
  check(G.yor.includes('yorulma') && !G.yorAz.includes('yorulma'), 'Son atışlarda titreme belirgin arttı → "Yorulma"', G);
  check(G.lz.includes('nisan') && !G.lzYok.includes('nisan'), 'Lazerde grup tetik hareketi çıkarılınca da kayık → "Grup nişan noktasından kayık"', G);
  check(G.uzun.includes('uzun') && !G.uzunDemo.includes('uzun'), 'Atışların yarısından çoğu uzun nişanla → "Nişan uzun sürüyor" (deneme modunda yok)', G);
  check(/Ölçüm:/.test(Z.kart) && /son 50 ms/.test(Z.kart) && /3\. kez/.test(Z.kart), 'Atış kartında "Ölçüm:" satırı ve "bu oturumda 3. kez"', Z.kart.slice(0, 400));
  check(/Hatalar her atışta başka yönde/.test(Z.ozet), 'Oturum özetinde gözlem kartı görünüyor', Z.ozet.slice(0, 500));
  const oa = Z.ozetAyni; check(oa.sis && oa.kart.filter(b => b === ad(oa.sis)).length === 1, 'Oturum geneli hata ile en sık hata aynıysa bir kez gösteriliyor', oa);
  check(Z.ver === 2, 'Teşhis yöntemi sürümü 2', Z.ver);

  // T8: kayıtlı (eski teşhisli) oturum açılışta bir kez yeni yöntemle değerlendirilir
  const eskiIz = await page.evaluate(() => { const H = window.__hisar, a = new Float32Array(161 * 2), A = 210 * Math.PI / 180;
    for (let g = 0; g < 161; g++) { const t = -1000 + g * 10, u = t <= -60 ? 0 : t >= -10 ? 1 : (t + 60) / 50; a[g * 2] = Math.sin(A) * 0.2 * u; a[g * 2 + 1] = Math.cos(A) * 0.2 * u; }
    return H.encTrace(a); });
  const eskiS = { id: 'eskiT8', v: 2, drill: 'serbest', date: Date.now() - 3600e3, dur: 30, src: 'sensor', mode: 'kuru', weapon: 'pistol', weaponName: '', hand: 'R', handMode: 'normal', diff: 'normal', notes: '', extra: {},
    shots: [{ n: 1, at: 1000, sc: 60, tr: 0.2, ho: 0.02, hx: 0.01, hy: 0.01, dx: -0.1, dy: -0.173, wv: 0.005, dr: 0, rv: 0.1, h: 7, ca: 0, po: 0, x: {}, c: ['eski_neden'], tz: eskiIz }] };
  const p2 = await openApp(browser, { port: PORT, storage: { 'hisarTetik.v2.meta': JSON.stringify({ v: 2, settings: {}, ids: ['eskiT8'] }), 'hisarTetik.v2.s.eskiT8': JSON.stringify(eskiS) } });
  const yd = await p2.page.evaluate(() => { const s = window.__hisar.sessions.find(x => x.id === 'eskiT8'), ls = JSON.parse(localStorage.getItem('hisarTetik.v2.s.eskiT8'));
    return { c: s && s.shots[0].c, tv: s && s.tv, lsTv: ls.tv, lsC: ls.shots[0].c }; });
  check(JSON.stringify(yd.c) === JSON.stringify(['tokatlama', 'geri_tepme']) && yd.tv === 2 && yd.lsTv === 2 && JSON.stringify(yd.lsC) === JSON.stringify(yd.c),
    'Eski teşhisli kayıtlı oturum açılışta yeni yöntemle değerlendirilip kaydediliyor (bir kez)', yd);
  check(p2.errs.length === 0, 'Yeniden değerlendirmede sayfa hatası yok', p2.errs);
  await p2.ctx.close();

  section('Kapsam ve içerik');
  for (const v of [Z.c, Z.dikey, Z.uzun, Z.lz].flat(2)) if (typeof v === 'string') R.seen.push(v);
  const missing = R.allIds.filter(id => !R.seen.includes(id));
  check(R.allIds.length === 21, '21 hata tanımlı (T8: +4)', R.allIds.length);
  check(missing.length === 0, 'Her hata en az bir durumda teşhis ediliyor', missing);
  check(R.causeShape.every(c => c.ok), 'Her hatanın adı, özeti, nedeni, düzeltme adımları ve önerilen alıştırması var', R.causeShape.filter(c => !c.ok));
  check(JSON.stringify(R.verdict) === JSON.stringify(['HARİKA ATIŞ', 'İYİ ATIŞ', 'İYİ ATIŞ', 'GELİŞTİRİLMELİ', 'GELİŞTİRİLMELİ', 'ZAYIF ATIŞ']), 'Skor sınırları: 85 harika, 70 iyi, 50 geliştirilmeli', R.verdict);
  check(JSON.stringify(R.hours) === JSON.stringify([12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]), 'Kayma açısı → saat yönü (yukarı 12, sağ 3, aşağı 6, sol 9)', R.hours);
  check(Math.abs(R.scale[0] - 0.30) < 1e-9 && Math.abs(R.scale[1] - 0.18) < 1e-9 && Math.abs(R.scale[2] - 0.48) < 1e-9 && Math.abs(R.scale[3] - 0.195) < 1e-9, 'Skor ölçeği: tabanca 0,30°, tüfek 0,18°, kolay ×1,6, zor ×0,65', R.scale);
  check(errs.length === 0, 'Sayfa hatası yok', errs);
  await browser.close(); srv.close();
  process.exit(finish('Teşhis testi') ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
