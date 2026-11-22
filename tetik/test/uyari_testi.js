// Ölçüm uyarıları testi (sürüm 37): cihaza göre uyarılar — örnek hızı, Bluetooth veri kaybı, sensör sıfırının kayması,
// sıfır ölçülmeden başlama, lazerin art arda görülmemesi, oturum özetinde ölçüm notları. Her atışta en çok bir uyarı (üst üste binmesin).
'use strict';
const { serve, check, section, finish, openApp, chromium, fs, path, sleep } = require('./ortak');
const PORT = 8797;
const FAKE = fs.readFileSync(path.join(__dirname, 'sahte_sensor.js'), 'utf8');

(async () => {
  const srv = await serve(PORT); const browser = await chromium.launch();
  const { page, errs } = await openApp(browser, { port: PORT });
  const R = await page.evaluate(() => {
    const H = window.__hisar, TRN = 161, out = {};
    const sess = o => Object.assign({ weapon: 'pistol', diff: 'normal', hand: 'R', handMode: 'normal', drill: 'serbest', mode: 'kuru', src: 'sensor', shots: [] }, o);
    const iz = f => { const a = new Float32Array(TRN * 2); for (let g = 0; g < TRN; g++) { const p = f(-1000 + g * 10); a[g * 2] = p[0]; a[g * 2 + 1] = p[1]; } return H.encTrace(a); };
    const ani7 = t => { const u = t <= -60 ? 0 : t >= -10 ? 1 : (t + 60) / 50; return [-0.1 * u, -0.173 * u]; };
    const q0 = o => Object.assign({ n: 1, sc: 60, h: 7, dx: -0.1, dy: -0.173, wv: 0.005, ca: 0, ho: 0.02, tr: 0.2, po: 0, x: {}, tz: iz(ani7) }, o);
    // 1) düşük örnek hızı: zamanlama yok, klasik şema; ölçüm satırında yazıyor
    const yavas = q0({ x: { hz: 60 } }), hizli = q0({});
    out.hz = { din: H.dinamik(yavas), c: H.diagnose(yavas, sess({})), cHizli: H.diagnose(hizli, sess({})) };
    yavas.c = out.hz.c; out.hz.kanit = H.teshisKanit(yavas, sess({ dist: 25 }));
    // 2) uyarılar: toast metinlerini yakala
    const sap = { set length(v) { H.toastSil(); }, slice: () => H.toastSon() }; H.toastSil();
    const kay = (x, y) => t => [x * (t + 1000) / 1000, y * (t + 1000) / 1000];        // tutuşta düzgün kayma (°/sn)
    const r = { sess: sess({}) }; for (let i = 0; i < 4; i++) H.olcumUyari(r, q0({ n: i + 1, tz: iz(kay(0.4, 0.05)) }));
    out.sifir = { msg: sap.slice(), flag: r.sess.sifirSupheli };
    sap.length = 0; const r2 = { sess: sess({}) }; for (let i = 0; i < 4; i++) H.olcumUyari(r2, q0({ n: i + 1, tz: iz(kay(i % 2 ? 0.4 : -0.4, 0)) }));   // yön değişiyor: kol
    out.sifirYok = sap.slice();
    sap.length = 0; const r3 = { sess: sess({ lzR: 0.05 }) }; for (let i = 0; i < 3; i++) H.olcumUyari(r3, q0({ n: i + 1, lz: { gor: false, kam: true } }));
    out.lz = sap.slice();
    sap.length = 0; const r4 = { sess: sess({ lzR: 0.05 }) }; for (const g of [false, false, true, false, false]) H.olcumUyari(r4, q0({ lz: { gor: g, kam: true } }));
    out.lzAra = sap.slice();
    sap.length = 0; const r5 = { sess: sess({}) }; H.olcumUyari(r5, q0({ x: { hz: 60 } })); H.olcumUyari(r5, q0({ x: { hz: 60 } }));
    out.hzMsg = sap.slice();
    sap.length = 0; const r6 = { sess: sess({ src: 'phone' }) }; H.olcumUyari(r6, q0({ x: { hz: 55 } })); out.hzTel = sap.slice();
    sap.length = 0; const r7 = { sess: sess({ src: 'demo' }) }; for (let i = 0; i < 4; i++) H.olcumUyari(r7, q0({ tz: iz(kay(0.4, 0.05)), x: { hz: 60 } })); out.demo = sap.slice();
    // Bluetooth kaybı: son 10 sn'de %5
    sap.length = 0; H.ble.hist = [[0, 0], [950, 50]]; const r8 = { sess: sess({}) }; H.olcumUyari(r8, q0({})); H.olcumUyari(r8, q0({})); out.kayip = sap.slice(); H.ble.hist = [];
    // 3) oturum özetinde ölçüm notları
    const ns = sess({ lzR: 0.05, yonSupheli: 1, sifirSupheli: 1, shots: [q0({ x: { gap: 1 } }), q0({ x: { hz: 60 } }), q0({ x: { sat: 1 } }), q0({ lz: { gor: false } }), q0({ lz: { gor: true, p: [0, 0] } })] });
    out.notlar = H.olcumNotlari(ns); out.notYok = H.olcumNotlari(sess({ shots: [q0({})] }));
    const d = document.createElement('div'); d.innerHTML = H.hedefMetin(ns, ns.shots, ns.shots[4], null, true, false); out.kart = d.innerText;
    const d2 = document.createElement('div'); const ts = sess({ shots: [q0({})] }); d2.innerHTML = H.hedefMetin(ts, ts.shots, ts.shots[0], null, true, false); out.kartYok = d2.innerText;
    return out;
  });

  section('Düşük ölçüm hızı (ör. telefon sensörü)');
  check(R.hz.din === null && R.hz.c[0] === 'tokatlama' && R.hz.cHizli[0] === 'tokatlama', 'Saniyede 60 ölçümde zamanlama kullanılmıyor, yalnız yön (klasik şema)', R.hz);
  check(/Ölçüm hızı düşük \(saniyede 60\)/.test(R.hz.kanit), 'Ölçüm satırında hızın düşük olduğu yazıyor', R.hz.kanit);
  check(R.hzMsg.length === 1 && /Ölçüm hızı düşük/.test(R.hzMsg[0]) && /yaklaştır/.test(R.hzMsg[0]), 'Sensörde düşük hız uyarısı bir kez (telefonu yaklaştır)', R.hzMsg);
  check(R.hzTel.length === 1 && /HİSAR sensörünü/.test(R.hzTel[0]), 'Telefon sensöründe: tetik zamanlaması için HİSAR sensörünü öneriyor', R.hzTel);
  check(R.demo.length === 0, 'Deneme modunda ölçüm uyarısı yok', R.demo);

  section('Sensörün sıfırı kayması');
  check(R.sifir.msg.length === 1 && /aynı yöne, aynı hızda/.test(R.sifir.msg[0]) && /masaya koy/.test(R.sifir.msg[0]) && R.sifir.flag === 1,
    'Art arda 4 atışta aynı yöne düzgün kayma → "sensörün sıfırı kaymış olabilir, masaya koy" (bir kez)', R.sifir);
  check(R.sifirYok.length === 0, 'Kayma yönü atıştan atışa değişiyorsa (kol) sıfır uyarısı yok', R.sifirYok);

  section('Lazer ve Bluetooth');
  check(R.lz.length === 1 && /son 3 atışta kamerada görülmedi/.test(R.lz[0]), 'Lazer art arda 3 atışta görülmezse uyarı', R.lz);
  check(R.lzAra.length === 0, 'Arada görülen atış sayacı sıfırlıyor (2 + 2 görülmeme: uyarı yok)', R.lzAra);
  check(R.kayip.length === 1 && /veri kaybı %5/.test(R.kayip[0]), 'Bluetooth veri kaybı %3 ve üstünde bir kez uyarı', R.kayip);

  section('Oturum özetinde ölçüm notları');
  check(R.notlar.length === 6 && /veri boşluğu/.test(R.notlar[0]) && /hızı düşük/.test(R.notlar[1]) && /ölçüm sınırını/.test(R.notlar[2]) && /yön testindeki/.test(R.notlar[3]) && /sıfırı kaymış/.test(R.notlar[4]) && /Lazer 1 atışta/.test(R.notlar[5]),
    'Veri boşluğu, düşük hız, doyma, yön, sıfır ve lazer notları sayılarıyla', R.notlar);
  check(R.notYok.length === 0, 'Sorun yoksa not yok', R.notYok);
  check(/Ölçüm notları/i.test(R.kart) && !/Ölçüm notları/i.test(R.kartYok), 'Özet kartında "Ölçüm notları" yalnız sorun varsa görünüyor', { kart: R.kart.slice(0, 300), yok: R.kartYok.slice(0, 200) });

  section('Başlarken: sensörün sıfırı ölçülmemiş');
  {
    const p2 = await openApp(browser, { port: PORT, init: [FAKE] });
    const yakala = () => p2.page.evaluate(() => window.__hisar.toastSil());
    await p2.page.evaluate(() => { const h = window.__hisar; h.S.mic = 'kapali'; h.S.sound = 'kapali'; h.S.mode = 'kuru'; h.selectSource('sensor', true); });
    await yakala(); await sleep(400);                     // 1,5 sn durmadan: sıfır ölçülmedi
    await p2.page.evaluate(() => { const h = window.__hisar; h.openDrill('serbest'); h.startRun(); }); await sleep(300);
    const t1 = await p2.page.evaluate(() => window.__hisar.toastSon());
    await p2.page.evaluate(() => window.__hisar.stopRun(false)); await sleep(2500);   // sensör durgun: sıfır ölçülür
    await p2.page.evaluate(() => { const c = document.querySelector('#sheet [data-close]'); if (c) c.click(); const h = window.__hisar; h.toastSil(); h.openDrill('serbest'); h.startRun(); }); await sleep(300);
    const t2 = await p2.page.evaluate(() => window.__hisar.toastSon());
    check(t1.some(m => /sıfırı henüz ölçülmedi/.test(m)), 'Sıfır ölçülmeden başlanınca "silahı 2–3 saniye kıpırdatmadan bırak" uyarısı', t1);
    check(!t2.some(m => /sıfırı henüz ölçülmedi/.test(m)), 'Sıfır ölçüldükten sonra uyarı yok', t2);
    check(p2.errs.length === 0, 'Sayfa hatası yok (sensörlü)', p2.errs);
    await p2.page.evaluate(() => window.__hisar.stopRun(false)); await p2.ctx.close();
  }

  section('Her atışta en çok bir uyarı');
  const bir = await page.evaluate(() => { const H = window.__hisar, TRN = 161, a = new Float32Array(TRN * 2);
    for (let g = 0; g < TRN; g++) { const t = -1000 + g * 10; a[g * 2] = 0.4 * (t + 1000) / 1000; a[g * 2 + 1] = 0.05 * (t + 1000) / 1000; }
    const s = { weapon: 'pistol', diff: 'normal', hand: 'R', handMode: 'normal', drill: 'serbest', mode: 'kuru', src: 'sensor', lzR: 0.05, shots: [] }, r = { sess: s }, say = [];
    for (let i = 0; i < 5; i++) { H.toastSil(); H.olcumUyari(r, { n: i + 1, sc: 60, h: 7, dx: -0.1, dy: -0.17, wv: 0.005, ca: 0, ho: 0.02, tr: 0.2, po: 0, x: {}, tz: H.encTrace(a), lz: { gor: false, kam: true } }); say.push(H.toastSon().length); }
    return say; });
  check(bir.every(n => n <= 1) && bir.reduce((a, b) => a + b, 0) === 2, 'Aynı anda sıfır kayması ve lazer görülmemesi: her atışta en çok bir uyarı, ikisi de bir kez söyleniyor', bir);
  check(errs.length === 0, 'Sayfa hatası yok', errs);
  await browser.close(); srv.close();
  process.exit(finish('Ölçüm uyarıları testi') ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
