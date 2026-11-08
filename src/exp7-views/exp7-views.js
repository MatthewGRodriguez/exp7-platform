/* Exp7Views — canonical reusable Exp7 Calendar/Board/Plan feature.
 *
 * Presentation path (accepted Exp7): atlas/runtime builders (calHtml/boardHtml/planHtml)
 * produce HTML strings that are NEVER inserted as page DOM; JRViews layouts them into
 * JRender (WebGPU). This module owns that pipeline + host polish (criticality colors,
 * year→month→day navigation, board/plan interactions).
 *
 * Not the legacy offline-page factory invoke that writes app.innerHTML on the real document.
 */
(function (root) {
  'use strict';
  var MODULE_ID = 'exp7-views@1';
  var MODULE_NAME = 'exp7-views';

  function ensureUtils() {
    if (typeof root.$ !== 'function') {
      root.$ = function (id) { return document.getElementById(id); };
    }
    if (typeof root.esc !== 'function') {
      root.esc = function (s) {
        return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
          return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c];
        });
      };
    }
    if (typeof root.x7 !== 'function') {
      root.x7 = function (t) {
        return String(t == null ? '' : t).replace(/\bexp6\b/gi, 'Exp7');
      };
    }
  }

  function ensureTheme() {
    if (!root.EXP7_LIGHT_THEME) {
      root.EXP7_LIGHT_THEME = Object.freeze({
        surface: '#ffffff', subtle: '#f4f6fa', text: '#1c2333', muted: '#49556a',
        accent: '#75510f', border: '#8a96aa', selection: '#2458a6', anchor: '#6841a6',
        critical: '#fff0e7', moderate: '#fff6dc', low: '#e8f5ef',
        criticalText: '#8c3600', moderateText: '#6b4300', lowText: '#00664b',
        clear: [0, 0, 0, 0]
      });
    }
    if (!root.RISK_COL) {
      root.RISK_COL = { C: ['#D55E00', 'CRITICAL', '#fff0e7'], M: ['#E69F00', 'MODERATE', '#fff6dc'], L: ['#009E73', 'LOW', '#e8f5ef'] };
      root.RISK_TEXT = { C: '#8c3600', M: '#6b4300', L: '#00664b' };
      root.RISK_HT = { hc: 20, hm: 50, near: 0.10, base: 100, income: 80 };
    }
  }

  ensureUtils();
  ensureTheme();

  var _seq = 0;
  var _instances = Object.create(null);

  function requireDeps() {
    var missing = [];
    if (!root.JAtlasModel) missing.push('JAtlasModel');
    if (!root.JAtlasEval) missing.push('JAtlasEval');
    if (typeof root.JA_RUNTIME_FACTORY !== 'function') missing.push('JA_RUNTIME_FACTORY');
    if (!root.JRViews || typeof root.JRViews.View !== 'function') missing.push('JRViews');
    if (missing.length) {
      var err = new Error('Exp7Views missing dependency: ' + missing.join(', '));
      err.code = 'exp7-views-deps';
      throw err;
    }
  }

  function ensureHostId(host) {
    if (!host) throw new Error('Exp7Views.mount: host element required');
    if (!host.id) {
      _seq += 1;
      host.id = 'exp7view-' + _seq;
    }
    return host.id;
  }

  /**
   * Mount one Exp7 view into host.
   * @param {object} opts
   * @param {HTMLElement} opts.host
   * @param {object} opts.atlas - atlas/world snapshot (caller-owned; not demo seed)
   * @param {string[]} opts.root - e.g. ['comp:trip_calendar']
   * @param {'calendar'|'board'|'plan'|string} [opts.kind]
   * @param {boolean} [opts.readonly]
   * @param {function} [opts.onPropose] - (ops, meta) => entry|void ; replaces demo submit()
   * @param {function} [opts.onUpdate] - callback after draw (view state)
   * @param {function} [opts.onError]
   * @returns {object} handle
   */
  function mount(opts) {
    opts = opts || {};
    requireDeps();
    ensureUtils();
    ensureTheme();
    if (typeof root.setView !== 'function') {
      var e = new Error('Exp7Views host impl not loaded (setView missing)');
      e.code = 'exp7-views-host';
      throw e;
    }
    var host = opts.host;
    var id = ensureHostId(host);
    host.setAttribute('data-exp7-views', MODULE_ID);
    host.setAttribute('data-exp7-view-kind', opts.kind || 'view');

    var atlas = opts.atlas;
    if (!atlas || typeof atlas !== 'object') throw new Error('Exp7Views.mount: atlas required');
    var viewRoot = opts.root;
    if (!viewRoot || !viewRoot.length) throw new Error('Exp7Views.mount: root required');

    var onPropose = typeof opts.onPropose === 'function' ? opts.onPropose : null;
    var onUpdate = typeof opts.onUpdate === 'function' ? opts.onUpdate : null;
    var onError = typeof opts.onError === 'function' ? opts.onError : null;

    // Instance-scoped propose hook read by patched setView/onHtml path
    root.__exp7ViewsPropose = root.__exp7ViewsPropose || Object.create(null);
    root.__exp7ViewsPropose[id] = function (ops, proc, src) {
      if (onPropose) return onPropose(ops, { proc: proc || 'ui:views', src: src, hostId: id });
      return null;
    };

    function cb(V) {
      if (V && V.err && onError) onError(V.err, V);
      if (onUpdate) onUpdate(V);
    }

    root.setView(id, atlas, viewRoot, cb, !!opts.readonly);

    var handle = {
      id: id,
      moduleId: MODULE_ID,
      kind: opts.kind || null,
      host: host,
      update: function (nextAtlas, nextRoot) {
        if (nextAtlas) atlas = nextAtlas;
        if (nextRoot) viewRoot = nextRoot;
        root.setView(id, atlas, viewRoot, cb, !!opts.readonly);
        return handle;
      },
      getState: function () {
        return (root.JVS && root.JVS[id]) || null;
      },
      dispose: function () {
        dispose(handle);
      }
    };
    _instances[id] = handle;
    return handle;
  }

  function dispose(handleOrId) {
    var id = typeof handleOrId === 'string' ? handleOrId : (handleOrId && handleOrId.id);
    if (!id) return;
    var V = root.JVS && root.JVS[id];
    if (V) {
      try { if (V.sess && V.sess.dispose) V.sess.dispose(); } catch (e) {}
      try { if (V.view && V.view.dispose) V.view.dispose(); } catch (e) {}
      try {
        if (root.JRO && V.obs && root.JRO.unobserve) root.JRO.unobserve(V.obs);
      } catch (e) {}
      if (V.cv && V.cv.parentNode) {
        try { V.cv.remove(); } catch (e) {}
      }
      var box = root.document.getElementById(id);
      if (box) {
        var pe = box.querySelector('.jrerr');
        if (pe) pe.remove();
      }
      delete root.JVS[id];
    }
    if (root.__exp7ViewsPropose) delete root.__exp7ViewsPropose[id];
    delete _instances[id];
  }

  function disposeAll() {
    Object.keys(_instances).forEach(dispose);
  }

  function ready() {
    return Promise.resolve().then(function () {
      requireDeps();
      return api;
    });
  }

  /** Blank atlas with money calendar template — no demo seed/trip assumptions. */
  function blankMoneyAtlas(label, month) {
    requireDeps();
    var M = root.JAtlasModel;
    var w = M.empty(label || 'budget_atlas', label || 'Budget');
    w.owner = {};
    w.pathRev = {};
    w.rev = 1000;
    w.clock = { joy: 'syn_clock', ms: 1000, on: false };
    w.joys.syn_clock = { id: 'syn_clock', name: 'Clock', value: 0 };
    var T;
    if (typeof M.moneyCalendarTemplate === 'function') {
      T = M.moneyCalendarTemplate(w, label || 'Money', month);
    } else if (typeof M.calendarTemplate === 'function') {
      T = M.calendarTemplate(w, label || 'Calendar', month);
    } else {
      throw new Error('Exp7Views: calendarTemplate unavailable');
    }
    function cid(ref) { return String(ref).replace(/^comp:/, ''); }
    var calId = cid(T.cal), boardId = cid(T.board), planId = cid(T.plan);
    w.root = [T.cal, T.board, T.plan];
    w.meta = w.meta || {};
    w.meta.exp7Views = MODULE_ID;
    w.meta.calId = calId;
    w.meta.boardId = boardId;
    w.meta.planId = planId;
    return w;
  }

  function rootsFor(atlas) {
    var meta = (atlas && atlas.meta) || {};
    var cal = meta.calId || 'trip_calendar';
    var brd = meta.boardId || (cal + '_board');
    var plan = meta.planId || (cal + '_plan');
    // money template uses cal/board/plan ids from template; trip demo uses trip_calendar*
    if (atlas && atlas.components) {
      if (!atlas.components[cal] && atlas.components.trip_calendar) cal = 'trip_calendar';
      if (!atlas.components[brd] && atlas.components.trip_calendar_board) brd = 'trip_calendar_board';
      if (!atlas.components[plan] && atlas.components.reqs) plan = 'reqs';
      if (!atlas.components[plan] && atlas.components.trip_calendar_plan) plan = 'trip_calendar_plan';
    }
    return {
      calendar: ['comp:' + cal],
      board: ['comp:' + brd],
      plan: ['comp:' + plan],
      calId: cal,
      boardId: brd,
      planId: plan
    };
  }

  var api = {
    MODULE_ID: MODULE_ID,
    MODULE_NAME: MODULE_NAME,
    version: '1.0.0',
    presentation: 'runtime-html-string→JRViews→JRender',
    legacyDomPath: false,
    mount: mount,
    dispose: dispose,
    disposeAll: disposeAll,
    ready: ready,
    blankMoneyAtlas: blankMoneyAtlas,
    rootsFor: rootsFor,
    instances: function () { return Object.keys(_instances).slice(); },
    RISK_COL: root.RISK_COL,
    RISK_TEXT: root.RISK_TEXT,
    theme: function () { return root.EXP7_LIGHT_THEME; },
    utils: { $: function (id) { return root.$(id); }, esc: function (s) { return root.esc(s); }, x7: function (t) { return root.x7(t); } }
  };

  root.Exp7Views = api;
  return api;
})(typeof window !== 'undefined' ? window : globalThis);
