# 05 - ranking_ui component inventory (reference level 1)

Source (read only): `[REDACTED-LOCAL-PATH] Joy Machine 2/legacy/legacy/html/ranking_ui.html` (1,190,761 B, 23,150 lines, title "JWorkbook"), plus `vendor/` scripts and CSS (`jworkbook_motion.css` 6,463 B, `jworkbook_theme.css` 50,938 B). Findings are from grep/reading of the file; counts are grep hits.

## Structure
- Top-level tabs (`TABS`): SUMMARY, REVIEW, INCOME, EXPENSES, RANKS, CALENDAR, PREVIEW, MODEL TOOLS, DEBT, ASSETS, GOALS. `renderTabs()` builds `.tab` divs into `#tabs`; click sets `activeTab` and calls `renderAll()` (full re-render). An as-of date control sits beside the tabs.
- Header: scenario toggle (Current / Projected / Review + promote buttons), live badge, Reload, Load budget, Save, `#status`.
- A "graph line" summary strip under the tabs: INCOME.net -> EXPENSES living -> DEBT cash -> surplus (money values).
- Render functions (28): renderAll, renderPane, renderTabs, renderSummary, renderKpis, renderReview, renderIncome, renderExpenses, renderDebt, renderAssets, renderGoals, renderRanks, renderCalendar, renderCalendarEditor, renderCalPaintPanel, renderCalendarRollupHtml, renderEasyBoard, renderEasyMonth, renderEasyShell, renderPreview, renderPreviewLight, renderModelTools, renderJoys, renderJoyGraphSvg, renderJoyModelsCatalog, renderFactorImportanceHtml, renderHdameFromReview.

## Components / patterns found -> coverage by 04 starters
| pattern (as read) | starter in 04 | new component needed | config it needs |
|---|---|---|---|
| Header with scenario toggle, badge, Save/Load/Reload, status | AppShell + PillGroup + Button | - | scenarios list, which buttons, status text |
| Top tabs + as-of date control | Tabs + Pane | DateControl (UI picker, no typing) | tab ids/labels/order, default tab |
| Sub-tabs: factor tabs (Plan, Selection, This week, A/D/U/E/H/M/S/T), rank dimension tabs (`rank-dim-tabs`) | Tabs (variant: pills) | - | items, variant |
| Pills (78) / buttons (85) | PillGroup, Button | - | label, tone, action |
| Summary strip ("graph line") | - | FlowStrip (chain of labeled values) | steps: label + bound value + tone (gain/spend/auto) |
| KPI tiles (`kpi`, `lbl`, `num`, grid) | ResultDisplay/KPI + Grid | - | label, value binding, format (money), tone |
| Tables ([REDACTED-AMOUNT] `<table`) incl. editable rows: [REDACTED-AMOUNT] number, [REDACTED-AMOUNT] text, [REDACTED-AMOUNT] select, 7 checkbox inputs, delete buttons (`del`) | Table | EditableTable (cell editors) | columns (kind: text/number/select/checkbox/money), row add/delete, totals row (`total`) |
| Add-row forms ([REDACTED-AMOUNT] `add-row`: add income/deduction/expense/section/debt/asset) | - | AddRowForm | fields schema, target table |
| Money cells with gain/spend tone (`m-gain`, `m-spend`) | - | MoneyValue | format, tone rule |
| Section headers (`section-h`, 26) and collapsibles (9 `<details>`) | - | SectionHeader, Collapsible | title, collapsed default |
| Hints (201 `hint`) | - | Hint / Note | text |
| Rank list with drag order (`rank-list`, "Rank share (drag order)") | CardList (stagger) | RankList (drag to reorder) | items, dimension, higher-means label |
| Easy board (`easy-board`, rows, kind pills, amounts, year ghost) | CardList | BoardRow | kind, amount, period |
| Calendar grid (`cal-grid`, `cal-cell`, 7 + 12 hits) with drill-down Years > Months > Weeks > Days > Hours, all-day items | CalendarGrid/DaySchedule | CalendarDrill (level navigation) | range, granularity, item binding |
| Calendar paint panel (`cal-paint`, toolbar, year chips, range preview, drag-paint, context menu suppressed) | - | PaintGrid | brush target, years, multi-select |
| Draggable actions (4 `draggable="true"`, "Drag to another hour on Day view") | DaySchedule (drag blocks) | - | drop rules |
| Recurrence choices ([REDACTED-AMOUNT]/7, Every day, Some days/week, Every N days, Monthly, Yearly) | PillGroup | RecurrencePicker | allowed kinds |
| Joy/relationship graph SVG (`renderJoyGraphSvg`, "Relationship graph", "Edges") | - | GraphView (nodes + edges SVG) | nodes, edges, layout |
| Charts: `mt-jm-chart` SVG, curve play-out ("Curve / math play-out (jmethod)") | LineChart | - | series, axes |
| Model tools (factor kinds, jmethod params, script SVG, 3D CAD canvas `mt-jm-cad3d-canvas` 640x360) | - | FactorEditor; 3D canvas = out of scope v1 | factor kind, params |
| Optimal vs actual comparisons (expense rank, joy attention) | Table | CompareTable | two series |
| Search input (1) | - | SearchFilter | target list |
| Modals / menus | not found as components (no `<dialog>`, `modal` only appears in "joy_models modality" text) | - | - |

Summary: about 6 of the [REDACTED-AMOUNT] starters cover most patterns (AppShell, Tabs+Pane, Button, PillGroup, Table, ResultDisplay/KPI, Grid, CardList, CalendarGrid/DaySchedule, LineChart). New ones needed: EditableTable, AddRowForm, MoneyValue, SectionHeader, Collapsible, Hint, FlowStrip, RankList, BoardRow, CalendarDrill, PaintGrid, RecurrencePicker, GraphView, FactorEditor, CompareTable, DateControl, SearchFilter.

## Animations (as read)
- `vendor/jworkbook_motion.js` (2,716 B): `playPaneEnter` (restart `jw-enter` on `#pane`, add `jw-stagger` to `.cal-grid, .joy-grid, .cal-hours, .kpi-grid, .rank-list`, remove after 700 ms), `markLive` (`.side` -> `jw-live`), `flashMoney` (`.m-gain, .m-spend` up to 25 items -> `jw-flash`), `afterRender`; reduced motion checked once at load.
- `vendor/jworkbook_motion.css`: keyframes jw-fade-in, jw-fade-up, jw-scale-in, jw-slide-tab, jw-kpi-pop, jw-status-in, jw-accent-pulse, jw-accent-wave, jw-border-glow, jw-shimmer; enter stagger 0/30/60/90/120/140 ms, grid stagger 25 ms steps; easings cubic-bezier([REDACTED-AMOUNT] [REDACTED-AMOUNT]), ([REDACTED-AMOUNT] [REDACTED-AMOUNT]), ([REDACTED-AMOUNT] [REDACTED-AMOUNT] [REDACTED-AMOUNT]).
- Map to JEditor runtime: pane enter -> `enter` preset + stagger; tab change -> FLIP tab indicator; money flash -> `value-change` flash; KPI pop -> enter (scale); live badge -> state; buttons/rows -> TDD state machine (hover/pressed/focus/selected/dragging). Easings to be retuned to the TDD tokens (parity target is TDD, ADR [REDACTED-AMOUNT]).

## Data / state -> level format (no external data for now)
| source (as read) | what it is | in the level |
|---|---|---|
| `localStorage` key `joy_ee_workbook_v1` (SAVE_KEY; get/set/remove) | the user's saved workbook | level `state` with `persist: "local"` keyed by level id (pending open Q) |
| `localStorage` `jworkbook_review_pending_v1` | pending review | same |
| `fetch('./vendor/workbook_data.json')` ([REDACTED-AMOUNT] B; keys source, imported_at, activeScenario, income, expenses, debts, assets, hdame, goals, moneyMode, graph, law) | base workbook | embed a SAMPLE copy as level `state.values` (allowed: it is inside the file) |
| `fetch('./vendor/workbook_local.json')` (686,135 B), `actuals_local.json` (76,422 B) | personal local data | NOT embedded (personal + large); user enters via UI or a later import feature |
| `fetch('./joys/models.json')` (8,955 B), `./joys/review/pending.json` | joy models from living-core | embed a sample snapshot or drop the catalog for v1 |
| JFactor/Exp6 (`JFactor_exp6.js` script; JBlueprint 10, JGroup 12, Best( 6, SimulatedBest 8, JWorld 3 hits) and `run_jmethods.js`, `calendar_model.js`, `household_economy.js`, `joy_factors.js`, `review_model.js`, model_tools scripts | the ranking/scoring logic | level `logic` modules embedded like the runtime (open Q) |
| WebGPU/depth/Moho helpers (`jworkbook_webgpu.js` 54,972 B, depth_html, moho) | visual extras | out of scope v1; replaced by TDD lighting/parallax |

Keeping scope honest: v1 level ships with embedded sample data only (a trimmed `workbook_data.json`), all values editable through components, saved to the level's local state. Anything that needs living-core, review files or personal actuals is flagged "needs data" and shown as a placeholder.

## Update 2026-10-30 (ADR 0008-0010)
- JFactor scoring is in the first version; the JFactor item is the base unit (doc 06).
- CALENDAR tab + board items (+ lanes) -> one JCalendar component; cash-criticality calendar -> merged into JCalendar as conditions-based highlights (ADR [REDACTED-AMOUNT]); scenarios/Plan lane -> generalized JPlan view (paths through item alternatives of one system, ADR [REDACTED-AMOUNT]).
- PREVIEW tab reclassified: editor blueprint/preview mode, not an app component.

## v1 scope (ADR 0024)
Tabs: INCOME, EXPENSES, RANKS, CALENDAR, DEBT, ASSETS. Out: SUMMARY, REVIEW, PREVIEW (editor mode, ADR [REDACTED-AMOUNT]), MODEL TOOLS (app tab; the editor Model mode stays, ADR [REDACTED-AMOUNT]), GOALS.

| tab | components (from the inventory above) | data (verified 2026-10-30, read-only re-read) | sample-data need |
|---|---|---|---|
| INCOME | EditableTable, AddRowForm (income/deduction), MoneyValue, KPI, SectionHeader, Hint | `renderIncome` reads only `WB.income` via `calcIncome`. workbook_data.json `income = {entitlements[[REDACTED-AMOUNT]], deductions[[REDACTED-AMOUNT]]}`, rows `{name, current, projected}` | trimmed entitlements + deductions |
| EXPENSES | EditableTable, AddRowForm (expense/section), MoneyValue, KPI, Collapsible, dependency/Actual-vs-plan panel (`rdDepPanel`, uses actuals_local.json) | `renderExpenses` reads `WB.expenses` via `calcExpenses` and also calls `calcRanks` (rank info shown in the table). `expenses = {sections[[REDACTED-AMOUNT]]{name, items[{name, current, projected, remarks}]}, grand{}}` | trimmed sections/items |
| RANKS | RankList (drag), Tabs (rank dimension pills), CardList, factor-importance list (JRankShare, ADR [REDACTED-AMOUNT]) | `WB.rankOrders {H,D,A,M,E,T,U,S}` + `customRankDims`, `factorOrder`, `rankFactorMeans`, `rankNonFactors`, mode flags `moneyMode/timeMode/daysMode/debtMode/surplusMode` ('values' or 'ranks'). Items = `rankItems()`: expenses + Board/calendar items ("Rank all Board items"). Also uses `WB.hdame {years, hPerMonth, ePerMonth}` and `calcSummary`. **Not in workbook_data.json**: orders are seeded at runtime by `ensureRankState`; the file has only `hdame` and `moneyMode` | real `rankOrders`/`factorOrder`/`rankNonFactors`/modes/`hdame` from workbook_local.json (verified) |
| CALENDAR | JCalendar (CalendarDrill, DaySchedule drag, PaintGrid, RecurrencePicker), BoardRow, JPlan, highlight conditions | `WB.calendars[scenario]` profile (`ensureCalendar`; `customActions`, `work`), mirrored to `WB.calendar`; `calendarActionTombstones`; optional catalog `window.__CALENDAR_ACTIONS__` (living-core, schedule-only). The horizon is built by `vendor/calendar_model.js` (`RankingCalendar.buildHorizon`, [REDACTED-AMOUNT] B), with years = `hdame.years` (default [REDACTED-AMOUNT]). Money uses the live rollup (`lastBest.calendar`). **Not in workbook_data.json** | real `calendars` (3 scenarios) + tombstones from workbook_local.json (verified); calendar_model logic must be embedded (or rebuilt on JFactor) |
| DEBT | EditableTable, AddRowForm (debt), MoneyValue, KPI | `WB.debts` via `calcDebt`; also `calcIncome`/`calcExpenses` (debt vs cash). `debts[2]` rows `{creditor, purpose, current_payment, balance, projected_payment, aprPct, remainingTerms, days, remarks}` | the 2 base debts (anonymize creditor) |
| ASSETS | EditableTable, AddRowForm (asset), MoneyValue, KPI | `WB.assets` via `calcAssets`. `assets = {savings[[REDACTED-AMOUNT]], real_estate[3], personal[3]}`, rows `{name, current}` | trimmed groups |
Not needed from workbook_data.json for v1: `goals`, `graph`, `law`, `source`/`imported_at`. `activeScenario` ('current') is kept for scenarios.
Corrections vs the previous table:
- RANKS: orders, modes and factor order are workbook state seeded at runtime, not workbook_data.json. Items also include Board/calendar items, not only expense names. `calcSummary` is an internal dependency.
- CALENDAR: the data is `WB.calendars[scenario].customActions`/`work` plus tombstones and an optional living-core catalog. It needs `calendar_model.js` and `hdame.years`; "board items" are calendar custom actions.
- EXPENSES: CompareTable (optimal vs actual) was not confirmed in `renderExpenses`; it calls `calcRanks` instead. Removed from the row.
- DEBT/INCOME/ASSETS: field lists and dependencies (calcIncome/calcExpenses in DEBT) added.
Shared: AppShell, Tabs+Pane, PillGroup, Button, DateControl (as-of), scenario toggle. Summary strip (FlowStrip) dropped (ADR 0025); `calcSummary` stays internal only (RANKS). Dropped with the tabs: GraphView, FactorEditor/LineChart as app components, SearchFilter (only if unused by the six), REVIEW/joys catalog data, `goals`.
Note: with GOALS out, `goalMargin` and the goal-based default conditions are dropped from v1 (ADR 0025).

## Sample data (ADR 0026, 0027)
- Matthew's real data, not anonymized, committed to Lore (ADR [REDACTED-AMOUNT]): `data/ranking_ui/` = workbook_local.json ([REDACTED-AMOUNT] B), workbook_data.json ([REDACTED-AMOUNT] B, fallback base), actuals_local.json ([REDACTED-AMOUNT] B, needed by EXPENSES: `rdDepPanel` → `rdActStrip` "Actual vs plan"). See data/ranking_ui/README.md (sizes, md5, keys per tab). Personal data: levels set `meta.containsPersonalData: true`.
- Verified 2026-10-30: workbook_local.json contains the Ranks state (`rankOrders` H/D/A/M/E/T/U/S × 60, `factorOrder`, `rankNonFactors`, modes, `hdame`; no `rankFactorMeans`) and the Calendar state (`calendars.current/projected/review` with `work`, `rules[33]`, `customActions` 72/65/65; `calendarActionTombstones[10]`).

## Suggested build order
1. M1 Shell: AppShell, Tabs+Pane (six tabs), PillGroup, Button, Hint, SectionHeader, DateControl; tab enter/stagger animations from the generated runtime. Tabs with empty panes. (No summary strip, ADR 0025.)
2. M2a JFactor engine first (ADR [REDACTED-AMOUNT]): browser Blob-URL workers with main-thread fallback, async WebGPU-first scoring (webgpu > wasm-simd > wasm > js), cross-engine parity suite, acceptance + risks (doc [REDACTED-AMOUNT]). Then M2b JFactor core: `jfactor` block + embedded Exp6, items/resources from sample data, scores live. Then money tabs: EditableTable, AddRowForm, MoneyValue, KPI with embedded sample workbook (INCOME, EXPENSES, DEBT, ASSETS). Local save.
3. M3 RANKS: RankList with drag order + rank dimension tabs; TDD drag state machine (dragging/invalid/settling).
4. M4 CALENDAR: CalendarDrill, DaySchedule drag, PaintGrid, RecurrencePicker.
5. M5 Views + editor Model mode: JPlan, JCalendar highlight conditions (in the app). In the editor (not the app): Model mode for item-type blueprints and packs (ADR 0019, 0023). Blueprint node families port in order (ADR 0022): data + jfactor + board.emit (with M2b/M4 needs of the calendar and board), then mech + econ, then chart/view/3D last.
6. M6 Parity: QA gates vs TDD motion; compare the six tabs against the original ranking_ui screen by screen.

## Open questions
1. ANSWERED 2026-10-30: yes, JFactor is first class and in the first version (ADR 0008, doc 06).
2. ANSWERED 2026-10-30: Matthew's real data, not anonymized (ADR 0026); see 'Sample data (ADR 0026)'.
3. ANSWERED 2026-10-30: INCOME, EXPENSES, RANKS, CALENDAR, DEBT, ASSETS only (ADR [REDACTED-AMOUNT]).
4. ANSWERED 2026-10-30: configurable per level in the editor (ADR 0006).
5. PARTLY ANSWERED 2026-10-30: out of the app (MODEL TOOLS tab out, ADR 0024). Whether the editor Model mode ever gets it stays open (3D families are ported last, ADR 0022).
6. ANSWERED 2026-10-30: dropped with the SUMMARY tab (ADR 0025).
7. ANSWERED 2026-10-30: dropped from v1 (ADR [REDACTED-AMOUNT]). Defaults: cash after bills < [REDACTED-AMOUNT] bad, < [REDACTED-AMOUNT] warn, no healthy fallback bad.
8. ANSWERED 2026-10-30: yes, committed; open-network exposure accepted (ADR 0027).
