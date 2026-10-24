/**
 * Date helpers. Dates of birth are CALCULATED relative to today so age-boundary tests never decay
 * (a hard-coded "1990-05-14" stops being a valid 35-year-old test the day after a birthday).
 * All maths is done in UTC to avoid DST / timezone off-by-one errors.
 */
const pad = (n) => String(n).padStart(2, '0');

function utcToday(today = new Date()) {
  return new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
}

function addDays(date, days) {
  const d = new Date(date.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

/**
 * Date of birth for a person who is exactly `age` years old today, shifted by `dayOffset` days.
 *   dobForAge(18)                  -> turned 18 today            (age 18)
 *   dobForAge(18, { dayOffset: 1 }) -> turns 18 TOMORROW          (age 17 - the "just under 18" boundary)
 *   dobForAge(65, { dayOffset: -1 })-> turned 65 yesterday        (age 65)
 */
function dobForAge(age, { dayOffset = 0, today = new Date() } = {}) {
  const t = utcToday(today);
  const y = t.getUTCFullYear() - age;
  let d = new Date(Date.UTC(y, t.getUTCMonth(), t.getUTCDate()));
  // 29 Feb in a non-leap target year rolls to 1 Mar; step back so the person is not a day too young.
  if (d.getUTCMonth() !== t.getUTCMonth()) d = addDays(d, -1);
  return addDays(d, dayOffset);
}

/** Age in whole years on `onDate` for a date of birth. */
function calcAge(dob, onDate = new Date()) {
  const t = utcToday(onDate);
  let age = t.getUTCFullYear() - dob.getUTCFullYear();
  const beforeBirthday =
    t.getUTCMonth() < dob.getUTCMonth() ||
    (t.getUTCMonth() === dob.getUTCMonth() && t.getUTCDate() < dob.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age;
}

function futureDate(days, today = new Date()) {
  return addDays(utcToday(today), days);
}

/** Formats a Date for the app's date input: iso = yyyy-mm-dd, us = mm/dd/yyyy, eu = dd/mm/yyyy. */
function formatDate(date, format = 'iso') {
  const y = date.getUTCFullYear();
  const m = pad(date.getUTCMonth() + 1);
  const d = pad(date.getUTCDate());
  if (format === 'us') return `${m}/${d}/${y}`;
  if (format === 'eu') return `${d}/${m}/${y}`;
  return `${y}-${m}-${d}`;
}

module.exports = { dobForAge, calcAge, futureDate, formatDate, addDays, utcToday };
