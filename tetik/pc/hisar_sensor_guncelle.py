# -*- coding: utf-8 -*-
"""HİSAR TETİK · Sensör Güncelleyici (Windows)

Sensörü USB-C kabloyla bilgisayara tak, bu programı çalıştır. Program sensörü kendisi bulur; bilgisayar sensörü
görmüyorsa sürücüyü (CH9102, M5Stack'in resmi sürücüsü) indirip kurulumunu başlatır; sonra sensör yazılımını yükler.

Derleme (GitHub Actions, windows): pyinstaller --onefile --collect-data esptool --add-data "hisar-sensor-vN.bin;."
Deneme: HISAR-Sensor-Guncelle.exe --test  (yazılım dosyasını ve bağlı seri portları yazar, çıkar)
"""
import glob
import os
import re
import sys
import tempfile
import time
import urllib.request

SURUCU_URL = "https://m5stack.oss-cn-shenzhen.aliyuncs.com/resource/drivers/CH9102_VCP_SER_Windows.exe"
YUKLE_SAYFASI = "https://eminkaan9999-creator.github.io/hisar/tetik/yukle.html"
CIZGI = "-" * 64


def kaynak_dizini():
    return getattr(sys, "_MEIPASS", os.path.dirname(os.path.abspath(__file__)))


def yazilim_dosyasi():
    """Programın içindeki en yeni tam sensör yazılımı (hisar-sensor-vN.bin, -app olmayan)."""
    adaylar = []
    for d in (kaynak_dizini(), os.path.join(kaynak_dizini(), "..", "firmware")):
        for f in glob.glob(os.path.join(d, "hisar-sensor-v*.bin")):
            m = re.search(r"hisar-sensor-v(\d+)\.bin$", os.path.basename(f))
            if m:
                adaylar.append((int(m.group(1)), os.path.abspath(f)))
    if not adaylar:
        return None, None
    adaylar.sort()
    return adaylar[-1]


def sensor_portlari():
    from serial.tools import list_ports
    bulunan = []
    for p in list_ports.comports():
        ad = " ".join(x for x in (p.description, p.manufacturer, p.product) if x)
        if p.vid == 0x1A86 or re.search(r"CH9102|CH343|CH340|USB Single Serial|USB-Enhanced-SERIAL|wch", ad, re.I):
            bulunan.append(p)
    return bulunan


def tum_portlar():
    from serial.tools import list_ports
    return list(list_ports.comports())


def surucu_kur():
    print("\nSürücü indiriliyor (M5Stack'in resmi CH9102 sürücüsü)…")
    hedef = os.path.join(tempfile.gettempdir(), "CH9102_VCP_SER_Windows.exe")
    try:
        urllib.request.urlretrieve(SURUCU_URL, hedef)
    except Exception as e:  # internet yoksa tarayıcıyla indirilsin
        print("İndirilemedi:", e)
        print("Tarayıcıda açılıyor; indirip çalıştır ve INSTALL'a bas:\n  " + SURUCU_URL)
        try:
            import webbrowser
            webbrowser.open(SURUCU_URL)
        except Exception:
            pass
        return
    print("Kurulum penceresi açılıyor. Windows izin isterse EVET de, sonra INSTALL'a bas.")
    try:
        os.startfile(hedef)  # kurulum programı yönetici iznini kendisi ister
    except Exception as e:
        print("Kurulum başlatılamadı:", e, "\nDosya:", hedef)


def yukle(port, dosya):
    import esptool
    for hiz in ("921600", "460800", "115200"):
        print(f"\nYükleniyor: {port} · hız {hiz}. Kabloyu çıkarma, 1–2 dakika sürer…\n")
        try:
            esptool.main(["--chip", "esp32", "--port", port, "--baud", hiz, "--before", "default_reset",
                          "--after", "hard_reset", "write_flash", "-z", "0x0", dosya])
            return True
        except SystemExit as e:
            if e.code in (0, None):
                return True
            print(f"\nBu hızda olmadı (çıkış {e.code}).")
        except Exception as e:
            print(f"\nBu hızda olmadı: {e}")
        time.sleep(1.5)
    return False


def sor(metin):
    try:
        return input(metin).strip().lower()
    except EOFError:
        return "q"


def main():
    test = "--test" in sys.argv
    print(CIZGI)
    print("  HİSAR TETİK · SENSÖR GÜNCELLEYİCİ")
    print(CIZGI)
    surum, dosya = yazilim_dosyasi()
    if not dosya:
        print("Program içinde sensör yazılımı bulunamadı. Yükleme sayfasını kullan:\n  " + YUKLE_SAYFASI)
        if not test:
            sor("\nKapatmak için Enter'a bas…")
        return 2
    print(f"Sensör yazılımı: sürüm {surum} ({os.path.getsize(dosya) // 1024} KB)")
    if test:
        print("Bağlı seri portlar:", [f"{p.device} {p.description}" for p in tum_portlar()] or "yok")
        import esptool  # noqa: F401  (paket ve yükleyici dosyaları programda mı)
        print("esptool", esptool.__version__, "hazır. Deneme tamam.")
        return 0
    print("\n1) Sensörü USB-C kabloyla bilgisayara tak (veri taşıyan kablo olmalı).")
    print("2) Sensör açık olsun; ekranı yanmıyorsa yan düğmeye bir kez bas.\n")
    while True:
        ps = sensor_portlari()
        if not ps:
            diger = tum_portlar()
            print(CIZGI)
            print("Sensör bulunamadı.")
            if diger:
                print("Bilgisayardaki diğer seri portlar:", ", ".join(f"{p.device} ({p.description})" for p in diger))
            print("Olası nedenler: sürücü kurulu değil ya da kablo yalnız şarj ediyor.")
            c = sor("\n[S] sürücüyü kur   [Enter] yeniden ara   [Q] çık  > ")
            if c == "q":
                return 1
            if c == "s":
                surucu_kur()
                sor("\nKurulum bitince sensörü çıkarıp yeniden tak, sonra Enter'a bas…")
            else:
                time.sleep(1)
            continue
        if len(ps) > 1:
            print("Birden çok sensör bulundu:")
            for i, p in enumerate(ps, 1):
                print(f"  {i}) {p.device}  {p.description}")
            c = sor("Hangisi? (numara) > ")
            try:
                port = ps[int(c) - 1].device
            except Exception:
                continue
        else:
            port = ps[0].device
            print(f"Sensör bulundu: {port} ({ps[0].description})")
        if sor("\nYüklemeye başlamak için Enter'a bas ([Q] çık) > ") == "q":
            return 1
        if yukle(port, dosya):
            print(CIZGI)
            print(f"  TAMAM: sensöre yazılım {surum} yüklendi. Sensör yeniden başlıyor.")
            print("  Kabloyu çıkarabilirsin. Uygulamada sensöre yeniden bağlan.")
            print(CIZGI)
            sor("\nKapatmak için Enter'a bas…")
            return 0
        print(CIZGI)
        print("Yükleme olmadı. Şunları dene:")
        print(" - Başka bir USB girişi ya da başka bir kablo.")
        print(" - Sensörü kapatıp aç (yan düğme), sonra yeniden dene.")
        print(" - Arduino IDE ya da başka bir seri port programı açıksa kapat.")
        print(" - Olmazsa Chrome ile yükleme sayfası: " + YUKLE_SAYFASI)
        if sor("\n[Enter] yeniden dene   [Q] çık  > ") == "q":
            return 1


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        sys.exit(1)
