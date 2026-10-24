/**
 * Risk register R01-R41 and the 20 reported issues (RI-01..RI-20), both carried over unchanged from the
 * Submission 1 Study Phase Pack (risk list section 4; known-issue patterns section 2.7 of the QA plan).
 * Test cases link to these IDs so every test is traceable to a risk and a seeded-defect theme.
 */
const RISKS = [
  ['Authentication', 'UI', 'Valid agents cannot log in after authentication changes', 'Medium', 'High', 'AUTH-V01'],
  ['Authentication', 'UI', 'Locked or invalid users see incorrect or misleading messages', 'Medium', 'Medium', 'AUTH-V02, V06'],
  ['Authentication', 'API/DB', 'Lockout after five failures not enforced server-side or counter not stored', 'Medium', 'High', 'AUTH-V07, DB-10'],
  ['Authentication', 'API', 'Protected pages or endpoints reachable without authentication', 'Low', 'High', 'AUTH-V05, API-V02'],
  ['Authentication', 'UI/API', 'Session not cleared on logout; no session timeout', 'Medium', 'High', 'AUTH-V04, AUTH-V10'],
  ['Authentication', 'UI', 'Password policy inconsistently enforced', 'Medium', 'Medium', 'AUTH-V08'],
  ['Dashboard', 'UI/API/DB', 'Dashboard status differs from backend status', 'Medium', 'High', 'DASH-V06, API-V06, DB-03'],
  ['Dashboard', 'API/DB', "Agent sees another agent's applications", 'Low', 'High', 'DASH-V02, API-V08, DB-09'],
  ['Dashboard', 'UI', 'Resumed draft shows missing or stale data', 'Medium', 'Medium', 'DASH-V04, WF-V02'],
  ['Client / KYC', 'UI/API', 'Age eligibility (18-65) rules missed', 'Medium', 'High', 'CLI-V03, V04'],
  ['Client / KYC', 'UI/API', 'Future date of birth accepted', 'Medium', 'High', 'CLI-V05, API-V03'],
  ['Client / KYC', 'UI/DB', 'SSN displayed unmasked, or stored/logged in clear text', 'Medium', 'High', 'CLI-V08, DB-07'],
  ['Client / KYC', 'UI/API', 'Income vs premium affordability not applied', 'Medium', 'High', 'CLI-V12'],
  ['Client / KYC', 'UI', 'PEP details not enforced; PEP not flagged', 'Low', 'Medium', 'CLI-V10'],
  ['Client / KYC', 'UI', 'Address copy or email/phone format errors', 'Low', 'Low', 'CLI-V06, V07'],
  ['Product / Policy', 'UI/API', 'Product eligibility not validated against age or suitability', 'Medium', 'High', 'PROD-V07, PROD-V08'],
  ['Product / Policy', 'UI/API', 'Face value min/max not enforced', 'Medium', 'High', 'PROD-V03, V04'],
  ['Product / Policy', 'UI/API', 'Premium not recalculated after configuration change', 'Medium', 'High', 'PROD-V05, V06'],
  ['Product / Policy', 'UI/DB', 'Premium on review page differs from stored premium', 'Low', 'High', 'PROD-V06, DB-06'],
  ['Riders', 'UI/API', 'Rider coverage exceeds base face value', 'Medium', 'High', 'RIDER-V02'],
  ['Riders', 'UI', 'Mutually exclusive waiver riders both selectable', 'Medium', 'Medium', 'RIDER-V05'],
  ['Riders', 'UI/API', 'Age-ineligible rider or maximum count not enforced', 'Low', 'Medium', 'RIDER-V03, V04'],
  ['Riders', 'UI', 'Rider premium not itemized or total not updated', 'Low', 'Medium', 'RIDER-V07'],
  ['Beneficiaries', 'UI/API/DB', 'Allocation below or above 100% accepted', 'Medium', 'High', 'BEN-V02, V03, API-V04, DB-04'],
  ['Beneficiaries', 'UI/API/DB', 'Minor beneficiary saved without guardian', 'Medium', 'High', 'BEN-V05, DB-05'],
  ['Beneficiaries', 'UI/API', 'Duplicate beneficiary not blocked', 'Medium', 'Medium', 'BEN-V08'],
  ['Beneficiaries', 'UI', 'Trust/Organization fields wrong; irrevocable confirmation missing', 'Low', 'Medium', 'BEN-V06, V07, BEN-V11'],
  ['Beneficiaries', 'UI/DB', 'Removing beneficiary leaves wrong running total or stale data', 'Low', 'Medium', 'BEN-V09'],
  ['Documents / Validation', 'UI/API/DB', 'Mandatory KYC documents not enforced before submission', 'Medium', 'High', 'DOC-V04, API-V05, DB-08'],
  ['Documents / Validation', 'UI/API', 'Unsupported file type or oversize file accepted', 'Medium', 'Medium', 'DOC-V02, V03, API-V10'],
  ['Documents / Validation', 'UI', 'Submit button enabled while validation errors exist', 'Medium', 'High', 'VAL-V03'],
  ['Documents / Validation', 'UI', 'Validation summary incomplete or navigation wrong', 'Low', 'Low', 'VAL-V01, V02'],
  ['Submission / Status', 'UI/DB', 'Draft data not persisted correctly', 'Medium', 'High', 'WF-V01, V02, DB-01'],
  ['Submission / Status', 'API/DB', 'Wrong status transition or missing/duplicate reference number', 'Low', 'High', 'WF-V03, DB-02'],
  ['Submission / Status', 'API', 'Incomplete application accepted by submit API', 'Medium', 'High', 'API-V05'],
  ['Submission / Status', 'UI', 'Submitted application remains editable', 'Low', 'Medium', 'WF-V04'],
  ['Cross-cutting', 'UI/API', 'API validation differs from UI validation', 'Medium', 'High', 'API-V12'],
  ['Cross-cutting', 'Framework', 'Failures hard to debug (inconsistent screenshots, traces, reports)', 'Medium', 'Medium', 'FW-01'],
  ['Cross-cutting', 'Environment', 'Shared lab instability, SSO or network restrictions block runs', 'Medium', 'Medium', 'FW-02'],
  ['Cross-cutting', 'Test data', 'Seeded data collisions or exhausted users in parallel runs', 'Medium', 'Medium', 'FW-03'],
  ['Cross-cutting', 'DB', 'Database access or schema not available for backend validation', 'Medium', 'Medium', 'DB-01..DB-10'],
];
// NOTE: the last five "Covered by" cells were free text in Submission 1 ("Framework config", "Health check, retries",
// "Unique data per test", "API-proxy fallback"). They are mapped here to the concrete framework test cases FW-01..FW-03
// and the DB cases so that the traceability is explicit - this is the only change versus the Submission 1 register.

const S = { High: 3, Medium: 2, Low: 1 };
const rating = (l, i) => {
  const v = S[l] * S[i];
  return v >= 9 ? 'Critical' : v >= 6 ? 'High' : v >= 3 ? 'Medium' : 'Low';
};

const risks = RISKS.map((r, i) => ({
  id: `R${String(i + 1).padStart(2, '0')}`,
  module: r[0],
  layer: r[1],
  risk: r[2],
  likelihood: r[3],
  impact: r[4],
  rating: rating(r[3], r[4]),
  coveredBy: r[5],
}));

/** "AUTH-V02, V06" -> ['AUTH-V02','AUTH-V06'];  "DB-01..DB-10" -> DB-01..DB-10. */
function expandCovered(text) {
  const out = [];
  let prefix = null;
  const range = text.match(/^DB-(\d+)\.\.DB-(\d+)$/);
  if (range) {
    for (let n = Number(range[1]); n <= Number(range[2]); n += 1) out.push(`DB-${String(n).padStart(2, '0')}`);
    return out;
  }
  for (const raw of text.split(',')) {
    const tok = raw.replace(/\(proposed\)/i, '').trim();
    let m = tok.match(/^([A-Z]+)-V(\d+)$/);
    if (m) {
      prefix = m[1];
      out.push(tok);
      continue;
    }
    m = tok.match(/^V(\d+)$/);
    if (m && prefix) {
      out.push(`${prefix}-V${m[1]}`);
      continue;
    }
    m = tok.match(/^(DB|FW)-(\d+)$/);
    if (m) out.push(tok);
  }
  return out;
}

/** scenario id -> ['R01', ...] */
const riskIndex = {};
for (const r of risks) {
  for (const s of expandCovered(r.coveredBy)) (riskIndex[s] = riskIndex[s] || []).push(r.id);
}

/** The 20 issues listed in the Problem Statement, in the order of QA plan section 2.7. */
const reportedIssues = [
  ['RI-01', 'Authentication', 'Valid agents cannot log in after authentication changes'],
  ['RI-02', 'Authentication', 'Locked or invalid agents get incorrect / misleading messages'],
  ['RI-03', 'Authentication', 'Password policy not consistently enforced'],
  ['RI-04', 'Client / KYC', 'Client age eligibility rules (18-65) missed'],
  ['RI-05', 'Client / KYC', 'Future date of birth accepted'],
  ['RI-06', 'Documents / Validation', 'Mandatory KYC documents not enforced'],
  ['RI-07', 'Client / KYC', 'SSN not masked properly'],
  ['RI-08', 'Client / KYC', 'Income vs premium affordability not applied'],
  ['RI-09', 'Product / Policy', 'Product eligibility not validated against age / suitability'],
  ['RI-10', 'Riders', 'Rider coverage exceeds base face value'],
  ['RI-11', 'Riders', 'Exclusive waiver riders both selectable'],
  ['RI-12', 'Product / Policy', 'Premium not updated after configuration change'],
  ['RI-13', 'Beneficiaries', 'Allocation below / above 100% allowed'],
  ['RI-14', 'Beneficiaries', 'Minor beneficiary guardian not required'],
  ['RI-15', 'Beneficiaries', 'Duplicate beneficiaries not blocked'],
  ['RI-16', 'Submission / Status', 'Draft data not persisted'],
  ['RI-17', 'Documents / Validation', 'Submit enabled despite validation errors'],
  ['RI-18', 'Dashboard', 'Dashboard status differs from backend status'],
  ['RI-19', 'Cross-cutting', 'API validation differs from UI validation'],
  ['RI-20', 'Cross-cutting', 'Failures hard to debug (no consistent evidence)'],
].map(([id, module, description]) => ({
  id,
  module,
  description,
  // The official seeded-defect catalog was not available in Submission 1 (assumption A04 / question Q05).
  // Fill in the catalog code here when it is received; reports and the Excel sheet pick it up automatically.
  catalogCode: '',
}));

module.exports = { risks, riskIndex, reportedIssues, expandCovered };
