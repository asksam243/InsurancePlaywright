# Confirmed environment facts and open items

Carried over from the starter project (the 32-test cohort build) when it was merged into this repository.
The starter project had access to real platform documentation (Setup Guide, seeded-defect catalog, patch notes) that the
Submission 2 build was written without, so where the two disagreed, the starter project's confirmed value was adopted.

## Conflicts resolved by the merge

| Topic | Submission 2 build said | Starter project confirmed | Now |
|---|---|---|---|
| Login field testids | `login-email`, `login-password`, `login-submit` (marked CONFIRMED) | `login-email-input`, `login-password-input`, `login-submit-button`; the button text is "Login" | `config/selectors.js` uses the confirmed ids |
| Where an agent lands after login | `/dashboard` (AUTH-V01 asserted it) | An agent lands on `/applications/:id/client` (existing draft resumed, or a new one auto-created). Only admin lands on `/dashboard` (BR-AUTH-010) | AUTH-V01 asserts the client page |
| API authentication | `POST auth/login` then a bearer token (`API_AUTH_MODE=bearer`) | Every `/api/*` call is gated by a static `X-API-Key` header; no bearer login | `API_AUTH_MODE=key` is the default; a failed login call is not fatal in that mode |
| API key | empty by default | `qa-insurance-demo-token-123` (documented lab demo key) | Default in `config/env.js`; anonymous API clients still send no key, so API-V02 keeps working |
| Seeded users | only valid / locked / invalid; new, MFA, second were empty "Q06" | `agent.new`, `agent.mfa`, `agent.draft`, `agent.submitted`, `admin`, `learner001..030` @insurance.test, password `Password@123` | Defaults in `config/env.js`; `env.learnerAccount(n)` added |
| Max riders / upload size | TBC (Q15, Q17) | 4 riders (`DEMO_MAX_RIDERS_PER_APPLICATION`), 5 MB (`DEMO_DOCUMENT_MAX_SIZE_MB`) | Defaults 4 and 5 |
| Admin login | (no scenario) | Admin lands on `/dashboard` (starter test AUTH-V01b) | Added as AUTH-V14 |
| Env var names | `INSURANCE_BASE_URL`, `AGENT_VALID_EMAIL` ... | `BASE_URL`, `VALID_AGENT_EMAIL`, `API_KEY` ... | Both are read; the Submission 2 names win. `API_BASE_URL` is intentionally not aliased because it was the host root while `INSURANCE_API_URL` already includes `/api` |

## Still unconfirmed

- **Selectors other than login.** Error-message testids (`login-error-message`, `email-error`, `password-error`, `account-locked-message`),
  the MFA elements and every other page's ids are unverified. Run `npm run discover` then `npm run verify:selectors`.
- **Product / rider ids** used in payloads. Confirm with `GET /api/products` and `GET /api/riders`.
- **Whether agent-scoped endpoints need a session cookie as well as the API key** (open question Q03; API-V08 assumes they do).
  Try `API_AUTH_MODE=session` if `/api/applications` returns another agent's rows or a 401 in key mode.
- **Whether an agent can open `/dashboard` at all.** `utils/flows.js` `startApplication()` and the DASH-* scenarios do
  `pages.dashboard.goto()`, which asserts the URL contains `dashboard`. The starter project only proved that agents are not *landed* there.
  If the dashboard scenarios fail with a redirect to the client page, that is this, not a locator problem.
- **DASH-V03 (new agent sees an empty dashboard).** Because login resumes-or-creates a draft, `agent.new` may already have one after its
  first login, so the empty state may never appear.
- **Password governance.** If a seeded account has a stale `password_changed_at` (> 90 days) or a forced-reset flag, login redirects to a
  change-password form (BR-AUTH-004). If AUTH-V01 lands somewhere unexpected, check this before blaming the test.

## Seeded defects may be switched on

The lab can have specific defects toggled on (`SELECT defect_code FROM seeded_defects WHERE is_active = 1`). A failing test may be an
intentional seeded bug. The beginner-cohort set the starter project recorded: `DEF-AUTH-003`, `DEF-CLI-001`, `DEF-CLI-004`,
`DEF-ADDR-001`, `DEF-CONTACT-001`, `DEF-PROD-001/003`, `DEF-RIDER-001/003`, `DEF-BEN-001/003/005`, `DEF-DOC-002`, `DEF-WF-002/005`.
The starter project also noted that `DEF-AUTH-001`, if active, makes a locked user see a generic "Invalid credentials." message, which fails AUTH-V06.
Map these to the RI-01..RI-20 reported issues in `test-design/` and list the ones you have logged in `EXPECT_FAIL_DEFECTS`.

## Draft-state isolation

Login resumes-or-creates the agent's one draft, so two tests (or workers, or learners on the shared lab) logging in as the same agent share
that draft. Use `env.learnerAccount(n)` for flows that need a clean draft, or coordinate a `php artisan demo:reset` before a graded run.
The lockout test needs a disposable account (a real lock lasts `DEMO_LOCKOUT_MINUTES`, default 30).
