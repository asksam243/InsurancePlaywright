const { expect } = require('@playwright/test');
const env = require('../config/env');
const { S } = require('../config/selectors');
const { loc, byPrefix } = require('../utils/locators');
const { formatDate } = require('../utils/dates');
const { escapeRegex } = require('../utils/parse');

/**
 * Shared behaviour for every screen. Page objects expose USER ACTIONS and read-only getters;
 * the test files own the assertions (small reusable state checks live here as expect* helpers).
 */
class BasePage {
  constructor(page) {
    this.page = page;
  }

  /** First element matching a selector definition (testid, with role/label fallbacks). */
  $(def) {
    return loc(this.page, def).first();
  }
  /** All elements matching a selector definition. */
  $$(def) {
    return loc(this.page, def);
  }
  byPrefix(prefix) {
    return byPrefix(this.page, prefix);
  }

  async goto(path) {
    await this.page.goto(path);
  }

  async fillField(def, value) {
    if (value === undefined || value === null) return;
    await this.$(def).fill(String(value));
  }

  /** Selects an option by label, then by value, then by partial text; falls back to the first real option. */
  async choose(def, value) {
    if (value === undefined || value === null) return;
    const el = this.$(def);
    const tag = await el.evaluate((n) => n.tagName.toLowerCase());
    if (tag !== 'select') {
      await el.fill(String(value));
      return;
    }
    for (const attempt of [{ label: String(value) }, String(value)]) {
      try {
        await el.selectOption(attempt, { timeout: 1500 });
        return;
      } catch {
        /* try next strategy */
      }
    }
    const options = await el.locator('option').evaluateAll((os) =>
      os.map((o) => ({ v: o.value, t: (o.textContent || '').trim() })).filter((o) => o.v),
    );
    const pattern = new RegExp(escapeRegex(value), 'i');
    const match = options.find((o) => pattern.test(o.t)) || options[0];
    if (!match) throw new Error(`No selectable option found for ${JSON.stringify(def.id)} (wanted "${value}")`);
    await el.selectOption(match.v);
  }

  /** Types a Date into a date input in the app's configured format, then blurs to trigger age/validation logic. */
  async setDate(def, date) {
    const el = this.$(def);
    await el.fill(formatDate(date, env.dateFormat));
    await el.press('Tab');
  }

  async setChecked(def, checked) {
    const el = this.$(def);
    if (checked) await el.check();
    else await el.uncheck();
  }

  async next() {
    await this.$(S.common.next).click();
  }

  async back() {
    await this.$(S.common.back).click();
  }

  async saveDraft() {
    await this.$(S.common.saveDraft).click();
  }

  async stepTitle() {
    return ((await this.$(S.common.stepTitle).textContent()) || '').trim();
  }

  async expectStep(pattern) {
    await expect(this.$(S.common.stepTitle)).toHaveText(pattern);
  }

  /** Error element belonging to a field: <testid>-error first, then an error node inside the field's wrapper. */
  fieldError(def) {
    const field = this.$(def);
    return this.page
      .getByTestId(`${def.id}-error`)
      .or(field.locator('xpath=ancestor::div[1]').locator(S.common.anyError.css))
      .first();
  }

  async expectFieldError(def, pattern) {
    const err = this.fieldError(def);
    await expect(err, `expected a validation error next to "${def.id}"`).toBeVisible();
    if (pattern) await expect(err).toHaveText(pattern);
  }

  /** Any visible validation / alert text matching the pattern, anywhere on the page. */
  async expectErrorText(pattern) {
    await expect(
      this.$$(S.common.anyError).filter({ hasText: pattern }).first(),
      `expected a visible message matching ${pattern}`,
    ).toBeVisible();
  }

  /** The user was NOT moved on: the step title is unchanged after a rejected Next. */
  async expectStillOnStep(titleBefore) {
    await expect(this.$(S.common.stepTitle)).toHaveText(titleBefore);
  }

  async getValue(def) {
    return this.$(def).inputValue();
  }
}

module.exports = { BasePage };
