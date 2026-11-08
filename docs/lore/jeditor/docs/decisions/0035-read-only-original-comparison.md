# ADR 0035 — Read-only comparison against the original

Status: accepted (M6, 2026-10-30).

## Decision
The original `ranking_ui.html` is opened only through these safeguards:
- It is served by `tools/ro_serve.js` (GET/HEAD only; any other method gets 405 and is logged as REFUSED), bound to 127.0.0.1 on port **8797**. The user's `serve_ranking.py` on port 8765 is never used.
- Chrome blocks `*/api/*`, `*save-workbook*` and the Google Fonts hosts (`cdp_shoot.js` `blockUrls` via `Network.setBlockedURLs`).
- Chrome runs headless with a temporary profile.

## Evidence
- The original tries `POST /api/save-workbook` at boot. Chrome blocked it ("silent save disk fail" in the console), and `ro_serve` logged no REFUSED request, so nothing reached any server.
- The original also attempted fonts.googleapis.com; that was blocked too. This is the original's own behaviour, not the level's.
