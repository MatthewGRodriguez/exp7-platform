# Exp7 art run-v4 (Mac, 2026-11-08 CST). Native Blender/Moho only. This is NOT browser WebGPU acceptance.
Handoff sha256 275810e3...0045 verified on box and Mac; safety scan ok; tests OK.
Mac scratch: ~/ArtScratch/exp7-art/run-v4-20261108T1125/ (new; nothing overwritten). Seed sha1 unchanged.

## Blender views/states: probe FAIL. Full renders stopped; not wasted.
- Probe: 640x360, 8 samples, METAL, rc=0. Logged text counts: calendar 41, board 33, plan 13, chrome 10; avatars 0/0/0/1.
- Pixel check contradicts those labels:
  - plan and chrome have 0 dark text pixels (L<120). Text is ultra-low contrast and tiny.
  - The views are cropped at the frame edges (e.g. "vember 2026").
  - The chrome avatar is not discernible.
- States, ROI mean dRGB vs idle:
  - pressed 16.4, but pressed vs focus is only 5.75. COLLISION: both use the same blue.
  - disabled 1.93: still about the same as idle. FAIL.
  - drop-pending 31.8 (amber, now distinct from invalid): PASS.
  - invalid 68.1: PASS.
## Blender shadow (--only shadow, 64 samples, 1280x720, rc=0, about 2:10): MEASURED ground fit
- Method: homography from camera_instrumentation 9-point grid (max error 0.0001 px). Shadow alpha unprojected to z=0; panel-occluded pixels excluded. Lift = 0.02 m per design px.
- Offset per lift: 0.309 measured vs model cot72 = 0.3249. Error -4.8%, RMSE 0.5 mm. PASS (within 5%).
- Penumbra per lift: 0.219 measured vs Blender scene 0.373 vs params model 0.467. MISMATCH. The 2.5 mm sampling makes this coarse.
- GENERATOR MISMATCH: make_light hardcodes dist 4.5 m with size*0.004 (= 0.373). That is not the params ratio 420/900 (= 0.467).
- The far-side shadow is fully hidden behind the panel silhouette, so it can't be measured.
## Moho 14.3: PASS with art caveats
- Create (doc-first) rc=0: 34 shapes, 3 per state layer.
- Animate rc=0: shapes verified.
- -r test frames 1 and 48 differ, so the full run went ahead.
- Full -r: 120 frames, 96 unique, non-empty (49% alpha coverage).
- GIF made with global palette and no dither (moho-comparison.gif).
- FAIL: loop does not close (f1 vs f120 mean diff 7.98).
- Motion is very subtle (max consecutive frame diff 0.34).
- Before/after = flat_baseline vs state layers inside the same scene. No Blender frames were imported.
## Remaining gates
- views contrast/crop/avatar; pressed vs focus hue; disabled; light dist/size; penumbra resolution; Moho loop closure.
- USER-HW Safari WebGPU acceptance.
