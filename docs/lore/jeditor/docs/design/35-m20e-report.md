# M20e — CALENDAR over the 72 imported actions

- Uses the M19 `M.moneyCalendarTemplate` (calendar + Board + Plan); the importer only maps data:
  monthly → date on `day`, pay on `billDay`; weekdays/weekly/daily → repeat (+`on`=dow, `pay`=payDays, else charge 'last');
  selected with keys → 'dates', else Board-only. Disabled actions stay on the Board only. Raw `days` (weekday list) renamed `dow`.
- Parity: per-day item counts Nov 1–[REDACTED-AMOUNT] = live [REDACTED-AMOUNT]/30 (test). Bill days match live bars (Cell 8, Internet 9, [REDACTED-INSTITUTION] [REDACTED-AMOUNT], [REDACTED-INSTITUTION] [REDACTED-AMOUNT],
  Student Loan [REDACTED-AMOUNT], iPhone/[REDACTED-INSTITUTION]/Mac [REDACTED-AMOUNT], Cursor 4, Auto Ins 5, Laundry/PS/Taxi 1, Work pay 1 & [REDACTED-AMOUNT]).
- Differences: month ledger net [REDACTED-AMOUNT] vs live SURPLUS [REDACTED-AMOUNT] (live KPI comes from the expense sheet [REDACTED-AMOUNT]; ours charges
  calendar acts incl. Beauty [REDACTED-AMOUNT] on last Sat). Span bar captions ("· crosses month") differ in wording; KPI strip not on this tab.
