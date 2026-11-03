#!/usr/bin/env bash
# iPhone uygulamasına girecek sayfa dosyalarını hazırlar: tetik/ios/build/www
#   index.html : web sürümü (tetik/index.html, GitHub Pages'te yayınlanan sayfanın aynısı)
#   bridge.js  : Android uygulamasıyla ortak Web Bluetooth köprüsü (uygulama bunu sayfaya kendisi ekler)
#   fonts/     : yazı tipleri (Android'deki yazitipi.py ile); uygulama Google Fonts bağlantılarını bunlara çevirir
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
WWW="$HERE/build/www"
rm -rf "$WWW"
mkdir -p "$WWW"
cp "$ROOT/tetik/index.html" "$WWW/index.html"
cp "$ROOT/tetik/android/app/src/main/assets/www/bridge.js" "$WWW/bridge.js"
if ! python3 "$ROOT/tetik/android/yazitipi.py" "$WWW/fonts"; then
  echo "yazı tipleri indirilemedi; sayfa Google Fonts'u (internet varsa) ya da sistem yazı tipini kullanır"
  rm -rf "$WWW/fonts"
fi
VER=$(grep -o 'const VER=[0-9]*' "$WWW/index.html" | head -1 | grep -o '[0-9]*$')
[ -n "$VER" ] || { echo "index.html'de const VER yok" >&2; exit 1; }
echo "sayfa sürümü: $VER"
find "$WWW" -type f | sort | sed "s|$WWW/||"
