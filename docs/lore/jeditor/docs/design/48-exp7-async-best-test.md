# 48 · Exp7: sync vs async `Best()` (stage-0 test, spec 42 §9 Q3)

Matthew: "async Best() to be decided by testing" / "test out the best async". This is that test.

## Where Best() runs synchronously
`atlas/eval.js` `pass()` → `pickAlts(w, M, X)` → for every item with `alts`, `atlas/atlas.js` `pickAlt()` → `exp6Order()` builds one
Exp6 `JGroup` per item and calls `g.Best()` / `g.SimulatedBest()` (ADR 0086). All on the calling thread, inside one pass.
Important finding: `pickAlts` is **order-dependent** — it commits each pick before the next item runs, and later items read earlier
picks through `values.needs` (ADR 0103, `state.pick`). A naive "compute all, commit at the end" async version is **not**
byte-identical (it failed the first run of this test). The async version must commit in the same order, item by item.

## What was built (opt-in, nothing wired by default)
`atlas/best_async.js` (`JAtlasBestAsync` / module.exports):

```js
pickAltsAsync(w, M, E, X, {
  budgetMs: 8,          // longest slice on the main thread before yielding
  yield: () => Promise, // default MessageChannel (browser) / setImmediate (Node)
  isStale: () => bool,  // checked at each yield; true -> rollback, resolve {aborted:true}
  threshold: 0          // hybrid: <= threshold alt items -> run fully sync in one slice
}) -> Promise<{changed, picks, aborted, slices, maxSliceMs, mode:'sync'|'async'}>

runner(M, E, X, opts).run(w) -> same Promise   // latest-wins: each run makes older runs stale;
                                               // a new run starts only after the previous one settled
```
- Same item order and same per-item commit as sync `pickAlts`, so results are byte-identical.
- An aborted run rolls back its own writes from an undo list (key presence restored), so the atlas is byte-identical to before the run.
- The runner serialises runs: the first version let a new run start before the stale run rolled back, and the rollback overwrote
  the newer picks (caught by the cancellation test). Fixed by chaining runs on the previous one's settle.
- No depth cap: re-entrant restarts are just new generations (tested with 51).
- Sync `eval.js pickAlts` and `runtime.js` are unchanged.

## Method
- Node 20 (box): `node --expose-gc atlas/test/best_async_test.js` on `levels/ranking_atlas/atlas.json` (879 items, **104 alternative
  items**, 432 members). Scale x10 / x50 = alternative items replicated (1,040 / 5,200).
- Headless Chrome (box, playwright): `python3 atlas/test/best_async_chrome.py`; frame gap = longest gap between
  `requestAnimationFrame` callbacks while the pick runs (atlas built and serialised outside the timed part).

## Numbers
| | sync total | async total (8 ms budget) | sync longest block | async longest slice | identical bytes |
|---|---|---|---|---|---|
| Node, real (104 alt items) | 4.0–8.1 ms (5 runs) | 3.1–4.1 ms | = total | 3.3–4.0 ms (1 slice: under budget) | yes |
| Node x10 (1,040) | 36.3 ms | 37.5 ms | 36.3 ms | 8.0 ms (5 slices) | yes |
| Node x50 (5,200) | 167.8 ms | 159.3 ms | 167.8 ms | 8.3 ms (18 slices) | yes |
| Chrome, real | 4.6 ms | 3.1 ms | frame gap 16.8 ms (no dropped frame) | 16.8 ms | yes |
| Chrome x10 | 17.6 ms | 23.6 ms | frame gap 100 ms | 16.7 ms | yes |
| Chrome x50 | 92.4 ms | 85.5 ms | frame gap 517 ms | 300 ms * | yes |

\* x50 Chrome gap is dominated by GC of the 5,200-item test atlas, not by the slices (Node slices stay ≤ 8.3 ms).
Per item: median 0.033 ms, max 2.0–2.9 ms (one item; a slice can overrun the budget by at most one item).
Memory: heap delta for one pass on the real atlas: sync 4,060 KB, async 4,100 KB (+40 KB undo/promises).

Correctness checks (14/14 PASS): bytes and `changed` order identical at budgets 4/8/16 ms; 10 runs at 1 ms slices give
identical picks + Exp6 order; mid-run change aborts the old run (nothing committed) and the newest run equals sync on the final
state; 5,000 userPick ops in 50 bursts with 51 re-entrant runs (5 aborted, newest completes, picks = sync on final state);
hybrid threshold path = sync bytes; x10/x50 bytes = sync.

## Recommendation: hybrid, sync by default
- At the real ranking atlas size `Best()` costs 3–8 ms: **keep it synchronous** (well under one 16 ms frame; async adds nothing).
- Async pays off from ~250 alternative items (≈ 8 ms sync). Recommended default: `asyncBest: 'auto'` with
  `threshold: 250` alt items and `budgetMs: 8`, via `runner()` so a newer change restarts the run.
- A Worker is **not** recommended for Best(): `pickAlt` reads and writes the live atlas in order, so a worker would need the whole
  atlas cloned per pass (structured clone of 1.3 MB ≈ the whole sync cost) and could not commit item-by-item.
- Not wired into `runtime.js` now: with 104 items the hybrid always takes the sync path, so wiring changes nothing measurable and
  would touch the runtime build (M18 browser test already failing). Wire it when an atlas crosses the threshold.

## Unverified
Safari / no-JIT (spec 42 §9 Q1: ~5x slower without JIT → threshold would be ~50 items there).

Mac (8 GB, Node) re-run, same test: real sync 1.9–4.5 ms, async 1.7–2.0 ms (1 slice); x10 sync 19.7 / async 25.3 ms, max slice 8.2 ms; x50 sync 99.8 / async 110.4 ms, max slice 9.9 ms; 14/14 PASS.
