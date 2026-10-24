/**
 * Seeded agent accounts — CONFIRMED from the platform's Setup Guide (Section 11),
 * not guessed. Default password for every fixed user is Password@123.
 *
 * Two additions vs. the original framework, now that we have real evidence:
 * - agent.draft@insurance.test / agent.submitted@insurance.test exist specifically
 *   to give DASH-V04 (resume draft) and status-tracking tests known starting states,
 *   rather than relying on whatever state agent.valid happens to be in.
 * - 30 learner accounts (learner001..learner030@insurance.test) exist. These are the
 *   right choice for the full E2E submission test (WF-V03), NOT agent.valid — see the
 *   isolation note in auth.fixture.js. Using a dedicated learner account per test run
 *   avoids colliding with another test (or another learner, on a shared lab) that's
 *   mid-flow on the same draft application.
 *
 * STILL UNCONFIRMED: whether any of these accounts have force_password_reset or a
 * stale password_changed_at (>90 days) set, which per BR-AUTH-004 would redirect
 * straight to /change-password instead of the expected post-login landing page.
 * If login tests unexpectedly land on a change-password form, this is why — check
 * that before assuming AUTH-V01 itself is broken.
 */
require('dotenv').config();

const DEFAULT_PASSWORD = 'Password@123';

module.exports = {
  validAgent: {
    email: process.env.VALID_AGENT_EMAIL || 'agent.valid@insurance.test',
    password: process.env.VALID_AGENT_PASSWORD || DEFAULT_PASSWORD,
  },
  newAgent: {
    email: process.env.NEW_AGENT_EMAIL || 'agent.new@insurance.test',
    password: process.env.NEW_AGENT_PASSWORD || DEFAULT_PASSWORD,
  },
  draftAgent: {
    // Confirmed seeded user with an existing draft application — use for DASH-V04
    // (resume draft) and anywhere a test needs a known non-empty draft state.
    email: process.env.DRAFT_AGENT_EMAIL || 'agent.draft@insurance.test',
    password: process.env.DRAFT_AGENT_PASSWORD || DEFAULT_PASSWORD,
  },
  submittedAgent: {
    // Confirmed seeded user with an existing submitted application — use for
    // WF-V04 (submitted application is read-only) and status-tracking tests.
    email: process.env.SUBMITTED_AGENT_EMAIL || 'agent.submitted@insurance.test',
    password: process.env.SUBMITTED_AGENT_PASSWORD || DEFAULT_PASSWORD,
  },
  lockedAgent: {
    email: process.env.LOCKED_AGENT_EMAIL || 'agent.locked@insurance.test',
    password: process.env.LOCKED_AGENT_PASSWORD || DEFAULT_PASSWORD,
  },
  mfaAgent: {
    email: process.env.MFA_AGENT_EMAIL || 'agent.mfa@insurance.test',
    password: process.env.MFA_AGENT_PASSWORD || DEFAULT_PASSWORD,
  },
  adminUser: {
    // Confirmed: admin lands on /dashboard after login (agents do not — see
    // auth.fixture.js). Also the right account for RBAC/403 checks in reverse
    // (agent hitting an admin-only route), per BR-AUTH-009's own open item.
    email: process.env.ADMIN_EMAIL || 'admin@insurance.test',
    password: process.env.ADMIN_PASSWORD || DEFAULT_PASSWORD,
  },
  invalidUser: {
    email: 'nonexistent.agent@insurance.test',
    password: 'WrongPassword999!',
  },

  /**
   * 30 confirmed learner accounts, learner001..learner030@insurance.test, same
   * default password. Use learnerAccount(n) to get a dedicated, presumably-clean
   * account for a full E2E run instead of sharing agent.valid across test runs.
   */
  learnerAccount(n) {
    const padded = String(n).padStart(3, '0');
    return {
      email: process.env[`LEARNER_${padded}_EMAIL`] || `learner${padded}@insurance.test`,
      password: process.env[`LEARNER_${padded}_PASSWORD`] || DEFAULT_PASSWORD,
    };
  },
};
