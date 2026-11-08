# Exp7 art run-v5 (Mac, 2026-11-08 CST). Native Blender/Moho only. This is NOT browser WebGPU acceptance.
Handoff sha256 ed330611...623a verified on box and Mac; scan ok; tests OK.
Mac scratch: ~/ArtScratch/exp7-art/run-v5-20261108T1137/ (new). Seed sha1 unchanged.
The cloud ortho PNGs are design studies and were NOT used as results.

## Blender views: FAIL (stopped)
- Light log: dist 9.0 m, size 4.2 m, size/dist 0.4667. This matches params.
- 8-sample/640 probe: VIEW_PIXEL_FAIL calendar contrast 1.73 < 4.5. The generator stopped itself (rc=1, validator rc=2).
- Re-ran at 64 samples/1280 to rule out probe settings: contrast 1.76. Still FAIL.
- Board/plan/chrome were not rendered because the generator stops at the first failure.
- Visible in view_calendar_METAL_fail.png:
  - PASS: framing is fixed (title, weekdays and full grid in frame).
  - FAIL: text is washed out, with ghosted double glyphs and white numerals on light tiles.
## Blender shadow: fresh --only shadow with corrected light, rc=0, 2:32
- The larger penumbra means the inner (90%) side is always occluded by the panel silhouette (5/5 lifts). y50 is therefore truncated.
- Offset fit 0.466 is CONTAMINATED; do not use. Treat v4 offset 0.309 as the earlier-light result only.
- The outer edge y10 is clean: -0.2615 -> -0.232 over lift 0..8, about 0.184 per lift.
- The ground fit for the model is UNRESOLVED. It needs a camera/occlusion-free view (e.g. top-down or a shadow-only catcher with the panel invisible to camera) to measure the full penumbra.
- The blur difference is documented as a measurement-geometry limit, not forced equal to the model.
## Moho: PASS
- Create shapes=34, Animate loop_closed.
- Short test frames 0/1/60/120 before the full run.
- Full 120 frames: 102 unique.
- |f0-f120| = 0.000 (exact closure). f1-f120 = 0.02. Intermediate frames differ (f1 vs f60 = 2.64; max vs rest 3.41). Non-empty (49% alpha).
- GIF: global palette, no dither.
- Caveat: motion amplitude is still subtle.
## Open: view text contrast/ghosting + board/plan/chrome renders; avatar pixels untested; shadow penumbra measurement; Safari WebGPU on user HW.
