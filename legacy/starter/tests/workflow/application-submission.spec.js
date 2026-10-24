const { test, expect } = require('../../fixtures/auth.fixture');
const { ClientInformationPage } = require('../../pages/ClientInformationPage');
const { AddressContactPage } = require('../../pages/AddressContactPage');
const { KycFinancialPage } = require('../../pages/KycFinancialPage');
const { ProductConfigurationPage } = require('../../pages/ProductConfigurationPage');
const { RiderSelectionPage } = require('../../pages/RiderSelectionPage');
const { BeneficiaryPage } = require('../../pages/BeneficiaryPage');
const { DocumentUploadPage } = require('../../pages/DocumentUploadPage');
const { ReviewPage } = require('../../pages/ReviewPage');
const { ConfirmationPage } = require('../../pages/ConfirmationPage');

const applicationData = require('../../fixtures/applicationData');
const fileHelper = require('../../utils/fileUploadHelper');
const { expectReferenceNumber } = require('../../utils/assertions');

test.describe('Application Submission and Status Tracking — Full Workflow', () => {
  test.afterAll(() => {
    fileHelper.cleanup();
  });

  test('WF-V01: agent can save incomplete application as draft @smoke @regression @e2e', async ({
    agentPage,
    dashboardPage,
    newApplicationId,
  }) => {
    const clientInfoPage = new ClientInformationPage(agentPage);
    await clientInfoPage.goto(newApplicationId);
    await clientInfoPage.fill(applicationData.validSubmission.client);

    // VERIFY: confirm the actual "Save Draft" control — assumed to be a
    // named button distinct from "Next"/"Continue".
    await agentPage.getByRole('button', { name: /save draft/i }).click();

    await dashboardPage.goto();
    await expect(dashboardPage.applicationRow(newApplicationId)).toBeVisible();
    await expect(dashboardPage.applicationRowStatus(newApplicationId)).toHaveText(/draft/i);
  });

  test('WF-V03: valid application can be submitted successfully @smoke @regression @e2e', async ({
    agentPage,
    newApplicationId,
  }) => {
    const data = applicationData.validSubmission;

    await test.step('Client / Insured Information', async () => {
      const clientInfoPage = new ClientInformationPage(agentPage);
      await clientInfoPage.goto(newApplicationId);
      await clientInfoPage.fill(data.client);
      await clientInfoPage.next();
    });

    await test.step('Address and Contact Information', async () => {
      const addressPage = new AddressContactPage(agentPage);
      await addressPage.fillAddress(data.address);
      await addressPage.fillContact(data.contact);
      await addressPage.next();
    });

    await test.step('KYC, Financial, and Compliance', async () => {
      const kycPage = new KycFinancialPage(agentPage);
      await kycPage.fill(data.kyc);
      const validPdf = fileHelper.createValidPdf();
      await kycPage.uploadDocument(validPdf);
      await kycPage.next();
    });

    await test.step('Product Selection and Configuration', async () => {
      // VERIFY: confirm whether product choice happens on a separate
      // /products -> /products/:id step before configuration, or directly
      // on the /applications/:id/product page as assumed here.
      const configPage = new ProductConfigurationPage(agentPage);
      await configPage.goto(newApplicationId);
      await configPage.configure(data.product);
      await configPage.next();
    });

    await test.step('Rider Selection', async () => {
      const ridersPage = new RiderSelectionPage(agentPage);
      for (const rider of data.riders) {
        await ridersPage.addRider(rider.riderId);
      }
      await ridersPage.next();
    });

    await test.step('Beneficiary Management', async () => {
      const beneficiaryPage = new BeneficiaryPage(agentPage);
      await beneficiaryPage.addMultiple(data.beneficiaries);
      await beneficiaryPage.next();
    });

    await test.step('Document Upload', async () => {
      const documentsPage = new DocumentUploadPage(agentPage);
      const validPdf = fileHelper.createValidPdf('additional-kyc-doc.pdf');
      await documentsPage.upload(validPdf);
      await documentsPage.next();
    });

    let referenceNumber;
    await test.step('Review, Submit, and Confirm', async () => {
      const reviewPage = new ReviewPage(agentPage);
      await expect(reviewPage.submitButton).toBeEnabled();
      await reviewPage.submit();

      const confirmationPage = new ConfirmationPage(agentPage);
      await expect(agentPage).toHaveURL(/\/confirmation/);
      referenceNumber = await expectReferenceNumber(agentPage);
      expect(referenceNumber.length).toBeGreaterThan(0);
    });

    await test.step('Submitted application becomes read-only (WF-V04)', async () => {
      await agentPage.goto(`/applications/${newApplicationId}/client`);
      await expect(agentPage.getByLabel(/first name/i)).toBeDisabled();
    });

    await test.step('Dashboard status updates after submission (WF-V06)', async () => {
      await agentPage.goto('/dashboard');
      await expect(agentPage.getByTestId(`application-row-${newApplicationId}-status`)).toHaveText(
        /submitted/i
      );
    });
  });
});
