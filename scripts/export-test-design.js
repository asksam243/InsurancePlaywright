#!/usr/bin/env node
/** Writes test-design/test-cases.json (cases + risks + reported issues + exploration register) for the Excel builder. */
const fs = require('fs');
const path = require('path');
const { cases, RELEASE_GATE } = require('../test-design/testCases');
const { risks, reportedIssues } = require('../test-design/risks');
const exploration = require('../test-design/exploration');
const runs = require('../test-design/runs');
const { ROOT, declaredTests } = require('./lib/specs');

const declared = declaredTests();
const out = {
  generated: new Date().toISOString().slice(0, 10),
  releaseGate: RELEASE_GATE,
  cases: cases.map((c) => {
    const automationStatus = declared[c.id] ? 'Automated' : c.automation === 'Blocked' ? 'Blocked' : 'Planned';
    const automated = automationStatus === 'Automated';
    return {
      ...c, automationStatus, spec: declared[c.id] || '',
      run1: runs.resultFor('RUN-1', c.id, c.smoke, automated),
      run2: runs.resultFor('RUN-2', c.id, c.smoke, automated),
      run3: runs.resultFor('RUN-3', c.id, c.smoke, automated),
      run4: runs.resultFor('RUN-4', c.id, c.smoke, automated),
      run5: runs.resultFor('RUN-5', c.id, c.smoke, automated),
      defectLogIds: runs.defectLog.filter((d) => d.cases.includes(c.id)).map((d) => d.id),
    };
  }),
  liveRuns: runs.liveRuns,
  defectLog: runs.defectLog,
  sdcNote: runs.SDC_NOTE,
  risks,
  reportedIssues,
  exploration: exploration.map((e) => ({ ...e, dependents: cases.filter((c) => c.explore.includes(e.q)).map((c) => c.id) })),
};
fs.writeFileSync(path.join(ROOT, 'test-design', 'test-cases.json'), JSON.stringify(out, null, 2));
console.log(`exported ${out.cases.length} cases (${out.cases.filter((c) => c.automationStatus === 'Automated').length} automated, ${out.cases.filter((c) => c.automationStatus === 'Blocked').length} blocked)`);
