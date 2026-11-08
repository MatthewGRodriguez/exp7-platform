# Decisions log

Statuses: **Accepted [REQ]** · **Rejected** · **Substituted (historical)** · **Claimed only [CLAIM]** · **Canceled** · **Shipped [MEAS]**.

## Accepted product rules [REQ]

| Decision | Notes |
|----------|--------|
| Software repo ≠ personal data repo | Updates never overwrite personal data |
| Release diff = `release.json` + platform HTML | Docs-only PR is an **authorized exception** |
| Launcher embeds no platform | Fixed source: owner/repo/`main`/release.json |
| Direct in-page app mount | No iframe |
| App-first: default Exp7 then last app | Back opens apps; no chooser headings |
| Chrome = back + whole-avatar only | Exclusive image **or** fallback |
| Reserved header, never overlaying app | Solid layout reservation; content below bar |
| Budget = real Exp7 Cal/Board/Plan | Same Exp7Views module; no DIY stubs |
| Views universal; data per-app | One Exp7Views design; atlases stay app-local **[REQ 2026-11-08]** |
| One JRender for everywhere | Apps + platform chrome via real JRender; PAT overlays may stay DOM — see [views-jrender-standard.md](./views-jrender-standard.md) |
| Chrome parallax with views | Back, avatar, apps, Budget tabs on Exp7Slabs path **[REQ]** / **[MEAS 1.8.3]** |
| Joy units ≠ automatic dollars | Harmonic portions use joy pool units |
| Sync honesty | Proposal-ops ≠ full app sync; say so |
| No Artist contact without authorization | Unauthorized until Matthew opens it |
| Search/scheduler research stopped | 2026-11-07: do not resume |
| PAT never in JRender canvas text | Account/key UI stays DOM |

## Shipped on `main` 1.8.3 [MEAS] (formerly gaps)

| Area | Decision / outcome |
|------|---------------------|
| Budget views | Real Exp7Views Cal/Board/Plan; four type boards; local IDB |
| Reserved bar | Fixed `#topChrome` + `#appShell` below; JRViews paint when GPU |
| Exclusive avatar | `.is-on` mutual exclusion in chrome CSS |
| Platform chrome JR | `PlatformChromeJR` bar + apps; Budget `budgetChromeDoc`; canvas hits on bar |
| DOM tab doubles | Hide via `#budgetRoot.jr-chrome` + inline `!important` (scoped CSS safe) |

## Rejected or closed approaches

| Approach | Outcome | Evidence |
|----------|---------|----------|
| Iframe sandbox / iframe mount | Rejected | PR #2 closed; not on `main` |
| PR #3 “direct mount” as merge | Closed; Matthew **manually** placed files on `main` | git history |
| Fake / worksheet Budget as “done” | Failed acceptance; replaced by 1.7+ Exp7Views Budget | **[REQ]**; historical 1.5.0 substitute |
| Transparent overlay chrome as final UX | Failed reserved-header requirement (t1738u); replaced by solid reserved bar | **[REQ]** |
| Dual avatar children | Failed exclusive-fallback rule | **[REQ]** |
| JR bar paint + DOM hit targets | Caused offset clicks; replaced by canvas hits (1.8.3) | **[MEAS]** / user report |
| Resuming search / Timefold / “v50” | **Canceled** | **[REQ 2026-11-07]** |
| Committing user-uploaded HTML | Forbidden | **[REQ]** |
| Accepting cloud “tests passed” as Mac UX | Rejected as acceptance | **[REQ]** |

## Historical substitutions (1.5.0 era — no longer tip)

| Area | What 1.5.0 shipped | Replaced by |
|------|--------------------|-------------|
| Budget views | `renderCal` / `renderBoard` / `renderPlan` stubs | Exp7Views `exp7-views@1` (1.7+) |
| Top chrome | Transparent overlay + padding-top | Reserved bar + JRViews (1.7.9+) |
| Avatar | Non-exclusive img + fallback | Exclusive `.is-on` gate |

## Claimed only — not acceptance [CLAIM]

| Claim | Status |
|-------|--------|
| Cloud/VM “tests passed” = Mac UX done | **No** — label **[MOCK]** / **[CLAIM]**; Mac Safari is **[USER-HW]** |
| Full GPU / motion performance QA | Never done **[OPEN]** |
| Full application-level sync | Not shipped; proposal-ops + Budget IDB only **[OPEN]** |

## Related

- [platform-chrome-jrender.md](./platform-chrome-jrender.md)  
- [requirements-vs-main.md](./requirements-vs-main.md)  
- [version-lineage.md](./version-lineage.md)  
