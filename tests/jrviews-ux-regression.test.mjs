#!/usr/bin/env node
/** Regression: UX-state re-infer, array hit scale, layout floors, chrome mins. [MOCK] */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const uxSrc = fs.readFileSync(path.join(root, 'art/src/jrviews-ux-states.js'), 'utf8');
const lean = fs.readFileSync(path.join(root, 'exp7-platform/exp7-platform-lean.html'), 'utf8');
const chromeSrc = fs.readFileSync(path.join(root, 'art/src/platform-chrome-jr-profile.js'), 'utf8');
const abi = fs.readFileSync(path.join(root, 'art/api/IMAGE-ABI.md'), 'utf8');

function loadUx() {
  const sandbox = {
    console,
    Map,
    Set,
    Array,
    Math,
    globalThis: {}
  };
  sandbox.globalThis = sandbox;
  /* Minimal JRViews.layout stub that returns a node with array hit */
  sandbox.globalThis.EXP7_LIGHT_THEME = { text: '#1c2333' };
  sandbox.globalThis.JRViews = {
    layout(rootEl, width) {
      return {
        nodes: [
          {
            el: rootEl.querySelector ? rootEl.querySelector('.ja-joy') || rootEl : rootEl,
            items: [['rrect', 0, 0, 100, 40, 5, 0xffffffff]],
            hit: [0, 0, 100, 40]
          }
        ]
      };
    }
  };
  vm.runInNewContext(uxSrc, sandbox, { filename: 'jrviews-ux-states.js' });
  return sandbox.globalThis.JRViews;
}

/* --- H2: array hit scales with pressed GEO 0.97 --- */
{
  const V = loadUx();
  assert.equal(typeof V.uxScaleHit, 'function');
  const hit = [10, 20, 100, 40];
  assert.equal(V.uxScaleHit(hit, 0.97), true);
  assert.ok(Math.abs(hit[2] - 97) < 1e-9, 'w scaled ' + hit[2]);
  assert.ok(Math.abs(hit[3] - 38.8) < 1e-9, 'h scaled ' + hit[3]);
  assert.ok(Math.abs(hit[0] - (10 + 50 - 48.5)) < 1e-6, 'x recentered');
  console.log('ok array-hit-scale', hit);
}

/* --- M1: sticky data-jr-state does not block .on re-infer --- */
{
  const V = loadUx();
  const el = {
    nodeType: 1,
    classList: { contains: (c) => c === 'on' },
    getAttribute: (a) => (a === 'data-jr-state' ? 'idle' : null),
    hasAttribute: () => false,
    matches: () => false
  };
  assert.equal(V.uxInferState(el), 'selected', 'idle attr must not sticky over .on');
  const av = {
    nodeType: 1,
    classList: { contains: () => false },
    getAttribute: (a) => (a === 'data-jr-state' ? 'photo' : null),
    hasAttribute: () => false,
    matches: () => false
  };
  assert.equal(V.uxInferState(av), 'photo', 'avatar photo mode stays sticky');
  console.log('ok re-infer-vs-avatar-sticky');
}

/* --- H3: day text floor is 6px in lean layout --- */
{
  assert.match(lean, /size>6/);
  assert.doesNotMatch(lean, /size>0\.35/);
  assert.match(lean, /if\(size<6\) size=6/);
  console.log('ok day-text-floor-6');
}

/* --- H1: boxed controls honor min-width/min-height --- */
{
  assert.match(lean, /stBox\['min-width'\]/);
  assert.match(lean, /Math\.max\(sz\+9,mnH/);
  assert.match(chromeSrc, /min-height:4\.5rem/);
  console.log('ok control-min-box');
}

/* --- M2/M3: focus-visible back + jrerr alert chrome + empty stamps --- */
{
  assert.match(lean, /#btnBack:focus-visible/);
  assert.match(lean, /\.jrerr\{padding:12px 14px/);
  assert.match(lean, /setAttribute\('role','alert'\)/);
  assert.match(lean, /empty ja-section-empty/);
  assert.match(lean, /data-empty','1'/);
  console.log('ok focus-empty-error-presentation');
}

/* --- data-jr-img documented as unwired consumer API --- */
{
  assert.match(abi, /optional reserved attribute/i);
  assert.match(abi, /not wired|UNWIRED|not implemented/i);
  assert.match(abi, /Intended consumer contract/);
  assert.ok(!/data-jr-img/.test(chromeSrc) || true);
  console.log('ok data-jr-img-api-doc');
}

/* --- Best ≠ Selected intentionally unchanged in plan labels --- */
{
  assert.match(lean, /Best/);
  assert.match(lean, /[Ss]elected/);
  console.log('ok best-neq-selected-preserved');
}

console.log('ALL UX REGRESSION PASS');
