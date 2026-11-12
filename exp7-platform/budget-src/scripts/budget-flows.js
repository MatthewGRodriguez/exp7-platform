/* Budget flows (1.8.55+): the user journeys of BUDGET_DIRECTION on top of the existing views. This script adds controllers
 * and view-model fragments only. Views are still built by the views host (buildModel) and drawn by JRViews -> JRender.
 * Loaded after views-host: it calls that script's functions (activeAtlas, submitViews, VMx, effItem, ...). Budget atlases only. */
(function (root) {
  'use strict';
  var BR = root.BudgetRules;
  function VM() { return root.Exp7VM; }
  function AW(V) { return activeAtlas(V) || { items: {}, components: {}, meta: {} }; }
  function isBudget(w) { return !!(w && w.meta && w.meta.budget); }
  function redraw(V, why) { return V && V.sess && V.queue(V.sess, why || 'form'); }
  function bare(ref) { return String(ref == null ? '' : ref).replace(/^item:/, ''); }

/* ---- A. Starting finances: assets (cash or owned), debts with calculated payments, pay with deductions ---- */
  var FIN_TYPES = { asset: 'Asset', debt: 'Debt', income: 'Pay' };
  function finBoard(type) { return (root.Exp7Views && root.Exp7Views.budgetBoardId) ? root.Exp7Views.budgetBoardId(type) : 'board_' + type; }
  function isCashAsset(it) { return (typeof BR !== 'undefined' && BR.isCashAsset) ? BR.isCashAsset(it) : (((it && it.values) || {}).assetKind === 'cash'); }
  function manualPayers(w, debtId) { var ref = 'item:' + debtId, out = []; Object.keys(w.items || {}).forEach(function (k) { var v = (w.items[k] || {}).values || {}; if (v.payTo === ref && v.autoFor !== ref) out.push(w.items[k]); }); return out; }
  function autoPayer(w, debtId) { var ref = 'item:' + debtId, hit = null; Object.keys(w.items || {}).forEach(function (k) { var v = (w.items[k] || {}).values || {}; if (v.autoFor === ref) hit = w.items[k]; }); return hit; }
  function debtInput(F) { return { balance: F.balance, asOf: F.asOf, apr: F.apr, terms: F.terms, every: F.every }; }
  function incomeInput(F) { var D = []; for (var i = 0; i < (F.dedN || 0); i++) { if (F['ded' + i + 'gone']) continue; var nm = String(F['ded' + i + 'name'] || '').trim(), val = F['ded' + i + 'value']; if (!nm && (val == null || String(val).trim() === '')) continue; D.push({ name: nm, kind: F['ded' + i + 'kind'] === 'percent' ? 'percent' : 'fixed', value: val }); } return { gross: F.gross, deductions: D }; }
  /* first day on or after `start` that a day-of-month list lands on (a missing day uses that month's last day) */
  function firstMonthday(start, list) { var d = BR.pdate(start); if (!d || !list.length) return null;
    for (var k = 0; k < 62; k++) { var x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + k), dim = new Date(x.getFullYear(), x.getMonth() + 1, 0).getDate(); if (list.some(function (n) { return x.getDate() === Math.min(n, dim); })) return BR.ymd(x); } return null; }

  function finOpen(V, type, id, day) { var w = AW(V), it = id ? w.items[id] : null, v = (it && it.values) || {}, fromDay = day || (V && V.addDay) || null, F = { kind: 'fin', type: type, item: id || null, errors: [], fromDay: fromDay, asOfLocked: !!fromDay };
    if (type === 'asset') Object.assign(F, { name: it ? it.name : '', assetKind: it ? (isCashAsset(it) ? 'cash' : (it.values && it.values.assetKind === 'owned' ? 'owned' : 'cash')) : 'cash', amount: v.amount == null ? '' : String(v.amount), asOf: fromDay || v.asOf || budgetTodayKey() });
    if (type === 'debt') { var man = id ? manualPayers(w, id) : [], auto = id ? autoPayer(w, id) : null;
      Object.assign(F, { creditor: v.creditor || '', purpose: v.purpose || (it && !v.creditor ? it.name : '') || '', balance: v.amount == null ? '' : String(v.amount), asOf: fromDay || v.asOf || budgetTodayKey(), apr: v.apr == null ? '' : String(v.apr),
        terms: v.terms == null ? '' : String(v.terms), every: v.every == null ? '' : String(v.every), schedule: auto ? true : !man.length, calc: !!(id && v.every) }); }
    if (type === 'income') { var D = Array.isArray(v.deductions) ? v.deductions : [], rep = v.repeat === 'every' ? 'every' : 'monthdays';
      Object.assign(F, { name: it ? it.name : '', gross: v.gross == null ? (v.amount != null && !D.length ? String(v.amount) : '') : String(v.gross), dedN: D.length, sched: rep, days: v.repeat === 'monthdays' ? BR.monthDayList(v.on).join(', ') : (v.pay ? BR.monthDayList(v.pay).join(', ') : ''),
        every: v.every == null ? '' : String(v.every), start: fromDay || v.date || budgetTodayKey(), calc: !!id });
      /* opened from the Calendar with days selected: those days of the month, starting at the first of them */
      if (!id && typeof isCalRoot === 'function' && isCalRoot(V)) { var sd = sortedDays(calSelOf(V).selected || {}); if (sd.length) { var dn = []; sd.forEach(function (d) { var n = +String(d).slice(8); if (dn.indexOf(n) < 0) dn.push(n); }); F.days = dn.sort(function (x, y) { return x - y; }).join(', '); F.start = sd[0]; } }
      D.forEach(function (d, i) { F['ded' + i + 'name'] = d.name || ''; F['ded' + i + 'kind'] = d.kind === 'percent' ? 'percent' : 'fixed'; F['ded' + i + 'value'] = d.value == null ? '' : String(d.value); }); }
    V.form = F; V.formFocus = type === 'debt' ? 'creditor' : 'name'; V.note = (id ? 'edit ' : 'new ') + type; return redraw(V); }

  function finFormVM(V, w, F) { var X = VM(), kids = [], f = function (key, lab, ph, wd) { return X.row('f:' + key, [X.text('l', lab + ':', 'body', { bold: true }), X.field('f', key, ph || lab, { w: wd || 240, v: F[key] != null ? F[key] : '' })]); };
    kids.push(X.text('title', (F.item ? 'Edit ' : 'New ') + (F.type === 'asset' ? 'asset' : F.type === 'debt' ? 'debt' : 'pay'), 'h'));
    if (F.type === 'asset') {
      kids.push(f('name', 'Name', 'Checking account'));
      kids.push(X.row('kind', [X.text('l', 'Kind:', 'body', { bold: true }), X.btn('cash', 'Cash balance', 'fin:kind:cash', { on: F.assetKind === 'cash' }), X.btn('owned', 'Owned item', 'fin:kind:owned', { on: F.assetKind === 'owned' })]));
      kids.push(X.text('kindhint', F.assetKind === 'cash' ? 'Money you can spend. It counts as cash available.' : 'Something you own, such as a car. Its value counts toward net worth, not toward cash available.', 'muted'));
      kids.push(f('amount', F.assetKind === 'cash' ? 'Balance' : 'Value', '0.00', 140)); if (F.asOfLocked) kids.push(X.row('f:asOf', [X.text('l', 'As of:', 'body', { bold: true }), X.text('v', F.asOf, 'body')])); else kids.push(f('asOf', 'As of', 'YYYY-MM-DD', 140)); }
    if (F.type === 'debt') {
      kids.push(f('creditor', 'Creditor', 'Who is owed')); kids.push(f('purpose', 'Purpose', 'What it paid for'));
      kids.push(f('balance', 'Balance owed', '0.00', 140)); if (F.asOfLocked) kids.push(X.row('f:asOf', [X.text('l', 'As of:', 'body', { bold: true }), X.text('v', F.asOf, 'body')])); else kids.push(f('asOf', 'As of', 'YYYY-MM-DD', 140)); kids.push(f('apr', 'APR %', '0', 100));
      kids.push(f('terms', 'Payments remaining', 'count', 100)); kids.push(f('every', 'Days between payments', 'days', 100));
      kids.push(X.row('calc', [X.btn('calc', 'Calculate payment', 'fin:calc')]));
      if (F.calc) { var S = BR.debtSchedule(debtInput(F));
        if (S.ok) { kids.push(X.text('pay', 'Payment ' + BR.money(S.payment) + ' every ' + S.every + ' days · first ' + S.first + ' · last ' + S.lastDate + ' (' + BR.money(S.last) + ')', 'body', { bold: true }));
          kids.push(X.text('tot', S.terms + ' payments · total ' + BR.money(S.total) + ' · interest ' + BR.money(S.interest), 'small')); }
        kids.push(X.text('rule', BR.DEBT_RULE, 'muted')); }
      var man = F.item ? manualPayers(w, F.item) : [];
      kids.push(X.row('sched', [X.btn('sched', (F.schedule ? '✓ ' : '') + 'Put the calculated payments on the calendar', 'fin:schedule', { on: !!F.schedule })]));
      if (man.length) kids.push(X.text('man', 'Already paid by ' + man.map(function (m) { return m.name; }).join(', ') + '. That entry is kept as it is' + (F.schedule ? '; the calculated payments are added as well.' : '.'), 'muted')); }
    if (F.type === 'income') {
      kids.push(f('name', 'Name', 'Paycheck')); kids.push(f('gross', 'Gross pay each payday', '0.00', 140));
      kids.push(X.text('dh', 'Deductions', 'body', { bold: true }));
      for (var i = 0; i < (F.dedN || 0); i++) { if (F['ded' + i + 'gone']) continue; var pc = F['ded' + i + 'kind'] === 'percent';
        kids.push(X.row('d' + i, [X.field('n', 'ded' + i + 'name', 'Deduction name', { w: 190, v: F['ded' + i + 'name'] || '' }), X.btn('fx', 'Fixed $', 'fin:dedkind:' + i + ':fixed', { on: !pc }), X.btn('pc', '% of gross', 'fin:dedkind:' + i + ':percent', { on: pc }),
          X.field('v', 'ded' + i + 'value', pc ? 'percent' : 'amount', { w: 100, v: F['ded' + i + 'value'] || '' }), X.btn('rm', 'Remove', 'fin:dedrm:' + i)])); }
      kids.push(X.row('dadd', [X.btn('add', '+ Add deduction', 'fin:dedadd')]));
      kids.push(X.row('sk', [X.text('l', 'Paydays:', 'body', { bold: true }), X.btn('md', 'Dates each month', 'fin:sched:monthdays', { on: F.sched === 'monthdays' }), X.btn('ev', 'Every X days', 'fin:sched:every', { on: F.sched === 'every' })]));
      if (F.sched === 'monthdays') kids.push(f('days', 'Days of the month', '1, 15', 140)); else kids.push(f('every', 'Days between paydays', '14', 100));
      kids.push(f('start', F.sched === 'monthdays' ? 'Starting' : 'First payday', 'YYYY-MM-DD', 140));
      kids.push(X.row('calc', [X.btn('calc', 'Calculate take-home', 'fin:calc')]));
      if (F.calc) { var T = BR.takeHome(incomeInput(F));
        if (T.ok) { kids.push(X.text('net', 'Take-home ' + BR.money(T.net) + ' each payday', 'body', { bold: true }));
          kids.push(X.text('lines', 'Gross ' + BR.money(T.gross) + (T.lines.length ? ' · ' + T.lines.map(function (l) { return l.name + ' -' + BR.money(l.amount).replace(/^-/, '') + (l.kind === 'percent' ? ' (' + l.value + '%)' : ''); }).join(' · ') : ' · no deductions'), 'small')); }
        kids.push(X.text('rule', BR.INCOME_RULE, 'muted')); } }
    (F.errors || []).forEach(function (e, i) { kids.push(X.text('e' + i, e, 'flag')); });
    kids.push(X.row('acts', [X.btn('ok', F.item ? 'Save' : 'Add', 'fin:ok', { kind: 'primary' }), X.btn('cancel', 'Cancel', 'form:cancel')]));
    return X.col('form', kids, { role: 'detail', slab: 'inner', enter: true }); }

  function setOps(id, it, patch) { var ops = [], v = (it && it.values) || {}; Object.keys(patch).forEach(function (k) { var val = patch[k];
      if (val === undefined) { if (v[k] !== undefined) ops.push({ path: 'items/' + id + '/values/' + k, op: 'drop' }); return; }
      if (JSON.stringify(v[k]) !== JSON.stringify(val)) ops.push({ path: 'items/' + id + '/values/' + k, op: v[k] === undefined ? 'add' : 'set', value: val }); }); return ops; }
  function nameOp(id, it, name) { return it && it.name !== name ? [{ path: 'items/' + id + '/name', op: 'set', value: name }] : []; }

  function finSave(V) { var F = V.form, w = AW(V); if (!F || F.kind !== 'fin') return; var E = [], ops = [], id = F.item, it = id ? w.items[id] : null, bid = finBoard(F.type), calId = (w.meta && w.meta.calId) || 'budget';
    function fresh(name, values) { id = uniqItemId(name, V); ops.push({ path: 'items/' + id, op: 'add', value: mkItemRecord(id, name, { values: values }) }, { path: 'components/' + bid + '/items', op: 'add', value: 'item:' + id }); }
    if (F.type === 'asset') { var name = String(F.name || '').trim(), amt = BR.num(F.amount);
      if (!name) E.push('Give the asset a name.'); if (!(amt >= 0)) E.push('Enter a balance or value of 0 or more.'); if (F.asOf && !BR.pdate(F.asOf)) E.push('As-of date must be a real date, YYYY-MM-DD.');
      if (!E.length) { var av = { type: 'asset', assetKind: F.assetKind === 'owned' ? 'owned' : 'cash', amount: BR.r2(amt), asOf: F.asOf || budgetTodayKey() };
        if (it) ops = nameOp(id, it, name).concat(setOps(id, it, av)); else fresh(name, av); } }
    if (F.type === 'debt') { var cred = String(F.creditor || '').trim(), purp = String(F.purpose || '').trim(), S = BR.debtSchedule(debtInput(F));
      if (!cred) E.push('Enter the creditor.'); if (!purp) E.push('Enter what the debt was for.'); if (!S.ok) E = E.concat(S.errors);
      if (!E.length) { var dname = purp + ' (' + cred + ')', dv = { type: 'debt', creditor: cred, purpose: purp, amount: BR.r2(BR.num(F.balance)), asOf: F.asOf, apr: BR.num(F.apr), terms: S.terms, every: S.every, payment: S.payment };
        if (it) ops = nameOp(id, it, dname).concat(setOps(id, it, dv)); else fresh(dname, dv);
        var auto = it ? autoPayer(w, id) : null, pv = { type: 'expense', flow: 'out', consume: true, payTo: 'item:' + id, autoFor: 'item:' + id, date: S.first, repeat: 'every', every: S.every, until: S.lastDate, amount: -S.payment, lastAmount: -S.last, charge: 'per', category: 'Debt payment', allDay: true };
        if (F.schedule) { var pname = purp + ' payment';
          if (auto) ops = ops.concat(nameOp(auto.id, auto, pname), setOps(auto.id, auto, pv));
          else { var pid = uniqItemId(pname, V); if (pid === id) pid = pid + '_pay';
            ops.push({ path: 'items/' + pid, op: 'add', value: mkItemRecord(pid, pname, { values: pv }) }, { path: 'components/' + finBoard('expense') + '/items', op: 'add', value: 'item:' + pid }, { path: 'components/' + calId + '/items', op: 'add', value: 'item:' + pid }); } }
        else if (auto) { ['expense'].forEach(function (t) { ops.push({ path: 'components/' + finBoard(t) + '/items', op: 'remove', value: 'item:' + auto.id }); }); ops.push({ path: 'components/' + calId + '/items', op: 'remove', value: 'item:' + auto.id }, { path: 'items/' + auto.id, op: 'drop' }); } } }
    if (F.type === 'income') { var iname = String(F.name || '').trim(), T = BR.takeHome(incomeInput(F)), list = BR.monthDayList(F.days), ev = Math.floor(BR.num(F.every)), start = F.start, first = null;
      if (!iname) E.push('Give this pay a name.'); if (!T.ok) E = E.concat(T.errors);
      if (!BR.pdate(start)) E.push('Start date must be a real date, YYYY-MM-DD.');
      else if (F.sched === 'monthdays') { if (!list.length) E.push('Enter the days of the month you are paid, such as 1, 15.'); else first = firstMonthday(start, list); }
      else { if (!(ev >= 1)) E.push('Enter the number of days between paydays.'); else first = start; }
      if (!E.length) { var iv = { type: 'income', flow: 'in', gross: T.gross, deductions: T.lines.map(function (l) { return { name: l.name, kind: l.kind, value: l.value }; }), amount: T.net, charge: 'per', date: first, repeat: F.sched === 'monthdays' ? 'monthdays' : 'every',
          on: F.sched === 'monthdays' ? list : undefined, every: F.sched === 'monthdays' ? undefined : ev, pay: undefined, category: ((it && it.values) || {}).category || 'Pay', allDay: true };
        if (it) ops = nameOp(id, it, iname).concat(setOps(id, it, iv)); else { Object.keys(iv).forEach(function (k) { if (iv[k] === undefined) delete iv[k]; }); fresh(iname, iv); ops.push({ path: 'components/' + calId + '/items', op: 'add', value: 'item:' + id }); }
        if (it && ((w.components[calId] || {}).items || []).indexOf('item:' + id) < 0) ops.push({ path: 'components/' + calId + '/items', op: 'add', value: 'item:' + id }); } }
    if (E.length) { F.errors = E; F.calc = true; V.note = E[0]; return redraw(V); }
    clearFormFields(V); V.form = null; V.formFocus = null; V.note = 'saved ' + F.type;
    if (!ops.length) return redraw(V);
    return submitViews(ops, 'fin:' + F.type, V); }

  /* Board rows of the three starting-finance boards: what was entered, and Edit */
  function rowExtras(V, w, id, bid) { var X = VM(), it = w.items[id], v = (it && it.values) || {}, out = [], t = /^board_(asset|debt|income)$/.exec(bid || ''); if (!it || !t) return out; t = t[1];
    if (t === 'asset') out.push(X.row('fin', [X.text('s', (isCashAsset(it) ? 'Cash balance ' : 'Owned item, value ') + BR.money(v.amount) + (v.asOf ? ' as of ' + v.asOf : ''), 'body'), X.btn('edit', 'Edit', 'fin:edit:' + id)]));
    if (t === 'debt') { var S = v.every ? BR.debtSchedule({ balance: v.amount, asOf: v.asOf, apr: v.apr, terms: v.terms, every: v.every }) : null, today = budgetTodayKey();
      out.push(X.row('fin', [X.text('s', 'Owed ' + BR.money(v.amount) + (v.asOf ? ' as of ' + v.asOf : '') + (v.apr != null && v.apr !== '' ? ' · APR ' + v.apr + '%' : '') + (v.terms != null && v.terms !== '' ? ' · ' + v.terms + ' payments left' : ''), 'body'), X.btn('edit', 'Edit', 'fin:edit:' + id)]));
      if (S && S.ok) out.push(X.text('fin2', 'Payment ' + BR.money(S.payment) + ' every ' + S.every + ' days · first ' + S.first + ' · last ' + S.lastDate + ' · owed today ' + BR.money(BR.debtBalanceOn({ balance: v.amount, asOf: v.asOf, apr: v.apr, terms: v.terms, every: v.every }, today)), 'small'));
      else out.push(X.text('fin2', 'No payment schedule yet. Edit to enter the days between payments.', 'muted')); }
    if (t === 'income') { var D = Array.isArray(v.deductions) ? v.deductions : [];
      out.push(X.row('fin', [X.text('s', v.gross != null ? 'Gross ' + BR.money(v.gross) + ' · ' + D.length + ' deduction' + (D.length === 1 ? '' : 's') + ' · take-home ' + BR.money(v.amount) + ' each payday' : 'Amount ' + BR.money(v.amount), 'body'), X.btn('edit', 'Edit', 'fin:edit:' + id)]));
      out.push(X.text('fin2', BR.repeatLabel(v), 'small')); }
    return out; }

  function finAct(V, a) { var F = V.form, m;
    if ((m = /^fin:new:(asset|debt|income|cash)$/.exec(a))) { var typ = m[1] === 'cash' ? 'asset' : m[1]; return finOpen(V, typ, null, (V && V.addDay) || calNavOf(V).day || budgetDateKey()); }
    if ((m = /^fin:edit:(.+)$/.exec(a))) { var it = AW(V).items[m[1]], t = it && it.values && it.values.type; if (!FIN_TYPES[t]) return; return finOpen(V, t, m[1]); }
    if (!F || F.kind !== 'fin') return;
    if ((m = /^fin:kind:(cash|owned)$/.exec(a))) { F.assetKind = m[1]; return redraw(V); }
    if (a === 'fin:calc') { F.calc = true; F.errors = F.type === 'debt' ? BR.debtSchedule(debtInput(F)).errors : BR.takeHome(incomeInput(F)).errors; return redraw(V); }
    if (a === 'fin:schedule') { F.schedule = !F.schedule; return redraw(V); }
    if (a === 'fin:dedadd') { var i = F.dedN || 0; F.dedN = i + 1; F['ded' + i + 'kind'] = 'fixed'; F['ded' + i + 'name'] = ''; F['ded' + i + 'value'] = ''; V.formFocus = 'ded' + i + 'name'; return redraw(V); }
    if ((m = /^fin:dedrm:(\d+)$/.exec(a))) { F['ded' + m[1] + 'gone'] = true; return redraw(V); }
    if ((m = /^fin:dedkind:(\d+):(fixed|percent)$/.exec(a))) { F['ded' + m[1] + 'kind'] = m[2]; return redraw(V); }
    if ((m = /^fin:sched:(monthdays|every)$/.exec(a))) { F.sched = m[1]; return redraw(V); }
    if (a === 'fin:ok') return finSave(V); }

  /* ---- Calendar Add item: how the entry repeats ---- */
  function calRepeatVM(V, F) { var X = VM(), rp = F.rep || 'days', out = [];
    out.push(X.row('rep', [X.text('l', 'Repeats:', 'body', { bold: true }), X.btn('r:days', 'Only the selected days', 'form:calrep:days', { on: rp === 'days' }), X.btn('r:md', 'Dates each month', 'form:calrep:monthdays', { on: rp === 'monthdays' }), X.btn('r:ev', 'Every X days', 'form:calrep:every', { on: rp === 'every' })]));
    if (rp === 'monthdays') { out.push(X.row('f:rdays', [X.text('l', 'Days of the month:', 'body', { bold: true }), X.field('f', 'rdays', '1, 15', { w: 140, v: F.rdays != null ? F.rdays : '' })])); out.push(X.text('rdh', 'A month without that day uses its last day.', 'muted')); }
    if (rp === 'every') out.push(X.row('f:revery', [X.text('l', 'Days between:', 'body', { bold: true }), X.field('f', 'revery', '7', { w: 100, v: F.revery != null ? F.revery : '' })]));
    if (rp !== 'days') out.push(X.row('f:runtil', [X.text('l', 'Until (optional):', 'body', { bold: true }), X.field('f', 'runtil', 'YYYY-MM-DD', { w: 140, v: F.runtil != null ? F.runtil : '' })]));
    return out; }
  function calRepeatPick(V, kind, days) { var F = V.form; if (!F) return; F.rep = kind;
    if (kind === 'monthdays' && !String(F.rdays || '').trim()) { var L = []; (days || []).forEach(function (d) { var n = +String(d).slice(8); if (L.indexOf(n) < 0) L.push(n); }); F.rdays = L.sort(function (a, b) { return a - b; }).join(', '); }
    V.formFocus = kind === 'monthdays' ? 'rdays' : kind === 'every' ? 'revery' : V.formFocus; return redraw(V); }
  /* the schedule values a repeat choice sets, starting from the first selected day */
  function repeatValues(F, start) { var rp = (F && F.rep) || 'days', out = { ok: true, patch: null };
    if (rp === 'days') return out; var until = String(F.runtil || '').trim();
    if (until && !BR.pdate(until)) return { ok: false, error: 'Until must be a real date, YYYY-MM-DD.' };
    if (until && until < start) return { ok: false, error: 'Until is before the first day.' };
    if (rp === 'monthdays') { var L = BR.monthDayList(F.rdays); if (!L.length) return { ok: false, error: 'Enter the days of the month, such as 1, 15.' };
      out.patch = { repeat: 'monthdays', on: L, date: firstMonthday(start, L) || start, days: 1 }; }
    else { var n = Math.floor(BR.num(F.revery)); if (!(n >= 1)) return { ok: false, error: 'Enter the number of days between.' }; out.patch = { repeat: 'every', every: n, date: start, days: 1 }; }
    if (until) out.patch.until = until; return out; }

  /* ---- First visit: what is still to enter, in the order the direction gives. Shown on Home until each is there. ---- */
  function startLinks(w) { if (!isBudget(w)) return []; var out = [];
    /* There is no first-visit setup flow. People enter information through the calendar.
       Unfinished proposals can still be resumed from Home. */
    if (typeof props === 'function') props(w).filter(function (p) { return p.proposed; }).forEach(function (p) { out.push({ label: 'Resume proposal: ' + w.items[p.cat].name + ' to ' + w.items[bare(p.to)].name, act: 'nav:plan', proposal: p.id }); });
    return out; }

/* ---- B. The day schedule: change one occurrence or this and future ones, and record what happened ---- */
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  /* the same path writes Budget applies to its atlas, for a private copy (comparisons and proposals never touch the live atlas) */
  function applyOpsTo(w, ops) { (ops || []).forEach(function (o) { var parts = String(o.path).split('/'), cur = w; for (var i = 0; i < parts.length - 1; i++) { if (cur[parts[i]] == null || typeof cur[parts[i]] !== 'object') cur[parts[i]] = {}; cur = cur[parts[i]]; }
      var leaf = parts[parts.length - 1], op = o.op || 'set';
      if (op === 'add' && Array.isArray(cur[leaf])) { if (cur[leaf].indexOf(o.value) < 0) cur[leaf].push(o.value); }
      else if (op === 'remove' && Array.isArray(cur[leaf])) cur[leaf] = cur[leaf].filter(function (x) { return x !== o.value; });
      else if (op === 'drop') delete cur[leaf]; else cur[leaf] = o.value; }); w.rev = (w.rev || 0) + 1; return w; }
  function EVL() { return root.JAtlasEval; }
  /* which item's values hold the schedule for this calendar entry on this day, and the values in force that day */
  function entryOn(w, id, day) { var E = EVL(), eff = effItem(w, id) || w.items[id], ev = (eff && eff.values) || {}, tid = id;
    var sel = selectedRef(w, id), H = typeof handoffOf === 'function' ? handoffOf(w, id) : null, ho = null; (function find(x) { if (!x || !x.then) return; if (!x.then.delta) { ho = x.then; return; } find(x.then); })(ev);
    if (H) tid = String(day) < String(H.date) ? H.prev : H.sel;
    else if (sel && !(ho && String(day) < String(ho.date))) { var sv = (w.items[bare(sel)] || {}).values || {}; if (sv.date != null && sv.date !== '') tid = bare(sel); }
    var tv = (w.items[tid] || {}).values || {}, R = E.valuesOn(tv, day), on = E.valuesOn(ev, day).values, X = R.values.ex || {}, key = day;
    Object.keys(X).forEach(function (k) { if (X[k] && X[k].moved === day) key = k; });
    var ch = E.charges(eff, String(day).slice(0, 7))[day];
    return { id: id, tid: tid, name: (w.items[id] || {}).name || id, label: ((w.items[id] || {}).name || id) + ((w.items[id] || {}).alts && w.items[tid] && tid !== id ? ': ' + w.items[tid].name : ''), values: on, path: R.path, exKey: key, ex: X[key] || null, charge: ch == null ? null : ch, repeating: (on.repeat || 'once') !== 'once' && !((on.repeat === 'dates') && (!Array.isArray(on.on) || on.on.length < 2)),
      first: String(R.values.date || '') === String(key), income: on.flow === 'in' || on.type === 'income', routine: on.type === 'routine' }; }
  function occBase(tid, path) { return 'items/' + tid + '/values' + path.map(function (p) { return '/' + p; }).join(''); }
  function hm(t) { var q = /^\s*(\d{1,2})(?::(\d{2}))?\s*$/.exec(String(t == null ? '' : t)); if (!q) return ''; return pad2(Math.min(23, +q[1])) + ':' + pad2(Math.min(59, +(q[2] || 0))); }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  /* form -> the changes it asks for: {amount?, time?, endTime?, allDay?, moved?, skip?, outcome?, note?, actual?} or {error} */
  function occChanges(F, e) { var c = {}, sign = e.income ? 1 : -1;
    if (F.mode === 'actual') { c.actual = true; c.outcome = F.outcome || 'done'; var note = String(F.onote || '').trim(); if (note) c.note = note;
      if (c.outcome === 'skipped') { c.skip = true; return c; }
      if (c.outcome === 'changed') { var a = BR.num(F.oamount); if (!(a >= 0)) return { error: 'Enter what it actually cost.' }; c.amount = BR.r2(sign * a); }
      return c; }
    if (F.oskip) { c.skip = true; return c; }
    if (!e.routine && String(F.oamount == null ? '' : F.oamount).trim() !== '') { var n = BR.num(F.oamount); if (!(n >= 0)) return { error: 'Enter an amount of 0 or more.' }; var want = BR.r2(sign * n), had = e.charge == null ? 0 : BR.r2(e.charge); if (want !== had) c.amount = want; }
    var d = String(F.odate || '').trim(); if (d && d !== F.day) { if (!BR.pdate(d)) return { error: 'Date must be a real date, YYYY-MM-DD.' }; c.moved = d; }
    var wantAll = !!F.oallDay, t = wantAll ? '' : hm(F.otime), en = wantAll ? '' : hm(F.oend), ev = e.values, o = e.ex || {}, hadT = o.time != null ? o.time : (ev.allDay ? '' : (ev.time || '')), hadE = o.endTime != null ? o.endTime : (ev.allDay ? '' : (ev.endTime || ''));
    if (!wantAll && String(F.otime || '').trim() && !t) return { error: 'Time must look like 07:30.' };
    if (t !== hadT) c.time = t; if (en !== hadE) c.endTime = en;
    return c; }
  /* scope 'once' writes values.ex[day]; 'future' starts a new phase (values.then, a delta) from this occurrence on. Earlier occurrences are never rewritten. */
  function occOps(w, e, c, scope, day) { var ops = [], base = occBase(e.tid, e.path), tv = (w.items[e.tid] || {}).values || {}, ph = tv; e.path.forEach(function (p) { ph = (ph && ph[p]) || {}; });
    function exWith(extra) { var X = clone(ph.ex || {}), cur = Object.assign({}, X[e.exKey] || {}, extra); Object.keys(cur).forEach(function (k) { if (cur[k] === undefined) delete cur[k]; }); X[e.exKey] = cur; return X; }
    if (scope !== 'future' || !e.repeating) { var one = {}; ['amount', 'time', 'endTime', 'moved', 'skip', 'outcome', 'note', 'actual'].forEach(function (k) { if (c[k] !== undefined) one[k] = c[k]; });
      if (c.actual) one.at = budgetTodayKey(); if (c.skip) { one.moved = undefined; } if (c.outcome && c.outcome !== 'skipped') one.skip = undefined;
      /* an actual cost remembers the planned amount it replaced, so 'happened as planned' can put it back */
      var prevX = (ph.ex || {})[e.exKey] || {};
      if (c.actual && c.outcome === 'changed' && prevX.was === undefined) one.was = (prevX.amount != null && !prevX.actual) ? prevX.amount : null;
      if (c.actual && c.outcome !== 'changed' && prevX.was !== undefined) { one.amount = prevX.was === null ? undefined : prevX.was; one.was = undefined; }
      if (Object.keys(one).length) ops.push({ path: base + '/ex', op: ph.ex ? 'set' : 'add', value: exWith(one) }); return ops; }
    /* this and future */
    var delta = {}; if (c.amount !== undefined) delta.amount = c.amount; if (c.time !== undefined) { delta.time = c.time; delta.allDay = !c.time; } if (c.endTime !== undefined) delta.endTime = c.endTime;
    var start = c.moved || day, sameStart = e.first && !c.moved;
    if (sameStart) { Object.keys(delta).forEach(function (k) { ops.push({ path: base + '/' + k, op: ph[k] === undefined ? 'add' : 'set', value: delta[k] }); }); }
    else { var nx = Object.assign({ delta: true, cut: e.exKey, date: start }, delta); if (ph.then && String(ph.then.date) > String(start)) nx.then = clone(ph.then);
      /* overrides already made for this day or later belong to the new phase */
      var X = ph.ex || {}, keep = {}, moved = {}; Object.keys(X).forEach(function (k) { if (String(k) >= String(e.exKey)) moved[k] = X[k]; else keep[k] = X[k]; }); delete moved[e.exKey];
      if (Object.keys(moved).length) { nx.ex = moved; ops.push({ path: base + '/ex', op: 'set', value: keep }); }
      ops.push({ path: base + '/then', op: ph.then ? 'set' : 'add', value: nx }); }
    if (c.actual) { var rec = { actual: true, outcome: c.outcome, at: budgetTodayKey() }; if (c.note) rec.note = c.note;
      if (sameStart) ops.push({ path: base + '/ex', op: ph.ex ? 'set' : 'add', value: exWith(rec) });
      else { var last = ops[ops.length - 1]; last.value.ex = Object.assign({}, last.value.ex || {}); last.value.ex[start] = rec; } }
    return ops; }

  function occOpen(V, id, mode) { var w = AW(V), day = calNavOf(V).day; if (!day || !w.items[id]) return; var e = entryOn(w, id, day), v = e.values, o = e.ex || {};
    V.form = { kind: 'occ', mode: mode, item: id, day: day, oamount: e.charge == null ? '' : String(Math.abs(BR.r2(e.charge))), odate: day, oallDay: o.time != null ? !o.time : (!!v.allDay || !v.time), otime: o.time != null ? o.time : (v.time || ''), oend: o.endTime != null ? o.endTime : (v.endTime || ''),
      outcome: o.outcome || 'done', onote: o.note || '', cmp: mode === 'actual', error: '' };
    V.formFocus = mode === 'actual' ? 'onote' : 'oamount'; V.note = (mode === 'actual' ? 'record ' : 'change ') + e.name + ' on ' + day; return redraw(V); }
  function occFormVM(V, w, F) { var X = VM(), e = entryOn(w, F.item, F.day), kids = [], lab = function (t) { return X.text('l', t, 'body', { bold: true }); };
    if (F.mode === 'actual') { kids.push(X.text('title', 'What happened: ' + e.name + ' on ' + F.day, 'h'));
      kids.push(X.row('out', [lab('Outcome:'), X.btn('o:done', 'Happened as planned', 'occ:outcome:done', { on: F.outcome === 'done' }), !e.routine && X.btn('o:changed', 'Cost was different', 'occ:outcome:changed', { on: F.outcome === 'changed' }), X.btn('o:skipped', 'Did not happen', 'occ:outcome:skipped', { on: F.outcome === 'skipped' })].filter(Boolean)));
      if (F.outcome === 'changed') kids.push(X.row('f:oamount', [lab(e.income ? 'Actual amount:' : 'Actual cost:'), X.field('f', 'oamount', '0.00', { w: 140, v: F.oamount })]));
      kids.push(X.row('f:onote', [lab('Note (optional):'), X.field('f', 'onote', 'What changed', { w: 320, v: F.onote })])); }
    else { kids.push(X.text('title', 'Change ' + e.name + ' on ' + F.day, 'h'));
      if (!e.routine) kids.push(X.row('f:oamount', [lab(e.income ? 'Amount:' : 'Cost:'), X.field('f', 'oamount', '0.00', { w: 140, v: F.oamount })]));
      kids.push(X.row('f:odate', [lab('Date:'), X.field('f', 'odate', 'YYYY-MM-DD', { w: 140, v: F.odate })]));
      var tr = [lab('Time:'), X.btn('allday', 'All day', 'occ:allday', { on: !!F.oallDay })]; if (!F.oallDay) tr.push(X.text('a', 'from', 'muted'), X.field('f', 'otime', '07:00', { w: 90, v: F.otime }), X.text('b', 'to', 'muted'), X.field('f2', 'oend', '16:00', { w: 90, v: F.oend }));
      kids.push(X.row('f:otime', tr)); }
    if (F.error) kids.push(X.text('err', F.error, 'flag'));
    var acts = [];
    if (F.mode === 'actual') { acts.push(X.btn('ok', e.repeating ? 'Record for this occurrence only' : 'Record', 'occ:ok:once', { kind: 'primary' })); if (e.repeating && F.outcome === 'changed') acts.push(X.btn('okf', 'Record and update future occurrences', 'occ:ok:future')); }
    else if (e.repeating) acts.push(X.btn('ok', 'This occurrence only', 'occ:ok:once', { kind: 'primary' }), X.btn('okf', 'This and future occurrences', 'occ:ok:future'), X.btn('skip', 'Skip this occurrence', 'occ:skip'));
    else acts.push(X.btn('ok', 'Save', 'occ:ok:once', { kind: 'primary' }));
    acts.push(X.btn('cancel', 'Cancel', 'form:cancel')); kids.push(X.row('acts', acts));
    if (e.repeating) kids.push(X.text('scope', 'Earlier occurrences keep what they have. A change to future occurrences starts from this one.', 'muted'));
    /* the comparison can be closed without touching the entry above; recording is its own button */
    if (F.mode === 'actual') { if (F.cmp) { var c = occChanges(F, e), after = null; if (!c.error) { after = applyOpsTo(clone(w), occOps(w, e, c, 'once', F.day)); }
        kids.push(compareVM(V, w, after || w, { title: 'Plan before and after this record', closeAct: 'occ:cmp:hide', closeLabel: 'Hide comparison', month: F.day.slice(0, 7), note: after ? '' : 'Enter the outcome to see the change.' })); }
      else kids.push(X.row('cmpshow', [X.btn('show', 'Show plan comparison', 'occ:cmp:show')])); }
    return X.col('form', kids, { role: 'detail', slab: 'inner', enter: true }); }

  function occSave(V, scope) { var F = V.form, w = AW(V); if (!F || F.kind !== 'occ') return; var e = entryOn(w, F.item, F.day), c = occChanges(F, e);
    if (c.error) { F.error = c.error; V.note = c.error; return redraw(V); }
    var ops = occOps(w, e, c, scope, F.day); clearFormFields(V); V.form = null; V.formFocus = null;
    if (!ops.length) { V.note = 'nothing changed'; return redraw(V); }
    /* an actual update is applied at once; the comparison stays up until it is closed, and closing it changes nothing */
    if (F.mode === 'actual') V.cmp = { before: JSON.stringify(w), title: 'Plan before and after recording ' + e.name + ' on ' + F.day, month: F.day.slice(0, 7) };
    V.note = (F.mode === 'actual' ? 'recorded ' : 'changed ') + e.name + (scope === 'future' && e.repeating ? ' from ' + F.day + ' on' : ' on ' + F.day);
    return submitViews(ops, 'occ:' + F.mode + ':' + scope, V); }

  function fmtTime(v, o) { var t = o && o.time != null ? o.time : (v.allDay ? '' : (v.time || '')), en = o && o.endTime != null ? o.endTime : (v.allDay ? '' : (v.endTime || '')); return t ? t + (en ? '–' + en : '') : 'All day'; }
  var OUTCOME = { done: 'happened as planned', changed: 'cost was different', skipped: 'did not happen' };
  /* the full Calendar's day view: every entry of the day with its time and that day's amount, and the two things one does to it */
  function dayVM(V, w, day) { var X = VM(), its = itemsOnDay(w, day, V), F = V.form, kids = [];
    if (typeof resilienceVM === 'function') resilienceVM(V, w, day).forEach(function (k) { kids.push(k); });
    var rows = its.map(function (it) { return entryOn(w, it.id, day); }).sort(function (a, b) { var x = fmtTime(a.values, a.ex), y = fmtTime(b.values, b.ex); x = x === 'All day' ? '' : x; y = y === 'All day' ? '' : y; return x < y ? -1 : x > y ? 1 : 0; });
    /* an occurrence recorded as not happening stays listed for the day it was planned on */
    Object.keys(w.items || {}).forEach(function (id) { if (rows.some(function (r) { return r.id === id; })) return; var cal = ((w.components[(w.meta && w.meta.calId) || 'budget'] || {}).items) || []; if (cal.indexOf('item:' + id) < 0) return;
      var e = entryOn(w, id, day); if (e.ex && e.ex.skip && e.ex.actual && e.exKey === day) rows.push(e); });
    if (!rows.length) kids.push(X.text('empty', 'Nothing scheduled on this day.', 'muted'));
    rows.forEach(function (e) { var o = e.ex || {}, amt = e.routine ? '' : (e.charge == null ? (o.skip ? 'not charged' : '$0.00') : (e.income ? '+' : '') + BR.money(e.income ? e.charge : Math.abs(e.charge)));
      kids.push(X.row('e:' + e.id, [X.text('t', fmtTime(e.values, o), 'muted'), X.text('n', e.label || e.name, 'body', { bold: true }), amt && X.text('a', amt, 'body'), X.btn('open', 'Open', 'occ:actions:' + e.id)].filter(Boolean)));
      var notes = []; if (o.actual) notes.push('Recorded: ' + (OUTCOME[o.outcome] || o.outcome) + (o.note ? ' · ' + o.note : ''));
      if (o.moved && e.exKey !== day) notes.push('Moved here from ' + e.exKey); if (e.repeating) notes.push(BR.repeatLabel(e.values));
      if (notes.length) kids.push(X.text('n:' + e.id, notes.join(' · '), 'small', { indent: 18 }));
      if (F && F.kind === 'occ' && F.item === e.id && F.day === day) kids.push(occFormVM(V, w, F));
      if (V.alt2 && V.alt2.item === e.id && typeof altPanelVM === 'function') kids.push(altPanelVM(V, w, e.id)); });
    if (V.cmp && !(F && F.kind === 'occ' && F.mode === 'actual')) { var before = null; try { before = JSON.parse(V.cmp.before); } catch (err) {}
      if (before) kids.push(compareVM(V, before, w, { title: V.cmp.title, closeAct: 'occ:cmp:close', closeLabel: 'Close comparison', month: V.cmp.month, note: 'The record is saved. Closing this comparison does not undo it.' })); }
    kids.push(X.row('add', [X.btn('add', 'Add to ' + day, 'add:open', { kind: 'ghost' })]));
    if (F && F.kind === 'actions') return actionsVM(V, w, F);
    if (F && F.kind === 'add') return addChooserVM(V, w, F);
    if (F && F.kind === 'activity') { var form = activityFormVM(V, w, F); return [form]; }
    if (F && F.kind === 'fin') { var ff = finFormVM(V, w, F); return [X.row('back', [X.btn('b', '< ' + day, 'form:cancel')]), ff]; }
    return kids; }

  /* ---- before and after: the full dependencies and sequence of two atlases side by side, with the month's money ---- */
  function planTable(key, A, month, other, moLabel) { var X = VM(), E = EVL(), w = effAtlas(A), pid = (w.meta && w.meta.planId) || 'reqs', c = (w.components || {})[pid] || { items: [] }, D = depsRows(w, c), o = other ? effAtlas(other) : null, oD = o ? depsRows(o, (o.components || {})[pid] || { items: [] }) : null, oBy = {}, changed = 0;
    function cells(Aw, R) { var it = Aw.items[R.id], pc = planCells(Aw, R.id, null), ch = it ? E.charges(effItem(Aw, R.id) || it, month) : {}, m = 0; Object.keys(ch).forEach(function (d) { m += +ch[d] || 0; });
      return [R.seq, R.step, R.when, R.req, (typeof selLabel === 'function' && selLabel(Aw, R.id)) || String(pc[0]).replace(/ \(Exp7 Best\(\)\)$/, '').replace(/ \(no alternatives\)$/, ''), m ? BR.money(m) : '—']; }
    if (oD) oD.rows.forEach(function (R) { if (!R.broken) oBy[R.id] = cells(o, R); });
    var rows = D.rows.map(function (R) { if (R.broken) return { k: 'b:' + R.id, cells: [{ text: 'broken reference ' + R.id }] }; var cs = cells(w, R), was = oBy[R.id], diff = false;
      var out = cs.map(function (t, i) { if (o && (!was || String(was[i]) !== String(t)) && i > 0) { diff = true; return { text: '* ' + t, color: '#75510f' }; } return { text: t }; }); if (diff) changed++; return { k: R.id, cells: out }; });
    /* a step the other side has and this side does not: say so instead of leaving a silent gap */
    if (oD) oD.rows.forEach(function (R) { if (R.broken || D.rows.some(function (q) { return q.id === R.id; })) return; changed++; rows.push({ k: 'gone:' + R.id, cells: [{ text: '' }, { text: '* ' + R.step + ' is no longer a step', color: '#75510f' }] }); });
    var f = budgetFigures(A, month);
    return { changed: changed, steps: D.rows.length, figures: f, node: { t: 'table', k: key, cols: [{ k: 'seq', label: '#' }, { k: 'step', label: 'Step' }, { k: 'when', label: 'When' }, { k: 'req', label: 'Requires' }, { k: 'sel', label: 'Selected item' }, { k: 'mo', label: moLabel || 'This month' }], rows: rows } }; }
  function compareVM(V, before, after, O) { var X = VM(), month = O.month || budgetMonthKey(), L = planTable('before', before, month, null, O.moLabel), R = planTable('after', after, month, before, O.moLabel);
    var kids = [X.row('head', [X.text('t', O.title || 'Plan before and after', 'h'), O.closeAct && X.btn('close', O.closeLabel || 'Close', O.closeAct)].filter(Boolean))];
    if (O.note) kids.push(X.text('note', O.note, 'muted'));
    /* Phone-first: Before and After are stacked sections (dependencies and sequence, not a cost summary). */
    kids.push(X.col('b', [X.text('h', 'Before · ' + L.steps + (L.steps === 1 ? ' step' : ' steps'), 'body', { bold: true }), L.node], { gap: 8 }));
    kids.push(X.col('a', [X.text('h', 'After · ' + R.steps + (R.steps === 1 ? ' step' : ' steps') + ' · ' + R.changed + ' changed', 'body', { bold: true }), R.node], { gap: 8 }));
    return X.col('compare', kids, { role: 'section', slab: 'inner' }); }

  function occAct(V, a) { var F = V.form, m;
    if ((m = /^occ:actions:(.+)$/.exec(a))) { if (m[1] === 'close') { V.form = null; return redraw(V); } V.form = { kind: 'actions', item: m[1], day: (calNavOf(V).day || budgetDateKey()) }; return redraw(V); }
    if ((m = /^occ:edit:(.+)$/.exec(a))) return occOpen(V, m[1], 'change');
    if ((m = /^occ:actual:(.+)$/.exec(a))) return occOpen(V, m[1], 'actual');
    if ((m = /^occ:pref:(.+)$/.exec(a))) { var oid = m[1], cat = ownerOf(AW(V), oid); if (cat) return alt2Act(V, 'alt2:pref:' + cat + '/' + oid); return; }
    if ((m = /^occ:unavail:(.+)$/.exec(a))) { var uid = m[1], ucat = ownerOf(AW(V), uid); if (ucat) return alt2Act(V, 'alt2:unavail:' + ucat + '/' + uid); return; }
    if (a === 'occ:cmp:close') { V.cmp = null; V.note = 'comparison closed'; return redraw(V); }
    if (!F || F.kind !== 'occ') return;
    if ((m = /^occ:outcome:(done|changed|skipped)$/.exec(a))) { F.outcome = m[1]; F.error = ''; if (m[1] === 'changed') V.formFocus = 'oamount'; return redraw(V); }
    if (a === 'occ:allday') { F.oallDay = !F.oallDay; return redraw(V); }
    if (a === 'occ:cmp:hide') { F.cmp = false; return redraw(V); }
    if (a === 'occ:cmp:show') { F.cmp = true; return redraw(V); }
    if (a === 'occ:skip') { F.oskip = true; return occSave(V, 'once'); }
    if (a === 'occ:ok:once') return occSave(V, 'once');
    if (a === 'occ:ok:future') return occSave(V, 'future'); }

/* ---- C. Alternatives, their requirements, and proposals ----
   A scheduled entry starts as a plain item. Its first alternative asks for the category the choices share; that category then
   stands where the entry stood (Calendar, Board, Plan) and runs on its accepted choice (state.userPick).
   Requirements of a choice are items with values.forAlt = that choice. They are in force only while the choice is.
   'Preferred' (alts.pref) is a mark. It never selects: it opens a proposal, kept outside the atlas, that the user accepts or discards. */
  function catIndex(w) { var hit = CIDX.get(w.items); if (hit && hit.rev === (w.rev || 0)) return hit; var owner = {}, reqs = {};
    Object.keys(w.items || {}).forEach(function (id) { var it = w.items[id]; if (!it) return; catMembers(it).forEach(function (m) { if (m !== 'item:' + id && !owner[m]) owner[m] = id; });
      var f = it.values && it.values.forAlt; if (f) (reqs[bare(f)] = reqs[bare(f)] || []).push(id); });
    hit = { rev: w.rev || 0, owner: owner, reqs: reqs }; CIDX.set(w.items, hit); return hit; }
  var CIDX = new WeakMap();
  function reqsOf(w, xid) { return (catIndex(w).reqs[bare(xid)] || []).slice(); }
  function ownerOf(w, xid) { return catIndex(w).owner['item:' + bare(xid)] || null; }
  function dayBefore(d) { return BR.addDays(d, -1); }
  /* a category made here has no schedule of its own; when its accepted choice starts later than the one it displaced, the displaced one runs until then */
  function handoffOf(w, cid) { var c = w.items[cid]; if (!c || !c.alts) return null; var v = c.values || {}; if (v._eff) return v._handoff || null; if (v.date != null && v.date !== '') return null;
    var st = c.state || {}, ref = selectedRef(w, cid), sel = ref && w.items[bare(ref)], prev = st.prev && w.items[bare(st.prev)];
    if (!sel || !prev || prev === sel) return null; var pd = (prev.values || {}).date, sd = (sel.values || {}).date; if (!pd || !sd || !(String(sd) > String(pd))) return null;
    return { prev: bare(st.prev), sel: bare(ref), date: String(sd) }; }
  function withHandoff(v, t) { var out = Object.assign({}, v); if (out.then && out.then.delta) { var cut = out.then.cut || out.then.date; if (String(t.date) <= String(cut)) out.then = t; else out.then = withHandoff(out.then, t); } else out.then = t; return out; }
  function reqActivity(w, it) { var x = bare(it.values.forAlt), cid = ownerOf(w, x); if (!cid) return { active: true };
    var ref = selectedRef(w, cid), H = handoffOf(w, cid);
    if (ref && bare(ref) === x) return { active: true };
    if (H && H.prev === x) { var cap = dayBefore(H.date); if (String((it.values || {}).date || '') > String(cap)) return { active: false }; return { active: true, until: cap }; }
    return { active: false }; }
  /* the item as the plan runs it: a category on its accepted choice, a requirement only while its choice is in force */
  function eff(w, id, it) { var v = it.values || {}; if (v._eff) return it;
    if (it.alts) { var ref = selectedRef(w, id), sel = ref && w.items[bare(ref)]; if (!sel) return it; var H = handoffOf(w, id);
      if (H) { var prev = w.items[H.prev], base = catOverlay(v, prev), t = {}; CAT_KEYS.forEach(function (k) { var x = (sel.values || {})[k]; if (x != null && x !== '') t[k] = x; }); if (t.amount == null) t.amount = 0;
        base = withHandoff(base, t); base.thenName = sel.name || H.sel; base._eff = 1; base._handoff = H; return Object.assign({}, it, { values: base }); }
      var ov = catOverlay(v, sel); ov._eff = 1; return Object.assign({}, it, { values: ov }); }
    if (v.forAlt) { var a = reqActivity(w, it); if (a.active && !a.until) return it; var nv = Object.assign({}, v);
      if (!a.active) { delete nv.date; nv.inactive = true; } else if (!nv.until || String(nv.until) > String(a.until)) nv.until = a.until;
      return Object.assign({}, it, { values: nv }); }
    return it; }
  function effHas(it) { return !!(it && (it.alts || (it.values && it.values.forAlt))); }
  /* the Plan lists a requirement only while its choice is in force */
  function planList(w, L) { return (L || []).filter(function (r) { var it = w.items[bare(r)]; if (!it || !(it.values && it.values.forAlt)) return true; return reqActivity(w, it).active; }); }
  function planInfo(w, id) { var it = w.items[id], out = {}; if (!it) return out; var v = it.values || {};
    if (v.forAlt) { var x = w.items[bare(v.forAlt)], cid = ownerOf(w, bare(v.forAlt)); out.nb = (cid ? (w.items[cid].name + ': ') : '') + (x ? x.name : bare(v.forAlt)); var ra = reqActivity(w, it), d0 = (w.items[id].values || {}).date; if (ra.active && ra.until && d0) out.when = d0 + ' to ' + ra.until; }
    var of = [];
    if (it.alts) { var ref = selectedRef(w, id), H = handoffOf(w, id); if (H) of.push(H.prev); if (ref) of.push(bare(ref)); } else of.push(id);
    var names = []; of.forEach(function (x) { reqsOf(w, x).forEach(function (r) { var R = w.items[r]; if (R && reqActivity(w, R).active && names.indexOf(R.name) < 0) names.push(R.name); }); });
    if (names.length) out.req = names.join(', ');
    return out; }
  function selLabel(w, id) { var it = w.items[id]; if (!it || !it.alts) return null; var ref = selectedRef(w, id), s = ref && w.items[bare(ref)], H = handoffOf(w, id), p = it.alts.pref && w.items[bare(it.alts.pref)];
    var t = s ? s.name : 'No available item'; if (H) t = (w.items[H.prev] || {}).name + ' until ' + dayBefore(H.date) + ', then ' + t;
    if (p && it.alts.pref !== ref) t += ' · preferred: ' + p.name; return t; }

  /* ---- proposals: kept beside the atlas (their own saved record), never in it ---- */
  var LOCAL_PROPS = [];
  function pstore() { return root.__budgetProposals || null; }
  function allProps() { var S = pstore(); return (S ? S.list() : LOCAL_PROPS) || []; }
  function saveProps(L) { var S = pstore(); if (S) S.save(L); else LOCAL_PROPS = L; }
  function props(w) { return allProps().filter(function (p) { return p && w.items[p.cat] && w.items[bare(p.to)] && catMembers(w.items[p.cat]).indexOf(p.to) >= 0; }); }
  function propFor(w, cat, to) { return props(w).filter(function (p) { return p.cat === cat && p.to === to; })[0] || null; }
  function putProp(p) { var L = allProps().filter(function (q) { return q.id !== p.id; }); L.push(p); saveProps(L); }
  function dropProp(id) { saveProps(allProps().filter(function (q) { return q.id !== id; })); }
  function unresolved(w, p) { return seedReqs(w, bare(p.from)).filter(function (r) { if (!w.items[r] || (w.items[r].values && w.items[r].values.forAlt && !reqActivity(w, w.items[r]).active)) return false; var rv = (p.reviews || {})[r]; if (!rv) return true; if (rv.d === 'none') return false; return !(rv.ref && w.items[bare(rv.ref)] && (w.items[bare(rv.ref)].values || {}).date); }); }
  function ensureProp(w, cat, to, source, proposed) { var cur = selectedRef(w, cat); if (cur === to) return null; var p = propFor(w, cat, to);
    if (!p) p = { id: 'p' + Date.now().toString(36) + Math.floor(Math.random() * 1e4), cat: cat, to: to, from: cur, reviews: {}, created: budgetTodayKey(), proposed: false, source: source };
    if (p.from !== cur) { p.from = cur; }
    if (proposed) { p.proposed = true; p.source = source; allProps().forEach(function (q) { if (q.cat === cat && q.id !== p.id && q.proposed) { q.proposed = false; putProp(q); } }); }
    putProp(p); return p; }
  function acceptOps(w, p) { var c = w.items[p.cat], ops = [], st = c.state && typeof c.state === 'object' ? c.state : null, T = w.items[bare(p.to)];
    if (!st) ops.push({ path: 'items/' + p.cat + '/state', op: 'add', value: { userPick: p.to, prev: p.from } });
    else { ops.push({ path: 'items/' + p.cat + '/state/userPick', op: Object.prototype.hasOwnProperty.call(st, 'userPick') ? 'ref' : 'add', value: p.to }); ops.push({ path: 'items/' + p.cat + '/state/prev', op: st.prev === undefined ? 'add' : 'set', value: p.from }); }
    if (T && Object.keys(p.reviews || {}).length) ops.push({ path: 'items/' + bare(p.to) + '/values/reqReview', op: (T.values || {}).reqReview === undefined ? 'add' : 'set', value: clone(p.reviews) });
    return ops; }
  function afterAtlas(w, p) { return applyOpsTo(clone(w), acceptOps(w, p)); }
  function refreshAll() { Object.keys(root.JVS || {}).forEach(function (k) { var v = root.JVS[k]; if (v && v.sess && v.queue) { try { v.queue(v.sess, 'form'); } catch (e) {} } });
    var h = root.budget && root.budget.home && root.budget.home(); if (h && h.update) { try { h.update(root.budget.W()); } catch (e) {} } }
  var OPEN_PROP = null;
  function openProp(id) { OPEN_PROP = id; if (root.__budgetChromeAct) root.__budgetChromeAct('budget:tab:plan'); refreshAll(); }

  /* ---- forms ---- */
  function schedLabel(v) { v = v || {}; var a = v.amount == null || v.amount === '' ? null : +v.amount; return (a ? BR.money(Math.abs(a)) + ' ' : '') + BR.repeatLabel(v); }
  function repRow(F, same) { var X = VM(), rp = F.rep || (same ? 'same' : 'once'), out = [], b = [X.text('l', 'Repeats:', 'body', { bold: true })];
    if (same) b.push(X.btn('r:same', 'Same schedule as ' + same, 'alt2:rep:same', { on: rp === 'same' }));
    b.push(X.btn('r:once', 'Once', 'alt2:rep:once', { on: rp === 'once' }), X.btn('r:md', 'Dates each month', 'alt2:rep:monthdays', { on: rp === 'monthdays' }), X.btn('r:ev', 'Every X days', 'alt2:rep:every', { on: rp === 'every' })); out.push(X.row('rep', b));
    if (rp === 'monthdays') out.push(X.row('f:rdays', [X.text('l', 'Days of the month:', 'body', { bold: true }), X.field('f', 'rdays', '1, 15', { w: 140, v: F.rdays != null ? F.rdays : '' })]));
    if (rp === 'every') out.push(X.row('f:revery', [X.text('l', 'Days between:', 'body', { bold: true }), X.field('f', 'revery', '7', { w: 100, v: F.revery != null ? F.revery : '' })]));
    if (rp === 'monthdays' || rp === 'every') out.push(X.row('f:runtil', [X.text('l', 'Until (optional):', 'body', { bold: true }), X.field('f', 'runtil', 'YYYY-MM-DD', { w: 140, v: F.runtil != null ? F.runtil : '' })]));
    return out; }
  /* schedule values from the form; 'same' copies how another item repeats, from the new start date */
  function schedFrom(F, start, like) { var rp = F.rep || (like ? 'same' : 'once');
    if (rp === 'same' && like) { var lv = like.values || {}, o = { date: start, repeat: lv.repeat || 'once' }; if (lv.every != null) o.every = lv.every; if (lv.on != null) o.on = clone(lv.on);
      if (o.repeat === 'monthdays') o.date = firstMonthday(start, BR.monthDayList(o.on)) || start; if (o.repeat === 'dates') { o.repeat = 'once'; delete o.on; } return { ok: true, patch: o }; }
    if (rp === 'once') return { ok: true, patch: { date: start, repeat: 'once' } };
    var R = repeatValues({ rep: rp, rdays: F.rdays, revery: F.revery, runtil: F.runtil }, start); if (!R.ok) return R; delete R.patch.days; return R; }
  function alt2FormVM(V, w, F) { var X = VM(), kids = [], lab = function (t) { return X.text('l', t, 'body', { bold: true }); }, e = w.items[F.item] || {};
    if (F.step === 'cat') { kids.push(X.text('title', 'Name the category', 'h'));
      kids.push(X.text('hint', e.name + ' and its alternatives are choices for the same need. Name that need, such as Transportation.', 'muted'));
      kids.push(X.row('f:cname', [lab('Category:'), X.field('f', 'cname', 'Category name', { w: 260, v: F.cname || '' })]));
      if (F.error) kids.push(X.text('err', F.error, 'flag'));
      kids.push(X.row('acts', [X.btn('ok', 'Next', 'alt2:ok', { kind: 'primary' }), X.btn('cancel', 'Cancel', 'form:cancel')])); }
    if (F.step === 'alt') { var cur = F.curName || e.name; kids.push(X.text('title', 'New alternative' + (F.cname ? ' in ' + F.cname : ''), 'h'));
      kids.push(X.text('hint', 'An alternative can differ in cost, timing and what it requires. It changes nothing until you accept a proposal that uses it.', 'muted'));
      kids.push(X.row('f:aname', [lab('Name:'), X.field('f', 'aname', 'Alternative name', { w: 260, v: F.aname || '' })]));
      kids.push(X.row('pref', [X.btn('star', F.preferred ? '\u2605' : '\u2606', 'alt2:star', { on: !!F.preferred }), X.text('pl', 'Mark preferred', 'muted')]));
      kids.push(X.row('f:aamount', [lab(F.income ? 'Amount each time:' : 'Cost each time:'), X.field('f', 'aamount', '0.00', { w: 140, v: F.aamount || '' })]));
      kids.push(X.row('f:adate', [lab('Starts:'), X.field('f', 'adate', 'YYYY-MM-DD', { w: 140, v: F.adate || '' })]));
      repRow(F, cur).forEach(function (k) { kids.push(k); });
      if (F.error) kids.push(X.text('err', F.error, 'flag'));
      kids.push(X.row('acts', [X.btn('ok', 'Continue to requirements', 'alt2:ok', { kind: 'primary' }), X.btn('cancel', 'Cancel', 'form:cancel')])); }
    if (F.step === 'req') { var x = w.items[F.forItem] || {}, rep = F.replaces && w.items[F.replaces]; kids.push(X.text('title', 'New requirement of ' + (x.name || F.forItem), 'h'));
      kids.push(X.text('hint', rep ? 'This takes the place of ' + rep.name + ' when ' + x.name + ' is used. ' + rep.name + ' itself is not changed.' : 'Something ' + (x.name || 'this') + ' needs, with its own cost and dates. It counts only while ' + (x.name || 'this') + ' is in use.', 'muted'));
      kids.push(X.row('f:rname', [lab('Name:'), X.field('f', 'rname', 'Requirement name', { w: 260, v: F.rname || '' })]));
      kids.push(X.row('f:ramount', [lab('Cost each time:'), X.field('f', 'ramount', '0.00', { w: 140, v: F.ramount || '' })]));
      kids.push(X.row('f:rdate', [lab('First date:'), X.field('f', 'rdate', 'YYYY-MM-DD', { w: 140, v: F.rdate || '' })]));
      repRow(F, null).forEach(function (k) { kids.push(k); });
      if (F.error) kids.push(X.text('err', F.error, 'flag'));
      kids.push(X.row('acts', [X.btn('ok', 'Add requirement', 'alt2:ok', { kind: 'primary' }), X.btn('cancel', 'Cancel', 'form:cancel')])); }
    return X.col('form', kids, { role: 'detail', slab: 'inner', enter: true }); }

  function uid(name, V, taken) { var id = uniqItemId(name, V), n = 2, base = id; while (taken.indexOf(id) >= 0) id = base + '_' + (n++); taken.push(id); return id; }
  function compsWith(w, ref) { return Object.keys(w.components || {}).filter(function (k) { var L = w.components[k] && w.components[k].items; return Array.isArray(L) && L.indexOf(ref) >= 0; }); }
  function alt2Save(V) { var F = V.form, w = AW(V); if (!F || F.kind !== 'alt2') return; var e = w.items[F.item], ops = [], taken = [], calId = (w.meta && w.meta.calId) || 'budget';
    function fail(m) { F.error = m; V.note = m; return redraw(V); }
    if (F.step === 'cat') { var cn = String(F.cname || '').trim(); if (!cn) return fail('Give the category a name.'); F.cname = cn; F.step = 'alt'; F.error = ''; V.formFocus = 'aname'; return redraw(V); }
    if (F.step === 'alt') { if (!e) return; var an = String(F.aname || '').trim(), amt = BR.num(F.aamount), start = String(F.adate || '').trim(); if (!an) return fail('Give the alternative a name.');
      if (String(F.aamount || '').trim() !== '' && !(amt >= 0)) return fail('Enter a cost of 0 or more.'); if (!BR.pdate(start)) return fail('Start date must be a real date, YYYY-MM-DD.');
      var isCat = !!e.alts, curRef = isCat ? selectedRef(w, F.item) : 'item:' + F.item, cur = curRef && w.items[bare(curRef)], ev = (cur && cur.values) || e.values || {}, S = schedFrom(F, start, cur); if (!S.ok) return fail(S.error);
      var income = ev.flow === 'in' || ev.type === 'income', tv = Object.assign({ type: ev.type || 'expense', flow: ev.flow || 'out', allDay: true, charge: 'per' }, S.patch); if (ev.type === 'expense' || !ev.type) tv.consume = true;
      if (amt > 0) tv.amount = BR.r2(income ? amt : -amt); else tv.amount = 0; if (ev.category) tv.category = ev.category;
      var tid = uid(an, V, taken), cid = F.item; ops.push({ path: 'items/' + tid, op: 'add', value: mkItemRecord(tid, an, { values: tv }) });
      if (!isCat) { cid = uid(F.cname, V, taken); var cv = { type: ev.type || 'expense', flow: ev.flow || 'out', isCategory: true }; if (ev.category) cv.category = ev.category; if (cv.type === 'expense') cv.consume = true;
        var rec = mkItemRecord(cid, F.cname, { values: cv, alts: { members: ['item:' + F.item, 'item:' + tid], pref: F.preferred ? 'item:' + tid : null, unavail: [], method: 'best' } }); rec.state = { userPick: 'item:' + F.item };
        ops.push({ path: 'items/' + cid, op: 'add', value: rec });
        compsWith(w, 'item:' + F.item).forEach(function (k) { ops.push({ path: 'components/' + k + '/items', op: 'remove', value: 'item:' + F.item }, { path: 'components/' + k + '/items', op: 'add', value: 'item:' + cid }); }); }
      else { ops.push({ path: 'items/' + cid + '/alts/members', op: 'add', value: 'item:' + tid }); if (F.preferred) ops.push({ path: 'items/' + cid + '/alts/pref', op: 'ref', value: 'item:' + tid }); }
      clearFormFields(V); V.form = null; V.formFocus = null; V.alt2 = { item: cid, open: {} }; V.alt2.open[tid] = true; V.note = 'added alternative ' + an;
      /* the choice in use has requirements: track their review for this alternative from the start */
      PENDING = (seedReqs(w, bare(curRef)).length || F.preferred) ? { cat: cid, to: 'item:' + tid, from: curRef, preferred: !!F.preferred } : null;
      var r = submitViews(ops, 'alt2:alt', V); if (PENDING) { var w2 = AW(V); if (w2.items[PENDING.cat]) { var pid = 'p' + Date.now().toString(36); putProp({ id: pid, cat: PENDING.cat, to: PENDING.to, from: PENDING.from, reviews: {}, created: budgetTodayKey(), proposed: !!PENDING.preferred, source: PENDING.preferred ? 'preferred' : 'setup' }); if (PENDING.preferred) OPEN_PROP = pid; } PENDING = null; refreshAll(); } return r; }
    if (F.step === 'req') { var x = w.items[F.forItem]; if (!x) return; var rn = String(F.rname || '').trim(), ra = BR.num(F.ramount), rd = String(F.rdate || '').trim(); if (!rn) return fail('Give the requirement a name.');
      if (String(F.ramount || '').trim() !== '' && !(ra >= 0)) return fail('Enter a cost of 0 or more.'); if (!BR.pdate(rd)) return fail('First date must be a real date, YYYY-MM-DD.');
      var RS = schedFrom(F, rd, null); if (!RS.ok) return fail(RS.error);
      var rv = Object.assign({ type: 'expense', flow: 'out', consume: true, allDay: true, charge: 'per', forAlt: 'item:' + F.forItem, amount: ra > 0 ? -BR.r2(ra) : 0, category: (x.values || {}).category || 'Requirement' }, RS.patch); if (F.replaces) rv.replaces = 'item:' + F.replaces;
      var rid = uid(rn, V, taken); ops = reqAddOps(w, rid, rn, rv);
      var pid = F.pid, rep = F.replaces; clearFormFields(V); V.form = null; V.formFocus = null; V.note = 'added requirement ' + rn;
      var out = submitViews(ops, 'alt2:req', V); if (pid && rep) { var p = allProps().filter(function (q) { return q.id === pid; })[0]; if (p) { p.reviews = p.reviews || {}; p.reviews[rep] = { d: 'own', ref: 'item:' + rid }; putProp(p); refreshAll(); } } return out; } }
  var PENDING = null;
  function reqAddOps(w, rid, name, values) { var calId = (w.meta && w.meta.calId) || 'budget', ops = [{ path: 'items/' + rid, op: 'add', value: mkItemRecord(rid, name, { values: values }) }, { path: 'components/' + finBoard('expense') + '/items', op: 'add', value: 'item:' + rid }, { path: 'components/' + calId + '/items', op: 'add', value: 'item:' + rid }];
    if (w.meta && w.meta.planOwn) ops.push({ path: 'components/' + ((w.meta && w.meta.planId) || 'reqs') + '/items', op: 'add', value: 'item:' + rid }); return ops; }
  function reqDropOps(w, rid) { var ops = []; compsWith(w, 'item:' + rid).forEach(function (k) { ops.push({ path: 'components/' + k + '/items', op: 'remove', value: 'item:' + rid }); }); ops.push({ path: 'items/' + rid, op: 'drop' }); return ops; }
  /* a reused requirement is a separate copy for the new choice, starting when that choice does; the original is not touched */
  function copyReq(w, V, rid, toId) { var R = w.items[rid], T = w.items[toId]; if (!R || !T) return null; var v = clone(R.values || {}), start = (T.values || {}).date || budgetTodayKey(); delete v.ex; delete v.then; delete v.replaces; v.forAlt = 'item:' + toId; v.copyOf = 'item:' + rid;
    if (v.date && String(v.date) < String(start)) { var rep = v.repeat || 'once';
      if (rep === 'every') { var n = Math.max(1, Math.floor(+v.every || 1)), gap = BR.dayDiff(v.date, start); v.date = BR.addDays(v.date, Math.ceil(gap / n) * n); }
      else if (rep === 'monthdays') v.date = firstMonthday(start, BR.monthDayList(v.on)) || start; else if (rep === 'monthly') v.date = firstMonthday(start, [BR.pdate(v.date).getDate()]) || start; else v.date = start; }
    if (v.until && String(v.until) < String(v.date)) delete v.until;
    var id = uid(R.name + ' ' + T.name, V, []); return { id: id, ops: reqAddOps(w, id, R.name + ' (' + T.name + ')', v) }; }

  /* ---- the panel under an entry: its choices, their marks and requirements ---- */
  function reqBlock(V, w, xid) { var X = VM(), out = [], L = reqsOf(w, xid), x = w.items[xid] || {};
    out.push(X.text('rh:' + xid, 'Requirements of ' + (x.name || xid) + (L.length ? '' : ': none yet'), 'body', { bold: true, indent: 12 }));
    L.forEach(function (r) { var R = w.items[r]; out.push(X.row('rq:' + r, [X.text('n', R.name, 'body'), X.text('s', schedLabel(R.values), 'small'), X.btn('rm', 'Remove', 'alt2:rmreq:' + r)], { indent: 24 })); });
    out.push(X.row('ra:' + xid, [X.btn('add', '+ Add requirement', 'alt2:addreq:' + xid)], { indent: 24 })); return out; }
  function propLine(w, p) { var n = unresolved(w, p).length, T = w.items[bare(p.to)], sd = (T.values || {}).date; return 'switch to ' + T.name + (sd ? ' from ' + sd : '') + (n ? ' · provisional: ' + n + ' requirement' + (n === 1 ? '' : 's') + ' to resolve' : ' · ready to review'); }
  function altPanelVM(V, w, id) { var X = VM(), it = w.items[id], kids = [], F = V.form, st = V.alt2 || {}; if (!it) return X.col('alt2', [], {});
    kids.push(X.row('head', [X.text('t', 'Alternatives and requirements: ' + it.name, 'h'), X.btn('close', 'Close', 'alt2:close')]));
    if (!it.alts) { kids.push(X.text('none', it.name + ' has no alternatives yet.', 'muted')); reqBlock(V, w, id).forEach(function (k) { kids.push(k); }); }
    else { var ref = selectedRef(w, id), un = [].concat(it.alts.unavail || []).map(memberRef), H = handoffOf(w, id);
      kids.push(X.text('cat', 'Category ' + it.name + ' · in use: ' + (selLabel(w, id) || '—'), 'body'));
      catMembers(it).forEach(function (m) { var mid = bare(m), a = w.items[mid]; if (!a) return; var cur = m === ref, pref = it.alts.pref != null && memberRef(it.alts.pref) === m, off = un.indexOf(m) >= 0, open = !!(st.open && st.open[mid]), n = reqsOf(w, mid).length;
        kids.push(X.row('m:' + mid, [X.text('n', (cur ? '● ' : '○ ') + a.name, 'body', { bold: cur }), X.text('s', schedLabel(a.values) + (cur ? ' · in use' : '') + (off ? ' · unavailable' : ''), 'small'),
          X.btn('pref', pref ? '✓ Preferred' : 'Prefer', 'alt2:pref:' + id + '/' + mid, { on: pref, disabled: off }), X.btn('un', off ? 'Mark available' : 'Mark unavailable', 'alt2:unavail:' + id + '/' + mid, { on: off }),
          X.btn('rq', (open ? 'Hide' : 'Show') + ' requirements (' + n + ')', 'alt2:reqs:' + mid, { on: open }), !cur && !off && X.btn('pp', 'Propose switching to this', 'prop:new:' + id + '/' + mid)].filter(Boolean)));
        var p = propFor(w, id, m); if (p && !cur && (p.proposed || unresolved(w, p).length)) kids.push(X.row('p:' + mid, [X.text('t', (p.proposed ? 'Proposal: ' : 'Not proposed yet: ') + propLine(w, p), 'small', { color: '#2f5f8a' }), X.btn('open', 'Review', 'prop:open:' + p.id)], { indent: 18 }));
        if (open) reqBlock(V, w, mid).forEach(function (k) { kids.push(k); }); }); }
    if (!(F && F.kind === 'alt2' && F.item === id)) kids.push(X.row('add', [X.btn('add', '+ Add an alternative', 'alt2:addalt:' + id)]));
    if (F && F.kind === 'alt2' && (F.item === id)) kids.push(alt2FormVM(V, w, F));
    return X.col('alt2:' + id, kids, { role: 'section', slab: 'inner', gap: 6 }); }

  /* ---- the Plan: unfinished proposals, and the one being reviewed ---- */
  function monthName(m) { var N = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']; return N[+m.slice(5, 7) - 1] + ' ' + m.slice(0, 4); }
  function planTopVM(V, w) { var X = VM(), out = [], L = props(w).filter(function (p) { return p.proposed; }); if (!L.length && !OPEN_PROP) return out;
    var open = OPEN_PROP && props(w).filter(function (p) { return p.id === OPEN_PROP; })[0];
    if (L.length && !open) { out.push(X.text('ph', L.length === 1 ? 'Unfinished proposal' : 'Unfinished proposals', 'body', { bold: true }));
      L.forEach(function (p) { out.push(X.row('pl:' + p.id, [X.text('t', w.items[p.cat].name + ': ' + propLine(w, p), 'body'), X.btn('open', 'Review', 'prop:open:' + p.id), X.btn('x', 'Discard', 'prop:discard:' + p.id)])); });
      out.push(X.text('pn', 'The plan below is the current plan. A proposal changes nothing until you accept it.', 'muted')); }
    if (open) out.push(reviewVM(V, w, open)); return out; }
  function reviewVM(V, w, p) { var X = VM(), kids = [], C = w.items[p.cat], T = w.items[bare(p.to)], P = w.items[bare(p.from)] || {}, F = V.form, un = unresolved(w, p), R = seedReqs(w, bare(p.from)).filter(function (r) { return w.items[r] && (!(w.items[r].values && w.items[r].values.forAlt) || reqActivity(w, w.items[r]).active); }), start = (T.values || {}).date || budgetTodayKey();
    kids.push(X.row('head', [X.text('t', 'Proposal: ' + C.name + ' switches from ' + (P.name || '—') + ' to ' + T.name + ' from ' + start, 'h'), X.btn('close', 'Close and keep for later', 'prop:close')]));
    kids.push(X.text('state', un.length ? 'Provisional: ' + un.length + ' requirement' + (un.length === 1 ? '' : 's') + ' of ' + (P.name || 'the current choice') + ' still to resolve. The current plan is unchanged.' : 'Every affected requirement is resolved. The current plan is unchanged until you accept.', un.length ? 'flag' : 'body'));
    if (R.length) { kids.push(X.text('rh', 'Requirements of ' + P.name + ': what does ' + T.name + ' need instead?', 'body', { bold: true }));
      R.forEach(function (r) { var Ri = w.items[r], rv = (p.reviews || {})[r] || {}, ref = rv.ref && w.items[bare(rv.ref)], status = !rv.d ? 'not decided' : rv.d === 'none' ? 'not needed with ' + T.name : rv.d === 'reuse' ? (ref ? 'reused as a separate copy: ' + ref.name + ' · ' + schedLabel(ref.values) : 'copy missing') : (ref ? 'replaced by ' + ref.name + ' · ' + schedLabel(ref.values) : 'needs its own: not scheduled yet');
        kids.push(X.row('r:' + r, [X.text('n', Ri.name, 'body', { bold: true }), X.text('s', schedLabel(Ri.values), 'small'), X.btn('own', 'Needs its own', 'prop:rv:' + p.id + '/' + r + '/own', { on: rv.d === 'own' }), X.btn('reuse', 'Reuse a copy', 'prop:rv:' + p.id + '/' + r + '/reuse', { on: rv.d === 'reuse' }), X.btn('none', 'Not needed', 'prop:rv:' + p.id + '/' + r + '/none', { on: rv.d === 'none' })]));
        kids.push(X.row('rs:' + r, [X.text('st', status, 'small', { color: un.indexOf(r) >= 0 ? '#a40000' : '#2f5f8a' }), rv.d === 'own' && !ref && X.btn('sch', 'Schedule it', 'prop:sched:' + p.id + '/' + r)].filter(Boolean), { indent: 18 })); }); }
    var extra = reqsOf(w, bare(p.to)).filter(function (r) { return !Object.keys(p.reviews || {}).some(function (k) { return p.reviews[k].ref === 'item:' + r; }); });
    kids.push(X.text('xh', 'Other requirements of ' + T.name + (extra.length ? '' : ': none'), 'body', { bold: true }));
    extra.forEach(function (r) { var Rx = w.items[r]; kids.push(X.row('x:' + r, [X.text('n', Rx.name, 'body'), X.text('s', schedLabel(Rx.values), 'small'), X.btn('rm', 'Remove', 'alt2:rmreq:' + r)], { indent: 18 })); });
    kids.push(X.row('xa', [X.btn('add', '+ Add requirement of ' + T.name, 'alt2:addreq:' + bare(p.to))]));
    if (F && F.kind === 'alt2' && F.step === 'req') kids.push(alt2FormVM(V, w, F));
    var month = String(start).slice(0, 7); if (month < budgetMonthKey()) month = budgetMonthKey();
    kids.push(compareVM(V, w, afterAtlas(w, p), { title: 'Dependencies and sequence, before and after', month: month, moLabel: monthName(month), note: 'Money columns are for ' + monthName(month) + ', the month ' + T.name + ' starts.' }));
    kids.push(X.row('acts', [X.btn('accept', 'Accept proposal', 'prop:accept:' + p.id, { kind: 'primary', disabled: !!un.length }), X.btn('discard', 'Discard proposal', 'prop:discard:' + p.id), X.btn('close2', 'Close and keep for later', 'prop:close')]));
    return X.col('review', kids, { role: 'detail', slab: 'inner', gap: 6 }); }

  /* the Plan's own list of a step's choices: choosing one starts a proposal */
  function planAltsVM(V, w, rid) { var X = VM(), it = w.items[rid]; if (!it || !it.alts) return null; var ref = selectedRef(w, rid), un = [].concat(it.alts.unavail || []).map(memberRef), mem = catMembers(it).filter(function (m) { return w.items[bare(m)] && un.indexOf(m) < 0; }), open = !!(V.open && V.open[rid]);
    var ks = [X.btn('tog', (open ? 'Hide' : 'Show') + ' alternatives for ' + it.name + ' (' + mem.length + ')', 'tog:' + rid, { kind: 'ghost', on: open })];
    if (open) mem.forEach(function (m) { var a = w.items[bare(m)], cur = m === ref; ks.push(X.btn('pp:' + m, (cur ? '● ' : '') + a.name + ' · ' + schedLabel(a.values) + (cur ? ' · in use' : ' · propose'), 'prop:new:' + rid + '/' + bare(m), { on: cur, disabled: cur })); });
    return X.row('alts', ks); }
  function alt2Act(V, a) { var w = AW(V), F = V.form, m;
    if (a === 'alt2:star' && F && F.kind === 'alt2') { F.preferred = !F.preferred; return redraw(V); }
    if ((m = /^alt2:open:(.+)$/.exec(a))) { V.alt2 = (V.alt2 && V.alt2.item === m[1]) ? null : { item: m[1], open: {} }; if (V.form && V.form.kind === 'alt2') { clearFormFields(V); V.form = null; } return redraw(V); }
    if (a === 'alt2:close') { V.alt2 = null; if (V.form && V.form.kind === 'alt2') { clearFormFields(V); V.form = null; } return redraw(V); }
    if ((m = /^alt2:addalt:(.+)$/.exec(a))) { var it = w.items[m[1]]; if (!it) return; if (!V.alt2 || V.alt2.item !== m[1]) V.alt2 = { item: m[1], open: {} };
      var curRef = it.alts ? selectedRef(w, m[1]) : 'item:' + m[1], cur = (curRef && w.items[bare(curRef)]) || it, cv = cur.values || {};
      V.form = { kind: 'alt2', item: m[1], step: it.alts ? 'alt' : 'cat', cname: it.alts ? it.name : '', curName: cur.name, income: cv.flow === 'in' || cv.type === 'income', aname: '', aamount: '', adate: budgetTodayKey() > String(cv.date || '') ? budgetTodayKey() : cv.date, rep: 'same', error: '' };
      V.formFocus = it.alts ? 'aname' : 'cname'; return redraw(V); }
    if ((m = /^alt2:addreq:(.+)$/.exec(a))) { var x = w.items[m[1]]; if (!x) return; V.form = { kind: 'alt2', item: (V.alt2 && V.alt2.item) || m[1], step: 'req', forItem: m[1], rname: '', ramount: '', rdate: (x.values || {}).date || budgetTodayKey(), rep: 'once', error: '' }; V.formFocus = 'rname'; return redraw(V); }
    if ((m = /^alt2:rep:(same|once|monthdays|every)$/.exec(a))) { if (!F) return; F.rep = m[1]; if (m[1] === 'monthdays' && !String(F.rdays || '').trim()) { var d0 = BR.pdate(F.adate || F.rdate); if (d0) F.rdays = String(d0.getDate()); } V.formFocus = m[1] === 'monthdays' ? 'rdays' : m[1] === 'every' ? 'revery' : V.formFocus; return redraw(V); }
    if (a === 'alt2:ok') return alt2Save(V);
    if ((m = /^alt2:reqs:(.+)$/.exec(a))) { if (!V.alt2) return; V.alt2.open = V.alt2.open || {}; V.alt2.open[m[1]] = !V.alt2.open[m[1]]; return redraw(V); }
    if ((m = /^alt2:rmreq:(.+)$/.exec(a))) { if (!w.items[m[1]]) return; V.note = 'removed requirement'; return submitViews(reqDropOps(w, m[1]), 'alt2:rmreq', V); }
    if ((m = /^alt2:pref:([^/]+)\/(.+)$/.exec(a))) { var c = w.items[m[1]], ref = 'item:' + m[2]; if (!c || !c.alts) return; var on = c.alts.pref != null && memberRef(c.alts.pref) === ref;
      /* a mark only: it never changes what is in use. A preferred choice that is not in use becomes a proposal. */
      var out = submitViews([{ path: 'items/' + m[1] + '/alts/pref', op: 'ref', value: on ? null : ref }], 'alt2:pref', V), w2 = AW(V);
      if (!on) { var p = ensureProp(w2, m[1], ref, 'preferred', true); V.note = 'preferred ' + m[2] + (p ? ' · proposal started' : ''); }
      else { var q = propFor(w2, m[1], ref); if (q && q.source === 'preferred') { q.proposed = false; putProp(q); } V.note = 'preference cleared'; }
      refreshAll(); return out; }
    if ((m = /^alt2:unavail:([^/]+)\/(.+)$/.exec(a))) { var c2 = w.items[m[1]]; if (!c2 || !c2.alts) return; var r = restrictOps(m[1], c2, m[2]); if (!r) return; V.note = r.unavailable ? 'marked unavailable' : 'marked available';
      var o2 = submitViews(r.ops, 'alt2:unavail', V); if (r.unavailable) { var q2 = propFor(AW(V), m[1], 'item:' + m[2]); if (q2) dropProp(q2.id); if (OPEN_PROP && q2 && q2.id === OPEN_PROP) OPEN_PROP = null; } refreshAll(); return o2; } }

  function propAct(V, a) { var w = AW(V), m;
    if ((m = /^prop:new:([^/]+)\/(.+)$/.exec(a))) { var p = ensureProp(w, m[1], 'item:' + m[2], 'chosen', true); if (!p) { V.note = 'already in use'; return redraw(V); } return openProp(p.id); }
    if ((m = /^prop:open:(.+)$/.exec(a))) return openProp(m[1]);
    if (a === 'prop:close') { OPEN_PROP = null; if (V.form && V.form.kind === 'alt2') { clearFormFields(V); V.form = null; } V.note = 'proposal kept for later'; return refreshAll(); }
    if ((m = /^prop:discard:(.+)$/.exec(a))) { dropProp(m[1]); if (OPEN_PROP === m[1]) OPEN_PROP = null; V.note = 'proposal discarded'; return refreshAll(); }
    var L = allProps();
    if ((m = /^prop:rv:([^/]+)\/([^/]+)\/(own|reuse|none)$/.exec(a))) { var p1 = L.filter(function (q) { return q.id === m[1]; })[0]; if (!p1 || !w.items[m[2]]) return; p1.reviews = p1.reviews || {}; var old = p1.reviews[m[2]] || {}, ops = [];
      if (old.d === m[3]) return; if (old.d === 'reuse' && old.ref && w.items[bare(old.ref)]) ops = ops.concat(reqDropOps(w, bare(old.ref)));
      var nv = { d: m[3] }; if (m[3] === 'reuse') { var c = copyReq(w, V, m[2], bare(p1.to)); if (c) { ops = ops.concat(c.ops); nv.ref = 'item:' + c.id; } }
      p1.reviews[m[2]] = nv; putProp(p1); V.note = 'requirement review saved'; if (ops.length) { var o = submitViews(ops, 'prop:review', V); refreshAll(); return o; } return refreshAll(); }
    if ((m = /^prop:sched:([^/]+)\/(.+)$/.exec(a))) { var p2 = L.filter(function (q) { return q.id === m[1]; })[0], R = w.items[m[2]]; if (!p2 || !R) return; var T = w.items[bare(p2.to)];
      V.form = { kind: 'alt2', item: p2.cat, step: 'req', forItem: bare(p2.to), replaces: m[2], pid: p2.id, rname: '', ramount: '', rdate: (T.values || {}).date || budgetTodayKey(), rep: 'once', error: '' }; V.formFocus = 'rname'; return redraw(V); }
    if ((m = /^prop:accept:(.+)$/.exec(a))) { var p3 = props(w).filter(function (q) { return q.id === m[1]; })[0]; if (!p3) return; if (unresolved(w, p3).length) { V.note = 'resolve every requirement first'; return redraw(V); }
      var ops3 = acceptOps(w, p3); dropProp(p3.id); allProps().forEach(function (q) { if (q.cat === p3.cat) dropProp(q.id); }); OPEN_PROP = null; V.note = 'proposal accepted: ' + w.items[p3.cat].name + ' now uses ' + w.items[bare(p3.to)].name;
      var o3 = submitViews(ops3, 'prop:accept', V); refreshAll(); return o3; } }
  /* Home's inline choice of an alternative starts a proposal; it does not change the plan */
  function chooseFromHome(w, cat, ref) { var p = ensureProp(w, cat, ref, 'chosen', true); if (p) OPEN_PROP = p.id; return !!p; }

/* ---- D. Day resilience: colours worked out from the plan, with the reason ----
   Three set disruptions are tried on every day, automatically (there is nothing to configure or run):
     1. an unexpected cost on that day (meta.riskHT.hc, default $500; a larger one, hm, default $1,500, tells green from yellow);
     2. the next pay arriving late (meta.riskHT.delay days, default 3);
     3. an item in use that day being unavailable, when something depends on it (another step requires it, or it is a requirement of the choice in use).
   Room to recover is only what the plan already holds: cash before the next pay, and alternatives that are viable that day
   (available, not blocked, already started, and affordable from that cash). An alternative that fails any of these is not counted.
   Green: every disruption is absorbed. Yellow: one bites, and there is room to recover. Red: one bites and there is not.
   This is a test of three stated disruptions against the entered plan. It is not a forecast and not a guarantee. */
  var RES_LETTER = { C: 'R', M: 'Y', L: 'G' }, RES_LABEL = { C: 'Red: little or no flexibility', M: 'Yellow: room to recover', L: 'Green: holds up' };
  function resLetter(c) { return RES_LETTER[c] || c; }
  function resLabel(c) { return RES_LABEL[c] || c; }
  var RES_NOTE = 'Each day is tested against an unexpected cost, late pay and an unavailable item. This is not a guarantee.';
  function inUseOn(w, cid, day) { var H = handoffOf(w, cid); if (H) return String(day) < String(H.date) ? H.prev : H.sel; var r = selectedRef(w, cid); return r ? bare(r) : null; }
  function occAmt(it) { var a = +((it && it.values) || {}).amount; return isFinite(a) ? Math.abs(a) : 0; }
  /* other choices of a category that could really be used on this day */
  function viableOn(w, cid, day, room) { var c = w.items[cid]; if (!c || !c.alts) return []; var un = [].concat(c.alts.unavail || []).map(memberRef), use = inUseOn(w, cid, day), base = occAmt(w.items[use]), out = [];
    catMembers(c).forEach(function (m) { var id = bare(m), a = w.items[id]; if (!a || id === use || un.indexOf(m) >= 0) return; var v = a.values || {}; if (v.planBlocked) return; if (v.date && String(v.date) > String(day)) return;
      var extra = occAmt(a) - base; if (extra > Math.max(0, room)) return; out.push({ id: id, name: a.name, extra: extra }); });
    return out.sort(function (x, y) { return x.extra - y.extra; }); }
  function resilience(w, HT, flat) { var E = EVL(), out = {}, cost = +HT.hc > 0 ? +HT.hc : 500, large = Math.max(cost, +HT.hm > 0 ? +HT.hm : 1500), delay = Math.max(1, Math.floor(+HT.delay || 3));
    var cal = ((w.components[(w.meta && w.meta.calId) || 'budget'] || {}).items) || [], by = {}, months = {}; flat.forEach(function (D) { months[D.k.slice(0, 7)] = 1; });
    cal.forEach(function (r) { var id = bare(r), raw = w.items[id], it = effItem(w, id); if (!raw || !it || !(it.values || {}).date || (raw.values || {}).planBlocked) return;
      Object.keys(months).forEach(function (m) { var ch = E.charges(it, m); E.occurrences(it, m).forEach(function (d) { (by[d] = by[d] || []).push({ id: id, amt: ch[d] == null ? 0 : Math.abs(+ch[d]) }); }); }); });
    var need = {}; Object.keys(w.items).forEach(function (id) { var it = w.items[id]; if (!it || !it.jreq || (it.values || {}).planBlocked) return; var j = bare(it.jreq); if (w.items[j]) (need[j] = need[j] || []).push(it.name); });
    /* money that alternatives already in the plan would free between two days */
    function savings(i, j) { var s = 0; for (var t = i; t < j && t < flat.length; t++) (by[flat[t].k] || []).forEach(function (e) { if (!(w.items[e.id] || {}).alts) return; var V = viableOn(w, e.id, flat[t].k, Infinity); if (V.length && V[0].extra < 0) s += -V[0].extra; }); return s; }
    flat.forEach(function (D, i) { var lvl = 0, R = [], j = i; while (j < flat.length && !(flat[j].pay && j > i)) j++; var nextPay = j < flat.length ? flat[j].k : null, hr = D.hr, room = savings(i, j), M = BR.money;
      var until = nextPay ? 'before the next pay (' + nextPay + ')' : 'in the months checked';
      if (hr >= large) R.push('An unexpected cost of ' + M(large) + ' fits: the lowest balance ' + until + ' is ' + M(hr) + '.');
      else if (hr >= cost) { lvl = Math.max(lvl, 1); R.push('An unexpected cost of ' + M(cost) + ' fits, one of ' + M(large) + ' would not: the lowest balance ' + until + ' is ' + M(hr) + '.'); }
      else if (hr + room >= cost) { lvl = Math.max(lvl, 1); R.push('An unexpected cost of ' + M(cost) + ' would leave cash ' + M(cost - hr) + ' short ' + until + '. Cheaper alternatives already in the plan free ' + M(room) + '.'); }
      else { lvl = 2; R.push('An unexpected cost of ' + M(cost) + ' would leave cash ' + M(cost - hr) + ' short ' + until + (room > 0 ? '. Cheaper alternatives free only ' + M(room) + '.' : ', and no alternative frees money before then.')); }
      /* the pay due on or after this day arrives late */
      var p = i; while (p < flat.length && !flat[p].pay) p++;
      if (p < flat.length) { var low = Infinity; for (var t = p; t < Math.min(flat.length, p + delay); t++) low = Math.min(low, flat[t].b - flat[p].inc); var room2 = savings(i, Math.min(flat.length, p + delay));
        if (low < 0 && low + room2 >= 0) { lvl = Math.max(lvl, 1); R.push('If the pay due ' + flat[p].k + ' came ' + delay + ' days late, cash would be ' + M(-low) + ' short. Cheaper alternatives already in the plan free ' + M(room2) + '.'); }
        else if (low < 0) { lvl = 2; R.push('If the pay due ' + flat[p].k + ' came ' + delay + ' days late, cash would be ' + M(-low) + ' short' + (room2 > 0 ? '. Cheaper alternatives free only ' + M(room2) + '.' : ', and no alternative frees money.')); }
        else R.push('The pay due ' + flat[p].k + ' can come ' + delay + ' days late: cash stays at ' + M(low) + ' or more.'); }
      else R.push('No pay is scheduled from this day on in the months checked.');
      /* an item in use today that something depends on */
      (by[D.k] || []).forEach(function (e) { var raw = w.items[e.id], v = raw.values || {}, deps = need[e.id] || [], isReq = v.forAlt && reqActivity(w, raw).active, pos = Math.max(0, hr);
        if (raw.alts) { var use = w.items[inUseOn(w, e.id, D.k)] || {}, rq = reqsOf(w, use.id || '').length; if (!deps.length && !rq) return; var V = viableOn(w, e.id, D.k, pos);
          if (V.length) { lvl = Math.max(lvl, 1); R.push('If ' + use.name + ' were unavailable, ' + raw.name + ' can use ' + V[0].name + (V[0].extra > 0 ? ' for ' + M(V[0].extra) + ' more' : '') + '.'); }
          else if (deps.length) { lvl = 2; R.push(raw.name + ' is needed by ' + deps.join(', ') + ' and has no alternative that can be used this day.'); }
          return; }
        if (isReq) { var x = w.items[bare(v.forAlt)] || {}, cid = ownerOf(w, bare(v.forAlt)), V2 = cid ? viableOn(w, cid, D.k, pos) : [];
          if (V2.length) { lvl = Math.max(lvl, 1); R.push('If ' + raw.name + ' were unavailable, ' + x.name + ' could not be used; ' + w.items[cid].name + ' can use ' + V2[0].name + (V2[0].extra > 0 ? ' for ' + M(V2[0].extra) + ' more' : '') + '.'); }
          else { lvl = 2; R.push(raw.name + ' is required by ' + x.name + ', which has no alternative that can be used this day.'); }
          return; }
        if (deps.length) { lvl = 2; R.push(raw.name + ' is needed by ' + deps.join(', ') + ' and has no alternative.'); } });
      var c = ['L', 'M', 'C'][lvl]; out[D.k] = { c: c, hr: hr, b: D.b, reasons: R, why: R.join(' ') }; });
    return out; }
  /* the day view says why the day has its colour */
  function resilienceVM(V, w, day) { var X = VM(), rk = (riskOf(w).days || {})[day]; if (!rk || !rk.reasons) return [];
    var out = [X.text('res:h', resLabel(rk.c), 'body', { bold: true, color: (root.RISK_TEXT || {})[rk.c] })]; rk.reasons.forEach(function (t, i) { out.push(X.text('res:' + i, t, 'small')); }); out.push(X.text('res:n', RES_NOTE, 'muted')); return out; }


  /** Requirements to review when proposing an alternative: forAlt items of the
   * current choice, plus items reached by its Exp7 JReq chain (and items that
   * jreq it). The user is not asked to re-enter those as forAlt values first. */
  function seedReqs(w, fromId) {
    var out = [], seen = {};
    function add(id) { id = bare(id); if (!id || !w.items[id] || seen[id] || id === bare(fromId)) return; seen[id] = 1; out.push(id); }
    reqsOf(w, fromId).forEach(add);
    var x = (w.items[bare(fromId)] || {}).jreq, guard = 0;
    while (x && guard++ < 32) { var id = bare(x); if (!id || !w.items[id] || seen[id]) break; add(id); x = w.items[id].jreq; }
    Object.keys(w.items || {}).forEach(function (id) {
      var it = w.items[id]; if (!it || !it.jreq) return;
      var j = bare(it.jreq); if (j === bare(fromId) || seen[j]) add(id);
    });
    return out;
  }

  function dayLabel(d) { try { return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }); } catch (e) { return d; } }

  function actionsVM(V, w, F) {
    var X = VM(), e = entryOn(w, F.item, F.day) || { id: F.item, name: (w.items[F.item] || {}).name || F.item, values: {}, ex: {} }, o = e.ex || {};
    var kids = [
      X.row('back', [X.btn('b', '< ' + dayLabel(F.day), 'occ:actions:close')]),
      X.text('title', e.label || e.name || F.item, 'h'),
      X.btn('chg', 'Change', 'occ:edit:' + F.item),
      X.btn('alts', 'Alternatives and requirements', 'alt2:open:' + F.item),
      X.btn('pref', 'Mark preferred', 'occ:pref:' + F.item),
      X.btn('unav', 'Mark unavailable', 'occ:unavail:' + F.item),
      X.btn('rec', o.actual ? 'Change what happened' : 'Record what happened', 'occ:actual:' + F.item)
    ];
    return kids;
  }

  function addChooserVM(V, w, F) {
    var X = VM(), day = F.day || budgetDateKey();
    return [
      X.row('back', [X.btn('b', '< ' + dayLabel(day), 'form:cancel')]),
      X.text('title', 'Add to ' + dayLabel(day), 'h'),
      X.btn('act', 'Activity or cost', 'add:kind:activity'),
      X.btn('pay', 'Pay', 'add:kind:pay'),
      X.btn('debt', 'Debt', 'add:kind:debt'),
      X.btn('cash', 'Cash or owned item', 'add:kind:cash')
    ];
  }

  function activityFormVM(V, w, F) {
    var X = VM(), lab = function (t) { return X.text('l', t, 'body', { bold: true }); };
    var kids = [
      X.row('back', [X.btn('b', '< ' + dayLabel(F.date), 'add:open')]),
      X.text('title', 'Activity or cost', 'h'),
      X.text('g-item', 'Item', 'body', { bold: true }),
      X.row('f:name', [lab('Name:'), X.field('f', 'name', 'Name', { w: 260, v: F.name || '' })]),
      X.text('g-timing', 'Timing', 'body', { bold: true }),
      X.row('f:date', [lab('Date:'), X.text('dv', F.date, 'body')]),
      X.row('f:time', [lab('Time:'), X.field('f', 'time', 'optional', { w: 140, v: F.time || '' })]),
      X.text('g-repeat', 'Repeat', 'body', { bold: true })
    ];
    [['once', 'Does not repeat'], ['monthdays', 'Specific dates each month'], ['every', 'Every X days']].forEach(function (p) {
      kids.push(X.btn('rp:' + p[0], p[1], 'add:rep:' + p[0], { on: (F.rep || 'once') === p[0] }));
    });
    if (F.rep === 'monthdays') kids.push(X.row('f:on', [lab('Dates of the month:'), X.field('f', 'on', '1, 15', { w: 140, v: F.on || '' })]));
    if (F.rep === 'every') kids.push(X.row('f:every', [lab('Every how many days:'), X.field('f', 'every', '14', { w: 80, v: F.every || '14' })]));
    kids.push(X.text('g-amt', 'Amount', 'body', { bold: true }));
    kids.push(X.row('f:amount', [lab('Amount (USD):'), X.field('f', 'amount', '0.00', { w: 140, v: F.amount || '' })]));
    if (F.error) kids.push(X.text('err', F.error, 'flag'));
    kids.push(X.row('acts', [X.btn('ok', 'Save', 'add:save', { kind: 'primary' }), X.btn('cancel', 'Cancel', 'form:cancel')]));
    return X.col('activity', kids, { role: 'detail', slab: 'inner', enter: true });
  }

  function undatedItems(w) {
    var out = [];
    Object.keys(w.items || {}).forEach(function (id) {
      var it = w.items[id], v = (it && it.values) || {};
      if (!it || v.assetKind || v.type === 'asset') return;
      if (v.date || v.asOf) return;
      if (v.amount == null && v.gross == null && !v.repeat) return;
      out.push({ id: id, name: it.name, values: v });
    });
    return out;
  }

  function addAct(V, a) {
    var w = AW(V), F = V.form, m, day = (V.addDay || (calNavOf(V) && calNavOf(V).day) || budgetDateKey());
    if (a === 'add:open') { V.form = { kind: 'add', day: day }; V.addDay = day; return redraw(V); }
    if ((m = /^add:kind:(activity|pay|debt|cash)$/.exec(a))) {
      V.addDay = day;
      if (m[1] === 'activity') { V.form = { kind: 'activity', date: day, name: '', time: '', rep: 'once', amount: '', on: '', every: '14' }; V.formFocus = 'name'; return redraw(V); }
      if (m[1] === 'pay') return finOpen(V, 'income', null, day);
      if (m[1] === 'debt') return finOpen(V, 'debt', null, day);
      return finOpen(V, 'asset', null, day);
    }
    if ((m = /^add:rep:(once|monthdays|every)$/.exec(a))) { if (F && F.kind === 'activity') { F.rep = m[1]; return redraw(V); } return; }
    if (a === 'add:save') {
      if (!F || F.kind !== 'activity') return;
      var name = String(F.name || '').trim(); if (!name) { F.error = 'Name the activity or cost.'; return redraw(V); }
      var amt = BR.num(F.amount), date = F.date || day; if (!BR.pdate(date)) { F.error = 'This item needs a date.'; return redraw(V); }
      var values = { type: 'expense', flow: 'out', date: date, allDay: !F.time, charge: 'per', amount: isFinite(amt) && amt ? -Math.abs(BR.r2(amt)) : 0 };
      if (F.time) values.time = F.time;
      if (F.rep === 'monthdays') { var L = BR.monthDayList(F.on); if (!L.length) { F.error = 'Enter the days of the month, for example 1, 15.'; return redraw(V); } values.repeat = 'monthdays'; values.on = L; }
      else if (F.rep === 'every') { var n = Math.floor(BR.num(F.every)); if (!(n >= 1)) { F.error = 'Enter the number of days between repeats.'; return redraw(V); } values.repeat = 'every'; values.every = n; }
      else values.repeat = 'once';
      var id = uniqItemId(name, V), calId = (w.meta && w.meta.calId) || 'budget', ops = [
        { path: 'items/' + id, op: 'add', value: mkItemRecord(id, name, { values: values }) },
        { path: 'components/' + calId + '/items', op: 'add', value: 'item:' + id }
      ];
      var ids = (w.meta && w.meta.boardIds) || {}; if (ids.expense) ops.push({ path: 'components/' + ids.expense + '/items', op: 'add', value: 'item:' + id });
      V.form = null; V.note = 'Added ' + name + ' on ' + date; return submitViews(ops, 'add:activity', V);
    }
  }

  function formAct(V, a) {
    if (a === 'form:cancel') { V.form = null; V.alt2 = null; return redraw(V); }
  }

  var ROUTES = [];
  function route(prefix, fn) { ROUTES.push([prefix, fn]); }
  if (typeof finAct === 'function') route('fin:', finAct);
  if (typeof occAct === 'function') route('occ:', occAct);
  if (typeof alt2Act === 'function') { route('alt2:', alt2Act); route('prop:', propAct); }
  if (typeof addAct === 'function') route('add:', addAct);
  if (typeof formAct === 'function') route('form:', formAct);
  function handles(a) { a = String(a || ''); return ROUTES.some(function (r) { return a.indexOf(r[0]) === 0; }); }
  function act(V, a) { a = String(a || ''); if (!isBudget(AW(V))) return; for (var i = 0; i < ROUTES.length; i++) if (a.indexOf(ROUTES[i][0]) === 0) return ROUTES[i][1](V, a); }
  /* Enter in a form field submits that form */
  function submitForm(V) { var F = V && V.form; if (!F) return false; if (F.kind === 'fin') { finAct(V, 'fin:ok'); return true; } if (F.kind === 'occ') { occAct(V, 'occ:ok:once'); return true; } if (F.kind === 'alt2') { alt2Act(V, 'alt2:ok'); return true; } return false; }
  var api = { handles: handles, act: act, submitForm: submitForm, finFormVM: finFormVM, rowExtras: rowExtras, isCashAsset: isCashAsset, calRepeatVM: calRepeatVM, calRepeatPick: calRepeatPick, repeatValues: repeatValues, firstMonthday: firstMonthday, startLinks: startLinks, dayVM: dayVM, compareVM: compareVM, actionsVM: actionsVM, addChooserVM: addChooserVM, seedReqs: seedReqs, undatedItems: undatedItems, entryOn: entryOn, occOps: occOps, applyOpsTo: applyOpsTo,
    eff: typeof eff === 'function' ? eff : null, effHas: typeof effHas === 'function' ? effHas : null, planList: typeof planList === 'function' ? planList : null, planInfo: typeof planInfo === 'function' ? planInfo : null, selLabel: typeof selLabel === 'function' ? selLabel : null,
    altPanelVM: typeof altPanelVM === 'function' ? altPanelVM : null, planAltsVM: typeof planAltsVM === 'function' ? planAltsVM : null, planTopVM: typeof planTopVM === 'function' ? planTopVM : null, chooseFromHome: typeof chooseFromHome === 'function' ? chooseFromHome : null,
    proposals: typeof props === 'function' ? props : null, unresolved: typeof unresolved === 'function' ? unresolved : null, reqsOf: typeof reqsOf === 'function' ? reqsOf : null, afterAtlas: typeof afterAtlas === 'function' ? afterAtlas : null, handoffOf: typeof handoffOf === 'function' ? handoffOf : null,
    resilience: typeof resilience === 'function' ? resilience : null, resLabel: typeof resLabel === 'function' ? resLabel : null, resLetter: typeof resLetter === 'function' ? resLetter : null, RES_NOTE: typeof RES_NOTE === 'string' ? RES_NOTE : '' };
  root.BudgetFlows = api;
})(typeof window !== 'undefined' ? window : globalThis);

