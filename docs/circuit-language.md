# The Exp7 circuit language

**Status:** built in 1.8.95 (2026-11-21). Language v1, `Exp7Lang` in the lean, `circuit_version() = 1`.

Exp7's own text language for rules over an app's atlas. It is Verse-like: failure is part of the language, as Verse's
`<decides>` is, so strict fail and carry on (Rule 1 of `design-system.md`, Matthew's rule of 2026-11-16) is how every
circuit works, not something each app writes by hand. In Matthew's words: "if there is a fail point that fail point will
fail, the rest will carry on as if that fail point never existed."

It starts from the v0 design in `lore/jeditor/docs/design/45-exp7-circuit-language.md` (ADR 0110) and keeps its `score` and
`on` rules, rebuilt from scratch ("rebuild it entirely", Matthew, 2026-11-16). The Exp7 demo's Circuit tab still runs the v0
parser inside the demo package (`atlas/circuit_lang.js`, global `Exp7Circuit`); moving it, Budget's rules and the node-graph
blueprints onto this language are later steps, decided with Matthew.

## Where it runs

The language is Rust compiled to WebAssembly: parser, checker and evaluator, with no imports. Exp7 requires WebAssembly
and WebGPU, so there is no JavaScript copy of it and nothing stands in when it can't run.

- Source and tests: `exp7-jrender/rust/lang` (`cargo test`), built by `exp7-jrender/rust/tools/build_lang.sh` to
  `rust/web/circuit.wasm` (cargo at opt-level z, then `wasm-opt -Oz`), about 150 KB.
- In the lean: `<script type="text/plain" id="circuit-wasm" data-enc="b91">`, written by
  `exp7-jrender/tools/embed_lang.py`, and the host `<script data-exp7-shared="circuit-lang">`, which defines `Exp7Lang`.
- Tests of the module the lean carries and of the host: `exp7-jrender/tests/layer-lang.mjs` (`node tests/run.mjs lang`).

## A circuit

A circuit is a text file of declarations. Each starts at column 1 with `score`, `fn` or `on`; indented lines and a line
starting with `}` continue the one above. `#` starts a comment.

```
# Budget-like example
fn over(x, limit) <decides> = x > limit
score left(joy) = @joys[joy].value - @joys[joy].spent

on paid(bill, amount) when amount > 0 {
  delta @joys.cash.value -= amount
  add @items[bill].notes "paid"
}
on pick(alt, opt) {
  @alts[alt].opts[opt]
  not @alts[alt].opts[opt].unavail?
  ref @alts[alt].pick = opt
}
on tick when @clock.on?, not @clock.paused? {
  j := @clock.joy
  delta @joys[j].value += 1
}
```

- `score NAME = expr` or `score NAME(params) = expr`: a value read from the atlas. A score can fail.
- `fn NAME(params) = expr`: a pure function, which cannot fail. `fn NAME(params) <decides> = expr`: one that can.
- `on EVENT(params) when cond, cond { ... }`: a rule. When an event fires, every rule for it runs against the same atlas.
- Ops, inside a rule: `set @path = e`, `ref @path = id`, `delta @path += e` (or `-=`), `add @path e`, `remove @path e`.
- `x := e` names a value; `if (conds) { ... } else if (conds) { ... } else { ... }`; `for (x : list, filters) { ... }`
  gives a list of what its body gives for each item whose filters work.
- `@a.b`, `@items[bill]`: the atlas. `.field` and `[index]` read a record or list.
- Built-ins that cannot fail: `min max clamp01 abs floor ceil round len keys sum text`. Built-ins that can:
  `num str list int first last`.

## Failure

**Failable steps.** These fail instead of giving a value:

| Step | Fails with |
|---|---|
| reading an atlas path, a field or an index that isn't there (a JSON `null` counts as not there) | `MISSING` |
| a comparison that is false (`a < b` gives `a` when it holds; one comparison at a time, joined with `and`) | `FALSE` |
| `x?` when `x` is false | `FALSE` |
| `not e` when `e` works | `NOT` |
| dividing by zero | `DIV_ZERO` |
| `num[x]`, `str[x]`, `list[x]`, `int[x]`, `first[l]`, `last[l]` when `x` isn't one | `NOT_NUMBER` ... `EMPTY` |
| calling a `<decides>` function or a score | whatever failed inside it |

A failable call is written with brackets, `over[x, 10]`, and a call that cannot fail with parentheses, `min(a, b)`, as in
Verse; the checker refuses the wrong one (`CALL_BRACKETS`).

**Failure contexts.** A failable step may only be used inside one: a rule's `when` and body, a score's body, a `<decides>`
function's body, an `if (...)` condition, a `for (...)` filter, the operand of `not` and the left side of `or`. This is
checked when the circuit loads, not when it runs. A failure ends the innermost context around it and goes no further:

- `if (c) { ... } else { ... }`: when `c` fails, the next arm runs.
- `a or b`: `a`, or when `a` fails, `b`.
- `for (x : l, filter)`: an item whose filter fails is left out of the list.
- `when`: a rule whose `when` fails is skipped. That is a decision, not a failure, and nothing is recorded.
- a rule's body: the rule proposes nothing, and the other rules carry on.

**Rollback.** What a context wrote is dropped when it fails, as in Verse. Inside a rule, reads see the rule's own earlier
writes; a rule's ops are proposed only when its whole body works. A rule that fails after `set @a = 5` leaves `@a` as it was.

**Faults.** A wrong type (adding text to a number, `delta` on a list) and passing a bound are faults, not decisions. Until
the language has static types, a fault fails the whole rule or score it is in, past any `or` or `if`, and the failure says
"fault". It still fails alone: the other rules carry on.

**Missing stays missing.** Nothing fills in a value that isn't there; there is no default. A rule that needs it fails.

## Loading: each declaration fails alone

When a circuit loads, each declaration is parsed and checked on its own. One that doesn't parse or fails a check is left
out, with its line, column and code, and the rest of the circuit loads:

| Code | Why |
|---|---|
| `PARSE` | it doesn't parse |
| `NAME_TAKEN` | a name declared twice (the first is kept), a built-in's name, a parameter named twice |
| `FAILABLE_OUTSIDE` | a failable step outside a failure context, such as `fn f(x) = @a.b` |
| `OP_OUTSIDE`, `OP_IN_WHEN`, `OP_IN_FILTER` | an op outside a rule's body, or in its `when` or a `for` filter |
| `UNKNOWN_NAME`, `UNKNOWN_FUNCTION`, `NOT_A_FUNCTION`, `ARITY` | a name with no value, a call to nothing, a wrong count of arguments |
| `CALL_BRACKETS` | a failable call written with `( )`, or a pure one with `[ ]` |
| `CALLS_LEFT_OUT` | it calls a declaration that was left out, so it is left out too, found at load |

## Bounds

Bound driven, as the design system is: every evaluation has known limits, and passing one is a `LIMIT` fault for that rule
or score alone.

| Bound | Value |
|---|---|
| steps in one rule or score | 200,000 |
| calls nested | 64 |
| nesting in the text (brackets, blocks) | 64 |
| JSON depth of the atlas and arguments | 256 |
| circuit text | 1 MiB |
| one request (circuit, atlas and arguments) | 64 MiB |
| WebAssembly stack | 8 MiB |

A 20,000-item atlas: a score over all of it takes about 80 ms in Node, a rule on one item about 40 ms, each including
passing the atlas in as JSON.

## Exp7Lang

```js
await Exp7Lang.ready;                    // true, or false when the module did not start (recorded, CIRCUIT_FAILED)
const c = Exp7Lang.load('budget', src);  // a circuit; each bad declaration recorded as CIRCUIT_INVALID and left out
const n = Exp7Lang.fire(c, 'paid', { bill: 'i7', amount: 12 }, atlas, Exp7Lang.apply(atlas)); // { done, skipped, failed }
const v = Exp7Lang.score(c, 'left', { joy: 'fun' }, atlas);  // the value, or Exp7Fail.FAIL
Exp7Lang.check(src);                     // { decls, invalid }, recording nothing
```

- Each rule runs in its own `Exp7Fail` context, named `circuit:NAME:EVENT:LINE`, so a test can force one to fail. A rule
  that works stages its ops; `apply(op)` runs for each only when the rule's context and every context around it succeed.
  Called inside a larger context that then fails, the ops are dropped with it.
- An op is `{ op, path, value }` with `path` as `a/b/c`; `delta` carries the signed amount. `Exp7Lang.apply(atlas)`
  applies ops to a plain JSON atlas. An op that no longer fits when it is applied (an earlier rule's op replaced its place)
  is recorded and left out alone.
- `check`, `load`, `fire` and `score` are failable steps: they return `Exp7Fail.FAIL` when the language can't answer (the
  module did not start, a request over 64 MiB), recorded in the context around the call.
- Failure codes added to `Exp7Fail`: `CIRCUIT_INVALID` (a declaration left out at load) and `CIRCUIT_FAILED` (a rule or
  score that failed, an op left out, the module not running).
- Nothing in the host throws. The one `try` is the WebAssembly boundary: a trap there, which the language's bounds are meant
  to make impossible, fails that one call, and a fresh instance serves the calls after it. A page with no `circuit-wasm`
  still loads; only `Exp7Lang` fails.

The circuit's text goes into WebAssembly with every request, so the host keeps no parsed state between calls.

## Checked

Checked in Chrome 157 on Matthew's Mac (2026-11-21, the lean by its sha at ab65d36, which matches release.json, made-up
data only): the platform booted with no failure recorded and no page error, and `Exp7Lang` started (version 1, WebGPU
present). The doc's `paid`, `pick` and `tick` rules did what they say; a bill not in the atlas and an unavailable option
each failed their rule alone with nothing applied; a declaration that didn't parse and the one calling it were left out and
the rest of the circuit worked; a rule fired inside a context that then failed applied nothing. A score over a
20,000-item atlas took 42 ms and a rule on one item 14 ms. The test page's storage was cleared after.
