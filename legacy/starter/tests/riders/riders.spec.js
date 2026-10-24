const { test, expect } = require('../../fixtures/auth.fixture');
const { RiderSelectionPage } = require('../../pages/RiderSelectionPage');
const applicationData = require('../../fixtures/applicationData');

test.describe('Rider Selection', () => {
  test('RIDER-V01: agent can add an eligible protection rider @regression', async ({
    agentPage,
    newApplicationId,
  }) => {
    const ridersPage = new RiderSelectionPage(agentPage);
    await ridersPage.goto(newApplicationId);

    const riderId = applicationData.validSubmission.riders[0].riderId;
    await ridersPage.addRider(riderId);

    await expect(ridersPage.riderPremiumItem(riderId)).toBeVisible();
  });

  test('RIDER-V02: rider coverage cannot exceed base policy face value @regression', async ({
    agentPage,
    newApplicationId,
  }) => {
    const ridersPage = new RiderSelectionPage(agentPage);
    await ridersPage.goto(newApplicationId);

    const { riderId, coverageAmount } = applicationData.riders.excessiveCoverageRider;
    await ridersPage.addRider(riderId);
    await ridersPage.setRiderCoverage(riderId, coverageAmount);

    await expect(ridersPage.coverageExceedsError).toBeVisible();
  });

  test('RIDER-V04: maximum rider count is enforced @regression', async ({
    agentPage,
    newApplicationId,
  }) => {
    const ridersPage = new RiderSelectionPage(agentPage);
    await ridersPage.goto(newApplicationId);

    // VERIFY: confirm the real max-count threshold before trusting this list's length.
    for (const riderId of applicationData.riders.maxRiderAttemptList) {
      await ridersPage.addRider(riderId);
    }

    await expect(ridersPage.maxRiderCountMessage).toBeVisible();
  });

  test('RIDER-V05: mutually exclusive waiver riders cannot both be selected @regression', async ({
    agentPage,
    newApplicationId,
  }) => {
    const ridersPage = new RiderSelectionPage(agentPage);
    await ridersPage.goto(newApplicationId);

    const { waiverRiderA, waiverRiderB } = applicationData.riders;
    await ridersPage.addRider(waiverRiderA);

    const disabled = await ridersPage.isRiderDisabled(waiverRiderB);
    expect(disabled).toBe(true);
  });
});
