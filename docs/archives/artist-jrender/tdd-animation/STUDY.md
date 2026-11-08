# Study results: perspective, frustum, grounds, lighting by pose, parallax, state machine

All numbers come from out/persp_check.json, out/lighting.json, out/states.json and the QA/perf JSON files.

## Point rules (02_persp, gate PASS, negative test caught)
- 1-point (pitch 0): depth edges converge to one VP at the principal point, and X/Y edges stay parallel. 0.0% distortion.
- 2-point (pitch 40): Y and Z converge, and X stays parallel. Measuring points transfer lengths along Y. 3.2% distortion.
- 3-point (pitch 40, yaw 30): all three axes converge. Measuring points do not apply because the picture plane is
  tilted, so lengths are checked by the shared-VP test plus direct projection. 2.6% distortion.
- Every part meets the scene VPs within 1.5 px. A part drawn with its own camera misses by 58 to 183 px and fails.

## Frustum (matched framing, 3-point camera)
| focal mm | distance px | far/near | distortion % of width | lift-12 scale |
|---|---|---|---|---|
| 18 | 530 | 4.27 | 12.6 | 1.0178 |
| 35 | 907 | 2.29 | 6.6 | 1.0096 |
| 50 | 1259 | 1.82 | 4.5 | 1.0067 |
| 85 | 2099 | 1.44 | 2.6 | 1.0040 |
| 200 | 4895 | 1.17 | 1.1 | 1.0017 |
Recommendation (params.frustum): 85 mm. It is the shortest lens under 3% distortion, and a 12 px lift still scales
measurably. Near and far sit just around the geometry for the best depth precision. Wide lenses exaggerate lift and
bend the corners. In Blender they also move the specular highlight more per pixel. In Moho, the lift scale they
produce would be 4x too big.

## Grounds and lift (single top light, azimuth 90, elevation 50; trace PASS)
- Receiving plane = panel top. Inner items sit 1.15 px above it, which gives a tight, dark contact shadow at rest.
- Shadow offset = 0.79 px per px of lift. Theory predicts 0.84 (cot 50 deg).
- Blur = 0.93 px per px of lift. That is faster than the penumbra estimate of 0.5, because the area light is large.
- Alpha is roughly constant at about 0.55 at the core. The shadow spreads rather than fades.
- Perspective scale at 85 mm is 0.06% per px of lift, so a 12 px drag lift scales by 0.72%.

## Lighting by pose and angle
- Tilt up to 5 degrees moves the highlight by less than 0.03 px, changes the rim by 0.7% per degree and shade by 0.8% per
  degree. All of that is below perception, so the generators keep the tilt pose and emit no lighting change for it.
- Highlights move with the VIEW angle. In the 3-point view the panel's mirror highlight is large. With the fixed UI
  camera it is static. This matches "glass lighting stays static": there is no looping shine, and no fake highlight
  slide on hover.
- Lift is the depth cue. Every lifted state's shadow comes from the two traced reads (tight at hover lift 2, wide at
  drag lift 12), crossfaded.

## Parallax (games-style depth layers)
- Offset = shift x z / (D - z), with the panel as the anchor (z = 0, never moves), D = 1683 px and a 60 px virtual
  camera shift.
- Offsets at full input: platter -4.0 px, tiger -3.7 px, inner +0.14 px, lifted +0.43 px. Only the back layers move
  visibly. The foreground stays put, so text never swims.
- Ambient drift (Matthew likes loops): 4 x 3 px over 31 s / 23 s, on the platter and tiger only. It is a CSS loop, paused
  when hidden or on tds-uh, and off under reduced motion. Pointer and scroll add to it through paused WAAPI animations
  with composite add.

## Compositor slots (fetch4b finding, fixed in SM1b)
- SM1 ran the drift as two CSS animations on `translate` (and composite add on the tiger) with the paused parallax also on
  `translate` with composite add. Any of those keeps the animation on the main thread: about 60 style recalcs/s and
  +135 ms main thread per 5 s on a visible idle tab (Ash, fetch4b; reproduced: 60/s, 141 ms per 5 s).
- Measured rules (isolated page): one running animation on a property -> 0 recalcs; two running on one property (with or
  without animation-composition:add) -> 60/s; a running animation plus a PAUSED composite:add animation on the same
  property -> 60/s; on different properties -> 0.
- It also explains a quiet bug: on body::before smDy overrode smDx, so the platter only ever drifted in Y. SM1b keeps that
  motion identical (platter Y, tiger X+Y; positions match SM1 to 0.000 px at 5 drift times and 2 pointer positions).
- SM1b idle: 0 recalcs/s and 6 ms main thread per 5 s on fetch4b, the same as fetch4 without SM.

## State machine
The state machine drives everything: Blender poses (03), Moho keys (05) and the web engine (06) all read
out/states.json. See STATES.md and states.mmd.

## Pipeline improvements and cost
| improvement | what it buys | cost |
|---|---|---|
| state table as single source (01) | Blender, Moho and web can never drift apart; one edit regenerates all | done, about 0 per change |
| automated VP check + negative test (02) | geometry errors caught before any render | under 1 s per run |
| frustum as a parameter (85 mm) | honest lift and highlight reads, Moho scale matches web | done |
| lift/tilt series + linear fits (04) | lighting values measured, not guessed; perceptibility threshold drops noise | about 6 min of Mac Blender time when poses change |
| generated Moho keys (05) | final animation always matches the table; side-by-side vs flat | about 20 s of Mac Moho time |
| per-state contrast gate (07) | every state's text verified, not just rest | about 60 s |
| input-hash stamps on Mac stages | Mac work only reruns when its inputs change | done |
| 1M-row perf in the gate | perf regressions blocked | about 4 min (page build is about 160 s) |
| idle style-recalc gate + compositor-slot check (real + 1M) | main-thread animation regressions blocked before ship | about 30 s real, about 3 min 1M |

## Shimmers: caustics or noise? (03c, Oct 17)
- Shots cy_top, cy_three and cy_three_dragging, rendered six ways: caustics on/off at 48 samples, seed 7, raw (no denoise),
  and on/off at 512.
- Real caustic light (on minus off at 512) is a soft, even lift of the inner glass faces. It is 9.8% of the light in the top
  view and 1.5% in the three-point view, with a max of 0.106 linear. It is static and already part of the traced glass values.
  The shipped (48 sample) on-off difference correlates with it at 0.985-0.987.
- The little specks are at the top rims of the two big inner glass panels in cy_top (x 268-668, y 115-117 px) and on the
  glass edges in cy_three, for example (517,250) and (552,346).
  - At those spots, seed 0 vs seed 7 changes them by up to 0.083, and at 512 samples the caustic there is only 0.011-0.042.
  - So they are path-tracing noise. Caustics on makes it worse: raw fireflies go 2394 -> 4986 (top) and 781 -> 1502
    (three). The denoiser removes most of them (83 vs 163).
- The web GIFs add their own shimmer. With per-frame palettes and dithering, 4.5% of the pixels that did not change in the
  source flicker per frame (web_parallax_compare.gif: 9.5% changed per frame vs 6.3% in the source frames). The Moho GIFs
  are clean (0.4-0.5%).

## Belt waves (09, Oct 17)
- Geometry: 5 waves per 820 px tile (lam_x 164 px), crests slanted 20 deg, max slope 0.32, period 10 s, travelling +x on the
  fabric. On screen that is 16.4 px/s relative plus 20.5 px/s belt.
- Trace:
  - Measured slant 19.6 deg (drawn 20).
  - Each phase is a shift of phase 0: measured phase .276/.504/.775 vs .25/.5/.75, rms ratio residual about 0.03. The
    residual comes from the finite light distance across the strip.
  - Yellow ratio .84-1.06. Blue print (same waves) dE 7.4, so the waves physically change the blue as well.
- Web: one black-alpha repeating gradient (109.6 deg, 154.5 px period, alpha 0-.108, 12 stops) on one compositor translate.
  The lit crest equals the designed colour. Worst dE vs Blender is 2.06 on yellow or blue.
- Moho timing: the shift error per frame is 0.24 px max and frame 241 equals frame 1.

## CA1 caustic light layer (approved Oct 18)
- Trace (03c_caustics/trace_ca.py, on512/off512, inner glass card1+card2): ratio 1.03 on the top 1.33 css px rim, then 1.30
  ramping to 1.367 by 45 px (35% of the box), flat to the bottom, and a 1.51 bottom rim line. Left-right flat (1.34-1.37).
- Web: one static white-alpha gradient as the TOP background layer of the GL4 inner glass boxes (.day-sched-block.k-shift, .tr-mv;
  .mc and .cal-m outside #cal-card). Alpha .038-.046, bottom line .062. In the browser the lift measures 1.27-1.30 (top),
  1.35-1.40 (body) and 1.58 (bottom line).
- No motion: at the inner depth (+4 px) the SM1b parallax model gives at most 0.16 px (pointer 0.143 px, drift 0.11-0.16 px),
  and SM1b holds the inner layer fixed. Only the platter and tiger move. CA1 therefore has nothing to pause, and idle recalcs stay 0.
- k-shift text contrast goes from 7.21 to 6.19 at worst; the per-state worst stays at 5.25 (an unrelated button). Clipcheck 0.

## PX2: parallax with real depth layers (Oct 18)
- Rule (gate parallax_depth_layers): parallax needs >= 2 moving depth layers with visible side faces or overlap; a single moving
  background does not count. Matthew: parallax is only parallax if layers move against each other. SM1b moved one background; that is a moving
  background, not parallax. PX2 fixes the backdrop (platter + tiger) and makes the UI slabs 3D.
- Depth: d(h) = S*E*(h-hp)/(D-E*(h-hp)), D = 2099.1 px (85 mm, matched framing), S = 60 px camera shift, pivot hp = 3.7 (mid of
  the text-bearing front heights). E = 15.64 is the largest exaggeration that keeps every text front <= 1.0 px. Front shifts per unit
  view: outer +0.97, inner glass/blocks -0.77, buttons -1.0 px (nested slabs subtract the parent). Side strips (ring offset vs front):
  0.64 / 0.90 / 1.13 px at full pointer, up to 0.96 / 1.36 / 1.70 px with the ambient loop; inner glass vs panel fronts 1.74 px apart.
  The old SM1b inner offset was 0.11-0.16 px (invisible). Relaxing text to 1.5 px would give 1.5x larger sides.
- Blender (one top light): a real 85 mm camera adds static spread x*h/D at the frame edges. Moving the camera k x further and dividing
  E by k keeps the side widths and leaves the rest view flat (oblique limit); comparison at k = 40. Traced side/front luminance at
  k = 40 (E = 1.5, near-true thickness): outer top 1.57, sides 0.07-0.10, bottom 0.04; inner glass top 1.23, sides 0.41-0.70,
  bottom 0.40; buttons top 1.26, sides 0.29-0.57, bottom 0.30; blocks top 1.64, sides 0.30-0.42, bottom 0.26. At k = 1 (E = 60,
  grazing, 60x thickness) dark glossy slabs read much brighter at the sides (Fresnel: outer sides 2.3-2.5x, top 13.8x). Left/right
  differ because the light sits over the panel centre; the web uses the position-free mean. The panel front must be read in a lit,
  unshadowed spot (left margin), not under the cards.
- Web shades: overlay per side (white alpha above the front, black alpha below) so one rule holds over every front colour. On the
  dark UI the lit tops are faint (+2-8% white) and the far sides strong (26-93% black): that is what the single top light gives.
- Cost: a :root custom property as the view vector forces a full-document recalc per input frame (8-20 ms on the 1M page, scroll p95
  133 ms), registered or not. Per-element paused WAAPI (composite add) touches only the slabs: idle 0 recalcs/s, scroll p95 16.8 ms.
  365 calendar day keys with rings slowed every recalc; they ride the month glass and are excluded. csso restructuring reorders
  `border` shorthand after `border-color`: use longhands.
- 1M drag regression (found in QA, fixed): with rings on, drag frame p95 was 33-50 ms (fetch4d 16.8). Experiments: ring loop off 33.3,
  driver animations off 33.3, all rings hidden 16.7, button rings hidden 33.4, schedule-block rings hidden 16.7. Cause = the 16 rings
  on the schedule blocks (z-index -1 boxes inside overflow:hidden rows that UX1 re-lays out every drag frame), not the count, the loop or
  the driver. Fix: `body:has(>.ux-gh,>.ds-ghost) .day-sched-block:not(.ux-gh)::after{display:none}` (sides hidden only while a drag
  ghost is up; the driver is frozen then anyway). After: p95 16.7 / 16.8 / 16.8 in 3 runs alternated with fetch4d.

## PX2b: per-element animations restart on every re-render (Oct 18, fetch4e finding by Ash)
- TrainingDays.renderAll() re-creates every slab (0 of 110 survive). PX2's ring loops (one CSS animation per ring) were created and
  started again on every render: renderAll 36 -> 52-60 ms, style recalc over 12 redraws 150 -> 270-330 ms. Its lazy pointer driver also
  created ~440 WAAPI animations on the first pointer frame after each render (210 ms frame vs 29 on fetch4d), and continuous pointer
  motion ran at p95 33-50 ms (currentTime writes restyle every animated slab).
- Loop only on panels: still +6% time / +16% recalc. A root custom property for the view: renderAll fine, but every pointer frame is a
  full-document recalc (~39 ms here). Per-slab inline writes: fine for panels/glass/blocks (8 panels 1.5 ms, 7 glass 0.4, 16 blocks 0.4)
  but each button restyle costs ~0.17 ms in this app (79 buttons = 12-15 ms per frame, the same on fetch4d).
- PX2b keeps the 3D look with no animation objects: 31 slabs written per input frame (registered non-inherited --pr so only the slab
  restyles; its ring reads it via --pr:inherit), buttons with static sides riding their parent, no ambient loop.
- Result: renderAll +5.6% / recalc +5.4% vs fetch4d over 30 alternated runs (box noise ~3-5% per set). No single part explains the rest:
  without the MutationObserver, without the :has rule, without rings or static translates, every variant lands within noise.
- An ambient loop needs an element that survives renderAll. Only #pane and #td-top do. A compositor transform loop on #pane costs
  nothing (idle recalc 0, render unchanged, one persistent animation), but it moves fronts and sides together (no side reveal) and the
  pointer already uses 0.968 of the 1 px text budget, so it was not shipped.
- clipcheck: the block ring outset (inset -1.5px inside overflow:hidden) makes scrollHeight = clientHeight + 2 on every block. It is
  clipped, no text is hidden (control with block rings off: 0 issues). PX2 hid this only because its ambient loop pulled the ring up.
