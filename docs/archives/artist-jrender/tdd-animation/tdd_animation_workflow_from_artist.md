# Training Days Designer (TDD) animation workflow (reported by Ash Tangent Residual Artist, 2026-10-30)

Correction: TDD player is NOT custom elements/shadow DOM. It is a small state-machine engine in JS + CSS, injected as blocks into anim.js and td.js.

## Pipeline
`python3 /workspace/td/pipeline2/pipeline2.py` (also `--from blender|moho`, `--from web --to pack`, `--from qa`, `--only caustics|belt|px2`). Runs on the box; Blender and Moho run on Matthew's Mac headless via CLI ([REDACTED-HOME]/AnimationPipeline/tdd/). Mac results stamped with input hash.
Stages under /workspace/td/pipeline2/ (box):
- 00_draw/draw.py: UI parts as layered geometry (rect, radius, thickness, bevel, z, material) -> layered SVG
- 01_state/states.py: state table, single source of truth
- 02_persp/: perspective/frustum checks (cam.py pinhole model; persp.py vanishing-point gate)
- 03_blender/p2_scene.py (run_mac.sh): one top light + caustics; renders lift/tilt poses
- 04_trace/trace.py: fits lighting numbers into lighting.json (shadow offset/blur/alpha per px of lift, highlight/rim/shade per degree)
- 05_moho/: moho.py, moho_anim.lua, SVG importer; keyframes/timing, preview GIFs
- 06_web/gen_web.py: emits sm.css, sm_logic.js, sm_art.txt (edge timing table)
- 08_pack/pack.sh: packs block with exact chars/lines/md5 + delta file
- 07_qa/: qa.py quality gates (gate_parallax.py etc.)
Second pass 3D depth: 10_px2, 10_px2b; caustics 03c_caustics; header belt waves 09_belt.
Shipped files (Mac): /Users/[REDACTED-USER]/Home/Dev/The Joy Machine 2/legacy/legacy/html/slate/ and html/slate_anim/. Box build copies: /workspace/td/ship/, /workspace/td/fetch6/.

## Player
- Engine SM1b: 06_web/sm_logic.js (3,690 chars) + sm.css (2,217 chars), ~4.9K packed.
- `data-sm` attribute on targets (selector `.day-sched-block[data-ai], button, .ux-gh`), plus `--sm-ms` and `--sm-ez` custom props from edge timing table (key `from>to`, fallback 120 ms).
- States: idle, hover, pressed, focus, selected, dragging, invalid, settling. `html[data-sm-app]` carries app state (ready, apply-preview, undo).
- Events: delegated on document: pointerover/out/down/up, focusin/out, click. MutationObservers for drag ghost; visibilitychange toggles `sm-hid` on html.
- Motion: CSS only, individual `scale`/`translate` props, pseudo-element opacity. Two box-shadows baked from Blender reads (tight hover lift, wide drag lift) crossfaded.
- rAF only to coalesce pointer/scroll input, one write per input frame; none at idle.
- Idle ambient loop dropped in shipped PX2b; Matthew likes self-looping motion if budget allows. Glass stays static; no looping shine on surfaces (shine only to draw attention).
- Parallax PX2b: depth model, each slab has front offset + back-face ring; inline translate + registered non-inherited `--pr` custom property written once per pointer/scroll frame; MutationObserver gives new slabs theirs before first style. Buttons static sides. Background fixed (needs >=2 moving depth layers).
- Guards: no matchMedia => reduced motion false; no element.animate => no WAAPI parallax in older engine; :focus-visible try-guarded; reduced motion turns all off; hidden tab pauses.
- Avoid (measured): two animations on same property => main thread (~60 recalcs/s idle); per-element loop restarts on every re-render (renderAll recreates slabs; 36->55 ms). Per-element: write inline once per input frame.

## State table / params
- /workspace/td/pipeline2/params.json: light = area disk (azimuth 90 up-screen, elevation 50, size 300px, caustics on), frustum 85mm, point-rule tolerances, ground/receiving planes, parallax depths, Blender samples, QA thresholds.
- Per state: pose (lift, tilt, scale, ring, opacity). Shadow offset 0.79 px/px lift, blur 0.93 px/px.
- Transitions: event, duration ms, easing, click-path flag, interrupts. Click-path transitions <= 120 ms.
- Perceptibility rule: tilt < 5 deg emits no lighting change.
- Parallax: per-layer depth and front-shift limits; text fronts <= 1px; side strips 0.64-1.7px.
- Outputs: out/states.json, STATES.md, states.mmd (mermaid).

## Size / Slate limits (TDD-specific; Matthew hand-types blocks)
- Plain ASCII, exact chars/lines per block. Packed blocks => small edit means retype most of block. Sizes: SM1b 4,914; PX2b ~5.7K; CA1 1,018; UX1 ~20K; SVG room ~10K.
- Prefer SVG/CSS over rasters (data URI in css is typed text). Perf: 1M-row page must keep drag p95 <= 16.8 ms and Apply <= 100 ms.
- NOTE for JEditor: the single HTML output has no hand-typing limit, so the packing/retype constraints do not apply; the engine design, state table and gates do.

## Source paths (box)
- 06_web/ (sm_logic.js, sm.css, sm.min.css, sm_art.txt, gen_web.py), 08_pack/pack.sh
- 10_px2b/ (gen_px2b.py); 03c_caustics/ (ca1.css, ca1_logic.js)
- /workspace/td/ux/ (README.md, HOOKS_drag_apply.md)
- 01_state/states.py, params.json
- /workspace/td/pipeline2/README.md, STUDY.md, SKILL.md; 07_qa/ (qa.py, gate_parallax.py)
Also saved as skill ui-motion-art-pipeline. (Message was cut off at "Quality gates: text contrast at least...")
