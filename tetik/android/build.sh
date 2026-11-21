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
# İmza (bkz. README, "İmza anahtarı"). Eski anahtar (hisar-tetik.p12) depoda ve herkese açık (T1 bulgusu B-01).
# Yeni anahtar GitHub'daki TETIK_IMZA gizli değerinde durur (PKCS12, base64). Varsa APK "anahtar döndürme" ile
# imzalanır (APK imza şeması v3, Android 9 ve üstü): eski anahtar yeni anahtarı onaylar, kurulu uygulama silinmeden
# güncellenir, kayıtlar kalır; eski anahtar tek başına artık güncelleme imzalayamaz. Android 7-8 eski imzaya bakar.
# TETIK_IMZA yoksa eskisi gibi yalnız eski anahtarla imzalanır.
ESKI=(--ks "$HERE/hisar-tetik.p12" --ks-type PKCS12 --ks-pass pass:hisartetik --key-pass pass:hisartetik --ks-key-alias hisar)
if [ -n "${TETIK_IMZA:-}" ]; then
  YKS="$OUT/yeni-imza.p12"; ( umask 077; printf '%s' "$TETIK_IMZA" | base64 -d > "$YKS" )
  YENI=(--ks "$YKS" --ks-type PKCS12 --ks-pass pass:hisar-tetik-imza --key-pass pass:hisar-tetik-imza --ks-key-alias hisar2)
  "$BT/apksigner" rotate --out "$OUT/imza-gecmisi.bin" --old-signer "${ESKI[@]}" --new-signer "${YENI[@]}"
  "$BT/apksigner" sign "${ESKI[@]}" --next-signer "${YENI[@]}" --lineage "$OUT/imza-gecmisi.bin" \
    --rotation-min-sdk-version 28 --out "$OUT/HisarTetik.apk" "$OUT/aligned.apk"
  rm -f "$YKS"
  echo "İmza: eski anahtardan yeni anahtara döndürüldü (Android 9 ve üstü yeni anahtarı kullanır)"
else
  echo "::warning title=imza::TETIK_IMZA tanımlı değil: APK yalnız depodaki eski anahtarla imzalandı (bulgu B-01)"
  "$BT/apksigner" sign "${ESKI[@]}" --out "$OUT/HisarTetik.apk" "$OUT/aligned.apk"
fi
"$BT/apksigner" verify --verbose --print-certs "$OUT/HisarTetik.apk" > "$OUT/imza.txt"
grep -viE "public key|modulus" "$OUT/imza.txt" | head -16 || true
"$BT/aapt2" dump badging "$OUT/HisarTetik.apk" | grep -E "^package|sdkVersion|targetSdk|application-label:" || true
ls -la "$OUT/HisarTetik.apk"
