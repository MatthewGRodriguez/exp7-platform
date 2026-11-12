# Budget sources and tests (sidecar)

The shipped release is still two files in this folder's parent:

- `exp7-platform-lean.html`
- `release.json`

This sidecar holds the Budget scripts that are embedded in the lean file, the Budget app package (`app/budgetpkg.html`), and the tests. It exists so those sources can live in the repository without breaking the two-file release rule.

## Scripts

- `scripts/budget-rules.js` — pure functions (debt schedule, take-home, dates, cash kind).
- `scripts/budget-flows.js` — controllers and view-model fragments.
- `scripts/journal-views.js` — journal presentations (Home, mini month, Plan, monthly expenses, cash list).
- `scripts/eval.js` — atlas evaluator (includes the month occurrence cap).

`tools/inject.py` copies those scripts (and `budgetpkg.html`) back into the lean file and applies the shell / views-host patches (private auto-created data repo, Budget view options).

## Tests

The original 72 unit + 231 integration checks from 1.8.55–1.8.61 were delivered beside the platform and were never in this repository. They were not found on the implementation machine, so they are not re-checked in here.

This folder adds a new unit suite that loads the shipped scripts in Node (no browser):

```
node exp7-platform/budget-src/tests/run.mjs
```

Integration journeys that need Chromium, JRender, WebGPU, IndexedDB, or a real device are listed in the pull request as **[MOCK]** / **[USER-HW]** and are not claimed as passing here.
