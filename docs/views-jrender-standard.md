# Views & JRender standard (direction)

**Status:** Accepted product direction **[REQ 2026-11-08]**.  
**Shipped tip [MEAS]:** platform **1.8.3** — universal Exp7Views for demo + Budget; platform bar + apps picker + Budget tab chrome on JRViews→JRender→Exp7Slabs. Account/key overlays stay DOM (PAT never in canvas). Mac parallax acceptance still **[USER-HW][OPEN]**.

Evidence classes: [EVIDENCE.md](./EVIDENCE.md).  
Implementation detail: [platform-chrome-jrender.md](./platform-chrome-jrender.md).

---

## Intent (one sentence)

**One real JRender for everywhere:** standardize how apps use views so a single renderer can host many instances of the same view, different views together, and app-owned scene content in the same scene — and so apps (and the platform shell) draw through JRender.

---

## Hard rules that do not change

| Rule | Notes |
|------|--------|
| Real JRender only | Artist’s renderer. Never a reimplementation. **[REQ]** |
| No fallback renderer | Without WebGPU / wasm: plain error + diagnostics (`.jrerr`). **[REQ]** |
| Views are universal | Cal / Board / Plan share one Exp7Views + builder path (`calHtml` / `boardHtml` / `planHtml` / `depsHtml` → JRViews → JRender). A view *design* change lands once and applies in every app. **[REQ]** |
| Data is not shared | Each app keeps its own atlas / membership. Demo trip data ≠ Budget IDB ≠ future apps. Universal views ≠ shared Board items. **[REQ]** |
| Views emit; they do not write atlases | Events → circuits / host → proposals. Spec 42 pattern. **[REQ]** |
| Artist coordination | **Authorized 2026-11-08** with Ash Tangent Residual Artist (full view UX/UI art workflow + profile image render). Packet: [artist-coordination-brief.md](./artist-coordination-brief.md). Still: real JRender only; no second renderer. **[REQ]** |

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

- Prefer **one** JRender Core + **one** shared `GPUContext` for the page.  
- Mount **N** view instances: multiples of the same kind (e.g. four Budget Boards) or mixed kinds (Cal + Board + Plan).  
- API: `Exp7Views.mountSurface({ atlas, views[] })` (1.7.8+). Shell hosts Exp7Views / JRViews / JRender scripts **once** (`data-exp7-shared`). **[MEAS]**

### 2. Same scene composition

- Standard views and **app-owned scene nodes** (chrome injected into the view document, custom DL) live on the JRViews→JRender path — not a parallel DOM product UI.  
- Hit-testing, scroll, and motion stay on JRender’s event path when the surface is JR-on.  
- DOM remains a thin host (canvas element, TextField ownership, script inject, PAT overlays).

### 3. Platform itself becomes JRender

- **Destination:** shell chrome drawn with the same JRender. **[REQ direction]**  
- **Shipped 1.8.3 [MEAS]:**  
  - Reserved top bar (back + avatar) and apps picker → `PlatformChromeJR` → **JRViews** (Exp7Slabs parallax).  
  - Bar **canvas** takes pointer hits when `jr-on` (avoids DOM/JR layout offset).  
  - Budget Cal/Board/Plan (+ type) tabs → `budgetChromeDoc` in the view document (same canvas as the view).  
  - Account / key / share / package UI → **DOM** (PAT never in canvas).  
- Still open: account panel as scene; Exp7 demo `#tabs` nav; true single DisplayList for bar+app (today: multiple JRViews canvases, shared Core + global slabs). See [platform-chrome-jrender.md](./platform-chrome-jrender.md).

### 4. How apps use views (standard contract)

Apps (Exp7 demo, Budget, standalone, future):

1. Depend on **Exp7Views** (`exp7-views@1`) — do not fork builders or invent `renderCal` stubs.  
2. Supply **their own atlas** (data).  
3. Mount one or more roots via `mount` / `mountSurface`.  
4. May add **chrome outside or inside the scene** that does not change view HTML builders (Budget type stamp; Budget tab chrome via `hostDoc`).  
5. Must not introduce `budget-mode` (or similar) branches inside `boardHtml` / `calHtml` that change the universal view design.

`normalizeDemoViews` only normalizes **view shape** (strip moneyPreset chrome, Plan = `comp:reqs`). It does not merge data across apps.

---

## Current vs next (1.8.3)

| Layer | Now on `main` 1.8.3 [MEAS] | Next |
|-------|----------------------------|------|
| View builders | Shared Exp7Views + runtime `*Html` | Keep; never fork per app |
| JRViews → JRender | Per-canvas views; shared Core/GPUContext (shell hosts once) | Same |
| App chrome | Budget tabs **in-scene**; DOM tabs only as no-adapter fallback | Exp7 demo nav into scene |
| Platform shell | Bar + apps via JRViews; canvas hits on bar; account/key DOM | Account menus in JRender where PAT-safe |
| Budget boards | Four Board roots (expense/income/debt/asset); Cal starts first; combined Cal/Plan | Unchanged data model |
| Data | Per-app atlas / IDB / Exp7 proposal-op sync | Full app-level sync still **[OPEN]** |

---

## Non-goals (for this standard)

- Sharing one Board/Cal/Plan **dataset** across apps.  
- A second renderer or DOM substitute when GPU is missing.  
- Resuming canceled search / scheduler experiments.  
- Contacting parties other than the authorized Artist agent without a new explicit authorization.

---

## Open work

1. ~~`mountSurface`~~ — done (1.7.8+).  
2. ~~Platform bar + apps + Budget tabs on JRViews~~ — done (1.8.2–1.8.3); account/key remain DOM.  
3. Mac **[USER-HW]** acceptance for parallax + multi-board + bar hits (box `no-adapter` ≠ GPU proof). **[OPEN]**  
4. Exp7 demo tab strip into scene (optional). **[OPEN]**  
5. Keep two-file release discipline; docs-only PRs remain an authorized exception. **[REQ]**  
6. **Artist art pass + profile image ABI** — coordinate with Ash; integrate wasm/host bump when delivered. **[OPEN]** — [artist-coordination-brief.md](./artist-coordination-brief.md)
7. **View store, slot and overlay composition** — Shell 1.8.28 ships the Fish app: stored card and button slots, fish overlay, fallthrough hits. Gradients and cubic strokes are still missing. **[OPEN]** — [design/overlay-view-store.md](./design/overlay-view-store.md)

---

## Related docs

- [artist-coordination-brief.md](./artist-coordination-brief.md) — Ash handoff: views inventory, invariants, profile image gap
- [design/overlay-view-store.md](./design/overlay-view-store.md) — 2026-11-09 view store and overlay composition (plan; not shipped)  
- [platform-chrome-jrender.md](./platform-chrome-jrender.md) — chrome / parallax / Budget tabs implementation  
- [architecture.md](./architecture.md) — layers, mount model, sync honesty  
- [vocabulary.md](./vocabulary.md) — calHtml / boardHtml / Atlas / direct mount  
- [decisions.md](./decisions.md) — accepted product rules  
- [version-lineage.md](./version-lineage.md) — release trail  
- [archives/artist-jrender/jrender-exp7/API.md](./archives/artist-jrender/jrender-exp7/API.md) — shared GPUContext, scenes, Renderer  
