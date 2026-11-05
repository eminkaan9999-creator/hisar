// Telefon uygulamalarında yeni sürüm akışı (sahte HisarNative ile):
//  iPhone ve yeni Android uygulaması sayfayı internetten kendisi indirir (HisarNative.update), APK/IPA yeniden kurulmaz;
//  eski Android uygulaması ya da yerel kodu "apkMin"den eski olan Android uygulaması yeni APK indirmeyi önerir.
'use strict';
const { serve, check, section, finish, sleep, openApp, chromium } = require('./ortak');
const PORT = 8792;

const fake = (info, vj) => `
  window.__calls = [];
  window.HisarNative = { info: () => JSON.stringify(${JSON.stringify(info)}), bleKnown: () => '', openUrl: u => window.__calls.push(['openUrl', u]),
    exitApp() {}, keepScreenOn() {}, saveFile() {}, shareFile() {}, bleRequest() {}, bleConnect() {}, bleDisconnect() {}, bleNotify() {}, bleWrite() {},
    update: () => window.__calls.push(['update']) };
  const _f = window.fetch.bind(window);
  window.fetch = (u, o) => /version\\.json/.test(String(u)) ? Promise.resolve(new Response(JSON.stringify(${JSON.stringify(vj)}), { status: 200, headers: { 'Content-Type': 'application/json' } })) : _f(u, o);`;

async function scenario(browser, info, vj) {
  const { ctx, page, errs } = await openApp(browser, { port: PORT, init: [fake(info, vj)] });
  await sleep(2500);                                                    // açılıştaki sürüm denetimi
  const r = { page, ctx, errs };
  r.sheet = await page.evaluate(() => { const sh = document.querySelector('#sheet'); return sh && !sh.hidden ? sh.innerText : ''; });
  r.calls = () => page.evaluate(() => window.__calls);
  r.uyg = async () => { await page.evaluate(() => { const sh = document.querySelector('#sheet'); if (sh && !sh.hidden) { const c = sh.querySelector('[data-close]'); if (c) c.click(); } window.__hisar.openSettings('uygulama'); });
    await sleep(400); return page.evaluate(() => document.querySelector('#pgBody') ? document.querySelector('#pgBody').innerText : ''); };
  return r;
}
const IND = /Yeni sürümü indir|YENİ SÜRÜMÜ İNDİR/;

(async () => {
  const srv = await serve(PORT); const browser = await chromium.launch();
  const VER = await (async () => { const { ctx, page } = await openApp(browser, { port: PORT }); const v = await page.evaluate(() => +document.body.innerHTML.match(/const VER=(\d+)/)[1]); await ctx.close(); return v; })();
  const yeniAndroid = { platform: 'android', versionName: VER + '.0', versionCode: VER * 100, selfUpdate: true };

  section('iPhone uygulaması');
  { const r = await scenario(browser, { platform: 'ios', versionName: '1.0', versionCode: 1 }, { v: 999, not: 'deneme notu', apk: true, apkMin: 999999 });
    const c = await r.calls();
    check(!r.sheet && c.filter(x => x[0] === 'update').length === 1 && !c.some(x => x[0] === 'openUrl'), 'Yeni sürüm sormadan uygulama içinden indiriliyor (apkMin iPhone\'u etkilemez)', { sheet: r.sheet, c });
    check(/iPhone uygulaması olarak yüklü/.test(await r.uyg()), 'Uygulama sayfası iPhone metni');
    await r.page.evaluate(() => window.__hisarUpdateFailed('ağ hatası')); await sleep(150);
    check(/indirilemedi/.test(await r.page.evaluate(() => document.querySelector('#toast').innerText)), 'İndirme hatası bildiriliyor');
    check(!r.errs.length, 'Sayfa hatası yok', r.errs); await r.ctx.close(); }

  section('Yeni Android uygulaması (sayfayı kendisi günceller)');
  { const r = await scenario(browser, yeniAndroid, { v: 999, not: 'deneme notu', apk: true, apkMin: VER * 100 });
    const c = await r.calls();
    check(!r.sheet && c.filter(x => x[0] === 'update').length === 1 && !c.some(x => x[0] === 'openUrl'), 'Yeni sürüm APK indirmeden, uygulama içinden internetle iniyor', { sheet: r.sheet, c });
    const u = await r.uyg();
    check(/Android uygulaması olarak yüklü/.test(u) && /APK'yı yeniden kurman gerekmez/.test(u), 'Uygulama sayfası: yeni sürümler uygulama içinden iner', u.slice(0, 300));
    check(!r.errs.length, 'Sayfa hatası yok', r.errs); await r.ctx.close(); }
  { const r = await scenario(browser, yeniAndroid, { v: VER, not: '', apk: true, apkMin: VER * 100 });
    const c = await r.calls(); const u = await r.uyg();
    check(!r.sheet && !c.length && /kendini yeniler/.test(u), 'Güncelken bir şey yapılmıyor; "uygulama kendini yeniler" yazıyor', { sheet: r.sheet, c });
    await r.ctx.close(); }

  section('Yerel kod değişti: apkMin uygulamadan yeni (bir kez APK gerekir)');
  { const r = await scenario(browser, yeniAndroid, { v: VER, not: 'yerel kod yenilendi', apk: true, apkMin: VER * 100 + 1 });
    check(IND.test(r.sheet) && /bir kez APK kurulması gerekiyor/.test(r.sheet), 'Aynı sayfa sürümünde bile APK indirme öneriliyor', r.sheet);
    await r.page.click('#uGo'); await sleep(300); const c = await r.calls();
    check(c.some(x => x[0] === 'openUrl' && /HisarTetik\.apk/.test(x[1])) && !c.some(x => x[0] === 'update'), 'İndir: APK bağlantısı açılıyor, sayfa indirilmiyor', c);
    await r.ctx.close(); }

  section('Eski Android uygulaması (kendini güncelleyemez)');
  { const r = await scenario(browser, { platform: 'android', versionName: '11.0', versionCode: 1100 }, { v: 999, not: 'deneme notu', apk: true, apkMin: VER * 100 });
    check(IND.test(r.sheet) && /İndirince dosyayı aç/.test(r.sheet), 'Yeni sürümde APK indirme penceresi açılıyor', r.sheet);
    await r.page.click('#uGo'); await sleep(300); const c = await r.calls();
    check(c.some(x => x[0] === 'openUrl' && /HisarTetik\.apk/.test(x[1])) && !c.some(x => x[0] === 'update'), 'APK bağlantısı açılıyor', c);
    check(!/yeniden kurman gerekmez/.test(await r.uyg()), 'Uygulama sayfası iç güncelleme vaat etmiyor');
    await r.ctx.close(); }

  section('Yeni sayfa kuruldu (yerel kod __hisarUpdateReady çağırır)');
  { const r = await scenario(browser, yeniAndroid, { v: VER, not: '', apk: true, apkMin: VER * 100 });
    const p = r.page;
    await p.evaluate(() => { window.__isaret = 1; window.__hisarUpdateReady(999); });
    await p.waitForFunction(() => window.__isaret === undefined && !!window.__hisar, null, { timeout: 8000 }).catch(() => {});
    check(await p.evaluate(() => window.__isaret === undefined && !!window.__hisar), 'Oturum yokken sayfa hemen yenileniyor');
    await p.evaluate(() => window.__hisar.hideSplash());
    await p.evaluate(() => window.__hisar.selectSource('demo')); await sleep(1200);   // deneme kaynağı veri akıtsın
    await p.evaluate(() => { const H = window.__hisar; H.openDrill('serbest'); H.startRun(); }); await sleep(400);
    await p.evaluate(() => { window.__isaret = 2; window.__hisarUpdateReady(999); }); await sleep(1200);
    check(await p.evaluate(() => window.__isaret === 2 && window.__hisar.cur.run && window.__hisar.cur.run.active), 'Oturum sürerken yenilenmiyor (antrenman bölünmez)');
    await p.evaluate(() => window.__hisar.stopRun(false)); await sleep(6000);
    check(await p.evaluate(() => window.__isaret === 2 && window.__hisar.curView === 'oturum'), 'Oturum bitince oturum ekranı açıkken yenilenmiyor (sonuç kaybolmaz)');
    await p.evaluate(() => window.__hisar.showView('alistirma'));
    await p.waitForFunction(() => window.__isaret === undefined && !!window.__hisar, null, { timeout: 9000 }).catch(() => {});
    check(await p.evaluate(() => window.__isaret === undefined && !!window.__hisar), 'Oturum ekranından çıkınca sayfa yenileniyor');
    check(!r.errs.length, 'Sayfa hatası yok', r.errs); await r.ctx.close(); }

  await browser.close(); srv.close();
  process.exit(finish('Uygulama güncelleme testi') ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
