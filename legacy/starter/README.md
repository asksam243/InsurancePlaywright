# Insurance Order Entry — Playwright/JavaScript QA Automation

Playwright automation for the Insurance Order Entry platform (MassMutual India tech forum
project), covering agent authentication, client intake, product/rider configuration,
beneficiary management, document upload, full application submission, and API validation.

Built in plain JavaScript (CommonJS) with the Page Object Model, matching the conventions
used in the companion FinServe Retail Demo Platform automation project.

## ⚠️ Before you run anything: locator verification still required (reduced scope)

A batch of real platform documentation (Setup Guide, seeded-defect catalog, confirmed
patch notes) has since resolved several items that were originally guesses. **Resolved,
no longer VERIFY:**

- Seeded accounts: `agent.valid/new/draft/submitted/locked/mfa@insurance.test`,
  `admin@insurance.test`, and 30 `learner001..030@insurance.test` accounts all confirmed,
  default password `Password@123`.
- API auth: a static `X-API-Key` header (`qa-insurance-demo-token-123` by default), **not**
  a bearer token from a login endpoint.
- Base URL: `http://localhost:8081` on the shared combined lab VM (the Setup
  Guide's own `:8000` is only the generic standalone-server default — this
  app is reverse-proxied on `:8081` on the VM that also hosts FinServe on
  `:8082`).
- Rider max count: confirmed 4 (`DEMO_MAX_RIDERS_PER_APPLICATION`).
- Document size limit: confirmed 5MB (`DEMO_DOCUMENT_MAX_SIZE_MB`).
- Post-login redirect: agents land on `/applications/:id/client` (existing draft resumed,
  or a new one auto-created) — **not** `/dashboard`. Only admin lands on `/dashboard`. This
  was wrong in the original version of this framework and is now corrected throughout
  (`auth.fixture.js`, `login.spec.js`).

- Login page testids: `login-email-input`, `login-password-input`,
  `login-submit-button` (confirmed from real page source) — note the button's visible
  text is "Login" (one word), which the original `/log in|sign in/i` regex would have
  missed entirely; `LoginPage.js` and `apiClient.js`'s `loginViaUI` now use the testids
  directly instead of text matching.

**Still genuinely unconfirmed** — run `grep -rn "VERIFY" --include="*.js" .` and check these first:

- **`fixtures/applicationData.js`** — `productId`/`riderId` values are still placeholders.
  Confirm real IDs via `GET /api/products` and `GET /api/riders`.
- **`pages/LoginPage.js`** — error-message testids (`login-error-message`, field-level
  errors, `account-locked-message`) and all MFA elements are still unconfirmed; only the
  three input/button testids above have been seen directly.
- **`pages/*.js`** (all other page objects) — field label regexes and `data-testid` strings
  still need a DevTools pass.
- **`tests/workflow/application-submission.spec.js`** — the "Save Draft" button and the
  exact product-selection page sequence are still assumed.
- **`utils/apiClient.js`** — whether agent-scoped endpoints (`/api/applications/...`) need
  a session cookie *in addition to* the X-API-Key header, or whether the key alone is
  sufficient for everything. `API-V08` assumes the former.
- **Seeded-defect dependency, new and important**: this cohort may have specific defects
  toggled on (`SELECT defect_code FROM seeded_defects WHERE is_active = 1`). A test failure
  may be an intentional seeded bug, not a framework problem — check what's active before
  debugging a failure as if it were your own mistake. The confirmed beginner-cohort set
  (`DEF-AUTH-003`, `DEF-CLI-001`, `DEF-CLI-004`, `DEF-ADDR-001`, `DEF-CONTACT-001`,
  `DEF-PROD-001/003`, `DEF-RIDER-001/003`, `DEF-BEN-001/003/005`, `DEF-DOC-002`,
  `DEF-WF-002/005`) does **not** overlap with any of this framework's current 32 in-scope
  tests except possibly `PROD-V03` and `RIDER-V02/V04` — confirm exact defect behavior
  before assuming a failure there is a real bug worth logging.
- **Draft-state isolation, new risk**: because login auto-resumes/creates a draft, running
  the full E2E test (`WF-V03`) repeatedly against the same account reuses the same draft.
  `newApplicationId` now defaults to a learner account instead of `agent.valid` for this
  reason — confirm each learner account's draft is actually clean before a graded run, or
  coordinate a `php artisan demo:reset` beforehand.
- **Password governance risk**: if any seeded account has a stale `password_changed_at`
  (>90 days) or a forced-reset flag, login will redirect to a change-password form instead
  of the expected landing page. If `AUTH-V01` unexpectedly lands somewhere unexpected,
  check this before assuming the test itself is broken.

## Setup

```bash
npm install
npx playwright install --with-deps
cp .env.example .env   # then fill in real BASE_URL, API_BASE_URL, and agent credentials
```

This container had no network access, so dependencies were never installed here and no test
run or `--list` collection check was performed — only `node --check` syntax validation on
every file. **Your first command after `npm install` should be:**

```bash
npx playwright test --list
```

to confirm Playwright discovers all specs before doing anything else — the same first step
used to catch the FinServe "No tests found" issue.

## Running tests

```bash
npm test                 # full suite, all browser projects
npm run test:smoke       # @smoke-tagged tests only
npm run test:regression  # @regression-tagged tests
npm run test:api         # API project only, no browser needed
npm run test:auth        # just tests/auth
npm run test:headed      # any of the above with a visible browser
npm run report           # open the last HTML report
```

## Project structure

```
insurance-order-entry-playwright-automation/
├── tests/
│   ├── auth/                  # AUTH-V01..V06
│   ├── client-information/    # CLI-V01..V03
│   ├── product-selection/     # PROD-V01, V03
│   ├── riders/                 # RIDER-V01, V02, V04, V05
│   ├── beneficiaries/          # BEN-V01, V02, V03, V05, V08
│   ├── documents/              # DOC-V02, VAL-V03
│   ├── workflow/               # WF-V01, WF-V03 (+ V04/V06 assertions inline)
│   └── api/                    # API-V01..V08
├── pages/                      # One Page Object per screen (Section 4.4)
├── fixtures/
│   ├── users.js                 # Seeded agent accounts
│   ├── applicationData.js       # Prebuilt data bundles for common scenarios
│   └── auth.fixture.js          # `agentPage`, `dashboardPage`, `newApplicationId` fixtures
├── utils/
│   ├── routes.js                # Centralized route map
│   ├── dataGenerator.js         # Random/boundary client, address, beneficiary data
│   ├── apiClient.js             # Playwright request-context wrapper for API tests
│   ├── assertions.js            # Shared custom assertions
│   ├── fileUploadHelper.js      # Temp file generation for upload tests
│   └── testHelpers.js           # Misc shared helpers
├── reports/                     # HTML/JSON/JUnit reports land here (gitignored contents)
├── playwright.config.js
├── .env.example
└── .github/workflows/playwright.yml
```

## Test scope (reduced cohort: ~32 tests)

Per the spec's guidance for shorter cohorts ("30-35 tests while retaining authentication,
one full application submission E2E flow, beneficiary allocation validation, rider
validation, API validation, and reporting artifacts"):

| Module | Tests | Validation IDs covered |
|---|---|---|
| Authentication | 6 | AUTH-V01–V06 (V07 lockout stubbed as `test.skip`, needs a disposable account) |
| Client Information | 3 | CLI-V01, V02, V03 |
| Product Selection | 2 | PROD-V01, V03 |
| Riders | 4 | RIDER-V01, V02, V04, V05 |
| Beneficiaries | 5 | BEN-V01, V02, V03, V05, V08 |
| Documents / Validation | 2 | DOC-V02, VAL-V03 |
| Full E2E Workflow | 2 | WF-V01, WF-V03 (asserts V04 read-only + V06 dashboard status inline) |
| API | 8 | API-V01–V08 |
| **Total** | **32** | |

Not automated in this reduced scope (candidates for the next cycle, per the full ~60-test
table in the spec): Dashboard module tests (DASH-V01–V06), remaining Client Info edge cases
(CLI-V04–V10), remaining Product tests (PROD-V02, V04–V07), remaining Rider tests
(RIDER-V03, V06, V07), remaining Beneficiary tests (BEN-V04, V06, V07, V09), DOC-V01/V03,
VAL-V01/V02, and WF-V02/V05/V07.

## Reporting artifacts (Section 4.5 / evidence guidelines)

`playwright.config.js` is configured to always produce:

- HTML report → `reports/html-report/`
- JSON results → `reports/results.json`
- JUnit XML → `reports/junit-results.xml`
- Screenshots on failure, video retained on failure, trace on first retry →
  `test-results/`

For a submission package, zip `reports/` and `test-results/` alongside the code repository
after a full `npm test` run.

## Distinguishing application defects from automation defects

Per the automation best practices in the spec, if a test fails:

1. Open the trace (`npx playwright show-trace test-results/<test>/trace.zip`) before
   assuming it's an app bug.
2. Check whether the failure is a locator mismatch (an automation/test-authoring issue —
   fix the page object) versus genuinely wrong application behavior (a real defect — log it,
   following the same Defect Log format used for the FinServe project).
3. Only escalate to the defect log once you've ruled out the test's own assumptions —
   several `VERIFY` items above are exactly the kind of thing that produces a false failure.
