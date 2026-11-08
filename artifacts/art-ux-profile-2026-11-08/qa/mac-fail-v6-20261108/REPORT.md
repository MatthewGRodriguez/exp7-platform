# Exp7 art run-v6 (Mac, 2026-11-08 CST). Native Blender only. Browser WebGPU gate is OPEN/untested.
Handoff sha256 c945c1ba...e5ea verified on box and Mac. Mac scratch ~/ArtScratch/exp7-art/run-v6-20261108T1147/ (new).
Light: dist 9 m, size 4.2 m, 0.4667. Moho not re-run (v5 PASS). Output hashes are in outputs.sha256.

## Views --probe --only views: FAIL x4. Production views NOT run.
validate_view_pixels.py rc=2:
| view | contrast (>= 4.5 needed) | other |
|---|---|---|
| calendar | 1.84 | |
| board | 2.15 | |
| plan | 1.74 | only 192 dark px (< 400) |
| chrome | 2.69 | avatar chroma hits 31 (< 80); renders as a black disc, no photo |
- Visual (probe-views-sheet.png): ghosting is gone, titles are readable, framing is ok.
- Secondary text and day numbers are pale grey on grey; panel labels are nearly invisible.
## Shadow-cal (camera-invisible caster), 64 samples, 1280x720, rc=0, 6:33
Ground homography, 13 strips, mean +-sd, per lift metre:
| measure | measured | analytic |
|---|---|---|
| near-edge 50% offset | 0.3186 +-0.0040 | cot72 0.3249 (-1.9%) |
| far-edge 50% | 0.376 +-0.005 | |
| centroid | 0.384 +-0.0015 | |
| penumbra 10-90, near side | 0.207 +-0.009 | geometric 0-100% size/dist 0.4667 |
| penumbra 10-90, far side | 0.123 +-0.007 | |
- Offset: PASS (near edge, within 2%).
- Blur: MODEL-VS-MEASUREMENT DIFFERENCE, not forced equal.
  - 10-90 is a narrower metric than the 0-100 geometric width.
  - Peak alpha falls 0.95 -> 0.54 by lift 8: the umbra vanishes, so peak-normalised widths underestimate.
  - Near/far asymmetry (0.207 vs 0.123) exceeds the strip sd.
- Resolving this needs an analytic disk-light profile model (cloud) rather than equality.
## Open gates
View text contrast >= 4.5 (darken text colour/emission vs bg); avatar photo texture; production views; blur model definition; live Safari WebGPU on user HW (untested).
