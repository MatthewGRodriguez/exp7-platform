# M14 report: board, calendar and conditions on the data system (2026-10-31)

## On items/blueprints now
- **Conditions are fully blueprint-based** (ADR 0058).
  - The editor creates and edits them by clicks.
  - The defaults ship as blueprints.
  - Plan paths evaluate the same blueprints via the compiled records and the `bp:<id>` metrics.
- **Calendar acts** (current/projected/review) are declared item collections stored in place (ADR 0059).
- **Board limits** (hdame years/months/H/D/E) are joys stored in place (ADR 0060).
- **ranking_data** has state version 2 (migrateFrom [1]), and `data.migrateFrom` still adopts v1 storage.

## Remains code (honest)
- The calendar engine and plan (`calendar_model`/`calendar_live`).
- RankBoard share/best/order math.
- The DEBT/money libraries.
- Component internals.

See ADRs 0059/0060 for the reasons. Calendar acts and board items have no recurrence/date pickers. An empty level cannot yet grow a calendar from items alone.

## Proof (editor/test/m14_proof_result.json; shots /workspace/jeditor_shots/m14 on the box)
- **ranking_data vs ranking_ui_v1 (rev 42, 8f08a11b):**
  - Six tabs have the same text and values. The only text difference is the RANKS timing line ("6.5 ms" vs "7.2 ms").
  - The pixel diff is 0 on all six tabs.
- **Editor click run** (/tmp copy, port 8798):
  - Threshold 1000→100, severity→bad and anim→shake·loop all compile live into the preview.
  - "+ condition" (cashAfterBills <5000 warning) gives 31/31 warning days.
  - Inserting a NOT node by clicks makes it a non-simple graph (`bp:` metric) and gives 0 days.
  - Undo×3 gives 31 again; redo×3 gives 0.
  - Save, export, then reopen restores the persistent history (8). Undo/redo after reopen work.
- **Exported page:**
  - An in-page severity edit is kept across reload.
  - Seeded stateVersion 1 state with an edited record loads as v2 and keeps the edit.
- **Node:** jdata_test has 8 new m14 checks.
- **Regressions:** jdata, motion, rank, calendar (36 checks), plan, sync, parts and janim are PASS with max diff 0. income_rebuild, m8_rebuild, ranking_rebuild and ranking_ui_v1 are byte-identical.

## Not done / unverified
- The empty-level click test (payday, bills with alternatives, then the plan change) was not done. It needs calendar item pickers.
- The drag-a-rank / move-a-payday / change-a-joy edit chain was not re-run for M14.
- The M13 leftovers (preview score lag, pack-conflict click test) are not done.
  - The M14 spec avoids the lag by waiting for the preview model to equal the doc.
  - The lag is real: the preview takes about 1–2 s to rebuild.
