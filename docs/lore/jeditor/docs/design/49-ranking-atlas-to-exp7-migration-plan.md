# 49 · ranking_atlas → Exp7 migration plan (plan only, no data migrated)

Date: 2026-11-02 (CST). Status: PLAN. Nothing in `levels/ranking_atlas` has been changed. Inputs: spec 42 §7–8, docs 44, 45 §4A, 47, 48, ADRs 0106–0111.

## 0. Starting point (measured / documented)
- atlas v5, 1,286,262 B JSON. It has 104 `rd_*` items, 432 alternatives (pref/unavail/pick), 9 jreq, and 94 joys (17 of them string-valued).
- atlas v5 `blueprints` hold the scoring formulas (ADR 0103). The plan view is a static snapshot (deps parity 379/379, order 115/115).
- Known issue: 8 `rd_car#A1–A3` needs.

## 1. Principles
1. **Derived, reversible, side by side.** A converter writes `atlas.exp7.*` *next to* the v5 file. It never edits v5 in place. v5 stays the source until the gate (§4) passes.
2. **Gates use the existing tests.** They must keep passing unchanged: ranking import 59/0, money parity 726 with max diff 0, deps 8, atlas 77, proposals 17.
3. Money numbers are never changed by the migration. Any money diff blocks the step.

## 2. Steps (each step is its own Lore revision)
| # | Step | Output | Gate |
|---|---|---|---|
| M1 | **Inventory dry run**: `tools/exp7_migrate.js --dry` lists every v5 key and its Exp7 target (spec 42 §7 table) and the unmapped keys | report only | 0 unmapped, or each one listed with a decision |
| M2 | **Items, alternatives, jreq** → Exp7 item shape (`values` → resources + data bag, alternatives one-of, live jreq rule 9) | `atlas.exp7.json` (debug) | deps parity 379/379, order 115/115; Best() picks byte-identical (doc 48 harness) |
| M3 | **Joys**: numeric joys accept `delta`; the 17 string joys accept same-type `set` only (rule 10) | same file | money parity 726, max diff 0 |
| M4 | **blueprints → circuits**: each v5 blueprint is printed as a `score` in `.circ` (doc 45 §4A). Then `toBlueprint` must produce a graph that scores identically to the stored one | `circuits/*.circ` | score parity on all 104 items, max diff 0 |
| M5 | **Encode** with the Artist codec (atlas/1) plus the JSON debug view; the change log starts empty at revision 0 | `atlas.exp7.jrb` | decode(encode) byte-identical; size reported |
| M6 | **Fix rd_car#A1–A3** as an explicit, separate proposal (not hidden in the converter) | 1 proposal | Matthew reviews the diff |
| M7 | **Switch the reader** behind a flag (`?atlas=exp7`), with v5 as the default for one release | runtime flag | all gates green with the flag on and off |
| M8 | **Retire v5** after one release with no regressions; keep the v5 file read-only in history | — | Matthew's go |

## 3. Out of scope
Multi-writer sync of the real atlas (that stays on the synthetic test repo until a separate decision), Exp6 code changes, and living-core.

## 4. Defaults chosen
- The converter is a Node tool in `tools/`. It is pure and deterministic, so running it twice gives the same bytes.
- Revision numbering restarts at 0 for the Exp7 log. The v5 version is recorded in the header.
- String joys stay string-valued (no coercion).
- If an M4 parity check fails for a formula, that blueprint stays a stored Exp6 graph (a circuit `score` that wraps it is allowed later). The language is not stretched to cover it.
