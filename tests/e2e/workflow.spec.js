const { test, tc, expect, env } = require('../../fixtures');
const M = require('../../config/messages');
const { S } = require('../../config/selectors');
const { formatDate } = require('../../utils/dates');
const { buildClient } = require('../../utils/dataBuilder');
const { startApplication, progressTo, fillStep, finishFrom, reachReview } = require('../../utils/flows');
const { captureEvidence, sameDate } = require('../../utils/assertions');

/** Completes the whole journey and submits. Returns { id, data, reference }. */
async function submitValidApplication(pages) {
  const { id, data } = await reachReview(pages);
  await expect(pages.review.submitButton).toBeEnabled();
  await pages.review.submit();
  const reference = await pages.review.referenceNumber();
  return { id, data, reference };
}

test.describe('Submission & Status Tracking', () => {
  test.use({ agentRole: 'validAgent' });

  test(...tc('WF-V01'), async ({ pages }) => {
    const { id, data } = await progressTo(pages, 'address');
    await pages.address.saveDraft();
    await pages.dashboard.goto();
    const row = pages.dashboard.rowForApplication({ name: data.client.lastName, id });
    await expect(row, 'the saved draft should be listed on the dashboard').toBeVisible();
    await expect(pages.dashboard.statusOf(row)).toHaveText(/draft/i);
  });

  test(...tc('WF-V02'), async ({ pages }) => {
    const id = await startApplication(pages);
    const client = buildClient();
    await pages.client.fill(client);
    await pages.client.saveDraft();
    await pages.dashboard.goto();
    await pages.dashboard.resume(pages.dashboard.rowForApplication({ name: client.lastName, id }));
    for (let i = 0; i < 4 && !(await pages.client.$(S.client.firstName).isVisible()); i += 1) await pages.client.back();
    await expect(pages.client.$(S.client.firstName)).toHaveValue(client.firstName);
    await expect(pages.client.$(S.client.lastName)).toHaveValue(client.lastName);
    const dob = await pages.client.getValue(S.client.dob);
    expect(sameDate(dob, formatDate(client.dob, env.dateFormat)), `DOB shown "${dob}" vs saved`).toBe(true);
  });

  test(...tc('WF-V03'), async ({ pages, page }, testInfo) => {
    const { reference } = await submitValidApplication(pages);
    await captureEvidence(page, testInfo, 'submission-confirmation');
    expect(reference.length, 'a reference number must be displayed').toBeGreaterThan(0);
    await testInfo.attach('reference-number.txt', { body: reference, contentType: 'text/plain' });
  });

  test(...tc('WF-V04'), async ({ pages }) => {
    await submitValidApplication(pages);
    expect(await pages.review.isReadOnly(), 'no editable input may remain after submission').toBe(true);
  });

  test(...tc('WF-V05'), async ({ pages }) => {
    await submitValidApplication(pages);
    await expect(pages.review.$(S.review.confirmation)).toHaveText(M.submitted);
  });

  test(...tc('WF-V06'), async ({ pages, page }, testInfo) => {
    const { id, data, reference } = await submitValidApplication(pages);
    await pages.dashboard.goto();
    const row = pages.dashboard.rowForApplication({ name: data.client.lastName, id }).or(pages.dashboard.rows.filter({ hasText: reference }).first()).first();
    await expect(row, 'submitted application should be listed').toBeVisible();
    await captureEvidence(page, testInfo, 'dashboard-after-submit');
    await expect(pages.dashboard.statusOf(row)).toHaveText(/submitted/i);
  });

  test(...tc('WF-V08'), async ({ pages, page }, testInfo) => {
    const { data } = await progressTo(pages, 'product');
    await fillStep(pages, 'product', data);
    const configured = await pages.product.waitForPremium();
    await pages.product.next();
    await finishFrom(pages, 'riders', data);
    await captureEvidence(page, testInfo, 'review-page');
    const text = await pages.review.reviewText();
    expect(text, 'client first name on review').toContain(data.client.firstName);
    expect(text, 'client last name on review').toContain(data.client.lastName);
    expect(text, 'beneficiary on review').toContain(data.beneficiaries[0].name);
    expect(await pages.review.premium(), 'review premium vs configured').toBeCloseTo(configured, 2);
  });
});
