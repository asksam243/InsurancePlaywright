const routes = require('../utils/routes');

/** VERIFY the reference number testid and confirmation-message copy live. */
class ConfirmationPage {
  constructor(page) {
    this.page = page;
    this.referenceNumber = page.getByTestId('application-reference-number');
    this.confirmationMessage = page.getByTestId('confirmation-message');
  }

  async goto(applicationId) {
    await this.page.goto(routes.confirmation(applicationId));
  }

  async getReferenceNumber() {
    return (await this.referenceNumber.textContent())?.trim();
  }
}

module.exports = { ConfirmationPage };
