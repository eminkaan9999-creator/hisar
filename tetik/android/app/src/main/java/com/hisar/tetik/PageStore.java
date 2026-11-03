package com.hisar.tetik;

import android.content.Context;
import android.util.Log;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Uygulama içi sayfa güncellemesi (iPhone'daki PageStore.swift'in karşılığı).
 * Sayfa (index.html) APK içinde gelir. İnternetten daha yenisi indirilince uygulamanın kendi klasörüne
 * (files/www/index.html) yazılır ve oradan sunulur. Adres (https://appassets.androidplatform.net/index.html)
 * hiç değişmez, böylece localStorage'daki antrenman geçmişi korunur. bridge.js ve yazı tipleri hep APK'dan
 * gelir: yerel kodla birlikte değişen bir şey olursa yeni APK gerekir (version.json "apkMin").
 * APK güncellenip içindeki sayfa indirilenden yeniyse indirilen silinir, APK'daki açılır.
 */
final class PageStore {
    static final String TAG = "HisarTetik";
    /** GitHub Pages'teki Android sayfası (build.py yazar: tetik/apk/index.html) */
    static final String UPDATE_URL = "https://eminkaan9999-creator.github.io/hisar/tetik/apk/index.html";
    static final Pattern VER = Pattern.compile("const VER=([0-9]+)");
    static final int MAX_BYTES = 6 * 1024 * 1024;

    interface Done {
        void ok(int newVer, int oldVer);
        void fail(String msg);
    }

    final Context ctx;
    final File dir, index;
    final int bundledVer;
    final boolean hasFonts;
    String url = UPDATE_URL;            // yalnız masaüstü testi değiştirir
    private volatile boolean useStored;
    private volatile int pageVer;
    private boolean updating;

    PageStore(Context c) {
        ctx = c.getApplicationContext() != null ? c.getApplicationContext() : c;
        dir = new File(ctx.getFilesDir(), "www");
        index = new File(dir, "index.html");
        bundledVer = ver(readAsset("www/index.html"));
        hasFonts = assetExists("www/fonts/fonts.css");
        int sv = index.isFile() ? ver(readFile(index)) : -1;
        if (sv >= 0 && sv >= bundledVer) {
            useStored = true;
            pageVer = sv;
        } else {
            if (index.isFile() && !index.delete()) Log.w(TAG, "eski indirilen sayfa silinemedi");
            useStored = false;
            pageVer = bundledVer;
        }
        Log.i(TAG, "sayfa sürümü " + pageVer + (useStored ? " (indirilen)" : " (APK içi)") + ", APK içindeki " + bundledVer);
    }

    int pageVer() { return pageVer; }
    boolean usingDownloaded() { return useStored; }

    /** Sunulacak index.html */
    InputStream open() throws IOException {
        if (useStored) {
            try { return new FileInputStream(index); }
            catch (IOException e) { Log.w(TAG, "indirilen sayfa açılamadı; APK içindeki açılıyor", e); useStored = false; pageVer = bundledVer; }
        }
        return ctx.getAssets().open("www/index.html");
    }

    static int ver(String html) {
        if (html == null) return -1;
        Matcher m = VER.matcher(html);
        return m.find() ? Integer.parseInt(m.group(1)) : -1;
    }

    /** build.py --apk ile aynı: Google Fonts yerine APK'daki yazı tipleri (internetsiz de aynı görünüm). */
    String fontRewrite(String html) {
        if (!hasFonts) return html;
        return html
            .replaceAll("<link rel=\"preconnect\" href=\"https://fonts\\.googleapis\\.com\">\\s*", "")
            .replaceAll("<link rel=\"stylesheet\" href=\"https://fonts\\.googleapis\\.com/css2[^\"]*\">",
                Matcher.quoteReplacement("<link rel=\"stylesheet\" href=\"fonts/fonts.css\">"));
    }

    /** İndirilen sayfayı denetler; uygunsa null, değilse Türkçe hata. */
    String check(String html, int cur, boolean force) {
        int nv = ver(html);
        if (nv < 0 || !html.contains("window.__hisar")) return "İndirilen dosya HİSAR TETİK sayfası değil";
        if (!html.contains("</html>")) return "İndirilen dosya eksik";
        if (!html.contains("src=\"bridge.js\"")) return "İndirilen dosya Android sayfası değil";
        if (nv < cur) return "İndirilen sürüm (" + nv + ") yüklü sürümden (" + cur + ") eski";
        if (nv == cur && !force) return "Sunucudaki sürüm (" + nv + ") zaten yüklü";
        return null;
    }

    /**
     * HisarNative.update(): Android sayfasını indirir, denetler, files/www/index.html'ye atomik yazar.
     * Arka plan iş parçacığında çalışır; sonucu done'a bildirir (çağıran ana iş parçacığına taşır).
     * force: aynı sürüm de yeniden kurulur (yalnız emülatör testindeki "guncelle" ekstrası).
     */
    void update(boolean force, Done done) {
        synchronized (this) {
            if (updating) { Log.i(TAG, "güncelleme zaten sürüyor"); return; }
            updating = true;
        }
        new Thread(() -> {
            int cur = pageVer;
            String err;
            int nv = -1;
            try {
                String html = download();
                err = check(html, cur, force);
                if (err == null) {
                    nv = ver(html);
                    write(fontRewrite(html));
                    useStored = true;
                    pageVer = nv;
                }
            } catch (IOException e) {
                err = e.getMessage() != null && e.getMessage().startsWith("Sunucu") ? e.getMessage() : "İndirilemedi: " + e;
            } catch (Exception e) {
                err = "Kurulamadı: " + e;
            }
            synchronized (PageStore.this) { updating = false; }
            if (err == null) { Log.i(TAG, "sayfa güncellendi: " + nv + " (önceki " + cur + ")"); done.ok(nv, cur); }
            else { Log.w(TAG, "sayfa güncellenemedi: " + err); done.fail(err); }
        }, "sayfa-guncelleme").start();
    }

    String download() throws IOException {
        URL u = new URL(url + (url.contains("?") ? "&" : "?") + "t=" + System.currentTimeMillis());
        HttpURLConnection c = (HttpURLConnection) u.openConnection();
        c.setConnectTimeout(15000);
        c.setReadTimeout(30000);
        c.setUseCaches(false);
        c.setRequestProperty("Cache-Control", "no-cache, no-store");
        c.setRequestProperty("Pragma", "no-cache");
        try {
            int code = c.getResponseCode();
            if (code != 200) throw new IOException("Sunucu yanıtı " + code);
            try (InputStream in = c.getInputStream()) {
                ByteArrayOutputStream bo = new ByteArrayOutputStream(512 * 1024);
                byte[] b = new byte[16384];
                int n;
                while ((n = in.read(b)) > 0) {
                    bo.write(b, 0, n);
                    if (bo.size() > MAX_BYTES) throw new IOException("Dosya beklenenden büyük");
                }
                return new String(bo.toByteArray(), StandardCharsets.UTF_8);
            }
        } finally {
            c.disconnect();
        }
    }

    /** Önce geçici dosya, sonra yeniden adlandırma: yarım dosya hiç sunulmaz. */
    void write(String html) throws IOException {
        if (!dir.isDirectory() && !dir.mkdirs()) throw new IOException("klasör oluşturulamadı");
        File tmp = new File(dir, "index.html.yeni");
        try (FileOutputStream os = new FileOutputStream(tmp)) {
            os.write(html.getBytes(StandardCharsets.UTF_8));
            os.getFD().sync();
        }
        if (!tmp.renameTo(index)) {
            if (index.exists() && !index.delete()) throw new IOException("eski sayfa silinemedi");
            if (!tmp.renameTo(index)) throw new IOException("sayfa yazılamadı");
        }
    }

    String readAsset(String name) {
        try (InputStream in = ctx.getAssets().open(name)) { return readAll(in); }
        catch (IOException e) { return null; }
    }

    boolean assetExists(String name) {
        try (InputStream in = ctx.getAssets().open(name)) { return true; }
        catch (IOException e) { return false; }
    }

    static String readFile(File f) {
        try (InputStream in = new FileInputStream(f)) { return readAll(in); }
        catch (IOException e) { return null; }
    }

    static String readAll(InputStream in) throws IOException {
        ByteArrayOutputStream bo = new ByteArrayOutputStream();
        byte[] b = new byte[16384];
        int n;
        while ((n = in.read(b)) > 0) bo.write(b, 0, n);
        return new String(bo.toByteArray(), StandardCharsets.UTF_8);
    }
}
