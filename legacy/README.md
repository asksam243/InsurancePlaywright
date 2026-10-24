# legacy/starter

Verbatim copy of the starter project (the 32-test cohort build) from before the merge. It is **not run**: `playwright.config.js`
only looks in `./tests`, and its relative imports point at its own old folders.

It is kept so nothing is lost and so you can diff against it. Everything it automated now lives in the main tree (verified by
`check-coverage.js` at merge time). Its confirmed lab facts are in `docs/confirmed-environment-facts.md`.

Delete this folder once you are satisfied with the merge.
