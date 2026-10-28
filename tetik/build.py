"""HISAR TETIK: tek dosyalik uygulama govdesinden (src/app.html) yayin sayfalarini uretir.

Kullanim:
  python3 build.py                 -> src/app.html'den tetik/index.html (web + PWA)
  python3 build.py /yol/app.html   -> once src/app.html'e kopyalar, sonra ayni sekilde uretir
  python3 build.py --apk           -> ayrica Android uygulamasinin sayfasini da uretir
                                      (android/app/src/main/assets/www/index.html)
"""
import sys, pathlib, shutil

here = pathlib.Path(__file__).resolve().parent
args = [a for a in sys.argv[1:] if not a.startswith('--')]
want_apk = '--apk' in sys.argv
src_path = here / 'src' / 'app.html'
if args:
    given = pathlib.Path(args[0]).resolve()
    if given != src_path:
        src_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(given, src_path)
src = src_path.read_text(encoding='utf-8')

head = '''<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#0a0e0f">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Hisar Tetik">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="favicon-32.png" sizes="32x32">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<style>:root{color-scheme:dark;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}html,body{margin:0}body{font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style>
</head>
<body>
'''
out = head + src + '\n</body>\n</html>\n'
dst = here / 'index.html'
dst.write_text(out, encoding='utf-8')
print('yazildi:', dst, len(out), 'bayt')

if want_apk:
    # Android: sistem cubuklari yerel kodda bosluk olarak ayrilir, bu yuzden safe-area dolgusu yok.
    # bridge.js, Web Bluetooth'u telefonun yerel Bluetooth'una baglar; uygulama kodundan once yuklenmeli.
    apk_head = '''<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#0a0e0f">
<link rel="icon" href="favicon-32.png" sizes="32x32">
<style>:root{color-scheme:dark}html,body{margin:0}body{font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style>
<script src="bridge.js"></script>
</head>
<body>
'''
    www = here / 'android' / 'app' / 'src' / 'main' / 'assets' / 'www'
    www.mkdir(parents=True, exist_ok=True)
    apk_src = src
    if (www / 'fonts' / 'fonts.css').exists():
        # yazı tipleri APK içinde: internetsiz de aynı görünüm
        import re
        apk_src = re.sub(r'<link rel="preconnect" href="https://fonts\.googleapis\.com">\s*', '', apk_src)
        apk_src = re.sub(r'<link rel="stylesheet" href="https://fonts\.googleapis\.com/css2[^"]*">', '<link rel="stylesheet" href="fonts/fonts.css">', apk_src)
    apk_out = apk_head + apk_src + '\n</body>\n</html>\n'
    (www / 'index.html').write_text(apk_out, encoding='utf-8')
    shutil.copyfile(here / 'favicon-32.png', www / 'favicon-32.png')
    print('yazildi:', www / 'index.html', len(apk_out), 'bayt')
