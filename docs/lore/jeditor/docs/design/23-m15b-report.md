# 23: M15b report (2026-11-01)

ADRs [REDACTED-AMOUNT]–[REDACTED-AMOUNT]. Ports [REDACTED-AMOUNT]/8791 were never used: the editor test server ran on [REDACTED-AMOUNT] and the read-only live server on [REDACTED-AMOUNT], serving /tmp copies only. No living-core or original ranking_ui files were touched.

## Done
1. **Alternatives from the live UI** (ADR [REDACTED-AMOUNT]). The rd/asof block is extracted verbatim and hosted by the `rd_live` pack. EXPENSES rows have the ▸ alternatives, Unavail./Prefer/Try buttons, the pinned bank-actual line, and "+ alternative" through the original handlers. Imported: [REDACTED-AMOUNT] real redundancy entries plus debtsLegacy, and actuals into packData. The parity reference is now the **live** UI.
2. **PLAN tab** (ADR [REDACTED-AMOUNT]). It holds the ten sections as palette components plus legend, actual and cash calendar. There are 7 tabs, and the Calendar Plan view is removed from ranking_data. stateVersion is 4, and migrate(v1) equals the level (jdata_test PASS, [REDACTED-AMOUNT]).
3. **As-of money banner** (ADR [REDACTED-AMOUNT]). The text is identical to the live UI for 2026-12-15.
4. **itemcal editor panel** (ADR 0073). It edits measures and the plan score, adds a task calendar from empty, and lists `day.*` in the condition builder. The click proof passes, 9/9.
5. **Date drift fixed** (ADR 0072). calendar_parity and sync_parity both PASS with max diff 0. Pixel checks: every tab of ranking_rebuild, income_rebuild, m8_rebuild, ranking_ui_v1 and task_calendar is 0 px different from before M15b. The only diff is the JFactor timing badge (ms), shown in `px_badge_only_diff.png`. Other tests still passing: items_test, plan_test, rank_parity, motion_parity, board_parts_parity.

## Tab-by-tab comparison with the live UI (`editor/test/m15b_live_vs_*.json`)
| Tab | Level vs live | Notes |
|---|---|---|
| INCOME | same as v1 | The live sidebar KPIs and "How sheets calc" are not in the level. |
| EXPENSES | [REDACTED-AMOUNT]/551 row lines | Missing: the live flow line "INCOME.net … pools mo=[REDACTED-AMOUNT]". |
| PLAN | 1227/1258 lines | Every live-only line is sidebar. |
| RANKS | = v1 | The live UI has "Calendar sets rank / Manual rank", and live hours (e.g. 176.0 h) differ from ours (330.0 h). Not fixed. |
| CALENDAR | = v1 | The live UI has the Exp6 scenario strip, which is legacy (ADR 0066). |
| DEBT | = v1 | The live UI has a LIVE column (−[REDACTED-AMOUNT]), Terms0, Legacy buttons, the 🕰 Legacy debts panel and the Sanity line. Ours shows BALANCE, with a −[REDACTED-AMOUNT] gap. |
| ASSETS | = v1 | Hints are updated. |
| SUMMARY / REVIEW / PREVIEW / MODEL TOOLS / GOALS | live only | Out of scope (ADR 0024/0025). |

Interactions (▸ open, Prefer, Unavail., Try): identical HTML and text (`m15b_interaction_result.json`).

## Not done / unverified
- `asofDecorate` (the live UI greys inputs in as-of mode) is not ported.
- The RANKS hours difference and the DEBT live column and legacy panel are not ported.
- The rd code is verbatim money code inside generic components. It is not re-expressed as blueprints.
- "+ alternative" uses window.prompt, as the live UI does. This is level runtime, not editor input, and its round-trip was not click-tested.

Screenshots: /workspace/jeditor_shots/m15b/ (on the agent box).
