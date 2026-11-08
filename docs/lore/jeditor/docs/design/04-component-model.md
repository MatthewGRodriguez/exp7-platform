# 04 - Component model

The editor is component-based: pick a component, configure it through generated panels (no typed code), place it in a slot, and the level assembles it.

## Component definition
```js
defineComponent({
  type: 'Card', version: 1,
  props: {                       // drives the generated config panel
    title:   { kind: 'text', default: 'Card' },
    tone:    { kind: 'choice', options: ['neutral','gold','blue'], default: 'neutral' },
    padding: { kind: 'number', min: 0, max: 32, step: 2, default: 12 }
  },
  slots: { body: { accepts: ['*'], max: null } },
  states: ['idle','hover','pressed','selected','disabled'],
  animations: { enter: 'rise', hover: 'lift', select: 'flash' },   // defaults, editable
  render(props, slots, h) { /* returns DOM */ }
});
```
- Prop kinds map to panel controls: text (inline field), number (slider/stepper), choice (segmented), bool (toggle), color (swatch), list (repeater), ref (component picker). Text entry is only for labels; no code or formulas.
- Every component gets the standard animation editor from doc 02 for its default animations.
- Composition rules: slots declare accepted types and max children; the editor only allows valid drops; layout comes from container components only.

## Starter components (from the survey)
| component | seen in |
|---|---|
| AppShell (header, top bar, status line) | ranking_ui, training designer |
| Tabs + Pane (FLIP indicator) | ranking_ui, training designer |
| Button, PillGroup/Toggle | all three |
| Card, CardList (stagger reveal) | ranking_ui, training designer |
| Table | ranking_ui, training designer |
| NumberField (min/max/step, lock) | G1 |
| ResultDisplay / KPI | G1, ranking_ui |
| CalendarGrid / DaySchedule (drag blocks) | ranking_ui, training designer |
| Notice / Status, Loader | training designer |
| LineChart | ranking_ui |
| Grid / Columns (responsive) | G1, ranking_ui |
| JCalendar (incl. conditions-based highlights, e.g. cash criticality; metrics from the editor-configurable registry; combine mode configurable), JPlan (JFactor views, doc 06) | ranking_ui |

Components can bind props to JFactor items (each with its own alternatives), paths and scores of the level's single system (ADR 0011); JPlan is a view over the paths through item alternatives, incl. the current path (`ref` kind to the level `jfactor` block). The PREVIEW/blueprint idea is an editor mode, not a component (ADR 0010).

Item types (fields + scorer) are authored in the editor's Model mode as blueprints, modelled on ranking_ui MODEL TOOLS (ADR 0019). Components bind to item fields by key. Item types may come from shared packs (`packId/typeId`), embedded as copies in each level (ADR 0023).

v1 app scope (ADR 0024): six tabs; FactorEditor, LineChart and GraphView are not needed as app components in v1 (the editor Model mode has its own UI).

## Open questions
1. Is a minimal text field allowed for labels and numbers, or must even values be set by sliders/pickers only?
2. ANSWERED 2026-10-30: ranking_ui is the first reference level (JFactor originated there); G1 becomes a later second level (ADR 0005, doc 05).
3. Should component renderers be authored by us in code (and only configured in the editor), or should the editor also create new component types?
