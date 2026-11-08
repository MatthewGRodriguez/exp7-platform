/**
 * RunJMethods — graphable models for liveBest/run() jmethods (easy176).
 * easy176: method.idealY from wired view.sample / compileView.idealYFn when present.
 * easy174: hydrate prefers saved WB.modelTools.jmethods over builtin seed; pure place graphs.
 * easy173: mech Blueprints SoT; easy170: place from Blueprint place.out/compilePlace; BUILTIN_PLACES fallback only.
 * Score heart: Blueprint graph preferred (view.curve + score.out; view.out → PREVIEW). scoreMode is fallback when graph absent.
 * ModelToolsScript compile drives score when ok (easy166).
 * Each method is score + viz (curve + placement point).
 * Lazy-reads window.JoyFactors inside score when present.
 */
(function (global) {
  'use strict';

  function clamp(n, a, b) {
    n = Number(n);
    if (!isFinite(n)) n = a;
    return Math.max(a, Math.min(b, n));
  }

  function num(v, d) {
    var n = Number(v);
    return isFinite(n) ? n : (d != null ? d : 0);
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function jfac() {
    return (typeof global.JoyFactors !== 'undefined' && global.JoyFactors) ? global.JoyFactors : null;
  }

  function linspace(a, b, n) {
    n = Math.max(2, Math.floor(n) || 24);
    var out = [];
    for (var i = 0; i < n; i++) {
      out.push(a + (b - a) * (i / (n - 1)));
    }
    return out;
  }

  /** Infer a useful x-domain from placement or defaults. */
  /** Locked chart domain = authored jmethod _xMax (not auto-fit). */
  function domainX(method, placement, opts) {
    opts = opts || {};
    var defMax = Number(method && method._xMax);
    if (!(defMax > 0)) defMax = 100;
    if (opts.fitData) {
      var px = placement && placement.x != null ? Math.abs(Number(placement.x)) : null;
      return { min: 0, max: Math.max(defMax, px != null ? px * 1.35 : 0, 1e-6) };
    }
    return { min: 0, max: defMax };
  }

  /** Locked chart domain = authored jmethod _yMax (not auto-fit). */
  function domainY(method, samples, placement, opts) {
    opts = opts || {};
    var defMax = Number(method && method._yMax);
    if (!(defMax > 0)) defMax = 1;
    if (opts.fitData) {
      var max = defMax;
      var i;
      if (samples && samples.length) {
        for (i = 0; i < samples.length; i++) {
          if (samples[i] && isFinite(samples[i].y)) max = Math.max(max, Math.abs(samples[i].y));
        }
      }
      if (placement && placement.y != null && isFinite(Number(placement.y))) {
        max = Math.max(max, Math.abs(Number(placement.y)) * 1.25);
      }
      return { min: 0, max: Math.max(max, 1e-6) };
    }
    return { min: 0, max: defMax };
  }

  /* ---------- method definitions ---------- */

  var METHODS = Object.create(null);

  /**
   * Shared: ideal curve from method.idealY (same surface place/score use).
   * Actual landings use idealY(actX) then optional sim modifiers — not a second Y recipe.
   */
  function sampleIdealCurve(method, n, ctx) {
    n = n || 40;
    ctx = ctx || {};
    var xMax = Number(method._xMax) || 100;
    var yMax = Number(method._yMax) || 1;
    var xs = linspace(0, xMax, n);
    // avoid x=0 issues for some scorers
    if (xs[0] === 0 && method.id === 'debtPay') xs[0] = 1e-3;
    return xs.map(function (x) {
      var y = 0;
      try {
        y = typeof method.idealY === 'function' ? Number(method.idealY(x, ctx)) : 0;
      } catch (_e) { y = 0; }
      if (!isFinite(y) || y < 0) y = 0;
      if (yMax > 0) y = Math.min(y, yMax);
      return { x: x, y: y };
    });
  }

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

  METHODS.earn = {
    id: 'earn',
    blueprintExample: true,
    label: 'Earn (effort → income)',
    kind: 'graph2d',
    axes: {
      x: { key: 'effort', label: 'effort / month', unit: 'h/mo' },
      y: { key: 'income', label: 'income / month', unit: '$/mo' }
    },
    _xMax: 880,
    _yMax: 8000,
    idealY: function (x, ctx) {
      var xMax = this._xMax || 40;
      var yMax = this._yMax || 1000;
      return (yMax / xMax) * Math.max(0, Number(x) || 0);
    },
    score: function (ctx) {
      ctx = ctx || {};
      /* liveBest passes income in y — keep that for Exp6; idealY is viz surface only */
      return Math.abs(num(ctx.y, 0)) || 0.01;
    },
    sampleCurve: function (n) { return sampleIdealCurve(this, n); },
    place: function (act, ctx) {
      ctx = ctx || {};
      var hoursDay = actEffortHours(act, ctx);
      hoursDay = Math.max(hoursDay, 0.01);
      /* Monthly effort hours (≈22 workdays) vs monthly income — same period */
      var daysMo = ctx.workdaysPerMonth != null ? num(ctx.workdaysPerMonth, 22) : 22;
      var hoursMo = hoursDay * daysMo;
      var income = actAmount(act, ctx);
      if (!(income > 0) && ctx.y != null) income = Math.abs(num(ctx.y, 0));
      if (!(income > 0)) income = (this._yMax / this._xMax) * hoursMo;
      return {
        x: hoursMo,
        y: income,
        hoursDay: hoursDay,
        label: (act && (act.name || act.id)) || 'earn'
      };
    }
  };

  METHODS.moneyToHappy = {
    id: 'moneyToHappy',
    blueprintExample: true,
    label: 'Money → Happy',
    kind: 'graph2d',
    axes: {
      x: { key: 'cost', label: 'money spent / cost', unit: '$' },
      y: { key: 'happy', label: 'happy units', unit: 'H' }
    },
    _xMax: 800,
    _yMax: 226.27416997969522,
    idealY: function (x, ctx) {
      ctx = ctx || {};
      var xMax = this._xMax || 800;
      var yMax = this._yMax || 226.27416997969522;
      var xx = Math.max(0, Number(x) || 0);
      var JF = jfac();
      // Prefer JoyFactors if it exposes an invertible surface; else authored k√x
      if (JF && typeof JF.scoreMoneyToHappy === 'function') {
        // recover y on the model iso: score(x,y)=y/√x → for unit score slope use k√x happy
      }
      var k = yMax / Math.sqrt(xMax);
      return k * Math.sqrt(xx);
    },
    score: function (ctx) {
      ctx = ctx || {};
      var JF = jfac();
      var cost = Math.abs(num(ctx.x, 0));
      var gain = ctx.y != null ? Math.abs(num(ctx.y, 0)) : this.idealY(cost, ctx);
      if (JF && typeof JF.scoreMoneyToHappy === 'function') {
        return Number(JF.scoreMoneyToHappy(ctx)) || 0;
      }
      return cost < 1e-9 ? gain : gain / Math.sqrt(cost);
    },
    sampleCurve: function (n) { return sampleIdealCurve(this, n); },
    place: function (act, ctx) {
      ctx = ctx || {};
      var cost = Math.max(actAmount(act, ctx), 0.01);
      /* Actual Y = sheet/rank happy, not k√cost model */
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
      return { x: cost, y: happy, label: (act && (act.name || act.id)) || 'spend' };
    }
  };

  METHODS.daysUse = {
    id: 'daysUse',
    blueprintExample: true,
    label: 'Days used → return',
    kind: 'graph2d',
    axes: {
      x: { key: 'days', label: 'days used', unit: 'd' },
      y: { key: 'return', label: 'weighted return', unit: '' }
    },
    _xMax: 31,
    _yMax: 10,
    idealY: function (x, ctx) {
      ctx = ctx || {};
      var days = Math.max(0, Number(x) || 0);
      var D = ctx.D != null ? ctx.D : (ctx.Dmax != null ? ctx.Dmax : 30);
      var yMax = this._yMax || 10;
      var JF = jfac();
      var dayW = (JF && JF.daysCapacityWeight)
        ? JF.daysCapacityWeight(days, D, ctx.Dmax != null ? ctx.Dmax : this._xMax)
        : (1 / (1 + days / Math.max(Number(D) || 1, 1e-6)));
      return dayW * yMax;
    },
    score: function (ctx) {
      ctx = ctx || {};
      var days = Math.abs(num(ctx.x, 0));
      var gain = Math.abs(num(ctx.y, 0));
      var D = ctx.D != null ? ctx.D : (ctx.Dmax != null ? ctx.Dmax : 30);
      var JF = jfac();
      var dayW = (JF && JF.daysCapacityWeight)
        ? JF.daysCapacityWeight(days, D, ctx.Dmax)
        : (1 / (1 + days / Math.max(Number(D) || 1, 1e-6)));
      return (gain + 1e-6) * dayW * 10;
    },
    sampleCurve: function (n) { return sampleIdealCurve(this, n, { D: 30, Dmax: 31 }); },
    place: function (act, ctx) {
      ctx = ctx || {};
      var days = Math.max(actDays(act, ctx), 0.01);
      var c = { D: ctx.D != null ? ctx.D : 30, Dmax: ctx.Dmax != null ? ctx.Dmax : 31 };
      /* Actual return: use provided gain/D share when present, else model */
      var ret = 0;
      if (ctx.y != null) ret = Math.abs(num(ctx.y, 0));
      if (!(ret > 0) && act && act.D != null) ret = Math.abs(num(act.D, 0));
      if (!(ret > 0)) {
        var JF = jfac();
        var dayW = (JF && JF.daysCapacityWeight)
          ? JF.daysCapacityWeight(days, c.D, c.Dmax)
          : (1 / (1 + days / Math.max(Number(c.D) || 1, 1e-6)));
        var gain = (act && act.score01 != null) ? Math.abs(num(act.score01, 1)) : 1;
        ret = (gain + 1e-6) * dayW * 10;
      }
      return { x: days, y: ret, label: (act && (act.name || act.id)) || 'days' };
    }
  };

  METHODS.ageTick = {
    id: 'ageTick',
    blueprintExample: true,
    label: 'Age tick → weight',
    kind: 'graph2d',
    axes: {
      x: { key: 'ageTick', label: 'age / time tick', unit: '' },
      y: { key: 'weight', label: 'weight', unit: '' }
    },
    _xMax: 12,
    _yMax: 1,
    idealY: function (x, ctx) {
      var xx = Math.max(0.01, Number(x) || 0.01);
      var JF = jfac();
      if (JF && typeof JF.scoreAgeTick === 'function') {
        return Math.max(0, Number(JF.scoreAgeTick({ x: xx, y: -0.01, name: 'age_tick' })) || 0);
      }
      return 0.15 / (1 + xx);
    },
    score: function (ctx) {
      ctx = ctx || {};
      var JF = jfac();
      if (JF && typeof JF.scoreAgeTick === 'function') {
        return Number(JF.scoreAgeTick(ctx)) || 0;
      }
      var x = ctx.x != null ? Math.abs(num(ctx.x, 1)) : 1;
      return this.idealY(x, ctx);
    },
    sampleCurve: function (n) { return sampleIdealCurve(this, n); },
    place: function (act, ctx) {
      ctx = ctx || {};
      var x = ctx.x != null ? Math.abs(num(ctx.x, 1)) : 1;
      var y = this.idealY(x, ctx);
      return { x: x, y: y, label: (act && (act.name || act.id)) || 'age tick' };
    }
  };

  METHODS.extUse = {
    id: 'extUse',
    blueprintExample: true,
    label: 'External used → return',
    kind: 'graph2d',
    axes: {
      x: { key: 'external', label: 'external used', unit: 'E' },
      y: { key: 'return', label: 'return', unit: '' }
    },
    _xMax: 5,
    _yMax: 1.5,
    idealY: function (x, ctx) {
      ctx = ctx || {};
      var used = Math.max(0, Number(x) || 0);
      var JF = jfac();
      var tt = (JF && JF.ageT) ? JF.ageT(ctx) : 0.3;
      var ext = (JF && JF.externalFactor)
        ? JF.externalFactor(ctx.name || 'ext_curve', tt, ctx.E != null ? ctx.E : 10, ctx.Emax != null ? ctx.Emax : 20)
        : 1;
      return ext / (1 + used);
    },
    score: function (ctx) {
      ctx = ctx || {};
      var used = Math.abs(num(ctx.x, 0));
      var gain = ctx.y != null ? Math.abs(num(ctx.y, 0)) : this.idealY(used, ctx);
      var JF = jfac();
      var tt = (JF && JF.ageT) ? JF.ageT(ctx) : 0;
      var ext = (JF && JF.externalFactor)
        ? JF.externalFactor(ctx.name || 'ext', tt, ctx.E, ctx.Emax)
        : 1;
      return (gain + 1e-6) * ext / (1 + used);
    },
    sampleCurve: function (n) { return sampleIdealCurve(this, n, { E: 10, Emax: 20 }); },
    place: function (act, ctx) {
      ctx = ctx || {};
      var used = ctx.x != null ? Math.abs(num(ctx.x, 0.5)) : 0.5;
      if (act && act.rankE != null) used = Math.abs(num(act.rankE, used));
      /* Actual return from score inputs; gap vs idealY(used) is real */
      var ret = 0;
      if (ctx.y != null) ret = Math.abs(num(ctx.y, 0));
      if (!(ret > 0)) {
        var JF = jfac();
        var tt = (JF && JF.ageT) ? JF.ageT(ctx) : 0.3;
        var ext = (JF && JF.externalFactor)
          ? JF.externalFactor((act && act.name) || 'ext', tt, ctx.E, ctx.Emax)
          : 1;
        var gain = (act && act.score01 != null) ? Math.max(num(act.score01, 1), 0.01) : 1;
        ret = (gain + 1e-6) * ext / (1 + used);
      }
      return { x: used, y: ret, label: (act && (act.name || act.id)) || 'external' };
    }
  };

  METHODS.debtPay = {
    id: 'debtPay',
    blueprintExample: true,
    label: 'Debt pay → urgency',
    kind: 'graph2d',
    axes: {
      x: { key: 'payment', label: 'payment', unit: '$' },
      y: { key: 'urgency', label: 'urgency score', unit: '' }
    },
    _xMax: 800,
    _yMax: 50,
    idealY: function (x, ctx) {
      ctx = ctx || {};
      var pay = Math.max(1e-3, Number(x) || 0);
      var apr = ctx.apr != null ? num(ctx.apr, 0.18) : 0.18;
      if (apr > 1) apr = apr * 0.01;
      var JF = jfac();
      if (JF && typeof JF.scoreDebtPay === 'function') {
        return Math.max(0, Number(JF.scoreDebtPay({
          x: pay,
          y: pay * 0.5,
          apr: apr,
          interest: ctx.interest != null ? ctx.interest : pay * apr / 12,
          X: ctx.X != null ? ctx.X : 2000,
          name: ctx.name
        })) || 0);
      }
      return (1.5 + 8 * apr) * Math.sqrt(pay * 0.5 + pay * 0.25) / (1 + pay / 2000);
    },
    score: function (ctx) {
      ctx = ctx || {};
      var JF = jfac();
      if (JF && typeof JF.scoreDebtPay === 'function') {
        return Number(JF.scoreDebtPay(ctx)) || 0;
      }
      var x = Math.abs(num(ctx.x, 0));
      return this.idealY(x, ctx);
    },
    sampleCurve: function (n) { return sampleIdealCurve(this, n, { apr: 0.18 }); },
    place: function (act, ctx) {
      ctx = ctx || {};
      var pay = Math.max(actAmount(act, ctx), 0.01);
      var apr = ctx.apr != null ? num(ctx.apr, 0) : (act && act.apr != null ? num(act.apr, 0) : 0.18);
      if (apr > 1) apr = apr * 0.01;
      if (!(apr > 0)) apr = 0.18;
      var y = this.idealY(pay, { apr: apr, interest: ctx.interest, X: ctx.X, name: ctx.name });
      var label = (act && (act.name || act.id)) || 'debt';
      if (apr > 0) label += ' · APR ' + (apr * 100).toFixed(1) + '%';
      return { x: pay, y: y, label: label, apr: apr };
    }
  };


  /* Snapshot built-in ids so hydrate/register never wipe them — except Blueprint SoT replace. */
  var BUILTIN_IDS = Object.create(null);
  Object.keys(METHODS).forEach(function (id) { BUILTIN_IDS[id] = true; });

  /* Legacy place snapshot — Blueprint place.out preferred; BUILTIN_PLACES fallback only if compile fails. */
  var BUILTIN_PLACES = Object.create(null);
  var BUILTIN_AXES = Object.create(null);
  var BUILTIN_LEGACY_SCORE = Object.create(null);
  Object.keys(METHODS).forEach(function (id) {
    var m = METHODS[id];
    /* bind so this.idealY / this._xMax stay on the original builtin bag after hydrate replaces METHODS[id] */
    if (typeof m.place === 'function') BUILTIN_PLACES[id] = m.place.bind(m);
    if (m.axes) BUILTIN_AXES[id] = m.axes;
    if (typeof m.score === 'function') BUILTIN_LEGACY_SCORE[id] = m.score.bind(m);
  });

  /* ---------- math play-out (custom jmethods) ---------- */

  function normalizeMath(math) {
    math = math || {};
    var type = String(math.type || 'linear');
    if (['linear', 'sqrt', 'log1p', 'power', 'bezier'].indexOf(type) < 0) type = 'linear';
    var params = (math.params && typeof math.params === 'object') ? math.params : {};
    var out = { type: type, params: {} };
    if (type === 'linear') {
      out.params.a = Number(params.a); if (!isFinite(out.params.a)) out.params.a = 1;
      out.params.b = Number(params.b); if (!isFinite(out.params.b)) out.params.b = 0;
    } else if (type === 'sqrt') {
      out.params.k = Number(params.k); if (!isFinite(out.params.k)) out.params.k = 1;
    } else if (type === 'log1p') {
      out.params.k = Number(params.k); if (!isFinite(out.params.k)) out.params.k = 1;
    } else if (type === 'power') {
      out.params.k = Number(params.k); if (!isFinite(out.params.k)) out.params.k = 1;
      out.params.p = Number(params.p); if (!isFinite(out.params.p)) out.params.p = 0.5;
    } else if (type === 'bezier') {
      var pts = Array.isArray(params.points) ? params.points : [];
      out.params.points = pts.map(function (pt) {
        return { x: Math.max(0, Number(pt && pt.x) || 0), y: Math.max(0, Number(pt && pt.y) || 0) };
      }).sort(function (a, b) { return a.x - b.x; });
      if (out.params.points.length < 2) {
        out.params.points = [{ x: 0, y: 0 }, { x: 100, y: 1 }];
      }
    }
    return out;
  }

  function mathFormulaText(math) {
    var m = normalizeMath(math);
    var p = m.params;
    if (m.type === 'linear') return 'y = ' + p.a + '·x + ' + p.b + ' (clamp ≥0)';
    if (m.type === 'sqrt') return 'y = ' + p.k + '·√x';
    if (m.type === 'log1p') return 'y = ' + p.k + '·log(1+x)';
    if (m.type === 'power') return 'y = ' + p.k + '·x^' + p.p;
    if (m.type === 'bezier') {
      return 'y = bezier through ' + (p.points && p.points.length || 0) + ' control points (piecewise / Catmull)';
    }
    return 'y = f(x)';
  }

  /** Piecewise-linear / Catmull-Rom-ish Y at X for control points (sorted by x). */
  function evalBezierPoints(points, x) {
    var pts = (points || []).slice().sort(function (a, b) { return a.x - b.x; });
    if (!pts.length) return 0;
    x = Math.max(0, Number(x) || 0);
    if (x <= pts[0].x) return Math.max(0, pts[0].y);
    if (x >= pts[pts.length - 1].x) return Math.max(0, pts[pts.length - 1].y);
    var i;
    for (i = 0; i < pts.length - 1; i++) {
      if (x >= pts[i].x && x <= pts[i + 1].x) break;
    }
    var a = pts[Math.max(0, i - 1)];
    var b = pts[i];
    var c = pts[Math.min(pts.length - 1, i + 1)];
    var d = pts[Math.min(pts.length - 1, i + 2)];
    var span = (c.x - b.x) || 1e-9;
    var t = clamp((x - b.x) / span, 0, 1);
    /* Catmull-Rom (uniform) → cubic; falls back to lerp if neighbors coincide */
    var t2 = t * t, t3 = t2 * t;
    var y = 0.5 * (
      (2 * b.y) +
      (-a.y + c.y) * t +
      (2 * a.y - 5 * b.y + 4 * c.y - d.y) * t2 +
      (-a.y + 3 * b.y - 3 * c.y + d.y) * t3
    );
    if (!isFinite(y)) {
      y = b.y + (c.y - b.y) * t;
    }
    return Math.max(0, y);
  }

  
  /**
   * Heuristic: research paper abstract / formula / stats note → math type + params.
   * Local only (no network). Used by MODEL TOOLS paper → jmethod CAD intake.
   */
  function suggestMathFromPaper(text) {
    var raw = String(text || '');
    var t = raw.toLowerCase();
    var out = {
      toolSuggest: null,
      math: null,
      caption: '',
      extracted: { keywords: [], patterns: [] }
    };
    var kw = [];
    if (/\b3d\b|spatial|geospatial|\bgeo\b|\bmap\b|latitude|longitude|xyz|voxel/.test(t)) {
      out.toolSuggest = '3d';
      kw.push('spatial/3d');
    }
    if (/bezier|spline|\bcurve\b|control\s*point/.test(t)) {
      out.math = normalizeMath({ type: 'bezier', params: { points: [{ x: 0, y: 0 }, { x: 25, y: 0.4 }, { x: 60, y: 0.75 }, { x: 100, y: 1 }] } });
      kw.push('bezier');
    } else if (/\blog\b|\bln\b|log1p|logarithmic|log\s*\(/.test(t)) {
      out.math = normalizeMath({ type: 'log1p', params: { k: 1 } });
      kw.push('log');
    } else if (/sqrt|square\s*root/.test(t) || /√/.test(raw)) {
      out.math = normalizeMath({ type: 'sqrt', params: { k: 1 } });
      kw.push('sqrt');
    } else if (/power|exponent|\^|x\s*\*\*|x\s*\^/.test(t)) {
      out.math = normalizeMath({ type: 'power', params: { k: 1, p: 0.5 } });
      kw.push('power');
    } else if (/linear|regression|\bslope\b|y\s*=\s*a\s*\*?\s*x/.test(t)) {
      out.math = normalizeMath({ type: 'linear', params: { a: 0.01, b: 0 } });
      kw.push('linear');
    }
    var mLin = raw.match(/y\s*=\s*([-+]?\d*\.?\d+)\s*\*?\s*x\s*([-+]\s*\d*\.?\d+)?/i);
    if (mLin) {
      var a = parseFloat(String(mLin[1]).replace(/\s/g, ''));
      var b = mLin[2] != null ? parseFloat(String(mLin[2]).replace(/\s/g, '')) : 0;
      if (!isFinite(a)) a = 0.01;
      if (!isFinite(b)) b = 0;
      out.math = normalizeMath({ type: 'linear', params: { a: a, b: b } });
      out.extracted.patterns.push('y=a*x+b');
      kw.push('linear-pattern');
    }
    var mSqrt = raw.match(/(?:y\s*=\s*)?([-+]?\d*\.?\d+)\s*\*?\s*(?:sqrt|√)\s*\(?\s*x\s*\)?/i);
    if (mSqrt) {
      var k = mSqrt[1] != null ? parseFloat(mSqrt[1]) : 1;
      if (!isFinite(k)) k = 1;
      out.math = normalizeMath({ type: 'sqrt', params: { k: k } });
      out.extracted.patterns.push('k*sqrt(x)');
      kw.push('sqrt-pattern');
    }
    var mPow = raw.match(/y\s*=\s*([-+]?\d*\.?\d+)?\s*\*?\s*x\s*\^\s*([-+]?\d*\.?\d+)/i)
      || raw.match(/x\s*\^\s*([-+]?\d*\.?\d+)/i);
    if (mPow && !(out.extracted.patterns && out.extracted.patterns.length)) {
      var kk = 1, pp = 0.5;
      if (mPow.length > 2 && mPow[2] != null) {
        kk = (mPow[1] != null && mPow[1] !== '') ? parseFloat(mPow[1]) : 1;
        pp = parseFloat(mPow[2]);
      } else {
        pp = parseFloat(mPow[1]);
      }
      if (!isFinite(kk)) kk = 1;
      if (!isFinite(pp)) pp = 0.5;
      out.math = normalizeMath({ type: 'power', params: { k: kk, p: pp } });
      out.extracted.patterns.push('x^p');
      kw.push('power-pattern');
    }
    if (!out.math) out.math = normalizeMath({ type: 'linear', params: { a: 0.01, b: 0 } });
    out.extracted.keywords = kw;
    try { out.caption = mathFormulaText(out.math); } catch (_c) { out.caption = out.math.type || ''; }
    return out;
  }

function idealYFromMath(math, x) {
    var m = normalizeMath(math);
    var xx = Math.max(0, Number(x) || 0);
    var p = m.params;
    var y = 0;
    if (m.type === 'linear') y = p.a * xx + p.b;
    else if (m.type === 'sqrt') y = p.k * Math.sqrt(xx);
    else if (m.type === 'log1p') y = p.k * Math.log(1 + xx);
    else if (m.type === 'power') y = p.k * Math.pow(xx, p.p);
    else if (m.type === 'bezier') y = evalBezierPoints(p.points, xx);
    if (!isFinite(y) || y < 0) y = 0;
    return y;
  }

  var SCORE_MODES = {
    ideal_over_ymax: {
      id: 'ideal_over_ymax',
      label: 'idealY / yMax',
      hint: 'score = clamp(idealY(x) / yMax, 0, 1) — model surface normalized to domain Y (default)'
    },
    y_over_ideal: {
      id: 'y_over_ideal',
      label: 'y / idealY',
      hint: 'score = clamp(y / max(idealY(x), ε), 0, 1) — landing vs model'
    },
    y_over_ymax: {
      id: 'y_over_ymax',
      label: 'y / yMax',
      hint: 'score = clamp(y / yMax, 0, 1) — raw response on domain Y'
    },
    gap_to_ideal: {
      id: 'gap_to_ideal',
      label: '1 − |y−ideal|/yMax',
      hint: 'score = clamp(1 − |y − idealY(x)| / yMax, 0, 1) — closeness to model'
    },
    min_xy_norm: {
      id: 'min_xy_norm',
      label: 'min(x/xMax, y/yMax)',
      hint: 'score = clamp(min(x/xMax, y/yMax), 0, 1) — joint domain fill'
    }
  };

  function normalizeScoreMode(mode) {
    var m = String(mode || 'ideal_over_ymax');
    return SCORE_MODES[m] ? m : 'ideal_over_ymax';
  }

  /**
   * Compute score from recipe + domains.
   * @param {string} mode scoreMode id
   * @param {{x:number,y?:number,idealY:number,xMax:number,yMax:number}} p
   */
  function scoreFromRecipe(mode, p) {
    p = p || {};
    mode = normalizeScoreMode(mode);
    var x = Math.max(0, num(p.x, 0));
    var yIdeal = Math.max(0, num(p.idealY, 0));
    var y = p.y != null && isFinite(Number(p.y)) ? Math.max(0, Number(p.y)) : yIdeal;
    var xMax = Number(p.xMax);
    if (!(xMax > 0)) xMax = 100;
    var yMax = Number(p.yMax);
    if (!(yMax > 0)) yMax = 1;
    var eps = 1e-9;
    if (mode === 'y_over_ideal') return clamp(y / Math.max(yIdeal, eps), 0, 1);
    if (mode === 'y_over_ymax') return clamp(y / yMax, 0, 1);
    if (mode === 'gap_to_ideal') return clamp(1 - Math.abs(y - yIdeal) / yMax, 0, 1);
    if (mode === 'min_xy_norm') return clamp(Math.min(x / xMax, y / yMax), 0, 1);
    /* ideal_over_ymax (default) */
    return clamp(yIdeal / yMax, 0, 1);
  }

  /**
   * Build a registerable custom method from math + opts.
   * Heart: authored xMax/yMax + scoreMode → score(ctx) for PREVIEW + run().
   * Default scoreMode ideal_over_ymax: clamp(idealY(x) / yMax, 0, 1).
   */
  function buildFromMath(math, opts) {
    opts = opts || {};
    var mth = normalizeMath(math);
    var id = String(opts.id || ('custom_' + Date.now().toString(36)));
    var label = String(opts.label != null ? opts.label : id);
    var xMax = Number(opts.xMax != null ? opts.xMax : opts._xMax);
    if (!(xMax > 0)) xMax = 100;
    var yMax = Number(opts.yMax != null ? opts.yMax : opts._yMax);
    if (!(yMax > 0)) {
      /* pick a sensible default from math at xMax */
      var yAt = idealYFromMath(mth, xMax);
      yMax = yAt > 0 ? yAt : 1;
    }
    var scoreMode = normalizeScoreMode(opts.scoreMode);
    var xLabel = opts.xLabel != null ? String(opts.xLabel) : null;
    var yLabel = opts.yLabel != null ? String(opts.yLabel) : null;
    var axes = opts.axes || {
      x: { key: 'x', label: (xLabel || 'x'), unit: opts.xUnit || '' },
      y: { key: 'y', label: (yLabel || 'ideal y'), unit: opts.yUnit || '' }
    };
    if (xLabel && axes.x) axes.x.label = xLabel;
    if (yLabel && axes.y) axes.y.label = yLabel;
    var def = {
      id: id,
      label: label,
      kind: 'custom',
      axes: axes,
      _xMax: xMax,
      _yMax: yMax,
      scoreMode: scoreMode,
      xLabel: xLabel || (axes.x && axes.x.label) || 'x',
      yLabel: yLabel || (axes.y && axes.y.label) || 'ideal y',
      math: mth,
      factorDim: opts.factorDim || null,
      idealY: function (x, ctx) {
        if (typeof this._idealYFn === 'function') {
          try {
            return Math.max(0, Number(this._idealYFn(x, ctx || {})) || 0);
          } catch (_iy) {}
        }
        return idealYFromMath(this.math, x);
      },
      score: function (ctx) {
        ctx = ctx || {};
        var x = Math.max(0, num(ctx.x, 0));
        var yIdeal = this.idealY(x, ctx);
        var y = ctx.y != null ? Math.abs(num(ctx.y, 0)) : yIdeal;
        if (this._scriptFn && typeof this._scriptFn === 'function') {
          var self = this;
          var raw = this._scriptFn({
            x: x,
            y: y,
            xMax: this._xMax,
            yMax: this._yMax,
            idealY: yIdeal,
            idealYAt: function (xx) { return self.idealY(xx, ctx); },
            act: ctx.act,
            name: ctx.name,
            D: ctx.D,
            Dmax: ctx.Dmax,
            E: ctx.E,
            Emax: ctx.Emax,
            apr: ctx.apr,
            interest: ctx.interest,
            X: ctx.X,
            Y: ctx.Y,
            M: ctx.M,
            H: ctx.H,
            jgroup: ctx.jgroup,
            JGroup: ctx.JGroup,
            get: ctx.get,
            wb: ctx.wb
          });
          /* custom authored: clamp 0..1; Blueprint-backed builtins: raw METHODS parity */
          if (this._clampScriptScore === false) {
            var nRaw = Number(raw);
            return isFinite(nRaw) ? nRaw : 0;
          }
          return clamp(raw, 0, 1);
        }
        return scoreFromRecipe(this.scoreMode || 'ideal_over_ymax', {
          x: x,
          y: y,
          idealY: yIdeal,
          xMax: this._xMax,
          yMax: this._yMax
        });
      },
      sampleCurve: function (n) { return sampleIdealCurve(this, n); },
      place: function (act, ctx) {
        ctx = ctx || {};
        var x = 0;
        if (ctx.x != null) x = Math.abs(num(ctx.x, 0));
        else x = Math.max(actAmount(act, ctx), 0);
        if (!(x > 0)) x = Math.max(this._xMax * 0.1, 1);
        var y = ctx.y != null ? Math.abs(num(ctx.y, 0)) : this.idealY(x, ctx);
        return {
          x: x,
          y: y,
          label: (act && (act.name || act.id)) || this.id
        };
      }
    };
    /* Visual script (Scratch + View): prefer compiled score when present + ok */
    if (opts.script && typeof global.ModelToolsScript !== 'undefined' && ModelToolsScript.compile) {
      try {
        var compiled = ModelToolsScript.compile(opts.script);
        def.script = compiled.graph || opts.script;
        def._scriptOk = !!compiled.ok;
        def._scriptError = compiled.ok ? null : (compiled.error || 'compile failed');
        def._scriptFn = compiled.ok ? compiled.scoreFn : null;
        /* If graph has view.curve (compiled.cadCurve/viewCurve), prefer that node's math/domain */
        if (compiled.ok && (compiled.viewCurve || compiled.cadCurve)) {
          var cc = compiled.viewCurve || compiled.cadCurve;
          if (cc.math) {
            def.math = (typeof normalizeMath === 'function') ? normalizeMath(cc.math) : cc.math;
          }
          if (cc.xMax > 0) def._xMax = cc.xMax;
          if (cc.yMax > 0) def._yMax = cc.yMax;
          if (cc.xLabel) { def.xLabel = cc.xLabel; if (def.axes && def.axes.x) def.axes.x.label = cc.xLabel; }
          if (cc.yLabel) { def.yLabel = cc.yLabel; if (def.axes && def.axes.y) def.axes.y.label = cc.yLabel; }
        }
      } catch (scErr) {
        def.script = opts.script;
        def._scriptOk = false;
        def._scriptError = String(scErr && scErr.message || scErr);
        def._scriptFn = null;
      }
    } else {
      def.script = opts.script || null;
      def._scriptOk = false;
      def._scriptFn = null;
      def._scriptError = null;
    }
    if (opts.clampScriptScore === false) def._clampScriptScore = false;
    else def._clampScriptScore = true;
    if (opts.fromBlueprint) {
      def.fromBlueprint = true;
      def._source = 'blueprint';
      def.blueprintExample = true;
    }
    if (opts.view && typeof opts.view === 'object') def._view = opts.view;
    var iyfn = opts.idealYFn || (opts.view && opts.view.idealYFn) || null;
    if (typeof iyfn !== 'function' && opts.script && typeof global.ModelToolsScript !== 'undefined' && ModelToolsScript.compile) {
      try {
        var cv = ModelToolsScript.compile(opts.script);
        if (cv && cv.view && typeof cv.view.idealYFn === 'function') iyfn = cv.view.idealYFn;
        if (cv && cv.view) {
          def._view = cv.view;
          def._idealYSource = cv.view.curveSource || null;
        }
      } catch (_iy2) {}
    }
    if (typeof iyfn === 'function') {
      def._idealYFn = iyfn;
      def._idealYSource = def._idealYSource || 'wired';
    }
    if (typeof opts.place === 'function') def.place = opts.place;
    if (opts.axes) def.axes = opts.axes;
    return def;
  }

  function register(def) {
    if (!def || !def.id) return null;
    var id = String(def.id);
    var allowBuiltinReplace = !!(def.replaceBuiltin || def.fromBlueprint || def._source === 'blueprint');
    if (BUILTIN_IDS[id] && !allowBuiltinReplace) {
      /* protect builtins unless Blueprint hydrate/register is the SoT */
      return null;
    }
    var built = def;
    if (def.math && (typeof def.idealY !== 'function' || def.kind === 'custom' || allowBuiltinReplace)) {
      built = buildFromMath(def.math, {
        id: id,
        label: def.label,
        axes: def.axes || BUILTIN_AXES[id] || null,
        xMax: def._xMax != null ? def._xMax : def.xMax,
        yMax: def._yMax != null ? def._yMax : def.yMax,
        factorDim: def.factorDim,
        scoreMode: def.scoreMode,
        xLabel: def.xLabel || (def.axes && def.axes.x && def.axes.x.label),
        yLabel: def.yLabel || (def.axes && def.axes.y && def.axes.y.label),
        script: def.script || null,
        clampScriptScore: allowBuiltinReplace ? false : (def.clampScriptScore !== false),
        fromBlueprint: allowBuiltinReplace,
        view: def.view || def._view || null,
        idealYFn: def.idealYFn || null,
        place: def.place || BUILTIN_PLACES[id] || null
      });
      if (def.label) built.label = def.label;
      if (def.factorDim) built.factorDim = def.factorDim;
      if (BUILTIN_AXES[id] && !def.axes) built.axes = BUILTIN_AXES[id];
      /* BUILTIN_PLACES only if compile/author did not supply place */
      if (BUILTIN_PLACES[id] && typeof built.place !== 'function') {
        built.place = BUILTIN_PLACES[id];
      }
      if (def.placeFromBlueprint && typeof def.place === 'function') {
        built.place = def.place;
        built.placeFromBlueprint = true;
      }
      if (allowBuiltinReplace) {
        built.kind = 'graph2d';
        built.fromBlueprint = true;
        built._source = 'blueprint';
        built.blueprintExample = true;
        built.replaceBuiltin = true;
      }
      if (def.fromPack) built.fromPack = def.fromPack;
      if (def.fromSaved) built.fromSaved = true;
      if (def.seedOverride) built.seedOverride = true;
    } else if (allowBuiltinReplace) {
      built.fromBlueprint = true;
      built._source = 'blueprint';
      if (def.fromPack) built.fromPack = def.fromPack;
      if (def.fromSaved) built.fromSaved = true;
      if (def.seedOverride) built.seedOverride = true;
      if (BUILTIN_PLACES[id] && typeof built.place !== 'function') built.place = BUILTIN_PLACES[id];
      if (BUILTIN_AXES[id] && !built.axes) built.axes = BUILTIN_AXES[id];
    }
    METHODS[id] = built;
    return built;
  }

  /**
   * Register one id from an optional pack graph (builtins library) or bp object.
   * Packs are optional libraries; saved WB.modelTools.jmethods are SoT.
   * Compiles script → scoreFn + view + placeFn (from place.out when present).
   * BUILTIN_PLACES used only if place compile fails / absent.
   */
  function registerBuiltinFromBlueprint(id, bp) {
    id = String(id || '');
    if (!id || !bp || !bp.script) return null;
    if (typeof global.ModelToolsScript === 'undefined' || !ModelToolsScript.compile) return null;
    var script = (typeof ModelToolsScript.normalizeGraph === 'function')
      ? ModelToolsScript.normalizeGraph(bp.script) : bp.script;
    var compiled = null;
    try { compiled = ModelToolsScript.compile(script); } catch (_c) { compiled = null; }
    var view = (compiled && compiled.view) || null;
    try {
      if (!view && typeof ModelToolsScript.compileView === 'function') {
        view = ModelToolsScript.compileView(script);
      }
    } catch (_v) { view = null; }
    var placeFn = null;
    try {
      if (compiled && typeof compiled.placeFn === 'function') placeFn = compiled.placeFn;
      else if (typeof ModelToolsScript.compilePlace === 'function') {
        var pc = ModelToolsScript.compilePlace(script);
        if (pc && pc.ok && typeof pc.placeFn === 'function') placeFn = pc.placeFn;
      }
    } catch (_pl) { placeFn = null; }
    var math = bp.math || { type: 'linear', params: { a: 1, b: 0 } };
    var xMax = Number(bp.xMax) > 0 ? Number(bp.xMax) : 100;
    var yMax = Number(bp.yMax) > 0 ? Number(bp.yMax) : 1;
    var xLabel = bp.xLabel != null ? String(bp.xLabel) : 'x';
    var yLabel = bp.yLabel != null ? String(bp.yLabel) : 'ideal y';
    if (view && view.curve) {
      if (view.curve.math) math = normalizeMath(view.curve.math);
      if (view.curve.xMax > 0) xMax = Number(view.curve.xMax);
      if (view.curve.yMax > 0) yMax = Number(view.curve.yMax);
      if (view.curve.xLabel) xLabel = String(view.curve.xLabel);
      if (view.curve.yLabel) yLabel = String(view.curve.yLabel);
    }
    var wiredIdealY = (view && typeof view.idealYFn === 'function') ? view.idealYFn : null;
    var def = {
      id: id,
      label: bp.label || id,
      math: math,
      xMax: xMax,
      yMax: yMax,
      _xMax: xMax,
      _yMax: yMax,
      xLabel: xLabel,
      yLabel: yLabel,
      scoreMode: bp.scoreMode || 'ideal_over_ymax',
      script: (compiled && compiled.graph) || script,
      view: view,
      axes: BUILTIN_AXES[id] || {
        x: { key: 'x', label: xLabel, unit: '' },
        y: { key: 'y', label: yLabel, unit: '' }
      },
      place: placeFn ? function (act, ctx) {
        ctx = ctx || {};
        var c = Object.assign({}, ctx);
        if (c._xMax == null && this && this._xMax != null) c._xMax = this._xMax;
        if (c._yMax == null && this && this._yMax != null) c._yMax = this._yMax;
        if (c.xMax == null && this && this._xMax != null) c.xMax = this._xMax;
        if (c.yMax == null && this && this._yMax != null) c.yMax = this._yMax;
        return placeFn.call(this, act, c);
      } : (BUILTIN_PLACES[id] || null),
      fromBlueprint: true,
      replaceBuiltin: true,
      clampScriptScore: false,
      placeFromBlueprint: !!placeFn,
      fromPack: 'builtins',
      idealYFn: wiredIdealY,
      curveSource: (view && view.curveSource) || null
    };
    var built = register(def);
    if (built && wiredIdealY) {
      built.idealY = function (x, ctx) {
        try {
          var xx = x;
          /* METHODS.ageTick floors x to ≥0.01 before JF.scoreAgeTick */
          if (id === 'ageTick') xx = Math.max(0.01, Number(x) || 0.01);
          return Math.max(0, Number(wiredIdealY(xx, ctx || {})) || 0);
        } catch (_i) {
          return idealYFromMath(this.math, x);
        }
      };
      built._idealYSource = 'wired';
      built._view = view;
    } else if (built && view) {
      built._view = view;
      built._idealYSource = (view.curveSource === 'wired') ? 'wired' : 'blob-fallback';
    }
    return built;
  }

  /**
   * Hydrate pack `builtins` graphs into METHODS when pack is present.
   * easy175: optional library — caller should register saved jmethods first;
   * pass { skipIfSaved: true } to keep saved/seedOverride methods.
   * @returns {number} count registered
   */
  function hydrateBuiltinsFromBlueprints(opts) {
    opts = opts || {};
    if (typeof global.ModelToolsScript === 'undefined') return 0;
    var map = null;
    try {
      if (typeof ModelToolsScript.getPack === 'function') {
        var pack = ModelToolsScript.getPack('builtins');
        if (pack && pack.graphs) map = pack.graphs;
      }
      if (!map) {
        var getter = ModelToolsScript.builtinBlueprints || ModelToolsScript.exampleBlueprints;
        if (typeof getter === 'function') map = getter() || {};
      }
    } catch (_g) { return 0; }
    if (!map) return 0;
    var n = 0;
    Object.keys(map).forEach(function (id) {
      try {
        if (opts.skipIfSaved) {
          var cur = METHODS[id];
          if (cur && (cur.seedOverride || cur.fromSaved)) return;
        }
        if (registerBuiltinFromBlueprint(id, map[id])) n++;
      } catch (_r) {}
    });
    return n;
  }

  /** Compare Blueprint scoreFn vs legacy METHODS score on sample ctx grid (debug/smoke). */
  function parityCheckBuiltin(id, samples) {
    id = String(id || '');
    var m = get(id);
    var legacy = BUILTIN_LEGACY_SCORE[id];
    if (!m || !legacy) return { id: id, ok: false, error: 'missing method or legacy' };
    samples = samples || [
      { x: 0, y: 0 }, { x: 1, y: 1 }, { x: 10, y: 5 }, { x: 100, y: 50 },
      { x: 400, y: 100 }, { x: 800, y: 200 }, { x: 22, y: 3000 }, { x: 5, y: 1.2 }
    ];
    var maxAbs = 0;
    var rows = [];
    for (var i = 0; i < samples.length; i++) {
      var ctx = Object.assign({ D: 30, Dmax: 31, E: 10, Emax: 20, apr: 0.18, name: 'parity' }, samples[i]);
      var a = 0, b = 0;
      try { a = Number(m.score(ctx)) || 0; } catch (_a) { a = NaN; }
      try { b = Number(legacy(ctx)) || 0; } catch (_b) { b = NaN; }
      var d = Math.abs(a - b);
      if (isFinite(d) && d > maxAbs) maxAbs = d;
      rows.push({ ctx: samples[i], bp: a, legacy: b, abs: d });
    }
    return { id: id, ok: maxAbs < 1e-6 || (maxAbs / (Math.abs(rows[rows.length - 1].legacy) + 1e-9) < 0.02), maxAbs: maxAbs, rows: rows, source: m._source || m.kind };
  }



  /** Compare Blueprint method.idealY vs legacy METHODS formulas on a grid. */
  function parityCheckIdealY(id, xs) {
    id = String(id || '');
    var m = get(id);
    if (!m || typeof m.idealY !== 'function') return { id: id, ok: false, error: 'missing idealY' };
    var xMax = Number(m._xMax) || 100;
    var yMax = Number(m._yMax) || 1;
    xs = xs || [0, xMax * 0.1, xMax * 0.25, xMax * 0.5, xMax * 0.75, xMax];
    function legacyIdeal(x, ctx) {
      ctx = ctx || {};
      var xx = Math.max(0, Number(x) || 0);
      if (id === 'earn') return (yMax / xMax) * xx;
      if (id === 'moneyToHappy') return (yMax / Math.sqrt(xMax)) * Math.sqrt(xx);
      if (id === 'daysUse') {
        var D = ctx.D != null ? ctx.D : 30;
        return yMax / (1 + xx / Math.max(Number(D) || 1, 1e-6));
      }
      if (id === 'ageTick') {
        var JF = jfac();
        var xA = Math.max(0.01, xx || 0.01);
        if (JF && typeof JF.scoreAgeTick === 'function') {
          return Math.max(0, Number(JF.scoreAgeTick({ x: xA, y: -0.01, name: 'age_tick', E: ctx.E, Emax: ctx.Emax })) || 0);
        }
        return 0.15 / (1 + xA);
      }
      if (id === 'extUse') {
        var JF2 = jfac();
        var tt = (JF2 && JF2.ageT) ? JF2.ageT(ctx) : 0.3;
        var ext = (JF2 && JF2.externalFactor)
          ? JF2.externalFactor(ctx.name || 'ext_curve', tt, ctx.E != null ? ctx.E : 10, ctx.Emax != null ? ctx.Emax : 20)
          : 1;
        return ext / (1 + xx);
      }
      if (id === 'debtPay') {
        var pay = Math.max(1e-3, xx || 0);
        var apr = ctx.apr != null ? num(ctx.apr, 0.18) : 0.18;
        if (apr > 1) apr = apr * 0.01;
        var JF3 = jfac();
        if (JF3 && typeof JF3.scoreDebtPay === 'function') {
          return Math.max(0, Number(JF3.scoreDebtPay({
            x: pay, y: pay * 0.5, apr: apr,
            interest: ctx.interest != null ? ctx.interest : pay * apr / 12,
            X: ctx.X != null ? ctx.X : 2000, name: ctx.name
          })) || 0);
        }
        return (1.5 + 8 * apr) * Math.sqrt(pay * 0.5 + pay * 0.25) / (1 + pay / 2000);
      }
      return 0;
    }
    var maxAbs = 0;
    var rows = [];
    var ctxBase = { D: 30, Dmax: 31, E: 10, Emax: 20, apr: 0.18, name: 'parity', X: 2000 };
    for (var i = 0; i < xs.length; i++) {
      var x = xs[i];
      var a = 0, b = 0;
      try { a = Number(m.idealY(x, ctxBase)) || 0; } catch (_a) { a = NaN; }
      try { b = Number(legacyIdeal(x, ctxBase)) || 0; } catch (_b) { b = NaN; }
      var d = Math.abs(a - b);
      if (isFinite(d) && d > maxAbs) maxAbs = d;
      rows.push({ x: x, bp: a, legacy: b, abs: d });
    }
    return {
      id: id,
      ok: maxAbs < 1e-4 || (maxAbs / (Math.abs(rows[rows.length - 1].legacy) + 1e-9) < 0.02),
      maxAbs: maxAbs,
      rows: rows,
      source: m._idealYSource || m._source || null
    };
  }

  /** Compare Blueprint placeFn vs legacy BUILTIN_PLACES on sample acts (debug/smoke). */
  function parityCheckPlace(id, acts) {
    id = String(id || '');
    var m = get(id);
    var legacy = BUILTIN_PLACES[id];
    if (!m || typeof m.place !== 'function' || typeof legacy !== 'function') {
      return { id: id, ok: false, error: 'missing place', fromBlueprint: !!(m && m.placeFromBlueprint) };
    }
    acts = acts || [
      { name: 'A', amount: 100, hoursPerWeek: 8, spanDays: 3, score01: 0.8 },
      { name: 'B', amount: 400, workHours: 6, days: 5, score01: 0.4, apr: 0.22 },
      { name: 'C', amountMonthly: 50, hours: [9, 10, 11], rankE: 1.2 },
      { name: 'D', amount: 0, score01: 1.0 }
    ];
    var ctxs = [
      {},
      { x: 10, y: 5, D: 30, Dmax: 31, E: 10, Emax: 20, apr: 0.18, workdaysPerMonth: 22 },
      { y: 12, apr: 0.15, X: 2000 }
    ];
    var maxAbsX = 0, maxAbsY = 0, rows = [];
    for (var i = 0; i < acts.length; i++) {
      for (var j = 0; j < ctxs.length; j++) {
        var act = acts[i];
        var ctx = Object.assign({ name: act.name }, ctxs[j]);
        var a = null, b = null;
        try { a = m.place(act, ctx); } catch (_a) { a = null; }
        try { b = legacy.call(m, act, ctx); } catch (_b) {
          try { b = legacy(act, ctx); } catch (_b2) { b = null; }
        }
        var dx = Math.abs(num(a && a.x, 0) - num(b && b.x, 0));
        var dy = Math.abs(num(a && a.y, 0) - num(b && b.y, 0));
        if (dx > maxAbsX) maxAbsX = dx;
        if (dy > maxAbsY) maxAbsY = dy;
        rows.push({ act: act.name, ctx: j, bp: a, legacy: b, dx: dx, dy: dy });
      }
    }
    var tol = 1e-6;
    var ok = maxAbsX <= tol && maxAbsY <= tol;
    /* relative soft tol for float paths */
    if (!ok) {
      ok = maxAbsX < 1e-4 && maxAbsY < 1e-4;
    }
    return {
      id: id,
      ok: ok,
      maxAbsX: maxAbsX,
      maxAbsY: maxAbsY,
      fromBlueprint: !!m.placeFromBlueprint,
      rows: rows
    };
  }

  function unregister(id) {
    id = String(id || '');
    if (!id || BUILTIN_IDS[id]) return false;
    if (!METHODS[id]) return false;
    delete METHODS[id];
    return true;
  }

  function isBuiltin(id) {
    return !!BUILTIN_IDS[String(id || '')];
  }

  /* ---------- public API ---------- */

  function list() {
    return Object.keys(METHODS).map(function (id) {
      var m = METHODS[id];
      return { id: m.id, label: m.label, kind: m.kind, axes: m.axes, xMax: m._xMax, yMax: m._yMax, blueprintExample: !!m.blueprintExample };
    });
  }

  function get(id) {
    return METHODS[String(id || '')] || null;
  }

  function score(id, ctx) {
    var m = get(id);
    if (!m || typeof m.score !== 'function') return 0;
    return m.score(ctx || {});
  }

  /**
   * Build dark SVG ~420×240: faint model curve + placement point + honest axes.
   * placement: {x,y,label} or raw; opts: {portion, act, nSamples, ctx}
   */
  /**
   * Fit ideal curve to real landings so dashed model shares units with actuals.
   * Returns { idealY(x), k/rate, sd, n, kind }.
   */
  function calibrateFromPoints(method, points) {
    points = (points || []).filter(function (p) {
      return p && isFinite(Number(p.x)) && isFinite(Number(p.y)) && Number(p.x) > 0;
    });
    var id = method && method.id;
    var fit = { kind: 'authored', n: points.length, sd: 0, rate: null, k: null };
    var authored = function (x) {
      try {
        return typeof method.idealY === 'function' ? Number(method.idealY(x, {})) || 0 : 0;
      } catch (_e) { return 0; }
    };

    if (points.length >= 2) {
      if (id === 'earn' || id === 'ageTick') {
        /* y ≈ rate * x */
        var num = 0, den = 0, i;
        for (i = 0; i < points.length; i++) {
          num += points[i].y * points[i].x;
          den += points[i].x * points[i].x;
        }
        fit.rate = den > 0 ? num / den : ((method._yMax || 1) / (method._xMax || 1));
        fit.kind = 'linear';
        fit.idealY = function (x) { return Math.max(0, fit.rate * Math.max(0, Number(x) || 0)); };
      } else if (id === 'moneyToHappy' || id === 'debtPay') {
        /* y ≈ k * sqrt(x) */
        var num2 = 0, den2 = 0, j;
        for (j = 0; j < points.length; j++) {
          var s = Math.sqrt(Math.max(points[j].x, 0));
          num2 += points[j].y * s;
          den2 += s * s;
        }
        fit.k = den2 > 0 ? num2 / den2 : 1;
        fit.kind = 'sqrt';
        fit.idealY = function (x) {
          return Math.max(0, fit.k * Math.sqrt(Math.max(0, Number(x) || 0)));
        };
      } else if (id === 'daysUse' || id === 'extUse') {
        /* y ≈ c * authoredShape(x) — scale factor */
        var num3 = 0, den3 = 0, t;
        for (t = 0; t < points.length; t++) {
          var shape = authored(points[t].x);
          if (shape > 1e-9) {
            num3 += points[t].y * shape;
            den3 += shape * shape;
          }
        }
        var c = den3 > 0 ? num3 / den3 : 1;
        fit.k = c;
        fit.kind = 'shaped';
        fit.idealY = function (x) { return Math.max(0, c * authored(x)); };
      } else {
        fit.idealY = authored;
      }
    } else {
      fit.idealY = authored;
    }

    /* residual SD */
    if (points.length >= 2 && fit.idealY) {
      var sse = 0, m;
      for (m = 0; m < points.length; m++) {
        var err = points[m].y - fit.idealY(points[m].x);
        sse += err * err;
      }
      fit.sd = Math.sqrt(sse / points.length);
    }
    return fit;
  }

  /**
   * easy171: Turn calibrateFromPoints fit (+ landings) into authored math params
   * for Blueprint view.curve / draft.math. Prefer fit.kind; else bezier through pts.
   */
  function mathFromCalibrateFit(fit, points, prevMath, domain) {
    domain = domain || {};
    var xMax = Math.max(Number(domain.xMax) || 100, 1e-6);
    var yMax = Math.max(Number(domain.yMax) || 1, 1e-6);
    points = (points || []).filter(function (p) {
      return p && isFinite(Number(p.x)) && isFinite(Number(p.y)) && Number(p.x) > 0;
    }).slice().sort(function (a, b) { return a.x - b.x; });
    fit = fit || {};
    var math = null;
    if (fit.kind === 'linear' && fit.rate != null && isFinite(fit.rate)) {
      math = normalizeMath({ type: 'linear', params: { a: fit.rate, b: 0 } });
    } else if (fit.kind === 'sqrt' && fit.k != null && isFinite(fit.k)) {
      math = normalizeMath({ type: 'sqrt', params: { k: fit.k } });
    } else if (fit.kind === 'shaped' && fit.k != null && isFinite(fit.k) && prevMath) {
      var pm = normalizeMath(prevMath);
      var scale = Number(fit.k) || 1;
      if (pm.type === 'linear') {
        math = normalizeMath({ type: 'linear', params: { a: (pm.params.a || 0) * scale, b: (pm.params.b || 0) * scale } });
      } else if (pm.type === 'sqrt' || pm.type === 'log1p') {
        math = normalizeMath({ type: pm.type, params: { k: (pm.params.k || 1) * scale } });
      } else if (pm.type === 'power') {
        math = normalizeMath({ type: 'power', params: { k: (pm.params.k || 1) * scale, p: pm.params.p } });
      } else {
        math = pm;
      }
    }
    if (!math && points.length >= 2) {
      var pts = points.map(function (p) {
        return { x: Math.max(0, Number(p.x) || 0), y: Math.max(0, Number(p.y) || 0) };
      });
      if (pts[0].x > 1e-9) pts.unshift({ x: 0, y: pts[0].y });
      var last = pts[pts.length - 1];
      if (last.x < xMax * 0.98) pts.push({ x: xMax, y: last.y });
      math = normalizeMath({ type: 'bezier', params: { points: pts } });
    }
    if (!math) math = normalizeMath(prevMath || { type: 'linear', params: { a: 0.01, b: 0 } });
    /* expand domain to cover landings */
    var maxX = xMax, maxY = yMax;
    points.forEach(function (p) {
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    });
    if (math.type === 'bezier' && math.params && math.params.points) {
      math.params.points.forEach(function (pt) {
        if (pt.x > maxX) maxX = pt.x;
        if (pt.y > maxY) maxY = pt.y;
      });
    }
    return {
      math: math,
      xMax: Math.max(maxX * 1.05, xMax),
      yMax: Math.max(maxY * 1.05, yMax),
      fit: fit
    };
  }

    function sampleFittedCurve(fit, xMax, n) {
    n = n || 40;
    xMax = Math.max(Number(xMax) || 1, 1e-6);
    var xs = linspace(0, xMax, n);
    if (xs[0] === 0 && fit.kind === 'sqrt') xs[0] = 1e-6;
    return xs.map(function (x) {
      return { x: x, y: Math.max(0, fit.idealY(x)) };
    });
  }

    function vizHtml(id, placement, opts) {
    opts = opts || {};
    var m = get(id);
    if (!m) {
      return '<div class="preview-viz preview-viz-missing">'
        + '<div class="preview-viz-label">RunJMethods · unknown id '
        + esc(id) + '</div></div>';
    }

    var act = opts.act || null;
    var ctx = opts.ctx || {};
    var OVERLAY_COLORS = ['#7dcfff', '#9ece6a', '#e0af68', '#f7768e', '#bb9af7', '#73daca', '#ff9e64', '#c0caf5'];

    function scoreAt(x, y, extra) {
      extra = extra || {};
      var c = {
        x: x,
        y: y,
        name: extra.name || (act && act.name),
        D: extra.D != null ? extra.D : (ctx.D != null ? ctx.D : 30),
        Dmax: extra.Dmax != null ? extra.Dmax : (ctx.Dmax != null ? ctx.Dmax : 31),
        E: extra.E != null ? extra.E : ctx.E,
        Emax: extra.Emax != null ? extra.Emax : ctx.Emax,
        apr: extra.apr != null ? extra.apr : ctx.apr,
        interest: extra.interest != null ? extra.interest : ctx.interest,
        X: extra.X != null ? extra.X : ctx.X
      };
      try {
        return Math.max(0, Number(m.score(c)) || 0);
      } catch (_s) {
        return 0;
      }
    }

    function resolvePlace(pl, a) {
      var p = pl;
      if (!p || p.x == null || (!(Math.abs(Number(p.x)) > 0) && !(Math.abs(Number(p.y)) > 0))) {
        try { p = m.place(a || act, ctx); } catch (_p) { p = null; }
      }
      if (!p) p = { x: 0, y: 0 };
      return {
        x: Math.abs(Number(p.x)) || 0,
        y: Math.abs(Number(p.y)) || 0,
        name: (p.label || (a && (a.name || a.id)) || (act && (act.name || act.id)) || 'act'),
        apr: p.apr
      };
    }

    /* Collect real landings */
    var landings = [];
    if (opts.overlays && opts.overlays.length) {
      var oi;
      for (oi = 0; oi < opts.overlays.length; oi++) {
        var ov = opts.overlays[oi];
        if (!ov) continue;
        var lp = resolvePlace(ov.place || ov.placement, null);
        if (ov.name) lp.name = ov.name;
        landings.push(lp);
      }
    }
    if (!landings.length) {
      landings.push(resolvePlace(placement, act));
    }

    /* Calibration points in place-space (for idealY shape), then score-space plot */
    var calPlace = [];
    var ci;
    for (ci = 0; ci < landings.length; ci++) {
      if (landings[ci].x > 0) calPlace.push({ x: landings[ci].x, y: landings[ci].y });
    }
    if (opts.calibratePoints && opts.calibratePoints.length) {
      for (ci = 0; ci < opts.calibratePoints.length; ci++) {
        var cp = opts.calibratePoints[ci];
        if (cp && Number(cp.x) > 0) calPlace.push({ x: Number(cp.x), y: Number(cp.y) });
      }
    }
    var fit = calibrateFromPoints(m, calPlace);

    var dxMax = Number(m._xMax) || 100;
    /* Ideal curve in SCORE space: score(x, idealY(x)) — same function as actual */
    var nSamp = opts.nSamples || 40;
    var xs = linspace(0, dxMax, nSamp);
    if (xs[0] === 0 && (m.id === 'debtPay' || m.id === 'moneyToHappy')) xs[0] = Math.max(dxMax * 0.002, 0.01);
    var idealScorePts = xs.map(function (x) {
      var yModel = fit.idealY(x);
      return { x: x, y: scoreAt(x, yModel) };
    });

    /* Actual points: score(place.x, place.y) — correlated to X only through the real score law */
    var actualPts = landings.map(function (lp, idx) {
      var sc = scoreAt(lp.x, lp.y, { name: lp.name, apr: lp.apr });
      var scIdeal = scoreAt(lp.x, fit.idealY(lp.x), { name: lp.name, apr: lp.apr });
      return {
        x: lp.x,
        y: sc,
        yIdeal: scIdeal,
        resid: sc - scIdeal,
        name: lp.name,
        color: OVERLAY_COLORS[idx % OVERLAY_COLORS.length],
        placeY: lp.y
      };
    });

    /* ±1σ of score residuals */
    var sd = 0;
    if (actualPts.length >= 2) {
      var sse = 0;
      for (ci = 0; ci < actualPts.length; ci++) sse += actualPts[ci].resid * actualPts[ci].resid;
      /* also use board calibrate points in score space when available */
      sd = Math.sqrt(sse / actualPts.length);
    } else if (calPlace.length >= 2) {
      var sse2 = 0;
      for (ci = 0; ci < calPlace.length; ci++) {
        var scA = scoreAt(calPlace[ci].x, calPlace[ci].y);
        var scI = scoreAt(calPlace[ci].x, fit.idealY(calPlace[ci].x));
        sse2 += (scA - scI) * (scA - scI);
      }
      sd = Math.sqrt(sse2 / calPlace.length);
    }

    /* Pearson r(x, score) — honesty meter */
    function pearson(pts) {
      var n = pts.length;
      if (n < 3) return null;
      var sx = 0, sy = 0, i;
      for (i = 0; i < n; i++) { sx += pts[i].x; sy += pts[i].y; }
      var mx = sx / n, my = sy / n;
      var num = 0, dx2 = 0, dy2 = 0;
      for (i = 0; i < n; i++) {
        var ax = pts[i].x - mx, ay = pts[i].y - my;
        num += ax * ay; dx2 += ax * ax; dy2 += ay * ay;
      }
      if (dx2 < 1e-12 || dy2 < 1e-12) return 0;
      return num / Math.sqrt(dx2 * dy2);
    }
    var rBoard = null;
    if (calPlace.length >= 3) {
      var boardScorePts = calPlace.map(function (p) {
        return { x: p.x, y: scoreAt(p.x, p.y) };
      });
      rBoard = pearson(boardScorePts);
    }
    var rSel = pearson(actualPts);

    var yPeak = 0;
    for (ci = 0; ci < idealScorePts.length; ci++) yPeak = Math.max(yPeak, idealScorePts[ci].y + 2 * sd);
    for (ci = 0; ci < actualPts.length; ci++) yPeak = Math.max(yPeak, actualPts[ci].y);
    if (!(yPeak > 0)) yPeak = 1;

    var multi = actualPts.length > 1;
    var W = 420, H = multi ? 290 : 270, padL = 52, padR = 18, padT = 28, padB = multi ? 78 : 58;
    var plotW = W - padL - padR;
    var plotH = H - padT - padB;
    function sx(x) {
      return padL + clamp(Math.abs(Number(x)) / dxMax, 0, 1) * plotW;
    }
    function sy(y) {
      return padT + (1 - clamp(Math.abs(Number(y)) / yPeak, 0, 1)) * plotH;
    }
    function pathFrom(pts) {
      var d = '', started = false, j;
      for (j = 0; j < pts.length; j++) {
        if (!pts[j] || !isFinite(Number(pts[j].x)) || !isFinite(Number(pts[j].y))) continue;
        var px = sx(pts[j].x), py = sy(pts[j].y);
        d += (started ? 'L' : 'M') + px.toFixed(1) + ',' + py.toFixed(1) + ' ';
        started = true;
      }
      return d.trim();
    }

    var idealD = pathFrom(idealScorePts);
    var bandHtml = '';
    if (sd > 0 && idealScorePts.length) {
      var up = [], dn = [], si;
      for (si = 0; si < idealScorePts.length; si++) {
        up.push({ x: idealScorePts[si].x, y: idealScorePts[si].y + sd });
        dn.push({ x: idealScorePts[si].x, y: Math.max(0, idealScorePts[si].y - sd) });
      }
      var bandD = pathFrom(up.concat(dn.reverse()));
      if (bandD) bandHtml = '<path d="' + bandD + ' Z" fill="#7aa2f7" opacity="0.14" stroke="none"/>';
    }

    var marks = '';
    var legend = '<text x="' + padL + '" y="' + (H - 18)
      + '" fill="#7aa2f7" font-size="10" font-family="JetBrains Mono,monospace">— — ideal score</text>';
    for (ci = 0; ci < actualPts.length; ci++) {
      var p = actualPts[ci];
      var lx = sx(p.x), ly = sy(p.y), liy = sy(p.yIdeal);
      marks += '<line x1="' + lx.toFixed(1) + '" y1="' + liy.toFixed(1)
        + '" x2="' + lx.toFixed(1) + '" y2="' + ly.toFixed(1)
        + '" stroke="' + p.color + '" stroke-width="1.2" stroke-dasharray="3 3" opacity="0.75"/>';
      marks += '<circle cx="' + lx.toFixed(1) + '" cy="' + liy.toFixed(1)
        + '" r="3.5" fill="none" stroke="#7aa2f7" stroke-width="1.3"/>';
      marks += '<circle cx="' + lx.toFixed(1) + '" cy="' + ly.toFixed(1)
        + '" r="5" fill="' + p.color + '" stroke="#c0caf5" stroke-width="1.2"/>';
      marks += '<text x="' + Math.min(lx + 7, W - 95).toFixed(1) + '" y="'
        + Math.max(ly - 7, padT + 12).toFixed(1)
        + '" fill="' + p.color + '" font-size="9" font-family="JetBrains Mono,monospace">'
        + esc(String(p.name).slice(0, 16)) + '</text>';
      if (multi) {
        legend += '<text x="' + Math.min(padL + 100 + ci * 72, W - 60) + '" y="' + (H - 18)
          + '" fill="' + p.color + '" font-size="9" font-family="JetBrains Mono,monospace">● '
          + esc(String(p.name).slice(0, 8)) + '</text>';
      }
    }

    var ax = m.axes || {};
    var xLab = (ax.x && ax.x.label) || 'x';
    if (ax.x && ax.x.unit) xLab += ' (' + ax.x.unit + ')';
    var yLab = m.id + ' score';

    var titleBit = multi
      ? (m.id + ' · score · ' + actualPts.length + ' selected')
      : (m.id + ' · score vs ' + ((ax.x && ax.x.key) || 'x'));

    var rTxt = function (r) {
      if (r == null || !isFinite(r)) return 'n/a';
      return (r >= 0 ? '+' : '') + r.toFixed(2);
    };

    var svg = '<svg class="preview-svg run-jm-svg" viewBox="0 0 ' + W + ' ' + H
      + '" role="img" aria-label="' + esc(titleBit) + '">'
      + '<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="#0d0f14" rx="6"/>'
      + '<text x="' + padL + '" y="18" fill="#c0caf5" font-size="11" font-family="JetBrains Mono,monospace">'
      + esc(titleBit) + '</text>'
      + '<line x1="' + padL + '" y1="' + (padT + plotH) + '" x2="' + (padL + plotW)
      + '" y2="' + (padT + plotH) + '" stroke="#565f89" stroke-width="1"/>'
      + '<line x1="' + padL + '" y1="' + padT + '" x2="' + padL + '" y2="'
      + (padT + plotH) + '" stroke="#565f89" stroke-width="1"/>'
      + bandHtml
      + (idealD
        ? ('<path d="' + idealD + '" fill="none" stroke="#7aa2f7" stroke-width="2.2" '
          + 'stroke-dasharray="7 5" stroke-linejoin="round" stroke-linecap="round"/>')
        : '')
      + marks
      + legend
      + '<text x="' + (padL + plotW / 2) + '" y="' + (H - 34)
      + '" text-anchor="middle" fill="#9aa5ce" font-size="10">' + esc(xLab) + '</text>'
      + '<text x="14" y="' + (padT + plotH / 2)
      + '" text-anchor="middle" fill="#9aa5ce" font-size="10" '
      + 'transform="rotate(-90 14 ' + (padT + plotH / 2) + ')">' + esc(yLab) + '</text>'
      + '<text x="' + padL + '" y="' + (padT + plotH + 14)
      + '" fill="#565f89" font-size="9">0</text>'
      + '<text x="' + (padL + plotW) + '" y="' + (padT + plotH + 14)
      + '" text-anchor="end" fill="#565f89" font-size="9">'
      + (dxMax >= 100 ? dxMax.toFixed(0) : dxMax.toFixed(1)) + '</text>'
      + '<text x="' + (padL - 4) + '" y="' + (padT + 10)
      + '" text-anchor="end" fill="#565f89" font-size="9">'
      + (yPeak >= 100 ? yPeak.toFixed(0) : yPeak.toFixed(2)) + '</text>'
      + '</svg>';

    var focus = actualPts[0];
    var portionNote = opts.portion
      ? (' · portion ' + (opts.portion.label || opts.portion.id || ''))
      : '';
    var annot = 'Y=jmethod score (not raw happy/$) · ±1σ=' + esc(sd.toFixed(3))
      + ' · r(x,score) board=' + esc(rTxt(rBoard))
      + ' sel=' + esc(rTxt(rSel));
    if (focus) {
      annot += ' · ' + esc(String(focus.name).slice(0, 18))
        + ' score=' + esc(focus.y.toFixed(3))
        + ' ideal=' + esc(focus.yIdeal.toFixed(3))
        + ' z=' + esc(sd > 0 ? (focus.resid / sd).toFixed(2) : 'n/a');
    }

    var srcNote = (m.fromBlueprint || m._source === 'blueprint')
      ? (' · source blueprint (view.out' + (m._idealYSource === 'wired' ? ' · wired idealY' : (m._idealYSource === 'blob-fallback' ? ' · curve blob' : '')) + ')')
      : (opts.viewNote || '');
    if (opts.viewNote && srcNote.indexOf(opts.viewNote) < 0 && !(m.fromBlueprint || m._source === 'blueprint')) {
      srcNote += opts.viewNote;
    } else if (opts.viewNote && (m.fromBlueprint || m._source === 'blueprint') && opts.viewNote.indexOf('3D') >= 0) {
      srcNote += opts.viewNote;
    }
    return '<div class="preview-viz preview-viz-2d run-jm-viz preview-viz-score">'
      + '<div class="preview-viz-label">RunJMethods · score-space · '
      + esc(m.id) + portionNote + esc(srcNote) + '</div>'
      + svg
      + '<p class="preview-annot">' + annot + '</p></div>';
  }

  var api = {
    list: list,
    get: get,
    score: score,
    vizHtml: vizHtml,
    calibrateFromPoints: calibrateFromPoints,
    mathFromCalibrateFit: mathFromCalibrateFit,
    register: register,
    unregister: unregister,
    buildFromMath: buildFromMath,
    registerBuiltinFromBlueprint: registerBuiltinFromBlueprint,
    hydrateBuiltinsFromBlueprints: hydrateBuiltinsFromBlueprints,
    parityCheckBuiltin: parityCheckBuiltin,
    parityCheckIdealY: parityCheckIdealY,
    parityCheckPlace: parityCheckPlace,
    mathFormulaText: mathFormulaText,
    idealYFromMath: idealYFromMath,
    suggestMathFromPaper: suggestMathFromPaper,
    normalizeMath: normalizeMath,
    scoreFromRecipe: scoreFromRecipe,
    normalizeScoreMode: normalizeScoreMode,
    SCORE_MODES: SCORE_MODES,
    isBuiltin: isBuiltin,
    methods: METHODS,
    BUILTIN_IDS: BUILTIN_IDS,
    BUILTIN_PLACES: BUILTIN_PLACES
  };

  global.RunJMethods = api;

  if (typeof module !== 'undefined' && module.exports && !module.exports.JBlueprint) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
