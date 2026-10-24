#!/usr/bin/env node
/**
 * Exploration helper (README step 0). Signs in as the valid agent, visits pages and writes everything addressable to
 * discovery/testids.json: data-testid values, form labels, buttons, headings, and the URL and wording of any validation text.
 *
 *   npm run discover                          # /login, /dashboard, and the first step of a new application
 *   DISCOVER_PATHS=/dashboard,/forgot-password npm run discover
 *   npm run discover -- --walk                # also presses Next (without data) on each step to record validation messages
 * Then:  npm run verify:selectors
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');
const env = require('../config/env');
const { S } = require('../config/selectors');
const { loc } = require('../utils/locators');

async function snapshot(page, label) {
  return page.evaluate((lbl) => ({
    label: lbl,
    url: location.pathname,
    title: (document.querySelector('main h1, main h2, h1') || {}).textContent?.trim() || '',
    testIds: [...new Set([...document.querySelectorAll('[data-testid]')].map((e) => e.getAttribute('data-testid')))],
    labels: [...document.querySelectorAll('label')].map((l) => l.textContent.trim()).filter(Boolean),
    buttons: [...document.querySelectorAll('button, [role=button], a.btn')].map((b) => b.textContent.trim()).filter(Boolean),
    messages: [...document.querySelectorAll('.field-error, .invalid-feedback, .alert, [role=alert], .text-danger')].map((e) => e.textContent.trim()).filter(Boolean),
  }), label);
}

(async () => {
  const browser = await chromium.launch({ executablePath: env.chromiumExecutablePath, channel: env.browserChannel });
  const page = await (await browser.newContext({ baseURL: env.baseUrl })).newPage();
  const pages = [];
  await page.goto('/login');
  pages.push(await snapshot(page, 'login'));
  await loc(page, S.login.email).first().fill(env.users.validAgent.email);
  await loc(page, S.login.password).first().fill(env.users.validAgent.password);
  await loc(page, S.login.submit).first().click();
  await page.waitForLoadState('networkidle');
  for (const p of (process.env.DISCOVER_PATHS || '/dashboard').split(',')) {
    await page.goto(p.trim());
    pages.push(await snapshot(page, p.trim()));
  }
  await page.goto('/dashboard');
  const newApp = loc(page, S.dashboard.newApplication).or(loc(page, S.dashboard.newApplicationBtn)).first();
  if (await newApp.count()) {
    await newApp.click();
    await page.waitForLoadState('networkidle');
    pages.push(await snapshot(page, 'new application - first step'));
    if (process.argv.includes('--walk')) {
      for (let i = 0; i < 9; i += 1) {
        await loc(page, S.common.next).first().click().catch(() => {});
        await page.waitForTimeout(800); // exploration only: let validation text render
        pages.push(await snapshot(page, `after Next with empty data #${i + 1}`));
      }
    }
  }
  fs.mkdirSync(path.join(__dirname, '..', 'discovery'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, '..', 'discovery', 'testids.json'), JSON.stringify({ baseUrl: env.baseUrl, pages }, null, 2));
  for (const p of pages) console.log(`${p.label.padEnd(34)} ${p.url.padEnd(32)} testids:${p.testIds.length} labels:${p.labels.length} messages:${p.messages.length}`);
  console.log('written discovery/testids.json  ->  now run: npm run verify:selectors');
  await browser.close();
})().catch((e) => { console.error(e.message); process.exit(1); });
