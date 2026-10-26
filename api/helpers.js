const ep = require('../config/endpoints');
const { idOf } = require('./ApiClient');
const { formatDate } = require('../utils/dates');
const { buildClient } = require('../utils/dataBuilder');

/**
 * Client payload in the REAL API shape (snake_case, third project's applicationBuilder). The API tests still send a valid
 * "control" request first: if the control is rejected the payload shape is wrong and the test skips instead of
 * reporting a false application defect.
 */
function clientPayload(overrides = {}) {
  const c = buildClient(overrides);
  return {
    first_name: c.firstName,
    middle_name: c.middleName ?? null,
    last_name: c.lastName,
    date_of_birth: formatDate(c.dob, 'iso'),
    gender: c.gender,
    marital_status: c.maritalStatus,
    nationality: c.nationality,
    occupation: c.occupation,
    employer_name: c.employer,
    employer_address: c.employerAddress,
  };
}

/** Individual beneficiary in the real API shape. */
function beneficiaryPayload(allocation, overrides = {}) {
  return {
    beneficiary_level: 'PRIMARY',
    beneficiary_type: 'INDIVIDUAL',
    relationship: 'SPOUSE',
    allocation_percentage: allocation,
    first_name: 'Api',
    last_name: 'Beneficiary',
    date_of_birth: formatDate(require('../utils/dates').dobForAge(34), 'iso'),
    gender: 'FEMALE',
    is_irrevocable: 0,
    irrevocable_confirmation: 0,
    legal_acknowledgement: null,
    ...overrides,
  };
}

/** Creates a draft application through the API (the acting agent is added by the client). Falls back to an existing draft. */
async function disposableDraft(api) {
  const res = await api.post(ep.applications, {});
  if (res.ok()) {
    const body = await api.json(res);
    const id = idOf(body?.data || {}) ?? idOf(body);
    if (id) return id;
  }
  return api.firstApplicationId('draft');
}

const is4xxValidation = (status) => status >= 400 && status < 500 && ![401, 403, 404].includes(status);

module.exports = { clientPayload, beneficiaryPayload, disposableDraft, is4xxValidation };
