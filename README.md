# Insurance Order Entry - Playwright QA Automation (Submission 2)

Playwright (JavaScript, page-object model) tests for the Whole Life agent order-entry platform, built on the Submission 1
study. 105 designed test cases (`test-design/Test_Case_Design_Sheet.xlsx`), 95 automated, 10 database checks blocked on access.

> **Status:** built and framework-verified, **not yet run against the real lab application**. Do step 0 first.

## 0. Explore the live application first (about 90 minutes)
The scripts guess routes, messages and limits that the documents never state. Resolve them by hand **before** trusting a run:

1. Walk the full journey once (login to submitted application) and note each step's URL and the exact validation wording.
2. Open the **Exploration Log** sheet: 15 items, each saying what to find and where to record it (`.env`, `config/`). Do `ROUTES`, `Q02`, `Q03`, `Q06` first.
3. `npm run discover` (add `-- --walk` to also record validation messages), then `npm run verify:selectors`. Fix `config/selectors.js` where a test id is wrong. Only `login-email/password/submit` are confirmed today.

Open items you leave undone make their tests **skip with a reason** instead of failing falsely.

## 1. Setup
```bash
npm install
npx playwright install --with-deps chromium
cp .env.example .env        # set INSURANCE_BASE_URL and the AGENT_* users; never commit .env
npm run health              # can THIS machine reach the lab? classifies ENVIRONMENT vs APPLICATION
npm run test:unit           # offline self-checks, no application needed
```

## 2. Running
| Command | What runs |
|---|---|
| `npm run test:smoke` | 14 fast tests: is the environment alive and the main path working |
| `npm run test:gate` | the **release gate**: 19 P1 scenarios that must pass for a release |
| `npm run test:regression` | everything (P1 + P2 + P3) |
| `npm run test:seeded` | the 38 checks that target a seeded-defect theme (RI-01..RI-20) |
| `npm run test:api` / `test:ui` / module scripts | by layer or module (`test:auth`, `test:client`, `test:product` ...) |
| `npm run report` | open the HTML report (`reports/html-report`) |

## 3. Priority policy
Submission 1 rated 52 of 105 scenarios P1, which stopped P1 meaning anything. **P1 now means release gate**: a failure blocks the
release. It is limited to 19 scenarios (see the *Release Gate* sheet for the reason each one qualifies); the rest are P2 regression
or P3. Smoke is a separate subset. Confirm the gate with your mentor / product owner.

## 4. Shared lab rules
- **One worker by default** (`WORKERS=1`). Parallel runs add load and collide on shared data. Raise it only after a stable single-worker baseline.
- **Reachability is checked, not assumed**: `npm run health` (also a CI step) fails fast. GitHub-hosted runners usually cannot reach a private lab IP; use a self-hosted runner or VPN (`.github/workflows/playwright.yml`).
- Runs against the lab are serialised in CI (`concurrency: lab-environment`). Retries are 1 in CI so flakiness stays visible.
- Destructive tests need **disposable** users: lockout (`AGENT_LOCKOUT_*`) and password reset (`AGENT_RESET_*`).

## 5. Sensitive data in evidence
1. **Synthetic data only**: 900-series SSNs (never issued), `@example.test` emails, generated names. A self-check enforces it.
2. **Masked screenshots**: the built-in Playwright screenshot is off; failures and seeded-defect checks attach a screenshot with SSN, ID, income, net worth, DOB and password fields painted over (`utils/evidence.js`).
3. **No trace or video for KYC/SSN tests**: they cannot be masked, so `tests/ui/client-kyc-sensitive.spec.js` (CLI-V08/V09/V10/V12) switches them off.
4. **API attachments are redacted** (`ssn`, `idNumber`, `token`, `password`, `income`, `dob` ...).
5. Reports (`reports/`) and sessions (`.auth/`) are git-ignored. Do not share a report from a run that used real data.

## 6. Structure
```
config/        env.js (only place that reads process.env), selectors.js, messages.js, endpoints.js, routes.js
pages/         one page object per screen (+ components/ValidationSummary.js)
fixtures/      session reuse per worker, automatic diagnostics, tc() helper
api/           ApiClient (bearer or session), payload helpers
utils/         dates (age boundaries), dataBuilder, files, flows, evidence, assertions
tests/         ui/ e2e/ api/ integration/ unit/        test-design/  registry, risks, exploration, Excel sheet
scripts/       healthcheck, discover-testids, verify-selectors, check-traceability, export-test-design, build_test_sheet.py
```
Titles, tags and risk / defect links of every test come from `test-design/testCases.js` via `test(...tc('AUTH-V01'), ...)`, so the Excel
sheet and the code cannot drift. `npm run check:traceability` fails on any orphan. Regenerate the sheet:
`npm run export:testdesign && python scripts/build_test_sheet.py`.

## 7. Run conditions (otherwise the test skips with a reason)
`AGENT_NEW/SECOND/MFA_EMAIL` (isolation, empty state, MFA) | `AGENT_LOCKOUT_EMAIL` (AUTH-V07) | `AGENT_RESET_EMAIL` + `OTP_CODE` (AUTH-V08/V12/V13) |
`FACE_VALUE_MIN/MAX` | `MAX_RIDERS` | `MAX_UPLOAD_MB` | `RIDER_*_PATTERN`, `SUITABILITY_PRODUCT_PATTERN`, `INELIGIBLE_AGE*` | `SESSION_TIMEOUT_SECONDS`.
Known defects already logged: `EXPECT_FAIL_DEFECTS=RI-05,RI-07` marks them expected-to-fail; the test goes red the day the defect is fixed.

## 8. Known limitations
Not yet run on the real app; selectors, API payload shapes and message wording unconfirmed; database layer blocked (Q04); Chromium primary
(Firefox/WebKit smoke with `CROSS_BROWSER=true`). Full list: *Limitations* sheet. Troubleshooting: timeouts on the first `goto` mean a stale
`INSURANCE_BASE_URL` (run `npm run health`); `Flow could not leave the step "X"` lists the on-screen messages that stopped it.

## 9. Merged from two projects

This repository is the Submission 2 build with the earlier 32-test starter project folded in.
- Lab facts the starter project confirmed (login testids, `X-API-Key` auth, seeded accounts, rider / upload limits, where an agent
  lands after login) are applied in `config/` and listed, with the still-open questions, in `docs/confirmed-environment-facts.md`.
- Old environment variable names (`BASE_URL`, `API_KEY`, `VALID_AGENT_EMAIL` ...) still work as fallbacks.
- The starter project itself is kept, not run, under `legacy/starter/`. Delete it when you no longer need to diff against it.
