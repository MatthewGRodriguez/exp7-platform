# M20i + verification pass

M20i: SUMMARY table (text with joy tokens), surplus via `bp_summary` (net − living − debt cash), LIVE ROLL-UP KPI strip, status block,
"How sheets calc" (11 lines), flow line on every tab (frame), GOALS (3 joys), tab order = live (SUMMARY INCOME EXPENSES RANKS CALENDAR DEBT ASSETS GOALS).
KPI refs use `joy:` refs; KPI choice chips (`joyset`) strip the prefix.

## Number parity (tools/parity_report.js; live dumps in world/test/fixtures/live, captured read-only from a /tmp copy on port 8799)
Output: [REDACTED-AMOUNT]-parity-output.txt. Multiset of money / % / hour tokens per tab, live → ours:
- SUMMARY [REDACTED-AMOUNT]/22, INCOME [REDACTED-AMOUNT]/21, ASSETS [REDACTED-AMOUNT]/22, GOALS [REDACTED-AMOUNT]/16 — max diff 0.
- DEBT [REDACTED-AMOUNT]/46: missing legacy history amounts ([REDACTED-AMOUNT], [REDACTED-AMOUNT] dated list + its note text) and one GAP −[REDACTED-AMOUNT] (card GAP shows, one live −[REDACTED-AMOUNT] is the ⚠ row extra).
- CALENDAR [REDACTED-AMOUNT]/20: missing four roll-up repeats inside live calendar plan/notes ([REDACTED-AMOUNT] ×2, [REDACTED-AMOUNT], [REDACTED-AMOUNT]).
- RANKS [REDACTED-AMOUNT]/683: the T rank list is [REDACTED-AMOUNT]/59 exact (test); missing = live per-item factor breakdown grid (8 dims × 59 items, Board money column).
- EXPENSES [REDACTED-AMOUNT]/1188: section captions/totals match (M20d); missing = live Exp6 scores with +x%, per-line review/projected columns,
  alternatives panels' numbers and the big panels below the table.
Not built: REVIEW, PREVIEW, MODEL TOOLS tabs; RUN() H/M KPIs; RANK ITEMS shows 59 (live 60 incl. Wake).
