const { test, expect } = require('@playwright/test');
const apiClient = require('../../utils/apiClient');
const users = require('../../fixtures/users');
const dataGen = require('../../utils/dataGenerator');
const applicationData = require('../../fixtures/applicationData');

const BASE_URL = process.env.API_BASE_URL || process.env.BASE_URL || 'http://localhost:8000';

/**
 * CORRECTED from the original version of this file: apiClient no longer takes
 * a `token` argument — auth is a static X-API-Key header (see apiClient.js's
 * top comment for the confirmed evidence). API-V08 needs real per-agent
 * sessions (not just the shared demo key) to test data isolation between two
 * different agents, so it uses `browser` to open two separate authenticated
 * contexts via UI login — this means API-V08 must run under a browser-capable
 * project, not a headless request-only "api" project. If your
 * playwright.config.js has a dedicated no-browser API project, either exclude
 * this one test from it or give that project a browser.
 */
test.describe('API Validation — Insurance Order Entry', () => {
  test('API-V01: Products API returns 200 and expected schema @api @regression', async ({ request }) => {
    const response = await apiClient.getProducts(request, BASE_URL);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(Array.isArray(body.products || body)).toBe(true);
    const list = body.products || body;
    if (list.length > 0) {
      // VERIFY exact schema keys against the real API response shape.
      expect(list[0]).toHaveProperty('id');
      expect(list[0]).toHaveProperty('name');
    }
  });

  test('API-V02: Application API requires the X-API-Key header @api @regression', async ({ request }) => {
    // Deliberately omit the header rather than passing an empty/null token —
    // the confirmed auth mechanism is a static header, not a per-call token.
    const response = await request.get(`${BASE_URL}/api/applications`);
    expect([401, 403]).toContain(response.status());
  });

  test('API-V03: Client API rejects invalid DOB @api @regression', async ({ request }) => {
    // Uses a placeholder application id — VERIFY whether this endpoint also
    // requires a per-agent session (not just the X-API-Key header) and
    // whether it validates DOB before checking application existence.
    const futureDobPayload = { ...dataGen.futureDobClient() };
    const response = await apiClient.updateClientInfo(request, BASE_URL, 'placeholder-app-id', futureDobPayload);
    expect([400, 422]).toContain(response.status());
  });

  test('API-V04: Validation API returns beneficiary allocation error @api @regression', async ({ request }) => {
    const response = await apiClient.postBeneficiaries(
      request,
      BASE_URL,
      'placeholder-app-id',
      applicationData.beneficiaries.underAllocated
    );
    const body = await response.json().catch(() => ({}));
    expect([400, 422]).toContain(response.status());
    // VERIFY the actual error field/shape the API returns for allocation issues.
    expect(JSON.stringify(body).toLowerCase()).toContain('allocation');
  });

  test('API-V05: Submission API rejects incomplete application @api @regression', async ({ request }) => {
    const response = await apiClient.submitApplication(request, BASE_URL, 'placeholder-app-id');
    expect([400, 409, 422]).toContain(response.status());
  });

  test('API-V06: Application status API matches dashboard @api @regression', async ({ request }) => {
    const appsResponse = await apiClient.getApplications(request, BASE_URL);
    expect(appsResponse.status()).toBe(200);
    const body = await appsResponse.json();
    const applications = body.applications || body;

    test.skip(!applications || applications.length === 0, 'No applications exist yet to compare status for.');

    const first = applications[0];
    const statusResponse = await apiClient.getApplicationStatus(request, BASE_URL, first.id);
    expect(statusResponse.status()).toBe(200);
    const statusBody = await statusResponse.json();
    expect(statusBody.status).toBe(first.status);
  });

  test('API-V07: Product API supports product detail retrieval @api @regression', async ({ request }) => {
    const listResponse = await apiClient.getProducts(request, BASE_URL);
    const body = await listResponse.json();
    const list = body.products || body;

    test.skip(!list || list.length === 0, 'No products returned to fetch a detail for.');

    const productId = list[0].id;
    const detailResponse = await apiClient.getProductDetail(request, BASE_URL, productId);
    expect(detailResponse.status()).toBe(200);
    const detail = await detailResponse.json();
    expect(detail.id).toBe(productId);
  });

  test('API-V08: Applications API returns only logged-in agent records @api @regression', async ({ browser }) => {
    // Two distinct authenticated sessions, via real UI logins — the shared
    // X-API-Key alone can't distinguish agents, so this is the one API test
    // that needs a browser (see the file-level comment above).
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    const requestA = await apiClient.loginViaUI(pageA, BASE_URL, users.validAgent);

    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    const requestB = await apiClient.loginViaUI(pageB, BASE_URL, users.newAgent);

    const firstAgentResponse = await apiClient.getApplications(requestA, BASE_URL);
    const secondAgentResponse = await apiClient.getApplications(requestB, BASE_URL);

    expect(firstAgentResponse.status()).toBe(200);
    expect(secondAgentResponse.status()).toBe(200);

    const firstBody = await firstAgentResponse.json();
    const secondBody = await secondAgentResponse.json();
    const firstIds = (firstBody.applications || firstBody).map((a) => a.id);
    const secondIds = (secondBody.applications || secondBody).map((a) => a.id);

    const overlap = firstIds.filter((id) => secondIds.includes(id));
    expect(overlap.length).toBe(0);

    await contextA.close();
    await contextB.close();
  });
});
