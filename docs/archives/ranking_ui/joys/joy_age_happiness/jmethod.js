/**
 * joy_age_happiness — Age ↔ happiness weight
 * polarity: neutral
 * Authored via living-core ranking_bridge into ranking_ui (separate project).
 */
(function (global) {
  'use strict';
  function score(ctx) {
    ctx = ctx || {};
    if (global.JoyFactors && typeof global.JoyFactors.scoreAgeTick === 'function' && (ctx.mode === 'tick' || (ctx.x != null && ctx.y == null))) {
      return global.JoyFactors.scoreAgeTick(ctx);
    }
    var total = Number(ctx.monthsTotal) || 156;
    var lived = ctx.monthsLived != null ? ctx.monthsLived : (Number(ctx.monthIndex) || 0);
    var t = Math.max(0, Math.min(1, lived / Math.max(total, 1)));
    var youth = 0.85 + 0.35 * (1 - t);
    var scarcity = 0.7 + 0.9 * t;
    var hW = 0.45 * youth + 0.55 * scarcity;
    var happy = Math.abs(Number(ctx.y) != null && ctx.y !== '' && !isNaN(Number(ctx.y)) ? Number(ctx.y) : (Number(ctx.x) || 1));
    return Math.sqrt(Math.max(happy, 0) + 1e-9) * hW;
  }
  var api = { id: "joy_age_happiness", title: "Age ↔ happiness weight", polarity: "neutral", score: score };
  if (typeof module !== 'undefined' && module.exports && !module.exports.JBlueprint) {
    module.exports = api;
  } else if (typeof module !== "undefined" && module.exports) {
    module.exports.RankingJoy = module.exports.RankingJoy || {};
    module.exports.RankingJoy["joy_age_happiness"] = api;
  }
  global.RankingJoys = global.RankingJoys || {};
  global.RankingJoys["joy_age_happiness"] = api;
  if (global.JoyFactors && typeof global.JoyFactors.registerFactor === 'function') {
    global.JoyFactors.registerFactor("joy_age_happiness", score);
  }
})(typeof window !== 'undefined' ? window : globalThis);
