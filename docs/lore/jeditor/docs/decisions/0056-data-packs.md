# 0056 — Data packs shared between levels (M13)

Status: accepted (2026-10-31, M13). Makes 0023/0048/0052's `pack` label real.

## Format
`packs/<id>@<version>.jpack.json`: `{format:"jeditor-pack", formatVersion:1, kind:"data", id, version, note, publishedAt, data:{joys, collections, blueprints}}`. Collections are item types only (no rows/store). Published versions are immutable (server 409 on an existing version).

## Semantics (builder/runtime/jpacks.js; editor/server only, never embedded in built HTML)
- export = dependency closure of the selection (joys ← blueprints ← item types).
- import = embedded copy; elements tagged `pack: "id@ver"`; `data.packs[]` entry `{id, version, base, renamed, skipped}` where `base` is the imported snapshot. Built HTML has no external refs.
- collisions: rename incoming (`id_<pack>`, references rewritten), replace local, or skip.
- upgrade = 3-way merge vs `base`: a field takes the new value only where local still equals base, so local edits (e.g. a joy value) survive; diff summary per element: add/remove/update/same/conflict with kept keys.
- detach (keep elements, drop tags/entry), remove (delete pack elements). Newer versions detected from `GET /api/data-packs`.
