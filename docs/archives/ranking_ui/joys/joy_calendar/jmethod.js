(function (global) {
  'use strict';
  function score(ctx) {
    ctx = ctx || {};
    var cost = Math.abs(Number(ctx.x) || 0);
    var happy = Math.abs(Number(ctx.y) || 0);
    var D = Math.max(Number(ctx.D) || 30, 1e-6);
    var daysUsed = Math.abs(Number(ctx.daysUsed) || 1);
    var hour = ctx.hour != null ? Number(ctx.hour) : 12;
    var workStart = ctx.workStart != null ? Number(ctx.workStart) : 15;
    var workEnd = ctx.workEnd != null ? Number(ctx.workEnd) : 23;
    var inWork = hour >= workStart && hour < workEnd && ctx.isWorkDay;
    var hourFit = inWork && ctx.kind !== "work" && !ctx.allowWorkHours ? 0.35 : 1;
    var cap = 1 / (1 + daysUsed / D);
    var gain = Math.sqrt(Math.max(happy, 0) + 1e-9);
    var pain = Math.log1p(cost);
    return ((gain + 1e-6) / Math.max(pain, 1e-9)) * cap * hourFit * 10;
  }
  var api = { id: "joy_calendar", title: "Calendar time (editable cadences · work CST)", polarity: "neutral", score: score };
  global.RankingJoys = global.RankingJoys || {};
  global.RankingJoys.joy_calendar = api;
  if (global.JoyFactors && global.JoyFactors.registerFactor) global.JoyFactors.registerFactor('joy_calendar', score);
  if (typeof module !== 'undefined' && module.exports && !module.exports.JBlueprint) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
