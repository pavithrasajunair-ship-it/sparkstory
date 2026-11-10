const fs = require("fs");
const CATS = ["setting", "action", "talk", "feeling", "trouble", "hope"];
const SLOTS = new Set(["H", "A", "A2", "V", "P", "P2", "I", "W", "T", "L"]);
const BAD = /\b(he|she|him|his|hers|himself|herself|boy|girl|man|woman|mother|father|mum|dad|mom)\b/i;
let bad = 0;
const files = process.argv.slice(2);
for (const f of files) {
  const j = JSON.parse(fs.readFileSync(f, "utf8"));
  const gen = /generic/.test(f), need = gen ? 20 : 14;
  for (const reg of Object.keys(j)) {
    if (!["simple", "rich"].includes(reg)) { console.log(f, "bad register", reg); bad++; continue; }
    const seen = new Set(); let withSlot = 0, total = 0, words = 0;
    for (const c of CATS) {
      const a = j[reg][c];
      if (!Array.isArray(a) || a.length < need) { console.log(f, reg, c, "needs", need, "has", a && a.length); bad++; continue; }
      for (const u of a) {
        total++; words += u.split(/\s+/).length;
        if (seen.has(u.toLowerCase())) { console.log(f, reg, c, "DUP", u); bad++; }
        seen.add(u.toLowerCase());
        for (const m of u.matchAll(/\{([^}]*)\}/g)) if (!SLOTS.has(m[1])) { console.log(f, reg, c, "bad slot", m[0], "in", u); bad++; }
        if (/[{}]/.test(u.replace(/\{\w+\}/g, ""))) { console.log(f, reg, c, "stray brace", u); bad++; }
        if (BAD.test(u.replace(/"[^"]*"/g, (q) => q))) { console.log(f, reg, c, "gendered word:", u); bad++; }
        if (!/[.!?]["”]?$/.test(u.trim())) { console.log(f, reg, c, "no end punctuation:", u); bad++; }
        if (/\{(A|A2|V)\}'s|the \{(P2|I|P)\}/.test(u)) { console.log(f, reg, c, "bad slot grammar:", u); bad++; }
        if (reg === "simple" && u.split(/\s+/).length > 24) { console.log(f, reg, c, "too long for simple:", u); bad++; }
        if (reg === "rich" && u.split(/\s+/).length < 9) { console.log(f, reg, c, "too short for rich:", u); bad++; }
        if (/\{L\}/.test(u) && !/romance/.test(f) && !gen) { console.log(f, "{L} outside romance:", u); bad++; }
        if (/\{L\}/.test(u) && gen) { console.log(f, "{L} in generic:", u); bad++; }
        if (/\{\w+\}/.test(u)) withSlot++;
      }
    }
    if (total && withSlot / total < .6) { console.log(f, reg, "only", Math.round(100 * withSlot / total), "% of units use a slot"); bad++; }
    console.log(f, reg, total, "units, avg", (words / total).toFixed(1), "words");
  }
}
console.log(bad ? bad + " PROBLEMS" : "OK");
process.exit(bad ? 1 : 0);
