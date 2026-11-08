# JWorkbook × Moho.app — design ↔ function

## Agreement
**Design in Moho = Moho.app** (`/Applications/Moho.app`).
living-core does **not** design motion. It bridges function ↔ placement.

## Law
- ranking_ui HTML = structure + money SoT.
- **Moho.app** = motion art SoT (bones, timing, export). Save `project/JWorkbook_chrome.moho`.
- Export SVG → `exports/L*_*.svg` (exact basenames).
- **design_bindings.json** = function `when` → region → place (fail_closed).
- Live DOM `region.sel` wins size/position.

## Coherent process (Moho.app)
1. `living_invoke external_id=app:Moho` (open the app).
2. Read `project/OPEN_IN_MOHO.md` · artboard 1280×800 · import `design/design_map.svg`.
3. Author layers in **Moho.app** · save `.moho` under `project/`.
4. Export SVG → `exports/` (replace bootstrap placeholders).
5. Bindings already map events; edit only if adding new when/region.
6. Hard-refresh ranking_ui · REVIEW if export/catalog hash moved.

## place modes
| place | Meaning |
|-------|---------|
| cover | overlay = target getBoundingClientRect (tabs) |
| badge | small icon sized from target |
| highlight | pulse real DOM only — **no** floating SVG |

## Layers (stack)
| Layer | when | region | place |
|-------|------|--------|-------|
| L0–L3 ambient | — | stage | always |
| L4 RunPulse | live-badge.on | live_badge | badge |
| L5 MoneySpark | money-update | graph_bar | badge |
| L6 TabSwitch | tab-change | tab_active | cover |
| L10 Review | review-decision | pane | badge |
| L11 CalDrill | calendar-drill | pane | badge |
| L12 SaveOk | save-ok | status | highlight (toast ✓) |
| L13 Relation | relation-graph | joy_graph | highlight (live only) |

## living-core
```
living_invoke external_id=app:Moho
living_reload
living_rank_cycle parent=probe_app_moho
living_ranking action=review   # then approve if intentional
```

## Drop exports here
`exports/L1_accent_wave.svg` etc.

## Bindings
`design_bindings.json` — function→region→place. Runtime fail_closed.
