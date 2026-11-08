# Blender stage status

| Item | Status |
|------|--------|
| Blender 4.2.1 LTS on Mac | Inventory-confirmed: `/Applications/Blender.app/Contents/MacOS/Blender` headless works |
| Cycles METAL Apple M3 (10 cores) | Inventory-confirmed |
| Generator | **SHIPPED** `art/pipeline/blender/generate_ui_scene.py` (4.2.1 + session METAL, no prefs edits) |
| ArtScratch outputs | `/Users/user-rodri/ArtScratch/exp7-art/blender/<stage>/` · one heavy job via `.heavy.lock` |
| Cloud execution | **NOT RUN** (no Blender here) |
| Measured lighting fits | **OPEN** until Mac PNGs traced; `art/lighting/fits.json` is provisional |

See `art/pipeline/mac/MAC_RUNBOOK.md`.
