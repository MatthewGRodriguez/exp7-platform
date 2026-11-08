# 0043 — Persistent undo history per level

Status: accepted (2026-10-31)

## Context
Undo/redo (ADR 0038) lived in memory only; closing the editor lost it.

## Decision
- File `levels/<id>/.editor-history.json` (Lore-ignored via `.loreignore`; never read by build_level, never in an export). Written by `POST /api/history?id=` (debounced 300 ms after every edit/undo/redo, immediately on Save) with `{hist, fut, cur, base}` = design snapshots (the same `snap()` strings as in-memory undo).
- The server stamps `diskHash` = sha1 of level.json at write time. `GET /api/history` returns `dropped` (and deletes the file) if level.json no longer has that hash, i.e. it was changed outside the editor (another tool, a hand edit, Lore checkout). The editor shows a warning chip "history dropped: …".
- On Open, a matching history is restored (chip "history restored · N undo / M redo · from <local time>"); if `base` equals the saved file and `cur` differs, the unsaved edits are recovered too.
- Caps: 200 undo + 200 redo entries and ~3.8 MB client-side / 4 MB server-side, oldest dropped first. Generated levels (make_level.js) and unsaved new levels keep no history.

## Consequences
- History survives restarts of the browser and server; it does not survive an outside change to level.json (by design: snapshots would not apply to a different base).
- Entries older than the cap are lost (in the M9 test 300 build steps → the oldest 100 were dropped).
