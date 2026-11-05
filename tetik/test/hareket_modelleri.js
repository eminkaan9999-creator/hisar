// Motion models injected into the page (window.__mm). Each model gives, per 5 ms sample (seq), what the
// HISAR sensor firmware would send: acc (5-sample mean of 1 kHz data, g), om (deg/s), jerk (max per-ms |Δa| at 1 kHz, g), snd (dB).
// World: x right, y forward, z up. Sensor axes = gun/hand frame (x right, y forward, z up) unless mount given.
window.__mm = (() => {
  const D = Math.PI / 180;
  const mm = (A, B) => A.map((r) => [0, 1, 2].map(j => r[0] * B[0][j] + r[1] * B[1][j] + r[2] * B[2][j]));
  const tr = A => [0, 1, 2].map(i => [0, 1, 2].map(j => A[j][i]));
  const mv = (A, v) => A.map(r => r[0] * v[0] + r[1] * v[1] + r[2] * v[2]);
  const Rx = a => [[1, 0, 0], [0, Math.cos(a), -Math.sin(a)], [0, Math.sin(a), Math.cos(a)]];
  const Ry = a => [[Math.cos(a), 0, Math.sin(a)], [0, 1, 0], [-Math.sin(a), 0, Math.cos(a)]];
  const Rz = a => [[Math.cos(a), -Math.sin(a), 0], [Math.sin(a), Math.cos(a), 0], [0, 0, 1]];
  const att = (yaw, pitch, roll) => mm(Rz(-yaw * D), mm(Rx(pitch * D), Ry(roll * D)));
  let seed = 4242; const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const gauss = () => { let u = 0; while (!u) u = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rnd()); };
  // a pose function P(tSec) -> {yaw,pitch,roll (deg), pos [x,y,z] m}; numerical derivatives give accel and rates
  function sensorAt(P, t) {           // proper acceleration in sensor frame (g) at time t (s)
    const h = 0.001, p0 = P(t - h), p1 = P(t), p2 = P(t + h);
    const acc = [0, 1, 2].map(k => (p2.pos[k] - 2 * p1.pos[k] + p0.pos[k]) / (h * h) / 9.81);
    const R = att(p1.yaw, p1.pitch, p1.roll), Rt = tr(R);
    const a = mv(Rt, [acc[0], acc[1], acc[2] + 1]);
    const Ra = att(p0.yaw, p0.pitch, p0.roll), Rb = att(p2.yaw, p2.pitch, p2.roll);
    const dR = mm(Rb, tr(Ra)), w = [(dR[2][1] - dR[1][2]) / 2 / (2 * h), (dR[0][2] - dR[2][0]) / 2 / (2 * h), (dR[1][0] - dR[0][1]) / 2 / (2 * h)];
    const om = mv(Rt, w).map(v => v / D);
    return { a, om };
  }
  // returns a motion(seq) for the fake sensor; P(t) pose; extra(seq) optional {jerkAdd, snd}
  function make(P, opt) {
    opt = opt || {};
    const bias = [0.4, -0.3, 0.2], noiseDb = opt.noiseDb || 30;
    let prevA = null, prevSeq = null;
    return seq => {
      const t5 = seq * 0.005; let sum = [0, 0, 0], omS = [0, 0, 0], jmax = 0;
      let last = prevSeq === seq - 1 && prevA ? prevA : sensorAt(P, t5 - 0.005).a;
      for (let k = 4; k >= 0; k--) {
        const s = sensorAt(P, t5 - k * 0.001); const a = s.a.map(v => v + gauss() * 0.003);
        const d = Math.hypot(a[0] - last[0], a[1] - last[1], a[2] - last[2]); if (d > jmax) jmax = d; last = a;
        for (let i = 0; i < 3; i++) { sum[i] += a[i] / 5; omS[i] += s.om[i] / 5; }
      }
      prevA = last; prevSeq = seq;
      const ex = opt.extra ? opt.extra(seq, t5) : null;
      let acc = sum, jerk = jmax;
      if (ex && ex.jerk) jerk = Math.max(jerk, ex.jerk);
      if (ex && ex.acc) acc = acc.map((v, i) => v + ex.acc[i]);
      const om = omS.map((v, i) => v + bias[i] + gauss() * 0.07 + (ex && ex.om ? ex.om[i] : 0));
      return { acc, om, jerk, snd: ex && ex.snd != null ? ex.snd : noiseDb + gauss() * 1.5 };
    };
  }
  const S = Math.sin, PI2 = 2 * Math.PI;
  // hand-held, sensor flat in palm, y forward. Each lasts until t1; before t0 sensor held still with tremor
  const sm = x => { x = Math.max(0, Math.min(1, x)); return x * x * x * (x * (6 * x - 15) + 10); };
  // smooth onset (0.4 s ramp) so the start of the motion itself is not an impact
  const ramp = (t0, f) => t => { const u = Math.max(0, t - t0), e = sm(u / 0.4), p = f(u); return { yaw: e * p.yaw, pitch: e * p.pitch, roll: e * p.roll, pos: p.pos.map(v => e * v) }; };
  const models = {
    sallama: t0 => ramp(t0, u => { const f = 2.6; return { yaw: 12 * S(PI2 * f * u + 0.4), pitch: 3 * S(PI2 * 1.1 * u), roll: 5 * S(PI2 * f * u + 1), pos: [0.06 * S(PI2 * f * u), 0, 0.01 * S(PI2 * 2 * f * u)] }; }),
    yavas: t0 => ramp(t0, u => { const f = 1.4; return { yaw: 6 * S(PI2 * f * u + 0.3), pitch: 2 * S(PI2 * 0.6 * u), roll: 3 * S(PI2 * f * u), pos: [0.04 * S(PI2 * f * u), 0, 0] }; }),
    dondurme: t0 => ramp(t0, u => ({ yaw: 35 * S(PI2 * 1.0 * u), pitch: 8 * S(PI2 * 0.5 * u), roll: 20 * S(PI2 * 0.7 * u + 0.5), pos: [0.02 * S(PI2 * 1.0 * u), 0, 0] })),
    sarsma: t0 => ramp(t0, u => ({ yaw: 6 * S(PI2 * 6 * u), pitch: 4 * S(PI2 * 4.3 * u), roll: 8 * S(PI2 * 5 * u), pos: [0.025 * S(PI2 * 6 * u), 0.01 * S(PI2 * 3 * u), 0.015 * S(PI2 * 5 * u + 1)] })),
    kaydirma: t0 => ramp(t0, u => { const f = 2.2; return { yaw: 1 * S(PI2 * f * u), pitch: 0, roll: 0.5 * S(PI2 * f * u), pos: [0.07 * S(PI2 * f * u), 0, 0] }; }),
    hizli: t0 => ramp(t0, u => { const f = 3.5; return { yaw: 25 * S(PI2 * f * u), pitch: 5 * S(PI2 * 2 * u), roll: 15 * S(PI2 * f * u + 1), pos: [0.08 * S(PI2 * f * u), 0, 0.02 * S(PI2 * f * u)] }; }),
  };
  // knocks (fingers/rings hitting the case) during a motion: impulse every ~0.55-0.8 s after t0
  const knocks = (t0, t1, g) => { const list = []; let t = t0 + 0.6; while (t < t1) { list.push([Math.round(t / 0.005), g * (0.7 + 0.6 * rnd())]); t += 0.55 + 0.25 * rnd(); }
    return seq => { for (const [q, a] of list) if (seq === q) return { jerk: a, acc: [0.15 * a, 0.1 * a, -0.1 * a], snd: 62 }; return null; }; };
  return { make, models, knocks, sensorAt, att };
})();
