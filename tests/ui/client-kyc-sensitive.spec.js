/**
 * KYC / SSN / income tests. SENSITIVE-DATA RULE: Playwright traces and videos record typed values and cannot be masked,
 * so they are OFF for this whole file (test.use must be top-level for trace/video). Masked screenshots from
 * utils/evidence.js are still attached on failure. Data is synthetic (123-45-6789 placeholder SSN, example.test emails) regardless.
 */
const { test, expect } = require('../../fixtures');
const { tc } = require('../../fixtures');
const M = require('../../config/messages');
const { S } = require('../../config/selectors');
const { files } = require('../../utils/files');
const { buildKyc, buildProduct } = require('../../utils/dataBuilder');
const { progressTo } = require('../../utils/flows');
const routes = require('../../config/routes');
const { applicationIdFromUrl } = require('../../pages/DashboardPage');
const { expectBlocked, captureEvidence } = require('../../utils/assertions');

test.use({ agentRole: 'learnerAgent', trace: 'off', video: 'off' });

test.describe('Client / KYC - sensitive data', () => {
  test(...tc('CLI-V08'), async ({ pages, page }, testInfo) => {
    // The real KYC form has NO separate SSN field: the SSN is the ID number when the ID type is SSN. The app must show it
    // masked once saved - on the KYC page after a reload, on the review page and in the API response.
    await progressTo(pages, 'kyc');
    const id = applicationIdFromUrl(page.url());
    const kyc = buildKyc({ idType: 'SSN' });
    const digitsOnly = kyc.idNumber.replace(/-/g, '');
    await pages.kyc.fill(kyc);
    const before = await pages.kyc.stepTitle();
    await pages.kyc.next();
    await pages.kyc.expectAdvanced(before);
    const expectMasked = async (label) => {
      const html = await page.content();
      expect(html, `${label}: the full SSN must not appear`).not.toContain(kyc.idNumber);
      expect(html, `${label}: the unformatted SSN must not appear`).not.toContain(digitsOnly);
    };
    await test.step('KYC page after reload', async () => {
      await page.goto(routes.step(id, 'kyc-financial'));
      await expectMasked('KYC page');
      const shown = await pages.kyc.visibleSsn();
      await captureEvidence(page, testInfo, 'ssn-as-displayed');
      expect(shown, 'only the last four digits may be visible').not.toContain(kyc.idNumber.slice(0, 6));
      expect(shown, 'last four digits should remain visible').toMatch(/6789$/);
    });
    await test.step('review page', async () => {
      await page.goto(routes.step(id, 'review'));
      await expectMasked('review page');
    });
  });

  test(...tc('CLI-V09'), async ({ pages }) => {
    await progressTo(pages, 'kyc');
    test.skip(!(await pages.kyc.$(S.kyc.uploadInput).count()), 'No upload control on the KYC step (see DOC-V02 for the document step)');
    await pages.kyc.uploadKycDocument(files.unsupportedExe());
    await pages.kyc.expectErrorText(M.fileType);
  });

  test(...tc('CLI-V10'), async ({ pages }) => {
    await progressTo(pages, 'kyc');
    const before = await pages.kyc.stepTitle();
    await pages.kyc.fill(buildKyc({ pep: true }));
    await expect(pages.kyc.$(S.kyc.pepDetails)).toBeVisible();
    await pages.kyc.next();
    await expectBlocked(pages.kyc, before, M.required);
  });

  test(...tc('CLI-V12'), async ({ pages, page }, testInfo) => {
    const { data } = await progressTo(pages, 'product', {
      kyc: buildKyc({ income: 12000 }),
      product: buildProduct({ faceValue: 5_000_000 }),
    });
    await pages.product.select(data.product.namePattern);
    await pages.product.configure(data.product);
    await pages.product.next();
    await captureEvidence(page, testInfo, 'affordability-check');
    await expect(
      pages.product.$$(S.common.anyError).or(pages.product.$(S.product.warning)).filter({ hasText: M.affordability }).first(),
      'a very high premium against a very low income should raise an affordability warning or block',
    ).toBeVisible();
  });
});
