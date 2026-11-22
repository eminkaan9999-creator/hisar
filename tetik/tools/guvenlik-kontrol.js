#!/usr/bin/env node
/* HİSAR Tetik: salt-okunur dağıtım güvenliği kontrolü.
   Çalıştır: node tetik/tools/guvenlik-kontrol.js
   --json ile makinece okunabilir sonuç. Gizli anahtar içeriği asla yazdırılmaz. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const exists = p => fs.existsSync(path.join(root, p));
const read = p => exists(p) ? fs.readFileSync(path.join(root, p), 'utf8') : '';
const findings = [];
function check(id, severity, pass, message, recommendation) {
  findings.push({ id, severity, status: pass ? 'PASS' : 'FAIL', message, recommendation: pass ? undefined : recommendation });
}
const key = 'android/hisar-tetik.p12';
check('TETIK-SEC-01', 'critical', !exists(key),
  'Android APK imzalama anahtarı kaynak ağacında bulunmamalı.',
  'Anahtarı yeni gizli anahtarla güvenli biçimde döndür; eski anahtarın Git geçmişinde kalacağını unutma. Kurulu uygulama güncellemesini önce test et.');
const build = read('android/build.sh');
check('TETIK-SEC-02', 'high', /TETIK_IMZA/.test(build),
  'Android derleme sürecinde gizli imzalama anahtarı desteği bulunmalı.',
  'Derlemeyi GitHub Actions secret üzerinden imzalayacak şekilde düzenle.');
const ios = read('ios/HisarTetik/WebViewController.swift');
check('TETIK-SEC-03', 'medium', !/isInspectable\s*=\s*true/.test(ios) || /#if\s+DEBUG[\s\S]*?isInspectable\s*=\s*true[\s\S]*?#endif/.test(ios),
  'iOS yayın sürümünde WebView denetleme açık olmamalı.',
  'isInspectable özelliğini yalnız DEBUG derlemesinde aç.');
const androidManifest = read('android/app/src/main/AndroidManifest.xml');
check('TETIK-SEC-04', 'medium', !/android:allowBackup\s*=\s*["']true["']/.test(androidManifest),
  'Android uygulama verilerinin sistem yedeğine kontrolsüz açılması engellenmeli.',
  'allowBackup politikasını veri kurtarma ihtiyacını gözeterek sıkılaştır.');
check('TETIK-SEC-05', 'high', exists('src/app.html') && exists('build.py'),
  'Orijinal kaynak ve derleme aracı korunmalı.',
  'Kaynak dosyası veya derleme aracı eksik.');
check('TETIK-SEC-06', 'medium', exists('test/hepsi.sh') || exists('test/hepsi.js'),
  'Otomatik test çalıştırıcısı bulunmalı.',
  'Gerçek test çalıştırıcısı yolunu doğrula ve CI kalite kapısına bağla.');
const failures = findings.filter(f => f.status === 'FAIL');
if (process.argv.includes('--json')) console.log(JSON.stringify({ total: findings.length, failures: failures.length, findings }, null, 2));
else {
  for (const f of findings) console.log(`[${f.status}] ${f.id} (${f.severity}): ${f.message}${f.recommendation ? '\n  Öneri: '+f.recommendation : ''}`);
  console.log(`\n${findings.length} kontrol, ${failures.length} bulgu. Salt okunur; hiçbir dosya değiştirilmedi.`);
}
process.exitCode = failures.length ? 1 : 0;
