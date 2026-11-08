# ADR 0109 — Exp7 Best(): sync by default, opt-in hybrid async (doc 48)

Status: decided by test (Matthew: "async Best() to be decided by testing"), 2026-11-02.

## Decision
- `Best()` / `SimulatedBest()` alternative picks stay **synchronous** in `eval.js pickAlts` (real ranking atlas: 104 alt items, 3–8 ms).
- `atlas/best_async.js` provides an opt-in `pickAltsAsync` (8 ms slices, ordered per-item commit, rollback on abort) and a
  latest-wins `runner()` (serialised generations, no depth cap). Recommended setting when wired: `asyncBest:'auto'`, threshold 250 alt items.
- No Worker for Best() (order-dependent commit on the live atlas).

## Consequences
- Results are byte-identical to sync (tests: `atlas/test/best_async_test.js` 14 checks; `atlas/test/best_async_chrome.py`).
- Runtime unchanged; spec 42 §9 Q3 answered.
