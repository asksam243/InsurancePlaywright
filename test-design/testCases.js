/**
 * TEST CASE DESIGN - single source of truth.
 *
 * - The Excel sheet (test-design/Test_Case_Design_Sheet.xlsx) is generated from this file.
 * - Every Playwright test is declared as  tc('AUTH-V01', async (...) => {...})  and takes its title, tags,
 *   risk links and reported-issue (seeded defect theme) links FROM THIS FILE, so documentation and code cannot drift.
 * - scripts/check-traceability.js fails if a case is marked Automated without a test, or a test has no case.
 *
 * IDs: scenario ids (AUTH-V01 ...) come from Submission 1. Test case id = "TC-" + scenario id.
 * source:  'S1'   scenario in the Submission 1 inventory (69)
 *          'S1+'  scenario PROPOSED in Submission 1 (14)
 *          'S2+'  scenario ADDED in this submission to cover the coverage list in the Submission 2 guide (8)
 *          'DB'   database validation check from the Submission 1 validation strategy (10)
 *          'FW'   framework self-check (4)
 */
const { riskIndex } = require('./risks');

const MODULES = {
  AUTH: { name: 'Authentication & Session', tag: '@authentication' },
  DASH: { name: 'Agent Dashboard', tag: '@dashboard' },
  CLI: { name: 'Client / Insured Information', tag: '@client' },
  PROD: { name: 'Product Selection & Policy Configuration', tag: '@product' },
  RIDER: { name: 'Rider Selection', tag: '@rider' },
  BEN: { name: 'Beneficiary Management', tag: '@beneficiary' },
  DOC: { name: 'Document Upload', tag: '@document' },
  VAL: { name: 'Validation Summary', tag: '@validation' },
  WF: { name: 'Submission & Status Tracking', tag: '@workflow' },
  API: { name: 'API Validation', tag: '@api' },
  DB: { name: 'Database Validation', tag: '@database' },
  FW: { name: 'Framework Self-Checks', tag: '@framework' },
};

const A = 'Valid agent (AGENT_VALID) signed in via saved session; environment reachable';
const atStep = (n) => `${A}; NEW application open at the ${n} step with every earlier step completed using valid data`;
const EV = 'Screenshot + trace on failure';
const EV_SEEDED = 'Screenshot attached on pass AND fail; trace/video on failure; diagnostics.json (console + 5xx)';
const AGENT_DATA = 'AGENT_VALID_EMAIL / AGENT_VALID_PASSWORD';

/** Compact case builder. */
const T = (id, title, o) => ({
  id,
  prefix: id.split('-')[0],
  title,
  source: 'S1',
  type: 'UI Positive',
  priority: 'P2',
  severity: 'Medium',
  layer: 'UI',
  smoke: false,
  defects: [],
  pre: A,
  steps: [],
  data: 'Generated synthetic data (utils/dataBuilder.js)',
  expected: '',
  evidence: EV,
  automation: 'Automated',
  cond: '',
  blockedReason: '',
  ...o,
});

const cases = [
  // ------------------------------------------------------------------ AUTH
  T('AUTH-V01', 'Valid agent logs in; dashboard URL and greeting asserted', {
    type: 'UI Positive', priority: 'P1', severity: 'Critical', smoke: true, defects: ['RI-01'],
    pre: 'Seeded valid agent exists and is active; browser has no session',
    steps: ['Open /login', 'Enter valid agent email and password', 'Click Log in'],
    data: AGENT_DATA,
    expected: 'Browser leaves /login and lands on the dashboard; the logout control is visible',
    evidence: EV_SEEDED,
  }),
  T('AUTH-V02', 'Invalid password shows correct error message', {
    type: 'UI Negative', priority: 'P1', severity: 'High', defects: ['RI-02'],
    pre: 'Seeded valid agent exists; browser has no session',
    steps: ['Open /login', 'Enter valid email with a WRONG password', 'Click Log in'],
    data: 'AGENT_VALID_EMAIL + AGENT_INVALID_PASSWORD',
    expected: 'Stays on /login; an invalid-credentials message is shown (config/messages.js invalidCredentials); dashboard is not reachable',
    evidence: EV_SEEDED,
  }),
  T('AUTH-V03', 'Blank username/password show mandatory field errors', {
    type: 'UI Negative', priority: 'P2', severity: 'Medium',
    pre: 'Browser has no session',
    steps: ['Open /login', 'Leave email and password empty', 'Click Log in'],
    data: 'none',
    expected: 'Stays on /login; each empty field is flagged as required (inline message or browser validity state)',
  }),
  T('AUTH-V04', 'Logout clears session; protected route redirects to login', {
    type: 'UI Positive', priority: 'P1', severity: 'High', smoke: true,
    steps: ['Open the dashboard', 'Click Log out', 'Navigate directly to /dashboard'],
    expected: 'After logout the login page is shown; navigating to /dashboard redirects back to /login (no stale session)',
  }),
  T('AUTH-V05', 'Direct /dashboard access without login is blocked', {
    type: 'UI Security', priority: 'P1', severity: 'Critical', smoke: true,
    pre: 'Fresh browser context with no cookies or storage',
    steps: ['Navigate directly to /dashboard without logging in'],
    data: 'none',
    expected: 'Redirected to /login; no dashboard content is rendered',
  }),
  T('AUTH-V06', 'Locked user cannot access dashboard; lock message shown', {
    type: 'UI Negative', priority: 'P1', severity: 'High', defects: ['RI-02'],
    pre: 'Seeded locked agent (AGENT_LOCKED) exists',
    steps: ['Open /login', 'Enter locked agent credentials', 'Click Log in', 'Navigate to /dashboard'],
    data: 'AGENT_LOCKED_EMAIL / AGENT_LOCKED_PASSWORD',
    expected: 'Stays on /login with an account-locked message (not a generic "invalid password"); /dashboard redirects to login',
    evidence: EV_SEEDED,
  }),
  T('AUTH-V07', 'Account locks after five failed attempts', {
    type: 'UI Boundary', priority: 'P1', severity: 'High', defects: ['RI-02'], layer: 'UI + API',
    pre: 'DISPOSABLE agent (AGENT_LOCKOUT) that may be left locked; lock rule per assumption A06/Q07',
    steps: ['Attempt login with a wrong password 4 times', 'Confirm the message is still "invalid credentials"', 'Attempt a 5th wrong login (either message is acceptable - Q07)', 'Attempt login with the CORRECT password'],
    data: 'AGENT_LOCKOUT_EMAIL; LOCKOUT_ATTEMPTS (default 5)',
    expected: 'Attempts 1-4 show invalid-credentials; after the 5th failure the CORRECT password is refused with the account-locked message',
    evidence: EV_SEEDED, cond: 'Set AGENT_LOCKOUT_EMAIL (destructive: locks the account)',
  }),
  T('AUTH-V08', 'Password policy rejects weak password (reset/change)', {
    type: 'UI Negative', priority: 'P2', severity: 'Medium', defects: ['RI-03'],
    pre: 'DISPOSABLE reset agent (AGENT_RESET); simulated OTP known (OTP_CODE)',
    steps: ['Open /forgot-password and request a reset for the reset agent', 'Enter the OTP', 'For each weak password (short, no digit, no uppercase, common word) set it as the new password'],
    data: 'AGENT_RESET_EMAIL; OTP_CODE; weak password list in tests/ui/auth.spec.js',
    expected: 'Every weak password is rejected with a password-policy message; the password is not changed',
    evidence: EV_SEEDED, cond: 'Set AGENT_RESET_EMAIL and OTP_CODE (Q08, Q09)',
  }),
  T('AUTH-V09', 'MFA/OTP simulation login', {
    source: 'S1+', type: 'UI Positive', priority: 'P2', severity: 'High',
    pre: 'Seeded MFA agent (AGENT_MFA); simulated OTP known (OTP_CODE)',
    steps: ['Log in with MFA agent credentials', 'Confirm OTP prompt', 'Enter a WRONG OTP', 'Enter the correct OTP'],
    data: 'AGENT_MFA_EMAIL; OTP_CODE',
    expected: 'OTP prompt appears; wrong OTP is rejected; correct OTP completes login to the dashboard',
    cond: 'Set AGENT_MFA_EMAIL and OTP_CODE (Q06, Q08)',
  }),
  T('AUTH-V10', 'Session timeout redirects to login', {
    source: 'S1+', type: 'UI Boundary', priority: 'P2', severity: 'High',
    steps: ['Log in', 'Stay idle for SESSION_TIMEOUT_SECONDS + 2 seconds', 'Navigate to a protected page'],
    data: 'SESSION_TIMEOUT_SECONDS (short value on a test environment)',
    expected: 'The expired session is redirected to /login',
    cond: 'Set SESSION_TIMEOUT_SECONDS (Q07); keep it small',
  }),
  T('AUTH-V11', 'Forgot-password flow (/forgot-password)', {
    source: 'S1+', type: 'UI Positive', priority: 'P3', severity: 'Low',
    pre: 'Browser has no session',
    steps: ['Open /login', 'Click the forgot-password link', 'Enter the agent email', 'Submit'],
    data: AGENT_DATA,
    expected: 'The forgot-password page opens and submitting a known email shows a confirmation or the OTP step (no error)',
  }),
  T('AUTH-V12', 'Reset OTP: wrong OTP rejected; correct OTP reaches new-password step', {
    source: 'S2+', type: 'UI Negative', priority: 'P2', severity: 'High',
    pre: 'DISPOSABLE reset agent (AGENT_RESET); simulated OTP known (OTP_CODE)',
    steps: ['Open /forgot-password and request a reset', 'Enter a WRONG OTP', 'Enter the correct OTP'],
    data: 'AGENT_RESET_EMAIL; OTP_CODE',
    expected: 'Wrong OTP shows an OTP error and does not advance; correct OTP shows the new-password fields (password is NOT changed by this test)',
    cond: 'Set AGENT_RESET_EMAIL and OTP_CODE (Q08)',
  }),
  T('AUTH-V13', 'New password identical to the current password is rejected', {
    source: 'S2+', type: 'UI Negative', priority: 'P2', severity: 'Medium', defects: ['RI-03'],
    pre: 'DISPOSABLE reset agent (AGENT_RESET); OTP_CODE known',
    steps: ['Request reset and pass the OTP step', 'Enter the CURRENT password as the new password and confirm', 'Submit'],
    data: 'AGENT_RESET_EMAIL / AGENT_RESET_PASSWORD; OTP_CODE',
    expected: 'Rejected with a "must differ from current password" style message',
    evidence: EV_SEEDED, cond: 'Set AGENT_RESET_EMAIL and OTP_CODE',
  }),

  // ------------------------------------------------------------------ DASH
  T('DASH-V01', 'Dashboard loads: draft/submitted summary and New Application CTA', {
    priority: 'P1', severity: 'High', smoke: true,
    steps: ['Open the dashboard'],
    expected: 'New Application control is visible; draft and submitted summary figures are displayed as numbers',
  }),
  T('DASH-V02', 'Agent sees only own applications (multi-agent isolation)', {
    type: 'UI Security', priority: 'P1', severity: 'Critical', layer: 'UI + API',
    pre: 'Two seeded agents (AGENT_VALID, AGENT_SECOND), each with applications',
    steps: ['Open dashboard as agent A and collect row identifiers', 'Open dashboard as agent B and collect row identifiers', 'Compare the two sets'],
    data: 'AGENT_VALID_*, AGENT_SECOND_*',
    expected: 'The two sets of application rows do not overlap',
    cond: 'Set AGENT_SECOND_EMAIL (Q06)',
  }),
  T('DASH-V03', 'New agent sees empty-state copy and CTA', {
    priority: 'P3', severity: 'Low',
    pre: 'Seeded NEW agent (AGENT_NEW) with zero applications',
    steps: ['Sign in as the new agent', 'Open the dashboard'],
    data: 'AGENT_NEW_*',
    expected: 'Empty-state text and the New Application control are visible; no application rows',
    cond: 'Set AGENT_NEW_EMAIL (Q06)',
  }),
  T('DASH-V04', 'Draft can be resumed from dashboard with saved data', {
    defects: ['RI-16'], priority: 'P2', severity: 'High',
    pre: `${A}; client step reachable`,
    steps: ['Start a new application', 'Fill the client step and Save draft', 'Go to the dashboard', 'Resume the draft row', 'Read the client first name'],
    expected: 'The resumed draft shows the client first name that was saved',
    evidence: EV_SEEDED,
  }),
  T('DASH-V05', 'Status filters (Draft/Submitted/Approved) return correct rows', {
    priority: 'P2', severity: 'Medium',
    steps: ['Open the dashboard', 'For each status filter value (Draft, Submitted, Approved) apply the filter', 'Read the status of every visible row'],
    expected: 'Every visible row has the selected status (an empty result is acceptable only if no such applications exist)',
  }),
  T('DASH-V06', 'Dashboard status matches Application Status API', {
    type: 'UI-API Integration', layer: 'UI + API', priority: 'P1', severity: 'High', defects: ['RI-18'],
    steps: ['Open the dashboard and read id and status of up to 5 rows', 'Call GET /applications/{id}/status for each', 'Compare'],
    expected: 'UI status equals API status for every compared application',
    evidence: 'Screenshot + API response attached', 
  }),
  T('DASH-V07', 'Dashboard search returns matching applications', {
    source: 'S1+', priority: 'P3', severity: 'Low',
    pre: `${A}; at least one application exists`,
    steps: ['Open the dashboard', 'Take a search term from the first row', 'Search for it'],
    expected: 'At least one row is shown and every shown row contains the term',
  }),

  // ------------------------------------------------------------------ CLI
  T('CLI-V01', 'Valid insured personal information enables next step', {
    priority: 'P1', severity: 'Critical', smoke: true,
    pre: atStep('client').replace('with every earlier step completed using valid data', '(first step)'),
    steps: ['Fill every client field with valid data', 'Click Next'],
    expected: 'Navigation moves to the next step (step title changes) with no validation errors',
  }),
  T('CLI-V02', 'Mandatory personal fields validated inline', {
    type: 'UI Negative', priority: 'P2', severity: 'Medium',
    pre: atStep('client').replace('with every earlier step completed using valid data', '(first step)'),
    steps: ['Leave all client fields empty', 'Click Next'],
    data: 'none',
    expected: 'User stays on the step; first name, last name and date of birth each show a required message',
  }),
  T('CLI-V03', 'DOB under 18 rejected (age boundary)', {
    type: 'UI Boundary', priority: 'P1', severity: 'High', defects: ['RI-04'], layer: 'UI + API',
    pre: atStep('client').replace('with every earlier step completed using valid data', '(first step)'),
    steps: ['Enter DOB for a person who turns 18 TOMORROW (age 17) and click Next', 'Enter DOB for a person exactly 18 today and click Next'],
    data: 'dobForAge(18,{dayOffset:1}) and dobForAge(18)',
    expected: 'Age 17 is rejected with an eligibility message and the step does not advance; age 18 is accepted (inclusive rule - assumption A06 / Q10)',
    evidence: EV_SEEDED,
  }),
  T('CLI-V04', 'DOB over 65 rejected (age boundary)', {
    type: 'UI Boundary', priority: 'P1', severity: 'High', defects: ['RI-04'], layer: 'UI + API',
    pre: atStep('client').replace('with every earlier step completed using valid data', '(first step)'),
    steps: ['Enter DOB for a person exactly 66 years old and click Next', 'Enter DOB for a person exactly 65 today and click Next'],
    data: 'dobForAge(66) and dobForAge(65)',
    expected: 'Age 66 is rejected with an eligibility message; age 65 is accepted (inclusive rule - A06 / Q10)',
    evidence: EV_SEEDED,
  }),
  T('CLI-V05', 'Future DOB rejected', {
    type: 'UI Negative', priority: 'P1', severity: 'High', defects: ['RI-05'], layer: 'UI + API',
    pre: atStep('client').replace('with every earlier step completed using valid data', '(first step)'),
    steps: ['Enter a DOB of tomorrow and click Next', 'Enter a DOB 5 years in the future and click Next'],
    data: 'futureDate(1), futureDate(1825)',
    expected: 'Both dates are rejected with an invalid-date message and the step does not advance',
    evidence: EV_SEEDED,
  }),
  T('CLI-V06', 'Same-as-residential copies address to mailing address', {
    priority: 'P3', severity: 'Low',
    pre: atStep('address'),
    steps: ['Fill the residential address', 'Tick "same as residential"', 'Read the mailing address fields'],
    expected: 'Mailing line 1, city and ZIP equal the residential values',
  }),
  T('CLI-V07', 'Invalid email and phone formats rejected', {
    type: 'UI Negative', priority: 'P2', severity: 'Medium',
    pre: atStep('address'),
    steps: ['Fill a valid address', 'For each invalid email (no @, no domain, spaces) enter it and click Next', 'For each invalid phone (letters, too short) enter it and click Next'],
    data: 'Invalid email / phone lists in tests/ui/client.spec.js',
    expected: 'Each invalid value shows a format error next to the field and the step does not advance',
  }),
  T('CLI-V08', 'SSN masked after entry (only last four digits visible)', {
    type: 'UI Security', priority: 'P1', severity: 'Critical', defects: ['RI-07'],
    pre: atStep('kyc'),
    steps: ['Enter the synthetic SSN 900-12-3456', 'Leave the field (blur)', 'Read what is visible for the SSN'],
    data: 'Synthetic SSN 900-12-3456 (900-series is never issued)',
    expected: 'Only the last four digits (3456) are visible; the first five digits are masked',
    evidence: EV_SEEDED,
  }),
  T('CLI-V09', 'KYC upload rejects unsupported file type', {
    type: 'UI Negative', priority: 'P2', severity: 'Medium',
    pre: atStep('kyc'),
    steps: ['Upload an .exe file in the KYC document control'],
    data: 'In-memory malware-test.exe',
    expected: 'An unsupported-type message is shown and the file is not accepted',
    cond: 'Skips if the KYC step has no upload control',
  }),
  T('CLI-V10', 'PEP = Yes makes additional details mandatory', {
    type: 'UI Negative', priority: 'P2', severity: 'Medium',
    pre: atStep('kyc'),
    steps: ['Select PEP = Yes', 'Confirm the PEP details field appears', 'Click Next without details'],
    expected: 'PEP details field becomes visible and Next is blocked with a required message until it is filled',
  }),
  T('CLI-V11', 'Postal code format validated', {
    source: 'S1+', type: 'UI Negative', priority: 'P3', severity: 'Low',
    pre: atStep('address'),
    steps: ['Fill a valid address with an invalid ZIP (letters, too short, too long)', 'Click Next'],
    data: 'ZIPs: ABCDE, 123, 0211000000',
    expected: 'Each invalid ZIP is rejected with a postal-code message',
  }),
  T('CLI-V12', 'Income vs premium affordability validation', {
    source: 'S1+', type: 'UI Negative', priority: 'P1', severity: 'High', defects: ['RI-08'], layer: 'UI + API',
    pre: atStep('kyc'),
    steps: ['Enter a very LOW annual income', 'Continue to Product and select a product with a very HIGH face value', 'Click Next'],
    data: 'income 12000; face value 5,000,000 (rule undefined - Q11)',
    expected: 'An affordability warning or block referring to income/premium is shown (formula TBC with the product owner)',
    evidence: EV_SEEDED,
  }),
  T('CLI-V13', 'Calculated age is displayed after DOB entry', {
    source: 'S2+', priority: 'P2', severity: 'Medium',
    pre: atStep('client').replace('with every earlier step completed using valid data', '(first step)'),
    steps: ['Enter a DOB for each of ages 18, 35 and 65', 'Read the displayed age'],
    data: 'dobForAge(18|35|65)',
    expected: 'The age shown equals the age calculated from the DOB (calcAge in utils/dates.js)',
  }),
  T('CLI-V14', 'Name validation rejects digits and special characters', {
    source: 'S2+', type: 'UI Negative', priority: 'P2', severity: 'Medium',
    pre: atStep('client').replace('with every earlier step completed using valid data', '(first step)'),
    steps: ['Enter a first name containing digits, click Next', 'Enter a last name containing special characters, click Next'],
    data: 'First name "J0hn123"; last name "O@#$%"',
    expected: 'Each invalid name is rejected with a name-format message and the step does not advance',
  }),
  T('CLI-V15', 'State is required and validated', {
    source: 'S2+', type: 'UI Negative', priority: 'P2', severity: 'Medium',
    pre: atStep('address'),
    steps: ['Fill a valid address but clear the state selection', 'Click Next'],
    expected: 'A state-required message is shown and the step does not advance',
    cond: 'Skips if the state control has no empty option',
  }),

  // ------------------------------------------------------------------ PROD
  T('PROD-V01', 'Catalog displays expected Whole Life products', {
    priority: 'P1', severity: 'High', smoke: true,
    pre: atStep('product'),
    steps: ['Open the product step', 'Read the product cards'],
    data: 'PRODUCT_NAME_PATTERN (default "whole life")',
    expected: 'At least one product card is shown and at least one matches the Whole Life pattern',
  }),
  T('PROD-V02', 'Product details page shows features, eligibility, limits', {
    priority: 'P2', severity: 'Medium',
    pre: atStep('product'),
    steps: ['Open the details of the first product'],
    expected: 'Details mention features/benefits and eligibility or limits',
    cond: 'Skips if no details link exists',
  }),
  T('PROD-V03', 'Face value below minimum rejected', {
    type: 'UI Boundary', priority: 'P1', severity: 'High',
    pre: atStep('product'),
    steps: ['Select a product', 'Enter face value = minimum - 1', 'Click Next', 'Enter face value = minimum and click Next'],
    data: 'FACE_VALUE_MIN',
    expected: 'minimum-1 is rejected; exactly minimum is accepted',
    cond: 'Set FACE_VALUE_MIN (Q13)',
  }),
  T('PROD-V04', 'Face value above maximum rejected', {
    type: 'UI Boundary', priority: 'P1', severity: 'High',
    pre: atStep('product'),
    steps: ['Select a product', 'Enter face value = maximum + 1', 'Click Next'],
    data: 'FACE_VALUE_MAX',
    expected: 'maximum+1 is rejected with a limit message',
    cond: 'Set FACE_VALUE_MAX (Q13)',
  }),
  T('PROD-V05', 'Premium recalculates when frequency changes', {
    type: 'UI Positive', priority: 'P1', severity: 'High', defects: ['RI-12'], layer: 'UI + API',
    pre: atStep('product'),
    steps: ['Select a product and set face value', 'Read the premium for Monthly', 'Change frequency to Annual and read the premium', 'Change back to Monthly'],
    data: 'FACE_VALUE_DEFAULT; frequencies Monthly / Annual',
    expected: 'The displayed premium changes when frequency changes and returns to the original value when switched back',
    evidence: EV_SEEDED,
  }),
  T('PROD-V06', 'Review-page premium matches configuration page', {
    type: 'UI Consistency', priority: 'P1', severity: 'High', defects: ['RI-12'], layer: 'UI + DB',
    pre: atStep('product'),
    steps: ['Select product, configure and read the premium', 'Complete riders (none), beneficiaries and documents', 'Open the review step and read the premium'],
    expected: 'Review premium equals the configured premium',
    evidence: EV_SEEDED,
  }),
  T('PROD-V07', 'Suitability warning shown for risk-profile mismatch', {
    type: 'UI Negative', priority: 'P2', severity: 'Medium', defects: ['RI-09'],
    pre: atStep('kyc'),
    steps: ['Set a Conservative risk profile in KYC', 'Select the product whose risk is a known mismatch', 'Observe the product step'],
    data: 'SUITABILITY_PRODUCT_PATTERN',
    expected: 'A suitability warning is displayed',
    cond: 'Set SUITABILITY_PRODUCT_PATTERN (Q13)',
  }),
  T('PROD-V08', 'Product eligibility validated against client age', {
    source: 'S1+', type: 'UI Negative', priority: 'P1', severity: 'High', defects: ['RI-09'], layer: 'UI + API',
    pre: atStep('client').replace('with every earlier step completed using valid data', '(first step)'),
    steps: ['Create a client of the ineligible age', 'Continue to Product', 'Select the age-restricted product'],
    data: 'INELIGIBLE_AGE, INELIGIBLE_AGE_PRODUCT_PATTERN',
    expected: 'The product is disabled, or selecting it shows an eligibility message and does not advance',
    evidence: EV_SEEDED, cond: 'Set INELIGIBLE_AGE and INELIGIBLE_AGE_PRODUCT_PATTERN (Q13)',
  }),
  T('PROD-V09', 'Payment term and policy term options follow product rules', {
    source: 'S1+', priority: 'P2', severity: 'Medium',
    pre: atStep('product'),
    steps: ['Select a product', 'Read payment-term and policy-term options'],
    expected: 'Both lists are non-empty and contain no duplicate options (term-combination rules TBC - Q14)',
    cond: 'Skips if the terms are not dropdowns',
  }),
  T('PROD-V10', 'Inactive product cannot be selected', {
    source: 'S2+', type: 'UI Negative', priority: 'P2', severity: 'Medium',
    pre: atStep('product'),
    steps: ['Find product cards marked inactive', 'Try to select one'],
    expected: 'The select control is disabled (or selection is refused) for every inactive product',
    cond: 'Skips if the environment shows no inactive product',
  }),
  T('PROD-V11', 'Product configuration persists after save draft and reload', {
    source: 'S2+', priority: 'P2', severity: 'High', defects: ['RI-16'], layer: 'UI + DB',
    pre: atStep('product'),
    steps: ['Select a product and set face value and frequency', 'Save draft', 'Reload the page', 'Read face value and frequency'],
    expected: 'Face value and frequency are unchanged after reload',
    evidence: EV_SEEDED,
  }),

  // ------------------------------------------------------------------ RIDER
  T('RIDER-V01', 'Eligible protection rider (ADB) added to premium summary', {
    priority: 'P1', severity: 'High', smoke: true,
    pre: atStep('riders'),
    steps: ['Add the Accidental Death Benefit rider', 'Read the rider premium summary'],
    data: 'RIDER_ADB_PATTERN',
    expected: 'The rider shows as added and a rider premium greater than zero appears in the summary',
  }),
  T('RIDER-V02', 'Rider coverage cannot exceed base face value', {
    type: 'UI Boundary', priority: 'P1', severity: 'High', defects: ['RI-10'], layer: 'UI + API',
    pre: atStep('riders'),
    steps: ['Add the ADB rider', 'Enter rider coverage = face value + 1'],
    data: 'FACE_VALUE_DEFAULT + 1',
    expected: 'A rider-exceeds-face-value message is shown and the value is not accepted',
    evidence: EV_SEEDED,
  }),
  T('RIDER-V03', 'Age-ineligible rider disabled or blocked', {
    type: 'UI Negative', priority: 'P2', severity: 'Medium',
    pre: `${A}; client step completed with a client of the age that makes the rider ineligible`,
    steps: ['Open the rider step', 'Try to add the age-restricted rider'],
    data: 'RIDER_AGE_RESTRICTED_PATTERN; client age 64',
    expected: 'The rider control is disabled, or adding it shows an eligibility message',
    cond: 'Set RIDER_AGE_RESTRICTED_PATTERN (Q15)',
  }),
  T('RIDER-V04', 'Maximum rider count enforced with message', {
    type: 'UI Boundary', priority: 'P2', severity: 'Medium',
    pre: atStep('riders'),
    steps: ['Add riders up to the maximum', 'Try to add one more'],
    data: 'MAX_RIDERS',
    expected: 'The extra rider is refused with a maximum-count message',
    cond: 'Set MAX_RIDERS (Q15); needs more rider cards than the maximum',
  }),
  T('RIDER-V05', 'Mutually exclusive waiver riders cannot both be selected', {
    type: 'UI Negative', priority: 'P1', severity: 'High', defects: ['RI-11'],
    pre: atStep('riders'),
    steps: ['Add waiver rider A', 'Try to add waiver rider B'],
    data: 'RIDER_WAIVER_A_PATTERN / RIDER_WAIVER_B_PATTERN',
    expected: 'Rider B is disabled or refused with a message; both are never selected at once',
    evidence: EV_SEEDED, cond: 'Set RIDER_WAIVER_A_PATTERN and RIDER_WAIVER_B_PATTERN (Q15)',
  }),
  T('RIDER-V06', 'Critical illness rider triggers health questionnaire', {
    priority: 'P2', severity: 'Medium',
    pre: atStep('riders'),
    steps: ['Add the Critical Illness rider'],
    data: 'RIDER_CRITICAL_ILLNESS_PATTERN',
    expected: 'The health questionnaire is displayed',
    cond: 'Skips if no critical illness rider is offered',
  }),
  T('RIDER-V07', 'Rider premium itemized and total premium updated', {
    priority: 'P1', severity: 'High', defects: ['RI-12'],
    pre: atStep('riders'),
    steps: ['Read total premium', 'Add the ADB rider', 'Read the rider premium and the new total'],
    expected: 'New total = old total + rider premium (to 2 decimals)',
    evidence: EV_SEEDED,
  }),

  // ------------------------------------------------------------------ BEN
  T('BEN-V01', 'Valid primary beneficiary added (card/row appears)', {
    priority: 'P1', severity: 'High', smoke: true,
    pre: atStep('beneficiaries'),
    steps: ['Fill an individual primary beneficiary with 100% allocation', 'Save'],
    expected: 'One beneficiary row appears containing the entered name',
  }),
  T('BEN-V02', 'Primary allocation below 100% blocks progression', {
    type: 'UI Boundary', priority: 'P1', severity: 'High', defects: ['RI-13'], layer: 'UI + API + DB',
    pre: atStep('beneficiaries'),
    steps: ['Add one primary beneficiary with 60% (and 99%)', 'Click Next'],
    data: 'Allocations 60 and 99',
    expected: 'Progression is blocked with an allocation message (total must equal 100)',
    evidence: EV_SEEDED,
  }),
  T('BEN-V03', 'Primary allocation above 100% blocks progression', {
    type: 'UI Boundary', priority: 'P1', severity: 'High', defects: ['RI-13'], layer: 'UI + API + DB',
    pre: atStep('beneficiaries'),
    steps: ['Add primary beneficiaries with 60% and 60% (total 120%)', 'Click Next'],
    data: 'Allocations 60 + 60 (and a single 101)',
    expected: 'Progression is blocked with an allocation message',
    evidence: EV_SEEDED,
  }),
  T('BEN-V04', 'Secondary allocation validated separately', {
    type: 'UI Negative', priority: 'P2', severity: 'Medium',
    pre: atStep('beneficiaries'),
    steps: ['Add a primary beneficiary with 100%', 'Add a secondary with 50%', 'Click Next', 'Add a second secondary with 50%', 'Click Next'],
    expected: 'Secondary total of 50% blocks progression; with secondary total 100% progression succeeds',
  }),
  T('BEN-V05', 'Minor beneficiary requires guardian details', {
    type: 'UI Negative', priority: 'P1', severity: 'High', defects: ['RI-14'], layer: 'UI + API + DB',
    pre: atStep('beneficiaries'),
    steps: ['Add a beneficiary aged 10 WITHOUT guardian details and save/continue', 'Add guardian name and relationship and continue'],
    data: 'dobForAge(10)',
    expected: 'Missing guardian is refused with a guardian message; with guardian details it is accepted',
    evidence: EV_SEEDED,
  }),
  T('BEN-V06', 'Trust type shows Trust Name, Trustee Name, Trust Date', {
    priority: 'P3', severity: 'Low',
    pre: atStep('beneficiaries'),
    steps: ['Open the add form', 'Select beneficiary type Trust'],
    expected: 'Trust name, trustee name and trust date fields are visible',
  }),
  T('BEN-V07', 'Organization type shows registration and contact fields', {
    priority: 'P3', severity: 'Low',
    pre: atStep('beneficiaries'),
    steps: ['Open the add form', 'Select beneficiary type Organization'],
    expected: 'Organization name, registration and contact fields are visible',
  }),
  T('BEN-V08', 'Duplicate beneficiary (Name + DOB + Relationship) blocked', {
    type: 'UI Negative', priority: 'P2', severity: 'Medium', defects: ['RI-15'], layer: 'UI + API',
    pre: atStep('beneficiaries'),
    steps: ['Add a beneficiary (50%)', 'Add a second with the SAME name, DOB and relationship'],
    expected: 'The duplicate is refused with a duplicate message and only one row remains',
    evidence: EV_SEEDED,
  }),
  T('BEN-V09', 'Removing a beneficiary updates running allocation total', {
    priority: 'P2', severity: 'Medium',
    pre: atStep('beneficiaries'),
    steps: ['Add two primary beneficiaries (60% and 40%)', 'Remove the first'],
    expected: 'Row count drops from 2 to 1; where the page shows a running total it becomes 40',
  }),
  T('BEN-V10', 'At least one primary beneficiary is mandatory', {
    source: 'S1+', type: 'UI Negative', priority: 'P1', severity: 'High',
    pre: atStep('beneficiaries'),
    steps: ['Click Next with no beneficiaries', 'Add only a SECONDARY beneficiary and click Next'],
    expected: 'Progression is blocked in both cases',
  }),
  T('BEN-V11', 'Irrevocable beneficiary triggers legal confirmation modal', {
    source: 'S1+', priority: 'P2', severity: 'Medium',
    pre: atStep('beneficiaries'),
    steps: ['Fill a beneficiary and tick irrevocable', 'Save'],
    expected: 'A legal confirmation dialog appears and can be confirmed',
  }),

  // ------------------------------------------------------------------ DOC / VAL
  T('DOC-V01', 'Valid KYC document (PDF/JPG/PNG) uploads successfully', {
    priority: 'P1', severity: 'High', smoke: true,
    pre: atStep('documents'),
    steps: ['Upload a valid PDF', 'Upload a valid JPG', 'Upload a valid PNG'],
    data: 'In-memory files (utils/files.js)',
    expected: 'Each upload is accepted: no error is shown and an uploaded-document entry is present',
  }),
  T('DOC-V02', 'Unsupported file type rejected', {
    type: 'UI Negative', priority: 'P2', severity: 'Medium', defects: [], layer: 'UI + API',
    pre: atStep('documents'),
    steps: ['Upload an .exe file', 'Upload a .txt file'],
    expected: 'Each is rejected with a file-type message and no uploaded entry is created',
  }),
  T('DOC-V03', 'File above maximum size rejected', {
    type: 'UI Boundary', priority: 'P2', severity: 'Medium',
    pre: atStep('documents'),
    steps: ['Upload a PDF of (maximum + 1) MB'],
    data: 'MAX_UPLOAD_MB',
    expected: 'Rejected with a file-size message',
    cond: 'Set MAX_UPLOAD_MB (Q17)',
  }),
  T('DOC-V04', 'Missing mandatory document blocks submission', {
    type: 'UI Negative', priority: 'P1', severity: 'Critical', defects: ['RI-06'], layer: 'UI + API + DB',
    pre: atStep('documents'),
    steps: ['Do NOT upload any document', 'Click Next', 'If the review step is reached, try to submit'],
    expected: 'Either Next is blocked with a document message, or the review step cannot be submitted and no reference number is issued',
    evidence: EV_SEEDED,
  }),
  T('VAL-V01', 'Validation summary lists all unresolved errors, grouped', {
    type: 'UI Negative', priority: 'P1', severity: 'High',
    pre: `${A}; review step reached with the mandatory documents missing`,
    steps: ['Reach the review step without documents', 'Read the validation summary'],
    expected: 'The summary shows at least one item and one refers to documents',
    cond: 'Skips if the app does not allow reaching review with errors',
  }),
  T('VAL-V02', 'Clicking a summary item navigates to the field/section', {
    priority: 'P3', severity: 'Low',
    pre: `${A}; review step reached with errors`,
    steps: ['Click the first validation summary item'],
    expected: 'The browser moves to the section that owns the error (step title or URL changes)',
    cond: 'Skips if the app does not allow reaching review with errors',
  }),
  T('VAL-V03', 'Submit stays disabled until critical errors are resolved', {
    type: 'UI Negative', priority: 'P1', severity: 'Critical', defects: ['RI-17'],
    pre: `${A}; review step reached with the mandatory documents missing`,
    steps: ['Confirm Submit is disabled', 'Resolve the error (upload documents)', 'Return to review'],
    expected: 'Submit is disabled while errors exist and enabled once they are resolved',
    evidence: EV_SEEDED, cond: 'Skips if the app does not allow reaching review with errors',
  }),

  // ------------------------------------------------------------------ WF
  T('WF-V01', 'Partial application saved as draft; draft row on dashboard', {
    priority: 'P1', severity: 'High', smoke: true, defects: ['RI-16'],
    steps: ['Start a new application', 'Complete the client step and move on', 'Save draft on the address step', 'Open the dashboard'],
    expected: 'A row with status Draft exists on the dashboard',
    evidence: EV_SEEDED,
  }),
  T('WF-V02', 'Draft resumed with previously saved data intact', {
    priority: 'P1', severity: 'High', defects: ['RI-16'], layer: 'UI + DB',
    steps: ['Start a new application and fill the client step', 'Save draft', 'Go to the dashboard and resume the draft', 'Return to the client step'],
    expected: 'First name, last name and date of birth equal the saved values',
    evidence: EV_SEEDED,
  }),
  T('WF-V03', 'Full E2E: valid application submitted; reference number shown', {
    type: 'E2E', priority: 'P1', severity: 'Critical', smoke: true, layer: 'UI + API + DB',
    steps: ['Log in', 'Start a new application', 'Complete every step with valid data', 'Submit on the review step'],
    expected: 'A non-empty reference number is displayed',
    evidence: 'Screenshot (review + confirmation) attached on pass and fail',
  }),
  T('WF-V04', 'Submitted application is read-only', {
    priority: 'P2', severity: 'Medium', layer: 'UI',
    steps: ['Complete and submit an application', 'Inspect the page for editable controls'],
    expected: 'No editable input remains and the submit control is gone or disabled',
  }),
  T('WF-V05', 'Confirmation / status message shown after submission', {
    priority: 'P3', severity: 'Low',
    steps: ['Complete and submit an application'],
    expected: 'A confirmation message matching the submitted pattern is displayed',
  }),
  T('WF-V06', 'Dashboard status becomes Submitted after submission', {
    type: 'E2E', priority: 'P1', severity: 'High', defects: ['RI-18'], layer: 'UI + API + DB',
    steps: ['Complete and submit an application', 'Open the dashboard', 'Find the application row'],
    expected: 'The application row shows status Submitted',
    evidence: EV_SEEDED,
  }),
  T('WF-V07', 'Application detail status matches Status API', {
    type: 'UI-API Integration', priority: 'P1', severity: 'High', defects: ['RI-18'], layer: 'UI + API + DB',
    steps: ['Submit an application and read the status on the page', 'Call GET /applications/{id}/status'],
    expected: 'UI status text equals the API status',
    evidence: 'Screenshot + API response attached', cond: 'Skips if the application id cannot be read from the URL',
  }),
  T('WF-V08', 'Review page reflects the entered client, product and beneficiary data', {
    source: 'S2+', type: 'UI Consistency', priority: 'P1', severity: 'High', smoke: true,
    steps: ['Complete every step with valid data', 'Open the review step', 'Read the review text'],
    expected: 'Review shows the client name, the beneficiary name and a premium equal to the configured premium',
    evidence: 'Screenshot of review attached on pass and fail',
  }),

  // ------------------------------------------------------------------ API
  T('API-V01', 'Products API returns 200 and expected schema', {
    type: 'API', layer: 'API', priority: 'P1', severity: 'High', smoke: true,
    pre: 'Valid agent authenticated through POST /auth/login',
    steps: ['GET /products'],
    expected: '200, JSON, non-empty list; each product has an id and a name',
    evidence: 'Response status/body attached',
  }),
  T('API-V02', 'Applications API requires authorization (401/403)', {
    type: 'API Security', layer: 'API', priority: 'P1', severity: 'Critical', smoke: true,
    pre: 'No token / no session',
    steps: ['GET /applications without credentials'],
    data: 'none',
    expected: '401 or 403; no application data in the body',
    evidence: 'Response status/body attached',
  }),
  T('API-V03', 'Client API rejects future / underage DOB', {
    type: 'API Negative', layer: 'API', priority: 'P1', severity: 'High', defects: ['RI-05', 'RI-19'],
    pre: 'Authenticated agent; a DISPOSABLE draft application id (created via API or taken from the first draft)',
    steps: ['POST /applications/{id}/client with DOB tomorrow', 'POST with DOB of an age-17 person'],
    expected: 'Both are rejected with a 4xx validation response',
    evidence: 'Response status/body attached', cond: 'Needs a draft application id (Q21)',
  }),
  T('API-V04', 'Validate API returns beneficiary allocation error', {
    type: 'API Negative', layer: 'API', priority: 'P1', severity: 'High', defects: ['RI-13', 'RI-19'],
    pre: 'Authenticated agent; DISPOSABLE draft application id',
    steps: ['POST /applications/{id}/beneficiaries with a single 60% primary', 'POST /applications/{id}/validate'],
    expected: 'The validation result contains an allocation error',
    evidence: 'Response status/body attached', cond: 'Needs a draft application id (Q21)',
  }),
  T('API-V05', 'Submit API rejects incomplete application', {
    type: 'API Negative', layer: 'API + DB', priority: 'P1', severity: 'Critical', defects: ['RI-06'],
    pre: 'Authenticated agent; a draft application that is INCOMPLETE',
    steps: ['POST /applications/{id}/submit'],
    expected: '4xx response; no reference number in the body',
    evidence: 'Response status/body attached', cond: 'Needs a draft application id (Q21)',
  }),
  T('API-V06', 'Status API matches the applications list', {
    type: 'UI-API Integration', layer: 'API', priority: 'P1', severity: 'High', defects: ['RI-18'],
    steps: ['GET /applications', 'For up to 5 items GET /applications/{id}/status', 'Compare status'],
    expected: 'List status equals status-endpoint status for each application',
    evidence: 'Response status/body attached',
  }),
  T('API-V07', 'Product detail API matches UI detail page', {
    type: 'UI-API Integration', layer: 'UI + API', priority: 'P2', severity: 'Medium', defects: ['RI-19'],
    pre: atStep('product'),
    steps: ['Read the first product name on the UI', 'GET /products and find the same product', 'GET /products/{id}'],
    expected: 'The API product name appears in the UI product card text',
    evidence: 'Screenshot + API response attached', cond: 'Needs product ids in the API response',
  }),
  T('API-V08', 'Applications API returns only logged-in agent records', {
    type: 'API Security', layer: 'API', priority: 'P1', severity: 'Critical',
    pre: 'Two seeded agents (AGENT_VALID, AGENT_SECOND)',
    steps: ['GET /applications as agent A', 'GET /applications as agent B', 'Compare ids'],
    data: 'AGENT_VALID_*, AGENT_SECOND_*',
    expected: 'The id sets are disjoint',
    evidence: 'Response status/body attached', cond: 'Set AGENT_SECOND_EMAIL (Q06)',
  }),
  T('API-V09', 'Riders API schema, eligibility and dependency rules', {
    source: 'S1+', type: 'API', layer: 'API', priority: 'P2', severity: 'Medium',
    steps: ['GET /riders'],
    expected: '200, JSON, non-empty list; each rider has an id and a name',
    evidence: 'Response status/body attached',
  }),
  T('API-V10', 'Documents API rejects invalid type and oversized file', {
    source: 'S1+', type: 'API Negative', layer: 'API', priority: 'P2', severity: 'Medium',
    pre: 'Authenticated agent; DISPOSABLE draft application id',
    steps: ['POST /applications/{id}/documents with an .exe', 'POST with an oversize PDF'],
    expected: 'Both are rejected with 4xx',
    evidence: 'Response status/body attached', cond: 'Needs a draft application id; oversize part needs MAX_UPLOAD_MB',
  }),
  T('API-V11', 'Status API returns history and timestamps', {
    source: 'S1+', type: 'API', layer: 'API', priority: 'P2', severity: 'Medium',
    steps: ['GET /applications', 'GET /applications/{id}/status for the first application'],
    expected: '200 and a status value; where a history is returned each entry has a timestamp',
    evidence: 'Response status/body attached',
  }),
  T('API-V12', 'UI/API validation parity for the same invalid input', {
    source: 'S1+', type: 'UI-API Integration', layer: 'UI + API', priority: 'P1', severity: 'High', defects: ['RI-19', 'RI-05'],
    pre: atStep('client').replace('with every earlier step completed using valid data', '(first step)'),
    steps: ['Enter a future DOB in the UI and click Next', 'Send the same DOB to POST /applications/{id}/client'],
    expected: 'Both the UI and the API reject the future DOB',
    evidence: 'Screenshot + API response attached', cond: 'Needs the application id from the URL',
  }),

  // ------------------------------------------------------------------ DB (conditional on database access - Q04)
  ...[
    ['DB-01', 'Draft row exists with fields entered so far; resume matches stored data', 'WF-V01, WF-V02'],
    ['DB-02', 'Submitted application has unique reference number and status = Submitted', 'WF-V03, WF-V06'],
    ['DB-03', 'Status history has a new timestamped entry for each transition', 'API-V11'],
    ['DB-04', 'Primary / secondary allocations each sum to 100; no duplicate Name+DOB+Relationship', 'BEN-V02..V09'],
    ['DB-05', 'Minor beneficiary has a linked guardian record', 'BEN-V05'],
    ['DB-06', 'Stored premium equals the premium on the review page, including itemized riders', 'PROD-V06, RIDER-V07'],
    ['DB-07', 'SSN is not stored or logged in clear text', 'CLI-V08'],
    ['DB-08', 'Document records exist with status for each mandatory document', 'DOC-V01, DOC-V04'],
    ['DB-09', 'Application rows are keyed to the owning agent', 'DASH-V02, API-V08'],
    ['DB-10', 'Failed-attempt counter and lock state update at the fifth failed login', 'AUTH-V07'],
  ].map(([id, title, link]) => T(id, title, {
    source: 'DB', type: 'Database', layer: 'DB', priority: 'P2', severity: 'High',
    pre: 'Read-only database access granted (Q04); schema / data dictionary shared',
    steps: ['Run the UI or API scenario that creates the data', 'Run the read-only validation query for this check', 'Compare the result with the UI/API value'],
    data: `Linked scenario(s): ${link}`,
    expected: 'Query result matches the UI/API outcome (see the illustrative query pattern in Submission 1, section 3.4)',
    evidence: 'Query text + result attached to the report',
    automation: 'Blocked',
    blockedReason: 'No database engine, schema or credentials supplied (Submission 1 question Q04 / dependency D06). API-read proxy is used where the linked API scenario exists.',
  })),

  // ------------------------------------------------------------------ FW (framework self-checks - run offline)
  T('FW-01', 'Evidence: diagnostics, screenshots, traces and videos are configured for debugging', {
    source: 'FW', type: 'Framework', layer: 'Framework', priority: 'P1', severity: 'Medium', defects: ['RI-20'],
    pre: 'None - runs without the application',
    steps: ['Load playwright.config.js', 'Assert screenshot, video, trace, HTML/JSON/JUnit reporters are enabled', 'Assert the diagnostics fixture is registered as an automatic fixture'],
    data: 'none',
    expected: 'All evidence settings are present',
    evidence: 'Unit test output', 
  }),
  T('FW-02', 'Environment: configuration is externalised and the health check classifies failures', {
    source: 'FW', type: 'Framework', layer: 'Framework', priority: 'P1', severity: 'Medium',
    pre: 'None - runs without the application',
    steps: ['Scan the repository for hard-coded URLs, IPs and credentials outside config / .env.example', 'Check the health-check classifier maps timeouts and 5xx to ENVIRONMENT'],
    data: 'none',
    expected: 'No hard-coded base URL, IP address or password outside the config layer; failures are classified as ENVIRONMENT vs APPLICATION',
    evidence: 'Unit test output',
  }),
  T('FW-03', 'Test data: builders are unique per call and date boundaries are calculated correctly', {
    source: 'FW', type: 'Framework', layer: 'Framework', priority: 'P1', severity: 'Medium',
    pre: 'None - runs without the application',
    steps: ['Generate 500 clients and beneficiaries and check name uniqueness', 'Check dobForAge / calcAge for ages 17/18/65/66, leap years and the day-before/after birthday'],
    data: 'none',
    expected: 'No duplicates; boundary dates produce exactly the intended ages',
    evidence: 'Unit test output',
  }),
  T('FW-04', 'Traceability: every automated test maps to a case; every case maps to a risk', {
    source: 'FW', type: 'Framework', layer: 'Framework', priority: 'P1', severity: 'Medium',
    pre: 'None - runs without the application',
    steps: ['Load the case registry and the risk register', 'Check each non-framework case links to at least one risk', 'Check reported issues RI-01..RI-20 each link to at least one case'],
    data: 'none',
    expected: 'No orphan cases, risks or reported issues',
    evidence: 'Unit test output',
  }),
];



// ---- PRIORITY POLICY (tightened after Submission 1 review feedback) --------------------------------------------------
// Submission 1 rated 52 of 105 scenarios P1, so P1 no longer said what MUST pass for a release.
// P1 now means RELEASE GATE: a failure blocks the release. Only the scenarios below qualify; they were chosen because a
// failure means (a) agents cannot work, (b) sensitive data or another agent's data is exposed, (c) an invalid / non-compliant
// policy can be issued, or (d) the core journey cannot be completed and tracked. Everything else is regression (P2) or P3.
// Smoke (@smoke) is a separate, fast "is the environment alive" subset and is unchanged.
const RELEASE_GATE = [
  'AUTH-V01', 'AUTH-V05', 'AUTH-V06',            // agents can sign in; protected pages are protected; locked users stay out
  'DASH-V02',                                    // an agent never sees another agent's applications
  'CLI-V05', 'CLI-V08',                          // future DOB rejected; SSN masked
  'PROD-V01', 'PROD-V05', 'PROD-V06',            // products load; premium recalculates and review matches configuration
  'RIDER-V02',                                   // rider cannot exceed base face value
  'BEN-V02', 'BEN-V05',                          // allocation must total 100%; minors need a guardian
  'DOC-V04', 'VAL-V03',                          // missing mandatory documents / validation errors block submission
  'WF-V01', 'WF-V03', 'WF-V06',                  // draft saved; full journey submits with a reference; dashboard status correct
  'API-V02', 'API-V05',                          // API refuses unauthenticated calls and incomplete submissions
];
const SENSITIVE = ['CLI-V08', 'CLI-V09', 'CLI-V10', 'CLI-V12']; // tests that type SSN / KYC / income: no trace or video (see README)

// ---- risk links not listed in the Submission 1 "Covered by" column ---------------------------------------------
// Submission 1 mapped 69 scenarios to risks by name. These cases are either new in Submission 2 or were not named in
// that column, so they are linked here to the closest risk (author judgement - review with the mentor). Every case
// must trace to at least one risk; FW-04 enforces that.
const EXTRA_RISKS = {
  'AUTH-V03': ['R02'], 'AUTH-V09': ['R01'], 'AUTH-V11': ['R06'], 'AUTH-V12': ['R06'], 'AUTH-V13': ['R06'],
  'DASH-V01': ['R07'], 'DASH-V03': ['R07'], 'DASH-V05': ['R07'], 'DASH-V07': ['R07'],
  'CLI-V01': ['R10'], 'CLI-V02': ['R10'], 'CLI-V09': ['R30'], 'CLI-V11': ['R15'], 'CLI-V13': ['R10'], 'CLI-V14': ['R15'], 'CLI-V15': ['R15'],
  'PROD-V01': ['R16'], 'PROD-V02': ['R16'], 'PROD-V09': ['R18'], 'PROD-V10': ['R16'], 'PROD-V11': ['R33', 'R18'],
  'RIDER-V01': ['R23'], 'RIDER-V06': ['R22'],
  'BEN-V01': ['R24'], 'BEN-V04': ['R24'], 'BEN-V10': ['R24'],
  'DOC-V01': ['R30'],
  'WF-V05': ['R34'], 'WF-V06': ['R07', 'R34'], 'WF-V07': ['R07', 'R34'], 'WF-V08': ['R19'],
  'API-V01': ['R37'], 'API-V07': ['R37'], 'API-V09': ['R37'], 'API-V11': ['R34'],
  'FW-04': ['R39'],
};

// ---- derive tags, ids, risk links ---------------------------------------------------------------------------
for (const c of cases) {
  const mod = MODULES[c.prefix];
  if (!mod) throw new Error(`Unknown module prefix for ${c.id}`);
  c.tcId = `TC-${c.id}`;
  c.submission1Priority = c.priority;
  c.gate = RELEASE_GATE.includes(c.id);
  if (c.gate) c.priority = 'P1';
  else if (c.priority === 'P1') c.priority = 'P2';
  c.sensitive = SENSITIVE.includes(c.id);
  c.explore = [...new Set((c.cond.match(/Q\d+/g) || []).concat((c.blockedReason.match(/Q\d+/g) || [])))];
  c.module = mod.name;
  c.risks = [...new Set([...(riskIndex[c.id] || []), ...(EXTRA_RISKS[c.id] || [])])];
  const tags = ['@regression', mod.tag, `@${c.priority.toLowerCase()}`];
  if (c.smoke) tags.push('@smoke');
  if (c.gate) tags.push('@release-gate');
  if (c.sensitive) tags.push('@sensitive');
  if (c.defects.length) tags.push('@seeded');
  if (c.type === 'E2E') tags.push('@e2e');
  if (/API/.test(c.layer) && c.prefix !== 'API') tags.push('@api');
  c.tags = [...new Set(tags)];
}

for (const g of RELEASE_GATE) if (!cases.find((c) => c.id === g)) throw new Error(`Release gate id ${g} not in registry`);
const byId = Object.fromEntries(cases.map((c) => [c.id, c]));
if (Object.keys(byId).length !== cases.length) throw new Error('Duplicate test case id in testCases.js');

module.exports = { cases, byId, MODULES, RELEASE_GATE };
