// Shared helpers for StorySpark Premium: signed tokens that say "this email paid until <date>".
const crypto = require("crypto");
const PRICE_PAISE = 49900; // Rs 499 per year
const YEAR_MS = 365 * 24 * 3600 * 1000;
const b64 = (s) => Buffer.from(s).toString("base64url");
function secret() { return process.env.PREMIUM_SECRET || ""; }
function sign(payload) {
  const body = b64(JSON.stringify(payload));
  const mac = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  return body + "." + mac;
}
function verify(token) {
  if (!secret() || typeof token !== "string" || token.length > 600) return null;
  const [body, mac] = token.split(".");
  if (!body || !mac) return null;
  const want = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  const a = Buffer.from(mac), b = Buffer.from(want);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try { const p = JSON.parse(Buffer.from(body, "base64url").toString()); return p && p.exp > Date.now() ? p : null; } catch (e) { return null; }
}
const validEmail = (e) => typeof e === "string" && e.length <= 120 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
// Razorpay signs "order_id|payment_id" with the key secret.
function paymentSignatureOk(orderId, paymentId, signature, keySecret) {
  if (!orderId || !paymentId || !signature || !keySecret) return false;
  const want = crypto.createHmac("sha256", keySecret).update(orderId + "|" + paymentId).digest("hex");
  const a = Buffer.from(String(signature)), b = Buffer.from(want);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
module.exports = { PRICE_PAISE, YEAR_MS, sign, verify, validEmail, paymentSignatureOk };
