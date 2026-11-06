/* StorySpark extras: cover art, story quiz and ambient sounds. All on the device, all free. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./story-data.js"));
  else root.SSExtras = factory(root.SSData);
})(typeof self !== "undefined" ? self : this, function (D) {
  const hashStr = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  function rng(seed) {
    let a = (seed >>> 0) || 1;
    return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const bare = (s) => String(s).replace(/^(the|a|an)\s+/i, "").trim();

  // ---------- cover art (an SVG scene, different for every story) ----------
  function cover(story, doc) {
    doc = doc || document;
    const NS = "http://www.w3.org/2000/svg";
    const el = (n, a, kids) => { const e = doc.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); (kids || []).forEach((c) => e.appendChild(c)); return e; };
    const p = story.params || {};
    const g = D.GENRES[p.genre] || { emoji: "✨", name: "story" };
    const seed = (p.seed || 0) ^ hashStr(story.title + (p.genre || ""));
    const r = rng(seed);
    const hue = hashStr(p.genre || "x") % 360;
    const dark = p.tier === "teens" || p.tier === "adult" || /spooky|horror|thriller|psych|dark|dystop/.test(p.genre || "");
    const night = dark || p.tier === "tiny" && r() < 0.5;
    const top = night ? `hsl(${(hue + 230) % 360},55%,${p.tier === "adult" ? 10 : 16}%)` : `hsl(${hue},75%,78%)`;
    const bot = night ? `hsl(${(hue + 270) % 360},50%,${p.tier === "adult" ? 18 : 30}%)` : `hsl(${(hue + 40) % 360},85%,88%)`;
    const hillA = night ? `hsl(${hue},35%,12%)` : `hsl(${(hue + 120) % 360},45%,55%)`;
    const hillB = night ? `hsl(${hue},30%,8%)` : `hsl(${(hue + 150) % 360},40%,40%)`;
    const gid = "cg" + (seed % 100000);
    const svg = el("svg", { viewBox: "0 0 400 200", role: "img", "aria-label": "Cover picture for " + (story.title || "the story"), class: "cover-svg", preserveAspectRatio: "xMidYMid slice" });
    svg.appendChild(el("defs", {}, [el("linearGradient", { id: gid, x1: "0", y1: "0", x2: "0", y2: "1" }, [el("stop", { offset: "0", "stop-color": top }), el("stop", { offset: "1", "stop-color": bot })])]));
    svg.appendChild(el("rect", { width: "400", height: "200", fill: "url(#" + gid + ")" }));
    const stars = night ? 26 : 8;
    for (let i = 0; i < stars; i++) svg.appendChild(el("circle", { cx: (r() * 400).toFixed(1), cy: (r() * 110).toFixed(1), r: (0.6 + r() * 1.6).toFixed(1), fill: "#fff", opacity: (0.4 + r() * 0.6).toFixed(2) }));
    // sun or moon
    svg.appendChild(el("circle", { cx: (60 + r() * 280).toFixed(0), cy: (30 + r() * 30).toFixed(0), r: "17", fill: night ? "#fff6cf" : "#fff3b0", opacity: night ? "0.95" : "0.9" }));
    // clouds
    if (!night) for (let i = 0; i < 3; i++) { const x = r() * 340, y = 20 + r() * 60; svg.appendChild(el("ellipse", { cx: x.toFixed(0), cy: y.toFixed(0), rx: "30", ry: "9", fill: "#fff", opacity: "0.7" })); svg.appendChild(el("ellipse", { cx: (x + 16).toFixed(0), cy: (y - 7).toFixed(0), rx: "18", ry: "9", fill: "#fff", opacity: "0.7" })); }
    // hills
    const hill = (y0, amp, fill) => { let d = "M0 200 L0 " + y0; for (let x = 0; x <= 400; x += 50) d += " Q " + (x + 25) + " " + (y0 - amp * (0.4 + r())).toFixed(0) + " " + (x + 50) + " " + (y0 + (r() - 0.5) * 14).toFixed(0); return el("path", { d: d + " L400 200 Z", fill }); };
    svg.appendChild(hill(150, 30, hillA));
    svg.appendChild(hill(172, 22, hillB));
    // the hero of the cover: the genre emoji, big and centred
    const t = el("text", { x: "200", y: "126", "text-anchor": "middle", "font-size": "78" });
    t.textContent = g.emoji;
    svg.appendChild(t);
    return svg;
  }

  // ---------- quiz (questions built from the story's own characters, place and special thing) ----------
  const NAME_POOL = ["Aarav", "Neel", "Zoya", "Mira", "Kabir", "Anaya", "Rohan", "Isla", "Theo", "Naina", "Luca", "Sana", "Maya", "Leo", "Ira", "Dev"];
  const allOf = (key) => { const out = new Set(); Object.values(D.LEX).forEach((l) => (l[key] || []).forEach((x) => out.add(x))); return [...out]; };
  function pickN(list, n, avoid, r) {
    const pool = list.filter((x) => !avoid.includes(x)); const out = [];
    while (out.length < n && pool.length) out.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
    return out;
  }
  function quiz(story) {
    if (!story || story.ai || story.shared || !story.ctx || !story.ctx.H || !story.params || story.params.tier === "adult") return [];
    const c = story.ctx, text = (story.text || "").toLowerCase(), r = rng(hashStr(story.title || "q") ^ (story.params.seed || 0));
    const has = (s) => s && text.includes(String(s).toLowerCase());
    const mix = (right, wrong) => { const opts = [right].concat(wrong); for (let i = opts.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [opts[i], opts[j]] = [opts[j], opts[i]]; } return { options: opts, answer: opts.indexOf(right) }; };
    const typed = (story.params.chars || []).map((x) => x.name);
    const qs = [];
    qs.push(Object.assign({ q: "Who was the hero of this story?" }, mix(c.H, pickN(NAME_POOL, 3, [c.H, c.A, c.A2, c.V].concat(typed), r))));
    if (c.P && has(bare(c.P))) qs.push(Object.assign({ q: "Where did the story happen?" }, mix(c.P, pickN(allOf("P"), 3, [c.P], r))));
    if (c.I && has(bare(c.I))) qs.push(Object.assign({ q: "What special thing did everyone care about?" }, mix(c.I, pickN(allOf("I"), 3, [c.I], r))));
    if (c.A && has(c.A) && qs.length < 4) qs.push(Object.assign({ q: "Who helped " + c.H + " along the way?" }, mix(c.A, pickN(NAME_POOL.concat(allOf("A")), 3, [c.A, c.H, c.A2, c.V], r))));
    return qs.length >= 2 ? qs : [];
  }

  // ---------- ambient sounds (made with the Web Audio API, no files, no network) ----------
  const Ambience = (function () {
    let ac = null, master = null, stops = [], timer = null, current = "off";
    const KINDS = [["off", "Off"], ["rain", "🌧️ Rain"], ["ocean", "🌊 Ocean"], ["wind", "🍃 Soft wind"], ["lullaby", "🎵 Lullaby chimes"]];
    function ensure() {
      if (!ac) { const AC = typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext); if (!AC) return false; ac = new AC(); master = ac.createGain(); master.gain.value = 0.5; master.connect(ac.destination); }
      if (ac.state === "suspended" && ac.resume) ac.resume();
      return true;
    }
    function noise() {
      const len = ac.sampleRate * 2, buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
      let last = 0; for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5 + w * 0.15; }
      const s = ac.createBufferSource(); s.buffer = buf; s.loop = true; return s;
    }
    function lfo(freq, depth, target) { const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = freq; g.gain.value = depth; o.connect(g); g.connect(target); o.start(); stops.push(() => { try { o.stop(); } catch (e) {} }); }
    function stop() {
      stops.forEach((f) => f()); stops = []; if (timer) { clearInterval(timer); timer = null; }
      current = "off";
    }
    function play(kind) {
      stop();
      if (kind === "off" || !ensure()) return kind === "off";
      current = kind;
      const out = ac.createGain(); out.gain.value = 0; out.connect(master); out.gain.linearRampToValueAtTime(1, ac.currentTime + 1.5);
      stops.push(() => { try { out.disconnect(); } catch (e) {} });
      if (kind === "rain" || kind === "ocean" || kind === "wind") {
        const n = noise(), f = ac.createBiquadFilter(), g = ac.createGain();
        if (kind === "rain") { f.type = "highpass"; f.frequency.value = 900; g.gain.value = 0.16; }
        else if (kind === "ocean") { f.type = "lowpass"; f.frequency.value = 520; g.gain.value = 0.3; lfo(0.09, 0.22, g.gain); }
        else { f.type = "bandpass"; f.frequency.value = 420; f.Q.value = 0.7; g.gain.value = 0.28; lfo(0.07, 220, f.frequency); lfo(0.11, 0.1, g.gain); }
        n.connect(f); f.connect(g); g.connect(out); n.start(); stops.push(() => { try { n.stop(); } catch (e) {} });
      } else if (kind === "lullaby") {
        const scale = [261.63, 293.66, 329.63, 392, 440, 523.25];
        const note = () => {
          const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime;
          o.type = "sine"; o.frequency.value = scale[Math.floor(Math.random() * scale.length)];
          g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.18, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0008, t + 2.6);
          o.connect(g); g.connect(out); o.start(t); o.stop(t + 2.7);
        };
        note(); timer = setInterval(note, 1800);
      }
      return true;
    }
    return { KINDS, play, stop, get current() { return current; } };
  })();

  return { cover, quiz, Ambience, hashStr };
});
