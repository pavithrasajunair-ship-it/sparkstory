/* Home page photo carousel: swipe or drag, arrows, dots, keyboard, gentle autoplay. */
(function () {
  "use strict";
  var hero = document.getElementById("hero"); if (!hero) return;
  var track = document.getElementById("hslides"), slides = [].slice.call(track.children), dots = [].slice.call(document.querySelectorAll(".hdot")), dotWrap = document.getElementById("hdots");
  var n = slides.length, i = 0, timer = null, MS = 6000, startX = 0, startY = 0, dx = 0, dragging = false, locked = false;
  var calm = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function visible() { var s = document.getElementById("s-home"); return s && !s.hidden && !document.hidden; }
  function go(k) {
    i = (k + n) % n; track.style.transform = "translateX(" + (-i * 100) + "%)";
    slides.forEach(function (s, j) { s.classList.toggle("on", j === i); s.setAttribute("aria-hidden", j === i ? "false" : "true"); });
    dots.forEach(function (d, j) { d.classList.remove("on"); void d.offsetWidth; d.classList.toggle("on", j === i); d.setAttribute("aria-current", j === i ? "true" : "false"); });
    arm();
  }
  function arm() { clearTimeout(timer); if (calm) return; dotWrap.style.setProperty("--hms", MS + "ms"); timer = setTimeout(function () { if (visible() && !dragging) go(i + 1); else arm(); }, MS); }
  function pause(p) { dotWrap.classList.toggle("paused", p); if (p) clearTimeout(timer); else arm(); }
  document.getElementById("hnext").addEventListener("click", function () { go(i + 1); });
  document.getElementById("hprev").addEventListener("click", function () { go(i - 1); });
  dots.forEach(function (d) { d.addEventListener("click", function () { go(+d.dataset.go); }); });
  hero.addEventListener("keydown", function (e) { if (e.key === "ArrowRight") go(i + 1); else if (e.key === "ArrowLeft") go(i - 1); });
  hero.addEventListener("mouseenter", function () { pause(true); }); hero.addEventListener("mouseleave", function () { if (!dragging) pause(false); });
  /* swipe / drag (touch + mouse + pen) */
  hero.addEventListener("pointerdown", function (e) {
    if (e.target.closest("button")) return;
    dragging = true; locked = false; startX = e.clientX; startY = e.clientY; dx = 0; track.classList.add("drag"); pause(true);
  });
  window.addEventListener("pointermove", function (e) {
    if (!dragging) return; dx = e.clientX - startX; var dy = e.clientY - startY;
    if (!locked && Math.abs(dy) > Math.abs(dx) + 6) { dragging = false; track.classList.remove("drag"); go(i); return; }
    locked = true; var w = hero.clientWidth || 1, resist = ((i === 0 && dx > 0) || (i === n - 1 && dx < 0)) ? 0.35 : 1;
    track.style.transform = "translateX(calc(" + (-i * 100) + "% + " + dx * resist + "px))";
  });
  function end() {
    if (!dragging) return; dragging = false; track.classList.remove("drag");
    var w = hero.clientWidth || 1;
    if (dx < -Math.min(70, w * 0.15)) go(i + 1); else if (dx > Math.min(70, w * 0.15)) go(i - 1); else go(i);
    pause(false);
  }
  window.addEventListener("pointerup", end); window.addEventListener("pointercancel", end);
  hero.addEventListener("dragstart", function (e) { e.preventDefault(); });
  document.addEventListener("visibilitychange", function () { if (!document.hidden) arm(); });
  go(0);
})();
