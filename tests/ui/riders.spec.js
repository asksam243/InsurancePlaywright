const { test, tc, expect, env } = require('../../fixtures');
const M = require('../../config/messages');
const { dobForAge } = require('../../utils/dates');
const { buildClient } = require('../../utils/dataBuilder');
const { progressTo, finishFrom } = require('../../utils/flows');
const { captureEvidence } = require('../../utils/assertions');

const r = env.rules;
const adb = r.patterns.riderAdb;

test.describe('Rider Selection', () => {
  test.use({ agentRole: 'learnerAgent' });

  const needRider = async (pages, pattern, label) => {
    test.skip(!(await pages.rider.cardFor(pattern).count()), `No ${label} rider offered in this environment`);
  };

  test(...tc('RIDER-V01'), async ({ pages }, testInfo) => {
    const { data } = await progressTo(pages, 'riders');
    await needRider(pages, adb, 'ADB');
    await pages.rider.add(adb, data.product.faceValue);
    await pages.rider.saveAndReopen(); // the rider premium summary is calculated on save, not while ticking
    expect(await pages.rider.isAdded(adb), 'the rider is still selected after saving').toBe(true);
    try {
      await expect.poll(() => pages.rider.riderPremiumSummary(), { message: 'rider premium in the summary' }).toBeGreaterThan(0);
    } catch (e) {
      // Attach exactly what the page showed, so the cause (no summary element, a zero premium, a different label) is visible in the report.
      await testInfo.attach('rider-premium-diagnostics', { body: await pages.rider.premiumDiagnostics(), contentType: 'text/plain' });
      throw e;
    }
  });

  test(...tc('RIDER-V02'), async ({ pages, page }, testInfo) => {
    const { data } = await progressTo(pages, 'riders');
    await needRider(pages, adb, 'ADB');
    await pages.rider.add(adb);
    await pages.rider.setCoverage(adb, data.product.faceValue + 1);
    await pages.rider.next(); // the rule is enforced on Save & Continue
    await captureEvidence(page, testInfo, 'rider-coverage-above-face-value');
    await pages.rider.expectErrorText(M.riderExceeds);
  });

  test(...tc('RIDER-V03'), async ({ pages }) => {
    test.skip(!r.patterns.riderAgeRestricted, 'Set RIDER_AGE_RESTRICTED_PATTERN to run (Q15)');
    await progressTo(pages, 'riders', { client: buildClient({ dob: dobForAge(64) }) });
    const pattern = r.patterns.riderAgeRestricted;
    await needRider(pages, pattern, 'age-restricted');
    if (await pages.rider.isDisabled(pattern)) return; // disabled == correctly blocked
    await pages.rider.add(pattern);
    await pages.rider.expectErrorText(M.eligibility);
  });

  test(...tc('RIDER-V04'), async ({ pages }) => {
    test.skip(r.maxRiders === null, 'Set MAX_RIDERS to run (Q15)');
    await progressTo(pages, 'riders');
    // Pick riders that cannot trip OTHER rules (waiver riders are mutually exclusive; some riders are age-restricted),
    // so the only rule that can refuse the extra rider is the maximum count.
    const n = await pages.rider.cards.count();
    const usable = [];
    for (let i = 0; i < n; i += 1) {
      const text = (await pages.rider.cards.nth(i).innerText()) || '';
      if (/waiver/i.test(text) || (r.patterns.riderAgeRestricted && r.patterns.riderAgeRestricted.test(text))) continue;
      usable.push(i);
    }
    test.skip(usable.length <= r.maxRiders, `Only ${usable.length} non-exclusive rider(s) offered; need more than MAX_RIDERS=${r.maxRiders}`);
    for (const i of usable.slice(0, r.maxRiders)) await pages.rider.addAt(i);
    const extra = pages.rider.toggleAt(usable[r.maxRiders]);
    if (await extra.isDisabled()) return; // disabled == correctly blocked
    await pages.rider.addAt(usable[r.maxRiders]);
    await pages.rider.expectErrorText(M.riderMax);
  });

  test(...tc('RIDER-V05'), async ({ pages, page }, testInfo) => {
    const { riderWaiverA: waiverA, riderWaiverB: waiverB } = r.patterns;
    test.skip(!waiverA || !waiverB, 'Set RIDER_WAIVER_A_PATTERN and RIDER_WAIVER_B_PATTERN to run (Q15)');
    await progressTo(pages, 'riders');
    await needRider(pages, waiverA, 'waiver A');
    await needRider(pages, waiverB, 'waiver B');
    await pages.rider.add(waiverA);
    if (!(await pages.rider.isDisabled(waiverB))) {
      await pages.rider.add(waiverB).catch(() => {});
      await pages.rider.expectErrorText(M.riderExclusive);
    }
    await captureEvidence(page, testInfo, 'exclusive-waiver-riders');
    const both = (await pages.rider.isAdded(waiverA)) && (await pages.rider.isAdded(waiverB));
    expect(both, 'mutually exclusive waiver riders must not both be selected').toBe(false);
  });

  test(...tc('RIDER-V06'), async ({ pages }) => {
    await progressTo(pages, 'riders');
    const ci = r.patterns.riderCriticalIllness;
    await needRider(pages, ci, 'critical illness');
    await pages.rider.add(ci);
    await expect(pages.rider.questionnaire).toBeVisible();
  });

  test(...tc('RIDER-V07'), async ({ pages, page }, testInfo) => {
    const { data } = await progressTo(pages, 'riders');
    await needRider(pages, adb, 'ADB');
    await pages.rider.add(adb, data.product.faceValue);
    await pages.rider.next();
    await finishFrom(pages, 'beneficiaries', data);
    // The review snapshot itemises Base Policy Premium, Rider Premium and Total Modal Premium (live finding).
    await captureEvidence(page, testInfo, 'rider-premium-itemised');
    const { base, rider, total } = await pages.review.premiumBreakdown();
    expect(base, 'base premium on review').toBeGreaterThan(0);
    expect(rider, 'rider premium itemised on review').toBeGreaterThan(0);
    expect(total, 'total = base + rider premium').toBeCloseTo(base + rider, 2);
  });
});
