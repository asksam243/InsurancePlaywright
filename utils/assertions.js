const { expect } = require('@playwright/test');
const { S } = require('../config/selectors');
const { maskedScreenshot, redact } = require('./evidence');

/** The user was refused: still on the same step, and (optionally) a message matching `pattern` is visible. */
async function expectBlocked(pageObj, titleBefore, pattern) {
  await pageObj.expectStillOnStep(titleBefore);
  if (pattern) await pageObj.expectErrorText(pattern);
}

/** The user moved on to a different step. */
async function expectAdvanced(pageObj, titleBefore) {
  await pageObj.expectAdvanced(titleBefore);
}

/** Attaches a labelled, MASKED full-page screenshot to the HTML report (evidence for passed validations too). */
async function captureEvidence(page, testInfo, label) {
  const body = await maskedScreenshot(page);
  await testInfo.attach(label, { body, contentType: 'image/png' });
}

/** Attaches an API exchange (status + body) to the report. Sensitive keys are redacted first. */
async function attachApi(testInfo, label, res, body) {
  await testInfo.attach(label, {
    body: JSON.stringify({ url: res.url(), status: res.status(), body: redact(body) }, null, 2),
    contentType: 'application/json',
  });
}

/** Compares two displayed dates ignoring format (yyyy-mm-dd vs mm/dd/yyyy): same set of numbers. */
function sameDate(a, b) {
  const nums = (x) => String(x).split(/\D+/).filter(Boolean).map(Number).sort((p, q) => p - q).join('-');
  return nums(a) === nums(b);
}

module.exports = { expectBlocked, expectAdvanced, captureEvidence, attachApi, sameDate };
