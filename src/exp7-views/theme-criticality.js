/* Exp7 light theme + plan-risk criticality colors (accepted Exp7 defaults). */
window.EXP7_LIGHT_THEME = Object.freeze({
  surface: '#ffffff', subtle: '#f4f6fa', text: '#1c2333', muted: '#49556a',
  accent: '#75510f', border: '#8a96aa', selection: '#2458a6', anchor: '#6841a6',
  critical: '#fff0e7', moderate: '#fff6dc', low: '#e8f5ef',
  criticalText: '#8c3600', moderateText: '#6b4300', lowText: '#00664b',
  clear: [0, 0, 0, 0]
});
/* Plan-risk highlighting: ranking_ui easy228 cash-criticality SYSTEM colors (Okabe–Ito). */
window.RISK_TEXT = { C: '#8c3600', M: '#6b4300', L: '#00664b' };
window.RISK_COL = { C: ['#D55E00', 'CRITICAL', '#fff0e7'], M: ['#E69F00', 'MODERATE', '#fff6dc'], L: ['#009E73', 'LOW', '#e8f5ef'] };
window.RISK_HT = { hc: 20, hm: 50, near: 0.10, base: 100, income: 80 };
window.$ = window.$ || function (id) { return document.getElementById(id); };
window.esc = window.esc || function (s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c];
  });
};
window.x7 = window.x7 || function (t) {
  return String(t == null ? '' : t).replace(/\bexp6\b/gi, 'Exp7');
};
