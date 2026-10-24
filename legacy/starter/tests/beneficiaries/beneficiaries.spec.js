const { test, expect } = require('../../fixtures/auth.fixture');
const { BeneficiaryPage } = require('../../pages/BeneficiaryPage');
const applicationData = require('../../fixtures/applicationData');
const dataGen = require('../../utils/dataGenerator');
const { expectAllocationTotal } = require('../../utils/assertions');

test.describe('Beneficiary Management', () => {
  test('BEN-V01: add a valid primary beneficiary @smoke @regression', async ({
    agentPage,
    newApplicationId,
  }) => {
    const beneficiaryPage = new BeneficiaryPage(agentPage);
    await beneficiaryPage.goto(newApplicationId);

    const beneficiary = dataGen.beneficiary({ relationship: 'Spouse', allocationPercent: 100 });
    await beneficiaryPage.addAndFill(0, beneficiary);

    await expect(beneficiaryPage.beneficiaryRow(0)).toBeVisible();
    await expectAllocationTotal(agentPage, 100);
  });

  test('BEN-V02: primary allocation below 100% blocks progression @regression', async ({
    agentPage,
    newApplicationId,
  }) => {
    const beneficiaryPage = new BeneficiaryPage(agentPage);
    await beneficiaryPage.goto(newApplicationId);

    await beneficiaryPage.addMultiple(applicationData.beneficiaries.underAllocated);
    await beneficiaryPage.next();

    await expect(beneficiaryPage.allocationError).toBeVisible();
  });

  test('BEN-V03: primary allocation above 100% blocks progression @regression', async ({
    agentPage,
    newApplicationId,
  }) => {
    const beneficiaryPage = new BeneficiaryPage(agentPage);
    await beneficiaryPage.goto(newApplicationId);

    await beneficiaryPage.addMultiple(applicationData.beneficiaries.overAllocated);
    await beneficiaryPage.next();

    await expect(beneficiaryPage.allocationError).toBeVisible();
  });

  test('BEN-V05: minor beneficiary requires guardian details @regression', async ({
    agentPage,
    newApplicationId,
  }) => {
    const beneficiaryPage = new BeneficiaryPage(agentPage);
    await beneficiaryPage.goto(newApplicationId);

    const minor = { ...applicationData.beneficiaries.minor, guardianName: undefined };
    await beneficiaryPage.addAndFill(0, minor);
    await beneficiaryPage.next();

    await expect(beneficiaryPage.guardianRequiredError).toBeVisible();
  });

  test('BEN-V08: duplicate beneficiary is blocked @regression', async ({
    agentPage,
    newApplicationId,
  }) => {
    const beneficiaryPage = new BeneficiaryPage(agentPage);
    await beneficiaryPage.goto(newApplicationId);

    const [first, duplicate] = applicationData.beneficiaries.duplicatePair();
    await beneficiaryPage.addAndFill(0, first);
    await beneficiaryPage.addAndFill(1, duplicate);

    await expect(beneficiaryPage.duplicateError).toBeVisible();
  });
});
