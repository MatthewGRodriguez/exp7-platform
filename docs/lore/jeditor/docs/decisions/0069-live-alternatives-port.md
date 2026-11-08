# ADR 0069: Item alternatives UI ported from the LIVE ranking_ui; the live UI is the parity reference

Status: accepted (2026-11-01), M15b

- **Why:** the M15 parity check compared against v1 / the 3dca951d original capture. The live UI (vendor html in `The Joy Machine 2/legacy/legacy/html`) has the redundancy ("alternatives") UI on EXPENSES rows, and that was never in the reference, so the miss could not show up.
- **Port.** `tools/extract_rd.js` copies the original's verbatim block from `easy215 Redundancy + jreq` through `/easy222` into `builder/packs/vendor/rd_extract.js` (`JRdExtract(H)`, 185 KB).
  - Its free globals (found with eslint no-undef) are supplied by the host.
  - `builder/packs/rd_live.js` hosts it on the level's workbook:
    - calcSummary and fullCalc come from the ranking_money metrics;
    - fetch is shimmed to `packData.rd_live.actuals`, which is the live `vendor/actuals_local.json`;
    - debts are viewed with the live boot defaults: `balance = balanceInitial`, `remainingTerms = remainingTermsInitial`, as `debtEnsureAsOfDefaults` sets them;
    - results are memoized per state.
- **Rows.** `EditableTable.rowExtra = 'rdAlts'` adds the ▸ toggle, the "★ pinned bank-actual today · plan … · …" line, "Bank actual (pinned)" and the alternative sub-rows. Unavail./Prefer/Try, "+ alternative" and the dropdown all use the original handlers (`rdBind`).
  - Matching the live UI, "+ alternative" uses the browser prompt. This is runtime behaviour in the level page, not editor input.
- **Data.** `tools/import_alts.js` imports the real `workbook.redundancy` (104 entries) and `debtsLegacy` from `data/ranking_ui/workbook_local.json` (md5 equal to the live vendor copy). Alternatives change the numbers, and the plan and its numbers reproduce the live UI exactly.
- **Parity.** `tools/make_live_compare_spec.js` and `tools/compare_live.js` render the LIVE UI, served read-only from a /tmp copy by `tools/ro_serve.js` on a free port (never 8765 or 8791). They diff it per tab against a level, and against v1. Results: `editor/test/m15b_live_vs_level.json`, `m15b_live_vs_v1.json`, `m15b_interaction_result.json`.
- **Honest limit:** the rd code is the original's money-specific code hosted in generic components. It is not re-expressed as blueprints.
