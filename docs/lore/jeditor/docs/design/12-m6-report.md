# M6 report: editor Model mode and packs, six-tab comparison, rank sync, [REDACTED-INSTITUTION], workbook diff

Date: 2026-10-30 (CDT). ADRs: 0033 (editor, blueprints, packs), 0034 (rank-mode sync), 0035 (read-only comparison against the original).

## 1. Editor Model mode and packs (vertical slice)
- **Run it:** `node editor/serve_editor.js` (127.0.0.1:8791), then open `http://127.0.0.1:8791/#ranking_ui_v1`.
- **Modes:**
  - **Model:** item type, fields (add from templates, cycle unit, remove) and the blueprint graph. Drag a node by its header. Click an output, then an input, to wire them; click a wire to delete it. Field pickers and const steppers are click-only. Stage 2 and 3 nodes are disabled in the palette. Shows live compile status and a score preview over the level's calendar items.
  - **Metrics:** the `jfactor.metrics` registry. Add from the pack catalog, or remove.
  - **Conditions:** combine mode, severity or first.
  - **Persistence + ambient:** persistence local or none; ambient on or off.
  - **Animation edits:** per-edge duration (±10 ms), easing cycle, reset, and enter duration (±20 ms).
  - **Packs:** embed a pack, or reset item types to the pack's.
- **Save + rebuild** writes `levels/<id>/editor.json`, `level.json` and `<id>.html`. `make_level.js` also applies `editor.json`, so regenerating the level keeps the edits.
- **Verified** by `verify_m6_editor_spec.json` and `verify_m6_spec.json` (see ADR 0033):
  - Clicking added a field, retargeted fields, rejected an invalid wire, added `cal.incomeIn`, and set `idle>hover` to 170 ms with the second easing.
  - Save rebuilt the files: runtime hash `349dfe4a…` → `62d6e914…`, `level.json` 334,116 B.
  - In the rebuilt level the metric is listed, and hovering a tab gives `--sm-ms: 170ms`.
  - Both the editor and the level had 0 console errors and 0 external requests.
- **Test edits reverted:** `editor.json` was deleted and the level rebuilt. It is byte-identical to the baseline (runtime hash `349dfe4a87ae4bc7`).
- **Not covered:** see ADR 0033. In short:
  - The blueprint score drives only the editor preview, not RankBoard.
  - There are no stage 2/3 nodes, no condition-row editing, no delay or stagger edits, no undo, and no pack upgrade flow.

## 2. Six tabs vs the original (shots in `shots/m6/cmp_orig_*.png` and `cmp_level_*.png`)
- **How it was run:** the original was served read-only (ADR 0035). Its boot-time `POST /api/save-workbook` was blocked in Chrome, and `ro_serve` logged no write attempt.
- **What was compared:** the numbers (2-decimal amounts) in each tab's `innerText`. `innerText` does not include `<input>` values, so editable cells were compared by eye from the screenshots only.

Differences:
- **All tabs:**
  - The original has 11 tabs: SUMMARY, REVIEW, PREVIEW, MODEL TOOLS and GOALS are not in the level.
  - The original has a chain line above the tabs: net [REDACTED-AMOUNT] → living [REDACTED-AMOUNT] → debt cash [REDACTED-AMOUNT] → surplus [REDACTED-AMOUNT]. The level does not show this line, but its KPIs agree with it.
  - The original has a Current/Projected/Proj+Review switch, an "As of" date, the RUN() H/M tiles, a status checklist and a "how sheets calc" list. The level has none of these.
- **INCOME and ASSETS:** every 2-decimal number shown in the level also appears in the original. The extra numbers in the original come from the chain line above and the RUN() tiles.
- **EXPENSES:** the LIVING TOTAL of [REDACTED-AMOUNT] and DEBT PAYS of [REDACTED-AMOUNT] match. The level's KPI labelled "LIVING · CAL SPEND" shows [REDACTED-AMOUNT]. The original's roll-up has the same tile with the same value, but next to a living of [REDACTED-AMOUNT] the label is ambiguous; consider renaming it "CAL SPEND". The original's text was cut off at [REDACTED-AMOUNT] characters, so its tables were not fully compared.
- **RANKS:**
  - Factor weights (M 36.794% … E 4.599%) and item shares (for example Snacks 21.444%) match.
  - **The hours column differs:** in the level, Work is 198 h, Snacks 341 h and Sleep 248 h. In the original's display they are 176, 390 and 240. The level shows the original's own *live* `rankCalendarHoursMap` values (captured from the original: Work 198, Snacks 341). The original's RANKS display appears to use its stored snapshot cache (see ADR 0032, which found T snapshot drift of 403). This is inferred, not traced line by line.
  - The level adds share percentages to 3 decimals and the mode pills.
- **CALENDAR:** the default views differ. The original opens on the Exp6 scenario comparison (Projected [REDACTED-AMOUNT] [REDACTED-AMOUNT] BEST, Current [REDACTED-AMOUNT]). The level opens on the month grid with daily cash balances. The level does not port the scenario totals [REDACTED-AMOUNT] and [REDACTED-AMOUNT].
- **DEBT:** the original has columns not in the level: INITIAL, AS OF and LIVE balances (for example [REDACTED-AMOUNT] live), a "legacy auto loan (closed)" history table ([REDACTED-AMOUNT] and [REDACTED-AMOUNT], total [REDACTED-AMOUNT]) and a "Sanity" line ([REDACTED-AMOUNT] at [REDACTED-AMOUNT] → ≈[REDACTED-AMOUNT]). The level shows GAP [REDACTED-AMOUNT], interest [REDACTED-AMOUNT], principal [REDACTED-AMOUNT], amount due [REDACTED-AMOUNT] and cash pay [REDACTED-AMOUNT], all of which match the original's row. The level does **not** have the closed-loan history or the sanity line.

## 3. Rank auto-sort (T/D/U/S)
Done. See ADR 0034. `sync_parity` passes: 10 checks, max position diff 0.

## 4. [REDACTED-INSTITUTION] "low October total"
This was a test artefact, not a data problem. [REDACTED-INSTITUTION]'s October total is **[REDACTED-AMOUNT]** (day [REDACTED-AMOUNT]) in both our ledger and the original's `easyMonthChargeTotal`. The M5 spec pressed "[REDACTED-AMOUNT]" on the default alternative (0.8 × [REDACTED-AMOUNT] = [REDACTED-AMOUNT] → [REDACTED-AMOUNT]). The earlier figure of [REDACTED-AMOUNT] was my wrong back-calculation from that.

## 5. workbook_local.json vs newest backup (read-only)
- **Files:** the live file is 686,135 B, written 19:27:49 CDT. The backup is `_bak/slpref-20261030-192748/` (685,790 B).
- **14 differences:**
  - New Starlink preference: `opt-starlink.pref` "Y1-DB", plus `prefSetAt` and `prefNote` "Matthew 2026-10-30: 'Put it as a preferred option'…".
  - The `opt-boingo.note` text was extended.
  - `.at` timestamps changed on the heb_grocery_run and apl_errand actions.
  - `_review_preview_at` changed.
  - `_rev` went from 100 to 102.
- This was a deliberate backup-then-save, not caused by these headless runs. The live file's md5 `7c54bd1a…` equals JEditor's `data/ranking_ui/workbook_local.json`.

## Regressions
- rank_parity: max diff 0. motion_parity: PASS. calendar_parity: 36 checks, diff 0. plan_test: PASS. sync_parity: PASS.
- verify, m3, m4, m5 and m6 specs: 0 console errors, 0 exceptions, 0 external requests.

## Remaining
- Wire the blueprint scores into RankBoard.
- Stage 2 nodes (mech, econ), then stage 3.
- Editing condition rows in the editor.
- Port the DEBT closed-loan history and the CALENDAR scenario view.
- Missing tabs: SUMMARY, REVIEW, PREVIEW, MODEL TOOLS and GOALS.
