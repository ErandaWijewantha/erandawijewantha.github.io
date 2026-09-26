/* Hero "business question" panel: tabs, auto-advance, animated SVG charts.
   Scenario data comes from the InsightScenario model via json_script. */
(() => {
  const root = document.querySelector("[data-insight]");
  const dataEl = document.getElementById("insight-data");
  if (!root || !dataEl) return;

  const scenarios = JSON.parse(dataEl.textContent);
  if (!scenarios.length) return;

  const DURATION = 5500;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const NS = "http://www.w3.org/2000/svg";
  const A = "var(--accent)", N = "var(--n-300)", T = "var(--text)", M = "var(--n-700)";

  const $ = (sel) => root.querySelector(sel);
  const tabs = [...root.querySelectorAll("[role=tab]")];
  const bar = root.querySelector(".insight-progress i");

  const el = (tag, attrs = {}, style = {}) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    Object.assign(n.style, style);
    return n;
  };
  const grow = (axis, delay, origin) => ({
    transformBox: "fill-box",
    transformOrigin: origin || (axis === "x" ? "left center" : "center bottom"),
    animation: `${axis === "x" ? "ewgx" : "ewgy"} .8s cubic-bezier(.2,.8,.2,1) both`,
    animationDelay: `${delay}s`,
  });
  const pop = (delay) => ({ transformBox: "fill-box", transformOrigin: "center", animation: "ewpop .4s ease both", animationDelay: `${delay}s` });
  const fmt = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(1));

  function text(svg, x, y, str, o = {}) {
    const t = el("text", { x, y, "text-anchor": o.a || "start" }, {
      fontSize: `${o.s || 12}px`, fontWeight: o.w || 400, fill: o.f || M,
      fontFamily: "inherit", animation: "ewin .4s ease both", animationDelay: `${(o.d || 0) * 0.5}s`,
    });
    t.textContent = str;
    svg.appendChild(t);
  }

  const isHot = (s, label, auto) => (s.hl.length ? s.hl.includes(label) : auto);

  const charts = {
    funnel(svg, s) {
      const rows = s.rows, max = Math.max(...rows.map((r) => r[1]), 1), unit = 300 / max;
      let worst = -1, worstDrop = 0;
      rows.forEach((r, k) => { if (k && rows[k - 1][1] - r[1] > worstDrop) { worstDrop = rows[k - 1][1] - r[1]; worst = k; } });
      rows.forEach(([l, v], k) => {
        const y = 4 + k * 31, hot = isHot(s, l, k === worst), w = v * unit;
        text(svg, 0, y + 14, l, { w: hot ? 600 : 400, f: hot ? T : M });
        svg.appendChild(el("rect", { x: 132, y, width: w, height: 20, rx: 3 }, { fill: hot ? A : N, ...grow("x", k * 0.1) }));
        text(svg, 132 + w + 8, y + 14, `${fmt(v)}%`, { w: 600, f: hot ? A : T, d: 0.6 });
        if (hot && k > 0) {
          const note = s.note || `▼ −${fmt(rows[k - 1][1] - v)} pts`;
          text(svg, 132 + w + 48, y + 14, note, { w: 700, f: A, d: 0.9 });
        }
      });
      return 4 + rows.length * 31;
    },
    bullet(svg, s) {
      const rows = s.rows, max = Math.max(100, ...rows.flatMap((r) => r.slice(1))), unit = 400 / max;
      rows.forEach(([l, a, tg = a], k) => {
        const y = 6 + k * 30, miss = isHot(s, l, a < tg);
        text(svg, 0, y + 12, l, { w: miss ? 600 : 400, f: miss ? T : M });
        svg.appendChild(el("rect", { x: 70, y, width: 400, height: 16, rx: 3 }, { fill: "var(--n-200)" }));
        svg.appendChild(el("rect", { x: 70, y, width: a * unit, height: 16, rx: 3 }, { fill: miss ? A : N, ...grow("x", k * 0.08) }));
        svg.appendChild(el("line", { x1: 70 + tg * unit, x2: 70 + tg * unit, y1: y - 4, y2: y + 20 }, { stroke: T, strokeWidth: 2 }));
        text(svg, 484, y + 12, `${fmt(a)}%`, { w: 600, f: miss ? A : T, d: 0.5 });
      });
      const h = 6 + rows.length * 30;
      text(svg, 70, h + 12, s.note || "▮ actual   ┃ target", { s: 10 });
      return h + 16;
    },
    diverging(svg, s) {
      const rows = s.rows, x0 = 250, maxAbs = Math.max(...rows.map((r) => Math.abs(r[1])), 1), u = 200 / maxAbs;
      const h = 4 + rows.length * 30;
      svg.appendChild(el("line", { x1: x0, x2: x0, y1: 0, y2: h }, { stroke: T, strokeWidth: 1.5 }));
      rows.forEach(([l, v], k) => {
        const y = 4 + k * 30, neg = v < 0, hot = isHot(s, l, neg), w = Math.abs(v) * u;
        text(svg, 0, y + 13, l, { w: hot ? 600 : 400, f: hot ? T : M });
        svg.appendChild(el("rect", { x: neg ? x0 - w : x0, y, width: w, height: 18, rx: 3 },
          { fill: hot ? A : N, ...grow("x", k * 0.08, neg ? "right center" : "left center") }));
        text(svg, neg ? x0 - w - 6 : x0 + w + 6, y + 13, `${v > 0 ? "+" : ""}${fmt(v)}%`, { a: neg ? "end" : "start", w: 600, f: hot ? A : T, d: 0.6 });
      });
      return h;
    },
    columns(svg, s) {
      const rows = s.rows, max = Math.max(...rows.map((r) => r[1]), 1), step = 490 / rows.length;
      const bw = Math.min(44, step * 0.65), top = Math.max(...rows.map((r) => r[1]));
      rows.forEach(([l, v], k) => {
        const x = 20 + k * step, hgt = (v / max) * 122, hot = isHot(s, l, v === top);
        svg.appendChild(el("rect", { x, y: 140 - hgt, width: bw, height: hgt, rx: 3 }, { fill: hot ? A : N, ...grow("y", k * 0.06) }));
        text(svg, x + bw / 2, 156, l, { a: "middle", w: hot ? 600 : 400, f: hot ? T : M });
        text(svg, x + bw / 2, 134 - hgt, fmt(v), { a: "middle", w: 600, f: hot ? A : T, d: 0.6 });
      });
      return 160;
    },
    dumbbell(svg, s) {
      const rows = s.rows, max = Math.max(...rows.flatMap((r) => r.slice(1)), 1), sx = (v) => 90 + (v / max) * 320;
      let least = -1, leastChange = Infinity;
      rows.forEach(([, a, b = a], k) => { const c = Math.abs(a - b); if (c < leastChange) { leastChange = c; least = k; } });
      rows.forEach(([l, a, b = a], k) => {
        const y = 16 + k * 28, hot = isHot(s, l, k === least);
        text(svg, 0, y + 4, l, { w: hot ? 600 : 400, f: hot ? T : M });
        svg.appendChild(el("line", { x1: sx(Math.min(a, b)), x2: sx(Math.max(a, b)), y1: y, y2: y },
          { stroke: hot ? A : N, strokeWidth: 3, animation: "ewin .6s ease both", animationDelay: `${0.3 + k * 0.08}s` }));
        svg.appendChild(el("circle", { cx: sx(a), cy: y, r: 6 }, { fill: "var(--bg)", stroke: M, strokeWidth: 2, ...pop(k * 0.08) }));
        svg.appendChild(el("circle", { cx: sx(b), cy: y, r: 6 }, { fill: hot ? A : T, ...pop(0.4 + k * 0.08) }));
        text(svg, sx(Math.max(a, b)) + 12, y + 4, `${fmt(a)}% → ${fmt(b)}%`, { w: 600, f: hot ? A : T, d: 0.8 });
      });
      const h = 16 + rows.length * 28;
      text(svg, 90, h + 4, s.note || "○ before    ● after", { s: 10 });
      return h + 8;
    },
  };

  function render(i) {
    const s = scenarios[i];
    tabs.forEach((t, k) => { t.setAttribute("aria-selected", String(k === i)); t.tabIndex = k === i ? 0 : -1; });
    $("[data-ctype]").textContent = s.ctype;
    $("[data-q]").textContent = s.q;
    $("[data-kw]").replaceChildren(...s.kw.map((k) => Object.assign(document.createElement("span"), { className: "tag tag-neutral", textContent: k })));
    $("[data-insight-text]").textContent = s.insight;
    $("[data-impact]").textContent = s.impact;
    $("[data-impact-l]").textContent = s.impactL;

    const svg = el("svg", { width: "100%", role: "img", "aria-label": `${s.ctype}: ${s.insight}` });
    const h = (charts[s.chart] || charts.columns)(svg, s);
    svg.setAttribute("viewBox", `-4 -4 528 ${h + 12}`);
    $("[data-chart]").replaceChildren(svg);
  }

  // Timer: accumulates only while not paused, so hover/focus pauses exactly.
  let current = 0, elapsed = 0, last = performance.now(), hovering = false, focused = false;
  const go = (i) => { current = (i + scenarios.length) % scenarios.length; elapsed = 0; render(current); };

  function frame(now) {
    const dt = now - last; last = now;
    if (!hovering && !focused && !document.hidden) {
      elapsed += dt;
      if (elapsed >= DURATION) go(current + 1);
    }
    bar.style.width = `${Math.min(100, (elapsed / DURATION) * 100)}%`;
    requestAnimationFrame(frame);
  }

  tabs.forEach((t, k) => {
    t.addEventListener("click", () => go(k));
    t.addEventListener("keydown", (e) => {
      const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (d) { go(current + d); tabs[current].focus(); e.preventDefault(); }
    });
  });
  root.addEventListener("mouseenter", () => { hovering = true; });
  root.addEventListener("mouseleave", () => { hovering = false; });
  root.addEventListener("focusin", () => { focused = true; });
  root.addEventListener("focusout", () => { focused = false; });

  render(0);
  if (!reduced && scenarios.length > 1) requestAnimationFrame(frame);
  else bar.parentElement.hidden = true;
})();
