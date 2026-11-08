/* JRender: jrender-exp7/jrender.classic.js (70442 B, sha1 ebbc07d4c7e9270cf25cf97962fd8eec6a537384), unchanged */
/* jrender.classic.js: generated from jrender.js by tools/exp7/build_classic.py. Do not edit. */
(function (root) {
"use strict";
// jrender.js: reusable JS glue for JRender (Rust -> Wasm + WebGPU). ES module, no dependencies, ASCII only.
// Two layers:
//   Core      : the wasm instance without any GPU (works in Node): fonts, text measure, draw-list scenes, patches, input, events.
//   Renderer  : Core + WebGPU on one canvas: draws one or several draw-list scenes (legacy JRB scenes keep their own shipped glue).
// Builders DL (draw list) and Patch write the binary formats documented in API.md. Per frame, JS only uploads the dirty
// vertex ranges the wasm reports and issues one draw call per contiguous vertex range (usually one per scene).
const EV = { ENTER: 1, LEAVE: 2, DOWN: 3, UP: 4, CLICK: 5, SCROLL: 6, WHEEL: 7, KEYDOWN: 8, KEYUP: 9, MOVE: 10, CANCEL: 11, DRAGSTART: 12, DRAG: 13, DRAGEND: 14 };
const EVNAME = ['', 'enter', 'leave', 'down', 'up', 'click', 'scroll', 'wheel', 'keydown', 'keyup', 'move', 'cancel', 'dragstart', 'drag', 'dragend'];
const NF = { HIT: 1, HIDDEN: 2, MOVE: 4, XF: 8, DRAG: 16 };      // node flags (DRAG: opt in to drag events and touch drags)
const MOD = { SHIFT: 1, CTRL: 2, ALT: 4, META: 8 };
const RS = { BOLD: 1, ITALIC: 2, UNDERLINE: 4, STRIKE: 8, CHIP: 16 }; // rich text run style bits
const GF = { SCROLL_X: 1, SCROLL_Y: 2 };               // group flags
const F = { VERTS: 1, GROUPS: 2, UNI: 4, RANGES: 8, REALLOC: 16, EVENTS: 32, CURSOR: 64, CURSOR_PTR: 128 };
const rgba = (r, g, b, a = 255) => ((r & 255) | (g & 255) << 8 | (b & 255) << 16 | (a & 255) << 24) >>> 0;
const hex = (s) => { s = s.replace('#', ''); if (s.length <= 4) s = [...s].map(c => c + c).join(''); const n = [0, 2, 4, 6].map(i => i < s.length ? parseInt(s.substr(i, 2), 16) : 255); return rgba(n[0], n[1], n[2], n[3]); };

// ---------- text-embedded binaries (single-file pages) ----------
// base64 or basE91 text (whitespace ignored) -> Uint8Array. basE91 is ~23% vs base64's 33% overhead; see tools/exp7/embed.py.
const b64ToBytes = (t) => { t = t.replace(/[^A-Za-z0-9+/]/g, ''); if (typeof atob === 'function') { const s = atob(t), o = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) o[i] = s.charCodeAt(i); return o; } return new Uint8Array(Buffer.from(t, 'base64')); };
const B91 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&()*+,./:;<=>?@[]^_`{|}~"';
const b91ToBytes = (t) => { const D = new Int16Array(256).fill(-1); for (let i = 0; i < 91; i++) D[B91.charCodeAt(i)] = i;
  const o = new Uint8Array(Math.ceil(t.length * 0.82) + 4); let n = 0, v = -1, b = 0, k = 0;
  for (let i = 0; i < t.length; i++) { const c = D[t.charCodeAt(i)]; if (c < 0) continue; if (v < 0) { v = c; continue; } v += c * 91; b |= v << k; k += (v & 8191) > 88 ? 13 : 14; do { o[n++] = b & 255; b >>>= 8; k -= 8; } while (k > 7); v = -1; }
  if (v >= 0) o[n++] = (b | v << k) & 255; return o.slice(0, n); };
// read a <script type="text/plain" id=...> block written by embed.py (data-enc="b91" or "b64")
const embedded = (id) => { const e = document.getElementById(id); return e.getAttribute('data-enc') === 'b91' ? b91ToBytes(e.textContent) : b64ToBytes(e.textContent); };

// ---------- binary builders ----------
class Words {
  constructor(magic) { this.u = new Uint32Array(256); this.f = new Float32Array(this.u.buffer); this.n = 0; this.w(magic); this.w(1); }
  grow(k) { if (this.n + k <= this.u.length) return; let m = this.u.length * 2; while (m < this.n + k) m *= 2; const u = new Uint32Array(m); u.set(this.u); this.u = u; this.f = new Float32Array(u.buffer); }
  w(v) { this.grow(1); this.u[this.n++] = v >>> 0; return this; }
  fl(v) { this.grow(1); this.f[this.n++] = v; return this; }
  op(code, n) { this.w(code << 24 | n); return this; }
  bytes() { return new Uint8Array(this.u.buffer, 0, this.n * 4).slice(); }
}
const MAGIC_DL = 0x4c44524a, MAGIC_P = 0x5044524a; // "JRDL", "JRDP" little-endian
// shape items shared by DL nodes and Patch.replace
const Items = (B) => class extends B {
  rect(x, y, w, h, c) { return this.op(2, 5).fl(x).fl(y).fl(w).fl(h).w(c); }
  rrect(x, y, w, h, r, c) { return this.op(3, 6).fl(x).fl(y).fl(w).fl(h).fl(r).w(c); }
  border(x, y, w, h, r, bw, c) { return this.op(6, 7).fl(x).fl(y).fl(w).fl(h).fl(r).fl(bw).w(c); }
  // cmds: [['M',x,y],['L',x,y],['Q',cx,cy,x,y],['C',c1x,c1y,c2x,c2y,x,y],['Z']]; evenodd: true for the even-odd rule (else nonzero)
  path(cmds, c, evenodd = false) { const V = { M: 0, L: 1, Q: 2, C: 3, Z: 4 }; let n = 2; for (const k of cmds) n += k.length; this.op(4, n).w(evenodd ? 1 : 0).w(c);
    for (const k of cmds) { this.w(V[k[0]]); for (let i = 1; i < k.length; i++) this.fl(k[i]); } return this; }
  // text run: x, baseline y, px size, colour, font id; opts { maxw, align: 0 left | 1 center | 2 right, ellipsis }
  text(x, y, size, c, font, str, o = {}) { const cp = []; for (const ch of String(str)) cp.push(ch.codePointAt(0));
    this.op(5, 9 + cp.length).fl(x).fl(y).fl(size).w(c).w(font).fl(o.maxw || 0).w(o.align || 0).w(o.ellipsis ? 1 : 0).w(cp.length); for (const v of cp) this.w(v); return this; }
  // wrapped text box: greedy word wrap in wasm within maxw; opts { align, ellipsis (on the last line), lineHeight (0 = 1.25 x size),
  // maxLines (0 = no limit) }. Newline is a hard break; overlong words break by character. y is the first baseline.
  textBox(x, y, size, c, font, str, maxw, o = {}) { const cp = []; for (const ch of String(str)) cp.push(ch.codePointAt(0));
    this.op(8, 11 + cp.length).fl(x).fl(y).fl(size).w(c).w(font).fl(maxw).w(o.align || 0).w(o.ellipsis ? 1 : 0).fl(o.lineHeight || 0).w(o.maxLines || 0).w(cp.length); for (const v of cp) this.w(v); return this; }
  // mixed-style wrapped text: runs [{ text, font, size, color, bold, italic, underline, strike, bg, pad, radius, hit }], y = top of the
  // first line. opts { maxWidth, align: 0|1|2 or 'left'|'center'|'right', ellipsis, lineHeight (FACTOR default 1.25, NOT px; >4 treated as absolute px / max-run-size), maxLines,
  // font, size, color (run defaults), boldFont (font used by bold runs; without it bold is a synthetic embolden in wasm) }.
  // A run with hit: id gets its own hit region per line piece (events carry that id).
  richText(x, y, runs, o = {}) { const p = richWords(x, y, runs, o); this.op(9, p.length); for (const v of p) v[0] ? this.fl(v[1]) : this.w(v[1]); return this; }
  // explicit hit rect (node content space). A HIT item also sets the node's HIT flag.
  hit(x, y, w, h) { return this.op(7, 4).fl(x).fl(y).fl(w).fl(h); }
};
const ALIGN = { left: 0, center: 1, right: 2 };
// richText/richLayout lineHeight is a FACTOR (default 1.25), unlike textBox/wrap which use absolute CSS px.
// Values > 4 are almost always host misuse (passing px); convert to factor using the max run size so layout stays sane.
function richLineHeight(runs, o) {
  let lh = o.lineHeight || 0; if (!(lh > 0)) return 0; // 0 -> wasm default 1.25
  if (lh <= 4) return lh;
  let mx = 0; for (const r of runs) { const sz = r.size ?? o.size ?? 0; if (sz > mx) mx = sz; }
  if (!(mx > 0)) mx = o.size || 16;
  return lh / mx;
}
function richWords(x, y, runs, o) { const W = [[1, x], [1, y], [1, o.maxWidth || o.maxw || 0], [0, typeof o.align === 'string' ? ALIGN[o.align] || 0 : o.align || 0], [0, o.ellipsis ? 1 : 0], [1, richLineHeight(runs, o)], [0, o.maxLines || 0], [0, runs.length]];
  for (const r of runs) { const cp = []; for (const ch of String(r.text ?? '')) cp.push(ch.codePointAt(0)); let font = r.font ?? o.font ?? 0, st = 0;
    if (r.bold) { const bf = r.boldFont ?? o.boldFont; if (bf != null && r.font == null) font = bf; else st |= RS.BOLD; }
    if (r.italic) st |= RS.ITALIC; if (r.underline) st |= RS.UNDERLINE; if (r.strike) st |= RS.STRIKE; if (r.bg != null) st |= RS.CHIP;
    W.push([0, font], [1, r.size ?? o.size ?? 16], [0, r.color ?? o.color ?? rgba(0, 0, 0)], [0, st], [0, r.bg ?? 0], [1, r.pad ?? (r.bg != null ? 3 : 0)], [1, r.radius ?? 0], [0, r.hit || 0], [0, cp.length]);
    for (const v of cp) W.push([0, v]); }
  return W; }
const Struct = (B) => class extends Items(B) {
  // node: id (u32, 0 = anonymous, not patchable), flags NF.*, optional affine [a b c d e f]
  node(id, flags = 0, xf = null) { if (xf) { this.op(1, 8).w(id).w(flags | NF.XF); for (const v of xf) this.fl(v); } else this.op(1, 2).w(id).w(flags & ~NF.XF); return this; }
  // clip / scroll group: rect in the parent's content space, content size for scrolling; children until end()
  group(id, flags, x, y, w, h, cw = w, ch = h) { return this.op(0x10, 8).w(id).w(flags).fl(x).fl(y).fl(w).fl(h).fl(cw).fl(ch); }
  end() { return this.op(0x11, 0); }
};
class DL extends Struct(Words) { constructor() { super(MAGIC_DL); } }
class Patch extends Struct(Words) {
  constructor() { super(MAGIC_P); }
  remove(id) { return this.op(0x20, 1).w(id); }
  insert(before, fn) { this.op(0x21, 1).w(before); fn(this); return this.op(0x2f, 0); } // before = 0: append at the root
  append(gid, fn) { this.op(0x22, 1).w(gid); fn(this); return this.op(0x2f, 0); }
  // replace a node's items (and hit rect: none unless fn adds hit()). With flags given (REPLACE_F) the node flags are set too.
  replace(id, fn, flags) { if (flags === undefined) this.op(0x23, 1).w(id); else this.op(0x29, 2).w(id).w(flags & ~NF.XF); fn(this); return this.op(0x2f, 0); }
  // recolour one item of a node (item index in the node's item order, hit() not counted); in place, no re-tessellation
  colorItem(id, index, c) { return this.op(0x2a, 3).w(id).w(index).w(c); }
  xform(id, m) { this.op(0x24, 7).w(id); for (const v of m) this.fl(v); return this; }
  scroll(gid, x, y) { return this.op(0x25, 3).w(gid).fl(x).fl(y); }
  flags(id, f) { return this.op(0x26, 2).w(id).w(f); }
  color(id, c) { return this.op(0x27, 2).w(id).w(c); }
  grect(gid, x, y, w, h, cw = w, ch = h) { return this.op(0x28, 7).w(gid).fl(x).fl(y).fl(w).fl(h).fl(cw).fl(ch); }
}

// ---------- Core (no GPU) ----------
class Core {
  // wasm: BufferSource | WebAssembly.Module | Response promise
  // throws a plain Error with .code no-wasm (no WebAssembly in this context) or bad-wasm (compile / instantiate failed)
  static async create(wasm) { if (typeof WebAssembly === 'undefined') throw fail('no-wasm (WebAssembly is not available in this context)');
    let m; try { m = wasm instanceof WebAssembly.Module ? wasm : await WebAssembly.compile(wasm instanceof ArrayBuffer || ArrayBuffer.isView(wasm) ? wasm : await (await wasm).arrayBuffer()); } catch (e) { throw fail('bad-wasm (compile failed)', e); }
    const c = new Core(); try { c.x = (await WebAssembly.instantiate(m, {})).exports; } catch (e) { throw fail('bad-wasm (instantiate failed)', e); } c.mod = m; return c; }
  mem(p, n) { return new Uint8Array(this.x.memory.buffer, p, n); }
  put(bytes) { const p = this.x.jrd_alloc(bytes.byteLength); this.mem(p, bytes.byteLength).set(bytes); }
  putCps(str) { const cp = []; for (const ch of String(str)) cp.push(ch.codePointAt(0)); this.put(new Uint8Array(new Uint32Array(cp).buffer)); return cp.length; }
  font(bytes) { this.put(bytes); const id = this.x.jrd_font(); if (id < 0) throw Error('bad JRF font'); return id; }
  measure(font, size, str) { this.putCps(str); return this.x.jrd_measure(font, size); }
  fit(font, size, str, maxw, ellipsis = true) { this.putCps(str); return this.x.jrd_fit(font, size, maxw, ellipsis ? 1 : 0); }
  // greedy word wrap in wasm: { count, height (count * lineHeight), lineHeight, lines: [{ start, end, ellipsis, width, text }] }
  // (start/end index codepoints of str). opts { maxLines, ellipsis, lineHeight }
  wrap(font, size, str, maxw, o = {}) { const cps = [...String(str)]; this.putCps(str); const n = this.x.jrd_wrap(font, size, maxw, o.maxLines || 0, o.ellipsis ? 1 : 0);
    const u = new Uint32Array(this.x.memory.buffer, this.x.jrd_wrap_ptr(), n * 4), f = new Float32Array(u.buffer, u.byteOffset, n * 4), lines = [];
    for (let i = 0; i < n; i++) lines.push({ start: u[i * 4], end: u[i * 4 + 1], ellipsis: !!u[i * 4 + 2], width: f[i * 4 + 3], text: cps.slice(u[i * 4], u[i * 4 + 1]).join('') });
    const lh = o.lineHeight || size * 1.25; return { count: n, height: n * lh, lineHeight: lh, lines }; }
  // caret stops: n + 1 cumulative x offsets (px) for the n codepoints of str
  advances(font, size, str) { this.putCps(str); const n = this.x.jrd_advances(font, size); return new Float32Array(this.x.memory.buffer, this.x.jrd_wrap_ptr(), n).slice(); }
  // rich text layout (same code as drawing): { count, height, width, lines: [{ top, baseline, height, width }], frags: [{ run, start, end
  // (codepoints in the run), line, x, y, w, h (box, chip padding included), textX, ellipsis, text }], runRects: [[{x, y, w, h}...] per run] }
  richLayout(runs, o = {}, x = 0, y = 0) { const p = richWords(x, y, runs, o), u = new Uint32Array(p.length), fv = new Float32Array(u.buffer); p.forEach((v, i) => v[0] ? fv[i] = v[1] : u[i] = v[1]);
    this.put(new Uint8Array(u.buffer)); const L = this.x.jrd_rich(), NF_ = this.x.jrd_rich_frags(), b = this.x.memory.buffer, q = this.x.jrd_wrap_ptr(), U = new Uint32Array(b, q, L * 4 + NF_ * 10), Fv = new Float32Array(b, q, L * 4 + NF_ * 10);
    const lines = [], frags = [], runRects = runs.map(() => []); for (let i = 0; i < L; i++) lines.push({ top: Fv[i * 4], baseline: Fv[i * 4 + 1], height: Fv[i * 4 + 2], width: Fv[i * 4 + 3] });
    for (let i = 0; i < NF_; i++) { const k = L * 4 + i * 10, run = U[k], fr = { run, start: U[k + 1], end: U[k + 2], line: U[k + 3], x: Fv[k + 4], y: Fv[k + 5], w: Fv[k + 6], h: Fv[k + 7], textX: Fv[k + 8], ellipsis: !!U[k + 9] };
      fr.text = fr.ellipsis ? '' : [...String(runs[run].text ?? '')].slice(fr.start, fr.end).join(''); frags.push(fr); if (!fr.ellipsis) runRects[run].push({ x: fr.x, y: fr.y, w: fr.w, h: fr.h }); }
    return { count: L, height: lines.reduce((s, l) => s + l.height, 0), width: lines.reduce((m, l) => Math.max(m, l.width), 0), lines, frags, runRects }; }
  // glyph coverage: missing characters draw (and measure) as the notdef box; control characters have no width or ink
  hasGlyph(font, cp) { return !!this.x.jrd_has_glyph(font, typeof cp === 'string' ? cp.codePointAt(0) : cp); }
  coverage(font) { const out = []; for (let i = 0; ; i++) { const c = this.x.jrd_glyph_cp(font, i) >>> 0; if (c === 0xffffffff) return out; out.push(c); } }
  metrics(font) { return { upm: this.x.jrd_font_metrics(font, 0), asc: this.x.jrd_font_metrics(font, 1), desc: this.x.jrd_font_metrics(font, 2), glyphs: this.x.jrd_font_metrics(font, 3) }; }
  createScene(w, h, dpr = 1) { const hd = this.x.jrd_create(w, h, dpr); const s = new DLScene(this, hd); s.w = w; s.hh = h; return s; }
  wasmBytes() { return this.x.memory.buffer.byteLength; }
}
class DLScene {
  constructor(core, h) { this.core = core; this.x = core.x; this.h = h; this.onevent = null; this.gpu = null; }
  load(dl) { this.core.put(dl instanceof Uint8Array ? dl : dl.bytes()); const r = this.x.jrd_load(this.h); if (r < 0) throw Error('draw list rejected (' + r + ')'); this.kick(); return r; }
  patch(p) { this.core.put(p instanceof Uint8Array ? p : p.bytes()); const r = this.x.jrd_patch(this.h); if (r < 0) throw Error('patch rejected (' + r + ')'); this.kick(); return r; }
  resize(w, h, dpr) { this.x.jrd_resize(this.h, w, h, dpr); this.w = w; this.hh = h; this.kick(); }
  // kind 0 move, 1 down, 2 up, 3 leave, 4 cancel; mods MOD.* bits
  pointer(kind, x, y, buttons = 0, pointerId = 1, mods = 0) { this.x.jrd_pointer2(this.h, kind, x, y, buttons, pointerId, mods); return this.dispatch(); }
  dragThreshold(px) { this.x.jrd_drag_threshold(this.h, px); }
  nodeFlags(id) { return this.x.jrd_node_flags(this.h, id) >>> 0; }
  // extra event listeners (onevent stays the single primary handler); returns an unsubscribe function
  on(fn) { (this.L ||= []).push(fn); return () => { this.L = this.L.filter(f => f !== fn); }; }
  wheel(x, y, dx, dy) { this.x.jrd_wheel(this.h, x, y, dx, dy); this.kick(); return this.dispatch(); }
  key(down, code) { this.x.jrd_key(this.h, down ? 1 : 0, code); return this.dispatch(); }
  scroll(gid, x, y) { this.x.jrd_scroll(this.h, gid, x, y); this.kick(); }
  scrollAt(x, y) { const r = this.x.jrd_scroll_at(this.h, x, y) >>> 0; return r === 0xffffffff ? null : r; } // innermost scroll group under (x, y)
  scrollPos(gid) { return [this.x.jrd_scroll_x(this.h, gid), this.x.jrd_scroll_y(this.h, gid)]; }
  hit(x, y) { const r = this.x.jrd_hit(this.h, x, y) >>> 0; return r === 0xffffffff ? null : r; }
  compact() { this.x.jrd_compact(this.h); this.kick(); }
  flags() { return this.x.jrd_flags(this.h); }
  buf(k) { return this.core.mem(this.x.jrd_ptr(this.h, k), this.x.jrd_len(this.h, k)); }
  // event polling: returns [{kind, type, id, x, y (node content space), sx, sy (scene px), vx, vy (canvas CSS px, set by attach), buttons,
  // a, b (drag: dx, dy from the down point; scroll: position; wheel: deltas), code, pointerId, mods, shift, ctrl, alt, meta}] and clears the queue
  events() { const n = this.x.jrd_len(this.h, 5) >> 2; if (!n) return []; const p = this.x.jrd_ptr(this.h, 5), u = new Uint32Array(this.x.memory.buffer, p, n), f = new Float32Array(this.x.memory.buffer, p, n), out = []; const o = this.vo || [0, 0];
    for (let i = 0; i < n; i += 12) { const m = u[i + 11]; out.push({ kind: u[i], type: EVNAME[u[i]] || '?', id: u[i + 1] === 0xffffffff ? null : u[i + 1], x: f[i + 2], y: f[i + 3], buttons: u[i + 4], a: f[i + 5], b: f[i + 6], code: u[i + 7],
      sx: f[i + 8], sy: f[i + 9], vx: f[i + 8] + o[0], vy: f[i + 9] + o[1], pointerId: u[i + 10], mods: m, shift: !!(m & 1), ctrl: !!(m & 2), alt: !!(m & 4), meta: !!(m & 8) }); }
    this.x.jrd_events_clear(this.h); return out; }
  dispatch() { const fl = this.flags(); if (fl & F.CURSOR && this.oncursor) this.oncursor(!!(fl & F.CURSOR_PTR)); if (!(fl & F.EVENTS)) { this.kick(); return []; }
    const ev = this.events(); for (const e of ev) { if (this.onevent) this.onevent(e); if (this.L) for (const f of this.L) f(e); } this.kick(); return ev; }
  kick() { if (this.gpu) this.gpu.r.request(); }
  free() { if (this.gpu) this.gpu.free(); this.x.jrd_free(this.h); this.h = 0; }
}

// ---------- Renderer (WebGPU) ----------
const BLEND = { srcFactor: 'one', dstFactor: 'one-minus-src-alpha' };
const fail = (m, e) => { const x = new Error('JRender: ' + m + (e && e.message ? ': ' + e.message : '')); x.code = m.split(' ')[0]; return x; };
// Shared GPU context: one device, shader module and pipeline per (device, format), reused by every Renderer that gets it.
// GPUContext.create({ device?, powerPreference? }) -> ctx; new Renderer per canvas via Renderer.init({ context: ctx, canvas }).
// ctx.destroy() destroys the device only if the context created it; Renderer.destroy() never touches shared objects.
class GPUContext {
  static async create(o = {}) {
    const g = typeof navigator !== 'undefined' ? navigator.gpu : undefined;
    if (!g) throw fail('no-webgpu (navigator.gpu is missing: this browser or context has no WebGPU)');
    const c = new GPUContext(); c.gpu = g; c.pipes = new Map(); c.users = 0; c.lost = false; c.rs = new Set(); c.opts = o; await c.open(o.device); return c;
  }
  async open(device) { const g = this.gpu; let dev = device, own = false;
    if (!dev) { let ad; try { ad = await g.requestAdapter(this.opts.powerPreference ? { powerPreference: this.opts.powerPreference } : undefined); } catch (e) { throw fail('no-adapter (requestAdapter threw)', e); }
      if (!ad) throw fail('no-adapter (requestAdapter returned null: no usable GPU)');
      try { dev = await ad.requestDevice(); } catch (e) { throw fail('no-device (requestDevice failed)', e); }
      if (!dev) throw fail('no-device (requestDevice returned nothing)'); own = true; }
    this.dev = dev; this.own = own; this.fmt = g.getPreferredCanvasFormat(); this.pipes.clear(); this.mod = this.bgl = null; this.lost = false; this.destroyed = false;
    // device loss (driver reset, GPU process crash, tab backgrounded on some mobiles, or device.destroy() by someone else): renderers stop
    // drawing and get ondevicelost(Error code 'device-lost'); recover() opens a new device and re-uploads every scene from wasm
    dev.lost?.then?.((info) => { if (this.dev !== dev || this.destroyed) return; this.lost = true; this.lostInfo = info;
      const err = fail('device-lost (' + (info && info.reason || 'unknown') + (info && info.message ? ': ' + info.message : '') + ')'); for (const r of this.rs) r.lostDevice(err); }); }
  // new device (or the one given, for contexts created around an outside device) and every attached renderer rebound to it
  async recover(o = {}) { if (!this.own && !o.device) throw fail('no-device (recover() on a shared outside device needs { device })'); await this.open(o.device); this.own = !o.device; for (const r of this.rs) r.rebind(); }
  // pipeline (and bind group layout) for a colour format, built once per context
  pipeline(core, fmt = this.fmt) { let p = this.pipes.get(fmt); if (p) return p; const dev = this.dev, x = core.x, V = GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT;
    this.mod ||= dev.createShaderModule({ code: new TextDecoder().decode(core.mem(x.jrd_ptr(0, 6), x.jrd_len(0, 6))) });
    this.bgl ||= dev.createBindGroupLayout({ entries: [{ binding: 0, visibility: V, buffer: {} }, { binding: 1, visibility: V, buffer: { type: 'read-only-storage' } }] });
    p = dev.createRenderPipeline({ layout: dev.createPipelineLayout({ bindGroupLayouts: [this.bgl] }), multisample: { count: 4 }, primitive: { cullMode: 'none' },
      vertex: { module: this.mod, entryPoint: 'vs', buffers: [{ arrayStride: 16, attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x2' }, { shaderLocation: 1, offset: 8, format: 'unorm8x4' }, { shaderLocation: 2, offset: 12, format: 'uint32' }] }] },
      fragment: { module: this.mod, entryPoint: 'fs', targets: [{ format: fmt, blend: { color: BLEND, alpha: BLEND } }] } });
    this.pipes.set(fmt, p); this.builds = (this.builds || 0) + 1; return p; }
  destroy() { this.destroyed = true; this.pipes.clear(); this.mod = this.bgl = null; if (this.own) this.dev.destroy(); this.dev = null; }
}
class Renderer {
  // opts: { canvas, wasm | core, context? (shared GPUContext), device?, clear: [r,g,b,a], readback? }. Throws a plain Error
  // whose message starts with 'JRender: ' and whose .code is one of no-webgpu, no-adapter, no-device, no-canvas-context, no-wasm, bad-wasm.
  static async init(o) {
    const r = new Renderer(); r.c = o.canvas; r.clear = o.clear || [0, 0, 0, 1]; r.alphaMode = o.alphaMode || (r.clear[3] < 1 ? 'premultiplied' : 'opaque'); r.readback = !!o.readback;
    r.gc = o.context || await GPUContext.create({ device: o.device }); r.ownGc = !o.context; r.gc.users++;
    r.core = o.core || await Core.create(o.wasm); r.dev = r.gc.dev; r.fmt = r.gc.fmt;
    try { r.ctx = r.c.getContext('webgpu'); } catch (e) { throw fail('no-canvas-context (canvas.getContext("webgpu") threw)', e); }
    if (!r.ctx) throw fail('no-canvas-context (canvas.getContext("webgpu") returned null: canvas already has another context?)');
    r.M = { buf: 0, tex: 0, peak: 0 }; r.entries = []; r.raf = 0; r.fields = [];
    r.pipe = r.gc.pipeline(r.core, r.fmt); r.bgl = r.gc.bgl; r.gc.rs.add(r);
    r.ca = { view: null, resolveTarget: null, loadOp: 'clear', clearValue: r.clear, storeOp: 'discard' };
    r.rp = { colorAttachments: [r.ca] };
    return r;
  }
  lostDevice(err) { this.lost = err; if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(this.raf); this.raf = 0; this.msaa = null;
    for (const e of this.entries) if (e.scene.gpu) Object.assign(e.scene.gpu, { vb: null, gb: null, ub: null, bg: null, ranges: new Uint32Array(0) });
    this.M.buf = 0; this.M.tex = 0; if (this.ondevicelost) this.ondevicelost(err); else if (typeof console !== 'undefined') console.warn(err.message);
    if (typeof CustomEvent === 'function' && this.c.dispatchEvent) this.c.dispatchEvent(new CustomEvent('jrender-devicelost', { detail: err })); }
  // after gc.recover(): new pipeline, canvas reconfigured, all scene buffers re-uploaded from wasm on the next draw
  rebind() { this.lost = null; this.dev = this.gc.dev; this.fmt = this.gc.fmt; this.pipe = this.gc.pipeline(this.core, this.fmt); this.bgl = this.gc.bgl;
    for (const e of this.entries) if (e.scene.gpu) Object.assign(e.scene.gpu, { vb: null, gb: null, ub: null, bg: null, ranges: new Uint32Array(0) });
    if (this.cw > 0 && this.chh > 0) this.resize(this.cw, this.chh, this.dpr, this.devW, this.devH); if (this.onrecovered) this.onrecovered(); }
  // recover from a lost device: a context this renderer owns gets a new device; a shared one is recovered once for all its renderers
  async recover(o) { await this.gc.recover(o); }
  pk() { this.M.peak = Math.max(this.M.peak, this.M.buf + this.M.tex); }
  buffer(old, size, usage) { if (old && old.size >= size) return old; if (old) { this.M.buf -= old.size; old.destroy(); } const b = this.dev.createBuffer({ size: Math.max(256, Math.ceil(size * 1.25 / 256) * 256), usage: usage | GPUBufferUsage.COPY_DST }); this.M.buf += b.size; this.pk(); return b; }
  // canvas backing store in device px (css size * dpr); scenes are placed in CSS px within it
  // A zero, negative or NaN size (display: none, a closed <details>, a collapsed flex item at first layout) does not configure a 1x1
  // canvas: the renderer marks itself hidden, keeps its scenes and draws nothing until a later resize with a real size. devW / devH
  // (optional) give the exact backing size in device px (ResizeObserver device-pixel-content-box) instead of round(css * dpr).
  resize(cssW, cssH, dpr, devW, devH) { if (!(cssW > 0 && cssH > 0 && dpr > 0)) { this.hidden = true; return; } this.hidden = false; if (this.lost) { this.cw = cssW; this.chh = cssH; this.dpr = dpr; return; }
    this.cw = cssW; this.chh = cssH; this.dpr = dpr; this.devW = devW; this.devH = devH; this.c.width = Math.max(1, devW > 0 ? devW : Math.round(cssW * dpr)); this.c.height = Math.max(1, devH > 0 ? devH : Math.round(cssH * dpr));
    this.ctx.configure({ device: this.dev, format: this.fmt, alphaMode: this.alphaMode, usage: GPUTextureUsage.RENDER_ATTACHMENT | (this.readback ? GPUTextureUsage.COPY_SRC : 0) }); this.msaa?.destroy();
    const t = (format) => this.dev.createTexture({ size: [this.c.width, this.c.height], sampleCount: 4, format, usage: GPUTextureUsage.RENDER_ATTACHMENT });
    this.msaa = t(this.fmt); this.ca.view = this.msaa.createView();
    this.M.tex = this.c.width * this.c.height * 16; this.pk();
    for (const e of this.entries) e.scene.resize(e.w, e.h, dpr); this.request(); }
  createScene(w, h) { const s = this.core.createScene(w, h, this.dpr || 1); this.gpuScene(s); return s; }
  gpuScene(s) { const r = this; s.gpu = { r, vb: null, gb: null, ub: null, bg: null, ranges: new Uint32Array(0),
    free() { for (const b of [this.vb, this.gb, this.ub]) if (b) { r.M.buf -= b.size; b.destroy(); } r.entries = r.entries.filter(e => e.scene !== s); } }; }
  // place scenes: list of { scene, x, y, w, h } in CSS px (x, y snap to device px). Draw order = list order.
  layout(list) { this.entries = list; for (const e of list) { e.scene.resize(e.w, e.h, this.dpr || 1); } this.request(); }
  sync(s) { const g = s.gpu, x = this.core.x, h = s.h, q = this.dev.queue, fl = x.jrd_flags(h), mem = x.memory.buffer;
    const vlen = x.jrd_len(h, 0);
    if (!g.vb || g.vb.size < vlen || fl & F.REALLOC) { const nb = this.buffer(g.vb, Math.max(vlen, 16), GPUBufferUsage.VERTEX); const full = nb !== g.vb || fl & F.REALLOC; g.vb = nb; if (full && vlen) q.writeBuffer(g.vb, 0, mem, x.jrd_ptr(h, 0), vlen); }
    else if (fl & F.VERTS) { const n = x.jrd_len(h, 4) >> 2, d = new Uint32Array(mem, x.jrd_ptr(h, 4), n).slice(), vp = x.jrd_ptr(h, 0);
      for (let i = 0; i < n; i += 2) q.writeBuffer(g.vb, d[i] * 16, mem, vp + d[i] * 16, d[i + 1] * 16); }
    if (!g.gb || fl & F.GROUPS) { const n = x.jrd_len(h, 1), nb = this.buffer(g.gb, n, GPUBufferUsage.STORAGE); if (nb !== g.gb) g.bg = null; g.gb = nb; q.writeBuffer(g.gb, 0, mem, x.jrd_ptr(h, 1), n); }
    if (!g.ub || fl & F.UNI) { const nb = this.buffer(g.ub, 32, GPUBufferUsage.UNIFORM); if (nb !== g.ub) g.bg = null; g.ub = nb; q.writeBuffer(g.ub, 0, mem, x.jrd_ptr(h, 2), 32); }
    if (fl & (F.RANGES | F.REALLOC) || !g.ranges.length) g.ranges = new Uint32Array(mem, x.jrd_ptr(h, 3), x.jrd_len(h, 3) >> 2).slice();
    g.bg ||= this.dev.createBindGroup({ layout: this.bgl, entries: [{ binding: 0, resource: { buffer: g.ub } }, { binding: 1, resource: { buffer: g.gb } }] });
    x.jrd_clean(h); }
  request() { if (!this.raf && typeof requestAnimationFrame === 'function') this.raf = requestAnimationFrame(() => { this.raf = 0; this.draw(); }); }
  // draw all placed scenes now (one render pass). Returns the number of draw calls.
  draw() { if (!this.msaa || this.hidden || this.lost) return 0; for (const e of this.entries) if (e.scene.h) this.sync(e.scene);
    this.ca.resolveTarget = this.ctx.getCurrentTexture().createView(); const enc = this.dev.createCommandEncoder(), p = enc.beginRenderPass(this.rp); let n = 0; const d = this.dpr;
    for (const e of this.entries) { const g = e.scene.gpu; if (!e.scene.h || !g.ranges.length) continue;
      const vx = Math.round(e.x * d), vy = Math.round(e.y * d), vw = Math.round(e.w * d), vh = Math.round(e.h * d);
      const cx = Math.max(0, vx), cy = Math.max(0, vy), cw = Math.min(this.c.width, vx + vw) - cx, chh = Math.min(this.c.height, vy + vh) - cy; if (cw <= 0 || chh <= 0) continue;
      p.setViewport(vx, vy, vw, vh, 0, 1); p.setScissorRect(cx, cy, cw, chh); p.setPipeline(this.pipe); p.setBindGroup(0, g.bg); p.setVertexBuffer(0, g.vb);
      for (let i = 0; i < g.ranges.length; i += 2) { p.draw(g.ranges[i + 1], 1, g.ranges[i], 0); n++; } }
    p.end(); this.dev.queue.submit([enc.finish()]); this.draws = n; this.cursorSync(); return n; }
  // cursor from the current hit state under the last pointer position (after patches, scrolls and layout changes too)
  cursorSync() { const q = this.ptr; if (!q || !this.attached) return; const e = this.entries.find(t => t.scene === q.s && t.scene.h); let cur = '';
    if (e) { const X = q.X - e.x, Y = q.Y - e.y; if (X >= 0 && Y >= 0 && X < e.w && Y < e.h && e.scene.hit(X, Y) !== null) cur = 'pointer'; }
    if (this.c.style.cursor !== cur) this.c.style.cursor = cur; }
  // Keep the canvas backing store matched to its CSS box: ResizeObserver (device-pixel-content-box where supported, else
  // content box x devicePixelRatio) plus a resolution media query for DPR changes (zoom, moving to another screen). onresize(w, h, dpr)
  // runs after each resize so the caller can lay out its scenes (default: every placed scene with fill set, or the only scene, gets w x h).
  // A zero size hides the renderer (nothing drawn, no error) until the box has a size again. Returns a stop function.
  autoSize(o = {}) { if (this.stopAuto) this.stopAuto(); const el = o.element || this.c, onr = o.onresize; let dw = 0, dh = 0, mq = null; if (!this.msaa) this.hidden = true; // hidden until the first real size
    // the device-pixel box is used only when it agrees with css x dpr (headless Chrome DPR emulation reports css px there)
    const apply = (w, h) => { const d = (typeof devicePixelRatio === 'number' && devicePixelRatio > 0 ? devicePixelRatio : 1) * (o.dprScale || 1); const md = o.maxDpr || 4, dpr = Math.min(d, md);
      const exact = dw > 0 && dpr === d && !o.dprScale && Math.abs(dw - w * dpr) < 1.5 && Math.abs(dh - h * dpr) < 1.5; this.resize(w, h, dpr, exact ? dw : 0, exact ? dh : 0); if (!(w > 0 && h > 0)) return;
      if (onr) onr(w, h, dpr); else { const fill = this.entries.filter(e => e.fill); for (const e of (fill.length ? fill : this.entries.length === 1 ? this.entries : [])) { e.w = w; e.h = h; e.scene.resize(w, h, dpr); } this.request(); }
      this.draw(); };
    const measure = () => { const r = el.getBoundingClientRect(); return [el.clientWidth || r.width, el.clientHeight || r.height]; };
    let last = [-1, -1];
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver((es) => { const e = es[es.length - 1]; const cb = e.contentBoxSize && (e.contentBoxSize[0] || e.contentBoxSize);
      const w = cb && cb.inlineSize != null ? cb.inlineSize : e.contentRect.width, h = cb && cb.blockSize != null ? cb.blockSize : e.contentRect.height;
      const dp = e.devicePixelContentBoxSize && e.devicePixelContentBoxSize[0]; dw = dp ? dp.inlineSize : 0; dh = dp ? dp.blockSize : 0; last = [w, h]; apply(w, h); }) : null;
    if (ro) { try { ro.observe(el, { box: 'device-pixel-content-box' }); } catch (e) { ro.observe(el); } }
    const watch = () => { if (typeof matchMedia !== 'function') return; mq?.removeEventListener?.('change', onmq); mq = matchMedia('(resolution: ' + (devicePixelRatio || 1) + 'dppx)'); mq.addEventListener?.('change', onmq); };
    const onmq = () => { watch(); const [w, h] = last[0] >= 0 ? last : measure(); dw = dh = 0; apply(w, h); }; watch();
    { const [w, h] = measure(); if (!ro || !(w > 0 && h > 0)) apply(w, h); } // a box that starts at 0 x 0 gets no first observation: hidden until it has a size
    this.stopAuto = () => { ro?.disconnect(); mq?.removeEventListener?.('change', onmq); this.stopAuto = null; }; return this.stopAuto; }
  // Input forwarding for the placed scenes: pointer (with pointer id and modifier keys), wheel (scroll handled in wasm), keys, touch.
  // Idempotent: a second call returns the same detach function. Pointer capture: the canvas captures the pointer on down, so the
  // node that got DOWN keeps receiving MOVE / DRAG / UP until the button is released, even outside the canvas. Only the primary
  // pointer is forwarded (a second finger is ignored). Coordinates are mapped from the canvas CSS box to the renderer's logical size,
  // so a canvas scaled by CSS (max-width: 100%) still hits the right nodes.
  // Touch policy, opts.touchAction 'auto' (default): CSS touch-action 'pan-x pan-y' (the page pans and zooms by default) and a touch that
  // starts on a scroll group or on an NF.DRAG node cancels panning (touchstart preventDefault) and becomes an in-canvas scroll / drag.
  // A touch on a plain hit region does not block panning: a tap still clicks, a swipe pans the page (the node gets CANCEL).
  // opts.touchHits: true also keeps touches that start on plain hit regions (the v2 behaviour). Any other touchAction string is set as
  // the CSS value as is (for example 'none' to keep every touch).
  attach(o = {}) { if (this.attached) return this.attached; const c = this.c, L = [], on = (n, f, op, t = c) => { t.addEventListener(n, f, op); L.push([n, f, op, t]); };
    const at = (X, Y) => { for (let i = this.entries.length - 1; i >= 0; i--) { const e = this.entries[i]; if (e.scene.h && X >= e.x && Y >= e.y && X < e.x + e.w && Y < e.y + e.h) return [e.scene, X - e.x, Y - e.y, e]; } return null; };
    const pos = (ev) => { const r = c.getBoundingClientRect(), kx = r.width > 0 && this.cw > 0 ? this.cw / r.width : 1, ky = r.height > 0 && this.chh > 0 ? this.chh / r.height : 1; return [(ev.clientX - r.left) * kx, (ev.clientY - r.top) * ky]; };
    const mods = (ev) => (ev.shiftKey ? 1 : 0) | (ev.ctrlKey ? 2 : 0) | (ev.altKey ? 4 : 0) | (ev.metaKey ? 8 : 0);
    let cap = null, capId = null, last = null; const K = { pointermove: 0, pointerdown: 1, pointerup: 2, pointercancel: 4 };
    const pf = (ev) => { const k = K[ev.type]; if (ev.isPrimary === false && ev.pointerType === 'touch') return; if (capId !== null && ev.pointerId !== capId) return; const [X, Y] = pos(ev); let t;
      if (cap && k !== 1) { const e = this.entries.find(q => q.scene === cap); t = e ? [cap, X - e.x, Y - e.y, e] : null; } else t = at(X, Y);
      if (last && (!t || t[0] !== last)) last.pointer(3, 0, 0, 0); last = t ? t[0] : null; this.ptr = t ? { s: t[0], X, Y } : null;
      if (t) { t[0].vo = [t[3].x, t[3].y]; if (k === 1) { cap = t[0]; capId = ev.pointerId; try { c.setPointerCapture?.(ev.pointerId); } catch (e) { } } this.keepFocus = false; t[0].pointer(k, t[1], t[2], ev.buttons, ev.pointerId, mods(ev)); }
      if (k === 2 || k === 4) { cap = null; capId = null; } this.cursorSync(); if (!t && c.style.cursor) c.style.cursor = ''; };
    for (const n in K) on(n, pf);
    on('lostpointercapture', (ev) => { if (cap && ev.pointerId === capId) { cap.pointer(4, 0, 0, 0, ev.pointerId, 0); cap = null; capId = null; } });
    // a text field took focus on this press: keep the browser from moving focus to the canvas on mousedown
    on('mousedown', (ev) => { if (this.keepFocus) ev.preventDefault(); });
    on('pointerleave', () => { if (last && !cap) { last.pointer(3, 0, 0, 0); last = null; this.ptr = null; c.style.cursor = ''; } });
    on('wheel', (ev) => { const [X, Y] = pos(ev), t = at(X, Y); if (!t) return; const m = ev.deltaMode === 1 ? 16 : ev.deltaMode === 2 ? t[0].hh || 400 : 1;
      const evs = t[0].wheel(t[1], t[2], ev.deltaX * m, ev.deltaY * m); if (evs.some(e => e.kind === EV.SCROLL)) ev.preventDefault(); }, { passive: false });
    const ta = o.touchAction || 'auto'; this.touchAction = ta;
    if (ta === 'auto') { c.style.touchAction = 'pan-x pan-y';
      on('touchstart', (ev) => { const t0 = ev.touches && ev.touches[0]; if (!t0 || ev.touches.length > 1) return; const [X, Y] = pos(t0), t = at(X, Y); if (!t) return;
        const id = t[0].hit(t[1], t[2]), keep = t[0].scrollAt(t[1], t[2]) !== null || (id !== null && (o.touchHits || (t[0].nodeFlags(id) & NF.DRAG))); if (keep) ev.preventDefault(); }, { passive: false }); }
    else c.style.touchAction = ta;
    if (c.tabIndex < 0) c.tabIndex = 0;
    on('keydown', (ev) => { const s = last || this.entries[0]?.scene; if (s) s.key(true, ev.keyCode); });
    on('keyup', (ev) => { const s = last || this.entries[0]?.scene; if (s) s.key(false, ev.keyCode); });
    // keyboard focus: Tab onto the canvas focuses its first text field (if any); Tab / Shift+Tab inside fields walk them, then leave
    on('focus', () => { if (!this.pointerFocus && this.fields.length && !this.fields.some(f => f.focused)) this.fields[0].focus(); this.pointerFocus = false; });
    on('pointerdown', () => { this.pointerFocus = true; setTimeout(() => { this.pointerFocus = false; }, 0); });
    const detach = () => { for (const [n, f, op, t] of L) t.removeEventListener(n, f, op); L.length = 0; this.attached = null; this.ptr = null; c.style.cursor = ''; c.style.touchAction = ''; };
    this.listeners = L; this.attached = detach; return detach; }
  // single-line or multi-line text input drawn in the scene; see TextField below
  textField(scene, o) { const f = new TextField(this, scene, o); this.fields.push(f); return f; }
  // tests/screenshots (needs init({readback: true})): draw now and return the canvas pixels as RGBA bytes (w*h*4)
  async read() { this.draw(); const w = this.c.width, h = this.c.height, bpr = Math.ceil(w * 4 / 256) * 256, tex = this.ctx.getCurrentTexture();
    const b = this.dev.createBuffer({ size: bpr * h, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ }); const e = this.dev.createCommandEncoder();
    e.copyTextureToBuffer({ texture: tex }, { buffer: b, bytesPerRow: bpr }, [w, h]); this.dev.queue.submit([e.finish()]); await b.mapAsync(GPUMapMode.READ);
    const src = new Uint8Array(b.getMappedRange()), out = new Uint8Array(w * h * 4), bgra = this.fmt === 'bgra8unorm';
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * bpr + x * 4, o = (y * w + x) * 4; out[o] = src[i + (bgra ? 2 : 0)]; out[o + 1] = src[i + 1]; out[o + 2] = src[i + (bgra ? 0 : 2)]; out[o + 3] = src[i + 3]; }
    b.unmap(); b.destroy(); return out; }
  memory() { return { gpuBytes: this.M.buf + this.M.tex, gpuPeak: this.M.peak, wasmBytes: this.core.wasmBytes() }; }
  // frees this renderer's scenes, buffers and textures; a shared GPUContext stays usable by other renderers
  destroy() { for (const f of this.fields.slice()) f.remove(); if (this.stopAuto) this.stopAuto(); this.gc.rs?.delete(this); if (this.attached) this.attached(); if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(this.raf); for (const e of this.entries) if (e.scene.h) e.scene.free(); this.entries = []; if (!this.lost) this.msaa?.destroy(); this.msaa = null; try { this.ctx.unconfigure(); } catch (e) { }
    this.gc.users--; if (this.ownGc) this.gc.destroy(); }
}

// ---------- text editing ----------
// Grapheme clusters: Intl.Segmenter when present, else a fallback that keeps surrogate pairs, combining marks, ZWJ sequences,
// variation selectors, skin tones, keycaps, tags and regional-indicator flag pairs together. Indices are UTF-16 offsets.
const SEG = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;
const EXT = /[\p{M}\u200d\ufe0e\ufe0f\u{1f3fb}-\u{1f3ff}\u20e3\u{e0020}-\u{e007f}]/u;

// ---------- Exp7 view.states + JMotion poses (ADR 0082 / 0089 / design 02) ----------
// Real Exp7 semantics (not renamed stand-ins):
//   view.states[name] = { bg, border, sm, anim }
//   anim: 'none' | 'pulse' | 'shake' | 'glow'
//   sm: JMotion state name (idle, hover, focus, pressed, selected, dragging, drop-pending, invalid, settling, disabled)
// JRender already evaluates the same pose model (lift/tilt/scale/op/ring) inside legacy JRB Machine for fish/coin/button.
// ViewStates applies that model to draw-list nodes via Patch.color / Patch.xform so Exp7 demos can drive canvas UI
// the same way DOM components use data-sm + cue-pulse/shake/glow.
const ANIM = { NONE: 'none', PULSE: 'pulse', SHAKE: 'shake', GLOW: 'glow' };
const SMNAME = ['idle', 'hover', 'focus', 'pressed', 'selected', 'dragging', 'drop-pending', 'invalid', 'settling', 'disabled'];
// Default poses from TDD / default.janim.json (scale) plus lift/ring conventions used by the JRB Machine.
const POSES = {
  idle:            { scale: 1,      lift: 0,  op: 1,   ring: 0 },
  hover:           { scale: 1.0012, lift: 2,  op: 1,   ring: 0 },
  focus:           { scale: 1.0006, lift: 0.8,op: 1,   ring: 1 },
  pressed:         { scale: 0.985,  lift: 0,  op: 1,   ring: 0 },
  selected:        { scale: 1.0006, lift: 0.8,op: 1,   ring: 2 },
  dragging:        { scale: 1.0374, lift: 12, op: 1,   ring: 2 },
  'drop-pending':  { scale: 1.0124, lift: -1.6, op: 1, ring: 2 },
  invalid:         { scale: 1.0374, lift: 0,  op: 1,   ring: 3 },
  settling:        { scale: 1,      lift: 0,  op: 1,   ring: 0 },
  disabled:        { scale: 1,      lift: 0,  op: 0.45,ring: 0 }
};
const RING_COL = { 0: 0, 1: rgba(0x8e, 0xb0, 0xff), 2: rgba(0xd9, 0xc5, 0x8d, 0xcc), 3: rgba(0xff, 0xb8, 0x6b) };
function brighten(c, k) { // k 0..1 toward white
  const r = c & 255, g = (c >>> 8) & 255, b = (c >>> 16) & 255, a = (c >>> 24) & 255;
  return rgba(r + (255 - r) * k | 0, g + (255 - g) * k | 0, b + (255 - b) * k | 0, a);
}
function mixPose(a, b, t) {
  return { scale: a.scale + (b.scale - a.scale) * t, lift: a.lift + (b.lift - a.lift) * t, op: a.op + (b.op - a.op) * t, ring: t < 0.5 ? a.ring : b.ring };
}
function easeOut(t) { return 1 - (1 - t) * (1 - t); }

/** Bind Exp7 view.states to one or more DL nodes on a scene. */
class ViewStates {
  /**
   * @param {DLScene} scene
   * @param {{ states?: object, reduced?: boolean, edgeMs?: number }} [o]
   * states: Exp7 view.states map (name -> {bg, border, sm, anim, label?})
   */
  constructor(scene, o = {}) {
    this.scene = scene;
    this.states = o.states || {};
    this.reduced = !!o.reduced;
    this.edgeMs = o.edgeMs == null ? 120 : o.edgeMs;
    this.nodes = new Map(); // id -> { cx, cy, bgId, borderId, ringId, baseBg, baseBorder, state, sm, anim, t0, from, to, pose, loop }
    this._dirty = false;
  }
  /** Register a visual subject. bgId/borderId/ringId are node ids that receive color patches; xfId (default id) gets xform. */
  register(id, g) {
    const n = {
      id, cx: g.cx, cy: g.cy,
      bgId: g.bgId != null ? g.bgId : id,
      borderId: g.borderId != null ? g.borderId : 0,
      ringId: g.ringId || 0,
      xfId: g.xfId != null ? g.xfId : id,
      baseBg: g.bg || 0, baseBorder: g.border || 0,
      state: 'idle', sm: 'idle', anim: 'none',
      t0: 0, from: { ...POSES.idle }, to: { ...POSES.idle }, pose: { ...POSES.idle },
      animT0: 0, loop: false
    };
    this.nodes.set(id, n);
    return this;
  }
  setStates(map) { this.states = map || {}; return this; }
  setReduced(on) { this.reduced = !!on; for (const n of this.nodes.values()) { n.pose = { ...n.to, lift: on ? 0 : n.to.lift, scale: on ? 1 : n.to.scale }; n.anim = 'none'; } this._applyAll(0); return this; }
  /** Apply an Exp7 state name to a registered node (proposal/circuit -> view state). */
  go(id, name, tMs = 0) {
    const n = this.nodes.get(id); if (!n) return false;
    const st = this.states[name] || { sm: name, anim: 'none' };
    const sm = st.sm || 'idle';
    const pose = POSES[sm] || POSES.idle;
    n.state = name; n.sm = sm;
    n.from = { ...n.pose }; n.to = { ...pose };
    if (st.bg != null) n.baseBg = st.bg; if (st.border != null) n.baseBorder = st.border;
    n.t0 = tMs; n.anim = this.reduced ? 'none' : (st.anim || 'none');
    n.animT0 = tMs; n.loop = n.anim === 'pulse' || n.anim === 'glow';
    if (this.reduced) { n.pose = { ...pose, lift: 0, scale: 1 }; this._paint(n, 0); }
    this._dirty = true;
    return true;
  }
  /** Pointer helper: map Exp7/JMotion events onto go() using the sm field of the current view state, or direct sm names. */
  pointer(id, kind, tMs = 0) {
    // kind: enter/leave/down/up matching JRB Machine events
    const map = { enter: 'hover', leave: 'idle', down: 'pressed', up: 'hover' };
    const sm = map[kind]; if (!sm) return false;
    // Prefer a view.states entry whose sm matches, else go by sm name directly
    for (const [name, st] of Object.entries(this.states)) if ((st.sm || name) === sm) return this.go(id, name, tMs);
    return this.go(id, sm, tMs);
  }
  /** Advance edge easing + pulse/shake/glow. Returns true if a patch was applied (host should draw). */
  tick(tMs) {
    let dirty = false;
    for (const n of this.nodes.values()) {
      let pose = n.pose;
      if (n.from && n.to) {
        const dur = this.reduced ? 0 : this.edgeMs;
        const u = dur <= 0 ? 1 : Math.min(1, (tMs - n.t0) / dur);
        pose = mixPose(n.from, n.to, easeOut(u));
        if (this.reduced) pose = { ...pose, lift: 0, scale: 1 };
        if (u >= 1) n.from = null;
        dirty = true;
      }
      let dx = 0, dy = 0, sc = 1, glow = 0;
      const anim = this.reduced ? 'none' : n.anim;
      if (anim === 'pulse') {
        const p = ((tMs - n.animT0) % 1000) / 1000; sc = 1 - 0.03 * Math.sin(p * Math.PI * 2); dirty = true;
      } else if (anim === 'shake') {
        const p = (tMs - n.animT0) / 400; // once ~400ms, matching cue-shake
        if (p < 1) {
          const k = p < 0.25 ? -3 : p < 0.5 ? 3 : p < 0.75 ? -2 : 2;
          dx = k * (1 - p); dirty = true;
        } else if (!n.loop) n.anim = 'none';
      } else if (anim === 'glow') {
        const p = ((tMs - n.animT0) % 1200) / 1200; glow = 0.35 * (0.5 - 0.5 * Math.cos(p * Math.PI * 2)); dirty = true;
      }
      n.pose = pose;
      if (dirty || this._dirty) this._paint(n, tMs, dx, dy - (this.reduced ? 0 : pose.lift), sc, glow);
    }
    this._dirty = false;
    return dirty;
  }
  _applyAll(t) { for (const n of this.nodes.values()) this._paint(n, t); }
  _paint(n, tMs, dx = 0, dy = 0, scMul = 1, glow = 0) {
    const p = n.pose, s = (this.reduced ? 1 : p.scale) * scMul;
    const xf = [s, 0, 0, s, n.cx - s * n.cx + dx, n.cy - s * n.cy + dy];
    const patch = new Patch().xform(n.xfId, xf);
    if (n.baseBg) patch.color(n.bgId, glow ? brighten(n.baseBg, glow) : n.baseBg);
    if (n.borderId && n.borderId !== n.bgId && n.baseBorder) patch.color(n.borderId, n.baseBorder);
    if (n.ringId) {
      const rc = RING_COL[p.ring] || 0;
      if (rc) patch.color(n.ringId, rc); else patch.flags(n.ringId, NF.HIDDEN);
      if (rc) patch.flags(n.ringId, 0);
    }
    // opacity via color alpha on bg when disabled-like
    if (p.op < 0.999 && n.baseBg) {
      const c = glow ? brighten(n.baseBg, glow) : n.baseBg;
      const a = ((c >>> 24) & 255) * p.op | 0;
      patch.color(n.bgId, (c & 0x00ffffff) | (a << 24));
    }
    this.scene.patch(patch);
  }
  /** Snapshot for tests. */
  view(id) { const n = this.nodes.get(id); return n ? { state: n.state, sm: n.sm, anim: n.anim, pose: { ...n.pose } } : null; }
}


function graphemeBounds(s, noSeg = false) { const b = [0]; if (SEG && !noSeg) { for (const g of SEG.segment(s)) if (g.index) b.push(g.index); }
  else { let i = 0, ri = 0, prevZwj = false; for (const ch of s) { const c = ch.codePointAt(0), isRi = c >= 0x1f1e6 && c <= 0x1f1ff;
      const join = i > 0 && (EXT.test(ch) || prevZwj || (isRi && ri % 2 === 1)); if (i > 0 && !join) b.push(i); ri = isRi ? ri + 1 : 0; prevZwj = c === 0x200d; i += ch.length; } }
  if (b[b.length - 1] !== s.length) b.push(s.length); if (s.length === 0) return [0]; return b; }
const WORD = /[\p{L}\p{N}_'\u2019]/u;
// Pure editing model (no DOM; tested in Node). value, anchor (a), focus (f); every edit goes through replace(); undo / redo per model.
class TextEdit {
  constructor(o = {}) { this.multiline = !!o.multiline; this.maxLength = o.maxLength || 0; this.U = []; this.R = []; this.last = null; this.v = ''; this.a = this.f = 0; this.set(o.value || ''); this.U.length = 0; }
  get value() { return this.v; } get start() { return Math.min(this.a, this.f); } get end() { return Math.max(this.a, this.f); } get selected() { return this.v.slice(this.start, this.end); }
  bounds() { if (this.bc !== this.v) { this.bc = this.v; this.B = graphemeBounds(this.v); } return this.B; }
  graphemes(s = this.v) { return graphemeBounds(s).length - 1; }
  snap(i) { const B = this.bounds(); i = Math.max(0, Math.min(this.v.length, i)); let k = 0; while (k < B.length - 1 && B[k + 1] <= i) k++; return B[k]; }
  prev(i) { const B = this.bounds(); for (let k = B.length - 1; k >= 0; k--) if (B[k] < i) return B[k]; return 0; }
  next(i) { const B = this.bounds(); for (const x of B) if (x > i) return x; return this.v.length; }
  isW(i) { const c = this.v.codePointAt(i); return c !== undefined && WORD.test(String.fromCodePoint(c)); }
  wordLeft(i) { while (i > 0 && !this.isW(this.prev(i))) i = this.prev(i); while (i > 0 && this.isW(this.prev(i))) i = this.prev(i); return i; }
  wordRight(i) { const n = this.v.length; while (i < n && !this.isW(i)) i = this.next(i); while (i < n && this.isW(i)) i = this.next(i); return i; }
  wordAt(i) { let s = i, e = i; if (!this.isW(i) && i > 0 && this.isW(this.prev(i))) s = e = this.prev(i);
    if (!this.isW(s)) return [s, this.next(s)]; while (s > 0 && this.isW(this.prev(s))) s = this.prev(s); while (e < this.v.length && this.isW(e)) e = this.next(e); return [s, e]; }
  lineStart(i) { const k = this.v.lastIndexOf('\n', i - 1); return k + 1; } lineEnd(i) { const k = this.v.indexOf('\n', i); return k < 0 ? this.v.length : k; }
  select(a, f = a) { this.a = this.snap(a); this.f = this.snap(f); this.last = null; return this; }
  selectAll() { return this.select(0, this.v.length); }
  // move the caret: to = new index; extend keeps the anchor (shift)
  move(to, extend) { to = this.snap(to); if (extend) this.f = to; else this.a = this.f = to; this.last = null; return this; }
  clean(s) { s = String(s).replace(/\r\n?/g, '\n'); if (!this.multiline) s = s.replace(/\n/g, ' '); return s; }
  // replace the selection by text; kind groups undo steps ('type' coalesces consecutive typing). Returns false if nothing changed.
  replace(text, kind = 'edit') { text = this.clean(text); const s = this.start, e = this.end;
    if (this.maxLength) { const room = this.maxLength - (this.graphemes(this.v.slice(0, s) + this.v.slice(e))); const B = graphemeBounds(text); if (B.length - 1 > room) text = text.slice(0, B[Math.max(0, room)]); }
    if (!text && s === e) return false; const now = Date.now();
    if (!(kind === 'type' && this.last && this.last.kind === 'type' && this.last.at === s && s === e && now - this.last.t < 1500)) this.U.push({ v: this.v, a: this.a, f: this.f });
    if (this.U.length > 200) this.U.shift(); this.R.length = 0;
    this.v = this.v.slice(0, s) + text + this.v.slice(e); this.a = this.f = s + text.length; this.last = { kind, at: this.f, t: now }; return true; }
  insert(text) { return this.replace(text, text.length === 1 || graphemeBounds(text).length === 2 ? 'type' : 'paste'); }
  // delete backward / forward (by grapheme, or by word)
  del(fwd, word) { if (this.a === this.f) { const i = this.f; this.f = fwd ? (word ? this.wordRight(i) : this.next(i)) : (word ? this.wordLeft(i) : this.prev(i)); if (this.f === this.a) return false; }
    const r = this.replace('', 'del'); return r; }
  set(v) { const c = this.clean(v); if (c === this.v) return false; this.U.push({ v: this.v, a: this.a, f: this.f }); this.R.length = 0; this.v = c; this.a = this.f = c.length; this.last = null; return true; }
  undo() { const u = this.U.pop(); if (!u) return false; this.R.push({ v: this.v, a: this.a, f: this.f }); Object.assign(this, { v: u.v, a: u.a, f: u.f, last: null }); return true; }
  redo() { const u = this.R.pop(); if (!u) return false; this.U.push({ v: this.v, a: this.a, f: this.f }); Object.assign(this, { v: u.v, a: u.a, f: u.f, last: null }); return true; }
  // IME composition: the composed text is shown (underlined) at the selection but only enters the value / undo on compEnd
  compStart() { this.comp = { s: this.start, e: this.end, text: '' }; }
  compUpdate(text) { if (this.comp) this.comp.text = this.clean(text); }
  compEnd(text) { const c = this.comp; this.comp = null; if (!c) return false; this.a = c.s; this.f = c.e; return this.replace(text ?? c.text, 'ime'); }
  // what to draw: text with any composition in place, caret / selection and underline range in that text (UTF-16)
  view() { const c = this.comp; if (!c) return { text: this.v, a: this.a, f: this.f, ul: null };
    const t = this.v.slice(0, c.s) + c.text + this.v.slice(c.e), k = c.s + c.text.length; return { text: t, a: k, f: k, ul: [c.s, k] }; }
}

// TextField: an editable box drawn into a DLScene placed on a Renderer. One hidden <textarea> per document is focused and moved to
// the caret (so IME candidate windows and mobile keyboards appear in the right place); it mirrors the value and selection, so
// screen readers read the real text. opts { id (frame node id; ids id^0x40000000 / ^0x20000000 / ^0x10000000 are used too),
// x, y, w, h, font, size, color, value, placeholder, maxLength, multiline, password, label (aria-label), parent (group id, else root),
// bg, border, focusBorder, selColor, caretColor, placeholderColor, radius, pad }.
// Callbacks: oninput(value), onchange(value) (on blur / submit when changed), onsubmit(value), onfocus(), onblur().
let TA = null, TAowner = null;
const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
class TextField {
  constructor(r, scene, o) { this.r = r; this.s = scene; this.o = o = Object.assign({ x: 0, y: 0, w: 200, h: 0, font: 0, size: 16, color: rgba(20, 20, 20), placeholder: '', bg: rgba(255, 255, 255),
      border: rgba(150, 150, 160), focusBorder: rgba(40, 110, 230), selColor: rgba(80, 140, 255, 110), caretColor: rgba(20, 20, 20), placeholderColor: rgba(73, 85, 106), radius: 4, pad: 6 }, o);
    this.id = o.id; this.gid = (o.id ^ 0x40000000) >>> 0; this.cid = (o.id ^ 0x20000000) >>> 0; this.kid = (o.id ^ 0x10000000) >>> 0;
    this.m = new TextEdit({ value: o.value || '', multiline: o.multiline, maxLength: o.maxLength }); this.m.select(this.m.value.length);
    const M = r.core.metrics(o.font); this.asc = M.asc / M.upm * o.size; this.lh = o.size * 1.25; if (!o.h) o.h = o.multiline ? this.lh * 4 + o.pad * 2 : this.lh + o.pad * 2;
    this.sx = this.sy = 0; this.focused = false; this.vis = true; this.committed = this.m.value;
    this.mask = r.core.hasGlyph(o.font, 0x2022) ? '\u2022' : '*';
    const p = new Patch(), ins = (q) => { q.node(this.id, NF.HIT | NF.DRAG).rrect(o.x, o.y, o.w, o.h, o.radius, o.bg).border(o.x, o.y, o.w, o.h, o.radius, 1, o.border).hit(o.x, o.y, o.w, o.h)
      .group(this.gid, 0, o.x + o.pad, o.y + o.pad, o.w - o.pad * 2, o.h - o.pad * 2).node(this.cid, 0).node(this.kid, NF.HIDDEN).rect(0, 0, 1, 1, 0).end(); };
    if (o.parent != null) p.append(o.parent, ins); else p.insert(0, ins); scene.patch(p);
    this.off = scene.on((e) => this.ev(e)); this.render(); }
  get value() { return this.m.value; }
  set value(v) { this.m.set(v); this.committed = this.m.value; this.after(false); }
  // ---- layout ----
  disp(t) { return this.o.password ? graphemeBounds(t).slice(1).map(() => this.mask).join('') : t; }
  // lines of the shown text: [{ s, e (UTF-16 in view text), text (display), adv (Float32 caret stops per display codepoint), map (UTF-16 offset of each display cp) }]
  layout() { const v = this.m.view(), t = v.text, o = this.o, core = this.r.core, iw = o.w - o.pad * 2, L = [];
    const pieces = []; if (o.multiline) { let s = 0; for (const seg of t.split('\n')) { pieces.push([s, seg]); s += seg.length + 1; } } else pieces.push([0, t]);
    for (const [s0, seg] of pieces) { // per hard line: map display codepoints to source offsets
      const map = [], dt = []; if (o.password) { const B = graphemeBounds(seg); for (let k = 0; k < B.length - 1; k++) { map.push(s0 + B[k]); dt.push(this.mask); } }
      else { let i = 0; for (const ch of seg) { map.push(s0 + i); dt.push(ch); i += ch.length; } } map.push(s0 + seg.length); const ds = dt.join('');
      if (o.multiline && ds.length) { const w = core.wrap(o.font, o.size, ds, iw).lines; // a line owns everything up to the next line's start (spaces at a soft break stay on the line)
        w.forEach((ln, j) => { const a = j ? ln.start : 0, b = j + 1 < w.length ? w[j + 1].start : dt.length, sub = dt.slice(a, b).join('');
          L.push({ s: map[a], e: map[b], text: sub, adv: core.advances(o.font, o.size, sub), map: map.slice(a, b + 1), soft: j + 1 < w.length }); });
      } else L.push({ s: map[0], e: map[map.length - 1], text: ds, adv: core.advances(o.font, o.size, ds), map }); }
    return { v, L }; }
  // caret position (field content space, before scroll) of a UTF-16 index
  pos(lay, i) { const L = lay.L; let k = 0; for (let j = 0; j < L.length; j++) if (i >= L[j].s && i <= L[j].e) { k = j; if (i < L[j].e) break; }
    const ln = L[k]; let c = 0; while (c < ln.map.length - 1 && ln.map[c + 1] <= i) c++; return [ln.adv[Math.min(c, ln.adv.length - 1)] || 0, k * this.lh]; }
  index(lay, x, y) { const L = lay.L, k = Math.max(0, Math.min(L.length - 1, Math.floor(y / this.lh))), ln = L[k]; let best = 0, bd = 1e9;
    for (let c = 0; c < ln.adv.length; c++) { const d = Math.abs(ln.adv[c] - x); if (d < bd) { bd = d; best = c; } } return this.m.snap(ln.map[Math.min(best, ln.map.length - 1)]); }
  // ---- drawing ----
  render() { const o = this.o, lay = this.lay = this.layout(), v = lay.v, iw = o.w - o.pad * 2, ih = o.h - o.pad * 2; const [cx, cy] = this.pos(lay, v.f);
    if (cx - this.sx > iw - 2) this.sx = cx - iw + 2; if (cx - this.sx < 0) this.sx = Math.max(0, cx - 8); if (!o.multiline && this.sx > 0) { const tw = lay.L[0].adv[lay.L[0].adv.length - 1] || 0; this.sx = Math.min(this.sx, Math.max(0, tw - iw + 2)); }
    if (cy + this.lh - this.sy > ih) this.sy = cy + this.lh - ih; if (cy - this.sy < 0) this.sy = cy; if (!o.multiline) this.sy = Math.max(0, (this.lh - ih) / 2) * 0 - Math.max(0, (ih - this.lh) / 2);
    const sx = this.sx, sy = this.sy, p = new Patch(); this.caret = [cx - sx, cy - sy];
    p.replace(this.cid, (q) => { const s = Math.min(v.a, v.f), e = Math.max(v.a, v.f);
      if (s !== e) lay.L.forEach((ln, k) => { if (e < ln.s || s > ln.e) return; const x0 = this.pos(lay, Math.max(s, ln.s))[0], x1 = s <= ln.e && e > ln.e ? (ln.adv[ln.adv.length - 1] || 0) + 4 : this.pos(lay, Math.min(e, ln.e))[0];
        if (x1 > x0) q.rect(x0 - sx, k * this.lh - sy, x1 - x0, this.lh, o.selColor); });
      if (!v.text && o.placeholder) q.text(-sx, this.asc - sy + (this.lh - o.size * 1.25) / 2, o.size, o.placeholderColor, o.font, o.placeholder);
      lay.L.forEach((ln, k) => { if (ln.text) q.text(-sx, k * this.lh + this.asc + (this.lh - o.size) / 2 * 0.5 - sy, o.size, o.color, o.font, ln.text); });
      if (v.ul) { const a = this.pos(lay, v.ul[0]), b = this.pos(lay, v.ul[1]); if (b[0] > a[0]) q.rect(a[0] - sx, a[1] + this.lh - 2 - sy, b[0] - a[0], 1.5, o.color); } });
    p.replace(this.kid, (q) => q.rect(cx - sx, cy - sy + 1, Math.max(1, 1.5), this.lh - 2, o.caretColor), NF.HIDDEN * !(this.focused && this.vis && v.a === v.f));
    p.replace(this.id, (q) => q.rrect(o.x, o.y, o.w, o.h, o.radius, o.bg).border(o.x, o.y, o.w, o.h, o.radius, this.focused ? 2 : 1, this.focused ? o.focusBorder : o.border).hit(o.x, o.y, o.w, o.h), NF.HIT | NF.DRAG);
    this.s.patch(p); this.r.request(); this.place(); }
  // ---- hidden textarea ----
  static ta() { if (TA || typeof document === 'undefined') return TA; const t = TA = document.createElement('textarea');
    t.setAttribute('autocomplete', 'off'); t.setAttribute('autocorrect', 'off'); t.setAttribute('autocapitalize', 'off'); t.setAttribute('spellcheck', 'false'); t.setAttribute('data-jrender', 'textfield');
    Object.assign(t.style, { position: 'fixed', left: '0px', top: '0px', width: '2px', height: '20px', opacity: '0.01', padding: '0', border: '0', margin: '0', resize: 'none', overflow: 'hidden', fontSize: '16px', zIndex: '2147483646', caretColor: 'transparent', outline: 'none', whiteSpace: 'pre', color: 'transparent', background: 'transparent' });
    document.body.appendChild(t); const f = (n) => t.addEventListener(n, (e) => TAowner && TAowner['on_' + n](e));
    for (const n of ['keydown', 'input', 'compositionstart', 'compositionupdate', 'compositionend', 'copy', 'cut', 'paste', 'blur', 'focus']) f(n); return t; }
  place() { const t = TA; if (!t || TAowner !== this) return; const e = this.r.entries.find(q => q.scene === this.s); if (!e) return; const rc = this.r.c.getBoundingClientRect(), k = this.r.cw > 0 ? rc.width / this.r.cw : 1;
    const x = rc.left + (e.x + this.o.x + this.o.pad + this.caret[0]) * k, y = rc.top + (e.y + this.o.y + this.o.pad + this.caret[1]) * k; t.style.left = Math.round(x) + 'px'; t.style.top = Math.round(y) + 'px'; t.style.height = Math.max(16, this.lh * k) + 'px'; }
  syncTA() { const t = TA; if (!t || TAowner !== this || this.m.comp) return; const v = this.o.password ? '' : this.m.value; if (t.value !== v) t.value = v;
    if (!this.o.password) { const d = this.m.f < this.m.a ? 'backward' : 'forward'; try { t.setSelectionRange(this.m.start, this.m.end, d); } catch (e) { } }
    t.setAttribute('aria-label', this.o.label || this.o.placeholder || 'text field'); t.setAttribute('aria-multiline', this.o.multiline ? 'true' : 'false'); t.setAttribute('data-type', this.o.password ? 'password' : 'text'); t.style.webkitTextSecurity = this.o.password ? 'disc' : '';
    if (this.o.maxLength) t.maxLength = this.o.maxLength * 4; else t.removeAttribute('maxlength'); }
  focus() { const t = TextField.ta(); if (TAowner && TAowner !== this) TAowner.blur(); TAowner = this; if (!this.focused) { this.focused = true; this.blink(true); this.syncTA(); this.render(); if (this.o.onfocus) this.o.onfocus(); }
    if (t && document.activeElement !== t) t.focus({ preventScroll: true }); }
  blur(fromTA) { if (!this.focused) return; if (this.m.comp) this.m.compEnd(); this.focused = false; this.blink(false); if (TAowner === this) { TAowner = null; if (!fromTA && TA && document.activeElement === TA) TA.blur(); }
    this.render(); this.commit(); if (this.o.onblur) this.o.onblur(); }
  commit() { if (this.m.value !== this.committed) { this.committed = this.m.value; if (this.o.onchange) this.o.onchange(this.m.value); } }
  // caret blink: 530 ms, solid caret when prefers-reduced-motion or when the tab is hidden (no timers then)
  blink(on) { clearInterval(this.bt); this.bt = 0; this.vis = true; if (!on || reduced()) return; const tick = () => { if (typeof document !== 'undefined' && document.hidden) { if (!this.vis) { this.vis = true; this.caretOnly(); } return; } this.vis = !this.vis; this.caretOnly(); };
    this.bt = setInterval(tick, 530); }
  wake() { this.vis = true; if (this.focused) this.blink(true); }
  caretOnly() { const v = this.m.view(); this.s.patch(new Patch().flags(this.kid, this.focused && this.vis && v.a === v.f ? 0 : NF.HIDDEN)); this.r.request(); }
  after(input = true) { this.wake(); this.syncTA(); this.render(); if (input && this.o.oninput) this.o.oninput(this.m.value); }
  // ---- scene events (frame node) ----
  ev(e) { if (e.id !== this.id) return; const lx = e.x - this.o.x - this.o.pad + this.sx, ly = e.y - this.o.y - this.o.pad + this.sy;
    if (e.type === 'down') { this.r.keepFocus = true; this.focus(); const i = this.index(this.lay, lx, ly), now = Date.now();
      const dbl = this.lastDown && now - this.lastDown.t < 450 && Math.abs(lx - this.lastDown.x) < 5 && Math.abs(ly - this.lastDown.y) < 5; this.clicks = dbl ? (this.clicks || 1) + 1 : 1; this.lastDown = { t: now, x: lx, y: ly };
      if (this.clicks === 2) { const [a, b] = this.m.wordAt(i); this.m.select(a, b); } else if (this.clicks >= 3) { this.m.select(this.o.multiline ? this.m.lineStart(i) : 0, this.o.multiline ? this.m.lineEnd(i) : this.m.value.length); }
      else this.m.move(i, e.shift); this.selDrag = true; this.after(false); }
    else if ((e.type === 'drag' || e.type === 'move') && this.selDrag && e.buttons & 1) { this.m.move(this.index(this.lay, lx, ly), true); this.after(false); }
    else if (e.type === 'up' || e.type === 'cancel' || e.type === 'dragend') this.selDrag = false; }
  // ---- textarea events ----
  on_focus() { } on_blur() { this.blur(true); }
  on_keydown(e) { const m = this.m, sh = e.shiftKey, word = e.ctrlKey || e.altKey, cmd = e.ctrlKey || e.metaKey; if (e.isComposing || e.keyCode === 229 || m.comp) return; let h = true;
    switch (e.key) {
      case 'ArrowLeft': m.move(!sh && m.a !== m.f ? m.start : e.metaKey ? (this.o.multiline ? m.lineStart(m.f) : 0) : word ? m.wordLeft(m.f) : m.prev(m.f), sh); break;
      case 'ArrowRight': m.move(!sh && m.a !== m.f ? m.end : e.metaKey ? (this.o.multiline ? m.lineEnd(m.f) : m.value.length) : word ? m.wordRight(m.f) : m.next(m.f), sh); break;
      case 'ArrowUp': case 'ArrowDown': { if (!this.o.multiline) { m.move(e.key === 'ArrowUp' ? 0 : m.value.length, sh); break; } const [x, y] = this.pos(this.lay, m.f); m.move(this.index(this.lay, x, y + (e.key === 'ArrowUp' ? -1 : 1) * this.lh + this.lh / 2), sh); break; }
      case 'Home': m.move(cmd || !this.o.multiline ? 0 : this.lineOf(m.f).s, sh); break;
      case 'End': m.move(cmd || !this.o.multiline ? m.value.length : this.lineOf(m.f).e, sh); break;
      case 'Backspace': m.del(false, word); break;
      case 'Delete': m.del(true, word); break;
      case 'Enter': if (this.o.multiline && !cmd) m.replace('\n', 'edit'); else { this.commit(); if (this.o.onsubmit) this.o.onsubmit(m.value); } break;
      case 'Tab': { if (cmd) { h = false; break; } const F = this.r.fields, k = F.indexOf(this) + (sh ? -1 : 1); if (k >= 0 && k < F.length) F[k].focus(); else { h = false; this.blur(); } break; }
      case 'Escape': h = false; break;
      default: if (cmd && !e.altKey) { const k = e.key.toLowerCase(); if (k === 'a') m.selectAll(); else if (k === 'z' && !sh) m.undo(); else if ((k === 'z' && sh) || k === 'y') m.redo(); else h = false; } else h = false; }
    if (h) { e.preventDefault(); const changed = m.value !== this.prevV; this.prevV = m.value; this.after(changed); } }
  lineOf(i) { const L = this.lay.L; for (const ln of L) if (i >= ln.s && i <= ln.e) return ln; return L[L.length - 1]; }
  on_input(e) { const t = TA, m = this.m; if (m.comp) { this.on_compositionupdate({ data: null }); return; } if (this.o.password) { const d = t.value; t.value = ''; if (d) m.insert(d); else if (e.inputType && e.inputType.startsWith('delete')) m.del(e.inputType.includes('Forward'), false); this.prevV = m.value; this.after(); return; }
    const old = m.value, nv = t.value; if (nv === old) { this.syncTA(); return; } let p = 0; while (p < old.length && p < nv.length && old[p] === nv[p]) p++; let q = 0; while (q < old.length - p && q < nv.length - p && old[old.length - 1 - q] === nv[nv.length - 1 - q]) q++;
    const a = m.snap(p), e0 = old.length - q, b = m.snap(e0) === e0 ? e0 : m.next(m.snap(e0)); m.a = a; m.f = b; const ins = nv.slice(a, nv.length - (old.length - b));
    if (e.inputType === 'historyUndo') m.undo(); else if (e.inputType === 'historyRedo') m.redo(); else if (ins) m.insert(ins); else m.replace('', 'del'); this.prevV = m.value; this.after(); }
  on_compositionstart() { this.m.compStart(); this.compBase = TA.value; this.wake(); this.render(); }
  on_compositionupdate(e) { const m = this.m; if (!m.comp) m.compStart(); let text = e && e.data; if (text == null) { const b = this.o.password ? '' : this.m.value, v = TA.value; text = v.slice(m.comp.s, v.length - (b.length - m.comp.e)); }
    m.compUpdate(text); this.render(); }
  on_compositionend(e) { const m = this.m; if (!m.comp) return; m.compEnd(e.data != null ? e.data : m.comp.text); this.prevV = m.value; this.after(); }
  on_copy(e) { if (this.o.password) { e.preventDefault(); return; } e.clipboardData?.setData('text/plain', this.m.selected); e.preventDefault(); }
  on_cut(e) { if (this.o.password) { e.preventDefault(); return; } e.clipboardData?.setData('text/plain', this.m.selected); e.preventDefault(); if (this.m.replace('', 'cut')) this.after(); }
  on_paste(e) { const d = e.clipboardData?.getData('text/plain'); e.preventDefault(); if (d != null && this.m.replace(d, 'paste')) this.after(); }
  // remove the field's nodes from the scene
  remove() { this.blur(); this.off(); clearInterval(this.bt); const F = this.r.fields, k = F.indexOf(this); if (k >= 0) F.splice(k, 1); if (this.s.h) this.s.patch(new Patch().remove(this.id).remove(this.gid)); this.r.request(); }
}

root.JRender = { EV, EVNAME, NF, MOD, RS, GF, F, rgba, hex, b64ToBytes, b91ToBytes, embedded, DL, Patch, Core, DLScene, GPUContext, Renderer, ANIM, SMNAME, POSES, ViewStates, graphemeBounds, TextEdit, TextField };
})(typeof globalThis !== "undefined" ? globalThis : this);

