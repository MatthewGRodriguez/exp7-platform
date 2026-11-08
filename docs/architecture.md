# Architecture

## Layers (as designed / shipped 1.8.3)

```
Launcher HTML (tiny, no platform embedded)
    │  fetch release.json (unauthenticated, commit-pinned) + SHA-256
    │  same-window postMessage key handoff (once, 15s)
    ▼
Platform shell (release payload HTML)
    ├── Top chrome: back + avatar — JRViews paint + canvas hits when GPU  [MEAS 1.8.3]
    ├── Account / share / Add user / packages (behind avatar) — DOM (PAT)  [REQ]
    ├── App picker (via back) — JRViews when GPU; DOM fallback
    └── Direct-mounted apps in #appSlot-* (no iframe)  [REQ]
            ├── Exp7 lean (embedded apppkg) — Atlas + Exp7Views → JRender
            └── Budget (embedded budgetpkg) — same Exp7Views module; own IDB atlas
                    Cal + 4 Board roots + Plan; tabs in-scene when JR paints
```

Personal **data** stays in a separate user GitHub repo. Software updates must never overwrite personal data. **[REQ]**

Chrome / parallax detail: [platform-chrome-jrender.md](./platform-chrome-jrender.md).  
Views direction: [views-jrender-standard.md](./views-jrender-standard.md).

## JRender [REQ 2026-11-03 … 11-06]

- All genuine Exp7 views are drawn by **real JRender** (Artist’s renderer), never a reimplementation.  
- **No fallback renderer:** without WebGPU / wasm, show a plain error with diagnostics (`.jrerr`).  
- Shipped path: core wasm (`wasm32-unknown-unknown`, 0 imports) + thin JS host. WASI 0.3 migration **not done**.  
- Light theme; transparent backgrounds; panels/text must stay readable.  
- Motion: **Exp7Slabs** wraps `JRViews.View.show` (pointer parallax + ambient).  
- Artist coordination with **Ash Tangent Residual Artist** authorized **2026-11-08** for view UX/UI art workflow + profile image render — [artist-coordination-brief.md](./artist-coordination-brief.md). **[REQ]**

## Views standard — one JRender everywhere [REQ 2026-11-08]

- **Universal views, per-app data** — one Exp7Views design for Cal/Board/Plan; each app keeps its own atlas.  
- **One renderer, many views** — `Exp7Views.mountSurface`; shared Core / `GPUContext`.  
- **Platform chrome on JRViews (1.8.3)** — bar + apps + Budget tabs; account/key DOM.  
- Still open: single DisplayList for bar+app; Exp7 demo nav in-scene; Mac USER-HW parallax proof.

## Verified `main` mount model (1.8.3) [MEAS 2026-11-08]

Tip commit: `d8f6ccdc171b49385e0a738e7451714741f5dd99` (merge PR #26).  
Release: **1.8.3** · SHA-256 `2033acab6ed923098b4ab37b52581a7490cb0da5b77ef05016593ff9015d6c98` · lean **1 868 344** B.

- Shell boundary: app-first direct mount (no iframe); shell hosts Exp7Views/JRender once; JRViews bar/apps; Budget tabs in-scene.  
- Apps inject into `#appSlot-exp7` / `#appSlot-budget` via `DOMParser` + `scopeAppCss(#appSlot-*)` + script execution.  
- Exp7 = base64 `apppkg`; Budget = base64 `budgetpkg` (shared views stripped; live from shell).  
- Module id: `exp7-views@1`.

## Sync boundary (honest incompleteness) [REQ] + [MEAS]

| Path | On `main` 1.8.3 |
|------|-----------------|
| Exp7 | Automatic **proposal-op** sync under `exp7-app-v1/` when key+target ready |
| Budget | **Local IndexedDB only** (`budget-app-v1`) — not proposal-synced |
| Full application-level sync | **Required direction**, **not** complete **[OPEN]** |
| Cross-device | Not measured **[OPEN]** |

Do not document platform sync as “full app sync.”

## Chrome layout [REQ] + [MEAS 1.8.3]

**[REQ]** Reserved fixed header: back + avatar; app content starts **below** the bar; never floating overlays covering tabs/content.

**[MEAS]** `#topChrome` fixed height `var(--bar-h)`; `#appShell` / `#appsOverlay` start at `top: var(--bar-h)`. When GPU works, `PlatformChromeJR` paints the bar on a JRViews canvas and that canvas takes pointer hits (`jr-on`). Account menu remains DOM.

## Budget [REQ] + [MEAS 1.8.3]

**[REQ]** Budget uses **real** Exp7 Calendar / Board / Plan via the **same** Exp7Views module; own atlas; no forked `boardHtml` / `calHtml`.

**[MEAS]** Budget mounts:

| Pane | Roots |
|------|--------|
| Calendar | one calendar component |
| Board | four boards: `board_expense` / `board_income` / `board_debt` / `board_asset` (`ensureBudgetBoards`) |
| Plan | `comp:reqs` (depsHtml) |

Cal/Plan see combined membership. Tab chrome is in-scene when JR paints; DOM tabs are the no-adapter fallback. See [platform-chrome-jrender.md](./platform-chrome-jrender.md).

## Security shape [REQ]

- PAT in **session memory only**; clear masked input after read.  
- Never IndexedDB / localStorage / sessionStorage / logs / URLs / globals / DOM beyond masked input / child frames.  
- Validate read-only: GitHub `/user` + user’s public data repo.  
- Network: `api.github.com` only, `credentials:'omit'`, refuse redirects; release reads unauthenticated + commit-pinned.  
- Refuse a key that can write the **software** repo.  
- Trust limit: SHA proves integrity of fetched bytes, not publisher benevolence → branch protection + 2FA recommended.  
- **PAT never enters JRender canvas text** — account/key UI stays DOM.
