# All views — modifications & remaining QA

## Label legend
- **DESIGN-STUDY** — Blender/Moho compositions with representative typography/avatar assets from shared params. Not live app pixels.
- **LIVE-GPU** — Safari WebGPU JRender on Matthew Mac (USER-HW). Required for before/after promotion.

## Surfaces (from view-matrix)

| Surface | Code UX touch | Art evidence | Remaining |
|---------|---------------|--------------|-----------|
| Calendar | `jrviews-ux-states` wash+GEO+ring on days/controls | `view_calendar.png` DESIGN-STUDY (titles, day numbers, events) | LIVE-GPU screenshot OPEN |
| Board (expense/income/debt/asset) | same universal UX | `view_board.png` DESIGN-STUDY (column cards, amounts, state labels) | LIVE-GPU OPEN |
| Plan / deps | same | `view_plan.png` DESIGN-STUDY (row titles/subs, accent edges) | LIVE-GPU OPEN |
| Reserved chrome bar | PlatformChromeJR + JRDI avatar | `view_chrome.png` DESIGN-STUDY (brand, apps, tabs, avatar asset) | LIVE-GPU JRDI photo OPEN |
| Apps picker / Budget tabs | data-jr-state | included in chrome study | LIVE-GPU OPEN |
| Account / PAT DOM | unchanged | — | no canvas claim |

## Exact UX code deltas (more than wash tokens)
- `art/src/jrviews-ux-states.js`: WASH alphas; RING; **GEO scale/opacity** from state-table; emphasis; pressed scale 0.97; disabled opacity 0.42; drop-pending accent ring (not invalid red).
- `art/design/state-table.json`: pressed ring=focus + border=selection; drop-pending ring=gold; disabled softDisc+0.42 opacity.

## Before/after screenshots
- **Blocked on cloud** — no accepted WebGPU GPU. Do not use CPU/SwiftShader as proof.
- Mac: capture LIVE-GPU Cal/Board/Plan/chrome with profile photo when JRDI path settles; store under ArtScratch `qa/live-gpu/`.

## Moho
- Comparison must contain shapes (CreateExp7ArtComparison). Empty transparent `-r` frames = FAIL (v3).
- Render via `-r` only.
