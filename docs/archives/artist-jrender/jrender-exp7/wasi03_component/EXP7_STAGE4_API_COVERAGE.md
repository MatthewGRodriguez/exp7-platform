# Current exported coverage and precise gaps

Only real WIT exports: `exp7:eval/engine@0.1.0#manifest`, `#evaluate` (actual WASI 0.3 imports). World-bearing requests must carry `world`; there are no fixture-selection production exports.

| JSON operation | Actual implementation / source reference |
|---|---|
| score-item | Supplied item's blueprint, ctx.self, real outs.score; atlas/eval.js scoreItem; missing blueprint scores zero as real JS does, never -cost |
| best | Independently rank available member scores (stable ties), no userPick/pref override; **atlas-no-Exp6 mode only** |
| pick-alt, pick-alts | atlas.js pickAlt/eval.js pickAlts with X=null; availability/needs, user then pref then scoring; user/pref paths do not eagerly score |
| formula, eval-blueprint | Generic expression parser/evaluator and actual blueprint nodes: item, joy, math, condition, formula, days, accumulate, merge, sum, walk, component, position, view |
| graph-order, access, deps | Intra-graph ordering, read/write/ownership sets, Tarjan SCC, condensation ordering |
| compute-pass, apply, pass, dirty-for | Snapshot computation, set/add semantics/conflict metadata, supplied-world apply/pick/next scheduling |
| sequence, item-flags, state-names | Real jreq traversal including blueprint references/cycles, broken/conflict flags, view condition state discovery |
| occurrences, charges, day-map, ledger, month-days, month-of, sign | Real explicit calendar/charge schedules and selected-alt amount override; calendar month must be explicit |
| proposal-shape, proposal-check | tools/gen_synthetic_proposals.js checker: shape, ownership, path revision, atomic rejection, noops, stale operations, actual changed world |
| circuit-score-blueprint, circuit-to-ops | Generic **supplied AST** lowering and on-rule argument/path evaluation from atlas/circuit_lang.js; no hardcoded source expression |

Formula functions: min/max/abs/round/ceil/floor/ln/if/num/has/paid/pmax/grank/linked/hshare/gsum/gmax/via; context J.joy, TOTAL, DAYS. Tests include aggregates, links, changes across worlds, plus 48 deterministic generated expression trees. Tests are evidence for exercised paths, not a claim of universal JS coercion/undefined equivalence. JSON null/JS undefined boundary and untested operator/type/node combinations still need broader adversarial review.

## Not implemented / not production-switched
- Real Exp6 JGroup Best, SimulatedBest, async Best scheduler/cancellation/rollback runner. `best` is explicitly X=null atlas score ranking, not a substitute for Exp6 ranking. `sim` rejects.
- Circuit **source-language parser**; caller must supply real AST. Source parser requests reject explicitly.
- Sync transport/protocol and complete production proposal UI pipeline.
- Full accepted baseline HTML/UI/calendar interactions have **not** been switched to this API. Existing `atlas/eval.js`, `atlas/atlas.js` model authoring, `atlas/circuit_lang.js` parser, `atlas/best_async.js`, UI/sync code remain in the old baseline. They are test references only in the new runtime test harness, not imported into the new production staging bundle. No silent fallback from the new component to those engines exists.
- New staging contains real editable synthetic atlas → component pass/score/formula/ledger → component draw/text/hit calendar; it does not preserve every production interaction and does not claim fish/coin/button browser integration. Proper JRBX scenes execute in the real component non-browser parity suite.
- Browser GPU/file/http matrix remains unverified by this executor; desktop agent owns it. Do not count skipped real-budget/live-fixture or browser suites as passing.
