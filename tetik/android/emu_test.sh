#!/usr/bin/env bash
# Android emülatöründe açılış, gezinme ve uygulama içi güncelleme testi (GitHub Actions'ta çalışır).
# Uygulamayı kurar, sayfaları açar, ekran görüntüsü alır; çökme ya da sayfa hatası varsa başarısız olur.
set -u
APK=tetik/android/build/HisarTetik.apk
OUT=emu_out; mkdir -p "$OUT"
A="com.hisar.tetik/.MainActivity"
shot() { sleep "$2"; adb exec-out screencap -p > "$OUT/$1.png"; echo "ekran: $1"; }
go() { adb shell am start -n "$A" --es sayfa "$1" >/dev/null; }
adb shell settings put global window_animation_scale 0 >/dev/null 2>&1 || true
adb install -r -g "$APK" | tail -1
adb logcat -c
adb shell am start -W -n "$A" | tail -3
shot 01_acilis 12
go "alistirma/serbest/basla"; shot 02_oturum 12
go "gecmis"; shot 03_gecmis 4
go "ayarlar"; shot 04_ayarlar 3
go "ayarlar/baglanti"; shot 05_baglanti 3
go "ayarlar/montaj"; shot 06_montaj 3
go "ayarlar/uygulama"; shot 07_uygulama 3
go "kaynak/sensor"; shot 08_sensor_ara 6
adb shell input keyevent 4; sleep 1; shot 09_geri 2
adb shell input keyevent 4; sleep 1; adb shell input keyevent 4; sleep 2
shot 10_arka_plan 1
adb shell am start -n "$A" >/dev/null; shot 11_geri_donus 4
# Uygulama içi güncelleme: GitHub Pages'teki Android sayfası (tetik/apk/index.html) indirilip kurulur, sayfa yenilenir.
# Pages yayını bu derlemeyle aynı anda yapılıyor: bu sürümün sayfası Pages'te görünene kadar (en çok ~7 dk) beklenir.
V=$(grep -o 'const VER=[0-9]*' tetik/src/app.html | head -1 | grep -o '[0-9]*$')
U=https://eminkaan9999-creator.github.io/hisar/tetik/apk/index.html
pg=0; for i in $(seq 1 42); do if curl -fsSL "$U?t=$(date +%s%N)" 2>/dev/null | grep -q "const VER=$V;"; then pg=1; break; fi; sleep 10; done
if [ $pg = 1 ]; then
  adb shell am start -n "$A" --ez guncelle true >/dev/null; shot 12_guncellendi 15
  go "gecmis"; shot 13_guncel_gecmis 4
else
  echo "::warning::Pages'te sürüm $V Android sayfası görünmedi; uygulama içi güncelleme denenmedi"
fi
adb shell dumpsys window | grep -E "mCurrentFocus" | head -2 > "$OUT/odak.txt" || true
adb logcat -d > "$OUT/logcat_tam.txt"
grep -E "HisarTetik|HisarBle|AndroidRuntime|chromium" "$OUT/logcat_tam.txt" > "$OUT/logcat.txt" || true
rc=0
if grep -q "FATAL EXCEPTION" "$OUT/logcat_tam.txt"; then echo "::error::Uygulama çöktü"; grep -A 25 "FATAL EXCEPTION" "$OUT/logcat_tam.txt" | head -40; rc=1; fi
if grep -E "HisarTetik.*js ERROR|Uncaught" "$OUT/logcat.txt" | grep -v "fonts.googleapis" | head -5 | grep -q .; then
  echo "::error::Sayfada hata"; grep -E "js ERROR|Uncaught" "$OUT/logcat.txt" | head -10; rc=1; fi
if [ $pg = 1 ]; then
  if grep -q "sayfa güncellendi: $V" "$OUT/logcat_tam.txt"; then echo "uygulama içi güncelleme: tamam (sürüm $V indirildi ve kuruldu)"
  else echo "::error::Uygulama içi güncelleme olmadı"; grep -E "sayfa" "$OUT/logcat.txt" | tail -10; rc=1; fi
fi
grep -E "HisarTetik|HisarBle" "$OUT/logcat.txt" | tail -40
exit $rc
