/* HİSAR SİMÜLATÖR · yaya asker
 * İsimsiz subay: isim, rütbe ve kadro yok. Kamera omzun arkasında (üçüncü şahıs).
 *   Yürü: WASD / sol çubuk   Koş: Shift / KOŞ   Bak: fare (kilitli) / sağ alan
 * Mod 'foot' iken çalışır. Tank ve Uçangöz modları kendi modüllerinde.
 */
(function () {
  'use strict';
  var H = window.HISAR;
  var R = 0.42;          // gövde yarıçapı (çarpışma)
  var WALK = 4.6;        // m/s
  var RUN = 8.4;         // m/s
  var EYE = 1.5;         // kamera odağı yüksekliği
  var BOUND = 1000;

  var P = (H.player = {
    x: H.spawn.x, z: H.spawn.z,
    yaw: H.spawn.yaw,     // karakterin yüzü
    orbit: H.spawn.yaw,   // kamera yönü (bakış)
    pitch: 0.28,          // kamera yükseltisi
    speed: 0, phase: 0,
    group: null
  });

  // ---------- model: isimsiz asker (kamuflaj, bot, miğfer) ----------
  function buildSoldier() {
    var g = new THREE.Group();
    var uni = H.mat(0x5d6a3d), boot = H.mat(0x1f1c19), skin = H.mat(0xd3a882),
        helm = H.mat(0x3a4129), gear = H.mat(0x2b3020), belt = H.mat(0x3c3426);

    function part(w, h, d, m, x, y, z) {
      var mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      return mesh;
    }
    function limb(side, isLeg) {
      var pv = new THREE.Group();
      if (isLeg) {
        pv.position.set(0.13 * side, 0.92, 0);
        pv.add(part(0.18, 0.84, 0.2, uni, 0, -0.42, 0), part(0.19, 0.14, 0.27, boot, 0, -0.9, 0.03));
      } else {
        pv.position.set(0.33 * side, 1.5, 0);
        pv.add(part(0.15, 0.62, 0.16, uni, 0, -0.31, 0), part(0.16, 0.15, 0.17, skin, 0, -0.68, 0));
      }
      return pv;
    }
    var legL = limb(-1, true), legR = limb(1, true);
    var armL = limb(-1, false), armR = limb(1, false);

    var torso = new THREE.Group();
    torso.position.y = 1.22;
    torso.add(
      part(0.5, 0.6, 0.28, uni, 0, 0, 0),
      part(0.52, 0.36, 0.31, gear, 0, 0.1, 0),
      part(0.5, 0.08, 0.3, belt, 0, -0.27, 0)
    );

    var head = new THREE.Group();
    head.position.y = 1.7;
    var face = new THREE.Mesh(new THREE.SphereGeometry(0.125, 12, 10), skin);
    face.position.y = -0.02;
    face.castShadow = true;
    var helmet = new THREE.Mesh(new THREE.SphereGeometry(0.165, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), helm);
    helmet.position.y = 0.03;
    helmet.castShadow = true;
    head.add(face, helmet);

    g.add(torso, head, legL, legR, armL, armR);
    return { group: g, legL: legL, legR: legR, armL: armL, armR: armR, torso: torso };
  }

  var rig = buildSoldier();
  P.group = rig.group;
  H.scene.add(P.group);

  // ---------- çarpışma: dairesel gövde, AABB kutulara karşı ----------
  function pushOut(x, z) {
    var cols = H.colliders;
    for (var pass = 0; pass < 2; pass++) {
      for (var i = 0; i < cols.length; i++) {
        var c = cols[i];
        var cx = x < c.x0 ? c.x0 : (x > c.x1 ? c.x1 : x);
        var cz = z < c.z0 ? c.z0 : (z > c.z1 ? c.z1 : z);
        var dx = x - cx, dz = z - cz, d2 = dx * dx + dz * dz;
        if (d2 >= R * R) continue;
        if (d2 > 1e-10) {
          var d = Math.sqrt(d2), k = (R - d) / d;
          x += dx * k;
          z += dz * k;
        } else {
          // merkez kutunun içinde: en yakın yüzden dışarı it
          var l = x - c.x0, r = c.x1 - x, b = z - c.z0, f = c.z1 - z;
          var m = Math.min(l, r, b, f);
          if (m === l) x = c.x0 - R;
          else if (m === r) x = c.x1 + R;
          else if (m === b) z = c.z0 - R;
          else z = c.z1 + R;
        }
      }
    }
    return [x, z];
  }

  // ---------- güncelleme ----------
  H.onUpdate(function (dt) {
    if (H.mode !== 'foot') return;
    var inp = H.input;

    // bakış: kamera yörüngesi ve yükseltisi
    P.orbit = H.wrapAngle(P.orbit + inp.lookX);
    P.pitch = H.clamp(P.pitch + inp.lookY, 0.06, 0.85);

    // hareket kameraya göre: ileri = kamera yönü, sağ = kameranın sağı
    var hx = Math.sin(P.orbit), hz = -Math.cos(P.orbit);
    var rx = -hz, rz = hx;
    var mx = hx * inp.fwd + rx * inp.side;
    var mz = hz * inp.fwd + rz * inp.side;
    var ml = Math.sqrt(mx * mx + mz * mz);
    var moving = ml > 0.02;
    if (ml > 1) { mx /= ml; mz /= ml; ml = 1; }
    if (moving) P.yaw = H.lerpAngle(P.yaw, Math.atan2(mx, -mz), Math.min(1, dt * 10));

    var goal = moving ? (inp.run ? RUN : WALK) * ml : 0;
    P.speed += (goal - P.speed) * Math.min(1, dt * 7);
    var q = pushOut(P.x + mx * P.speed * dt, P.z + mz * P.speed * dt);
    P.x = H.clamp(q[0], -BOUND, BOUND);
    P.z = H.clamp(q[1], -BOUND, BOUND);

    // adım animasyonu: hıza bağlı
    P.phase += dt * P.speed * 2.5;
    var amp = H.clamp(P.speed / WALK, 0, 1.2);
    var sw = Math.sin(P.phase) * 0.75 * amp;
    rig.legL.rotation.x = sw;
    rig.legR.rotation.x = -sw;
    rig.armL.rotation.x = -sw * 0.6;
    rig.armR.rotation.x = sw * 0.6;
    rig.torso.position.y = 1.22 + Math.abs(Math.sin(P.phase)) * 0.02 * amp;

    // model: -Z yüzü, yaw'a göre döner
    P.group.position.set(P.x, 0, P.z);
    P.group.rotation.y = -P.yaw;

    // üçüncü şahıs kamera: yörüngenin arkasında
    var cp = Math.cos(P.pitch), sp = Math.sin(P.pitch), D = 4.4;
    H.camera.position.set(P.x - hx * D * cp, EYE + D * sp, P.z - hz * D * cp);
    H.camera.lookAt(P.x, EYE, P.z);

    H.focus.x = P.x;
    H.focus.z = P.z;
  });
})();
