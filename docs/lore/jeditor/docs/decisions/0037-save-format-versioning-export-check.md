# 0037 — Save format, versioning and the export embed check

Status: accepted (M7, 2026-10-30)

## Decision
- **Format.** A level saved by the editor is `levels/<id>/level.json` in the normal builder schema, with `format`/`formatVersion` and editor metadata in `meta` (editorVersion, created/modified, note, `editorDoc: {formatVersion, revision, savedAt}`). Every save does the following:
  - increments `meta.editorDoc.revision`;
  - rebuilds `levels/<id>/<id>.html` with `builder/build_level.js`;
  - reports the bytes and the runtime hash.
- **Save As.** Ids come from presets or the keyboard. If the id already exists the server returns 409 and the UI offers an explicit overwrite. Generated levels (ranking_ui_v1) are always routed to Save As, so the editor never writes their level.json.
  - M6 Model mode is the exception: it still writes `levels/ranking_ui_v1/editor.json`, and `make_level.js` reads that overlay. Running `verify_m6_editor_spec.json` therefore changes ranking_ui_v1. Delete the overlay afterwards to get byte-identity back (see the M7 report).
- **Export.** Export is allowed only when the level is saved and not dirty. The check scans the HTML and requires all of the following, otherwise the export is refused:
  - 0 external `src`/`href`/`url()`/`@import`/fetch targets;
  - a CSP meta tag is present;
  - it has `default-src 'none'`;
  - it has `connect-src 'none'`.
- **Persistence.** Each level has its own `storageKey` (`jeditor:<id>`) and starts at `stateVersion` 1 with no migrations.

## Consequences
- An export is a single self-contained HTML file that can be opened from file://.
- Rebuilt levels never share localStorage with ranking_ui_v1.
