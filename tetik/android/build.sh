#!/usr/bin/env bash
# HİSAR TETİK Android uygulaması: Gradle'sız, doğrudan Android SDK araçlarıyla derleme.
#   aapt2 (kaynaklar) → javac (Java 8) → d8 (dex) → zipalign → apksigner (v1+v2+v3 imza)
# Gerekenler: ANDROID_HOME (build-tools ve platforms/android-35), JDK 17+, python3, zip.
# Çıktı: tetik/android/build/HisarTetik.apk
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
SDK="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}"
[ -n "$SDK" ] || { echo "ANDROID_HOME tanımlı değil" >&2; exit 1; }
BT="$(ls -d "$SDK"/build-tools/* | sort -V | tail -1)"
PLAT="$SDK/platforms/android-35/android.jar"
[ -f "$PLAT" ] || PLAT="$(ls -d "$SDK"/platforms/android-* | grep -E 'android-[0-9]+$' | sort -V | tail -1)/android.jar"
echo "build-tools: $BT"; echo "platform: $PLAT"

# Sürüm: uygulamanın VER değeri (src/app.html). Yalnız Android tarafı değişirse REV artırılır.
VER=$(grep -o 'const VER=[0-9]*' "$ROOT/tetik/src/app.html" | head -1 | grep -o '[0-9]*$')
REV=0
CODE=$((VER * 100 + REV)); NAME="$VER.$REV"
echo "sürüm: $NAME ($CODE)"

APP="$HERE/app/src/main"
OUT="$HERE/build"
rm -rf "$OUT"; mkdir -p "$OUT/classes" "$OUT/dex"

# 1) Sayfa: uygulama + köprü + (varsa) yazı tipleri
python3 "$HERE/yazitipi.py" "$APP/assets/www/fonts" || echo "yazı tipleri indirilemedi; sistem yazı tipi kullanılacak"
python3 "$ROOT/tetik/build.py" --apk

# 2) Kaynaklar ve manifest
"$BT/aapt2" compile --dir "$APP/res" -o "$OUT/res.zip"
"$BT/aapt2" link -o "$OUT/base.apk" -I "$PLAT" --manifest "$APP/AndroidManifest.xml" -A "$APP/assets" \
  --min-sdk-version 24 --target-sdk-version 35 --version-code "$CODE" --version-name "$NAME" \
  --auto-add-overlay "$OUT/res.zip"

# 3) Java → dex
javac -encoding UTF-8 --release 8 -Xlint:-options -classpath "$PLAT" -d "$OUT/classes" $(find "$APP/java" -name '*.java')
"$BT/d8" --release --min-api 24 --lib "$PLAT" --output "$OUT/dex" $(find "$OUT/classes" -name '*.class')

# 4) Paketle, hizala, imzala
cp "$OUT/base.apk" "$OUT/unsigned.apk"
(cd "$OUT/dex" && zip -q -j "$OUT/unsigned.apk" classes.dex)
"$BT/zipalign" -p -f 4 "$OUT/unsigned.apk" "$OUT/aligned.apk"
# İmza anahtarı depoda: kişisel, mağaza dışı dağıtım için (bkz. README). Güncellemeler aynı anahtarla imzalanır.
"$BT/apksigner" sign --ks "$HERE/hisar-tetik.p12" --ks-type PKCS12 --ks-pass pass:hisartetik --key-pass pass:hisartetik \
  --ks-key-alias hisar --out "$OUT/HisarTetik.apk" "$OUT/aligned.apk"
"$BT/apksigner" verify --verbose "$OUT/HisarTetik.apk" | head -6
"$BT/aapt2" dump badging "$OUT/HisarTetik.apk" | grep -E "^package|sdkVersion|targetSdk|application-label:" || true
ls -la "$OUT/HisarTetik.apk"
