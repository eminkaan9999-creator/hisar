export function createSound() {
  const Audio = globalThis.AudioContext || globalThis.webkitAudioContext;
  let context, engine, engineGain, rainGain;
  let enabled = false;
  try { enabled = localStorage.getItem('hisar-oyun-ses') === 'true'; } catch {}

  function activate() {
    if (!enabled || !Audio) return;
    if (!context) {
      context = new Audio();
      engine = context.createOscillator();
      engine.type = 'sawtooth';
      engine.frequency.value = 38;
      const filter = context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 170;
      engineGain = context.createGain();
      engineGain.gain.value = 0;
      engine.connect(filter).connect(engineGain).connect(context.destination);
      engine.start();

      const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const rain = context.createBufferSource();
      rain.buffer = buffer;
      rain.loop = true;
      const rainFilter = context.createBiquadFilter();
      rainFilter.type = 'lowpass';
      rainFilter.frequency.value = 1300;
      rainGain = context.createGain();
      rainGain.gain.value = 0;
      rain.connect(rainFilter).connect(rainGain).connect(context.destination);
      rain.start();
    }
    if (context.state === 'suspended') context.resume().catch(() => {});
  }
  function silence() {
    if (!context) return;
    engineGain.gain.setTargetAtTime(0, context.currentTime, .06);
    rainGain.gain.setTargetAtTime(0, context.currentTime, .06);
  }
  return {
    get enabled() { return enabled; },
    get supported() { return !!Audio; },
    activate,
    toggle() {
      enabled = !enabled;
      try { localStorage.setItem('hisar-oyun-ses', String(enabled)); } catch {}
      if (enabled) activate();
      else {
        silence();
        context?.suspend().catch(() => {});
      }
      return enabled;
    },
    engine(speed, rain) {
      if (!enabled || !context || context.state !== 'running') return;
      engine.frequency.setTargetAtTime(38 + Math.abs(speed) * 4, context.currentTime, .12);
      engineGain.gain.setTargetAtTime(.015 + Math.min(Math.abs(speed) / 500, .025), context.currentTime, .12);
      rainGain.gain.setTargetAtTime(rain * .028, context.currentTime, .15);
    },
    cue() {
      if (!enabled || !context || context.state !== 'running') return;
      const tone = context.createOscillator(), gain = context.createGain();
      tone.type = 'sine';
      tone.frequency.setValueAtTime(660, context.currentTime);
      tone.frequency.setValueAtTime(880, context.currentTime + .08);
      gain.gain.setValueAtTime(.035, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + .22);
      tone.connect(gain).connect(context.destination);
      tone.start();
      tone.stop(context.currentTime + .23);
      tone.onended = () => { tone.disconnect(); gain.disconnect(); };
    },
    silence,
    suspend() {
      silence();
      context?.suspend().catch(() => {});
    }
  };
}
