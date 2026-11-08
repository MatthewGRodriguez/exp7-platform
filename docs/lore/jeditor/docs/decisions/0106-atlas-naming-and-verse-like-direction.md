# ADR 0106 — Atlas naming and Verse-like direction

Status: accepted (2026-11-02, Matthew)

## Context
Doc 46 showed our Exp7 data container ("world") clashes with Exp6 `JWorld`, a different thing (runtime façade: shared resources + planner perspectives). Doc 45 proposed moving circuits from a node graph towards a Verse-like text language.

## Decision
1. **atlas (formerly world).** Matthew picked "atlas" for our Exp7 data container. Executed in Lore rev 87: `world/` → `atlas/`, `JWorldModel`/`JWorldEval` → `JAtlasModel`/`JAtlasEval`, `levels/ranking_world/world.json` → `atlas.json`, generator `--atlas`; "JRB world profile" → "JRB atlas profile". For one release loaders also read `world.json` and `--world` stays as a deprecated alias. Exp6 `JWorld`, the embedded Exp6 engine and vendor files keep their names. Details and the kept list: doc 46 §5.
2. **Verse-like direction.** Matthew agreed to the direction (yes, 2026-11-02); syntax is still illustrative and undecided; the word circuit stays until the language is chosen.

## Consequences
- The Artist agent renames its codec names in sync (doc 46 §5); JEditor does not touch the codec.
- Open: stored format ids (`jeditor-world`, ref kind `world`), editor UI layer (`world_editor.js`, `/api/world*`, `JW`/`jw-*`), `worlds/` folder, `levels/ranking_world` → `ranking_atlas`?; circuit language syntax and name (spec 42 Q13).
- Older ADRs (0078, 0090, 0104, 0105 …) and NOTES lines keep "world" as history.
