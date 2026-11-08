# M12 report — universal items, shared joys, item blueprints (2026-10-31)

ADRs: 0051 items, 0052 joys, 0053 item blueprints/scoring (data v2), 0054 ranking_data on items. Revised: 0047, 0048 (notes added), 0019 (superseded in part).

## Model / save format
- `level.data.version: 2` adds `joys[]`, collection kind `items` (fields may be `factor:true`, `blueprint`, optional `derive`), blueprint kind `item` (`normalize`), nodes `item.value`, `item.factor`, `joy.value`, `joy.jmax` (jbp), `items.top`, `items.count`, `joy.value` (metric). v1 still validates; v1 + joys/items is refused; `JData.upgrade` v1→v2 is pure.
- Item rows: values + `_bp`, `_joy`, `_jmax`, `_alts`/`_alt`. Editable joy values in the page: `state.values.joys.<id>`.
- Migration: `tools/migrate_to_data.js` → `itemize()` / `--itemize`; `migrate()` now emits v2 with items. Editor button + `POST /api/data-migrate?itemize=1` (verified by HTTP: output == committed level data).

## Runtime (builder/runtime/jdata.js, jbp.js)
`JD.items / itemScores / joy / joys (with refs) / groupOrder`; `JD_ENGINE['items:<type>']` Exp6 parity + backend (webgpu>wasm>js via JFEngine). Fix: the first page render now uses the loaded (stored) state instead of level defaults (affected M11 data levels too after a reload).

## Editor
`items` panel (types, ★ factors, + value, + item, duplicate, drag reorder, steppers, text picker, per-item blueprint, type blueprint + templates, live scores, engine status); `joys` panel (+ joy, label/kind/value/jmax steppers, share/unshare pack, ref count + list, protected delete); graph overlay for item blueprints (JB nodes + canConnect, joy/factor param pickers, live per-item score); bindings: RankList over items without scorer, DataTable `score:@`, JoyTable joy toggles. All edits go through X.edit → undo/redo + persistent history.

## Proof (headless Chrome, /tmp copy, editor on :8799) — editor/test/m12_proof_result.json, screenshots /workspace/jeditor_shots/m12/ (box)
From an empty level, by clicks: joy `fun` (amount, 1 → 11); item type `games` (+hours, blueprint from the JFactor(value, fun) template → bp_games2) and `books` (default Σ blueprint rewired by graph clicks to value × fun); 4 games (3 added, steppers, duplicate, drag reorder 3→0) and 2 books.
- joy 11 → 22 (×2): games [0.555,0.6,0.6,1.05] → [1.105,1.15,1.15,1.6]; books [11,110] → [22,220] — both types rescored.
- games[1] → bp_games: only that item changed (1.15 → 10); refs updated (5 items).
- Exp6 for games (all jfactor.call): parityOk true, backend wasm-simd; after the per-item switch "graph only" (expected).
- delete fun → warning "2 blueprints · 5 items · 0 overrides" → keep → joy kept, 7 refs.
- RankList(@games, no scorer) + JoyTable; undo ×2 / redo ×2; save; export 837 KB, CSP ok, 0 external refs.
- reopen: history 33 entries, same scores, undo/redo after reopen works.
- exported page: JoyTable input fun=3 → scores + RankList update; save; reload → persisted (localStorage `jeditor:joys-items`).
- 0 exceptions in all three runs.

## ranking_data vs ranking_ui_v1 (6 tabs)
Text/values/KPIs equal on INCOME, EXPENSES, DEBT, ASSETS, CALENDAR; RANKS differs only in the engine timing text (7.8 ms vs 10.7 ms). Screenshots: 0 px different on all 6. In-page: `@rank_items` 60 items, item scores vs calcRanks max diff 0; 8 derived joys w_* resolved; ranks.bestItem 0.1202; Exp6 for rank_items "graph only" (Σ graph, not a single jfactor.call).

## Regressions
motion, rank, calendar, plan, sync, board parts, janim, jdata (35 checks) pass, max diffs 0 (rank jmethod 1.1e-16 as before). Rebuilds: ranking_ui_v1, ranking_rebuild, income_rebuild, m8_rebuild — byte-identical to the committed files. ranking_data changes intentionally (now level.json 366,207 B; html 888,020 B, sha 1f235ef7…): embedded jdata/jbp + itemized model; rendering equivalence above.

## Unverified / limits
- "delete and unwire" path not clicked (only keep); logic covered indirectly.
- `groupOrder` (JGroup Best / SimulatedBest over items) implemented, not bound to a component or tested in a page.
- Per-item joy overrides / jmax / alternatives: model + node tests only, no editor UI.
- Joy `pack` sharing is a label; no cross-level pack registry.
- Factor-order reorder in the page vs the frozen summation order of bp_rank_item (float rounding only, untested).
- WebGPU backend not exercised (headless picked wasm-simd).

## What remains code
Rank drag orders/caches (`ranks` record), JRankShare share math (`rank.items`, `rank.factorWeight` libs), bestRank Board acts and their Joy M/H/D/E/A jmax, RankBoard/CalendarBoard rendering, calendar model, money libs (as in M11).
