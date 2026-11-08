# ADR 0012: Cash criticality merged into the calendar
Status: decided (2026-10-30)
Decision (Matthew: "let's combine the two, the highlighting is configurable by conditions set on the calendar ui"): cash criticality is not a separate component. JCalendar's highlighting is driven by conditions set in the calendar UI (metric, comparator, threshold/margin, scope, style/animation), evaluated on the selected path. ranking_ui's [REDACTED-AMOUNT] warning, 10% goal margin and 1st/15th paydays become editable default conditions/config, not fixed values.
Supersedes part (2) of ADR 0009. See docs/design/06.

Update 2026-10-30: which metrics a condition can use is editor-configurable (ADR 0013).
