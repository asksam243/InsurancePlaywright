/**
 * Resolves a selector definition from config/selectors.js into a Playwright Locator.
 *
 * Strategy (matches the Submission 2 guidance "stable data-testid or role-based locators"):
 *   1. data-testid is tried first,
 *   2. then role/name, label and text fallbacks are OR-ed in via locator.or().
 * Because .or() is a union, a wrong guessed test id never breaks a test as long as the control
 * has an accessible label or role - and when the real test ids are confirmed they simply win.
 * No XPath chains and no positional CSS are used for form controls.
 */
function loc(scope, def) {
  if (typeof def === 'string') return scope.getByTestId(def);
  let l = scope.getByTestId(def.id);
  if (def.label) l = l.or(scope.getByLabel(def.label));
  if (def.role) l = l.or(scope.getByRole(def.role, def.name ? { name: def.name } : {}));
  if (def.placeholder) l = l.or(scope.getByPlaceholder(def.placeholder));
  if (def.text) l = l.or(scope.getByText(def.text));
  if (def.css) l = l.or(scope.locator(def.css));
  return l;
}

/** All elements whose data-testid starts with a prefix, e.g. application-row-*. */
const byPrefix = (scope, prefix) => scope.locator(`[data-testid^="${prefix}"]`);

module.exports = { loc, byPrefix };
