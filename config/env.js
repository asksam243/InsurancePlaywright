/**
 * Single place where environment variables are read.
 * Nothing else in the repo should touch process.env, so URLs, credentials and toggles never
 * get hard-coded across spec files (Submission 2, "Common mistakes to avoid").
 *
 * MERGED from the starter project (32-test cohort build) and the Submission 2 build:
 *   - Values the starter project CONFIRMED against the lab (seeded accounts, X-API-Key, rider / upload limits)
 *     are now defaults here instead of empty "TBC" placeholders.
 *   - The starter project's env-var names (VALID_AGENT_EMAIL, BASE_URL, API_KEY ...) are still honoured as
 *     fallbacks, so an old .env keeps working. The Submission 2 names win when both are set.
 *   - Anything the starter project did NOT confirm (lockout / reset accounts, OTP, face-value limits ...)
 *     stays empty and its tests skip with a reason, exactly as before.
 */
require('dotenv').config();

// INSURANCE_PASSWORD is the third project's name for the shared lab password (Lab Manual 3.1); honoured as a fallback.
const DEFAULT_PASSWORD = process.env.INSURANCE_PASSWORD || 'Password@123';

const bool = (v, dflt = false) => (v === undefined || v === '' ? dflt : String(v).toLowerCase() === 'true');
const num = (v) => (v === undefined || v === '' || Number.isNaN(Number(v)) ? null : Number(v));
const str = (v, dflt = '') => (v === undefined || v === '' ? dflt : String(v));
const regex = (v) => (v ? new RegExp(v, 'i') : null);
const trimSlash = (u) => u.replace(/\/+$/, '');
/** First environment variable among `names` that is set to a non-empty value. */
const firstEnv = (...names) => names.map((n) => process.env[n]).find((v) => v !== undefined && v !== '');

// BASE_URL is the starter project's name for the same thing. API_BASE_URL is deliberately NOT aliased: the starter
// project's value was the host root (it appended /api itself), whereas INSURANCE_API_URL here already includes /api.
const baseUrl = trimSlash(str(firstEnv('INSURANCE_BASE_URL', 'BASE_URL'), 'http://localhost:8081'));
// Trailing slash matters: relative endpoint paths ("applications") then APPEND to /api instead of
// replacing it (lesson carried over from the FinServe starter project).
const rawApi = trimSlash(str(firstEnv('INSURANCE_API_URL', 'INSURANCE_API_BASE_URL'), `${baseUrl}/api`));

/** { email, password } from <PREFIX>_EMAIL / _PASSWORD, falling back to the starter project's <LEGACY>_EMAIL / _PASSWORD. */
const user = (prefix, dfltEmail = '', dfltPassword = DEFAULT_PASSWORD, legacyPrefix = '') => ({
  email: str(firstEnv(`${prefix}_EMAIL`, legacyPrefix && `${legacyPrefix}_EMAIL`), dfltEmail),
  password: str(firstEnv(`${prefix}_PASSWORD`, legacyPrefix && `${legacyPrefix}_PASSWORD`), dfltPassword),
});

/**
 * 30 seeded learner accounts (learner001..learner030@insurance.test, same default password).
 * Login resumes-or-creates the agent's single draft (BR-AUTH-010), so tests that must start from a clean draft
 * should take their own learner account instead of sharing agent.valid.
 */
const learnerAccount = (n) => {
  const padded = String(n).padStart(3, '0');
  return user(`LEARNER_${padded}`, `learner${padded}@insurance.test`);
};

module.exports = {
  baseUrl,
  apiBaseUrl: `${rawApi}/`,
  // CONFIRMED (starter project, platform Setup/Troubleshooting guides): every /api/* call is gated by a static
  // X-API-Key header. This is the lab's documented demo key, not a secret; override it in .env / CI secrets.
  apiKey: str(firstEnv('INSURANCE_API_KEY', 'API_KEY', 'QA_DEMO_API_KEY'), 'qa-insurance-demo-token-123'),
  // key     = static X-API-Key only (default; a login call is still attempted but its failure is not fatal)
  // bearer  = POST auth/login returns a token that is sent as Authorization: Bearer
  // session = POST auth/login sets a session cookie that the request context carries
  // Whether agent-scoped endpoints also need a per-agent session on top of the key is still open (Q03).
  apiAuthMode: str(process.env.API_AUTH_MODE, 'key'),
  // When the API cannot be reached at the configured base URL the API tests are SKIPPED as an environment problem (not failed as a
  // product defect). Set API_REQUIRED=true to make that a hard failure instead (e.g. in CI once the API address is known).
  apiRequired: bool(process.env.API_REQUIRED),
  isCI: process.env.CI === 'true', // explicit compare: the string "false" is truthy in JS
  // Shared lab VM: ONE worker until a stable baseline exists (raise WORKERS deliberately, e.g. WORKERS=2, then watch for flakiness).
  workers: Math.max(1, num(process.env.WORKERS) || 1),
  crossBrowser: bool(process.env.CROSS_BROWSER),
  browserChannel: str(process.env.BROWSER_CHANNEL) || undefined,
  chromiumExecutablePath: str(process.env.CHROMIUM_EXECUTABLE_PATH) || undefined,
  dateFormat: str(process.env.DATE_FORMAT, 'iso'),
  otpCode: str(process.env.OTP_CODE),
  expectFailDefects: new Set(str(process.env.EXPECT_FAIL_DEFECTS).split(',').map((s) => s.trim()).filter(Boolean)),

  users: {
    // Seeded accounts CONFIRMED by the platform Setup Guide (section 11); default password Password@123.
    validAgent: user('AGENT_VALID', 'agent.valid@insurance.test', DEFAULT_PASSWORD, 'VALID_AGENT'),
    lockedAgent: user('AGENT_LOCKED', 'agent.locked@insurance.test', DEFAULT_PASSWORD, 'LOCKED_AGENT'),
    invalidAgent: user('AGENT_INVALID', 'notreal@insurance.test', 'WrongPassword@1'),
    newAgent: user('AGENT_NEW', 'agent.new@insurance.test', DEFAULT_PASSWORD, 'NEW_AGENT'),
    mfaAgent: user('AGENT_MFA', 'agent.mfa@insurance.test', DEFAULT_PASSWORD, 'MFA_AGENT'),
    draftAgent: user('AGENT_DRAFT', 'agent.draft@insurance.test', DEFAULT_PASSWORD, 'DRAFT_AGENT'), // seeded with an existing draft
    submittedAgent: user('AGENT_SUBMITTED', 'agent.submitted@insurance.test', DEFAULT_PASSWORD, 'SUBMITTED_AGENT'), // seeded with a submitted application
    adminUser: user('ADMIN', 'admin@insurance.test', DEFAULT_PASSWORD, 'ADMIN'), // the only role that lands on /dashboard
    // WRITE FLOWS RUN AS THE LEARNER ACCOUNT, not agent.valid, so the seeded agents' drafts stay untouched (the third
    // project's rule). Set LEARNER_USER to YOUR assigned account (Lab Manual); learner001 is only the default.
    learnerAgent: { email: str(process.env.LEARNER_USER, 'learner001@insurance.test'), password: DEFAULT_PASSWORD },
    // A second, independent agent for the multi-agent isolation checks. Override with AGENT_SECOND_EMAIL.
    secondAgent: user('AGENT_SECOND', 'learner002@insurance.test'),
    // NOT confirmed as seeded: these are DISPOSABLE accounts that get locked / have their password reset.
    // No defaults, so a guessed account is never burned; those tests skip until the variable is set.
    lockoutAgent: user('AGENT_LOCKOUT'),
    resetAgent: user('AGENT_RESET'),
  },

  learnerAccount,

  rules: {
    ageMin: 18,
    ageMax: 65,
    ageInclusive: bool(process.env.AGE_BOUNDARY_INCLUSIVE, true), // Assumption A06 / Q10
    lockoutAttempts: num(process.env.LOCKOUT_ATTEMPTS) || 5, // CONFIRMED BR-AUTH-005 (auto-unlock after DEMO_LOCKOUT_MINUTES, default 30)
    faceValueDefault: num(process.env.FACE_VALUE_DEFAULT) || 250000,
    faceValueMin: num(process.env.FACE_VALUE_MIN), // TBC - Q13
    faceValueMax: num(process.env.FACE_VALUE_MAX), // TBC - Q13
    maxRiders: num(process.env.MAX_RIDERS) || 4, // CONFIRMED: DEMO_MAX_RIDERS_PER_APPLICATION (was TBC - Q15)
    maxUploadMb: num(process.env.MAX_UPLOAD_MB) || 5, // CONFIRMED: DEMO_DOCUMENT_MAX_SIZE_MB (was TBC - Q17)
    sessionTimeoutSeconds: num(process.env.SESSION_TIMEOUT_SECONDS), // TBC - Q07
    patterns: {
      product: regex(str(process.env.PRODUCT_NAME_PATTERN, 'whole life')), // what the CATALOGUE must show
      // The product the journeys SELL. The dropdown's first entry can have a higher minimum than the default face value
      // (live smoke run: "Sum assured is below the selected product minimum"), so a specific product is chosen.
      defaultProduct: regex(str(process.env.DEFAULT_PRODUCT_PATTERN, 'SecureLife')),
      riderAdb: regex(str(process.env.RIDER_ADB_PATTERN, 'accidental')),
      riderWaiverA: regex(process.env.RIDER_WAIVER_A_PATTERN),
      riderWaiverB: regex(process.env.RIDER_WAIVER_B_PATTERN),
      riderCriticalIllness: regex(str(process.env.RIDER_CRITICAL_ILLNESS_PATTERN, 'critical')),
      riderAgeRestricted: regex(process.env.RIDER_AGE_RESTRICTED_PATTERN),
      suitabilityProduct: regex(process.env.SUITABILITY_PRODUCT_PATTERN),
      ineligibleAgeProduct: regex(process.env.INELIGIBLE_AGE_PRODUCT_PATTERN),
    },
    ineligibleAge: num(process.env.INELIGIBLE_AGE),
  },
};
