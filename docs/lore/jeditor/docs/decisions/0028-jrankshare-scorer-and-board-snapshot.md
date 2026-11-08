# 0028 — JRankShare JFactor scorer; Board items as a captured snapshot until M4

Status: accepted (M3, 2026-10-30). Implements ADR 0017.

## Decision
- `builder/packs/rank_share.js` registers `JFEngine.jmethods.JRankShare` (x = position, y = n, inverted for A/E/M) and reproduces the original `harmonicShares`/`calcRanks`/`expenseTabScoreHtml` exactly. Best order goes through the vendored JFactor bundle the way `easyComputeBestRank` does: JGroup `SimulatedBest()` then `Best()` then a score-sort fallback.
- Parity is checked by `builder/test/rank_parity.js` against 9 functions extracted verbatim from `ranking_ui.html` and a headless-Chrome capture (CDP breakpoint at L1946). Max diff: 0 (jmethod 1.1e-16).
- Board candidates (Work/Gym/Lunch…), JAction acts and the T/D/U/S value caches come from the calendar. Until the CALENDAR tab lands (M4) they are a **read-only snapshot** captured from the original page into `builder/test/fixtures/orig_ranks_capture.json` and embedded in level state.
- Not ported (proposal for M4): values-mode traversal (M/T/D/U/S auto-ranking), dragging M rewriting $, the calendar/manual mode toggle, "+ factor" / edit meaning.
- State shape changed, so `stateVersion` is now 2.
