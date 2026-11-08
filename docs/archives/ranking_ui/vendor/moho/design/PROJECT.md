# JWorkbook Moho project — design ↔ function

## Goal
Design motion on the **artboard**; bind function so runtime shows **exactly** as designed.

## SoT split
| Concern | Owner |
|---------|--------|
| Structure + money | ranking_ui HTML / sheet |
| Motion art | Moho → `exports/*.svg` |
| Function link | `design_bindings.json` |

## Process
1. Open `design_map.svg` + `ui_master.svg` (1280×800).
2. Author in Moho aligned to regions.
3. Export → `../exports/L*_*.svg`.
4. Bind `when` → `region` → `place` in `../design_bindings.json`.
5. Hard-refresh ranking_ui (fail_closed runtime).

## living-core
```
living_invoke external_id=app:Moho
living_rank_cycle parent=probe_app_moho
```
