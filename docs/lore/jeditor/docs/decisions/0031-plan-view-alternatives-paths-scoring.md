# ADR 0031 — Plan view: alternatives, path search, projection, scoring, state v4

Status: accepted (M5, 2026-10-30). Implements ADR 0011's Plan view.

## Decision
- **Alternatives** live on Board items: `calendars[sc].customActions[i].alternatives = [{name, amount, step}]`, plus `choice` (an index, or none for "current"). They are edited with clicks, steppers and pickers only: add, a name pill that cycles Cheaper/Skip/Switch/Premium/Pause/Alt, a step pill that cycles 1/10/100, −/+ buttons, and delete. A new alternative defaults to 0.8 × the item's month total. They are saved in localStorage with the calendar state. The disk workbook is never written.
- **Non-destructive:** choices change only the month ledger and the plan. The sheet KPIs (income, expenses, summary) stay the original values.
- **Projection** (`JCal.project`): starts from the cached base month (per-day `byAct`, per-act `totals` and `firstDay`). It scales each act's charge days by alt.amount / base month total. If the base is 0, the whole amount goes on the act's first day. Cash and headroom are then recomputed, and the M4 condition engine runs, so each path shows its worst severity.
- **Path enumeration:** a path picks one option per item that has alternatives. "current" is the item's own field. If the product of the option counts is ≤ 256, every path is enumerated. Above that, a beam search (width 32) goes item by item, ranked by (severity, min cash, net). The current path and the original path are always kept. Measured: 729 paths become 33 kept in 15 ms, and the top path equals the exhaustive optimum (plan_test). JGroup SimulatedBest is not used. This is a proposal and could replace the beam later.
- **Scoring:** each path becomes a JFactor jmethod 2 row with x = normalised min cash and y = normalised month net, clamped to ≥ 1e-6, and xMax = yMax = 1. Rows are scored by `JFEngine.scoreAsync` (webgpu in headless Chrome). The JS preview 0.5x + 0.5y equals Exp6 scoreSyncJs (max diff 0). Ranking order is severity ascending, then score descending, then min cash.
- **UI:** the Plan view is a mode of the CalendarBoard (view pills Calendar | Plan). It is not a tab, so there are still six tabs. It shows a ranked list with the current path marked. Pick writes the choices back. "Reset to current" clears the choices.
- **No-healthy-fallback** (proposal): an alternative counts as healthy when month low cash + item amount − alt amount ≥ 0.
- **State v4:** `stateVersion 4`, `migrateFrom [3]`. A v3 store is kept, missing default keys are filled in (`fillMissing`), and it is re-saved as v4 with from 'local (migrated v3)'.

## Consequences
The real data has no alternatives, so the Plan view starts empty until the user adds some. The no-fallback condition is tested with synthetic alternatives in memory only (builder/test/plan_test.js).
