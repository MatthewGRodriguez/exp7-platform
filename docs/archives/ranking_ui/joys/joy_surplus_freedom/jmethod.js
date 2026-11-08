/**
 * joy_surplus_freedom — Surplus freedom (cash after living + debt)
 * polarity: produce
 * Authored via living-core ranking_bridge into ranking_ui (separate project).
 */
(function (global) {
  'use strict';
  function score(ctx) {
    ctx = ctx || {};
    // x = obligations (living+debt) or cost; y = surplus or free cash; X = net income
    var net = Math.max(Math.abs(Number(ctx.X != null ? ctx.X : ctx.net)) || 0, 0);
    var surplus = ctx.surplus != null ? Number(ctx.surplus) : (ctx.y != null ? Number(ctx.y) : 0);
    var out = ctx.outflow != null ? Math.abs(Number(ctx.outflow)) : Math.abs(Number(ctx.x) || 0);
    if (net > 0 && surplus === 0 && out > 0) surplus = net - out;
    var total = Number(ctx.monthsTotal) || 156;
    var lived = ctx.monthsLived != null ? ctx.monthsLived : (Number(ctx.monthIndex) || 0);
    var t = Math.max(0, Math.min(1, lived / Math.max(total, 1)));
    // age: late life values remaining freedom more (scarcity)
    var ageW = 0.7 + 0.9 * t;
    // freedom ratio: how much of net is free
    var ratio = net > 1e-6 ? surplus / net : (surplus > 0 ? 1 : 0);
    // soft log surplus (produce polarity — higher better)
    var freeGain = Math.log1p(Math.max(surplus, 0)) * ageW;
    // debt pressure if provided
    var apr = Number(ctx.apr) || 0;
    var debtPress = 1 + 4 * Math.max(0, Math.min(0.5, apr));
    // external
    var ext = 1;
    if (global.JoyFactors && typeof global.JoyFactors.externalFactor === 'function') {
      ext = global.JoyFactors.externalFactor(ctx.name || 'surplus', t, ctx.E, ctx.Emax);
    }
    // if deficit, score collapses
    if (surplus < 0) return Math.max(0.01, freeGain / (1 + Math.abs(surplus) / Math.max(net, 1)) / debtPress);
    return (freeGain * (0.5 + 0.5 * Math.max(0, ratio)) * ext) / debtPress;
  }
  var api = { id: "joy_surplus_freedom", title: "Surplus freedom (cash after living + debt)", polarity: "produce", score: score };
  if (typeof module !== 'undefined' && module.exports && !module.exports.JBlueprint) {
    module.exports = api;
  } else if (typeof module !== "undefined" && module.exports) {
    module.exports.RankingJoy = module.exports.RankingJoy || {};
    module.exports.RankingJoy["joy_surplus_freedom"] = api;
  }
  global.RankingJoys = global.RankingJoys || {};
  global.RankingJoys["joy_surplus_freedom"] = api;
  if (global.JoyFactors && typeof global.JoyFactors.registerFactor === 'function') {
    global.JoyFactors.registerFactor("joy_surplus_freedom", score);
  }
})(typeof window !== 'undefined' ? window : globalThis);
