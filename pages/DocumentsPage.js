const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage');
const { S } = require('../config/selectors');
const { ValidationSummary } = require('../components/ValidationSummary');

/** Step 9 - Document Upload and Validation. */
class DocumentsPage extends BasePage {
  constructor(page) {
    super(page);
    this.validation = new ValidationSummary(page);
  }

  get inputs() {
    return this.$$(S.documents.uploadInputs);
  }

  get uploaded() {
    return this.$$(S.documents.uploadedItems);
  }

  /** Uploads one file into the Nth upload control. */
  async upload(file, index = 0) {
    await this.inputs.nth(index).setInputFiles(file);
  }

  /** Uploads the same valid file into EVERY upload control (i.e. satisfies all mandatory documents). */
  async uploadAllRequired(file) {
    await this.inputs.first().waitFor({ state: 'attached' }); // count() does not auto-wait
    const n = await this.inputs.count();
    for (let i = 0; i < n; i += 1) await this.inputs.nth(i).setInputFiles(file);
  }

  get message() {
    return this.$(S.documents.message);
  }
}

module.exports = { DocumentsPage };
