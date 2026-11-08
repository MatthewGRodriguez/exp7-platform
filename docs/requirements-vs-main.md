# Requirements vs verified `main` vs claims

**Verified tip [MEAS 2026-11-08]**

- Ref: `origin/main` = `69a2cd9bb34a18926ee1e4b8db73b56406e6a6fb`  
- Release: **1.5.0**  
- SHA-256: `7420b9f6c459133f2f8f1cd3f5b223f1c1fc9f487b5be7ce6d71f5c9867c6d09`  
- Open PRs: **none**  
- Closed PR #7 (1.6.0): **not merged** — treat as **[CLAIM]** only  

## Matrix

| Topic | Requirement [REQ] | On `main` 1.5.0 [MEAS] | Closed PR #7 / agent reports [CLAIM] | Verdict |
|-------|-------------------|-------------------------|--------------------------------------|---------|
| Direct mount, no iframe | Required | Direct inject into `#appSlot-*`; boundary says no iframe | Also claims direct mount | **Met on main** (mount model) |
| Software ≠ data repos | Required | README + sync paths use separate data repo name | — | **Met** (policy + code paths) |
| App-first / last app | Default Exp7 then last | Present in 1.4→1.5 lineage | — | **Met** (behavior intended on main) |
| Chrome = back + avatar only | Minimal controls | Back + avatar in `#topChrome` | — | **Mostly met** (control set) |
| Whole avatar = control; exclusive fallback | Image **or** fallback, never both | Avatar is the button; head CSS shows `img{display:block}` and fallback `inline-flex` **without** exclusive `.is-on` gate | Claims exclusive `.is-on` fix | **At risk / incomplete on main** — needs Matthew screenshot acceptance |
| Reserved header, never overlay | Solid reserved bar; content below; no covered tabs | `#topChrome{background:transparent;pointer-events:none}`; `#appShell{inset:0;padding-top:var(--bar-h)}` | Claims solid bar + `top:var(--bar-h)` shell | **Not met** on main relative to t1738u wording |
| Budget = real Exp7 Cal/Board/Plan | `calHtml` / `boardHtml` / plan+`depsHtml` | Separate `budgetpkg` with `renderCal`/`renderBoard`/`renderPlan` only; **no** `calHtml`/`JAtlasModel` | Claims shared-engine `moneyCalendarTemplate` mode | **Not met** on main (substitute) |
| Board finance tabs + harmonic shares | expense/income/debt/asset; optional per-joy shares; not auto-dollars | Stub implements type tabs + harmonic share UI locally | Claims shares on real board | Stub may mimic UX; **still substitute views** |
| Sync honesty | Auto app-level sync required but **incomplete** | Exp7 proposal-ops under `exp7-app-v1/`; Budget local IDB; startup records that split | Claims same honesty for Budget local | **Honest about incompleteness on main**; full app sync still **[OPEN]** |
| Release two-file rule | Required (docs exception now) | Live releases follow two files | PR #7 was app files only | Process OK if docs stay separate |
| Search/scheduler | Canceled | Not a platform feature on main | — | **Do not resume** |
| Mac visual acceptance of current chrome/Budget | Required for “done” | Not established in this docs pass | Agent VM passes ≠ Mac | **[OPEN] / not accepted** |

## Contradictions and tensions (explicit)

1. **Manifest prose vs Budget reality:** `release.json` `contains.app` says Exp7 lean + “Budget (calendar/board/plan…)”. That describes **tabs/features**, not proof of real Exp7 view functions. Decoded Budget package is a DIY worksheet **[MEAS]**.  
2. **Padding vs reservation:** `padding-top` on a full-viewport fixed shell is not the same as a solid reserved bar that cannot overlay content (t1738u). Transparent `#topChrome` on main conflicts with “not overlayed.”  
3. **Handoff §4 vs live version:** Handoff asked whether main was still ~1.3 after manual commits. **Answer now:** main is **1.5.0** at `69a2cd9…` **[MEAS]**.  
4. **PR #7 closed vs branch tip:** Remote branch may still show 1.6.0 files; **`main` does not**. Never treat the branch as live.  
5. **“Tests passed” vs acceptance:** Cloud/agent passes are **[CLAIM]/[MOCK]**; Matthew’s review of app PRs is authoritative.  
6. **Incomplete sync:** Requirement wants automatic application-level sync; implementation is proposal-ops only (+ Budget offline). Both “sync exists” and “sync is incomplete” are true — document both.

## What this docs PR does **not** change

No HTML, launcher, or `release.json` edits. Gaps above remain until a separately authorized implementation PR and Matthew’s acceptance.
