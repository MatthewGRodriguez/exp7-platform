# ADR 0002: Everything is a level
Status: accepted (2026-10-30)
Decision: the editor output is a level, one self-contained HTML file containing the level JSON, the runtime, the used components and the pre-rendered DOM. The JSON is the source of truth and the file round-trips into the editor. No external data for now.
See docs/design/03.
