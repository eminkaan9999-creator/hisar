// Sahte HİSAR sensörü: tarayıcının Web Bluetooth arayüzünü taklit eder ve sensör yazılımı 3'ün
// davranışını (halka tampon, "devam et" isteği, durum paketi, komutlar, mikrofon/sesli paket) birebir uygular.
// fw=2 verilirse eski yazılım gibi davranır (ses yok, mikrofon biti yok).
// Testler window.__fake üzerinden kopma, menzil dışı, sessiz bağlantı, yeniden başlama, atış hareketi üretir.
(() => {
  const SVC = '0000ffe5-0000-1000-8000-00805f9a34fb', NTF = '0000ffe4-0000-1000-8000-00805f9a34fb', WR = '0000ffe9-0000-1000-8000-00805f9a34fb';
  const now = () => performance.now();
  const F = window.__fake = {
    name: 'HISAR-SENSOR', inRange: true, connected: false, subscribed: false, streaming: false, silent: false,
    t0: now(), head: 0, sendSeq: 0, startReq: null, mtu: 185, bootId: 0x1111, fw: 3, micHw: true, sound: false, noiseDb: 28,
    cfg: { bri: 40, scr: 20, vol: 60, off: 10, no: 1 }, writes: [], connects: 0, disconnectCalls: 0, requests: 0,
    blockSend: false, holdUntil: 0, cancelChooser: false, allowGetDevices: false, overflow: 0, statusT: 0, connectDelay: 40,
    events: [], motion: null, rssi: -58, bat: 80,
  };
  const encJerk = g => g <= 0 ? 0 : g <= 8 ? Math.min(200, Math.round(g / 0.04)) : Math.min(255, 200 + Math.round((g - 8) / 0.9));
  const encSnd = db => Math.max(0, Math.min(255, Math.round(db * 2.8)));
  const micOk = () => F.fw >= 3 && F.micHw;
  function sample(seq) { const m = F.motion ? F.motion(seq) : null; return { acc: (m && m.acc) || [0, 0, 1], om: (m && m.om) || [0.4, -0.3, 0.2], j: (m && m.jerk) || 0.02, snd: m && m.snd != null ? m.snd : F.noiseDb }; }
  const dev = new EventTarget(); dev.id = 'sahte-1'; F.dev = dev;
  Object.defineProperty(dev, 'name', { get: () => F.name });
  const ntf = new EventTarget(); Object.assign(ntf, { uuid: NTF, properties: { notify: true, read: true, write: false, writeWithoutResponse: false }, value: null });
  const wr = new EventTarget(); Object.assign(wr, { uuid: WR, properties: { notify: false, read: false, write: true, writeWithoutResponse: true } });
  const svc = { uuid: SVC, getCharacteristics: async () => [ntf, wr], getCharacteristic: async u => (u === NTF ? ntf : wr) };
  const server = { device: dev, get connected() { return F.connected; },
    getPrimaryService: async () => { if (!F.connected) throw new DOMException('GATT Server is disconnected.', 'NetworkError'); return svc; } };
  dev.gatt = { get connected() { return F.connected; },
    connect: async () => { F.connects++; F.events.push(['connect', now()]); await new Promise(r => setTimeout(r, F.connectDelay));
      if (!F.inRange) throw new DOMException('Bluetooth Device is no longer in range.', 'NetworkError');
      F.connected = true; F.subscribed = false; F.streaming = false; F.silent = false; return server; },
    disconnect: () => { F.disconnectCalls++; drop('uygulama'); } };
  function drop(why) { if (!F.connected) return; if (F.ota && (F.ota.st === 'ready' || F.ota.st === 'erase')) F.ota.st = 'idle'; F.connected = false; F.subscribed = false; F.streaming = false; F.startReq = null; F.events.push(['drop', now(), why]);
    setTimeout(() => dev.dispatchEvent(new Event('gattserverdisconnected')), 0); }
  ntf.startNotifications = async () => { if (!F.connected) throw new DOMException('GATT Server is disconnected.', 'NetworkError'); F.subscribed = true; F.events.push(['abone', now()]); sendStatus(); return ntf; };
  ntf.stopNotifications = async () => { F.subscribed = false; return ntf; };
  async function write(buf) {
    if (!F.connected) throw new DOMException('GATT Server is disconnected.', 'NetworkError');
    const u = buf instanceof Uint8Array ? buf : new Uint8Array(buf.buffer || buf);
    const b = Array.from(u);
    if (b[0] >= 0x10 && b[0] <= 0x13) { otaCmd(b); return; }   // yazılım güncelleme (kayda geçirilmez, çok sayıda)
    F.writes.push(b); F.events.push(['yaz', now(), b]); cmd(b);
  }
  wr.writeValue = write; wr.writeValueWithResponse = write; wr.writeValueWithoutResponse = write;
  function cmd(b) {
    switch (b[0]) {
      case 1: F.lastTone = b; break;
      case 2: { const k = b[1], v = b[2];
        if (k === 1) F.cfg.bri = Math.max(5, Math.min(100, v)); if (k === 2) F.cfg.scr = v; if (k === 3) F.cfg.vol = Math.min(100, v); if (k === 4) F.cfg.off = v;
        if (k === 5 && v >= 1 && v <= 9 && v !== F.cfg.no) { F.cfg.no = v; setTimeout(() => F.reboot('ad'), 60); }
        F.wantStatus = true; break; }
      case 3: F.identified = (F.identified || 0) + 1; break;
      case 4: setTimeout(() => F.reboot('yeniden'), 60); break;
      case 5: F.poweredOff = true; F.inRange = false; setTimeout(() => drop('kapandi'), 60); break;
      case 6: F.wantStatus = true; break;
      case 7: F.startReq = { mode: b[1] || 0, seq: ((b[2] | (b[3] << 8) | (b[4] << 16) | (b[5] << 24)) >>> 0), at: now(), flags: b.length >= 7 ? b[6] : 0 }; break;
    }
  }
  F.reboot = why => { F.events.push(['yenidenbaslama', now(), why]); drop('yenidenbaslama'); F.t0 = now(); F.head = 0; F.sendSeq = 0; F.bootId = (F.bootId + 0x111) & 0xFFFF;
    F.name = F.cfg.no <= 1 ? 'HISAR-SENSOR' : 'HISAR-SENSOR-' + F.cfg.no; };
  F.drop = () => drop('test');
  // Yazılım güncelleme (OTA) taklidi: HisarProtocol.h OtaRx ile aynı kurallar
  F.ota = { st: 'idle', size: 0, crc: 0, off: 0, lastAck: 0, c: 0, nak: -1, eraseMs: 300, failCrc: false, dropOnce: null, newFw: null, chunks: 0 };
  function otaReply(kind, code, v) { const a = new Uint8Array(8); a[0] = 0x55; a[1] = 0x67; a[2] = kind; a[3] = code; a[4] = v & 255; a[5] = (v >> 8) & 255; a[6] = (v >> 16) & 255; a[7] = (v >>> 24) & 255; setTimeout(() => { if (F.connected) notify(a); }, 0); }
  const crcT = (() => { const t = new Uint32Array(256); for (let i = 0; i < 256; i++) { let c = i; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[i] = c >>> 0; } return t; })();
  function crcUpd(c, u8) { c = (c ^ 0xFFFFFFFF) >>> 0; for (let i = 0; i < u8.length; i++) c = crcT[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function otaCmd(b) {
    const O = F.ota, u32 = i => (b[i] | (b[i + 1] << 8) | (b[i + 2] << 16) | (b[i + 3] << 24)) >>> 0;
    if (b[0] === 0x10) { Object.assign(O, { size: u32(1), crc: u32(5), off: 0, lastAck: 0, c: 0, nak: -1, chunks: 0, st: 'erase' }); F.events.push(['ota-basla', now(), O.size]);
      setTimeout(() => { if (O.st === 'erase') { O.st = 'ready'; otaReply(1, 0, O.size); } }, O.eraseMs); return; }
    if (b[0] === 0x11) {
      if (O.st !== 'ready') { otaReply(4, 7, O.off); return; }
      const off = u32(1), data = Uint8Array.from(b.slice(5));
      if (O.dropOnce != null && off >= O.dropOnce) { O.dropOnce = null; F.events.push(['ota-kayip', now(), off]); return; }
      if (off !== O.off) { if (O.nak !== O.off) { O.nak = O.off; otaReply(4, 1, O.off); } return; }
      O.nak = -1; O.c = crcUpd(O.c, data); O.off += data.length; O.chunks++;
      if (O.off - O.lastAck >= 2048 || O.off === O.size) { O.lastAck = O.off; otaReply(2, 0, O.off); }
      return; }
    if (b[0] === 0x12) {
      if (O.st !== 'ready') { otaReply(4, 7, O.off); return; }
      if (O.off !== O.size) { otaReply(4, 2, O.off); return; }
      if (O.c !== O.crc || O.failCrc) { O.st = 'failed'; otaReply(4, 3, O.c); return; }
      O.st = 'done'; otaReply(3, 0, O.size); F.events.push(['ota-bitti', now()]);
      setTimeout(() => { F.fw = O.newFw || F.fw + 1; O.st = 'idle'; F.reboot('ota'); }, 300); return; }
    if (b[0] === 0x13) { if (O.st !== 'idle') F.events.push(['ota-vazgec', now()]); O.st = 'idle'; otaReply(5, 0, O.off); return; }
  }
  function notify(arr) { ntf.value = new DataView(arr.buffer); ntf.dispatchEvent(new Event('characteristicvaluechanged')); }
  function sendStatus() {
    const st = new Uint8Array(27); st[0] = 0x55; st[1] = 0x65; st[2] = 24;
    st[3] = F.bat; st[4] = 2 | (F.streaming ? 8 : 0) | (micOk() ? 16 : 0); st[5] = F.fw; st[6] = F.rssi & 255; st[7] = 31; st[8] = 200;
    st[9] = F.cfg.bri; st[10] = F.cfg.scr; st[11] = F.cfg.vol; st[12] = F.cfg.off; st[13] = F.cfg.no; st[14] = 0;
    const h = F.head; st[15] = h & 255; st[16] = (h >> 8) & 255; st[17] = (h >> 16) & 255; st[18] = (h >>> 24) & 255;
    st[19] = F.bootId & 255; st[20] = F.bootId >> 8; st[21] = F.overflow & 255; st[22] = (F.overflow >> 8) & 255; st[23] = 24; st[24] = 0; st[25] = F.mtu & 255; st[26] = F.mtu >> 8;
    notify(st);
  }
  const RING = 2048, SAFE = RING - 64;
  function tick() {
    const t = now(); F.head = Math.floor((t - F.t0) / 5);
    if (!F.connected || !F.subscribed || F.silent) return;
    if (!F.streaming) {
      F.sendSeq = F.head;
      F.sound = F.fw >= 3 && !!(F.startReq && (F.startReq.flags & 1));       // yazılım 3: uygulama isterse sesli paket
      if (F.startReq && t - F.startReq.at < 5000 && F.startReq.mode === 1) { const w = F.startReq.seq; if (F.head - w >= 0 && F.head - w <= SAFE) F.sendSeq = w; }
      F.startReq = null; F.streaming = true; F.events.push(['akis', now(), F.sendSeq, F.head]);
    }
    if (F.head - F.sendSeq > SAFE) { F.overflow += F.head - F.sendSeq - SAFE; F.sendSeq = F.head - SAFE; }
    if (F.wantStatus || t - F.statusT > 1000) { F.wantStatus = false; F.statusT = t; sendStatus(); }
    if (F.ota.st === 'erase' || F.ota.st === 'ready') return;          // güncelleme sırasında ölçüm gönderilmez
    if (F.blockSend || t < F.holdUntil) return;
    const snd = F.sound && F.mtu - 10 >= 14, sb = snd ? 14 : 13;
    const maxK = Math.max(1, Math.min(13, Math.floor((F.mtu - 3 - 7) / sb))), live = Math.min(4, maxK);
    for (let p = 0; p < 16; p++) {
      const avail = F.head - F.sendSeq; if (avail <= 0 || avail < live) break; const k = Math.min(avail, maxK);
      const a = new Uint8Array(7 + sb * k); a[0] = 0x55; a[1] = snd ? 0x68 : 0x66; a[2] = k; const s0 = F.sendSeq;
      a[3] = s0 & 255; a[4] = (s0 >> 8) & 255; a[5] = (s0 >> 16) & 255; a[6] = (s0 >>> 24) & 255;
      for (let j = 0; j < k; j++) { const m = sample(s0 + j), o = 7 + sb * j;
        const w = (i, v) => { v = Math.max(-32768, Math.min(32767, Math.round(v))); a[o + i] = v & 255; a[o + i + 1] = (v >> 8) & 255; };
        w(0, m.acc[0] * 2048); w(2, m.acc[1] * 2048); w(4, m.acc[2] * 2048); w(6, m.om[0] * 16.384); w(8, m.om[1] * 16.384); w(10, m.om[2] * 16.384); a[o + 12] = encJerk(m.j);
        if (snd) a[o + 13] = micOk() ? encSnd(m.snd) : 0; }
      F.sendSeq += k; notify(a);
    }
  }
  setInterval(tick, 10);
  // Atış hareketi: seq'de tetik; öncesindeki 150 ms'de namlu (dx sağ, dy yukarı derece) kayar.
  // click: tetiğin "tık" sesi (dB, null = ses yok), clickAt: darbeye göre ölçüm kayması (5 ms birim)
  F.shots = [];
  F.addShot = (seq, o) => { F.shots.push(Object.assign({ seq, dx: 0, dy: 0, spike: 3, live: false, tilt: 0, click: 72, clickAt: 0 }, o)); };
  F.sounds = [];                                   // shotsuz sesler: { seq, db }
  F.motion = seq => {
    let acc = [0, 0, 1], om = [0.4, -0.3, 0.2], jerk = 0.02;
    let snd = F.noiseDb + (((seq * 2654435761) >>> 0) % 7) * 0.5 - 1.5;          // oda gürültüsü (belirlenebilir)
    for (const x of F.sounds) if (seq === x.seq) snd = x.db;
    for (const s of F.shots) {
      const d = seq - s.seq;
      if (s.tilt && d >= -500 && d <= 150) { const a = s.tilt * Math.PI / 180; acc = [Math.sin(a), 0, Math.cos(a)]; }
      if (d >= -30 && d < 0) { om = [0.4 + s.dy / 0.15, -0.3, 0.2 - s.dx / 0.15]; }
      if (d === 0 || d === 1) { jerk = s.spike; if (s.live) { acc = [0, 16, 1]; jerk = 60; } }
      if (s.click != null && d === s.clickAt) snd = s.live ? 90 : s.click;
      if (s.live && d >= 2 && d < 5) om = [2100, -0.3, 0.2];
      if (s.live && d >= 5 && d < 8) om = [-2100, -0.3, 0.2];
    }
    return { acc, om, jerk, snd };
  };
  navigator.bluetooth = {
    requestDevice: async o => { F.requests++; F.lastFilters = o; await new Promise(r => setTimeout(r, 20)); if (F.cancelChooser) throw new DOMException('User cancelled the requestDevice() chooser.', 'NotFoundError'); return dev; },
    getDevices: async () => (F.allowGetDevices ? [dev] : []),
    getAvailability: async () => true,
  };
})();
