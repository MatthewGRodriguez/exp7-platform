/**
 * household_economy.js — browser runner for multi-perspective household JWorld.
 * Shared: money, debt, happy, care, public_good
 * Perspectives: matthew / partner / child (same Map)
 * Score lens: household + public stocks (not Matthew-only).
 *
 * Depends on window.__JF_EXP6__ (JBlueprint, JWorld, JIndirect, JDirect, JNeutral).
 * Registers RunJMethods id: householdEconomy when present.
 */
(function (global) {
  'use strict';

  function api() {
    var exp = global.__JF_EXP6__ || {};
    return {
      JBlueprint: global.JBlueprint || exp.JBlueprint,
      JWorld: global.JWorld || exp.JWorld,
      JIndirect: exp.JIndirect || global.JIndirect,
      JDirect: exp.JDirect || global.JDirect,
      JNeutral: exp.JNeutral || global.JNeutral
    };
  }

  function resetGate(rel) {
    if (!rel || typeof rel.updateInject !== 'function') return;
    rel._jmax = 0;
    if (rel.sequence && rel.sequence.jgroup) rel.sequence.jgroup.length = 0;
  }

  function snap(bp) {
    function g(n) {
      try { return bp.get(n); } catch (e) { return 0; }
    }
    return {
      money: g('money'),
      debt: g('debt'),
      happy: g('happy'),
      care: g('care'),
      public_good: g('public_good'),
      m_career: g('m_career'),
      p_skill: g('p_skill'),
      c_human: g('c_human')
    };
  }

  function delta(before, after) {
    var d = {};
    Object.keys(before).forEach(function (k) {
      d[k] = (after[k] != null ? after[k] : 0) - (before[k] != null ? before[k] : 0);
    });
    return d;
  }

  /**
   * Household / public net → 0..1 score.
   * Weights lean shared + public_good; private career is a light prior only.
   */
  function netScore(d, weights) {
    weights = weights || {};
    var wMoney = weights.money != null ? weights.money : 0.35;
    var wPg = weights.public_good != null ? weights.public_good : 0.25;
    var wCare = weights.care != null ? weights.care : 0.15;
    var wHappy = weights.happy != null ? weights.happy : 0.1;
    var wHum = weights.c_human != null ? weights.c_human : 0.12;
    var wDebt = weights.debt != null ? weights.debt : 0.08; // debt down = good
    // normalize rough scales from tiny DAYS×HOURS sample
    var moneyN = Math.max(-1, Math.min(1, (d.money || 0) / 400));
    var pgN = Math.max(-1, Math.min(1, (d.public_good || 0) / 20));
    var careN = Math.max(-1, Math.min(1, (d.care || 0) / 15));
    var happyN = Math.max(-1, Math.min(1, (d.happy || 0) / 10));
    var humN = Math.max(-1, Math.min(1, (d.c_human || 0) / 10));
    var debtN = Math.max(-1, Math.min(1, -(d.debt || 0) / 40)); // lower debt → +
    var raw =
      wMoney * moneyN +
      wPg * pgN +
      wCare * careN +
      wHappy * happyN +
      wHum * humN +
      wDebt * debtN;
    // map [-1,1] → [0,1]
    return Math.max(0, Math.min(1, 0.5 + 0.5 * raw));
  }

  function inferOpts(ctx) {
    ctx = ctx || {};
    var act = ctx.act || {};
    var name = String(act.name || ctx.name || '').toLowerCase();
    var id = String(act.id || '').toLowerCase();
    var opts = {
      days: 2,
      hours: 2,
      years: 1,
      matthew: true,
      partner: true,
      child: true,
      selfless: true,
      weights: null
    };
    if (name.indexOf('selfless') >= 0 || id.indexOf('selfless') >= 0 || name.indexOf('public good') >= 0) {
      opts.child = false;
      opts.partner = false;
      opts.selfless = true;
      opts.weights = { money: 0.15, public_good: 0.55, care: 0.05, happy: 0.1, c_human: 0.05, debt: 0.1 };
    } else if (name === 'house' || id.indexOf('house') >= 0 && name.indexOf('piti') < 0) {
      opts.child = false;
      opts.selfless = false;
      opts.weights = { money: 0.4, public_good: 0.05, care: 0.1, happy: 0.15, c_human: 0.05, debt: 0.25 };
    } else if (name.indexOf('piti') >= 0 || name.indexOf('mortgage') >= 0) {
      opts.child = false;
      opts.selfless = false;
      opts.weights = { money: 0.35, public_good: 0.05, care: 0.1, happy: 0.1, c_human: 0.05, debt: 0.35 };
    } else if (name.indexOf('grocer') >= 0) {
      opts.selfless = false;
      opts.weights = { money: 0.25, public_good: 0.05, care: 0.35, happy: 0.2, c_human: 0.1, debt: 0.05 };
    } else if (name.indexOf('partner') >= 0 || name.indexOf('family time') >= 0) {
      opts.selfless = false;
      opts.weights = { money: 0.15, public_good: 0.1, care: 0.3, happy: 0.3, c_human: 0.1, debt: 0.05 };
    } else if (name === 'family' || id.indexOf('family') >= 0) {
      opts.selfless = true;
      opts.weights = { money: 0.25, public_good: 0.15, care: 0.2, happy: 0.15, c_human: 0.2, debt: 0.05 };
    }
    if (act.householdDays != null) opts.days = +act.householdDays || opts.days;
    if (act.householdHours != null) opts.hours = +act.householdHours || opts.hours;
    if (act.householdYears != null) opts.years = +act.householdYears || opts.years;
    return opts;
  }

  function build(opts) {
    opts = opts || {};
    var A = api();
    if (!A.JBlueprint || !A.JWorld || !A.JIndirect || !A.JDirect || !A.JNeutral) {
      throw new Error('HouseholdEconomy: JFactor Exp6 (JWorld/JBlueprint/methods) not on window');
    }
    var DAYS = Math.max(1, parseInt(opts.days != null ? opts.days : 2, 10) || 2);
    var HOURS = Math.max(1, parseInt(opts.hours != null ? opts.hours : 2, 10) || 2);
    var YEARS = Math.max(1, parseInt(opts.years != null ? opts.years : 1, 10) || 1);
    var wantM = opts.matthew !== false;
    var wantP = opts.partner !== false;
    var wantC = opts.child !== false;
    var wantSelfless = opts.selfless !== false;

    var bp = A.JBlueprint.create()
      .resource('money', { start: 2500 })
      .resource('debt', { kind: 'joy', start: 500, polarity: '-' })
      .resource('happy', { kind: 'joy', start: 20 })
      .resource('care', { kind: 'joy', start: 10 })
      .resource('public_good', { kind: 'joy', start: 0 })
      .resource('m_energy', { kind: 'joy', start: 0 })
      .resource('m_daylight', { gate: true })
      .resource('m_fuel', { gate: true })
      .resource('m_dayDone', { gate: true })
      .resource('m_career', { kind: 'joy', start: 0 })
      .resource('p_energy', { kind: 'joy', start: 0 })
      .resource('p_daylight', { gate: true })
      .resource('p_fuel', { gate: true })
      .resource('p_dayDone', { gate: true })
      .resource('p_skill', { kind: 'joy', start: 5 })
      .resource('c_energy', { kind: 'joy', start: 0 })
      .resource('c_daylight', { gate: true })
      .resource('c_fuel', { gate: true })
      .resource('c_dayDone', { gate: true })
      .resource('c_human', { kind: 'joy', start: 1 })
      .resource('c_yearDone', { gate: true })
      .methodFrom('bridge', A.JIndirect, 2)
      .methodFrom('trade', A.JDirect, 2)
      .methodFrom('mark', A.JNeutral, 2);

    var matthew = null;
    var partner = null;
    var child = null;

    if (wantM) {
      var mHour = bp.layer('M_Hour', { atomic: true })
        .do('M_Sleep', { method: 'bridge', from: 'm_daylight', to: 'm_energy', x: 1, y: -40 })
        .do('M_Work', { method: 'bridge', from: 'm_energy', to: 'money', x: 30, y: -70, after: 'M_Sleep' });
      if (wantSelfless) {
        mHour.do('M_Selfless', { method: 'bridge', from: 'm_energy', to: 'public_good', x: 6, y: -4, after: 'M_Work' });
      }
      mHour.repeat(HOURS);
      bp.layer('M_Day', { atomic: true })
        .do('M_Dawn', { method: 'bridge', from: 'm_fuel', to: 'm_daylight', x: 1, y: -HOURS })
        .include('M_Hour')
        .do('M_Dusk', { method: 'bridge', from: 'm_dayDone', to: 'happy', x: -1, y: -2 })
        .do('M_FuelRefund', { method: 'bridge', from: 'm_fuel', to: 'happy', x: -1, y: 0, after: 'M_Dusk' })
        .repeat(DAYS);
      bp.layer('MatthewCal', { atomic: false })
        .do('M_Open', { method: 'bridge', from: 'm_fuel', to: 'happy', x: -1, y: -1 })
        .include('M_Day')
        .do('M_Review', { method: 'mark', from: 'm_dayDone', to: 'm_career', x: DAYS, y: -1 })
        .repeat(1);
      matthew = bp.build('MatthewCal');
    }

    if (wantP) {
      bp.layer('P_Hour', { atomic: true })
        .do('P_Sleep', { method: 'bridge', from: 'p_daylight', to: 'p_energy', x: 1, y: -35 })
        .do('P_Earn', { method: 'bridge', from: 'p_energy', to: 'money', x: 22, y: -45, after: 'P_Sleep' })
        .do('P_Care', { method: 'bridge', from: 'p_energy', to: 'care', x: 10, y: -8, after: 'P_Earn' })
        .repeat(HOURS);
      bp.layer('P_Day', { atomic: true })
        .do('P_Dawn', { method: 'bridge', from: 'p_fuel', to: 'p_daylight', x: 1, y: -HOURS })
        .include('P_Hour')
        .do('P_Home', { method: 'trade', from: 'money', to: 'debt', x: 35, y: -12 })
        .do('P_Dusk', { method: 'bridge', from: 'p_dayDone', to: 'happy', x: -1, y: -1, after: 'P_Home' })
        .do('P_FuelRefund', { method: 'bridge', from: 'p_fuel', to: 'happy', x: -1, y: 0, after: 'P_Dusk' })
        .repeat(DAYS);
      bp.layer('PartnerCal', { atomic: false })
        .do('P_Open', { method: 'bridge', from: 'p_fuel', to: 'happy', x: -1, y: -1 })
        .include('P_Day')
        .do('P_Review', { method: 'mark', from: 'p_dayDone', to: 'p_skill', x: DAYS, y: -1 })
        .repeat(1);
      partner = bp.build('PartnerCal');
    }

    if (wantC) {
      bp.layer('C_Hour', { atomic: true })
        .do('C_Sleep', { method: 'bridge', from: 'c_daylight', to: 'c_energy', x: 1, y: -25 })
        .do('C_Need', { method: 'trade', from: 'care', to: 'money', x: 4, y: 8, after: 'C_Sleep' })
        .do('C_Learn', { method: 'bridge', from: 'c_energy', to: 'c_human', x: 5, y: -3, after: 'C_Need' })
        .repeat(HOURS);
      bp.layer('C_Day', { atomic: true })
        .do('C_Dawn', { method: 'bridge', from: 'c_fuel', to: 'c_daylight', x: 1, y: -HOURS })
        .include('C_Hour')
        .do('C_Dusk', { method: 'bridge', from: 'c_dayDone', to: 'happy', x: -1, y: -1 })
        .do('C_FuelRefund', { method: 'bridge', from: 'c_fuel', to: 'happy', x: -1, y: 0, after: 'C_Dusk' })
        .repeat(DAYS);
      bp.layer('C_Year', { atomic: true })
        .do('C_YearOpen', { method: 'bridge', from: 'c_yearDone', to: 'c_human', x: -1, y: -1 })
        .include('C_Day')
        .do('C_Contribute', { method: 'bridge', from: 'c_human', to: 'money', x: 3, y: -15, after: 'C_YearOpen' })
        .repeat(YEARS);
      bp.layer('ChildCal', { atomic: false })
        .do('C_Open', { method: 'bridge', from: 'c_fuel', to: 'happy', x: -1, y: -1 })
        .include('C_Year')
        .do('C_Review', { method: 'mark', from: 'c_dayDone', to: 'c_human', x: DAYS, y: -1 })
        .repeat(1);
      child = bp.build('ChildCal');
    }

    ;['m_daylight', 'm_fuel', 'm_dayDone', 'p_daylight', 'p_fuel', 'p_dayDone',
      'c_daylight', 'c_fuel', 'c_dayDone', 'c_yearDone'].forEach(function (n) {
      resetGate(bp.resources.get(n));
    });
    bp.resources.get('m_energy').jmax = 0;
    bp.resources.get('p_energy').jmax = 0;
    bp.resources.get('c_energy').jmax = 0;

    var world = A.JWorld.fromBlueprint(bp);
    if (matthew) world.perspective('matthew', matthew);
    if (partner) world.perspective('partner', partner);
    if (child) world.perspective('child', child);

    return { bp: bp, world: world, matthew: matthew, partner: partner, child: child, days: DAYS, hours: HOURS, years: YEARS };
  }

  function run(opts) {
    opts = opts || {};
    var built = build(opts);
    var before = snap(built.bp);
    built.world.run();
    var after = snap(built.bp);
    var d = delta(before, after);
    var score = netScore(d, opts.weights);
    return {
      before: before,
      after: after,
      delta: d,
      score: score,
      days: built.days,
      hours: built.hours,
      years: built.years,
      perspectives: {
        matthew: !!built.matthew,
        partner: !!built.partner,
        child: !!built.child
      }
    };
  }

  function idealY(x) {
    // PREVIEW curve: household intensity → net (peaks mid family load, not solo max)
    x = Math.max(0, Number(x) || 0);
    var t = x / 100;
    // inverted-U-ish toward shared household + public
    var y = 0.25 + 0.7 * (1 - Math.pow(2 * t - 1, 2)) * (0.55 + 0.45 * t);
    return Math.max(0, Math.min(1, y));
  }

  function scoreAct(ctx) {
    ctx = ctx || {};
    try {
      var opts = inferOpts(ctx);
      // intensity from act amount or ctx.x nudges years/days slightly for PREVIEW landings
      var x = ctx.x != null ? Number(ctx.x) : null;
      if (x != null && isFinite(x) && x > 0) {
        opts.hours = Math.max(1, Math.min(4, Math.round(1 + x / 50)));
      }
      var r = run(opts);
      return r.score;
    } catch (err) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('HouseholdEconomy.scoreAct failed', err);
      }
      return 0;
    }
  }

  function place(act, ctx) {
    ctx = ctx || {};
    var x = 40;
    if (act) {
      var once = Number(act.amountOnce) || 0;
      var mo = Number(act.amountMonthly) || 0;
      if (once > 0) x = Math.min(100, once / 200);
      else if (mo > 0) x = Math.min(100, mo / 30);
      else if (act.hours != null) x = Math.min(100, Number(act.hours) * 10);
    }
    if (ctx.x != null) x = Number(ctx.x);
    var y = idealY(x);
    try {
      y = scoreAct({ act: act, name: act && act.name, x: x });
    } catch (e) {}
    return { x: x, y: y };
  }

  function registerJMethod() {
    var RJ = global.RunJMethods;
    if (!RJ || typeof RJ.register !== 'function') return null;
    var def = {
      id: 'householdEconomy',
      label: 'Household economy (shared + perspectives)',
      fromBlueprint: true,
      replaceBuiltin: true,
      _source: 'blueprint',
      _xMax: 100,
      _yMax: 1,
      xLabel: 'household intensity',
      yLabel: 'household + public net',
      factorDim: 'Happy',
      idealY: function (x) { return idealY(x); },
      score: function (ctx) { return scoreAct(ctx); },
      place: place,
      placeFromBlueprint: true,
      axes: {
        x: { label: 'household intensity', max: 100 },
        y: { label: 'household + public net', max: 1 }
      }
    };
    return RJ.register(def);
  }

  var apiOut = {
    run: run,
    build: build,
    scoreAct: scoreAct,
    idealY: idealY,
    place: place,
    netScore: netScore,
    registerJMethod: registerJMethod,
    version: 'easy212'
  };
  global.HouseholdEconomy = apiOut;

  // Auto-register when RunJMethods already loaded
  if (global.RunJMethods) {
    try { registerJMethod(); } catch (e) {
      if (typeof console !== 'undefined' && console.warn) console.warn('HouseholdEconomy register', e);
    }
  }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
