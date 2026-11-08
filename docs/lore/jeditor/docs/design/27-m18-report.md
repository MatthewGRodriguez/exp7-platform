# M18 report (2026-11-01)

## 1. Legacy bug: `rows(c).push` on null
Cause: an ItemCalendar from the palette had no data collection. Fix: ensureCol on first add (undoable), rows() never null, add refused without a calendar (ADR 0093). Reproduced with the old code in a /tmp copy; regression click spec passes (add, undo removes item+collection, redo restores). Legacy parity tests (board_parts, calendar, items, janim, jdata, motion, plan, rank, sync, engine node_parity) all pass.

## 2. Calendar template (ADRs 0091, 0092, 0094)
Calendar (day grid, recurrence, duration, day states from blueprints) + Board (new, sort, filter, → Calendar, drag onto a day) + Plan (jreq sequence, Exp6 alternatives, broken/conflict flags), joined by a Board/Plan switch. Editor: Templates → Calendar; component panels for month/switch/board items (date, repeat, → Calendar)/plan rows; layout picker gains calendar/board/plan.

## Verified (headless Chrome, port 8798, /tmp copies)
- Editor from empty by clicks (editor/test/make_m18_spec.js → m18_editor_result.json): template creates 3 comps + 3 blueprints, no link back; Board creates gym/report/review, dates via picker, gym weekly, two added to the calendar; jreq review→report set, self-jreq refused; Plan panel shows "after report ⚠ conflict"; preview: day 6 busy, plan conflict, Plan switch, + New, real drag of gym onto the 12th inside the preview iframe (date set, added to the calendar, weekly repeat shows on the 19th); export self-contained, CSP closed.
- Offline exported HTML (m18_offline_result.json): exp6/worker/webgpu, + New, sort, filter, → Calendar, real pointer drag onto the 20th (date set, membership added), Plan flags conflict; requests only the file and its blob; no exceptions.
- world_test 64/64 (17 new calendar checks). M17 editor/offline specs rerun pass.
- cdp_shoot drag gained `frame` (iframe offset).

## Unverified / remaining
- Day-level style marks every item on a conflicting day (report also gets the conflict style; only review carries the flag).
- No keyboard entry of dates (by design: pickers); month navigation only via the calendar panel picker.
- Real WebGPU on hardware not measured here; Safari not tested.
