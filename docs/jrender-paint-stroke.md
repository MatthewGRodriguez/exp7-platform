# Gradient paints and strokes in the draw-list core (DL v1 items 10 and 11)

<!-- Copied from JRender runtime/PAINT-STROKE.md, branch dl-index commit 58e98cb (Matthew's Mac; that repo has no remote yet). Shipped in Exp7 1.8.42. -->
**Status:** shipped in Exp7 **1.8.42** (PR #75, `main`). Source: JRender `dl-index` commit `58e98cb` (b9423a3 + paint/stroke), not published; the wasm and the JS builders are in the platform HTML (`jr-wasm`, `jrender`).

**Exp7 surface:** `JRViews` items accept `['stroke', cmds, colour, opts]` and any colour may be a gradient; a gradient fill is restored after hover with a replace. Skins use `Exp7VM.linear / radial / conic` (stops as `[offset, [r,g,b,a]]`) and `Exp7VM.strokeItem(cmds, colour, opts)`. The default skin does not use them yet, so no view's pixels changed.

**Evidence:** [MEAS] native tests and byte-identical replay of the recorded Exp7 session and 1k/10k/100k-row boards, old vs new core; [USER-HW] same tests on Matthew's Mac, GPU gallery on WebGPU (all views 0 px / 0 hit; translucent self-crossing stroke same colour at the crossing as on one leg).


Branch `dl-index`. Adds canvas-style gradients and stroked paths to draw lists and patches. Nothing else changes: the
vertex format (16 B: x, y, rgba, group), the shader and the host ABI are the same, and scenes without the new ops tessellate
byte-identically (recorded Exp7 session and 1k / 10k / 100k-row boards, with and without the frame budget).

## Wire format

Item ops, allowed wherever items are (NODE contents, REPLACE / REPLACE_F):

| op | name | payload (u32 words; f = f32 bits) |
|---|---|---|
| 10 | STROKE | f width, join (0 miter, 1 round, 2 bevel), cap (0 butt, 1 round, 2 square), f miter limit, rgba, ndash, f dash offset, ndash x f dash, then path verbs as PATH (M 0, L 1, Q 2, C 3, Z 4) |
| 11 | PAINT | kind (1 linear, 2 radial, 3 conic), spread (0 pad, 1 repeat, 2 reflect), 6 x f params, n, n x (f offset, rgba) |

PAINT params: linear `x0 y0 x1 y1 _ _`; radial `x0 y0 r0 x1 y1 r1` (two circles, as `createRadialGradient`); conic `angle cx cy _ _ _`
(radians from +x, clockwise in y-down space, as `createConicGradient`). Offsets are clamped to [0, 1] and made non-decreasing;
two stops at the same offset make a hard edge.

PAINT applies to the **next item** of the node (any kind: rect, rrect, border, path, stroke, text, text box, rich text). It is not
an item itself, so item indices (COLORITEM) are unchanged. A PAINT with no following item is ignored. A bad kind, spread, stop
count or non-finite parameter rejects the whole list or patch, like any malformed op.

COLOR / COLORITEM on a painted item makes it solid in that colour (the vertex colours are rewritten in place); REPLACE paints again.

## How it renders

- **Strokes**: subpaths are flattened, split into dashes (canvas `setLineDash` rules: odd lists repeat, negative or all-zero lists
  mean solid), and turned into outline pieces: one quad per segment, one piece per join (miter within the limit, else bevel; round
  = disc) and per cap. Every piece has the same winding and they are filled with the nonzero rule, so overlaps (joins, crossings,
  dash caps) cover exactly once and translucent strokes never darken where pieces meet. Subpaths are open unless closed by `Z`;
  a closed path's first and last dashes join through the start point. Zero-length subpaths draw a dot with round / square caps.
- **Gradients**: the item is tessellated as usual in its own space, then refined and every vertex coloured by the paint (the GPU
  interpolates vertex colours):
  - linear: triangles are cut along every line where the ramp has a kink (each stop, each repeat / reflect period). Between
    cuts the colour is affine in position, so the result is exact; vertices on a cut take the colour from their own band, so hard
    stops and repeat seams stay sharp.
  - radial and conic: triangles are bisected until the interpolated colour is within 1.5 / 255 per channel of the true colour at
    edge midpoints and the centroid, down to 0.75 device px. Points where a radial gradient is undefined are transparent.
  - colours interpolate per channel, unpremultiplied (as canvas gradients).
  The paint is in item space, so node transforms move and scale it with the item.

## JS (`web/jrender.classic.js`)

```js
const g = JRender.linear(0, 0, 200, 0, [[0, JRender.rgba(255, 0, 0)], [1, JRender.rgba(0, 0, 255)]], { spread: 'pad' });
dl.node(1).rrect(0, 0, 200, 100, 12, g);                                  // any colour argument may be a gradient
dl.node(2).stroke([['M', 0, 0], ['L', 100, 0], ['L', 100, 100]], JRender.rgba(20, 30, 50),
  { width: 4, join: 'round', cap: 'round', dash: [8, 4], dashOffset: 0, miterLimit: 10 });
dl.node(3).stroke(cmds, JRender.radial(50, 50, 0, 50, 50, 40, [{ offset: 0, color: a }, { offset: 1, color: b }]), { width: 6 });
dl.node(4).richText(0, 0, runs, { paint: JRender.conic(0, 40, 40, stops) });
```

Gradients are plain data (`{ gradient: 1, kind, spread, p, stops }`), safe to JSON and diff.

## Tests

`cargo test --release` (native): `paint::t` (exactness of linear / multi-stop / hard stops / repeat / reflect, radial and conic within
error, canvas radial semantics, parsing), `stroke::t` (cap and join areas, miter limit, dash lengths and offsets, closed-path dash
wrap, self-crossing, dots, degenerate widths), `tests/paint_stroke.rs` (wire format end to end: load, hits, COLOR / COLORITEM,
REPLACE with PAINT, transforms, malformed input).
