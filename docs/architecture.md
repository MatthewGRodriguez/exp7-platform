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

**[REQ]** Budget uses **real** Exp7 Calendar / Board / Plan (`calHtml` / `boardHtml` / plan+`depsHtml`), Board adapted for expense/income/debt/asset, optional per-joy harmonic shares (not auto-dollars).

**[MEAS on main 1.5.0]** Embedded `budgetpkg` (~19 789 B decoded) defines **`renderCal` / `renderBoard` / `renderPlan`** and does **not** contain `calHtml`, `boardHtml`, `JAtlasModel`, or `moneyCalendarTemplate`. It is a **substitute worksheet**, not the real Exp7 view stack. Manifest text saying “calendar/board/plan” is easy to misread as real views — it is not proof of `calHtml` reuse.

## Security shape [REQ]

- PAT in **session memory only**; clear masked input after read.  
- Never IndexedDB / localStorage / sessionStorage / logs / URLs / globals / DOM beyond masked input / child frames.  
- Validate read-only: GitHub `/user` + user’s public data repo.  
- Network: `api.github.com` only, `credentials:'omit'`, refuse redirects; release reads unauthenticated + commit-pinned.  
- Refuse a key that can write the **software** repo.  
- Trust limit: SHA proves integrity of fetched bytes, not publisher benevolence → branch protection + 2FA recommended.

## Exp7Views unbundle (1.7.0)

Reusable Calendar/Board/Plan live under `src/exp7-views/` (`exp7-views@1`). Demo and Budget are consumers. Presentation: runtime HTML string → JRViews → JRender (not legacy factory→innerHTML). See `docs/exp7-views/README.md`.
