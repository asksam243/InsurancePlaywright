/**
 * Single place where environment variables are read.
 * Nothing else in the repo should touch process.env, so URLs, credentials and toggles never
 * get hard-coded across spec files (Submission 2, "Common mistakes to avoid").
 */
require('dotenv').config();

const bool = (v, dflt = false) => (v === undefined || v === '' ? dflt : String(v).toLowerCase() === 'true');
const num = (v) => (v === undefined || v === '' || Number.isNaN(Number(v)) ? null : Number(v));
const str = (v, dflt = '') => (v === undefined || v === '' ? dflt : String(v));
const regex = (v) => (v ? new RegExp(v, 'i') : null);
const trimSlash = (u) => u.replace(/\/+$/, '');

const baseUrl = trimSlash(str(process.env.INSURANCE_BASE_URL, 'http://localhost:8081'));
// Trailing slash matters: relative endpoint paths ("applications") then APPEND to /api instead of
// replacing it (lesson carried over from the FinServe starter project).
const rawApi = trimSlash(str(process.env.INSURANCE_API_URL, `${baseUrl}/api`));

const user = (prefix, dfltEmail = '', dfltPassword = 'Password@123') => ({
  email: str(process.env[`${prefix}_EMAIL`], dfltEmail),
  password: str(process.env[`${prefix}_PASSWORD`], dfltPassword),
});

module.exports = {
  baseUrl,
  apiBaseUrl: `${rawApi}/`,
  apiKey: str(process.env.INSURANCE_API_KEY),
  apiAuthMode: str(process.env.API_AUTH_MODE, 'bearer'),
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
    validAgent: user('AGENT_VALID', 'agent.valid@insurance.test'),
    lockedAgent: user('AGENT_LOCKED', 'agent.locked@insurance.test'),
    invalidAgent: user('AGENT_INVALID', 'notreal@insurance.test', 'WrongPassword@1'),
    // No defaults for the users below: their names are not confirmed (Q06), so a guessed default
    // would produce misleading "application defect" failures. Tests skip until the env var is set.
    newAgent: user('AGENT_NEW'),
    secondAgent: user('AGENT_SECOND'),
    mfaAgent: user('AGENT_MFA'),
    lockoutAgent: user('AGENT_LOCKOUT'),
    resetAgent: user('AGENT_RESET'),
  },

  rules: {
    ageMin: 18,
    ageMax: 65,
    ageInclusive: bool(process.env.AGE_BOUNDARY_INCLUSIVE, true), // Assumption A06 / Q10
    lockoutAttempts: num(process.env.LOCKOUT_ATTEMPTS) || 5,
    faceValueDefault: num(process.env.FACE_VALUE_DEFAULT) || 250000,
    faceValueMin: num(process.env.FACE_VALUE_MIN), // TBC - Q13
    faceValueMax: num(process.env.FACE_VALUE_MAX), // TBC - Q13
    maxRiders: num(process.env.MAX_RIDERS), // TBC - Q15
    maxUploadMb: num(process.env.MAX_UPLOAD_MB), // TBC - Q17
    sessionTimeoutSeconds: num(process.env.SESSION_TIMEOUT_SECONDS), // TBC - Q07
    patterns: {
      product: regex(str(process.env.PRODUCT_NAME_PATTERN, 'whole life')),
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
