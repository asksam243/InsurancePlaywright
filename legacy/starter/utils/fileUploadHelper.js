const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Creates small temp files for KYC document upload tests (DOC-V01..V03).
 * Files are written to the OS temp dir so nothing is committed to the repo,
 * and cleaned up explicitly by the caller (or left for the OS to reap).
 */
const tmpDir = path.join(os.tmpdir(), 'insurance-automation-uploads');

function ensureDir() {
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
}

/** A minimal, structurally valid PDF — accepted by most upload validators. */
function createValidPdf(filename = 'kyc-id-document.pdf') {
  ensureDir();
  const filePath = path.join(tmpDir, filename);
  const minimalPdf =
    '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n' +
    '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n' +
    '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\n' +
    'trailer<</Root 1 0 R>>\n%%EOF';
  fs.writeFileSync(filePath, minimalPdf);
  return filePath;
}

/** Unsupported file type for DOC-V02 (e.g. .exe / .txt masquerading as a document). */
function createUnsupportedFile(filename = 'not-a-document.exe') {
  ensureDir();
  const filePath = path.join(tmpDir, filename);
  fs.writeFileSync(filePath, 'this is not a valid document format');
  return filePath;
}

/**
 * Oversized file for DOC-V03. CONFIRMED (.env: DEMO_DOCUMENT_MAX_SIZE_MB=5):
 * the real limit is 5MB, so 8MB is comfortably over the threshold without
 * wastefully generating a much larger buffer than needed.
 */
function createOversizedFile(filename = 'oversized-document.pdf', sizeMb = 8) {
  ensureDir();
  const filePath = path.join(tmpDir, filename);
  const buffer = Buffer.alloc(sizeMb * 1024 * 1024, 'A');
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

function cleanup() {
  if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
}

module.exports = { createValidPdf, createUnsupportedFile, createOversizedFile, cleanup };
