# Exp7 design system

**Status:** spec, 2026-11-14. Phase 1 is built in 1.8.77, phase 2 in 1.8.79, phase 3 in 1.8.80, the views half of phase 4 in 1.8.81, the TopBar and Apps picker in 1.8.82 and the journal's plan, ledger and cash views and Home's focus ring in 1.8.83, the Exp7 demo's frame, Atlas, Proposal console and About on canvas in 1.8.84, its Two writers, Storage and Circuit in 1.8.85, and its Paths, Calendar, Board and Plan tabs in 1.8.86, so the whole demo is on canvas, and in 1.8.87 every text is drawn in the font it is measured in and the views' marks are art; phase 5 started in 1.8.88 with Budget as the first app defined as its four parts and checked whole when it opens, in 1.8.89 the field being typed in is drawn on the canvas from Budget's tokens and art, in 1.8.90 every art state a node can be in is drawn from its art, pressed included, in 1.8.91 the Calendar, Board and Plan views are drawn pressed the same way, in 1.8.92 Budget's own code stops swallowing errors, in 1.8.93 budget-rules leaves out what a record is missing, and in 1.8.94 every part of an app fails alone when it opens and draws, its art and atlas included, by strict fail and carry on, in 1.8.95 budget-flows stops inventing values for what is missing, in 1.8.98 it has no `||` defaults left, in 1.8.99 journal-views makes up no values either, and in 1.8.100 neither does Budget's part of views-host (see [Migration](#10-migration)). It applies to Budget first and then to every Exp7 app, the platform chrome and the universal Calendar, Board and Plan views. Matthew answered the first eight questions on 2026-11-14; he answered the two follow-up questions (N1, N2) the same day. Every answer is written into the section it settles and listed in [Decisions](#11-decisions). No questions are open for him.

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

#### Strict fail and carry on

Matthew named the rule **strict fail and carry on** (2026-11-16) and asked that it be written down for every bot and every app. In his words:

> "Verse like decides is where the fail condition is managed inside the fail or not managed at all and just carried on. That's the no fall back preference I have stated, if there is a fail point that fail point will fail, the rest will carry on as if that fail point never existed." **[REQ 2026-11-16]**
>
> "Strict fail and carry on, if a pice of art is missing or the atlas, it'll carry on with the rest of the art / atlas and still work." **[REQ 2026-11-16]**

What it means:

- **Strict fail.** Every fail point fails on its own terms. Nothing stands in for what is missing or wrong: no default value, no placeholder, no substitute piece, no step that repairs or upgrades it, and no error that stops everything around it.
- **Carry on.** Everything outside that fail point carries on as if the fail point never existed. The failure stays inside its own failure context, is recorded there, and goes no further.
- **Each part is its own fail point.** A saved record missing a field keeps it missing, and the part that needs it is left out, with no error (1.8.93). A token set, route, alias, layout, screen component, piece of art or part of the atlas that is missing or bad fails alone: the app still opens and works with the rest, and only what reads that part fails, by itself (1.8.94).
- **The fail logic is local.** A fail point either handles its own failure in its context (as a switch that cannot save says so) or does not handle it at all and is simply left out. It never reaches up and stops the parts beside it.

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
| Colour | `ink #24232B`, `muted #4D4C57`, `caption #5C5B66`, `line #DCDCE3`, `lineSoft #ECECF1`, `divider #E3E3EA`, `page #FFFFFF`, `desk #F3F3F5`, `pageEdge #D6D6DC`, `wash #ECEAF3`, `accent #7D74A8`, `mint #DDF0E6`, `mintInk #1E5640`, `calLow #DDF0E6`, `calModerate #F3EFD8`, `calCritical #F3E6E8`, `selection #D8D5E5` (the wash behind selected text in the field being typed in, the accent at 30% on the page; 1.8.89) |
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
| **Mark** (1.8.87: ← → ▸ ▾ ✓ ✗ ★ ☆ ⚠ ⟳ ● ○ in a view's text) | one 0.9 em square per mark, in the text's line; slot `mark.glyph`, variant `<mark>-<tone>` |

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

*As built in 1.8.80:* pieces compile to JRViews items (`rect`, `rrect`, `border`, `path`, `stroke`) in the piece's own coordinates, with colours as `#rrggbb` or a colour token, and a pack is one `exp7-art-pack/1` JSON block embedded in the lean (`art-budget-journal`). The view-store compiler is in no repository (section 12), and items draw byte for byte what the components drew, which is the phase 3 gate. The compiler (`tools/art/compile.mjs` in exp7-jrender) takes `svg`, `g` (with `transform`), `rect`, `circle` and `path` (`M L H V Q C Z` and their relative forms; arcs fail), solid fills and strokes with width, join, cap, miter limit and dash. The validator bounds a curve by its control points, so a curve whose control point leaves the box fails ART_OUTSIDE even where the drawn curve would fit. Gradients, `defs` and `use` and the `tile` fit are not built yet: nothing in Budget's first pack needs them, and each fails at compile time until it is. Colour tokens keep the light set (`EXP7_LIGHT`) working with the same art.

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

*As built in 1.8.80:* a piece has `variants`, each with every state (`"variants": { "right": { "idle": [...], "hover": "=idle" } }`), because one slot can draw different things picked from data: a chevron's direction, a day cell's tint (L, M, C), a mark's kind and whether it is on. A component declares its slots as `{ slot: [variants] }` and a pack must cover every variant in every state. A `fit` piece's `viewBox` is centred on 0,0 and it is drawn about an anchor the component gives (the centre of a `glyphBox` or `markBox` square), so a glyph shrinks about its own centre.

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

*As built in 1.8.80:* a malformed piece (an unknown item kind, a colour that is neither `#rrggbb` nor a colour token, an alias to a state the piece doesn't draw) fails with `ART_INVALID`. Stroke extents count half the width, square caps and miter tips. The contrast check runs as each component is placed: each text against the topmost art fill under its centre in the same node, in every state, not against rendered pixels. Every ink over every fill in Budget's pack passes (the lowest is 5.5:1, `captionInk` over `calCritical`). There is no animation yet, so no frames are sampled. Only idle and hover are drawn live today: hover is the piece's hover drawing, swapped in by JRViews and Home; `pressed` is written as an alias of hover and `focus`, `selected` and `disabled` as aliases of idle until something draws them.

*As built in 1.8.90:* every state is drawn live from the art. Each placed node with art rests in a state (`idle`, or `selected` for a picked choice, toggle, day or time, `disabled` for an Accept band that can't be pressed), and a rest the component does not declare fails with `COMPONENT_INVALID`. Every live state that draws differently from the rest (`hover`, `pressed`, `focus`) is drawn ahead, and Home swaps it in: pressed while held, hover under the pointer, focus on the focused node, the rest otherwise. Budget's pack still writes `pressed` as an alias of hover and `focus`, `selected` and `disabled` as aliases of idle, so a press now shows the hover drawing (a touch gets feedback it had none of), and a pack that draws its own pressed or focus is drawn with no code change. *As built in 1.8.91:* the Calendar, Board and Plan views too: every view component declares `pressed`, both view packs write it (as hover, where a piece draws a hover; as idle otherwise), and JRViews draws a view node in the state it is in from its looks, as Home does.

### 7.7 Replacing material code

Once a component's art is in slots, the procedural light and shadow passes for it in `jrviews-ux-states` are removed in the same change, so the two never stack (the rule already written in [design/overlay-view-store.md](./design/overlay-view-store.md)).

*As built in 1.8.80:* `jrviews-ux-states` only decorates nodes that come from an element (`n.el`), which no design component makes, so it never drew on Budget's components. The procedural material that phase 3 removes is the drawing code in `design-components` itself (section 10).

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
| `check(piece)`, `load(pack)`, `assign(app, pack)`, `override(...)` | a piece is malformed, draws outside its slot, or a pack misses a slot, variant or state (7.6) | `ART_INVALID`, `ART_OUTSIDE`, `ART_MISSING` |
| `contrast(texts)` | text over art under `textContrastMin` (7.6) | `CONTRAST_LOW` |
| `field(model, key)` | the view model lacks a value the component needs, such as an item with no name | `DATA_MISSING` |
| `open(app)`, `get(app)`, `route(app, name)`, the app's `atlas.check(atlas)` | an app's definition misses a part or has one it shouldn't, a screen draws a component its pack doesn't cover, a route is named twice, the app hasn't opened, a route isn't the app's, or an atlas lacks a part the app's screens read (phase 5) | `APP_INVALID` (and the code of the part's own check: `TOKEN_*`, `ART_*`, `COMPONENT_INVALID`) |

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

*Phase 1 as built (1.8.77).* Two small changes to this spec came out of building it:
- The colour token `caption` is named `captionInk`, because `caption` is also the caption type size in section 5.2 and one set can't hold both.
- `lineHeight` is one value per type role (`title 28`, `body 21`, `secondary 19`, `caption 16`): 1.25 times the size, rounded to whole pixels, as the journal draws it today. Text that shrinks scales its line height with it.

Fallbacks removed: the text width estimate (length x size x 0.55) in `JRViews` and in `Exp7VM.layout`, the DejaVu substitute for the journal's Source Sans 3, the ellipsis on Home's entry rows (a long name now wraps), and the `||` defaults in Home's layout. Fixed in passing: a bold run used to sit 0.1 x its size below a regular run on the same baseline; both now sit on the baseline from `core.metrics`. The parity check in exp7-jrender (`tests/parity.mjs`) lists every text that moved against 1.8.76; nothing else moved.

*1.8.78.* The journal's Source Sans 3 had 120 characters and no accented letters, so a name such as "Café" failed Home with `GLYPH_MISSING`, as it should with no substitute font. 1.8.78 embeds a fuller build of the same font (every Latin-1 and Latin Extended-A letter, 687 characters per face; [fonts.md](./fonts.md)); the old glyphs and the metrics are unchanged, so nothing else moves. Test: `tests/glyphs.mjs` in exp7-jrender, and the `accents` fixture in layer 2.

**Phase 2: the rest of Budget off `paintScreen`.** Day schedule, day item, add an item, the four forms (with Field, Choice, Toggle, DatePicker, TimePicker, PrimaryBand, BackBar), plan and alternatives, requirements, the switch review (BeforeAfter), monthly expenses, cash and owned. Every action becomes a failure context with its fail logic. Then delete `paintScreen`, the fixed coordinates, `flowShift`, and the static study screens. Gate per screen as in phase 1, plus layer 3 rollback checks and layer 5 journeys.

*Phase 2 as built (1.8.79).* Every Budget route besides Home is built by `screenModel(route, ctx)` as a list of component parts and laid out by `screenLayout` inside the `budget.screen.layout` failure context, the way `homeLayout` lays out Home. New components: BackBar, Title, Section, Divider, Field, Choice (radio, check box, preferred star or none), Every, Toggle, Pair, PrimaryBand, TimePicker, FieldDatePicker (the form's date picker; DatePicker stays Home's), HourRow, AmountRow, MonthHeading and BeforeAfter. A form starts from `FORM_START`: its draft holds every field the form shows, written once, so nothing is filled in while it is drawn. Every action runs in a failure context (`Home.act` and `Home.show` through `transact`): if the screen it leads to cannot be laid out, the route, the open field, the screen state and the plan session go back to what they were, the last screen stays painted and the failure is recorded, with no message.

One change from this spec: all of phase 2 is one pull request per repo, not one per screen, because the screens share the components, `screenLayout` and the rollback, and `paintScreen` could only be deleted once no screen used it. Each screen is gated on its own in the tests.

Fallbacks removed: `paintScreen` and its fixed coordinates; `flowShift`, which pushed everything below a wrapped line down by a guessed amount; the form picker height estimates (`formPickerHeight`, `formTimePickerHeight`), now measured; the static study screens and the per-route sample layouts (`routeModel`, `liveFormScreen`), so a route with no screen fails with `DATA_MISSING` instead of showing a sample; the time picker's `07:00` when no time is set (now no hour is selected, and a minute alone sets nothing); "New item" and other values filled into a form while it is drawn; the first plan step standing in when a step is not found (Alternatives from a day item with none now shows that item); and the `||` defaults in the screen code. The rollback tests found two taps the new screens could not follow (Next on "Name the category" with the name empty, and "New alternative" from Requirements); both open the form now, with an empty category.

Tests in exp7-jrender: layer 2 for 31 screen states on three fixtures at seven widths (`layer2-screens.mjs`), layer 3 makes each of 345 taps on Home and every screen twice, once with the layout forced to fail, and checks that nothing changed (`layer3-rollback.mjs`), and layer 5 walks twelve journeys tap by tap at 390 and 1024 (`layer5-journeys.mjs`). Taps that save, open a text editor or open the month popup are counted and skipped in layer 3. The fixed coordinates in the views-host `layout()` for the Calendar, Board and Plan kinds stay until phase 4.

**Phase 3: art slots live.** `design-art`, the validator with shrink-to-fit art (layer 3), and Budget's first pack drawn as today's look, so nothing changes on screen. Remove the procedural material for each component as its art arrives. After that, new art for Budget only through the art workflow.

*Phase 3 as built (1.8.80).* New shared script `design-art` (`Exp7Art`): pack loading and the validator, `assign(app, pack)` for the app level, `override(app, screen, nodeKey, piece)` for a screen or one instance, and `art()` resolving instance, then screen, then app. Budget's first pack, `budget-journal`, is 43 pieces drawn in SVG with the studies (exp7-budget-studies `art/budget-journal/`), compiled by `tools/art/compile.mjs` in exp7-jrender and embedded in the lean as the `art-budget-journal` block. It is assigned to Budget once when journal-views loads, in its own failure context; every Budget layout starts by checking it is there (`ART_MISSING` if not). Every component now places art in its slots instead of drawing: page and paper edge, chevrons, rules, day cells with their tints, today and selected outlines, the L, M and C marks, legend swatches, field boxes, radio, check box and star marks, toggle segments, the mint band, time cells, the selected hour's bar and the switch review's tint. Hover comes from each piece's hover drawing (`n.hovItems`) instead of a recolour of item 0 (`n.base`, `n.hov`).

Changes from this spec: the compiled format (7.3), variants and anchored fit pieces (7.4), only idle and hover live (7.6). Two components changed their props: Legend items are `[level, text]` (the art draws the swatch), and Divider names the tokens for its gap and height, so Home's line between All day and timed items is now a Divider instead of a rect drawn in `homeLayout`. New tokens `glyphBox` (12) and `markBox` (24); 19 tokens only the drawing code used are removed (`chevronStroke`, the `mark*`, `check*`, `star*`, `selected*` and `select*` sizes, `pageRadius`, `fieldRadius`): those sizes live in the art now.

Fallbacks removed: the glyph and mark drawing code (`glyphs()`, `marks()`), the tint table that drew an unknown risk level as plain paper, and the hover colours set in code. Nothing changes on screen: the gate is draw-list bytes, view by view, for Home in six states at seven widths on two fixtures and every other screen at 320, 390 and 1024, against 1.8.79, and every node's hover against 1.8.79's recolour (`tests/layer-art.mjs` in exp7-jrender). One difference that draws nothing: a selected time cell or hour row (already wash) had a wash hover in 1.8.79; its art has no hover drawing, so hovering it no longer patches the node.

**Phase 4: platform and universal views.** TopBar, Apps picker, and the Calendar, Board and Plan node kinds onto components, tokens and slots. The Exp7 demo follows. The account, key and share panels stay as they are.

*Phase 4 as built, part 1: the views (1.8.81).* New shared script `design-views` registers the components the universal Calendar, Board and Plan views draw: `Panel` (the view, a popover, a cell, a section, a row, a detail), `Button`, `Chip`, `InputBox` (a text field's resting box), `DayCell`, `DayStep` and `TableRow`, and for Budget's look `DateChevron` and `FocusRing`. Each has its slots and variants (a button is `ctl` or `round`, plain or primary, on, invalid, disabled), the idle and hover states, bounds (it fills the width it is given at the height the view's layout gives it) and fixtures. `Exp7VM` keeps its own layout engine, so text wraps and shrinks as before, but it no longer draws any visual in code: every face, shadow, highlight, tint, day outline, step box and row rule is art placed through `Exp7Art.draw` from the app's pack, and hover comes from the art (`Exp7VM.hovers`). The stock skin (`SKIN`, its colour mixing) and the journal skin that journal-views laid over it are gone.

Two packs: `exp7-views` (10 pieces, app `exp7`, the platform look) and twelve view pieces added to `budget-journal` (Budget's look), drawn in SVG in exp7-budget-studies `art/`. They were written once from 1.8.80's drawing formulas by exp7-jrender `tools/art/gen-views.mjs`, and are edited as SVG from now on; `tools/art/compile.mjs` now also takes `#rrggbbaa` for the shadows and highlights. `Exp7Art.assign(app, pack, components)` now names the components an app draws, so each pack is checked against its own list (`Exp7Components.budget` for Budget's screens, `Exp7ViewComponents` for the views), and `Exp7Art.components(app)` reads it back. A node hovers when a slot's variant has a hover drawing of its own; `"=idle"` means no hover. Budget's selected time cell is now `"=idle"`, as the phase 3 note above says it was meant to be.

Tokens: the views take a view token set, `Exp7Tokens.views(name, over)`: `VIEW_BASE` for the platform look, `VIEW_JOURNAL` for Budget's, checked whole and frozen. Every colour a view builder names is a token name (`linkInk`, `dangerInk`, `riskTextC`...), and a name that is not a token fails with `TOKEN_UNKNOWN`. A component theme (`{ bg, fg, accent }`) must name all three or fails with `TOKEN_MISSING`. An atlas's `meta.viewTokens` and the mount option `tokens` no longer style views (5.1: one token set per look).

Fail first: `Exp7VM.layout` runs in the `views.layout:<app>` failure context and returns `FAIL` when anything in it fails: a missing token or piece, text the font cannot measure (was a thrown error), or Budget's chevron and focus ring (`views.journal:budget`). `JRViews` then keeps the last frame, and the views host records the failure and shows no error page (the "JRender view not drawn" box and the hidden canvas are gone). A tap whose redraw fails is not rolled back yet: the atlas keeps the change and the view keeps its last frame.

Fallbacks removed: the stock and journal skins, the default view tokens and their merge (`BASE`, `tokens()`, `fromTheme`), the field style default (`FIELD`, and the literal colours the views host used when a layout had no tokens), the error page, the thrown measure error, and Home's date overlay branch, which nothing opened since phase 2.

Nothing changes on screen. The gate (`tests/layer4-views.mjs` in exp7-jrender): every view state in `fixtures/views.mjs` (129 states: every view of the fixture atlas in Budget's look and the stock look, each tap the view offers, then the taps a form or selection offers) on the ordinary, stress and accents fixtures at 320, 390 and 1024, 1,341 layouts, has the same height, draw-list bytes, hover bytes, node fields and entrance list as 1.8.80, and Budget's keyboard focus ring draws the same on every tap target. Kept as they are, for Matthew to decide: the views' 13 px text and 30 px buttons, which are under the phone floors (body 17, target 44), and day text that stops shrinking at 3 px.

Renderer: 1.8.81 also carries the JRender build from exp7-jrender #8 (Matthew's call, 2026-11-15): group transforms on the GPU (`setGroupTransform`, `retessGroup`, `groupScale`) and `wrap()` lines with `top` and `baseline` matching `richLayout()`. The wasm is 292,569 bytes, sha256 `daace57d...`; the lean's renderer blocks equal exp7-jrender `src/` (packed with `tools/pack.py`). Nothing in Exp7 sets a group transform or reads the new baselines yet, so nothing changes on screen: exp7-jrender `tests/xform.mjs` checks that, with no transform set, the new wasm gives the 1.8.73 wasm's exact vertex, uniform and hit bytes for every Budget view. Rotating and scaling art (spec 7.4, looping moves only for now) and baseline-aligned text can now be built on it.

Not in part 1: the TopBar and the Apps picker (still drawn through the JRViews HTML path; their 1.8.80 capture is in exp7-jrender `tests/fixtures/chrome-1.8.80.json` for part 2), the journal's own Calendar, Plan, ledger and cash layouts for `journal` nodes, and the Exp7 demo.

*Phase 4 as built, part 2: the TopBar and the Apps picker (1.8.82).* New shared script `design-chrome` registers the chrome's components: `TopBar` (the bar's face), `ChromeButton` (back), `Avatar` (the disc, as initials, a photo or a photo still loading), `AppsPanel` (the picker's face) and `AppCard` (an app's card, idle or selected, with the ground shadow a raised card leaves). Each has its slots, the idle, hover and (for back and a card) pressed states, bounds and fixtures. `Exp7Chrome.layout(model, W)` lays out a bar or a picker from a model (`{ __chrome, surface: 'bar' | 'apps', tokens, ... }`) in the `chrome.layout:bar` or `chrome.layout:apps` failure context; `PlatformChromeJR` now builds those models instead of HTML, and `JRViews` picks a document's layout in one place (`layoutFor`). Every face, bevel, ring and shadow is art from a new pack, `exp7-chrome` (6 pieces, app `platform`), drawn in SVG in exp7-budget-studies `art/` and written once from 1.8.80's drawing by exp7-jrender `tools/art/gen-chrome.mjs`. The state-table pass (`jrviews-ux-states`) still moves the controls: a design node carries its pose and its pressed fill and ring from the art (`n.pose`, `n.press`), where 1.8.80 read them off the HTML.

Tokens: `Exp7Tokens.chrome(name, over)` with `EXP7_CHROME` (the bar's and the picker's sizes, the text sizes and baselines, and the ink and muted colours), checked whole and frozen. Text shrinks to the room it has, with no smallest size; where there is no room it is not drawn.

Fail first: a model with no token set, a token set with an unknown key or a wrong type, a bar narrower than back and the avatar (86 px), a picker with no room inside its inset, an avatar mode its art does not draw, a missing piece or a forced failure each fail the layout. The bar or the picker then keeps its last frame and `PlatformChromeJR` records the failure (`PlatformChromeJR.error()`); there is no stand-in drawing.

Fallbacks removed from `PlatformChromeJR`: the local paint, the default apps list, the default avatar box, the width chain ending in `innerWidth` and 360, the photo decision that was never defined (so every draw reloaded the photo), the `https` image path used when `JRender.Images` was missing, the parallax `|| 0`, and its try and catch blocks. The picker now redraws on resize (the old check read `root.UI`, which was never set). The first width is the host's container, not the window.

Nothing changes on screen. The gate (`tests/layer4-chrome.mjs` in exp7-jrender): against 1.8.80's capture, the bar at 320, 390 and 1024 with initials, a photo and a photo pending, and the picker at the same widths with no app, Budget and Exp7 open, have the same height and, node by node, the same items, hit boxes, hover, edges, draw-list bytes and pressed look. One thing differs on purpose: a selected card's resting fill is its own gold, so after the pointer leaves it, it goes back to gold; 1.8.80 left it the lighter gold of its pressed base until the next draw. Kept as they are, for Matthew to decide: the chrome's 13 px text and 36 px controls, which are under the phone floors (body 17, target 44); the DOM bar showing until the canvas bar's first frame; app cards side by side at 1024 (single column would stack them); a card's text measured bold but drawn regular when selected; the photo reloaded on every bar draw.

Not in part 2: the journal's own Calendar, Plan, ledger and cash layouts for `journal` nodes, and the Exp7 demo. The account, key and share panels stay DOM.

*Phase 4 as built, part 3: the journal's views and Home's focus ring (1.8.83).* A `journal` node in a view model (Budget's plan, monthly expenses and cash and owned items, wherever the views show them) is now laid out by `Exp7Journal.viewLayout(model, W)` from components, in the `views.journal:budget` failure context, instead of journal-views placing text, rules and colours by hand. New components in `design-components`: `ViewHead` (a view's title and the rule under it), `DateBand` (the ledger's month button), `Label` (one line of text in a role and ink, at a drop and a step), `MoneyRow` (a lead date, a name that wraps, a note under it, an amount fitted to half the width, the row's rule), `TotalRow` (a subtotal or month total, with an optional rule over it) and `FocusFrame` (Home's keyboard focus ring); the plan rows are the existing `Row`, the notes `Note`. `Exp7Components.cover` gives a node a tap area over a rect (the view's navigation). Every rule, band and ring is art: five more pieces in `budget-journal` (60 in all), drawn in SVG in exp7-budget-studies `art/`. The sizes are 26 more tokens in `BUDGET_JOURNAL` (`viewHeadRule` to `focusOutset`), so `EXP7_LIGHT` has them too.

Home's keyboard focus ring is `FocusFrame` art, drawn in the `budget.focus` failure context before anything is shown: if it can't be drawn, Home's render returns `FAIL` and the last frame stays, and moving the focus (`Home.focus(key)`, used by Tab) keeps the old focus. A focus whose target the new layout no longer has ends.

Fail first: a journal kind with no view layout (`calendar`, `agenda`: nothing builds a view of them) fails with `DATA_MISSING`, and so does a cash row whose amount is not a number (1.8.82 showed 0).

Fallbacks and dead code removed: journal-views' colour table, type and spacing tables, `rgba`, `color()`, the hand-drawn chevrons and marks, and its old `layout()` with the calendar and agenda layouts nothing reached; `Exp7Journal.type`, `space`, `colors` and `glyphs`; Home's plan picker menu and date menu, which nothing could open (`this.popup` was never set; their pointer handlers, close timers, `paintOverlay`, `inside`, `cancelClose`, `deferClose`, `pointer`, `close` and the selector recolour went with them); the cash amount's 0.

The gate (`tests/layer4-journal.mjs` in exp7-jrender): against 1.8.82, every journal view state in `fixtures/views.mjs` (63 layouts: 45 ledger, 9 plan, 9 cash on the ordinary, stress and accents fixtures at 320, 390 and 1024) has the same nodes, ids, acts, hit boxes, items and hover, with positions compared to 1/64 px, apart from the listed changes below; Home's focus ring draws the same bytes as 1.8.82 on every tap target (108, at three widths). `layer4-views.mjs` now leaves the journal states to it. Listed changes, for Matthew to approve:
- A text 1.8.82 cut off at its edge now wraps to more lines, and everything under it moves down (in the fixtures: 60 ledger row names on narrow widths, and the cash note at 320 and 390). A single line shrinks to fit instead.
- The ledger's heading text, which the month band drew over so it never showed, is gone.
- A view's navigation tap area covers the view's height; it was 900 px whatever the view's height.
- Text positions now round to 1/64 px, the draw list's quantum (1.8.82 kept the raw fractions). In Chrome on Matthew's Mac (dpr 2) this moves glyph-edge antialiasing: 36 to 489 pixels per view differ, by at most 55 in one channel, spread across the text, with nothing that moves to the eye. With 1.8.82's text rounded the same way, 36 of the 42 views checked are 0 px.
- A row name keeps at least `labelMin` (40 px) before the amount; 1.8.82's floor was 20 px.
- Calendar and agenda journal kinds fail, and a cash row with no amount fails.
- A row's tap label is its plain text (no markup).

The 0-px check in Chrome on Matthew's Mac (Browser 1, dpr 2), 1.8.82 against 1.8.83, made-up fixtures: 42 journal views (ordinary and stress; ledger, plan and cash; 320, 390 and 1024) and the date band hover on three ledgers at three widths. Raw, every view differs only in glyph-edge antialiasing (the rounding above). With 1.8.82's text rounded to 1/64 px, the ledger heading text left out and its cut-off text allowed to run, 36 views are 0 px and the hovers are 0 px (the hover itself changes 67,489 px, so it was drawn). The other 6 are the listed wraps, whose heights change (ordinary and stress asset board at 320 and 390, 264 to 283 px; stress expense board at 320 and 390, 2144 to 2732 and 2438 px). Home's focus ring: 111 rings (every target and no focus, at three widths) draw the same bytes in Chrome in both releases, which run the same renderer.

Kept as they are, for Matthew to decide: two focus ring looks (Home's `FocusFrame`, 1.5 px accent just outside the target, and the full views' `FocusRing` from part 1, 1.2 px inside it, whose SVG names its colour instead of a token).

Not in part 3: the Exp7 demo (its own DOM harness today) and phase 5.

*Phase 4 as built, part 4a: the Exp7 demo on canvas, its frame, Atlas, Proposal console and About (1.8.84).* Matthew's answer on the demo's scope, 2026-11-15: "Move it to canvas". The demo (the `apppkg` app the shell mounts as Exp7) was a DOM harness; it moves to canvas in three releases, so each stays small: **4a** (this one) the frame (title, codec chip, Copy diagnostics, the ten tab buttons and the diagnostics box), the Atlas, the Proposal console, About and the path inspector under the Atlas and the console; **4b** Two writers, Storage and Circuit; **4c** Paths, the side panels of the Calendar, Board and Plan tabs, and whatever DOM is left. The account, key and share panels stay DOM, as decided (Q8).

New script in the demo, `Exp7DemoUI` (`demo-ui`): `screen(name, box, build, acts)` makes a canvas in a box and draws an `Exp7VM` model there (app `exp7`, the platform's view tokens, the `exp7-views` art) with a JRViews `View`, the way the Calendar, Board and Plan views are drawn. A screen is a function of the demo's state (`build(screen)` returns the model's nodes) and keeps nothing of its own but the text typed in its fields. Tapping a control runs its act, `verb:arg`, through the screen's handler for that verb; a field names the verbs run when its text changes, on Enter and when it loses focus. Text fields are JRender `TextField`s placed where the layout drew the field's box after every draw; the field that had focus keeps it, with its caret. The demo has two screens: `frame` (header, tabs, diagnostics) and `body` (whichever of Atlas, Proposal console and About is open). The other seven tabs are still the DOM sections they were, under the canvas frame.

What `Exp7VM` can draw now, for the demo (the views use none of it, so they are unchanged):
- Text in runs (`runs: [{ text, bold, color }]`, a colour being a token name) wrapped as one paragraph, and code text (`s: 'code'`: line breaks kept, one size smaller, in the body font).
- A field that fills its line (`fill`), a multiline field (`rows`), and a field's `label`.
- A note: a panel with role `note` and an optional tone (`bar: 'ok' | 'bad' | 'warn'`), for a result or a status in a box.
- A chip in a `warn` tone; a table cell that is a button (`{ btn, act }`); a table row in a tone (`tone: 'ok' | 'bad' | 'warn'`); a panel you tap as a whole (`act` on a panel).
- Tokens: `warn` in the platform's view colours (`#c98a00`; Budget's look takes it from `VIEW_BASE`, unused), and the colours worked out from it and the note and row tones (`note*Fill`, `note*Line`, `rowOk*`, `rowBad*`, `rowWarn*`, `chipWarn*`). Art: `Panel` has the variants `note`, `note-ok`, `note-bad` and `note-warn`, `Chip` the four `warn` variants and `TableRow` `ok`, `bad` and `warn`, in both `exp7-views` and `budget-journal` (so both packs still cover every variant; Budget draws none of them).

Fail first: a screen with no box to draw in fails with `DATA_MISSING`; a screen with a character that a font which can draw it lacks (in a label, a text, a placeholder, a field's value or a table cell) fails with `GLYPH_MISSING` instead of drawing the notdef box; an act with no handler with `COMPONENT_INVALID`; a joy step out of 0 to 10 with `BOUNDS_UNSAT`; a path pre-fill for a path the atlas doesn't have with `DATA_MISSING`; opening a tab the demo doesn't have with `COMPONENT_INVALID`. A screen that can't be laid out keeps its last frame and records the failure (`Exp7Fail.records()`, also in Copy diagnostics). The demo reports itself ready to the shell only once the frame and the open screen have drawn; if either fails first it reports an error with no tabs. The early boot status and the fatal diagnostics box stay DOM: they are what shows when the canvas can't start.

Fallbacks and dead code removed: the codec's optional path (binary sizes are now always the real codec's, and the estimate when it was missing is gone), `bootStep` and the try and catch blocks around the renders and the diagnostics, the clipboard's `execCommand` fallback (copying fails with a message where there is no clipboard), the DOM Copy diagnostics listener, `renderBatch` and `renderAtlas`, the header, tab bar and `.alt` styles, and the demo's whole Budget mode, which the platform no longer reaches since Budget has its own slot: `mkBudgetAtlas`, `harmonicSharesBudget`, its IndexedDB store (`budget-app-v1`), entering and leaving the mode, its root swaps, type bar, rank panel, examples, submit wrapper, styles and tabs, and `window.exp7`'s `enterBudgetMode`, `enterExp7Mode`, `mode`, `legacyBudgetApi` and `bootErrs`. `window.exp7` keeps `W`, `submit`, `LOG`, `snapshot`, `replaceW` and `applyCheckedProposal`, which the shell uses. Two writers redraws on a tab event (`exp7-tab`) instead of a click on the old tab bar.

Moving to canvas changes every pixel of what moved, so the gate is the list of changes, for Matthew to approve:
- The frame, the tabs, the Atlas, the Proposal console, About and the inspectors are drawn on canvas with the design system's components instead of HTML. The page around them, the other seven tabs and the account, key and share panels are as they were.
- There is no monospace font in the design system, so JSON, paths and code draw in the body font, one size smaller.
- The joy sliders are − and + steppers (0 to 10, a step of 1), each button disabled at its end.
- The three date inputs are text fields that take YYYY-MM-DD; a text that isn't a date shows a "not a date" note and changes nothing.
- The console's op menu is a row of chips; only the ops valid for the path are shown after a pre-fill, as before.
- Every grid (the alternatives, the joys, the dates) is one column (Q6, single column).
- A screen taller than 620 px scrolls inside its canvas, as the views do.
- The tab row scrolls away with the page; it was sticky.
- The star and the no-entry buttons are "Prefer" and "Unavailable" buttons, shown on while set; they were the symbols ★ and ⊘ alone. The views' fonts have no ⊘, and their bold face no ★.
- Characters the fonts that draw the demo don't have are written in words: About says "delta marks" for "Δ marks", "to" for →, "and" for ↔; a proposal's result reads "3 ops, now rev 1004"; the jreq chain is joined with ">"; the method button reads "method: best (tap for sim)"; a copied path's button reads "copied" (was ✓).
- The best alternative has a Best chip instead of a green border, and an unavailable one an unavailable chip instead of struck-through text.
- Copy diagnostics opens the diagnostics in a note with a multiline field and a Hide button; a copy that fails shows why in a note.
- An inspector row the last proposal wrote, touched or failed on is still tinted green, amber or red, but in the `ok`, `warn` and `bad` row art's shades, worked out from the tokens, instead of the CSS colours.

Kept as they are, for Matthew to decide:
- The views' 13 px text and 30 px buttons, which the demo's canvas now uses too (under the phone floors, body 17 and target 44).
- Found in the Chrome check: JRViews measures and wraps every view's text in its own font (`jr-font`, 243 characters) but draws `text` and `rich` items in the journal's Source Sans 3 whenever the platform has loaded it (`window.__jrJournalFonts`, always in the lean), while `tbox` items stay in `jr-font`. So the platform's Calendar, Board and Plan views and the demo measure in one font and draw in another, and a character only `jr-font` has (→, ↔, ✓, ★) draws as a box. The demo checks its text against all four fonts, so it can't draw a box, but the measuring is still off. Fixing it (one font for measuring and drawing, with no `||` fallback) moves text in every Exp7 view, so it is its own change for him to approve.

Tests: `tests/layer4-demo.mjs` in exp7-jrender (95 checks): the demo boots and reports ready with ten tabs; the frame, the Atlas, the console and About lay out at 320, 390 and 1024 with every control inside the width and every button the view's button height; every control's act has a handler; picking, preferring and ruling out an alternative, the joy steppers at their ends, a good and a bad date, the console's op chips, adding, filling, clearing and submitting a batch, the examples and a pre-fill from a path each do what they did in the DOM; About has its 29 paragraphs; the fail-first cases above fail with their codes and leave the last frame; a resize redraws both screens at the width inside their boxes; nothing removed is still reachable. `tests/run.mjs` runs it as the `demo` layer.

The check in Chrome on Matthew's Mac (Browser 1, dpr 2), with the release loaded in a test frame at 390 and 1024 and the Exp7 app mounted by the shell: the demo reported ready (in 40 to 110 ms) with no failure records and no page errors; both screens drew at the width inside their boxes; real taps picked, preferred and ruled out an alternative and stepped a joy; real typing into the console's value field and "+ add op" built the batch; the console, an example and About drew at both widths with no failure. That check found three things, fixed in this release before the pull request: the frame was drawn at its box's outer width and ran 20 px past the slot (a screen is now drawn at its box's content width); redrawing inside the ResizeObserver made Chrome report a loop error, which the early boot script showed as a boot error (a resize now redraws in the next frame); and characters the drawing fonts lack (★ ⊘ → ↔ ✓ Δ) drew as boxes (the demo now fails with `GLYPH_MISSING` for them, and its own text uses words). Pixels are not compared, as everything that moved is listed above. The test frame, its storage on the test page (example.com) and the tab are cleaned up.

Not in part 4a: Two writers, Storage and Circuit (4b), Paths and the views' side panels (4c), and phase 5.

*Phase 4 as built, part 4b: Two writers, Storage and Circuit on canvas (1.8.85).* Matthew's go-ahead, 2026-11-15: "Yes, build the rest". The demo's body screen now draws six tabs on canvas: Atlas, Proposal console, Two writers, Storage, Circuit and About. The DOM sections `t-sync`, `t-storage` and `t-circuit` are gone; Paths and the Calendar, Board and Plan tabs are still DOM under the canvas frame (4c).

- **Two writers**: the collaboration card (the replicated notes, label and task order of Alice and Bob, with append, delete, label, move, undo and exchange), the controls (network on or off, Sync now, auto-sync, Scenario, reset, and a converged or diverged chip), Alice's and Bob's cards (their edits as buttons, a trip-name field, their entries with owner and revision), the merge order, the diff between the two replicas, the path inspector, and a card that shows or hides each replica's Plan and Board views. Those views are still JRViews views drawn into their own hosts, which now sit under the screen (`demoReplicas`), not inside each writer's card.
- **Storage**: the batch log (a table), the 5000-op test (JSON and atlas/1 sizes, the round trip and the time) and the per-path statistics.
- **Circuit**: the rule source in a multiline field that parses as you type, the parse result, a chip per rule, the event arguments field, Run rule and Run demo sequence, what fired, the canonical print, its round trip, and the scores with a graph you show or hide.

Fail first: an edit a writer doesn't have fails with `COMPONENT_INVALID`; anything the collaboration engine refuses (its policy or its checker) is recorded as `CONTEXT_FAILED` in the `demo.collab:<action>` context and shown in a bad note with the engine's reason, where it was a status line only; a delete range that isn't whole numbers shows a note and changes nothing; Circuit's event arguments that aren't JSON show "args must be JSON" and fire nothing; a source that doesn't parse shows the line and the message and keeps the last good rules.

Fallbacks and dead code removed: the lean's Doc and Panel helper script (`Exp7Experiments`), the collaboration demo's DOM script and the try and catch around it, `renderSync`, `renderLog`, `renderScores`, `renderSyncDiff`, `renderPathStats` and `renderInspector`, the three HTML sections, and the `.writer`, `.hash`, `.big`, `.toggle`, `.on-line` and `.off-line` styles. Submitting a batch, booting, `replaceW` and `applyCheckedProposal` now redraw the canvas instead of calling `renderLog`. `window.exp7` keeps `edit`, `sync`, `replica`, `rank`, `bestRank`, `selectedAlt`, `scorer`, `setNet` and `WR`.

The list of changes, for Matthew to approve:
- Two writers, Storage and Circuit are drawn on canvas with the design system's components instead of HTML, in one column (Q6).
- The replicas' Plan and Board views are drawn under the Two writers screen, with a Show or Hide button for each and a line saying whether the view drew, instead of inside each writer's card.
- Checkboxes are toggle buttons (auto-sync, hold offline); menus are chips (the writer, the task, move before, the rules).
- The delete range's number inputs are text fields with a whole-number check.
- Tables merge columns to fit a phone: the log has five (number, batch, ops, JSON bytes, atlas/1 bytes), with the kind, the writer and the ops in one; the per-path "by op" counts read like "set x3".
- Folding sections are Show and Hide buttons (each replica's path writes, the score graph).
- Characters the fonts lack are words or "x": arrows, "≠" and "×".
- The collaboration table is part of the screen and takes its colours from the design tokens instead of its own.
- The engine's refusals are now failure records (`Exp7Fail.records()`, in Copy diagnostics) as well as a note.
- At phone width the log's and the replica views' narrow table columns wrap inside words (the ops JSON, "proposal"); nothing runs past the width.
- A multiline field (the Circuit source, the diagnostics) is as high as the lines its text wraps to, at least its rows, instead of a fixed height that scrolls; the page around it scrolls instead.
- Opening another canvas tab shows it from its top; it kept the last tab's scroll.

Kept as they are, still for Matthew to decide (from 1.8.84): the views' 13 px text and 30 px buttons under the phone floors, and the JRViews measure and draw font mismatch, as its own change.

`Exp7VM` (shared with the views, which have no multiline fields, so they are unchanged): a field with `rows` is at least that many lines high and as high as its text wraps to at its width, the same wrap the live `TextField` makes, and shows every line where the live field puts it. So the live field never scrolls its text, which matters because `TextField` draws its glyphs unclipped. `Exp7DemoUI` screens get `top()`, which scrolls a screen back to its top after the draws before it.

Tests: `tests/layer4-demo.mjs` in exp7-jrender (167 checks, was 95): all six canvas tabs lay out at 320, 390 and 1024 with every control inside the width, every button the view's button height and no character a font lacks; every act has a handler; each writer's edits, a name, sync with the network off and on, auto-sync, the scenario and reset do what the DOM did, and the replica views draw and hide; the collaboration card appends, deletes, labels, moves, undoes and exchanges, refuses a range that isn't whole numbers, and records an engine refusal (a locked shared scope) with its reason; Storage shows the log, the 5000-op test and the per-path statistics; Circuit parses, shows a parse error and parses again, fires a rule, refuses arguments that aren't JSON, runs the demo sequence and shows the graph; the source field is as high as the lines it wraps to, grows as lines are added and keeps its 13 rows for a short source; another tab opens at its top and a redraw keeps the scroll; nothing removed is still reachable. Every other layer passes unchanged.

The check in Chrome on Matthew's Mac (Browser 1, dpr 2), with the release loaded in a test frame at 390 and 1024 and the Exp7 app mounted by the shell: the demo reported ready (26 to 69 ms) with no failure records and no page errors; real taps opened Two writers, Storage and Circuit from the tab row, picked Bob as the writer, typed and appended a note (12 ops from Bob), picked the rate rule (its arguments filled) and ran it, typed a new line into the source, and generated and encoded the 5000-op batch; every edit, sync, the scenario, reset, the replica views, the collaboration actions and the demo sequence ran at both widths with no failure. It found two things, fixed in this release before the pull request: the Circuit source is longer than its 13 rows, so the live field scrolled it and drew its first lines over the card's title (a multiline field now grows to its text, above), and a new tab opened at the last tab's scroll (it now opens at its top). One more thing it showed is not new and is part of the open font question from 1.8.84: the Plan view (the Plan tab and each replica's) draws its ▸ disclosure mark as a box, because the views measure it in `jr-font`, which has it, and draw it in Source Sans 3, which doesn't. The test frames, their storage on the test page (example.com) and the tab are cleaned up. (A test frame loaded as `srcdoc` can't take a tab tap, because the tab row writes the tab into the page's address, which a `srcdoc` frame refuses; the check loaded the release from a blob address instead, as a page opened from a file does.)

Not in part 4b: Paths and the side panels of the Calendar, Board and Plan tabs (4c), and phase 5.

*Phase 4 as built, part 4c: Paths and the Calendar, Board and Plan tabs on canvas (1.8.86).* Matthew's go-ahead, 2026-11-15: "Yes, build the rest". Every tab of the demo is now drawn on canvas, so the demo has one section (`t-canvas`): the frame screen, then, on the Calendar, Board and Plan tabs, that tab's JRViews view, then the body screen. The account, key and share panels stay DOM, as before.

- **Paths**: the whole flattened atlas (1192 paths, 551 nodes). Tree, flat list, expand all and collapse all are buttons; a prefix field and a search field (path or value); a count of what shows; the last proposal's note, and a bad note when the path it failed on is not in the atlas. In the tree each node is a row (`- items/getthere/` or `+` when closed, and how many paths it holds) that opens or closes on a tap; its child nodes come first, then its own paths. A path's row pre-fills the Proposal console on a tap, and its copy button copies the path. The rows of the last proposal take its tones.
- **Calendar, Board and Plan**: the view as before, drawn above the screen; under it a card with the view's heading and its status line; the proposals as buttons (an invalid one marked) with the result as a note; the side panel (Calendar's discrepancies, Board's ranking and its history, Plan's steps, what-if and dependencies); and the deep paths, the ones the last proposal touched first.
- **Path rows** (Paths, the Atlas tab's path inspector and the views' deep paths): path, value and copy, with the type and owner on a line under the row; on Paths, once a proposal has written the path, its rev and last change join that line.

Fail first: an unknown Paths mode or an unknown proposal index fails with `COMPONENT_INVALID`; a view that reports an error shows it in a bad note under its status.

`Exp7VM` (shared): when a table is squeezed below what its text wants, a column of buttons keeps its buttons' width and the text columns share the rest. Before, every column shrank, so at 390 the copy buttons were 26 px wide and read "…" (since 1.8.84), under the tap floor. The views' and Budget's tables have no button cells, so they draw the same.

The lean outside the demo: the views host's HTML builders for the side panels (`jvStatus`, `discHTML`, `planSide`, `vbtns`) are gone; the proposals' labels and the views' notes say "to" or ":" where they had an arrow, and "-" where they had a minus sign, because the fonts have neither and a screen with a character the fonts lack fails with `GLYPH_MISSING`.

Fallbacks and dead code removed: the four HTML sections (`t-paths`, `t-cal`, `t-brd`, `t-plan`), `renderPaths`, `refreshPaths` and its cache, `treeHTML`, `rowHTML`, `lastHTML`, the ghost row's HTML, `resultHTML`, the document handlers for `data-copy`, `data-pclick` and `data-vp`, `CANVAS_TABS` and the switch between canvas and HTML sections, the section show and hide styles, the styles only the removed HTML used (`.grid`, `.card`, `.tag`, `.res`, `.row`, `.ptree`, `.prow`, `.hl`, `.cp`, `button.p`, `button.r`, `.ok`, `.bad`, the table and `pre` styles), and the consumer's aliases to the host's builders (`esc`, `jvStatus`, `planSide`, `vbtns`, `discHTML`).

The list of changes, for Matthew to approve:
- Paths, Calendar, Board and Plan are drawn on canvas with the design system's components instead of HTML, in one column: each view sits above its panels, and the heading moved under the view.
- The Paths tree is a list of node rows with the full prefix, a + or - and the number of paths, instead of nested folding sections.
- Path rows are path, value and copy, with type and owner (and on Paths the rev and last change) on a line under the row. This also changes the Atlas tab's path inspector from 1.8.84, which had five columns whose headings broke into letters at 390.
- A squeezed table keeps its buttons whole (above), so the inspectors' copy buttons read "copy" at 390.
- Arrows in the proposals' labels and the views' notes are "to" or ":", the minus sign is "-", and "×" is "x".
- Board's ranking history joins the orders with "then" and includes the current order; the HTML lagged one draw behind.
- A proposal's result is a note under its buttons.

Decided by Matthew, 2026-11-15: Paths shows the whole atlas ("Keep it whole"). It lays out in about 210 ms in Chrome on his Mac and is about 145,000 px tall at 390; the first letter typed in the search took 213 ms (the full tree to the matches), the next ones 11 to 53 ms.

Still for Matthew to decide:
- From 1.8.84, still open: the views' 13 px text and 30 px buttons under the phone floors, and the JRViews measure and draw font mismatch (the Plan view's ▸ draws as a box), as its own change.

Tests: `tests/layer4-demo.mjs` in exp7-jrender (249 checks, was 167): every tab is canvas and lays out at 320, 390 and 1024 with every control inside the width and no character a font lacks; Paths shows every path once and every node, in order, closes and opens a node, collapses and expands all, the flat list, the prefix and the search, says "1 path", shows the last proposal's tones and last change and the note for a path not in the atlas, refuses an unknown mode, puts type and owner under the row, and keeps its copy buttons as wide at 390 as at 1024 (this check fails on the release before the fix); the three views are set up at boot and each tab shows its own; Calendar's proposal moves the date with a conflict, the views redraw, the deep paths put the touched ones first and the next proposal restores it; an unknown proposal fails; a view's error shows; Board's ranking and history and Plan's what-if show; the host's notes have no arrow; nothing removed is still reachable. Every other layer passes unchanged.

The check in Chrome on Matthew's Mac (Browser 1), with the release loaded in a test frame at 390 and 1024 and the Exp7 app mounted by the shell: the demo booted with no failure records and no console errors. Real taps moved a Calendar item (the conflict showed in the discrepancies) and moved it back, opened Getting there's alternatives and a what-if on the Plan tab (the body showed the what-if, its table and the status with no failure), typed a search on Paths, closed a tree node, tapped a path row (it pre-filled the Proposal console) and copied a path. It found three things, fixed in this release before the pull request: Paths at 390 had seven columns whose headings broke into letters (rev and last change moved to the line under the row); the Plan view's status and what-if summary had an arrow, which failed the screen with `GLYPH_MISSING` (the host's notes now say "to"); and the copy buttons were squeezed to 26 px (the table fix and the three-column rows above). The test frame, its storage on the test page (example.com) and the tab are cleaned up.

Not in part 4c: phase 5.

*1.8.87: one font for measuring and drawing, and marks as art.* Matthew's answers to the questions left open since 1.8.84, 2026-11-15: keep the views' 13 px text and 30 px buttons ("shrink to fit always applies"); fix the font mismatch as its own release ("2 fix"); and draw the views' marks as art ("Art").

The mismatch: the views measured their text in DejaVu Sans (`jr-font`) and drew it in whatever font the journal had loaded, Source Sans 3. A character only one of them had drew as a box (the Plan view's ▸), and text was placed for widths it did not have. Now:

- **Every text names its font.** A view token set, the Budget journal's tokens and the chrome tokens each name two fonts, `font` and `fontStrong`, by their embedded name: the platform look `jr-font` and `jr-font-bold` (DejaVu Sans), Budget `jr-font-ss3` and `jr-font-ss3-semibold` (Source Sans 3). Every text, wrapped text and rich text a layout makes carries the font it was measured in, and JRViews draws it in that font. JRViews loads the four embedded fonts at boot, in one order, and `JRViews.fontId(name)` gives a font's id; there is no default font.
- **Fail first.** A token set that names a font that is not embedded fails with `FONT_MISSING`; a character an item's font has no glyph for fails the layout with `GLYPH_MISSING` (no box is drawn); JRViews refuses to draw a text item that names no font.
- **Marks are art.** The marks a view text uses (← → ▸ ▾ ✓ ✗ ★ ☆ ⚠ ⟳ ● ○) are the `Mark` component (6.2). In the text each one holds a blank place 0.9 em wide (U+FFFC, which all four fonts have as an empty glyph), so measuring, wrapping and cutting with "…" treat it like a letter; the layout then draws the Mark art in that place, 0.9 em square on the text's middle, in the variant `<mark>-<tone>`. The tone is the view token whose colour the text is in: `ink`, `muted`, `onAccent`, `accent`, `danger` or `select`. Text in a colour no tone has fails with `TOKEN_UNKNOWN`, naming the tokens with that colour. A mark cut off by "…" is not drawn. Each look's pack draws them: the platform look in rounded 1.3 strokes in its view tokens' colours, Budget in thin square-ended 1 px strokes like its date chevron, in the colours of its view tokens. Swapping the `Mark` piece for an app, a screen or one view swaps every mark there.
- **Fonts.** DejaVu Sans Regular and Bold gain Latin Extended-A (U+0100 to U+017F, 128 letters such as Ł, ě, Đ, Ŝ), so a name with them no longer stops a platform view; the four fonts gain the blank U+FFFC. Every old glyph is kept byte for byte ([fonts.md](./fonts.md)). The DejaVu licence travels in the lean in the `font-licence-dejavu` block.

Fallbacks and dead code removed: the JRViews core's `try`/`catch` that used the regular font for bold when the bold font failed to load, and the one that ignored a journal font that failed to load; the `window.__jrJournalFonts` global (set by the core and by Budget, read when drawing); the drawing code's default to the journal font, then `jr-font`, for a text or rich item, and its fixed `jr-font` for wrapped text; `JRViews.font()` and `JRViews.fontBold()`; `Exp7VM`'s and the chrome's fonts taken from them, with `FONTB = FONT` when there was no bold; the views host's and the demo's field font taken from `JRViews.font()` (a field's font comes with its style from the view tokens); and the demo's own walk over its screens for characters the fonts lack, with its guess at the fonts JRViews drew in (`Exp7VM` itself now fails such a screen).

The list of changes, for Matthew to approve:
- The platform look (the stock Calendar, Board and Plan views, the top bar and Apps picker, and the Exp7 demo) draws its text in DejaVu Sans, the font it was always measured in; 1.8.86 drew it in Source Sans 3. Letters change shape; where text sits and where it wraps does not, because it was measured in DejaVu Sans already. Matthew kept DejaVu Sans for the platform look, 2026-11-15: "DejaVu Sans is fine/ no extra work needed there".
- Budget's views measure their text in Source Sans 3, the font they draw in, so widths, wraps and "…" cuts match what is drawn. Source Sans 3 is narrower, so some texts that wrapped or were cut now fit, and what follows them moves up or left.
- Marks are drawn as art instead of from a font (above): their shapes change, and a mark's place is 0.9 em wide, so text after one moves: under a pixel after most marks at 13 px, and about 5 px after ▸ and ▾, which were half an em wide. The Plan view's ▸ no longer draws as a box.
- Letters from Latin Extended-A draw in the platform look, where 1.8.86 failed the view with `GLYPH_MISSING`.
- In the DOM layout of the Calendar, Board and Plan views, a bold label draws bold, as it was measured; it drew regular.
- A bold label wider than its room (a selected button or chip, a heading in a narrow column) shrinks to fit on one line. Before, it wrapped onto a second line that the narrower drawing font hid in most cases; drawn in the font it is measured in, it showed below its button (found in the Chrome check: the Plan tab's "Alternatives for Pack bags (0)" at 390).

Kept as they are, decided by Matthew: the views' 13 px text and 30 px buttons.

Tests in exp7-jrender: `tests/layer4-views.mjs` now gates against 1.8.86 (`43637a4`): every platform view state with no mark and no Latin Extended-A letter lays out the same apart from the fonts the items name; every other state is listed by the change above that explains it; the mark characters are the ones it knows, no text draws a mark character, every mark is drawn as Mark art in a tone the view tokens have, every bold label lays out on one line (this check fails on the release before the fix), and Budget's Mark art draws each tone in the colour its view tokens give it; a mark in a colour no tone has fails with `TOKEN_UNKNOWN`, and a character no font has with `GLYPH_MISSING`. `tests/layer4-chrome.mjs` compares the chrome with 1.8.80's capture apart from the fonts and checks its text is in the chrome tokens' fonts. `tests/layer4-demo.mjs` checks the Plan tab's marks are Mark art. Every other layer passes unchanged.

The check in Chrome on Matthew's Mac (Browser 1), with the release loaded in a test frame at 390 and 1024: the Exp7 demo booted and its Plan, Calendar, Board, Paths and Atlas tabs drew with no failure records; the Plan view's ▸ and → are triangles and arrows drawn as art (50 marks), and a real tap on "Alternatives for Pack bags" opened it with a ▾. A made-up view with every mark, a selected button and accented names (Ł, Ż, Đ, Š) drew in both looks at both widths with no failure: the platform look in DejaVu Sans with rounded marks, Budget in Source Sans 3 with thin marks. Budget's monthly expenses view opened from Home and drew as before. It found one thing, fixed in this release before the pull request: the selected "Alternatives for Pack bags (0)" button at 390 wrapped "(0)" below the button, because its bold label is wider than the button and now draws in the font it is measured in (a bold label now shrinks to fit, above). The test frame, its storage on the test page (example.com) and the tab are cleaned up.

**Phase 5: new apps.** A new Exp7 app is its atlas, a complete token set, a complete art pack and screens built from the catalog. Nothing else.

Matthew started phase 5 on 2026-11-15 ("budget first"). Budget is the first app built this way, in releases from 1.8.88; the gaps it had, found on main at 1.8.87: Budget's token sets, art pack, screens and atlas were set up in different places and never checked together; its own page (`budgetpkg`) did more than the four parts (it wrote colours and a shake animation into every saved view, ran re-check timers and kept dead code); a failed draw put an error box in the page; the typing field is a DOM input with its own styles and a backup font (1.8.89 draws it from Budget's tokens and art); only idle and hover art is drawn live (1.8.90 draws every state, 1.8.91 in the views too); and fallbacks remain in Budget's code outside the linted design scripts. Each is its own release.

*1.8.88: Budget is one app, checked whole when it opens.* A new shared script, `design-app` (`Exp7Apps`), holds the apps:

- **`define(id, definition)`** records an app as four parts and nothing else: `atlas` (`make()` a blank one, `load(saved)` one brought up to date, `check(atlas)` a failable step), `tokens` (its token sets, each with its kind: `journal`, checked by `Exp7Tokens.check`; `views`, put over the platform's view tokens by `Exp7Tokens.views`; or `chrome`), `pack` (the embedded block its art pack is in and every component the pack must cover) and `screens` (its routes, its route aliases, the catalog components its screens draw and its layout functions).
- **`open(id)`** checks every part together in the `app.open:<id>` failure context: a part missing or unknown, a token set that fails its own check, a token set of no known kind, a pack block that is not in the lean, a pack that does not load or does not cover its components, a screen component that is not registered or not in the pack's list, a route named twice, an alias that is a route or leads to none, a layout that is not a function, and a blank atlas (`make()`) that fails the app's own `check`. Only when all of it passes is the opened app staged: its frozen token sets, its assigned pack and its routes. A failed open leaves what was open before. `get(id)` gives the opened app, or fails with the new code `APP_INVALID`; `route(app, name)` gives the route a name leads to, or fails with `APP_INVALID`.
- **Budget's definition** is in `journal-views`, after its routes: its atlas (moved from its page: the blank atlas, the healing of the boards' and the plan's membership and the move to the 1.8.57 selection model), its two token sets (`BUDGET_JOURNAL` for Home and the screens, `VIEW_JOURNAL` for the views), the `budget-journal` pack for its own components and the view components, and its 23 routes with the four aliases (calendar, agenda, ledger, cash). It opens once when the script loads. Home, every screen, the views and the journal fonts read their tokens from the opened app; `screenModel` refuses a route the app does not have; with Budget not open each of them fails with `APP_INVALID` and draws nothing. Budget's atlas `check` fails with `APP_INVALID` when an atlas is not marked as Budget's, or lacks its items, its calendar, its plan or one of its four type boards, each with its items.
- **Budget's page is cut down** to what is its own to run: storage, the shell's actions and the boot. It gets the opened app (`Exp7Apps.get('budget')`), makes, loads and checks its atlas through it, and fails its boot (the shell is told, with the reason) when Budget did not open, the saved atlas fails its check, the saved proposals can't be read or are not a list, or Home has not drawn. Removed: the colours and the shake animation it wrote into every view of the atlas at every mount (`RISK_COL`, `DEFAULT_THEME`, `DEFAULT_CRIT_STATES`, `applyDefaultViewStyling`; nothing drew them, because Budget's views draw in its views token set), the re-check timers and the `jr-chrome` class nothing read, the dead `surface` and `handles`, the `try`/`catch`es around its signal, its redraw and its proposals, the fallback that read unreadable proposals as none, and the error box's style. A view's `theme` in an atlas (the calendar template's dark one, or the light one Budget wrote before) is dropped when an atlas is made or loaded: Budget's look is its token sets.
- **A failed draw keeps the last screen.** When Home's update fails (the atlas can't be evaluated), the failure is recorded as `CONTEXT_FAILED` in `budget.update` and the last frame stays; there is no DOM error box (`.jrerr`) any more. A boot whose first draw never came still fails, as before.

Nothing changes on screen. Tests in exp7-jrender: `tests/layer5-app.mjs` (the `app` layer, now in the default run): `design-app`'s lint; Budget opened at load with no failure, its token sets equal to the checked sets, its pack assigned and covering what its screens draw, its routes the ones `screenModel` builds and the screens layer lays out; seventeen definitions, each with one part broken, failing with their own code (and the one as given opening); a failed open of Budget leaving the open Budget as it was; the blank and loaded atlases passing the check and carrying no view theme, loading twice changing nothing, and five broken atlases failing it; Budget's open forced to fail, then Home, a screen, a screen model, the views and the fonts failing with `APP_INVALID`; and the page's cut (no `try`/`catch`, no colours in its script, none of the removed names, its atlas through the app). `tests/layer1-static.mjs` lints `design-app` with the other design scripts. Every other layer passes unchanged.

*1.8.89: the field being typed in is drawn from Budget's tokens and art.* Until now a tapped text field opened a page input laid over the canvas, with its own styles (17 px Source Sans 3 with a backup font, a 1.5 px `#1A1A1A` edge, radius 4, white) and code that measured where the browser put it and moved it back (`overlayRect`, `overlayCorrection`, `placeFieldEl`). Now:

- **`LiveField`** is a new component: the box of the field being typed in, art in the `live.box` slot (`LiveField/live.box.svg` in Budget's pack: the page, so the drawn value under it is hidden, and a 1.5 px `ink` edge, radius 3.25, its outer edge on the slot's edge, as the old box looked). Its bounds are the tapped target's width and height.
- **`Exp7Components.liveStyle(S)`** says how the typed text is drawn, from the app's tokens: `body` type in its `font`, `ink` for the text and caret, `captionInk` for a placeholder, `fieldPad` inside the box and the new colour token `selection` behind selected text. The box is the art, so the text field draws no frame or edge of its own. A missing token fails as any other.
- **`screenLayout` takes `live`**, the act of the open field (`''` when none; leaving it out fails with `DATA_MISSING`). It places the `LiveField` over that field's target, on top of everything else on the screen, and returns `live: { box, style }`. An open field the screen does not have fails with `DATA_MISSING`, so the screen that worked stays.
- **Home** keeps the open field as its state (`live`: the field, the act tapped, what is typed), and its snapshot and rollback carry it. Opening a field redraws; the paint puts a JRender `TextField` on the `LiveField` in the screen's scene, focused with its text selected. Enter (`commitField`) writes what was typed into the draft, Escape (`cancelField`) drops it, and a tap elsewhere keeps it, as before: a press on the canvas commits on the press and redraws on the release, so the tap (Save, a row) still lands. A redraw while typing (a resize, a scroll) takes the text field off and puts it back with its text and selection, without letting go of the keyboard. A time is still typed as digits and shown as `HH:MM`; the keyboard is numeric for a time, decimal for an amount. A deduction's name now opens with its name in it (it opened empty, so Enter blanked it).
- Removed: the page input and its styles, `overlayRect`, `overlayCorrection`, `fieldLayoutRect`, `fieldCanvasRect`, `placeFieldEl` and `window.__budgetFieldOverlay`.

The other screens look the same; the open field looks as before except its text is Source Sans 3 drawn by JRender, and its selection is the `selection` wash instead of the browser's. Tests in exp7-jrender: the screens layer lays out every text field of every screen case open for typing, at every width on every fixture, and checks the `LiveField` covers its target, is drawn on top, its text style is Budget's tokens and the layout passes the layer-2 checks; an open field a screen lacks and a layout that does not say which field is open fail with `DATA_MISSING`. The journeys add typing a name, an amount and a time (Enter, a tap on the next field, Escape) and naming and sizing a deduction. The rollback layer now makes every text field's tap too (it skipped them as they opened a page input), and its state includes the open field. Layer 1 checks that journal-views makes no page input, sets no type, edge or colour in page styles, and has none of the removed names.

Checked in Chrome on Matthew's Mac (2026-11-15, the lean by its sha at be75a5c, a blank Budget at 390 wide, made-up data only): Add to today, then Activity or cost; tapping Name drew the ink box and the typed name; tapping Time kept the name, and 0930 showed as 09:30 with the time picker; Enter kept it; the amount's 0.00 was replaced by 12.50 as it was typed; a wrong name dropped with Escape left the name as it was; Save put the item at 09:30 on Today's schedule with 12.50. No failure was recorded and Budget made no page input (only the shell's own and JRender's hidden text field). The typed amount sits at the left of its box while the drawn amount sits at the right, as the old page input did. The test's storage was cleared after.

*1.8.90: every art state is drawn live, pressed included.* Until now only idle and hover were drawn: a node's hover drawing was kept beside it and Home swapped it in on enter and out on leave; `pressed`, `focus`, `selected` and `disabled` were in the pack but nothing drew them. Now:

- **A node rests in a state.** Placing a component may set its rest (`n.rest`): `selected` for the picked day of the month, a picked choice, a toggle that is on, a picked hour or quarter, and a picked hour row; `disabled` for an Accept band that can't be pressed; `idle` otherwise. The art draws the rest state, so a pack whose `selected` or `disabled` draws differently shows it with no code change. A rest the component does not declare fails with `COMPONENT_INVALID`.
- **`Exp7Art.look(n, state)` and `looks(n)`** give a node's items with each live state's drawing in place of the rest's (`Exp7Art.live` is `hover`, `pressed`, `focus`), or nothing when that state draws the same as the rest. `place` keeps them on the node as `n.looks`, as the views' `hovers` does.
- **Home draws the state a node is in:** pressed while the pointer is down on it (until it is lifted, leaves or is cancelled), hover while the pointer is over it, focus while it has keyboard focus, its rest otherwise, swapping only that node's items. Pressed beats hover, hover beats focus. Removed: Home's hover-only swap (`hovItems`).

With Budget's pack as it is, Home and every screen look the same at rest, and a press shows the hover drawing until it is lifted. Budget's views (Calendar, Board, Plan) still swap hover only; their pressed comes next. Tests in exp7-jrender: the new `states` layer (`tests/layer5-states.mjs`, in the default run) checks Home and every screen case on both fixtures at 390 and 1024: every node with art rests in a state its component declares, every live state that differs is drawn ahead and is the rest's items with that state's drawing in place, a pressed alias draws as hover, and a node put at a rest its component lacks fails with `COMPONENT_INVALID`. On Home it goes through enter, down, up, leave, down and cancel, then moves the focus, checking the state and the drawn items at each step and that only that node is redrawn; and it swaps in a pack drawing its own pressed and checks the press draws it. Layer 1 checks the live states, Home's state drawing and that the hover-only swap is gone. The art layer still finds every node at rest as before.

Checked in Chrome on Matthew's Mac (2026-11-15, the lean by its sha at fa603f3, a blank Budget at 390 wide, made-up data only): on Home, today's day rested `selected`, the pointer over it drew its hover and moving off brought back its rest; Add to today drew its hover under the pointer, its pressed drawing (the hover wash, as the pack writes it) while held, and its rest after a cancel; a real tap opened Add an item and then Activity or cost. On the form, Does not repeat rested `selected`; a touch press on Every 14 days drew pressed and a cancel its rest; the time typed as 0930 and kept with Enter reopened its picker with 09 and 30 resting `selected`. No failure was recorded and Budget made no page input. Not reached in the browser: an Accept band at rest `disabled` and keyboard focus (both in the tests). The test's storage was cleared after.

*1.8.91: pressed in the Calendar, Board and Plan views.* 1.8.90 left the views (Budget's and the platform look's) swapping hover only: JRViews kept each node's hover items beside it (`hovItems`), and a press recoloured the node in code (the state layer's wash over its fill and pressed ring on its border). Now:

- **Every view component declares `pressed`**, and both view packs draw it: `exp7-views` and the view pieces of `budget-journal` write `pressed` as an alias of hover where a piece draws a hover, and of idle where it doesn't (the art compiler takes no alias of an alias). `tools/art/gen-views.mjs` writes the same. So every view node that hovers presses as it hovers, and a pack that draws its own pressed is drawn with no code change.
- **JRViews draws the state a node is in from its looks**, as Home does: pressed while the pointer is down on it (until it is lifted, leaves, is cancelled or starts a drag), hover while the pointer is over it, its rest otherwise, redrawing only that node (`setDown`, `artState`, `itemsOf`). The views' `hovers` and the chrome keep only `n.looks` (and the chrome's `n.pose`).
- **The runtime's state layer only moves a design node** (its scale and lift); it recolours only page elements (`n.el`). The chrome's own pressed drawing is the wash over its fill and the pressed ring on its edge, so the TopBar and Apps picker press as before.
- **Removed:** JRViews' hover-only swap (`hovItems`), `Exp7Art.hover`, and the chrome's `base`, `hov`, `press`, `uxBorderAt` and `baseBorder` on its nodes.

At rest every view, the chrome and Home look as before, and a press on a view node shows its hover drawing (before, the press showed hover with no change). Tests in exp7-jrender: the views layer drives a view node in each look through enter, down, up, leave, enter, down and cancel and checks the state and the drawn items at each step, and checks every view node that hovers has a pressed look that matches it; the chrome layer checks the Apps card's pressed look is the wash and ring and that no chrome node keeps the old colours; Layer 1 checks the hover-only swap, `Exp7Art.hover` and the press colours are gone, JRViews has `setDown`, `artState` and `itemsOf`, and every view component declares pressed. The art, views and journal layers now read a node's hover from `n.looks.hover`.

Checked in Chrome on Matthew's Mac (2026-11-15, the lean by its sha at f289965, a blank Budget at 390 wide, made-up data only): on Budget's Calendar, a day drew its hover under the pointer, its pressed look (the hover drawing, as the pack writes it) while held, and its rest after a cancel; Monthly expenses opened by a real tap, and its month band did the same; the TopBar's back and the Apps picker's Exp7 card drew hover, pressed and rest, and a real tap on the card opened the Exp7 demo. In the demo's Calendar, Board and Plan tabs (the platform look), a month arrow, the board's Sort and a plan step each drew hover, pressed and rest the same way. Each pressed look matched its hover look, and no failure was recorded. Not reached in the browser: a Budget plan step (a blank Budget has none; the tests cover it). The test's storage was cleared after.

*1.8.92: Budget's own code stops swallowing errors.* Removing Budget's fallbacks starts here. On main at 1.8.91 Budget's scripts still held try sites that hid a fault and literal `||` defaults: `journal-views` 14 try sites and 208 defaults, `budget-flows` 4 and 187, `budget-rules` none and 10, and `views-host` 24 and 338 (platform and Budget code mixed). Most of them guard the shape of saved records, so they wait on how a record missing a field is handled (asked of Matthew on 2026-11-15). The ones that guard nothing saved go now:

- **`budget-flows` has no try or catch left.** A recording keeps the plan before it as a copy (`clone`), not as text it parses back in a try and drops if the parse fails. `refreshAll` no longer hides a redraw that fails after a save, and `dayLabel` no longer catches the date formatter.
- **`journal-views` lets these fail:** `model` sets and restores the views' options without a try, `maxTexPx` reads the device's own `maxTextureDimension2D` (no guessed 8192; Budget mounts only with the shared GPUContext), `cssDpr` has no try, preparing a plan switch (`BF.acceptChoice`) is no longer turned into a note on a fault, a switch whose save throws tells the person it was not saved and still fails, and the plan-step scroll calls `scrollTo` directly.

Nothing changes on screen. Left for the next releases: the 8 try sites in `journal-views` that read saved records (the journal's calendar, an entry on a day, a proposal's requirements and selection, the atlas kept for the page), and the literal defaults in `budget-rules`, `budget-flows`, `journal-views` and `views-host`'s Budget code. Each script gets Layer 1's no-default lint as it is cleared. Tests in exp7-jrender: Layer 1 checks `budget-flows` has no try, catch or throw, keeps the plan before a recording as a copy, that `model`, `maxTexPx` and `cssDpr` have no try or guessed limit, that preparing and saving a switch hide nothing and that `journal-views` has no more than the 8 try sites that read saved records.

Checked in Chrome on Matthew's Mac (2026-11-16, the lean by its sha at 0ff02e4, a blank Budget at 390 wide, made-up data only): Budget's Home drew on the GPU at the device's own texture limit; Add to today showed the day as Monday, November 16; a made-up item was added and saved, and Today's schedule redrew with it; recording it as planned saved and redrew. No failure was recorded and no page error was thrown. Not reached in the browser: a plan switch and the before and after comparison (a blank Budget has neither; the tests cover them). The test's storage was cleared after.

*1.8.93: budget-rules leaves out what a record is missing.* Matthew settled how Budget treats a saved record that is missing a field (2026-11-16): the field stays missing, nothing fills it in, no error is raised, and the part that needs it is left out. He stated the rule behind it the same day, in his words: "if there is a fail point that fail point will fail, the rest will carry on as if that fail point never existed", as in Verse, where a failure is handled in its context or not at all. `budget-rules` is the first script cleared this way:

- **A deduction with no name, kind or amount is left out** of take-home: not a line and not counted. It was named "Deduction N", counted as fixed when it had no kind, and flagged for its amount. The same holds while pay is being filled in: a deduction counts once it has a name. A deduction amount that is there but wrong is still reported.
- **A schedule with no date or no repeat, or missing what its repeat needs** (the days for `every`, the days of the month for `monthdays`, the dates for `dates`), **has no label** (`repeatLabel` returns `null`), and Budget shows none where it would have read "not scheduled", "once", "every day" or "each month". An unknown repeat has no label either.
- **A missing number is not 0:** `r2` no longer rounds a missing number to 0, `debtBalanceOn` no longer gives a debt with no balance a balance of 0 (Budget's summary already leaves such a debt out), and `takeHome` no longer gives pay with no gross a gross of 0. `pdate`, `lastDay`, `monthDayList`, `isCashAsset` and `isOwnedAsset` check what they are given instead of filling it in; what they return is unchanged.

`budget-rules` has no `||` defaults, and Layer 1's lint covers it. `money` still shows a dash for a missing amount; its callers are in `budget-flows`, which is next.

By the same rule, two things 1.8.92 did stopped more than the part that failed, and are fixed here: `refreshAll` redrew every view and then Home in one go, so one view's redraw failing stopped the rest; now each redraw is its own fail point. And the journal's `model` swapped the view's own options for its own while it built, so a model that failed left the view with the wrong options; now it passes its options to `buildModel` as an argument.

Tests in exp7-jrender: Layer 1 lints `budget-rules`, checks the rules leave out a deduction or label missing a field, still report a value that is wrong, and read a complete schedule as before, and checks each redraw after a save is its own fail point and that `model` leaves the view's options alone.

Checked in Chrome on Matthew's Mac (2026-11-16, the lean by its sha at b45951c, a blank Budget at 390 wide, made-up data only): Home loaded; on Add pay a gross of 1,000 with a 10% deduction showed take-home 900.00, and in the page a deduction with no name left take-home at 1,000. No failure was recorded and no page error was thrown. The pay was not saved. The test's storage was cleared after.

*1.8.94: every part of an app fails alone, by strict fail and carry on.* Matthew answered "Yes, fail alone" when asked whether one bad part of Budget should stop it opening (2026-11-16), and then extended it to art and the atlas the same day: "Strict fail and carry on, if a pice of art is missing or the atlas, it'll carry on with the rest of the art / atlas and still work." Rule 1 now spells out [strict fail and carry on](#strict-fail-and-carry-on). In 1.8.88 any single bad part kept all of Budget closed. Now:

- **Opening an app** (`design-app`, `Exp7Apps.open`): only a definition that is not there, or not in the shape of its four parts, keeps the app closed, since there is nothing to open. Each token set, the pack, the blank atlas check, each route, alias, screen component and layout is checked in its own failure context (`app.open:<app>:<part>`). One that fails is recorded and left out, and the app opens with the rest. What reads a part that was left out fails then, by itself: `Exp7Apps.tokens(app, group)` fails with `TOKEN_MISSING` (Home, the screens, the views and the journal's fonts now read their token sets through it), and `route` with `APP_INVALID`.
- **Art** (`design-art`): `load` checks each piece alone (`art.load:<pack>:<i>`), so a bad piece, or a second piece for a slot, is left out and the pack loads with the rest. `assign` checks each slot, variant and state alone (`art.assign:<app>:<component>/<slot>:<variant>:<state>`) and assigns the pack with what it has. `draw` is its own failure context (`art.draw:<app>:<component>/<slot>`): a slot whose art fails draws nothing, and its node and its screen carry on without it. That covers every draw: Home, the screens, the Calendar, Board and Plan views (whose shadow nodes are made only when their art is there) and the top bar and Apps picker, and a node resting in a state its component does not declare, or an avatar mode its art does not draw, is left undrawn the same way. With no pack at all, Budget opens and every slot fails alone. An override is one piece, so an override that fails its check still leaves the art that was there.
- **The atlas** (Budget's `check`): each part is checked alone (`budget.atlas:<part>`: its mark, items, components, type boards, calendar, plan and each type board), recorded when it is missing, and Budget carries on with the rest.

- **Loading saved data** (Budget's `load`): Matthew answered "Yes, stop both" (2026-11-16). Load no longer rebuilds a missing type board, puts entries back on the plan, the calendar or their boards, marks the atlas as Budget's, or moves picks saved before 1.8.57 to the new selection model. A part that is missing stays missing and is left out, and an old pick (an item's preferred choice, `state.pick` or `simPick`) never selects itself in Budget. Load still drops a stale view theme, as Budget's look is its token sets. Atlases saved by 1.8.57 or later already carry their boards, membership and selection model, so nothing changes for them.

The defaults in `budget-flows`, `journal-views` and `views-host`'s Budget code are the next releases. Nothing changes on screen while every part is there.

Tests in exp7-jrender: Layer app checks each part fails alone with its own context and is left out, that only the definition's shape keeps an app closed, that a token set left out fails with `TOKEN_MISSING` when read, and that Budget opened without its screens set draws no Home or screen while its views set still reads; Layer art checks a pack missing a piece is assigned with each gap recorded, a pack with a bad piece loads with the rest, and Home with its chevron piece missing still lays out with only the chevrons left out; Layer views checks a view with no pack lays out with no art, each slot recorded; and the atlas check records each missing part alone.

Checked in Chrome on Matthew's Mac (2026-11-21, the lean by its sha at 579fd58, which matches release.json, a blank Budget at 390 wide, made-up data only): Budget opened from a blank atlas with every part, and Home drew its calendar and Today. A made-up item ("Test lunch", 12.00) was added through Add to today and saved, and Today's schedule redrew with it. Reloaded at 1024 wide, the load path kept the item on Today and the cash note took it in. No failure was recorded and no page error was thrown at any step. The test's storage was cleared after.

*1.8.95: budget-flows invents no values.* By the same rule as 1.8.93 (Matthew, 2026-11-16: "when saved budget data is missing a field that field will remain missing fail with no error", and "Leave it out"), `budget-flows` no longer puts a made-up value in for one that is missing. Each place it did:

- **The calendar and plan ids.** A missing `meta.calId` was read as `budget` and a missing `meta.planId` as `reqs`. Now a missing id stays missing: nothing is added to or read from a calendar or plan that isn't named, and the rest of the save goes ahead (new pay, a debt's payments, a requirement and Add to today still go on their boards). Atlases made by Budget carry both ids, so nothing changes for them.
- **Copied values.** A new alternative or category copies its type and flow from the item it stands for, and a requirement its category from the item that needs it; one that is missing stays missing (they were `expense`, `out` and `Requirement`). A copied requirement keeps its date when its repeat or step is missing (it moved to the new start as if once, or every 1 day). Repeat like another item copies its repeat only when there is one (it was `once`). An edited pay keeps its own category, and a missing one stays missing (it became `Pay`).
- **Labels.** A proposal whose current choice has no name reads "switches to …" and leaves the name out of its count, and a category with nothing in use leaves out "in use" (they read a dash or "the current choice"). A requirement's hint is left out when the item it is for has no name (it read "this"). The month column of the plan before and after names its month every time, as "This month" was wrong for another month; the comparison's title and Close are left out when the caller gives none.
- **Numbers.** A charge that is not a number is left out of a month's sum (it counted as 0), and the day risk notes are left out when a threshold is missing (it was 500, 1,500 or 3 days; the caller still gives them, so nothing changes on screen).
- **Choices.** Recording what happened needs an outcome picked (a saved record with none no longer reads as Happened as planned), a repeat must be picked for a new item or alternative, and a write without its op is left out of a copy while the rest apply.

A form's starting values are now set where the form opens, not filled in where a field is read: a new pay's category is `Pay`, a new record's outcome is Happened as planned, the Calendar's Add item starts at only the selected days and Add to today at Does not repeat and every 14 days. Clearing the days field no longer puts 14 back. Nothing changes on screen while every field is there.

Left for 1.8.98: the `|| ''`, `|| null` and `|| 0` reads of form fields and counters and the `{}` and `[]` guards, after which Layer 1 lints the whole of `budget-flows` as it does `budget-rules`.

Tests in exp7-jrender: Layer 1 checks `budget-flows` has no `||` default that puts in a name, id, repeat, category, outcome, label or number, no `budget` or `reqs` id, and no charge counted as 0, that a repeat not picked gives no repeat values and a picked one still does, that a write without its op is left out while the rest apply, that the day risk notes are left out without their thresholds, and that the Calendar's Add item opens at only the selected days.

Checked in Chrome on Matthew's Mac (2026-11-21, the lean by its sha at 8b479c3, which matches release.json, a blank Budget at 390 wide, made-up data only): Home drew its calendar and the day risk notes. Add to today's activity form opened at Does not repeat with every 14 days ready; a made-up item ("Test lunch", 12.00, every 14 days) was saved and Today showed it as Every 14 days. In the page, a repeat not picked gave no repeat values and the day risk notes without thresholds were left out. Reloaded at 1024 wide, Today kept the item and the cash note took it in. No failure was recorded and no page error was thrown at any step. The test's storage was cleared after.

*1.8.98: budget-flows has no `||` defaults.* The last 173 in `budget-flows` were guards: `|| {}` and `|| []` so a missing record or list could be read, `|| ''` for an empty field, `|| null` for none, and `|| 0` for counts. None of them made a value up, but each hid that something was missing behind a throwaway stand-in. Now the script reads what may be missing through four named readers: `rd` (a record), `ls` (a list), `str` (a field's text) and `opt` (one thing or none). A record or list that is not there reads as nothing, as before, so the part that needs it is left out; the nothing is frozen, so a write into it fails first instead of landing in a copy that is thrown away. A list or record the script collects into is started explicitly (`by[d] ? by[d] : (by[d] = [])`, `if (!p.reviews) p.reviews = {}`), the deduction count is the form's own (set when it opens), a copy's revision count starts at 1, and a time typed without minutes is on the hour. Nothing changes on screen.

Layer 1 now lints the whole of `budget-flows` as it does `budget-rules`. Next is `journal-views`, then `views-host`'s Budget code, where the day risk thresholds still have defaults (`budgetRiskHT`).

Tests in exp7-jrender: Layer 1 checks `budget-flows` has no `||` defaults, reads a missing record or list as a frozen nothing, starts each list it collects into explicitly, passes over a missing item or one with no values, and starts a copy's revision count at 1.

Checked in Chrome on Matthew's Mac with made-up data, on top of the circuit language (1.8.97): the lean fetched at this release's commit matched `release.json` and loaded `Exp7Lang`, a cash item added from Today at 390 wide (42.50) showed on Cash and owned items and moved the day risk note, and after a reload at 1024 wide it was still there. No errors and no failures were recorded, and the test data was cleared.

*1.8.99: journal-views makes up no values.* Budget's screens (the `journal-views` script) filled in what a form or a saved item left out: a save with no name became "New item", "Pay", "Creditor", "Debt", "Scheduled item", "New alternative" or "New requirement"; a blank amount saved as 0; a debt with no term or spacing got 36 payments every 30 days; an item opened for editing with no repeat count showed every 14 days; a missing repeat read as once; a pay with failed deductions saved its gross; with no calendar named in the atlas, new items went on `budget` or the first calendar found; an amount that was not a number showed 0.00. Eight `try` blocks still hid a bad saved record or a failed read.

Now a save with a missing name or amount stops and asks for it in the form's own status line ("Enter a name.", "Enter an amount of 0 or more.", "Enter who pays.", "Enter who the debt is owed to.", "Enter what the debt is for.", "Enter how many payments are left.", "Enter how many days apart the payments are.", "Enter how many days apart it repeats.", "Pick what happened."), and a debt or pay whose schedule or deductions do not work says why. The ask shows as a note under the form's title and is read out, and it goes at the next step. A repeat of every N days without N is left out; an item saved with no repeat shows none picked; the calendar is the one the atlas names (`meta.calId`) and has, and with none, nothing is put on a calendar; a board is the one `meta.boardIds` names, or none; an amount that is not a number shows nothing. A requirement with no date or amount is left out. The eight `try` blocks are gone, so a bad record fails first. The unused `payDraft` is gone. Two things change on screen: Add pay with no gross pay entered shows no take-home pay, where it showed 0.00, and a form's ask shows under its title. A form's visible starting values (every 14 days on a new pay, 36 payments every 30 days on a new debt, Planned on a day record) are still there: they are on screen to change, not filled in after.

Left for later: the screen-size reads (`clientWidth`, `devicePixelRatio`, scroll) that use a stand-in when the browser gives none, the starting route, `budgetAmount(it) || 0` (it lives in `views-host`), and the `{}`, `[]` and `''` guards, which go the same way as `budget-flows`' did in 1.8.98.

Tests in exp7-jrender: Layer 1 checks `journal-views` has no `try`, no made-up name and no made-up count, that a save asks for a missing name or amount, that an amount that is not a number shows nothing, that a repeat with no count is left out while every 7 days is kept, that no repeat picked reads as once, that there is no calendar id unless the atlas names one it has, that a copy's revision count starts at 1, and that `payDraft` is gone. Layer 2 checks Add pay with no gross pay shows no take-home pay, that a save's ask shows under the form's title on that form only and lays out, and the art layer allows that one node to be gone from Add pay while every other node draws as in 1.8.79.

Checked in Chrome on Matthew's Mac (2026-11-21, made-up data only): the lean fetched at this release's commit matched `release.json`. At 390 wide, saving a blank Add pay showed "Enter an amount of 0 or more." under its title, and its Take-home pay showed no amount. Opening the cash form cleared the ask; saving it with an amount (25.00) and no name showed "Enter a name.", and once a name was typed ("Test wallet") the ask went and the save went through to Cash and owned items. Reloaded at 1024 wide, Today kept the item and the cash note took it in. No failure was recorded and no page error was thrown at any step. The test's storage was cleared after.

*1.8.100: Budget's part of views-host makes up no values.* The host code that works out Budget's day risk, money figures and selections (the `views-host` script) filled in what an atlas left out: the day risk limits came from built-in defaults ($500, $1,500, $200 and 3 days) that no saved Budget stores; a board, plan or calendar the atlas did not name was looked up as `board_expense`, `board_income`, `board_debt`, `board_asset`, `reqs` or `budget`; an amount or charge that was not a number counted as 0; an item with no amount and no cost had an amount of 0 (`budgetAmount`); a category with no pick and no Best ran on its first available item, and a failed Best was hidden by a `try`; an item of an unknown type went on the expense board; an asset with no kind opened as cash, one with no as-of date opened and saved as of today, and a debt with no purpose took the item's name; the old day colouring below `BudgetFlows.resilience` (never reached) and a `rank()` call that does not exist (its error was hidden by a `try`, so it never ranked) were still there.

Now the day risk limits are only what `meta.riskHT` holds (Matthew, 2026-11-21: "Leave it out"). A new Budget is made with them (hc $500, hm $1,500, big $200, delay 3), and a Budget without them shows no day risk colours, no day risk notes and no colour legend on Home; a way to set them is not built yet. Boards, plan and calendar are only those `meta.boardIds`, `meta.planId` and `meta.calId` name; with none, nothing is read from or put on one. An amount or charge that is not a number moves no money and is left out of the totals, and a ledger row or cash balance with no amount is left out. `budgetAmount` gives no amount (NaN) for an item with neither. In Budget a category with no pick and no Best has no selected item, and Best is not wrapped in a `try`. An item whose type is not one of the four goes on no board. An existing asset, debt or pay opens with its own kind, as-of date, start date and purpose, or none; saving an asset with no kind asks "Choose cash balance or owned item.", and one with no as-of date saves without one. A new one still starts as cash, as of today, shown in the form. The unreached colouring and the `rank()` call are gone from Budget's path. Nothing changes on screen for a Budget made from now on; a Budget saved before this release shows no day risk until it has the limits.

Left for later: a screen to set the four day risk limits, the money dash (`budgetMoney` and `money` show "—" for no number, a marker of nothing rather than a made-up value), and the `{}`, `[]` and `''` guards.

Tests in exp7-jrender: Layer 1 checks the built-in limits are gone and planRisk reads `meta.riskHT`, a new Budget gets the four limits, a Budget without them has no day risk and one with them has it, day risk reads only the boards, plan and calendar meta names and counts no amount that is not a number, it always goes through `resilience`, `budgetFigures` and the old add form use only the boards meta names, `budgetAmount` gives no amount for an item with neither amount nor cost, journal rows and balances with no amount are left out, a Budget category with no pick and no Best has no selected item, an unknown type has no board, membership ops use only the calendar and plan meta names, `budget-flows` puts a new item only on the board meta names, and an existing asset, debt or pay opens with its own values. Layer 2 checks Home with no day risk lays out with no legend and no reason, and that Home with day risk keeps its legend. The test Budget (fixtures) is now saved with the four limits, as a Budget made from this release is, so the glyph, art and parity checks still draw Home exactly as 1.8.99 and 1.8.79 did.

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

### Decided by Matthew, 2026-11-15

| Question | His answer | Where it's written in |
|---|---|---|
| The demo's scope | "Move it to canvas" | 10, part 4a |
| Paths: the whole atlas or a part | "Keep it whole" | 10, part 4c |
| The views' 13 px text and 30 px buttons under the phone floors | Keep them: "shrink to fit always applies" | 10, 1.8.87 |
| The views' measure and draw font mismatch | "2 fix", as its own release | 10, 1.8.87 |
| The views' marks (arrows, ticks, triangles, stars, dots) | "Art": every mark is swappable art | 6.2, 10, 1.8.87 |
| The platform look's font: DejaVu Sans or Source Sans 3 | "DejaVu Sans is fine/ no extra work needed there" | 10, 1.8.87 |

### Decided by Matthew, 2026-11-16

| Question | His answer | Where it's written in |
|---|---|---|
| A saved record missing a field | It stays missing, with no error, and the part that needs it is left out ("Leave it out") | 10, 1.8.93 |
| The rule behind it | "if there is a fail point that fail point will fail, the rest will carry on as if that fail point never existed" | Rule 1, strict fail and carry on |
| One bad part of an app when it opens | "Yes, fail alone" | 10, 1.8.94 |
| Missing art or atlas | "Strict fail and carry on": it carries on with the rest of the art and atlas and still works | Rule 1, 10, 1.8.94 |
| Loading saved data: rebuilding missing boards, moving pre-1.8.57 picks | "Yes, stop both": a missing board and old picks are left out | 10, 1.8.94 |

## 12. Needs Ash

Questions for the renderer side, to settle in botnotes.md, not decisions for Matthew:

- Confirm view-store records (JRDL v1) as the compiled art format, and JRB as legacy only. 1.8.80 compiles art to JRViews items in an `exp7-art-pack/1` block instead (7.3); moving to view-store records later changes the compiler and `design-art`, not the components or the SVG sources.
- The SVG compiler for the view store (`tools/build_store.mjs` in the overlay packet) isn't in any repo. It, or a replacement, is needed in exp7-jrender for the art validator.
- A GPU-side node transform, so looping slot animations don't re-tessellate (the overlay note measured about 1.3 ms per frame for one overlay).
- Whether `core.wrap` can return each line's baseline so text placement uses no arithmetic outside JRender.
