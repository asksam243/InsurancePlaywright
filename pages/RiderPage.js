const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage');
const env = require('../config/env');
const { S } = require('../config/selectors');
const { parseMoney } = require('../utils/parse');

const MONEY = /\d[\d,]*\.\d{2}/g;

/**
 * Rider Selection: /applications/:id/riders.
 * Riders are TABLE ROWS (rider-row-<id>) found by their name text; each has a checkbox (rider-selected-<id>) and a
 * coverage-amount input (rider-coverage-amount-<id>).
 */
class RiderPage extends BasePage {
  get cards() {
    return this.$$(S.rider.cards);
  }

  cardFor(pattern) {
    return this.cards.filter({ hasText: pattern }).first();
  }

  toggleFor(pattern) {
    return this.cardFor(pattern).locator('[data-testid^="rider-selected-"]').first();
  }

  toggleAt(index) {
    return this.cards.nth(index).locator('[data-testid^="rider-selected-"]').first();
  }

  coverageInput(row) {
    return row.locator('[data-testid^="rider-coverage-amount-"]').first();
  }

  /** Sets a rider on/off by clicking. Not check()/uncheck(): an app may legitimately REFUSE the toggle (exclusive rider, max count). */
  async setOn(locator, on) {
    if ((await locator.isChecked()) !== on) await locator.click();
  }

  /** Coverage is required once a rider is ticked; when the field is empty it is filled so the premium can be computed. */
  async ensureCoverage(row, coverage) {
    const input = this.coverageInput(row);
    if ((await input.count()) && (await input.isVisible()) && (await input.isEditable()) && !(await input.inputValue())) {
      await input.fill(String(coverage ?? env.rules.faceValueDefault));
      await input.press('Tab');
    }
  }

  async addAt(index, coverage) {
    await this.setOn(this.toggleAt(index), true);
    await this.ensureCoverage(this.cards.nth(index), coverage);
  }

  async add(pattern, coverage) {
    await this.setOn(this.toggleFor(pattern), true);
    await this.ensureCoverage(this.cardFor(pattern), coverage);
  }

  async remove(pattern) {
    await this.setOn(this.toggleFor(pattern), false);
  }

  async isAdded(pattern) {
    return this.toggleFor(pattern).isChecked();
  }

  async isDisabled(pattern) {
    return this.toggleFor(pattern).isDisabled();
  }

  async setCoverage(pattern, amount) {
    const input = this.coverageInput(this.cardFor(pattern));
    await input.fill(String(amount));
    await input.press('Tab');
  }

  /** All money figures shown in the premium summary, in order (empty when the page shows none). */
  async summaryFigures() {
    const el = this.$(S.rider.summaryPremium);
    if (!(await el.count())) return [];
    return ((await el.innerText()) || '').match(MONEY)?.map(parseMoney) ?? [];
  }

  async summaryText() {
    const el = this.$(S.rider.summaryPremium);
    return (await el.count()) ? ((await el.innerText()) || '').replace(/\s+/g, ' ').trim() : '';
  }

  /** Total premium: the dedicated total element if the page has one, otherwise the LAST figure of the premium summary. */
  async totalPremium() {
    const total = this.page.getByTestId('application-total-premium');
    if (await total.count()) return parseMoney(await total.first().textContent());
    const figures = await this.summaryFigures();
    return figures.length ? figures[figures.length - 1] : NaN;
  }

  /** Rider premium shown in the summary: the first positive figure (NaN when none is shown yet). */
  async riderPremiumSummary() {
    const figures = await this.summaryFigures();
    const positive = figures.find((f) => f > 0);
    return positive === undefined ? NaN : positive;
  }

  get message() {
    return this.$(S.rider.message);
  }

  get questionnaire() {
    return this.$(S.rider.questionnaire);
  }
}

module.exports = { RiderPage };
