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
const source = fs.readFileSync(path.join(__dirname, 'enhance.js'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, 'enhance.css'), 'utf8');
new vm.Script(source);
assert(!/<\/script/i.test(source), 'Embedded script cannot contain a closing script tag');
// Remove the managed build first, then migrate an identical earlier unmarked prototype.
html = html.replace(/\/\* ECZA_ENHANCE_START \*\/[\s\S]*?\/\* ECZA_ENHANCE_END \*\/\s*/, '');
if (html.includes(source.trim())) html = html.replace(source.trim(), '');
assert(!html.includes('const originalHome = vAra;'), 'Unrecognized duplicate enhancement; inspect before publishing');
html = html.replace(/<style>\s*\/\* Kardelen v7 — responsive controls and improved readability \*\/[\s\S]*?<\/style>\s*/, '');
const polish = `
(() => {
  // Refresh filtered results when returning from a card whose favorite state changed.
  const apply = uygula;
  uygula = function () {
    const y = $('#view').scrollTop;
    apply();
    if (S.tab === 'ara' && S.q.trim() && !S.stack.length) {
      render(); $('#view').scrollTop = y;
    }
  };
  // Keep the percentage in sync after the original two-finger gesture.
  $('#bakis').addEventListener('touchend', () => {
    if (!S.foto || !$('#ux-zoom-value')) return;
    $('#ux-zoom-value').textContent = Math.round(S.foto.zoom * 100) + '%';
    $('[data-ux="zoom-out"]').disabled = S.foto.zoom <= 1;
    $('[data-ux="zoom-in"]').disabled = S.foto.zoom >= 4;
  }, { passive: true });
})();
`;
const block = '/* ECZA_ENHANCE_START */\n' + source + '\n' + polish + '\n/* ECZA_ENHANCE_END */';
const marker = '/* ---------- başlangıç ---------- */';
assert.equal(html.split(marker).length, 2, 'Expected exactly one boot marker');
html = html.replace(marker, block + '\n\n' + marker);
assert.equal(html.split('const originalHome = vAra;').length, 2, 'Exactly one enhancement instance required');

const bloomJS = fs.readFileSync(path.join(__dirname, 'bloom.js'), 'utf8');
const bloomCSS = fs.readFileSync(path.join(__dirname, 'bloom.css'), 'utf8');
new vm.Script(bloomJS);
assert(!bloomJS.includes('</script'), 'Bloom script must not close the script tag');
html = html.replace(/\/\* ECZA_BLOOM_START \*\/[\s\S]*?\/\* ECZA_BLOOM_END \*\/\s*/, '');
const bloomBlock = '/* ECZA_BLOOM_START */\n' + bloomJS + '\n/* ECZA_BLOOM_END */';
assert.equal(html.split('/* ---------- başlangıç ---------- */').length, 2, 'Boot marker missing');
html = html.replace('/* ---------- başlangıç ---------- */', bloomBlock + '\n/* ---------- başlangıç ---------- */');
const bloomStyle = '<style id="ecza-bloom-style">\n' + bloomCSS + '\n</style>';
if (html.includes('id="ecza-bloom-style"')) html = html.replace(/<style id="ecza-bloom-style">[\s\S]*?<\/style>/, bloomStyle);
else html = html.replace('</head>', bloomStyle + '\n</head>');

const style = '<style id="ecza-enhance-style">\n' + css + '\n</style>';
if (html.includes('id="ecza-enhance-style"')) html = html.replace(/<style id="ecza-enhance-style">[\s\S]*?<\/style>/, style);
else html = html.replace('</head>', style + '\n</head>');
const guardSource = fs.readFileSync(path.join(__dirname, 'startup-recovery.js'), 'utf8');
new vm.Script(guardSource);
assert(!guardSource.includes('</script'), 'Guard cannot close its own script tag');
const guardTag = '<script id="ecza-startup-recovery">\n' + guardSource + '\n</script>';
const guardStart = html.indexOf('<script id="ecza-startup-recovery">');
if (guardStart >= 0) {
  const guardEnd = html.indexOf('</script>', guardStart);
  assert(guardEnd > guardStart, 'Incomplete recovery guard');
  html = html.slice(0, guardStart) + guardTag + html.slice(guardEnd + '</script>'.length);
} else html = html.replace('</head>', guardTag + '\n</head>');
// Sürüm numarası ana derlemenin (build.py) yazdığı surum.json'dan gelir; 8'in altına inmez.
const surumFile = path.join(root, 'surum.json');
const surum = fs.existsSync(surumFile) ? JSON.parse(fs.readFileSync(surumFile, 'utf8')) : {};
const release = Math.max(8, Number(surum.surum) || 0);
let versionFound = false;
html = html.replace(/window\.ECZ\s*=\s*(\{[^;]+\});/, (_, raw) => {
  const config = JSON.parse(raw);
  assert(Number(config.surum) <= release, 'Refusing to downgrade a newer release');
  config.surum = release; config.tarih = surum.tarih || '10 Kasım 2026'; versionFound = true;
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
if (release > (Number(surum.surum) || 0)) fs.writeFileSync(surumFile, JSON.stringify({ surum: release, tarih: surum.tarih || '10 Kasım 2026', not: surum.not || 'Arama filtreleri ve devam eden sonuçlar; kişisel notlar, güvenli yedek birleştirme, görünüm ayarları, hızlı gezinme ve raf yakınlaştırma kontrolleri.' }) + '\n');
const swFile = path.join(root, 'sw.js');
const sw = fs.readFileSync(swFile, 'utf8');
assert(sw.includes("const KABUK='ecza-kabuk-v2'"), 'Expected v2 cache worker');
new vm.Script(sw);
console.log(JSON.stringify({ version: release, dataSha256: before, inlineScriptsParsed: parsed, preservedData: true, enhancementInstances: 1 }));
