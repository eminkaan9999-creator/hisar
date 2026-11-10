// Sahte kamera: navigator.mediaDevices.getUserMedia'yı taklit eder. 1920×1080 tuval: toprak set, karton, kağıt hedef
// (10 halka, 7–10 siyah), istenen zamanlarda yeşil lazer noktası (doygun beyazımsı öz, yeşil hale).
// Testler window.__cam üzerinden hedefi kaydırır (telefon kıpırdadı), nokta ekler, kamera iznini reddeder,
// hedefin çevresine kamera gürültüsü (gurultu = kanal başına standart sapma) ekler; zayif nokta: güneşte soluk görünen lazer.
// renk 'kirmizi': kırmızı lazer; sensor: true ise nokta yalnız sahte sensörün Grove lazeri yanarken görünür (yazılım 7).
// Nokta konumları hedef merkezine göre pikseldir: hedef kayınca nokta da onunla kayar (silah gerçek hedefe bakıyor).
(() => {
  const W = 1920, H = 1080;
  const C = window.__cam = { W, H, cx: 960, cy: 540, R: 120, kayX: 0, kayY: 0, dots: [], denied: false, opened: 0, stopped: 0, frames: 0, lastC: null, gurultu: 0 };
  let cv = null, g = null, gur = null, seed = 99;
  const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const gauss = () => { let u = 0; while (!u) u = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rnd()); };
  // hedef çevresinin 6 gürültülü kopyası: her karede sıradaki çizilir (gerçek kameradaki gibi kanal başına bağımsız gürültü)
  function gurultuHazirla(ox, oy) {
    const R = C.R, x0 = Math.round(ox - 1.7 * R), y0 = Math.round(oy - 1.8 * R), w = Math.round(3.4 * R), h = Math.round(3.6 * R), base = g.getImageData(x0, y0, w, h), k = [];
    for (let n = 0; n < 6; n++) { const d = new ImageData(new Uint8ClampedArray(base.data), w, h);
      for (let i = 0; i < d.data.length; i += 4) for (let c = 0; c < 3; c++) d.data[i + c] = base.data[i + c] + gauss() * C.gurultu;
      k.push(d); }
    gur = { key: C.gurultu + ',' + ox + ',' + oy, k, x0, y0, n: 0 };
  }
  function nokta(x, y, kirmizi) {
    const r = g.createRadialGradient(x, y, 0, x, y, 8);
    if (kirmizi) { r.addColorStop(0, 'rgba(255,235,230,1)'); r.addColorStop(0.3, 'rgba(255,60,40,1)'); r.addColorStop(0.7, 'rgba(230,30,20,0.6)'); r.addColorStop(1, 'rgba(230,30,20,0)'); }
    else { r.addColorStop(0, 'rgba(235,255,235,1)'); r.addColorStop(0.3, 'rgba(70,255,100,1)'); r.addColorStop(0.7, 'rgba(40,230,70,0.6)'); r.addColorStop(1, 'rgba(40,230,70,0)'); }
    g.fillStyle = r; g.beginPath(); g.arc(x, y, 8, 0, 7); g.fill();
  }
  function draw() {
    const t = performance.now(), ox = C.cx + C.kayX, oy = C.cy + C.kayY, R = C.R;
    g.fillStyle = 'rgb(118,112,100)'; g.fillRect(0, 0, W, H);                                   // toprak set
    g.fillStyle = 'rgb(96,90,80)'; for (let i = 0; i < 12; i++) g.fillRect(((i * 397) % W), 200 + ((i * 211) % 600), 140, 30);   // taşlar
    g.fillStyle = 'rgb(160,130,90)'; g.fillRect(ox - R * 1.6, oy - R * 1.7, R * 3.2, R * 3.6);    // karton
    g.fillStyle = 'rgb(240,238,230)'; g.fillRect(ox - R * 1.25, oy - R * 1.35, R * 2.5, R * 2.8);  // kağıt
    g.fillStyle = 'rgb(60,60,60)'; g.fillRect(ox - R * 1.1, oy + R * 1.12, R * 0.9, R * 0.12);      // kağıttaki yazı
    for (let k = 10; k >= 1; k--) { const r = R * k / 10; g.beginPath(); g.arc(ox, oy, r, 0, 7);
      g.fillStyle = k <= 4 ? 'rgb(22,22,22)' : 'rgb(240,238,230)'; g.fill(); g.lineWidth = 1.2; g.strokeStyle = k <= 4 ? 'rgb(225,225,225)' : 'rgb(30,30,30)'; g.stroke(); }
    if (C.gurultu) { if (!gur || gur.key !== C.gurultu + ',' + ox + ',' + oy) gurultuHazirla(ox, oy); g.putImageData(gur.k[gur.n++ % 6], gur.x0, gur.y0); }
    for (const d of C.dots) if (t >= d.t0 && t <= d.t1 && (!d.sensor || (window.__fake && window.__fake.lazerAcik(t)))) { const p = d.at ? d.at(t) : [d.x, d.y];   // sensor: yalnız sahte sensörün lazeri yanarken
      if (d.zayif) { g.fillStyle = 'rgba(40,255,70,0.2)'; g.beginPath(); g.arc(ox + p[0], oy + p[1], 6, 0, 7); g.fill(); } else nokta(ox + p[0], oy + p[1], d.renk === 'kirmizi'); }
    C.frames++;
  }
  const md = navigator.mediaDevices;
  md.getUserMedia = async c => {
    C.lastC = c; await new Promise(r => setTimeout(r, 30));
    if (C.denied) throw new DOMException('Permission denied', 'NotAllowedError');
    if (!cv) { cv = document.createElement('canvas'); cv.width = W; cv.height = H; g = cv.getContext('2d'); draw(); setInterval(draw, 16); }
    C.opened++; const st = cv.captureStream(60);
    for (const tr of st.getTracks()) { const s0 = tr.stop.bind(tr); tr.stop = () => { C.stopped++; s0(); }; }
    return st;
  };
  md.enumerateDevices = async () => [{ kind: 'videoinput', deviceId: 'arka', label: 'Arka Kamera', groupId: 'a' }, { kind: 'videoinput', deviceId: 'tele', label: 'Arka Telefoto Kamera', groupId: 'a' }];
})();
