// Hata teşhisi testi: 17 hatanın hepsi, sağ/sol el, tabanca/tüfek, saat yönleri, özel hatalar.
// Beklenen değerler NRA / 4-H sağ el tabanca hata şemasından (MantisX de aynı şemayı kullanır).
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
    out.allIds = Object.keys(H.CAUSES);
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

  section('Kapsam ve içerik');
  const missing = R.allIds.filter(id => !R.seen.includes(id));
  check(R.allIds.length === 17, '17 hata tanımlı', R.allIds.length);
  check(missing.length === 0, 'Her hata en az bir durumda teşhis ediliyor', missing);
  check(R.causeShape.every(c => c.ok), 'Her hatanın adı, özeti, nedeni, düzeltme adımları ve önerilen alıştırması var', R.causeShape.filter(c => !c.ok));
  check(JSON.stringify(R.verdict) === JSON.stringify(['HARİKA ATIŞ', 'İYİ ATIŞ', 'İYİ ATIŞ', 'GELİŞTİRİLMELİ', 'GELİŞTİRİLMELİ', 'ZAYIF ATIŞ']), 'Skor sınırları: 85 harika, 70 iyi, 50 geliştirilmeli', R.verdict);
  check(JSON.stringify(R.hours) === JSON.stringify([12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]), 'Kayma açısı → saat yönü (yukarı 12, sağ 3, aşağı 6, sol 9)', R.hours);
  check(Math.abs(R.scale[0] - 0.30) < 1e-9 && Math.abs(R.scale[1] - 0.18) < 1e-9 && Math.abs(R.scale[2] - 0.48) < 1e-9 && Math.abs(R.scale[3] - 0.195) < 1e-9, 'Skor ölçeği: tabanca 0,30°, tüfek 0,18°, kolay ×1,6, zor ×0,65', R.scale);
  check(errs.length === 0, 'Sayfa hatası yok', errs);
  await browser.close(); srv.close();
  process.exit(finish('Teşhis testi') ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
