const { BasePage } = require('./BasePage');
const { S } = require('../config/selectors');
const { withDialogs } = require('../utils/browser');

/**
 * Beneficiary Management: /applications/:id/beneficiaries.
 * The form is ALWAYS visible (no "Add beneficiary" button); Save adds the row. Over-allocation raises a native alert() and
 * an irrevocable designation raises a native confirm(): both are answered (accepted) here and returned to the caller.
 */
class BeneficiaryPage extends BasePage {
  get rows() {
    return this.$$(S.beneficiary.rows);
  }

  /** The form is always open in the real app; kept so older callers keep working. */
  async openForm() {
    await this.$(S.beneficiary.level).waitFor({ state: 'visible' });
  }

  /** "Ada Lovelace" -> { first: 'Ada', last: 'Lovelace' } when only a full name is supplied. */
  static splitName(b) {
    if (b.firstName || b.lastName) return { first: b.firstName, last: b.lastName };
    const parts = String(b.name || '').trim().split(/\s+/);
    return { first: parts[0], last: parts.slice(1).join(' ') || parts[0] };
  }

  /** Fills the beneficiary form without saving (so validation can be observed). */
  async fillForm(b) {
    await this.openForm();
    await this.choose(S.beneficiary.level, b.designation ?? b.level);
    await this.choose(S.beneficiary.type, b.type);
    await this.choose(S.beneficiary.relationship, b.relationship);
    await this.fillField(S.beneficiary.allocation, b.allocation);
    // Revocable (0) / irrevocable (1) is the "designation" dropdown in the real app.
    await this.$(S.beneficiary.designation).selectOption(b.irrevocable ? '1' : '0');

    const individual = !b.type || /individual/i.test(b.type);
    if (individual) {
      const { first, last } = BeneficiaryPage.splitName(b);
      await this.fillField(S.beneficiary.firstName, first);
      await this.fillField(S.beneficiary.lastName, last);
      if (b.dob) await this.setDate(S.beneficiary.dob, b.dob);
      if (b.gender) await this.choose(S.beneficiary.gender, b.gender);
      if (b.guardianName) {
        await this.fillField(S.beneficiary.guardianName, b.guardianName);
        await this.fillField(S.beneficiary.guardianRelationship, b.guardianRelationship);
        await this.fillField(S.beneficiary.guardianContact, b.guardianContact ?? '(212) 555-0199');
        await this.fillField(S.beneficiary.guardianAddress, b.guardianAddress ?? '5 Elm St, New York, NY 10001');
      }
    }
    if (/trust/i.test(b.type || '')) {
      await this.fillField(S.beneficiary.trustName, b.trustName);
      await this.fillField(S.beneficiary.trusteeName, b.trusteeName);
      if (b.trustDate) await this.setDate(S.beneficiary.trustDate, b.trustDate);
    }
    if (/organi[sz]ation/i.test(b.type || '')) {
      await this.fillField(S.beneficiary.orgName, b.orgName);
      await this.fillField(S.beneficiary.orgRegistration, b.orgRegistration);
      await this.fillField(S.beneficiary.orgContact, b.orgContact);
    }
    if (b.irrevocable && (await this.$(S.beneficiary.legalAcknowledgement).count())) {
      await this.setChecked(S.beneficiary.legalAcknowledgement, true);
    }
  }

  /** Fills and saves. Native dialogs are answered with `dialogDecision` (default accept) and their messages returned. */
  async add(b, dialogDecision = 'accept') {
    await this.fillForm(b);
    const dialogs = await withDialogs(this.page, () => this.$(S.beneficiary.save).click(), dialogDecision);
    await this.page.waitForLoadState('domcontentloaded');
    return { dialogs };
  }

  async remove(index = 0) {
    const row = this.rows.nth(index);
    const del = row.locator('[data-testid^="beneficiary-delete-"]').first();
    const button = (await del.count()) ? del : row.getByRole('button', { name: /remove|delete/i }).first();
    await withDialogs(this.page, () => button.click(), 'accept');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /** Running totals from the allocation summary's data attributes (NaN when the page does not show them). */
  async totals() {
    const el = this.$(S.beneficiary.allocationSummary);
    if (!(await el.count())) return { primary: NaN, secondary: NaN };
    const read = async (attr) => {
      const v = await el.getAttribute(attr);
      return v === null ? NaN : Number(v);
    };
    return { primary: await read('data-primary-total'), secondary: await read('data-secondary-total') };
  }

  get message() {
    return this.$(S.beneficiary.message);
  }
}

module.exports = { BeneficiaryPage };
