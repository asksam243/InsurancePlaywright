/**
 * Expected message patterns. Exact wording is NOT in the source documents (Q-list), so these are
 * deliberately loose regexes. Tighten them to the exact copy once the product owner confirms it -
 * this is the only file that needs to change.
 */
module.exports = {
  invalidCredentials: /invalid credentials|invalid|incorrect|wrong|do(es)? not match/i,
  accountLocked: /account is locked|account locked|lock/i,
  required: /required|must (not )?be (blank|empty)|cannot be (blank|empty)|please (enter|select|provide)/i,
  dobUnderAge: /age must be between 18 and 65|at least 18 years|18|minimum age|under ?age|too young|not eligible|eligib/i,
  dobOverAge: /age must be between 18 and 65|not older than 65|65|maximum age|too old|not eligible|eligib/i,
  dobFuture: /future date of birth is not allowed|future|invalid|cannot be after|valid date/i,
  name: /invalid|letters|alphabet|special|not allowed|valid name/i,
  email: /email|e-mail|valid/i,
  phone: /valid US phone number|phone|mobile|valid|digits/i,
  zip: /ZIP code must be in 12345 or 12345-6789 format|zip|postal|valid|digits/i,
  state: /state|required|select/i,
  fileType: /unsupported document format|type|format|unsupported|not allowed|pdf|jpg|png/i,
  fileSize: /size exceeds the allowed limit|size|large|exceed|limit|mb/i,
  allocation: /allocation must total exactly 100|cannot exceed 100|100|allocation|total|percent/i,
  guardian: /guardian details are required|guardian/i,
  duplicate: /duplicate|already (added|exists)|same beneficiary/i,
  riderExceeds: /cannot exceed base policy sum assured|exceed|greater than|more than|face value|coverage/i,
  riderExclusive: /mutually exclusive|only one.*waiver|exclusive|cannot (be )?(select|combine|add)|already|not allowed/i,
  riderMax: /(maximum|more than|no more than|at most).*(4|four)|maximum|max|limit|no more than/i,
  affordability: /afford|20\s?%|exceed.*income|income|premium/i,
  suitability: /suitab|risk (profile|tolerance)|mismatch/i,
  eligibility: /eligib|age/i,
  passwordPolicy: /password|characters|uppercase|lowercase|number|special|weak|policy/i,
  passwordReuse: /same|reuse|previous|different|current/i,
  otpInvalid: /otp|code|invalid|incorrect|expired/i,
  mandatoryDocument: /KYC[_ ]ID.*(required|not been uploaded)|required document|document|required|mandatory|missing|upload/i,
  faceValueLimit: /minimum|maximum|between|limit|face value|sum assured/i,
  primaryRequired: /at least one primary beneficiary is required|primary|at least one|required|beneficiar/i,
  submitted: /submitted|success|thank|received|reference/i,
  unauthorized: /unauthorized/i,
  referenceNumber: /^WL\d{13}$/, // WL + yyyymmdd + 5 digits
};
