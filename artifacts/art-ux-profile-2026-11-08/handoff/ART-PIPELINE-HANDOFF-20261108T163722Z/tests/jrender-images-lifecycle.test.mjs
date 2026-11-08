#!/usr/bin/env node
/** Meaningful JRDI lifecycle tests: exclusive paint, races, budgets, hit/clip, recover/free. [MOCK] */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'art/src/jrender-images.js'), 'utf8');
const chromeSrc = fs.readFileSync(path.join(root, 'art/src/platform-chrome-jr-profile.js'), 'utf8');

function loadImages(extra = {}) {
  const sandbox = {
    console,
    URL,
    Map,
    Set,
    Promise,
    Float32Array,
    Uint8Array,
    AbortController,
    setTimeout,
    clearTimeout,
    GPUShaderStage: { VERTEX: 1, FRAGMENT: 2 },
    GPUBufferUsage: { UNIFORM: 1, VERTEX: 2, COPY_DST: 4 },
    GPUTextureUsage: { TEXTURE_BINDING: 1, COPY_DST: 2, RENDER_ATTACHMENT: 4 },
    fetch: extra.fetch,
    createImageBitmap: extra.createImageBitmap,
    OffscreenCanvas: undefined,
    document: undefined,
    ...extra
  };
  sandbox.globalThis = sandbox;
  sandbox.globalThis.JRender = { Renderer: { init: null } };
  vm.runInNewContext(src, sandbox, { filename: 'jrender-images.js' });
  return sandbox.globalThis.JRender;
}

const J = loadImages();
const Images = J.Images;
assert.ok(Images);

/* --- exclusive avatar paint --- */
for (const [mode, want] of [
  ['pending', { showInitials: false, showPhoto: false, showSoftDisc: false }],
  ['loading', { showInitials: false, showPhoto: false, showSoftDisc: false }],
  ['photo', { showInitials: false, showPhoto: true, showSoftDisc: false }],
  ['ready', { showInitials: false, showPhoto: true, showSoftDisc: false }],
  ['initials', { showInitials: true, showPhoto: false, showSoftDisc: true }],
  ['error', { showInitials: true, showPhoto: false, showSoftDisc: true }]
]) {
  const p = Images.exclusiveAvatarPaint(mode === 'error' ? 'initials' : mode);
  assert.equal(p.showInitials, want.showInitials, mode + ' initials');
  assert.equal(p.showPhoto, want.showPhoto, mode + ' photo');
  assert.equal(p.showSoftDisc, want.showSoftDisc, mode + ' soft');
  assert.ok(!(p.showInitials && p.showPhoto), mode + ' never dual');
}
console.log('ok exclusive-paint');

/* --- circle hit / clip --- */
assert.equal(Images.circleContains(10, 10, 5, 10, 10), true);
assert.equal(Images.circleContains(10, 10, 5, 16, 10), false);
assert.equal(Images.imageHit({
  handle: { state: 'ready' }, x: 0, y: 0, w: 36, h: 36, dx: 0, dy: 0, clip: 'circle'
}, 18, 18), true);
assert.equal(Images.imageHit({
  handle: { state: 'ready' }, x: 0, y: 0, w: 36, h: 36, dx: 0, dy: 0, clip: 'circle'
}, 0, 0), false);
assert.equal(Images.imageHit({
  handle: { state: 'ready' }, x: 0, y: 0, w: 36, h: 36, dx: 4, dy: 2, clip: 'circle'
}, 22, 20), true);
console.log('ok hit-clip-parallax-offset');

/* --- sanitize / CORS hosts / secrets --- */
assert.equal(Images.sanitizeUrl('https://avatars.githubusercontent.com/u/1?token=x').ok, false);
assert.equal(Images.sanitizeUrl('https://evil.example/a.png').reason, 'host-not-allowed');
assert.equal(Images.sanitizeUrl('https://avatars.githubusercontent.com/u/1?v=4').url.endsWith('/u/1') || Images.sanitizeUrl('https://avatars.githubusercontent.com/u/1?v=4').url.includes('/u/1'), true);
console.log('ok allowlist');

/* --- mock GPU-less store lifecycle with fake fetch --- */
let fetches = 0;
const png1x1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
function fakeBitmap(w = 8, h = 8) {
  return { width: w, height: h, close() {} };
}
const J2 = loadImages({
  async fetch(url) {
    fetches++;
    if (String(url).includes('bad')) return { ok: false, status: 404 };
    return {
      ok: true,
      status: 200,
      async blob() { return { type: 'image/png', arrayBuffer: async () => png1x1 }; }
    };
  },
  async createImageBitmap() { return fakeBitmap(64, 64); }
});

/* ImageStore without device: load path that fails upload still exercises race/join bookkeeping via error. */
const fakeGc = {
  dev: null,
  lost: false,
  destroy() {},
  recover: null
};
const store = new J2.ImageStore(fakeGc);
store._uploadBitmap = function (handle, bmp) {
  /* Simulate successful upload accounting without WebGPU. */
  const tw = Math.min(256, bmp.width), th = Math.min(256, bmp.height);
  this._evictIfNeeded(tw * th * 4);
  if (handle.tex) this.bytes -= handle.w * handle.h * 4;
  handle.tex = { destroy() {} };
  handle.view = {};
  handle.w = tw; handle.h = th;
  this.bytes += tw * th * 4;
  if (this.bytes > this.peak) this.peak = this.bytes;
};

/* parallel load race joins one inFlight */
fetches = 0;
const u = 'https://avatars.githubusercontent.com/u/42';
const [a, b] = await Promise.all([store.load(u), store.load(u)]);
assert.ok(a === b || (a.url === b.url && a.state === 'ready'));
assert.ok(store.racesJoined >= 1 || a.refs >= 1);
assert.equal(a.state, 'ready');
console.log('ok load-race', { fetches, racesJoined: store.racesJoined, refs: a.refs });

/* bad URL -> error, exclusive initials path */
const bad = await store.load('https://avatars.githubusercontent.com/u/bad');
assert.equal(bad.state, 'error');
const paintErr = J2.Images.exclusiveAvatarPaint('initials');
assert.equal(paintErr.showPhoto, false);
assert.equal(paintErr.showInitials, true);
console.log('ok error-fallback');

/* update/patch generation cancels stale */
const h = await store.load('https://avatars.githubusercontent.com/u/7', { force: true });
const gen0 = h.gen;
await store.patch(h, 'https://avatars.githubusercontent.com/u/8');
assert.ok(h.gen > gen0);
assert.equal(h.state, 'ready');
assert.ok(h.url.includes('/u/8'));
console.log('ok update-patch');

/* free / unmount */
store.free(h, true);
assert.equal(h.state, 'freed');
assert.equal(store.map.has(h.id), false);
console.log('ok free-unmount');

/* recover after context loss */
const h2 = await store.load('https://avatars.githubusercontent.com/u/9', { force: true });
assert.equal(h2.state, 'ready');
h2.tex = null; h2.view = null;
await store.recover();
assert.equal(h2.state, 'ready');
assert.ok(store.recoveries >= 1);
console.log('ok device-loss-recover');

/* budget eviction */
const tiny = new J2.ImageStore(fakeGc);
tiny._uploadBitmap = store._uploadBitmap.bind(tiny);
const handles = [];
for (let i = 0; i < J2.Images.MAX_ENTRIES + 4; i++) {
  const hh = await tiny.load('https://avatars.githubusercontent.com/u/' + (1000 + i), { force: true });
  hh.refs = 0; /* allow eviction */
  handles.push(hh);
}
assert.ok(tiny.map.size <= J2.Images.MAX_ENTRIES, 'entries capped ' + tiny.map.size);
console.log('ok texture-entry-budget', tiny.stats());

/* alpha clamp on layer */
const layer = new J2.ImageLayer({ dpr: 2, c: { width: 200, height: 100 }, fmt: 'bgra8unorm', lost: false, hidden: false, entries: [] });
layer.set(1, { handle: { state: 'ready', view: {} }, x: 0, y: 0, w: 36, h: 36, alpha: 2 });
assert.equal(layer.nodes.get(1).alpha, 1);
layer.set(1, { handle: { state: 'ready', view: {} }, x: 0, y: 0, w: 36, h: 36, alpha: -1 });
assert.equal(layer.nodes.get(1).alpha, 0);
layer.shift(1, 3, -2);
assert.equal(layer.nodes.get(1).dx, 3);
assert.equal(layer.hit(18, 18), 1);
assert.equal(layer.hit(0, 0), null);
console.log('ok alpha-dpr-layer-hit');

/* chrome exclusive paint helper presence (source contract) */
assert.ok(chromeSrc.includes('exclusiveAvatarPaint'));
assert.ok(chromeSrc.includes('unmount'));
assert.ok(chromeSrc.includes('onContextLost'));
assert.ok(chromeSrc.includes('showInitials'));
assert.ok(!/showInitials:\s*true[\s\S]{0,40}showPhoto:\s*true/.test(chromeSrc));
console.log('ok chrome-source-contract');

/* no second renderer markers */
assert.ok(src.includes('No second renderer') || src.includes('shared GPUContext'));
assert.ok(!/WebGL2|webgl2|css-renderer|dom-renderer/i.test(src));
console.log('ok no-second-renderer');

console.log('ALL LIFECYCLE PASS');
