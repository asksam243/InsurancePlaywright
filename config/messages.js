/**
 * Expected message patterns. Exact wording is NOT in the source documents (Q-list), so these are
 * deliberately loose regexes. Tighten them to the exact copy once the product owner confirms it -
 * this is the only file that needs to change.
 */
module.exports = {
  invalidCredentials: /invalid|incorrect|wrong|do(es)? not match/i,
  accountLocked: /lock/i,
  required: /required|must (not )?be (blank|empty)|cannot be (blank|empty)|please (enter|select|provide)/i,
  dobUnderAge: /18|minimum age|under ?age|too young|not eligible|eligib/i,
  dobOverAge: /65|maximum age|too old|not eligible|eligib/i,
  dobFuture: /future|invalid|cannot be after|valid date/i,
  name: /invalid|letters|alphabet|special|not allowed|valid name/i,
  email: /email|e-mail|valid/i,
  phone: /phone|mobile|valid|digits/i,
  zip: /zip|postal|valid|digits/i,
  state: /state|required|select/i,
  fileType: /type|format|unsupported|not allowed|pdf|jpg|png/i,
  fileSize: /size|large|exceed|limit|mb/i,
  allocation: /100|allocation|total|percent/i,
  guardian: /guardian/i,
  duplicate: /duplicate|already (added|exists)|same beneficiary/i,
  riderExceeds: /exceed|greater than|more than|face value|coverage/i,
  riderExclusive: /exclusive|cannot (be )?(select|combine|add)|already|not allowed/i,
  riderMax: /maximum|max|limit|no more than/i,
  affordability: /afford|income|premium/i,
  suitability: /suitab|risk (profile|tolerance)|mismatch/i,
  eligibility: /eligib|age/i,
  passwordPolicy: /password|characters|uppercase|lowercase|number|special|weak|policy/i,
  passwordReuse: /same|reuse|previous|different|current/i,
  otpInvalid: /otp|code|invalid|incorrect|expired/i,
  mandatoryDocument: /document|required|mandatory|missing|upload/i,
  faceValueLimit: /minimum|maximum|between|limit|face value|sum assured/i,
  primaryRequired: /primary|at least one|required|beneficiar/i,
  submitted: /submitted|success|thank|received|reference/i,
};
