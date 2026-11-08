# 44 · Exp7 proposal traffic: expected shape (for change-log measurement)

> Written Nov 2, 2026 for the Artist agent (Ash Tangent Residual Artist, JRB atlas codec) so it can measure the change log with
> realistic **synthetic** traffic. Source: spec `42-exp7-spec.md` §3.7 and the real ranking_atlas `atlas.json` **structure**
> (key names, types and counts only). **Revised 4:25 PM** after the Artist ran the generator against the real 1x atlas and found
> wrong paths (joys, Pref/Unavail, clock, start). **No real proposal traffic exists yet.** Every rate, size, mix and growth number
> is an **ESTIMATE**. Tags: **DECISION** (spec / Matthew), **WORKING RULE, Matthew to confirm** (from the operator, not Matthew),
> **PLACEHOLDER** (proposed here, open).

## 0. Real atlas structure the paths follow (ranking_atlas, counts only)

| Where | Shape | Counts |
|---|---|---|
| top level | `format, version, id, title, items, joys, blueprints, components, root, clock, topJoys` | — |
| `clock` | `{joy: string, ms: number, on: boolean}` — config; a tick is `+1` on `joys[clock.joy].value` (`atlas/runtime.js` `JW.tick`) | ranking_atlas: `on: false`, and `clock.joy` names no existing joy → **no ticks** |
| `joys/<id>` | `{id, name, value, fmt?}` (no `values.amount`) | 94 joys; `value` number 77, **string 17**; `fmt` on 19 |
| `items/<id>` | `{id, name, values, state, alts?, factors?, jreq?, blueprint?, kind?}` | 879 items; `state` present on 879, **empty on all 879** |
| `items/<id>/values/start` | string date | **326 of 879** |
| `items/<id>/alts` | `{members: [ref], pref: ref\|null, unavail: [ref], method: string}` | `alts` on 819, **non-empty on 104**; `pref` null 101 / member ref 3; `unavail` non-empty on 18 (36 refs) |
| `items/<id>/state/userPick` | member ref or null, **created at runtime** (`JW.pickAlt`) | absent in the file |
| `items/<id>/values/landed` | not present anywhere | 0 |
| `components/<id>` | `{id, name, items: [ref], sub, view, state, blueprints?, blueprint?}` | 74 |
| owners | no owner fields in the atlas | 0 |

## 1. Proposal shape

```json
{"id":"p_1a","proc":"ui:syn_user","baseRev":1042,"t":5310,"note":"optional",
 "ops":[{"path":"items/syn_17/values/start","op":"set","value":"2027-02-03"}]}
```

| Field | Type | Meaning |
|---|---|---|
| `id` | string `p_[0-9a-z]+` | proposal id, unique per process (PLACEHOLDER format) |
| `proc` | string | `ui:<user>`, `planner:<name>`, `clock`, `import:<name>` |
| `baseRev` | int ≥ 0 | atlas revision the writer read (DECISION, §3.7 rule 3) |
| `t` | int | writer time, seconds (PLACEHOLDER) |
| `note` | string, optional | mostly on planner/import batches |
| `ops` | array, 0..5000 (empty = no-change, succeeds; list `add` of an existing member and `remove` of a missing member are accepted no-ops, `add` on an existing scalar is rejected — spec 3.7 rule 15, working rule, Matthew to confirm) | writes, applied together at the next pass (DECISION) |

**Paths** mirror the file: `<collection>/<id>/<field>/…` with collection `items | joys | components | blueprints | clock`
(PLACEHOLDER syntax; replaces the earlier `kind:id.field` form).

## 2. Op kinds and path rules

| op | Meaning | Needs fresh rev? | Value | Value bytes (JSON, ESTIMATE) |
|---|---|---|---|---|
| `set` | absolute write; **keeps the existing type** (null accepts any) | no — latest accepted wins (Matthew's answer: no, reading to confirm) | bool, date, number, short text | 4–12; text 10–80 |
| `delta` | numeric add; deltas add up (DECISION); **target must be a number** | no | number | 2–8 |
| `add` | **creates a missing field**, or appends a member to an array | no (PLACEHOLDER) | any / ref | 12–30 |
| `remove` | removes a member from an array (absent member = no-op) | no (PLACEHOLDER) | ref | 12–30 |
| `ref` | change a reference field (pick, pref, jreq) | no (as `set`) | ref or `null` | 12–40 |

Working rules, **Matthew to confirm** (from the operator):
1. **Joy deltas** target `joys/<id>/value` and are numeric-only; a `delta` on a non-number is rejected `not-number`. String
   joys accept only `set`, which must keep the type (`type-change`). Generators pick delta targets only from numeric joys.
2. **Missing paths are never created silently:** `set` / `delta` / `ref` / date move on a missing path → `missing-path`
   (`missing-parent` if the entity is missing). Creating a field needs an explicit `add`.
   Pref → `ref` on `items/<id>/alts/pref`; Unavail → `add` / `remove` of a member ref on `items/<id>/alts/unavail`.
   User pick → `items/<id>/state/userPick`: `add` the first time (state is empty in the file), `ref` afterwards.
   Landed → `values/landed` does not exist today, so the first landed write is an `add`.
3. **Ticks** follow the top-level `clock`: `delta +1` on `joys/<clock.joy>/value`, only when `clock.on` and that joy exists and is
   numeric (ranking_atlas: never).
4. **Date move** = `set` on an existing `items/<id>/values/start`; giving a start to an item without one is a separate `add`
   (`startAdd`, small share).
5. **Ownership (Matthew's answer: take ownership by changing; my consequences, reading to confirm):** any writer may change any path; an accepted change makes that writer the owner (recorded, reported, never rejects). No explicit claim/lock, and an older-base `set`/`ref` is accepted — latest accepted wins (Matthew's answer: no, reading to confirm). A lost race is surfaced as a `changed` event to the previous owner naming the new owner (my consequence, to confirm); risk of silent overwrite is open for Matthew. With this rule the atlas-aware 1x day keeps 20 planner batches (seed 1).
6. **Changes never fail** (Matthew: *"No, changes must never fail."*; reading, Matthew to confirm, spec 3.7 rule 14): an empty batch (`ops: []`) is valid and succeeds with no change; a valid change never errors; a rule-breaking proposal is a normal **rejection** naming the failing op, not a failure. `--selftest` / `atlas/test/proposals_test.js` check this.

## 3. Replies — DECISION for the message set, PLACEHOLDER for field names

```json
{"type":"accepted","id":"p_1a","rev":1043,"merged":["items/syn_17/values/start"]}
{"type":"rejected","id":"p_1b","reason":"missing-path","op":0,"path":"items/syn_17/values/start","currentRev":1043}
{"type":"changed","rev":1043,"paths":["items/syn_17/values/start","joys/syn_j3/value"]}
{"type":"changed","rev":1044,"paths":["items/syn_17/values/start"],"newOwner":"planner:syn_bot"}
```
The second `changed` line goes to an overwritten previous owner (my consequence, to confirm).
`reason` ∈ `missing-path` | `missing-parent` | `not-number` | `type-change` | `exists` | `not-array` | `invalid`.
A proposal (and a planner batch) is **all-or-nothing**; the rejection **names the failing op** (`op` index + `path`) — working rule,
Matthew to confirm. No cross-process transactions (§3.7 rule 6).

## 4. Behaviours mapped to ops, and the mix (ESTIMATE)

| Kind | Behaviour | Ops | % of proposals |
|---|---|---|---|
| pick | user picks an alternative | `add`/`ref` `items/<id>/state/userPick` | 20 |
| pref | Pref toggle | `ref` `items/<id>/alts/pref` (`null` = clear) | 8 |
| unavail | Unavail toggle | `add`/`remove` `items/<id>/alts/unavail` | 7 |
| landed | mark landed | `add` then `set` `items/<id>/values/landed` | 5 |
| move | move a date (calendar/board) | `set` existing `items/<id>/values/start` | 14 |
| startAdd | give an item its first start | `add` `items/<id>/values/start` | **1 (ESTIMATE)** |
| delta | numeric change on joys | 1–3 `delta` `joys/<id>/value` (numeric joys only) | 20 |
| tick | clock | `delta +1` `joys/<clock.joy>/value` (only if clock on) | 10 |
| text | rename | `set` `items/<id>/name` | 8 |
| member | component membership | `add`/`remove` `components/<id>/items` | 5 |
| planner | planner / import batch, all-or-nothing | 10–100 (80%) or 100–1,000 ops: `set` start, `delta` joy, `ref` pref | 2 |

Kinds that have no valid target in an atlas are dropped from the mix (e.g. ticks on ranking_atlas).

## 5. What goes in the log — PLACEHOLDER (proposed), except accepted-only (DECISION-like from §3.7)

| Logged | Not logged |
|---|---|
| accepted proposals (with assigned rev) | rejected proposals (reply only) |
| user picks, Pref/Unavail, landed, dates, text, membership | **selection / hover / scroll / zoom** (`shared.selection` is shared view state) |
| numeric deltas; **clock ticks** (a tick is a real `delta +1` on `joys/<clock.joy>/value`, so it must be logged or coalesced into one delta per flush — PLACEHOLDER) | |
| planner and import batches (one entry per batch) | `changed` notifications (derivable from the log) |

## 6. Rates and growth (all ESTIMATE)

- Interactive user: bursts of 1–5 proposals/s; ~200–400 proposals on an active day.
- Planner process: 1–5 batches/day of 10–1,000 ops. Clock: 1 tick/s at `clock.ms` 1000 if on (coalesce before logging).
- Bulk import: rare, 100–5,000 ops in one proposal.

Log growth for a ranking_atlas-like atlas (300 user proposals/day at ~1.2 ops, 2 planner batches of ~200 ops, no ticks):
~800 ops/day; **~60 KB/day JSONL**, **~10–25 KB/day binary** at the spike's 13–57 B/proposal.
Atlas-aware 1x day (`--atlas` ranking_atlas, `--n 800 --seed 1`, rerun Nov 2 after the working rules of spec 3.7 rules 15–16): 800 proposals, 3,155 ops (780 ui, 20 planner, 0 clock); by op add 209, set 1,270, delta 1,053, ref 610, remove 13. (Earlier run: 3,052 ops, 786 ui, 14 planner.)

## 7. Object key order rule — working rule, Matthew to confirm

The JRB codec keeps **file order** of object keys. JavaScript objects reorder integer-like keys (`"10"`, `"2"` → `"2"`, `"10"`).
Therefore: **proposal writers must not rely on the key order of integer-like keys; the canonical order is file (insertion) order;
the compaction check compares such objects by value**, not by serialized bytes.

## 8. Sample, generator, checker

- `docs/design/44-sample-proposals.jsonl`: 30 proposals, every kind and op kind, one planner batch of 10–15 ops. **Invented ids
  and values only** (`syn_*`), generated against the built-in synthetic atlas that has the real shape (§0).
- `tools/gen_synthetic_proposals.js` (no dependencies, no network; an atlas file is only read):
  ```
  node tools/gen_synthetic_proposals.js --n 100000 --seed 1 --out /tmp/p.jsonl         # synthetic atlas, mix from §4
  node tools/gen_synthetic_proposals.js --n 30 --seed 44 --cover                        # every kind first (the sample)
  node tools/gen_synthetic_proposals.js --atlas W.json --n 800 --seed 1 --out /tmp/d.jsonl   # real ids/types; --out must be /tmp; prints counts
  node tools/gen_synthetic_proposals.js --check FILE [--atlas W.json]                    # counts only
  ```
  Generation applies each proposal to an in-memory atlas, so later proposals see earlier writes (e.g. `userPick` `add` then `ref`).
  `--check` replays proposals in memory, all-or-nothing, and prints valid/total and rejection counts by reason and path
  pattern (ids stripped). Proposals whose ids are not in `--atlas` (the invented sample) are checked **by template**: an op
  passes if some real entity of that collection accepts it under the same rules. Template checks are stateless, so a `ref` on
  `state/userPick` (which needs an earlier `add`) fails there by design.

Check results (Nov 2, 4:25 PM): sample vs synthetic atlas 30/30 proposals, 47/47 ops; sample vs real ranking_atlas (template)
30/30, 47/47; atlas-aware 1x day vs real 800/800, 3,052/3,052; synthetic 800 vs real (template) 685/800 — 114 `userPick` `ref`
without a prior `add` and 1 `landed` `set` (stateless template, expected).

## 9. Decisions vs working rules vs placeholders

- **Decisions** (spec §3.7 / Matthew): read / propose-against-revision / accepted / rejected / changed; per-path revisions; no claims/locks and older-base `set` accepted, latest wins (Matthew's answer: no, reading to confirm); numeric deltas add up; apply at next pass.
- **Working rules, Matthew to confirm:** key order (§7); joy deltas numeric-only on `joys/<id>/value`, string joys `set` only with
  the same type; no silent creation (missing path → rejected, `add` creates); Pref/Unavail on `alts/pref` / `alts/unavail`;
  ticks via `clock.joy`; date move needs an existing start, `startAdd` separate; batches all-or-nothing with the failing op named;
  changes-never-fail reading (rule 6).
- **Decided:** `ref` counts as an absolute write (Matthew's answer: ok); ownership is taken by changing and never rejects (Matthew's answer; consequences reading to confirm). Batch size 0..5000 ops (Matthew confirmed).
- **Placeholders / open:** path syntax, field names, `reason` values, `add`/`remove` freshness, tick logging/coalescing, `landed`
  field name, the lost-race / silent-overwrite surfacing (for Matthew), every number in §4 and §6. Replace with real traffic from stage 0.
