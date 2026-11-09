# Artist coordination brief — Ash Tangent Residual Artist

**Authorized by:** Matthew **[REQ 2026-11-08]** — coordinate with **Ash Tangent Residual Artist** (creator of JRender) for a **full art workflow** pass: update UX/UI for **all views**, and **add profile image render support**.

**Platform tip when this brief was opened:** Exp7 Platform **1.8.3** (lean SHA-256 `2033acab6ed923098b4ab37b52581a7490cb0da5b77ef05016593ff9015d6c98`).  
**Shell on main when the SVG direction was written:** **1.8.21** (PR #46, lean SHA-256 `8a767838f1af3f5ceb1f5b96faaa5711348957ad4b54381eec4055457dca1136`).  
**Evidence:** [EVIDENCE.md](./EVIDENCE.md). Implementation chrome: [platform-chrome-jrender.md](./platform-chrome-jrender.md). Direction: [views-jrender-standard.md](./views-jrender-standard.md).

**This document is the handoff packet.** It does not replace Ash’s art pipeline; it scopes what Exp7 consumes and what must stay invariant.

## Direction (2026-11-08, evening CT): draw the light, let the state machine play it

Matthew looked at shells 1.8.10 through 1.8.21 and said a lot was added and little of it reads as a visual change. Those shells approximate lighting with extra rectangles in the JRender display list: sampled penumbra rows, a face lip, a fading top, a glass body, a separate ground node, and short pose eases. He likes that the effort is there. It is not the design, and it will be replaced.

The design is the one Ash already runs. An SVG drawing carries the light, the soft shadow, the glass, and the lip. The state machine only chooses which drawing is on screen. Hover, press, focus, selected, dragging, drop-pending, and invalid are drawings (or the same drawing with opacity and scale keyed from the state table). The engine does not invent a new shadow out of rectangles. Click-path motion stays at most 120 ms, and the click itself is not delayed. Nothing loops while the pointer is still. Reduced motion shows the resting drawing.

The rectangle lighting from 1.8.21, including the ground-shadow nodes and the id jump that stopped the first draw from stalling, stays until a drawn pose replaces a procedural node. When a drawing replaces a node, remove that node in the same change so the two do not stack. Do not add another rectangle-lighting pass. 1.8.22 does not do that replacement. It adds board and budget controls on the same state machine.

| Pose | What the drawing shows |
|---|---|
| idle | Rest card. Contact shadow for the 1.15 px rest height. Top light from the one light (azimuth 90, elevation 50). |
| hover | Tighter shadow, lift 2. Scale 1.01 on a free control. A day or a stacked row does not move or grow. |
| focus | Navy edge `[36,88,166]`. Same body as rest. |
| pressed | Scale 0.97. Shadow tightens. The edge may go navy while the pointer is down. |
| selected | Gold edge `[117,81,15]`. Best is not this pose. Best stays the idle drawing. |
| dragging | Wider, softer shadow (the table's drag lift is 12). A day does not scale up. A free control may go to scale 1.02. |
| drop-pending | Gold edge and a warm wash, board rows only, on the first drag move. This is not the invalid red. |
| invalid | Caution edge `[170,0,0]`. |
| disabled | The resting drawing at the table's disabled treatment. The label stays readable. The old 2.16 contrast on faded text does not pass. |

Glass is a drawn layer on dark fills, static, with no speckles. A caustic speck waits on a new on/off proof that it is real caustic light. Days and stacked rows must not overlap or crop. The same drawings cover the calendar, the board, the plan, sections, free buttons, Apps cards, and the bar.

JRender stays the only product renderer. There is no second CSS renderer beside the canvas. The open job is playback: the events the views already emit select the drawn pose, and that pose is what the user sees for light and shadow. The old TDD/Slate `data-sm` player is a record of how a state attribute indexed drawings. It is not a renderer to ship.

### Drawing apps

Affinity is the historic name for the draw step. The packet Ash delivered on 2026-11-08 was authored in **DesignCraft 0.18.0**, exported through **Inkscape 1.4-beta2**, with one **Blender 5.2.3** light study. Moho was not used on that packet. PhotoCraft was not part of it. The full contract, the Inkscape mask repair, and the draw-list playback test are in [design/authored-ui-packet.md](./design/authored-ui-packet.md). The 9 Nov 2026 overlay packet (view store, slot views, fish overlay) is reviewed in [design/overlay-view-store.md](./design/overlay-view-store.md). It is not loaded by the shell.

`docs/design/svg-state-card.svg` is an earlier integration fixture. It is not the DesignCraft packet, and it is not on the product canvas.

---

## 1. Roles

| Role | Owns |
|------|------|
| **Ash (Artist)** | JRender (wasm + host ABI), art/motion pipeline, view visual language, **profile/image rendering capability**, state tables / lighting / parallax quality bar. Historic draw app: Affinity. The 2026-11-08 UI packet was authored in DesignCraft 0.18.0. |
| **Exp7 Platform (this repo)** | Shell, Exp7Views host (`exp7-views@1`), atlas/proposal circuits, Budget IDB, packing lean release, DOM PAT overlays |
| **Matthew** | Acceptance on Mac Safari **[USER-HW]**; opens/closes Artist contact |

**Hard rule unchanged:** Exp7 never reimplements JRender and never ships a second fallback renderer. Without WebGPU → plain error + diagnostics. **[REQ]**

---

## 2. Mission for this coordination

1. **Full art workflow** over **all shipped views** so UX/UI matches Ash’s quality bar (perspective, one light, state table, click-path ≤120 ms, reduced motion, idle gates — per Artist pipeline / template).  
2. **Profile image render support** in JRender (and then wired into platform chrome avatar + any view that needs faces/photos).  
3. Keep **universal views, per-app data**: Cal/Board/Plan design changes land once in Exp7Views / JRViews / JRender; atlases stay per app. **[REQ]**

Historical TDD/Slate **CSS player** contract is **not** a prescription to replace WebGPU JRender with CSS. The light and shadow still come from SVG drawings the state machine selects, as in the direction section above. Engine design, state table, and QA gates **do** apply; packing limits for Slate do **not** apply to Exp7 single-HTML. See [archives/artist-jrender/README.md](./archives/artist-jrender/README.md).

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
- **JRDI/1 host image ABI** ([docs/api/IMAGE-ABI.md](./api/IMAGE-ABI.md), packed `jrender-images` in lean): textured circular overlays on shared `GPUContext` / same render pass. Not a wasm DL op (shipped wasm rejects unknown ops).  
- `PlatformChromeJR` consumes JRDI for the reserved-bar avatar: exclusive photo **xor** initials/soft-disc; public GitHub avatar HTTPS hosts only.  
- Archived JRender API still has no wasm DL image op; JRDI is the documented host extension pending any future wasm bump from Ash’s tree.  
- Mac WebGPU / LIVE-GPU paint remain **[USER-HW][OPEN]** on cloud.

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
4. Playback inside the one draw-list renderer. The pixels of light and shadow are the DesignCraft layers, and the state machine picks the pose. `ja-*` HTML stays the layout source for text, hits, and forms. Measured gap, in `docs/design/authored-ui-packet.md`: a cubic fill loads; a linear or radial gradient with stop alpha does not; a cubic stroke does not (a fill of the ring path paints the interior). Do not rasterize the card through the avatar image store, and do not stack a flat solid on the 1.8.21 rectangles. The legacy `jr_ptr(4)` gradient shader is not the view path.  
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
| **2026-11-08** (evening CT) | Matthew directed that 1.8.10–1.8.21 rectangle lighting be replaced by SVG drawings the state machine plays. `docs/design/svg-state-card.svg` is a fixture. Shell stays 1.8.21 until a drawing is wired in. |
| **2026-11-08** (later, same evening) | Ash delivered the DesignCraft 0.18.0 packet. Playback of its gradients and strokes failed on the view draw list. Record: `docs/design/authored-ui-packet.md`. The lean file was not changed. This is not a finished workflow. |
| **2026-11-09** | Ash delivered the overlay packet: a view store, slot card and button, and a fish overlay in one `layout()`. Record: `docs/design/overlay-view-store.md`. Shell 1.8.28 runs that page as the Fish app. Gradients and cubic strokes are still missing from the view path. |

Messages to Ash should carry this brief (or a short pointer to it) and must not include PATs, private financial data, or software-repo write keys.
