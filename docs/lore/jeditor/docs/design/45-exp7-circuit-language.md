# 45 · Exp7 circuit language: node graph vs a Verse-like text language

> **Status: PROPOSED v0 (2026-11-02, ADR 0110).** Matthew delegated the syntax choice ("doesn't care about the Verse-like syntax"),
> so a concrete v0 is chosen in §4A below. It is a proposal and is not wired into the runtime. The parser, printer and lowerings are in
> `atlas/circuit_lang.js` (test `atlas/test/circuit_lang_test.js`, 12/12). §4 (the old sketch) is kept for history only.
>
> *Previous status:* DIRECTION AGREED. Matthew agreed to the direction (yes, 2026-11-02); syntax is still illustrative and undecided; the word circuit stays until the language is chosen (ADR 0106). Nothing else here is decided.
>
> *Original status:* PROPOSAL, Matthew to decide. Written Nov 2, 2026 after Matthew: *"'nodes' is like a
> blueprint esc thing, but we probably should move towards a Verse like thing, as innovation by Epic has shown that
> 'blueprints' can be outdated."* Every syntax detail below is **ILLUSTRATIVE**. Statements about Verse are limited to its
> well-known public features; where unsure it says so. Exp6 `JBlueprint` / jmethods / jfactor blueprints keep the word
> **blueprint** in every option here. "Atlas" below means the Exp7 data container (formerly “world”, renamed in ADR 0106).

## 1. Today: the node "circuit"

Spec 42 §3.5: circuits are a node graph (ports, wires) that turn view events into proposals and run once per pass; loops are
deferred to the next pass (rule 10). The graph is stored as JSON and edited visually.

## 2. Why node graphs / "blueprints" age badly

| Problem | Effect |
|---|---|
| **Diff / merge** | JSON node positions and wire ids produce noisy diffs; two edits to one graph rarely merge cleanly. |
| **Review** | A reviewer cannot read intent from a diff; needs the editor open. |
| **AI authorship** | Language models write and refactor text well; generating valid wire graphs with layout is brittle. |
| **Refactoring** | No rename-symbol, find-usages, extract-function; copy-paste of subgraphs duplicates logic. |
| **Scale** | Large graphs become "spaghetti"; a few dozen lines of text replace screens of nodes. |
| **Tooling** | Text gets linters, type checkers, tests, search, version control for free. |

Epic's own direction (public): Unreal's visual Blueprints remain, but for UEFN Epic introduced **Verse**, a text language.

## 3. Verse ideas (public, well known) and the Exp7 need they map to

| Verse idea | What it is (as publicly described) | Exp7 mapping |
|---|---|---|
| Text-first, statically typed | code is the source of truth; types checked | circuits as text; item/joy/path types checked against the atlas shape (doc 44 §0) |
| **Failable expressions** (`[]` calls, `if (x := ...)`) | an expression can *fail*; failure is control flow, not an exception | a requirement **passes or fails**; jreq "B ran all parts and ≥1 passed" (rule 9) is a failure-driven expression |
| **Speculative execution / rollback** | effects inside a failure context are rolled back if it fails | a proposal is **all-or-nothing**; a rejected batch leaves the atlas byte-identical (doc 44, rule 14) |
| **Choice** (`or`-like failure fallthrough) | try alternatives until one succeeds | native **one-of** alternatives (pref, unavail, pick) |
| Effect specifiers (`<transacts>`, `<decides>`, `<suspends>`) | functions declare what they may do | mark circuits as pure / proposing / async; views may only call pure ones (rule: views never write directly) |
| Structured concurrency (`sync`, `race`, `rush`, `branch`, `spawn`) | async work with clear lifetimes | async **proposals against revisions**; outside planners; "race" = first accepted alternative (fit uncertain) |
| Live / mutable vars (`var`, `set`) | explicit mutation | the only writes are `set` / `delta` / `add` / `remove` / `ref` ops in a proposal |

Unsure: exact current Verse semantics of rollback scope and of `rush`/`branch` lifetimes; treat the mapping as inspiration,
not compatibility. Exp7 additionally needs **deterministic evaluation per pass** and **no cycles within a pass** (re-entry
deferred), which Verse does not impose in that form.

## 4A. v0 syntax (PROPOSED, ADR 0110)

Design rule: **the simplest text that maps 1:1 onto what already exists.** There are two statement kinds and nothing else.
- `score`: a pure numeric expression. It lowers to an Exp6-compatible `JBlueprint` graph using stage 1 nodes only, and
  `builder/blueprint/jbp.js compile()` accepts it unchanged.
- `on`: an event rule. It lowers to an Exp7 proposal, a list of atlas ops (`set`/`delta`/`add`/`remove`/`ref`, doc 44, ADR 0108).

There are no loops, no user functions, no variables and no indentation semantics. Verse ideas kept only as semantics:
- *failure* becomes `when` (false means no proposal);
- *rollback* becomes the all-or-nothing proposal;
- *effects* are split by statement kind (`score` is pure, `on` proposes).

### Grammar (EBNF; `#` starts a comment; newlines end statements)
```
file    = { stmt NL } ;
stmt    = score | rule ;
score   = "score" NAME "=" expr ;
rule    = "on" NAME [ "(" NAME { "," NAME } ")" ] [ "when" expr ] ":" op { (";" | NL) op } ;
op      = ("set" | "ref") path "=" expr
        | "delta" path ("+=" | "-=") expr
        | ("add" | "remove") path expr ;
path    = seg { "/" seg } ;            seg = NAME | NUMBER | "{" NAME "}" ;   (* {p} = rule parameter *)
expr    = or ;  or = and { "or" and } ;  and = cmp { "and" cmp } ;
cmp     = sum [ ("=="|"!="|"<"|"<="|">"|">=") sum ] ;  sum = prod { ("+"|"-") prod } ;  prod = unary { ("*"|"/") unary } ;
unary   = [ "-" | "not" ] atom ;
atom    = NUMBER | STRING | "true" | "false" | NAME | "@" path | call | "(" expr ")" ;
call    = FN "(" [ expr { "," expr } ] ")" ;
FN      = value | factor | joy | jmax | boardmax | min | max | clamp01 | jfactor      (score)
        | min | max | clamp01 | get                                              (rule) ;
```

### Mapping
| Text | Lowers to |
|---|---|
| `value(f)` / `factor(f)` / `boardmax(f)` | `item.value` / `item.factor` / `data.boardMax` node `{field:f}` |
| `joy(j)` / `jmax(j)` | `joy.value` / `joy.jmax` `{joy:j}` |
| `+ - * /`, `min`, `max`, `clamp01`, unary `-` | `op.add/sub/mul/div/min/max/clamp01` (`-x` is `0 - x`) |
| `jfactor(x, y, xMax, yMax)` | `jfactor.call` (Exp6 jmethod 2) |
| the whole score | one `score.out` sink |
| `set p = e` / `ref p = e` | `{op:'set'|'ref', path, value}` |
| `delta p += e` / `-= e` | `{op:'delta', path, by:±e}` (numeric only, rule 10) |
| `add p e` / `remove p e` | list member ops (ADR 0108 no-op rules) |
| `@a/b/c` | read of the pass snapshot (rules only; refused inside `score`) |
| `when e` false | no proposal |

### Worked examples (all in the test)
```
score car_fit = jfactor(value(cost), value(minutes), boardmax(cost), boardmax(minutes)) * clamp01(joy(comfort) / jmax(comfort))
score net = (value(benefit) - value(cost)) * 2 + -1

on paid(bill, amount) when amount > 0:
  delta joys/cash/value -= amount
  add items/{bill}/notes "paid"

on pick(alt, opt): ref alts/{alt}/pick = opt; set alts/{alt}/opts/{opt}/unavail = false

on tick when @atlas/clock/on and not @atlas/clock/paused:
  delta joys/{j}/value += 1
```
`paid(bill:'i7', amount:12)` gives `[{op:'delta',path:'joys/cash/value',by:-12},{op:'add',path:'items/i7/notes',value:'paid'}]`.

### Defaults chosen (Matthew delegated these)
1. Surface syntax plus a data form (option D). The text is the source of truth. Stored lowered forms (graph and ops) are caches.
2. Execution: the engine pass (same snapshot, deferred re-entry, rule 10). Outside processes run the same lowering through the CLI and core.
3. Exp6 blueprints: `score` *compiles to* a JBlueprint. They are neither wrapped nor replaced, and the word "blueprint" stays for Exp6.
4. Keep the word **circuit** for a file of statements. A statement is a *score* or a *rule*.
5. From Verse, only `when` (failure) and all-or-nothing proposals. No `race`/`spawn` in v0.
6. Typing: names (fields, joys) are checked at load by `jbp.compile` for scores and by op validation for rules. There are no static types yet.
7. File extension `.circ`, UTF-8, `#` comments. The printer is canonical (minimal parentheses, one op per line), so diffs stay small.

## 4. Sketch (historical, superseded by §4A)

**4.1 Item with jreq + alternatives (pref / unavail)**
```
item car_plan:
  jreq = license               # live link, rule 1
  one_of options:              # native one-of, rule 4
    option lease  key "A"
    option used   key "B"
    option bike   key "AL"
  pref    = used               # alts/pref  (ref)
  unavail = [bike]             # alts/unavail
```

**4.2 Requirement path query (failable)**
```
path_to(goal) <decides>:
  for (step in goal.requires):
    step.passed[]              # fails the whole query if a step cannot pass
  goal.pick[]                  # fails if no option available
```

**4.3 Joy delta rule (proposes, numeric only)**
```
on paid(bill) <proposes>:
  delta joys.cash.value -= bill.amount     # rule 10 of 3.7: numeric joys only; stale-free
```

**4.4 Ticks**
```
on tick <proposes> when atlas.clock.on:
  delta joys[atlas.clock.joy].value += 1
```

**4.5 View binding to the standard dependency view**
```
view deps = exp7_req_path(root = selection.item, show = [landed, chosen, blocked])   # read-only, pure
```

## 5. Visual view as a projection

The text is the **source of truth**. A node/graph view is generated **read-only** from the text (layout computed, not
stored), with click-to-source navigation and inline values from the last pass. Edits happen in text (or through
structured edit commands that rewrite text). This keeps diffs, review and AI authorship on text, while people still see a graph.

## 6. Options for Matthew

| Option | Source of truth | Notes |
|---|---|---|
| A. Keep node circuits | JSON graph | least work; ages as §2 |
| B. **Declarative data form** | JSON/JRB rules (no surface syntax) | diffable, AI-friendly, no parser; weaker readability |
| C. **Small text language** (Verse-like) | `.exp7` text, compiled to B | best for review/AI/refactor; needs parser, types, errors |
| D. C + read-only graph projection | text; graph generated | recommended direction to evaluate (still a proposal) |

## 7. Open questions for Matthew (answered by default in §4A, ADR 0110)

1. Surface syntax (C/D) or data-only declarative form (B)?
2. Where does it execute: page main thread, worker, the engine pass, or the outside-process host?
3. Interplay with Exp6 jmethods / jfactor blueprints (which stay "blueprint"): call them, wrap them, or replace them over time?
4. Keep the word **circuit**, or rename (e.g. "rule", "script", "flow")?
5. How much of Verse's failure/rollback model to adopt vs Exp7's pass/proposal model?
6. Typing: check against the atlas shape at edit time only, or also at load?
