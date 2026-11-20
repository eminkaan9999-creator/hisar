// Small, local presentational helpers. These do not access the host application.
const StudioWidgets = (() => {
  const paths = {
    activity: "M2 13h5l3-8 4 14 3-8h5",
    clock: "M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18m0 4v6l4 2",
    archive: "M3 4h18v5H3z M5 10v10h14V10 M10 13h4",
    alert: "M12 3 2 21h20z M12 9v5m0 3v1",
    info: "M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18m0 7v6m0-9v1",
    check: "M4 12l5 5 11-12",
    sun: "M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8m0-6v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2",
    moon: "M19 16A8 8 0 0 1 8 5a8 8 0 1 0 11 11z",
    refresh: "M20 8a8 8 0 1 0 .5 7M20 3v6h-6",
  };
  function icon(name) {
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    for (const [k, v] of Object.entries({
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": 1.8,
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "aria-hidden": "true",
      class: "studio-icon",
    }))
      svg.setAttribute(k, v);
    const path = document.createElementNS(ns, "path");
    path.setAttribute("d", paths[name] || paths.info);
    svg.append(path);
    return svg;
  }
  const toneIcon = (tone) =>
    ({ warning: "alert", danger: "alert", success: "check" })[tone] || "info";
  function badge(text, { tone }) {
    const span = document.createElement("span");
    span.className = "studio-badge";
    span.append(icon(toneIcon(tone)), text);
    return span;
  }
  function alert({ title, text, tone }) {
    const node = document.createElement("div");
    node.className = "studio-alert";
    const content = document.createElement("div");
    const strong = document.createElement("strong");
    strong.textContent = title;
    content.append(strong);
    if (text) {
      const p = document.createElement("p");
      p.textContent = text;
      content.append(p);
    }
    node.append(icon(toneIcon(tone)), content);
    return node;
  }
  return { icon, badge, alert };
})();
