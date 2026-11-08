# Artist coordination brief — Ash Tangent Residual Artist

**Authorized by:** Matthew **[REQ 2026-11-08]** — coordinate with **Ash Tangent Residual Artist** (creator of JRender) for a **full art workflow** pass: update UX/UI for **all views**, and **add profile image render support**.

**Platform tip this brief targets:** Exp7 Platform **1.8.3** on `main` (lean SHA-256 `2033acab6ed923098b4ab37b52581a7490cb0da5b77ef05016593ff9015d6c98`).  
**Evidence:** [EVIDENCE.md](./EVIDENCE.md). Implementation chrome: [platform-chrome-jrender.md](./platform-chrome-jrender.md). Direction: [views-jrender-standard.md](./views-jrender-standard.md).

**This document is the handoff packet.** It does not replace Ash’s art pipeline; it scopes what Exp7 consumes and what must stay invariant.

---

## 1. Roles

| Role | Owns |
|------|------|
| **Ash (Artist)** | JRender (wasm + host ABI), art/motion pipeline (Affinity → Moho → Blender → Moho → web/JRender emission), view visual language, **profile/image rendering capability**, state tables / lighting / parallax quality bar |
| **Exp7 Platform (this repo)** | Shell, Exp7Views host (`exp7-views@1`), atlas/proposal circuits, Budget IDB, packing lean release, DOM PAT overlays |
| **Matthew** | Acceptance on Mac Safari **[USER-HW]**; opens/closes Artist contact |

**Hard rule unchanged:** Exp7 never reimplements JRender and never ships a second fallback renderer. Without WebGPU → plain error + diagnostics. **[REQ]**

---

## 2. Mission for this coordination

1. **Full art workflow** over **all shipped views** so UX/UI matches Ash’s quality bar (perspective, one light, state table, click-path ≤120 ms, reduced motion, idle gates — per Artist pipeline / template).  
2. **Profile image render support** in JRender (and then wired into platform chrome avatar + any view that needs faces/photos).  
3. Keep **universal views, per-app data**: Cal/Board/Plan design changes land once in Exp7Views / JRViews / JRender; atlases stay per app. **[REQ]**

Historical TDD/Slate **CSS player** contract is **not** a prescription to replace WebGPU JRender with CSS. Engine design, state table, and QA gates **do** apply; packing limits for Slate do **not** apply to Exp7 single-HTML. See [archives/artist-jrender/README.md](./archives/artist-jrender/README.md).

---

## 3. Inventory — what “all views” means today

### 3.1 Universal Exp7Views (every app)

| View | Builder path | Typical roots | Notes |
|------|--------------|---------------|--------|
| **Calendar** | `calHtml` → JRViews → JRender | `['comp:<calId>']` | Month/day nav, selection, chips; host strips moneyPreset chrome |
| **Board** | `boardHtml` → JRViews → JRender | `['comp:<boardId>']` | Sort/filter; alts; Budget mounts **four** boards (expense/income/debt/asset) |
| **Plan** | `depsHtml` / plan host polish → JRViews → JRender | `['comp:reqs']` | Dependencies & sequence; what-if clone path |

Module id: **`exp7-views@1`**. Presentation: `runtime-html-string → JRViews → JRender`. Motion: **Exp7Slabs** on `JRViews.View.show`.

### 3.2 Platform chrome (JRViews canvases, 1.8.3)

| Surface | Path | Hit model |
|---------|------|-----------|
| Reserved bar (back + avatar + label) | `PlatformChromeJR` → JRViews | Canvas hits when `jr-on` |
| Apps picker | `PlatformChromeJR.redrawApps` | Canvas hits |
| Budget Cal/Board/Plan (+ type) tabs | `budgetChromeDoc` in view document | In-scene acts |
| Account / key / share / packages | **DOM** | PAT never in canvas **[REQ]** |

### 3.3 Out of scope for “replace with CSS”

- DOM account/key overlays (keep DOM while PAT is session-memory only).  
- Launcher HTML (separate tiny file).  
- Canceled search/scheduler/Timefold lines — **do not resume**. **[REQ]**

---

## 4. Profile image render support (gap)

### Today [MEAS] (updated 1.8.4-art review)

- DOM `#btnAvatar` can show a GitHub profile `<img>` **or** initials fallback (exclusive `.is-on`).  
- **JRDI/1 host image ABI** (`art/api/IMAGE-ABI.md`, packed `jrender-images`): textured circular overlays on shared `GPUContext` / same render pass. Not a wasm DL op (shipped wasm rejects unknown ops).  
- `PlatformChromeJR` consumes JRDI for the reserved-bar avatar: exclusive photo **xor** initials/soft-disc; public GitHub avatar HTTPS hosts only.  
- Archived JRender API still has no wasm DL image op; JRDI is the documented host extension pending any future wasm bump from Ash’s tree.  
- Mac WebGPU paint / Blender / Moho stages remain **[USER-HW][OPEN]** / **[BLOCKED]** on cloud — see `artifacts/art-ux-profile-2026-11-08/qa/`.

### Ask of Ash

Design and ship **profile/image rendering** in real JRender such that Exp7 can:

1. Draw a **circular (or clipped) profile photo** in the reserved bar (and optionally in views) with the same hit/parallax path as other nodes.  
2. Fall back cleanly when the image fails or is absent (initials / soft disc) — exclusive, never dual.  
3. Respect: CORS / tainted canvas rules for GitHub avatars; reduced motion; DPR; shared `GPUContext`; no PAT or raw key material in any image URL pipeline beyond public avatar URLs Matthew already loads in DOM.  
4. Document the ABI (DL op / load / patch / free) in the same style as `API.md` / JRB so Exp7Views / PlatformChromeJR can consume it without forking the renderer.

Exp7 will wire the consumer after Ash lands the primitive (bar first; then any Board/Cal affordances Ash designs).

---

## 5. Invariants Ash should not break

| Invariant | Why |
|-----------|-----|
| Real JRender only; no second renderer | **[REQ]** |
| Shared Core + `GPUContext` across canvases | Shell hosts once; N views |
| Views emit; hosts propose | Spec 42; no atlas writes inside builders |
| Universal builders — no `budget-mode` forks inside `calHtml`/`boardHtml` | Data stays per-app |
| Reserved bar geometry — app content below `#topChrome` | **[REQ]** |
| Click-path visuals ≤ 120 ms; never gate the action | Artist pipeline |
| Reduced motion / hidden tab pause | Artist pipeline + Exp7Slabs |
| ASCII-safe shipped blocks where Ash packs text | Artist gates |
| Storage/codec renames stay coordinated (`atlas/1` / JRBA) | Historical OPEN — confirm before Exp7 storage edits |

---

## 6. Suggested art workflow (Ash’s pipeline)

Ash runs the full pipeline (parameters → draw → perspective → state table → Blender → trace → Moho → emit for **JRender/JRViews**, not Slate CSS-as-product). Template reference: [archives/artist-jrender/workflow-template/ui-motion-art-pipeline.md](./archives/artist-jrender/workflow-template/ui-motion-art-pipeline.md). Historical report: [archives/artist-jrender/tdd-animation/](./archives/artist-jrender/tdd-animation/).

**Priority order (proposed):**

1. **State table + visual language** for Cal / Board / Plan (idle/hover/pressed/selected/dragging/invalid/…).  
2. **Profile/image primitive** in JRender + bar avatar consumption design.  
3. **Chrome controls** (back, tabs, app tiles) consistent with view language + Exp7Slabs.  
4. Emit / pack into Exp7 consumable form (wasm/host bump + JRViews bridge notes).  
5. QA gates on **Matthew’s Mac** (WebGPU) — cloud VM is usually `no-adapter` **[MOCK]**.

---

## 7. Open items to resolve with Ash (do not invent answers)

1. Full **quality-gates** text cut off in the 2026-10-30 Artist report — re-obtain. **[OPEN]**  
2. Whether the **storage/codec update** after `atlas/1` landed — confirm before Exp7 storage changes. **[OPEN]**  
3. Image ABI shape (DL node vs external atlas vs GPU texture handle; CORS; memory caps).  
4. Whether view HTML (`ja-*`) stays the layout source with richer JRViews styling, or Ash prefers a different emission path into DL.  
5. WASI 0.3 host — still unfinished; shipped path remains wasm32 + thin JS. Do not block UX on WASI unless Matthew asks.

---

## 8. How Exp7 will integrate Ash’s deliverables

1. Drop updated wasm / `jrender*.js` / fonts into `src/exp7-views/vendor` (+ assets).  
2. Adjust `jrviews.js` / host only as needed for new DL ops (image, states).  
3. Update `PlatformChromeJR` to use profile images when the primitive exists.  
4. Rebuild lean via `build/build.mjs`; bump platform version; two-file release.  
5. Matthew **[USER-HW]** acceptance on Safari.

---

## 9. Contact status

| Date | Status |
|------|--------|
| Before 2026-11-08 | Artist contact **not** authorized |
| **2026-11-08** | Matthew authorized coordination with **Ash Tangent Residual Artist** for view UX/UI art workflow + profile image render support **[REQ]** |

Messages to Ash should carry this brief (or a short pointer to it) and must not include PATs, private financial data, or software-repo write keys.
