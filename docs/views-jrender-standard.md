# Views & JRender standard (direction)

**Status:** Accepted product direction **[REQ 2026-11-08]** — documentation of the path forward.  
**Not yet claimed complete on `main`:** platform chrome and every app surface are still a mix of DOM shell + JRender view canvases **[MEAS / OPEN]**.

Evidence classes: [EVIDENCE.md](./EVIDENCE.md).

---

## Intent (one sentence)

**One real JRender for everywhere:** standardize how apps use views so a single renderer can host many instances of the same view, different views together, and app-owned scene content in the same scene — and so apps (and eventually the platform shell) draw entirely through JRender.

---

## Hard rules that do not change

| Rule | Notes |
|------|--------|
| Real JRender only | Artist’s renderer. Never a reimplementation. **[REQ]** |
| No fallback renderer | Without WebGPU / wasm: plain error + diagnostics. **[REQ]** |
| Views are universal | Cal / Board / Plan (and later standard views) share one Exp7Views + builder path (`calHtml` / `boardHtml` / `planHtml` / `depsHtml` → JRViews → JRender). A view *design* change lands once and applies in every app. **[REQ]** |
| Data is not shared | Each app keeps its own atlas / membership. Demo trip data ≠ Budget IDB ≠ future apps. Universal views ≠ shared Board items. **[REQ]** |
| Views emit; they do not write atlases | Events → circuits / host → proposals. Spec 42 pattern. **[REQ]** |
| No Artist contact without authorization | Still unauthorized unless Matthew explicitly opens it. **[REQ]** |

---

## Destination shape

```
                    ┌─────────────────────────────────────────┐
                    │         One JRender (shared Core /      │
                    │         GPUContext / device)            │
                    │                                         │
                    │   ┌─────────┐ ┌─────────┐ ┌──────────┐  │
                    │   │ View A  │ │ View A' │ │ View B   │  │  ← same kind or different
                    │   │ (Cal)   │ │ (Cal)   │ │ (Board)  │  │
                    │   └─────────┘ └─────────┘ └──────────┘  │
                    │                                         │
                    │   ┌──────────────────────────────────┐  │
                    │   │ App / platform scene content     │  │  ← chrome, panels, custom DL
                    │   │ (same scene composition)         │  │
                    │   └──────────────────────────────────┘  │
                    └─────────────────────────────────────────┘
```

### 1. One renderer, many views

- Prefer **one** JRender Core + **one** shared `GPUContext` (device / pipelines) for the page.  
- Mount **N** view instances: multiples of the same kind (e.g. two Boards) or mixed kinds (Cal + Board + Plan + deps).  
- Today Exp7 already shares Core/GPUContext across JRViews canvases; the destination is to treat that as the **only** drawing path for UI, not “views in canvases + DOM chrome forever.” **[REQ direction]** / partial **[MEAS]** in lean Exp7Views.

### 2. Same scene composition

- Standard views and **app-owned scene nodes** (custom DL / patches, chrome, overlays that are still JRender) live in the **same** scene graph / layout composition — not a parallel DOM UI pretending to be the product.  
- Hit-testing, scroll, and motion stay on JRender’s event path.  
- DOM may remain as a thin host (canvas element, textarea ownership for TextField, script inject) — not as a second visual product.

### 3. Platform itself becomes JRender

- **Destination:** the platform shell (app picker, account chrome, mount chrome) is drawn with the same JRender — “one JRender for everywhere.” **[REQ direction]**  
- **Current:** shell is HTML/CSS; apps inject into `#appSlot-*`; each app’s Cal/Board/Plan are JRender. Bridging shell → JRender is **future work**, not claimed done. **[OPEN]**

### 4. How apps use views (standard contract)

Apps (Exp7 demo, Budget, standalone, future):

1. Depend on **Exp7Views** (`exp7-views@1`) — do not fork builders or invent `renderCal` stubs.  
2. Supply **their own atlas** (data).  
3. Mount one or more roots: `['comp:<calId>']`, `['comp:<boardId>']`, `['comp:reqs']`, etc.  
4. May add **chrome outside or inside the scene** that does not change view HTML builders (e.g. Budget type *stamp* on new items).  
5. Must not introduce `budget-mode` (or similar) branches inside `boardHtml` / `calHtml` that change the universal view design.

`normalizeDemoViews` (when used) only normalizes **view shape** on an atlas (strip moneyPreset chrome, Plan = `comp:reqs`). It does not merge data across apps.

---

## Current vs next

| Layer | Now (typical lean / 1.7.x path) | Next |
|-------|----------------------------------|------|
| View builders | Shared Exp7Views + runtime `*Html` | Keep; never fork per app |
| JRViews → JRender | Per-canvas views; shared Core/GPUContext | Same; more views per page |
| App chrome | Often DOM beside canvases | Move into JRender scene content |
| Platform shell | DOM `#topChrome` / overlays | Eventually JRender everywhere |
| Data | Per-app atlas / IDB / proposal sync | Unchanged — still per-app |

---

## Non-goals (for this standard)

- Sharing one Board/Cal/Plan **dataset** across apps.  
- A second renderer or DOM substitute when GPU is missing.  
- Resuming canceled search / scheduler experiments.  
- Contacting the Artist without a new explicit authorization.

---

## Open work

1. ~~Formalize a small **mount API** for “N views + optional scene layers” on one shared renderer~~ → **`Exp7Views.mountSurface` + `rendererInfo`** (1.7.8+). Apps mount Cal/Board/Plan (or a custom `views[]`) on one atlas; JRViews already shares one Core/`GPUContext`. Custom scene layers still attach via `rendererInfo().gc` / future host hooks — not a second renderer. **[MEAS in source / pack]**  
2. Migrate platform chrome into JRender scene content without breaking launcher handoff / key memory rules. **[OPEN]**  
3. Mac **[USER-HW]** acceptance for multi-view + shell-in-JRender (box `no-adapter` ≠ GPU proof). **[OPEN]**  
4. Keep two-file release discipline for software payloads; docs-only PRs remain an authorized exception. **[REQ]**

---

## Related docs

- [architecture.md](./architecture.md) — layers, mount model, sync honesty  
- [vocabulary.md](./vocabulary.md) — calHtml / boardHtml / Atlas / direct mount  
- [decisions.md](./decisions.md) — accepted product rules  
- [archives/artist-jrender/jrender-exp7/API.md](./archives/artist-jrender/jrender-exp7/API.md) — shared GPUContext, scenes, Renderer  
- [sources/2026-11-08-exp7-context-handoff.md](./sources/2026-11-08-exp7-context-handoff.md) — historical REQ timeline  
