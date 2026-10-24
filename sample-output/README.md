# Sample output - READ THIS FIRST

These results come from running the suite against a **local throwaway stand-in app that I wrote**, NOT the real Insurance Order
Entry application (it was not reachable when this was built). They show the framework working - titles, tags, annotations, HTML
report - and are **not evidence about the real application**.

| Run | Result |
|---|---|
| Clean stand-in, full suite (console result; no HTML kept) | 92 passed, 3 skipped (AUTH-V10 and PROD-V08 need env values; RIDER-V04 needs more non-exclusive riders than the stand-in offers), 0 failed |
| Clean stand-in, `@smoke` subset (`standin-smoke-html-report/`) | 14 passed |
| Stand-in with 16 defects deliberately planted, `@seeded` tests only | 26 failed (defect detected), 10 passed (no matching defect planted), 1 skipped |

Open the report: `npx playwright show-report sample-output/standin-smoke-html-report`.
Your own runs write to `reports/html-report`.
