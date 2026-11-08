# ADR 0032 — Live T/D/U/S rank caches

Status: accepted (M5 item 6, 2026-10-30).

## Decision
Four more original functions are added verbatim to the extract (`tools/extract_calendar.sh`): `rankCalendarHoursMap`, `rankCalendarDaysMap`, `rankDebtUrgencyMap` and `rankSurplusContributionMap`, plus `rankItems`, which is no longer a stub. That makes 91 functions; the change is additive. `JCal.rankCaches(V)` / `JM.row('rankCaches')` computes them live, and the RankBoard cost column uses them (tooltips say "live"). The snapshot `st.caches` is kept only as a fallback.

## Evidence
- Compared with the live original captured today at 21:59 CDT (`builder/test/fixtures/orig_rankcache_capture.json`): T, D, U and S each have 60 keys, no mismatched keys, and max diff 0.
- Compared with the stored workbook snapshot (`W._*Cache`, saved 2026-09-12): D and S have diff 0, U has 0.14 and T has 403. The original itself now produces the live values, so the snapshot is stale.
- rank_parity (max diff 0) and calendar_parity (36 checks, diff 0) still pass.

## Not changed
The rank **orders** T/D/U/S still come from the stored `rankOrders` (they match the live original capture). Auto-re-sorting orders from the caches (the original's calendar sync modes) has not been ported.
