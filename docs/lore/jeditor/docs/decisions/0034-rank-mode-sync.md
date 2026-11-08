# ADR 0034 — T/D/U/S rank orders auto-sort from live values (original sync modes)

Status: accepted (M6 item 3, 2026-10-30). Follows ADR 0032.

## Decision
This ports the original's sync (`ranking_ui.html` L1612–1775) into `calendar_live.js` as `syncedOrders(V)` and `applyRankModes(V)`:
- For each dimension in `SYNC_DIMS` T/D/U/S whose mode is `'values'`, the order is the `rankItems()` names sorted by the live map in descending order. Ties are broken by `localeCompare`, and non-factors go last.
- The modes come from the workbook (`timeMode`, `daysMode`, `debtMode`, `surplusMode`): today T is `'ranks'` and D, U and S are `'values'`. They are stored as `ranks.modes`.
- State is bumped to v5, with migration from v3 and v4.
- `rank_share.ranksOf` calls `applyRankModes` first.

RankBoard shows "Mode: live values → rank | manual drag" pills. **Proposal (not in the original):** dragging an item in a values-mode dimension switches that dimension to manual.

## Evidence
- `builder/test/sync_parity.js` against `fixtures/orig_sync_capture.json`, which was captured from the original served read-only:
  - 10 checks with max position diff 0, on the same day as the capture.
  - Also checks that switching T to values gives the original's calendar-hours order.
- `verify_m6_spec.json`: the pills read T=ranks and D/U/S=values. Toggling T to values and back works, with 0 errors.
