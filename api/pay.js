// StorySpark Premium payments (Razorpay).
// GET  /api/pay                      -> { enabled, test }
// POST {action:"order", email}       -> creates a Rs 499 order
// POST {action:"verify", ...}        -> checks the payment signature, returns a premium token
// POST {action:"restore", email, payment_id} -> looks the payment up again (new device)
// POST {action:"check", token}       -> { premium, exp }
const { PRICE_PAISE, YEAR_MS, sign, verify, validEmail, paymentSignatureOk } = require("./_premium.js");

const hits = new Map();
function limited(ip) {
  const now = Date.now(), list = (hits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  list.push(now); hits.set(ip, list); if (hits.size > 5000) hits.clear();
  return list.length > 30;
}
async function rz(path, method, body) {
  const id = process.env.RAZORPAY_KEY_ID, sec = process.env.RAZORPAY_KEY_SECRET;
  const r = await fetch("https://api.razorpay.com/v1" + path, {
    method,
    headers: { "content-type": "application/json", authorization: "Basic " + Buffer.from(id + ":" + sec).toString("base64") },
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((j.error && j.error.description) || "Payment service error");
  return j;
}
module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const keyId = process.env.RAZORPAY_KEY_ID, keySecret = process.env.RAZORPAY_KEY_SECRET;
  const enabled = !!(keyId && keySecret && process.env.PREMIUM_SECRET);
  if (req.method === "GET") return res.status(200).json({ enabled, test: enabled && keyId.startsWith("rzp_test_") });
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const origin = req.headers.origin;
  if (origin) { try { if (new URL(origin).host !== req.headers.host) return res.status(403).json({ error: "Forbidden" }); } catch (e) { return res.status(403).json({ error: "Forbidden" }); } }
  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  if (limited(ip)) return res.status(429).json({ error: "Too many tries. Please wait a few minutes." });
  let b = req.body; if (typeof b === "string") { try { b = JSON.parse(b); } catch (e) { b = null; } }
  if (!b || typeof b !== "object") return res.status(400).json({ error: "Bad request" });

  if (b.action === "check") { const p = verify(b.token); return res.status(200).json({ premium: !!p, exp: p ? p.exp : 0 }); }
  if (!enabled) return res.status(503).json({ error: "Payments are not set up yet" });
  try {
    if (b.action === "order") {
      if (!validEmail(b.email)) return res.status(400).json({ error: "Please enter a valid email" });
      const o = await rz("/orders", "POST", { amount: PRICE_PAISE, currency: "INR", receipt: "ss_" + Date.now(), notes: { email: b.email.toLowerCase(), product: "StorySpark Premium 1 year" } });
      return res.status(200).json({ orderId: o.id, keyId, amount: o.amount });
    }
    if (b.action === "verify") {
      if (!validEmail(b.email) || !paymentSignatureOk(b.order_id, b.payment_id, b.signature, keySecret)) return res.status(400).json({ error: "Payment could not be verified" });
      const exp = Date.now() + YEAR_MS;
      return res.status(200).json({ token: sign({ email: b.email.toLowerCase(), exp }), exp });
    }
    if (b.action === "restore") {
      if (!validEmail(b.email) || typeof b.payment_id !== "string" || !/^pay_[A-Za-z0-9]+$/.test(b.payment_id)) return res.status(400).json({ error: "Enter the email you paid with and the payment ID (starts with pay_)" });
      const p = await rz("/payments/" + b.payment_id, "GET");
      const order = p.order_id ? await rz("/orders/" + p.order_id, "GET") : null;
      const paidEmail = String((order && order.notes && order.notes.email) || "").toLowerCase();
      if (p.status !== "captured" || p.amount !== PRICE_PAISE || paidEmail !== b.email.toLowerCase()) return res.status(404).json({ error: "No matching payment found" });
      const exp = p.created_at * 1000 + YEAR_MS;
      if (exp < Date.now()) return res.status(410).json({ error: "That premium year has ended" });
      return res.status(200).json({ token: sign({ email: paidEmail, exp }), exp });
    }
    return res.status(400).json({ error: "Unknown action" });
  } catch (e) { return res.status(502).json({ error: "The payment service is busy. Please try again." }); }
};
