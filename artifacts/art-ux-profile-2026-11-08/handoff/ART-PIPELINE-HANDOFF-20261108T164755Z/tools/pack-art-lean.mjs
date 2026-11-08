#!/usr/bin/env node
/** Pack art-pass sources into exp7-platform-lean.html and refresh release.json. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const leanPath = path.join(root, 'exp7-platform/exp7-platform-lean.html');
const releasePath = path.join(root, 'exp7-platform/release.json');
const VERSION = '1.8.4';

function read(p) { return fs.readFileSync(p, 'utf8'); }
function sha256(buf) { return crypto.createHash('sha256').update(buf).digest('hex'); }

let html = read(leanPath);
const beforeChars = html.length;
const beforeLines = html.split(/\n/).length;
const beforeHash = sha256(html);

const images = read(path.join(root, 'art/src/jrender-images.js'));
const ux = read(path.join(root, 'art/src/jrviews-ux-states.js'));
const chrome = read(path.join(root, 'art/src/platform-chrome-jr-profile.js'));

function replaceOrInject(html, markerAttr, body, afterNeedle) {
  const open = '<script data-exp7-shared="' + markerAttr + '">';
  const idx = html.indexOf(open);
  if (idx >= 0) {
    const end = html.indexOf('</script>', idx);
    if (end < 0) throw new Error('unclosed ' + markerAttr);
    return html.slice(0, idx) + open + '\n' + body + '\n' + html.slice(end);
  }
  const anchor = html.indexOf(afterNeedle);
  if (anchor < 0) throw new Error('anchor missing for ' + markerAttr);
  const end = html.indexOf('</script>', anchor);
  if (end < 0) throw new Error('anchor unclosed for ' + markerAttr);
  const inject = '\n' + open + '\n' + body + '\n</script>';
  return html.slice(0, end + '</script>'.length) + inject + html.slice(end + '</script>'.length);
}

/* 1) Inject / refresh jrender-images after jrender classic. */
html = replaceOrInject(html, 'jrender-images', images, '<script data-exp7-shared="jrender">');

/* 2) Inject / refresh UX states after theme (needs JRViews + EXP7_LIGHT_THEME). */
html = replaceOrInject(html, 'jrviews-ux-states', ux, 'data-exp7-shared="theme"');

/* 3) Replace PlatformChromeJR script body (match root.PlatformChromeJR assignment). */
const chromeAnchor = html.indexOf('root.PlatformChromeJR');
if (chromeAnchor < 0) throw new Error('PlatformChromeJR not found');
const chromeScript = html.lastIndexOf('<script>', chromeAnchor);
const chromeEnd = html.indexOf('</script>', chromeAnchor);
if (chromeScript < 0 || chromeEnd < 0) throw new Error('PlatformChromeJR script bounds missing');
html = html.slice(0, chromeScript) + '<script>\n' + chrome + '\n' + html.slice(chromeEnd);

/* 4) Bump shell version. */
html = html.replace(/const SHELL_VERSION="1\.8\.3"/g, 'const SHELL_VERSION="' + VERSION + '"');
html = html.replace(/const SHELL_VERSION='1\.8\.3'/g, "const SHELL_VERSION='" + VERSION + "'");

/* 5) Tiny theme comment bump for art hierarchy note (no palette rebrand). */
if (!html.includes('art-pass-1.8.4')) {
  html = html.replace(
    '/* Exp7 light theme + plan-risk criticality colors (accepted Exp7 defaults). */',
    '/* Exp7 light theme + plan-risk criticality colors (accepted Exp7 defaults). art-pass-1.8.4: state washes via jrviews-ux-states; palette unchanged. */'
  );
}

const afterChars = html.length;
const afterLines = html.split(/\n/).length;
const afterHash = sha256(html);
fs.writeFileSync(leanPath, html);

const release = JSON.parse(read(releasePath));
const prev = { ...release };
release.version = VERSION;
release.sha256 = afterHash;
release.contains = {
  ...release.contains,
  app: release.contains.app + '; art-pass JRDI profile images + UX state table; exclusive avatar photo/initials',
  chromeJr: 'PlatformChromeJR: JRDI circular avatar photo (exclusive initials fallback); bar/apps JRViews; Budget tabs in hostDoc',
  artPass: '1.8.4-art JRDI/1 + state-table + params; Blender/Moho BLOCKED on cloud'
};
fs.writeFileSync(releasePath, JSON.stringify(release, null, 2) + '\n');

const metrics = {
  version: VERSION,
  before: { chars: beforeChars, lines: beforeLines, sha256: beforeHash },
  after: { chars: afterChars, lines: afterLines, sha256: afterHash },
  delta: { chars: afterChars - beforeChars, lines: afterLines - beforeLines },
  blocks: {
    'jrender-images': images.length,
    'jrviews-ux-states': ux.length,
    'platform-chrome-jr-profile': chrome.length
  },
  asciiSafe: !/[^\x09\x0A\x0D\x20-\x7E]/.test(images + ux + chrome),
  stamp: new Date().toISOString()
};
const artDir = path.join(root, 'artifacts/art-ux-profile-2026-11-08/pack');
fs.mkdirSync(artDir, { recursive: true });
fs.writeFileSync(path.join(artDir, 'metrics.json'), JSON.stringify(metrics, null, 2));
console.log(JSON.stringify(metrics, null, 2));
