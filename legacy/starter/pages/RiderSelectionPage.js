const routes = require('../utils/routes');

/** VERIFY rider testids/ids and the max-rider-count/mutual-exclusivity error copy live. */
class RiderSelectionPage {
  constructor(page) {
    this.page = page;
    this.riderCheckbox = (riderId) => page.getByTestId(`rider-${riderId}`);
    this.riderCoverageInput = (riderId) => page.getByTestId(`rider-${riderId}-coverage-input`);
    this.riderPremiumItem = (riderId) => page.getByTestId(`rider-premium-item-${riderId}`);
    this.totalPremium = page.getByTestId('total-premium');

    this.coverageExceedsError = page.getByTestId('rider-coverage-exceeds-error');
    this.maxRiderCountMessage = page.getByTestId('max-rider-count-message');
    this.ageIneligibleMessage = page.getByTestId('rider-age-ineligible-message');
    this.healthQuestionnaireSection = page.getByTestId('health-questionnaire-section');

    this.nextButton = page.getByRole('button', { name: /next|continue/i });
  }

  async goto(applicationId) {
    await this.page.goto(routes.riders(applicationId));
  }

  async addRider(riderId) {
    await this.riderCheckbox(riderId).check();
  }

  async removeRider(riderId) {
    await this.riderCheckbox(riderId).uncheck();
  }

  async setRiderCoverage(riderId, amount) {
    await this.riderCoverageInput(riderId).fill(amount);
  }

  async isRiderChecked(riderId) {
    return this.riderCheckbox(riderId).isChecked();
  }

  async isRiderDisabled(riderId) {
    return this.riderCheckbox(riderId).isDisabled();
  }

  async next() {
    await this.nextButton.click();
  }
}

module.exports = { RiderSelectionPage };
