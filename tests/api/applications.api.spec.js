const { apiTest: test, apiTc: tc, expect, env } = require('../../fixtures');
const ep = require('../../config/endpoints');
const { asList, idOf, statusOf } = require('../../api/ApiClient');
const { clientPayload, beneficiaryPayload, disposableDraft, is4xxValidation } = require('../../api/helpers');
const { dobForAge, futureDate, formatDate } = require('../../utils/dates');
const { files } = require('../../utils/files');
const { attachApi } = require('../../utils/assertions');

// Real field names: products have product_name, riders have rider_name (third project's API tests).
const nameOf = (o) => o?.product_name ?? o?.rider_name ?? o?.name ?? o?.productName ?? o?.title ?? o?.riderName;

test.describe('API validation', () => {
  test(...tc('API-V01'), async ({ api }, testInfo) => {
    const res = await api.get(ep.products);
    const body = await api.json(res);
    await attachApi(testInfo, 'products', res, body);
    expect(res.status(), `GET ${env.apiBaseUrl}products -> HTTP ${res.status()}. A 404 here means the API is not served at this base URL: run npm run health (it probes the usual ports) and set INSURANCE_API_URL`).toBe(200);
    const list = asList(body);
    expect(list.length, 'non-empty product list').toBeGreaterThan(0);
    for (const p of list) {
      expect.soft(idOf(p), 'product id').toBeDefined();
      expect.soft(nameOf(p), 'product name').toBeTruthy();
    }
  });

  test(...tc('API-V02'), async ({ anonApi }, testInfo) => {
    // No key at all: the API must answer 401 (a 302 to /login or a 200 would be a defect). The acting agent is still named.
    const res = await anonApi.get(ep.applications, { params: { agent_email: env.users.learnerAgent.email } });
    const text = await res.text();
    await attachApi(testInfo, 'unauthenticated-applications', res, text.slice(0, 500));
    expect([401, 403], `unauthenticated GET ${env.apiBaseUrl}applications returned ${res.status()}${res.status() === 404 ? ' - 404 means the API is not at this base URL (run npm run health, then set INSURANCE_API_URL)' : ''}`).toContain(res.status());
  });

  test.describe('draft-based negative tests', () => {
    let draftId;
    test.beforeAll(async ({ api }) => {
      draftId = await disposableDraft(api);
    });

    test(...tc('API-V03'), async ({ api }, testInfo) => {
      test.skip(!draftId, 'No draft application available (cannot create via API and none exists) - Q21');
      const control = await api.post(ep.client(draftId), clientPayload());
      test.skip(!control.ok(), `Control (valid) client payload was rejected with HTTP ${control.status()} - payload shape unconfirmed (Q03)`);
      for (const [label, dob] of [['future (tomorrow)', futureDate(1)], ['age 17', dobForAge(18, { dayOffset: 1 })]]) {
        const res = await api.post(ep.client(draftId), clientPayload({ dob }));
        await attachApi(testInfo, `dob-${label}`, res, await api.json(res));
        expect.soft(is4xxValidation(res.status()), `DOB ${formatDate(dob)} (${label}) should be rejected; got HTTP ${res.status()}`).toBe(true);
      }
    });

    test(...tc('API-V04'), async ({ api }, testInfo) => {
      test.skip(!draftId, 'No draft application available - Q21');
      const benPayload = (allocation) => beneficiaryPayload(allocation);
      const control = await api.post(ep.beneficiaries(draftId), benPayload(100));
      test.skip(!control.ok(), `Control (valid, 100%) beneficiary payload was rejected with HTTP ${control.status()} - payload shape unconfirmed`);
      const bad = await api.post(ep.beneficiaries(draftId), benPayload(60));
      const validation = await api.post(ep.validate(draftId), {});
      const body = JSON.stringify(await api.json(validation));
      await attachApi(testInfo, 'validate-result', validation, body);
      const rejectedAtSave = is4xxValidation(bad.status());
      expect(rejectedAtSave || /allocat|100|percent/i.test(body), 'a 60% allocation must be rejected on save or reported by /validate').toBe(true);
    });

    test(...tc('API-V05'), async ({ api }, testInfo) => {
      test.skip(!draftId, 'No draft application available - Q21');
      const res = await api.post(ep.submit(draftId), {});
      const body = await api.json(res);
      await attachApi(testInfo, 'submit-incomplete', res, body);
      expect(is4xxValidation(res.status()), `submitting an incomplete application must be refused; got HTTP ${res.status()}`).toBe(true);
      expect(JSON.stringify(body)).not.toMatch(/reference/i);
    });

    test(...tc('API-V10'), async ({ api }, testInfo) => {
      test.skip(!draftId, 'No draft application available - Q21');
      const upload = (file) => api.post(ep.documents(draftId), undefined, {
        multipart: { document_type: 'KYC_ID', document: file },
      });
      const control = await upload(files.validPdf());
      test.skip(!control.ok(), `Control (valid PDF) upload was rejected with HTTP ${control.status()} - multipart shape unconfirmed`);
      const exe = await upload(files.unsupportedExe());
      await attachApi(testInfo, 'upload-exe', exe, await exe.text());
      expect.soft(is4xxValidation(exe.status()), `.exe upload should be rejected; got HTTP ${exe.status()}`).toBe(true);
      if (env.rules.maxUploadMb && env.rules.maxUploadMb < 49) {
        const big = await upload(files.oversizePdf(env.rules.maxUploadMb));
        await attachApi(testInfo, 'upload-oversize', big, await big.text());
        expect.soft(is4xxValidation(big.status()) || big.status() === 413, `oversize upload should be rejected; got HTTP ${big.status()}`).toBe(true);
      }
    });
  });

  test(...tc('API-V06'), async ({ api }, testInfo) => {
    const { items } = await api.listApplications();
    test.skip(!items.length, 'The agent has no applications');
    for (const item of items.slice(0, 5)) {
      const id = idOf(item);
      const res = await api.get(ep.status(id));
      const body = await api.json(res);
      await attachApi(testInfo, `status-${id}`, res, body);
      expect.soft(res.ok(), `GET status ${id}`).toBeTruthy();
      expect.soft(String(statusOf(body) ?? '').toLowerCase(), `status of ${id}: list "${statusOf(item)}" vs status endpoint`).toBe(String(statusOf(item) ?? '').toLowerCase());
    }
  });

  test(...tc('API-V08'), async ({ api, apiAs }, testInfo) => {
    test.skip(!env.users.secondAgent.email, 'Set AGENT_SECOND_EMAIL to run (Q06)');
    test.skip(env.users.secondAgent.email === env.users.learnerAgent.email, 'AGENT_SECOND_EMAIL must differ from LEARNER_USER');
    const other = await apiAs('secondAgent');
    const a = (await api.listApplications()).items.map(idOf);
    const b = (await other.listApplications()).items.map(idOf);
    await testInfo.attach('ids.json', { body: JSON.stringify({ agentA: a, agentB: b }, null, 2), contentType: 'application/json' });
    test.skip(!a.length || !b.length, 'Both agents need at least one application to compare');
    expect(a.filter((id) => b.includes(id)), 'application ids returned to BOTH agents').toEqual([]);
  });

  test(...tc('API-V09'), async ({ api }, testInfo) => {
    const res = await api.get(ep.riders);
    const body = await api.json(res);
    await attachApi(testInfo, 'riders', res, body);
    expect(res.status()).toBe(200);
    const list = asList(body);
    expect(list.length, 'non-empty rider list').toBeGreaterThan(0);
    for (const r of list) {
      expect.soft(idOf(r), 'rider id').toBeDefined();
      expect.soft(nameOf(r), 'rider name').toBeTruthy();
    }
  });

  test(...tc('API-V11'), async ({ api }, testInfo) => {
    const id = await api.firstApplicationId();
    test.skip(!id, 'The agent has no applications');
    const res = await api.get(ep.status(id));
    const body = await api.json(res);
    await attachApi(testInfo, 'status', res, body);
    expect(res.status()).toBe(200);
    expect(statusOf(body), 'status value').toBeTruthy();
    const history = body.history ?? body.status_history ?? body.statusHistory ?? body.data?.status_history ?? body.data?.history;
    if (Array.isArray(history)) {
      for (const h of history) expect.soft(h.timestamp ?? h.changedAt ?? h.createdAt ?? h.date, `timestamp on history entry ${JSON.stringify(h)}`).toBeTruthy();
    }
  });
});
