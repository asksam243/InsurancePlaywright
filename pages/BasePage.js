const { expect } = require('@playwright/test');
const env = require('../config/env');
const { S } = require('../config/selectors');
const { loc, byPrefix } = require('../utils/locators');
const { formatDate } = require('../utils/dates');
const { escapeRegex } = require('../utils/parse');
const { disableBrowserValidation, isNativelyInvalid } = require('../utils/browser');

/**
 * The real app has no generic "Next" button: every step has its own Save & Continue control (FROM MARKUP).
 * Keyed by the last URL segment of /applications/:id/<step>.
 */
const STEP_CONTINUE = {
  client: 'client-save-continue-button',
  'address-contact': 'address-contact-save-continue-button',
  'kyc-financial': 'kyc-financial-save-continue-button',
  product: 'product-save-continue-button',
  riders: 'rider-save-continue-button',
  beneficiaries: 'beneficiary-continue-button',
  documents: 'documents-continue-review-button',
};

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

  /**
   * Selects an option. Playwright matches a plain string against the option VALUE or its visible LABEL, which covers both
   * the app's enum values (MALE) and readable text (Male); falls back to a partial text match, then the first real option.
   */
  async choose(def, value) {
    if (value === undefined || value === null) return;
    const el = this.$(def);
    const tag = await el.evaluate((n) => n.tagName.toLowerCase());
    if (tag !== 'select') {
      await el.fill(String(value));
      return;
    }
    for (const attempt of [String(value), { label: String(value) }]) {
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
    const match = options.find((o) => pattern.test(o.t) || pattern.test(o.v)) || options[0];
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

  /** Slug of the current application step ("client", "address-contact", ...), or "" outside an application. */
  stepSlug() {
    const m = new URL(this.page.url()).pathname.match(/\/applications\/[^/]+\/([a-z-]+)/i);
    return m ? m[1] : '';
  }

  /** The Save & Continue control of the current step (falls back to a generic Next / Continue button). */
  continueControl() {
    const id = STEP_CONTINUE[this.stepSlug()];
    const generic = loc(this.page, S.common.next);
    return (id ? this.page.getByTestId(id).or(generic) : generic).first();
  }

  /** Saves the current step and moves on. `ignoreBrowserValidation` reaches the SERVER-side messages for blank forms. */
  async next({ ignoreBrowserValidation = false } = {}) {
    if (ignoreBrowserValidation) await disableBrowserValidation(this.page);
    await this.continueControl().click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async back() {
    await this.$(S.common.back).click();
  }

  /**
   * There is NO "Save draft" button in the real app: the draft is created at the start page and saved by each
   * Save & Continue. If a build does have a dedicated button it is used; otherwise Save & Continue persists the draft.
   */
  async saveDraft() {
    const explicit = this.$$(S.common.saveDraft);
    if (await explicit.count()) {
      await explicit.first().click();
      await this.page.waitForLoadState('domcontentloaded');
      return;
    }
    await this.next();
  }

  /** Identifies the current step: URL step slug + first heading. Changes when the browser moves on. */
  async stepTitle() {
    const heading = await this.$$(S.common.stepTitle).first().textContent({ timeout: 3000 }).catch(() => '');
    return `${this.stepSlug()}|${(heading || '').trim()}`;
  }

  async expectStep(pattern) {
    await expect.poll(() => this.stepTitle(), { message: `step to match ${pattern}` }).toMatch(pattern);
  }

  /** Error element belonging to a field: <testid>-error first, then an error node inside the field's wrapper. */
  fieldError(def) {
    const field = this.$(def);
    return this.page
      .getByTestId(`${def.id}-error`)
      .or(field.locator('xpath=ancestor::div[1]').locator(S.common.anyError.css))
      .first();
  }

  /**
   * A field is "flagged" when the app shows an error for it OR the browser itself refuses it. The real forms use HTML
   * `required`, so a blank mandatory field is blocked by the browser (:invalid) before the server can answer.
   */
  async expectFieldError(def, pattern) {
    const field = this.$(def);
    if (!pattern && (await field.count()) && (await isNativelyInvalid(field).catch(() => false))) return;
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

  /** The user was NOT moved on: the step identity is unchanged after a rejected Save & Continue. */
  async expectStillOnStep(titleBefore) {
    await expect.poll(() => this.stepTitle(), { message: 'still on the same step' }).toBe(titleBefore);
  }

  async expectAdvanced(titleBefore) {
    await expect.poll(() => this.stepTitle(), { timeout: 10_000, message: 'moved to another step' }).not.toBe(titleBefore);
  }

  async getValue(def) {
    return this.$(def).inputValue();
  }
}

module.exports = { BasePage, STEP_CONTINUE };
