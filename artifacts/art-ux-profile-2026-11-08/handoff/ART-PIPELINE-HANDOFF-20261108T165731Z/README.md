# ART-PIPELINE-HANDOFF-20261108T165731Z

Self-contained Exp7 art pipeline handoff. **No .git. No PATs/keys.**

Generator: **front-readable-v3** (contour rings, JRViews washes, shadow+surface pairs, Cal/Board/Plan/chrome views).
Fail evidence: `qa/mac-fail-20261108T1045/` (slivers), `qa/mac-fail-v2-20261108/` (torus rings / global-mean).
Moho form A/B **VERIFIED** on Mac 14.3 — document path first.

Mac scratch root: `/Users/user-rodri/ArtScratch/exp7-art/<stage>`

## Start here
1. Read `art/pipeline/mac/MAC_RUNBOOK.md` (Moho verified commands first after unpack)
2. Read `qa/GATE-MATRIX.md`
3. Blender: `generate_ui_scene.py` stage `ui-states-v3` + `measure_roi.py` (not global mean)
4. Moho: `Moho <abs seed> <abs script.lua>` / `-r` — then comparison/animate/render
5. Analytical `art/lighting/fits.json` stays **provisional** until shadow-catcher fit

Do not clone software repos onto the Mac for this probe; use this archive only.
CI green does **not** mean visual QA pass. Still not a full art QA pass.
