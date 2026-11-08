# Moho stage status

| Item | Status |
|------|--------|
| Moho 14.3 binary on Mac | Inventory-confirmed: `/Applications/Moho.app/Contents/MacOS/Moho` |
| `-h` help | **BLOCKED** — no text within 20s |
| Bare `Moho script.lua` (SmokeQuit / CreateExp7ArtComparison) | **FAIL observed** exit **139** SIGSEGV, empty logs (2026-11-08). No scene created. **Not evidenced as licensing/first-launch.** |
| Documented CLI (`Moho file.moho script.lua` or `Moho -r …`) | **BLOCKED** — researched from Lost Marble docs/forum; **not yet proven** on this Mac |
| Real `.moho` seed | **SHIPPED** `art/pipeline/moho/seed/JWorkbook_chrome.moho` (archived living-core; not fabricated) |
| Comparison / animate / FileRender | **BLOCKED** until a non-crashing CLI form exits 0 |
| Fabricated Moho PNG/GIF in repo | **NONE** |
| GUI activation workaround | **Not recommended** without evidence |

See `art/pipeline/moho/BLOCKED.md`, `README.md`, and `art/pipeline/mac/MAC_RUNBOOK.md`.
