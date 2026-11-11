/* HİSAR SİMÜLATÖR · dünya
 * Tek kesintisiz arazi: Üs, Şantiye (garaj dahil) ve Poligon aynı sahnede.
 *   H.colliders  yürünemez AABB kutuları (x0,x1,z0,z1)
 *   H.zones      HUD için bölge adları
 *   H.anchors    E ile etkileşim noktaları (id, label, x, z, r)
 *   H.targets    poligon hedefleri (silah modülü vurur)
 */
(function () {
  'use strict';
  var H = window.HISAR;
  var world = (H.world = new THREE.Group());
  H.scene.add(world);
  H.colliders = [];
  H.zones = [];
  H.anchors = [];
  H.targets = [];
  H.spawn = { x: 0, z: 28, yaw: 0 };

  var C = {
    grassA: 0x6f7649, grassB: 0x8d9463, dust: 0xa99b76, sand: 0xb8a77f,
    road: 0x5a5751, concrete: 0x9c9b93, olive: 0x66703f, tan: 0xb7ab86,
    metal: 0x596069, metalDark: 0x2c3036, steel: 0x8b9097, cream: 0xd9d4bb,
    black: 0x111111, white: 0xeeeeea, rust: 0x7a4f32, yellow: 0xd8a72a,
    wood: 0x6b5238, trunk: 0x5a4632, leaf: 0x3f5a2f, mountain: 0x6e6c5c
  };

  // solid=false: yalnız görsel (yürünebilir)
  function block(x0, x1, y0, y1, z0, z1, color, solid) {
    var m = H.box(world, x1 - x0, y1 - y0, z1 - z0, H.mat(color),
      (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    if (solid !== false) H.colliders.push({ x0: x0, x1: x1, z0: z0, z1: z1 });
    return m;
  }

  // yatay zemin düzlemi
  function floor(x0, x1, z0, z1, color, y) {
    var m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), H.mat(color));
    m.rotation.x = -Math.PI / 2;
    m.position.set((x0 + x1) / 2, y || 0, (z0 + z1) / 2);
    m.receiveShadow = true;
    world.add(m);
    return m;
  }

  // iki nokta arasında yol şeridi
  function road(ax, az, bx, bz, w, color) {
    var dx = bx - ax, dz = bz - az, len = Math.sqrt(dx * dx + dz * dz);
    var g = new THREE.Group();
    g.position.set((ax + bx) / 2, 0.04, (az + bz) / 2);
    g.rotation.y = -Math.atan2(dz, dx);
    var m = new THREE.Mesh(new THREE.PlaneGeometry(len, w), H.mat(color));
    m.rotation.x = -Math.PI / 2;
    m.receiveShadow = true;
    g.add(m);
    world.add(g);
  }

  // ---------- genel zemin ve çimen lekeleri ----------
  floor(-1200, 1200, -1200, 1200, 0x7d8456, 0);
  var rnd = H.rng(20261111);
  for (var p = 0; p < 46; p++) {
    var pm = new THREE.Mesh(new THREE.CircleGeometry(14 + rnd() * 46, 18),
      H.mat(p % 2 ? C.grassA : C.grassB));
    pm.rotation.x = -Math.PI / 2;
    pm.position.set((rnd() - 0.5) * 1000, 0.01, (rnd() - 0.5) * 1000);
    pm.receiveShadow = true;
    world.add(pm);
  }

  // ---------- ÜS: karargâh bölgesi ----------
  floor(-75, 45, -60, 45, C.concrete, 0.02);
  H.zones.push({ name: 'ÜS', x0: -75, x1: 45, z0: -60, z1: 45 });
  block(-70, -42, 0, 6, -18, 8, C.olive);     // kışla A
  block(-70, -42, 0, 6, -50, -30, C.olive);   // kışla B
  block(-6, 18, 0, 7, -44, -26, C.tan);       // karargâh
  block(24, 44, 0, 5, -12, 10, C.tan);        // kantin
  var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 14, 8), H.mat(C.steel));
  pole.position.set(2, 7, 22);
  pole.castShadow = true;
  world.add(pole);
  var flag = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.6), H.mat(0xc62f2f));
  flag.position.set(3.4, 12.6, 22);
  world.add(flag);

  // ---------- yollar ----------
  road(44, 2, 130, 0, 9, C.road);             // Üs → Şantiye
  road(-60, -22, -160, -100, 9, C.road);      // Üs → Poligon
  road(-160, -100, -168, -112, 9, C.road);

  // ---------- ŞANTİYE ----------
  floor(120, 300, -125, 60, C.sand, 0.02);
  H.zones.push({ name: 'ŞANTİYE', x0: 120, x1: 300, z0: -125, z1: 60 });
  // çevre çiti; batıdaki kapı açıklığı z -22..18
  block(120, 300, 0, 2.2, -126, -124, C.steel);
  block(298, 300, 0, 2.2, -125, 60, C.steel);
  block(120, 300, 0, 2.2, 58, 60, C.steel);
  block(118, 120, 0, 2.2, -125, -22, C.steel);
  block(118, 120, 0, 2.2, 18, 60, C.steel);

  // garaj: güney cephesinde kapı, E ile tank çıkarılır
  block(232, 296, 0, 8, -116, -84, C.metal);
  block(252, 276, 0, 6.2, -84.15, -83.9, C.metalDark, false);   // kapı
  block(232, 296, 8, 8.4, -116, -84, C.steel, false);           // çatı
  H.anchors.push({ id: 'garaj', label: 'Garaja gir · tank al', x: 264, z: -78, r: 6 });

  // istif kasalar ve Uçangöz rampası (sonraki dilimlerde bağlanır)
  block(160, 168, 0, 2.6, -48, -40, C.yellow);
  block(160, 168, 2.6, 5.2, -48, -40, C.yellow);
  block(176, 186, 0, 2.6, -70, -62, C.rust);
  floor(186, 214, 22, 50, C.concrete, 0.03);

  // ---------- POLİGON ----------
  floor(-300, -120, -430, -80, C.dust, 0.02);
  H.zones.push({ name: 'POLİGON', x0: -300, x1: -120, z0: -430, z1: -80 });
  block(-258, -150, 0, 0.3, -126, -120, C.concrete, false);     // ateş hattı
  block(-182, -158, 0, 1.2, -116, -110, C.wood);                // silah rafı
  H.anchors.push({ id: 'rack', label: 'Tüfek rafı · silah seç', x: -170, z: -104, r: 5 });
  block(-200.2, -199.8, 0, 0.04, -424, -124, C.white, false);   // şerit çizgileri
  block(-140.2, -139.8, 0, 0.04, -424, -124, C.white, false);
  block(-300, -120, 0, 5, -448, -430, C.tan, false);            // kum seti

  // hedefler: 100, 150, 200, 250, 300 m
  var dists = [100, 150, 200, 250, 300];
  for (var t = 0; t < dists.length; t++) {
    var tz = -124 - dists[t];
    block(-171, -169, 0, 1.2, tz - 0.05, tz + 0.05, C.steel, false);   // ayak
    var plate = H.box(world, 2.2, 2.4, 0.08, H.mat(C.cream), -170, 2.4, tz);
    var bull = new THREE.Mesh(new THREE.CircleGeometry(0.42, 20), H.mat(C.black));
    bull.position.set(-170, 2.4, tz + 0.045);
    world.add(bull);
    H.targets.push({ x: -170, y: 2.4, z: tz, d: dists[t], plate: plate, bull: bull, alive: true });
  }

  // ---------- ağaçlar ve uzak dağlar ----------
  function inZone(x, z, m) {
    for (var i = 0; i < H.zones.length; i++) {
      var q = H.zones[i];
      if (x > q.x0 - m && x < q.x1 + m && z > q.z0 - m && z < q.z1 + m) return true;
    }
    return false;
  }
  function tree(x, z, s) {
    var g = new THREE.Group();
    var tr = new THREE.Mesh(new THREE.CylinderGeometry(0.18 * s, 0.26 * s, 2.4 * s, 6), H.mat(C.trunk));
    tr.position.y = 1.2 * s;
    tr.castShadow = true;
    var cr = new THREE.Mesh(new THREE.ConeGeometry(1.8 * s, 4.6 * s, 7), H.mat(C.leaf));
    cr.position.y = 4.0 * s;
    cr.castShadow = true;
    g.add(tr, cr);
    g.position.set(x, 0, z);
    world.add(g);
    H.colliders.push({ x0: x - 0.4, x1: x + 0.4, z0: z - 0.4, z1: z + 0.4 });
  }
  var placed = 0;
  for (var k = 0; k < 500 && placed < 110; k++) {
    var tx = (rnd() - 0.5) * 1500, tzz = (rnd() - 0.5) * 1500;
    if (inZone(tx, tzz, 14)) continue;
    tree(tx, tzz, 0.8 + rnd() * 0.7);
    placed++;
  }
  for (var m = 0; m < 26; m++) {
    var a = (m / 26) * Math.PI * 2, rad = 1050 + rnd() * 120, mh = 140 + rnd() * 160;
    var mt = new THREE.Mesh(new THREE.ConeGeometry(160 + rnd() * 120, mh, 7), H.mat(C.mountain));
    mt.position.set(Math.cos(a) * rad, mh / 2 - 10, Math.sin(a) * rad);
    world.add(mt);
  }
})();
