/* HİSAR presentation 1.1.0 — visual/audio comfort only.
 * No weapon logic, reticle calibration, vehicle physics or progress data changes.
 * Legacy integration points were inspected at PR #13, head 162746d1880b94f8829bf3ad9c654b3bd7de9575.
 */
(function (root) {
  'use strict';
  if (root.HisarImmersive && root.HisarImmersive.version === '1.1.0') return;
  const VERSION = '1.1.0', KEY = 'hisar-immersive-v1';
  const doc = root.document;
  const defaults = Object.freeze({ greenThermal: true, motionReduction: false,
    radioVoice: true, droneSmoothing: true, thermalBrightness: 1, thermalContrast: 1 });
  const safe = (fn, fallback) => { try { return fn(); } catch { return fallback; } };
  const numeric = (v, fallback) => safe(() => Number.isFinite(Number(v)) ? Number(v) : fallback, fallback);
  const clamp = (v, lo, hi, fallback) => Math.max(lo, Math.min(hi, numeric(v, fallback)));
  function normalize(v) {
    v = v && typeof v === 'object' ? v : {};
    return { greenThermal: v.greenThermal !== false, motionReduction: v.motionReduction === true,
      radioVoice: v.radioVoice !== false, droneSmoothing: v.droneSmoothing !== false,
      thermalBrightness: clamp(v.thermalBrightness, .7, 1.4, 1), thermalContrast: clamp(v.thermalContrast, .8, 1.4, 1) };
  }
  const read = () => safe(() => JSON.parse(root.localStorage.getItem(KEY) || 'null'), null);
  const stored = read();
  let state = normalize(stored), storageOK = true;
  // Adopt an existing camera comfort preference unless this panel has an explicit saved value.
  if (!stored || typeof stored.motionReduction !== 'boolean') {
    state.motionReduction = !!safe(() => root.HisarPolish.getSettings().reduceShake, false);
  }
  const motion = safe(() => root.matchMedia('(prefers-reduced-motion: reduce)'), null);
  let radioStatus = '', panel, voice, speaking = null, watchdog = null;
  const queue = [], MAX_QUEUE = 4;
  let canvasRecord = null, renderer = null, renderWrapper = null, cameraWrapper = null;
  let cameraState = null, cameraFrames = 0, filteredFrames = 0, frameAttached = false;
  const clock = () => safe(() => root.performance.now(), Date.now());
  const timeout = (fn, ms) => typeof root.setTimeout === 'function' ? root.setTimeout(fn, ms) : null;
  const clearTimer = id => { if (id !== null && typeof root.clearTimeout === 'function') root.clearTimeout(id); };
  function damping(dt, response = 18) {
    return 1 - Math.exp(-clamp(response, 1, 40, 18) * clamp(dt, 0, .25, 0));
  }
  function chooseVoice(voices) {
    if (!Array.isArray(voices)) return null;
    return voices.find(v => v && v.localService === true && /^tr(?:[-_]TR)?$/i.test(v.lang || '') &&
      !/\b(female|woman|kadın|kadin)\b/i.test(v.name || '') &&
      /\b(tolga|male|erkek)\b/i.test(v.name || '')) || null;
  }
  function wantsGreen(s) {
    return !!(s && s.playing === true &&
      ((s.mode === 'tank' && s.view === 1 && s.thermal === true) || (s.mode === 'drone' && s.thermal === true)));
  }
  function sceneState() {
    return safe(() => {
      const m = typeof mode === 'string' ? mode : '';
      return { mode: m, playing: typeof game !== 'undefined' && game === 'play',
        view: typeof iv === 'number' ? iv : -1,
        thermal: m === 'tank' ? (typeof SGT !== 'undefined' && !!SGT && SGT.m === 1) :
          (m === 'drone' && typeof DR !== 'undefined' && !!DR && !!DR.th),
        drone: m === 'drone' && typeof DR !== 'undefined' && !!DR && !!DR.on,
        special: !!root.mapOpen || !!root.PHOTO?.on || !!root.BCAM?.on };
    }, { mode: '', playing: false, view: -1, thermal: false, drone: false, special: true });
  }
  function refreshVoices() {
    voice = chooseVoice(safe(() => root.speechSynthesis.getVoices(), []));
    radioStatus = voice ? 'Yerel Türkçe erkek ses adayı: ' + voice.name :
      'Yerel Türkçe erkek sesi bulunamadı. Başka bir sese geçilmez.';
    refreshPanel();
    return voice;
  }
  function status(text) { radioStatus = text; refreshPanel(); }
  function finish(utterance, error) {
    if (speaking !== utterance) return; // Ignore callbacks arriving after cancellation.
    clearTimer(watchdog); watchdog = null; speaking = null;
    if (error) status('Ses oynatılamadı: ' + String(error).slice(0, 80));
    drain();
  }
  function drain() {
    if (speaking || !queue.length || !state.radioVoice || doc?.hidden) return;
    const text = queue.shift();
    const selected = refreshVoices();
    if (!selected) { queue.length = 0; return; }
    try {
      const utterance = new root.SpeechSynthesisUtterance(text);
      utterance.lang = 'tr-TR'; utterance.voice = selected;
      utterance.rate = 1; utterance.pitch = 1; // Do not fake a male voice by lowering a female voice's pitch.
      utterance.onend = () => finish(utterance);
      utterance.onerror = e => finish(utterance, e?.error || 'speech-error');
      speaking = utterance;
      root.speechSynthesis.speak(utterance);
      if (speaking === utterance) {
        watchdog = timeout(() => { stop(); status('Ses zaman aşımına uğradı; kuyruk temizlendi.'); }, 30000);
      }
    } catch { speaking = null; queue.length = 0; status('Bu tarayıcıda ses başlatılamadı.'); }
  }
  function speak(message) {
    if (root.HisarRadioSound?.neural) return state.radioVoice && !doc?.hidden ? root.HisarRadioSound.speak(message) : false;
    if (!state.radioVoice || doc?.hidden || typeof root.SpeechSynthesisUtterance !== 'function' ||
      typeof root.speechSynthesis?.speak !== 'function') return false;
    const text = typeof message === 'string' ? message.trim().slice(0, 180) : '';
    if (!text || !refreshVoices()) return false;
    if (speaking?.text === text || queue.includes(text) || queue.length >= MAX_QUEUE) return false;
    // Do not interrupt unrelated speech belonging to another application module.
    if (!speaking && (root.speechSynthesis.speaking || root.speechSynthesis.pending)) return false;
    queue.push(text); drain(); return !!speaking || queue.length > 0;
  }
  function stop() {
    if (root.HisarRadioSound?.neural) root.HisarRadioSound.stop();
    queue.length = 0; clearTimer(watchdog); watchdog = null;
    const owned = speaking; speaking = null;
    if (owned) safe(() => root.speechSynthesis.cancel(), undefined);
  }
  function addPresentationStyles() {
    if (!doc || !doc.head || doc.getElementById('hisar-immersive-style')) return;
    const style = doc.createElement('style'); style.id = 'hisar-immersive-style';
    style.textContent = `
#hisar-immersive-settings{position:relative;min-width:0;max-width:100%;margin-top:16px;border:1px solid #385b57;border-radius:12px;background:#101b20;color:#e7f4f0;padding:14px;font:14px/1.5 system-ui;box-sizing:border-box;overflow-wrap:anywhere}
#hisar-immersive-settings h3{font-size:16px;margin:0 0 12px}#hisar-immersive-settings .hi-row{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:10px 0;min-width:0}
#hisar-immersive-settings .hi-row>span{flex:1;min-width:0}#hisar-immersive-settings input[type=checkbox]{width:22px;height:22px;flex:0 0 22px;accent-color:#75d6a1}
#hisar-immersive-settings input[type=range]{width:120px;max-width:40%;min-width:40px;accent-color:#75d6a1}#hisar-immersive-settings output{min-width:3em;text-align:right}
#hisar-immersive-settings button{min-height:44px;background:#213d3a;color:#edf8f2;border:1px solid #446e61;padding:9px 12px;border-radius:8px;white-space:normal}
#hisar-immersive-settings button:focus-visible,#hisar-immersive-settings input:focus-visible{outline:3px solid #a8efd0;outline-offset:3px}
#hisar-immersive-settings p{font-size:12px;color:#b0c9c0;margin:10px 0 0}#hisar-immersive-settings .hi-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
@media(max-width:360px){#hisar-immersive-settings{padding:10px;font-size:13px}#hisar-immersive-settings .hi-row{gap:6px}}
@media(prefers-reduced-motion:reduce){#hisar-immersive-settings *{animation:none!important;transition:none!important}}
`;
    doc.head.appendChild(style);
    if (!doc.body || doc.getElementById('hisar-thermal-svg')) return;
    const ns = 'http://www.w3.org/2000/svg', svg = doc.createElementNS(ns, 'svg');
    svg.id = 'hisar-thermal-svg'; svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false'); svg.setAttribute('width', '0'); svg.setAttribute('height', '0');
    svg.style.cssText = 'position:absolute;pointer-events:none;overflow:hidden';
    const defs = doc.createElementNS(ns, 'defs'), filter = doc.createElementNS(ns, 'filter');
    filter.id = 'hisar-thermal-palette'; filter.setAttribute('color-interpolation-filters', 'sRGB');
    const matrix = doc.createElementNS(ns, 'feColorMatrix'); matrix.setAttribute('type', 'matrix');
    // Display palette only. Existing hot/cold scene passes, polarity and cooldown remain untouched.
    matrix.setAttribute('values', '.017008 .057216 .005776 0 0 .2126 .7152 .0722 0 0 .038268 .128736 .012996 0 0 0 0 0 1 0');
    filter.appendChild(matrix); defs.appendChild(filter); svg.appendChild(defs); doc.body.appendChild(svg);
  }
  function clearCanvas() {
    if (!canvasRecord) return;
    const { canvas, applied, base } = canvasRecord;
    if (canvas.style.filter === applied) canvas.style.filter = base;
    canvasRecord = null;
  }
  function syncCanvas() {
    const canvas = safe(() => typeof R !== 'undefined' && R ? R.domElement : null, null);
    if (!canvas?.style || !doc || doc.hidden || !state.greenThermal || !wantsGreen(sceneState()) ||
      !doc.getElementById('hisar-thermal-palette')) { clearCanvas(); return; }
    if (canvasRecord && canvasRecord.canvas !== canvas) clearCanvas();
    const current = canvas.style.filter;
    let base = canvasRecord && current === canvasRecord.applied ? canvasRecord.base : current;
    if (base === 'none') base = '';
    const appended = 'url("#hisar-thermal-palette") brightness(' + state.thermalBrightness + ') contrast(' + state.thermalContrast + ')';
    const applied = (base ? base + ' ' : '') + appended;
    if (canvas.style.filter !== applied) canvas.style.filter = applied;
    canvasRecord = { canvas, base, applied }; filteredFrames++;
  }
  function resetCamera() { cameraState = null; }
  function syncCamera() {
    const s = sceneState(), camera = safe(() => typeof CAM !== 'undefined' ? CAM : null, null);
    const p = camera?.position;
    if (!p || !s.playing || !s.drone || s.special || !state.droneSmoothing || state.motionReduction ||
      motion?.matches || doc?.hidden || ![p.x,p.y,p.z].every(Number.isFinite)) { resetCamera(); return; }
    const now = clock(), prev = cameraState;
    const dt = prev ? (now - prev.time) / 1000 : 0;
    const distance2 = prev ? (p.x-prev.x)**2 + (p.y-prev.y)**2 + (p.z-prev.z)**2 : 0;
    if (prev && prev.camera === camera && dt > 0 && dt < .25 && distance2 < 2500) {
      const a = damping(dt);
      p.x = prev.x + (p.x-prev.x)*a; p.y = prev.y + (p.y-prev.y)*a; p.z = prev.z + (p.z-prev.z)*a;
      cameraFrames++;
    }
    // Rotation and field of view are deliberately not delayed; existing screen alignment stays intact.
    cameraState = { x:p.x, y:p.y, z:p.z, time:now, camera };
  }
  function connect() {
    const current = safe(() => typeof R !== 'undefined' ? R : null, null);
    if (!renderer && typeof current?.render === 'function') {
      renderer = current; const original = current.render;
      renderWrapper = function(scene, camera) { syncCanvas(); return original.apply(this, arguments); };
      current.render = renderWrapper;
    }
    if (!cameraWrapper && typeof root.camUpdate === 'function') {
      const original = root.camUpdate;
      cameraWrapper = function() { const result = original.apply(this, arguments); syncCamera(); return result; };
      root.camUpdate = cameraWrapper;
    }
    if (!frameAttached && root.HisarGameBridge?.onFrame) {
      frameAttached = root.HisarGameBridge.onFrame(() => {
        if (!sceneState().playing) { clearCanvas(); resetCamera(); }
      }) === true;
    }
    return !!renderer;
  }
  function applyMotion() {
    const polish = root.HisarPolish;
    if (polish?.set && polish?.getSettings) {
      safe(() => { if (polish.getSettings().reduceShake !== state.motionReduction) polish.set('reduceShake', state.motionReduction); }, undefined);
    }
  }
  function refreshPanel() {
    if (!panel) return;
    for (const input of panel.querySelectorAll('[data-immersive]')) {
      const key = input.dataset.immersive;
      if (input.type === 'checkbox') input.checked = state[key]; else input.value = state[key];
      const output = panel.querySelector('[data-output="' + key + '"]');
      if (output) output.textContent = Math.round(state[key]*100) + '%';
    }
    const text = panel.querySelector('#hi-radio-status');
    if (text) text.textContent = radioStatus + (storageOK ? '' : ' Ayarlar yalnızca bu oturumda saklanıyor.');
  }
  function apply() {
    if (!doc) return;
    doc.documentElement.dataset.hisarGreenThermal = String(state.greenThermal);
    doc.documentElement.dataset.hisarReduceMotion = String(state.motionReduction);
    doc.documentElement.dataset.hisarRadioVoice = String(state.radioVoice);
    applyMotion(); syncCanvas(); refreshPanel();
    if (typeof root.Event === 'function') doc.dispatchEvent(new root.Event('hisar:immersive-settings'));
  }
  function save(values) {
    state = normalize({ ...state, ...(values && typeof values === 'object' ? values : {}) });
    try { root.localStorage.setItem(KEY, JSON.stringify(state)); storageOK = true; } catch { storageOK = false; }
    if (!state.radioVoice) stop(); resetCamera(); apply(); return { ...state };
  }
  function installPanel() {
    if (!doc?.body) return false;
    addPresentationStyles(); connect();
    const parent = doc.getElementById('hx-settings');
    if (!parent) return false; // Never place an overlay over mobile game controls.
    if (doc.getElementById('hisar-immersive-settings')) return true;
    panel = doc.createElement('section'); panel.id = 'hisar-immersive-settings';
    panel.setAttribute('aria-labelledby', 'hi-title');
    const title = doc.createElement('h3'); title.id = 'hi-title'; title.textContent = 'Görüntü ve telsiz · 1.1'; panel.appendChild(title);
    for (const [key, label] of [['greenThermal','Yeşil termal palet'],['droneSmoothing','Yumuşak drone kamerası'],
      ['motionReduction','Kamera sarsıntısını azalt'],['radioVoice','Yerel erkek telsiz sesi']]) {
      const row = doc.createElement('label'); row.className = 'hi-row';
      const text = doc.createElement('span'); text.textContent = label;
      const input = doc.createElement('input'); input.type = 'checkbox'; input.dataset.immersive = key;
      input.addEventListener('change', () => save({ [key]: input.checked })); row.append(text,input); panel.appendChild(row);
    }
    for (const [key,label,min,max] of [['thermalBrightness','Termal parlaklık',.7,1.4],['thermalContrast','Termal kontrast',.8,1.4]]) {
      const row = doc.createElement('label'); row.className = 'hi-row';
      const text = doc.createElement('span'); text.textContent = label;
      const input = doc.createElement('input'); input.type = 'range'; input.min = min; input.max = max; input.step = '.05';
      input.dataset.immersive = key; input.setAttribute('aria-label',label);
      input.addEventListener('input', () => save({ [key]:input.value }));
      const output = doc.createElement('output'); output.dataset.output = key; row.append(text,input,output); panel.appendChild(row);
    }
    const actions = doc.createElement('div'); actions.className = 'hi-actions';
    const test = doc.createElement('button'); test.type = 'button'; test.id = 'hi-radio-test'; test.textContent = 'Telsiz sesini dene';
    test.addEventListener('click', () => { if (!speak('HİSAR, ses kontrolü. Bağlantı tamam.')) refreshPanel(); });
    const reset = doc.createElement('button'); reset.type = 'button'; reset.textContent = 'Bu tercihleri sıfırla';
    reset.addEventListener('click', () => save(defaults)); actions.append(test,reset); panel.appendChild(actions);
    const description = doc.createElement('p'); description.textContent = 'Yeşil palet yalnızca mevcut termal görüntüyü renklendirir. Drone yumuşatma kamera konumuna uygulanır; uçuş fiziği, görüş yönü ve oyun kayıtları değişmez.';
    const notice = doc.createElement('p'); notice.id = 'hi-radio-status'; notice.setAttribute('role','status'); notice.setAttribute('aria-live','polite');
    panel.append(description,notice); parent.appendChild(panel); refreshPanel(); return true;
  }
  function diagnostics() {
    return { version:VERSION, preferences:{...state}, storageOK, thermalActive:!!canvasRecord,
      rendererConnected:!!renderer && renderer.render === renderWrapper,
      cameraConnected:!!cameraWrapper && root.camUpdate === cameraWrapper,
      filteredFrames, cameraSmoothedFrames:cameraFrames, radioQueued:queue.length,
      radioSpeaking:!!speaking, voiceName:voice?.name || null, radioStatus };
  }
  const api = Object.freeze({ version:VERSION, defaults, normalize, load:()=>normalize(read()), save, speak, stop,
    chooseVoice, wantsGreen, damping, connect, installPanel, addPresentationStyles, diagnostics, getSettings:()=>({...state}) });
  root.HisarImmersive = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
  refreshVoices();
  if (root.speechSynthesis?.addEventListener) root.speechSynthesis.addEventListener('voiceschanged',refreshVoices);
  if (doc) {
    const boot = () => { installPanel(); apply(); };
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
    doc.addEventListener('hisar:ui-ready',boot);
    // Explicit presentation-only radio event; no arbitrary DOM harvesting or network text upload.
    doc.addEventListener('hisar:radio', e => speak(typeof e.detail === 'string' ? e.detail : e.detail?.text));
    doc.addEventListener('visibilitychange', () => { if (doc.hidden) { stop(); clearCanvas(); resetCamera(); } });
    root.addEventListener?.('blur', () => { stop(); clearCanvas(); resetCamera(); });
    root.addEventListener?.('pagehide', () => { stop(); clearCanvas(); resetCamera(); });
    root.addEventListener?.('storage', e => {
      if (e.key !== KEY) return; state = normalize(read()); if (!state.radioVoice) stop(); resetCamera(); apply();
    });
    motion?.addEventListener?.('change',resetCamera);
  }
})(typeof window !== 'undefined' ? window : globalThis);
