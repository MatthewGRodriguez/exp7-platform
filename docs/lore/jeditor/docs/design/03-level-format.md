# 03 - Level format

Everything in the output is part of the level. A level is one self-contained HTML file; the editor opens it, edits it, and saves it back.

## Schema (JSON, embedded in the HTML)
```json
{
  "format": "jeditor-level", "formatVersion": 1,
  "meta": { "id": "uuid", "title": "G1 BC", "created": "...", "modified": "...", "editorVersion": "0.1.0", "containsPersonalData": false },
  "theme": { "tokens": { "color.bg": "#111", "radius.card": 10, "font.body": "system-ui" } },
  "runtime": { "jmotion": "1.0.0", "hash": "..." },
  "motion": { "ambient": { "enabled": true } },
  "components": [
    { "id": "c1", "type": "Tabs", "props": { "tabs": ["Plan", "Review"] },
      "slots": { "Plan": ["c2"], "Review": [] },
      "animations": ["a1"] }
  ],
  "animations": [
    { "id": "a1", "target": "c1", "preset": "flip", "trigger": "state-change",
      "duration": 420, "easing": "glide", "delay": 0 }
  ],
  "jfactor": { "engine": { "id": "exp6", "prefer": "auto", "chain": ["webgpu","wasm-simd","wasm","js"], "workers": "auto", "gpuMinRows": 64 }, "itemTypes": [], "packs": [ { "id": "builtins", "version": "1.0.0", "hash": "..." } ], "packData": {}, "resources": [], "items": [ { "id": "i1", "alternatives": [], "current": null } ], "groups": [], "metrics": [ { "id": "cashAfterBills", "builtin": true } ] },
  "state": { "values": { "c2.value": 3 }, "persist": "local", "storageKey": "jeditor:<meta.id>", "stateVersion": 1 },
  "logic": []
}
```

Level settings: `state.persist` = `local` (keep user-changed values between visits, in localStorage under `state.storageKey`, default `jeditor:<meta.id>`) or `none` (reset each open), chosen per level in the editor (ADR 0006). `state.stateVersion` is bumped when the state shape changes; stored values with an older version are migrated or discarded. `motion.ambient.enabled` (default `true`, ADR 0007) switches the background drift for the whole level.

Calendar highlight conditions (ADR 0012) are saved in the JCalendar component's props (`highlights: [Condition]` and `combine` mode, doc 06, ADR 0014; scopes day/week/month/range/item, ADR 0015); their results are derived and never saved. The metrics they may use come from the editor-configurable registry `jfactor.metrics` (ADR 0013).

One JFactor system per level (ADR 0011): items hold their own alternatives; paths (incl. the current path) are views, not separate models. See doc 06.

Personal data (ADR 0026): a level may embed real personal data (the v1 ranking_ui level uses Matthew's real workbook). Then `meta.containsPersonalData: true`, and the output HTML is private: don't share or publish it. Proposal: the editor shows a badge and warns on export/share. Real data and levels with personal data are committed to Lore (ADR 0027); source copies live in `data/ranking_ui/`.

## Output HTML layout
```html
<!doctype html><html><head>
<meta name="generator" content="JEditor 0.1.0">
<style id="jmotion-css">...</style>
<style id="level-css">/* generated from theme + components */</style>
</head><body>
<div id="level-root"><!-- pre-rendered DOM for instant first paint --></div>
<script type="application/json" id="jeditor-level">{ ...schema... }</script>
<script id="jmotion">/* runtime */</script>
<script id="jfactor" data-engine="exp6">/* JFactor Exp6 bundle incl. inline base64 WASM/SIMD kernels, WebGPU (inline WGSL) and worker runtimes; capability detection and fallback chain, results report backend (ADR 0018, 0020) */</script>
<script id="jcomponents">/* only the component renderers used */</script>
<script>JLevel.boot(document.getElementById('jeditor-level'))</script>
</body></html>
```

Engine runtime (ADR 0021, proposal): the HTML also inlines the worker source as a text script (`<script type="text/plain" id="jfactor-worker">`), started via a Blob URL with main-thread fallback. Scoring is async and WebGPU-first; results carry `backend` and `workers`.

## Round-trip
- Source of truth = the `#jeditor-level` JSON. The DOM, level CSS and component bundle are generated from it and are ignored on import.
- Import: parse HTML, read the JSON block, check `formatVersion` and the runtime hash, migrate if older.
- Save: regenerate the whole file deterministically (same JSON -> same bytes), so Lore diffs stay small.
- No external data: no fetch, no external scripts or fonts; images inlined as data URIs.

## Open questions
1. ANSWERED 2026-10-30: configurable per level (ADR 0006).
2. PARTLY ANSWERED 2026-10-30: JFactor is first class; the `jfactor` block + embedded Exp6 engine (doc 06, ADR 0008). Other logic (G1 BC math) still open.
3. Should a level be able to embed another level (sub-levels), or only components?
