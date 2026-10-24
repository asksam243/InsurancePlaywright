require('dotenv').config();
const { defineConfig, devices } = require('@playwright/test');

/**
 * Base URL and API base URL are environment-driven per automation best
 * practices in the framework pack (Section 4.6) — never hardcode.
 * Copy .env.example to .env and fill in real values for your cohort's
 * hosted lab environment before running.
 */
const BASE_URL = process.env.BASE_URL || 'http://localhost:8081';

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30 * 1000,
  expect: { timeout: 8 * 1000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,

  // Reporting artifacts — HTML report, JSON, and JUnit for CI/CD ingestion.
  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports/html-report', open: 'never' }],
    ['json', { outputFile: 'reports/results.json' }],
    ['junit', { outputFile: 'reports/junit-results.xml' }],
  ],

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10 * 1000,
    navigationTimeout: 15 * 1000,
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },

    // API-only project: no browser needed, faster CI feedback for API-V01..V08.
    {
      name: 'api',
      testDir: './tests/api',
      use: {
        baseURL: process.env.API_BASE_URL || BASE_URL,
      },
    },
  ],

  outputDir: 'test-results/',
});
