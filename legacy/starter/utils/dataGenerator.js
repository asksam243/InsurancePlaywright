/**
 * Randomized/boundary test data generation utilities.
 * Keeping generation logic here (rather than hardcoded in tests) means
 * every test run uses fresh data and boundary cases stay consistent
 * across the whole suite — mirrors the FinServe dataGenerator.js pattern.
 */

function randomDigits(n) {
  let s = '';
  for (let i = 0; i < n; i++) s += Math.floor(Math.random() * 10);
  return s;
}

function randomString(prefix = 'Test') {
  return `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

function isoDateYearsAgo(years, extraDays = 0) {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  d.setDate(d.getDate() - extraDays);
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
}

function isoDateFuture(days = 30) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

/** A valid adult client, age comfortably inside the 18–65 eligibility window. */
function validClient(overrides = {}) {
  return {
    firstName: randomString('Client'),
    lastName: 'Applicant',
    dateOfBirth: isoDateYearsAgo(35),
    gender: 'Female',
    maritalStatus: 'Married',
    occupation: 'Software Engineer',
    employerName: 'Acme Technologies',
    ...overrides,
  };
}

/** DOB that makes the client under 18 — CLI-V03. */
function underageClient(overrides = {}) {
  return validClient({ dateOfBirth: isoDateYearsAgo(16), ...overrides });
}

/** DOB that makes the client over 65 — CLI-V04. */
function overageClient(overrides = {}) {
  return validClient({ dateOfBirth: isoDateYearsAgo(70), ...overrides });
}

/** DOB in the future — CLI-V05. */
function futureDobClient(overrides = {}) {
  return validClient({ dateOfBirth: isoDateFuture(30), ...overrides });
}

function validAddress(overrides = {}) {
  return {
    addressLine1: '221B Baker Street',
    addressLine2: 'Suite 4',
    city: 'Springfield',
    state: 'IL',
    postalCode: '62701',
    country: 'USA',
    ...overrides,
  };
}

function validContact(overrides = {}) {
  return {
    email: `agent.client.${randomDigits(6)}@example.test`,
    mobile: `555${randomDigits(7)}`,
    alternatePhone: `555${randomDigits(7)}`,
    preferredCommunication: 'Email',
    ...overrides,
  };
}

function invalidContact(overrides = {}) {
  return {
    email: 'not-an-email',
    mobile: '12',
    alternatePhone: '',
    preferredCommunication: 'Email',
    ...overrides,
  };
}

function validKyc(overrides = {}) {
  return {
    idType: 'Passport',
    idNumber: `P${randomDigits(8)}`,
    ssn: `${randomDigits(3)}-${randomDigits(2)}-${randomDigits(4)}`,
    annualIncome: '85000',
    netWorth: '250000',
    sourceOfFunds: 'Salary',
    isPep: false,
    ...overrides,
  };
}

/** Builds a beneficiary. `age` under 18 triggers the guardian-required path. */
function beneficiary({
  firstName = randomString('Ben'),
  lastName = 'Eficiary',
  relationship = 'Spouse',
  allocationPercent = 100,
  type = 'Individual',
  age = 30,
  guardianName,
  // CONFIRMED real field (BR-BEN-007): defaults to Revocable so tests that
  // don't care about designation don't accidentally trigger the Irrevocable
  // legal-confirmation dialog in BeneficiaryPage.setDesignation().
  designation = 'Revocable',
} = {}) {
  const dob = isoDateYearsAgo(age);
  const b = { firstName, lastName, relationship, allocationPercent, type, dateOfBirth: dob, designation };
  if (age < 18) {
    b.guardianName = guardianName || 'Guardian ' + lastName;
  }
  if (type === 'Trust') {
    b.trustName = `${lastName} Family Trust`;
    b.trusteeName = `${firstName} Trustee`;
    b.trustDate = isoDateYearsAgo(2);
  }
  if (type === 'Organization') {
    b.registrationNumber = `REG-${randomDigits(6)}`;
    b.organizationContact = validContact().email;
  }
  return b;
}

module.exports = {
  randomDigits,
  randomString,
  isoDateYearsAgo,
  isoDateFuture,
  validClient,
  underageClient,
  overageClient,
  futureDobClient,
  validAddress,
  validContact,
  invalidContact,
  validKyc,
  beneficiary,
};
