const routes = require('../utils/routes');

/** VERIFY field labels against the live Address and Contact Information page. */
class AddressContactPage {
  constructor(page) {
    this.page = page;
    this.addressLine1Input = page.getByLabel(/address line 1/i);
    this.addressLine2Input = page.getByLabel(/address line 2/i);
    this.cityInput = page.getByLabel(/city/i);
    this.stateInput = page.getByLabel(/state/i);
    this.postalCodeInput = page.getByLabel(/postal code|zip/i);

    this.sameAsResidentialCheckbox = page.getByLabel(/same as residential/i);
    this.mailingAddressLine1Input = page.getByLabel(/mailing address line 1/i);

    this.emailInput = page.getByLabel(/email/i);
    this.mobileInput = page.getByLabel(/mobile/i);
    this.alternatePhoneInput = page.getByLabel(/alternate phone/i);
    this.preferredCommunicationSelect = page.getByLabel(/preferred communication/i);

    this.nextButton = page.getByRole('button', { name: /next|continue/i });
    this.emailError = page.getByTestId('email-error');
    this.mobileError = page.getByTestId('mobile-error');
  }

  async goto(applicationId) {
    await this.page.goto(routes.addressContact(applicationId));
  }

  async fillAddress(address) {
    await this.addressLine1Input.fill(address.addressLine1);
    await this.addressLine2Input.fill(address.addressLine2 || '');
    await this.cityInput.fill(address.city);
    await this.stateInput.fill(address.state);
    await this.postalCodeInput.fill(address.postalCode);
  }

  async checkSameAsResidential() {
    await this.sameAsResidentialCheckbox.check();
  }

  async fillContact(contact) {
    await this.emailInput.fill(contact.email);
    await this.mobileInput.fill(contact.mobile);
    await this.alternatePhoneInput.fill(contact.alternatePhone || '');
    await this.preferredCommunicationSelect.selectOption(contact.preferredCommunication);
  }

  async next() {
    await this.nextButton.click();
  }
}

module.exports = { AddressContactPage };
