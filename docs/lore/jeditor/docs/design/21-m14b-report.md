# M14b report — calendar on items, computing on nodes (2026-10-31, CDT)

Matthew's request [pt1495u]: "board code onto items, but also the rest of components too, the calendar should use items, conditions should be blue print based ..etc". M14 (rev 43) did part of it. This is the rest.

## What is now on items / joys / blueprints
- **Calendar acts are edited as items** in the editor's new **calendar** panel (`editor/calendar.js`, ADR [REDACTED-AMOUNT]), by clicks/pickers only. You can start from an empty calendar, add a board, set opening cash, paydays, bills, weekly and one-off acts, amounts, recurrence, alternatives and choice, and joy links. Conditions are blueprints made from the same panel.
- **Act amounts can be joys** (`amountJoy`). `jdata.actSync` pushes the joy value into the act and its sheet row, so a joy edit moves the ledger.
- **Calendar engine as blueprint nodes** (ADR 0062): `calendar.minCash`, `calendar.billsOut`, `calendar.planBest`, `calendar.planPaths`. The shared calendar bytes are unchanged.
- **JRankShare as a node** (`jf.rankShare`, `jf.rankShareInv`). It equals `JRankShare.jmethod` exactly.
- **Condition labels** follow edited thresholds (auto labels only; ADR 0063).
- **Undo** now covers workbook, ranks and calendar edits (the snapshot carries `state.values`).

## What remains code (ADR 0064)
`calendar_model.js`/extract internals, JGroup Best/SimulatedBest, the RankBoard drag/caches, and the DEBT/money library internals. Hint, form, KPI and shell rendering also stays code. Each one is wrapped as a pack or `lib.value` node, and the reasons are in the ADR. Main reason: the parity tests compare these against the original code.

## Proof (editor/test/m14b_proof_result.json; shots /workspace/jeditor_shots/m14b on the box)
- **From empty** (`cal_demo`, editor port 8798, /tmp copy):
  - Steps: payday 1st & 15th [REDACTED-AMOUNT], Rent [REDACTED-AMOUNT] on day 3, Car [REDACTED-AMOUNT] on day 5.
  - Ledger 1:1500 · 3:−[REDACTED-AMOUNT] · 5:−[REDACTED-AMOUNT] · 15:100.
  - Condition `cashAfterBills < 0` bad gives 12 bad days.
  - Alternatives Roommate 1200 / Bus 100 give 4 plan paths. The path using both has minCash 200.
  - Plan pick in the preview: highlights clear. Reset: 12 bad again.
  - Editor choose Roommate gives 10 bad days; choose Bus gives none.
  - Moving the payday changes the ledger; undo restores it.
  - Save, export (679,262 B) and reload persist. The page's plan, reset and reload persist in localStorage.
- **ranking_data:**
  - Baseline min cash [REDACTED-AMOUNT].
  - Work payday → 15th & last: [REDACTED-AMOUNT] warning days, min [REDACTED-AMOUNT].
  - Cell Phone linked to a new joy [REDACTED-AMOUNT]: day 8 cash [REDACTED-AMOUNT]→[REDACTED-AMOUNT], min [REDACTED-AMOUNT].
  - In the exported page, dragging U to the top updates the w_* joys and persists after reload. The calendar ledger does not depend on rank order.
  - The lim_H and w_H jmax edits do not change the factor order: w_* are derived outputs and lim_* limit board acts.
- **Pack upgrade conflict** (`make_m14b_pack_spec.js`):
  - The publisher set joy fun to 11 for 1.0.1. The importer had already set its copy to 2.
  - The diff shows "joy fun_funpack same, keeps local value" and "collection games update, takes new blueprint".
  - After apply, fun_funpack = 2 and the type uses bp_games4. Undo/redo work.
  - Note: b1's `collide_rename` waitFor timed out, but the rename itself happened (fun_funpack exists).
  - Note: the step evals read preview scores one step behind (the debounced rebuild).
- **ranking_data vs ranking_ui_v1** (sha1 8f08a11b…, 823,333 B):
  - All six tabs have the same text, values and KPIs.
  - The only text difference is the RANKS timing line (7.7 vs 7.5 ms).
  - Pixel diff is 0 on all six tabs (1500×1000).
- **Parity / tests** (all max diff 0 / PASS): jdata (including the pack, M14b node, calendar library and label checks), motion, rank, calendar (36 checks, same day as capture), plan, sync (10), board parts, janim.
- **Builds:** ranking_ui_v1, ranking_rebuild, income_rebuild and m8_rebuild rebuild byte-identical. ranking_data.html went from 904,872 to 908,803 B. The only source change it embeds is jdata.js.

## Not verified / limits
- Editor preview lag: preview builds were already debounced at 180 ms. There is no incremental rebuild. The stale "reset to shared" value is fixed by reading the doc first.
- Sync parity reports "same day as capture: false". It is date-dependent, as before.
