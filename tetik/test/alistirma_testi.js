// Bütün özellikler testi (sahte sensörle, gerçek bağlantı akışı):
// 13 alıştırmanın hepsi sensörden gelen atışlarla (bip/komutlara göre zamanlanmış), her birinin kendi ölçümü,
// sonuç ekranı, rapor görseli, geçmişe kayıt; kurulum sihirbazları (kalibrasyon, yön testi, eşiği öğren);
// sade Ayarlar ana sayfası (silah, el, atış tipi, zorluk, ses: kalıcı), ⓘ açıklamaları; geçmiş ve silme;
// sayfayı yeniden açınca kalıcılık; 360 px genişlikte taşma.
'use strict';
const { serve, check, section, finish, openApp, chromium, fs, path, sleep } = require('./ortak');
const PORT = 8787;
const FAKE = fs.readFileSync(path.join(__dirname, 'sahte_sensor.js'), 'utf8');

async function waitFor(page, fn, ms, arg) { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await page.evaluate(fn, arg)) return true; await sleep(100); } return false; }
async function connected(browser, opts = {}) {
  const r = await openApp(browser, Object.assign({ port: PORT, init: [FAKE] }, opts));
  await r.page.click('#srcSensor');
  await waitFor(r.page, () => window.__hisar.ble.st === 'bagli' && window.__hisar.ble.recv > 200, 8000);
  await sleep(1800);
  return r;
}

// Sayfa içinde alıştırmayı sürer: bip/komut geldikçe sensöre atış ekler, bitince sonucu döndürür
const DRIVE = async ({ id, set, maxMs, stopAfter }) => {
  const H = window.__hisar, F = window.__fake;
  Object.assign(H.S, set || {});
  H.openDrill(id); H.startRun();
  const r = H.cur.run; if (!r) return { err: 'oturum başlamadı' };
  const rnd = () => (Math.random() - 0.5) * 0.4;
  const fire = (ms, o) => F.addShot(F.head + Math.round(ms / 5), Object.assign({ dx: rnd(), dy: rnd() }, o || {}));
  let lastGo = null, lastBeat = 0, last = -1e9, goes = 0, types = [];
  const t0 = performance.now();
  await new Promise(res => {
    const iv = setInterval(() => {
      const st = r.st || {}, el = performance.now() - t0;
      if (['zamanlayici', 'par', 'kilif', 'karar'].includes(id)) {
        if (st.goT != null && st.goT !== lastGo) { lastGo = st.goT; goes++;
          if (id === 'karar') types.push(st.type);
          if (!(id === 'karar' && st.type === 'dur')) {
            if (id === 'kilif') F.addMove(F.head + 40, 40, [90, 0, 0]);        // 200 ms sonra çekiş hareketi
            fire(id === 'par' ? 700 : id === 'kilif' ? 900 : 500);
          } }
      } else if (id === 'ritim') { if (st.beats && st.beats.length !== lastBeat) { lastBeat = st.beats.length; fire(40); } }
      else if (id === 'kiyas20') { if (st.phase === 'go' && el - last > 1000) { last = el; fire(100); } }
      else if (id === 'sarjor') { if (el - last > 1800) { last = el; fire(100); } }
      else if (el - last > 1300) { last = el; fire(100, id === 'geritepme' ? { live: true } : {}); }
      const enough = stopAfter && r.sess.shots.length >= stopAfter;
      if (!r.active || el > maxMs || enough) { clearInterval(iv); res(); }
    }, 40);
  });
  const auto = !r.active;
  if (r.active) H.stopRun(false);
  await new Promise(res => setTimeout(res, 1400));
  const s = H.cur.sess, sheet = document.getElementById('sheet').hidden ? '' : document.getElementById('sheetBody').textContent;
  let rep = null; try { const c = await H.buildReport(s); rep = { w: c.width, h: c.height }; } catch (e) { rep = { err: String(e) }; }
  return { auto, goes, types, n: s.shots.length, src: s.src, saved: H.sessions.includes(s), hm: s.handMode, extra: s.extra, sheet,
    shots: s.shots.map(q => ({ sc: q.sc, x: q.x, pg: q.pg, ri: q.ri, rc: q.rc })), rep };
};

const DRILLS = [
  ['serbest', {}, 9000, 6], ['degerlendirme', {}, 20000], ['dayaniklilik', { dayanik: 10 }, 20000], ['atiseli', {}, 7000, 4], ['destekeli', {}, 7000, 4],
  ['zamanlayici', {}, 22000], ['par', { par: 2.0 }, 22000], ['kiyas20', {}, 30000], ['ritim', { ritimShots: 5, ritim: 1.5 }, 20000], ['kilif', {}, 24000],
  ['karar', {}, 22000], ['sarjor', {}, 11000], ['geritepme', { mode: 'gercek' }, 7000, 4],
];

(async () => {
  const srv = await serve(PORT); const browser = await chromium.launch();

  section('13 alıştırma, sensörden gelen atışlarla (aynı anda 13 sayfa)');
  {
    const runs = await Promise.all(DRILLS.map(async ([id, set, maxMs, stopAfter]) => {
      const { ctx, page, errs } = await connected(browser);
      const res = await page.evaluate(DRIVE, { id, set, maxMs, stopAfter });
      await ctx.close();
      return { id, res, errs };
    }));
    const R = Object.fromEntries(runs.map(x => [x.id, x.res]));
    const allErrs = runs.flatMap(x => x.errs.map(e => x.id + ': ' + e));
    for (const { id, res } of runs) {
      const ok = !res.err && res.src === 'sensor' && res.saved && res.n > 0 && !/NaN|undefined/.test(res.sheet) && res.rep && res.rep.w === 1080;
      check(ok, `${id.padEnd(13)} ${res.n} atış · geçmişe kaydedildi · sonuç ekranı ve rapor sorunsuz`, ok ? undefined : { err: res.err, n: res.n, saved: res.saved, src: res.src, rep: res.rep, sheet: (res.sheet || '').slice(0, 120) });
    }
    const v = id => R[id].shots;
    check(R.serbest.n >= 6, 'Serbest: atışlar sayılıyor', R.serbest.n);
    check(R.degerlendirme.auto && R.degerlendirme.n === 10 && /Seviye/i.test(R.degerlendirme.sheet), 'Değerlendirme: 10 atışta kendiliğinden bitti, seviye gösterildi', { n: R.degerlendirme.n, auto: R.degerlendirme.auto });
    check(R.dayaniklilik.auto && R.dayaniklilik.n === 10, 'Dayanıklılık: ayarlanan 10 atışta bitti', { n: R.dayaniklilik.n });
    check(R.atiseli.hm === 'strong' && R.destekeli.hm === 'weak', 'Tek el alıştırmaları el kipini kaydetti (atış eli / destek eli)', [R.atiseli.hm, R.destekeli.hm]);
    const rz = v('zamanlayici').filter(q => q.x.react != null).map(q => q.x.react);
    check(rz.length >= 2 && rz.every(t => t > 380 && t < 760), 'Atış zamanlayıcısı: bipten sonraki ilk atış süresi doğru (~0,5 sn)', rz);
    const pz = v('par').filter(q => q.x.parOk != null);
    check(pz.length >= 1 && pz.every(q => q.x.parOk === true && q.x.react > 550 && q.x.react < 900), 'Par ölçer: par süresi içindeki atış başarılı sayıldı (~0,7 sn)', pz.map(q => q.x.react));
    const kz = v('kiyas20');
    check(R.kiyas20.auto && kz.length >= 15 && kz.length <= 22, '20 saniyelik kıyaslama: süre bitince kendiliğinden durdu, ~saniyede bir atış sayıldı', kz.length);
    const ro = v('ritim').filter(q => q.x.offset != null).map(q => q.x.offset);
    check(R.ritim.auto && ro.length === 5 && ro.every(o => Math.abs(o) < 160), 'Ritmik: 5 atışta bitti, her atış bipe yakın (sapma < 0,16 sn)', ro);
    const kf = v('kilif').filter(q => q.x.react != null);
    check(kf.length >= 1 && kf.every(q => q.x.move != null && q.x.move > 120 && q.x.move < 420 && q.x.react > 750 && q.x.react < 1150), 'Kılıf çekiş: hareket başlama (~0,2 sn) ve ilk atış (~0,9 sn) ölçüldü', kf.map(q => [q.x.move, q.x.react]));
    const kr = v('karar'), ates = R.karar.types.filter(t => t === 'ates').length;
    check(kr.length === ates && kr.every(q => q.x.karar === 'dogru'), 'Karar tatbikatı: yeşilde ateş doğru, kırmızıda atış yok', { atis: kr.length, ates, types: R.karar.types });
    const sz = v('sarjor').filter(q => q.x.change != null).map(q => q.x.change);
    check(sz.length >= 2 && sz.every(t => t > 1500 && t < 2200), 'Şarjör değiştirme: iki atış arası süre ölçüldü (~1,8 sn)', sz);
    const gt = v('geritepme');
    check(gt.length >= 4 && gt.every(q => q.pg > 8 && q.x.sat), 'Geri tepme: gerçek atış tepmesi, sınır işareti', gt.map(q => [q.pg, q.x.sat]));
    check(allErrs.length === 0, 'Hiçbir sayfada hata yok', allErrs.slice(0, 5));
  }

  section('Kurulum sihirbazları: kalibrasyon, yön testi, eşiği öğren');
  {
    const { ctx, page, errs } = await connected(browser);
    await page.evaluate(() => window.__hisar.openSettings('montaj')); await sleep(400);
    await page.click('#wCal'); await sleep(3600);
    const cal = await page.evaluate(() => ({ msg: document.getElementById('calMsg').textContent, bias: window.__hisar.S.bias['sensor:HISAR-SENSOR'] }));
    check(/Tamam/.test(cal.msg) && cal.bias && Math.abs(cal.bias[0] - 0.4) < 0.05 && Math.abs(cal.bias[1] + 0.3) < 0.05, 'Kalibrasyon: 3 saniyede jiroskop sapması ölçüldü ve kaydedildi (0,4 / −0,3 / 0,2)', cal);
    await page.evaluate(() => { const c = document.querySelector('#sheet [data-close]'); if (c) c.click(); window.__hisar.openSettings('montaj'); }); await sleep(300);
    await page.click('#wAxis'); await sleep(1700);                                          // 1/3: düz ve hareketsiz
    await page.evaluate(() => { const F = window.__fake; F.addMove(F.head + 10, 60, [60, 0, 0]); F.addMove(F.head + 70, 60, [-60, 0, 0]); });   // 2/3: namlu yukarı, aşağı
    await sleep(1300);
    await page.evaluate(() => { const F = window.__fake; F.addMove(F.head + 10, 60, [0, 0, -60]); });   // 3/3: sağa çevir
    const ax = await waitFor(page, () => /Tamam/.test((document.getElementById('axMsg') || {}).textContent || '') || !!window.__hisar.S.mount.sensor.B, 4000);
    const m = await page.evaluate(() => window.__hisar.S.mount.sensor);
    check(ax && m.B && Math.abs(Math.abs(m.B[1]) - 1) < 0.05, 'Yön testi: namlu ekseni bulundu ve kaydedildi (Y ekseni)', m);
    await sleep(1600);
    const md = await page.evaluate(() => { window.__hisar.openSettings(null); return document.getElementById('md-montaj').textContent; });
    check(/yön testi yapıldı/.test(md), 'Ayarlar ana sayfasında "yön testi yapıldı"', md);
    await page.evaluate(() => window.__hisar.openSettings('algilama')); await sleep(300);
    await page.click('#wThr'); await sleep(500);
    await page.evaluate(() => { const F = window.__fake, h = F.head; [100, 300, 500].forEach(o => F.addShot(h + o, { spike: 2.4 })); });
    const learned = await waitFor(page, () => /Yeni eşik/.test((document.getElementById('lrMsg') || {}).textContent || ''), 6000);
    const thr = await page.evaluate(() => window.__hisar.S.thr.sensor.kuru);
    check(learned && thr > 1.0 && thr < 1.4, 'Eşiği öğren: 3 tetikten eşik hesaplandı ve kaydedildi (~1,2 g)', thr);
    check(errs.length === 0, 'Sayfa hatası yok', errs);
    await ctx.close();
  }

  section('Sade Ayarlar: tek sayfada silah, el, atış tipi, zorluk, ses; ⓘ açıklamaları; Gelişmiş');
  {
    const { ctx, page, errs } = await connected(browser);
    await page.evaluate(() => window.__hisar.openSettings(null)); await sleep(300);
    const ui = await page.evaluate(() => ({ segs: ['sWeapon', 'sHand', 'sMode', 'sDiff', 'sSound'].every(id => !!document.getElementById(id)),
      rows: Array.from(document.querySelectorAll('#v-ayarlar .mi .mt')).map(e => e.textContent), sensor: document.getElementById('rtName').textContent,
      infos: document.querySelectorAll('#v-ayarlar .qs [data-info]').length }));
    check(ui.segs && ui.sensor === 'HISAR-SENSOR' && ui.infos === 5, 'Ana sayfada sensör satırı ve 5 hızlı ayar (her biri ⓘ ile)', ui);
    check(JSON.stringify(ui.rows) === JSON.stringify(['Montaj ve kalibrasyon', 'Atış algılama', 'Alıştırma süreleri', 'Görünüm', 'Veriler', 'Uygulama']), 'Montaj ve Gelişmiş listesi (6 satır)', ui.rows);
    await page.click('#sWeapon [data-v="rifle"]'); await page.click('#sHand [data-v="L"]'); await page.click('#sMode [data-v="co2"]'); await page.click('#sDiff [data-v="zor"]'); await page.click('#sSound [data-v="kapali"]');
    await page.fill('#sName', 'MPT-76');
    const st = await page.evaluate(() => { const S = window.__hisar.S; return { w: S.weapon, h: S.hand, m: S.mode, d: S.diff, s: S.sound, n: S.weaponName, saved: JSON.parse(localStorage.getItem('hisarTetik.v2.meta')).settings }; });
    check(st.w === 'rifle' && st.h === 'L' && st.m === 'co2' && st.d === 'zor' && st.s === 'kapali' && st.n === 'MPT-76' && st.saved.weapon === 'rifle' && st.saved.mode === 'co2' && st.saved.weaponName === 'MPT-76', 'Seçimler uygulandı ve kaydedildi', st);
    const chips = await page.evaluate(() => { window.__hisar.showView('alistirma'); return document.getElementById('profileBtn').textContent; });
    check(/Tüfek/.test(chips) && /MPT-76/.test(chips) && /Sol el/.test(chips) && /CO2/.test(chips) && /Zor/.test(chips), 'Ana ekrandaki profil satırı güncellendi', chips);
    await page.evaluate(() => window.__hisar.openSettings(null)); await sleep(200);
    await page.click('#v-ayarlar [data-info="tip"]'); await sleep(200);
    const info = await page.evaluate(() => ({ t: document.getElementById('sheetTitle').textContent, b: document.getElementById('sheetBody').textContent }));
    check(info.t === 'Atış tipi' && /Kuru tetik/.test(info.b) && /CO2/.test(info.b), 'ⓘ açıklaması pencerede açılıyor', info);
    await page.evaluate(() => { const c = document.querySelector('#sheet [data-close]'); if (c) c.click(); window.__hisar.openSettings('atici'); }); await sleep(200);
    const back = await page.evaluate(() => ({ p: window.__hisar.setPage, has: !!document.getElementById('sWeapon') }));
    check(back.p == null && back.has, 'Eski "Atıcı ve silah" bağlantısı ana ayarlara açılıyor', back);
    // bütün alt sayfalar açılıyor, ⓘ'ler çalışıyor
    const pages = ['baglanti', 'montaj', 'algilama', 'alistirma', 'gorunum', 'veri', 'uygulama'];
    const bad = [];
    for (const p of pages) { const r = await page.evaluate(p => { window.__hisar.openSettings(p); const v = document.getElementById('v-ayarlar'); return { h: v.querySelector('.page-h h2').textContent, infos: Array.from(v.querySelectorAll('[data-info]')).map(b => b.dataset.info) }; }, p);
      for (const k of r.infos) { await page.click(`#v-ayarlar [data-info="${k}"]`); await sleep(80); const t = await page.evaluate(() => document.getElementById('sheetBody').textContent.length);
        if (t < 40) bad.push(p + ':' + k); await page.evaluate(() => { const c = document.querySelector('#sheet [data-close]'); if (c) c.click(); }); } }
    check(bad.length === 0, 'Bütün alt sayfalar açılıyor, içlerindeki ⓘ açıklamaları dolu', bad);
    check(errs.length === 0, 'Sayfa hatası yok', errs);
    await ctx.close();
  }

  section('Geçmiş, inceleme, silme; sayfa yeniden açılınca kalıcılık');
  {
    const { ctx, page, errs } = await connected(browser);
    for (const id of ['serbest', 'degerlendirme']) await page.evaluate(DRIVE, { id, set: {}, maxMs: 6000, stopAfter: 3 });
    await page.evaluate(() => { const c = document.querySelector('#sheet [data-close]'); if (c) c.click(); window.__hisar.showView('gecmis'); }); await sleep(500);
    const h = await page.evaluate(() => ({ n: document.querySelectorAll('#sessList [data-id]').length, shots: document.getElementById('hsShots').textContent }));
    check(h.n === 2 && +h.shots >= 6, 'Geçmişte 2 oturum ve atışları', h);
    await page.selectOption('#fDrill', 'serbest'); await sleep(200);
    check(await page.evaluate(() => document.querySelectorAll('#sessList [data-id]').length === 1), 'Alıştırmaya göre süzme');
    await page.click('#sessList [data-id]'); await sleep(300);
    const rv = await page.evaluate(() => ({ v: window.__hisar.cur.review, d: window.__hisar.cur.sess.drill, start: document.getElementById('btnStart').textContent, zero: document.getElementById('btnZero').hidden, trig: document.getElementById('btnTrig').hidden }));
    check(rv.v && rv.d === 'serbest' && /Yeni oturum/i.test(rv.start) && rv.zero && rv.trig, 'Oturum incelemesi açıldı; yalnız "Yeni oturum" ve "Not" görünüyor', rv);
    await page.click('#sessInfo'); await page.click('#iDel'); await page.click('#iYes'); await sleep(300);
    const after = await page.evaluate(() => ({ n: window.__hisar.sessions.filter(s => !s.sample).length, ls: Object.keys(localStorage).filter(k => k.startsWith('hisarTetik.v2.s.')).length }));
    check(after.n === 1 && after.ls === 1, 'Oturum silindi (geçmişten ve depodan)', after);
    // yeniden aç: oturum ve ayarlar duruyor, eşlenmiş sensör bekleniyor
    const st0 = await page.evaluate(() => ({ storage: Object.fromEntries(Object.keys(localStorage).map(k => [k, localStorage.getItem(k)])) }));
    await ctx.close();
    const r2 = await openApp(browser, { port: PORT, init: [FAKE, 'window.__fake.allowGetDevices=true;'], storage: st0.storage });
    const ok = await waitFor(r2.page, () => window.__hisar.ble.st === 'bagli', 8000);
    const p2 = await r2.page.evaluate(() => ({ n: window.__hisar.sessions.filter(s => !s.sample).length, src: window.__hisar.source, last: window.__hisar.S.lastSensor }));
    check(ok && p2.n === 1 && p2.src === 'sensor' && p2.last === 'HISAR-SENSOR', 'Yeniden açılınca oturum ve ayarlar duruyor, sensöre kendiliğinden bağlandı', p2);
    check(errs.length === 0 && r2.errs.length === 0, 'Sayfa hatası yok', errs.concat(r2.errs));
    await r2.ctx.close();
  }

  section('Dar ekran (360 × 640): hiçbir ekranda yana taşma yok');
  {
    const { ctx, page, errs } = await connected(browser, { viewport: { width: 360, height: 640 } });
    await page.evaluate(DRIVE, { id: 'zamanlayici', set: {}, maxMs: 9000 });
    await page.evaluate(() => { const c = document.querySelector('#sheet [data-close]'); if (c) c.click(); });
    // kaydırılabilir/kırpan bir kabın içindekiler (geçmişteki grafik kaydırıcısı, tablolar) taşma sayılmaz
    const over = async () => page.evaluate(() => { const W = window.innerWidth + 1, o = [];
      const clipped = e => { for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) { const ox = getComputedStyle(a).overflowX; if (ox !== 'visible' && a.getBoundingClientRect().right <= W) return true; } return false; };
      document.querySelectorAll('body *').forEach(e => { const r = e.getBoundingClientRect(); if (r.width && r.right > W && getComputedStyle(e).position !== 'fixed' && !clipped(e)) o.push(e.id || String(e.className && e.className.baseVal !== undefined ? e.className.baseVal : e.className) || e.tagName); });
      return o.slice(0, 4); });
    const bad = {};
    for (const v of ['alistirma', 'oturum', 'gecmis', 'dersler']) { await page.evaluate(v => window.__hisar.showView(v), v); await sleep(300); const o = await over(); if (o.length) bad[v] = o; }
    for (const sub of ['grafik', 'iz', 'liste']) { await page.evaluate(s => { window.__hisar.showView('oturum'); window.__hisar.setSub(s); }, sub); await sleep(300); const o = await over(); if (o.length) bad['oturum/' + sub] = o; }
    for (const p of [null, 'baglanti', 'montaj', 'algilama', 'alistirma', 'gorunum', 'veri', 'uygulama']) { await page.evaluate(p => window.__hisar.openSettings(p), p); await sleep(300); const o = await over(); if (o.length) bad['ayarlar/' + p] = o; }
    check(Object.keys(bad).length === 0, 'Ana ekran, oturum (4 görünüm), geçmiş, dersler ve 8 ayar sayfası 360 px\'e sığıyor', bad);
    check(errs.length === 0, 'Sayfa hatası yok', errs);
    await ctx.close();
  }

  await browser.close(); srv.close();
  process.exit(finish('Bütün özellikler testi') ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
