const { defineConfig, devices } = require('@playwright/test');
const env = require('./config/env');

/**
 * Projects
 *   unit         offline framework self-checks (no browser, no application)         npm run test:unit
 *   chromium     UI + E2E + UI<->API integration tests (primary browser)             npm run test:ui
 *   api          API tests using Playwright's request context (no browser)           npm run test:api
 *   firefox/webkit-smoke   only when CROSS_BROWSER=true: @smoke subset cross-browser
 *
 * Session handling is done by a worker-scoped fixture (fixtures/index.js), NOT by setup projects, so --grep / --project
 * filters never accidentally skip authentication.
 */
const launchOptions = env.chromiumExecutablePath ? { executablePath: env.chromiumExecutablePath } : {};
const uiMatch = ['ui/**/*.spec.js', 'e2e/**/*.spec.js', 'integration/**/*.spec.js'];

const projects = [
  { name: 'unit', testMatch: 'unit/**/*.spec.js' },
  {
    name: 'chromium',
    testMatch: uiMatch,
    use: { ...devices['Desktop Chrome'], channel: env.browserChannel, launchOptions },
  },
  { name: 'api', testMatch: 'api/**/*.spec.js' },
];

if (env.crossBrowser) {
  projects.push(
    { name: 'firefox-smoke', testMatch: uiMatch, grep: /@smoke/, use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit-smoke', testMatch: uiMatch, grep: /@smoke/, use: { ...devices['Desktop Safari'] } },
  );
}

module.exports = defineConfig({
  testDir: './tests',
  outputDir: 'reports/test-results',
  timeout: 45_000,
  expect: { timeout: 8_000 },
  // Shared lab environment: sequential by default (WORKERS=1). Parallel runs add load and shared-data collisions;
  // raise WORKERS only after the single-worker baseline is stable. Retries stay low so a flaky test is seen, not hidden.
  fullyParallel: env.workers > 1,
  forbidOnly: env.isCI,
  retries: env.isCI ? 1 : 0,
  workers: env.workers,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports/html-report', open: 'never' }],
    ['json', { outputFile: 'reports/results.json' }],
    ['junit', { outputFile: 'reports/junit.xml' }],
  ],

  use: {
    baseURL: env.baseUrl,
    // Evidence policy (see README "Sensitive data in evidence"): Playwright's built-in screenshot cannot mask fields, so it is
    // OFF; the `diagnostics` fixture attaches a MASKED full-page screenshot on failure and for seeded-defect checks instead.
    // Trace and video cannot be masked, so tests tagged @sensitive (SSN / KYC / income) switch them off per file.
    screenshot: 'off',
    video: 'retain-on-failure',
    trace: env.isCI ? 'on-first-retry' : 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },

  projects,
});
