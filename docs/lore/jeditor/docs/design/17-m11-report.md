# M11 report: the data system — collections, blueprints, JFactor scorers (2026-10-31)

ADRs: 0047 (model + bindings), 0048 (blueprints + scorers), 0049 (persistence, seed, storage migration), 0050 (migration tool).
Proof: `editor/test/make_m11_spec.js` (build / reopen / exported page), `make_m11_mig_spec.js` (editor migrate button), `make_m11_compare_spec.js` + `compare_m11.js` (render diff vs v1); results in `editor/test/m11_proof_result.json`; node tests `builder/test/jdata_test.js`. All runs on a /tmp copy, editor server on port 8799, headless Chrome with a temp profile.

## What was built
| File | Role |
|---|---|
| builder/runtime/jdata.js | validate / make / install; `window.JD` (rows, out, scores, val, col, outputs, fields); computed fields; grouped sums; `JD_ENGINE` Exp6 parity; storage migration |
| builder/components/DataTable.js, RankList.js | components bound only to collections / scorers / outputs |
| builder/build_level.js | embeds jdata + jbp when `level.data` exists; throws on validation errors |
| editor/data.js, editor.css | Data mode: collections, fields, typed chips, rows table with steppers, seed import, blueprint list + graph overlay, live outputs, scorer parity, errors, DataTable/RankList props |
| editor/editor.js | blueprint-only binding pickers in data mode, `@col` resolution, snapshots include data, lenient preview hook |
| editor/serve_editor.js | /data.js, /jdata.js; /api/data-files, /api/data-file, /api/data-migrate |
| tools/migrate_to_data.js | `migrate()` + CLI (pure, refuses already-migrated levels) |
| levels/ranking_data | ranking_ui_v1 migrated (level.json 353,497 B; html 865,730 B) |

## Verified
- **Build from empty, by clicks** (no typing except on-screen keyboard): new level → enable data → collection `loans` (creditor text, balance money, aprPct number) → seed import of 2 rows from workbook_data.json:debts → computed field interest = balance×aprPct/1200 (6 nodes, 5 edges; row 0 = [REDACTED-AMOUNT]) → JFactor scorer `sc_loans` (best [REDACTED-INSTITUTION] [REDACTED-AMOUNT]; Exp6 parityOk true, wasm-simd) → metric blueprint (8 nodes, 4 edges: balance [REDACTED-AMOUNT], interest [REDACTED-AMOUNT], count 2, bestScore [REDACTED-AMOUNT]) → DataTable (with score column + totals), KPIGrid (money/int/pct from output fmt) and RankList bound only to blueprint sources. 0 exceptions, 0 non-local requests.
- **Edit → recompute**: row 0 balance [REDACTED-AMOUNT] → total [REDACTED-AMOUNT], interest [REDACTED-AMOUNT], row interest [REDACTED-AMOUNT]; undo/redo exact.
- **Persistence**: save + export ([REDACTED-AMOUNT] B, 0 external refs, CSP ok, connect-src 'none'). Editor reopen: [REDACTED-AMOUNT] history entries restored, not dirty, undo/redo work after reload. Exported page: edit a balance in the page → totals/score recompute → Save → reload → same values from localStorage (`jeditor:loans-data`).
- **Migration via the editor button** on a copy of ranking_ui_v1 (sha1 8f08a11b…, [REDACTED-AMOUNT] B): 10 collections, 6 blueprints, 27 outputs, [REDACTED-AMOUNT] bindings rebound, 0 validation errors; saved data/components/values identical to `levels/ranking_data`. Exported and compared with v1 on INCOME, EXPENSES, DEBT, ASSETS, RANKS, CALENDAR: text identical except 1 line on RANKS (engine timing "7.2 ms" vs "7.7 ms", nondeterministic), all live values equal (max rel diff 0), KPIs equal, screenshots 0 px different on all six tabs.
- **Regressions**: rebuilt ranking_ui_v1 (823,333 B, 8f08a11b), ranking_rebuild (823,597), income_rebuild (781,324), m8_rebuild (799,208), ranking_data (865,730): byte-identical. motion_parity PASS; rank_parity PASS max diff 0; calendar_parity 36 checks diff 0; plan_test PASS diff 0; sync_parity 10 checks diff 0; board_parts_parity 37 steps diff 0; janim_test all ok; jdata_test PASS (19 checks).

## What is on the data system
INCOME (entitlements, deductions, all income.* metrics), EXPENSES (sections as a grouped collection, living/debtPays/rankable), DEBT (debts list, totals, payments, interest, gap, dti), ASSETS (keyed groups, totals, liabilities, net worth), the KPI tiles and totals of every tab, CALENDAR and RANKS summary metrics (cal.surplus/gain/spend/nActs/placed, ranks.items), and the record stores used by RankBoard/CalendarBoard bindings.

## What is NOT on the data system (honest list)
- Library internals still read `V.workbook` / `ranks` / `cal` in place (RankBoard, CalendarBoard, plan/sync code); they are bound through record collections but their internal rows/fields are not modelled as collection fields or blueprints.
- The DEBT table's `debtSelect` column and the `rowCalc` library computations are kept as library code, not field blueprints.
- jlevel `engineBoot` (board engine start-up) is unchanged.
- Blueprint stage-2/3 nodes (sync/plan) are shown disabled in the palette.
- `jfields` fallback paths are not type-checked by the validator.
- Undoing a migration in the editor restores components/data but does not undo the storageKey change until the snapshot is restored (the key is set in the same step; verified only by inspection).
- Exp6 parity for scorers is checked in the page only; node has no Exp6 engine (jdata_test skips it).
- External data sources remain out of scope (seed only from the dataset's local JSON files).

## Differences and notes
- RANKS shows a run-dependent engine timing string; it is the only text difference to v1.
- `tools/migrate_to_data.js` now deep-copies its input (it used to mutate it) and refuses levels that already have `data`; outputs unchanged (CLI output byte-identical to levels/ranking_data/level.json).
- Proof waits: edits are read back only after the preview's `JD` matches the doc (the preview rebuilds asynchronously).
