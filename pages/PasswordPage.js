const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage');
const { S } = require('../config/selectors');
const routes = require('../config/routes');

/** Forgot-password -> OTP -> new-password flow (AUTH-V08, V11, V12, V13). */
class PasswordPage extends BasePage {
  async goto() {
    await this.page.goto(routes.forgotPassword);
    await expect(this.$(S.password.email)).toBeVisible();
  }

  async requestReset(email) {
    await this.$(S.password.email).fill(email);
    await this.$(S.password.requestSubmit).click();
  }

  async submitOtp(code) {
    await this.$(S.password.otp).fill(code);
    await this.$(S.password.otpSubmit).click();
  }

  async setNewPassword(password) {
    await this.$(S.password.newPassword).fill(password);
    await this.$(S.password.confirmPassword).fill(password);
    await this.$(S.password.resetSubmit).click();
  }

  get message() {
    return this.$(S.password.message);
  }
}

module.exports = { PasswordPage };
