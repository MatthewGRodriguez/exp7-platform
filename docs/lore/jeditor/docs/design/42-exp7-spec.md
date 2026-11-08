# 42 · Exp7 spec — a standard layer on Exp6/JFactor worlds

Status: draft for discussion (2026-11-02, rev 4). Direction: ADR 0105. Docs only, no code in this step.
(The number 42 is shared with `42-m21c-exp6-ranks-mtd.md`; this file was named that way on request.)

> **Terminology.** In this spec, **"blueprint" always means the Exp6/Exp7 blueprint** (`JBlueprint`; The Joy Machine 2,
> `JFactor_exp6.js` `class JBlueprint extends JGroup`, L4028; `docs/api/jblueprint.md`). **"Circuit" is ours**: the atlas's node
> graph (item / view / math / condition / position / joy nodes plus wires). Older JEditor docs and code still call circuits
> "blueprints" (`atlas.blueprints`, `bp:` refs, ADRs 0081/0084); they are not renamed.

## 1. Why, and what Exp7 is

Matthew's decision (Nov 2): building UIs by clicking is the wrong approach. What we need is:

1. **Interop.** Something useful in one app should be usable in another. Atlases must be readable and writable by several
   processes, possibly from different programs, **asynchronously**.
2. **No click-built UIs.** UIs are written as code (by people or by AI), using standard views.
3. **Standard building blocks.** The plan (alternatives plus a dependency / req-path view) first, then calendar and board, able to
   connect to each other.

**Exp7 is a full replacement of Exp6** (a revision/upgrade, not a layer and not an option flag). Where Exp6 behaviour is a defect or a limitation, this spec
states the **Exp7 rule** and notes what Exp6 does today (section 3.4); there are no wrappers or workarounds. Exp7 also adds what
Exp6 never had: one atlas format and process contract, standard patterns and standard views. Exp6 code gets a migration path to Exp7
(section 8); Exp7 replaces it. JEditor (atlas core, evaluator, offline export) is one early client and testbed.

## 2. Glossary

| Term | Meaning |
|---|---|
| **Atlas** | One store (format open, 3.5) holding everything: items, joys, circuits, components, shared view state. Has a revision number. **atlas (formerly world)**: renamed by Matthew 2026-11-02 (ADR 0106); Exp6 `JWorld` is a different thing and keeps its name (doc 46). |
| **Item** | A **blueprint** (Exp7 revision of Exp6 `JBlueprint`) with first-class factors, a data bag, live jreq and optional one-of alternatives (section 3). |
| **Blueprint** | Exp6's `JBlueprint`, revised in Exp7 (3.4): named resources, scorers (`method`), value methods (`fn`), events, layers of steps; `build()` returns a handle that **is** a `JGroup`. |
| **jgroup** | Exp6's `JGroup`: a decision set (`jgroup`, `jatomic`, `jreq`, `jmethod`, `Best`, `SimulatedBest`). Every built blueprint is one. |
| **Joy** | A named number (resource / stock). The clock is a joy. In Exp6 a blueprint's `resources` are Joys/JRelations. |
| **jreq** | "Requires": a plain, live reference to another item, any item (3.4 #1, #3). Following jreq links gives the **chain**; the chain is the **sequence**. |
| **Alternatives** | A native **one-of choice group**: members with **Pref** and **Unavail** marks; exactly one becomes the **pick** (3.2). |
| **Atomic** | All internal parts of a group pass or fail together, under its name. Nothing else; in particular not needed to be required. |
| **Data bag** | Non-numeric item data (dates, notes, ids) carried natively by the item. |
| **Circuit** | *Ours*: a node graph in the atlas, never attached to anything. Items and components refer to it. (Old name: "blueprint".) Direction: a Verse-like text language (doc 45) — Matthew agreed to the direction (yes, 2026-11-02); syntax is still illustrative and undecided; the word circuit stays until the language is chosen (ADR 0106). |
| **Pass** | One evaluation of the dirty circuits against a single snapshot; all writes of the pass are then merged. |
| **Process** | Any program that reads or writes an atlas: a page, an Exp6 planner, a script, an AI agent. |
| **Proposal** | A batch of writes a process sends, tagged with the revision it read. |
| **Pattern** | A standard data shape plus states (plan, calendar, board). Data and rules, no UI code. |
| **View** | A standard web component that renders a pattern. Atlas data in, events out. |
| **Landed** | An item that has happened or is done (its date is past, or it is marked done). |

## 3. Layer 1 — atlas format and process contract

### 3.1 Items are blueprints (Exp6 base, Exp7 revisions)

What an Exp6 blueprint can carry (read-only check of `JFactor_exp6.js` and `docs/api/jblueprint.md`, `jgroup.md`, `concepts.md`):

| Exp6 blueprint has | Where | Exp7 uses it for |
|---|---|---|
| `resources` (Map name → Joy/JRelation; `resource(name,{start,polarity,kind,gate,chain})`) | `resource()` ~L4382 | **numeric values** (amount, hours, cost …) |
| `methods` (scorers `fn(ctx)→number`, `methodFrom`), layer `score` (group scorer) | `method()` ~L4412, `_compileLayer` ~L4505 | **scoring factors** (as a named scorer per item) |
| `fns` (value methods), events `onChange/onGain/onSpend/when` | ~L4116, ~L4160–4296; `docs/api/events.md` | item behaviour when its resources change |
| `layers` → steps `do(name,{method,from,to,x,y,after})`; `after` → `JAction.jreq` (same layer only) | `do()` ~L4463, `_compileLayer` | steps *inside* an item |
| built handle **is a `JGroup`**: `jgroup` (shares identity with `root.sequence.jgroup`), `jatomic`, `jreq`, `jmethod`; `Consider`, `considerBp`, `Best`, `SimulatedBest`, `run`, `runAsync`, `plan()` | `build()` ~L4579, `considerBp` ~L4697 | **alternatives** and **jreq** (3.2, 3.3) |
| `JGroup.asBlueprint()` / `upgrade()` / `JBlueprint.fromGroup()`: wrap any jgroup as a built blueprint (sequence = that group) | ~L1981, ~L4706 | importing existing jgroups as items |
| `name`, `planIR` (compiled frame) | constructor ~L4043 | display name; fast path |

What Exp6 does **not** carry today, and Exp7 adds natively (3.4): a data bag (dates, notes, ids), first-class factors,
user-facing state (pick, done), one-of alternatives with Pref/Unavail, a live jreq to any item.

Item (shown as JSON for readability only; JSON is an interchange/debug view, not the storage format, see 3.5):

```json
"car": { "id": "car", "name": "Car",
  "resources": { "amount": { "start": [REDACTED-AMOUNT], "polarity": "-" }, "cash": { "shared": "joy:cash" } },
  "factors":   { "cost": [REDACTED-AMOUNT], "joy": [REDACTED-AMOUNT] },
  "scorer":    { "circuit": "circ:score_car" },
  "layers":    [ { "name": "Car", "steps": [ { "name": "pay", "from": "cash", "x": [REDACTED-AMOUNT] } ] } ],
  "jreq":      "item:e4",
  "alts":      { "members": ["item:tesla", "item:used"], "pref": "item:tesla", "unavail": ["item:used"] },
  "data":      { "date": "2027-06-01", "note": "lease" },
  "state":     { "userPick": null, "pick": "item:tesla", "done": false } }
```

- `factors` are first-class (named weights the default scorer uses); a custom `scorer` (method or circuit) is still allowed.
- Shared stocks (cash) are one stock referenced by every item that uses it.

### 3.2 Alternatives and the pick (native one-of)

- `alts` makes the item a **one-of choice group**: exactly one member is picked.
- **Pick order:** user pick (`state.userPick`) > Pref > best score among members not Unavail (simulated, does not commit).
  The result is `state.pick`. Unavail members are never considered.
- One item may be a member under several parents.

### 3.3 jreq (live reference, any item)

- `jreq` is a plain reference to any other item (not only steps in the same layer). Changing it takes effect at the next pass,
  without a rebuild. Following jreq refs gives the chain; the chain is the sequence.
- Inside one item, step order can still use `do(…,{after})`.
- **Satisfied (Exp7 rule, any item, atomic or not):** the required item B is evaluated through **all** of its parts first; B
  is satisfied if **at least one** thing in B passes. Atomic B adds only its own rule (all parts pass or fail together).
- `Consider` copies a group's jreq onto children that have none: **kept, by design** (children inherit the group's requirement).
- `Validate` accepts a required group by identity **or by equal `hash`**: **kept, by design**, so groups can regroup in
  non-atomic behaviour and still satisfy a requirement. Hashes are also why non-atomic groups keep their identity.

### 3.4 Exp7 rules that revise Exp6

| # | Exp7 rule | What Exp6 does today |
|---|---|---|
| 1 | **jreq is a plain reference and a live link**; a change applies without rebuild. | `build()` copies `built.jreq = seq.jreq` once (L4619); later changes do not reach `root.sequence`. |
| 2 | **Atomic only means all internal parts pass or fail together, under the group's name.** A group may exist even when not all its parts pass. **Being required never forces atomic**, and no wrapper is used. | `docs/api/concepts.md` says "If something later jreqs a group, that group must be atomic" (non-atomic groups unpack and the wrapper may disappear); `_compileLayer` forces `rel.sequence.jatomic = false` (L4563; also L4405, L4791). Exp7 treats the doc rule as a defect (identity survives through hashes, see 3.3). |
| 3 | **Requirements between any two items.** | `do(…,{after})` throws unless the step is in the same layer. |
| 4 | **Native one-of choice group** (alternatives, Pref, Unavail, user pick). | `Best()` returns every executable action; no "exactly one" construct. |
| 5 | **Data bag on items** (dates, notes, ids). | Resources are numbers (`jmax`) only. |
| 6 | **Scoring factors are a first-class field**; custom scorers stay available. | Only scorers (`method`, layer `score`). |
| 7 | **Shared stocks are referenced by id/ref** in storage and re-linked on load; the storage format is open (3.5). | Shared by object identity (`JWorld.fromBlueprint` adopts by identity); lost when serialised. |
| 8 | **Revision and ownership checks are part of Exp7** (3.7); revisions are tracked **per path**. | `runAsync` is cooperative interleave, no isolation (`jworld.md`). |
| 9 | **jreq satisfied** when B ran through all its parts and at least one passed (3.3). | `concepts.md` implies required groups must be atomic. |
| 10 | **No fixed event re-entrancy cap.** An event raised while handling an event is **deferred to the next pass** (same as circuit loops), never dropped; each pass handles one re-entry level, so a loop advances one step per pass. | Re-entrancy capped at ~8 (`events.md`); deeper events are dropped. |

### 3.5 Joys, circuits, components, storage

Shape (JSON shown as an interchange/debug view only):

```json
{ "kind": "exp7-atlas", "version": 1, "id": "money", "rev": [REDACTED-AMOUNT],
  "items": { "car": { "…": "see 3.1" } },
  "joys": { "cash": { "id": "cash", "name": "Cash", "value": [REDACTED-AMOUNT] }, "clock": { "id": "clock", "value": 0 } },
  "circuits": { "score_car": { "id": "score_car", "nodes": [], "wires": [] } },
  "components": { "plan": { "id": "plan", "pattern": "plan", "items": ["item:car"], "view": { "kind": "req-path" }, "circuits": [] } },
  "shared": { "selection": "item:car", "focusDate": "2027-06-01" },
  "owners": { "items/car/data/date": "proc:budget" } }
```

- Refs are strings: `item:` `joy:` `circ:` `comp:`.
- New in Exp7: `rev`, `shared`, `owners`, `pattern` on components, `circuits` (was `blueprints`).
- **Storage format — DIRECTION** (Artist spike, `43-exp7-storage-spike.md`): **columnar JRB atlas profile** (columns, references as
  indices, string table, varints, JRP per stream), **one snapshot by default with optional chunks**, plus an **append-only change log
  with per-path revisions**; **JSON only as interchange / debug view**. Spike numbers on ranking_atlas (1,286,262 B JSON): 83.5 KB vs
  85 KB JRP-of-JSON, brotli 91 KB; decode ~250 ms JIT single stream, ~150 ms with 4 workers, ~5 s no-JIT with workers; single-HTML
  export ~196 KB; change log 13–57 B per proposal, 1,000 proposals applied in 3.8 ms. The offline export must still be **one
  self-contained HTML** with no network.
- **Storage answers (reported by the Artist agent from Matthew's answer; Matthew to confirm):** (1) **no-JIT is a real target** for atlas files: ~5 s decode with workers; decode off the main thread, show the shell first, keep the plain fallback ready. (2) **The Artist agent builds the in-browser Wasm compaction encoder**: Rust → Wasm, one crate shared with the decoder so the format cannot drift; compaction runs in a worker only when the log gets big; Wasm size and no-JIT compaction cost still to be measured (box-only, `/workspace/td/jrender/spike/`).
- **Storage decisions (reported by the Artist agent from Matthew's answers; Matthew to confirm):** **strong profile (M7) for archives, fast profile (F4n) for live use and the export**; compaction runs in a worker and **copies unchanged streams** instead of re-encoding them; JSON debug files with irregular whitespace are **re-saved pretty-printed with a 1-space indent** after an edit; **real proposal traffic does not exist yet** — synthetic traffic from doc 44 until stage 0 produces real traffic. Round 2 numbers (Artist agent, box-only, SPIKE.md Round 2): F4n vs M7 no-JIT decode 3,187 vs 7,780 ms (2.44x); F4n size +5.6% at 1x (84,847 B); 4 workers no-JIT ~2.1 s; compaction of 1x atlas + 1,000 proposals 295 ms JIT / 8.3 s no-JIT; 50x atlas peaks 219 MB of the 256 MiB wasm cap; a decoder-only wasm for the HTML export is not built yet. Expected proposal shape and synthetic traffic: `44-exp7-proposal-traffic.md`.
- **Object key order (working rule, Matthew to confirm):** the canonical order of object keys is file/insertion order; proposal writers must not rely on the order of integer-like keys (JS reorders `"10"`, `"2"`); compaction compares such objects by value. The JRB codec keeps file order; see 3.7 rule 7 and doc 44 §7.
- **Chunks (Matthew confirmed):** chunked storage switches in **automatically by atlas size** (about 5x the current atlas), not now.
- **Change log (Matthew confirmed):** the **stored** change log is **binary** (version byte, per-record CRC, a reader for old JSON logs; built by the Artist agent); the JSON log is the interchange and debug form.
- **Dictionary (Matthew confirmed):** the shared dictionary is **fixed for the container's life** and rebuilt only at a major migration or at the chunked-storage switch; not refreshed at each archive rebuild (a refresh re-encodes every stream and breaks copy-unchanged byte identity). The header carries a **dictionary id and version**.
- **Never-fail storage (3.7 rule 14, reading, Matthew to confirm):** unchanged re-save and nothing-to-compact give identical bytes; saves and compaction write a temp file then atomically rename.
- **Ref check (spike "79 dangling refs"):** all 79 are `values.needs` entries of the form `item:rd_*#KEY`, built on purpose by `nd` in
  `tools/import_ranking_atlas.js` (L44: entry ref + `#` + alternative key; matched by prefix in `atlas/atlas.js` L158). The spike
  resolver does not know the `#KEY` suffix. All 79 base items exist; 71 match a member key. **8 are really dangling:** `item:rd_car#A1`,
  `#A2`, `#A3`. Car members have keys A, B, AL only, so those needs can never be met. Fix in the importer/source data in stage 1.

### 3.6 Evaluation (same rule as Exp6 and atlas v5, ADR 0084)

- A pass reads **one snapshot** and evaluates every dirty circuit against it.
- Writes are merged at the end of the pass: **numeric deltas (`add`) add up** (Exp6 rule); other writes to the same field (`set`)
  apply in a fixed order (wiring dependency, then id), the last one wins, and a **conflict marker** is recorded.
- Loops are allowed: their outputs land in the next pass. Order comes **only** from wiring dependencies.
- An item's best/simulated evaluation runs inside a pass; its resource deltas are merged like any `add`.

### 3.7 Async process protocol

| Message | Direction | Content |
|---|---|---|
| `read` | process → atlas | `{paths?}` → `{rev, data}` (snapshot) |
| `propose` | process → atlas | `{proc, baseRev, writes:[{path, op:"add"\|"set", value}], note}` |
| `accepted` / `rejected` | atlas → process | `{rev, merged:[...], conflicts:[...]}` or `{reason, currentRev}` |
| `changed` | atlas → subscribers | `{rev, paths}` after each applied pass |

1. A proposal is applied at the next pass with all other proposals (same merge rule as circuits).
2. **`add` never needs a fresh revision** (Exp6 deltas stay valid on a newer atlas).
3. Revisions are tracked **per path** and used for change detection, `changed` events and the log. **A `set`/`ref` based on an older revision is NOT rejected; the latest accepted proposal wins** (Matthew's answer: no, reading to confirm). Deltas still add up.
4. **Ownership:** recorded per path and reported; it never rejects a change (see rule 13).
5. Views never write directly; they send events, and circuits turn them into proposals.
6. No cross-process transaction; contested stocks use ownership or ordered proposals.
7. **Object key order (working rule, Matthew to confirm):** the canonical order of object keys is file/insertion order; proposal writers must not rely on the order of integer-like keys (JS reorders `"10"`, `"2"`); compaction compares such objects by value. See doc 44 §7.
8. **Paths and op kinds (working rule, Matthew to confirm):** paths mirror the atlas file (`items/<id>/values/start`, `joys/<id>/value`, `items/<id>/alts/pref`, `items/<id>/alts/unavail`, `items/<id>/state/userPick`, `components/<id>/items`); ops `set` | `delta` | `add` | `remove` | `ref` (doc 44 §2).
9. **No silent creation (working rule, Matthew to confirm):** `set` / `delta` / `ref` / date move on a missing path is rejected (`missing-path` / `missing-parent`); creating a field needs an explicit `add`. `set` keeps the existing type (`type-change`).
10. **Joy deltas (working rule, Matthew to confirm):** `delta` targets `joys/<id>/value` and is numeric-only (`not-number`); string-valued joys (17 of 94 in ranking_atlas) accept only a same-type `set`.
11. **Pref / Unavail / pick / ticks / dates (working rule, Matthew to confirm):** Pref = `ref` on `items/<id>/alts/pref`; Unavail = `add`/`remove` member on `items/<id>/alts/unavail`; pick = `add` then `ref` on `items/<id>/state/userPick` (runtime field, absent in the file); a tick = `delta +1` on `joys/<clock.joy>/value` only when top-level `clock.on` and that joy exists; a date move needs an existing `values/start` (326 of 879 items), giving a start is a separate `add`.
12. **Batches (working rule, Matthew to confirm):** a proposal or planner batch is all-or-nothing; the rejection names the failing op (index + path). Generators emit only valid ops.
13. **Ownership (Matthew's answer: take ownership by changing; my consequences, reading to confirm):** Matthew: *"I meant last active, meaning if someone wants to make a change they take ownership."* Consequences: any writer may `set`, `ref`, `add`, `remove` or `delta` any path; an **accepted** change makes that writer the path's new owner (a rejected one does not). Ownership is **recorded and reported** (who last took it) but **never rejects** — this replaces the earlier "only an absolute set by a non-owner is blocked" (no `not-owner` reason). Conflicts are **not rejected** (Matthew's answer: no, reading to confirm): there is **no explicit claim/lock**, and a `set`/`ref` based on an older revision is accepted; the latest accepted proposal wins; deltas add up. **Surfacing a lost race (my consequence, to confirm):** when an accepted `set`/`ref` overwrites a path whose recorded owner is another writer and whose revision is newer than the proposal's `baseRev`, the previous owner receives a `changed` event naming the path and the **new owner** (`overwrote: [{path, prevOwner}]` on the accept). **Risk (open for Matthew): silent overwrite** if the previous writer ignores `changed` events. `ref` counts as an absolute write like `set` (Matthew's answer: ok).
14. **Changes never fail.** Matthew's hard rule, verbatim: *"No, changes must never fail."* Reading (reading, Matthew to confirm):
    (a) any no-change input (empty batch, nothing to compact, unchanged re-save) succeeds with **identical bytes**;
    (b) applying, saving and compacting a **valid** change never errors or loses data, including a crash mid-save (write a temp file, then atomic rename; the old file stays intact until the new one is complete);
    (c) a rule-breaking proposal is cleanly **rejected** with the failing op's index and path; a rejection is a normal result, not a failure.
15. **Op edge cases (working rule, Matthew to confirm):** `add` of a member already in a **list** is an accepted no-op (nothing written, no owner/revision change, not in `changed`); `add` on an existing scalar/field path is **rejected** (`exists`; replace is `set`); `remove` of a member that is not in the list is an accepted no-op (a missing *path* is still `missing-path`); `ref` has no stale-revision check, exactly like `set` (ownership by acting, latest accepted wins). Batches are 0..5000 ops; an empty batch is valid and succeeds (rule 14).
16. **Accepted outcome / `changed` shape (shape agreed with codec, Matthew to confirm):** an accepted proposal returns `{ok, rev, owner, changed: [{path, from}]}` — one entry per path it actually wrote, `from` = the previous owner (`null` if none). This is also the shape of the `changed` event entries naming who was overwritten. Checker: `tools/gen_synthetic_proposals.js` `check()`; tests: `atlas/test/proposals_test.js`.

## 4. Layer 2 — standard patterns (data and states, no UI)

### 4.1 Plan pattern

A plan is a set of items (blueprints), their alternatives and their jreq chains.

| State | When | Basis |
|---|---|---|
| **landed** | date ≤ as-of, or `state.done` | Exp7 data bag / state |
| **chosen** | current pick of its alternatives | Exp7 one-of (3.2) |
| **open** | jreq satisfied, not landed, not chosen elsewhere | `Validate(joption)` ready |
| **blocked** | jreq not satisfied (rule 9), or required item Unavail | `Validate` not ready |
| **unavailable** | Unavail in its parent alternatives | Exp7 one-of |
| **conflict** | required item not dated earlier | Exp7 data bag |
| **broken** | jreq ref to a missing item | Exp7 |
| **cycle** | jreq chain reaches the item again | Exp7 check before build |
| **order** | (display) prerequisite listed after | Exp7 display |

Rules exist today in `atlas/eval.js` (`sequence`, `itemFlags`) and `atlas/runtime.js` (`depsOrder`, `depsHtml`, M22).

### 4.2 Calendar pattern

Items with `data.date` and/or a repeat rule. Month, day buckets, per-day labels and styles computed by circuits (e.g. running
cash), range, as-of. Day states: `busy`, `overload`, `low`, `bad`, `tight`.

### 4.3 Board pattern

Items without a date. Moving onto the calendar = giving a date. States: `unscheduled`, `scheduled`, `blocked`.

### 4.4 Connecting patterns

The same item is a plan step, a calendar entry and a board card. `shared.selection` / `shared.focusDate` are atlas state: picking a
board card highlights its req-path and its day.

## 5. Layer 3 — standard views

```
<exp7-req-path atlas-ref="money" comp="plan"></exp7-req-path>
in:  atlas snapshot (or the paths it reads), the component, shared state
out: events only — { type: "select" | "pick" | "drag" | "drop" | "unavail" | "pref", item, target?, value? }
```

- Views **never write the atlas**. Events go to circuits, and circuits turn them into proposals.
- Views read `shared.selection` and re-render on `changed`. Theme from component tokens.
- Order: 1 req-path view (later competing paths, one column per alternative path with its score), 2 calendar, 3 board.

## 6. Layer 4 — what happens to JEditor

| Keep | Change | Drop |
|---|---|---|
| atlas core (`atlas/atlas.js`), evaluator (`atlas/eval.js`), offline export (`atlas/build_atlas.js`) | editor → **atlas inspector** + **circuit wiring view** | click-to-build UI authoring |
| ranking_atlas as proof atlas, parity tooling | `atlas/runtime.js` deps/calendar/board renderers become the first standard views | — |

## 7. How ranking_atlas maps onto Exp7

| Exp7 piece | In ranking_atlas today | Gap |
|---|---|---|
| items as blueprints | 104 entries (`rd_*`) are atlas v5 items (values, factors, state, alts, jreq) | close to the Exp7 item already: `values` → resources + data bag |
| alternatives | 432 alternatives with Pref/Unavail/user pick | already the Exp7 one-of rule |
| jreq | 9 real imported requirements (M22), plain refs | already live refs; apply rule 9 |
| plan + req-path view | CALENDAR → Plan "Dependencies & sequence (jreq)" (M22, ADR 0104): parity 379/379, order 115/115 | static snapshot; landed/open/chosen not computed |
| circuits | atlas v5 `blueprints` (scoring/formula, ADR 0103) | rename key `blueprints` → `circuits`, `bp:` → `circ:` (migration) |
| calendar / board | CALENDAR tab, money template, Board | — |
| async processes | none: the page is the only writer | stage 3 |

## 8. Exp6 migration / compat

- **Exp7 replaces Exp6.** Exp6 (`JFactor_exp6.js`, The Joy Machine 2; living-core read-only) stays as-is only until its code is
  migrated; it gets no new features.
- Migration path: an Exp6 `JBlueprint`/`JGroup` converts to an Exp7 item: resources → resources, `method`/layer `score` →
  `scorer`, `jreq` object → ref, `jatomic` kept (rule 2 meaning), `name` → name; data bag, factors and alternatives start empty.
- Code whose results change under the revised rules (live jreq, atomic not forced, cross-item requirements, no event cap) must be
  flagged by the migration, not silently changed.
- Sources read (read-only): `JFactor_exp6.js` `class JBlueprint` (L4028), `_compileLayer` (L4505), `build` (L4579),
  `considerBp` (L4697), `JGroup.asBlueprint` (L1981), `Validate` (L1873/L2372), `updateAsync` (L2549), `class JWorld` (L4737);
  `docs/api/jblueprint.md`, `jgroup.md`, `concepts.md`, `jworld.md`, `events.md`, `scoring.md`; tests
  `test_blueprint_as_jgroup.js`, `test_multiperspective.js`, `test_dual_calendar_perspectives.js`, `test_parallel_update.js`.

## 9. Open questions

1. **Storage format** — DIRECTION set (3.5: columnar JRB atlas profile + optional chunks + append-only per-path change log;
   JSON = interchange/debug). Answered (reported by the Artist agent from Matthew's answer; Matthew to confirm): (1) **no-JIT is a real target** for atlas files: ~5 s decode with workers; decode off the main thread, show the shell first, keep the plain fallback ready. (2) **The Artist agent builds the in-browser Wasm compaction encoder**: Rust → Wasm, one crate shared with the decoder so the format cannot drift; compaction runs in a worker only when the log gets big; Wasm size and no-JIT compaction cost still to be measured (box-only, `/workspace/td/jrender/spike/`).
2. **Outside-process connection** — research needed (stage 0 task): file + watch, local socket, shared memory / worker messages, other.
3. **`Best()` sync or async?** Exp6 keeps `Best()` synchronous inside `updateAsync` (L2549 area; reason not remembered). Settle by
   the stage-0 test. **Answered by test (doc 48, ADR 0109):** sync by default; opt-in hybrid async above ~250 alternative items.
4. **Relations auto-chain jreq only with `chain: true`** — keep, or chain by default?
6. **Score anchors** — keep `±Number.MAX_VALUE` for failed atomics / quotas (hurts float discrimination, `scoring.md`)?
7. **Landed** — date, explicit done flag, or both? Who sets it?
8. **Competing paths** — how many, scored by simulation or live best?
9. **View packaging** — plain custom elements? Versioning?
[REDACTED-AMOUNT]. **Build cost** — rebuild items each pass, or cache and rebuild on change?
11. **Circuits vs blueprint events** — may circuit nodes call blueprint `fn` / `when` handlers?
[REDACTED-AMOUNT]. **Living host** — relation to living-core Phase 8 "view jmethod" (`PHASES.md`)? (Read-only.)
12. **Lost-race overwrites (for Matthew):** with no locks and latest-wins, is a `changed` event naming the new owner enough, or does a silently overwritten `set` need more (e.g. a warning in the view, or keeping the overwritten value in the log for undo)?
13. **Circuit language** — direction: Verse-like text language (doc 45). Matthew agreed to the direction (yes, 2026-11-02); syntax is still illustrative and undecided; the word circuit stays until the language is chosen. Open: the actual syntax, and the language name.

See also: `45-exp7-circuit-language.md` (Verse-like text language: direction agreed, syntax open) and `46-exp7-container-name-audit.md` (Exp7 container vs Exp6 `JWorld`; Matthew picked **atlas**, executed in ADR 0106).

**Answered (Matthew, Nov 2):** No explicit claim/lock; a `set` based on an older revision is not rejected, latest accepted wins (Matthew's answer: no, reading to confirm; 3.7 rules 3, 13). Ownership: taken by changing — an accepted change makes its writer the owner; ownership never rejects, revisions catch conflicts (Matthew's answer; consequences reading to confirm; 3.7 rule 13). `ref` counts as `set` for ownership (Matthew's answer: ok). Q5 (add/remove/delta on owned paths): allowed; only a non-owner `set` is blocked (Matthew's answer "5 yes", reading to confirm; 3.7 rule 13). rules 1–10 in 3.4 (live jreq; atomic never forced by being required; requirements between any
items; native one-of; data bag; first-class factors; shared stocks by ref; revision/ownership checks, revisions per path; jreq
satisfied when B ran all parts and one passed; no event cap, re-entry deferred to next pass). By design, kept: `Consider` copies
jreq to children; `Validate` hash match (regrouping); non-atomic groups keep identity through hashes. Exp7 fully replaces Exp6.
Atlas format is not assumed JSON.

## 10. Staged plan

| Stage | Scope | Done when |
|---|---|---|
| **0. Research and tests** | (a) compare outside-process transports: file + watch, local socket, shared memory / worker messages; (b) a test comparing synchronous and asynchronous `Best()` (same results? interleaving? speed?); (c) storage format: spike done (doc 43), direction in 3.5 | written findings; open questions 2–3 decided |
| **0b. Atlas format** | JRB atlas profile spec (JRB.md W1–W10 from doc [REDACTED-AMOUNT]); JRB encoder/decoder + JSON debug view; append-only change log with per-path revisions; optional chunks; single-HTML export embeds JRB; fix the 8 `rd_car#A1–A3` needs (**known issue**); no-JIT target: workers, shell first, plain fallback; Rust→Wasm compaction encoder (Artist agent; shared crate with decoder; worker, only when log is big; measure Wasm size + no-JIT cost); M7 archives / F4n live + export, worker compaction copying unchanged streams, 1-space pretty re-save of irregular JSON debug files, synthetic traffic from doc [REDACTED-AMOUNT] + `tools/gen_synthetic_proposals.js` until real traffic; build a decoder-only wasm for the export; chunks auto-switch at ~5x atlas size, binary stored change log (version byte, per-record CRC, old-JSON reader; Artist agent) with JSON as interchange/debug (Matthew confirmed), fixed dictionary with id+version (Matthew confirmed). **Never-fail tests (rule [REDACTED-AMOUNT]):** empty batch, nothing-to-compact and unchanged re-save give identical bytes; kill mid-save leaves the old file intact (temp + atomic rename); valid change → no error, no data loss through save + compact + reload; rule-breaking proposal → clean rejection naming op index + path (`atlas/test/proposals_test.js` covers empty batch, owner rule, all-or-nothing) (reported by the Artist agent from Matthew's answer; Matthew to confirm) | byte-identical round trip of ranking_atlas; log replay = snapshot; export ≤ ~200 KB opens offline |
| **1. Plan pattern + req-path view** | Exp7 core replacing Exp6 for items: factors, data bag, one-of alternatives, live jreq, rule 9, rule 10; plan states; `<exp7-req-path>`; events → circuits; `shared.selection`; Exp6 → Exp7 migration of ranking_atlas | ranking_atlas parity unchanged (379/379, 115/115); landed/chosen/blocked visible; offline file works |
| **2. Calendar + board** | patterns as data + states; `<exp7-calendar>`, `<exp7-board>`; shared selection | picking a board card highlights its path and day |
| **3. External process API** | per-path revisions, owners, read/propose/accepted/rejected/changed over the transport chosen in stage 0; one external planner writing an atlas asynchronously | an outside process and the page edit one atlas; latest accepted wins; ownership and overwrites reported via `changed`; `add`s merge |

JEditor's click-to-build features are frozen; they are removed or reduced to the inspector during stages 1–2.
