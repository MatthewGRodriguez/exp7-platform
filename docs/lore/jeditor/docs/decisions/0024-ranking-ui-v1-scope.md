# ADR 0024: ranking_ui v1 scope: six tabs
Status: decided (2026-10-30)
Decision (Matthew: "Income tab, expenses tab, ranks tab, calendar tab, debt tab, assets tab, that's it"; "the one in the joy machine 2 is the one we have been using"):
- Reference: `~/Home/Dev/The Joy Machine 2/legacy/legacy/html/ranking_ui.html` (1.19 MB) is the current ranking_ui.
- v1 app tabs: INCOME, EXPENSES, RANKS, CALENDAR, DEBT, ASSETS.
- Out of v1: SUMMARY, REVIEW, PREVIEW (blueprint idea lives in the editor, ADR 0010), MODEL TOOLS (as an app tab), GOALS.
Consequences:
- The editor's Model mode for item-type blueprints stays (ADR 0019/0022/0023). Only the app tab is out.
- No GOALS data, so the built-in `goalMargin` metric and the "goal test fails" default condition have no source in v1 (open question, doc 05/06).
- Whether the summary strip (income, expenses, debt, surplus) stays in the shell is open (doc 05).
