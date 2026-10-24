const { BasePage } = require('./BasePage');
const { S } = require('../config/selectors');
const { parseMoney } = require('../utils/parse');

/** Step 8 - Beneficiary Management. */
class BeneficiaryPage extends BasePage {
  get rows() {
    return this.$$(S.beneficiary.rows);
  }

  async openForm() {
    const nameField = this.$(S.beneficiary.name);
    if (!(await nameField.isVisible().catch(() => false))) await this.$(S.beneficiary.add).click();
  }

  /** Fills the add-beneficiary form without saving (so validation can be observed). */
  async fillForm(b) {
    await this.openForm();
    if (b.type) await this.choose(S.beneficiary.type, b.type);
    if (b.designation) await this.choose(S.beneficiary.designation, b.designation);
    await this.fillField(S.beneficiary.name, b.name);
    if (b.dob) await this.setDate(S.beneficiary.dob, b.dob);
    await this.choose(S.beneficiary.relationship, b.relationship);
    await this.fillField(S.beneficiary.allocation, b.allocation);
    if (b.guardianName) await this.fillField(S.beneficiary.guardianName, b.guardianName);
    if (b.guardianRelationship) await this.choose(S.beneficiary.guardianRelationship, b.guardianRelationship);
    if (b.trustName) await this.fillField(S.beneficiary.trustName, b.trustName);
    if (b.trusteeName) await this.fillField(S.beneficiary.trusteeName, b.trusteeName);
    if (b.orgName) await this.fillField(S.beneficiary.orgName, b.orgName);
    if (b.irrevocable) await this.setChecked(S.beneficiary.irrevocable, true);
  }

  async add(b) {
    await this.fillForm(b);
    await this.$(S.beneficiary.save).click();
  }

  async remove(index = 0) {
    await this.rows.nth(index).locator('button').filter({ hasText: /remove|delete/i }).first().click();
  }

  /** Running totals shown by the page (NaN when the page does not display them). */
  async totals() {
    const read = async (def) => (await this.$(def).count() ? parseMoney(await this.$(def).textContent()) : NaN);
    return { primary: await read(S.beneficiary.primaryTotal), secondary: await read(S.beneficiary.secondaryTotal) };
  }

  get message() {
    return this.$(S.beneficiary.message);
  }
}

module.exports = { BeneficiaryPage };
