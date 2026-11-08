# Decisions log

Statuses: **Accepted [REQ]** · **Rejected** · **Substituted (must replace)** · **Claimed only [CLAIM]** · **Canceled**.

## Accepted product rules [REQ]

| Decision | Notes |
|----------|--------|
| Software repo ≠ personal data repo | Updates never overwrite personal data |
| Release diff = `release.json` + platform HTML | Docs-only PR is an **authorized exception** |
| Launcher embeds no platform | Fixed source: owner/repo/`main`/release.json |
| Direct in-page app mount | No iframe |
| App-first: default Exp7 then last app | Back opens app buttons; no chooser headings |
| Chrome = back + whole-avatar only | Exclusive image **or** fallback |
| Reserved header, never overlaying app | Solid layout reservation under bar |
| Budget = real Exp7 Cal/Board/Plan | No DIY substitute views |
| Views universal; data per-app | One Exp7Views design everywhere; atlases stay app-local [REQ 2026-11-08] |
| One JRender for everywhere | One renderer; many same/different views + app scene content; platform shell destination = JRender too [REQ direction] — see [views-jrender-standard.md](./views-jrender-standard.md) |
| Joy units ≠ automatic dollars | Harmonic portions use joy pool units |
| Sync honesty | Proposal-ops ≠ full app sync; say so |
| No Artist contact without authorization | Still unauthorized as of this docs pass |
| Search/scheduler research stopped | 2026-11-07: do not resume |

## Rejected or closed approaches

| Approach | Outcome | Evidence |
|----------|---------|----------|
| Iframe sandbox / iframe mount PRs | Rejected; blank Open-app history | PR #2 closed; iframe path not on `main` |
| PR #3 “direct mount” as merge | **Not merged**; Matthew closed PR and **manually** placed release files on `main` | [USER-HW] rendering report; git history |
| Fake / worksheet Budget as “done” | **Fails acceptance** even if shipped | [REQ]; see `main` 1.5.0 substitute [MEAS] |
| Transparent overlay chrome as final UX | **Fails** reserved-header requirement | t1738u [REQ]; `main` still transparent [MEAS] |
| Dual avatar children (img + “M”) | **Fails** exclusive-fallback rule | Screenshot-driven [REQ] |
| Resuming search / Timefold / “v50” | **Canceled** | [REQ 2026-11-07] |
| Committing user-uploaded HTML | Declined / forbidden | [REQ] |
| Accepting cloud “tests passed” as Mac UX | **Rejected** as acceptance | [REQ] |

## Substitutions present on verified `main` (must not be treated as requirement satisfaction)

| Area | What `main` 1.5.0 ships [MEAS] | Required instead [REQ] |
|------|-------------------------------|-------------------------|
| Budget views | Separate stub with `renderCal`/`renderBoard`/`renderPlan` | Real Exp7 `calHtml`/`boardHtml`/plan+`depsHtml` (e.g. via `moneyCalendarTemplate`) |
| Top chrome | Transparent fixed overlay + shell `padding-top` | Fixed **reserved** bar; content starts below; no covered tabs |
| Avatar exclusivity | img `display:block` + fallback `inline-flex` without exclusive `.is-on` gate in head CSS | Exactly one of image / fallback visible |

## Claimed only — not accepted [CLAIM]

| Claim | Status |
|-------|--------|
| Closed PR #7 / branch `cursor/budget-real-views-9657` “1.6.0” shared-engine Budget + reserved bar + exclusive avatar | **Not on `main`**. PR **closed unmerged**. Agent/VM tests are **[CLAIM]/[MOCK]** relative to Matthew’s Mac. Existing app PRs remain for **user review**, not automatic acceptance. |
| Launcher Register fix deliverable (8 351 B) on Grok Bot box | Indexed in handoff; **not in this repo**; real-browser verification **[OPEN]** |
| Full GPU / motion performance QA | Never done **[OPEN]** |

## Working-mode note [REQ]

Matthew requested local implementation after repeated incorrect Cursor results, then re-authorized Cursor **starting with documentation only**. Implementation / fix work requires a **new** explicit authorization beyond this docs pass.
