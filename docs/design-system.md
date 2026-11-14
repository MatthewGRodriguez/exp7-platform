# Exp7 design system

**Status:** proposed spec, 2026-11-14. Nothing here is implemented yet. It applies to Budget first and then to every Exp7 app, the platform chrome and the universal Calendar, Board and Plan views. Questions only Matthew can answer are marked **Q1** to **Q8** (Q3 is settled) and collected in [Open questions](#11-open-questions-for-matthew).

Evidence labels follow [EVIDENCE.md](./EVIDENCE.md). The three rules in section 1 are Matthew's own words **[REQ 2026-11-14]**.

## Contents

1. [The three rules](#1-the-three-rules)
2. [Why this pivot](#2-why-this-pivot)
3. [Where it sits in the architecture](#3-where-it-sits-in-the-architecture)
4. [Bounds](#4-bounds)
5. [Tokens](#5-tokens)
6. [Components](#6-components)
7. [Art slots](#7-art-slots)
8. [Failing first](#8-failing-first)
9. [Tests](#9-tests)
10. [Migration](#10-migration)
11. [Open questions for Matthew](#11-open-questions-for-matthew)
12. [Needs Ash](#12-needs-ash)

---

## 1. The three rules

These three rules govern every Exp7 app. Nothing else in this spec may contradict them. If a later section seems to, the rule wins and the section is wrong.

### Rule 1: no fallbacks, fail first

> "no fallback, I'm really quite against fallbacks because I like keeping the software light and tested first. With that said like Epic Games Verse fail first is encouraged." **[REQ 2026-11-14]**

A fallback is anything that quietly stands in for a missing or broken piece so the failure is hidden: a default colour, a default size, a guessed text width, a second font, placeholder art, study sample data shown as if it were the person's own, a default skin, or a `try`/`catch` that carries on drawing. None of these are allowed.

Instead, a missing or broken piece stops with a named error ([section 8](#8-failing-first)) at the earliest stage that can see it: when art is authored, when tests run, when a screen is built, and only last when it draws. The tests in [section 9](#9-tests) are what keep those errors from reaching a release.

Two things are not fallbacks and stay:

- **Designed states.** "Nothing is scheduled this day." on an empty day, a disabled Accept band, an invalid field. Each is a state of a component, with its own text and its own art, designed and tested like any other.
- **Validation of what a person types.** A half-typed amount is an invalid field, not a crash.

### Rule 2: bound driven

> "bounds even though art is changeable that allows sizes to be systematically accounted for we will use that to be structurally sound and the rest of the app aware of the sizes of everything even if not fixed in size; it'll be bound driven." **[REQ 2026-11-14]**

Every piece declares its bounds: the smallest and largest size it can take, and how it sizes itself inside them. Layout resolves those bounds before anything draws, and the resolved sizes are readable by the rest of the app. A piece may grow, such as a row whose name wraps to three lines, but its size is always computed, never guessed, and everything after it knows the new size. [Section 4](#4-bounds) defines the model.

### Rule 3: art swappable everywhere

> "art be swappable everywhere, it's a universal concept" **[REQ 2026-11-14]**, following "without having parts of it replaceable with art (some svg animation) design is limited".

Every visual part of every component that is not live text is an art slot: backgrounds, frames, rules, marks, chevrons, checkboxes, the star, the page edge, the mini-month tints. Art is SVG, animated or still, and swapping it never moves layout or text, because the slot's bounds come from the component, not from the art. [Section 7](#7-art-slots) is the contract.

### Rules this spec keeps as they are

- Views host → JRViews → JRender on one shared Core and GPU context. No second renderer, no replacement app, no mockup. **[REQ]**
- Besides docs, exp7-platform changes touch only `exp7-platform/exp7-platform-lean.html`, `exp7-platform/release.json` and the launchers. No sidecar source or test folders. **[REQ]**
- Budget's approved journal style and layout, with the journal at full phone width. This spec changes how screens are built, not how they look. **[REQ]**
- New artwork goes through the art workflow: references, Matthew's agreement, then drawing, one piece at a time ([botnotes.md](https://github.com/MatthewGRodriguez/exp7-budget-studies/blob/main/botnotes.md), "Art workflow"). This spec defines the slot contract, not any artwork. **[REQ]**
- Studies are drawn in DesignCraft on Matthew's Mac, and keeping them in sync with the app is second priority to the app. **[REQ]**

---

## 2. Why this pivot

Of the 71 UI pull requests in exp7-platform and exp7-jrender, 48 (68%) fixed or reworked UI that already existed, and they took about 58% of the estimated time. 13 of the last 16 were fixes. Method and data: `exp7-analytics/method.md` and `branch-classification.csv` in the project's shared files. **[MEAS, estimates as described there]**

Grouped by cause, the fixes fall into four kinds:

| Kind | Examples | What in this spec addresses it |
|---|---|---|
| Sizes and overlap | 1.8.11 Apps card sizes, 1.8.35 Board scale, 1.8.45 safe area, 1.8.67 canvas size limit, 1.8.68 no-overlap rows, 1.8.74 long names wrap | Bounds (section 4), bounds tests (section 9) |
| Material drawn in code, pass after pass | 1.8.13 to 1.8.20: contact shadow, penumbra, lip, top light, pressed edge, glass body, ground shadow | Art slots (section 7) |
| Blank screens and boot | 1.8.5 to 1.8.7 blank after switch, 1.8.63 boot error | Failing first (section 8) |
| Wiring and state | 1.8.38 selection counter, 1.8.73 Home scroll, 1.8.75 Accept didn't switch | Flow tests (section 9). A design system alone doesn't prevent these. |

What the code does today, read on `main` at `a0c638a` (1.8.76) **[MEAS, code read]**:

- **Budget's journal screens are placed by hand.** `paintScreen` in the `journal-views` script positions each piece at a fixed y with hand-tuned offsets (`by(p,92)`, `-41.52`, baselines at `size*0.34`), and a running `flowShift` pushes later rows down when a line wraps. Every new long string or new row type needs another offset, which is where the overlap fixes come from. The same file also holds static study screens with sample data (the "Tesla" rows at fixed tops).
- **There are two layout systems.** `Exp7VM.layout` (the `exp7-vm` script) is a real flow layout (`col`, `row`, `grid`, `table`) that measures text with JRender. The journal mostly bypasses it.
- **Failures are hidden.** The lean file mentions "fallback" 29 times across its shared scripts. Examples: `Exp7VM` guesses a text width as `length × size × 0.55` when a measure fails; the journal falls back to DejaVu when Source Sans 3 is missing; `skin.reset()` restores a default skin; day pages fell back to study sample data (review finding 4, botnotes 2026-11-13 08:50).
- **Material is code.** Light, shadow and glass are rectangles computed in `jrviews-ux-states`, so each look change is a code change.

What already exists and this spec builds on:

- JRender's text calls run in wasm: `core.measure`, `core.wrap` (greedy wrap with line height, max lines and ellipsis), `core.metrics` (units per em, ascent, descent) and `jrd_has_glyph`.
- The view store (`view-store` script): records with role `slot` or `overlay`, hit policy, states, ViewStates bindings, a motion table and a paint inventory, drawn as JRDL on the shared Core ([design/overlay-view-store.md](./design/overlay-view-store.md)).
- Gradients and strokes in the draw list since 1.8.42 ([jrender-paint-stroke.md](./jrender-paint-stroke.md)).
- The element state table ([design/state-table.json](./design/state-table.json)): idle, hover, focus, pressed, selected, dragging, drop-pending, invalid, settling, disabled, with timings and the 120 ms click path.
- GPU parity check `Exp7Slabs.verify` (0 px / 0 hit differences) and the exp7-jrender test page that draws real Budget views in Chrome.
- The studies' own QA (`qa_check.py` in each study): text out of bounds, text overlaps, type under 13 pt, hits under 44 pt, contrast. The app gets the same checks.

---

## 3. Where it sits in the architecture

```
app atlas (data, per app)
  → views host builds a view model from components      ← components (section 6)
  → layout resolves bounds: measure, then place          ← bounds (section 4), tokens (section 5)
  → each slot gets its art for its resolved rect + state ← art slots (section 7)
  → JRViews → JRender draw list on the shared Core       (unchanged)
```

Everything ships inside the lean HTML as shared scripts, so the two-file rule holds:

| Script (`data-exp7-shared`) | Holds |
|---|---|
| `design-tokens` | Token schema and each app's complete token set |
| `design-bounds` | The bounds protocol and layout (grows out of `Exp7VM.layout`) |
| `design-components` | The component catalog |
| `design-art` | Slot registry, art packs (encoded like the fonts), the art validator's runtime half |

`exp7-vm` keeps its role as the view-model builder; its node kinds become components. `journal-views` shrinks to Budget's screen compositions and loses `paintScreen`. Art sources (SVG, DesignCraft files) live outside exp7-platform, with the studies; only compiled packs ship.

"Light" is measured, not assumed: each script and each art pack has a byte budget recorded in `release.json`, and a test fails when a release exceeds it (**Q7**).

---

## 4. Bounds

### 4.1 Units

Layout is in CSS px, which equal the studies' pt on a 390 pt phone. Device pixel ratio is applied only at draw. Coordinates are rounded to 1/64 px, the draw list's quantum.

### 4.2 What every piece declares

```
bounds: {
  w: { mode: 'fixed' | 'fill' | 'hug', min, max },
  h: { mode: 'fixed' | 'fill' | 'hug', min, max },
}
```

- `fixed`: exactly `min` (= `max`).
- `fill`: takes what the parent offers, within `min` and `max`.
- `hug`: its own content size (its intrinsic size), within `min` and `max`.
- `min` and `max` are tokens or arithmetic on tokens, never literals in component code. `max` may be `Infinity` only on the height of a scrolling page.
- Every hit target has `min ≥ target` (44) on both axes. A component that hits is rejected at registration if it can't meet that.

### 4.3 How layout resolves them

Two passes, the same for every component:

1. **Measure.** A parent offers each child constraints `{ minW, maxW, minH, maxH }`. The child returns one size inside them. Measure is pure: the same model, tokens and constraints always give the same size, so results are cached by key.
2. **Place.** The parent assigns each child a rect inside its own. Children never place themselves.

If a child's `min` is larger than the offered `max`, the bounds can't be satisfied and layout stops with `BOUNDS_UNSAT` naming both pieces. Nothing is clipped or shrunk to make it fit.

### 4.4 Everyone can read the sizes

After layout, every node's resolved rect is in one table keyed by its stable id (the same fnv ids the draw list already uses):

```
layout.rect(id)          → { x, y, w, h } in page coordinates
layout.bounds(id)        → the declared bounds
layout.children(id)      → ids in order
layout.extent(id)        → the rect that encloses the node and everything inside it
layout.measure(model, constraints) → size, without placing (for "what if" checks)
```

This is what "the rest of the app aware of the sizes of everything" means in code. Uses that are hand-tuned today and come from this table instead:

- **Hit boxes** are the node's rect. No separate hit coordinates.
- **Live text fields** (the DOM `TextField` over a drawn field) take the field's rect and follow scroll from it, so they sit exactly over the drawn field.
- **Scroll targets**, such as returning Home to the plan step you came from, scroll to `layout.rect(step)`.
- **Inline expansions** (the date picker, repeat subrows) are children in the flow, so opening one pushes later rows down by measured height.
- **The amount column**: a list measures its widest amount and gives every row's amount the same width, so "one right-aligned amount column" is a rule of the list, not a fixed x.
- **Art** gets the slot's rect and nothing else ([section 7](#7-art-slots)).

### 4.5 Text

- Text is measured only by JRender: `core.measure` for one line, `core.wrap` for a box, with the real font id. There is no estimate. If the font isn't loaded or a glyph is missing (`jrd_has_glyph`), layout stops with `FONT_MISSING` or `GLYPH_MISSING`.
- Baselines come from `core.metrics` (ascent and descent per font), not from per-size offsets.
- Line height is a token (1.25 × size today).
- A text node declares `lines: { min, max }`. Its height is `lines × lineHeight` for the lines it wraps to. Where a component has a fixed height, such as a 48 pt mini-month cell, text that needs more lines than fit is `TEXT_OVERFLOW`.
- How a person's own long text behaves (a 200-character item name) is **Q2**: wrap without limit, or stop at a line limit.

### 4.6 Width classes

The page column is computed from the host width, as `journal-views` does today, and becomes a token rule:

| Class | Host width | Column |
|---|---|---|
| phone | ≤ 420 | the full host width (journal at full phone width **[REQ]**) |
| wide | > 420 | `min(520, max(390, host − 48))`, centred |

Device bounds are inputs too: the safe-area insets (1.8.45) and the largest canvas the device allows (1.8.67). A layout that needs more than those stops; it never draws a cut-off screen.

A component can choose its arrangement from the width it's offered. The plan switch review shows this: Before and After go side by side when the offered width fits two columns at their minimum width plus a gap, and stack otherwise. Whether wide screens should allow that is **Q6**.

---

## 5. Tokens

Tokens are every number and colour a component uses. Component code reads tokens by name and contains no literal colours or sizes (0 and 1 aside); a lint test enforces that.

### 5.1 Complete or nothing

Each app declares one complete token set. At mount it is checked against the schema; a missing or unknown key is `TOKEN_MISSING` or `TOKEN_UNKNOWN`. There is no chain that fills gaps from defaults. That replaces today's `Exp7VM` token chain (base, then the component's theme, then the atlas, then the mount), which fills any gap from the layer before. An app may still be built from another set explicitly (`tokens: extend(EXP7_LIGHT, { ... })`), but the result is checked as a whole.

### 5.2 Schema

| Group | Tokens (Budget journal values, from the approved studies) |
|---|---|
| Colour | `ink #24232B`, `muted #4D4C57`, `caption #5C5B66`, `line #DCDCE3`, `lineSoft #ECECF1`, `divider #E3E3EA`, `page #FFFFFF`, `desk #F3F3F5`, `pageEdge #D6D6DC`, `wash #ECEAF3`, `accent #7D74A8`, `mint #DDF0E6`, `mintInk #1E5640`, `calLow #DDF0E6`, `calModerate #F3EFD8`, `calCritical #F3E6E8` |
| Type | `font` Source Sans 3 Regular, `fontStrong` Source Sans 3 Semibold, `title 22`, `body 17`, `secondary 15`, `caption 13`, `lineHeight 1.25` |
| Space | `inset 20`, `groupGap 28`, `labelGap 20`, `controlGap 18` |
| Size | `target 44`, `row 56`, `link 44`, `cell 48`, `field 44`, `rule 1` |
| Width | `phoneMax 420`, `columnMin 390`, `columnMax 520`, `columnMargin 48` |
| Motion | from the state table: per-state durations and easings, `clickPathMax 120` |
| Contrast | `textContrastMin 4.5`, `captionMin 13` |

These are the values the journal already uses, so moving to tokens changes nothing on screen. Other apps start from the Exp7 light theme (`EXP7_LIGHT_THEME`) values and must fill every key.

### 5.3 Floors are tokens too

Matthew's phone rules (body ≥ 17, secondary ≥ 15, captions 13 only, targets ≥ 44) are written as floors in the schema. A token set that goes below a floor is rejected, so no app can shrink type or targets to fit.

---

## 6. Components

Components are the only way a screen is built. Each one is registered with its bounds, its slots, its states and its test fixtures; registration fails if any is missing. A new component, or a change to one, comes with its tests in the same pull request.

### 6.1 Budget journal set (phase 1 and 2)

| Component | Width | Height | Slots | States |
|---|---|---|---|---|
| **Page** | column (section 4.6) | hug, scrolls | `page.background`, `page.edge` | idle |
| **BackBar** (back chevron and label, optional trailing action such as Save) | fill | fixed `target` | `back.chevron`, `bar.background` | idle, hover, pressed, focus |
| **Heading** (title, optional right text, rule under it) | fill | hug, ≥ `target` | `heading.rule` | idle |
| **DateHeading** (opens the shared picker) | fill | hug, ≥ `target` | `heading.chevron`, `heading.background` | idle, hover, pressed, focus |
| **Section** (group title, then children with `groupGap`) | fill | hug | `section.rule` | idle |
| **Row** (optional leading check, radio or star; label that wraps; optional sub text; trailing tag, amount or chevron) | fill | hug, ≥ `row` | `row.background`, `row.rule`, `row.leading`, `row.chevron` | idle, hover, pressed, selected, disabled, focus |
| **LinkRow** (destination with chevron) | fill | hug, ≥ `link` | `link.background`, `link.chevron` | idle, hover, pressed, focus |
| **AmountList** (rows sharing one measured amount column, subtotals, total) | fill | hug | `list.rule`, `total.rule` | idle |
| **Field** (label above, value, live text field over it) | fill, or `amountField` width | label + `field` | `field.frame` | idle, focus, invalid, disabled |
| **Choice** (radio or check group) | fill | hug | `choice.mark` | idle, selected, disabled, focus |
| **Toggle** (segmented, such as Percent / Fixed) | hug, ≥ 2 × `target` | fixed `target` | `toggle.frame`, `toggle.thumb` | idle, selected, pressed, focus |
| **Star** (preferred mark) | fixed `target` | fixed `target` | `star.mark` | idle, selected, pressed |
| **PrimaryBand** (Accept) | fill | fixed `target` | `band.background` | idle, pressed, disabled, focus |
| **MiniMonth** (7-column grid, tints, shape cues, today and selected marks) | fill, ≥ 7 × `target` | hug: weeks × `cell` | `day.background`, `day.mark`, `day.today`, `day.selected` | idle, hover, pressed, selected, disabled |
| **Legend** (swatch and words) | fill | hug | `legend.swatch` | idle |
| **DatePicker** (inline: month browse, MiniMonth, Today, Dismiss) | fill | hug | `nav.prev`, `nav.next` plus MiniMonth's | idle, hover, pressed |
| **TimePicker** (hour grid of 6, minute grid of 4) | fill, cell ≥ `target` | hug | `time.cell` | idle, selected, pressed |
| **BeforeAfter** (stacked or side by side by offered width) | fill | hug | `before.wash`, `after.wash` | idle |
| **Note** (caption or secondary text that wraps) | fill | hug | none | idle |

Examples of bounds that become checks instead of offsets:

- MiniMonth needs `7 × target = 308` px of width. On a 390 px phone each cell is 55.7 px wide, as in the studies. Offered less than 308, it stops with `BOUNDS_UNSAT`.
- A Row with a long name wraps, its height grows by whole lines, and the rows under it move by exactly that much because they are placed after it.
- A Field's live text field is placed from the Field's rect, so it can't drift from the drawn field.

### 6.2 Platform and universal views (phase 4)

| Component | Bounds today, from the release notes |
|---|---|
| **TopBar** (back, avatar) | fill × 44 |
| **AppCard** (Apps picker, two lines) | ≥ 220 × 70 |
| **Avatar** (JRDI image) | fixed, inside the TopBar |
| Calendar **Day**, Board **Row**, **Chip**, **Button**, **Table**, **Popover** | the existing `Exp7VM` node kinds, each given declared bounds and slots |

Account, key and share panels stay DOM, so the personal access token never enters the canvas **[REQ]**. They take the same tokens; whether they take art slots is **Q8**.

### 6.3 Studies map to components

Studies stay second priority **[REQ]**. When a study is drawn or redrawn, its DesignCraft layers are named by component and slot (for example `Row/row.chevron`), and its `metrics.json` hit boxes are compared with the component rects for the same screen and width. A mismatch is reported, not auto-fixed, and doesn't hold up an app pull request.

---

## 7. Art slots

### 7.1 What a slot is

A slot is a named visual part of a component, such as `row.background` or `star.mark`. Its bounds come from the component: either the component's whole rect or a sub-rect the component declares (for example the leading 24 × 24 box of a Row, centred in a `target` square). Layout never reads the art. Art never contains UI text, which stays live, measured text; art never owns a hit.

### 7.2 Art packs

An app's look is its art pack: art for every slot of every component the app uses, in every state that component declares. A pack is complete or it doesn't load (`ART_MISSING`, naming slot and state). There is no default art.

Budget's first pack draws today's journal look (white page, thin rules, chevrons, tints, the mint band) as SVG, so switching to slots changes nothing on screen. That pack is assigned to Budget explicitly; it isn't a default for anything else. Later art replaces pieces of it through the art workflow, one approved piece at a time.

Where art can be swapped (**Q3, settled**): at three explicit levels, the app's pack, then a screen's override, then one component instance's override, because art is "swappable everywhere, it's a universal concept" **[REQ 2026-11-14]**. Every level is written down, and the validator resolves the art for every slot on every screen and fails on any gap.

### 7.3 Format

Authored as SVG within the subset the existing tools already handle:

- `svg` with `viewBox`, `g`, `defs`, `use`, `transform`
- `path` with `M L H V C Q Z` (absolute and relative)
- solid fills, linear and radial gradients with stop opacity
- strokes with width, join, cap and dash (shipped in 1.8.42)
- no raster images, no `text`, no filters or blur (the wasm has no blur op), no masks, no external references

Each piece compiles to a view-store record (`exp7-view-record/1`, JRDL v1), the format the shell already loads. An SVG outside the subset fails at compile time with the element and line.

### 7.4 The slot manifest

Every art piece carries:

```
{
  "slot": "row.background",
  "component": "Row",
  "pack": "budget-journal",
  "version": 1,
  "viewBox": [0, 0, 390, 56],
  "fit": "nine",            // stretch | nine | fit | tile
  "insets": [4, 4, 4, 4],   // nine only: corners that keep their size
  "supports": { "w": [44, 520], "h": [44, 400] },
  "states": { "idle": "…", "hover": "…", "pressed": "…", "selected": "…", "disabled": "…", "focus": "…" },
  "motion": { "loop": null, "transitions": "state-table" },
  "references": ["…"]       // the approved references for this piece
}
```

- `fit` says how art follows a size it wasn't drawn at: `stretch` scales each axis, `nine` keeps the corners and stretches the edges and middle, `fit` scales evenly and centres (and declares the aspect range it accepts), `tile` repeats.
- `supports` must cover the component's declared bounds. A Row can grow to many lines, so its background must support that height, or the pack fails.
- A state can be an explicit alias of another (`"pressed": "=hover"`). That is a written choice, checked like any other, not a fallback.

### 7.5 Animation

- State changes animate between that state's drawings on the state table's timings, through ViewStates. Clicks run first; the click path stays at or under 120 ms.
- A looping animation (like the overlay fish) moves node transforms, opacity and paints inside the slot, using `Patch.xform`. It holds a still pose under reduced motion and pauses on a hidden tab, as the shell does now.
- Every frame stays inside the slot rect. The validator samples frames to check it.
- Art that crosses components is an **overlay**: it declares the region it covers, hits fall through it, and it draws after the slots under it (the view store's existing rule).

### 7.6 What the validator checks

For each piece, at the slot's minimum, maximum and typical sizes, in every state and at sampled animation frames:

- geometry stays inside the slot rect (`ART_OVERFLOW`)
- every state the component declares is present (`ART_MISSING`)
- text drawn over the art keeps at least 4.5:1 contrast against the art's pixels under it, using the text's token colour (`CONTRAST_LOW`)
- strokes stay at or above one device pixel at the smallest size
- the compiled record stays inside the pack's byte budget

It runs when art is compiled, in the test suite, and at pack load in the app.

### 7.7 Replacing material code

Once a component's art is in slots, the procedural light and shadow passes for it in `jrviews-ux-states` are removed in the same change, so the two never stack (the rule already written in [design/overlay-view-store.md](./design/overlay-view-store.md)).

---

## 8. Failing first

### 8.1 The error

Every failure is one shape:

```
DesignError {
  code,        // BOUNDS_UNSAT, TEXT_OVERFLOW, TARGET_TOO_SMALL, TOKEN_MISSING, TOKEN_UNKNOWN,
               // ART_MISSING, ART_OVERFLOW, ART_FORMAT, CONTRAST_LOW, FONT_MISSING,
               // GLYPH_MISSING, DATA_MISSING, BUDGET_EXCEEDED
  app, screen, component, slot, state,   // whichever apply
  id,          // the node's stable id
  offered, needed,                        // sizes, where they apply
  detail
}
```

`DATA_MISSING` covers a view model without a field the component needs, such as an item with no name. The screen stops; it never shows study data in its place (review finding 4).

### 8.2 When each is caught

| Stage | Catches | Who sees it |
|---|---|---|
| Art compile | ART_FORMAT, ART_OVERFLOW, ART_MISSING, CONTRAST_LOW | the artist or bot authoring it |
| Test suite | everything, on fixtures at every width | the bot, before a pull request |
| Mount | TOKEN_*, ART_MISSING, FONT_MISSING | anyone loading that build |
| Layout | BOUNDS_UNSAT, TEXT_OVERFLOW, TARGET_TOO_SMALL, GLYPH_MISSING, DATA_MISSING | anyone on that screen |

The aim is that only real data the fixtures didn't anticipate can reach the layout stage in a release.

### 8.3 What a person sees

There is one `try`/`catch`, at the shell boundary. The screen does not draw. The shell shows its existing plain error (the `.jrerr` pattern) with the code and the component path, plus Back. Whether that is right, and whether a failure stops the screen or the whole app, is **Q1**.

### 8.4 Fallbacks already in the code

Each migration phase removes the fallbacks in the code it touches, and the static test lists any left ([section 9](#9-tests)). The 29 mentions in the lean file today are the starting inventory. Not every one is a visual fallback (some are in ranking or sync code), and those are reviewed separately, since rule 1 is project-wide.

---

## 9. Tests

Tests replace fallbacks. A pull request that changes UI states its results by layer, with evidence labels. A red layer means no pull request.

### 9.1 Layers

| Layer | Runs where | Checks |
|---|---|---|
| **1. Static** | Node, no GPU | Every component registered with bounds, slots, states and fixtures. Every app's tokens complete and above the floors. No literal colours or sizes and no `||` defaults in component code. Art packs complete for every app. Byte budgets. Remaining fallbacks listed. |
| **2. Bounds** | Node with the real `jrender.wasm` Core (zero imports, so it runs in Node), for real text measurement | Every screen, from fixtures, at widths 320, 375, 390, 430, 768, 1024 and 1440: no sibling overlap; every child inside its parent; every hit ≥ 44 × 44 and equal to its rect; every text run inside its node; nothing outside the column or the safe area; scroll height equals content height; the same input lays out to the same rects twice. |
| **3. Art** | Node, tessellating with the real Core | Section 7.6, for every pack. |
| **4. Screenshots** | Chrome with WebGPU on Matthew's Mac, through the exp7-jrender test page; Safari is Matthew's | Each screen at phone 390 × 844 and wide 1280 × 800 against a stored image, plus `Exp7Slabs.verify` GPU parity. A changed image needs Matthew's approval before it replaces the stored one (**Q5** covers tolerance). |
| **5. Flows** | Node and Chrome on Matthew's Mac | The existing 72 unit and 231 integration tests, plus journeys driven by real taps and typing: add an item from a day, change and record, switch an alternative and Accept, reload and check the day, the mini month and Home. These catch wiring bugs, which bounds can't. |

### 9.2 Fixtures

Fixtures are made-up data in files, never Matthew's real data, and they include the cases that broke before: very long item and step names, seven-digit amounts, 24-hour times, a month of 31 days starting on Saturday, a day with no items, a day with twenty, every repeat mode open, every inline picker open.

### 9.3 Where the tests live

They can't live in exp7-platform (no sidecar folders). Where they go is **Q4**, the question already open since 2026-11-13. The proposal is exp7-jrender: it is private, its test page already loads the real views from an exp7-platform checkout and draws them with the real renderer, and its tools already run the wasm in Node.

---

## 10. Migration

Each phase ships as ordinary release pull requests that Matthew merges. One screen per pull request, so a failure is small. Each pull request names the fallbacks it removed.

**Phase 0: agree.** This spec merged, and answers to the open questions.

**Phase 1: foundations, nothing changes on screen.**
- `design-tokens` with Budget's journal set and the Exp7 light set; `design-bounds` from `Exp7VM.layout` with the measure and place passes and the readable rect table; `DesignError` and the shell's error page.
- Text through `core.measure`, `core.wrap` and `core.metrics` only. Remove the width estimate and the DejaVu fallback in the journal.
- Test layers 1 and 2 running where Q4 decides.
- Budget Home on components: Page, DateHeading, MiniMonth, Legend, Row, LinkRow.
- Gate: Home screenshots at 390 and wide match 1.8.76, or every difference is listed and Matthew approves it.

**Phase 2: the rest of Budget off `paintScreen`.** Day schedule, day item, add an item, the four forms (with Field, Choice, Toggle, DatePicker, TimePicker, PrimaryBand, BackBar), plan and alternatives, requirements, the switch review (BeforeAfter), monthly expenses, cash and owned. Then delete `paintScreen`, the fixed coordinates, `flowShift`, and the static study screens. Gate per screen as in phase 1, plus layer 5 journeys.

**Phase 3: art slots live.** `design-art`, the validator (layer 3), and Budget's first pack drawn as today's look, so nothing changes on screen. Remove the procedural material for each component as its art arrives. After that, new art for Budget only through the art workflow.

**Phase 4: platform and universal views.** TopBar, Apps picker, and the Calendar, Board and Plan node kinds onto components, tokens and slots. The Exp7 demo follows.

**Phase 5: new apps.** A new Exp7 app is its atlas, a complete token set, a complete art pack and screens built from the catalog. Nothing else.

Studies, as second priority: when a screen moves to components, its study (if any) gets component and slot layer names the next time it is drawn.

---

## 11. Open questions for Matthew

- **Q1. When something fails at runtime, what does a person see?** Proposal: that screen doesn't draw, and the shell shows its plain error with the code and Back; the rest of the app keeps working. The alternative is stopping the whole app.
- **Q2. A person's own very long text** (say a 200-character item name): wrap without a limit so the page grows, or set a line limit and treat going over it as a failure? Cutting it off with "…" would be a fallback, so it isn't offered.
- **Q3. Where art can be swapped.** Settled by Matthew's rule "art be swappable everywhere, it's a universal concept": for each app, for a screen, and for a single item on a screen (section 7.2).
- **Q4. Where the tests live:** exp7-jrender (proposed), exp7-budget-studies, or a new private repo?
- **Q5. Screenshot matching:** exactly 0 changed pixels, or a small tolerance for anti-aliasing between machines?
- **Q6. Wide screens:** keep the single 390 to 520 px journal column on every screen, or let some screens (the switch review) go two columns when there's room?
- **Q7. Byte budgets:** should each script and art pack have a size limit that fails the release, and do you have numbers in mind?
- **Q8. Account, key and share panels** stay DOM for safety. Should they take only the tokens, or art slots too?

## 12. Needs Ash

Questions for the renderer side, to settle in botnotes.md, not decisions for Matthew:

- Confirm view-store records (JRDL v1) as the compiled art format, and JRB as legacy only.
- The SVG compiler for the view store (`tools/build_store.mjs` in the overlay packet) isn't in any repo. It, or a replacement, is needed in exp7-jrender for the art validator.
- A GPU-side node transform, so looping slot animations don't re-tessellate (the overlay note measured about 1.3 ms per frame for one overlay).
- Whether `core.wrap` can return each line's baseline so text placement uses no arithmetic outside JRender.
