const { BasePage } = require('./BasePage');
const { S } = require('../config/selectors');

/** KYC, Financial and Compliance: /applications/:id/kyc-financial. */
class KycFinancialPage extends BasePage {
  async fill(k) {
    await this.choose(S.kyc.idType, k.idType);
    await this.fillField(S.kyc.idNumber, k.idNumber);
    await this.fillField(S.kyc.issueDate, k.issueDate);
    await this.fillField(S.kyc.expiryDate, k.expiryDate);
    // Older data shapes carried a separate SSN field; the real form has none (the SSN is the ID number when the type is SSN).
    if (k.ssn && (await this.$(S.kyc.ssn).count())) {
      await this.fillField(S.kyc.ssn, k.ssn);
      await this.$(S.kyc.ssn).press('Tab');
    }
    await this.fillField(S.kyc.income, k.income);
    await this.fillField(S.kyc.netWorth, k.netWorth);
    await this.choose(S.kyc.sourceOfFunds, k.sourceOfFunds);
    await this.choose(S.kyc.riskProfile, k.riskProfile);
    await this.setPep(k.pep, k.pepDetails);
    // The compliance declaration is mandatory for the step to save.
    if (k.declaration !== false && (await this.$(S.kyc.declaration).count())) await this.setChecked(S.kyc.declaration, true);
  }

  /** The PEP control is a dropdown: 0 = No, 1 = Yes. */
  async setPep(isPep, details) {
    await this.$(S.kyc.pep).selectOption(isPep ? '1' : '0');
    if (isPep && details !== undefined) await this.fillField(S.kyc.pepDetails, details);
  }

  /** What the agent can SEE for the SSN after entry: a masked display element, or the ID-number field's own value. */
  async visibleSsn() {
    const display = this.$(S.kyc.ssnDisplay);
    if (await display.count()) return ((await display.textContent()) || '').trim();
    return this.getValue(S.kyc.idNumber);
  }

  async uploadKycDocument(file) {
    await this.$(S.kyc.uploadInput).setInputFiles(file);
  }
}

module.exports = { KycFinancialPage };
