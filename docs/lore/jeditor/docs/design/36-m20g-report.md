# M20g — DEBT (dated balance walk)

`bp_debt` on comp:debts: formula `cashPay = paid('amount','payTo')` (new formula fn: Σ of a field over items whose link field names this item —
the M20d PAY TO DEBT choice drives it), `walk` (Initial @ As-of, interest daily, pay on the debt's calendar pay day, target joy asof),
formulas interest / principal / due / payoff, sums → joys debt_initial/live/interest/due/cash/terms, DTI = due ÷ inc_gross.
Formula results that are undefined now read 0 (first pass before state exists).

Parity (asof 2026-11-01, tested): LIVE [REDACTED-AMOUNT] / [REDACTED-AMOUNT], total [REDACTED-AMOUNT]; initial [REDACTED-AMOUNT]; terms [REDACTED-AMOUNT]; interest [REDACTED-AMOUNT];
principal [REDACTED-AMOUNT] / [REDACTED-AMOUNT]; due [REDACTED-AMOUNT] / [REDACTED-AMOUNT], Σ [REDACTED-AMOUNT]; cash [REDACTED-AMOUNT]; payoff [REDACTED-AMOUNT] / ∞; DTI [REDACTED-AMOUNT]; gross [REDACTED-AMOUNT]. Legacy
panel: Auto loan [REDACTED-AMOUNT] paid total [REDACTED-AMOUNT]. Date (AS OF) and choice inputs are click/picker.

Differences: Sanity line (live "balance [REDACTED-AMOUNT] · terms [REDACTED-AMOUNT] · amount due ≈ [REDACTED-AMOUNT]", stale live text) not reproduced; card SOURCE
reads "EXP: Credit Card" (live "EXP: Car ⚠<due"); Legacy history dates list not shown (only total); student pay day [REDACTED-AMOUNT] (from calendar act;
live text says 25th — same result for 11-01); "Legacy ×" move button absent.
