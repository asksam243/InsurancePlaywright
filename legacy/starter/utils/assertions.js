const { expect } = require('@playwright/test');

/** Asserts a field-level inline error is visible for a given field's testid. */
async function expectFieldError(page, fieldTestId, messagePattern) {
  const error = page.getByTestId(`${fieldTestId}-error`);
  await expect(error).toBeVisible();
  if (messagePattern) {
    await expect(error).toHaveText(messagePattern);
  }
}

/** Asserts the beneficiary allocation total reads a specific percentage. */
async function expectAllocationTotal(page, expectedPercent) {
  const total = page.getByTestId('allocation-total');
  await expect(total).toHaveText(new RegExp(`${expectedPercent}\\s*%`));
}

/** Asserts the review/validation summary is blocking submission with errors present. */
async function expectValidationSummaryBlocking(page) {
  const summary = page.getByTestId('validation-summary');
  await expect(summary).toBeVisible();
  const items = page.getByTestId('validation-summary-item');
  await expect(items.first()).toBeVisible();
  const submitButton = page.getByRole('button', { name: /submit application/i });
  await expect(submitButton).toBeDisabled();
}

/** Asserts an application reference number of a plausible shape is shown. */
async function expectReferenceNumber(page) {
  const ref = page.getByTestId('application-reference-number');
  await expect(ref).toBeVisible();
  const text = (await ref.textContent()) || '';
  expect(text.trim().length).toBeGreaterThan(0);
  return text.trim();
}

module.exports = {
  expectFieldError,
  expectAllocationTotal,
  expectValidationSummaryBlocking,
  expectReferenceNumber,
};
