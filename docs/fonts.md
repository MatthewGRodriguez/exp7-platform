# Fonts

The lean HTML embeds four fonts as JRF, JRender's outline format (`rust/runtime/src/dl.rs` `Font::parse` in
[exp7-jrender](https://github.com/MatthewGRodriguez/exp7-jrender)). There is no substitute font: a character a font has no
glyph for fails with `GLYPH_MISSING` ([design-system.md](./design-system.md) section 4).

| Block | Font | Characters | Used by |
|---|---|---|---|
| `jr-font-ss3` | Source Sans 3 Regular | 687 (1.8.78) | Budget journal |
| `jr-font-ss3-semibold` | Source Sans 3 Semibold | 687 (1.8.78) | Budget journal |
| `jr-font` | DejaVu Sans | 243 | other views (JRViews default) |
| `jr-font-bold` | DejaVu Sans Bold | 243 | other views (JRViews default) |

## Source Sans 3 (the journal)

**1.8.64 to 1.8.77:** 120 characters each: ASCII and a few marks (`£ ¥ © ® ° · × ÷`, dashes, quotes, `• … ‰ € −`). No
accented letters, so from 1.8.77, where Home measures every character, a name such as "Café" stops Home with
`GLYPH_MISSING`.

**1.8.78:** the same 120 glyphs, byte for byte, plus 567 more from the same build of the same font:

- Latin-1 Supplement (U+00A0 to U+00FF) and Latin Extended-A (U+0100 to U+017F), every character;
- what the font has of Latin Extended-B (for example `ƒ Ș ș Ț ț`), spacing modifier letters, Latin Extended Additional
  (Vietnamese and others), general punctuation, currency signs and letterlike symbols.

Not included: Greek, Cyrillic, combining marks (a letter typed as a base letter plus a separate accent), emoji, and any
other script. A name with one of those still stops Home with `GLYPH_MISSING`.

Every glyph's ink sits between the font's descent (-400) and ascent (1024 of 1000 units), so a text box taken from
`core.metrics` holds its accents. Units per em, ascent and descent are unchanged, so text without accents lays out
exactly as in 1.8.77.

**Source:** Source Sans 3 version 3.052, the Google Fonts build (the npm package `@fontsource/source-sans-3` 5.3.1,
`latin`, `latin-ext` and `vietnamese` files, weights 400 and 600). It is the build the 120-glyph embed was cut from:
its glyphs match the embedded ones in advance and to within one font unit in outline. Converted with
`tools/jrf_font.py extend` in exp7-jrender, which keeps the old glyphs and adds the new ones from TrueType outlines.

**Licence:** SIL Open Font License 1.1, which allows bundling and embedding in software. The licence text travels in the
lean HTML itself, in the `font-licence-source-sans-3` block just before the two font blocks.

> © 2010-2024 Adobe (http://www.adobe.com/), with Reserved Font Name 'Source'. Source is a trademark of Adobe in the
> United States and/or other countries. This Font Software is licensed under the SIL Open Font License, Version 1.1.
