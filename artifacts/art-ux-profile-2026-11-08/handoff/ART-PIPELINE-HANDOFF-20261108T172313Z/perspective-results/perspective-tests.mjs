#!/usr/bin/env node
/** Shared pinhole 1/2/3-point VP tolerance tests + focal sweep. No GPU. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const params = JSON.parse(fs.readFileSync(path.join(__dirname, '../design/params.json'), 'utf8'));

const EPS = params.camera.vpTolerancePx;
const W = 1280, H = 720;

function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
function norm(v) { const n = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / n, v[1] / n, v[2] / n]; }

function lookAt(eye, target, up) {
  const z = norm(sub(eye, target));
  const x = norm(cross(up, z));
  const y = cross(z, x);
  return [
    x[0], y[0], z[0], 0,
    x[1], y[1], z[1], 0,
    x[2], y[2], z[2], 0,
    -dot(x, eye), -dot(y, eye), -dot(z, eye), 1
  ];
}

function persp(fovy, aspect, near, far) {
  const f = 1 / Math.tan(fovy / 2);
  return [
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) / (near - far), -1,
    0, 0, (2 * far * near) / (near - far), 0
  ];
}

function mulMM(a, b) {
  const o = new Array(16).fill(0);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
    o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
  }
  return o;
}

function mul4(m, v) {
  return [
    m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12] * v[3],
    m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13] * v[3],
    m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14] * v[3],
    m[3] * v[0] + m[7] * v[1] + m[11] * v[2] + m[15] * v[3]
  ];
}

function project(VP, p) {
  const c = mul4(VP, [p[0], p[1], p[2], 1]);
  if (Math.abs(c[3]) < 1e-9) return null;
  const ndc = [c[0] / c[3], c[1] / c[3]];
  return [(ndc[0] * 0.5 + 0.5) * W, (1 - (ndc[1] * 0.5 + 0.5)) * H];
}

function lineIntersect(a1, a2, b1, b2) {
  const d = (a1[0] - a2[0]) * (b1[1] - b2[1]) - (a1[1] - a2[1]) * (b1[0] - b2[0]);
  if (Math.abs(d) < 1e-9) return null;
  const t = ((a1[0] - b1[0]) * (b1[1] - b2[1]) - (a1[1] - b1[1]) * (b1[0] - b2[0])) / d;
  return [a1[0] + t * (a2[0] - a1[0]), a1[1] + t * (a2[1] - a1[1])];
}

function camera(mode, focalMm) {
  const sens = params.camera.sensorWidthMm;
  const fovy = 2 * Math.atan((sens * (H / W)) / (2 * focalMm));
  const dist = 8;
  /* UI-like panel sitting slightly below eye height. */
  let eye;
  if (mode === 1) eye = [0, 0.4, dist];           /* face-on: only depth converges */
  else if (mode === 2) eye = [0, 2.2, dist];       /* pitched: vertical + depth */
  else eye = [2.4, 2.2, dist];                     /* pitched + yawed */
  const V = lookAt(eye, [0, 0.2, 0], [0, 1, 0]);
  const P = persp(fovy, W / H, 0.1, 40);
  return { VP: mulMM(P, V), eye };
}

/** World-axis edge pairs that should share a vanishing point under the camera. */
function axisBundles() {
  /* Depth (z) lines on a panel footprint */
  const zLines = [
    [[-1.2, 0, 0], [-1.2, 0, -1.6]],
    [[1.2, 0, 0], [1.2, 0, -1.6]],
    [[-1.2, 0.8, 0], [-1.2, 0.8, -1.6]],
    [[1.2, 0.8, 0], [1.2, 0.8, -1.6]]
  ];
  const yLines = [
    [[-1.2, 0, 0], [-1.2, 1.2, 0]],
    [[1.2, 0, 0], [1.2, 1.2, 0]],
    [[-1.2, 0, -1.6], [-1.2, 1.2, -1.6]],
    [[1.2, 0, -1.6], [1.2, 1.2, -1.6]]
  ];
  const xLines = [
    [[-1.2, 0, 0], [1.2, 0, 0]],
    [[-1.2, 0.8, 0], [1.2, 0.8, 0]],
    [[-1.2, 0, -1.6], [1.2, 0, -1.6]],
    [[-1.2, 0.8, -1.6], [1.2, 0.8, -1.6]]
  ];
  return { x: xLines, y: yLines, z: zLines };
}

function projectLines(VP, lines) {
  return lines.map(([a, b]) => {
    const pa = project(VP, a), pb = project(VP, b);
    return pa && pb ? { a: pa, b: pb } : null;
  }).filter(Boolean);
}

function sharedVp(segs) {
  if (segs.length < 2) return null;
  const hits = [];
  for (let i = 0; i < segs.length; i++) for (let j = i + 1; j < segs.length; j++) {
    const h = lineIntersect(segs[i].a, segs[i].b, segs[j].a, segs[j].b);
    if (h) hits.push(h);
  }
  if (!hits.length) return null;
  const cx = hits.reduce((s, p) => s + p[0], 0) / hits.length;
  const cy = hits.reduce((s, p) => s + p[1], 0) / hits.length;
  const maxd = Math.max(...hits.map(p => Math.hypot(p[0] - cx, p[1] - cy)));
  return { vp: [cx, cy], maxd, hits: hits.length };
}

function testMode(mode, focalMm) {
  const { VP } = camera(mode, focalMm);
  const bundles = axisBundles();
  const axes = mode === 1 ? ['z'] : mode === 2 ? ['y', 'z'] : ['x', 'y', 'z'];
  const notes = [];
  let ok = true;
  const vps = {};
  for (const axis of axes) {
    const segs = projectLines(VP, bundles[axis]);
    const r = sharedVp(segs);
    if (!r) { ok = false; notes.push('missing VP ' + axis); continue; }
    vps[axis] = r.vp;
    if (r.maxd > EPS) { ok = false; notes.push(axis + ' spread ' + r.maxd.toFixed(3)); }
  }
  return { mode, focalMm, ok, vps, notes };
}

function negativeWrongCamera() {
  const { VP: VP1 } = camera(1, 85);
  const { VP: VP3 } = camera(3, 85);
  const z1 = sharedVp(projectLines(VP1, axisBundles().z));
  const z3 = sharedVp(projectLines(VP3, axisBundles().z));
  const dist = (z1 && z3) ? Math.hypot(z1.vp[0] - z3.vp[0], z1.vp[1] - z3.vp[1]) : 0;
  /* Mode-3 z-lines must fail against mode-1 VP within tolerance. */
  let failCount = 0, checked = 0;
  if (z1) {
    const segs3 = projectLines(VP3, axisBundles().z);
    for (let i = 0; i + 1 < segs3.length; i++) {
      const h = lineIntersect(segs3[i].a, segs3[i].b, segs3[i + 1].a, segs3[i + 1].b);
      if (!h) continue;
      checked++;
      if (Math.hypot(h[0] - z1.vp[0], h[1] - z1.vp[1]) > EPS) failCount++;
    }
  }
  const caught = dist > EPS * 4 && failCount === checked && checked > 0;
  return { name: 'wrong-camera-negative', caught, dist, failCount, checked, gate: EPS * 4 };
}

function distortionAtFocal(focalMm) {
  const { VP } = camera(1, focalMm);
  const left = project(VP, [-1.2, 0.6, 0]);
  const right = project(VP, [1.2, 0.6, 0]);
  const mid = project(VP, [0, 0.6, 0]);
  if (!left || !right || !mid) return 1;
  const idealMid = (left[0] + right[0]) / 2;
  return Math.abs(mid[0] - idealMid) / W;
}

function focalStudy() {
  const rows = params.camera.focalSweepMm.map(f => ({
    focalMm: f,
    distortionPct: +(distortionAtFocal(f) * 100).toFixed(4),
    liftReadable: f >= 70 && f <= 135
  }));
  const shortestOk = rows.filter(r => r.distortionPct < params.camera.distortionGatePct && r.liftReadable)
    .sort((a, b) => a.focalMm - b.focalMm)[0];
  const recorded = rows.find(r => r.focalMm === params.camera.focalMmChosen);
  return {
    rows,
    shortestReadableFocalMm: shortestOk ? shortestOk.focalMm : null,
    recorded: params.camera.focalMmChosen,
    recordedDistortionPct: recorded ? recorded.distortionPct : null,
    recordedUnderGate: !!(recorded && recorded.distortionPct < params.camera.distortionGatePct)
  };
}

const results = {
  stamp: new Date().toISOString(),
  pointRules: [1, 2, 3].map(m => testMode(m, params.camera.focalMmChosen)),
  negative: negativeWrongCamera(),
  focalStudy: focalStudy(),
  gates: { vpTolerancePx: EPS, distortionGatePct: params.camera.distortionGatePct },
  lensNote: 'Recorded Exp7Slabs matched-framing lens remains 85 mm (shortest readable under gate may be 70 mm)'
};

results.pass = results.pointRules.every(r => r.ok) && results.negative.caught &&
  results.focalStudy.recordedUnderGate && results.focalStudy.shortestReadableFocalMm != null;

const out = path.join(__dirname, '../../artifacts/art-ux-profile-2026-11-08/perspective/results.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(results, null, 2));
console.log(JSON.stringify({
  pass: results.pass,
  recordedFocalMm: results.focalStudy.recorded,
  shortestReadableFocalMm: results.focalStudy.shortestReadableFocalMm,
  recordedDistortionPct: results.focalStudy.recordedDistortionPct,
  negativeCaught: results.negative.caught,
  pointOk: results.pointRules.map(r => [r.mode, r.ok, r.notes])
}, null, 2));
process.exit(results.pass ? 0 : 1);
