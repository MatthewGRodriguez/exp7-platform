/**
 * calendar_model.js — editable hierarchical calendar (living-core authored)
 * Year → Month → Week → Day → Hour → Action → Item(expenses)
 *
 * Cadence rules (editable in ranking_ui, saved with workbook):
 *   always | daily | weekdays | weekly | every_n_days | monthly | yearly | selected
 * Work block: Mon–Fri 15:00–23:00 CST (America/Chicago).
 *
 * Money law (monthly once):
 * - Sheet / amountMonthly = MONTHLY bill (SoT). Count at most once per month.
 * - Cadence / paint only places WHEN it shows — never multiplies $ × days or hours.
 * - Day/hour $ are attribution shares that sum to that single monthly bill.
 * - Schedule-only ($0) never invents money.
 */
(function (global) {
  'use strict';

  var MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  function clamp(n, a, b) {
    n = Number(n) || 0;
    if (n < a) return a;
    if (n > b) return b;
    return n;
  }

  function hash01(s) {
    var h = 2166136261;
    s = String(s || '');
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return ((h >>> 0) % 10000) / 10000;
  }

  function daysInMonth(year, monthIndex) {
    var dim = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    var d = dim[monthIndex] || 30;
    if (monthIndex === 1 && year % 4 === 0) d = 29;
    return d;
  }

  function hourLabel(h) {
    var ap = h >= 12 ? 'PM' : 'AM';
    var hr = h % 12;
    if (hr === 0) hr = 12;
    return hr + ':00 ' + ap;
  }

  /**
   * Section totals / rollups are sheet math — never calendar events.
   * (Bug: "Hobbies" matched LEISURE/HOBBIES/ENTERTAINMENT TOTAL, etc.)
   */
  function isAggregateExpenseName(name) {
    name = String(name || '').trim();
    if (!name) return true;
    if (/\bTOTAL\b/i.test(name)) return true;
    if (/^GRAND\b/i.test(name)) return true;
    if (/^(LIVING|MONTHLY)\s+EXPENSES$/i.test(name)) return true;
    return false;
  }

  /** Normalize matchNot from disk (JSON kills RegExp → use string patterns). */
  function coerceMatchNot(mn) {
    if (mn == null || mn === '') return null;
    if (mn instanceof RegExp) return mn;
    if (typeof mn === 'string') return mn;
    // broken {} from JSON.stringify(RegExp) — ignore
    if (typeof mn === 'object') return null;
    return String(mn);
  }

  /**
   * Default life profile (CST) — user schedule + expense cadences.
   * match: substring (case-insensitive) against expense name
   *
   * Law:
   * - $ is monthly once (sheet SoT)
   * - cadence = USE days (not “bill every day”)
   * - subscriptions often bill monthly but are only used some days → weekly/paint, not daily spam
   * - always/all-day = available background (infra), not “I did this at 9am”
   */
  function defaultProfile() {
    return {
      version: 3,
      timezone: 'America/Chicago',
      label: 'CST life calendar',
      startYear: new Date().getFullYear(),
      editable: true,
      work: {
        enabled: true,
        label: 'Work',
        days: [1, 2, 3, 4, 5], // Mon–Fri
        startHour: 15,
        endHour: 23, // exclusive end → 15..22 inclusive active; show through 22–23 block as 15–23
        timezone: 'CST',
        monthlyIncome: null, // filled from INCOME.net by ranking_ui
        incomeLabel: 'Work income (NET)'
      },
      // first rule match wins (more specific first)
      // matchNot: string patterns (JSON-safe). TOTAL lines excluded in collectItems.
      rules: [
        { id: 'flight', match: 'Flight', cadence: 'yearly', month: 6, day: 15, hours: [10], note: 'fly once a year — save up monthly' },
        { id: 'dining', match: 'Dining out', cadence: 'monthly', day: 12, hours: [18], note: 'once a month' },
        { id: 'hair', match: 'Beauty Shop', cadence: 'every_n_days', nDays: 11, hours: [11], note: 'haircut ~every 1.5 weeks' },
        { id: 'hair2', match: 'Barber', cadence: 'every_n_days', nDays: 11, hours: [11], note: 'haircut ~every 1.5 weeks' },
        // use some days (not every day just because sub exists)
        { id: 'psn', match: 'PlayStation', cadence: 'weekly', days: [2, 4, 6], hours: [12], note: 'use days · paint to refine' },
        { id: 'psn2', match: 'PSN', cadence: 'weekly', days: [2, 4, 6], hours: [12], note: 'use days · paint to refine' },
        { id: 'appledev', match: 'Apple Dev', cadence: 'weekly', days: [1, 3, 5], hours: [10], note: 'dev some weekdays AM · paint to refine' },
        // infra: available always (all-day), not a timed “use every day” event
        { id: 'do', match: 'Digital Ocean', cadence: 'always', hours: ['all'], allDay: true, note: 'infra always on · $ monthly once' },
        { id: 'internet', match: 'Internet', cadence: 'always', hours: ['all'], allDay: true, note: 'infra always on · $ monthly once', matchNot: 'TOTAL' },
        // phone: with you all day when scheduled; still monthly once
        { id: 'phone', match: 'Cell Phone', cadence: 'always', hours: ['all'], allDay: true, note: 'available all day · $ monthly once' },
        { id: 'phone2', match: 'iPhone', cadence: 'always', hours: ['all'], allDay: true, note: 'device available all day · $ monthly once' },
        // attention blocks you actually do
        { id: 'grok', match: 'xAI', cadence: 'daily', hours: [10, 14], note: 'Grok sessions (pre-work)' },
        { id: 'grok2', match: 'Grok', cadence: 'daily', hours: [10, 14], note: 'Grok sessions' },
        // Car use — NEVER Car Insurance / car loan (substring bug)
        { id: 'car_ins', match: 'Car Insurance', cadence: 'monthly', day: 1, hours: [9], note: 'insurance bill · not car use' },
        { id: 'car', match: 'Car', cadence: 'weekdays', hours: [14, 23], note: 'commute / use around work', matchNot: 'Insurance|loan|Loan|TOTAL' },
        { id: 'gas', match: 'Gas', cadence: 'weekly', days: [1, 4], hours: [14], note: 'fuel on use days · paint to refine', matchNot: 'Natural|TOTAL' },
        { id: 'gasoline', match: 'Gasoline', cadence: 'weekly', days: [1, 4], hours: [14], note: 'fuel on use days' },
        { id: 'snacks', match: 'Snacks', cadence: 'daily', hours: [11, 16], note: 'snacks when you snack' },
        // digital subs: bill monthly, USE some days (not daily spam) — paint real use
        { id: 'proton', match: 'Proton', cadence: 'weekly', days: [1, 3, 5], hours: [9], note: 'sub · use some days · paint actual' },
        { id: 'redacted_merchant', match: '[REDACTED-MERCHANT]', cadence: 'weekly', days: [1, 2, 3, 4, 5, 0], hours: [9, 15], allowWorkHours: true, note: 'sub · use days · paint actual' },
        // exact name only — never LEISURE/HOBBIES/ENTERTAINMENT TOTAL
        { id: 'hobbies', match: 'Hobbies', matchExact: true, cadence: 'weekly', days: [0, 6], hours: [11], note: 'hobby time weekends · paint actual' },
        { id: 'paypal', match: 'Paypal', cadence: 'weekly', days: [2, 5], hours: [12], note: 'sub/use some days · paint actual' },
        { id: 'paypal2', match: 'PayPal', cadence: 'weekly', days: [2, 5], hours: [12], note: 'sub/use some days · paint actual' },
        { id: 'credit', match: 'Credit', cadence: 'monthly', day: 1, hours: [12], note: 'credit line · monthly marker · paint use if needed', matchNot: 'TOTAL' },
        { id: 'icloud', match: 'Icloud', cadence: 'always', hours: ['all'], allDay: true, note: 'cloud available · $ monthly once' },
        { id: 'icloud2', match: 'iCloud', cadence: 'always', hours: ['all'], allDay: true, note: 'cloud available · $ monthly once' },
        { id: 'personal', match: 'Personal Supplies', cadence: 'weekly', days: [0], hours: [8], note: 'supplies · not every day' },
        // entertainment / other subs (sheet lines that used to fall into daily 10:00)
        { id: 'crunchy', match: 'Crunchy', cadence: 'weekly', days: [0, 6], hours: [20], note: 'watch some days · paint actual' },
        { id: 'cruncy', match: 'Cruncy', cadence: 'weekly', days: [0, 6], hours: [20], note: 'watch some days · paint actual' },
        { id: 'hidive', match: 'HiDive', cadence: 'weekly', days: [0, 6], hours: [20], note: 'watch some days · paint actual' },
        { id: 'google', match: 'Google', cadence: 'weekly', days: [1, 3], hours: [10], note: 'sub · use some days · paint actual', matchNot: 'TOTAL' },
        { id: 'mtg', match: 'MTG', cadence: 'weekly', days: [6], hours: [13], note: 'game day · paint actual' },
        { id: 'minecraft', match: 'MineCraft', cadence: 'weekly', days: [0, 6], hours: [15], note: 'play some days · paint actual' },
        { id: 'student_loan', match: 'Stuent Loan', cadence: 'monthly', day: 1, hours: [9], note: 'loan payment marker' },
        { id: 'student_loan2', match: 'Student Loan', cadence: 'monthly', day: 1, hours: [9], note: 'loan payment marker' },
        // unmatched real lines: monthly bill marker once — NOT daily mid-morning spam
        { id: 'default_monthly', match: '*', cadence: 'monthly', day: 1, hours: [9], note: 'monthly bill · paint use days if you care about when' }
      ]
    };
  }

  function deepClone(o) {
    return JSON.parse(JSON.stringify(o));
  }

  function ensureProfile(raw) {
    var base = defaultProfile();
    if (!raw || typeof raw !== 'object') return base;
    var out = deepClone(base);
    if (raw.timezone) out.timezone = raw.timezone;
    if (raw.label) out.label = raw.label;
    if (raw.startYear != null) out.startYear = raw.startYear;
    if (raw.work && typeof raw.work === 'object') {
      Object.keys(raw.work).forEach(function (k) { out.work[k] = raw.work[k]; });
    }
    if (Array.isArray(raw.rules) && raw.rules.length) {
      var ver = Number(raw.version) || 0;
      var legacySpam = raw.rules.some(function (r) {
        return r && (r.id === 'default_daily' || (r.match === '*' && String(r.cadence).toLowerCase() === 'daily'));
      });
      // v3+ fixes match bugs + sub use-days; replace un-customized legacy packs
      if (ver < 3 || legacySpam) {
        out.rules = deepClone(base.rules);
        out.version = 3;
      } else {
        out.rules = raw.rules.map(function (r, i) {
          var row = Object.assign({ id: 'r' + i }, r);
          if (row.matchNot != null) {
            var mn = coerceMatchNot(row.matchNot);
            if (mn == null) delete row.matchNot;
            else row.matchNot = mn instanceof RegExp ? mn.source : mn;
          }
          if ((row.id === 'car' || row.match === 'Car') && !row.matchNot) {
            row.matchNot = 'Insurance|loan|Loan|TOTAL';
          }
          if ((row.id === 'gas' || row.match === 'Gas') && !row.matchNot) {
            row.matchNot = 'Natural|TOTAL';
          }
          if (row.id === 'hobbies' || row.match === 'Hobbies') row.matchExact = true;
          return row;
        });
        out.version = Math.max(ver, 3);
      }
    }
    // per-item overrides: { "Flight": { cadence, ... }, ... }
    if (raw.itemOverrides && typeof raw.itemOverrides === 'object') {
      out.itemOverrides = raw.itemOverrides;
    } else {
      out.itemOverrides = out.itemOverrides || {};
    }
    if (Array.isArray(raw.customActions)) out.customActions = raw.customActions;
    else out.customActions = out.customActions || [];
    if (raw.income) out.income = raw.income;
    out.editable = true;
    return out;
  }

  function nameMatches(rule, name) {
    name = String(name || '');
    // never attach rules to section totals (even if match is "*")
    if (isAggregateExpenseName(name)) return false;
    var mn = coerceMatchNot(rule.matchNot);
    if (mn) {
      var re = mn instanceof RegExp ? mn : new RegExp(mn, 'i');
      if (re.test(name)) return false;
    }
    if (rule.match === '*' || rule.match === '') return true;
    if (rule.matchExact) return name.toLowerCase() === String(rule.match).toLowerCase();
    return name.toLowerCase().indexOf(String(rule.match).toLowerCase()) >= 0;
  }

  function ruleForItem(item, profile) {
    profile = ensureProfile(profile);
    var name = item.name || item;
    if (isAggregateExpenseName(name)) {
      return {
        id: 'aggregate_skip',
        match: name,
        cadence: 'selected',
        selectedKeys: [],
        hours: [0],
        note: 'section total — not a calendar event'
      };
    }
    if (profile.itemOverrides && profile.itemOverrides[name]) {
      return Object.assign({ id: 'override_' + name, match: name }, profile.itemOverrides[name]);
    }
    var rules = profile.rules || [];
    for (var i = 0; i < rules.length; i++) {
      if (nameMatches(rules[i], name)) return rules[i];
    }
    // unmatched: monthly bill marker, not daily use spam
    return { id: 'fallback', match: name, cadence: 'monthly', day: 1, hours: [9], note: 'monthly bill · paint use days' };
  }

  function isWorkDay(dow, work) {
    if (!work || work.enabled === false) return false;
    var days = work.days || [1, 2, 3, 4, 5];
    return days.indexOf(dow) >= 0;
  }

  function isWorkHour(hour, work) {
    if (!work || work.enabled === false) return false;
    var a = Number(work.startHour);
    var b = Number(work.endHour);
    if (!isFinite(a)) a = 15;
    if (!isFinite(b)) b = 23;
    // inclusive start, exclusive end (15–23 means hours 15..22 active; label span 3pm–11pm)
    return hour >= a && hour < b;
  }

  /**
   * absoluteDay index from horizon start (year0 month0 day0 = 0)
   */
  function absoluteDayIndex(yearIndex, monthIndex, dayIndex, startYear) {
    var n = 0;
    var y, m;
    for (y = 0; y < yearIndex; y++) {
      for (m = 0; m < 12; m++) n += daysInMonth(startYear + y, m);
    }
    for (m = 0; m < monthIndex; m++) n += daysInMonth(startYear + yearIndex, m);
    return n + dayIndex;
  }

  /** Day key within horizon: yearIndex-monthIndex-dayOfMonth (1-based day) */
  function dayKey(yearIndex, monthIndex, day) {
    return String(yearIndex | 0) + '-' + String(monthIndex | 0) + '-' + String(day | 0);
  }

  function parseDayKey(key) {
    var p = String(key || '').split('-');
    if (p.length < 3) return null;
    return {
      yearIndex: parseInt(p[0], 10) || 0,
      monthIndex: parseInt(p[1], 10) || 0,
      day: parseInt(p[2], 10) || 1
    };
  }

  /** Compare day keys (yearIndex-monthIndex-day) ascending. */
  function compareDayKeys(a, b) {
    var pa = parseDayKey(a);
    var pb = parseDayKey(b);
    if (!pa || !pb) return 0;
    if (pa.yearIndex !== pb.yearIndex) return pa.yearIndex - pb.yearIndex;
    if (pa.monthIndex !== pb.monthIndex) return pa.monthIndex - pb.monthIndex;
    return pa.day - pb.day;
  }

  /**
   * Inclusive day-key range from first click → last click (calendar order).
   * startYear used for month lengths when spanning months/years.
   */
  function keysInRange(keyA, keyB, startYear) {
    var a = parseDayKey(keyA);
    var b = parseDayKey(keyB);
    if (!a || !b) return [];
    if (compareDayKeys(keyA, keyB) > 0) {
      var tmp = a;
      a = b;
      b = tmp;
    }
    startYear = startYear != null ? startYear : new Date().getFullYear();
    var keys = [];
    var yi = a.yearIndex;
    var mi = a.monthIndex;
    var d = a.day;
    var guard = 0;
    while (guard++ < 5000) {
      keys.push(dayKey(yi, mi, d));
      if (yi === b.yearIndex && mi === b.monthIndex && d === b.day) break;
      d += 1;
      var dim = daysInMonth(startYear + yi, mi);
      if (d > dim) {
        d = 1;
        mi += 1;
        if (mi > 11) {
          mi = 0;
          yi += 1;
        }
      }
    }
    return keys;
  }

  /**
   * Explicit painted days (visual schedule).
   * rule.selectedKeys: ["0-5-15", ...] absolute horizon days
   * rule.yearMarks: { "0": ["5-15","11-1"], "1": [...] } month-day per yearIndex
   * rule.repeatMarks: ["5-15"] — same month-day every year (when apply-all)
   */
  function selectedOccurs(rule, ctx) {
    rule = rule || {};
    var k = dayKey(ctx.yearIndex, ctx.monthIndex, ctx.day);
    var keys = rule.selectedKeys || rule.selected || [];
    if (Array.isArray(keys) && keys.indexOf(k) >= 0) return true;
    var ym = rule.yearMarks || rule.yearlyMarks;
    if (ym && typeof ym === 'object') {
      var list = ym[String(ctx.yearIndex)] || ym[ctx.yearIndex] || [];
      var md = String(ctx.monthIndex) + '-' + String(ctx.day);
      if (Array.isArray(list) && list.indexOf(md) >= 0) return true;
    }
    var rep = rule.repeatMarks || rule.repeatSelected;
    if (Array.isArray(rep) && rep.length) {
      var md2 = String(ctx.monthIndex) + '-' + String(ctx.day);
      if (rep.indexOf(md2) >= 0) return true;
    }
    return false;
  }

  function occursOnDay(rule, ctx) {
    // ctx: { dow, day, monthIndex, yearIndex, absoluteDay, nDaysMonth }
    rule = rule || {};
    var cad = String(rule.cadence || 'daily').toLowerCase();
    var RULE = {
      weekdays: 1, daily: 1, always: 1, weekends: 1, weekly: 1,
      some_days: 1, monthly: 1, yearly: 1, every_n_days: 1
    };
    var isRule = !!RULE[cad];
    // Non-rule cadences (selected/paint/none/…): paint marks only.
    // Rule cadences below: never let repeatMarks alone override the rule.
    if (!isRule) {
      return selectedOccurs(rule, ctx);
    }
    // Rule cadence: compute ruleHit; also true if explicit marks hit (OR), never drop rule
    var ruleHit = false;
    if (cad === 'always' || cad === 'daily') ruleHit = true;
    else if (cad === 'weekdays') ruleHit = ctx.dow >= 1 && ctx.dow <= 5;
    else if (cad === 'weekends') ruleHit = ctx.dow === 0 || ctx.dow === 6;
    else if (cad === 'weekly' || cad === 'some_days') {
      var days = rule.days || [1, 3, 5];
      ruleHit = days.indexOf(ctx.dow) >= 0;
    } else if (cad === 'every_n_days') {
      var n = Math.max(1, Number(rule.nDays) || 11);
      var phase = Number(rule.phase) || 0;
      ruleHit = ((ctx.absoluteDay + phase) % n) === 0;
    } else if (cad === 'monthly') {
      var d = Number(rule.day) || 1;
      d = clamp(d, 1, ctx.nDaysMonth);
      ruleHit = ctx.day === d;
    } else if (cad === 'yearly') {
      var mo = Number(rule.month != null ? rule.month : 0); // 0–11 or 1–12
      if (mo >= 1 && mo <= 12) mo = mo - 1;
      var dy = Number(rule.day) || 1;
      ruleHit = ctx.monthIndex === mo && ctx.day === clamp(dy, 1, ctx.nDaysMonth);
    }
    if (selectedOccurs(rule, ctx)) return true;
    return ruleHit;
  }

  /** Build densest year grid meta for paint UI (no $). */
  function buildYearGrid(yearIndex, startYear, firstDow) {
    yearIndex = yearIndex | 0;
    startYear = startYear != null ? startYear : new Date().getFullYear();
    firstDow = firstDow | 0; // dow of Jan 1 for that civil year — approximate if 0
    var civil = startYear + yearIndex;
    // compute Jan 1 dow if not given: use Date
    try {
      firstDow = new Date(civil, 0, 1).getDay();
    } catch (_e) { /* */ }
    var months = [];
    var m, d;
    for (m = 0; m < 12; m++) {
      var nDays = daysInMonth(civil, m);
      var cells = [];
      var lead = new Date(civil, m, 1).getDay();
      for (var pad = 0; pad < lead; pad++) cells.push({ empty: true });
      for (d = 1; d <= nDays; d++) {
        var dow = (lead + d - 1) % 7;
        cells.push({
          empty: false,
          day: d,
          monthIndex: m,
          yearIndex: yearIndex,
          dow: dow,
          key: dayKey(yearIndex, m, d),
          isWeekend: dow === 0 || dow === 6
        });
      }
      months.push({
        monthIndex: m,
        name: MONTH_NAMES[m],
        nDays: nDays,
        cells: cells
      });
    }
    return {
      yearIndex: yearIndex,
      civilYear: civil,
      label: String(civil),
      months: months
    };
  }

  function toggleKeyInSet(setObj, key, on) {
    setObj = setObj || {};
    if (on === true) setObj[key] = 1;
    else if (on === false) delete setObj[key];
    else {
      if (setObj[key]) delete setObj[key];
      else setObj[key] = 1;
    }
    return setObj;
  }

  /** Convert selected key map → rule fields for selected cadence */
  function selectionToRule(selectedMap, opts) {
    opts = opts || {};
    var keys = Object.keys(selectedMap || {}).filter(function (k) {
      return selectedMap[k];
    });
    keys.sort();
    // Painted placement is explicit — allow concurrent hours (incl. work) by default
    var allowWork =
      opts.allowWorkHours != null ? !!opts.allowWorkHours : true;
    var hoursOpt = opts.hours;
    var allDay = !!(opts.allDay || opts.all_day);
    if (!allDay && hoursOpt != null) {
      var ph = parseHoursField(hoursOpt);
      allDay = ph.allDay;
      if (!allDay) hoursOpt = ph.hours;
    }
    var rule = {
      cadence: 'selected',
      selectedKeys: keys,
      hours: allDay ? ['all'] : (hoursOpt || [10]),
      allDay: allDay,
      note: opts.note || 'painted days',
      allowWorkHours: allowWork,
      // overlaps ok: multiple actions may share day+hour / all-day band
      overlap: opts.overlap !== false
    };
    // optional: collapse to yearMarks
    var ym = Object.create(null);
    keys.forEach(function (k) {
      var p = parseDayKey(k);
      if (!p) return;
      var yk = String(p.yearIndex);
      if (!ym[yk]) ym[yk] = [];
      var md = p.monthIndex + '-' + p.day;
      if (ym[yk].indexOf(md) < 0) ym[yk].push(md);
    });
    rule.yearMarks = ym;
    if (opts.repeatAllYears && keys.length) {
      // use month-day set from first year as repeatMarks
      var firstY = keys[0] ? parseDayKey(keys[0]).yearIndex : 0;
      rule.repeatMarks = (ym[String(firstY)] || []).slice();
      rule.selectedKeys = []; // prefer repeat
    }
    return rule;
  }

  function ruleToSelectionMap(rule) {
    var map = Object.create(null);
    rule = rule || {};
    (rule.selectedKeys || []).forEach(function (k) {
      map[k] = 1;
    });
    var ym = rule.yearMarks || {};
    Object.keys(ym).forEach(function (yi) {
      (ym[yi] || []).forEach(function (md) {
        var parts = String(md).split('-');
        map[dayKey(parseInt(yi, 10) || 0, parseInt(parts[0], 10) || 0, parseInt(parts[1], 10) || 1)] = 1;
      });
    });
    return map;
  }

  /**
   * Day occupancy map for paint UI — other actions/expenses already on each day.
   * Returns { [dayKey]: { n, names: string[], hours: number[] } }
   * excludeName: skip the action currently being painted (avoid self-count).
   * Overlaps are allowed: n > 1 or busy while painting means concurrent events.
   */
  function dayOccupancy(opts) {
    opts = opts || {};
    var profile = ensureProfile(opts.profile || opts.calendar);
    var yearIndex = opts.yearIndex | 0;
    var startYear = opts.startYear != null ? opts.startYear : profile.startYear;
    var civilYear = startYear + yearIndex;
    var exclude = String(opts.excludeName || opts.exclude || '').toLowerCase();
    var items = mergeCustomActions(opts.items || [], profile);
    var map = Object.create(null);
    var m, d;
    for (m = 0; m < 12; m++) {
      var nDays = daysInMonth(civilYear, m);
      var lead = 0;
      try {
        lead = new Date(civilYear, m, 1).getDay();
      } catch (_e) { /* */ }
      for (d = 1; d <= nDays; d++) {
        var dow = (lead + d - 1) % 7;
        var abs = absoluteDayIndex(yearIndex, m, d - 1, startYear);
        var ctx = {
          dow: dow,
          day: d,
          monthIndex: m,
          yearIndex: yearIndex,
          absoluteDay: abs,
          nDaysMonth: nDays
        };
        var k = dayKey(yearIndex, m, d);
        var names = [];
        var hours = [];
        items.forEach(function (it) {
          if (!it || !it.name) return;
          if (exclude && String(it.name).toLowerCase() === exclude) return;
          var rule = it._customRule
            ? it._customRule
            : patch[REDACTED-MERCHANT]Work(ruleForItem(it, profile));
          if (!occursOnDay(rule, ctx)) return;
          names.push(it.name);
          var hf = hoursFor(rule, ctx, profile.work);
          if (hf.allDay) {
            // mark all-day occupancy (not a single hour)
            if (hours.indexOf(-1) < 0) hours.push(-1);
          } else {
            (hf.hours || []).forEach(function (h) {
              if (hours.indexOf(h) < 0) hours.push(h);
            });
          }
        });
        // work block counts as occupancy on work days
        if (isWorkDay(dow, profile.work) && profile.work && profile.work.enabled !== false) {
          var wLabel = (profile.work.label || 'Work');
          if (!exclude || exclude !== wLabel.toLowerCase()) {
            names.push(wLabel);
            var wh = Number(profile.work.startHour) || 15;
            if (hours.indexOf(wh) < 0) hours.push(wh);
          }
        }
        if (names.length) {
          map[k] = { n: names.length, names: names, hours: hours };
        }
      }
    }
    return map;
  }

  /**
   * All-day = present the whole day (Google/Apple style), concurrent with timed
   * actions and other all-day items. Days still controlled by cadence/paint.
   * Accepts: allDay:true · hours "all"/"allday"/"*" · cadence always · 0–23 listed.
   */
  function isAllDayToken(v) {
    var s = String(v == null ? '' : v).trim().toLowerCase();
    return s === 'all' || s === 'allday' || s === 'all-day' || s === '*' || s === '24' || s === '24h';
  }

  function isAllDayRule(rule) {
    rule = rule || {};
    if (rule.allDay === true || rule.all_day === true) return true;
    if (String(rule.cadence || '').toLowerCase() === 'always') return true;
    var hrs = rule.hours;
    if (hrs == null) return false;
    if (isAllDayToken(hrs)) return true;
    if (Array.isArray(hrs)) {
      if (!hrs.length) return false;
      if (hrs.some(function (h) { return isAllDayToken(h); })) return true;
      // full 0..23 listed (or ≥24 distinct hour slots)
      if (hrs.length >= 24) return true;
      var set = Object.create(null);
      var nNum = 0;
      hrs.forEach(function (h) {
        var n = Number(h);
        if (isFinite(n) && n >= 0 && n <= 23) {
          set[n | 0] = 1;
          nNum++;
        }
      });
      if (Object.keys(set).length >= 24) return true;
    }
    return false;
  }

  /**
   * Parse hours field from UI: "10,14" | "all" | "allday" | "9-12" | "15-23"
   * Returns { hours: number[], allDay: boolean }
   */
  function parseHoursField(raw) {
    if (raw == null || raw === '') return { hours: [10], allDay: false };
    if (typeof raw === 'number' && isFinite(raw)) {
      return { hours: [clamp(raw, 0, 23)], allDay: false };
    }
    if (Array.isArray(raw)) {
      if (raw.some(function (h) { return isAllDayToken(h); }) || raw.length >= 24) {
        return { hours: [], allDay: true };
      }
      var outA = [];
      raw.forEach(function (h) {
        var n = parseInt(h, 10);
        if (isFinite(n) && n >= 0 && n <= 23 && outA.indexOf(n) < 0) outA.push(n);
      });
      return { hours: outA.length ? outA : [10], allDay: false };
    }
    var s = String(raw).trim();
    if (isAllDayToken(s)) return { hours: [], allDay: true };
    // range: 9-17 or 9–17
    if (/^\d{1,2}\s*[-–—to]+\s*\d{1,2}$/i.test(s)) {
      var parts = s.split(/\s*[-–—]|to\s*/i);
      var a = clamp(parseInt(parts[0], 10) || 0, 0, 23);
      var b = clamp(parseInt(parts[1], 10) || 0, 0, 23);
      if (a === 0 && b === 23) return { hours: [], allDay: true };
      if (a > b) { var t = a; a = b; b = t; }
      var range = [];
      for (var h = a; h <= b; h++) range.push(h);
      // full day range counts as all-day
      if (range.length >= 24) return { hours: [], allDay: true };
      return { hours: range, allDay: false };
    }
    var out = [];
    s.split(/[,\s]+/).forEach(function (tok) {
      tok = tok.trim();
      if (!tok) return;
      if (isAllDayToken(tok)) {
        out = null; // signal all-day
        return;
      }
      if (out === null) return;
      // sub-range in list: 9-12
      if (/^\d{1,2}\s*[-–—]\s*\d{1,2}$/.test(tok)) {
        var p2 = tok.split(/\s*[-–—]\s*/);
        var a2 = clamp(parseInt(p2[0], 10) || 0, 0, 23);
        var b2 = clamp(parseInt(p2[1], 10) || 0, 0, 23);
        if (a2 > b2) { var t2 = a2; a2 = b2; b2 = t2; }
        for (var hh = a2; hh <= b2; hh++) {
          if (out.indexOf(hh) < 0) out.push(hh);
        }
        return;
      }
      var n = parseInt(tok, 10);
      if (isFinite(n) && n >= 0 && n <= 23 && out.indexOf(n) < 0) out.push(n);
    });
    if (out === null) return { hours: [], allDay: true };
    return { hours: out.length ? out : [10], allDay: false };
  }

  function hoursFor(rule, ctx, work) {
    rule = rule || {};
    var cad = String(rule.cadence || 'daily').toLowerCase();
    // All-day: whole day band, concurrent with timed + other all-day (money still monthly once)
    if (isAllDayRule(rule)) {
      return {
        hours: [],
        allDay: true,
        alwaysOn: cad === 'always',
        // always = every day; other cadences (selected/paint/weekly) pick which days
        everyDay: cad === 'always'
      };
    }
    var parsed = parseHoursField(rule.hours);
    if (parsed.allDay) {
      return { hours: [], allDay: true, alwaysOn: false, everyDay: false };
    }
    var hrs = parsed.hours.length
      ? parsed.hours.map(function (h) { return clamp(h, 0, 23); })
      : [10];
    // Google/Apple-style: multiple actions may share an hour (incl. work).
    // Only push out of work when rule.avoidWorkHours is explicitly true.
    // Painted/selected days are always explicit placement — never shift.
    var explicitPaint =
      cad === 'selected' ||
      cad === 'paint' ||
      (Array.isArray(rule.selectedKeys) && rule.selectedKeys.length) ||
      (rule.yearMarks && Object.keys(rule.yearMarks).length) ||
      (Array.isArray(rule.repeatMarks) && rule.repeatMarks.length);
    if (
      !explicitPaint &&
      rule.avoidWorkHours === true &&
      !rule.allowWorkHours &&
      work &&
      work.enabled !== false &&
      isWorkDay(ctx.dow, work)
    ) {
      hrs = hrs.map(function (h) {
        if (isWorkHour(h, work)) {
          if (h >= work.startHour) return clamp(work.endHour, 0, 23);
          return h;
        }
        return h;
      });
    }
    return { hours: hrs, alwaysOn: !!rule.alwaysOn, allDay: false };
  }

  // [REDACTED-MERCHANT] during work is intentional
  function patch[REDACTED-MERCHANT]Work(rule) {
    if (rule && /redacted_merchant/i.test(String(rule.match || ''))) {
      rule = Object.assign({}, rule, { allowWorkHours: true });
    }
    return rule;
  }

  function collectItems(expenses, lineAmtFn) {
    var out = [];
    var lineAmt = typeof lineAmtFn === 'function'
      ? lineAmtFn
      : function (it) {
          var v = it.current != null ? it.current : it.amount;
          return Math.max(0, Number(v) || 0);
        };
    (expenses && expenses.sections ? expenses.sections : []).forEach(function (sec, si) {
      var secName = (sec && sec.name) || ('Section ' + si);
      // section header itself is not an item
      if (isAggregateExpenseName(secName) && !(sec.items && sec.items.length)) return;
      (sec.items || []).forEach(function (it, ii) {
        if (!it || !it.name || !String(it.name).trim()) return;
        // bug fix: never place TOTAL / GRAND TOTAL / section rollups on the calendar
        if (isAggregateExpenseName(it.name)) return;
        var cost = lineAmt(it);
        if (!(cost > 0)) return;
        out.push({
          id: 'item_' + si + '_' + ii + '_' + String(it.name).replace(/\W+/g, '_').slice(0, 24),
          name: it.name,
          cost: cost,
          section: secName,
          sectionIndex: si,
          itemIndex: ii,
          isDebtPay: !!(it.payToDebt != null || /pay\s*to\s*debt/i.test(String(it.remarks || '')) || it.debtIndex != null),
          remarks: it.remarks || '',
          score: Number(it._score) || 0,
          rankH: Number(it._rankH) || 0
        });
      });
    });
    return out;
  }

  /**
   * Count occurrences of a rule in a month (for $ slicing).
   */
  function countOccurrencesInMonth(rule, yearIndex, monthIndex, startYear, firstDow) {
    var nDays = daysInMonth(startYear + yearIndex, monthIndex);
    var count = 0;
    var d;
    for (d = 0; d < nDays; d++) {
      var abs = absoluteDayIndex(yearIndex, monthIndex, d, startYear);
      var dow = (d + (firstDow | 0)) % 7;
      if (occursOnDay(rule, {
        dow: dow,
        day: d + 1,
        monthIndex: monthIndex,
        yearIndex: yearIndex,
        absoluteDay: abs,
        nDaysMonth: nDays
      })) count++;
    }
    // yearly: if not this month, 0
    if (String(rule.cadence).toLowerCase() === 'yearly' && count === 0) return 0;
    return Math.max(count, 0);
  }


  function resolveMoneyWorld(opts, profile) {
    opts = opts || {};
    profile = profile || {};
    var inc = resolveIncome(opts, profile);
    var world = opts.world || profile.world || {};
    // SUMMARY-aligned (ranking_ui fullCalc):
    // surplus = net − living − debtCash
    var living = Number(world.living);
    var debtCash = Number(world.debtCash != null ? world.debtCash : world.debt);
    var surplus = world.surplus;
    if (!isFinite(living)) living = null;
    if (!isFinite(debtCash)) debtCash = null;
    if (!isFinite(surplus)) surplus = null;
    // custom action deltas (not already on EXPENSES sheet)
    var customSpend = 0, customGain = 0;
    var customs = (opts.customActions || profile.customActions || []);
    // calendarSoT: living/debt/surplus/income already folded from placed calendar acts — don't double-count.
    if (!opts.calendarSoT) {
      customs.forEach(function (ca) {
        if (!ca || ca.kind === 'work') return;
        var amt = Math.abs(Number(ca.amountMonthly != null ? ca.amountMonthly : ca.amount) || 0);
        if (!(amt > 0)) return;
        if (ca.polarity === 'gain' || ca.polarity === 'produce') customGain += amt;
        else customSpend += amt;
      });
    }
    var sheetSpend = null;
    if (living != null && debtCash != null) sheetSpend = living + debtCash;
    else if (living != null) sheetSpend = living;
    // Prefer SUMMARY surplus as net, then restate spend/gain for display
    var monthlyGain = inc.net + customGain;
    var monthlySpend = sheetSpend != null ? sheetSpend + customSpend : null;
    var monthlyNet = null;
    if (surplus != null) {
      monthlyNet = surplus + customGain - customSpend;
      if (monthlySpend == null) monthlySpend = monthlyGain - monthlyNet;
    } else if (monthlySpend != null) {
      monthlyNet = monthlyGain - monthlySpend;
    }
    return {
      income: inc,
      living: living,
      debtCash: debtCash,
      surplus: surplus,
      customSpend: customSpend,
      customGain: customGain,
      monthlyGain: monthlyGain,
      monthlySpend: monthlySpend,
      monthlyNet: monthlyNet,
      law: opts.calendarSoT
        ? 'calendar SoT: live rollup from placed calendar acts only'
        : 'calendar net aligns with SUMMARY surplus (+ custom action deltas)'
    };
  }

  function resolveIncome(opts, profile) {
    opts = opts || {};
    profile = profile || {};
    var work = profile.work || {};
    var inc = opts.income || profile.income || {};
    var net = Number(inc.net != null ? inc.net : work.monthlyIncome);
    if (!isFinite(net)) net = 0;
    var gross = Number(inc.gross);
    if (!isFinite(gross)) gross = net;
    return { net: net, gross: gross, label: work.incomeLabel || 'Work income (NET)' };
  }

  function countWorkDaysInMonth(nDays, firstDow, work) {
    var n = 0, d;
    for (d = 0; d < nDays; d++) {
      if (isWorkDay((d + (firstDow | 0)) % 7, work)) n++;
    }
    return n;
  }

  /**
   * Schedule-only actions (amount 0) are first-class — Google/Fantastical-style
   * time blocks without inventing money. Money still SoT from sheet.
   */
  function isScheduleOnly(ca) {
    if (!ca) return false;
    if (ca.scheduleOnly || ca.kind === 'schedule' || ca.kind === 'joy') return true;
    var amt = Math.abs(Number(ca.amountMonthly != null ? ca.amountMonthly : ca.amount) || 0);
    return amt === 0 && ca.kind !== 'work' && ca.kind !== 'spend' && ca.kind !== 'gain';
  }

  function mergeCustomActions(items, profile) {
    items = (items || []).slice();
    var seen = Object.create(null);
    items.forEach(function (it) {
      if (it && it.id) seen[it.id] = 1;
      if (it && it.name) seen['n:' + it.name] = 1;
    });
    var customs = (profile && profile.customActions) || [];
    customs.forEach(function (ca) {
      if (!ca || !ca.name) return;
      if (ca.enabled === false) return;
      var id = ca.id || ('custom_' + String(ca.name).replace(/\W+/g, '_').slice(0, 24));
      if (seen[id] || seen['n:' + ca.name]) return;
      seen[id] = 1;
      seen['n:' + ca.name] = 1;
      var amt = Math.abs(Number(ca.amountMonthly != null ? ca.amountMonthly : ca.amount) || 0);
      var sched = isScheduleOnly(ca);
      if (!(amt > 0) && ca.kind !== 'work' && !sched) return;
      var pol =
        ca.polarity === 'gain' || ca.polarity === 'produce'
          ? 'gain'
          : ca.polarity === 'neutral' || sched
            ? 'neutral'
            : 'spend';
      items.push({
        id: id,
        name: ca.name,
        cost: amt,
        section: ca.section || (sched ? 'SCHEDULE' : 'CUSTOM'),
        isDebtPay: !!ca.isDebtPay,
        polarity: pol,
        isCustom: true,
        scheduleOnly: sched,
        custom: ca,
        _customRule: {
          id: id,
          match: ca.name,
          cadence: ca.cadence || 'daily',
          hours: ca.allDay || ca.all_day ? ['all'] : (ca.hours || [12]),
          allDay: !!(ca.allDay || ca.all_day || isAllDayRule({ hours: ca.hours, cadence: ca.cadence })),
          days: ca.days,
          nDays: ca.nDays,
          day: ca.day,
          month: ca.month,
          note: ca.note || '',
          allowWorkHours: !!ca.allowWorkHours,
          selectedKeys: ca.selectedKeys,
          yearMarks: ca.yearMarks || ca.yearlyMarks,
          repeatMarks: ca.repeatMarks || ca.repeatSelected
        }
      });
    });
    return items;
  }

  /** Upsert a custom/schedule action on profile (mutable). */
  function upsertCustomAction(profile, action) {
    profile = ensureProfile(profile);
    profile.customActions = Array.isArray(profile.customActions) ? profile.customActions : [];
    if (!action || !action.name) return profile;
    var id =
      action.id ||
      ('act_' + String(action.name).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40));
    var next = Object.assign({}, action, { id: id, at: new Date().toISOString() });
    profile.customActions = profile.customActions.filter(function (a) {
      return a && a.id !== id && a.name !== next.name;
    });
    profile.customActions.push(next);
    return profile;
  }

  /** Remove custom action by id or name. */
  function removeCustomAction(profile, idOrName) {
    profile = ensureProfile(profile);
    var key = String(idOrName || '');
    profile.customActions = (profile.customActions || []).filter(function (a) {
      if (!a) return false;
      return a.id !== key && a.name !== key;
    });
    return profile;
  }

  /**
   * P49 densest: re-place a custom action onto hour(s) (drag hour).
   * hours: number | number[] | 'all' · never invents money.
   */
  function rePlaceActionHours(profile, actionId, hours, opts) {
    opts = opts || {};
    profile = ensureProfile(profile);
    profile.customActions = Array.isArray(profile.customActions) ? profile.customActions : [];
    var key = String(actionId || '');
    var found = null;
    var idx = -1;
    for (var i = 0; i < profile.customActions.length; i++) {
      var a = profile.customActions[i];
      if (!a) continue;
      if (a.id === key || a.name === key) {
        found = a;
        idx = i;
        break;
      }
    }
    if (!found) return { ok: false, error: 'action_not_found', id: key, profile: profile };

    var allDay = false;
    var hrs = [];
    if (hours === 'all' || hours === 'allday' || (Array.isArray(hours) && hours[0] === 'all')) {
      allDay = true;
      hrs = ['all'];
    } else if (Array.isArray(hours)) {
      hrs = hours
        .map(function (h) {
          return parseInt(h, 10);
        })
        .filter(function (n) {
          return isFinite(n) && n >= 0 && n <= 23;
        });
    } else {
      var one = parseInt(hours, 10);
      if (isFinite(one) && one >= 0 && one <= 23) hrs = [one];
    }
    if (!allDay && !hrs.length) {
      return { ok: false, error: 'bad_hours', id: key, profile: profile };
    }

    var next = Object.assign({}, found, {
      hours: allDay ? ['all'] : hrs,
      allDay: allDay,
      at: new Date().toISOString(),
      author: found.author || 'ranking_ui'
    });
    // keep schedule-only densest
    if (next.amountMonthly == null && next.amount == null) next.scheduleOnly = true;
    if (Number(next.amountMonthly || next.amount || 0) === 0) {
      next.scheduleOnly = true;
      next.section = next.section || 'SCHEDULE';
    }
    profile.customActions[idx] = next;
    return {
      ok: true,
      profile: profile,
      action: next,
      from: found.hours,
      to: next.hours,
      allDay: allDay,
      note: 'hour re-place densest · Save workbook to keep'
    };
  }

  /**
   * Monthly bill for one item this civil month.
   * Law: sheet / amountMonthly is a MONTHLY amount — charge at most once.
   * Cadence (daily, 2 days, paint, …) only schedules presence — never multiplies $.
   * Schedule-only ($0) never invents money.
   */
  function monthBillForItem(it) {
    if (!it) return 0;
    if (it.scheduleOnly) return 0;
    var cost = Number(it.cost) || 0;
    if (!(cost > 0)) return 0;
    // Always monthly-once while the line exists (SoT). Cadence ≠ multiplier.
    return cost;
  }

  /**
   * Per-placement attribution of the monthly bill.
   * Sum over all scheduled day×hour slots this month = monthBill (never × occurs).
   * If occurs=0 this month (e.g. yearly off-month), no day slice; bill still monthly via monthBill.
   */
  function placementSlice(it, rule, nDaysMonth) {
    var bill = monthBillForItem(it);
    if (!(bill > 0)) {
      return { slice: 0, monthBill: 0, annualEvent: null, moneyLaw: 'monthly_once' };
    }
    var cad = String((rule && rule.cadence) || 'daily').toLowerCase();
    var occ = it.occurs | 0;
    var annualEvent = null;
    var slice = 0;
    if (occ <= 0) {
      // not on the grid this month — no day attribution (yearly off-trip, empty paint)
      // month ledger still holds monthBill once (sheet SoT)
      slice = 0;
    } else if (cad === 'yearly') {
      // trip day: one monthly unit; annual intent is informational only
      slice = bill;
      annualEvent = bill * 12;
    } else if (cad === 'always') {
      slice = bill / Math.max(nDaysMonth, 1);
    } else {
      // daily / weekly / painted N days / every_n: split the single monthly bill across scheduled days
      slice = bill / occ;
    }
    return { slice: slice, monthBill: bill, annualEvent: annualEvent, moneyLaw: 'monthly_once' };
  }

  function buildMonth(opts) {
    opts = opts || {};
    var profile = ensureProfile(opts.profile || opts.calendar);
    var yearIndex = opts.yearIndex | 0;
    var monthIndex = opts.monthIndex | 0;
    var startYear = opts.startYear != null ? opts.startYear : profile.startYear;
    var civilYear = startYear + yearIndex;
    var nDays = daysInMonth(civilYear, monthIndex);
    // real first-of-month weekday (was defaulting to 0 → wrong weekly/work counts)
    var firstDow = opts.firstDow;
    if (firstDow == null || !isFinite(Number(firstDow))) {
      try {
        firstDow = new Date(civilYear, monthIndex, 1).getDay();
      } catch (_e) {
        firstDow = 0;
      }
    } else {
      firstDow = firstDow | 0;
    }
    var income = resolveIncome(opts, profile);
    var work = Object.assign({}, profile.work || {}, { monthlyIncome: income.net });
    var items = mergeCustomActions((opts.items || []).map(function (it) { return Object.assign({ polarity: 'spend' }, it); }), profile);

    // annotate items with rules + occurrence counts + monthly-once bill
    items.forEach(function (it) {
      var rule = it._customRule ? it._customRule : patch[REDACTED-MERCHANT]Work(ruleForItem(it, profile));
      it.rule = rule;
      if (!it.polarity) it.polarity = 'spend';
      it.occurs = countOccurrencesInMonth(rule, yearIndex, monthIndex, startYear, firstDow);
      // yearly flight: still save monthly, but action only on flight day
      if (String(rule.cadence).toLowerCase() === 'yearly') {
        it.saveMonthly = true;
      }
      it.monthBill = monthBillForItem(it);
      it.moneyLaw = 'monthly_once';
    });

    var days = [];
    var d, h;
    for (d = 0; d < nDays; d++) {
      var dow = (d + firstDow) % 7;
      var abs = absoluteDayIndex(yearIndex, monthIndex, d, startYear);
      var ctx = {
        dow: dow,
        day: d + 1,
        monthIndex: monthIndex,
        yearIndex: yearIndex,
        absoluteDay: abs,
        nDaysMonth: nDays
      };
      var hours = [];
      for (h = 0; h < 24; h++) {
        hours.push({
          hour: h,
          label: hourLabel(h),
          actions: [],
          cost: 0,
          itemCount: 0,
          isWork: isWorkDay(dow, work) && isWorkHour(h, work),
          alwaysOn: [],
          // names of all-day items concurrent with this hour (no extra $)
          allDayAlongside: []
        });
      }
      // Google-style all-day band: multiple all-day items + timed hours coexist
      var allDayActions = [];

      // work block = gain action (INCOME.net split across work days)
      if (isWorkDay(dow, work) && work.enabled !== false) {
        var wh0 = Number(work.startHour) || 15;
        var wh1 = Number(work.endHour) || 23;
        var wHour = hours[wh0];
        if (wHour) {
          var workDaysMo = countWorkDaysInMonth(nDays, firstDow, work);
          var dayPay = workDaysMo > 0 ? income.net / workDaysMo : 0;
          var span = Math.max(1, wh1 - wh0);
          wHour.actions.push({
            id: 'work_d' + d,
            actionId: 'work',
            name: work.label || 'Work',
            kind: 'work',
            polarity: 'gain',
            cost: dayPay, // amount (gain)
            amount: dayPay,
            monthAmount: income.net,
            items: dayPay > 0 ? [{
              id: 'work_income',
              name: income.label || 'Work income (NET)',
              cost: dayPay,
              monthCost: income.net,
              polarity: 'gain',
              section: 'INCOME',
              note: 'NET monthly ÷ ' + workDaysMo + ' work days'
            }] : [],
            hour: wh0,
            spanHours: span,
            note: (work.timezone || 'CST') + ' ' + wh0 + ':00–' + wh1 + ':00 · ' + (income.net ? ('NET ' + income.net.toFixed(2) + '/mo') : 'set INCOME')
          });
          wHour.gain = (wHour.gain || 0) + dayPay;
        }
      }

      // place each expense item that occurs today
      // Money: monthly once — day/hour $ are shares of monthBill, never $ × days/hours
      items.forEach(function (it) {
        var rule = it.rule;
        if (!occursOnDay(rule, ctx)) return;
        var hf = hoursFor(rule, ctx, work);
        var ps = placementSlice(it, rule, nDays);
        var slice = ps.slice;
        var annualEvent = ps.annualEvent;
        var actId = 'act_' + String(it.name).replace(/\W+/g, '_').slice(0, 28);
        var pol = it.polarity === 'gain' ? 'gain' : (it.polarity === 'neutral' || it.scheduleOnly ? 'neutral' : 'spend');

        // —— All-day band: one placement per day, concurrent with every hour + other all-day ——
        if (hf.allDay) {
          var dayItemAd = {
            id: it.id,
            name: it.name,
            cost: slice, // full day share once (not × 24)
            monthCost: it.cost,
            monthBill: ps.monthBill,
            moneyLaw: 'monthly_once',
            isAttribution: true,
            occursMonth: it.occurs,
            section: it.section,
            isDebtPay: it.isDebtPay,
            polarity: pol,
            cadence: rule.cadence,
            ruleId: rule.id,
            note: rule.note || '',
            allDay: true,
            alwaysOn: !!hf.alwaysOn,
            annualEvent: annualEvent,
            scheduleOnly: !!it.scheduleOnly
          };
          var actAd = {
            id: actId + '_d' + d + '_allday',
            actionId: actId,
            name: it.name,
            kind: hf.alwaysOn ? 'always' : (it.isDebtPay ? 'debt' : (it.isCustom ? 'custom' : 'living')),
            polarity: pol,
            cost: slice,
            amount: slice,
            monthCost: it.cost,
            monthBill: ps.monthBill,
            moneyLaw: 'monthly_once',
            items: [dayItemAd],
            hour: null,
            allDay: true,
            spanHours: 24,
            cadence: rule.cadence,
            note: (rule.note || '') || (hf.alwaysOn ? 'all day · every day' : 'all day'),
            alwaysOn: !!hf.alwaysOn,
            scheduleOnly: !!it.scheduleOnly
          };
          allDayActions.push(actAd);
          // mark every hour so timed drills show "alongside all-day"
          hours.forEach(function (hh) {
            hh.allDayAlongside.push(it.name);
            if (hf.alwaysOn) hh.alwaysOn.push(it.name);
          });
          return; // do not also place into hour buckets
        }

        var placeHours = hf.hours && hf.hours.length ? hf.hours : [10];
        var perHour = slice / placeHours.length;

        placeHours.forEach(function (hr) {
          hr = clamp(hr, 0, 23);
          var dayItem = {
            id: it.id,
            name: it.name,
            // attribution share (sum over month = monthBill once)
            cost: perHour,
            monthCost: it.cost,
            monthBill: ps.monthBill,
            moneyLaw: 'monthly_once',
            // true $ is monthly; this slot is schedule + share
            isAttribution: true,
            occursMonth: it.occurs,
            section: it.section,
            isDebtPay: it.isDebtPay,
            polarity: pol,
            cadence: rule.cadence,
            ruleId: rule.id,
            note: rule.note || '',
            alwaysOn: false,
            allDay: false,
            annualEvent: annualEvent,
            scheduleOnly: !!it.scheduleOnly
          };
          var hourBucket = hours[hr];
          // find or create action for this item name (item is also the action leaf-container for single-item)
          var act = null;
          for (var ai = 0; ai < hourBucket.actions.length; ai++) {
            if (hourBucket.actions[ai].actionId === actId) { act = hourBucket.actions[ai]; break; }
          }
          if (!act) {
            act = {
              id: actId + '_d' + d + '_h' + hr,
              actionId: actId,
              name: it.name,
              kind: it.isDebtPay ? 'debt' : (it.isCustom ? 'custom' : 'living'),
              polarity: dayItem.polarity,
              cost: 0,
              monthCost: it.cost,
              monthBill: ps.monthBill,
              moneyLaw: 'monthly_once',
              items: [],
              hour: hr,
              allDay: false,
              cadence: rule.cadence,
              note: rule.note || '',
              alwaysOn: false,
              scheduleOnly: !!it.scheduleOnly
            };
            hourBucket.actions.push(act);
          }
          act.items.push(dayItem);
          act.cost += dayItem.cost;
          if (act.polarity === 'gain') {
            hourBucket.gain = (hourBucket.gain || 0) + dayItem.cost;
          } else if (act.polarity === 'neutral' || it.scheduleOnly) {
            // schedule-only: presence only, no money
          } else {
            hourBucket.cost += dayItem.cost;
            hourBucket.spend = (hourBucket.spend || 0) + dayItem.cost;
          }
          hourBucket.itemCount += 1;
        });
      });

      var daySpend = 0, dayGain = 0;
      // all-day money once per day (not per hour)
      allDayActions.forEach(function (ad) {
        if (ad.polarity === 'gain') dayGain += Number(ad.cost) || 0;
        else if (ad.polarity !== 'neutral' && !ad.scheduleOnly) daySpend += Number(ad.cost) || 0;
      });
      hours.forEach(function (hh) {
        daySpend += Number(hh.spend != null ? hh.spend : hh.cost) || 0;
        dayGain += Number(hh.gain) || 0;
        // cost field = net for display convenience (gain - spend)
        hh.net = (Number(hh.gain) || 0) - (Number(hh.spend != null ? hh.spend : hh.cost) || 0);
        // expose concurrent all-day on hour node for drill UI
        hh.allDayActions = allDayActions;
      });
      days.push({
        day: d + 1,
        dayIndex: d,
        dow: dow,
        dowName: DAY_NAMES[dow],
        isWeekend: dow === 0 || dow === 6,
        isWorkDay: isWorkDay(dow, work),
        hours: hours,
        allDayActions: allDayActions,
        allDayCount: allDayActions.length,
        spend: daySpend,
        gain: dayGain,
        cost: daySpend, // legacy: spend
        net: dayGain - daySpend,
        actionCount:
          allDayActions.length +
          hours.reduce(function (n, hh) { return n + hh.actions.length; }, 0),
        itemCount:
          allDayActions.reduce(function (n, a) { return n + ((a.items && a.items.length) || 1); }, 0) +
          hours.reduce(function (n, hh) { return n + hh.itemCount; }, 0)
      });
    }

    var weeks = [];
    for (var w = 0; w < nDays; w += 7) {
      var slice = days.slice(w, w + 7);
      var wSpend = 0, wGain = 0;
      slice.forEach(function (dd) { wSpend += dd.spend || dd.cost || 0; wGain += dd.gain || 0; });
      weeks.push({
        weekIndex: weeks.length,
        week: weeks.length + 1,
        days: slice,
        spend: wSpend,
        gain: wGain,
        cost: wSpend,
        net: wGain - wSpend,
        dayCount: slice.length
      });
    }

    // Month ledger: each item's monthly bill at most once (not × days)
    var monthSpend = 0, monthGainItems = 0;
    items.forEach(function (it) {
      var bill = it.monthBill != null ? it.monthBill : monthBillForItem(it);
      if (it.polarity === 'gain') monthGainItems += bill;
      else if (it.polarity !== 'neutral' && !it.scheduleOnly) monthSpend += bill;
    });
    var monthGain = income.net + monthGainItems;
    var scheduledSpend = days.reduce(function (s, dd) { return s + (dd.spend || 0); }, 0);
    var scheduledGain = days.reduce(function (s, dd) { return s + (dd.gain || 0); }, 0);
    var workAct = {
      id: 'work',
      name: work.label || 'Work',
      kind: 'work',
      polarity: 'gain',
      cost: income.net,
      amount: income.net,
      monthBill: income.net,
      moneyLaw: 'monthly_once',
      cadence: 'weekdays',
      note: (work.timezone || 'CST') + ' ' + (work.startHour || 15) + ':00–' + (work.endHour || 23) + ':00',
      items: [{ name: income.label || 'Work income (NET)', cost: income.net, polarity: 'gain', monthCost: income.net, monthBill: income.net, moneyLaw: 'monthly_once' }],
      occurs: countWorkDaysInMonth(nDays, firstDow, work)
    };

    return {
      yearIndex: yearIndex,
      monthIndex: monthIndex,
      absoluteMonth: yearIndex * 12 + monthIndex,
      civilYear: civilYear,
      name: MONTH_NAMES[monthIndex],
      label: MONTH_NAMES[monthIndex] + ' ' + civilYear,
      daysInMonth: nDays,
      firstDow: firstDow,
      moneyLaw: 'monthly_once',
      // billed once per item this month (sheet SoT)
      spend: monthSpend,
      gain: monthGain,
      cost: monthSpend,
      net: monthGain - monthSpend,
      income: income,
      // day attributions should ≈ monthSpend (float-safe)
      scheduledSpend: scheduledSpend,
      scheduledGain: scheduledGain,
      scheduledCost: scheduledSpend,
      moneyCheck: {
        monthSpend: monthSpend,
        scheduledSpend: scheduledSpend,
        // day shares ≤ monthly-once total (yearly off-month / empty paint can be lower)
        attributionOk: scheduledSpend <= monthSpend + 0.02
      },
      items: items,
      actions: [workAct].concat(items.map(function (it) {
        var bill = it.monthBill != null ? it.monthBill : monthBillForItem(it);
        var ad = isAllDayRule(it.rule);
        return {
          id: 'act_' + String(it.name).replace(/\W+/g, '_').slice(0, 28),
          name: it.name,
          kind: it.rule && String(it.rule.cadence) === 'always' ? 'always' : (it.isDebtPay ? 'debt' : (it.isCustom ? 'custom' : 'living')),
          polarity: it.polarity === 'gain' ? 'gain' : (it.scheduleOnly || it.polarity === 'neutral' ? 'neutral' : 'spend'),
          // UI: show monthly once — not $ × occurs
          cost: bill,
          monthCost: it.cost,
          monthBill: bill,
          moneyLaw: 'monthly_once',
          cadence: it.rule && it.rule.cadence,
          note: it.rule && it.rule.note,
          allDay: ad,
          items: [it],
          occurs: it.occurs,
          scheduleOnly: !!it.scheduleOnly
        };
      })),
      weeks: weeks,
      days: days,
      profile: {
        timezone: profile.timezone,
        work: work,
        label: profile.label
      }
    };
  }

  function buildHorizon(opts) {
    opts = opts || {};
    var profile = ensureProfile(opts.profile || opts.calendar);
    if (opts.customActions) profile.customActions = opts.customActions;
    if (opts.income) profile.income = opts.income;
    var moneyWorld = resolveMoneyWorld(opts, profile);
    var income = moneyWorld.income;
    var yearsN = Math.max(1, Number(opts.years) || 13);
    var startYear = opts.startYear != null ? opts.startYear : profile.startYear;
    var items = mergeCustomActions(opts.items || collectItems(opts.expenses, opts.lineAmt), profile);
    // bind rules for summary
    items = items.map(function (it) {
      var row = Object.assign({}, it);
      row.rule = patch[REDACTED-MERCHANT]Work(ruleForItem(row, profile));
      return row;
    });
    var years = [];
    var y, m;
    // Catalog spend (all expense lines) — diagnostic only
    var catalogSpend = 0, catalogGainExtra = 0;
    items.forEach(function (it) {
      if (it.polarity === 'gain') catalogGainExtra += Number(it.cost) || 0;
      else catalogSpend += Number(it.cost) || 0;
    });
    // SUMMARY-aligned money (preferred)
    var monthlyGain = moneyWorld.monthlyGain != null ? moneyWorld.monthlyGain : (income.net + catalogGainExtra);
    var monthlySpend = moneyWorld.monthlySpend != null ? moneyWorld.monthlySpend : (catalogSpend + moneyWorld.customSpend);
    var monthlyNet = moneyWorld.monthlyNet != null ? moneyWorld.monthlyNet : (monthlyGain - monthlySpend);
    // If world provided surplus, trust it for year/month cards
    if (moneyWorld.surplus != null) {
      monthlyNet = moneyWorld.surplus + moneyWorld.customGain - moneyWorld.customSpend;
      monthlyGain = income.net + moneyWorld.customGain;
      monthlySpend = monthlyGain - monthlyNet; // identity: net = gain - spend
    }
    for (y = 0; y < yearsN; y++) {
      var monthsMeta = [];
      for (m = 0; m < 12; m++) {
        monthsMeta.push({
          yearIndex: y,
          monthIndex: m,
          absoluteMonth: y * 12 + m,
          civilYear: startYear + y,
          name: MONTH_NAMES[m],
          label: MONTH_NAMES[m] + ' ' + (startYear + y),
          daysInMonth: daysInMonth(startYear + y, m),
          spend: monthlySpend,
          gain: monthlyGain,
          cost: monthlySpend,
          net: monthlyNet,
          itemCount: items.length,
          actionCount: items.length + 1
        });
      }
      years.push({
        yearIndex: y,
        civilYear: startYear + y,
        label: String(startYear + y),
        months: monthsMeta,
        spend: monthlySpend * 12,
        gain: monthlyGain * 12,
        cost: monthlySpend * 12,
        net: monthlyNet * 12,
        monthCount: 12
      });
    }
    return {
      law: 'Year→Month→Week→Day→Hour→Action→Item · editable cadences · work CST',
      author: 'living-core',
      startYear: startYear,
      yearsN: yearsN,
      monthsTotal: yearsN * 12,
      items: items,
      income: income,
      actions: [{ name: (profile.work && profile.work.label) || 'Work', polarity: 'gain', cost: income.net, kind: 'work' }].concat(items.map(function (it) {
        return {
          name: it.name,
          cost: it.cost,
          polarity: it.polarity === 'gain' ? 'gain' : 'spend',
          cadence: it.rule && it.rule.cadence,
          note: it.rule && it.rule.note
        };
      })),
      monthlySpend: monthlySpend,
      monthlyGain: monthlyGain,
      monthlyNet: monthlyNet,
      monthlyCost: monthlySpend,
      catalogSpend: catalogSpend,
      surplus: moneyWorld.surplus,
      moneyWorld: moneyWorld,
      years: years,
      profile: profile,
      CALENDAR_VIEW: 'live',
      editable: true
    };
  }

  function expandMonth(horizon, yearIndex, monthIndex) {
    var startYear = horizon.startYear;
    var civilYear = startYear + (yearIndex | 0);
    var firstDow = 0;
    try {
      firstDow = new Date(civilYear, monthIndex | 0, 1).getDay();
    } catch (_e) { /* */ }
    return buildMonth({
      yearIndex: yearIndex,
      monthIndex: monthIndex,
      startYear: startYear,
      firstDow: firstDow,
      items: horizon.items,
      profile: horizon.profile,
      income: horizon.income,
      customActions: horizon.profile && horizon.profile.customActions,
      absoluteMonth: yearIndex * 12 + monthIndex
    });
  }

  function resolvePath(horizon, path) {
    path = path || {};
    var y = path.year != null ? path.year : null;
    var m = path.month != null ? path.month : null;
    var level = 'years';
    var node = horizon;
    var trail = [{ level: 'years', label: 'Years (' + horizon.yearsN + ')' }];

    if (y == null) return { level: level, node: node, trail: trail, monthFull: null };

    var year = horizon.years[y];
    if (!year) return { level: 'years', node: horizon, trail: trail, monthFull: null };
    trail.push({ level: 'year', label: year.label, year: y });
    level = 'year';
    node = year;

    if (m == null) return { level: level, node: node, trail: trail, monthFull: null };

    var monthFull = expandMonth(horizon, y, m);
    trail.push({ level: 'month', label: monthFull.label, year: y, month: m });
    level = 'month';
    node = monthFull;

    if (path.week == null) return { level: level, node: node, trail: trail, monthFull: monthFull };

    var week = monthFull.weeks[path.week];
    if (!week) return { level: level, node: node, trail: trail, monthFull: monthFull };
    trail.push({ level: 'week', label: 'Week ' + week.week, year: y, month: m, week: path.week });
    level = 'week';
    node = week;

    if (path.day == null) return { level: level, node: node, trail: trail, monthFull: monthFull };

    var day = week.days.filter(function (dd) { return dd.dayIndex === path.day; })[0]
      || monthFull.days[path.day];
    if (!day) return { level: level, node: node, trail: trail, monthFull: monthFull };
    trail.push({
      level: 'day',
      label: day.dowName + ' ' + monthFull.name + ' ' + day.day,
      year: y, month: m, week: path.week, day: path.day
    });
    level = 'day';
    node = day;

    // All-day action drill (no hour) — concurrent with timed hours
    if (path.actionId != null && (path.hour == null || path.allDay)) {
      var actDay = (day.allDayActions || []).filter(function (a) {
        return a && (a.id === path.actionId || a.actionId === path.actionId);
      })[0];
      if (actDay) {
        trail.push({
          level: 'action',
          label: actDay.name + ' · all day',
          year: y, month: m, week: path.week, day: path.day, hour: null, actionId: actDay.id, allDay: true
        });
        return { level: 'action', node: actDay, trail: trail, monthFull: monthFull };
      }
      if (path.allDay || path.hour == null) {
        return { level: level, node: node, trail: trail, monthFull: monthFull };
      }
    }

    if (path.hour == null) return { level: level, node: node, trail: trail, monthFull: monthFull };

    var hour = day.hours[path.hour];
    if (!hour) return { level: level, node: node, trail: trail, monthFull: monthFull };
    trail.push({
      level: 'hour',
      label: hour.label + (hour.isWork ? ' · WORK' : ''),
      year: y, month: m, week: path.week, day: path.day, hour: path.hour
    });
    level = 'hour';
    // attach all-day context for UI
    node = Object.assign({}, hour, {
      allDayActions: day.allDayActions || hour.allDayActions || [],
      allDayAlongside: hour.allDayAlongside || []
    });

    if (path.actionId == null) return { level: level, node: node, trail: trail, monthFull: monthFull };

    var act = (hour.actions || []).filter(function (a) {
      return a.id === path.actionId || a.actionId === path.actionId;
    })[0];
    // allow drilling all-day from hour view (alongside)
    if (!act) {
      act = (day.allDayActions || []).filter(function (a) {
        return a && (a.id === path.actionId || a.actionId === path.actionId);
      })[0];
    }
    if (!act) return { level: level, node: node, trail: trail, monthFull: monthFull };
    trail.push({
      level: 'action',
      label: act.name + (act.allDay ? ' · all day' : ''),
      year: y, month: m, week: path.week, day: path.day, hour: path.hour, actionId: act.id, allDay: !!act.allDay
    });
    level = 'action';
    node = act;
    return { level: level, node: node, trail: trail, monthFull: monthFull };
  }

  /** Upsert per-item override on a profile (mutable). */
  function setItemOverride(profile, itemName, partial) {
    profile = ensureProfile(profile);
    profile.itemOverrides = profile.itemOverrides || {};
    var prev = profile.itemOverrides[itemName] || {};
    profile.itemOverrides[itemName] = Object.assign({}, prev, partial || {});
    return profile;
  }

  function setWork(profile, workPartial) {
    profile = ensureProfile(profile);
    profile.work = Object.assign({}, profile.work, workPartial || {});
    return profile;
  }

  var CADENCES = [
    { id: 'always', label: '24/7 always on' },
    { id: 'daily', label: 'Every day' },
    { id: 'weekdays', label: 'Weekdays only' },
    { id: 'weekly', label: 'Some days / week' },
    { id: 'every_n_days', label: 'Every N days' },
    { id: 'monthly', label: 'Once a month' },
    { id: 'yearly', label: 'Once a year' },
    { id: 'selected', label: 'Painted days (visual)' }
  ];

  var api = {
    MONTH_NAMES: MONTH_NAMES,
    DAY_NAMES: DAY_NAMES,
    CADENCES: CADENCES,
    daysInMonth: daysInMonth,
    defaultProfile: defaultProfile,
    ensureProfile: ensureProfile,
    ruleForItem: ruleForItem,
    occursOnDay: occursOnDay,
    absoluteDayIndex: absoluteDayIndex,
    selectedOccurs: selectedOccurs,
    dayKey: dayKey,
    parseDayKey: parseDayKey,
    compareDayKeys: compareDayKeys,
    keysInRange: keysInRange,
    buildYearGrid: buildYearGrid,
    dayOccupancy: dayOccupancy,
    toggleKeyInSet: toggleKeyInSet,
    selectionToRule: selectionToRule,
    ruleToSelectionMap: ruleToSelectionMap,
    collectItems: collectItems,
    buildMonth: buildMonth,
    buildHorizon: buildHorizon,
    expandMonth: expandMonth,
    resolvePath: resolvePath,
    setItemOverride: setItemOverride,
    setWork: setWork,
    upsertCustomAction: upsertCustomAction,
    removeCustomAction: removeCustomAction,
    rePlaceActionHours: rePlaceActionHours,
    isScheduleOnly: isScheduleOnly,
    resolveIncome: resolveIncome,
    resolveMoneyWorld: resolveMoneyWorld,
    mergeCustomActions: mergeCustomActions,
    hourLabel: hourLabel,
    isWorkHour: isWorkHour,
    isWorkDay: isWorkDay,
    monthBillForItem: monthBillForItem,
    placementSlice: placementSlice,
    isAllDayRule: isAllDayRule,
    isAllDayToken: isAllDayToken,
    parseHoursField: parseHoursField,
    isAggregateExpenseName: isAggregateExpenseName,
    CALENDAR_VIEW: 'live',
    MONEY_LAW: 'monthly_once'
  };

  global.RankingCalendar = api;
  if (typeof module !== 'undefined' && module.exports) {
    if (!module.exports.JBlueprint) module.exports = api;
    else module.exports.RankingCalendar = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
