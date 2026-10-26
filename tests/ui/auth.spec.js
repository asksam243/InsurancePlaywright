const { test, tc, expect, env } = require('../../fixtures');
const M = require('../../config/messages');
const routes = require('../../config/routes');
const { S } = require('../../config/selectors');

const { validAgent, lockedAgent, invalidAgent, lockoutAgent, resetAgent, mfaAgent, adminUser } = env.users;
const otp = env.otpCode;
const wrongOtp = otp === '111111' ? '222222' : '111111';

// No agentRole here: every test starts with a clean, anonymous browser context.
test.describe('Authentication & Session', () => {
  test(...tc('AUTH-V01'), async ({ page, pages }) => {
    await pages.login.loginViaUi(validAgent);
    await pages.login.expectLoggedIn();
    // BR-AUTH-010 (confirmed): an agent lands on their draft's Client Information page; only admin lands on /dashboard.
    await expect(page).toHaveURL(/\/applications\/[^/]+\/client/);
  });

  test(...tc('AUTH-V14'), async ({ page, pages }) => {
    await pages.login.loginViaUi(adminUser);
    await pages.login.expectLoggedIn();
    // BR-AUTH-010 (confirmed): admin is the one role that lands on /dashboard.
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test(...tc('AUTH-V02'), async ({ page, pages }) => {
    // A wrong password counts towards the 5-attempt lock (BR-AUTH-005), so it must never be tried on agent.valid, which every
    // other test needs. A spare seeded account (secondAgent, default learner002) takes the failed attempt instead.
    await pages.login.loginViaUi({ email: env.users.secondAgent.email, password: invalidAgent.password });
    await pages.login.expectRejected(M.invalidCredentials);
    await page.goto(routes.dashboard);
    await expect(page).toHaveURL(/\/login/);
  });

  test(...tc('AUTH-V03'), async ({ page, pages }) => {
    await pages.login.goto();
    await pages.login.$(S.login.submit).click();
    await expect(page).toHaveURL(/\/login/);
    for (const [name, def] of [['email', S.login.email], ['password', S.login.password]]) {
      const browserFlagged = await pages.login.$(def).evaluate((el) => !el.validity.valid);
      const inlineFlagged = (await pages.login.$$(S.common.anyError).filter({ hasText: M.required }).count()) > 0;
      expect(browserFlagged || inlineFlagged, `empty ${name} should be flagged as required`).toBeTruthy();
    }
  });

  test(...tc('AUTH-V04'), async ({ page, pages }) => {
    await pages.login.loginViaUi(validAgent);
    await pages.login.expectLoggedIn();
    await pages.login.logout();
    await page.goto(routes.dashboard);
    await expect(page).toHaveURL(/\/login/);
  });

  test(...tc('AUTH-V05'), async ({ page }) => {
    await page.goto(routes.dashboard);
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByTestId(S.common.logout.id)).toHaveCount(0);
  });

  test(...tc('AUTH-V06'), async ({ page, pages }) => {
    await pages.login.loginViaUi(lockedAgent);
    await pages.login.expectRejected(M.accountLocked);
    await page.goto(routes.dashboard);
    await expect(page).toHaveURL(/\/login/);
  });

  test(...tc('AUTH-V11'), async ({ page, pages }) => {
    await pages.login.goto();
    await pages.login.openForgotPassword();
    await expect(page).toHaveURL(/forgot/);
    await pages.password.requestReset(validAgent.email);
    await expect(pages.password.message.or(pages.password.$(S.password.otp)).first()).toBeVisible();
  });

  test.describe('lockout (destructive)', () => {
    test.skip(!lockoutAgent.email, 'Set AGENT_LOCKOUT_EMAIL (a DISPOSABLE agent) to run the lockout test');

    test(...tc('AUTH-V07'), async ({ pages }) => {
      const wrong = { email: lockoutAgent.email, password: invalidAgent.password };
      const limit = env.rules.lockoutAttempts;
      for (let attempt = 1; attempt < limit; attempt += 1) {
        await test.step(`failed attempt ${attempt} of ${limit - 1}: still "invalid credentials", not locked`, async () => {
          await pages.login.loginViaUi(wrong);
          await pages.login.expectRejected(M.invalidCredentials);
          await expect(pages.login.$(S.login.error)).not.toHaveText(M.accountLocked);
        });
      }
      // Q07: the documents say the account "locks after five failed attempts" but not whether the 5th failure itself already
      // shows the lock message, nor whether a WRONG password on a locked account reveals the lock. So: attempt N may show either
      // message, and the decisive check is the CORRECT password afterwards - a locked account must refuse it with the lock message.
      await test.step(`attempt ${limit}: invalid-credentials or account-locked`, async () => {
        await pages.login.loginViaUi(wrong);
        await pages.login.expectRejected(new RegExp(`${M.invalidCredentials.source}|${M.accountLocked.source}`, 'i'));
      });
      await test.step('the CORRECT password is now refused with the account-locked message', async () => {
        await pages.login.loginViaUi(lockoutAgent);
        await pages.login.expectRejected(M.accountLocked);
      });
    });
  });

  test.describe('password reset / OTP', () => {
    test.skip(!resetAgent.email || !otp, 'Set AGENT_RESET_EMAIL (DISPOSABLE) and OTP_CODE to run the reset/OTP tests');

    const reachNewPasswordStep = async (pages) => {
      await pages.password.goto();
      await pages.password.requestReset(resetAgent.email);
      await pages.password.submitOtp(otp);
      await expect(pages.password.$(S.password.newPassword)).toBeVisible();
    };

    test(...tc('AUTH-V08'), async ({ page, pages }) => {
      await reachNewPasswordStep(pages);
      for (const pw of ['abc1', 'password', 'PASSWORD123', 'alllowercase1', '12345678']) {
        await test.step(`weak password "${pw}" is rejected`, async () => {
          await pages.password.setNewPassword(pw);
          await expect(pages.password.message).toHaveText(M.passwordPolicy);
          await expect(page).not.toHaveURL(/\/login/);
        });
      }
    });

    test(...tc('AUTH-V12'), async ({ pages }) => {
      await pages.password.goto();
      await pages.password.requestReset(resetAgent.email);
      await test.step('wrong OTP is rejected and does not advance', async () => {
        await pages.password.submitOtp(wrongOtp);
        await expect(pages.password.message).toHaveText(M.otpInvalid);
        await expect(pages.password.$(S.password.newPassword)).toBeHidden();
      });
      await test.step('correct OTP reaches the new-password step', async () => {
        await pages.password.submitOtp(otp);
        await expect(pages.password.$(S.password.newPassword)).toBeVisible();
      });
    });

    test(...tc('AUTH-V13'), async ({ page, pages }) => {
      await reachNewPasswordStep(pages);
      await pages.password.setNewPassword(resetAgent.password); // identical to the current password
      await expect(pages.password.message).toHaveText(M.passwordReuse);
      await expect(page).not.toHaveURL(/\/login/);
    });
  });

  test.describe('MFA', () => {
    test.skip(!mfaAgent.email || !otp, 'Set AGENT_MFA_EMAIL and OTP_CODE to run the MFA test');

    test(...tc('AUTH-V09'), async ({ pages }) => {
      await pages.login.loginViaUi(mfaAgent);
      await expect(pages.login.$(S.login.otpInput)).toBeVisible();
      await pages.login.fillOtp(wrongOtp);
      await expect(pages.login.$$(S.common.anyError).filter({ hasText: M.otpInvalid }).first()).toBeVisible();
      await pages.login.fillOtp(otp);
      await pages.login.expectLoggedIn();
    });
  });

  test.describe('session timeout', () => {
    test.skip(!env.rules.sessionTimeoutSeconds, 'Set SESSION_TIMEOUT_SECONDS (short, test env only) to run the timeout test');

    test(...tc('AUTH-V10'), async ({ page, pages }) => {
      const seconds = env.rules.sessionTimeoutSeconds;
      test.setTimeout((seconds + 60) * 1000);
      await pages.login.loginViaUi(validAgent);
      await pages.login.expectLoggedIn();
      // A real idle period IS the behaviour under test (polling the app would count as activity and extend the session).
      await page.waitForTimeout((seconds + 2) * 1000);
      await page.goto(routes.dashboard);
      await expect(page).toHaveURL(/\/login/);
    });
  });
});
