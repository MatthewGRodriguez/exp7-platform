# 0045 — Per-component theme (parts, inheritance, presets, packs)

Status: accepted (2026-10-31)

## Decision
- A theme is a set of named parts:
  - `tokens` (any level token: surf, surf2, bg, border, text, muted, primary = accent, gain/spend = money +/−, radius, font-body, …);
  - `shadows.tight|wide {y, blur, a}` (the two baked TDD shadows);
  - `fontSize`, `pad` (px), `font`;
  - `anim` (an embedded `.janim.json`, ADR 0046);
  - `from` (pack provenance).
- Where it lives: level = `level.theme.tokens` + `level.theme.shadows` (fed into the JMotion table, so they change every component) + `level.animation`; type = `level.theme.types[Type]`; component = `component.theme`. Inheritance is level < type < component, resolved at build time (as in M9 motion).
- Emission, scoped to `[data-jmo=id]`:
  - tokens become CSS custom properties on the component's top-level elements, so the whole subtree, including the base CSS, picks them up;
  - shadows become `box-shadow` on `[data-sm]::before/::after` inside the component (after the anim state CSS, so explicit shadow parts win);
  - fontSize/pad use the raised-specificity rule (ADR 0044).
- Editor Theme panel: scope component / type / level. Each colour part has a swatch, its effective value and source (level/type/component), a clear (×) button, a swatch picker (editor/theme_presets.json palette), and hue/lightness/saturation steppers. There are also steppers for radius, font size and padding, a font picker, and y/blur/alpha steppers for both shadows. The panel also hosts the animation part (ADR 0046).
- Presets: `editor/theme_presets.json` (gold, ocean, flat, compact, money_swap). Applying one copies its parts into the scope and keeps the animation part.
- Packs: `packs/themes@1.0.0.jpack.json` `{format:'jeditor-pack', id:'themes', themes:[{id, name, theme}]}`, written by `POST /api/theme-packs`. "Load from pack" COPIES the theme into the level, with `from: 'themes@1.0.0#id'` (ADR 0023: levels embed their copy; a pack change never alters a saved level).
