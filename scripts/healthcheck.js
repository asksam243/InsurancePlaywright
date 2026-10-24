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
  process.exit(result.kind === 'OK' ? 0 : 1);
}

if (require.main === module) main();
module.exports = { classify };
