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
  {
    id: 'RUN-4',
    when: '2026-10-28 (after product / timeout / API-skip fixes)',
    scope: 'Smoke (@smoke), chromium + api',
    code: 'Merged repo v3',
    total: 15, passed: 11, failed: 2, skipped: 2, durationMin: 2.5,
    note: 'End-to-end submission (WF-V03), draft save (WF-V01), beneficiaries, documents and client info pass live. Failures: WF-V08 (over-specified review check, AD-12) and RIDER-V01 (premium summary not read, AD-13). API-V01/V02 skipped as an environment issue (AD-11). The review shows Calculated Age 36 for a DOB 35 years back (AC-04).',
  },
  {
    id: 'RUN-5',
    when: '2026-10-28 (after the WF-V08 / CLI-V13 / diagnostics patch)',
    scope: 'Smoke (@smoke), chromium + api',
    code: 'Merged repo v4',
    total: 15, passed: 12, failed: 1, skipped: 2, durationMin: 2.0,
    note: 'Only RIDER-V01 fails: the page shows "Current rider premium: $0.00" until the step is saved (AD-13). API-V01/V02 still skipped (AD-11). CLI-V13 (age) not yet run.',
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
const RUN4 = {
  passed: ['WF-V01', 'WF-V03', 'AUTH-V01', 'AUTH-V14', 'AUTH-V04', 'AUTH-V05', 'BEN-V01', 'CLI-V01', 'DASH-V01', 'DOC-V01', 'PROD-V01'],
  failed: ['WF-V08', 'RIDER-V01'],
  skipped: ['API-V01', 'API-V02'],
};
const RUN5 = {
  passed: ['WF-V01', 'WF-V03', 'WF-V08', 'AUTH-V01', 'AUTH-V14', 'AUTH-V04', 'AUTH-V05', 'BEN-V01', 'CLI-V01', 'DASH-V01', 'DOC-V01', 'PROD-V01'],
  failed: ['RIDER-V01'],
  skipped: ['API-V01', 'API-V02'],
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
  if (run === 'RUN-5') {
    if (RUN5.passed.includes(id)) return 'Passed';
    if (RUN5.failed.includes(id)) return 'Failed';
    if (RUN5.skipped.includes(id)) return 'Skipped (environment)';
    return smoke ? 'Not itemised' : 'Not in smoke scope';
  }
  if (run === 'RUN-4') {
    if (RUN4.passed.includes(id)) return 'Passed';
    if (RUN4.failed.includes(id)) return 'Failed';
    if (RUN4.skipped.includes(id)) return 'Skipped (environment)';
    return smoke ? 'Not itemised' : 'Not in smoke scope';
  }
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
    severity: 'High', priority: 'P1', status: 'Mostly verified live in RUN-4 (client, address, KYC, product, beneficiaries, documents, review, confirmation work; riders premium summary still open - AD-13)',
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
    severity: 'High', priority: 'P1', status: 'Mostly verified live in RUN-4 (product, beneficiary, document pages work); rider premium reading open - AD-13',
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
    severity: 'High', priority: 'P1', status: 'Verified live in RUN-4 (WF-V03, BEN-V01, DOC-V01 now pass)',
    fix: 'config/env.js patterns.defaultProduct (SecureLife; override with DEFAULT_PRODUCT_PATTERN); utils/dataBuilder.js', defects: [],
  },
  {
    id: 'AD-10', type: 'Environment issue', module: 'Test setup',
    title: 'First login of a run exceeded the 45 s test timeout while creating the cached session',
    cases: ['WF-V01'],
    evidence: 'RUN-3: "Test timeout of 45000ms exceeded while setting up storageState" on the first test; later tests logged in fine.',
    analysis: 'PROBABLE: cold lab VM or slow first draft creation on login. Not an application defect unless it recurs after the timeout is raised.',
    severity: 'Medium', priority: 'P2', status: 'Verified live in RUN-4 (WF-V01 passed in 6.6 s; no timeout)',
    fix: 'fixtures/index.js storageState fixture has its own 180 s timeout', defects: [],
  },
  {
    id: 'AD-12', type: 'Automation defect', module: 'Review',
    title: 'WF-V08 expected the beneficiary on the review page; the live review snapshot has no beneficiary section',
    cases: ['WF-V08'],
    evidence: 'RUN-4 failure text: review shows Client, Calculated Age, Product, Sum Assured, Frequency, Payment Term, Coverage Term, Base/Rider/Total premium and Status only.',
    analysis: 'The test over-specified the page. Whether the review SHOULD list beneficiaries is a requirement question (CL-03).',
    severity: 'Medium', priority: 'P2', status: 'Verified live in RUN-5 (WF-V08 passes)',
    fix: 'tests/e2e/workflow.spec.js WF-V08 checks client, product, sum assured and premium on review, and the beneficiary on its own step', defects: [],
  },
  {
    id: 'AD-13', type: 'Automation defect', module: 'Riders',
    title: 'RIDER-V01: the rider premium summary figure was not read (NaN after 8 s)',
    cases: ['RIDER-V01', 'RIDER-V07'],
    evidence: 'RUN-4: "rider premium in the summary ... Expected > 0, Received NaN".',
    analysis: 'CONFIRMED by the attached diagnostics (RUN-5): the page shows "Current rider premium: $0.00" after the rider is ticked. The premium is calculated by the server on SAVE, not live; the third project\'s own RIDER-V01 saves, reopens the step and then reads the summary. The test assumed a live update.',
    severity: 'Medium', priority: 'P2', status: 'Fixed in code - awaiting live re-run', fix: 'tests/ui/riders.spec.js RIDER-V01 saves and reopens the step (RiderPage.saveAndReopen); RIDER-V07 reads the review breakdown (ReviewSubmitPage.premiumBreakdown)', defects: ['RI-12'],
  },
  {
    id: 'AD-11', type: 'Environment issue', module: 'API',
    title: 'API base URL: every API call returned HTTP 404 at <host>:8081/api/',
    cases: ['API-V01', 'API-V02', 'API-V03', 'API-V04', 'API-V05', 'API-V06', 'API-V08', 'API-V10', 'API-V11'],
    evidence: 'RUN-3: API-V01 (with key) and API-V02 (without) both returned 404. curl on 28 Oct: http://34.93.84.61:8000/api/products = connection timed out (not reachable from the tester machine); :8081/api/products and :8082/api/products = HTTP 404 with a Laravel "Not Found" HTML page (Apache/PHP) - the server is up but has no route at that path.',
    analysis: 'CONFIRMED by the application itself (discover:api, 28 Oct, signed-in session): Laravel answers "The route api/products could not be found" (same for api/applications), and every probed /api prefix is 404. /applications, /products and /applications/<id>/status return normal HTML pages. So this deployment (C:\\qa-lab\\apps\\insurance-order-entry-demo) registers NO API routes. HYPOTHESES to put to the lab admin: the API is only enabled when QA_DEMO_API_KEY is set in the app\'s environment, or it is a separate service reachable only from the VM (port 8000 timed out from the tester machine). Not an application defect until the lab confirms the API is meant to exist here.',
    severity: 'High', priority: 'P1', status: 'Open - no API routes in this deployment; ask the lab admin',
    fix: 'API tests SKIP as an environment issue until the API answers (API_REQUIRED=true makes that a failure). Ask the lab admin: is QA_DEMO_API_KEY set and the API enabled on this VM, and where is it served?', defects: [],
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
    id: 'AC-03', type: 'Application defect (candidate)', module: 'Platform / Security',
    title: 'Unknown routes return a debug exception page that leaks the exception class and the server file path',
    cases: ['API-V02'],
    evidence: 'Observed by the team in discover:api output (28 Oct): GET /api/products with Accept: application/json returns JSON containing "exception": "Symfony\\Component\\HttpKernel\\Exception\\NotFoundHttpException" and "file": "C:\\qa-lab\\apps\\insurance-order-entry-demo\\vendor\\laravel\\framework\\src...". Reproduce with curl.exe -H "Accept: application/json" http://34.93.84.61:8081/api/products',
    analysis: 'Looks like APP_DEBUG=true. That is expected in a training lab but would be an information-disclosure finding in any real environment. Confirm with the product owner whether debug mode is intended here before rating it.',
    severity: 'Low', priority: 'P3', status: 'Observed - awaiting confirmation it is not intended', fix: '', defects: [],
  },
  {
    id: 'AC-04', type: 'Application defect (candidate)', module: 'Client / Review',
    title: 'Calculated Age on the review page shows 36 for a client born exactly 35 years ago today',
    cases: ['CLI-V13', 'WF-V08'],
    evidence: 'RUN-4 WF-V08 failure text pasted the review snapshot: "Calculated Age 36". The tests enter dobForAge(35) = today minus 35 years (UTC). The exact DOB typed was not captured in that run; CLI-V13 now attaches DOB and age.',
    analysis: 'Possible off-by-one in the age calculation (a seeded-defect theme, RI-04). NOT yet reproduced deliberately: re-run CLI-V13 and confirm by hand (enter a DOB exactly 35 years ago and read the age on review).',
    severity: 'Medium', priority: 'P2', status: 'Candidate - reproduce with CLI-V13', fix: '', defects: ['RI-04'],
  },
  {
    id: 'CL-03', type: 'Clarification', module: 'Review',
    title: 'Should the review page list the beneficiaries (and riders)?',
    cases: ['WF-V08'],
    evidence: 'The live review snapshot shows client, product and premiums only.',
    analysis: 'Ask the product owner; if yes, this is an application gap.',
    severity: 'Low', priority: 'P3', status: 'Open', fix: '', defects: [],
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
