const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "..");
const sandbox = vm.createContext({ window: {} });
vm.runInContext(fs.readFileSync(path.join(root, "shared/js/translations-ar.js"), "utf8"), sandbox);
const engine = fs.readFileSync(path.join(root, "shared/js/i18n.js"), "utf8");
vm.runInContext(
  engine.slice(0, engine.indexOf("  let lang;")) + "window.testPairs=pairs;})();",
  sandbox,
);
const normalize = (value) =>
  value
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
const available = new Set(
  [
    ...Object.keys(sandbox.window.ROAMLY_AR),
    ...Object.values(sandbox.window.testPairs).map((pair) => pair[0]),
  ].map((s) => normalize(s).toLowerCase()),
);
const missing = [];
let pages = 0;
for (const directory of ["user", "adminDashboard", "supplierDashboard"]) {
  for (const file of fs
    .readdirSync(path.join(root, directory))
    .filter((f) => f.endsWith(".html"))) {
    const html = fs.readFileSync(path.join(root, directory, file), "utf8");
    assert.match(html, /js\/translations-ar\.js/);
    const body = html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<!--[\s\S]*?-->/g, "");
    const candidates = [
      ...body.split(/<[^>]+>/),
      ...[...body.matchAll(/(?:placeholder|aria-label|title|alt)="([^"]+)"/g)].map((m) => m[1]),
    ];
    for (const candidate of candidates) {
      const value = normalize(candidate);
      if (/[A-Za-z]{2}/.test(value) && !available.has(value.toLowerCase()))
        missing.push({ file, value });
    }
    pages++;
  }
}
assert.deepEqual(
  missing,
  [],
  "Static labels, body copy and accessible attributes must have Arabic entries",
);
console.log(`Passed static Arabic coverage across ${pages} pages.`);
