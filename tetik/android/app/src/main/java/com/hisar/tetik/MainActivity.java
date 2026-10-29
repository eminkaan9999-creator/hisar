package com.hisar.tetik;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
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
import java.util.Map;

/**
 * HİSAR TETİK Android uygulaması.
 * Uygulamanın kendisi (HTML) APK içindedir ve internetsiz çalışır; "https://appassets.androidplatform.net"
 * adresinden sunulur (güvenli bağlam). Sensör, telefonun kendi Bluetooth'uyla bağlanır (Ble.java),
 * sayfadaki Web Bluetooth çağrıları bridge.js üzerinden buraya gelir.
 */
public class MainActivity extends Activity {
    static final String TAG = "HisarTetik";
    static final String HOST = "appassets.androidplatform.net";
    static final String START = "https://" + HOST + "/index.html";
    static final int REQ_FILE = 11, REQ_SAVE = 12;
    static final int BG = Color.rgb(10, 14, 15);

    WebView web;
    FrameLayout root;
    Ble ble;
    final Handler ui = new Handler(Looper.getMainLooper());
    ValueCallback<Uri[]> fileCb;
    String pendingName, pendingText;
    OnBackInvokedCallback backCb;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
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

        ble = new Ble(this, this::js);
        web.addJavascriptInterface(new Native(), "HisarNative");
        web.setWebViewClient(new Client());
        web.setWebChromeClient(new Chrome());

        if (state != null && web.restoreState(state) != null) {
            Log.i(TAG, "durum geri yüklendi");
        } else {
            web.loadUrl(startUrl(getIntent()));
        }
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
        if (web != null) { root.removeView(web); web.destroy(); web = null; }
        super.onDestroy();
    }

    @Override
    public void onRequestPermissionsResult(int req, String[] perms, int[] res) {
        super.onRequestPermissionsResult(req, perms, res);
        if (ble != null) ble.onPermissionsResult(req, perms, res);
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
                InputStream in = getAssets().open("www" + path);
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
    class Native {
        @JavascriptInterface
        public String info() {
            JSONObject o = new JSONObject();
            try {
                o.put("versionName", versionName());
                o.put("versionCode", versionCode());
                o.put("sdk", Build.VERSION.SDK_INT);
                o.put("model", Build.MANUFACTURER + " " + Build.MODEL);
            } catch (Exception ignored) { }
            return o.toString();
        }

        @JavascriptInterface
        public void openUrl(String url) { ui.post(() -> openExternal(url)); }

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
