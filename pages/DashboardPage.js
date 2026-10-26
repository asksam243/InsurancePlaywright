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

  /**
   * Dashboard -> Start New Application -> Create Draft -> client form. Returns the application id.
   * The real app has an intermediate "start" page with a Create Draft button (the missing step that stalled every UI flow
   * in the first smoke run); builds that go straight to the client form are tolerated.
   */
  async startNewApplication() {
    await this.newApplicationControl.click();
    const createDraft = this.$(S.dashboard.createDraft);
    const clientForm = this.$(S.client.firstName);
    await expect(createDraft.or(clientForm), 'the Create Draft page or the client form').toBeVisible();
    if (await createDraft.isVisible()) await createDraft.click();
    await this.page.waitForURL(/\/applications\/\d+\/client/);
    await expect(clientForm).toBeVisible();
    return applicationIdFromUrl(this.page.url());
  }

  get rows() {
    return this.$$(S.dashboard.rows);
  }

  rowFor(text) {
    return this.rows.filter({ hasText: text }).first();
  }

  /** Row for an application: matches the client name, the id as text, or the row's own "open" link (application-open-<id>). */
  rowForApplication({ name, id } = {}) {
    let rows = this.rows.filter({ hasText: name || '\u0000never' });
    if (id) {
      rows = rows
        .or(this.rows.filter({ hasText: String(id) }))
        .or(this.rows.filter({ has: this.page.getByTestId(`${S.dashboard.openPrefix}${id}`) }));
    }
    return rows.first();
  }

  /** Application id from the row's open link (application-open-<id>), its own testid, or its first link href; or null. */
  async rowId(row) {
    const open = row.locator(`[data-testid^="${S.dashboard.openPrefix}"]`).first();
    if (await open.count()) {
      const tid = await open.getAttribute('data-testid');
      return tid.slice(S.dashboard.openPrefix.length);
    }
    const own = await row.getAttribute('data-testid');
    if (own && own.startsWith(S.dashboard.rowPrefix)) return own.slice(S.dashboard.rowPrefix.length);
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

  /** Opens an application row (resume a draft). */
  async resume(row) {
    const open = row.locator(`[data-testid^="${S.dashboard.openPrefix}"]`).first();
    if (await open.count()) {
      await open.click();
      return;
    }
    const link = row.locator('a, button').filter({ hasText: /resume|continue|open|edit/i }).first();
    if (await link.count()) await link.click();
    else await row.click();
  }

  async logout() {
    await this.$(S.common.logout).click();
  }
}

module.exports = { DashboardPage, applicationIdFromUrl };
