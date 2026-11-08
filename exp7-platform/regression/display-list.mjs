/* Display-list regressions for the live shell.
 * Goes through JRViews.View.show({ displayListOnly: true }), the same layout
 * call the GPU path uses. A local-layout bypass fails these checks.
 * This is not a Mac WebGPU paint pass.
 *
 *   node exp7-platform/regression/display-list.mjs
 * jsdom resolves from NODE_PATH, or from /tmp/proof-deps/node_modules.
 */
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
let JSDOM;
try { ({ JSDOM } = require('jsdom')); }
catch { ({ JSDOM } = require('/tmp/proof-deps/node_modules/jsdom')); }

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const leanPath = join(root, 'exp7-platform-lean.html');
const lean = readFileSync(leanPath, 'utf8');
const fails = [];
function check(name, cond, detail) {
  if (cond) { console.log('ok  ' + name); return; }
  fails.push(name + (detail ? ' — ' + detail : ''));
  console.error('FAIL ' + name + (detail ? ' — ' + detail : ''));
}

function scripts() {
  const parts = lean.split(/<script\b([^>]*)>/);
  const out = [];
  for (let i = 1; i < parts.length; i += 2) {
    const attrs = parts[i];
    const body = parts[i + 1].split('</script>', 1)[0];
    if (/octet-stream|text\/plain/.test(attrs) || !body.trim()) continue;
    out.push({ attrs, body });
  }
  return out;
}
const all = scripts();
const jr = all.find(s => s.body.includes('function cssPx'));
const ux = all.find(s => s.body.includes('function penumbraStrips'));
const slabs = all.find(s => s.body.includes('class Slabs'));
if (!jr || !ux || !slabs) {
  console.error('could not find jrviews, ux, or slabs in the lean file');
  process.exit(1);
}

function bootContext() {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { runScripts: 'dangerously', url: 'https://exp7.local/' });
  const context = dom.getInternalVMContext();
  let src = jr.body.replace(
    'let CORE=null, FONT=0, FONTB=0, GC=null, BOOT=null, INITERR=null; const GID=7;',
    'let CORE=null, FONT=0, FONTB=0, GC=null, BOOT=null, INITERR=null; const GID=7;\n' +
    'CORE={measure:function(f,sz,t){return String(t).length*sz*0.55},wrap:function(){return {count:1,height:19,lines:[]}},richLayout:function(){return {count:1,height:19}},hasGlyph:function(){return true}}; FONT=1; FONTB=1;'
  );
  context.JRender = {
    DL: function () {},
    Patch: function () { this.ops = []; this.xform = function (id, m) { this.ops.push(m); }; this.colorItem = function () {}; },
    Core: function () {}, Renderer: {}, GPUContext: function () {},
    NF: { HIT: 1, DRAG: 2 }, GF: {},
    EV: { ENTER: 1, LEAVE: 2, DOWN: 3, UP: 4, CLICK: 5, CANCEL: 11 },
    MOD: {}, RS: {},
    rgba: function (r, g, b, a) {
      return (r & 255) | ((g & 255) << 8) | ((b & 255) << 16) | (((a == null ? 255 : a) & 255) << 24);
    },
    hex: function () { return 1; },
    embedded: function () { return null },
    TextField: function () {}
  };
  context.window.JRender = context.JRender;
  context.EXP7_LIGHT_THEME = { surface: '#ffffff' };
  vm.runInContext(src, context, { filename: 'jrviews.js' });
  vm.runInContext(ux.body, context, { filename: 'ux.js' });
  return { dom, context };
}

function unpack(c) {
  return [c & 255, (c >> 8) & 255, (c >> 16) & 255, (c >>> 24) & 255];
}
function fillOf(n) {
  return (n.items || []).find(it => (it[0] === 'rrect' || it[0] === 'rect') && it[3] >= 16 && it[4] >= 16);
}
function over(fg, bg) {
  const a = fg[3] / 255;
  return [0, 1, 2].map(i => Math.round(fg[i] * a + bg[i] * (1 - a)));
}

const { dom, context } = bootContext();
const JR = context.JRViews;
const doc = context.document;

check('ux has no idle frame loop', !/requestAnimationFrame/.test(ux.body));
check('click path stays within 120ms', Object.values(JR.UX_CLICK_MS).every(ms => ms <= 120));
check('refraction and moho stay blocked in the hook source', ux.body.includes("blocked-no-dl-op") && ux.body.includes("blocked-no-svg-op") && ux.body.includes("not-emitted"));

const days = Array.from({ length: 8 }, (_, i) =>
  '<div class="ja-day' + (i === 1 ? ' ja-sel' : i === 2 ? ' dragging' : i === 3 ? ' best' : '') + '" data-day="' + (i + 1) + '"><span class="ja-dn">' + (i + 1) + '</span></div>'
).join('');
const html = '<div class="ja-cal">' + days + '</div>' +
  '<div class="ja-bar"><button class="ja-joy" data-jv-act="a">Idle</button><button class="ja-joy on" data-jv-act="b">Sel</button></div>' +
  '<section class="ja-section" style="background:#30353b;color:#ffffff">Dark</section>' +
  '<button class="ja-joy" disabled data-jv-act="d">Off</button>' +
  '<button class="ja-joy on" data-jv-act="av" data-jr-state="photo" style="border-radius:999px">A</button>';
const host = doc.createElement('div');
host.innerHTML = html;
const canvas = doc.createElement('canvas');
const view = new JR.View();
const shown = await view.show(canvas, host, 420, { displayListOnly: true });
const L = shown.L;
check('show() returns the decorated display list', shown.mode === 'display-list' && shown.gpu === false && L && L.uxStates === true, shown.mode);
check('light id is the measured penumbra', L.uxLight === 'penumbra-0.79-0.93-elev50', L.uxLight);
check('camera record is 85mm', L.uxCamera && L.uxCamera.focalMm === 85 && L.uxCamera.distancePx === 2099.1);
check('refraction is reported blocked', L.uxRefraction === 'blocked-no-dl-op');
check('moho is reported blocked', L.uxMoho === 'blocked-no-svg-op');
check('caustic specks are not emitted', L.uxCaustics === 'not-emitted');

const dayNodes = L.nodes.filter(n => n.el && n.el.classList.contains('ja-day') && fillOf(n));
const sel = dayNodes.find(n => n.el.classList.contains('ja-sel'));
const idle = dayNodes.find(n => !n.el.classList.contains('ja-sel') && !n.el.classList.contains('dragging') && !n.el.classList.contains('best'));
const drag = dayNodes.find(n => n.el.classList.contains('dragging'));
const best = dayNodes.find(n => n.el.classList.contains('best'));
const sameRow = [idle, sel, drag, best].map(n => Math.round(fillOf(n)[2]));
check('selected and dragging days do not translate', new Set(sameRow).size === 1, sameRow.join(','));
const selAlphas = (sel.uxPenumbra && sel.uxPenumbra.alphas) || [];
check('selected day penumbra fades across rows', selAlphas.length >= 2 && selAlphas[0] > selAlphas[selAlphas.length - 1], selAlphas.join(','));
check('idle rest shadow is tighter than the selected shadow', idle.uxPenumbra && idle.uxPenumbra.blur < sel.uxPenumbra.blur);
check('dragging day clips the tail that would cover the next day', !!(drag.uxPenumbra && drag.uxPenumbra.clipped));
const selFill = fillOf(sel);
const selShadowEnd = Math.max(...(sel.items || []).filter(it => it[0] === 'rect' && it[4] === 1 && (it[5] & 255) === 20).map(it => it[2] + it[4]));
const below = dayNodes.filter(n => fillOf(n)[2] > selFill[2] + 1).map(n => fillOf(n)[2]);
const nextTop = below.length ? Math.min(...below) : selFill[2] + selFill[4] + 4;
check('selected shadow ends at the next row', selShadowEnd <= nextTop + 0.01, selShadowEnd + ' vs ' + nextTop);
check('best is not selected', best && !best.uxPenumbra || (best.uxPenumbra && best.uxPenumbra.blur < sel.uxPenumbra.blur * 0.8));
check('best day has no gold selected ring', !(best.items || []).some(it => it[0] === 'border' && unpack(it[it.length - 1])[0] === 117 && unpack(it[it.length - 1])[1] === 81));

const joys = L.nodes.filter(n => n.el && n.el.classList.contains('ja-joy') && fillOf(n));
const joyIdle = joys.find(n => n.el.getAttribute('data-jv-act') === 'a');
const joyOn = joys.find(n => n.el.getAttribute('data-jv-act') === 'b');
check('selected button rises 2px and the hit rises with it',
  Math.round(fillOf(joyIdle)[2] - fillOf(joyOn)[2]) === 2 && Math.round(joyOn.hit[1]) === Math.round(fillOf(joyOn)[2]));
const photo = joys.find(n => n.el.getAttribute('data-jr-state') === 'photo');
check('avatar disc is not lifted', photo && !photo.uxLiftPx && !photo.uxContact);

const dark = L.nodes.find(n => n.el && n.el.classList.contains('ja-section'));
check('dark glass gets the static CA1 read', dark && dark.uxGlass === 'ca1-static', dark && dark.uxGlass);
check('a light day does not get a white-on-white glass rim', sel.uxGlass === 'below-perception', sel.uxGlass);

const dis = joys.find(n => n.el.hasAttribute('disabled'));
const disText = (dis.items || []).find(it => it[0] === 'text' || it[0] === 'tbox' || it[0] === 'label');
const disInk = unpack(disText[4]);
check('disabled text is not faded', disInk[3] === 255, disInk.join(','));
check('disabled ink clears 4.5 on white', JR.uxContrast(disInk.slice(0, 3), [255, 255, 255]) >= 4.5);

const paper = [255, 255, 255];
for (const st of Object.keys(JR.UX_GEO)) {
  const wash = JR.UX_WASH[st];
  let bg = paper.slice();
  if (wash) bg = over(wash, paper.concat([255]));
  let fg = st === 'disabled' ? [73, 85, 106] : [28, 35, 51];
  const opacity = JR.UX_GEO[st].opacity;
  if (st !== 'disabled' && opacity < 1) fg = fg.map((v, i) => Math.round(v * opacity + bg[i] * (1 - opacity)));
  const ratio = JR.uxContrast(fg, bg);
  check('contrast ' + st, ratio >= 4.5, ratio.toFixed(2));
}

const wide = JR.uxPerspScale(12, 200);
const small = JR.uxPerspScale(2, 80);
check('85mm scale applies only past half a pixel', wide.applied === true && wide.focalMm === 85 && small.applied === false, JSON.stringify({ wide, small }));
const pressed = JR.uxPoseMatrix({ hit: [100, 40, 80, 30] }, 0.97, 0);
const cx = 140;
check('press scale stays on the control', Math.abs(pressed.m[4] - cx * (1 - 0.97)) < 0.02 && pressed.m[0] === 0.97);

context.window.matchMedia = function () { return { matches: true, addEventListener: function () {}, addListener: function () {} }; };
view.s = { patch: function (p) { this.last = p; } };
view.r = { draw: function () { this.drew = true; } };
view._uxPose(joyOn, 1, 1.5, null);
check('reduced motion skips the pose', !view.s.last);
delete context.window.matchMedia;
view._uxPose(joyOn, 0.97, 0, null);
check('missing matchMedia still poses', !!(view.s.last && view.s.last.ops));

vm.runInContext(slabs.body, context, { filename: 'slabs.js' });
const ov = doc.createElement('div');
ov.id = 'appsOverlay';
ov.hidden = true;
const cv2 = doc.createElement('canvas');
ov.appendChild(cv2);
doc.body.appendChild(ov);
const view2 = new JR.View();
const host2 = doc.createElement('div');
host2.innerHTML = '<button class="ja-joy" data-jv-act="z">Z</button>';
await view2.show(cv2, host2, 200, { displayListOnly: true });
check('hidden apps overlay pauses slabs', view2._slabs && view2._slabs.visible() === false);
ov.hidden = false;
Object.defineProperty(doc, 'hidden', { configurable: true, get: function () { return true; } });
check('document.hidden pauses slabs', view2._slabs.visible() === false);
Object.defineProperty(doc, 'hidden', { configurable: true, get: function () { return false; } });
check('a shown canvas is allowed to draw', view2._slabs.visible() === true);

const b64 = lean.match(/id="apppkg">([^<]+)/)[1];
const app = Buffer.from(b64, 'base64').toString('utf8');
check('exp7 app does not assign window.budget', !/window\.budget\s*=/.test(app));
check('legacy budget methods live on exp7', app.includes('legacyBudgetApi'));
const showStart = app.indexOf('function show(t){');
let showEnd = showStart, depth = 0, saw = false;
for (let i = showStart; i < app.length; i++) {
  if (app[i] === '{') { depth++; saw = true; }
  else if (app[i] === '}') { depth--; if (saw && depth === 0) { showEnd = i + 1; break; } }
}
const showSrc = app.slice(showStart, showEnd);
const iso = new JSDOM('<!doctype html><body></body></html>', { runScripts: 'dangerously', url: 'https://exp7.local/' });
const w = iso.window;
w.renderLog = function () {};
w.renderSync = function () {};
w.refreshPaths = function () {};
w.eval(showSrc + '\nwindow.__show=show;');
w.document.body.innerHTML = '<div id="appShell"><div id="appSlot-exp7"><nav><button data-t="cal"></button><button data-t="brd"></button></nav><section id="t-cal"></section><section id="t-brd" class="on"></section></div><div id="appSlot-budget"><section id="budget-t-cal" class="on"></section><section id="t-brd" class="on"></section></div></div>';
w.__show('cal');
const budgetOn = w.document.querySelector('#appSlot-budget #budget-t-cal').classList.contains('on');
const budgetOther = w.document.querySelector('#appSlot-budget #t-brd').classList.contains('on');
const exp7On = w.document.querySelector('#appSlot-exp7 #t-cal').classList.contains('on');
check('exp7 show leaves budget sections alone', budgetOn && budgetOther && exp7On);
w.document.body.innerHTML = '<div id="appShell"></div><section id="t-cal"></section><section id="budget-t-cal" class="on"></section>';
w.__show('brd');
check('shell without the exp7 slot does not fall through to the document', w.document.getElementById('budget-t-cal').classList.contains('on') && !w.document.getElementById('t-cal').classList.contains('on'));

if (fails.length) {
  console.error('\n' + fails.length + ' failed');
  process.exit(1);
}
console.log('\nall display-list checks passed');
