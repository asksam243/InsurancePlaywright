const routes = require('../utils/routes');

/**
 * VERIFY: exact testids for dynamic beneficiary rows/cards, the allocation
 * total element, and duplicate/guardian error copy against the live app.
 * Beneficiary rows are assumed to be indexed (0-based) in DOM order.
 *
 * ADDED based on confirmed real patch notes (BR-BEN-007 and later patches),
 * which this page object originally had no model for at all:
 * - A Beneficiary Designation field: Revocable or Irrevocable, per beneficiary.
 * - Irrevocable selection triggers a legal confirmation dialog that must be
 *   acknowledged before the application can be submitted.
 * - Only Revocable beneficiaries can be removed; Irrevocable ones show a
 *   "Locked" display instead of a Remove control — removeButton/removeBeneficiary
 *   below will not work on an irrevocable row, by design, not by bug.
 * - An "Estate Assignment" fallback message appears when no beneficiary is
 *   named at all — not currently exercised by any in-scope test, but worth
 *   adding to the next cycle given it's a real, confirmed behavior.
 */
class BeneficiaryPage {
  constructor(page) {
    this.page = page;
    this.addBeneficiaryButton = page.getByRole('button', { name: /add beneficiary/i });
    this.allocationTotal = page.getByTestId('allocation-total');
    this.secondaryAllocationTotal = page.getByTestId('secondary-allocation-total');

    this.beneficiaryRow = (index) => page.getByTestId(`beneficiary-row-${index}`);
    this.firstNameInput = (index) => page.getByTestId(`beneficiary-${index}-first-name`);
    this.lastNameInput = (index) => page.getByTestId(`beneficiary-${index}-last-name`);
    this.relationshipSelect = (index) => page.getByTestId(`beneficiary-${index}-relationship`);
    this.allocationInput = (index) => page.getByTestId(`beneficiary-${index}-allocation`);
    this.typeSelect = (index) => page.getByTestId(`beneficiary-${index}-type`);
    this.dobInput = (index) => page.getByTestId(`beneficiary-${index}-dob`);
    this.guardianNameInput = (index) => page.getByTestId(`beneficiary-${index}-guardian-name`);
    this.removeButton = (index) => page.getByTestId(`beneficiary-${index}-remove`);
    this.lockedIndicator = (index) => page.getByTestId(`beneficiary-${index}-locked`);

    // CONFIRMED NEW: designation field + irrevocable legal confirmation dialog.
    this.designationSelect = (index) => page.getByTestId(`beneficiary-${index}-designation`);
    this.irrevocableConfirmDialog = page.getByTestId('irrevocable-confirmation-dialog');
    this.irrevocableConfirmCheckbox = page.getByTestId('irrevocable-confirmation-checkbox');
    this.irrevocableConfirmButton = page.getByRole('button', { name: /confirm/i });

    this.trustNameInput = (index) => page.getByTestId(`beneficiary-${index}-trust-name`);
    this.trusteeNameInput = (index) => page.getByTestId(`beneficiary-${index}-trustee-name`);
    this.trustDateInput = (index) => page.getByTestId(`beneficiary-${index}-trust-date`);
    this.trusteeContactInput = (index) => page.getByTestId(`beneficiary-${index}-trustee-contact`);
    this.orgNameInput = (index) => page.getByTestId(`beneficiary-${index}-org-name`);
    this.orgRegistrationInput = (index) =>
      page.getByTestId(`beneficiary-${index}-registration-number`);
    this.orgContactInput = (index) => page.getByTestId(`beneficiary-${index}-org-contact`);

    this.allocationError = page.getByTestId('allocation-error');
    this.duplicateError = page.getByTestId('duplicate-beneficiary-error');
    this.guardianRequiredError = page.getByTestId('guardian-name-error');
    this.estateAssignmentMessage = page.getByTestId('estate-assignment-message');

    this.nextButton = page.getByRole('button', { name: /next|continue/i });
  }

  async goto(applicationId) {
    await this.page.goto(routes.beneficiaries(applicationId));
  }

  async addAndFill(index, beneficiary) {
    await this.addBeneficiaryButton.click();
    await this.firstNameInput(index).fill(beneficiary.firstName);
    await this.lastNameInput(index).fill(beneficiary.lastName);
    await this.relationshipSelect(index).selectOption(beneficiary.relationship);
    await this.typeSelect(index).selectOption(beneficiary.type);
    await this.dobInput(index).fill(beneficiary.dateOfBirth);
    await this.allocationInput(index).fill(String(beneficiary.allocationPercent));

    if (beneficiary.designation) {
      await this.setDesignation(index, beneficiary.designation);
    }
    if (beneficiary.guardianName) {
      await this.guardianNameInput(index).fill(beneficiary.guardianName);
    }
    if (beneficiary.trustName) {
      await this.trustNameInput(index).fill(beneficiary.trustName);
      await this.trusteeNameInput(index).fill(beneficiary.trusteeName);
    }
    if (beneficiary.registrationNumber) {
      await this.orgRegistrationInput(index).fill(beneficiary.registrationNumber);
    }
  }

  /**
   * Sets a beneficiary's designation. Selecting "Irrevocable" surfaces a
   * legal confirmation dialog that must be acknowledged before it takes
   * effect — this handles that dialog inline so callers don't need to know
   * about it unless they're specifically testing the dialog itself.
   */
  async setDesignation(index, designation) {
    await this.designationSelect(index).selectOption(designation);
    if (/irrevocable/i.test(designation)) {
      await this.irrevocableConfirmDialog.waitFor({ state: 'visible' });
      await this.irrevocableConfirmCheckbox.check();
      await this.irrevocableConfirmButton.click();
      await this.irrevocableConfirmDialog.waitFor({ state: 'hidden' });
    }
  }

  async addMultiple(beneficiaries) {
    for (let i = 0; i < beneficiaries.length; i++) {
      await this.addAndFill(i, beneficiaries[i]);
    }
  }

  /** Only works on Revocable rows — Irrevocable rows show lockedIndicator instead. */
  async removeBeneficiary(index) {
    await this.removeButton(index).click();
  }

  async next() {
    await this.nextButton.click();
  }
}

module.exports = { BeneficiaryPage };
