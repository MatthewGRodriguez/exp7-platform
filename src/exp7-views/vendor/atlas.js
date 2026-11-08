/* inlined: atlas/atlas.js */
/* JEditor atlas model (M17, ADRs 0078-0083). One atlas = all items, joys, blueprints, components as data; references are
 * "<kind>:<id>" strings; no instances, no types. Works in node (require) and in the browser (window.JAtlasModel). */
(function (root) {
  'use strict';
  var KINDS = { item: 'items', joy: 'joys', bp: 'blueprints', comp: 'components' };
  var ID = /^[A-Za-z][A-Za-z0-9_]{0,40}$/;
  /* ADR 0107: stored values. New atlases are written as FORMAT; legacy 'jeditor-world' files load and save unchanged unless migrate()d.
     The self-reference kind in refs() is 'atlas'; legacy 'world' is still accepted by fixRef. */
  var FORMAT = 'jeditor-atlas', LEGACY_FORMAT = 'jeditor-world', FORMATS = [FORMAT, LEGACY_FORMAT];
  function SELF(k) { return k === 'atlas' || k === 'world'; }
  /** explicit migration: a copy with the current format value (nothing else changes) */
  function migrate(w) { var c = JSON.parse(JSON.stringify(w)); if (c && c.format === LEGACY_FORMAT) c.format = FORMAT; return c; }
  function empty(id, title) { return { format: FORMAT, version: 5, id: id || 'atlas', title: title || id || 'atlas', items: {}, joys: {}, blueprints: {}, components: {}, root: [], clock: { joy: 'clock', ms: 1000, on: false } }; }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function parse(ref) { var m = /^(item|joy|bp|comp):(.+)$/.exec(ref || ''); return m ? { kind: m[1], id: m[2] } : null; }
  function get(w, ref) { var r = parse(ref); return r ? (w[KINDS[r.kind]] || {})[r.id] || null : null; }
  /** every reference in the atlas: {from:"kind:id", path, to, broken} */
  function refs(w) {
    var out = [];
    function add(from, path, to) { if (typeof to !== 'string' || !to) return; out.push({ from: from, path: path, to: to, broken: !get(w, to) }); }
    Object.keys(w.items).forEach(function (id) { var it = w.items[id], f = 'item:' + id;
      Object.keys(it.factors || {}).forEach(function (j) { add(f, 'factors.' + j, 'joy:' + j); });
      if (it.alts) { (it.alts.members || []).forEach(function (m, i) { add(f, 'alts.members.' + i, m); }); if (it.alts.pref) add(f, 'alts.pref', it.alts.pref); (it.alts.unavail || []).forEach(function (m, i) { add(f, 'alts.unavail.' + i, m); }); }
      if (it.jreq) add(f, 'jreq', it.jreq); if (it.blueprint) add(f, 'blueprint', it.blueprint); });
    Object.keys(w.blueprints).forEach(function (id) { var b = w.blueprints[id], f = 'bp:' + id;
      (b.nodes || []).forEach(function (n) { var p = n.p || {};
        if (n.type === 'item' && p.item && p.item !== 'event' && p.item !== 'self') add(f, 'nodes.' + n.id + '.item', p.item);
        if (n.type === 'joy' && p.joy) add(f, 'nodes.' + n.id + '.joy', 'joy:' + p.joy);
        if ((n.type === 'component' || n.type === 'view') && p.comp) add(f, 'nodes.' + n.id + '.comp', p.comp);
        if (n.type === 'position' && p.parent) add(f, 'nodes.' + n.id + '.parent', p.parent); }); });
    Object.keys(w.components).forEach(function (id) { var c = w.components[id], f = 'comp:' + id;
      (c.items || []).forEach(function (r, i) { add(f, 'items.' + i, r); }); (c.blueprints || []).forEach(function (r, i) { add(f, 'blueprints.' + i, r); });
      (c.sub || []).forEach(function (s, i) { add(f, 'sub.' + i, s.comp); });
      var V = c.view || {}; (V.group || []).forEach(function (r, i) { add(f, 'view.group.' + i, r); }); if (V.target) add(f, 'view.target', V.target); if (V.source) add(f, 'view.source', V.source); if (V.asof) add(f, 'view.asof', V.asof); (V.controls || []).forEach(function (x, i) { if (x && x.joy) add(f, 'view.controls.' + i + '.joy', x.joy); }); });
    (w.root || []).forEach(function (r, i) { add('atlas', 'root.' + i, r); });
    if (w.clock && w.clock.on && w.clock.joy) add('atlas', 'clock.joy', 'joy:' + w.clock.joy);
    return out;
  }
  function broken(w) { return refs(w).filter(function (r) { return r.broken; }); }
  /** delete always works; referrers are left as they are (their refs become broken). Returns the now-broken refs. */
  function remove(w, ref) { var r = parse(ref); if (!r || !get(w, ref)) return []; delete w[KINDS[r.kind]][r.id]; return refs(w).filter(function (x) { return x.to === ref; }); }
  /** ADR 0088: repair one broken reference: point it at newRef, or drop it when newRef is null. Returns {ok, why} */
  function fixRef(w, r, newRef) {
    var src = SELF(r.from) ? w : get(w, r.from), P = r.path.split('.'); if (!src) return { ok: false, why: 'referrer is gone' };
    var nk = newRef ? parse(newRef) : null; if (newRef && !get(w, newRef)) return { ok: false, why: newRef + ' does not exist' };
    function arr(a, i) { i = +i; if (newRef) a[i] = newRef; else a.splice(i, 1); }
    if (SELF(r.from)) { if (P[0] === 'root') arr(w.root, P[1]); else if (P[0] === 'clock') { if (newRef) w.clock.joy = nk.id; else w.clock.on = false; } return { ok: true }; }
    var k = parse(r.from).kind;
    if (k === 'item') {
      if (P[0] === 'factors') { var wt = src.factors[P[1]]; delete src.factors[P[1]]; if (newRef) src.factors[nk.id] = wt; }
      else if (P[0] === 'alts') { if (P[1] === 'pref') src.alts.pref = newRef || null; else arr(src.alts[P[1]], P[2]); }
      else if (P[0] === 'jreq') { if (!newRef) src.jreq = null; else return setJreq(w, src.id, newRef); }
      else if (P[0] === 'blueprint') src.blueprint = newRef || null;
    } else if (k === 'bp') { var n = (src.nodes || []).filter(function (x) { return x.id === P[1]; })[0]; if (!n) return { ok: false, why: 'node gone' }; n.p = n.p || {};
      n.p[P[2]] = newRef ? (P[2] === 'joy' ? nk.id : newRef) : '';
    } else if (k === 'comp') { if (P[0] === 'view') { if (P[1] === 'group') arr(src.view.group, P[2]); else src.view[P[1]] = newRef || null; } else if (P[0] === 'sub') { if (newRef) src.sub[+P[1]].comp = newRef; else src.sub.splice(+P[1], 1); } else arr(src[P[0]], P[1]); }
    return { ok: true };
  }
  function uniq(w, kind, base) { var m = w[KINDS[kind]], id = base, i = 2; while (m[id]) id = base + '_' + (i++); return id; }
  /** template: one-time deep copy under a new id; no link, no origin recorded */
  function copy(w, ref, newId) { var r = parse(ref), src = get(w, ref); if (!src) return null; var id = uniq(w, r.kind, newId || r.id + '_copy'), c = clone(src); c.id = id; w[KINDS[r.kind]][id] = c; return r.kind + ':' + id; }
  /** jreq chain from an item: list of refs followed (item jreqs, plus items read by conditional blueprints) */
  function reach(w, ref, seen) {
    seen = seen || {}; var out = [];
    (function walk(x) { if (!x || seen[x]) return; seen[x] = 1; out.push(x); var o = get(w, x); if (!o) return; var r = parse(x);
      if (r.kind === 'item') walk(o.jreq);
      else if (r.kind === 'bp') (o.nodes || []).forEach(function (n) { if (n.type === 'item' && n.p && n.p.item && n.p.item !== 'event') walk(n.p.item); }); })(ref);
    return out;
  }
  function jreqChain(w, itemId) { var it = w.items[itemId]; return it && it.jreq ? reach(w, it.jreq) : []; }
  /** may item itemId get jreq = ref? refused when ref is the item itself or its chain reaches the item */
  function canSetJreq(w, itemId, ref) {
    if (ref == null || ref === '') return { ok: true };
    var self = 'item:' + itemId, p = parse(ref);
    if (!p || (p.kind !== 'item' && p.kind !== 'bp')) return { ok: false, why: 'jreq must reference an item or a blueprint' };
    if (ref === self) return { ok: false, why: 'an item cannot require itself' };
    var ch = reach(w, ref); if (ch.indexOf(self) >= 0) return { ok: false, why: 'jreq chain comes back to this item: ' + ch.slice(0, ch.indexOf(self) + 1).join(' → ') };
    return { ok: true };
  }
  function setJreq(w, itemId, ref) { var c = canSetJreq(w, itemId, ref); if (c.ok) w.items[itemId].jreq = ref || null; return c; }
  function validate(w) {
    var E = []; if (!w || FORMATS.indexOf(w.format) < 0) E.push('format must be ' + FORMAT + ' (or legacy jeditor-world)'); if (w && w.version !== 5) E.push('version must be 5');
    if (E.length) return E;
    Object.keys(KINDS).forEach(function (k) { var m = w[KINDS[k]]; if (!m || typeof m !== 'object') return E.push(KINDS[k] + ' missing');
      Object.keys(m).forEach(function (id) { if (!ID.test(id)) E.push(k + ':' + id + ' bad id'); if (m[id].id !== id) E.push(k + ':' + id + ' id mismatch'); }); });
    Object.keys(w.items).forEach(function (id) { var it = w.items[id]; if ('type' in it) E.push('item:' + id + ' has a type field (items have no type)');
      if (it.jreq) { var c = canSetJreq(w, id, it.jreq); if (!c.ok) E.push('item:' + id + ' jreq: ' + c.why); } });
    return E;
  }
  /* records */
  function newItem(w, name) { var id = uniq(w, 'item', slug(name)); w.items[id] = { id: id, name: name, values: {}, factors: {}, state: {}, alts: null, jreq: null, blueprint: null }; return 'item:' + id; }
  function newJoy(w, name, value) { var id = uniq(w, 'joy', slug(name)); w.joys[id] = { id: id, name: name, value: value || 0 }; return 'joy:' + id; }
  function newBlueprint(w, name) { var id = uniq(w, 'bp', slug(name)); w.blueprints[id] = { id: id, name: name, nodes: [], wires: [] }; return 'bp:' + id; }
  function newComponent(w, name) { var id = uniq(w, 'comp', slug(name)); w.components[id] = { id: id, name: name, view: { layout: 'stack', theme: { tokens: { bg: '#121212', fg: '#e8e8e8', accent: '#e0af68' } }, item: { show: [] }, states: {} }, items: [], blueprints: [], state: {}, sub: [] }; return 'comp:' + id; }
  function slug(s) { var t = String(s || 'x').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 30); if (!/^[a-z]/.test(t)) t = 'x' + t; return t; }
  /** built-in starters (copied once, ADR 0083) */
  var STARTERS = {
    item: { id: 'item', name: 'Item', values: { cost: 0 }, factors: {}, state: {}, alts: null, jreq: null, blueprint: null },
    joy: { id: 'joy', name: 'Joy', value: 0 },
    comp_list: { id: 'list', name: 'List', view: { layout: 'stack', theme: { tokens: { bg: '#121212', fg: '#e8e8e8', accent: '#e0af68' } }, item: { show: [] }, states: { bad: { bg: '#3a1418', border: '#f7768e', sm: 'invalid', anim: 'shake' }, good: { bg: '#14301f', border: '#9ece6a', sm: 'selected', anim: 'none' } } }, items: [], blueprints: [], state: {}, sub: [] }
  };
  /** ADR 0091: calendar template = a one-time copy of plain atlas records: a calendar component (day grid, Board/Plan switch),
   *  a Board and a Plan component grouped under it by reference, and three editable blueprints (day workload, dependency
   *  conflicts, drop-onto-day). No link back, no origin, no instances. month: 'YYYY-MM' (default: this month). Returns refs. */
  function calendarTemplate(w, name, month) {
    name = name || 'Calendar'; var b = slug(name), cal = uniq(w, 'comp', b), brd = uniq(w, 'comp', b + '_board'), pl = uniq(w, 'comp', b + '_plan');
    var bw = uniq(w, 'bp', b + '_workload'), bc = uniq(w, 'bp', b + '_depconflict'), bd = uniq(w, 'bp', b + '_drop');
    if (!month) { var d = new Date(); month = d.getFullYear() + '-' + (d.getMonth() < 9 ? '0' : '') + (d.getMonth() + 1); }
    var T = function (a) { return { tokens: { bg: '#121212', fg: '#e8e8e8', accent: a } }; }, C = function (k) { return 'comp:' + k; };
    w.components[cal] = { id: cal, name: name, view: { layout: 'calendar', month: month, switch: true, group: [C(brd), C(pl)], theme: T('#7aa2f7'), item: { show: [] },
      states: { busy: { bg: '#3a2a10', border: '#e0af68', sm: 'idle', anim: 'none' }, overload: { bg: '#3a1418', border: '#f7768e', sm: 'invalid', anim: 'shake' } } },
      items: [], blueprints: ['bp:' + bw, 'bp:' + bd], state: { show: C(brd) }, sub: [{ comp: C(brd), pos: {} }, { comp: C(pl), pos: {} }] };
    w.components[brd] = { id: brd, name: name + ' · Board', view: { layout: 'board', target: C(cal), sort: 'name', filter: 'all', theme: T('#9ece6a'), item: { show: ['date', 'repeat'] }, states: {} }, items: [], blueprints: [], state: {}, sub: [] };
    w.components[pl] = { id: pl, name: name + ' · Plan', view: { layout: 'plan', source: C(cal), theme: T('#bb9af7'), item: { show: [] }, states: { conflict: { bg: '#3a1418', border: '#f7768e', sm: 'invalid', anim: 'shake' } } }, items: [], blueprints: ['bp:' + bc], state: {}, sub: [] };
    var N = function (id, type, p, x, y) { return { id: id, type: type, p: p, x: x, y: y }; }, Wr = function (a, ap, z, zp) { return { from: [a, ap], to: [z, zp] }; };
    w.blueprints[bw] = { id: bw, name: name + ' · day workload', nodes: [N('d1', 'days', { comp: C(cal), measure: 'count' }, 20, 20), N('c1', 'condition', { op: '>=', value: 2, then: 'busy', else: '' }, 270, 20), N('v1', 'view', { comp: C(cal) }, 520, 20)],
      wires: [Wr('d1', 'values', 'c1', 'a'), Wr('c1', 'state', 'v1', 'style')] };
    w.blueprints[bc] = { id: bc, name: name + ' · dependency conflict', nodes: [N('d1', 'days', { comp: C(cal), measure: 'conflicts' }, 20, 20), N('c1', 'condition', { op: '>', value: 0, then: 'conflict', else: '' }, 270, 20), N('v1', 'view', { comp: C(pl) }, 520, 20)],
      wires: [Wr('d1', 'values', 'c1', 'a'), Wr('c1', 'state', 'v1', 'style')] };
    w.blueprints[bd] = { id: bd, name: name + ' · drop onto day', nodes: [N('v1', 'view', { comp: C(cal) }, 20, 20), N('c1', 'condition', { op: 'event', event: 'drop' }, 270, 20), N('i1', 'item', { item: 'event', field: 'date' }, 520, 20)],
      wires: [Wr('v1', 'events', 'c1', 'a'), Wr('c1', 'target', 'i1', 'set')] };
    return { cal: C(cal), board: C(brd), plan: C(pl), blueprints: ['bp:' + bw, 'bp:' + bc, 'bp:' + bd] };
  }
  /** M19 (ADRs 0095-0098): money preset = only joys, blueprints, states and sections on a calendar; nothing money-specific in code.
   *  Joys: opening cash, warning (default 1000), margin (default 0.1), as-of. Blueprint <cal>_cash: accumulate (opening) -> per-day
   *  conditions < 0 bad, < warning low, < warning*(1+margin) tight, + day workload busy -> merge -> calendar style; balance -> day labels.
   *  Sections (optional subs of the plan): Critical days, Previously occurred (before as-of). Returns refs. */
  function moneyPreset(w, calRef, o) { o = o || {}; var cid = (calRef || '').replace(/^comp:/, ''), c = w.components[cid]; if (!c) return null; var C = function (k) { return 'comp:' + k; };
    var J = function (k, n, v) { var id = uniq(w, 'joy', cid + '_' + k); w.joys[id] = { id: id, name: n, value: v }; return id; };
    var jo = J('opening', 'Opening cash', o.opening != null ? +o.opening : 0), jw = J('warning', 'Warning below', o.warning != null ? +o.warning : 1000), jm = J('margin', 'Margin', o.margin != null ? +o.margin : 0.1), ja = J('asof', 'As of', o.asof || '');
    Object.assign(c.view.states, { bad: { bg: '#3a1418', border: '#f7768e', sm: 'invalid', anim: 'shake', label: 'below 0' }, low: { bg: '#3a2a10', border: '#ff9e64', sm: 'idle', anim: 'none', label: 'below warning' },
      tight: { bg: '#2e2a14', border: '#e0af68', sm: 'idle', anim: 'none', label: 'within margin' } });
    if (c.view.states.busy) c.view.states.busy.label = '2+ items';
    c.view.legend = true; c.view.labelFmt = 'money'; c.view.controls = [{ joy: 'joy:' + jo, step: 100 }, { joy: 'joy:' + jw, step: 100 }, { joy: 'joy:' + jm, step: 0.05 }]; c.view.asof = 'joy:' + ja; c.view.rails = true; c.view.detail = true; c.view.range = true;
    var b = c.blueprints.map(function (r) { return r.replace(/^bp:/, ''); }).filter(function (id) { return /_workload$/.test(id); })[0]; if (b) { delete w.blueprints[b]; c.blueprints = c.blueprints.filter(function (r) { return r !== 'bp:' + b; }); }
    var bc = uniq(w, 'bp', cid + '_cash'), N = function (id, type, p, x, y) { return { id: id, type: type, p: p, x: x, y: y }; }, Wr = function (a, ap, z, zp) { return { from: [a, ap], to: [z, zp] }; };
    w.blueprints[bc] = { id: bc, name: c.name + ' · cash after bills', nodes: [N('jo', 'joy', { joy: jo }, 20, 20), N('jw', 'joy', { joy: jw }, 20, 140), N('jm', 'joy', { joy: jm }, 20, 260),
        N('acc', 'accumulate', { comp: C(cid), field: 'amount' }, 250, 20), N('mul', 'math', { op: 'mul' }, 250, 200), N('add', 'math', { op: 'add' }, 450, 200),
        N('c0', 'condition', { op: '<', value: 0, then: 'bad', else: '' }, 520, 20), N('c1', 'condition', { op: '<', value: 0, then: 'low', else: '' }, 520, 110), N('c2', 'condition', { op: '<', value: 0, then: 'tight', else: '' }, 700, 200),
        N('dc', 'days', { comp: C(cid), measure: 'count' }, 250, 330), N('c3', 'condition', { op: '>=', value: 2, then: 'busy', else: '' }, 520, 330),
        N('mg', 'merge', {}, 900, 60), N('v1', 'view', { comp: C(cid) }, 1100, 60)],
      wires: [Wr('jo', 'value', 'acc', 'opening'), Wr('acc', 'values', 'c0', 'a'), Wr('acc', 'values', 'c1', 'a'), Wr('jw', 'value', 'c1', 'b'), Wr('jw', 'value', 'mul', 'a'), Wr('jm', 'value', 'mul', 'b'), Wr('jw', 'value', 'add', 'a'), Wr('mul', 'out', 'add', 'b'),
        Wr('acc', 'values', 'c2', 'a'), Wr('add', 'out', 'c2', 'b'), Wr('dc', 'values', 'c3', 'a'), Wr('c0', 'state', 'mg', 'a'), Wr('c1', 'state', 'mg', 'b'), Wr('c2', 'state', 'mg', 'c'), Wr('c3', 'state', 'mg', 'd'), Wr('mg', 'out', 'v1', 'style'), Wr('acc', 'values', 'v1', 'label')] };
    c.blueprints.push('bp:' + bc);
    var plan = (c.view.group || []).map(function (g) { return w.components[g.replace(/^comp:/, '')]; }).filter(function (p) { return p && p.view.layout === 'plan'; })[0], secs = [];
    [['critical', 'Critical days', { rule: 'daystate', states: ['bad', 'low'] }], ['occurred', 'Previously occurred', { rule: 'past' }], ['upcoming', 'Upcoming', { rule: 'future' }]].forEach(function (x) {
      var id = uniq(w, 'comp', cid + '_' + x[0]); w.components[id] = { id: id, name: x[1], view: Object.assign({ layout: 'section', source: C(cid), theme: { tokens: { bg: '#141414', fg: '#e8e8e8', accent: '#7dcfff' } }, item: { show: [] }, states: {} }, x[2]), items: [], blueprints: [], state: {}, sub: [] }; secs.push(C(id)); });
    if (plan) plan.sub = (plan.sub || []).concat(secs.map(function (r) { return { comp: r, pos: {} }; }));
    return { joys: ['joy:' + jo, 'joy:' + jw, 'joy:' + jm, 'joy:' + ja], blueprint: 'bp:' + bc, sections: secs };
  }
  function moneyCalendarTemplate(w, name, month) { var T = calendarTemplate(w, name || 'Money', month), P = moneyPreset(w, T.cal, {}); T.money = P; T.blueprints = T.blueprints.filter(function (r) { return w.blueprints[r.slice(3)]; }).concat([P.blueprint]); return T; }
  var TEMPLATES = { calendar: { name: 'Calendar (Board + Plan)', make: calendarTemplate }, money: { name: 'Money calendar (cash after bills)', make: moneyCalendarTemplate } };
  function fromStarter(w, key, name) { var s = STARTERS[key]; if (!s) return null; var kind = key === 'item' ? 'item' : key === 'joy' ? 'joy' : 'comp', id = uniq(w, kind, slug(name || s.name)), c = clone(s); c.id = id; c.name = name || s.name; w[KINDS[kind]][id] = c; return kind + ':' + id; }
  /** alternative pick (ADR 0079): userPick > pref > highest score among available members. score(ref) supplied by the evaluator */
  /** ADR 0086: rank available alternatives with the embedded Exp6 engine: one JGroup, one JAction per member whose jmethod
   *  returns the member's blueprint score; Best() (method best) or SimulatedBest() (method sim). First of the order wins. */
  function exp6Order(X, avail, score, sim) {
    var g = new X.JGroup(); g.name = 'alternatives'; var byAct = new Map();
    avail.forEach(function (m) { var s = score ? score(m) : 0; var a = new X.JAction(function () { return s; }, null, 0, 0, new X.Joy(1, Number.MIN_VALUE), new X.Joy(1, Number.MIN_VALUE)); a.name = m; byAct.set(m, s); g.Consider(a); });
    var o = sim ? g.SimulatedBest() : g.Best(); return (o || []).map(function (a) { return a && a.name; }).filter(function (n) { return byAct.has(n); }).map(function (n) { return { ref: n, score: byAct.get(n) }; });
  }
  function pickAlt(w, itemId, score, X) {
    var it = w.items[itemId]; if (!it || !it.alts) return null; var A = it.alts, un = A.unavail || [];
    /* M20d (ADR 0103): values.needs = ['item:x' | 'item:x#KEY'] on the item or a member: met when x currently picks a member (whose key starts with KEY) */
    var met = function (o) { return ((o && o.values && o.values.needs) || []).every(function (n) { var q = String(n).split('#'), t = get(w, q[0]), pk = t && t.state && (t.state.userPick || t.state.pick), pm = pk && get(w, pk);
      if (!pm) return false; if (!q[1]) return true; var k = String((pm.values || {}).key || ''); return k === q[1] || k.indexOf(q[1]) === 0; }); };
    if (!met(it)) return null;
    var avail = (A.members || []).filter(function (m) { return get(w, m) && un.indexOf(m) < 0 && met(get(w, m)); });
    if (!avail.length) return null;
    var up = it.state && it.state.userPick; if (up && avail.indexOf(up) >= 0) return { pick: up, why: 'user' };
    if (A.pref && avail.indexOf(A.pref) >= 0) return { pick: A.pref, why: 'pref' };
    if (X && X.JGroup) { var ord = exp6Order(X, avail, score, A.method === 'sim'); if (ord.length) return { pick: ord[0].ref, why: A.method === 'sim' ? 'exp6 SimulatedBest' : 'exp6 Best', score: ord[0].score, order: ord.map(function (o) { return o.ref; }) }; }
    var best = avail[0], bs = -Infinity; avail.forEach(function (m) { var s = score ? score(m) : 0; if (s > bs) { bs = s; best = m; } });
    return { pick: best, why: 'best', score: bs };
  }
  var api = { KINDS: KINDS, FORMAT: FORMAT, LEGACY_FORMAT: LEGACY_FORMAT, FORMATS: FORMATS, migrate: migrate, empty: empty, clone: clone, parse: parse, get: get, refs: refs, broken: broken, remove: remove, copy: copy, uniq: uniq, reach: reach, jreqChain: jreqChain, canSetJreq: canSetJreq, setJreq: setJreq, validate: validate,
    newItem: newItem, newJoy: newJoy, newBlueprint: newBlueprint, newComponent: newComponent, slug: slug, STARTERS: STARTERS, fromStarter: fromStarter, calendarTemplate: calendarTemplate, moneyPreset: moneyPreset, moneyCalendarTemplate: moneyCalendarTemplate, TEMPLATES: TEMPLATES, pickAlt: pickAlt, exp6Order: exp6Order, fixRef: fixRef };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.JAtlasModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);

