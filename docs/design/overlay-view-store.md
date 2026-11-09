# Overlay composition and the Exp7 view store (2026-11-09)

Ash Tangent Residual Artist sent this packet at Matthew's request on 9 Nov 2026. The zip reviewed here is `artcraft-jrender-overlay-2026-11-09`. Matthew also has the page on his Mac at `/Users/user-rodri/Home/Art/artcraft-jrender-overlay-20261109/index.html`.

This document is the product reading of that packet. Shell **1.8.27** carries the host and the loader. Shell **1.8.28** adds a Fish app that is this demo: the stone card and stone button as slots, and the fish as the overlay, on one renderer. Shell **1.8.29** adds a Lumen app from the later page: a session card and a Confirm control as slots, and a light glide as the overlay, on that same renderer. Calendar, Board, and Plan are unchanged. The card, button, and fish paints are still the temporary solids from the packet. The Lumen faces are stepped solid bands of the authored lighting.

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

## What 1.8.27 ships

Calendar, Board, and Plan still lay out HTML through JRViews into JRender. Each mounted view has its own canvas. Those canvases share one Core and one GPU context. Account and key UI stay DOM.

The classic glue in `exp7-platform-lean.html` now matches the packet host:

- `b91ToBytes` sizes its output at `0.875` bytes per character. A re-encode of this zip's 66,052-byte pack round-trips. The old `0.82` factor decoded that same text to 65,458 bytes. Wasm and font embeds were already inside the old limit.
- `Renderer.layout` attaches GPU buffers when a scene has none, then resizes. `draw` skips an entry whose `scene.gpu` is still missing.
- `Renderer.pick` walks layout entries from the top. A `fallthrough` entry takes the point only where `scene.hit` or `scene.scrollAt` is set. `attach` uses `pick` for pointer, wheel, and touch. An uncaptured cursor uses `pick` as well. A captured pointer stays on its scene.

`Exp7ViewStore` (`data-exp7-shared="view-store"`) opens a JRVP pack or a folder, binds fonts, creates a scene, and composes. `JRViews.viewStore()` and `Exp7Views.viewStore()` return it.

A mounted document stays the slot. `view.setOverlays(overlays, { cover: true })` places those overlay scenes after the document in the same `layout()`, at the document's size, and a later rebuild calls `placeScenes` again so the overlay is not dropped. A stored slot cannot be placed over the document. `store.compose(renderer, list)` is the other path: stored slots first, overlays last, on one renderer that shares the Core. Both refuse a scene with no GPU buffers.

Passing a font **number** to `bindResources` reuses that slot. The product Core has already loaded its font as slot 0, so a catalog that expects `font/dejavu` at slot 0 is bound with `JRViews.font()` (the number), not by calling `core.font` again.

Overlay motion rides the existing per-view frame callback. The callback is armed only while a ViewStates edge needs a frame or an overlay motion is playing. A hidden tab pauses the motion and cancels the callback. Reduced motion calls `setReduced`, which holds the still pose and does not keep the loop. No overlay means that callback is unchanged.

## How a product surface loads a store

Keep the one Core and the one GPU context. JRViews remains the builder for atlas documents (calendar, board, plan). The store is how authored views enter the same renderer. It is not a second renderer, and it is not a reason to turn the legacy scene runtime on.

1. Decode the pack with `b91ToBytes` (now `0.875` bytes per character) or pass raw JRVP bytes to `Exp7ViewStore.openPack`.
2. Bind catalog fonts on the shared Core. Pass `JRViews.font()` for `font/dejavu` so slot 0 is reused.
3. `create` every view with the renderer that already owns that Core (`{ renderer }`), so each scene gets GPU buffers before `layout`.
4. For a free canvas, `store.compose(renderer, list)` with slots first and overlays last. For a mounted document, `view.setOverlays(overlays, { cover: true })`.
5. The frame callback runs only while a ViewStates edge is easing or an overlay motion is playing. A hidden tab pauses it. Reduced motion holds the still pose. A paused, hidden, or reduced overlay requests no frames.
6. Slot clicks stay synchronous. The packet's runtime edge is `edgeMs` 100. The shell's older click-path ceiling remains 120 ms until that table is retimed on purpose.

`pick()` walks layout entries from the top and continues through a `fallthrough` entry when `scene.hit` and `scene.scrollAt` are both null.

Fallthrough on this fish is the whole scene. The fish display list has no hit regions, so a click on the painted body reaches the card or button underneath. An overlay that should receive clicks needs hit nodes where it should, and fallthrough everywhere else.

Motion stays inside the overlay scene (`Patch.xform` on part nodes). Moving the fish by calling `layout()` every frame would re-place every slot as well. The measured Core cost in the packet is about 1.3 ms per frame for eight affines and a re-tessellation of about 26,000 vertices. One overlay is fine at that cost. Many overlays want a GPU-side node transform so a pure affine does not re-tessellate. That is a later JRender change, not a page-script workaround.

The stone card and stone button in this store are temporary solid fills, rounded rects, borders, and text. Their records still list the missing paints: linear and radial gradients with stop alpha, and the button's sheen and shade. The fish's 7 gradient fills are 5 stepped solid bands each, and its 67 strokes are filled outline shapes. Those are the same draw-list gaps measured on 2026-11-08 in [authored-ui-packet.md](./authored-ui-packet.md). Swapping a product control onto these solids would drop the authored material. Do that only as an explicit temporary face, and remove the procedural rectangle light for that control in the same change so the two do not stack.

## Evidence

| Check | Result | Class |
|---|---|---|
| Core tests in the packet (`qa/core-overlay-tests.mjs`, Node, real wasm, stock and patched host) | 51/51, including the reproduced stock routing bug and the reproduced basE91 truncation | [CLAIM] from the packet's `qa/core-overlay-results.json`. Not re-run in this repo. |
| Browser behaviour on Ash's box (headless Chrome, SwiftShader) | 13/13 behaviour checks. Device lost on the first JRender `queue.submit`, including on the earlier compose page. A clear-only page survived. | [CLAIM] from `qa/browser-overlay-results.json`. |
| JRVP header in this zip | 66,052 bytes, version 1, three views, roles and hit policies as in the table above | [MEAS] read here from `store.jrvp`. |
| Shipped glue in 1.8.27 | `0.875` basE91 keeps a re-encode of the 66,052-byte pack; `0.82` yields 65,458 bytes. `pick` returns the card through empty overlay space and through a fish body with no hit. A second `placeScenes` still has the document slot and the overlay. | [MEAS] on the shell source, Node, no WebGPU device. |
| Matthew, Safari on his Mac, this zip | GPU path came up. The fish painted over the card and the button. Clicks reached the card and button through empty overlay space and through the fish body. The recentered "Save changes" label is the one in this zip. | [USER-HW] stated in the 9 Nov 2026 handoff. Not re-run here. |
| Frame time, accessibility, large-data performance, a product frame of Calendar/Board/Plan with an overlay | Open | [OPEN] |

Schematic PNGs in the packet are Pillow stills. They are not JRender frames.

## Still open before the packet's art is on a product canvas

- The host patch is in the shell. The shared `jrender-exp7` tree was not modified. Wasm and JRDL are unchanged.
- Shell 1.8.29 plays the Lumen page as an app. The page is 820×400. `exp7.lumen-card` sits at 24, 52 (480×280, capture). `exp7.lumen-confirm` sits at 530, 120 (260×140, capture). `exp7.lumen-glide` is drawn last at 24, 52 (480×280, fallthrough). The glide moves by one node affine. Lit states cross-fade shadow levels with `Patch` and scale the face about the principal point. Confirm selects the session. U undoes that. P pauses the glide. O removes it. Keys 1–7 set idle, hover, pressed, selected, disabled, focus, and invalid. A hidden tab and reduced motion stop the travel. The first state patch is synchronous. Gradients are still stepped solids.
- A draw-list linear gradient, a radial gradient with stop alpha and an affine, and a cubic stroke. Then replace the temporary card, button, and fish constructions. Until then the records' `paint.gaps` stay the inventory. The Fish app plays those stand-ins so the composition can be checked.
- Decide which product surface composes stored scenes on one canvas, and which surfaces stay JRViews documents on the shared Core. Budget boards and the calendar are documents. A stored card is a face, not a replacement for the atlas.
- Mac frame timing, contrast on the real canvas, and reduced-motion and hidden-tab behaviour on the product shell, separate from the packet page.
