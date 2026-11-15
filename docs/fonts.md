# Fonts

The lean HTML embeds four fonts as JRF, JRender's outline format (`rust/runtime/src/dl.rs` `Font::parse` in
[exp7-jrender](https://github.com/MatthewGRodriguez/exp7-jrender)). There is no substitute font: a character a font has no
glyph for fails with `GLYPH_MISSING` ([design-system.md](./design-system.md) section 4).

| Block | Font | Characters | Used by |
|---|---|---|---|
| `jr-font-ss3` | Source Sans 3 Regular | 688 (1.8.87) | Budget: the journal and its views (`font` token) |
| `jr-font-ss3-semibold` | Source Sans 3 Semibold | 688 (1.8.87) | Budget: the journal and its views (`fontStrong` token) |
| `jr-font` | DejaVu Sans | 372 (1.8.87) | the platform look: the stock views, the chrome, the Exp7 demo (`font` token) |
| `jr-font-bold` | DejaVu Sans Bold | 360 (1.8.87) | the platform look (`fontStrong` token) |

**One font for measuring and drawing (1.8.87).** Every text a screen draws names the font it was measured in, and is drawn in
that font. A screen's fonts are its tokens (`font`, `fontStrong`); there is no default font and no font stands in for
another. Before 1.8.87 the views measured their text in DejaVu Sans and drew it in Source Sans 3, so a character only one of
them had drew as a box (the Plan view's ▸).

**Marks are art, not glyphs (1.8.87).** The marks a view text uses (← → ▸ ▾ ✓ ✗ ★ ☆ ⚠ ⟳ ● ○) are not drawn from a font. Each
holds a blank 0.9 em place in the text (U+FFFC, which all four fonts have as an empty glyph) and the `Mark` component's art
is drawn there, in the tone of its text, so each look's pack can swap them ([design-system.md](./design-system.md) 10).

## Source Sans 3 (the journal)

**1.8.64 to 1.8.77:** 120 characters each: ASCII and a few marks (`£ ¥ © ® ° · × ÷`, dashes, quotes, `• … ‰ € −`). No
accented letters, so from 1.8.77, where Home measures every character, a name such as "Café" stops Home with
`GLYPH_MISSING`.

**1.8.78:** the same 120 glyphs, byte for byte, plus 567 more from the same build of the same font:

- Latin-1 Supplement (U+00A0 to U+00FF) and Latin Extended-A (U+0100 to U+017F), every character;
- what the font has of Latin Extended-B (for example `ƒ Ș ș Ț ț`), spacing modifier letters, Latin Extended Additional
  (Vietnamese and others), general punctuation, currency signs and letterlike symbols.

**1.8.87:** the same 687 glyphs plus the blank U+FFFC, the place a mark's art is drawn in (above).

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

## DejaVu Sans (the platform look)

**Before 1.8.87:** 243 characters in Regular and 231 in Bold: ASCII, Latin-1 and the marks the views drew.

**1.8.87:** the same glyphs, byte for byte, plus Latin Extended-A (U+0100 to U+017F, 128 characters, for names such as
"Łucja" or "Đorđe") from the same font, and the blank U+FFFC above. Converted with `tools/jrf_font.py extend` (the letters)
and `tools/jrf_font.py place` (U+FFFC) in exp7-jrender. Text without those characters measures exactly as in 1.8.86.

**Source:** DejaVu Sans 2.37 (`DejaVuSans.ttf`, `DejaVuSans-Bold.ttf`).

**Licence:** the Bitstream Vera licence, with DejaVu's changes in the public domain; it allows bundling and embedding in
software. The licence text travels in the lean HTML, in the `font-licence-dejavu` block just before the font blocks.

