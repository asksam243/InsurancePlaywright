#!/usr/bin/env node
/** npm run check:traceability - fails (exit 1) on orphans or a bloated P1. */
const { cases, RELEASE_GATE } = require('../test-design/testCases');
const { risks, reportedIssues } = require('../test-design/risks');
const { declaredTests } = require('./lib/specs');
const declared = declaredTests();
const problems = [];
for (const c of cases) {
  if (!c.risks.length) problems.push(`${c.id}: no linked risk`);
  if (c.automation === 'Automated' && !declared[c.id]) problems.push(`${c.id}: marked Automated but has no test`);
  if (c.automation === 'Blocked' && declared[c.id]) problems.push(`${c.id}: marked Blocked but has a test`);
}
for (const id of Object.keys(declared)) if (!cases.find((c) => c.id === id)) problems.push(`${id}: test has no case in testCases.js`);
const linked = new Set(cases.flatMap((c) => c.risks));
for (const r of risks) if (!linked.has(r.id)) problems.push(`${r.id}: risk has no test case`);
const ri = new Set(cases.flatMap((c) => c.defects));
for (const r of reportedIssues) if (!ri.has(r.id)) problems.push(`${r.id}: reported issue has no test case`);
const p1 = cases.filter((c) => c.priority === 'P1').length;
if (p1 > 20) problems.push(`P1 has ${p1} cases; release gate should stay at about 15-20`);

const n = (f) => cases.filter(f).length;
console.log(`cases ${cases.length} | automated ${Object.keys(declared).length} | blocked ${n((c) => c.automation === 'Blocked')} | release gate (P1) ${p1}/${RELEASE_GATE.length} | smoke ${n((c) => c.smoke)} | seeded-defect checks ${n((c) => c.defects.length)}`);
console.log(`risks covered ${linked.size}/${risks.length} | reported issues covered ${ri.size}/${reportedIssues.length}`);
if (problems.length) { console.error(problems.map((p) => ` - ${p}`).join('\n')); process.exit(1); }
console.log('traceability OK');
