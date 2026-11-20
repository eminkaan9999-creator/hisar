(() => {
  "use strict";
  const D = TetikDomain,
    UI = StudioWidgets;
  const db = D.createStore(() => localStorage),
    tab = D.createStore(() => sessionStorage);
  const io = {
    synthetic: D.syntheticAdapter(),
    usb: D.physicalContract("usb"),
    bluetooth: D.physicalContract("bluetooth"),
  };
  const names = { synthetic: "Simülatör", usb: "USB", bluetooth: "Bluetooth" };
  const pages = {
    panel: ["Ölçüm paneli", "activity"],
    history: ["Oturum geçmişi", "clock"],
    connect: ["Bağlantı yönetimi", "link"],
    device: ["Cihaz durumu", "device"],
    cal: ["Kalibrasyon", "sliders"],
    errors: ["Hata bildirimleri", "alert"],
    offline: ["Çevrimdışı kullanım", "archive"],
  };
  const desc = {
    panel: "Sentetik sinyali izleyin ve ölçüm oturumlarınızı kaydedin.",
    history: "Bu tarayıcıda kaydettiğiniz sentetik oturumları inceleyin.",
    connect: "Veri kaynağını ve her bağlantının sunduğu işlemleri inceleyin.",
    device: "Fiziksel cihaz bilgilerini ve simülatörün durumunu görüntüleyin.",
    cal: "Yeni demo oturumları için gösterim ofsetini ayarlayın.",
    errors:
      "Demo akışını kesip kurtarmayı deneyin, olay kayıtlarını inceleyin.",
    offline: "Bu tarayıcının yerel kayıt alanını ve ağ durumunu kontrol edin.",
  };
  const custom = {
    device: "M7 3h10v18H7z M9.5 6h5v7h-5z M11 17h2",
    link: "M9 14l6-6 M8 17l-1 1a4 4 0 01-6-6l5-5a4 4 0 016 0 M16 7l1-1a4 4 0 016 6l-5 5a4 4 0 01-6 0",
    sliders: "M3 7h5m4 0h9M3 17h9m4 0h5M8 4h4v6H8zM12 14h4v6h-4z",
    bluetooth: "M7 7l10 10-5 4V3l5 4L7 17",
    usb: "M12 21V4m-3 3 3-4 3 4m-3 9 6-4V9m-6 10-6-5v-3",
    play: "M7 4l13 8-13 8z",
    pause: "M8 4v16m8-16v16",
    save: "M4 4h13l3 3v13H4zM8 4v6h8V4M8 20v-6h8v6",
    wave: "M2 12h2c2 0 2-7 4-7s2 14 4 14 2-14 4-14 2 7 4 7h2",
  };
  const $ = (s) => document.querySelector(s);
  function el(tag, cls, ...kids) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    for (const k of kids.flat()) if (k !== null && k !== undefined) n.append(k);
    return n;
  }
  function sv(tag, attrs) {
    const n = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
    return n;
  }
  function icon(key) {
    if (!custom[key]) return UI.icon(key);
    const n = sv("svg", {
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": 1.7,
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "aria-hidden": true,
    });
    n.append(sv("path", { d: custom[key] }));
    return n;
  }
  function btn(label, action, kind = "", ico) {
    const b = el(
      "button",
      kind === "linkbtn" ? "linkbtn" : "btn " + kind,
      ico ? icon(ico) : null,
      label,
    );
    b.type = "button";
    b.onclick = action;
    return b;
  }
  function badge(t, tone = "neutral") {
    return UI.badge(t, { tone });
  }
  function card(title, ...body) {
    return el(
      "section",
      "panel",
      el("div", "cardtitle", el("h2", "", title)),
      ...body,
    );
  }
  function details(rows) {
    const box = el("dl");
    for (const [k, v] of rows)
      box.append(el("div", "detailrow", el("dt", "", k), el("dd", "", v)));
    return box;
  }
  function tell(msg) {
    $("#live").textContent = msg;
  }
  function hint(title, text, tone = "info") {
    return UI.alert({ title, text, tone });
  }
  const nt = new Intl.NumberFormat("tr-TR", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }),
    num = (n) => nt.format(n);
  const dt = (n) =>
    new Intl.DateTimeFormat("tr-TR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Istanbul",
    }).format(n);
  const clock = (n) =>
    new Intl.DateTimeFormat("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "Europe/Istanbul",
    }).format(n);
  const activeHint = {
    idle: "Örnek görünüm",
    running: "Kayıt sürüyor",
    paused: "Duraklatıldı",
    fault: "Demo kesintisi",
  };
  let page = "panel",
    mode = "idle",
    session = null,
    choice = "synthetic",
    historyId = null,
    theme =
      db.get("theme") ||
      (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  let offset = db.get("offset");
  if (!Number.isFinite(offset) || Math.abs(offset) > 10) offset = 0;
  let writable = db.probe(),
    checked = null,
    draftOK = true,
    note = "",
    checkResult = "",
    linkResult = "";
  let events = tab.get("events");
  if (!Array.isArray(events)) events = [];
  events = events
    .filter((e) => e && Number.isFinite(e.at) && typeof e.msg === "string")
    .slice(0, 30);
  function log(msg) {
    events.unshift({ at: Date.now(), msg });
    events = events.slice(0, 30);
    tab.put("events", events);
  }
  function checkpoint() {
    if (session) draftOK = tab.put("draft", session);
  }
  const recovered = tab.get("draft");
  if (
    D.validSession(recovered) &&
    recovered.end === null &&
    !db.get("session." + recovered.id)
  ) {
    session = recovered;
    mode = "paused";
    note =
      "Bu sekmedeki taslak kurtarıldı. Devam edebilir veya kaydedebilirsiniz.";
  } else tab.remove("draft");
  function activeRows() {
    return session ? session.samples : D.preview;
  }
  function activeOffset() {
    return session ? session.offset : offset;
  }
  function start() {
    if (session) return;
    note = "";
    session = D.newSession(offset);
    mode = "running";
    log("Sentetik oturum başlatıldı.");
    io.synthetic.open(0);
    render();
    tell("Sentetik oturum başladı.");
  }
  function suspend(reason) {
    if (mode !== "running") return;
    io.synthetic.close();
    mode = reason === "fault" ? "fault" : "paused";
    if (mode === "fault") session.faults++;
    checkpoint();
    log(
      mode === "fault"
        ? "Sentetik akışta kesinti oluşturuldu."
        : "Oturum duraklatıldı.",
    );
  }
  function resume() {
    if (!session || !["paused", "fault"].includes(mode)) return;
    if (session.samples.length >= D.sampleLimit) {
      note = "Oturum örnek sınırına ulaştı. Kaydedebilirsiniz.";
      render();
      return;
    }
    const wasFault = mode === "fault";
    mode = "running";
    note = "";
    log(wasFault ? "Demo kesintisi giderildi." : "Oturum sürdürüldü.");
    io.synthetic.open(session.samples.length);
    render();
    tell("Sentetik akış sürüyor.");
  }
  io.synthetic.subscribe((sample) => {
    if (!session || mode !== "running" || sample.seq !== session.samples.length)
      return;
    session.samples.push(sample);
    checkpoint();
    if (session.samples.length >= D.sampleLimit) {
      suspend("pause");
      note = "900 örnek tamamlandı. Oturumu kaydedebilirsiniz.";
      render();
      return;
    }
    if (page === "panel") drawLive();
  });
  function finish() {
    if (!session) return;
    io.synthetic.close();
    mode = "paused";
    const completed = { ...session, end: Date.now() };
    if (!db.put("session." + session.id, completed)) {
      writable = false;
      checkpoint();
      note =
        "Kayıt alanına yazılamadı. Oturum bu sekmede açık. Alanı denetleyip kaydetmeyi yeniden deneyin.";
      log("Yerel kayıt başarısız.");
      render();
      return;
    }
    writable = true;
    tab.remove("draft");
    session = null;
    mode = "idle";
    note = "Sentetik oturum geçmişe kaydedildi.";
    log("Oturum yerel geçmişe kaydedildi.");
    render();
    tell(note);
  }
  function controls() {
    const c = el("div", "actions");
    if (mode === "idle") {
      c.append(btn("Oturum başlat", start, "primary", "play"));
      return c;
    }
    if (mode === "running")
      c.append(
        btn(
          "Duraklat",
          () => {
            suspend("pause");
            render();
            tell("Oturum duraklatıldı.");
          },
          "",
          "pause",
        ),
      );
    else if (session.samples.length < D.sampleLimit)
      c.append(
        btn(mode === "fault" ? "Akışı kurtar" : "Devam et", resume, "", "play"),
      );
    c.append(btn("Oturumu kaydet", finish, "primary", "save"));
    return c;
  }
  function nav(to) {
    if (!pages[to]) return;
    if (to !== page) note = "";
    page = to;
    linkResult = "";
    $("#rail").classList.remove("open");
    $("#mobile-menu").setAttribute("aria-expanded", "false");
    render();
    window.scrollTo(0, 0);
    $("#main").focus({ preventScroll: true });
  }
  function paintNav() {
    const n = $("#nav");
    n.replaceChildren();
    for (const [label, ids] of [
      ["ÇALIŞMA ALANI", ["panel", "history"]],
      ["CİHAZ", ["connect", "device", "cal"]],
      ["YEREL SİSTEM", ["errors", "offline"]],
    ]) {
      const group = el("div", "navitemwrap", el("div", "nav-group", label));
      for (const id of ids) {
        const [title, ic] = pages[id];
        const a = el("a", "nav-item", icon(ic), el("span", "navtext", title));
        a.href = "#" + id;
        a.title = title;
        a.setAttribute("aria-label", title);
        if (page === id) a.setAttribute("aria-current", "page");
        a.onclick = (e) => {
          e.preventDefault();
          nav(id);
        };
        group.append(a);
      }
      n.append(group);
    }
  }
  function paintTheme() {
    const dark = theme === "dark";
    document.documentElement.dataset.hisarTheme = dark ? "dark" : "light";
    const button = $("#theme");
    button.replaceChildren(icon(dark ? "sun" : "moon"));
    button.title = dark ? "Açık temaya geç" : "Koyu temaya geç";
    button.setAttribute("aria-label", button.title);
  }
  $("#theme").onclick = () => {
    theme = theme === "dark" ? "light" : "dark";
    db.put("theme", theme);
    paintTheme();
  };
  $("#mobile-menu").onclick = () => {
    const open = $("#rail").classList.toggle("open");
    $("#mobile-menu").setAttribute("aria-expanded", String(open));
  };
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && $("#rail").classList.contains("open")) {
      $("#mobile-menu").click();
      $("#mobile-menu").focus();
    }
  });
  function table(samples, off) {
    const t = el("table");
    const head = el("tr");
    for (const v of ["Örnek", "Ham (sb)", "Gösterim (sb)"]) {
      const th = el("th", "", v);
      th.scope = "col";
      head.append(th);
    }
    t.append(el("thead", "", head));
    const body = el("tbody");
    for (const s of samples) {
      body.append(
        el(
          "tr",
          "",
          el("td", "", String(s.seq + 1)),
          el("td", "", num(s.raw)),
          el("td", "", num(s.raw + off)),
        ),
      );
    }
    t.append(body);
    return t;
  }
  function graph(samples, off) {
    const width = matchMedia("(max-width:639px)").matches ? 340 : 600;
    const svg = sv("svg", {
      viewBox: "0 0 " + width + " 150",
      preserveAspectRatio: "none",
      class: "chart",
      "aria-hidden": true,
    });
    const left = 31,
      right = width - 12,
      top = 8,
      bottom = 140;
    const y = (v) => top + ((90 - v) / 80) * (bottom - top);
    const defs = sv("defs", {}),
      g = sv("linearGradient", {
        id: "fill",
        x1: "0%",
        y1: "0%",
        x2: "0%",
        y2: "100%",
      });
    g.append(
      sv("stop", {
        offset: "0%",
        "stop-color": "#65d5be",
        "stop-opacity": ".33",
      }),
      sv("stop", {
        offset: "100%",
        "stop-color": "#65d5be",
        "stop-opacity": ".02",
      }),
    );
    defs.append(g);
    svg.append(defs);
    for (const val of [20, 40, 60, 80]) {
      const pos = y(val);
      svg.append(
        sv("line", {
          x1: left,
          x2: right,
          y1: pos,
          y2: pos,
          stroke: "#385360",
          "stroke-dasharray": "3 6",
        }),
      );
      const t = sv("text", {
        x: 0,
        y: pos + 4,
        fill: "#b0c4c9",
        "font-size": 12,
      });
      t.textContent = String(val);
      svg.append(t);
    }
    for (let j = 0; j < 7; j++) {
      const x = left + ((right - left) * j) / 6;
      svg.append(
        sv("line", {
          x1: x,
          x2: x,
          y1: top,
          y2: bottom,
          stroke: "#263f4a",
          "stroke-dasharray": "3 6",
        }),
      );
    }
    const pts = samples.map((s, i) => [
      left + ((right - left) * i) / 59,
      y(s.raw + off),
    ]);
    if (!pts.length) return svg;
    const line = pts
      .map(([x, v], i) => (i ? "L" : "M") + x.toFixed(2) + " " + v.toFixed(2))
      .join(" ");
    const [lx, ly] = pts[pts.length - 1];
    svg.append(
      sv("path", {
        d: line + " L" + lx + " " + bottom + " L" + left + " " + bottom + " Z",
        fill: "url(#fill)",
      }),
      sv("path", {
        d: line,
        fill: "none",
        stroke: "#7ae5ca",
        "stroke-width": 2.7,
        "stroke-linejoin": "round",
        "vector-effect": "non-scaling-stroke",
      }),
      sv("circle", {
        cx: lx,
        cy: ly,
        r: 4,
        fill: "#b7fae7",
        stroke: "#0d2530",
        "stroke-width": 2,
      }),
    );
    return svg;
  }
  function chartBox() {
    const block = el("section", "panel chartbox");
    const status = el("span", "", activeHint[mode]);
    const rd = el("strong");
    rd.id = "readout";
    const fig = el("figure");
    fig.id = "figure";
    const det = el("details");
    det.id = "sdata";
    const data = el("div", "datawrap");
    data.id = "datawrap";
    det.append(el("summary", "", "Örnekleri tablo olarak göster"), data);
    det.ontoggle = () => {
      if (det.open) drawLive();
    };
    block.append(
      el("div", "subhead", el("b", "trace-tag", "Sinyal akışı"), status),
      el("div", "readout", rd, el("span", "", "sentetik birim")),
      fig,
      det,
    );
    return block;
  }
  function stat(title, id, unit) {
    const v = el("span");
    v.id = id;
    return el(
      "div",
      "panel stat",
      el("div", "label", title),
      el("div", "value", v, el("small", "", unit)),
    );
  }
  function drawLive() {
    const f = $("#figure");
    if (!f) return;
    const all = activeRows(),
      off = activeOffset(),
      s = all.slice(-60),
      v = s.at(-1);
    $("#readout").textContent = v ? num(v.raw + off) : "—";
    f.replaceChildren(
      graph(s, off),
      el(
        "figcaption",
        "",
        el(
          "span",
          "",
          s.length
            ? "Örnek " + (s[0].seq + 1) + " – " + (s.at(-1).seq + 1)
            : "Örnek bekleniyor",
        ),
        el("span", "", "Gösterim · sb"),
      ),
    );
    $("#count").textContent = all.length;
    $("#mean").textContent = all.length
      ? num(all.reduce((a, b) => a + b.raw + off, 0) / all.length)
      : "—";
    $("#offval").textContent = num(off);
    if ($("#sdata").open) $("#datawrap").replaceChildren(table(s, off));
  }
  function slot(type, txt, small) {
    return el(
      "div",
      "slot " + (type === "synthetic" ? "active" : ""),
      el("div", "well", icon(type === "synthetic" ? "wave" : type)),
      el("div", "", el("strong", "", txt), el("small", "", small)),
    );
  }
  function panel() {
    const source = card(
      "Veri kaynağı",
      slot("synthetic", "Simülatör", "Seçili kaynak · sentetik veri"),
      slot("usb", "USB", "Cihazda doğrulanmadı"),
      slot("bluetooth", "Bluetooth", "Cihazda doğrulanmadı"),
      btn("Bağlantıları incele", () => nav("connect"), "small"),
    );
    source.classList.add("sourcecard");
    const rows = db.list().rows;
    const recent = card("Son kaydedilen oturum");
    if (rows[0]) {
      const s = rows[0];
      recent.append(
        el("strong", "", dt(s.start)),
        el(
          "p",
          "quiet",
          s.samples.length +
            " sentetik örnek · " +
            s.faults +
            " demo kesintisi",
        ),
        btn(
          "Oturum ayrıntısı",
          () => {
            historyId = s.id;
            nav("history");
          },
          "linkbtn",
        ),
      );
    } else
      recent.append(
        el("p", "quiet", "İlk oturumunuzu kaydettiğinizde burada görünür."),
        btn("Geçmişi aç", () => nav("history"), "linkbtn"),
      );
    const ev = card(
      "Son olay",
      el(
        "p",
        "quiet",
        events[0]
          ? clock(events[0].at) + " · " + events[0].msg
          : "Bu sekmede henüz olay yok.",
      ),
      btn("Bildirimleri aç", () => nav("errors"), "linkbtn"),
    );
    return [
      el("div", "grid", chartBox(), source),
      el(
        "div",
        "stats",
        stat("Örnek sayısı", "count", ""),
        stat("Ortalama gösterim", "mean", "sb"),
        stat("Gösterim ofseti", "offval", "sb"),
      ),
      el("div", "pagegrid bottomrow", recent, ev),
    ];
  }
  function connection() {
    const caps = io[choice].inspect();
    const list = el("div", "contractlist");
    for (const key of Object.keys(names)) {
      const b = btn(names[key], () => {
        choice = key;
        linkResult = "";
        render();
      });
      b.setAttribute("aria-pressed", String(choice === key));
      list.append(b);
    }
    const c = card(
      names[choice] + " sözleşmesi",
      details([
        [
          "Kanıt düzeyi",
          caps.canStream ? "Sentetik kaynak" : "Fiziksel test bekliyor",
        ],
        ["Örnek üretimi", caps.canStream ? "Demo oturumunda açık" : "Kapalı"],
        ["Cihaza erişim", "Yok"],
      ]),
    );
    if (choice === "synthetic")
      c.append(btn("Ölçüm panelini aç", () => nav("panel"), "linkbtn"));
    else {
      c.append(
        btn(
          "Sözleşmeyi sına",
          () => {
            const result = io[choice].open();
            linkResult = names[choice] + " · " + result.code;
            log(names[choice] + " sözleşmesi doğrulama bekliyor.");
            render();
            tell(linkResult);
          },
          "linkbtn",
        ),
      );
      if (linkResult)
        c.append(
          hint(
            linkResult,
            "Sözleşme açılış isteğini reddetti. Fiziksel bağlantı kurulmadı.",
            "warning",
          ),
        );
    }
    return [
      el(
        "div",
        "pagegrid",
        card(
          "Bağlantı seçenekleri",
          el("p", "", "Bir taşıyıcı seçerek davranışını inceleyin."),
          list,
        ),
        c,
      ),
    ];
  }
  function device() {
    return [
      el(
        "div",
        "pagegrid",
        card(
          "M5StickC PLUS2",
          badge("Doğrulama bekliyor", "warning"),
          details([
            ["Fiziksel bağlantı", "Kurulmadı"],
            ["Pil düzeyi", "Bilinmiyor"],
            ["Donanım yazılımı", "Bilinmiyor"],
            ["Son cihaz verisi", "Veri yok"],
          ]),
        ),
        card(
          "Simülatör",
          badge("Sentetik kaynak", "info"),
          details([
            ["Akış", activeHint[mode]],
            ["Örnek birimi", "sb · sentetik birim"],
            ["Planlanan aralık", "1 saniye"],
            ["Açık oturum", session ? "Var" : "Yok"],
          ]),
          btn("Ölçüm paneline dön", () => nav("panel"), "linkbtn"),
        ),
      ),
    ];
  }
  function calibration() {
    const cg = card(
      "Sentetik gösterim referansı",
      el(
        "p",
        "",
        "Ofset, ham değere eklenir. Açık oturum başladığı andaki ofseti kullanır.",
      ),
    );
    const form = el("form");
    const label = el(
      "label",
      "field-label",
      "Gösterim ofseti (−10 ile +10 sb)",
    );
    label.htmlFor = "offset";
    const input = el("input");
    input.id = "offset";
    input.type = "number";
    input.min = "-10";
    input.max = "10";
    input.step = "0.1";
    input.required = true;
    input.value = String(offset);
    const preview = el("div", "cal-preview");
    const ex = D.preview[0].raw;
    function change() {
      const n = input.valueAsNumber;
      preview.textContent = input.validity.valid
        ? "Örnek ham değer " + num(ex) + " sb → gösterim " + num(ex + n) + " sb"
        : "−10 ile +10 arasında, en çok bir ondalık basamak girin.";
    }
    input.oninput = change;
    change();
    const save = el("button", "btn primary", "Referansı uygula");
    save.type = "submit";
    form.append(label, input, preview, el("div", "actions", save));
    form.onsubmit = (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      offset = D.round(input.valueAsNumber);
      const ok = db.put("offset", offset);
      note = ok
        ? "Sentetik referans kaydedildi."
        : "Sentetik referans yalnız bu sekmede uygulandı.";
      log("Sentetik gösterim ofseti güncellendi.");
      render();
      tell(note);
    };
    cg.append(form);
    return [
      el(
        "div",
        "pagegrid",
        cg,
        card(
          "Referans durumu",
          details([
            ["Yeni oturum ofseti", num(offset) + " sb"],
            [
              "Açık oturum ofseti",
              session ? num(session.offset) + " sb" : "Oturum yok",
            ],
            ["Ham örnekler", "Özgün değer korunur"],
            ["Fiziksel kalibrasyon", "Doğrulanmadı"],
          ]),
        ),
      ),
    ];
  }
  function historyPage() {
    const { rows, skipped, unavailable } = db.list();
    const left = card(
      "Kaydedilen oturumlar",
      el("p", "quiet", rows.length + " yerel kayıt · İstanbul saati"),
    );
    if (skipped)
      left.append(
        hint(
          "Okunamayan kayıt",
          skipped + " uyumsuz veya bozuk kayıt atlandı.",
          "warning",
        ),
      );
    if (unavailable)
      left.append(
        hint(
          "Kayıt alanı okunamadı",
          "Tarayıcı depolama iznini kontrol edin.",
          "warning",
        ),
      );
    if (!rows.length)
      left.append(
        el("p", "", "Henüz kaydedilmiş oturum yok."),
        btn("Ölçüm panelini aç", () => nav("panel"), "", "activity"),
      );
    const sel = rows.find((r) => r.id === historyId) || rows[0];
    for (const s of rows) {
      const b = btn(
        "İncele",
        () => {
          historyId = s.id;
          render();
        },
        "small",
      );
      b.setAttribute("aria-label", dt(s.start) + " oturumunu incele");
      b.setAttribute("aria-pressed", String(sel?.id === s.id));
      left.append(
        el(
          "div",
          "entry",
          el(
            "div",
            "",
            el("strong", "", dt(s.start)),
            el("small", "", s.samples.length + " örnek · Sentetik"),
          ),
          b,
        ),
      );
    }
    const right = card("Oturum ayrıntısı");
    if (sel) {
      right.append(
        badge("Sentetik", "info"),
        details([
          ["Başlangıç", dt(sel.start)],
          ["Bitiş", dt(sel.end)],
          ["Örnek sayısı", sel.samples.length],
          ["Ofset", num(sel.offset) + " sb"],
          ["Demo kesintisi", sel.faults],
        ]),
        el("div", "scroll", table(sel.samples, sel.offset)),
      );
    } else
      right.append(
        el("p", "quiet", "Kaydın ham ve gösterim değerleri burada listelenir."),
      );
    return [el("div", "pagegrid", left, right)];
  }
  function errorPage() {
    const a = card(
      "Akış kesintisi denemesi",
      el(
        "p",
        "",
        "Örnek üretimini durdurup aynı oturumda devam etmeyi deneyin. Kaydedilen örnekler korunur.",
      ),
    );
    if (mode === "running")
      a.append(
        btn(
          "Demo kesintisi oluştur",
          () => {
            suspend("fault");
            note =
              "Sentetik akış kesildi. Akışı kurtardığınızda aynı oturum sürer.";
            render();
            tell(note);
          },
          "",
          "pause",
        ),
      );
    else if (mode === "fault")
      a.append(
        hint("SIM_INTERRUPTED", "Oturum açık, örnek üretimi durdu.", "warning"),
        btn("Akışı kurtar", resume, "primary", "refresh"),
      );
    else
      a.append(
        btn(
          session ? "Oturuma dön" : "Sentetik oturum başlat",
          () => {
            if (!session) start();
            nav("panel");
          },
          "",
          "play",
        ),
      );
    const logCard = card("Bu sekmedeki olaylar");
    if (!events.length) logCard.append(el("p", "quiet", "Henüz olay yok."));
    for (const e of events)
      logCard.append(
        el(
          "div",
          "entry",
          el("div", "", el("strong", "", e.msg), el("small", "", clock(e.at))),
        ),
      );
    return [el("div", "pagegrid", a, logCard)];
  }
  function offline() {
    const a = card(
      "Yerel çalışma",
      details([
        [
          "Tarayıcının ağ bildirimi",
          navigator.onLine ? "Çevrimiçi" : "Çevrimdışı",
        ],
        ["Çalışma alanı", "Uygulamayla birlikte yüklenir"],
        ["Haricî istek", "Yok"],
        ["Yerel kayıt alanı", writable ? "Yazılabilir" : "Kullanılamıyor"],
      ]),
    );
    const test = card(
      "Depolama denetimi",
      el(
        "p",
        "",
        "Geçici bir deneme kaydı yazılır, geri okunur ve kaldırılır. Kaydettiğiniz oturumlar aynı tarayıcı ve depolama bağlamında açılır.",
      ),
    );
    test.append(
      btn(
        "Yazma ve okumayı denetle",
        () => {
          writable = db.probe();
          checked = Date.now();
          checkResult = writable
            ? "Yazma ve okuma başarılı."
            : "Yerel alana erişilemedi.";
          log(checkResult);
          render();
          tell(checkResult);
        },
        "",
        "refresh",
      ),
    );
    if (checked)
      test.append(
        hint(
          checkResult,
          clock(checked) + " · Yerel denetim",
          writable ? "success" : "warning",
        ),
      );
    return [
      el("div", "pagegrid", a, test),
      el(
        "p",
        "hint",
        "Uygulamanın kayıtlı kopyası açıldığında stüdyo da açılabilir. Depolama izni bu tarayıcıya bağlıdır.",
      ),
    ];
  }
  function render() {
    paintNav();
    paintTheme();
    const m = $("#main");
    const head = el(
      "div",
      "headrow",
      el("div", "", el("h1", "", pages[page][0]), el("p", "", desc[page])),
      page === "panel" ? controls() : null,
    );
    const stateMessage = note
      ? el(
          "div",
          "notice",
          hint(
            note,
            "",
            note.includes("yazılamadı") || mode === "fault"
              ? "warning"
              : "info",
          ),
        )
      : null;
    const fs = {
      panel,
      history: historyPage,
      device,
      connect: connection,
      cal: calibration,
      errors: errorPage,
      offline,
    };
    m.replaceChildren(head);
    if (stateMessage) m.append(stateMessage);
    if (!draftOK && session)
      m.append(
        hint(
          "Sekme taslağı yazılamadı",
          "Sayfayı kapatmadan oturumu yerel geçmişe kaydedin.",
          "warning",
        ),
      );
    m.append(...fs[page]());
    if (page === "panel") drawLive();
    document.title = pages[page][0] + " · HİSAR Tetik";
  }

  addEventListener("storage", (e) => {
    if (
      e.key?.startsWith("hisar-tetik.demo.v1.session.") &&
      ["history", "panel"].includes(page)
    )
      render();
  });
  for (const name of ["offline", "online"])
    addEventListener(name, () => {
      if (page === "offline") render();
    });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && mode === "running") {
      suspend("pause");
      note = "Sekme arka plana geçtiği için oturum duraklatıldı.";
      render();
    }
  });
  document.querySelector(".skip").onclick = (e) => {
    e.preventDefault();
    $("#main").focus();
  };
  $("#source-label").append(badge("Sentetik veri", "info"));
  render();
})();
