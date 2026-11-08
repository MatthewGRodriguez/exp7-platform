# ADR 0078: The world holds everything as data

Status: accepted (2026-11-01), M17. Decided by Matthew in the M17 design talk.

- A **world** is one JSON document, `{format:"jeditor-world", version:5, id, title, items, joys, blueprints, components, root, clock}`. Each of `items`, `joys`, `blueprints` and `components` is a map from id to record.
- It contains:
  - **no instances**: nothing is stamped from a type at run time; every record exists exactly once;
  - **no local spaces**: no record belongs to, or is private to, another record;
  - **no item types**: what an item "is" follows from the joys it uses (ADR 0079).
- The format is data-heavy and rigid on purpose. Every reference is an explicit `"<kind>:<id>"` string (`item:x`, `joy:x`, `bp:x`, `comp:x`), so references can always be listed and checked.
- The generator embeds the **whole world** in the single HTML file. Compression may come later and would not change the model.
- Code: `world/world.js` (model, validation, reference index), `world/eval.js` (evaluator), `world/runtime.js` (page), `world/build_world.js` (generator).
- Supersedes the item, collection, scenario and type parts of 0011, 0047, 0051 and 0065 for new work. Those records stay valid for the legacy levels (ADR 0085).
