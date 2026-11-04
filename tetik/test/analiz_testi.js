// Analiz testi: üç grafiğin (Gelişim, Hata haritası, Atış grubu) hesapları ve cümleleri bilinen verilerle denetlenir.
// Skor yükselince ▲, düşünce ▼; önceki dönem yoksa dönemin ilk yarısıyla karşılaştırma; en sık hata ve yönü;
// grup çapı (atışların yarısı) ve merkez kayması; Türkçe sayı ekleri (%24'ü, %30'unda, %100'ü); boş dönem;
// uzun dönemde hafta hafta; dokununca değer göstergesi; sayfada hata ve "NaN/undefined" yok.
'use strict';
const { serve, check, section, finish, openApp, chromium, sleep } = require('./ortak');
const PORT = 8813;

// Sayfada: verilen günlere bilinen atışlarla oturum ekler. spec: [{ago, n, sc, tr, ho, h, r, drill}]
const SEED = specs => {
  const H = window.__hisar, S = H.S, day = 864e5; let k = 0;
  for (const s of H.sessions.slice()) if (!s.sample) H.sessions.splice(H.sessions.indexOf(s), 1);
  for (const sp of specs) {
    const s = { id: 'an' + (k++), v: 2, drill: sp.drill || 'serbest', date: Date.now() - sp.ago * day, dur: 60, src: 'sensor', mode: 'kuru', weapon: 'pistol', weaponName: '', hand: 'R', handMode: 'normal', diff: 'normal', notes: '', extra: {}, shots: [], who: S.prof };
    for (let i = 0; i < sp.n; i++) {
      const a = ((sp.h || 6) * 30 + (i % 3 - 1) * 8) * Math.PI / 180, r = (sp.r || 0.1) * (0.6 + 0.8 * ((i * 7) % 10) / 10);
      const dx = +(Math.sin(a) * r).toFixed(4), dy = +(Math.cos(a) * r).toFixed(4);
      const q = { n: i + 1, at: i * 3000, sc: sp.sc, tr: sp.tr != null ? sp.tr : 0.1, ho: sp.ho != null ? sp.ho : 0.2, hx: 0.1, hy: 0.1, dx, dy, wv: 0.005, h: H.hourOf(dx, dy), ca: 0.3, po: 0.2, ri: 0.1, pg: 1, rc: null, c: [], x: {} };
      q.c = H.diagnose(q, s); s.shots.push(q);
    }
    H.sessions.unshift(s);
  }
};
const READ = () => ({
  cards: Array.from(document.querySelectorAll('#anCards > .card')).map(c => ({ id: c.id, h: c.querySelector('h2').textContent, s: (c.querySelector('.an-s') || {}).textContent || '' })),
  trendLast: Array.from(document.querySelectorAll('#anTrend svg text[font-weight="600"]')).map(t => t.textContent),
  pts: (window.__hisar.AN.trend || []).length, wk: !!((window.__hisar.AN.trend || [])[0] || {}).wk,
  top: Array.from(document.querySelectorAll('#anFaults .an-top button')).map(b => b.textContent.replace(/\s+/g, ' ').trim()),
  ring: Array.from(document.querySelectorAll('#anFaults [data-h]')).map(p => [+p.dataset.h, p.getAttribute('fill')]),
  body: document.getElementById('v-gecmis').innerText,
});

(async () => {
  const srv = await serve(PORT); const browser = await chromium.launch();
  const { ctx, page, errs } = await openApp(browser, { port: PORT });
  const H = (fn, a) => page.evaluate(fn, a);
  const show = async per => { await H(per => { const h = window.__hisar; h.showView('alistirma'); h.showView('gecmis'); const b = document.querySelector(`#perSeg [data-per="${per}"]`); if (b) b.click(); }, per); await sleep(250); return H(READ); };
  const clean = r => !/\b(undefined|NaN|null|Infinity)\b|\[object/.test(r.body);

  section('Gelişim: skor yükselince ▲, önceki dönemle karşılaştırma');
  {
    // önceki 7 gün: skor 60; bu 7 gün: skor 80, tetik hareketi yarıya inmiş
    await H(SEED, [{ ago: 12, n: 10, sc: 60, tr: 0.2, ho: 0.3 }, { ago: 9, n: 10, sc: 60, tr: 0.2, ho: 0.3 },
      { ago: 5, n: 10, sc: 78, tr: 0.1, ho: 0.3 }, { ago: 3, n: 10, sc: 80, tr: 0.1, ho: 0.3 }, { ago: 1, n: 10, sc: 82, tr: 0.1, ho: 0.3 }]);
    const r = await show(7);
    const g = r.cards.find(c => c.id === 'anTrend');
    check(JSON.stringify(r.cards.map(c => c.h)) === JSON.stringify(['Gelişim', 'Hata haritası', 'Atış grubu']), 'Üç kart: Gelişim, Hata haritası, Atış grubu', r.cards.map(c => c.h));
    check(r.pts === 3 && r.trendLast[0] === '82,0', 'Bu 7 günde 3 gün: 3 nokta; son değer 82,0', { pts: r.pts, last: r.trendLast });
    check(/Ortalama skorun 80,0\./.test(g.s) && /Önceki 7 güne göre skorun ▲ 20,0 puan arttı/.test(g.s) && /tetik hareketi %50 azaldı/.test(g.s) && /nişan gezinmesi aynı kaldı/.test(g.s),
      'Cümle: ortalama 80,0; önceki 7 güne göre ▲ 20,0 puan; tetik hareketi %50 azaldı; nişan gezinmesi aynı', g.s);
    check(/tetik hareketinden|nişan gezinmesinden|dengeli/.test(g.s), 'Puan kaybının kaynağı söyleniyor (tetik / tutuş)', g.s);
    check(clean(r), 'Ekranda NaN / undefined yok', null);
  }

  section('Gelişim: önceki dönemde atış yoksa dönemin başına göre; skor düşünce ▼');
  {
    await H(SEED, [{ ago: 6, n: 10, sc: 85, tr: 0.05, ho: 0.1 }, { ago: 4, n: 10, sc: 84, tr: 0.05, ho: 0.1 }, { ago: 2, n: 10, sc: 70, tr: 0.12, ho: 0.1 }, { ago: 1, n: 10, sc: 66, tr: 0.14, ho: 0.1 }]);
    const r = await show(7); const g = r.cards.find(c => c.id === 'anTrend');
    check(/Dönemin başına göre skorun ▼ 16,5 puan düştü/.test(g.s) && /tetik hareketi %160 arttı/.test(g.s), 'İlk yarı 84,5 → ikinci yarı 68,0: "Dönemin başına göre ▼ 16,5 puan düştü", tetik hareketi arttı', g.s);
    const all = await show(0); const g2 = all.cards.find(c => c.id === 'anTrend');
    check(/İlk atışlarına göre skorun ▼/.test(g2.s), '"Hepsi" seçiliyken ilk atışlara göre karşılaştırılıyor', g2.s);
    await H(SEED, [{ ago: 1, n: 3, sc: 75 }]);
    const few = await show(7); const g3 = few.cards.find(c => c.id === 'anTrend');
    check(/en az 10 atış/.test(g3.s) && clean(few), 'Az atışta (3) karşılaştırma yapılmıyor, "en az 10 atış" deniyor', g3.s);
  }

  section('Hata haritası: en sık hata, yönü ve Türkçe ekler');
  {
    await H(SEED, [{ ago: 2, n: 15, sc: 55, tr: 0.3, ho: 0.1, h: 7, r: 0.3 }, { ago: 1, n: 5, sc: 90, tr: 0.02, ho: 0.05, h: 7, r: 0.02 }]);
    const r = await show(7); const f = r.cards.find(c => c.id === 'anFaults');
    const ring = Object.fromEntries(r.ring); const op = h => { const m = /rgba\(229,72,77,([\d.]+)\)/.exec(ring[h] || ''); return m ? +m[1] : 0; };
    check(/Atışlarının %75'i 85'in altında\./.test(f.s), 'Cümle: "Atışlarının %75\'i 85\'in altında" (doğru ek)', f.s);
    check(/saat 7/.test(f.s) && op(7) === 1 && [1, 2, 3, 4, 5, 9, 10, 11, 12].every(h => op(h) === 0), 'Kaymalar saat 7\'de: cümlede ve halkada en koyu dilim 7', { s: f.s, ring: r.ring });
    check(r.top.length >= 1 && r.top.length <= 3 && /atışların %\d+'(i|ı|u|ü|si|sı|su|sü)n(de|da)/.test(r.top[0]) && /En sık hata: /.test(f.s), 'En sık 3 hata listesi, "atışların %…\'inde" ekleriyle', r.top);
    await H(SEED, [{ ago: 1, n: 8, sc: 92, tr: 0.02, ho: 0.05 }]);
    const ok = await show(7); const f2 = ok.cards.find(c => c.id === 'anFaults');
    check(/Hatalı atış yok/.test(f2.s) && ok.top.length === 0, 'Hepsi 85 üstüyse "Hatalı atış yok", liste boş', f2.s);
  }

  section('Atış grubu: çap, karşılaştırma, merkez kayması');
  {
    await H(SEED, [{ ago: 10, n: 12, sc: 70, h: 3, r: 0.2 }, { ago: 2, n: 12, sc: 80, h: 7, r: 0.1 }]);
    const r = await show(7); const g = r.cards.find(c => c.id === 'anGroup');
    const G = await H(() => { const A = window.__hisar.AN.group; return { r50: A.G.r50, n: A.pts.length, dia: new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(2 * A.G.r50) }; });
    const dia = G.dia;
    check(G.n === 12 && new RegExp(`Atışlarının yarısı ${dia}° çaplı`).test(g.s) && /25 m'de .* cm/.test(g.s), `Grup çapı = 2 × ortanca uzaklık (${dia}°) ve 25 m'deki karşılığı`, g.s);
    check(/saat 7/.test(g.s), 'Grubun merkezi saat 7 yönünde kaymış: söyleniyor', g.s);
    check(/göre %\d+ daha (sıkı|geniş)|göre aynı/.test(g.s), 'Grup önceki 7 günle karşılaştırılıyor', g.s);
    await H(SEED, [{ ago: 1, n: 3, sc: 80 }]);
    const few = await show(7); const g2 = few.cards.find(c => c.id === 'anGroup');
    check(/en az 5 atış/.test(g2.s) && /şu an 3/.test(g2.s), 'Az atışta grup çizilmiyor, kaç atış gerektiği söyleniyor', g2.s);
  }

  section('Boş dönem, uzun dönem (hafta hafta), dokunma göstergesi');
  {
    await H(SEED, [{ ago: 40, n: 10, sc: 70 }]);
    const e = await show(1);
    check(e.cards.every(c => /atış yok/.test(c.s)) && clean(e), 'Son 1 günde atış yok: üç kart da "Bu dönemde atış yok", NaN yok', e.cards.map(c => c.s));
    const specs = []; for (let d = 1; d <= 120; d += 2) specs.push({ ago: d, n: 5, sc: 60 + d / 10 });
    await H(SEED, specs);
    const w = await show(182);
    check(w.wk && w.pts >= 15 && w.pts <= 19, `60 gün antrenman: ${w.pts} haftalık nokta (45 günden fazlası hafta hafta)`, { pts: w.pts, wk: w.wk });
    const box = await page.locator('[data-an="trend"]').boundingBox();
    await page.locator('[data-an="trend"]').scrollIntoViewIfNeeded();
    const b2 = await page.locator('[data-an="trend"]').boundingBox();
    await page.mouse.move(b2.x + b2.width * 0.6, b2.y + 50); await sleep(150);
    const tip = await H(() => { const t = document.querySelector('#anTrend .an-tip'); return { vis: t && !t.hidden, txt: t ? t.textContent : '' }; });
    check(box && tip.vis && /haftası/.test(tip.txt) && /skor/.test(tip.txt) && /tetik/.test(tip.txt), 'Grafiğe gelince o haftanın skoru, tetik hareketi ve nişan gezinmesi görünüyor', tip);
  }

  check(errs.length === 0, 'Sayfa hatası yok', errs.slice(0, 5));
  await ctx.close(); await browser.close(); srv.close();
  process.exit(finish('Analiz testi') ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
