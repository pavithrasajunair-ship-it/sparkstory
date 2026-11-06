// POST /api/story  -> writes a story with the Anthropic API (only when ANTHROPIC_API_KEY is set)
// GET  /api/story  -> { ai: true|false } so the app knows whether to offer Magic mode
const { validate, buildPrompt, parse, suitable } = require("./_prompt.js");

const hits = new Map(); // best-effort per-instance rate limit
function limited(ip) {
  const now = Date.now(), win = 10 * 60 * 1000, max = Number(process.env.STORY_RATE_MAX || 12);
  const list = (hits.get(ip) || []).filter((t) => now - t < win);
  list.push(now); hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > max;
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const key = process.env.ANTHROPIC_API_KEY;
  if (req.method === "GET") return res.status(200).json({ ai: !!key });
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!key) return res.status(503).json({ error: "AI mode is not set up" });

  const origin = req.headers.origin;
  if (origin) { try { if (new URL(origin).host !== req.headers.host) return res.status(403).json({ error: "Forbidden" }); } catch (e) { return res.status(403).json({ error: "Forbidden" }); } }
  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  if (limited(ip)) return res.status(429).json({ error: "Too many stories just now. Please wait a few minutes." });

  const v = validate(typeof req.body === "string" ? safeJson(req.body) : req.body);
  if (v.error) return res.status(400).json({ error: v.error });
  const { system, user, maxTokens } = buildPrompt(v.value);

  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 50000);
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: process.env.STORY_MODEL || "claude-haiku-5-5", max_tokens: maxTokens, system, messages: [{ role: "user", content: user }] }),
      signal: ctl.signal,
    });
    if (!r.ok) return res.status(502).json({ error: "The story writer is busy" });
    const j = await r.json();
    const text = (j.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
    const story = parse(text);
    if (!suitable(v.value.tier, story)) return res.status(422).json({ error: "Could not make a suitable story" });
    return res.status(200).json(story);
  } catch (e) {
    return res.status(502).json({ error: "The story writer is busy" });
  } finally { clearTimeout(timer); }
};
function safeJson(s) { try { return JSON.parse(s); } catch (e) { return null; } }
