const routes = require('../utils/routes');

/** VERIFY testids and copy text against the live dashboard before relying on these. */
class DashboardPage {
  constructor(page) {
    this.page = page;
    this.newApplicationButton = page.getByRole('button', { name: /new application/i });
    this.draftCount = page.getByTestId('draft-applications-count');
    this.submittedCount = page.getByTestId('submitted-applications-count');
    this.emptyStateMessage = page.getByTestId('dashboard-empty-state');
    this.userGreeting = page.getByTestId('agent-greeting');

    this.statusFilter = (status) => page.getByTestId(`status-filter-${status.toLowerCase()}`);
    this.applicationRow = (applicationId) => page.getByTestId(`application-row-${applicationId}`);
    this.applicationRowStatus = (applicationId) =>
      page.getByTestId(`application-row-${applicationId}-status`);
    this.resumeDraftButton = (applicationId) =>
      page.getByTestId(`application-row-${applicationId}-resume`);
  }

  async goto() {
    await this.page.goto(routes.DASHBOARD);
  }

  async startNewApplication() {
    await this.newApplicationButton.click();
  }

  async filterByStatus(status) {
    await this.statusFilter(status).click();
  }

  async resumeDraft(applicationId) {
    await this.resumeDraftButton(applicationId).click();
  }
}

module.exports = { DashboardPage };
