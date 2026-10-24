const { BasePage } = require('./BasePage');
const { S } = require('../config/selectors');

/** Step 5 - KYC, Financial and Compliance. */
class KycFinancialPage extends BasePage {
  async fill(k) {
    await this.choose(S.kyc.idType, k.idType);
    await this.fillField(S.kyc.idNumber, k.idNumber);
    if (await this.$(S.kyc.ssn).count()) {
      await this.fillField(S.kyc.ssn, k.ssn);
      await this.$(S.kyc.ssn).press('Tab'); // blur: masking is applied "after entry"
    }
    await this.fillField(S.kyc.income, k.income);
    await this.fillField(S.kyc.netWorth, k.netWorth);
    await this.choose(S.kyc.sourceOfFunds, k.sourceOfFunds);
    await this.choose(S.kyc.riskProfile, k.riskProfile);
    await this.setPep(k.pep, k.pepDetails);
  }

  async setPep(isPep, details) {
    if (isPep) {
      await this.$(S.kyc.pepYes).check();
      if (details && (await this.$(S.kyc.pepDetails).count())) await this.fillField(S.kyc.pepDetails, details);
    } else if (await this.$(S.kyc.pepNo).count()) {
      await this.$(S.kyc.pepNo).check();
    }
  }

  /** What the agent can SEE for the SSN after entry: displayed element text or the field's own value. */
  async visibleSsn() {
    const display = this.$(S.kyc.ssnDisplay);
    if (await display.count()) return ((await display.textContent()) || '').trim();
    return this.getValue(S.kyc.ssn);
  }

  async uploadKycDocument(file) {
    await this.$(S.kyc.uploadInput).setInputFiles(file);
  }
}

module.exports = { KycFinancialPage };
