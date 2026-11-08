# ADR 0090: The world editor is served at /, the legacy editor at /legacy, plus the /api/world* routes

Status: accepted (2026-11-01), M17b.

- serve_editor serves `/` as editor/world.html, which loads world_editor.js/css and /w/world.js and /w/eval.js. `/legacy` serves the previous editor; its hash routes still work.
- Worlds are stored under `JEDITOR_WORLDS` (default ROOT/worlds) as `<id>/world.json` and `history.json`.
- Routes: GET /api/worlds; GET and POST /api/world?id=; POST /api/world/build, /api/world/preview (returns /preview/w<n>), and /api/world/export (writes `<id>/<id>.html` and returns an embed check).
- Saved worlds are stamped with `build:{milestone:'M17', revision}`. The page shows the stamp "M17 · Lore rev N".
- Editor input is click and picker only: pick modals, an on-screen keyboard for names, and click-to-wire ports. Undo/redo history is persisted, autosave runs after 300 ms and the live preview after 350 ms.
