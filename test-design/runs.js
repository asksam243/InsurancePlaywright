/**
 * EVIDENCE FROM LIVE RUNS AND THE DEFECT LOG (single source of truth; the Excel sheet is generated from this file).
 *
 * Rules for this file:
 *  - Only results the team actually observed on the lab VM go in `liveRuns` / `results`. Offline dry-runs against a mock are
 *    NOT evidence about the application and are never recorded here.
 *  - A failure is classified before it is logged (README section 6): application defect, automation defect, test-data issue,
 *    environment issue or unstable test. Nothing below is an APPLICATION defect that has been reproduced on the lab:
 *    the first two live runs failed before reaching any validation rule.
 *  - Where the failure text was not captured, the root cause is marked PROBABLE, not confirmed.
 */

const liveRuns = [
  {
    id: 'RUN-1',
    when: '2026-10-26 11:38',
    scope: 'Smoke (@smoke), chromium + api',
    code: 'Merged repo v1 (guessed selectors, no Create Draft step)',
    total: 15, passed: 5, failed: 10, skipped: 0, durationMin: 3.6,
    note: 'Failures are automation defects (see Defect Log AD-01..AD-04). Login and dashboard were correct.',
  },
  {
    id: 'RUN-2',
    when: '2026-10-26 11:51',
    scope: 'Full suite',
    code: 'Merged repo v1 (same code as RUN-1)',
    total: 96, passed: 10, failed: 73, skipped: 13, durationMin: 14.1,
    note: 'Passed: AUTH-V01/V02/V03/V05/V11/V14 and FW-01..04. AUTH-V04 and DASH-V01 passed in RUN-1 but are not in RUN-2\'s passed list - failure text not captured (see AD-11).',
  },
  {
    id: 'RUN-3',
    when: '2026-10-26 (after fixes)',
    scope: 'Smoke (@smoke), chromium + api',
    code: 'Merged repo v2 (real ids, Create Draft step, learner account)',
    total: 15, passed: 7, failed: 8, skipped: 0, durationMin: 3.7,
    note: 'CLI-V01 and PROD-V01 now pass, so the Create Draft step and the client/address/KYC/product ids work live. Remaining failures: product minimum (AD-09), API 404 (AD-11), first-login timeout (AD-10).',
  },
];

// scenario id -> observed result. Anything not listed was not observed individually.
const RUN1 = {
  passed: ['AUTH-V01', 'AUTH-V14', 'AUTH-V04', 'AUTH-V05', 'DASH-V01'],
  failed: ['WF-V01', 'WF-V03', 'WF-V08', 'API-V01', 'API-V02', 'BEN-V01', 'CLI-V01', 'DOC-V01', 'PROD-V01', 'RIDER-V01'],
};
const RUN3 = {
  passed: ['AUTH-V01', 'AUTH-V14', 'AUTH-V04', 'AUTH-V05', 'CLI-V01', 'DASH-V01', 'PROD-V01'],
  failed: ['WF-V01', 'WF-V03', 'WF-V08', 'BEN-V01', 'DOC-V01', 'RIDER-V01', 'API-V01', 'API-V02'],
};
const RUN2 = {
  passed: ['AUTH-V01', 'AUTH-V02', 'AUTH-V03', 'AUTH-V05', 'AUTH-V11', 'AUTH-V14', 'FW-01', 'FW-02', 'FW-03', 'FW-04'],
  failed: ['BEN-V01', 'BEN-V02', 'BEN-V03', 'BEN-V04', 'BEN-V05', 'BEN-V06', 'BEN-V07', 'BEN-V08', ...RUN1.failed],
  // passed in RUN-1, absent from RUN-2's passed list; RUN-2 shows no per-test failure text for them
  investigate: ['AUTH-V04', 'DASH-V01'],
};

/** Result text for a scenario in a run. */
function resultFor(run, id, smoke, automated) {
  if (!automated) return 'Not automated';
  if (run === 'RUN-3') {
    if (RUN3.passed.includes(id)) return 'Passed';
    if (RUN3.failed.includes(id)) return 'Failed';
    return smoke ? 'Not itemised' : 'Not in smoke scope';
  }
  if (run === 'RUN-1') {
    if (RUN1.passed.includes(id)) return 'Passed';
    if (RUN1.failed.includes(id)) return 'Failed';
    return smoke ? 'Not itemised' : 'Not in smoke scope';
  }
  if (RUN2.passed.includes(id)) return 'Passed';
  if (RUN2.failed.includes(id)) return 'Failed';
  if (RUN2.investigate.includes(id)) return 'Not passed - investigate';
  return 'Failed or skipped (not itemised)';
}

/**
 * Defect log. type: Automation defect | Test-data issue | Application defect (candidate) | Clarification.
 * status: Fixed in code - awaiting live re-run | Candidate - not reproduced | Open.
 */
const defectLog = [
  {
    id: 'AD-01', type: 'Automation defect', module: 'Dashboard / Workflow',
    title: 'Start-new-application flow skipped the "Create Draft" page',
    cases: ['WF-V01', 'WF-V03', 'WF-V08', 'BEN-V01', 'CLI-V01', 'DOC-V01', 'PROD-V01', 'RIDER-V01'],
    evidence: 'RUN-1: every test that begins with "Start New Application" failed; AUTH and DASH tests passed. RUN-2: 73 failures, all in journey specs.',
    analysis: 'The real app shows an application-start page with a Create Draft button between the dashboard and the client form. The flow clicked New Application and waited for client fields that never appeared.',
    severity: 'High', priority: 'P1', status: 'Verified live in RUN-3 (journeys now reach the product step)',
    fix: 'pages/DashboardPage.js startNewApplication()', defects: [],
  },
  {
    id: 'AD-02', type: 'Automation defect', module: 'All UI steps',
    title: 'Guessed data-testid values did not match the application',
    cases: ['CLI-V01', 'PROD-V01', 'RIDER-V01', 'BEN-V01', 'DOC-V01', 'WF-V03', 'WF-V08'],
    evidence: 'RUN-1 and RUN-2 journey failures; third project\'s page objects list the real ids (e.g. client-first-name-input, product-select, rider-row-<id>).',
    analysis: 'Only login and dashboard ids were confirmed. Every other id followed a guessed convention.',
    severity: 'High', priority: 'P1', status: 'Partly verified live in RUN-3 (client, address, KYC, product ids work; riders, beneficiaries, documents, review not yet reached)',
    fix: 'config/selectors.js (ids FROM MARKUP; run npm run verify:selectors to prove them)', defects: [],
  },
  {
    id: 'AD-03', type: 'Automation defect', module: 'API',
    title: 'API client did not follow the real contract (agent_email, field names, redirects, payload shapes)',
    cases: ['API-V01', 'API-V02', 'API-V03', 'API-V04', 'API-V05', 'API-V06', 'API-V08', 'API-V10', 'API-V11'],
    evidence: 'RUN-1: API-V01 failed in 343 ms, API-V02 in 446 ms (no response text captured).',
    analysis: 'SUPERSEDED by AD-11: RUN-3 showed HTTP 404 on both API calls, so the first cause is the API base URL, not the contract. The contract fixes (product_name, agent_email on every call, no redirects, snake_case payloads) are still correct but cannot be proven until AD-11 is resolved.',
    severity: 'High', priority: 'P1', status: 'Fixed in code - awaiting live re-run',
    fix: 'api/ApiClient.js, api/helpers.js, config/endpoints.js, tests/api/applications.api.spec.js', defects: ['RI-19'],
  },
  {
    id: 'AD-04', type: 'Automation defect', module: 'Product / Riders / Beneficiaries / Documents',
    title: 'Page objects modelled the wrong controls (product and rider cards, Add-beneficiary modal, per-document file inputs, Save draft)',
    cases: ['PROD-V01', 'RIDER-V01', 'BEN-V01', 'DOC-V01', 'WF-V01'],
    evidence: 'Third project\'s page objects: product step is a dropdown, riders are table rows, beneficiaries are an always-open form using native alert()/confirm(), documents are one type dropdown + one file input + Upload, and there is no Save draft button.',
    analysis: 'The wizard model assumed in Submission 2 does not match the application.',
    severity: 'High', priority: 'P1', status: 'Fixed in code - awaiting live re-run',
    fix: 'pages/ProductPage.js, RiderPage.js, BeneficiaryPage.js, DocumentsPage.js, BasePage.js', defects: [],
  },
  {
    id: 'AD-05', type: 'Test-data issue', module: 'Client / Address / KYC / Product',
    title: 'Test data omitted mandatory fields and used display text instead of the app\'s option values',
    cases: ['CLI-V01', 'WF-V03'],
    evidence: 'Third project\'s data builders: employer address, preferred contact mode, compliance declaration, payment term and coverage term are all required; selects use enum values (MALE, SSN, MONTHLY).',
    analysis: 'Steps could not be saved without these fields even with correct locators.',
    severity: 'Medium', priority: 'P2', status: 'Fixed in code - awaiting live re-run',
    fix: 'utils/dataBuilder.js, pages/KycFinancialPage.js', defects: [],
  },
  {
    id: 'AD-06', type: 'Test-data issue', module: 'Test isolation',
    title: 'Write flows ran as the seeded agent.valid, whose draft is shared and seeded',
    cases: ['WF-V01', 'WF-V03', 'BEN-V01', 'CLI-V01'],
    evidence: 'Login resumes or creates the agent\'s single draft (BR-AUTH-010); third project runs all write flows as a learner account.',
    analysis: 'Shared state between tests and with seeded data DASH-* relies on.',
    severity: 'Medium', priority: 'P2', status: 'Fixed in code - awaiting live re-run',
    fix: 'config/env.js learnerAgent (set LEARNER_USER to your assigned account); specs use agentRole learnerAgent', defects: [],
  },
  {
    id: 'AD-07', type: 'Test-data issue', module: 'Authentication',
    title: 'AUTH-V02 tried a wrong password on agent.valid; failed attempts count toward the 5-attempt lock (BR-AUTH-005)',
    cases: ['AUTH-V02', 'AUTH-V04', 'DASH-V01'],
    evidence: 'AUTH-V04 and DASH-V01 passed in RUN-1 but are missing from RUN-2\'s passed list.',
    analysis: 'HYPOTHESIS only: repeated failed attempts may have locked or disturbed agent.valid. Not confirmed - RUN-2 gives no failure text for those two tests.',
    severity: 'Medium', priority: 'P2', status: 'Fixed in code - awaiting live re-run',
    fix: 'tests/ui/auth.spec.js AUTH-V02 now uses the second agent', defects: ['RI-02'],
  },
  {
    id: 'AD-08', type: 'Automation defect', module: 'Client / KYC',
    title: 'CLI-V08 (SSN masking, release gate) silently skipped: it looked for an SSN field the real form does not have',
    cases: ['CLI-V08'],
    evidence: 'The real KYC form takes the SSN as the ID number when the ID type is SSN.',
    analysis: 'A P1 release-gate scenario was not executing.',
    severity: 'High', priority: 'P1', status: 'Fixed in code - awaiting live re-run',
    fix: 'tests/ui/client-kyc-sensitive.spec.js CLI-V08 rewritten (masked after reload, on review, no full SSN in page content)', defects: ['RI-07'],
  },
  {
    id: 'AD-09', type: 'Automation defect', module: 'Product',
    title: 'Journeys selected the first "whole life" product, whose minimum sum assured is above the default face value',
    cases: ['WF-V03', 'WF-V08', 'BEN-V01', 'DOC-V01', 'RIDER-V01'],
    evidence: 'RUN-3: "Sum assured is below the selected product minimum." at the product step in 5 tests (reference data: Elite Legacy minimum 500,000 vs default 250,000; SecureLife minimum 100,000).',
    analysis: 'The dropdown\'s first matching entry is not necessarily SecureLife. This is the application correctly enforcing a product rule, not an application defect.',
    severity: 'High', priority: 'P1', status: 'Fixed in code - awaiting live re-run',
    fix: 'config/env.js patterns.defaultProduct (SecureLife; override with DEFAULT_PRODUCT_PATTERN); utils/dataBuilder.js', defects: [],
  },
  {
    id: 'AD-10', type: 'Environment issue', module: 'Test setup',
    title: 'First login of a run exceeded the 45 s test timeout while creating the cached session',
    cases: ['WF-V01'],
    evidence: 'RUN-3: "Test timeout of 45000ms exceeded while setting up storageState" on the first test; later tests logged in fine.',
    analysis: 'PROBABLE: cold lab VM or slow first draft creation on login. Not an application defect unless it recurs after the timeout is raised.',
    severity: 'Medium', priority: 'P2', status: 'Fixed in code - awaiting live re-run',
    fix: 'fixtures/index.js storageState fixture has its own 180 s timeout', defects: [],
  },
  {
    id: 'AD-11', type: 'Environment issue', module: 'API',
    title: 'API base URL: every API call returned HTTP 404 at <host>:8081/api/',
    cases: ['API-V01', 'API-V02', 'API-V03', 'API-V04', 'API-V05', 'API-V06', 'API-V08', 'API-V10', 'API-V11'],
    evidence: 'RUN-3: API-V01 (with key) and API-V02 (without) both returned 404. curl on 28 Oct: http://34.93.84.61:8000/api/products = connection timed out (not reachable from the tester machine); :8081/api/products and :8082/api/products = HTTP 404 with a Laravel "Not Found" HTML page (Apache/PHP) - the server is up but has no route at that path.',
    analysis: 'CONFIRMED (discover:api, 28 Oct): all 24 probed paths under /api, /api/v1, /index.php/api, /public/api, /insurance/api and /api/insurance returned 404 on :8081; the pages make no background API calls and contain no /api strings. Anonymous GET /products and /applications return 401 JSON, which looks like the app\'s own login-protected pages, not a key-protected API. /health and /riders are 404. CONFIRMED: /api/products does not exist on :8081 or :8082, and :8000 is not reachable from the tester machine (possibly open only on the VM itself). NOT YET KNOWN: where the API really is (different prefix such as /api/v1, or an API only enabled on a local server). npm run discover:api records the calls the app\'s own pages make and probes likely paths.',
    severity: 'High', priority: 'P1', status: 'Open - real API path not yet found (run npm run discover:api)',
    fix: 'API tests now SKIP as an environment issue until the API answers (API_REQUIRED=true makes it a failure); ask the lab for the API address or run the API tests on the VM / via an SSH tunnel to :8000', defects: [],
  },
  // ---- application-side items: NOT reproduced by the team yet
  {
    id: 'AC-01', type: 'Application defect (candidate)', module: 'Review / Validation',
    title: 'Validation errors on the review page render as plain text, not links to the owning section',
    cases: ['VAL-V02'],
    evidence: 'Third project\'s ReviewPage notes "the app currently renders plain text". VAL-V02 expects clicking an item to navigate.',
    analysis: 'Either the requirement (links) is unmet or VAL-V02 over-specifies. Confirm the requirement, then reproduce on the lab.',
    severity: 'Low', priority: 'P3', status: 'Candidate - not reproduced', fix: '', defects: ['RI-17'],
  },
  {
    id: 'AC-02', type: 'Application defect (candidate)', module: 'API',
    title: 'API silently acts as learner001 when agent_email is omitted',
    cases: ['API-V08'],
    evidence: 'Stated in the third project\'s README and ApiClient notes; not observed by the team.',
    analysis: 'Possible data-scoping weakness: confirm with a call that omits agent_email.',
    severity: 'Medium', priority: 'P2', status: 'Candidate - not reproduced', fix: '', defects: ['RI-19'],
  },
  {
    id: 'CL-01', type: 'Clarification', module: 'Dashboard',
    title: 'No search or status-filter control is known on the dashboard',
    cases: ['DASH-V05', 'DASH-V07'],
    evidence: 'Third project\'s dashboard page object exposes only status counters and the latest 10 applications.',
    analysis: 'Ask the product owner whether search / filters are in scope before treating DASH-V05/V07 as defects.',
    severity: 'Low', priority: 'P3', status: 'Open', fix: '', defects: [],
  },
  {
    id: 'CL-02', type: 'Clarification', module: 'Dashboard / Authentication',
    title: 'Login auto-creates a draft, so a brand-new agent never sees the empty dashboard state',
    cases: ['DASH-V03'],
    evidence: 'BR-AUTH-010 (login resumes or creates the agent\'s draft).',
    analysis: 'DASH-V03 may be unreachable by design. Confirm with the product owner.',
    severity: 'Low', priority: 'P3', status: 'Open', fix: '', defects: [],
  },
];

/** Seeded-defect candidate ids (SDC-nn) the third project tags its tests with. RI-nn and SDC-nn describe the same 20 themes. */
const SDC_NOTE = 'SDC = "seeded-defect-candidate" id used by the third project\'s tests. The official DEF-* catalogue codes have still not been received.';

module.exports = { liveRuns, resultFor, defectLog, SDC_NOTE };
