# 0054 — ranking_data on items + joys + blueprints

Status: accepted (2026-10-31, M12). Extends 0050.

`tools/migrate_to_data.js` exports `itemize(level)` (CLI `--itemize <in> <out>`; editor items panel "itemize ranking…" → `POST /api/data-migrate?itemize=1`; `migrate()` now itemizes too). For ranking levels it adds:
- joys `w_H … w_S` (`kind:'weight'`, `derive:{lib:'rank.factorWeight', dim}`) = the JRankShare harmonic factor importances from `ranks.factorOrder`;
- item type `@rank_items` (`derive:{lib:'rank.items'}`: expense lines + Board candidates; values name/cost/incomeAmt; factors score<dim> = per-dimension JRankShare shares of the drag orders);
- `bp_rank_item`: Σ in factorOrder of `joy(w_d) × factor(score_d)`, `normalize:'sum'` — equals calcRanks `scoreRaw`/`score` (max diff 0, node + in-page);
- `bp_rank_items`: outputs `ranks.bestItem`, `ranks.itemCount`.

Mapping of ranking_ui concepts: factor importances → `w_*` joys; JRankShare shares → item factors; composite score → item blueprint; actions' $ (cost/incomeAmt) → item values. Still code: drag orders/caches (rank_board record), the share computation itself, bestRank's Board acts and their Joy M/H/D/E/A jmax, RankBoard rendering. The graph freezes factorOrder at itemize time (reordering factors in the page changes the weights live, but the graph keeps its summation order, so scores could differ from calcRanks at float-rounding level after a factor reorder; not observed, not tested).

Rendered components are unchanged: levels/ranking_data renders identically to ranking_ui_v1 on all six tabs (only the RANKS engine-timing text differs; 0 px).
