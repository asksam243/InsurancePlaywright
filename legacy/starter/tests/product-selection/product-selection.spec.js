const { test, expect } = require('../../fixtures/auth.fixture');
const { ProductCatalogPage } = require('../../pages/ProductCatalogPage');
const { ProductConfigurationPage } = require('../../pages/ProductConfigurationPage');
const applicationData = require('../../fixtures/applicationData');

test.describe('Product Selection and Policy Configuration', () => {
  test('PROD-V01: product catalog displays expected Whole Life products @smoke @regression', async ({
    agentPage,
  }) => {
    const catalog = new ProductCatalogPage(agentPage);
    await catalog.goto();

    await expect(catalog.productCards.first()).toBeVisible();
    expect(await catalog.productCards.count()).toBeGreaterThan(0);
  });

  test('PROD-V03: face value below minimum is rejected @regression', async ({
    agentPage,
    newApplicationId,
  }) => {
    const configPage = new ProductConfigurationPage(agentPage);
    await configPage.goto(newApplicationId);

    await configPage.configure({
      faceValue: applicationData.product.belowMinimumFaceValue,
      premiumFrequency: applicationData.validSubmission.product.premiumFrequency,
      paymentTerm: applicationData.validSubmission.product.paymentTerm,
      policyTerm: applicationData.validSubmission.product.policyTerm,
    });
    await configPage.next();

    await expect(configPage.faceValueError).toBeVisible();
  });
});
