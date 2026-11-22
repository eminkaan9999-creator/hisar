// Menü testi (sürüm 39): Eğitim listesinde alıştırmaların amacı, hatana göre önerilen alıştırma (Eğitim ve Kontrol Merkezi),
// Ayarlar listesinin okunurluğu (büyük harf yok, açıklama satırın altında ve kesilmeden), Gelişmiş ayarlarda tekrar yok.
'use strict';
const { serve, check, section, finish, openApp, chromium, sleep } = require('./ortak');
const PORT = 8803;

(async () => {
  const srv = await serve(PORT); const browser = await chromium.launch();
  const { page, errs } = await openApp(browser, { port: PORT });
  section('Eğitim listesi');
  await page.evaluate(() => window.__hisar.showView('alistirma')); await sleep(200);
  const e1 = await page.evaluate(() => ({ satir: Array.from(document.querySelectorAll('#drillList [data-drill]')).map(b => ({ ad: b.querySelector('.ln').firstChild.textContent, alt: (b.querySelector('.ln small') || {}).textContent || '' })),
    oneri: !!document.getElementById('oneriRow'), bol: Array.from(document.querySelectorAll('#drillList .sec')).map(e => e.firstChild.textContent.trim()) }));
  check(e1.satir.length >= 6 && e1.satir.every(r => r.alt.length > 3) && e1.satir.find(r => r.ad === 'Atış Zamanlayıcısı').alt === 'Hızlı ilk atış.', 'Her alıştırmanın altında amacı yazıyor (ör. Atış Zamanlayıcısı: Hızlı ilk atış.)', e1.satir.slice(0, 4));
  check(!e1.oneri && JSON.stringify(e1.bol) === JSON.stringify(['Günün Görevi', 'Antrenmanlar', 'Dersler']), 'Kayıt yokken öneri bölümü yok', e1.bol);
  // son 30 günde en sık hata: Tetiğe ani basma (4 atış) → Ritmik Antrenman
  await page.evaluate(() => { const H = window.__hisar, ss = { id: 'sMenu', v: 2, tv: 2, drill: 'serbest', date: Date.now() - 2 * 864e5, dur: 60, src: 'sensor', mode: 'kuru', weapon: 'pistol', weaponName: '', hand: 'R', handMode: 'normal', diff: 'normal', notes: '', extra: {}, who: H.S.prof,
      shots: [['tokatlama'], ['tokatlama'], ['tokatlama'], ['tokatlama'], ['gezinme'], ['basparmak'], []].map((c, i) => ({ n: i + 1, at: i * 3000, sc: c.length ? 60 : 92, tr: 0.1, ho: 0.03, h: 7, ca: 0, po: 0, x: {}, c })) };
    const eski = { id: 'sEski', v: 2, tv: 2, drill: 'serbest', date: Date.now() - 60 * 864e5, dur: 60, src: 'sensor', mode: 'kuru', weapon: 'pistol', weaponName: '', hand: 'R', handMode: 'normal', diff: 'normal', notes: '', extra: {}, who: H.S.prof,
      shots: Array.from({ length: 8 }, (_, i) => ({ n: i + 1, at: i * 3000, sc: 50, tr: 0.1, ho: 0.03, h: 3, ca: 0, po: 0, x: {}, c: ['basparmak'] })) };
    H.sessions.push(ss, eski); H.showView('alistirma'); });
  await sleep(200);
  const e2 = await page.evaluate(() => { const r = document.getElementById('oneriRow'); return { r: r ? r.innerText : null, d: r && r.dataset.oneri, bol: Array.from(document.querySelectorAll('#drillList .sec')).map(e => e.firstChild.textContent.trim()), o: window.__hisar.oneriAl() }; });
  check(e2.d === 'ritim' && /Ritmik Antrenman/.test(e2.r) && /En sık hatan: Tetiğe ani basma \(son 30 günde 4 atış\)/.test(e2.r) && e2.bol[0] === 'Sana önerilen',
    'Son 30 günde en sık hata "Tetiğe ani basma" → Eğitim\'in başında "Sana önerilen: Ritmik Antrenman" (60 gün önceki oturum sayılmıyor)', e2);
  await page.click('#oneriRow'); await sleep(250);
  const ac = await page.evaluate(() => window.__hisar.cur.sess && window.__hisar.cur.sess.drill);
  check(ac === 'ritim', 'Öneriye dokununca o alıştırma açılıyor', ac);
  section('Kontrol Merkezi');
  await page.evaluate(() => window.__hisar.showView('merkez')); await sleep(250);
  const m = await page.evaluate(() => { const b = document.getElementById('mzOneri'), k = document.querySelector('#v-merkez [aria-labelledby="mzHb"]'); return { b: b ? b.textContent : null, k: k ? k.innerText : '' }; });
  check(m.b === 'Önerilen: Ritmik Antrenman' && /En sık hatan son 30 günde: Tetiğe ani basma \(4 atış\)/.test(m.k), 'Hızlı başlat\'ta ilk seçenek "Önerilen: Ritmik Antrenman", altında en sık hata', m);
  section('Ayarlar');
  await page.evaluate(() => window.__hisar.openSettings(null)); await sleep(300);
  const a = await page.evaluate(() => { const b = document.getElementById('rtAdv'), sm = b.querySelector('small'), cs = getComputedStyle(b), lab = b.getBoundingClientRect(), r = sm.getBoundingClientRect();
    const satir = Array.from(document.querySelectorAll('#v-ayarlar .sl button')).map(x => { const s = x.querySelector('small'); return s ? { tasma: s.scrollWidth > s.clientWidth + 1, alt: s.getBoundingClientRect().top - x.getBoundingClientRect().top > 14 } : null; }).filter(Boolean);
    return { tt: cs.textTransform, alt: sm.textContent, ust: r.top - lab.top, satir }; });
  check(a.tt === 'none' && a.satir.length >= 5 && a.satir.every(x => x.alt && !x.tasma), 'Ayarlar satırları büyük harfle değil; açıklamalar satırın altında ve kesilmeden', a);
  check(/zorluk/.test(a.alt), 'Gelişmiş ayarların açıklaması içindekini söylüyor (atış algılama, zorluk, veriler, uygulama)', a.alt);
  await page.click('#rtAdv'); await sleep(250);
  const g = await page.evaluate(() => ({ p: Array.from(document.querySelectorAll('#pgBody [data-p]')).map(b => b.dataset.p), diff: !!document.getElementById('sDiff') }));
  check(JSON.stringify(g.p) === JSON.stringify(['algilama', 'veri', 'uygulama']) && g.diff, 'Gelişmiş ayarlar: atış algılama, veriler, uygulama ve zorluk (Görünüm iki kez yok)', g);
  check(errs.length === 0, 'Sayfa hatası yok', errs);
  await browser.close(); srv.close();
  process.exit(finish('Menü testi') ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
