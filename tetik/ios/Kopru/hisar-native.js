// HİSAR TETİK iPhone köprüsü: Android uygulamasındaki window.HisarNative arayüzünün aynısı.
// Yerel taraf (WebViewController.swift, Ble.swift) çağrıları WKScriptMessageHandler ("hn") ile alır;
// dönüşler Android'deki gibi window.__hn.ok / err / data / disc ile gelir (bkz. Android'in bridge.js'i).
// Sayfa açılmadan önce (documentStart) yüklenir, hemen ardından bridge.js gelir.
// INFO ve known satırlarındaki yer tutucular yerel tarafta JS metin değeriyle değiştirilir.
(function () {
  "use strict";
  if (window.HisarNative) return;
  var H = window.webkit && window.webkit.messageHandlers;
  if (!H || !H.hn) return;

  var INFO = __HN_INFO__;     // info(): sürüm, platform ("ios"), model — açılışta hazırlanır
  var known = __HN_KNOWN__;   // bleKnown(): son seçilen sensör {"id","name"} ya da ""

  function post(fn, args) { try { H.hn.postMessage({ fn: fn, args: args }); } catch (e) {} }
  function str(v) { return v == null ? "" : String(v); }

  // yerel taraf son sensör değişince çağırır
  window.__hnSetKnown = function (k) { known = str(k); };

  window.HisarNative = {
    info: function () { return INFO; },
    bleKnown: function () { return known; },
    openUrl: function (url) { post("openUrl", [str(url)]); },
    exitApp: function () { post("exitApp", []); },
    keepScreenOn: function (on) { post("keepScreenOn", [!!on]); },
    saveFile: function (name, mime, text) { post("saveFile", [str(name), str(mime), str(text)]); },
    shareFile: function (name, mime, b64) { post("shareFile", [str(name), str(mime), str(b64)]); },
    bleRequest: function (id, opts) { post("bleRequest", [+id, str(opts)]); },
    bleConnect: function (id, addr) { post("bleConnect", [+id, str(addr)]); },
    bleDisconnect: function (addr) { post("bleDisconnect", [str(addr)]); },
    bleNotify: function (id, svc, chr, on) { post("bleNotify", [+id, str(svc), str(chr), !!on]); },
    bleWrite: function (id, svc, chr, b64, resp) { post("bleWrite", [+id, str(svc), str(chr), str(b64), !!resp]); },
    // sayfanın yeni sürümünü GitHub Pages'ten indirip kurar; olmazsa window.__hisarUpdateFailed(mesaj)
    update: function () { post("update", []); },
    // güncellenen sayfayı yeniden açar (sayfa hazır olunca, oturum ya da sensör güncellemesi bitince çağırır)
    reloadPage: function () { post("reloadPage", []); },
    // telefonun konumu (Sensörü bul › son görüldüğü yer); sonuç window.__hisarKonum({lat,lon,acc} | {hata})
    konum: function () { post("konum", []); }
  };

  // günlük: console ve yakalanmamış hatalar yerel günlüğe (Xcode, CI) de yazılır
  var L = H.log;
  function fmt(a) {
    if (a instanceof Error) return a.name + ": " + a.message;
    if (a && typeof a === "object") { try { return JSON.stringify(a); } catch (e) {} }
    return String(a);
  }
  function log(level, args) {
    if (!L) return;
    try { L.postMessage({ l: level, m: Array.prototype.map.call(args, fmt).join(" ").slice(0, 4000) }); } catch (e) {}
  }
  ["log", "info", "warn", "error"].forEach(function (k) {
    var orig = console[k];
    console[k] = function () { log(k, arguments); if (orig) return orig.apply(console, arguments); };
  });
  window.addEventListener("error", function (e) {
    log("HATA", [(e.message || "hata") + " @" + String(e.filename || "").split("/").pop() + ":" + (e.lineno || 0)]);
  });
  window.addEventListener("unhandledrejection", function (e) {
    var r = e.reason;
    log("HATA", ["işlenmemiş söz: " + (r && r.message ? r.name + ": " + r.message : String(r))]);
  });

  // uygulama gibi: iki parmakla büyütme kapalı (Android uygulamasında da yok)
  document.addEventListener("DOMContentLoaded", function () {
    var m = document.querySelector('meta[name="viewport"]');
    if (m && !/user-scalable/.test(m.content)) m.content += ",maximum-scale=1,user-scalable=no";
  });

  var n = -1;
  try { n = localStorage.length; } catch (e) {}
  log("info", ["yerel köprü hazır; localStorage " + n + " anahtar"]);
})();
