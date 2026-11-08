# ART-PIPELINE-HANDOFF-20261108T164755Z

Self-contained Exp7 art pipeline handoff. **No .git. No PATs/keys.**

Generator: **front-readable-v2** (fixes Mac METAL fail run-20261108T1045 edge-on slivers).
Prior fail evidence: `qa/mac-fail-20261108T1045/`. Moho bare CLI exit139 → stage **BLOCKED**.

Mac scratch root: `/Users/user-rodri/ArtScratch/exp7-art/<stage>`

## Start here
1. Read `art/pipeline/mac/MAC_RUNBOOK.md`
2. Read `qa/GATE-MATRIX.md` (rendered vs provisional vs blocked vs fail)
3. Blender 4.2.1 METAL generator: `art/pipeline/blender/generate_ui_scene.py` (stage `ui-states-v2`)
4. Pre-render gates: framing area/height + state non-lift materials (`test_validation.py`)
5. Moho: seed + Lua; see `art/pipeline/moho/BLOCKED.md` — try documented `file.moho script.lua` / `-r`, not bare script
6. Analytical lighting `art/lighting/fits.json` remains **provisional** until frontal PNGs measured

Do not clone software repos onto the Mac for this probe; use this archive only.
CI green does **not** mean visual QA pass.
