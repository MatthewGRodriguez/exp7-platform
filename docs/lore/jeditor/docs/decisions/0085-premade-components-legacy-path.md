# ADR 0085: Premade components are discarded from the editor; legacy levels keep building; the personal-data note is removed

Status: accepted (2026-11-01), M17. Decided by Matthew in the M17 design talk.

- **Discarded:** the premade component library (`builder/components/*`, the ItemCalendar, ItemPlan, ItemBoard, AsOfControl, board-parts, JoyTable, RankList, DataTable, CalendarBoard and Plan* families, and their editor panels). The new editor's palette offers only the new primitives: items, joys, blueprints with the seven node types, components, and templates.
- **Legacy levels stay.** ranking_ui_v1 (frozen reference), ranking_data, task_calendar, ranking_rebuild, income_rebuild and m8_rebuild keep their files and Lore history.
  - They build through the **legacy generator**, `builder/build_level.js` with `builder/components`, which is now frozen: no new features, kept only so those levels build.
  - The legacy editor stays reachable at `/legacy` for them.
  - The default editor at `/` is the new world editor, which targets the version 5 world format and the new generator `world/build_world.js`.
- **Removed:** the personal-data note (Matthew: "idc if it is personal data").
  - The `PERSONAL DATA` badge driven by `meta.containsPersonalData` is no longer rendered by AppShell.
  - The legacy levels were rebuilt once. Their HTML differs from the previous build **only** by that badge (verified by diff; see docs/design/25).
  - Worlds have no such flag.
