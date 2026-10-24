const { test, tc, expect, env } = require('../../fixtures');
const { PageManager } = require('../../pages');
const { S } = require('../../config/selectors');
const { buildClient } = require('../../utils/dataBuilder');
const { startApplication } = require('../../utils/flows');

test.describe('Agent Dashboard', () => {
  test.use({ agentRole: 'validAgent' });

  test(...tc('DASH-V01'), async ({ pages }) => {
    await pages.dashboard.goto();
    await expect(pages.dashboard.newApplicationControl).toBeVisible();
    for (const def of [S.dashboard.draftCount, S.dashboard.submittedCount]) {
      const el = pages.dashboard.$(def);
      if (await el.count()) await expect(el).toHaveText(/\d+/);
    }
  });

  test(...tc('DASH-V04'), async ({ pages }) => {
    const id = await startApplication(pages);
    const client = buildClient();
    await pages.client.fill(client);
    await pages.client.saveDraft();
    await pages.dashboard.goto();
    const row = pages.dashboard.rowForApplication({ name: client.lastName, id });
    await expect(row, 'saved draft should be listed on the dashboard').toBeVisible();
    await pages.dashboard.resume(row);
    await expect(pages.client.$(S.client.firstName)).toHaveValue(client.firstName);
  });

  test(...tc('DASH-V05'), async ({ pages }) => {
    await pages.dashboard.goto();
    for (const status of ['Draft', 'Submitted', 'Approved']) {
      await test.step(`filter = ${status}`, async () => {
        await pages.dashboard.filterByStatus(status);
        for (const s of await pages.dashboard.statuses()) {
          expect.soft(s, `row status under filter "${status}"`).toContain(status.toLowerCase());
        }
      });
    }
  });

  test(...tc('DASH-V07'), async ({ pages }) => {
    await pages.dashboard.goto();
    test.skip((await pages.dashboard.rows.count()) === 0, 'No applications to search for');
    const term = ((await pages.dashboard.rows.first().innerText()) || '').split(/\s+/).find((w) => /^[A-Za-z0-9-]{4,}$/.test(w));
    test.skip(!term, 'No searchable token found in the first row');
    await pages.dashboard.search(term);
    await expect(pages.dashboard.rows.first()).toBeVisible();
    const n = await pages.dashboard.rows.count();
    for (let i = 0; i < n; i += 1) await expect.soft(pages.dashboard.rows.nth(i)).toContainText(term, { ignoreCase: true });
  });

  test.describe('multi-agent isolation', () => {
    test.skip(!env.users.secondAgent.email, 'Set AGENT_SECOND_EMAIL to run the isolation test (Q06)');

    const keysOf = async (pm) => {
      await pm.dashboard.goto();
      const n = await pm.dashboard.rows.count();
      const keys = [];
      for (let i = 0; i < n; i += 1) {
        const row = pm.dashboard.rows.nth(i);
        keys.push((await pm.dashboard.rowId(row)) || (await row.innerText()).replace(/\s+/g, ' ').trim());
      }
      return keys;
    };

    test(...tc('DASH-V02'), async ({ pages, browser }) => {
      const ctxB = await browser.newContext({ baseURL: env.baseUrl });
      try {
        const pmB = new PageManager(await ctxB.newPage());
        await pmB.login.loginViaUi(env.users.secondAgent);
        await pmB.login.expectLoggedIn();
        const a = await keysOf(pages);
        const b = await keysOf(pmB);
        test.skip(!a.length || !b.length, 'Both agents need at least one application to compare');
        expect(a.filter((k) => b.includes(k)), 'applications visible to BOTH agents').toEqual([]);
      } finally {
        await ctxB.close();
      }
    });
  });
});

test.describe('Agent Dashboard - new agent', () => {
  test.use({ agentRole: 'newAgent' });
  test.skip(!env.users.newAgent.email, 'Set AGENT_NEW_EMAIL to run the empty-state test (Q06)');

  test(...tc('DASH-V03'), async ({ pages }) => {
    await pages.dashboard.goto();
    await expect(pages.dashboard.$(S.dashboard.emptyState)).toBeVisible();
    await expect(pages.dashboard.newApplicationControl).toBeVisible();
    await expect(pages.dashboard.rows).toHaveCount(0);
  });
});
