# ADR 0066 — Scenarios (projected/review) are legacy; alternatives replace them

Status: accepted (2026-11-01), M15. Matthew: "Projected and review is a legacy concept"; "the alt system is the new way".

- The new generic components have no scenario concept. Any what-if is an item alternative, and ItemPlan picks among them.
- In ranking_data (stateVersion 2 → 3, `tools/migrate_to_data.js generic()`):
  - Every income or expense row whose `current` is empty takes the first non-empty `projected`/`review` value. The real data had 0 such rows out of 128, so the numbers are unchanged.
  - The `projected`/`review` keys are removed from rows and collection fields.
  - `workbook.calendars.projected` and `workbook.calendars.review` (65 + 65 acts) are deleted, along with `cal.scenario` and the `@cal_acts_projected`/`@cal_acts_review` item types.
  - `data.legacy` makes the runtime fold an older saved state (v1/v2 in localStorage) the same way on load. This was verified: a v2 save with the scenarios reloads with only `calendars.current`, and the KPIs are unchanged.
- **Left behind or ignored:**
  - The scenario columns of the source workbook files in `data/ranking_ui/` are untouched (they are copies).
  - `workbook.activeScenario` stays `'current'` because the verbatim-extracted original functions read it. It is a fixed pack constant, not state that can be switched.
  - The pack fallback helpers `cur()`/`amt()`/`lineAmt()` still list projected/review. Those keys no longer exist, so the fallback is inert. It was left in the packs so that the v1 pack bytes and calendar parity stay unchanged.
- CalendarBoard gained `scenarios:false`. The default stays true so that the frozen v1 reference level renders as before.
