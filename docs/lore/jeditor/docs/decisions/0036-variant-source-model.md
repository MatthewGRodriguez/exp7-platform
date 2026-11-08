# 0036 — Component variants and source viewing

Status: accepted (M7, 2026-10-30)

## Context
M7 asks for "editing based on a component" without letting the editor run arbitrary JS. Component behaviour lives in `builder/components/*.js`, which is trusted code.

## Decision
- **Source is read-only.** `GET /api/component-source?type=` returns the component file. The inspector's *source* panel shows it so you can read it, not edit it.
- **Variants are data.** A variant is stored in `level.customComponents` as `{type:"<Base>__<name>", base, blocks, css}`. `builder/runtime/jvariants.js` (`JVariants`) compiles it from a whitelist:
  - blocks: wrapper / prepend / append text, class names;
  - CSS: the variant's own scoped properties only.
  
  No script, no URLs, no `@import`, no `url()`.
- **Errors show in place.** An invalid variant renders an inline error box in the preview and the export. It does not throw, so the rest of the page keeps rendering.
- **UI only.** Names come from `presets.json` (variantNames) or the on-screen keyboard (id charset a–z, 0–9, _). Values are picked, never typed in a text field.

## Consequences
- Variants are safe to embed and need no CSP changes.
- New *behaviour* (for example RankBoard or CalendarBoard internals) still needs code.
