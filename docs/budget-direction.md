# Budget direction: what 1.8.55 to 1.8.61 implement

**Source of the requirements:** `BUDGET_DIRECTION.md`, supplied by Matthew on 2026-11-11 **[REQ]**. That document states agreed behaviour. This page records what the platform now does about each part of it, the rules and thresholds it uses, how existing data is carried over, and what has and has not been verified.

**Base:** `main` at `99dba06` (release 1.8.54). **Branch:** `budget-direction`. Merged to `main` in PR #92 as release 1.8.61. Later phone-first and product fixes are 1.8.62.

Evidence labels follow [EVIDENCE.md](./EVIDENCE.md). Everything run in a cloud browser is **[MOCK]** by that page's definition, however real the app code under test is. Nothing here is **[USER-HW]**.

## What changed, by release

| Release | Adds |
|---|---|
| 1.8.55 | Starting finances (cash or owned assets, debts with a calculated schedule, pay with deductions), every-X-days recurrence, per-occurrence overrides, first-visit links on Home |
| 1.8.56 | Day view entries with *Change* and *Record what happened*; this occurrence or this and future; before/after comparison |
| 1.8.57 | Category created at the first alternative; alternatives with their own requirements; *Preferred* as a mark; proposals reviewed side by side and accepted explicitly |
| 1.8.58 | Automatic day resilience colours with the reason for each day |
| 1.8.59 | Managed encryption key, transfer code, automatic sync, offline pending, keep-both conflicts, passphrase-copy migration |
| 1.8.60 | Dedicated Budget and Demo launchers; app limit enforced where apps mount; Back steps inside Budget |
| 1.8.61 | Audit repairs: Home's scheduled subtotal, *Schedule paydays* opens the Calendar, *Enter debts* link, compressed sync payload, calmer automatic pushes |

The view architecture is unchanged: views are still built by the views host as view models and drawn by JRViews and JRender. Two shared scripts were added to the platform file (`budget-rules`, pure functions; `budget-flows`, controllers and view-model fragments). There is no second renderer and no separate app.

No new artwork or visual design was made. New controls reuse the existing form, button, row and table vocabulary. Budget Home keeps the approved journal layout.

## 2. First visit

**Superseded in 1.8.62.** There is no first-visit setup flow and no *Start here:* / *Enter assets and cash* / *Enter debts* links. People enter cash and owned items, debts, pay, and activities from a calendar day. Home may still list unfinished proposals as *Resume proposal*.

The 1.8.55–1.8.61 behaviour, kept here as history, was:

Home showed a quiet *Start here:* line until each step had something in it, in the document's order:

1. *Enter assets and cash* opens the asset Board.
2. *Enter debts* opens the debt Board. It stays until a debt exists or pay is scheduled, so a person with no debts is not asked forever.
3. *Schedule paydays* opens the Calendar with the pay form.
4. *Schedule activities and costs* opens the Calendar.

An activity is scheduled from the Calendar's *Add item* without creating a category first. Unfinished proposals are listed on the same line as *Resume proposal*.

## 3. Starting finances

**Assets.** An asset is a *cash balance* or an *owned item* (`values.assetKind`). Cash counts as money available and is the opening cash for the day colours. An owned item counts toward net worth only. An asset saved before 1.8.55 has no kind. **From 1.8.62, unmarked items are not treated as cash** and the kind is never inferred from the name. A new item added from a calendar day defaults to Cash, and the user can switch it to Owned. The as-of date is that day.

**Debts.** Fields: creditor, purpose, balance owed, as-of date, APR, payments remaining, days between payments. The payment is calculated, shown before saving, and can be put on the Calendar as a repeating entry that pays the debt.

The rule, shown in the form next to the result:

- Interest is simple on the balance for the days in a period, actual/365: periodic rate `r = APR/100 × days/365`. This is the same accrual the atlas already used for debts.
- Level payment over `n` periods: `P = B·r / (1 − (1+r)^−n)`, or `B/n` when APR is 0. `P` is rounded to the cent, half up.
- Each period: interest = round(balance × r), principal = P − interest. The last payment is the remaining balance plus that period's interest, so it can differ from `P` by the rounding carried through the schedule.
- The first payment falls one interval after the as-of date. Later payments follow the same interval.
- Not modelled: fees, compounding inside a period, payment holidays, rate changes, a creditor's own day-count convention.

This is one stated rule. It is **not** a claim to match any creditor's terms, and the form says so.

**Income.** Gross pay and a list of deductions, each a fixed amount or a percentage of gross. Take-home = gross − fixed deductions − Σ round(gross × percent/100). Each percentage is of gross pay, never of what is left after other deductions, and is rounded to the cent on its own. Paydays are *dates each month* or *every X days*.

## 4. Calendar scheduling

An entry can be spending, income or a routine (schedule only, no money). It is one-time, on *dates each month*, or *every X days*.

- A monthly date that does not exist in a month uses that month's last day, and returns to the requested date in months that have it.
- A new entry's amount is per occurrence (`charge: 'per'`). Entries saved earlier keep the way they were charged.

**Changing a repeating entry** offers two scopes:

- *This occurrence only* writes `values.ex[date]` (amount, time, moved, skip, outcome, note).
- *This occurrence and future* adds a phase that starts on that day (`values.then` with `cut`). Earlier occurrences are evaluated from the original values and are not rewritten.

## 5. Alternatives and requirements

- An entry stays a plain item until its first alternative is added. The user is then asked to name the category the choices share; the category takes the entry's place and holds both choices.
- A choice has its own cost, timing and requirements. A requirement is a scheduled entry marked with the choice it belongs to (`values.forAlt`) and is in force only while that choice is in use.
- Setting up a new choice reviews each requirement of the current one: *needs its own*, *reuse*, or *not needed*. A reused requirement is a **separate copy**; changing the copy does not change the original.
- *Preferred* is a mark (`alts.pref`). It starts a proposal. It does not select the choice. What is in use is the accepted choice (`state.userPick`).
- When a choice is accepted with a later start date, the displaced choice and its requirements stop the day before, and the new choice and its requirements run from that date.
- A proposal is **provisional** until every requirement under review has a scheduled replacement or a *not needed* answer. *Accept* is disabled until then.

## 6. Reviewing and accepting a proposal

The review is on the Plan. It shows the full dependencies and sequence before and after, side by side, with changed rows marked; money columns are for the month the new choice starts. The current plan does not change until *Accept*.

Proposals are saved in the browser apart from the atlas (IndexedDB key `proposals`), including answers and unresolved requirements, and are restored after a restart. They are included in sync.

## 7. Home

Layout unchanged. The day schedule lists entries; clicking an entry opens *Record what happened* for it in the full day view, while the section heading still opens the full day. Plan rows keep *Step | Selected item* with inline alternatives; choosing one from Home starts a proposal and opens its review.

1.8.61 corrects one figure: the *Scheduled this month* group used to add pay to costs in its subtotal. When a group holds both, it now shows *Pay less costs*. The two balance lines below it were already right and are unchanged.

## 8. Recording what happened

In the day view each entry has *Record what happened*: happened as planned, cost was different, or did not happen, with an optional note. The record applies to that occurrence, or also updates future occurrences. A before/after plan comparison is shown during entry and after submission. *Hide comparison* only closes the comparison; it does not cancel or undo the record. There is no persistent planned-versus-actual display and no special flow when a record makes the rest of the plan impossible.

## 9. Day resilience colours

Every day is tested automatically against three set disruptions. Nothing is configured or run by the user.

1. **An unexpected cost that day.** Default $500; a larger one, default $1,500, tells green from yellow.
2. **The next pay arriving late.** Default 3 days.
3. **An item in use that day being unavailable**, when something depends on it: another step requires it, or it is a requirement of the choice in use.

Room to recover is only what the plan already holds: cash before the next pay, and alternatives that are viable that day. An alternative counts only if it is available, not blocked, already started, and affordable from that cash.

- **Green:** every disruption is absorbed.
- **Yellow:** one bites, and there is room to recover.
- **Red:** one bites and there is not.

The day view lists the reason for each test. Thresholds are data: `meta.riskHT` = `{hc: 500, hm: 1500, delay: 3, big: 200}` (`big` is the size at which a one-off is pinned to its own day in the cash path).

Assumptions and limits:

- The cash path starts from cash assets minus credit-card balances, puts pay and per-occurrence or large one-off costs on their days, and spreads the rest of a month's spending evenly.
- It looks ahead from the current month through two months after the month shown.
- An entry counts as "in use" on the days it is on the Calendar. Something used continuously is tested only on those days.
- An entry nothing depends on does not colour a day when it is unavailable.
- This is a test of three stated disruptions against the entered plan. It is not a forecast and not a guarantee, and the legend says so.

**Change from 1.8.53.** These colours replace the workbook cash-criticality rule that 1.8.53 used. The same letters are stored (`C/M/L`) and shown as `R/Y/G`. On an existing budget the colours of some days change: for example a large one-off no longer makes its day red when cash absorbs it, and a step that others require and that has no usable alternative that day is now red.

## 10. Saving, encryption and sync

**Local.** Every change is written to IndexedDB at once, as before. This does not depend on GitHub.

**Key.** A random 256-bit AES-GCM key is made on the device (`crypto.getRandomValues`) and kept in IndexedDB (`syncKey`). It is not shown or typed in normal use. A key is made only when there is no saved budget it would have to open.

**Transfer code.** *Copy transfer code* gives `exp7-budget-key-1.<key>.<check>`. Another device enters it once and keeps the key. The code is the key: anyone with it and the saved file can read the budget, and the interface says so.

**File.** `exp7-sealed/2`: header (format, app, key id, cipher, iv, optional `z`) and ciphertext; the header is bound as authenticated data. From 1.8.61 the content is gzip-compressed before sealing (`z: "gzip"`). A file without `z` still opens.

**Sync.** With GitHub connected, a change is pushed after 10 quiet seconds, or when the page is hidden, and the saved file is checked every 15 seconds. Offline, changes stay local and are pushed when the connection returns.

**Conflicts.** When this device and the saved file both changed since the last sync, nothing is overwritten. Both versions are kept (`syncConflict`), the review names what differs, and the user chooses. The version not kept stays in the browser as a backup until the next conflict.

**Existing passphrase copy (1.8.47 to 1.8.54, `exp7-sealed/1`).** It is never overwritten unread. The device asks for the passphrase once. If the device also has a budget that differs, this is a conflict and both are kept. Once resolved, the file is re-saved under the managed key; the old copy remains in the repo's history under its passphrase.

**Limits, stated in the interface.** There is no recovery service. If every device loses the key and no transfer code was kept, the saved copy cannot be opened. The key lives in one browser profile on one origin: clearing site data removes it, and the same launcher opened from a different address is a different device. Each push is a commit in the data repo.

## 11. Launchers

| File | Opens | Other apps |
|---|---|---|
| `launcher/exp7-launcher.html` | Last app, with the picker | Yes (unchanged, byte-identical) |
| `launcher/budget-launcher.html` | Budget | No |
| `launcher/demo-launcher.html` | Demo | No |

A dedicated launcher sets `window.__exp7Launch = {app, only: true}` before writing the platform, requires platform 1.8.60 or later, and closes the page if the platform does not acknowledge the limit. In the platform the limit is applied where apps mount (`mountAppFresh`), not only on buttons: the picker, the saved last app, app routes and direct mounts are all refused and recorded. Back steps inside Budget (day, month, Home) and stops there.

The two dedicated launchers are new files outside the two-file release rule. They are generated from the universal launcher.

## Data model additions

All additive. Nothing existing is renamed or removed.

- Asset: `values.assetKind`.
- Debt: `values.creditor`, `purpose`, `asOf`, `apr`, `terms`, `every`, `payment`. Its payment entry: `values.payTo`, `values.autoFor`.
- Income: `values.gross`, `values.deductions[]`.
- Recurrence: `repeat: 'every'` + `values.every`; `repeat: 'monthdays'` + `on[]`.
- Occurrence overrides: `values.ex{date: {...}}`. This-and-future: `values.then` chain with `cut`.
- Requirements: `values.forAlt`, `values.reqs[]`. Category made by the user: `values.isCategory`, `state.prev`.
- Selection: `meta.selModel = 2`.
- Browser storage (IndexedDB `budget-app-v1`, store `kv`): `proposals`, `proposalsAt`, `syncKey`, `syncState`, `syncDevice`, `syncConflict`, `syncConflict.kept`, `atlasState.beforeLoad`.

## Migration of an existing budget

On first open in 1.8.57 or later, a budget without `meta.selModel` is migrated once: for each category, the choice that was in use (its preferred choice if available, else its recorded pick) becomes the accepted choice. The preference mark is kept. No proposals are created. Nothing else is rewritten.

**Check on a real budget [MEAS 2026-11-11, Chromium in the Claude app on Matthew's Mac].** A private copy of his existing budget (694 items, 104 plan steps) was opened in 1.8.54 and in 1.8.60 inside his browser, with the app's database redirected to the copy and all non-GET requests blocked. The saved budget itself was not opened by the new build and was unchanged afterwards. Result: the same selected choice for all 104 categories, the same charge and occurrence count for all 1,792 item-months over 14 months, and the same monthly living, debt-payment and surplus figures for all 14 months. No page errors. Day colours differ, as described in section 9.

## How this was checked

| Check | What is real | What is not | Class |
|---|---|---|---|
| `unit-a`, `unit-b` (72) | Shipped `eval` and `budget-rules` scripts, loaded from the built file | Node, no browser | **[MOCK]** |
| `int-a` … `int-h`, `int-legacy` (231) | The built platform file in Chromium; JRender's wasm core painting through WebGPU; real pointer and key events through JRender hit testing; real IndexedDB; restart = page reload | Cloud VM, software GPU (SwiftShader), not a Mac, not Safari | **[MOCK]** |
| Sync (`int-e`) | App, Web Crypto, IndexedDB, three browser contexts as three devices | GitHub is a test double | **[MOCK]** |
| Launchers (`int-f`) | The three launcher files and the platform | The release read from GitHub is a test double | **[MOCK]** |
| Existing-budget migration | Real budget, real browser on the Mac | A copy, with network writes blocked | **[MEAS]** |

## Not verified

- Anything on Matthew's own hardware as his own report: **[USER-HW][OPEN]**. Safari in particular.
- Real GPU rendering and visual fidelity. The cloud runs use a software GPU; screenshots from them are development signal only.
- Sync against the real GitHub API: rate limits, real 409 timing, token scopes, large files.
- Transfer between two real devices, and the passphrase-copy migration against the real data repo.
- The dedicated launchers fetching the real release from GitHub.
- Accessibility (screen reader, keyboard-only use of the new forms beyond Tab and Enter), performance and frame timing, small and touch screens.
- Long histories: a budget with years of occurrence overrides, and a data repo with thousands of sync commits.
- Whether the debt rule matches any particular creditor.

## Where the sources are

The platform file is built from the pinned base by ordered patches. From 1.8.62 the Budget scripts (`budget-rules`, `budget-flows`, `journal-views`, `eval`) and a new unit suite are delivered as a sidecar archive outside this repository, so a release PR stays within docs, the platform file, `release.json`, and the launchers. The original 72 unit + 231 integration checks from 1.8.55–1.8.61 were delivered as a separate archive and are not in this repository.
