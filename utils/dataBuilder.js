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
    gender: 'Male',
    maritalStatus: 'Married',
    nationality: 'United States',
    occupation: 'Engineer',
    employer: 'Example QA Inc',
    ...overrides,
  };
}

function buildAddress(overrides = {}) {
  return {
    line1: '1 Test Street',
    city: 'Boston',
    state: 'MA',
    zip: '02110',
    email: `qa.${uniqueSuffix().toLowerCase()}@example.test`,
    phone: '6175550123',
    ...overrides,
  };
}

function buildKyc(overrides = {}) {
  return {
    idType: 'Passport',
    idNumber: `P${uniqueSuffix()}`,
    // 900-series SSNs are never issued, so this is safe synthetic data.
    ssn: '900-12-3456',
    income: 120000,
    netWorth: 500000,
    sourceOfFunds: 'Salary',
    riskProfile: 'Moderate',
    pep: false,
    ...overrides,
  };
}

function buildProduct(overrides = {}) {
  return {
    namePattern: env.rules.patterns.product,
    faceValue: env.rules.faceValueDefault,
    frequency: 'Monthly',
    ...overrides,
  };
}

function buildBeneficiary(overrides = {}) {
  const s = alphaSuffix();
  return {
    type: 'Individual',
    designation: 'Primary',
    name: `Ben ${s}`,
    dob: dobForAge(34),
    relationship: 'Spouse',
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
