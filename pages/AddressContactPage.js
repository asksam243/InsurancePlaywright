const { BasePage } = require('./BasePage');
const { S } = require('../config/selectors');

/** Step 4 - Address and Contact. */
class AddressContactPage extends BasePage {
  async fillResidential(a) {
    await this.fillField(S.address.resLine1, a.line1);
    await this.fillField(S.address.resCity, a.city);
    await this.choose(S.address.resState, a.state);
    await this.fillField(S.address.resZip, a.zip);
  }

  async fillContact(a) {
    await this.fillField(S.address.email, a.email);
    await this.fillField(S.address.phone, a.phone);
  }

  /** Fills the whole step; mailing address is copied via same-as-residential. */
  async fill(a) {
    await this.fillResidential(a);
    await this.fillContact(a);
    if (await this.$(S.address.sameAsResidential).count()) await this.setChecked(S.address.sameAsResidential, true);
  }

  /** Values currently in the mailing address fields. */
  async mailingValues() {
    return {
      line1: await this.getValue(S.address.mailLine1),
      city: await this.getValue(S.address.mailCity),
      zip: await this.getValue(S.address.mailZip),
    };
  }
}

module.exports = { AddressContactPage };
