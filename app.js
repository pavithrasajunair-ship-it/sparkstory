(function () {
  "use strict";
  const D = window.SSData, E = window.SSEngine;
  const $ = (id) => document.getElementById(id);
  const SCREENS = ["age", "genre", "chars", "length", "loading", "story", "lib"];
  const COPY = {
    tiny:  { genre: "What story shall we have?", chars: "Who is in the story?", charsLead: "Type the names. The first one is the star of the story!", length: "How long?", roles: { friend: "Friend", pet: "Pet or toy", helper: "Helper", villain: "Grumpy one" } },
    kids:  { genre: "Pick your story type", chars: "Who is in your story?", charsLead: "Add your characters. The first one is the hero.", length: "How long should it be?", roles: { friend: "Friend", pet: "Pet", helper: "Helper", villain: "Troublemaker" } },
    teens: { genre: "What are you in the mood for?", chars: "Who's in it?", charsLead: "Add names. The first one is the main character.", length: "How long?", roles: { friend: "Friend", pet: "Pet", helper: "Ally", villain: "Villain or rival" } },
    adult: { genre: "Choose your genre", chars: "Your characters", charsLead: "Name them. The first one carries the story.", length: "Length", roles: { friend: "Companion", pet: "Animal", helper: "Ally", villain: "Antagonist" } },
  };
  const DECO = {
    tiny: ["⭐", "🌙", "☁️", "🎈", "🦋", "🧸"], kids: ["🚀", "🌈", "⚡", "🧩", "🎨", "🪁"],
    teens: ["✨", "🎧", "🔥", "💫", "🎮", "⚡"], adult: ["✦", "·", "✧", "❖", "·"],
    "": ["✨", "📖", "⭐", "🌙", "🦄", "🪄"],
  };
  const SAVE_KEY = "storyspark:lib";
  const FONT_KEY = "storyspark:font";
  const CAST_KEY = "storyspark:cast";

  const state = { tier: "", genre: "", chars: [{ name: "", role: "hero" }], place: "", item: "", length: "medium", ai: false, story: null, aiMade: false, bed: false, shared: false };

  // ---------- storage (always wrapped) ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
  };

  // ---------- screens ----------
  function show(name) {
    SCREENS.forEach((s) => { const el = $("s-" + s); if (el) el.hidden = s !== name; });
    const stepNo = { genre: 1, chars: 2, length: 3 }[name];
    $("steps").hidden = !stepNo;
    if (stepNo) $("steps").querySelectorAll("li").forEach((li) => { const n = +li.dataset.step; li.className = n === stepNo ? "on" : n < stepNo ? "done" : ""; });
    document.body.classList.toggle("reading", name === "story");
    window.scrollTo(0, 0);
    const h = document.querySelector("#s-" + name + " h1");
    if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
  }
  function setTier(t) {
    state.tier = t;
    document.documentElement.setAttribute("data-tier", t);
    const meta = document.querySelector('meta[name=theme-color]');
    if (meta) meta.setAttribute("content", { tiny: "#ffdff0", kids: "#dff3ff", teens: "#120a2a", adult: "#0a0a0c" }[t] || "#7c3aed");
    deco(t);
  }
  function deco(t) {
    const box = $("deco"); box.textContent = "";
    const set = DECO[t] || DECO[""];
    const n = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 14;
    for (let i = 0; i < n; i++) {
      const s = document.createElement("span");
      s.textContent = set[i % set.length];
      s.style.left = Math.round((i / n) * 100 + Math.random() * 5) + "%";
      s.style.fontSize = (20 + Math.random() * 28) + "px";
      s.style.animationDuration = (14 + Math.random() * 16) + "s";
      s.style.animationDelay = (-Math.random() * 20) + "s";
      box.appendChild(s);
    }
  }

  // ---------- age ----------
  function buildAge() {
    const g = $("age-grid"); g.textContent = "";
    Object.values(D.TIERS).forEach((t) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "tile"; b.dataset.tier = t.id;
      b.innerHTML = '<span class="big"></span><b></b><small></small>';
      b.querySelector(".big").textContent = t.emoji;
      b.querySelector("b").textContent = t.name + " (" + t.range + ")";
      b.querySelector("small").textContent = t.blurb;
      b.addEventListener("click", () => { setTier(t.id); buildGenres(); show("genre"); });
      g.appendChild(b);
    });
  }

  // ---------- genre ----------
  function buildGenres() {
    $("h-genre").textContent = COPY[state.tier].genre;
    const g = $("genre-grid"); g.textContent = "";
    E.genresFor(state.tier).forEach((x) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "tile"; b.dataset.genre = x.id;
      b.innerHTML = '<span class="big"></span><b></b>';
      b.querySelector(".big").textContent = x.emoji;
      b.querySelector("b").textContent = x.name;
      b.addEventListener("click", () => { state.genre = x.id; buildChars(); show("chars"); });
      g.appendChild(b);
    });
  }

  // ---------- my cast (saved characters) ----------
  const cast = () => store.get(CAST_KEY, []).filter((c) => c && typeof c.name === "string");
  function saveCast(name, role) {
    name = name.trim(); if (!name) return false;
    const all = cast().filter((c) => c.name.toLowerCase() !== name.toLowerCase());
    all.push({ name, role: role === "hero" ? "friend" : role });
    return store.set(CAST_KEY, all.slice(-24));
  }
  function renderCast() {
    const box = $("cast-box"), list = $("cast-list"); list.textContent = "";
    const all = cast(); box.hidden = !all.length;
    all.forEach((c) => {
      const w = document.createElement("span"); w.className = "castchip";
      const add = document.createElement("button"); add.type = "button"; add.textContent = "+ " + c.name; add.setAttribute("aria-label", "Add " + c.name + " to the story");
      add.addEventListener("click", () => addName(c.name, c.role));
      const del = document.createElement("button"); del.type = "button"; del.textContent = "✕"; del.setAttribute("aria-label", "Remove " + c.name + " from my cast");
      del.addEventListener("click", () => { store.set(CAST_KEY, cast().filter((x) => x.name !== c.name)); renderCast(); });
      w.append(add, del); list.appendChild(w);
    });
  }

  // ---------- characters ----------
  function roleOptions() {
    const r = COPY[state.tier].roles;
    return [["friend", r.friend], ["pet", r.pet], ["helper", r.helper], ["villain", r.villain]];
  }
  function buildChars() {
    const c = COPY[state.tier];
    $("h-chars").textContent = c.chars; $("chars-lead").textContent = c.charsLead;
    renderChars();
    const sg = $("suggest"); sg.textContent = "";
    D.SUGGEST[state.tier].forEach((n) => {
      const b = document.createElement("button"); b.type = "button"; b.className = "chip"; b.textContent = "+ " + n;
      b.addEventListener("click", () => addName(n)); sg.appendChild(b);
    });
    $("in-place").value = state.place; $("in-item").value = state.item;
    $("chars-error").hidden = true; renderCast();
  }
  function renderChars() {
    const list = $("char-list"); list.textContent = "";
    state.chars.forEach((ch, i) => {
      const row = document.createElement("div"); row.className = "char";
      const inp = document.createElement("input");
      inp.type = "text"; inp.maxLength = 24; inp.autocomplete = "off"; inp.value = ch.name;
      inp.placeholder = i === 0 ? "Main character's name" : "Character " + (i + 1);
      inp.setAttribute("aria-label", i === 0 ? "Main character name" : "Character " + (i + 1) + " name");
      inp.addEventListener("input", () => { ch.name = inp.value; });
      row.appendChild(inp);
      if (i === 0) {
        const f = document.createElement("div"); f.className = "rolefix"; f.textContent = "⭐ Main character"; row.appendChild(f);
      } else {
        const sel = document.createElement("select"); sel.setAttribute("aria-label", "Role of character " + (i + 1));
        roleOptions().forEach(([v, l]) => { const o = document.createElement("option"); o.value = v; o.textContent = l; if (ch.role === v) o.selected = true; sel.appendChild(o); });
        sel.addEventListener("change", () => { ch.role = sel.value; });
        row.appendChild(sel);
        const x = document.createElement("button"); x.type = "button"; x.className = "x"; x.textContent = "✕"; x.setAttribute("aria-label", "Remove character " + (i + 1));
        x.addEventListener("click", () => { state.chars.splice(i, 1); renderChars(); });
        row.appendChild(x);
      }
      const sv = document.createElement("button"); sv.type = "button"; sv.className = "save-c"; sv.textContent = "💾"; sv.title = "Save to my cast"; sv.setAttribute("aria-label", "Save " + (ch.name || "this character") + " to my cast");
      sv.addEventListener("click", () => { if (!ch.name.trim()) { inp.focus(); return; } saveCast(ch.name, ch.role); renderCast(); sv.textContent = "✅"; });
      if (i === 0) row.insertBefore(sv, row.children[2] || null); else row.insertBefore(sv, row.querySelector(".x"));
      list.appendChild(row);
    });
    $("add-char").hidden = state.chars.length >= 6;
  }
  function addName(n, role) {
    if (state.chars.some((c) => c.name.trim().toLowerCase() === n.toLowerCase())) return;
    const empty = state.chars.find((c) => !c.name.trim());
    if (empty) { empty.name = n; if (empty.role !== "hero" && role) empty.role = role; }
    else if (state.chars.length < 6) state.chars.push({ name: n, role: role || "friend" });
    renderChars();
  }
  function validateChars() {
    state.place = $("in-place").value.trim(); state.item = $("in-item").value.trim();
    state.chars = state.chars.filter((c, i) => i === 0 || c.name.trim());
    if (!state.chars[0].name.trim()) { const e = $("chars-error"); e.textContent = "Please type a name for the main character."; e.hidden = false; $("char-list").querySelector("input").focus(); return false; }
    $("chars-error").hidden = true; return true;
  }

  // ---------- length ----------
  function buildLength() {
    $("h-length").textContent = COPY[state.tier].length;
    const g = $("length-grid"); g.textContent = "";
    Object.entries(D.LENGTHS).forEach(([id, l]) => {
      const note = state.tier === "tiny" && id === "long" ? "A longer bedtime story" : l.note;
      const b = document.createElement("button");
      b.type = "button"; b.className = "tile"; b.dataset.length = id; b.setAttribute("role", "radio"); b.setAttribute("aria-checked", String(state.length === id));
      b.innerHTML = '<span class="big"></span><b></b><small></small>';
      b.querySelector(".big").textContent = l.emoji; b.querySelector("b").textContent = l.name; b.querySelector("small").textContent = note;
      b.addEventListener("click", () => { state.length = id; g.querySelectorAll(".tile").forEach((t) => t.setAttribute("aria-checked", String(t === b))); });
      g.appendChild(b);
    });
    $("ai-row").hidden = !state.ai;
    const bedOk = (state.tier === "tiny" || state.tier === "kids") && state.genre !== "spooky";
    $("bed-row").hidden = !bedOk;
    if (!bedOk) { state.bed = false; $("use-bed").checked = false; }
    $("bed-opts").hidden = !($("use-bed").checked && bedOk);
  }

  // ---------- making a story ----------
  const LOADING = { tiny: "Sprinkling story dust…", kids: "Writing your adventure…", teens: "Spinning your story…", adult: "Setting the scene…" };
  const params = (seed) => ({ tier: state.tier, genre: state.genre, length: state.length, chars: state.chars, place: state.place, item: state.item, seed, bedtime: state.bed ? { today: $("bed-today").value.trim() } : null });

  async function aiStory(extra) {
    const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), 55000);
    try {
      const res = await fetch("/api/story", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.assign(params(), extra || {})), signal: ctl.signal });
      if (!res.ok) throw new Error("status " + res.status);
      const j = await res.json();
      if (!j || !j.title || !Array.isArray(j.chapters) || !j.chapters.length) throw new Error("bad");
      return j;
    } finally { clearTimeout(timer); }
  }

  async function make(seedChange) {
    $("loading-text").textContent = LOADING[state.tier] || "Writing your story…";
    show("loading");
    const useAI = state.ai && $("use-ai").checked;
    let story = null, notice = "";
    if (useAI) {
      try {
        const j = await aiStory();
        story = { title: j.title, chapters: j.chapters, params: params(0), ctx: {}, text: "", ai: true };
        story.text = flatten(story);
      } catch (e) { notice = "Magic mode could not reach the story writer this time, so StorySpark's own story maker wrote this one."; }
    }
    if (!story) {
      await new Promise((r) => setTimeout(r, 700));
      story = E.generate(params(Math.floor(Math.random() * 2 ** 31)));
    }
    state.story = story; state.saved = false;
    renderStory(notice);
    show("story");
  }
  function flatten(s) { return [s.title].concat(s.chapters.map((c) => (c.title ? c.title + "\n\n" : "") + c.paragraphs.join("\n\n"))).join("\n\n"); }

  // ---------- reader ----------
  let fontStep = store.get(FONT_KEY, 0);
  function applyFont() { $("story-body").style.fontSize = "calc(var(--read) + " + fontStep * 2 + "px)"; }
  function renderStory(notice) {
    const s = state.story;
    $("story-title").textContent = s.title;
    const words = s.text.split(/\s+/).length;
    const g = D.GENRES[s.params.genre];
    $("story-meta").textContent = (g ? g.emoji + " " + g.name + " · " : "") + Math.max(1, Math.round(words / 150)) + " min read" + (s.episode ? " · Episode " + s.episode : "") + (s.params.bedtime ? " · 🌙 Bedtime" : "") + (s.ai ? " · written with AI ✨" : "");
    const n = $("story-notice"); n.textContent = notice || ""; n.hidden = !notice;
    const body = $("story-body"); body.textContent = "";
    s.chapters.forEach((c) => {
      if (c.title) { const h = document.createElement("h2"); h.textContent = c.title; body.appendChild(h); }
      c.paragraphs.forEach((p) => { const el = document.createElement("p"); el.textContent = p; body.appendChild(el); });
    });
    applyFont();
    $("t-save").textContent = state.saved ? "✅ Saved" : "💾 Save";
    $("story-status").textContent = "";
    $("shared-banner").hidden = !s.shared;
    document.querySelectorAll(".gen-only").forEach((el) => { el.hidden = !!s.shared; });
    const order = ["tiny", "kids", "teens", "adult"], ti = order.indexOf(s.params.tier);
    const canGrow = !s.shared && ti >= 0 && ti < order.length - 1;
    $("grow-row").hidden = !canGrow; $("grow").checked = false;
    if (canGrow) $("grow-text").textContent = "They've grown up: make the next episode for " + D.TIERS[order[ti + 1]].name + " (" + D.TIERS[order[ti + 1]].range + ")";
    $("t-episode").textContent = s.episode ? "📺 Episode " + (s.episode + 1) : "📺 Next episode";
    stopSpeak();
  }

  // listen
  let speaking = false;
  const canSpeak = "speechSynthesis" in window && typeof SpeechSynthesisUtterance === "function";
  function stopSpeak() { if (canSpeak) speechSynthesis.cancel(); speaking = false; $("t-listen").textContent = "🔊 Listen"; document.querySelectorAll(".speaking").forEach((p) => p.classList.remove("speaking")); }
  function speak() {
    if (!canSpeak) return;
    if (speaking) { stopSpeak(); return; }
    const paras = Array.from($("story-body").children);
    const items = [{ t: state.story.title, el: null }].concat(paras.map((el) => ({ t: el.textContent, el })));
    speaking = true; $("t-listen").textContent = "⏹ Stop";
    const rate = { tiny: 0.85, kids: 0.95, teens: 1, adult: 0.95 }[state.story.params.tier] || 1;
    items.forEach((it, i) => {
      const u = new SpeechSynthesisUtterance(it.t); u.rate = rate;
      u.onstart = () => { document.querySelectorAll(".speaking").forEach((p) => p.classList.remove("speaking")); if (it.el) it.el.classList.add("speaking"); };
      if (i === items.length - 1) u.onend = () => stopSpeak();
      speechSynthesis.speak(u);
    });
  }

  // library
  function lib() { return store.get(SAVE_KEY, []); }
  function updateCount() { const n = lib().length; const c = $("lib-count"); c.hidden = !n; c.textContent = n; }
  function saveStory() {
    const s = state.story; if (!s) return;
    const all = lib().filter((x) => x.id !== s.id);
    s.id = s.id || String(Date.now());
    all.unshift({ id: s.id, savedAt: Date.now(), story: { title: s.title, chapters: s.chapters, params: s.params, ctx: s.ctx, text: s.text, ai: !!s.ai, id: s.id, episode: s.episode || 0, seriesTitle: s.seriesTitle || "", seriesId: s.seriesId || "", shared: !!s.shared } });
    if (!store.set(SAVE_KEY, all.slice(0, 40))) { $("story-status").textContent = "This browser could not save the story. Use Copy to keep it."; return; }
    state.saved = true; $("t-save").textContent = "✅ Saved"; $("story-status").textContent = "Saved in this browser. Find it under My stories."; updateCount();
  }
  function showLib() {
    const all = lib(), ul = $("lib-list"); ul.textContent = "";
    $("lib-empty").hidden = all.length > 0;
    all.forEach((it) => {
      const li = document.createElement("li");
      const left = document.createElement("div");
      const b = document.createElement("b"); b.textContent = it.story.title;
      const sm = document.createElement("small"); const g = D.GENRES[it.story.params.genre];
      sm.textContent = (g ? g.name : "") + (it.story.episode ? " · Episode " + it.story.episode : "") + " · " + new Date(it.savedAt).toLocaleDateString();
      left.append(b, sm);
      const acts = document.createElement("div"); acts.className = "acts";
      const open = document.createElement("button"); open.type = "button"; open.className = "btn btn-soft"; open.textContent = "Read";
      open.addEventListener("click", () => { setTier(it.story.params.tier); state.genre = it.story.params.genre; state.length = it.story.params.length; state.chars = (it.story.params.chars || []).map((c) => ({ name: c.name, role: c.role })); if (!state.chars.length) state.chars = [{ name: "", role: "hero" }]; state.place = it.story.params.place || ""; state.item = it.story.params.item || ""; state.story = it.story; state.saved = true; renderStory(""); show("story"); });
      const del = document.createElement("button"); del.type = "button"; del.className = "btn btn-ghost"; del.textContent = "Delete"; del.setAttribute("aria-label", "Delete " + it.story.title);
      del.addEventListener("click", () => { store.set(SAVE_KEY, lib().filter((x) => x.id !== it.id)); updateCount(); showLib(); });
      acts.append(open, del); li.append(left, acts); ul.appendChild(li);
    });
    stopSpeak(); show("lib");
  }

  // ---------- sleep mode (audio only, screen dark) ----------
  let sleepOn = false, sleepTimer = null, wakeLock = null;
  function openSleep() {
    if (!canSpeak || !state.story) { $("story-status").textContent = "This browser has no built-in voice, so Sleep mode is not available here."; return; }
    stopSpeak();
    const mins = Number($("sleep-min").value) || 0;
    sleepOn = true; $("sleep").hidden = false; $("sleep-msg").textContent = "Close your eyes. Listen…";
    $("sleep-stop").focus();
    if (mins) sleepTimer = setTimeout(() => closeSleep(true), mins * 60000);
    try { if (navigator.wakeLock) navigator.wakeLock.request("screen").then((l) => { wakeLock = l; }).catch(() => {}); } catch (e) {}
    const items = [state.story.title].concat(Array.from($("story-body").children).map((el) => el.textContent));
    const rate = { tiny: 0.8, kids: 0.85, teens: 0.9, adult: 0.88 }[state.story.params.tier] || 0.85;
    const play = (i) => {
      if (!sleepOn) return;
      if (i >= items.length) { if (mins) setTimeout(() => play(1), 4000); else closeSleep(true); return; }
      const u = new SpeechSynthesisUtterance(items[i]); u.rate = rate; u.pitch = 0.95;
      u.onend = () => setTimeout(() => play(i + 1), 1200);
      u.onerror = () => { if (sleepOn) setTimeout(() => play(i + 1), 1200); };
      speechSynthesis.speak(u);
    };
    play(0);
  }
  function closeSleep(finished) {
    sleepOn = false; clearTimeout(sleepTimer); sleepTimer = null;
    if (canSpeak) speechSynthesis.cancel();
    try { if (wakeLock) { wakeLock.release(); wakeLock = null; } } catch (e) {}
    if (finished === true) { $("sleep-msg").textContent = "Sweet dreams 🌙"; $("sleep-stop").textContent = "Close"; return; }
    $("sleep").hidden = true; $("sleep-stop").textContent = "Stop";
  }

  // ---------- private share link (the story travels inside the link; no server) ----------
  const b64u = (bytes) => { let s = ""; for (let i = 0; i < bytes.length; i += 8192) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192)); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); };
  const unb64u = (t) => { const b = atob(t.replace(/-/g, "+").replace(/_/g, "/")); const a = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a; };
  async function encodeStory(st) {
    const o = { v: 1, t: st.title, k: st.params.tier, g: st.params.genre, c: st.chapters.map((c) => [c.title || "", c.paragraphs]) };
    const bytes = new TextEncoder().encode(JSON.stringify(o));
    if (typeof CompressionStream === "function") {
      const out = new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream("deflate-raw"))).arrayBuffer());
      return "z" + b64u(out);
    }
    return "p" + b64u(bytes);
  }
  async function decodeStory(code) {
    let bytes = unb64u(code.slice(1));
    if (code[0] === "z") bytes = new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).arrayBuffer());
    else if (code[0] !== "p") throw new Error("bad");
    if (bytes.length > 200000) throw new Error("big");
    const o = JSON.parse(new TextDecoder().decode(bytes));
    if (!o || o.v !== 1 || typeof o.t !== "string" || !D.TIERS[o.k] || !Array.isArray(o.c) || o.c.length < 1 || o.c.length > 12) throw new Error("shape");
    const str = (x, n) => String(x == null ? "" : x).slice(0, n);
    const chapters = o.c.map((c) => {
      if (!Array.isArray(c) || !Array.isArray(c[1]) || c[1].length > 40) throw new Error("shape");
      return { title: str(c[0], 120), paragraphs: c[1].map((p) => str(p, 3000)) };
    });
    const story = { title: str(o.t, 160), chapters, params: { tier: o.k, genre: D.GENRES[o.g] ? o.g : "adventure", length: "medium", chars: [], place: "", item: "", seed: 0 }, ctx: {}, shared: true };
    story.text = flatten(story);
    return story;
  }
  async function shareLink() {
    const st = state.story; if (!st) return;
    try {
      const url = location.origin + location.pathname + "#s=" + (await encodeStory(st));
      if (navigator.share) { try { await navigator.share({ title: st.title, url }); $("story-status").textContent = "Shared."; return; } catch (e) { if (e && e.name === "AbortError") return; } }
      await navigator.clipboard.writeText(url);
      $("story-status").textContent = url.length > 6000 ? "Link copied. It is long, so some chat apps may cut it. For long stories use PDF." : "Link copied. Anyone who has this link can read the story. Nothing is uploaded anywhere.";
    } catch (e) { $("story-status").textContent = "Could not make a link here. Use PDF or Copy instead."; }
  }
  async function openSharedFromHash() {
    const m = /^#s=([A-Za-z0-9_-]+)$/.exec(location.hash);
    if (!m) return;
    try {
      const st = await decodeStory(m[1]);
      setTier(st.params.tier); state.story = st; state.saved = false; renderStory(""); show("story");
    } catch (e) { history.replaceState(null, "", location.pathname); const n = document.createElement("p"); n.className = "notice"; n.textContent = "That shared link could not be opened. Ask for a new one."; $("s-age").prepend(n); }
  }

  // ---------- wiring ----------
  function init() {
    buildAge(); deco(""); updateCount();
    document.querySelectorAll("[data-back]").forEach((b) => b.addEventListener("click", () => {
      const to = b.dataset.back;
      if (to === "age") { setTier(""); show("age"); }
      else if (to === "genre") { buildGenres(); show("genre"); }
      else if (to === "chars") { buildChars(); show("chars"); }
    }));
    $("brand").addEventListener("click", () => { stopSpeak(); setTier(""); show("age"); });
    $("btn-lib").addEventListener("click", showLib);
    $("add-char").addEventListener("click", () => { if (state.chars.length < 6) { state.chars.push({ name: "", role: "friend" }); renderChars(); const ins = $("char-list").querySelectorAll("input"); ins[ins.length - 1].focus(); } });
    $("chars-next").addEventListener("click", () => { if (validateChars()) { buildLength(); show("length"); } });
    $("char-list").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); $("chars-next").click(); } });
    $("make").addEventListener("click", () => make());
    $("t-again").addEventListener("click", () => make());
    $("t-new").addEventListener("click", () => { stopSpeak(); state.chars = [{ name: "", role: "hero" }]; state.place = ""; state.item = ""; setTier(""); show("age"); });
    $("t-save").addEventListener("click", saveStory);
    $("t-copy").addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(state.story.text); $("story-status").textContent = "Copied. Paste it anywhere."; }
      catch (e) { $("story-status").textContent = "Copy did not work here. Select the text and copy it by hand."; }
    });
    $("t-bigger").addEventListener("click", () => { fontStep = Math.min(6, fontStep + 1); store.set(FONT_KEY, fontStep); applyFont(); });
    $("t-smaller").addEventListener("click", () => { fontStep = Math.max(-3, fontStep - 1); store.set(FONT_KEY, fontStep); applyFont(); });
    if (!canSpeak) $("t-listen").hidden = true; else $("t-listen").addEventListener("click", speak);
    $("t-continue").addEventListener("click", async () => {
      const s = state.story; if (!s) return;
      stopSpeak();
      if (s.ai) {
        $("story-status").textContent = "Writing the next chapter…";
        try {
          const j = await aiStory({ continueFrom: s.text.slice(-1800) });
          const n = s.chapters.length + 1;
          const ch = j.chapters.map((c, i) => ({ title: c.title || "Chapter " + (n + i), paragraphs: c.paragraphs }));
          state.story = Object.assign({}, s, { chapters: s.chapters.concat(ch) }); state.story.text = flatten(state.story);
          state.saved = false; renderStory(""); $("story-status").textContent = "Added a new chapter.";
          return;
        } catch (e) { $("story-status").textContent = "Could not reach the story writer. Try again in a moment."; return; }
      }
      state.story = E.continueStory(s); state.saved = false; renderStory("");
      const hs = $("story-body").querySelectorAll("h2"); if (hs.length) hs[hs.length - 1].scrollIntoView({ behavior: "smooth", block: "start" });
      $("story-status").textContent = "Added a new chapter.";
    });
    $("use-bed").addEventListener("change", () => { state.bed = $("use-bed").checked; $("bed-opts").hidden = !state.bed; });
    $("t-episode").addEventListener("click", () => {
      const s0 = state.story; if (!s0 || s0.shared) return;
      stopSpeak();
      const ep = E.nextEpisode(Object.assign({}, s0, { id: s0.id }), { grow: $("grow").checked });
      if (!ep.seriesId) ep.seriesId = s0.id || String(s0.params.seed);
      if (ep.params.tier !== state.tier) { setTier(ep.params.tier); state.tier = ep.params.tier; }
      state.genre = ep.params.genre; state.length = ep.params.length;
      state.story = ep; state.saved = false; renderStory("");
      $("story-status").textContent = "Episode " + ep.episode + " is ready. Save it to keep the series.";
    });
    $("t-pdf").addEventListener("click", () => { stopSpeak(); window.print(); });
    $("t-share").addEventListener("click", shareLink);
    $("make-own").addEventListener("click", () => { history.replaceState(null, "", location.pathname); state.shared = false; state.chars = [{ name: "", role: "hero" }]; setTier(""); show("age"); });
    $("t-sleep").addEventListener("click", openSleep);
    $("sleep-stop").addEventListener("click", closeSleep);
    openSharedFromHash();
    // is AI available?
    fetch("/api/story").then((r) => (r.ok ? r.json() : { ai: false })).then((j) => { state.ai = !!(j && j.ai); }).catch(() => {});
    window.__SS = { state, show };
  }
  init();
})();
