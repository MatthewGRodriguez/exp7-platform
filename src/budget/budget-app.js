/* Budget app — Exp7Views consumer (same module as Exp7 demo).
 * Isolated IDB (budget-app-v1). No demo chrome, no demo seed, no legacy
 * offline-page factory→innerHTML DOM presentation.
 */
(function () {
  'use strict';
  var DB_NAME = 'budget-app-v1';
  var TAB = 'cal';
  var BOARD_TYPE = 'expense';
  var W = null;
  var handles = { cal: null, brd: null, plan: null };
  var RISK_COL = window.RISK_COL || {
    C: ['#D55E00', 'CRITICAL', '#fff0e7'],
    M: ['#E69F00', 'MODERATE', '#fff6dc'],
    L: ['#009E73', 'LOW', '#e8f5ef']
  };
  var DEFAULT_THEME = { tokens: { bg: '#ffffff', fg: '#1c2333', accent: '#75510f' } };
  var DEFAULT_CRIT_STATES = {
    critical: { bg: RISK_COL.C[2], border: RISK_COL.C[0], sm: 'invalid', anim: 'shake', label: 'CRITICAL' },
    moderate: { bg: RISK_COL.M[2], border: RISK_COL.M[0], sm: 'idle', anim: 'none', label: 'MODERATE' },
    low: { bg: RISK_COL.L[2], border: RISK_COL.L[0], sm: 'idle', anim: 'none', label: 'LOW' },
    bad: { bg: RISK_COL.C[2], border: RISK_COL.C[0], sm: 'invalid', anim: 'shake', label: 'CRITICAL' },
    tight: { bg: RISK_COL.M[2], border: RISK_COL.M[0], sm: 'idle', anim: 'none', label: 'MODERATE' },
    busy: { bg: RISK_COL.M[2], border: RISK_COL.M[0], sm: 'idle', anim: 'none', label: '2+ items' },
    overload: { bg: RISK_COL.C[2], border: RISK_COL.C[0], sm: 'invalid', anim: 'shake', label: 'overload' },
    selected: { bg: '#e7eefb', border: '#2458a6', sm: 'idle', anim: 'none', label: 'SELECTED' }
  };

  function pub(p) {
    var d = Object.assign({ source: 'budget-app', v: 1 }, p);
    try { window.dispatchEvent(new CustomEvent('budget-app-signal', { detail: d })); } catch (e) {}
    try { window.postMessage(d, '*'); } catch (e) {}
  }
  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c];
    });
  }

  function db() {
    return new Promise(function (res, rej) {
      var q = indexedDB.open(DB_NAME, 1);
      q.onupgradeneeded = function () {
        var d = q.result;
        if (!d.objectStoreNames.contains('kv')) d.createObjectStore('kv');
      };
      q.onsuccess = function () { res(q.result); };
      q.onerror = function () { rej(q.error); };
    });
  }
  async function idbGet(k) {
    var d = await db();
    return await new Promise(function (res, rej) {
      var g = d.transaction('kv', 'readonly').objectStore('kv').get(k);
      g.onsuccess = function () { res(g.result || null); };
      g.onerror = function () { rej(g.error); };
    });
  }
  async function idbPut(k, v) {
    var d = await db();
    return await new Promise(function (res, rej) {
      var t = d.transaction('kv', 'readwrite');
      t.objectStore('kv').put(v, k);
      t.oncomplete = function () { res(); };
      t.onerror = function () { rej(t.error); };
    });
  }

  function applyDefaultViewStyling(w) {
    Object.values(w.components || {}).forEach(function (c) {
      if (!c || !c.view) return;
      c.view.theme = JSON.parse(JSON.stringify(DEFAULT_THEME));
      if (Array.isArray(c.view.states)) return;
      c.view.states = Object.assign({}, c.view.states || {}, DEFAULT_CRIT_STATES);
    });
  }

  function mkBudgetAtlas() {
    var EV = window.Exp7Views;
    var w = EV.blankMoneyAtlas('Budget');
    var R = EV.rootsFor(w);
    var cal = w.components[R.calId];
    var brd = w.components[R.boardId];
    var pln = w.components[R.planId];
    if (cal && cal.view) { cal.view.switch = false; cal.view.group = []; cal.state = cal.state || {}; cal.state.show = null; cal.sub = []; }
    if (brd && brd.view) {
      brd.view.item = { show: ['date', 'type', 'amount'] };
      brd.state = brd.state || {};
      brd.state.budgetType = BOARD_TYPE;
    }
    w.joys = w.joys || {};
    w.joys.priority_pool = { id: 'priority_pool', name: 'Priority pool', value: 0, jtype: 'ranking', rangeMin: 0, rangeMax: 100, inv: false };
    w.joys.attention_pool = { id: 'attention_pool', name: 'Attention pool', value: 0, jtype: 'ranking', rangeMin: 0, rangeMax: 10, inv: false };
    if (!w.components.reqs) {
      w.components.reqs = {
        id: 'reqs', name: 'Budget plan sequence',
        view: { layout: 'deps', title: 'Dependencies & sequence', item: { show: [] }, states: {} },
        items: [], blueprints: [], state: {}, sub: []
      };
    }
    if (cal) cal.items = [];
    if (brd) brd.items = [];
    w.components.reqs.items = [];
    applyDefaultViewStyling(w);
    w.root = ['comp:' + R.calId, 'comp:' + R.boardId, 'comp:' + (pln ? pln.id : 'reqs')];
    w.meta = {
      budget: 1, label: 'blank', calId: R.calId, boardId: R.boardId, planId: pln ? pln.id : 'reqs',
      viewsModule: EV.MODULE_ID,
      provenance: 'Exp7Views mount → runtime HTML string → JRViews → JRender'
    };
    return w;
  }

  function harmonicShares(joy) {
    var jid = joy.id, inv = !!joy.inv, L = [];
    Object.keys((W && W.items) || {}).forEach(function (id, i) {
      var it = W.items[id]; if (!it || (it.values || {}).kind === 'resource') return;
      var r = (it.values && it.values.ranks && it.values.ranks[jid]); if (!r) return;
      if (r.onFactor === false || r.onFactor === 0) return;
      var p = Number(r.pos) || 0; if (!(p > 0)) return;
      L.push({ it: it, id: id, p: p, i: i });
    });
    L.sort(function (a, b) { return (a.p - b.p) || (a.i - b.i); });
    var n = L.length, pool = (Number(joy.rangeMax) || 0) - (Number(joy.rangeMin) || 0);
    if (!n) return { list: [], shares: {}, portions: {}, pool: pool, sumW: 0, n: 0, inv: inv };
    var sumW = 0;
    L.forEach(function (x, i) { x.rank = i + 1; x.w = 1 / (inv ? Math.max(1, n - i) : (i + 1)); sumW += x.w; });
    var shares = {}, portions = {};
    L.forEach(function (x) {
      var s = sumW > 0 ? x.w / sumW : 0;
      shares[x.id] = s; portions[x.id] = s * pool; x.share = s; x.portion = s * pool;
    });
    return { list: L, shares: shares, portions: portions, pool: pool, sumW: sumW, n: n, inv: inv };
  }

  function pathGet(obj, path) {
    var cur = obj, parts = String(path).split('/');
    for (var i = 0; i < parts.length; i++) {
      if (cur == null) return undefined;
      cur = cur[parts[i]];
    }
    return cur;
  }
  function pathSet(obj, path, value, op) {
    var parts = String(path).split('/');
    var cur = obj;
    for (var i = 0; i < parts.length - 1; i++) {
      var k = parts[i];
      if (cur[k] == null || typeof cur[k] !== 'object') cur[k] = {};
      cur = cur[k];
    }
    var leaf = parts[parts.length - 1];
    if (op === 'add' && Array.isArray(cur[leaf])) {
      if (cur[leaf].indexOf(value) < 0) cur[leaf].push(value);
    } else if (op === 'remove' && Array.isArray(cur[leaf])) {
      cur[leaf] = cur[leaf].filter(function (x) { return x !== value; });
    } else if (op === 'add' && cur[leaf] == null) {
      cur[leaf] = value;
    } else {
      cur[leaf] = value;
    }
  }

  function applyOpsLocal(ops) {
    (ops || []).forEach(function (o) {
      pathSet(W, o.path, o.value, o.op || 'set');
    });
    W.rev = (W.rev || 0) + 1;
  }

  function onPropose(ops) {
    applyOpsLocal(ops);
    remountViews();
    persist();
    return { ok: true, ops: ops.length, rev: W.rev };
  }

  function disposeViews() {
    Object.keys(handles).forEach(function (k) {
      if (handles[k]) {
        try { window.Exp7Views.dispose(handles[k]); } catch (e) {}
        handles[k] = null;
      }
    });
  }

  function remountViews() {
    if (!window.Exp7Views) throw new Error('Budget requires Exp7Views');
    applyDefaultViewStyling(W);
    var R = window.Exp7Views.rootsFor(W);
    var map = [
      { key: 'cal', host: $('vf-cal'), root: R.calendar, kind: 'calendar' },
      { key: 'brd', host: $('vf-brd'), root: R.board, kind: 'board' },
      { key: 'plan', host: $('vf-plan'), root: R.plan, kind: 'plan' }
    ];
    map.forEach(function (m) {
      if (!m.host) return;
      if (handles[m.key]) {
        handles[m.key].update(W, m.root);
      } else {
        handles[m.key] = window.Exp7Views.mount({
          host: m.host,
          atlas: W,
          root: m.root,
          kind: m.kind,
          onPropose: onPropose,
          onError: function (err) {
            var el = $('budgetViewStatus');
            if (el) el.textContent = 'JRender view not drawn: ' + err + ' (no DOM substitute)';
          },
          onUpdate: function (V) {
            var el = $('budgetViewStatus');
            if (el && V && !V.err && V.n) {
              el.textContent = 'Exp7Views ' + window.Exp7Views.MODULE_ID + ' · ' + (V.month || V.kind || m.kind) +
                ' · nodes ' + (V.nodes || 0) + (V.note ? ' · ' + V.note : '');
            }
          }
        });
      }
    });
    showTab(TAB);
    renderRankPanel();
  }

  function showTab(t) {
    TAB = t;
    document.querySelectorAll('#budgetTabs button').forEach(function (b) {
      b.classList.toggle('on', b.dataset.t === t);
    });
    ['cal', 'brd', 'plan'].forEach(function (k) {
      var sec = $('t-' + k);
      if (sec) sec.hidden = (k !== t);
    });
    var chrome = $('boardChrome');
    if (chrome) chrome.hidden = t !== 'brd';
    renderRankPanel();
  }

  function renderRankPanel() {
    var panel = $('budgetRankPanel'); if (!panel) return;
    if (TAB !== 'brd' || !W) { panel.innerHTML = ''; return; }
    var joys = Object.values(W.joys || {}).filter(function (j) {
      return j && (j.jtype === 'ranking' || j.type === 'ranking');
    });
    var h = '<b>Ranking joys</b> <span class="hint">(harmonic 1/r × pool units — not dollars)</span>';
    joys.forEach(function (j) {
      var hs = harmonicShares(j);
      h += '<div style="margin-top:8px"><b>' + esc(j.name) + '</b> <span class="hint">' +
        esc(j.rangeMin) + '…' + esc(j.rangeMax) + ' · n=' + hs.n + '</span>';
      if (!hs.n) h += '<div class="hint">Zero on-factor → shares 0 (no ÷0).</div>';
      else h += '<div class="hint">' + hs.list.map(function (x) {
        return esc(x.it.name) + ' ' + (x.share * 100).toFixed(1) + '% → ' + x.portion.toFixed(2);
      }).join(' · ') + '</div>';
      h += '</div>';
    });
    panel.innerHTML = h;
  }

  function setBoardType(t) {
    BOARD_TYPE = t;
    document.querySelectorAll('#budgetTypeBar button[data-budget-type]').forEach(function (b) {
      b.classList.toggle('on', b.dataset.budgetType === t);
    });
    var br = W && W.components && W.components[(W.meta && W.meta.boardId) || 'budget_board'];
    if (br) { br.state = br.state || {}; br.state.budgetType = t; }
    remountViews();
    persist();
  }

  function loadExamples() {
    if (!W) return;
    var bid = W.meta.boardId, cid = W.meta.calId, rid = W.meta.planId || 'reqs';
    var day = function (n) {
      var d = new Date(); d.setDate(d.getDate() + n);
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    };
    var add = function (id, name, type, amount, date, ranks) {
      W.items[id] = {
        id: id, name: name,
        values: { type: type, amount: amount, ranks: ranks || {}, note: 'Labeled EXAMPLE only — not personal data' },
        factors: {}, state: {}, alts: null, jreq: null, blueprint: null
      };
      if (date) W.items[id].values.date = date;
      var push = function (compId) {
        var c = W.components[compId]; if (!c) return;
        var ref = 'item:' + id;
        if ((c.items || []).indexOf(ref) < 0) c.items = (c.items || []).concat([ref]);
      };
      push(bid); if (date) push(cid); push(rid);
    };
    add('ex_rent', 'EXAMPLE Rent', 'expense', 1200, day(-2), { priority_pool: { onFactor: true, pos: 1 } });
    add('ex_groc', 'EXAMPLE Groceries', 'expense', 80, day(0), { priority_pool: { onFactor: true, pos: 2 }, attention_pool: { onFactor: true, pos: 1 } });
    add('ex_pay', 'EXAMPLE Paycheck', 'income', 2000, day(5), {});
    add('ex_card', 'EXAMPLE Card balance', 'debt', 400, null, { priority_pool: { onFactor: true, pos: 3 } });
    add('ex_sav', 'EXAMPLE Savings', 'asset', 500, null, {});
    applyDefaultViewStyling(W);
    remountViews();
    persist();
  }

  function resetBlank() {
    disposeViews();
    W = mkBudgetAtlas();
    remountViews();
    persist();
  }

  async function persist() {
    if (!W) return;
    var payload = {
      atlas: JSON.parse(JSON.stringify(W)),
      at: Date.now(),
      viewsModule: window.Exp7Views.MODULE_ID,
      presentation: window.Exp7Views.presentation
    };
    await idbPut('atlasState', payload);
    var cur = await idbGet('state');
    if (!cur || cur.atlas) await idbPut('state', payload);
  }

  function wireUi() {
    $('budgetTabs').onclick = function (e) {
      var b = e.target.closest('button[data-t]'); if (b) showTab(b.dataset.t);
    };
    $('budgetTypeBar').onclick = function (e) {
      var b = e.target.closest('button[data-budget-type]'); if (b) setBoardType(b.dataset.budgetType);
    };
    $('budgetLoadExamples').onclick = function () { loadExamples(); };
    $('budgetResetBlank').onclick = function () { resetBlank(); };
    window.addEventListener('beforeunload', function () { disposeViews(); });
  }

  async function boot() {
    try {
      if (!window.Exp7Views || window.Exp7Views.MODULE_ID !== 'exp7-views@1') {
        throw new Error('Budget requires Exp7Views exp7-views@1 (got ' +
          ((window.Exp7Views && window.Exp7Views.MODULE_ID) || 'missing') + ')');
      }
      var saved = await idbGet('atlasState') || await idbGet('state');
      if (saved && saved.atlas) {
        W = saved.atlas;
        applyDefaultViewStyling(W);
        W.meta = W.meta || {};
        W.meta.viewsModule = window.Exp7Views.MODULE_ID;
        W.meta.provenance = 'Exp7Views mount → runtime HTML string → JRViews → JRender';
        delete W.meta.htmlViews;
        if (!W.root || !W.root.length) {
          var m = W.meta || {};
          W.root = ['comp:' + (m.calId || 'budget'), 'comp:' + (m.boardId || 'budget_board'), 'comp:' + (m.planId || 'reqs')];
        }
      } else {
        W = mkBudgetAtlas();
      }
      wireUi();
      remountViews();
      setBoardType((W.components[(W.meta || {}).boardId || 'budget_board'] || { state: {} }).state.budgetType || 'expense');
      window.budget = {
        W: function () { return W; },
        persist: persist,
        dispose: disposeViews,
        harmonicShares: function (j) { return harmonicShares(typeof j === 'string' ? W.joys[j] : j); },
        mode: function () { return 'exp7-views'; },
        viewsModuleId: function () { return window.Exp7Views.MODULE_ID; },
        provenance: function () {
          return {
            viewsModule: window.Exp7Views.MODULE_ID,
            presentation: window.Exp7Views.presentation,
            demoBase: false,
            legacyDom: false,
            jrender: true,
            theme: 'EXP7_LIGHT_DEFAULT+RISK_COL'
          };
        }
      };
      var bs = $('bootStatus'); if (bs) bs.hidden = true;
      pub({
        type: 'budget-app-ready', renderReady: true, mode: 'exp7-views',
        viewsModule: window.Exp7Views.MODULE_ID, tabs: 3, sectionOn: 't-' + TAB,
        proof: {
          moduleId: window.Exp7Views.MODULE_ID,
          presentation: window.Exp7Views.presentation,
          demoBase: false, legacyDom: false, jrender: true
        }
      });
    } catch (e) {
      var bs2 = $('bootStatus');
      if (bs2) { bs2.hidden = false; bs2.textContent = 'Budget boot error: ' + ((e && e.message) || e); }
      pub({ type: 'budget-app-error', error: String((e && e.message) || e), renderReady: false });
      console.error(e);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
