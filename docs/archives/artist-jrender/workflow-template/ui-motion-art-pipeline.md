---
name: ui-motion-art-pipeline
description: >-
  Use this when making or changing UI glass, lighting, shadows, hover/press/drag
  motion, parallax, surface loops or caustics that must stay physically
  consistent: state table, multi-point perspective check, single-light Blender,
  Moho finish, small web engine, then QA gates.
---
# UI motion art pipeline (perspective + state machine)

## When to use
Use this when you change UI glass, lighting, shadows, hover/press/drag motion, parallax, an ambient background loop or a surface loop, and you want the result to stay physically consistent and pass the same quality bar every time.

## Principles
- One light. One scene. Every surface, highlight, rim and shadow comes from the same light position in one Blender scene.
- One source of truth. The state table defines every pose, lighting read and transition. Blender poses, Moho keys and web CSS are generated from it, never hand-keyed.
- Measure, then emit. Lighting values come from traced renders. Anything below perception (under about 3% luminance or half a pixel) is dropped, not faked.
- Never slow a click. Click-path visuals are 120 ms or less and never gate the action. Longer motion runs after the action.
- No per-frame script when idle. CSS does the motion. Script only reacts to events.
- Keep loops on the compositor. Give each element at most one RUNNING animation per property, with composite replace. Put paused or scrubbed composite:add animations only on a property that nothing else animates. If you need more axes, use another property (transform vs translate, including any base transform in the keyframes) or a child element.
- Guard optional browser APIs (matchMedia, element.animate, newer selectors) so a missing API degrades to the plain path.
- Respect reduced motion, and pause loops when the tab is hidden.

## Workflow
1. Parameters. Set panel size, the light (type, size, azimuth, elevation, distance, caustics, bounces), the frustum (focal length at matched framing, near/far clip), the point-rule tolerances, ground planes, parallax depths and gate thresholds in one parameter file.
2. Draw. Describe UI parts as layered geometry: rectangle, corner radius, thickness, bevel, height above the ground plane, material, and outer/inner role.
3. Perspective check. Project the parts through 1-, 2- and 3-point cameras with one shared pinhole model.
   - 1-point: the picture plane is parallel to the UI. Only depth edges converge, to one VP on the horizon.
   - 2-point: the camera is pitched. Depth and vertical edges converge, and horizontal edges stay parallel. Lengths transfer through measuring points.
   - 3-point: the camera is pitched and yawed. All three axes converge, and measuring points no longer apply.
   - Every part must share the scene's VPs. Automate this by extending each edge, intersecting it with its axis VP and failing on a miss over the tolerance. Include a negative test where a part drawn with the wrong camera must fail.
   - Frustum study. At matched framing, sweep the focal length (for example 18 to 200 mm). Wide angles distort and exaggerate lift; telephoto flattens it. Choose the shortest lens that keeps distortion under about 3% of the image width while lift still reads. Set near/far tightly around the geometry. Record the choice as a parameter.
4. State table. Define element states (idle, hover, focus, pressed, selected, dragging, drop-pending, invalid, settling, disabled) with lift, tilt, scale, ring and opacity. Define transitions with event, duration, easing, click-path flag and interrupts (press cancelled, Escape glide-back, invalid bounce). Also define app states (loading, ready, preview, applying, undo), background loop phases, and parallax states (ambient drifting, paused or off; pointer still or tracking). Emit JSON, a readable table and a mermaid diagram.
5. Blender (CLI only, one heavy job at a time). Build the parts from the drawing. Use the single light with refractive and reflective caustics and transmission bounces turned on, for realistic values only. A visible caustic layer is only allowed through the optional caustics stage (5b), after it proves the effect is real caustic light. Render the UI camera and the study cameras, each state pose, a lift series and a tilt series.
5b. Optional caustics stage. Before adding any caustic or sparkle layer, prove what the sparkle is.
   - Render caustics on and off, at two seeds, raw and denoised at the shipped sample count, plus caustics on and off at 512 samples.
   - Caustic light is what survives convergence (on minus off at 512) and correlates with the shipped difference. A speck that changes with the seed or vanishes at 512 samples is sampling noise or a firefly, not a caustic.
   - Also check that the GIF itself is not the source: per-frame palettes and dithering make static pixels flicker.
   - If the effect is real, build it as a layer traced from the converged map: transform and opacity only, behind content, paused when hidden, off under reduced motion, and under the idle-recalc gate.
   - If it is noise, raise the samples or denoise instead.
6. Trace. Measure the renders and fit linear models: shadow offset, blur and alpha per pixel of lift; highlight shift, rim and shade per degree of tilt; perspective scale per pixel of lift. Compare them with the ground-plane prediction: offset = height x cot(elevation) and penumbra = height x light size / light distance. Write the fits back so every state gets resolved lighting.
7. Moho (CLI only). Generate SVG layers and per-frame keys from the state table and the fits: card scale, shadow crossfade between a tight and a wide shadow, ring visibility and parallax layer offsets. Render a side-by-side comparison against the current flat version.
8. Web engine. Generate CSS and a small engine from the table.
   - The engine sets a state attribute plus per-edge duration and easing custom properties.
   - CSS animates only individual transform properties and opacity. Bake shadows as outer box-shadows at the tight and wide reads and crossfade them.
   - Parallax: the offset is shift x z / (D - z), with the panel as the zero-depth anchor. Pointer and scroll input scrub paused animations once per input frame.
   - The ambient drift is a CSS loop on the background depth layers only. Surface lighting stays static.
8b. Surface loops (for example belt or fabric waves).
   - Draw the surface as a height field, render one pose per phase in the state table under the same light, and divide each render by the flat render.
   - Measure the slant and check that each phase is a shift of phase 0. If it is, ONE translating gradient layer reproduces the motion exactly on the compositor.
   - For several materials under one layer, use black alpha (a hue-preserving multiply), set the lit crest to the designed colour, and report the worst dE against Blender.
   - Time it in Moho from the same table, and check the shift per frame and that the loop closes.
9. Pack. Minify, pack the block and record exact character and line counts plus a payload hash, and the delta against any block it replaces. Build harness pages: the real build plus the new blocks, with mocked hooks where the logic does not exist yet.
10. QA gates. All of them must pass:
    - ASCII only, and no banned words in shipped blocks.
    - State table is valid, with click-path transitions of 120 ms or less.
    - Perspective point rules pass, and the negative test is caught.
    - Text contrast is 4.5 or more in every element state, measured against the worst background pixel with the text hidden.
    - Clipcheck reports 0 issues.
    - No rAF callbacks while idle.
    - Style recalcs on a visible idle tab of about 0 per second (1 or less) over 5 s, after the load intro settles, on both the real build and the largest-data test page. Also, no element has two running animations on one property or a running additive animation.
    - The page still works when matchMedia is missing.
    - When an engine block replaces an earlier one, motion must match it to 0.01 px unless the change is intended.
    - The ambient loop pauses when the tab is hidden.
    - Reduced motion: no loop, no transitions, no transforms and no parallax.
    - Loaders: the loop runs while loading, is gone with the loader, and adds no recalc rate while it runs (compare against the previous block in the same window).
    - Comparison GIFs use one global palette and no dithering, so no shimmer comes from the GIF itself.
    - On the largest-data test page: drag frame p95 of 16.8 ms or less, Apply of 100 ms or less, select click to next frame of 120 ms or less, and idle and scroll p95 of 16.8 ms or less.

## Findings to reuse
- Under a large top area light, shadow offset tracks lift x cot(elevation) and blur grows faster than the simple penumbra estimate. Lift is the main depth cue.
- Small tilts (5 degrees or less) change the lighting by less than 3% and move highlights by less than half a pixel. Highlights move with the view angle, not with small pose tilts, so with a fixed UI camera they stay static.
- Two animations on one property (or one running and one additive paused) silently move a loop to the main thread (about 60 recalcs/s). Measure recalcs, not just frame times: frames stay at 16.7 ms while the CPU cost grows.
- A tight, near-orthographic frustum (about 85 mm equivalent) keeps UI geometry honest. Wide angles exaggerate lift and bend the corners.
- Caustic light on thin UI glass under a top light is a soft, static brightening (about 10%). Little rim specks are usually sampling noise, and caustic paths roughly double raw fireflies. GIF shimmer often comes from per-frame palettes.
- Wave shading under one top light is a pure shift per phase, so a single translating gradient is enough. Other printed colours change too, so shade them all with black alpha.

## Deliverables per run
Perspective contact sheets, lighting-by-angle, by-pose and series sheets, the state table (JSON, MD, mermaid), Moho comparison GIFs, web comparison GIFs (with and without the engine; parallax on and off), packed block counts, the delta against the block it replaces, and a QA report.
