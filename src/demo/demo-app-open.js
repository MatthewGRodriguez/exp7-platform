/* Demo application IIFE — chrome/tabs/proposals consumer of Exp7Views.
   View pipeline lives in src/exp7-views/ (not duplicated here). */
(function () {
  'use strict';
  try {
    var M = window.JAtlasModel, E = window.JAtlasEval, L = window.Exp7Circuit, P = window.Exp7Proposals, X = window.Exp7Sync;
    var $ = window.$;
    var esc = window.esc;
    var x7 = window.x7;
    var RISK_COL = window.RISK_COL;
    var RISK_TEXT = window.RISK_TEXT;
    var RISK_HT = window.RISK_HT;
    var te = new TextEncoder();
    var fmt = function (n) { return n.toLocaleString('en-US'); };
    function h64(s) {
      var a = 0x811c9dc5, b = 0x9e3779b9;
      for (var i = 0; i < s.length; i++) {
        var c = s.charCodeAt(i);
        a = Math.imul(a ^ c, 16777619) >>> 0;
        b = Math.imul(b ^ c, 2246822519) >>> 0;
        b = (b ^ (b >>> 13)) >>> 0;
      }
      return a.toString(16).padStart(8, '0') + b.toString(16).padStart(8, '0');
    }
    var setView = window.setView;
    var startRuntime = window.startRuntime;
    var jvStatus = window.jvStatus;
    var planRisk = window.planRisk;
    var riskOf = window.riskOf;
    var JVS = window.JVS;
    var viewOps = window.viewOps;
    var livePins = window.livePins;
    var diagText = window.diagText;
    var flagsOf = window.flagsOf;
    var where = window.where;
    var whereDay = window.whereDay;
    var planSide = window.planSide;
    var vbtns = window.vbtns;
    var discHTML = window.discHTML;
    var hostDoc = window.hostDoc;
    var PAGEERR = window.PAGEERR;
    /* build concatenates: demo-app-pre.js, demo-consume-views.js, demo-app-post.js */
