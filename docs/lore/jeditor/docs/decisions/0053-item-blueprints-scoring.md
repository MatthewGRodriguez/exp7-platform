# 0053 — Item blueprints control item scoring (data v2)

Status: accepted (2026-10-31, M12). Extends 0048 (blueprint kinds metric/field/scorer + new `item`); data `version: 2` (v1 still accepted; `JData.upgrade` v1 → v2 is pure and only adds `joys: []`).

Blueprint `{id, kind:'item', col:<item type>, normalize:'none'|'sum', graph}` — a jbp graph (JBlueprint nodes) with the new nodes `item.value {field}`, `item.factor {field (factor only)}`, `joy.value {joy}`, `joy.jmax {joy}` ending in `score.out` (and optional `view.out`/`board.emit`). Metric graphs gain `items.top`, `items.count`, `joy.value`.

- The type selects the blueprint; an item may select another (`_bp`). Editing a blueprint or a joy recomputes every dependent item live (preview rebuild; in the page every render reads `JD.itemScores`).
- `normalize:'sum'` divides each score by Σ max(0, raw) over items on that blueprint (JRankShare composite normalisation).
- **Exp6 path**: when every item's blueprint is `score.out ← jfactor.call(x, y, xMax, yMax)`, `itemEngineRows` builds Exp6 rows and the page runs them through `JFEngine.scoreAsync` (webgpu > wasm-simd > wasm > js) with parity against the graph (`JD_ENGINE['items:<type>']`); otherwise "graph only".
- **Best vs SimulatedBest preserved**: `JD.groupOrder(type, 'sim'|'best')` builds one `JAction` per item between Joy(Σ|x|) and Joy(Σ|y|) and calls `JGroup.SimulatedBest()` / `Best()` — same split as rank_share bestRank; falls back to score order without Exp6. (Implemented; not yet bound to a component — unverified in a page.)
- Editor: item templates (Σ factors, factor × joy, JFactor(value, joy), empty), graph overlay with joy/factor pickers and live per-item score on `score.out`.
