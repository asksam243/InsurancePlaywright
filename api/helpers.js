const ep = require('../config/endpoints');
const { idOf } = require('./ApiClient');
const { formatDate } = require('../utils/dates');
const { buildClient } = require('../utils/dataBuilder');

/**
 * Client payload. The real field names are not documented (Q03), so common aliases are sent together.
 * The API tests ALWAYS send a valid "control" request first: if the control is rejected the payload shape is wrong,
 * and the test skips instead of reporting a false application defect.
 */
function clientPayload(overrides = {}) {
  const c = buildClient(overrides);
  const iso = formatDate(c.dob, 'iso');
  return {
    firstName: c.firstName,
    lastName: c.lastName,
    dateOfBirth: iso,
    dob: iso,
    gender: c.gender,
    maritalStatus: c.maritalStatus,
    nationality: c.nationality,
    occupation: c.occupation,
    employer: c.employer,
  };
}

/** Creates a draft application via the API if the app allows it, otherwise falls back to an existing draft. */
async function disposableDraft(api) {
  const res = await api.post(ep.applications, {});
  if (res.ok()) {
    const body = await api.json(res);
    const id = idOf(body) ?? idOf(body?.data || {});
    if (id) return id;
  }
  return api.firstApplicationId('draft');
}

const is4xxValidation = (status) => status >= 400 && status < 500 && ![401, 403, 404].includes(status);

module.exports = { clientPayload, disposableDraft, is4xxValidation };
