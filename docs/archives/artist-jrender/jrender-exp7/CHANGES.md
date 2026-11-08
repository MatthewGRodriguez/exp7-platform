# JRender Exp7 changes

Backup before any change: /workspace/td/jrender/repo_pre_exp7.

1. **Filled paths with holes, even-odd and nonzero:** new scanbeam trapezoid tessellator (runtime/src/tess.rs), f64, never panics. JRB v2 kind 4 fill gets a rule byte, and DL paths take `evenodd`. Tested on o 8 a B Q at 10/16/48 px (area error at most 3e-8) and as rasters at 16 to 96 px (correct hole counts).
2. **Robust ear clipping:** `geom::ear_robust` uses a scale-relative epsilon and an f64 clip, sends any stalled remainder to tess, and checks the area afterwards: if any area is missing, the whole polygon is redone with tess. A fuzz of 10,000 polygons (convex, concave, self-intersecting, degenerate) gave 0 traps, 0 failures and a max relative area error of 1.8e-8. It applies only to JRB v2 and DL, so v0/v1 legacy scenes keep the old clipper (needed for pixel identity).
3. **Hit ids and event queue:** per-node ids with HIT flag and optional hit rect. Queue records are (kind, id, x, y, buttons). Events: enter/leave (hover), down/up/click, move, wheel, scroll, key, cancel (a drag turned into a scroll). Topmost first, hidden nodes skipped.
4. **Nested scroll/clip groups:** nested clipping, wheel, mouse drag and touch drag scrolling (with a slop and then a cancel event), clamped to the content size. The offset can be read with `jrd_scroll_x/y` / `scrollPos` and set with `jrd_scroll` or a patch. Pixel test: 0 bleed at dpr 1 and 2, nested.
5. **Incremental patches by id:** replace, color, xform, flags, hit and group ops, plus insert and remove. Vertices live in a slot arena; colour and xform changes are done in place, and only the dirty vertex range is uploaded. Compaction runs on demand. Patch equals full rebuild: 400 random rounds with 0 mismatches (buffers), and 0 diff pixels on GPU.
6. **Multiple scenes per instance:** DL scenes by handle (`jrd_create`) and legacy scenes by handle (`jrs_new`). The Renderer draws several scenes in one pass. Isolation tested in Node and on the GPU (0 diff after free and after creating a new scene).
7. **jr_ptr / jr_len before init:** they return 0 and no longer panic (tested).

**Vector text with no atlas (your draw list design):** it fit, and it is implemented as the main path. JRF v1 font (glyph outlines from the bundled font, tessellated in wasm with tess). measure, fit and ellipsis are cheap and work without the GPU.

## Legacy identity
- Pixels: pre vs new dist for jrender.html and jrender_ios.html at 800x600@1, 1280x800@2 and 390x844@3: **0 diff pixels in all 6 cases**. Against the m3 goldens: 0 diff at 800x600 and 390x844. At 1280x800@2 the pre build differs from the golden by the same amount as the new one (1.73M px), so that golden was captured differently and this is not a regression.
- Buffers: a full dump of the legacy buffers (6 scenes x 3 sizes x frames + pointer + resize, 31.2 MB) is identical across pre, new dist, full_small and full_fast (sha 64eae8a5).
- dist rebuilt. jrender_ios.html is printable ASCII + LF and round-trips through base64. jrender.html keeps the same byte-packing as before (it already had non-ASCII bytes before this work), and paydec still decodes it.

## Not done / caveats
- The Renderer in jrender.js does not draw legacy JRB scenes. The legacy pages keep their shipped glue, and jrs_* handles exist in wasm but have no JS drawing wrapper yet.
- The tessellator makes many triangles for text (scanbeam trapezoids, about 30 triangles per glyph at small sizes). Merging into monotone chains would cut this 2 to 3x. Culling keeps memory bounded for now.
- jr_resize traps for the coin scene. This was already in the pre-exp7 build and was left unchanged to keep legacy identity.
- The dist *.b64 files are stale from Nov 2, which was already true before this work.
- No WebGL2 fallback, as requested.
- The timings come from headless Chrome on the box, not from a phone.

## v2 (2026-11-03) - Ash's 9 API issues
1. Stale hit regions fixed (unified HIT semantics); property test: 500 random patch sequences (1,222 ops), hit() on a 54x54 grid vs fresh load: 0 mismatches; Ash's t2.mjs: all 6 cases equal fresh.
2. `REPLACE_F 0x29` carries flags; `0x23 REPLACE` unchanged.
3. `COLOR_ITEM 0x2A` recolours one item in place (test: equals fresh load, dirty range only that item).
4. `GPUContext` shared device/shader/pipelines; browser test: 2 canvases, 1 pipeline build, destroying one keeps the other drawing.
5. Init errors with codes; tested with stubbed navigator.gpu (4 cases).
6. attach idempotent + detach, cursor from current hit state, touch-action default `pan-x pan-y` with targeted preventDefault; demo CDP touch scroll still works (dpr 1 and 2).
7. Classic IIFE build (26,462 B) + embed.py (basE91/base64); loaded from a data: URL in headless Chrome: global JRender, b91 wasm+font decode, wasm wrap OK (no WebGPU in data: by spec).
8. Wasm word wrap + TEXTBOX; 1000-line paragraph (55,889 chars, 3,000 lines): 6.2 ms JIT, 6.4 ms liftoff-only, 10.2 ms with --no-opt.
9. notdef glyph, has_glyph/coverage, font extended to Latin-1 + punctuation + arrows: +11,205 B raw (22,193 B total).
Sizes: full_small 193,377 B, full_fast 234,916 B, dist 130,698 B (unchanged, sha 58205715). Old scenes: 0 pixel diff in all 6 legacy configs, buffer dump sha 64eae8a5 unchanged.

## v3 (2026-11-05) - drag, rich text, text input, small canvases, audit
1. **Drag.** Event record is now 12 words: kind, id, x, y, buttons, a, b, code, vx, vy, pointerId, mods (MOD SHIFT 1, CTRL 2, ALT 4, META 8). New kinds DRAGSTART 12, DRAG 13, DRAGEND 14 (code 1 = cancelled). Opt-in per node with `NF.DRAG` (16); `scene.dragThreshold` (CSS px, default 4). **Behaviour change:** UP is delivered to the node that got DOWN (capture), not the node under the pointer; attach() uses setPointerCapture, `lostpointercapture` -> cancel. Pointer coordinates are mapped by canvas.width / rect.width, so CSS-scaled canvases hit correctly. Touch: only the primary touch pointer drives; while one pointer is captured other ids are ignored. Touch policy: CSS `touch-action: pan-x pan-y`; touchstart preventDefault only over a scroll group or an NF.DRAG node (`touchHits: true` blocks over any hit node).
2. **Rich text.** `DL.richText(x, y, runs, {maxw, lineHeight, align, boldFont})`, runs = `{text, size, color, font, style}` with `RS` BOLD 1, ITALIC 2 (shear), UNDERLINE 4, STRIKE 8, CHIP 16 (rounded background, `chipColor`, optional `id` makes the chip a hit region). `core.richLayout()` returns lines, frags and per-run rects. Bold: real DejaVu Sans Bold subset `fonts/dejavu_bold.jrf` (22,173 B, made by tools/mkbold.py) when `boldFont` is given, otherwise synthetic emboldening. Ink per px in test: regular 3.15, synthetic 4.32, real bold 6.3.
3. **Text input.** `TextEdit` (pure model: grapheme-aware caret/selection via Intl.Segmenter with fallback, word moves, maxLength in graphemes, undo/redo with typing coalescing, IME composition) and `TextField` / `attach().textField(scene, o)`: one shared hidden textarea per renderer (data-jrender="textfield"), clipboard via native copy/cut/paste events, IME via composition events, aria-label/role from options, password masking (data-type + -webkit-text-security), caret blink 530 ms (solid with reduced motion). Tab onto the canvas focuses the first field.
4. **Small / narrow canvases.** Root cause in the demo app: canvas backing store set to `Math.max(560, ...)` while CSS `max-width:100%` shrinks it (391 CSS px at a 900 px viewport) - the picture is downscaled and pointer coordinates were off by 560/391; plus the replica `<details>` is re-rendered closed. Library fixes: pointer mapping by scale, `resize()` with 0/NaN size hides instead of creating zero textures, `draw()` skips while hidden, new `renderer.autoSize({element, onresize, maxDpr, dprScale})` (ResizeObserver, device-pixel-content-box when it agrees with css x dpr, DPR change via matchMedia, starts hidden until first real size, returns stop()). Advice for the demo: drop the 560 clamp (or scale the scene to the box) and keep `details.open` across re-renders.
5. **Audit / robustness.** Device loss: `renderer.ondevicelost` + canvas event `jrender-devicelost` (code 'device-lost'), draws skipped while lost, `gc.recover()` / `renderer.recover()` rebuild everything (test: pixels after recover = before, 0 diff). Missing WebGPU / bad wasm give plain errors with code `no-wasm` / `bad-wasm` / existing gpu codes. **Coin/fish jr_resize trap fixed:** `State::resize` tessellated the room node 0 for scenes with no room nodes (coin, fish) -> bounds panic. Guarded with `!sc.nodes.is_empty()`. All other legacy buffers byte-identical (dump with the resize step of coin/fish skipped: 64eae8a5 for old dist, new dist, full_small, full_fast); full dump now 1cce1011 (it contains the coin/fish resize data that used to be "resize-trap"). dist/*.html were NOT rebuilt; they still embed the old dist wasm (sha 58205715), so their pixels are identical by construction. wasm/jrender_dist.wasm is the old one; wasm/jrender_dist_fixed.wasm (130,710 B) has the fix.

Not verified (no hardware here): real Safari WebGPU (alphaMode, getCurrentTexture timing), real pointer capture outside the canvas (synthetic events report hasPointerCapture false), multi-finger touch on devices, mobile on-screen keyboards and real IME candidate windows, screen readers, DPR change on real monitors (only the media query path was exercised).

## v4 (2026-11-06) - Exp7 ViewStates + whole-project compare
- **ViewStates** (real Exp7 semantics, ADR 0082/0089): `view.states[name] = { bg, border, sm, anim }` with `anim` in `none|pulse|shake|glow` and `sm` = JMotion pose name. JS binder patches DL nodes (color/xform). Exports: `ViewStates`, `ANIM`, `POSES`, `SMNAME`.
- **Retain** JRB Machine for fish/coin/button (quality). Bare `coin.jrb`/`fish.jrb` are room-role only; use `scene.jrbx` for fish+coin.
- **Artist fixes:** richText `lineHeight` is a factor; values >4 treated as absolute px / max-run-size. TextField textarea defaults `opacity:0.01`, high z-index (Safari focus).
- **asm_demo.html:** risk cards, button SM mapping, clock pulse/glow, circuit->proposal->state.
- **WASI:** shipped path remains core `wasm32-unknown-unknown` (0 imports). **`wasm32-wasip2` = WASI 0.2** (not 0.3). Actual WASI 0.3 spike under `wasi03_spike/` via nightly `wasm32-wasip3` (WIT imports `wasi:clocks@0.3.0`); core twin pose equiv PASS; component `sm_*` export world not lifted yet. Bare browser `WebAssembly` rejecting components is expected. No ship migration this round. See EXP7_JRENDER_COMPARE.md ?9.
- **ViewStates honesty:** bridge subset of Exp7 `view.states` (`{bg,border,sm,anim}` + named poses + fixed edgeMs) -- not full JMotion edge table/ambient/parallax.
- Node tests **28/28**. Legacy pixels: see tests (dist HTML not rebuilt; pages still embed sha 58205715 wasm).
