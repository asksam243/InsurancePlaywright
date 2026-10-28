#!/usr/bin/env node
/**
 * Pre-run environment health check (risk R40 "shared lab instability").
 * Classifies a failure as ENVIRONMENT (network, DNS, timeout, 5xx, SSO redirect) or APPLICATION so that an unreachable
 * lab VM is never mistaken for a product defect. Exit code 0 = reachable, 1 = environment problem.
 *
 *   npm run health
 */
const env = require('../config/env');

/** @param {{status?:number, error?:Error|string, redirectedTo?:string}} outcome */
function classify({ status, error, redirectedTo } = {}) {
  if (error) {
    const msg = String(error.message || error);
    if (/ECONNREFUSED|ENOTFOUND|EAI_AGAIN|ETIMEDOUT|timeout|fetch failed|network/i.test(msg)) return { kind: 'ENVIRONMENT', reason: `Cannot reach the application: ${msg}` };
    return { kind: 'ENVIRONMENT', reason: msg };
  }
  if (redirectedTo && /sso|okta|login\.microsoftonline|saml|adfs/i.test(redirectedTo)) return { kind: 'ENVIRONMENT', reason: `Redirected to SSO (${redirectedTo}); the lab VM must be reachable without corporate SSO` };
  if (status >= 500) return { kind: 'ENVIRONMENT', reason: `Server error HTTP ${status} on the login page` };
  if (status === 404) return { kind: 'ENVIRONMENT', reason: 'Login page not found (404): check INSURANCE_BASE_URL and the port (:8081)' };
  if (status >= 200 && status < 400) return { kind: 'OK', reason: `Login page reachable (HTTP ${status})` };
  return { kind: 'APPLICATION', reason: `Unexpected HTTP ${status}` };
}

/**
 * The API is gated by a static key and may live on a different port from the UI (the platform Setup Guide documents
 * :8000/api, the UI is proxied on :8081). A live smoke run returned HTTP 404 for every API call, which means the configured
 * base URL does not serve the API. This probes the usual candidates and says which one answers.
 */
async function probeApi() {
  const u = new URL(env.baseUrl);
  const host = `${u.protocol}//${u.hostname}`;
  const candidates = [...new Set([env.apiBaseUrl, `${host}:8000/api/`, `${host}:8081/api/`, `${host}:8082/api/`, `${host}${u.port ? `:${u.port}` : ''}/api/`])];
  const headers = { Accept: 'application/json', 'X-API-Key': env.apiKey };
  let working = null;
  console.log('[health] API probe (GET <base>health and <base>products with the X-API-Key header):');
  for (const base of candidates) {
    const row = [];
    for (const path of ['health', 'products']) {
      try {
        const res = await fetch(`${base}${path}`, { headers, redirect: 'manual', signal: AbortSignal.timeout(8000) });
        row.push(`${path}=${res.status}`);
        if (res.status === 200 && !working) working = base;
      } catch (e) {
        row.push(`${path}=${/ECONNREFUSED|ENOTFOUND|timeout|fetch failed/i.test(String(e.cause || e.message)) ? 'unreachable' : 'error'}`);
      }
    }
    console.log(`[health]   ${base === env.apiBaseUrl ? '(configured) ' : '             '}${base}  ${row.join('  ')}`);
  }
  if (!working) console.log('[health] API: no candidate answered 200. Ask for the API base URL, or check the X-API-Key value.');
  else if (working !== env.apiBaseUrl) console.log(`[health] API: the configured base URL does NOT serve the API. Put this in .env:\n[health]   INSURANCE_API_URL=${working.replace(/\/$/, '')}`);
  else console.log('[health] API: the configured base URL serves the API.');
}

async function main() {
  const url = `${env.baseUrl}/login`;
  let outcome;
  try {
    const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(15000) });
    outcome = { status: res.status, redirectedTo: res.url !== url ? res.url : undefined };
  } catch (error) {
    outcome = { error };
  }
  const result = classify(outcome);
  console.log(`[health] ${url}\n[health] ${result.kind}: ${result.reason}`);
  if (result.kind === 'OK') await probeApi();
  process.exit(result.kind === 'OK' ? 0 : 1);
}

if (require.main === module) main();
module.exports = { classify, probeApi };
