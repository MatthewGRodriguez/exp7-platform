# 01 - Commonalities survey (read-only, 2026-10-30)

Sources (read only, not modified):
- ranking_ui: `~/Home/Dev/The Joy Machine 2/legacy/legacy/html/ranking_ui.html` (1,190,761 B, 23,150 lines, title "JWorkbook") + `vendor/*.js` (12 external scripts incl. `JFactor_exp6.js`, `jworkbook_motion.js` 2,716 B, `jworkbook_webgpu.js` 54,972 B, `jworkbook_depth_html.js` 3,136 B). An older 49 KB copy exists at `~/Home/Dev/The Joy Machine/legacy/html/ranking_ui.html`.
- G1 calculator: `~/Home/Dev/G1 Calculator/index.html` (14,568 B, 287 lines, title "G1 BC") + `src/` (g1_bc.js, g1_drag.js, exp6_optimize.js, main.js) + `exp6/`. Self-contained build: `share/G1-BC.html` (325,946 B).
- Training day designer (Slate): `legacy/legacy/html/slate/td.js` (723,686 B, minified, 2026-10-19), `slate/td.css` (77,050 B), `slate/td.html` (201 B shell). Also `slate_anim/td.js` (same size) and older monolith `training_days.html` (884,623 B). Many `bak-*` snapshots exist.
- Motion engine (authoritative, from the box): `/workspace/td/pipeline2/` and `/workspace/td/ux/`, workflow `/workspace/jeditor_inputs/tdd_animation_workflow_from_artist.md`; key files copied to `docs/legacy-reference/tdd-animation/`. Process: state table -> Blender/Moho -> CSS + small engine -> QA gates (also the `ui-motion-art-pipeline` skill).

Counts below are grep hits (rough signal, not exact element counts).

## Per app

| | ranking_ui | G1 calculator | training day designer |
|---|---|---|---|
| Purpose | household/workbook ranking ("JWorkbook"): scenarios, budget, calendar, KPIs | ballistic coefficient (G1) from chronograph data + Exp6 `Best()` digit search | schedule people/tasks across training days in Palantir Slate Code Sandbox |
| Components seen | tabs (`#tabs`, `#pane`), scenario toggle buttons, pills (78), buttons (85), cards, tables (45 `<table`), calendar grid (`cal-grid`, `cal-cell`), KPIs (`#kpis`), log, add-row forms (38), 1 canvas, line graph (`#graph-line`), drag (159 hits) | numeric inputs with min/max/step + lock checkboxes (`field-row`, `lock`), big result field (`#bc`), one button (`#bestBtn`), digit-visualization panels (`digit-field`, `digit-row`), "cone" panels, two-column responsive grid | header + role switch, top bar, main `#pane`, day schedules (`.day-*` 113 css hits), tabs, cards (119), tables (14), svg rings/icons, drag-and-drop schedule blocks with keyboard (arrows/Enter/Escape) and aria-live announcements, notices/status bars, loaders, "Apply" suggestion cards |
| State / data | `localStorage` (31 hits), `fetch(` (8), JFactor/Exp6 vendor models; save/load/promote buttons | in-memory inputs only; no storage | `SlateFunctions.getState().td` / `watch("td")` from a Foundry function; `localStorage` (2); Slate shared saves |
| Animation | `jworkbook_motion.js`: class toggles (`jw-enter`, `jw-stagger`, `jw-flash`) + CSS, reflow-restart, reduced-motion check; 1 rAF; WebGPU/depth helpers | none beyond 2 rAF uses | CSS+JS state-machine engine SM1b (`data-sm` states, edge timing table, baked shadow crossfade, PX2b parallax; see doc 02) plus in td.js: Web Animations API (`el.animate`, 9), 12 `@keyframes` (bg pulse, belt, shimmer, wipe, glow), shared easings (`cubic-bezier(.2,.8,.2,1)` x7, `(.19,.9,.45,.97)`, `(.4,0,.6,1)` x2, `(.3,1.3,.5,1)`, `(.5,0,.75,.4)`), rAF-throttled drag ghost, FLIP-style tab indicator on `::before/::after`, staggered card reveal (delay 90 ms x index), exit (240 ms opacity+clip), `prefers-reduced-motion` (20), visibility pause, guarded `animate()` |
| Detail level | high, many features, mixed styles | minimal, plain system-ui, dark/light | highest polish; the motion quality bar |
| Packaging | HTML + 12 external scripts | HTML + src; separate self-contained build | JS + CSS injected into Slate sandbox |

## Overlap (candidates for shared components)
- Shell: header/top bar, tabbed main pane, status/notice line.
- Buttons, pills/toggle groups, cards, tables, numeric field rows, result/KPI display.
- Calendar/day grids (ranking_ui and training designer).
- Drag to rearrange (ranking_ui and training designer).
- Reduced-motion handling (ranking_ui, training designer).
- Save/load of state (ranking_ui localStorage, training designer Slate saves).

## Differences
- Animation tech: CSS class toggles (ranking_ui) vs WAAPI + keyframes + shared easing tokens (training designer) vs none (G1).
- Data source: localStorage/fetch vs Slate state binding vs typed inputs. JEditor v1: no external data.
- Styling: three unrelated CSS systems (class prefixes `calc/pill/btn`, `field-row/digit-*`, `day-/td-/ux-/ds-`).
- Packaging: only G1 has a single-file build today.

## Open questions
1. Is `slate/td.js` (2026-10-19) the authoritative training-designer build, or a specific `bak-*` snapshot?
2. ANSWERED 2026-10-30: the 1.19 MB one in The Joy Machine 2 (ADR 0024). Was: Which ranking_ui is current: the 1.19 MB one in The Joy Machine 2 (assumed) or the 49 KB one in The Joy Machine?
3. Should the WebGPU/depth effects in ranking_ui be in scope for the shared runtime, or only the training-designer motion?
