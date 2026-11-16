/* StorySpark Premium: Rs 499 a year. The token is signed by /api/pay; this file keeps it on the device and shows the lock screens. */
(function () {
  "use strict";
  var KEY = "storyspark:premium", FREE = { library: 15, cast: 5, episodes: 2 };
  var rec = null, cfg = { enabled: false, test: false };
  var $ = function (id) { return document.getElementById(id); };
  try { rec = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { rec = null; }
  function active() { return !!(rec && rec.token && rec.exp > Date.now()); }
  function save(t, exp, email) { rec = { token: t, exp: exp, email: email || (rec && rec.email) || "" }; try { localStorage.setItem(KEY, JSON.stringify(rec)); } catch (e) {} paint(); }
  function api(body) {
    return fetch("/api/pay", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || "Something went wrong"); return j; }); });
  }
  function paint() {
    var on = active();
    document.documentElement.toggleAttribute("data-premium", on);
    var b = $("btn-premium"); if (b) b.textContent = on ? "Premium ✓" : "Premium";
    var st = $("prem-state"); if (st) st.textContent = on ? "Premium is active until " + new Date(rec.exp).toLocaleDateString() + "." : "";
    var box = $("prem-buy-box"); if (box) box.hidden = on;
    var lk = document.querySelectorAll(".lock-badge"); for (var i = 0; i < lk.length; i++) lk[i].hidden = on;
  }
  function open(reason) {
    var ss = window.__SS; if (!ss) return; ss.show("premium");
    var r = $("prem-reason"); if (r) { r.textContent = reason || ""; r.hidden = !reason; }
    paint();
  }
  function loadCheckout() {
    return new Promise(function (ok, no) {
      if (window.Razorpay) return ok();
      var s = document.createElement("script"); s.src = "https://checkout.razorpay.com/v1/checkout.js"; s.onload = ok; s.onerror = function () { no(new Error("Could not load the payment window")); };
      document.head.appendChild(s);
    });
  }
  function msg(t, bad) { var m = $("prem-msg"); if (!m) return; m.textContent = t || ""; m.className = bad ? "wbad" : "wgood"; }
  function buy() {
    var email = ($("prem-email").value || "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return msg("Enter a valid email so we can find your payment later.", true);
    if (!cfg.enabled) return msg("Payments are not switched on yet. Please check back soon.", true);
    msg("Opening the payment window…");
    Promise.all([api({ action: "order", email: email }), loadCheckout()]).then(function (a) {
      var o = a[0];
      var rz = new window.Razorpay({
        key: o.keyId, amount: o.amount, currency: "INR", order_id: o.orderId, name: "StorySpark", description: "Premium for 1 year", prefill: { email: email },
        theme: { color: "#7c3aed" },
        handler: function (resp) {
          msg("Checking your payment…");
          api({ action: "verify", email: email, order_id: resp.razorpay_order_id, payment_id: resp.razorpay_payment_id, signature: resp.razorpay_signature })
            .then(function (v) { save(v.token, v.exp, email); msg("Thank you. Premium is on. Your payment ID is " + resp.razorpay_payment_id + ". Keep it to restore premium on another device."); })
            .catch(function (e) { msg(e.message + ". If money left your account, use Restore with payment ID " + resp.razorpay_payment_id + ".", true); });
        },
        modal: { ondismiss: function () { msg(""); } },
      });
      rz.open();
    }).catch(function (e) { msg(e.message, true); });
  }
  function restore() {
    var email = ($("prem-r-email").value || "").trim(), pid = ($("prem-r-pid").value || "").trim();
    msg("Looking for your payment…");
    api({ action: "restore", email: email, payment_id: pid }).then(function (v) { save(v.token, v.exp, email); msg("Premium restored."); }).catch(function (e) { msg(e.message, true); });
  }
  document.addEventListener("DOMContentLoaded", function () {
    fetch("/api/pay").then(function (r) { return r.ok ? r.json() : cfg; }).then(function (j) { cfg = j || cfg; var t = $("prem-test"); if (t) t.hidden = !cfg.test; }).catch(function () {});
    if (rec && rec.token) api({ action: "check", token: rec.token }).then(function (j) { if (!j.premium) { rec = null; try { localStorage.removeItem(KEY); } catch (e) {} paint(); } }).catch(function () {});
    paint();
    document.addEventListener("click", function (e) { if (e.target.closest && e.target.closest("[data-premium-open]")) open(); });
    var b = $("prem-buy"), r = $("prem-restore"); if (b) b.addEventListener("click", buy); if (r) r.addEventListener("click", restore);
    var back = document.querySelector("[data-prem-back]"); if (back) back.addEventListener("click", function () { window.__SS.show("home"); });
  });
  window.Premium = { get active() { return active(); }, open: open, FREE: FREE };
})();
