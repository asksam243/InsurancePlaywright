/**
 * Thin wrapper around Playwright's APIRequestContext for the endpoints in
 * Section 3.9.
 *
 * CORRECTED from the original version of this file, which assumed a bearer
 * token returned from POST /api/auth/login. Real evidence from the platform's
 * Setup/Troubleshooting guides shows every API call is gated by a static,
 * environment-level key:
 *
 *   X-API-Key: qa-insurance-demo-token-123   (value of QA_DEMO_API_KEY)
 *
 * confirmed directly via the documented curl smoke tests:
 *   curl http://localhost:8000/api/health -H "X-API-Key: qa-insurance-demo-token-123"
 *   curl http://localhost:8000/api/products -H "X-API-Key: ..."
 *   curl http://localhost:8000/api/applications -H "X-API-Key: ..."
 *
 * STILL UNCONFIRMED / open question: API-V08 ("Applications API returns only
 * logged-in agent records") implies /api/applications is also agent-specific,
 * not just gated by one shared demo key — which means it likely ALSO requires
 * a per-agent session cookie on top of the X-API-Key header (i.e., the request
 * context needs to come from a context that already did a UI login, sharing
 * cookies with the API call). This client exposes `loginViaUI` for that case;
 * confirm against the live app whether agent-scoped endpoints need it or
 * whether the API key alone is sufficient and agent identity comes from a
 * query param / request body instead.
 */

const API_KEY = process.env.API_KEY || process.env.QA_DEMO_API_KEY || 'qa-insurance-demo-token-123';

function authHeaders() {
  return { 'X-API-Key': API_KEY };
}

/**
 * For endpoints that are agent-scoped (API-V08's data isolation check), the
 * request context must carry that agent's session cookie. Playwright's
 * request fixture shares cookies with its browser context only if created
 * from `context.request` after a UI login — a bare top-level `request`
 * fixture is cookie-less. Use this helper when you need an authenticated
 * request context tied to a real UI session, rather than a fresh `request`.
 */
async function loginViaUI(page, baseURL, { email, password }) {
  await page.goto(`${baseURL}/login`);
  // CONFIRMED testids (same ones used in LoginPage.js) — the submit button's
  // visible text is "Login" (one word), not "Log in"/"Sign in", so testid is
  // used directly rather than a role/name regex.
  await page.getByTestId('login-email-input').fill(email);
  await page.getByTestId('login-password-input').fill(password);
  await page.getByTestId('login-submit-button').click();
  // Either landing page confirms the session is established.
  await page.waitForURL(/\/(dashboard|applications\/[^/]+\/client)/);
  return page.context().request;
}

async function getProducts(request, baseURL) {
  return request.get(`${baseURL}/api/products`, { headers: authHeaders() });
}

async function getProductDetail(request, baseURL, productId) {
  return request.get(`${baseURL}/api/products/${productId}`, { headers: authHeaders() });
}

async function getApplications(request, baseURL) {
  return request.get(`${baseURL}/api/applications`, { headers: authHeaders() });
}

async function getApplicationStatus(request, baseURL, applicationId) {
  return request.get(`${baseURL}/api/applications/${applicationId}/status`, {
    headers: authHeaders(),
  });
}

async function updateClientInfo(request, baseURL, applicationId, clientPayload) {
  return request.post(`${baseURL}/api/applications/${applicationId}/client`, {
    headers: authHeaders(),
    data: clientPayload,
  });
}

async function validateApplication(request, baseURL, applicationId) {
  return request.post(`${baseURL}/api/applications/${applicationId}/validate`, {
    headers: authHeaders(),
  });
}

async function submitApplication(request, baseURL, applicationId) {
  return request.post(`${baseURL}/api/applications/${applicationId}/submit`, {
    headers: authHeaders(),
  });
}

async function getBeneficiaries(request, baseURL, applicationId) {
  return request.get(`${baseURL}/api/applications/${applicationId}/beneficiaries`, {
    headers: authHeaders(),
  });
}

async function postBeneficiaries(request, baseURL, applicationId, beneficiariesPayload) {
  return request.post(`${baseURL}/api/applications/${applicationId}/beneficiaries`, {
    headers: authHeaders(),
    data: beneficiariesPayload,
  });
}

async function health(request, baseURL) {
  return request.get(`${baseURL}/api/health`, { headers: authHeaders() });
}

module.exports = {
  authHeaders,
  loginViaUI,
  health,
  getProducts,
  getProductDetail,
  getApplications,
  getApplicationStatus,
  updateClientInfo,
  validateApplication,
  submitApplication,
  getBeneficiaries,
  postBeneficiaries,
};
