// Sahte Android yerel katmanı (MainActivity + Ble.java'nın sayfaya verdiği HisarNative arayüzü).
// Altında sahte_sensor.js'in Web Bluetooth taklidini kullanır; böylece bridge.js'in çevirisi
// (kimlikler, ok/err, base64 bildirim demetleri, kopma olayı, bilinen cihaz) uçtan uca denenir.
(() => {
  const FB = navigator.bluetooth;                  // sahte sensörün Web Bluetooth'u (bridge.js bunu değiştirecek)
  const H = () => window.__hn;
  const log = window.__nativeLog = [];
  const devs = new Map();
  let chars = [], rxq = [], posted = false, cur = null;
  const b64 = u8 => { let s = ''; for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]); return btoa(s); };
  const later = f => setTimeout(f, 1);
  function flush() { posted = false; const l = rxq.splice(0, 300); if (l.length) H().data(l); if (rxq.length) { posted = true; setTimeout(flush, 0); } }
  function onValue(ev) { const c = ev.target, v = new Uint8Array(c.value.buffer, c.value.byteOffset, c.value.byteLength); rxq.push([c.uuid, b64(v)]); if (!posted) { posted = true; setTimeout(flush, 0); } }
  function getDev(addr) { if (devs.has(addr)) return devs.get(addr); const f = window.__fake; if (f && f.dev && f.dev.id === addr) { devs.set(addr, f.dev); return f.dev; } return null; }
  window.HisarNative = {
    info: () => JSON.stringify({ versionName: '3.0', versionCode: 300, sdk: 34, model: 'Test Telefon' }),
    openUrl: u => log.push(['openUrl', u]),
    exitApp: () => log.push(['exitApp']),
    keepScreenOn: on => log.push(['keepScreenOn', !!on]),
    saveFile: (n, m, t) => { log.push(['saveFile', n, m, t.length]); later(() => window.__hisarSaved && window.__hisarSaved(true, n)); },
    shareFile: (n, m, b) => log.push(['shareFile', n, m, b.length]),
    bleRequest: (id, opts) => { log.push(['bleRequest', opts]);
      FB.requestDevice(JSON.parse(opts)).then(d => { devs.set(d.id, d); try { localStorage.setItem('hn.known', JSON.stringify({ id: d.id, name: d.name })); } catch (e) {} later(() => H().ok(id, JSON.stringify({ id: d.id, name: d.name }))); },
        e => later(() => H().err(id, e.name, e.message))); },
    bleKnown: () => { try { return localStorage.getItem('hn.known') || ''; } catch (e) { return ''; } },
    bleConnect: (id, addr) => { log.push(['bleConnect', addr]); const d = getDev(addr);
      if (!d) { later(() => H().err(id, 'NotFoundError', 'yok')); return; }
      if (!d.__hnDisc) { d.__hnDisc = true; d.addEventListener('gattserverdisconnected', () => { chars = []; later(() => H().disc(addr)); }); }
      d.gatt.connect().then(async srv => {
        const s = await srv.getPrimaryService('0000ffe5-0000-1000-8000-00805f9a34fb'); const cs = await s.getCharacteristics(); chars = cs; cur = addr;
        for (const c of cs) { c.removeEventListener('characteristicvaluechanged', onValue); if (c.properties.notify) c.addEventListener('characteristicvaluechanged', onValue); }
        later(() => H().ok(id, JSON.stringify([{ uuid: s.uuid, chars: cs.map(c => ({ uuid: c.uuid, props: c.properties })) }])));
      }, e => later(() => H().err(id, 'NetworkError', e.message))); },
    bleDisconnect: addr => { log.push(['bleDisconnect', addr]); const d = getDev(addr); if (d) d.gatt.disconnect(); },
    bleNotify: (id, svc, chr, on) => { const c = chars.find(x => x.uuid === chr); if (!c) { later(() => H().err(id, 'NetworkError', 'GATT Server is disconnected.')); return; }
      (on ? c.startNotifications() : c.stopNotifications()).then(() => later(() => H().ok(id, 'true')), e => later(() => H().err(id, 'NetworkError', e.message))); },
    bleWrite: (id, svc, chr, s64, resp) => { const c = chars.find(x => x.uuid === chr); if (!c) { later(() => H().err(id, 'NetworkError', 'GATT Server is disconnected.')); return; }
      const u = Uint8Array.from(atob(s64), ch => ch.charCodeAt(0)); if (u[0] < 0x10 || u[0] > 0x13) log.push(['bleWrite', Array.from(u), !!resp]);
      c.writeValue(u).then(() => later(() => H().ok(id, 'true')), e => later(() => H().err(id, 'NetworkError', e.message))); },
  };
})();
