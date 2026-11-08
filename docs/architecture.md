# Architecture

## Layers (as designed)

```
Launcher HTML (tiny, no platform embedded)
    │  fetch release.json (unauthenticated, commit-pinned) + SHA-256
    │  same-window postMessage key handoff (once, 15s)
    ▼
Platform shell (release payload HTML)
    ├── Top chrome: back + avatar only  [REQ]
    ├── Account / share / Add user (behind avatar)
    ├── App picker (via back)
    └── Direct-mounted apps in #appSlot-* (no iframe)  [REQ]
            ├── Exp7 lean (embedded apppkg) — Atlas + JRender views
            └── Budget — MUST reuse real Exp7 Cal/Board/Plan  [REQ]
```

Personal **data** stays in a separate user GitHub repo. Software updates must never overwrite personal data. [REQ]

## JRender [REQ 2026-11-03 … 11-06]

- All genuine Exp7 views are drawn by **real JRender** (Artist’s renderer), never a reimplementation.  
- **No fallback renderer:** without WebGPU / wasm, show a plain error with diagnostics.  
- Shipped path: core wasm (`wasm32-unknown-unknown`, 0 imports) + thin JS host. WASI 0.3 migration **not done**.  
- Light theme; transparent backgrounds; panels/text must stay readable.  
- **No message to the Artist is authorized** in this documentation pass. Storage renames wait on coordinated Artist codec naming. [REQ]

## Views standard — one JRender everywhere [REQ 2026-11-08 direction]

See **[views-jrender-standard.md](./views-jrender-standard.md)** for the accepted path:

- **Universal views, per-app data** — one Exp7Views design for Cal/Board/Plan; each app keeps its own atlas.  
- **One renderer, many views** — same or different view kinds; app-owned scene content in the same composition.  
- **Destination:** apps and the platform shell draw entirely with JRender (one JRender for everywhere). Shell-in-JRender is **not** claimed done on `main` yet **[OPEN]**.

## Verified `main` mount model (1.5.0) [MEAS 2026-11-08]

On commit `69a2cd9bb34a18926ee1e4b8db73b56406e6a6fb`:

- Shell boundary string documents **“app-first direct mount (no iframe)”**.  
- Apps inject into `#appSlot-exp7` and `#appSlot-budget` via DOMParser + script execution in-page.  
- `iframe` appears only inside that boundary comment string (not as an embedding element in the shell markup checked).  
- Exp7 package is base64 `apppkg`. Budget is a **separate** base64 `budgetpkg`.

## Sync boundary (incomplete by requirement honesty) [REQ] + [MEAS]

| Path | On verified `main` 1.5.0 |
|------|---------------------------|
| Exp7 | Automatic **proposal-op** sync under `exp7-app-v1/` when key+target ready |
| Budget | **Local IndexedDB only** — not proposal-synced |
| Full application-level sync | **Required direction**, **not** claimed complete |
| Cross-device | Matthew treated as “good enough / assumed” (2026-11-07); **not measured** [OPEN] |

Do not document platform sync as “full app sync.”

## Chrome layout — requirement vs `main`

**[REQ]** Reserved fixed header: back + avatar; app content starts **below** the bar; never floating overlays covering tabs/content.

**[MEAS on main 1.5.0]** `#topChrome` is `position:fixed` with `background:transparent` and `pointer-events:none` (controls re-enable pointer events). `#appShell` uses `inset:0` with `padding-top: var(--bar-h)`. That reserves some vertical padding but keeps a **transparent overlay** pattern — **not** the solid reserved bar called out in later corrections (t1738u). See [requirements-vs-main.md](./requirements-vs-main.md).

## Budget — requirement vs `main`

**[REQ]** Budget uses **real** Exp7 Calendar / Board / Plan (`calHtml` / `boardHtml` / plan+`depsHtml`) via the **same** Exp7Views module as demo — universal view design, Budget’s own IDB atlas (data not shared). Optional finance tags / harmonic shares stay outside forked builders (not auto-dollars).

**[MEAS on main 1.5.0]** Embedded `budgetpkg` (~19 789 B decoded) defined **`renderCal` / `renderBoard` / `renderPlan`** stubs. Later `main` releases (1.7.x) re-packed Budget onto Exp7Views; **re-measure tip** before treating any substitute claim as current. See [views-jrender-standard.md](./views-jrender-standard.md).

## Security shape [REQ]

- PAT in **session memory only**; clear masked input after read.  
- Never IndexedDB / localStorage / sessionStorage / logs / URLs / globals / DOM beyond masked input / child frames.  
- Validate read-only: GitHub `/user` + user’s public data repo.  
- Network: `api.github.com` only, `credentials:'omit'`, refuse redirects; release reads unauthenticated + commit-pinned.  
- Refuse a key that can write the **software** repo.  
- Trust limit: SHA proves integrity of fetched bytes, not publisher benevolence → branch protection + 2FA recommended.
