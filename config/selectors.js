/**
 * CENTRAL SELECTOR MAP - the only file that knows how the UI is addressed.
 *
 * Each entry: { id: <data-testid>, label|role+name|text|css: <fallback> }.
 *
 * CONFIDENCE
 *   CONFIRMED   Login, dashboard and logout ids: proven by the live smoke run (AUTH-V01, AUTH-V04, AUTH-V05, AUTH-V14, DASH-V01 passed).
 *   FROM MARKUP Every other id below was taken from the third project's page objects, which were written from the
 *               application's own markup (README: "Locators are the application's own data-testid values"). They have
 *               not yet been proven by a live run - run `npm run discover` then `npm run verify:selectors` to prove them.
 *   GUESSED     Entries marked UNCONFIRMED have no known real id; they rely on their role/label/css fallback.
 *
 * Real-app facts that shaped this file:
 *   - Test ids carry a type suffix: -input, -select, -checkbox, -button.
 *   - The product step is a <select>, riders are table rows, beneficiaries are an always-visible form, documents are
 *     one type dropdown + one file input + an Upload button.
 *   - There is NO "Save draft" button: each step's Save & Continue persists the draft.
 */
const t = (id, rest = {}) => ({ id, ...rest });

const S = {
  common: {
    // Generic fallbacks only. BasePage.next() picks the step-specific button (STEP_CONTINUE in pages/BasePage.js).
    next: t('step-next', { role: 'button', name: /^(next|continue|save (and|&) continue)/i }),
    back: t('step-back', { role: 'button', name: /^(back|previous)/i }),
    saveDraft: t('save-draft', { role: 'button', name: /save (as )?draft|save for later/i }), // UNCONFIRMED - the app has none
    stepTitle: t('step-title', { css: 'main h1, main h2, h1, h2' }),
    toast: t('status-alert', { css: '.toast, .alert-success, [role="status"]' }),
    logout: t('nav-logout-button', { role: 'button', name: /log ?out|sign ?out/i }),
    formErrorSummary: t('validation-error-alert', { css: '.alert-danger, [role="alert"]' }),
    anyError: {
      id: 'validation-error-alert',
      css: '[data-testid="validation-error-alert"], [data-testid="beneficiary-error-summary"], [data-testid="review-validation-errors"], .field-error, .invalid-feedback, .text-danger, [role="alert"]',
    },
  },

  login: {
    form: t('login-form'),
    email: t('login-email-input', { label: /e-?mail|user ?name/i }), // CONFIRMED
    password: t('login-password-input', { label: /^password/i }), // CONFIRMED
    submit: t('login-submit-button', { role: 'button', name: /log ?in|sign ?in/i }), // CONFIRMED
    error: t('login-error', { css: '[data-testid="validation-error-alert"], .field-error, .alert-danger, [role="alert"]' }),
    otpInput: t('login-otp', { label: /otp|verification code|one.?time/i }), // UNCONFIRMED
    otpSubmit: t('login-otp-submit', { role: 'button', name: /verify|submit|continue/i }), // UNCONFIRMED
    forgotLink: t('forgot-password-link', { role: 'link', name: /forgot/i }), // UNCONFIRMED
  },

  // UNCONFIRMED: no forgot-password / change-password ids are known (the third project has a ChangePasswordPage but it is not
  // part of this repo's scenarios yet).
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
    root: t('dashboard-page'), // CONFIRMED (DASH-V01 passed)
    greeting: t('dashboard-page', { css: 'main h1, header [class*="user"], [class*="welcome"]' }),
    newApplication: t('dashboard-new-application-button', { role: 'link', name: /new application|start (new )?application|create application/i }),
    newApplicationBtn: t('dashboard-new-application-button', { role: 'button', name: /new application|start (new )?application|create application/i }),
    startPage: t('application-start-page'),
    createDraft: t('application-create-draft-button', { role: 'button', name: /create draft/i }),
    table: t('dashboard-applications-table'),
    draftCount: t('dashboard-summary-draft'),
    submittedCount: t('dashboard-summary-submitted'),
    summaryPrefix: 'dashboard-summary-',
    rowPrefix: 'application-row-', // UNCONFIRMED: rows are also located by their open link
    openPrefix: 'application-open-',
    statusPrefix: 'application-status-',
    rows: t('application-rows', { css: '[data-testid="dashboard-applications-table"] tbody tr, table tbody tr, [data-testid^="application-row-"]' }),
    statusCell: t('application-status', { css: '[data-testid^="application-status-"], [data-testid="application-status"], .status, .badge' }),
    // UNCONFIRMED: the real dashboard shows "latest 10 applications and status counters"; no search/filter control is known.
    search: t('dashboard-search', { role: 'searchbox', label: /search/i, placeholder: /search/i }),
    statusFilter: t('dashboard-status-filter', { label: /status/i }),
    emptyState: t('dashboard-empty-state', { text: /no applications|get started|nothing here|no records/i }),
    resumeLink: t('application-open', { css: '[data-testid^="application-open-"]', role: 'link', name: /resume|continue|open|edit/i }),
  },

  client: {
    root: t('client-information-page'),
    form: t('client-information-form'),
    firstName: t('client-first-name-input', { label: /first name/i }),
    middleName: t('client-middle-name-input'),
    lastName: t('client-last-name-input', { label: /last name|surname/i }),
    dob: t('client-dob-input', { label: /date of birth|dob|birth date/i }),
    age: t('client-age', { label: /^age/i, css: '[data-testid="client-age"], .calculated-age' }), // UNCONFIRMED (the age is shown on the review page)
    gender: t('client-gender-select', { label: /gender|sex/i }),
    maritalStatus: t('client-marital-status-select', { label: /marital/i }),
    nationality: t('client-nationality-input', { label: /nationality|citizenship/i }),
    occupation: t('client-occupation-input', { label: /occupation/i }),
    employer: t('client-employer-name-input', { label: /employer name|employer|company/i }),
    employerAddress: t('client-employer-address-input', { label: /employer address/i }),
    save: t('client-save-continue-button'),
  },

  address: {
    root: t('address-contact-page'),
    form: t('address-contact-form'),
    resLine1: t('residential-address-line-1-input', { label: /residential.*(address|line 1|street)|address line 1|street/i }),
    resLine2: t('residential-address-line-2-input'),
    resCity: t('residential-city-input', { label: /city/i }),
    resState: t('residential-state-province-select', { label: /state/i }),
    resZip: t('residential-postal-code-input', { label: /zip|postal/i }),
    sameAsResidential: t('address-same-as-residential-checkbox', { label: /same as (the )?residential/i, role: 'checkbox', name: /same as/i }),
    mailLine1: t('mailing-address-line-1-input', { label: /mailing.*(address|line 1|street)/i }),
    mailLine2: t('mailing-address-line-2-input'),
    mailCity: t('mailing-city-input', { label: /mailing.*city/i }),
    mailState: t('mailing-state-province-select', { label: /mailing.*state/i }),
    mailZip: t('mailing-postal-code-input', { label: /mailing.*(zip|postal)/i }),
    email: t('contact-primary-email-input', { label: /e-?mail/i }),
    phone: t('contact-mobile-number-input', { label: /mobile|phone/i }),
    alternatePhone: t('contact-alternate-phone-input'),
    preferredContact: t('contact-preferred-mode-select', { label: /preferred (contact|communication)/i }),
    save: t('address-contact-save-continue-button'),
  },

  kyc: {
    root: t('kyc-financial-page'),
    form: t('kyc-financial-form'),
    idType: t('kyc-id-type-select', { label: /id type|identification type/i }),
    idNumber: t('kyc-id-number-input', { label: /id number|identification number/i }),
    issueDate: t('kyc-issue-date-input'),
    expiryDate: t('kyc-expiry-date-input'),
    // The real app has NO separate SSN field: an SSN is entered as the ID number when the ID type is SSN.
    ssn: t('kyc-ssn', { label: /ssn|social security/i }), // UNCONFIRMED - expected to match nothing
    ssnDisplay: t('kyc-ssn-display', { css: '[data-testid="kyc-ssn-display"], .masked-ssn' }), // UNCONFIRMED
    income: t('financial-annual-income-input', { label: /annual income|income/i }),
    netWorth: t('financial-net-worth-input', { label: /net worth/i }),
    sourceOfFunds: t('financial-source-of-funds-select', { label: /source of funds/i }),
    riskProfile: t('financial-risk-profile-select', { label: /risk (profile|tolerance)/i }),
    pep: t('compliance-pep-select', { label: /pep|politically/i }), // select: 0 = No, 1 = Yes
    pepYes: t('compliance-pep-select'), // kept for older callers; KycFinancialPage uses the select
    pepNo: t('compliance-pep-select'),
    pepDetails: t('compliance-pep-details-input', { label: /pep.*details|position|political/i }),
    declaration: t('compliance-declaration-checkbox', { label: /declaration/i }),
    uploadInput: t('document-upload-kyc', { css: 'input[type="file"]' }),
    save: t('kyc-financial-save-continue-button'),
  },

  product: {
    root: t('product-configuration-page'),
    form: t('product-configuration-form'),
    select: t('product-select', { label: /product/i }), // a <select> of product NAMES (values are ids)
    cardPrefix: 'product-card-', // catalogue page (/products) only
    cards: t('product-cards', { css: '[data-testid^="product-card-"], .product-card' }),
    selectButton: t('product-select-button', { role: 'button', name: /select|choose/i }),
    inactiveCards: t('product-cards-inactive', { css: '[data-testid^="product-card-"][data-status="inactive"], .product-card.inactive, .product-card[aria-disabled="true"]' }),
    detailsLink: t('product-details-link', { role: 'link', name: /details|learn more|view/i }),
    detailsPanel: t('product-detail-page', { css: 'main' }),
    faceValue: t('product-sum-assured-input', { label: /face value|sum assured|coverage amount/i }),
    frequency: t('product-premium-frequency-select', { label: /premium frequency|payment frequency|frequency/i }),
    paymentTerm: t('product-payment-term-select', { label: /payment term|premium paying term/i }),
    policyTerm: t('product-coverage-term-select', { label: /policy term|coverage term/i }),
    premium: t('product-current-total-premium', { css: '.premium-amount' }),
    previewHelp: t('premium-preview-help'),
    rangeHelp: t('product-range-help'),
    warning: t('product-warning', { css: '[data-testid="validation-error-alert"], .alert-warning, [role="alert"], .warning' }),
    save: t('product-save-continue-button'),
  },

  rider: {
    root: t('riders-page'),
    form: t('rider-selection-form'),
    rowPrefix: 'rider-row-',
    cardPrefix: 'rider-row-',
    cards: t('rider-rows', { css: '[data-testid^="rider-row-"]' }), // real riders are table rows named by their text
    checkbox: t('rider-selected', { css: '[data-testid^="rider-selected-"]' }),
    coverage: t('rider-coverage-amount', { css: '[data-testid^="rider-coverage-amount-"]' }),
    summaryPremium: t('rider-premium-summary'),
    totalPremium: t('application-total-premium', { css: '[data-testid="rider-premium-summary"]' }),
    questionnaire: t('health-questionnaire', { css: '[data-testid="health-questionnaire"], form.health-questionnaire, [role="dialog"]' }), // UNCONFIRMED
    message: t('validation-error-alert', { css: '.alert, .field-error, [role="alert"]' }),
    save: t('rider-save-continue-button'),
  },

  beneficiary: {
    root: t('beneficiary-page'),
    form: t('beneficiary-form'),
    errorSummary: t('beneficiary-error-summary'),
    allocationSummary: t('beneficiary-allocation-summary'),
    table: t('beneficiary-table'),
    emptyState: t('beneficiary-empty-state'),
    // There is no "Add beneficiary" button: the form is always visible and Save adds the row.
    add: t('beneficiary-save-button', { role: 'button', name: /add beneficiary/i }),
    save: t('beneficiary-save-button', { role: 'button', name: /^(save|add|confirm)(?!.*draft)/i }),
    rows: t('beneficiary-rows', { css: '[data-testid^="beneficiary-row-"]' }),
    level: t('beneficiary-level-select', { label: /primary|secondary|level/i }),
    type: t('beneficiary-type-select', { label: /beneficiary type|^type/i }),
    designation: t('beneficiary-designation-select'), // revocable (0) / irrevocable (1) - NOT primary/secondary
    firstName: t('beneficiary-first-name-input', { label: /first name/i }),
    lastName: t('beneficiary-last-name-input', { label: /last name/i }),
    name: t('beneficiary-first-name-input', { label: /^(full )?name|first name/i }),
    dob: t('beneficiary-dob-input', { label: /date of birth|dob/i }),
    gender: t('beneficiary-gender-select', { label: /gender/i }),
    relationship: t('beneficiary-relationship-select', { label: /relationship/i }),
    allocation: t('beneficiary-allocation-input', { label: /allocation|share|percent/i }),
    guardianSection: t('minor-guardian-section'),
    guardianName: t('beneficiary-guardian-name-input', { label: /guardian.*name/i }),
    guardianRelationship: t('beneficiary-guardian-relationship-input', { label: /guardian.*relationship/i }),
    guardianContact: t('beneficiary-guardian-contact-input', { label: /guardian.*contact/i }),
    guardianAddress: t('beneficiary-guardian-address-input', { label: /guardian.*address/i }),
    trustName: t('beneficiary-trust-name-input', { label: /trust name/i }),
    trusteeName: t('beneficiary-trustee-name-input', { label: /trustee/i }),
    trustDate: t('beneficiary-trust-date-input', { label: /trust date/i }),
    orgName: t('beneficiary-organization-name-input', { label: /organi[sz]ation name/i }),
    orgRegistration: t('beneficiary-organization-registration-input', { label: /registration/i }),
    orgContact: t('beneficiary-organization-contact-input', { label: /contact/i }),
    irrevocable: t('beneficiary-designation-select', { label: /irrevocable/i }),
    legalAcknowledgement: t('beneficiary-legal-acknowledgement-checkbox', { label: /acknowledg/i }),
    // The irrevocable confirmation and the over-allocation notice are native browser confirm()/alert() dialogs, not HTML modals.
    legalModal: t('irrevocable-confirmation-modal', { role: 'dialog' }), // never present in the real app
    legalConfirm: t('irrevocable-confirm', { role: 'button', name: /confirm|agree|accept|yes/i }), // never present in the real app
    primaryTotal: t('beneficiary-allocation-summary'), // read from its data-primary-total attribute
    secondaryTotal: t('beneficiary-allocation-summary'), // read from its data-secondary-total attribute
    remove: t('beneficiary-delete', { css: '[data-testid^="beneficiary-delete-"]', role: 'button', name: /remove|delete/i }),
    message: t('validation-error-alert', { css: '[data-testid="beneficiary-error-summary"], .alert, .field-error, [role="alert"]' }),
    next: t('beneficiary-continue-button'),
  },

  documents: {
    root: t('documents-page'),
    typeSelect: t('document-type-select', { label: /document type/i }),
    fileInput: t('document-upload-kyc', { css: 'input[type="file"]' }),
    uploadButton: t('document-upload-button', { role: 'button', name: /upload/i }),
    table: t('documents-table'),
    emptyState: t('documents-empty-state'),
    rowPrefix: 'document-row-',
    uploadInputs: t('document-upload-kyc', { css: 'input[type="file"]' }),
    uploadedItems: t('document-rows', { css: '[data-testid^="document-row-"]' }),
    message: t('validation-error-alert', { css: '.alert, .field-error, [role="alert"]' }),
    next: t('documents-continue-review-button'),
  },

  review: {
    root: t('review-page'),
    summary: t('review-page', { css: 'main' }),
    premium: t('review-total-premium', { css: '.review-premium' }),
    age: t('review-client-calculated-age'),
    clientName: t('review-client-name'), // UNCONFIRMED
    productName: t('review-product-name'), // UNCONFIRMED
    riders: t('review-riders'), // UNCONFIRMED
    beneficiaries: t('review-beneficiaries'), // UNCONFIRMED
    validationSummary: t('review-validation-errors', { css: '.validation-summary' }),
    validationPassed: t('review-validation-passed'),
    validationItems: t('review-validation-errors-items', { css: '[data-testid="review-validation-errors"] li, [data-testid^="validation-item"], .validation-summary li, .validation-summary a' }),
    validateButton: t('review-validate-button', { role: 'button', name: /validate/i }),
    submit: t('review-submit-application-button', { role: 'button', name: /^submit/i }),
    // Confirmation page (/applications/:id/confirmation)
    confirmationRoot: t('submission-confirmation-page'),
    reference: t('confirmation-reference-number', { css: '.reference-number' }),
    viewStatusLink: t('confirmation-view-status-link'),
    dashboardLink: t('confirmation-dashboard-link'),
    status: t('status-current-value', { css: '[data-testid="application-status-badge"], .status-badge, .badge' }),
    confirmation: t('submission-confirmation-page', { css: '.alert-success, [role="status"]' }),
  },

  status: {
    root: t('status-page'),
    current: t('status-current-value'),
    reference: t('status-reference-number'),
    historyTable: t('status-history-table'),
    rowPrefix: 'status-row-',
  },
};

/** Fields masked in every screenshot we attach (utils/evidence.js). Synthetic data is used anyway; this is defence in depth. */
const SENSITIVE_FIELDS = [
  S.kyc.ssn, S.kyc.ssnDisplay, S.kyc.idNumber, S.kyc.income, S.kyc.netWorth, S.kyc.pepDetails,
  S.client.dob, S.beneficiary.dob, S.login.password, S.password.newPassword, S.password.confirmPassword,
];

module.exports = { S, SENSITIVE_FIELDS };
