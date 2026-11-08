# JRender Exp7 API

## Builds
| file | contents | size before | size after |
|---|---|---|---|
| wasm/jrender_dist.wasm | legacy runtime (coin, fish, room) shipped in dist/*.html; opt s, wasm-opt -Oz | 115,624 B | 130,698 B (+15,074 from the robust fill path and the jr_ptr guard) |
| wasm/jrender_full_small.wasm | legacy + draw list (DL) + vector text + jrs_* handles; opt s | n/a | 188,604 B |
| wasm/jrender_full_fast.wasm | same as above, opt 3 + wasm-opt -O3 | n/a | 231,596 B |
| dist/jrender.html / jrender_ios.html | shipped single pages | 106,618 / 124,853 B | 111,687 / 130,439 B |

Build: `tools/build_runtime.sh` (all three wasm files), `tools/build_dist.py` (dist), `web/exp7/build_pages.py <src.js> <out.html> <title> [wasm]` (single-file pages with inlined base64 wasm and font, checked to be ASCII).

## jrender.js (ES module, ASCII, no dependencies)
- Constants: `EV` (ENTER 1, LEAVE 2, DOWN 3, UP 4, CLICK 5, SCROLL 6, WHEEL 7, KEYDOWN 8, KEYUP 9, MOVE 10, CANCEL 11), `EVNAME`, `NF` (HIT 1, HIDDEN 2, MOVE 4, XF 8), `GF` (SCROLL_X 1, SCROLL_Y 2), `F` (scene dirty flags), `rgba()`, `hex()`.
- Builders: `DL` (scene: node, rect, rrect, border, path with `evenodd`, text with {maxw, align, ellipsis}, group(rect, content size, flags) ... end) and `Patch` (replace, color, xform, flags, hit rect, group rect / scroll, remove, insert). Both produce the binary formats in format/JRB.md (DL v1, JRDP v1).
- `Core` (no GPU, also works in Node): `Core.create(wasm)`, `font(bytes)` (JRF v1), `measure(text, size, font)`, `fit(text, size, maxw, ellipsis)`, `metrics(font)`, `createScene(w, h, dpr)`, `wasmBytes()`.
- `DLScene`: `load(dl)`, `patch(p)`, `resize(w,h,dpr)`, `scroll(gid,x,y)`, `scrollPos(gid)` -> [x,y], `hit(x,y)` -> id|null, `pointer(kind,x,y,buttons)`, `wheel(x,y,dx,dy)`, `key(down,code)` (each returns the events it caused), `events()` (poll and clear queue: {kind,type,id,x,y,buttons}), `onevent`, `oncursor`, `compact()`, `flags()`, `buf(k)`, `free()`.
- `Renderer`: `init({canvas, wasm, device?, clear, readback?})`, `resize(cssW, cssH, dpr)`, `createScene(w,h)`, `layout([{scene,x,y,w,h}])`, `draw()` (one pass; viewport and scissor per scene; one draw per contiguous vertex range), `attach()` (pointer with capture, wheel, touch via pointer events, keys, cursor), `read()` (readback), `memory()` -> {gpuBytes, gpuPeak, wasmBytes}, `destroy()`. WebGPU only (no WebGL2 fallback, as agreed).

## Wasm exports
Legacy (unchanged signatures): `jr_alloc jr_init jr_aspect jr_resize jr_reduced jr_seek jr_visible jr_pointer jr_frame jr_clicks jr_ptr jr_len`. `jr_ptr`/`jr_len` now return 0 before `jr_init` instead of panicking.

Multi-instance legacy (full builds): `jrs_new(w,h,dpr,reduced)->handle (0 = fail)`, `jrs_free jrs_aspect jrs_resize jrs_pointer jrs_frame jrs_visible jrs_clicks jrs_ptr jrs_len` (same meaning as jr_*, plus a handle).

Draw list (full builds): `jrd_alloc(n)` (input buffer), `jrd_create(w,h,dpr)->handle`, `jrd_free`, `jrd_load(h)`, `jrd_patch(h)`, `jrd_resize`, `jrd_compact`, `jrd_pointer(h,kind,x,y,buttons)`, `jrd_wheel(h,x,y,dx,dy)`, `jrd_key(h,down,code)`, `jrd_scroll(h,gid,x,y)`, `jrd_scroll_x/y(h,gid)`, `jrd_hit(h,x,y)` (0xFFFFFFFF = none), `jrd_flags`, `jrd_clean`, `jrd_events_clear`, `jrd_ptr(h,k)`/`jrd_len(h,k)` (k: verts, dirty range, groups, ranges, events), `jrd_font`, `jrd_measure`, `jrd_fit`, `jrd_font_metrics`, `jrd_mem_pages`. Test hooks: `jrt_tess jrt_ptr jrt_ear jrt_ear_ptr`.

## Errors
`jrd_load` / `jrd_patch`: 0 ok, -1 bad magic/version/length, -2 malformed op (the whole patch is rejected, scene untouched), -3 unknown handle. Duplicate node ids in an insert are skipped and counted. `jrd_font` -1 = bad font. `jrd_measure` -1 = unknown font. Nothing panics on bad input (fuzzed).

## Memory and performance (headless Chrome on the box)
- Demo page (requirements table + 400-row scroll list + board + glyphs), after culling: dpr 1: wasm 36.0 MB, GPU 24.0 MB peak; dpr 2: wasm 36.1 MB, GPU 56.2 MB peak (mostly the MSAA 4 colour target, 16 B per device px). Before culling it was wasm 271 MB, GPU 97 / 161 MB.
- GPU test page, 400 text rows: load 10.9 ms, patch + draw 0.15 ms, draw only 0.007 ms, 154k verts, GPU 9.6 MB, wasm 10.4 MB.
- JS per frame in the animated demo: 0.15 ms (dpr 1), 0.17 ms (dpr 2). Per frame JS is: read flags, writeBuffer of the dirty range, one render pass.
- Node: wasm memory 9.8 MB for the test scenes.
- Culling: nodes further than half a viewport outside their clip are not tessellated; nodes more than 1.5 viewports away are evicted, and tessellated again when they scroll near. Hit testing uses estimated bounds, so it works for nodes that are not tessellated.

## v2 additions (after Ash's demo remake)
- **Text:** `DL.textBox(x,y,size,c,font,str,maxw,{align:'left'|'center'|'right',ellipsis,lineHeight,maxLines})`; `core.wrap(font,size,str,maxw,{maxLines,ellipsis,lineHeight})` -> `{count,height,lineHeight,lines:[{start,end,ellipsis,width,text}]}` (wasm, same code path as drawing). `core.hasGlyph(font,cp)`, `core.coverage(font)` -> sorted codepoints. Missing glyphs draw a notdef box whose advance is also used by measure.
- **Patches:** `Patch.replace(id, fn, flags?)` (flags -> REPLACE_F), `Patch.colorItem(id, index, c)` restyles one item's colour; geometry restyles of one item use `replace` (intended: items are re-tessellated as a node).
- **Hit testing:** see format/JRB.md "HIT semantics". After any patch sequence `hit()` equals a fresh load.
- **Shared GPU:** `const gc = await JRender.GPUContext.create({device?, powerPreference?})`; `Renderer.init({canvas, core, context: gc})` for each canvas: one device, one shader module, one pipeline per format. `renderer.destroy()` frees only its own scenes/buffers; the device is destroyed only by `gc.destroy()` (or by the renderer if it created the device itself).
- **Init errors:** plain `Error`, message `JRender: <code> (...)`, `.code` in `no-webgpu | no-adapter | no-device | no-canvas-context`.
- **attach(opts):** idempotent (returns the same detach fn), `detach()` removes every listener and the CSS. Cursor is recomputed from the current hit state each `draw()` (so patches that remove a hit under a still pointer update it). `touchAction: 'auto'` (default) sets CSS `pan-x pan-y` and cancels a touchstart only when it starts over a scroll group or a hit region, so the page scrolls elsewhere and scroll groups/buttons get the gesture. Pass any CSS string (e.g. `'none'`) to override.
- **Classic build:** `jrender.classic.js` (IIFE, sets global `JRender`, ASCII, same source via `tools/exp7/build_classic.py`). Embed: `python3 tools/exp7/embed.py out.html page.js [--b64] id=file ...` writes `<script type="application/octet-stream" id=... data-enc="b91|b64">`; read with `JRender.embedded(id)`. basE91 is ~9% smaller than base64 (234,285 vs 257,836 chars for the 193 KB wasm). Note: a `data:` URL is not a secure context, so `navigator.gpu` is absent there (Core/wasm/wrap work; rendering needs https/file/localhost).

## v3 additions
- `EV.DRAGSTART 12, DRAG 13, DRAGEND 14`, `NF.DRAG 16`, `MOD {SHIFT 1, CTRL 2, ALT 4, META 8}`, `RS {BOLD 1, ITALIC 2, UNDERLINE 4, STRIKE 8, CHIP 16}`.
- `scene.events()` records: `{kind, id, x, y, buttons, a, b, code, vx, vy, pointerId, mods}`. `scene.pointer(kind, x, y, buttons, pointerId=1, mods=0)`; `scene.dragThreshold`; `scene.on(fn)` listener; UP goes to the captured node.
- `DL.richText(x, y, runs, o)` / `Patch.replace(id, d => d.richText(...))`; `core.richLayout(runs, o)` -> `{count, width, height, lines, frags, runRects}`.
- `graphemeBounds(str)`, `new TextEdit({value, maxLength, multiline})`, `attach(...).textField(scene, {id, x, y, w, h, value, placeholder, multiline, password, maxLength, label, onchange, oninput, onsubmit})`. Field node ids: frame `id` (HIT|DRAG), derived ids `id^0x40000000` (group), `^0x20000000` (content), `^0x10000000` (caret) - keep these free.
- `renderer.autoSize({element, onresize, maxDpr, dprScale})` -> stop(); `renderer.resize(cssW, cssH, dpr, devW?, devH?)` (0 size = hidden).
- `renderer.ondevicelost = err => ...`, canvas event `jrender-devicelost`; `renderer.recover()` / `gc.recover()`.
- `Core.create` errors: `err.code` `no-wasm` (no WebAssembly) or `bad-wasm` (compile/instantiate failed).
- attach options: `touch: 'auto'`, `touchHits`, `keepFocus`.

## v4 additions (Exp7 view.states bridge subset -- not full JMotion)
- `ANIM = { NONE:'none', PULSE:'pulse', SHAKE:'shake', GLOW:'glow' }`, `SMNAME`, `POSES` (TDD/janim defaults: idle/hover/pressed/invalid/...).
- `new ViewStates(scene, { states, reduced, edgeMs })` -- `{bg,border,sm,anim}` + named poses + **fixed** edgeMs; no per-edge table / ambient / parallax yet
  - `.register(id, { cx, cy, bgId, borderId, ringId, xfId, bg, border })`
  - `.setStates(map)` / `.go(id, stateName, tMs)` / `.pointer(id, 'enter'|'leave'|'down'|'up', tMs)` / `.tick(tMs)` / `.setReduced(on)` / `.view(id)`
- richText/richLayout: `lineHeight` is a **factor** (default 1.25). Values > 4 are treated as absolute CSS px divided by the max run size (guards the textBox/wrap footgun).
- TextField hidden textarea: Safari-safer defaults (`opacity: 0.01`, high z-index, `font-size: 16px`).
