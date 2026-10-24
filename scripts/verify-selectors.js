#!/usr/bin/env node
/** Compares config/selectors.js test ids with discovery/testids.json. Informational unless --strict. */
const fs = require('fs');
const path = require('path');
const { S } = require('../config/selectors');
const file = path.join(__dirname, '..', 'discovery', 'testids.json');
if (!fs.existsSync(file)) { console.error('Run `npm run discover` first.'); process.exit(1); }
const seen = new Set(JSON.parse(fs.readFileSync(file, 'utf8')).pages.flatMap((p) => p.testIds));
const rows = [];
for (const [group, defs] of Object.entries(S)) {
  for (const [key, def] of Object.entries(defs)) {
    if (typeof def !== 'object' || !def.id) continue;
    rows.push({ key: `${group}.${key}`, id: def.id, found: seen.has(def.id) });
  }
}
const miss = rows.filter((r) => !r.found);
console.log(`${rows.length - miss.length}/${rows.length} configured test ids found on the pages visited`);
console.log('Not found (fine if the control is on a page not visited, or relies on its label/role fallback):');
for (const r of miss) console.log(`  ${r.key.padEnd(34)} ${r.id}`);
const unmapped = [...seen].filter((id) => !rows.some((r) => r.id === id));
if (unmapped.length) console.log(`\nTest ids on the pages that selectors.js does not use yet (${unmapped.length}):\n  ${unmapped.join('\n  ')}`);
process.exit(process.argv.includes('--strict') && miss.length ? 1 : 0);
