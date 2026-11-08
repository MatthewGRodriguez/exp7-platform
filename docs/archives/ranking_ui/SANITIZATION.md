# Sanitization & omissions (ranking_ui archive)

## Package zip (75 files)

Per `RANKING-UI-ARCHIVE-INVENTORY.md` (attached provenance):

- Local paths, military unit/base, city, some schedule text, bank/payer/account digits, and some merchant names were already placeholder-sanitized in **6** modified files.  
- **Merchant name-matching rules** now match placeholders only — **sanitized / not production-equivalent**.  
- Data workbooks, calendars, backups, JPEG frames, and other personal payloads were **withheld** from the zip (see inventory counts).  
- Main `ranking_ui.html` was **withheld from the zip** as unsafe for automatic sanitize.

## Additional in-repo redaction (required before commit)

`vendor/model_tools_script.js` — `ECON_MATTHEW` **work/sleep minute** numeric constants replaced with `null /* [REDACTED-SCHEDULE-MINUTES] */`; timezone string replaced with `'[REDACTED-TIMEZONE]'`; any residual clock-style comments on those lines removed.  
Repo SHA therefore **differs** from the zip’s archived SHA for this file. Generic algorithms around the object remain; **actual schedule is not published**.

## Sanitized main UI: `ranking_ui.html.txt`

| | |
|--|--|
| Original filename | `ranking_ui.html` |
| Raw private source | Used only in an outside-git work dir for sanitization; **never committed**, not logged, not quoted |
| Published form | `ranking_ui.html.txt` (inert text; avoids hosting/execution confusion) |

Redaction classes applied (counts are of replacements, not values):

- Location/base/city markers → `[REDACTED-LOCATION]` / `[REDACTED-CITY]`  
- Pay-grade tokens → `[REDACTED-PAY-GRADE]`  
- Currency forms → `[REDACTED-AMOUNT]`  
- Long digit runs (8+) → `[REDACTED-ACCOUNT-DIGITS]`  
- Some account masks → `[REDACTED-ACCOUNT-MASK]`  
- Labeled pay/service dates → `[REDACTED-DATE]`  
- Financial property numeric literals (`balance`, `payment`, …) → `null /* [REDACTED-AMOUNT] */`  
- Schedule minute fields → null placeholders  
- Common bank brand tokens → `[REDACTED-INSTITUTION]`  

Post-scan residuals for those classes: **0** (pattern re-check).  

**Gaps / honesty:** Pattern redaction cannot guarantee every personal datum was found. Embedded workbook **behavior** is intentionally broken/empty where numbers were nullified. If a section cannot be reliably isolated, prefer omission — the zip already omitted the worst data files. Remaining non-redacted numbers in algorithms must **not** be treated as the owner’s real finances.

## Still not in this repo

- Raw unsanitized `ranking_ui.html`  
- One Lore personal income decision record (separate withhold)  
- Withheld ranking data/backups/frames listed in the archive inventory  
