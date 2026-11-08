/**
 * review_model.js — per-item accept/reject + save (living-core authored)
 * Browser SoT helper for ranking_ui REVIEW tab.
 * Works offline: baseline/decisions in localStorage; disk baseline optional via fetch.
 */
(function (global) {
  'use strict';

  function sha1ish(s) {
    s = String(s || '');
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return ('00000000' + (h >>> 0).toString(16)).slice(-8);
  }

  function lineAmt(it) {
    if (!it) return 0;
    var c = Number(it.current);
    var p = Number(it.projected);
    if (it.current == null || it.current === '' || !isFinite(c) || c === 0) {
      if (isFinite(p) && p !== 0) return Math.abs(p);
    }
    return Math.abs(Number(it.current) || 0);
  }

  function captureLive(opts) {
    opts = opts || {};
    var WB = opts.workbook;
    var catalog = opts.joyCatalog || global.__RANKING_JOYS_CATALOG__ || {};
    var calActs =
      opts.calendarActions ||
      (global.__CALENDAR_ACTIONS__ && global.__CALENDAR_ACTIONS__.actions) ||
      [];
    var joys = (catalog.joys || (catalog.index && catalog.index.joys) || []).map(function (j) {
      var id = j.id || j;
      var live = (global.RankingJoys && global.RankingJoys[id]) || {};
      return {
        id: id,
        title: j.title || live.title || id,
        polarity: j.polarity || live.polarity || 'neutral',
        status: j.status || 'probe',
        relates_to: j.relates_to || [],
        jmethod_hash: sha1ish(live.score ? String(live.score) : id)
      };
    });
    var actions = (calActs || []).map(function (a) {
      return {
        id: a.id,
        name: a.name,
        kind: a.kind,
        polarity: a.polarity,
        amountMonthly: Number(a.amountMonthly) || 0,
        cadence: a.cadence,
        hours: a.hours,
        days: a.days,
        note: a.note || '',
        fingerprint: sha1ish(
          JSON.stringify([a.id, a.polarity, a.amountMonthly, a.cadence, a.kind])
        )
      };
    });
    var expenses = [];
    if (WB && WB.expenses && WB.expenses.sections) {
      WB.expenses.sections.forEach(function (sec) {
        (sec.items || []).forEach(function (it) {
          var amt = lineAmt(it);
          if (!(amt > 0) || !it.name) return;
          expenses.push({
            name: it.name,
            amount: amt,
            section: sec.name || '',
            isDebtPay: !!(it.payToDebt != null || it.debtIndex != null)
          });
        });
      });
    }
    var money = {
      net: opts.money && opts.money.net,
      living: opts.money && opts.money.living,
      debtCash: opts.money && opts.money.debtCash,
      surplus: opts.money && opts.money.surplus,
      catalogSpend: expenses.reduce(function (s, e) {
        return s + e.amount;
      }, 0)
    };
    var customSpend = 0,
      customGain = 0;
    actions.forEach(function (a) {
      if (a.kind === 'work' || a.kind === 'schedule' || a.kind === 'joy') return;
      if (!(a.amountMonthly > 0)) return;
      var onSheet = expenses.some(function (e) {
        return e.name === a.name;
      });
      if (onSheet) return;
      if (a.polarity === 'gain') customGain += a.amountMonthly;
      else customSpend += a.amountMonthly;
    });
    return {
      at: new Date().toISOString(),
      joys: joys,
      actions: actions,
      expenses: expenses,
      money: money,
      leakage: {
        customSpendOffSheet: customSpend,
        customGainOffSheet: customGain,
        catalogVsLivingDebt:
          money.living != null && money.debtCash != null
            ? money.catalogSpend - (money.living + money.debtCash)
            : null
      },
      moho: opts.moho ||
        (global.__MOHO_LAYERS__
          ? {
              rev: global.__MOHO_LAYERS__.rev,
              svg_first: !!global.__MOHO_LAYERS__.svg_first,
              layers_n: (global.__MOHO_LAYERS__.layers || []).length,
              events_n: global.__MOHO_LAYERS__.events
                ? Object.keys(global.__MOHO_LAYERS__.events).length
                : 0,
              catalog_hash: sha1ish(JSON.stringify(global.__MOHO_LAYERS__))
            }
          : null)
    };
  }

  function diffLists(baseArr, liveArr, keyFn, fields) {
    baseArr = baseArr || [];
    liveArr = liveArr || [];
    var bm = Object.create(null),
      lm = Object.create(null);
    baseArr.forEach(function (x) {
      bm[keyFn(x)] = x;
    });
    liveArr.forEach(function (x) {
      lm[keyFn(x)] = x;
    });
    var added = [],
      removed = [],
      changed = [];
    Object.keys(lm).forEach(function (k) {
      if (!bm[k]) added.push(lm[k]);
      else {
        var diffs = [];
        (fields || []).forEach(function (f) {
          if (JSON.stringify(bm[k][f]) !== JSON.stringify(lm[k][f])) {
            diffs.push({ field: f, from: bm[k][f], to: lm[k][f] });
          }
        });
        if (diffs.length) changed.push({ id: k, diffs: diffs, before: bm[k], after: lm[k] });
      }
    });
    Object.keys(bm).forEach(function (k) {
      if (!lm[k]) removed.push(bm[k]);
    });
    return { added: added, removed: removed, changed: changed };
  }

  function buildReview(opts) {
    opts = opts || {};
    var live = captureLive(opts);
    var baseline = opts.baseline || null;
    var pending = opts.pending || { proposals: [] };
    var joyDiff = baseline
      ? diffLists(baseline.joys, live.joys, function (j) {
          return j.id;
        }, ['title', 'polarity', 'status', 'relates_to', 'jmethod_hash'])
      : { added: live.joys.slice(), removed: [], changed: [] };
    var actionDiff = baseline
      ? diffLists(baseline.actions, live.actions, function (a) {
          return a.id;
        }, ['name', 'polarity', 'amountMonthly', 'cadence', 'fingerprint', 'kind'])
      : { added: live.actions.slice(), removed: [], changed: [] };
    var expenseDiff = baseline
      ? diffLists(baseline.expenses, live.expenses, function (e) {
          return e.name;
        }, ['amount', 'section', 'isDebtPay'])
      : { added: live.expenses.slice(), removed: [], changed: [] };

    var findings = [];
    if (!baseline) {
      findings.push({
        severity: 'warn',
        code: 'no_baseline',
        message: 'No approved baseline yet'
      });
    }
    if (live.leakage.customSpendOffSheet > 0) {
      findings.push({
        severity: 'leak',
        code: 'custom_spend_off_sheet',
        message:
          'Custom actions spend $' +
          live.leakage.customSpendOffSheet.toFixed(2) +
          '/mo off EXPENSES',
        amount: live.leakage.customSpendOffSheet
      });
    }
    if (
      baseline &&
      baseline.moho &&
      live.moho &&
      baseline.moho.catalog_hash &&
      live.moho.catalog_hash &&
      baseline.moho.catalog_hash !== live.moho.catalog_hash
    ) {
      findings.push({
        severity: 'info',
        code: 'motion_delta',
        message:
          'Moho/SVG motion catalog changed (rev ' +
          (baseline.moho.rev || '?') +
          ' → ' +
          (live.moho.rev || '?') +
          ')'
      });
    }
    if (
      live.leakage.catalogVsLivingDebt != null &&
      Math.abs(live.leakage.catalogVsLivingDebt) > 1
    ) {
      findings.push({
        severity: 'warn',
        code: 'catalog_vs_living_debt',
        message:
          'Expense line sum vs living+debt Δ $' +
          Number(live.leakage.catalogVsLivingDebt).toFixed(2),
        amount: live.leakage.catalogVsLivingDebt
      });
    }
    if (joyDiff.added.length || joyDiff.removed.length || joyDiff.changed.length) {
      findings.push({
        severity: 'info',
        code: 'joy_delta',
        message:
          'Joys: +' +
          joyDiff.added.length +
          ' −' +
          joyDiff.removed.length +
          ' ~' +
          joyDiff.changed.length
      });
    }
    if (actionDiff.added.length || actionDiff.removed.length || actionDiff.changed.length) {
      findings.push({
        severity: 'info',
        code: 'action_delta',
        message:
          'Actions: +' +
          actionDiff.added.length +
          ' −' +
          actionDiff.removed.length +
          ' ~' +
          actionDiff.changed.length
      });
    }
    if (expenseDiff.added.length || expenseDiff.removed.length || expenseDiff.changed.length) {
      findings.push({
        severity: 'info',
        code: 'expense_delta',
        message:
          'Expenses: +' +
          expenseDiff.added.length +
          ' −' +
          expenseDiff.removed.length +
          ' ~' +
          expenseDiff.changed.length
      });
    }

    var pendingN = (pending.proposals || []).length;
    if (pendingN) {
      findings.push({
        severity: 'pending',
        code: 'pending_proposals',
        message: pendingN + ' proposal(s) waiting',
        n: pendingN
      });
    }

    var dirty =
      !baseline ||
      joyDiff.added.length +
        joyDiff.removed.length +
        joyDiff.changed.length +
        actionDiff.added.length +
        actionDiff.removed.length +
        actionDiff.changed.length +
        expenseDiff.added.length +
        expenseDiff.removed.length +
        expenseDiff.changed.length >
        0 ||
      pendingN > 0 ||
      live.leakage.customSpendOffSheet > 0 ||
      !!(
        baseline &&
        baseline.moho &&
        live.moho &&
        baseline.moho.catalog_hash !== live.moho.catalog_hash
      );

    var report = {
      ok: true,
      at: new Date().toISOString(),
      dirty: dirty,
      has_baseline: !!baseline,
      gate: {
        must_review: dirty,
        apply_blocked: dirty && !!baseline,
        note: dirty ? 'Accept or reject each item, then top Save' : 'Clean vs baseline'
      },
      findings: findings,
      joy_diff: joyDiff,
      action_diff: actionDiff,
      expense_diff: expenseDiff,
      live: live,
      baseline: baseline,
      pending: pending,
      law: 'per-item accept/reject → Save · offline localStorage ok'
    };
    report.items = listReviewItems(report);
    return report;
  }

  function listReviewItems(report) {
    report = report || {};
    var items = [];
    function add(domain, op, id, title, detail, payload) {
      items.push({
        key: domain + ':' + op + ':' + id,
        domain: domain,
        op: op,
        id: id,
        title: title || id,
        detail: detail || '',
        payload: payload || null
      });
    }
    function walk(domain, diff, labelFn) {
      diff = diff || {};
      (diff.added || []).forEach(function (x) {
        var id = x.id || x.name;
        add(domain, 'added', id, labelFn(x), 'new vs baseline', x);
      });
      (diff.removed || []).forEach(function (x) {
        var id = x.id || x.name;
        add(domain, 'removed', id, labelFn(x), 'in baseline, missing live', x);
      });
      (diff.changed || []).forEach(function (x) {
        var id = x.id || (x.after && (x.after.id || x.after.name)) || 'x';
        var det = (x.diffs || [])
          .map(function (d) {
            return d.field + ': ' + JSON.stringify(d.from) + ' → ' + JSON.stringify(d.to);
          })
          .join('; ');
        add(domain, 'changed', id, labelFn(x.after || x.before || { id: id }), det, x);
      });
    }
    walk('joy', report.joy_diff, function (x) {
      return (x && (x.title || x.id)) || 'joy';
    });
    walk('action', report.action_diff, function (x) {
      return (x && (x.name || x.id)) || 'action';
    });
    walk('expense', report.expense_diff, function (x) {
      return (x && x.name) || 'expense';
    });
    // Findings: only actionable leaks / gates (not money KPI or delta summaries)
    (report.findings || []).forEach(function (f, i) {
      var code = String(f.code || '');
      if (
        /^(money_sheet|joy_delta|action_delta|expense_delta|pending_proposals|catalog_vs_living_debt)$/.test(
          code
        )
      ) {
        return;
      }
      // actionable: custom spend leak, no_baseline, motion if user must ack
      if (
        !(
          code === 'custom_spend_off_sheet' ||
          code === 'no_baseline' ||
          f.severity === 'leak'
        )
      ) {
        return;
      }
      add(
        'finding',
        f.severity || 'info',
        code || 'f' + i,
        code || 'finding',
        f.message || '',
        f
      );
    });
    ((report.pending && report.pending.proposals) || []).forEach(function (p) {
      add(
        'proposal',
        'pending',
        p.id,
        p.title || p.id,
        (p.kind || '') + ' · ' + (p.body || p.note || ''),
        p
      );
    });
    return items;
  }

  var DECISIONS_KEY = 'jworkbook_review_decisions_v1';
  var LOCAL_BASELINE_KEY = 'jworkbook_review_baseline_v1';
  var LOCAL_PENDING_KEY = 'jworkbook_review_pending_v1';

  function loadDecisions() {
    try {
      if (typeof localStorage === 'undefined') return {};
      return JSON.parse(localStorage.getItem(DECISIONS_KEY) || '{}') || {};
    } catch (_e) {
      return {};
    }
  }

  function saveDecisionsMap(map) {
    try {
      if (typeof localStorage === 'undefined') return false;
      localStorage.setItem(DECISIONS_KEY, JSON.stringify(map || {}));
      return true;
    } catch (_e) {
      return false;
    }
  }

  function setDecision(key, val) {
    var m = loadDecisions();
    if (val !== 'accept' && val !== 'reject') delete m[key];
    else m[key] = val;
    saveDecisionsMap(m);
    return m;
  }

  function loadLocalBaseline() {
    try {
      if (typeof localStorage === 'undefined') return null;
      var raw = localStorage.getItem(LOCAL_BASELINE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_e) {
      return null;
    }
  }

  function saveLocalBaseline(snap) {
    try {
      if (typeof localStorage === 'undefined') return false;
      localStorage.setItem(LOCAL_BASELINE_KEY, JSON.stringify(snap));
      return true;
    } catch (_e) {
      return false;
    }
  }

  function loadLocalPending() {
    try {
      if (typeof localStorage === 'undefined') return null;
      var raw = localStorage.getItem(LOCAL_PENDING_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_e) {
      return null;
    }
  }

  function saveLocalPending(p) {
    try {
      if (typeof localStorage === 'undefined') return false;
      localStorage.setItem(
        LOCAL_PENDING_KEY,
        JSON.stringify(
          p || {
            proposals: [],
            at: new Date().toISOString(),
            after_save: true
          }
        )
      );
      return true;
    } catch (_e) {
      return false;
    }
  }

  /**
   * Merge disk pending with last top Save.
   * Law: disk joys/review/pending.json is discover SoT for living-core hop0.
   * After Save, hide only proposal ids in local.cleared_ids (explicit).
   * Legacy after_save without cleared_ids hid all older-than-Save discover — treat as show disk.
   */
  function mergePending(disk, local) {
    disk = disk || { proposals: [] };
    if (!local) return disk;
    if (local.after_save) {
      var cleared = Object.create(null);
      // missing cleared_ids → [] (show all disk pending; legacy time-hide was wrong)
      var idList = Array.isArray(local.cleared_ids) ? local.cleared_ids : [];
      idList.forEach(function (id) {
        if (id) cleared[String(id)] = true;
      });
      var kept = (disk.proposals || []).filter(function (p) {
        if (!p || !p.id) return false;
        var st = String(p.status || 'pending').toLowerCase();
        if (st === 'rejected' || st === 'approved' || st === 'accepted') return false;
        if (cleared[String(p.id)]) return false;
        return true;
      });
      return {
        proposals: kept,
        at: new Date().toISOString(),
        merged: true,
        local_at: local.at,
        cleared_ids: idList.slice()
      };
    }
    if (Array.isArray(local.proposals) && local.proposals.length) return local;
    return disk;
  }

  /**
   * Apply decisions in browser → localStorage baseline + calendar actions.
   * Undecided → reject. No file downloads — top Save only.
   *
   * Law densest (post Budget.xlsx dual scenario):
   * - Save always **rebaselines** joy/action/expense to live SoT (sheet is truth).
   * - Reject all no longer leaves permanent expense_delta vs stale baseline.
   * - Accept proposal → side effects (calendar action / projected cut).
   * - Reject proposal → no side effect; id cleared from pending.
   */
  function applyDecisionsLocal(report, decisions) {
    decisions = decisions || loadDecisions();
    report = report || {};
    var items = report.items || listReviewItems(report);
    var live = report.live || {};
    var baseline = report.baseline || loadLocalBaseline() || {
      joys: [],
      actions: [],
      expenses: [],
      money: {}
    };

    function mapBy(arr, k) {
      var m = Object.create(null);
      (arr || []).forEach(function (x) {
        m[x[k] || x.id || x.name] = x;
      });
      return m;
    }
    var joyLive = mapBy(live.joys, 'id');
    var actLive = mapBy(live.actions, 'id');
    var expLive = mapBy(live.expenses, 'name');

    var accepted = 0,
      rejected = 0;
    var budgetProjectedCuts = [];
    var rejectedActionIds = Object.create(null);
    items.forEach(function (it) {
      var d = decisions[it.key];
      if (d !== 'accept' && d !== 'reject') d = 'reject';
      if (d === 'accept') accepted++;
      else rejected++;

      if (it.domain === 'proposal' && d === 'accept') {
        var prop = it.payload || {};
        var inner = prop.payload || prop;
        var disc = inner.discovery || prop.discovery || '';
        if (disc === 'cut_expense' || disc === 'budget_cut') {
          budgetProjectedCuts.push({
            expenseName: inner.expenseName || inner.name || prop.title,
            amountMonthly: inner.amountMonthly,
            id: prop.id || it.id,
            discovery: disc
          });
        }
        var act = (inner && inner.action) || prop.action || null;
        if (act && act.id) {
          actLive[act.id] = {
            id: act.id,
            name: act.name || act.id,
            kind: act.kind || 'custom',
            polarity: act.polarity || 'neutral',
            amountMonthly: Number(act.amountMonthly) || 0,
            cadence: act.cadence || 'weekly',
            hours: act.hours || [12],
            days: act.days,
            note: act.note || '',
            author: act.author || 'ranking_ui-review'
          };
        }
      }
      // Reject action-add: drop from live catalog (do not rebaseline keeping it)
      if (it.domain === 'action' && it.op === 'added' && d === 'reject' && it.id) {
        rejectedActionIds[it.id] = true;
        delete actLive[it.id];
      }
      if (it.domain === 'finding' && it.id === 'custom_spend_off_sheet' && d === 'accept') {
        Object.keys(actLive).forEach(function (id) {
          var a = actLive[id];
          if (!a || a.kind === 'work' || a.kind === 'schedule' || a.kind === 'joy') return;
          if (!(Number(a.amountMonthly) > 0)) return;
          var onSheet = !!expLive[a.name];
          if (!onSheet) {
            actLive[id] = Object.assign({}, a, {
              amountMonthly: 0,
              note: (a.note || '') + ' [zeroed: accepted leakage fix]'
            });
          }
        });
      }
    });

    // Rebaseline densest: live SoT after proposal side effects (reject-all → clean)
    var joyBase = joyLive;
    var actBase = actLive;
    var expBase = expLive;

    var snap = {
      at: new Date().toISOString(),
      approved_at: new Date().toISOString(),
      approved_by: 'ranking_ui',
      note: 'Save rebaselines live SoT · reject proposals = no side effect · accept budget → projected',
      joys: Object.keys(joyBase).map(function (k) {
        return joyBase[k];
      }),
      actions: Object.keys(actBase).map(function (k) {
        return actBase[k];
      }),
      expenses: Object.keys(expBase).map(function (k) {
        return expBase[k];
      }),
      money: live.money || {},
      leakage: live.leakage || {},
      moho: live.moho || baseline.moho || null,
      decisions: decisions,
      law: 'Save = rebaseline catalog · budget accepts stage PROJ+REVIEW · promote Review→Proj → Current'
    };

    var cs = 0,
      cg = 0;
    snap.actions.forEach(function (a) {
      if (a.kind === 'work' || a.kind === 'schedule' || a.kind === 'joy' || a.kind === 'debt') return;
      if (!(Number(a.amountMonthly) > 0)) return;
      if (
        snap.expenses.some(function (e) {
          return e.name === a.name;
        })
      )
        return;
      if (a.polarity === 'gain') cg += Number(a.amountMonthly) || 0;
      else cs += Number(a.amountMonthly) || 0;
    });
    snap.leakage = {
      customSpendOffSheet: cs,
      customGainOffSheet: cg,
      catalogVsLivingDebt:
        snap.money.living != null && snap.money.debtCash != null
          ? (snap.money.catalogSpend || 0) - (snap.money.living + snap.money.debtCash)
          : null
    };

    saveLocalBaseline(snap);
    saveDecisionsMap({});
    // pending cleared after Save — hide only these ids; disk rediscover keeps other ids
    var clearedIds = [];
    ((report.pending && report.pending.proposals) || []).forEach(function (p) {
      if (p && p.id) clearedIds.push(String(p.id));
    });
    items.forEach(function (it) {
      if (it && it.domain === 'proposal' && it.id) clearedIds.push(String(it.id));
    });
    var seenC = Object.create(null);
    clearedIds = clearedIds.filter(function (id) {
      if (seenC[id]) return false;
      seenC[id] = true;
      return true;
    });
    var clearedPending = {
      proposals: [],
      at: snap.approved_at,
      after_save: true,
      cleared_by: 'top_save',
      cleared_ids: clearedIds
    };
    saveLocalPending(clearedPending);
    global.__REVIEW_BASELINE_DISK__ = snap;
    global.__REVIEW_PENDING__ = clearedPending;
    global.__CALENDAR_ACTIONS__ = {
      actions: snap.actions,
      updated_at: snap.approved_at,
      law: 'from top Save · localStorage'
    };
    global.__EXPENSE_SYNC__ = {
      at: snap.approved_at,
      expenses: snap.expenses,
      money: snap.money,
      leakage: snap.leakage
    };

    return {
      ok: true,
      snapshot: snap,
      accepted_n: accepted,
      rejected_n: rejected,
      pending: clearedPending,
      budget_projected_cuts: budgetProjectedCuts,
      law: 'budget cuts → PROJECTED only · CURRENT untouched',
      // no downloads — localStorage is SoT; living-core authors disk when intentional
      local: true
    };
  }

  global.RankingReview = {
    captureLive: captureLive,
    buildReview: buildReview,
    listReviewItems: listReviewItems,
    loadDecisions: loadDecisions,
    saveDecisionsMap: saveDecisionsMap,
    setDecision: setDecision,
    loadLocalBaseline: loadLocalBaseline,
    saveLocalBaseline: saveLocalBaseline,
    loadLocalPending: loadLocalPending,
    saveLocalPending: saveLocalPending,
    mergePending: mergePending,
    applyDecisionsLocal: applyDecisionsLocal,
    LOCAL_BASELINE_KEY: LOCAL_BASELINE_KEY,
    LOCAL_PENDING_KEY: LOCAL_PENDING_KEY,
    DECISIONS_KEY: DECISIONS_KEY
  };
  if (typeof module !== 'undefined' && module.exports && !module.exports.JBlueprint) {
    module.exports = global.RankingReview;
  }
})(typeof window !== 'undefined' ? window : globalThis);
