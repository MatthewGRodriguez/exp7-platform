# Changed / covered view matrix (1.8.4-art)

Inventory of **all shipped views** at merge `3d76da1` and art-pass touch.

| Surface | Builder / path | Art touch | Notes |
|---------|----------------|-----------|-------|
| Calendar (universal) | `calHtml` → JRViews → JRender | UX state washes via `data-jr-state` / selection / hover hierarchy; params+state table | Fixed fit / risk / nav / back / selection / drag preserved |
| Board expense | `boardHtml` + Budget root | Same universal UX states | Resources / alts / authoring / IME unchanged |
| Board income | same | same | |
| Board debt | same | same | |
| Board asset | same | same | |
| Plan / deps | `depsHtml` / planDoc | UX states; what-if isolation preserved | |
| Reserved bar | `PlatformChromeJR` | **JRDI profile photo** + exclusive initials; geometry 44/8/8 retained | Canvas hits when jr-on |
| Apps picker | `PlatformChromeJR.redrawApps` | Selected/idle `data-jr-state` | |
| Budget Cal/Board/Plan tabs | `budgetChromeDoc` | Covered by JRViews UX washes when `.on` | |
| Budget type tabs | `budget:board:*` | same | |
| Account / key / share / packages | DOM | **Unchanged** — PAT never in canvas | |

Invariants retained: universal builders, per-app data, shared GPUContext, Views emit / hosts propose, Best≠Selected, original JS/core semantics, real WebGPU JRender only.
