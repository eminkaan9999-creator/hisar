"""Uygulamanın yazı tiplerini (Chakra Petch, IBM Plex Sans, IBM Plex Mono) Google Fonts'tan indirip
APK'ya koyar; böylece uygulama internetsiz de aynı görünür. Yalnız Latin ve Latin genişletilmiş
(Türkçe harfler) alt kümeleri alınır. Kullanım: python3 yazitipi.py <hedef_klasör>"""
import os, re, sys, urllib.request
dst = sys.argv[1]
os.makedirs(dst, exist_ok=True)
CSS = "https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap"
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
def get(u):
    return urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": UA}), timeout=30).read()
css = get(CSS).decode("utf-8")
blocks = re.findall(r"/\*\s*([\w-]+)\s*\*/\s*(@font-face\s*\{[^}]*\})", css)
out, n = [], 0
for subset, block in blocks:
    if subset not in ("latin", "latin-ext"):
        continue
    url = re.search(r"url\((https://[^)]+)\)", block).group(1)
    name = re.sub(r"[^A-Za-z0-9_.-]", "_", url.split("/")[-1])
    fam = re.search(r"font-family:\s*'([^']+)'", block).group(1).replace(" ", "")
    wt = re.search(r"font-weight:\s*(\d+)", block).group(1)
    fn = f"{fam}-{wt}-{subset}.woff2"
    with open(os.path.join(dst, fn), "wb") as f:
        f.write(get(url))
    out.append(block.replace(url, fn))
    n += 1
if n < 8:
    raise SystemExit(f"beklenenden az yazı tipi: {n}")
with open(os.path.join(dst, "fonts.css"), "w", encoding="utf-8") as f:
    f.write("\n".join(out) + "\n")
print("yazı tipleri:", n)
