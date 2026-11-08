# 0046 — Animation file format `.janim.json`

Status: accepted (2026-10-31)

## Format
```
{ format:'jeditor-anim', formatVersion:1, id:'[a-z0-9_-]{1,40}', name, version, note?,
  table:{ targets, shadows:{tight,wide:{y,blur,a}}, rings:{name:'css outline'}, states:{idle|hover|focus|pressed|selected|dragging|drop-pending|invalid|disabled|settling:{scale, ring?, tight?:[op,dy], wide?:[op,dy], op?, art?:asset}},
         easings:[cubic-bezier…], edges:{'from>to':[ms, easingIndex]}, ambient:{amp_px, period_s}, parallax:{pointer_px, scroll_k}, enter:{ms, stagger_ms, max_stagger, ease}, flash:{ms, gain, spend} },
  caustics?:{top_a, mid_a, bot_a, edge_px},           // glass sheen gradient on JMotion targets (03c_caustics family)
  assets?:{name:{type:'svg'|'png', data:'data:image/…'}} }  // baked art, data URIs / inline SVG only
```
`table` is exactly the JMotion state table (builder/motion/state_table.json without `_doc`), so a file can drive the whole runtime.

## Validation
`builder/janim.js` (shared by node and the editor) checks types, ranges (scale 0.5–1.5, ms 0–5000, alpha 0–1, blur ≥ 0), easing syntax, ring/asset references, and that assets are `data:image/…` with no external URL, `url()` to a non-fragment, or `<script>`. Errors carry a JSON path and are shown inline in the editor.

## Use
- Level default: `level.animation` (embedded copy) replaces the base table. `animations/default.janim.json` reproduces TDD parity byte-for-byte (builder/test/janim_test.js: identical css/js/stateLines; ranking_ui_v1 rebuilt with it differs only in the embedded level JSON).
- Type/component: `theme.anim`.
  - Its state CSS is generated scoped to `[data-jmo=id]`: shadows, per-state scale/ring/opacity, the before/after pair, art as background-image, and the sheen first so state art wins.
  - Its edges become the component's JMotionOver edges with the easing carried as a string (third element), so they don't depend on the level's easing list.
  - Its `enter` sets the component's enter timing.
  - An explicit M9 `component.motion` override still wins over the file's edges.
  - Per-component ambient/parallax are level-only (the body layer). The file's values apply only when it is the level default.
- Editor:
  - "Load animation file…" lists `animations/*.janim.json` (`GET /api/animations`, invalid files are listed with their first error).
  - "Upload .janim.json…" uses a file input and `POST /api/animation-validate`; errors are shown inline.
  - A valid file is first PREVIEWED (applied to the preview copy only), then assigned to component / type / level with one undoable edit.
- Exports embed the file inline (level JSON + generated CSS). There are no external refs; the CSP is unchanged.

## Shipped files
- `animations/default.janim.json` (TDD default).
- `animations/snappy_gold.janim.json`: edges ×0.5 with an overshoot ease, hover ×1.04 with an SVG glint, pressed ×0.94, deeper tight shadow, gold focus ring, enter 180 ms, glass sheen.
