# Exp7Views (`exp7-views@1`)

Canonical reusable Exp7 Calendar / Board / Plan feature extracted from the accepted Exp7 lean demo pipeline.

## Boundary (what this is)

**Presentation path (accepted Exp7):**

1. `atlas/runtime.js` builders (`calHtml` / `boardHtml` / `planHtml` / `depsHtml`) run inside `JA_RUNTIME_FACTORY` against a **fake** document via `startRuntime`.
2. HTML is produced as a **string** and is **never inserted** into the page DOM as the view surface.
3. `JRViews` layouts that HTML into **JRender** (WebGPU) draw lists on a host canvas.
4. Host polish (`calDoc` / `boardDoc` / `planDoc`, criticality/`RISK_COL`, year→month→day navigation) preserves accepted interaction.

**Not this module:** the legacy offline atlas page path `JA_RUNTIME_FACTORY(window, document)` → `app.innerHTML = …` (rejected in 1.6.2 as “HTML views directly”).

## Source map

| Path | Role |
|------|------|
| `src/exp7-views/exp7-views.js` | Public API: `mount` / `dispose` / `blankMoneyAtlas` / `rootsFor` |
| `src/exp7-views/views-host-impl.js` | `startRuntime`, `setView`, calendar/board/plan polish |
| `src/exp7-views/theme-criticality.js` | `EXP7_LIGHT_THEME`, `RISK_COL` defaults |
| `src/exp7-views/vendor/*` | atlas/eval/runtime-factory/JRViews/JRender/assets |
| `src/demo/*` | Exp7 lean **demo consumer** (chrome/tabs/proposals) |
| `src/budget/budget-app.js` | Budget **consumer** (expenses/income/debt/assets, IDB `budget-app-v1`) |
| `src/standalone/exp7-views-standalone.html` | Minimal caller without demo chrome/seed |
| `build/build.mjs` | Packs sources → single platform HTML + standalone |

## API (minimal)

```js
await Exp7Views.ready();
const atlas = Exp7Views.blankMoneyAtlas('Budget'); // no demo seed
const R = Exp7Views.rootsFor(atlas);
const h = Exp7Views.mount({
  host: el,
  atlas,
  root: R.calendar,      // or R.board / R.plan
  kind: 'calendar',
  onPropose(ops) { /* apply + persist */ },
  onError(err) { /* GPU/wasm unavailable — do not DOM-mock */ },
});
h.update(atlas);
h.dispose();
```

`Exp7Views.MODULE_ID === 'exp7-views@1'` — demo and Budget must share this identity.

## Build / release

```bash
node build/build.mjs
node tests/exp7-views.test.mjs
```

Outputs: `exp7-platform/exp7-platform-lean.html`, `exp7-platform/release.json`, `dist/exp7-views-standalone.html`, `dist/source-sha-manifest.json`.

End-user delivery remains launcher + one self-contained platform HTML (no network modules).
