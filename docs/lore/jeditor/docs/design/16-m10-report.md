# M10 report: layout, per-component themes, animation files (2026-10-31)

ADRs: 0044 (layout model), 0045 (theme model), 0046 (`.janim.json`). Proof: `editor/test/make_m10_spec.js` → `levels/ranking_ui_v1/verify_m10_{edit,reopen}_spec.json`; results in `editor/test/m10_proof_result.json`; janim checks in `builder/test/janim_test.js`.

## What was built
| File | Role |
|---|---|
| builder/janim.js | validator, parser, scoped state-CSS generator, summary (node + browser) |
| animations/default.janim.json, snappy_gold.janim.json | TDD default (parity) and a variant (SVG art asset, sheen) |
| builder/build_level.js | `level.animation` base table; `level.theme.shadows`; `resolveLook` (layout + theme + anim per component, type < component), merged into the M9 JMotionOver set; emitted only when used |
| builder/runtime/jmotion_over.js | edge entries may carry their own easing string |
| editor/look.js (+ editor.css, editor.html, small hooks in editor.js) | Layout panel + preview selection box (drag move, corner resize); Theme panel (scopes, swatches, HSL steppers, radius/font/padding, both shadows, presets, packs); animation load/upload/validate/preview/assign |
| editor/theme_presets.json | swatches, fonts, 5 presets |
| editor/serve_editor.js | `/api/animations`, `/api/animation-validate`, `/api/theme-presets`, `/api/theme-packs` (GET/POST → packs/themes@1.0.0.jpack.json) |
| tools/cdp_shoot.js | `drag.by {dx,dy}`; conditional steps `if` |

`snap()`/`restore()` now include the level theme and level animation. Component layout/theme already ride inside `components`. So undo/redo and the M9 persistent history cover every M10 edit. Older history entries without these keys restore unchanged.

## Click test (headless Chrome, /tmp copy, port 8798)
Level `m10_base` = ranking_rebuild with `rank_board1` expanded into parts by clicks. The baseline was exported before the edits. 16 edits, all by real mouse:
- `editable_table1`: dragged by (41,23) → snapped 40,24, then the y+ / x− steppers → `{x:32,y:32}`.
- `editable_table2`: corner handle dragged −120 px → `w:744`.
- Board part `rank_best_table1`: dragged (16,32), scale +0.05 ×2 → 1.1, brought to front (z 1).
- `kpi_grid1` theme: accent from swatch #e0af68, surface hue+ and light+ (#212121), radius 6px, tight blur 4.3, tight y 4.1, wide alpha 0.516.
- `rank_dim_pills1`: "Load animation file…" → `snappy_gold` previewed (scoped CSS present in the preview, element marked) → assigned to the component.
- An invalid upload (via the file input) shows 8 inline errors with paths, and nothing is applied.
- Undo ×16 → snapshot identical to before the edits. Redo ×16 → identical to after. Save → clean. Export: 851,416 B, embed check ok (0 external refs, CSP default/connect none).
- Reopen in a new browser: history restored (17 entries, last 3 are the theme/animation edits), state on disk, one undo/redo still works. Export again.

Export vs baseline: per-element rect + computed styles in headless Chrome at 1500×1000, grouped by the closest `data-jmo`.
| tab | elements compared | changed |
|---|---|---|
| INCOME | 321 | editable_table1 125 (moved), editable_table2 2 (heading + table width 1151→744), kpi_grid1 7 (colours/radius) |
| RANKS | 1,630 | rank_best_table1 376 (moved + scaled 1.1 → 1266 px wide), kpi_grid1 7 |
No unmarked or missing elements changed. The animation is checked by a pointer hover on a pill in `rank_dim_pills1` versus a control pill:
| | `--sm-ms` | ease | scale | tight shadow | art |
|---|---|---|---|---|---|
| base (both) | 120ms | (.2,.8,.2,1) | 1.0012 | 0 3.6 2.3 /.55 | none |
| edited, target | 60ms | (.3,1.3,.5,1) | 1.04 | 0 6 4 /.7 | SVG glint (data URI) |
| edited, control | 120ms | (.2,.8,.2,1) | 1.0012 | 0 3.6 2.3 /.55 | none |
Theme pack: kpi_grid1's theme saved via the API, loaded by clicks onto editable_table1 (`from: themes@1.0.0#kpi_gold`); preset "Ocean" applied at type scope (EditableTable).

## Regressions (all in the repo)
- Rebuilt ranking_ui_v1 (sha1 8f08a11b…, 823,333 B), ranking_rebuild (823,597), income_rebuild (781,324), m8_rebuild (799,208): byte-identical.
- motion_parity PASS; rank max diff 0; calendar 36 checks, diff 0; plan PASS diff 0; sync 10 checks, diff 0; board parts 37 steps, diff 0.
- janim_test: default.janim regenerates JMotion byte-identically; v1 with `level.animation = default` differs only in the embedded level JSON.

## Known limits / not verified
- Ambient drift + a flow transform on the same component conflict (ADR 0044). Height applies to every top-level element of a multi-element component.
- The static diff can't see per-component animation state until a pointer interacts (`data-sm` is set lazily). The animation was verified through the hover probe only, not frame-by-frame timing.
- "Save theme to pack" was exercised through the endpoint plus the load click path. The keyboard label entry for pack ids was not clicked in the test.
- Responsive: px layout without breakpoints (ADR 0044).
