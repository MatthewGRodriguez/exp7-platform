/**
 * spend_chat.js — Pi Chat for spending (living-core densest)
 * Offline conversational spend companion for ranking_ui.
 * Law: never invent sheet EXPENSES rows; chat logs + optional custom actions only.
 */
(function (global) {
  'use strict';

  var LOG_KEY = 'jworkbook_pi_chat_v1';
  var SPENDS_KEY = 'jworkbook_pi_spends_v1';

  function loadJson(key, fallback) {
    try {
      if (typeof localStorage === 'undefined') return fallback;
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_e) {
      return fallback;
    }
  }

  function saveJson(key, val) {
    try {
      if (typeof localStorage === 'undefined') return false;
      localStorage.setItem(key, JSON.stringify(val));
      return true;
    } catch (_e) {
      return false;
    }
  }

  function loadLog() {
    var L = loadJson(LOG_KEY, null);
    if (L && Array.isArray(L.messages)) return L;
    return {
      messages: [
        {
          role: 'pi',
          text:
            'Hi — I\'m **Pi**, your spend chat. Ask surplus · living · debt · or log `coffee 4.50` / `spend 12 snacks`. Sheet EXPENSES stay SoT; chat logs are optional custom spends.',
          at: new Date().toISOString()
        }
      ]
    };
  }

  function saveLog(log) {
    if (log.messages && log.messages.length > 80) {
      log.messages = log.messages.slice(-60);
    }
    return saveJson(LOG_KEY, log);
  }

  function loadSpends() {
    var s = loadJson(SPENDS_KEY, null);
    return s && Array.isArray(s.items) ? s : { items: [] };
  }

  function saveSpends(s) {
    if (s.items && s.items.length > 200) s.items = s.items.slice(-150);
    return saveJson(SPENDS_KEY, s);
  }

  function moneyN(n) {
    n = Number(n) || 0;
    var sign = n < 0 ? '−' : n > 0 ? '+' : '';
    return sign + '$' + Math.abs(n).toFixed(2);
  }

  /**
   * Parse user line → intent.
   * Examples:
   *   surplus | living | debt | net | help
   *   coffee 4.50 | spend 12 snacks | -5 uber
   *   gain 20 tip | +100
   *   pie | breakdown
   *   list | clear spends
   *   schedule focus 0  // $0 schedule note
   */
  function parse(line) {
    line = String(line || '').trim();
    if (!line) return { intent: 'empty' };
    var low = line.toLowerCase();

    if (/^(help|\?|hi|hello|hey)\b/.test(low)) return { intent: 'help' };
    if (/^(surplus|deficit|left|remaining)\b/.test(low)) return { intent: 'surplus' };
    if (/^(living|expenses|exp)\b/.test(low)) return { intent: 'living' };
    if (/^(debt|payments)\b/.test(low)) return { intent: 'debt' };
    if (/^(net|income|pay)\b/.test(low)) return { intent: 'net' };
    if (/^(summary|status|how am i|overview)\b/.test(low)) return { intent: 'summary' };
    if (/^(pie|breakdown|chart|cats|categories)\b/.test(low)) return { intent: 'pie' };
    if (/^(list|spends|history|log)\b/.test(low)) return { intent: 'list' };
    if (/^clear\s*(spends|log|chat)?\b/.test(low)) {
      if (/chat/.test(low)) return { intent: 'clear_chat' };
      return { intent: 'clear_spends' };
    }
    if (/^(undo|pop)\b/.test(low)) return { intent: 'undo' };

    // spend NAME AMT | spend AMT NAME | -AMT name | name AMT
    var m;
    m = low.match(/^spend\s+(\d+(?:\.\d+)?)\s+(.+)$/);
    if (m) return { intent: 'spend', amount: parseFloat(m[1]), name: m[2].trim() };
    m = low.match(/^spend\s+(.+?)\s+(\d+(?:\.\d+)?)$/);
    if (m) return { intent: 'spend', amount: parseFloat(m[2]), name: m[1].trim() };
    m = low.match(/^-\s*(\d+(?:\.\d+)?)\s+(.+)$/);
    if (m) return { intent: 'spend', amount: parseFloat(m[1]), name: m[2].trim() };
    m = low.match(/^gain\s+(\d+(?:\.\d+)?)\s*(.*)$/);
    if (m) return { intent: 'gain', amount: parseFloat(m[1]), name: (m[2] || 'gain').trim() || 'gain' };
    m = low.match(/^\+\s*(\d+(?:\.\d+)?)\s*(.*)$/);
    if (m) return { intent: 'gain', amount: parseFloat(m[1]), name: (m[2] || 'gain').trim() || 'gain' };
    // name amount  OR  amount name
    m = line.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s*$/);
    if (m && !/^(spend|gain|list|clear)/i.test(m[1])) {
      return { intent: 'spend', amount: parseFloat(m[2]), name: m[1].trim() };
    }
    m = line.match(/^(\d+(?:\.\d+)?)\s+(.+)$/);
    if (m) return { intent: 'spend', amount: parseFloat(m[1]), name: m[2].trim() };

    return { intent: 'unknown', raw: line };
  }

  function worldFromOpts(opts) {
    opts = opts || {};
    var money = opts.money || {};
    return {
      net: Number(money.net) || 0,
      living: Number(money.living) || 0,
      debtCash: Number(money.debtCash) || 0,
      surplus: money.surplus != null ? Number(money.surplus) : null,
      sections: (opts.sections || []).slice()
    };
  }

  function chatSpendTotal(spends) {
    var t = 0;
    (spends.items || []).forEach(function (it) {
      if (it.polarity === 'gain') t -= Math.abs(Number(it.amount) || 0);
      else t += Math.abs(Number(it.amount) || 0);
    });
    return t;
  }

  function reply(intent, opts) {
    opts = opts || {};
    var w = worldFromOpts(opts);
    var spends = opts.spends || loadSpends();
    var chatTotal = chatSpendTotal(spends);
    var sur =
      w.surplus != null && isFinite(w.surplus)
        ? w.surplus
        : w.net - w.living - w.debtCash;
    var adj = sur - chatTotal;

    switch (intent.intent) {
      case 'help':
        return {
          text:
            '**Pi commands**\n' +
            '· `surplus` · `living` · `debt` · `net` · `summary`\n' +
            '· `pie` — category breakdown\n' +
            '· `coffee 4.50` or `spend 12 snacks` or `-5 uber`\n' +
            '· `gain 20 tip`\n' +
            '· `list` · `undo` · `clear spends`\n' +
            'Sheet EXPENSES = SoT. Chat spends adjust **adjusted surplus** only until you promote them.'
        };
      case 'surplus':
        return {
          text:
            'SUMMARY surplus **' +
            moneyN(sur) +
            '**/mo' +
            (chatTotal
              ? '\nChat spends net **' +
                moneyN(-chatTotal) +
                '** → adjusted **' +
                moneyN(adj) +
                '**'
              : '')
        };
      case 'living':
        return { text: 'Living (EXPENSES) **' + moneyN(-w.living) + '**/mo' };
      case 'debt':
        return { text: 'Debt cash pays **' + moneyN(-w.debtCash) + '**/mo' };
      case 'net':
        return { text: 'Income net **' + moneyN(w.net) + '**/mo' };
      case 'summary':
        return {
          text:
            '**Money map**\n' +
            'net ' +
            moneyN(w.net) +
            ' · living ' +
            moneyN(-w.living) +
            ' · debt ' +
            moneyN(-w.debtCash) +
            '\n→ surplus **' +
            moneyN(sur) +
            '**' +
            (chatTotal
              ? '\nchat Δ ' + moneyN(-chatTotal) + ' → adj **' + moneyN(adj) + '**'
              : '')
        };
      case 'pie':
        return { text: pieText(w.sections, spends), pie: pieSlices(w.sections, spends) };
      case 'list': {
        var items = spends.items || [];
        if (!items.length) return { text: 'No chat spends yet. Try `coffee 4.50`.' };
        var lines = items
          .slice(-12)
          .map(function (it, i) {
            var pol = it.polarity === 'gain' ? '+' : '−';
            return (
              (i + 1) +
              '. ' +
              pol +
              '$' +
              Math.abs(Number(it.amount) || 0).toFixed(2) +
              ' ' +
              it.name
            );
          });
        return {
          text:
            '**Chat spends** (last ' +
            lines.length +
            ')\n' +
            lines.join('\n') +
            '\nnet chat **' +
            moneyN(-chatTotal) +
            '**'
        };
      }
      case 'clear_spends':
        spends.items = [];
        saveSpends(spends);
        return { text: 'Cleared chat spends.', spends: spends };
      case 'clear_chat': {
        var log = {
          messages: [
            {
              role: 'pi',
              text: 'Chat cleared. Surplus still from SUMMARY.',
              at: new Date().toISOString()
            }
          ]
        };
        saveLog(log);
        return { text: 'Chat history cleared.', log: log };
      }
      case 'undo': {
        var pop = (spends.items || []).pop();
        saveSpends(spends);
        if (!pop) return { text: 'Nothing to undo.', spends: spends };
        return {
          text:
            'Undid ' +
            (pop.polarity === 'gain' ? '+' : '−') +
            '$' +
            Math.abs(pop.amount).toFixed(2) +
            ' ' +
            pop.name,
          spends: spends
        };
      }
      case 'spend':
      case 'gain': {
        var amt = Math.abs(Number(intent.amount) || 0);
        if (!(amt > 0)) return { text: 'Need an amount > 0.' };
        var name = String(intent.name || 'item').slice(0, 48);
        var row = {
          id: 'pi_' + Date.now().toString(36),
          name: name,
          amount: amt,
          polarity: intent.intent === 'gain' ? 'gain' : 'spend',
          at: new Date().toISOString(),
          source: 'pi_chat'
        };
        spends.items = spends.items || [];
        spends.items.push(row);
        saveSpends(spends);
        var nt = chatSpendTotal(spends);
        var adj2 = sur - nt;
        return {
          text:
            (row.polarity === 'gain' ? 'Logged gain ' : 'Logged spend ') +
            '**' +
            moneyN(row.polarity === 'gain' ? amt : -amt) +
            '** · ' +
            name +
            '\nadjusted surplus **' +
            moneyN(adj2) +
            '**/mo (sheet surplus ' +
            moneyN(sur) +
            ')',
          spends: spends,
          logged: row
        };
      }
      case 'empty':
        return { text: 'Say something — try `surplus` or `coffee 4.50`.' };
      default:
        return {
          text:
            'Didn\'t parse “' +
            (intent.raw || '') +
            '”. Try `help` · `surplus` · `coffee 4.50` · `pie`.'
        };
    }
  }

  function pieSlices(sections, spends) {
    var slices = [];
    (sections || []).forEach(function (sec) {
      var n = Number(sec.living != null ? sec.living : sec.total) || 0;
      if (n > 0.005) slices.push({ label: sec.name || 'Section', amount: n, kind: 'sheet' });
    });
    var chatSpend = 0;
    (spends && spends.items ? spends.items : []).forEach(function (it) {
      if (it.polarity === 'gain') return;
      chatSpend += Math.abs(Number(it.amount) || 0);
    });
    if (chatSpend > 0.005) slices.push({ label: 'Pi chat', amount: chatSpend, kind: 'chat' });
    slices.sort(function (a, b) {
      return b.amount - a.amount;
    });
    return slices.slice(0, 12);
  }

  function pieText(sections, spends) {
    var slices = pieSlices(sections, spends);
    if (!slices.length) return 'No spend slices yet — fill EXPENSES or log chat spends.';
    var total = slices.reduce(function (s, x) {
      return s + x.amount;
    }, 0) || 1;
    var lines = slices.map(function (x) {
      var pct = ((x.amount / total) * 100).toFixed(0);
      return '· ' + x.label + ' ' + moneyN(-x.amount) + ' (' + pct + '%)';
    });
    return '**Spend pie** (sheet living + chat)\n' + lines.join('\n') + '\nΣ ' + moneyN(-total);
  }

  /** SVG pie densest */
  function pieSvg(slices, size) {
    size = size || 160;
    slices = slices || [];
    var total = slices.reduce(function (s, x) {
      return s + x.amount;
    }, 0);
    if (!(total > 0)) {
      return (
        '<svg viewBox="0 0 ' +
        size +
        ' ' +
        size +
        '" width="' +
        size +
        '" height="' +
        size +
        '"><circle cx="' +
        size / 2 +
        '" cy="' +
        size / 2 +
        '" r="' +
        size * 0.4 +
        '" fill="#1a1a1a" stroke="#2a2a2a"/></svg>'
      );
    }
    var colors = [
      '#f7768e',
      '#bb9af7',
      '#7dcfff',
      '#e0af68',
      '#9ece6a',
      '#ff9e64',
      '#c0caf5',
      '#73daca',
      '#f7768e',
      '#bb9af7'
    ];
    var cx = size / 2,
      cy = size / 2,
      r = size * 0.42;
    var a0 = -Math.PI / 2;
    var parts = [];
    slices.forEach(function (sl, i) {
      var frac = sl.amount / total;
      var a1 = a0 + frac * Math.PI * 2;
      if (frac >= 0.999) {
        parts.push(
          '<circle cx="' +
            cx +
            '" cy="' +
            cy +
            '" r="' +
            r +
            '" fill="' +
            colors[i % colors.length] +
            '"/>'
        );
      } else {
        var x0 = cx + r * Math.cos(a0),
          y0 = cy + r * Math.sin(a0);
        var x1 = cx + r * Math.cos(a1),
          y1 = cy + r * Math.sin(a1);
        var large = frac > 0.5 ? 1 : 0;
        parts.push(
          '<path d="M' +
            cx +
            ',' +
            cy +
            ' L' +
            x0 +
            ',' +
            y0 +
            ' A' +
            r +
            ',' +
            r +
            ' 0 ' +
            large +
            ' 1 ' +
            x1 +
            ',' +
            y1 +
            ' Z" fill="' +
            colors[i % colors.length] +
            '"/>'
        );
      }
      a0 = a1;
    });
    // hole
    parts.push(
      '<circle cx="' +
        cx +
        '" cy="' +
        cy +
        '" r="' +
        r * 0.45 +
        '" fill="#0a0a0a"/>'
    );
    return (
      '<svg class="pi-pie" viewBox="0 0 ' +
      size +
      ' ' +
      size +
      '" width="' +
      size +
      '" height="' +
      size +
      '">' +
      parts.join('') +
      '</svg>'
    );
  }

  function handle(userText, opts) {
    opts = opts || {};
    var log = opts.log || loadLog();
    var spends = opts.spends || loadSpends();
    var intent = parse(userText);
    log.messages = log.messages || [];
    log.messages.push({
      role: 'user',
      text: String(userText || ''),
      at: new Date().toISOString()
    });
    var out = reply(intent, Object.assign({}, opts, { spends: spends }));
    if (out.spends) spends = out.spends;
    if (out.log) log = out.log;
    else {
      log.messages.push({
        role: 'pi',
        text: out.text,
        at: new Date().toISOString(),
        pie: out.pie || null
      });
    }
    saveLog(log);
    if (out.spends) saveSpends(spends);
    return {
      ok: true,
      intent: intent,
      reply: out,
      log: log,
      spends: spends,
      pie: out.pie || pieSlices(opts.sections, spends)
    };
  }

  function appendPi(text, opts) {
    var log = loadLog();
    log.messages.push({
      role: 'pi',
      text: text,
      at: new Date().toISOString()
    });
    saveLog(log);
    return log;
  }

  global.PiSpendChat = {
    parse: parse,
    handle: handle,
    loadLog: loadLog,
    saveLog: saveLog,
    loadSpends: loadSpends,
    saveSpends: saveSpends,
    pieSlices: pieSlices,
    pieSvg: pieSvg,
    pieText: pieText,
    chatSpendTotal: chatSpendTotal,
    reply: reply,
    moneyN: moneyN,
    appendPi: appendPi,
    LOG_KEY: LOG_KEY,
    SPENDS_KEY: SPENDS_KEY
  };

  if (typeof module !== 'undefined' && module.exports && !module.exports.JBlueprint) {
    module.exports = global.PiSpendChat;
  }
})(typeof window !== 'undefined' ? window : globalThis);
