const { integrationTest: test, integrationTc: tc, expect } = require('../../fixtures');
const ep = require('../../config/endpoints');
const { futureDate, formatDate } = require('../../utils/dates');
const { progressTo, reachReview } = require('../../utils/flows');
const { applicationIdFromUrl } = require('../../pages/DashboardPage');
const { statusOf, asList, idOf } = require('../../api/ApiClient');
const { clientPayload, is4xxValidation } = require('../../api/helpers');
const M = require('../../config/messages');
const { attachApi, captureEvidence, expectBlocked } = require('../../utils/assertions');

test.describe('UI <-> API integration', () => {
  test.use({ agentRole: 'validAgent' });

  test(...tc('DASH-V06'), async ({ pages, api }, testInfo) => {
    await pages.dashboard.goto();
    const n = Math.min(await pages.dashboard.rows.count(), 5);
    test.skip(n === 0, 'No applications on the dashboard to compare');
    let compared = 0;
    for (let i = 0; i < n; i += 1) {
      const row = pages.dashboard.rows.nth(i);
      const id = await pages.dashboard.rowId(row);
      if (!id) continue;
      const uiStatus = ((await pages.dashboard.statusOf(row).textContent()) || '').trim().toLowerCase();
      const res = await api.get(ep.status(id));
      const body = await api.json(res);
      await attachApi(testInfo, `status-${id}`, res, body);
      expect.soft(res.ok(), `GET status for ${id}`).toBeTruthy();
      expect.soft(String(statusOf(body) ?? '').toLowerCase(), `status for application ${id}: UI "${uiStatus}" vs API`).toBe(uiStatus);
      compared += 1;
    }
    test.skip(compared === 0, 'Dashboard rows expose no application id (data-testid application-row-<id> or link) - cannot compare');
  });

  test(...tc('WF-V07'), async ({ pages, api }, testInfo) => {
    const { id } = await reachReview(pages);
    test.skip(!id, 'Application id could not be read from the URL');
    await pages.review.submit();
    await pages.review.referenceNumber();
    const ui = (await pages.review.statusText()).toLowerCase();
    const res = await api.get(ep.status(id));
    const body = await api.json(res);
    await attachApi(testInfo, 'status-api', res, body);
    expect(res.ok()).toBeTruthy();
    expect(String(statusOf(body) ?? '').toLowerCase(), 'API status vs status shown on the application page').toBe(ui);
  });

  test(...tc('API-V07'), async ({ pages, api }, testInfo) => {
    await progressTo(pages, 'product');
    const res = await api.get(ep.products);
    const list = asList(await api.json(res));
    test.skip(!list.length || idOf(list[0]) === undefined, 'Products API exposes no product ids');
    const detailRes = await api.get(ep.product(idOf(list[0])));
    const detail = await api.json(detailRes);
    await attachApi(testInfo, 'product-detail', detailRes, detail);
    const name = detail.name ?? detail.productName ?? detail.data?.name ?? list[0].name ?? list[0].productName;
    expect(name, 'product name in the API response').toBeTruthy();
    await expect(pages.product.cards.filter({ hasText: String(name) }).first(), `UI card for API product "${name}"`).toBeVisible();
  });

  test(...tc('API-V12'), async ({ pages, page, api }, testInfo) => {
    const { data } = await progressTo(pages, 'client');
    const id = applicationIdFromUrl(page.url());
    test.skip(!id, 'Application id could not be read from the URL');
    const before = await pages.client.stepTitle();
    const badDob = futureDate(1);
    // UI
    await pages.client.fill({ ...data.client, dob: badDob });
    await pages.client.next();
    await captureEvidence(page, testInfo, 'ui-future-dob');
    await expectBlocked(pages.client, before, M.dobFuture);
    // API: valid control first, so a wrong payload shape cannot masquerade as a rejection
    const control = await api.post(ep.client(id), clientPayload({ dob: data.client.dob }));
    test.skip(!control.ok(), `Control (valid) client payload was rejected with HTTP ${control.status()} - payload shape unconfirmed (Q03)`);
    const res = await api.post(ep.client(id), clientPayload({ dob: badDob }));
    await attachApi(testInfo, 'api-future-dob', res, await api.json(res));
    expect(is4xxValidation(res.status()), `API must reject DOB ${formatDate(badDob)}; got HTTP ${res.status()}`).toBe(true);
  });
});
