// Tiny local server: static files + vercel.json headers + /api/story (for testing and local preview).
// STUB_AI=1 makes the AI call return a canned story instead of calling the network.
const http = require("http"), fs = require("fs"), path = require("path");
const root = path.join(__dirname, ".."), cfg = JSON.parse(fs.readFileSync(path.join(root, "vercel.json"), "utf8"));
const handler = require("../api/story.js");
if (process.env.STUB_AI) {
  process.env.ANTHROPIC_API_KEY = "stub";
  global.fetch = async () => ({ ok: true, json: async () => ({ content: [{ type: "text", text: "TITLE: The AI Lantern\n\n## The Start\n\n" + "Zoe walked along the sunny path, smiling at the birds and the big blue sky. ".repeat(4) + "\n\n## The End\n\n" + "Everyone cheered, and the lantern glowed warm and bright all night long. ".repeat(3) }] }) });
}
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".ttf": "font/ttf", ".txt": "text/plain", ".xml": "application/xml", ".png": "image/png", ".json": "application/json" };
http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  for (const h of cfg.headers[0].headers) res.setHeader(h.key, h.value);
  if (url.pathname === "/api/story") {
    let data = ""; req.on("data", (c) => (data += c)); req.on("end", () => {
      const r = { status(c) { res.statusCode = c; return r; }, setHeader: (k, v) => res.setHeader(k, v), json(b) { res.setHeader("content-type", "application/json"); res.end(JSON.stringify(b)); } };
      let body; try { body = data ? JSON.parse(data) : undefined; } catch (e) { body = null; }
      handler({ method: req.method, headers: req.headers, body }, r);
    }); return;
  }
  let p = path.join(root, url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname));
  if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.statusCode = 404; return res.end("not found"); }
  res.setHeader("content-type", types[path.extname(p)] || "application/octet-stream"); fs.createReadStream(p).pipe(res);
}).listen(process.env.PORT || 8812, () => console.log("StorySpark on http://localhost:" + (process.env.PORT || 8812)));
