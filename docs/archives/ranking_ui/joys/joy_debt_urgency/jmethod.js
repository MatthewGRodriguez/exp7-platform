/**
 * joy_debt_urgency — Debt payment urgency
 * polarity: cost
 * Authored via living-core ranking_bridge into ranking_ui (separate project).
 */
(function (global) {
  'use strict';
  function score(ctx) {
    ctx = ctx || {};
    if (global.JoyFactors && typeof global.JoyFactors.scoreDebtPay === 'function') {
      return global.JoyFactors.scoreDebtPay(ctx);
    }
    var pay = Math.abs(Number(ctx.x) || 0);
    var principalRelief = Math.abs(Number(ctx.y) || 0);
    var apr = Number(ctx.apr) || 0;
    var interest = Number(ctx.interest) || 0;
    var M = Math.max(Math.abs(Number(ctx.X)) || 1, 1e-6);
    var urg = 1.5 + 8 * Math.max(0, Math.min(0.5, apr)) + 2 * (interest / Math.max(pay, 1e-6));
    var relief = Math.sqrt(principalRelief + pay * 0.25);
    var scarcity = 1 + pay / M;
    return (urg * relief) / scarcity;
  }
  var api = { id: "joy_debt_urgency", title: "Debt payment urgency", polarity: "cost", score: score };
  if (typeof module !== 'undefined' && module.exports && !module.exports.JBlueprint) {
    module.exports = api;
  } else if (typeof module !== "undefined" && module.exports) {
    module.exports.RankingJoy = module.exports.RankingJoy || {};
    module.exports.RankingJoy["joy_debt_urgency"] = api;
  }
  global.RankingJoys = global.RankingJoys || {};
  global.RankingJoys["joy_debt_urgency"] = api;
  if (global.JoyFactors && typeof global.JoyFactors.registerFactor === 'function') {
    global.JoyFactors.registerFactor("joy_debt_urgency", score);
  }
})(typeof window !== 'undefined' ? window : globalThis);
