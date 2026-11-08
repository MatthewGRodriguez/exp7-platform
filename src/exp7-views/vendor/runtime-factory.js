/* JEditor atlas/runtime.js (as emitted by atlas/build_atlas.js build()), wrapped as a per-view factory */
window.JA_RUNTIME_FACTORY=function(window,document,setTimeout,setInterval,Worker){
/* JEditor atlas page runtime (M17, ADRs 0080-0084): renders root components from the embedded atlas, routes user events to
 * blueprints, runs passes (Blob-URL worker when allowed, else main thread), ticks the clock joy. No network. */
(function () {
  'use strict';
  var M = window.JAtlasModel, E = window.JAtlasEval, W = JSON.parse(document.getElementById('ja-atlas').textContent);
  var pending = [], st = { dirty: "all", events: [], changed: [] }, queued = [], busy = false, scheduled = false, worker = null, backend = 'main';
  /* ADR 0086: the embedded Exp6 engine ranks alternatives (JGroup.Best / SimulatedBest); jf_engine keeps webgpu>wasm-simd>wasm>js for numeric scoring */
  var X = (typeof JGroup !== 'undefined' && typeof JAction !== 'undefined' && typeof Joy !== 'undefined') ? { JGroup: JGroup, JAction: JAction, Joy: Joy } : null;
  var JAtlas = window.JAtlas = window.JW = { /* window.JW + .world: legacy aliases for one release (ADR 0107) */ engine: X ? 'exp6' : 'none', chain: (window.JFEngine && JFEngine.CHAIN) || ['webgpu', 'wasm-simd', 'wasm', 'js'], atlas: W, world: W, passes: 0, last: null, conflicts: [], cycles: [], backend: backend, log: [] };
  try { var src = document.getElementById('ja-eval').textContent + '\nself.onmessage=function(e){var d=e.data;self.postMessage({id:d.id,c:JAtlasEval.computePass(d.snap,d.dirty,d.events,d.changed)});};';
    worker = new Worker(URL.createObjectURL(new Blob([src], { type: 'text/javascript' }))); backend = 'worker'; worker.onerror = function () { worker = null; backend = 'main'; JAtlas.backend = 'main'; busy = false; schedule(); };
  } catch (e) { worker = null; backend = 'main'; }
  JAtlas.backend = backend;
  try { if (window.JFEngine) { JFEngine.init({}); JFEngine.detect().then(function (d) { JAtlas.scoreBackends = d; JAtlas.scoreBackend = JFEngine.CHAIN.filter(function (k) { return d[k]; })[0] || 'js'; }, function () { JAtlas.scoreBackend = 'js'; }); } } catch (e) { JAtlas.scoreBackend = 'js'; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function schedule() { if (scheduled || busy) return; scheduled = true; setTimeout(run, 0); }
  function finish(comp) { var s = st; st = { dirty: [], events: [], changed: [] };
    var r = E.pass(W, s, M, comp, X); JAtlas.passes++; JAtlas.last = r; JAtlas.conflicts = r.conflicts; JAtlas.cycles = r.cycles; JAtlas.log.push({ pass: JAtlas.passes, ran: r.ran, changed: r.changed, backend: JAtlas.backend }); if (JAtlas.log.length > 50) JAtlas.log.shift();
    busy = false; render();
    var next = r.next.slice(); if (queued.length) { var q = queued; queued = []; q.forEach(function (x) { next = next.concat(x.dirty); st.events = st.events.concat(x.events); }); }
    if (pending.length) { st.events = pending.concat(st.events); pending = []; next = next.concat(E.dirtyFor(W, [], true)); }
    if (next.length) { st.dirty = next.filter(function (v, i, a) { return a.indexOf(v) === i; }); st.changed = r.changed; schedule(); } }
  function run() { scheduled = false; if (busy) return; if (st.dirty !== "all" && !st.dirty.length) return; busy = true;
    /* one user event per pass, so every click is its own blueprint run (events never merge) */ pending = pending.concat(st.events.slice(1)); st.events = st.events.slice(0, 1);
    if (worker) { var id = Math.random(); var to = setTimeout(function () { worker = null; JAtlas.backend = 'main'; finish(null); }, 4000);
      worker.onmessage = function (e) { if (e.data.id !== id) return; clearTimeout(to); finish(e.data.c); };
      try { worker.postMessage({ id: id, snap: E.clone(W), dirty: st.dirty, events: st.events, changed: st.changed }); } catch (err) { clearTimeout(to); worker = null; JAtlas.backend = 'main'; finish(null); } }
    else finish(null); }
  function external(changed, events) { var d = E.dirtyFor(W, changed, events && events.length);
    if (busy) { queued.push({ dirty: d, events: events || [] }); return; }
    st.dirty = st.dirty === 'all' ? 'all' : st.dirty.concat(d); st.events = st.events.concat(events || []); st.changed = changed; render(); schedule(); }
  JAtlas.event = function (type, comp, item, target) { external([], [{ type: type, comp: comp, item: item, target: target || null }]); };
  JAtlas.pickAlt = function (parent, member) { var it = W.items[parent]; if (!it) return; it.state = it.state || {}; it.state.userPick = it.state.userPick === member ? null : member;
    external(['item:' + parent], [{ type: 'select', comp: null, item: member }]); };
  JAtlas.tick = function () { var c = W.clock; if (!c || !W.joys[c.joy]) return; W.joys[c.joy].value = (+W.joys[c.joy].value || 0) + 1; external(['joy:' + c.joy], []); };
  if (W.clock && W.clock.on && W.joys[W.clock.joy]) setInterval(JAtlas.tick, Math.max(50, +W.clock.ms || 1000));
  /* ---- view ---- */
  function tok(c) { var t = ((c.view || {}).theme || {}).tokens || {}; return '--bg:' + (t.bg || '#ffffff') + ';--fg:' + (t.fg || '#1c2333') + ';--ac:' + (t.accent || '#75510f') + (t.edit ? ';--edit:' + t.edit : '') + (t.font ? ';font-family:' + t.font : ''); }
  function stateStyle(c, name) { var s = name && ((c.view || {}).states || {})[name]; if (!s) return { css: '', sm: 'idle', anim: '' };
    return { css: (s.bg ? 'background:' + s.bg + ';' : '') + (s.fg ? 'color:' + s.fg + ';' : '') + (s.border ? 'border-color:' + s.border + ';' : ''), sm: s.sm || 'idle', anim: s.anim && s.anim !== 'none' ? ' ja-a-' + s.anim : '' }; }
  function itemHtml(c, ref) { var p = M.parse(ref), it = M.get(W, ref); if (!it) return '<div class="ja-item ja-broken" data-broken="' + esc(ref) + '">broken reference ' + esc(ref) + '</div>';
    var S = stateStyle(c, ((c.state || {}).styles || {})[p.id]), show = ((c.view || {}).item || {}).show || [], vals = it.values || {};
    var keys = show.length ? show : Object.keys(vals), h = '<div class="ja-item' + S.anim + '" data-sm="' + S.sm + '" data-item="' + esc(p.id) + '" data-comp="' + esc(c.id) + '" data-style="' + esc(((c.state || {}).styles || {})[p.id] || '') + '" style="' + S.css + '">';
    h += '<b>' + esc(it.name) + '</b>' + keys.map(function (k) { return ' <span class="ja-v"><i>' + esc(k) + '</i> ' + esc(vals[k]) + '</span>'; }).join('');
    if (it.alts) { var A = it.alts, pick = (it.state || {})[A.method === 'sim' ? 'simPick' : 'pick'];
      h += '<div class="ja-alts">' + (A.members || []).map(function (m) { var mm = M.get(W, m), un = (A.unavail || []).indexOf(m) >= 0;
        return '<button class="ja-alt' + (m === pick ? ' on' : '') + '" data-alt-parent="' + esc(p.id) + '" data-alt="' + esc(m) + '"' + (un || !mm ? ' disabled' : '') + ' data-sm="' + (m === pick ? 'selected' : 'idle') + '">' + (A.pref === m ? '★ ' : '') + esc(mm ? mm.name : m + ' (broken)') + (un ? ' · unavail' : '') + '</button>'; }).join('') +
        '<span class="ja-why">' + esc((it.state || {}).pickWhy || '') + '</span></div>'; }
    var seq = E.sequence(W, p.id); if (it.jreq) h += '<div class="ja-seq">after ' + (seq.length ? seq.map(function (r) { var o = M.get(W, r); return esc(o ? o.name : r); }).join(' → ') : '(none)') + '</div>';
    return h + '</div>'; }
  function compHtml(ref, parent, depth, pos) { var c = M.get(W, ref); if (!c) return '<div class="ja-comp ja-broken" data-broken="' + esc(ref) + '">broken reference ' + esc(ref) + '</div>'; if (depth > 12) return '';
    var S = stateStyle(c, (c.state || {}).style), lay = (c.view || {}).layout || 'stack', P = (parent && ((c.state || {}).pos || {})[M.parse(parent).id]) || pos;
    var ps = P && (P.x || P.y || P.w) ? 'position:relative;left:' + (+P.x || 0) + 'px;top:' + (+P.y || 0) + 'px;' + (P.w ? 'width:' + P.w + 'px;' : '') : '';
    var items = (c.state && c.state.viewItems) || c.items || [];
    var h = '<section class="ja-comp ja-l-' + lay + S.anim + '" data-comp="' + esc(c.id) + '" data-sm="' + S.sm + '" data-style="' + esc((c.state || {}).style || '') + '" style="' + tok(c) + ';' + ps + S.css + '">' + ((c.view || {}).hideName ? '' : '<h2>' + esc(c.name) + '</h2>') + '<div class="ja-body">';
    var V = c.view || {};
    if ((V.jumps || []).length) h += '<div class="ja-jumps">' + V.jumps.map(function (j) { return '<button class="ja-jump" data-ja-act="jump" data-comp="' + esc(c.id) + '" data-v="' + esc(M.parse(j.comp).id) + '">' + esc(j.label) + '</button>'; }).join('') + '</div>';
    if (lay === 'table') h += tableHtml(c); else if (lay === 'kpi') h += kpiHtml(c); else if (lay === 'text') h += textHtml(c); else if (lay === 'calendar') h += calHtml(c); else if (lay === 'board') h += boardHtml(c); else if (lay === 'plan') h += planHtml(c); else if (lay === 'deps') h += depsHtml(c, items); else if (lay === 'section') h += sectionHtml(c);
    else h += items.map(function (r) { return itemHtml(c, r); }).join('');
    /* ADR 0091: a view switch shows one grouped sub-component at a time; ungrouped subs always show; each sub stays a normal component */
    var grp = V.switch ? (V.group || []).filter(function (g) { return M.get(W, g); }) : [], show = grp.indexOf((c.state || {}).show) >= 0 ? c.state.show : grp[0];
    if (grp.length) h += '<div class="ja-switch">' + grp.map(function (g) { var o = M.get(W, g); return '<button class="ja-sw' + (g === show ? ' on' : '') + '" data-ja-act="show" data-comp="' + esc(c.id) + '" data-v="' + esc(g) + '" data-sm="' + (g === show ? 'selected' : 'idle') + '">' + esc(swName(c, o)) + '</button>'; }).join('') + '</div>';
    h += (c.sub || []).filter(function (s) { return grp.indexOf(s.comp) < 0 || s.comp === show; }).map(function (s) { return compHtml(s.comp, ref, depth + 1, s.pos); }).join('');
    return h + '</div></section>'; }
  function swName(c, o) { var n = o.name || o.id; return n.indexOf(c.name + ' · ') === 0 ? n.slice(c.name.length + 3) : n; }
  /* ---- calendar / board / plan views (ADR 0091) ---- */
  function chip(c, ref, extra) { var p = M.parse(ref), it = M.get(W, ref); if (!it) return '<span class="ja-chip ja-broken">' + esc(ref) + '</span>';
    return '<span class="ja-item ja-chip" data-item="' + esc(p.id) + '" data-comp="' + esc(c.id) + '" data-sm="idle">' + esc(it.name) + (extra || '') + '</span>'; }
  /* ---- M19 (ADRs 0095-0097): month nav, joy steppers, as-of, range, day detail, legend, rails, day labels; all generic over atlas data ---- */
  function fmt(c, v) { if (typeof v !== 'number' || !isFinite(v)) return v == null ? '' : String(v); if ((c.view || {}).labelFmt === 'money') { var a = Math.abs(v).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','); return (v < 0 ? '−$' : '$') + a; } return String(Math.round(v * 100) / 100); }
  function asofOf(c) { var j = (c.view || {}).asof && M.get(W, c.view.asof), v = j && j.value; if (/^\d{4}-\d{2}-\d{2}$/.test(v || '')) return { day: v, joy: true }; var d = new Date(); return { day: d.getFullYear() + '-' + (d.getMonth() < 9 ? '0' : '') + (d.getMonth() + 1) + '-' + (d.getDate() < 10 ? '0' : '') + d.getDate(), joy: false }; }
  function openingOf(c) { var ctl = ((c.view || {}).controls || [])[0], j = ctl && M.get(W, ctl.joy); return j ? +j.value || 0 : 0; }
  function calHtml(c) { var V = c.view || {}, month = E.monthOf(c), days = E.monthDays(month), cs = c.state || {}, ds = cs.dayStyles || {}, lb = cs.dayLabels || {}, by = {}, cid = esc(c.id), A = asofOf(c), mode = cs.mode || '', rg = cs.range || [];
    (c.items || []).forEach(function (r) { E.occurrences(M.get(W, r), month).forEach(function (d) { (by[d] = by[d] || []).push(r); }); });
    var first = new Date(+month.slice(0, 4), +month.slice(5, 7) - 1, 1).getDay(), lo = rg[0], hi = rg[1] || rg[0];
    var h = '<div class="ja-calnav"><button data-ja-act="month" data-comp="' + cid + '" data-v="-1">‹</button><span class="ja-month" data-month="' + esc(month) + '">' + esc(month) + '</span><button data-ja-act="month" data-comp="' + cid + '" data-v="1">›</button><button data-ja-act="month" data-comp="' + cid + '" data-v="0">Today</button>' +
      (V.range ? '<button data-ja-act="mode" data-comp="' + cid + '" data-v="range" data-sm="' + (mode === 'range' ? 'selected' : 'idle') + '">Range' + (mode === 'range' ? ' (click 2 days)' : '') + '</button>' : '') +
      (V.asof ? '<button data-ja-act="mode" data-comp="' + cid + '" data-v="asof" data-sm="' + (mode === 'asof' ? 'selected' : 'idle') + '">As of' + (mode === 'asof' ? ' (click a day)' : '') + '</button>' : '') +
      ((V.controls || []).map(function (k) { var j = M.get(W, k.joy); if (!j) return '<span class="ja-broken">' + esc(k.joy) + '</span>'; var jid = M.parse(k.joy).id;
        return '<span class="ja-step" data-step-joy="' + esc(jid) + '">' + esc(j.name) + ' <button data-ja-act="joy" data-comp="' + cid + '" data-v="' + esc(jid) + '" data-d="-' + (+k.step || 1) + '">−</button><b>' + esc(Math.abs(+k.step) < 1 ? +(+j.value).toFixed(4) : fmt(c, +j.value)) + '</b><button data-ja-act="joy" data-comp="' + cid + '" data-v="' + esc(jid) + '" data-d="' + (+k.step || 1) + '">+</button></span>'; }).join('')) + ' <i>' + (c.items || []).length + ' items</i></div>';
    if (V.asof) { var pv = cs.asofPrev; h += '<div class="ja-asof" data-asof="' + esc(A.day) + '">As of <b>' + esc(A.day) + '</b>' + (A.joy ? '' : ' (today)') + (pv && pv !== A.day ? whatChanged(c, pv, A.day) : '') + '</div>'; }
    h += '<div class="ja-cal">'; ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(function (d) { h += '<div class="ja-dow">' + d + '</div>'; }); for (var i = 0; i < first; i++) h += '<div class="ja-pad"></div>';
    days.forEach(function (d) { var S = stateStyle(c, ds[d]), cls = (d === A.day ? ' ja-today' : d < A.day ? ' ja-past' : '') + (lo && d >= (lo < hi ? lo : hi) && d <= (lo < hi ? hi : lo) ? ' ja-inrange' : '') + (cs.detail === d ? ' ja-sel' : '');
      h += '<div class="ja-day' + S.anim + cls + '" data-day="' + d + '" data-comp="' + cid + '" data-style="' + esc(ds[d] || '') + '" data-sm="' + S.sm + '" style="' + S.css + '"><span class="ja-dn">' + (+d.slice(8)) + '</span>' + (d in lb ? '<span class="ja-dl" data-label="' + esc(lb[d]) + '">' + esc(fmt(c, lb[d])) + '</span>' : '') + (by[d] || []).map(function (r) { return chip(c, r); }).join('') + '</div>'; });
    h += '</div>';
    if (rg.length === 2) h += rangeHtml(c, rg[0] < rg[1] ? rg[0] : rg[1], rg[0] < rg[1] ? rg[1] : rg[0]);
    if (V.detail !== false && cs.detail) h += detailHtml(c, cs.detail);
    if (V.rails) h += railsHtml(c, month);
    if (V.legend !== false) { var st = V.states || {}, ks = Object.keys(st); if (ks.length) h += '<div class="ja-legend">' + ks.map(function (k) { var S2 = stateStyle(c, k); return '<span class="ja-lg" data-legend="' + esc(k) + '" style="' + S2.css + '">' + esc(k) + (st[k].label ? ' · ' + esc(st[k].label) : '') + '</span>'; }).join('') + '</div>'; }
    return h; }
  function linesBetween(c, a, b) { var out = [], ms = {}; [a, b].forEach(function (d) { ms[d.slice(0, 7)] = 1; }); var y = +a.slice(0, 4), m = +a.slice(5, 7); while (true) { var k = y + '-' + (m < 10 ? '0' : '') + m; ms[k] = 1; if (k >= b.slice(0, 7)) break; m++; if (m > 12) { m = 1; y++; } }
    Object.keys(ms).sort().forEach(function (mo) { var cc = Object.assign({}, c, { view: Object.assign({}, c.view, { month: mo }) }), w2 = { items: W.items, components: {} }; w2.components[c.id] = cc; var L = E.ledger(w2, 'comp:' + c.id, 0);
      Object.keys(L.lines).forEach(function (d) { if (d > a && d <= b) L.lines[d].forEach(function (x) { out.push({ day: d, item: x.item, amt: x.amt }); }); }); }); return out; }
  function whatChanged(c, a, b) { var lo = a < b ? a : b, hi = a < b ? b : a, L = linesBetween(c, lo, hi), inn = 0, outv = 0, names = {}; L.forEach(function (x) { if (x.amt > 0) inn += x.amt; else outv -= x.amt; var it = M.get(W, x.item); names[it ? it.name : x.item] = 1; });
    return ' · <span class="ja-changed" data-changed="' + L.length + '">what changed ' + esc(lo) + ' → ' + esc(hi) + ': ' + L.length + ' charges, in ' + esc(fmt(c, inn)) + ', out ' + esc(fmt(c, outv)) + (Object.keys(names).length ? ' · ' + esc(Object.keys(names).slice(0, 8).join(', ')) : '') + '</span>'; }
  function rangeHtml(c, a, b) { var L = linesBetween(c, a < E.monthOf(c) + '-01' ? a : (function () { var d = new Date(+a.slice(0, 4), +a.slice(5, 7) - 1, +a.slice(8) - 1); return d.getFullYear() + '-' + (d.getMonth() < 9 ? '0' : '') + (d.getMonth() + 1) + '-' + (d.getDate() < 10 ? '0' : '') + d.getDate(); })(), b), lb = (c.state || {}).dayLabels || {}, net = 0, mins = [];
    L.forEach(function (x) { net += x.amt; }); Object.keys(lb).forEach(function (d) { if (d >= a && d <= b && typeof lb[d] === 'number') mins.push(lb[d]); });
    return '<div class="ja-range" data-range="' + esc(a + '..' + b) + '" data-net="' + net + '">Range ' + esc(a) + ' → ' + esc(b) + ' · ' + L.length + ' charges · net ' + esc(fmt(c, net)) + (mins.length ? ' · lowest ' + esc(fmt(c, Math.min.apply(null, mins))) : '') + ' <button data-ja-act="clearrange" data-comp="' + esc(c.id) + '">clear</button></div>'; }
  function detailHtml(c, d) { var L = linesBetween(c, (function () { var x = new Date(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8) - 1); return x.getFullYear() + '-' + (x.getMonth() < 9 ? '0' : '') + (x.getMonth() + 1) + '-' + (x.getDate() < 10 ? '0' : '') + x.getDate(); })(), d), lb = (c.state || {}).dayLabels || {}, ds = (c.state || {}).dayStyles || {};
    var on = (c.items || []).filter(function (r) { return E.occurrences(M.get(W, r), d.slice(0, 7)).indexOf(d) >= 0; });
    return '<div class="ja-detail" data-detail="' + esc(d) + '"><b>' + esc(d) + '</b>' + (d in lb ? ' · <span data-dl="' + esc(lb[d]) + '">' + esc(fmt(c, lb[d])) + '</span>' : '') + (ds[d] ? ' · state <span data-ds="' + esc(ds[d]) + '">' + esc(ds[d]) + '</span>' : '') +
      '<ul>' + L.map(function (x) { var it = M.get(W, x.item); return '<li data-line="' + esc(M.parse(x.item).id) + '">' + esc(it ? it.name : x.item) + ' <b>' + esc(fmt(c, x.amt)) + '</b></li>'; }).join('') + on.filter(function (r) { return !L.some(function (x) { return x.item === r; }); }).map(function (r) { var it = M.get(W, r); return '<li class="ja-dim">' + esc(it ? it.name : r) + '</li>'; }).join('') + '</ul><button data-ja-act="closedetail" data-comp="' + esc(c.id) + '">close</button></div>'; }
  function railsHtml(c, month) { var rows = []; (c.items || []).forEach(function (r) { var it = M.get(W, r), v = (it && it.values) || {}; if (!it || !(v.pay || v.repeat === 'monthdays')) return; var pd = String(v.pay || v.on).split(/[ ,]+/).map(Number).filter(isFinite).sort(function (a, b) { return a - b; }); if (!pd.length) return;
      pd.forEach(function (p, i) { var prev = i ? pd[i - 1] : pd[pd.length - 1], st = i ? month.slice(5) + '/' + (prev + 1) : (prev >= p ? 'prev ' + (prev + 1) : month.slice(5) + '/1'); rows.push('<div class="ja-rail" data-rail="' + esc(M.parse(r).id) + '">' + esc(it.name) + ' · ' + esc(st) + ' → ' + esc(month.slice(5) + '/' + p) + ' · ' + (v.flow === 'in' ? 'pay ' : 'bill ') + p + '</div>'); }); });
    return rows.length ? '<div class="ja-rails">' + rows.join('') + '</div>' : ''; }
  function sectionHtml(c) { var V = c.view || {}, Src = M.get(W, V.source); if (!Src) return '<div class="ja-broken" data-broken="' + esc(V.source) + '">broken reference ' + esc(V.source) + '</div>';
    var month = E.monthOf(Src), ds = (Src.state || {}).dayStyles || {}, A = asofOf(Src), rows = [];
    (Src.items || []).forEach(function (r) { var it = M.get(W, r); if (!it) return; var oc = E.occurrences(it, month), hit = V.rule === 'daystate' ? oc.filter(function (d) { return (V.states || []).indexOf(ds[d]) >= 0; }) : V.rule === 'past' ? oc.filter(function (d) { return d < A.day; }) : V.rule === 'future' ? oc.filter(function (d) { return d >= A.day; }) : V.rule === 'flag' ? (E.itemFlags(W, r)[V.flag || 'conflict'] ? oc : []) : oc;
      if (hit.length) rows.push('<div class="ja-srow" data-sec-item="' + esc(M.parse(r).id) + '">' + esc(it.name) + ' <i>' + hit.map(function (d) { return +d.slice(8); }).join(', ') + '</i></div>'); });
    return '<div class="ja-section" data-rule="' + esc(V.rule || 'all') + '" data-n="' + rows.length + '">' + (rows.join('') || '<i>none this month</i>') + '</div>'; }
  function boardHtml(c) { var V = c.view || {}, T = M.get(W, V.target), inT = (T && T.items) || [], st = c.state || {}, sort = st.sort || V.sort || 'name', fil = st.filter || V.filter || 'all', btype = st.budgetType || V.budgetType || 'all';
    var L = (c.items || []).filter(function (r) { var it = M.get(W, r), d = it && (it.values || {}).date, typ = it && (it.values || {}).type; var typeOk = !btype || btype === 'all' || typ === btype || !document.body.classList.contains('budget-mode'); return typeOk && (fil === 'all' || (fil === 'scheduled' ? !!d : !d)); });
    L.sort(function (a, b) { var x = M.get(W, a) || {}, y = M.get(W, b) || {}, k = sort === 'date' ? function (o) { return (o.values || {}).date || '9999'; } : function (o) { return String(o.name || '').toLowerCase(); }; return k(x) < k(y) ? -1 : k(x) > k(y) ? 1 : 0; });
    var h = '<div class="ja-bar"><button data-ja-act="new" data-comp="' + esc(c.id) + '">+ New item</button><button data-ja-act="sort" data-comp="' + esc(c.id) + '">sort: ' + esc(sort) + '</button><button data-ja-act="filter" data-comp="' + esc(c.id) + '">show: ' + esc(fil) + '</button></div><div class="ja-blist">';
    h += L.map(function (r) { var it = M.get(W, r), p = M.parse(r); if (!it) return itemHtml(c, r); var v = it.values || {};
      var extra = (document.body.classList.contains('budget-mode') ? (esc(v.type || '') + (v.amount != null ? ' · ' + esc(v.amount) : '') + ' · ') : '');
      return '<div class="ja-brow">' + chip(c, r, ' <i>' + extra + esc(v.date || 'unscheduled') + (v.repeat && v.repeat !== 'once' ? ' · ' + esc(v.repeat) : '') + '</i>') + (T && inT.indexOf(r) < 0 ? '<button data-ja-act="tocal" data-comp="' + esc(c.id) + '" data-v="' + esc(r) + '">→ ' + esc(T.name) + '</button>' : T ? '<span class="ja-on">on ' + esc(T.name) + '</span>' : '') + '</div>'; }).join('');
    return h + '</div>'; }
  function planHtml(c) { var V = c.view || {}, Src = M.get(W, V.source), L = (Src ? Src.items : c.items) || [], ds = (c.state || {}).dayStyles || {}, h = '<div class="ja-plan">';
    L.forEach(function (r) { var it = M.get(W, r), p = M.parse(r); if (!it) { h += '<div class="ja-prow ja-broken" data-broken="' + esc(r) + '">broken reference ' + esc(r) + '</div>'; return; }
      var F = E.itemFlags(W, r), d = (it.values || {}).date || '', own = F.conflict && ds[d] ? ds[d] : F.broken ? 'conflict' : ((c.state || {}).styles || {})[p.id] || '', S = stateStyle(c, own), seq = E.sequence(W, p.id); /* M19: only the flagged item takes the day's state */
      h += '<div class="ja-prow' + S.anim + '" data-plan-item="' + esc(p.id) + '" data-style="' + esc(own) + '" data-sm="' + S.sm + '" style="' + S.css + '"><b>' + esc(it.name) + '</b> <i>' + esc(d || 'unscheduled') + '</i>' +
        (it.jreq ? '<span class="ja-seq" data-seq="' + esc(seq.join(',')) + '">after ' + (seq.length ? seq.map(function (x) { var o = M.get(W, x); return esc(o ? o.name : x); }).join(' → ') : '(none)') + '</span>' : '') +
        (F.broken ? '<span class="ja-flag" data-flag="broken">⚠ broken jreq ' + esc(it.jreq) + '</span>' : '') + (F.conflict ? '<span class="ja-flag" data-flag="conflict">⚠ conflict: ' + esc((M.get(W, it.jreq) || {}).name) + ' is not before</span>' : '') +
        (it.alts ? itemHtml(c, r).replace(/^<div class="ja-item/, '<div class="ja-item ja-palt') : '') + '</div>'; });
    var hasDeps = (c.sub || []).some(function (s2) { var o = M.get(W, s2.comp); return o && (o.view || {}).layout === 'deps'; });
    if (V.deps !== false && !hasDeps) h += depsHtml({ id: c.id, view: { title: 'Dependencies & sequence' } }, L); /* ADR 0104: every calendar Plan has it (built in) */
    return h + '</div>'; }
  /* ---- M22 (ADR 0104): generic "Dependencies & sequence" over items' jreq chains. Order = full jreq chain (prerequisites first, then date,
   *  then list order) unless view.order === 'given'. Flags are always computed from the data: broken jreq (points at nothing), conflict
   *  (required item not dated earlier), order (required item listed after this one), cycle. Optional per-item text fields
   *  (seq, step, when, reqText, neededBy, view.extra columns, view.btn) let an importer show a source's own wording. ---- */
  function depsOrder(L) { var ids = L.map(function (r) { return M.parse(r) ? M.parse(r).id : r; }), pos = {}, out = [], st = {}; ids.forEach(function (id, i) { pos[id] = i; });
    var dt = function (id) { var v = ((W.items[id] || {}).values) || {}; return String(v.date || v.when || '9999'); };
    var srt = ids.slice().sort(function (a, b) { return dt(a) < dt(b) ? -1 : dt(a) > dt(b) ? 1 : pos[a] - pos[b]; });
    function visit(id) { if (st[id]) return; st[id] = 1; var j = (W.items[id] || {}).jreq, p = j && M.parse(j); if (p && p.kind === 'item' && p.id in pos) visit(p.id); out.push(id); }
    srt.forEach(visit); return out; }
  function depsHtml(c, L) { var V = c.view || {}, ids = V.order === 'given' ? L.map(function (r) { var p = M.parse(r); return p ? p.id : r; }) : depsOrder(L), at = {}, need = {}, cols = V.extra || [];
    ids.forEach(function (id, i) { at[id] = i; var j = (W.items[id] || {}).jreq, p = j && M.parse(j); if (p && p.kind === 'item') (need[p.id] = need[p.id] || []).push(id); });
    var ml = function (t) { return esc(t).replace(/\n/g, '<br>'); }, nf = 0;
    var h = '<div class="ja-deps" data-deps="' + esc(c.id) + '"><div class="ja-deps-h"><b>' + esc(V.title || 'Dependencies & sequence') + '</b> <span class="ja-deps-note">' + esc(V.note || 'jreq · full chain = sequence · ⚠ broken jreq · ⚠ conflict (required item not dated earlier) · ⚠ order') + '</span></div>' +
      '<table class="ja-table ja-deps-t"><thead><tr><th>#</th><th>Step</th><th>When</th><th>Requires</th>' + cols.map(function (k) { return '<th>' + esc(k.label) + '</th>'; }).join('') + '<th>Needed by</th>' + (V.btn ? '<th></th>' : '') + '</tr></thead><tbody>';
    ids.forEach(function (id, i) { var it = W.items[id]; if (!it) { h += '<tr class="ja-broken" data-broken="' + esc(id) + '"><td colspan="5">broken reference ' + esc(id) + '</td></tr>'; return; }
      var v = it.values || {}, ref = 'item:' + id, F = E.itemFlags(W, ref), seq = it.jreq ? E.sequence(W, id) : [], fl = [], jp = it.jreq && M.parse(it.jreq), jid = jp && jp.id;
      if (F.broken) fl.push('<span class="ja-flag" data-flag="broken">⚠ broken jreq ' + esc(it.jreq) + '</span>');
      if (F.conflict) fl.push('<span class="ja-flag" data-flag="conflict">⚠ conflict: ' + esc((W.items[jid] || {}).name) + ' is not dated earlier</span>');
      if (jid && jid in at && at[jid] > i) fl.push('<span class="ja-flag" data-flag="order">⚠ order: ' + esc((W.items[jid] || {}).name) + ' is listed after</span>');
      if (seq.indexOf(ref) >= 0) fl.push('<span class="ja-flag" data-flag="cycle">⟳ cycle</span>');
      nf += fl.length;
      var chain = seq.length ? seq.slice().reverse().map(function (x) { var o = M.get(W, x); return o ? o.name : x; }).join(' → ') : '—';
      var nb = (need[id] || []).map(function (x) { return (W.items[x] || {}).name; }).join(', ') || '—';
      h += '<tr class="ja-dep" data-dep-item="' + esc(id) + '" data-seq="' + esc(seq.map(function (x) { return M.parse(x) ? M.parse(x).id : x; }).join(',')) + '" data-flags="' + fl.length + '"' + (v.crit ? ' data-crit="1"' : '') + (v.blocked ? ' data-blocked="1"' : '') + '>' +
        '<td>' + ml(v.seq != null ? v.seq : String(i + 1)) + '</td><td>' + ml(v.step != null ? v.step : it.name) + (fl.length ? ' ' + fl.join(' ') : '') + '</td><td>' + ml(v.when != null ? v.when : (v.date || '—')) + '</td>' +
        '<td data-chain="' + esc(chain) + '">' + ml(v.reqText != null ? v.reqText : chain) + '</td>' + cols.map(function (k) { return '<td>' + ml(v[k.field] == null ? '' : v[k.field]) + '</td>'; }).join('') +
        '<td>' + ml(v.neededBy != null ? v.neededBy : nb) + '</td>' + (V.btn ? '<td>' + ml(v[V.btn] || '') + '</td>' : '') + '</tr>'; });
    return h + '</tbody></table><div class="ja-deps-sum" data-deps-n="' + ids.length + '" data-deps-flags="' + nf + '">' + ids.length + ' steps · ' + nf + ' flags</div></div>'; }

  /* ---- M20b (ADR 0101): generic table / kpi / text views + number pad input; all read atlas data, formats are view data ---- */
  function fmtv(v, f) { if (f === 'text' || typeof v !== 'number' || !isFinite(v)) { if (typeof v === 'string' && v !== '' && f && f !== 'text' && isFinite(+v)) v = +v; else return v == null ? '' : String(v); }
    var a = function (x) { return Math.abs(x).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','); };
    if (f === 'money') return (v < 0 ? '−$' : '$') + a(v); if (f === 'smoney') return (v < 0 ? '−$' : '+$') + a(v); if (f === 'pct3') return (+v || 0).toFixed(3) + '%'; if (f === 'nmoney') return '−$' + a(v);
    if (f === 'pct') return (Math.round(v * 100) / 100).toFixed(2) + '%'; if (f === 'pct3') return v.toFixed(3) + '%'; if (f === 'int') return String(Math.round(v));
    if (f === 'snum') return (v < 0 ? '−' : '+') + a(v); if (f === 'cnum') return (v < 0 ? '−' : '') + a(v); if (f === 'h1') return v.toFixed(1) + ' h'; if (f === 'num2') return v.toFixed(2); if (f === 'dd') return String(v) + ' d'; if (f === 'snum2') return (v >= 0 ? '+' : '') + v.toFixed(2); if (f === 'blank') return ''; if (f === 'pctf') return (v * 100).toFixed(2) + '%'; if (f === 'pctf3') return (v * 100).toFixed(3) + '%';
    if (f === 'inf') return isFinite(v) && v < 1e9 ? String(Math.round(v)) : '∞'; return String(Math.round(v * 100) / 100); }
  function joyVal(ref) { var j = M.get(W, ref); return j ? j.value : undefined; }
  function fieldOf(it, f) { if (f === 'name') return it.name; var v = it.values || {}; return f in v ? v[f] : (it.state || {})[f]; }
  var PAD = null;
  function tableHtml(c) { var V = c.view || {}, cols = V.columns && V.columns.length ? V.columns : [{ label: 'Name', field: 'name' }], cid = esc(c.id), items = (c.state && c.state.viewItems) || c.items || [];
    var capT = V.caption ? V.caption + (V.captionMap ? ' ' + ((V.captionMap.text || {})[String((W.joys[V.captionMap.joy] || {}).value)] || '') : '') : ''; var h = (capT ? textHtml({ view: { text: capT } }) : '') + '<table class="ja-table" data-comp="' + cid + '"><thead><tr>' + (V.drag ? '<th></th>' : '') + cols.map(function (k) { return '<th data-col="' + esc(k.field) + '">' + esc(k.label != null ? k.label : k.field) + '</th>'; }).join('') + (V.remove ? '<th></th>' : '') + '</tr></thead><tbody>';
    var rf = function (r, f) { var o = M.get(W, r) || {}, v = (o.state || {})[f]; if (v == null) v = (o.values || {})[f]; return v; };
    /* rowIf / rowIfNot: show only rows whose field is truthy / falsy (live: items outside the active order hidden; non-factors listed apart) */
    if (V.rowIf) items = items.filter(function (r) { return !!+rf(r, V.rowIf) || (rf(r, V.rowIf) && isNaN(+rf(r, V.rowIf))); });
    if (V.rowIfNot) items = items.filter(function (r) { return !+rf(r, V.rowIfNot); });
    if (V.sort) { var sdesc = V.sort.charAt(0) === '-', sf = sdesc ? V.sort.slice(1) : V.sort, sv = function (r) { return +rf(r, sf) || 0; }; items = items.slice().sort(function (a, b) { return sdesc ? sv(b) - sv(a) : sv(a) - sv(b); }); }
    var dragF = V.drag ? joyTpl(V.drag.field) : null;
    h += items.map(function (r) { var it = M.get(W, r), p = M.parse(r); if (!it) return '<tr class="ja-broken" data-broken="' + esc(r) + '"><td colspan="' + cols.length + '">broken reference ' + esc(r) + '</td></tr>';
      var S = stateStyle(c, ((c.state || {}).styles || {})[p.id]);
      var AE = V.alts ? altEntry(V, r) : null, open = AE && ((c.state.open || {})[p.id]);
      return '<tr class="ja-trow" data-row="' + esc(p.id) + '" data-sm="' + S.sm + '" style="' + S.css + '">' + (dragF ? '<td class="ja-grip" data-grip="' + esc(p.id) + '" data-comp="' + cid + '" data-f="' + esc(dragF) + '" title="drag to reorder">⋮</td>' : '') + (V.alts ? '<td class="ja-cell"><button class="ja-tog" data-ja-act="altopen" data-comp="' + cid + '" data-v="' + esc(p.id) + '">' + (open ? '▾' : '▸') + '</button></td>' : '') + cols.map(function (k, ci) { var v = fieldOf(it, k.field); if (k.prefix && v != null && v !== '') v = k.prefix + v; if (k.suffix && v != null && v !== '') v = String(v) + k.suffix; if (k.suffixField && fieldOf(it, k.suffixField)) v = String(v) + fieldOf(it, k.suffixField);
          if (k.toggle) return '<td class="ja-cell"><button class="ja-nf" data-ja-act="valtog" data-comp="' + cid + '" data-v="' + esc(p.id) + '" data-f="' + esc(joyTpl(k.toggle)) + '">' + esc(v == null ? '' : v) + '</button></td>'; var t = k.fmt === 'lines' ? esc(v == null || v === '' ? '—' : String(v)).replace(/\n/g, '<br>') : esc(fmtv(v, k.fmtField ? (fieldOf(it, k.fmtField) || 'text') : k.fmt));
          if (k.edit === 'choice') { var ch = choicesOf(k), cur = ch.filter(function (o) { return String(o.v) === String(v == null ? '' : v); })[0]; t = esc(cur ? cur.label : (v == null ? '' : v));
            return '<td class="ja-cell ja-edit ja-choice" data-ja-act="choose" data-comp="' + cid + '" data-v="' + esc(p.id) + '" data-f="' + esc(k.field) + '">' + t + ' ▾' + (PICK && PICK.comp === c.id && PICK.item === p.id && PICK.field === k.field ? '<div class="ja-picker">' + ch.map(function (o) { return '<button data-ja-act="pickv" data-comp="' + cid + '" data-v="' + esc(o.v) + '" data-sm="' + (cur === o ? 'selected' : 'idle') + '">' + esc(o.label) + '</button>'; }).join('') + '</div>' : '') + '</td>'; }
          if (k.edit === 'date') return '<td class="ja-cell ja-edit ja-date" data-ja-act="datep" data-comp="' + cid + '" data-v="' + esc(p.id) + '" data-f="' + esc(k.field) + '">' + (t || '—') + (PICK && PICK.comp === c.id && PICK.item === p.id && PICK.field === k.field ? dateGrid(c) : '') + '</td>';
          var extra = ci === 0 && AE ? altTagHtml(V, AE) : '';
          if (extra) t += extra;
          return k.edit ? '<td class="ja-cell ja-edit" data-ja-act="pad" data-comp="' + cid + '" data-v="' + esc(p.id) + '" data-f="' + esc(k.field) + '"' + (PAD && PAD.item === p.id && PAD.field === k.field ? ' data-sm="editing"' : '') + '>' + t + '</td>' : '<td class="ja-cell" data-f="' + esc(k.field) + '">' + t + '</td>'; }).join('') +
        ((V.move || V.remove) ? '<td>' + (V.move ? '<button class="ja-mv" data-ja-act="mvrow" data-comp="' + cid + '" data-v="' + esc(r) + '">' + esc(V.move.label || 'Move') + '</button> ' : '') + (V.remove ? '<button class="ja-x" data-ja-act="rmrow" data-comp="' + cid + '" data-v="' + esc(r) + '">×</button>' : '') + '</td>' : '') + '</tr>' +
        (V.note && (it.values || {})[V.note] ? '<tr class="ja-note"><td colspan="' + (cols.length + 1) + '">' + esc(it.values[V.note]) + '</td></tr>' : '') + (V.alts && open ? altRows(c, r, AE, cols.length + 1 + (V.remove ? 1 : 0)) : ''); }).join('');
    h += '</tbody>' + ((V.totals || []).length ? '<tfoot>' + V.totals.map(function (t) { return '<tr class="ja-total" data-total="' + esc(t.joy) + '"><td colspan="' + Math.max(1, cols.length - 1) + '">' + esc(t.label) + '</td><td>' + esc(fmtv(joyVal(t.joy), t.fmt)) + '</td></tr>'; }).join('') + '</tfoot>' : '') + '</table>';
    if (V.add) h += '<button class="ja-addrow" data-ja-act="addrow" data-comp="' + cid + '">' + esc(V.add) + '</button>';
    if (PAD && PAD.comp === c.id) h += padHtml(c);
    return h; }
  var PICK = null;
  function joyTpl(t) { return String(t || '').replace(/\{joy:([A-Za-z0-9_]+)\}/g, function (_, id) { var j = W.joys[id]; return j ? String(j.value) : ''; }); }
  /* row drag reorder (live RANKS drag): grip pointerdown → pointerup over another row; renumbers drag.field 1..n in the new order (items outside the order keep 999) */
  function dragRows(cid, from, to, f) { var c = W.components[cid]; if (!c || from === to) return false; var L = (c.items || []).map(function (r) { var o = M.get(W, r); return o ? { o: o, p: +((o.values || {})[f]) || 999 } : null; }).filter(function (x) { return x && x.p < 999; }).sort(function (a, b) { return a.p - b.p; });
    var fi = -1, ti = -1; L.forEach(function (x, i) { if (x.o.id === from) fi = i; if (x.o.id === to) ti = i; }); if (fi < 0 || ti < 0) return false; var m = L.splice(fi, 1)[0]; L.splice(ti, 0, m); L.forEach(function (x, i) { x.o.values[f] = i + 1; }); external(L.map(function (x) { return 'item:' + x.o.id; }), []); return true; }
  var RD = null;
  document.addEventListener('pointerdown', function (e) { var g = e.target.closest && e.target.closest('[data-grip]'); if (g) { RD = { id: g.getAttribute('data-grip'), comp: g.getAttribute('data-comp'), f: g.getAttribute('data-f') }; e.preventDefault(); } }, true);
  document.addEventListener('pointerup', function (e) { if (!RD) return; var d = RD; RD = null; var el = document.elementFromPoint(e.clientX, e.clientY), tr = el && el.closest && el.closest('tr[data-row]'); if (tr) dragRows(d.comp, d.id, tr.getAttribute('data-row'), d.f); }, true);
  JAtlas.dragRows = dragRows;
  function asofDay() { return asofOf({ view: { asof: 'joy:asof' } }).day; }
  function choicesOf(k) { if (k.choices) return k.choices; if (k.choicesFrom) { var cc = M.get(W, k.choicesFrom); return (k.choiceFirst || []).concat(((cc && cc.items) || []).map(function (r) { var it = M.get(W, r); return { v: M.parse(r).id, label: (k.choicePrefix || '') + (it ? it.name : r) }; })); } return []; }
  function dateGrid(c) { var cid = esc(c.id), mo = PICK.month, y = +mo.slice(0, 4), m = +mo.slice(5, 7) - 1, first = new Date(y, m, 1).getDay(), nd = new Date(y, m + 1, 0).getDate(), h = '<div class="ja-picker ja-dgrid"><div><button data-ja-act="datem" data-comp="' + cid + '" data-v="-1">‹</button> <b>' + esc(mo) + '</b> <button data-ja-act="datem" data-comp="' + cid + '" data-v="1">›</button> <button data-ja-act="datev" data-comp="' + cid + '" data-v="">clear</button></div>';
    for (var i = 0; i < first; i++) h += '<span></span>'; for (var d = 1; d <= nd; d++) { var ds = mo + '-' + (d < 10 ? '0' : '') + d; h += '<button data-ja-act="datev" data-comp="' + cid + '" data-v="' + ds + '" data-sm="' + (ds === PICK.cur ? 'selected' : 'idle') + '">' + d + '</button>'; } return h + '</div>'; }
  /* alternatives attached to a table row (ADR 0103): an item in V.alts.comp whose values[V.alts.by] points at the row */
  function altEntry(V, r) { var cc = M.get(W, V.alts.comp); if (!cc) return null; var hit = null; (cc.items || []).some(function (e) { var it = M.get(W, e); if (it && it.alts && (it.values || {})[V.alts.by || 'lineRef'] === r) { hit = it; return true; } return false; }); return hit; }
  function altPick(e) { var st = e.state || {}; return st.userPick || st.pick || null; }
  function altTagHtml(V, e) { var pk = altPick(e), m = pk && M.get(W, pk); if (!m) return ''; var mv = m.values || {};
    return '<div class="ja-alttag" data-alttag="' + esc(e.id) + '">' + esc(String(V.alts.tag || 'plan {key} · {label}{from}').replace('{key}', mv.key || '').replace('{label}', mv.label || m.name).replace('{from}', mv.start ? ' (from ' + mv.start + ')' : '')) + '</div>' + altReq(V, e); }
  function altReq(V, e) { var me = 'item:' + e.id, req = ((e.values || {}).requires || []).map(function (r) { var o = M.get(W, r); return o ? ((o.state || {}).pick ? '✓ ' : '✗ ') + o.name : null; }).filter(Boolean), cc = M.get(W, V.alts.comp), nb = [];
    ((cc && cc.items) || []).forEach(function (x) { var o = M.get(W, x); var hit = o && x !== me && (((o.values || {}).requires || []).indexOf(me) >= 0 || ((o.alts || {}).members || []).some(function (m) { var mi = M.get(W, m); return mi && ((mi.values || {}).needs || []).some(function (n) { return String(n).split('#')[0] === me; }); })); if (hit) nb.push(o.name); });
    return (req.length ? '<div class="ja-alttag">Requires: ' + esc(req.join(' + ')) + '</div>' : '') + (nb.length ? '<div class="ja-alttag">Needed by: ' + esc(nb.join(', ')) + '</div>' : ''); }
  function altRows(c, r, e, span) { var cid = esc(c.id), it = M.get(W, r), base = +((it.values || {}).amount) || 0, A = e && e.alts, h = '';
    if (!e) return '<tr class="ja-altrow"><td colspan="' + span + '"><b>Plan A</b> · this line (' + esc(fmtv(-base, 'money')) + ') · no alternatives yet <button data-ja-act="altadd" data-comp="' + cid + '" data-v="' + esc(r) + '">+ alternative</button></td></tr>';
    (A.members || []).forEach(function (m) { var mi = M.get(W, m); if (!mi) return; var v = mi.values || {}, off = (A.unavail || []).indexOf(m) >= 0, pref = A.pref === m, tr = (e.state || {}).userPick === m, win = altPick(e) === m, amt = +v.amount || 0;
      h += '<tr class="ja-altrow" data-altm="' + esc(M.parse(m).id) + '" data-sm="' + (off ? 'off' : win ? 'selected' : 'idle') + '"><td></td><td' + (off ? ' style="text-decoration:line-through;opacity:.55"' : '') + '><b>' + esc(v.key || '') + '</b> · ' + esc(v.label || mi.name) + (win ? ' ✓ plan winner' : '') + (pref ? ' ★ Preferred' : '') + (tr ? ' ⇢ exploring' : '') + (v.start ? ' · from ' + esc(v.start) : '') + '</td><td>' + esc(fmtv(-amt, 'money')) + '<br><small>' + esc(v.cadence || 'monthly') + '</small></td><td>surplus ' + esc(fmtv(base - amt, 'smoney')) + '</td>' +
        '<td colspan="' + Math.max(1, span - 4) + '"><button data-ja-act="altun" data-comp="' + cid + '" data-v="' + esc(e.id + '|' + m) + '">' + (off ? 'Restore' : 'Unavail.') + '</button> <button data-ja-act="altpref" data-comp="' + cid + '" data-v="' + esc(e.id + '|' + m) + '">' + (pref ? '★ Unprefer' : '☆ Prefer') + '</button> <button data-ja-act="alttry" data-comp="' + cid + '" data-v="' + esc(e.id + '|' + m) + '">' + (tr ? 'Stop' : 'Try') + '</button></td></tr>'; });
    return h + '<tr class="ja-altrow"><td colspan="' + span + '"><button data-ja-act="altadd" data-comp="' + cid + '" data-v="' + esc(r) + '">+ alternative</button></td></tr>'; }
  function padHtml(c) { var cid = esc(c.id); return '<div class="ja-pad" data-pad="' + esc(PAD.item) + '"><span class="ja-padv">' + esc(PAD.buf || '0') + '</span>' + ['7', '8', '9', '4', '5', '6', '1', '2', '3', '-', '0', '.'].map(function (k) { return '<button data-ja-act="padkey" data-comp="' + cid + '" data-v="' + k + '">' + k + '</button>'; }).join('') +
      '<button data-ja-act="padkey" data-comp="' + cid + '" data-v="bs">⌫</button><button data-ja-act="padkey" data-comp="' + cid + '" data-v="ok">OK</button><button data-ja-act="padkey" data-comp="' + cid + '" data-v="esc">Cancel</button></div>'; }
  function kpiHtml(c) { return '<div class="ja-kpis">' + ((c.view || {}).kpis || []).map(function (k) { var v = joyVal(k.joy);
      return '<div class="ja-kpi" data-kpi="' + esc(k.joy) + '"><i>' + esc(k.label) + '</i><b>' + (v === undefined ? '<span class="ja-broken">broken ' + esc(k.joy) + '</span>' : esc(fmtv(v, k.fmt))) + '</b>' + (k.sub ? '<small>' + esc(k.sub).replace(/\{joy:([A-Za-z0-9_]+)\}/g, function (_, id) { var j = W.joys[id]; return j ? esc(String(j.value)) : ''; }) + '</small>' : '') + ((k.choices || []).length ? '<span class="ja-chips">' + k.choices.map(function (ch) { return '<button class="ja-chip' + (String(v) === String(ch) ? ' on' : '') + '" data-ja-act="joyset" data-comp="' + esc(c.id) + '" data-v="' + esc(k.joy) + '" data-f="' + esc(ch) + '">' + esc(ch) + '</button>'; }).join('') + '</span>' : '') + '</div>'; }).join('') + '</div>'; }
  function textHtml(c) { var T = String((c.view || {}).text || ''); return '<div class="ja-text">' + T.split('\n').map(function (ln) {
      return '<p>' + esc(ln).replace(/\{joy:([A-Za-z0-9_]+)(?:\|([a-z0-9]+))?(?:\|nz:([^}]*))?\}/g, function (_, id, f, nz) { var j = W.joys[id]; if (nz != null) { if (!j || !(Math.abs(+j.value || 0) > 0.004)) return ''; return nz + '<span class="ja-tok" data-tok="' + id + '">' + esc(fmtv(j.value, f || 'num')) + '</span>'; } return '<span class="ja-tok" data-tok="' + id + '">' + (j ? esc(fmtv(j.value, f || 'num')) : 'broken joy:' + id) + '</span>'; }) + '</p>'; }).join('') + '</div>'; }
  function padKey(c, k) { if (!PAD) return; var b = PAD.buf || '';
    if (k === 'esc') { PAD = null; render(); return; }
    if (k === 'ok') { var it = W.items[PAD.item], n = +b; if (it && b !== '' && isFinite(n)) { it.values = it.values || {}; it.values[PAD.field] = n; PAD = null; external(['item:' + it.id], []); return; } PAD = null; render(); return; }
    if (k === 'bs') b = b.slice(0, -1); else if (k === '-') b = b[0] === '-' ? b.slice(1) : '-' + b; else if (k === '.') { if (b.indexOf('.') < 0) b += b === '' || b === '-' ? '0.' : '.'; } else b += k;
    PAD.buf = b; render(); }
  function compAct(b) { var cid = b.getAttribute('data-comp'), c = W.components[cid], a = b.getAttribute('data-ja-act'), v = b.getAttribute('data-v'); if (!c) return; c.state = c.state || {};
    if (a === 'show') { c.state.show = v; render(); return; }
    if (a === 'pad') { var pit = W.items[v], f0 = b.getAttribute('data-f'); PAD = pit ? { comp: cid, item: v, field: f0, buf: '' } : null; render(); return; }
    if (a === 'padkey') { padKey(c, v); return; }
    if (a === 'choose' || a === 'datep') { var it0 = W.items[v], f1 = b.getAttribute('data-f'); if (PICK && PICK.item === v && PICK.field === f1) { PICK = null; render(); return; } var cv = it0 ? String(((it0.values || {})[f1]) || '') : '';
      PICK = it0 ? { comp: cid, item: v, field: f1, cur: cv, month: (/^\d{4}-\d{2}/.test(cv) ? cv.slice(0, 7) : (asofDay() || '').slice(0, 7)) } : null; render(); return; }
    if (a === 'joyset') { var jk = String(v).replace(/^joy:/, ''), jj = W.joys[jk]; if (!jj) return; jj.value = b.getAttribute('data-f'); external(['joy:' + jk], []); return; }
    if (a === 'valtog') { var ti = W.items[v], tf = b.getAttribute('data-f'); if (!ti) return; ti.values = ti.values || {}; ti.values[tf] = +ti.values[tf] ? 0 : 1; external(['item:' + ti.id], []); return; }
    if (a === 'pickv' || a === 'datev') { if (!PICK) return; var pi = W.items[PICK.item]; if (pi) { pi.values = pi.values || {}; pi.values[PICK.field] = v; } PICK = null; if (pi) external(['item:' + pi.id], []); return; }
    if (a === 'datem') { if (!PICK) return; var yy = +PICK.month.slice(0, 4), mm = +PICK.month.slice(5, 7) - 1 + (+v), d0 = new Date(yy, mm, 1); PICK.month = d0.getFullYear() + '-' + (d0.getMonth() < 9 ? '0' : '') + (d0.getMonth() + 1); render(); return; }
    if (a === 'altopen') { c.state.open = c.state.open || {}; c.state.open[v] = !c.state.open[v]; render(); return; }
    if (a === 'altun' || a === 'altpref' || a === 'alttry') { var pr = v.split('|'), e = W.items[pr[0]], mref = pr[1]; if (!e || !e.alts) return; var A = e.alts;
      if (a === 'altun') { A.unavail = A.unavail || []; A.unavail = A.unavail.indexOf(mref) >= 0 ? A.unavail.filter(function (x) { return x !== mref; }) : A.unavail.concat([mref]); }
      if (a === 'altpref') A.pref = A.pref === mref ? null : mref;
      if (a === 'alttry') { e.state = e.state || {}; e.state.userPick = e.state.userPick === mref ? null : mref; }
      external(['item:' + e.id], []); return; }
    if (a === 'altadd') { var row = M.get(W, v), V2 = c.view, ac = M.get(W, V2.alts.comp); if (!row || !ac) return; var ent = altEntry(V2, v);
      if (!ent) { var er = M.newItem(W, row.name + ' alternatives'); ent = W.items[M.parse(er).id]; ent.values = { lineRef: v }; ent.alts = { members: [], pref: null, unavail: [], method: 'best' }; ac.items = (ac.items || []).concat([er]);
        var a0 = M.newItem(W, row.name + ' · this line'); W.items[M.parse(a0).id].values = { key: 'A', label: 'this line', amount: +((row.values || {}).amount) || 0 }; ent.alts.members.push(a0); }
      var k = String.fromCharCode(65 + ent.alts.members.length), nr2 = M.newItem(W, row.name + ' · ' + k); W.items[M.parse(nr2).id].values = { key: k, label: 'alternative ' + k, amount: 0 }; ent.alts.members.push(nr2);
      c.state.open = c.state.open || {}; c.state.open[M.parse(v).id] = true; external(['item:' + ent.id, nr2, V2.alts.comp, 'members:' + V2.alts.comp], []); return; }
    if (a === 'addrow') { var nr = M.newItem(W, (c.view.addName || 'Row') + ' ' + ((c.items || []).length + 1)), ni = W.items[M.parse(nr).id]; ni.values = JSON.parse(JSON.stringify(c.view.addValues || { amount: 0 })); c.items = (c.items || []).concat([nr]); external([nr, 'comp:' + cid, 'members:comp:' + cid], []); return; }
    if (a === 'jump') { var je = document.querySelector('section[data-comp="' + v + '"]'); if (je && je.scrollIntoView) je.scrollIntoView({ block: 'start' }); if (je) { je.setAttribute('data-jumped', '1'); } return; }
    if (a === 'mvrow' && c.view.move) { var tg = W.components[M.parse(c.view.move.to).id], mi = W.items[M.parse(v).id]; if (!tg) return; c.items = (c.items || []).filter(function (x) { return x !== v; }); tg.items = (tg.items || []).concat([v]);
      if (mi) { mi.values = mi.values || {}; Object.keys(c.view.move.set || {}).forEach(function (f) { mi.values[f] = c.view.move.set[f]; }); } external([v, 'comp:' + cid, 'members:comp:' + cid, c.view.move.to, 'members:' + c.view.move.to], []); return; }
    if (a === 'rmrow') { c.items = (c.items || []).filter(function (x) { return x !== v; }); external([v, 'comp:' + cid, 'members:comp:' + cid], []); return; }
    if (a === 'month') { var mo = E.monthOf(c), y = +mo.slice(0, 4), m = +mo.slice(5, 7) - 1 + (+v); if (+v === 0) { var t = asofOf(c).day; y = +t.slice(0, 4); m = +t.slice(5, 7) - 1; } var nd = new Date(y, m, 1); c.view.month = nd.getFullYear() + '-' + (nd.getMonth() < 9 ? '0' : '') + (nd.getMonth() + 1); c.state.detail = null; external(['members:comp:' + cid], []); return; }
    if (a === 'mode') { c.state.mode = c.state.mode === v ? '' : v; if (v === 'range' && c.state.mode) c.state.range = []; render(); return; }
    if (a === 'clearrange') { c.state.range = []; render(); return; }
    if (a === 'closedetail') { c.state.detail = null; render(); return; }
    if (a === 'joy') { var J = W.joys[v]; if (!J) return; J.value = Math.round(((+J.value || 0) + (+b.getAttribute('data-d'))) * 1e6) / 1e6; external(['joy:' + v], []); return; }
    if (a === 'sort') { c.state.sort = (c.state.sort || c.view.sort || 'name') === 'name' ? 'date' : 'name'; render(); return; }
    if (a === 'filter') { var F = ['all', 'unscheduled', 'scheduled']; c.state.filter = F[(F.indexOf(c.state.filter || c.view.filter || 'all') + 1) % 3]; render(); return; }
    if (a === 'new') { var r = M.newItem(W, 'Item ' + (Object.keys(W.items).length + 1)); c.items = (c.items || []).concat([r]); external([r, 'comp:' + cid], []); return; }
    if (a === 'tocal') { var T = M.get(W, c.view.target); if (!T || (T.items || []).indexOf(v) >= 0) return; T.items = (T.items || []).concat([v]); external([v, c.view.target, 'members:' + c.view.target], []); } }
  JAtlas.compAct = compAct;
  function dayClick(dd) { var cid = dd.getAttribute('data-comp'), c = W.components[cid], d = dd.getAttribute('data-day'); if (!c) return; c.state = c.state || {}; var md = c.state.mode;
    if (md === 'range') { var r = c.state.range || []; c.state.range = r.length === 1 ? [r[0], d] : [d]; if (c.state.range.length === 2) c.state.mode = ''; render(); return; }
    if (md === 'asof') { var j = c.view.asof && M.parse(c.view.asof), J = j && W.joys[j.id]; if (!J) return; c.state.asofPrev = asofOf(c).day; J.value = d; c.state.mode = ''; external(['joy:' + j.id], []); return; }
    c.state.detail = c.state.detail === d ? null : d; render(); }
  JAtlas.dayClick = dayClick;
  function render() { var J = W.joys || {}, app = document.getElementById('app');
    app.innerHTML = '<header class="ja-top"><b>' + esc(W.title) + '</b> ' + (W.topJoys || Object.keys(J)).filter(function (k) { return J[k]; }).map(function (k) { return '<span class="ja-joy" data-joy="' + esc(k) + '">' + esc(J[k].name) + ' <b>' + esc(fmtv(J[k].value, J[k].fmt || 'num')) + '</b></span>'; }).join(' ') +
      ' <span class="ja-meta" id="ja-meta">pass ' + JAtlas.passes + ' · ' + JAtlas.backend + ' · ' + JAtlas.engine + (JAtlas.conflicts.length ? ' · ' + JAtlas.conflicts.length + ' conflict' : '') + (JAtlas.cycles.length ? ' · loop' : '') + '</span></header>' +
      (W.root || []).map(function (r) { return compHtml(r, null, 0, null); }).join('');
    if (D && D.on) { var ne = app.querySelector('.ja-item[data-item="' + D.el.getAttribute('data-item') + '"]'); if (ne) { ne.setAttribute('data-sm', 'dragging'); D.el = ne; } } }
  /* ADR 0087: pointer drag + drop-on-target -> view event stream (drag from the source component, drop on the target component) */
  var D = null, suppress = false;
  document.addEventListener('pointerdown', function (e) { var it = e.target.closest('.ja-item[data-item]'); if (!it || e.target.closest('[data-alt]')) return; D = { el: it, x: e.clientX, y: e.clientY, on: false }; });
  document.addEventListener('pointermove', function (e) { if (!D) return; if (!D.on && Math.abs(e.clientX - D.x) + Math.abs(e.clientY - D.y) > 6) { D.on = true; D.el.setAttribute('data-sm', 'dragging');
      JAtlas.event('drag', 'comp:' + D.el.getAttribute('data-comp'), 'item:' + D.el.getAttribute('data-item')); }
    if (D.on) { document.querySelectorAll('[data-drop-hot]').forEach(function (x) { x.removeAttribute('data-drop-hot'); }); var t = document.elementFromPoint(e.clientX, e.clientY), tc = t && t.closest('.ja-comp[data-comp]'); if (tc) tc.setAttribute('data-drop-hot', '1'); } });
  document.addEventListener('pointerup', function (e) { var d = D; D = null; if (!d || !d.on) return; suppress = true; setTimeout(function () { suppress = false; }, 50);
    var t = document.elementFromPoint(e.clientX, e.clientY), ti = t && t.closest('.ja-item[data-item]'), tc = t && t.closest('.ja-comp[data-comp]');
    var dd = t && t.closest('[data-day]'), target = dd ? dd.getAttribute('data-day') : ti && ti !== d.el ? 'item:' + ti.getAttribute('data-item') : tc ? 'comp:' + tc.getAttribute('data-comp') : null;
    if (dd && tc) { var C2 = W.components[tc.getAttribute('data-comp')], ir = 'item:' + d.el.getAttribute('data-item'); if (C2 && (C2.items || []).indexOf(ir) < 0) { C2.items = (C2.items || []).concat([ir]); external(['comp:' + C2.id, 'members:comp:' + C2.id], []); } }
    JAtlas.event('drop', tc ? 'comp:' + tc.getAttribute('data-comp') : null, 'item:' + d.el.getAttribute('data-item'), target); });
  document.addEventListener('click', function (e) { if (suppress) return; var ca = e.target.closest('[data-ja-act]'); if (ca) { compAct(ca); return; } var a = e.target.closest('[data-alt]'); if (a) { JAtlas.pickAlt(a.getAttribute('data-alt-parent'), a.getAttribute('data-alt')); return; }
    var dd = e.target.closest('.ja-day[data-day]'); if (dd && !e.target.closest('.ja-item[data-item]')) { dayClick(dd); return; }
    var it = e.target.closest('.ja-item[data-item]'); if (it) JAtlas.event('click', 'comp:' + it.getAttribute('data-comp'), 'item:' + it.getAttribute('data-item')); });
  render(); schedule();
})();

};
