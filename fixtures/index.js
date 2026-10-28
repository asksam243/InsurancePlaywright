/**
 * Custom Playwright fixtures + the tc() test declaration helper.
 *
 *   test      UI tests: `pages` (page objects), automatic `diagnostics` (console + 5xx + evidence), session reuse
 *   apiTest   API tests: `api` (authenticated agent) and `anonApi` (no credentials), no browser started
 *   unitTest  offline framework checks (no browser, no application)
 *
 *   tc('AUTH-V01', async ({ pages }) => { ... })   -> declares test "TC-AUTH-V01 <title> @tags" from test-design/testCases.js
 */
const base = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const env = require('../config/env');
const ep = require('../config/endpoints');
const { PageManager } = require('../pages');
const { LoginPage } = require('../pages/LoginPage');
const { ApiClient } = require('../api/ApiClient');
const { byId } = require('../test-design/testCases');
const { maskedScreenshot } = require('../utils/evidence');

const AUTH_DIR = path.join(__dirname, '..', '.auth');

/**
 * Defects that are LOGGED and approved as known can be listed in EXPECT_FAIL_DEFECTS (e.g. "RI-05,RI-07").
 * Their tests are then marked expected-to-fail, so the run stays green while the defect is open and turns RED as an
 * "unexpected pass" the day it is fixed - at which point the marker must be removed from .env.
 */
const knownDefectFixtures = {
  knownDefects: [
    async ({}, use, testInfo) => { // eslint-disable-line no-empty-pattern
      const hits = testInfo.annotations.filter((a) => a.type === 'defect' && env.expectFailDefects.has(a.description)).map((a) => a.description);
      if (hits.length) {
        testInfo.annotations.push({ type: 'known-defect', description: `${hits.join(', ')} (EXPECT_FAIL_DEFECTS) - remove the marker once fixed` });
        base.test.fail(true, `Known defect(s) ${hits.join(', ')}`);
      }
      await use();
    },
    { auto: true },
  ],
};

/**
 * Session reuse (Submission 1 plan, section 5.4): a role is logged in through the UI ONCE per worker and the session
 * is cached as storageState; later tests in the same worker start already signed in.
 * Tests opt in with  test.use({ agentRole: 'learnerAgent' })  (write flows)  or 'validAgent' (seeded data)  (also allowed inside describe blocks).
 * Login tests simply do not set it, so they always start from a clean, anonymous context.
 */
const test = base.test.extend({
  ...knownDefectFixtures,
  agentRole: [null, { option: true }],
  sessionCache: [async ({}, use) => use(new Map()), { scope: 'worker' }], // eslint-disable-line no-empty-pattern

  // The first login on a cold lab VM took >45 s in a live run (WF-V01 timed out in fixture setup), so this fixture has its own timeout.
  storageState: [async ({ browser, agentRole, sessionCache }, use, testInfo) => {
    if (!agentRole) return use(undefined);
    let file = sessionCache.get(agentRole);
    if (!file) {
      const user = env.users[agentRole];
      if (!user || !user.email) throw new Error(`No credentials configured for role "${agentRole}" - set AGENT_* in .env`);
      fs.mkdirSync(AUTH_DIR, { recursive: true });
      file = path.join(AUTH_DIR, `${agentRole}-w${testInfo.workerIndex}.json`);
      const ctx = await browser.newContext({ baseURL: env.baseUrl, storageState: { cookies: [], origins: [] } });
      const page = await ctx.newPage();
      const login = new LoginPage(page);
      await login.loginViaUi(user);
      await login.expectLoggedIn();
      await ctx.storageState({ path: file });
      await ctx.close();
      sessionCache.set(agentRole, file);
    }
    return use(file);
  }, { timeout: 180_000 }],

  pages: async ({ page }, use) => use(new PageManager(page)),

  /**
   * Automatic evidence collector (risk R39 / reported issue RI-20: "failures hard to debug").
   * Always records console errors and HTTP >= 500 responses; on failure - or for any test linked to a seeded
   * defect, pass OR fail - attaches a MASKED full-page screenshot and diagnostics.json to the HTML report.
   */
  diagnostics: [
    async ({ page }, use, testInfo) => {
      const consoleErrors = [];
      const serverErrors = [];
      page.on('console', (m) => m.type() === 'error' && consoleErrors.push({ text: m.text(), url: page.url() }));
      page.on('pageerror', (e) => consoleErrors.push({ text: String(e), url: page.url() }));
      page.on('response', (r) => r.status() >= 500 && serverErrors.push({ status: r.status(), url: r.url() }));
      await use();
      const failed = testInfo.status !== testInfo.expectedStatus;
      const seeded = testInfo.annotations.some((a) => a.type === 'defect');
      if (!failed && !seeded) return;
      if (!page.isClosed()) {
        const shot = await maskedScreenshot(page).catch(() => null);
        if (shot) await testInfo.attach(failed ? 'evidence-on-failure' : 'evidence-seeded-check', { body: shot, contentType: 'image/png' });
      }
      await testInfo.attach('diagnostics.json', {
        body: JSON.stringify({ url: page.isClosed() ? null : page.url(), consoleErrors, serverErrors }, null, 2),
        contentType: 'application/json',
      });
    },
    { auto: true },
  ],
});

/**
 * API PREFLIGHT. A live run and curl showed every /api call returning 404 on the lab's UI ports, which is an ENVIRONMENT problem
 * (the API is not at the configured base URL), not a product defect. The first API test of each worker probes GET products once;
 * if the API does not answer 200, API-dependent tests are skipped with that reason instead of reporting 11 misleading failures.
 * API_REQUIRED=true turns the skip into a failure.
 */
const apiPreflightFixtures = {
  apiStatus: [
    async ({ playwright }, use) => {
      const ctx = await playwright.request.newContext({ baseURL: env.apiBaseUrl, extraHTTPHeaders: { Accept: 'application/json', 'X-API-Key': env.apiKey } });
      let result;
      try {
        const res = await ctx.get(ep.products, { maxRedirects: 0, timeout: 15_000 });
        result = { ok: res.status() === 200, status: res.status() };
      } catch (e) {
        result = { ok: false, status: 'unreachable', error: String(e.message).split('\n')[0] };
      }
      await ctx.dispose();
      await use(result);
    },
    { scope: 'worker' },
  ],
  apiPreflight: [
    async ({ apiStatus }, use) => {
      if (!apiStatus.ok && !env.apiRequired) {
        base.test.skip(true, `ENVIRONMENT: the API does not answer at ${env.apiBaseUrl}products (HTTP ${apiStatus.status}). Run npm run discover:api / ask for the API address, then set INSURANCE_API_URL. See defect AD-11. (API_REQUIRED=true makes this a failure.)`);
      }
      await use();
    },
    { auto: true },
  ],
};

const apiTest = base.test.extend({
  ...apiPreflightFixtures,
  ...knownDefectFixtures,
  api: [
    async ({ playwright }, use) => {
      const client = await ApiClient.create(playwright, env.users.learnerAgent);
      await use(client);
      await client.dispose();
    },
    { scope: 'worker' },
  ],
  anonApi: async ({ playwright }, use) => {
    const client = await ApiClient.create(playwright, null);
    await use(client);
    await client.dispose();
  },
  apiAs: async ({ playwright }, use) => {
    const opened = [];
    await use(async (roleKey) => {
      const u = env.users[roleKey];
      base.test.skip(!u || !u.email, `No credentials for ${roleKey} - set AGENT_* in .env`);
      const c = await ApiClient.create(playwright, u);
      opened.push(c);
      return c;
    });
    await Promise.all(opened.map((c) => c.dispose()));
  },
});

/** Hybrid: UI page objects AND an authenticated API client in the same test (UI-API integration scenarios). */
const integrationTest = test.extend({
  ...apiPreflightFixtures,
  api: async ({ playwright }, use) => {
    const client = await ApiClient.create(playwright, env.users.learnerAgent);
    await use(client);
    await client.dispose();
  },
});

const unitTest = base.test.extend({ ...knownDefectFixtures });

/**
 * tc('AUTH-V01') -> [title, details] for  test(...tc('AUTH-V01'), async ({ pages }) => { ... }).
 *
 * Why it returns arguments instead of declaring the test itself: Playwright records the file/line of the test()
 * call and statically inspects the test function's destructured fixtures. Declaring the test here would make every
 * test appear to live in fixtures/index.js and hide the fixtures from Playwright.
 *
 * Title, tags, risk links and reported-issue (seeded defect) links all come from test-design/testCases.js.
 */
function tc(id) {
  const def = byId[id];
  if (!def) throw new Error(`tc(): "${id}" is not in test-design/testCases.js - add the test case design first`);
  const title = `${def.tcId} ${def.title} ${def.tags.join(' ')}`;
  const annotation = [
    { type: 'scenario', description: def.id },
    ...def.risks.map((r) => ({ type: 'risk', description: r })),
    ...def.defects.map((d) => ({ type: 'defect', description: d })),
  ];
  return [title, { annotation }];
}

module.exports = {
  test,
  apiTest,
  integrationTest,
  unitTest,
  expect: base.expect,
  tc,
  apiTc: tc,
  integrationTc: tc,
  unitTc: tc,
  env,
};
