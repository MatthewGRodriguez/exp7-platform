# M4 report — CALENDAR tab live (ranking_ui v1)

Date: 2026-10-30 (Chicago). Level: `levels/ranking_ui_v1/ranking_ui_v1.html` (785084 B, single file, 0 external refs). ADRs 0029 and 0030.

## What was built
- **`CalendarBoard`** (`builder/components/CalendarBoard.js`): one component holding both the calendar and the Board items (ADR 0009/0011). Everything is click-only.
  - Month pager ‹ › / Today and scenario view pills (CURRENT 72 / PROJECTED 65 / PROJ+REVIEW 65), with the tombstone count (10).
  - [REDACTED-AMOUNT] pay-period and bill rails.
  - A 7-column grid. Each day shows chips (work/rhythm/cost/presence) with span labels ("Work 4/10"), an "N items" count, signed charges, and cash after bills.
  - Click a day for its detail (bills, headroom). "Range pick" plus two clicks sets the range scope.
  - Payday steppers edit the Work act's `payDays` in `workbook.calendars[scenario]`, so pay periods, rails, charges and the ledger all recompute.
  - Opening-cash stepper (±[REDACTED-AMOUNT]), or "sheet" to go back to the default.
  - Conditions editor: on/off, metric (cycles through `jfactor.metrics` valid for the scope), op, value stepper (metric step), severity, scope, animation (none / pulse once / pulse loop / glow loop / shake once) and delete. It also has "+ condition", a combine picker, and a per-condition match count.
  - Board items list (38 placed) showing alternatives.
- **Packs:**
  - `vendor/calendar_model` (unchanged), `vendor/easy_calendar_extract` ([REDACTED-AMOUNT] verbatim functions) and `calendar_live` (env, ledger, items, condition engine, row calcs, metrics).
  - `ranking_money.debt` now uses live balances, payments, amount due and terms from the extracted `calcDebt`. This fixes the M2b card mismatch, which came from `ensureDebtPayLinks` linking Car Payment → [REDACTED-INSTITUTION] at [REDACTED-AMOUNT].
  - `rank_share` gets its Board items and acts from `calBoard`/`calActs`. The M3 board/acts snapshot was removed from level state.
- **KPIs:** Surplus = `cal.surplus`, Net = `cal.gain`, Living = `cal.spend` (living + debt cash). DTI and Net worth come from the extracted calcDebt/calcAssets. `stateVersion` is now 3.

## Verified (headless Chrome, temporary profile; `levels/ranking_ui_v1/verify_m4_spec.json` → `shots/m4/m4_report.json`)
- 0 console messages, 0 exceptions, 0 non-file requests.
- KPIs: surplus +[REDACTED-AMOUNT], living −[REDACTED-AMOUNT], net +[REDACTED-AMOUNT], DTI [REDACTED-AMOUNT], net worth −[REDACTED-AMOUNT], rank items [REDACTED-AMOUNT]. All equal the original.
- The grid shows 31 days with per-day chip counts equal to the original. The [REDACTED-AMOUNT] rails match the original text exactly, starting with "Work · 9/16→[REDACTED-AMOUNT]/1 · pay 1 · crosses month".
- **Edit + reload test:**
  - Payday [REDACTED-AMOUNT] → [REDACTED-AMOUNT] by stepper. payDays [1,[REDACTED-AMOUNT]] is stored. Day [REDACTED-AMOUNT] cash goes from [REDACTED-AMOUNT] to [REDACTED-AMOUNT], day [REDACTED-AMOUNT] shows [REDACTED-AMOUNT], and rail 0 becomes "9/17→[REDACTED-AMOUNT]/1".
  - After reload (from=local, tab CALENDAR) the paydays are still [1,16].
  - Reset restores [1,[REDACTED-AMOUNT]] and surplus [REDACTED-AMOUNT].
- **Highlight test:** six + clicks take the warning threshold to [REDACTED-AMOUNT]. Days 8–[REDACTED-AMOUNT] become `sev-warning` (border rgb([REDACTED-AMOUNT])) with pulse/once cues (8). This survives reload. The defaults highlight nothing in October.
- RANKS still shows 60 items. All tabs render. The M3 spec, M2b spec, rank_parity (max diff 0) and motion_parity (PASS) were re-run and pass.
- **Parity:** `node builder/test/calendar_parity.js` gives PASS, 36 checks, **max numeric diff 0** (result in `builder/test/calendar_parity_result.json`). It covers:
  - summary, assets and debt values, plus the per-line live balance, payment, due, terms and payday;
  - roll nActs 15, the 72/65/65 counts, 10 tombstones and 38 placed acts;
  - 0/31 day chip-count mismatches and 0/31 mismatches against the original DOM labels;
  - 0/72 charge mismatches;
  - rails identical, and boardRankCandidates identical (59).

## Differences from the original (intentional or not ported)
- New and labelled as a proposal: the cash ledger, headroom, conditions and animations (ADR [REDACTED-AMOUNT]).
- Not ported:
  - the EXP6 scenario MIX strip;
  - suggest ghosts and Jump to Suggest;
  - the Copy previous month / Copy year / Clear / Fill gaps / Phone batch / Seed buttons;
  - the old drill `renderCalendar` (year → hour);
  - the right-hand log panel.
- Chip labels are not truncated to 12 characters; the original truncates them in CSS.
- Everything is date-dependent: parity only holds on the capture day (2026-10-30, Chicago). On other days the live debt walk advances, as it does in the original.

## Unverified
- Safari or headed browsers; mobile layout.
- The "no healthy fallback" rule on real data, because no item has alternatives. It is covered by logic only.
- Scenario view pills for projected/review were clicked only implicitly. The money KPIs stay on current, as in the original.

## Remaining for M5
- **Plan view (ADR 0011):** not built. It needs the following:
  1. an alternatives editor on Board items (add/remove alternatives, amounts) persisted in `calendars[sc].customActions[].alternatives`;
  2. path enumeration across decision items (a JFactor group per decision);
  3. a per-path cash-after-bills projection that reuses `JCal.month` with substituted amounts;
  4. a path list ranked by the condition engine (severity), with a pick that writes the chosen alternatives back.
- Making T/D/U/S rank caches live (they are still the M3 snapshot), plus drag scheduling, recurrence picker and paint grid.
