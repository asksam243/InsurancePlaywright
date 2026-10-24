const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage');
const { S } = require('../config/selectors');
const { loc } = require('../utils/locators');
const routes = require('../config/routes');

/** Extracts the application id from URLs like /applications/123/client or /application/ABC-1/edit. */
function applicationIdFromUrl(url) {
  const m = new URL(url).pathname.match(/applications?\/(?!new\b|create\b)([A-Za-z0-9_-]+)/i);
  return m ? m[1] : null;
}

class DashboardPage extends BasePage {
  async goto() {
    await this.page.goto(routes.dashboard);
    await this.expectLoaded();
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL(/dashboard/);
    await expect(this.newApplicationControl).toBeVisible();
  }

  get newApplicationControl() {
    return loc(this.page, S.dashboard.newApplication).or(loc(this.page, S.dashboard.newApplicationBtn)).first();
  }

  /** Starts a new application and returns its id (parsed from the URL, or null if the URL has none). */
  async startNewApplication() {
    await this.newApplicationControl.click();
    await expect(this.$(S.client.firstName)).toBeVisible();
    return applicationIdFromUrl(this.page.url());
  }

  get rows() {
    return this.$$(S.dashboard.rows);
  }

  rowFor(text) {
    return this.rows.filter({ hasText: text }).first();
  }

  /** Row for an application: matches the client name (unique per test) or, failing that, the application id. */
  rowForApplication({ name, id } = {}) {
    let rows = this.rows.filter({ hasText: name || '\u0000never' });
    if (id) rows = rows.or(this.rows.filter({ hasText: String(id) }));
    return rows.first();
  }

  /** Application id from a row's data-testid (application-row-<id>) or its first link href, or null. */
  async rowId(row) {
    const tid = await row.getAttribute('data-testid');
    if (tid && tid.startsWith(S.dashboard.rowPrefix)) return tid.slice(S.dashboard.rowPrefix.length);
    const href = await row.locator('a').first().getAttribute('href').catch(() => null);
    const m = href && href.match(/applications?\/([A-Za-z0-9_-]+)/i);
    return m ? m[1] : null;
  }

  statusOf(row) {
    return row.locator(S.dashboard.statusCell.css).first();
  }

  /** Lower-cased status text of every visible row. */
  async statuses() {
    const n = await this.rows.count();
    const out = [];
    for (let i = 0; i < n; i += 1) {
      out.push(((await this.statusOf(this.rows.nth(i)).textContent()) || '').trim().toLowerCase());
    }
    return out;
  }

  async filterByStatus(status) {
    await this.choose(S.dashboard.statusFilter, status);
    await this.page.waitForLoadState('networkidle');
  }

  async search(text) {
    await this.$(S.dashboard.search).fill(text);
    await this.$(S.dashboard.search).press('Enter');
    await this.page.waitForLoadState('networkidle');
  }

  /** Opens a draft row (resume). */
  async resume(row) {
    const link = row.locator('a, button').filter({ hasText: /resume|continue|open|edit/i }).first();
    if (await link.count()) await link.click();
    else await row.click();
  }

  async logout() {
    await this.$(S.common.logout).click();
  }
}

module.exports = { DashboardPage, applicationIdFromUrl };
