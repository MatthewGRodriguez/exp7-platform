# Exp7 art run run-20261108T1045 (Mac, 2026-11-08, CST)
Handoff sha256 c932d526...3c28 verified on box and Mac. Scripts scanned: they write to scratch only and make no network or subprocess calls.
Mac scratch: /Users/user-rodri/ArtScratch/exp7-art/run-20261108T1045/ (new; nothing overwritten)

## Blender 4.2.1 METAL: RAN, FAIL as art evidence
- The runbook command ran with rc=0 in about 132 s. It produced 10 state PNGs and a 5-step lift series (0/1/2/4/8 px) at 1280x720 with 64 samples.
- run.json reports device "Apple M3 (GPU - 10 cores)" METAL in use, cycles_device=GPU.
- MISMATCH 1: the camera grazes the ground plane, so each panel is an edge-on sliver about 120x17 px in a 1280x720 frame (see contact-sheet-blender-metal.png). This does not fit the frontal UI geometry.
- MISMATCH 2: disabled, invalid and pressed renders differ from idle by at most 1 luma level. The generator only varies lift, with no material, colour or scale difference, so these four states are indistinguishable.
- MISMATCH 3: there is no tilt or perspective series. The generator only has state and lift loops.
- Lift measurement (raw diff against lift_00 in lighting-measure.json): the changed region grows 461 -> 1009 px and its bbox top moves from y363 to y352 as lift goes 1 -> 8 px. At this grazing view, shadow offset and penumbra can't be separated, so no valid fit against the 0.3249 / 0.4667 per px predictions is possible. fits.json stays provisional.
## Moho 14.3: BLOCKED
- SmokeQuit.lua and CreateExp7ArtComparison.lua run as `Moho script.lua` both exited 139 (SIGSEGV) within seconds with empty output.
- No comparison .moho was created, so the Animate and Render steps were not run.
- No DiagnosticReport was found.
