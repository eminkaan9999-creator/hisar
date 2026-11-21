// Arayüz testi (T2): yeni ana menü (telefonda altta 5, geniş ekranda solda 7), Kontrol Merkezi, Cihaz Yönetimi, Kamera,
// Menü; telefon, tablet ve bilgisayar, dikey ve yatay ekran; çevrimdışı göstergesi; yazı boyutu (en az 14 px) ve dokunma
// alanları; ekranda İngilizce kalmaması; sürüm 28'de kaydedilmiş oturum ve ayarların yeni sürümde aynen durması.
// Sahte sensörle çalışır; gerçek donanım testi değildir.
'use strict';
const { serve, check, section, finish, openApp, chromium, fs, path, sleep } = require('./ortak');
const PORT = 8822;
const FAKE = fs.readFileSync(path.join(__dirname, 'sahte_sensor.js'), 'utf8');
// sürüm 28 uygulamasının sahte sensörle kaydettiği gerçek depo (2 oturum, sol el, profil adı)
const V28 = JSON.parse(fs.readFileSync(path.join(__dirname, 'veri', 'v28_kayit.json'), 'utf8'));
const ANA = ['merkez', 'alistirma', 'gecmis', 'sensor', 'ayarlar', 'cihaz', 'kamera', 'menu'];
const YEDI = ['Kontrol Merkezi', 'Kamera', 'Sensörler', 'Eğitim Oturumları', 'Analiz ve Raporlar', 'Cihaz Yönetimi', 'Ayarlar'];

// görünür menü düğmeleri
const gorunur = () => Array.from(document.querySelectorAll('.nav button')).filter(b => getComputedStyle(b).display !== 'none')
  .map(b => { const r = b.getBoundingClientRect(); return { t: b.innerText.trim(), v: b.dataset.view, h: Math.round(r.height), w: Math.round(r.width) }; });
// yana taşan ögeler (kaydırılan ya da kırpan kabın içindekiler hariç)
const tasma = () => { const W = innerWidth + 1, o = [];
  const clipped = e => { for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) { const ox = getComputedStyle(a).overflowX; if (ox !== 'visible' && a.getBoundingClientRect().right <= W) return true; } return false; };
  document.querySelectorAll('body *').forEach(e => { const r = e.getBoundingClientRect(); if (r.width && r.right > W && getComputedStyle(e).position !== 'fixed' && !clipped(e)) o.push(e.id || e.tagName + '.' + String(e.className).split(' ')[0]); });
  if (document.documentElement.scrollWidth > innerWidth + 1) o.push('sayfa genişliği ' + document.documentElement.scrollWidth);
  return o.slice(0, 5); };
// 14 px'ten küçük görünür yazılar (grafiklerin içi, yani SVG ve tuval, hariç)
const kucukYazi = () => { const o = [];
  for (const e of document.querySelectorAll('main *, .nav *, #sheet *')) {
    if (e.closest('svg') || e.tagName === 'CANVAS') continue;
    if (!Array.from(e.childNodes).some(n => n.nodeType === 3 && n.textContent.trim())) continue;
    const r = e.getBoundingClientRect(); if (r.width <= 1 || r.height <= 1) continue;
    const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) continue;
    const px = parseFloat(cs.fontSize); if (px < 13.95) o.push(`${e.id || e.tagName.toLowerCase() + '.' + String(e.className).split(' ')[0]} ${px}px "${e.textContent.trim().slice(0, 18)}"`); }
  return o; };

(async () => {
  const srv = await serve(PORT); const browser = await chromium.launch();

  section('Telefon (390×844): açılış görünümü, alt menü, Menü\'deki 7 ana menü');
  {
    const { ctx, page, errs } = await openApp(browser, { port: PORT, init: [FAKE] });
    const a = await page.evaluate(() => ({ v: window.__hisar.curView, vis: !document.getElementById('v-merkez').hidden, h1: (document.querySelector('#v-merkez h1') || {}).textContent }));
    check(a.v === 'merkez' && a.vis && a.h1 === 'Kontrol Merkezi', 'Uygulama Kontrol Merkezi ile açılıyor', a);
    const nav = await page.evaluate(gorunur);
    check(JSON.stringify(nav.map(n => n.t)) === JSON.stringify(['Merkez', 'Eğitim', 'Analiz', 'Cihazlar', 'Menü']), 'Alt menüde 5 düğme: Merkez, Eğitim, Analiz, Cihazlar, Menü', nav.map(n => n.t));
    check(nav.every(n => n.h >= 48 && n.w >= 60), 'Alt menü düğmeleri büyük (en az 48 px yüksek, 60 px geniş)', nav.map(n => [n.t, n.w, n.h]));
    await page.click('.nav button[data-view="menu"]'); await sleep(200);
    const m = await page.evaluate(() => Array.from(document.querySelectorAll('#v-menu .k-liste button')).map(b => b.querySelector('b').textContent));
    check(JSON.stringify(m) === JSON.stringify(YEDI), 'Menü: talimattaki 7 ana menü, aynı sırayla', m);
    const acilan = [];
    for (let i = 0; i < m.length; i++) {
      await page.evaluate(() => window.__hisar.showView('menu')); await sleep(100);
      await page.click(`#v-menu .k-liste button:nth-child(${i + 1})`); await sleep(180);
      acilan.push(await page.evaluate(() => window.__hisar.curView));
    }
    check(JSON.stringify(acilan) === JSON.stringify(['merkez', 'kamera', 'sensor', 'alistirma', 'gecmis', 'cihaz', 'ayarlar']), 'Menüdeki her satır kendi ekranını açıyor', acilan);

    section('Kontrol Merkezi ve Cihaz Yönetimi: sensör durumu kendiliğinden güncelleniyor; hızlı başlat; Kamera');
    await page.evaluate(() => window.__hisar.showView('merkez')); await sleep(200);
    const t0 = await page.evaluate(() => document.querySelector('#mzTiles .k-tile').innerText);
    await page.evaluate(() => window.__hisar.selectSource('sensor', true));
    await page.waitForFunction(() => window.__hisar.ble.st === 'bagli' && window.__hisar.ble.recv > 100, null, { timeout: 10000 }).catch(() => {});
    await sleep(1500);
    const t1 = await page.evaluate(() => ({ v: window.__hisar.curView, t: document.querySelector('#mzTiles .k-tile').innerText }));
    check(t0.includes('Bağlı değil') && t1.v === 'merkez' && t1.t.includes('Bağlı') && !t1.t.includes('değil') && /Pil %\d+/.test(t1.t),
      'Sensör kutusu bağlanınca kendiliğinden "Bağlı · Pil %…" oluyor', { t0, t1 });
    await page.click('.nav button[data-view="cihaz"]'); await sleep(250);
    const c = await page.evaluate(() => ({ kv: (document.querySelector('#v-cihaz .k-kv') || {}).innerText || '', bag: document.getElementById('cyBag').textContent }));
    check(/Pil\s*%\d+/.test(c.kv) && /Yazılım\s*\d+/.test(c.kv) && /Sinyal/.test(c.kv) && c.bag === 'Bağlantıyı kes', 'Cihaz Yönetimi: pil, yazılım, sinyal ve "Bağlantıyı kes"', c);
    await page.click('#cyBag'); await sleep(700);
    const c2 = await page.evaluate(() => ({ st: window.__hisar.ble.st, bag: document.getElementById('cyBag').textContent, rozet: document.querySelector('#v-cihaz .k-rozet').textContent }));
    check(c2.st === 'off' && c2.bag === 'Bağlan' && /Bağlı değil/.test(c2.rozet), '"Bağlantıyı kes": sensör ayrıldı, ekran kendiliğinden "Bağlan"a döndü', c2);
    await page.evaluate(() => window.__hisar.showView('merkez')); await sleep(200);
    const d = await page.evaluate(() => document.querySelector('#v-merkez .k-btn.ana').dataset.mzd);
    await page.click('#v-merkez .k-btn.ana'); await sleep(300);
    const o = await page.evaluate(() => ({ v: window.__hisar.curView, d: window.__hisar.cur.sess && window.__hisar.cur.sess.drill }));
    await page.click('#sessBack'); await sleep(250);
    const geri = await page.evaluate(() => window.__hisar.curView);
    check(o.v === 'oturum' && o.d === d && geri === 'merkez', 'Hızlı başlat alıştırmayı açıyor; geri tuşu Kontrol Merkezi\'ne dönüyor', { o, d, geri });
    await page.evaluate(() => window.__hisar.showView('kamera')); await sleep(150);
    await page.click('#kmAc'); await sleep(250);
    const k = await page.evaluate(() => ({ t: document.getElementById('pgTitle').textContent, p: window.__hisar.pages.length }));
    await page.click('#pgBack'); await sleep(200);
    const kv = await page.evaluate(() => ({ v: window.__hisar.curView, vis: !document.getElementById('v-kamera').hidden }));
    check(k.p === 1 && /Lazer/.test(k.t) && kv.v === 'kamera' && kv.vis, 'Kamera: puanlama ayarları açılıyor, geri tuşu Kamera\'ya dönüyor', { k, kv });
    check(!errs.length, 'Sayfa hatası yok', errs.slice(0, 5));
    await ctx.close();
  }

  section('Tablet, bilgisayar ve yatay telefon: menü yerleşimi, 8 ana ekranda taşma yok');
  for (const [ad, vp, genis] of [['Bilgisayar 1280×800', { width: 1280, height: 800 }, true], ['Tablet yatay 1180×820', { width: 1180, height: 820 }, true],
    ['Tablet dikey 820×1180', { width: 820, height: 1180 }, false], ['Telefon yatay 844×390', { width: 844, height: 390 }, false], ['Küçük telefon 360×640', { width: 360, height: 640 }, false]]) {
    const { ctx, page, errs } = await openApp(browser, { port: PORT, viewport: vp });
    const nav = await page.evaluate(gorunur);
    const nr = await page.evaluate(() => { const r = document.getElementById('nav').getBoundingClientRect(); return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) }; });
    if (genis) check(JSON.stringify(nav.map(n => n.t)) === JSON.stringify(YEDI) && nr.x === 0 && nr.h >= vp.height - 2 && nr.w < 300 && nav.every(n => n.h >= 44), `${ad}: solda 7 ana menü`, { nav: nav.map(n => n.t), nr });
    else check(nav.length === 5 && nr.y + nr.h >= vp.height - 2 && nr.w >= Math.min(vp.width, 620) - 2, `${ad}: altta 5 düğmeli menü`, { nav: nav.map(n => n.t), nr });
    const bad = {};
    for (const v of ANA) { await page.evaluate(v => window.__hisar.showView(v), v); await sleep(200); const t = await page.evaluate(tasma); if (t.length) bad[v] = t; }
    check(!Object.keys(bad).length, `${ad}: 8 ana ekranın hiçbirinde yana taşma yok`, bad);
    if (genis) {
      await page.click('.nav button[data-view="kamera"]'); await sleep(200);
      const s = await page.evaluate(() => ({ v: window.__hisar.curView, sel: document.querySelector('.nav [aria-selected="true"]').dataset.view, w: Math.round(document.getElementById('v-kamera').getBoundingClientRect().width) }));
      check(s.v === 'kamera' && s.sel === 'kamera' && s.w <= 980, `${ad}: sol menüden Kamera açılıyor, seçili görünüyor`, s);
    }
    check(!errs.length, `${ad}: sayfa hatası yok`, errs.slice(0, 5));
    await ctx.close();
  }

  section('Çevrimdışı göstergesi');
  {
    const { ctx, page, errs } = await openApp(browser, { port: PORT });
    const g0 = await page.evaluate(() => document.getElementById('netBar').hidden);
    await ctx.setOffline(true); await sleep(300);
    const g1 = await page.evaluate(() => ({ h: document.getElementById('netBar').hidden, t: document.getElementById('netBar').innerText, y: Math.round(document.getElementById('netBar').getBoundingClientRect().height) }));
    await page.evaluate(() => window.__hisar.showView('menu')); await sleep(150);
    const mn = await page.evaluate(() => document.querySelector('#v-menu .k-kart .k-rozet').textContent);
    await ctx.setOffline(false); await sleep(300);
    const g2 = await page.evaluate(() => ({ h: document.getElementById('netBar').hidden, mn: document.querySelector('#v-menu .k-kart .k-rozet').textContent }));
    check(g0 && !g1.h && g1.y > 20 && /Çevrimdışı/.test(g1.t) && /Çevrimdışı/.test(mn) && g2.h && /İnternet var/.test(g2.mn),
      'İnternet kesilince menünün üstünde "Çevrimdışı" çıkıyor, gelince kayboluyor; Menü\'de de durum yazıyor', { g0, g1, mn, g2 });
    check(!errs.length, 'Sayfa hatası yok', errs.slice(0, 5));
    await ctx.close();
  }

  section('Yazı boyutu (en az 14 px), dokunma alanları, Türkçe');
  {
    const { ctx, page, errs } = await openApp(browser, { port: PORT, init: [FAKE] });
    const kucuk = {}; let metin = '';
    for (const v of ANA) { await page.evaluate(v => window.__hisar.showView(v), v); await sleep(200); const o = await page.evaluate(kucukYazi); if (o.length) kucuk[v] = o.slice(0, 5); metin += await page.evaluate(() => document.querySelector('main').innerText); }
    const keys = ['gelismis', 'montaj', 'algilama', 'gorunum', 'veri', 'uygulama', 'program', 'ses', 'silah', 'profil', 'lazer', 'saat'];
    for (const k of keys) { await page.evaluate(k => window.__hisar.openSettings(k), k); await sleep(220); const o = await page.evaluate(kucukYazi); if (o.length) kucuk['ayar ' + k] = o.slice(0, 5); metin += await page.evaluate(() => document.querySelector('main').innerText); }
    await page.evaluate(() => { const s = window.__hisar.sessions.find(x => x.sample); if (s) window.__hisar.openReview(s); });
    for (const sub of ['skor', 'grafik', 'iz', 'ozet']) { await page.evaluate(s => window.__hisar.setSub(s), sub); await sleep(220); const o = await page.evaluate(kucukYazi); if (o.length) kucuk['oturum ' + sub] = o.slice(0, 5); }
    check(!Object.keys(kucuk).length, `8 ana ekran, ${keys.length} ayar sayfası ve oturum sekmelerinde 14 px'ten küçük yazı yok (grafiklerin içi hariç)`, kucuk);
    const kisa = await page.evaluate(() => { const o = [];
      for (const v of ['merkez', 'cihaz', 'kamera', 'menu']) { window.__hisar.showView(v);
        document.querySelectorAll('#v-' + v + ' button').forEach(b => { const r = b.getBoundingClientRect(); if (r.height < 44) o.push(v + ': ' + b.textContent.trim().slice(0, 20) + ' ' + Math.round(r.height)); }); }
      return o; });
    check(!kisa.length, 'Yeni ekranlardaki bütün düğmeler en az 44 px yüksek', kisa);
    const ing = metin.match(/Safe Space|Shot Timer|\bDrill\b|DRILL/g);
    const dr = await page.evaluate(() => window.__hisar.DR.find(d => d.id === 'safespace').ad);
    check(!ing && dr === 'Kaygısız Deneme', 'Ekranlarda İngilizce ad kalmadı (Safe Space → Kaygısız Deneme, Drill → Ayar)', { ing, dr });
    check(!errs.length, 'Sayfa hatası yok', errs.slice(0, 5));
    await ctx.close();
  }

  section(`Sürüm ${V28.surum}'de kaydedilen oturum ve ayarlar yeni sürümde aynen duruyor`);
  {
    const { ctx, page, errs } = await openApp(browser, { port: PORT, storage: V28.depo });
    const ids = JSON.parse(V28.depo['hisarTetik.v2.meta']).ids;
    const eski = ids.map(id => JSON.parse(V28.depo['hisarTetik.v2.s.' + id]));
    const r = await page.evaluate(ids => { const H = window.__hisar; return {
      ids: H.sessions.filter(s => !s.sample).map(s => s.id).sort(), n: ids.map(id => (H.sessions.find(s => s.id === id) || { shots: [] }).shots.length),
      sc: ids.map(id => (H.sessions.find(s => s.id === id) || { shots: [] }).shots.map(q => q.sc)), hand: H.S.hand, prof: H.S.profiles[0].ad,
      depo: ids.every(id => !!localStorage.getItem('hisarTetik.v2.s.' + id)) }; }, ids);
    check(JSON.stringify(r.ids) === JSON.stringify(ids.slice().sort()) && JSON.stringify(r.n) === JSON.stringify(eski.map(s => s.shots.length)) &&
      JSON.stringify(r.sc) === JSON.stringify(eski.map(s => s.shots.map(q => q.sc))) && r.depo,
      `${ids.length} oturum aynı atış sayıları ve skorlarıyla yükleniyor; depodaki kayıtlar silinmedi`, { r, beklenen: eski.map(s => s.shots.length) });
    check(r.hand === 'L' && r.prof === '1. Takım Atıcı', 'Eski ayarlar (sol el, profil adı) korunuyor', { hand: r.hand, prof: r.prof });
    await page.evaluate(() => window.__hisar.showView('gecmis')); await sleep(250);
    const liste = await page.evaluate(() => document.querySelectorAll('#sessList [data-id]').length);
    await page.evaluate(() => window.__hisar.showView('merkez')); await sleep(200);
    const son = await page.evaluate(() => { const H = window.__hisar, s = H.sessions.filter(x => !x.sample).sort((a, b) => b.date - a.date)[0];
      return { kart: document.querySelector('#v-merkez [aria-labelledby="mzSo"]').innerText, n: s.shots.filter(q => !q.x || (!q.x.erken && q.x.karar !== 'erken')).length }; });
    check(liste === ids.length && /Serbest Antrenman/.test(son.kart) && new RegExp('\\b' + son.n + '\\s*atış').test(son.kart.replace(/\n/g, ' ')),
      'Eski oturumlar Analiz listesinde; en yenisi Kontrol Merkezi\'nde "Son oturum" olarak görünüyor', { liste, son });
    check(!errs.length, 'Sayfa hatası yok', errs.slice(0, 5));
    await ctx.close();
  }

  await browser.close(); srv.close();
  process.exit(finish('Arayüz testi') ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
