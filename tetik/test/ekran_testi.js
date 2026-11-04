// Ekran testi: uygulamanın BÜTÜN ekranları iki telefon boyunda (360×640 küçük Android, 430×932 büyük iPhone) tek tek açılır.
// Her ekranda: sayfa hatası yok, ekranda "undefined / NaN / null / [object Object]" yazısı yok, hiçbir öge ekrandan taşmıyor,
// her ⓘ açıklaması açılıyor ve dolu, her alıştırma, her hata sayfası, her ders, oturum sekmeleri ve açılış ekranı çalışıyor.
'use strict';
const { serve, check, section, finish, openApp, chromium, sleep } = require('./ortak');
const PORT = 8800;

// ekran denetimi: kötü kelimeler ve yatay taşma (yatay kaydırılan kapsayıcıların içi hariç)
const AUDIT = () => {
  const W = innerWidth, over = [];
  const txt = document.body.innerText || '';
  const words = txt.match(/\b(undefined|NaN|null|Infinity)\b|\[object Object\]/g) || [];
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    if (!el.offsetParent && cs.position !== 'fixed') continue;
    const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) continue;
    if (r.right <= W + 1 && r.left >= -1) continue;
    let p = el.parentElement, inScroll = false;
    while (p && p !== document.body) { const c = getComputedStyle(p); if (/(auto|scroll|hidden)/.test(c.overflowX) && p.scrollWidth > p.clientWidth + 1) { inScroll = true; break; } if (/(hidden|clip)/.test(c.overflowX) || /(hidden|clip)/.test(c.overflow)) { const pr = p.getBoundingClientRect(); if (pr.right <= W + 1 && pr.left >= -1) { inScroll = true; break; } } p = p.parentElement; }
    if (!inScroll) over.push(`${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${typeof el.className === 'string' && el.className ? '.' + el.className.split(' ')[0] : ''} ${Math.round(r.left)}..${Math.round(r.right)}`);
  }
  return { words: [...new Set(words)], over: over.slice(0, 4), docW: document.documentElement.scrollWidth, W };
};

async function crawl(browser, vp) {
  const { ctx, page, errs } = await openApp(browser, { port: PORT, viewport: vp, keepSplash: true });
  const fails = []; let screens = 0, infos = 0, emptyInfo = [];
  const audit = async label => { await sleep(120); const a = await page.evaluate(AUDIT); screens++;
    if (a.words.length || a.over.length || a.docW > a.W + 1) fails.push({ ekran: label, ...a }); };
  const H = (fn, arg) => page.evaluate(fn, arg);
  const closeSheet = () => H(() => { const c = document.querySelector('#sheet [data-close]'); if (c && !document.querySelector('#sheet').hidden) c.click(); });
  // ⓘ düğmeleri: sırayla aç, metin dolu mu
  const infoAll = async label => { const n = await H(() => [...document.querySelectorAll('[data-info]')].filter(b => b.offsetParent).length);
    for (let i = 0; i < n; i++) { const t = await H(i => { const b = [...document.querySelectorAll('[data-info]')].filter(b => b.offsetParent)[i]; if (!b) return null; b.click();
        const sh = document.querySelector('#sheet'); return sh && !sh.hidden ? (document.querySelector('#sheetBody').innerText || '') : ''; }, i);
      infos++; if (!t || t.trim().length < 25) emptyInfo.push(label + ' #' + i); await closeSheet(); } };

  // denetimin kendisi çalışıyor mu: bilerek taşan bir öge ve "NaN" yazısı eklenir, yakalanmalı
  const probe = await H(a => { const d = document.createElement('div'); d.id = 'denetimDeneme'; d.style.cssText = 'position:relative;width:' + (innerWidth + 80) + 'px;height:20px'; d.textContent = 'skor NaN';
    document.body.appendChild(d); const r = (new Function('return ' + a))()(); d.remove(); return r; }, AUDIT.toString());
  const selfOk = probe.words.includes('NaN') && (probe.over.length > 0 || probe.docW > probe.W + 1);
  await audit('açılış ekranı');
  await H(() => { window.__hisar.hideSplash(); window.__hisar.selectSource('demo', true); }); await sleep(800);
  for (const v of ['alistirma', 'gecmis', 'sensor', 'ayarlar', 'gruplar']) { await H(v => window.__hisar.showView(v), v); await audit('görünüm ' + v); await infoAll('görünüm ' + v); }
  await H(() => { window.__hisar.showView('alistirma'); window.__hisar.cur.moreDrills = true; window.__hisar.showView('alistirma'); }); await audit('Diğer antrenmanlar açık'); await H(() => { window.__hisar.cur.moreDrills = false; });
  const keys = ['gelismis', 'baglanti', 'montaj', 'algilama', 'gorunum', 'veri', 'uygulama', 'program', 'ses', 'silah', 'profil'];
  for (const k of keys) { await H(k => window.__hisar.openSettings(k), k); await sleep(250); await audit('ayar ' + k); await infoAll('ayar ' + k); }
  await H(() => window.__hisar.showView('alistirma'));
  const drills = await H(() => window.__hisar.DR.map(d => d.id));
  for (const d of drills) { await H(d => { window.__hisar.showView('alistirma'); window.__hisar.openDrill(d); }, d); await audit('alıştırma ' + d); }
  const causes = await H(() => Object.keys(window.__hisar.CAUSES));
  for (const c of causes) { await H(c => window.__hisar.openCause(c), c); await audit('hata ' + c); await H(() => window.__hisar.popPage()); }
  await H(() => window.__hisar.showView('alistirma')); await sleep(200);
  const nl = await H(() => document.querySelectorAll('[data-lesson]').length);
  for (let i = 0; i < nl; i++) { await H(i => { window.__hisar.showView('alistirma'); document.querySelectorAll('[data-lesson]')[i].click(); }, i); await audit('ders ' + i); await H(() => window.__hisar.popPage()); }
  // örnek oturum: bütün sekmeler
  await H(() => { const s = window.__hisar.sessions.find(x => x.sample); if (s) window.__hisar.openReview(s); });
  for (const sub of ['skor', 'grafik', 'iz', 'ozet']) { await H(sub => window.__hisar.setSub(sub), sub); await audit('oturum ' + sub); }
  await ctx.close();
  return { fails, screens, infos, emptyInfo, errs, drills: drills.length, causes: causes.length, lessons: nl, selfOk };
}

(async () => {
  const srv = await serve(PORT); const browser = await chromium.launch();
  for (const vp of [{ width: 360, height: 640 }, { width: 430, height: 932 }]) {
    section(`Telefon ${vp.width}×${vp.height}`);
    const r = await crawl(browser, vp);
    console.log(`  ${r.screens} ekran · ${r.drills} alıştırma · ${r.causes} hata sayfası · ${r.lessons} ders · ${r.infos} ⓘ açıklaması`);
    check(r.selfOk, 'Denetim çalışıyor: bilerek eklenen taşan öge ve "NaN" yazısı yakalandı');
    check(r.screens === 11 + r.drills + r.causes + r.lessons + 11 && r.drills >= 15 && r.causes === 15 && r.lessons >= 3, `Bütün ekranlar açıldı (${r.screens})`, { screens: r.screens, drills: r.drills, causes: r.causes, lessons: r.lessons });
    check(!r.fails.some(f => f.words.length), 'Hiçbir ekranda "undefined / NaN / null" yazısı yok', r.fails.filter(f => f.words.length).slice(0, 5));
    check(!r.fails.some(f => f.over.length || f.docW > f.W + 1), 'Hiçbir öge ekrandan taşmıyor', r.fails.filter(f => f.over.length || f.docW > f.W + 1).slice(0, 5));
    check(r.infos >= 15 && !r.emptyInfo.length, `Her ⓘ açıklaması açılıyor ve dolu (${r.infos})`, r.emptyInfo);
    check(!r.errs.length, 'Sayfa hatası yok', r.errs.slice(0, 5));
  }
  await browser.close(); srv.close();
  process.exit(finish('Ekran testi') ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
