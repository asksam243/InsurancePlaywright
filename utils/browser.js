/**
 * Browser-behaviour helpers for facts about the REAL application (third project's README, section 5):
 *  - over-allocation uses alert() and the irrevocable designation uses confirm() (native dialogs, not HTML modals)
 *  - forms use HTML `required`, which blocks blank submissions before the server sees them
 *  - <select> option VALUES are enums or ids; the visible TEXT is a name (e.g. the product dropdown)
 */

/** Runs `action` while answering native alert()/confirm() dialogs. Returns the dialog messages seen. */
async function withDialogs(page, action, decision = 'accept') {
  const messages = [];
  const handler = async (d) => {
    messages.push(d.message());
    if (decision === 'accept') await d.accept();
    else await d.dismiss();
  };
  page.on('dialog', handler);
  try {
    await action();
  } finally {
    page.off('dialog', handler);
  }
  return messages;
}

/** Switches browser validation off on every form so SERVER-side messages can be reached. */
async function disableBrowserValidation(page) {
  await page.locator('form').evaluateAll((forms) => forms.forEach((f) => { f.noValidate = true; }));
}

/** True when the browser itself reports the field invalid (e.g. required but empty). */
const isNativelyInvalid = (locator) => locator.evaluate((el) => !el.checkValidity());

/** { value, text } of every <option>. */
async function options(select) {
  return select.locator('option').evaluateAll((els) => els.map((e) => ({ value: e.value, text: (e.textContent || '').trim() })));
}

/** Selects the first non-placeholder option whose visible text matches (string = contains, RegExp = test). */
async function selectByText(select, pattern) {
  const list = (await options(select)).filter((o) => o.value !== '');
  const match = pattern
    ? list.find((o) => (typeof pattern === 'string' ? o.text.toLowerCase().includes(pattern.toLowerCase()) : pattern.test(o.text)))
    : list[0];
  if (!match) throw new Error(`No option matching ${pattern}. Options: ${list.map((o) => o.text).join(' | ')}`);
  await select.selectOption(match.value);
  return match.text;
}

module.exports = { withDialogs, disableBrowserValidation, isNativelyInvalid, options, selectByText };
