const { S } = require('../config/selectors');
const { loc } = require('../utils/locators');

/** Validation summary widget shown on the document / review screens (VAL-V01..V03). */
class ValidationSummary {
  constructor(page) {
    this.page = page;
  }
  get root() {
    return loc(this.page, S.review.validationSummary).first();
  }
  get items() {
    return loc(this.page, S.review.validationItems);
  }
  async texts() {
    const n = await this.items.count();
    const out = [];
    for (let i = 0; i < n; i += 1) out.push(((await this.items.nth(i).textContent()) || '').trim());
    return out;
  }
  async clickItem(index = 0) {
    await this.items.nth(index).click();
  }
}

module.exports = { ValidationSummary };
