/**
 * UI routes. CONFIRMED from the application markup (third project's page objects) and the smoke run.
 * Application steps live under /applications/:id/<step>.
 */
module.exports = {
  login: '/login',
  dashboard: '/dashboard',
  forgotPassword: '/forgot-password', // listed in the module descriptions (AUTH-V11)
  products: '/products', // product catalogue (cards + details); the product STEP is a dropdown, not cards
  // application steps, in journey order
  steps: ['client', 'address-contact', 'kyc-financial', 'product', 'riders', 'beneficiaries', 'documents', 'review'],
  step: (id, name) => `/applications/${id}/${name}`,
  confirmation: (id) => `/applications/${id}/confirmation`,
  status: (id) => `/applications/${id}/status`,
};
