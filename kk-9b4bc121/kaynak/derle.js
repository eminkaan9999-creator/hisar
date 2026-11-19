#!/usr/bin/env node
// Kaan & Kardelen derleyicisi
// kaynak/ klasöründeki parçaları (sayfa.html + stil.css + js/*.js + varlik/) tek bir index.html dosyasında birleştirir.
// Ek paket gerekmez, yalnızca Node.js (16 veya üstü) yeter.
//
//   node kaynak/derle.js                              -> ../index.html ve ../surum.json yazılır (yeni sürüm numarasıyla)
//   node kaynak/derle.js --surum 2026.11.03-180104    -> belirli bir sürüm numarasıyla derler
//   node kaynak/derle.js --cikti /tmp/dene.html       -> yayındaki dosyaya dokunmadan başka bir yere yazar (surum.json yazılmaz)
//
// Uygulamadaki "Güncelle" düğmesi surum.json'daki numara değişince çıkar; yayınlamak için derleyip depoya göndermek yeter.
"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm");

const KAYNAK = __dirname, KLASOR = path.join(__dirname, "..");

// JS parçaları tek bir (function(){ … })() bloğunun parçalarıdır: cekirdek.js bloğu açar, akis.js kapatır.
// Bu yüzden sıra önemlidir. Yeni bir bölüm dosyası eklerseniz buraya, anilar.js'ten önce yazın.
const SIRA = [
  "cekirdek.js", "ortam.js", "bitki.js", "avatar.js", "uniforma.js", "giysi.js", "kamera.js", "ozellik.js", "hikaye.js",
  "bolum0.js", "bolum0_kis.js", "bolum1.js", "bolum2.js", "bolum3.js", "bolum4.js", "bolum5.js", "bolum6.js",
  "bolum3_atv.js", "bolum_ankara.js", "bolum_bileklik.js", "bolum_kus.js", "bolum_uzunyol.js", "bolum_diploma.js",
  "bolum_bekleyemedim.js", "bolum_nisan.js", "hayat_ag.js", "bolum_hayat.js", "anilar.js", "akis.js",
];

// three.js r128 ek dosyaları (lib/ klasöründe duruyor)
const KUTUPHANE = ["CopyShader.js", "LuminosityHighPassShader.js", "EffectComposer.js", "RenderPass.js", "ShaderPass.js",
  "UnrealBloomPass.js", "Water.js", "GLTFLoader.js", "SkeletonUtils.js", "meshopt_decoder.js"];

// three.js r128'in kendisi: deponun kökündeki ortak dosya (aynı depodaki başka uygulamalar da kullanıyor)
const THREE_YOLU = "../three.min.js";

const arg = ad => { const i = process.argv.indexOf(ad); return i > 1 ? process.argv[i + 1] : null; };
const oku = f => fs.readFileSync(path.join(KAYNAK, f), "utf8").replace(/\r\n/g, "\n"); // Windows satır sonları da sorun olmasın
const hepsiniDegistir = (metin, ne, neyle) => metin.split(ne).join(neyle);
const hata = m => { console.error(m); process.exit(1); };

const iki = n => String(n).padStart(2, "0"), t = new Date();
const SURUM = arg("--surum") || `${t.getFullYear()}.${iki(t.getMonth() + 1)}.${iki(t.getDate())}-${iki(t.getHours())}${iki(t.getMinutes())}${iki(t.getSeconds())}`;
const CIKTI = arg("--cikti") ? path.resolve(arg("--cikti")) : path.join(KLASOR, "index.html");

// eksik ya da listede olmayan parça var mı
const klasordekiler = fs.readdirSync(path.join(KAYNAK, "js")).filter(f => f.endsWith(".js"));
const eksik = SIRA.filter(f => !klasordekiler.includes(f));
if (eksik.length) hata("Eksik parça: " + eksik.join(", "));
const fazla = klasordekiler.filter(f => !SIRA.includes(f));
if (fazla.length) console.warn("Uyarı: SIRA listesinde olmadığı için derlenmeyen dosya: " + fazla.join(", "));

const betikler = SIRA.map(f => oku("js/" + f)).join("");

// sözdizimi denetimi: bozuk bir derleme yayına gitmesin
const satirIci = [...betikler.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).join("\n");
try { new vm.Script(satirIci, { filename: "kaan-kardelen.js" }); }
catch (e) { hata("SÖZDİZİMİ HATASI: " + e.message + "\n" + String(e.stack || "").split("\n").slice(0, 3).join("\n")); }

let sayfa = oku("sayfa.html").replace(/\s+$/, "");
for (const isaret of ["/*@@STIL@@*/", "<!--@@BETIKLER@@-->"]) if (sayfa.split(isaret).length !== 2) hata("sayfa.html içinde " + isaret + " işareti tam bir kez bulunmalı");
const stil = [oku("stil.css"), oku("gorsel-iyilestirme.css")].join("\n").replace(/\s+$/, "");
sayfa = sayfa.split("/*@@STIL@@*/").join(stil).split("<!--@@BETIKLER@@-->").join(betikler);

const suNormal = fs.readFileSync(path.join(KAYNAK, "varlik", "su_normal.jpg")).toString("base64"); // deniz dalgası dokusu sayfaya gömülür
sayfa = hepsiniDegistir(sayfa, "__SURUM__", SURUM);
sayfa = hepsiniDegistir(sayfa, "__THREE__", THREE_YOLU);
sayfa = hepsiniDegistir(sayfa, "__EKLIB__", KUTUPHANE.map(f => `<script src="lib/${f}"></script>`).join("\n"));
sayfa = hepsiniDegistir(sayfa, "__SUNORMAL__", suNormal);

fs.writeFileSync(CIKTI, sayfa, "utf8");
if (!arg("--cikti")) fs.writeFileSync(path.join(KLASOR, "surum.json"), `{"surum": "${SURUM}"}`);
console.log(`Derlendi: ${path.relative(process.cwd(), CIKTI) || CIKTI}  (${(Buffer.byteLength(sayfa) / 1024).toFixed(0)} KB, sürüm ${SURUM})`);
