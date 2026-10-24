/**
 * Small cross-cutting helpers shared across page objects and tests.
 * Kept deliberately minimal — bigger domain logic belongs in
 * dataGenerator.js or the relevant page object.
 */

/** Waits for a toast/snackbar-style transient message and returns its text. */
async function waitForToast(page, testId = 'toast-message') {
  const toast = page.getByTestId(testId);
  await toast.waitFor({ state: 'visible' });
  return toast.textContent();
}

/** Repeats an invalid login attempt n times — used for AUTH-V07 (lockout after 5 attempts). */
async function repeatInvalidLogin(loginPage, email, password, times) {
  for (let i = 0; i < times; i++) {
    await loginPage.goto();
    await loginPage.login(email, password);
  }
}

/** Extracts the application id from a URL like /applications/APP-1234/client. */
function extractApplicationId(url) {
  const match = url.match(/\/applications\/([^/]+)/);
  return match ? match[1] : null;
}

/** Simple currency-string comparator so "$1,250.00" vs 1250 compares cleanly. */
function parseCurrency(value) {
  return Number(String(value).replace(/[^0-9.-]+/g, ''));
}

module.exports = { waitForToast, repeatInvalidLogin, extractApplicationId, parseCurrency };
