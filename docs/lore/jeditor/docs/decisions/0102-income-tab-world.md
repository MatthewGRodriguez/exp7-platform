# ADR 0102 — INCOME tab as world data (M20c)

Status: accepted (M20c)

- Items: entitlements / deductions (imported, `values.amount`). Components `income_entitlements` / `income_deductions` use the generic `table`
  layout (NAME, AMOUNT editable by number pad, Add, ×). Totals rows show joys.
- Blueprint `bp_income`: `sum(entitlements.amount)` → joy gross; `sum(deductions.amount)` → joy deductions; `math sub` → net; `math const 12` ×
  gross / net → annual gross / annual net. No money component; only generic nodes.
- Frame: `brand` text + `tabs` (ordinary component with switch; INCOME is its first tab). Later tabs are added to the same group.
- Live differences kept on purpose: names are not inline text inputs (editor item panel, click keyboard); no CURRENT/PROJECTED/PROJ+REVIEW toggles
  (replaced by alternatives).
