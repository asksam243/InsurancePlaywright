#!/usr/bin/env node
/**
 * Finds where the application's API really is.
 *
 * Why: a live run (and curl) showed HTTP 404 for <host>:8081/api/products and /api/applications, with a Laravel "Not Found" page.
 * The app is up, but there is no route at that path. This script
 *   1. signs in through the UI as LEARNER_USER and visits a few pages while recording every XHR / fetch / JSON request the
 *      PAGES THEMSELVES make (those are, by definition, real endpoints),
 *   2. scans the pages' HTML and scripts for "/api" strings,
 *   3. probes a list of likely API paths with the X-API-Key header,
 * and writes everything to discovery/api-calls.json. It only READS: it never creates or changes an application.
 *
 *   npm run discover:api
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');
const env = require('../config/env');
const { LoginPage } = require('../pages/LoginPage');

const OUT_DIR = path.join(__dirname, '..', 'discovery');
const pathOf = (u) => {
  try {
    const x = new URL(u);
    return `${x.pathname}${x.search ? '?…' : ''}`;
  } catch {
    return u;
  }
};

async function recordFromPages() {
  const calls = new Map(); // "METHOD path" -> { status, type }
  const apiStrings = new Set();
  const browser = await chromium.launch({ channel: env.browserChannel, executablePath: env.chromiumExecutablePath });
  const ctx = await browser.newContext({ baseURL: env.baseUrl });
  const page = await ctx.newPage();

  page.on('response', async (res) => {
    const req = res.request();
    const type = req.resourceType();
    const ct = res.headers()['content-type'] || '';
    if (['xhr', 'fetch'].includes(type) || /json/i.test(ct) || /\/api(\/|$)/i.test(res.url())) {
      calls.set(`${req.method()} ${pathOf(res.url())}`, { status: res.status(), type, contentType: ct.split(';')[0], keyHeaderSent: 'x-api-key' in req.headers() });
    }
  });

  const scan = async () => {
    const html = await page.content().catch(() => '');
    for (const m of html.matchAll(/["'`(=]\s*((?:https?:)?\/?[A-Za-z0-9_./:-]*\/api\/[A-Za-z0-9_./{}$:-]*)/g)) apiStrings.add(m[1].trim());
    for (const m of html.matchAll(/(?:fetch|axios\.(?:get|post)|\.ajax)\(\s*["'`]([^"'`]+)["'`]/g)) apiStrings.add(`call: ${m[1]}`);
  };

  const login = new LoginPage(page);
  await login.loginViaUi(env.users.learnerAgent);
  await login.expectLoggedIn();
  await page.waitForLoadState('networkidle').catch(() => {});
  await scan();
  const landing = page.url();
  const draftId = (landing.match(/\/applications\/(\d+)\//) || [])[1];

  const visits = ['/dashboard', '/products', '/applications/start'];
  if (draftId) {
    for (const step of ['client', 'address-contact', 'kyc-financial', 'product', 'riders', 'beneficiaries', 'documents', 'review']) visits.push(`/applications/${draftId}/${step}`);
  }
  for (const v of visits) {
    await page.goto(v).catch(() => {});
    await page.waitForLoadState('networkidle').catch(() => {});
    await scan();
  }
  await browser.close();
  return { calls: Object.fromEntries(calls), apiStrings: [...apiStrings], landing };
}

async function probe() {
  const u = new URL(env.baseUrl);
  const origin = `${u.protocol}//${u.host}`;
  const prefixes = ['/api', '/api/v1', '/index.php/api', '/public/api', '/insurance/api', '/api/insurance', ''];
  const leaves = ['health', 'products', 'riders', 'applications'];
  const headers = { Accept: 'application/json', 'X-API-Key': env.apiKey };
  const rows = [];
  for (const p of prefixes) {
    for (const l of leaves) {
      const url = `${origin}${p}/${l}`;
      try {
        const res = await fetch(url, { headers, redirect: 'manual', signal: AbortSignal.timeout(8000) });
        const ct = res.headers.get('content-type') || '';
        rows.push({ url, status: res.status, json: /json/i.test(ct) });
      } catch (e) {
        rows.push({ url, status: 'unreachable', json: false });
      }
    }
  }
  return rows;
}

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const result = { base: env.baseUrl, when: new Date().toISOString() };
  console.log(`[discover:api] base ${env.baseUrl}, signing in as ${env.users.learnerAgent.email}`);
  try {
    Object.assign(result, await recordFromPages());
    console.log('\n[discover:api] Requests the pages themselves made (XHR / fetch / JSON):');
    const entries = Object.entries(result.calls);
    if (!entries.length) console.log('  (none - the pages are server-rendered and make no background API calls)');
    for (const [k, v] of entries) console.log(`  ${String(v.status).padEnd(4)} ${k}   [${v.contentType || v.type}]`);
    console.log('\n[discover:api] "/api" strings found in the pages and scripts:');
    if (!result.apiStrings.length) console.log('  (none)');
    for (const s of result.apiStrings.slice(0, 40)) console.log(`  ${s}`);
  } catch (e) {
    console.log(`[discover:api] page recording failed: ${e.message}`);
    result.recordError = e.message;
  }
  console.log('\n[discover:api] Probing likely API paths with the X-API-Key header:');
  result.probe = await probe();
  for (const r of result.probe) console.log(`  ${String(r.status).padEnd(12)} ${r.json ? 'JSON ' : '     '} ${r.url}`);
  const hit = result.probe.filter((r) => r.status === 200 && r.json);
  console.log(hit.length
    ? `\n[discover:api] ANSWERS 200 JSON: ${hit.map((h) => h.url).join(', ')}\n  -> set INSURANCE_API_URL to the part before the last path segment.`
    : '\n[discover:api] No probed path answered 200 JSON. Send discovery/api-calls.json (and the output above) so the real endpoints can be read from it.');
  fs.writeFileSync(path.join(OUT_DIR, 'api-calls.json'), JSON.stringify(result, null, 2));
  console.log(`[discover:api] saved ${path.join('discovery', 'api-calls.json')}`);
})();
