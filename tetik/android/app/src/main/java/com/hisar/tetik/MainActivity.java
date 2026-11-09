package com.hisar.tetik;

import android.app.Activity;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.graphics.drawable.Icon;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.content.pm.PackageInfo;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.speech.tts.TextToSpeech;
import android.util.Base64;
import android.util.Log;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowManager;
import android.webkit.ConsoleMessage;
import android.webkit.JavascriptInterface;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.PermissionRequest;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;
import android.window.OnBackInvokedCallback;
import android.window.OnBackInvokedDispatcher;

import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/**
 * HİSAR TETİK Android uygulaması.
 * Uygulamanın kendisi (HTML) APK içindedir ve internetsiz çalışır; "https://appassets.androidplatform.net"
 * adresinden sunulur (güvenli bağlam). Yeni sayfa sürümleri uygulamanın içinden internetle iner (PageStore.java),
 * APK'yı yeniden kurmak gerekmez. Sensör, telefonun kendi Bluetooth'uyla bağlanır (Ble.java),
 * sayfadaki Web Bluetooth çağrıları bridge.js üzerinden buraya gelir.
 */
public class MainActivity extends Activity {
    static final String TAG = "HisarTetik";
    static final String HOST = "appassets.androidplatform.net";
    static final String START = "https://" + HOST + "/index.html";
    static final int REQ_FILE = 11, REQ_SAVE = 12, REQ_LOC = 13, REQ_BILDIRIM = 14, REQ_KAMERA = 15;
    PermissionRequest kameraIstek;   // lazer hedef: sayfanın kamera isteği, Android izni gelince yanıtlanır
    /** Açık olan ekran (saatteki Başla/Dur düğmesi SaatAlici üzerinden buraya gelir). */
    static java.lang.ref.WeakReference<MainActivity> son = new java.lang.ref.WeakReference<>(null);
    static final int BG = Color.rgb(10, 14, 15);

    WebView web;
    FrameLayout root;
    Ble ble;
    PageStore pages;
    final Handler ui = new Handler(Looper.getMainLooper());
    ValueCallback<Uri[]> fileCb;
    String pendingName, pendingText;
    OnBackInvokedCallback backCb;
    // Sesli okuma (karşılama sözü, skoru söyleme): WebView'da konuşma yok, telefonun kendi seslendirmesi kullanılır
    TextToSpeech tts;
    boolean ttsReady;
    String ttsPending;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        son = new java.lang.ref.WeakReference<>(this);
        Window w = getWindow();
        w.setStatusBarColor(BG);
        w.setNavigationBarColor(BG);
        root = new FrameLayout(this);
        root.setBackgroundColor(BG);
        web = new WebView(this);
        web.setBackgroundColor(BG);
        root.addView(web, new FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));
        setContentView(root);
        edgeToEdge();

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(true);
        s.setSupportMultipleWindows(false);
        s.setTextZoom(100);
        s.setUserAgentString(s.getUserAgentString() + " HisarTetikAndroid/" + versionName());

        pages = new PageStore(this);
        ble = new Ble(this, this::js);
        web.addJavascriptInterface(new Native(), "HisarNative");
        web.setWebViewClient(new Client());
        web.setWebChromeClient(new Chrome());

        if (state != null && web.restoreState(state) != null) {
            Log.i(TAG, "durum geri yüklendi");
        } else {
            web.loadUrl(startUrl(getIntent()));
        }
        if (getIntent() != null && getIntent().getBooleanExtra("guncelle", false)) runUpdate(true);
        if (Build.VERSION.SDK_INT >= 33) {
            backCb = this::onBack;
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(OnBackInvokedDispatcher.PRIORITY_DEFAULT, backCb);
        }
    }

    /** "sayfa" ekstrası (ör. ayarlar/baglanti) uygulamada o sayfayı açar; testler ve kısayollar için. */
    String startUrl(Intent i) {
        String p = i != null ? i.getStringExtra("sayfa") : null;
        return START + (p != null && p.matches("[a-z0-9/_-]{1,60}") ? "#" + p : "");
    }

    @Override
    protected void onNewIntent(Intent i) {
        super.onNewIntent(i);
        String p = i.getStringExtra("sayfa");
        if (p != null && p.matches("[a-z0-9/_-]{1,60}")) js("location.hash=" + JSONObject.quote(p));
        if (i.getBooleanExtra("guncelle", false)) runUpdate(true);
    }

    /** HisarNative.update() (ve emülatör testi için "guncelle" ekstrası): sayfanın yeni sürümü indirilip kurulur,
     *  sonra sayfa aynı adresten yenilenir (süren oturum varsa sayfa oturum bitince yenilenir). */
    void runUpdate(boolean force) {
        pages.update(force, new PageStore.Done() {
            @Override public void ok(int newVer, int oldVer) {
                js("window.__hisarUpdateReady?window.__hisarUpdateReady(" + newVer + "):location.reload()");
            }
            @Override public void fail(String msg) {
                js("window.__hisarUpdateFailed&&window.__hisarUpdateFailed(" + JSONObject.quote(msg) + ")");
            }
        });
    }

    /** Sistem çubukları sayfanın üstüne binmesin: kenar boşlukları yerel olarak ayrılır. */
    @SuppressWarnings("deprecation")
    void edgeToEdge() {
        if (Build.VERSION.SDK_INT >= 30) {
            getWindow().setDecorFitsSystemWindows(false);
        } else {
            root.setSystemUiVisibility(View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
        }
        root.setOnApplyWindowInsetsListener((v, in) -> {
            int l, t, r, b;
            if (Build.VERSION.SDK_INT >= 30) {
                android.graphics.Insets bars = in.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
                android.graphics.Insets ime = in.getInsets(WindowInsets.Type.ime());
                l = bars.left; t = bars.top; r = bars.right; b = Math.max(bars.bottom, ime.bottom);
            } else {
                l = in.getSystemWindowInsetLeft(); t = in.getSystemWindowInsetTop();
                r = in.getSystemWindowInsetRight(); b = in.getSystemWindowInsetBottom();
            }
            v.setPadding(l, t, r, b);
            return Build.VERSION.SDK_INT >= 30 ? WindowInsets.CONSUMED : in.consumeSystemWindowInsets();
        });
    }

    void js(String code) {
        ui.post(() -> { if (web != null) web.evaluateJavascript(code, null); });
    }

    String versionName() {
        try { PackageInfo p = getPackageManager().getPackageInfo(getPackageName(), 0); return p.versionName; } catch (Exception e) { return "?"; }
    }

    @SuppressWarnings("deprecation")
    long versionCode() {
        try {
            PackageInfo p = getPackageManager().getPackageInfo(getPackageName(), 0);
            return Build.VERSION.SDK_INT >= 28 ? p.getLongVersionCode() : p.versionCode;
        } catch (Exception e) { return 0; }
    }

    void openExternal(String url) {
        try {
            Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(i);
        } catch (ActivityNotFoundException e) {
            Toast.makeText(this, "Bağlantı açılamadı", Toast.LENGTH_SHORT).show();
        }
    }

    // ------------------------------------------------------------------ geri tuşu
    void onBack() {
        if (web == null) { finish(); return; }
        web.evaluateJavascript("(window.__hisarBack&&window.__hisarBack())?1:0", v -> {
            if (!"1".equals(v)) moveTaskToBack(true);   // uygulama kapanmaz, arka plana gider (oturum sürer)
        });
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        if (Build.VERSION.SDK_INT >= 33) { super.onBackPressed(); return; }
        onBack();
    }

    // ------------------------------------------------------------------ yaşam döngüsü
    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        if (web != null) web.saveState(out);
    }

    @Override
    protected void onDestroy() {
        if (Build.VERSION.SDK_INT >= 33 && backCb != null) getOnBackInvokedDispatcher().unregisterOnBackInvokedCallback(backCb);
        if (ble != null) ble.close();
        if (tts != null) { try { tts.shutdown(); } catch (Exception ignored) { } tts = null; }
        if (web != null) { root.removeView(web); web.destroy(); web = null; }
        super.onDestroy();
    }

    @Override
    public void onRequestPermissionsResult(int req, String[] perms, int[] res) {
        super.onRequestPermissionsResult(req, perms, res);
        if (req == REQ_KAMERA) {
            boolean ok = res.length > 0 && res[0] == PackageManager.PERMISSION_GRANTED;
            if (kameraIstek != null) { if (ok) kameraIstek.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE}); else kameraIstek.deny(); }
            kameraIstek = null;
            return;
        }
        if (req == REQ_BILDIRIM) {
            boolean ok = res.length > 0 && res[0] == PackageManager.PERMISSION_GRANTED;
            js("window.__hisarSaatIzin&&window.__hisarSaatIzin(" + ok + ")");
            return;
        }
        if (req == REQ_LOC) {
            boolean ok = false;
            for (int r : res) ok |= r == PackageManager.PERMISSION_GRANTED;
            if (ok) konumAl(); else konumBitti(null, "izin");
            return;
        }
        if (ble != null) ble.onPermissionsResult(req, perms, res);
    }

    // Sensörü bul: telefonun konumu (sensörün son görüldüğü yer). Sonuç window.__hisarKonum({lat,lon,acc} | {hata}).
    boolean konumIzni() {
        return checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
            || checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
    }

    void konumIste() {
        if (konumIzni()) { konumAl(); return; }
        requestPermissions(new String[]{Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION}, REQ_LOC);
    }

    void konumAl() {
        try {
            LocationManager lm = (LocationManager) getSystemService(LOCATION_SERVICE);
            if (lm == null) { konumBitti(null, "yok"); return; }
            String prov = lm.isProviderEnabled(LocationManager.GPS_PROVIDER) ? LocationManager.GPS_PROVIDER
                : lm.isProviderEnabled(LocationManager.NETWORK_PROVIDER) ? LocationManager.NETWORK_PROVIDER : null;
            if (prov == null) { konumBitti(null, "kapali"); return; }
            Location son = lm.getLastKnownLocation(prov);
            final boolean[] bitti = {false};
            final Location yedek = son != null && System.currentTimeMillis() - son.getTime() < 120000 ? son : null;
            // en çok 20 sn bekle; yeni konum gelmezse son bilinen (2 dakikadan yeni) konum
            ui.postDelayed(() -> { if (!bitti[0]) { bitti[0] = true; konumBitti(yedek, yedek == null ? "zaman" : null); } }, 20000);
            if (Build.VERSION.SDK_INT >= 30) {
                lm.getCurrentLocation(prov, null, getMainExecutor(), l -> { if (!bitti[0]) { bitti[0] = true; konumBitti(l != null ? l : yedek, l == null && yedek == null ? "konum" : null); } });
            } else {
                lm.requestSingleUpdate(prov, new LocationListener() {
                    @Override public void onLocationChanged(Location l) { if (!bitti[0]) { bitti[0] = true; konumBitti(l, null); } }
                    @Override public void onStatusChanged(String p, int st, Bundle b) { }
                    @Override public void onProviderEnabled(String p) { }
                    @Override public void onProviderDisabled(String p) { }
                }, Looper.getMainLooper());
            }
        } catch (SecurityException e) {
            konumBitti(null, "izin");
        } catch (Exception e) {
            Log.w(TAG, "konum", e);
            konumBitti(null, "konum");
        }
    }

    // ------------------------------------------------------------------ akıllı saat
    // Atış sonucu, seri özeti ve Başla/Dur telefon bildirimi olarak gider; saat (Wear OS, Galaxy, Huawei, Xiaomi, Amazfit,
    // Garmin…) telefonun bildirimlerini gösteriyorsa titrer ve yazar. Sesi yok; titreşim deseni kanala göre (iyi / kötü / özet).
    static final String K_IYI = "saat_iyi", K_KOTU = "saat_kotu", K_OZET = "saat_ozet", K_HAZIR = "saat_hazir";
    static final int N_ATIS = 4101, N_OZET = 4102;
    static final long[] V_IYI = {0, 120}, V_KOTU = {0, 350, 150, 350}, V_OZET = {0, 200, 100, 200, 100, 200};

    boolean bildirimIzni() {
        return Build.VERSION.SDK_INT < 33 || checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED;
    }

    void saatIzinIste() {
        if (bildirimIzni()) { js("window.__hisarSaatIzin&&window.__hisarSaatIzin(true)"); return; }
        requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, REQ_BILDIRIM);
    }

    void saatKanallari(NotificationManager nm) {
        if (Build.VERSION.SDK_INT < 26 || nm.getNotificationChannel(K_HAZIR) != null) return;
        java.util.List<NotificationChannel> l = new java.util.ArrayList<>();
        String[][] k = {{K_IYI, "Saat: iyi atış"}, {K_KOTU, "Saat: kötü atış"}, {K_OZET, "Saat: seri özeti"}, {K_HAZIR, "Saat: hazır (Başla düğmesi)"}};
        long[][] v = {V_IYI, V_KOTU, V_OZET, null};
        for (int i = 0; i < k.length; i++) {
            NotificationChannel c = new NotificationChannel(k[i][0], k[i][1], v[i] == null ? NotificationManager.IMPORTANCE_LOW : NotificationManager.IMPORTANCE_DEFAULT);
            c.setSound(null, null);
            c.enableVibration(v[i] != null);
            if (v[i] != null) c.setVibrationPattern(v[i]);
            c.setShowBadge(false);
            l.add(c);
        }
        nm.createNotificationChannels(l);
    }

    PendingIntent komutIntent(String k) {
        Intent i = new Intent(this, SaatAlici.class).setAction(SaatAlici.EYLEM).putExtra("komut", k);
        return PendingIntent.getBroadcast(this, "basla".equals(k) ? 41 : 42, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    /** HisarNative.saat(json): {t:"atis"|"ozet"|"hazir"|"temizle", iyi, baslik, metin, komut:"basla"|"dur"|""} */
    void saatBildir(String json) {
        try {
            NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
            if (nm == null) return;
            org.json.JSONObject o = new org.json.JSONObject(json);
            String t = o.optString("t");
            if ("temizle".equals(t)) { nm.cancel(N_ATIS); nm.cancel(N_OZET); return; }
            if (!bildirimIzni()) return;
            saatKanallari(nm);
            boolean ozet = "ozet".equals(t), hazir = "hazir".equals(t), iyi = o.optBoolean("iyi", true);
            String kanal = hazir ? K_HAZIR : ozet ? K_OZET : iyi ? K_IYI : K_KOTU;
            Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(this, kanal) : new Notification.Builder(this);
            int ic = getResources().getIdentifier("ic_bildirim", "drawable", getPackageName());   // R sınıfı üretilmiyor (Gradle'sız derleme)
            if (ic == 0) ic = android.R.drawable.stat_notify_more;
            Intent ac = new Intent(this, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
            b.setSmallIcon(ic)
                .setContentTitle(o.optString("baslik", "HİSAR TETİK"))
                .setContentText(o.optString("metin", ""))
                .setShowWhen(true)
                .setWhen(System.currentTimeMillis())
                .setOnlyAlertOnce(false)
                .setAutoCancel(true)
                .setColor(Color.rgb(34, 211, 197))
                .setCategory(Notification.CATEGORY_STATUS)
                .setContentIntent(PendingIntent.getActivity(this, 40, ac, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE));
            if (Build.VERSION.SDK_INT < 26) {
                if (!hazir) b.setVibrate(ozet ? V_OZET : iyi ? V_IYI : V_KOTU);
                b.setPriority(hazir ? Notification.PRIORITY_LOW : Notification.PRIORITY_DEFAULT);
            } else {
                b.setTimeoutAfter(ozet || hazir ? 30 * 60000L : 5 * 60000L);
            }
            String k = o.optString("komut", "");
            if ("basla".equals(k) || "dur".equals(k))
                b.addAction(new Notification.Action.Builder(Icon.createWithResource(this, ic), "basla".equals(k) ? "Başla" : "Dur", komutIntent(k)).build());
            nm.notify(ozet || hazir ? N_OZET : N_ATIS, b.build());
        } catch (Exception e) {
            Log.w(TAG, "saat bildirimi", e);
        }
    }

    /** Saatteki (bildirimdeki) Başla / Dur düğmesi. */
    void saatKomut(String k) {
        ui.post(() -> js("window.__hisarSaat&&window.__hisarSaat('" + ("basla".equals(k) ? "basla" : "dur") + "')"));
    }

    void konumBitti(Location l, String hata) {
        if (l != null) js(String.format(java.util.Locale.US, "window.__hisarKonum&&window.__hisarKonum({lat:%.6f,lon:%.6f,acc:%.0f})", l.getLatitude(), l.getLongitude(), l.hasAccuracy() ? l.getAccuracy() : 0f));
        else js("window.__hisarKonum&&window.__hisarKonum({hata:'" + (hata == null ? "konum" : hata) + "'})");
    }

    @Override
    protected void onActivityResult(int req, int res, Intent data) {
        if (req == REQ_FILE) {
            if (fileCb != null) {
                fileCb.onReceiveValue(res == RESULT_OK && data != null && data.getData() != null ? new Uri[]{data.getData()} : null);
                fileCb = null;
            }
            return;
        }
        if (req == REQ_SAVE) {
            boolean ok = false;
            String name = pendingName;
            if (res == RESULT_OK && data != null && data.getData() != null && pendingText != null) {
                try (OutputStream os = getContentResolver().openOutputStream(data.getData(), "wt")) {
                    if (os != null) { os.write(pendingText.getBytes(StandardCharsets.UTF_8)); ok = true; }
                } catch (Exception e) {
                    Log.w(TAG, "kaydetme", e);
                }
            }
            pendingName = null;
            pendingText = null;
            js("window.__hisarSaved&&window.__hisarSaved(" + ok + "," + JSONObject.quote(name == null ? "" : name) + ")");
            return;
        }
        if (ble != null) ble.onActivityResult(req, res);
        super.onActivityResult(req, res, data);
    }

    // ------------------------------------------------------------------ sayfa sunucusu (APK içi dosyalar)
    static String mime(String p) {
        String l = p.toLowerCase();
        if (l.endsWith(".html")) return "text/html";
        if (l.endsWith(".js")) return "application/javascript";
        if (l.endsWith(".css")) return "text/css";
        if (l.endsWith(".png")) return "image/png";
        if (l.endsWith(".json")) return "application/json";
        if (l.endsWith(".svg")) return "image/svg+xml";
        if (l.endsWith(".woff2")) return "font/woff2";
        if (l.endsWith(".woff")) return "font/woff";
        if (l.endsWith(".ttf")) return "font/ttf";
        if (l.endsWith(".ico")) return "image/x-icon";
        return "application/octet-stream";
    }

    class Client extends WebViewClient {
        @Override
        public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest r) {
            Uri u = r.getUrl();
            if (!HOST.equals(u.getHost())) return null;   // dış adresler (güncelleme bilgisi, yazılım dosyası) internetten
            String path = u.getPath();
            if (path == null || path.isEmpty() || path.equals("/")) path = "/index.html";
            if (path.contains("..")) path = "/index.html";
            Map<String, String> h = new HashMap<>();
            h.put("Cache-Control", "no-cache");
            try {
                InputStream in = path.equals("/index.html") ? pages.open() : getAssets().open("www" + path);
                String m = mime(path);
                WebResourceResponse res = new WebResourceResponse(m, m.startsWith("text/") || m.endsWith("javascript") || m.endsWith("json") ? "utf-8" : null, in);
                res.setResponseHeaders(h);
                return res;
            } catch (IOException e) {
                WebResourceResponse res = new WebResourceResponse("text/plain", "utf-8", new ByteArrayInputStream(new byte[0]));
                res.setStatusCodeAndReasonPhrase(404, "Not Found");
                res.setResponseHeaders(h);
                return res;
            }
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
            Uri u = r.getUrl();
            if (HOST.equals(u.getHost())) return false;
            openExternal(u.toString());   // aparat, yazılım yükleme sayfası, APK indirme: tarayıcıda
            return true;
        }

        @Override
        public boolean onRenderProcessGone(WebView v, RenderProcessGoneDetail d) {
            Log.e(TAG, "sayfa işlemi kapandı; yeniden açılıyor");
            if (web == v) { root.removeView(web); web.destroy(); web = null; }
            recreate();
            return true;
        }
    }

    class Chrome extends WebChromeClient {
        // lazer hedef: sayfa kamerayı (getUserMedia) isteyince Android kamera iznini sor, yalnız görüntüye izin ver
        @Override
        public void onPermissionRequest(final PermissionRequest r) {
            runOnUiThread(() -> {
                boolean video = false;
                for (String x : r.getResources()) if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(x)) video = true;
                if (!video) { r.deny(); return; }
                if (checkSelfPermission(Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
                    r.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE});
                    return;
                }
                if (kameraIstek != null) kameraIstek.deny();
                kameraIstek = r;
                requestPermissions(new String[]{Manifest.permission.CAMERA}, REQ_KAMERA);
            });
        }

        @Override
        public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb, FileChooserParams p) {
            if (fileCb != null) fileCb.onReceiveValue(null);
            fileCb = cb;
            Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT);
            i.addCategory(Intent.CATEGORY_OPENABLE);
            i.setType("*/*");
            try { startActivityForResult(i, REQ_FILE); } catch (ActivityNotFoundException e) { fileCb = null; return false; }
            return true;
        }

        @Override
        public boolean onConsoleMessage(ConsoleMessage m) {
            Log.i(TAG, "js " + m.messageLevel() + ": " + m.message() + " @" + m.lineNumber());
            return true;
        }
    }

    // ------------------------------------------------------------------ sayfadan çağrılan yerel işlevler
    void say(String text) {
        if (text == null || text.trim().isEmpty()) return;
        if (tts == null) {
            ttsPending = text;
            try {
                tts = new TextToSpeech(this, st -> {
                    if (st != TextToSpeech.SUCCESS || tts == null) { Log.w(TAG, "seslendirme açılamadı: " + st); return; }
                    int r = tts.setLanguage(new Locale("tr", "TR"));
                    if (r == TextToSpeech.LANG_MISSING_DATA || r == TextToSpeech.LANG_NOT_SUPPORTED) Log.w(TAG, "Türkçe ses yok; varsayılan dil kullanılıyor");
                    ttsReady = true;
                    String p = ttsPending; ttsPending = null;
                    if (p != null) tts.speak(p, TextToSpeech.QUEUE_FLUSH, null, "hisar");
                });
            } catch (Exception e) { Log.w(TAG, "seslendirme: " + e); tts = null; }
            return;
        }
        if (!ttsReady) { ttsPending = text; return; }
        tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "hisar");
    }

    class Native {
        @JavascriptInterface
        public String info() {
            JSONObject o = new JSONObject();
            try {
                o.put("platform", "android");
                o.put("versionName", versionName());
                o.put("versionCode", versionCode());
                o.put("selfUpdate", true);                 // sayfa uygulama içinden güncellenir (HisarNative.update)
                o.put("page", pages.pageVer());
                o.put("pageBundled", pages.bundledVer);
                o.put("sdk", Build.VERSION.SDK_INT);
                o.put("model", Build.MANUFACTURER + " " + Build.MODEL);
            } catch (Exception ignored) { }
            return o.toString();
        }

        @JavascriptInterface
        public void openUrl(String url) { ui.post(() -> openExternal(url)); }

        /** Sayfanın yeni sürümünü GitHub Pages'ten indirir ve kurar (APK yeniden kurulmaz). */
        @JavascriptInterface
        public void update() { ui.post(() -> runUpdate(false)); }

        /** Telefonun konumu (Sensörü bul › son görüldüğü yer); sonuç window.__hisarKonum ile döner. */
        @JavascriptInterface
        public void konum() { ui.post(() -> konumIste()); }

        /** Akıllı saat: bildirim gönder (ayrıntı: saatBildir). */
        @JavascriptInterface
        public void saat(String json) { ui.post(() -> saatBildir(json)); }

        /** Akıllı saat: bildirim izni (Android 13+); sonuç window.__hisarSaatIzin(true|false). */
        @JavascriptInterface
        public void saatIzin() { ui.post(() -> saatIzinIste()); }

        /** Metni telefonun seslendirmesiyle söyler (Türkçe ses varsa Türkçe). */
        @JavascriptInterface
        public void speak(String text) { ui.post(() -> say(text)); }

        @JavascriptInterface
        public void exitApp() { ui.post(() -> moveTaskToBack(true)); }

        @JavascriptInterface
        public void keepScreenOn(boolean on) {
            ui.post(() -> {
                if (on) getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                else getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            });
        }

        /** Dışa aktarma (JSON/CSV): kullanıcı kaydedeceği yeri seçer. */
        @JavascriptInterface
        public void saveFile(String name, String mime, String text) {
            ui.post(() -> {
                pendingName = name;
                pendingText = text;
                Intent i = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                i.addCategory(Intent.CATEGORY_OPENABLE);
                i.setType(mime == null || mime.isEmpty() ? "application/octet-stream" : mime);
                i.putExtra(Intent.EXTRA_TITLE, name);
                try { startActivityForResult(i, REQ_SAVE); }
                catch (ActivityNotFoundException e) { js("window.__hisarSaved&&window.__hisarSaved(false,'')"); }
            });
        }

        /** Oturum raporu (PNG/PDF) ve ham veri (CSV): paylaşım menüsü (WhatsApp, e-posta, galeri...). */
        @JavascriptInterface
        public void shareFile(String name, String mime, String b64) {
            ui.post(() -> {
                try {
                    File dir = new File(getCacheDir(), "paylas");
                    if (!dir.isDirectory() && !dir.mkdirs()) throw new IOException("klasör");
                    File[] old = dir.listFiles();
                    if (old != null) for (File f : old) if (System.currentTimeMillis() - f.lastModified() > 3600_000L) f.delete();
                    String safe = name.replaceAll("[^A-Za-z0-9._-]", "_");
                    File f = new File(dir, safe);
                    try (FileOutputStream os = new FileOutputStream(f)) { os.write(Base64.decode(b64, Base64.DEFAULT)); }
                    Uri u = Uri.parse("content://" + ShareProvider.AUTH + "/" + Uri.encode(safe));
                    Intent s = new Intent(Intent.ACTION_SEND);
                    s.setType(mime);
                    s.putExtra(Intent.EXTRA_STREAM, u);
                    s.setClipData(ClipData.newRawUri(safe, u));
                    s.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    startActivity(Intent.createChooser(s, "Paylaş"));
                } catch (Exception e) {
                    Log.w(TAG, "paylaşım", e);
                    Toast.makeText(MainActivity.this, "Paylaşılamadı", Toast.LENGTH_SHORT).show();
                }
            });
        }

        // ---- Bluetooth (bridge.js tarafından çağrılır; sonuçlar __hn.ok / __hn.err ile döner)
        @JavascriptInterface
        public void bleRequest(int id, String opts) { ui.post(() -> ble.requestDevice(id, opts)); }

        @JavascriptInterface
        public String bleKnown() { return ble.knownDevice(); }

        @JavascriptInterface
        public void bleConnect(int id, String address) { ui.post(() -> ble.connect(id, address)); }

        @JavascriptInterface
        public void bleDisconnect(String address) { ui.post(() -> ble.disconnect()); }

        @JavascriptInterface
        public void bleNotify(int id, String svc, String chr, boolean on) { ui.post(() -> ble.setNotify(id, svc, chr, on)); }

        @JavascriptInterface
        public void bleWrite(int id, String svc, String chr, String b64, boolean withResponse) {
            byte[] data = Base64.decode(b64, Base64.DEFAULT);
            ui.post(() -> ble.write(id, svc, chr, data, withResponse));
        }
    }
}
