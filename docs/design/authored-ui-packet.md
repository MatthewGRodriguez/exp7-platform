# Authored UI packet (2026-11-08, evening CT)

This is not a completed art workflow. The packet was measured against shell **1.8.21**. Shell **1.8.22** adds board and budget controls and does not play this packet. The DesignCraft packet is art input. It is not copied into this repository: the zip includes native masters, a Blender file, research imports, and PNG proofs, and the research imports must not be deployed. `hero-preview.png` is a comparison target. It is not a raster background for the product.

`docs/design/svg-state-card.svg` remains an integration fixture from the earlier note. It is not this packet, and a Chrome filter on that fixture is not draw-list playback.

## What the packet contains

DesignCraft 0.18.0 authored four editable native masters and 40 semantic layers. The delivery also has 88 label-free convenience composites: card and button, stone and navy, eleven states, free and fixed-row. Labels stay out of the art and are laid out by the product in the content rectangle.

| Component | Face | Free canvas | Face origin | Fixed-row viewBox | Text inset from the face |
|---|---|---|---|---|---|
| Card | 384 x 160, radius 18 | 448 x 240 | 32, 24 | `32 24 384 160` | L/R 28, T/B 26 (328 x 108) |
| Button | 192 x 56, radius 12 | 256 x 136 | 32, 24 | `32 24 192 56` | L/R 20, T/B 15 (152 x 26) |

The hit rectangle is the face, not the padded canvas. A day or a stacked row uses the row asset: identity pose, no outside shadow, rings inset, no paint across the next cell. Do not grow the cell to fit a shadow. Do not scale the whole SVG to a new size. Corner radius, rim width, ring width, shadow feather, and padding stay fixed. A nine-slice may stretch only a straight center, and only if that patch keeps its own gradient coordinates. This shell has no nine-slice. Below a card of 320 x 144 or a button of 144 x 48, re-author with `author-designcraft.py` instead of cropping.

Free-control poses in the packet's state table are small and authored, not a measured 85 mm camera fit. Reduced motion resets them to identity. The longest transition in that table is **100 ms** (drop-pending, invalid, settled, rest). Hover is 90, focus and disabled 80, pressed 65, dragging 0. The action is not delayed. The shipped shell still allows 120 ms on some click-path edges. That table was not retimed in this change.

Layer order for a free control: one of `shadow-z2`, `shadow-z5`, `shadow-z9`, then `surface-base`, `light-sheen`, `shade-edge`, `light-rim`, then `ring-selected`, `ring-focus`, or `ring-invalid`. Cache those semantic layers. Do not reparse all 88 composites on a pointer event. Focus may stack on selection by using the separate ring layers. Disabled and invalid need a text or icon cue as well as color. Disabled labels stay at full contrast.

## How it was exported

Versions in the packet: DesignCraft CLI 0.18.0, Inkscape 1.4-beta2 (9aaf4f34, 2024-07-30). Blender 5.2.3 supplied one area light at `[-300, 400, 700]`, diameter 220, 32 samples. Moho was not used. PhotoCraft was not part of this packet. Affinity is the historic draw-app name, not the author of these files.

The path that held up:

1. DesignCraft command script to a native `.designcraft` and an ordinary PDF.
2. Inkscape plain SVG from that PDF.
3. `normalize-opacity.py` moves paired equal-coordinate alpha-gradient stops into the color gradient's stop opacity. 200 masks across 44 files. Coordinate pairs match within 1e-5 native units. Visible paths, colors, stop positions, and transforms stay. The path check reports every one of those 44 files equal on geometry, transform, and style.
4. Assembly of semantic layers into the 88 state files.

Two failures stay on the record:

- Inkscape 1.4-beta2's internal PDF importer clips and mis-scales a separate gradient-alpha mask. Comparing two PDFs that both went through that importer can look clean and still be wrong. On the shadow probe the bad alpha extent was `[33, 27, 299, 137]`. Native reopen alone did not catch it, because the reopen used the same importer.
- Poppler/Cairo recovered the extent `[31, 23, 419, 188]` and rasterized eleven mask images plus a filter. That route was rejected. PDF/X-1a also rasterizes transparent regions. DesignCraft's SVG paste importer drops gradients, clips, and masks. Do not use `research/raw-internal-import/` as product art.

The final SVGs have no raster images, no filters, no `feGaussianBlur`, no separate masks, no `foreignObject`, and no baked labels. The shadow edge is a stack of gradient patches, about +/-3 px, art-directed. It is not a gaussian filter and not a full photometric fit. Measured shadow offsets, with the slab camera off, are about `dx = 0.45548 * h + 0.70807` and `dy = 0.61385 * h + 0.84375` pixels at heights 2, 5, and 9. Opacity is art-directed (stone 21%, navy 40%). No caustic, refraction, or Moho finish is claimed.

## What the packet already checked

All 44 direct DesignCraft original/reopen PNG pairs are pixel-identical at 2x. SVG versus that native render is not lossless: worst whole-canvas mean RGB error is 0.381/255, and local edge samples approach 48/255. Those residuals are antialiasing between rasterizers. Text-hidden contrast minimum is **4.8105:1**. Free-canvas crop issues: 0. Fixed-row constraint failures: 0. Native text, focus, accessibility, frame time, idle work, and a Mac GPU pass were not run by the packet and were not run here.

## What the view renderer can play

Probed on the wasm embedded in `exp7-platform-lean.html` (208,675 bytes). The view shader is `jrd_ptr(0, 6)`, 608 bytes: one vertex color, and a discard outside one axis-aligned group rectangle. Headless Chrome on this machine returned a null GPU adapter, so the pictures below are a CPU composite of the vertices that wasm tessellated, plus Chrome's own SVG draw. They are not a WebGPU frame of the product, and the lean file was not changed.

| Feature in the final SVGs | Draw list |
|---|---|
| Cubic and line fills, one solid color | Loads. The stone surface outline, scaled by the file's 1.3333333, loaded with `jrd_load` 0 and 4,320 vertex bytes. |
| Linear gradient, `userSpaceOnUse`, stop alpha | No opcode. An opcode shaped like a gradient (`0x0C`) is rejected with `-2` and zero vertices. |
| Radial gradient with an affine `gradientTransform` | Same gap. The sheen uses a non-uniform matrix, about `matrix(1, 0, 0, 0.41, 0, 28)`. |
| Cubic stroke (`fill:none`, width about 0.8 to 2) | No stroke opcode. Submitting the focus-ring path as a fill paints the interior. The file's stroke leaves the interior empty. |
| Axis-aligned page clip | A group clip can express a rectangle. These clips are rectangles after a Y flip. |
| One affine on a node | A node transform can carry it. Nested affines can be baked. That does not add a gradient. |
| SVG filter, mask, image, `foreignObject` | Absent from the final files, and absent from the draw list. Do not add them back to get a shadow. |

The other shader in the same wasm, `jr_ptr(4)` (3,339 bytes), evaluates linear and radial paints and an erf edge. Views do not submit draw lists to it. Turning the calendar onto that scene format would be a second path. It was not turned on. The avatar image store is a textured quad. The card art does not go through it.

A flat solid of the surface, or a filled ring, is what the draw list can show today. Shipping either one would drop the material and would sit under or instead of the 1.8.21 rectangles. Neither was written into the shell. The procedural rectangles were not extended.

## Still open

- A draw-list paint for linear and radial gradients with stop alpha and an affine, in the one view shader.
- A draw-list stroke for a cubic path, so rings, rims, and the shade edge stay hollow.
- Wiring cached semantic layers to the existing state machine once those paints exist, then removing the 1.8.21 rectangle light for that control in the same change.
- Retiming the shell's 120 ms edges to this packet's 100 ms ceiling, if Matthew wants that table.
- Mac Safari pixels, focus and non-text contrast, frame time, idle, hidden cancellation, and reduced motion on the real canvas.
- Moho finishing. It was not exercised, and the earlier gradient-strip reconstruction is still not final art.

The runtime change belongs with JRender. This repo does not reimplement that renderer inside the shell.
