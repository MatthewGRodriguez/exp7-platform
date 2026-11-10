# Ranking: JFEngine and JFactor (1.8.33–1.8.34)

**Status:** shipped on `main` (1.8.33 PR #63, 1.8.34 PR #64). [MEAS] where noted.

## What ranks alternatives

Every alternatives group (a Board category, a calendar choice) is ranked by **JFEngine**, the batch scorer from Lore jeditor r29 (v1). Exp6 `JGroup.Best()` / `SimulatedBest()` no longer run anywhere. [REQ 2026-11-09]

| Piece | Shared script | Role |
|---|---|---|
| `JFEngine` | `jf-engine` | Lore r29 `engine/src/jf_engine.js` (md5 `f9149946…`) verbatim, plus one marked export `scoreSync` (the engine's own `cpuScore` path). Backends: webgpu > wasm-simd > wasm > js. |
| `Exp7Rank` | `exp7-rank` | `rank()` orders a batch of scores; `jfactorRows()` sends Exp6 kernel rows (method 2) through JFEngine in one batch; `scoreRowsAsync()` exposes the WebGPU-capable async path. |
| `JAtlasModel.rankAlts(avail, score)` | atlas | The ranking entry used by the evaluator's `pickAlt`. Was `exp6Order` before 1.8.34. |
| `JBlueprint` `jfactor()` / `compile().scoreBatch()` | jbp | `jfactor()` uses the real Exp6 kernel (method 2) through JFEngine; `scoreBatch()` scores every `jfactor` node of every item as one batch. |

### Ordering rules (identical to `Best()`)
- Highest score first; ties keep list order.
- Dropped: `NaN`, non-numbers, `-Infinity`, `-Number.MAX_VALUE`.
- When no alternative is rankable, `pickAlt` still returns the first available one, so a plan never loses its pick.

### Kept on purpose
- Stored `pickWhy` values `'exp6 Best'` / `'exp6 SimulatedBest'`: atlas state data; renaming would rewrite existing atlases.
- The Exp6 bundle `JFactor_exp6.js`: it carries the `JFExp6SIMD` / `JFExp6GPU` kernels JFEngine runs.
- Methods `best` and `sim`: they still choose `state.pick` vs `state.simPick`; both rank the same way.

### JFactor kernel choice [REQ]
Matthew chose the real Exp6 kernel over the old inline `0.5·|x/xMax| + 0.5·|y/yMax|`. They differ only when neither value is consuming (+1) or a board max is 0; they agree on all 50 shipped alternatives.

## Evidence

- **[MEAS]** 4,220 / 4,220 comparisons identical to `Best()`/`SimulatedBest()` (20 real groups, 3,000 random groups up to 60 with ties and duplicates, 1,200 edge-value groups).
- **[MEAS]** All 10 shipped groups: same picks, orders, scores (12 digits) and `pickWhy` as 1.8.32.
- **[MEAS]** Headless Chromium:

| | `Best()` (1.8.32) | JFEngine (1.8.33) |
|---|---|---|
| One group, 5,000 | 2,364 ms | 1.3 ms |
| One group, 50,000 | 315,000 ms | 31 ms |
| 100,000 groups of 5, one pass | ~1,200 ms | 122 ms |

- **[USER-HW]** Matthew's Mac (Apple Metal): ranking runs on wasm-simd; 50,000 alternatives rank in 28 ms with the same winner as the 315 s `Best()` run.

## Open

- **[OPEN]** The WebGPU backend is reached only by async callers (`Exp7Rank.scoreRowsAsync`). Ranking runs inside synchronous evaluator passes, and app groups are 4–5 alternatives, far below JFEngine's 64-row GPU threshold.

## Related
[foundations.md](./foundations.md) (JFactor, Joy) · [views-vector-model.md](./views-vector-model.md)
