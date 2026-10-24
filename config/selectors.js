/**
 * CENTRAL SELECTOR MAP - the only file that knows how the UI is addressed.
 *
 * Each entry: { id: <data-testid>, label|role+name|text|css: <fallback> }.
 *
 * CONFIDENCE
 *   CONFIRMED   login.email / login.password / login.submit (Combined QA Lab Learner Guide login example)
 *               common.logout (confirmed on the sibling FinServe app built on the same lab stack)
 *   UNCONFIRMED everything else: ids follow the kebab-case convention seen on the lab apps, and every
 *               entry has an accessible-name fallback. Run `npm run discover` against the lab VM, then
 *               `npm run verify:selectors`, and correct any id that is reported missing.
 */
const t = (id, rest = {}) => ({ id, ...rest });

const S = {
  common: {
    next: t('step-next', { role: 'button', name: /^(next|continue|save (and|&) continue)/i }),
    back: t('step-back', { role: 'button', name: /^(back|previous)/i }),
    saveDraft: t('save-draft', { role: 'button', name: /save (as )?draft|save for later/i }),
    stepTitle: t('step-title', { css: 'main h1, main h2' }),
    toast: t('toast-message', { css: '.toast, .alert-success, [role="status"]' }),
    logout: t('logout-button', { role: 'button', name: /log ?out|sign ?out/i }), // CONFIRMED (sibling app)
    formErrorSummary: t('form-error-summary', { css: '.alert-danger, [role="alert"]' }),
    anyError: { id: 'field-error', css: '.field-error, .invalid-feedback, .text-danger, .error, [role="alert"]' },
  },

  login: {
    email: t('login-email', { label: /e-?mail|user ?name/i }), // CONFIRMED
    password: t('login-password', { label: /^password/i }), // CONFIRMED
    submit: t('login-submit', { role: 'button', name: /log ?in|sign ?in/i }), // CONFIRMED
    error: t('login-error', { css: '.field-error, .alert-danger, [role="alert"]' }),
    otpInput: t('login-otp', { label: /otp|verification code|one.?time/i }),
    otpSubmit: t('login-otp-submit', { role: 'button', name: /verify|submit|continue/i }),
    forgotLink: t('forgot-password-link', { role: 'link', name: /forgot/i }),
  },

  password: {
    email: t('forgot-email', { label: /e-?mail|user ?name/i }),
    requestSubmit: t('forgot-submit', { role: 'button', name: /send|reset|request|submit|continue/i }),
    otp: t('reset-otp', { label: /otp|code/i }),
    otpSubmit: t('reset-otp-submit', { role: 'button', name: /verify|continue|submit/i }),
    newPassword: t('reset-new-password', { label: /^new password/i }),
    confirmPassword: t('reset-confirm-password', { label: /confirm/i }),
    resetSubmit: t('reset-submit', { role: 'button', name: /reset|change|update|save|submit/i }),
    message: t('reset-message', { css: '.alert, .field-error, [role="alert"], [role="status"]' }),
  },

  dashboard: {
    greeting: t('dashboard-greeting', { css: 'main h1, header [class*="user"], [class*="welcome"]' }),
    newApplication: t('new-application-button', { role: 'link', name: /new application|start (new )?application|create application/i }),
    newApplicationBtn: t('new-application-button', { role: 'button', name: /new application|start (new )?application|create application/i }),
    draftCount: t('summary-draft-count'),
    submittedCount: t('summary-submitted-count'),
    rowPrefix: 'application-row-',
    rows: t('application-rows', { css: 'table tbody tr, [data-testid^="application-row-"]' }),
    statusCell: t('application-status', { css: '[data-testid="application-status"], .status, .badge' }),
    search: t('dashboard-search', { role: 'searchbox' , label: /search/i, placeholder: /search/i }),
    statusFilter: t('dashboard-status-filter', { label: /status/i }),
    emptyState: t('dashboard-empty-state', { text: /no applications|get started|nothing here|no records/i }),
    resumeLink: t('resume-application', { role: 'link', name: /resume|continue|open|edit/i }),
  },

  client: {
    firstName: t('client-first-name', { label: /first name/i }),
    lastName: t('client-last-name', { label: /last name|surname/i }),
    dob: t('client-dob', { label: /date of birth|dob|birth date/i }),
    age: t('client-age', { label: /^age/i, css: '[data-testid="client-age"], .calculated-age' }),
    gender: t('client-gender', { label: /gender|sex/i }),
    maritalStatus: t('client-marital-status', { label: /marital/i }),
    nationality: t('client-nationality', { label: /nationality|citizenship/i }),
    occupation: t('client-occupation', { label: /occupation/i }),
    employer: t('client-employer', { label: /employer|company/i }),
  },

  address: {
    resLine1: t('residential-address-line1', { label: /residential.*(address|line 1|street)|address line 1|street/i }),
    resCity: t('residential-city', { label: /city/i }),
    resState: t('residential-state', { label: /state/i }),
    resZip: t('residential-zip', { label: /zip|postal/i }),
    sameAsResidential: t('same-as-residential', { label: /same as (the )?residential/i, role: 'checkbox', name: /same as/i }),
    mailLine1: t('mailing-address-line1', { label: /mailing.*(address|line 1|street)/i }),
    mailCity: t('mailing-city', { label: /mailing.*city/i }),
    mailState: t('mailing-state', { label: /mailing.*state/i }),
    mailZip: t('mailing-zip', { label: /mailing.*(zip|postal)/i }),
    email: t('contact-email', { label: /e-?mail/i }),
    phone: t('contact-phone', { label: /phone|mobile/i }),
    preferredContact: t('preferred-contact-mode', { label: /preferred (contact|communication)/i }),
  },

  kyc: {
    idType: t('kyc-id-type', { label: /id type|identification type/i }),
    idNumber: t('kyc-id-number', { label: /id number|identification number/i }),
    ssn: t('kyc-ssn', { label: /ssn|social security/i }),
    ssnDisplay: t('kyc-ssn-display', { css: '[data-testid="kyc-ssn-display"], .masked-ssn' }),
    income: t('financial-annual-income', { label: /annual income|income/i }),
    netWorth: t('financial-net-worth', { label: /net worth/i }),
    sourceOfFunds: t('financial-source-of-funds', { label: /source of funds/i }),
    riskProfile: t('financial-risk-profile', { label: /risk (profile|tolerance)/i }),
    pepYes: t('pep-yes', { role: 'radio', name: /^yes/i, label: /pep.*yes|yes/i }),
    pepNo: t('pep-no', { role: 'radio', name: /^no/i, label: /pep.*no|^no/i }),
    pepDetails: t('pep-details', { label: /pep.*details|position|political/i }),
    uploadInput: t('kyc-document-upload', { css: 'input[type="file"]' }),
  },

  product: {
    cardPrefix: 'product-card-',
    cards: t('product-cards', { css: '[data-testid^="product-card-"], .product-card' }),
    selectButton: t('product-select', { role: 'button', name: /select|choose/i }),
    inactiveCards: t('product-cards-inactive', { css: '[data-testid^="product-card-"][data-status="inactive"], .product-card.inactive, .product-card[aria-disabled="true"]' }),
    detailsLink: t('product-details-link', { role: 'link', name: /details|learn more|view/i }),
    detailsPanel: t('product-details', { css: 'main' }),
    faceValue: t('product-face-value', { label: /face value|sum assured|coverage amount/i }),
    frequency: t('product-premium-frequency', { label: /premium frequency|payment frequency|frequency/i }),
    paymentTerm: t('product-payment-term', { label: /payment term|premium paying term/i }),
    policyTerm: t('product-policy-term', { label: /policy term|coverage term/i }),
    premium: t('product-premium', { css: '[data-testid="product-premium"], .premium-amount' }),
    warning: t('product-warning', { css: '.alert-warning, [role="alert"], .warning' }),
  },

  rider: {
    cardPrefix: 'rider-card-',
    cards: t('rider-cards', { css: '[data-testid^="rider-card-"], .rider-card' }),
    checkbox: t('rider-toggle', { role: 'checkbox' }),
    coverage: t('rider-coverage', { label: /coverage|amount/i }),
    summaryPremium: t('rider-premium-summary', { css: '[data-testid="rider-premium-summary"], .rider-premium' }),
    totalPremium: t('total-premium', { css: '[data-testid="total-premium"], .total-premium' }),
    questionnaire: t('health-questionnaire', { css: '[data-testid="health-questionnaire"], form.health-questionnaire, [role="dialog"]' }),
    message: t('rider-message', { css: '.alert, .field-error, [role="alert"]' }),
  },

  beneficiary: {
    add: t('add-beneficiary', { role: 'button', name: /add beneficiary/i }),
    save: t('save-beneficiary', { role: 'button', name: /^(save|confirm)(?!.*draft)/i }), // must match neither "Add beneficiary" nor the step-level "Save draft"
    rows: t('beneficiary-rows', { css: '[data-testid^="beneficiary-row-"], [data-testid^="beneficiary-card-"], table tbody tr' }),
    type: t('beneficiary-type', { label: /beneficiary type|^type/i }),
    designation: t('beneficiary-designation', { label: /primary|secondary|designation/i }),
    name: t('beneficiary-name', { label: /^(full )?name/i }),
    dob: t('beneficiary-dob', { label: /date of birth|dob/i }),
    relationship: t('beneficiary-relationship', { label: /relationship/i }),
    allocation: t('beneficiary-allocation', { label: /allocation|share|percent/i }),
    guardianName: t('guardian-name', { label: /guardian.*name/i }),
    guardianRelationship: t('guardian-relationship', { label: /guardian.*relationship/i }),
    trustName: t('trust-name', { label: /trust name/i }),
    trusteeName: t('trustee-name', { label: /trustee/i }),
    trustDate: t('trust-date', { label: /trust date/i }),
    orgName: t('organization-name', { label: /organi[sz]ation name/i }),
    orgRegistration: t('organization-registration', { label: /registration/i }),
    orgContact: t('organization-contact', { label: /contact/i }),
    irrevocable: t('beneficiary-irrevocable', { label: /irrevocable/i }),
    legalModal: t('irrevocable-confirmation-modal', { role: 'dialog' }),
    legalConfirm: t('irrevocable-confirm', { role: 'button', name: /confirm|agree|accept|yes/i }),
    primaryTotal: t('primary-allocation-total', { css: '[data-testid="primary-allocation-total"], .primary-total' }),
    secondaryTotal: t('secondary-allocation-total', { css: '[data-testid="secondary-allocation-total"], .secondary-total' }),
    remove: t('remove-beneficiary', { role: 'button', name: /remove|delete/i }),
    message: t('beneficiary-message', { css: '.alert, .field-error, [role="alert"]' }),
  },

  documents: {
    uploadInputs: t('document-upload-inputs', { css: '[data-testid^="document-upload-"] input[type="file"], input[type="file"][data-testid^="document-upload-"], input[type="file"]' }),
    uploadedItems: t('uploaded-documents', { css: '[data-testid^="document-uploaded-"], .uploaded-document, [data-testid^="document-status-"]' }),
    message: t('document-message', { css: '.alert, .field-error, [role="alert"]' }),
  },

  review: {
    summary: t('review-summary', { css: 'main' }),
    premium: t('review-premium', { css: '[data-testid="review-premium"], .review-premium' }),
    clientName: t('review-client-name'),
    productName: t('review-product-name'),
    riders: t('review-riders'),
    beneficiaries: t('review-beneficiaries'),
    validationSummary: t('validation-summary', { css: '[data-testid="validation-summary"], .validation-summary' }),
    validationItems: t('validation-summary-item', { css: '[data-testid^="validation-item"], .validation-summary li, .validation-summary a' }),
    submit: t('submit-application', { role: 'button', name: /^submit/i }),
    reference: t('reference-number', { css: '[data-testid="reference-number"], .reference-number' }),
    status: t('application-status-badge', { css: '[data-testid="application-status-badge"], .status-badge, .badge' }),
    confirmation: t('submission-confirmation', { css: '[data-testid="submission-confirmation"], .alert-success, [role="status"]' }),
  },
};

/** Fields masked in every screenshot we attach (utils/evidence.js). Synthetic data is used anyway; this is defence in depth. */
const SENSITIVE_FIELDS = [
  S.kyc.ssn, S.kyc.ssnDisplay, S.kyc.idNumber, S.kyc.income, S.kyc.netWorth, S.kyc.pepDetails,
  S.client.dob, S.beneficiary.dob, S.login.password, S.password.newPassword, S.password.confirmPassword,
];

module.exports = { S, SENSITIVE_FIELDS };
