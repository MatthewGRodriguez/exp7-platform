# M20d — EXPENSES tab (report)

Built by the importer layout from generic records (no money components):
- [REDACTED-AMOUNT] section tables (CATEGORY / AMOUNT pad / PAY TO DEBT choice over `comp:debts` / SCORE), captions `living −$x · debt-pay −$y`
  from two `sum` nodes per section (one filtered on `payTo = living`), LIVING TOTAL / DEBT PAYS text, Add row / × remove.
- Alternatives: `alternatives` entries linked to their expense line by the live uid; picks by rubric formula
  `value/8 − amount/gmax(amount, of)×[REDACTED-AMOUNT]` + `needs` (live jreq, incl. the seq chain) + pref.

Parity vs live (snapshot 2026-11-01): LIVING TOTAL [REDACTED-AMOUNT] ✓, DEBT PAYS [REDACTED-AMOUNT] ✓, [REDACTED-AMOUNT] section living captions ✓ (diff 0),
LEISURE `· debt-pay −[REDACTED-AMOUNT]` ✓, 7/7 pinned plan tags (E, L, A, A, AL, A, AL) ✓. Interactions verified headless on a /tmp copy:
pay-to-debt choice (Living ↔ [REDACTED-INSTITUTION]) moves [REDACTED-AMOUNT] between living and debt-pay; pad edit Internet → [REDACTED-AMOUNT] updates section and total;
▸ expand, Prefer, Try, Unavail., + alternative.

Differences (honest):
- SCORE column: live uses the Exp6 rank composite (`scoreRaw`); here it is 800 × amount / largest line (no "+x%" value−spend suffix).
- Prefer overrides (pickAlt pref) where live adds a ★ quota to the score; same result on the snapshot, may differ after edits.
- Requires/Needed by lists match for Rent except live also lists "Move (barracks → apartment)" (nested child alternative refs are not imported).
- Not built: section jump buttons, "+ Section", and the long panels below the table (Health legend, Actual vs plan, Legacy,
  Critical items, Plan for the bad, buffer, invest, realism, Preferred plan, criticality calendar, life plan).
