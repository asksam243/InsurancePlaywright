/** Parses "$1,234.50", "USD 1,234", "1.234,50" style display text into a number. */
function parseMoney(text) {
  if (text === null || text === undefined) return NaN;
  const cleaned = String(text).replace(/[^0-9.,-]/g, '');
  if (!cleaned) return NaN;
  // European style "1.234,50": a comma followed by exactly 1-2 digits at the end is the decimal separator.
  if (/,\d{1,2}$/.test(cleaned) && cleaned.includes('.')) return parseFloat(cleaned.replace(/\./g, '').replace(',', '.'));
  return parseFloat(cleaned.replace(/,/g, ''));
}

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = { parseMoney, escapeRegex };
