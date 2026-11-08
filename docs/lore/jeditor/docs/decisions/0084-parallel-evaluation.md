# ADR 0084: Parallel, snapshot-based evaluation with deterministic writes, deltas, loops on later passes

Status: accepted (2026-11-01), M17. Decided by Matthew in the M17 design talk.. It follows Exp6's rules where Exp6 has them (see the M17 research: Exp6 has no merge; it applies one action at a time; deltas add; contested stocks need a fixed order).

- **Evaluation runs on state change.** A blueprint is *dirty* when something it reads (item field or state, joy, component state, or a view's events) changed in the previous pass, or when the world first loads.
- **One pass:**
  1. Take a snapshot of the world.
  2. Evaluate every dirty blueprint in parallel against the snapshot. No blueprint sees another's writes within the pass.
  3. Collect their writes.
  4. Apply all writes together at the end of the pass.
- **Write rules:**
  - Numeric deltas (`add`) to the same target are **summed**, which is Exp6's delta rule.
  - Other writes (`set`/`state`/style) to the same target are applied in a fixed order: blueprint order, then node id. The last one wins.
  - If two different blueprints set the same target in one pass, the target is recorded as a **conflict**, `{target, writers}`. The editor shows a conflict marker; the page ignores it.
- **Order between blueprints** comes only from wiring dependencies (the read/write graph). There is no priority field.
  - Blueprint order = topological order of that graph (ties by id). Cycles are collapsed to their members ordered by id.
  - A blueprint that depends on another runs on the next pass after the writer.
- **Loops are allowed, with no cap.** A loop's writes make the blueprints that read them dirty for the **next** pass, so one pass never re-enters itself.
  - In the page, each pass is scheduled with `setTimeout(0)` after the previous one, so a loop never freezes the page.
  - The editor shows a **cycle marker** on blueprints in a read/write cycle (`Eval.cycles`). That is a warning only.
- **Workers:** the page computes the pure part of a pass (snapshot → writes) in a Blob-URL Web Worker built from the same `eval.js` source when the browser allows it. Otherwise it runs on the main thread. The backend in use is shown as `worker` or `main`. The Exp6 scoring chain (webgpu > wasm-simd > wasm > js, ADR 0018/0020/0021) is unchanged.
- **Clock:** a +1 delta to the clock joy on every tick (ADR 0080).
