const routes = require('../utils/routes');

/** VERIFY upload-control testid and accepted-format/size error copy live. */
class DocumentUploadPage {
  constructor(page) {
    this.page = page;
    this.uploadInput = page.getByTestId('document-upload-input');
    this.uploadStatus = page.getByTestId('upload-status');
    this.fileTypeError = page.getByTestId('file-type-error');
    this.fileSizeError = page.getByTestId('file-size-error');
    this.missingDocumentError = page.getByTestId('missing-document-error');

    this.nextButton = page.getByRole('button', { name: /next|continue/i });
  }

  async goto(applicationId) {
    await this.page.goto(routes.documents(applicationId));
  }

  async upload(filePath) {
    await this.uploadInput.setInputFiles(filePath);
  }

  async next() {
    await this.nextButton.click();
  }
}

module.exports = { DocumentUploadPage };
