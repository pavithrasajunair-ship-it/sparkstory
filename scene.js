/* StorySpark living backgrounds: a scene for each genre, with particles you can play with.
   Dark Romance: candlelit bedroom, drifting rose petals, candles you can blow out, a warm light that follows your finger.
   Public API: SSScene.preview(key), SSScene.lock(key), SSScene.unlock() */
(function () {
  'use strict';
  var rnd = function (a, b) { return a + Math.random() * (b - a); }, pick = function (a) { return a[Math.floor(Math.random() * a.length)]; };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root, layers = [], cur = 0, canvas, ctx, lightEl, dimEl, gradeEl, hint, W = 0, H = 0, DPR = 1, PH = {}, AVIF = false;
  var state = { key: '', locked: '', px: .5, py: .6, tx: .5, ty: .6, down: false, candles: [], dragonT: 0 };

  /* ---------------------------------------------------- scenery */
  var BLUR = '<defs><filter id="b2" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="2.4"/></filter><filter id="b6" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="7"/></filter><filter id="b14" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="16"/></filter></defs>';
function svgWrap(w, h, inner) { return '<svg class="ss-svg" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">' + BLUR + inner + '</svg>'; }
function rays(x, y, len, ang, col, n) { var o = '<g style="mix-blend-mode:screen" filter="url(#b6)">'; for (var i = 0; i < (n || 6); i++) { var a = ang + (i - (n || 6) / 2) * .11, a2 = a + .06; o += '<path d="M' + x + ' ' + y + 'L' + (x + Math.cos(a) * len).toFixed(0) + ' ' + (y + Math.sin(a) * len).toFixed(0) + 'L' + (x + Math.cos(a2) * len).toFixed(0) + ' ' + (y + Math.sin(a2) * len).toFixed(0) + 'Z" fill="' + col + '" opacity="' + rnd(.06, .13).toFixed(3) + '"/>'; } return o + '</g>'; }
function bokeh(n, x0, y0, x1, y1, cols, r0, r1) { var o = '<g style="mix-blend-mode:screen" filter="url(#b2)">'; for (var i = 0; i < n; i++) o += '<circle cx="' + rnd(x0, x1).toFixed(0) + '" cy="' + rnd(y0, y1).toFixed(0) + '" r="' + rnd(r0, r1).toFixed(1) + '" fill="' + pick(cols) + '" opacity="' + rnd(.25, .8).toFixed(2) + '"/>'; return o + '</g>'; }
  var DEFS_DR = '<defs>' +
    '<linearGradient id="dWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14050c"/><stop offset=".6" stop-color="#2d0b1b"/><stop offset="1" stop-color="#0d0307"/></linearGradient>' +
    '<linearGradient id="dCurt" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3a0713"/><stop offset=".5" stop-color="#8b1230"/><stop offset="1" stop-color="#3a0713"/></linearGradient>' +
    '<linearGradient id="dSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b0f2a"/><stop offset="1" stop-color="#3a1d4e"/></linearGradient>' +
    '<linearGradient id="dSat" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b3122e"/><stop offset=".5" stop-color="#6e0b1f"/><stop offset="1" stop-color="#a0102a"/></linearGradient>' +
    '<linearGradient id="dSat2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8c1029"/><stop offset="1" stop-color="#3b0612"/></linearGradient>' +
    '<linearGradient id="dWood" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1c0b10"/><stop offset=".5" stop-color="#3a1a1f"/><stop offset="1" stop-color="#1c0b10"/></linearGradient>' +
    '<linearGradient id="dWax" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#cdbf9c"/><stop offset=".45" stop-color="#fff4d6"/><stop offset="1" stop-color="#b9a780"/></linearGradient>' +
    '<linearGradient id="dGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6e3a8"/><stop offset="1" stop-color="#a97f2e"/></linearGradient>' +
    '<radialGradient id="dGlow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffb35a" stop-opacity=".85"/><stop offset=".35" stop-color="#ff7a2e" stop-opacity=".32"/><stop offset="1" stop-color="#ff5a1e" stop-opacity="0"/></radialGradient>' +
    '<radialGradient id="dMoon" cx=".4" cy=".4" r=".7"><stop offset="0" stop-color="#fff7dc"/><stop offset="1" stop-color="#e3cf97"/></radialGradient>' +
    '<radialGradient id="dPet" cx=".3" cy=".3" r=".9"><stop offset="0" stop-color="#e8344f"/><stop offset="1" stop-color="#7a0f27"/></radialGradient>' +
    '<path id="dPetal" d="M0 0C3-9 15-8 16 1 15 10 3 12 0 0Z"/></defs>';
  function candle(id, x, y, sc, hgt) {
    var f = id, hh = hgt || 60;
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + sc + ')"><circle class="ss-glow" id="gl' + f + '" cx="0" cy="' + (-hh - 14) + '" r="170" fill="url(#dGlow)"/>' +
      '<rect x="-9" y="' + -hh + '" width="18" height="' + hh + '" rx="3" fill="url(#dWax)"/><ellipse cx="0" cy="' + -hh + '" rx="9" ry="3" fill="#fff4d6"/>' +
      '<path d="M-9 ' + (-hh + 3) + 'q-2 14 2 20 2-8 3-20ZM9 ' + (-hh + 3) + 'q3 10 0 24-4-10-2-24Z" fill="#fff4d6" opacity=".9"/><rect x="-0.8" y="' + (-hh - 8) + '" width="1.6" height="8" fill="#2a1a10"/>' +
      '<g id="fl' + f + '" transform="translate(0 ' + (-hh - 8) + ')"><path d="M0-30C9-18 8-6 0 0-8-6-9-18 0-30Z" fill="#ffb347"/><path d="M0-20C4-12 4-5 0-1-4-5-4-12 0-20Z" fill="#fff6c8"/></g></g>';
  }
  function petals(n, x0, y0, x1, y1, seedCols) {
    var out = '', cols = seedCols || ['url(#dPet)', '#b3122e', '#8f0f27', '#c81d3c', '#5a0a1a'];
    for (var i = 0; i < n; i++) out += '<use href="#dPetal" fill="' + pick(cols) + '" opacity="' + rnd(.7, 1).toFixed(2) + '" transform="translate(' + rnd(x0, x1).toFixed(0) + ' ' + rnd(y0, y1).toFixed(0) + ') rotate(' + rnd(0, 360).toFixed(0) + ') scale(' + rnd(.6, 1.25).toFixed(2) + ')"/>';
    return out;
  }
  function curtain(x, w, h, flip) {
    var o = '<rect x="' + x + '" y="0" width="' + w + '" height="' + h + '" fill="url(#dCurt)"/>', n = 7, i;
    for (i = 1; i < n; i++) { var fx = x + w * i / n; o += '<path d="M' + fx + ' 0C' + (fx + 7) + ' ' + h * .3 + ' ' + (fx - 7) + ' ' + h * .65 + ' ' + (fx + 2) + ' ' + h + '" stroke="rgba(0,0,0,.4)" stroke-width="5" fill="none"/><path d="M' + (fx + 5) + ' 0C' + (fx + 12) + ' ' + h * .3 + ' ' + (fx - 2) + ' ' + h * .65 + ' ' + (fx + 7) + ' ' + h + '" stroke="rgba(255,110,140,.13)" stroke-width="3" fill="none"/>'; }
    o += '<rect x="' + (x - (flip ? 0 : 6)) + '" y="0" width="' + (w + 6) + '" height="16" fill="url(#dGold)"/><path d="M' + x + ' ' + h + 'q' + w / 6 + ' -16 ' + w / 3 + ' 0t' + w / 3 + ' 0t' + w / 3 + ' 0V' + h + 'Z" fill="#2a050f"/>';
    var tx = flip ? x : x + w; o += '<ellipse cx="' + tx + '" cy="' + h * .58 + '" rx="' + w * .1 + '" ry="' + w * .22 + '" fill="url(#dGold)" opacity=".9"/>';
    return o;
  }
  function artDarkRomance(w, h) {
    state.candles = []; var port = h > w * 1.1, g = DEFS_DR;
    var floor = h * .86, cw = Math.max(w * .13, 70);
    g += '<rect width="' + w + '" height="' + h + '" fill="url(#dWall)"/>';
    // window with moon, vines and a dragon crossing
    var ww = port ? w * .5 : Math.min(w * .22, 300), wh = h * (port ? .3 : .5), wx = w / 2 - ww / 2, wy = h * .07, r = ww / 2;
    g += '<defs><clipPath id="dWinC"><path d="M' + wx + ' ' + (wy + wh) + 'V' + (wy + r) + 'A' + r + ' ' + r + ' 0 0 1 ' + (wx + ww) + ' ' + (wy + r) + 'V' + (wy + wh) + 'Z"/></clipPath></defs>';
    g += '<path d="M' + (wx - 10) + ' ' + (wy + wh + 10) + 'V' + (wy + r) + 'A' + (r + 10) + ' ' + (r + 10) + ' 0 0 1 ' + (wx + ww + 10) + ' ' + (wy + r) + 'V' + (wy + wh + 10) + 'Z" fill="#1c0a10" stroke="url(#dGold)" stroke-width="3"/>';
    g += '<g clip-path="url(#dWinC)"><rect x="' + wx + '" y="' + wy + '" width="' + ww + '" height="' + wh + '" fill="url(#dSky)"/><circle cx="' + (wx + ww * .62) + '" cy="' + (wy + wh * .34) + '" r="' + ww * .17 + '" fill="url(#dMoon)"/><circle cx="' + (wx + ww * .62) + '" cy="' + (wy + wh * .34) + '" r="' + ww * .32 + '" fill="#e8d89a" opacity=".12"/>';
    for (var s = 0; s < 14; s++) g += '<circle cx="' + rnd(wx, wx + ww).toFixed(0) + '" cy="' + rnd(wy, wy + wh * .7).toFixed(0) + '" r="' + rnd(.6, 1.6).toFixed(1) + '" fill="#fff" opacity="' + rnd(.4, .9).toFixed(2) + '"/>';
    g += '<g id="dDragon" opacity=".95"><use href="#ss-dragon" x="' + wx + '" y="' + (wy + wh * .22) + '" width="' + ww * .5 + '" height="' + ww * .31 + '"/></g>';
    g += '<path d="M' + (wx + ww / 2) + ' ' + wy + 'V' + (wy + wh) + 'M' + wx + ' ' + (wy + wh * .55) + 'H' + (wx + ww) + '" stroke="#1c0a10" stroke-width="5"/></g>';
    g += '<path d="M' + (wx - 14) + ' ' + (wy + wh) + 'C' + (wx - 30) + ' ' + (wy + wh * .7) + ' ' + (wx + 8) + ' ' + (wy + wh * .5) + ' ' + (wx - 6) + ' ' + (wy + wh * .2) + '" stroke="#07020a" stroke-width="4" fill="none"/>';
    for (var t = 0; t < 7; t++) g += '<path d="M' + (wx - 10 - t % 2 * 4) + ' ' + (wy + wh * (.25 + t * .1)) + 'l-9 -4 7 8Z" fill="#07020a"/>';
    // curtains
    g += '<g filter="url(#b2)">' + curtain(0, cw, h * .9, false) + curtain(w - cw, cw, h * .9, true) + '</g>' + rays(wx + ww * .62, wy + wh * .34, h * .9, 1.75, '#cfd8ff', 5);
    // bed
    var bw = port ? w * .98 : Math.min(w * .6, 820), bx = w / 2 - bw / 2, bh = h * (port ? .24 : .3), by = h - bh;
    g += '<path d="M' + bx + ' ' + h + 'V' + (by - bh * .25) + 'Q' + bx + ' ' + (by - bh * .62) + ' ' + (bx + bw * .08) + ' ' + (by - bh * .62) + 'H' + (bx + bw * .92) + 'Q' + (bx + bw) + ' ' + (by - bh * .62) + ' ' + (bx + bw) + ' ' + (by - bh * .25) + 'V' + h + 'Z" fill="url(#dWood)" stroke="#0a0306" stroke-width="3"/>';
    for (var b = 0; b < 8; b++) g += '<circle cx="' + (bx + bw * (.12 + b * .108)).toFixed(0) + '" cy="' + (by - bh * .38) + '" r="4" fill="url(#dGold)" opacity=".7"/>';
    g += '<rect x="' + (bx + bw * .08) + '" y="' + (by - bh * .26) + '" width="' + bw * .38 + '" height="' + bh * .3 + '" rx="' + bh * .1 + '" fill="url(#dSat2)"/><rect x="' + (bx + bw * .54) + '" y="' + (by - bh * .26) + '" width="' + bw * .38 + '" height="' + bh * .3 + '" rx="' + bh * .1 + '" fill="url(#dSat2)"/>';
    g += '<path d="M' + (bx + bw * .1) + ' ' + (by - bh * .22) + 'q' + bw * .15 + ' -' + bh * .05 + ' ' + bw * .3 + ' 0" stroke="rgba(255,150,170,.35)" stroke-width="3" fill="none"/>';
    g += '<path d="M' + (bx - 6) + ' ' + h + 'V' + (by + bh * .1) + 'Q' + (bx + bw / 2) + ' ' + (by - bh * .12) + ' ' + (bx + bw + 6) + ' ' + (by + bh * .1) + 'V' + h + 'Z" fill="url(#dSat)"/>';
    g += '<path d="M' + (bx + bw * .05) + ' ' + (by + bh * .25) + 'Q' + (bx + bw * .3) + ' ' + (by + bh * .05) + ' ' + (bx + bw * .55) + ' ' + (by + bh * .3) + 'T' + (bx + bw * .96) + ' ' + (by + bh * .2) + '" stroke="rgba(255,170,190,.28)" stroke-width="4" fill="none"/>';
    g += '<path d="M' + (bx + bw * .15) + ' ' + (by + bh * .55) + 'Q' + (bx + bw * .5) + ' ' + (by + bh * .38) + ' ' + (bx + bw * .85) + ' ' + (by + bh * .6) + '" stroke="rgba(0,0,0,.3)" stroke-width="5" fill="none"/>';
    g += '<rect x="' + bx + '" y="' + (by + bh * .1) + '" width="' + bw + '" height="5" fill="url(#dGold)" opacity=".7"/>';
    g += petals(Math.round(bw / 11), bx + bw * .08, by - bh * .1, bx + bw * .92, by + bh * .75) + petals(10, bx - 60, h - 40, bx + bw + 60, h - 6);
    // bedside table with candles, wine and roses
    var tw = port ? w * .3 : Math.min(w * .13, 190), tx = port ? w - tw - cw * .55 : Math.min(bx + bw + w * .03, w - cw - tw - 20), ty = port ? h * .66 : h * .64, k = tw / 150;
    g += '<g transform="translate(' + tx + ' ' + ty + ')"><rect x="0" y="0" width="' + tw + '" height="' + 12 * k + '" rx="3" fill="url(#dWood)" stroke="url(#dGold)" stroke-width="1.5"/><rect x="' + 8 * k + '" y="' + 12 * k + '" width="' + (tw - 16 * k) + '" height="' + 22 * k + '" fill="#1a0a0f"/><rect x="' + 10 * k + '" y="' + 34 * k + '" width="' + 9 * k + '" height="' + (h - ty - 34 * k) + '" fill="#160810"/><rect x="' + (tw - 19 * k) + '" y="' + 34 * k + '" width="' + 9 * k + '" height="' + (h - ty - 34 * k) + '" fill="#160810"/></g>';
    var c1 = { x: tx + tw * .22, y: ty, s: k * 1.05, hh: 70 }, c2 = { x: tx + tw * .42, y: ty, s: k * 1.05, hh: 44 };
    g += '<use href="#ss-rose" x="' + (tx + tw * .5) + '" y="' + (ty - tw * .95) + '" width="' + tw * .32 + '" height="' + tw * .45 + '" transform="rotate(-8 ' + (tx + tw * .66) + ' ' + ty + ')"/><use href="#ss-wine" x="' + (tx + tw * .76) + '" y="' + (ty - tw * .62) + '" width="' + tw * .2 + '" height="' + tw * .4 + '"/>';
    g += candle('A', c1.x, c1.y, c1.s, c1.hh) + candle('B', c2.x, c2.y, c2.s, c2.hh);
    state.candles.push({ id: 'A', on: true, x: c1.x, y: c1.y - c1.hh * c1.s, r: 44 * k + 16 }, { id: 'B', on: true, x: c2.x, y: c2.y - c2.hh * c2.s, r: 44 * k + 16 });
    // floor candles on the left
    var fx = cw + (port ? w * .08 : w * .06), fy = h * .93, fs = Math.max(.9, k * 1.1);
    g += petals(14, fx - 70, fy - 6, fx + 110, fy + 20);
    g += candle('C', fx, fy, fs, 90) + candle('D', fx + 40 * fs, fy + 4, fs * .85, 52) + candle('E', fx + 74 * fs, fy, fs * .95, 70);
    [['C', fx, fy, fs, 90], ['D', fx + 40 * fs, fy + 4, fs * .85, 52], ['E', fx + 74 * fs, fy, fs * .95, 70]].forEach(function (c) { state.candles.push({ id: c[0], on: true, x: c[1], y: c[2] - c[4] * c[3], r: 40 * c[3] + 16 }); });
    return svgWrap(w, h, g);
  }
  function artHorror(w, h) {
    var g = '<defs><radialGradient id="hM" cx=".4" cy=".4" r=".7"><stop offset="0" stop-color="#fffdf0"/><stop offset="1" stop-color="#d9e2d0"/></radialGradient></defs>';
    var mx = w * .72, my = h * .2, mr = Math.min(w, h) * .12;
    g += '<circle cx="' + mx + '" cy="' + my + '" r="' + mr * 2.6 + '" fill="#cfe8e0" opacity=".08"/><circle cx="' + mx + '" cy="' + my + '" r="' + mr + '" fill="url(#hM)"/><circle cx="' + (mx + mr * .3) + '" cy="' + (my - mr * .2) + '" r="' + mr * .18 + '" fill="#000" opacity=".07"/>';
    g += '<path d="M0 ' + h + 'V' + h * .82 + 'C' + w * .2 + ' ' + h * .74 + ' ' + w * .35 + ' ' + h * .86 + ' ' + w * .55 + ' ' + h * .8 + 'S' + w * .9 + ' ' + h * .78 + ' ' + w + ' ' + h * .84 + 'V' + h + 'Z" fill="#02070b"/>';
    function tree(x, y, len, a, d) { if (d === 0 || len < 6) return ''; var x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len, o = '<path d="M' + x.toFixed(0) + ' ' + y.toFixed(0) + 'L' + x2.toFixed(0) + ' ' + y2.toFixed(0) + '" stroke="#02070b" stroke-width="' + Math.max(1.2, d * 1.6) + '" stroke-linecap="round"/>'; return o + tree(x2, y2, len * rnd(.66, .8), a - rnd(.3, .7), d - 1) + tree(x2, y2, len * rnd(.6, .78), a + rnd(.3, .7), d - 1); }
    g += tree(w * .1, h * .88, h * .13, -Math.PI / 2, 7) + tree(w * .9, h * .9, h * .15, -Math.PI / 2, 7) + tree(w * .3, h * .9, h * .09, -Math.PI / 2, 6);
    return svgWrap(w, h, g);
  }
  function artFantasy(w, h) {
    var g = '<path d="M0 ' + h + 'V' + h * .78 + 'C' + w * .25 + ' ' + h * .68 + ' ' + w * .5 + ' ' + h * .8 + ' ' + w + ' ' + h * .72 + 'V' + h + 'Z" fill="#14083a"/>';
    var cx = w * .74, cy = h * .76, s = Math.min(w, h) * .3;
    g += '<g transform="translate(' + (cx - s / 2) + ' ' + (cy - s) + ') scale(' + s / 100 + ')"><path d="M10 92V42H22V30H28V42H40V22L50 6 60 22V42H72V30H78V42H90V92Z" fill="#0b0524"/><path d="M42 92V72Q50 62 58 72V92Z" fill="#ffd98a"/><rect x="22" y="48" width="4" height="8" fill="#ffd98a"/><rect x="72" y="48" width="4" height="8" fill="#ffd98a"/></g>';
    g += '<use href="#ss-dragon" x="' + w * .08 + '" y="' + h * .12 + '" width="' + w * .22 + '" height="' + w * .14 + '" opacity=".55"/>';
    return svgWrap(w, h, g);
  }
  function artSciFi(w, h) {
    var px = w * .78, py = h * .26, r = Math.min(w, h) * .13;
    return svgWrap(w, h, '<defs><radialGradient id="sP" cx=".35" cy=".35" r=".8"><stop offset="0" stop-color="#8fe3ff"/><stop offset="1" stop-color="#1a4f9c"/></radialGradient></defs><ellipse cx="' + px + '" cy="' + py + '" rx="' + r * 2 + '" ry="' + r * .4 + '" fill="none" stroke="#bfe9ff" stroke-width="4" opacity=".5" transform="rotate(-18 ' + px + ' ' + py + ')"/><circle cx="' + px + '" cy="' + py + '" r="' + r + '" fill="url(#sP)"/><path d="M' + (px - r * 2.1) + ' ' + (py + r * .2) + 'A' + r * 2 + ' ' + r * .4 + ' 0 0 0 ' + (px + r * 2) + ' ' + (py - r * .4) + '" stroke="#bfe9ff" stroke-width="4" fill="none" opacity=".7" transform="rotate(-18 ' + px + ' ' + py + ')"/>');
  }
  function artMystery(w, h) {
    var x = w * .16, g = '<defs><linearGradient id="mCone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9a8" stop-opacity=".5"/><stop offset="1" stop-color="#ffe9a8" stop-opacity="0"/></linearGradient></defs>';
    g += '<path d="M' + (x - 8) + ' ' + h * .26 + 'L' + (x - w * .12) + ' ' + h + 'H' + (x + w * .12) + 'L' + (x + 8) + ' ' + h * .26 + 'Z" fill="url(#mCone)"/><rect x="' + (x - 4) + '" y="' + h * .3 + '" width="8" height="' + h * .7 + '" fill="#03080c"/><path d="M' + (x - 22) + ' ' + h * .26 + 'h44l-8 -22h-28Z" fill="#03080c"/><ellipse cx="' + x + '" cy="' + h * .26 + '" rx="16" ry="5" fill="#ffe9a8"/>';
    return svgWrap(w, h, g);
  }
  function artDrama(w, h) {
    var cw = w * .17, g = '<defs><linearGradient id="tC" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3b0a0a"/><stop offset=".5" stop-color="#8c1d1d"/><stop offset="1" stop-color="#3b0a0a"/></linearGradient></defs>';
    [0, w - cw].forEach(function (x) { g += '<rect x="' + x + '" width="' + cw + '" height="' + h + '" fill="url(#tC)"/>'; for (var i = 1; i < 6; i++) g += '<path d="M' + (x + cw * i / 6) + ' 0V' + h + '" stroke="rgba(0,0,0,.35)" stroke-width="4"/>'; });
    g += '<rect width="' + w + '" height="26" fill="#6b1414"/><rect y="' + h * .93 + '" width="' + w + '" height="' + h * .07 + '" fill="#2a1208"/>';
    return svgWrap(w, h, g);
  }
  function artBedtime(w, h) {
    var mx = w * .75, my = h * .2, r = Math.min(w, h) * .1;
    return svgWrap(w, h, '<defs><radialGradient id="bM" cx=".4" cy=".4" r=".7"><stop offset="0" stop-color="#fffbe6"/><stop offset="1" stop-color="#e6dba0"/></radialGradient></defs><circle cx="' + mx + '" cy="' + my + '" r="' + r * 2.4 + '" fill="#e9e3ff" opacity=".1"/><circle cx="' + mx + '" cy="' + my + '" r="' + r + '" fill="url(#bM)"/><path d="M' + (mx - r * .2) + ' ' + (my - r) + 'a' + r + ' ' + r + ' 0 1 0 0 ' + r * 2 + 'a' + r * .75 + ' ' + r * .75 + ' 0 1 1 0 -' + r * 2 + 'Z" fill="#fff" opacity="0"/><path d="M0 ' + h + 'V' + h * .86 + 'C' + w * .3 + ' ' + h * .8 + ' ' + w * .6 + ' ' + h * .9 + ' ' + w + ' ' + h * .83 + 'V' + h + 'Z" fill="#1a1450"/>');
  }
  
/* ---- cinematic scenes (override the first versions) ---- */
function artRomance(w, h) {
  var hz = h * .68, sx = w * (w > h ? .6 : .55), sr = Math.min(w, h) * .06, g = '<defs><radialGradient id="rSun" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff2c8"/><stop offset=".25" stop-color="#ffc98a" stop-opacity=".85"/><stop offset="1" stop-color="#ff8a6a" stop-opacity="0"/></radialGradient><linearGradient id="rSea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a2f5e"/><stop offset=".4" stop-color="#3a1745"/><stop offset="1" stop-color="#0d0612"/></linearGradient></defs>';
  g += '<circle cx="' + sx + '" cy="' + (hz - sr * .4) + '" r="' + sr * 7 + '" fill="url(#rSun)"/><circle cx="' + sx + '" cy="' + (hz - sr * .4) + '" r="' + sr + '" fill="#fff2c8"/>';
  for (var c = 0; c < 6; c++) g += '<ellipse cx="' + rnd(0, w).toFixed(0) + '" cy="' + rnd(h * .1, h * .5).toFixed(0) + '" rx="' + rnd(w * .12, w * .3).toFixed(0) + '" ry="' + rnd(h * .02, h * .045).toFixed(0) + '" fill="' + pick(['#ff9aa8', '#c25a8c', '#ffc2a0', '#7a3a8a']) + '" opacity="' + rnd(.25, .5).toFixed(2) + '" filter="url(#b14)"/>';
  g += '<rect x="0" y="' + hz + '" width="' + w + '" height="' + (h - hz) + '" fill="url(#rSea)"/>';
  for (var i = 0; i < 16; i++) { var ww = sr * (4 - i * .18) * rnd(.6, 1.4); g += '<rect x="' + (sx - ww / 2 + rnd(-8, 8)).toFixed(0) + '" y="' + (hz + 4 + i * (h - hz) * .06).toFixed(0) + '" width="' + Math.max(6, ww).toFixed(0) + '" height="3" rx="1.5" fill="#ffd9a0" opacity="' + Math.max(.08, .7 - i * .045).toFixed(2) + '"/>'; }
  g += '<path d="M0 ' + hz + 'H' + w + '" stroke="#ffd0a0" stroke-width="1.5" opacity=".5"/>' + bokeh(34, 0, hz - 16, w, hz + 2, ['#ffd9a0', '#ffb4c4', '#fff0c8'], 1.5, 4);
  // pergola with string lights, out of focus in the foreground
  var px = w * .06, g2 = '<g filter="url(#b2)"><rect x="' + (px - 10) + '" y="' + h * .2 + '" width="20" height="' + h * .8 + '" fill="#08030c"/><rect x="' + (w - px - 10) + '" y="' + h * .2 + '" width="20" height="' + h * .8 + '" fill="#08030c"/><path d="M' + (px - 20) + ' ' + h * .2 + 'Q' + w / 2 + ' ' + h * .12 + ' ' + (w - px + 20) + ' ' + h * .2 + '" stroke="#08030c" stroke-width="22" fill="none"/></g>';
  for (var l = 0; l < 26; l++) { var t = l / 25, lx = px + (w - 2 * px) * t, ly = h * .2 + Math.sin(t * Math.PI) * (-h * .06) + Math.sin(t * 22) * 4 + h * .06; g2 += '<circle cx="' + lx.toFixed(0) + '" cy="' + (ly + 20).toFixed(0) + '" r="' + rnd(7, 14).toFixed(1) + '" fill="#ffd9a0" opacity="' + rnd(.2, .55).toFixed(2) + '" filter="url(#b6)" style="mix-blend-mode:screen"/><circle cx="' + lx.toFixed(0) + '" cy="' + (ly + 20).toFixed(0) + '" r="2" fill="#fff4d8"/>'; }
  g2 += '<path d="M0 ' + h + 'V' + h * .9 + 'Q' + w * .15 + ' ' + h * .84 + ' ' + w * .3 + ' ' + h * .92 + 'T' + w * .62 + ' ' + h * .9 + 'T' + w + ' ' + h * .88 + 'V' + h + 'Z" fill="#07020b" filter="url(#b2)"/>';
  return svgWrap(w, h, g + g2);
}
function artHorror(w, h) {
  var mx = w * .74, my = h * .2, mr = Math.min(w, h) * .1, g = '<defs><radialGradient id="hM" cx=".4" cy=".4" r=".7"><stop offset="0" stop-color="#fffdf0"/><stop offset="1" stop-color="#cfd9cc"/></radialGradient><radialGradient id="hW" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffcf70" stop-opacity=".9"/><stop offset="1" stop-color="#ff9a30" stop-opacity="0"/></radialGradient></defs>';
  g += '<circle cx="' + mx + '" cy="' + my + '" r="' + mr * 4 + '" fill="#bcd6d0" opacity=".1" filter="url(#b14)"/><circle cx="' + mx + '" cy="' + my + '" r="' + mr + '" fill="url(#hM)"/>' + rays(mx, my, h * .9, 1.85, '#cfe8e0', 5);
  var hy = h * .78; g += '<path d="M0 ' + h + 'V' + hy + 'C' + w * .2 + ' ' + (hy - h * .06) + ' ' + w * .4 + ' ' + (hy + h * .02) + ' ' + w * .6 + ' ' + (hy - h * .04) + 'S' + w * .9 + ' ' + (hy - h * .02) + ' ' + w + ' ' + hy + 'V' + h + 'Z" fill="#03080c"/>';
  var s = Math.min(w, h) * (w > h ? .5 : .62) / 100, bx = w * (w > h ? .56 : .3), by = hy - h * .045;
  g += '<g transform="translate(' + bx + ' ' + by + ') scale(' + s + ')" fill="#030709"><rect x="0" y="-60" width="100" height="62"/><path d="M-6 -60 50 -98 106 -60Z"/><rect x="74" y="-96" width="24" height="98"/><path d="M71 -96 86 -128 101 -96Z"/><rect x="14" y="-92" width="8" height="30"/><rect x="40" y="-30" width="18" height="32" fill="#02050a"/></g>';
  [[14, -44], [34, -44], [62, -44], [82, -78], [82, -56]].forEach(function (p, i) { var wx = bx + p[0] * s, wy = by + p[1] * s; g += '<circle class="ss-win" data-i="' + i + '" cx="' + (wx + 4 * s) + '" cy="' + (wy + 5 * s) + '" r="' + 16 * s + '" fill="url(#hW)" style="mix-blend-mode:screen"/><rect x="' + wx + '" y="' + wy + '" width="' + 8 * s + '" height="' + 10 * s + '" fill="#ffcf70" opacity="' + (i === 3 ? 1 : .55) + '"/>'; });
  function tree(x, y, len, a, d) { if (d === 0 || len < 6) return ''; var x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len; return '<path d="M' + x.toFixed(0) + ' ' + y.toFixed(0) + 'L' + x2.toFixed(0) + ' ' + y2.toFixed(0) + '" stroke="#02060a" stroke-width="' + Math.max(1.2, d * 1.7) + '" stroke-linecap="round"/>' + tree(x2, y2, len * rnd(.66, .8), a - rnd(.3, .7), d - 1) + tree(x2, y2, len * rnd(.6, .78), a + rnd(.3, .7), d - 1); }
  g += '<g filter="url(#b2)">' + tree(w * .07, h * .92, h * .16, -Math.PI / 2, 7) + tree(w * .94, h * .94, h * .18, -Math.PI / 2, 7) + '</g>';
  g += '<g id="hFog" style="mix-blend-mode:screen" filter="url(#b14)">';
  for (var f = 0; f < 7; f++) g += '<ellipse cx="' + rnd(0, w).toFixed(0) + '" cy="' + rnd(hy - h * .06, h).toFixed(0) + '" rx="' + rnd(w * .18, w * .4).toFixed(0) + '" ry="' + rnd(h * .03, h * .07).toFixed(0) + '" fill="#9fb8bf" opacity="' + rnd(.12, .24).toFixed(2) + '"/>';
  return svgWrap(w, h, g + '</g>');
}
function artMystery(w, h) {
  var hz = h * .56, g = '<defs><linearGradient id="mRoad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c3342"/><stop offset="1" stop-color="#05090d"/></linearGradient><radialGradient id="mAm" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffb347" stop-opacity=".9"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient></defs>';
  g += '<rect y="' + hz + '" width="' + w + '" height="' + (h - hz) + '" fill="url(#mRoad)"/>';
  function row(x0, dir, n) { var o = ''; for (var i = 0; i < n; i++) { var bw = rnd(w * .07, w * .12), bh = h * (.78 - i * .07) * rnd(.85, 1.05), x = x0 + dir * i * w * .085; o += '<rect x="' + (dir > 0 ? x : x - bw) + '" y="' + (hz - bh * .8) + '" width="' + bw + '" height="' + (bh * .8 + 4) + '" fill="#050c13"/>'; for (var k = 0; k < 14; k++) if (Math.random() < .32) { var wx = (dir > 0 ? x : x - bw) + rnd(6, bw - 12), wy = hz - bh * .8 + rnd(10, bh * .78 - 20); o += '<rect x="' + wx.toFixed(0) + '" y="' + wy.toFixed(0) + '" width="7" height="10" fill="#ffb347" opacity="' + rnd(.4, .95).toFixed(2) + '"/><circle cx="' + (wx + 3.5).toFixed(0) + '" cy="' + (wy + 5).toFixed(0) + '" r="16" fill="url(#mAm)" style="mix-blend-mode:screen"/><rect x="' + wx.toFixed(0) + '" y="' + (hz + 6 + (wy - hz + bh) * .05).toFixed(0) + '" width="6" height="' + rnd(30, 80).toFixed(0) + '" fill="#ffb347" opacity=".18" filter="url(#b2)"/>'; } } return o; }
  g += row(-w * .02, 1, 6) + row(w * 1.02, -1, 6);
  var lx = w * .72; g += '<path d="M' + (lx - 6) + ' ' + h * .3 + 'L' + (lx - w * .1) + ' ' + h + 'H' + (lx + w * .1) + 'L' + (lx + 6) + ' ' + h * .3 + 'Z" fill="#ffe2a0" opacity=".16" filter="url(#b6)"/><rect x="' + (lx - 3) + '" y="' + h * .3 + '" width="6" height="' + h * .7 + '" fill="#03070b"/><circle cx="' + lx + '" cy="' + (h * .3) + '" r="' + h * .05 + '" fill="#ffe2a0" opacity=".5" filter="url(#b14)"/><circle cx="' + lx + '" cy="' + (h * .3) + '" r="6" fill="#fff0c8"/>';
  g += '<rect x="' + (lx - 14) + '" y="' + (hz + 20) + '" width="28" height="' + (h - hz - 20) + '" fill="#ffe2a0" opacity=".14" filter="url(#b6)"/>';
  g += '<g style="mix-blend-mode:screen" filter="url(#b14)"><ellipse cx="' + w * .5 + '" cy="' + hz + '" rx="' + w * .35 + '" ry="' + h * .08 + '" fill="#6fa0c0" opacity=".25"/></g>';
  return svgWrap(w, h, g);
}
function ridge(w, y, amp, col, op) { var pts = [[0, y]], n = 9, i; for (i = 1; i <= n; i++) pts.push([w * i / n, y - rnd(0, amp)]); var d = 'M0 ' + y * 2; pts.forEach(function (p, k) { d += (k ? 'L' : 'L') + p[0].toFixed(0) + ' ' + p[1].toFixed(0); }); return '<path d="' + d + 'L' + w + ' ' + y * 2 + 'Z" fill="' + col + '" opacity="' + (op || 1) + '"/>'; }
function artAdventure(w, h) {
  var g = '<defs><radialGradient id="aSun" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff3c8"/><stop offset=".3" stop-color="#ffd27a" stop-opacity=".8"/><stop offset="1" stop-color="#ff9a4a" stop-opacity="0"/></radialGradient></defs>';
  var sx = w * .28, sy = h * .36; g += '<circle cx="' + sx + '" cy="' + sy + '" r="' + Math.min(w, h) * .4 + '" fill="url(#aSun)"/>' + rays(sx, sy, h * 1.1, .9, '#ffe3a0', 7);
  [['#8fa3c8', .34, .15], ['#6a81ad', .46, .17], ['#43597f', .6, .2], ['#24364f', .74, .22]].forEach(function (r, i) { g += ridge(w, h * r[1], h * r[2], r[0], 1) + (i < 3 ? '<g style="mix-blend-mode:screen" filter="url(#b14)"><ellipse cx="' + rnd(0, w).toFixed(0) + '" cy="' + (h * (r[1] + .1)).toFixed(0) + '" rx="' + w * .4 + '" ry="' + h * .03 + '" fill="#ffe7c0" opacity=".28"/></g>' : ''); });
  var tx = w * .64, ty = h * .5; g += '<g fill="#101a2a"><rect x="' + (tx - 22) + '" y="' + (ty - 24) + '" width="8" height="26"/><rect x="' + (tx + 14) + '" y="' + (ty - 24) + '" width="8" height="26"/><rect x="' + (tx - 26) + '" y="' + (ty - 30) + '" width="52" height="7"/><rect x="' + (tx - 18) + '" y="' + (ty - 40) + '" width="36" height="9"/></g>';
  for (var b = 0; b < 5; b++) g += '<path d="M' + (w * .5 + b * 34) + ' ' + (h * .2 + b * 6) + 'q8 -9 16 0 8 -9 16 0" stroke="#0e1522" stroke-width="2" fill="none"/>';
  function palm(x, y, s) { var o = '<path d="M' + x + ' ' + y + 'Q' + (x + 12 * s) + ' ' + (y - 80 * s) + ' ' + (x + 4 * s) + ' ' + (y - 150 * s) + '" stroke="#05100a" stroke-width="' + 7 * s + '" fill="none"/>'; for (var i = 0; i < 7; i++) { var a = -Math.PI / 2 + (i - 3) * .55; o += '<path d="M' + (x + 4 * s) + ' ' + (y - 150 * s) + 'Q' + (x + 4 * s + Math.cos(a) * 60 * s) + ' ' + (y - 150 * s + Math.sin(a) * 60 * s - 20 * s) + ' ' + (x + 4 * s + Math.cos(a) * 110 * s) + ' ' + (y - 150 * s + Math.sin(a) * 90 * s + 30 * s) + '" stroke="#05100a" stroke-width="' + 5 * s + '" fill="none" stroke-linecap="round"/>'; } return o; }
  g += '<g filter="url(#b2)">' + palm(w * .06, h, Math.max(1, h / 700) * 1.5) + palm(w * .95, h, Math.max(1, h / 700) * 1.8) + '<path d="M0 ' + h + 'V' + h * .92 + 'Q' + w * .3 + ' ' + h * .86 + ' ' + w * .55 + ' ' + h * .93 + 'T' + w + ' ' + h * .9 + 'V' + h + 'Z" fill="#050f09"/></g>';
  return svgWrap(w, h, g);
}
function artFantasy(w, h) {
  var g = '<defs><linearGradient id="fAu" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2cffc0" stop-opacity="0"/><stop offset=".5" stop-color="#4cf2c8" stop-opacity=".7"/><stop offset="1" stop-color="#9a6bff" stop-opacity="0"/></linearGradient><linearGradient id="fWf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8fbff"/><stop offset="1" stop-color="#7ad8ff" stop-opacity=".2"/></linearGradient></defs>';
  g += '<g style="mix-blend-mode:screen" filter="url(#b14)">' + [0, 1, 2].map(function (i) { return '<path id="fAu' + i + '" d="M' + (-w * .1) + ' ' + (h * (.16 + i * .08)) + 'Q' + w * .3 + ' ' + (h * (.05 + i * .06)) + ' ' + w * .6 + ' ' + (h * (.2 + i * .05)) + 'T' + w * 1.1 + ' ' + (h * (.14 + i * .07)) + '" stroke="url(#fAu)" stroke-width="' + (h * .07) + '" fill="none" opacity=".55"/>'; }).join('') + '</g>';
  g += '<path d="M0 ' + h + 'V' + h * .8 + 'C' + w * .2 + ' ' + h * .74 + ' ' + w * .45 + ' ' + h * .84 + ' ' + w * .62 + ' ' + h * .66 + 'L' + w * .66 + ' ' + h * .62 + 'H' + w + 'V' + h + 'Z" fill="#0a0626"/>';
  var cx = w * .8, cy = h * .62, s = Math.min(w, h) * .26 / 100;
  g += '<g transform="translate(' + (cx - 50 * s) + ' ' + (cy - 92 * s) + ') scale(' + s + ')" fill="#070320"><path d="M10 92V42H22V30H28V42H40V22L50 6 60 22V42H72V30H78V42H90V92Z"/></g>';
  [[.78, .5], [.825, .5], [.8, .43]].forEach(function (p) { g += '<rect x="' + (w * p[0]) + '" y="' + (h * p[1]) + '" width="' + 4 * s + '" height="' + 8 * s + '" fill="#ffd98a"/>'; });
  var wx = w * .7; g += '<path d="M' + wx + ' ' + h * .64 + 'V' + h * .9 + '" stroke="url(#fWf)" stroke-width="' + w * .018 + '" opacity=".9" filter="url(#b2)"/><g style="mix-blend-mode:screen" filter="url(#b14)"><ellipse cx="' + wx + '" cy="' + h * .91 + '" rx="' + w * .1 + '" ry="' + h * .04 + '" fill="#8fe8ff" opacity=".5"/></g>';
  g += rays(w * .2, -h * .05, h * 1.1, 1.2, '#cdbbff', 6);
  function tree(x, y, hh) { return '<path d="M' + x + ' ' + y + 'l-' + hh * .22 + ' -' + hh * .5 + 'h' + hh * .1 + 'l-' + hh * .18 + ' -' + hh * .4 + 'h' + hh * .1 + 'L' + x + ' ' + (y - hh) + 'l' + hh * .1 + ' ' + hh * .2 + 'h' + hh * .1 + 'l' + hh * .08 + ' ' + hh * .4 + 'h' + hh * .1 + 'Z" fill="#05021a"/>'; }
  g += '<g filter="url(#b2)">' + tree(w * .05, h, h * .55) + tree(w * .14, h, h * .38) + tree(w * .96, h, h * .5) + '</g>' + bokeh(18, 0, h * .55, w, h, ['#9be7ff', '#e0b8ff', '#fff2b0'], 2, 6);
  return svgWrap(w, h, g);
}
var SC = {
    'default': { bg: 'radial-gradient(120% 90% at 20% 10%,#2a1850 0,#120a24 55%,#07060a 100%)', fx: 'sparkle', light: '255,214,150', dim: .25 },
    darkromance: { bg: 'linear-gradient(#0c0408,#1d0610 60%,#0d0307)', art: artDarkRomance, fx: 'petals', light: '255,150,80', dim: .5, hint: 'Tap the candles to blow them out. Tap anywhere for petals.' },
    horror: { bg: 'linear-gradient(#02070b,#0b1f2c 60%,#071118)', art: artHorror, fx: 'fog', light: '170,225,255', dim: .42, flash: true, grade: ['rgba(20,50,70,.3)', 'multiply'] },
    romance: { bg: 'linear-gradient(#2b1040 0,#8a2d6b 26%,#e8627a 48%,#ffb27a 66%,#2a1228 67%,#120816 100%)', art: artRomance, fx: 'petals', petals: ['#ffb4c4', '#ff8fab', '#ffd9c8', '#ff6f91', '#fff0f0'], light: '255,200,160', dim: .3, grade: ['rgba(255,150,120,.16)', 'soft-light'] },
    adventure: { bg: 'linear-gradient(#f9a755 0,#f6c98a 28%,#cfd9e8 52%,#8fa3c8 100%)', art: artAdventure, fx: 'dust', light: '255,225,160', dim: .38, grade: ['rgba(255,180,90,.12)', 'soft-light'] },
    fantasy: { bg: 'linear-gradient(#070824,#241a60 55%,#5a37b0)', art: artFantasy, fx: 'fireflies', light: '200,180,255', dim: .32, grade: ['rgba(120,90,255,.12)', 'soft-light'] },
    scifi: { bg: 'radial-gradient(120% 90% at 70% 20%,#0b2d66 0,#050c26 60%,#02030c 100%)', art: artSciFi, fx: 'stars', light: '140,210,255', dim: .3 },
    mystery: { bg: 'linear-gradient(#050d16,#0f2a38 60%,#070f16)', art: artMystery, fx: 'rain', light: '255,236,170', dim: .4, grade: ['rgba(30,80,110,.22)', 'multiply'] },
    thriller: { bg: 'linear-gradient(#08102c,#2a0d18 70%,#140508)', fx: 'rain', light: '255,110,110', dim: .45, siren: true },
    psych: { bg: 'radial-gradient(100% 80% at 50% 40%,#4a1a7a 0,#1b0e45 60%,#0a0620 100%)', fx: 'rings', light: '230,170,255', dim: .3 },
    humor: { bg: 'linear-gradient(150deg,#ff9f1c,#ff4f8b)', fx: 'confetti', light: '255,255,255', dim: .12 },
    drama: { bg: 'linear-gradient(#2b1408,#6b3a14 70%,#2b1408)', art: artDrama, fx: 'dust', light: '255,225,160', dim: .35 },
    bedtime: { bg: 'linear-gradient(#171347,#4a3fa8 70%,#2b2370)', art: artBedtime, fx: 'stars', light: '220,215,255', dim: .22 }
  };
  SC.friends = SC.romance; SC.animals = SC.fantasy; SC.hero = SC.thriller;

  /* ---------------------------------------------------- particles */
  var P = [], mode = '', last = 0, rafId = 0, flashT = 0, sirenA = 0;
  var LIMIT = { petals: 60, hearts: 40, fireflies: 46, stars: 90, rain: 140, fog: 6, rings: 8, confetti: 44, dust: 60, sparkle: 50 };
  function spawn(m, x, y, burst) {
    var p = { m: m, x: x == null ? rnd(0, W) : x, y: y == null ? rnd(-20, H) : y, a: rnd(0, 6.28), life: 0, max: rnd(6, 14), s: rnd(.7, 1.5) };
    if (m === 'petals') { p.x = x == null ? rnd(0, W) : x; p.y = y == null ? -20 : y; p.vx = rnd(-18, 18); p.vy = rnd(30, 70); p.rot = rnd(-2, 2); p.col = pick((SC[state.key] && SC[state.key].petals) || ['#c81d3c', '#a3102c', '#e0294a', '#7a0f27', '#b3122e']); p.sz = rnd(8, 15); p.ph = rnd(0, 6.28); if (burst) { p.vx = rnd(-160, 160); p.vy = rnd(-220, -40); } }
    else if (m === 'hearts') { p.x = x == null ? rnd(0, W) : x; p.y = y == null ? H + 20 : y; p.vx = rnd(-14, 14); p.vy = -rnd(30, 70); p.sz = rnd(8, 22); p.col = pick(['rgba(255,255,255,.75)', 'rgba(255,170,200,.8)', 'rgba(255,100,150,.7)']); p.ph = rnd(0, 6.28); if (burst) { p.vx = rnd(-120, 120); p.vy = -rnd(60, 200); } }
    else if (m === 'fireflies') { p.vx = rnd(-12, 12); p.vy = rnd(-12, 12); p.sz = rnd(1.5, 3.4); p.ph = rnd(0, 6.28); p.col = pick(['255,236,150', '190,170,255', '170,255,230']); if (burst) { p.vx = rnd(-120, 120); p.vy = rnd(-120, 120); p.max = 3; } }
    else if (m === 'stars') { p.z = rnd(.2, 1); p.sz = p.z * 1.8; p.vx = -p.z * 6; p.vy = 0; p.ph = rnd(0, 6.28); }
    else if (m === 'rain') { p.x = rnd(0, W); p.y = -20; p.vy = rnd(520, 800); p.vx = -60; p.len = rnd(10, 22); }
    else if (m === 'fog') { p.x = rnd(-.2 * W, W); p.y = rnd(H * .5, H); p.r = rnd(W * .25, W * .45); p.vx = rnd(6, 16); p.vy = 0; p.max = 999; }
    else if (m === 'rings') { p.x = x == null ? rnd(0, W) : x; p.y = y == null ? rnd(0, H) : y; p.r = 4; p.vr = rnd(50, 90); p.max = rnd(4, 6); }
    else if (m === 'confetti') { p.x = x == null ? rnd(0, W) : x; p.y = y == null ? -10 : y; p.vx = rnd(-30, 30); p.vy = rnd(40, 100); p.sz = rnd(5, 10); p.rot = rnd(-4, 4); p.col = pick(['#fff', '#7c3aed', '#ffe066', '#00c2a8', '#ff3d81']); p.ph = rnd(0, 6.28); if (burst) { p.vx = rnd(-220, 220); p.vy = rnd(-260, -60); } }
    else if (m === 'dust') { p.vx = rnd(-6, 6); p.vy = rnd(-8, 4); p.sz = rnd(.8, 2.2); p.ph = rnd(0, 6.28); }
    else if (m === 'sparkle') { p.vx = rnd(-8, 8); p.vy = rnd(-14, -4); p.sz = rnd(1, 3.2); p.col = pick(['255,226,150', '255,190,225', '200,190,255']); p.ph = rnd(0, 6.28); if (burst) { p.vx = rnd(-140, 140); p.vy = rnd(-140, 140); p.max = 2.5; } }
    else if (m === 'ember') { p.vx = rnd(-8, 8); p.vy = -rnd(30, 70); p.sz = rnd(1, 2.4); p.max = rnd(1.5, 3.2); }
    P.push(p);
  }
  function drawPetal(p) {
    var f = Math.cos(p.ph * 2 + p.life * 3);
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.scale(1, .45 + .55 * Math.abs(f)); ctx.fillStyle = p.col; ctx.globalAlpha = Math.min(1, (p.max - p.life) * .8);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(p.sz * .2, -p.sz * .8, p.sz * 1.1, -p.sz * .6, p.sz, p.sz * .1); ctx.bezierCurveTo(p.sz * .8, p.sz * .9, p.sz * .2, p.sz, 0, 0); ctx.fill(); ctx.restore();
  }
  function drawHeart(p) {
    var s = p.sz; ctx.save(); ctx.translate(p.x, p.y); ctx.globalAlpha = Math.min(1, (p.max - p.life) * .6); ctx.fillStyle = p.col; ctx.beginPath();
    ctx.moveTo(0, s * .3); ctx.bezierCurveTo(-s, -s * .4, -s * .4, -s, 0, -s * .45); ctx.bezierCurveTo(s * .4, -s, s, -s * .4, 0, s * .3); ctx.fill(); ctx.restore();
  }
  function step(dt, t) {
    var cfg = SC[state.key] || SC['default'], lim = LIMIT[mode] || 40;
    if (!reduce) {
      var count = P.filter(function (p) { return p.m === mode; }).length;
      var rate = { petals: 6, hearts: 5, fireflies: 3, stars: 80, rain: 90, fog: 2, rings: .35, confetti: 5, dust: 8, sparkle: 6 }[mode] || 0;
      if (mode === 'stars' && count < lim) while (count++ < lim) spawn('stars', rnd(0, W), rnd(0, H));
      else if (mode === 'fog' && count < 6) spawn('fog');
      else if (mode === 'rain' && count < lim) for (var i = 0; i < rate * dt && count < lim; i++) spawn('rain');
      else if (count < lim && Math.random() < rate * dt) spawn(mode, mode === 'fireflies' || mode === 'dust' ? undefined : undefined);
      if (state.key === 'darkromance') state.candles.forEach(function (c) { if (c.on && Math.random() < 2 * dt) { var r = cvPos(c); spawn('ember', r.x + rnd(-3, 3), r.y); } });
    }
    ctx.clearRect(0, 0, W, H);
    for (var k = P.length - 1; k >= 0; k--) {
      var p = P[k]; p.life += dt; var dead = p.life > p.max;
      if (p.m === 'petals') { p.x += (p.vx + Math.sin(t * 1.3 + p.ph) * 30 + windX(p)) * dt; p.y += p.vy * dt; p.a += p.rot * dt; if (p.vy < 70) p.vy += 0; if (p.burst) p.vy += 200 * dt; if (p.y > H + 20) dead = true; drawPetal(p); if (p.vy < 0) p.vy += 260 * dt; }
      else if (p.m === 'hearts') { p.x += (p.vx + Math.sin(t + p.ph) * 14) * dt; p.y += p.vy * dt; if (p.vy > -40) p.vy -= 4 * dt; if (p.y < -30) dead = true; drawHeart(p); }
      else if (p.m === 'fireflies') { p.x += (p.vx + Math.sin(t * .8 + p.ph) * 10) * dt; p.y += (p.vy + Math.cos(t * .7 + p.ph) * 10) * dt; if (p.x < -10) p.x = W + 10; if (p.x > W + 10) p.x = -10; if (p.y < -10) p.y = H + 10; if (p.y > H + 10) p.y = -10; var a = .35 + .65 * Math.abs(Math.sin(t * 1.4 + p.ph)); ctx.fillStyle = 'rgba(' + p.col + ',' + a + ')'; ctx.shadowColor = 'rgba(' + p.col + ',1)'; ctx.shadowBlur = 12; ctx.beginPath(); ctx.arc(p.x, p.y, p.sz, 0, 6.3); ctx.fill(); ctx.shadowBlur = 0; if (p.max < 50 && p.life > p.max) dead = true; else dead = false; }
      else if (p.m === 'stars') { p.x += p.vx * dt; if (p.x < 0) p.x = W; ctx.fillStyle = 'rgba(255,255,255,' + (.35 + .65 * Math.abs(Math.sin(t * p.z + p.ph))) * p.z + ')'; ctx.fillRect(p.x, p.y, p.sz, p.sz); dead = false; }
      else if (p.m === 'rain') { p.x += p.vx * dt; p.y += p.vy * dt; ctx.strokeStyle = 'rgba(190,220,240,.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + 3, p.y - p.len); ctx.stroke(); dead = p.y > H; }
      else if (p.m === 'fog') { p.x += p.vx * dt; var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r); g.addColorStop(0, 'rgba(170,200,210,.10)'); g.addColorStop(1, 'rgba(170,200,210,0)'); ctx.fillStyle = g; ctx.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2); if (p.x - p.r > W) { p.x = -p.r; } dead = false; }
      else if (p.m === 'rings') { p.r += p.vr * dt; ctx.strokeStyle = 'rgba(230,170,255,' + Math.max(0, .5 - p.life / p.max * .5) + ')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.3); ctx.stroke(); }
      else if (p.m === 'confetti') { p.x += (p.vx + Math.sin(t * 2 + p.ph) * 20) * dt; p.y += p.vy * dt; p.a += p.rot * dt; p.vy += (p.vy < 90 ? 120 : 0) * dt; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.col; ctx.globalAlpha = .9; ctx.fillRect(-p.sz / 2, -p.sz / 4, p.sz, p.sz / 2); ctx.restore(); dead = p.y > H + 20; }
      else if (p.m === 'dust') { p.x += (p.vx + Math.sin(t * .5 + p.ph) * 4) * dt; p.y += p.vy * dt; if (p.x < 0) p.x = W; if (p.x > W) p.x = 0; if (p.y < 0) p.y = H; if (p.y > H) p.y = 0; ctx.fillStyle = 'rgba(255,230,170,' + (.2 + .3 * Math.abs(Math.sin(t + p.ph))) + ')'; ctx.beginPath(); ctx.arc(p.x, p.y, p.sz, 0, 6.3); ctx.fill(); dead = false; }
      else if (p.m === 'sparkle') { p.x += p.vx * dt; p.y += p.vy * dt; var al = Math.max(0, 1 - p.life / p.max) * (.5 + .5 * Math.sin(t * 3 + p.ph)); ctx.fillStyle = 'rgba(' + p.col + ',' + al + ')'; ctx.beginPath(); ctx.arc(p.x, p.y, p.sz, 0, 6.3); ctx.fill(); }
      else if (p.m === 'ember') { p.x += p.vx * dt; p.y += p.vy * dt; ctx.fillStyle = 'rgba(255,180,90,' + Math.max(0, 1 - p.life / p.max) + ')'; ctx.fillRect(p.x, p.y, p.sz, p.sz); }
      if (dead) { if (p.m === mode && p.m !== 'petals' && p.m !== 'hearts' && p.m !== 'confetti' && p.m !== 'sparkle' && p.m !== 'rain' && p.m !== 'rings') { p.life = 0; } else P.splice(k, 1); }
    }
    if (cfg.flash) { flashT -= dt; if (flashT < 0 && Math.random() < .004) flashT = .35; if (flashT > 0) { ctx.fillStyle = 'rgba(200,225,255,' + Math.min(.22, flashT * .6) + ')'; ctx.fillRect(0, 0, W, H); } }
    if (cfg.siren) { sirenA += dt * 1.6; var sx = W / 2 + Math.cos(sirenA) * W * .7, g2 = ctx.createRadialGradient(sx, H * .2, 0, sx, H * .2, W * .6), red = Math.sin(sirenA) > 0; g2.addColorStop(0, red ? 'rgba(255,40,60,.16)' : 'rgba(60,110,255,.16)'); g2.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H); }
  }
  function windX(p) { if (!state.down && !state.moved) return 0; var dx = p.x - state.px * W, dy = p.y - state.py * H, d = Math.sqrt(dx * dx + dy * dy); return d < 160 ? (dx / (d + 1)) * (160 - d) * .9 : 0; }
  function cvPos(c) { var r = layers[cur].svg ? layers[cur].svg.getBoundingClientRect() : { left: 0, top: 0, width: W, height: H }; var vb = layers[cur].vb || { w: W, h: H }; var sc = Math.max(r.width / vb.w, r.height / vb.h), ox = r.left + (r.width - vb.w * sc) / 2, oy = r.top + (r.height - vb.h * sc) / 2; return { x: ox + c.x * sc, y: oy + c.y * sc }; }

  /* ---------------------------------------------------- loop, flames, pointer */
  function loop(ts) {
    rafId = requestAnimationFrame(loop); if (document.hidden) { last = ts; return; }
    var dt = Math.min(.05, (ts - last) / 1000 || .016); last = ts; var t = ts / 1000;
    state.px += (state.tx - state.px) * Math.min(1, dt * 6); state.py += (state.ty - state.py) * Math.min(1, dt * 6);
    if (lightEl) { var cfg = SC[state.key] || SC['default']; lightEl.style.background = 'radial-gradient(circle ' + (state.key === 'mystery' ? 190 : 300) + 'px at ' + (state.px * 100).toFixed(1) + '% ' + (state.py * 100).toFixed(1) + '%,rgba(' + cfg.light + ',' + (state.key === 'mystery' ? .3 : .2) + '),rgba(' + cfg.light + ',0) 70%)'; }
    var L = layers[cur], dx = (state.px - .5) * -16, dy = (state.py - .5) * -10;
    if (L) { if (L.svg) L.svg.style.transform = 'translate3d(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px,0)'; if (L.bgd) L.bgd.style.transform = 'translate3d(' + (dx * .4).toFixed(1) + 'px,' + (dy * .4).toFixed(1) + 'px,0)'; }
    if (state.key === 'darkromance' && L && L.svg) {
      state.candles.forEach(function (c) {
        var fl = L.svg.querySelector('#fl' + c.id), gl = L.svg.querySelector('#gl' + c.id); if (!fl) return;
        c.lvl = (c.lvl == null ? 1 : c.lvl); c.lvl += ((c.on ? 1 : 0) - c.lvl) * Math.min(1, dt * 7);
        var fk = (.9 + .12 * Math.sin(t * 9 + c.x) + .08 * Math.sin(t * 23 + c.y)) * c.lvl;
        fl.setAttribute('opacity', c.lvl.toFixed(2)); fl.style.transform = 'scale(' + (.92 + .1 * Math.sin(t * 11 + c.x)).toFixed(3) + ',' + Math.max(.01, fk).toFixed(3) + ') skewX(' + (Math.sin(t * 7 + c.y) * 5).toFixed(1) + 'deg)'; fl.style.transformOrigin = '0 0';
        if (gl) gl.setAttribute('opacity', (Math.max(0, fk) * .95).toFixed(2));
      });
      var dr0 = 0; var dr = L.svg.querySelector('#dDragon'); if (dr) { state.dragonT += dt; var cyc = state.dragonT % 38, p2 = cyc < 9 ? cyc / 9 : -1; dr.style.opacity = p2 < 0 ? 0 : .95; if (p2 >= 0) dr.style.transform = 'translateX(' + ((p2 - .1) * 360).toFixed(0) + 'px) translateY(' + (Math.sin(p2 * 6) * 10).toFixed(0) + 'px)'; }
    }
    if (L && L.svg && state.key === 'horror') { $$w(L.svg, '.ss-win').forEach(function (e) { e.style.opacity = (.55 + .45 * Math.sin(t * 3.1 + +e.getAttribute('data-i') * 2.3) * Math.sin(t * 7.7 + +e.getAttribute('data-i'))).toFixed(2); }); var hf = L.svg.querySelector('#hFog'); if (hf) hf.style.transform = 'translateX(' + (Math.sin(t * .08) * 40).toFixed(1) + 'px)'; }
    if (L && L.svg && state.key === 'fantasy') { for (var au = 0; au < 3; au++) { var ae = L.svg.querySelector('#fAu' + au); if (ae) ae.setAttribute('opacity', (.35 + .3 * Math.sin(t * .35 + au * 1.7)).toFixed(2)); } }
    step(dt, t);
  }
  function $$w(r, s) { return Array.prototype.slice.call(r.querySelectorAll(s)); }
  function resize() {
    DPR = Math.min(2, window.devicePixelRatio || 1); W = window.innerWidth; H = window.innerHeight; canvas.width = W * DPR; canvas.height = H * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    var L = layers[cur]; if (L && L.key) build(L, L.key, true);
  }
  function build(L, key, keepOpacity) {
    var cfg = SC[key] || SC['default']; L.key = key; L.bgd.style.background = cfg.bg;
    var old = L.el.querySelector('.ss-svg'); if (old) old.remove(); L.svg = null;
    if (cfg.art) { var tmp = document.createElement('div'); tmp.innerHTML = cfg.art(W, H); L.svg = tmp.firstChild; L.vb = { w: W, h: H }; L.el.appendChild(L.svg); }
    var ph = L.el.querySelector('.ss-photo'); if (ph) ph.remove(); var url = photoUrl(key);
    if (url) { var im = new Image(); im.onload = function () { if (L.key !== key) return; var d = document.createElement('div'); d.className = 'ss-photo'; d.style.backgroundImage = 'url(' + url + ')'; L.el.insertBefore(d, L.bgd.nextSibling); requestAnimationFrame(function () { d.classList.add('in'); }); if (PH[key] && PH[key].replaceArt !== false && L.svg) { L.svg.style.display = 'none'; L.svg = null; state.candles = []; } }; im.onerror = function () {}; im.src = url; }
  }
  function setScene(key, opts) {
    if (!root) return; var cfg = SC[key] || SC['default']; if (key === state.key && root.classList.contains('on')) return;
    var nxt = 1 - cur, L = layers[nxt]; build(L, SC[key] ? key : 'default'); state.key = SC[key] ? key : 'default';
    L.el.classList.add('show'); layers[cur].el.classList.remove('show'); cur = nxt;
    mode = cfg.fx; P = P.filter(function (p) { return p.m === 'ember' || p.m === 'petals' && mode === 'petals'; });
    gradeEl.style.background = cfg.grade ? cfg.grade[0] : 'transparent'; gradeEl.style.mixBlendMode = cfg.grade ? cfg.grade[1] : 'normal';
    dimEl.style.background = 'radial-gradient(ellipse at 50% 45%,rgba(0,0,0,' + (cfg.dim || .3) + ') 20%,rgba(0,0,0,' + Math.max(0, (cfg.dim || .3) - .25) + ') 100%)';
    if (!root.classList.contains('on')) { root.classList.add('on'); document.documentElement.classList.add('ss-scene-on'); }
    if (cfg.hint) showHint(cfg.hint); else hideHint();
  }
  function photoUrl(key) { var m = PH[key]; if (!m) return ''; var mob = W < 760 && m.mobile; return 'scenes/' + key + (mob ? '-m' : '') + '.' + (AVIF && m.avif ? 'avif' : 'webp'); }
  function loadManifest() { try { fetch('scenes/manifest.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : {}; }).then(function (j) { PH = j && typeof j === 'object' ? j : {}; }).catch(function () {}); var a = new Image(); a.onload = function () { AVIF = a.width > 0; }; a.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQAMAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A='; } catch (e) {} }
  function hideScene() { if (!root) return; root.classList.remove('on'); document.documentElement.classList.remove('ss-scene-on'); state.key = ''; hideHint(); }
  var hintT = 0; function showHint(t) { if (!hint) return; hint.textContent = t; hint.classList.add('on'); clearTimeout(hintT); hintT = setTimeout(hideHint, 6000); } function hideHint() { if (hint) hint.classList.remove('on'); }
  function interactive(el) { return el && el.closest && el.closest('button,a,input,select,textarea,summary,label,.tile,.ss-tile'); }
  function point(e) { var t = e.touches ? e.touches[0] : e; if (!t) return; state.tx = t.clientX / W; state.ty = t.clientY / H; state.moved = true; }
  function down(e) {
    point(e); state.down = true; var t = e.touches ? e.touches[0] : e; if (!t || interactive(e.target)) return; var x = t.clientX, y = t.clientY;
    if (state.key === 'darkromance') {
      for (var i = 0; i < state.candles.length; i++) { var c = state.candles[i], cp = cvPos(c); if (Math.hypot(cp.x - x, cp.y - y) < Math.max(34, c.r * (W < 700 ? .9 : 1.3))) { c.on = !c.on; if (!c.on) for (var k = 0; k < 6; k++) { var s = { m: 'ember', x: cp.x, y: cp.y, a: 0, life: 0, max: 2.4, s: 1, vx: rnd(-6, 6), vy: -rnd(14, 34), sz: rnd(2, 4) }; P.push(s); } return; } }
      for (var j = 0; j < 14; j++) { spawn('petals', x + rnd(-10, 10), y + rnd(-10, 10), true); P[P.length - 1].burst = true; }
    } else if (mode === 'hearts' || mode === 'confetti' || mode === 'sparkle' || mode === 'fireflies') { for (var m = 0; m < 14; m++) { spawn(mode, x, y, true); } }
    else if (mode === 'rings') { spawn('rings', x, y); spawn('rings', x, y); }
  }
  function init() {
    if (root) return; root = document.createElement('div'); root.id = 'ss-scene'; root.setAttribute('aria-hidden', 'true');
    for (var i = 0; i < 2; i++) { var el = document.createElement('div'); el.className = 'ss-layer'; var bgd = document.createElement('div'); bgd.className = 'ss-bgd'; el.appendChild(bgd); root.appendChild(el); layers.push({ el: el, bgd: bgd }); }
    canvas = document.createElement('canvas'); root.appendChild(canvas); ctx = canvas.getContext('2d');
    lightEl = document.createElement('div'); lightEl.className = 'ss-light'; root.appendChild(lightEl); gradeEl = document.createElement('div'); gradeEl.className = 'ss-grade'; root.appendChild(gradeEl); dimEl = document.createElement('div'); dimEl.className = 'ss-dim'; root.appendChild(dimEl);
    var vg = document.createElement('div'); vg.className = 'ss-vig'; root.appendChild(vg); var gr = document.createElement('div'); gr.className = 'ss-grain'; root.appendChild(gr);
    try { var nc = document.createElement('canvas'); nc.width = nc.height = 96; var nx = nc.getContext('2d'), im = nx.createImageData(96, 96); for (var q = 0; q < im.data.length; q += 4) { var v = Math.random() * 255; im.data[q] = im.data[q + 1] = im.data[q + 2] = v; im.data[q + 3] = 255; } nx.putImageData(im, 0, 0); root.style.setProperty('--grain', 'url(' + nc.toDataURL() + ')'); } catch (e) {}
    document.body.insertBefore(root, document.body.firstChild); hint = document.createElement('div'); hint.id = 'ss-hint'; hint.setAttribute('role', 'status'); document.body.appendChild(hint);
    loadManifest(); resize(); var rt = 0; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(resize, 180); });
    window.addEventListener('pointermove', point, { passive: true }); window.addEventListener('touchmove', point, { passive: true }); window.addEventListener('pointerdown', down, { passive: true });
    window.addEventListener('pointerup', function () { state.down = false; }, { passive: true });
    if (!reduce) rafId = requestAnimationFrame(loop); else { step(.016, 0); }
  }
  window.SSScene = {
    init: init,
    preview: function (key) { if (!root) init(); if (!state.locked) setScene(key || 'default'); },
    lock: function (key) { if (!root) init(); state.locked = key || ''; setScene(key || 'default'); },
    unlock: function () { state.locked = ''; hideScene(); },
    _state: state
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
