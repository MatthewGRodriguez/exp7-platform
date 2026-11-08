#!/usr/bin/env node
/** Focused acceptance checks for Exp7Views unbundle (1.7.0). */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let failed = 0;
function ok(cond, msg) {
  if (!cond) {
    console.error('FAIL:', msg);
    failed++;
  } else {
    console.log('PASS:', msg);
  }
}
function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}
function sha256(s) {
  return crypto.createHash('sha256').update(s).digest('hex');
}

// 1) Canonical sources exist
const required = [
  'src/exp7-views/exp7-views.js',
  'src/exp7-views/views-host-impl.js',
  'src/exp7-views/theme-criticality.js',
  'src/exp7-views/vendor/runtime-factory.js',
  'src/exp7-views/vendor/jrviews.js',
  'src/exp7-views/vendor/atlas.js',
  'src/budget/budget-app.js',
  'src/standalone/exp7-views-standalone.html',
  'build/build.mjs',
  'dist/exp7-views-standalone.html',
  'exp7-platform/exp7-platform-lean.html',
  'exp7-platform/release.json',
];
required.forEach((r) => ok(fs.existsSync(path.join(ROOT, r)), 'exists ' + r));

const api = read('src/exp7-views/exp7-views.js');
ok(api.includes("MODULE_ID = 'exp7-views@1'"), 'API declares exp7-views@1');
ok(api.includes("presentation: 'runtime-html-string→JRViews→JRender'"), 'API presentation path');
ok(api.includes('legacyDomPath: false'), 'API rejects legacy DOM path flag');
ok(api.includes('function mount('), 'API mount');
ok(api.includes('function dispose('), 'API dispose');
ok(api.includes('blankMoneyAtlas'), 'API blankMoneyAtlas');

const budget = read('src/budget/budget-app.js');
ok(budget.includes("Exp7Views.MODULE_ID !== 'exp7-views@1'"), 'Budget requires same module id');
ok(budget.includes('Exp7Views.mount'), 'Budget mounts via Exp7Views');
ok(!/JA_RUNTIME_FACTORY\s*\(\s*window\s*,\s*document\s*,/.test(budget), 'Budget does not use legacy factory DOM remount');
ok(budget.includes('expense') && budget.includes('income') && budget.includes('debt') && budget.includes('asset'), 'Budget board types');
ok(budget.includes('harmonicShares'), 'Budget harmonic shares');
ok(budget.includes("DB_NAME = 'budget-app-v1'"), 'Budget keeps budget-app-v1 IDB');

const demoConsume = read('src/demo/demo-consume-views.js');
ok(demoConsume.includes("MODULE_ID !== 'exp7-views@1'"), 'Demo requires same module id');

const standalone = read('dist/exp7-views-standalone.html');
ok(standalone.includes('exp7-views@1'), 'Standalone embeds module id');
ok(standalone.includes('Exp7Views'), 'Standalone uses Exp7Views');
ok(standalone.includes('blankMoneyAtlas'), 'Standalone uses blankMoneyAtlas');
ok(!standalone.includes('const TABS='), 'Standalone has no demo tab chrome');
ok(standalone.includes('JA_RUNTIME_FACTORY'), 'Standalone includes factory as builder dependency (string stage)');
ok(!/JA_RUNTIME_FACTORY\s*\(\s*window\s*,\s*document\s*,/.test(standalone), 'Standalone does not invoke factory on real document');

const lean = read('exp7-platform/exp7-platform-lean.html');
const release = JSON.parse(read('exp7-platform/release.json'));
ok(release.version === '1.7.0', 'release version 1.7.0');
ok(release.contains.budgetMode === 'exp7-views', 'release budgetMode exp7-views');
ok(release.contains.viewsModuleId === 'exp7-views@1', 'release views module id');
ok(release.sha256 === sha256(lean), 'release sha256 matches lean file');
ok(lean.includes('SHELL_VERSION="1.7.0"'), 'shell version 1.7.0');

// Decode packages and check module identity shared
function decodePkg(id) {
  const m = lean.match(new RegExp(`id="${id}">([A-Za-z0-9+/\\s=]+)</script>`));
  ok(!!m, 'lean has ' + id);
  return Buffer.from(m[1].replace(/\s+/g, ''), 'base64').toString('utf8');
}
const apppkg = decodePkg('apppkg');
const budgetpkg = decodePkg('budgetpkg');
ok(apppkg.includes("MODULE_ID = 'exp7-views@1'") || apppkg.includes("MODULE_ID='exp7-views@1'") || apppkg.includes('exp7-views@1'), 'apppkg has exp7-views@1');
ok(budgetpkg.includes('exp7-views@1'), 'budgetpkg has exp7-views@1');
ok(budgetpkg.includes('Exp7Views.mount') || budgetpkg.includes('window.Exp7Views.mount'), 'budgetpkg mounts Exp7Views');
ok(!/JA_RUNTIME_FACTORY\s*\(\s*window\s*,\s*document\s*,/.test(budgetpkg), 'budgetpkg no legacy DOM factory invoke');
ok(apppkg.includes('function setView'), 'apppkg still has accepted setView host');
ok(apppkg.includes('JRViews'), 'apppkg has JRViews');

// Rebuild reproducibility
const before = sha256(lean);
const built = spawnSync('node', ['build/build.mjs'], { cwd: ROOT, encoding: 'utf8' });
ok(built.status === 0, 'rebuild exits 0');
const after = sha256(read('exp7-platform/exp7-platform-lean.html'));
ok(before === after, 'rebuild is reproducible (lean sha stable)');
const man = JSON.parse(read('dist/source-sha-manifest.json'));
ok(man.artifacts.lean.sha256 === after, 'source-sha-manifest matches lean');
ok(man.viewsModuleId === 'exp7-views@1', 'manifest module id');

// Standalone size/sha reported
const st = fs.readFileSync(path.join(ROOT, 'dist/exp7-views-standalone.html'));
console.log('STANDALONE_BYTES', st.length);
console.log('STANDALONE_SHA256', sha256(st));

if (failed) {
  console.error('\n' + failed + ' failure(s)');
  process.exit(1);
}
console.log('\nAll focused tests passed.');
