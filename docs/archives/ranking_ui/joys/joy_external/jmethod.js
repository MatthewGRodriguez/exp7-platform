/**
 * joy_external — External noise (does not settle with age)
 * polarity: neutral
 * Authored via living-core ranking_bridge into ranking_ui (separate project).
 */
(function (global) {
  'use strict';
  function score(ctx) {
    ctx = ctx || {};
    var name = ctx.name || ctx.actionName || 'ext';
    var total = Number(ctx.monthsTotal) || 156;
    var lived = ctx.monthsLived != null ? ctx.monthsLived : (Number(ctx.monthIndex) || 0);
    var t = Math.max(0, Math.min(1, lived / Math.max(total, 1)));
    if (global.JoyFactors && typeof global.JoyFactors.externalFactor === 'function') {
      return global.JoyFactors.externalFactor(name, t, ctx.E, ctx.Emax != null ? ctx.Emax : 20);
    }
    var h = 2166136261;
    var s = String(name) + '|' + Math.floor(t * 100);
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    var u = ((h >>> 0) % 10000) / 10000;
    var noise = (u - 0.5) * 2 * 0.12;
    var ePress = 1;
    if (ctx.Emax && ctx.E != null) ePress = 1 + 0.15 * Math.max(0, Math.min(1, 1 - Number(ctx.E) / ctx.Emax));
    return 1 + noise * ePress;
  }
  var api = { id: "joy_external", title: "External noise (does not settle with age)", polarity: "neutral", score: score };
  if (typeof module !== 'undefined' && module.exports && !module.exports.JBlueprint) {
    module.exports = api;
  } else if (typeof module !== "undefined" && module.exports) {
    module.exports.RankingJoy = module.exports.RankingJoy || {};
    module.exports.RankingJoy["joy_external"] = api;
  }
  global.RankingJoys = global.RankingJoys || {};
  global.RankingJoys["joy_external"] = api;
  if (global.JoyFactors && typeof global.JoyFactors.registerFactor === 'function') {
    global.JoyFactors.registerFactor("joy_external", score);
  }
})(typeof window !== 'undefined' ? window : globalThis);
