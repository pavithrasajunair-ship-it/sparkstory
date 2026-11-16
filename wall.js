/* Story wall: people post their own stories (or a StorySpark story). Posts wait for approval before they show. */
(function () {
  "use strict";
  var URL = "https://nswefeevszufjabohjpw.supabase.co", KEY = "sb_publishable_-3pJI8HCgnJiM7GyaCemFw_rCl034TI";
  var $ = function (id) { return document.getElementById(id); };
  var SS = function () { return window.__SS; };
  var NAMES = { tiny: "Little ones", kids: "Kids", teens: "Teens", adult: "Grown-ups 18+" };
  var tab = "family", cache = {}, current = null;
  function hdr(extra) { var h = { apikey: KEY, Authorization: "Bearer " + KEY }; for (var k in extra) h[k] = extra[k]; return h; }
  function open(name) { var s = SS(); s.state.fromLib = false; s.show(name); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  /* ---------- the wall ---------- */
  function load() {
    var list = $("wall-list"), msg = $("wall-msg"); list.textContent = ""; msg.textContent = "Loading stories..."; msg.hidden = false;
    var tiers = tab === "family" ? "tiny,kids,teens" : "adult";
    fetch(URL + "/rest/v1/wall_stories?select=id,title,author,tier,body,created_at&tier=in.(" + tiers + ")&order=created_at.desc&limit=40", { headers: hdr({}) })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (rows) {
        cache = {}; rows.forEach(function (r) { cache[r.id] = r; });
        msg.hidden = rows.length > 0; msg.textContent = "No stories here yet. Be the first to share one!";
        rows.forEach(function (r) {
          var c = el("button", "wcard"); c.type = "button";
          c.appendChild(el("span", "wtier", NAMES[r.tier] || ""));
          c.appendChild(el("b", "wtitle", r.title));
          c.appendChild(el("span", "wby", "by " + r.author));
          c.appendChild(el("span", "wex", r.body.replace(/\s+/g, " ").slice(0, 140) + "..."));
          c.addEventListener("click", function () { read(r.id); });
          list.appendChild(c);
        });
      })
      .catch(function () { msg.hidden = false; msg.textContent = "The wall could not load right now. Check your connection and try again."; });
  }
  function read(id) {
    var r = cache[id]; if (!r) return; current = r;
    $("wall-reader-title").textContent = r.title; $("wall-reader-by").textContent = "by " + r.author + " · " + (NAMES[r.tier] || "");
    var body = $("wall-reader-body"); body.textContent = "";
    r.body.split(/\n{1,}/).filter(Boolean).forEach(function (p) { body.appendChild(el("p", "", p)); });
    $("wall-list-wrap").hidden = true; $("wall-reader").hidden = false; window.scrollTo(0, 0);
  }
  function showWall() {
    var s = SS(); s.state.fromLib = false; s.show("wall");
    document.documentElement.setAttribute("data-tier", "");
    $("wall-reader").hidden = true; $("wall-list-wrap").hidden = false; load();
    try { if (location.hash !== "#wall") history.replaceState(null, "", "#wall"); } catch (e) {}
  }
  function setTab(t) {
    tab = t; [].forEach.call(document.querySelectorAll(".wtab"), function (b) { var on = b.dataset.tab === t; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on ? "true" : "false"); });
    load();
  }

  /* ---------- posting ---------- */
  var DAY = 86400000;
  function recent() { try { return JSON.parse(localStorage.getItem("storyspark:posts") || "[]").filter(function (t) { return Date.now() - t < DAY; }); } catch (e) { return []; } }
  function problem(title, body) {
    if (title.length < 3) return "Please give your story a title (at least 3 letters).";
    if (body.length < 200) return "Your story is a bit short. Please write at least 200 characters (about 40 words).";
    if (body.length > 8000) return "Your story is too long. The limit is 8000 characters.";
    if (/https?:\/\/|www\.|\S+@\S+\.\S+|(\+?\d[\s-]?){9,}/i.test(title + " " + body)) return "Please remove links, email addresses and phone numbers. Keep personal details out of stories.";
    return "";
  }
  function showPost(pre) {
    var s = SS(); s.state.fromLib = false; s.show("post");
    document.documentElement.setAttribute("data-tier", "");
    $("post-status").textContent = ""; $("post-status").className = "fine";
    if (pre) { $("post-title").value = pre.title || ""; $("post-body").value = pre.body || ""; if (pre.tier) $("post-tier").value = pre.tier; }
    count();
  }
  function count() { var n = $("post-body").value.length; $("post-count").textContent = n + " / 8000"; }
  function submit(e) {
    e.preventDefault();
    var st = $("post-status"); st.className = "fine";
    if ($("post-website").value) return;                      // hidden trap field: real people leave it empty
    var title = $("post-title").value.trim(), body = $("post-body").value.trim(), author = $("post-author").value.trim().slice(0, 40) || "A StorySpark reader", tier = $("post-tier").value;
    var p = problem(title, body); if (p) { st.textContent = p; st.className = "fine wbad"; return; }
    if (!$("post-ok").checked) { st.textContent = "Please tick the box to confirm this story is yours to share."; st.className = "fine wbad"; return; }
    if (recent().length >= 3) { st.textContent = "You have shared 3 stories today. Please come back tomorrow."; st.className = "fine wbad"; return; }
    var btn = $("post-send"); btn.disabled = true; st.textContent = "Sending...";
    fetch(URL + "/rest/v1/wall_stories", { method: "POST", headers: hdr({ "Content-Type": "application/json", Prefer: "return=minimal" }), body: JSON.stringify({ title: title, author: author, tier: tier, body: body }) })
      .then(function (r) {
        if (!r.ok) return r.text().then(function (t) { throw new Error(t); });
        try { var a = recent(); a.push(Date.now()); localStorage.setItem("storyspark:posts", JSON.stringify(a)); } catch (x) {}
        $("post-form").reset(); count();
        st.textContent = "Thank you! Your story was sent. It will appear on the wall after it has been checked.";
        st.className = "fine wgood";
      })
      .catch(function (e) { var m = String((e && e.message) || ""); st.textContent = /wall_duplicate/.test(m) ? "That story (or one with the same title) is already on the list." : /wall_busy/.test(m) ? "The wall is full of stories waiting to be checked. Please try again tomorrow." : "Sorry, your story could not be sent. Please try again in a moment."; st.className = "fine wbad"; })
      .then(function () { btn.disabled = false; });
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (!$("s-wall")) return;
    document.addEventListener("click", function (e) { if (location.hash === "#wall" && e.target.closest && e.target.closest("#brand,[data-back],[data-start],#btn-lib,#t-wall")) { try { history.replaceState(null, "", location.pathname + location.search); } catch (x) {} } }, true);
    if (location.hash === "#wall") setTimeout(showWall, 0);
    [].forEach.call(document.querySelectorAll("[data-wall]"), function (b) { b.addEventListener("click", showWall); });
    $("wall-post-btn").addEventListener("click", function () { showPost(); });
    [].forEach.call(document.querySelectorAll(".wtab"), function (b) { b.addEventListener("click", function () { setTab(b.dataset.tab); }); });
    $("wall-reader-back").addEventListener("click", function () { $("wall-reader").hidden = true; $("wall-list-wrap").hidden = false; });
    $("wall-reader-copy").addEventListener("click", function () { if (!current) return; var t = current.title + "\n\n" + current.body; var b = $("wall-reader-copy"); (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { b.textContent = "Copied!"; }, function () { b.textContent = "Select the text to copy"; }); setTimeout(function () { b.textContent = "📋 Copy story"; }, 1800); });
    [].forEach.call(document.querySelectorAll("[data-post-back]"), function (b) { b.addEventListener("click", showWall); });
    $("post-body").addEventListener("input", count); $("post-form").addEventListener("submit", submit);
    var share = $("t-wall");
    if (share) share.addEventListener("click", function () { var s = SS().state.story; if (!s) return; var body = (s.text || "").replace(/^.*\n+/, ""); showPost({ title: s.title, body: s.text ? s.text.slice(s.text.indexOf(s.title) === 0 ? s.title.length : 0).trim() : "", tier: s.params && s.params.tier }); });
  });
  window.StoryWall = { problem: problem };
})();
