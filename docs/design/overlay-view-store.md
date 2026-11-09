# Overlay composition and the Exp7 view store (2026-11-09)

Ash Tangent Residual Artist sent this packet at Matthew's request on 9 Nov 2026. The zip reviewed here is `artcraft-jrender-overlay-2026-11-09`. Matthew also has the page on his Mac at `/Users/user-rodri/Home/Art/artcraft-jrender-overlay-20261109/index.html`.

This document is the product reading of that packet. The packet is not copied into the repository, and it is not in shell **1.8.26**. Nothing in this note is a merge, a promote, or a deploy.

The cited `store/FORMAT.md` is not in this zip. The format below is read from `src/viewstore.js`, `tools/build_store.mjs`, `store/catalog.json`, and the `store.jrvp` bytes in the zip (66,052 bytes, magic `JRVP`, version 1, catalog 9,965 bytes).

## What the page is

One ASCII page. One JRender `Core`. One `Renderer.layout()` with three stored views:

| Order | Id | Role | Hit | Rect on the 780×360 page |
|---|---|---|---|---|
| 1 | `exp7.stone-card` | slot | capture | 24, 56, 448×240 |
| 2 | `exp7.stone-button` | slot | capture | 500, 110, 256×136 |
| 3 | `exp7.fish-swim` | overlay | fallthrough | 0, 0, 780×360 |

Draw order is list order. The canvas clears once. The fish display list has no backdrop, so the fish paints over the card and the button. Motion is eight node affines (`Patch.xform`) inside the fish scene. `layout()` is not called per frame.

The loop is 11.4 s: swim across, flip, swim back (`legMs` 5200, `turnMs` 500, twice). P pauses. O removes or restores the overlay. A hidden tab stops the clock and stops requesting frames. Reduced motion holds the still pose over the card and does not travel.

The fish is a JRDL v1 view of the old rig (39 solid fills that keep the curve verbs, 8 part nodes). It is not the legacy `jr_frame` / `jrs_*` runtime. The flip is a node-affine `scaleX`, not the rig's 11-key hull morph.

## View store

Catalog format `exp7-view-store/1`. Record format `exp7-view-record/1`. Draw lists are JRDL v1, the bytes `DLScene.load` already accepts. There is no second scene format.

Two containers hold the same records:

- Folder: `catalog.json`, `views/<id>/record.json`, `views/<id>/view.jrdl`. Font bytes stay beside the pack (`resources/dejavu.jrf`, slot 0).
- Pack `store.jrvp` (JRVP v1), little-endian: magic `0x5056524A` (`JRVP`), version `1`, catalog length, ASCII catalog padded to 4 bytes, blob count, then each JRDL blob as length plus bytes padded to 4. The pack catalog inlines each record. Font bytes are not inside the pack.

A record carries id, version, role (`slot` or `overlay`), hit (`capture` or `fallthrough`), canvas size, states, ViewStates bindings, an optional motion table, shared resource ids, and a paint inventory (`paint.ops`, `paint.gaps`).

Load path, in this order:

1. `openPack` or `openFolder`.
2. `bindResources(core, { 'font/dejavu': bytes })` on the one shared Core, before any view. The font id baked into text items must match the slot the Core assigns. The store rejects a mismatch.
3. `create(id, { renderer })` does `createScene`, `load` of the stored bytes, and `gpuScene`. A Core-only scene has no `scene.gpu`.
4. `compose(renderer, list)` builds one `layout()` list. It refuses a scene with no GPU buffers, and it refuses a slot placed after an overlay.

Card and button display lists in this store match the earlier compose page except the button label. `DL.text` `align` is not applied on the view path (`align` 0 and 1 tessellate the same, left-anchored at `x`). The "Save changes" label is placed from a Core measure so the glyphs sit inside the face, with the 20 px content inset.

## What the product does today

Shell **1.8.26** on `main` (merge of PR #52) still draws Calendar, Board, and Plan by laying out HTML through JRViews into JRender. Each mounted view has its own canvas. Those canvases share one Core and one GPU context. Account and key UI stay DOM.

The shipped classic glue, in `exp7-platform-lean.html`, is still the stock host:

- `b91ToBytes` sizes its output at `0.82` bytes per character (line 5976). The packet's store pack is low-entropy. The stock decoder dropped the tail: 66,052 bytes became 66,003. Wasm and font embeds were not affected, which is why earlier pages did not hit it. The packet copy sizes the buffer at `0.875`.
- `Renderer.layout` (line 6200) resizes scenes and does not attach GPU buffers. A bare Core scene reaches `sync()` with `scene.gpu` null. Safari reports that as `TypeError: null is not an object (evaluating 'g.vb')`.
- `attach()` (line 6256) returns the first layout rectangle that contains the point. An overlay rectangle that covers the page takes every pointer, wheel, touch, and cursor, including where the overlay scene has no hit.

The product does not open a JRVP pack, and it does not place an overlay scene over a slot scene.

## How the product would load this store

Keep the one Core and the one GPU context. Add the store as a loader of JRDL scenes on that Core. JRViews remains the builder for atlas documents (calendar, board, plan). The store is how authored views enter the same renderer. It is not a second renderer, and it is not a reason to turn the legacy scene runtime on.

When a product surface is ready to compose stored views, the sequence is the packet's sequence:

1. Decode the pack with a basE91 buffer of `0.875` bytes per character, or embed the pack as base64. The stock `0.82` factor is the wrong decoder for this pack.
2. Bind catalog fonts on the shared Core before `create`.
3. `create` every view with the renderer that already owns that Core, so each scene gets GPU buffers before `layout`.
4. `compose` slots first, overlays last, one `layout()` call. Overlay entries carry `hit: 'fallthrough'`.
5. Run one frame callback only while a ViewStates edge is easing or an overlay motion is playing. `motion.pause('hidden')` on `visibilitychange`. Reduced motion calls `setReduced(true)`, shows the still pose, and does not keep the loop. A paused, hidden, or reduced overlay requests no frames.
6. Slot clicks stay synchronous. The packet's runtime edge is `edgeMs` 100. The shell's older click-path ceiling remains 120 ms until that table is retimed on purpose.

Pointer routing has to use the packet's `pick()`: walk layout entries from the top, and continue through a `fallthrough` entry when `scene.hit` and `scene.scrollAt` are both null. Stock `attach()` is not overlay-safe. That change belongs in the JRender host the shell embeds. This note does not apply the patch.

Fallthrough on this fish is the whole scene. The fish display list has no hit regions, so a click on the painted body reaches the card or button underneath. An overlay that should receive clicks needs hit nodes where it should, and fallthrough everywhere else.

Motion stays inside the overlay scene (`Patch.xform` on part nodes). Moving the fish by calling `layout()` every frame would re-place every slot as well. The measured Core cost in the packet is about 1.3 ms per frame for eight affines and a re-tessellation of about 26,000 vertices. One overlay is fine at that cost. Many overlays want a GPU-side node transform so a pure affine does not re-tessellate. That is a later JRender change, not a page-script workaround.

The stone card and stone button in this store are temporary solid fills, rounded rects, borders, and text. Their records still list the missing paints: linear and radial gradients with stop alpha, and the button's sheen and shade. The fish's 7 gradient fills are 5 stepped solid bands each, and its 67 strokes are filled outline shapes. Those are the same draw-list gaps measured on 2026-11-08 in [authored-ui-packet.md](./authored-ui-packet.md). Swapping a product control onto these solids would drop the authored material. Do that only as an explicit temporary face, and remove the procedural rectangle light for that control in the same change so the two do not stack.

## Evidence

| Check | Result | Class |
|---|---|---|
| Core tests in the packet (`qa/core-overlay-tests.mjs`, Node, real wasm, stock and patched host) | 51/51, including the reproduced stock routing bug and the reproduced basE91 truncation | [CLAIM] from the packet's `qa/core-overlay-results.json`. Not re-run in this repo. |
| Browser behaviour on Ash's box (headless Chrome, SwiftShader) | 13/13 behaviour checks. Device lost on the first JRender `queue.submit`, including on the earlier compose page. A clear-only page survived. | [CLAIM] from `qa/browser-overlay-results.json`. |
| JRVP header in this zip | 66,052 bytes, version 1, three views, roles and hit policies as in the table above | [MEAS] read here from `store.jrvp`. |
| Shipped glue | `0.82` basE91 factor, `layout` without `gpuScene`, `attach` takes the first overlapping rect | [MEAS] in `exp7-platform-lean.html` on `main` at shell 1.8.26. |
| Matthew, Safari on his Mac, this zip | GPU path came up. The fish painted over the card and the button. Clicks reached the card and button through empty overlay space and through the fish body. The recentered "Save changes" label is the one in this zip. | [USER-HW] stated in the 9 Nov 2026 handoff. Not re-run here. |
| Frame time, accessibility, large-data performance, a product frame of Calendar/Board/Plan with an overlay | Open | [OPEN] |

Schematic PNGs in the packet are Pillow stills. They are not JRender frames.

## Still open before a product change

- Land the host patch in the JRender the shell embeds: `pick()`, `layout()` attaching GPU buffers, `draw()` skipping a scene with no buffers, basE91 at `0.875`. Wasm and JRDL stay as they are. The patch is packet-local (`jrender/jrender-overlay-host.patch`, 87 lines). The shared `jrender-exp7` tree was not modified.
- A draw-list linear gradient, a radial gradient with stop alpha and an affine, and a cubic stroke. Then replace the temporary card, button, and fish constructions. Until then the records' `paint.gaps` stay the inventory.
- Decide which product surface composes stored scenes on one canvas, and which surfaces stay JRViews documents on the shared Core. Budget boards and the calendar are documents. A stored card is a face, not a replacement for the atlas.
- Mac frame timing, contrast on the real canvas, and reduced-motion and hidden-tab behaviour on the product shell, separate from the packet page.
