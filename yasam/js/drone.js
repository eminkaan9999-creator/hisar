/* HİSAR SİMÜLATÖR · Uçangöz (drone) · DJI tarzı kumanda
 * Kalkış: Şantiye drone rampası (E). Ekranda kumanda, ya da klavye:
 *   Sol çubuk: yukarı-aşağı irtifa, sola-sağa dönüş
 *   Sağ çubuk: ileri-geri, yan kayma
 *   Dikey kamera sütunu: kamera açısı (yukarı = yukarı bak)
 *   İŞARETLE: ekran ortasına en yakın hedefi kilitler · BOMBA: bırakır (kilitliyse hedefe gider)
 *   İNİŞ: 3 m altta iken rampaya döner; pil ve bombalar dolar
 * Klavye: WASD ileri-geri/yan · Q/E irtifa · ←/→ dön · ↑/↓ kamera · Boşluk bomba · M işaretle · L iniş (3 m altında)
 * Fizik ve kamera açısı kaynak: yasam/kumanda-testi.html (aynı sabitler).
 */
(function () {
  'use strict';
  var H = window.HISAR;
  var G = 9.8;
  var BOUND = 1000;
  var LAND_H = 3.0;
  var PAD = { x: 200, z: 36 };          // Şantiye drone rampası (world.js ile aynı)
  var tmp = new THREE.Vector3(), fwdV = new THREE.Vector3(), dv = new THREE.Vector3();
  var touch = { lx: 0, ly: 0, rx: 0, ry: 0 };

  var D = (H.drone = {
    active: false,
    pos: new THREE.Vector3(PAD.x, 2, PAD.z),
    vel: new THREE.Vector3(),
    yaw: 0, vy: 0, tilt: -0.3,
    battery: 100, bombs: 6, score: 0,
    lock: null, cooldown: 0,
    bombList: [], blasts: [],
    model: null
  });

  H.camera.rotation.order = 'YXZ';

  function pick(t, k) { return Math.abs(t) > 0.02 ? t : k; }

  // ---------- rampadaki drone modeli (uçarken gizlenir) ----------
  function buildQuad() {
    var g = new THREE.Group();
    var K = H.mat(0x2b2f2b), R = H.mat(0x161816);
    H.box(g, 0.9, 0.3, 1.5, K, 0, 0, 0);
    for (var s = -1; s <= 1; s += 2) {
      for (var f = -1; f <= 1; f += 2) {
        H.box(g, 0.12, 0.08, 0.12, K, s * 0.7, 0.05, f * 0.7);
        var rotor = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.03, 14), R);
        rotor.position.set(s * 0.7, 0.2, f * 0.7);
        g.add(rotor);
      }
    }
    g.position.set(PAD.x, 0.25, PAD.z);
    return g;
  }
  D.model = buildQuad();
  H.scene.add(D.model);

  // ---------- kumanda: çubuklar ve kamera sütunu (DOM) ----------
  function makeStick(el, set) {
    var knob = el.querySelector('.kknob');
    var pid = null;
    function move(e) {
      var r = el.getBoundingClientRect();
      var t = el.clientWidth / 2 - 28;
      var x = (e.clientX - (r.left + r.width / 2)) / t;
      var y = -(e.clientY - (r.top + r.height / 2)) / t;
      var m = Math.hypot(x, y);
      if (m > 1) { x /= m; y /= m; }
      knob.style.transform = 'translate(' + (x * t) + 'px,' + (-y * t) + 'px)';
      set(x, y);
    }
    function up(e) {
      if (e.pointerId !== pid) return;
      pid = null;
      knob.style.transform = 'translate(0px,0px)';
      set(0, 0);
    }
    el.addEventListener('pointerdown', function (e) { pid = e.pointerId; el.setPointerCapture(pid); move(e); });
    el.addEventListener('pointermove', function (e) { if (e.pointerId === pid) move(e); });
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  }
  makeStick(document.getElementById('dls'), function (x, y) { touch.lx = x; touch.ly = y; });
  makeStick(document.getElementById('drs'), function (x, y) { touch.rx = x; touch.ry = y; });

  var tiltEl = document.getElementById('dtilt');
  var tiltK = document.getElementById('dtiltk');
  var tpid = null;
  function tiltMove(e) {
    var r = tiltEl.getBoundingClientRect();
    var t = H.clamp((e.clientY - r.top) / r.height, 0, 1);
    D.tilt = H.clamp(0.25 - t * 1.7, -1.45, 0.25);
  }
  tiltEl.addEventListener('pointerdown', function (e) { tpid = e.pointerId; tiltEl.setPointerCapture(tpid); tiltMove(e); });
  tiltEl.addEventListener('pointermove', function (e) { if (e.pointerId === tpid) tiltMove(e); });
  function tiltEnd(e) { if (e.pointerId === tpid) tpid = null; }
  tiltEl.addEventListener('pointerup', tiltEnd);
  tiltEl.addEventListener('pointercancel', tiltEnd);

  document.getElementById('dBomb').addEventListener('pointerdown', function (e) { e.preventDefault(); bomb(); });
  document.getElementById('dMark').addEventListener('pointerdown', function (e) { e.preventDefault(); markTarget(); });
  document.getElementById('dLand').addEventListener('click', function () { tryLand(); });

  // ---------- kilit ve bomba ----------
  function inFront(p) {
    fwdV.set(0, 0, -1).applyQuaternion(H.camera.quaternion);
    dv.copy(p).sub(H.camera.position);
    return dv.dot(fwdV) > 0;
  }

  function markTarget() {
    if (!D.active) return;
    H.camera.updateMatrixWorld(true);
    if (D.lock) { D.lock = null; H.toast('Kilit kaldırıldı'); return; }
    var best = null, bd = 0.5;
    for (var i = 0; i < H.targets.length; i++) {
      var t = H.targets[i];
      if (!t.alive) continue;
      tmp.set(t.x, 2.2, t.z);
      if (!inFront(tmp)) continue;
      tmp.project(H.camera);
      var d = Math.hypot(tmp.x, tmp.y);
      if (d < bd) { bd = d; best = t; }
    }
    D.lock = best;
    H.toast(best ? 'Hedef kilitlendi' : 'Nişanda hedef yok');
  }

  function bomb() {
    if (!D.active || D.bombs <= 0 || D.cooldown > 0) return;
    D.bombs--;
    D.cooldown = 0.7;
    var mesh = new THREE.Mesh(new THREE.SphereGeometry(0.6, 8, 6), new THREE.MeshBasicMaterial({ color: 0x202020 }));
    mesh.position.set(D.pos.x, D.pos.y - 1.5, D.pos.z);
    var v = new THREE.Vector3(D.vel.x, D.vy, D.vel.z);
    var aided = false;
    if (D.lock && D.lock.alive) {
      // kilitli hedefe düşecek yatay hız: düşüş süresi kadar
      var h = mesh.position.y;
      var t = (v.y + Math.sqrt(v.y * v.y + 2 * G * h)) / G;
      v.x = (D.lock.x - mesh.position.x) / t;
      v.z = (D.lock.z - mesh.position.z) / t;
      aided = true;
    }
    H.scene.add(mesh);
    D.bombList.push({ mesh: mesh, vel: v });
    H.toast(aided ? 'Bomba kilitli hedefe gönderildi' : 'Bomba bırakıldı', 1600);
  }

  function explode(x, z) {
    var m = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10),
      new THREE.MeshBasicMaterial({ color: 0xff9a3c, transparent: true, opacity: 0.95 }));
    m.position.set(x, 2, z);
    H.scene.add(m);
    D.blasts.push({ mesh: m, t: 0 });
    var hits = 0;
    for (var i = 0; i < H.targets.length; i++) {
      var t = H.targets[i];
      if (t.alive && Math.hypot(t.x - x, t.z - z) < 11) { H.killTarget(t); hits++; }
    }
    D.score += hits;
    H.toast(hits ? 'HEDEF İMHA EDİLDİ' : 'Iska', 1600);
  }

  function updateBombs(dt) {
    for (var i = D.bombList.length - 1; i >= 0; i--) {
      var b = D.bombList[i];
      b.vel.y -= G * dt;
      b.mesh.position.addScaledVector(b.vel, dt);
      if (b.mesh.position.y <= 0) {
        explode(b.mesh.position.x, b.mesh.position.z);
        H.scene.remove(b.mesh);
        D.bombList.splice(i, 1);
      }
    }
  }

  function updateBlasts(dt) {
    for (var i = D.blasts.length - 1; i >= 0; i--) {
      var b = D.blasts[i];
      b.t += dt;
      b.mesh.scale.setScalar(1 + b.t * 16);
      b.mesh.material.opacity = Math.max(0, 0.95 - b.t * 1.7);
      if (b.t > 0.6) {
        H.scene.remove(b.mesh);
        b.mesh.geometry.dispose();
        b.mesh.material.dispose();
        D.blasts.splice(i, 1);
      }
    }
  }

  // ---------- kalkış ve iniş ----------
  function setUI(on) {
    document.body.classList.toggle('drone', on);
    D.model.visible = !on;
    H.player.group.visible = !on;
    H.crosshair(false);                              // uçuşta kumandanın kendi nişanı var
    H.camera.fov = on ? 68 : 58;                     // FPV geniş görüş; yayada normal
    H.camera.updateProjectionMatrix();
    if (!on) H.crosshair(!!(H.rifle && H.rifle.id));
  }

  D.launch = function () {
    if (D.active) return false;
    D.active = true;
    H.mode = 'drone';
    D.pos.set(PAD.x, 2.5, PAD.z);
    D.vel.set(0, 0, 0);
    D.vy = 0;
    D.yaw = 0;
    D.tilt = -0.3;
    D.bombs = 6;
    D.lock = null;
    setUI(true);
    H.toast('Uçangöz havalandı · İŞARETLE: kilitle · BOMBA: bırak', 3200);
    return true;
  };

  function tryLand() {
    if (!D.active) return;
    if (D.pos.y > LAND_H) { H.toast('Önce alçal (Q veya sol çubuk aşağı)'); return; }
    D.active = false;
    H.mode = 'foot';
    D.pos.set(PAD.x, 2, PAD.z);
    D.vel.set(0, 0, 0);
    D.vy = 0;
    D.bombs = 6;
    D.battery = 100;
    D.lock = null;
    H.player.x = PAD.x - 3;
    H.player.z = PAD.z;
    H.player.speed = 0;
    H.player.yaw = 0;
    setUI(false);
    H.toast('Uçangöz rampaya indi · pil ve bombalar dolu');
  }

  // ---------- HUD ----------
  function hud() {
    H.setText('modeTxt', 'UÇANGÖZ');
    var zn = 'ARAZİ';
    for (var zi = 0; zi < H.zones.length; zi++) {
      var zq = H.zones[zi];
      if (D.pos.x >= zq.x0 && D.pos.x <= zq.x1 && D.pos.z >= zq.z0 && D.pos.z <= zq.z1) { zn = zq.name; break; }
    }
    H.setText('zoneTxt', zn);
    H.setText('dAlt', 'İRTİFA ' + Math.round(D.pos.y) + ' m');
    H.setText('dSpd', 'HIZ ' + Math.round(Math.hypot(D.vel.x, D.vel.z) * 3.6) + ' km/sa');
    H.setText('dBat', 'PİL %' + Math.round(D.battery));
    H.setText('dBombs', 'BOMBA ' + '●'.repeat(D.bombs) + '○'.repeat(6 - D.bombs));
    H.setText('dScore', 'İMHA ' + D.score + '/' + H.targets.length);
    tiltK.style.top = ((0.25 - D.tilt) / 1.7 * 100) + '%';

    var box = document.getElementById('dLockBox');
    if (D.lock && D.lock.alive) {
      var d = Math.hypot(D.lock.x - D.pos.x, D.lock.z - D.pos.z);
      H.setText('dLockInfo', 'KİLİT ' + Math.round(d) + ' m');
      tmp.set(D.lock.x, 2.2, D.lock.z);
      var shown = false;
      if (inFront(tmp)) {
        tmp.project(H.camera);
        if (Math.abs(tmp.x) < 1 && Math.abs(tmp.y) < 1) {
          box.style.display = 'block';
          box.style.left = ((tmp.x * 0.5 + 0.5) * 100) + '%';
          box.style.top = ((-tmp.y * 0.5 + 0.5) * 100) + '%';
          shown = true;
        }
      }
      if (!shown) box.style.display = 'none';
    } else {
      box.style.display = 'none';
      H.setText('dLockInfo', '');
    }
  }

  // ---------- döngü ----------
  H.onUpdate(function (dt) {
    updateBombs(dt);
    updateBlasts(dt);
    if (D.cooldown > 0) D.cooldown = Math.max(0, D.cooldown - dt);
    if (H.mode !== 'drone' || !D.active) return;

    // girdi: dokunmatik çubuklar, yoksa klavye
    var dead = D.battery <= 0;
    var lx = pick(touch.lx, Number(H.key('ArrowRight')) - Number(H.key('ArrowLeft')));
    var ly = pick(touch.ly, Number(H.key('KeyE')) - Number(H.key('KeyQ')));
    var rx = pick(touch.rx, Number(H.key('KeyD')) - Number(H.key('KeyA')));
    var ry = pick(touch.ry, Number(H.key('KeyW')) - Number(H.key('KeyS')));
    if (H.key('ArrowUp')) D.tilt += dt * 0.9;
    if (H.key('ArrowDown')) D.tilt -= dt * 0.9;
    D.tilt = H.clamp(D.tilt, -1.45, 0.25);
    if (dead) { lx = 0; rx = 0; ry = 0; ly = -1; }   // pil bitti: süzülerek alçal
    if (dead && D.pos.y <= LAND_H) { tryLand(); return; }   // alçalınca rampaya otomatik iniş

    // irtifa ve dönüş
    D.yaw -= lx * 1.7 * dt;
    D.vy += (ly * 9 - D.vy) * Math.min(1, dt * 3);
    D.pos.y += D.vy * dt;
    if (D.pos.y < 2) { D.pos.y = 2; if (D.vy < 0) D.vy = 0; }
    if (D.pos.y > 600) D.pos.y = 600;

    // yatay hız: gövde yönüne göre
    var fx = -Math.sin(D.yaw), fz = -Math.cos(D.yaw);
    var sx = Math.cos(D.yaw), sz = -Math.sin(D.yaw);
    var tx = fx * ry * 16 + sx * rx * 10;
    var tz = fz * ry * 16 + sz * rx * 10;
    var k = Math.min(1, dt * 2.5);
    D.vel.x += (tx - D.vel.x) * k;
    D.vel.z += (tz - D.vel.z) * k;
    D.pos.x = H.clamp(D.pos.x + D.vel.x * dt, -BOUND, BOUND);
    D.pos.z = H.clamp(D.pos.z + D.vel.z * dt, -BOUND, BOUND);
    D.battery = Math.max(0, D.battery - dt * (0.2 + 0.02 * (Math.hypot(D.vel.x, D.vel.z) + Math.abs(D.vy))));

    // kamera: drone'un gövdesinden, kumanda açısıyla
    H.camera.position.copy(D.pos);
    H.camera.rotation.set(D.tilt, D.yaw, 0);
    H.focus.x = D.pos.x;
    H.focus.z = D.pos.z;

    if (H.pressed('KeyM')) markTarget();
    if (H.pressed('Space') || H.pressed('fire')) bomb();
    if (H.pressed('KeyL')) tryLand();
    if (D.lock && !D.lock.alive) D.lock = null;

    hud();
  });
})();
