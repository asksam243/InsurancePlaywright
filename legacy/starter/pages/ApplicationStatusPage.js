const routes = require('../utils/routes');

/** VERIFY the status badge and history-item testids against the live status page. */
class ApplicationStatusPage {
  constructor(page) {
    this.page = page;
    this.statusBadge = page.getByTestId('application-status');
    this.statusHistoryItems = page.getByTestId('status-history-item');
  }

  async goto(applicationId) {
    await this.page.goto(routes.status(applicationId));
  }

  async getStatusText() {
    return (await this.statusBadge.textContent())?.trim();
  }
}

module.exports = { ApplicationStatusPage };
