const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/LoginPage');
const users = require('../../fixtures/users');
const { repeatInvalidLogin } = require('../../utils/testHelpers');

/**
 * CONFIRMED (BR-AUTH-010): agents land on their draft application's Client
 * Information page after login (an existing draft is resumed, or a new one
 * is auto-created) — NOT /dashboard. Only admin users land on /dashboard.
 * Every assertion below was corrected from an earlier, wrong /dashboard
 * assumption to match this.
 *
 * Also CONFIRMED: DEF-AUTH-001, if active for this cohort, makes a locked
 * user see a generic "Invalid credentials." message instead of the expected
 * locked-account message — AUTH-V06 below will fail through no fault of the
 * test if that seeded defect is toggled on. Check which defects are active
 * (SELECT defect_code FROM seeded_defects WHERE is_active = 1) before
 * treating an AUTH-V06 failure as a framework bug.
 */
test.describe('Insurance Order Entry — Authentication', () => {
  test('AUTH-V01: valid agent can log in successfully @smoke @auth @regression', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(users.validAgent.email, users.validAgent.password);

    // CONFIRMED: agent login lands on the draft's Client Information page.
    await expect(page).toHaveURL(/\/applications\/[^/]+\/client/);
  });

  test('AUTH-V01b: admin can log in and lands on the dashboard @smoke @auth @regression', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(users.adminUser.email, users.adminUser.password);

    // CONFIRMED: admin is the one role that DOES land on /dashboard.
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('AUTH-V02: invalid password displays correct error message @auth @regression', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(users.validAgent.email, 'WrongPassword123!');

    await expect(loginPage.generalError).toBeVisible();
  });

  test('AUTH-V03: blank username and password show mandatory validation @auth @regression', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.submitEmptyForm();

    await expect(loginPage.emailFieldError).toBeVisible();
    await expect(loginPage.passwordFieldError).toBeVisible();
  });

  test('AUTH-V04: logout clears session and redirects to login page @smoke @auth @regression', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(users.validAgent.email, users.validAgent.password);
    await expect(page).toHaveURL(/\/applications\/[^/]+\/client/);

    await loginPage.logout();
    await expect(page).toHaveURL(/\/login/);

    // Protected route should now redirect back to login (ties into AUTH-V05).
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('AUTH-V05: direct access to dashboard without login is blocked @smoke @auth @regression', async ({ browser }) => {
    // Fresh, unauthenticated context — no cookies/session carried over.
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);

    await context.close();
  });

  test('AUTH-V06: locked user cannot access the application @auth @regression', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(users.lockedAgent.email, users.lockedAgent.password);

    // NOTE: if DEF-AUTH-001 is active for this cohort, the app shows a generic
    // "Invalid credentials." message instead — see the class-level comment above.
    await expect(loginPage.accountLockedMessage).toBeVisible();
    await expect(page).not.toHaveURL(/\/applications\/[^/]+\/client/);
    await expect(page).not.toHaveURL(/\/dashboard/);
  });

  // Included for completeness though outside the reduced 30-35 core count —
  // exercises the same lockout-after-5-attempts rule as AUTH-V07 in the spec.
  // CONFIRMED mechanics (BR-AUTH-005): locks after 5 consecutive failed
  // attempts, DEMO_LOCKOUT_MINUTES (default 30) before auto-unlock. A 30-minute
  // real-time lock is impractical inside a CI run — this needs either a
  // disposable throwaway account per execution, or admin-side DB reset of
  // locked_until, neither of which this test currently does. Left skipped
  // until one of those is decided, rather than run against a seeded user and
  // leave it locked for the next 30 minutes of the suite.
  test.skip('AUTH-V07: account locks after five failed login attempts @auth @regression', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await repeatInvalidLogin(loginPage, users.validAgent.email, 'WrongPassword123!', 5);

    await expect(loginPage.accountLockedMessage).toBeVisible();
  });
});
