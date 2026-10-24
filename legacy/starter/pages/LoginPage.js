const routes = require('../utils/routes');

/**
 * CONFIRMED via real page source (login-password-input, login-submit-button
 * testids, and the actual rendered page): email/password inputs use
 * -input suffix testids and the submit button uses -button, matching the
 * same naming convention already confirmed on the FinServe project. The
 * submit button's visible text is "Login" (one word) — the original
 * getByRole regex /log in|sign in/i would NOT have matched this; switched to
 * the confirmed testid directly rather than relying on button text at all.
 *
 * Still VERIFY: error-message testids, locked-account message, MFA elements —
 * none of these were visible in the screenshot/HTML snippet confirmed so far.
 */
class LoginPage {
  constructor(page) {
    this.page = page;
    this.emailInput = page.getByTestId('login-email-input');
    this.passwordInput = page.getByTestId('login-password-input');
    this.loginButton = page.getByTestId('login-submit-button');
    this.forgotPasswordLink = page.getByRole('link', { name: /forgot password/i });
    this.registerLink = page.getByRole('link', { name: /register here/i });

    this.generalError = page.getByTestId('login-error-message');
    this.emailFieldError = page.getByTestId('email-error');
    this.passwordFieldError = page.getByTestId('password-error');
    this.accountLockedMessage = page.getByTestId('account-locked-message');
    this.mfaCodeInput = page.getByLabel(/verification code|otp/i);
    this.mfaSubmitButton = page.getByRole('button', { name: /verify/i });
  }

  async goto() {
    await this.page.goto(routes.LOGIN);
  }

  async login(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async submitEmptyForm() {
    await this.emailInput.fill('');
    await this.passwordInput.fill('');
    await this.loginButton.click();
  }

  async logout() {
    await this.page.getByRole('button', { name: /logout|log out/i }).click();
  }

  async submitMfaCode(code) {
    await this.mfaCodeInput.fill(code);
    await this.mfaSubmitButton.click();
  }
}

module.exports = { LoginPage };
