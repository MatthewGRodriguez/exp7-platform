# M13 report — item overrides & alternatives, data packs between levels

Date: 2026-10-31 (CDT). ADRs 0055–0057. Proof: `editor/test/m13_proof_result.json`, specs from `editor/test/make_m13_spec.js`. Screenshots: box `/workspace/jeditor_shots/m13/`.

## Built
1. Per-item joy overrides + alternatives (ADR 0055): runtime `altOf`/`itemScores(altPick)`/`itemAlts`/`itemPlan`; items panel indicator + item detail (inherited vs overridden, reset to shared, alternatives add/rename/value/joy/reorder/delete/current, plan + apply); joys panel lists overrides; delete-and-unwire removes overrides; RankList `alts: current|plan`.
2. Data packs (ADR 0056): `builder/runtime/jpacks.js`, `packs` editor panel (export selection with dependency closure, version pick, publish; browse; import with collision prompt; newer-version badge; diff; apply/skip; detach; remove), server `GET /api/data-packs`, `POST /api/data-pack` (409 on existing version).

## Verified (all in /tmp copies, server port 8798/8799, click/picker input only)
- a1 (level pka): override fun on games 2 → score 0→1 (×11 override 11, reset, override 2); alternatives "alt 1" (value 11) and "big" (joy fun 102), reorder, current, plan (exhaustive, Σ 32 → 112 shown), apply plan, delete, undo/redo; joy w referenced by blueprint + item + override → warning modal → delete and unwire → undo/redo; publish funpack@1.0.0. 0 exceptions, 0 external requests.
- b1 (level pkb): import funpack → collision on `fun` → rename incoming → `fun_funpack`, references rewritten; local edits (joy value 2, item override 101). 0 exceptions.
- a2: new "Σ factors" blueprint bp_games4 becomes the type blueprint; publish 1.0.1.
- b2: pkb detects newer 1.0.1 → diff (joy same/keeps local value, collection games update, bp_games4 add) → apply: type → bp_games4@1.0.1, items rescore (2/20/101 → 1/10/1), local joy value 2 and item override 101 preserved; "1 elements kept local edits"; undo/redo of upgrade; RankList alternatives=plan; save; export (externalRefs 0, CSP ok).
- page (built pkb.html): JD.itemPlan picks alt 1 for games 1; RankList shows "games 1 · alt 1". 0 exceptions, 0 external requests.
- Regressions (fresh copy): jdata_test (53 ok), board_parts_parity, calendar_parity, janim_test, motion_parity, plan_test, rank_parity, sync_parity — all PASS, max diff 0 (rank_parity jmethodMaxAbsDiff 1.11e-16 is pre-existing with M12 jdata).
- Rebuilds: income_rebuild, m8_rebuild, ranking_rebuild, ranking_ui_v1 (8f08a11b) byte-identical. ranking_data intentionally changed 1f235ef7 → 17b2b897 (embedded jdata/RankList code). Equivalence: 6-tab headless compare old vs new html: 0 value diffs, KPIs equal, text identical except the RANKS timing line ("7.3 ms" vs "7.9 ms"); 0 exceptions, 0 requests.
- Cheap extras: factor reorder = float rounding only (max |Δscore| 1.39e-17). WebGPU runs headless here without flags: backend webgpu, parityOk true. Itemize click-through: "migrate bindings…" on a copy of ranking_ui_v1 now yields data v2 directly (8 joys, 11 collections) and undo works; the separate "itemize ranking…" button only appears for v1-data levels, none exist, so it was not clicked.

## Fixed during M13
- Cycle button on an unset prop jumped to the first option (alts stayed "current"); unset `alts` now counts as the first option.

## Not verified / remaining
- Editor-preview score readouts in the spec evals lag one step behind the model (data is correct, final page/next step agree); not investigated.
- After the a1 "reset to shared" the item-detail alternative score line showed the stale 11 until the next edit (cosmetic, same lag).
- b1 collide_rename waitFor timed out though the action succeeded (modal-idle condition).
- Pack conflict branch (both local and new changed the same field) is covered by node unit checks only, not clicked.
- itemize button for v1 data not click-tested (no v1 data level).
