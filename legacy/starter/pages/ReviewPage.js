const routes = require('../utils/routes');

/** VERIFY validation-summary item testids and the submit button's accessible name live. */
class ReviewPage {
  constructor(page) {
    this.page = page;
    this.validationSummary = page.getByTestId('validation-summary');
    this.validationSummaryItems = page.getByTestId('validation-summary-item');
    this.submitButton = page.getByRole('button', { name: /submit application/i });
  }

  async goto(applicationId) {
    await this.page.goto(routes.review(applicationId));
  }

  async clickValidationItem(index = 0) {
    await this.validationSummaryItems.nth(index).click();
  }

  async submit() {
    await this.submitButton.click();
  }
}

module.exports = { ReviewPage };
