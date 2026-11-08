# ADR 0060 — Board limits as stored joys; list of what remains code (M14)

Status: accepted (2026-10-31)

- Joys gain an optional `store` path. `joy()` reads that path first and falls back to `value`.
- The migration adds `lim_years`, `lim_months`, `lim_H`, `lim_D` and `lim_E`, stored at `ranks.hdame.<k>`. The board's joy limits are therefore joys that blueprints can read, while RankBoard keeps writing the same keys.
- Remaining code, kept on purpose:
  - RankBoard drag orders/caches, JRankShare share math, bestRank acts, JGroup Best/SimulatedBest, groupOrder, and the rank sync/auto modes (rank_share / board packs; Exp6 parity tests depend on them).
  - The DEBT table row-calculation library and selection column.
  - The money libraries.
  - The internals of hints, forms, header/KPIs and shell state.
  - These already bind through blueprint outputs where M11–M13 rebound them (14 bindings). Their internal computation is pack code, wrapped as `lib.value` nodes.
