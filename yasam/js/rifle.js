/* HİSAR SİMÜLATÖR · tüfek (poligon)
 * Silah rafında E ile menü açılır; tüfek seçilince yaya iken kullanılır.
 *   Ateş: Boşluk / sol tık / ATEŞ (basılı tut: otomatik)
 *   Nişan: sağ tık / Q / NİŞAN (yakınlaşır)     Şarjör: R (boşalınca otomatik)
 *   Menü: 1-9 ya da tıkla   Kapat: Esc
 * Balistik: H.RIFLES düşüş tablosu (metre) hedef düzlemine uygulanır; nişan merkezi = ekran ortası.
 */
(function () {
  'use strict';
  var H = window.HISAR;
  var RF = H.RIFLES;
  var order = Object.keys(RF);
  var EYE = 1.5;
  var RELOAD = 2.4;                       // sn
  var HIT_W = 1.15, HIT_Y0 = 1.1, HIT_Y1 = 3.7;
  var RESPAWN = 12;

  var W = (H.rifle = {
    id: null, group: null,
    ammo: 0, mag: 0, reloadT: 0, cool: 0, ads: 0,
    shots: 0, hits: 0, fx: []
  });

  // ---------- model: basit tüfek (ön yüz -Z, kundağı +Z) ----------
  function buildRifle(def) {
    var g = new THREE.Group();
    var metal = H.mat(0x2b2f2b), wood = H.mat(0x6b4a2b), magM = H.mat(0x3a3f3a);
    function part(w, h, d, m, x, y, z) { return H.box(g, w, h, d, m, x, y, z); }
    part(0.07, 0.1, 0.5, metal, 0, 0, -0.05);                       // alıcı
    part(0.06, 0.07, 0.42, metal, 0, 0, -0.5);                      // ön tutamak
    part(0.05, 0.06, 0.28, def.wood ? wood : metal, 0, -0.01, 0.3); // dipçik
    part(0.05, 0.16, 0.06, magM, 0, -0.12, -0.14);                  // şarjör
    var bar = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.36, 8), metal);
    bar.rotation.x = Math.PI / 2;
    bar.position.set(0, 0.02, -0.82);
    bar.castShadow = true;
    g.add(bar);
    return g;
  }

  W.equip = function (id) {
    var def = RF[id];
    if (!def) return;
    if (W.group) H.player.group.remove(W.group);
    W.id = id;
    W.mag = def.mag;
    W.ammo = def.mag;
    W.reloadT = 0;
    W.group = buildRifle(def);
    W.group.position.set(0.22, 1.2, -0.3);   // sağ elde, göğüs hizasında
    H.player.group.add(W.group);
    H.crosshair(true);
    H.toast(def.name + ' · ' + def.cal + ' · ' + def.mag + ' mermi', 2600);
  };

  // ---------- menü (silah rafı) ----------
  var menuEl = document.getElementById('rmenu');
  var listEl = document.getElementById('rlist');
  var menuBuilt = false;

  function choose(id) {
    W.equip(id);
    closeMenu();
  }
  function buildMenu() {
    listEl.innerHTML = '';
    order.forEach(function (id, i) {
      var d = RF[id];
      var b = document.createElement('button');
      b.className = 'ritem';
      var title = document.createElement('b');
      title.textContent = (i + 1) + '. ' + d.name;
      var info = document.createElement('span');
      info.textContent = d.cal + ' · ' + d.mag + ' mermi · ' + (d.rng || '—') + ' · ' + (d.kg || '');
      b.appendChild(title);
      b.appendChild(info);
      b.addEventListener('click', function () { choose(id); });
      listEl.appendChild(b);
    });
  }
  W.openMenu = function () {
    if (!menuBuilt) { buildMenu(); menuBuilt = true; }
    H.uiOpen = true;
    if (document.exitPointerLock) document.exitPointerLock();
    menuEl.style.display = 'flex';
  };
  function closeMenu() {
    H.uiOpen = false;
    menuEl.style.display = 'none';
  }
  document.getElementById('rclose').addEventListener('click', closeMenu);

  // ---------- balistik ----------
  // tbl: {100: düşüş_m, 200: …, 300: …, 400: …}; 100 m'de sıfırlı
  function dropAt(tbl, d) {
    if (d <= 100) return 0;
    if (d >= 400) return tbl[400] + (d - 400) * 0.01;
    var a = d < 200 ? 100 : (d < 300 ? 200 : 300);
    return tbl[a] + (tbl[a + 100] - tbl[a]) * (d - a) / 100;
  }

  // ---------- görsel efektler (iz, toz) ----------
  function addFx(obj, life, grow) {
    H.scene.add(obj);
    W.fx.push({ obj: obj, life: life, max: life, grow: grow || 0 });
  }
  function tracer(a, b) {
    var geo = new THREE.BufferGeometry().setFromPoints([a, b]);
    addFx(new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xfff1b8 })), 0.14, 0);
  }
  function puff(x, y, z, color, size) {
    var m = new THREE.Mesh(new THREE.SphereGeometry(size, 8, 6),
      new THREE.MeshLambertMaterial({ color: color, transparent: true, opacity: 0.75 }));
    m.position.set(x, y, z);
    addFx(m, 0.7, 2.0);
  }
  function updateFx(dt) {
    for (var i = W.fx.length - 1; i >= 0; i--) {
      var f = W.fx[i];
      f.life -= dt;
      if (f.grow) f.obj.scale.setScalar(1 + (1 - f.life / f.max) * f.grow);
      if (f.life <= 0) {
        H.scene.remove(f.obj);
        f.obj.geometry.dispose();
        f.obj.material.dispose();
        W.fx.splice(i, 1);
      }
    }
  }

  // ---------- ateş ----------
  var _o = new THREE.Vector3(), _d = new THREE.Vector3(), _m = new THREE.Vector3(), _e = new THREE.Vector3();

  function shoot(def) {
    W.ammo--;
    W.shots++;

    // ışın: kameranın ortası, dağılım silah ve nişana göre
    var cam = H.camera;
    cam.updateMatrixWorld(true);
    _d.set(0, 0, -1).applyQuaternion(cam.quaternion);   // kameranın ileri yönü (-Z)
    _o.copy(cam.position);
    var spread = def.disp * (W.ads > 0.5 ? 0.0016 : 0.0035);
    _d.x += (Math.random() - 0.5) * 2 * spread;
    _d.y += (Math.random() - 0.5) * 2 * spread;
    _d.normalize();

    var bestT = Infinity, hit = null;
    for (var i = 0; i < H.targets.length; i++) {
      var g = H.targets[i];
      if (!g.alive || Math.abs(_d.z) < 1e-6) continue;
      var t = (g.z - _o.z) / _d.z;
      if (t <= 0 || t >= bestT) continue;
      var x = _o.x + _d.x * t;
      var y = _o.y + _d.y * t - dropAt(def.drop, t);
      if (Math.abs(x - g.x) <= HIT_W && y >= HIT_Y0 && y <= HIT_Y1) { bestT = t; hit = g; }
    }
    var groundT = _d.y < -1e-3 ? -_o.y / _d.y : Infinity;
    var useHit = !!hit && bestT <= groundT;
    var tEnd = useHit ? bestT : Math.min(groundT, 1200);
    _e.set(_o.x + _d.x * tEnd, _o.y + _d.y * tEnd - dropAt(def.drop, tEnd), _o.z + _d.z * tEnd);

    // iz: namlu ucundan
    if (W.group) {
      W.group.updateMatrixWorld(true);
      _m.set(0, 0.02, -1.0);
      W.group.localToWorld(_m);
    } else {
      _m.copy(_o);
    }
    tracer(_m.clone(), _e.clone());

    if (useHit) {
      hit.alive = false;
      hit.plate.visible = false;
      hit.bull.visible = false;
      hit.respawn = RESPAWN;
      W.hits++;
      puff(_e.x, _e.y, _e.z, 0xc9b58a, 0.9);
      H.toast('İSABET · ' + hit.d + ' m', 1400);
    } else if (isFinite(groundT)) {
      puff(_e.x, _e.y, _e.z, 0x8f8160, 0.6);
    }
  }

  // ---------- döngü ----------
  H.onUpdate(function (dt) {
    updateFx(dt);

    // menü açıkken: rakam ya da Esc
    if (H.uiOpen) {
      for (var i = 0; i < order.length && i < 9; i++) {
        if (H.pressed('Digit' + (i + 1))) { choose(order[i]); break; }
      }
      if (H.pressed('Escape')) closeMenu();
      return;
    }

    if (H.mode !== 'foot' || !W.id) {
      H.setText('wpnTxt', '');
      return;
    }

    var def = RF[W.id];
    var P = H.player;

    // nişan geçişi
    W.ads = H.clamp(W.ads + (H.input.aim ? 1 : -1) * dt * 6, 0, 1);

    // kamera ÖNCE ayarlanır (ateş bu kameranın ışınını kullanır):
    // omuz arkası; ekran ortası yatay nişan, dikey = P.pitch
    var hx = Math.sin(P.orbit), hz = -Math.cos(P.orbit);
    var D = 3.6 - W.ads * 3.85;    // nişanda kamera başın önüne geçer (kask görüşü kapatmaz)
    var tilt = -(P.pitch - 0.28);
    var cx = P.x - hx * D, cz = P.z - hz * D, cy = EYE + 0.3;
    H.camera.position.set(cx, cy, cz);
    H.camera.lookAt(cx + hx * 100, cy + Math.tan(tilt) * 100, cz + hz * 100);
    var fov = 58 - W.ads * 20;
    if (H.camera.fov !== fov) {
      H.camera.fov = fov;
      H.camera.updateProjectionMatrix();
    }
    H.focus.x = P.x;
    H.focus.z = P.z;

    // şarjör ve ateş
    W.cool = Math.max(0, W.cool - dt);
    if (W.reloadT > 0) {
      W.reloadT -= dt;
      if (W.reloadT <= 0) W.ammo = W.mag;
    }
    if (H.pressed('KeyR') && W.reloadT <= 0 && W.ammo < W.mag) W.reloadT = RELOAD;
    var trigger = H.input.fire || H.pressed('fire');   // basılı tutma (otomatik) ya da tek vuruş
    if (trigger && W.cool <= 0 && W.reloadT <= 0) {
      if (W.ammo > 0) {
        shoot(def);
        W.cool = 60 / def.rpm;
      } else {
        W.reloadT = RELOAD;
      }
    }

    H.setText('wpnTxt', def.name + ' · ' + W.ammo + '/' + W.mag +
      (W.reloadT > 0 ? ' · ŞARJ ' + W.reloadT.toFixed(1) : '') +
      (W.ads > 0.5 ? ' · NİŞAN' : ''));
  });
})();
