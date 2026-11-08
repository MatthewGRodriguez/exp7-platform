# M5 report — Plan view (2026-10-30)

## Built
- **Alternatives editor** on CALENDAR → Plan. Board items get add, name pill, step pill (1/10/100), −/+ and delete. Choices are saved in localStorage as state v4, with a v3 migration. Disk is unchanged. (ADR 0031)
- **Paths:** one option per item, where "current" is the item's field. Exhaustive up to 256 paths, otherwise a beam of width 32. The current and original paths are always included.
- **Projection:** the M4 month ledger scaled per act, then the condition engine, so each path shows its worst severity.
- **Plan view:** a mode inside CalendarBoard, so there are still exactly six tabs. Ranked list with the current path marked; Pick writes the choices back; Reset to current. Scoring goes through JFEngine (jmethod 2 rows, webgpu in the test). The JS preview equals Exp6 with diff 0.
- **Item 6, live T/D/U/S rank caches:** done (ADR [REDACTED-AMOUNT]). They equal the live original with diff 0. The workbook snapshot was stale (T [REDACTED-AMOUNT], U [REDACTED-AMOUNT]).

## Verified
- `plan_test.js` PASS, 12 checks:
  - no-healthy-fallback fires on synthetic [REDACTED-INSTITUTION] alternatives and clears once a healthy one exists; disk data untouched;
  - pick moves the current mark and changes the ledger (min cash [REDACTED-AMOUNT] → [REDACTED-AMOUNT]);
  - beam top path equals the exhaustive optimum;
  - score parity.
- `rank_parity` max diff 0; `motion_parity` PASS; `calendar_parity` 36 checks with max diff 0.
- Headless Chrome (temporary profile), specs verify / m3 / m4 / m5: 0 console messages, 0 exceptions, and file:// requests only.
- The M5 spec covers six tabs; alternatives edit + reload persist; pick write-back + reload persist (day [REDACTED-AMOUNT] cash [REDACTED-AMOUNT]); the no-fallback row shows bad in the UI; reset; v3 → v4 migration (payDays kept); live cache tooltips (T [REDACTED-AMOUNT], U [REDACTED-AMOUNT], snapshot 0).

## Unverified / proposals
- The healthy-fallback rule, the beam width, the 0.8 default and the jmethod 2 x/y mapping are proposals.
- [REDACTED-INSTITUTION]'s October month total is [REDACTED-AMOUNT]. This was observed and not investigated.
- The T/D/U/S orders still come from the stored rankOrders, not auto-sorted.

## Differences vs original
The original has no Plan view; this is new per ADR 0011. Alternatives exist only in the level's local store.

## M6 (proposal, not started)
1. **Editor Model mode / packs UI:** browse the packs (rank_share, ranking_money, calendar_live) and their JM rows/metrics, inspect inputs and outputs per row, and toggle or replace a pack per level with a click-only UI. Saved in level.json; rebuild + parity gate.
2. **Six-tab comparison against the original:** a side-by-side headless capture of each tab (DOM values + screenshots). Produce a per-tab diff table and close the gaps.
