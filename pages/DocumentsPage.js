const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage');
const { S } = require('../config/selectors');
const { ValidationSummary } = require('../components/ValidationSummary');
const { options } = require('../utils/browser');

/**
 * Document Upload and Validation: /applications/:id/documents.
 * ONE document-type dropdown, ONE file input and an Upload button (the page reloads after each upload).
 * KYC_ID is the only mandatory document type the app enforces.
 */
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

  /** Document type values offered by the dropdown (placeholder excluded). */
  async typeValues() {
    return (await options(this.$(S.documents.typeSelect))).filter((o) => o.value !== '').map((o) => o.value);
  }

  /** Uploads one file as the Nth document type (0 = first, normally KYC_ID) and waits for the page to reload. */
  async upload(file, index = 0) {
    const types = await this.typeValues();
    await this.$(S.documents.typeSelect).selectOption(types[index] ?? types[0]);
    await this.$(S.documents.fileInput).setInputFiles(file);
    await this.$(S.documents.uploadButton).click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  /** Uploads the one mandatory document (KYC_ID; the first type if the build names it differently). */
  async uploadAllRequired(file) {
    await expect(this.$(S.documents.typeSelect)).toBeVisible();
    const types = await this.typeValues();
    await this.$(S.documents.typeSelect).selectOption(types.includes('KYC_ID') ? 'KYC_ID' : types[0]);
    await this.$(S.documents.fileInput).setInputFiles(file);
    await this.$(S.documents.uploadButton).click();
    await this.page.waitForLoadState('domcontentloaded');
    await expect(this.uploaded.first(), 'the uploaded document is listed').toBeVisible();
  }

  get message() {
    return this.$(S.documents.message);
  }
}

module.exports = { DocumentsPage };
