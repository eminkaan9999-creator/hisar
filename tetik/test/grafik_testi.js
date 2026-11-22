// Grafik testi (sürüm 38): skor çizgisi (bölgeler, ortalama, dokunma hedefleri), tetik/nişan çubukları (≤24 px, yuvarlak uç),
// seçili atışın özeti, tetik zamanlaması (son anda ani / baskı boyunca / önceden; izsiz ve hızlı alıştırmada), iz görünümü,
// Analiz'de tetik hatalarının zamanı (bölümlü çubuk ve lejant), koyu temada renkler.
'use strict';
const { serve, check, section, finish, openApp, chromium, sleep } = require('./ortak');
const PORT = 8799;

(async () => {
  const srv = await serve(PORT); const browser = await chromium.launch();
  const { page, errs } = await openApp(browser, { port: PORT });
  // örnek oturum: 6 atış; zamanlama: ani, yavaş, önceden, izsiz, ani, yavaş
  await page.evaluate(() => {
    const H = window.__hisar, TRN = 161, A = 210 * Math.PI / 180;
    const iz = (t0, t1) => { const a = new Float32Array(TRN * 2); for (let g = 0; g < TRN; g++) { const t = -1000 + g * 10, u = t <= t0 ? 0 : t >= t1 ? 1 : (t - t0) / (t1 - t0); a[g * 2] = Math.sin(A) * 0.2 * u; a[g * 2 + 1] = Math.cos(A) * 0.2 * u; } return H.encTrace(a); };
    const ss = { id: 'sGrafik', v: 2, tv: 2, drill: 'serbest', date: Date.now(), dur: 60, src: 'sensor', mode: 'kuru', weapon: 'pistol', weaponName: '', hand: 'R', handMode: 'normal', diff: 'normal', dist: 25, notes: '', extra: {}, shots: [] };
    const pr = [[-60, -10], [-150, -10], [-450, -10], null, [-60, -10], [-150, -10]];
    pr.forEach((p, i) => { const q = { n: i + 1, at: i * 4000, sc: 50 + i * 6, tr: 0.2 - i * 0.02, ho: 0.03 + i * 0.01, hx: 0.02, hy: 0.02, dx: -0.1, dy: -0.173, wv: 0.005, dr: 0, rv: 0.1, h: 7, ca: 0, po: 0.05, x: {}, nt: 3000 + i * 500 };
      if (p) q.tz = iz(p[0], p[1]); q.c = H.diagnose(q, ss); ss.shots.push(q); });
    H.sessions.push(ss); H.showView('gecmis'); H.openReview(ss); H.setSub('grafik');
  });
  await sleep(500);
  const g = await page.evaluate(() => { const sc = document.querySelector('#scoreChart svg'), bc = document.querySelector('#barChart svg');
    return { aria: sc && sc.getAttribute('aria-label'), metin: sc ? sc.textContent : '', hedef: document.querySelectorAll('#scoreChart rect[data-i]').length,
      daire: document.querySelectorAll('#scoreChart circle').length, cizgi: !!document.querySelector('#scoreChart polyline'),
      cubuk: [...document.querySelectorAll('#barChart path')].map(p => p.getBBox().width), cubukHedef: document.querySelectorAll('#barChart rect[data-i]').length,
      cubukAria: (document.querySelector('#barChart rect[data-i]') || { getAttribute: () => '' }).getAttribute('aria-label'), barAria: bc && bc.getAttribute('aria-label'),
      secili: document.getElementById('grafikSecili').innerText, zaman: document.getElementById('grafikZaman').innerText, zamanAria: (document.querySelector('#grafikZaman svg') || { getAttribute: () => '' }).getAttribute('aria-label') }; });
  section('Skor çizgisi');
  check(/Atış skorları, 6 atış, ortalama 65/.test(g.aria) && /harika/.test(g.metin) && /iyi/.test(g.metin) && /ort\. 65/.test(g.metin) && g.cizgi && g.daire === 6,
    'Skor çizgisi: 6 nokta, 85 "harika" ve 70 "iyi" bölgeleri yazıyla, ortalama etiketli (ort. 65)', { aria: g.aria, metin: g.metin.slice(0, 120), daire: g.daire });
  check(g.hedef === 6, 'Her atışın dokunma hedefi var (noktayı tam tutturmak gerekmez)', g.hedef);
  section('Tetik ve nişan çubukları');
  check(g.cubuk.length === 12 && g.cubuk.every(w => w <= 24.01) && g.cubukHedef === 6 && /tetik/.test(g.cubukAria) && /nişan/.test(g.cubukAria) && /derece/.test(g.barAria),
    'Atış başına iki çubuk (tetik yukarı, nişan aşağı), en çok 24 px, birim yazılı; her atışın dokunma hedefi değeri söylüyor', { n: g.cubuk.length, max: Math.max(...g.cubuk), aria: g.cubukAria });
  section('Seçili atış ve tetik zamanlaması');
  check(/Atış 6/.test(g.secili) && /skor 80/.test(g.secili) && /nişan süresi 5,5 sn/.test(g.secili), 'Seçili atışın özeti (son atış): skor, tetik, nişan, nişan süresi', g.secili);
  check(/Tetik zamanlaması/.test(g.zaman) && /baskı boyunca/.test(g.zaman) && /baskı boyunca/.test(g.zamanAria) && /Son 1 sn ortalama hız/.test(g.zaman), 'Yavaş tetik hareketinde "baskı boyunca"', g.zaman);
  const sec = async i => { await page.click(`#scoreChart rect[data-i="${i}"]`); await sleep(200);
    return page.evaluate(() => ({ sel: window.__hisar.cur.sel, secili: document.getElementById('grafikSecili').innerText, zaman: document.getElementById('grafikZaman').innerText, svg: !!document.querySelector('#grafikZaman svg') })); };
  const s0 = await sec(0), s2 = await sec(2), s3 = await sec(3);
  check(s0.sel === 0 && /Atış 1/.test(s0.secili) && /son anda ani/.test(s0.zaman), 'Noktaya dokununca atış seçiliyor; ani harekette "son anda ani"', s0);
  check(/önceden başlamış/.test(s2.zaman), 'Önceden başlayan harekette "önceden başlamış"', s2.zaman);
  check(!s3.svg && s3.zaman === '', 'İzi olmayan atışta zamanlama grafiği yok', s3);
  await page.click('#barChart rect[data-i="4"]'); await sleep(200);
  const s4 = await page.evaluate(() => ({ sel: window.__hisar.cur.sel, secili: document.getElementById('grafikSecili').innerText }));
  check(s4.sel === 4 && /Atış 5/.test(s4.secili), 'Çubuğa dokununca da atış seçiliyor', s4);
  const hz = await page.evaluate(() => { const H = window.__hisar, s = H.cur.sess; const d = document.createElement('div'); d.innerHTML = H.zamanHtml(s.shots[0], Object.assign({}, s, { drill: 'zamanlayici' })); return d.innerText; });
  check(/Hızlı alıştırmada zamanlama aranmaz/.test(hz), 'Hızlı alıştırmada zamanlama aranmıyor ve söyleniyor', hz);
  section('İz görünümü');
  await page.evaluate(() => { const H = window.__hisar; H.cur.sel = 0; H.setSub('iz'); }); await sleep(300);
  const iz = await page.evaluate(() => ({ t: document.getElementById('izZaman').innerText, svg: !!document.querySelector('#izZaman svg') }));
  check(iz.svg && /son anda ani/.test(iz.t), 'İz görünümünde seçili atışın tetik zamanlaması', iz);
  section('Analiz: tetik hatalarının zamanı');
  const an = await page.evaluate(() => { const H = window.__hisar, s = H.sessions.find(x => x.id === 'sGrafik'), all = s.shots.map(q => ({ q, s }));
    const d = document.createElement('div'); d.innerHTML = H.zamanDagilim(all); const az = H.zamanDagilim(all.slice(0, 2));
    return { t: d.innerText, parca: d.querySelectorAll('.zm-seg i').length, aria: (d.querySelector('.zm-seg') || { getAttribute: () => '' }).getAttribute('aria-label'), az }; });
  check(an.parca === 3 && /Son anda ani · 2 atış/.test(an.t) && /Baskı boyunca · 2 atış/.test(an.t) && /Önceden · 1 atış/.test(an.t) && /%40/.test(an.aria), 'Bölümlü çubuk: 3 parça, lejantta ad, sayı ve pay', an);
  check(an.az === '', '4\'ten az tetik hatasında gösterilmiyor', an.az);
  await page.evaluate(() => { window.__hisar.showView('gecmis'); }); await sleep(400);
  const anS = await page.evaluate(() => (document.getElementById('anCards') || { innerText: '' }).innerText);
  check(/Tetik hatalarının zamanı/.test(anS), 'Analiz sayfasının hata haritası kartında görünüyor', anS.slice(0, 300));
  section('Koyu tema');
  const koyu = await page.evaluate(() => { document.documentElement.setAttribute('data-tema', 'koyu'); const cs = getComputedStyle(document.documentElement); const r = [cs.getPropertyValue('--zm-ani').trim(), cs.getPropertyValue('--zm-sur').trim(), cs.getPropertyValue('--zm-onc').trim()]; document.documentElement.setAttribute('data-tema', 'acik'); return r; });
  check(JSON.stringify(koyu) === JSON.stringify(['#d95926', '#3987e5', '#199e70']), 'Koyu temada zamanlama renkleri koyu zemin adımları', koyu);
  check(errs.length === 0, 'Sayfa hatası yok', errs);
  await browser.close(); srv.close();
  process.exit(finish('Grafik testi') ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
