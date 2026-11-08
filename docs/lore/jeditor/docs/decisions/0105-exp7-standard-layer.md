# ADR 0105 — Exp7: a revision/upgrade of Exp6 with a standard world layer; JEditor stops being a click-to-build UI editor

Status: accepted (2026-11-02; revised same day: circuits, items as blueprints, Exp7 = revision of Exp6)

## Terminology
"Blueprint" always means Exp6's `JBlueprint`. Our node graph (item/view/math/condition/position/joy nodes + wires) is a
**circuit**. Older JEditor docs and code keep the old name.

## Context
Matthew (Nov 2): building UIs by clicking is the wrong approach. What matters is interop: Exp6 worlds and blueprints shared by
several processes, possibly other programs, reading and writing asynchronously; and standard building blocks (plan with
alternatives and req-path, calendar, board) usable across apps.

## Decision
- Define **Exp7** (docs/design/42-exp7-spec.md): world format + async process contract (propose against a revision, snapshot
  passes, deltas add up, ordered sets with conflict markers, ownership), standard patterns (plan, calendar, board) as data and
  states, standard views as web components (world in, events out via circuits, never direct writes).
- **Exp7 is a full replacement of Exp6** (revision/upgrade, not a layer, not a flag); Exp6 code gets a migration path: where Exp6 is a defect or limitation, Exp7 states the corrected rule (spec 3.4):
  live jreq to any item; atomic only means parts pass/fail together and is never forced by being required; native one-of
  alternatives (Pref/Unavail/user pick); data bag; first-class factors; storage format not assumed JSON (open); revision and
  ownership checks built in (revisions per path); jreq satisfied when the required item ran all its parts and one passed;
  no event re-entrancy cap (re-entry deferred to the next pass). Storage DIRECTION (Nov 2, spike doc 43): columnar JRB world profile, one snapshot + optional chunks, append-only per-path change log; JSON only as interchange/debug. Answered (reported by the Artist agent from Matthew's answer; Matthew to confirm): no-JIT is a real target (~5 s with workers; decode off main thread, shell first, plain fallback); the Artist agent builds the Rust→Wasm compaction encoder (crate shared with the decoder; worker, only when the log is big; Wasm size and no-JIT cost to be measured). Also (reported by the Artist agent from Matthew's answers; Matthew to confirm): strong profile (M7) for archives, fast profile (F4n) for live use and the export; compaction runs in a worker and copies unchanged streams instead of re-encoding them; JSON debug files with irregular whitespace are re-saved pretty-printed with a 1-space indent after an edit; real proposal traffic does not exist yet — synthetic traffic from doc 44 until stage 0 produces real traffic. Round 2 numbers (Artist agent, box-only, SPIKE.md Round 2): F4n vs M7 no-JIT decode 3,187 vs 7,780 ms (2.44x); F4n size +5.6% at 1x (84,847 B); 4 workers no-JIT ~2.1 s; compaction of 1x world + 1,000 proposals 295 ms JIT / 8.3 s no-JIT; 50x world peaks 219 MB of the 256 MiB wasm cap; a decoder-only wasm for the HTML export is not built yet. Known issue: 8 dangling needs refs item:rd_car#A1/#A2/#A3. Items are blueprints. Exp6 code keeps running; migration notes in spec section 8.
- JEditor becomes one early client: keep world core, evaluator, offline export, ranking_world proof; the editor shrinks to a
  world inspector and circuit wiring view; UI is authored as code (people or AI) with standard views.
- Click-to-build UI features are frozen. Stages: 1 plan + req-path view, 2 calendar/board, 3 external process API.

## Consequences
Supersedes the UI-editor direction of ADRs 0082/0083 and the editor milestones (M7–M21) for future work; their code stays until
stage 1–2 replaces it. Compatibility checked against The Joy Machine 2 docs/api and JFactor_exp6.js (read-only).
