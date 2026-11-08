/**
 * joy_factors.js — realistic relationship scoring for HDAME joys.
 *
 * Used by Joy Sheet live blueprint run() and composite rank scores.
 * Calendar/day-use view is intentionally deferred (D = capacity only for now).
 *
 * Living-core can later discover more joys and plug into `registerFactor`.
 *
 * Factors (v1):
 *  - Money depreciates / diminishing marginal utility (time preference)
 *  - Age modulates happiness value (young ≠ old)
 *  - External stays noisy (randomness does not "settle" with age)
 *  - Days (calendar) paused — D used as time capacity weight only
 */
(function (global) {
  'use strict';

  var factors = Object.create(null);

  function clamp(x, a, b) {
    if (x < a) return a;
    if (x > b) return b;
    return x;
  }

  /** Stable 0–1 hash from string (external randomness seed). */
  function hash01(s) {
    var h = 2166136261;
    s = String(s || '');
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return ((h >>> 0) % 10000) / 10000;
  }

  /**
   * Age progress in [0,1]: 0 = young / start of horizon, 1 = old / end.
   * monthsLived optional; else use fraction of horizon consumed.
   */
  function ageT(ctx) {
    var total = Number(ctx.monthsTotal) || 156;
    var lived = ctx.monthsLived;
    if (lived == null) lived = Number(ctx.monthIndex) || 0;
    return clamp(lived / Math.max(total, 1), 0, 1);
  }

  /**
   * Happiness marginal value vs age.
   * Youth: more exploratory weight; later life: scarcity of remaining time.
   * Combined inverted-U + late scarcity: peaks mid-late.
   */
  function happinessAgeWeight(t) {
    t = clamp(t, 0, 1);
    var youth = 0.85 + 0.35 * (1 - t); // young values experience
    var scarcity = 0.7 + 0.9 * t; // age values remaining happiness more
    // blend: mid-life peak
    return 0.45 * youth + 0.55 * scarcity;
  }

  /**
   * Money: present-value depreciation + diminishing utility of spend.
   * Holding money loses real value over age progress (inflation / opportunity).
   * Spending has diminishing returns (sqrt) and higher opportunity cost when M low.
   */
  function moneyDisutility(cost, M, t, discountRate) {
    cost = Math.abs(Number(cost) || 0);
    M = Math.max(Number(M) || 1, 1e-6);
    t = clamp(t, 0, 1);
    discountRate = discountRate != null ? discountRate : 0.04; // ~4% real-ish annual, applied softly over horizon
    // depreciation of money's purchasing power as life progresses
    var dep = Math.pow(1 + discountRate, t * 10); // stronger late-horizon discount
    // opportunity cost: spend hurts more when cash is scarce
    var scarcity = 1 + (cost / M);
    // diminishing pain of extra dollars (log-ish)
    var pain = Math.log1p(cost) * scarcity * dep;
    return Math.max(pain, 1e-9);
  }

  /**
   * External: noise that does NOT dampen with age (still random).
   * Slightly more impact when resources tight (optional).
   */
  function externalFactor(name, t, E, Emax) {
    t = clamp(t, 0, 1);
    var u = hash01(name + '|' + Math.floor(t * 100));
    // centered noise ± amplitude; amplitude stays flat with age
    var amp = 0.12;
    var noise = (u - 0.5) * 2 * amp; // [-amp, amp]
    // external capacity pressure
    var ePress = 1;
    if (Emax && Emax > 0 && E != null) {
      ePress = 1 + 0.15 * clamp(1 - Number(E) / Emax, 0, 1);
    }
    return 1 + noise * ePress;
  }

  /**
   * Days / calendar (PAUSED full calendar view).
   * D acts as time capacity: actions that consume more days when D is low score worse.
   */
  function daysCapacityWeight(daysUsed, D, Dmax) {
    daysUsed = Math.abs(Number(daysUsed) || 0);
    D = Math.max(Number(D) || 1e-6, 1e-6);
    // later: calendar duration of use; for now linear scarcity
    return 1 / (1 + daysUsed / D);
  }

  /**
   * Core M→H spend score (realistic jmethod body).
   * ctx: { x, y, X, Y, get, name?, monthsTotal?, monthIndex?, discountRate? }
   */
  function scoreMoneyToHappy(ctx) {
    ctx = ctx || {};
    var cost = Math.abs(Number(ctx.x) || 0);
    var happy = Math.abs(Number(ctx.y) || 0);
    var M = ctx.X != null ? Math.abs(Number(ctx.X)) : 1;
    var H = ctx.Y != null ? Math.abs(Number(ctx.Y)) : 1;
    var t = ageT(ctx);
    var get = typeof ctx.get === 'function' ? ctx.get : null;
    var E = get ? get('E') : ctx.E;
    var D = get ? get('D') : ctx.D;
    if(D == null || !(Number(D) > 0)) D = ctx.Dmax != null ? ctx.Dmax : (365 / 12);
    var name = ctx.name || ctx.actionName || '';

    var hW = happinessAgeWeight(t);
    // happiness gain: age-weighted, mild diminishing returns
    var hGain = Math.sqrt(Math.max(happy, 0) + 1e-9) * hW * (1 + 0.02 * Math.log1p(H));

    var mCost = moneyDisutility(cost, M, t, ctx.discountRate);
    var ext = externalFactor(name, t, E, ctx.Emax != null ? ctx.Emax : 20);
    // calendar view paused: soft day weight only (don't zero scores when D unset)
    var daysUsed = ctx.daysUsed != null ? ctx.daysUsed : Math.min(cost * 0.01, D * 0.5);
    var dayW = daysCapacityWeight(daysUsed, D, ctx.Dmax);

    // higher = better trade; scale for FastBest numeric range
    return ((hGain + 1e-6) / mCost) * ext * dayW * 10;
  }

  /**
   * Age tick: aging always costs; external stays noisy; happiness residual value.
   * from A to E style or pure age consume.
   */
  function scoreAgeTick(ctx) {
    ctx = ctx || {};
    var t = ageT(ctx);
    var ageStep = Math.abs(Number(ctx.x) || 1);
    // aging is mandatory-ish: moderate positive so it can run, but not dominate spend
    var base = 0.15 / (1 + ageStep);
    var ext = externalFactor('age_tick', t, ctx.E, ctx.Emax);
    // late life: aging more "expensive" (lower score → less preferred than high-value spends)
    return base * ext * (1.1 - 0.4 * t);
  }

  /**
   * Debt payment urgency (higher APR / interest share → more urgent).
   */
  function scoreDebtPay(ctx) {
    ctx = ctx || {};
    var pay = Math.abs(Number(ctx.x) || 0);
    var principalRelief = Math.abs(Number(ctx.y) || 0);
    var apr = Number(ctx.apr) || 0;
    var interest = Number(ctx.interest) || 0;
    var M = Math.max(Math.abs(Number(ctx.X)) || 1, 1e-6);
    // urgency from APR + interest bite
    var urg = 1.5 + 8 * clamp(apr, 0, 0.5) + 2 * (interest / Math.max(pay, 1e-6));
    var relief = Math.sqrt(principalRelief + pay * 0.25);
    var scarcity = 1 + pay / M;
    return (urg * relief) / scarcity;
  }

  /**
   * Composite display score for an expense item from HDAME shares + realistic factors.
   * Returns 0–1-ish for % display (normalized later by caller if needed).
   */
  /**
   * Composite display score for an expense item.
   * Optional weights: { H:w, M:w, … } summing ~1 from factor-vs-factor ranks.
   * When weights provided, scoreRaw = Σ weight[d] * score{d} (skip w=0).
   * Legacy path keeps age/money/external shaping with hardcoded mixes.
   */
  function compositeItemScore(it, world, weights) {
    world = world || {};
    it = it || {};
    if (weights && typeof weights === 'object') {
      var rawW = 0;
      var keys = Object.keys(weights);
      for (var i = 0; i < keys.length; i++) {
        var d = keys[i];
        var w = Number(weights[d]) || 0;
        if (!(w > 0)) continue;
        var s = Number(it['score' + d]);
        if (!isFinite(s)) s = 0;
        rawW += w * s;
      }
      return Math.max(0, rawW);
    }
    var t = ageT(world);
    var sH = Number(it.scoreH) || 0;
    var sD = Number(it.scoreD) || 0;
    var sA = Number(it.scoreA) || 0;
    var sM = Number(it.scoreM) || 0;
    var sE = Number(it.scoreE) || 0;
    // Happiness good (age-weighted); days capacity good;
    // age/external/money costs reduce score (already inverted shares for A/E/M)
    var hW = happinessAgeWeight(t);
    var moneyPain = moneyDisutility(it.cost || 0, world.M || 1000, t, world.discountRate);
    var ext = externalFactor(it.name, t, world.E, world.Emax);
    // combine: happiness & days lift; inverted cost shares already small for "worse" tops
    // map to positive score for "keep this" preference
    var raw =
      0.42 * sH * hW +
      0.18 * sD +
      0.12 * sA + // inverted: high list cost age → small sA → lower composite when ranked costly
      0.18 * (1 / (1 + moneyPain * 0.15)) * (0.5 + 0.5 * (1 - sM)) +
      0.10 * sE * ext;
    return Math.max(0, raw);
  }

  function registerFactor(id, fn) {
    factors[id] = fn;
  }

  function listFactors() {
    return Object.keys(factors).concat([
      'happinessAgeWeight',
      'moneyDisutility',
      'externalFactor',
      'daysCapacityWeight',
      'scoreMoneyToHappy',
      'scoreAgeTick',
      'scoreDebtPay',
      'compositeItemScore'
    ]);
  }

  // room for living-core / future discoveries
  registerFactor('money_depreciation', moneyDisutility);
  registerFactor('happiness_age', happinessAgeWeight);
  registerFactor('external_noise', externalFactor);

  var api = {
    ageT: ageT,
    hash01: hash01,
    happinessAgeWeight: happinessAgeWeight,
    moneyDisutility: moneyDisutility,
    externalFactor: externalFactor,
    daysCapacityWeight: daysCapacityWeight,
    scoreMoneyToHappy: scoreMoneyToHappy,
    scoreAgeTick: scoreAgeTick,
    scoreDebtPay: scoreDebtPay,
    compositeItemScore: compositeItemScore,
    registerFactor: registerFactor,
    listFactors: listFactors,
    // calendar view deferred
    CALENDAR_VIEW: 'paused'
  };

  // Prefer global — do NOT replace module.exports (would wipe JFactor_exp6 in browser).
  global.JoyFactors = api;
  if (typeof module !== 'undefined' && module.exports && typeof module.exports === 'object') {
    if (!module.exports.JBlueprint) {
      // Node standalone require of this file only
      module.exports = api;
    } else {
      module.exports.JoyFactors = api;
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);
