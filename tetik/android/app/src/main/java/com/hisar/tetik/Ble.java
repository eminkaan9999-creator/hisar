package com.hisar.tetik;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothGatt;
import android.bluetooth.BluetoothGattCallback;
import android.bluetooth.BluetoothGattCharacteristic;
import android.bluetooth.BluetoothGattDescriptor;
import android.bluetooth.BluetoothGattService;
import android.bluetooth.BluetoothManager;
import android.bluetooth.BluetoothProfile;
import android.bluetooth.BluetoothStatusCodes;
import android.bluetooth.le.BluetoothLeScanner;
import android.bluetooth.le.ScanCallback;
import android.bluetooth.le.ScanRecord;
import android.bluetooth.le.ScanResult;
import android.bluetooth.le.ScanSettings;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.location.LocationManager;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.os.ParcelUuid;
import android.provider.Settings;
import android.util.Base64;
import android.util.Log;
import android.util.TypedValue;
import android.view.Gravity;
import android.widget.ArrayAdapter;
import android.widget.LinearLayout;
import android.widget.ListView;
import android.widget.ProgressBar;
import android.widget.TextView;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Sayfanın kullandığı Web Bluetooth işlevlerini telefonun yerel Bluetooth'una bağlar:
 * cihaz seçici, bağlanma (MTU 185, yüksek öncelikli bağlantı), bildirimler, yazma.
 * Bütün GATT işlemleri ana iş parçacığında, sırayla (kuyrukla) yapılır.
 * Sayfaya dönüşler: __hn.ok(id, json) / __hn.err(id, ad, mesaj) / __hn.data([[uuid, b64]...]) / __hn.disc(adres)
 */
@SuppressLint("MissingPermission")
public class Ble {
    interface Js { void run(String code); }
    interface Fail { void f(String name, String msg); }

    static final String TAG = "HisarBle";
    static final int REQ_PERM = 21, REQ_ENABLE = 22;
    static final UUID CCCD = UUID.fromString("00002902-0000-1000-8000-00805f9b34fb");
    static final int OP_DONE = 0, OP_STARTED = 1, OP_BUSY = 2;

    final Activity act;
    final Js js;
    final Handler h = new Handler(Looper.getMainLooper());
    final SharedPreferences prefs;
    BluetoothAdapter adapter;

    // hazırlık (izin, Bluetooth açık, konum)
    Runnable readyOk;
    Fail readyFail;

    // cihaz seçici
    int reqId = -1;
    JSONObject reqOpts = new JSONObject();
    AlertDialog dlg;
    TextView dlgMsg;
    ArrayAdapter<String> listAdapter;
    final List<String> foundAddr = new ArrayList<>();
    final Map<String, String> names = new HashMap<>();
    final Map<String, Integer> rssi = new HashMap<>();
    ScanCallback scanCb;
    final Runnable scanTimeout = this::onScanTimeout;

    // bağlantı
    BluetoothGatt gatt;
    String addr;
    boolean connected, connecting, mtuDone;
    int connId = -1, retries;
    final Runnable connTimeout = this::onConnectTimeout;
    final Runnable mtuFallback = () -> afterMtu(gatt);
    final Runnable discFallback = this::onDisconnectFallback;

    // GATT işlem kuyruğu
    interface Op { int start(); }
    static final class P { final Op op; final int id; int tries; P(Op o, int i) { op = o; id = i; } }
    final ArrayDeque<P> ops = new ArrayDeque<>();
    P cur;
    final Runnable opTimeout = () -> opDone(false, "zaman aşımı");

    // gelen bildirimler (ikili iş parçacığından gelir), toplu olarak sayfaya iletilir
    final ConcurrentLinkedQueue<String> rx = new ConcurrentLinkedQueue<>();
    final AtomicBoolean flushPosted = new AtomicBoolean(false);

    Ble(Activity a, Js j) {
        act = a;
        js = j;
        prefs = a.getSharedPreferences("ble", Context.MODE_PRIVATE);
    }

    // ================================================================ sayfaya dönüş
    void ok(int id, String json) {
        if (id < 0) return;
        js.run("window.__hn&&__hn.ok(" + id + "," + JSONObject.quote(json == null ? "" : json) + ")");
    }

    void err(int id, String name, String msg) {
        if (id < 0) return;
        js.run("window.__hn&&__hn.err(" + id + "," + JSONObject.quote(name) + "," + JSONObject.quote(msg == null ? "" : msg) + ")");
    }

    // ================================================================ hazırlık
    boolean has(String p) { return act.checkSelfPermission(p) == PackageManager.PERMISSION_GRANTED; }

    String[] neededPerms() {
        List<String> l = new ArrayList<>();
        if (Build.VERSION.SDK_INT >= 31) {
            if (!has(Manifest.permission.BLUETOOTH_SCAN)) l.add(Manifest.permission.BLUETOOTH_SCAN);
            if (!has(Manifest.permission.BLUETOOTH_CONNECT)) l.add(Manifest.permission.BLUETOOTH_CONNECT);
        } else if (!has(Manifest.permission.ACCESS_FINE_LOCATION)) {
            l.add(Manifest.permission.ACCESS_FINE_LOCATION);
        }
        return l.toArray(new String[0]);
    }

    void ensureReady(Runnable ok, Fail fail) {
        if (readyFail != null) readyFail.f("InvalidStateError", "Bluetooth hazırlanıyor");
        readyOk = ok;
        readyFail = fail;
        if (!act.getPackageManager().hasSystemFeature(PackageManager.FEATURE_BLUETOOTH_LE)) { finishReady(false, "NotSupportedError", "Bu telefonda Bluetooth LE yok."); return; }
        BluetoothManager bm = (BluetoothManager) act.getSystemService(Context.BLUETOOTH_SERVICE);
        adapter = bm != null ? bm.getAdapter() : null;
        if (adapter == null) { finishReady(false, "NotSupportedError", "Bu telefonda Bluetooth yok."); return; }
        String[] need = neededPerms();
        if (need.length > 0) { act.requestPermissions(need, REQ_PERM); return; }
        continueReady();
    }

    void onPermissionsResult(int req, String[] perms, int[] res) {
        if (req != REQ_PERM || readyFail == null) return;
        String[] still = neededPerms();
        if (still.length == 0) { continueReady(); return; }
        boolean forever = false;
        for (String p : still) if (!act.shouldShowRequestPermissionRationale(p)) forever = true;
        if (forever) {
            showSettingsDialog("Bluetooth izni kapalı",
                "Sensöre bağlanmak için Hisar Tetik'e " + (Build.VERSION.SDK_INT >= 31 ? "\"Yakındaki cihazlar\"" : "\"Konum\"") + " izni gerekir. Ayarlar'dan izni açıp tekrar dene.",
                Settings.ACTION_APPLICATION_DETAILS_SETTINGS, true);
        }
        finishReady(false, "NotAllowedError", "Bluetooth izni verilmedi.");
    }

    void continueReady() {
        if (!adapter.isEnabled()) {
            try { act.startActivityForResult(new Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE), REQ_ENABLE); }
            catch (Exception e) { finishReady(false, "NotAllowedError", "Bluetooth kapalı. Bluetooth'u açıp tekrar dene."); }
            return;
        }
        if (Build.VERSION.SDK_INT <= 30 && !locationOn()) {
            showSettingsDialog("Konum kapalı", "Android 11 ve öncesinde Bluetooth sensör aramak için telefonun Konum özelliği açık olmalı.", Settings.ACTION_LOCATION_SOURCE_SETTINGS, false);
            finishReady(false, "NotAllowedError", "Bluetooth araması için telefonun Konum özelliğini aç (Android 11 ve öncesi).");
            return;
        }
        finishReady(true, null, null);
    }

    void onActivityResult(int req, int res) {
        if (req != REQ_ENABLE || readyFail == null) return;
        if (adapter != null && adapter.isEnabled()) continueReady();
        else finishReady(false, "NotAllowedError", "Bluetooth kapalı. Bluetooth'u açıp tekrar dene.");
    }

    void finishReady(boolean ok, String name, String msg) {
        Runnable o = readyOk; Fail f = readyFail;
        readyOk = null; readyFail = null;
        if (ok) { if (o != null) o.run(); } else if (f != null) f.f(name, msg);
    }

    @SuppressWarnings("deprecation")
    boolean locationOn() {
        LocationManager lm = (LocationManager) act.getSystemService(Context.LOCATION_SERVICE);
        if (lm == null) return true;
        if (Build.VERSION.SDK_INT >= 28) return lm.isLocationEnabled();
        try { return lm.isProviderEnabled(LocationManager.GPS_PROVIDER) || lm.isProviderEnabled(LocationManager.NETWORK_PROVIDER); }
        catch (Exception e) { return true; }
    }

    void showSettingsDialog(String title, String msg, String action, boolean appDetails) {
        try {
            new AlertDialog.Builder(act, android.R.style.Theme_DeviceDefault_Dialog_Alert)
                .setTitle(title).setMessage(msg)
                .setPositiveButton("Ayarları aç", (d, w) -> {
                    try {
                        Intent i = new Intent(action);
                        if (appDetails) i.setData(Uri.parse("package:" + act.getPackageName()));
                        act.startActivity(i);
                    } catch (Exception ignored) { }
                })
                .setNegativeButton("Kapat", null).show();
        } catch (Exception ignored) { }
    }

    // ================================================================ cihaz seçici
    void requestDevice(int id, String opts) {
        if (reqId != -1) { err(id, "InvalidStateError", "Sensör listesi zaten açık."); return; }
        try { reqOpts = new JSONObject(opts == null ? "{}" : opts); } catch (Exception e) { reqOpts = new JSONObject(); }
        reqId = id;
        ensureReady(this::showChooser, (n, m) -> { int r = reqId; reqId = -1; err(r, n, m); });
    }

    int dp(int v) { return (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v, act.getResources().getDisplayMetrics()); }

    void showChooser() {
        foundAddr.clear(); names.clear(); rssi.clear();
        LinearLayout box = new LinearLayout(act);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setPadding(dp(20), dp(8), dp(20), 0);
        dlgMsg = new TextView(act);
        dlgMsg.setText("Sensör aranıyor… Sensör açık olmalı; ekranında BEKLİYOR yazar.");
        dlgMsg.setTextSize(14);
        box.addView(dlgMsg);
        ProgressBar pb = new ProgressBar(act, null, android.R.attr.progressBarStyleHorizontal);
        pb.setIndeterminate(true);
        box.addView(pb);
        ListView list = new ListView(act);
        listAdapter = new ArrayAdapter<>(act, android.R.layout.simple_list_item_1, new ArrayList<>());
        list.setAdapter(listAdapter);
        list.setMinimumHeight(dp(140));
        list.setOnItemClickListener((p, v, pos, idd) -> pick(pos));
        box.addView(list, new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, dp(220)));
        dlg = new AlertDialog.Builder(act, android.R.style.Theme_DeviceDefault_Dialog_Alert)
            .setTitle("Sensör seç")
            .setView(box)
            .setNegativeButton("Vazgeç", (d, w) -> cancelChooser())
            .setOnCancelListener(d -> cancelChooser())
            .create();
        dlg.show();
        startScan();
    }

    void startScan() {
        stopScan();
        BluetoothLeScanner sc = adapter.getBluetoothLeScanner();
        if (sc == null) { if (dlgMsg != null) dlgMsg.setText("Bluetooth hazır değil. Bluetooth'u kapatıp açmayı dene."); return; }
        ScanSettings set = new ScanSettings.Builder().setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY).build();
        scanCb = new ScanCallback() {
            @Override public void onScanResult(int type, ScanResult r) { h.post(() -> onFound(r)); }
            @Override public void onBatchScanResults(List<ScanResult> l) { for (ScanResult r : l) h.post(() -> onFound(r)); }
            @Override public void onScanFailed(int code) { h.post(() -> { if (dlgMsg != null) dlgMsg.setText("Arama başlatılamadı (hata " + code + "). Bluetooth'u kapatıp açmayı dene."); }); }
        };
        try { sc.startScan(null, set, scanCb); } catch (Exception e) { Log.w(TAG, "tarama", e); }
        h.removeCallbacks(scanTimeout);
        h.postDelayed(scanTimeout, 45000);
    }

    void stopScan() {
        h.removeCallbacks(scanTimeout);
        if (scanCb != null && adapter != null) {
            try { BluetoothLeScanner sc = adapter.getBluetoothLeScanner(); if (sc != null) sc.stopScan(scanCb); } catch (Exception ignored) { }
        }
        scanCb = null;
    }

    void onScanTimeout() {
        stopScan();
        if (dlgMsg != null) dlgMsg.setText(foundAddr.isEmpty()
            ? "Sensör bulunamadı. Sensörün açık ve yakında olduğundan emin ol, Vazgeç'e basıp tekrar dene."
            : "Arama bitti. Listeden sensörü seç.");
    }

    static String norm(String u) {
        String s = u.toLowerCase(Locale.ROOT);
        if (s.matches("[0-9a-f]{4}")) return "0000" + s + "-0000-1000-8000-00805f9b34fb";
        return s;
    }

    boolean matches(String name, List<ParcelUuid> uuids) {
        JSONArray f = reqOpts.optJSONArray("filters");
        if (f == null || f.length() == 0) return true;
        for (int i = 0; i < f.length(); i++) {
            JSONObject o = f.optJSONObject(i);
            if (o == null) continue;
            boolean ok = true;
            if (o.has("namePrefix")) ok = name != null && name.startsWith(o.optString("namePrefix"));
            if (ok && o.has("name")) ok = name != null && name.equals(o.optString("name"));
            if (ok && o.has("services")) {
                JSONArray s = o.optJSONArray("services");
                for (int k = 0; s != null && k < s.length() && ok; k++) {
                    String want = norm(s.optString(k));
                    boolean hit = false;
                    if (uuids != null) for (ParcelUuid p : uuids) if (p.getUuid().toString().equals(want)) hit = true;
                    ok = hit;
                }
            }
            if (ok) return true;
        }
        return false;
    }

    void onFound(ScanResult r) {
        if (reqId == -1 || listAdapter == null) return;
        BluetoothDevice d = r.getDevice();
        String a = d.getAddress();
        ScanRecord rec = r.getScanRecord();
        String name = rec != null ? rec.getDeviceName() : null;
        if (name == null) { try { name = d.getName(); } catch (Exception ignored) { } }
        if (name == null) name = names.get(a);
        if (!matches(name, rec != null ? rec.getServiceUuids() : null)) return;
        if (name != null) names.put(a, name);
        rssi.put(a, r.getRssi());
        if (!foundAddr.contains(a)) foundAddr.add(a);
        listAdapter.clear();
        for (String x : foundAddr) listAdapter.add(label(x));
        listAdapter.notifyDataSetChanged();
        if (dlgMsg != null) dlgMsg.setText("Sensörüne dokun:");
    }

    String label(String a) {
        Integer s = rssi.get(a);
        String q = s == null ? "" : s > -60 ? "çok iyi" : s > -70 ? "iyi" : s > -80 ? "orta" : "zayıf";
        String n = names.get(a);
        return (n != null ? n : "Adsız cihaz") + "\nSinyal " + q + (s != null ? " (" + s + " dBm)" : "") + " · " + a.substring(Math.max(0, a.length() - 5));
    }

    void pick(int pos) {
        if (reqId == -1 || pos < 0 || pos >= foundAddr.size()) return;
        stopScan();
        String a = foundAddr.get(pos);
        String n = names.get(a);
        prefs.edit().putString("addr", a).putString("name", n == null ? "" : n).apply();
        int id = reqId;
        reqId = -1;
        dismiss();
        JSONObject o = new JSONObject();
        try { o.put("id", a); o.put("name", n == null ? "" : n); } catch (Exception ignored) { }
        ok(id, o.toString());
    }

    void cancelChooser() {
        if (reqId == -1) return;
        stopScan();
        int id = reqId;
        reqId = -1;
        dismiss();
        err(id, "NotFoundError", "User cancelled the requestDevice() chooser.");
    }

    void dismiss() {
        try { if (dlg != null && dlg.isShowing()) dlg.dismiss(); } catch (Exception ignored) { }
        dlg = null; dlgMsg = null; listAdapter = null;
    }

    /** Daha önce seçilen sensör (açılışta listesiz bağlanmak için). */
    String knownDevice() {
        String a = prefs.getString("addr", null);
        if (a == null || !BluetoothAdapter.checkBluetoothAddress(a)) return "";
        JSONObject o = new JSONObject();
        try { o.put("id", a); o.put("name", prefs.getString("name", "")); } catch (Exception ignored) { }
        return o.toString();
    }

    // ================================================================ bağlanma
    void connect(int id, String address) {
        if (address == null || !BluetoothAdapter.checkBluetoothAddress(address)) { err(id, "NotFoundError", "Geçersiz sensör adresi"); return; }
        ensureReady(() -> doConnect(id, address), (n, m) -> err(id, n, m));
    }

    void doConnect(int id, String address) {
        if (gatt != null && address.equals(addr) && connected && !connecting) { ok(id, servicesJson()); return; }
        if (connecting && connId != -1) err(connId, "NetworkError", "Yeni bağlantı isteği");
        closeGatt();
        addr = address;
        connId = id;
        retries = 0;
        connecting = true;
        openGatt();
        h.removeCallbacks(connTimeout);
        h.postDelayed(connTimeout, 15000);
    }

    void openGatt() {
        try {
            BluetoothDevice d = adapter.getRemoteDevice(addr);
            mtuDone = false;
            if (Build.VERSION.SDK_INT >= 26) gatt = d.connectGatt(act, false, cb, BluetoothDevice.TRANSPORT_LE, BluetoothDevice.PHY_LE_1M_MASK, h);
            else gatt = d.connectGatt(act, false, cb, BluetoothDevice.TRANSPORT_LE);
            if (gatt == null) failConnect("Bağlantı açılamadı");
        } catch (Exception e) {
            failConnect("Bağlantı açılamadı: " + e.getMessage());
        }
    }

    void failConnect(String msg) {
        h.removeCallbacks(connTimeout);
        h.removeCallbacks(mtuFallback);
        connecting = false;
        closeGatt();
        int c = connId;
        connId = -1;
        err(c, "NetworkError", msg);
    }

    void onConnectTimeout() { if (connecting) failConnect("Bağlantı zaman aşımına uğradı"); }

    final BluetoothGattCallback cb = new BluetoothGattCallback() {
        @Override public void onConnectionStateChange(BluetoothGatt g, int status, int state) { h.post(() -> onConnState(g, status, state)); }
        @Override public void onMtuChanged(BluetoothGatt g, int m, int status) { h.post(() -> { if (g == gatt) afterMtu(g); }); }
        @Override public void onServicesDiscovered(BluetoothGatt g, int status) { h.post(() -> onDiscovered(g, status)); }
        @Override public void onDescriptorWrite(BluetoothGatt g, BluetoothGattDescriptor d, int status) { h.post(() -> { if (g == gatt) opDone(status == BluetoothGatt.GATT_SUCCESS, "durum " + status); }); }
        @Override public void onCharacteristicWrite(BluetoothGatt g, BluetoothGattCharacteristic c, int status) { h.post(() -> { if (g == gatt) opDone(status == BluetoothGatt.GATT_SUCCESS, "yazma " + status); }); }
        @Override public void onCharacteristicChanged(BluetoothGatt g, BluetoothGattCharacteristic c, byte[] v) { incoming(c.getUuid(), v); }
        @Override @SuppressWarnings("deprecation")
        public void onCharacteristicChanged(BluetoothGatt g, BluetoothGattCharacteristic c) { if (Build.VERSION.SDK_INT < 33) incoming(c.getUuid(), c.getValue()); }
    };

    void onConnState(BluetoothGatt g, int status, int state) {
        if (g != gatt) { try { g.close(); } catch (Exception ignored) { } return; }   // eski bağlantının geç gelen olayı
        if (state == BluetoothProfile.STATE_CONNECTED && status == BluetoothGatt.GATT_SUCCESS) {
            connected = true;
            // MTU 185 (paket başına 13 ölçüm) → yüksek öncelik (11-15 ms aralık) → servis keşfi
            h.postDelayed(() -> {
                if (gatt != g) return;
                boolean asked = false;
                try { asked = g.requestMtu(185); } catch (Exception ignored) { }
                if (asked) h.postDelayed(mtuFallback, 1500); else afterMtu(g);
            }, Build.VERSION.SDK_INT >= 26 ? 60 : 400);
            return;
        }
        boolean was = connected;
        connected = false;
        if (connecting) {
            if ((status == 133 || status == 8 || status == 62) && retries < 3) {   // Android'in bilinen geçici bağlantı hataları
                retries++;
                try { g.close(); } catch (Exception ignored) { }
                gatt = null;
                h.postDelayed(() -> { if (connecting) openGatt(); }, 300L * retries);
                return;
            }
            failConnect("Bağlanamadı (" + status + ")");
            return;
        }
        failOps("Bağlantı koptu");
        closeGatt();
        if (was) js.run("window.__hn&&__hn.disc(" + JSONObject.quote(addr) + ")");
    }

    void afterMtu(BluetoothGatt g) {
        h.removeCallbacks(mtuFallback);
        if (g == null || g != gatt || mtuDone) return;
        mtuDone = true;
        try { g.requestConnectionPriority(BluetoothGatt.CONNECTION_PRIORITY_HIGH); } catch (Exception ignored) { }
        h.postDelayed(() -> {
            if (gatt != g) return;
            boolean ok = false;
            try { ok = g.discoverServices(); } catch (Exception ignored) { }
            if (!ok && connecting) failConnect("Servisler okunamadı");
        }, 120);
    }

    void onDiscovered(BluetoothGatt g, int status) {
        if (g != gatt || !connecting) return;
        if (status != BluetoothGatt.GATT_SUCCESS) { failConnect("Servisler okunamadı (" + status + ")"); return; }
        connecting = false;
        h.removeCallbacks(connTimeout);
        int c = connId;
        connId = -1;
        ok(c, servicesJson());
    }

    String servicesJson() {
        JSONArray out = new JSONArray();
        if (gatt == null) return out.toString();
        try {
            for (BluetoothGattService s : gatt.getServices()) {
                JSONObject so = new JSONObject();
                so.put("uuid", s.getUuid().toString());
                JSONArray ca = new JSONArray();
                for (BluetoothGattCharacteristic c : s.getCharacteristics()) {
                    int p = c.getProperties();
                    JSONObject pr = new JSONObject();
                    pr.put("read", (p & BluetoothGattCharacteristic.PROPERTY_READ) != 0);
                    pr.put("write", (p & BluetoothGattCharacteristic.PROPERTY_WRITE) != 0);
                    pr.put("writeWithoutResponse", (p & BluetoothGattCharacteristic.PROPERTY_WRITE_NO_RESPONSE) != 0);
                    pr.put("notify", (p & BluetoothGattCharacteristic.PROPERTY_NOTIFY) != 0);
                    pr.put("indicate", (p & BluetoothGattCharacteristic.PROPERTY_INDICATE) != 0);
                    JSONObject co = new JSONObject();
                    co.put("uuid", c.getUuid().toString());
                    co.put("props", pr);
                    ca.put(co);
                }
                so.put("chars", ca);
                out.put(so);
            }
        } catch (Exception ignored) { }
        return out.toString();
    }

    void disconnect() {
        failOps("Bağlantı kesildi");
        if (gatt == null) return;
        if (connecting) { failConnect("Bağlantı kesildi"); return; }
        try { gatt.disconnect(); } catch (Exception ignored) { }
        h.removeCallbacks(discFallback);
        h.postDelayed(discFallback, 1200);   // bazı telefonlar olay göndermez
    }

    void onDisconnectFallback() {
        if (gatt != null && connected) {
            connected = false;
            closeGatt();
            js.run("window.__hn&&__hn.disc(" + JSONObject.quote(addr) + ")");
        }
    }

    void closeGatt() {
        h.removeCallbacks(mtuFallback);
        h.removeCallbacks(discFallback);
        if (gatt != null) {
            try { gatt.disconnect(); } catch (Exception ignored) { }
            try { gatt.close(); } catch (Exception ignored) { }
        }
        gatt = null;
        connected = false;
    }

    void close() {
        stopScan();
        dismiss();
        failOps("Uygulama kapanıyor");
        closeGatt();
    }

    // ================================================================ işlem kuyruğu
    BluetoothGattCharacteristic find(String svc, String chr) {
        if (gatt == null) return null;
        try {
            BluetoothGattService s = gatt.getService(UUID.fromString(norm(svc)));
            return s == null ? null : s.getCharacteristic(UUID.fromString(norm(chr)));
        } catch (Exception e) { return null; }
    }

    void enqueue(Op o, int id) { ops.add(new P(o, id)); pump(); }

    void pump() {
        if (cur != null) return;
        P p = ops.poll();
        if (p == null) return;
        cur = p;
        run(p);
    }

    void run(P p) {
        if (gatt == null || !connected) { cur = null; err(p.id, "NetworkError", "GATT Server is disconnected."); pump(); return; }
        int r;
        try { r = p.op.start(); } catch (Exception e) { r = -1; Log.w(TAG, "işlem", e); }
        if (r == OP_STARTED) { h.removeCallbacks(opTimeout); h.postDelayed(opTimeout, 6000); return; }
        if (r == OP_BUSY && ++p.tries < 150) { h.postDelayed(() -> { if (cur == p) run(p); }, 6); return; }   // yığın meşgul: kısa süre sonra tekrar
        cur = null;
        if (r == OP_DONE) ok(p.id, "true"); else err(p.id, "NetworkError", "GATT işlemi başlatılamadı");
        pump();
    }

    void opDone(boolean success, String why) {
        P p = cur;
        if (p == null) return;
        h.removeCallbacks(opTimeout);
        cur = null;
        if (success) ok(p.id, "true"); else err(p.id, "NetworkError", "GATT işlemi başarısız: " + why);
        pump();
    }

    void failOps(String why) {
        h.removeCallbacks(opTimeout);
        if (cur != null) { err(cur.id, "NetworkError", why); cur = null; }
        P p;
        while ((p = ops.poll()) != null) err(p.id, "NetworkError", why);
    }

    @SuppressWarnings("deprecation")
    void setNotify(int id, String svc, String chr, boolean on) {
        enqueue(() -> {
            BluetoothGattCharacteristic c = find(svc, chr);
            if (c == null || gatt == null) return -1;
            if (!gatt.setCharacteristicNotification(c, on)) return -1;
            BluetoothGattDescriptor d = c.getDescriptor(CCCD);
            if (d == null) return OP_DONE;
            byte[] v = !on ? BluetoothGattDescriptor.DISABLE_NOTIFICATION_VALUE
                : (c.getProperties() & BluetoothGattCharacteristic.PROPERTY_NOTIFY) != 0 ? BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE
                : BluetoothGattDescriptor.ENABLE_INDICATION_VALUE;
            if (Build.VERSION.SDK_INT >= 33) {
                int rc = gatt.writeDescriptor(d, v);
                return rc == BluetoothStatusCodes.SUCCESS ? OP_STARTED : rc == BluetoothStatusCodes.ERROR_GATT_WRITE_REQUEST_BUSY ? OP_BUSY : -1;
            }
            d.setValue(v);
            return gatt.writeDescriptor(d) ? OP_STARTED : OP_BUSY;
        }, id);
    }

    @SuppressWarnings("deprecation")
    void write(int id, String svc, String chr, byte[] data, boolean withResponse) {
        enqueue(() -> {
            BluetoothGattCharacteristic c = find(svc, chr);
            if (c == null || gatt == null) return -1;
            int type = withResponse ? BluetoothGattCharacteristic.WRITE_TYPE_DEFAULT : BluetoothGattCharacteristic.WRITE_TYPE_NO_RESPONSE;
            if (Build.VERSION.SDK_INT >= 33) {
                int rc = gatt.writeCharacteristic(c, data, type);
                return rc == BluetoothStatusCodes.SUCCESS ? OP_STARTED : rc == BluetoothStatusCodes.ERROR_GATT_WRITE_REQUEST_BUSY ? OP_BUSY : -1;
            }
            c.setWriteType(type);
            c.setValue(data);
            return gatt.writeCharacteristic(c) ? OP_STARTED : OP_BUSY;
        }, id);
    }

    // ================================================================ bildirimler
    void incoming(UUID u, byte[] v) {
        if (v == null) return;
        rx.add(u.toString() + "|" + Base64.encodeToString(v, Base64.NO_WRAP));
        if (flushPosted.compareAndSet(false, true)) h.post(flush);
    }

    final Runnable flush = new Runnable() {
        @Override public void run() {
            flushPosted.set(false);
            StringBuilder sb = new StringBuilder(256);
            sb.append("window.__hn&&__hn.data([");
            int n = 0;
            String it;
            while (n < 300 && (it = rx.poll()) != null) {
                int p = it.indexOf('|');
                if (n++ > 0) sb.append(',');
                sb.append("[\"").append(it, 0, p).append("\",\"").append(it, p + 1, it.length()).append("\"]");
            }
            sb.append("])");
            if (n > 0) js.run(sb.toString());
            if (!rx.isEmpty() && flushPosted.compareAndSet(false, true)) h.post(this);
        }
    };
}
