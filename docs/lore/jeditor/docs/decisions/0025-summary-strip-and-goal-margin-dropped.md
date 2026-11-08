# ADR 0025: Summary strip and goal margin dropped from v1
Status: decided (2026-10-30). Refines ADR 0012, 0013, 0024.
Decision (Matthew: "Dropped" / "dropped."):
1. The summary strip (income, expenses, debt, surplus across the top of every tab; ranking_ui "graph line", FlowStrip) is dropped from the v1 shell, along with the SUMMARY tab.
2. The `goalMargin` metric and the goal-based default conditions ("goal test fails" -> bad, "within 10% of failing a goal" -> warn) are removed from v1, not kept disabled.
v1 default calendar conditions:
- cash after bills < [REDACTED-AMOUNT] -> bad;
- cash after bills < [REDACTED-AMOUNT] -> warn;
- decision item with no healthy fallback -> bad (item scope).
Paydays 1st/15th remain ledger config.
Built-in metrics: `cashAfterBills`, `noHealthyFallback`. The `goal` metric source stays in the registry schema for later, with no built-in using it.
