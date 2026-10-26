const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage');
const { S } = require('../config/selectors');
const { parseMoney } = require('../utils/parse');
const { options, selectByText } = require('../utils/browser');

/**
 * Product Selection and policy configuration: /applications/:id/product.
 * The real step is a DROPDOWN of product names (values are ids), not a set of cards. The card catalogue lives on /products,
 * so cards / inactiveCards / details links stay available for scenarios that visit that page.
 */
class ProductPage extends BasePage {
  get productSelect() {
    return this.$(S.product.select);
  }

  get cards() {
    return this.$$(S.product.cards);
  }

  get inactiveCards() {
    return this.$$(S.product.inactiveCards);
  }

  cardFor(pattern) {
    return this.cards.filter({ hasText: pattern }).first();
  }

  /** Visible product names offered on this step (placeholder option excluded). Falls back to catalogue card text. */
  async names() {
    if (await this.productSelect.count()) {
      return (await options(this.productSelect)).filter((o) => o.value !== '').map((o) => o.text);
    }
    const n = await this.cards.count();
    const out = [];
    for (let i = 0; i < n; i += 1) out.push(((await this.cards.nth(i).innerText()) || '').trim());
    return out;
  }

  /** Selects the first product whose NAME matches the pattern (or the first product when no pattern is given). */
  async select(pattern) {
    await expect(this.productSelect, 'the product dropdown').toBeVisible();
    return selectByText(this.productSelect, pattern);
  }

  async configure({ faceValue, frequency, paymentTerm, policyTerm } = {}) {
    if (faceValue !== undefined) await this.setFaceValue(faceValue);
    if (frequency) await this.setFrequency(frequency);
    if (paymentTerm) await this.choose(S.product.paymentTerm, String(paymentTerm));
    if (policyTerm) await this.choose(S.product.policyTerm, policyTerm);
  }

  async setFaceValue(value) {
    await this.fillField(S.product.faceValue, value);
    await this.$(S.product.faceValue).press('Tab');
  }

  async setFrequency(value) {
    await this.choose(S.product.frequency, value);
  }

  /** Displayed total premium as a number (NaN until shown). It is a live preview until the step is saved. */
  async premium() {
    const el = this.$(S.product.premium);
    if (!(await el.count())) return NaN;
    return parseMoney(await el.textContent());
  }

  /** Waits for a premium greater than zero to be displayed, then returns it. */
  async waitForPremium() {
    await expect.poll(() => this.premium(), { message: 'premium to be displayed' }).toBeGreaterThan(0);
    return this.premium();
  }

  async optionTexts(def) {
    return this.$(def).locator('option').evaluateAll((os) => os.map((o) => (o.textContent || '').trim()).filter(Boolean));
  }
}

module.exports = { ProductPage };
