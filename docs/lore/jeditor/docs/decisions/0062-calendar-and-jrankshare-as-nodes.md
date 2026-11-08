# ADR 0062 — Calendar engine and JRankShare as blueprint nodes (M14b)

Status: accepted (2026-10-31)

- New library values (`lib.value`): `calendar.minCash`, `calendar.billsOut`, `calendar.planBest`, `calendar.planPaths`. They call `JCal.month`/`JCal.plan` for the current month, driven by the calendar items. They are defined in `jdata.js` (`calLibs`), not in `calendar_live.js`, so the shared calendar bytes of the levels without data (ranking_ui_v1, ranking_rebuild, income_rebuild, m8_rebuild) stay identical and calendar parity stays at max diff 0.
- New nodes `jf.rankShare` / `jf.rankShareInv` (ins `pos`, `n`): the JRankShare formula (1/r)/H(n), allowed in every kind that allows math ops. jdata_test checks it equals `JRankShare.jmethod` for n 1..9, every position, both directions.
- `calendar_model.js` itself stays wrapped code (the 70 verbatim functions are what calendar parity compares against).
