/* inlined: builder/blueprint/jbp.js */
/* JBlueprint (M6, ADR 0033): JEditor's port of ranking_ui MODEL TOOLS node graphs (vendor/model_tools_script.js
   `ModelToolsScript`, read-only reference). Graph = {version, nodes:[{id,type,x,y,p}], edges:[{from:[node,port], to:[node,port]}]}.
   Port order per ADR 0022: stage 1 = data.*, jfactor.*, board.emit (+ math ops and the score.out sink, needed to score);
   stage 2 = mech.*, econ.*; stage 3 = view/chart/3D. Only stage 1 compiles in M6; stage 2/3 nodes are listed (disabled).
   Typed ports (portTypeOf/canConnect), one edge per input port, no cycles, exactly one score.out (as compile() in the reference). */
(function (root) {
  'use strict';
  var N = {
    'data.actField': { label: 'item field', ins: [], outs: ['out'], cat: 'Data', stage: 1, params: { field: 'field' } },
    'data.boardMax': { label: 'board max', ins: [], outs: ['out'], cat: 'Data', stage: 1, params: { field: 'field' } },
    'data.const':    { label: 'const', ins: [], outs: ['out'], cat: 'Data', stage: 1, params: { value: 'number' } },
    'jfactor.xMax':  { label: 'jfactor xMax', ins: ['in'], outs: ['out'], cat: 'Jfactor', stage: 1 },
    'jfactor.yMax':  { label: 'jfactor yMax', ins: ['in'], outs: ['out'], cat: 'Jfactor', stage: 1 },
    'jfactor.call':  { label: 'jfactor call (jmethod 2)', ins: ['x', 'y', 'xMax', 'yMax'], outs: ['out'], cat: 'Jfactor', stage: 1 },
    /* M12 (ADR 0051/0052): universal items + joys. item.value / item.factor read the item (values and scoring factors);
       joy.value / joy.jmax read a shared joy (registry value, per-item override first). */
    'item.value':    { label: 'item value', ins: [], outs: ['out'], cat: 'Item', stage: 1, params: { field: 'field' } },
    'item.factor':   { label: 'item factor', ins: [], outs: ['out'], cat: 'Item', stage: 1, params: { field: 'factor' } },
    'joy.value':     { label: 'joy', ins: [], outs: ['out'], cat: 'Joy', stage: 1, params: { joy: 'joy' } },
    'joy.jmax':      { label: 'joy jmax', ins: [], outs: ['out'], cat: 'Joy', stage: 1, params: { joy: 'joy' } },
    'board.emit':    { label: 'emit Board', ins: [], outs: ['count'], cat: 'Board', stage: 1 },
    'op.add': { label: 'add +', ins: ['a', 'b'], outs: ['out'], cat: 'Math', stage: 1 }, 'op.sub': { label: 'sub −', ins: ['a', 'b'], outs: ['out'], cat: 'Math', stage: 1 },
    'op.mul': { label: 'mul ×', ins: ['a', 'b'], outs: ['out'], cat: 'Math', stage: 1 }, 'op.div': { label: 'div ÷', ins: ['a', 'b'], outs: ['out'], cat: 'Math', stage: 1 },
    'op.min': { label: 'min', ins: ['a', 'b'], outs: ['out'], cat: 'Math', stage: 1 }, 'op.max': { label: 'max', ins: ['a', 'b'], outs: ['out'], cat: 'Math', stage: 1 },
    'op.clamp01': { label: 'clamp01', ins: ['a'], outs: ['out'], cat: 'Math', stage: 1 },
    'score.out': { label: 'score out', ins: ['in'], outs: [], cat: 'Out', stage: 1, sink: true },
    /* stage 2 (listed, not compiled in M6) */
    'mech.clamp': { label: 'mech clamp', ins: ['a', 'lo', 'hi'], outs: ['out'], cat: 'Mech', stage: 2 },
    'mech.moneyDisutility': { label: 'mech $disutil', ins: ['cost', 'M', 't', 'rate'], outs: ['out'], cat: 'Mech', stage: 2 },
    'econ.tripCost': { label: 'trip cost', ins: ['minutes', 'cost'], outs: ['friction'], cat: 'Economy', stage: 2 },
    'econ.benefitNet': { label: 'benefit net', ins: ['benefit', 'friction', 'supply', 'demand', 'conflict'], outs: ['net', 'emitOk'], cat: 'Economy', stage: 2 },
    /* stage 3 */
    'view.curve': { label: 'Curve view', ins: ['xMax', 'yMax'], outs: ['idealY', 'xMax', 'yMax', 'scoreFromCurve'], cat: 'View', stage: 3 },
    'view.3d': { label: '3D view', ins: [], outs: ['bounds', 'ok'], cat: 'View', stage: 3 },
    'view.out': { label: 'view out', ins: ['curve', 'space3d', 'view'], outs: [], cat: 'Out', stage: 3, sink: true }
  };
  var STAGE_ENABLED = 1;
  function portTypeOf(type, port, dir) { if (type === 'board.emit' && dir === 'out') return 'count'; if (/^view\./.test(type)) return 'view'; return 'num'; }
  function byId(g) { var m = {}; (g.nodes || []).forEach(function (n) { m[n.id] = n; }); return m; }
  function reaches(g, from, to) { var seen = {}, st = [from]; while (st.length) { var c = st.pop(); if (c === to) return true; if (seen[c]) continue; seen[c] = 1; (g.edges || []).forEach(function (e) { if (e.from[0] === c) st.push(e.to[0]); }); } return false; }
  /** Can out-port (a,ap) connect to in-port (b,bp)? Returns {ok, why}. */
  function canConnect(g, a, ap, b, bp) {
    var M = byId(g), A = M[a], B = M[b]; if (!A || !B) return { ok: false, why: 'no node' }; if (a === b) return { ok: false, why: 'self' };
    var dA = N[A.type], dB = N[B.type]; if (!dA || !dB) return { ok: false, why: 'unknown type' };
    if (dA.outs.indexOf(ap) < 0 || dB.ins.indexOf(bp) < 0) return { ok: false, why: 'no port' };
    var ta = portTypeOf(A.type, ap, 'out'), tb = portTypeOf(B.type, bp, 'in'); if (!(ta === tb || (ta === 'count' && tb === 'num'))) return { ok: false, why: 'type ' + ta + '→' + tb };
    if ((g.edges || []).some(function (e) { return e.to[0] === b && e.to[1] === bp; })) return { ok: false, why: 'input taken' };
    if (reaches(g, b, a)) return { ok: false, why: 'cycle' };
    return { ok: true };
  }
  /** Compile a graph for an item type. fields = [{id,...}]. Returns {ok, errors[], emits, score(item, ctx)} — ctx.max[field] = board max. */
  function compile(g, fields, opt) {
    var errs = [], M = byId(g), fid = {}, fac = {}; (fields || []).forEach(function (f) { fid[f.id] = 1; if (f.factor) fac[f.id] = 1; }); opt = opt || {};
    (g.nodes || []).forEach(function (n) { var d = N[n.type]; if (!d) errs.push(n.id + ': unknown ' + n.type); else if (d.stage > STAGE_ENABLED) errs.push(n.id + ': ' + n.type + ' is stage ' + d.stage + ' (not yet compiled)');
      if (d && d.params && d.params.field && !fid[(n.p || {}).field]) errs.push(n.id + ': field "' + ((n.p || {}).field || '') + '" is not an item field');
      if (d && n.type === 'item.factor' && fid[(n.p || {}).field] && !fac[(n.p || {}).field]) errs.push(n.id + ': "' + n.p.field + '" is a value, not a scoring factor');
      if (d && /^joy\./.test(n.type) && (!opt.joys || !opt.joys[(n.p || {}).joy])) errs.push(n.id + ': unknown joy "' + ((n.p || {}).joy || '') + '"'); });
    var outs = (g.nodes || []).filter(function (n) { return n.type === 'score.out'; }); if (outs.length !== 1) errs.push('needs exactly one score.out (has ' + outs.length + ')');
    var inE = {}; (g.edges || []).forEach(function (e) { inE[e.to[0] + ':' + e.to[1]] = e.from; });
    if (outs.length === 1 && !inE[outs[0].id + ':in']) errs.push('score.out is not connected');
    var emits = (g.nodes || []).some(function (n) { return n.type === 'board.emit'; });
    if (errs.length) return { ok: false, errors: errs, emits: emits, score: null };
    function val(id, port, it, ctx, memo) { var k = id + ':' + port; if (k in memo) return memo[k]; var n = M[id], p = n.p || {};
      function inp(q, dflt) { var f = inE[id + ':' + q]; return f ? val(f[0], f[1], it, ctx, memo) : dflt; }
      var v, a, b;
      switch (n.type) {
        case 'data.actField': v = Number(it[p.field]) || 0; break;
        case 'data.boardMax': v = Number((ctx.max || {})[p.field]) || 0; break;
        case 'data.const': v = Number(p.value) || 0; break;
        case 'item.value': case 'item.factor': v = Number(it[p.field]) || 0; break;
        case 'joy.value': v = ctx.joy ? Number(ctx.joy(p.joy, 'value', it)) || 0 : 0; break;
        case 'joy.jmax': v = ctx.joy ? Number(ctx.joy(p.joy, 'jmax', it)) || 0 : 0; break;
        case 'jfactor.xMax': case 'jfactor.yMax': v = inp('in', 1); break;
        case 'jfactor.call': { var x = inp('x', 0), y = inp('y', 0), xm = inp('xMax', 1) || 1, ym = inp('yMax', 1) || 1; v = 0.5 * Math.abs(x / xm) + 0.5 * Math.abs(y / ym); break; } /* = Exp6 scoreRowJs methodId 2 on normalised x,y */
        case 'board.emit': v = 1; break;
        case 'op.add': v = inp('a', 0) + inp('b', 0); break; case 'op.sub': v = inp('a', 0) - inp('b', 0); break;
        case 'op.mul': v = inp('a', 0) * inp('b', 1); break; case 'op.div': b = inp('b', 1); v = b ? inp('a', 0) / b : 0; break;
        case 'op.min': v = Math.min(inp('a', 0), inp('b', 0)); break; case 'op.max': v = Math.max(inp('a', 0), inp('b', 0)); break;
        case 'op.clamp01': a = inp('a', 0); v = Math.max(0, Math.min(1, a)); break;
        case 'score.out': v = inp('in', 0); break;
        default: v = NaN;
      }
      memo[k] = v; return v; }
    return { ok: true, errors: [], emits: emits, score: function (it, ctx) { return val(outs[0].id, 'sink', it, ctx || {}, {}); } };
  }
  var API = { NODES: N, STAGE_ENABLED: STAGE_ENABLED, portTypeOf: portTypeOf, canConnect: canConnect, compile: compile };
  root.JBlueprint = API; if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);

