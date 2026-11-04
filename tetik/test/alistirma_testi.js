// Bütün özellikler testi (sahte sensörle, gerçek bağlantı akışı):
// 17 alıştırmanın hepsi sensörden gelen atışlarla (bip/komutlara göre zamanlanmış), her birinin kendi ölçümü,
// oturum özeti, rapor görseli, geçmişe kayıt; kurulum sihirbazları (kalibrasyon, yön testi, eşiği öğren);
// MantisX düzeni: Alıştırma listesi (ELİT, GÜNLÜK MEYDAN OKUMA, ANTREMANLAR, DERSLER), Ayarlar ana sayfası
// (silah, el, atış tipi, montaj yönü/yeri, profil, eğitim programı, sesli geri bildirim, gelişmiş), atış tipleri
// listesi, DRILL ayarları, neden sayfası, gruplar ve atıcılar; geçmiş, süzme, inceleme ve silme;
// sayfayı yeniden açınca kalıcılık; 360 px genişlikte taşma.
'use strict';
const { serve, check, section, finish, openApp, chromium, fs, path, sleep } = require('./ortak');
const PORT = 8787;
const FAKE = fs.readFileSync(path.join(__dirname, 'sahte_sensor.js'), 'utf8');

async function waitFor(page, fn, ms, arg) { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await page.evaluate(fn, arg)) return true; await sleep(100); } return false; }
async function connected(browser, opts = {}) {
  const r = await openApp(browser, Object.assign({ port: PORT, init: [FAKE] }, opts));
  await r.page.evaluate(() => window.__hisar.selectSource('sensor', true));
  await waitFor(r.page, () => window.__hisar.ble.st === 'bagli' && window.__hisar.ble.recv > 200, 8000);
  await sleep(1800);
  return r;
}
const closeSheet = page => page.evaluate(() => { const c = document.querySelector('#sheet [data-close]'); if (c) c.click(); });

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
      if (['zamanlayici', 'par', 'kilif', 'karar', 'surpriz', 'rehine'].includes(id)) {
        if (st.goT != null && st.goT !== lastGo) { lastGo = st.goT; goes++;
          if (id === 'karar') types.push(st.type);
          if (!(id === 'karar' && st.type === 'dur')) {
            if (id === 'kilif' || id === 'rehine') F.addMove(F.head + 40, 40, [90, 0, 0]);        // 200 ms sonra çekiş hareketi
            fire(id === 'par' ? 700 : id === 'kilif' || id === 'rehine' ? 900 : id === 'surpriz' ? 300 : 500, id === 'rehine' ? { dx: 0.02, dy: -0.02 } : {});
          } }
      } else if (id === 'ritim') { if (st.beats && st.beats.length !== lastBeat) { lastBeat = st.beats.length; fire(40); } }
      else if (id === 'kiyas20' || id === 'zamankiyas') { if (st.phase === 'go' && el - last > (id === 'zamankiyas' ? 450 : 1000)) { last = el; fire(100); } }
      else if (id === 'sarjor') { if (el - last > 1800) { last = el; fire(100); } }
      else if (el - last > 1300) { last = el; fire(100, id === 'geritepme' ? { live: true } : {}); }
      const enough = stopAfter && r.sess.shots.length >= stopAfter;
      if (!r.active || el > maxMs || enough) { clearInterval(iv); res(); }
    }, 40);
  });
  const auto = !r.active;
  if (r.active) H.stopRun(false);
  await new Promise(res => setTimeout(res, 1400));
  const s = H.cur.sess, oz = document.getElementById('sv-ozet');
  const sheet = oz && !oz.hidden ? oz.textContent : '';
  let rep = null; try { const c = await H.buildReport(s); rep = { w: c.width, h: c.height }; } catch (e) { rep = { err: String(e) }; }
  return { auto, goes, types, n: s.shots.length, src: s.src, saved: H.sessions.includes(s), safe: !!s.safe, who: s.who, hm: s.handMode, extra: s.extra, sheet, sub: H.cur.sub,
    shots: s.shots.map(q => ({ sc: q.sc, x: q.x, pg: q.pg, ri: q.ri, rc: q.rc })), rep };
};

const DRILLS = [
  ['serbest', {}, 9000, 6], ['safespace', {}, 7000, 4], ['degerlendirme', {}, 20000], ['dayaniklilik', { dayanik: 10 }, 20000], ['atiseli', {}, 7000, 4], ['destekeli', {}, 7000, 4],
  ['zamanlayici', {}, 22000], ['par', { par: 2.0 }, 22000], ['kiyas20', {}, 30000], ['zamankiyas', {}, 15000], ['ritim', { ritimShots: 5, ritim: 1.5 }, 20000], ['kilif', {}, 24000],
  ['surpriz', { dset: { surpriz: { rounds: 3 } } }, 40000], ['rehine', { dset: { rehine: { rounds: 3, zorluk: 'kolay' } } }, 45000],
  ['karar', {}, 22000], ['sarjor', {}, 11000], ['geritepme', { mode: 'gercek' }, 7000, 4],
];

(async () => {
  const srv = await serve(PORT); const browser = await chromium.launch();

  section('17 alıştırma, sensörden gelen atışlarla (aynı anda 17 sayfa)');
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
      const ok = !res.err && res.src === 'sensor' && res.saved && res.n > 0 && res.sub === 'ozet' && res.sheet.length > 20 && !/NaN|undefined/.test(res.sheet) && res.rep && res.rep.w === 1080;
      check(ok, `${id.padEnd(13)} ${res.n} atış · geçmişe kaydedildi · oturum özeti ve rapor sorunsuz`, ok ? undefined : { err: res.err, n: res.n, saved: res.saved, src: res.src, sub: res.sub, rep: res.rep, sheet: (res.sheet || '').slice(0, 120) });
    }
    const v = id => R[id].shots;
    check(R.serbest.n >= 6 && R.serbest.who === 'p1', 'Serbest: atışlar sayılıyor, oturum seçili atıcıya kaydedildi', { n: R.serbest.n, who: R.serbest.who });
    check(R.safespace.safe && R.safespace.saved, 'Safe Space: oturum kaydedildi ama istatistik dışı işaretlendi', { safe: R.safespace.safe });
    check(R.degerlendirme.auto && R.degerlendirme.n === 10 && /Seviye/i.test(R.degerlendirme.sheet), 'Değerlendirme: 10 atışta kendiliğinden bitti, seviye gösterildi', { n: R.degerlendirme.n, auto: R.degerlendirme.auto });
    check(R.dayaniklilik.auto && R.dayaniklilik.n === 10, 'Dayanıklılık: ayarlanan 10 atışta bitti', { n: R.dayaniklilik.n });
    check(R.atiseli.hm === 'strong' && R.destekeli.hm === 'weak', 'Tek el alıştırmaları el kipini kaydetti (atış eli / destek eli)', [R.atiseli.hm, R.destekeli.hm]);
    const rz = v('zamanlayici').filter(q => q.x.react != null).map(q => q.x.react);
    check(rz.length >= 2 && rz.every(t => t > 380 && t < 760), 'Atış zamanlayıcısı: bipten sonraki ilk atış süresi doğru (~0,5 sn)', rz);
    const pz = v('par').filter(q => q.x.parOk != null);
    check(pz.length >= 1 && pz.every(q => q.x.parOk === true && q.x.react > 550 && q.x.react < 900), 'Par ölçer: par süresi içindeki atış başarılı sayıldı (~0,7 sn)', pz.map(q => q.x.react));
    const kz = v('kiyas20');
    check(R.kiyas20.auto && kz.length >= 15 && kz.length <= 22, '20 saniyelik kıyaslama: süre bitince kendiliğinden durdu, ~saniyede bir atış sayıldı', kz.length);
    const zk = v('zamankiyas').filter(q => q.x.react != null).map(q => q.x.react);
    check(R.zamankiyas.auto && zk.length === 10 && zk.every((t, i) => i === 0 || t > zk[i - 1]) && /Toplam süre/.test(R.zamankiyas.sheet), 'Zaman kıyaslaması: 10 atışta bitti, her atışın bipten süresi ölçüldü, toplam süre gösterildi', zk);
    const ro = v('ritim').filter(q => q.x.offset != null).map(q => q.x.offset);
    check(R.ritim.auto && ro.length === 5 && ro.every(o => Math.abs(o) < 160), 'Ritmik: 5 atışta bitti, her atış bipe yakın (sapma < 0,16 sn)', ro);
    const kf = v('kilif').filter(q => q.x.react != null);
    check(kf.length >= 1 && kf.every(q => q.x.move != null && q.x.move > 120 && q.x.move < 420 && q.x.react > 750 && q.x.react < 1150), 'Kılıf çekiş: hareket başlama (~0,2 sn) ve ilk atış (~0,9 sn) ölçüldü', kf.map(q => [q.x.move, q.x.react]));
    const sp = v('surpriz').filter(q => q.x.react != null).map(q => q.x.react);
    check(R.surpriz.auto && sp.length === 3 && sp.every(t => t > 200 && t < 560) && /Ort\. tepki/.test(R.surpriz.sheet), 'Silahı beklenmedik anda ateşleme: 3 turda bitti, bipten tepki süresi ölçüldü (~0,3 sn)', sp);
    const rh = v('rehine');
    check(R.rehine.auto && rh.length === 3 && rh.every(q => q.x.rehine === 'kurtardi' && q.x.react > 750 && q.x.react < 1150) && /Kurtarılan/.test(R.rehine.sheet), 'Rehine kurtarma (kolay): 3 turda bitti, 0,9 sn ve iyi skorlu atışlar "kurtarıldı" sayıldı', rh.map(q => [q.x.rehine, q.x.react, q.sc]));
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
    const md = await page.evaluate(() => { window.__hisar.openSettings('gelismis'); return document.getElementById('md-montaj').textContent; });
    check(/yön testi yapıldı/i.test(md), 'Gelişmiş Ayarlar listesinde "Yön testi yapıldı"', md);
    // Montaj yönü ARKA: ölçülen namlu ekseni ters çevrilir, İLERİ'de geri gelir
    const flip = await page.evaluate(() => { const H = window.__hisar, b0 = H.S.mount.sensor.B.slice(); H.setYon('arka'); const b1 = H.S.mount.sensor.B.slice(), pc = H.proc.cfg.B.slice(); H.setYon('ileri'); return { b0, b1, pc, b2: H.S.mount.sensor.B.slice(), yon: H.S.mount.sensor.yon }; });
    check(Math.abs(flip.b1[1] + flip.b0[1]) < 1e-3 && Math.abs(flip.pc[1] - flip.b1[1]) < 1e-3 && Math.abs(flip.b2[1] - flip.b0[1]) < 1e-3 && flip.yon === 'ileri', 'Montaj yönü ARKA namlu eksenini ters çeviriyor, İLERİ geri alıyor', flip);
    await page.evaluate(() => window.__hisar.openSettings('algilama')); await sleep(300);
    await page.click('#wThr'); await sleep(500);
    await page.evaluate(() => { const F = window.__fake, h = F.head; [100, 300, 500].forEach(o => F.addShot(h + o, { spike: 2.4 })); });
    const learned = await waitFor(page, () => /Yeni eşik/.test((document.getElementById('lrMsg') || {}).textContent || ''), 6000);
    const thr = await page.evaluate(() => window.__hisar.S.thr.sensor.kuru);
    check(learned && thr > 1.0 && thr < 1.4, 'Eşiği öğren: 3 tetikten eşik hesaplandı ve kaydedildi (~1,2 g)', thr);
    check(errs.length === 0, 'Sayfa hatası yok', errs);
    await ctx.close();
  }

  section('MantisX düzeni: Alıştırma listesi, düzenleme, günlük meydan okuma, dersler, neden sayfası');
  {
    const { ctx, page, errs } = await connected(browser);
    const L = await page.evaluate(() => ({ secs: Array.from(document.querySelectorAll('#drillList .sec')).map(e => e.firstChild.textContent.trim()),
      drills: Array.from(document.querySelectorAll('#drillList [data-drill]')).map(e => e.querySelector('.ln').textContent),
      lessons: Array.from(document.querySelectorAll('#drillList [data-lesson]')).map(e => e.querySelector('.ln').textContent), ch: document.getElementById('chRow').textContent,
      nav: Array.from(document.querySelectorAll('.nav button')).map(b => b.textContent.trim()) }));
    check(JSON.stringify(L.secs) === JSON.stringify(['Elit', 'Günlük Meydan Okuma', 'Antrenmanlar', 'Dersler']), 'Bölümler MantisX sırasıyla: ELİT, GÜNLÜK MEYDAN OKUMA, ANTREMANLAR, DERSLER', L.secs);
    check(JSON.stringify(L.drills) === JSON.stringify(['Kılıf Çekiş Analizi', 'Geri Tepme Ölçer', 'Serbest Antrenman', 'Safe Space', 'Atış Zamanlayıcısı (Shot Timer)', 'Par Ölçer', 'Değerlendirme Testi', '20 Saniyelik Kıyaslama', 'Zaman Kıyaslaması', 'Dayanıklılık', 'Silahı Beklenmedik Anda Ateşleme', 'Sadece Atış Eli', 'Sadece Destek Eli', 'Karar Tatbikatları', 'Şarjör Değiştirme Antrenmanları', 'Ritmik Antrenman', 'Rehine Kurtarma Antrenmanları']),
      'Alıştırmalar MantisX listesiyle aynı sırada (17)', L.drills);
    check(JSON.stringify(L.lessons) === JSON.stringify(['HİSAR TETİK Tanıtımı', 'Temel Nişancılık', 'İleri Nişancılık']) && JSON.stringify(L.nav) === JSON.stringify(['Alıştırma', 'Geçmiş', 'Gruplar', 'Ayarlar']), 'Dersler (3) ve alt sekmeler: Alıştırma, Geçmiş, Gruplar, Ayarlar', { l: L.lessons, nav: L.nav });
    const ch = await page.evaluate(() => window.__hisar.todayChallenge());
    check(L.ch.includes(ch.ad) && L.ch.includes(ch.goal), 'Günlük meydan okuma satırında bugünün görevi ve hedefi', L.ch);
    await page.click('#chRow'); await sleep(3400);
    const chd = await page.evaluate(() => ({ d: window.__hisar.cur.sess.drill, pre: document.getElementById('preStart').textContent }));
    check(chd.d === ch.drill && /Günlük meydan okuma/.test(chd.pre), 'Meydan okumaya dokununca o alıştırma, hedefiyle birlikte açılıyor', chd);
    // DRILL ve atış tipi düğmeleri
    await page.click('#preDrill'); await sleep(200);
    const dt = await page.evaluate(() => ({ t: document.getElementById('pgTitle').textContent, b: document.getElementById('pgBody').textContent.length }));
    check(dt.t === 'Alıştırma ayarları' && dt.b > 20, 'DRILL düğmesi alıştırma ayarlarını açıyor', dt);
    await page.evaluate(() => window.__hisar.popPage());
    await page.click('#preMode'); await sleep(200);
    const ml = await page.evaluate(() => ({ t: document.getElementById('pgTitle').textContent, rows: Array.from(document.querySelectorAll('#pgBody [data-mode]')).map(b => b.dataset.mode), gears: document.querySelectorAll('#pgBody [data-gear]').length }));
    check(/Antrenmanı/.test(ml.t) && JSON.stringify(ml.rows) === JSON.stringify(['gercek', 'kuru', 'co2']) && ml.gears === 3, 'Atış tipi düğmesi MantisX gibi tam listeyi açıyor (her biri ⚙ ile)', ml);
    await page.click('#pgBody [data-gear="co2"]'); await sleep(300);
    const g = await page.evaluate(() => ({ m: window.__hisar.S.mode, set: window.__hisar.setPage, t: document.getElementById('pgTitle').textContent, thr: !!document.getElementById('thr') }));
    check(g.m === 'co2' && g.set === 'algilama' && /CO2/.test(g.t) && g.thr, '⚙: o atış tipi seçilip algılama ayarları (eşik, eşiği öğren, mikrofon, gecikme) açılıyor', g);
    await page.evaluate(() => { const H = window.__hisar; H.popPage(); H.popPage(); H.S.mode = 'kuru'; });
    // neden sayfası: sensörden gelen hatalı atış
    await page.evaluate(() => window.__hisar.startRun()); await sleep(200);
    await page.evaluate(() => { const F = window.__fake; F.addShot(F.head + 100, { dx: 0, dy: -0.9 }); });
    await waitFor(page, () => window.__hisar.cur.sess.shots.length === 1, 3000); await sleep(300);
    const pc = await page.evaluate(() => Array.from(document.querySelectorAll('#skorCauses [data-cause]')).map(b => b.dataset.cause));
    await page.click('#skorCauses [data-cause]'); await sleep(300);
    const cp = await page.evaluate(() => ({ tabs: document.querySelectorAll('#pgBody .c-tabs button').length, art: document.querySelectorAll('#pgBody .c-art svg').length, h: document.querySelector('#pgBody h2').textContent, nav: document.getElementById('nav').hidden, drill: !!document.getElementById('cDrill') }));
    check(pc.length >= 1 && pc[0] === 'bilek_asagi' && cp.tabs === pc.length && cp.art === 2 && /Bileği aşağı/i.test(cp.h) && cp.nav && cp.drill, 'Olası nedenler: dokununca MantisX gibi sekmeli neden sayfası (doğru/hatalı çizim, düzeltme, önerilen alıştırma)', { pc, cp });
    await page.evaluate(() => { window.__hisar.popPage(); window.__hisar.stopRun(false); }); await sleep(1300);
    // listeyi düzenle: Safe Space gizle / göster
    await page.evaluate(() => window.__hisar.showView('alistirma'));
    await page.click('#drEdit'); await page.click('[data-drill="safespace"]'); await page.click('#drEdit'); await sleep(100);
    const hid = await page.evaluate(() => ({ shown: !!document.querySelector('#drillList [data-drill="safespace"]'), saved: JSON.parse(localStorage.getItem('hisarTetik.v2.meta')).settings.hiddenDrills }));
    await page.click('#drEdit'); await page.click('[data-drill="safespace"]'); await page.click('#drEdit');
    const back = await page.evaluate(() => !!document.querySelector('#drillList [data-drill="safespace"]'));
    check(!hid.shown && JSON.stringify(hid.saved) === '["safespace"]' && back, 'Kalemle liste düzenleniyor: Safe Space gizlendi (kalıcı) ve geri açıldı', hid);
    // dersler
    for (let i = 0; i < 3; i++) { await page.click(`[data-lesson="${i}"]`); await sleep(150); if (i < 2) await page.evaluate(() => window.__hisar.popPage()); }
    const ds = await page.evaluate(() => ({ n: window.__hisar.pages.length, t: document.getElementById('pgTitle').textContent, causes: document.querySelectorAll('#pgBody [data-cause]').length }));
    check(ds.t === 'İleri Nişancılık' && ds.causes === 15, 'Dersler açılıyor; İleri Nişancılık hata rehberini (15 hata) içeriyor', ds);
    check(errs.length === 0, 'Sayfa hatası yok', errs);
    await ctx.close();
  }

  section('Ayarlar ana sayfası (MantisX): silah, el, atış tipi, montaj, profil, program, ses, gelişmiş');
  {
    const { ctx, page, errs } = await connected(browser);
    await page.evaluate(() => window.__hisar.openSettings(null)); await sleep(300);
    const ui = await page.evaluate(() => ({ segs: ['sWeapon', 'sHand', 'sMode', 'sYon', 'sYer'].every(id => !!document.getElementById(id)),
      btns: ['sPick', 'profPick', 'profEdit', 'rtProgram', 'rtSes', 'rtAdv'].every(id => !!document.getElementById(id)),
      modes: Array.from(document.querySelectorAll('#sMode button')).map(b => b.textContent), yer: Array.from(document.querySelectorAll('#sYer button')).map(b => b.textContent),
      infos: Array.from(document.querySelectorAll('#v-ayarlar [data-info]')).map(b => b.dataset.info) }));
    check(ui.segs && ui.btns && JSON.stringify(ui.modes) === JSON.stringify(['Gerçek atış', 'Kuru tetik', 'Daha fazla']) && JSON.stringify(ui.yer) === JSON.stringify(['Alt', 'Üst', 'Sağ', 'Sol']) && JSON.stringify(ui.infos) === JSON.stringify(['tip', 'myon', 'myer']),
      'Silah, Silahını seç, el, atış tipi (Gerçek/Kuru/Daha fazla), montaj yönü ve yeri, profil, Eğitim programı, Sesli geri bildirim, Gelişmiş ayarlar', ui);
    await page.click('#sHand [data-v="L"]'); await page.click('#sMode [data-v="gercek"]'); await page.click('#sYer [data-v="sag"]'); await page.click('#sYon [data-v="arka"]');
    await page.click('#sPick'); await sleep(200); await page.click('[data-w="MPT-76"]'); await sleep(200);
    await page.click('#sMode [data-v="more"]'); await sleep(200); await page.click('#pgBody [data-mode="co2"]'); await sleep(200);
    await page.click('#rtSes'); await sleep(200); await page.click('#sSound [data-v="kapali"]'); await page.evaluate(() => window.__hisar.popPage());
    await page.click('#rtAdv'); await sleep(200); await page.click('#sDiff [data-v="zor"]'); await page.evaluate(() => window.__hisar.popPage());
    await page.click('#rtProgram'); await sleep(200); await page.click('#pDays [data-v="1"]'); await page.click('#pDays [data-v="3"]'); await page.click('#pGoal [data-v="20"]'); await page.evaluate(() => window.__hisar.popPage());
    const st = await page.evaluate(() => { const S = window.__hisar.S; return { w: S.weapon, n: S.weaponName, h: S.hand, m: S.mode, d: S.diff, s: S.sound, yer: S.mount.sensor.yer, yon: S.mount.sensor.yon, B: window.__hisar.proc.cfg.B, plan: S.plan, saved: JSON.parse(localStorage.getItem('hisarTetik.v2.meta')).settings }; });
    check(st.w === 'rifle' && st.n === 'MPT-76' && st.h === 'L' && st.m === 'co2' && st.d === 'zor' && st.s === 'kapali' && st.yer === 'sag' && st.yon === 'arka' && st.B[1] === -1
      && JSON.stringify(st.plan.days.sort()) === '[1,3]' && st.plan.goal === 20 && st.saved.weaponName === 'MPT-76' && st.saved.mode === 'co2' && st.saved.mount.sensor.yon === 'arka',
      'Seçimler uygulandı ve kaydedildi (silah listeden, CO2 Daha fazla\'dan, montaj ARKA/SAĞ, program, zorluk, ses)', st);
    const lbl = await page.evaluate(() => Array.from(document.querySelectorAll('#v-ayarlar .mx-l span:first-child')).map(e => e.textContent));
    check(lbl[0] === 'MPT-76' && lbl[1] === 'Sol El' && lbl[2] === 'CO2 Antrenmanı', 'Başlıklar seçimi gösteriyor (MPT-76, Sol El, CO2 Antrenmanı)', lbl);
    const pre = await page.evaluate(() => { window.__hisar.openDrill('serbest'); return document.getElementById('preStart').textContent; });
    check(/MPT-76/.test(pre) && /CO2/.test(pre) && /Sol/.test(pre), 'Alıştırma ekranındaki düğmeler seçimi gösteriyor', pre.slice(0, 200));
    await page.evaluate(() => window.__hisar.openSettings(null)); await sleep(200);
    await page.click('#v-ayarlar [data-info="myon"]'); await sleep(200);
    const info = await page.evaluate(() => ({ t: document.getElementById('sheetTitle').textContent, b: document.getElementById('sheetBody').textContent }));
    check(info.t === 'Montaj yönü' && /İLERİ/.test(info.b) && /ARKA/.test(info.b), 'ⓘ açıklaması pencerede açılıyor', info);
    await closeSheet(page);
    // profil: yeni atıcı, seçim, ad değiştirme
    await page.click('#profPick'); await sleep(150); await page.fill('#ppNew', 'Ali Çavuş'); await page.click('#ppAdd'); await sleep(200);
    const pr = await page.evaluate(() => ({ n: window.__hisar.S.profiles.length, cur: document.getElementById('profName').textContent }));
    await page.click('#profEdit'); await sleep(150); await page.fill('#prName', 'Ali Uzman Çavuş'); await page.evaluate(() => window.__hisar.popPage());
    const pr2 = await page.evaluate(() => document.getElementById('profName').textContent);
    check(pr.n === 2 && pr.cur === 'Ali Çavuş' && pr2 === 'Ali Uzman Çavuş', 'Profil: ▼ ile yeni atıcı eklendi ve seçildi, Profilini düzenle ile adı değişti', { pr, pr2 });
    // bütün alt sayfalar açılıyor, ⓘ'ler dolu
    const pages = ['gelismis', 'baglanti', 'montaj', 'algilama', 'gorunum', 'veri', 'uygulama', 'program', 'ses', 'silah', 'profil'];
    const bad = [];
    for (const p of pages) { const r = await page.evaluate(p => { window.__hisar.openSettings(p); return { t: document.getElementById('pgTitle').textContent, infos: Array.from(document.querySelectorAll('#pgBody [data-info]')).map(b => b.dataset.info), body: document.getElementById('pgBody').textContent.length }; }, p);
      if (!r.t || r.body < 30) bad.push(p + ':boş');
      for (const k of r.infos) { await page.click(`#pgBody [data-info="${k}"]`); await sleep(80); const t = await page.evaluate(() => document.getElementById('sheetBody').textContent.length);
        if (t < 40) bad.push(p + ':' + k); await closeSheet(page); } }
    check(bad.length === 0, 'Bütün alt sayfalar (11) açılıyor, içlerindeki ⓘ açıklamaları dolu', bad);
    const old = await page.evaluate(() => { window.__hisar.openSettings('atici'); return { p: window.__hisar.setPage, has: !!document.getElementById('sWeapon') }; });
    check(old.p == null && old.has, 'Eski bağlantılar (Atıcı, Alıştırma süreleri) Ayarlar ana sayfasını açıyor', old);
    check(errs.length === 0, 'Sayfa hatası yok', errs);
    await ctx.close();
  }

  section('Geçmiş, süzme, Safe Space, inceleme, silme; Gruplar; yeniden açılınca kalıcılık');
  {
    const { ctx, page, errs } = await connected(browser);
    for (const id of ['serbest', 'degerlendirme', 'safespace']) await page.evaluate(DRIVE, { id, set: {}, maxMs: 6000, stopAfter: 3 });
    await page.evaluate(() => window.__hisar.showView('gecmis')); await sleep(500);
    const h = await page.evaluate(() => ({ n: document.querySelectorAll('#sessList [data-id]').length, shots: +document.getElementById('hsShots').textContent, sess: +document.getElementById('hsSess').textContent, safeTag: /Safe Space/.test(document.getElementById('sessList').textContent),
      title: document.getElementById('hTitle').textContent, streak: document.getElementById('hStreak').textContent, charts: document.querySelectorAll('#charts > div').length }));
    check(h.n === 3 && h.sess === 2 && h.shots >= 6 && h.safeTag, 'Geçmişte 3 oturum; Safe Space listede etiketli ama istatistiğe girmiyor (2 oturum)', h);
    check(/Atıcı: Son 6 ay/.test(h.title) && /Akım 1/.test(h.streak) && h.charts === 4, 'Başlık "Atıcı: Son 6 ay", antrenman serisi 1, 4 grafik', h);
    await page.click('#hFilter'); await sleep(200); await page.selectOption('#fDrill', 'serbest'); await page.click('#fOk'); await sleep(300);
    const f = await page.evaluate(() => ({ n: document.querySelectorAll('#sessList [data-id]').length, btn: document.getElementById('hFilter').textContent }));
    check(f.n === 1 && /^1/.test(f.btn), 'Filtreler: alıştırmaya göre süzme, düğmede "1 Filtreler"', f);
    await page.click('#sessList [data-id]'); await sleep(300);
    const rv = await page.evaluate(() => ({ v: window.__hisar.cur.review, d: window.__hisar.cur.sess.drill, btn: document.getElementById('btnStop').textContent, pre: document.getElementById('preStart').hidden, nav: !document.getElementById('nav').hidden, head: document.getElementById('sessHead').textContent }));
    check(rv.v && rv.d === 'serbest' && /Yeni oturum/i.test(rv.btn) && rv.pre && rv.nav && /\d{4}/.test(rv.head), 'Oturum incelemesi MantisX gibi: başlıkta tarih, alt sekmeler görünür, "Yeni oturum"', rv);
    await page.click('#sessInfo'); await page.click('#iDel'); await page.click('#iYes'); await sleep(300);
    const after = await page.evaluate(() => ({ n: window.__hisar.sessions.filter(s => !s.sample).length, ls: Object.keys(localStorage).filter(k => k.startsWith('hisarTetik.v2.s.')).length }));
    check(after.n === 2 && after.ls === 2, 'Oturum silindi (geçmişten ve depodan)', after);
    // Gruplar: grup oluştur, yeni atıcı ekle, sıralama
    await page.evaluate(() => window.__hisar.showView('gruplar')); await sleep(200);
    await page.click('#grAdd2'); await sleep(150); await page.fill('#gNew', '1. Tim'); await page.click('#gOk'); await sleep(250);
    await page.fill('#gAddNew', 'Mehmet'); await page.click('#gAdd'); await sleep(200);
    await page.selectOption('#gDrill', 'degerlendirme'); await sleep(200);
    const gr = await page.evaluate(() => ({ t: document.getElementById('pgTitle').textContent, rows: Array.from(document.querySelectorAll('#pgBody .lb-row')).map(r => r.textContent.replace(/\s+/g, ' ').trim()), groups: window.__hisar.S.groups.length, profs: window.__hisar.S.profiles.map(p => p.ad) }));
    check(gr.t === '1. Tim' && gr.groups === 1 && gr.rows.length === 2 && /^1\s*Atıcı/.test(gr.rows[0]) && /Mehmet/.test(gr.rows[1]) && JSON.stringify(gr.profs) === '["Atıcı","Mehmet"]', 'Gruplar: grup kuruldu, yeni atıcı eklendi, değerlendirme sıralaması (skoru olan önde)', gr);
    // yeniden aç: oturumlar, gruplar ve ayarlar duruyor, eşlenmiş sensör bekleniyor
    const st0 = await page.evaluate(() => ({ storage: Object.fromEntries(Object.keys(localStorage).map(k => [k, localStorage.getItem(k)])) }));
    await ctx.close();
    const r2 = await openApp(browser, { port: PORT, init: [FAKE, 'window.__fake.allowGetDevices=true;'], storage: st0.storage, keepSplash: true });
    const ok = await waitFor(r2.page, () => window.__hisar.ble.st === 'bagli', 8000); await sleep(700);
    const p2 = await r2.page.evaluate(() => ({ n: window.__hisar.sessions.filter(s => !s.sample).length, src: window.__hisar.source, last: window.__hisar.S.lastSensor, groups: window.__hisar.S.groups.length, splash: window.__hisar.splashOpen() }));
    check(ok && p2.n === 2 && p2.src === 'sensor' && p2.last === 'HISAR-SENSOR' && p2.groups === 1 && !p2.splash, 'Yeniden açılınca oturumlar, gruplar, ayarlar duruyor; açılış ekranında sensöre kendiliğinden bağlanıp geçti', p2);
    check(errs.length === 0 && r2.errs.length === 0, 'Sayfa hatası yok', errs.concat(r2.errs));
    await r2.ctx.close();
  }

  section('Dar ekran (360 × 640): hiçbir ekranda yana taşma yok');
  {
    const { ctx, page, errs } = await connected(browser, { viewport: { width: 360, height: 640 } });
    await page.evaluate(DRIVE, { id: 'zamanlayici', set: {}, maxMs: 9000 });
    // kaydırılabilir/kırpan bir kabın içindekiler (geçmişteki grafik kaydırıcısı, tablolar) taşma sayılmaz
    const over = async () => page.evaluate(() => { const W = window.innerWidth + 1, o = [];
      const clipped = e => { for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) { const ox = getComputedStyle(a).overflowX; if (ox !== 'visible' && a.getBoundingClientRect().right <= W) return true; } return false; };
      document.querySelectorAll('body *').forEach(e => { const r = e.getBoundingClientRect(); if (r.width && r.right > W && getComputedStyle(e).position !== 'fixed' && !clipped(e)) o.push(e.id || String(e.className && e.className.baseVal !== undefined ? e.className.baseVal : e.className) || e.tagName); });
      return o.slice(0, 4); });
    const bad = {};
    for (const v of ['alistirma', 'gecmis', 'gruplar', 'ayarlar']) { await page.evaluate(v => window.__hisar.showView(v), v); await sleep(300); const o = await over(); if (o.length) bad[v] = o; }
    for (const sub of ['ozet', 'skor', 'grafik', 'iz']) { await page.evaluate(s => { window.__hisar.showView('oturum'); window.__hisar.setSub(s); }, sub); await sleep(300); const o = await over(); if (o.length) bad['oturum/' + sub] = o; }
    await page.evaluate(() => { window.__hisar.openDrill('rehine'); }); await sleep(300); { const o = await over(); if (o.length) bad['oturum/baslangic'] = o; }
    for (const p of ['gelismis', 'baglanti', 'montaj', 'algilama', 'gorunum', 'veri', 'uygulama', 'program', 'ses', 'silah', 'profil']) { await page.evaluate(p => window.__hisar.openSettings(p), p); await sleep(300); const o = await over(); if (o.length) bad['ayarlar/' + p] = o; }
    for (const [k, fn] of [['tipler', () => window.__hisar.openModeList()], ['drill', () => window.__hisar.openDrillSettings('rehine')], ['neden', () => window.__hisar.openCause('az_parmak', ['az_parmak', 'tum_el'])]]) { await page.evaluate(fn); await sleep(300); const o = await over(); if (o.length) bad[k] = o; }
    check(Object.keys(bad).length === 0, 'Sekmeler, alıştırma ekranı (5 görünüm), 11 ayar sayfası, atış tipleri, DRILL ve neden sayfası 360 px\'e sığıyor', bad);
    check(errs.length === 0, 'Sayfa hatası yok', errs);
    await ctx.close();
  }

  await browser.close(); srv.close();
  process.exit(finish('Bütün özellikler testi') ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
