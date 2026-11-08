# 46 · "world" naming audit and rename proposal (no rename done)

> **Status: PROPOSAL, Matthew to pick.** Matthew (Nov 2): *"exp6 already had a world jworld I think, so anywhere where we
> mentioned world needs to change since they are not the same thing."* Nothing is renamed yet. Counts only, no data values.

## 1. What Exp6 calls a world

Exp6 `JWorld` (`The Joy Machine 2/living-core/vendor/exp6/JFactor_exp6.js`, doc comment L4720–4735, `class JWorld` L4737,
`fromBlueprint` L4751, export L4876, `bp.world()` L4891–4892; rules in `.cursor/rules/jfactor-api.mdc` L13, L24) is a
**runtime façade, not a data file**: a `resources` Map of shared live Joys/JRelations plus named **perspectives** (planners:
a `JRelation` or a blueprint `plan.root`) that mutate those shared resources. `run()` updates perspectives sequentially,
`runAsync()` interleaves them cooperatively via `updateAsync` (not transactional isolation); `fromBlueprint(bp)` adopts a
`JBlueprint`'s resource Map. The living host keeps one as `jf.jworld` (`host/living.js` L1847–1860). Exp7's "world" (the
`world.json` container of items, joys, components, clock; the JRB "world profile") is a **different thing**.

## 2. Uses of "world" in JEditor (heuristic classification, case-insensitive matches)

Classes: (a) Exp7 data container, (b) Exp6 JWorld, (c) generic English. Classifier: (b) if the surrounding text names JWorld
/ jworld / Exp6 world; (c) for phrases like "real world"; else (a). Scope: spec 42, 43, 44, NOTES.md, docs/decisions, world/,
tools/, levels/ranking_world/ (worlds/i, j, x excluded). 146 files scanned, 45 contain "world"; **452 matches: (a) 369, (b) 70, (c) 13.**

| File | a | b | c |
|---|---|---|---|
| levels/ranking_world/ranking_world.html | 32 | 42 | 3 |
| docs/design/42-exp7-spec.md | 55 | 10 | 1 |
| docs/design/44-exp7-proposal-traffic.md | 28 | 0 | 2 |
| tools/gen_synthetic_proposals.js | 25 | 0 | 1 |
| docs/design/43-exp7-storage-spike.md | 23 | 0 | 0 |
| world/build_world.js | 21 | 0 | 1 |
| NOTES.md | 19 | 1 | 1 |
| docs/decisions/0090-world-editor-routes.md | 15 | 0 | 0 |
| world/world.js | 12 | 2 | 1 |
| tools/import_ranking_world.js | 15 | 0 | 0 |
| world/test/world_test.js | 11 | 1 | 1 |
| docs/decisions/0078-world-holds-everything.md | 9 | 0 | 1 |
| docs/decisions/0105-exp7-standard-layer.md | 8 | 2 | 0 |
| world/test/ranking_import_test.js | 10 | 0 | 0 |
| world/runtime.js | 6 | 3 | 0 |
| world/test/demo_offline_spec.json | 7 | 0 | 0 |
| docs/decisions/0100-ranking-world-importer.md | 6 | 0 | 0 |
| tools/import_ranking_calendar.js | 6 | 0 | 0 |
| world/eval.js | 3 | 2 | 0 |
| levels/ranking_world/source/workbook_local.json | 0 | 5 | 0 |
| 25 other files (ADRs 0079–0104, tests, tools) | 58 | 2 | 2 |

Caveats: the 42 (b) in `ranking_world.html` and 5 in `workbook_local.json` are the embedded Exp6 engine (`class JWorld`) —
genuinely Exp6. **The (b) hits in `world/runtime.js`, `world/world.js`, `world/eval.js` are OUR identifiers `JWorldModel`
(5) / `JWorldEval` (6) / `JW`** — Exp7 code using the Exp6 class name prefix, so they are (a) and a **direct name clash**.

## 3. Candidate names (clash check: JEditor docs/code and Exp6 JFactor_exp6.js, whole-word)

| Name | JEditor uses | Exp6 uses | Notes |
|---|---|---|---|
| **realm** | 0 | 0 | short, "a bounded domain of things"; file `x.realm`, `JRealm`, "JRB realm profile" |
| weave | 0 | 0 | evokes linked items/requirements; less obvious meaning |
| atlas | 0 | 0 | "collection of maps/views"; fits views, less fits data |
| loom | 0 | 0 | pairs with weave; short; abstract |
| ~~ledger~~ | 44 | 0 | clashes with the cash ledger |
| ~~stage / plane / ground / slate~~ | 42 / 8 / 8 / 10 | 0 | clash with staged plan, UI terms |

**Recommendation: `realm`** (JS prefix `JRealm`, short form `rlm`), runner-up `weave`.

## 4. Rename plan (as written before the pick; executed with “atlas” in ADR 0106, see §5)

1. Docs: spec 42/43/44/45, ADR 0105 (+ new ADR for the rename): (a)-uses → new name; (b) stays "Exp6 JWorld".
2. Code identifiers: `JWorldModel` → `JRealmModel`, `JWorldEval` → `JRealmEval`, `window.JW` → `window.JR`, `jw-*` CSS/DOM ids,
   `W`/`world` locals where exported; keep a read alias for one release.
3. Folders/files: `world/` → `realm/`, `world/build_world.js`, `levels/ranking_world/world.json` → `realm.json` (loader reads both
   for one release), `levels/ranking_world` id, `tools/import_ranking_world.js`, generator `--world` flag (keep as alias).
4. Lore: rename in one revision; never stage `worlds/i, j, x` (user worlds folder `worlds/` → decide separately).
5. **Artist agent codec (JRender, box):** its "JRB world profile" naming must change **in sync** — do not rename the codec side
   from JEditor; hand the agreed name to the Artist agent.
6. Exp6 / living-core / original ranking_ui: untouched; their `JWorld` stays.

## 5. Executed: world → atlas (Matthew picked “atlas”, 2026-11-02, ADR 0106)

Done in JEditor (class (a) only):
- Folder `world/` → `atlas/`; `world.js` → `atlas.js`, `build_world.js` → `build_atlas.js`, `test/world_test.js` → `test/atlas_test.js` (result file `atlas_test_result.json`).
- `JWorldModel` → `JAtlasModel`, `JWorldEval` → `JAtlasEval`; comments/prose in our code say atlas.
- `levels/ranking_world/world.json` → `atlas.json`; the loaders (editor server, import test) read `atlas.json` and fall back to `world.json` for one release; editor saves keep whichever file a folder already has, new ones get `atlas.json`. Editor script URL `/w/atlas.js` (`/w/world.js` kept as alias).
- Generator: `--atlas` (`--world` deprecated alias for one release, prints a note); export `synthAtlas` (`synthWorld` alias).
- Spec 42, docs 44, 45 prose: world → atlas; “JRB world profile” → “JRB atlas profile”. `ranking_world.html` regenerated (same bytes length; only our embedded model/eval comments and globals changed).

Kept (deliberately, open for later) — the first four were done in round 2, §6:
- **Data format ids**: `format: "jeditor-world"` and the reference kind `"world"` (`from: "world"` for root/clock refs) are stored values in every atlas file; changing them is a format bump (open question).
- **Editor UI layer**: `editor/world.html`, `editor/world_editor.js`, `/api/world*` routes, `window.JW`, `JW.world`, `jw-*` DOM/CSS ids (`#jw-world` etc.): these are pinned by the M17/M18/M22 browser proof specs; rename with a re-run of those proofs (open).
- `worlds/` user folder (never staged; i, j, x) and `JEDITOR_WORLDS` env var.
- `levels/ranking_world` and `tools/import_ranking_world.js`: “ranking_world” is the level’s name. **Open: rename to ranking_atlas?**
- History: ADR numbers/titles (0078 “world holds everything”, 0090, 0104 …), older design docs (25–39) and NOTES lines.
- Class (b): Exp6 `JWorld` (living-core vendor), the Exp6 engine embedded in `ranking_world.html`, `source/workbook_local.json`, vendor files.

**Codec names the Artist agent must change in sync (JRender, box; not renamed from here):**
- “JRB world profile” → “JRB atlas profile”; “world-profile prototype” → “atlas-profile prototype”.
- Profile id `world/1` → `atlas/1` (reader should accept `world/1` for one release).
- `format/JRB.md` section “World profile (requirements)” → “Atlas profile (requirements)”.
- Input file name `world.json` → `atlas.json` (read both for one release); W9 budget wording “~1 MB world” → “~1 MB atlas”; “World files are user data” → “Atlas files are user data”.
- Any codec CLI flags/variables named world (e.g. `--world`, `world min`) → atlas.

## 6. Round 2 (Matthew “yes”, 2026-11-02, ADR 0107)

- Level `levels/ranking_world` → `levels/ranking_atlas` (`ranking_world.html` → `ranking_atlas.html`); code that loads the level (importer default source, `rd_deps.js`, import test) falls back to `levels/ranking_world` if only that exists, for one release.
- `tools/import_ranking_world.js` → `tools/import_ranking_atlas.js`; the old path is a thin forwarding shim (same exports and CLI output) for one release.
- Editor: `editor/world.html`, `world_editor.js`, `world_editor.css` → `atlas.html`, `atlas_editor.js`, `atlas_editor.css`; routes `/api/atlases`, `/api/atlas`, `/api/atlas/{build,preview,export}`; responses carry `atlas`/`atlases` plus the old `world`/`worlds` keys; POST accepts `{atlas}` or `{world}`. Old URLs (`/world.html`, `/world_editor.*`, `/w/world.js`, `/api/world*`) stay as aliases for one release. Editor actions `newworld`/`worlds` → `newatlas`/`atlases`; labels say atlas. `window.WE` kept.
- Page runtime: `window.JW` → `window.JAtlas` (`window.JW` alias), `JW.world` → `JAtlas.atlas` (`.world` alias, same object); all `jw-*` ids/classes and `data-jw-*` attributes → `ja-*` / `data-ja-*` (`#jw-world` → `#ja-atlas`).
- **Stored values** (exact list in ADR 0107): `format` `jeditor-world` → `jeditor-atlas` for new atlases; legacy files load and save back unchanged unless `M.migrate()` is called; ref kind `world` → `atlas` (computed by `refs()`, both accepted).
- Still kept: the `worlds/` folder and `JEDITOR_WORLDS`; the importer’s stored `id: "ranking_world"` / `title: "Ranking world"` inside `atlas.json` (changing them would change the file and the Artist’s golden hashes; open); history docs/ADRs; class (b).
