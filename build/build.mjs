#!/usr/bin/env node
/**
 * Assemble canonical src/ into:
 *  - exp7-platform/exp7-platform-lean.html (+ release.json)
 *  - dist/exp7-views-standalone.html
 *  - dist/source-sha-manifest.json
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const VERSION = '1.7.0';

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}
function write(rel, data) {
  const p = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, data);
  return p;
}
function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}
function b64(text) {
  return Buffer.from(text, 'utf8').toString('base64');
}

function escapeScript(text) {
  // Prevent HTML parser from closing <script> on literal end tags inside JS/text.
  return String(text).replace(/<\/script/gi, '<\\/script');
}

function expandIncludes(html) {
  return html.replace(/\/\* INCLUDE:([^*]+) \*\//g, (_, rel) => {
    const p = rel.trim();
    return escapeScript(read(p));
  });
}

/** Ordered Exp7Views dependency scripts (shared by demo, budget, standalone). */
function viewsScriptTags() {
  const plain = (id, file) => {
    const body = escapeScript(read(file));
    return `<script type="text/plain" id="${id}" data-enc="b91">${body}</script>`;
  };
  const js = (file) => `<script>\n${escapeScript(read(file))}\n</script>`;
  return [
    js('src/exp7-views/vendor/jfactor_exp6.js'),
    js('src/exp7-views/vendor/jbp.js'),
    js('src/exp7-views/vendor/atlas.js'),
    js('src/exp7-views/vendor/eval.js'),
    js('src/exp7-views/vendor/runtime-factory.js'),
    js('src/exp7-views/vendor/jrender.classic.js'),
    js('src/exp7-views/vendor/motion-config.js'),
    plain('jr-wasm', 'src/exp7-views/assets/jr-wasm.b91.txt'),
    plain('jr-font', 'src/exp7-views/assets/jr-font.b91.txt'),
    plain('jr-font-bold', 'src/exp7-views/assets/jr-font-bold.b91.txt'),
    js('src/exp7-views/vendor/jr-asset-sizes.js'),
    js('src/exp7-views/vendor/jrviews.js'),
    js('src/exp7-views/vendor/gpu-motion.js'),
    js('src/exp7-views/vendor/slab-config.js'),
    js('src/exp7-views/theme-criticality.js'),
    js('src/exp7-views/exp7-views.js'),
    js('src/exp7-views/views-host-impl.js'),
  ].join('\n');
}

function buildDemoApp() {
  let html = read('src/demo/exp7-demo.skeleton.html');
  const demoBundle = [
    'src/demo/demo-app-open.js',
    'src/demo/demo-app-pre.js',
    'src/demo/demo-consume-views.js',
    'src/demo/demo-app-post.js',
  ].map(read).join('\n');

  const startMark = '<script>/* INCLUDE:src/exp7-views/theme-criticality.js */</script>';
  const endMark = '<script>/* INCLUDE:src/demo/demo-app-post.js */</script>';
  const start = html.indexOf(startMark);
  const end = html.indexOf(endMark);
  if (start < 0 || end < 0) throw new Error('demo skeleton missing views/demo include block');
  const replacement = [
    '<script>/* theme */\n' + escapeScript(read('src/exp7-views/theme-criticality.js')) + '\n</script>',
    '<script>/* Exp7Views API */\n' + escapeScript(read('src/exp7-views/exp7-views.js')) + '\n</script>',
    '<script>/* Exp7Views host */\n' + escapeScript(read('src/exp7-views/views-host-impl.js')) + '\n</script>',
    '<script>/* Exp7 demo consumer */\n' + escapeScript(demoBundle) + '\n</script>',
  ].join('\n');
  html = html.slice(0, start) + replacement + html.slice(end + endMark.length);

  html = expandIncludes(html);
  const left = html.match(/\/\* INCLUDE:[^*]+\*\//g);
  if (left) throw new Error('unexpanded includes in demo: ' + left.join(', '));
  return html;
}

function injectViews(html) {
  const marker = '<!-- VIEWS_SCRIPTS -->';
  const i = html.indexOf(marker);
  if (i < 0) throw new Error('missing VIEWS_SCRIPTS marker');
  // Use slice, not String.replace — replacement strings treat $ specially and
  // corrupt inlined vendor JS that contains $& / $' / $1 sequences.
  return html.slice(0, i) + viewsScriptTags() + html.slice(i + marker.length);
}

function buildBudgetApp() {
  let html = read('src/budget/budget-app.html');
  // Expand app includes BEFORE inlining vendor (vendor may contain the substring INCLUDE).
  html = expandIncludes(html);
  return injectViews(html);
}

function buildStandalone() {
  let html = read('src/standalone/exp7-views-standalone.html');
  html = expandIncludes(html);
  return injectViews(html);
}

function loadShell() {
  const shellPath = path.join(ROOT, 'src/shell/platform-shell.js');
  if (!fs.existsSync(shellPath)) throw new Error('missing src/shell/platform-shell.js');
  return fs.readFileSync(shellPath, 'utf8');
}

function loadChrome() {
  const p = path.join(ROOT, 'src/shell/platform-chrome.html');
  if (!fs.existsSync(p)) throw new Error('missing src/shell/platform-chrome.html');
  return fs.readFileSync(p, 'utf8');
}

function sourceManifest() {
  const files = [];
  function walk(dir) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(p);
      else if (/\.(js|html|css|txt|md|json)$/.test(ent.name)) {
        const rel = path.relative(ROOT, p);
        const buf = fs.readFileSync(p);
        files.push({ path: rel, bytes: buf.length, sha256: sha256(buf) });
      }
    }
  }
  walk(path.join(ROOT, 'src'));
  walk(path.join(ROOT, 'build'));
  files.sort((a, b) => a.path.localeCompare(b.path));
  return files;
}

function main() {
  const shell = loadShell();
  let shellOut = shell
    .replace(/SHELL_VERSION="[^"]+"/, `SHELL_VERSION="${VERSION}"`)
    .replace(/shell 1\.\d+\.\d+/g, `shell ${VERSION}`)
    .replace(/Budget = direct HTML[^"]*/g, 'Budget = Exp7Views consumer (shared module with demo)');
  // BOUNDARY string may contain commas/parens — rewrite whole BOUNDARY assignment fragment carefully
  shellOut = shellOut.replace(
    /BOUNDARY="[^"]*"/,
    `BOUNDARY="shell ${VERSION}: app-first direct mount (no iframe). Apps: Exp7 + Budget (Budget = Exp7Views consumer, own slot). Reserved top bar (back+avatar) with layout space; Exp7 proposal-op sync under exp7-app-v1/ only; Budget local IDB only. PAT closure-local. Last app id persisted (non-destructive)."`
  );

  const demo = buildDemoApp();
  const budget = buildBudgetApp();
  const standalone = buildStandalone();

  const apppkgB64 = b64(demo);
  const budgetB64 = b64(budget);

  const chrome = loadChrome();
  const lean =
    chrome +
    `<script type="application/octet-stream" id="apppkg">${apppkgB64}</script>\n` +
    `<script type="application/octet-stream" id="budgetpkg">${budgetB64}</script>\n` +
    `<script>\n${shellOut}\n</script>\n</body></html>\n`;

  write('exp7-platform/exp7-platform-lean.html', lean);
  write('dist/exp7-views-standalone.html', standalone);
  write('dist/exp7-demo.app.html', demo);
  write('dist/budget-app.html', budget);

  const files = sourceManifest();
  const viewsSha = sha256(
    files.filter((f) => f.path.startsWith('src/exp7-views/')).map((f) => f.sha256).join('\n')
  );
  const manifest = {
    version: VERSION,
    builtAt: new Date().toISOString(),
    viewsModuleId: 'exp7-views@1',
    viewsSourcesAggregateSha256: viewsSha,
    files,
    artifacts: {
      lean: { path: 'exp7-platform/exp7-platform-lean.html', sha256: sha256(lean), bytes: Buffer.byteLength(lean) },
      apppkg: { sha256: sha256(demo), bytes: Buffer.byteLength(demo) },
      budgetpkg: { sha256: sha256(budget), bytes: Buffer.byteLength(budget) },
      standalone: {
        path: 'dist/exp7-views-standalone.html',
        sha256: sha256(standalone),
        bytes: Buffer.byteLength(standalone),
      },
    },
  };
  write('dist/source-sha-manifest.json', JSON.stringify(manifest, null, 2));

  const release = {
    format: 'exp7-platform-release/1',
    version: VERSION,
    file: 'exp7-platform/exp7-platform-lean.html',
    sha256: sha256(lean),
    minLauncherMajor: 1,
    contains: {
      app:
        'exp7-lean demo + Budget as Exp7Views consumers (shared exp7-views@1: runtime HTML→JRViews→JRender); reserved top bar; exclusive avatar; Budget local-IDB only',
      appSha256: sha256(demo),
      budgetSha256: sha256(budget),
      budgetMode: 'exp7-views',
      viewsModuleId: 'exp7-views@1',
      viewsSourcesAggregateSha256: viewsSha,
      standalone: 'dist/exp7-views-standalone.html',
      standaloneSha256: sha256(standalone),
    },
  };
  write('exp7-platform/release.json', JSON.stringify(release, null, 2) + '\n');

  console.log(JSON.stringify({
    version: VERSION,
    leanSha: release.sha256,
    appSha: release.contains.appSha256,
    budgetSha: release.contains.budgetSha256,
    standaloneSha: release.contains.standaloneSha256,
    standaloneBytes: manifest.artifacts.standalone.bytes,
    viewsAggregate: viewsSha,
  }, null, 2));
}

main();
