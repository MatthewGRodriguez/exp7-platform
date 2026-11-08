# Export checklist — **from Moho.app**

Design SoT = **Moho.app**. living-core placeholders are bootstrap only.

## In Moho.app

- [ ] Project saved: `vendor/moho/project/JWorkbook_chrome.moho`
- [ ] Artboard 1280×800 · regions match `design_map.svg`
- [ ] Export each layer → `vendor/moho/exports/` (exact basenames):

| Layer | File |
|-------|------|
| Void | `L0_void.svg` |
| AccentWave | `L1_accent_wave.svg` |
| Chrome | `L2_chrome.svg` |
| PanelBreathe | `L3_panel.svg` |
| RunPulse | `L4_run_pulse.svg` |
| MoneySpark | `L5_money_spark.svg` |
| TabSwitch | `L6_tab.svg` |
| ReviewFlash | `L10_review.svg` |
| CalDrill | `L11_cal_drill.svg` |
| SaveOk | `L12_save_ok.svg` (optional; toast highlight is runtime) |
| RelationGraph | `L13_relation_graph.svg` (design ref; live graph is HTML) |

## After export

```
living_rank_cycle parent=probe_app_moho
# hard-refresh ranking_ui
living_ranking action=review   # if catalog/export hash moved
```

## Law

- living-core **never** overwrites a Moho-exported SVG that you just replaced (Best only fills **missing** placeholders).
- `.moho` project files are yours — living-core never authors binary Moho format.
