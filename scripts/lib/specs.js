const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

/** Map of scenario id -> spec file (relative) for every tc('ID') found under tests/. */
function declaredTests() {
  const out = {};
  for (const f of walk(path.join(ROOT, 'tests')).filter((x) => x.endsWith('.spec.js'))) {
    for (const m of fs.readFileSync(f, 'utf8').matchAll(/\btc\(\s*'([A-Z]+-(?:V)?\d+)'/g)) out[m[1]] = path.relative(ROOT, f).replace(/\\/g, '/');
  }
  return out;
}
module.exports = { ROOT, declaredTests };
