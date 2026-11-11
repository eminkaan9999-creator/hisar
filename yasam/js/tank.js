/* HİSAR SİMÜLATÖR · tank (M60A3 — ilk model)
 * Garajdan çıkar (garaj noktasında E), tanka bin (yanındayken E), sür, ateş et.
 *   Sür: W/S ileri-geri · A/D gövdeyi döndürür (dururken yerinde döner)
 *   Kule: fare / sağ alan (yatay) veya J, L    Namlu: fare yukarı-aşağı / I, K
 *   Ateş: Boşluk, fare tıkı veya ATEŞ          İn: tank dururken E
 * Hareket: H.mode 'tank' iken. Gövde yönü (heading): (sin h, -cos h); model ön yüzü +Z.
 */
(function () {
  'use strict';
  var H = window.HISAR;
  var R = 2.3;                 // gövde çarpışma yarıçapı
  var VMAX = 12, VREV = 5;     // m/s
  var ACC = 4.5, DRAG = 3.2;   // m/s²
  var TURN = 0.9;              // rad/s
  var RELOAD = 5.0;            // sn
  var BOUND = 1000;
  var GUN_MIN = -0.12, GUN_MAX = 0.28;     // rad (≈ -7° … +16°)
  var TGT_HALF_W = 1.15, TGT_Y0 = 1.1, TGT_Y1 = 3.7;
  var RESPAWN = 12;            // hedef yeniden kurulma süresi (sn)

  var T = (H.tank = {
    exists: false,
    x: 264, z: -68, h: Math.PI, v: 0,   // gövde konumu, yönü, hızı
    rel: 0,                              // kule açısı (gövdeye göre)
    gun: 0.02,                           // namlu yükselti
    reload: 0, recoil: 0,
    group: null, tu: null, gn: null,
    shots: 0, hits: 0,
    fx: []
  });

  function zoneAt(x, z) {
    for (var i = 0; i < H.zones.length; i++) {
      var q = H.zones[i];
      if (x >= q.x0 && x <= q.x1 && z >= q.z0 && z <= q.z1) return q.name;
    }
    return 'ARAZİ';
  }

  // ---------- kurulum: garajdan çıkar ----------
  function place() {
    T.group.position.set(T.x, 0, T.z);
    T.group.rotation.y = Math.PI - T.h;           // ön yüz +Z → heading h
    T.tu.rotation.y = -T.rel;                     // kule gövdeye göre
    T.gn.position.set(0, 0.65, 0.5 - 0.22 * T.recoil);
    T.gn.rotation.x = -T.gun;                     // yukarı = pozitif
  }

  T.spawn = function () {
    if (T.exists) return false;
    var g = H.tankModel.mkM60(0x4a5a38, 0);
    g.traverse(function (o) {
      if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; }
    });
    H.scene.add(g);
    T.group = g;
    T.tu = g.userData.tu;
    T.gn = g.userData.gn;
    T.exists = true;
    T.x = 264; T.z = -68; T.h = Math.PI; T.v = 0; T.rel = 0; T.gun = 0.02;
    place();
    return true;
  };

  // ---------- binme / inme ----------
  function board() {
    H.mode = 'tank';
    H.player.group.visible = false;
    H.crosshair(true);
    H.toast('Tanka bindin · ateş: Boşluk veya ATEŞ · inmek için dururken E', 3600);
  }

  function dismount() {
    var P = H.player;
    // sol tarafa in
    P.x = T.x - Math.cos(T.h) * 3.4;
    P.z = T.z - Math.sin(T.h) * 3.4;
    P.speed = 0;
    P.yaw = T.h;
    P.group.visible = true;
    H.mode = 'foot';
    H.crosshair(!!(H.rifle && H.rifle.id));
    H.toast('Tanktan indin');
  }

  // ---------- ateş ----------
  var _muz = new THREE.Vector3();
  var _dir = new THREE.Vector3();

  function addFx(obj, life, grow) {
    H.scene.add(obj);
    T.fx.push({ obj: obj, life: life, max: life, grow: grow || 0 });
  }

  function tracer(a, b) {
    var geo = new THREE.BufferGeometry().setFromPoints([a, b]);
    var line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xffd27a }));
    addFx(line, 0.22, 0);
  }

  function puff(x, y, z, color, size) {
    var m = new THREE.Mesh(new THREE.SphereGeometry(size, 10, 8),
      new THREE.MeshLambertMaterial({ color: color, transparent: true, opacity: 0.8 }));
    m.position.set(x, y, z);
    addFx(m, 0.9, 2.2);
  }

  function fire() {
    T.reload = RELOAD;
    T.recoil = 1;
    T.shots++;
    T.gn.updateMatrixWorld(true);
    _muz.set(0, 0, 6.6);
    T.gn.localToWorld(_muz);
    T.gn.getWorldDirection(_dir);

    var mx = _muz.x, my = _muz.y, mz = _muz.z;
    var dx = _dir.x, dy = _dir.y, dz = _dir.z;

    // hedef düzlemleri (z sabit) ile kesişim
    var bestT = Infinity, hitTgt = null;
    for (var i = 0; i < H.targets.length; i++) {
      var g = H.targets[i];
      if (!g.alive || Math.abs(dz) < 1e-6) continue;
      var t = (g.z - mz) / dz;
      if (t <= 0 || t >= bestT) continue;
      var x = mx + dx * t, y = my + dy * t;
      if (Math.abs(x - g.x) <= TGT_HALF_W && y >= TGT_Y0 && y <= TGT_Y1) { bestT = t; hitTgt = g; }
    }
    var groundT = dy < -1e-6 ? -my / dy : Infinity;
    var useTgt = !!hitTgt && bestT <= groundT;
    var tEnd = useTgt ? bestT : (isFinite(groundT) ? groundT : 1500);
    var ex = mx + dx * tEnd, ey = my + dy * tEnd, ez = mz + dz * tEnd;

    tracer(_muz.clone(), new THREE.Vector3(ex, ey, ez));
    puff(_muz.x, _muz.y, _muz.z, 0xd9c28a, 0.6);              // namlu dumanı

    if (useTgt) {
      hitTgt.alive = false;
      hitTgt.plate.visible = false;
      hitTgt.bull.visible = false;
      hitTgt.respawn = RESPAWN;
      T.hits++;
      puff(ex, ey, ez, 0xc9b58a, 1.4);
      H.toast('İSABET · ' + hitTgt.d + ' m', 1600);
    } else if (isFinite(groundT)) {
      puff(ex, ey, ez, 0x8f8160, 1.2);                         // toprak tozu
    }
  }

  function updateFx(dt) {
    for (var i = T.fx.length - 1; i >= 0; i--) {
      var f = T.fx[i];
      f.life -= dt;
      if (f.grow) f.obj.scale.setScalar(1 + (1 - f.life / f.max) * f.grow);
      if (f.life <= 0) {
        H.scene.remove(f.obj);
        f.obj.geometry.dispose();
        f.obj.material.dispose();
        T.fx.splice(i, 1);
      }
    }
  }

  function updateTargets(dt) {
    for (var i = 0; i < H.targets.length; i++) {
      var g = H.targets[i];
      if (g.alive) continue;
      g.respawn -= dt;
      if (g.respawn <= 0) {
        g.alive = true;
        g.plate.visible = true;
        g.bull.visible = true;
      }
    }
  }

  // ---------- sürüş ----------
  function drive(dt) {
    var inp = H.input;

    // gaz: ileri VMAX, geri VREV; gaz yoksa sürtünme
    var target = inp.fwd > 0 ? VMAX * inp.fwd : VREV * inp.fwd;
    var rate = target === 0 ? DRAG : ACC;
    T.v += H.clamp(target - T.v, -rate * dt, rate * dt);

    // gövde dönüşü: geri giderken yön tersine çevrilir; yerinde dönüş yavaş
    var sp = Math.abs(T.v);
    var dir = T.v < -0.3 ? -1 : 1;
    var turnRate = sp > 0.5 ? TURN * H.clamp(sp / 5, 0.4, 1) : TURN * 0.6;
    T.h = H.wrapAngle(T.h + inp.side * turnRate * dir * dt);

    // hareket ve çarpışma
    var nx = T.x + Math.sin(T.h) * T.v * dt;
    var nz = T.z - Math.cos(T.h) * T.v * dt;
    var q = H.pushOut(nx, nz, R);
    if (Math.abs(q[0] - nx) + Math.abs(q[1] - nz) > 1e-3) T.v *= 0.4;
    T.x = H.clamp(q[0], -BOUND, BOUND);
    T.z = H.clamp(q[1], -BOUND, BOUND);

    // kule (yatay) ve namlu (dikey): fare / sağ alan + tuşlar
    var lx = inp.lookX + (H.key('KeyL') ? 1.2 * dt : 0) - (H.key('KeyJ') ? 1.2 * dt : 0);
    T.rel = H.wrapAngle(T.rel + lx);
    var gy = -inp.lookY + (H.key('KeyI') ? 0.6 * dt : 0) - (H.key('KeyK') ? 0.6 * dt : 0);
    T.gun = H.clamp(T.gun + gy, GUN_MIN, GUN_MAX);

    // ateş
    T.reload = Math.max(0, T.reload - dt);
    T.recoil = Math.max(0, T.recoil - dt * 1.6);
    if (H.pressed('fire') && T.reload <= 0) fire();

    place();

    // üçüncü şahıs kamera: kulenin arkasında
    var head = T.h + T.rel;
    var hx = Math.sin(head), hz = -Math.cos(head);
    H.camera.position.set(T.x - hx * 11, 4.6, T.z - hz * 11);
    H.camera.lookAt(T.x + hx * 30, 2.2 + Math.sin(T.gun) * 30, T.z + hz * 30);
    H.focus.x = T.x;
    H.focus.z = T.z;

    // HUD
    H.setText('zoneTxt', zoneAt(T.x, T.z));
    H.setText('modeTxt', 'TANK · ' + Math.round(sp * 3.6) + ' km/sa · ' +
      (T.reload > 0 ? 'ŞARJ ' + T.reload.toFixed(1) : 'HAZIR') + ' · İSABET ' + T.hits);

    // inme: yalnız durunca
    if (sp < 1.0) {
      H.prompt((H.isTouch ? 'ETKİLEŞİM' : '<b>E</b>') + ' · Tanktan in');
      if (H.pressed('act')) { H.consume('act'); dismount(); }
    }
  }

  // ---------- döngü ----------
  H.onUpdate(function (dt) {
    updateFx(dt);
    updateTargets(dt);
    if (H.mode === 'foot') {
      if (!T.exists) return;
      var P = H.player;
      if (Math.hypot(T.x - P.x, T.z - P.z) <= 6) {
        H.prompt((H.isTouch ? 'ETKİLEŞİM' : '<b>E</b>') + ' · Tanka bin (M60A3)');
        if (H.pressed('act')) { H.consume('act'); board(); }
      }
      return;
    }
    if (H.mode === 'tank') drive(dt);
  });
})();
