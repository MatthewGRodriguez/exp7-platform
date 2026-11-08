# ADR 0097: Calendar view controls and per-item plan highlight

Status: accepted (2026-11-01), M19.

- Calendar layout options (all world data, all optional): month nav (‹ › Today), `range` (two clicks; net, charge count and lowest value), `detail` (click a day: lines with amounts), `asof` (a joy holding YYYY-MM-DD; As-of mode sets it with a click; the banner shows what changed since the previous as-of), `controls` (joy steppers), `legend` (states with labels), `rails` (spans between inflow days).
- `section` layout: lists the items of a source comp that match a rule (`daystate` with states, `past`, `future`, `flag`); used for plan sub-sections.
- Plan rows take the day style only when that item itself carries a conflict or broken flag (fixes the M18 "every item on a conflicting day is marked" issue).
