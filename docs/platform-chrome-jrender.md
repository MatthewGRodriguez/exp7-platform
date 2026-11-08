# Platform chrome on JRender (1.8.6)

**Status:** Implementation reference for the shipped lean tip **1.8.6** **[MEAS]** (JRDI + UX states; app-slot reveal).  
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


## App switch / WebGPU reveal (1.8.6)

Mounted apps stay alive under `.appSlot[hidden]` / `#appShell` `visibility:hidden` while the apps picker is open. WebGPU canvases with transparent clear lose pixels when not composited. **Reuse** of an already-mounted app (`openApp` when `UI.slots[id].mounted`) and closing the apps overlay must call `revealAppViews(appId)` so JRViews re-queue (`why:'reveal'`) / redraw. Exp7Slabs `visible()` ignores hidden `.appSlot` and a visibility-hidden `#appShell` so parallax does not keep drawing buried canvases.
