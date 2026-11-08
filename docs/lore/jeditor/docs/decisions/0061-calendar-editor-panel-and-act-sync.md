# ADR 0061 — Calendar editor panel; joy-linked act amounts (M14b)

Status: accepted (2026-10-31)

- `editor/calendar.js` (right-panel tab "calendar") builds and edits calendar acts by clicks/pickers only: start an empty calendar, add a CalendarBoard, opening cash, paydays (1st & 15th, 15th & last, 1st, 15th, last day), monthly bills (day 1–31), weekly (weekday), one-off (month + day), amount, recurrence, on/off, delete, alternatives (add / amount / delete / choose by index, "use original"), joy link (new `amt_*` joy or an existing joy), and condition blueprints (highlights).
- Acts keep the calendar engine's own shapes (monthly `payDays`/`monthBill`, weekly `lastSpan`, one-off `selected` + `eachOccur`); the income/expense sheet row with the act's name is written with the act, because the engine takes gain amounts from the income net and spend amounts from the matching expense line.
- An empty calendar deletes `cal.conditions/condSig/condBps` instead of storing `[]` (condSync reads an empty unsigned list as "the page deleted every condition").
- `jdata.actSync` (runs before condSync): an act with `amountJoy` takes |joy value| as `amountMonthly` and as its sheet row, so a joy edit moves the calendar.
- The editor undo snapshot also carries `state.values` (except `data`/`activeTab`), so workbook / ranks / calendar edits undo.
