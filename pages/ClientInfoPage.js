const { expect } = require('@playwright/test');
const { BasePage } = require('./BasePage');
const { S } = require('../config/selectors');

/** Step 3 - Client / Insured Information. */
class ClientInfoPage extends BasePage {
  async fill(c) {
    await this.fillField(S.client.firstName, c.firstName);
    await this.fillField(S.client.lastName, c.lastName);
    if (c.dob) await this.setDate(S.client.dob, c.dob);
    await this.choose(S.client.gender, c.gender);
    await this.choose(S.client.maritalStatus, c.maritalStatus);
    await this.choose(S.client.nationality, c.nationality);
    await this.fillField(S.client.occupation, c.occupation);
    await this.fillField(S.client.employer, c.employer);
  }

  async setDob(date) {
    await this.setDate(S.client.dob, date);
  }

  /** Displayed calculated age (text or input value), as a number, or NaN if not shown. */
  async displayedAge() {
    const el = this.$(S.client.age);
    if (!(await el.count())) return NaN;
    const tag = await el.evaluate((n) => n.tagName.toLowerCase());
    const raw = tag === 'input' ? await el.inputValue() : (await el.textContent()) || '';
    const m = raw.match(/\d+/);
    return m ? Number(m[0]) : NaN;
  }

  async expectAgeShown(expected) {
    await expect.poll(() => this.displayedAge(), { message: 'calculated age display' }).toBe(expected);
  }
}

module.exports = { ClientInfoPage };
