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
