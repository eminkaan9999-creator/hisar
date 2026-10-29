// Mikrofon ve ham kayıt testi: sahte sensör (yazılım 3, sesli paketler) ile uçtan uca.
// Yardımcı kip: tık sesiyle gelen zayıf darbe atış sayılır, sessiz zayıf darbe sayılmaz.
// Kapalı kip ve eski yazılım (sürüm 2): yalnız sarsıntı. Sıkı kip: sesi olmayan darbe sayılmaz,
// üst üste 3 kez olursa Sıkı kip kendini kapatır. Gerçek atışta mikrofon kullanılmaz.
// Gürültülü ortam: gürültü tabanı yükselince ortam sesi tık sayılmaz. Mikrofonu bozuk sensör.
// Ayarlar › Atış algılama: algılama testi, ses göstergesi, durum metinleri.
// Ham kayıt: oturum boyunca kayıt, sonuç ekranından CSV, başlık bilgisi, satır sayısı, atış anları.
'use strict';
const { serve, check, section, finish, openApp, chromium, fs, path, sleep } = require('./ortak');
const PORT = 8786;
const FAKE = fs.readFileSync(path.join(__dirname, 'sahte_sensor.js'), 'utf8');

async function waitFor(page, fn, ms, arg) { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await page.evaluate(fn, arg)) return true; await sleep(100); } return false; }
async function connected(browser, init = []) {
  const r = await openApp(browser, { port: PORT, init: [FAKE, ...init] });
  await r.page.click('#srcSensor');
  await waitFor(r.page, () => window.__hisar.ble.st === 'bagli' && window.__hisar.ble.recv > 200, 8000);
  await sleep(1800);                                     // hareketsiz: jiroskop kalibrasyonu, gürültü tabanı
  return r;
}
const head = page => page.evaluate(() => window.__fake.head);
// atışları sensöre ekle (seq = şimdiki sayaç + ofset), bitince algılanan atış sayısını döndür
async function shots(page, list, waitMs) {
  const h = await head(page);
  await page.evaluate(({ h, list }) => { for (const s of list) window.__fake.addShot(h + s.at, s.o); }, { h, list });
  await sleep(waitMs || (Math.max(...list.map(s => s.at)) * 5 + 1400));
  return page.evaluate(() => window.__hisar.cur.sess.shots.length);
}
async function run(page, set) {
  await page.evaluate(set => { const H = window.__hisar; Object.assign(H.S, set || {}); H.openDrill('serbest'); H.startRun(); }, set);
  await sleep(300);
}
async function stop(page) { await page.evaluate(() => window.__hisar.stopRun(false)); await sleep(1200); await page.evaluate(() => { const c = document.querySelector('#sheet [data-close]'); if (c) c.click(); }); }
const WEAK = { spike: 0.3 };                             // eşik 0,5 g; 0,45 × eşik = 0,225 g < 0,32 g < 0,5 g

(async () => {
  const srv = await serve(PORT); const browser = await chromium.launch();

  section('Yardımcı kip (varsayılan): tık sesiyle gelen zayıf darbe atış sayılır');
  {
    const { ctx, page, errs } = await connected(browser);
    const st = await page.evaluate(() => ({ mic: window.__hisar.S.mic, on: window.__hisar.proc.micOn, bg: window.__hisar.proc.sBg }));
    check(st.mic === 'yardimci' && st.on && st.bg > 24 && st.bg < 32, 'Varsayılan Yardımcı, mikrofon etkin, gürültü tabanı ~28 dB', st);
    await run(page);
    let n = await shots(page, [{ at: 300, o: WEAK }]);
    check(n === 1, 'Zayıf darbe (0,32 g < eşik 0,5 g) + tık sesi → atış', n);
    n = await shots(page, [{ at: 300, o: Object.assign({ click: null }, WEAK) }]);
    check(n === 1, 'Aynı zayıf darbe sessizse → atış değil', n);
    n = await shots(page, [{ at: 300, o: { spike: 3, click: null } }]);
    check(n === 2, 'Güçlü darbe sessiz de olsa Yardımcı kipte atış', n);
    n = await shots(page, [{ at: 300, o: Object.assign({ clickAt: 3 }, WEAK) }]);
    check(n === 3, 'Tık sesi darbeden 15 ms sonra gelse de eşleşiyor', n);
    n = await shots(page, [{ at: 300, o: Object.assign({ clickAt: -3 }, WEAK) }]);
    check(n === 4, 'Tık sesi darbeden 15 ms önce gelse de eşleşiyor', n);
    n = await shots(page, [{ at: 300, o: Object.assign({ clickAt: 12 }, WEAK) }]);
    check(n === 4, '60 ms uzaktaki ses darbeyle eşleşmiyor', n);
    // atış zamanı darbe anı olmalı (sesin değil)
    const q = await page.evaluate(() => { const s = window.__hisar.cur.sess; return s.shots.map(x => x.at); });
    check(q.length === 4 && q.every((a, i) => i === 0 || a > q[i - 1]), 'Atış zamanları sıralı', q);
    await stop(page);
    check(errs.length === 0, 'Sayfa hatası yok', errs);
    await ctx.close();
  }

  section('Kapalı kip, gerçek atış ve eski sensör yazılımı: yalnız sarsıntı');
  {
    const { ctx, page, errs } = await connected(browser);
    await run(page, { mic: 'kapali' });
    let n = await shots(page, [{ at: 300, o: WEAK }]);
    check(n === 0, 'Kapalı: zayıf darbe + tık → atış değil', n);
    n = await shots(page, [{ at: 300, o: { spike: 3 } }]);
    check(n === 1, 'Kapalı: güçlü darbe → atış', n);
    await stop(page);
    await page.evaluate(() => { const H = window.__hisar; H.S.mic = 'yardimci'; H.S.mode = 'gercek'; });
    await run(page);
    const on = await page.evaluate(() => window.__hisar.proc.micOn);
    n = await shots(page, [{ at: 300, o: { spike: 3 } }]);
    check(!on && n === 0, 'Gerçek atışta mikrofon devre dışı (eşik 4 g, tıkla birlikte 3 g darbe sayılmaz)', { on, n });
    n = await shots(page, [{ at: 300, o: { live: true } }]);
    check(n === 1, 'Gerçek atış tepmesi algılanıyor', n);
    await stop(page);
    check(errs.length === 0, 'Sayfa hatası yok', errs);
    await ctx.close();
  }
  {
    const { ctx, page, errs } = await connected(browser, ['window.__fake.fw=2;']);
    const st = await page.evaluate(() => ({ snd: window.__hisar.ble.snd, mic: window.__hisar.ble.mic, sT: window.__hisar.proc.sT, txt: window.__hisar.micStatusText() }));
    check(!st.snd && !st.mic && st.sT == null, 'Sürüm 2 sensör: sesli paket yok, mikrofon biti yok', st);
    check(/3\. sürüm gerekir/.test(st.txt), 'Durum metni: "mikrofon için 3. sürüm gerekir"', st.txt);
    await run(page);
    let n = await shots(page, [{ at: 300, o: WEAK }]);
    check(n === 0, 'Sürüm 2: zayıf darbe sayılmaz (ses yok, yalnız sarsıntı)', n);
    n = await shots(page, [{ at: 300, o: { spike: 3 } }]);
    check(n === 1, 'Sürüm 2: güçlü darbe sayılır (davranış değişmedi)', n);
    await stop(page);
    check(errs.length === 0, 'Sayfa hatası yok', errs);
    await ctx.close();
  }
  {
    const { ctx, page, errs } = await connected(browser, ['window.__fake.micHw=false;']);
    const st = await page.evaluate(() => ({ snd: window.__hisar.ble.snd, mic: window.__hisar.ble.mic, sT: window.__hisar.proc.sT, txt: window.__hisar.micStatusText() }));
    check(st.snd && !st.mic && st.sT == null, 'Mikrofonu okunamayan sensör: paketler sesli ama ses kullanılmıyor', st);
    check(/okunamıyor/.test(st.txt), 'Durum metni: "sensör mikrofonu okunamıyor"', st.txt);
    await run(page, { mic: 'siki' });
    const n = await shots(page, [{ at: 300, o: { spike: 3, click: null } }]);
    check(n === 1, 'Mikrofon yokken Sıkı kipte bile darbe sayılır (atış kaybolmaz)', n);
    await stop(page);
    check(errs.length === 0, 'Sayfa hatası yok', errs);
    await ctx.close();
  }

  section('Sıkı kip: sesi olmayan darbe sayılmaz; mikrofon duymazsa kendini kapatır');
  {
    const { ctx, page, errs } = await connected(browser);
    await run(page, { mic: 'siki' });
    let n = await shots(page, [{ at: 300, o: { spike: 3, click: null } }]);
    check(n === 0, 'Sessiz güçlü darbe (çarpma) → atış değil', n);
    n = await shots(page, [{ at: 300, o: { spike: 3 } }]);
    check(n === 1, 'Tıklı güçlü darbe → atış', n);
    n = await shots(page, [{ at: 300, o: WEAK }]);
    check(n === 2, 'Tıklı zayıf darbe → atış', n);
    n = await shots(page, [{ at: 200, o: { spike: 3, click: null } }, { at: 400, o: { spike: 3, click: null } }, { at: 600, o: { spike: 3, click: null } }]);
    const w = await page.evaluate(() => ({ off: window.__hisar.proc.strictOff, toast: document.getElementById('toast').textContent, rej: window.__hisar.proc.rejected }));
    check(n === 2 && w.off && /Sıkı kip/.test(w.toast) && w.rej >= 4, 'Üst üste 3 sessiz darbe: Sıkı kip kapandı, kullanıcı uyarıldı', { n, w });
    n = await shots(page, [{ at: 300, o: { spike: 3, click: null } }]);
    check(n === 3, 'Sıkı kip kapandıktan sonra darbeler yine sayılıyor (atış kaybolmaz)', n);
    await stop(page);
    check(errs.length === 0, 'Sayfa hatası yok', errs);
    await ctx.close();
  }

  section('Gürültülü ortam: taban yükselir, ortam sesi tık sayılmaz');
  {
    const { ctx, page, errs } = await connected(browser);
    await page.evaluate(() => { window.__fake.noiseDb = 62; });
    await sleep(2500);
    const bg = await page.evaluate(() => window.__hisar.proc.sBg);
    check(bg > 58 && bg < 66, 'Gürültü tabanı ortamı izledi (~62 dB)', bg);
    await run(page);
    let n = await shots(page, [{ at: 300, o: WEAK }]);                         // tık 72 dB: tabanın sadece 10 dB üstü
    check(n === 0, 'Gürültüde zayıf darbe + kısık tık → atış değil (yanlış atış yok)', n);
    n = await shots(page, [{ at: 300, o: Object.assign({}, WEAK, { click: 85 }) }]);
    check(n === 1, 'Gürültüde belirgin tık (85 dB) → atış', n);
    n = await shots(page, [{ at: 300, o: { spike: 3 } }]);
    check(n === 2, 'Gürültüde güçlü darbe → atış', n);
    await stop(page);
    check(errs.length === 0, 'Sayfa hatası yok', errs);
    await ctx.close();
  }

  section('Ayarlar › Atış algılama: mikrofon kartı, ses göstergesi, algılama testi');
  {
    const { ctx, page, errs } = await connected(browser);
    await page.evaluate(() => window.__hisar.openSettings('algilama')); await sleep(600);
    const ui = await page.evaluate(() => ({ seg: Array.from(document.querySelectorAll('#sMic button')).map(b => b.textContent + ':' + b.getAttribute('aria-pressed')),
      note: document.getElementById('micNote').textContent, val: document.getElementById('sVal').textContent, thr: !document.getElementById('sThr').hidden,
      desc: document.getElementById('v-ayarlar').textContent.includes('Mikrofon desteği') }));
    check(ui.desc && JSON.stringify(ui.seg) === JSON.stringify(['Kapalı:false', 'Yardımcı:true', 'Sıkı:false']), 'Mikrofon kartı: Kapalı / Yardımcı (seçili) / Sıkı', ui.seg);
    check(/çalışıyor/.test(ui.note) && /^\d+ dB$/.test(ui.val) && ui.thr, 'Durum "Mikrofon çalışıyor", ses göstergesi dB gösteriyor, tık çizgisi var', ui);
    const h = await head(page);
    await page.evaluate(h => window.__fake.addShot(h + 200, { spike: 0.3 }), h);
    await sleep(1600);
    const dt = await page.evaluate(() => ({ n: document.getElementById('dtN').textContent, how: document.getElementById('dtHow').textContent, clicks: +document.getElementById('dtClick').textContent }));
    check(dt.n === '1' && /tık sesiyle/.test(dt.how) && dt.clicks >= 1, 'Algılama testi zayıf + tıklı tetiği saydı ve nasıl sayıldığını söyledi', dt);
    await page.click('#sMic [data-v="kapali"]'); await sleep(200);
    const h2 = await head(page);
    await page.evaluate(h => window.__fake.addShot(h + 200, { spike: 0.3 }), h2);
    await sleep(1600);
    const dt2 = await page.evaluate(() => ({ n: document.getElementById('dtN').textContent, s: window.__hisar.S.mic, note: document.getElementById('micNote').textContent }));
    check(dt2.n === '1' && dt2.s === 'kapali' && /Kapalı/.test(dt2.note), 'Kapalı seçilince aynı zayıf tetik sayılmadı, ayar kaydedildi', dt2);
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('hisarTetik.v2.meta')).settings.mic);
    check(saved === 'kapali', 'Mikrofon ayarı kalıcı', saved);
    check(errs.length === 0, 'Sayfa hatası yok', errs);
    await ctx.close();
  }

  section('Ham kayıt: oturum boyunca kayıt, CSV, başlık bilgisi, atış anları');
  {
    const { ctx, page, errs } = await connected(browser);
    await page.evaluate(() => window.__hisar.openSettings('veri')); await sleep(300);
    await page.click('#sRaw'); await sleep(200);
    check(await page.evaluate(() => window.__hisar.S.rawRec === true), 'Ayarlar › Veriler: ham kayıt açıldı');
    await page.evaluate(() => window.__hisar.showView('alistirma'));
    await run(page);
    const tag = await page.evaluate(() => document.getElementById('sessSub').textContent);
    check(/Ham kayıt/.test(tag), 'Oturum başlığında "● Ham kayıt" işareti', tag);
    const h = await head(page);
    await page.evaluate(h => { const F = window.__fake; F.addShot(h + 200, { spike: 3, dx: 0.1 }); F.addShot(h + 450, { spike: 0.3 }); F.addShot(h + 700, { spike: 3, dy: 0.2 }); }, h);
    await sleep(700 * 5 + 1400);
    await page.evaluate(() => window.__hisar.stopRun(false)); await sleep(1300);
    const sum = await page.evaluate(() => ({ btn: !!document.getElementById('sumRaw'), n: window.__hisar.cur.sess.shots.length, rn: window.__hisar.raw.n, on: window.__hisar.raw.on }));
    check(sum.btn && sum.n === 3 && !sum.on && sum.rn > 900, 'Sonuç ekranında "Ham veri" düğmesi; kayıt durdu', sum);
    await page.click('#sumRaw'); await sleep(300);
    const def = await page.evaluate(() => document.getElementById('rawReal').value);
    check(def === '3', 'Gerçek atış sayısı sorusu algılanan sayıyla dolu geliyor', def);
    await page.fill('#rawReal', '4');
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#rawSave')]);
    const file = await dl.path(); const txt = fs.readFileSync(file, 'utf8'); const name = dl.suggestedFilename();
    const lines = txt.trim().split('\n');
    const meta = JSON.parse(lines[1].slice(2));
    const rows = lines.slice(3).map(l => l.split(',').map(Number));
    check(/^hisar-ham-\d{8}-\d{4}-serbest\.csv$/.test(name) && /^# HISAR TETIK ham kayit/.test(lines[0]) && lines[2] === 't_ms,ax_mg,ay_mg,az_mg,gx_01dps,gy_01dps,gz_01dps,darbe_001g,ses_01db', 'Dosya adı, açıklama satırı ve sütun başlıkları doğru', { name, l0: lines[0].slice(0, 40), l2: lines[2] });
    check(meta.app === 'hisar-tetik' && meta.gercek === 4 && meta.algilanan === 3 && meta.atislar.length === 3 && meta.src === 'sensor' && meta.sensor === 'HISAR-SENSOR' && meta.fw === 3 && meta.mic.kip === 'yardimci' && meta.mic.etkin === true && meta.thr === 0.5,
      'Başlık bilgisi: gerçek 4 / algılanan 3, sensör, yazılım, mikrofon, eşik', { gercek: meta.gercek, alg: meta.algilanan, fw: meta.fw, mic: meta.mic, thr: meta.thr });
    check(rows.length === meta.olcum && rows.every(r => r.length === 9 && r.every(Number.isFinite)), 'Her ölçüm bir satır, 9 sayısal sütun (' + rows.length + ' satır)', rows.length);
    let steps = 0; for (let i = 1; i < rows.length; i++) if (Math.abs(rows[i][0] - rows[i - 1][0] - 5) > 2.6) steps++;
    check(steps <= 3, 'Zaman sütunu 5 ms adımlı', steps);
    const az = rows.slice(10, 50).map(r => r[3]);
    check(az.every(v => Math.abs(v - 1000) < 5) && rows.slice(10, 50).every(r => r[8] > 240 && r[8] < 320), 'İvme mg (az ≈ 1000), ses 0,1 dB (oda ~28 dB)', { az: az.slice(0, 3), snd: rows[10][8] });
    // atış anlarında darbe ve tık
    const okShots = meta.atislar.every(q => { const near = rows.filter(r => Math.abs(r[0] - q.at) <= 12); return near.some(r => r[7] >= 30) && near.some(r => r[8] >= 700); });
    check(okShots, 'Her atış anında darbe sütununda tepe ve ses sütununda tık (≥70 dB) var', meta.atislar.map(q => q.at));
    check(rows[0][0] > -60 && rows[0][0] < 40 && meta.sureMs > 3000, 'Kayıt oturumla başlıyor (t≈0) ve oturum süresini kapsıyor', { t0: rows[0][0], sure: meta.sureMs });
    // kapalıyken kayıt yok
    await page.evaluate(() => { const c = document.querySelector('#sheet [data-close]'); if (c) c.click(); window.__hisar.S.rawRec = false; });
    await run(page);
    const rn = await page.evaluate(() => window.__hisar.raw.on);
    await page.evaluate(() => window.__hisar.stopRun(false)); await sleep(1300);
    check(!rn, 'Ham kayıt kapalıyken yeni oturum kaydedilmiyor');
    check(errs.length === 0, 'Sayfa hatası yok', errs);
    await ctx.close();
  }

  await browser.close(); srv.close();
  process.exit(finish('Mikrofon ve ham kayıt testi') ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
