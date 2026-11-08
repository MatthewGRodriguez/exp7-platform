# Exp7 art run-v2 (Mac, 2026-11-08 CST)
Handoff sha256 5d6cf0a3...cf38 verified on box and Mac. Scripts scanned safe. test_validation.py: 7 OK. Dry-run OK.
Mac scratch: /Users/user-rodri/ArtScratch/exp7-art/run-v2-20261108T1050/ (new; nothing overwritten)

## Blender METAL
- Probe: 640x360, 8 samples, idle+pressed, rc=0, about 24 s. Framing ok: area_frac 0.288, 8 corners visible.
- Full run: ui-states-v2, 1280x720, 64 samples, rc=0, 2:54 wall. 24 PNGs; state-table and framing validation both ok.
- PASS: front-readable framing; tilt 0/2/5/10 and 1/2/3-pt perspective renders exist.
- FAIL (quality): hover, pressed, settling and disabled differ from idle by mean |dL| of only 0.97, 0.40, 0.73 and 0.89. They are not visually distinguishable at thumbnail size.
- FAIL (geometry): focus, selected, drop-pending and invalid rings are huge ellipses far outside the panel bounds. They don't hug the panel.
- Lighting: shadow footprint is monotonic with lift (28.6k/48.1k/84.8k/163.6k px for lift 1/2/4/8; bbox top y219->127). Offset and penumbra can't be separated because the panel and its shadow are in the same beauty pass. No measured fit vs 0.3249 / 0.4667; fits.json stays provisional.
## Moho 14.3: CLI WORKS
- A `Moho <abs seed.moho> <abs SmokeQuit.lua>` rc=0 printed SMOKE_OK. This form is also documented in the bundled Optional Scripts/Command Line Scripts.
- B `Moho -r <seed> -f png -outfolder <dir> -start 1 -end 1 -v` rc=0 printed Done!, wrote seed_00001.png.
- seed sha1 unchanged (b0b1fb0d...).
- Comparison scene, Animate and Render scripts not run (outside this probe scope).
