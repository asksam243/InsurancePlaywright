const routes = require('../utils/routes');

/** VERIFY field labels and PEP-declaration wording against the live KYC page. */
class KycFinancialPage {
  constructor(page) {
    this.page = page;
    this.idTypeSelect = page.getByLabel(/id type/i);
    this.idNumberInput = page.getByLabel(/id number/i);
    this.documentUploadInput = page.getByTestId('kyc-document-upload-input');

    this.ssnMaskedValue = page.getByTestId('ssn-masked-value');
    this.ssnInput = page.getByLabel(/social security|ssn/i);

    this.annualIncomeInput = page.getByLabel(/annual income/i);
    this.netWorthInput = page.getByLabel(/net worth/i);
    this.sourceOfFundsSelect = page.getByLabel(/source of funds/i);

    this.pepYesRadio = page.getByLabel(/politically exposed.*yes/i);
    this.pepNoRadio = page.getByLabel(/politically exposed.*no/i);
    this.pepDetailsInput = page.getByLabel(/pep details/i);
    this.pepDetailsError = page.getByTestId('pepDetails-error');

    this.nextButton = page.getByRole('button', { name: /next|continue/i });
    this.affordabilityWarning = page.getByTestId('affordability-warning');
  }

  async goto(applicationId) {
    await this.page.goto(routes.kycFinancial(applicationId));
  }

  async fill(kyc) {
    await this.idTypeSelect.selectOption(kyc.idType);
    await this.idNumberInput.fill(kyc.idNumber);
    await this.ssnInput.fill(kyc.ssn);
    await this.annualIncomeInput.fill(kyc.annualIncome);
    await this.netWorthInput.fill(kyc.netWorth);
    await this.sourceOfFundsSelect.selectOption(kyc.sourceOfFunds);
    if (kyc.isPep) {
      await this.pepYesRadio.check();
    } else {
      await this.pepNoRadio.check();
    }
  }

  async uploadDocument(filePath) {
    await this.documentUploadInput.setInputFiles(filePath);
  }

  async next() {
    await this.nextButton.click();
  }
}

module.exports = { KycFinancialPage };
