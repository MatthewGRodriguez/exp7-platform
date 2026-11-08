# Moho stage — verified CLI + shape requirement

## Verified (Mac 14.3)

| Form | Result |
|------|--------|
| `Moho <abs doc.moho> <abs script.lua>` | rc0 (SmokeQuit SMOKE_OK) |
| `Moho -r <doc> -f png -outfolder …` | rc0 writes PNG |
| Bare `Moho script.lua` | exit **139** — wrong argv |
| `FileRender` via RenderExp7Preview.lua | exit **139** — **do not use** |

## v3 FAIL (must not re-claim)

Create/Animate exited 0 but layers had **no shapes** → 120 identical transparent frames. That is **not** a completed comparison stage.

## Required now

1. `CreateExp7ArtComparison.lua` draws filled rects per `state_*` (CountShapes>0) or abort.
2. `AnimateExp7States.lua` refuses empty layers.
3. Render with **`-r` only**.
4. Reject transparent-identical frame sets.

Seed `seed/JWorkbook_chrome.moho` unchanged unless Moho rewrites it.
