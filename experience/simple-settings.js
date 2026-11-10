/* HİSAR simple settings: automatic graphics, three player preferences.
 * No game progress, weapon rules, mission records or personal data are modified. */
(function (root) {
  'use strict';
  const VERSION = '1.0.0', KEY = 'hisar-simple-settings-v1';
  const levels = ['dusuk', 'orta', 'yuksek'];
  const safe = (fn, fallback) => { try { return fn(); } catch { return fallback; } };
  function normalize(v) {
    v = v && typeof v === 'object' ? v : {};
    return { sound: v.sound !== false,
      control: ['hassas','dengeli','seri'].includes(v.control) ? v.control : 'dengeli',
      difficulty: ['kolay','normal','zor','serbest'].includes(v.difficulty) ? v.difficulty : 'kolay' };
  }
  // fps is the existing engine's WALL-CLOCK measurement, not its capped physics delta.
  // Hysteresis, start/resume grace and a long upgrade window prevent quality oscillation.
  function governor(maxLevel = 2) {
    maxLevel = Math.max(0, Math.min(2, Number.isInteger(maxLevel) ? maxLevel : 1));
    let low = 0, high = 0, until = 0, activeBefore = false, last = -Infinity, upAfter = 0;
    function reset(at = 0) { low = high = 0; until = at + 8000; upAfter = at + 30000; activeBefore = false; last = -Infinity; }
    function sample(fps, at, active, current) {
      if (!Number.isFinite(at) || at < 0 || at <= last) return null;
      last = at;
      if (!active) { low = high = 0; activeBefore = false; until = at + 8000; return null; }
      if (!activeBefore) { activeBefore = true; low = high = 0; until = Math.max(until, at + 8000); return null; }
      if (!Number.isFinite(fps) || fps <= 0 || fps > 300 || at < until) return null;
      const i = levels.indexOf(current?.quality);
      if (i < 0) return null;
      const scale = Number.isFinite(current.scale) ? Math.min(1, Math.max(.6, current.scale)) : 1;
      low = fps < 28 ? low + 1 : 0;
      high = fps > 56 ? high + 1 : 0;
      let change = null;
      if (low >= 2) {
        if (i > 0) change = { quality: levels[i - 1], scale };
        else if (scale > .6) change = { quality: 'dusuk', scale: Math.max(.6, Math.round((scale - .1) * 100) / 100) };
        low = high = 0; until = at + 12000; upAfter = at + 90000;
      } else if (high >= 12 && at >= upAfter) {
        if (scale < 1) change = { quality: levels[i], scale: Math.min(1, Math.round((scale + .1) * 100) / 100) };
        else if (i < maxLevel) change = { quality: levels[i + 1], scale: 1 };
        low = high = 0; until = at + 24000;
      }
      return change;
    }
    return { reset, sample };
  }
  const pure = { VERSION, normalize, governor };
  if (typeof module === 'object' && module.exports) module.exports = pure;
  const doc = root.document;
  if (!doc || root.HisarSimpleSettings) return;
  const B = root.HisarGameBridge;
  const clock = () => root.performance?.now?.() ?? Date.now();
  let settings = normalize(safe(() => JSON.parse(root.localStorage.getItem(KEY) || 'null'), null));
  let storageOK = true, changes = 0, initialized = false;
  const auto = governor(safe(() => root.matchMedia('(pointer:coarse)').matches, true) ? 1 : 2);
  auto.reset(clock());
  function graphics() {
    safe(() => root.HisarExperience?.useAutomatic?.(), null);
    safe(() => B?.auto(true), null);
    const p = root.HisarPolish;
    for (const [key, value] of Object.entries({ smoothCamera:true, reduceShake:true, filmic:false,
      exposure:1, textureDetail:true, muteBackground:true, idleRendering:true })) {
      if (p?.getSettings?.()[key] !== value) safe(() => p.set(key, value), null);
    }
    const im = root.HisarImmersive;
    const desired = { greenThermal:true, droneSmoothing:true, motionReduction:true, thermalBrightness:1, thermalContrast:1 };
    if (im?.getSettings && Object.keys(desired).some(k => im.getSettings()[k] !== desired[k])) safe(() => im.save(desired), null);
  }
  function sound() {
    safe(() => root.setS(settings.sound ? 1 : 0), null);
    safe(() => { SV.voice = settings.sound ? 1 : 0; SV.radioV = settings.sound ? 1 : 0; }, null);
    if (!settings.sound) { safe(() => root.HisarImmersive?.stop(), null); safe(() => root.HisarRadioSound?.stop(), null); }
  }
  function apply() {
    sound();
    safe(() => root.HisarControls?.setProfile(settings.control), null);
    safe(() => root.setL(settings.difficulty), null);
    const panel = doc.getElementById('hs-simple');
    if (panel) for (const input of panel.querySelectorAll('[data-simple]')) {
      const key = input.dataset.simple;
      if (input.type === 'checkbox') input.checked = settings[key]; else input.value = settings[key];
    }
  }
  function save(next) {
    settings = normalize({ ...settings, ...(next && typeof next === 'object' ? next : {}) });
    try { root.localStorage.setItem(KEY, JSON.stringify(settings)); storageOK = true; } catch { storageOK = false; }
    apply();
    const msg = doc.getElementById('hs-note');
    if (msg) msg.textContent = storageOK ? 'Zorluk seçimin bir sonraki görevde uygulanır.' : 'Tercihler bu oturumda geçerli. Oyun kayıtların korunuyor.';
    return { ...settings };
  }
  function install() {
    const parent = doc.getElementById('hx-settings');
    if (!parent) return false;
    if (!doc.getElementById('hs-style')) {
      const style = doc.createElement('style'); style.id = 'hs-style';
      style.textContent = `
      body.hisar-simple #hx-settings > :not(#hs-simple){display:none!important}
      body.hisar-simple #ta > :not(#hs-settings-link){display:none!important}
      body.hisar-simple #hisar-fps{display:none!important}
      #hs-simple{padding:4px 0;max-width:100%;color:#eaf5f1}
      #hs-simple .hs-auto{margin:0 0 18px;padding:13px 14px;border:1px solid #41635b;border-radius:12px;background:#172d29;line-height:1.5}
      #hs-simple .hs-auto strong{display:block;font-size:16px}
      #hs-simple .hs-auto span{font-size:13px;color:#c2d5d0}
      #hs-simple label{display:flex;align-items:center;justify-content:space-between;gap:14px;min-height:64px;border-bottom:1px solid #32494a;padding:8px 0}
      #hs-simple select{width:142px;max-width:52%;min-height:44px;background:#12272b;color:#fff;border:1px solid #66877f;border-radius:9px;padding:8px;font:inherit}
      #hs-simple input[type=checkbox]{width:24px;height:24px;accent-color:#8cdac2}
      #hs-note{font-size:12px;color:#b8ceca;line-height:1.5;margin-top:18px}
      #hs-simple :is(select,input):focus-visible{outline:3px solid #a5f4d7;outline-offset:4px}
      #hs-settings-link{padding:18px;line-height:1.6}#hs-settings-link button{display:block;min-height:44px;margin-top:14px}
      @media(max-width:360px){#hs-simple label{font-size:14px;gap:8px}#hs-simple select{width:122px}#hs-simple .hs-auto{padding:10px}}
      `;
      doc.head.appendChild(style);
    }
    doc.body.classList.add('hisar-simple');
    if (!doc.getElementById('hs-simple')) {
      const panel = doc.createElement('section'); panel.id = 'hs-simple'; panel.setAttribute('aria-label','Basit oyun ayarları');
      panel.innerHTML = '<p class="hs-auto"><strong>Grafikler otomatik</strong><span>Oyun, görüntüyü ve akıcılığı cihazına göre ayarlar.</span></p>' +
        '<label><span>Ses</span><input type="checkbox" data-simple="sound" aria-label="Oyun sesi"></label>' +
        '<label><span>Kumanda hassasiyeti</span><select data-simple="control" aria-label="Kumanda hassasiyeti"><option value="hassas">Yumuşak</option><option value="dengeli">Normal</option><option value="seri">Hızlı</option></select></label>' +
        '<label><span>Zorluk</span><select data-simple="difficulty" aria-label="Zorluk"><option value="kolay">Kolay</option><option value="normal">Normal</option><option value="zor">Zor</option><option value="serbest">Serbest sürüş</option></select></label>' +
        '<p id="hs-note">Zorluk seçimin bir sonraki görevde uygulanır.</p>';
      for (const input of panel.querySelectorAll('[data-simple]')) input.addEventListener('change', () => save({ [input.dataset.simple]: input.type === 'checkbox' ? input.checked : input.value }));
      parent.prepend(panel);
    }
    const entry = doc.getElementById('hisar-experience-entry'); if (entry) entry.textContent = 'AYARLAR';
    const title = doc.getElementById('hx-title'); if (title) title.textContent = 'Oyun Ayarları';
    const subtitle = doc.querySelector('#hisar-experience .hx-head .hx-muted'); if (subtitle) subtitle.textContent = 'Az ayar, doğrudan oyun. Açıkken oyun duraklatılır.';
    const old = doc.getElementById('ta');
    if (old && !doc.getElementById('hs-settings-link')) {
      const link = doc.createElement('div'); link.id = 'hs-settings-link';
      link.textContent = 'Grafikler cihazına göre otomatik ayarlanır.';
      const button = doc.createElement('button'); button.type = 'button'; button.textContent = 'Ses, kumanda ve zorluk';
      button.addEventListener('click', () => root.HisarExperience?.open('settings')); link.appendChild(button); old.prepend(link);
    }
    graphics(); apply();
    return true;
  }
  function setupAutomatic() {
    if (initialized || !B?.snapshot?.().ready || typeof root.perfAdapt !== 'function') return false;
    initialized = true;
    if (B.snapshot().quality === 'yuksek' || !levels.includes(B.snapshot().quality)) safe(() => B.quality('orta'), null);
    safe(() => B.auto(true), null);
    root.perfAdapt = function (fps) {
      safe(() => B.auto(true), null);
      const eligible = !doc.hidden && safe(() => game === 'play' && !root.mapOpen && !root.PHOTO?.on && !root.BCAM?.on && !(typeof kc !== 'undefined' && kc.t > 0), false);
      const change = auto.sample(fps, clock(), eligible, { quality: B.snapshot().quality, scale: safe(() => PRS, 1) });
      if (change) safe(() => { PRS = change.scale; lowN = 0; root.setQ(change.quality); changes++; }, null);
    };
    if (typeof root.reset === 'function') {
      const previous = root.reset;
      root.reset = function () { auto.reset(clock()); return previous.apply(this, arguments); };
    }
    return true;
  }
  function resetSampling() { auto.reset(clock()); safe(() => { fpsA = 0; fpsN = 0; lowN = 0; }, null); }
  root.HisarSimpleSettings = Object.freeze({ version:VERSION, save, install, getSettings:()=>({...settings}),
    diagnostics:()=>({ version:VERSION, automatic:!!B?.snapshot?.().auto, quality:B?.snapshot?.().quality, adjustments:changes, ready:initialized, storageOK, preferences:{...settings} }) });
  const boot = () => { setupAutomatic(); install(); };
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot, { once:true }); else boot();
  doc.addEventListener('hisar:ui-ready', boot);
  doc.addEventListener('visibilitychange', resetSampling);
  root.addEventListener?.('blur', resetSampling);
  root.addEventListener?.('storage', e => { if (e.key === KEY) { settings = normalize(safe(() => JSON.parse(e.newValue), null)); apply(); } if (e.key === 'hisar-experience-v1') graphics(); });
})(typeof window !== 'undefined' ? window : globalThis);
