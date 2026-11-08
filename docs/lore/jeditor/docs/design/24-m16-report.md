# M16 report: plan under the calendar, generic dependencies & sequence, visible editor version

Date: 2026-11-01 (CST). ADRs 0074–0077.

## Part A: why the restarted editor "looked the same"
- There is only one `editor/serve_editor.js` on the machine, and the editor sends no-store headers, so neither a stale copy nor browser caching explains it.
- The banner text "M6 Model mode: /model" had simply never been updated.
- The editor starts with an empty "Open a level" state.
- Before rev 48, ranking_data was titled "ranking_ui v1", the same as the frozen v1 level.
- The M15/M15b features only appear after a level is opened.
- Fix (ADR 0077):
  - the banner shows the milestone, Lore revision, root and levels;
  - the header shows a build stamp;
  - the start page lists the levels;
  - `#level` URLs open a level directly;
  - the palette is grouped.

## Part B: what changed
- Every calendar now has a built-in Dependencies & sequence plan:
  - an `after` field on items;
  - the `JItems.deps` sequence and issue detection;
  - a `day.depConflicts` day measure (ADR 0074).
- The other plan sections are optional sub-components in each calendar's `plan` slot. The builder inlines the new internal `CalendarPlan` component when it is needed. PlanDependencies is deprecated (ADR 0075).
- ranking_data:
  - has six tabs again;
  - the CALENDAR tab carries the 12 sections plus deps, in live order;
  - stateVersion is 5.
- task_calendar:
  - is a single CALENDAR tab with ItemPlan in the plan slot;
  - includes an after-dependency and a deps condition (ADR 0076).
- Editor itemcal panel, "Plan under the calendar":
  - turn the plan on or off;
  - click a section on or off;
  - reorder sections;
  - see the built-in deps row;
  - set each item's "after" with a picker.

## Verification (2026-11-01, test editor on 8798, read-only live server on 8799)
- Click proof `editor/test/m16_proof_result.json` (screenshots `/workspace/jeditor_shots/m16/` on the box):
  - **start**: the stamp reads "M16 · Lore rev 48" and the start list shows 6 levels;
  - **ranking_data**:
    - six tabs; the palette groups are correct; PlanDependencies is hidden;
    - the CALENDAR tab shows the 13 blocks in live order, with deps last;
    - toggling PlanLegacy off removes it, and undo restores it;
  - **from empty (task_demo)**:
    - items: Report Nov 2 6 h, Review Nov 4 2 h, Taxes Nov 5 3 h;
    - Taxes after Review shows "3. Taxes · after Review";
    - Review alternative Friday Nov 6;
    - condition `day.depConflicts > 0 → bad`, picked from the day.* list where it is labelled "built-in";
    - the plan ranks the original path first (0 bad days). The Friday path gets 1 bad day because Review would end after Taxes starts;
    - the PlanLife toggle adds the life section ahead of deps.
- Tests:
  - calendar_parity, sync_parity, rank_parity, motion_parity, board_parts_parity, plan_test and jdata_test: PASS;
  - items_test: PASS after its expected condition count was updated from 2 to 3 (the new deps condition).
- References:
  - income_rebuild and m8_rebuild rebuild byte-identically;
  - ranking_ui_v1 and ranking_rebuild render the same visible text, old build vs new, on all 6 tabs. Their HTML differs only in CalendarBoard's source, where planSection is off.
  - This was a DOM-text comparison, **not** a pixel diff (PIL is not installed).
- Text against the live UI (`editor/test/m16_live_vs_level.json`):
  - CALENDAR plan vs live EXPENSES panels: [REDACTED-AMOUNT] of 1308 lines match. 86 lines appear only in the live UI and 6 only in the level.
  - The differences are date drift: the live data is as of Nov 1 04:23 CT and the level snapshot is as of Oct [REDACTED-AMOUNT] 04:18 CT (new Nov 1 card charges, the Nov month-to-date table). They are not structural. M15b had [REDACTED-AMOUNT]/1258 against the Oct [REDACTED-AMOUNT] live data.
  - The other tabs are unchanged from M15b, within ±1 line.
- Sizes: ranking_data.html 1518196 B, task_calendar.html 496295 B.

## Not done or known gaps
- The CLI `--check` in m16_calplan only reports; the levels are already migrated.
- The "+local changes" marker in the version string only appears after `lore stage`.
- The editor's dgraph uses a blueprint id other than `cond_day_depconflicts`, so the proof's cond_close click missed. This was cosmetic and the run continued.
