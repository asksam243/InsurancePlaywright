/**
 * Evidence helpers that keep sensitive data out of reports.
 *  - maskedScreenshot(): full-page PNG with SSN / ID / income / DOB / password fields painted over.
 *  - redact(): strips sensitive keys from API bodies before they are attached.
 * Rule of thumb (README): synthetic data only, masked screenshots, no trace/video for @sensitive tests.
 */
const { SENSITIVE_FIELDS } = require('../config/selectors');
const { loc } = require('./locators');

const SENSITIVE_KEYS = /ssn|social|idnumber|id_number|password|token|authorization|income|networth|net_worth|dob|dateofbirth|pep/i;

function redact(value) {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, SENSITIVE_KEYS.test(k) ? '[REDACTED]' : redact(v)]));
  }
  return value;
}

async function maskedScreenshot(page) {
  const mask = SENSITIVE_FIELDS.map((def) => loc(page, def));
  return page.screenshot({ fullPage: true, mask, maskColor: '#444444' });
}

module.exports = { maskedScreenshot, redact, SENSITIVE_KEYS };
