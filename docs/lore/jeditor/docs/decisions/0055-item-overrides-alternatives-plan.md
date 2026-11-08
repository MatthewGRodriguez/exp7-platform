# 0055 — Per-item joy overrides, item alternatives, plan (M13)

Status: accepted (2026-10-31, M13). Builds on 0011, 0051, 0052.

## Decision
- Item rows may carry `_joy` (per-item joy value overrides), `_jmax`, `_bp`, `_alts: [{name, values, joy, jmax?, bp?}]` and `_alt` (current alternative index; absent/-1 = base).
- `altOf(row, k)` builds the effective row: alternative `values` and `joy`/`jmax` merged over the row's; alternative `bp` beats `_bp`. Scoring (`itemScores(cid, altPick)`) always uses the effective row and returns `alt` per result.
- Path-view hook: `JD.itemAlts(cid, i)`. Plan: `JD.itemPlan(cid)` maximises Σ raw over alternatives per item — exhaustive up to 4096 combinations, otherwise per-item best (`method` says which).
- `RankList` gets prop `alts: current|plan`; plan uses `itemPlan().picks` and labels ` · altname`.
- `joyRefs` counts alternative overrides (`cid:i/k`); deleting a referenced joy and choosing "delete and unwire" removes item and alternative overrides too (undoable).
- Validation: alternative name required; override joys must exist and be numeric.

## Editor
Items panel: per-row indicator (⚑n overrides, ⑂n·k alternatives/current, ◇ none) opens an item detail: inherited vs overridden rows with "reset to shared", alternatives add/rename/value/joy/reorder/delete/current, plan row with "apply plan". Joys panel lists overrides with their values. All edits go through the undoable edit path (persistent history).

## Consequences
Levels embedding jdata/RankList change bytes (ranking_data: 1f235ef7 → 17b2b897); rendered output equal (see 19-m13-report).
