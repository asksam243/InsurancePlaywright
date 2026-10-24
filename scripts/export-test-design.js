#!/usr/bin/env node
/** Writes test-design/test-cases.json (cases + risks + reported issues + exploration register) for the Excel builder. */
const fs = require('fs');
const path = require('path');
const { cases, RELEASE_GATE } = require('../test-design/testCases');
const { risks, reportedIssues } = require('../test-design/risks');
const exploration = require('../test-design/exploration');
const { ROOT, declaredTests } = require('./lib/specs');

const declared = declaredTests();
const out = {
  generated: new Date().toISOString().slice(0, 10),
  releaseGate: RELEASE_GATE,
  cases: cases.map((c) => ({ ...c, automationStatus: declared[c.id] ? 'Automated' : c.automation === 'Blocked' ? 'Blocked' : 'Planned', spec: declared[c.id] || '' })),
  risks,
  reportedIssues,
  exploration: exploration.map((e) => ({ ...e, dependents: cases.filter((c) => c.explore.includes(e.q)).map((c) => c.id) })),
};
fs.writeFileSync(path.join(ROOT, 'test-design', 'test-cases.json'), JSON.stringify(out, null, 2));
console.log(`exported ${out.cases.length} cases (${out.cases.filter((c) => c.automationStatus === 'Automated').length} automated, ${out.cases.filter((c) => c.automationStatus === 'Blocked').length} blocked)`);
