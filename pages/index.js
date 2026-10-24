const { LoginPage } = require('./LoginPage');
const { PasswordPage } = require('./PasswordPage');
const { DashboardPage } = require('./DashboardPage');
const { ClientInfoPage } = require('./ClientInfoPage');
const { AddressContactPage } = require('./AddressContactPage');
const { KycFinancialPage } = require('./KycFinancialPage');
const { ProductPage } = require('./ProductPage');
const { RiderPage } = require('./RiderPage');
const { BeneficiaryPage } = require('./BeneficiaryPage');
const { DocumentsPage } = require('./DocumentsPage');
const { ReviewSubmitPage } = require('./ReviewSubmitPage');

/** One handle to every page object for a Playwright page (exposed to tests as the `pages` fixture). */
class PageManager {
  constructor(page) {
    this.page = page;
    this.login = new LoginPage(page);
    this.password = new PasswordPage(page);
    this.dashboard = new DashboardPage(page);
    this.client = new ClientInfoPage(page);
    this.address = new AddressContactPage(page);
    this.kyc = new KycFinancialPage(page);
    this.product = new ProductPage(page);
    this.rider = new RiderPage(page);
    this.beneficiary = new BeneficiaryPage(page);
    this.documents = new DocumentsPage(page);
    this.review = new ReviewSubmitPage(page);
  }
}

module.exports = { PageManager };
