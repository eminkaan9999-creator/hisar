// Protokol testi: sensör yazılımının gerçek C++ protokol koduyla üretilen paket akışları
// (tetik/sensor/test/akis_testi.cpp) uygulamanın ayrıştırıcısına verilir. Ölçüm değerleri,
// sıra numaraları, zamanlar, kayıp/yineleme sayıları birebir doğrulanır.
// Ayrıca eski (sürüm 1) paketler, WitMotion paketleri, durum paketi ve bozuk veri denenir.
// Kullanım: AKIS_DIR=<akis_testi çıktısı> node tetik/test/protokol_testi.js
'use strict';
const { serve, check, section, finish, openApp, chromium, fs, path, sampleFor, encJerk, decJerk } = require('./ortak');
const PORT = 8782;
const DIR = process.env.AKIS_DIR;

function readLog(file) {
  const b = fs.readFileSync(file); const out = []; let i = 0;
  while (i + 6 <= b.length) { const t = b.readUInt32LE(i), n = b.readUInt16LE(i + 4); out.push({ t, bytes: Array.from(b.subarray(i + 6, i + 6 + n)) }); i += 6 + n; }
  return out;
}

(async () => {
  if (!DIR || !fs.existsSync(DIR)) { console.error('AKIS_DIR yok: önce tetik/test/hepsi.sh çalıştır'); process.exit(2); }
  const srv = await serve(PORT); const browser = await chromium.launch();
  const scen = fs.readdirSync(DIR).filter(f => f.endsWith('.bin')).map(f => f.replace('.bin', '')).sort();

  section('Sensör yazılımı akışları → uygulama ayrıştırıcısı (' + scen.length + ' senaryo)');
  for (const name of scen) {
    const exp = JSON.parse(fs.readFileSync(path.join(DIR, name + '.json'), 'utf8'));
    const log = readLog(path.join(DIR, name + '.bin'));
    const { ctx, page, errs } = await openApp(browser, { port: PORT });
    const res = await page.evaluate(({ log }) => {
      const H = window.__hisar; H.stopSources();
      const taps = []; window.__hisarTap = (sq, t, acc, om, jv, sv) => taps.push([sq, t, Math.round(acc[0] * 2048), Math.round(acc[1] * 2048), Math.round(acc[2] * 2048), Math.round(om[0] * 16.384), Math.round(om[1] * 16.384), Math.round(om[2] * 16.384), jv, sv]);
      let seed = 7; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
      for (const n of log) { const u = new Uint8Array(n.bytes); H.parseBle(new DataView(u.buffer), 50000 + n.t + 8 + rnd() * 25); }
      return { taps, drops: H.ble.drops, dup: H.ble.dup, recv: H.ble.recv, fw: H.ble.fw, bat: H.ble.bat, rssi: H.ble.rssi, boot: H.ble.bootId, mtu: H.ble.mtu, mic: H.ble.mic, snd: H.ble.snd, sDb: H.proc.sDb };
    }, { log });
    // değerler
    let badVal = 0, badStep = 0, maxBack = 0, steps = 0, badSnd = 0;
    const withSnd = exp.sndPk > 0;
    for (const tp of res.taps) { const e = sampleFor(tp[0]); for (let i = 0; i < 6; i++) if (tp[2 + i] !== e.v[i]) { badVal++; break; } if (tp[8] !== e.jerk) badVal++;
      if (withSnd ? tp[9] !== e.snd : tp[9] !== null) badSnd++; }
    for (let i = 1; i < res.taps.length; i++) {
      const a = res.taps[i - 1], b = res.taps[i]; if (b[0] < a[0]) continue;       // yeniden başlama
      const d = (b[1] - a[1]) - (b[0] - a[0]) * 5; steps++;
      if (d < 0) maxBack = Math.max(maxBack, -d);
      if (i > 200 && Math.abs(d) > 2.01 && b[0] - a[0] < 2000) badStep++;            // ilk saniyeden sonra 5 ms adım (kayma payı 2 ms)
    }
    const ok = res.taps.length === exp.got && res.drops === exp.lost && res.dup === exp.dup && badVal === 0 && badSnd === 0 && res.snd === withSnd;
    check(ok && badStep === 0 && maxBack <= 25 && errs.length === 0,
      `${name.padEnd(11)} alınan ${res.taps.length}/${exp.got} · kayıp ${res.drops}/${exp.lost} · yineleme ${res.dup}/${exp.dup} · bozuk ${badVal} · ${withSnd ? 'sesli, ses hatası ' + badSnd : 'sessiz'} · zaman adımı hatası ${badStep} · geri adım ≤${Math.round(maxBack)} ms`,
      { errs: errs.slice(0, 3), badSnd, snd: res.snd });
    if (name === 'canli185') check(res.fw === 2 && res.bat === 80 && res.rssi === -60 && res.mtu === 185 && !res.mic, 'Durum paketi alanları (sürüm, pil, sinyal, MTU) doğru okunuyor', res);
    if (name === 'ses185') { const lastSv = res.taps[res.taps.length - 1][9];
      check(res.fw === 3 && res.mic && Math.abs(res.sDb - (lastSv ? lastSv / 2.8 : res.sDb)) < 1e-6, 'Sürüm 3: mikrofon biti okundu, ses baytı dB olarak işlemciye veriliyor', { fw: res.fw, mic: res.mic, sDb: res.sDb, lastSv }); }
    await ctx.close();
  }

  section('Eski sürüm (1) paketleri, WitMotion, durum, darbe kodlaması, bozuk veri');
  {
    const { ctx, page, errs } = await openApp(browser, { port: PORT });
    const r = await page.evaluate(({ dj }) => {
      const H = window.__hisar; H.stopSources();
      const taps = []; window.__hisarTap = (sq, t, acc, om, jv) => taps.push([sq, Math.round(acc[2] * 2048), jv]);
      const put16 = (a, o, v) => { a[o] = v & 255; a[o + 1] = (v >> 8) & 255; };
      const samp = (a, o, s) => { put16(a, o, 0); put16(a, o + 2, 0); put16(a, o + 4, 2048 + (s % 7)); put16(a, o + 6, 0); put16(a, o + 8, 0); put16(a, o + 10, 0); a[o + 12] = s % 200; };
      let seq = 65530, t = 1000;                                   // 16 bit sayaç taşması
      for (let p = 0; p < 6; p++) { const a = new Uint8Array(5 + 4 * 13); a[0] = 0x55; a[1] = 0x62; a[2] = 4; put16(a, 3, seq & 0xFFFF); for (let j = 0; j < 4; j++) samp(a, 5 + j * 13, seq + j); H.parseBle(new DataView(a.buffer), t); seq += 4; t += 20; }
      for (let p = 0; p < 4; p++) { const a = new Uint8Array(17); a[0] = 0x55; a[1] = 0x64; put16(a, 2, seq & 0xFFFF); samp(a, 4, seq); H.parseBle(new DataView(a.buffer), t); seq++; t += 5; }
      const v1 = { taps: taps.slice(), drops: H.ble.drops, dup: H.ble.dup };
      const st = new Uint8Array([0x55, 0x63, 64, 1, 1, 1]); H.parseBle(new DataView(st.buffer), t);
      const v1st = { bat: H.ble.bat, chg: H.ble.chg, fw: H.ble.fw, imu: H.ble.imu };
      // WitMotion 0x61: ivme ±16 g, jiroskop ±2000 °/sn ölçeği
      const before = H.ble.recv; const w = new Uint8Array(20); w[0] = 0x55; w[1] = 0x61; put16(w, 6, 2048); put16(w, 8, 1638); H.parseBle(new DataView(w.buffer), t + 10);
      const wit = { recv: H.ble.recv - before, accZ: +H.proc.aFast ? 0 : 0 };
      // durum (sürüm 2)
      const s2 = new Uint8Array(27); s2.set([0x55, 0x65, 24, 55, 1 | 2, 2, 0xC1, 33, 205, 70, 60, 50, 30, 3, 0, 0x10, 0x20, 0x30, 0x40, 0xEF, 0xBE, 9, 0, 24, 0, 185, 0]);
      H.parseBle(new DataView(s2.buffer), t + 20);
      const v2st = { bat: H.ble.bat, chg: H.ble.chg, imu: H.ble.imu, fw: H.ble.fw, rssi: H.ble.rssi, temp: H.ble.temp, mv: H.ble.mv, cfg: H.ble.cfg, head: H.ble.head, boot: H.ble.bootId, ovf: H.ble.ovf, itv: H.ble.itv, mtu: H.ble.mtu };
      // bozuk ve yarım paketler: hata vermemeli, sahte ölçüm üretmemeli
      const n0 = taps.length; let ex = 0;
      const junk = [[0x55], [0x55, 0x66], [0x55, 0x66, 5, 1, 2, 3, 4, 9, 9], [0x55, 0x68], [0x55, 0x68, 3, 1, 2, 3, 4, 9, 9, 9], [0x55, 0x62, 4, 0, 0, 1, 2], [0x55, 0x65, 24, 1, 2], [0, 0, 0x55, 0x99, 1, 2, 3], [0x55, 0x64, 1, 2, 3]];
      for (let k = 0; k < 400; k++) { const L = 1 + Math.floor(Math.random() * 60); const a = new Uint8Array(L); for (let i = 0; i < L; i++) a[i] = Math.random() < 0.2 ? 0x55 : Math.floor(Math.random() * 256); for (let i = 0; i + 1 < L; i++) if (a[i] === 0x55 && [0x66, 0x68, 0x62, 0x64, 0x61].includes(a[i + 1])) a[i + 1] = 0x00; junk.push(Array.from(a)); }
      for (const j of junk) { try { const a = new Uint8Array(j); H.parseBle(new DataView(a.buffer), t + 30); } catch (e) { ex++; } }
      const junkTaps = taps.length - n0;
      const jerk = [0, 1, 100, 200, 201, 230, 255].map(v => +H.decJerk(v).toFixed(3));
      const sndOk = [0, 1, 56, 168, 253].every(v => Math.abs(H.decSnd(v) - v / 2.8) < 1e-9);
      return { v1, v1st, wit, v2st, ex, junkTaps, jerk, dj: dj.map(v => +v.toFixed(3)), sndOk };
    }, { dj: [0, 1, 100, 200, 201, 230, 255].map(decJerk) });
    const seqs = r.v1.taps.map(x => x[0]);
    const contiguous = seqs.every((s, i) => i === 0 || s === seqs[i - 1] + 1);
    check(r.v1.taps.length === 28 && contiguous && r.v1.drops === 0 && r.v1.dup === 0 && seqs[0] === 65530 && seqs[seqs.length - 1] === 65557, 'Sürüm 1 paketleri: 16 bit sayaç taşması kayıpsız açılıyor (65530 → 65557)', { n: r.v1.taps.length, first: seqs[0], last: seqs[seqs.length - 1], drops: r.v1.drops });
    check(r.v1.taps.every(x => x[2] === x[0] % 200), 'Sürüm 1 darbe baytı 0,04 g birimiyle okunuyor');
    check(r.v1st.bat === 64 && r.v1st.chg === true && r.v1st.fw === 1 && r.v1st.imu === true, 'Sürüm 1 durum paketi', r.v1st);
    check(r.wit.recv === 1, 'WitMotion paketi okunuyor');
    const c = r.v2st;
    check(c.bat === 55 && c.chg && c.imu && c.fw === 2 && c.rssi === -63 && c.temp === 33 && c.mv === 4100 && c.cfg.bri === 70 && c.cfg.scr === 60 && c.cfg.vol === 50 && c.cfg.off === 30 && c.cfg.no === 3 && c.head === 0x40302010 && c.boot === 0xBEEF && c.ovf === 9 && c.itv === 30 && c.mtu === 185,
      'Sürüm 2 durum paketi: pil, şarj, sinyal, sıcaklık, gerilim, ayarlar, sayaç, açılış no, aralık, MTU', c);
    check(JSON.stringify(r.jerk) === JSON.stringify(r.dj), 'Darbe kodlaması uygulama ve sensörde aynı (0–8 g ince, 8–57 g geniş)', r.jerk);
    check(r.sndOk, 'Ses baytı çözümü sensörle aynı (dB × 2,8)');
    check(r.ex === 0 && r.junkTaps === 0, `Bozuk/yarım ${400 + 9} paket: hata yok, sahte ölçüm yok`, { ex: r.ex, junkTaps: r.junkTaps });
    check(errs.length === 0, 'Sayfa hatası yok', errs);
    await ctx.close();
  }
  await browser.close(); srv.close();
  process.exit(finish('Protokol testi') ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
