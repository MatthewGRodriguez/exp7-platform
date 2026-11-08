# Exp7 art run-v3 (Mac, 2026-11-08 CST). Native Blender/Moho only. This is NOT browser WebGPU acceptance.
Handoff sha256 7048a5cd...e3a4 verified on box and Mac. Script scan ok. Tests 8/8 OK.
Mac scratch: ~/ArtScratch/exp7-art/run-v3-20261108T1100/ (new; nothing overwritten)

## Blender METAL
- Probe: 640x360, 8 samples, rc=0, about 44 s. Validation ok.
- Full run: ui-states-v3, 1280x720, 64 samples, rc=0, 6:29. 38 PNGs. Validation ok.
- PASS: rings follow the panel contour; shadow and surface pairs present; tilt and perspective renders; 4 view compositions.
- ROI |dL| vs idle: invalid 71.2, drop-pending 26.6, selected 20.7, focus 20.0, dragging 19.5, hover 3.8, settling 3.1, disabled 2.3, pressed 1.5.
- ART ISSUES:
  1. pressed (1.5) and disabled (2.3) are barely distinguishable from idle. Hover and settling are subtle by design.
  2. drop-pending uses a red ring, the same hue family as invalid, so the two collide semantically.
  3. focus vs dragging: both use a blue wash, and the focus ring is faint.
  4. The view renders are cropped fragments with items cut at the frame edges. They have only placeholder bars (no text, avatar or profile image), and chrome shows no profile image render.
## Measured shadow (isolated shadow-catcher alpha; see shadow-fit-raw.json, lighting-fits.measured.json)
- Exposed offset beyond the panel edge, r50: 8.75 image px per lift px (RMSE 0.24, linear).
- Penumbra 10-90: 4.0 px per lift px (RMSE 8.2, noisy).
- Measured penumbra/offset = 0.46 vs model 0.4667/0.3249 = 1.44. MISMATCH: either the light is effectively smaller/farther than the params, or the image-space offset includes about 12.9 px per lift px of projected panel motion.
- A ground-space fit needs camera unprojection (cloud agent). fits.json stays provisional.
## Moho 14.3
- Create (doc-first) rc=0 SAVED. Animate rc=0, 8 states keyed. RenderExp7Preview.lua FileRender rc=139 (SIGSEGV).
- CLI `-r project -f png -outfolder` rc=0 wrote 120 frames, but ALL are identical and fully transparent: the vector layers contain no shapes.
- The comparison is therefore FAIL (empty). No GIF was made, because a GIF of empty frames would be fake evidence.
- Seed sha1 unchanged (b0b1fb0d...).
## Cloud agent needed
- Pressed/disabled contrast; drop-pending hue; focus ring weight.
- Full-frame view compositions with content and avatar/profile image.
- Camera-unprojected shadow fit, or light params reconciled.
- CreateExp7ArtComparison must draw actual shapes per state layer (or import Blender frames).
- Drop RenderExp7Preview FileRender in favour of `-r`.
