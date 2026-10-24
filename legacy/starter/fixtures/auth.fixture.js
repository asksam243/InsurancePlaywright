const base = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { DashboardPage } = require('../pages/DashboardPage');
const users = require('./users');
const { extractApplicationId } = require('../utils/testHelpers');

/**
 * CONFIRMED (BR-AUTH-010, from real patch notes — not an assumption):
 * - Agents do NOT land on /dashboard after login. They land on the Client
 *   Information page of a draft application: an existing draft is resumed if
 *   one exists, otherwise a brand-new draft is auto-created on the spot.
 * - Only admin users land on /dashboard.
 * This fixture was originally written assuming agents land on /dashboard like
 * admins do — that assumption was wrong and is corrected here.
 *
 * ISOLATION RISK this creates: because login itself resumes-or-creates a
 * draft, every test run against the same agent account shares that account's
 * one running draft. Two tests (or two parallel workers, or another learner
 * on a shared lab) logging in as the same agent back-to-back will collide on
 * the same application. agentPage therefore takes an optional account
 * override, and newApplicationId defaults to a learner account rather than
 * agent.valid for exactly this reason — 30 learner accounts exist
 * specifically so each test/worker can get its own isolated draft.
 */
const test = base.test.extend({
  /**
   * Logs in as a given account (default: agent.valid) and returns the
   * authenticated page. For admin, this correctly lands on /dashboard; for
   * any agent account, it lands on /applications/:id/client — do not assert
   * /dashboard here for agent logins, that was the pre-correction bug.
   */
  agentPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(users.validAgent.email, users.validAgent.password);
    // CONFIRMED: agents land on their draft's Client Information page, not /dashboard.
    await base.expect(page).toHaveURL(/\/applications\/[^/]+\/client/);
    await use(page);
  },

  /** Separate fixture for the one case that DOES land on /dashboard: admin. */
  adminPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(users.adminUser.email, users.adminUser.password);
    await base.expect(page).toHaveURL(/\/dashboard/);
    await use(page);
  },

  dashboardPage: async ({ agentPage }, use) => {
    await use(new DashboardPage(agentPage));
  },

  /**
   * Hands back an application id for module-level tests (client info, riders,
   * beneficiaries, etc.) WITHOUT needing a dashboard "New Application" click —
   * login itself already resumes-or-creates the draft and redirects there.
   *
   * Uses a dedicated learner account (not agent.valid) specifically to avoid
   * the shared-draft collision described above. Pass a worker-unique index in
   * CI (e.g. via TEST_PARALLEL_INDEX) if running multiple workers so each one
   * gets a distinct learner account; defaults to learner001 otherwise.
   *
   * STILL VERIFY: that a fresh learner account's auto-created draft truly
   * starts blank (no prior test's data lingering) — if these accounts are
   * ever reused run-over-run without a reset, the same collision risk
   * reappears one level up. A full `php artisan demo:reset` between graded
   * runs is the real fix; this fixture can't do that itself.
   */
  newApplicationId: async ({ page }, use) => {
    const workerIndex = Number(process.env.TEST_PARALLEL_INDEX || 0) + 1;
    const learner = users.learnerAccount(workerIndex);

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(learner.email, learner.password);
    await base.expect(page).toHaveURL(/\/applications\/[^/]+\/client/);

    const applicationId = extractApplicationId(page.url());
    await use(applicationId);
  },
});

module.exports = { test, expect: base.expect };
