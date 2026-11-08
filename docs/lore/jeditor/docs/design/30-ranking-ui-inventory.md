# 30 — Live ranking UI inventory → world mapping (M20)

Source: LIVE `legacy/legacy/html/ranking_ui.html` ([REDACTED-AMOUNT] B, Oct [REDACTED-AMOUNT]) served read-only from a /tmp copy on port [REDACTED-AMOUNT], captured 2026-11-01 ~5:25 PM CST by headless Chrome (all 11 tabs: text, inputs, buttons, headings, screenshots). Data: `vendor/workbook_local.json`, `actuals_local.json`, `budget_map.json`, snapshotted to `levels/ranking_world/source/`. These snapshots are newer than `data/ranking_ui/` (debt initial [REDACTED-AMOUNT] vs [REDACTED-AMOUNT] there).

Legend for **Map**: I item · J joy · B blueprint · C component (layout) · N node · S sub-component. **Gap** = needs new generic work. Status: ✅ built in M20 · ◐ partial · ☐ not yet.

Decisions applied: not everything is under a tab (sidebar, top bar and status are ordinary components beside the tab component); tabs are an ordinary `tabs` component; expense lines are items (jgroups) with jreq and `alts`; blueprints live in the world; views hold all theme; **live scenarios CURRENT / PROJECTED / PROJ+REVIEW and Review→Proj / Proj→Current are not rebuilt** (alternatives replace them; only `current` values are imported); Starlink Roam/Y1-DB etc. only as the data has them.

## 0. Frame (outside the tabs)
| Live element | Map | Gap | Status |
|---|---|---|---|
| Brand "❯JWorkbook", subtitle "ranks · calendar · joys · Exp6 run() · gain +$ · spend −$ · Moho · GrokNight" | C text view | text view | ☐ |
| Scenario buttons CURRENT/PROJECTED/PROJ+REVIEW, Review→Proj, Proj→Current | dropped (decision) | — | n/a |
| Perf line "trav 50.4/8ms · run() 32.2ms · n=15" | C text from runtime stats | template tokens `{run.ms}` | ☐ |
| Reload / Budget disk / Save (POST /api/save-workbook) | offline: export world JSON (download) / import | persistence back to workbook offline | ☐ |
| Tab strip SUMMARY REVIEW INCOME EXPENSES RANKS CALENDAR PREVIEW MODEL TOOLS DEBT ASSETS GOALS | C `tabs` component, subs = tab comps | tabs-as-component (existing `switch` generalised) | ✅ (switch) |
| As of [date input] + Live | J asof + date input | date input view | ◐ (picker) |
| Flow line "INCOME.net +[REDACTED-AMOUNT] → EXPENSES living −[REDACTED-AMOUNT] → DEBT cash −[REDACTED-AMOUNT] → surplus +[REDACTED-AMOUNT] · DTI [REDACTED-AMOUNT] · pools mo=[REDACTED-AMOUNT]" | C text with joy tokens | text template view | ☐ |
| Sidebar LIVE ROLL-UP: 8 KPIs SURPLUS, DTI, NET, LIVING (cal spend [REDACTED-AMOUNT]), RUN() H, RUN() M, RANK ITEMS [REDACTED-AMOUNT], NET WORTH | C `kpi` layout, joys | KPI view | ☐ |
| Status block (✅ lines) and "How sheets calc into other sheets" (11 lines) | C text (markdown-lite) | text view | ☐ |
| "WebGPU off · gpu_opt_in" | runtime backend stat | — | ◐ |

## 1. SUMMARY
Text "Yellow = edit… Scenario: CURRENT…"; table MONTHLY/AMOUNT/SOURCE: Gross Income [REDACTED-AMOUNT], NET Income [REDACTED-AMOUNT], Living Expenses [REDACTED-AMOUNT], Debt Payments (cash) [REDACTED-AMOUNT], MONTHLY SURPLUS OR DEFICIT [REDACTED-AMOUNT], DEBT-TO-INCOME RATIO [REDACTED-AMOUNT]; ACTION PLAN 3 textareas (Increase income / Decrease living / Decrease debt). Map: table view over joys; 3 text joys + text input. Gap: table view (joy rows), text input (click-only → on-screen keyboard). Status ✅ table, ◐ action plan text (read-only display).

## 2. REVIEW
Accept/Reject per item for 12 joy/action additions vs baseline; Accept all / Reject all / Recompute / Load disk pending. Tied to PROJ+REVIEW staging → **dropped by decision** (alternatives replace scenarios). Not rebuilt; listed for completeness.

## 3. INCOME
Text "Entitlements & deductions are inputs. Gross = SUM(entitlements), Net = gross − deductions, Annual = ×[REDACTED-AMOUNT]. Current only."; ENTITLEMENTS table 16 rows NAME/AMOUNT/× + Add; DEDUCTIONS 15 rows + Add; totals GROSS MONTHLY INCOME [REDACTED-AMOUNT], DEDUCTIONS [REDACTED-AMOUNT], NET MONTHLY INCOME [REDACTED-AMOUNT], ANNUAL GROSS [REDACTED-AMOUNT], ANNUAL NET [REDACTED-AMOUNT]. Map: items (group income_ent / income_ded, values.amount), comps `income_entitlements`, `income_deductions` with layout `table`; blueprint `income_calc` = sum nodes → joys gross, deductions, net, annual_gross, annual_net. Inputs: number input (number pad), name (keyboard), × remove, Add. Status ✅ (M20c).

## 4. EXPENSES
- Intro text; section jump list ([REDACTED-AMOUNT] sections); Add row (section select, name, amount) / + Section.
- Table CATEGORY/AMOUNT/PAY TO DEBT/SCORE, per section "living −$x", per row ▸ open, name, amount, pay-to-debt select (Living / → [REDACTED-INSTITUTION] · Student Loan / → [REDACTED-INSTITUTION] card), score "[REDACTED-AMOUNT] +12%" or "—", ×. 97 rows. Rows with endDate/afterEnd/finalMonth/finalAmount/payDebt.
- ▸ open: alternatives panel per item (redundancy.items: [REDACTED-AMOUNT] entries, alts with key/label/amount/value/available/children/flows/rubric/pts, pref/prefQuota, req, bad, buffer, burnout, invest, lr, real) with Try / Restore / Unavail. / Edit / ★ pinned / Requires / Needed by.
- Panels below "Health legend": Actual vs plan ([REDACTED-INSTITUTION] checking/card, drift, rebase button), Month-to-date by category table (LINE/PLAN/ACTUAL MTD/REMAINING/PROJECTED/HEALTH; budget_map rules), Unmapped, Legacy ([REDACTED-AMOUNT] groups, 215 alts, history only), Critical items, Plan for the bad ([REDACTED-AMOUNT] groups), June [REDACTED-AMOUNT] buffer + burnout (Run buffer scoring), Invest spare cash (Run invest checks; historical stats), Realism (inflation table), Preferred plan (quota), Cash criticality calendar (14 months min headroom/end), long-range tables ([REDACTED-AMOUNT]/60/kids/pension), plan steps (#/STEP/WHEN/REQUIRES/PLAN WINNER/CASH AFTER/NEEDED BY) and month columns 2026-10[REDACTED-AMOUNT][REDACTED-AMOUNT].
- Map: items with `alts` (alternatives = item alternatives already in world v5, pickAlts / Exp6), jreq for Requires/Needed by, section comps per expense section, blueprint `expense_calc` (sum per section → joy living; payDebt routes to debt cash), table view with alt sub-rows (S), section views for panels. Gaps: table with expandable row (◐), select input (choice), Try = session state, long-range simulators (household_economy.js / review_model.js) are not generic → kept as **data-only sections** (☐).
- Status: ◐ (M20d: rows, sections, living total, alternatives list; panels ☐).

## 5. RANKS
Text "Rank all Board items… Mode: manual drag · focus 11/2026"; buttons Calendar sets rank / Manual rank; Factor importance mirror (8 factors, harmonic % by drag order: M 36.794%, H 18.397%, S 12.265%, U 9.198%, A 7.359%, D 6.132%, T 5.256%, E 4.599%); factor dim buttons H D A M E T U S + factor; "HIGHER RANKING MEANS" + Edit meaning; ranked list 59 items with hours (days×duration in focus month), harmonic % (1/k ÷ H₅₉), factor/non-factor toggle. Map: joys per factor (weight = harmonic of order), item rank orders as item state per dim, `rank` view (drag list) — gap: drag-rank view (generic: reorder items of a comp, writes order), harmonic node. Calendar sets rank = hours from calendar occurrences (days×duration) → order. Status ☐ (M20f).

## 6. CALENDAR
Header text (Work 7:00–16:00 CST, Money law, Focus 2026-11, Cal surplus [REDACTED-AMOUNT], mo [REDACTED-AMOUNT]/[REDACTED-AMOUNT], [REDACTED-AMOUNT] acts); Calendar/Board toggle; EXP6 scenario pills (dropped); MIX line; ‹ Nov [REDACTED-AMOUNT] › Today, Jump to Suggest, All years, Copy previous month, Copy year, Clear calendar, Phone batch v6, Fill gaps, Seed morning canvas, Delete; rails "Work · [REDACTED-AMOUNT]/16→[REDACTED-AMOUNT]/1 · pay 1 · crosses month" + [REDACTED-AMOUNT] bill rails; day cells "N items" with chips; action form (cadence select [REDACTED-AMOUNT]/7, Every day, Weekdays, Some days/week, Every N days, Once a month, Once a year, Painted days; days, hours, expense picker). Map: M19 money calendar template (accumulate, nav, rails, detail, as-of) + importer from calendar.customActions/rules. Gaps: hour lanes, painted days, copy month/year tools. Status ☐ (M20e; M19 parity already max diff 0 on cash/headroom).

## 7. PREVIEW / MODEL TOOLS
PREVIEW: score breakdown for a selected board item, factor importance (same 8), board items sorted high→low with "#rank · score/1000". MODEL TOOLS: factor authoring list, + factor, jmethod/3D toolbench. Map: Exp6 engine scores (JFactor) shown in a list view; factor joys. 3D/jmethod authoring is engine tooling, not rebuilt. Status ☐.

## 8. DEBT
Text formula line; table CREDITOR/PURPOSE/INITIAL/AS OF/LIVE/GAP/APR %/TERMS0/TERMS/DAYS/INTEREST/PRINCIPAL/AMOUNT DUE/CASH PAY/PAYOFF/SOURCE + Legacy/×; TOTALS row; Legacy debts table (history only, X-out); explanation; Sanity line "balance [REDACTED-AMOUNT] · APR [REDACTED-AMOUNT] · terms [REDACTED-AMOUNT] · days [REDACTED-AMOUNT] → amount due ≈ [REDACTED-AMOUNT]"; Add debt form; Σ line; DEBT-TO-INCOME block. Map: items group debt (values initial, asOf, apr, terms0, days), blueprint debt_calc (interest = balance×apr/365×days, principal = balance/terms, due), LIVE walk-down on calendar pay days needs accumulate over pay dates. Status ☐ (M20g).

## 9. ASSETS
Text; add-row form (group select, name, $); SAVINGS 14 rows, REAL ESTATE 3, PERSONAL PROPERTY 3, subtotals; TOTAL ASSETS [REDACTED-AMOUNT], TOTAL DEBT [REDACTED-AMOUNT], NET WORTH [REDACTED-AMOUNT]. Map: items group asset_*, sum nodes, table view. Status ☐ (M20h, same pattern as Income).

## 10. GOALS
Text "Free-text goals"; Short/Medium/Long textareas. Map: 3 text joys + text view. Status ☐.

## Generic gaps (new view features)
table (rows = comp items or joy list, columns = value fields / joys, totals rows), kpi, text with `{joy:x}` tokens and money format, number input (number pad), choice input (picker), date input (picker), tabs (generic switch), drag-rank list, expandable row, chart (not needed by live tabs except Model Tools), persistence (export/import world JSON; no server writes offline).


> Status as committed with M20 start (rev after 54): nothing in this table is built yet; statuses are updated per milestone report.
