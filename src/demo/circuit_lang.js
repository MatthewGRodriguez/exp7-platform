/* inlined: atlas/circuit_lang.js */
/* circuit_lang.js — Exp7 circuit language v0 (doc 45 v0, ADR 0110). Parser, canonical printer and two lowerings:
 *   score <name> = <expr>                 -> Exp6-compatible JBlueprint graph {version, nodes, edges} (builder/blueprint/jbp.js)
 *   on <event>[(p, ...)] [when <expr>]:   -> atlas ops [{op, path, value}] (delta value is the signed number, doc 44 §2) (exp7 proposal; set/delta/add/remove/ref only)
 *       <op>; <op> ...
 * Pure, no I/O. Not wired into the runtime (v0 is a proposal). */
(function (root) {
  'use strict';
  var KW = { score: 1, on: 1, when: 1, set: 1, delta: 1, add: 1, remove: 1, ref: 1, and: 1, or: 1, not: 1, true: 1, false: 1 };
  var FN = { min: 2, max: 2, clamp01: 1, jfactor: 4, value: 1, factor: 1, joy: 1, jmax: 1, boardmax: 1, get: 1 };
  function lex(src) {
    var t = [], i = 0, line = 1, m, re = /[ \t]+|#[^\n]*|\n|\d+(?:\.\d+)?|"(?:[^"\\]|\\.)*"|[A-Za-z_][\w]*|\+=|-=|==|!=|<=|>=|[-+*\/(),:;=<>\[\]{}@.]/y;
    while (i < src.length) { re.lastIndex = i; m = re.exec(src); if (!m) throw err('unexpected ' + JSON.stringify(src[i]), line);
      var s = m[0]; i = re.lastIndex;
      if (s === '\n') { t.push({ k: 'nl', line: line }); line++; continue; } if (/^[ \t]|^#/.test(s)) continue;
      t.push({ k: /^\d/.test(s) ? 'num' : s[0] === '"' ? 'str' : /^[A-Za-z_]/.test(s) ? (KW[s] ? 'kw' : 'id') : 'p', v: s, line: line }); }
    t.push({ k: 'nl', line: line }); t.push({ k: 'eof', line: line }); return t; }
  function err(msg, line) { var e = new Error('line ' + line + ': ' + msg); e.line = line; return e; }
  function parse(src) {
    var T = lex(src), p = 0, out = [];
    function pk() { return T[p]; } function nx() { return T[p++]; }
    function is(v) { var x = T[p]; return x.v === v && (x.k === 'p' || x.k === 'kw'); }
    function eat(v) { if (!is(v)) throw err('expected "' + v + '" got ' + (pk().v || pk().k), pk().line); return nx(); }
    function ident() { var x = nx(); if (x.k !== 'id') throw err('expected a name, got ' + (x.v || x.k), x.line); return x.v; }
    function skipNl() { while (pk().k === 'nl') p++; }
    function path() { // seg ( '/' seg )* ; seg = name | number | {param}
      var segs = []; do { if (is('{')) { nx(); segs.push({ param: ident() }); eat('}'); }
        else { var x = nx(); if (x.k !== 'id' && x.k !== 'num' && x.k !== 'kw') throw err('bad path segment ' + (x.v || x.k), x.line); segs.push(x.v); } } while (is('/') && nx());
      return segs; }
    var PREC = [['or'], ['and'], ['==', '!=', '<', '<=', '>', '>='], ['+', '-'], ['*', '/']];
    function expr(l) { l = l || 0; if (l === PREC.length) return unary(); var a = expr(l + 1);
      while (PREC[l].indexOf(pk().v) >= 0 && (pk().k === 'p' || pk().k === 'kw')) { var op = nx().v; a = { bin: op, a: a, b: expr(l + 1) }; } return a; }
    function unary() { if (is('-')) { nx(); return { neg: unary() }; } if (is('not')) { nx(); return { not: unary() }; } return atom(); }
    function atom() { var x = pk();
      if (x.k === 'num') { nx(); return { num: +x.v }; } if (x.k === 'str') { nx(); return { str: JSON.parse(x.v) }; }
      if (is('true') || is('false')) { nx(); return { bool: x.v === 'true' }; }
      if (is('(')) { nx(); var e = expr(); eat(')'); return e; }
      if (is('@')) { nx(); return { at: path() } }                         // @joys/i1/value : read atlas path
      if (x.k === 'id') { nx(); if (is('(')) { nx(); var args = []; if (!is(')')) do { args.push(expr()); } while (is(',') && nx()); eat(')');
          if (!(x.v in FN)) throw err('unknown function ' + x.v, x.line); if (FN[x.v] !== args.length) throw err(x.v + ' takes ' + FN[x.v] + ' argument(s)', x.line);
          return { call: x.v, args: args }; } return { name: x.v }; }
      throw err('unexpected ' + (x.v || x.k), x.line); }
    function op() { var x = nx(); var o = { op: x.v };
      if (x.v === 'set' || x.v === 'ref') { o.path = path(); eat('='); o.value = expr(); }
      else if (x.v === 'delta') { o.path = path(); var s = nx(); if (s.v !== '+=' && s.v !== '-=') throw err('delta needs += or -=', s.line); o.sign = s.v[0]; o.value = expr(); }
      else if (x.v === 'add' || x.v === 'remove') { o.path = path(); o.value = expr(); }
      else throw err('expected an op (set, delta, add, remove, ref), got ' + (x.v || x.k), x.line); return o; }
    skipNl();
    while (pk().k !== 'eof') { var x = pk();
      if (is('score')) { nx(); var name = ident(); eat('='); out.push({ score: name, expr: expr(), line: x.line }); }
      else if (is('on')) { nx(); var r = { on: ident(), params: [], when: null, ops: [], line: x.line };
        if (is('(')) { nx(); if (!is(')')) do { r.params.push(ident()); } while (is(',') && nx()); eat(')'); }
        if (is('when')) { nx(); r.when = expr(); } eat(':'); skipNl();
        do { skipNl(); r.ops.push(op()); } while ((is(';') && nx()) || (pk().k === 'nl' && T[p + 1] && T[p + 1].k === 'kw' && /^(set|delta|add|remove|ref)$/.test(T[p + 1].v) && nx()));
        out.push(r); }
      else throw err('expected "score" or "on", got ' + (x.v || x.k), x.line);
      if (pk().k !== 'nl' && pk().k !== 'eof') throw err('unexpected ' + pk().v + ' at end of statement', pk().line); skipNl(); }
    return out; }
  /* canonical printer: minimal parentheses, one op per line (2-space indent) */
  var PL = { or: 1, and: 2, '==': 3, '!=': 3, '<': 3, '<=': 3, '>': 3, '>=': 3, '+': 4, '-': 4, '*': 5, '/': 5 };
  function pPath(s) { return s.map(function (x) { return typeof x === 'object' ? '{' + x.param + '}' : x; }).join('/'); }
  function pE(e, ctx) {
    if ('num' in e) return String(e.num); if ('str' in e) return JSON.stringify(e.str); if ('bool' in e) return String(e.bool);
    if (e.name) return e.name; if (e.at) return '@' + pPath(e.at); if (e.neg) return '-' + pE(e.neg, 6); if (e.not) return 'not ' + pE(e.not, 6);
    if (e.call) return e.call + '(' + e.args.map(function (a) { return pE(a, 0); }).join(', ') + ')';
    var l = PL[e.bin], s = pE(e.a, l) + ' ' + e.bin + ' ' + pE(e.b, l + 0.5); return (ctx || 0) > l ? '(' + s + ')' : s; }
  function pOp(o) { var h = o.op + ' ' + pPath(o.path);
    return o.op === 'delta' ? h + ' ' + o.sign + '= ' + pE(o.value) : (o.op === 'set' || o.op === 'ref') ? h + ' = ' + pE(o.value) : h + ' ' + pE(o.value); }
  function print(ast) { return ast.map(function (s) {
    if (s.score) return 'score ' + s.score + ' = ' + pE(s.expr);
    return 'on ' + s.on + (s.params.length ? '(' + s.params.join(', ') + ')' : '') + (s.when ? ' when ' + pE(s.when) : '') + ':\n' + s.ops.map(function (o) { return '  ' + pOp(o); }).join('\n'); }).join('\n') + '\n'; }
  function strip(ast) { return JSON.parse(JSON.stringify(ast, function (k, v) { return k === 'line' ? undefined : v; })); }
  /* lowering 1: score -> JBlueprint graph (stage 1 nodes only) */
  var BIN = { '+': 'op.add', '-': 'op.sub', '*': 'op.mul', '/': 'op.div' };
  function toBlueprint(s) {
    var nodes = [], edges = [], n = 0;
    function node(type, p) { var id = 'n' + (++n); nodes.push(p ? { id: id, type: type, x: 0, y: 0, p: p } : { id: id, type: type, x: 0, y: 0 }); return id; }
    function wire(a, b, port) { edges.push({ from: [a, 'out'], to: [b, port] }); }
    function nameArg(e, fn) { if (e.name) return e.name; if ('str' in e) return e.str; throw new Error(fn + '() takes a name'); }
    function g(e) {
      if ('num' in e) return node('data.const', { value: e.num });
      if (e.neg) { var z = node('op.sub'); wire(node('data.const', { value: 0 }), z, 'a'); wire(g(e.neg), z, 'b'); return z; }
      if (e.bin && BIN[e.bin]) { var b = node(BIN[e.bin]); wire(g(e.a), b, 'a'); wire(g(e.b), b, 'b'); return b; }
      if (e.call === 'value') return node('item.value', { field: nameArg(e.args[0], 'value') });
      if (e.call === 'factor') return node('item.factor', { field: nameArg(e.args[0], 'factor') });
      if (e.call === 'joy') return node('joy.value', { joy: nameArg(e.args[0], 'joy') });
      if (e.call === 'jmax') return node('joy.jmax', { joy: nameArg(e.args[0], 'jmax') });
      if (e.call === 'boardmax') return node('data.boardMax', { field: nameArg(e.args[0], 'boardmax') });
      if (e.call === 'min' || e.call === 'max') { var m = node('op.' + e.call); wire(g(e.args[0]), m, 'a'); wire(g(e.args[1]), m, 'b'); return m; }
      if (e.call === 'clamp01') { var c = node('op.clamp01'); wire(g(e.args[0]), c, 'a'); return c; }
      if (e.call === 'jfactor') { var j = node('jfactor.call'); ['x', 'y', 'xMax', 'yMax'].forEach(function (q, i) { wire(g(e.args[i]), j, q); }); return j; }
      throw new Error('score ' + s.score + ': not allowed in a score (pure numeric, stage 1): ' + pE(e)); }
    var r = g(s.expr), o = node('score.out'); wire(r, o, 'in'); return { version: 1, nodes: nodes, edges: edges }; }
  /* lowering 2: rule -> ops. env = {args:{param:value}, get(pathString)} ; returns null when `when` is false */
  function evalE(e, env) {
    if ('num' in e) return e.num; if ('str' in e) return e.str; if ('bool' in e) return e.bool;
    if (e.name) { if (env.args && e.name in env.args) return env.args[e.name]; throw new Error('unknown name ' + e.name); }
    if (e.at) return env.get(pathStr(e.at, env)); if (e.neg) return -evalE(e.neg, env); if (e.not) return !evalE(e.not, env);
    if (e.call) { var a = e.args.map(function (x) { return evalE(x, env); });
      switch (e.call) { case 'min': return Math.min(a[0], a[1]); case 'max': return Math.max(a[0], a[1]); case 'clamp01': return Math.max(0, Math.min(1, a[0]));
        case 'get': return env.get(String(a[0])); default: throw new Error(e.call + '() is only allowed in a score'); } }
    var x = evalE(e.a, env); if (e.bin === 'and') return x && evalE(e.b, env); if (e.bin === 'or') return x || evalE(e.b, env); var y = evalE(e.b, env);
    switch (e.bin) { case '+': return x + y; case '-': return x - y; case '*': return x * y; case '/': return y ? x / y : 0;
      case '==': return x === y; case '!=': return x !== y; case '<': return x < y; case '<=': return x <= y; case '>': return x > y; case '>=': return x >= y; } }
  function pathStr(segs, env) { return segs.map(function (s) { if (typeof s !== 'object') return s; var v = env.args && env.args[s.param]; if (v == null) throw new Error('unbound {' + s.param + '}'); return String(v); }).join('/'); }
  function toOps(rule, env) {
    if (rule.when && !evalE(rule.when, env)) return null;
    return rule.ops.map(function (o) { var p = pathStr(o.path, env), v = evalE(o.value, env);
      if (o.op === 'delta') { if (typeof v !== 'number') throw new Error('delta needs a number'); return { op: 'delta', path: p, value: o.sign === '-' ? -v : v }; }
      return { op: o.op, path: p, value: v }; }); }
  var API = { parse: parse, print: print, strip: strip, toBlueprint: toBlueprint, toOps: toOps, evalExpr: evalE };
  root.Exp7Circuit = API; if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);

