# ADR 0107 — Atlas rename, round 2: level, importer, editor names and stored values

Status: accepted (2026-11-02, Matthew "yes" to the three open items of ADR 0106)

## Decision
1. **Level and importer.** `levels/ranking_world` → `levels/ranking_atlas` (page `ranking_atlas.html`); `tools/import_ranking_world.js` → `tools/import_ranking_atlas.js`. The old tool path is a thin forwarding shim and loaders fall back to the old level folder, for one release.
2. **Editor names.** `editor/atlas.html`, `atlas_editor.js`, `atlas_editor.css`; `/api/atlases`, `/api/atlas`, `/api/atlas/{build,preview,export}`; page global `window.JAtlas` with `.atlas`; ids/classes `ja-*`, attributes `data-ja-*`. Old URLs, routes, response keys (`world`, `worlds`), `window.JW` and `.world` stay as aliases for one release.
3. **Stored values.** New atlases are written with the new values; old files keep loading unchanged; saving an old file keeps its `format` unless it is explicitly migrated (`M.migrate`), so the Artist agent's golden hashes stay valid. Readers accept both values for one release.

## Exact stored/emitted strings that changed (for the codec side)
| where | old | new | when |
|---|---|---|---|
| atlas file `format` | `"jeditor-world"` | `"jeditor-atlas"` | new atlases (`M.empty`) and `M.migrate()`; existing files keep theirs |
| `M.empty()` default `id` / `title` (no id given) | `"world"` | `"atlas"` | new atlases only |
| reference kind of the atlas itself in `refs()` / `broken()` (`from`) | `"world"` | `"atlas"` | computed, not in atlas files; `fixRef` accepts both |
| exported page: embedded data script id | `jw-world` | `ja-atlas` | every new build |
| exported page: script ids `jw-model`, `jw-eval`, `jw-runtime`; every `jw-*` class/id; `data-jw-*` attributes | `jw-…` | `ja-…` | every new build |
| exported page global | `window.JW`, `JW.world` | `window.JAtlas`, `JAtlas.atlas` (old names aliased) | every new build |
| editor history labels (history.json) | `new world`, `rename world` | `new atlas`, `rename atlas` | new edits only |
| editor API keys | `world`, `worlds` | `atlas`, `atlases` (old keys still sent/accepted) | — |

Unchanged on purpose: `levels/ranking_atlas/atlas.json` bytes (moved only; its `format` stays `jeditor-world`, `id` `ranking_world`, title `Ranking world`); `version: 5`; the `worlds/` folder and `JEDITOR_WORLDS`. `ranking_atlas.html` was rebuilt (bytes changed through the `ja-*` ids and globals).

## Consequences
- Tests unchanged in count; M17/M18/M22 browser proofs re-run, results identical to rev 88 apart from timings, temp paths and export sizes (doc 46 §6).
- Remove the aliases and the shim after one release.
