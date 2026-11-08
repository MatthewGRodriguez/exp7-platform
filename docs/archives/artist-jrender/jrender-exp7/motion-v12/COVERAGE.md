# Exp7 motion v12 candidate - bounded implementation report

**Implemented:** original per-edge timing/easing and real scene lifecycle integration on accepted original core-wasm/browser-JS Exp7. **Not complete:** ambient/parallax are tested adapters only; the accepted demo has no original named depth-layer geometry to bind. Accepted v11 is not replaced. WASI/Boa work remains closed and untouched.

## What changed
- New ViewStates subclass composes accepted poses, exact original21 edge timings/easings, interruption, hidden/reduced lifecycle and optional depth offsets in native renderer patches.
- Scene callbacks execute the original action before any visual scheduling. Press60ms/release120ms; no click gating. Zero-distance states and settled scenes schedule no extra RAF unless an explicit original semantic pulse/glow or bound ambient requires a frame.
- Original core-wasm, fonts, node-id bands, all10tabs, algorithms/JGroup/model/ranking/controller/forms/storage remain unchanged. Only controller helper `calVsKick` is replaced; hash tests cover the rest. No rendering fallback or new decorative scene.
- The original shake endpoint residual is deliberately cleared. Same-input original/new geometry buffers0-3 match exactly through399ms; final identity-offset cleanup is tested separately.

## Executed evidence (exact embedded candidate)
| Evidence | Result |
|---|---|
| Targeted motion/edge/easing/interrupt/reentry/hidden/reduced/native-hit/lifecycle/source-preservation suite |140 checks pass |
| Original public renderer CPU groups |14 pass:400-round patch/rebuild,500-round hit/vertex differential (1222patch ops), scroll/clip/drag, text/rich text/wrap, glyphs,2000 editing operations |
| Full app CPU flow |20 checks pass in each of reduced, motion-allowed and missing-matchMedia modes; repeated modes are not60 unique checks |
| Original proposal selftest |17/17 in each app run |
| All ten tabs, calendar selection/day navigation, board form/TextEdit, binary two-writer merge, independent Best/Selected |Pass in CPU harness |
| Network |0 requests |

Single CPU samples, motion allowed: boot270ms; calendar selection6.0ms; day navigation29.0ms; real circuit76.9ms. These are NOT browser input-to-pixel timings or p95. The harness uses actual embedded renderer wasm and JS, but a CPU-only GPU command recorder, not actual WebGPU rendering.

Original debug-only tessellation fuzz, external legacy fixtures, optional external bold font, separate packer and full318 browser checks were not rerun. Exact adaptations/skips are in `original_cpu_regression_report.json`.

## Art pipeline / remaining gates
Reused original state/easing/ambient table, pipeline2 single AREA DISK light (azimuth90/elevation50/size300/distance600),85mm frustum parameters and existing Blender/Moho study references. No new light/pose/assets/caustic layer or speculative shading was authored. Existing art studies are provenance, NOT candidate screenshots or a new visual pass.

CPU-verified: ASCII/banned-word checks in shipped motion blocks; all click-path edges <=120ms; same-input unchanged cue parity; interrupt/reentry; hidden pause; reduced identity; no post-settle motion work; missing optional matchMedia; original phases/projection and native hit transform on an explicitly bound test layer. Config/table/diagram and packed counts are included.

NOT verified: candidate perspective/negative-camera/render sheets, new Blender/Moho comparisons/GIFs, actual GPU pixels/text contrast4.5/clipcheck, physical shadow fits, idle style-recalc rate, compositor ownership,1M-data frame p95, Apply100ms, input-to-next-frame120ms, desktop focus/IME/device-loss. No fresh GIF or visual artifact is fabricated.

**Conflict:** independently moving layers inside the GPU canvas cannot be CSS-compositor loops without moving the wrong hit/text/focus geometry or replacing the renderer. Explicitly bound ambient would require genuine scene RAF. It is disabled/unbound in this demo, so no idle ambient work is introduced. The original pipeline PX2/PX2b gate needs visible moving slab depths/sides; backdrop-only animation fails its negative gate. The accepted flat demo lacks those original slabs. A faithful visible ambient/parallax completion needs an original layer-to-geometry mapping (or an explicit design decision), not invented backgrounds.

## Desktop QA handoff (parent computerUse only)
Open `exp7-demo-motion-v12-candidate.html` locally. Compare accepted v11 side-by-side on a working WebGPU desktop: hover/leave120/180ms, press/release60/120ms, click action immediately, drag interruption/cancel, semantic selection/risk colors, shake final return, keyboard/focus/textarea/IME, calendar year/month/day/back/full-text cells, Board resources/alts/forms and Plan what-if. Toggle reduced motion, hide during an edge, return and verify continuity/no extra motion RAF after settling. Run existing JRViews selfTest/verification with hardware. Inspect `Exp7Motion.frames`, `patches`, `ambientBindings` (expected0) and `config`; no visible ambient/parallax is promised. Measure actual pixel latency/recalc/p95 and visual gates before considering cutover.

## Source/provenance
Authoritative Mac JRender based on9a7465c02cf05c9c22d7c11e9c377adf6b7ddfe4; all new files isolated in `motion_v12/`. JEditor Lore111 remains unchanged (remote100); no new source provider/repo/mirror/push. See `REVISION.json` for final local commit and candidate SHA. All accepted/WASI experiments preserved byte-for-byte. No user-world/livingcore/ranking_ui/port8765/8791 changes. No active background jobs remain after tests178172 and178173 completed.
