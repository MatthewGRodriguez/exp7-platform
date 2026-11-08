# M21 (part 1) — Debt finish + Assets jumps

- Import applies the live UI's on-load `ensureDebtLinks` heuristic (unlinked "car" lines → first auto/car/[REDACTED-INSTITUTION]/vehicle debt; student/loan →
  student/first mark/loan debt), so Car → [REDACTED-INSTITUTION] card as in live.
- New formula fn `linked('linkField','nameField')` and string `+` concatenation; SOURCE = `EXP: <names>` + ` ⚠<interest` / ` ⚠<due`, or `manual`.
  Matches live: "EXP: Student Loan", "EXP: Car ⚠<due".
- Debt caption now has the live hint and Sanity line (live's Sanity line is static text in ranking_ui).
- Row action `move` (generic table feature): "Legacy" button moves a debt to the legacy table (sets legacy/status), click-only.
- Legacy table: LEGACY prefix, status · since date, last balance —, dated payment list (`fmt:'lines'`), paid total [REDACTED-AMOUNT], "history only", note row.
- Assets: generic `jumps` on a stack view → Savings / Real estate / Personal property buttons scroll to the section.
