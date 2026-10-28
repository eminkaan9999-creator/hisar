// Hata teşhisi testi: 15 hatanın hepsi, sağ/sol el, tabanca/tüfek, saat yönleri, özel hatalar.
// Beklenen değerler NRA / 4-H sağ el tabanca hata şemasından (MantisX de aynı şemayı kullanır).
'use strict';
const { serve, check, section, finish, openApp, chromium } = require('./ortak');
const PORT = 8781;

const TABANCA_SAG = {
  12: ['Bileği yukarı bükme', 'Geri tepmeyi öngörme'],
  1: ['Avuçla itme', 'Geri tepmeyi öngörme'],
  2: ['Avuçla itme', 'Başparmakla itme'],
  3: ['Başparmakla itme', 'Tetik parmağının yetersiz kullanımı'],
  4: ['Çok sıkı tutuş', 'Tetik parmağının yetersiz kullanımı'],
  5: ['Çok sıkı tutuş', 'Bileği aşağı bükme'],
  6: ['Bileği aşağı bükme', 'İleri itme'],
  7: ['Tetiği tokatlama', 'Bileği aşağı bükme'],
  8: ['Tetiği tokatlama', 'Tüm elle sıkma'],
  9: ['Tetik parmağının fazla kullanımı', 'Tetiği tokatlama'],
  10: ['Geri tepmeyi öngörme', 'Tetik parmağının fazla kullanımı'],
  11: ['Geri tepmeyi öngörme', 'Bileği yukarı bükme'],
};
// Tüfek (omuzdan atış) için tabanca şemasından uyarlanmış şema
const TUFEK_SAG = {
  12: ['Geri tepmeyi öngörme', 'Yanağı dipçikten kaldırma'],
  1: ['Geri tepmeyi öngörme', 'Çok sıkı tutuş'],
  2: ['Çok sıkı tutuş', 'Tetik parmağının yetersiz kullanımı'],
  3: ['Tetik parmağının yetersiz kullanımı', 'Çok sıkı tutuş'],
  4: ['Çok sıkı tutuş', 'Tetiği tokatlama'],
  5: ['Tetiği tokatlama', 'İleri itme'],
  6: ['İleri itme', 'Tetiği tokatlama'],
  7: ['Tetiği tokatlama', 'İleri itme'],
  8: ['Tetiği tokatlama', 'Tetik parmağının fazla kullanımı'],
  9: ['Tetik parmağının fazla kullanımı', 'Tetiği tokatlama'],
  10: ['Tetik parmağının fazla kullanımı', 'Geri tepmeyi öngörme'],
  11: ['Geri tepmeyi öngörme', 'Yanağı dipçikten kaldırma'],
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
    out.misc.gez = k({ sc: 90, ho: 0.2, tr: 0.05 }); out.misc.gezSpeed = k({ sc: 90, ho: 0.2, tr: 0.05 }, { drill: 'zamanlayici' });
    out.misc.gezRifle = k({ sc: 90, ho: 0.12, tr: 0.05 }, { weapon: 'rifle' }); out.misc.gezSmall = k({ sc: 90, ho: 0.12, tr: 0.05 });
    out.misc.takip = k({ sc: 90, po: 0.5, tr: 0.1 }); out.misc.takipLive = k({ sc: 90, po: 0.5, tr: 0.1 }, { mode: 'gercek' }); out.misc.takipSmall = k({ sc: 90, po: 0.3, tr: 0.1 });
    out.misc.max3 = k({ sc: 40, h: 7, ca: 4, ho: 0.5, tr: 0.2, po: 1 });
    for (const v of Object.values(out.misc)) v.forEach(x => out.seen.add(x));
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
  check(R.misc.gez.includes('gezinme') && !R.misc.gezSpeed.includes('gezinme'), 'Nişan gezinmesi: serbest antremanda var, hızlı alıştırmada aranmaz');
  check(R.misc.gezRifle.includes('gezinme') && !R.misc.gezSmall.includes('gezinme'), 'Gezinme eşiği tüfekte daha sıkı (0,12° tüfekte hata, tabancada değil)');
  check(R.misc.takip.includes('takip') && !R.misc.takipLive.includes('takip') && !R.misc.takipSmall.includes('takip'), 'Takibi bırakma: sadece kuru tetikte ve belirgin olduğunda');
  check(R.misc.max3.length === 3, 'Bir atışta en çok 3 neden gösterilir', R.misc.max3);

  section('Kapsam ve içerik');
  const missing = R.allIds.filter(id => !R.seen.includes(id));
  check(R.allIds.length === 15, '15 hata tanımlı', R.allIds.length);
  check(missing.length === 0, 'Her hata en az bir durumda teşhis ediliyor', missing);
  check(R.causeShape.every(c => c.ok), 'Her hatanın adı, özeti, nedeni, düzeltme adımları ve önerilen alıştırması var', R.causeShape.filter(c => !c.ok));
  check(JSON.stringify(R.verdict) === JSON.stringify(['HARİKA ATIŞ', 'İYİ ATIŞ', 'İYİ ATIŞ', 'GELİŞTİRİLMELİ', 'GELİŞTİRİLMELİ', 'ZAYIF ATIŞ']), 'Skor sınırları: 85 harika, 70 iyi, 50 geliştirilmeli', R.verdict);
  check(JSON.stringify(R.hours) === JSON.stringify([12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]), 'Kayma açısı → saat yönü (yukarı 12, sağ 3, aşağı 6, sol 9)', R.hours);
  check(Math.abs(R.scale[0] - 0.30) < 1e-9 && Math.abs(R.scale[1] - 0.18) < 1e-9 && Math.abs(R.scale[2] - 0.48) < 1e-9 && Math.abs(R.scale[3] - 0.195) < 1e-9, 'Skor ölçeği: tabanca 0,30°, tüfek 0,18°, kolay ×1,6, zor ×0,65', R.scale);
  check(errs.length === 0, 'Sayfa hatası yok', errs);
  await browser.close(); srv.close();
  process.exit(finish('Teşhis testi') ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
