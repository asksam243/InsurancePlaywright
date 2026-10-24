const routes = require('../utils/routes');

/** VERIFY field labels and the premium display testid against the live configuration page. */
class ProductConfigurationPage {
  constructor(page) {
    this.page = page;
    this.faceValueInput = page.getByLabel(/face value/i);
    this.premiumFrequencySelect = page.getByLabel(/premium frequency/i);
    this.paymentTermSelect = page.getByLabel(/payment term/i);
    this.policyTermSelect = page.getByLabel(/policy term/i);

    this.calculatedPremium = page.getByTestId('calculated-premium');
    this.faceValueError = page.getByTestId('faceValue-error');
    this.suitabilityWarning = page.getByTestId('product-suitability-warning');

    this.nextButton = page.getByRole('button', { name: /next|continue/i });
  }

  async goto(applicationId) {
    await this.page.goto(routes.productConfig(applicationId));
  }

  async configure({ faceValue, premiumFrequency, paymentTerm, policyTerm }) {
    await this.faceValueInput.fill(faceValue);
    await this.premiumFrequencySelect.selectOption(premiumFrequency);
    await this.paymentTermSelect.selectOption(paymentTerm);
    await this.policyTermSelect.selectOption(policyTerm);
  }

  async getPremiumText() {
    return this.calculatedPremium.textContent();
  }

  async next() {
    await this.nextButton.click();
  }
}

module.exports = { ProductConfigurationPage };
