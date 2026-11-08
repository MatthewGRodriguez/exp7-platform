# ADR 0015: Conditions apply at all scopes
Status: decided (2026-10-30)
Decision (Matthew: "allow all of them"): calendar highlight conditions can apply at day, week, month, date range and item scope. Wider scopes roll up the metric with its registry `aggregate` (ADR 0013); a metric's `scopes` list limits which scopes the editor offers for it.
See docs/design/06.
