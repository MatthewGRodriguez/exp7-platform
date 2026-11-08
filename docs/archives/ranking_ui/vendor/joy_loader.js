/**
 * joy_loader.js — load ranking_ui/joys/* into RankingJoys + JoyFactors.
 * Joys are owned by this project; living-core authors them via bridge.
 *
 * Browser: include after joy_factors.js. For static servers without dir listing,
 * fetches joys/index.json then each joy's jmethod.js (+ relations.json).
 */
(function (global) {
  'use strict';

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = function () { resolve(src); };
      s.onerror = function () { reject(new Error('failed ' + src)); };
      document.head.appendChild(s);
    });
  }

  async function loadAll(base) {
    base = base || './joys';
    var root = base.replace(/\/?$/, '/');
    global.RankingJoys = global.RankingJoys || {};
    var catalog = { ok: false, joys: [], loaded: [], errors: [], relations: [] };
    try {
      var res = await fetch(root + 'index.json', { cache: 'no-store' });
      if (!res.ok) throw new Error('index ' + res.status);
      var index = await res.json();
      catalog.index = index;
      var list = index.joys || [];
      for (var i = 0; i < list.length; i++) {
        var j = list[i];
        var id = j.id || j;
        try {
          await loadScript(root + id + '/jmethod.js');
          catalog.loaded.push(id);
          if (global.JoyFactors && global.RankingJoys[id] && global.RankingJoys[id].score) {
            global.JoyFactors.registerFactor(id, global.RankingJoys[id].score);
          }
        } catch (e) {
          catalog.errors.push({ id: id, error: String(e && e.message || e) });
        }
      }
      try {
        var rres = await fetch(root + 'relations.json', { cache: 'no-store' });
        if (rres.ok) {
          var rel = await rres.json();
          catalog.relations = rel.edges || rel.relations || [];
          catalog.relationsMeta = rel;
        }
      } catch (_re) { /* optional */ }
      try {
        var ares = await fetch(root + 'calendar_actions.json', { cache: 'no-store' });
        if (ares.ok) {
          var acts = await ares.json();
          catalog.calendarActions = acts;
          global.__CALENDAR_ACTIONS__ = acts;
        }
      } catch (_ae) { /* optional */ }
      catalog.ok = true;
      catalog.joys = list;
    } catch (e) {
      catalog.error = String(e && e.message || e);
    }
    global.__RANKING_JOYS_CATALOG__ = catalog;
    return catalog;
  }

  global.RankingJoyLoader = { loadAll: loadAll };
})(typeof window !== 'undefined' ? window : globalThis);
