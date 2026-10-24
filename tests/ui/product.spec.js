const { test, tc, expect, env } = require('../../fixtures');
const M = require('../../config/messages');
const { S } = require('../../config/selectors');
const { dobForAge } = require('../../utils/dates');
const { buildClient, buildKyc } = require('../../utils/dataBuilder');
const { progressTo, fillStep, finishFrom } = require('../../utils/flows');
const { expectBlocked, expectAdvanced, captureEvidence } = require('../../utils/assertions');
const { parseMoney } = require('../../utils/parse');

const r = env.rules;

test.describe('Product Selection & Policy Configuration', () => {
  test.use({ agentRole: 'validAgent' });

  test(...tc('PROD-V01'), async ({ pages }) => {
    await progressTo(pages, 'product');
    const names = await pages.product.names();
    expect(names.length, 'at least one product card').toBeGreaterThan(0);
    expect(names.some((n) => r.patterns.product.test(n)), `a card matching ${r.patterns.product}`).toBeTruthy();
  });

  test(...tc('PROD-V02'), async ({ pages, page }) => {
    await progressTo(pages, 'product');
    const link = pages.product.cards.first().getByRole('link', { name: S.product.detailsLink.name });
    test.skip(!(await link.count()), 'No product details link in this build');
    await link.first().click();
    await expect(page.locator('main')).toContainText(/feature|benefit/i);
    await expect(page.locator('main')).toContainText(/eligib|limit|minimum|maximum/i);
  });

  test.describe('face value limits', () => {
    test(...tc('PROD-V03'), async ({ pages }) => {
      test.skip(r.faceValueMin === null, 'Set FACE_VALUE_MIN to run (Q13)');
      const { data } = await progressTo(pages, 'product');
      const before = await pages.product.stepTitle();
      await pages.product.select(data.product.namePattern);
      await pages.product.setFaceValue(r.faceValueMin - 1);
      await pages.product.next();
      await expectBlocked(pages.product, before, M.faceValueLimit);
      await pages.product.setFaceValue(r.faceValueMin);
      await pages.product.next();
      await expectAdvanced(pages.product, before);
    });

    test(...tc('PROD-V04'), async ({ pages }) => {
      test.skip(r.faceValueMax === null, 'Set FACE_VALUE_MAX to run (Q13)');
      const { data } = await progressTo(pages, 'product');
      const before = await pages.product.stepTitle();
      await pages.product.select(data.product.namePattern);
      await pages.product.setFaceValue(r.faceValueMax + 1);
      await pages.product.next();
      await expectBlocked(pages.product, before, M.faceValueLimit);
    });
  });

  test(...tc('PROD-V05'), async ({ pages, page }, testInfo) => {
    const { data } = await progressTo(pages, 'product');
    await pages.product.select(data.product.namePattern);
    await pages.product.setFaceValue(data.product.faceValue);
    // Frequencies are taken from the app's own option list so the test does not depend on guessed labels.
    const options = await pages.product.optionTexts(S.product.frequency);
    expect(options.length, 'premium frequency options (Monthly/Quarterly/Semi-annual/Annual)').toBeGreaterThanOrEqual(2);
    const first = options[0];
    const last = options[options.length - 1];
    await pages.product.setFrequency(first);
    const p1 = await pages.product.waitForPremium();
    await pages.product.setFrequency(last);
    await expect.poll(() => pages.product.premium(), { message: `premium should change when frequency changes ${first} -> ${last}` }).not.toBe(p1);
    await captureEvidence(page, testInfo, `premium-${last}`);
    await pages.product.setFrequency(first);
    await expect.poll(() => pages.product.premium(), { message: 'premium returns to the original value' }).toBe(p1);
  });

  test(...tc('PROD-V06'), async ({ pages, page }, testInfo) => {
    const { data } = await progressTo(pages, 'product');
    await fillStep(pages, 'product', data);
    const configured = await pages.product.waitForPremium();
    await pages.product.next();
    await finishFrom(pages, 'riders', data);
    const onReview = await pages.review.premium();
    await captureEvidence(page, testInfo, 'review-premium');
    expect(onReview, 'review-page premium vs configured premium').toBeCloseTo(configured, 2);
  });

  test(...tc('PROD-V07'), async ({ pages }) => {
    test.skip(!r.patterns.suitabilityProduct, 'Set SUITABILITY_PRODUCT_PATTERN to run (Q13)');
    await progressTo(pages, 'product', { kyc: buildKyc({ riskProfile: 'Conservative' }) });
    await pages.product.select(r.patterns.suitabilityProduct);
    await expect(
      pages.product.$$(S.common.anyError).or(pages.product.$(S.product.warning)).filter({ hasText: M.suitability }).first(),
    ).toBeVisible();
  });

  test(...tc('PROD-V08'), async ({ pages }) => {
    test.skip(!r.ineligibleAge || !r.patterns.ineligibleAgeProduct, 'Set INELIGIBLE_AGE and INELIGIBLE_AGE_PRODUCT_PATTERN to run (Q13)');
    await progressTo(pages, 'product', { client: buildClient({ dob: dobForAge(r.ineligibleAge) }) });
    const before = await pages.product.stepTitle();
    const card = pages.product.cardFor(r.patterns.ineligibleAgeProduct);
    const button = card.getByRole('button', { name: S.product.selectButton.name }).first();
    if (await button.count() && (await button.isDisabled())) return; // disabled == correctly blocked
    await pages.product.select(r.patterns.ineligibleAgeProduct);
    await pages.product.next();
    await expectBlocked(pages.product, before, M.eligibility);
  });

  test(...tc('PROD-V09'), async ({ pages }) => {
    const { data } = await progressTo(pages, 'product');
    await pages.product.select(data.product.namePattern);
    for (const def of [S.product.paymentTerm, S.product.policyTerm]) {
      const el = pages.product.$(def);
      test.skip(!(await el.count()) || (await el.evaluate((n) => n.tagName)) !== 'SELECT', `${def.id} is not a dropdown in this build`);
      const options = await pages.product.optionTexts(def);
      expect(options.length, `${def.id} has options`).toBeGreaterThan(0);
      expect(new Set(options).size, `${def.id} has no duplicate options`).toBe(options.length);
    }
  });

  test(...tc('PROD-V10'), async ({ pages }) => {
    await progressTo(pages, 'product');
    const n = await pages.product.inactiveCards.count();
    test.skip(n === 0, 'No inactive product is displayed in this environment');
    for (let i = 0; i < n; i += 1) {
      const card = pages.product.inactiveCards.nth(i);
      const button = card.getByRole('button', { name: S.product.selectButton.name }).first();
      if (await button.count()) await expect(button).toBeDisabled();
      else await expect(card).toHaveAttribute('aria-disabled', 'true');
    }
  });

  test(...tc('PROD-V11'), async ({ pages, page }) => {
    const { data } = await progressTo(pages, 'product');
    await pages.product.select(data.product.namePattern);
    await pages.product.setFaceValue(data.product.faceValue);
    const options = await pages.product.optionTexts(S.product.frequency);
    await pages.product.setFrequency(options[options.length - 1]);
    const frequency = await pages.product.getValue(S.product.frequency);
    await pages.product.saveDraft();
    await page.reload();
    expect(parseMoney(await pages.product.getValue(S.product.faceValue)), 'face value after reload').toBe(data.product.faceValue);
    expect(await pages.product.getValue(S.product.frequency), 'frequency after reload').toBe(frequency);
  });
});
