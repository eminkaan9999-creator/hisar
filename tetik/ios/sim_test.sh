#!/usr/bin/env bash
# iPhone simülatöründe açılış testi (GitHub Actions'ta çalışır): uygulamayı kurar, sayfaları açar, ekran görüntüsü alır.
# Başarısız olur: sayfa açılmazsa, köprü kurulmazsa, sayfada JS hatası olursa, uygulama çökerse,
# veriler (localStorage) yeniden açılışta ya da kendini güncellemede kaybolursa.
# Kullanım: bash tetik/ios/sim_test.sh <HisarTetik.app>   (çıktılar: sim_out/)
set -u
APP="$1"
BID=com.hisar.tetik
OUT=sim_out
mkdir -p "$OUT"
rc=0
fail() { echo "::error::$*"; rc=1; }

# en yeni iOS sürümündeki iPhone (tercihen düz "iPhone NN")
UDID=$(xcrun simctl list devices available -j | python3 -c '
import json, re, sys
best = None
for rt, devs in json.load(sys.stdin)["devices"].items():
    m = re.search(r"iOS-(\d+)-(\d+)", rt)
    if not m:
        continue
    v = (int(m.group(1)), int(m.group(2)))
    for d in devs:
        n = d.get("name", "")
        if not n.startswith("iPhone") or not d.get("isAvailable", True):
            continue
        k = (v, 1 if re.fullmatch(r"iPhone \d+", n) else 0, n)
        if best is None or k > best[0]:
            best = (k, d["udid"], n + " / " + rt)
if best:
    print(best[1])
    print("simülatör:", best[2], file=sys.stderr)
')
[ -n "$UDID" ] || { echo "::error::iPhone simülatörü bulunamadı"; xcrun simctl list devices available; exit 1; }
xcrun simctl boot "$UDID" 2>/dev/null || true
xcrun simctl bootstatus "$UDID" -b > /dev/null
xcrun simctl status_bar "$UDID" override --time 9:41 --batteryState charged --batteryLevel 100 2>/dev/null || true
MARK=$(mktemp)   # çökme raporları için zaman işareti
xcrun simctl install "$UDID" "$APP" || { echo "::error::Uygulama simülatöre kurulamadı"; exit 1; }

LOG=""
n0=0
container() { [ -n "$LOG" ] || { local d; d=$(xcrun simctl get_app_container "$UDID" "$BID" data 2>/dev/null) && LOG="$d/Library/Caches/hisar-log.txt"; }; }
newlog() { [ -n "$LOG" ] && tail -n +$((n0 + 1)) "$LOG" 2>/dev/null; }
waitlog() { local i; for i in $(seq 1 "$2"); do container; newlog | grep -E -q -- "$1" && return 0; sleep 1; done; return 1; }
count() { newlog | grep -c -- "$1"; }

# run <ad> <ekran öncesi bekleme sn> [uygulama argümanları...]
run() {
  local name=$1 wait=$2
  shift 2
  xcrun simctl terminate "$UDID" "$BID" > /dev/null 2>&1 || true
  container
  n0=0
  [ -n "$LOG" ] && [ -f "$LOG" ] && n0=$(wc -l < "$LOG" | tr -d ' ')
  echo "== $name $*"
  if ! xcrun simctl launch "$UDID" "$BID" "$@" > /dev/null; then fail "$name: uygulama açılamadı"; return 1; fi
  if ! waitlog "sayfa hazır" 120; then fail "$name: sayfa açılmadı (120 sn)"; newlog | tail -30; return 1; fi
  sleep "$wait"
  xcrun simctl io "$UDID" screenshot "$OUT/$name.png" > /dev/null 2>&1 || true
  newlog | sed 's/^/   /'
}

# 1) ilk açılış: sayfa Documents/www'ye kurulur; köprü, uygulama betiği, yerel yazı tipleri
run 01_acilis 8
line=$(newlog | grep "sayfa hazır" | tail -1)
echo "$line" | grep -q 'title="Hisar Tetik"' || fail "Sayfa başlığı beklenen değil: $line"
echo "$line" | grep -q 'uygulama=evet' || fail "Sayfanın betiği sonuna kadar çalışmadı: $line"
echo "$line" | grep -q 'köprü=function' || fail "navigator.bluetooth köprüsü kurulmadı: $line"
echo "$line" | grep -q '__hn=evet' || fail "bridge.js yüklenmedi: $line"
echo "$line" | grep -q 'yazıtipi=yerel' || echo "::warning::Yazı tipleri uygulamadan değil: $line"
newlog | grep -q "sayfa kuruldu: sürüm" || fail "Sayfa Documents/www'ye kurulmadı"

# 2) yeniden açılış: localStorage kalıcı mı (sayfa açılmadan önce sayılır); Ayarlar › Uygulama
run 02_uygulama 4 -sayfa ayarlar/uygulama
ls0=$(newlog | grep -o 'yerel köprü hazır; localStorage [0-9-]*' | head -1 | grep -o '[0-9-]*$')
[ "${ls0:--1}" -ge 1 ] 2>/dev/null || fail "Yeniden açılışta localStorage boş (${ls0:-?})"

# 3) sensör arama: istek yerel Bluetooth'a ulaşmalı (simülatörde Bluetooth yok; hata dönmesi beklenir)
run 03_sensor_ara 8 -sayfa kaynak/sensor
newlog | grep -q "ble: sensör seçici" || fail "Sensör isteği yerel Bluetooth'a ulaşmadı"
newlog | grep -E -q "ble: [0-9]+ → " || echo "::warning::Simülatörde Bluetooth isteğine yanıt gelmedi (izin sorusu açık kalmış olabilir)"

# 4) dışa aktarma: paylaşım menüsü (HisarNative.saveFile)
run 04_kaydet 6 -sayfa ayarlar/veri -hisarJS "document.getElementById('dExp').click()"
newlog | grep -q "saveFile: " || fail "Dışa aktarma yerel kaydetmeye ulaşmadı"

# 5) internet: file:// sayfası GitHub Pages'ten okuyabilmeli (sürüm denetimi, sensör yazılımı indirme)
run 05_ag 2 -hisarJS "fetch('https://eminkaan9999-creator.github.io/hisar/tetik/version.json?t='+Date.now(),{cache:'no-store'}).then(function(r){return r.json()}).then(function(j){console.log('ağ testi: sürüm '+j.v)}).catch(function(e){console.log('ağ testi hatası: '+e)})"
waitlog "ağ testi" 30 || true
newlog | grep "ağ testi" | sed 's/^/   /'
newlog | grep -q "ağ testi: sürüm" || fail "Sayfa GitHub Pages'e erişemedi"

# 6) kendini güncelleme (HisarNative.update): indir, kur, aynı adresten yeniden aç; veriler kalmalı
run 06_guncelleme 1 -hisarTest guncelle -sayfa ayarlar/uygulama
if waitlog "güncelleme (tamam|hatası)" 90; then
  if newlog | grep -q "güncelleme tamam"; then
    for _ in $(seq 1 60); do [ "$(count 'sayfa hazır')" -ge 2 ] && break; sleep 1; done
    if [ "$(count 'sayfa hazır')" -ge 2 ]; then
      l2=$(newlog | grep "sayfa hazır" | tail -1)
      echo "$l2" | grep -q 'uygulama=evet' || fail "Güncellenen sayfa çalışmadı: $l2"
      echo "$l2" | grep -q 'yazıtipi=yerel' || echo "::warning::Güncellenen sayfada yazı tipleri uygulamadan değil: $l2"
      lsu=$(echo "$l2" | grep -o 'localStorage=[0-9-]*' | grep -o '[0-9-]*$')
      [ "${lsu:--1}" -ge 1 ] 2>/dev/null || fail "Güncellemeden sonra localStorage boş"
    else
      fail "Güncellemeden sonra sayfa yeniden açılmadı"
    fi
  elif newlog | grep -q "güncelleme hatası: İndirilen sürüm"; then
    echo "::warning::$(newlog | grep 'güncelleme hatası' | tail -1)"   # yayındaki sürüm eski: doğru davranış
  else
    fail "Güncelleme yapılamadı: $(newlog | grep 'güncelleme hatası' | tail -1)"
  fi
else
  fail "Güncelleme sonuçlanmadı (90 sn)"
fi
sleep 4
xcrun simctl io "$UDID" screenshot "$OUT/07_guncelleme_sonrasi.png" > /dev/null 2>&1 || true
newlog | grep -E "güncelleme|sayfa (hazır|kuruldu|açılıyor)" | sed 's/^/   /'

xcrun simctl terminate "$UDID" "$BID" > /dev/null 2>&1 || true
sleep 1
cp "$LOG" "$OUT/uygulama_gunlugu.txt" 2>/dev/null || true
xcrun simctl spawn "$UDID" log show --last 30m --style compact --predicate 'process == "HisarTetik"' 2>/dev/null | tail -3000 > "$OUT/sistem_gunlugu.txt" || true
if grep -E "js (HATA|error):" "$LOG" > "$OUT/js_hatalari.txt" 2>/dev/null; then
  fail "Sayfada JS hatası"
  head -20 "$OUT/js_hatalari.txt"
fi
CR=$(find ~/Library/Logs/DiagnosticReports -newer "$MARK" -iname '*HisarTetik*' 2>/dev/null)
if [ -n "$CR" ]; then
  fail "Uygulama çöktü"
  for f in $CR; do cp "$f" "$OUT/"; head -80 "$f"; done
fi
grep -q "sayfa hazır" "$LOG" 2>/dev/null || fail "Uygulama günlüğü yok ya da sayfa hiç açılmadı"
exit $rc
