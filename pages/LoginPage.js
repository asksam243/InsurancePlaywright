const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage');
const { S } = require('../config/selectors');
const routes = require('../config/routes');

class LoginPage extends BasePage {
  async goto() {
    await this.page.goto(routes.login);
    await expect(this.$(S.login.email)).toBeVisible();
  }

  async login(user) {
    await this.$(S.login.email).fill(user.email);
    await this.$(S.login.password).fill(user.password);
    await this.$(S.login.submit).click();
  }

  async loginViaUi(user) {
    await this.goto();
    await this.login(user);
  }

  async expectLoggedIn() {
    await expect(this.page).not.toHaveURL(/\/login\/?(\?.*)?$/);
    await expect(this.$(S.common.logout)).toBeVisible();
  }

  /** Still on the login page, with a message that matches the pattern, and no session. */
  async expectRejected(pattern) {
    await expect(this.page).toHaveURL(/\/login/);
    const err = this.$(S.login.error);
    await expect(err).toBeVisible();
    if (pattern) await expect(err).toHaveText(pattern);
  }

  async fillOtp(code) {
    await this.$(S.login.otpInput).fill(code);
    await this.$(S.login.otpSubmit).click();
  }

  async logout() {
    await this.$(S.common.logout).click();
    await expect(this.page).toHaveURL(/login/);
  }

  async openForgotPassword() {
    await this.$(S.login.forgotLink).click();
  }
}

module.exports = { LoginPage };
