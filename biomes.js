/* StorySpark biomes: drawn landscapes (SVG strings), different for every story. Used for story covers and the adventure background. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.SSBiome = factory();
})(typeof self !== "undefined" ? self : this, function () {
  function rng(seed) {
    let a = (seed >>> 0) || 1;
    return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const f = (n) => (+n).toFixed(1);

  // time of day palettes: sky top, sky bottom, sun colour, ink (far to near shade multipliers handled per biome), haze
  const TIMES = {
    day:   { top: "#5aa9e6", bot: "#cfeaf7", sun: "#fff4c2", sunA: 0.95, haze: "#ffffff", dark: 0 },
    dusk:  { top: "#3b2a6b", bot: "#ff9e6b", sun: "#ffe0a8", sunA: 0.95, haze: "#ffc7a0", dark: 0.25 },
    dawn:  { top: "#6f7fc4", bot: "#ffd3b0", sun: "#fff0cf", sunA: 0.95, haze: "#ffe6d0", dark: 0.1 },
    night: { top: "#070b24", bot: "#2a3c78", sun: "#f4f1d8", sunA: 0.95, haze: "#5a6cb0", dark: 0.6 },
  };
  // mix a #rrggbb colour toward a target by t (0..1)
  function mix(a, b, t) {
    const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const A = p(a), B = p(b);
    return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("");
  }
  // a ridge line across the picture: sum of sines, filled down to the bottom
  function ridge(r, W, H, y, amp, fill, rough) {
    const p1 = r() * 6.28, p2 = r() * 6.28, p3 = r() * 6.28, f1 = 0.8 + r() * 1.4, f2 = 2 + r() * 2.5, f3 = 5 + r() * 4;
    let d = "M0 " + H;
    for (let x = 0; x <= W + 8; x += W / 48) {
      const u = x / W, v = Math.sin(u * f1 * 6.28 + p1) * 0.6 + Math.sin(u * f2 * 6.28 + p2) * 0.3 + Math.sin(u * f3 * 6.28 + p3) * (rough || 0.1);
      d += " L" + f(x) + " " + f(y - v * amp);
    }
    return '<path d="' + d + " L" + W + " " + H + ' Z" fill="' + fill + '"/>';
  }
  const pine = (x, y, s, c) => '<g fill="' + c + '"><rect x="' + f(x - s * 0.05) + '" y="' + f(y - s * 0.12) + '" width="' + f(s * 0.1) + '" height="' + f(s * 0.14) + '"/>' +
    [0, 1, 2].map((i) => '<path d="M' + f(x - s * (0.28 - i * 0.06)) + " " + f(y - s * (0.1 + i * 0.28)) + " L" + f(x) + " " + f(y - s * (0.5 + i * 0.28)) + " L" + f(x + s * (0.28 - i * 0.06)) + " " + f(y - s * (0.1 + i * 0.28)) + 'Z"/>').join("") + "</g>";
  const round = (x, y, s, c, t) => '<g><rect x="' + f(x - s * 0.04) + '" y="' + f(y - s * 0.4) + '" width="' + f(s * 0.08) + '" height="' + f(s * 0.4) + '" fill="' + t + '"/><circle cx="' + f(x) + '" cy="' + f(y - s * 0.55) + '" r="' + f(s * 0.3) + '" fill="' + c + '"/><circle cx="' + f(x - s * 0.18) + '" cy="' + f(y - s * 0.42) + '" r="' + f(s * 0.2) + '" fill="' + c + '"/><circle cx="' + f(x + s * 0.18) + '" cy="' + f(y - s * 0.44) + '" r="' + f(s * 0.2) + '" fill="' + c + '"/></g>';
  function palm(x, y, s, c, t, r) {
    let o = '<path d="M' + f(x) + " " + f(y) + " Q" + f(x + s * 0.12) + " " + f(y - s * 0.5) + " " + f(x + s * 0.04) + " " + f(y - s) + '" stroke="' + t + '" stroke-width="' + f(s * 0.06) + '" fill="none" stroke-linecap="round"/>';
    for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.55, L = s * (0.42 + r() * 0.1); o += '<path d="M' + f(x + s * 0.04) + " " + f(y - s) + " Q" + f(x + s * 0.04 + Math.cos(a) * L * 0.6) + " " + f(y - s + Math.sin(a) * L * 0.6 - s * 0.12) + " " + f(x + s * 0.04 + Math.cos(a) * L) + " " + f(y - s + Math.sin(a) * L + s * 0.06) + '" stroke="' + c + '" stroke-width="' + f(s * 0.05) + '" fill="none" stroke-linecap="round"/>'; }
    return o;
  }
  function stars(r, W, H, n) { let o = ""; for (let i = 0; i < n; i++) o += '<circle cx="' + f(r() * W) + '" cy="' + f(r() * H * 0.6) + '" r="' + f(0.5 + r() * 1.5) + '" fill="#fff" opacity="' + f(0.4 + r() * 0.6) + '"/>'; return o; }
  function cloud(x, y, s, a) { return '<g fill="#fff" opacity="' + a + '"><ellipse cx="' + f(x) + '" cy="' + f(y) + '" rx="' + f(s) + '" ry="' + f(s * 0.3) + '"/><ellipse cx="' + f(x + s * 0.5) + '" cy="' + f(y - s * 0.18) + '" rx="' + f(s * 0.55) + '" ry="' + f(s * 0.28) + '"/><ellipse cx="' + f(x - s * 0.45) + '" cy="' + f(y - s * 0.1) + '" rx="' + f(s * 0.5) + '" ry="' + f(s * 0.24) + '"/></g>'; }

  const BIOMES = {
    desert(r, W, H, T, K) {
      let g = "";
      const sx = W * (0.2 + r() * 0.6), sy = H * (0.28 + r() * 0.12);
      g += '<circle cx="' + f(sx) + '" cy="' + f(sy) + '" r="' + f(H * 0.09) + '" fill="' + T.sun + '"/>';
      const base = ["#e9b36a", "#d98f4e", "#bb6a3a", "#8f4a2c"];
      base.forEach((c, i) => { g += ridge(r, W, H, H * (0.55 + i * 0.1), H * (0.05 + i * 0.03), mix(c, "#150a2a", T.dark), 0.03); });
      if (r() < 0.6) { const x = W * (0.15 + r() * 0.7), y = H * 0.66; g += '<g fill="' + mix("#2b1810", "#000000", T.dark) + '"><rect x="' + f(x) + '" y="' + f(y - H * 0.11) + '" width="' + f(W * 0.012) + '" height="' + f(H * 0.11) + '" rx="3"/><rect x="' + f(x - W * 0.012) + '" y="' + f(y - H * 0.08) + '" width="' + f(W * 0.012) + '" height="' + f(H * 0.035) + '" rx="3"/><rect x="' + f(x + W * 0.012) + '" y="' + f(y - H * 0.065) + '" width="' + f(W * 0.012) + '" height="' + f(H * 0.035) + '" rx="3"/></g>'; }
      if (r() < 0.5) { const x = W * (0.55 + r() * 0.3), y = H * 0.54; g += '<path d="M' + f(x - W * 0.07) + " " + f(y + H * 0.02) + " L" + f(x) + " " + f(y - H * 0.2) + " L" + f(x + W * 0.07) + " " + f(y + H * 0.02) + 'Z" fill="' + mix("#c88b52", "#150a2a", T.dark + 0.1) + '"/>'; }
      return g;
    },
    forest(r, W, H, T, K) {
      let g = "";
      g += '<circle cx="' + f(W * (0.15 + r() * 0.7)) + '" cy="' + f(H * 0.26) + '" r="' + f(H * 0.07) + '" fill="' + T.sun + '" opacity="' + T.sunA + '"/>';
      [["#7fa88a", 0.52, 0.06], ["#4f8a63", 0.62, 0.07]].forEach((q) => { g += ridge(r, W, H, H * q[1], H * q[2], mix(q[0], "#0a1022", T.dark), 0.05); });
      for (let layer = 0; layer < 3; layer++) {
        const y = H * (0.62 + layer * 0.14), n = 9 - layer * 2, col = mix(["#2f6b4a", "#1f5a3a", "#103f2a"][layer], "#050a18", T.dark);
        g += '<rect x="0" y="' + f(y) + '" width="' + W + '" height="' + f(H - y) + '" fill="' + col + '"/>';
        for (let i = 0; i < n; i++) g += pine(W * ((i + r() * 0.8) / n), y + H * 0.02, H * (0.34 + layer * 0.14) * (0.8 + r() * 0.5), col);
      }
      if (T.dark < 0.4) for (let i = 0; i < 3; i++) g += '<path d="M' + f(W * (0.2 + i * 0.25)) + " " + f(H * 0.32) + 'l' + f(W * 0.012) + " " + f(-H * 0.02) + " " + f(W * 0.012) + " " + f(H * 0.02) + '" stroke="#12312a" stroke-width="2" fill="none"/>';
      return g;
    },
    mountain(r, W, H, T, K) {
      let g = "";
      g += '<circle cx="' + f(W * (0.2 + r() * 0.6)) + '" cy="' + f(H * 0.24) + '" r="' + f(H * 0.07) + '" fill="' + T.sun + '"/>';
      const cols = ["#9fb2d8", "#7388b8", "#4f6396", "#2f3f68"];
      cols.forEach((c, i) => {
        const y = H * (0.5 + i * 0.1), amp = H * (0.2 - i * 0.03);
        let d = "M0 " + H, x = 0;
        d += " L0 " + f(y);
        while (x < W) { const px = x + W * (0.07 + r() * 0.09); d += " L" + f(x + (px - x) * 0.5) + " " + f(y - amp * (0.4 + r() * 0.7)) + " L" + f(px) + " " + f(y + r() * amp * 0.15); x = px; }
        g += '<path d="' + d + " L" + W + " " + H + ' Z" fill="' + mix(c, "#060a1c", T.dark) + '"/>';
      });
      g += ridge(r, W, H, H * 0.9, H * 0.04, mix("#1c2a3a", "#000000", T.dark), 0.08);
      if (r() < 0.6) g += '<g stroke="' + mix("#2a2118", "#000000", T.dark) + '" stroke-width="' + f(W * 0.004) + '" fill="none"><path d="M' + f(W * 0.42) + " " + f(H * 0.5) + " l" + f(W * 0.02) + " " + f(H * 0.04) + " l" + f(-W * 0.012) + " " + f(H * 0.04) + '"/></g>';
      return g;
    },
    sea(r, W, H, T, K) {
      let g = "";
      const sx = W * (0.25 + r() * 0.5), hy = H * 0.58;
      g += '<circle cx="' + f(sx) + '" cy="' + f(H * 0.4) + '" r="' + f(H * 0.09) + '" fill="' + T.sun + '"/>';
      g += '<rect x="0" y="' + f(hy) + '" width="' + W + '" height="' + f(H - hy) + '" fill="' + mix("#2b86b8", "#050a22", T.dark) + '"/>';
      g += '<rect x="' + f(sx - W * 0.03) + '" y="' + f(hy) + '" width="' + f(W * 0.06) + '" height="' + f(H * 0.3) + '" fill="' + T.sun + '" opacity="0.35"/>';
      for (let i = 0; i < 14; i++) { const y = hy + H * 0.03 + r() * H * 0.36, x = r() * W, w = W * (0.04 + r() * 0.09); g += '<path d="M' + f(x) + " " + f(y) + " q" + f(w / 4) + " " + f(-H * 0.012) + " " + f(w / 2) + " 0 t" + f(w / 2) + ' 0" stroke="#fff" stroke-width="2" fill="none" opacity="0.4"/>'; }
      // island with palms, and a little boat
      const ix = W * (0.55 + r() * 0.3);
      g += '<path d="M' + f(ix - W * 0.14) + " " + f(hy + 3) + " Q" + f(ix) + " " + f(hy - H * 0.1) + " " + f(ix + W * 0.14) + " " + f(hy + 3) + 'Z" fill="' + mix("#d9b46a", "#050a22", T.dark) + '"/>';
      g += palm(ix - W * 0.02, hy - H * 0.04, H * 0.2, mix("#2f8a4a", "#050a22", T.dark), mix("#6b4a2a", "#050a22", T.dark), r) + palm(ix + W * 0.04, hy - H * 0.03, H * 0.15, mix("#2f8a4a", "#050a22", T.dark), mix("#6b4a2a", "#050a22", T.dark), r);
      const bx = W * (0.12 + r() * 0.25), by = hy + H * 0.14;
      g += '<path d="M' + f(bx - W * 0.05) + " " + f(by) + " h" + f(W * 0.1) + " l" + f(-W * 0.015) + " " + f(H * 0.04) + " h" + f(-W * 0.07) + 'Z" fill="' + mix("#7a3b22", "#000000", T.dark) + '"/><path d="M' + f(bx) + " " + f(by) + " v" + f(-H * 0.2) + " l" + f(W * 0.06) + " " + f(H * 0.17) + 'Z" fill="#fff" opacity="0.92"/>';
      return g;
    },
    snow(r, W, H, T, K) {
      let g = "";
      g += '<circle cx="' + f(W * (0.2 + r() * 0.6)) + '" cy="' + f(H * 0.28) + '" r="' + f(H * 0.06) + '" fill="' + T.sun + '" opacity="0.9"/>';
      [["#cfe0f4", 0.5, 0.14], ["#e6f0fb", 0.62, 0.08], ["#f7fbff", 0.74, 0.06]].forEach((q) => { g += ridge(r, W, H, H * q[1], H * q[2], mix(q[0], "#14204a", T.dark * 0.9), 0.06); });
      for (let i = 0; i < 12; i++) g += pine(W * (r()), H * (0.7 + r() * 0.25), H * (0.2 + r() * 0.2), mix("#1d4a52", "#04101e", T.dark * 0.8)).replace(/<path/g, "<path");
      for (let i = 0; i < 60; i++) g += '<circle cx="' + f(r() * W) + '" cy="' + f(r() * H) + '" r="' + f(1 + r() * 2.4) + '" fill="#fff" opacity="' + f(0.5 + r() * 0.5) + '"/>';
      return g;
    },
    jungle(r, W, H, T, K) {
      let g = "";
      g += '<circle cx="' + f(W * (0.3 + r() * 0.4)) + '" cy="' + f(H * 0.3) + '" r="' + f(H * 0.07) + '" fill="' + T.sun + '" opacity="0.8"/>';
      g += ridge(r, W, H, H * 0.55, H * 0.08, mix("#4f9a7a", "#06101a", T.dark), 0.06);
      g += ridge(r, W, H, H * 0.66, H * 0.07, mix("#2f7a55", "#06101a", T.dark), 0.06);
      for (let i = 0; i < 6; i++) { const x = W * ((i + 0.3 + r() * 0.4) / 6); g += palm(x, H * (0.82 + r() * 0.1), H * (0.5 + r() * 0.3), mix(["#2f9a4a", "#1d7a3a", "#3aa85a"][i % 3], "#04100a", T.dark), mix("#4a3320", "#000000", T.dark), r); }
      g += '<path d="M0 ' + H + " L0 " + f(H * 0.9) + " Q" + f(W * 0.3) + " " + f(H * 0.84) + " " + f(W * 0.6) + " " + f(H * 0.9) + " T" + W + " " + f(H * 0.88) + " L" + W + " " + H + 'Z" fill="' + mix("#0d3a22", "#000000", T.dark) + '"/>';
      for (let i = 0; i < 3; i++) g += '<path d="M' + f(W * (0.1 + i * 0.3)) + " 0 Q" + f(W * (0.15 + i * 0.3)) + " " + f(H * 0.2) + " " + f(W * (0.12 + i * 0.3)) + " " + f(H * 0.32) + '" stroke="' + mix("#2d7a3a", "#000000", T.dark) + '" stroke-width="4" fill="none"/>';
      return g;
    },
    meadow(r, W, H, T, K) {
      let g = "";
      g += '<circle cx="' + f(W * (0.15 + r() * 0.7)) + '" cy="' + f(H * 0.22) + '" r="' + f(H * 0.07) + '" fill="' + T.sun + '"/>';
      g += cloud(W * 0.25, H * 0.2, W * 0.08, T.dark < 0.4 ? 0.85 : 0.3) + cloud(W * 0.7, H * 0.32, W * 0.1, T.dark < 0.4 ? 0.8 : 0.25);
      [["#9fd49a", 0.56, 0.05], ["#7ec06f", 0.66, 0.06], ["#5aa65a", 0.78, 0.05]].forEach((q) => { g += ridge(r, W, H, H * q[1], H * q[2], mix(q[0], "#06101c", T.dark), 0.04); });
      g += round(W * (0.14 + r() * 0.1), H * 0.74, H * 0.5, mix("#2f8a3a", "#04100a", T.dark), mix("#5a3a20", "#000000", T.dark));
      g += round(W * (0.78 + r() * 0.12), H * 0.7, H * 0.35, mix("#3a9a44", "#04100a", T.dark), mix("#5a3a20", "#000000", T.dark));
      const fl = ["#ff7aa8", "#ffd23f", "#fff", "#b48cff"];
      for (let i = 0; i < 26; i++) g += '<circle cx="' + f(r() * W) + '" cy="' + f(H * (0.78 + r() * 0.2)) + '" r="' + f(2 + r() * 3) + '" fill="' + fl[i % 4] + '"/>';
      return g;
    },
    city(r, W, H, T, K) {
      let g = "";
      const dk = Math.max(T.dark, 0.3);
      g += '<circle cx="' + f(W * (0.2 + r() * 0.6)) + '" cy="' + f(H * 0.22) + '" r="' + f(H * 0.06) + '" fill="' + T.sun + '" opacity="0.9"/>';
      for (let layer = 0; layer < 3; layer++) {
        const col = mix(["#3b4a7a", "#25305a", "#121830"][layer], "#02040c", dk * 0.6), base = H * (0.66 + layer * 0.12);
        let x = -W * 0.02;
        while (x < W) {
          const w = W * (0.05 + r() * 0.07), h = H * (0.14 + r() * 0.3) * (1 - layer * 0.12);
          g += '<rect x="' + f(x) + '" y="' + f(base - h) + '" width="' + f(w) + '" height="' + f(H - base + h) + '" fill="' + col + '"/>';
          if (layer > 0) for (let wy = base - h + H * 0.03; wy < base - H * 0.02; wy += H * 0.045) for (let wx = x + w * 0.15; wx < x + w * 0.85; wx += w * 0.28) if (r() < 0.45) g += '<rect x="' + f(wx) + '" y="' + f(wy) + '" width="' + f(w * 0.12) + '" height="' + f(H * 0.02) + '" fill="#ffd98a" opacity="0.9"/>';
          x += w + W * 0.004;
        }
      }
      g += '<rect x="0" y="' + f(H * 0.95) + '" width="' + W + '" height="' + f(H * 0.05) + '" fill="#080a16"/>';
      return g;
    },
    castle(r, W, H, T, K) {
      let g = "";
      g += '<circle cx="' + f(W * (0.15 + r() * 0.2)) + '" cy="' + f(H * 0.24) + '" r="' + f(H * 0.08) + '" fill="' + T.sun + '"/>';
      g += ridge(r, W, H, H * 0.62, H * 0.1, mix("#6a8ab8", "#0a1030", T.dark), 0.04);
      const cx = W * (0.5 + (r() - 0.5) * 0.2), by = H * 0.74, col = mix("#8a7fa8", "#0a0820", T.dark + 0.1), roof = mix("#b04a5a", "#1a0a20", T.dark);
      const tower = (x, w, h) => '<rect x="' + f(x) + '" y="' + f(by - h) + '" width="' + f(w) + '" height="' + f(h + H * 0.3) + '" fill="' + col + '"/><path d="M' + f(x - w * 0.15) + " " + f(by - h) + " L" + f(x + w / 2) + " " + f(by - h - w * 1.3) + " L" + f(x + w * 1.15) + " " + f(by - h) + 'Z" fill="' + roof + '"/><rect x="' + f(x + w * 0.4) + '" y="' + f(by - h * 0.7) + '" width="' + f(w * 0.2) + '" height="' + f(h * 0.15) + '" fill="#ffd98a"/>';
      g += '<rect x="' + f(cx - W * 0.16) + '" y="' + f(by - H * 0.12) + '" width="' + f(W * 0.32) + '" height="' + f(H * 0.5) + '" fill="' + col + '"/>';
      g += tower(cx - W * 0.2, W * 0.07, H * 0.26) + tower(cx + W * 0.13, W * 0.07, H * 0.3) + tower(cx - W * 0.035, W * 0.07, H * 0.38);
      g += '<path d="M' + f(cx - W * 0.03) + " " + f(by + H * 0.3) + " v" + f(-H * 0.12) + " a" + f(W * 0.03) + " " + f(W * 0.03) + " 0 0 1 " + f(W * 0.06) + " 0 v" + f(H * 0.12) + 'Z" fill="#2a1a30"/>';
      g += ridge(r, W, H, H * 0.88, H * 0.04, mix("#2f6a3f", "#04100a", T.dark), 0.05);
      return g;
    },
    space(r, W, H, T, K) {
      let g = '<rect width="' + W + '" height="' + H + '" fill="#050616"/>';
      g += '<g>' + stars(r, W, H * 1.6, 90) + "</g>";
      const hue = Math.floor(r() * 360);
      g += '<circle cx="' + f(W * (0.62 + r() * 0.2)) + '" cy="' + f(H * 0.4) + '" r="' + f(H * 0.26) + '" fill="hsl(' + hue + ',65%,52%)"/>';
      g += '<circle cx="' + f(W * 0.7) + '" cy="' + f(H * 0.33) + '" r="' + f(H * 0.2) + '" fill="hsl(' + ((hue + 30) % 360) + ',70%,62%)" opacity="0.5"/>';
      g += '<ellipse cx="' + f(W * 0.7) + '" cy="' + f(H * 0.4) + '" rx="' + f(H * 0.45) + '" ry="' + f(H * 0.07) + '" fill="none" stroke="#fff" stroke-width="3" opacity="0.5" transform="rotate(-15 ' + f(W * 0.7) + " " + f(H * 0.4) + ')"/>';
      g += '<circle cx="' + f(W * 0.18) + '" cy="' + f(H * 0.7) + '" r="' + f(H * 0.07) + '" fill="#c9c3d8"/><circle cx="' + f(W * 0.16) + '" cy="' + f(H * 0.68) + '" r="' + f(H * 0.015) + '" fill="#a39cb8"/>';
      const rx = W * 0.35, ry = H * 0.62;
      g += '<g transform="rotate(-30 ' + f(rx) + " " + f(ry) + ')"><ellipse cx="' + f(rx) + '" cy="' + f(ry) + '" rx="' + f(W * 0.07) + '" ry="' + f(H * 0.028) + '" fill="#e8e6f2"/><circle cx="' + f(rx + W * 0.015) + '" cy="' + f(ry - H * 0.012) + '" r="' + f(H * 0.018) + '" fill="#7ad8ff"/><path d="M' + f(rx - W * 0.07) + " " + f(ry) + " l" + f(-W * 0.04) + " " + f(-H * 0.012) + " v" + f(H * 0.024) + 'Z" fill="#ffb04a"/></g>';
      return g;
    },
  };
  const NAMES = Object.keys(BIOMES);

  // pick a biome from the words of the story (place, text); null when nothing matches
  const WORDS = [
    ["desert", /desert|dune|sand|oasis|canyon|pyramid|camel|mesa|savann?ah/],
    ["snow", /snow|ice|icy|arctic|glacier|frozen|polar|winter|igloo|frost/],
    ["jungle", /jungle|rainforest|vine|tropic|monkey|parrot|waterfall|swamp|marsh|bayou/],
    ["sea", /sea\b|ocean|island|harbou?r|beach|ship|pirate|lighthouse|boat|reef|coast|shore|sail|bay\b|lake|river|bridge/],
    ["mountain", /mountain|peak|summit|cliff|cave|ridge|valley|hill|rocky|volcano|crystal/],
    ["castle", /castle|palace|tower|kingdom|dragon|knight|throne|fortress|royal|wizard/],
    ["space", /space|planet|galaxy|star ?ship|orbital|helios|rocket|moon|alien|orbit|asteroid|comet|robot|colony|lab\b/],
    ["city", /city|street|alley|rooftop|town|market|subway|neon|mansion|skyline|library|cafe|café|school/],
    ["forest", /forest|wood|tree|grove|trail|hollow|cabin|camp|mushroom|fox|owl/],
    ["meadow", /meadow|farm|garden|field|flower|barn|pond|village|orchard|bakery|park|picnic/],
  ];
  function detect(text) {
    const t = String(text || "").toLowerCase();
    let best = null, bestN = 0;
    for (const [name, re] of WORDS) { const m = t.match(new RegExp(re.source, "g")); if (m && m.length > bestN) { best = name; bestN = m.length; } }
    return best;
  }
  // which biomes suit a genre when the story names no place
  const BY_GENRE = {
    adventure: ["forest", "mountain", "sea", "snow", "jungle", "desert"],
    fantasy: ["castle", "forest", "mountain", "meadow", "sea"], fairy: ["castle", "meadow", "forest"], magic: ["castle", "forest", "meadow", "mountain"],
    scifi: ["space", "city", "snow", "desert"], space: ["space"], dystopian: ["city", "desert", "snow"],
    mystery: ["city", "forest", "sea"], thriller: ["city", "mountain", "sea"], horror: ["forest", "castle", "city"], spooky: ["forest", "castle", "meadow"],
    humor: ["meadow", "city", "sea", "forest"], silly: ["meadow", "sea", "forest", "city"], comedy: ["meadow", "city", "sea"],
    animals: ["forest", "meadow", "jungle", "sea", "snow"], kindness: ["meadow", "forest", "sea", "city"], bedtime: ["meadow", "forest", "sea", "snow"],
    historical: ["city", "castle", "desert", "sea"], drama: ["city", "sea", "mountain", "meadow"], superhero: ["city"], hero: ["city", "mountain"],
    romance: ["sea", "meadow", "city", "forest"], romance2: ["sea", "city", "meadow"],
  };
  function pick(genre, text, seed) {
    const d = detect(text); if (d) return d;
    const list = BY_GENRE[genre] || NAMES;
    return list[Math.abs(seed | 0) % list.length];
  }
  // mood decides the time of day
  function timeFor(genre, tier, seed) {
    const r = rng(seed ^ 0x9e3779b9)();
    if (/horror|thriller|mystery|psych|dark|dystop/.test(genre || "") || tier === "adult") return r < 0.8 ? "night" : "dusk";
    if (tier === "teens") return r < 0.4 ? "dusk" : r < 0.7 ? "night" : "day";
    if (/bedtime|sleep/.test(genre || "") || tier === "tiny") return r < 0.5 ? "night" : "dusk";
    return r < 0.45 ? "day" : r < 0.75 ? "dawn" : "dusk";
  }
  // the whole picture as an SVG string
  function svg(biome, W, H, seed, time, id) {
    biome = BIOMES[biome] ? biome : "meadow";
    const T = TIMES[time] || TIMES.day, r = rng(seed ^ 0x51ed270b), gid = "bg" + (id || ((seed >>> 0) % 99999));
    let g = "";
    if (biome !== "space") {
      g += '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + T.top + '"/><stop offset="1" stop-color="' + T.bot + '"/></linearGradient></defs><rect width="' + W + '" height="' + H + '" fill="url(#' + gid + ')"/>';
      if (time === "night") g += stars(r, W, H, 60);
    }
    g += BIOMES[biome](r, W, H, T, {});
    return g;
  }
  return { svg, pick, detect, timeFor, names: NAMES, BIOMES };
});
