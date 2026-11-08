# ADR 0077: Make the running editor version visible

Status: accepted (2026-11-01), M16

- Problem: after a restart the editor "looked the same". There were four reasons:
  - the server banner still said "M6 Model mode";
  - the editor opened with an empty "Open a level" state;
  - ranking_data had the same title as ranking_ui_v1 (fixed in rev 48);
  - new features only appear once a level is open.
- Changes:
  - `GET /api/version` returns `{milestone, revision (read-only lore status, cached 30 s), root, levels}`.
  - The startup banner now reads `JEditor editor M16 · Lore revision N · serving <root>` and lists the levels with direct `#level` links.
  - The editor header shows a `#buildstamp` pill, e.g. "M16 · Lore rev 48".
  - The start page lists every level, with a note and an Open button.
  - Opening a level sets `location.hash`, so `http://127.0.0.1:8791/#ranking_data` opens that level directly.
  - The palette has labelled groups: "Items & calendar" and "Calendar plan sections". Components marked internal or deprecated are hidden.
