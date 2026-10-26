const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage');
const { S } = require('../config/selectors');
const { ValidationSummary } = require('../components/ValidationSummary');
const { parseMoney } = require('../utils/parse');

/** Review (/applications/:id/review) and the confirmation page it leads to (/applications/:id/confirmation). */
class ReviewSubmitPage extends BasePage {
  constructor(page) {
    super(page);
    this.validation = new ValidationSummary(page);
  }

  get submitButton() {
    return this.$(S.review.submit);
  }

  async premium() {
    const el = this.$(S.review.premium);
    if (!(await el.count())) return NaN;
    return parseMoney(await el.textContent());
  }

  /** Full text of the review area, for "review shows what was entered" checks. */
  async reviewText() {
    await expect(this.$(S.review.root)).toBeVisible();
    return (await this.$(S.review.root).innerText()) || '';
  }

  /** Clicks Submit. A valid application moves to the confirmation page; an invalid one stays here with errors. */
  async submit() {
    await this.submitButton.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  /** Reference number (WL + date + sequence) shown on the confirmation page. */
  async referenceNumber() {
    const el = this.$(S.review.reference);
    await expect(el, 'the confirmation page with a reference number').toBeVisible({ timeout: 15_000 });
    const text = ((await el.textContent()) || '').trim();
    const m = text.match(/WL\d+/);
    return m ? m[0] : text;
  }

  /** Current status. It is shown on the status page, which the confirmation page links to ("view status"). */
  async statusText() {
    const status = this.$(S.review.status);
    if (!(await status.count())) {
      const link = this.$(S.review.viewStatusLink);
      if (await link.count()) {
        await link.click();
        await this.page.waitForLoadState('domcontentloaded');
      }
    }
    return ((await status.textContent()) || '').trim();
  }

  /** True when no editable input remains on the page (a submitted application is read-only). */
  async isReadOnly() {
    const editable = this.page.locator(
      'main input:not([type="hidden"]):not([disabled]):not([readonly]), main select:not([disabled]), main textarea:not([disabled]):not([readonly])',
    );
    return (await editable.count()) === 0;
  }
}

module.exports = { ReviewSubmitPage };
