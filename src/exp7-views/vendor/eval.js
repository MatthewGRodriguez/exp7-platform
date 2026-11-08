/* inlined: atlas/eval.js */
/* JEditor atlas evaluator (M17, ADRs 0081, 0084). Pure: computePass(snapshot, dirty, events, changed) -> per-blueprint writes;
 * apply() merges them (deltas summed, other writes in fixed order, conflicts recorded). Loops land on the next pass; no cap.
 * The same source runs in node, on the page main thread, and inside a Blob-URL worker. window.JAtlasEval / module.exports. */
(function (root) {
  'use strict';
  var NODES = {
    item: { ins: ['set', 'add', 'state'], outs: ['value', 'ref'], params: { item: 'itemref', field: 'field', out: 'out' } },
    joy: { ins: ['add', 'set'], outs: ['value'], params: { joy: 'joy' } },
    math: { ins: ['a', 'b'], outs: ['out'], params: { op: ['const', 'add', 'sub', 'mul', 'div', 'min', 'max', 'neg', 'clamp01', 'if'], value: 'number', out: 'out' } },
    condition: { ins: ['a', 'b'], outs: ['ok', 'state', 'item', 'target'], params: { op: ['>', '>=', '<', '<=', '==', '!=', 'event'], value: 'number', then: 'state', else: 'state', event: ['click', 'drag', 'drop', 'select'] } },
    component: { ins: [], outs: ['comp'], params: { comp: 'comp' } },
    position: { ins: ['comp'], outs: ['placed'], params: { x: 'number', y: 'number', w: 'number', parent: 'comp' } },
    view: { ins: ['items', 'comps', 'style', 'item', 'label'], outs: ['changed', 'events'], params: { comp: 'comp' }, multi: { items: 1, comps: 1 } },
    /* M18 (ADR 0092): per-day measure over a calendar component's items -> {YYYY-MM-DD: number}; conditions apply per day */
    days: { ins: [], outs: ['values', 'total'], params: { comp: 'comp', measure: ['count', 'sum', 'conflicts'], field: 'field' } },
    /* M19 (ADR 0095): running measure over the days of a calendar: opening (+ signed per-day amounts) -> balance map; 'ahead' = lowest balance
       from that day until the next inflow day (headroom); generic: any field, any opening joy */
    accumulate: { ins: ['opening'], outs: ['values', 'flows', 'ahead', 'min', 'end'], params: { comp: 'comp', field: 'field', opening: 'number' } },
    /* M19 (ADR 0096): per-key merge of state maps: first non-empty of a, b, c (wire the most severe first) */
    merge: { ins: ['a', 'b', 'c', 'd'], outs: ['out'], params: {} },
    /* M20b (ADR 0101): total of one numeric field over a component's items (and its sub-components when deep) */
    sum: { ins: [], outs: ['total', 'count'], params: { comp: 'comp', field: 'field', deep: ['no', 'yes'], match: 'field', value: 'text' } },
    /* M20d (ADR 0103): per-item arithmetic over a component's items (fields, joys as J.id, if/min/max/abs/round/ceil/floor/ln) -> state[out] on each item */
    formula: { ins: [], outs: ['total', 'max', 'values'], params: { comp: 'comp', expr: 'text', out: 'text', deep: ['no', 'yes'] } },
    /* M20g (ADR 0104): dated balance walk per item: start balance @ start date, monthly event day adds rate/365 x balance x days then subtracts pay;
       accrues to the target date (joy holding YYYY-MM-DD, empty = today) -> state.live / state.left / state.gap / state.events */
    walk: { ins: [], outs: ['total', 'values'], params: { comp: 'comp', start: 'field', from: 'field', rate: 'field', day: 'field', pay: 'field', count: 'field', target: 'joy' } }
  };
  /* ---- calendar helpers (ADR 0091/0092): items carry values.date (YYYY-MM-DD), values.repeat (once|daily|weekly|weekdays|monthly), values.days (duration) ---- */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function pdate(s) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; }
  function monthOf(c) { var m = ((c && c.view) || {}).month; if (/^\d{4}-\d{2}$/.test(m || '')) return m; var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1); }
  function monthDays(month) { var y = +month.slice(0, 4), mo = +month.slice(5, 7) - 1, n = new Date(y, mo + 1, 0).getDate(), out = []; for (var i = 1; i <= n; i++) out.push(month + '-' + pad(i)); return out; }
  /** days of `month` an item occupies (start date + recurrence, each occurrence lasting values.days days) */
  function dimOf(d) { return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); }
  function onList(v) { return String(v == null ? '' : v).split(/[ ,]+/).filter(Boolean); }
  function occurrences(it, month) { var v = (it && it.values) || {}, s = pdate(v.date); if (!s) return []; var rep = v.repeat || 'once', dur = Math.max(1, Math.floor(+v.days || 1)), out = {},
      ON = onList(v.on).map(Number).filter(isFinite), DS = onList(v.on), U = pdate(v.until);
    monthDays(month).forEach(function (ds) { var d = pdate(ds); for (var k = 0; k < dur; k++) { var st = new Date(d.getFullYear(), d.getMonth(), d.getDate() - k); if (st < s) continue;
        if (U && st > U) continue;
        var hit = rep === 'daily' || (rep === 'weekdays' && st.getDay() > 0 && st.getDay() < 6) || (rep === 'weekly' && (ON.length ? ON.indexOf(st.getDay()) >= 0 : st.getDay() === s.getDay())) ||
          (rep === 'monthly' && st.getDate() === Math.min(s.getDate(), dimOf(st))) || (rep === 'monthdays' && ON.some(function (x) { return st.getDate() === Math.min(x, dimOf(st)); })) || (rep === 'dates' && DS.indexOf(ymd(st)) >= 0) || ymd(st) === ymd(s);
        if (hit) { out[ds] = 1; break; } } });
    return Object.keys(out).sort(); }
  /** an item is in conflict when its jreq item is scheduled on/after it; broken when its jreq points at nothing */
  function itemFlags(w, ref) { var it = rec(w, ref), f = { broken: false, conflict: false }; if (!it || !it.jreq) return f; var j = rec(w, it.jreq); if (!j) { f.broken = true; return f; }
    if (parse(it.jreq).kind === 'item') { var a = pdate((it.values || {}).date), b = pdate((j.values || {}).date); if (a && b && b >= a) f.conflict = true; } return f; }
  function dayMap(w, compRef, measure, field) { var c = rec(w, compRef), out = {}; if (!c) return out; var month = monthOf(c);
    monthDays(month).forEach(function (d) { out[d] = 0; });
    (c.items || []).forEach(function (r) { var it = rec(w, r); if (!it) return; var add = measure === 'sum' ? num((it.values || {})[field || 'hours']) : measure === 'conflicts' ? (itemFlags(w, r).conflict ? 1 : 0) : 1; if (!add) return;
      (measure === 'conflicts' ? [((it.values || {}).date || '')].filter(function (d) { return d in out; }) : occurrences(it, month)).forEach(function (d) { out[d] += add; }); });
    return out; }
  /** M19 (ADR 0095): money-free amounts per day. values.amount per month, values.charge each|last|first|per (default each = amount split
   *  evenly over the month's occurrences), values.flow in|out (sign) */
  function charges(it, month) { var v = (it && it.values) || {}, fin = v.until && v.lastAmount != null && String(v.until).slice(0, 7) === month, a = num(fin ? v.lastAmount : v.amount);
    /* final-payment month: lastAmount is charged on the month's schedule even after the until day (legacy rule, ADR 0098) */
    /* values.pay (day-of-month list) = charge days separate from presence (e.g. paid on 1,15 for work done on weekdays) */
    var cv = v.pay ? Object.assign({}, v, { repeat: 'monthdays', on: v.pay }) : v, occ = occurrences({ values: fin ? Object.assign({}, cv, { until: month + '-31' }) : cv }, month), out = {}; if (!a || !occ.length) return out;
    var mode = v.charge || 'each'; if (mode === 'last') out[occ[occ.length - 1]] = a; else if (mode === 'first') out[occ[0]] = a; else occ.forEach(function (d) { out[d] = mode === 'per' ? a : a / occ.length; });
    return out; }
  function sign(it) { return ((it && it.values) || {}).flow === 'in' ? 1 : -1; }
  function ledger(w, compRef, opening) { var c = rec(w, compRef), L = { values: {}, flows: {}, ins: {}, ahead: {}, min: 0, end: 0, lines: {} }; if (!c) return L; var month = monthOf(c), days = monthDays(month);
    days.forEach(function (d) { L.flows[d] = 0; L.lines[d] = []; });
    (c.items || []).forEach(function (r) { var it = rec(w, r); if (!it) return; var pk = it.alts && it.state && (it.state.pick || it.state.simPick), pm = pk && rec(w, pk);
      if (pm && pm.values && pm.values.amount != null) it = { values: Object.assign({}, it.values, { amount: pm.values.amount }) }; /* ADR 0097: a picked alternative's amount replaces the item's on its schedule */
      var ch = charges(it, month), sg = sign(it);
      Object.keys(ch).forEach(function (d) { if (!(d in L.flows)) return; L.flows[d] += sg * ch[d]; L.lines[d].push({ item: r, amt: sg * ch[d] }); if (sg > 0) L.ins[d] = 1; }); });
    var bal = num(opening); days.forEach(function (d) { bal += L.flows[d]; L.values[d] = bal; });
    for (var i = days.length - 1, run = Infinity; i >= 0; i--) { var nx = days[i + 1]; if (!nx || L.ins[nx]) run = Infinity; run = Math.min(run, L.values[days[i]]); L.ahead[days[i]] = run; }
    L.min = days.length ? Math.min.apply(null, days.map(function (d) { return L.values[d]; })) : 0; L.end = days.length ? L.values[days[days.length - 1]] : bal; return L; }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function parse(ref) { var m = /^(item|joy|bp|comp):(.+)$/.exec(ref || ''); return m ? { kind: m[1], id: m[2] } : null; }
  var COL = { item: 'items', joy: 'joys', bp: 'blueprints', comp: 'components' };
  function rec(w, ref) { var r = parse(ref); return r ? (w[COL[r.kind]] || {})[r.id] || null : null; }
  /** node order inside one blueprint (wires must be acyclic within a graph) */
  function graphOrder(bp) {
    var ns = bp.nodes || [], ind = {}, out = {}, res = [];
    ns.forEach(function (n) { ind[n.id] = 0; out[n.id] = []; });
    (bp.wires || []).forEach(function (e) { if (ind[e.to[0]] == null || !out[e.from[0]]) return; ind[e.to[0]]++; out[e.from[0]].push(e.to[0]); });
    var q = ns.map(function (n) { return n.id; }).filter(function (id) { return !ind[id]; }).sort();
    while (q.length) { var id = q.shift(); res.push(id); out[id].forEach(function (t) { if (!--ind[t]) { q.push(t); q.sort(); } }); }
    return res.length === ns.length ? res : null;
  }
  function wiresInto(bp, nid, port) { return (bp.wires || []).filter(function (e) { return e.to[0] === nid && e.to[1] === port; }); }
  /** static reads / writes of a blueprint (record-level keys) */
  function access(bp) {
    var R = {}, Wr = {}, own = {};
    (bp.nodes || []).forEach(function (n) { var p = n.p || {}, wired = function (port) { return wiresInto(bp, n.id, port).length > 0; }, outUsed = function (port) { return (bp.wires || []).some(function (e) { return e.from[0] === n.id && e.from[1] === port; }); };
      if (n.type === 'item') { if (p.item === 'event') R.events = 1; else if (p.item === 'self') R.self = 1; else if (p.item) R[p.item] = 1;
        if (wired('set') || wired('add') || wired('state')) Wr[p.item === 'event' ? 'event-item' : p.item] = 1; }
      /* M20 fix: a joy node that only SETS (value output unused; set is idempotent, add accumulates) does not read the joy -> no false loop */
      if (n.type === 'joy' && p.joy) { var jw = wired('add') || wired('set'); if (!wired('set') || wired('add') || outUsed('value')) R['joy:' + p.joy] = 1; if (jw) Wr['joy:' + p.joy] = 1; }
      if (n.type === 'component' && p.comp) R[p.comp] = 1;
      if (n.type === 'position' && wired('comp')) { (bp.wires || []).forEach(function (e) { if (e.to[0] === n.id) { var src = (bp.nodes || []).filter(function (m) { return m.id === e.from[0]; })[0]; if (src && src.p && src.p.comp) Wr[src.p.comp] = 1; } }); }
      /* M18: a view node only READS its component when its 'changed' output is used (styling a view is not reading it, so no self-loop) */
      if (n.type === 'view' && p.comp) { var usesOut = function (port) { return (bp.wires || []).some(function (e) { return e.from[0] === n.id && e.from[1] === port; }); };
        if (usesOut('changed')) R[p.comp] = 1; if (usesOut('events')) R.events = 1; if (wired('style') || wired('items') || wired('comps')) Wr[p.comp] = 1; }
      if (n.type === 'condition' && p.op === 'event') R.events = 1;
      if (n.type === 'accumulate' && p.comp) { R['members:' + p.comp] = 1; R['items*'] = 1; }
      if ((n.type === 'formula' || n.type === 'walk') && p.comp) { R['members:' + p.comp] = 1; R['items*'] = 1; if (p.target) R['joy:' + p.target] = 1;
        /* field-level state keys: a formula writes state:<out>, reads state:<identifier> for each name in its expression; walk writes state:live/left/gap/events */
        if (n.type === 'formula') { Wr['state:' + (p.out || 'calc')] = 1; own['state:' + (p.out || 'calc')] = 1; String(p.expr || '').replace(/'[^']*'/g, '').replace(/(J\.)?([A-Za-z_][A-Za-z0-9_]*)/g, function (_, jj, id) { if (jj) R['joy:' + id] = 1; else if (!FN[id] && id !== 'gmax' && id !== 'paid' && id !== 'grank' && id !== 'linked' && id !== 'hshare' && id !== 'gsum' && id !== 'DAYS' && id !== 'pmax' && id !== 'via') R['state:' + id] = 1; }); }
        else { ['live', 'left', 'gap', 'events'].forEach(function (f) { Wr['state:' + f] = 1; own['state:' + f] = 1; }); ['start', 'from', 'rate', 'day', 'pay', 'count'].forEach(function (q) { if (p[q]) R['state:' + p[q]] = 1; }); R['state:initial'] = R['state:asOf'] = R['state:apr'] = R['state:payDay'] = R['state:cashPay'] = R['state:terms0'] = 1; } }
      if (n.type === 'sum' && p.comp) { R['members:' + p.comp] = 1; R['items*'] = 1; R['state:' + (p.field || 'amount')] = 1; if (p.match) R['state:' + p.match] = 1; }
      if (n.type === 'days' && p.comp) { R['members:' + p.comp] = 1; R['items*'] = 1; } });
    return { reads: Object.keys(R), writes: Object.keys(Wr), own: Object.keys(own) };
  }
  /** wiring-dependency order between blueprints + cycles (read/write graph); ties by id */
  function deps(w) {
    var ids = Object.keys(w.blueprints || {}).sort(), A = {}, edges = {};
    ids.forEach(function (id) { A[id] = access(w.blueprints[id]); edges[id] = []; });
    ids.forEach(function (a) { ids.forEach(function (b) { var hit = A[a].writes.some(function (k) { return k === 'event-item' || (a === b && A[a].own.indexOf(k) >= 0) ? false : A[b].reads.indexOf(k) >= 0 || (/^item:/.test(k) && A[b].reads.indexOf('items*') >= 0); }) ||
      (A[a].writes.indexOf('event-item') >= 0 && A[b].reads.indexOf('items*') >= 0) ||
      (A[a].writes.indexOf('event-item') >= 0 && A[b].reads.some(function (k) { return /^item:/.test(k); })); if (hit) edges[a].push(b); }); });
    /* Tarjan SCC for cycles */
    var idx = 0, I = {}, L = {}, S = [], on = {}, sccs = [];
    function sc(v) { I[v] = L[v] = idx++; S.push(v); on[v] = 1; edges[v].forEach(function (u) { if (I[u] == null) { sc(u); L[v] = Math.min(L[v], L[u]); } else if (on[u]) L[v] = Math.min(L[v], I[u]); });
      if (L[v] === I[v]) { var c = [], x; do { x = S.pop(); on[x] = 0; c.push(x); } while (x !== v); sccs.push(c.sort()); } }
    ids.forEach(function (v) { if (I[v] == null) sc(v); });
    var cycles = sccs.filter(function (c) { return c.length > 1 || edges[c[0]].indexOf(c[0]) >= 0; });
    /* order: topological over the SCC condensation, ties by first id */
    var comp = {}; sccs.forEach(function (c, i) { c.forEach(function (v) { comp[v] = i; }); });
    var ind = sccs.map(function () { return 0; }), cout = sccs.map(function () { return {}; });
    ids.forEach(function (a) { edges[a].forEach(function (b) { if (comp[a] !== comp[b] && !cout[comp[a]][comp[b]]) { cout[comp[a]][comp[b]] = 1; ind[comp[b]]++; } }); });
    var q = sccs.map(function (c, i) { return i; }).filter(function (i) { return !ind[i]; }), order = [];
    var key = function (i) { return sccs[i][0]; }; q.sort(function (a, b) { return key(a) < key(b) ? -1 : 1; });
    while (q.length) { var i = q.shift(); order = order.concat(sccs[i]); Object.keys(cout[i]).forEach(function (j) { if (!--ind[j]) { q.push(+j); q.sort(function (a, b) { return key(a) < key(b) ? -1 : 1; }); } }); }
    return { order: order, edges: edges, cycles: cycles, access: A };
  }
  function num(v) { return typeof v === 'number' && isFinite(v) ? v : (v === true ? 1 : (+v || 0)); }
  function cmp(op, a, b) { a = num(a); b = num(b); return op === '>' ? a > b : op === '>=' ? a >= b : op === '<' ? a < b : op === '<=' ? a <= b : op === '==' ? a === b : op === '!=' ? a !== b : false; }
  function fv(it, f) { if (!it) return undefined; if (f === 'name') return it.name; var v = it.values || {}; if (f in v) return v[f]; return (it.state || {})[f]; }
  function today() { var d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  /* tiny safe expression compiler: numbers, 'strings', identifiers (fields / J.joy), + - * / % ( ) comparisons && || ! and functions; no eval */
  var FN = { min: Math.min, max: Math.max, abs: Math.abs, round: function (x, d) { var k = Math.pow(10, d || 0); return Math.round(x * k) / k; }, ceil: Math.ceil, floor: Math.floor, ln: Math.log,
    if: function (c, a, b) { return c ? a : b; }, num: function (x) { return num(x); }, has: function (x) { return x != null && x !== ''; } };
  var CC = {};
  function compile(src) { if (CC[src]) return CC[src]; var T = [], i = 0, re = /\s*(?:(\d+\.?\d*(?:e[+-]?\d+)?)|('[^']*')|([A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z0-9_]+)?)|(==|!=|>=|<=|&&|\|\||[-+*\/%()<>!,?:]))/y, m;
    while (i < src.length) { re.lastIndex = i; m = re.exec(src); if (!m) { if (/^\s*$/.test(src.slice(i))) break; throw new Error('formula: bad token at ' + i); } i = re.lastIndex; T.push(m[1] != null ? { n: +m[1] } : m[2] != null ? { s: m[2].slice(1, -1) } : m[3] != null ? { id: m[3] } : { op: m[4] }); }
    var k = 0; function peek(o) { return T[k] && T[k].op === o; } function eat(o) { if (peek(o)) { k++; return true; } return false; }
    function prim() { var t = T[k++]; if (!t) throw new Error('formula: unexpected end'); if (t.n != null) return function () { return t.n; }; if (t.s != null) return function () { return t.s; };
      if (t.op === '(') { var e = tern(); eat(')'); return e; } if (t.op === '-') { var u = prim(); return function (g) { return -num(u(g)); }; } if (t.op === '!') { var nn = prim(); return function (g) { return !nn(g); }; }
      if (t.id === 'grank' && peek('(')) { k++; var ra = T[k++], rb = (eat(','), T[k++]); eat(')'); var rkey = '@grank|' + (ra && ra.s) + '|' + (rb && rb.s); return function (g) { return g(rkey); }; }
      if (t.id === 'linked' && peek('(')) { k++; var la = T[k++], lb = (eat(','), T[k++]); eat(')'); var lkey = '@linked|' + (la && la.s) + '|' + (lb && lb.s); return function (g) { return g(lkey); }; }
      if (t.id === 'pmax' && peek('(')) { k++; var xa = T[k++], xb = (eat(','), T[k++]); eat(')'); var xkey = '@pmax|' + (xa && xa.s) + '|' + (xb && xb.s); return function (g) { return g(xkey); }; }
      if (t.id === 'paid' && peek('(')) { k++; var pa = T[k++], pb = (eat(','), T[k++]); eat(')'); var pkey = '@paid|' + (pa && pa.s) + '|' + (pb && pb.s); return function (g) { return g(pkey); }; }
      if (t.id === 'hshare' && peek('(')) { k++; var ha = T[k++], hb = (eat(','), T[k++]), hc = (eat(','), T[k++]); eat(')'); var hkey = '@hshare|' + (ha && ha.s) + '|' + (hb && hb.s) + '|' + (hc && (hc.s != null ? hc.s : hc.n)); return function (g) { return g(hkey); }; }
      if (t.id === 'via' && peek('(')) { k++; var va = T[k++], vb = (eat(','), T[k++]); eat(')'); var vkey = '@via|' + (va && va.s) + '|' + (vb && vb.s); return function (g) { return g(vkey); }; }
      if (t.id === 'gsum' && peek('(')) { k++; var sa = T[k++]; eat(')'); var skey = '@gsum|' + (sa && sa.s); return function (g) { return g(skey); }; }
      if (t.id === 'gmax' && peek('(')) { k++; var ga = T[k++], gb = (eat(','), T[k++]); eat(')'); var key = '@gmax|' + (ga && ga.s) + '|' + (gb && gb.s); return function (g) { return g(key); }; }
      if (t.id && peek('(')) { k++; var args = []; if (!peek(')')) do { args.push(tern()); } while (eat(',')); eat(')'); var f = FN[t.id]; if (!f) throw new Error('formula: unknown function ' + t.id);
        if (t.id === 'if') return function (g) { return args[0](g) ? args[1](g) : args[2] ? args[2](g) : 0; }; return function (g) { return f.apply(null, args.map(function (a) { var v = a(g); return t.id === 'has' ? v : num(v); })); }; }
      if (t.id) return function (g) { return g(t.id); }; throw new Error('formula: unexpected ' + JSON.stringify(t)); }
    function bin(next, ops) { return function () { var a = next(); for (;;) { var o = T[k] && T[k].op; if (ops.indexOf(o) < 0) return a; k++; var b = next(); a = (function (a, b, o) { return function (g) { var x = a(g), y = b(g);
          switch (o) { case '+': return (typeof x === 'string' && typeof y === 'string' && (x === '' || y === '' || isNaN(+x) || isNaN(+y) || /[.+\s]$|^[.+\s]/.test(x + '|' + y))) || (typeof x === 'string' && x !== '' && (isNaN(+x) || /^\s+$/.test(x))) || (typeof y === 'string' && y !== '' && (isNaN(+y) || /^\s+$/.test(y))) ? String(x) + String(y) : num(x) + num(y); case '-': return num(x) - num(y); case '*': return num(x) * num(y); case '/': return num(y) ? num(x) / num(y) : 0; case '%': return num(y) ? num(x) % num(y) : 0;
            case '<': return num(x) < num(y); case '>': return num(x) > num(y); case '<=': return num(x) <= num(y); case '>=': return num(x) >= num(y); case '==': return x == y; case '!=': return x != y; case '&&': return x && y; case '||': return x || y; } }; })(a, b, o); } }; }
    var mul = bin(prim, ['*', '/', '%']), add = bin(mul, ['+', '-']), cmp2 = bin(add, ['<', '>', '<=', '>=']), eq = bin(cmp2, ['==', '!=']), and = bin(eq, ['&&']), or = bin(and, ['||']);
    function tern() { var c = or(); if (eat('?')) { var a = tern(); eat(':'); var b = tern(); return function (g) { return c(g) ? a(g) : b(g); }; } return c; }
    var fn = tern(); CC[src] = function (g) { try { var v = fn(g); return typeof v === 'boolean' ? (v ? 1 : 0) : (v == null ? 0 : v); } catch (e) { return 0; } }; return CC[src]; }
  /** walk one balance from start@from to target over monthly event days (clamped to month length); returns live/left/gap/events */
  function walkOne(bal0, from, rate, day, pay, count, tgt) { var bal = bal0, last = from, ev = 0, DAY = 86400000, dd = function (a, b) { return Math.round((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / DAY); };
    if (tgt > from) { var y = from.getFullYear(), m = from.getMonth(); for (var g = 0; g < 2500; g++) { var pd = new Date(y, m, Math.min(day, new Date(y, m + 1, 0).getDate()));
        if (pd > from) { if (pd > tgt) break; var ds = Math.max(0, dd(last, pd)); if (bal > 0.005) { bal = bal + rate / 365 * bal * ds - Math.max(0, pay); if (bal < 0.005) bal = 0; ev++; } last = pd; if (!(bal > 0.005)) break; }
        m++; if (m > 11) { m = 0; y++; } }
      if (bal > 0.005) { var d2 = dd(last, tgt); if (d2 > 0) bal = bal + rate / 365 * bal * d2; } }
    if (bal < 0.005) bal = 0; var gap = Math.max(0, bal0 - bal), left = Math.max(0, count - ev); if (!(bal > 0.005)) left = 0;
    return { live: Math.round(bal * 100) / 100, gap: Math.round(gap * 100) / 100, events: ev, left: left }; }
  function sumItems(w, cref, deep, d) { var c = rec(w, cref); if (!c || d > 12) return []; var out = (c.items || []).slice(); if (deep) (c.sub || []).forEach(function (s) { out = out.concat(sumItems(w, s.comp, true, d + 1)); }); return out; }
  /** evaluate one blueprint against a snapshot. ctx: {self, events, changed}. returns {writes, outs:{score, jreq}, error} */
  function evalBlueprint(w, bpId, ctx) {
    var bp = w.blueprints[bpId], order = bp && graphOrder(bp); ctx = ctx || {};
    if (!bp) return { writes: [], outs: {}, error: 'missing' }; if (!order) return { writes: [], outs: {}, error: 'wires form a cycle inside the blueprint' };
    var byId = {}, V = {}, writes = [], outs = {}; (bp.nodes || []).forEach(function (n) { byId[n.id] = n; });
    var events = ctx.events || [];
    function inp(nid, port) { var ws = wiresInto(bp, nid, port); if (!ws.length) return undefined; var vals = ws.map(function (e) { return (V[e.from[0]] || {})[e.from[1]]; });
      return NODES[byId[nid].type].multi && NODES[byId[nid].type].multi[port] ? vals : vals[0]; }
    function W(target, path, op, v, nid) { writes.push({ target: target, path: path, op: op, v: v, bp: bpId, node: nid }); }
    order.forEach(function (nid) { var n = byId[nid], p = n.p || {}, o = V[nid] = {};
      if (n.type === 'item') { var ref = p.item === 'event' ? (events.filter(function (e) { return e.item; }).map(function (e) { return e.item; })[0] || null) : p.item === 'self' ? ctx.self : p.item;
        var it = rec(w, ref); o.ref = it ? ref : null; var f = p.field || 'name';
        o.value = it ? (it.values && f in it.values ? it.values[f] : (it.state && f in it.state ? it.state[f] : (f === 'name' ? it.name : undefined))) : undefined;
        if (it) { var s = inp(nid, 'set'), a = inp(nid, 'add'), st = inp(nid, 'state');
          if (s !== undefined) W(ref, ['values', f], 'set', s, nid); if (a !== undefined) W(ref, ['values', f], 'add', num(a), nid); if (st !== undefined) W(ref, ['state', f], 'set', st, nid); }
        if (p.out === 'jreq') outs.jreq = o.ref; }
      else if (n.type === 'joy') { var j = (w.joys || {})[p.joy]; o.value = j ? j.value : undefined;
        if (j) { var ja = inp(nid, 'add'), js = inp(nid, 'set'); if (ja !== undefined) W('joy:' + p.joy, ['value'], 'add', num(ja), nid); if (js !== undefined) W('joy:' + p.joy, ['value'], 'set', num(js), nid); } }
      else if (n.type === 'math') { var A = num(inp(nid, 'a')), B = num(inp(nid, 'b')), op = p.op || 'const'; if (op === 'if') { o.out = B ? A : undefined; return; }
        o.out = op === 'const' ? num(p.value) : op === 'add' ? A + B : op === 'sub' ? A - B : op === 'mul' ? A * B : op === 'div' ? (B ? A / B : 0) : op === 'min' ? Math.min(A, B) : op === 'max' ? Math.max(A, B) : op === 'neg' ? -A : Math.max(0, Math.min(1, A));
        if (typeof o.out === 'number' && isFinite(o.out)) o.out = +o.out.toFixed(9);
        if (p.out === 'score') outs.score = o.out; }
      else if (n.type === 'condition') { var ok;
        if (p.op === 'event') { var src = inp(nid, 'a'), evs = Array.isArray(src) ? src : events; var m = evs.filter(function (e) { return !p.event || e.type === p.event; }); ok = m.length > 0; o.item = ok ? m[0].item || null : undefined; o.target = ok ? m[0].target || null : undefined; }
        else { var av = inp(nid, 'a'), bv = inp(nid, 'b'); if (av && typeof av === 'object' && !Array.isArray(av)) { var sm = {}, cnt = 0; Object.keys(av).forEach(function (k) { var y = cmp(p.op || '>', av[k], bv === undefined ? p.value : (bv && typeof bv === 'object' ? bv[k] : bv)); if (y) cnt++; sm[k] = y ? (p.then || 'on') : (p.else || ''); });
            o.ok = cnt; o.state = sm; return; } ok = cmp(p.op || '>', av, bv === undefined ? p.value : bv); }
        o.ok = ok ? 1 : 0; o.state = ok ? (p.then || 'on') : (p.else || ''); }
      else if (n.type === 'accumulate') { var op0 = inp(nid, 'opening'), LG = ledger(w, p.comp, op0 === undefined ? p.opening : op0); o.values = LG.values; o.flows = LG.flows; o.ahead = LG.ahead; o.min = LG.min; o.end = LG.end; }
      else if (n.type === 'merge') { var mo = {}; ['a', 'b', 'c', 'd'].forEach(function (k) { var m = inp(nid, k); if (m && typeof m === 'object') Object.keys(m).forEach(function (d) { if (!mo[d] && m[d]) mo[d] = m[d]; else if (!(d in mo)) mo[d] = m[d]; }); }); o.out = mo; }
      else if (n.type === 'sum') { var SI = sumItems(w, p.comp, p.deep === 'yes', 0), fld = p.field || 'amount'; if (p.match) SI = SI.filter(function (r) { var v = fv(rec(w, r), p.match); return String(v == null ? '' : v) === String(p.value == null ? '' : p.value); });
        o.count = SI.length; o.total = +SI.reduce(function (t, r) { return t + num(fv(rec(w, r), fld)); }, 0).toFixed(6); }
      else if (n.type === 'formula') { var FI = sumItems(w, p.comp, p.deep === 'yes', 0), ex = compile(p.expr || '0'), FV = {}, ft = 0, fm = -Infinity, key = p.out || 'calc';
        /* paid('field','linkField'): Σ field over every atlas item whose linkField names this item (e.g. expenses paying a debt) */
        var PM = {}; function paid(key, r) { if (!PM[key]) { var q = key.split('|'), f = q[1], lf = q[2], m = {}; Object.keys(w.items || {}).forEach(function (id) { var o = w.items[id], to = String(fv(o, lf) || ''); if (to) m[to] = (m[to] || 0) + num(fv(o, f)); }); PM[key] = m; }
          var id = String(r).replace(/^item:/, ''); return +(PM[key][id] || 0).toFixed(6); }
        /* pmax('field','linkField'): max of field over the items whose linkField names this item */
        var PX = {}; function pmax(key, r) { if (!PX[key]) { var q = key.split('|'), f = q[1], lf = q[2], m = {}; Object.keys(w.items || {}).forEach(function (id) { var o = w.items[id], to = String(fv(o, lf) || ''); if (to) m[to] = Math.max(m[to] || 0, num(fv(o, f))); }); PX[key] = m; }
          return m0(PX[key][String(r).replace(/^item:/, '')]); } function m0(x) { return +(x || 0); }
        /* grank('field','tieField'): 1-based rank of this item in the formula's component by field descending, ties by tieField ascending */
        var RK = {}; function grank(key, r) { if (!RK[key]) { var q = key.split('|'), f = q[1], tf = q[2], L = FI.map(function (x, i) { var o = rec(w, x); return { r: x, v: num(o && fv(o, f)), t: num(o && fv(o, tf)), i: i }; });
            L.sort(function (a, b) { return (b.v - a.v) || (a.t - b.t) || (a.i - b.i); }); RK[key] = {}; L.forEach(function (x, i) { RK[key][x.r] = i + 1; }); } return RK[key][r] || 0; }
        /* linked('linkField','nameField'): names of the items whose linkField names this item, joined ', ' (insertion order) */
        var LM = {}; function linked(key, r) { if (!LM[key]) { var q = key.split('|'), lf = q[1], nf = q[2], m = {}; Object.keys(w.items || {}).forEach(function (id) { var o = w.items[id], to = String(fv(o, lf) || ''); if (to) (m[to] = m[to] || []).push(nf === 'name' ? o.name : fv(o, nf)); }); LM[key] = m; }
          return (LM[key][String(r).replace(/^item:/, '')] || []).join(', '); }
        /* hshare('posField','offField',inv): harmonic share (1/r)/Σ(1/r) of this item among the component's items with offField falsy and posField>0, ordered by posField; r = active position, or n−pos+1 when inv (live harmonicShares + activeRankOrder) */
        var HS = {}; function hshare(key, r) { if (!HS[key]) { var q = key.split('|'), pf = q[1], of = q[2], inv = q[3] === '1' || q[3] === 'true', L = [];
            FI.forEach(function (x, i) { var o = rec(w, x); if (o && !fv(o, of) && num(fv(o, pf)) > 0) L.push({ r: x, p: num(fv(o, pf)), i: i }); }); L.sort(function (a, b) { return (a.p - b.p) || (a.i - b.i); });
            var n = L.length, sw = 0; L.forEach(function (x, i) { x.w = 1 / (inv ? Math.max(1, n - i) : i + 1); sw += x.w; }); HS[key] = {}; L.forEach(function (x) { HS[key][x.r] = sw > 0 ? x.w / sw : 0; }); } return HS[key][r] || 0; }
        /* gsum('field'): Σ field over the formula's component items */
        var GS = {}; function gsum(key) { if (!(key in GS)) { var f = key.split('|')[1]; GS[key] = FI.reduce(function (t, x) { var o = rec(w, x); return t + num(o && fv(o, f)); }, 0); } return GS[key]; }
        var GM = {}; function gmax(key, it) { var q = key.split('|'), f = q[1], gf = q[2], gv = String(fv(it, gf)); GM[key] = GM[key] || {};
          if (!(gv in GM[key])) GM[key][gv] = FI.reduce(function (m, r2) { var o2 = rec(w, r2); return o2 && String(fv(o2, gf)) === gv ? Math.max(m, num(fv(o2, f))) : m; }, 0); return GM[key][gv]; }
        FI.forEach(function (r) { var it = rec(w, r); if (!it) return; var v = ex(function (name) { if (name.indexOf('J.') === 0) { var j = (w.joys || {})[name.slice(2)]; return j ? j.value : 0; } if (name === 'TOTAL') return ft; if (name === 'DAYS') return occurrences(it, monthOf(rec(w, p.monthOf || p.comp))).length; if (name.indexOf('@gmax|') === 0) return gmax(name, it); if (name.indexOf('@paid|') === 0) return paid(name, r); if (name.indexOf('@pmax|') === 0) return pmax(name, r); if (name.indexOf('@grank|') === 0) return grank(name, r); if (name.indexOf('@linked|') === 0) return linked(name, r); if (name.indexOf('@hshare|') === 0) return hshare(name, r); if (name.indexOf('@gsum|') === 0) return gsum(name); if (name.indexOf('@via|') === 0) { var vq = name.split('|'), vto = String(fv(it, vq[1]) || '').replace(/^item:/, ''), vo = vto && w.items[vto]; var vv = vo ? fv(vo, vq[2]) : 0; return vv == null ? 0 : vv; } return fv(it, name); });
          v = typeof v === "number" && isFinite(v) ? Math.round(v * 1e10) / 1e10 : v; FV[parse(r).id] = v; if (typeof v === 'number' && isFinite(v)) { ft += v; if (v > fm) fm = v; } W(r, ['state', key], 'set', v, nid); });
        o.values = FV; o.total = +ft.toFixed(6); o.max = fm === -Infinity ? 0 : fm; }
      else if (n.type === 'walk') { var WI = sumItems(w, p.comp, false, 0), tj = p.target && (w.joys || {})[p.target], tgt = pdate(tj && tj.value) || today(), WV = {}, wt = 0;
        WI.forEach(function (r) { var it = rec(w, r); if (!it) return; var res = walkOne(num(fv(it, p.start || 'initial')), pdate(fv(it, p.from || 'asOf')) || tgt, num(fv(it, p.rate || 'apr')) / 100, Math.max(1, num(fv(it, p.day || 'payDay')) || 1), num(fv(it, p.pay || 'cashPay')), num(fv(it, p.count || 'terms0')), tgt);
          WV[parse(r).id] = res.live; wt += res.live; W(r, ['state', 'live'], 'set', res.live, nid); W(r, ['state', 'left'], 'set', res.left, nid); W(r, ['state', 'gap'], 'set', res.gap, nid); W(r, ['state', 'events'], 'set', res.events, nid); });
        o.values = WV; o.total = Math.round(wt * 100) / 100; }
      else if (n.type === 'days') { o.values = dayMap(w, p.comp, p.measure || 'count', p.field); o.total = Object.keys(o.values).reduce(function (t, k) { return t + o.values[k]; }, 0); }
      else if (n.type === 'component') { o.comp = rec(w, p.comp) ? p.comp : null; }
      else if (n.type === 'position') { var c = inp(nid, 'comp'); o.placed = c || null; if (c && rec(w, c)) W(c, ['state', 'pos', parse(p.parent || '') ? parse(p.parent).id : '_'], 'set', { x: num(p.x), y: num(p.y), w: num(p.w) }, nid); }
      else if (n.type === 'view') { var vc = p.comp, comp = rec(w, vc); if (comp) {
          var sty = inp(nid, 'style'), itm = inp(nid, 'item'), its = inp(nid, 'items'), cps = inp(nid, 'comps');
          if (sty && typeof sty === 'object') W(vc, ['state', 'dayStyles'], 'set', sty, nid); else if (sty !== undefined) { if (itm && parse(itm)) W(vc, ['state', 'styles', parse(itm).id], 'set', sty, nid); else W(vc, ['state', 'style'], 'set', sty, nid); }
          var lab = inp(nid, 'label'); if (lab && typeof lab === 'object') W(vc, ['state', 'dayLabels'], 'set', lab, nid);
          if (its) W(vc, ['state', 'viewItems'], 'set', its.filter(Boolean), nid);
          if (cps) W(vc, ['state', 'viewComps'], 'set', cps.filter(Boolean), nid);
          var mine = [vc].concat(comp.items || [], (comp.sub || []).map(function (s) { return s.comp; }));
          o.changed = (ctx.changed || []).filter(function (r) { return mine.indexOf(r) >= 0; });
          o.events = events.filter(function (e) { return e.comp === vc || !e.comp; }); } } });
    return { writes: writes, outs: outs };
  }
  /** pure part of a pass: evaluate dirty blueprints in parallel against one snapshot */
  function computePass(snap, dirty, events, changed) {
    var D = deps(snap), res = [];
    D.order.forEach(function (id) { if (dirty === 'all' || dirty.indexOf(id) >= 0) { var r = evalBlueprint(snap, id, { events: events, changed: changed }); res.push({ bp: id, writes: r.writes, error: r.error || null }); } });
    return { order: D.order, results: res };
  }
  function setPath(o, path, v) { for (var i = 0; i < path.length - 1; i++) { if (o[path[i]] == null || typeof o[path[i]] !== 'object') o[path[i]] = {}; o = o[path[i]]; } o[path[path.length - 1]] = v; }
  function getPath(o, path) { for (var i = 0; i < path.length; i++) { if (o == null) return undefined; o = o[path[i]]; } return o; }
  /** apply all writes of a pass together: deltas summed; sets in fixed order (blueprint order, node id), last wins; conflicts noted */
  function apply(w, comp) {
    var rank = {}; comp.order.forEach(function (id, i) { rank[id] = i; });
    var all = []; comp.results.forEach(function (r) { all = all.concat(r.writes); });
    all.sort(function (a, b) { return (rank[a.bp] - rank[b.bp]) || (a.node < b.node ? -1 : a.node > b.node ? 1 : 0); });
    var byKey = {}, keys = []; all.forEach(function (x) { var k = x.target + '|' + x.path.join('.'); if (!byKey[k]) { byKey[k] = []; keys.push(k); } byKey[k].push(x); });
    var changed = {}, conflicts = [];
    keys.forEach(function (k) { var L = byKey[k], t = L[0], o = rec(w, t.target); if (!o) return;
      var before = JSON.stringify(getPath(o, t.path)), sets = L.filter(function (x) { return x.op === 'set'; }), adds = L.filter(function (x) { return x.op === 'add'; });
      if (sets.length) setPath(o, t.path, clone(sets[sets.length - 1].v));
      if (adds.length) setPath(o, t.path, num(getPath(o, t.path)) + adds.reduce(function (s, x) { return s + x.v; }, 0));
      var setters = sets.map(function (x) { return x.bp; }).filter(function (b, i, a) { return a.indexOf(b) === i; });
      if (setters.length > 1) conflicts.push({ target: t.target, path: t.path.join('.'), writers: setters, applied: sets[sets.length - 1].bp });
      if (JSON.stringify(getPath(o, t.path)) !== before) changed[t.target] = 1; });
    return { changed: Object.keys(changed).sort(), conflicts: conflicts };
  }
  /** score of an item = its blueprint's score output with self = the item */
  function scoreItem(w, ref) { var it = rec(w, ref); if (!it || !it.blueprint || !rec(w, it.blueprint)) return 0; var r = evalBlueprint(w, parse(it.blueprint).id, { self: ref }); return num(r.outs.score); }
  /** alternatives (ADR 0079): userPick > pref > best score; commit to state.pick (best) or state.simPick (sim) */
  function pickAlts(w, M, X) {
    var changed = [];
    Object.keys(w.items).forEach(function (id) { var it = w.items[id]; if (!it.alts) return; var r = M.pickAlt(w, id, function (m) { return scoreItem(w, m); }, X);
      var key = it.alts.method === 'sim' ? 'simPick' : 'pick', v = r ? r.pick : null; it.state = it.state || {};
      if (it.state[key] !== v || it.state.pickWhy !== (r ? r.why : null)) { it.state[key] = v; it.state.pickWhy = r ? r.why : null; changed.push('item:' + id); } });
    return changed;
  }
  /** resolve an item's jreq sequence, following conditional (blueprint) prerequisites */
  function sequence(w, itemId) { var out = [], seen = {}, x = (w.items[itemId] || {}).jreq;
    while (x && !seen[x]) { seen[x] = 1; var p = parse(x); if (!p) break;
      if (p.kind === 'bp') { x = evalBlueprint(w, p.id, {}).outs.jreq || null; continue; }
      out.push(x); x = (rec(w, x) || {}).jreq; }
    return out; }
  /** a full pass on a live atlas (main thread). st: {dirty:'all'|[ids], events:[], changed:[]}; computeFn may be a worker result */
  function pass(w, st, M, computed, X) {
    var snap = clone(w), comp = computed || computePass(snap, st.dirty, st.events || [], st.changed || []);
    var ap = apply(w, comp), alt = M ? pickAlts(w, M, X) : [], changed = ap.changed.concat(alt.filter(function (r) { return ap.changed.indexOf(r) < 0; })).sort();
    var D = deps(w), next = D.order.filter(function (id) { return hits(D.access[id].reads, changed); });
    return { ran: comp.results.map(function (r) { return r.bp; }), errors: comp.results.filter(function (r) { return r.error; }).map(function (r) { return { bp: r.bp, error: r.error }; }),
      changed: changed, conflicts: ap.conflicts, next: next, cycles: D.cycles };
  }
  /** changed refs from an external write (clock tick, user pick) -> dirty blueprints */
  function hits(R, changed) { return changed.some(function (c) { return R.indexOf(c) >= 0 || (/^item:/.test(c) && R.indexOf('items*') >= 0); }); }
  function dirtyFor(w, changed, hasEvents) { var D = deps(w); return D.order.filter(function (id) { var R = D.access[id].reads; return (hasEvents && R.indexOf('events') >= 0) || hits(R, changed); }); }
  /** state names a component's view can receive: condition then/else wired into a view node for that component (ADR 0089) */
  function stateNames(w, compRef) { var out = [];
    Object.keys(w.blueprints || {}).forEach(function (id) { var b = w.blueprints[id], by = {}; (b.nodes || []).forEach(function (n) { by[n.id] = n; });
      (b.wires || []).forEach(function (x) { var f = by[x.from[0]], t = by[x.to[0]]; if (!f || !t || t.type !== 'view' || (t.p || {}).comp !== compRef || x.to[1] !== 'style') return;
        if (f.type === 'condition') [f.p.then || 'on', f.p.else].forEach(function (s) { if (s && out.indexOf(s) < 0) out.push(s); }); }); });
    return out; }
  var api = { charges: charges, ledger: ledger, sign: sign, monthOf: monthOf, monthDays: monthDays, occurrences: occurrences, itemFlags: itemFlags, dayMap: dayMap, stateNames: stateNames, NODES: NODES, graphOrder: graphOrder, access: access, deps: deps, evalBlueprint: evalBlueprint, computePass: computePass, apply: apply, pass: pass, scoreItem: scoreItem, pickAlts: pickAlts, sequence: sequence, dirtyFor: dirtyFor, clone: clone };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.JAtlasEval = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);

