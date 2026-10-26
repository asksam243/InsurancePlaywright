const { test, tc, expect } = require('../../fixtures');
const M = require('../../config/messages');
const { S } = require('../../config/selectors');
const { dobForAge } = require('../../utils/dates');
const { buildBeneficiary } = require('../../utils/dataBuilder');
const { progressTo } = require('../../utils/flows');
const { expectBlocked, expectAdvanced, captureEvidence } = require('../../utils/assertions');

test.describe('Beneficiary Management', () => {
  test.use({ agentRole: 'learnerAgent' });

  test(...tc('BEN-V01'), async ({ pages }) => {
    await progressTo(pages, 'beneficiaries');
    const b = buildBeneficiary({ allocation: 100 });
    await pages.beneficiary.add(b);
    await expect(pages.beneficiary.rows).toHaveCount(1);
    await expect(pages.beneficiary.rows.first()).toContainText(b.name);
  });

  test(...tc('BEN-V02'), async ({ pages, page }, testInfo) => {
    await progressTo(pages, 'beneficiaries');
    const before = await pages.beneficiary.stepTitle();
    await pages.beneficiary.add(buildBeneficiary({ allocation: 60 }));
    await test.step('primary total 60% blocks Next', async () => {
      await pages.beneficiary.next();
      await expectBlocked(pages.beneficiary, before, M.allocation);
      await captureEvidence(page, testInfo, 'allocation-60');
    });
    await test.step('primary total 99% blocks Next', async () => {
      await pages.beneficiary.remove(0);
      await pages.beneficiary.add(buildBeneficiary({ allocation: 99 }));
      await pages.beneficiary.next();
      await expectBlocked(pages.beneficiary, before, M.allocation);
    });
  });

  test(...tc('BEN-V03'), async ({ pages, page }, testInfo) => {
    await progressTo(pages, 'beneficiaries');
    const before = await pages.beneficiary.stepTitle();
    await pages.beneficiary.add(buildBeneficiary({ allocation: 60 }));
    await pages.beneficiary.add(buildBeneficiary({ allocation: 60 }));
    await pages.beneficiary.next();
    await captureEvidence(page, testInfo, 'allocation-120');
    await expectBlocked(pages.beneficiary, before, M.allocation);
  });

  test(...tc('BEN-V04'), async ({ pages }) => {
    await progressTo(pages, 'beneficiaries');
    const before = await pages.beneficiary.stepTitle();
    await pages.beneficiary.add(buildBeneficiary({ allocation: 100 }));
    await pages.beneficiary.add(buildBeneficiary({ designation: 'Secondary', allocation: 50 }));
    await test.step('secondary total 50% blocks Next', async () => {
      await pages.beneficiary.next();
      await expectBlocked(pages.beneficiary, before, M.allocation);
    });
    await test.step('secondary total 100% lets Next proceed', async () => {
      await pages.beneficiary.add(buildBeneficiary({ designation: 'Secondary', allocation: 50 }));
      await pages.beneficiary.next();
      await expectAdvanced(pages.beneficiary, before);
    });
  });

  test(...tc('BEN-V05'), async ({ pages, page }, testInfo) => {
    await progressTo(pages, 'beneficiaries');
    const before = await pages.beneficiary.stepTitle();
    const minor = buildBeneficiary({ dob: dobForAge(10), relationship: 'Child', allocation: 100 });
    await test.step('minor WITHOUT guardian is refused', async () => {
      await pages.beneficiary.add(minor);
      await pages.beneficiary.next();
      await captureEvidence(page, testInfo, 'minor-without-guardian');
      await pages.beneficiary.expectErrorText(M.guardian);
      await pages.beneficiary.expectStillOnStep(before);
    });
    await test.step('minor WITH guardian is accepted', async () => {
      await pages.beneficiary.fillForm({ ...minor, guardianName: 'Gina Guardian', guardianRelationship: 'Parent' });
      await pages.beneficiary.$(S.beneficiary.save).click();
      await pages.beneficiary.next();
      await expectAdvanced(pages.beneficiary, before);
    });
  });

  test(...tc('BEN-V06'), async ({ pages }) => {
    await progressTo(pages, 'beneficiaries');
    await pages.beneficiary.openForm();
    await pages.beneficiary.choose(S.beneficiary.type, 'Trust');
    for (const def of [S.beneficiary.trustName, S.beneficiary.trusteeName, S.beneficiary.trustDate]) {
      await expect(pages.beneficiary.$(def), def.id).toBeVisible();
    }
  });

  test(...tc('BEN-V07'), async ({ pages }) => {
    await progressTo(pages, 'beneficiaries');
    await pages.beneficiary.openForm();
    await pages.beneficiary.choose(S.beneficiary.type, 'Organization');
    for (const def of [S.beneficiary.orgName, S.beneficiary.orgRegistration, S.beneficiary.orgContact]) {
      await expect(pages.beneficiary.$(def), def.id).toBeVisible();
    }
  });

  test(...tc('BEN-V08'), async ({ pages, page }, testInfo) => {
    await progressTo(pages, 'beneficiaries');
    const first = buildBeneficiary({ allocation: 50 });
    await pages.beneficiary.add(first);
    await pages.beneficiary.add({ ...first }); // same Name + DOB + Relationship
    await captureEvidence(page, testInfo, 'duplicate-beneficiary');
    await pages.beneficiary.expectErrorText(M.duplicate);
    await expect(pages.beneficiary.rows).toHaveCount(1);
  });

  test(...tc('BEN-V09'), async ({ pages }) => {
    await progressTo(pages, 'beneficiaries');
    await pages.beneficiary.add(buildBeneficiary({ allocation: 60 }));
    await pages.beneficiary.add(buildBeneficiary({ allocation: 40 }));
    await expect(pages.beneficiary.rows).toHaveCount(2);
    await pages.beneficiary.remove(0);
    await expect(pages.beneficiary.rows).toHaveCount(1);
    const { primary } = await pages.beneficiary.totals();
    if (!Number.isNaN(primary)) expect(primary).toBe(40);
  });

  test(...tc('BEN-V10'), async ({ pages }) => {
    await progressTo(pages, 'beneficiaries');
    const before = await pages.beneficiary.stepTitle();
    await test.step('no beneficiaries blocks Next', async () => {
      await pages.beneficiary.next();
      await expectBlocked(pages.beneficiary, before, M.primaryRequired);
    });
    await test.step('only a secondary beneficiary blocks Next', async () => {
      await pages.beneficiary.add(buildBeneficiary({ designation: 'Secondary', allocation: 100 }));
      await pages.beneficiary.next();
      await expectBlocked(pages.beneficiary, before, M.primaryRequired);
    });
  });

  test(...tc('BEN-V11'), async ({ pages }) => {
    await progressTo(pages, 'beneficiaries');
    // The real app asks with a NATIVE browser confirm() (not an HTML modal): capture its text, then accept it.
    const b = buildBeneficiary({ irrevocable: true });
    const { dialogs } = await pages.beneficiary.add(b, 'accept');
    expect(dialogs.join(' | '), 'a confirmation dialog mentioning irrevocable').toMatch(/irrevocable/i);
    await expect(pages.beneficiary.rows).toHaveCount(1);
  });
});
