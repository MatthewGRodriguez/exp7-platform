# ADR 0110: Exp7 circuit language v0 (doc 45 §4A)

Status: proposed, 2026-11-02. Matthew delegated the syntax ("doesn't care about the Verse-like syntax"). These are defaults and can be changed.

## Decision
- There are two statement kinds. `score NAME = expr` lowers to an Exp6 `JBlueprint` stage-1 graph, accepted by `jbp.compile`.
  `on EVENT(params) [when expr]: op; ...` lowers to Exp7 atlas ops (set/delta/add/remove/ref).
- No loops, functions, variables or significant indentation. `@path` reads the pass snapshot (rules only). `{param}` in paths.
- Text is the source of truth (`.circ`). The canonical printer makes `print(parse(x))` stable. A graph view is a read-only projection.
- It runs in the engine pass. Exp6 blueprints keep their name, and scores compile to them.

## Consequences
- `atlas/circuit_lang.js` (parser, printer, `toBlueprint`, `toOps`) and `atlas/test/circuit_lang_test.js` 12/12.
  It is not wired into runtime.js yet. That needs a later step that migrates atlas `blueprints` to circuits (ranking_atlas migration plan, doc 49).
