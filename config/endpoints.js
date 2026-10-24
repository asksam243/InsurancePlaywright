/**
 * API surface from the Functional Module Descriptions (Submission 1, section 2.5).
 * Paths are RELATIVE (no leading slash) so they append to the /api base URL.
 */
module.exports = {
  login: 'auth/login',
  applications: 'applications',
  application: (id) => `applications/${id}`,
  client: (id) => `applications/${id}/client`,
  products: 'products',
  product: (id) => `products/${id}`,
  riders: 'riders',
  validate: (id) => `applications/${id}/validate`,
  beneficiaries: (id) => `applications/${id}/beneficiaries`,
  documents: (id) => `applications/${id}/documents`,
  submit: (id) => `applications/${id}/submit`,
  status: (id) => `applications/${id}/status`,
};
