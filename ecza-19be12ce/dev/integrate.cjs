'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const file = path.join(root, 'index.html');
let html = fs.readFileSync(file, 'utf8');
const data = s => {
  const m = /<script\b[^>]*id="veri"[^>]*>([\s\S]*?)<\/script>/.exec(s);
  assert(m, 'Original medicine data must be present');
  JSON.parse(m[1]);
  return crypto.createHash('sha256').update(m[1]).digest('hex');
};
const before = data(html);
const js = fs.readFileSync(path.join(__dirname, 'enhance.js'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, 'enhance.css'), 'utf8');
new vm.Script(js);
assert(!/<\/script/i.test(js), 'Embedded script cannot contain a closing script tag');
const start = '/* ECZA_ENHANCE_START */', end = '/* ECZA_ENHANCE_END */';
const block = start + '\n' + js + '\n' + end;
if (html.includes(start)) {
  const a = html.indexOf(start), b = html.indexOf(end, a);
  assert(b > a, 'Incomplete existing enhancement block');
  html = html.slice(0, a) + block + html.slice(b + end.length);
} else {
  const marker = '/* ---------- başlangıç ---------- */';
  assert.equal(html.split(marker).length, 2, 'Expected exactly one boot marker');
  html = html.replace(marker, block + '\n\n' + marker);
}
const style = '<style id="ecza-enhance-style">\n' + css + '\n</style>';
if (html.includes('id="ecza-enhance-style"')) html = html.replace(/<style id="ecza-enhance-style">[\s\S]*?<\/style>/, style);
else html = html.replace('</head>', style + '\n</head>');
let versionFound = false;
html = html.replace(/window\.ECZ\s*=\s*(\{[^;]+\});/, (_, raw) => {
  const config = JSON.parse(raw);
  assert(Number(config.surum) <= 7, 'Refusing to downgrade a newer release');
  config.surum = 7; config.tarih = '10 Kasım 2026'; versionFound = true;
  return 'window.ECZ=' + JSON.stringify(config) + ';';
});
assert(versionFound, 'Missing application version');
assert.equal(data(html), before, 'Clinical/source dataset was altered');
let parsed = 0;
for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
  if (/application\/json/.test(match[1]) || /\bsrc=/.test(match[1])) continue;
  new vm.Script(match[2], { filename: 'index-inline-' + (++parsed) + '.js' });
}
assert(parsed >= 2, 'Expected original executable scripts');
fs.writeFileSync(file, html);
fs.writeFileSync(path.join(root, 'surum.json'), JSON.stringify({ surum: 7, tarih: '10 Kasım 2026', not: 'Arama filtreleri ve devam eden sonuçlar; kişisel notlar, güvenli yedek birleştirme, görünüm ayarları, hızlı gezinme ve raf yakınlaştırma kontrolleri.' }) + '\n');
const swFile = path.join(root, 'sw.js');
let sw = fs.readFileSync(swFile, 'utf8');
const old = "const ILK = ['manifest.webmanifest', 'icon-192.png', 'apple-touch-icon.png'];";
const updated = "const ILK = ['manifest.webmanifest', 'icon-192.png', 'apple-touch-icon.png', 'ux-improvements.css?v=1'];";
assert(sw.includes(old) || sw.includes(updated), 'Unexpected service worker precache definition');
sw = sw.replace(old, updated); new vm.Script(sw); fs.writeFileSync(swFile, sw);
console.log(JSON.stringify({ version: 7, dataSha256: before, inlineScriptsParsed: parsed, preservedData: true }));
