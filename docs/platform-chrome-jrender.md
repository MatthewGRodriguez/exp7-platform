# Platform chrome on JRender (1.8.7)

**Status:** Implementation reference for the shipped lean tip **1.8.7** **[MEAS]** (JRDI + UX states; app-slot reveal).  
**Direction doc:** [views-jrender-standard.md](./views-jrender-standard.md).  
**Evidence:** JRDI + PlatformChromeJR profile path packed into `exp7-platform/exp7-platform-lean.html`; Mac parallax/LIVE-GPU still **[USER-HW][OPEN]**. See [api/IMAGE-ABI.md](./api/IMAGE-ABI.md) and [design/state-table.md](./design/state-table.md).

---

## Intent

Product chrome that the user sees while using Cal / Board / Plan must move with **Exp7Slabs** parallax — the same motion path as the views. That means:

- back button  
- avatar (icon)  
- apps picker buttons  
- Budget Calendar / Board / Plan tabs  
- Budget Board type tabs (expense / income / debt / asset)  

Account / key overlays stay **DOM** (PAT never enters canvas text) **[REQ]**.

---

## Pipeline (one sentence)

`HTML (ja-* / data-jv-act) → JRViews.View.show → JRender → Exp7Slabs` on every painted chrome surface and every Exp7Views canvas.

Exp7Slabs wraps `JRViews.View.prototype.show` and registers a slabs controller per view; pointermove is global, so all live JRViews canvases parallax together when WebGPU is available.

---

## Surfaces

| Surface | How it is drawn (1.8.4) | Hits | Fallback without WebGPU |
|---------|-------------------------|------|-------------------------|
| Reserved top bar (back + avatar + “Exp7”) | `PlatformChromeJR` → JRViews on `#jrChromeCanvas` | **Canvas** (`#jrChromeHost` `pointer-events:auto` when `jr-on`); DOM `#btnBack` / `#btnAvatar` opacity 0 + `pointer-events:none` (keyboard still reaches DOM) | DOM buttons visible; `jr-on` off |
| Apps picker | `PlatformChromeJR.redrawApps` → JRViews on `#jrAppsHost` canvas | Canvas (`data-jv-act=plat:app:*`) | DOM `#appButtons` |
| Budget Cal / Board / Plan (+ type) tabs | Injected into each view document by `budgetChromeDoc` **after** `planDoc` | In-scene JRViews acts → `window.__budgetChromeAct` | DOM `#budgetTabs` / `#boardTypeTabs` |
| Account / key / share / package UI | DOM `#accountMenu` | DOM | DOM |
| Exp7 demo / Budget Cal·Board·Plan **content** | Exp7Views → JRViews → JRender | JRViews | `.jrerr` (no substitute renderer) **[REQ]** |

---

## PlatformChromeJR

**Shipped in** `exp7-platform/exp7-platform-lean.html` (`data-exp7-shared` script blocks: `jrender-images`, `jrviews-ux-states`, PlatformChromeJR profile path).

- `start()` / `redraw()` — paint bar  
- `redrawApps()` — paint apps overlay  
- `setAvatarInfo(url, login)` — JRDI circular profile photo when ready; exclusive initials/soft-disc on absent/failure (1.8.4)  

- `active()` / `appsActive()` / `error()` — diagnostics (`chrome_jr` records at startup)

Acts are routed through `window.__platformChromeAct`:

| `data-jv-act` | Effect |
|---------------|--------|
| `plat:back` | Same as `#btnBack` (show apps) |
| `plat:avatar` | Same as `#btnAvatar` (account menu) |
| `plat:app:exp7` / `plat:app:budget` | `hideAppsOverlay` + `openApp(id)` |

**Why canvas hits (1.8.3):** JRViews layout of `ja-bar` / `ja-joy` does not match the old DOM flex geometry. Painting with JR while leaving DOM buttons as hit targets produced **offset clicks**. When `jr-on`, the canvas is the hit surface so paint and hits share one layout.

---

## Budget in-scene tabs

**Packed from** `src/budget/budget-app.{html,js}` + host `budgetChromeDoc` in `src/exp7-views/views-host-impl.js`.

### Injection

1. Runtime builds view HTML (`calHtml` / `boardHtml` / `depsHtml`).  
2. `hostDoc` strips `header.ja-top`, rewrites visible “exp6” → “Exp7”, applies cal/board host polish.  
3. If Plan: `planDoc` **removes every child except `.ja-deps`**.  
4. **`budgetChromeDoc` runs last** — inserts `[data-exp7=budget-chrome]` with Cal / Board / Plan (`data-jv-act=budget:tab:*`) and, when `__budgetUi.tab === 'brd'`, type buttons (`budget:board:*`).

Only atlases with `meta.budget` get this chrome (Budget’s own IDB atlas). Exp7 demo trip atlas does not.

### Acts

`window.__budgetChromeAct`:

- `budget:tab:cal|brd|plan` → `showTab` + redraw views so hostDoc chrome highlights update  
- `budget:board:expense|income|debt|asset` → Board tab + type pane + redraw  

Host `onact` for `jv` also routes `budget:` / `plat:` before cal/board/plan acts.

### Hiding DOM duplicates (1.8.3 lesson)

Platform `injectAppDirect` runs `scopeAppCss`, which prefixes every selector with `#appSlot-budget`. Rules like `html.budget-jr-chrome #budgetTabs` become `#appSlot-budget html.budget-jr-chrome #budgetTabs` and **never match**.

Shipped fix:

1. Wrapper `#budgetRoot.budget-root` inside the slot; class `jr-chrome` toggled when a view has drawn (`JVS[id].n > 0`, no `.jrerr`).  
2. Scoped-safe CSS: `.budget-root.jr-chrome #budgetTabs` → `#appSlot-budget .budget-root.jr-chrome #budgetTabs`.  
3. Inline `display:none !important` / `removeProperty` as belt-and-suspenders.  
4. Re-check after async draw (`scheduleChromeMode` + delayed timeouts + `onUpdate` / `onError`).

Without WebGPU, `.jrerr` appears → `jr-chrome` off → DOM tabs remain usable.

---

## Budget boards (data)

| Tab | Mount | Atlas |
|-----|-------|--------|
| Calendar | one Cal root | Combined membership across types |
| Board | **four** Board roots: expense / income / debt / asset | `meta.boardIds`; `ensureBudgetBoards` |
| Plan | `comp:reqs` (deps) | Combined membership |

Data stays in Budget IDB (`budget-app-v1`). Not proposal-synced. Demo trip data is separate. **[REQ]** universal views ≠ shared data.

---

## Layout contract (shell)

```
#topChrome          position:fixed; height: var(--bar-h)   ← reserved bar
#appShell           position:fixed; top: var(--bar-h); …  ← app content below bar
#appsOverlay        top: var(--bar-h)                     ← apps full-bleed under bar
#accountMenu        DOM overlay (PAT / share / packages)
```

Solid reserved bar (not a transparent overlay covering app tabs) **[REQ]** / **[MEAS 1.7.9+]**.

---

## What is still open

| Item | Notes |
|------|--------|
| Account / key / share panel as JRender | Stays DOM by design until a safe PAT-free scene design exists **[OPEN]** |
| Exp7 demo `#tabs` nav in-scene | Still DOM; only Budget Cal/Board/Plan chrome is in-scene **[OPEN]** |
| True single scene graph for bar + app | Today: **multiple JRViews canvases**, shared Core/GPUContext + global slabs pointer; not one DisplayList **[OPEN]** |
| Mac USER-HW parallax / hit proof | Cloud VM = `no-adapter`; Safari on Matthew’s Mac is acceptance **[USER-HW][OPEN]** |

---

## Release trail (chrome / views)

| Version | What landed |
|---------|-------------|
| 1.7.8 | `Exp7Views.mountSurface` — N views, one shared JRender |
| 1.7.9 | Reserved bar JRender paint (`PlatformChromeJR` DL era); shell hosts Exp7Views once |
| 1.8.0–1.8.1 | Budget four type boards; Cal start; chrome cleanup |
| 1.8.2 | Bar + apps via **JRViews**; Budget tabs in `hostDoc` |
| **1.8.3** | Hide DOM tabs (scoped CSS fix); Plan chrome after `planDoc`; bar **canvas hits** |

See [version-lineage.md](./version-lineage.md).

---

## Related source (build inputs; packed into lean)

| Path | Role |
|------|------|
| `src/shell/platform-chrome.html` | Shell markup + chrome CSS |
| `src/shell/platform-chrome-jr.js` | PlatformChromeJR |
| `src/shell/platform-shell.js` | Mount, `__platformChromeAct`, IDB, sync |
| `src/exp7-views/views-host-impl.js` | `hostDoc` / `planDoc` / `budgetChromeDoc` / acts |
| `src/exp7-views/exp7-views.js` | `mountSurface`, `ensureBudgetBoards`, module id |
| `src/budget/budget-app.{html,js}` | Budget consumer + DOM fallback tabs |
| `src/exp7-views/vendor/slab-config.js` | Exp7Slabs |
| `build/build.mjs` | Assembles two-file release |


## App switch / WebGPU reveal (1.8.7)

Mounted apps stay alive under `.appSlot[hidden]` / `#appShell` `visibility:hidden` while the apps picker is open. WebGPU canvases with transparent clear lose pixels when not composited. **Reuse** of an already-mounted app (`openApp` when `UI.slots[id].mounted`) and closing the apps overlay must call `revealAppViews(appId)` so JRViews re-queue (`why:'reveal'`) / redraw. Exp7Slabs `visible()` ignores hidden `.appSlot` and a visibility-hidden `#appShell` so parallax does not keep drawing buried canvases.


## WebGPU keepalive (1.8.7)

Safari / Shortcuts: `display:none` or `#appShell { visibility:hidden }` zeroes layout for in-slot canvases; JRender sets `renderer.hidden` and skips draw until a later **resize with real size**. A plain `View.show` patch path does not resize when W/VH are unchanged, so content stays blank white while `#topChrome` (separate canvas) still paints.

- Inactive `.appSlot` uses `.is-dormant` (opacity 0, still laid out) — not `display:none`
- Apps overlay covers shell; does not `visibility:hidden` the shell
- `revealAppViews` calls `renderer.resize` then `draw`, then re-queues JRViews


## Back overlay and return (1.8.8)

`#appsOverlay.jr-on` stays an opaque `#f6f7f9` plate (promoted layer). While Back is open, `#appShell.is-apps-covered` sets slot opacity to 0 so a WebGPU canvas cannot composite through the picker. Closing Back or reusing a mounted app calls `revealAppViews` only for hosts with a real on-screen box — hidden Budget panes are not resized — and `View.show` uses `{rebuild:true}` so the visible scene is reloaded onto the swapchain.

## State-table material in the draw list (1.8.8)

`jrviews-ux-states` runs inside `JRViews.layout` for Cal, Board, Plan, and chrome controls that share that layout (`.ja-day`, `.ja-brow`, `.ja-prow`, `.ja-joy`, buttons). It is still one JRender display list, not a CSS or PNG stand-in.

- `ja-sel` maps to Selected. Class `best` does not.
- Selected / focus / invalid / drop-pending / pressed rings use the state-table colors (gold `[117,81,15]`, focus navy `[36,88,166]`, caution `[170,0,0]`).
- One light from above (archive params elevation 50°): a 2px inset highlight and a 2px inset contact shade. Shade alpha is `36 + lift*14`, with lift from `docs/design/state-table.json`. Both bands stay inside the fill.
- Calendar days do not scale above 1, so a drag pose cannot cover the next cell.
- `JRender.POSES` uses the same scale, lift, and opacity numbers. `ViewStates` still snaps idle calendar transforms back to identity after a selection update, so the resting look is the display-list material above.

What this pass does not emit: Blender caustics, a gaussian shadow outside the cell, Moho frame playback, or a perspective camera on the live canvas. Those remain study artifacts. See `docs/design/visual-delivery.md`.

## Style pass and Budget return (1.8.10)

`View.show` calls `window.JRViews.layout`, which is the state-table wrapper. Exp7 `show()` only toggles sections inside `#appSlot-exp7`. `revealAppViews('budget')` restores the Budget tab from `__budgetUi` before it measures canvases.

## Apps picker and header icon (1.8.11)

The Apps list you see is the JR canvas (`#appsOverlay.jr-on` hides the DOM cards). `parseFloat("4.5rem")` is 4.5, so those buttons were one text line, and each one sat inside a full-width `ja-section` frame. The canvas now lays out two-line cards (`min-width:220px; min-height:72px`). `cssPx` treats `rem` as 16px.

The header canvas was 90px tall inside a 44px bar, so the icon was cropped, and every reveal reloaded the photo. The bar scene is 44px with no document margin. A redraw keeps a ready photo instead of clearing it and fetching it again. `chromeJr` in the debug paste records the card boxes, the bar height, and whether the redraw kept the photo.

## Header and Apps parallax (1.8.12)

Exp7Slabs only moves a node that is a slab, or that sits inside one. The 44px bar is the outer slab (`data-plat="bar"`), so Back, the avatar, and the word Exp7 move together. The avatar photo uses that same outer factor. Each Apps card (`data-jv-act` starting `plat:app:`) is its own inner slab, so the cards move against the header. The Apps plate is the outer slab on that canvas. Closing Back pauses the Apps canvas so it does not keep a frame loop while hidden.

`chromeJr.barSlabs.kinds` includes `outer`. With Back open, `chromeJr.appsSlabs.kinds` includes `inner`.

## Lift and contact shadow (1.8.13)

`jrviews-ux-states` now uses the state-table lift as motion on free controls and as a contact shadow in the gap. Days and stacked rows do not translate. `style.note` reports how many controls lifted and how many contact shadows are in the display list. Pointer enter / down / up patch a transform; reduced motion skips it. No idle frame loop was added.

## Measured penumbra (1.8.14)

`jrviews-ux-states` samples the published shadow fit into one-pixel rows and stops at the next fill. Dark fills get the static glass brightening. The pose uses the 85 mm scale only when the shift is at least half a pixel. `style.note` counts penumbra rows. Exp7 `show` toggles sections inside `#appSlot-exp7` and does not write `window.budget`.

## Face lip and click ease (1.8.15)

The inset shade is the same sampled falloff as the cast shadow, kept inside the cell. Pointer hover and press ease for the state-table duration and then stop. Reduced motion clears the transform.

## Drag and key press (1.8.16)

Drag start eases a free control toward the dragging pose and leaves a day or a stacked row at its own size. Drag end eases back. Enter and Space shrink the control the same way a press does. Drag moves do not start another ease. The focus ring is still the one drawn at layout.

## Drop-pending gold (1.8.17)

The first move of a board row snaps its edge to gold `[117, 81, 15]`. Invalid stays caution red `[170, 0, 0]`. A day, a plan row, and a button do not take that edge. Drag end restores it. The row does not grow or rise.

## Soft top light and pressed edge (1.8.18)

The top of a card fades through the same sampled kernel as the shadow. Press turns the edge navy `[36, 88, 166]`, and release restores it. A day still does not rise.

## Glass body (1.8.19)

A dark fill brightens through the middle at white alpha 12, between the existing top and bottom lines. A near-white fill does not. Specks stay out.

## Ground shadow (1.8.20)

The cast shadow is a node behind the face. Hover lifts the face and leaves the shadow on the ground. A day still does not rise.

## Debug handoff (1.8.9)

1.8.9 does not change painting. The bar has a **Debug** button (Shift+D) that stays clickable above the chrome canvas. It copies a JSON snapshot: shell version, overlay and slot opacity, which element is on top of the content, canvas sizes, GPU and view errors, and whether the live display list contains the 1.8.8 inset bands and gold rings. `style.note` states that in one sentence. No keys or account text.
