// HİSAR TETİK testleri: ortak yardımcılar (yerel sunucu, tarayıcı, raporlama, paket üretimi)
// Çalıştırma: node tetik/test/<test>.js   (Playwright kurulu olmalı)
'use strict';
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..', '..');          // depo kökü (…/hisar)
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.stl': 'application/octet-stream', '.bin': 'application/octet-stream', '.css': 'text/css' };

function serve(port) {
  return new Promise(res => {
    const srv = http.createServer((q, r) => {
      let p = decodeURIComponent(q.url.split('?')[0]);
      const f = path.join(ROOT, p.endsWith('/') ? p + 'index.html' : p);
      if (!f.startsWith(ROOT)) { r.writeHead(403); r.end(); return; }
      fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); r.end(d); });
    }).listen(port, () => res(srv));
  });
}

let fails = 0, passes = 0;
function check(cond, msg, extra) {
  if (cond) { passes++; console.log('  ✓ ' + msg); }
  else { fails++; console.log('  ✗ ' + msg + (extra !== undefined ? '  → ' + JSON.stringify(extra) : '')); }
  return !!cond;
}
function section(t) { console.log('\n' + t); }
function finish(name) {
  console.log(`\n${name}: ${passes} geçti, ${fails} başarısız`);
  return fails;
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function openApp(browser, { port, url = '/tetik/', viewport = { width: 390, height: 844 }, init = [], storage = null, dsf = 1 } = {}) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: dsf, serviceWorkers: 'block' });
  for (const s of init) await ctx.addInitScript(s);
  if (storage) await ctx.addInitScript(st => { try { for (const [k, v] of Object.entries(st)) localStorage.setItem(k, v); } catch (e) {} }, storage);
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.googleapis|ERR_|net::|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await page.goto(`http://localhost:${port}${url}`);
  await page.waitForFunction(() => !!window.__hisar, null, { timeout: 15000 });
  return { ctx, page, errs };
}

// Sensör yazılımındaki (HisarProtocol.h) ile aynı formüller
function sampleFor(seq) {
  const v = [];
  for (let i = 0; i < 6; i++) v.push(((seq * 37 + i * 5003) % 60000) - 30000);
  return { v, jerk: (seq * 13) % 251, snd: (seq * 7) % 254 };
}
function encJerk(g) { if (g <= 0) return 0; if (g <= 8) return Math.min(200, Math.round(g / 0.04)); return Math.min(255, 200 + Math.round((g - 8) / 0.9)); }
function decJerk(v) { return v <= 200 ? v * 0.04 : 8 + (v - 200) * 0.9; }

module.exports = { ROOT, serve, check, section, finish, sleep, openApp, sampleFor, encJerk, decJerk, chromium, fs, path };
