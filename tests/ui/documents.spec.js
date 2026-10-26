const { test, tc, expect, env } = require('../../fixtures');
const M = require('../../config/messages');
const { files } = require('../../utils/files');
const { progressTo } = require('../../utils/flows');
const routes = require('../../config/routes');
const { applicationIdFromUrl } = require('../../pages/DashboardPage');
const { expectBlocked, captureEvidence } = require('../../utils/assertions');

test.describe('Document Upload & Validation Summary', () => {
  test.use({ agentRole: 'learnerAgent' });

  test(...tc('DOC-V01'), async ({ pages }) => {
    await progressTo(pages, 'documents');
    for (const file of [files.validPdf(), files.validJpg(), files.validPng()]) {
      await test.step(`${file.name} is accepted`, async () => {
        await pages.documents.upload(file, 0);
        await expect(pages.documents.uploaded.first()).toBeVisible();
        await expect(pages.documents.$$({ id: 'x', css: '.field-error, .invalid-feedback, [role="alert"]' }).filter({ hasText: M.fileType })).toHaveCount(0);
      });
    }
  });

  test(...tc('DOC-V02'), async ({ pages }) => {
    await progressTo(pages, 'documents');
    for (const file of [files.unsupportedExe(), files.unsupportedTxt()]) {
      await test.step(`${file.name} is rejected`, async () => {
        await pages.documents.upload(file, 0);
        await pages.documents.expectErrorText(M.fileType);
        await expect(pages.documents.uploaded).toHaveCount(0);
      });
    }
  });

  test(...tc('DOC-V03'), async ({ pages }) => {
    const max = env.rules.maxUploadMb;
    test.skip(max === null, 'Set MAX_UPLOAD_MB to run (Q17)');
    test.skip(max >= 49, 'Playwright in-memory upload limit is 50 MB; use a smaller MAX_UPLOAD_MB on the test environment');
    await progressTo(pages, 'documents');
    await pages.documents.upload(files.oversizePdf(max), 0);
    await pages.documents.expectErrorText(M.fileSize);
  });

  test(...tc('DOC-V04'), async ({ pages, page }, testInfo) => {
    await progressTo(pages, 'documents', { documents: false });
    const before = await pages.documents.stepTitle();
    await pages.documents.next();
    await captureEvidence(page, testInfo, 'next-without-documents');
    const reachedReview = await pages.review.submitButton.isVisible().catch(() => false);
    if (!reachedReview) {
      await expectBlocked(pages.documents, before, M.mandatoryDocument);
      return;
    }
    // The app lets the agent reach review: submission itself must still be blocked.
    if (await pages.review.submitButton.isEnabled()) {
      await pages.review.submit();
      await expect(pages.review.$({ id: 'reference-number', css: '[data-testid="reference-number"], .reference-number' }), 'no reference number may be issued without mandatory documents').toHaveCount(0);
    } else {
      await expect(pages.review.submitButton).toBeDisabled();
    }
  });
});

test.describe('Validation Summary (review step with unresolved errors)', () => {
  test.use({ agentRole: 'learnerAgent' });

  /** Reaches review WITHOUT uploading documents; skips if the app refuses to show review with errors. */
  async function reviewWithMissingDocuments(pages) {
    await progressTo(pages, 'documents', { documents: false });
    await pages.documents.next();
    const onReview = await pages.review.submitButton.waitFor({ state: 'visible', timeout: 5000 }).then(() => true).catch(() => false);
    test.skip(!onReview, 'The app blocks reaching review while errors exist (validation summary not reachable this way)');
  }

  test(...tc('VAL-V01'), async ({ pages }) => {
    await reviewWithMissingDocuments(pages);
    await expect(pages.review.validation.items.first()).toBeVisible();
    const texts = await pages.review.validation.texts();
    expect(texts.some((t) => M.mandatoryDocument.test(t)), `a summary item about documents in: ${JSON.stringify(texts)}`).toBeTruthy();
  });

  test(...tc('VAL-V02'), async ({ pages, page }) => {
    await reviewWithMissingDocuments(pages);
    const urlBefore = page.url();
    const titleBefore = await pages.review.stepTitle();
    await pages.review.validation.clickItem(0);
    await expect.poll(async () => page.url() !== urlBefore || (await pages.review.stepTitle()) !== titleBefore, {
      message: 'clicking a validation item should navigate to the section that owns the error',
    }).toBe(true);
  });

  test(...tc('VAL-V03'), async ({ pages, page }, testInfo) => {
    await reviewWithMissingDocuments(pages);
    await test.step('Submit is disabled while errors exist', async () => {
      await captureEvidence(page, testInfo, 'submit-state-with-errors');
      await expect(pages.review.submitButton).toBeDisabled();
    });
    await test.step('Submit becomes enabled once the errors are resolved', async () => {
      await page.goto(routes.step(applicationIdFromUrl(page.url()), 'documents')); // the real review page has no Back button
      await pages.documents.uploadAllRequired(files.validPdf());
      await pages.documents.next();
      await expect(pages.review.submitButton).toBeEnabled();
    });
  });
});
