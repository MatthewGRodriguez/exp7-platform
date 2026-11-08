# M19 report (2026-11-01)

Goal: the calendar template gets the legacy calendar's features, generically. Feature map: docs/design/28-calendar-feature-map.md (23 built or already present, 4 remaining generic items, 8 rd_live sections not generic as-is).

## Built (ADRs 0095–0099)
- Evaluator: `accumulate`, `merge`, `condition.b`, `view.label`; `charges`/`ledger`; occurrences `on`/`monthdays`/`dates`/`until`; pay days, charge modes, lastAmount.
- Runtime calendar: nav/Today, range, day detail, as-of + what changed, joy steppers, legend, rails, section layout, per-item plan highlight.
- World model: `moneyPreset`, template `money`. Importer tools/import_ranking_calendar.js.
- Editor: Templates → Money calendar; calendar panel (legend/rails/range/detail toggles, as-of joy, steppers, Apply money preset); Board item amount (number pad), flow, charge, pay days, on-days; repeat monthdays; layout `section`.
- Automatic stamp (milestone from newest report, Lore revision).

## Verified
- money_parity: 726 checks over 8 months, max diff 0; chips 3 months 0 mismatches; 38 items imported, 0 skipped.
- world_test 77/77 (13 new). Legacy tests (board_parts, calendar, items, janim, jdata, motion, plan, rank, sync, engine node_parity) pass.
- Editor from empty by clicks (editor/test/make_m19_spec.js → m19_editor_result.json, port [REDACTED-AMOUNT], /tmp copies): money template (6 comps, 3 bps, 4 joys); pay [REDACTED-AMOUNT] in on 1,[REDACTED-AMOUNT], rent 2500 monthly, gym weekly Tue; preview labels [REDACTED-AMOUNT] / [REDACTED-AMOUNT] / [REDACTED-AMOUNT], bad on 3rd, low on 15th; nav next/Today; range 2–[REDACTED-AMOUNT] net [REDACTED-AMOUNT]; detail 3rd "rent −[REDACTED-AMOUNT]"; as-of 10th, what-changed 1; opening [REDACTED-AMOUNT] → labels [REDACTED-AMOUNT]; sections critical 2, past 2, future 1; export self-contained, CSP closed. 0 exceptions.
- Offline export (m19_offline_result.json): nav, warning stepper, range 1–[REDACTED-AMOUNT] net [REDACTED-AMOUNT], as-of 20th (2 changed), real drag of gym onto the 20th, detail 15th "pay [REDACTED-AMOUNT]"; requests only the file + its blob.

## Unverified / limits
- Preview waitFor for first labels timed out once (later steps had labels); past-day dimming follows the real today, not the as-of joy; rails label the period before the first pay day as "prev [REDACTED-AMOUNT]".
- Parity does not cover the legacy alternatives projection or plan paths. Remaining: scenario pills, tombstones, alternatives path search, time lanes (see feature map). WebGPU on hardware and Safari not tested.
