// Tetik v28 kayıtlarının yeni yönetim görünümü ve sentetik stüdyo ile bir arada çalışması.
'use strict';
const assert = require('node:assert/strict');
const { chromium, serve, openApp } = require('./ortak');

const record = { id: 'test-arsiv', date: 1700000000000, shots: [], prof: 'p-test' };
const legacy = {
  'hisarTetik.v2.meta': JSON.stringify({
    v: 2, settings: { profiles: [{ id: 'p-test', ad: 'Eski profil' }], prof: 'p-test' }, ids: [record.id]
  }),
  'hisarTetik.v2.s.test-arsiv': JSON.stringify(record)
};
async function oldRecords(page) {
  return page.evaluate(keys => Object.fromEntries(keys.map(k => [k, localStorage.getItem(k)])), Object.keys(legacy));
}
async function exercise(browser, port, url, width) {
  const { page, ctx, errs } = await openApp(browser, { port, url, viewport: { width, height: 840 }, init: [
    `if (window.top === window && !sessionStorage.getItem("studio-test-seeded")) {
       for (const [key, value] of Object.entries(${JSON.stringify(legacy)})) localStorage.setItem(key, value);
       sessionStorage.setItem("studio-test-seeded", "1");
     }`
  ] });
  try {
    const settings = page.getByRole('tab', { name: 'Ayarlar' });
    await settings.click();
    assert.equal(await page.locator('#profName').innerText(), 'Eski profil');
    assert.equal(await page.locator('#adminLook').inputValue(), 'classic');
    await page.locator('#adminLook').selectOption('light');
    assert.equal(await page.locator('#v-ayarlar').getAttribute('data-admin-look'), 'light');

    await ctx.setOffline(true);
    await page.locator('#rtStudio').click();
    const frame = page.frameLocator('#studioFrame');
    await frame.getByRole('heading', { name: 'Ölçüm paneli', exact: true }).waitFor();
    assert.equal(await frame.getByText('Sentetik veri', { exact: true }).count(), 1);
    assert.ok((await page.locator('#studioFrame').boundingBox()).height > 240);
    assert.equal(await frame.locator('main').evaluate(m => m.ownerDocument.documentElement.scrollWidth <= m.ownerDocument.documentElement.clientWidth),true);
    await frame.getByRole('button', { name: 'Oturum başlat' }).click();
    await frame.getByRole('button', { name: 'Oturumu kaydet' }).click();
    await frame.getByText('Sentetik oturum geçmişe kaydedildi.', { exact: true }).first().waitFor();
    await page.locator('#pgBack').click();
    assert.equal(await page.locator('#studioFrame').count(),0);
    assert.equal(await page.locator('.studio-view').count(),0);
    assert.equal(await page.locator('#profName').innerText(), 'Eski profil');
    await page.locator('#rtStudio').click();
    if (width < 640) await frame.getByRole('button',{ name:'Menü',exact:true }).click();
    await frame.getByRole('link',{name:'Oturum geçmişi',exact:true}).click();
    await frame.getByText('1 yerel kayıt · İstanbul saati').waitFor();
    assert.equal(await page.evaluate(() => window.__hisarBack()),true);
    await page.locator('#profEdit').click();
    assert.equal(await page.locator('#prName').inputValue(), 'Eski profil');
    await page.locator('#pgBack').click();
    assert.equal(await page.evaluate(() => window.__hisar.sessions.filter(s => s.id === 'test-arsiv').length),1);
    assert.deepEqual(await oldRecords(page),legacy);

    await ctx.setOffline(false);
    await page.reload();
    await page.waitForFunction(() => !!window.__hisar);
    await page.evaluate(() => window.__hisar.hideSplash());
    await settings.click();
    assert.equal(await page.locator('#adminLook').inputValue(),'light');
    await page.locator('#adminLook').selectOption('dark');
    assert.equal(await page.locator('#v-ayarlar').getAttribute('data-admin-look'),'dark');
    await page.locator('#adminLook').selectOption('classic');
    assert.equal(await page.locator('#v-ayarlar').getAttribute('data-admin-look'),null);
    assert.deepEqual(await oldRecords(page),legacy);
    assert.deepEqual(errs,[]);
    console.log('PASS', url, width, 'px · tema, çevrimdışı stüdyo, kalıcı demo kaydı, geri dönüş, eski profil ve kayıt');
  } finally { await ctx.close(); }
}
(async () => {
  const srv = await serve(0);
  let browser;
  try {
    browser=await chromium.launch(process.env.CHROME_BIN ? {executablePath:process.env.CHROME_BIN} : {});
    for(const [url,width] of [['/tetik/',390],['/tetik/',1280],['/tetik/apk/index.html',390]]) await exercise(browser,srv.address().port,url,width);
  } finally { if(browser) await browser.close(); srv.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
