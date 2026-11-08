# pipeline2: perspective + state-machine UI art pipeline

One entry point regenerates everything from the drawing, the parameters and the state table:

    python3 pipeline2.py                 # all stages, stops at a Mac stage if its inputs changed
    python3 pipeline2.py --from blender  # resume after dropping out/renders.tgz in
    python3 pipeline2.py --from moho     # resume after dropping out/moho_out.tgz in
    python3 pipeline2.py --from web --to pack          # fast loop while tuning CSS/engine
    python3 pipeline2.py --from qa [--skip-1m]         # gates only

Nothing here edits live files. Test pages are copies of the real build (default fetch4b) with the previous engine block
swapped for the new one; the 1M-row page is the 1M slate preview shell with that td.js.

## Inputs
- `params.json`: the single parameter file. Panel size, the ONE light (AREA disk, azimuth 90 = straight up the screen,
  elevation 50, caustics on, filter_glossy 0, bounces), frustum (focal 85 mm at matched framing, near/far just around the
  geometry), point-rule tolerances, ground/receiving planes, parallax (layer depths, ambient drift amp/period, inputs),
  Blender samples, QA gate thresholds.
- `00_draw/draw.py`: UI parts as layered geometry (rect, radius, thickness, bevel, z, material, outer/inner).
- `01_state/states.py`: THE source of truth. Element states (pose: lift, tilt, scale, ring, opacity), transitions
  (event, ms, easing, click-path flag, interrupts), app states, parallax states (ambient drifting/paused/off, pointer
  still/tracking), tiger sweep phases, rules (click path <= 120 ms, perceptibility thresholds).

## Stages and outputs (all under out/)
| stage | script | outputs |
|---|---|---|
| draw | 00_draw/draw.py | parts.json, parts.svg |
| persp | 02_persp/persp.py (cam.py = shared pinhole model) | persp_points.png, persp_frustum.png, persp_check.json (VP gate + negative test) |
| state | 01_state/states.py | states.json, STATES.md, states.mmd (mermaid) |
| blender (Mac) | 03_blender/p2_scene.py via run_mac.sh | renders/ (workbench + Cycles per camera, per pose, lift and tilt series) |
| trace | 04_trace/trace.py | lighting.json (fits: shadow offset/blur/alpha per px of lift, highlight/rim/shade per deg of tilt, perspective scale), light_by_angle.png, light_by_pose.png, light_series.png |
| state2 | 01_state/states.py again | states.json with lighting resolved per state |
| moho (Mac) | 05_moho/moho.py, run_mac.sh (generic moho_anim.lua + SVG importer) | moho/<scene>/ stages, preview frames |
| mohogif | 05_moho/mkgifs.py | sm_compare.gif (flat v4 vs state-driven), parallax_compare.gif |
| web | 06_web/gen_web.py | sm.css, sm_logic.js, sm_art.txt (edge timing table) |
| pack | 08_pack/pack.sh (env NAME, PREV, BASE_PAGE, BASE_TDJS) | packed/<NAME>_packed.js, <NAME>_counts.json (exact chars/lines/payload hash), <NAME>_delta.json (what replaces the previous block, td.js md5 before/after), harness/real_prev.html, real_new.html, m1_prev.html, m1_new.html |
| qa | 07_qa/run_browser_qa.sh + qa.py | qa_report.json and the per-gate JSON files |

Mac stages are CLI only (never open the apps), one heavy job at a time (the runners refuse to start if Blender or Moho
is already running). Each Mac result is stamped with a hash of its inputs; unchanged inputs skip the Mac.

## Quality gates (07_qa/qa.py, exit 1 on any failure)
- ascii_and_banned_words: every generated file ASCII; no "trainee"/"instructor" in shipped blocks (pack.py also asserts).
- state_table: no dangling or unreachable states, click-path transitions <= 120 ms, lighting resolved from the trace.
- perspective_point_rules: every part's edges meet the chosen VPs within 1.5 px (parallel within 0.25 deg); measuring
  line check for 2-point; a deliberately wrong part must be caught (negative test).
- contrast_per_state: every text run in every element state >= 4.5 against the worst background pixel (text hidden).
- clipcheck: 0 issues on home, shifts, picked, editor.
- idle_no_per_frame_js: zero rAF callbacks in 3 s idle.
- idle_recalc_real / idle_recalc_1m: on a VISIBLE idle tab, style recalcs <= 1 per second over 5 s (params.gates.idle_recalc_per_s),
  rAF <= 1, on the real build and on the 1M-row page. Measured after the build's own load intro has settled (14 s after load).
- compositor_slots_real / _1m: no element has two RUNNING animations on the same property and no running animation uses a
  non-replace composite (either one moves that element's animation to the main thread). Reports the sm slots in use.
- matchmedia_guard: with window.matchMedia removed the page loads with no errors, the engine sets states and parallax is wired.
- motion_identical_to_previous_block: platter and tiger positions (drift at fixed times + pointer parallax) match the previous
  block to 0.01 px. Runs when real_prev.html exists.
- parallax_depth_layers (PX2 rule): parallax needs >= 2 moving depth layers with visible side faces or overlap; a single
  moving background does not count. From qa_px2.node.js: >= 2 distinct front shifts (>= 0.2 px apart) among the slab classes at full
  view, >= 2 classes whose back-face side strip shows >= 0.5 px (params.gates.parallax_side_min_px), and the backdrop not the only
  mover. Standalone: python3 07_qa/gate_parallax.py <qa_px2.json>. Negative test: the SM1b build (moving backdrop only) fails.
- render_cost (fetch4e finding): TrainingDays.renderAll() x12, call -> next frame, and the style recalc over those 12 redraws, new build
  vs the shipped base (RC_BASE, default real_prev.html), >= 3 alternated rounds, medians within params.gates.render_cost_max_ratio
  (1.05). Every slab is re-created by renderAll, so anything per element (CSS loops, WAAPI objects) is paid again on every render.
- ambient_pauses_when_hidden: ambient drift runs when visible, paused when hidden (and on tds-uh).
- reduced_motion: no ambient, no transitions/scale, no running animations, no parallax animations created.
- perf_1m_*: on the 1M-row page, drag frame p95 <= 16.8 ms, Apply sync <= 100 ms, select click to next frame <= 120 ms,
  idle and scroll p95 <= 16.8 ms.

## Web runtime contract (SM1)
- Engine sets `data-sm` on targets (agenda blocks, buttons, the drag ghost) plus `--sm-ms`/`--sm-ez` from the edge
  table, and `html[data-sm-app]`. CSS does all motion with individual `scale`/`translate` and pseudo-element opacity;
  shadows are two outer box-shadows baked from the Blender reads (tight = hover lift, wide = drag lift) and crossfaded.
- No per-frame JS when idle. Pointer/scroll parallax writes paused WAAPI `currentTime` once per input frame.
- Ambient drift is a pure CSS loop on the depth layers only (platter, tiger); glass lighting stays static.
- Compositor slots (params.parallax.slots): one RUNNING animation per property per element, composite replace; the paused
  composite:add parallax only sits on a property nothing else is running on. Platter: drift on transform (Y), parallax on
  body::before translate. Tiger: drift X on #tg-g translate, drift Y on #tg-g transform (keyframes carry the TG4 base
  translate(-50%,-50%)), parallax on each #tg-g>i window's translate. Breaking this costs about 60 style recalcs/s on an idle tab.
- Feature guards: no matchMedia means reduced motion false; no element.animate means no parallax; :focus-visible is try-guarded.
- Reduced motion: everything above off; state still reads through rings and static shadows.

## Optional stages
- `python3 pipeline2.py --only caustics` (03c_caustics/): shimmer study. The Mac renders caustics on and off, seed 0 and 7,
  raw and denoised at 48 samples, and on and off at 512. study.py writes out/caustics_study.json and caustics_study.png, which
  show difference maps x8 with the top 12 spots ringed. Previews: out/caustics_shimmer_is_noise.gif and
  out/caustics_real_option_preview.png.
  - Then CA1: trace_ca.py > gen_ca1.py (ca1.css) > pack_ca1.sh (out/packed/CA1_*, which inserts it before STONE on the
    SM1b pages, with and without HD3) > qa_ca1 / qa_states_ca + contrast / clipcheck / qa_idle > ca_shots + ca_report.py
    (out/caustics/qa_ca1_report.json).
- `python3 pipeline2.py --only belt` (09_belt/): header belt waves.
  - Steps: draw_belt (height field and wave poses) > belt_scene (Blender: same light, caustics on, yellow
    retroreflective-style and blue print) > trace_belt (ratio to flat, measured slant, pose = shift check, bands) > gen_belt
    (HD3 = HD2 plus one gradient layer) > moho_belt / check_moho_belt (timing) > pack_belt (HD3 counts, pages, delta) >
    qa_belt / qa_idle.
  - Outputs: out/packed/HD3_*, out/belt/qa_belt_report.json, out/belt/belt_current_vs_wavy.gif.

## PX2: 3D-sided parallax (python3 pipeline2.py --only px2)
Replaces SM1b's drift + backdrop parallax (keeps the SM1b state engine byte for byte). The platter and the tiger are a fixed,
screen-anchored backdrop (no drift, no parallax; the tiger reveal stays). Slabs (outer panels, inner glass, schedule blocks, buttons)
get real thickness from parts.json: fronts at different depths shift by different amounts (text fronts <= 1 px) and each slab's
back face (::after border ring, one traced shade per side) offsets from its front, so a foreshortened side strip shows on the side
the view moved toward. Stage files: 10_px2/{depth.py, px2_scene.py, run_px2_mac.sh, trace_px2.py, sample_fronts.node.js,
shades_px2.py, gen_px2.py, pack_px2.sh, moho_px2.py, check_moho_px2.py, px2_shots.node.js, gif_util.py, qa_px2_all.sh};
outputs out/px2/ (depth.json, side_trace.json, side_shades.json, blender/, moho/, gifs/, stills/, qa/) and out/packed/PX2_*.

## PX2b (supersedes PX2's runtime; python3 10_px2b/gen_px2b.py && bash 10_px2b/pack_px2b.sh)
Same depth model, side widths and traced shades as PX2; no animation objects. Panels, inner glass and schedule blocks (31 slabs) get an
inline translate (front) and a registered non-inherited --pr (ring) written once per pointer/scroll frame; new slabs get theirs in the
MutationObserver callback before first style. Buttons keep static sides (rest bevel) and ride their parent slab. The ambient ring loop
is gone. Measurement tools: 10_px2b/{render_cost,pointer_cost,wire_cost}.node.js, 10_px2b/variant_page.sh.
PX2b results (Oct 18): renderAll 37.5 ms / 12-redraw recalc 156 ms vs fetch4d 35.5 / 148 (30 alternated runs, +5.6% / +5.4%;
fetch4e was 52-60 / 270-330). QA: 10_px2b/qa_px2b_all.sh, report 10_px2b/qa_report_px2b.py -> out/px2b/qa_report_px2b.json.
Art parity: 10_px2b/px2b_shots.node.js + 10_px2b/sheet_px2b.py -> out/px2b/stills/px2_vs_px2b_sheet.png.
