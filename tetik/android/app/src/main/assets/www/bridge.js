// HİSAR TETİK Android köprüsü.
// Uygulamanın kullandığı Web Bluetooth arayüzünü (requestDevice, gatt.connect, servis/özellik,
// startNotifications, writeValue...) telefonun yerel Bluetooth'una (Ble.java) bağlar.
// Ayrıca ekranı açık tutma (navigator.wakeLock) yerel pencere bayrağıyla yapılır.
(function () {
  "use strict";
  var N = window.HisarNative;
  if (!N) return;

  var seq = 1, pend = new Map(), devices = new Map(), chars = new Map();
  function mkErr(name, msg) { var e; try { e = new DOMException(msg, name); } catch (_) { e = new Error(msg); e.name = name; } return e; }
  function call(fn) {
    return new Promise(function (res, rej) {
      var id = seq++; pend.set(id, { res: res, rej: rej });
      try { fn(id); } catch (e) { pend.delete(id); rej(mkErr("NetworkError", String(e && e.message || e))); }
    });
  }
  function norm(u) { u = String(u).toLowerCase(); return /^[0-9a-f]{4}$/.test(u) ? "0000" + u + "-0000-1000-8000-00805f9b34fb" : u; }
  function b64(u8) { var s = "", i, n = u8.length; for (i = 0; i < n; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, Math.min(n, i + 0x8000))); return btoa(s); }
  function toU8(v) {
    if (v instanceof Uint8Array) return v;
    if (ArrayBuffer.isView(v)) return new Uint8Array(v.buffer, v.byteOffset, v.byteLength);
    if (v instanceof ArrayBuffer) return new Uint8Array(v);
    return new Uint8Array(v);
  }

  // yerel taraftan dönüşler
  window.__hn = {
    ok: function (id, json) { var p = pend.get(id); if (!p) return; pend.delete(id); var v = null; try { v = json ? JSON.parse(json) : null; } catch (e) { v = json; } p.res(v); },
    err: function (id, name, msg) { var p = pend.get(id); if (!p) return; pend.delete(id); p.rej(mkErr(name || "NetworkError", msg || "Bluetooth hatası")); },
    data: function (list) {
      for (var i = 0; i < list.length; i++) {
        var c = chars.get(norm(list[i][0])); if (!c) continue;
        var s = atob(list[i][1]), a = new Uint8Array(s.length);
        for (var k = 0; k < s.length; k++) a[k] = s.charCodeAt(k);
        c.value = new DataView(a.buffer);
        c.dispatchEvent(new Event("characteristicvaluechanged"));
      }
    },
    disc: function (addr) { var d = devices.get(addr); if (d && d._connected) { d._connected = false; d.dispatchEvent(new Event("gattserverdisconnected")); } }
  };

  function Characteristic(dev, svc, c) {
    var t = new EventTarget();
    t.service = svc; t.uuid = norm(c.uuid); t.value = null;
    t.properties = Object.assign({ read: false, write: false, writeWithoutResponse: false, notify: false, indicate: false }, c.props || {});
    function w(v, resp) { var u = toU8(v); return call(function (id) { N.bleWrite(id, svc.uuid, t.uuid, b64(u), !!resp); }).then(function () { return undefined; }); }
    t.startNotifications = function () { chars.set(t.uuid, t); return call(function (id) { N.bleNotify(id, svc.uuid, t.uuid, true); }).then(function () { return t; }); };
    t.stopNotifications = function () { return call(function (id) { N.bleNotify(id, svc.uuid, t.uuid, false); }).then(function () { return t; }); };
    t.writeValueWithResponse = function (v) { return w(v, true); };
    t.writeValueWithoutResponse = function (v) { return w(v, false); };
    t.writeValue = function (v) { return w(v, t.properties.write || !t.properties.writeWithoutResponse); };
    t.readValue = function () { return Promise.reject(mkErr("NotSupportedError", "Okuma desteklenmiyor")); };
    return t;
  }
  function Service(dev, s) {
    var self = { device: dev, uuid: norm(s.uuid), isPrimary: true };
    var list = (s.chars || []).map(function (c) { return Characteristic(dev, self, c); });
    self.getCharacteristics = function (u) { var l = u ? list.filter(function (c) { return c.uuid === norm(u); }) : list.slice(); return l.length ? Promise.resolve(l) : Promise.reject(mkErr("NotFoundError", "Özellik bulunamadı")); };
    self.getCharacteristic = function (u) { var c = list.find(function (x) { return x.uuid === norm(u); }); return c ? Promise.resolve(c) : Promise.reject(mkErr("NotFoundError", "Özellik bulunamadı")); };
    return self;
  }
  function Device(id, name) {
    var d = new EventTarget();
    d.id = id; d.name = name || ""; d._connected = false; d._svcs = [];
    d.gatt = {
      device: d,
      get connected() { return d._connected; },
      connect: function () {
        return call(function (cid) { N.bleConnect(cid, d.id); }).then(function (list) {
          d._connected = true; d._svcs = (list || []).map(function (s) { return Service(d, s); }); return d.gatt;
        });
      },
      disconnect: function () { if (d._connected) N.bleDisconnect(d.id); },
      getPrimaryService: function (u) {
        if (!d._connected) return Promise.reject(mkErr("NetworkError", "GATT Server is disconnected."));
        var s = d._svcs.find(function (x) { return x.uuid === norm(u); });
        return s ? Promise.resolve(s) : Promise.reject(mkErr("NotFoundError", "Servis bulunamadı"));
      },
      getPrimaryServices: function () { return Promise.resolve(d._svcs.slice()); }
    };
    return d;
  }
  function dev(info) {
    if (!info || !info.id) throw mkErr("NotFoundError", "Sensör seçilmedi");
    var d = devices.get(info.id);
    if (!d) { d = Device(info.id, info.name); devices.set(info.id, d); } else if (info.name) d.name = info.name;
    return d;
  }

  var bluetooth = {
    requestDevice: function (opts) { return call(function (id) { N.bleRequest(id, JSON.stringify(opts || {})); }).then(dev); },
    getDevices: function () { try { var k = N.bleKnown(); return Promise.resolve(k ? [dev(JSON.parse(k))] : []); } catch (e) { return Promise.resolve([]); } },
    getAvailability: function () { return Promise.resolve(true); }
  };
  try { Object.defineProperty(navigator, "bluetooth", { value: bluetooth, configurable: true }); } catch (e) { try { navigator.bluetooth = bluetooth; } catch (_) {} }

  // ekranı açık tutma: oturum sırasında ekran kararmasın
  var locks = new Set();
  function apply() { try { N.keepScreenOn(locks.size > 0); } catch (e) {} }
  var wakeLock = {
    request: function (type) {
      var s = new EventTarget(); s.type = type || "screen"; s.released = false;
      s.release = function () { if (!s.released) { s.released = true; locks.delete(s); apply(); s.dispatchEvent(new Event("release")); } return Promise.resolve(); };
      locks.add(s); apply(); return Promise.resolve(s);
    }
  };
  document.addEventListener("visibilitychange", function () { if (document.hidden) Array.from(locks).forEach(function (s) { s.release(); }); });
  try { Object.defineProperty(navigator, "wakeLock", { value: wakeLock, configurable: true }); } catch (e) {}
})();
