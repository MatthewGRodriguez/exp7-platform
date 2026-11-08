# JRB v0: JRender Binary scene format

Little-endian. No strings at runtime: names live only in an optional, strippable section. The format is versioned and readers skip unknown sections. Reference reader: `runtime/src/jrb.rs`. Reference writer: `compiler/jrbc.py`.

## Header (16 B)
| off | type | field |
|---|---|---|
| 0 | u8[4] | magic `JRB\0` |
| 4 | u8 | version (0, 1 or 2; v1 adds open subpaths, LAYERS, TIMELINE, DATA; v2 adds node kind 4 and robust fills) |
| 5 | u8 | flags (bit0: has state table) |
| 6 | u16 | Q = quant steps per user unit (64, so 1/64 unit, about 0.06 CSS px at 1440 px wide) |
| 8 | f32 | viewBox width |
| 12 | f32 | viewBox height |

Primitives: `uv` is a LEB128 varint. `sv` is a zigzag varint. `f32` is IEEE little-endian.

Sections are repeated as `u8 tag, uv length, payload`.

## 1 PATHS: string-free path table
- `uv npaths`. Each path is `uv nsub`, then one record per subpath:
  - `uv nverbs`
  - verbs packed 2 bits each, LSB first: 0 line (1 point), 1 quad (2 points), 2 cubic (3 points)
  - points: start point, then each verb's points, all as `sv dx, sv dy` in Q units, delta from the previous point. The delta chain restarts at (0,0) for each path.
- Subpaths close implicitly (fill only).
- Identical paths are deduplicated: the room's left-wall group, which is drawn twice, is stored once.
- Curves stay as curves. The runtime flattens them at draw scale to a 0.2 device px tolerance, so detail scales with DPR and zoom.

## 2 PAINTS
- `uv n`. Each paint starts with `u8 type`:
  - type 0 (solid): `rgba8`
  - types 1 (linear) and 2 (radial):
    - 4 params as `f32`: linear `x1 y1 x2 y2`, radial `cx cy r 0`
    - `f32[6]` gradient matrix: the svg `gradientTransform`, with objectBoundingBox already resolved
    - `u8 nstops` (12 or fewer), then for each stop `u16 offset/65535` and `rgba8`
- Paints are evaluated per pixel in WGSL, with unpremultiplied sRGB interpolation, which is what SVG does.

## 3 NODES: layer and transform tree
- `uv n`, in preorder. Each node is `u8 kind, u8 flags, uv parent+1` (0 means no parent). If flags bit0 is set, an `f32[6]` local transform follows.
- Node 0 is the root.
- Nodes with no parent other than node 0 are defs, such as pattern tiles and `use` targets.
- Node kinds:
  - **0 group**: `u8 def`
  - **1 fill**: `uv path, uv paint`
  - **2 pattern fill**: `uv clipPath, uv tileGroup, f32[6] patternTransform, f32 tileW, f32 tileH`. The tile is clipped to its cell and to the clip path, and the runtime expands it into geometry. It is never rasterized into a texture, so there is no resampling blur.
  - **3 use**: `uv targetNode`
  - **4 fill with rule** (v2): `uv path, uv paint, u8 rule` (rule 0 nonzero, 1 even-odd). All subpaths of the path are filled together, so holes work with either rule. Tessellated on the CPU by the trapezoid tessellator (`runtime/src/tess.rs`); no stencil pass.

## 4 STATES: element state machine (from pipeline2 `states.json`)
- **Easings**: `uv ne`, then `ne` entries of `f32[4]` cubic-bezier, in order `out, inout, soft, overshoot, linear`.
- **States**: `uv ns`, then `ns` entries of `f32 lift(px), f32 tilt(deg), f32 scale, f32 opacity, u8 ring`. The ring is 0 none, 1 focus, 2 gold, or 3 caution.
- **Transitions**: `uv nt`, then `nt` entries of `u8 from` (255 means any), `u8 to`, `u8 event`, `u16 ms`, `u8 easing`, `u8 click_path`.
  - Events: 0 pointerenter, 1 pointerleave, 2 pointerdown, 3 pointerup/click, 4 focusin, 5 focusout, 6 keydown, 7 keyup, 8 cancel, 9 select, 10 dragstart, 11 drop.
- **Subjects**: `uv nsubj`, then for each subject `f32 x y w h r` (rounded-rect hit region and body in user units) and `u8 initial state`.
  - v0 has a single subject. v1 binds subjects to node ids, with any path as the hit region.

## 5 TIMELINE (v1)
`f32 dur_ms, uv n_eases, (f32 x1 y1 x2 y2)*, uv n_tracks, track*`; track = `str layer, u8 prop (0 rotateY deg, 1 scale, 2 opacity, 3 rotate deg), uv n_keys, (f32 offset 0..1, f32 value, u8 ease)*`.
Evaluated with CSS keyframe semantics (the ease of a key applies to the segment that starts at it). The coin's 8 s loop is the only looping timeline; it runs only while the tab is visible and not under reduced motion. There is no looping shine on glass.

## 8 LAYERS (v1)
`uv n, layer*`; layer = `str name, u8 flags, uv n_items, item*`; item = `u8 kind (0 nonzero fill, 1 even-odd fill, 2 stroke), uv path, uv paint, [kind 2: f32 width, u8 cap, u8 join]`.
Layers are what rigs (coin, fish) transform per frame. Note: layer names are strings at runtime in v1 (rigs look layers up by name); a later version can swap them for indices.

## 9 DATA (v1)
`uv n, (str name, u8 type, payload)*`; type 1 = string, otherwise `uv count, f32*`. Rig constants (perspective, fish skeleton, turn keys, sizes) live here.

## v1 path change
In PATHS, each subpath's verb count is stored as `nv << 1 | closed` so strokes can be open.

## JRBX bundle
`"JRBX"` then repeated `u8 role (0 room, 1 coin, 2 fish), u32 LE length, JRB bytes`. The runtime accepts a plain JRB or a JRBX.

## 6 HIT (reserved)
Path-based hit regions. In v0 they live inside STATES.

## 7 NAMES (optional, debug)
Newline-joined node names. The runtime skips this section, and `jrbc.py` writes it only with `--names`.

## Host ABI (core wasm exports; no wasm-bindgen, no WASI imports)
| export | purpose |
|---|---|
| `jr_alloc(n)` | gets a pointer to an n-byte input buffer; the host copies the `.jrb` bytes there |
| `jr_init(w, h, dpr, reduced)` | parses and tessellates; returns 0 on success |
| `jr_resize(w, h, dpr)` | handles a resize |
| `jr_pointer(kind, x, y)` | pointer input; kind is 0 move, 1 down, 2 up, 3 leave |
| `jr_reduced(on)` | switches reduced motion |
| `jr_frame(t_ms)` | advances animation |
| `jr_visible(on)` | page visibility; hidden stops time (coin pauses, fish freezes) |
| `jr_seek(ms)` | test only: sets the coin timeline time |
| `jr_ptr(k)`, `jr_len(k)` | buffer access: 0 static vertices, 1 dynamic vertices, 2 paints (20 vec4 each), 3 uniform, 4 WGSL source, 5 layer table (20 f32 per layer), 6 draw list (u32 x4: kind, first, count, 0) |
| `jr_aspect()` | aspect ratio of the scene |

- Return bits from the input and frame calls:
  - 1 static dirty, 2 dynamic dirty, 4 paints dirty, 8 uniform dirty
  - 16 needs a frame or is animating
  - 32 cursor changed, 64 cursor is a pointer, 128 layer table / draw list dirty
- The host only requests `requestAnimationFrame` while bit 16 is set, so an idle scene does zero work.
- Vertex layout (v1, 32 B): `f32 x, f32 y` (user units), `u32 id = paint | layer << 20`, `f32 alpha`, `f32 ex, ey` (stroke extrude direction), `f32 hw` (stroke half width), pad.
- Draw-list kinds: 0 static direct, 1 nonzero fill, 2 even-odd fill, 3 stroke (1-3 are stencil-then-cover), 4 dynamic direct.

## Measured sizes
These were measured, not estimated, with compiler commit 1.

| scene | SVG raw / gz / br | JRB raw / gz / br |
|---|---|---|
| room (`room.svg`, plus button states in JRB) | 9,961 / 3,323 / 2,824 | 6,762 / 3,335 / 2,825 |
| UI slab (pipeline2 `parts.svg`, cubic rrects, plus states) | 2,620 / 820 / 673 | 1,133 / 524 / 512 |

- Raw size drops 32-57%.
- After gzip or brotli, the room ties with SVG, because the SVG's repeated chip text compresses very well. The UI slab wins by 24-36%.
- The JRB room also carries 394 B of state table that the SVG does not have.
- Next wins, listed in PLAN M1: per-path Q (the tile chips are integer, so Q=1 would save about 1.2 KB), 1-byte palette indices for repeated solids, and delta-coded pattern matrices.

## Dist container (M3): no gzip anywhere
`dist/jrender.html` is one file with no outer compression. Everything except a ~1.4 KB plain bootstrap is coded with **JRP**, our own codec:
- **JRP stream:** `u32 length` + arithmetic-coded body (12-bit probabilities). Model: lpaq-style bitwise context mixing, integer-only so the encoder (`pack/`, native) and the decoder (stage0 wasm) agree bit for bit. 9 hashed contexts (orders 0-4, 5, 6, a stride-4 lane, sparse) plus a match model (min 6, 2^18 hash). Two mixers and an order-1 APM. Tables are 2^18 entries per context (~9.4 MB transient, freed by `reset()`). Every payload is roundtripped at build time (`jrpack c` asserts decode(encode(x)) == x).
- **stage0:** `pack/` built `no_std` for wasm32, with no allocator. Exports `buf`, `unpack`, `len`, `reset`, `memory`. Profiles (env `JRP_PROFILE`): `fast` (default, opt-level 3, 7,585 B) or `small` (opt-level s, 3,855 B, about 30 ms slower unpack in Chrome).
- **b7 text:** bytes are stored as 7 bits per ASCII char inside `<script type="text/plain">`. The 7-bit values 0, 13 and 60 (NUL, CR, '<') ride in one char `0x100 + (k<<7) + next7`. Lengths are passed explicitly.
- **Blob (`#p`):** `u8 N`, `N x u32` stream lengths, then N JRP streams:
  0 page glue JS, 1 wasm without the code-section body, 2 code opcodes, 3 local indices (0x20-0x24), 4 memargs (0x28-0x3e), 5 call targets (0x10/0x11), 6 constants (0x41-0x44), 7 misc (function count, body sizes, locals, other immediates), 8 scene (JRBX).
  - The wasm split is lossless and byte-for-byte: immediates keep their original LEB bytes.
  - `tools/wasm_unsplit.js` (shipped inside payload 0) rebuilds the code section; the build checks it in node against the original wasm.
  - The split saves 2.5 KB over one stream. Splitting ops from all immediates was worse (36.3 vs 33.9 KB), so immediates are split by kind.
- **Bootstrap:** decodes `#s` and instantiates stage0, decodes payload 0 and runs it as an async function with `un(i)`. The glue starts `WebAssembly.compile` on the rebuilt wasm, then unpacks the scene while it compiles.
- **Rejected (measured):** a byte-plane transpose of the scene (+21%, since the stride-4 context already models it), a names-to-ids string table, path predictors, and one shared stream for wasm+scene (+0.3 KB).

## v2 (Exp7): backward-compatible additions
- Readers accept versions 0, 1 and 2. v0/v1 files decode and render exactly as before (byte-identical vertex buffers, checked with `tools/exp7/legacy_dump.mjs`).
- Node kind 4 (above). A v0/v1 reader rejects kind 4, so writers emit version 2 only when they use it.
- Robust fills: in a v2 scene, a simple fill whose ear clipping stalls or does not cover exactly the polygon's area (collinear, duplicate,
  self-touching or self-intersecting points) is filled through the trapezoid tessellator instead (nonzero rule). In v0/v1 the old
  behaviour is kept bit for bit: the stalled remainder is not drawn. The shipped room has one such polygon (0.003 unit^2, sub-pixel).
- Host ABI: `jr_ptr(k)`/`jr_len(k)` return 0/0 before `jr_init` (except k = 4, the WGSL source); every other `jr_*` call is a no-op
  returning 0 before init. Legacy scenes by handle (full build only): `jrs_new(w, h, dpr, reduced)` parses the `jr_alloc` buffer and returns
  a handle > 0 (0 on error); `jrs_free, jrs_aspect, jrs_resize, jrs_pointer, jrs_frame, jrs_visible, jrs_clicks, jrs_ptr, jrs_len` take the
  handle first and otherwise match the `jr_*` calls.

## DL v1: draw lists (Exp7)
UI content (tables, lists, boards, calendars) as a flat little-endian u32 word stream. Floats are f32 bit patterns. Colours are u32
`r | g<<8 | b<<16 | a<<24` (straight alpha; the shader premultiplies). Units are CSS px of the scene; y down.
- Header: `"JRDL"` (0x4c44524a), `u32 version = 1`. Then ops; each op is a header word `op<<24 | nwords` followed by `nwords` payload words.
  Readers must reject unknown ops (the whole list is rejected, the scene stays unchanged); later versions bump the version word.
- Structure ops:
  - `0x01 NODE`: `id, flags [, f32 a b c d e f]` (the 6 floats are present iff flags bit 3 XF). id 0 = anonymous (not patchable, not hittable by id).
    Node flags: 1 HIT (bbox is the hit region), 2 HIDDEN, 4 MOVE (send move events), 8 XF. Following item ops belong to the node.
  - `0x10 GROUP`: `id, flags, f32 x y w h, f32 contentW contentH`. A clip (and scroll) region; children until `0x11 END`.
    Rect is in the parent's content space; children are relative to the group's top-left minus its scroll offset. Clip is snapped to device pixels.
    Group flags: 1 scroll x, 2 scroll y. Groups nest; the clip is the intersection with the parent's clip.
  - `0x11 END` (no payload).
- Item ops (inside a node):
  - `0x02 RECT x y w h rgba`; `0x03 RRECT x y w h r rgba`; `0x06 BORDER x y w h r width rgba` (inner edge inset by width)
  - `0x04 PATH rule rgba verbs...`: rule 0 nonzero / 1 even-odd; verbs are `0 M x y`, `1 L x y`, `2 Q cx cy x y`, `3 C c1x c1y c2x c2y x y`, `4 Z`
    (verb word then its f32 points). All subpaths are filled together (holes).
  - `0x05 TEXT x baseline size rgba font maxw align flags n cp*`: vector text from a JRF font; `align` 0 left, 1 centre, 2 right within `maxw`;
    flags bit 0 = ellipsis when wider than `maxw`; `n` codepoints follow (u32 each).
  - `0x07 HIT x y w h`: explicit hit rectangle for the node (in node space, transformed by the node transform).
- Paint order is document order (depth first). Hit testing is reverse paint order, clipped by the group clips.

## JRDP v1: patches
`"JRDP"` (0x5044524a), `u32 version = 1`, then ops (same header word). A patch is parsed completely before anything is applied; a malformed
patch returns a negative code and changes nothing. Ops that name a missing id (or would create a duplicate id) are skipped and counted.
- `0x20 REMOVE id` (node or group, with its children)
- `0x21 INSERT before` content... `0x2F`: insert nodes/groups before the node or group `before` (0 = append at the root)
- `0x22 APPEND gid` content... `0x2F`: append into group `gid`
- `0x23 REPLACE id` items... `0x2F`: new items (geometry, paint) for a node; a HIT item inside replaces its hit rect
- `0x24 XFORM id a b c d e f` (re-tessellated at the new scale), `0x25 SCROLL gid x y` (clamped), `0x26 FLAGS id flags`,
  `0x27 COLOR id rgba` (rewrites the colour words of the node's vertices in place, no re-tessellation), `0x28 GRECT gid x y w h cw ch`

## JRF v1: vector fonts (no atlas)
`"JRF\0"`, `u8 version 1`, `u8 0`, `u16 upm`, `i16 ascender`, `i16 descender`, `u16 Q` (coordinate quantum per font unit), `uv nGlyphs`;
glyphs sorted by codepoint: `uv cp delta`, `uv advance*Q`, `uv nSub`; sub: `uv nVerbs`, verbs 2 bits each LSB first (0 line, 1 quad, 2 cubic),
then the points as zigzag `sv dx dy` deltas (Q units, y up; the delta chain restarts per glyph). Glyph outlines are triangulated in wasm
(nonzero) per tolerance bucket and cached; `web/dejavu.jrf` (DejaVu Sans subset, 140 glyphs, 10,988 B) is built by `tools/exp7/mkfont.mjs`.

## Exp7 v2 additions (backward compatible; old streams parse and render identically)
- DL item `8 TEXTBOX x y size rgba font maxw align flags lh maxl n cps...` (f32 x y size maxw lh; u32 others). align 0 left / 1 center / 2 right; flags bit1 ellipsis, bit2 wrap; lh 0 = 1.25*size; maxl 0 = unlimited; maxw <= 0 = no wrap. Greedy word wrap, `\n` hard break, overlong words break by character, trailing spaces trimmed, ellipsis replaces the tail of the last allowed line.
- HIT semantics (one source of truth, patch == fresh load): a node is hit-testable iff NF_HIT is set; a HIT item sets NF_HIT; the hit rect is the explicit HIT rect, else the node bounds. `REPLACE` resets the hit rect to the new item list's HIT (none = bounds). `FLAGS` without NF_HIT clears the explicit rect.
- `0x29 REPLACE_F id flags` items... `0x2F`: REPLACE that also sets node flags. `0x23 REPLACE` unchanged (keeps flags).
- `0x2A COLOR_ITEM id index rgba`: recolour item `index` (0-based over drawable items; HIT items not counted) in place. Bad index = skipped (counted).
- JRF: the parser appends a notdef glyph (hollow box, advance 0.6 em) used for any missing codepoint in both measure and draw; control chars (<32, 127) are zero-width. `web/dejavu.jrf` now covers ASCII + Latin-1 + common punctuation + arrows (243 glyphs, 22,193 B; basic font kept as `dejavu_basic.jrf`, 10,988 B).
- New exports: `jrd_has_glyph(font,cp)`, `jrd_glyph_cp(font,i)`, `jrd_wrap(font,size,maxw,maxl,ell)` -> line count, records at `jrd_wrap_ptr()` (4 x u32: start, end, ellipsis, width f32), `jrd_scroll_at(h,x,y)` -> group id or 0xFFFFFFFF.

## WASI / target verification (2026-11-06, corrected)
Shipped builds use `wasm32-unknown-unknown` with **zero imports** (measured). Host ABI above remains authoritative for the shipped artifact.

- `wasm32-wasip2` = **WASI 0.2** (Preview 2), component-model container. Not WASI 0.3.
- `wasm32-wasip3` = **WASI 0.3** target (nightly std as of this date). Spike artifact imports `wasi:clocks@0.3.0`.
- Bare `WebAssembly.instantiate` rejecting component version `0x0001000d` is **expected**; use a component host (e.g. Wasmtime) instead.
See EXP7_JRENDER_COMPARE.md ?9 and `wasi03_spike/README.md`.
