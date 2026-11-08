# ADR 0033 — Editor Model mode, blueprints and pack overlay

Status: accepted as a vertical slice (M6, 2026-10-30). Builds on ADRs 0010, 0019, 0022 and 0023.

## Decision
- **Editor** (`editor/serve_editor.js`, `editor/editor.html`, `editor/editor.js`, `editor/editor.css`): a local server bound to 127.0.0.1:8791. CSP is `default-src 'self'` with no inline script or style. All editing is click or drag; there is no typed input.
- **Edits live in an overlay**, `levels/<id>/editor.json`, not in `make_level.js`. `builder/editor_overlay.js` `apply()` runs in both `make_level.js` and the editor's Save, so regenerating the level keeps the edits. Overlay keys: `packs`, `itemTypes`, `metrics`, `combine`, `persist`, `ambient`, `motion.edges`, `motion.enter` and `savedAt`.
- **Save** writes only inside `levels/<id>/`: `editor.json`, then `level.json` with the overlay applied, then the rebuilt `<id>.html`. The id must match `^[a-z0-9_]+$`.
- **Packs** are stored at `packs/<id>@<version>.jpack.json`. Each level embeds its own copy at `jfactor.packData['id@ver']`, and the pack's item types go into `jfactor.itemTypes`. The first pack is `ranking_items@1.0.0`: item type `board_item`, field templates, and a catalog of 9 metrics.
- **Blueprints** (`builder/blueprint/jbp.js`, `JBlueprint`): a typed node graph per item type. Only stage 1 nodes compile: `data.*`, math, `jfactor.call`, `board.emit` and `score.out`. Stage 2 (mech, econ) and stage 3 (chart, view, 3D) nodes appear in the palette but are disabled. `canConnect` rejects mismatched types, a second edge into a taken input, cycles and self-links.
- **Animation edits:** `level.motion.edges['from>to'] = [ms, easeIdx]` and `level.motion.enter` override `state_table.json` at build time. The runtime hash changes only when such edits exist.

## Evidence
- `verify_m6_editor_spec.json` exercised: adding a field, cycling the n1 and n2 fields, a rejected wire ("input taken"), adding metric `cal.incomeIn`, changing `idle>hover` to 170 ms with the second easing, and Save.
  - The editor had 0 console errors, and every request went to 127.0.0.1:8791.
  - Save rebuilt the files: `level.json` 334,116 B, HTML 823,518 B, runtime hash `62d6e914dba65282` (was `349dfe4a87ae4bc7`).
- `verify_m6_spec.json` on the rebuilt level: `JL.level.jfactor.metrics` included `cal.incomeIn`, and hovering the EXPENSES tab set `--sm-ms: 170ms` with `cubic-bezier(.42,0,.58,1)`. It had 0 errors and 0 external requests.
- Running `make_level.js` again with the overlay produced a byte-identical `level.json` (same md5).
- The test edits were then reverted: `editor.json` was removed and the level rebuilt to the baseline, which is byte-identical to the pre-M6-editor `level.json` with runtime hash `349dfe4a87ae4bc7`.

## Not covered (yet)
- The blueprint score is **not** yet used by the level's RankBoard. Only the editor preview uses it. The level stores the graph.
- There are no stage 2 or 3 nodes, no new item types beyond the pack's, no per-field conditions, no editing of condition rows, and no AND/OR groups.
- The editor cannot edit animation delay or stagger, state visuals (scale, shadow) or the ambient amplitude and period.
- It has no undo history and no multi-level picker UI; the level is chosen by URL hash.
- Packs can be embedded or reset, but there is no pack versioning or upgrade flow.
