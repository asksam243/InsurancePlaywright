const { test, expect } = require('../../fixtures/auth.fixture');
const { DocumentUploadPage } = require('../../pages/DocumentUploadPage');
const { ReviewPage } = require('../../pages/ReviewPage');
const fileHelper = require('../../utils/fileUploadHelper');
const { expectValidationSummaryBlocking } = require('../../utils/assertions');

test.describe('Document Upload and Validation Summary', () => {
  test.afterAll(() => {
    fileHelper.cleanup();
  });

  test('DOC-V02: unsupported file type is rejected @regression', async ({
    agentPage,
    newApplicationId,
  }) => {
    const documentsPage = new DocumentUploadPage(agentPage);
    await documentsPage.goto(newApplicationId);

    const badFile = fileHelper.createUnsupportedFile();
    await documentsPage.upload(badFile);

    await expect(documentsPage.fileTypeError).toBeVisible();
  });

  test('VAL-V03: submit button remains disabled until critical errors are resolved @regression', async ({
    agentPage,
    newApplicationId,
  }) => {
    // Navigating straight to Review on a fresh, incomplete application —
    // every prior step is still unfilled, so critical errors should exist.
    const reviewPage = new ReviewPage(agentPage);
    await reviewPage.goto(newApplicationId);

    await expectValidationSummaryBlocking(agentPage);
  });
});
