# Calendar feature map: legacy calendar → world calendar template (M19)

Legacy sources: builder/packs/calendar_live.js, rd_live sections, ranking_ui calendar. Status key: **T** already in template (M18) · **B** built in M19 from world primitives / new generic nodes or view options · **R** needs new generic work (remaining) · **X** not generic as-is (user-authored data).

| Feature | Status | How |
|---|---|---|
| Day grid, chips, recurrence (daily/weekly/weekdays/monthly), duration | T | calendar layout, occurrences |
| Board (+New, sort, filter, → Calendar, drag onto day) | T | board layout, drop blueprint |
| Plan: jreq sequence, broken/conflict flags, Exp6 alternatives | T | plan layout, pickAlts |
| Board/Plan switch | T | view.switch/group |
| Day states from conditions (busy/overload) | T | days + condition blueprints |
| Month navigation ‹ › Today | B | calendar view nav (ADR 0097) |
| Range selection with net / lowest | B | view.range |
| Day detail (lines, amounts, state) | B | view.detail + ledger lines |
| Legend | B | view.legend from state labels |
| As-of date + what changed | B | as-of joy, view.asof, banner |
| Opening cash / warning / margin controls | B | joys + view.controls steppers |
| Cash after bills (running balance) | B | accumulate node (ADR [REDACTED-AMOUNT]) |
| Headroom until next pay day | B | accumulate.ahead |
| [REDACTED-AMOUNT] warning, 10% margin, below-zero states | B | condition.b + merge (ADR [REDACTED-AMOUNT]), money preset |
| Pay days separate from presence | B | values.pay |
| Charge modes payDays / lastSpan / eachOccur / monthly | B | charge each/last/first/per |
| One-off dates, monthdays, end date, final amount | B | repeat dates/monthdays, until, lastAmount |
| Income vs expense | B | values.flow |
| Pay-period rails | B | view.rails |
| Plan sections Critical / Previously occurred / Upcoming | B | section layout comps (ADR 0097) |
| Per-item conflict highlight | B | plan row uses its own flag |
| Alternative amount replaces item amount | B | ledger uses picked alternative |
| Numeric parity with legacy | B | money_parity: max diff 0 |
| Scenario pills (current / projected / review) | R | needs world variants (snapshot joys) |
| Tombstones (deleted-but-shown items) | R | needs item lifecycle state |
| Alternatives path search ranked by min cash / severity | R | needs a search node over pickAlts × ledger |
| Hours / time-of-day lanes, span labels i/n | R | view option |
| rd_live: Bad, Buffer/burnout, Invest stats, Realism (inflation), Life rubric, Long range [REDACTED-AMOUNT]–[REDACTED-AMOUNT], Actual vs bank, Preferred quota/explore | X | authorable as blueprints + sections over user data; not built-in |
