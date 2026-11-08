# M21b — Calendar month net (live +[REDACTED-AMOUNT])

Live source (`renderCalendarRollupHtml` → `lastBest.calendar`, built in run()):
for each act on the calendar in the focus month, amt = easyMonthChargeTotal; acts with amt>0 (or kind=work) count toward nActs.
Then **if the month has any money acts, the roll-up returns calcSummary() values** (net, living, debtPayments, surplus) — "sheet SoT".
So live's [REDACTED-AMOUNT] / [REDACTED-AMOUNT] is the SUMMARY sheet, not a sum of calendar charges.
The [REDACTED-AMOUNT] includes [REDACTED-INSTITUTION] [REDACTED-AMOUNT] (disabled act) and Phone upgrade accessories [REDACTED-AMOUNT] (no act) = [REDACTED-AMOUNT], which is exactly why our calendar-charge sum ([REDACTED-AMOUNT]) differed.

Ours now matches: the roll-up line uses joys surplus / inc_net / exp_total, and n = joy `cal_nacts`
(bp_cal_nacts: formula `kind=='work' || amount>0` over the calendar acts) = [REDACTED-AMOUNT], like live.
The per-day ledger (balances, warnings) still uses the real calendar charges (intentional; it's the day simulation, not the roll-up).
Browser check (8798-free CDP on a /tmp copy): roll-up line is text-identical to live; Plan view renders Critical days / Previously occurred / Upcoming sections, 0 exceptions.
