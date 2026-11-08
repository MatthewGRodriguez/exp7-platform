# 0041 — Composable boards: RankBoard / CalendarBoard parts; the monoliths stay as presets

Status: accepted (2026-10-31)

## Context
RankBoard and CalendarBoard were single components. Their insides (hint, factor list, dimension pills, mode switch, tables; view bar, scenario pills, nav bar, rails, day grid, detail, conditions, board items) could not be placed, reordered or configured in the editor.

## Decision
- 9 rank parts (`RankHint`, `RankCols` with slots L/R, `RankFactorList`, `RankDimPills`, `RankModeSwitch`, `RankMeans`, `RankDimList`, `RankBestTable`, `RankAllDims`) and 14 calendar parts (`CalViewBar`, `CalPlan`, `CalHint`, `CalScenarioPills`, `CalNavBar` with slot `items` taking `CalMonthNav`/`CalPaydays`/`CalOpeningCash`/`CalRangePick`, `CalRails`, `CalDayGrid`, `CalDayDetail`, `CalConditions`, `CalBoardItems`). Each is its own `builder/components/<Type>.js` with `part: '<Board>'` and a `state` path prop (default `ranks` / `cal`); text props (labels/headings) default to the monolith's text.
- Shared helpers in `builder/runtime/jboards.js` (`JBoards.rk` / `JBoards.cal` compute the same view data the monolith computes; calendar month/evaluate are computed eagerly to keep the monolith's call order). Event wiring is NOT re-implemented: the monolith's source is inlined as `JBoards.mono.<Board>` and `JBoards.install` registers a pseudo-type whose `after` is the monolith's `after`, so the parts get exactly the same handlers. Both are inlined only when a level uses parts.
- The monoliths remain unchanged and remain components. They are also presets: `builder/board_presets.js` (`BOARDS`, `parts`, `expand`) gives the default part tree; the editor shows "+ <Board> preset ▸ parts" in the palette and an "expand into parts" button in the inspector.
- Proof of equivalence: `builder/test/board_parts_parity.js` (v1 vs v1 with both boards expanded, 37 interaction steps, normalised `#level-root` markup) max diff 0; the M9 click test rebuilds both tabs from empty, part by part.

## Consequences / limits (stated honestly)
- Parts assume the default DOM structure for their wiring (the monolith's `after` queries classes inside `#level-root`). Reordering parts works; removing one simply removes its markup and handlers find nothing. Two copies of the same board on one tab are NOT supported (shared state, duplicate handlers).
- The `state` binding is nominal: it is stored and editable, but the rank/calendar calculations (and the reused monolith wiring) read the fixed `ranks` / `cal` state internally, so re-binding it does not change what a part shows.
- "Shares column", "cost" and "non-factor" rows are props of `RankDimList`, not separate parts. The plan view is one part (`CalPlan`).
- ranking_ui_v1 output is byte-identical (no parts used → nothing new inlined).
