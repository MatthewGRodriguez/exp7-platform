# M21c — Exp6 scores, Ranks factor grid, Month-to-date

* Exp6 row score = live `expenseTabScoreHtml` (w = same-name rank scoreRaw else amount; round([REDACTED-AMOUNT]·w/maxW); value100−spend100 suffix). Exact vs live (16 rows) in saved-hours mode.
* Ranks: 60 items (Wake kept, off for T), hshare shares, factor weights, drag reorder (grip → JW.dragRows), non-factor toggle tag, rowIf inorder, non-factors table, All-dimensions grid (0 diffs vs live).
* Hours: `rank_hours` joy. `calendar` (default) = days×duration from OUR calendar month; `saved` = live's stale `_timeHoursCache` + stored pos_T (what live shows). Parity: saved 683/683, calendar 661/683 (22 hour cells differ by design).
* Expenses Month-to-date table: plan, editable ACTUAL MTD (live's comes from a never-saved bank routine; default [REDACTED-AMOUNT]), remaining, projected = max(actual, plan), health.
* Parity exclusions: `tools/parity_exclusions.json` (legacy PROJECTED/REVIEW scenario panels), listed by `parity_report.js <report> --excluded`.
