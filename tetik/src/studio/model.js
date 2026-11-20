// Tetik prototype domain. The only source of samples is the deterministic demo.
const TetikDomain = (() => {
  const version = 1;
  const prefix = "hisar-tetik.demo.v1.";
  const sampleLimit = 900;
  const round = (n) => Math.round(n * 10) / 10;
  function valueAt(i) {
    return round(
      49 +
        12 * Math.sin(i * 0.31) +
        7 * Math.sin(i * 0.83 + 0.5) +
        3 * Math.cos(i * 2.21) +
        4 * Math.sin(i * 0.1),
    );
  }
  function syntheticAdapter() {
    let listener = null;
    let timer = null;
    const close = () => {
      clearInterval(timer);
      timer = null;
    };
    return {
      inspect: () => ({
        kind: "synthetic",
        verification: "demo",
        canStream: true,
      }),
      subscribe(fn) {
        listener = fn;
        return () => {
          listener = null;
        };
      },
      open(startIndex) {
        close();
        let index = startIndex;
        const emit = () => {
          const seq = index++;
          if (listener)
            listener({ seq, raw: valueAt(seq), origin: "synthetic" });
        };
        timer = setInterval(emit, 1000);
        emit();
        return { ok: true, kind: "synthetic" };
      },
      close,
    };
  }
  function physicalContract(kind) {
    return Object.freeze({
      inspect: () => ({ kind, verification: "unverified", canStream: false }),
      open: () => ({ ok: false, code: "UNVERIFIED_TRANSPORT", kind }),
      subscribe: () => () => {},
      close: () => {},
    });
  }
  const preview = Array.from({ length: 60 }, (_, seq) => ({
    seq,
    raw: valueAt(seq),
    origin: "synthetic",
  }));
  function newSession(offset) {
    return {
      version,
      id:
        Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10),
      origin: "synthetic",
      start: Date.now(),
      end: null,
      offset,
      samples: [],
      faults: 0,
    };
  }
  function validSession(s) {
    return !!(
      s &&
      s.version === version &&
      s.origin === "synthetic" &&
      typeof s.id === "string" &&
      /^[a-z0-9-]{3,64}$/.test(s.id) &&
      Number.isFinite(s.start) &&
      (s.end === null || Number.isFinite(s.end)) &&
      Number.isFinite(s.offset) &&
      Math.abs(s.offset) <= 10 &&
      Number.isInteger(s.faults) &&
      s.faults >= 0 &&
      Array.isArray(s.samples) &&
      s.samples.length <= sampleLimit &&
      s.samples.every(
        (x, i) =>
          x &&
          x.seq === i &&
          x.origin === "synthetic" &&
          Number.isFinite(x.raw) &&
          Math.abs(x.raw) <= 100,
      )
    );
  }
  function createStore(getStorage) {
    function probe() {
      const key = prefix + "probe." + Math.random().toString(36).slice(2);
      try {
        const storage = getStorage();
        storage.setItem(key, "1");
        const ok = storage.getItem(key) === "1";
        storage.removeItem(key);
        return ok;
      } catch {
        return false;
      }
    }
    function get(key) {
      try {
        return JSON.parse(getStorage().getItem(prefix + key));
      } catch {
        return null;
      }
    }
    function put(key, value) {
      try {
        getStorage().setItem(prefix + key, JSON.stringify(value));
        return true;
      } catch {
        return false;
      }
    }
    function remove(key) {
      try {
        getStorage().removeItem(prefix + key);
      } catch {}
    }
    function list() {
      const rows = [];
      let skipped = 0;
      try {
        const storage = getStorage();
        for (let i = 0; i < storage.length; i++) {
          const k = storage.key(i);
          if (!k || !k.startsWith(prefix + "session.")) continue;
          const s = get(k.slice(prefix.length));
          if (
            validSession(s) &&
            s.end !== null &&
            k === prefix + "session." + s.id
          )
            rows.push(s);
          else skipped++;
        }
      } catch {
        return { rows, skipped, unavailable: true };
      }
      return {
        rows: rows.sort((a, b) => b.start - a.start),
        skipped,
        unavailable: false,
      };
    }
    return { probe, get, put, remove, list };
  }
  return {
    version,
    sampleLimit,
    preview,
    round,
    valueAt,
    newSession,
    validSession,
    createStore,
    syntheticAdapter,
    physicalContract,
  };
})();
