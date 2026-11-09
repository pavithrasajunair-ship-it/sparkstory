/* StorySpark cinema: 3D tilt on genre cards, loading screen and reveal transitions (no data leaves the browser) */
(function () {
  'use strict';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce) document.documentElement.classList.add('ss-motion');
  var $ = function (s) { return document.querySelector(s); };

  /* 3D tilt: cards lean towards the pointer */
  function tilt() {
    var grid = $('#genre-grid'); if (!grid || reduce) return;
    grid.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      var t = e.target.closest && e.target.closest('.ss-tile'); if (!t) return;
      var r = t.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      t.style.setProperty('--ry', ((x - .5) * 14).toFixed(1) + 'deg'); t.style.setProperty('--rx', ((.5 - y) * 12).toFixed(1) + 'deg');
      t.style.setProperty('--gx', (x * 100).toFixed(0) + '%'); t.style.setProperty('--gy', (y * 100).toFixed(0) + '%');
    });
    grid.addEventListener('pointerout', function (e) {
      var t = e.target.closest && e.target.closest('.ss-tile'); if (!t) return;
      t.style.removeProperty('--rx'); t.style.removeProperty('--ry');
    });
  }

  /* loading screen while the story is made */
  var LINES = {
    romance: ['Setting the mood…', 'Finding the right words…', 'Letting two hearts meet…'],
    darkromance: ['Lighting the candles…', 'Drawing the curtains…', 'Letting the shadows lean in…'],
    horror: ['Switching off the lights…', 'Gathering the fog…', 'Listening for footsteps…'],
    fantasy: ['Waking the old magic…', 'Opening the hidden door…', 'Following the lantern light…'],
    mystery: ['Following the rain…', 'Dusting for clues…', 'Reading between the lines…'],
    thriller: ['Tracing the signal…', 'Counting the seconds…', 'Closing in…'],
    adventure: ['Unfolding the map…', 'Packing for the journey…', 'Climbing towards the horizon…'],
    _: ['Choosing the first line…', 'Bringing your characters to life…', 'Turning the page…']
  };
  var box, t0 = 0, timer = 0, safety = 0, lineT = 0;
  function build() {
    if (box) return;
    box = document.createElement('div'); box.id = 'ss-load'; box.setAttribute('role', 'status'); box.setAttribute('aria-live', 'polite');
    box.innerHTML = '<div class="ss-ld-title">Writing your story</div><div class="ss-ld-line"></div><div class="ss-ld-bar"><i></i></div>';
    document.body.appendChild(box);
  }
  function genreKey() { var s = window.SSScene && SSScene._state; return (s && s.key) || '_'; }
  function show() {
    build(); var lines = LINES[genreKey()] || LINES._, i = 0, ln = box.querySelector('.ss-ld-line');
    ln.textContent = lines[0]; clearInterval(lineT); lineT = setInterval(function () { i = (i + 1) % lines.length; ln.textContent = lines[i]; }, 900);
    box.classList.add('on'); t0 = Date.now();
    clearTimeout(safety); safety = setTimeout(hide, 25000);     // never trap the reader
    clearInterval(timer); timer = setInterval(function () {
      var st = $('#s-story');
      if (st && !st.hidden && Date.now() - t0 >= (reduce ? 250 : 1500)) hide();
    }, 120);
  }
  function hide() { clearInterval(timer); clearInterval(lineT); clearTimeout(safety); if (box) box.classList.remove('on'); }
  function init() {
    tilt();
    var make = $('#make'); if (make) make.addEventListener('click', show, true);
    var again = $('#t-again'), ep = $('#t-episode'); [again, ep].forEach(function (b) { if (b) b.addEventListener('click', show, true); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
