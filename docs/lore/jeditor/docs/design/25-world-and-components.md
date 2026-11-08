# 25 · World and components (M17)

Decisions: ADRs 0078–0085. They supersede the earlier ADRs named in each one for all new work. The legacy levels keep building through the frozen legacy generator (ADR 0085).

## The world (format 5)
`{format:"jeditor-world", version:5, id, title, items, joys, blueprints, components, root, clock}`. Everything is data, and the whole world is embedded in the single generated HTML. Refs are strings: `item:` `joy:` `bp:` `comp:`.

- **Item** (a jgroup) has `{id, name, values, factors, state, alts, jreq, blueprint}`. There is no type field, because the joys an item uses are its type.
  - `alts` = `{members, pref, unavail, method: best|sim}`.
  - The pick order is user pick (`state.userPick`), then Pref, then the best blueprint score among available members. The result goes to `state.pick`, or to `state.simPick` when the method is sim.
  - One item may be an alternative under several parents.
  - `jreq` is an item ref (the chain is the sequence) or a blueprint ref (a conditional prerequisite, read from its `jreq` output). A jreq that reaches back to the item itself is refused by `canSetJreq`.
- **Joy** `{id, name, value}`. The clock is a joy that gets +1 per tick (`clock:{joy, ms, on}`).
- **Blueprint** `{id, name, nodes, wires}`. It is never attached to anything: items reference one for scoring, and components list the ones they use.
- **Component** `{view:{layout, theme:{tokens}, item:{show}, states}, items, blueprints, state, sub:[{comp,pos}]}`. A sub-component is an ordinary component shared by reference. Its position under each parent is stored in `state.pos[parent]`.
- **Templates** are a one-time deep copy (`copy`, `fromStarter`) that keeps no origin.
- **Delete** always works. References that pointed at the deleted record stay in place and show up in `broken()`.

## Nodes (7)
| node | inputs | outputs |
| --- | --- | --- |
| item | set, add, state | value, ref |
| joy | add, set | value |
| math | a, b | out |
| condition | a | ok, state, item |
| component | — | comp |
| position | comp | placed |
| view | items*, comps*, style, item | changed, events |

- `math` ops include `if` (pass `a` only when `b` is true). Use it to gate actions.
- `condition` has an `event` op that matches click, drag, drop or select.
- The `view` node writes component state: `styles[item]` or `style`, plus `viewItems` and `viewComps`.
- User actions run as events → blueprint → write. A view never writes items itself.

## Evaluation (`world/eval.js`)
- A pass evaluates the dirty blueprints in parallel against one snapshot. In the page, this runs in a Blob-URL Worker, with a main-thread fallback.
- All writes from a pass are applied together:
  - numeric `add`s are summed;
  - `set`s on the same field apply in blueprint dependency order, then by node id, and the last one wins. These collisions are recorded as conflicts.
- Blueprints whose inputs changed become dirty for the next pass.
- Loops between blueprints have no cap. They advance one step per pass, and the passes are scheduled with `setTimeout(0)`.
- The cycle marker comes from Tarjan SCCs. Wires that form a cycle inside a single graph are an error.
- The page feeds one user event per pass.

## Generator and runtime
- `node world/build_world.js world.json out.html` embeds the world, `world.js`, `eval.js` and `runtime.js`, together with the state CSS from `builder/janim.js` (`default.janim.json`). The CSP is network-closed.
- The runtime renders the root components, sub-components, alternatives and the jreq sequence. It applies per-item view states (`data-sm` + `pulse/shake/glow`) and shows the pass count, backend and conflict/loop marker.

## Status at M17

**M17b update (rev 51):** every item on the "Not done" list below is now built and verified. See docs/design/26-m17b-report.md and ADRs 0086–0090.
Done:
- docs;
- model;
- evaluator;
- generator;
- runtime;
- tests (`world/test/world_test.js`, the offline demo `world/test/make_demo.js` + `demo_offline_spec.json`);
- PERSONAL DATA badge removed.

Not done:
- the click-only world editor (`/` route, panels, graph wiring, pickers);
- serve_editor `/api/world*` routes and the `/legacy` move;
- the from-empty click test through the editor;
- Exp6 JGroup.Best integration (alternatives use the argmax of the blueprint score for now);
- the drag/drop event sources in the runtime (only click and select are emitted).
