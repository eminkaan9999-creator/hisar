// Sensörü bul testi (sahte sensör + sahte konum): son görüldüğü yer (bağlanınca ve bağlantı koptuğu an telefonun konumu),
// buradan uzaklık ve yön, harita karoları ve "Haritalar'da aç", sıcak-soğuk (sinyal gücü ve yaklaşıyor/uzaklaşıyor),
// bulana kadar öttür (3 sn'de bir "Sensörü bul" komutu, "Buldum" ve sayfadan çıkınca durur), kayıt kapalıyken konum alınmaması.
'use strict';
const { serve, check, section, finish, openApp, chromium, fs, path, sleep } = require('./ortak');
const PORT = 8814;
const FAKE = fs.readFileSync(path.join(__dirname, 'sahte_sensor.js'), 'utf8');
// sahte konum: window.__geo değiştikçe telefon "yürür"; istek sayısı sayılır; window.open yakalanır
const GEO = `window.__geo={lat:39.92077,lon:32.85411,acc:8,n:0,off:false};
  try{ Object.defineProperty(navigator,'geolocation',{configurable:true,value:{getCurrentPosition:(ok,err)=>{ window.__geo.n++;
    setTimeout(()=>{ if(window.__geo.off) err({code:1}); else ok({coords:{latitude:window.__geo.lat,longitude:window.__geo.lon,accuracy:window.__geo.acc}}); },40); }}}); }catch(e){}
  window.__opened=[]; window.open=u=>{ window.__opened.push(String(u)); return null; };`;
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

async function waitFor(page, fn, ms, arg) { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await page.evaluate(fn, arg)) return true; await sleep(100); } return false; }
// metre cinsinden kuzey/doğu kaydırma
const move = (lat, lon, n, e) => ({ lat: lat + n / 111320, lon: lon + e / (111320 * Math.cos(lat * Math.PI / 180)) });

(async () => {
  const srv = await serve(PORT); const browser = await chromium.launch();
  const r = await openApp(browser, { port: PORT, init: [FAKE, GEO] });
  const { page, errs, ctx } = r;
  let tiles = 0; await ctx.route('**/tile.openstreetmap.org/**', rt => { tiles++; rt.fulfill({ contentType: 'image/png', body: PNG }); });
  const H = (fn, a) => page.evaluate(fn, a);

  section('Son görüldüğü yer: bağlanınca ve bağlantı koptuğu an');
  await H(() => window.__hisar.selectSource('sensor', true));
  const ok = await waitFor(page, () => window.__hisar.ble.st === 'bagli' && window.__hisar.S.sonYer, 9000);
  const y1 = await H(() => window.__hisar.S.sonYer);
  check(ok && y1.ev === 'baglandi' && Math.abs(y1.lat - 39.92077) < 1e-6 && Math.abs(y1.lon - 32.85411) < 1e-6 && y1.acc === 8, 'Sensör bağlanınca telefonun konumu kaydedildi', y1);
  // telefon 120 m kuzeydoğuya yürüdü, sensör menzil dışında kaldı
  const p2 = move(39.92077, 32.85411, 85, 85);
  await H(p => { Object.assign(window.__geo, p); window.__fake.inRange = false; window.__fake.drop(); }, p2);
  const y2ok = await waitFor(page, () => window.__hisar.S.sonYer && window.__hisar.S.sonYer.ev === 'koptu', 5000);
  const y2 = await H(() => window.__hisar.S.sonYer);
  check(y2ok && Math.abs(y2.lat - p2.lat) < 1e-6 && Math.abs(y2.lon - p2.lon) < 1e-6, 'Bağlantı koptuğu an telefonun konumu "son görüldüğü yer" oldu', y2);
  const saved = await H(() => JSON.parse(localStorage.getItem('hisarTetik.v2.meta')).settings.sonYer);
  check(saved && saved.ev === 'koptu', 'Son görüldüğü yer telefonda kalıcı kaydedildi', saved);

  section('Sensörü bul sayfası (menzil dışında): uzaklık, yön, harita');
  // kullanıcı 200 m güneye gitti: sensör kuzeyde, ~200 m
  const me = move(p2.lat, p2.lon, -200, 0);
  await H(p => { Object.assign(window.__geo, p); window.__hisar.showView('sensor'); }, me); await sleep(300);
  await page.click('#sbFind'); await sleep(900);
  const pg = await H(() => ({ t: document.getElementById('pgTitle').textContent, canli: document.getElementById('bulCanli').textContent, yer: document.getElementById('bulYer').textContent,
    imgs: document.querySelectorAll('#bulHarita img').length, note: !document.querySelector('#bulHarita .hn').hidden, sn: !!document.querySelector('#bulHarita .hsn'), meDot: !!document.querySelector('#bulHarita .hme'),
    cal: document.getElementById('bulCal').disabled, id: window.__fake.identified || 0, z: window.__hisar.BUL.z }));
  check(pg.t === 'Sensörü bul' && /Menzil dışında/.test(pg.canli) && pg.cal && pg.id === 0, 'Menzil dışında: "Menzil dışında ya da kapalı", öttür düğmesi kapalı, sensöre komut gitmedi', pg);
  check(/Son görülme/.test(pg.yer) && /bağlantı koptuğunda/.test(pg.yer) && /≈ 200 m/.test(pg.yer) && /kuzeyde/.test(pg.yer), 'Son görülme zamanı ve "Buradan ≈ 200 m, kuzeyde"', pg.yer);
  check(pg.imgs === 9 && tiles >= 9 && !pg.note && pg.sn && pg.meDot && pg.z < 17, 'Harita: 9 OpenStreetMap karosu, ortada sensörün yeri; 200 m ötedeki telefon da görünsün diye harita kendiliğinden uzaklaştı', { imgs: pg.imgs, tiles, note: pg.note, sn: pg.sn, me: pg.meDot, z: pg.z });
  await page.click('#bulHarita [data-z="1"]'); await sleep(200);
  const z = await H(() => ({ z: window.__hisar.BUL.z, src: document.querySelector('#bulHarita img').getAttribute('src') }));
  check(z.z === pg.z + 1 && new RegExp('tile\\.openstreetmap\\.org/' + z.z + '/').test(z.src), 'Yakınlaştır düğmesi haritayı bir kademe büyütüyor', z);
  await page.click('#bulAc'); await sleep(200);
  const op = await H(() => window.__opened.slice());
  check(op.length === 1 && op[0].includes(y2.lat + ',' + y2.lon), '"Haritalar\'da aç" son görüldüğü yeri harita uygulamasında açıyor', op);

  section('Sıcak-soğuk ve bulana kadar öttür (menzile girince)');
  await H(() => { window.__fake.rssi = -84; window.__fake.inRange = true; });
  const back = await waitFor(page, () => window.__hisar.ble.st === 'bagli', 15000); await sleep(2500);
  const c1 = await H(() => document.getElementById('bulCanli').textContent);
  check(back && /uzak/.test(c1) && /-84 dBm/.test(c1), 'Menzile girince kendiliğinden bağlandı: "uzak", −84 dBm', c1);
  await H(() => { window.__fake.rssi = -50; }); await sleep(3600);
  const c2 = await H(() => ({ t: document.getElementById('bulCanli').textContent, on: document.querySelectorAll('#bulCanli .bars i.on').length }));
  check(/çok yakın/.test(c2.t) && /yaklaşıyorsun/.test(c2.t) && c2.on === 5, 'Yaklaşınca: "çok yakın", 5 çubuk, "▲ yaklaşıyorsun"', c2);
  await H(() => { window.__fake.rssi = -78; }); await sleep(3600);
  const c3 = await H(() => { const B = window.__hisar.BUL, t = performance.now(); return { t: document.getElementById('bulCanli').textContent, rs: B.rs.map(v => [Math.round(t - v[0]), v[1]]) }; });
  check(/uzaklaşıyorsun/.test(c3.t), 'Uzaklaşınca "▼ uzaklaşıyorsun"', c3);
  const i0 = await H(() => window.__fake.identified || 0);
  await page.click('#bulCal'); await sleep(7300);
  const i1 = await H(() => ({ n: window.__fake.identified || 0, btn: document.getElementById('bulCal').textContent }));
  check(i1.n - i0 >= 3 && /Buldum/.test(i1.btn), 'Bulana kadar öttür: sensöre 3 sn\'de bir "bul" komutu gidiyor, düğme "Buldum, sustur"', { once: i0, sonra: i1 });
  await page.click('#bulCal'); await sleep(200);
  const i2 = await H(() => window.__fake.identified || 0); await sleep(4000);
  const i3 = await H(() => ({ n: window.__fake.identified || 0, btn: document.getElementById('bulCal').textContent }));
  check(i3.n === i2 && /Bulana kadar/.test(i3.btn), '"Buldum, sustur" ile sensör susuyor', { i2, i3 });
  await page.click('#bulCal'); await sleep(300);
  await H(() => window.__hisar.popPage()); const i4 = await H(() => window.__fake.identified || 0); await sleep(4000);
  const i5 = await H(() => ({ n: window.__fake.identified || 0, until: window.__hisar.BUL.until }));
  check(i5.n === i4 && !i5.until, 'Sayfadan çıkınca öttürme duruyor', { i4, i5 });

  section('Kayıt kapalıyken konum alınmıyor; izin verilmezse sorun çıkmıyor');
  await H(() => { window.__hisar.S.yerKaydet = false; window.__geo.n = 0; window.__fake.drop(); });
  await waitFor(page, () => window.__hisar.ble.st === 'bagli', 15000); await sleep(1500);
  const n0 = await H(() => window.__geo.n);
  check(n0 === 0, '"Son yeri kaydet" kapalıyken bağlanma ve kopmada konum istenmiyor', n0);
  await H(() => { const H = window.__hisar; H.S.yerKaydet = true; H.S.sonYer = null; window.__geo.off = true; window.__geo.n = 0; H.sonYerAl('elle'); }); await sleep(600);
  await H(() => { window.__hisar.showView('sensor'); }); await page.click('#sbFind'); await sleep(600);
  const den = await H(() => ({ yer: document.getElementById('bulYer').textContent, n: window.__geo.n }));
  await sleep(3000);
  const den2 = await H(() => window.__geo.n);
  check(/izni verilmedi/.test(den.yer) && den2 <= den.n + 1, 'İzin verilmezse "Konum izni verilmedi" yazıyor ve her saniye yeniden sorulmuyor', { den, den2 });
  check(errs.length === 0, 'Sayfa hatası yok', errs.slice(0, 5));

  await ctx.close(); await browser.close(); srv.close();
  process.exit(finish('Sensörü bul testi') ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
