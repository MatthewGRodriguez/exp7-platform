# Open / control **Moho.app** (CLI-first · crash-safe)

**Agreement:** Design in Moho = **`/Applications/Moho.app` Pro**.

## Crash law (2026-08-05 ×2)
```
open -a Moho ANY_DOCUMENT   # BAD — SVG and .moho both SIGSEGV
# stack: windowDidMove: nil ← WindowManagement tiling ← AE open docs
```
living-core **never** passes file args to `open -a Moho`.

## A) Pro CLI (reliable densest)
```
/Applications/Moho.app/Contents/MacOS/Moho script.lua
/Applications/Moho.app/Contents/MacOS/Moho file.moho script.lua
living_invoke app:Moho action=scaffold
living_invoke app:Moho action=lua args=[…/scripts/CreateJWorkbookProject.lua]
```

## B) GUI (manual document open only)
```
living_invoke app:Moho          # empty app only
# then in Moho: File → Open → project/JWorkbook_chrome.moho
```

## C) Design
1. scaffold → JWorkbook_chrome.moho (L0…L13).
2. File→Open in GUI (not open -a).
3. Animate with Pro tools · export SVG → ../exports/.
4. design_bindings places FX in ranking_ui.
