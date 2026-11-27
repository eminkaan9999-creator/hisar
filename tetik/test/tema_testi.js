// Tema testi (T5, Hisar 360 görünümü): karanlık varsayılan; aydınlık ve "cihaza göre" seçimi; seçimin ilk çizimden önce
// uygulanması ve yeniden açılışta kalması; bütün ekranlarda ve ayar sayfalarında yazı/zemin kontrastı (normal yazı ≥ 4,5,
// büyük yazı ≥ 3; devre dışı ögeler hariç, WCAG gibi); grafiklerin, izin ve paylaşım resminin temanın renkleriyle çizilmesi.
// Sahte sensörle ve sürüm 28'de kaydedilmiş gerçek depoyla çalışır.
'use strict';
const { serve, check, section, finish, openApp, chromium, fs, path, sleep } = require('./ortak');
const PORT = 8826;
const FAKE = fs.readFileSync(path.join(__dirname, 'sahte_sensor.js'), 'utf8');
const CAM = fs.readFileSync(path.join(__dirname, 'sahte_kamera.js'), 'utf8');
const V28 = JSON.parse(fs.readFileSync(path.join(__dirname, 'veri', 'v28_kayit.json'), 'utf8'));
const TEMA_K = 'hisarTetik.v2.tema';
const SAYFALAR = ['gorunum', 'gelismis', 'montaj', 'algilama', 'veri', 'uygulama', 'ses', 'silah', 'profil', 'program', 'hesap', 'saat', 'lazer'];

// Görünür her yazının rengi ile arkasındaki zeminin karşıtlığı (ata zincirindeki zemin renkleri üst üste karıştırılır).
const denetim = () => {
  const ayir = c => { const m = /rgba?\(([^)]+)\)/.exec(c || ''); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(parseFloat); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const karis = (u, a) => ({ r: u.r * u.a + a.r * (1 - u.a), g: u.g * u.a + a.g * (1 - u.a), b: u.b * u.a + a.b * (1 - u.a), a: 1 });
  const L = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const oran = (a, b) => { const [x, y] = [L(a), L(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const zemin = el => { const zincir = []; for (let e = el; e && e !== document.documentElement; e = e.parentElement) zincir.push(e);
    let z = ayir(getComputedStyle(document.body).backgroundColor);
    for (const e of zincir.reverse()) { const cs = getComputedStyle(e); if (e !== document.body && cs.backgroundImage && cs.backgroundImage !== 'none') return null;
      const c = ayir(cs.backgroundColor); if (c && c.a > 0) z = karis(c, z); }
    return z; };
  const soluk = el => { for (let e = el; e && e !== document.documentElement; e = e.parentElement) { if (+getComputedStyle(e).opacity < 1 || e.disabled || e.getAttribute('aria-disabled') === 'true') return true; } return false; };
  const ad = e => (e.id ? '#' + e.id : e.tagName.toLowerCase() + (typeof e.className === 'string' && e.className ? '.' + e.className.split(' ')[0] : '')) + (e.parentElement ? ' < ' + (e.parentElement.id ? '#' + e.parentElement.id : e.parentElement.tagName.toLowerCase() + (typeof e.parentElement.className === 'string' && e.parentElement.className ? '.' + e.parentElement.className.split(' ')[0] : '')) : '');
  const hata = []; let n = 0;
  for (const e of document.querySelectorAll('body *')) {
    if (e.closest('canvas,.harita,.c-art,.flash,[hidden]') || ['SCRIPT', 'STYLE', 'CANVAS'].includes(e.tagName)) continue;
    const svgYazi = e.tagName === 'text' || e.tagName === 'tspan';
    if (e.closest('svg') && !svgYazi) continue;
    if (!Array.from(e.childNodes).some(k => k.nodeType === 3 && k.textContent.trim())) continue;
    const r = e.getBoundingClientRect(); if (r.width <= 1 || r.height <= 1) continue;
    const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    if (soluk(e)) continue;
    const z = zemin(svgYazi ? e.closest('svg').parentElement : e); if (!z) continue;
    let y = ayir(svgYazi ? cs.fill : cs.color); if (!y) continue; y = karis(y, z);
    const px = parseFloat(cs.fontSize), kalin = +cs.fontWeight >= 700;
    const sinir = !svgYazi && (px >= 24 || (px >= 18.66 && kalin)) ? 3 : 4.5;
    const o = oran(y, z); n++;
    if (o < sinir) hata.push(`${ad(e)} "${e.textContent.trim().slice(0, 24)}" ${o.toFixed(2)} (${cs.color}/${JSON.stringify(z)})`);
  }
  return { n, hata };
};

(async () => {
  const srv = await serve(PORT); const browser = await chromium.launch();

  section('İlk çizimde ortak HİSAR teması ve kayıtlı seçim');
  {
    const ilk = () => { new MutationObserver((ms, o) => { if (document.querySelector('.app')) { window.__ilkTema = document.documentElement.dataset.tema; o.disconnect(); } }).observe(document, { childList: true, subtree: true }); };
    for (const [secim, tema, zemin, cubuk] of [
      [null, 'koyu', 'rgb(4, 7, 16)', '#090e1b'],
      ['acik', 'acik', 'rgb(238, 241, 250)', '#f4f6fe']
    ]) {
      const storage = { ...V28.depo };
      if (secim) storage[TEMA_K] = secim;
      const { ctx, page, errs } = await openApp(browser, { port: PORT, init: [ilk], storage });
      const state = await page.evaluate(async () => {
        const fonts = await document.fonts.load('16px "Hisar Inter"', 'İıŞşĞğÇçÖöÜü');
        return { tema: document.documentElement.dataset.tema, ilk: window.__ilkTema,
          zemin: getComputedStyle(document.body).backgroundColor, cubuk: document.querySelector('meta[name="theme-color"]').content,
          embedded: fonts.some(f => f.status === 'loaded'), family: getComputedStyle(document.body).fontFamily };
      });
      check(state.tema === tema && state.ilk === tema, 'İlk çizimde beklenen tema: ' + tema, state);
      check(state.zemin === zemin && state.cubuk === cubuk, 'Sayfa ve tarayıcı çubuğu HİSAR paletinde', state);
      check(state.embedded && state.family.startsWith('"Hisar Inter"'), 'Türkçe Inter paket içinden yükleniyor', state);
      check(errs.length === 0, 'Sayfa hatası yok', errs);
      await ctx.close();
    }
  }

  section('Ayarlar › Görünüm: seçim, kalıcılık, "Cihaza göre"');
  {
    const { ctx, page, errs } = await openApp(browser, { port: PORT, init: [FAKE, () => { if (!localStorage.getItem('hisarTetik.v2.tema')) localStorage.setItem('hisarTetik.v2.tema', 'acik'); }], storage: V28.depo });
    await page.evaluate(() => window.__hisar.showView('ayarlar')); await sleep(200);
    const kok = await page.evaluate(() => ({ g: !!document.getElementById('rtGorunum'), h: !!document.getElementById('rtH3'), t: (document.getElementById('rtGorunum') || {}).textContent }));
    check(kok.g && kok.h && /Aydınlık/.test(kok.t), 'Ayarlar\'da Görünüm (tema adıyla) ve Hisar 360 hesabı satırları', kok);
    await page.click('#rtGorunum'); await sleep(250);
    const seg = await page.evaluate(() => Array.from(document.querySelectorAll('#sTema button')).map(b => [b.textContent.trim(), b.getAttribute('aria-pressed')]));
    check(JSON.stringify(seg) === JSON.stringify([['Aydınlık', 'true'], ['Karanlık', 'false'], ['Cihaza göre', 'false']]), 'Tema seçenekleri: Aydınlık (seçili), Karanlık, Cihaza göre', seg);
    await page.click('#sTema [data-v="koyu"]'); await sleep(300);
    const k = await page.evaluate(k => ({ t: document.documentElement.dataset.tema, kayit: localStorage.getItem(k), bg: getComputedStyle(document.body).backgroundColor, sayfa: !!document.getElementById('sTema'), basili: document.querySelector('#sTema [aria-pressed="true"]').dataset.v }), TEMA_K);
    check(k.t === 'koyu' && k.kayit === 'koyu' && k.bg === 'rgb(4, 7, 16)', 'Karanlık seçilince hemen uygulanıyor ve kaydediliyor', k);
    check(k.sayfa && k.basili === 'koyu', 'Görünüm sayfası açık kalıyor, seçili düğme güncel', k);
    await page.reload(); await page.waitForFunction(() => !!window.__hisar); await page.evaluate(() => window.__hisar.hideSplash());
    check(await page.evaluate(() => document.documentElement.dataset.tema) === 'koyu', 'Yeniden açılışta karanlık kalıyor');
    const yedek = await page.evaluate(() => { try { return JSON.stringify(JSON.parse(localStorage.getItem('hisarTetik.v2.meta')).settings); } catch (e) { return ''; } });
    check(!/tema/.test(yedek), 'Tema cihaz tercihi: oturum ayarlarına (yedeğe) girmiyor');
    await page.emulateMedia({ colorScheme: 'light' });
    await page.evaluate(() => { window.__hisar.showView('ayarlar'); window.__hisar.openSettings('gorunum'); }); await sleep(200);
    await page.click('#sTema [data-v="sistem"]'); await sleep(250);
    const s1 = await page.evaluate(() => document.documentElement.dataset.tema);
    await page.emulateMedia({ colorScheme: 'dark' }); await sleep(300);
    const s2 = await page.evaluate(() => document.documentElement.dataset.tema);
    await page.emulateMedia({ colorScheme: 'light' }); await sleep(300);
    const s3 = await page.evaluate(() => document.documentElement.dataset.tema);
    check(s1 === 'acik' && s2 === 'koyu' && s3 === 'acik', '"Cihaza göre": telefonun gece/gündüz ayarı değişince tema da değişiyor', [s1, s2, s3]);
    const ac = await page.evaluate(() => { window.__hisar.closePages ? 0 : 0; window.__hisar.showView('menu'); return document.querySelector('#v-menu').innerText.includes('Ayarlar'); });
    check(ac, 'Menü açılıyor');
    check(errs.length === 0, 'Sayfa hatası yok', errs);
    await ctx.close();
  }

  for (const tema of ['acik', 'koyu']) {
    const AD = tema === 'acik' ? 'Aydınlık' : 'Karanlık';
    section(`${AD} tema: bütün ekranlarda yazılar okunur (kontrast)`);
    const { ctx, page, errs } = await openApp(browser, { port: PORT, init: [FAKE, CAM], storage: Object.assign({}, V28.depo, { [TEMA_K]: tema }), keepSplash: true });
    const sonuc = {}; let toplam = 0;
    const kaydet = async ad => { const d = await page.evaluate(denetim); sonuc[ad] = d.hata; toplam += d.n; };
    await sleep(300); await kaydet('açılış');
    await page.evaluate(() => window.__hisar.hideSplash()); await sleep(500);
    for (const v of ['merkez', 'alistirma', 'gecmis', 'sensor', 'ayarlar', 'cihaz', 'kamera', 'menu']) { await page.evaluate(v => window.__hisar.showView(v), v); await sleep(250); await kaydet(v); }
    await page.evaluate(() => window.__hisar.showView('kamera')); await page.click('#kmAc'); await sleep(1200); await kaydet('kamera açık');
    await page.evaluate(() => window.__hisar.openReview(window.__hisar.sessions.find(s => !s.sample)));
    for (const sub of ['skor', 'ozet', 'grafik', 'iz']) { await page.evaluate(s => window.__hisar.setSub(s), sub); await sleep(300); await kaydet('oturum ' + sub); }
    await page.click('#grafikInfo').catch(() => {}); await sleep(250); await kaydet('alt pencere');
    await page.evaluate(() => { const c = document.querySelector('#sheet [data-close]'); if (c) c.click(); });
    for (const p of SAYFALAR) { await page.evaluate(p => { window.__hisar.showView('ayarlar'); window.__hisar.openSetPage(p); }, p); await sleep(220); await kaydet('sayfa ' + p); }
    await page.evaluate(() => { window.__hisar.showView('merkez'); const t = document.getElementById('toast'); t.textContent = 'Deneme bildirimi'; t.hidden = false; }); await sleep(150); await kaydet('bildirim');
    await page.setViewportSize({ width: 1280, height: 800 });
    for (const v of ['merkez', 'gecmis', 'kamera']) { await page.evaluate(v => { document.getElementById('toast').hidden = true; window.__hisar.showView(v); }, v); await sleep(300); await kaydet('geniş ' + v); }
    const kotu = Object.entries(sonuc).filter(([, h]) => h.length);
    check(toplam > 800, `Denetlenen yazı sayısı yeterli (${toplam})`, toplam);
    check(kotu.length === 0, `${AD}: ${Object.keys(sonuc).length} ekranda bütün yazılar kontrast sınırını geçiyor`, kotu.slice(0, 4).map(([k, h]) => [k, h.slice(0, 4)]));
    check(errs.length === 0, 'Sayfa hatası yok', errs);
    await ctx.close();
  }

  section('Grafikler, iz ve paylaşım resmi temanın renkleriyle çiziliyor; tema değişince açık ekran kendiliğinden yeniden çiziliyor');
  {
    const { ctx, page, errs } = await openApp(browser, { port: PORT, init: [FAKE], storage: Object.assign({}, V28.depo, { [TEMA_K]: 'sistem' }) });
    await page.emulateMedia({ colorScheme: 'light' }); await sleep(200);
    await page.evaluate(() => window.__hisar.openReview(window.__hisar.sessions.find(s => !s.sample)));
    // ekranda ne çiziliyse onu okur (yeniden çizdirmeden)
    const oku = () => page.evaluate(async () => {
      const cs = getComputedStyle(document.documentElement), v = n => cs.getPropertyValue('--' + n).trim().toLowerCase();
      const hex = p => '#' + [p[0], p[1], p[2]].map(n => n.toString(16).padStart(2, '0')).join('');
      const l = document.querySelector('#scoreChart svg line'), r = document.querySelector('#barChart g > :first-child'), c = document.getElementById('trace');   // sürüm 38: ızgara çizgisi, atışın tetik çubuğu
      const iz = c && c.offsetParent ? hex(c.getContext('2d').getImageData(3, 3, 1, 1).data) : null;
      const rapor = await window.__hisar.buildReport();
      return { tema: document.documentElement.dataset.tema, eksen: l ? l.getAttribute('stroke').toLowerCase() : null, cubuk: r ? r.getAttribute('fill').toLowerCase() : null, iz,
        rapor: hex(rapor.getContext('2d').getImageData(2, 2, 1, 1).data), line: v('line'), line2: v('line2'), trig: v('trig'), panel2: v('panel2'), bg: v('bg') };
    });
    await page.evaluate(() => window.__hisar.setSub('grafik')); await sleep(250);
    const a = await oku();
    check(a.tema === 'acik' && a.eksen === a.line && a.cubuk === a.trig, 'Aydınlık: grafik ızgarası ve tetik çubuğu tema renginde', a);
    check(a.rapor === a.bg, 'Aydınlık: paylaşım resminin zemini tema renginde', a);
    await page.emulateMedia({ colorScheme: 'dark' }); await sleep(350);
    const b = await oku();
    check(b.tema === 'koyu' && b.eksen === b.line && b.cubuk === b.trig && b.line !== a.line, 'Tema değişince açık grafik kendiliğinden karanlık renklerle yeniden çizildi', b);
    check(b.rapor === b.bg && b.bg === '#040710', 'Karanlık: paylaşım resmi karanlık zeminde', b);
    await page.evaluate(() => window.__hisar.setSub('iz')); await sleep(300);
    const c = await oku();
    check(c.iz === c.panel2, 'Karanlık: iz tuvalinin zemini tema renginde', c);
    await page.emulateMedia({ colorScheme: 'light' }); await sleep(350);
    const d = await oku();
    check(d.tema === 'acik' && d.iz === d.panel2 && d.iz !== c.iz, 'Tema değişince iz tuvali kendiliğinden aydınlık zeminle yeniden çizildi', d);
    check(errs.length === 0, 'Sayfa hatası yok', errs);
    await ctx.close();
  }

  await browser.close(); srv.close();
  process.exit(finish('Tema testi') ? 1 : 0);
})();
