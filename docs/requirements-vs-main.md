# Requirements vs verified `main` vs claims

**Verified tip [MEAS 2026-11-08]**

- Ref: `origin/main` = `d8f6ccdc171b49385e0a738e7451714741f5dd99`  
- Release: **1.8.3**  
- SHA-256: `2033acab6ed923098b4ab37b52581a7490cb0da5b77ef05016593ff9015d6c98`  
- Lean bytes: **1 868 344**  
- Open PRs: re-check with `gh pr list` (docs pass expected empty or docs-only)

Older gap tables that pinned **1.5.0** / PR #7 are **historical**; this file is the living matrix.

## Matrix

| Topic | Requirement [REQ] | On `main` 1.8.3 [MEAS] | Verdict |
|-------|-------------------|-------------------------|---------|
| Direct mount, no iframe | Required | Direct inject into `#appSlot-*` | **Met** |
| Software ≠ data repos | Required | README + sync paths | **Met** |
| App-first / last app | Default Exp7 then last | Present | **Met** |
| Chrome = back + avatar only | Minimal controls | Back + avatar in `#topChrome`; JRViews paint when GPU | **Met** (control set) |
| Whole avatar = control; exclusive fallback | Image **or** fallback | Exclusive `.is-on` gate in chrome CSS | **Met in source** — Mac screenshot acceptance still **[USER-HW]** |
| Reserved header, never overlay | Solid reserved bar; content below | `#topChrome` fixed height; `#appShell` `top: var(--bar-h)` | **Met** (layout) |
| Chrome moves with parallax | Back, avatar, apps, Cal/Board/Plan (+ type) on slabs path | PlatformChromeJR + Budget `budgetChromeDoc`; Exp7Slabs on `View.show` | **Shipped** — Mac parallax proof **[USER-HW][OPEN]** |
| Budget = real Exp7 Cal/Board/Plan | Same Exp7Views builders | `exp7-views@1`; `mountSurface`; four Board roots + Cal + Plan | **Met** |
| Board finance type tabs | expense/income/debt/asset | Four JRender boards; in-scene type chrome when JR on | **Met** |
| Sync honesty | Auto app-level sync required but incomplete | Exp7 proposal-ops; Budget local IDB; startup records split | **Honest incompleteness**; full sync **[OPEN]** |
| Release two-file rule | Required (docs exception) | Live releases = lean HTML + `release.json` | **Met** |
| Search/scheduler | Canceled | Not a platform feature | **Do not resume** |
| PAT never in canvas | Required | Account/key UI DOM-only | **Met** |
| Mac visual acceptance | Required for “done” UX | Not established in cloud docs pass | **[USER-HW][OPEN]** |

## Lessons locked in 1.8.3 (do not regress)

1. **Scoped app CSS:** `scopeAppCss` prefixes `#appSlot-*`. Hide rules must target nodes *inside* the slot (e.g. `#budgetRoot.jr-chrome`), not `html`/`body`, or use inline `!important`.  
2. **`planDoc` strips siblings:** any in-scene chrome for Plan must be applied **after** `planDoc`.  
3. **Bar paint ≠ DOM hit geometry:** when JR paints the bar, the **canvas** must take pointer hits (or paint must measure DOM rects). Mixing JR paint + DOM hits caused offset clicks in 1.8.2.

## What remains [OPEN]

- Mac Safari USER-HW acceptance of parallax + multi-board Budget + bar hits.  
- Full application-level sync (beyond Exp7 proposal-ops).  
- Account / share panel as JRender (only if PAT stays out of canvas).  
- Exp7 demo `#tabs` into scene (optional).  
- GPU/performance QA (never done).

## Docs vs release

This documentation PR must **not** edit `exp7-platform-lean.html` or `release.json`. Implementation already landed in PRs #21–#26.
