#!/usr/bin/env node
/** Regression: app A→B→A must reveal WebGPU views (1.8.6). No WebGPU required. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const leanPath = path.join(root, 'exp7-platform/exp7-platform-lean.html');
const releasePath = path.join(root, 'exp7-platform/release.json');
const lean = fs.readFileSync(leanPath, 'utf8');
const release = JSON.parse(fs.readFileSync(releasePath, 'utf8'));
const sha = crypto.createHash('sha256').update(lean).digest('hex');

assert.equal(release.version, '1.8.6');
assert.equal(release.sha256, sha, 'release.json sha256 must match lean tip');
assert.match(lean, /const SHELL_VERSION="1\.8\.6"/);

assert.match(lean, /function revealAppViews\(/, 'revealAppViews helper required');
assert.match(lean, /function disposeSlotViews\(/, 'disposeSlotViews helper required');
assert.match(lean, /V\.queue\(V\.sess,"reveal"\)/, 'reveal must re-queue JRViews');
assert.match(lean, /revealed:true/, 'openApp reuse must record revealed');
assert.match(lean, /if\(UI\.mountedAppId\)\{try\{revealAppViews\(UI\.mountedAppId\)/, 'hideAppsOverlay must reveal');
assert.match(lean, /showOnlySlot\(appId\);UI\.mountedAppId=appId;await rememberAppForUser\(appId\);try\{layoutReservedChrome\(\);window\.dispatchEvent\(new Event\("resize"\)\);revealAppViews\(appId\)/, 'openApp reuse must reveal after showOnlySlot');
assert.match(lean, /try\{disposeSlotViews\(appId\)\}/, 'clearSlot must dispose views');
assert.match(lean, /el\.closest\('\.appSlot'\)/, 'Exp7Slabs.visible must check .appSlot');
assert.match(lean, /el\.closest\('#appShell'\)/, 'Exp7Slabs.visible must check #appShell');
assert.match(lean, /V\.view\.s\.free/, 'Exp7Views.dispose must free scene');
assert.match(lean, /V\.view\.r\.destroy/, 'Exp7Views.dispose must destroy renderer');

/** Pure logic: reuse path must not treat resize-alone as sufficient. */
assert.doesNotMatch(
  lean,
  /if\(UI\.slots\[appId\]&&UI\.slots\[appId\]\.mounted\)\{[^}]*dispatchEvent\(new Event\("resize"\)\)\}catch\(e\)\{\}rec\("open_app","pass",\{appId,reused:true,ready:/s,
  'old reuse path (resize only, no reveal) must be gone'
);

/** Simulate slot hide/show + reveal counter without GPU. */
function simulateSwitch() {
  const UI = {
    slots: { exp7: { mounted: true, ready: true }, budget: { mounted: true, ready: true } },
    mountedAppId: 'exp7',
    appsOpen: false
  };
  const slots = {
    exp7: { hidden: false, canvases: [{ pixels: 'content-exp7' }] },
    budget: { hidden: true, canvases: [{ pixels: 'content-budget' }] }
  };
  function showOnlySlot(id) {
    for (const k of Object.keys(slots)) slots[k].hidden = k !== id;
  }
  function blankHidden() {
    for (const k of Object.keys(slots)) {
      if (slots[k].hidden) slots[k].canvases.forEach(c => { c.pixels = ''; });
    }
  }
  function reveal(id) {
    slots[id].canvases.forEach(c => { c.pixels = 'content-' + id; });
  }
  function openApp(id) {
    // model: hide other (display:none → blank), show target, MUST reveal
    showOnlySlot(id);
    blankHidden();
    UI.mountedAppId = id;
    reveal(id); // 1.8.6
  }
  openApp('budget');
  assert.equal(slots.exp7.canvases[0].pixels, '');
  assert.equal(slots.budget.canvases[0].pixels, 'content-budget');
  openApp('exp7'); // second switch — previously blank without reveal
  assert.equal(slots.exp7.canvases[0].pixels, 'content-exp7', 'A→B→A must restore Exp7 pixels');
  assert.equal(slots.budget.canvases[0].pixels, '');
  openApp('budget');
  openApp('exp7');
  assert.equal(slots.exp7.canvases[0].pixels, 'content-exp7');
}
simulateSwitch();

console.log(JSON.stringify({
  ok: true,
  version: release.version,
  sha256: sha.slice(0, 16) + '…',
  checks: [
    'release sha matches lean',
    'revealAppViews wired on reuse + hideAppsOverlay',
    'disposeSlotViews on clearSlot',
    'Exp7Slabs.visible gates appSlot/appShell',
    'A→B→A simulation restores pixels'
  ]
}, null, 2));
