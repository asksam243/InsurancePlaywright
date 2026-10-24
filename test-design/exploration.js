/**
 * EXPLORATION REGISTER - everything Submission 1 marked TBC / open, to be resolved by a SHORT hands-on walkthrough of the live
 * application BEFORE the automation is trusted (time-box: about 90 minutes). Each row says what to look for and where the answer
 * is recorded. Dependent test cases are derived from the "Qnn" references in test-design/testCases.js.
 */
module.exports = [
  { q: 'Q02', find: 'Base URL / port of the UI and API; reachable from the machine AND from the CI runner', record: '.env INSURANCE_BASE_URL, INSURANCE_API_URL', minutes: 5 },
  { q: 'Q03', find: 'API authentication (bearer token vs session cookie), header names, login response shape; payload field names for client / beneficiary / document calls', record: '.env API_AUTH_MODE, INSURANCE_API_KEY; api/helpers.js payloads', minutes: 10 },
  { q: 'Q04', find: 'Is read-only database access available? Engine, schema / data dictionary', record: 'Unblocks DB-01..DB-10 (Blocked until then)', minutes: 5 },
  { q: 'Q06', find: 'Which seeded users exist: new agent, second agent, MFA agent; which can be locked / reset safely (disposable)', record: '.env AGENT_*_EMAIL', minutes: 10 },
  { q: 'Q07', find: 'Lockout behaviour (5th failure locks? duration / unlock) and session timeout length', record: '.env LOCKOUT_ATTEMPTS, SESSION_TIMEOUT_SECONDS', minutes: 5 },
  { q: 'Q08', find: 'How OTP is simulated (fixed code?) for login MFA and password reset', record: '.env OTP_CODE', minutes: 5 },
  { q: 'Q09', find: 'Exact password policy rules and the change / reset page route', record: 'config/messages.js passwordPolicy; tests/ui/auth.spec.js weak list', minutes: 5 },
  { q: 'Q10', find: 'Age 18 and 65 inclusive? Age calculated on which date?', record: '.env AGE_BOUNDARY_INCLUSIVE', minutes: 3 },
  { q: 'Q11', find: 'Income vs premium affordability rule: block or warning, threshold, where it appears', record: 'tests/ui/client.spec.js CLI-V12 data; config/messages.js affordability', minutes: 5 },
  { q: 'Q13', find: 'Face value min / max per product, product eligibility by age, suitability mismatch example, exact Whole Life product names', record: '.env FACE_VALUE_MIN/MAX, PRODUCT_NAME_PATTERN, INELIGIBLE_AGE*, SUITABILITY_PRODUCT_PATTERN', minutes: 10 },
  { q: 'Q14', find: 'Valid payment-term / policy-term combinations', record: 'tests/ui/product.spec.js PROD-V09', minutes: 3 },
  { q: 'Q15', find: 'Maximum rider count, age-restricted rider, which waiver riders are exclusive, rider names', record: '.env MAX_RIDERS, RIDER_*_PATTERN', minutes: 5 },
  { q: 'Q17', find: 'Maximum upload size and which documents are mandatory', record: '.env MAX_UPLOAD_MB', minutes: 3 },
  { q: 'Q21', find: 'Can tests create their own draft applications (UI and API)? Is cleanup possible?', record: 'api/helpers.js disposableDraft()', minutes: 5 },
  { q: 'ROUTES', find: 'Walk the full journey once; note the URL of every step, the application id pattern in the URL, and the exact wording of validation messages', record: 'config/routes.js, config/messages.js, config/selectors.js (run npm run discover)', minutes: 20 },
];
