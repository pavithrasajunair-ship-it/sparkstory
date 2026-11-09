/* StorySpark cinematic UI: 3D tilt on genre cards, immersive loading title card, letterbox reveal. */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };
  var fine = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 3D tilt */
  var grid = $('#genre-grid');
  if (grid && fine && !reduce) {
    grid.addEventListener('pointermove', function (e) {
      var t = e.target.closest && e.target.closest('.ss-tile'); if (!t) return;
      var r = t.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      t.classList.add('ss-tilt'); t.style.setProperty('--rx', ((py - .5) * -12).toFixed(2) + 'deg'); t.style.setProperty('--ry', ((px - .5) * 14).toFixed(2) + 'deg');
      t.style.setProperty('--gx', (px * 100).toFixed(0) + '%'); t.style.setProperty('--gy', (py * 100).toFixed(0) + '%');
    });
    grid.addEventListener('pointerout', function (e) {
      var t = e.target.closest && e.target.closest('.ss-tile'); if (!t || (e.relatedTarget && t.contains(e.relatedTarget))) return;
      t.classList.remove('ss-tilt'); t.style.setProperty('--rx', '0deg'); t.style.setProperty('--ry', '0deg');
    });
  }

  /* loading title card */
  var LINES = {
    darkromance: ['Lighting the candles…', 'Scattering the petals…', 'Pouring the wine…', 'Writing your forbidden chapter…'],
    horror: ['The fog rolls in…', 'Something stirs in the dark…', 'Do not look behind you…', 'Writing your nightmare…'],
    romance: ['The sun is setting…', 'Lights come on along the shore…', 'Two hearts, one story…', 'Writing your love story…'],
    fantasy: ['The aurora wakes…', 'Magic gathers in the trees…', 'The castle gates open…', 'Writing your legend…'],
    mystery: ['Rain on the empty street…', 'A light flickers in a window…', 'Following the clues…', 'Writing your mystery…'],
    thriller: ['The sirens fade…', 'Every shadow has a witness…', 'Time is running out…', 'Writing your thriller…'],
    adventure: ['The sun climbs the peaks…', 'The trail ahead is unmarked…', 'Packing for the journey…', 'Writing your adventure…'],
    scifi: ['Engines warming up…', 'Charting the stars…', 'Signal incoming…', 'Writing your voyage…'],
    humor: ['Warming up the jokes…', 'Counting the confetti…', 'Practising the punchline…', 'Writing your comedy…'],
    'default': ['Setting the scene…', 'Gathering your characters…', 'Turning the page…', 'Writing your story…']
  };
  var load = $('#s-loading'), timer = 0, idx = 0;
  function key() { var s = window.SSScene && SSScene._state; return (s && (s.locked || s.key)) || 'default'; }
  function ensureCard() {
    if (!load || load.querySelector('.ss-cine-load')) return;
    var d = document.createElement('div'); d.className = 'ss-cine-load'; d.setAttribute('aria-hidden', 'true');
    d.innerHTML = '<div class="ss-cl-sub">A StorySpark story</div><div class="ss-cl-line"></div><div class="ss-cl-bar"><i></i></div>'; load.appendChild(d);
  }
  function showLine() {
    var el = load && load.querySelector('.ss-cl-line'); if (!el) return; var L = LINES[key()] || LINES['default'];
    el.classList.add('out'); setTimeout(function () { el.textContent = L[idx++ % L.length]; el.classList.remove('out'); }, reduce ? 0 : 450);
  }
  function startLoad() { if (!document.documentElement.classList.contains('ss-scene-on')) return; ensureCard(); idx = 0; var el = load.querySelector('.ss-cl-line'); if (el) el.textContent = (LINES[key()] || LINES['default'])[idx++]; clearInterval(timer); timer = setInterval(showLine, 2600); }
  function stopLoad() { clearInterval(timer); }

  /* letterbox reveal when the story appears */
  function reveal() {
    if (reduce || !document.documentElement.classList.contains('ss-scene-on')) return;
    var old = $('.ss-lbx'); if (old) old.remove(); var b = document.createElement('div'); b.className = 'ss-lbx'; b.setAttribute('aria-hidden', 'true'); b.innerHTML = '<i></i><i></i>'; document.body.appendChild(b);
    setTimeout(function () { if (b.parentNode) b.remove(); }, 1900);
  }
  function watch(el, onShow, onHide) {
    if (!el) return; var was = !el.hidden;
    new MutationObserver(function () { var now = !el.hidden; if (now && !was) onShow(); if (!now && was && onHide) onHide(); was = now; }).observe(el, { attributes: true, attributeFilter: ['hidden'] });
  }
  watch(load, startLoad, stopLoad); watch($('#s-story'), reveal);
})();
