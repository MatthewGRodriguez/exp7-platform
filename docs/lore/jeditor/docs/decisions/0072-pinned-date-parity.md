# ADR 0072: Date-dependent parity tests run on their capture instant

Status: accepted (2026-11-01), M15b

- calendar_parity and sync_parity compared today's model against references captured on 2026-10-31 / 2026-10-30, so they failed on any other day.
- `builder/test/pin_date.js` pins `new Date()` / `Date.now()` to the capture instant: 2026-10-31 05:27 CDT for calendar, and the capture's `capturedAt` for sync. Real elapsed time still advances.
- Both tests pass with max diff 0 and `sameDay: true`, and the result JSONs record `pinnedTo`.
- Re-capturing the references on a new day remains possible, but it is not needed.
