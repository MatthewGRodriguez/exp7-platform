/**
 * joy_money — Money (depreciation / spend utility)
 * polarity: cost
 * Authored via living-core ranking_bridge into ranking_ui (separate project).
 */
(function (global) {
  'use strict';
  function score(ctx) {
    ctx = ctx || {};
    if (global.JoyFactors && typeof global.JoyFactors.scoreMoneyToHappy === 'function') {
      return global.JoyFactors.scoreMoneyToHappy(ctx);
    }
    var cost = Math.abs(Number(ctx.x) || 0);
    var happy = Math.abs(Number(ctx.y) || 0);
    var M = Math.max(Math.abs(Number(ctx.X)) || 1, 1e-6);
    var total = Number(ctx.monthsTotal) || 156;
    var lived = ctx.monthsLived != null ? ctx.monthsLived : (Number(ctx.monthIndex) || 0);
    var t = Math.max(0, Math.min(1, lived / Math.max(total, 1)));
    var dep = Math.pow(1.04, t * 10);
    var pain = Math.log1p(cost) * (1 + cost / M) * dep;
    var hGain = Math.sqrt(Math.max(happy, 0) + 1e-9);
    if (cost < 1e-9) return hGain;
    return ((hGain + 1e-6) / Math.max(pain, 1e-9)) * 10;
  }
  var api = { id: "joy_money", title: "Money (depreciation / spend utility)", polarity: "cost", score: score };
  if (typeof module !== 'undefined' && module.exports && !module.exports.JBlueprint) {
    module.exports = api;
  } else if (typeof module !== "undefined" && module.exports) {
    module.exports.RankingJoy = module.exports.RankingJoy || {};
    module.exports.RankingJoy["joy_money"] = api;
  }
  global.RankingJoys = global.RankingJoys || {};
  global.RankingJoys["joy_money"] = api;
  if (global.JoyFactors && typeof global.JoyFactors.registerFactor === 'function') {
    global.JoyFactors.registerFactor("joy_money", score);
  }
})(typeof window !== 'undefined' ? window : globalThis);
