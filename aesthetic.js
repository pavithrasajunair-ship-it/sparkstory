/* StorySpark aesthetic pack. Adds genre artwork, readable stories, tidy actions and soft music.
   Works on top of the existing app: it only decorates what app.js draws. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var store = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  var rnd = function (n) { return Math.floor(Math.random() * n); };
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = rnd(i + 1), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  /* ---------------- artwork ---------------- */
  var SPRITE = '<svg class="ss-sprite" aria-hidden="true" focusable="false"><defs>' +
    '<linearGradient id="gA" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e0294a"/><stop offset="1" stop-color="#7a0f27"/></linearGradient>' +
    '<linearGradient id="gB" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f0405c"/><stop offset="1" stop-color="#8a1230"/></linearGradient>' +
    '<linearGradient id="gWine" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c2183a"/><stop offset="1" stop-color="#4a0a1c"/></linearGradient>' +
    '<linearGradient id="gGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6e3a8"/><stop offset="1" stop-color="#b8913f"/></linearGradient>' +
    '<linearGradient id="gSteel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f4f4f8"/><stop offset=".5" stop-color="#9aa0b4"/><stop offset="1" stop-color="#eceef4"/></linearGradient>' +
    '<linearGradient id="gStem" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f5a3d"/><stop offset="1" stop-color="#122015"/></linearGradient>' +
    '<radialGradient id="gMoon" cx=".4" cy=".4" r=".7"><stop offset="0" stop-color="#fffbe6"/><stop offset="1" stop-color="#e7d79a"/></radialGradient></defs>' +
    /* rose with stem and thorns */
    '<symbol id="ss-rose" viewBox="0 0 100 140"><path d="M50 78C47 96 54 114 49 138" stroke="url(#gStem)" stroke-width="3.2" fill="none" stroke-linecap="round"/>' +
    '<path d="M50 100C38 95 30 100 24 91C34 88 44 90 50 100Z" fill="#1f3b29"/><path d="M51 114C62 108 72 112 78 103C68 100 58 102 51 114Z" fill="#1f3b29"/>' +
    '<path d="M49 92l-7-3 6-5zM52 108l8-2-6-6z" fill="#1f3b29"/><g transform="translate(50 46)" stroke="#5a0a1a" stroke-width=".8">' +
    [0, 72, 144, 216, 288].map(function (a) { return '<ellipse cx="0" cy="-17" rx="17" ry="15" transform="rotate(' + a + ')" fill="url(#gA)"/>'; }).join('') +
    [36, 126, 216, 306].map(function (a) { return '<ellipse cx="0" cy="-9" rx="12" ry="10" transform="rotate(' + a + ')" fill="url(#gB)"/>'; }).join('') +
    '<circle r="8" fill="#9c1634"/><path d="M-3 0a3 3 0 1 1 3 3 5 5 0 1 1-5.500-5.500 7 7 0 1 1 7.500 7.500" fill="none" stroke="#4d0a1a" stroke-width="1.200" stroke-linecap="round"/>' +
    '<path d="M-22-10q4-14 16-18" stroke="rgba(255,255,255,.28)" stroke-width="2" fill="none" stroke-linecap="round"/></g></symbol>' +
    /* dagger */
    '<symbol id="ss-dagger" viewBox="0 0 40 150"><path d="M20 0 29 72 20 84 11 72Z" fill="url(#gSteel)" stroke="#6b7088" stroke-width=".8"/><path d="M20 8V76" stroke="rgba(0,0,0,.25)" stroke-width="1.500"/>' +
    '<path d="M3 86Q20 78 37 86Q37 92 30 92H10Q3 92 3 86Z" fill="url(#gGold)" stroke="#8a6a2a" stroke-width=".8"/><rect x="16.500" y="92" width="7" height="34" rx="3" fill="#3a0b16"/>' +
    '<path d="M16.500 98l7 3M16.500 106l7 3M16.500 114l7 3M16.500 122l7 3" stroke="#d4af6a" stroke-width="1.200"/><circle cx="20" cy="133" r="7" fill="url(#gGold)" stroke="#8a6a2a"/><circle cx="20" cy="133" r="2.600" fill="#a0132f"/></symbol>' +
    /* wine glass */
    '<symbol id="ss-wine" viewBox="0 0 70 140"><path d="M12 26Q23 20 35 26T58 26C57 50 47 60 35 60 23 60 13 50 12 26Z" fill="url(#gWine)"/>' +
    '<path d="M10 8H60C60 48 48 62 35 62 22 62 10 48 10 8Z" fill="rgba(255,255,255,.1)" stroke="rgba(255,255,255,.65)" stroke-width="1.600"/><path d="M17 14Q16 40 26 54" stroke="rgba(255,255,255,.55)" stroke-width="2.200" fill="none" stroke-linecap="round"/>' +
    '<rect x="33.500" y="62" width="3" height="54" fill="rgba(255,255,255,.7)"/><ellipse cx="35" cy="119" rx="20" ry="5" fill="rgba(255,255,255,.12)" stroke="rgba(255,255,255,.7)" stroke-width="1.600"/>' +
    '<path d="M58 26q3 8 1 14 -3-3-1-14Z" fill="#b3122e"/><circle cx="59.500" cy="46" r="2" fill="#b3122e"/></symbol>' +
    /* gilded dragon */
    '<symbol id="ss-dragon" viewBox="0 0 240 150"><g stroke="#d9b45f" stroke-width="1.600" stroke-linejoin="round">' +
    '<path d="M122 92 76 18Q92 34 100 38L98 6Q112 36 118 40L128 2Q134 38 138 46L158 14Q156 58 136 92Z" fill="rgba(217,180,95,.22)"/>' +
    '<path d="M124 90 78 20M124 90 98 8M126 90 128 4M130 90 158 16" fill="none" stroke-width="1"/>' +
    '<path d="M8 128C30 122 52 138 78 126 100 116 108 96 128 88 150 80 158 60 170 52 178 46 190 44 204 46L226 52C216 56 206 58 198 58 204 66 196 72 188 70 182 74 176 82 170 90 160 108 146 118 128 124 112 130 98 142 84 146 66 150 36 148 8 128Z" fill="#16060d"/>' +
    '<path d="M110 120 104 142 114 146 122 126ZM150 112 146 134 156 138 160 116Z" fill="#16060d"/>' +
    '<path d="M190 44 186 22 197 40ZM198 44 199 26 207 44Z" fill="#d9b45f"/>' +
    '<path d="M100 114l-3-9 9 5zM112 102l-3-9 9 5zM126 92l-3-9 9 5zM140 84l-3-9 9 5zM152 74l-3-9 9 5zM162 62l-3-9 9 5z" fill="#d9b45f" stroke="none"/></g>' +
    '<circle cx="201" cy="50" r="2.600" fill="#ffdf7a"/></symbol>' +
    /* other motifs */
    '<symbol id="ss-moon" viewBox="0 0 100 100"><circle cx="50" cy="50" r="34" fill="url(#gMoon)"/><circle cx="64" cy="40" r="6" fill="rgba(0,0,0,.08)"/><circle cx="38" cy="62" r="9" fill="rgba(0,0,0,.07)"/><circle cx="60" cy="68" r="4" fill="rgba(0,0,0,.08)"/></symbol>' +
    '<symbol id="ss-heart" viewBox="0 0 100 100"><path d="M50 88C20 66 8 48 8 33 8 19 20 11 32 11 40 11 47 15 50 23 53 15 60 11 68 11 80 11 92 19 92 33 92 48 80 66 50 88Z" fill="#fff"/></symbol>' +
    '<symbol id="ss-spark" viewBox="0 0 100 100"><path d="M50 4 58 42 96 50 58 58 50 96 42 58 4 50 42 42Z" fill="#fff"/></symbol>' +
    '<symbol id="ss-castle" viewBox="0 0 100 100"><path d="M10 92V42H22V30H28V42H40V22L50 6 60 22V42H72V30H78V42H90V92Z" fill="#fff"/><path d="M42 92V72Q50 62 58 72V92Z" fill="rgba(0,0,0,.35)"/></symbol>' +
    '<symbol id="ss-lens" viewBox="0 0 100 100"><circle cx="42" cy="42" r="26" fill="none" stroke="#fff" stroke-width="9"/><path d="M62 62 90 90" stroke="#fff" stroke-width="12" stroke-linecap="round"/></symbol>' +
    '<symbol id="ss-planet" viewBox="0 0 100 100"><circle cx="50" cy="50" r="24" fill="#fff"/><ellipse cx="50" cy="52" rx="46" ry="12" fill="none" stroke="#fff" stroke-width="5" transform="rotate(-18 50 52)"/></symbol>' +
    '<symbol id="ss-bat" viewBox="0 0 100 60"><path d="M50 20L58 30L68 18Q80 22 98 20Q86 30 88 46Q76 38 68 48Q60 40 50 56Q40 40 32 48Q24 38 12 46Q14 30 2 20Q20 22 32 18L42 30Z" fill="#0b1620"/></symbol></svg>';

  function u(id, x, y, w, h, extra) { return '<use href="#' + id + '" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '"' + (extra || '') + '/>'; }
  var ART = {
    darkromance: function () {
      var v = rnd(3);
      if (v === 0) return u('ss-dagger', 70, -4, 30, 112, ' transform="rotate(26 85 52)"') + u('ss-rose', 36, 8, 66, 92);
      if (v === 1) return u('ss-wine', 4, 20, 36, 72) + u('ss-rose', 40, 6, 70, 98);
      return u('ss-dragon', 16, 6, 90, 56) + u('ss-rose', 78, 42, 34, 50);
    },
    romance: function () { return u('ss-heart', 62, 4, 42, 42, ' opacity=".55"') + u('ss-heart', 84, 44, 26, 26, ' opacity=".4"') + u('ss-rose', 30, 22, 52, 74, ' opacity=".95"'); },
    horror: function () { return u('ss-moon', 52, -2, 66, 66) + u('ss-bat', 20, 14, 34, 20) + u('ss-bat', 78, 62, 28, 17); },
    fantasy: function () { return u('ss-castle', 54, 14, 62, 62) + u('ss-spark', 20, 12, 18, 18) + u('ss-spark', 100, 6, 12, 12) + u('ss-spark', 36, 56, 12, 12); },
    humor: function () { return u('ss-spark', 66, 8, 34, 34) + u('ss-spark', 100, 52, 20, 20) + u('ss-spark', 38, 46, 22, 22); },
    psych: function () { return u('ss-moon', 58, 6, 54, 54, ' opacity=".55"') + u('ss-spark', 24, 14, 16, 16) + u('ss-spark', 90, 62, 12, 12); },
    thriller: function () { return u('ss-lens', 60, 8, 54, 54) + u('ss-spark', 30, 16, 12, 12); },
    drama: function () { return u('ss-castle', 56, 16, 56, 56, ' opacity=".5"') + u('ss-spark', 28, 14, 14, 14); },
    mystery: function () { return u('ss-lens', 56, 10, 60, 60); },
    scifi: function () { return u('ss-planet', 58, 8, 60, 60) + u('ss-spark', 24, 16, 14, 14) + u('ss-spark', 40, 64, 10, 10); },
    bedtime: function () { return u('ss-moon', 60, 4, 52, 52) + u('ss-spark', 28, 14, 16, 16) + u('ss-spark', 96, 62, 14, 14) + u('ss-spark', 46, 56, 10, 10); },
    animals: function () { return u('ss-heart', 64, 14, 44, 44, ' opacity=".5"'); },
    friends: function () { return u('ss-heart', 60, 8, 44, 44, ' opacity=".6"') + u('ss-heart', 84, 46, 28, 28, ' opacity=".45"'); },
    hero: function () { return u('ss-spark', 62, 6, 52, 52); },
    adventure: function () { return u('ss-spark', 66, 10, 36, 36) + u('ss-castle', 40, 52, 30, 30, ' opacity=".5"'); }
  };
  function artSvg(key) { var f = ART[key]; return f ? '<svg viewBox="0 0 120 100" preserveAspectRatio="xMaxYMax meet" aria-hidden="true">' + f() + '</svg>' : ''; }

  /* ---------------- genre detection ---------------- */
  var MAP = [
    ['darkromance', /dark\s*romance|gothic|romantasy|forbidden/i], ['horror', /horror|scary|spooky|creepy|ghost|haunt/i], ['psych', /psycholog|mind|twist/i], ['thriller', /thriller|suspense|crime/i],
    ['humor', /humou?r|funny|silly|comed|laugh|joke/i], ['romance', /romance|romcom|love/i], ['fantasy', /fantasy|magic|fairy|dragon|wizard|myth/i],
    ['mystery', /mystery|detective|whodunit|clue/i], ['scifi', /sci-?fi|space|robot|future|dystop|alien|tech/i],
    ['bedtime', /bedtime|sleep|lullaby|cozy|calm|dream/i], ['animals', /animal|pet|forest|nature|farm/i], ['friends', /friend|kind|school|family|feel/i],
    ['hero', /hero|power|brave/i], ['adventure', /advent|quest|treasure|explor|journey/i], ['drama', /drama|histor|period|real/i]
  ];
  function keyOf(text) { for (var i = 0; i < MAP.length; i++) if (MAP[i][1].test(text)) return MAP[i][0]; return ''; }
  var state = { genre: '', names: [], extras: [] };

  /* ---------------- genre tiles ---------------- */
  var tileBusy = false, otherN = 0;
  function dressTiles() {
    var grid = $('#genre-grid'); if (!grid || tileBusy) return;
    var kids = $$(':scope > *', grid); if (!kids.length) return;
    if (kids.every(function (k) { return k.classList.contains('ss-tile'); }) && grid.getAttribute('data-ss') === String(kids.length)) return;
    tileBusy = true; otherN = rnd(4);
    kids.forEach(function (k) {
      if (!k.classList.contains('ss-tile')) {
        var key = keyOf(k.textContent || ''); k.classList.add('ss-tile'); k.setAttribute('data-art', key);
        k.classList.add('ss-g-' + (key || 'other' + (otherN++ % 4)));
        var a = document.createElement('div'); a.className = 'ss-art'; a.innerHTML = artSvg(key); k.insertBefore(a, k.firstChild);
        (function (kk, sk) { var f = function () { if (window.SSScene) SSScene.preview(sk || 'default'); }; kk.addEventListener('pointerenter', f); kk.addEventListener('focus', f); kk.addEventListener('touchstart', f, { passive: true }); })(k, key);
      }
    });
    shuffle(kids).forEach(function (k) { grid.appendChild(k); });          // new random order every time
    grid.setAttribute('data-ss', String(kids.length));
    tileBusy = false;
    var sg = $('#s-genre'); if (window.SSScene && sg && !sg.hidden) SSScene.preview('default');
  }
  function watchGenres() {
    var grid = $('#genre-grid'); if (!grid) return;
    new MutationObserver(function () { setTimeout(dressTiles, 0); }).observe(grid, { childList: true });
    grid.addEventListener('click', function (e) {
      var t = e.target.closest && e.target.closest('.ss-tile'); if (!t) return;
      state.genre = t.getAttribute('data-art') || ''; Music.play(state.genre); if (window.SSScene) SSScene.lock(state.genre || 'default');
    }, true);
    dressTiles();
  }

  /* ---------------- story reading aids ---------------- */
  function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function wrapNames(p, re) {
    var w = document.createTreeWalker(p, NodeFilter.SHOW_TEXT, null), nodes = [], n; while ((n = w.nextNode())) nodes.push(n);
    var done = {};
    nodes.forEach(function (t) {
      var m, txt = t.nodeValue, last = 0, frag = document.createDocumentFragment(), hit = false; re.lastIndex = 0;
      while ((m = re.exec(txt))) {
        if (done[m[0].toLowerCase()]) continue; done[m[0].toLowerCase()] = 1; hit = true;
        frag.appendChild(document.createTextNode(txt.slice(last, m.index)));
        var s = document.createElement('span'); s.className = 'ss-nm'; s.textContent = m[0]; frag.appendChild(s); last = m.index + m[0].length;
      }
      if (hit) { frag.appendChild(document.createTextNode(txt.slice(last))); t.parentNode.replaceChild(frag, t); }
    });
  }
  function sentence(t) { var m = t.match(/^(.+?[.!?…]["”’']?)(\s|$)/); return m ? m[1] : ''; }
  function enhanceStory() {
    var body = $('#story-body'); if (!body) return;
    var ps = $$('p', body); if (!ps.length) return;
    var names = state.names.concat(state.extras).filter(Boolean), re = null;
    if (names.length) { try { re = new RegExp('(?:^|(?<![\\p{L}\\p{N}]))(' + names.sort(function (a, b) { return b.length - a.length; }).map(esc).join('|') + ')(?![\\p{L}\\p{N}])', 'gu'); } catch (e) { re = null; } }
    ps.forEach(function (p) {
      if (p.getAttribute('data-ss')) return; p.setAttribute('data-ss', '1');
      var simple = $$('*', p).length === 0 && p.firstChild && p.firstChild.nodeType === 3;
      if (!simple) return;
      var t = p.firstChild.nodeValue, s = sentence(t.trim());
      if (s && t.trim().length > s.length + 20) {
        var i = t.indexOf(s), st = document.createElement('strong'); st.className = 'ss-lead'; st.textContent = s;
        var rest = document.createTextNode(t.slice(i + s.length)); p.replaceChild(rest, p.firstChild); p.insertBefore(st, rest);
      }
      if (re) wrapNames(p, re);
    });
    glance(body, ps);
    var key = state.genre || keyOf(($('#story-meta') || {}).textContent || '');
    var s = $('#s-story'); if (s) { s.className = s.className.replace(/\bss-theme-\S+/g, '').trim(); if (key) s.classList.add('ss-theme-' + key); }
    banner(key);
  }
  function glance(body, ps) {
    var old = $('.ss-glance'); if (old) old.remove();
    var text = body.textContent || '', words = text.trim().split(/\s+/).length, mins = Math.max(1, Math.round(words / 200));
    var box = document.createElement('div'); box.className = 'ss-glance';
    var chips = state.names.concat(state.extras).filter(Boolean).map(function (n) { return '<span class="ss-chip">' + n.replace(/</g, '&lt;') + '</span>'; }).join('');
    var pick = ps.length >= 4 ? [0, Math.floor(ps.length / 2), ps.length - 1] : [];
    var items = pick.map(function (i) { var t = (ps[i].textContent || '').trim(); return sentence(t) || t.slice(0, 120); }).filter(Boolean);
    box.innerHTML = '<h2>At a glance · about ' + mins + ' min read</h2>' + (chips ? '<div class="ss-chips">' + chips + '</div>' : '') +
      (items.length ? '<ol class="ss-moments">' + items.map(function (x) { return '<li>' + x.replace(/</g, '&lt;') + '</li>'; }).join('') + '</ol>' : '');
    body.parentNode.insertBefore(box, body);
  }
  function banner(key) {
    var old = $('.ss-banner'); if (old) old.remove(); if (key !== 'darkromance') return;
    var v = rnd(3), g = '<path d="M20 60H168M252 60H400" stroke="#d9b45f" stroke-width="1" opacity=".7"/><path d="M210 52 218 60 210 68 202 60Z" fill="#d9b45f"/>';
    var art = v === 0 ? u('ss-wine', 70, 8, 40, 82) + u('ss-rose', 180, 0, 60, 84) + u('ss-dagger', 308, -2, 26, 96, ' transform="rotate(24 321 46)"')
      : v === 1 ? u('ss-dragon', 20, 0, 130, 80) + u('ss-rose', 180, 0, 60, 84) + u('ss-wine', 300, 8, 40, 82)
      : u('ss-dagger', 90, -2, 26, 96, ' transform="rotate(-24 103 46)"') + u('ss-rose', 180, 0, 60, 84) + u('ss-dragon', 270, 4, 126, 78);
    var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('class', 'ss-banner'); s.setAttribute('viewBox', '0 0 420 100'); s.setAttribute('aria-hidden', 'true');
    s.innerHTML = g + art; var art2 = $('#story'); if (art2) art2.insertBefore(s, art2.firstChild);
  }
  function watchStory() {
    var body = $('#story-body'); if (!body) return;
    var t = 0; new MutationObserver(function () { clearTimeout(t); t = setTimeout(enhanceStory, 60); }).observe(body, { childList: true, subtree: false });
    var make = $('#make'); if (make) make.addEventListener('click', function () {
      state.names = $$('#char-list input').map(function (i) { return i.value.trim(); }).filter(function (v) { return v.length > 1; });
      state.extras = [($('#in-place') || {}).value, ($('#in-item') || {}).value].map(function (v) { return (v || '').trim(); }).filter(function (v) { return v.length > 2; });
    }, true);
  }

  /* ---------------- tidy actions ---------------- */
  function tidy() {
    var s = $('#s-story'), first = s && $('.toolbar', s); if (!s || !first || $('#ss-actions')) return;
    var g = function (id) { return document.getElementById(id); };
    var wrap = document.createElement('div'); wrap.className = 'ss-actions'; wrap.id = 'ss-actions';
    var pr = document.createElement('div'); pr.className = 'ss-primary'; ['t-listen', 't-save', 't-share'].forEach(function (id) { if (g(id)) pr.appendChild(g(id)); });
    var sec = document.createElement('div'); sec.className = 'ss-secondary'; if (g('t-continue')) sec.appendChild(g('t-continue'));
    var more = document.createElement('details'); more.className = 'ss-more'; more.innerHTML = '<summary>More ▾</summary><div class="ss-menu"></div>';
    var menu = $('.ss-menu', more);
    ['t-episode', 't-again', 't-copy', 't-pdf', 't-sleep', 't-new'].forEach(function (id) { if (g(id)) menu.appendChild(g(id)); });
    var sl = g('sleep-min'); if (sl && sl.parentNode) menu.insertBefore(sl.parentNode, g('t-new') || null);
    sec.appendChild(more); wrap.appendChild(pr); wrap.appendChild(sec); first.parentNode.insertBefore(wrap, first);
    var aa = document.createElement('div'); aa.className = 'ss-aa'; ['t-smaller', 't-bigger'].forEach(function (id) { if (g(id)) aa.appendChild(g(id)); });
    var art = $('#story'); if (art) art.parentNode.insertBefore(aa, art);
    $$('.toolbar', s).forEach(function (t) { if (!$('button', t)) t.classList.add('ss-empty'); });
    document.addEventListener('click', function (e) { if (more.open && !more.contains(e.target)) more.open = false; });
  }

  /* ---------------- music (made in the browser, no files) ---------------- */
  var Music = (function () {
    var ctx, master, bus, timer, mood = '', on = store.get('ss-music') !== '0', nextT = 0, bar = 0, ducked = false;
    var BASE = .55;
    var DM = [[146.83, 174.61, 220], [116.54, 146.83, 174.61], [98, 116.54, 146.83], [110, 138.59, 164.81]];   // Dm  Bb  Gm  A
    function init() {
      if (ctx) return true; var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
      ctx = new AC(); master = ctx.createGain(); master.gain.value = 0;
      var comp = ctx.createDynamicsCompressor(); master.connect(comp); comp.connect(ctx.destination);
      var len = ctx.sampleRate * 3, buf = ctx.createBuffer(2, len, ctx.sampleRate);
      for (var c = 0; c < 2; c++) { var d = buf.getChannelData(c); for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
      var rev = ctx.createConvolver(); rev.buffer = buf; var rg = ctx.createGain(); rg.gain.value = .6; rev.connect(rg); rg.connect(master);
      bus = ctx.createGain(); var dry = ctx.createGain(); dry.gain.value = .75; bus.connect(dry); dry.connect(master); bus.connect(rev); return true;
    }
    function env(g, t, a, peak, dur, rel) { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.setTargetAtTime(0, t + dur, rel); }
    function piano(t, f, v, dur) {
      var g = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200; g.connect(lp); lp.connect(bus);
      [[1, 'triangle', 1], [2, 'sine', .22], [3, 'sine', .07]].forEach(function (p) { var o = ctx.createOscillator(), og = ctx.createGain(); o.type = p[1]; o.frequency.value = f * p[0]; og.gain.value = p[2]; o.connect(og); og.connect(g); o.start(t); o.stop(t + dur + 2); });
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .012); g.gain.exponentialRampToValueAtTime(.0008, t + dur);
    }
    function pad(t, f, dur, v, bright) {
      var g = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = bright || 520; g.connect(lp); lp.connect(bus);
      [-7, 7].forEach(function (c) { var o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = c; var l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = 4.6; lg.gain.value = 5; l.connect(lg); lg.connect(o.detune); l.start(t); l.stop(t + dur + 3); o.connect(g); o.start(t); o.stop(t + dur + 3); });
      env(g, t, 1.6, v, dur, 1.2);
    }
    function bell(t, f, v) { [[1, 1], [2.76, .35], [5.4, .12]].forEach(function (p) { var o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = f * p[0]; o.connect(g); g.connect(bus); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v * p[1], t + .01); g.gain.exponentialRampToValueAtTime(.0005, t + 5); o.start(t); o.stop(t + 5.2); }); }
    function noiseSwell(t, dur, v) {
      var n = ctx.sampleRate * dur, b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0); for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      var s = ctx.createBufferSource(); s.buffer = b; var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 700; bp.Q.value = .7; var g = ctx.createGain(); s.connect(bp); bp.connect(g); g.connect(bus);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + dur * .55); g.gain.linearRampToValueAtTime(0, t + dur); s.start(t); s.stop(t + dur);
    }
    var SCORES = {
      darkromance: { beat: 60 / 54, bars: function (t, b, B) {           // slow minor waltz: low cello, soft piano, a faint bell
        var c = DM[Math.floor(b / 2) % 4]; if (b % 2 === 0) { pad(t, c[0] / 2, B * 6.5, .05, 480); pad(t, c[2] / 2, B * 6.5, .035, 420); }
        piano(t, c[0] / 2, .17, 3.2); piano(t + B, c[1] * 2, .1, 2.6); piano(t + 2 * B, c[2] * 2, .09, 2.4);
        if (b % 4 === 1) { var m = [c[2] * 2, c[1] * 4, c[2] * 4, c[0] * 4][rnd(4)]; piano(t + B, m, .12, 3.6); }
        if (b % 12 === 0) bell(t + B * 2, 1174.7, .02); } },
      horror: { beat: 1, bars: function (t, b, B) {
        if (b % 4 === 0) { pad(t, 55, B * 10, .05, 300); pad(t, 58.27, B * 10, .035, 300); }
        if (b % 3 === 0) noiseSwell(t + B, B * 5, .018); if (rnd(3) === 0) piano(t + rnd(3) + .5, [493.9, 466.2, 698.5][rnd(3)], .05, 4); } },
      romance: { beat: 60 / 66, bars: function (t, b, B) {
        var ch = [[130.8, 164.8, 196], [110, 130.8, 164.8], [87.3, 110, 130.8], [98, 123.5, 146.8]][b % 4];
        piano(t, ch[0], .15, 3); piano(t + B, ch[1] * 2, .1, 2.6); piano(t + 2 * B, ch[2] * 2, .09, 2.4); if (b % 2 === 0) pad(t, ch[0], B * 6, .03, 600); } },
      bedtime: { beat: 60 / 60, bars: function (t, b, B) {
        var sc = [523.3, 587.3, 659.3, 784, 880]; piano(t, sc[rnd(5)], .08, 3); piano(t + B * 1.5, sc[rnd(5)], .06, 3); if (b % 4 === 0) pad(t, 130.8, B * 10, .02, 500); } }
    };
    function moodOf(g) { return g === 'darkromance' ? 'darkromance' : g === 'horror' ? 'horror' : (g === 'romance' || g === 'friends') ? 'romance' : g === 'bedtime' ? 'bedtime' : ''; }
    function tick() {
      var sc = SCORES[mood]; if (!sc || !ctx) return; var B = sc.beat;
      while (nextT < ctx.currentTime + 1.6) { if (nextT < ctx.currentTime) nextT = ctx.currentTime + .1; sc.bars(nextT, bar, B); nextT += B * 3; bar++; }
      var sp = window.speechSynthesis && speechSynthesis.speaking; if (sp !== ducked) { ducked = sp; master.gain.setTargetAtTime(sp ? BASE * .3 : BASE, ctx.currentTime, .4); }
    }
    function setBtn() { var b = $('#ss-music'); if (b) { b.setAttribute('aria-pressed', on && mood ? 'true' : 'false'); b.textContent = on ? '🎵' : '🔇'; b.setAttribute('aria-label', on ? 'Turn music off' : 'Turn music on'); } }
    return {
      play: function (genre) {
        var m = moodOf(genre); if (m === mood && ctx && ctx.state !== 'suspended') { setBtn(); return; }
        mood = m; clearInterval(timer);
        if (!m || !on) { if (ctx) master.gain.setTargetAtTime(0, ctx.currentTime, .5); setBtn(); return; }
        if (!init()) return; if (ctx.state === 'suspended') ctx.resume();
        bar = 0; nextT = ctx.currentTime + .3; master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setTargetAtTime(BASE, ctx.currentTime, 1.2);
        timer = setInterval(tick, 250); tick(); setBtn();
      },
      stop: function () { mood = ''; clearInterval(timer); if (ctx) master.gain.setTargetAtTime(0, ctx.currentTime, .5); setBtn(); },
      toggle: function () { on = !on; store.set('ss-music', on ? '1' : '0');
        if (!on) { clearInterval(timer); if (ctx) master.gain.setTargetAtTime(0, ctx.currentTime, .4); mood = ''; setBtn(); }
        else this.play(state.genre || keyOf(($('#story-meta') || {}).textContent || '')); },
      pause: function () { if (ctx && ctx.state === 'running') ctx.suspend(); }, resume: function () { if (ctx && on && mood && ctx.state === 'suspended') ctx.resume(); },
      _probe: function () { return { ctx: ctx, master: master }; }
    };
  })();

  /* ---------------- start ---------------- */
  function boot() {
    var sp = document.createElement('div'); sp.innerHTML = SPRITE; document.body.appendChild(sp.firstChild);
    var mb = document.createElement('button'); mb.id = 'ss-music'; mb.type = 'button'; mb.textContent = '🎵'; mb.setAttribute('aria-pressed', 'false'); mb.setAttribute('aria-label', 'Music');
    mb.addEventListener('click', function () { Music.toggle(); }); document.body.appendChild(mb);
    watchGenres(); watchStory(); tidy();
    ['#brand', '[data-back="age"]'].forEach(function (s) { $$(s).forEach(function (b) { b.addEventListener('click', function () { Music.stop(); }); }); });
    var tn = $('#t-new'); if (tn) tn.addEventListener('click', function () { Music.stop(); if (window.SSScene) SSScene.unlock(); });
    var br = $('#brand'); if (br) br.addEventListener('click', function () { if (window.SSScene) SSScene.unlock(); });
    $$('[data-back]').forEach(function (b) { b.addEventListener('click', function () { if (!window.SSScene) return; SSScene.unlock(); if (b.getAttribute('data-back') === 'genre') setTimeout(function () { SSScene.preview('default'); }, 50); }); });
    document.addEventListener('visibilitychange', function () { document.hidden ? Music.pause() : Music.resume(); });
    window.__ss = { Music: Music, state: state };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
