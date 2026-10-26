/**
 * API surface. CONFIRMED from the third project's API client (derived from the application's routes):
 *  - every call needs the static X-API-Key header; the acting agent is chosen with `agent_email` (ApiClient adds it)
 *  - responses are an envelope: { status: 'success'|'error', data, message, errors }
 * Paths are RELATIVE (no leading slash) so they append to the /api base URL.
 */
module.exports = {
  health: 'health',
  login: 'login',
  applications: 'applications',
  application: (id) => `applications/${id}`,
  client: (id) => `applications/${id}/client`,
  addressContact: (id) => `applications/${id}/address-contact`,
  kycFinancial: (id) => `applications/${id}/kyc-financial`,
  applicationProduct: (id) => `applications/${id}/product`, // save the chosen product + configuration
  applicationRiders: (id) => `applications/${id}/riders`, // save selected riders
  products: 'products',
  product: (id) => `products/${id}`, // catalogue detail
  riders: 'riders',
  validate: (id) => `applications/${id}/validate`,
  beneficiaries: (id) => `applications/${id}/beneficiaries`,
  documents: (id) => `applications/${id}/documents`,
  submit: (id) => `applications/${id}/submit`,
  status: (id) => `applications/${id}/status`,
};
