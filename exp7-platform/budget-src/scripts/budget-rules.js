/* Budget rules (1.8.55). Pure functions over plain data: no DOM, no atlas writes. window.BudgetRules / module.exports.
 * The same source runs in node (unit tests) and in the platform.
 *
 * DEBT PAYMENTS. This is one stated rule, not a claim about any creditor's terms:
 *   - Simple interest on the balance for the days in a period, actual/365: periodic rate r = APR/100 * days / 365.
 *     (The atlas 'walk' node already accrues debts as rate/365 x balance x days; this is the same accrual.)
 *   - Level payment over n periods: P = B*r / (1 - (1+r)^-n), or B/n when APR is 0. P is rounded to the cent, half up.
 *   - Each period: interest = round(balance * r), principal = P - interest. The last payment is the remaining balance
 *     plus that period's interest, so it differs from P by the rounding carried through the schedule.
 *   - The first payment falls one interval after the as-of date; later payments follow the same interval.
 *   - No fees, no compounding inside a period, no payment holidays, no rate changes.
 *
 * INCOME. Take-home = gross - sum(fixed deductions) - sum(round(gross * percent/100)). Each percent deduction is rounded
 * to the cent on its own, half up. Percentages are always of gross pay, never of the amount left after other deductions. */
(function (root) {
  'use strict';
  function r2(n) { n = +n || 0; return (n < 0 ? -1 : 1) * Math.round(Math.abs(n) * 100 + 1e-7) / 100; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function pdate(s) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || '')); if (!m) return null; var d = new Date(+m[1], +m[2] - 1, +m[3]); return d.getMonth() === +m[2] - 1 && d.getDate() === +m[3] ? d : null; }
  function addDays(s, n) { var d = pdate(s); if (!d) return null; return ymd(new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)); }
  function dayDiff(a, b) { var x = pdate(a), y = pdate(b); if (!x || !y) return NaN; return Math.round((Date.UTC(y.getFullYear(), y.getMonth(), y.getDate()) - Date.UTC(x.getFullYear(), x.getMonth(), x.getDate())) / 86400000); }
  function num(x) { var s = String(x == null ? '' : x).replace(/[$,\s]/g, ''); if (s === '') return NaN; var n = Number(s); return isFinite(n) ? n : NaN; }

  var DEBT_RULE = 'Level payments. Interest is simple on the balance for the days in each period (APR x days / 365). ' +
    'Amounts are rounded to the cent; the last payment takes the remainder. No fees or rate changes are modelled, so a creditor\'s own schedule can differ.';
  /** d: {balance, asOf, apr, terms, every}. Returns {ok, errors[], payment, last, rate, rows[], first, lastDate, interest, total, rule}. */
  function debtSchedule(d) {
    var B = num(d && d.balance), apr = num(d && d.apr), n = Math.floor(num(d && d.terms)), ev = Math.floor(num(d && d.every)), asOf = d && d.asOf, E = [];
    if (!(B > 0)) E.push('Balance owed must be more than 0.');
    if (!pdate(asOf)) E.push('As-of date must be a real date, YYYY-MM-DD.');
    if (!(apr >= 0) || apr > 1000) E.push('APR must be 0 or more.');
    if (!(n >= 1) || n > 2400) E.push('Payments remaining must be a whole number, 1 or more.');
    if (!(ev >= 1) || ev > 3660) E.push('Days between payments must be a whole number, 1 or more.');
    if (E.length) return { ok: false, errors: E, rule: DEBT_RULE };
    var r = apr / 100 * ev / 365, P = r2(r > 0 ? B * r / (1 - Math.pow(1 + r, -n)) : B / n), bal = r2(B), rows = [], interest = 0, total = 0;
    for (var k = 1; k <= n; k++) {
      var it = r2(bal * r), pay = k === n ? r2(bal + it) : P, pr = r2(pay - it);
      /* a payment that would not cover its interest cannot retire the debt; report it instead of producing a nonsense schedule */
      if (k < n && pr <= 0) return { ok: false, errors: ['The payment does not cover the interest for these terms.'], rule: DEBT_RULE };
      bal = r2(bal - pr); interest = r2(interest + it); total = r2(total + pay);
      rows.push({ n: k, date: addDays(asOf, ev * k), payment: pay, interest: it, principal: pr, balance: k === n ? 0 : bal });
    }
    return { ok: true, errors: [], payment: P, last: rows[n - 1].payment, rate: r, rows: rows, first: rows[0].date, lastDate: rows[n - 1].date, interest: interest, total: total, terms: n, every: ev, rule: DEBT_RULE };
  }
  /** balance still owed on a day (after the payments dated on or before it); the entered balance before the first payment */
  function debtBalanceOn(d, day) { var S = debtSchedule(d); if (!S.ok) return num(d && d.balance) || 0; var bal = r2(num(d.balance));
    for (var i = 0; i < S.rows.length; i++) { if (S.rows[i].date > day) break; bal = S.rows[i].balance; } return bal; }

  var INCOME_RULE = 'Take-home is gross pay less each deduction. A percentage is of gross pay and is rounded to the cent on its own.';
  /** p: {gross, deductions:[{name, kind:'fixed'|'percent', value}]}. Returns {ok, errors[], gross, net, lines:[{name, kind, value, amount}], total, rule}. */
  function takeHome(p) {
    var g = num(p && p.gross), E = [], lines = [], tot = 0;
    if (!(g > 0)) E.push('Gross pay must be more than 0.');
    ((p && p.deductions) || []).forEach(function (d, i) { var v = num(d && d.value), kind = d && d.kind === 'percent' ? 'percent' : 'fixed', name = String((d && d.name) || '').trim() || ('Deduction ' + (i + 1));
      if (!(v >= 0)) { E.push(name + ': enter an amount of 0 or more.'); return; }
      if (kind === 'percent' && v > 100) { E.push(name + ': a percentage cannot be more than 100.'); return; }
      var a = kind === 'percent' ? r2((g > 0 ? g : 0) * v / 100) : r2(v); tot = r2(tot + a); lines.push({ name: name, kind: kind, value: v, amount: a }); });
    if (!E.length && tot > g) E.push('Deductions are more than gross pay.');
    return { ok: !E.length, errors: E, gross: g > 0 ? r2(g) : 0, net: r2((g > 0 ? g : 0) - tot), lines: lines, total: tot, rule: INCOME_RULE };
  }

  /** '1, 15' or [1,15] -> sorted unique days of month 1..31 */
  function monthDayList(x) { var out = []; (Array.isArray(x) ? x : String(x == null ? '' : x).split(/[ ,;]+/)).forEach(function (t) { var n = Math.floor(Number(t)); if (n >= 1 && n <= 31 && out.indexOf(n) < 0) out.push(n); }); return out.sort(function (a, b) { return a - b; }); }
  function ord(n) { var s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }
  /** how a schedule reads to a person */
  function repeatLabel(v) { v = v || {}; var rep = v.repeat || 'once';
    if (!v.date) return 'not scheduled';
    if (rep === 'every') { var n = Math.max(1, Math.floor(+v.every || 1)); return (n === 1 ? 'every day' : 'every ' + n + ' days') + ' from ' + v.date + (v.until ? ' to ' + v.until : ''); }
    if (rep === 'monthdays') { var L = monthDayList(v.on); return (L.length ? 'on the ' + L.map(ord).join(', ') + ' each month' : 'each month') + ' from ' + v.date + (v.until ? ' to ' + v.until : ''); }
    if (rep === 'monthly') { var d = pdate(v.date); return 'on the ' + (d ? ord(d.getDate()) : '?') + ' each month from ' + v.date + (v.until ? ' to ' + v.until : ''); }
    if (rep === 'dates') return (Array.isArray(v.on) ? v.on.length : 1) + ' set dates';
    if (rep === 'daily') return 'every day from ' + v.date + (v.until ? ' to ' + v.until : '');
    if (rep === 'weekdays') return 'weekdays from ' + v.date + (v.until ? ' to ' + v.until : '');
    if (rep === 'weekly') return 'weekly from ' + v.date + (v.until ? ' to ' + v.until : '');
    return 'once on ' + v.date; }
  function money(n) { if (n == null || !isFinite(+n)) return '—'; return (+n < 0 ? '-' : '') + '$' + Math.abs(+n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  /** last valid YYYY-MM-DD of a YYYY-MM month; never month+'-31' on a short month */
  function lastDay(month) { if (!/^\d{4}-\d{2}$/.test(String(month || ''))) return null; var mo=+month.slice(5, 7); if (mo < 1 || mo > 12) return null; return ymd(new Date(+month.slice(0, 4), mo, 0)); }
  /** Cash only when values.assetKind is 'cash'. Do not infer spendability from the name, and do not treat unmarked items as cash. */
  function isCashAsset(it) { return ((it && it.values) || {}).assetKind === 'cash'; }
  function isOwnedAsset(it) { return ((it && it.values) || {}).assetKind === 'owned'; }


  var api = { r2: r2, ymd: ymd, pdate: pdate, addDays: addDays, dayDiff: dayDiff, num: num, debtSchedule: debtSchedule, debtBalanceOn: debtBalanceOn, takeHome: takeHome,
    monthDayList: monthDayList, repeatLabel: repeatLabel, ord: ord, money: money, lastDay: lastDay, isCashAsset: isCashAsset, isOwnedAsset: isOwnedAsset, DEBT_RULE: DEBT_RULE, INCOME_RULE: INCOME_RULE };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.BudgetRules = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);

