/**
 * Synthetic test data builders (Assumption A11: no real personal data anywhere).
 * Every call generates a unique suffix, so parallel tests never collide on names / ids.
 */
const env = require('../config/env');
const { dobForAge } = require('./dates');

let counter = 0;
/**
 * Unique per call, per worker AND across parallel workers: random part first (a base-36 timestamp starts with the same
 * characters for hours, so it must never be the leading part), then a per-process counter, then a timestamp tail.
 */
function uniqueSuffix() {
  counter += 1;
  return `${Math.random().toString(36).slice(2, 8).padEnd(6, '0')}${counter.toString(36)}${Date.now().toString(36).slice(-3)}`.toUpperCase();
}

/** Letters-only unique token (name validation rejects digits). */
function alphaSuffix() {
  return uniqueSuffix().replace(/[0-9]/g, (d) => 'ABCDEFGHIJ'[Number(d)]);
}

function buildClient(overrides = {}) {
  const s = alphaSuffix();
  return {
    firstName: `Qa${s.slice(0, 8)}`,
    lastName: `Tester${s}`,
    dob: dobForAge(35),
    // Values are the app's <select> option VALUES (enums); the page object also accepts visible text.
    gender: 'MALE',
    maritalStatus: 'MARRIED',
    nationality: 'United States', // a text input in the real form
    occupation: 'Software Engineer',
    employer: 'Example QA Inc',
    employerAddress: '1 Corporate Way, New York, NY 10001', // mandatory in the real form
    ...overrides,
  };
}

function buildAddress(overrides = {}) {
  return {
    line1: '10 Main St',
    city: 'New York',
    state: 'NY',
    zip: '10001', // must be 12345 or 12345-6789
    email: `qa.${uniqueSuffix().toLowerCase()}@example.test`,
    phone: '(212) 555-0147', // must be a valid US phone number
    preferredMode: 'EMAIL',
    ...overrides,
  };
}

function buildKyc(overrides = {}) {
  return {
    // The real form has no separate SSN field: choose ID type SSN and enter the number as the ID number.
    // Synthetic value (not a real person). Change it only if the application's format rules reject it.
    idType: 'SSN',
    idNumber: '123-45-6789',
    income: 120000,
    netWorth: 500000,
    sourceOfFunds: 'SALARY',
    riskProfile: 'MODERATE',
    pep: false,
    declaration: true, // the compliance declaration must be ticked to save the step
    ...overrides,
  };
}

function buildProduct(overrides = {}) {
  return {
    namePattern: env.rules.patterns.product,
    faceValue: env.rules.faceValueDefault,
    frequency: 'MONTHLY',
    paymentTerm: 20, // mandatory dropdown: 10 / 15 / 20 / 25 / 30
    policyTerm: 'WHOLE_LIFE', // mandatory dropdown: WHOLE_LIFE / TO_AGE_100
    ...overrides,
  };
}

function buildBeneficiary(overrides = {}) {
  const s = alphaSuffix();
  const firstName = `Ben${s.slice(0, 6)}`;
  const lastName = `Payee${s.slice(0, 6)}`;
  return {
    type: 'INDIVIDUAL',
    designation: 'PRIMARY', // primary / secondary level
    firstName,
    lastName,
    name: `${firstName} ${lastName}`, // full name, as shown in the table row
    dob: dobForAge(34),
    gender: 'FEMALE',
    relationship: 'SPOUSE',
    allocation: 100,
    ...overrides,
  };
}

/** A complete, valid application payload: every step filled with valid data. */
function buildApplication(overrides = {}) {
  return {
    client: buildClient(),
    address: buildAddress(),
    kyc: buildKyc(),
    product: buildProduct(),
    riders: [],
    beneficiaries: [buildBeneficiary()],
    documents: true,
    ...overrides,
  };
}

module.exports = { uniqueSuffix, alphaSuffix, buildClient, buildAddress, buildKyc, buildProduct, buildBeneficiary, buildApplication };
