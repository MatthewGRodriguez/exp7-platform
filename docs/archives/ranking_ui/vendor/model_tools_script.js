/**
 * ModelToolsScript — Unreal Blueprint–style visual script graphs for jmethod score (easy186).
 * easy187: econ.factorCosts — factor-weighted Money/Time/Days friction (WB.factorOrder harmonic); rewire localEconomy/localWeekend + simNet.
 * easy187: ingestLocalEconomy stub (status:stub / honesty:no live listings yet) + paste/import firms JSON.
 * easy184: economy.firms[].services SoT → per-service simNet gate → Board (multi-firm coupling).
 * easy183: econ.* sim nodes (firmSupply/clientDemand/scheduleConflict/tripCost/benefitNet) wire localEconomyGraph.
 * easy182: localEconomy ([REDACTED-CITY]/[REDACTED-LOCATION] firms+services EXAMPLE priors) → benefit-gated boardItems → Board.
 * easy181: board.emit + localWeekend ([REDACTED-CITY]/[REDACTED-LOCATION] weekend options) → idea.boardItems → Board.
 * easy177: morningCanvasRoi builtin — log1p diminishing returns on structured morning hours (08–15).
 * easy176: view.sample + compileView samples wired idealY(x) for PREVIEW; CAD curve = sugar/fallback.
 * easy175: optional jmethod packs (builtins library); empty New; subgraphs/collapse; auto-layout.
 * easy174: builtins expand mech into raw +/* √ log1p pow clamp hash01; pure place graphs; forkable seeds.
 * easy173: mech.* primitives + builtin graphs model JF formulas (no jfactor.ageTick/moneyToHappy/debtPay scorers).
 * easy172: typed wires (number/view/world/jgroup/place/any) + canConnect; jfactor.browse; sim.step; probePins.
 * easy171: world.add.* outs xyz; measure.distance refs; curve-view depth lives in ranking_ui.
 * easy170: place.out + place.fromAct; compilePlace; builtin place subgraphs; editor pan/zoom/undo live in ranking_ui.
 * Domain xMax/yMax + x/y/Jgroup: prefer wires from jfactor.* / data.* / input.* into view.curve & score — params are fallback only (not a forced lock).
 * JoyFactors APIs used by jfactor.*: scoreMoneyToHappy, daysCapacityWeight, scoreAgeTick, scoreDebtPay, ageT, externalFactor (see joy_factors.js).
 * easy169: builtin graphs match METHODS score (raw, not forced clamp01); score.passthroughY; PREVIEW = view.out SoT via register.
 * Safe interpreter only (known node ops — no eval of free text).
 * Persist: WB.modelTools.jmethods[id].script + .view (viewGraph / draft.view)
 * Law: Blueprint owns Curve view + 3D view nodes; world via BP; PREVIEW via view.out. Legacy cad.* -> view.* on normalize.
 * No world point id / spatial.pos — jmethods are not scene objects.
 */
(function (global) {
  'use strict';

  var NODE_META = {
    /* Inputs */
    'input.x':     { label: 'input x',    ins: ['in'], outs: ['out'], kind: 'in', cat: 'Inputs' },
    'input.y':     { label: 'input y',    ins: ['in'], outs: ['out'], kind: 'in', cat: 'Inputs' },
    'input.xMax':  { label: 'input xMax', ins: ['in'], outs: ['out'], kind: 'in', cat: 'Inputs' },
    'input.yMax':  { label: 'input yMax', ins: ['in'], outs: ['out'], kind: 'in', cat: 'Inputs' },
    'input.act':   { label: 'act fields', ins: [], outs: ['amount', 'days', 'hours'], kind: 'in', cat: 'Inputs' },
    /* Place — landing {x,y,label} authored in graph (METHODS.place SoT when place.out present) */
    'place.fromAct': { label: 'place fromAct', ins: [], outs: ['x', 'y'], kind: 'place', cat: 'Place' },
    'place.out':     { label: 'place out',     ins: ['x', 'y'], outs: [], kind: 'placesink', cat: 'Place' },
    /* JoyFactors / jfactor — pull placement, domain, Jgroup, and real JF scorers into Blueprint */
    'jfactor.x':      { label: 'jfactor x',     ins: [], outs: ['out'], kind: 'jfactor', cat: 'Jfactor' },
    'jfactor.y':      { label: 'jfactor y',     ins: [], outs: ['out'], kind: 'jfactor', cat: 'Jfactor' },
    'jfactor.xMax':   { label: 'jfactor xMax',  ins: ['in'], outs: ['out'], kind: 'jfactor', cat: 'Jfactor' },
    'jfactor.yMax':   { label: 'jfactor yMax',  ins: ['in'], outs: ['out'], kind: 'jfactor', cat: 'Jfactor' },
    'jfactor.jgroup': { label: 'jfactor jgroup',ins: [], outs: ['out'], kind: 'jfactor', cat: 'Jfactor' },
    'jfactor.call':   { label: 'jfactor call',  ins: ['x', 'y'], outs: ['out'], kind: 'jfactor', cat: 'Jfactor' },
    'jfactor.moneyToHappy': { label: 'JF money→H', ins: ['x', 'y'], outs: ['out'], kind: 'jfactor', cat: 'Jfactor' },
    'jfactor.daysCapacity': { label: 'JF daysCap', ins: ['days', 'D'], outs: ['out'], kind: 'jfactor', cat: 'Jfactor' },
    'jfactor.ageTick': { label: 'JF ageTick', ins: ['x'], outs: ['out'], kind: 'jfactor', cat: 'Jfactor' },
    'jfactor.debtPay': { label: 'JF debtPay', ins: ['x', 'y'], outs: ['out'], kind: 'jfactor', cat: 'Jfactor' },
    'jfactor.external': { label: 'JF external', ins: [], outs: ['out'], kind: 'jfactor', cat: 'Jfactor' },
    /* easy172: browse real JoyFactors exports (listFactors / api keys) — params.key */
    'jfactor.browse': { label: 'JF browse', ins: ['x', 'y'], outs: ['out'], kind: 'jfactor', cat: 'Jfactor' },
    /* Mechanism primitives — named JF formula bodies (not score wrappers) */
    'mech.ageT': { label: 'mech ageT', ins: [], outs: ['out'], kind: 'mech', cat: 'Mech' },
    'mech.hash01': { label: 'mech hash01', ins: ['a'], outs: ['out'], kind: 'mech', cat: 'Mech' },
    'mech.clamp': { label: 'mech clamp', ins: ['a', 'lo', 'hi'], outs: ['out'], kind: 'mech', cat: 'Mech' },
    'mech.happinessAgeWeight': { label: 'mech hAgeW', ins: ['t'], outs: ['out'], kind: 'mech', cat: 'Mech' },
    'mech.moneyDisutility': { label: 'mech $disutil', ins: ['cost', 'M', 't', 'rate'], outs: ['out'], kind: 'mech', cat: 'Mech' },
    'mech.externalFactor': { label: 'mech external', ins: ['t', 'E', 'Emax'], outs: ['out'], kind: 'mech', cat: 'Mech' },
    'mech.daysCapacityWeight': { label: 'mech daysCap', ins: ['days', 'D'], outs: ['out'], kind: 'mech', cat: 'Mech' },
    /* Data-pull — board / act / horizon at score time (feed domain ports) */
    'data.boardMax': { label: 'board max',  ins: [], outs: ['out'], kind: 'data', cat: 'Data' },
    'data.actField': { label: 'act field',  ins: [], outs: ['out'], kind: 'data', cat: 'Data' },
    'data.horizon':  { label: 'horizon',    ins: [], outs: ['out'], kind: 'data', cat: 'Data' },
    'data.const':    { label: 'data const', ins: [], outs: ['out'], kind: 'const', cat: 'Data' },
    'data.domain':   { label: 'domain (board)', ins: [], outs: ['out'], kind: 'data', cat: 'Data' },
    'data.ctxField': { label: 'ctx field',  ins: [], outs: ['out'], kind: 'data', cat: 'Data' },
    /* easy179: emitter — specs also live on jmethod.idea.boardItems; Apply/Emit upserts Board */
    'board.emit':   { label: 'emit Board', ins: [], outs: ['count'], kind: 'board', cat: 'Board' },
    /* Consts (under Math palette) */
    'const.number':{ label: 'const',      ins: [], outs: ['out'], kind: 'const', cat: 'Math' },
    'const':       { label: 'const',      ins: [], outs: ['out'], kind: 'const', cat: 'Math' },
    /* Math */
    'op.add':      { label: 'add +',      ins: ['a', 'b'], outs: ['out'], kind: 'bin', cat: 'Math' },
    'op.sub':      { label: 'sub −',      ins: ['a', 'b'], outs: ['out'], kind: 'bin', cat: 'Math' },
    'op.mul':      { label: 'mul ×',      ins: ['a', 'b'], outs: ['out'], kind: 'bin', cat: 'Math' },
    'op.div':      { label: 'div ÷',      ins: ['a', 'b'], outs: ['out'], kind: 'bin', cat: 'Math' },
    'op.min':      { label: 'min',        ins: ['a', 'b'], outs: ['out'], kind: 'bin', cat: 'Math' },
    'op.max':      { label: 'max',        ins: ['a', 'b'], outs: ['out'], kind: 'bin', cat: 'Math' },
    'op.sqrt':     { label: '√',          ins: ['a'], outs: ['out'], kind: 'unary', cat: 'Math' },
    'op.log1p':    { label: 'log1p',      ins: ['a'], outs: ['out'], kind: 'unary', cat: 'Math' },
    'op.pow':      { label: 'pow ^',      ins: ['a', 'b'], outs: ['out'], kind: 'bin', cat: 'Math' },
    'op.clamp01':  { label: 'clamp01',    ins: ['a'], outs: ['out'], kind: 'unary', cat: 'Math' },
    'op.abs':      { label: 'abs',        ins: ['a'], outs: ['out'], kind: 'unary', cat: 'Math' },
    'op.neg':      { label: 'neg −',      ins: ['a'], outs: ['out'], kind: 'unary', cat: 'Math' },
    'op.clamp':    { label: 'clamp',      ins: ['a', 'lo', 'hi'], outs: ['out'], kind: 'bin', cat: 'Math' },
    'op.hash01':   { label: 'hash01',     ins: ['t'], outs: ['out'], kind: 'unary', cat: 'Math' },
    'op.firstPos': { label: 'firstPos',   ins: ['a', 'b', 'c'], outs: ['out'], kind: 'bin', cat: 'Math' },
    /* View — curve + 3D live inside Blueprint (legacy cad.* migrates on normalize) */
    /* in.xMax / in.yMax optional: when wired, pulled values win; params are fallback only */
    'view.curve':  { label: 'Curve view', ins: ['xMax', 'yMax'], outs: ['idealY', 'xMax', 'yMax', 'scoreFromCurve'], kind: 'view', cat: 'View' },
    'view.sample': { label: 'Sample idealY', ins: ['y', 'xMax'], outs: ['curve', 'idealY', 'xMax'], kind: 'view', cat: 'View' },
    'view.3d':     { label: '3D view',    ins: [], outs: ['bounds', 'ok'], kind: 'view3d', cat: 'View' },
    'math.idealY': { label: 'idealY(x)',  ins: ['a'], outs: ['out'], kind: 'bridge', cat: 'View' },
    /* World / 3D — add viz/data via BP (not hand-placing meta entities) */
    'world.add.point':   { label: 'world point',   ins: [], outs: ['ok', 'x', 'y', 'z'], kind: 'world', cat: 'World/3D' },
    'world.add.segment': { label: 'world segment', ins: [], outs: ['ok', 'x', 'y', 'z', 'x2', 'y2', 'z2'], kind: 'world', cat: 'World/3D' },
    'world.add.field':   { label: 'world field',   ins: [], outs: ['ok'], kind: 'world', cat: 'World/3D' },
    'world.emit.viz':    { label: 'emit viz',      ins: ['in'], outs: ['ok'], kind: 'world', cat: 'World/3D' },
    'world.measure':     { label: 'world measure', ins: [], outs: ['out'], kind: 'world', cat: 'World/3D' },
    'measure.distance':  { label: 'distance', ins: ['ax', 'ay', 'az', 'bx', 'by', 'bz'], outs: ['out'], kind: 'measure', cat: 'World/3D' },
    /* Score recipes as graph nodes (not separate designer pills) */
    'score.ideal_over_ymax': { label: 'idealY/yMax',  ins: ['idealY', 'yMax'], outs: ['out'], kind: 'score', cat: 'Out' },
    'score.y_over_ideal':    { label: 'y / idealY',   ins: ['y', 'idealY'], outs: ['out'], kind: 'score', cat: 'Out' },
    'score.y_over_ymax':     { label: 'y / yMax',     ins: ['y', 'yMax'], outs: ['out'], kind: 'score', cat: 'Out' },
    'score.gap_to_ideal':    { label: 'gap to ideal', ins: ['y', 'idealY', 'yMax'], outs: ['out'], kind: 'score', cat: 'Out' },
    'score.min_xy_norm':     { label: 'min xy norm',  ins: ['x', 'xMax', 'y', 'yMax'], outs: ['out'], kind: 'score', cat: 'Out' },
    'score.passthroughY':    { label: '|y| passthrough', ins: ['y'], outs: ['out'], kind: 'score', cat: 'Out' },
    'score.out':    { label: 'score out', ins: ['in'], outs: [], kind: 'sink', cat: 'Out' },
    'view.out':     { label: 'view out',  ins: ['curve', 'space3d', 'view'], outs: [], kind: 'viewsink', cat: 'Out' },
    'viz.out':      { label: 'viz out',   ins: ['in'], outs: [], kind: 'viz', cat: 'Out' },
    /* easy172: one-tick sim documenting run()→jmethod world→score */
    'sim.step':     { label: 'sim step',  ins: ['world', 'view'], outs: ['score', 'ok'], kind: 'sim', cat: 'Out' },
    /* easy183: local-economy EXAMPLE priors (no live APIs) */
    'econ.firmSupply':       { label: 'firm supply',    ins: ['capacity'], outs: ['supply', 'open'], kind: 'econ', cat: 'Economy' },
    'econ.clientDemand':     { label: 'client demand',  ins: ['demand'], outs: ['demand'], kind: 'econ', cat: 'Economy' },
    'econ.scheduleConflict': { label: 'sched conflict', ins: [], outs: ['conflict'], kind: 'econ', cat: 'Economy' },
    'econ.tripCost':         { label: 'trip cost',      ins: ['minutes', 'cost'], outs: ['friction'], kind: 'econ', cat: 'Economy' },
    'econ.factorCosts':     { label: 'factor costs',   ins: ['miles', 'minutes', 'money', 'days'], outs: ['money', 'timeH', 'days', 'friction', 'wM', 'wT', 'wD'], kind: 'econ', cat: 'Economy' },
    'econ.benefitNet':       { label: 'benefit net',    ins: ['benefit', 'friction', 'supply', 'demand', 'conflict'], outs: ['net', 'emitOk'], kind: 'econ', cat: 'Economy' }
  };

  var PALETTE_CATEGORIES = [
    { id: 'Inputs',   types: ['input.x', 'input.y', 'input.xMax', 'input.yMax', 'input.act'] },
    { id: 'Jfactor',  types: ['jfactor.x', 'jfactor.y', 'jfactor.xMax', 'jfactor.yMax', 'jfactor.jgroup', 'jfactor.call', 'jfactor.browse', 'jfactor.moneyToHappy', 'jfactor.daysCapacity', 'jfactor.ageTick', 'jfactor.debtPay', 'jfactor.external'] },
    { id: 'Data',     types: ['data.boardMax', 'data.actField', 'data.horizon', 'data.const', 'data.domain', 'data.ctxField'] },
    { id: 'Board',    types: ['board.emit'] },
    { id: 'Mech',     types: ['mech.ageT', 'mech.hash01', 'mech.clamp', 'mech.happinessAgeWeight', 'mech.moneyDisutility', 'mech.externalFactor', 'mech.daysCapacityWeight'] },
    { id: 'Math',     types: ['const.number', 'op.add', 'op.sub', 'op.mul', 'op.div', 'op.min', 'op.max', 'op.sqrt', 'op.log1p', 'op.pow', 'op.clamp01', 'op.clamp', 'op.abs', 'op.neg', 'op.hash01', 'op.firstPos'] },
    { id: 'View',     types: ['view.curve', 'view.sample', 'view.3d', 'math.idealY'] },
    { id: 'World/3D', types: ['world.add.point', 'world.add.segment', 'world.add.field', 'world.emit.viz', 'world.measure', 'measure.distance'] },
    { id: 'Place',   types: ['place.fromAct', 'place.out'] },
    { id: 'Economy', types: ['econ.firmSupply', 'econ.clientDemand', 'econ.scheduleConflict', 'econ.tripCost', 'econ.factorCosts', 'econ.benefitNet'] },
    { id: 'Out',      types: ['score.ideal_over_ymax', 'score.y_over_ideal', 'score.y_over_ymax', 'score.gap_to_ideal', 'score.min_xy_norm', 'score.passthroughY', 'score.out', 'view.out', 'viz.out', 'sim.step'] }
  ];

  var PALETTE = [];
  PALETTE_CATEGORIES.forEach(function (c) {
    c.types.forEach(function (t) { if (PALETTE.indexOf(t) < 0) PALETTE.push(t); });
  });

  /* easy172: port types — number | view | world | jgroup | place | any */
  var PORT_TYPE = {
    NUMBER: 'number', VIEW: 'view', WORLD: 'world', JGROUP: 'jgroup', PLACE: 'place', ANY: 'any'
  };

  function portTypeOf(nodeType, port, dir) {
    var m = NODE_META[nodeType];
    if (!m) return PORT_TYPE.ANY;
    port = String(port || '');
    dir = dir === 'in' ? 'in' : 'out';
    /* explicit sinks / channels */
    if (nodeType === 'view.out') {
      if (port === 'curve' || port === 'space3d' || port === 'view') return PORT_TYPE.VIEW;
      return PORT_TYPE.ANY;
    }
    if (nodeType === 'place.out') return PORT_TYPE.PLACE;
    if (nodeType === 'score.out' || nodeType === 'viz.out') return PORT_TYPE.NUMBER;
    if (nodeType === 'sim.step') {
      if (dir === 'in') {
        if (port === 'world') return PORT_TYPE.WORLD;
        if (port === 'view') return PORT_TYPE.VIEW;
        return PORT_TYPE.ANY;
      }
      return PORT_TYPE.NUMBER; /* score, ok */
    }
    if (nodeType === 'jfactor.jgroup') return PORT_TYPE.JGROUP;
    if (nodeType === 'place.fromAct') return PORT_TYPE.PLACE;
    if (nodeType === 'view.sample') {
      if (dir === 'out' && port === 'curve') return PORT_TYPE.VIEW;
      return PORT_TYPE.NUMBER;
    }
    if (m.kind === 'view' || m.kind === 'view3d' || m.kind === 'cad' || m.kind === 'cad3d') {
      /* numeric curve samples; also valid as view.out channel sources */
      if (dir === 'out' && (port === 'bounds' || port === 'ok')) {
        return port === 'ok' ? PORT_TYPE.NUMBER : PORT_TYPE.WORLD;
      }
      return PORT_TYPE.NUMBER;
    }
    if (m.kind === 'world') {
      if (dir === 'out' && port === 'ok') return PORT_TYPE.WORLD;
      return PORT_TYPE.NUMBER; /* x/y/z scalars */
    }
    if (m.kind === 'measure' || m.kind === 'score' || m.kind === 'bin' || m.kind === 'unary' || m.kind === 'bridge' || m.kind === 'const' || m.kind === 'in' || m.kind === 'data' || m.kind === 'jfactor' || m.kind === 'mech' || m.kind === 'econ' || m.kind === 'board') {
      return PORT_TYPE.NUMBER;
    }
    if (m.kind === 'place' || m.kind === 'placesink') return PORT_TYPE.PLACE;
    if (m.kind === 'viewsink') return PORT_TYPE.VIEW;
    if (m.kind === 'sim') return PORT_TYPE.NUMBER;
    return PORT_TYPE.ANY;
  }

  /**
   * Compatibility: same / any OK; scalars coerce to number; view.out channels accept
   * number|view|world (builtin wires view.curve.idealY → view.out.curve).
   * Hard reject: place↔view, jgroup↔view, place↔world (and reverse) without number bridge.
   */
  function portsCompatible(fromType, toType) {
    fromType = String(fromType || PORT_TYPE.ANY);
    toType = String(toType || PORT_TYPE.ANY);
    if (fromType === PORT_TYPE.ANY || toType === PORT_TYPE.ANY) {
      return { ok: true, soft: false, reason: null };
    }
    if (fromType === toType) {
      return { ok: true, soft: false, reason: null };
    }
    var scalar = {};
    scalar[PORT_TYPE.NUMBER] = 1;
    scalar[PORT_TYPE.JGROUP] = 1;
    scalar[PORT_TYPE.PLACE] = 1;
    scalar[PORT_TYPE.WORLD] = 1;
    /* number sink accepts scalar sources */
    if (toType === PORT_TYPE.NUMBER && scalar[fromType]) {
      return { ok: true, soft: fromType !== PORT_TYPE.NUMBER, reason: softReason(fromType, toType) };
    }
    /* view channel: number (curve ports), view, world (3d) */
    if (toType === PORT_TYPE.VIEW && (fromType === PORT_TYPE.NUMBER || fromType === PORT_TYPE.VIEW || fromType === PORT_TYPE.WORLD)) {
      return { ok: true, soft: fromType === PORT_TYPE.NUMBER, reason: softReason(fromType, toType) };
    }
    /* place sink accepts place|number */
    if (toType === PORT_TYPE.PLACE && (fromType === PORT_TYPE.PLACE || fromType === PORT_TYPE.NUMBER)) {
      return { ok: true, soft: fromType === PORT_TYPE.NUMBER, reason: softReason(fromType, toType) };
    }
    /* world sink accepts world|number */
    if (toType === PORT_TYPE.WORLD && (fromType === PORT_TYPE.WORLD || fromType === PORT_TYPE.NUMBER)) {
      return { ok: true, soft: fromType === PORT_TYPE.NUMBER, reason: softReason(fromType, toType) };
    }
    /* jgroup accepts jgroup|number */
    if (toType === PORT_TYPE.JGROUP && (fromType === PORT_TYPE.JGROUP || fromType === PORT_TYPE.NUMBER)) {
      return { ok: true, soft: fromType === PORT_TYPE.NUMBER, reason: softReason(fromType, toType) };
    }
    return {
      ok: false,
      soft: false,
      reason: 'incompatible ports: ' + fromType + ' → ' + toType
    };
  }

  function softReason(a, b) {
    return 'coerce ' + a + ' → ' + b;
  }

  function canConnect(graph, from, fromPort, to, toPort) {
    var g = normalizeGraph(graph);
    var a = nodeById(g, from);
    var b = nodeById(g, to);
    if (!a || !b) return { ok: false, soft: false, reason: 'missing node', fromType: null, toType: null };
    if (a.id === b.id) return { ok: false, soft: false, reason: 'self-wire', fromType: null, toType: null };
    var fm = NODE_META[a.type];
    var tm = NODE_META[b.type];
    if (!fm || !tm) return { ok: false, soft: false, reason: 'unknown type', fromType: null, toType: null };
    if (fm.outs.indexOf(fromPort) < 0 || tm.ins.indexOf(toPort) < 0) {
      return { ok: false, soft: false, reason: 'bad port', fromType: null, toType: null };
    }
    var ft = portTypeOf(a.type, fromPort, 'out');
    var tt = portTypeOf(b.type, toPort, 'in');
    var c = portsCompatible(ft, tt);
    return { ok: c.ok, soft: !!c.soft, reason: c.reason, fromType: ft, toType: tt };
  }

  function edgeTypeInfo(graph, edge) {
    if (!edge) return { ok: true, soft: false, fromType: PORT_TYPE.ANY, toType: PORT_TYPE.ANY };
    var a = nodeById(graph, edge.from);
    var b = nodeById(graph, edge.to);
    if (!a || !b) return { ok: false, soft: false, fromType: null, toType: null, reason: 'dangling' };
    var ft = portTypeOf(a.type, edge.fromPort || 'out', 'out');
    var tt = portTypeOf(b.type, edge.toPort || 'in', 'in');
    var c = portsCompatible(ft, tt);
    return { ok: c.ok, soft: !!c.soft, fromType: ft, toType: tt, reason: c.reason };
  }

  function clamp01(n) {
    n = Number(n);
    if (!isFinite(n)) n = 0;
    return Math.max(0, Math.min(1, n));
  }

  function num(v, d) {
    var n = Number(v);
    return isFinite(n) ? n : (d != null ? d : 0);
  }

  function newId(prefix) {
    return String(prefix || 'n') + '_' + Date.now().toString(36) + '_' + Math.floor(Math.random() * 1e4).toString(36);
  }

  function isConstType(t) { return t === 'const' || t === 'const.number' || t === 'data.const'; }

  function defaultCadMath() {
    return { type: 'linear', params: { a: 1, b: 0 } };
  }

  function normalizeCadMath(m) {
    if (!m || typeof m !== 'object') return defaultCadMath();
    var type = String(m.type || 'linear');
    if (['linear', 'sqrt', 'log1p', 'power', 'bezier'].indexOf(type) < 0) type = 'linear';
    var p = (m.params && typeof m.params === 'object') ? Object.assign({}, m.params) : {};
    if (type === 'linear') {
      p.a = num(p.a, 1); p.b = num(p.b, 0);
    } else if (type === 'sqrt' || type === 'log1p') {
      p.k = num(p.k, 1);
    } else if (type === 'power') {
      p.k = num(p.k, 1); p.p = num(p.p, 0.5);
    } else if (type === 'bezier') {
      var pts = Array.isArray(p.points) ? p.points : [];
      p.points = pts.map(function (pt) {
        return { x: Math.max(0, num(pt && pt.x, 0)), y: Math.max(0, num(pt && pt.y, 0)) };
      });
      if (p.points.length < 2) p.points = [{ x: 0, y: 0 }, { x: 100, y: 1 }];
    }
    return { type: type, params: p };
  }

  /** Local idealY so view.curve compiles without RunJMethods. */
  function idealYFromCadMath(math, x) {
    math = normalizeCadMath(math);
    x = Math.max(0, num(x, 0));
    var p = math.params || {};
    if (math.type === 'sqrt') return Math.max(0, num(p.k, 1) * Math.sqrt(x));
    if (math.type === 'log1p') return Math.max(0, num(p.k, 1) * Math.log1p(x));
    if (math.type === 'power') return Math.max(0, num(p.k, 1) * Math.pow(x, num(p.p, 0.5)));
    if (math.type === 'bezier') {
      var pts = p.points || [];
      if (!pts.length) return 0;
      if (x <= pts[0].x) return pts[0].y;
      if (x >= pts[pts.length - 1].x) return pts[pts.length - 1].y;
      for (var i = 0; i < pts.length - 1; i++) {
        var a = pts[i], b = pts[i + 1];
        if (x >= a.x && x <= b.x) {
          var t = (b.x - a.x) < 1e-12 ? 0 : (x - a.x) / (b.x - a.x);
          return a.y + t * (b.y - a.y);
        }
      }
      return pts[pts.length - 1].y;
    }
    return Math.max(0, num(p.a, 1) * x + num(p.b, 0));
  }

  function emptyGraph() {
    return {
      version: 1,
      nodes: [
        { id: 'score_out', type: 'score.out', x: 520, y: 160, params: {} },
        { id: 'view_out', type: 'view.out', x: 520, y: 260, params: {} }
      ],
      edges: []
    };
  }

  function defaultViewCurveParams(seed) {
    return defaultCadCurveParams(seed);
  }

  function defaultCadCurveParams(seed) {
    seed = seed || {};
    return {
      math: normalizeCadMath(seed.math || defaultCadMath()),
      xMax: num(seed.xMax, 100) > 0 ? num(seed.xMax, 100) : 100,
      yMax: num(seed.yMax, 1) > 0 ? num(seed.yMax, 1) : 1,
      xLabel: seed.xLabel != null ? String(seed.xLabel) : 'x',
      yLabel: seed.yLabel != null ? String(seed.yLabel) : 'ideal y'
    };
  }

  function defaultWorldAddParams(kind) {
    return {
      kind: kind || 'point',
      label: '',
      x: 0, y: 0, z: 0,
      x2: 1, y2: 0, z2: 0,
      note: ''
    };
  }

  function normalizeGraph(graph) {
    var g = graph && typeof graph === 'object' ? graph : emptyGraph();
    var nodes = Array.isArray(g.nodes) ? g.nodes : [];
    var edges = Array.isArray(g.edges) ? g.edges : [];
    var outNodes = [];
    var seen = {};
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (!n || !n.type) continue;
      /* drop removed spatial.pos / domain-only nodes silently */
      if (n.type === 'spatial.pos' || n.type === 'domain.xMax' || n.type === 'domain.yMax') continue;
      /* easy165: migrate legacy CAD node ids -> View */
      if (n.type === 'cad.curve') n.type = 'view.curve';
      if (n.type === 'cad.3d') n.type = 'view.3d';
      if (!NODE_META[n.type]) continue;
      var id = String(n.id || newId('n'));
      if (seen[id]) id = newId('n');
      seen[id] = true;
      var params = (n.params && typeof n.params === 'object') ? Object.assign({}, n.params) : {};
      if (isConstType(n.type)) {
        params = {
          value: num(params.value, 0),
          ref: (params.ref === 'xMax' || params.ref === 'yMax' || params.ref === 'x' || params.ref === 'y' || params.ref === 'idealY')
            ? params.ref : ''
        };
      }
      if (n.type === 'data.domain') n.type = 'data.boardMax';
      if (n.type === 'input.act') {
        params = {
          amount: num(params.amount, 0),
          days: num(params.days, 0),
          hours: num(params.hours, 0)
        };
      }
      if (n.type === 'place.fromAct') {
        params = defaultPlaceFromActParams(params);
      }
      if (n.type === 'place.out') {
        params = { label: String(params.label != null ? params.label : '') };
      }
      if (n.type === 'input.xMax' || n.type === 'input.yMax') {
        params = defaultInputDomainParams(params);
      }
      if (n.type === 'jfactor.xMax') params = defaultJfactorDomainParams(params, 'xMax');
      if (n.type === 'jfactor.yMax') params = defaultJfactorDomainParams(params, 'yMax');
      if (n.type === 'jfactor.jgroup') params = defaultJfactorJgroupParams(params);
      if (n.type === 'jfactor.call') params = defaultJfactorCallParams(params);
      if (n.type === 'jfactor.browse') params = defaultJfactorBrowseParams(params);
      if (n.type === 'sim.step') params = defaultSimStepParams(params);
      if (n.type === 'jfactor.moneyToHappy' || n.type === 'jfactor.ageTick' || n.type === 'jfactor.debtPay' || n.type === 'jfactor.daysCapacity') {
        params = params && typeof params === 'object' ? Object.assign({}, params) : {};
      }
      if (n.type === 'data.boardMax') {
        params = defaultDataBoardParams(params);
      }
      if (n.type === 'data.actField') {
        params = defaultDataActFieldParams(params);
      }
      if (n.type === 'data.horizon') {
        params = defaultDataHorizonParams(params);
      }
      if (n.type === 'data.ctxField') {
        params = defaultDataCtxFieldParams(params);
      }
      if (n.type.indexOf('mech.') === 0) {
        params = defaultMechParams(n.type, params);
      }
      if (n.type.indexOf('econ.') === 0) {
        params = defaultEconParams(n.type, params);
      }
      if (n.type === 'op.hash01') {
        params = {
          name: String(params.name != null ? params.name : (params.seed || '')),
          hint: params.hint || 'hash01(name|floor(t*100)) noise seed'
        };
      }
      if (n.type === 'op.clamp') {
        var cp = { lo: num(params.lo, 0), hi: num(params.hi, 1) };
        if (params.hint) cp.hint = String(params.hint);
        params = cp;
      }
      if (n.type === 'view.curve') {
        params = defaultCadCurveParams(params);
      }
      if (n.type === 'view.3d') {
        params = { open: !!params.open, note: String(params.note || '') };
      }
      if (n.type === 'view.out') {
        params = {};
      }
      if (n.type === 'world.add.point' || n.type === 'world.add.segment' || n.type === 'world.add.field') {
        var kind = n.type === 'world.add.segment' ? 'segment' : (n.type === 'world.add.field' ? 'field' : 'point');
        var wp = defaultWorldAddParams(kind);
        Object.keys(wp).forEach(function (k) {
          if (params[k] != null) wp[k] = params[k];
        });
        wp.kind = kind;
        wp.x = num(wp.x, 0); wp.y = num(wp.y, 0); wp.z = num(wp.z, 0);
        wp.x2 = num(wp.x2, 1); wp.y2 = num(wp.y2, 0); wp.z2 = num(wp.z2, 0);
        wp.label = String(wp.label || '');
        wp.note = String(wp.note || '');
        params = wp;
      }
      if (n.type === 'world.emit.viz') {
        params = { label: String(params.label || 'viz'), note: String(params.note || '') };
      }
      if (n.type === 'world.measure') {
        params = { a: String(params.a || ''), b: String(params.b || ''), value: num(params.value, 0) };
      }
      outNodes.push({
        id: id,
        type: String(n.type),
        x: num(n.x, 40 + (i % 5) * 120),
        y: num(n.y, 40 + Math.floor(i / 5) * 80),
        params: params
      });
    }
    var idOk = {};
    outNodes.forEach(function (n) { idOk[n.id] = true; });
    var outEdges = [];
    for (var e = 0; e < edges.length; e++) {
      var ed = edges[e];
      if (!ed) continue;
      var from = String(ed.from || '');
      var to = String(ed.to || '');
      if (!idOk[from] || !idOk[to] || from === to) continue;
      var fromPort = String(ed.fromPort || 'out');
      var toPort = String(ed.toPort || 'in');
      var fromNode = null, toNode = null;
      for (var fi = 0; fi < outNodes.length; fi++) {
        if (outNodes[fi].id === from) fromNode = outNodes[fi];
        if (outNodes[fi].id === to) toNode = outNodes[fi];
      }
      if (!fromNode || !toNode) continue;
      var fm = NODE_META[fromNode.type];
      var tm = NODE_META[toNode.type];
      if (!fm || fm.outs.indexOf(fromPort) < 0) continue;
      if (!tm || tm.ins.indexOf(toPort) < 0) continue;
      var clash = false;
      for (var k = 0; k < outEdges.length; k++) {
        if (outEdges[k].to === to && outEdges[k].toPort === toPort) { clash = true; break; }
      }
      if (clash) continue;
      outEdges.push({ from: from, fromPort: fromPort, to: to, toPort: toPort });
    }
    var hasSink = outNodes.some(function (n) { return n.type === 'score.out'; });
    if (!hasSink) {
      outNodes.push({ id: 'score_out', type: 'score.out', x: 520, y: 160, params: {} });
    }
    var outGroups = [];
    if (graph && Array.isArray(graph.groups)) {
      graph.groups.forEach(function (gr) {
        if (!gr || !gr.id) return;
        var nids = Array.isArray(gr.nodeIds) ? gr.nodeIds.map(String).filter(Boolean) : [];
        outGroups.push({
          id: String(gr.id),
          label: gr.label != null ? String(gr.label) : 'Group',
          nodeIds: nids,
          collapsed: !!gr.collapsed,
          x: num(gr.x, 0), y: num(gr.y, 0),
          w: num(gr.w, 160), h: num(gr.h, 100)
        });
      });
    }
    return { version: 1, nodes: outNodes, edges: outEdges, groups: outGroups };
  }

  function findSink(graph) {
    for (var i = 0; i < graph.nodes.length; i++) {
      if (graph.nodes[i].type === 'score.out') return graph.nodes[i];
    }
    return null;
  }

  function findViewCurve(graph) {
    for (var i = 0; i < graph.nodes.length; i++) {
      if (graph.nodes[i].type === 'view.curve') return graph.nodes[i];
    }
    return null;
  }
  /** @deprecated use findViewCurve */
  function findCadCurve(graph) { return findViewCurve(graph); }

  function findView3d(graph) {
    for (var i = 0; i < graph.nodes.length; i++) {
      if (graph.nodes[i].type === 'view.3d') return graph.nodes[i];
    }
    return null;
  }

  function findViewOut(graph) {
    for (var i = 0; i < graph.nodes.length; i++) {
      if (graph.nodes[i].type === 'view.out') return graph.nodes[i];
    }
    return null;
  }

  function findPlaceOut(graph) {
    for (var i = 0; i < graph.nodes.length; i++) {
      if (graph.nodes[i].type === 'place.out') return graph.nodes[i];
    }
    return null;
  }

  /**
   * Describe PREVIEW view channels from graph topology (no sampling).
   * curveSource: 'wired' when view.out.curve comes from view.sample or a numeric subgraph;
   * 'blob-fallback' when from view.curve params; 'none' otherwise.
   */
  function describeView(graph) {
    var g = normalizeGraph(graph);
    var viewOut = findViewOut(g);
    var curveNode = findViewCurve(g);
    var space3dNode = findView3d(g);
    var curveSource = 'none';
    var wire = null;
    if (viewOut) {
      var eCurve = edgeInto(g, viewOut.id, 'curve');
      var e3d = edgeInto(g, viewOut.id, 'space3d');
      var eView = edgeInto(g, viewOut.id, 'view');
      if (eCurve) {
        var nc = nodeById(g, eCurve.from);
        if (nc && nc.type === 'view.sample') {
          curveSource = 'wired';
          var ye = edgeInto(g, nc.id, 'y');
          var xe = edgeInto(g, nc.id, 'xMax');
          wire = {
            kind: 'sample',
            sampleId: nc.id,
            yFrom: ye ? ye.from : null,
            yPort: ye ? (ye.fromPort || 'out') : null,
            xMaxFrom: xe ? xe.from : null,
            xMaxPort: xe ? (xe.fromPort || 'out') : null
          };
        } else if (nc && nc.type === 'view.curve') {
          curveNode = nc;
          curveSource = 'blob-fallback';
        } else if (nc) {
          curveSource = 'wired';
          wire = {
            kind: 'numeric',
            yFrom: eCurve.from,
            yPort: eCurve.fromPort || 'out',
            xMaxFrom: null,
            xMaxPort: null
          };
        }
      }
      if (e3d) {
        var n3 = nodeById(g, e3d.from);
        if (n3 && n3.type === 'view.3d') space3dNode = n3;
      }
      if (eView) {
        var nv = nodeById(g, eView.from);
        if (nv && nv.type === 'view.sample' && curveSource !== 'wired') {
          curveSource = 'wired';
          var ye2 = edgeInto(g, nv.id, 'y');
          var xe2 = edgeInto(g, nv.id, 'xMax');
          wire = {
            kind: 'sample',
            sampleId: nv.id,
            yFrom: ye2 ? ye2.from : null,
            yPort: ye2 ? (ye2.fromPort || 'out') : null,
            xMaxFrom: xe2 ? xe2.from : null,
            xMaxPort: xe2 ? (xe2.fromPort || 'out') : null
          };
        } else if (nv && nv.type === 'view.curve') {
          curveNode = nv;
          if (curveSource === 'none') curveSource = 'blob-fallback';
        } else if (nv && nv.type === 'view.3d') {
          space3dNode = nv;
        } else if (nv && curveSource !== 'wired') {
          curveSource = 'wired';
          wire = {
            kind: 'numeric',
            yFrom: eView.from,
            yPort: eView.fromPort || 'out',
            xMaxFrom: null,
            xMaxPort: null
          };
        }
      }
    }
    var desc = { previewKind: 'none', curveSource: curveSource };
    if (wire) desc._wire = wire;
    if (curveNode) {
      desc.curve = defaultCadCurveParams(curveNode.params);
      desc._curveNodeId = curveNode.id;
      if (curveSource === 'none') desc.curveSource = 'blob-fallback';
    }
    if (space3dNode) {
      desc.space3d = {
        worldRef: 'jmethod',
        open: !!(space3dNode.params && space3dNode.params.open),
        note: String((space3dNode.params && space3dNode.params.note) || '')
      };
    }
    if ((desc.curve || curveSource === 'wired') && desc.space3d) desc.previewKind = 'both';
    else if (desc.curve || curveSource === 'wired') desc.previewKind = 'curve';
    else if (desc.space3d) desc.previewKind = '3d';
    return desc;
  }

  /**
   * Attach idealYFn + sampled bezier math onto a describeView result using evalNode.
   * Wired sample wins; view.curve params are labels/domain fallback only.
   */
  function attachWiredIdealY(desc, g, evalNode) {
    if (!desc) return desc;
    var wire = desc._wire;
    var curveNode = desc._curveNodeId ? nodeById(g, desc._curveNodeId) : findViewCurve(g);
    var base = curveNode ? defaultCadCurveParams(curveNode.params) : defaultCadCurveParams({});
    var xMaxFb = base.xMax > 0 ? base.xMax : 100;
    var yMaxFb = base.yMax > 0 ? base.yMax : 1;

    function evalAt(x, ctx0) {
      ctx0 = ctx0 || {};
      var c = {
        x: Math.max(0, num(x, 0)),
        y: ctx0.y != null ? num(ctx0.y, 0) : 0,
        xMax: num(ctx0.xMax, 0) > 0 ? num(ctx0.xMax, xMaxFb) : xMaxFb,
        yMax: num(ctx0.yMax, 0) > 0 ? num(ctx0.yMax, yMaxFb) : yMaxFb,
        idealY: 0,
        act: (ctx0.act && typeof ctx0.act === 'object') ? ctx0.act : {},
        wb: ctx0.wb || null,
        D: ctx0.D != null ? ctx0.D : 30,
        Dmax: ctx0.Dmax != null ? ctx0.Dmax : 31,
        E: ctx0.E != null ? ctx0.E : 10,
        Emax: ctx0.Emax != null ? ctx0.Emax : 20,
        apr: ctx0.apr != null ? ctx0.apr : 0.18,
        interest: ctx0.interest,
        X: ctx0.X != null ? ctx0.X : 2000,
        M: ctx0.M != null ? ctx0.M : 1,
        H: ctx0.H != null ? ctx0.H : 1,
        discountRate: ctx0.discountRate != null ? ctx0.discountRate : 0.04,
        name: ctx0.name || 'idealY',
        _simScore: ctx0._simScore,
        _lastSim: ctx0._lastSim
      };
      if (c.interest == null || !(Number(c.interest) >= 0)) {
        var aprN = Number(c.apr) || 0.18;
        if (aprN > 1) aprN = aprN * 0.01;
        c.interest = c.x * aprN / 12;
      }
      /* debtPay METHODS uses pay≥1e-3 */
      if (!(c.x > 0) && wire && wire.sampleId) {
        var sn = nodeById(g, wire.sampleId);
        if (sn && sn.params && sn.params.idealYMode === 'debtPay') c.x = 1e-3;
      }
      try {
        if (wire && wire.yFrom) {
          return Math.max(0, num(evalNode(wire.yFrom, c, Object.create(null), wire.yPort || 'out'), 0));
        }
        return idealYFromCadMath(base.math, c.x);
      } catch (_e) {
        return 0;
      }
    }

    var xMax = xMaxFb;
    if (wire && wire.xMaxFrom && typeof evalNode === 'function') {
      try {
        var xm = num(evalNode(wire.xMaxFrom, {
          x: 0, y: 0, xMax: xMaxFb, yMax: yMaxFb, idealY: 0, act: {}, name: 'xMax',
          D: 30, Dmax: 31, E: 10, Emax: 20, M: 1, H: 1
        }, Object.create(null), wire.xMaxPort || 'out'), 0);
        if (xm > 0) xMax = xm;
      } catch (_xm) {}
    }

    if (desc.curveSource === 'wired' && wire && wire.yFrom && typeof evalNode === 'function') {
      var nSamp = 24;
      var pts = [];
      var yPeak = 0;
      for (var i = 0; i <= nSamp; i++) {
        var xx = (xMax / nSamp) * i;
        var yy = evalAt(xx, { xMax: xMax, yMax: yMaxFb });
        if (yy > yPeak) yPeak = yy;
        pts.push({ x: xx, y: yy });
      }
      desc.curve = {
        math: { type: 'bezier', params: { points: pts } },
        xMax: xMax,
        yMax: yMaxFb > 0 ? yMaxFb : (yPeak > 0 ? yPeak : 1),
        xLabel: base.xLabel,
        yLabel: base.yLabel
      };
      desc.idealYFn = function (x, ctx) {
        return evalAt(x, ctx || {});
      };
      desc.curveSource = 'wired';
    } else if (desc.curve) {
      if (desc.curveSource === 'none') desc.curveSource = 'blob-fallback';
      desc.idealYFn = function (x) {
        return idealYFromCadMath(desc.curve.math, x);
      };
    }
    return desc;
  }

  /**
   * Compile PREVIEW view descriptor from graph (view.out preferred; else first view.* nodes).
   * Persist as WB.modelTools.jmethods[id].view / draft.view.
   * Prefer wired view.sample / numeric idealY(x); view.curve params blob is fallback only.
   */
  function compileView(graph) {
    var g = normalizeGraph(graph);
    var desc = describeView(g);
    if (desc.curveSource === 'wired' && desc._wire && desc._wire.yFrom) {
      try {
        var compiled = compile(g);
        if (compiled && compiled.view) return compiled.view;
      } catch (_c) {}
    }
    if (desc.curve && !desc.idealYFn) {
      desc.idealYFn = function (x) {
        return idealYFromCadMath(desc.curve.math, x);
      };
    }
    return desc;
  }

  function edgeInto(graph, nodeId, port) {
    for (var i = 0; i < graph.edges.length; i++) {
      var e = graph.edges[i];
      if (e.to === nodeId && e.toPort === port) return e;
    }
    return null;
  }

  function nodeById(graph, id) {
    for (var i = 0; i < graph.nodes.length; i++) {
      if (graph.nodes[i].id === id) return graph.nodes[i];
    }
    return null;
  }

  function safeDiv(a, b) {
    return Math.abs(b) < 1e-12 ? 0 : a / b;
  }

  function maxOfMap(map) {
    var m = 0;
    if (!map || typeof map !== 'object') return 0;
    Object.keys(map).forEach(function (k) {
      var v = Number(map[k]);
      if (isFinite(v) && v > m) m = v;
    });
    return m;
  }

  function defaultBoardEmitParams(p) {
    p = p || {};
    var items = Array.isArray(p.items) ? p.items : (Array.isArray(p.boardItems) ? p.boardItems : []);
    return {
      items: items,
      note: p.note != null ? String(p.note) : 'Emit idea.boardItems / node specs → Board (suggestMust)',
      seedExample: !!p.seedExample
    };
  }

  /** Collect board.emit node item specs from a Blueprint graph. */
  function collectBoardEmits(script) {
    var out = [];
    var g = script && typeof script === 'object' ? script : null;
    if (!g || !Array.isArray(g.nodes)) return out;
    g.nodes.forEach(function (n) {
      if (!n || n.type !== 'board.emit') return;
      var p = defaultBoardEmitParams(n.params || {});
      (p.items || []).forEach(function (it) {
        if (it && it.name) out.push(it);
      });
    });
    return out;
  }

  function wbRef(ctx) {
    if (ctx && ctx.wb) return ctx.wb;
    try {
      if (typeof global !== 'undefined' && global.WB) return global.WB;
    } catch (_g) {}
    try {
      if (typeof window !== 'undefined' && window.WB) return window.WB;
    } catch (_w) {}
    return null;
  }

  /**
   * Board / calendar / money max for data.boardMax + data.domain.
   * metric: dim letter (T/D/M/H/…) → max score{dim}; or days|hours|money|cost|happy.
   */
  function resolveBoardMax(metric, ctx) {
    metric = String(metric || 'T').trim();
    var WB = wbRef(ctx);
    var key = metric.toLowerCase();
    if (WB) {
      if (key === 'days' || key === 'd_days') return maxOfMap(WB._daysCache);
      if (key === 'hours' || key === 'time' || key === 't_hours') return maxOfMap(WB._timeHoursCache);
      if (key === 'debt' || key === 'urgency') return maxOfMap(WB._debtUrgencyCache);
      if (key === 'surplus') return maxOfMap(WB._surplusContribCache);
    }
    var items = null;
    try {
      if (ctx && Array.isArray(ctx.boardItems)) items = ctx.boardItems;
      else if (WB && typeof global !== 'undefined' && typeof global.calcRanks === 'function') {
        var R = global.calcRanks();
        items = (R && R.items) || null;
      } else if (typeof window !== 'undefined' && typeof window.calcRanks === 'function') {
        var R2 = window.calcRanks();
        items = (R2 && R2.items) || null;
      }
    } catch (_cr) { items = null; }
    if (!items || !items.length) {
      /* last resort: HDAME pool months as soft domain hint */
      if (WB && WB.hdame && Number(WB.hdame.years) > 0 && (key === 'months' || key === 'horizon')) {
        return Number(WB.hdame.years) * 12;
      }
      return 0;
    }
    var max = 0;
    items.forEach(function (it) {
      if (!it) return;
      var v = 0;
      if (key === 'money' || key === 'cost') v = Number(it.cost) || 0;
      else if (key === 'happy' || key === 'h') v = Number(it.scoreH != null ? it.scoreH : it.H) || 0;
      else if (key === 'amount') v = Number(it.amount != null ? it.amount : it.cost) || 0;
      else if (/^[A-Za-z0-9_]{1,12}$/.test(metric) && metric.length <= 8) {
        var dim = metric.toUpperCase();
        var sk = 'score' + dim;
        v = Number(it[sk] != null ? it[sk] : it[dim]) || 0;
        if (!(v > 0) && WB) {
          if (dim === 'D' && WB._daysCache && it.name) v = Number(WB._daysCache[it.name]) || 0;
          if (dim === 'T' && WB._timeHoursCache && it.name) v = Number(WB._timeHoursCache[it.name]) || 0;
        }
      }
      if (isFinite(v) && v > max) max = v;
    });
    return max;
  }

  function resolveActField(field, ctx, nodeParams) {
    field = String(field || 'amount').toLowerCase();
    var act = (ctx && ctx.act && typeof ctx.act === 'object') ? ctx.act : {};
    var p = nodeParams || {};
    if (field === 'amount') {
      var aa = actAmount(act, ctx);
      return aa > 0 ? aa : num(act.cost != null ? act.cost : p.amount, 0);
    }
    if (field === 'days') {
      var ad = actDays(act, ctx);
      return ad > 0 ? ad : num(ctx && ctx.D != null ? ctx.D : p.days, 0);
    }
    if (field === 'hours') {
      return actEffortHours(act, ctx) || num(p.hours, 0);
    }
    if (field === 'cost') return num(act.cost != null ? act.cost : (act.amount != null ? act.amount : p.cost), 0);
    if (field === 'happy') return num(act.happy != null ? act.happy : (act.scoreH != null ? act.scoreH : (ctx && ctx.y != null ? ctx.y : p.happy)), 0);
    if (field === 'score01' || field === 'scoreRaw' || field === 'scoreraw') {
      var s01 = act.score01 != null ? act.score01 : (act.scoreRaw != null ? act.scoreRaw : (act.H != null ? act.H : 0));
      return num(s01, 0);
    }
    if (field === 'rankE' || field === 'ranke') return num(act.rankE != null ? act.rankE : 0, 0);
    if (field === 'apr') return num(act.apr != null ? act.apr : (ctx && ctx.apr != null ? ctx.apr : 0), 0);
    if (field === 'D' || field === 'd') return num(act.D != null ? act.D : 0, 0);
    if (field === 'H' || field === 'h') return num(act.H != null ? act.H : 0, 0);
    if (field === 'name') return 0;
    if (act[field] != null) return num(act[field], 0);
    if (ctx && ctx[field] != null) return num(ctx[field], 0);
    return num(p[field], 0);
  }

  function resolveHorizon(unit, ctx) {
    unit = String(unit || 'months').toLowerCase();
    var WB = wbRef(ctx);
    var years = 13;
    if (ctx && ctx.horizonYears != null && Number(ctx.horizonYears) > 0) years = Number(ctx.horizonYears);
    else if (WB && WB.hdame && Number(WB.hdame.years) > 0) years = Number(WB.hdame.years);
    var months = years * 12;
    if (ctx && ctx.horizonMonths != null && Number(ctx.horizonMonths) > 0) months = Number(ctx.horizonMonths);
    if (unit === 'years' || unit === 'y') return years;
    if (unit === 'days' || unit === 'd') return Math.round(365 * months / 12);
    if (unit === 'hours' || unit === 'h') {
      var hPer = (WB && WB.hdame && Number(WB.hdame.hPerMonth) > 0) ? Number(WB.hdame.hPerMonth) : 100;
      return hPer * months;
    }
    return months;
  }

  function defaultDataBoardParams(seed) {
    seed = seed || {};
    return { metric: String(seed.metric || seed.dim || 'T') };
  }
  function defaultDataActFieldParams(seed) {
    seed = seed || {};
    var f = String(seed.field || 'amount');
    var fl = f.toLowerCase();
    var allow = {
      amount: 'amount', days: 'days', hours: 'hours', cost: 'cost', happy: 'happy',
      score01: 'score01', scoreraw: 'scoreRaw', 'scoreraw': 'scoreRaw',
      ranke: 'rankE', apr: 'apr', d: 'D', h: 'H', name: 'name'
    };
    if (allow[fl]) f = allow[fl];
    else if (['score01', 'scoreRaw', 'rankE', 'apr', 'D', 'H', 'name'].indexOf(f) < 0) f = 'amount';
    return { field: f };
  }
  function defaultDataHorizonParams(seed) {
    seed = seed || {};
    var u = String(seed.unit || 'months').toLowerCase();
    if (['months', 'days', 'years', 'hours'].indexOf(u) < 0) u = 'months';
    return { unit: u };
  }
  function defaultInputDomainParams(seed) {
    seed = seed || {};
    var fb = num(seed.fallback != null ? seed.fallback : seed.value, NaN);
    var out = {};
    if (isFinite(fb) && fb > 0) out.fallback = fb;
    return out;
  }

  /** True when an inbound edge exists for port (optional domain wires). */
  function hasInEdge(graph, nodeId, port) {
    return !!edgeInto(graph, nodeId, port);
  }

  function jfacApi() {
    try {
      if (typeof global !== 'undefined' && global.JoyFactors) return global.JoyFactors;
    } catch (_g) {}
    try {
      if (typeof window !== 'undefined' && window.JoyFactors) return window.JoyFactors;
    } catch (_w) {}
    return null;
  }

  /**
   * Primitive mechanism formulas (joy_factors.js bodies) — model pieces, not score wrappers.
   * Documented in NODE_META labels / params.hint.
   */
  function mechClamp(x, a, b) {
    x = Number(x); a = Number(a); b = Number(b);
    if (!isFinite(x)) x = 0;
    if (!isFinite(a)) a = 0;
    if (!isFinite(b)) b = 1;
    if (x < a) return a;
    if (x > b) return b;
    return x;
  }

  function mechHash01(s) {
    var h = 2166136261;
    s = String(s || '');
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return ((h >>> 0) % 10000) / 10000;
  }

  function mechAgeT(ctx) {
    ctx = ctx || {};
    var total = Number(ctx.monthsTotal) || 156;
    var lived = ctx.monthsLived;
    if (lived == null) lived = Number(ctx.monthIndex) || 0;
    return mechClamp(lived / Math.max(total, 1), 0, 1);
  }

  function mechHappinessAgeWeight(t) {
    t = mechClamp(t, 0, 1);
    var youth = 0.85 + 0.35 * (1 - t);
    var scarcity = 0.7 + 0.9 * t;
    return 0.45 * youth + 0.55 * scarcity;
  }

  function mechMoneyDisutility(cost, M, t, discountRate) {
    cost = Math.abs(Number(cost) || 0);
    M = Math.max(Number(M) || 1, 1e-6);
    t = mechClamp(t, 0, 1);
    discountRate = discountRate != null && isFinite(Number(discountRate)) ? Number(discountRate) : 0.04;
    var dep = Math.pow(1 + discountRate, t * 10);
    var scarcity = 1 + (cost / M);
    var pain = Math.log1p(cost) * scarcity * dep;
    return Math.max(pain, 1e-9);
  }

  function mechExternalFactor(name, t, E, Emax) {
    t = mechClamp(t, 0, 1);
    var u = mechHash01(String(name || '') + '|' + Math.floor(t * 100));
    var amp = 0.12;
    var noise = (u - 0.5) * 2 * amp;
    var ePress = 1;
    if (Emax && Emax > 0 && E != null && isFinite(Number(E))) {
      ePress = 1 + 0.15 * mechClamp(1 - Number(E) / Emax, 0, 1);
    }
    return 1 + noise * ePress;
  }

  function mechDaysCapacityWeight(daysUsed, D) {
    daysUsed = Math.abs(Number(daysUsed) || 0);
    D = Math.max(Number(D) || 1e-6, 1e-6);
    return 1 / (1 + daysUsed / D);
  }

  function resolveCtxField(field, ctx, nodeParams) {
    field = String(field || 'E');
    var p = nodeParams || {};
    var fb = p.fallback != null ? num(p.fallback, 0) : 0;
    ctx = ctx || {};
    if (field === 'M' || field === 'money') {
      if (ctx.X != null && isFinite(Number(ctx.X))) return Math.abs(Number(ctx.X));
      if (ctx.M != null && isFinite(Number(ctx.M))) return Math.abs(Number(ctx.M));
      return fb > 0 ? fb : 1;
    }
    if (field === 'X') {
      if (ctx.X != null && isFinite(Number(ctx.X))) return Math.abs(Number(ctx.X));
      if (ctx.M != null && isFinite(Number(ctx.M))) return Math.abs(Number(ctx.M));
      return fb > 0 ? fb : 1;
    }
    if (field === 'H' || field === 'Y') {
      var key = field === 'H' ? (ctx.Y != null ? 'Y' : 'H') : 'Y';
      if (ctx.Y != null && isFinite(Number(ctx.Y))) return Math.abs(Number(ctx.Y));
      if (ctx.H != null && isFinite(Number(ctx.H))) return Math.abs(Number(ctx.H));
      return fb > 0 ? fb : 1;
    }
    if (field === 'D') {
      var D = ctx.D;
      if (D == null || !(Number(D) > 0)) D = ctx.Dmax != null ? ctx.Dmax : fb;
      if (!(Number(D) > 0)) D = 365 / 12;
      return Number(D);
    }
    if (field === 'Dmax') return ctx.Dmax != null ? num(ctx.Dmax, fb || 31) : (fb || 31);
    if (field === 'E') {
      if (ctx.E != null && isFinite(Number(ctx.E))) return Number(ctx.E);
      return p.fallback != null ? num(p.fallback, 10) : 10;
    }
    if (field === 'Emax') {
      if (ctx.Emax != null && isFinite(Number(ctx.Emax))) return Number(ctx.Emax);
      return p.fallback != null ? num(p.fallback, 20) : 20;
    }
    if (field === 'apr') {
      var apr = ctx.apr != null ? num(ctx.apr, fb || 0) : (fb || 0);
      if (apr > 1) apr = apr * 0.01;
      return apr;
    }
    if (field === 'interest') return ctx.interest != null ? num(ctx.interest, fb) : fb;
    if (field === 'discountRate') return ctx.discountRate != null ? num(ctx.discountRate, 0.04) : (p.fallback != null ? num(p.fallback, 0.04) : 0.04);
    if (field === 'monthsLived') {
      if (ctx.monthsLived != null) return num(ctx.monthsLived, 0);
      return num(ctx.monthIndex, 0);
    }
    if (field === 'monthsTotal') return ctx.monthsTotal != null ? num(ctx.monthsTotal, 156) : 156;
    if (field === 'monthIndex') return num(ctx.monthIndex, 0);
    if (field === 'workdaysPerMonth') return ctx.workdaysPerMonth != null ? num(ctx.workdaysPerMonth, 22) : (p.fallback != null ? num(p.fallback, 22) : 22);
    if (field === 'x') {
      if (ctx.x != null && isFinite(Number(ctx.x))) return Math.abs(Number(ctx.x));
      return p.fallback != null ? num(p.fallback, 0) : 0;
    }
    if (field === 'y') {
      if (ctx.y != null && isFinite(Number(ctx.y))) return Math.abs(Number(ctx.y));
      return p.fallback != null ? num(p.fallback, 0) : 0;
    }
    if (field === 'daysUsed') {
      if (ctx.daysUsed != null) return Math.abs(num(ctx.daysUsed, 0));
      return NaN; /* caller may estimate */
    }
    if (ctx[field] != null && isFinite(Number(ctx[field]))) return Number(ctx[field]);
    return fb;
  }

  function defaultDataCtxFieldParams(seed) {
    seed = seed || {};
    var f = String(seed.field || seed.key || 'E');
    var allow = {
      E: 1, Emax: 1, D: 1, Dmax: 1, M: 1, X: 1, Y: 1, H: 1,
      x: 1, y: 1,
      apr: 1, interest: 1, discountRate: 1,
      monthsLived: 1, monthsTotal: 1, monthIndex: 1, daysUsed: 1,
      workdaysPerMonth: 1
    };
    if (!allow[f]) f = 'E';
    var out = { field: f };
    if (seed.fallback != null && isFinite(Number(seed.fallback))) out.fallback = Number(seed.fallback);
    return out;
  }

  function defaultMechParams(type, seed) {
    seed = seed || {};
    var out = {};
    if (seed.hint != null) out.hint = String(seed.hint);
    if (type === 'mech.externalFactor' || type === 'mech.hash01') {
      out.name = String(seed.name != null ? seed.name : '');
    }
    if (type === 'mech.clamp') {
      out.lo = num(seed.lo, 0);
      out.hi = num(seed.hi, 1);
    }
    if (type === 'mech.hash01' && seed.seed != null) out.seed = String(seed.seed);
    /* document formulas on nodes */
    var hints = {
      'mech.ageT': 't=clamp(lived/monthsTotal,0,1)',
      'mech.hash01': 'FNV-ish → ((h>>>0)%10000)/10000',
      'mech.clamp': 'clamp(x,lo,hi)',
      'mech.happinessAgeWeight': '0.45*youth+0.55*scarcity',
      'mech.moneyDisutility': 'log1p(cost)*scarcity*dep',
      'mech.externalFactor': '1+noise*ePress · noise=±0.12 hash',
      'mech.daysCapacityWeight': '1/(1+daysUsed/D)'
    };
    if (!out.hint && hints[type]) out.hint = hints[type];
    return out;
  }

  /**
   * Evaluate a mech.* node. ins = map of port → number (optional).
   * Returns number (or multi for future).
   */
  function evalMechNode(type, params, ins, ctx) {
    params = params || {};
    ins = ins || {};
    ctx = ctx || {};
    if (type === 'mech.clamp') {
      var a = ins.a != null ? ins.a : 0;
      var lo = ins.lo != null ? ins.lo : num(params.lo, 0);
      var hi = ins.hi != null ? ins.hi : num(params.hi, 1);
      return mechClamp(a, lo, hi);
    }
    if (type === 'mech.hash01') {
      var seed = params.seed != null ? String(params.seed) : '';
      if (!seed && params.name) seed = String(params.name);
      if (!seed && ctx.name) seed = String(ctx.name);
      if (ins.a != null) seed = String(ins.a);
      return mechHash01(seed);
    }
    if (type === 'mech.ageT') return mechAgeT(ctx);
    if (type === 'mech.happinessAgeWeight') {
      var tHw = ins.t != null ? ins.t : mechAgeT(ctx);
      return mechHappinessAgeWeight(tHw);
    }
    if (type === 'mech.moneyDisutility') {
      var cost = ins.cost != null ? ins.cost : resolveJfactorX(ctx);
      var M = ins.M != null ? ins.M : resolveCtxField('M', ctx, { fallback: 1 });
      var tMd = ins.t != null ? ins.t : mechAgeT(ctx);
      var dr = ins.rate != null ? ins.rate : resolveCtxField('discountRate', ctx, { fallback: 0.04 });
      return mechMoneyDisutility(cost, M, tMd, dr);
    }
    if (type === 'mech.externalFactor') {
      var tEx = ins.t != null ? ins.t : mechAgeT(ctx);
      var E = ins.E != null ? ins.E : resolveCtxField('E', ctx, { fallback: 10 });
      var Emax = ins.Emax != null ? ins.Emax : resolveCtxField('Emax', ctx, { fallback: 20 });
      var nm = params.name != null && String(params.name) !== '' ? String(params.name) : (ctx.name || ctx.actionName || '');
      return mechExternalFactor(nm, tEx, E, Emax);
    }
    if (type === 'mech.daysCapacityWeight') {
      var days = ins.days != null ? ins.days : resolveJfactorX(ctx);
      var D = ins.D != null ? ins.D : resolveCtxField('D', ctx, { fallback: 30 });
      return mechDaysCapacityWeight(days, D);
    }
    return 0;
  }

  /** Allowlisted JoyFactors function names (joy_factors.js) — never invent APIs. */
  var JF_CALL_ALLOW = {
    scoreMoneyToHappy: 1,
    scoreAgeTick: 1,
    scoreDebtPay: 1,
    daysCapacityWeight: 1,
    ageT: 1,
    happinessAgeWeight: 1,
    moneyDisutility: 1,
    externalFactor: 1,
    compositeItemScore: 1,
    hash01: 1
  };

  function defaultJfactorDomainParams(seed, which) {
    seed = seed || {};
    var fb = num(seed.fallback != null ? seed.fallback : seed.value, NaN);
    var out = { which: which || 'xMax' };
    if (isFinite(fb) && fb > 0) out.fallback = fb;
    if (seed.metric != null) out.metric = String(seed.metric);
    if (seed.dim != null) out.dim = String(seed.dim);
    return out;
  }
  function defaultJfactorCallParams(seed) {
    seed = seed || {};
    var fn = String(seed.fn || seed.method || 'scoreMoneyToHappy');
    if (!JF_CALL_ALLOW[fn]) fn = 'scoreMoneyToHappy';
    return { fn: fn };
  }
  function defaultJfactorJgroupParams(seed) {
    seed = seed || {};
    var field = String(seed.field || 'score').toLowerCase();
    if (['score', 'size', 'relative', 'rank', 'weight'].indexOf(field) < 0) field = 'score';
    return { field: field };
  }
  function defaultJfactorBrowseParams(seed) {
    seed = seed || {};
    var key = String(seed.key || seed.fn || seed.field || 'scoreMoneyToHappy');
    var allowed = listJoyFactorExportKeys();
    if (allowed.indexOf(key) < 0) {
      /* keep allowlisted call names even if JoyFactors offline */
      if (!JF_CALL_ALLOW[key]) key = 'scoreMoneyToHappy';
    }
    return { key: key };
  }
  function defaultSimStepParams(seed) {
    seed = seed || {};
    return {
      note: String(seed.note || 'run()→jmethod world→score'),
      feedScore: seed.feedScore !== false
    };
  }

  /* ---- easy183: local-economy sim nodes (EXAMPLE priors; no live APIs) ---- */
  var ECON_MATTHEW = {
    tz: '[REDACTED-TIMEZONE]',
    workStartMin: null /* [REDACTED-SCHEDULE-MINUTES] */,
    ,
    workEndMin: null /* [REDACTED-SCHEDULE-MINUTES] */,
    ,
    sleepStartMin: null /* [REDACTED-SCHEDULE-MINUTES] */,
    ,
    sleepEndMin: null /* [REDACTED-SCHEDULE-MINUTES] */
  };

  function defaultEconParams(type, seed) {
    seed = seed || {};
    var out = {};
    if (seed.hint != null) out.hint = String(seed.hint);
    if (seed.note != null) out.note = String(seed.note);
    if (type === 'econ.firmSupply') {
      out.capacity = mechClamp(num(seed.capacity, 0.85), 0, 1);
      out.openHoursStart = num(seed.openHoursStart, 480); /* 08:00 */
      out.openHoursEnd = num(seed.openHoursEnd, 1200);   /* 20:00 */
      out.firmId = seed.firmId != null ? String(seed.firmId) : '';
      if (!out.hint) out.hint = 'EXAMPLE supply=capacity*open · open if act overlaps firm window';
    } else if (type === 'econ.clientDemand') {
      out.demand = mechClamp(num(seed.demand, 0.35), 0, 1);
      out.clients = Math.max(0, num(seed.clients, 1));
      if (!out.hint) out.hint = 'EXAMPLE demand 0..1 · optional morning/evening bump';
    } else if (type === 'econ.scheduleConflict') {
      out.serviceStartMin = num(seed.serviceStartMin, 600);
      out.serviceEndMin = num(seed.serviceEndMin, 720);
      if (!out.hint) out.hint = 'overlap vs [REDACTED-SCHEDULE] America/Chicago';
    } else if (type === 'econ.tripCost') {
      out.minutesOneWay = Math.max(0, num(seed.minutesOneWay, 20));
      out.costUsd = Math.max(0, num(seed.costUsd, 8));
      out.weightTime = num(seed.weightTime, 1);
      out.weightMoney = num(seed.weightMoney, 1);
      if (!out.hint) out.hint = 'friction ≈ wT*(min/60)+wM*(cost/50) · 0..~5 EXAMPLE';
    } else if (type === 'econ.factorCosts') {
      out.milesOneWay = Math.max(0, num(seed.milesOneWay, 12));
      out.mpg = Math.max(1e-6, num(seed.mpg, 22));
      out.gasUsdPerGal = Math.max(0, num(seed.gasUsdPerGal, 3.2)); /* EXAMPLE/VERIFY — not live price */
      out.minutesOneWay = Math.max(0, num(seed.minutesOneWay, 20));
      out.parkingUsd = Math.max(0, num(seed.parkingUsd, 0));
      out.serviceUsd = Math.max(0, num(seed.serviceUsd, seed.costUsd != null ? seed.costUsd : 0));
      out.daysUse = Math.max(0, num(seed.daysUse, 0.15));
      if (seed.note != null) out.note = String(seed.note);
      if (!out.hint) out.hint = 'EXAMPLE factor-weighted friction: gas+parking+service $, roundtrip hours, daysUse · weights from WB.factorOrder (M/T/D)';
    } else if (type === 'econ.benefitNet') {
      out.emitMin = num(seed.emitMin, 0.55);
      if (!out.hint) out.hint = 'net=benefit*supply/(1+demand)/(1+friction)*(1-conflict)';
    }
    return out;
  }

  function econOverlapFrac(a0, a1, b0, b1) {
    a0 = num(a0, 0); a1 = num(a1, 0); b0 = num(b0, 0); b1 = num(b1, 0);
    if (!(a1 > a0) || !(b1 > b0)) return 0;
    var lo = Math.max(a0, b0);
    var hi = Math.min(a1, b1);
    var ov = Math.max(0, hi - lo);
    return ov / Math.max(1, a1 - a0);
  }

  /** Act service window in minutes-from-midnight, or null if unknown. */
  function econActWindow(ctx) {
    var act = (ctx && ctx.act && typeof ctx.act === 'object') ? ctx.act : null;
    if (!act) return null;
    var s = act.startMin != null ? num(act.startMin, NaN) : NaN;
    var e = act.endMin != null ? num(act.endMin, NaN) : NaN;
    if (isFinite(s) && isFinite(e) && e > s) return { startMin: s, endMin: e };
    if (Array.isArray(act.hours) && act.hours.length) {
      var hs = [];
      for (var i = 0; i < act.hours.length; i++) {
        var h = num(act.hours[i], NaN);
        if (isFinite(h)) hs.push(h);
      }
      if (hs.length) {
        var mn = Math.min.apply(null, hs);
        var mx = Math.max.apply(null, hs);
        return { startMin: mn * 60, endMin: (mx + 1) * 60 };
      }
    }
    return null;
  }

  /** Local harmonic shares (same law as ranking_ui harmonicShares) — fallback when factorWeights() unavailable. */
  function harmonicSharesLocal(order, invert) {
    order = Array.isArray(order) ? order : [];
    var n = order.length;
    if (!n) return {};
    var sumW = 0, weights = {};
    for (var i = 0; i < n; i++) {
      var name = order[i];
      var pos = i + 1;
      var r = invert ? Math.max(1, n - pos + 1) : pos;
      var w = 1 / r;
      weights[name] = w;
      sumW += w;
    }
    var shares = {};
    for (var j = 0; j < n; j++) {
      var nm = order[j];
      shares[nm] = sumW > 0 ? weights[nm] / sumW : 0;
    }
    return shares;
  }

  /**
   * Resolve M/T/D factor weights for location friction.
   * Prefer global factorWeights(); else WB.factorOrder harmonic; else equal M/T/D.
   * Returns renormalized { wM, wT, wD } summing to 1 among the three cost dims.
   */
  function resolveFactorWeightsMTD(ctx) {
    var fw = null;
    try {
      if (typeof factorWeights === 'function') fw = factorWeights();
    } catch (_fw) { fw = null; }
    if (!fw || typeof fw !== 'object') {
      try {
        if (typeof global !== 'undefined' && typeof global.factorWeights === 'function') fw = global.factorWeights();
      } catch (_g) {}
    }
    if (!fw || typeof fw !== 'object') {
      var WB = wbRef(ctx);
      var order = (WB && Array.isArray(WB.factorOrder) && WB.factorOrder.length)
        ? WB.factorOrder.slice()
        : ['H', 'M', 'D', 'T', 'S', 'U', 'A', 'E'];
      fw = harmonicSharesLocal(order, false);
    }
    var wM = num(fw.M, 0);
    var wT = num(fw.T, 0);
    var wD = num(fw.D, 0);
    var sum = wM + wT + wD;
    if (!(sum > 0)) {
      wM = wT = wD = 1 / 3;
      sum = 1;
    }
    return { wM: wM / sum, wT: wT / sum, wD: wD / sum, raw: fw };
  }

  /**
   * Factor-weighted location cost (Money/Time/Days).
   * gasUsd = (milesOneWay*2 / mpg) * gasUsdPerGal  — EXAMPLE priors; VERIFY live gas/mpg.
   * money = gas + parking + service (+ wired money)
   * timeH = roundtrip hours; days = daysUse
   * nM=money/50, nT=timeH/2, nD=days/1 clamp 0..3; friction = clamp(wM*nM+wT*nT+wD*nD, 0, 5)
   */
  function computeFactorCosts(params, ins, ctx) {
    params = defaultEconParams('econ.factorCosts', params || {});
    ins = ins || {};
    var milesOW = ins.miles != null ? Math.max(0, num(ins.miles, params.milesOneWay)) : params.milesOneWay;
    var mpg = Math.max(1e-6, num(params.mpg, 22));
    var gasP = Math.max(0, num(params.gasUsdPerGal, 3.2));
    var minOW = ins.minutes != null ? Math.max(0, num(ins.minutes, params.minutesOneWay)) : params.minutesOneWay;
    var parking = Math.max(0, num(params.parkingUsd, 0));
    var service = Math.max(0, num(params.serviceUsd, 0));
    var days = ins.days != null ? Math.max(0, num(ins.days, params.daysUse)) : params.daysUse;
    var gasUsd = (milesOW * 2 / mpg) * gasP;
    if (!isFinite(gasUsd) || gasUsd < 0) gasUsd = 0;
    var moneyOut = gasUsd + parking + service;
    if (ins.money != null) moneyOut += Math.max(0, num(ins.money, 0));
    if (!isFinite(moneyOut) || moneyOut < 0) moneyOut = 0;
    var timeH = (Math.max(0, minOW) * 2) / 60;
    if (!isFinite(timeH) || timeH < 0) timeH = 0;
    days = Math.max(0, num(days, 0));
    var w = resolveFactorWeightsMTD(ctx);
    var nM = mechClamp(moneyOut / 50, 0, 3);
    var nT = mechClamp(timeH / 2, 0, 3);
    var nD = mechClamp(days / 1, 0, 3);
    var friction = mechClamp(w.wM * nM + w.wT * nT + w.wD * nD, 0, 5);
    return {
      money: moneyOut,
      timeH: timeH,
      days: days,
      friction: friction,
      wM: w.wM,
      wT: w.wT,
      wD: w.wD,
      gasUsd: gasUsd,
      milesOneWay: milesOW,
      minutesOneWay: minOW
    };
  }

  /**
   * Shared helper for econ.factorCosts node + simNetForService.
   * Reads EXAMPLE miles/mpg/gas/minutes/parking/service/days from svc (costUsd → serviceUsd).
   */
  function factorWeightedFriction(svc, firm, ctx) {
    svc = svc || {};
    firm = firm || {};
    var seed = {
      milesOneWay: svc.milesOneWay != null ? svc.milesOneWay : undefined,
      mpg: svc.mpg != null ? svc.mpg : undefined,
      gasUsdPerGal: svc.gasUsdPerGal != null ? svc.gasUsdPerGal : undefined,
      minutesOneWay: svc.minutesOneWay != null ? svc.minutesOneWay : undefined,
      parkingUsd: svc.parkingUsd != null ? svc.parkingUsd : undefined,
      serviceUsd: svc.serviceUsd != null ? svc.serviceUsd : (svc.costUsd != null ? svc.costUsd : undefined),
      daysUse: svc.daysUse != null ? svc.daysUse : undefined,
      note: svc.note != null ? svc.note : undefined
    };
    return computeFactorCosts(seed, {}, ctx);
  }

  /**
   * Evaluate econ.* node. ins = optional wired numbers.
   * Returns number or {port: number} multi-out map.
   */
  function evalEconNode(type, params, ins, ctx) {
    params = defaultEconParams(type, params || {});
    ins = ins || {};
    ctx = ctx || {};
    if (type === 'econ.firmSupply') {
      var cap = ins.capacity != null ? num(ins.capacity, params.capacity) : params.capacity;
      cap = mechClamp(cap, 0, 1);
      var o0 = params.openHoursStart;
      var o1 = params.openHoursEnd;
      var aw = econActWindow(ctx);
      var open = 1;
      if (aw && isFinite(o0) && isFinite(o1) && o1 > o0) {
        open = econOverlapFrac(aw.startMin, aw.endMin, o0, o1) > 0 ? 1 : 0;
      }
      return { supply: cap * open, open: open };
    }
    if (type === 'econ.clientDemand') {
      var d = ins.demand != null ? num(ins.demand, params.demand) : params.demand;
      d = mechClamp(d, 0, 1);
      var bump = 0;
      var wb = ctx.wb;
      if (wb && typeof wb === 'object') {
        bump = 0.05 * (num(wb.morningPressure, 0) + num(wb.eveningPressure, 0));
      }
      if (!(bump > 0)) {
        var awd = econActWindow(ctx);
        if (awd) {
          var mid = (awd.startMin + awd.endMin) / 2;
          if ((mid >= 360 && mid <= 600) || (mid >= 1020 && mid <= 1260)) bump = 0.08;
        }
      }
      return { demand: mechClamp(d + bump, 0, 1) };
    }
    if (type === 'econ.scheduleConflict') {
      var awc = econActWindow(ctx);
      var s0 = awc ? awc.startMin : params.serviceStartMin;
      var s1 = awc ? awc.endMin : params.serviceEndMin;
      if (!(s1 > s0)) {
        s0 = params.serviceStartMin;
        s1 = params.serviceEndMin;
      }
      var cWork = econOverlapFrac(s0, s1, ECON_MATTHEW.workStartMin, ECON_MATTHEW.workEndMin);
      var cSleep = econOverlapFrac(s0, s1, ECON_MATTHEW.sleepStartMin, ECON_MATTHEW.sleepEndMin);
      return { conflict: mechClamp(cWork + cSleep, 0, 1) };
    }
    if (type === 'econ.tripCost') {
      var minutes = ins.minutes != null ? num(ins.minutes, params.minutesOneWay) : params.minutesOneWay;
      var cost = ins.cost != null ? num(ins.cost, params.costUsd) : params.costUsd;
      minutes = Math.max(0, num(minutes, 0));
      cost = Math.max(0, num(cost, 0));
      var wt = num(params.weightTime, 1);
      var wm = num(params.weightMoney, 1);
      var friction = wt * (minutes / 60) + wm * (cost / 50);
      if (!isFinite(friction)) friction = 0;
      return { friction: mechClamp(friction, 0, 5) };
    }
    if (type === 'econ.factorCosts') {
      var fc = computeFactorCosts(params, ins, ctx);
      return {
        money: fc.money,
        timeH: fc.timeH,
        days: fc.days,
        friction: fc.friction,
        wM: fc.wM,
        wT: fc.wT,
        wD: fc.wD
      };
    }
    if (type === 'econ.benefitNet') {
      var benefit = mechClamp(num(ins.benefit, 0), 0, 1);
      var frictionN = Math.max(0, num(ins.friction, 0));
      var supply = mechClamp(num(ins.supply, 1), 0, 1);
      var demand = mechClamp(num(ins.demand, 0), 0, 1);
      var conflict = mechClamp(num(ins.conflict, 0), 0, 1);
      var net = benefit * supply / (1 + demand) / (1 + frictionN) * (1 - conflict);
      if (!isFinite(net) || net < 0) net = 0;
      var emitMin = num(params.emitMin, 0.55);
      return { net: net, emitOk: net >= emitMin ? 1 : 0 };
    }
    return 0;
  }

  /* ---- easy184: multi-firm Board emit helpers (EXAMPLE priors; JS simNet, no full graph run) ---- */
  /**
   * Collect {service, firm} pairs from idea.economy.firms[].services.
   * Returns [] if economy.firms missing/empty.
   */
  function economyServicesFromIdea(idea) {
    idea = idea || {};
    var eco = idea.economy;
    var out = [];
    if (!eco || !Array.isArray(eco.firms)) return out;
    for (var i = 0; i < eco.firms.length; i++) {
      var firm = eco.firms[i];
      if (!firm || !Array.isArray(firm.services)) continue;
      for (var j = 0; j < firm.services.length; j++) {
        var svc = firm.services[j];
        if (!svc) continue;
        out.push({ service: svc, firm: firm });
      }
    }
    return out;
  }

  /**
   * Honesty simNet matching econ.benefitNet (no graph compile):
   * net = benefit * supply / (1+demand) / (1+friction) * (1-conflict)
   * friction = factorWeightedFriction (M/T/D via WB.factorOrder); frictionIndex only if no cost fields
   * supply = service.supply ?? firm.capacity ?? 1
   * demand = service.demand ?? 0.3
   * conflict = overlap of service window vs [REDACTED-SCHEDULE] (rhythm or ECON_MATTHEW)
   */
  function simNetForService(svc, firm, rhythm, ctx) {
    svc = svc || {};
    firm = firm || {};
    rhythm = rhythm || ECON_MATTHEW;
    ctx = ctx || {};
    var benefit = mechClamp(num(svc.benefitPrior, 0), 0, 1);
    /* easy186: factor-weighted Money/Time/Days friction (shared with econ.factorCosts) */
    var fr = factorWeightedFriction(svc, firm, ctx);
    var friction = fr.friction;
    if (svc.frictionIndex != null && isFinite(num(svc.frictionIndex, NaN))
        && svc.milesOneWay == null && svc.minutesOneWay == null && svc.costUsd == null
        && svc.serviceUsd == null && svc.daysUse == null) {
      /* explicit frictionIndex only when no location-cost fields present */
      friction = Math.max(0, num(svc.frictionIndex, 0));
    }
    var supply = 1;
    if (svc.supply != null && isFinite(num(svc.supply, NaN))) supply = mechClamp(num(svc.supply, 1), 0, 1);
    else if (firm.capacity != null && isFinite(num(firm.capacity, NaN))) supply = mechClamp(num(firm.capacity, 1), 0, 1);
    var demand = 0.3;
    if (svc.demand != null && isFinite(num(svc.demand, NaN))) demand = mechClamp(num(svc.demand, 0.3), 0, 1);
    var s0 = num(svc.startMin, 600);
    var s1 = num(svc.endMin, 720);
    if (!(s1 > s0) && Array.isArray(svc.hours) && svc.hours.length) {
      var hs = [];
      for (var hi = 0; hi < svc.hours.length; hi++) {
        var h = num(svc.hours[hi], NaN);
        if (isFinite(h)) hs.push(h);
      }
      if (hs.length) {
        s0 = Math.min.apply(null, hs) * 60;
        s1 = (Math.max.apply(null, hs) + 1) * 60;
      }
    }
    var cWork = econOverlapFrac(s0, s1, num(rhythm.workStartMin, ECON_MATTHEW.workStartMin), num(rhythm.workEndMin, ECON_MATTHEW.workEndMin));
    var cSleep = econOverlapFrac(s0, s1, num(rhythm.sleepStartMin, ECON_MATTHEW.sleepStartMin), num(rhythm.sleepEndMin, ECON_MATTHEW.sleepEndMin));
    var conflict = mechClamp(cWork + cSleep, 0, 1);
    var net = benefit * supply / (1 + demand) / (1 + friction) * (1 - conflict);
    if (!isFinite(net) || net < 0) net = 0;
    return {
      net: net,
      benefit: benefit,
      friction: friction,
      supply: supply,
      demand: demand,
      conflict: conflict,
      startMin: s0,
      endMin: s1,
      money: fr.money,
      timeH: fr.timeH,
      days: fr.days,
      wM: fr.wM,
      wT: fr.wT,
      wD: fr.wD,
      gasUsd: fr.gasUsd
    };
  }

  /** Build a Board emit spec from a firm service (+ optional precomputed sim). EXAMPLE/VERIFY labels. */
  function boardSpecFromEconomyService(svc, firm, sim) {
    svc = svc || {};
    firm = firm || {};
    sim = sim || simNetForService(svc, firm);
    var svcId = String(svc.id || 'svc').trim();
    var actId = svc.boardActId != null ? String(svc.boardActId)
      : ('act_le_' + svcId.replace(/^svc_/, ''));
    var firmName = firm.name != null ? String(firm.name) : '';
    var firmId = firm.id != null ? String(firm.id) : (svc.firmId != null ? String(svc.firmId) : '');
    var why = svc.benefitWhy != null ? String(svc.benefitWhy) : '';
    var note = why || (svc.note != null ? String(svc.note) : '');
    if (firmName && note.indexOf('firm=') < 0) note = (note ? note + ' · ' : '') + 'firm=' + firmName;
    var sn = Math.round(num(sim.net, 0) * 1000) / 1000;
    if (note.indexOf('simNet') < 0) note = (note ? note + ' · ' : '') + 'simNet≈' + sn + ' (EXAMPLE)';
    var simMoney = sim.money != null ? num(sim.money, 0) : null;
    var simTimeH = sim.timeH != null ? num(sim.timeH, 0) : null;
    var simDays = sim.days != null ? num(sim.days, 0) : null;
    if (/friction/i.test(note) && (simMoney != null || simTimeH != null || simDays != null)
        && note.indexOf('simMoney') < 0 && note.indexOf('$≈') < 0) {
      var bits = [];
      if (simMoney != null) bits.push('$≈' + (Math.round(simMoney * 100) / 100));
      if (simTimeH != null) bits.push('timeH≈' + (Math.round(simTimeH * 100) / 100));
      if (simDays != null) bits.push('days≈' + (Math.round(simDays * 1000) / 1000));
      if (bits.length) note = note + ' · friction breakdown ' + bits.join(' / ') + ' (EXAMPLE)';
    }
    var spec = {
      id: actId,
      name: String(svc.name || actId),
      kind: 'schedule',
      cadence: 'selected',
      startMin: sim.startMin != null ? sim.startMin : num(svc.startMin, 600),
      endMin: sim.endMin != null ? sim.endMin : num(svc.endMin, 720),
      hours: Array.isArray(svc.hours) ? svc.hours.slice() : undefined,
      allDay: false,
      note: note,
      suggestMust: false,
      __seedExample: true,
      section: svc.section || 'SCHEDULE',
      preferDays: Array.isArray(svc.preferDays) ? svc.preferDays.slice() : undefined,
      preferCadence: svc.preferCadence != null ? String(svc.preferCadence) : undefined,
      selectedKeys: [],
      placeOnCalendar: false,
      benefitPrior: num(svc.benefitPrior, sim.benefit),
      frictionIndex: num(sim.friction, svc.frictionIndex),
      simNet: sn,
      simMoney: simMoney != null ? simMoney : undefined,
      simTimeH: simTimeH != null ? simTimeH : undefined,
      simDays: simDays != null ? simDays : undefined,
      benefitWhy: why || undefined,
      firmId: firmId || undefined,
      skipEmit: svc.skipEmit === true ? true : undefined,
      jmethod: 'localEconomy'
    };
    if (svc.minutesOneWay != null) spec.minutesOneWay = num(svc.minutesOneWay, 0);
    if (svc.milesOneWay != null) spec.milesOneWay = num(svc.milesOneWay, 0);
    if (svc.costUsd != null) spec.costUsd = num(svc.costUsd, 0);
    if (svc.demand != null) spec.demand = num(svc.demand, 0);
    if (firm.capacity != null) spec.firmCapacity = num(firm.capacity, 0);
    return spec;
  }

  /** Prefer economy.firms services → Board specs; else fall back to idea.boardItems. */
  function boardItemsFromIdeaEconomy(idea, opts) {
    opts = opts || {};
    idea = idea || {};
    var pairs = economyServicesFromIdea(idea);
    if (pairs.length) {
      var items = [];
      for (var i = 0; i < pairs.length; i++) {
        var p = pairs[i];
        var sim = simNetForService(p.service, p.firm, opts.rhythm);
        items.push(boardSpecFromEconomyService(p.service, p.firm, sim));
      }
      return { items: items, source: 'economy.firms', count: items.length };
    }
    var fallback = Array.isArray(idea.boardItems) ? idea.boardItems.slice() : [];
    return { items: fallback, source: fallback.length ? 'boardItems' : 'none', count: fallback.length };
  }

  /* ---- easy185: live ingest stub (honesty: no scrape / no fake API success) ---- */
  /**
   * Validate firms[] shape: each firm needs id, name, services[] with benefitPrior.
   * Returns { ok, firms, message, errors }.
   */
  function validateEconomyFirms(firmsIn) {
    var errors = [];
    if (!Array.isArray(firmsIn)) {
      return { ok: false, firms: [], message: 'firms must be an array', errors: ['not_array'] };
    }
    var out = [];
    for (var i = 0; i < firmsIn.length; i++) {
      var f = firmsIn[i];
      if (!f || typeof f !== 'object') {
        errors.push('firm[' + i + ']:not_object');
        continue;
      }
      var id = f.id != null ? String(f.id).trim() : '';
      var name = f.name != null ? String(f.name).trim() : '';
      if (!id) errors.push('firm[' + i + ']:missing_id');
      if (!name) errors.push('firm[' + i + ']:missing_name');
      if (!Array.isArray(f.services) || !f.services.length) {
        errors.push('firm[' + i + ']:services_required');
        continue;
      }
      var svcs = [];
      for (var j = 0; j < f.services.length; j++) {
        var s = f.services[j];
        if (!s || typeof s !== 'object') {
          errors.push('firm[' + i + '].services[' + j + ']:not_object');
          continue;
        }
        if (s.benefitPrior == null || !isFinite(num(s.benefitPrior, NaN))) {
          errors.push('firm[' + i + '].services[' + j + ']:benefitPrior_required');
          continue;
        }
        svcs.push(s);
      }
      if (!svcs.length) {
        errors.push('firm[' + i + ']:no_valid_services');
        continue;
      }
      if (id && name) {
        var copy = {};
        for (var k in f) {
          if (Object.prototype.hasOwnProperty.call(f, k)) copy[k] = f[k];
        }
        copy.id = id;
        copy.name = name;
        copy.services = svcs;
        out.push(copy);
      }
    }
    if (!out.length) {
      return { ok: false, firms: [], message: 'no valid firms (need id, name, services[].benefitPrior)', errors: errors };
    }
    return { ok: true, firms: out, message: 'ok', errors: errors };
  }

  /**
   * Live listings ingest stub.
   * @param {object} source — idea, or jmethod state with .idea, or boardItemsSource carrier
   * @param {object} [opts] — firmsJson | replaceFirms (array) to import; markLive:true to skip __seedExample
   * Without import payload: always returns stub (never invents/scrapes/fakes live success).
   */
  function ingestLocalEconomy(source, opts) {
    opts = opts || {};
    var idea = null;
    if (source && source.idea && typeof source.idea === 'object') idea = source.idea;
    else if (source && typeof source === 'object') idea = source;
    else idea = {};

    var existing = (idea.economy && Array.isArray(idea.economy.firms)) ? idea.economy.firms : [];
    var srcMeta = (idea.boardItemsSource && typeof idea.boardItemsSource === 'object')
      ? idea.boardItemsSource
      : ((source && source.boardItemsSource && typeof source.boardItemsSource === 'object') ? source.boardItemsSource : {});
    var srcType = srcMeta.type != null ? String(srcMeta.type) : '';
    var liveUrl = srcMeta.url || srcMeta.liveUrl || opts.url || opts.liveUrl || null;

    var firmsIn = null;
    if (Array.isArray(opts.replaceFirms)) firmsIn = opts.replaceFirms;
    else if (Array.isArray(opts.firmsJson)) firmsIn = opts.firmsJson;
    else if (typeof opts.firmsJson === 'string' && String(opts.firmsJson).trim()) {
      try {
        var parsed = JSON.parse(opts.firmsJson);
        if (Array.isArray(parsed)) firmsIn = parsed;
        else if (parsed && Array.isArray(parsed.firms)) firmsIn = parsed.firms;
        else {
          return {
            ok: false,
            status: 'error',
            updated: false,
            firms: existing,
            message: 'firmsJson must be an array or {firms:[]}'
          };
        }
      } catch (_pj) {
        return {
          ok: false,
          status: 'error',
          updated: false,
          firms: existing,
          message: 'invalid firmsJson JSON: ' + String(_pj && _pj.message || _pj)
        };
      }
    }

    if (firmsIn) {
      var validated = validateEconomyFirms(firmsIn);
      if (!validated.ok) {
        return {
          ok: false,
          status: 'error',
          updated: false,
          firms: existing,
          message: validated.message,
          errors: validated.errors
        };
      }
      var markLive = opts.markLive === true;
      var firms = [];
      for (var fi = 0; fi < validated.firms.length; fi++) {
        var firm = validated.firms[fi];
        var fc = {};
        for (var fk in firm) {
          if (Object.prototype.hasOwnProperty.call(firm, fk)) fc[fk] = firm[fk];
        }
        if (!markLive) fc.__seedExample = true;
        else if (fc.__seedExample) delete fc.__seedExample;
        if (Array.isArray(fc.services)) {
          var scopy = [];
          for (var si = 0; si < fc.services.length; si++) {
            var svc = fc.services[si];
            var sc = {};
            for (var sk in svc) {
              if (Object.prototype.hasOwnProperty.call(svc, sk)) sc[sk] = svc[sk];
            }
            if (!markLive) sc.__seedExample = true;
            else if (sc.__seedExample) delete sc.__seedExample;
            scopy.push(sc);
          }
          fc.services = scopy;
        }
        firms.push(fc);
      }
      if (!idea.economy || typeof idea.economy !== 'object') idea.economy = {};
      idea.economy.firms = firms;
      if (idea.economy.note == null) {
        idea.economy.note = markLive
          ? 'Imported firms (markLive) — still verify hours/prices'
          : 'Imported JSON — EXAMPLE/seeded unless markLive; verify hours/prices';
      }
      var built = boardItemsFromIdeaEconomy(idea, opts);
      if (built && Array.isArray(built.items)) {
        idea.boardItems = built.items.slice();
      }
      if (!idea.boardItemsSource || typeof idea.boardItemsSource !== 'object') {
        idea.boardItemsSource = { type: 'economy.firms', fallback: 'boardItems' };
      }
      idea.boardItemsSource.type = 'economy.firms';
      idea.boardItemsSource.ingest = markLive ? 'imported-live' : 'imported';
      idea.boardItemsSource.honesty = markLive
        ? 'Imported (markLive) — not scraped; verify hours/prices'
        : 'Imported JSON — EXAMPLE/seeded; verify hours/prices';
      idea.boardItemsSource.next = 'connect listings/hours API or paste firms JSON';
      if (source && source.idea === idea && source.boardItemsSource) {
        source.boardItemsSource = idea.boardItemsSource;
      }
      return {
        ok: true,
        status: 'imported',
        updated: true,
        count: firms.length,
        firms: firms,
        boardItems: idea.boardItems,
        honesty: idea.boardItemsSource.honesty,
        message: 'Imported ' + firms.length + ' firm(s) — board candidates rebuilt from economy.firms'
      };
    }

    /* Stub path: static / economy.firms / missing live URL — and never fake live success */
    var stubMsg = 'Live listings ingest not connected — EXAMPLE priors unchanged. Paste/import JSON to replace.';
    return {
      ok: true,
      status: 'stub',
      honesty: 'no live listings yet',
      updated: false,
      firms: existing,
      sourceType: srcType || null,
      liveUrl: liveUrl ? String(liveUrl) : null,
      message: stubMsg
    };
  }

  /** Real JoyFactors export keys (functions + listFactors) — never invent. */
  function listJoyFactorExportKeys() {
    var JF = jfacApi();
    var keys = [];
    var seen = Object.create(null);
    function add(k) {
      k = String(k || '');
      if (!k || seen[k]) return;
      /* skip non-callable / meta */
      if (k === 'registerFactor' || k === 'listFactors' || k === 'CALENDAR_VIEW') return;
      seen[k] = 1;
      keys.push(k);
    }
    if (JF && typeof JF.listFactors === 'function') {
      try {
        (JF.listFactors() || []).forEach(add);
      } catch (_lf) {}
    }
    if (JF && typeof JF === 'object') {
      Object.keys(JF).forEach(function (k) {
        if (typeof JF[k] === 'function') add(k);
      });
    }
    /* ensure allowlisted scorers always present for offline node --check */
    Object.keys(JF_CALL_ALLOW).forEach(add);
    keys.sort();
    return keys;
  }

  var PLACE_KINDS = {
    earn: 1, moneyToHappy: 1, daysUse: 1, ageTick: 1, extUse: 1, debtPay: 1, generic: 1
  };

  function defaultPlaceFromActParams(seed) {
    seed = seed || {};
    var kind = String(seed.kind || seed.method || 'generic');
    if (!PLACE_KINDS[kind]) kind = 'generic';
    return { kind: kind };
  }

  /** Mirror RunJMethods.actEffortHours for Blueprint place parity. */
  function actEffortHours(act, ctx) {
    ctx = ctx || {};
    if (act) {
      if (act.hoursPerWeek != null) return Math.abs(num(act.hoursPerWeek, 0));
      if (act.workHours != null) return Math.abs(num(act.workHours, 0));
      if (act.startMin != null && act.endMin != null) {
        return Math.max(0, (num(act.endMin) - num(act.startMin)) / 60);
      }
      if (act.hours && act.hours.length && act.hours[0] !== 'all') return act.hours.length;
    }
    if (ctx.x != null) return Math.abs(num(ctx.x, 8));
    return 8;
  }
  function actAmount(act, ctx) {
    ctx = ctx || {};
    var amt = 0;
    if (act) amt = Math.abs(num(act.amountMonthly != null ? act.amountMonthly : act.amount, 0));
    if (!(amt > 0) && ctx.x != null) amt = Math.abs(num(ctx.x, 0));
    return amt;
  }
  function actDays(act, ctx) {
    ctx = ctx || {};
    if (act) {
      if (act.spanDays != null) return Math.max(0, Math.abs(num(act.spanDays, 0)));
      if (act.weekdaySpan != null) return Math.max(0, Math.abs(num(act.weekdaySpan, 0)));
      if (act.selectedKeys && act.selectedKeys.length) return act.selectedKeys.length;
      if (act.daysUsed != null) return Math.max(0, Math.abs(num(act.daysUsed, 0)));
    }
    if (ctx.x != null) return Math.abs(num(ctx.x, 1));
    return 1;
  }

  /**
   * METHODS.place parity for builtin kinds — used by place.fromAct → place.out.
   * Returns {x,y,label,...}.
   */
  function resolvePlaceFromAct(kind, act, ctx) {
    kind = String(kind || 'generic');
    ctx = ctx || {};
    act = act || {};
    var label = (act && (act.name || act.id)) || kind;
    var JF = jfacApi();

    if (kind === 'earn') {
      var hoursDay = Math.max(actEffortHours(act, ctx), 0.01);
      var daysMo = ctx.workdaysPerMonth != null ? num(ctx.workdaysPerMonth, 22) : 22;
      var hoursMo = hoursDay * daysMo;
      var income = actAmount(act, ctx);
      if (!(income > 0) && ctx.y != null) income = Math.abs(num(ctx.y, 0));
      if (!(income > 0)) {
        var xMaxE = num(ctx._xMax != null ? ctx._xMax : ctx.xMax, 880) || 880;
        var yMaxE = num(ctx._yMax != null ? ctx._yMax : ctx.yMax, 8000) || 8000;
        income = (yMaxE / xMaxE) * hoursMo;
      }
      return { x: hoursMo, y: income, hoursDay: hoursDay, label: label || 'earn' };
    }
    if (kind === 'moneyToHappy') {
      var cost = Math.max(actAmount(act, ctx), 0.01);
      var happy = 0;
      if (ctx.y != null) happy = Math.abs(num(ctx.y, 0));
      if (!(happy > 0) && act) {
        var s01 = act.score01 != null ? num(act.score01, 0)
          : (act.scoreRaw != null ? num(act.scoreRaw, 0)
            : (act.H != null ? num(act.H, 0) : 0));
        if (s01 > 0 && s01 <= 1.5) happy = s01 * Math.max(cost, 1) * 0.15;
        else if (s01 > 0) happy = s01;
      }
      if (!(happy > 0)) happy = Math.max(cost * 0.01, 0.001);
      return { x: cost, y: happy, label: label || 'spend' };
    }
    if (kind === 'daysUse') {
      var days = Math.max(actDays(act, ctx), 0.01);
      var cD = { D: ctx.D != null ? ctx.D : 30, Dmax: ctx.Dmax != null ? ctx.Dmax : 31 };
      var ret = 0;
      if (ctx.y != null) ret = Math.abs(num(ctx.y, 0));
      if (!(ret > 0) && act && act.D != null) ret = Math.abs(num(act.D, 0));
      if (!(ret > 0)) {
        var dayW = (JF && JF.daysCapacityWeight)
          ? JF.daysCapacityWeight(days, cD.D, cD.Dmax)
          : (1 / (1 + days / Math.max(Number(cD.D) || 1, 1e-6)));
        var gain = (act && act.score01 != null) ? Math.abs(num(act.score01, 1)) : 1;
        ret = (gain + 1e-6) * dayW * 10;
      }
      return { x: days, y: ret, label: label || 'days' };
    }
    if (kind === 'ageTick') {
      var ax = ctx.x != null ? Math.abs(num(ctx.x, 1)) : 1;
      var ay = 0;
      if (JF && typeof JF.scoreAgeTick === 'function') {
        ay = Math.max(0, Number(JF.scoreAgeTick({ x: Math.max(0.01, ax), y: -0.01, name: 'age_tick' })) || 0);
      } else {
        ay = 0.15 / (1 + Math.max(0.01, ax));
      }
      return { x: ax, y: ay, label: label || 'age tick' };
    }
    if (kind === 'extUse') {
      var used = ctx.x != null ? Math.abs(num(ctx.x, 0.5)) : 0.5;
      if (act && act.rankE != null) used = Math.abs(num(act.rankE, used));
      var eret = 0;
      if (ctx.y != null) eret = Math.abs(num(ctx.y, 0));
      if (!(eret > 0)) {
        var tt = (JF && JF.ageT) ? JF.ageT(ctx) : 0.3;
        var ext = (JF && JF.externalFactor)
          ? JF.externalFactor((act && act.name) || 'ext', tt, ctx.E, ctx.Emax)
          : 1;
        var egain = (act && act.score01 != null) ? Math.max(num(act.score01, 1), 0.01) : 1;
        eret = (egain + 1e-6) * ext / (1 + used);
      }
      return { x: used, y: eret, label: label || 'external' };
    }
    if (kind === 'debtPay') {
      var pay = Math.max(actAmount(act, ctx), 0.01);
      var apr = ctx.apr != null ? num(ctx.apr, 0) : (act && act.apr != null ? num(act.apr, 0) : 0.18);
      if (apr > 1) apr = apr * 0.01;
      if (!(apr > 0)) apr = 0.18;
      var dy = 0;
      if (JF && typeof JF.scoreDebtPay === 'function') {
        dy = Math.max(0, Number(JF.scoreDebtPay({
          x: pay,
          y: pay * 0.5,
          apr: apr,
          interest: ctx.interest != null ? ctx.interest : pay * apr / 12,
          X: ctx.X != null ? ctx.X : 2000,
          name: ctx.name
        })) || 0);
      } else {
        dy = (1.5 + 8 * apr) * Math.sqrt(pay * 0.5 + pay * 0.25) / (1 + pay / 2000);
      }
      var dlab = label || 'debt';
      if (apr > 0) dlab += ' · APR ' + (apr * 100).toFixed(1) + '%';
      return { x: pay, y: dy, label: dlab, apr: apr };
    }
    /* generic: jfactor-like x/y from act */
    return {
      x: Math.max(0, resolveJfactorX(Object.assign({}, ctx, { act: act }))),
      y: Math.max(0, resolveJfactorY(Object.assign({}, ctx, { act: act }))),
      label: label || 'place'
    };
  }

  /**
   * Placement x like liveBest/RunJMethods.place — prefer ctx.x, else act-derived.
   */
  function resolveJfactorX(ctx) {
    ctx = ctx || {};
    if (ctx.x != null && isFinite(Number(ctx.x))) return Math.max(0, Number(ctx.x));
    var act = (ctx.act && typeof ctx.act === 'object') ? ctx.act : {};
    if (act.x != null && isFinite(Number(act.x))) return Math.max(0, Number(act.x));
    if (act.amount != null || act.cost != null) return Math.max(0, num(act.amount != null ? act.amount : act.cost, 0));
    if (act.days != null) return Math.max(0, num(act.days, 0));
    if (act.hours != null) return Math.max(0, num(act.hours, 0));
    return 0;
  }
  function resolveJfactorY(ctx) {
    ctx = ctx || {};
    if (ctx.y != null && isFinite(Number(ctx.y))) return Math.max(0, Number(ctx.y));
    var act = (ctx.act && typeof ctx.act === 'object') ? ctx.act : {};
    if (act.y != null && isFinite(Number(act.y))) return Math.max(0, Number(act.y));
    if (act.happy != null) return Math.max(0, num(act.happy, 0));
    if (act.score01 != null) return Math.max(0, num(act.score01, 0));
    if (act.H != null) return Math.max(0, num(act.H, 0));
    if (act.income != null) return Math.max(0, num(act.income, 0));
    return 0;
  }

  /**
   * Domain from jmethod/_xMax style ctx, board max, or fallback — never forced-only.
   */
  function resolveJfactorDomain(which, ctx, nodeParams) {
    which = which === 'yMax' ? 'yMax' : 'xMax';
    ctx = ctx || {};
    var p = nodeParams || {};
    if (which === 'xMax' && num(ctx.xMax, 0) > 0) return num(ctx.xMax, 100);
    if (which === 'yMax' && num(ctx.yMax, 0) > 0) return num(ctx.yMax, 1);
    /* jmethod authored caps often mirrored as _xMax/_yMax on method bag */
    if (which === 'xMax' && num(ctx._xMax, 0) > 0) return num(ctx._xMax, 100);
    if (which === 'yMax' && num(ctx._yMax, 0) > 0) return num(ctx._yMax, 1);
    var metric = p.metric || p.dim || (which === 'xMax' ? 'cost' : 'happy');
    var board = resolveBoardMax(metric, ctx);
    if (board > 0) return board;
    var fb = num(p.fallback, NaN);
    if (isFinite(fb) && fb > 0) return fb;
    return which === 'xMax' ? 100 : 1;
  }

  /**
   * Exp6 JGroup / scenario group values when present on ctx (ranking_ui builds these).
   * field: score | size | relative | rank | weight
   */
  function resolveJfactorJgroup(field, ctx, nodeParams) {
    field = String(field || (nodeParams && nodeParams.field) || 'score').toLowerCase();
    ctx = ctx || {};
    var jg = ctx.jgroup;
    if (jg == null && ctx.JGroup) jg = ctx.JGroup;
    if (jg == null && ctx.act && ctx.act.jgroup != null) jg = ctx.act.jgroup;
    if (typeof jg === 'number' && isFinite(jg)) return jg;
    if (jg && typeof jg === 'object') {
      if (field === 'size') {
        if (jg.size != null) return num(jg.size, 0);
        if (Array.isArray(jg.actions)) return jg.actions.length;
        if (Array.isArray(jg.items)) return jg.items.length;
        if (typeof jg.length === 'number') return jg.length;
      }
      if (field === 'relative' || field === 'rank') {
        if (jg.relative != null) return num(jg.relative, 0);
        if (jg.rank != null) return num(jg.rank, 0);
        if (jg.rel != null) return num(jg.rel, 0);
      }
      if (field === 'weight') {
        if (jg.weight != null) return num(jg.weight, 0);
        if (jg.w != null) return num(jg.w, 0);
      }
      /* score default */
      if (jg.score != null) return num(jg.score, 0);
      if (jg.score01 != null) return num(jg.score01, 0);
      if (jg.value != null) return num(jg.value, 0);
      if (typeof jg.getScore === 'function') {
        try { return num(jg.getScore(), 0); } catch (_gs) {}
      }
    }
    if (field === 'score' && ctx.jgroupScore != null) return num(ctx.jgroupScore, 0);
    if (field === 'relative' && ctx.jgroupRelative != null) return num(ctx.jgroupRelative, 0);
    if (field === 'size' && ctx.jgroupSize != null) return num(ctx.jgroupSize, 0);
    return num(nodeParams && nodeParams.fallback, 0);
  }

  function buildJfCtx(ctx, x, y) {
    ctx = ctx || {};
    var out = {
      x: x != null ? x : resolveJfactorX(ctx),
      y: y != null ? y : resolveJfactorY(ctx),
      X: ctx.X != null ? ctx.X : ctx.M,
      Y: ctx.Y != null ? ctx.Y : ctx.H,
      E: ctx.E,
      Emax: ctx.Emax,
      D: ctx.D,
      Dmax: ctx.Dmax,
      name: ctx.name || (ctx.act && (ctx.act.name || ctx.act.id)) || '',
      monthsTotal: ctx.monthsTotal,
      monthsLived: ctx.monthsLived,
      monthIndex: ctx.monthIndex,
      discountRate: ctx.discountRate,
      apr: ctx.apr,
      interest: ctx.interest,
      daysUsed: ctx.daysUsed,
      get: typeof ctx.get === 'function' ? ctx.get : null
    };
    return out;
  }

  function evalJoyFactorCall(fn, ctx, x, y, extra) {
    var JF = jfacApi();
    if (!JF_CALL_ALLOW[fn] && fn !== 'externalFactor') return 0;
    try {
      if (fn === 'daysCapacityWeight') {
        var days = x != null ? x : resolveJfactorX(ctx);
        var D = (extra && extra.D != null) ? extra.D : (ctx && ctx.D != null ? ctx.D : 30);
        var Dmax = ctx && ctx.Dmax != null ? ctx.Dmax : undefined;
        if (JF && typeof JF.daysCapacityWeight === 'function') {
          return num(JF.daysCapacityWeight(days, D, Dmax), 0);
        }
        return 1 / (1 + Math.max(0, Number(days) || 0) / Math.max(Number(D) || 1, 1e-6));
      }
      if (fn === 'externalFactor') {
        var jctxE = buildJfCtx(ctx, x, y);
        if (JF && typeof JF.externalFactor === 'function') {
          var ttE = JF.ageT ? JF.ageT(jctxE) : 0.3;
          return num(JF.externalFactor(jctxE.name || 'ext', ttE, jctxE.E, jctxE.Emax), 1);
        }
        return 1;
      }
      if (!JF || typeof JF[fn] !== 'function') {
        /* METHODS-parity fallbacks when JoyFactors offline */
        if (fn === 'scoreMoneyToHappy') {
          var costF = Math.abs(num(x != null ? x : resolveJfactorX(ctx), 0));
          var gainF = Math.abs(num(y != null ? y : resolveJfactorY(ctx), 0));
          return costF < 1e-9 ? gainF : gainF / Math.sqrt(costF);
        }
        if (fn === 'scoreAgeTick') {
          var axF = Math.max(0.01, Math.abs(num(x != null ? x : resolveJfactorX(ctx), 1)));
          return 0.15 / (1 + axF);
        }
        if (fn === 'scoreDebtPay') {
          var payF = Math.max(1e-3, Math.abs(num(x != null ? x : resolveJfactorX(ctx), 0)));
          var aprF = (ctx && ctx.apr != null) ? num(ctx.apr, 0.18) : 0.18;
          if (aprF > 1) aprF = aprF * 0.01;
          return (1.5 + 8 * aprF) * Math.sqrt(payF * 0.5 + payF * 0.25) / (1 + payF / 2000);
        }
        return 0;
      }
      if (fn === 'ageT') return num(JF.ageT(buildJfCtx(ctx, x, y)), 0);
      if (fn === 'happinessAgeWeight') {
        var t = (JF.ageT ? JF.ageT(buildJfCtx(ctx, x, y)) : 0);
        return num(JF.happinessAgeWeight(t), 0);
      }
      if (fn === 'moneyDisutility') {
        var cost = x != null ? x : resolveJfactorX(ctx);
        var M = ctx && ctx.X != null ? ctx.X : (ctx && ctx.M != null ? ctx.M : 1000);
        var tt = JF.ageT ? JF.ageT(buildJfCtx(ctx, x, y)) : 0;
        return num(JF.moneyDisutility(cost, M, tt, ctx && ctx.discountRate), 0);
      }
      if (fn === 'compositeItemScore') {
        var it = (ctx && ctx.act) || {};
        var world = ctx || {};
        return num(JF.compositeItemScore(it, world, ctx && ctx.weights), 0);
      }
      if (fn === 'hash01') return num(JF.hash01((ctx && ctx.name) || String(x || '')), 0);
      /* scoreMoneyToHappy / scoreAgeTick / scoreDebtPay */
      return num(JF[fn](buildJfCtx(ctx, x, y)), 0);
    } catch (_e) {
      return 0;
    }
  }

  /**
   * Collect lightweight world.components produced by world.add.* / emit.viz nodes.
   */
  function collectWorldComponents(graph) {
    var g = normalizeGraph(graph);
    var comps = [];
    g.nodes.forEach(function (n) {
      if (n.type === 'world.add.point' || n.type === 'world.add.segment' || n.type === 'world.add.field') {
        comps.push({
          id: n.id,
          type: n.params.kind || 'point',
          label: n.params.label || n.type,
          x: num(n.params.x, 0), y: num(n.params.y, 0), z: num(n.params.z, 0),
          x2: num(n.params.x2, 0), y2: num(n.params.y2, 0), z2: num(n.params.z2, 0),
          note: n.params.note || '',
          source: 'blueprint'
        });
      } else if (n.type === 'world.emit.viz') {
        comps.push({
          id: n.id,
          type: 'viz',
          label: (n.params && n.params.label) || 'viz',
          note: (n.params && n.params.note) || '',
          source: 'blueprint'
        });
      }
    });
    return comps;
  }

  /**
   * Compile graph → scoreFn({x,y,xMax,yMax,idealY,idealYAt,act,wb,…}). Raw numeric (score.* may clamp); builtins match METHODS.
   * Domain: wires into view.curve xMax/yMax (or upstream data.* / input.*) at eval; node params = fallback only.
   */
  function compile(graph) {
    var g = normalizeGraph(graph);
    var sink = findSink(g);
    if (!sink) return { ok: false, scoreFn: null, error: 'missing score.out', graph: g };

    var byId = {};
    g.nodes.forEach(function (n) { byId[n.id] = n; });
    var cadNode = findViewCurve(g);
    var worldComps = collectWorldComponents(g);

    function evalNode(nodeId, ctx, stack, outPort) {
      if (stack[nodeId] && outPort == null) {
        var err = new Error('cycle at ' + nodeId);
        err.code = 'cycle';
        throw err;
      }
      var cacheKey = nodeId + (outPort ? '#' + outPort : '');
      if (stack['__done_' + cacheKey] != null) return stack['__done_' + cacheKey];
      if (!(stack[nodeId] && outPort)) stack[nodeId] = true;
      var node = byId[nodeId];
      if (!node) {
        var e2 = new Error('missing node ' + nodeId);
        e2.code = 'missing';
        throw e2;
      }
      var meta = NODE_META[node.type];
      var val = 0;
      var multi = null;

      function inPort(port, required) {
        var ed = edgeInto(g, nodeId, port);
        if (!ed) {
          if (required) {
            var em = new Error(node.type + ' missing input .' + port);
            em.code = 'unlink';
            throw em;
          }
          return 0;
        }
        return evalNode(ed.from, ctx, stack, ed.fromPort === 'out' ? null : ed.fromPort);
      }

      function inPortOpt(port, fallback) {
        var ed = edgeInto(g, nodeId, port);
        if (!ed) return fallback;
        return evalNode(ed.from, ctx, stack, ed.fromPort === 'out' ? null : ed.fromPort);
      }

      if (node.type === 'input.x') {
        if (hasInEdge(g, nodeId, 'in')) val = inPort('in', true);
        else val = num(ctx.x, 0);
      } else if (node.type === 'input.y') {
        if (hasInEdge(g, nodeId, 'in')) val = inPort('in', true);
        else val = num(ctx.y, 0);
      } else if (node.type === 'input.xMax') {
        /* optional .in from jfactor.* / data.* ; else fallback param / ctx — NOT locked to view.curve params */
        if (hasInEdge(g, nodeId, 'in')) {
          val = inPort('in', true);
        } else {
          var fbX = num(node.params && node.params.fallback, NaN);
          if (isFinite(fbX) && fbX > 0) val = fbX;
          else if (num(ctx.xMax, 0) > 0) val = num(ctx.xMax, 100);
          else val = 100;
        }
      } else if (node.type === 'input.yMax') {
        if (hasInEdge(g, nodeId, 'in')) {
          val = inPort('in', true);
        } else {
          var fbY = num(node.params && node.params.fallback, NaN);
          if (isFinite(fbY) && fbY > 0) val = fbY;
          else if (num(ctx.yMax, 0) > 0) val = num(ctx.yMax, 1);
          else val = 1;
        }
      } else if (node.type === 'jfactor.x') {
        val = resolveJfactorX(ctx);
      } else if (node.type === 'jfactor.y') {
        val = resolveJfactorY(ctx);
      } else if (node.type === 'jfactor.xMax') {
        if (hasInEdge(g, nodeId, 'in')) val = inPort('in', true);
        else val = resolveJfactorDomain('xMax', ctx, node.params);
      } else if (node.type === 'jfactor.yMax') {
        if (hasInEdge(g, nodeId, 'in')) val = inPort('in', true);
        else val = resolveJfactorDomain('yMax', ctx, node.params);
      } else if (node.type === 'jfactor.jgroup') {
        val = resolveJfactorJgroup((node.params && node.params.field) || 'score', ctx, node.params);
      } else if (node.type === 'jfactor.call') {
        var fnCall = (node.params && node.params.fn) || 'scoreMoneyToHappy';
        var cx = hasInEdge(g, nodeId, 'x') ? inPort('x', true) : resolveJfactorX(ctx);
        var cy = hasInEdge(g, nodeId, 'y') ? inPort('y', true) : resolveJfactorY(ctx);
        val = evalJoyFactorCall(fnCall, ctx, cx, cy, null);
      } else if (node.type === 'jfactor.browse') {
        var browseKey = (node.params && (node.params.key || node.params.fn)) || 'scoreMoneyToHappy';
        var bx = hasInEdge(g, nodeId, 'x') ? inPort('x', true) : resolveJfactorX(ctx);
        var by = hasInEdge(g, nodeId, 'y') ? inPort('y', true) : resolveJfactorY(ctx);
        val = evalJoyFactorCall(browseKey, ctx, bx, by, null);
      } else if (node.type === 'jfactor.moneyToHappy') {
        var mx = hasInEdge(g, nodeId, 'x') ? inPort('x', true) : resolveJfactorX(ctx);
        var my = hasInEdge(g, nodeId, 'y') ? inPort('y', true) : resolveJfactorY(ctx);
        val = evalJoyFactorCall('scoreMoneyToHappy', ctx, mx, my, null);
      } else if (node.type === 'jfactor.daysCapacity') {
        var dDays = hasInEdge(g, nodeId, 'days') ? inPort('days', true) : resolveJfactorX(ctx);
        var dD = hasInEdge(g, nodeId, 'D') ? inPort('D', true) : (ctx.D != null ? num(ctx.D, 30) : 30);
        val = evalJoyFactorCall('daysCapacityWeight', ctx, dDays, null, { D: dD });
      } else if (node.type === 'jfactor.ageTick') {
        var ax = hasInEdge(g, nodeId, 'x') ? inPort('x', true) : resolveJfactorX(ctx);
        val = evalJoyFactorCall('scoreAgeTick', ctx, ax, -0.01, null);
      } else if (node.type === 'jfactor.debtPay') {
        var dx = hasInEdge(g, nodeId, 'x') ? inPort('x', true) : resolveJfactorX(ctx);
        var dy = hasInEdge(g, nodeId, 'y') ? inPort('y', true) : (resolveJfactorY(ctx) || dx * 0.5);
        val = evalJoyFactorCall('scoreDebtPay', ctx, dx, dy, null);
      } else if (node.type === 'jfactor.external') {
        val = evalJoyFactorCall('externalFactor', ctx, null, null, null);
      } else if (node.type === 'input.act') {
        var actIn = (ctx.act && typeof ctx.act === 'object') ? ctx.act : {};
        multi = {
          amount: actAmount(actIn, ctx) || num(node.params && node.params.amount, 0),
          days: actDays(actIn, ctx) || num(node.params && node.params.days, 0),
          hours: actEffortHours(actIn, ctx) || num(node.params && node.params.hours, 0)
        };
      } else if (node.type === 'place.fromAct') {
        var pKind = (node.params && node.params.kind) || 'generic';
        var placed = resolvePlaceFromAct(pKind, ctx.act, ctx);
        multi = { x: num(placed.x, 0), y: num(placed.y, 0) };
        /* stash extras for compilePlace */
        stack['__place_extra_' + nodeId] = placed;
      } else if (node.type === 'place.out') {
        inPortOpt('x', 0);
        inPortOpt('y', 0);
        val = 1;
      } else if (node.type === 'data.boardMax' || node.type === 'data.domain') {
        var met = (node.params && (node.params.metric || node.params.dim)) || 'T';
        val = resolveBoardMax(met, ctx);
        if (!(val > 0)) {
          var fbB = num(node.params && node.params.fallback, 0);
          if (fbB > 0) val = fbB;
        }
      } else if (node.type === 'data.actField') {
        val = resolveActField((node.params && node.params.field) || 'amount', ctx, node.params);
      } else if (node.type === 'data.horizon') {
        val = resolveHorizon((node.params && node.params.unit) || 'months', ctx);
      } else if (node.type === 'data.ctxField') {
        val = resolveCtxField((node.params && node.params.field) || 'E', ctx, node.params);
      } else if (node.type === 'board.emit') {
        var be = defaultBoardEmitParams(node.params || {});
        val = (be.items && be.items.length) ? be.items.length : 0;
      } else if (node.type.indexOf('mech.') === 0) {
        var minputs = {};
        var mmeta = NODE_META[node.type];
        if (mmeta && mmeta.ins) {
          for (var mi = 0; mi < mmeta.ins.length; mi++) {
            var mp = mmeta.ins[mi];
            if (hasInEdge(g, nodeId, mp)) minputs[mp] = inPort(mp, true);
          }
        }
        val = evalMechNode(node.type, node.params, minputs, ctx);
      } else if (isConstType(node.type)) {
        if (node.params && node.params.ref) {
          val = num(ctx[node.params.ref], 0);
        } else {
          val = num(node.params && node.params.value, 0);
        }
      } else if (node.type === 'op.add') val = inPort('a', true) + inPort('b', true);
      else if (node.type === 'op.sub') val = inPort('a', true) - inPort('b', true);
      else if (node.type === 'op.mul') val = inPort('a', true) * inPort('b', true);
      else if (node.type === 'op.div') val = safeDiv(inPort('a', true), inPort('b', true));
      else if (node.type === 'op.min') val = Math.min(inPort('a', true), inPort('b', true));
      else if (node.type === 'op.max') val = Math.max(inPort('a', true), inPort('b', true));
      else if (node.type === 'op.sqrt') val = Math.sqrt(Math.max(0, inPort('a', true)));
      else if (node.type === 'op.log1p') val = Math.log1p(Math.max(0, inPort('a', true)));
      else if (node.type === 'op.pow') {
        var base = inPort('a', true);
        var exp = inPort('b', true);
        val = Math.pow(Math.max(0, base), exp);
        if (!isFinite(val)) val = 0;
      } else if (node.type === 'op.clamp01') val = clamp01(inPort('a', true));
      else if (node.type === 'op.clamp') {
        var clA = inPort('a', true);
        var clLo = hasInEdge(g, nodeId, 'lo') ? inPort('lo', true) : num(node.params && node.params.lo, 0);
        var clHi = hasInEdge(g, nodeId, 'hi') ? inPort('hi', true) : num(node.params && node.params.hi, 1);
        val = mechClamp(clA, clLo, clHi);
      } else if (node.type === 'op.hash01') {
        var hName = (node.params && node.params.name != null && String(node.params.name) !== '')
          ? String(node.params.name)
          : ((node.params && node.params.seed != null) ? String(node.params.seed)
            : ((ctx && ctx.name) ? String(ctx.name) : ''));
        var hSeed = hName;
        if (hasInEdge(g, nodeId, 't')) {
          var ht = inPort('t', true);
          hSeed = hName + '|' + Math.floor(mechClamp(ht, 0, 1) * 100);
        } else if (hasInEdge(g, nodeId, 'a')) {
          hSeed = String(inPort('a', true));
        }
        val = mechHash01(hSeed);
      } else if (node.type === 'op.firstPos') {
        var fpA = hasInEdge(g, nodeId, 'a') ? inPort('a', true) : NaN;
        var fpB = hasInEdge(g, nodeId, 'b') ? inPort('b', true) : NaN;
        var fpC = hasInEdge(g, nodeId, 'c') ? inPort('c', true) : NaN;
        if (isFinite(fpA) && fpA > 0) val = fpA;
        else if (isFinite(fpB) && fpB > 0) val = fpB;
        else if (isFinite(fpC) && fpC > 0) val = fpC;
        else val = Math.max(0, isFinite(fpC) ? fpC : (isFinite(fpB) ? fpB : (isFinite(fpA) ? fpA : 0)));
      } else if (node.type === 'op.abs') val = Math.abs(inPort('a', true));
      else if (node.type === 'op.neg') val = -inPort('a', true);
      else if (node.type === 'view.curve') {
        var cp = defaultCadCurveParams(node.params);
        var ix = num(ctx.x, 0);
        var iy = idealYFromCadMath(cp.math, ix);
        /* in.xMax / in.yMax when wired win; params are fallback only (not forced lock) */
        var xmFb = cp.xMax > 0 ? cp.xMax : 100;
        var ymFb = cp.yMax > 0 ? cp.yMax : 1;
        var xm = hasInEdge(g, nodeId, 'xMax') ? num(inPort('xMax', true), xmFb) : xmFb;
        var ym = hasInEdge(g, nodeId, 'yMax') ? num(inPort('yMax', true), ymFb) : ymFb;
        if (!(xm > 0)) xm = xmFb;
        if (!(ym > 0)) ym = ymFb;
        multi = {
          idealY: iy,
          xMax: xm,
          yMax: ym,
          scoreFromCurve: clamp01(safeDiv(iy, ym))
        };
      } else if (node.type === 'view.3d') {
        multi = { bounds: num(node.params && node.params.bounds, 0), ok: 1 };
      } else if (node.type === 'view.sample') {
        var sy = inPort('y', true);
        var sxFb = num(node.params && node.params.xMax, 0);
        if (!(sxFb > 0)) sxFb = num(ctx.xMax, 100) > 0 ? num(ctx.xMax, 100) : 100;
        var sxm = inPortOpt('xMax', sxFb);
        if (!(sxm > 0)) sxm = sxFb;
        multi = { curve: sy, idealY: sy, xMax: sxm };
        val = sy;
      } else if (node.type === 'math.idealY') {
        var edX = edgeInto(g, nodeId, 'a');
        if (edX) {
          var xx = evalNode(edX.from, ctx, stack, edX.fromPort === 'out' ? null : edX.fromPort);
          if (cadNode) val = idealYFromCadMath(cadNode.params.math, xx);
          else if (typeof ctx.idealYAt === 'function') val = num(ctx.idealYAt(xx), 0);
          else val = num(ctx.idealY, 0);
        } else if (cadNode) {
          val = idealYFromCadMath(cadNode.params.math, ctx.x);
        } else {
          val = num(ctx.idealY, 0);
        }
      } else if (node.type === 'score.ideal_over_ymax') {
        var iy2 = inPort('idealY', true);
        var ym2 = inPort('yMax', true);
        val = clamp01(safeDiv(iy2, ym2 > 0 ? ym2 : 1));
      } else if (node.type === 'score.y_over_ideal') {
        val = clamp01(safeDiv(inPort('y', true), Math.max(1e-12, inPort('idealY', true))));
      } else if (node.type === 'score.y_over_ymax') {
        val = clamp01(safeDiv(inPort('y', true), Math.max(1e-12, inPort('yMax', true))));
      } else if (node.type === 'score.gap_to_ideal') {
        var yy = inPort('y', true);
        var ii = inPort('idealY', true);
        var ym3 = Math.max(1e-12, inPort('yMax', true));
        val = clamp01(1 - Math.abs(yy - ii) / ym3);
      } else if (node.type === 'score.min_xy_norm') {
        var xn = clamp01(safeDiv(inPort('x', true), Math.max(1e-12, inPort('xMax', true))));
        var yn = clamp01(safeDiv(inPort('y', true), Math.max(1e-12, inPort('yMax', true))));
        val = Math.min(xn, yn);
      } else if (node.type === 'score.passthroughY') {
        /* earn-style: score ≈ |y| (no clamp) — matches METHODS.earn */
        var py = hasInEdge(g, nodeId, 'y') ? inPort('y', true) : resolveJfactorY(ctx);
        val = Math.abs(num(py, 0)) || 0.01;
      } else if (node.type === 'measure.distance') {
        /* easy171: Prefer wired ax..bz; else resolve params.a / params.b against world.add.* components */
        function worldPtByRef(ref) {
          ref = String(ref || '').trim();
          if (!ref) return null;
          for (var wi = 0; wi < worldComps.length; wi++) {
            var wc = worldComps[wi];
            if (!wc) continue;
            if (wc.id === ref || String(wc.label || '') === ref) {
              return { x: num(wc.x, 0), y: num(wc.y, 0), z: num(wc.z, 0) };
            }
          }
          return null;
        }
        var ax = hasInEdge(g, nodeId, 'ax') ? inPortOpt('ax', 0) : null;
        var ay = hasInEdge(g, nodeId, 'ay') ? inPortOpt('ay', 0) : null;
        var az = hasInEdge(g, nodeId, 'az') ? inPortOpt('az', 0) : null;
        var bx = hasInEdge(g, nodeId, 'bx') ? inPortOpt('bx', 0) : null;
        var by = hasInEdge(g, nodeId, 'by') ? inPortOpt('by', 0) : null;
        var bz = hasInEdge(g, nodeId, 'bz') ? inPortOpt('bz', 0) : null;
        if (ax == null || ay == null || az == null) {
          var pa = worldPtByRef(node.params && (node.params.a || node.params.pointA));
          if (pa) { if (ax == null) ax = pa.x; if (ay == null) ay = pa.y; if (az == null) az = pa.z; }
        }
        if (bx == null || by == null || bz == null) {
          var pb = worldPtByRef(node.params && (node.params.b || node.params.pointB));
          if (pb) { if (bx == null) bx = pb.x; if (by == null) by = pb.y; if (bz == null) bz = pb.z; }
        }
        ax = num(ax, 0); ay = num(ay, 0); az = num(az, 0);
        bx = num(bx, 0); by = num(by, 0); bz = num(bz, 0);
        var dx = ax - bx, dy = ay - by, dz = az - bz;
        val = Math.sqrt(dx * dx + dy * dy + dz * dz);
      } else if (node.type === 'world.add.point') {
        multi = {
          ok: 1,
          x: num(node.params && node.params.x, 0),
          y: num(node.params && node.params.y, 0),
          z: num(node.params && node.params.z, 0)
        };
      } else if (node.type === 'world.add.segment') {
        multi = {
          ok: 1,
          x: num(node.params && node.params.x, 0),
          y: num(node.params && node.params.y, 0),
          z: num(node.params && node.params.z, 0),
          x2: num(node.params && node.params.x2, 0),
          y2: num(node.params && node.params.y2, 0),
          z2: num(node.params && node.params.z2, 0)
        };
      } else if (node.type === 'world.add.field' || node.type === 'world.emit.viz') {
        multi = { ok: 1 };
      } else if (node.type === 'world.measure') {
        val = num(node.params && node.params.value, 0);
      } else if (node.type.indexOf('econ.') === 0) {
        var eins = {};
        var emeta = NODE_META[node.type];
        if (emeta && emeta.ins) {
          for (var ei = 0; ei < emeta.ins.length; ei++) {
            var ep = emeta.ins[ei];
            if (hasInEdge(g, nodeId, ep)) eins[ep] = inPort(ep, true);
          }
        }
        var eres = evalEconNode(node.type, node.params, eins, ctx);
        if (eres && typeof eres === 'object') multi = eres;
        else val = num(eres, 0);
      } else if (node.type === 'sim.step') {
        /* easy172: document run()→world→score; optional world/view ins; outs score, ok */
        inPortOpt('world', 0);
        inPortOpt('view', 0);
        var simScore = 0;
        if (ctx && ctx._simScore != null && isFinite(Number(ctx._simScore))) {
          simScore = Number(ctx._simScore);
        } else if (ctx && ctx._lastSim && ctx._lastSim.score != null && isFinite(Number(ctx._lastSim.score))) {
          simScore = Number(ctx._lastSim.score);
        } else {
          /* thin fallback: prefer |y|, else idealY/yMax-ish */
          simScore = Math.abs(num(ctx.y, 0));
          if (!(simScore > 0) && ctx.idealY != null) simScore = Math.abs(num(ctx.idealY, 0));
        }
        multi = { score: simScore, ok: 1 };
      } else if (node.type === 'score.out') {
        val = inPort('in', true);
      } else if (node.type === 'view.out') {
        /* PREVIEW sink — inputs optional; does not drive score */
        inPortOpt('curve', 0);
        inPortOpt('space3d', 0);
        inPortOpt('view', 0);
        val = 1;
      } else if (node.type === 'viz.out') {
        val = inPortOpt('in', 0);
      } else {
        var eu = new Error('unknown type ' + node.type);
        eu.code = 'type';
        throw eu;
      }

      delete stack[nodeId];
      if (multi) {
        Object.keys(multi).forEach(function (k) {
          if (!isFinite(multi[k])) multi[k] = 0;
          stack['__done_' + nodeId + '#' + k] = multi[k];
        });
        var want = outPort || meta.outs[0];
        val = multi[want] != null ? multi[want] : 0;
        stack['__done_' + nodeId] = val;
        return val;
      }
      if (!isFinite(val)) val = 0;
      stack['__done_' + cacheKey] = val;
      return val;
    }

    try {
      evalNode(sink.id, {
        x: 1, y: 1, xMax: 1, yMax: 1, idealY: 1,
        idealYAt: function () { return 1; },
        act: { amount: 1, days: 1, hours: 1 }
      }, {});
    } catch (err) {
      return { ok: false, scoreFn: null, placeFn: null, error: String(err && err.message || err), graph: g, worldComponents: worldComps, view: compileView(g), cadCurve: cadNode ? defaultCadCurveParams(cadNode.params) : null, viewCurve: cadNode ? defaultCadCurveParams(cadNode.params) : null };
    }

    function scoreFn(ctx) {
      ctx = ctx || {};
      var c = {
        x: Math.max(0, num(ctx.x, 0)),
        y: Math.max(0, num(ctx.y, 0)),
        /* ctx domain if caller supplied; else leave unset so graph wires / fallbacks resolve */
        xMax: num(ctx.xMax, 0) > 0 ? num(ctx.xMax, 100) : 0,
        yMax: num(ctx.yMax, 0) > 0 ? num(ctx.yMax, 1) : 0,
        idealY: Math.max(0, num(ctx.idealY, 0)),
        idealYAt: typeof ctx.idealYAt === 'function' ? ctx.idealYAt : null,
        act: (ctx.act && typeof ctx.act === 'object') ? ctx.act : {},
        wb: ctx.wb || null,
        boardItems: ctx.boardItems || null,
        horizonYears: ctx.horizonYears,
        horizonMonths: ctx.horizonMonths,
        D: ctx.D,
        Dmax: ctx.Dmax,
        H: ctx.H,
        E: ctx.E,
        Emax: ctx.Emax,
        M: ctx.M,
        X: ctx.X,
        Y: ctx.Y,
        _xMax: ctx._xMax,
        _yMax: ctx._yMax,
        name: ctx.name,
        monthsTotal: ctx.monthsTotal,
        monthsLived: ctx.monthsLived,
        monthIndex: ctx.monthIndex,
        discountRate: ctx.discountRate,
        apr: ctx.apr,
        interest: ctx.interest,
        jgroup: ctx.jgroup,
        JGroup: ctx.JGroup,
        jgroupScore: ctx.jgroupScore,
        jgroupRelative: ctx.jgroupRelative,
        jgroupSize: ctx.jgroupSize,
        get: typeof ctx.get === 'function' ? ctx.get : null,
        weights: ctx.weights,
        /* easy172: sim.step feeds */
        _simScore: ctx._simScore,
        _lastSim: ctx._lastSim
      };
      if (cadNode) {
        var cp2 = defaultCadCurveParams(cadNode.params);
        /* seed fallbacks only — do NOT forcibly lock domain to drafted params */
        if (!(c.xMax > 0)) c.xMax = cp2.xMax > 0 ? cp2.xMax : 100;
        if (!(c.yMax > 0)) c.yMax = cp2.yMax > 0 ? cp2.yMax : 1;
        try {
          var rx = num(evalNode(cadNode.id, c, {}, 'xMax'), 0);
          var ry = num(evalNode(cadNode.id, c, {}, 'yMax'), 0);
          if (rx > 0) c.xMax = rx;
          if (ry > 0) c.yMax = ry;
        } catch (_rd) { /* keep fallbacks */ }
        c.idealY = idealYFromCadMath(cp2.math, c.x);
        c.idealYAt = function (xx) { return idealYFromCadMath(cp2.math, xx); };
      } else {
        if (!(c.xMax > 0)) c.xMax = 100;
        if (!(c.yMax > 0)) c.yMax = 1;
      }
      try {
        /* easy169: do NOT force clamp01 — score.* nodes clamp when intended;
           builtin JF / passthroughY scores must match METHODS raw numerics. */
        var raw = evalNode(sink.id, c, {});
        return isFinite(raw) ? Number(raw) : 0;
      } catch (_e) {
        return 0;
      }
    }

    var placeOutNode = findPlaceOut(g);
    var placeFn = null;
    if (placeOutNode) {
      placeFn = function (act, ctx) {
        ctx = ctx || {};
        act = act || (ctx.act && typeof ctx.act === 'object' ? ctx.act : {}) || {};
        var c = {
          /* leave x/y unset when absent — place.fromAct defaults match METHODS.place */
          xMax: num(ctx.xMax, 0) > 0 ? num(ctx.xMax, 100) : 0,
          yMax: num(ctx.yMax, 0) > 0 ? num(ctx.yMax, 1) : 0,
          idealY: Math.max(0, num(ctx.idealY, 0)),
          idealYAt: typeof ctx.idealYAt === 'function' ? ctx.idealYAt : null,
          act: act,
          wb: ctx.wb || null,
          boardItems: ctx.boardItems || null,
          horizonYears: ctx.horizonYears,
          horizonMonths: ctx.horizonMonths,
          D: ctx.D, Dmax: ctx.Dmax, H: ctx.H, E: ctx.E, Emax: ctx.Emax,
          M: ctx.M, X: ctx.X, Y: ctx.Y,
          _xMax: ctx._xMax, _yMax: ctx._yMax,
          name: ctx.name || (act && (act.name || act.id)) || '',
          monthsTotal: ctx.monthsTotal, monthsLived: ctx.monthsLived,
          monthIndex: ctx.monthIndex, discountRate: ctx.discountRate,
          apr: ctx.apr, interest: ctx.interest, daysUsed: ctx.daysUsed,
          workdaysPerMonth: ctx.workdaysPerMonth,
          jgroup: ctx.jgroup, JGroup: ctx.JGroup,
          jgroupScore: ctx.jgroupScore, jgroupRelative: ctx.jgroupRelative, jgroupSize: ctx.jgroupSize,
          get: typeof ctx.get === 'function' ? ctx.get : null
        };
        if (ctx.x != null && isFinite(Number(ctx.x))) c.x = Math.max(0, Number(ctx.x));
        if (ctx.y != null && isFinite(Number(ctx.y))) c.y = Math.max(0, Number(ctx.y));
        if (ctx._xMax != null && num(ctx._xMax, 0) > 0) c._xMax = num(ctx._xMax, 0);
        if (ctx._yMax != null && num(ctx._yMax, 0) > 0) c._yMax = num(ctx._yMax, 0);
        var stack = {};
        var px = 0, py = 0;
        var extra = null;
        try {
          var edx = edgeInto(g, placeOutNode.id, 'x');
          var edy = edgeInto(g, placeOutNode.id, 'y');
          if (edx) px = num(evalNode(edx.from, c, stack, edx.fromPort === 'out' ? null : edx.fromPort), 0);
          if (edy) py = num(evalNode(edy.from, c, stack, edy.fromPort === 'out' ? null : edy.fromPort), 0);
          /* pull extras from place.fromAct if present */
          Object.keys(stack).forEach(function (k) {
            if (k.indexOf('__place_extra_') === 0 && stack[k]) extra = stack[k];
          });
        } catch (_pe) {
          return null;
        }
        var lab = (placeOutNode.params && placeOutNode.params.label) ? String(placeOutNode.params.label) : '';
        if (!lab && extra && extra.label) lab = String(extra.label);
        if (!lab) lab = (act && (act.name || act.id)) || 'place';
        var out = { x: Math.max(0, px), y: Math.max(0, py), label: lab };
        if (extra) {
          if (extra.hoursDay != null) out.hoursDay = extra.hoursDay;
          if (extra.apr != null) out.apr = extra.apr;
        }
        return out;
      };
    }

    var viewDesc = describeView(g);
    try { attachWiredIdealY(viewDesc, g, evalNode); } catch (_vw) {}
    var viewCurveOut = null;
    if (viewDesc && viewDesc.curve) viewCurveOut = defaultCadCurveParams(viewDesc.curve);
    else if (cadNode) viewCurveOut = defaultCadCurveParams(cadNode.params);
    return {
      ok: true,
      scoreFn: scoreFn,
      placeFn: placeFn,
      error: null,
      graph: g,
      worldComponents: worldComps,
      viewCurve: viewCurveOut,
      cadCurve: viewCurveOut,
      view: viewDesc
    };
  }

  /** Compile placeFn(act,ctx) from place.out when present. */
  function compilePlace(graph) {
    var compiled = compile(graph);
    if (!compiled) return { ok: false, placeFn: null, error: 'compile failed', graph: null };
    if (typeof compiled.placeFn === 'function') {
      return { ok: true, placeFn: compiled.placeFn, error: null, graph: compiled.graph };
    }
    return { ok: false, placeFn: null, error: 'no place.out', graph: compiled.graph };
  }

  function addNode(graph, type, x, y, params) {
    var g = normalizeGraph(graph);
    if (type === 'cad.curve') type = 'view.curve';
    if (type === 'cad.3d') type = 'view.3d';
    if (!NODE_META[type]) return g;
    if (type === 'score.out' && g.nodes.some(function (n) { return n.type === 'score.out'; })) {
      return g;
    }
    if (type === 'view.out' && g.nodes.some(function (n) { return n.type === 'view.out'; })) {
      return g;
    }
    if (type === 'place.out' && g.nodes.some(function (n) { return n.type === 'place.out'; })) {
      return g;
    }
    var p = {};
    if (isConstType(type)) p = { value: 1, ref: '' };
    if (type === 'input.act') p = { amount: 0, days: 0, hours: 0 };
    if (type === 'input.xMax' || type === 'input.yMax') p = defaultInputDomainParams(params || {});
    if (type === 'jfactor.xMax') p = defaultJfactorDomainParams(params || {}, 'xMax');
    if (type === 'jfactor.yMax') p = defaultJfactorDomainParams(params || {}, 'yMax');
    if (type === 'jfactor.jgroup') p = defaultJfactorJgroupParams(params || {});
    if (type === 'jfactor.call') p = defaultJfactorCallParams(params || {});
    if (type === 'jfactor.browse') p = defaultJfactorBrowseParams(params || {});
    if (type === 'data.ctxField') p = defaultDataCtxFieldParams(params || {});
    if (String(type).indexOf('mech.') === 0) p = defaultMechParams(type, params || {});
    if (String(type).indexOf('econ.') === 0) p = defaultEconParams(type, params || {});
    if (type === 'op.hash01') {
      p = { name: String((params && params.name) != null ? params.name : ((params && params.seed) || '')), hint: 'hash01(name|floor(t*100)) noise seed' };
      if (params && params.hint) p.hint = String(params.hint);
    }
    if (type === 'op.clamp') {
      p = { lo: num(params && params.lo, 0), hi: num(params && params.hi, 1) };
      if (params && params.hint) p.hint = String(params.hint);
    }
    if (type === 'op.firstPos') {
      p = {};
      if (params && params.hint) p.hint = String(params.hint);
    }
    if (type === 'sim.step') p = defaultSimStepParams(params || {});
    if (type === 'data.boardMax' || type === 'data.domain') p = defaultDataBoardParams(params || {});
    if (type === 'data.actField') p = defaultDataActFieldParams(params || {});
    if (type === 'data.horizon') p = defaultDataHorizonParams(params || {});
    if (type === 'data.const') p = { value: 1, ref: '' };
    if (type === 'board.emit') p = defaultBoardEmitParams(params || {});
    if (type === 'view.curve') p = defaultCadCurveParams(params || {});
    if (type === 'view.sample') p = { xMax: num(params && params.xMax, 100), note: (params && params.note) || 'wired idealY' };
    if (type === 'view.3d') p = { open: false, note: '' };
    if (type === 'view.out') p = {};
    if (type === 'place.fromAct') p = defaultPlaceFromActParams(params || {});
    if (type === 'place.out') p = { label: String((params && params.label) || '') };
    if (type === 'world.add.point') p = defaultWorldAddParams('point');
    if (type === 'world.add.segment') p = defaultWorldAddParams('segment');
    if (type === 'world.add.field') p = defaultWorldAddParams('field');
    if (type === 'world.emit.viz') p = { label: 'viz', note: '' };
    if (type === 'measure.distance') p = { a: '', b: '', pointA: '', pointB: '' };
    if (type === 'world.measure') p = { a: '', b: '', value: 0 };
    if (params && typeof params === 'object' && type !== 'view.curve') {
      Object.keys(params).forEach(function (k) { p[k] = params[k]; });
    }
    g.nodes.push({
      id: newId('n'),
      type: type,
      x: x != null ? num(x, 60) : 60 + (g.nodes.length % 5) * 110,
      y: y != null ? num(y, 40) : 40 + Math.floor(g.nodes.length / 5) * 72,
      params: p
    });
    return g;
  }

  function deleteNode(graph, nodeId) {
    var g = normalizeGraph(graph);
    var n = nodeById(g, nodeId);
    if (!n) return g;
    if (n.type === 'score.out') return g;
    g.nodes = g.nodes.filter(function (nn) { return nn.id !== nodeId; });
    g.edges = g.edges.filter(function (e) { return e.from !== nodeId && e.to !== nodeId; });
    return g;
  }

  function connect(graph, from, fromPort, to, toPort, opts) {
    var g = normalizeGraph(graph);
    opts = opts || {};
    var check = canConnect(g, from, fromPort, to, toPort);
    if (!check.ok && !opts.force) {
      g._lastConnectError = check.reason || 'incompatible';
      g._lastConnectInfo = check;
      return g;
    }
    var a = nodeById(g, from);
    var b = nodeById(g, to);
    if (!a || !b) return g;
    var fm = NODE_META[a.type];
    var tm = NODE_META[b.type];
    if (!fm || !tm) return g;
    if (fm.outs.indexOf(fromPort) < 0 || tm.ins.indexOf(toPort) < 0) return g;
    g.edges = g.edges.filter(function (e) { return !(e.to === to && e.toPort === toPort); });
    var edge = { from: from, fromPort: fromPort, to: to, toPort: toPort };
    if (check.soft) edge.warn = check.reason || 'coerce';
    g.edges.push(edge);
    g._lastConnectError = null;
    g._lastConnectInfo = check;
    return g;
  }

  function disconnectInto(graph, to, toPort) {
    var g = normalizeGraph(graph);
    g.edges = g.edges.filter(function (e) { return !(e.to === to && e.toPort === toPort); });
    return g;
  }

  function setNodeParam(graph, nodeId, key, value) {
    var g = normalizeGraph(graph);
    var n = nodeById(g, nodeId);
    if (!n) return g;
    if (!n.params) n.params = {};
    if (n.type === 'view.curve' && key === 'math') {
      n.params.math = normalizeCadMath(value);
      return g;
    }
    n.params[key] = value;
    return g;
  }

  function nodeHeight(type) {
    var m = NODE_META[type] || { ins: [], outs: [] };
    var ports = Math.max(m.ins.length, m.outs.length, 1);
    return Math.max(52, 22 + ports * 16);
  }

  function nodeWidth(type) {
    var m = NODE_META[type];
    if (!m) return 120;
    if (m.kind === 'view' || m.kind === 'view3d' || m.kind === 'cad' || m.kind === 'cad3d') return 140;
    if (m.kind === 'measure' || m.kind === 'score' || m.kind === 'world' || m.kind === 'jfactor' || m.kind === 'data' || m.kind === 'place' || m.kind === 'placesink' || m.kind === 'sim' || m.kind === 'econ' || m.kind === 'board') return 132;
    if (m.outs && m.outs.length > 1) return 128;
    return 118;
  }

  function meta(type) { return NODE_META[type] || null; }

  /**
   * Builtin seed graphs (earn, moneyToHappy, …) — content of optional pack `builtins`.
   * Packs are optional libraries; saved WB.modelTools.jmethods[id] are SoT.
   * Editor New opens emptyGraph; Edit loads saved or offers Load from pack (not silent inject).
   * @returns {Object.<string,{label:string,script:object,math:object,xMax:number,yMax:number,xLabel:string,yLabel:string,scoreMode:string,note?:string}>}
   */
  function exampleBlueprints() {
    /**
     * easy175: pack library graphs (raw math/noise; pure place; no mech.* on score path).
     * Domain: jfactor.xMax/yMax → view.curve; place.out without place.fromAct.
     */

    function N(id, type, x, y, params) {
      return { id: id, type: type, x: x, y: y, params: params || {} };
    }
    function E(fr, fp, to, tp) {
      return { from: fr, fromPort: fp, to: to, toPort: tp };
    }

    /** Expanded ageT: clamp(monthsLived / max(monthsTotal,1), 0, 1). Returns outId. */
    function expandAgeT(nodes, edges, prefix, x0, y0) {
      var lived = prefix + '_lived', tot = prefix + '_tot', c1 = prefix + '_c1';
      var totS = prefix + '_totS', ratio = prefix + '_ratio', c0 = prefix + '_c0', out = prefix + '_t';
      nodes.push(
        N(lived, 'data.ctxField', x0, y0, { field: 'monthsLived', fallback: 0 }),
        N(tot, 'data.ctxField', x0, y0 + 50, { field: 'monthsTotal', fallback: 156 }),
        N(c1, 'data.const', x0 + 140, y0 + 50, { value: 1, ref: '' }),
        N(totS, 'op.max', x0 + 280, y0 + 40, {}),
        N(ratio, 'op.div', x0 + 420, y0 + 20, {}),
        N(c0, 'data.const', x0 + 280, y0 + 100, { value: 0, ref: '' }),
        N(out, 'op.clamp', x0 + 560, y0 + 40, { hint: 't=clamp(lived/total,0,1)' })
      );
      edges.push(
        E(tot, 'out', totS, 'a'), E(c1, 'out', totS, 'b'),
        E(lived, 'out', ratio, 'a'), E(totS, 'out', ratio, 'b'),
        E(ratio, 'out', out, 'a'), E(c0, 'out', out, 'lo'), E(c1, 'out', out, 'hi')
      );
      return out;
    }

    /** Expanded externalFactor → outId. nameStr baked into op.hash01 params.
     * ePress = 1 + gate(Emax>0)*0.15*clamp(1-E/Emax,0,1) — matches JF when Emax unset/0.
     */
    function expandExternal(nodes, edges, prefix, nameStr, tId, eId, emaxId, x0, y0) {
      var hash = prefix + '_hash', c05 = prefix + '_c05', u05 = prefix + '_u05';
      var c024 = prefix + '_c024', noise = prefix + '_noise';
      var cEps = prefix + '_eps', emaxS = prefix + '_emS', ratio = prefix + '_er';
      var c1 = prefix + '_c1', oneM = prefix + '_oneM';
      var c0 = prefix + '_c0', cl = prefix + '_cl', c015 = prefix + '_c015';
      var cBig = prefix + '_cBig', gate = prefix + '_gate';
      var term0 = prefix + '_t0', term = prefix + '_term', ePress = prefix + '_ep';
      var nP = prefix + '_np', out = prefix + '_ext';
      nodes.push(
        N(hash, 'op.hash01', x0, y0, { name: String(nameStr || ''), hint: 'hash01(name|floor(t*100)) noise seed' }),
        N(c05, 'data.const', x0, y0 + 60, { value: 0.5, ref: '' }),
        N(u05, 'op.sub', x0 + 160, y0 + 20, {}),
        N(c024, 'data.const', x0, y0 + 110, { value: 0.24, ref: '' }),
        N(noise, 'op.mul', x0 + 300, y0 + 40, {}),
        N(cEps, 'data.const', x0, y0 + 160, { value: 1e-9, ref: '' }),
        N(emaxS, 'op.max', x0 + 160, y0 + 150, {}),
        N(ratio, 'op.div', x0 + 300, y0 + 140, {}),
        N(c1, 'data.const', x0, y0 + 210, { value: 1, ref: '' }),
        N(oneM, 'op.sub', x0 + 440, y0 + 140, {}),
        N(c0, 'data.const', x0 + 160, y0 + 210, { value: 0, ref: '' }),
        N(cl, 'op.clamp', x0 + 580, y0 + 160, {}),
        N(c015, 'data.const', x0 + 440, y0 + 220, { value: 0.15, ref: '' }),
        N(cBig, 'data.const', x0 + 160, y0 + 260, { value: 1e9, ref: '' }),
        N(gate, 'op.clamp', x0 + 300, y0 + 250, {}),
        N(term0, 'op.mul', x0 + 720, y0 + 180, {}),
        N(term, 'op.mul', x0 + 860, y0 + 200, {}),
        N(ePress, 'op.add', x0 + 1000, y0 + 180, {}),
        N(nP, 'op.mul', x0 + 1000, y0 + 60, {}),
        N(out, 'op.add', x0 + 1140, y0 + 80, {})
      );
      /* gate = clamp(Emax*1e9, 0, 1) ≈ 1 iff Emax>0 */
      var emul = prefix + '_emul';
      nodes.push(N(emul, 'op.mul', x0 + 160, y0 + 300, {}));
      edges.push(
        E(tId, 'out', hash, 't'),
        E(hash, 'out', u05, 'a'), E(c05, 'out', u05, 'b'),
        E(u05, 'out', noise, 'a'), E(c024, 'out', noise, 'b'),
        E(emaxId, 'out', emaxS, 'a'), E(cEps, 'out', emaxS, 'b'),
        E(eId, 'out', ratio, 'a'), E(emaxS, 'out', ratio, 'b'),
        E(c1, 'out', oneM, 'a'), E(ratio, 'out', oneM, 'b'),
        E(oneM, 'out', cl, 'a'), E(c0, 'out', cl, 'lo'), E(c1, 'out', cl, 'hi'),
        E(emaxId, 'out', emul, 'a'), E(cBig, 'out', emul, 'b'),
        E(emul, 'out', gate, 'a'), E(c0, 'out', gate, 'lo'), E(c1, 'out', gate, 'hi'),
        E(c015, 'out', term0, 'a'), E(cl, 'out', term0, 'b'),
        E(term0, 'out', term, 'a'), E(gate, 'out', term, 'b'),
        E(c1, 'out', ePress, 'a'), E(term, 'out', ePress, 'b'),
        E(noise, 'out', nP, 'a'), E(ePress, 'out', nP, 'b'),
        E(c1, 'out', out, 'a'), E(nP, 'out', out, 'b')
      );
      return out;
    }

    /** Expanded happinessAgeWeight(t). */
    function expandHAgeW(nodes, edges, prefix, tId, x0, y0) {
      var c1 = prefix + '_c1', oneMt = prefix + '_omt', c035 = prefix + '_c035';
      var mulY = prefix + '_mulY', c085 = prefix + '_c085', youth = prefix + '_youth';
      var c09 = prefix + '_c09', mulS = prefix + '_mulS', c07 = prefix + '_c07', scar = prefix + '_scar';
      var c045 = prefix + '_c045', c055 = prefix + '_c055', t1 = prefix + '_t1', t2 = prefix + '_t2', out = prefix + '_hW';
      nodes.push(
        N(c1, 'data.const', x0, y0, { value: 1, ref: '' }),
        N(oneMt, 'op.sub', x0 + 140, y0, {}),
        N(c035, 'data.const', x0, y0 + 50, { value: 0.35, ref: '' }),
        N(mulY, 'op.mul', x0 + 280, y0 + 20, {}),
        N(c085, 'data.const', x0, y0 + 100, { value: 0.85, ref: '' }),
        N(youth, 'op.add', x0 + 420, y0 + 40, {}),
        N(c09, 'data.const', x0, y0 + 150, { value: 0.9, ref: '' }),
        N(mulS, 'op.mul', x0 + 140, y0 + 140, {}),
        N(c07, 'data.const', x0, y0 + 200, { value: 0.7, ref: '' }),
        N(scar, 'op.add', x0 + 280, y0 + 170, {}),
        N(c045, 'data.const', x0 + 420, y0 + 100, { value: 0.45, ref: '' }),
        N(c055, 'data.const', x0 + 420, y0 + 160, { value: 0.55, ref: '' }),
        N(t1, 'op.mul', x0 + 560, y0 + 60, {}),
        N(t2, 'op.mul', x0 + 560, y0 + 140, {}),
        N(out, 'op.add', x0 + 700, y0 + 100, {})
      );
      edges.push(
        E(c1, 'out', oneMt, 'a'), E(tId, 'out', oneMt, 'b'),
        E(c035, 'out', mulY, 'a'), E(oneMt, 'out', mulY, 'b'),
        E(c085, 'out', youth, 'a'), E(mulY, 'out', youth, 'b'),
        E(c09, 'out', mulS, 'a'), E(tId, 'out', mulS, 'b'),
        E(c07, 'out', scar, 'a'), E(mulS, 'out', scar, 'b'),
        E(c045, 'out', t1, 'a'), E(youth, 'out', t1, 'b'),
        E(c055, 'out', t2, 'a'), E(scar, 'out', t2, 'b'),
        E(t1, 'out', out, 'a'), E(t2, 'out', out, 'b')
      );
      return out;
    }

    /** Expanded moneyDisutility(cost,M,t,rate). */
    function expandMoneyDisutil(nodes, edges, prefix, costId, mId, tId, rateId, x0, y0) {
      var cEps = prefix + '_eps', mSafe = prefix + '_mS', c0 = prefix + '_c0', c1 = prefix + '_c1';
      var tCl = prefix + '_tCl', base = prefix + '_base', c10 = prefix + '_c10', t10 = prefix + '_t10';
      var dep = prefix + '_dep', ratio = prefix + '_ratio', scar = prefix + '_scar';
      var logC = prefix + '_log', pain1 = prefix + '_p1', pain = prefix + '_pain';
      var cEps9 = prefix + '_e9', out = prefix + '_mCost';
      nodes.push(
        N(cEps, 'data.const', x0, y0, { value: 1e-6, ref: '' }),
        N(mSafe, 'op.max', x0 + 140, y0, {}),
        N(c0, 'data.const', x0, y0 + 50, { value: 0, ref: '' }),
        N(c1, 'data.const', x0, y0 + 100, { value: 1, ref: '' }),
        N(tCl, 'op.clamp', x0 + 140, y0 + 60, {}),
        N(base, 'op.add', x0 + 280, y0 + 100, {}),
        N(c10, 'data.const', x0 + 140, y0 + 140, { value: 10, ref: '' }),
        N(t10, 'op.mul', x0 + 280, y0 + 150, {}),
        N(dep, 'op.pow', x0 + 420, y0 + 120, {}),
        N(ratio, 'op.div', x0 + 280, y0 + 20, {}),
        N(scar, 'op.add', x0 + 420, y0 + 40, {}),
        N(logC, 'op.log1p', x0 + 140, y0 + 200, {}),
        N(pain1, 'op.mul', x0 + 560, y0 + 80, {}),
        N(pain, 'op.mul', x0 + 700, y0 + 100, {}),
        N(cEps9, 'data.const', x0 + 560, y0 + 160, { value: 1e-9, ref: '' }),
        N(out, 'op.max', x0 + 840, y0 + 120, {})
      );
      edges.push(
        E(mId, 'out', mSafe, 'a'), E(cEps, 'out', mSafe, 'b'),
        E(tId, 'out', tCl, 'a'), E(c0, 'out', tCl, 'lo'), E(c1, 'out', tCl, 'hi'),
        E(c1, 'out', base, 'a'), E(rateId, 'out', base, 'b'),
        E(tCl, 'out', t10, 'a'), E(c10, 'out', t10, 'b'),
        E(base, 'out', dep, 'a'), E(t10, 'out', dep, 'b'),
        E(costId, 'out', ratio, 'a'), E(mSafe, 'out', ratio, 'b'),
        E(c1, 'out', scar, 'a'), E(ratio, 'out', scar, 'b'),
        E(costId, 'out', logC, 'a'),
        E(logC, 'out', pain1, 'a'), E(scar, 'out', pain1, 'b'),
        E(pain1, 'out', pain, 'a'), E(dep, 'out', pain, 'b'),
        E(pain, 'out', out, 'a'), E(cEps9, 'out', out, 'b')
      );
      return out;
    }

    /** Expanded daysCapacityWeight(days,D). */
    function expandDaysCap(nodes, edges, prefix, daysId, dId, x0, y0) {
      var absD = prefix + '_abs', cEps = prefix + '_eps', dSafe = prefix + '_dS';
      var ratio = prefix + '_r', c1 = prefix + '_c1', den = prefix + '_den', out = prefix + '_dayW';
      nodes.push(
        N(absD, 'op.abs', x0, y0, {}),
        N(cEps, 'data.const', x0, y0 + 50, { value: 1e-6, ref: '' }),
        N(dSafe, 'op.max', x0 + 140, y0 + 30, {}),
        N(ratio, 'op.div', x0 + 280, y0 + 10, {}),
        N(c1, 'data.const', x0 + 140, y0 + 90, { value: 1, ref: '' }),
        N(den, 'op.add', x0 + 420, y0 + 40, {}),
        N(out, 'op.div', x0 + 560, y0 + 40, {})
      );
      edges.push(
        E(daysId, 'out', absD, 'a'),
        E(dId, 'out', dSafe, 'a'), E(cEps, 'out', dSafe, 'b'),
        E(absD, 'out', ratio, 'a'), E(dSafe, 'out', ratio, 'b'),
        E(c1, 'out', den, 'a'), E(ratio, 'out', den, 'b'),
        E(c1, 'out', out, 'a'), E(den, 'out', out, 'b')
      );
      return out;
    }

    /**
     * Pure place subgraphs matching METHODS.place — no place.fromAct.
     * Uses input.act / data.actField / jfactor / math → place.out.
     * Optional scoreId: wire place.y from score path (ageTick/debtPay).
     */
    function attachPurePlace(graph, kind, scoreId) {
      var nodes = (graph.nodes || []).slice();
      var edges = (graph.edges || []).slice();
      if (nodes.some(function (n) { return n && n.type === 'place.out'; })) {
        return normalizeGraph({ version: 1, nodes: nodes, edges: edges });
      }
      var x0 = 40, y0 = 680;
      var pxId = null, pyId = null;

      if (kind === 'earn') {
        nodes.push(
          N('pl_act', 'input.act', x0, y0, {}),
          N('pl_c001', 'data.const', x0 + 160, y0, { value: 0.01, ref: '' }),
          N('pl_hDay', 'op.max', x0 + 300, y0, {}),
          N('pl_wd', 'data.ctxField', x0, y0 + 60, { field: 'workdaysPerMonth', fallback: 22 }),
          N('pl_hMo', 'op.mul', x0 + 300, y0 + 50, {}),
          N('pl_jfy', 'data.ctxField', x0, y0 + 120, { field: 'y', fallback: 0 }),
          N('pl_jxm', 'jfactor.xMax', x0, y0 + 180, { fallback: 880, metric: 'hours' }),
          N('pl_jym', 'jfactor.yMax', x0 + 160, y0 + 180, { fallback: 8000, metric: 'money' }),
          N('pl_slope', 'op.div', x0 + 320, y0 + 180, {}),
          N('pl_ideal', 'op.mul', x0 + 460, y0 + 140, {}),
          N('pl_inc', 'op.firstPos', x0 + 600, y0 + 60, { hint: 'amount else y else slope·hours' }),
          N('place_out', 'place.out', x0 + 760, y0 + 40, { label: '' })
        );
        edges.push(
          E('pl_act', 'hours', 'pl_hDay', 'a'), E('pl_c001', 'out', 'pl_hDay', 'b'),
          E('pl_hDay', 'out', 'pl_hMo', 'a'), E('pl_wd', 'out', 'pl_hMo', 'b'),
          E('pl_jym', 'out', 'pl_slope', 'a'), E('pl_jxm', 'out', 'pl_slope', 'b'),
          E('pl_slope', 'out', 'pl_ideal', 'a'), E('pl_hMo', 'out', 'pl_ideal', 'b'),
          E('pl_act', 'amount', 'pl_inc', 'a'), E('pl_jfy', 'out', 'pl_inc', 'b'), E('pl_ideal', 'out', 'pl_inc', 'c'),
          E('pl_hMo', 'out', 'place_out', 'x'), E('pl_inc', 'out', 'place_out', 'y')
        );
      } else if (kind === 'moneyToHappy') {
        nodes.push(
          N('pl_act', 'input.act', x0, y0, {}),
          N('pl_c001', 'data.const', x0 + 160, y0, { value: 0.01, ref: '' }),
          N('pl_cost', 'op.max', x0 + 300, y0, {}),
          N('pl_jfy', 'data.ctxField', x0, y0 + 60, { field: 'y', fallback: 0 }),
          N('pl_s01', 'data.actField', x0, y0 + 120, { field: 'score01' }),
          N('pl_c1', 'data.const', x0 + 160, y0 + 120, { value: 1, ref: '' }),
          N('pl_cf', 'op.max', x0 + 300, y0 + 80, {}),
          N('pl_c015', 'data.const', x0 + 160, y0 + 180, { value: 0.15, ref: '' }),
          N('pl_raw1', 'op.mul', x0 + 440, y0 + 100, {}),
          N('pl_raw', 'op.mul', x0 + 580, y0 + 120, {}),
          N('pl_fb', 'op.mul', x0 + 300, y0 + 180, {}),
          N('pl_c0001', 'data.const', x0 + 440, y0 + 180, { value: 0.001, ref: '' }),
          N('pl_fb2', 'op.max', x0 + 580, y0 + 180, {}),
          N('pl_happy', 'op.firstPos', x0 + 720, y0 + 80, { hint: 'y else score01·cost·0.15 else cost·0.01' }),
          N('place_out', 'place.out', x0 + 880, y0 + 40, { label: '' })
        );
        edges.push(
          E('pl_act', 'amount', 'pl_cost', 'a'), E('pl_c001', 'out', 'pl_cost', 'b'),
          E('pl_cost', 'out', 'pl_cf', 'a'), E('pl_c1', 'out', 'pl_cf', 'b'),
          E('pl_s01', 'out', 'pl_raw1', 'a'), E('pl_cf', 'out', 'pl_raw1', 'b'),
          E('pl_raw1', 'out', 'pl_raw', 'a'), E('pl_c015', 'out', 'pl_raw', 'b'),
          E('pl_cost', 'out', 'pl_fb', 'a'), E('pl_c001', 'out', 'pl_fb', 'b'),
          E('pl_fb', 'out', 'pl_fb2', 'a'), E('pl_c0001', 'out', 'pl_fb2', 'b'),
          E('pl_jfy', 'out', 'pl_happy', 'a'), E('pl_raw', 'out', 'pl_happy', 'b'), E('pl_fb2', 'out', 'pl_happy', 'c'),
          E('pl_cost', 'out', 'place_out', 'x'), E('pl_happy', 'out', 'place_out', 'y')
        );
      } else if (kind === 'daysUse') {
        nodes.push(
          N('pl_act', 'input.act', x0, y0, {}),
          N('pl_c001', 'data.const', x0 + 160, y0, { value: 0.01, ref: '' }),
          N('pl_days', 'op.max', x0 + 300, y0, {}),
          N('pl_jfy', 'data.ctxField', x0, y0 + 60, { field: 'y', fallback: 0 }),
          N('pl_actD', 'data.actField', x0, y0 + 120, { field: 'D' }),
          N('pl_s01', 'data.actField', x0, y0 + 180, { field: 'score01' }),
          N('pl_c1', 'data.const', x0 + 160, y0 + 180, { value: 1, ref: '' }),
          N('pl_gain', 'op.firstPos', x0 + 300, y0 + 160, {}),
          N('pl_dD', 'data.ctxField', x0, y0 + 240, { field: 'D', fallback: 30 }),
          N('pl_cEps', 'data.const', x0 + 160, y0 + 240, { value: 1e-6, ref: '' }),
          N('pl_addG', 'op.add', x0 + 440, y0 + 160, {}),
          N('place_out', 'place.out', x0 + 900, y0 + 40, { label: '' })
        );
        var dayW = expandDaysCap(nodes, edges, 'pldc', 'pl_days', 'pl_dD', x0 + 300, y0 + 240);
        nodes.push(
          N('pl_mulW', 'op.mul', x0 + 620, y0 + 160, {}),
          N('pl_c10', 'data.const', x0 + 620, y0 + 220, { value: 10, ref: '' }),
          N('pl_model', 'op.mul', x0 + 760, y0 + 160, {}),
          N('pl_ret', 'op.firstPos', x0 + 900, y0 + 100, {})
        );
        edges.push(
          E('pl_act', 'days', 'pl_days', 'a'), E('pl_c001', 'out', 'pl_days', 'b'),
          E('pl_s01', 'out', 'pl_gain', 'a'), E('pl_c1', 'out', 'pl_gain', 'b'),
          E('pl_gain', 'out', 'pl_addG', 'a'), E('pl_cEps', 'out', 'pl_addG', 'b'),
          E('pl_addG', 'out', 'pl_mulW', 'a'), E(dayW, 'out', 'pl_mulW', 'b'),
          E('pl_mulW', 'out', 'pl_model', 'a'), E('pl_c10', 'out', 'pl_model', 'b'),
          E('pl_jfy', 'out', 'pl_ret', 'a'), E('pl_actD', 'out', 'pl_ret', 'b'), E('pl_model', 'out', 'pl_ret', 'c'),
          E('pl_days', 'out', 'place_out', 'x'), E('pl_ret', 'out', 'place_out', 'y')
        );
      } else if (kind === 'ageTick') {
        /* x = ctx.x else 1; y = score path re-eval with that x via duplicated formula nodes */
        nodes.push(
          N('pl_ctxX', 'data.ctxField', x0, y0, { field: 'x', fallback: 0 }),
          N('pl_abs', 'op.abs', x0 + 140, y0, {}),
          N('pl_c1', 'data.const', x0, y0 + 60, { value: 1, ref: '' }),
          N('pl_x', 'op.firstPos', x0 + 280, y0 + 20, { hint: '|ctx.x| else 1' }),
          N('place_out', 'place.out', x0 + 1400, y0, { label: '' })
        );
        edges.push(
          E('pl_ctxX', 'out', 'pl_abs', 'a'),
          E('pl_abs', 'out', 'pl_x', 'a'), E('pl_c1', 'out', 'pl_x', 'b'),
          E('pl_x', 'out', 'place_out', 'x')
        );
        /* rebuild ageTick score for place.y from pl_x (not jfor.x / act.amount) */
        nodes.push(
          N('pl_c015', 'data.const', x0 + 280, y0 + 80, { value: 0.15, ref: '' }),
          N('pl_add1', 'op.add', x0 + 420, y0 + 40, {}),
          N('pl_base', 'op.div', x0 + 560, y0 + 40, {}),
          N('pl_dE', 'data.ctxField', x0 + 280, y0 + 140, { field: 'E', fallback: 0 }),
          N('pl_dEmax', 'data.ctxField', x0 + 280, y0 + 200, { field: 'Emax', fallback: 0 }),
          N('pl_c11', 'data.const', x0 + 900, y0 + 40, { value: 1.1, ref: '' }),
          N('pl_c04', 'data.const', x0 + 900, y0 + 100, { value: 0.4, ref: '' }),
          N('pl_mul04', 'op.mul', x0 + 1040, y0 + 80, {}),
          N('pl_ageMul', 'op.sub', x0 + 1180, y0 + 60, {}),
          N('pl_mulBE', 'op.mul', x0 + 1180, y0 + 20, {}),
          N('pl_sc', 'op.mul', x0 + 1320, y0 + 40, {})
        );
        edges.push(
          E('pl_c1', 'out', 'pl_add1', 'a'), E('pl_x', 'out', 'pl_add1', 'b'),
          E('pl_c015', 'out', 'pl_base', 'a'), E('pl_add1', 'out', 'pl_base', 'b')
        );
        var _plt = expandAgeT(nodes, edges, 'platick', x0 + 420, y0 + 140);
        var _ple = expandExternal(nodes, edges, 'plaext', 'age_tick', _plt, 'pl_dE', 'pl_dEmax', x0 + 560, y0 + 140);
        edges.push(
          E('pl_c04', 'out', 'pl_mul04', 'a'), E(_plt, 'out', 'pl_mul04', 'b'),
          E('pl_c11', 'out', 'pl_ageMul', 'a'), E('pl_mul04', 'out', 'pl_ageMul', 'b'),
          E('pl_base', 'out', 'pl_mulBE', 'a'), E(_ple, 'out', 'pl_mulBE', 'b'),
          E('pl_mulBE', 'out', 'pl_sc', 'a'), E('pl_ageMul', 'out', 'pl_sc', 'b'),
          E('pl_sc', 'out', 'place_out', 'y')
        );
      } else if (kind === 'extUse') {
        nodes.push(
          N('pl_ctxX', 'data.ctxField', x0, y0, { field: 'x', fallback: 0 }),
          N('pl_abs', 'op.abs', x0 + 140, y0, {}),
          N('pl_rankE', 'data.actField', x0, y0 + 60, { field: 'rankE' }),
          N('pl_c05', 'data.const', x0, y0 + 120, { value: 0.5, ref: '' }),
          N('pl_used', 'op.firstPos', x0 + 280, y0 + 40, { hint: 'rankE else |ctx.x| else 0.5' }),
          N('pl_jfy', 'data.ctxField', x0, y0 + 180, { field: 'y', fallback: 0 }),
          N('pl_s01', 'data.actField', x0, y0 + 240, { field: 'score01' }),
          N('pl_c1g', 'data.const', x0 + 140, y0 + 240, { value: 1, ref: '' }),
          N('pl_gain', 'op.firstPos', x0 + 280, y0 + 200, {}),
          N('pl_cEps', 'data.const', x0 + 280, y0 + 260, { value: 1e-6, ref: '' }),
          N('pl_addG', 'op.add', x0 + 420, y0 + 200, {}),
          N('pl_dE', 'data.ctxField', x0, y0 + 300, { field: 'E', fallback: 0 }),
          N('pl_dEmax', 'data.ctxField', x0, y0 + 360, { field: 'Emax', fallback: 0 }),
          N('place_out', 'place.out', x0 + 1100, y0 + 40, { label: '' })
        );
        var tId = expandAgeT(nodes, edges, 'plat', x0 + 160, y0 + 300);
        var extId = expandExternal(nodes, edges, 'plex', '', tId, 'pl_dE', 'pl_dEmax', x0 + 420, y0 + 300);
        nodes.push(
          N('pl_mulE', 'op.mul', x0 + 780, y0 + 180, {}),
          N('pl_c1', 'data.const', x0 + 780, y0 + 80, { value: 1, ref: '' }),
          N('pl_den', 'op.add', x0 + 780, y0 + 40, {}),
          N('pl_model', 'op.div', x0 + 940, y0 + 100, {}),
          N('pl_ret', 'op.firstPos', x0 + 1100, y0 + 100, {})
        );
        edges.push(
          E('pl_rankE', 'out', 'pl_used', 'a'), E('pl_abs', 'out', 'pl_used', 'b'), E('pl_c05', 'out', 'pl_used', 'c'),
          E('pl_ctxX', 'out', 'pl_abs', 'a'),
          E('pl_s01', 'out', 'pl_gain', 'a'), E('pl_c1g', 'out', 'pl_gain', 'b'),
          E('pl_gain', 'out', 'pl_addG', 'a'), E('pl_cEps', 'out', 'pl_addG', 'b'),
          E('pl_addG', 'out', 'pl_mulE', 'a'), E(extId, 'out', 'pl_mulE', 'b'),
          E('pl_c1', 'out', 'pl_den', 'a'), E('pl_used', 'out', 'pl_den', 'b'),
          E('pl_mulE', 'out', 'pl_model', 'a'), E('pl_den', 'out', 'pl_model', 'b'),
          E('pl_jfy', 'out', 'pl_ret', 'a'), E('pl_model', 'out', 'pl_ret', 'b'),
          E('pl_used', 'out', 'place_out', 'x'), E('pl_ret', 'out', 'place_out', 'y')
        );
      } else if (kind === 'debtPay') {
        /* pay=max(amount,0.01); y≈scoreDebtPay with principalRelief=pay*0.5; apr from ctx/act else 0.18 */
        nodes.push(
          N('pl_act', 'input.act', x0, y0, {}),
          N('pl_c001', 'data.const', x0 + 160, y0, { value: 0.01, ref: '' }),
          N('pl_pay', 'op.max', x0 + 300, y0, {}),
          N('pl_c05y', 'data.const', x0 + 160, y0 + 60, { value: 0.5, ref: '' }),
          N('pl_yRel', 'op.mul', x0 + 300, y0 + 60, {}),
          N('pl_aprCtx', 'data.ctxField', x0, y0 + 120, { field: 'apr', fallback: 0 }),
          N('pl_aprAct', 'data.actField', x0, y0 + 180, { field: 'apr' }),
          N('pl_apr18', 'data.const', x0, y0 + 240, { value: 0.18, ref: '' }),
          N('pl_apr', 'op.firstPos', x0 + 200, y0 + 160, { hint: 'ctx.apr else act.apr else 0.18' }),
          N('pl_c0', 'data.const', x0 + 360, y0 + 120, { value: 0, ref: '' }),
          N('pl_c05a', 'data.const', x0 + 360, y0 + 160, { value: 0.5, ref: '' }),
          N('pl_clApr', 'op.clamp', x0 + 500, y0 + 140, {}),
          N('pl_c8', 'data.const', x0 + 500, y0 + 200, { value: 8, ref: '' }),
          N('pl_mul8', 'op.mul', x0 + 640, y0 + 160, {}),
          N('pl_c15', 'data.const', x0 + 500, y0 + 80, { value: 1.5, ref: '' }),
          N('pl_urg', 'op.add', x0 + 780, y0 + 120, {}),
          N('pl_intCtx', 'data.ctxField', x0, y0 + 300, { field: 'interest', fallback: 0 }),
          N('pl_c12', 'data.const', x0 + 160, y0 + 260, { value: 12, ref: '' }),
          N('pl_apr12', 'op.div', x0 + 300, y0 + 240, {}),
          N('pl_intDef', 'op.mul', x0 + 440, y0 + 260, {}),
          N('pl_int', 'op.firstPos', x0 + 580, y0 + 280, { hint: 'interest else pay·apr/12' }),
          N('pl_cEps', 'data.const', x0 + 160, y0 + 320, { value: 1e-6, ref: '' }),
          N('pl_maxPay', 'op.max', x0 + 300, y0 + 320, {}),
          N('pl_divInt', 'op.div', x0 + 720, y0 + 300, {}),
          N('pl_c2', 'data.const', x0 + 440, y0 + 360, { value: 2, ref: '' }),
          N('pl_mul2', 'op.mul', x0 + 580, y0 + 320, {}),
          N('pl_urg2', 'op.add', x0 + 920, y0 + 160, {}),
          N('pl_c025', 'data.const', x0 + 300, y0 + 380, { value: 0.25, ref: '' }),
          N('pl_mulP25', 'op.mul', x0 + 440, y0 + 400, {}),
          N('pl_addRel', 'op.add', x0 + 580, y0 + 400, {}),
          N('pl_relief', 'op.sqrt', x0 + 720, y0 + 400, {}),
          N('pl_mulUR', 'op.mul', x0 + 1060, y0 + 240, {}),
          N('pl_dM', 'data.ctxField', x0, y0 + 440, { field: 'M', fallback: 2000 }),
          N('pl_c1', 'data.const', x0 + 300, y0 + 440, { value: 1, ref: '' }),
          N('pl_divPM', 'op.div', x0 + 440, y0 + 460, {}),
          N('pl_scar', 'op.add', x0 + 580, y0 + 460, {}),
          N('pl_sc', 'op.div', x0 + 1200, y0 + 280, {}),
          N('place_out', 'place.out', x0 + 1360, y0 + 40, { label: '' })
        );
        edges.push(
          E('pl_act', 'amount', 'pl_pay', 'a'), E('pl_c001', 'out', 'pl_pay', 'b'),
          E('pl_pay', 'out', 'pl_yRel', 'a'), E('pl_c05y', 'out', 'pl_yRel', 'b'),
          E('pl_aprCtx', 'out', 'pl_apr', 'a'), E('pl_aprAct', 'out', 'pl_apr', 'b'), E('pl_apr18', 'out', 'pl_apr', 'c'),
          E('pl_apr', 'out', 'pl_clApr', 'a'), E('pl_c0', 'out', 'pl_clApr', 'lo'), E('pl_c05a', 'out', 'pl_clApr', 'hi'),
          E('pl_c8', 'out', 'pl_mul8', 'a'), E('pl_clApr', 'out', 'pl_mul8', 'b'),
          E('pl_c15', 'out', 'pl_urg', 'a'), E('pl_mul8', 'out', 'pl_urg', 'b'),
          E('pl_apr', 'out', 'pl_apr12', 'a'), E('pl_c12', 'out', 'pl_apr12', 'b'),
          E('pl_pay', 'out', 'pl_intDef', 'a'), E('pl_apr12', 'out', 'pl_intDef', 'b'),
          E('pl_intCtx', 'out', 'pl_int', 'a'), E('pl_intDef', 'out', 'pl_int', 'b'),
          E('pl_pay', 'out', 'pl_maxPay', 'a'), E('pl_cEps', 'out', 'pl_maxPay', 'b'),
          E('pl_int', 'out', 'pl_divInt', 'a'), E('pl_maxPay', 'out', 'pl_divInt', 'b'),
          E('pl_c2', 'out', 'pl_mul2', 'a'), E('pl_divInt', 'out', 'pl_mul2', 'b'),
          E('pl_urg', 'out', 'pl_urg2', 'a'), E('pl_mul2', 'out', 'pl_urg2', 'b'),
          E('pl_pay', 'out', 'pl_mulP25', 'a'), E('pl_c025', 'out', 'pl_mulP25', 'b'),
          E('pl_yRel', 'out', 'pl_addRel', 'a'), E('pl_mulP25', 'out', 'pl_addRel', 'b'),
          E('pl_addRel', 'out', 'pl_relief', 'a'),
          E('pl_urg2', 'out', 'pl_mulUR', 'a'), E('pl_relief', 'out', 'pl_mulUR', 'b'),
          E('pl_pay', 'out', 'pl_divPM', 'a'), E('pl_dM', 'out', 'pl_divPM', 'b'),
          E('pl_c1', 'out', 'pl_scar', 'a'), E('pl_divPM', 'out', 'pl_scar', 'b'),
          E('pl_mulUR', 'out', 'pl_sc', 'a'), E('pl_scar', 'out', 'pl_sc', 'b'),
          E('pl_pay', 'out', 'place_out', 'x'), E('pl_sc', 'out', 'place_out', 'y')
        );
      } else if (kind === 'localWeekend' || kind === 'localEconomy' || kind === 'morningCanvasRoi') {
        /* x = structured morning hours; y = yMax·log1p(x)/log1p(xMax) */
        nodes.push(
          N('pl_act', 'input.act', x0, y0, {}),
          N('pl_c001', 'data.const', x0 + 160, y0, { value: 0.01, ref: '' }),
          N('pl_h', 'op.max', x0 + 300, y0, {}),
          N('pl_jxm', 'jfactor.xMax', x0, y0 + 60, { fallback: 7, metric: 'hours' }),
          N('pl_jym', 'jfactor.yMax', x0 + 160, y0 + 60, { fallback: 1, metric: 'roi' }),
          N('pl_xmin', 'op.min', x0 + 300, y0 + 40, {}),
          N('pl_logX', 'op.log1p', x0 + 460, y0 + 20, {}),
          N('pl_logXm', 'op.log1p', x0 + 460, y0 + 80, {}),
          N('pl_ratio', 'op.div', x0 + 620, y0 + 40, {}),
          N('pl_y', 'op.mul', x0 + 780, y0 + 40, {}),
          N('place_out', 'place.out', x0 + 940, y0 + 20, { label: '' })
        );
        edges.push(
          E('pl_act', 'hours', 'pl_h', 'a'), E('pl_c001', 'out', 'pl_h', 'b'),
          E('pl_h', 'out', 'pl_xmin', 'a'), E('pl_jxm', 'out', 'pl_xmin', 'b'),
          E('pl_xmin', 'out', 'pl_logX', 'a'),
          E('pl_jxm', 'out', 'pl_logXm', 'a'),
          E('pl_logX', 'out', 'pl_ratio', 'a'), E('pl_logXm', 'out', 'pl_ratio', 'b'),
          E('pl_jym', 'out', 'pl_y', 'a'), E('pl_ratio', 'out', 'pl_y', 'b'),
          E('pl_xmin', 'out', 'place_out', 'x'), E('pl_y', 'out', 'place_out', 'y')
        );
      } else {
        nodes.push(
          N('pl_jfx', 'jfactor.x', x0, y0, {}),
          N('pl_jfy', 'jfactor.y', x0, y0 + 60, {}),
          N('place_out', 'place.out', x0 + 200, y0 + 20, { label: '' })
        );
        edges.push(E('pl_jfx', 'out', 'place_out', 'x'), E('pl_jfy', 'out', 'place_out', 'y'));
      }
      return normalizeGraph({ version: 1, nodes: nodes, edges: edges });
    }

    /**
     * easy176: inject view.sample wired to METHODS-parity idealY(x); re-route view.out.curve.
     * view.curve stays as authoring sugar (domain labels / CAD blob fallback).
     */
    function attachWiredIdealYView(graph, kind) {
      var g = normalizeGraph(graph);
      var viewOut = findViewOut(g);
      if (!viewOut) return g;
      var vc = findViewCurve(g);
      g.edges = (g.edges || []).filter(function (e) {
        return !(e && e.to === viewOut.id && e.toPort === 'curve');
      });
      var jxm = null, jym = null, jfx = null;
      (g.nodes || []).forEach(function (n) {
        if (!n) return;
        if (n.type === 'jfactor.xMax' && !jxm) jxm = n.id;
        if (n.type === 'jfactor.yMax' && !jym) jym = n.id;
        if (n.type === 'jfactor.x' && !jfx) jfx = n.id;
      });
      var bx = vc ? num(vc.x, 400) : 400;
      var by = vc ? num(vc.y, 700) + 80 : 700;
      var nodes = g.nodes;
      var edges = g.edges;
      function add(id, type, x, y, params) {
        nodes.push(N(id, type, x, y, params || {}));
        return id;
      }
      function link(a, ap, b, bp) { edges.push(E(a, ap, b, bp)); }

      if (!jfx) jfx = add('vs_jfx', 'jfactor.x', bx - 220, by, {});

      var yOut = null;
      var sampleParams = { xMax: 100, note: 'wired idealY · CAD is sugar' };

      if (kind === 'earn') {
        if (!jxm) jxm = add('vs_jxm', 'jfactor.xMax', bx - 220, by + 60, { fallback: 880, metric: 'hours' });
        if (!jym) jym = add('vs_jym', 'jfactor.yMax', bx - 220, by + 120, { fallback: 8000, metric: 'money' });
        add('vs_ratio', 'op.div', bx - 40, by + 40, {});
        add('vs_lin', 'op.mul', bx + 120, by + 20, {});
        link(jym, 'out', 'vs_ratio', 'a');
        link(jxm, 'out', 'vs_ratio', 'b');
        link('vs_ratio', 'out', 'vs_lin', 'a');
        link(jfx, 'out', 'vs_lin', 'b');
        yOut = 'vs_lin';
        sampleParams.xMax = 880;
      } else if (kind === 'moneyToHappy') {
        add('vs_abs', 'op.abs', bx - 40, by, {});
        add('vs_sqrtx', 'op.sqrt', bx + 100, by, {});
        add('vs_sqrtxm', 'op.sqrt', bx - 40, by + 60, {});
        add('vs_k', 'op.div', bx + 100, by + 60, {});
        add('vs_out', 'op.mul', bx + 260, by + 20, {});
        link(jfx, 'out', 'vs_abs', 'a');
        link('vs_abs', 'out', 'vs_sqrtx', 'a');
        link(jxm, 'out', 'vs_sqrtxm', 'a');
        link(jym, 'out', 'vs_k', 'a');
        link('vs_sqrtxm', 'out', 'vs_k', 'b');
        link('vs_k', 'out', 'vs_out', 'a');
        link('vs_sqrtx', 'out', 'vs_out', 'b');
        yOut = 'vs_out';
        sampleParams.xMax = 800;
      } else if (kind === 'daysUse') {
        add('vs_dD', 'data.ctxField', bx - 220, by, { field: 'D', fallback: 30 });
        add('vs_c1', 'data.const', bx - 220, by + 60, { value: 1, ref: '' });
        add('vs_divXD', 'op.div', bx - 40, by, {});
        add('vs_add1', 'op.add', bx + 100, by + 20, {});
        add('vs_inv', 'op.div', bx + 240, by + 20, {});
        add('vs_out', 'op.mul', bx + 380, by + 40, {});
        link(jfx, 'out', 'vs_divXD', 'a');
        link('vs_dD', 'out', 'vs_divXD', 'b');
        link('vs_c1', 'out', 'vs_add1', 'a');
        link('vs_divXD', 'out', 'vs_add1', 'b');
        link('vs_c1', 'out', 'vs_inv', 'a');
        link('vs_add1', 'out', 'vs_inv', 'b');
        link(jym, 'out', 'vs_out', 'a');
        link('vs_inv', 'out', 'vs_out', 'b');
        yOut = 'vs_out';
        sampleParams.xMax = 31;
      } else if (kind === 'ageTick') {
        /* same ops as score / JF.scoreAgeTick */
        var sink = findSink(g);
        var ein = sink ? edgeInto(g, sink.id, 'in') : null;
        yOut = ein ? ein.from : null;
        sampleParams.xMax = 12;
      } else if (kind === 'extUse') {
        var add1 = nodeById(g, 'add1x');
        var extId = null;
        (g.edges || []).forEach(function (e) {
          if (e && e.to === 'mulE' && e.toPort === 'b') extId = e.from;
        });
        if (!add1) {
          add('vs_c1e', 'data.const', bx - 220, by, { value: 1, ref: '' });
          add('vs_add1x', 'op.add', bx - 40, by, {});
          link('vs_c1e', 'out', 'vs_add1x', 'a');
          link(jfx, 'out', 'vs_add1x', 'b');
          add1 = nodeById(g, 'vs_add1x');
        }
        if (!extId) extId = add('vs_ext1', 'data.const', bx - 220, by + 60, { value: 1, ref: '' });
        add('vs_out', 'op.div', bx + 140, by + 20, {});
        link(extId, 'out', 'vs_out', 'a');
        link(add1.id, 'out', 'vs_out', 'b');
        yOut = 'vs_out';
        sampleParams.xMax = 5;
      } else if (kind === 'debtPay') {
        /* Bake y = 0.5*x into a parallel score-shaped branch */
        sampleParams.xMax = 800;
        sampleParams.idealYMode = 'debtPay';
        var absX = nodeById(g, 'absX');
        if (!absX) {
          add('vs_absx', 'op.abs', bx - 220, by, {});
          link(jfx, 'out', 'vs_absx', 'a');
          absX = nodeById(g, 'vs_absx');
        }
        add('vs_c05', 'data.const', bx - 220, by + 60, { value: 0.5, ref: '' });
        add('vs_yhalf', 'op.mul', bx - 40, by + 40, {});
        link(absX.id, 'out', 'vs_yhalf', 'a');
        link('vs_c05', 'out', 'vs_yhalf', 'b');
        /* urg from existing addU1/mul2 path: reuse score node inputs by cloning via score out
           with absY temporarily — instead recompute relief with vs_yhalf */
        var urgN = nodeById(g, 'urg');
        var scarN = nodeById(g, 'scar');
        var c025 = nodeById(g, 'c025');
        if (urgN && scarN && c025) {
          add('vs_mulP25', 'op.mul', bx - 40, by + 100, {});
          add('vs_addRel', 'op.add', bx + 100, by + 80, {});
          add('vs_relief', 'op.sqrt', bx + 240, by + 80, {});
          add('vs_mulUR', 'op.mul', bx + 380, by + 60, {});
          add('vs_out', 'op.div', bx + 520, by + 60, {});
          link(absX.id, 'out', 'vs_mulP25', 'a');
          link(c025.id, 'out', 'vs_mulP25', 'b');
          link('vs_yhalf', 'out', 'vs_addRel', 'a');
          link('vs_mulP25', 'out', 'vs_addRel', 'b');
          link('vs_addRel', 'out', 'vs_relief', 'a');
          link(urgN.id, 'out', 'vs_mulUR', 'a');
          link('vs_relief', 'out', 'vs_mulUR', 'b');
          link('vs_mulUR', 'out', 'vs_out', 'a');
          link(scarN.id, 'out', 'vs_out', 'b');
          yOut = 'vs_out';
        } else {
          var sink = findSink(g);
          var ein = sink ? edgeInto(g, sink.id, 'in') : null;
          yOut = ein ? ein.from : null;
        }
      }

      if (!yOut) {
        /* restore blob edge if we failed */
        if (vc) edges.push(E(vc.id, 'idealY', viewOut.id, 'curve'));
        return normalizeGraph({ version: 1, nodes: nodes, edges: edges, groups: g.groups });
      }
      add('vs', 'view.sample', bx + 200, by - 20, sampleParams);
      link(yOut, 'out', 'vs', 'y');
      if (jxm) link(jxm, 'out', 'vs', 'xMax');
      link('vs', 'curve', viewOut.id, 'curve');
      return normalizeGraph({ version: 1, nodes: nodes, edges: edges, groups: g.groups });
    }

    function localWeekendGraph() {
      /* easy186: weekend joy prior ÷ factor-weighted location friction (gas+time+days).
         EXAMPLE outing priors — VERIFY miles/mpg/gas; not live prices. */
      var xMax = 5, yMax = 1;
      var pts = [];
      for (var i = 0; i <= 8; i++) {
        var xv = (xMax / 8) * i;
        pts.push({ x: xv, y: yMax * (0.8 / (1 + xv)) });
      }
      var curveParams = defaultCadCurveParams({
        math: { type: 'bezier', params: { points: pts } },
        xMax: xMax, yMax: yMax,
        xLabel: 'friction (factor-weighted gas+time+days; 0…5 EXAMPLE)', yLabel: 'weekend net joy / fit'
      });
      var nodes = [
        N('cMiles', 'data.const', 40, 40, { value: 18, ref: '' }),
        N('cMin', 'data.const', 40, 100, { value: 25, ref: '' }),
        N('cBen', 'data.const', 40, 160, { value: 0.8, ref: '' }),
        N('jfy', 'jfactor.y', 40, 220, {}),
        N('ben', 'op.firstPos', 200, 190, {}),
        N('fc', 'econ.factorCosts', 200, 40, {
          milesOneWay: 18, mpg: 22, gasUsdPerGal: 3.2, minutesOneWay: 25,
          parkingUsd: 0, serviceUsd: 8, daysUse: 0.25,
          note: 'EXAMPLE weekend outing · factor-weighted M/T/D (VERIFY gas/mpg)'
        }),
        N('sup', 'econ.firmSupply', 200, 280, {
          capacity: 1, openHoursStart: 480, openHoursEnd: 1260, firmId: '',
          note: 'EXAMPLE weekend venue open'
        }),
        N('dem', 'econ.clientDemand', 380, 280, {
          demand: 0.2, clients: 1,
          note: 'EXAMPLE weekend demand prior'
        }),
        N('conf', 'econ.scheduleConflict', 200, 360, {
          serviceStartMin: 600, serviceEndMin: 900,
          note: 'EXAMPLE vs Matthew work/sleep America/Chicago'
        }),
        N('netn', 'econ.benefitNet', 520, 140, {
          emitMin: 0.45,
          note: 'net=benefit*supply/(1+demand)/(1+friction)*(1-conflict) · friction=factorCosts'
        }),
        N('jxm', 'jfactor.xMax', 40, 440, { fallback: xMax, metric: 'friction' }),
        N('jym', 'jfactor.yMax', 40, 500, { fallback: yMax, metric: 'net' }),
        N('sio', 'score.ideal_over_ymax', 720, 140, {}),
        N('vc', 'view.curve', 420, 400, curveParams),
        N('vs', 'view.sample', 720, 240, { xMax: xMax, note: 'wired idealY = weekend benefitNet · EXAMPLE factorCosts' }),
        N('bem', 'board.emit', 720, 340, { note: 'Emit idea.boardItems → Board', seedExample: true, items: [] }),
        N('score_out', 'score.out', 920, 140, {}),
        N('view_out', 'view.out', 920, 260, {})
      ];
      var edges = [
        E('cMiles', 'out', 'fc', 'miles'), E('cMin', 'out', 'fc', 'minutes'),
        E('jfy', 'out', 'ben', 'a'), E('cBen', 'out', 'ben', 'b'),
        E('ben', 'out', 'netn', 'benefit'),
        E('fc', 'friction', 'netn', 'friction'),
        E('sup', 'supply', 'netn', 'supply'),
        E('dem', 'demand', 'netn', 'demand'),
        E('conf', 'conflict', 'netn', 'conflict'),
        E('netn', 'net', 'sio', 'idealY'), E('jym', 'out', 'sio', 'yMax'),
        E('sio', 'out', 'score_out', 'in'),
        E('netn', 'net', 'vs', 'y'), E('jxm', 'out', 'vs', 'xMax'),
        E('vs', 'curve', 'view_out', 'curve'),
        E('jxm', 'out', 'vc', 'xMax'), E('jym', 'out', 'vc', 'yMax')
      ];
      return normalizeGraph({ version: 1, nodes: nodes, edges: edges });
    }

    function localEconomyGraph() {
      /* easy186: factorCosts (M/T/D-weighted gas+time+days) + scheduleConflict + firmSupply +
         clientDemand → benefitNet. EXAMPLE priors only — VERIFY gas/mpg/prices. */
      var xMax = 5, yMax = 1;
      var pts = [];
      for (var i = 0; i <= 8; i++) {
        var xv = (xMax / 8) * i;
        /* sugar PREVIEW: EXAMPLE net ≈ 0.85 / (1+friction) * 0.9 — wired view.sample is SoT */
        pts.push({ x: xv, y: yMax * (0.85 / (1 + xv)) * 0.9 });
      }
      var curveParams = defaultCadCurveParams({
        math: { type: 'bezier', params: { points: pts } },
        xMax: xMax, yMax: yMax,
        xLabel: 'friction (factor-weighted gas+time+days; 0…5 EXAMPLE)', yLabel: 'net benefit (0…1)'
      });
      var nodes = [
        N('cMiles', 'data.const', 40, 40, { value: 12, ref: '' }),
        N('cMin', 'data.const', 40, 100, { value: 20, ref: '' }),
        N('cCap', 'data.const', 40, 160, { value: 0.9, ref: '' }),
        N('cDem', 'data.const', 40, 220, { value: 0.35, ref: '' }),
        N('cBen', 'data.const', 40, 280, { value: 0.75, ref: '' }),
        N('jfy', 'jfactor.y', 40, 340, {}),
        N('ben', 'op.firstPos', 200, 310, {}),
        N('fc', 'econ.factorCosts', 200, 40, {
          milesOneWay: 12, mpg: 22, gasUsdPerGal: 3.2, minutesOneWay: 20,
          parkingUsd: 0, serviceUsd: 8, daysUse: 0.15,
          note: 'EXAMPLE factor-weighted friction (gas+time+days · VERIFY gas/mpg)'
        }),
        N('conf', 'econ.scheduleConflict', 200, 160, {
          serviceStartMin: 600, serviceEndMin: 720,
          note: 'EXAMPLE vs [REDACTED-SCHEDULE] America/Chicago'
        }),
        N('sup', 'econ.firmSupply', 200, 240, {
          capacity: 0.9, openHoursStart: 480, openHoursEnd: 1200, firmId: '',
          note: 'EXAMPLE firm capacity × open (VERIFY hours)'
        }),
        N('dem', 'econ.clientDemand', 380, 240, {
          demand: 0.35, clients: 1,
          note: 'EXAMPLE demand prior'
        }),
        N('netn', 'econ.benefitNet', 520, 140, {
          emitMin: 0.55,
          note: 'net=benefit*supply/(1+demand)/(1+friction)*(1-conflict)'
        }),
        N('jxm', 'jfactor.xMax', 40, 420, { fallback: xMax, metric: 'friction' }),
        N('jym', 'jfactor.yMax', 40, 480, { fallback: yMax, metric: 'net' }),
        N('sio', 'score.ideal_over_ymax', 720, 140, {}),
        N('vc', 'view.curve', 420, 360, curveParams),
        N('vs', 'view.sample', 720, 240, { xMax: xMax, note: 'wired idealY = benefitNet · EXAMPLE factorCosts' }),
        N('bem', 'board.emit', 720, 340, { note: 'Emit benefit-gated idea.boardItems → Board', seedExample: true, items: [] }),
        N('score_out', 'score.out', 920, 140, {}),
        N('view_out', 'view.out', 920, 260, {})
      ];
      var edges = [
        E('cMiles', 'out', 'fc', 'miles'), E('cMin', 'out', 'fc', 'minutes'),
        E('cCap', 'out', 'sup', 'capacity'),
        E('cDem', 'out', 'dem', 'demand'),
        E('jfy', 'out', 'ben', 'a'), E('cBen', 'out', 'ben', 'b'),
        E('ben', 'out', 'netn', 'benefit'),
        E('fc', 'friction', 'netn', 'friction'),
        E('sup', 'supply', 'netn', 'supply'),
        E('dem', 'demand', 'netn', 'demand'),
        E('conf', 'conflict', 'netn', 'conflict'),
        E('netn', 'net', 'sio', 'idealY'), E('jym', 'out', 'sio', 'yMax'),
        E('sio', 'out', 'score_out', 'in'),
        E('netn', 'net', 'vs', 'y'), E('jxm', 'out', 'vs', 'xMax'),
        E('vs', 'curve', 'view_out', 'curve'),
        E('jxm', 'out', 'vc', 'xMax'), E('jym', 'out', 'vc', 'yMax')
      ];
      return normalizeGraph({ version: 1, nodes: nodes, edges: edges });
    }

    function morningCanvasRoiGraph() {
      /* y = yMax * log1p(x) / log1p(xMax); xMax=7h morning canvas; diminishing returns */
      var xMax = 7, yMax = 1;
      var pts = [];
      var den = Math.log1p(xMax);
      for (var i = 0; i <= 8; i++) {
        var xv = (xMax / 8) * i;
        pts.push({ x: xv, y: yMax * (Math.log1p(xv) / den) });
      }
      var curveParams = defaultCadCurveParams({
        math: { type: 'bezier', params: { points: pts } },
        xMax: xMax, yMax: yMax,
        xLabel: 'structured morning hours (h)', yLabel: 'canvas ROI / capacity'
      });
      var nodes = [
        N('jfx', 'jfactor.x', 40, 40, {}),
        N('jfy', 'jfactor.y', 40, 100, {}),
        N('absX', 'op.abs', 180, 40, {}),
        N('logX', 'op.log1p', 320, 40, {}),
        N('jxm', 'jfactor.xMax', 40, 200, { fallback: xMax, metric: 'hours' }),
        N('jym', 'jfactor.yMax', 40, 260, { fallback: yMax, metric: 'roi' }),
        N('logXm', 'op.log1p', 180, 200, {}),
        N('ratio', 'op.div', 460, 80, {}),
        N('ideal', 'op.mul', 600, 100, {}),
        N('sio', 'score.ideal_over_ymax', 760, 100, {}),
        N('vc', 'view.curve', 220, 340, curveParams),
        N('vs', 'view.sample', 760, 200, { xMax: xMax, note: 'wired idealY · morning canvas ROI' }),
        N('score_out', 'score.out', 960, 100, {}),
        N('view_out', 'view.out', 960, 220, {})
      ];
      var edges = [
        E('jfx', 'out', 'absX', 'a'),
        E('absX', 'out', 'logX', 'a'),
        E('jxm', 'out', 'logXm', 'a'),
        E('logX', 'out', 'ratio', 'a'), E('logXm', 'out', 'ratio', 'b'),
        E('jym', 'out', 'ideal', 'a'), E('ratio', 'out', 'ideal', 'b'),
        E('ideal', 'out', 'sio', 'idealY'), E('jym', 'out', 'sio', 'yMax'),
        E('sio', 'out', 'score_out', 'in'),
        E('ideal', 'out', 'vs', 'y'), E('jxm', 'out', 'vs', 'xMax'),
        E('vs', 'curve', 'view_out', 'curve'),
        E('jxm', 'out', 'vc', 'xMax'), E('jym', 'out', 'vc', 'yMax')
      ];
      return normalizeGraph({ version: 1, nodes: nodes, edges: edges });
    }

    function ageTickGraph() {
      var pts = [];
      for (var i = 0; i <= 6; i++) {
        var x = (12 / 6) * i;
        pts.push({ x: x, y: 0.15 / (1 + Math.max(x, 0)) });
      }
      var curveParams = defaultCadCurveParams({
        math: { type: 'bezier', params: { points: pts } },
        xMax: 12, yMax: 1, xLabel: 'age / time tick', yLabel: 'weight'
      });
      var nodes = [
        N('jfx', 'jfactor.x', 40, 40, {}),
        N('absX', 'op.abs', 180, 40, {}),
        N('c1', 'data.const', 40, 100, { value: 1, ref: '' }),
        N('add1x', 'op.add', 180, 100, {}),
        N('c015', 'data.const', 40, 160, { value: 0.15, ref: '' }),
        N('base', 'op.div', 320, 80, {}),
        N('dE', 'data.ctxField', 40, 300, { field: 'E', fallback: 10 }),
        N('dEmax', 'data.ctxField', 40, 360, { field: 'Emax', fallback: 20 }),
        N('c11', 'data.const', 320, 200, { value: 1.1, ref: '' }),
        N('c04', 'data.const', 320, 260, { value: 0.4, ref: '' }),
        N('mul04t', 'op.mul', 720, 240, {}),
        N('ageMul', 'op.sub', 860, 220, {}),
        N('mulBE', 'op.mul', 1000, 80, {}),
        N('score', 'op.mul', 1140, 100, {}),
        N('jxm', 'jfactor.xMax', 40, 440, { fallback: 12, metric: 'A' }),
        N('jym', 'jfactor.yMax', 200, 440, { fallback: 1, metric: 'happy' }),
        N('vc', 'view.curve', 360, 420, curveParams),
        N('score_out', 'score.out', 1280, 100, {}),
        N('view_out', 'view.out', 620, 440, {})
      ];
      var edges = [
        E('jfx', 'out', 'absX', 'a'),
        E('c1', 'out', 'add1x', 'a'), E('absX', 'out', 'add1x', 'b'),
        E('c015', 'out', 'base', 'a'), E('add1x', 'out', 'base', 'b'),
        E('c04', 'out', 'mul04t', 'a'),
        E('c11', 'out', 'ageMul', 'a'), E('mul04t', 'out', 'ageMul', 'b'),
        E('base', 'out', 'mulBE', 'a'),
        E('mulBE', 'out', 'score', 'a'), E('ageMul', 'out', 'score', 'b'),
        E('score', 'out', 'score_out', 'in'),
        E('jxm', 'out', 'vc', 'xMax'), E('jym', 'out', 'vc', 'yMax'),
        E('vc', 'idealY', 'view_out', 'curve')
      ];
      var tId = expandAgeT(nodes, edges, 'at', 40, 220);
      var extId = expandExternal(nodes, edges, 'atex', 'age_tick', tId, 'dE', 'dEmax', 200, 280);
      edges.push(E(tId, 'out', 'mul04t', 'b'), E(extId, 'out', 'mulBE', 'b'));
      return attachPurePlace(normalizeGraph({ version: 1, nodes: nodes, edges: edges }), 'ageTick', 'score');
    }

    function daysLikeGraph(seed) {
      var xMax = num(seed.xMax, 31);
      var yMax = num(seed.yMax, 10);
      var D = num(seed.D, 30);
      var scoreScale = num(seed.scoreScale, 10);
      var pts = [];
      for (var i = 0; i <= 8; i++) {
        var x = (xMax / 8) * i;
        pts.push({ x: x, y: yMax / (1 + x / Math.max(D, 1e-6)) });
      }
      var curveParams = defaultCadCurveParams({
        math: { type: 'bezier', params: { points: pts } },
        xMax: xMax, yMax: yMax, xLabel: seed.xLabel || 'days used', yLabel: seed.yLabel || 'weighted return'
      });
      var nodes = [
        N('jfx', 'jfactor.x', 40, 40, {}),
        N('jfy', 'jfactor.y', 40, 100, {}),
        N('dD', 'data.ctxField', 40, 160, { field: 'D', fallback: D }),
        N('cEps', 'data.const', 220, 120, { value: 1e-6, ref: '' }),
        N('addY', 'op.add', 520, 100, {}),
        N('mulW', 'op.mul', 680, 60, {}),
        N('c10', 'data.const', 520, 180, { value: scoreScale, ref: '' }),
        N('mulS', 'op.mul', 820, 100, {}),
        N('jxm', 'jfactor.xMax', 40, 260, { fallback: xMax, metric: 'days' }),
        N('jym', 'jfactor.yMax', 40, 340, { fallback: yMax, metric: seed.yMetric || 'D' }),
        N('vc', 'view.curve', 220, 280, curveParams),
        N('score_out', 'score.out', 960, 100, {}),
        N('view_out', 'view.out', 520, 300, {})
      ];
      var edges = [
        E('jfy', 'out', 'addY', 'a'), E('cEps', 'out', 'addY', 'b'),
        E('addY', 'out', 'mulW', 'a'),
        E('mulW', 'out', 'mulS', 'a'), E('c10', 'out', 'mulS', 'b'),
        E('mulS', 'out', 'score_out', 'in'),
        E('jxm', 'out', 'vc', 'xMax'), E('jym', 'out', 'vc', 'yMax'),
        E('vc', 'idealY', 'view_out', 'curve')
      ];
      var dayW = expandDaysCap(nodes, edges, 'dc', 'jfx', 'dD', 200, 40);
      edges.push(E(dayW, 'out', 'mulW', 'b'));
      return normalizeGraph({ version: 1, nodes: nodes, edges: edges });
    }

    function extUseGraph() {
      var xMax = 5, yMax = 1.5;
      var pts = [];
      for (var i = 0; i <= 8; i++) {
        var xu = (xMax / 8) * i;
        pts.push({ x: xu, y: yMax / (1 + xu / 2) });
      }
      var curveParams = defaultCadCurveParams({
        math: { type: 'bezier', params: { points: pts } },
        xMax: xMax, yMax: yMax, xLabel: 'external used', yLabel: 'return'
      });
      var nodes = [
        N('jfx', 'jfactor.x', 40, 40, {}),
        N('jfy', 'jfactor.y', 40, 100, {}),
        N('dE', 'data.ctxField', 40, 220, { field: 'E', fallback: 10 }),
        N('dEmax', 'data.ctxField', 40, 280, { field: 'Emax', fallback: 20 }),
        N('cEps', 'data.const', 200, 100, { value: 1e-6, ref: '' }),
        N('c1', 'data.const', 200, 40, { value: 1, ref: '' }),
        N('addY', 'op.add', 520, 100, {}),
        N('add1x', 'op.add', 360, 40, {}),
        N('mulE', 'op.mul', 900, 120, {}),
        N('divX', 'op.div', 1040, 80, {}),
        N('jxm', 'jfactor.xMax', 40, 360, { fallback: xMax, metric: 'E' }),
        N('jym', 'jfactor.yMax', 200, 360, { fallback: yMax, metric: 'E' }),
        N('vc', 'view.curve', 360, 340, curveParams),
        N('score_out', 'score.out', 1180, 80, {}),
        N('view_out', 'view.out', 620, 360, {})
      ];
      var edges = [
        E('jfy', 'out', 'addY', 'a'), E('cEps', 'out', 'addY', 'b'),
        E('c1', 'out', 'add1x', 'a'), E('jfx', 'out', 'add1x', 'b'),
        E('addY', 'out', 'mulE', 'a'),
        E('mulE', 'out', 'divX', 'a'), E('add1x', 'out', 'divX', 'b'),
        E('divX', 'out', 'score_out', 'in'),
        E('jxm', 'out', 'vc', 'xMax'), E('jym', 'out', 'vc', 'yMax'),
        E('vc', 'idealY', 'view_out', 'curve')
      ];
      var tId = expandAgeT(nodes, edges, 'eu', 40, 150);
      var extId = expandExternal(nodes, edges, 'euex', '', tId, 'dE', 'dEmax', 200, 180);
      edges.push(E(extId, 'out', 'mulE', 'b'));
      return normalizeGraph({ version: 1, nodes: nodes, edges: edges });
    }

    function debtPayGraph() {
      var xMax = 800, yMax = 50;
      var pts = [];
      for (var i = 0; i <= 10; i++) {
        var pay = Math.max(1e-3, (xMax / 10) * i);
        var apr = 0.18;
        var y = (1.5 + 8 * apr) * Math.sqrt(pay * 0.5 + pay * 0.25) / (1 + pay / 2000);
        pts.push({ x: pay === 1e-3 ? 0 : pay, y: Math.min(yMax, Math.max(0, y)) });
      }
      var curveParams = defaultCadCurveParams({
        math: { type: 'bezier', params: { points: pts } },
        xMax: xMax, yMax: yMax, xLabel: 'payment', yLabel: 'urgency score'
      });
      var nodes = [
        N('jfx', 'jfactor.x', 40, 40, {}),
        N('jfy', 'jfactor.y', 40, 100, {}),
        N('absX', 'op.abs', 160, 40, {}),
        N('absY', 'op.abs', 160, 100, {}),
        N('dApr', 'data.ctxField', 40, 160, { field: 'apr', fallback: 0 }),
        N('dInt', 'data.ctxField', 40, 220, { field: 'interest', fallback: 0 }),
        N('dM', 'data.ctxField', 40, 280, { field: 'M', fallback: 1 }),
        N('c0', 'data.const', 160, 160, { value: 0, ref: '' }),
        N('c05', 'data.const', 160, 200, { value: 0.5, ref: '' }),
        N('clApr', 'op.clamp', 300, 160, { hint: 'clamp(apr,0,0.5)' }),
        N('c8', 'data.const', 300, 220, { value: 8, ref: '' }),
        N('mul8', 'op.mul', 440, 180, {}),
        N('c15', 'data.const', 300, 100, { value: 1.5, ref: '' }),
        N('addU1', 'op.add', 560, 140, {}),
        N('cEps', 'data.const', 160, 260, { value: 1e-6, ref: '' }),
        N('maxPay', 'op.max', 300, 260, {}),
        N('divInt', 'op.div', 440, 260, {}),
        N('c2', 'data.const', 440, 320, { value: 2, ref: '' }),
        N('mul2', 'op.mul', 560, 280, {}),
        N('urg', 'op.add', 680, 180, {}),
        N('c025', 'data.const', 160, 320, { value: 0.25, ref: '' }),
        N('mulP25', 'op.mul', 300, 320, {}),
        N('addRel', 'op.add', 440, 360, {}),
        N('relief', 'op.sqrt', 560, 360, {}),
        N('mulUR', 'op.mul', 780, 240, {}),
        N('c1', 'data.const', 300, 400, { value: 1, ref: '' }),
        N('divPM', 'op.div', 440, 420, {}),
        N('scar', 'op.add', 560, 420, {}),
        N('score', 'op.div', 900, 280, {}),
        N('jxm', 'jfactor.xMax', 40, 480, { fallback: xMax, metric: 'cost' }),
        N('jym', 'jfactor.yMax', 200, 480, { fallback: yMax, metric: 'urgency' }),
        N('vc', 'view.curve', 400, 480, curveParams),
        N('score_out', 'score.out', 1040, 280, {}),
        N('view_out', 'view.out', 680, 500, {})
      ];
      var edges = [
        E('jfx', 'out', 'absX', 'a'), E('jfy', 'out', 'absY', 'a'),
        E('dApr', 'out', 'clApr', 'a'), E('c0', 'out', 'clApr', 'lo'), E('c05', 'out', 'clApr', 'hi'),
        E('c8', 'out', 'mul8', 'a'), E('clApr', 'out', 'mul8', 'b'),
        E('c15', 'out', 'addU1', 'a'), E('mul8', 'out', 'addU1', 'b'),
        E('absX', 'out', 'maxPay', 'a'), E('cEps', 'out', 'maxPay', 'b'),
        E('dInt', 'out', 'divInt', 'a'), E('maxPay', 'out', 'divInt', 'b'),
        E('c2', 'out', 'mul2', 'a'), E('divInt', 'out', 'mul2', 'b'),
        E('addU1', 'out', 'urg', 'a'), E('mul2', 'out', 'urg', 'b'),
        E('absX', 'out', 'mulP25', 'a'), E('c025', 'out', 'mulP25', 'b'),
        E('absY', 'out', 'addRel', 'a'), E('mulP25', 'out', 'addRel', 'b'),
        E('addRel', 'out', 'relief', 'a'),
        E('urg', 'out', 'mulUR', 'a'), E('relief', 'out', 'mulUR', 'b'),
        E('absX', 'out', 'divPM', 'a'), E('dM', 'out', 'divPM', 'b'),
        E('c1', 'out', 'scar', 'a'), E('divPM', 'out', 'scar', 'b'),
        E('mulUR', 'out', 'score', 'a'), E('scar', 'out', 'score', 'b'),
        E('score', 'out', 'score_out', 'in'),
        E('jxm', 'out', 'vc', 'xMax'), E('jym', 'out', 'vc', 'yMax'),
        E('vc', 'idealY', 'view_out', 'curve')
      ];
      return attachPurePlace(normalizeGraph({ version: 1, nodes: nodes, edges: edges }), 'debtPay', 'score');
    }

    function earnGraph() {
      var earnA = 8000 / 880;
      var earnMath = { type: 'linear', params: { a: earnA, b: 0 } };
      var curveParams = defaultCadCurveParams({
        math: earnMath, xMax: 880, yMax: 8000,
        xLabel: 'effort / month', yLabel: 'income / month'
      });
      var nodes = [
        N('jfy', 'jfactor.y', 40, 40, {}),
        N('iny', 'input.y', 180, 40, {}),
        N('spy', 'score.passthroughY', 340, 40, {}),
        N('jxm', 'jfactor.xMax', 40, 160, { fallback: 880, metric: 'hours' }),
        N('jym', 'jfactor.yMax', 40, 240, { fallback: 8000, metric: 'money' }),
        N('vc', 'view.curve', 220, 180, curveParams),
        N('score_out', 'score.out', 520, 40, {}),
        N('view_out', 'view.out', 520, 200, {})
      ];
      var edges = [
        E('jfy', 'out', 'iny', 'in'), E('iny', 'out', 'spy', 'y'), E('spy', 'out', 'score_out', 'in'),
        E('jxm', 'out', 'vc', 'xMax'), E('jym', 'out', 'vc', 'yMax'),
        E('vc', 'idealY', 'view_out', 'curve')
      ];
      return attachPurePlace(normalizeGraph({ version: 1, nodes: nodes, edges: edges }), 'earn');
    }

    function moneyToHappyGraph() {
      var mthK = 226.27416997969522 / Math.sqrt(800);
      var mthMath = { type: 'sqrt', params: { k: mthK } };
      var curveParams = defaultCadCurveParams({
        math: mthMath, xMax: 800, yMax: 226.27416997969522,
        xLabel: 'money spent / cost', yLabel: 'happy units'
      });
      var nodes = [
        N('jfx', 'jfactor.x', 20, 20, {}),
        N('jfy', 'jfactor.y', 20, 80, {}),
        N('absX', 'op.abs', 140, 20, {}),
        N('absY', 'op.abs', 140, 80, {}),
        N('cEps9', 'data.const', 140, 140, { value: 1e-9, ref: '' }),
        N('addYeps', 'op.add', 280, 80, {}),
        N('sqrtY', 'op.sqrt', 420, 80, {}),
        N('dH', 'data.ctxField', 20, 260, { field: 'H', fallback: 1 }),
        N('logH', 'op.log1p', 160, 260, {}),
        N('c002', 'data.const', 280, 260, { value: 0.02, ref: '' }),
        N('mul002', 'op.mul', 400, 260, {}),
        N('c1a', 'data.const', 280, 200, { value: 1, ref: '' }),
        N('addHterm', 'op.add', 520, 220, {}),
        N('mulHW', 'op.mul', 900, 100, {}),
        N('hGain', 'op.mul', 1040, 120, {}),
        N('dM', 'data.ctxField', 20, 320, { field: 'M', fallback: 1 }),
        N('dDisc', 'data.ctxField', 20, 380, { field: 'discountRate', fallback: 0.04 }),
        N('dE', 'data.ctxField', 20, 440, { field: 'E', fallback: 10 }),
        N('dEmax', 'data.ctxField', 160, 440, { field: 'Emax', fallback: 20 }),
        N('dD', 'data.ctxField', 20, 500, { field: 'D', fallback: 30 }),
        N('c001', 'data.const', 160, 500, { value: 0.01, ref: '' }),
        N('c05', 'data.const', 160, 540, { value: 0.5, ref: '' }),
        N('days1', 'op.mul', 300, 500, {}),
        N('days2', 'op.mul', 300, 540, {}),
        N('daysUsed', 'op.min', 440, 520, {}),
        N('cEps6', 'data.const', 1040, 200, { value: 1e-6, ref: '' }),
        N('hGainEps', 'op.add', 1180, 140, {}),
        N('ratio', 'op.div', 1600, 200, {}),
        N('mulExt', 'op.mul', 1740, 240, {}),
        N('mulDay', 'op.mul', 1880, 280, {}),
        N('c10', 'data.const', 1740, 340, { value: 10, ref: '' }),
        N('score', 'op.mul', 2020, 300, {}),
        N('jxm', 'jfactor.xMax', 20, 600, { fallback: 800, metric: 'cost' }),
        N('jym', 'jfactor.yMax', 180, 600, { fallback: 226.27416997969522, metric: 'happy' }),
        N('vc', 'view.curve', 400, 600, curveParams),
        N('score_out', 'score.out', 2160, 300, {}),
        N('view_out', 'view.out', 680, 620, {})
      ];
      var edges = [
        E('jfx', 'out', 'absX', 'a'), E('jfy', 'out', 'absY', 'a'),
        E('absY', 'out', 'addYeps', 'a'), E('cEps9', 'out', 'addYeps', 'b'),
        E('addYeps', 'out', 'sqrtY', 'a'),
        E('dH', 'out', 'logH', 'a'),
        E('c002', 'out', 'mul002', 'a'), E('logH', 'out', 'mul002', 'b'),
        E('c1a', 'out', 'addHterm', 'a'), E('mul002', 'out', 'addHterm', 'b'),
        E('sqrtY', 'out', 'mulHW', 'a'),
        E('mulHW', 'out', 'hGain', 'a'), E('addHterm', 'out', 'hGain', 'b'),
        E('absX', 'out', 'days1', 'a'), E('c001', 'out', 'days1', 'b'),
        E('dD', 'out', 'days2', 'a'), E('c05', 'out', 'days2', 'b'),
        E('days1', 'out', 'daysUsed', 'a'), E('days2', 'out', 'daysUsed', 'b'),
        E('hGain', 'out', 'hGainEps', 'a'), E('cEps6', 'out', 'hGainEps', 'b'),
        E('hGainEps', 'out', 'ratio', 'a'),
        E('ratio', 'out', 'mulExt', 'a'),
        E('mulExt', 'out', 'mulDay', 'a'),
        E('mulDay', 'out', 'score', 'a'), E('c10', 'out', 'score', 'b'),
        E('score', 'out', 'score_out', 'in'),
        E('jxm', 'out', 'vc', 'xMax'), E('jym', 'out', 'vc', 'yMax'),
        E('vc', 'idealY', 'view_out', 'curve')
      ];
      var tId = expandAgeT(nodes, edges, 'mth', 20, 180);
      var hW = expandHAgeW(nodes, edges, 'mthh', tId, 160, 180);
      edges.push(E(hW, 'out', 'mulHW', 'b'));
      var mCost = expandMoneyDisutil(nodes, edges, 'mthm', 'absX', 'dM', tId, 'dDisc', 200, 320);
      edges.push(E(mCost, 'out', 'ratio', 'b'));
      var extId = expandExternal(nodes, edges, 'mthex', '', tId, 'dE', 'dEmax', 320, 420);
      edges.push(E(extId, 'out', 'mulExt', 'b'));
      var dayW = expandDaysCap(nodes, edges, 'mthd', 'daysUsed', 'dD', 560, 500);
      edges.push(E(dayW, 'out', 'mulDay', 'b'));
      return attachPurePlace(normalizeGraph({ version: 1, nodes: nodes, edges: edges }), 'moneyToHappy');
    }

    var earnA = 8000 / 880;
    var earnMath = { type: 'linear', params: { a: earnA, b: 0 } };
    var mthK = 226.27416997969522 / Math.sqrt(800);
    var mthMath = { type: 'sqrt', params: { k: mthK } };

    var map = {
      earn: {
        label: 'Earn (effort → income)',
        note: 'Seed from builtin · saved Blueprint overrides. score.passthroughY · pure place (hours×22 → x, firstPos amount/y/ideal → y)',
        math: earnMath, xMax: 880, yMax: 8000,
        xLabel: 'effort / month', yLabel: 'income / month', scoreMode: 'ideal_over_ymax',
        script: attachWiredIdealYView(earnGraph(), 'earn')
      },
      moneyToHappy: {
        label: 'Money → Happy',
        note: 'Seed from builtin · saved Blueprint overrides. Raw: √y·hW·(1+0.02log1p H)/moneyDisutil·ext·dayW·10',
        math: mthMath, xMax: 800, yMax: 226.27416997969522,
        xLabel: 'money spent / cost', yLabel: 'happy units', scoreMode: 'y_over_ideal',
        script: attachWiredIdealYView(moneyToHappyGraph(), 'moneyToHappy')
      },
      daysUse: {
        label: 'Days used → return',
        note: 'Seed from builtin · saved Blueprint overrides. (y+ε)·(1/(1+days/D))·10',
        math: { type: 'bezier', params: { points: [
          { x: 0, y: 10 }, { x: 7.75, y: 10 / (1 + 7.75 / 30) },
          { x: 15.5, y: 10 / (1 + 15.5 / 30) }, { x: 31, y: 10 / (1 + 31 / 30) }
        ] } },
        xMax: 31, yMax: 10, xLabel: 'days used', yLabel: 'weighted return', scoreMode: 'ideal_over_ymax',
        script: attachWiredIdealYView(attachPurePlace(daysLikeGraph({ xMax: 31, yMax: 10, D: 30, xLabel: 'days used', yLabel: 'weighted return' }), 'daysUse'), 'daysUse')
      },
      ageTick: {
        label: 'Age tick → weight',
        note: 'Seed from builtin · saved Blueprint overrides. 0.15/(1+|x|) · ext(age_tick) · (1.1-0.4·t) raw ops',
        math: { type: 'bezier', params: { points: [
          { x: 0, y: 0.15 }, { x: 2, y: 0.15 / 3 }, { x: 6, y: 0.15 / 7 }, { x: 12, y: 0.15 / 13 }
        ] } },
        xMax: 12, yMax: 1, xLabel: 'age / time tick', yLabel: 'weight', scoreMode: 'ideal_over_ymax',
        script: attachWiredIdealYView(ageTickGraph(), 'ageTick')
      },
      extUse: {
        label: 'External used → return',
        note: 'Seed from builtin · saved Blueprint overrides. (y+ε)·ext/(1+x) raw',
        math: { type: 'bezier', params: { points: [
          { x: 0, y: 1.5 }, { x: 1.25, y: 1.5 / (1 + 1.25 / 2) },
          { x: 2.5, y: 1.5 / (1 + 2.5 / 2) }, { x: 5, y: 1.5 / (1 + 5 / 2) }
        ] } },
        xMax: 5, yMax: 1.5, xLabel: 'external used', yLabel: 'return', scoreMode: 'ideal_over_ymax',
        script: attachWiredIdealYView(attachPurePlace(extUseGraph(), 'extUse'), 'extUse')
      },
      debtPay: {
        label: 'Debt pay → urgency',
        note: 'Seed from builtin · saved Blueprint overrides. (urg·√(y+0.25x))/(1+x/M) raw clamp/ops',
        math: { type: 'sqrt', params: { k: 50 / Math.sqrt(800) } },
        xMax: 800, yMax: 50, xLabel: 'payment', yLabel: 'urgency score', scoreMode: 'ideal_over_ymax',
        script: attachWiredIdealYView(debtPayGraph(), 'debtPay')
      },
      morningCanvasRoi: {
        label: 'Morning canvas ROI',
        note: 'Structured morning hours 08–15 → canvas capacity with log1p diminishing returns. 3–4h strong; packing all 7 not much better.',
        math: { type: 'bezier', params: { points: (function(){
          var pts=[], xm=7, ym=1, d=Math.log1p(xm);
          for(var i=0;i<=8;i++){ var x=(xm/8)*i; pts.push({x:x,y:ym*Math.log1p(x)/d}); }
          return pts;
        })() } },
        xMax: 7, yMax: 1,
        xLabel: 'structured morning hours (h)', yLabel: 'canvas ROI / capacity',
        scoreMode: 'ideal_over_ymax',
        idea: {
          name: 'Morning canvas ROI',
          mechanism: 'Pre-work window ~08:00–15:00 America/Chicago (7h open canvas before work 15:00–23:00). '
            + 'Input x = structured hours placed in the morning canvas (deep work / high-leverage), 0…7. '
            + 'Ideal y = yMax · log1p(x) / log1p(xMax) with xMax=7 — diminishing returns so 3–4h is strong; packing all 7 is not much better. '
            + 'v1 single curve (optional fragmentation penalty later). view.sample wires the same idealY(x); score = idealY/yMax.',
          inputs: 'structured morning hours (deep work / high-leverage), 0…7h',
          outputs: 'canvas ROI / capacity (diminishing returns)',
          assumptions: 'Single continuous block quality ignored in v1; work starts 15:00; canvas open 08–15 America/Chicago'
        },
        script: attachPurePlace(morningCanvasRoiGraph(), 'morningCanvasRoi')
      },
      localWeekend: {
        label: 'Local weekend ([REDACTED-CITY] / [REDACTED-LOCATION])',
        note: 'EXAMPLE/seeded weekend options near [REDACTED-LOCATION] ([REDACTED-LOCATION]). Score = joy net after factor-weighted gas/time/days friction; Emit → Board acts with suggestMust.',
        math: { type: 'bezier', params: { points: (function(){
          var pts=[], xm=5, ym=1;
          for(var i=0;i<=8;i++){ var x=(xm/8)*i; pts.push({x:x,y:ym*(0.8/(1+x))}); }
          return pts;
        })() } },
        xMax: 5, yMax: 1,
        xLabel: 'friction (factor-weighted gas+time+days; 0…5 EXAMPLE)', yLabel: 'weekend net joy / fit',
        scoreMode: 'ideal_over_ymax',
        idea: {
          name: 'Local weekend ([REDACTED-CITY] / [REDACTED-LOCATION])',
          mechanism: 'Score local weekend options near [REDACTED-LOCATION] / [REDACTED-CITY] ([REDACTED-LOCATION]). '
            + 'Friction is factor-weighted gas + time + days (econ.factorCosts; WB.factorOrder M/T/D harmonic) — not opaque distance alone. '
            + 'net = benefit × supply / (1+demand) / (1+friction) × (1−conflict). EXAMPLE gas/mpg/price priors — VERIFY. '
            + 'boardItems are EXAMPLE/seeded venues; boardItemsSource can later swap in live news/listings.',
          inputs: 'EXAMPLE miles/mpg/gas, minutes, service $, daysUse; joy benefitPrior',
          outputs: 'weekend net joy / fit (0…1)',
          assumptions: 'Static seed venues until news ingest; America/Chicago; [REDACTED-LOCATION] work week ends Fri night',
          boardItemsSource: { type: 'static', region: 'redacted_city-tx', near: '[REDACTED-LOCATION]', tz: 'America/Chicago' },
          boardItems: [{"id": "act_lw_frontier_texas", "name": "Frontier Texas! (Sat)", "kind": "schedule", "cadence": "selected", "startMin": 600, "endMin": 720, "hours": [10, 11], "allDay": false, "note": "EXAMPLE/seeded \u00b7 [REDACTED-CITY] history museum \u00b7 ~15\u201325 min from [REDACTED-LOCATION] ([REDACTED-LOCATION]). Swap when live events ingest lands.", "suggestMust": false, "__seedExample": true, "section": "LEISURE/HOBBIES/ENTERTAINMENT TOTAL", "preferDays": [6], "preferCadence": "weekly", "selectedKeys": [], "placeOnCalendar": false}, {"id": "act_lw_redacted_city_zoo", "name": "[REDACTED-CITY] Zoo (Sat afternoon)", "kind": "schedule", "cadence": "selected", "startMin": 780, "endMin": 900, "hours": [13, 14], "allDay": false, "note": "EXAMPLE/seeded \u00b7 Nelson Park \u00b7 easy local weekend block near [REDACTED-LOCATION].", "suggestMust": false, "__seedExample": true, "section": "LEISURE/HOBBIES/ENTERTAINMENT TOTAL", "preferDays": [6], "preferCadence": "weekly", "selectedKeys": [], "placeOnCalendar": false}, {"id": "act_lw_buffalo_gap", "name": "Buffalo Gap Historic Village (Sun)", "kind": "schedule", "cadence": "selected", "startMin": 660, "endMin": 840, "hours": [11, 12, 13], "allDay": false, "note": "EXAMPLE/seeded \u00b7 ~20 min south of [REDACTED-CITY] \u00b7 novelty + low cost.", "suggestMust": false, "__seedExample": true, "section": "LEISURE/HOBBIES/ENTERTAINMENT TOTAL", "preferDays": [0], "preferCadence": "weekly", "selectedKeys": [], "placeOnCalendar": false}, {"id": "act_lw_fort_phantom", "name": "Lake Fort Phantom (Sun evening)", "kind": "schedule", "cadence": "selected", "startMin": 1020, "endMin": 1140, "hours": [17, 18], "allDay": false, "note": "EXAMPLE/seeded \u00b7 north [REDACTED-CITY] lake \u00b7 sunset / unwind before work week.", "suggestMust": false, "__seedExample": true, "section": "LEISURE/HOBBIES/ENTERTAINMENT TOTAL", "preferDays": [0], "preferCadence": "weekly", "selectedKeys": [], "placeOnCalendar": false}, {"id": "act_lw_downtown_sayles", "name": "Downtown [REDACTED-CITY] stroll (Sat eve)", "kind": "schedule", "cadence": "selected", "startMin": 1080, "endMin": 1200, "hours": [18, 19], "allDay": false, "note": "EXAMPLE/seeded \u00b7 Sayles Blvd / downtown \u00b7 food + low-friction social. News ingest can replace with live listings later.", "suggestMust": false, "__seedExample": true, "section": "FOOD TOTAL", "preferDays": [6], "preferCadence": "weekly", "selectedKeys": [], "placeOnCalendar": false}]
        },
        script: attachPurePlace(localWeekendGraph(), 'localWeekend')
      },
      localEconomy: {
        label: 'Local economy ([REDACTED-CITY] / [REDACTED-LOCATION])',
        note: 'EXAMPLE/seeded firms+services near [REDACTED-LOCATION] ([REDACTED-LOCATION]). Multi-firm emit from economy.firms with per-service simNet gate (emitMin).',
        math: { type: 'bezier', params: { points: (function(){
          var pts=[], xm=5, ym=1;
          for(var i=0;i<=8;i++){ var x=(xm/8)*i; pts.push({x:x,y:ym*(0.85/(1+x))*0.9}); }
          return pts;
        })() } },
        xMax: 5, yMax: 1,
        xLabel: 'friction (factor-weighted gas+time+days; 0…5 EXAMPLE)', yLabel: 'net benefit (0…1)',
        scoreMode: 'ideal_over_ymax',
        idea: {
          name: 'Local economy ([REDACTED-CITY] / [REDACTED-LOCATION])',
          mechanism: 'MODEL = firms + people + schedules + client hosting in the [REDACTED-CITY] / [REDACTED-LOCATION] area. '
            + 'Multi-firm Board emit from economy.firms[].services with per-service simNet gate (primary). '
            + 'simNet = benefit × supply / (1+demand) / (1+friction) × (1−conflict) — same honesty as econ.benefitNet; '
            + 'friction = factor-weighted gas+time+days (econ.factorCosts / factorWeightedFriction; WB.factorOrder M/T/D) — EXAMPLE gas/mpg/price VERIFY; '
            + 'conflict vs [REDACTED-SCHEDULE] America/Chicago. '
            + 'Blueprint econ.* nodes remain for in-graph probe; static boardItems = fallback only; '
            + 'ingestLocalEconomy is a stub (no live listings yet) — paste/import firms JSON to replace EXAMPLE priors.',
          inputs: 'EXAMPLE miles/mpg/gas, minutes, service/parking $, daysUse, capacity, demand, benefitPrior; act window for open/conflict when present',
          outputs: 'net benefit (0…1); emitOk',
          assumptions: 'Static EXAMPLE priors only; America/Chicago; verify hours/prices locally; no live economy ingest in v1',
          emitMin: 0.55,
          boardItemsSource: { type: 'economy.firms', region: 'redacted_city-tx', near: '[REDACTED-LOCATION]', honesty: 'EXAMPLE priors — verify hours/prices; not live ingest', fallback: 'boardItems', ingest: 'stub', next: 'connect listings/hours API or paste firms JSON' },
          economy: {
            region: 'redacted_city-tx',
            near: '[REDACTED-LOCATION]',
            tz: 'America/Chicago',
            note: 'EXAMPLE/seeded priors — verify hours/prices; not live ingest',
            firms: [{"id": "firm_heb_redacted_city", "name": "[REDACTED-MERCHANT] ([REDACTED-CITY] area)", "category": "grocery", "placeType": "supermarket", "__seedExample": true, "note": "EXAMPLE/seeded · well-known grocery near [REDACTED-CITY] / [REDACTED-LOCATION] corridor — VERIFY store hours & prices (not live ingest).", "people": [{"role": "front-end / stock associate (approx)", "scheduleNote": "EXAMPLE/seeded · typical retail day shifts — VERIFY"}], "services": [{"id": "svc_heb_grocery_run", "name": "Grocery run ([REDACTED-MERCHANT] [REDACTED-CITY] area)", "benefitPrior": 0.85, "benefitWhy": "EXAMPLE/seeded · high food/staples benefit; routine household need near [REDACTED-LOCATION] · trip≈12min/$3 EXAMPLE/VERIFY · miles/mpg/gas EXAMPLE/VERIFY", "section": "FOOD TOTAL", "preferDays": [6], "preferCadence": "weekly", "startMin": 600, "endMin": 720, "hours": [10, 11], "demand": 0.12, "minutesOneWay": 12, "costUsd": 3, "milesOneWay": 12, "mpg": 22, "gasUsdPerGal": 3.2, "daysUse": 0.12}], "capacity": 0.98}, {"id": "firm_auto_quick_redacted_city", "name": "Local quick-lube / auto shop ([REDACTED-CITY] area)", "category": "auto", "placeType": "oil_change", "__seedExample": true, "note": "EXAMPLE/seeded · generic quick auto / oil-change place-type near [REDACTED-CITY] — VERIFY shop name, hours, and prices (not a specific boutique brand).", "people": [{"role": "lube tech (approx)", "scheduleNote": "EXAMPLE/seeded · typical weekday daytime bay hours — VERIFY"}], "services": [{"id": "svc_auto_oil_change", "name": "Oil change / quick auto (VERIFY shop)", "benefitPrior": 0.62, "benefitWhy": "EXAMPLE/seeded · medium benefit when vehicle maintenance is due; friction = trip + wait + $ · trip≈20min/$45 EXAMPLE/VERIFY · miles/mpg/gas EXAMPLE/VERIFY", "section": "TRANSPORTATION TOTAL", "preferDays": [2, 4], "preferCadence": "monthly", "startMin": 540, "endMin": 660, "hours": [9, 10], "demand": 0.38, "minutesOneWay": 20, "costUsd": 45, "milesOneWay": 20, "mpg": 22, "gasUsdPerGal": 3.2, "daysUse": 0.2}], "capacity": 0.72}, {"id": "firm_redacted_city_public_library", "name": "[REDACTED-CITY] Public Library", "category": "library", "placeType": "public_library", "__seedExample": true, "note": "EXAMPLE/seeded · [REDACTED-CITY] Public Library — VERIFY branch hours & holds; free/low-cost errand.", "people": [{"role": "librarian / desk staff (approx)", "scheduleNote": "EXAMPLE/seeded · typical public-library daytime hours — VERIFY"}], "services": [{"id": "svc_apl_errand", "name": "[REDACTED-CITY] Public Library errand", "benefitPrior": 0.78, "benefitWhy": "EXAMPLE/seeded · high benefit if free/low friction (holds, wifi, quiet); VERIFY hours · trip≈10min/$1 EXAMPLE/VERIFY · miles/mpg/gas EXAMPLE/VERIFY", "section": "LEISURE/HOBBIES/ENTERTAINMENT TOTAL", "preferDays": [3, 6], "preferCadence": "weekly", "startMin": 660, "endMin": 780, "hours": [11, 12], "demand": 0.1, "minutesOneWay": 10, "costUsd": 1, "milesOneWay": 10, "mpg": 22, "gasUsdPerGal": 3.2, "daysUse": 0.1}], "capacity": 0.95}, {"id": "firm_quick_bite_redacted_location", "name": "Quick bite near [REDACTED-LOCATION] / [REDACTED-CITY]", "category": "food", "placeType": "fast_casual", "__seedExample": true, "note": "EXAMPLE/seeded · generic quick-bite place-type near [REDACTED-LOCATION] / [REDACTED-CITY] — VERIFY hours & prices; not a boutique brand.", "people": [{"role": "counter / kitchen staff (approx)", "scheduleNote": "EXAMPLE/seeded · typical lunch/dinner service windows — VERIFY"}], "services": [{"id": "svc_quick_bite", "name": "Quick bite near [REDACTED-LOCATION] / [REDACTED-CITY]", "benefitPrior": 0.48, "benefitWhy": "EXAMPLE/seeded · medium/low prior — convenience food; may fail emitMin gate unless hunger/time pressure raises benefit · trip≈8min/$12 EXAMPLE/VERIFY · miles/mpg/gas EXAMPLE/VERIFY", "section": "FOOD TOTAL", "preferDays": [1, 2, 3, 4, 5], "preferCadence": "weekly", "startMin": 720, "endMin": 780, "hours": [12], "demand": 0.45, "minutesOneWay": 8, "costUsd": 12, "milesOneWay": 8, "mpg": 22, "gasUsdPerGal": 3.2, "daysUse": 0.08}], "capacity": 0.88}, {"id": "firm_far_outing_redacted_city", "name": "Far weekend outing ([REDACTED-CITY] area EXAMPLE)", "category": "leisure", "placeType": "day_trip", "__seedExample": true, "note": "EXAMPLE/seeded · far outing proxy (~45 mi one-way) — VERIFY destination/hours; not live ingest.", "people": [{"role": "venue staff (approx)", "scheduleNote": "EXAMPLE/seeded · typical weekend daytime — VERIFY"}], "services": [{"id": "svc_far_day_trip", "name": "Far day trip / outing (EXAMPLE)", "benefitPrior": 0.7, "benefitWhy": "EXAMPLE/seeded · higher novelty but burns gas/time/days · miles≈45 / mpg22 / gas$3.2 EXAMPLE/VERIFY", "section": "LEISURE/HOBBIES/ENTERTAINMENT TOTAL", "preferDays": [6, 0], "preferCadence": "weekly", "startMin": 600, "endMin": 960, "hours": [10, 11, 12, 13, 14, 15], "demand": 0.25, "minutesOneWay": 50, "costUsd": 15, "milesOneWay": 45, "mpg": 22, "gasUsdPerGal": 3.2, "daysUse": 0.4, "skipEmit": true}], "capacity": 0.85}]
          },
          boardItems: [{"id": "act_le_heb_grocery_run", "name": "Grocery run ([REDACTED-MERCHANT] [REDACTED-CITY] area)", "kind": "schedule", "cadence": "selected", "startMin": 600, "endMin": 720, "hours": [10, 11], "allDay": false, "note": "EXAMPLE/seeded · high food/staples benefit; routine household need near [REDACTED-LOCATION] · firm=[REDACTED-MERCHANT] ([REDACTED-CITY] area)", "suggestMust": false, "__seedExample": true, "section": "FOOD TOTAL", "preferDays": [6], "preferCadence": "weekly", "selectedKeys": [], "placeOnCalendar": false, "benefitPrior": 0.85, "frictionIndex": 0.26, "benefitWhy": "EXAMPLE/seeded · high food/staples benefit; routine household need near [REDACTED-LOCATION]", "firmId": "firm_heb_redacted_city"}, {"id": "act_le_auto_oil_change", "name": "Oil change / quick auto (VERIFY shop)", "kind": "schedule", "cadence": "selected", "startMin": 540, "endMin": 660, "hours": [9, 10], "allDay": false, "note": "EXAMPLE/seeded · medium benefit when vehicle maintenance is due; friction = trip + wait + $ · firm=Local quick-lube / auto shop ([REDACTED-CITY] area)", "suggestMust": false, "__seedExample": true, "section": "TRANSPORTATION TOTAL", "preferDays": [2, 4], "preferCadence": "monthly", "selectedKeys": [], "placeOnCalendar": false, "benefitPrior": 0.62, "frictionIndex": 1.233, "benefitWhy": "EXAMPLE/seeded · medium benefit when vehicle maintenance is due; friction = trip + wait + $", "firmId": "firm_auto_quick_redacted_city"}, {"id": "act_le_apl_errand", "name": "[REDACTED-CITY] Public Library errand", "kind": "schedule", "cadence": "selected", "startMin": 660, "endMin": 780, "hours": [11, 12], "allDay": false, "note": "EXAMPLE/seeded · high benefit if free/low friction (holds, wifi, quiet); VERIFY hours · firm=[REDACTED-CITY] Public Library", "suggestMust": false, "__seedExample": true, "section": "LEISURE/HOBBIES/ENTERTAINMENT TOTAL", "preferDays": [3, 6], "preferCadence": "weekly", "selectedKeys": [], "placeOnCalendar": false, "benefitPrior": 0.78, "frictionIndex": 0.187, "benefitWhy": "EXAMPLE/seeded · high benefit if free/low friction (holds, wifi, quiet); VERIFY hours", "firmId": "firm_redacted_city_public_library"}]
        },
        script: attachPurePlace(localEconomyGraph(), 'localEconomy')
      }
    };
    return map;
  }

  /**
   * Cheap pin probe for Blueprint UI live values.
   * Evaluates source nodes + score/place sinks for a sample ctx.
   */
  function probePins(graph, ctx) {
    ctx = ctx || {};
    var g = normalizeGraph(graph);
    var values = Object.create(null);
    var c = {
      x: Math.max(0, num(ctx.x, 0)),
      y: Math.max(0, num(ctx.y, 0)),
      xMax: num(ctx.xMax, 0) > 0 ? num(ctx.xMax, 100) : 100,
      yMax: num(ctx.yMax, 0) > 0 ? num(ctx.yMax, 1) : 1,
      idealY: Math.max(0, num(ctx.idealY, 0)),
      act: (ctx.act && typeof ctx.act === 'object') ? ctx.act : {},
      wb: ctx.wb || null,
      D: ctx.D != null ? ctx.D : 30,
      Dmax: ctx.Dmax != null ? ctx.Dmax : 31,
      E: ctx.E != null ? ctx.E : 10,
      Emax: ctx.Emax != null ? ctx.Emax : 20,
      name: ctx.name || 'probe',
      _simScore: ctx._simScore,
      _lastSim: ctx._lastSim
    };
    function set(nid, port, v) {
      if (!isFinite(v)) v = 0;
      values[nid + '#' + port] = v;
    }
    g.nodes.forEach(function (n) {
      if (!n || !NODE_META[n.type]) return;
      try {
        if (n.type === 'jfactor.x') set(n.id, 'out', resolveJfactorX(c));
        else if (n.type === 'jfactor.y') set(n.id, 'out', resolveJfactorY(c));
        else if (n.type === 'jfactor.xMax') set(n.id, 'out', resolveJfactorDomain('xMax', c, n.params));
        else if (n.type === 'jfactor.yMax') set(n.id, 'out', resolveJfactorDomain('yMax', c, n.params));
        else if (n.type === 'jfactor.jgroup') set(n.id, 'out', resolveJfactorJgroup((n.params && n.params.field) || 'score', c, n.params));
        else if (n.type === 'jfactor.call') {
          set(n.id, 'out', evalJoyFactorCall((n.params && n.params.fn) || 'scoreMoneyToHappy', c, resolveJfactorX(c), resolveJfactorY(c), null));
        } else if (n.type === 'jfactor.browse') {
          set(n.id, 'out', evalJoyFactorCall((n.params && (n.params.key || n.params.fn)) || 'scoreMoneyToHappy', c, resolveJfactorX(c), resolveJfactorY(c), null));
        } else if (n.type === 'jfactor.moneyToHappy') {
          set(n.id, 'out', evalJoyFactorCall('scoreMoneyToHappy', c, resolveJfactorX(c), resolveJfactorY(c), null));
        } else if (n.type === 'jfactor.daysCapacity') {
          set(n.id, 'out', evalJoyFactorCall('daysCapacityWeight', c, resolveJfactorX(c), null, { D: c.D }));
        } else if (n.type === 'jfactor.ageTick') {
          set(n.id, 'out', evalJoyFactorCall('scoreAgeTick', c, resolveJfactorX(c), -0.01, null));
        } else if (n.type === 'jfactor.debtPay') {
          set(n.id, 'out', evalJoyFactorCall('scoreDebtPay', c, resolveJfactorX(c), resolveJfactorY(c), null));
        } else if (n.type === 'jfactor.external') {
          set(n.id, 'out', evalJoyFactorCall('externalFactor', c, null, null, null));
        } else if (n.type === 'data.ctxField') {
          set(n.id, 'out', resolveCtxField((n.params && n.params.field) || 'E', c, n.params));
        } else if (String(n.type).indexOf('mech.') === 0) {
          set(n.id, 'out', evalMechNode(n.type, n.params, {}, c));
        } else if (isConstType(n.type)) {
          set(n.id, 'out', n.params && n.params.ref ? num(c[n.params.ref], 0) : num(n.params && n.params.value, 0));
        } else if (n.type === 'view.curve') {
          var cp = defaultCadCurveParams(n.params);
          var ix = idealYFromCadMath(cp.math, c.x);
          set(n.id, 'idealY', ix);
          set(n.id, 'xMax', cp.xMax > 0 ? cp.xMax : c.xMax);
          set(n.id, 'yMax', cp.yMax > 0 ? cp.yMax : c.yMax);
          set(n.id, 'scoreFromCurve', c.yMax > 0 ? ix / c.yMax : 0);
        } else if (n.type === 'view.sample') {
          /* live y filled after compile below when possible */
          set(n.id, 'xMax', num(n.params && n.params.xMax, c.xMax));
        } else if (n.type === 'place.fromAct') {
          var pl0 = resolvePlaceFromAct((n.params && n.params.kind) || 'generic', c.act, c);
          set(n.id, 'x', num(pl0.x, 0));
          set(n.id, 'y', num(pl0.y, 0));
        } else if (String(n.type).indexOf('econ.') === 0) {
          var eresP = evalEconNode(n.type, n.params, {}, c);
          if (eresP && typeof eresP === 'object') {
            Object.keys(eresP).forEach(function (pk) { set(n.id, pk, num(eresP[pk], 0)); });
          } else {
            set(n.id, 'out', num(eresP, 0));
          }
        } else if (n.type === 'sim.step') {
          var ss = (c._simScore != null) ? num(c._simScore, 0) : Math.abs(num(c.y, 0));
          set(n.id, 'score', ss);
          set(n.id, 'ok', 1);
        }
      } catch (_pe) {}
    });
    var compiled = null;
    try { compiled = compile(g); } catch (_c) { compiled = null; }
    var score = null;
    var place = null;
    if (compiled && compiled.ok && compiled.scoreFn) {
      try {
        score = compiled.scoreFn(c);
        var sink = findSink(g);
        if (sink) set(sink.id, 'in', score);
      } catch (_s) {}
    }
    if (compiled && compiled.ok && compiled.placeFn) {
      try {
        place = compiled.placeFn(c.act, c);
        var pout = findPlaceOut(g);
        if (pout && place) {
          set(pout.id, 'x', num(place.x, 0));
          set(pout.id, 'y', num(place.y, 0));
        }
      } catch (_p) {}
    }
    return { ok: !!(compiled && compiled.ok), values: values, score: score, place: place, ctx: c, view: compiled && compiled.view };
  }

  /* ---- easy175: optional packs + subgraphs / auto-layout ---- */
  var PACK_SINK_TYPES = { 'score.out': 1, 'view.out': 1, 'place.out': 1, 'viz.out': 1 };

  /** True if graph has non-sink authored nodes (emptyGraph sinks alone are not SoT). */
  function scriptHasAuthoredNodes(script) {
    if (!script || typeof script !== 'object') return false;
    if (!Array.isArray(script.nodes) || !script.nodes.length) return false;
    return script.nodes.some(function (n) {
      return n && n.type && !PACK_SINK_TYPES[n.type];
    });
  }

  function buildBuiltinPack() {
    var graphs = exampleBlueprints();
    return {
      id: 'builtins',
      label: 'Builtin jmethod seeds',
      version: 1,
      note: 'Optional library — saved Blueprints are SoT. Includes morningCanvasRoi + localWeekend + localEconomy. Board emit via idea.boardItems.',
      ids: Object.keys(graphs),
      graphs: graphs
    };
  }

  var _packCache = Object.create(null);

  function listPacks() {
    return [
      { id: 'builtins', label: 'Builtin jmethod seeds', version: 1, builtin: true }
    ];
  }

  function getPack(id) {
    id = String(id || '');
    if (!id) return null;
    if (id === 'builtins') {
      if (!_packCache.builtins) _packCache.builtins = buildBuiltinPack();
      return _packCache.builtins;
    }
    return _packCache[id] || null;
  }

  function registerPack(pack) {
    if (!pack || !pack.id) return false;
    _packCache[String(pack.id)] = pack;
    return true;
  }

  function packGraph(packId, graphId) {
    var pack = getPack(packId);
    if (!pack || !pack.graphs) return null;
    return pack.graphs[graphId] || null;
  }

  function ensureGraphGroups(graph) {
    var g = normalizeGraph(graph);
    if (!Array.isArray(g.groups)) g.groups = [];
    return g;
  }

  /**
   * Group selected nodes into a collapse frame (visual + nest in script JSON).
   * Keeps score.out / view.out / place.out outside groups.
   */
  function groupNodes(graph, nodeIds, label) {
    var g = ensureGraphGroups(graph);
    var ids = (nodeIds || []).map(String).filter(Boolean);
    ids = ids.filter(function (id) {
      var n = nodeById(g, id);
      if (!n) return false;
      if (n.type === 'score.out' || n.type === 'view.out' || n.type === 'place.out') return false;
      return true;
    });
    if (ids.length < 1) return g;
    var xs = [], ys = [];
    ids.forEach(function (id) {
      var n = nodeById(g, id);
      if (!n) return;
      xs.push(Number(n.x) || 0);
      ys.push(Number(n.y) || 0);
    });
    var minX = Math.min.apply(null, xs), minY = Math.min.apply(null, ys);
    var maxX = Math.max.apply(null, xs), maxY = Math.max.apply(null, ys);
    var gid = newId('grp');
    g.groups.push({
      id: gid,
      label: label != null && String(label) ? String(label) : ('Group ' + (g.groups.length + 1)),
      nodeIds: ids.slice(),
      collapsed: false,
      x: minX - 16,
      y: minY - 28,
      w: Math.max(140, (maxX - minX) + 160),
      h: Math.max(80, (maxY - minY) + 100)
    });
    return g;
  }

  function setGroupCollapsed(graph, groupId, collapsed) {
    var g = ensureGraphGroups(graph);
    var id = String(groupId || '');
    g.groups.forEach(function (gr) {
      if (gr && gr.id === id) gr.collapsed = !!collapsed;
    });
    return g;
  }

  function toggleGroupCollapsed(graph, groupId) {
    var g = ensureGraphGroups(graph);
    var id = String(groupId || '');
    g.groups.forEach(function (gr) {
      if (gr && gr.id === id) gr.collapsed = !gr.collapsed;
    });
    return g;
  }

  function ungroup(graph, groupId) {
    var g = ensureGraphGroups(graph);
    var id = String(groupId || '');
    g.groups = (g.groups || []).filter(function (gr) { return !gr || gr.id !== id; });
    return g;
  }

  function setGroupLabel(graph, groupId, label) {
    var g = ensureGraphGroups(graph);
    var id = String(groupId || '');
    g.groups.forEach(function (gr) {
      if (gr && gr.id === id) gr.label = String(label != null ? label : gr.label || 'Group');
    });
    return g;
  }

  function nodeInCollapsedGroup(graph, nodeId) {
    var g = graph || emptyGraph();
    var id = String(nodeId || '');
    var groups = g.groups || [];
    for (var i = 0; i < groups.length; i++) {
      var gr = groups[i];
      if (!gr || !gr.collapsed) continue;
      if ((gr.nodeIds || []).indexOf(id) >= 0) return gr;
    }
    return null;
  }

  /**
   * Lightweight auto-layout: layered (topo) when edges exist, else grid.
   * If nodeIds provided, layout only that selection; else whole graph.
   */
  function autoLayout(graph, nodeIds, opts) {
    opts = opts || {};
    var g = normalizeGraph(graph);
    var all = g.nodes || [];
    var idset = null;
    if (nodeIds && nodeIds.length) {
      idset = Object.create(null);
      nodeIds.forEach(function (id) { idset[String(id)] = true; });
    }
    var nodes = all.filter(function (n) {
      if (!n) return false;
      if (idset && !idset[n.id]) return false;
      return true;
    });
    if (!nodes.length) return g;

    var indeg = Object.create(null);
    var outs = Object.create(null);
    nodes.forEach(function (n) { indeg[n.id] = 0; outs[n.id] = []; });
    (g.edges || []).forEach(function (e) {
      if (!e || !(e.from in indeg) || !(e.to in indeg)) return;
      indeg[e.to] = (indeg[e.to] || 0) + 1;
      outs[e.from].push(e.to);
    });

    var layers = [];
    var remaining = Object.create(null);
    nodes.forEach(function (n) { remaining[n.id] = true; });
    var guard = 0;
    while (Object.keys(remaining).length && guard++ < 500) {
      var layer = [];
      Object.keys(remaining).forEach(function (id) {
        if ((indeg[id] || 0) === 0) layer.push(id);
      });
      if (!layer.length) layer = Object.keys(remaining);
      layers.push(layer);
      layer.forEach(function (id) {
        delete remaining[id];
        (outs[id] || []).forEach(function (to) {
          if (remaining[to]) indeg[to] = Math.max(0, (indeg[to] || 1) - 1);
        });
      });
    }

    var originX = opts.originX != null ? Number(opts.originX) : 40;
    var originY = opts.originY != null ? Number(opts.originY) : 40;
    var colW = opts.colW != null ? Number(opts.colW) : 180;
    var rowH = opts.rowH != null ? Number(opts.rowH) : 70;
    var mode = opts.mode === 'grid' ? 'grid' : 'layered';

    if (mode === 'grid' || layers.length <= 1) {
      var cols = Math.max(1, Math.ceil(Math.sqrt(nodes.length)));
      nodes.forEach(function (n, i) {
        var c = i % cols, r = Math.floor(i / cols);
        n.x = originX + c * colW;
        n.y = originY + r * rowH;
      });
    } else {
      layers.forEach(function (layer, li) {
        layer.forEach(function (id, ri) {
          var n = nodeById(g, id);
          if (!n) return;
          n.x = originX + li * colW;
          n.y = originY + ri * rowH;
        });
      });
    }
    (g.groups || []).forEach(function (gr) {
      if (!gr || !gr.nodeIds || !gr.nodeIds.length) return;
      var xs = [], ys = [];
      gr.nodeIds.forEach(function (id) {
        var n = nodeById(g, id);
        if (!n) return;
        xs.push(Number(n.x) || 0);
        ys.push(Number(n.y) || 0);
      });
      if (!xs.length) return;
      var minX = Math.min.apply(null, xs), minY = Math.min.apply(null, ys);
      var maxX = Math.max.apply(null, xs), maxY = Math.max.apply(null, ys);
      gr.x = minX - 16;
      gr.y = minY - 28;
      gr.w = Math.max(140, (maxX - minX) + 160);
      gr.h = Math.max(80, (maxY - minY) + 100);
    });
    return g;
  }

  var api = {
    NODE_META: NODE_META,
    PALETTE: PALETTE,
    PALETTE_CATEGORIES: PALETTE_CATEGORIES,
    emptyGraph: emptyGraph,
    normalizeGraph: normalizeGraph,
    compile: compile,
    addNode: addNode,
    deleteNode: deleteNode,
    connect: connect,
    disconnectInto: disconnectInto,
    setNodeParam: setNodeParam,
    nodeById: nodeById,
    findSink: findSink,
    findViewCurve: findViewCurve,
    findCadCurve: findCadCurve,
    findView3d: findView3d,
    findViewOut: findViewOut,
    findPlaceOut: findPlaceOut,
    compileView: compileView,
    describeView: describeView,
    attachWiredIdealY: attachWiredIdealY,
    compilePlace: compilePlace,
    collectWorldComponents: collectWorldComponents,
    defaultCadCurveParams: defaultCadCurveParams,
    defaultViewCurveParams: defaultViewCurveParams,
    idealYFromCadMath: idealYFromCadMath,
    normalizeCadMath: normalizeCadMath,
    newId: newId,
    meta: meta,
    clamp01: clamp01,
    isConstType: isConstType,
    nodeHeight: nodeHeight,
    nodeWidth: nodeWidth,
    exampleBlueprints: exampleBlueprints,
    builtinBlueprints: exampleBlueprints /* alias — pack `builtins` graphs (optional library) */,
    resolveBoardMax: resolveBoardMax,
    resolveCtxField: resolveCtxField,
    evalMechNode: evalMechNode,
    mechAgeT: mechAgeT,
    mechExternalFactor: mechExternalFactor,
    mechDaysCapacityWeight: mechDaysCapacityWeight,
    mechHappinessAgeWeight: mechHappinessAgeWeight,
    mechMoneyDisutility: mechMoneyDisutility,
    mechHash01: mechHash01,
    mechClamp: mechClamp,
    resolveJfactorX: resolveJfactorX,
    resolveJfactorY: resolveJfactorY,
    resolveJfactorDomain: resolveJfactorDomain,
    resolveJfactorJgroup: resolveJfactorJgroup,
    evalJoyFactorCall: evalJoyFactorCall,
    JF_CALL_ALLOW: JF_CALL_ALLOW,
    hasInEdge: hasInEdge,
    resolvePlaceFromAct: resolvePlaceFromAct,
    defaultPlaceFromActParams: defaultPlaceFromActParams,
    actAmount: actAmount,
    actDays: actDays,
    actEffortHours: actEffortHours,
    PLACE_KINDS: PLACE_KINDS,
    PORT_TYPE: PORT_TYPE,
    portTypeOf: portTypeOf,
    portsCompatible: portsCompatible,
    canConnect: canConnect,
    edgeTypeInfo: edgeTypeInfo,
    probePins: probePins,
    listJoyFactorExportKeys: listJoyFactorExportKeys,
    defaultJfactorBrowseParams: defaultJfactorBrowseParams,
    defaultSimStepParams: defaultSimStepParams,
    defaultEconParams: defaultEconParams,
    evalEconNode: evalEconNode,
    econActWindow: econActWindow,
    ECON_MATTHEW: ECON_MATTHEW,
    harmonicSharesLocal: harmonicSharesLocal,
    resolveFactorWeightsMTD: resolveFactorWeightsMTD,
    computeFactorCosts: computeFactorCosts,
    factorWeightedFriction: factorWeightedFriction,
    economyServicesFromIdea: economyServicesFromIdea,
    simNetForService: simNetForService,
    boardSpecFromEconomyService: boardSpecFromEconomyService,
    boardItemsFromIdeaEconomy: boardItemsFromIdeaEconomy,
    validateEconomyFirms: validateEconomyFirms,
    ingestLocalEconomy: ingestLocalEconomy,
    /* easy175 packs + subgraphs */
    scriptHasAuthoredNodes: scriptHasAuthoredNodes,
    buildBuiltinPack: buildBuiltinPack,
    listPacks: listPacks,
    getPack: getPack,
    registerPack: registerPack,
    packGraph: packGraph,
    collectBoardEmits: collectBoardEmits,
    defaultBoardEmitParams: defaultBoardEmitParams,
    groupNodes: groupNodes,
    setGroupCollapsed: setGroupCollapsed,
    toggleGroupCollapsed: toggleGroupCollapsed,
    ungroup: ungroup,
    setGroupLabel: setGroupLabel,
    nodeInCollapsedGroup: nodeInCollapsedGroup,
    autoLayout: autoLayout,
    ensureGraphGroups: ensureGraphGroups,
    PACK_SINK_TYPES: PACK_SINK_TYPES
  };

  global.ModelToolsScript = api;
  if (typeof module !== 'undefined' && module.exports && !module.exports.JBlueprint) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
