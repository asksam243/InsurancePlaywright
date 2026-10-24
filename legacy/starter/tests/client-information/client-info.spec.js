const { test, expect } = require('../../fixtures/auth.fixture');
const { ClientInformationPage } = require('../../pages/ClientInformationPage');
const dataGen = require('../../utils/dataGenerator');

test.describe('Client / Insured Information', () => {
  test('CLI-V01: agent can enter valid insured personal information @regression', async ({
    agentPage,
    newApplicationId,
  }) => {
    const clientInfoPage = new ClientInformationPage(agentPage);
    await clientInfoPage.goto(newApplicationId);

    await clientInfoPage.fill(dataGen.validClient());
    await clientInfoPage.next();

    // Should advance past client info without validation errors blocking navigation.
    await expect(agentPage).toHaveURL(/\/address-contact/);
  });

  test('CLI-V02: mandatory personal fields are validated @regression', async ({
    agentPage,
    newApplicationId,
  }) => {
    const clientInfoPage = new ClientInformationPage(agentPage);
    await clientInfoPage.goto(newApplicationId);

    await clientInfoPage.submitBlank();

    await expect(agentPage.getByTestId('firstName-error')).toBeVisible();
    await expect(agentPage.getByTestId('lastName-error')).toBeVisible();
    await expect(clientInfoPage.dobError).toBeVisible();
  });

  test('CLI-V03: DOB below 18 years is rejected @regression', async ({
    agentPage,
    newApplicationId,
  }) => {
    const clientInfoPage = new ClientInformationPage(agentPage);
    await clientInfoPage.goto(newApplicationId);

    await clientInfoPage.fill(dataGen.underageClient());
    await clientInfoPage.next();

    await expect(clientInfoPage.ageEligibilityError).toBeVisible();
    await expect(agentPage).not.toHaveURL(/\/address-contact/);
  });
});
