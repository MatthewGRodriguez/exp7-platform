# ADR 0095: `accumulate` node and generic item charges

Status: accepted (2026-11-01), M19.

- `charges(item, month)` turns an item's values into a per-day amount for a month: `amount` (per month), `flow` in/out, `charge` each|first|last|per, `pay` (charge days separate from the days the item appears), `until` and `lastAmount` (final month: the final amount on the month's schedule even after `until`, matching the legacy final-month rule).
- `occurrences` gains `on` (weekly weekdays, `monthdays` clamped to month length, `dates` lists) and `until`; `monthly` clamps to month length.
- `accumulate {opening} -> values, flows, ahead, min, end` is a running sum over a component's items starting from an opening joy; `ahead` = minimum value until the next inflow day (legacy headroom). It reads `members:comp` + `items*`, never the comp itself (no self-loop).
- Nothing money-specific: the same node sums hours, points or any numeric field.
