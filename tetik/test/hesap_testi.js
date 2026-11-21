// Hisar 360 hesabı testi: sahte Hisar 360 sunucusuyla (Supabase Auth + REST taklidi; gerçek sunucuya ve gerçek personel
// verisine dokunmaz). Giriş (telefon biçimleri, yanlış şifre, pasif hesap), oturum özetinin gönderilmesi ve içeriği,
// tekrar gönderimde çift kayıt olmaması, internetsiz kuyruk, deneme ve Kaygısız Deneme oturumlarının gitmemesi,
// Hisar 360'ta tablo yokken bekleme, jetonun yenilenmesi, çıkış, başka hesabın kuyruğu göndermemesi, komutanın
// Birlik sonuçları ve personelin göremeyişi, dışa aktarılan yedekte jeton olmaması.
'use strict';
const http = require('http');
const { serve, check, section, finish, openApp, chromium, fs, path, sleep } = require('./ortak');
const PORT = 8824, SB = 8825;
const FAKE = fs.readFileSync(path.join(__dirname, 'sahte_sensor.js'), 'utf8');
const KOMUTAN = ['staff', 'tank', 'kisim', 'takim', 'boluk', 'tabur', 'tugay', 'tumen', 'ordu', 'kuvvet'];

// ---------------------------------------------------------------- sahte Hisar 360 (sentetik hesaplar)
function sahteH360() {
  const alias = n => [...Buffer.from(n.trim().toLocaleLowerCase('tr'))].map(x => x.toString(16).padStart(2, '0')).join('') + '@hisar.invalid';
  const hesap = (id, ad, sifre, meta) => ({ id: 'aa000000-0000-4000-8000-00000000000' + id, email: alias(ad), sifre, meta });
  const H = [
    hesap(1, '905551112233', 'Personel-sifre-1', { hisar_active: true, hisar_role: 'personnel', hisar_unit_id: 'u1', hisar_name: 'Sentetik Er', hisar_unit_name: 'Sentetik 1. Takım', hisar_person_id: 101 }),
    hesap(2, 'komutan1', 'Komutan-sifre-1', { hisar_active: true, hisar_role: 'takim', hisar_unit_id: 'u1', hisar_name: 'Sentetik Komutan', hisar_unit_name: 'Sentetik Bölük', hisar_person_id: 100 }),
    hesap(3, 'pasif1', 'Pasif-sifre-123', { hisar_active: false, hisar_role: 'personnel', hisar_unit_id: 'u1', hisar_name: 'Sentetik Pasif' }),
    hesap(4, '905559998877', 'Personel-sifre-2', { hisar_active: true, hisar_role: 'personnel', hisar_unit_id: 'u1', hisar_name: 'Sentetik İki', hisar_unit_name: 'Sentetik 2. Takım', hisar_person_id: 102 }),
  ];
  const KISI = [{ person_id: 101, full_name: 'Sentetik Er', rank: 'Er', unit: 'Sentetik 1. Takım' }, { person_id: 102, full_name: 'Sentetik İki', rank: 'Er', unit: 'Sentetik 2. Takım' }];
  const S = { oturumlar: [], cagri: [], kurulmadi: false, sure: 3600, jeton: new Map(), yenileme: new Map(), yenilendi: 0, cikis: 0 };
  const ver = h => { const a = 'a' + Math.random().toString(36).slice(2), r = 'r' + Math.random().toString(36).slice(2); S.jeton.set(a, h); S.yenileme.set(r, h); return { access_token: a, refresh_token: r, expires_in: S.sure, token_type: 'bearer' }; };
  const ALAN = ['client_id', 'drill', 'drill_name', 'weapon', 'weapon_name', 'mode', 'hand', 'started_at', 'duration_s', 'shot_count', 'avg_score', 'best_score', 'good_count', 'causes', 'systematic', 'app_version'];
  const srv = http.createServer((req, res) => {
    const yaz = (st, b) => { res.writeHead(st, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'apikey, authorization, content-type, prefer', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Content-Type': 'application/json' }); res.end(b === undefined ? '' : JSON.stringify(b)); };
    if (req.method === 'OPTIONS') return yaz(204);
    let govde = ''; req.on('data', c => govde += c); req.on('end', () => {
      const u = new URL(req.url, 'http://x'), b = govde ? JSON.parse(govde) : null, jt = (req.headers.authorization || '').replace(/^Bearer /, ''), h = S.jeton.get(jt);
      S.cagri.push({ m: req.method, p: u.pathname, q: u.search, apikey: req.headers.apikey, h: h && h.id });
      if (u.pathname === '/auth/v1/token' && u.searchParams.get('grant_type') === 'password') {
        const x = H.find(x => x.email === b.email && x.sifre === b.password); return x ? yaz(200, ver(x)) : yaz(400, { error: 'invalid_grant', error_description: 'Invalid login credentials' }); }
      if (u.pathname === '/auth/v1/token' && u.searchParams.get('grant_type') === 'refresh_token') {
        const x = S.yenileme.get(b.refresh_token); if (!x) return yaz(400, { error: 'invalid_grant' }); S.yenileme.delete(b.refresh_token); S.yenilendi++; return yaz(200, ver(x)); }
      if (u.pathname === '/auth/v1/logout') { S.cikis++; if (jt) S.jeton.delete(jt); return yaz(204); }
      if (!h) return yaz(401, { message: 'JWT expired', code: 'PGRST301' });
      if (u.pathname === '/auth/v1/user') return yaz(200, { id: h.id, app_metadata: h.meta });
      if (u.pathname === '/rest/v1/hisar_tetik_sessions' && req.method === 'POST') {
        if (S.kurulmadi) return yaz(404, { code: 'PGRST205', message: "Could not find the table 'public.hisar_tetik_sessions' in the schema cache" });
        if (!h.meta.hisar_active) return yaz(403, { code: '42501', message: 'Hesabınız henüz birliğe atanmadı' });
        const fazla = Object.keys(b).filter(k => !ALAN.includes(k)); if (fazla.length) return yaz(401, { code: '42501', message: 'permission denied for column ' + fazla[0] });
        if (!(b.shot_count >= 1 && b.avg_score <= b.best_score && b.good_count <= b.shot_count && Array.isArray(b.causes) && b.causes.length <= 3)) return yaz(400, { code: '23514', message: 'check violation' });
        if (!S.oturumlar.some(o => o.user_id === h.id && o.client_id === b.client_id)) S.oturumlar.push(Object.assign({}, b, { user_id: h.id, person_id: h.meta.hisar_person_id || null }));
        return yaz(201); }
      if (u.pathname === '/rest/v1/rpc/hisar_tetik_ozet') {
        if (!KOMUTAN.includes(h.meta.hisar_role)) return yaz(403, { code: '42501', message: 'Komutan yetkisi gerekli' });
        return yaz(200, KISI.map(k => { const o = S.oturumlar.filter(x => x.person_id === k.person_id), at = o.reduce((a, x) => a + x.shot_count, 0);
          return Object.assign({}, k, { oturum: o.length, atis: at, ortalama: at ? Math.round(o.reduce((a, x) => a + x.avg_score * x.shot_count, 0) / at * 10) / 10 : null, son: o.length ? o.map(x => x.started_at).sort().pop() : null, sik: o.length && o[0].causes[0] ? o[0].causes[0].ad : null }); })); }
      if (u.pathname === '/rest/v1/hisar_tetik_sessions' && req.method === 'GET') {
        if (!KOMUTAN.includes(h.meta.hisar_role)) return yaz(200, S.oturumlar.filter(o => o.user_id === h.id));
        const pid = +(u.searchParams.get('person_id') || '').replace('eq.', ''); return yaz(200, S.oturumlar.filter(o => o.person_id === pid)); }
      yaz(404, { message: 'yok' });
    });
  });
  return new Promise(r => srv.listen(SB, '127.0.0.1', () => r({ srv, S })));
}

// ---------------------------------------------------------------- yardımcılar
async function waitFor(page, fn, ms, arg) { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await page.evaluate(fn, arg)) return true; await sleep(100); } return false; }
const INIT = `window.__H360={url:'http://127.0.0.1:${SB}'};`;
async function ac(browser, opts = {}) {
  const r = await openApp(browser, Object.assign({ port: PORT, init: [FAKE, INIT] }, opts));
  await r.page.evaluate(() => window.__hisar.selectSource('sensor', true));
  await waitFor(r.page, () => window.__hisar.ble.st === 'bagli' && window.__hisar.ble.recv > 200, 8000);
  await sleep(1500);
  return r;
}
// sahte sensörle n atışlık bir oturum; bitince geçmişe kaydedilir
async function oturum(page, drill, n) {
  await page.evaluate(d => { const H = window.__hisar; H.openDrill(d); H.startRun(); }, drill);
  for (let i = 0; i < n; i++) { await sleep(1700); await page.evaluate(i => { const F = window.__fake; F.addShot(F.head + 100, { dx: 0.06 + i * 0.01, dy: -0.04 }); }, i); }
  await sleep(1400); await page.evaluate(() => window.__hisar.stopRun()); await sleep(1800);
  return page.evaluate(() => { const s = window.__hisar.cur.sess; return { id: s.id, n: s.shots.length, kayit: window.__hisar.sessions.includes(s) }; });
}
const giris = (page, ad, sifre) => page.evaluate(async ([a, s]) => { try { const u = await window.__hisar.h360Giris(a, s); return { u }; } catch (e) { return { hata: e.message }; } }, [ad, sifre]);

(async () => {
  const srv = await serve(PORT); const { srv: sb, S } = await sahteH360(); const browser = await chromium.launch();

  section('Giriş: Hisar 360 ile aynı ad dönüşümü, yanlış şifre, pasif hesap');
  {
    const { ctx, page, errs } = await openApp(browser, { port: PORT, init: [INIT] });
    const al = await page.evaluate(() => { const H = window.__hisar; return { tel: H.h360Adlar('0555 111 22 33'), tel2: H.h360Adlar('+90 555 111 2233'), kisa: H.h360Adlar('5551112233'), ad: H.h360Alias('Komutan1'), e: H.h360Alias('a@b.com') }; });
    check(JSON.stringify(al.tel) === JSON.stringify(['905551112233', '05551112233', '5551112233']) && JSON.stringify(al.tel2) === JSON.stringify(al.tel) && JSON.stringify(al.kisa) === JSON.stringify(al.tel)
      && al.ad === '6b6f6d7574616e31@hisar.invalid' && al.e === 'a@b.com', 'Telefon (0555…, +90…, 555…) ve kullanıcı adı Hisar 360 ile aynı giriş adına dönüşüyor', al);
    const mz = await page.evaluate(() => document.getElementById('mzH3').innerText);
    check(/Hisar 360 hesabıyla giriş yap/.test(mz), 'Kontrol Merkezi\'nde "Hisar 360 hesabıyla giriş yap" kartı var', mz);
    const y = await giris(page, '0555 111 22 33', 'yanlis-sifre-000');
    const p = await giris(page, 'pasif1', 'Pasif-sifre-123');
    const st = await page.evaluate(() => ({ user: window.__hisar.h360.user, k: localStorage.getItem('hisarTetik.v2.h360') }));
    check(/yanlış/.test(y.hata || '') && /henüz birliğe ve yetkiye atanmadı/.test(p.hata || '') && !st.user && !st.k, 'Yanlış şifre ve pasif hesap girişte reddediliyor; jeton saklanmıyor', { y, p, st });
    // form ile giriş: telefon başında 0 ile
    await page.evaluate(() => window.__hisar.openSettings('hesap')); await sleep(200);
    await page.fill('#h3Ad', '0555 111 22 33'); await page.fill('#h3Sifre', 'Personel-sifre-1'); await page.click('#h3Gir');
    await waitFor(page, () => !!window.__hisar.h360.user, 4000);
    const g = await page.evaluate(() => ({ u: window.__hisar.h360.user, k: JSON.parse(localStorage.getItem('hisarTetik.v2.h360') || 'null'), sayfa: document.getElementById('pgBody').innerText }));
    check(g.u && g.u.name === 'Sentetik Er' && g.u.role === 'personnel' && !g.u.komutan && g.k && g.k.auth && g.k.auth.access_token && /Sentetik 1\. Takım/.test(g.sayfa) && !/Birlik sonuçları/.test(g.sayfa),
      'Formdan telefonla giriş: ad, rol ve birlik görünüyor; personelde "Birlik sonuçları" yok', { u: g.u, sayfa: g.sayfa.slice(0, 200) });
    check(S.cagri.filter(c => c.p.startsWith('/auth') || c.p.startsWith('/rest')).every(c => c.apikey === 'sb_publishable_AJt-yr-U1b8562XtnOT27w_BghK61Be'), 'Her istekte yalnız Hisar 360\'ın yayımlanabilir anahtarı gidiyor');
    const yedek = await page.evaluate(async () => { let blob = null; const eski = URL.createObjectURL;
      URL.createObjectURL = b => { blob = b; return eski.call(URL, b); }; window.__hisar.showView('menu'); document.getElementById('mnYedek').click(); URL.createObjectURL = eski;
      return blob ? await blob.text() : null; });
    check(!!yedek && yedek.includes('"app":"hisar-tetik"') && !/access_token|refresh_token|Personel-sifre/.test(yedek), 'Dışa aktarılan yedekte (Menü › Şimdi yedekle) jeton ve şifre yok', (yedek || '').length);
    check(!errs.length, 'Sayfa hatası yok', errs.slice(0, 5));
    await ctx.close();
  }

  section('Oturum özeti Hisar 360\'a gidiyor (yalnız özet, bir kez)');
  {
    const { ctx, page, errs } = await ac(browser);
    await giris(page, '05551112233', 'Personel-sifre-1');
    const o = await oturum(page, 'serbest', 4);
    await waitFor(page, () => !window.__hisar.h360.gonderiyor, 3000); await sleep(300);
    const g = S.oturumlar.find(x => x.client_id === o.id.replace(/[^A-Za-z0-9_-]/g, ''));
    const anahtarlar = g ? Object.keys(g).filter(k => !['user_id', 'person_id'].includes(k)).sort() : [];
    check(o.kayit && o.n >= 3 && g && g.shot_count === o.n && g.drill === 'serbest' && g.drill_name === 'Serbest Antrenman' && g.weapon === 'pistol' && g.mode === 'kuru' && g.app_version >= 31
      && g.person_id === 101 && Array.isArray(g.causes) && g.causes.length <= 3 && g.avg_score <= g.best_score,
      `Oturum bitince özet gitti: ${g ? g.shot_count : 0} atış, ortalama ${g ? g.avg_score : '–'}`, g);
    check(JSON.stringify(anahtarlar) === JSON.stringify(['app_version', 'avg_score', 'best_score', 'causes', 'client_id', 'drill', 'drill_name', 'duration_s', 'good_count', 'hand', 'mode', 'shot_count', 'started_at', 'systematic', 'weapon', 'weapon_name']),
      'Özette yalnız izin verilen alanlar var (ham veri, not, iz yok)', anahtarlar);
    const once = S.oturumlar.length;
    await page.evaluate(() => { const H = window.__hisar; H.h360Kuyruk(H.cur.sess); }); await sleep(800);
    check(S.oturumlar.length === once && await page.evaluate(() => JSON.parse(localStorage.getItem('hisarTetik.v2.h360q') || '[]').length) === 0, 'Aynı oturum yeniden gönderilince çift kayıt olmuyor, kuyruk boşalıyor');
    // deneme modu ve Kaygısız Deneme gitmez
    const k1 = S.oturumlar.length;
    const ks = await oturum(page, 'safespace', 2);
    const demo = await page.evaluate(() => { const H = window.__hisar, s = { id: 'sdemo1', drill: 'serbest', src: 'demo', date: Date.now(), dur: 9, mode: 'kuru', weapon: 'pistol', hand: 'R', shots: [{ n: 1, sc: 90, c: [], x: {} }] }; return H.h360Kuyruk(s); });
    await sleep(800);
    check(ks.kayit && S.oturumlar.length === k1 && demo === false, 'Kaygısız Deneme ve deneme modu oturumları gönderilmiyor', { ks, demo, n: S.oturumlar.length });
    check(!errs.length, 'Sayfa hatası yok', errs.slice(0, 5));
    await ctx.close();
  }

  section('İnternet yokken kuyruk; Hisar 360\'ta tablo yokken bekleme; jeton yenileme');
  {
    const { ctx, page, errs } = await ac(browser);
    await giris(page, '5551112233', 'Personel-sifre-1');
    await ctx.setOffline(true); await sleep(200);
    const o = await oturum(page, 'serbest', 3);
    const bk = await page.evaluate(() => ({ q: JSON.parse(localStorage.getItem('hisarTetik.v2.h360q') || '[]').length, mz: (window.__hisar.showView('merkez'), document.getElementById('mzH3').innerText) }));
    const k0 = S.oturumlar.length;
    await ctx.setOffline(false); await sleep(1500);
    const sonra = await page.evaluate(() => JSON.parse(localStorage.getItem('hisarTetik.v2.h360q') || '[]').length);
    check(bk.q === 1 && /1 özet gönderilmeyi bekliyor/.test(bk.mz) && sonra === 0 && S.oturumlar.length === k0 + 1 && S.oturumlar.some(x => x.client_id === o.id),
      'İnternet yokken özet kuyrukta bekliyor (Kontrol Merkezi\'nde yazıyor), internet gelince gidiyor', { bk, sonra });
    // tablo kurulmamış: kuyrukta kalır, hesap sayfası açıklar; kurulunca gider
    S.kurulmadi = true;
    await oturum(page, 'serbest', 3); await sleep(600);
    await page.evaluate(() => window.__hisar.openSettings('hesap')); await sleep(250);
    const kr = await page.evaluate(() => ({ q: JSON.parse(localStorage.getItem('hisarTetik.v2.h360q') || '[]').length, t: document.getElementById('pgBody').innerText, d: window.__hisar.h360.durum }));
    S.kurulmadi = false;
    await page.click('#h3Simdi'); await sleep(1200);
    const kr2 = await page.evaluate(() => JSON.parse(localStorage.getItem('hisarTetik.v2.h360q') || '[]').length);
    check(kr.q === 1 && kr.d === 'kurulmadi' && /henüz kurulmadı/.test(kr.t) && kr2 === 0, 'Hisar 360\'ta tablo yokken özet kaybolmuyor, açıklama görünüyor; kurulunca "Şimdi gönder" ile gidiyor', { kr, kr2 });
    // jeton süresi dolmuş: yenilenir, gönderim sürer
    const y0 = S.yenilendi;
    await page.evaluate(() => { window.__hisar.h360.auth.expires_at = Math.floor(Date.now() / 1000) - 10; });
    await oturum(page, 'serbest', 3); await sleep(800);
    check(S.yenilendi === y0 + 1 && await page.evaluate(() => JSON.parse(localStorage.getItem('hisarTetik.v2.h360q') || '[]').length) === 0, 'Süresi dolan jeton yenileniyor, özet gidiyor');
    check(!errs.length, 'Sayfa hatası yok', errs.slice(0, 5));
    await ctx.close();
  }

  section('Çıkış; başka hesap öncekinin kuyruğunu göndermez; yeniden açılışta oturum sürer');
  {
    const { ctx, page, errs } = await ac(browser);
    await giris(page, '05551112233', 'Personel-sifre-1');
    await ctx.setOffline(true);
    const o = await oturum(page, 'serbest', 3);
    await page.evaluate(() => window.__hisar.h360Cikis()); await ctx.setOffline(false); await sleep(300);
    const c = await page.evaluate(() => ({ u: window.__hisar.h360.user, k: localStorage.getItem('hisarTetik.v2.h360'), q: JSON.parse(localStorage.getItem('hisarTetik.v2.h360q') || '[]').length, mz: (window.__hisar.showView('merkez'), document.getElementById('mzH3').innerText) }));
    check(!c.u && !c.k && c.q === 1 && /giriş yap/.test(c.mz) && S.cikis >= 1, 'Çıkış: jeton silindi, Hisar 360\'a çıkış bildirildi; bekleyen özet hesaba bağlı olarak kaldı', c);
    await giris(page, '05559998877', 'Personel-sifre-2'); await sleep(1000);
    check(!S.oturumlar.some(x => x.client_id === o.id), 'Başka hesapla girilince önceki hesabın bekleyen özeti onun adına gönderilmiyor');
    await giris(page, '05551112233', 'Personel-sifre-1'); await sleep(1000);
    check(S.oturumlar.some(x => x.client_id === o.id && x.person_id === 101), 'Aynı hesapla yeniden girince bekleyen özet doğru kişi adına gidiyor');
    await page.reload(); await page.waitForFunction(() => !!window.__hisar); await page.evaluate(() => window.__hisar.hideSplash()); await sleep(800);
    const r = await page.evaluate(() => ({ u: window.__hisar.h360.user, mz: (window.__hisar.showView('merkez'), document.getElementById('mzH3').innerText) }));
    check(r.u && r.u.name === 'Sentetik Er' && /Sentetik Er/.test(r.mz), 'Uygulama yeniden açılınca Hisar 360 oturumu sürüyor', r);
    check(!errs.length, 'Sayfa hatası yok', errs.slice(0, 5));
    await ctx.close();
  }

  section('Komutan: Birlik sonuçları');
  {
    const { ctx, page, errs } = await openApp(browser, { port: PORT, init: [INIT] });
    const g = await giris(page, 'Komutan1', 'Komutan-sifre-1');
    await page.evaluate(() => window.__hisar.openSettings('hesap')); await sleep(200);
    const btn = await page.evaluate(() => !!document.getElementById('h3Birlik'));
    await page.click('#h3Birlik'); await sleep(900);
    const b = await page.evaluate(() => ({ t: document.getElementById('pgBody').innerText, n: document.querySelectorAll('#h3Liste [data-kisi]').length }));
    check(g.u && g.u.komutan && btn && b.n === 2 && /Sentetik Er/.test(b.t) && /Sentetik İki/.test(b.t) && /2 personel/.test(b.t),
      'Komutan girişinde "Birlik sonuçları": kapsamdaki personel, oturum ve atış sayıları', b.t.slice(0, 300));
    await page.click('#h3Liste [data-kisi="101"]'); await sleep(900);
    const k = await page.evaluate(() => document.getElementById('pgBody').innerText);
    check(/Serbest Antrenman/.test(k), 'Personele dokununca son oturumları listeleniyor', k.slice(0, 200));
    await page.evaluate(() => { window.__hisar.h360Cikis(); }); await sleep(200);
    const pg = await giris(page, '05559998877', 'Personel-sifre-2');
    await page.evaluate(() => window.__hisar.openSettings('birlik')); await sleep(800);
    const pt = await page.evaluate(() => document.getElementById('pgBody').innerText);
    check(pg.u && !pg.u.komutan && /yalnız komutanlar/.test(pt), 'Personel Birlik sonuçlarını göremiyor (Hisar 360 reddediyor, açıklama görünüyor)', pt.slice(0, 200));
    check(!errs.length, 'Sayfa hatası yok', errs.slice(0, 5));
    await ctx.close();
  }

  await browser.close(); srv.close(); sb.close();
  process.exit(finish('Hisar 360 hesabı testi') ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
