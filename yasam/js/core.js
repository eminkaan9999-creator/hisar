/* HİSAR SİMÜLATÖR · çekirdek
 * Tek sahne, tek kamera, tek döngü. Modüller H.onUpdate(fn) ile kendi
 * güncellemelerini ekler. Girdi: H.input (sürekli) ve H.pressed(ad) (tek kare).
 * Açı birimi her yerde radyan. Yön: -Z kuzey, +X doğu.
 */
(function () {
  'use strict';
  var H = (window.HISAR = window.HISAR || {});

  // ---------- yardımcılar ----------
  H.clamp = function (v, a, b) { return v < a ? a : (v > b ? b : v); };
  H.wrapAngle = function (a) {
    while (a > Math.PI) a -= 2 * Math.PI;
    while (a < -Math.PI) a += 2 * Math.PI;
    return a;
  };
  H.lerpAngle = function (a, b, t) { return a + H.wrapAngle(b - a) * t; };
  // dairesel gövdeyi (yarıçap r) H.colliders kutularından dışarı iter; [x, z] döner
  H.pushOut = function (x, z, r) {
    var cols = H.colliders, R2 = r * r;
    for (var pass = 0; pass < 2; pass++) {
      for (var i = 0; i < cols.length; i++) {
        var c = cols[i];
        var cx = x < c.x0 ? c.x0 : (x > c.x1 ? c.x1 : x);
        var cz = z < c.z0 ? c.z0 : (z > c.z1 ? c.z1 : z);
        var dx = x - cx, dz = z - cz, d2 = dx * dx + dz * dz;
        if (d2 >= R2) continue;
        if (d2 > 1e-10) {
          var d = Math.sqrt(d2), k = (r - d) / d;
          x += dx * k;
          z += dz * k;
        } else {
          // merkez kutunun içinde: en yakın yüzden dışarı it
          var l = x - c.x0, rr = c.x1 - x, b = z - c.z0, f = c.z1 - z;
          var m = Math.min(l, rr, b, f);
          if (m === l) x = c.x0 - r;
          else if (m === rr) x = c.x1 + r;
          else if (m === b) z = c.z0 - r;
          else z = c.z1 + r;
        }
      }
    }
    return [x, z];
  };
  // tekrarlanabilir rastgele sayılar (mulberry32)
  H.rng = function (seed) {
    return function () {
      seed = (seed + 0x6d2b79f5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  var isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  H.isTouch = isTouch;
  document.body.classList.toggle('touch', isTouch);

  // ---------- sahne ----------
  var canvas = (H.canvas = document.getElementById('view'));
  var renderer = (H.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: !isTouch }));
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isTouch ? 2 : 1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  var SKY = 0xa9bcc9;
  var scene = (H.scene = new THREE.Scene());
  scene.background = new THREE.Color(SKY);
  scene.fog = new THREE.Fog(SKY, 420, 1400);

  var camera = (H.camera = new THREE.PerspectiveCamera(58, 1, 0.1, 3000));

  // güneş gölgesi odağı: aktif mod H.focus'u her karede günceller
  H.focus = { x: 0, z: 0 };
  var sun = (H.sun = new THREE.DirectionalLight(0xfff0d6, 0.8));
  var SM = isTouch ? 1024 : 2048;
  sun.castShadow = true;
  sun.shadow.mapSize.set(SM, SM);
  var sc = sun.shadow.camera;
  sc.left = -130; sc.right = 130; sc.top = 130; sc.bottom = -130;
  sc.near = 10; sc.far = 700;
  sc.updateProjectionMatrix();
  sun.shadow.bias = -0.0009;
  scene.add(sun);
  scene.add(sun.target);
  scene.add(new THREE.HemisphereLight(0xe2ecff, 0x5b4f36, 0.6));

  function resize() {
    var w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  // ---------- kutu ve malzeme yardımcıları ----------
  var matCache = {};
  H.mat = function (color) {
    var m = matCache[color];
    if (!m) m = matCache[color] = new THREE.MeshLambertMaterial({ color: color });
    return m;
  };
  H.box = function (parent, w, h, d, mat, x, y, z) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  };

  // ---------- arayüz yardımcıları ----------
  var toastEl = document.getElementById('toast');
  var toastTimer = 0;
  H.toast = function (text, ms) {
    toastEl.textContent = text;
    toastEl.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('on'); }, ms || 2400);
  };
  var promptEl = document.getElementById('prompt');
  var promptNow = '', promptReq = '';
  // ilk çağıran kazanır (önce kayıt olan modül öncelikli); kare sonunda uygulanır
  H.prompt = function (html) { if (html && !promptReq) promptReq = html; };
  function applyPrompt() {
    var html = promptReq;
    promptReq = '';
    if (html === promptNow) return;
    promptNow = html;
    promptEl.innerHTML = html;
    promptEl.style.display = html ? 'block' : 'none';
  }
  H.setText = function (id, text) {
    var el = document.getElementById(id);
    if (el && el.textContent !== text) el.textContent = text;
  };
  H.crosshair = function (on) {
    document.getElementById('cross').style.display = on ? 'block' : 'none';
  };

  // ---------- girdi ----------
  var keys = {};            // klavye: e.code -> basılı mı
  var edge = {};            // bu karede basılanlar (act, fire)
  var mouseHeld = false;
  var stickVec = { x: 0, y: 0 };          // sol dokunmatik çubuk (-1..1, aşağı = +y)
  var btnHeld = { fire: false, run: false };
  var input = (H.input = { fwd: 0, side: 0, lookX: 0, lookY: 0, fire: false, run: false });
  H.pressed = function (name) { return !!edge[name]; };
  H.key = function (code) { return !!keys[code]; };          // basılı tuş (KeyJ, KeyI …)
  H.consume = function (name) { delete edge[name]; };        // tek karelik girdiyi harca

  function clearHeld() {
    for (var k in keys) keys[k] = false;
    mouseHeld = false;
    btnHeld.fire = false;
    btnHeld.run = false;
  }

  window.addEventListener('keydown', function (e) {
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
    if (e.code === 'Space' || e.code.indexOf('Arrow') === 0) e.preventDefault();
    if (!e.repeat) {
      if (e.code === 'KeyE') edge.act = true;
      if (e.code === 'Space') edge.fire = true;
    }
    keys[e.code] = true;
  });
  window.addEventListener('keyup', function (e) { keys[e.code] = false; });
  window.addEventListener('blur', clearHeld);

  // fare: tıkla → imleç kilidi; kilitliyken hareket bakışa çevrilir
  canvas.addEventListener('mousedown', function (e) {
    if (isTouch || e.button !== 0) return;
    mouseHeld = true;
    edge.fire = true;
    if (document.pointerLockElement !== canvas && canvas.requestPointerLock) canvas.requestPointerLock();
  });
  window.addEventListener('mouseup', function (e) { if (e.button === 0) mouseHeld = false; });
  window.addEventListener('mousemove', function (e) {
    if (isTouch || document.pointerLockElement !== canvas) return;
    input.lookX += e.movementX * 0.0024;
    input.lookY += e.movementY * 0.0024;
  });

  // dokunmatik: sol yarı = sanal çubuk (yürü), sağ yarı = sürükleyerek bakış
  var ring = document.getElementById('ring');
  var stickId = null, stickBase = null, lookId = null, lastLook = null;
  var STICK_R = 60;
  window.addEventListener('pointerdown', function (e) {
    if (!isTouch || e.pointerType === 'mouse') return;
    if (e.target && e.target.closest && e.target.closest('.btn')) return;
    if (e.clientX < window.innerWidth * 0.45 && stickId === null) {
      stickId = e.pointerId;
      stickBase = { x: e.clientX, y: e.clientY };
      ring.style.left = e.clientX + 'px';
      ring.style.top = e.clientY + 'px';
      ring.style.display = 'block';
    } else if (lookId === null) {
      lookId = e.pointerId;
      lastLook = { x: e.clientX, y: e.clientY };
    }
  });
  window.addEventListener('pointermove', function (e) {
    if (e.pointerId === stickId) {
      var dx = e.clientX - stickBase.x, dy = e.clientY - stickBase.y;
      var len = Math.sqrt(dx * dx + dy * dy);
      var k = len > STICK_R ? STICK_R / len : 1 / STICK_R;
      stickVec.x = dx * k;
      stickVec.y = dy * k;
    } else if (e.pointerId === lookId) {
      input.lookX += (e.clientX - lastLook.x) * 0.0042;
      input.lookY += (e.clientY - lastLook.y) * 0.0042;
      lastLook = { x: e.clientX, y: e.clientY };
    }
  });
  function endPointer(e) {
    if (e.pointerId === stickId) {
      stickId = null;
      stickVec.x = 0;
      stickVec.y = 0;
      ring.style.display = 'none';
    }
    if (e.pointerId === lookId) lookId = null;
  }
  window.addEventListener('pointerup', endPointer);
  window.addEventListener('pointercancel', endPointer);

  // dokunmatik düğmeler (.btn, data-b = act | fire | run)
  document.querySelectorAll('.btn').forEach(function (b) {
    var kind = b.getAttribute('data-b');
    var pid = null;
    b.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      pid = e.pointerId;
      b.classList.add('on');
      if (kind === 'act') edge.act = true;
      if (kind === 'fire') { btnHeld.fire = true; edge.fire = true; }
      if (kind === 'run') btnHeld.run = true;
    });
    function up(e) {
      if (e.pointerId !== pid) return;
      pid = null;
      b.classList.remove('on');
      if (kind === 'fire') btnHeld.fire = false;
      if (kind === 'run') btnHeld.run = false;
    }
    b.addEventListener('pointerup', up);
    b.addEventListener('pointercancel', up);
  });

  // ---------- döngü ----------
  var listeners = [];
  H.onUpdate = function (fn) { listeners.push(fn); };
  H.time = 0;
  H.dt = 0;
  var last = performance.now();

  function frame(now) {
    var dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    H.dt = dt;
    H.time += dt;

    var f = 0, s = 0;
    if (keys.KeyW || keys.ArrowUp) f += 1;
    if (keys.KeyS || keys.ArrowDown) f -= 1;
    if (keys.KeyD || keys.ArrowRight) s += 1;
    if (keys.KeyA || keys.ArrowLeft) s -= 1;
    input.fwd = H.clamp(f - stickVec.y, -1, 1);
    input.side = H.clamp(s + stickVec.x, -1, 1);
    input.fire = !!(keys.Space || mouseHeld || btnHeld.fire);
    input.run = !!(keys.ShiftLeft || keys.ShiftRight || btnHeld.run);

    for (var i = 0; i < listeners.length; i++) listeners[i](dt);
    applyPrompt();

    // tek karelik girdiler ve bakış farkları bu karede tüketildi
    for (var k in edge) delete edge[k];
    input.lookX = 0;
    input.lookY = 0;

    sun.position.set(H.focus.x - 90, 190, H.focus.z + 70);
    sun.target.position.set(H.focus.x, 0, H.focus.z);
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
