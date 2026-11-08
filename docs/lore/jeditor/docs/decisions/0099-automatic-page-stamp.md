# ADR 0099: Automatic milestone stamp

Status: accepted (2026-11-01), M19.

- serve_editor derives the milestone from the newest `docs/design/NN-m<k>[b]-report.md` (no hand-edited constant) and the revision from read-only `lore status` (as before). The editor stamp, the "World editor · M…" hint, saved `build` and the exported page's generator meta all use it.
