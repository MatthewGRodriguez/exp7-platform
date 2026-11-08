# ADR 0094: A view node reads its component only when `changed` is wired, events only when `events` is wired

Status: accepted (2026-11-01), M18.

- Previously every view node read its comp, so a blueprint that writes a comp's style and is wired from the same comp looked like a self-loop. Reads now follow the wired outputs, removing false cycles (the calendar template has none). Real cycles are still refused.
