const { test, tc, expect, env } = require('../../fixtures');
const M = require('../../config/messages');
const { S } = require('../../config/selectors');
const { dobForAge, futureDate } = require('../../utils/dates');
const { buildAddress } = require('../../utils/dataBuilder');
const { progressTo } = require('../../utils/flows');
const { expectBlocked, expectAdvanced, captureEvidence } = require('../../utils/assertions');

const inclusive = env.rules.ageInclusive;

test.describe('Client / Insured Information', () => {
  test.use({ agentRole: 'learnerAgent' });

  test(...tc('CLI-V01'), async ({ pages }) => {
    const { data } = await progressTo(pages, 'client');
    const before = await pages.client.stepTitle();
    await pages.client.fill(data.client);
    await pages.client.next();
    await expectAdvanced(pages.client, before);
  });

  test(...tc('CLI-V02'), async ({ pages }) => {
    await progressTo(pages, 'client');
    const before = await pages.client.stepTitle();
    await pages.client.next();
    await pages.client.expectStillOnStep(before);
    for (const def of [S.client.firstName, S.client.lastName, S.client.dob]) {
      await pages.client.expectFieldError(def);
    }
  });

  test(...tc('CLI-V03'), async ({ pages, page }, testInfo) => {
    const { data } = await progressTo(pages, 'client');
    const before = await pages.client.stepTitle();
    await pages.client.fill({ ...data.client, dob: dobForAge(18, { dayOffset: 1 }) }); // turns 18 TOMORROW => age 17
    await test.step('age 17 is rejected', async () => {
      await pages.client.next();
      await expectBlocked(pages.client, before, M.dobUnderAge);
      await captureEvidence(page, testInfo, 'age-17-rejected');
    });
    await test.step(`age 18 is ${inclusive ? 'accepted' : 'rejected'} (inclusive=${inclusive})`, async () => {
      await pages.client.setDob(dobForAge(18));
      await pages.client.next();
      if (inclusive) await expectAdvanced(pages.client, before);
      else await expectBlocked(pages.client, before, M.dobUnderAge);
    });
  });

  test(...tc('CLI-V04'), async ({ pages, page }, testInfo) => {
    const { data } = await progressTo(pages, 'client');
    const before = await pages.client.stepTitle();
    await pages.client.fill({ ...data.client, dob: dobForAge(66) });
    await test.step('age 66 is rejected', async () => {
      await pages.client.next();
      await expectBlocked(pages.client, before, M.dobOverAge);
      await captureEvidence(page, testInfo, 'age-66-rejected');
    });
    await test.step(`age 65 is ${inclusive ? 'accepted' : 'rejected'} (inclusive=${inclusive})`, async () => {
      await pages.client.setDob(dobForAge(65));
      await pages.client.next();
      if (inclusive) await expectAdvanced(pages.client, before);
      else await expectBlocked(pages.client, before, M.dobOverAge);
    });
  });

  test(...tc('CLI-V05'), async ({ pages, page }, testInfo) => {
    const { data } = await progressTo(pages, 'client');
    const before = await pages.client.stepTitle();
    await pages.client.fill(data.client);
    for (const [label, date] of [['tomorrow', futureDate(1)], ['5 years ahead', futureDate(1825)]]) {
      await test.step(`future DOB (${label}) is rejected`, async () => {
        await pages.client.setDob(date);
        await pages.client.next();
        await expectBlocked(pages.client, before, M.dobFuture);
        await captureEvidence(page, testInfo, `future-dob-${label.replace(/\s/g, '-')}`);
      });
    }
  });

  test(...tc('CLI-V06'), async ({ pages }) => {
    await progressTo(pages, 'address');
    const a = buildAddress();
    await pages.address.fillResidential(a);
    await pages.address.setChecked(S.address.sameAsResidential, true);
    const mailing = await pages.address.mailingValues();
    expect(mailing).toEqual({ line1: a.line1, city: a.city, zip: a.zip });
  });

  test(...tc('CLI-V07'), async ({ pages }) => {
    await progressTo(pages, 'address');
    const before = await pages.address.stepTitle();
    const good = buildAddress();
    await pages.address.fillResidential(good);
    const bad = [
      ['email', 'plainaddress'], ['email', 'missing-domain@'], ['email', 'two@@example.test'], ['email', 'with space@example.test'],
      ['phone', 'abcdefghij'], ['phone', '123'],
    ];
    for (const [field, value] of bad) {
      await test.step(`invalid ${field} "${value}" is rejected`, async () => {
        await pages.address.fillContact({ ...good, [field]: value });
        await pages.address.next();
        await expectBlocked(pages.address, before, field === 'email' ? M.email : M.phone);
      });
    }
  });




  test(...tc('CLI-V11'), async ({ pages }) => {
    await progressTo(pages, 'address');
    const before = await pages.address.stepTitle();
    const good = buildAddress();
    for (const zip of ['ABCDE', '123', '0211000000']) {
      await test.step(`invalid ZIP "${zip}" is rejected`, async () => {
        await pages.address.fillResidential({ ...good, zip });
        await pages.address.fillContact(good);
        await pages.address.next();
        await expectBlocked(pages.address, before, M.zip);
      });
    }
  });


  test(...tc('CLI-V13'), async ({ pages }) => {
    await progressTo(pages, 'client');
    for (const age of [18, 35, 65]) {
      await test.step(`DOB for age ${age} shows age ${age}`, async () => {
        await pages.client.setDob(dobForAge(age));
        await pages.client.expectAgeShown(age);
      });
    }
  });

  test(...tc('CLI-V14'), async ({ pages }) => {
    const { data } = await progressTo(pages, 'client');
    const before = await pages.client.stepTitle();
    await pages.client.fill(data.client);
    await test.step('digits in first name are rejected', async () => {
      await pages.client.fillField(S.client.firstName, 'J0hn123');
      await pages.client.next();
      await expectBlocked(pages.client, before, M.name);
    });
    await test.step('special characters in last name are rejected', async () => {
      await pages.client.fillField(S.client.firstName, data.client.firstName);
      await pages.client.fillField(S.client.lastName, 'O@#$%');
      await pages.client.next();
      await expectBlocked(pages.client, before, M.name);
    });
  });

  test(...tc('CLI-V15'), async ({ pages }) => {
    await progressTo(pages, 'address');
    const before = await pages.address.stepTitle();
    await pages.address.fillResidential(buildAddress());
    await pages.address.fillContact(buildAddress());
    const state = pages.address.$(S.address.resState);
    const isSelect = (await state.evaluate((n) => n.tagName.toLowerCase())) === 'select';
    test.skip(isSelect && !(await state.locator('option[value=""]').count()), 'State control has no empty option to clear it with');
    if (isSelect) await state.selectOption('');
    else await state.fill('');
    await pages.address.next();
    await expectBlocked(pages.address, before, M.state);
  });
});
