/**
 * Route map — Section 4.2 of the framework pack.
 * Centralizing these means a route change only needs updating in one place.
 */
module.exports = {
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgot-password',
  DASHBOARD: '/dashboard',
  NEW_APPLICATION: '/applications/new',
  PROFILE: '/profile',
  SUPPORT: '/support',
  PRODUCTS: '/products',

  applicationDetail: (id) => `/applications/${id}`,
  clientInfo: (id) => `/applications/${id}/client`,
  addressContact: (id) => `/applications/${id}/address-contact`,
  kycFinancial: (id) => `/applications/${id}/kyc-financial`,
  productDetail: (id) => `/products/${id}`,
  productConfig: (id) => `/applications/${id}/product`,
  riders: (id) => `/applications/${id}/riders`,
  beneficiaries: (id) => `/applications/${id}/beneficiaries`,
  documents: (id) => `/applications/${id}/documents`,
  review: (id) => `/applications/${id}/review`,
  confirmation: (id) => `/applications/${id}/confirmation`,
  status: (id) => `/applications/${id}/status`,
};
