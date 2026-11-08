#!/usr/bin/env node
/** Image ABI unit tests — no GPU required. [MOCK] */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'art/src/jrender-images.js'), 'utf8');

const sandbox = {
  globalThis: {},
  console,
  GPUShaderStage: { VERTEX: 1, FRAGMENT: 2 },
  GPUBufferUsage: { UNIFORM: 1, VERTEX: 2, COPY_DST: 4 },
  GPUTextureUsage: { TEXTURE_BINDING: 1, COPY_DST: 2, RENDER_ATTACHMENT: 4 }
};
sandbox.globalThis = sandbox;
sandbox.globalThis.JRender = { Renderer: { init: null } };
vm.runInNewContext(src, sandbox, { filename: 'jrender-images.js' });
const Images = sandbox.globalThis.JRender.Images;
assert.ok(Images, 'Images exported');

const cases = [
  ['absent', null, false, 'absent'],
  ['empty', '', false, 'absent'],
  ['http', 'http://avatars.githubusercontent.com/u/1', false, 'non-https'],
  ['secret', 'https://avatars.githubusercontent.com/u/1?token=SECRET', false, 'secret-query'],
  ['pat', 'https://avatars.githubusercontent.com/u/1?access_token=x', false, 'secret-query'],
  ['badhost', 'https://evil.example/a.png', false, 'host-not-allowed'],
  ['ok', 'https://avatars.githubusercontent.com/u/1?v=4', true, null],
  ['ok-strip', 'https://avatars.githubusercontent.com/u/1#frag', true, null]
];

let failed = 0;
for (const [name, url, ok, reason] of cases) {
  const r = Images.sanitizeUrl(url);
  try {
    assert.equal(r.ok, ok, name + ' ok');
    if (!ok) assert.equal(r.reason, reason, name + ' reason');
    if (ok) {
      assert.ok(!/[?#]/.test(r.url) || !/[?#].*=/.test(r.url), name + ' stripped secrets');
      assert.ok(r.url.startsWith('https://'), name + ' https');
    }
    console.log('ok', name);
  } catch (e) {
    failed++;
    console.error('FAIL', name, e.message, r);
  }
}

/* Exclusive avatar mode state machine (mirrors PlatformChromeJR). */
function avatarMode(url, loadState) {
  const s = Images.sanitizeUrl(url);
  if (!s.ok) return 'initials';
  if (loadState === 'loading') return 'pending';
  if (loadState === 'ready') return 'photo';
  return 'initials';
}
assert.equal(avatarMode(null, 'ready'), 'initials');
assert.equal(avatarMode('https://avatars.githubusercontent.com/u/1', 'loading'), 'pending');
assert.equal(avatarMode('https://avatars.githubusercontent.com/u/1', 'ready'), 'photo');
assert.equal(avatarMode('https://avatars.githubusercontent.com/u/1', 'error'), 'initials');
assert.equal(avatarMode('https://evil/x', 'ready'), 'initials');
console.log('ok exclusive-modes');

/* Refcount / free bookkeeping without GPU: ImageHandle fields. */
const { ImageHandle, ImageStore } = sandbox.globalThis.JRender;
const fakeGc = { dev: null, lost: false, destroy() {}, recover: null };
const store = new ImageStore(fakeGc);
const h = new ImageHandle(store, 1);
h.refs = 1; h.state = 'ready'; h.url = 'https://avatars.githubusercontent.com/u/1';
store.map.set(1, h); store.byUrl.set(h.url, h);
store.free(h);
assert.equal(h.refs, 0);
assert.equal(h.state, 'freed');
assert.equal(store.map.has(1), false);
console.log('ok free');

/* State table click-path gate. */
const st = JSON.parse(fs.readFileSync(path.join(root, 'art/design/state-table.json'), 'utf8'));
for (const t of st.transitions) {
  if (t.clickPath) assert.ok(t.ms <= 120, 'clickPath ' + t.event + ' ' + t.ms);
}
console.log('ok click-path');

/* Params single source. */
const params = JSON.parse(fs.readFileSync(path.join(root, 'art/design/params.json'), 'utf8'));
assert.equal(params.light.type, 'area-disk');
assert.equal(params.camera.focalMmChosen, 85);
assert.equal(params.images.abi, 'JRDI/1');
console.log('ok params');

if (failed) {
  console.error('FAILED', failed);
  process.exit(1);
}
console.log('ALL PASS', cases.length + 4);
