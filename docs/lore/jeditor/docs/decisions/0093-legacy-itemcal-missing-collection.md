# ADR 0093: Legacy ItemCalendar creates its collection on first add

Status: accepted (2026-11-01), M18.

- Bug: an ItemCalendar added from the legacy palette had no `props.collection` / doc.data entry; `rows(c)` returned null and adding an item threw `null is not an object (evaluating 'rows(c).push')` (itemcal.js, via popt).
- Fix: `ensureCol(c)` creates the collection (id from the component, fields name/date/repeat/days/hours/done/after) and sets `props.collection`, inside the same undoable edit; `rows()` returns [] not null; adding with no calendar selected is refused with a status message.
- Regression: editor/test/make_m18_itemcal_spec.js (click spec), result editor/test/m18_itemcal_result.json.
