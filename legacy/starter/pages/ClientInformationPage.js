const routes = require('../utils/routes');

/** VERIFY every field label against the live Client / Insured Information page. */
class ClientInformationPage {
  constructor(page) {
    this.page = page;
    this.firstNameInput = page.getByLabel(/first name/i);
    this.lastNameInput = page.getByLabel(/last name/i);
    this.dobInput = page.getByLabel(/date of birth/i);
    this.genderSelect = page.getByLabel(/gender/i);
    this.maritalStatusSelect = page.getByLabel(/marital status/i);
    this.occupationInput = page.getByLabel(/occupation/i);
    this.employerNameInput = page.getByLabel(/employer/i);

    this.nextButton = page.getByRole('button', { name: /next|continue/i });
    this.dobError = page.getByTestId('dateOfBirth-error');
    this.ageEligibilityError = page.getByTestId('age-eligibility-error');
  }

  async goto(applicationId) {
    await this.page.goto(routes.clientInfo(applicationId));
  }

  async fill(client) {
    await this.firstNameInput.fill(client.firstName);
    await this.lastNameInput.fill(client.lastName);
    await this.dobInput.fill(client.dateOfBirth);
    await this.genderSelect.selectOption(client.gender);
    await this.maritalStatusSelect.selectOption(client.maritalStatus);
    await this.occupationInput.fill(client.occupation);
    await this.employerNameInput.fill(client.employerName);
  }

  async submitBlank() {
    await this.nextButton.click();
  }

  async next() {
    await this.nextButton.click();
  }
}

module.exports = { ClientInformationPage };
