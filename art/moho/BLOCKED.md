# Moho stage status

| Item | Status |
|------|--------|
| Moho 14.3 binary | `/Applications/Moho.app/Contents/MacOS/Moho` |
| Form A: `Moho <abs seed.moho> <abs script.lua>` | **VERIFIED** rc0 `SMOKE_OK` (2026-11-08) |
| Form B: `Moho -r … -f png …` | **VERIFIED** rc0 `seed_00001.png` |
| Bare `Moho script.lua` | **FAIL** exit 139 — wrong argv, **not** licensing |
| `-h` help | **BLOCKED** — no text ≤20s |
| Comparison / animate / FileRender | **PROBE-READY** via form A — not yet claimed complete |
| Fabricated Moho PNG/GIF in repo | **NONE** |

Canonical runbook: `art/pipeline/mac/MAC_RUNBOOK.md` (Moho section first after Blender).
Details: `art/pipeline/moho/BLOCKED.md`, `README.md`.
