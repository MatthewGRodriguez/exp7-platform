# ADR 0014: Condition combining is configurable
Status: decided (2026-10-30)
Decision (Matthew: "Configurable"): how calendar highlight conditions combine is configurable in the editor, per calendar.
Proposal (not yet confirmed): a `combine` setting on JCalendar. Default mode `severity` = all matches shown, most severe wins (bad > warn > na > good). Optional mode `groups` enables nestable AND/OR condition groups with their own style/animation.
See docs/design/06, ADR 0012, ADR 0013.
