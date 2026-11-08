# 0048 — Data blueprints (node graphs) and JFactor scorers

> Revised by ADR 0053 (M12): blueprint kind `item`, joy/item nodes.

Status: accepted (2026-10-31, M11)

## Kinds
- **metric**: nodes `col.sum|col.count|col.max`, `scorer.top`, `data.const`, `out.ref`, `lib.value`, `op.add|sub|mul|div|min|max|neg`, sink `out.metric{id,label,fmt}`. Each `out.metric` id is one bindable output (duplicate ids are errors).
- **field** `{col, field}`: a per-row computed field: `row.field`, `op.*`, `const`, exactly one `out.field`. Becomes a read-only field of the collection.
- **scorer** `{col}`: the JBlueprint stage-1 graph (`data.actField`, `data.boardMax`, `jfactor.xMax|yMax`, `jfactor.call`, `score.out`, `board.emit`), compiled by `builder/blueprint/jbp.js` against the collection's fields.
Edges are `{from:[node,'out'], to:[node,port]}`; graphs must be acyclic and fully connected to their sink.

## JFactor stays first-class
A scorer of the `jfactor.call` shape also runs on the Exp6 engine in the page (`JFEngine.scoreAsync`, WASM-SIMD when available); `window.JD_ENGINE[id] = {n, parityOk, backend, ms}` compares the graph scores with `JFExp6SIMD.scoreSyncJs` (tolerance 1e-5 rel). Proof: loans scorer parityOk true, wasm-simd.

## Editor
Graph overlay (palette by category; stage-2/3 nodes shown disabled), click port→port to wire, click a wire to unwire, drag node headers to move, param pickers only (on-screen keyboard for ids/labels), live values on sinks. A scorer wizard pre-builds the graph from chosen x/y fields. All edits are undoable and go into the persistent history.
