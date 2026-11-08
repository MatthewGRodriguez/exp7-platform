# Exp7 light / transparent v14 candidate

User pt1654u. Original browser-JS Exp7 + core-wasm + accepted v13 motion. No WASI or Boa.

## Artifact / preservation
- Candidate: exp7-demo-light-v14-candidate.html (1451169 bytes), SHA256 `019f0dcdf84b28663aa4110387384fb9f9a7f0aac89ec5114e972da69fce9763`.
- Input accepted-v13.html SHA256 `429a745d77f78fbdf1bedddc372dde0effb49baac3fe15c62dae33851f175ec7`. Main accepted HTML is NOT promoted or overwritten by this stage. Box backup exp7-demo.v13.html is byte-exact.
- Eight original computation/model/compiler/codec scripts 0-7 and embedded wasm/fonts 11-13 are byte-exact; motion block10 and lifecycle16 also exact. Changed presentation blocks: 8 runtime token defaults;9 configurable premultiplied canvas/placeholder default;15 host layout colors/root backdrop/transparent clears;17 neutral side material + transparent RGBA parity helper;18 seed theme/states, visible risk labels and form colors. PRESENTATION.diff contains exact changes.
- Ten ranking/risk/proposal/controller function source slices also checked byte-exact. No fallback renderer, network, proxy, algorithm substitution, or UI/layout redesign.

## Transparent versus content surfaces
The .jrv/canvas CSS is transparent, every real view clears GPU attachments to alpha0 and configures premultiplied compositing. The full-view root:bg node is retained for IDs but emits no rectangle. Content panels, cells, controls, form fields and hit regions remain real native geometry with readable light fills. Existing page/header already-light UI is not broadly redesigned. Original risk accents retained; dark same-hue label inks meet light-theme contrast. CalendarTemplate explicit dark seed tokens are themed, not just default fallback values. New item authoring is exercised through actual native event->form->proposal->rerender.

## Verified CPU evidence (exact embedded payload; NOT GPU pixels)
- Theme 45/45: live canvas configs, actual render-pass clear colors, exact embedded WGSL premultiply expression, source-over pipeline blend, all five scenes no opaque viewport rectangle/root fill, retained content panels, native field placeholder/caret, actual new item creation, day->month->year->month and full-text calendar audit.
- Analytical foreground contrast against defined light/selection/hover surfaces: minimum 5.053:1 across 8 roles; actual generated foreground/fill/hover palette minimum 4.680:1. Opaque light content or existing light host underlay assumed. Not antialiased GPU pixel measurements and not a guarantee on arbitrary dark embedding backgrounds.
- Motion149 checks: source edges/easing/interrupts/cleanup/hidden/reduced/optional APIs, original native animation parity, immediate action before visual frame, and unchanged algorithm source slices.
- Slab76 checks, 10000 native hit comparisons, 1000-frame memory stress, 12 real renderer reentries, patched vs fresh geometry at five pointer positions and two scroll positions. Native CPU frame mean 0.1229ms, not GPU timing.
- Original14 groups: hit order/hover; scroll/clip; 400-round patch/full rebuild; dirty range upload; invalid patches; text measure/fit; hit patch property; replace flags; color patch; text wrap; missing glyphs; drag; rich text; TextEdit.
- Full original app20 checks each allowed, reduced and absent matchMedia: all10 tabs, circuit, independent Best/Selected, native calendar selection/navigation, Board text fields, binary two-writer convergence and no network. Proposal selftest17/17.
- Same-event/state v13/v14 layout comparison: all5 scenes exact node IDs/hits/geometry/text after normalizing colors and excluding intentionally removed root backdrop.

## Test corrections / honest limits
Tests caught original calendarTemplate's explicit dark tokens: corrected theme inheritance in seed initialization. Shader check now matches its actual i.col.rgb*i.col.a expression; shader binary was not changed. The copied old motion oracle expected v11-only fixtures and all presentation JS unchanged: updated oracle to accepted v13, preserves animation parity plus explicit unchanged algorithm checks rather than falsely requiring dark theme literals. Cross-run geometry initially sampled stale replica sessions: CPU harness now waits each actual session.ready before queued render chains; no production timing/budget changes or timed-out skips. Old failure files/stdout are development history, superseded by SHA-matched reports listed below.

Actual GPU pixels/alpha edges, visual contrast, clipcheck, native-browser IME, drag/scroll p95 and next-painted-frame performance remain unverified. CPU settle timings include session ready/40ms quiet scheduling and are not click-to-painted-frame proof (some full-settle samples exceed120ms). Existing Blender/Moho/pinhole design artifacts remain v13 inputs; no new physical light render/contact sheet/GIF was generated for this palette-only stage. GPU verification helper now compares RGBA and reports transparentPixels/alphaAtCanvasOrigin, but it has not been hardware-executed.

## Minimal manual review
Open the Mac candidate directly, visit all10 tabs. Inspect calendar month/year/day/back, risk + independent selection/anchor rings, Board resource/alt/new-item forms, Plan what-if; check placeholder/caret/focus/scroll. View margins should show the containing light surface (not a dark slab); actual content panels remain white. Optionally set the host container to a temporary solid light tint manually to see transparent gutters; no checkerboard ships. Close forms and use existing Exp7Slabs.verify('vf-cal') / verify('vf-brd') if desired: diffPx0, hitDiff0, alphaAtCanvasOrigin0 and transparentPixels>0 expected; actual browser GPU required. Toggle reduced motion and visibility. No browser automation or settings changes were attempted. Parent decides promotion after review; do not reopen Mac-control setup.

## Reports / rerun
- theme_test_report.json
- slab_test_report.json
- motion_test_report.json
- original_cpu_regression_report.json
- cpu_app_allowed_report.json
- cpu_app_reduced_report.json
- cpu_app_no_matchmedia_report.json
- geometry_parity_report.json

Run sequentially in motion_v14 (Mac Node24.13.0, existing LinkeDOM test dependency only): python3 build_v14.py; node theme_tests.mjs; node slab_tests.mjs; node motion_tests.mjs; node original_public_regressions.mjs; MOTION_NO_MATCHMEDIA=1 node cpu_app_preflight.mjs; GEOMETRY_BASELINE=1 node geometry_parity.mjs; node geometry_parity.mjs. Shared primary CPU report must be saved under named mode when rerunning.
