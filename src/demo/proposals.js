/* inlined: proposals.js */
/* Exp7 proposal checker: verbatim from JEditor tools/gen_synthetic_proposals.js (lines 16-127, 148-178); node I/O + CLI removed */
(function(root){'use strict';
const OPS = ['set', 'delta', 'add', 'remove', 'ref'];
/* ESTIMATE mix, % of proposals by kind (doc 44 §4). */
const MIX = [['pick', 20], ['pref', 8], ['unavail', 7], ['landed', 5], ['move', 14], ['startAdd', 1], ['delta', 20], ['tick', 10], ['text', 8], ['member', 5], ['planner', 2]];
const T = v => Array.isArray(v) ? 'array' : v === null ? 'null' : typeof v;
const REF = /^[a-z]+:[A-Za-z0-9_]+(#[A-Za-z0-9]+)?$/;
function shape(p) {
  const e = [], isInt = x => Number.isInteger(x) && x >= 0;
  if (!p || typeof p !== 'object') return ['not an object'];
  if (typeof p.id !== 'string' || !/^p_[0-9a-z]+$/.test(p.id)) e.push('id');
  if (typeof p.proc !== 'string' || !p.proc) e.push('proc');
  if (!isInt(p.baseRev)) e.push('baseRev');
  if (!isInt(p.t)) e.push('t');
  if ('note' in p && typeof p.note !== 'string') e.push('note');
  if (!Array.isArray(p.ops) || p.ops.length > 5000) e.push('ops'); /* 0..5000 ops; an empty batch is valid (no-change, succeeds) */
  else p.ops.forEach((o, i) => {
    if (typeof o.path !== 'string' || !/^(items|joys|components|blueprints|clock)(\/[A-Za-z0-9_]+)+$/.test(o.path)) e.push('ops[' + i + '].path');
    if (OPS.indexOf(o.op) < 0) e.push('ops[' + i + '].op');
    if (!('value' in o)) e.push('ops[' + i + '].value');
    if (o.op === 'delta' && typeof o.value !== 'number') e.push('ops[' + i + '].delta value not a number');
    if (o.op === 'ref' && !(o.value === null || REF.test(o.value))) e.push('ops[' + i + '].ref value');
  });
  return e;
}
/* Apply one op to atlas w (mutates). Returns null or a rejection reason. Working rules (spec 3.7, Matthew to confirm):
   set/delta/ref on a missing path -> missing-path (never created); add creates a missing field or appends to an array;
   delta only on numbers; set keeps the existing type (null accepts any).
   Revision (Matthew's answer: no, reading to confirm): revisions are recorded per path (change detection, changed events, log) but
   never reject; an older-base set/ref is accepted and the latest accepted proposal wins. The overwritten previous owner is
   reported in check().overwrote (my consequence, to confirm: they get a changed event naming the new owner).
   Ownership (Matthew's answer: take ownership by changing; consequences reading to confirm): any writer may set/ref/add/remove/delta;
   an accepted change makes that writer the path's owner (w.owner[path]); ownership is recorded and reported, never rejects.
   Explicit claims/locks are not modelled (open question for Matthew).
   Empty batch (ops: []) is a no-change input and always succeeds with the atlas unchanged ("changes must never fail").
   Working rules (Nov 2, working rule, Matthew to confirm): add of an existing LIST member = accepted no-op; add on an existing
   scalar/field path = rejected ('exists'; replace is set); remove of a missing member = accepted no-op; ref has no stale-revision check,
   like set (ownership by acting, latest accepted wins). No-ops return '' (accepted, nothing written, no owner/revision change).
   An accepted outcome carries changed:[{path, from}] — from = previous owner (null if none) — the shape of the `changed` event
   (shape agreed with codec, Matthew to confirm). */
function applyOp(w, o, proc, baseRev) {
  const P = o.path.split('/'), key = P.pop(); let par = w; for (const s of P) { par = par && typeof par === 'object' ? par[s] : undefined; }
  if (!par || typeof par !== 'object' || Array.isArray(par)) return 'missing-parent';
  const has = Object.prototype.hasOwnProperty.call(par, key), cur = par[key];
  if (o.op === 'add') { if (!has) { par[key] = o.value; return null; } if (Array.isArray(cur)) { if (cur.indexOf(o.value) >= 0) return ''; cur.push(o.value); return null; } return 'exists'; }
  if (!has) return 'missing-path';
  if (o.op === 'remove') { if (!Array.isArray(cur)) return 'not-array'; const i = cur.indexOf(o.value); if (i < 0) return ''; cur.splice(i, 1); return null; }
  if (o.op === 'delta') { if (typeof cur !== 'number') return 'not-number'; par[key] = cur + o.value; return null; }
  if (o.op === 'ref') { if (!(cur === null || typeof cur === 'string')) return 'type-change'; par[key] = o.value; return null; }
  if (cur !== null && T(cur) !== T(o.value)) return 'type-change';
  par[key] = o.value; return null;
}
/* All-or-nothing: try on a copy of the touched roots; the rejection names the failing op. */
function check(w, p) {
  const s = shape(p); if (s.length) return { ok: false, op: -1, reason: 'invalid: ' + s.join(', ') };
  const roots = {}; p.ops.forEach(o => { const [c, id] = o.path.split('/'); (roots[c] = roots[c] || new Set()).add(id); });
  const scratch = { pathRev: w.pathRev }; for (const c in roots) { scratch[c] = {}; roots[c].forEach(id => { if (w[c] && id in w[c]) scratch[c][id] = JSON.parse(JSON.stringify(w[c][id])); }); }
  const wrote = []; for (let i = 0; i < p.ops.length; i++) { const r = applyOp(scratch, p.ops[i], p.proc, p.baseRev); if (r) return { ok: false, op: i, path: p.ops[i].path, reason: r }; if (r === null && wrote.indexOf(p.ops[i].path) < 0) wrote.push(p.ops[i].path); }
  for (const c in roots) roots[c].forEach(id => { if (id in scratch[c]) w[c][id] = scratch[c][id]; });
  const changed = wrote.map(pa => ({ path: pa, from: (w.owner && w.owner[pa]) || null })), overwrote = []; p.ops.forEach(o => { if (wrote.indexOf(o.path) < 0) return; if ((o.op === 'set' || o.op === 'ref') && w.pathRev && (w.pathRev[o.path] || 0) > p.baseRev && w.owner[o.path] && w.owner[o.path] !== p.proc) overwrote.push({ path: o.path, prevOwner: w.owner[o.path] }); });
  if (wrote.length) { w.rev = (w.rev || 1000) + 1; w.owner = w.owner || {}; w.pathRev = w.pathRev || {}; wrote.forEach(pa => { w.owner[pa] = p.proc; w.pathRev[pa] = w.rev; }); }
  return { ok: true, rev: w.rev, owner: wrote.length ? p.proc : undefined, changed, overwrote };
}
/* Template check for ids not in the atlas (invented sample ids): the op passes if SOME real entity of that collection accepts it
   (same path below the id, same type rules). Nothing is written; output is counts only. */
function templateOk(w, o, proc) {
  const P = o.path.split("/"), c = P[0], coll = w[c]; if (!coll || typeof coll !== "object") return "missing-parent";
  let last = "missing-parent"; for (const id in coll) { const sc = {}; sc[c] = {}; sc[c][id] = JSON.parse(JSON.stringify(coll[id])); P[1] = id; const r = applyOp(sc, Object.assign({}, o, { path: P.join("/") }), proc); if (!r) return null; if (r !== "missing-parent") last = r; } return last;
}
function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
/* Invented atlas with the real shape (counts roughly 1/2 of ranking_atlas; values are placeholders). */
function synthAtlas(seed) {
  const r = rng(seed * 7 + 3), w = { clock: { joy: 'syn_clock', ms: 1000, on: true }, items: {}, joys: { syn_clock: { id: 'syn_clock', name: 'Clock', value: 0 } }, components: {} };
  for (let i = 1; i <= 90; i++) w.joys['syn_j' + i] = { id: 'syn_j' + i, name: 'Joy ' + i, value: r() < 0.18 ? 'text ' + i : Math.round(r() * 1000) };
  for (let i = 1; i <= 440; i++) { const it = w.items['syn_' + i] = { id: 'syn_' + i, name: 'Item ' + i, values: {}, state: {}, alts: {} }; if (r() < 0.37) it.values.start = '2027-01-' + String(1 + (i % 28)).padStart(2, '0'); }
  for (let i = 1; i <= 52; i++) { const it = w.items['syn_' + (i * 8)], m = []; for (let k = 0; k < 2 + (i % 4); k++) m.push('item:syn_' + (i * 8 + k + 1)); it.alts = { members: m, pref: null, unavail: [], method: 'best' }; }
  for (let i = 1; i <= 37; i++) w.components['syn_c' + i] = { id: 'syn_c' + i, name: 'Comp ' + i, items: [], sub: [], view: {}, state: {} };
  return w;
}
function gen(w, n, seed, ticks, cover) {
  const r = rng(seed), pick = a => a[Math.floor(r() * a.length)], int = (a, b) => a + Math.floor(r() * (b - a + 1));
  const I = Object.keys(w.items), J = Object.keys(w.joys).filter(k => typeof w.joys[k].value === 'number' && !(w.clock && k === w.clock.joy));
  const ALT = I.filter(k => w.items[k].alts && Array.isArray(w.items[k].alts.members) && w.items[k].alts.members.length);
  const C = Object.keys(w.components || {}), tickOk = ticks && w.clock && w.clock.on && w.joys[w.clock.joy] && typeof w.joys[w.clock.joy].value === 'number';
  const mix = MIX.filter(m => (tickOk || m[0] !== 'tick') && (ALT.length || !/pick|pref|unavail/.test(m[0]))), tot = mix.reduce((s, m) => s + m[1], 0);
  const kind = () => { let x = r() * tot; for (const m of mix) { if ((x -= m[1]) < 0) return m[0]; } return mix[0][0]; };
  const day = () => '2027-' + String(int(1, 12)).padStart(2, '0') + '-' + String(int(1, 28)).padStart(2, '0');
  const withStart = () => I.filter(k => w.items[k].values && 'start' in w.items[k].values), noStart = () => I.filter(k => w.items[k].values && !('start' in w.items[k].values));
  const mk = {
    pick: () => { const k = pick(ALT), a = w.items[k]; const has = a.state && 'userPick' in a.state; return [{ path: 'items/' + k + '/state/userPick', op: has ? 'ref' : 'add', value: has && r() < 0.15 ? null : pick(a.alts.members) }]; },
    pref: () => { const k = pick(ALT); return [{ path: 'items/' + k + '/alts/pref', op: 'ref', value: r() < 0.3 ? null : pick(w.items[k].alts.members) }]; },
    unavail: () => { const k = pick(ALT), a = w.items[k].alts; if (!Array.isArray(a.unavail)) return null; const m = pick(a.members); return [{ path: 'items/' + k + '/alts/unavail', op: a.unavail.indexOf(m) >= 0 ? 'remove' : 'add', value: m }]; },
    landed: () => { const k = pick(I), v = w.items[k].values; return v ? [{ path: 'items/' + k + '/values/landed', op: 'landed' in v ? 'set' : 'add', value: day() }] : null; },
    move: () => { const S = withStart(); return S.length ? [{ path: 'items/' + pick(S) + '/values/start', op: 'set', value: day() }] : null; },
    startAdd: () => { const S = noStart(); return S.length ? [{ path: 'items/' + pick(S) + '/values/start', op: 'add', value: day() }] : null; },
    delta: () => J.length ? Array.from({ length: int(1, 3) }, () => ({ path: 'joys/' + pick(J) + '/value', op: 'delta', value: Math.round((r() - 0.5) * 2000) / 10 })) : null,
    tick: () => [{ path: 'joys/' + w.clock.joy + '/value', op: 'delta', value: 1 }],
    text: () => [{ path: 'items/' + pick(I) + '/name', op: 'set', value: 'Placeholder ' + 'x'.repeat(int(4, 60)) }],
    member: () => { if (!C.length) return null; const c = pick(C), L = w.components[c].items; if (L.length && r() < 0.4) return [{ path: 'components/' + c + '/items', op: 'remove', value: pick(L) }]; return [{ path: 'components/' + c + '/items', op: 'add', value: 'item:' + pick(I) }]; },
    planner: () => { const m = cover ? int(10, 15) : r() < 0.8 ? int(10, 100) : int(100, 1000), S = withStart(), ops = [];
      for (let i = 0; i < m; i++) { const z = r(); if (z < 0.5 && S.length) ops.push({ path: 'items/' + pick(S) + '/values/start', op: 'set', value: day() }); else if (z < 0.8 && J.length) ops.push({ path: 'joys/' + pick(J) + '/value', op: 'delta', value: int(-500, 500) }); else if (ALT.length) { const k = pick(ALT); ops.push({ path: 'items/' + k + '/alts/pref', op: 'ref', value: pick(w.items[k].alts.members) }); } }
      return ops.length ? ops : null; }
  };
  let rev = 1000, t = 0, seq = 0, tries = 0; const out = [];
  while (out.length < n) {
    if (++tries > n * 50) throw new Error('could not generate valid proposals for this atlas');
    const k = cover && out.length < mix.length ? mix[out.length][0] : kind(), ops = mk[k](); if (!ops) continue;
    t += k === 'planner' ? int(600, 7200) : int(1, 40); rev = w.rev || 1000;
    const p = { id: 'p_' + (seq + 1).toString(36), proc: k === 'tick' ? 'clock' : k === 'planner' ? 'planner:syn_bot' : 'ui:syn_user', baseRev: rev, t, ops };
    if (k === 'planner') p.note = 'synthetic batch';
    const c = check(w, p); if (!c.ok) continue; seq++; out.push(p);
  }
  return out;
}
function selftest() {
  const ok = [], bad = [], t = (n, c) => (c ? ok : bad).push(n), w = synthAtlas(1);
  const before = JSON.stringify(w), P = (ops, proc, base) => ({ id: 'p_t', proc: proc || 'ui:other', baseRev: base == null ? 1000 : base, t: 1, ops });
  t('empty batch succeeds', check(w, P([])).ok); t('empty batch leaves atlas byte-identical', JSON.stringify(w) === before);
  const J = Object.keys(w.joys).filter(k => /^syn_j/.test(k) && typeof w.joys[k].value === 'number'), nj = J[0], jp = 'joys/' + J[1] + '/value';
  const w2 = JSON.parse(before), b2 = JSON.stringify(w2), r2 = check(w2, P([{ path: 'joys/' + nj + '/value', op: 'delta', value: 1 }, { path: 'items/syn_1/nope', op: 'set', value: 1 }]));
  t('rejected batch names failing op and is all-or-nothing', !r2.ok && r2.op === 1 && r2.reason === 'missing-path' && JSON.stringify(w2) === b2);
  const w3 = synthAtlas(1), pa = 'items/syn_3/name', Q = (proc, v, base) => check(w3, P([{ path: pa, op: 'set', value: v }], proc, base == null ? w3.rev || 1000 : base));
  t('first set takes ownership', Q('ui:a', 'a1').ok && w3.owner[pa] === 'ui:a');
  t('another writer may set (takes ownership, never blocked by owner)', Q('ui:b', 'b1').ok && w3.owner[pa] === 'ui:b');
  t('ref by another writer allowed and takes ownership', check(w3, P([{ path: 'items/syn_8/alts/pref', op: 'ref', value: 'item:syn_9' }], 'ui:c', w3.rev)).ok && w3.owner['items/syn_8/alts/pref'] === 'ui:c');
  t('delta/add take ownership too', check(w3, P([{ path: jp, op: 'delta', value: 1 }, { path: 'items/syn_8/alts/unavail', op: 'add', value: 'item:syn_9' }], 'ui:d', w3.rev)).ok && w3.owner[jp] === 'ui:d' && w3.owner['items/syn_8/alts/unavail'] === 'ui:d');
  const old = w3.pathRev[pa] - 1, rs = Q('ui:a', 'late', old);
  t('older-base set accepted: latest accepted wins, takes ownership', rs.ok && w3.items.syn_3.name === 'late' && w3.owner[pa] === 'ui:a');
  t('overwritten previous owner is reported', rs.overwrote.length === 1 && rs.overwrote[0].prevOwner === 'ui:b' && rs.overwrote[0].path === pa);
  t('revision still recorded per path', w3.pathRev[pa] === w3.rev);
  t('older-base delta still accepted and adds up', check(w3, P([{ path: jp, op: 'delta', value: 1 }], 'ui:a', 0)).ok);
  t('fresh set after reading current rev accepted', Q('ui:a', 'a2').ok && w3.owner[pa] === 'ui:a');
  /* working rules (Nov 2, working rule, Matthew to confirm) */
  const w4 = synthAtlas(1), up = 'items/syn_8/alts/unavail', R4 = (ops, proc) => check(w4, P(ops, proc, w4.rev || 1000));
  R4([{ path: up, op: 'add', value: 'item:syn_9' }], 'ui:a'); const s4 = JSON.stringify(w4.items.syn_8), rv4 = w4.rev, ra = R4([{ path: up, op: 'add', value: 'item:syn_9' }], 'ui:b');
  t('add of an existing list member is an accepted no-op', ra.ok && JSON.stringify(w4.items.syn_8) === s4 && w4.rev === rv4 && !ra.changed.length);
  const rx = R4([{ path: 'items/syn_3/name', op: 'add', value: 'x' }], 'ui:b');
  t('add on an existing scalar/field path is rejected (replace is set)', !rx.ok && rx.reason === 'exists' && rx.op === 0);
  const rm = R4([{ path: up, op: 'remove', value: 'item:syn_nope' }], 'ui:b');
  t('remove of a missing member is an accepted no-op', rm.ok && JSON.stringify(w4.items.syn_8) === s4 && !rm.changed.length);
  const pp = 'items/syn_8/alts/pref'; R4([{ path: pp, op: 'ref', value: 'item:syn_9' }], 'ui:a'); const rr = check(w4, P([{ path: pp, op: 'ref', value: null }], 'ui:b', 0));
  t('older-base ref accepted like set (no stale check, latest wins)', rr.ok && w4.items.syn_8.alts.pref === null && w4.owner[pp] === 'ui:b');
  t('accepted outcome carries changed:[{path, from}] with from = previous owner', rr.changed.length === 1 && rr.changed[0].path === pp && rr.changed[0].from === 'ui:a');
  return { ok, bad };
}
root.Exp7Proposals={selftest,gen,check,shape,applyOp,synthAtlas,MIX,OPS};})(globalThis);

