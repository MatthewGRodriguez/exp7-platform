# 06 - JFactor first class

Decided 2026-10-30 (ADR 0008-0010). Grounded in `legacy-reference/jfactor/api/*` and ranking_ui (read only). Where this doc proposes something not in those sources it says "proposal".

## What JFactor defines (from the API docs)
- `Joy(jmax, polarity)`: scalar resource; `jmax` = live capacity; polarity consume (`-Number.MIN_VALUE`, Blueprint `'-'`) or produce (`Number.MIN_VALUE`, default). Produced resources: negative action deltas increase `jmax`.
- `JRelation`: token/gate resource (Blueprint `kind:'relation'` / `gate:true`, `chain:true`).
- `JAction(jmethod, req, x, y, jX, jY)`: one decision transforming two resources. Props: `jmethod` (scorer `(x,y,xmax,ymax,jgroup)->number`), `jreq` (prerequisite), `x`,`y` (deltas), `jX`,`jY`, `name`, `j` (last score), `hash`.
- `JGroup`: decision set. Props: `jgroup` (children), `jatomic` (all-or-nothing; must be true if something `jreq`s it), `jreq`, `name`, `jmethod`, `option` (post-regroup result). Methods: `Consider`, `Best()` (live, mutates), `SimulatedBest()` (pure), `JPreview()`.
- Scorers: `JDirect`, `JIndirect` (default, `'indirect'`), `JNeutral`; `JBlueprint.norm` (`clamp01`, `unit`, `layerAverage`, `pair`); prefer ~0-1 score bands.
- `JBlueprint`: declarative facade: `resource(name,{start,polarity,kind,chain})`, `method(name, fn(ctx))`, `methodFrom`, `layer(name,{atomic, score})`, `.do(name,{method,from,to,x,y,after})`, `build()` -> a `JGroup`; `run()`, `Best()`, `SimulatedBest()`, `world()` -> `JWorld` (multi-perspective, shared resource Map; `run`/`runAsync`).

## What ranking_ui did with it (as read)
- Exp6 loaded as a script exposing `JBlueprint, Joy, JWorld, JIndirect...` on window.
- Scenarios Current / Projected / Review: "Each scenario is an Exp6 jgroup + its own calendar."
- Board items: kinds expense / work / rhythm; RANKS ranks "all Board items" per dimension (H Happy, D Days, A Age, M Money, E External, T Time/calendar, U Debt/urgency, S Surplus/freedom).
- Lanes: Selection, Plan, This week. Calendar drill Year > Month > Week > Day > Hour > Action > Item.
- Cash criticality (easy228): "path health colors + critical strip + cash-criticality calendar (derived, session-only, never saved)", built from the Cash-after month ledger, paydays 1st and 15th; health GOOD / MARGINAL / BAD / N/A with thresholds `low [REDACTED-AMOUNT]`, `near 10%` (cash negative, cushion warning, goal test fails, dependency/date impossible); lists decision items lacking a healthy fallback.

## JFactor item = base unit of the level (proposal)
A level's model is a JBlueprint in data form; components bind to it.
```json
"jfactor": {
  "engine": "exp6",
  "resources": [ { "name": "money", "start": [REDACTED-AMOUNT], "polarity": "+", "kind": "joy" } ],
  "methods":   [ { "name": "bridge", "from": "pair" } ],
  "items": [
    { "id": "i1", "name": "Gym", "kind": "rhythm",
      "alternatives": [
        { "id": "i1a", "label": "Gym 3x/week",
          "action": { "method": "indirect", "from": "time", "to": "happy", "x": 1, "y": -2, "after": null },
          "schedule": { "recurrence": "weekly", "days": [1,3,5] } },
        { "id": "i1b", "label": "Run at home",
          "action": { "method": "indirect", "from": "time", "to": "happy", "x": 0.5, "y": -1, "after": null },
          "schedule": { "recurrence": "daily" } }
      ],
      "current": "i1a",
      "dims": { "H": 0.8, "T": 0.3 },
      "group": "g1" }
  ],
  "groups": [ { "id": "g1", "name": "Week", "atomic": true, "score": "layerAverage" } ]
}
```
- ONE system per level (ADR 0011): one resource set, one blueprint. Each item holds its own `alternatives`; each alternative's `action` fields are exactly Blueprint `.do` fields. `current` marks the alternative on the current path. `groups` map to `layer`.
- A path = one choice of alternative per item; the current path = every item's `current`. Proposal: alternatives of one item compile to a JGroup the optimizer picks from, so `Best()`/`SimulatedBest()` yield the best path, scored on the same system.
- ranking_ui's Current / Projected / Review scenarios ("Exp6 jgroup + its own calendar") are not carried over as separate systems; they become paths through item alternatives.
- `kind`, `dims`, `schedule` come from ranking_ui board items / rank dimensions / recurrence choices ([REDACTED-AMOUNT]/7, daily, weekly, every N days, monthly, yearly).

## Views as components (config schemas, proposal)
**JCalendar** (combines calendar tab + board items + lanes + cash criticality; ADR [REDACTED-AMOUNT])
```
props: path: "current"|<path id>  (which path's choices the calendar shows and evaluates),
       range {from,to}, drill: [year,month,week,day,hour,action,item],
       lanes: [selection, plan, week], board: {kinds:[expense,work,rhythm], showAdd:bool},
       drag: {moveItems:bool, paint:bool}, scoreBadge: bool,
       ledger: {paydays: [1,[REDACTED-AMOUNT]]},                 // default, editable
       highlights: [Condition],                   // set in the calendar UI, saved in the level
       combine: Combine                           // how highlights combine (ADR 0014)
```
Condition schema (proposal):
```
{ id, label,
  metric:     <metric id from the level's metric registry>,
  comparator: "<" | "<=" | ">" | ">=" | "==" | "within",
  threshold:  number,            // e.g. 1000 ($)
  margin:     number|null,       // e.g. [REDACTED-AMOUNT] for "within 10% of failing"
  scope:      "day" | "week" | "month" | "range" | "item",   // all five allowed (decided, ADR 0015)
  style:      { tone: "good"|"warn"|"bad"|"na"|color, mark: "fill"|"edge"|"badge"|"strip" },
  animation:  null | { preset: <jmotion preset/state, e.g. "flash","pulse","state:invalid">, trigger: "enter"|"while", edits: <standard edits, doc 02> },  // decided ADR 0016
  enabled:    bool }
```
Animations (decided 2026-10-30, ADR 0016): a condition can trigger an animation, not only a static style. `animation` refers only to presets/states of the shared runtime (jmotion, doc 02), with the standard edits; `enter` plays once when a cell starts matching, `while` keeps a state/loop while it matches. Perf rules from the TDD reference apply: one running animation per property per element; no per-element loops restarted on re-render (only (re)start when the match changes); CSS does the motion, no rAF at idle; reduced motion = off (static style only); loops pause on a hidden tab; click path unaffected.

Scopes (decided 2026-10-30, ADR 0015): a condition may use any of the five scopes: day, week, month, date range, item. For wider scopes the value is rolled up with the metric's `aggregate` from the registry (e.g. cashAfterBills -> min = lowest point in the week/month/range); a metric's `scopes` list limits which scopes the editor offers for it.

Combine setting (ADR 0014; shape is a proposal): configurable per calendar in the editor.
```
Combine = { mode: "severity" | "groups",          // default "severity"
            severityOrder: ["bad","warn","na","good"],
            groups: [ { id, label, op: "AND"|"OR",
                        items: [conditionId | groupId], style, animation } ] }  // used when mode = "groups"
```
- `severity` (default): every matching condition is shown; where several match the same cell, the most severe tone wins (order above).
- `groups` (optional): conditions can be combined into AND/OR groups (nestable); a group matches as a whole and carries its own style/animation; ungrouped conditions still use severity.

Metric registry (ADR 0013): the metrics a condition can use are configurable in the editor, not a fixed list. The level holds `jfactor.metrics`; the editor lets you add, edit and remove entries and the condition panel only offers registered ids.
```
{ id: "cashAfterBills", label: "Cash after bills", unit: "$",
  source: "ledger" | "score" | "dim" | "resource" | "goal" | "fallback",
  ref: <ledger column | item dim key | resource name | goal id | null>,
  kind: "number" | "ratio" | "bool",
  scopes: ["day","week","month","range","item"],   // where it can be evaluated
  aggregate: "min" | "max" | "sum" | "avg" | "last" | "any",  // for wider scopes
  builtin: bool }
```
Built-in defaults (editable/removable like any entry): `cashAfterBills` (ledger, $, min), `noHealthyFallback` (fallback, bool, item scope). (`goalMargin` dropped from v1, ADR [REDACTED-AMOUNT]; the `goal` source stays in the schema, unused.)

Default conditions (from ranking_ui easy228, now editable, not fixed): cash after bills < [REDACTED-AMOUNT] -> bad; cash after bills < [REDACTED-AMOUNT] -> warn; decision item with no healthy fallback -> bad (item scope); paydays 1st and 15th in the ledger. Goal-based defaults (goal test fails, within 10% of a goal) dropped from v1 (ADR [REDACTED-AMOUNT]).
Evaluation: conditions are computed from the ledger and scores of the selected `path` (default the current path), recomputed on change and never saved as data (derived, like easy228); only the condition definitions are saved. Health tones keep the old GOOD / MARGINAL / BAD / N/A colors.

**JPlan** (view over paths of the single system)
```
props: paths: ["current", "best", ...saved paths], compare: "side-by-side"|"overlay"|"diff",
       show: {score:bool, health:bool, steps:bool, alternativesPerItem:bool},
       allowSwitch: bool (make a path's choices the current ones)
```
JPlan shows the different paths through the items' alternatives, including the current path. It does not hold separate models; every path is scored on the same system (alternate paths via `SimulatedBest` so live resources are not mutated).

## Scoring in the level and runtime (no external data)
- The Exp6 engine (`JFactor_exp6.js`, plain JS) is embedded once like jmotion: `<script id="jfactor" data-engine="exp6" data-hash>`; the level JSON `jfactor` block is compiled to a JBlueprint at boot.
- Scoring runs client side on embedded data only; derived highlights (calendar conditions, e.g. cash criticality) are recomputed, never saved.
- WASM/GPU Exp6 kernels (`exp6_kernels.wasm`, gpu/simd runtimes) are optional accelerators; v1 uses the plain JS engine (proposal).
- Exp7: engine is selected by `jfactor.engine`, so a future Exp7 can replace Exp6 per level.

## Editor: blueprint / preview mode (ADR 0010)
- Shows the level's JBlueprint: resources, items (with alternatives), groups, paths; per-item score breakdown, portions, jmethod curve (what ranking_ui PREVIEW did).
- Edit items, their alternatives and resources via generated panels; re-run `SimulatedBest` live and show path changes in JPlan.
- Not shipped as an app tab; the output level can still include JPlan/JCalendar.

## Item types via blueprints (proposal, ADR 0019)
- `jfactor.itemTypes[]`: `{id, label, fields:[{key, type, default, unit}], blueprint:{version, nodes, edges}, factorModels:{<dim>:{kind, jmethod}}}`. `kind` is one of the MT_FACTOR_KINDS, and rank_share is the JFactor scorer from ADR 0017.
- An item references `type`. Its extra fields are validated against the type's `fields`. The blueprint graph compiles (like `ModelToolsScript.compile`) to the scorer, which is registered as a jmethod. A `board.emit`-like node can create items.
- Editor: a Model mode (graph canvas, drafts, undo/redo, builtin packs) mirrors the MODEL TOOLS tab and sits beside the preview mode (ADR 0010).
- Engine: Exp6 bundle with inline WASM/SIMD, JS fallback (ADR 0018), plus WebGPU and workers (ADR 0020).

## Engine capability detection (proposal, ADR 0020)
- At load, detect `navigator.gpu` (adapter/device), WASM, the SIMD probe (`simd_sum_f32`) and `Worker` + Blob URL.
- Chain: webgpu > wasm-simd > wasm > js. Workers are applied where available (n above a threshold), otherwise the main thread.
- Level setting `jfactor.engine.prefer`: `auto` (the chain) or one of `webgpu|wasm-simd|wasm|js`. A forced backend falls back down the chain if it is unavailable.
- Each scoring result carries `backend` (bundle already reports 'wasm-simd'|'wasm'|'js'; JEditor adds 'webgpu' and workers 'sync'|'worker'). Preview shows it.
- Note: the bundle's own `jfBatchScore` order differs (WASM first, GPU only via warm cache). Achieving webgpu-first needs a wrapper or async path. Workers in the browser need new Blob-URL code (risks in ADR 0020).

## M2a engine milestone: browser workers + WebGPU-first (decided priority ADR 0021; details are proposals)
(a) Browser worker runtime (proposal)
- Worker source (the score kernel + the WASM base64) is inlined as text in the level. It runs via `new Worker(URL.createObjectURL(new Blob([src], {type:'text/javascript'})))`, pool size `min(4, navigator.hardwareConcurrency)`.
- Probe at load by posting a no-op. On a construction error, CSP block or timeout, use main-thread chunked scoring and report workers 'sync'.
- Rows are transferred as typed arrays (transferables). No SharedArrayBuffer is needed, because cross-origin isolation is not available in file://.
(b) Async scoring path (proposal)
- `scoreAsync(rows, {prefer}) -> Promise<{scores: Float64Array, backend, workers, ms}>`. Chain webgpu > wasm-simd > wasm > js, respecting `jfactor.engine.prefer` (ADR 0020).
- WebGPU: the `JFExp6GPU` init/scoreGpuAsync from the bundle, awaited directly (not the warm cache). Below a size threshold (start: 64 rows, tune by bench), the CPU path may be faster; that is a setting, not hidden.
- Sync callers (SimulatedBest/Best inside JGroup) keep working through the existing sync path. UI uses the async path and re-ranks when results land.
(c) Parity suite (proposal)
- Fixtures: rows (methodId, x, y, xMax, yMax, scale, skip) from ranking_ui-like data + edge cases (zeros, signs, skip, large n, NaN guard).
- The same inputs run on every available engine, with or without workers. Compared to JS float64 as the reference: |a-b| <= 1e-5·max(1,|ref|) for float32 engines (webgpu, wasm-simd); exact-or-1e-12 for wasm f64/js. Same argmax (Best index) required unless a tie lies within tolerance.
- The report lists each engine run, the backend string, pass/fail and max error. It runs in the editor and from file://, http://localhost and https.
(d) Acceptance criteria (proposal)
- In a browser with WebGPU on localhost/https, `scoreAsync` reports backend 'webgpu', and parity passes.
- When workers are available, a batch of 256 or more rows uses them (workers 'worker'). Under a CSP without blob: in worker-src, or a browser that blocks it, the fallback is 'sync' with no error shown to the user.
- With WebGPU unavailable, the chain degrades in order to wasm-simd, wasm and js, each reported. Parity passes on all of them.
- Single HTML file; nothing fetched.
Risks
- file://: WebGPU needs a secure context and may be missing. Blob workers can be blocked or behave differently per browser.
- Strict CSP (no `blob:` in worker-src/script-src, no `wasm-unsafe-eval`) blocks workers and/or WASM. Fallback goes down to js.
- WebGPU availability and driver differences per browser/OS. Adapter loss mid-session must re-init or fall back.
- float32 vs float64 differences can flip near-ties. The tolerance and tie rule above handle this.
- Async results vs sync JGroup selection can disagree briefly. The UI must show which backend produced the shown ranking.
- Patching/wrapping the bundle's dispatch order must not change sync results (parity guards it).

## Blueprint packs (proposal, ADR 0023)
- Pack file `packs/<id>@<version>.jpack.json`: `{id, version (semver), label, itemTypes:[...as itemTypes...], blueprints:{<graphId>:{version, nodes, edges}}, jmethods:[ids], dependencies:{<packId>:"^x.y"}}`. The editor ships a `builtins` pack (ported per ADR 0022).
- Embedding: the level's `jfactor.packs[]` holds `{id, version, hash}` plus a full copy of the pack content in `jfactor.packData[id]`. Only the used packs and their dependencies are embedded. The runtime never fetches packs.
- Import/export: the editor reads/writes pack files in the workspace (`JEditor/packs/`). "Export pack" from item types in a level; "Import pack" into the library; "Use in level" embeds a copy.
- Versioning/conflicts: item types are referenced as `packId/typeId`. A level keeps its embedded version until the user chooses "Update". Update shows a diff (like `modelToolsBpPreviewDiffHtml`); a major version bump warns. Local edits to an embedded type fork it (`level-local` pack, hash changes). Two packs with the same id but different versions in one level are not allowed; the editor asks which version to keep. Dependency cycles are rejected.

Note (ADR 0024, 0025): v1 has no GOALS tab; `goalMargin` and the goal-based default conditions are dropped from v1.

## Open questions
1. ANSWERED 2026-10-30: beyond the blueprint step fields, item fields are editor-configurable through blueprints, modelled on ranking_ui's MODEL TOOLS tab (ADR 0019; see 'Item types via blueprints').
2. ANSWERED 2026-10-30: one system; each item has its own alternatives; JPlan is a view of the different paths (incl. current) through them (ADR 0011).
3. ANSWERED 2026-10-30: rank shares become a JFactor scorer (ADR 0017); ranking_ui's plain-JS harmonicShares is the reference behavior, verified by a parity check.
   - Proposal (not decided): a scorer `JRankShare` registered with the other jmethods (JDirect/JIndirect/JNeutral). Parameters: `order` (item ids per dimension), `invert` (bool; default true for A, E, M). It returns the item's share 1/r ÷ Σ1/r. Factor-vs-factor weights use the same scorer over `factorOrder`, and the composite is Σ weight·share. The level JSON keeps the orders in the `jfactor` block, and the editor's drag lists edit them.
   - Code finding 2026-10-30 (read-only trace, ranking_ui.html + vendor/): **partly JFactor.**
     - The rank shares themselves are plain JS, not Exp6: `harmonicShares(order, invert)` (ranking_ui.html ~L1830) gives weight 1/rank normalised to sum 1 (A, E, M inverted). `calcRanks` (~L1950–2040) sets each item's `score<dim>` from these shares; `factorWeights()` = `harmonicShares(WB.factorOrder)`; composite `scoreRaw = Σ fw[d]·score[d]`. That region has no Joy/JAction/JGroup/Best calls. The fallback `JoyFactors.compositeItemScore` (vendor/joy_factors.js L182) is the same weighted sum. vendor/model_tools_script.js copies the same law (`harmonicSharesLocal`).
     - JFactor (Exp6) is used downstream of the shares. `easyComputeBestRank` (~L13076–13330) builds `Joy` per dim, one `JAction(jmethod, null, x, y, jX, jY)` per board item (plus D/E/A/span companions), adds them to a `JGroup`, and orders with `SimulatedBest()`, then `Best()`. It falls back to a plain rank sort (`ranksOrder`). Scenarios are also `JGroup`s (`easyBuildScenarioGroupFromSnap`, `scenario_mix`). `easyRankHappyUnits` (~L21892) feeds `row.scoreRaw` into a `JBlueprint` resource.
     - So rank shares are the rank-tailored input, and JFactor does the selection and ordering. (Resolved by ADR 0017: rebuilt as a JFactor scorer.)
4. ANSWERED 2026-10-30: both. Inline WASM/SIMD kernels (base64, ~1.5 KB binary) with plain-JS fallback (ADR 0018).
10. ANSWERED 2026-10-30: yes, WebGPU + workers too (ADR 0020).
11. ANSWERED 2026-10-30: data, jfactor, board.emit first; then mech, econ; chart/view/3D last (ADR 0022).
12. ANSWERED 2026-10-30: yes, shared as packs; levels embed copies (ADR 0023).
5. ANSWERED 2026-10-30: merged into JCalendar; [REDACTED-AMOUNT] / 10% / 1st+15th are editable default conditions (ADR [REDACTED-AMOUNT]).
6. ANSWERED 2026-10-30: metrics are editor-configurable via the level's metric registry; the three built-ins are defaults (ADR 0013).
7. ANSWERED 2026-10-30: configurable per calendar; proposed default = all matches shown, most severe wins; optional AND/OR groups mode (ADR 0014).
8. ANSWERED 2026-10-30: all scopes (day, week, month, range, item), roll-ups via the metric registry (ADR 0015).
9. ANSWERED 2026-10-30: yes, via shared-runtime presets/states under TDD perf rules (ADR 0016).
