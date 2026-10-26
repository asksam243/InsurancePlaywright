/**
 * Offline framework self-checks (TC-FW-01..04). They need neither the application nor a browser, so they run anywhere
 * and double as a quick "is my setup sane" check:  npm run test:unit
 */
const fs = require('fs');
const path = require('path');
const { unitTest: test, unitTc: tc, expect } = require('../../fixtures');
const { dobForAge, calcAge, futureDate, formatDate } = require('../../utils/dates');
const { buildClient, buildBeneficiary, buildAddress, buildKyc } = require('../../utils/dataBuilder');
const { cases, byId } = require('../../test-design/testCases');
const { risks, reportedIssues } = require('../../test-design/risks');
const { classify } = require('../../scripts/healthcheck');
const { files, PNG_1X1 } = require('../../utils/files');
const { parseMoney } = require('../../utils/parse');

const ROOT = path.join(__dirname, '..', '..');

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', 'reports', '.auth', 'test-results', '.git', 'discovery'].includes(entry.name)) continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

test.describe('Framework self-checks', () => {
  test(...tc('FW-01'), async () => {
    const cfg = require('../../playwright.config.js');
    expect(cfg.use.screenshot, 'built-in screenshots cannot be masked, so they are replaced by the masked diagnostics screenshot').toBe('off');
    expect(cfg.use.video).toBe('retain-on-failure');
    expect(['on-first-retry', 'retain-on-failure', 'on']).toContain(cfg.use.trace);
    const reporters = cfg.reporter.map((r) => (Array.isArray(r) ? r[0] : r));
    expect(reporters).toEqual(expect.arrayContaining(['html', 'json', 'junit', 'list']));
    const fixtureSource = fs.readFileSync(path.join(ROOT, 'fixtures', 'index.js'), 'utf8');
    expect(fixtureSource, 'diagnostics fixture must be automatic').toMatch(/diagnostics:[\s\S]*auto: true/);
    expect(fixtureSource).toContain('diagnostics.json');
    expect(fixtureSource, 'failure screenshots must be masked').toContain('maskedScreenshot');
    if (!process.env.WORKERS) expect(cfg.workers, 'shared lab: one worker by default').toBe(1);
    const { redact } = require('../../utils/evidence');
    expect(redact({ ssn: '900-12-3456', nested: { idNumber: 'P1', token: 't', ok: 1 } })).toEqual({ ssn: '[REDACTED]', nested: { idNumber: '[REDACTED]', token: '[REDACTED]', ok: 1 } });
    const sens = cases.filter((c) => c.sensitive).map((c) => c.id);
    const clientSrc = fs.readFileSync(path.join(ROOT, 'tests', 'ui', 'client-kyc-sensitive.spec.js'), 'utf8');
    expect(clientSrc).toMatch(/trace: 'off', video: 'off'/);
    for (const id of sens) expect(clientSrc, `${id} must live in the no-trace/no-video sensitive spec file`).toContain(`tc('${id}')`);
  });

  test(...tc('FW-02'), async () => {
    // 1) no hard-coded IPs / URLs / passwords outside the configuration layer
    const scanDirs = ['tests', 'pages', 'components', 'fixtures', 'utils', 'api'].map((d) => path.join(ROOT, d));
    const offenders = [];
    for (const dir of scanDirs) {
      for (const file of walk(dir).filter((f) => f.endsWith('.js') && !f.includes(`${path.sep}unit${path.sep}`))) {
        const src = fs.readFileSync(file, 'utf8');
        const rel = path.relative(ROOT, file);
        if (/https?:\/\/(?!localhost)[^\s'"`]+/.test(src.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, ''))) offenders.push(`${rel}: hard-coded URL`);
        if (/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/.test(src)) offenders.push(`${rel}: hard-coded IP address`);
        if (/Password@\d+|password\s*[:=]\s*['"][^'"]{4,}['"]/i.test(src.replace(/\/\/.*$/gm, ''))) offenders.push(`${rel}: hard-coded password`);
      }
    }
    expect(offenders, 'hard-coded environment values outside config/env.js').toEqual([]);
    // 2) the only default URL is localhost; credentials default only in config/env.js
    expect(fs.readFileSync(path.join(ROOT, 'config', 'env.js'), 'utf8')).toContain("'http://localhost:8081'");
    // 3) the health check classifies environment vs application problems
    expect(classify({ error: new Error('connect ECONNREFUSED 10.0.0.1:8081') }).kind).toBe('ENVIRONMENT');
    expect(classify({ status: 503 }).kind).toBe('ENVIRONMENT');
    expect(classify({ status: 404 }).kind).toBe('ENVIRONMENT');
    expect(classify({ status: 200, redirectedTo: 'https://login.microsoftonline.com/x' }).kind).toBe('ENVIRONMENT');
    expect(classify({ status: 200 }).kind).toBe('OK');
  });

  test(...tc('FW-03'), async () => {
    // unique data per call (parallel tests must never collide)
    const names = new Set();
    for (let i = 0; i < 500; i += 1) {
      const c = buildClient();
      names.add(`${c.firstName}|${c.lastName}`);
      names.add(buildBeneficiary().name);
      expect(c.firstName, 'names must be letters only (name validation rejects digits)').toMatch(/^[A-Za-z]+$/);
    }
    expect(names.size).toBe(1000);
    expect(new Set(Array.from({ length: 200 }, () => buildAddress().email)).size).toBe(200);
    // The real form takes the SSN as the ID number (ID type SSN) and the app's own reference data uses one fixed synthetic value,
    // so the ID number is intentionally constant; what must hold is that it is a well-formed SYNTHETIC SSN.
    expect(buildKyc().idNumber).toMatch(/^\d{3}-\d{2}-\d{4}$/);

    // boundary dates produce exactly the intended ages, including leap-day and year-end "today"
    const todays = ['2026-10-14', '2024-02-29', '2025-12-31', '2026-01-01', '2028-02-29', '2025-03-01'].map((d) => new Date(`${d}T00:00:00Z`));
    for (const today of todays) {
      for (const age of [17, 18, 35, 65, 66]) {
        expect(calcAge(dobForAge(age, { today }), today), `dobForAge(${age}) on ${today.toISOString().slice(0, 10)}`).toBe(age);
      }
      expect(calcAge(dobForAge(18, { dayOffset: 1, today }), today), 'turns 18 tomorrow => 17').toBe(17);
      expect(calcAge(dobForAge(65, { dayOffset: -1, today }), today), 'turned 65 yesterday => 65').toBe(65);
      expect(calcAge(dobForAge(66, { dayOffset: 1, today }), today), 'turns 66 tomorrow => 65').toBe(65);
    }
    expect(futureDate(1).getTime()).toBeGreaterThan(Date.now());
    expect(formatDate(new Date(Date.UTC(2026, 0, 5)), 'iso')).toBe('2026-01-05');
    expect(formatDate(new Date(Date.UTC(2026, 0, 5)), 'us')).toBe('01/05/2026');
    expect(formatDate(new Date(Date.UTC(2026, 0, 5)), 'eu')).toBe('05/01/2026');

    // upload fixtures and money parsing
    expect(PNG_1X1.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    expect(files.validPdf().buffer.toString().startsWith('%PDF-')).toBe(true);
    expect(files.oversizePdf(2).buffer.length).toBeGreaterThan(3 * 1024 * 1024);
    expect(parseMoney('$1,234.50')).toBe(1234.5);
    expect(parseMoney('USD 250,000')).toBe(250000);
    expect(parseMoney('1.234,50')).toBe(1234.5);
    expect(parseMoney('n/a')).toBeNaN();
  });

  test(...tc('FW-04'), async () => {
    const specFiles = walk(path.join(ROOT, 'tests')).filter((f) => f.endsWith('.spec.js'));
    const declared = new Set();
    for (const f of specFiles) {
      for (const m of fs.readFileSync(f, 'utf8').matchAll(/\btc(?:\.only|\.fixme)?\(\s*'([A-Z]+-(?:V)?\d+)'/g)) declared.add(m[1]);
    }
    const unknown = [...declared].filter((id) => !byId[id]);
    expect(unknown, 'tests that reference a case missing from test-design/testCases.js').toEqual([]);

    const missingAutomation = cases.filter((c) => c.automation === 'Automated' && !declared.has(c.id)).map((c) => c.id);
    expect(missingAutomation, 'cases marked Automated that have no test').toEqual([]);
    const blockedButCoded = cases.filter((c) => c.automation === 'Blocked' && declared.has(c.id)).map((c) => c.id);
    expect(blockedButCoded, 'cases marked Blocked that nevertheless have a test').toEqual([]);

    expect(cases.filter((c) => !c.risks.length).map((c) => c.id), 'cases with no linked risk').toEqual([]);
    const linkedRisks = new Set(cases.flatMap((c) => c.risks));
    expect(risks.filter((r) => !linkedRisks.has(r.id)).map((r) => r.id), 'risks with no test case').toEqual([]);
    const linkedIssues = new Set(cases.flatMap((c) => c.defects));
    expect(reportedIssues.filter((r) => !linkedIssues.has(r.id)).map((r) => r.id), 'reported issues (seeded-defect themes) with no test case').toEqual([]);
    expect(cases.filter((c) => c.priority === 'P1').length, 'P1 = release gate, kept to about 15-20 cases').toBeLessThanOrEqual(20);
    expect(buildKyc().idNumber, 'synthetic SSN only (123-45-6789 is the well-known placeholder, never a real person)').toBe('123-45-6789');
    expect(buildAddress().email).toMatch(/@example\.test$/);
    expect(risks.length).toBe(41);
    expect(reportedIssues.length).toBe(20);
  });
});
