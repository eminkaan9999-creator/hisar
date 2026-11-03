#!/usr/bin/env bash
# HİSAR TETİK: bütün testler. Kullanım: bash tetik/test/hepsi.sh   (depo kökünden ya da herhangi bir yerden)
# Gerekenler: g++, node, Playwright (Chromium). Çıkış kodu: hata varsa 1.
set -u
T="$(cd "$(dirname "$0")" && pwd)"; R="$(cd "$T/../.." && pwd)"; OUT="$(mktemp -d)"; rc=0
echo "== Sensör yazılımı: veri akışı, komutlar, güncelleme (bilgisayarda)"
g++ -std=c++17 -O2 -Wall -Wextra -I"$R/tetik/sensor/HisarSensor" "$R/tetik/sensor/test/akis_testi.cpp" -o "$OUT/akis_testi" && "$OUT/akis_testi" "$OUT" | tail -3 || rc=1
python3 "$R/tetik/build.py" >/dev/null
if command -v javac >/dev/null; then echo "== Android uygulama içi güncelleme (PageStore, masaüstü)"
  bash "$R/tetik/android/test/pagestore_test.sh" > "$OUT/pagestore.log" 2>&1 || { rc=1; grep -E "✗|error|Exception" "$OUT/pagestore.log" | head -20; }
  grep -E "geçti" "$OUT/pagestore.log" | tail -1; fi
for t in teshis_testi.js nisan_dogruluk_testi.js montaj_testi.js uygulama_guncelleme_testi.js protokol_testi.js baglanti_testi.js mikrofon_testi.js alistirma_testi.js ota_testi.js kopru_testi.js; do
  echo "== $t"; AKIS_DIR="$OUT" node "$T/$t" > "$OUT/$t.log" 2>&1 || { rc=1; grep -E "✗|Error" "$OUT/$t.log" | head -20; }
  grep -E "geçti" "$OUT/$t.log" | tail -1
done
exit $rc
