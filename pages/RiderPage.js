const { BasePage } = require('./BasePage');
const { S } = require('../config/selectors');
const { parseMoney } = require('../utils/parse');

/** Step 7 - Rider Selection. */
class RiderPage extends BasePage {
  get cards() {
    return this.$$(S.rider.cards);
  }

  cardFor(pattern) {
    return this.cards.filter({ hasText: pattern }).first();
  }

  toggleFor(pattern) {
    const card = this.cardFor(pattern);
    return card.getByRole('checkbox').or(card.getByTestId('rider-toggle')).or(card.getByRole('button', { name: /add|select/i })).first();
  }

  toggleAt(index) {
    const card = this.cards.nth(index);
    return card.getByRole('checkbox').or(card.getByTestId('rider-toggle')).or(card.getByRole('button', { name: /add|select/i })).first();
  }

  /** Sets a rider on/off by clicking. Not check()/uncheck(): an app may legitimately REFUSE the toggle (exclusive rider, max count). */
  async setOn(locator, on) {
    const type = await locator.getAttribute('type');
    if (type === 'checkbox') {
      if ((await locator.isChecked()) !== on) await locator.click();
    } else {
      await locator.click();
    }
  }

  async addAt(index) {
    await this.setOn(this.toggleAt(index), true);
  }

  async add(pattern) {
    await this.setOn(this.toggleFor(pattern), true);
  }

  async remove(pattern) {
    await this.setOn(this.toggleFor(pattern), false);
  }

  async isAdded(pattern) {
    const t = this.toggleFor(pattern);
    if ((await t.getAttribute('type')) === 'checkbox') return t.isChecked();
    return (await t.getAttribute('aria-pressed')) === 'true';
  }

  async isDisabled(pattern) {
    return this.toggleFor(pattern).isDisabled();
  }

  async setCoverage(pattern, amount) {
    const input = this.cardFor(pattern).getByLabel(S.rider.coverage.label).or(this.cardFor(pattern).getByTestId('rider-coverage')).first();
    await input.fill(String(amount));
    await input.press('Tab');
  }

  async totalPremium() {
    const el = this.$(S.rider.totalPremium);
    if (!(await el.count())) return NaN;
    return parseMoney(await el.textContent());
  }

  async riderPremiumSummary() {
    const el = this.$(S.rider.summaryPremium);
    if (!(await el.count())) return NaN;
    return parseMoney(await el.textContent());
  }

  get message() {
    return this.$(S.rider.message);
  }

  get questionnaire() {
    return this.$(S.rider.questionnaire);
  }
}

module.exports = { RiderPage };
