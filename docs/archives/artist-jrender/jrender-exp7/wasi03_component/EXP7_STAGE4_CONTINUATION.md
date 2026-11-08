# Stage4 actual-world audit continuation — INCOMPLETE migration

## Baseline/ownership
Authoritative JEditor Mac Lore100 was the starting point; this stage touches only wasi03_eval paths. JRender source revision remains local git 4a5b457. User worlds i/j/x and accepted private demo v11 unchanged. No remotes/new VCS, publishing, proxy, prohibited directories/ports or budget-data access. Backup of Lore100 ABI source remains /tmp/exp7_lore100_api_backup.

## Closed audit defect
Removed fixture-only exports, world_from_score_fixture paths, ignored-world APIs and hardcoded circuit lowerer; real caller JSON now enters Rust generic model. No -cost scoring fallback. Original Lore100 20/20 report is explicitly invalidated as production evidence. WIT now only manifest/evaluate with real operation dispatch and clear err diagnostics. See API_COVERAGE.md for supported operations and limitations.

## Actual measured verification
- 461 JS-reference assertions PASS, 460 repeated actual component evaluate invocations; 12 distinct score/formula atlases, 8 additional walk/sequence/state-name supplied worlds, 48 generated expression trees, 4 actual moneyPreset synthetic whole-world passes, 50 generated and 6 atomic/noop/type proposals, generic circuit AST lowerings/on rules, SCC/selection/calendar tests.
- 460 Wasmtime p3 replay invocations PASS on immutable request snapshots; success/error results match jco and JS-reference assertions. Numeric comparison uses 1e-7 relative tolerance as defined in both harnesses, structural arrays remain order-sensitive.
- Corrected real lazy-selection evaluation (user/pref do not score prematurely) and walk dependency insertion order (JS right-associative assignment inserts terms0 first). No expectation masking.
- Exact integrated browser-shim payload Node preflight: 6 visible self-tests PASS; 11 eval calls / 8 draw-list calls; shared actual scene produces vertex buffer 626640 bytes and actual day hit 101. This is NOT browser/GPU validation.
- Prior safe synthetic suites rerun: atlas 77, circuit language 12, proposals 17 PASS. Prior renderer reruns: real DL 22 PASS; proper JRBX scene suite 150 PASS; corrected same-state jco/Wasmtime six buffer SHA256 comparison PASS.
- Real-budget/live-ranking regression suites intentionally NOT run; browser test scripts NOT run per parent direction. No invented full365 count.
- Actual artifact eval SHA256 15fe802abc38b065edf8e90f77286d523f454e44b4ec844d97aa5c00f948efc4; renderer e1aa3bfe19cd30360ed358ba73a086c5ac7980c0672efb141b6256ef733c9972. Actual binary import WIT saved artifacts/actual_component.wit (WASI interfaces @0.3.0).

## Desktop handoff (parent owns browser)
File artifacts/exp7-component-integrated-staging.html (copy to box deliver/jrender-exp7/wasi03_component/exp7-component-integrated-staging.html). Single HTML embeds core bytes + async jco bindings + actual preview3 browser shim; no network/node imports/proxy or evaluator fallback.
Expected: 30 calendar cells; header Best item:option_b / selected item:option_a; synthetic ledger min -1250 / end -400 (default each charge splits 1700 into 850 on 1/15 per real JS); six selfTests true; formula total 7000, values 2125 and 4875. Initial evidence eval.evaluate=11, eval.manifest=1; actual drawlist counters and drawCalls>0. Click day1: actual hit export and selectedDay=1, blue highlight, eval counter +5. Edit atlas benefit to change Best, independently of user choice. Invalid formula function yields EXP7_UNSUPPORTED_OR_INVALID, missing JSPI/WebGPU yields HOST_* error (no fallback).
Parent should coordinate real GPU1/0 file/http matrix; this executor did not drive browser. Original component-render-staging.html remains untouched for existing parallel checks.

## Next exact work, not a completion claim
1. Use desktop results to validate/fix host GPU path without downgrading any diagnostic to a fallback.
2. Port source-language circuit parser + real Exp6 JGroup Best/SimulatedBest, async scheduler/rollback, sync protocol faithfully against source, with cross-world tests (not simplified score substitutes).
3. Broaden coercion/undefined/node-combination adversarial tests; continue improving supplied-world fidelity without claiming tests cover every JS semantic edge.
4. Wire full preserved production calendar/UI/selection/proposal interactions to actual components (not the old engines), proper fish/coin/button component paths; baseline stays preserved until accepted.
5. After full integration run actual complete prior permitted regression and GPU1/0 file/http matrix; maintain explicit excluded budget/live-data suites.

Build instructions README.md. Reports under artifacts/. Historical fixture files under goldens/ are not production coverage.
