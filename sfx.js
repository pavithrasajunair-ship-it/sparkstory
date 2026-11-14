/* StorySpark sound effects for the little-kid tiers (tiny + kids). Everything is synthesized with the Web Audio API, no files needed.
   - friendly UI sounds on taps and when a story is ready
   - story sound effects (roar, splash, knock, bell, giggle...) matched from words in each paragraph, played while "Listen" reads
   - tap any paragraph to hear its sounds again; one button turns all effects on or off */
(function () {
  "use strict";
  var KEY = "storyspark:sfx";
  var ac = null, master = null, on = true, noiseBuf = null, lastCue = 0;
  function tier() { return document.documentElement.getAttribute("data-tier") || ""; }
  function kid() { var t = tier(); return t === "tiny" || t === "kids"; }
  function any() { return !!tier(); }
  try { on = localStorage.getItem(KEY) !== "off"; } catch (e) {}
  function ensure() {
    if (ac) { if (ac.state === "suspended") ac.resume(); return true; }
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    try { ac = new AC(); master = ac.createGain(); master.gain.value = 0.5; var comp = ac.createDynamicsCompressor(); master.connect(comp); comp.connect(ac.destination); } catch (e) { ac = null; return false; }
    return true;
  }
  function noise() {
    if (!noiseBuf) { noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate); var d = noiseBuf.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    var s = ac.createBufferSource(); s.buffer = noiseBuf; return s;
  }
  function tone(type, f0, f1, t0, dur, vol, tail) {
    var o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t0);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + Math.min(0.02, dur / 3)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + (tail || 0.05));
    o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + (tail || 0.05) + 0.05); return g;
  }
  function burst(t0, dur, vol, filt, f0, f1, q) {
    var n = noise(), f = ac.createBiquadFilter(), g = ac.createGain(); f.type = filt; f.frequency.setValueAtTime(f0, t0); if (f1) f.frequency.exponentialRampToValueAtTime(f1, t0 + dur); if (q) f.Q.value = q;
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + Math.min(0.05, dur / 3)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    n.connect(f); f.connect(g); g.connect(master); n.start(t0); n.stop(t0 + dur + 0.05);
  }
  var FX = {
    tap: function (t) { tone("sine", 520, 780, t, 0.09, 0.22); },
    pop: function (t) { tone("sine", 400, 1000, t, 0.1, 0.3); },
    back: function (t) { tone("sine", 700, 420, t, 0.1, 0.2); },
    sparkle: function (t) { [880, 1108, 1318, 1760, 2093].forEach(function (f, i) { tone("sine", f, f, t + i * 0.07, 0.18, 0.16, 0.2); }); },
    ready: function (t) { [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) { tone("triangle", f, f, t + i * 0.12, 0.32, 0.22, 0.3); }); },
    whoosh: function (t) { burst(t, 0.7, 0.35, "bandpass", 300, 2600, 0.9); },
    magic: function (t) { FX.sparkle(t); burst(t, 0.6, 0.18, "bandpass", 500, 3000, 1.2); },
    splash: function (t) { burst(t, 0.55, 0.4, "lowpass", 3500, 500); tone("sine", 500, 900, t + 0.1, 0.12, 0.18); tone("sine", 420, 760, t + 0.22, 0.1, 0.14); },
    knock: function (t) { [0, 0.22, 0.44].forEach(function (d) { tone("sine", 170, 90, t + d, 0.09, 0.6); burst(t + d, 0.05, 0.2, "lowpass", 900); }); },
    steps: function (t) { for (var i = 0; i < 5; i++) burst(t + i * 0.26, 0.09, 0.3, "lowpass", 500 + (i % 2) * 120); },
    roar: function (t) { var g = tone("sawtooth", 110, 55, t, 0.9, 0.34, 0.2); var f = ac.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 650; burst(t, 0.9, 0.22, "lowpass", 700, 200); },
    thunder: function (t) { burst(t, 1.4, 0.55, "lowpass", 380, 60); tone("sine", 60, 38, t, 1.3, 0.5, 0.2); },
    boom: function (t) { tone("sine", 140, 40, t, 0.5, 0.7, 0.1); burst(t, 0.3, 0.3, "lowpass", 600, 80); },
    bell: function (t) { [[880, 0.3], [1760, 0.12], [2640, 0.06]].forEach(function (p) { tone("sine", p[0], p[0], t, 1.4, p[1], 0.8); }); },
    giggle: function (t) { [700, 900, 760, 980, 820].forEach(function (f, i) { tone("sine", f, f * 1.12, t + i * 0.09, 0.07, 0.22); }); },
    cheer: function (t) { tone("triangle", 300, 900, t, 0.5, 0.25, 0.15); FX.sparkle(t + 0.35); },
    bird: function (t) { for (var i = 0; i < 3; i++) { tone("sine", 2300, 3300, t + i * 0.16, 0.07, 0.16); tone("sine", 3300, 2500, t + i * 0.16 + 0.07, 0.06, 0.12); } },
    owl: function (t) { tone("sine", 360, 300, t, 0.35, 0.3, 0.2); tone("sine", 360, 290, t + 0.55, 0.45, 0.3, 0.25); },
    meow: function (t) { var o = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain(); o.type = "sawtooth"; o.frequency.setValueAtTime(420, t); o.frequency.linearRampToValueAtTime(620, t + 0.2); o.frequency.linearRampToValueAtTime(380, t + 0.55);
      f.type = "bandpass"; f.Q.value = 3; f.frequency.setValueAtTime(700, t); f.frequency.linearRampToValueAtTime(1500, t + 0.25); f.frequency.linearRampToValueAtTime(800, t + 0.55);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.3, t + 0.06); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6); o.connect(f); f.connect(g); g.connect(master); o.start(t); o.stop(t + 0.7); },
    woof: function (t) { [0, 0.28].forEach(function (d) { tone("square", 240, 130, t + d, 0.13, 0.22); }); },
    wind: function (t) { burst(t, 1.6, 0.28, "bandpass", 300, 900, 0.8); },
    creak: function (t) { tone("sawtooth", 140, 260, t, 0.7, 0.14, 0.1); },
    snore: function (t) { burst(t, 0.9, 0.18, "lowpass", 300, 150); },
    heartbeat: function (t) { [0, 0.18, 0.9, 1.08].forEach(function (d, i) { tone("sine", 70, 45, t + d, 0.14, i % 2 ? 0.45 : 0.7, 0.05); }); },
    gunshot: function (t) { burst(t, 0.35, 0.8, "lowpass", 5000, 200); tone("sine", 120, 40, t, 0.25, 0.6, 0.1); },
    phone: function (t) { [0, 0.25, 0.7, 0.95].forEach(function (d) { tone("square", 1400, 1400, t + d, 0.1, 0.12); tone("square", 1100, 1100, t + d, 0.1, 0.1); }); },
    glass: function (t) { burst(t, 0.5, 0.35, "highpass", 4000, 6000); [3200, 4100, 5200].forEach(function (f, i) { tone("sine", f, f * 0.98, t + i * 0.05, 0.4, 0.1, 0.3); }); },
    tick: function (t) { for (var i = 0; i < 4; i++) tone("square", 1800, 1500, t + i * 0.5, 0.03, 0.12); },
    sting: function (t) { tone("sawtooth", 220, 233, t, 1.1, 0.16, 0.3); tone("sawtooth", 233, 247, t, 1.1, 0.12, 0.3); },
    twinkle: function (t) { [1568, 1976, 2349].forEach(function (f, i) { tone("sine", f, f, t + i * 0.1, 0.35, 0.12, 0.4); }); }
  };
  /* word -> effect. First matches win; at most 2 per paragraph so it never gets noisy. */
  var CUES = [
    [/\b(heart(?:beat)?|pulse|pounding|trembl\w*|shiver\w*|terrif\w*|afraid|dread)\b/i, "heartbeat"],
    [/\b(gun\w*|shot|fired|bullet|scream\w*|shriek\w*)\b/i, "gunshot"],
    [/\b(phone|rang|ringing|call came|text message|buzz\w*)\b/i, "phone"],
    [/\b(glass|shatter\w*|window broke|smash\w*)\b/i, "glass"],
    [/\b(clock|ticking|midnight|countdown|deadline)\b/i, "tick"],
    [/\b(suddenly|stranger|shadow\w*|vanish\w*|disappear\w*|missing|body|murder\w*|blood|dark\w*)\b/i, "sting"],
    [/\b(roar\w*|growl\w*|dragon|monster|lion|bear)\b/i, "roar"],
    [/\b(thunder|lightning|storm)\b/i, "thunder"],
    [/\b(boom\w*|bang\w*|crash\w*|rumbl\w*|explod\w*)\b/i, "boom"],
    [/\b(splash\w*|puddle\w*|dived?|swam|swim\w*|ocean|river|lake|sea|waves?|waterfall)\b/i, "splash"],
    [/\b(knock\w*|tap(?:ped)? on|door)\b/i, "knock"],
    [/\b(footsteps?|tiptoe\w*|crept|marched|walked|ran|hurried)\b/i, "steps"],
    [/\b(bell|ding|chim\w+)\b/i, "bell"],
    [/\b(laugh\w*|giggl\w*|chuckl\w*|funny|tickl\w*)\b/i, "giggle"],
    [/\b(cheer\w*|hooray|yay|celebrat\w*|party|hug\w*|surpris\w*|won)\b/i, "cheer"],
    [/\b(magic\w*|spell|sparkl\w*|wand|fairy|glow\w*|shimmer\w*|enchant\w*|wish\w*)\b/i, "magic"],
    [/\b(star|stars|twinkl\w*|moon\w*)\b/i, "twinkle"],
    [/\b(bird\w*|sing\w*|chirp\w*|tweet\w*|sparrow|robin)\b/i, "bird"],
    [/\b(owl|hoot\w*)\b/i, "owl"],
    [/\b(cat|kitten|meow\w*)\b/i, "meow"],
    [/\b(dog|puppy|woof|bark\w*)\b/i, "woof"],
    [/\b(wind\w*|breez\w*|whistl\w*|fly|flew|flying|soar\w*)\b/i, "whoosh"],
    [/\b(creak\w*|squeak\w*|haunted|attic)\b/i, "creak"],
    [/\b(snor\w*|asleep|sleepy|yawn\w*|lullaby)\b/i, "snore"]
  ];
  function cuesFor(text) {
    var out = [], seen = {};
    for (var i = 0; i < CUES.length && out.length < 2; i++) { if (CUES[i][0].test(text) && !seen[CUES[i][1]]) { seen[CUES[i][1]] = 1; out.push(CUES[i][1]); } }
    return out;
  }
  function play(name, delay) {
    if (!on || !any() || !FX[name] || !ensure()) return false;
    try { FX[name](ac.currentTime + (delay || 0.02)); } catch (e) {} return true;
  }
  function cue(text) {
    var list = cuesFor(text || ""); list.forEach(function (n, i) { play(n, 0.05 + i * 1.1); }); return list;
  }
  function setOn(v) {
    on = !!v; try { localStorage.setItem(KEY, on ? "on" : "off"); } catch (e) {}
    var b = document.getElementById("t-sfx"); if (b) { b.textContent = on ? "🔔 Sound effects: On" : "🔕 Sound effects: Off"; b.setAttribute("aria-pressed", on ? "true" : "false"); }
    if (on) play("pop");
  }
  document.addEventListener("DOMContentLoaded", function () {
    var b = document.getElementById("t-sfx"); if (b) { setOn(on); b.addEventListener("click", function () { setOn(!on); }); if (!on) b.textContent = "🔕 Sound effects: Off"; }
    /* friendly UI sounds */
    document.addEventListener("click", function (e) {
      if (!kid() || !on) return; var el = e.target.closest && e.target.closest("button,.tile,.chip,.steps li,.back,summary"); if (!el || el.id === "t-sfx") return;
      var now = Date.now(); if (now - lastCue < 120) return; lastCue = now;
      if (el.id === "make" || el.id === "surprise") play("sparkle");
      else if (el.classList.contains("back")) play("back");
      else if (el.id === "t-listen") play("pop");
      else if (el.classList.contains("tile") || el.classList.contains("chip")) play("pop");
      else play("tap");
    }, true);
    /* tap a paragraph to hear its sounds */
    var body = document.getElementById("story-body");
    if (body) body.addEventListener("click", function (e) { var p = e.target.closest && e.target.closest("p"); if (!p || !any()) return; if (!cue(p.textContent).length) play("tap"); });
  });
  window.SFX = { cue: cue, play: play, cuesFor: cuesFor, get on() { return on; }, setOn: setOn, names: Object.keys(FX) };
})();
