/* HİSAR SİMÜLATÖR · Şantiye iş makineleri (sürülebilir)
 * Modeller: santiye-models.js (H.santiye). Bu modül makineleri Şantiye'ye yerleştirir,
 * binme / sürme / inmeyi yönetir. Kaynak tipleri: H.santiye.TYPES (L, Wd, maxV, acc, brk, WB, maxSt, turn, tracked).
 *   Bin: makineye yakınken E · Sür: W/S ileri-geri, A/D yön · İn: dururken E
 *   Mod 'machine' iken çalışır. Gövde yönü (heading): (sin h, -cos h); model ön yüzü +X.
 * Kapsam: yalnız sürüş. Kaynak oyunun iş (sefer, kazı, döküm) ve operatör mantığı taşınmadı.
 */
(function () {
  'use strict';
  var H = window.HISAR;
  var BOUND = 1000;
  var BOARD_D = 3.0;                       // gövde kenarından binme mesafesi (m)
  var FAR = 1e6;                           // sürülürken çarpışma kutusu uzağa atılır
  // Şantiye'de sıra: ön yüz -Z (kuzey), L boyu z ekseninde
  var PLACE = [
    { t: 'ex', x: 136, z: -24 },
    { t: 'dz', x: 158, z: -24 },
    { t: 'gr', x: 184, z: -24 },
    { t: 'tr', x: 210, z: -24 },
    { t: 'ld', x: 236, z: -24 },
    { t: 'bh', x: 262, z: -24 },
    { t: 'gt', x: 288, z: -24 }
  ];

  var list = (H.machines = []);
  var M = null;                            // binilen makine

  function zoneAt(x, z) {
    for (var i = 0; i < H.zones.length; i++) {
      var q = H.zones[i];
      if (x >= q.x0 && x <= q.x1 && z >= q.z0 && z <= q.z1) return q.name;
    }
    return 'ARAZİ';
  }

  // görsel konum: model ön yüzü +X; heading h → gövde yönü
  function placeVisual(m) {
    m.g.position.set(m.x, 0, m.z);
    m.g.rotation.y = Math.PI / 2 - m.h;
  }

  // çarpışma kutusu: park halindeyken gerçek yerinde; sürülürken uzakta (kendi kendine çarpmasın)
  function setCol(m, on) {
    var c = m.col;
    if (!on) { c.x0 = FAR; c.x1 = FAR + 1; c.z0 = FAR; c.z1 = FAR + 1; return; }
    var L2 = m.spec.L / 2, W2 = m.spec.Wd / 2;
    var s = Math.abs(Math.sin(m.h)), k = Math.abs(Math.cos(m.h));
    var hx = L2 * s + W2 * k, hz = L2 * k + W2 * s;     // dönmüş gövdenin eksen-hizalı yarıları
    c.x0 = m.x - hx; c.x1 = m.x + hx; c.z0 = m.z - hz; c.z1 = m.z + hz;
  }

  function build(p) {
    var spec = H.santiye.TYPES[p.t];
    var g = H.santiye.build(p.t).g;           // {g: grup, P: parça tablosu}
    g.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    H.scene.add(g);
    var m = {
      t: p.t, spec: spec, g: g,
      x: p.x, z: p.z, h: 0, v: 0,
      R: Math.max(spec.L, spec.Wd) * 0.42,   // gövde çarpışma yarıçapı (daire)
      col: { x0: 0, x1: 0, z0: 0, z1: 0 }
    };
    H.colliders.push(m.col);
    placeVisual(m);
    setCol(m, true);
    return m;
  }

  function board(m) {
    M = m;
    H.mode = 'machine';
    H.player.group.visible = false;
    setCol(m, false);
    H.crosshair(false);
    H.toast(m.spec.name + ' · W/S sür, A/D yön · inmek için dururken E', 3200);
  }

  function dismount() {
    var m = M, P = H.player;
    var off = m.spec.Wd / 2 + 1.6;               // sol taraftan in
    P.x = m.x - Math.cos(m.h) * off;
    P.z = m.z - Math.sin(m.h) * off;
    P.speed = 0;
    P.yaw = m.h;
    setCol(m, true);
    placeVisual(m);
    M = null;
    H.mode = 'foot';
    H.player.group.visible = true;
    H.crosshair(!!(H.rifle && H.rifle.id));
    H.toast('Makineden indin');
  }

  function drive(dt) {
    var m = M, sp = m.spec, inp = H.input;

    // gaz: ileri maxV, geri maxR; girdi yoksa ya da ters yöndeyse fren
    var target = inp.fwd > 0 ? sp.maxV * inp.fwd : sp.maxR * inp.fwd;
    var rate = (target === 0 || Math.sign(target) !== Math.sign(m.v)) ? sp.brk : sp.acc;
    m.v += H.clamp(target - m.v, -rate * dt, rate * dt);

    // dönüş: paletli (yerinde dönebilir) ya da tekerlekli (direksiyon, hıza bağlı)
    if (sp.tracked) {
      var tr = sp.turn * H.clamp(Math.abs(m.v) / 4, 0.5, 1);
      m.h = H.wrapAngle(m.h + inp.side * tr * (m.v < -0.3 ? -1 : 1) * dt);
    } else {
      m.h = H.wrapAngle(m.h + m.v * Math.tan(inp.side * sp.maxSt) / sp.WB * dt);
    }

    // hareket ve çarpışma
    var nx = m.x + Math.sin(m.h) * m.v * dt;
    var nz = m.z - Math.cos(m.h) * m.v * dt;
    var q = H.pushOut(nx, nz, m.R);
    if (Math.abs(q[0] - nx) + Math.abs(q[1] - nz) > 1e-3) m.v *= 0.4;
    m.x = H.clamp(q[0], -BOUND, BOUND);
    m.z = H.clamp(q[1], -BOUND, BOUND);
    placeVisual(m);

    // üçüncü şahıs kamera: gövdenin arkasında
    var D = Math.max(9, sp.L * 1.05), hx = Math.sin(m.h), hz = -Math.cos(m.h);
    H.camera.position.set(m.x - hx * D, sp.L > 8 ? 5.4 : 4.6, m.z - hz * D);
    H.camera.lookAt(m.x + hx * 30, 2.0, m.z + hz * 30);
    H.focus.x = m.x;
    H.focus.z = m.z;

    H.setText('zoneTxt', zoneAt(m.x, m.z));
    H.setText('modeTxt', sp.name + ' · ' + Math.round(Math.abs(m.v) * 3.6) + ' km/sa');

    // inme: yalnız durunca
    if (Math.abs(m.v) < 1) {
      H.prompt((H.isTouch ? 'ETKİLEŞİM' : '<b>E</b>') + ' · Makineden in');
      if (H.pressed('act')) { H.consume('act'); dismount(); }
    }
  }

  PLACE.forEach(function (p) { list.push(build(p)); });

  H.onUpdate(function (dt) {
    if (H.mode === 'machine') { if (M) drive(dt); return; }
    if (H.mode !== 'foot') return;
    var P = H.player, best = null, bd = 1e9;
    for (var i = 0; i < list.length; i++) {
      var m = list[i];
      var d = Math.max(0, Math.hypot(m.x - P.x, m.z - P.z) - m.spec.L / 2);   // gövdeye uzaklık
      if (d <= BOARD_D && d < bd) { bd = d; best = m; }
    }
    if (best) {
      H.prompt((H.isTouch ? 'ETKİLEŞİM' : '<b>E</b>') + ' · Makineye bin · ' + best.spec.name);
      if (H.pressed('act')) { H.consume('act'); board(best); }
    }
  });
})();
