# M9 report — composable boards, motion overrides, persistent undo

Date: 2026-10-31. Decisions: ADR 0041 (board parts), 0042 (motion overrides), 0043 (persistent history).

## What was built
**(b) Composable boards.** RankBoard and CalendarBoard are now also available as 9 + 14 placeable parts (`builder/components/Rank*.js`, `Cal*.js`, helpers in `builder/runtime/jboards.js`). Container parts have slots: `RankCols` (L / R) and `CalNavBar` (items). Each part has a `state` binding prop, and text parts have heading/label props that default to the monolith's text. Some parts also have switches: RankDimList cost/shares/non-factors, CalMonthNav "today", CalDayGrid scope line, CalBoardItems plan note. The monoliths are unchanged and are also presets: in the editor, the "Board parts" palette has "+ RankBoard/CalendarBoard preset ▸ parts", and the inspector has an "expand into parts" button. `builder/board_presets.js` holds the shared default tree.

**(c) Motion overrides.** `component.motion` and `level.motion.types[Type]` can override edges, enter, ambient and a condition cue (pulse/glow/shake, once/loop). Inheritance is level table < type < component. The editor has a Motion panel → "Component motion" section with scope "this component / all <Type>", using steppers and cycles only. The runtime (`builder/runtime/jmotion_over.js`) is inlined only when an override exists.

**(d) Persistent undo.** History is stored in `levels/<id>/.editor-history.json` (listed in `.loreignore`, never exported). It is saved on every edit, undo or redo and restored on Open, with a chip showing the count and local time. Unsaved edits are recovered when the base matches. The file is capped at 200 undo/redo entries and ~4 MB. It is stamped with the sha1 of level.json; if level.json changed outside the editor, the history is dropped and the editor shows a warning chip.

## Proof (headless, real mouse clicks; `editor/test/make_m9_spec.js`, result `editor/test/m9_proof_result.json`)
All runs used an rsync copy in /tmp with the server on :8796. Afterwards the server was stopped and the copy deleted. Nothing touched 8765/8791.
1. **Build session.** 1,719 clicks, 0 misses, 0 exceptions, 0 console errors. Starting from a new empty `m9_rebuild`, it adds 6 tabs in v1 order. INCOME/EXPENSES/DEBT/ASSETS and the KPIs are built field by field (the M8 sequence). RANKS is built from 9 palette parts (slot clicks for RankCols L/R), and CALENDAR from 14 parts (slot click for CalNavBar items). Then it saves and exports.
   - Export compared with v1 (rev-36 build, sha1 8f08a11b…, 823,333 B) on RANKS and CALENDAR: body text, tables, hints, forms and KPIs are **all the same**. The only text difference is the "N ms" JFactor timing, which is normalised out.
   - Screenshots at 1440×1000: **0 pixels differ** on RANKS and CALENDAR, with the header hidden in both. The header title differs (v1 "JWorkbook · ranking_ui v1" vs "m9_rebuild"), and the 2-line vs 1-line header shifts the whole pane by 16–17 px.
   - On the money tabs, tables, totals and KPIs are the same as v1. Hints and add-row forms were never in the M8 sequence, so those tabs' body text differs.
2. **Motion session** (new browser). Open, then override `rank_hint1` enter to 320 ms with ease 1 (4 clicks) and `rank_dim_pills1` edge idle>hover to 160 ms (2 clicks). No other component or type got an override. Save, then export.
   - In the export compared with the pre-override export: of the 6 entering pane children, only `rank_hint1` changed (0.26 s → 0.32 s, easing changed). Of the 80 JMotion targets put into hover, only the 8 inside `rank_dim_pills1` changed (`--sm-ms` 160 ms); the other 72 are unchanged.
3. **Reopen session** (new browser). Open shows the chip "history restored · 200 undo / 0 redo · from Oct 31, 6:06 AM CDT".
   - 2 undos removed session 2's edge override, 4 more removed the enter override, and 5 more removed session 1's last 5 calendar parts.
   - 11 redos returned to the saved state (dirty=false).
4. **Drop.** One byte was appended to level.json outside the editor. Open then showed "history dropped: level.json changed outside the editor (hash b1a943eb → 44c14bee)" and the file was deleted.

`builder/test/board_parts_parity.js` compares v1 against v1 with both boards expanded to parts, over 37 interaction steps. Steps covered: dims, modes, dim/factor drag, non-factor and factor toggles, month nav and today, day select, paydays ±, opening cash, range, scenarios, condition severity/animation/value, combine, add/delete condition, plan view, add an alternative, amount, pick, and plan reset. Result: normalised `#level-root` markup max diff 0 on all steps.

## Regressions
- motion_parity PASS, rank_parity PASS (max 0), calendar_parity PASS (36 checks, max 0), plan_test PASS, sync_parity PASS (max 0).
- v1 rebuilt byte-identical (sha1 8f08a11b790bf7c8b2db3ebc9385f6bfbbef1656). ranking_rebuild, income_rebuild and m8_rebuild also rebuilt byte-identical, so their M7/M8 comparisons are unchanged.

## What is and is not composable (honest)
- You can place, reorder, remove and re-nest the parts in their slots, set their labels and headings, and switch off rows of RankDimList. The monolith's event wiring is reused verbatim, so behaviour is exactly the monolith's.
- **Not** supported:
  - Two instances of the same board on one tab.
  - Moving a part to another tab while its board's other parts stay behind. Each part renders independently, but the wiring assumes one board.
  - Re-binding `state` to another object. The binding is stored and shown, but the calculations read the fixed `ranks`/`cal` state.
  - The "shares" column and the non-factor rows are props, not parts. The plan view is a single part.
- Enter overrides only affect components that are direct children of a tab pane. Nested parts (inside RankCols or CalNavBar) show no enter change. Cues use level metrics only.
- The history cap dropped the oldest 100 of the 300 build steps in the test. Undo cannot go back before the cap.

## Unverified / not done
- The cue (once/loop) was exercised only by construction (the runtime and CSS are in the build). The click test did not trigger a condition change and observe the cue animation.
- Type-scope overrides (`level.motion.types`) are implemented in the build and the editor but were not separately click-tested; the test used component scope.
- "Unsaved edits recovered" on Open was not exercised in the test, because every session saved before closing.
- In the test, the `open_waitFor` probes reported TIMEOUT. cdp_shoot evaluates `waitFor` before the clicks, so they could not succeed; the following evals (taken after the clicks) are what the results use.
