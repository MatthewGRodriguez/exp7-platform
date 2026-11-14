# Exp7 design system

**Status:** proposed spec, 2026-11-14. Nothing here is implemented yet. It applies to Budget first and then to every Exp7 app, the platform chrome and the universal Calendar, Board and Plan views. Matthew answered the first eight questions on 2026-11-14; he answered the two follow-up questions (N1, N2) the same day. Every answer is written into the section it settles and listed in [Decisions](#11-decisions). No questions are open for him.

Evidence labels follow [EVIDENCE.md](./EVIDENCE.md). The three rules in section 1 are Matthew's own words **[REQ 2026-11-14]**.

## Contents

1. [The three rules](#1-the-three-rules)
2. [Why this pivot](#2-why-this-pivot)
3. [Where it sits in the architecture](#3-where-it-sits-in-the-architecture)
4. [Bounds](#4-bounds)
5. [Tokens](#5-tokens)
6. [Components](#6-components)
7. [Art slots](#7-art-slots)
8. [Failing first, as in Verse](#8-failing-first-as-in-verse)
9. [Tests](#9-tests)
10. [Migration](#10-migration)
11. [Decisions](#11-decisions)
12. [Needs Ash](#12-needs-ash)

---

## 1. The three rules

These three rules govern every Exp7 app. Nothing else in this spec may contradict them. If a later section seems to, the rule wins and the section is wrong.

### Rule 1: no fallbacks, fail first

> "no fallback, I'm really quite against fallbacks because I like keeping the software light and tested first. With that said like Epic Games Verse fail first is encouraged." **[REQ 2026-11-14]**

A fallback is anything that quietly stands in for a missing or broken piece so the failure is hidden: a default colour, a default size, a guessed text width, a second font, placeholder art, study sample data shown as if it were the person's own, a default skin, or a `try`/`catch` that carries on drawing. None of these are allowed.

Fail first works the way Verse's `<decides>` does **[REQ 2026-11-14]**: "it'll work or not, no exception based control flow, at the fail point it'll exit to where it would work before that point and carry on. Errors are not allowed in verse to propagate outside the things marked with decides, same thing here." Failing is conditional logic: a failable step either succeeds or fails, a failure undoes everything since the last point where things worked, and the logic written for the fail case runs next. [Section 8](#8-failing-first-as-in-verse) defines it. Failures are found first by the tests in [section 9](#9-tests), so they rarely reach a release.

The difference from a fallback: a fallback pretends the work happened by drawing a substitute. A failure leaves the app exactly as it was before the work began, and the code after it knows the work didn't happen.

Two things are not fallbacks and stay:

- **Designed states.** "Nothing is scheduled this day." on an empty day, a disabled Accept band, an invalid field. Each is a state of a component, with its own text and its own art, designed and tested like any other.
- **Validation of what a person types.** A half-typed amount is an invalid field, not a crash.

### Rule 2: bound driven

> "bounds even though art is changeable that allows sizes to be systematically accounted for we will use that to be structurally sound and the rest of the app aware of the sizes of everything even if not fixed in size; it'll be bound driven." **[REQ 2026-11-14]**

Every piece declares its bounds: the smallest and largest size it can take, and how it sizes itself inside them. Layout resolves those bounds before anything draws, and the resolved sizes are readable by the rest of the app. A piece may grow up to its largest size, such as a row whose name wraps to more lines, but its size is always computed, never guessed, and everything after it knows the new size. Past its largest size, content shrinks to stay inside: "Shrink to stay within bounds… just like how text will shrink to fit, so will art, this is a universal bounds concept" **[REQ 2026-11-14]**. [Section 4](#4-bounds) defines the model.

### Rule 3: art swappable everywhere

> "art be swappable everywhere, it's a universal concept" **[REQ 2026-11-14]**, following "without having parts of it replaceable with art (some svg animation) design is limited".

Every visual part of every component that is not live text is an art slot: backgrounds, frames, rules, marks, chevrons, checkboxes, the star, the page edge, the mini-month tints. Art is SVG, animated or still, and swapping it never moves layout or text, because the slot's bounds come from the component, not from the art; art bigger than its slot shrinks to fit. Art can be swapped for a whole app, for one screen, or for a single item on a screen. [Section 7](#7-art-slots) is the contract.

### Rules this spec keeps as they are

- Views host → JRViews → JRender on one shared Core and GPU context. No second renderer, no replacement app, no mockup. **[REQ]**
- Besides docs, exp7-platform changes touch only `exp7-platform/exp7-platform-lean.html`, `exp7-platform/release.json` and the launchers. No sidecar source or test folders. **[REQ]**
- Budget's approved journal style and layout, with the journal at full phone width. This spec changes how screens are built, not how they look. **[REQ]**
- New artwork goes through the art workflow: references, Matthew's agreement, then drawing, one piece at a time ([botnotes.md](https://github.com/MatthewGRodriguez/exp7-budget-studies/blob/main/botnotes.md), "Art workflow"). This spec defines the slot contract, not any artwork. **[REQ]**
- Studies are drawn in DesignCraft on Matthew's Mac, and keeping them in sync with the app is second priority to the app. **[REQ]**
- No second renderer without WebGPU: the shell's plain error with diagnostics stays, because at first boot there is no earlier working point to return to. **[REQ]** ([views-jrender-standard.md](./views-jrender-standard.md))

---

## 2. Why this pivot

Of the 71 UI pull requests in exp7-platform and exp7-jrender, 48 (68%) fixed or reworked UI that already existed, and they took about 58% of the estimated time. 13 of the last 16 were fixes. Method and data: `exp7-analytics/method.md` and `branch-classification.csv` in the project's shared files. **[MEAS, estimates as described there]**

Grouped by cause, the fixes fall into four kinds:

| Kind | Examples | What in this spec addresses it |
|---|---|---|
| Sizes and overlap | 1.8.11 Apps card sizes, 1.8.35 Board scale, 1.8.45 safe area, 1.8.67 canvas size limit, 1.8.68 no-overlap rows, 1.8.74 long names wrap | Bounds (section 4), bounds tests (section 9) |
| Material drawn in code, pass after pass | 1.8.13 to 1.8.20: contact shadow, penumbra, lip, top light, pressed edge, glass body, ground shadow | Art slots (section 7) |
| Blank screens and boot | 1.8.5 to 1.8.7 blank after switch, 1.8.63 boot error | Failing first with rollback (section 8): a failed switch leaves the last working screen up |
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
| `design-fail` | Failable steps, failure contexts and rollback (section 8) |

`exp7-vm` keeps its role as the view-model builder; its node kinds become components. `journal-views` shrinks to Budget's screen compositions and loses `paintScreen`. Art sources (SVG, DesignCraft files) live outside exp7-platform, with the studies; only compiled packs ship.

There is no byte limit on scripts or art packs **[REQ 2026-11-14]**. Light comes from having one layout path, no fallback code and no duplicate material passes.

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

Measuring and placing are failable steps (section 8). Content that is too big for its node shrinks to stay inside it (text in 4.5, art in 7.4). A node's own box never shrinks below its `min`, so hit targets keep their 44. If a child's `min` is larger than the offered `max`, the bounds can't be satisfied: the step fails with `BOUNDS_UNSAT` naming both pieces, and the layout rolls back. Nothing is clipped or drawn half-fitted.

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

- Text is measured only by JRender: `core.measure` for one line, `core.wrap` for a box, with the real font id. There is no estimate. If the font isn't loaded or a glyph is missing (`jrd_has_glyph`), the step fails with `FONT_MISSING` or `GLYPH_MISSING`.
- Baselines come from `core.metrics` (ascent and descent per font), not from per-size offsets.
- Line height is a token (1.25 × size today).
- A text node declares `lines: { min, max }` and its role's size. There is no smallest size: "everything that can shrink can shrink infinitely" **[REQ 2026-11-14]**.
- **Fitting** is one failable step, `fit(text, box)`, for every text run, including a person's own long text **[REQ 2026-11-14]**:
  1. Wrap at the role's size. If it fits in `lines.max` lines and inside the node's `max` height, done; the node takes that height.
  2. Otherwise shrink: find the largest size at which the text fits, with no lower limit. JRender measures each try.
  3. The step fails only if the box has no width or height to shrink into (`BOX_EMPTY`), and the screen's layout rolls back.
- There is no "…" cut-off. Shrinking keeps all the text.
- The phone floors (body 17, secondary 15, captions 13) apply to role sizes in tokens, not to text shrunk to fit.

### 4.6 Width classes

The page column is computed from the host width, as `journal-views` does today, and becomes a token rule:

| Class | Host width | Column |
|---|---|---|
| phone | ≤ 420 | the full host width (journal at full phone width **[REQ]**) |
| wide | > 420 | `min(520, max(390, host − 48))`, centred |

Wide screens keep the single journal column on every screen **[REQ 2026-11-14]**. Nothing goes two columns, including the plan switch review, whose Before and After always stack.

Device bounds are inputs too: the safe-area insets (1.8.45) and the largest canvas the device allows (1.8.67). A layout that needs more than those fails and rolls back; it never draws a cut-off screen.

---

## 5. Tokens

Tokens are every number and colour a component uses. Component code reads tokens by name and contains no literal colours or sizes (0 and 1 aside); a lint test enforces that.

### 5.1 Complete or nothing

Each app declares one complete token set. At mount it is checked against the schema; a missing or unknown key fails the mount with `TOKEN_MISSING` or `TOKEN_UNKNOWN`, and the app doesn't open. There is no chain that fills gaps from defaults. That replaces today's `Exp7VM` token chain (base, then the component's theme, then the atlas, then the mount), which fills any gap from the layer before. An app may still be built from another set explicitly (`tokens: extend(EXP7_LIGHT, { ... })`), but the result is checked as a whole.

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

Matthew's phone rules (body ≥ 17, secondary ≥ 15, captions 13 only, targets ≥ 44) are written as floors in the schema. A token set that goes below a floor is rejected. Targets never shrink. Shrink-to-fit text may go below its role's size, and below the floors, without limit **[REQ 2026-11-14]**; the floors check token values only.

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
| **BeforeAfter** (Before and After, always stacked) | fill | hug | `before.wash`, `after.wash` | idle |
| **Note** (caption or secondary text that wraps) | fill | hug | none | idle |

Examples of bounds that become checks instead of offsets:

- MiniMonth needs `7 × target = 308` px of width. On a 390 px phone each cell is 55.7 px wide, as in the studies. Offered less than 308, it fails with `BOUNDS_UNSAT`.
- A Row with a long name wraps, its height grows by whole lines up to its `max`, and the rows under it move by exactly that much because they are placed after it. Past its `max`, the name shrinks.
- A Field's live text field is placed from the Field's rect, so it can't drift from the drawn field.

### 6.2 Platform and universal views (phase 4)

| Component | Bounds today, from the release notes |
|---|---|
| **TopBar** (back, avatar) | fill × 44 |
| **AppCard** (Apps picker, two lines) | ≥ 220 × 70 |
| **Avatar** (JRDI image) | fixed, inside the TopBar |
| Calendar **Day**, Board **Row**, **Chip**, **Button**, **Table**, **Popover** | the existing `Exp7VM` node kinds, each given declared bounds and slots |

Account, key and share panels stay DOM, so the personal access token never enters the canvas **[REQ]**. For now they are left untouched and run on their own, outside this design system **[REQ 2026-11-14]**.

### 6.3 Studies map to components

Studies stay second priority **[REQ]**. When a study is drawn or redrawn, its DesignCraft layers are named by component and slot (for example `Row/row.chevron`), and its `metrics.json` hit boxes are compared with the component rects for the same screen and width. A mismatch is reported, not auto-fixed, and doesn't hold up an app pull request.

---

## 7. Art slots

### 7.1 What a slot is

A slot is a named visual part of a component, such as `row.background` or `star.mark`. Its bounds come from the component: either the component's whole rect or a sub-rect the component declares (for example the leading 24 × 24 box of a Row, centred in a `target` square). Layout never reads the art. Art never contains UI text, which stays live, measured text; art never owns a hit.

### 7.2 Art packs

An app's look is its art pack: art for every slot of every component the app uses, in every state that component declares. A pack is complete or loading it fails (`ART_MISSING`, naming slot and state). There is no default art. A swap that fails leaves the art that was there before.

Budget's first pack draws today's journal look (white page, thin rules, chevrons, tints, the mint band) as SVG, so switching to slots changes nothing on screen. That pack is assigned to Budget explicitly; it isn't a default for anything else. Later art replaces pieces of it through the art workflow, one approved piece at a time.

Where art can be swapped: at three explicit levels, the app's pack, then a screen's override, then one component instance's override, because art is "swappable everywhere, it's a universal concept" **[REQ 2026-11-14]**. Every level is written down, and the validator resolves the art for every slot on every screen and fails on any gap.

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
- **Art shrinks to fit, like text** **[REQ 2026-11-14]**. When the slot is smaller than the art's `supports` range (or a `fit` piece's drawn size), the art scales down evenly, centred, until it fits. It never grows past what `supports` allows and never spills out of the slot. There is no smallest scale, so art always fits; the fit fails only if the slot has no width or height (`BOX_EMPTY`).
- `supports` should cover the component's declared bounds. A Row can grow to many lines, so its background should support that height.
- A state can be an explicit alias of another (`"pressed": "=hover"`). That is a written choice, checked like any other, not a fallback.

### 7.5 Animation

- State changes animate between that state's drawings on the state table's timings, through ViewStates. Clicks run first; the click path stays at or under 120 ms.
- A looping animation (like the overlay fish) moves node transforms, opacity and paints inside the slot, using `Patch.xform`. It holds a still pose under reduced motion and pauses on a hidden tab, as the shell does now.
- Every frame stays inside the slot rect. The validator samples frames to check it.
- Art that crosses components is an **overlay**: it declares the region it covers, hits fall through it, and it draws after the slots under it (the view store's existing rule).

### 7.6 What the validator checks

For each piece, at the slot's minimum, maximum and typical sizes, in every state and at sampled animation frames:

- after shrink-to-fit, geometry stays inside the slot rect (`ART_OUTSIDE`)
- every state the component declares is present (`ART_MISSING`)
- text drawn over the art keeps at least 4.5:1 contrast against the art's pixels under it, using the text's token colour (`CONTRAST_LOW`)

It runs when art is compiled, in the test suite, and at pack load in the app.

### 7.7 Replacing material code

Once a component's art is in slots, the procedural light and shadow passes for it in `jrviews-ux-states` are removed in the same change, so the two never stack (the rule already written in [design/overlay-view-store.md](./design/overlay-view-store.md)).

---

## 8. Failing first, as in Verse

Matthew's model is Verse's `<decides>` **[REQ 2026-11-14]**: a step works or it doesn't; there is no exception-based control flow; at the fail point the work returns to where it last worked and carries on; failures never travel outside the places marked as able to fail; and failing is a condition that logic can follow.

### 8.1 Three parts

**Failable steps.** A step that can fail is marked failable, like a `<decides>` function. It either returns its value or fails. These are the failable steps in the design system:

| Step | Fails when | Code |
|---|---|---|
| `token(name)` | the app's token set has no such key | `TOKEN_MISSING` |
| `font(role)`, `glyphs(text)` | the font isn't loaded, or a glyph is missing | `FONT_MISSING`, `GLYPH_MISSING` |
| `fit(text, box)` | the box has no width or height to shrink into (4.5) | `BOX_EMPTY` |
| `measure(node, offered)`, `place(node, rect)` | a `min` is larger than the offered `max`, or a hit is under 44 | `BOUNDS_UNSAT`, `TARGET_TOO_SMALL` |
| `art(slot, state)`, `fitArt(art, rect)` | no art resolved for the slot and state, or the slot has no width or height (7.4) | `ART_MISSING`, `BOX_EMPTY` |
| `field(model, key)` | the view model lacks a value the component needs, such as an item with no name | `DATA_MISSING` |

**Failure contexts.** A failable step can only be used inside a failure context, the way a `<decides>` call can only sit in an `if`, a `for` filter or another `<decides>` function. A failure ends its context and goes no further: code outside the context only sees that the context failed. These are the contexts in Exp7, each with the point it returns to:

| Context | On failure, returns to | Then runs |
|---|---|---|
| A person's action (a tap, a committed field, Back) | the screen, view-local state and atlas exactly as they were before the action | that action's fail logic |
| Opening a screen | the screen they were on | that screen's fail logic |
| Re-laying out a screen after data changes | the last layout and draw list that worked, still on screen | that screen's fail logic |
| Opening an app | the Apps picker, with the app not opened | the shell's fail logic |
| Swapping art (app, screen or item) | the art that was there before | the swap's fail logic |
| Saving a change to the atlas | the atlas as it was; the proposal is not applied | the save's fail logic |

**Rollback.** Everything a context does is held until the whole context succeeds, as Verse rolls back `<transacts>` effects: layout table writes, view-local state, draw-list patches, art changes and atlas proposals. On success they are applied together. On failure they are dropped, so nothing half-done ever shows. Effects that can't be undone (network, sync, the DOM text fields, storage) are not allowed inside a context; they run only after it succeeds, like Verse's `<no_rollback>` effects.

### 8.2 Fail logic is written, never automatic

Every context declares what runs when it fails, the way an `if` has an `else`. A static test fails if a context has no fail logic. Fail logic may record the failure and keep the person where they are. It may not draw a substitute version of what failed (that would be a fallback), and it may not contain failable steps outside a context of its own.

When a person's action fails, they are told nothing: the screen just rolls back to exactly how it was before the tap, with no message **[REQ 2026-11-14]**. The fail logic records the failure, and tests find it from that record.

### 8.3 No exceptions in design code

JavaScript has no built-in failure contexts, so the `design-fail` script provides them with plain return values, not `throw`:

```
const FAIL = Fail.FAIL                         // one frozen value
function fit(text, box) { ...; return ok ? sized : Fail.with('BOX_EMPTY', { ... }) }

Fail.context('open:day-item', (tx) => {        // a failure context with its rollback journal tx
  const name = field(item, 'name');   if (name === FAIL) return FAIL
  const size = fit(name, rowBox);     if (size === FAIL) return FAIL
  tx.stage(layout, patch)                      // applied only if the context succeeds
}, (failure) => { Fail.record(failure) })      // this context's fail logic
```

- Design code contains no `throw` and no `try`/`catch`; a static test checks it. The one `try`/`catch` is in the shell, around code outside the design system that may still throw, and it treats a throw as that context failing.
- Every failable result is checked where it is used; the static test also checks that.

### 8.4 Failure records

Every failure produces one record:

```
Failure {
  code, context,                         // which step, inside which context
  app, screen, component, slot, state,   // whichever apply
  id,                                    // the node's stable id
  offered, needed,                       // sizes, where they apply
  detail
}
```

Records go to an in-memory list that tests read and that a debug view in the exp7-jrender test page shows. Tests treat any record from a fixture as a failed test, so failures are found before a release, not by a person using the app.

### 8.5 Fallbacks already in the code

Each migration phase removes the fallbacks in the code it touches, and the static test lists any left ([section 9](#9-tests)). The 29 mentions in the lean file today are the starting inventory. Not every one is a visual fallback (some are in ranking or sync code), and those are reviewed separately, since rule 1 is project-wide.

---

## 9. Tests

Tests are where failures are found first. A pull request that changes UI states its results by layer, with evidence labels. A red layer means no pull request. The structural tests (layers 1 to 3) carry the weight; Matthew hopes screenshots won't be relied on **[REQ 2026-11-14]**, so they are a short final check.

### 9.1 Layers

| Layer | Runs where | Checks |
|---|---|---|
| **1. Static** | Node, no GPU | Every component registered with bounds, slots, states and fixtures. Every app's tokens complete and above the floors. No literal colours or sizes, no `||` defaults, no `throw` or `try`/`catch` in design code. Every failable result checked; every failure context has fail logic. Art packs complete for every app. Remaining fallbacks listed. |
| **2. Bounds** | Node with the real `jrender.wasm` Core (zero imports, so it runs in Node), for real text measurement | Every screen, from fixtures, at widths 320, 375, 390, 430, 768, 1024 and 1440: zero failure records; no sibling overlap; every child inside its parent; every hit ≥ 44 × 44 and equal to its rect; every text run inside its node; nothing outside the column or the safe area; scroll height equals content height; the same input lays out to the same rects twice. |
| **3. Art and rollback** | Node, tessellating with the real Core | Section 7.6 for every pack. Fault injection: for each context in 8.1, force each of its failable steps to fail and check that the state afterwards equals the state before, byte for byte, and that its fail logic ran. |
| **4. Screenshots** | Chrome with WebGPU on Matthew's Mac, through the exp7-jrender test page; Safari is Matthew's | A few screens at phone 390 × 844 and wide 1280 × 800, with 0 changed pixels against the stored image **[REQ 2026-11-14]**, plus `Exp7Slabs.verify` GPU parity. A changed image needs Matthew's approval before it replaces the stored one. Kept small so the structural layers carry the testing. |
| **5. Flows** | Node and Chrome on Matthew's Mac | The existing 72 unit and 231 integration tests, plus journeys driven by real taps and typing: add an item from a day, change and record, switch an alternative and Accept, reload and check the day, the mini month and Home. These catch wiring bugs, which bounds can't. |

### 9.2 Fixtures

Fixtures are made-up data in files, never Matthew's real data, and they include the cases that broke before: very long item and step names, seven-digit amounts, 24-hour times, a month of 31 days starting on Saturday, a day with no items, a day with twenty, every repeat mode open, every inline picker open.

### 9.3 Where the tests live

In exp7-jrender **[REQ 2026-11-14]**, which is private, already has a test page that loads the real views from an exp7-platform checkout and draws them with the real renderer, and already runs the wasm in Node. The 72 unit and 231 integration tests and the `budget-rules` and `budget-flows` sources move there too, which settles the question open since 2026-11-13. exp7-platform keeps its two-file rule.

---

## 10. Migration

Each phase ships as ordinary release pull requests that Matthew merges. One screen per pull request, so a failure is small. Each pull request names the fallbacks it removed.

**Phase 0: agree.** This spec merged.

**Phase 1: foundations, nothing changes on screen.**
- `design-fail` (failable steps, contexts, rollback, records), `design-tokens` with Budget's journal set and the Exp7 light set, and `design-bounds` from `Exp7VM.layout` with the measure and place passes, shrink-to-fit text and the readable rect table.
- Text through `core.measure`, `core.wrap` and `core.metrics` only. Remove the width estimate and the DejaVu fallback in the journal.
- The test harness in exp7-jrender with layers 1 and 2.
- Budget Home on components: Page, DateHeading, MiniMonth, Legend, Row, LinkRow, inside failure contexts.
- Gate: layers 1 and 2 green, and Home at 390 and wide shows 0 changed pixels against 1.8.76, or every difference is listed and Matthew approves it.

**Phase 2: the rest of Budget off `paintScreen`.** Day schedule, day item, add an item, the four forms (with Field, Choice, Toggle, DatePicker, TimePicker, PrimaryBand, BackBar), plan and alternatives, requirements, the switch review (BeforeAfter), monthly expenses, cash and owned. Every action becomes a failure context with its fail logic. Then delete `paintScreen`, the fixed coordinates, `flowShift`, and the static study screens. Gate per screen as in phase 1, plus layer 3 rollback checks and layer 5 journeys.

**Phase 3: art slots live.** `design-art`, the validator with shrink-to-fit art (layer 3), and Budget's first pack drawn as today's look, so nothing changes on screen. Remove the procedural material for each component as its art arrives. After that, new art for Budget only through the art workflow.

**Phase 4: platform and universal views.** TopBar, Apps picker, and the Calendar, Board and Plan node kinds onto components, tokens and slots. The Exp7 demo follows. The account, key and share panels stay as they are.

**Phase 5: new apps.** A new Exp7 app is its atlas, a complete token set, a complete art pack and screens built from the catalog. Nothing else.

Studies, as second priority: when a screen moves to components, its study (if any) gets component and slot layer names the next time it is drawn.

---

## 11. Decisions

### Decided by Matthew, 2026-11-14

| # | Question | His answer | Where it's written in |
|---|---|---|---|
| Q1 | What happens when something fails | Verse-style failure: works or fails, no exceptions, roll back to where it last worked and carry on, failures stay inside failable contexts, fail logic follows | Rule 1, section 8 |
| Q2 | A person's very long text | Shrink to stay within bounds; art shrinks too, a universal bounds concept | 4.5, 7.4 |
| Q3 | Where art can be swapped | Everywhere: for an app, a screen and a single item | 7.2 |
| Q4 | Where tests live | exp7-jrender | 9.3 |
| Q5 | Screenshot matching | 0 changed pixels, and screenshots shouldn't be relied on | 9.1 |
| Q6 | Wide screens | Single column | 4.6 |
| Q7 | Byte budgets | No size limit | 3 |
| Q8 | Account, key and share panels | Left untouched for now; they run on their own temporarily | 6.2 |
| N1 | Telling the person when their action fails | No: the screen just rolls back, with no message | 8.2 |
| N2 | How far text and art may shrink | "Everything that can shrink can shrink infinitely"; tap targets still never shrink | 4.5, 5.3, 7.4 |

## 12. Needs Ash

Questions for the renderer side, to settle in botnotes.md, not decisions for Matthew:

- Confirm view-store records (JRDL v1) as the compiled art format, and JRB as legacy only.
- The SVG compiler for the view store (`tools/build_store.mjs` in the overlay packet) isn't in any repo. It, or a replacement, is needed in exp7-jrender for the art validator.
- A GPU-side node transform, so looping slot animations don't re-tessellate (the overlay note measured about 1.3 ms per frame for one overlay).
- Whether `core.wrap` can return each line's baseline so text placement uses no arithmetic outside JRender.
