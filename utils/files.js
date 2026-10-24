/**
 * Upload fixtures built in memory (Playwright setInputFiles accepts {name, mimeType, buffer}),
 * so no binary files need to be committed and the oversize file is generated to the configured limit.
 */
const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);
const JPG_1X1 = Buffer.from(
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=',
  'base64',
);
const PDF_MIN = Buffer.from(
  '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n' +
    '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n',
);

const files = {
  validPdf: (name = 'kyc-valid.pdf') => ({ name, mimeType: 'application/pdf', buffer: PDF_MIN }),
  validPng: (name = 'kyc-valid.png') => ({ name, mimeType: 'image/png', buffer: PNG_1X1 }),
  validJpg: (name = 'kyc-valid.jpg') => ({ name, mimeType: 'image/jpeg', buffer: JPG_1X1 }),
  unsupportedExe: (name = 'malware-test.exe') => ({ name, mimeType: 'application/x-msdownload', buffer: Buffer.from('MZ-not-a-real-binary') }),
  unsupportedTxt: (name = 'notes.txt') => ({ name, mimeType: 'text/plain', buffer: Buffer.from('plain text is not an accepted KYC format') }),
  /** A PDF-named file `mb`+1 megabytes long, used to probe the upload size limit. */
  oversizePdf: (mb, name = 'kyc-oversize.pdf') => ({
    name,
    mimeType: 'application/pdf',
    buffer: Buffer.concat([PDF_MIN, Buffer.alloc((mb + 1) * 1024 * 1024)]),
  }),
};

module.exports = { files, PNG_1X1, JPG_1X1, PDF_MIN };
