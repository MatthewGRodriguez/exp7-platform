/* Coherent UX states for JRViews layout - retains Exp7 light language.
 * Stamps data-jr-state onto universal Cal/Board/Plan/chrome controls, then
 * applies wash + contour ring + geometry (scale/opacity) from art/design/state-table.
 * More than wash tokens: pressed scale-in, disabled opacity, focus/selected rings,
 * emphasis for title hierarchy. No builder forks / second renderer.
 *
 * Hit sync: JRViews stores n.hit as [x,y,w,h] arrays — must scale array form (not only {x,w}).
 * Re-infer: do not sticky-return data-jr-state except avatar paint modes / locked.
 */
(function (root) {
  'use strict';
  var V = root.JRViews;
  var T = root.EXP7_LIGHT_THEME;
  if (!V || !V.layout || !T) return;

  var WASH = {
    idle: null,
    hover: [36, 88, 166, 14],
    focus: [36, 88, 166, 18],
    pressed: [36, 88, 166, 40],
    selected: [36, 88, 166, 32],
    dragging: [36, 88, 166, 20],
    'drop-pending': [117, 81, 15, 28],
    invalid: [170, 0, 0, 22],
    settling: [36, 88, 166, 12],
    disabled: [154, 163, 178, 96],
    loading: [244, 246, 250, 255],
    empty: [244, 246, 250, 255],
    error: [170, 0, 0, 16],
    photo: null,
    pending: null,
    initials: null
  };

  var RING = {
    focus: [36, 88, 166, 255],
    selected: [117, 81, 15, 255],
    invalid: [170, 0, 0, 255],
    'drop-pending': [117, 81, 15, 255],
    pressed: [36, 88, 166, 200]
  };

  var GEO = {
    idle: { scale: 1, opacity: 1 },
    hover: { scale: 1, opacity: 1 },
    focus: { scale: 1, opacity: 1 },
    pressed: { scale: 0.97, opacity: 1 },
    selected: { scale: 1, opacity: 1 },
    dragging: { scale: 1.02, opacity: 0.96 },
    'drop-pending': { scale: 1.01, opacity: 0.9 },
    invalid: { scale: 1, opacity: 1 },
    settling: { scale: 1, opacity: 1 },
    disabled: { scale: 1, opacity: 0.38 }
  };

  /* Avatar exclusive paint modes — sticky until PlatformChrome updates / unlocks */
  var AVATAR_MODES = { photo: 1, pending: 1, initials: 1, loading: 1 };

  var INTERACTIVE = 'button,.ja-joy,.ja-chip,.ja-alt,.ja-sw,.ja-tog,.ja-day,[data-jv-act],[data-day],.ja-brow,.ja-prow,.empty,.loading,.jrerr';

  function inferState(el) {
    if (!el || el.nodeType !== 1) return 'idle';
    if (el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true') return 'disabled';
    if (el.getAttribute('aria-invalid') === 'true' || el.classList.contains('invalid') || el.classList.contains('err')) return 'invalid';
    if (el.classList.contains('dragging') || el.getAttribute('data-drag') === '1') return 'dragging';
    if (el.classList.contains('drop') || el.getAttribute('data-drop') === 'pending') return 'drop-pending';
    var ds = el.getAttribute('data-jr-state');
    /* Before: any data-jr-state short-circuited re-infer (sticky .on / :focus never updated).
       After: only avatar exclusive modes (or locked) stay sticky. */
    if (ds && AVATAR_MODES[ds]) return ds;
    if (el.classList.contains('on') || el.getAttribute('data-sm') === 'selected' || el.getAttribute('aria-selected') === 'true' || el.getAttribute('aria-current') === 'page' || el.getAttribute('aria-current') === 'true') return 'selected';
    if (el.classList.contains('hov') || el.getAttribute('data-hov') === '1' || (el.matches && el.matches(':focus'))) return el.matches && el.matches(':focus') ? 'focus' : 'hover';
    if (el.classList.contains('empty') || el.getAttribute('data-empty') === '1') return 'empty';
    if (el.classList.contains('loading') || el.getAttribute('data-loading') === '1') return 'loading';
    if (el.classList.contains('jrerr') || el.getAttribute('role') === 'alert') return 'error';
    return 'idle';
  }

  function stampTree(rootEl) {
    if (!rootEl || !rootEl.querySelectorAll) return { stamped: 0 };
    var n = 0;
    var nodes = rootEl.querySelectorAll(INTERACTIVE);
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (el.hasAttribute('data-jr-state-locked')) continue;
      var st = inferState(el);
      if (!el.hasAttribute('data-jr-state') || el.getAttribute('data-jr-state') !== st) {
        el.setAttribute('data-jr-state', st);
        n++;
      }
      if (st === 'selected' || st === 'focus') el.setAttribute('data-jr-emphasis', '1');
      else el.removeAttribute('data-jr-emphasis');
      var g = GEO[st];
      if (g && g.scale !== 1) el.setAttribute('data-jr-scale', String(g.scale));
      else el.removeAttribute('data-jr-scale');
      if (g && g.opacity < 1) el.setAttribute('data-jr-opacity', String(g.opacity));
      else el.removeAttribute('data-jr-opacity');
    }
    return { stamped: n };
  }

  function stateOf(el) {
    if (!el || el.nodeType !== 1) return 'idle';
    return inferState(el);
  }

  function scaleBox(it, scale, xIdx, yIdx, wIdx, hIdx) {
    if (scale === 1) return;
    var x = it[xIdx], y = it[yIdx], w = it[wIdx], h = it[hIdx];
    if (typeof x !== 'number' || typeof w !== 'number') return;
    var cx = x + w / 2, cy = y + h / 2;
    var nw = w * scale, nh = h * scale;
    it[xIdx] = cx - nw / 2;
    it[yIdx] = cy - nh / 2;
    it[wIdx] = nw;
    it[hIdx] = nh;
  }

  function scaleHit(hit, scale) {
    if (!hit || scale === 1) return false;
    if (Array.isArray(hit) && typeof hit[0] === 'number' && typeof hit[2] === 'number') {
      var x = hit[0], y = hit[1], w = hit[2], h = hit[3];
      var cx = x + w / 2, cy = y + h / 2;
      hit[2] = w * scale;
      hit[3] = h * scale;
      hit[0] = cx - hit[2] / 2;
      hit[1] = cy - hit[3] / 2;
      return true;
    }
    if (typeof hit.x === 'number' && typeof hit.w === 'number') {
      var hx = hit.x, hy = hit.y, hw = hit.w, hh = hit.h;
      var hcx = hx + hw / 2, hcy = hy + hh / 2;
      hit.w = hw * scale;
      hit.h = hh * scale;
      hit.x = hcx - hit.w / 2;
      hit.y = hcy - hit.h / 2;
      return true;
    }
    return false;
  }

  function mulAlpha(packed, opacity) {
    if (opacity >= 0.999) return packed;
    var c = unpack(packed);
    c[3] = Math.max(0, Math.min(255, Math.round(c[3] * opacity)));
    return packRgba(c);
  }

  var origLayout = V.layout;
  V.layout = function (rootEl, width, opt) {
    opt = opt || {};
    var stamp = stampTree(rootEl);
    var L = origLayout(rootEl, width, opt);
    if (!L || !L.nodes) return L;
    var touched = 0;
    var geoTouched = 0;
    for (var i = 0; i < L.nodes.length; i++) {
      var n = L.nodes[i];
      if (!n.el) continue;
      var st = stateOf(n.el);
      var wash = WASH[st];
      var ring = RING[st];
      var geo = GEO[st] || GEO.idle;
      var interactive = n.el.matches && n.el.matches(INTERACTIVE);
      if (!interactive && !n.el.hasAttribute('data-jr-state')) continue;
      var emphasis = n.el.getAttribute('data-jr-emphasis') === '1';
      if (scaleHit(n.hit, geo.scale)) geoTouched++;
      for (var j = 0; j < n.items.length; j++) {
        var it = n.items[j];
        var kind = it[0];
        if (wash && (kind === 'rrect' || kind === 'rect') && st !== 'idle' && st !== 'photo' && st !== 'pending' && st !== 'initials') {
          if (kind === 'rrect') it[6] = packRgba(over(wash, unpack(it[6])));
          else it[5] = packRgba(over(wash, unpack(it[5])));
          touched++;
        }
        if (ring && kind === 'border' && (st === 'focus' || st === 'selected' || st === 'invalid' || st === 'drop-pending' || st === 'pressed')) {
          it[it.length - 1] = packRgba(ring);
          if (typeof it[5] === 'number' && it[5] > 0 && it[5] < 8) it[5] = Math.max(it[5], emphasis ? 2 : 1.5);
          touched++;
        }
        if (kind === 'rrect' || kind === 'rect' || kind === 'border') {
          if (kind === 'rrect') scaleBox(it, geo.scale, 1, 2, 3, 4);
          else if (kind === 'rect') scaleBox(it, geo.scale, 1, 2, 3, 4);
          else if (kind === 'border' && typeof it[1] === 'number') scaleBox(it, geo.scale, 1, 2, 3, 4);
          if (geo.scale !== 1) geoTouched++;
        }
        if (kind === 'hit' && geo.scale !== 1 && typeof it[1] === 'number') {
          scaleBox(it, geo.scale, 1, 2, 3, 4);
          geoTouched++;
        }
        if (geo.opacity < 1) {
          if (kind === 'rrect') { it[6] = mulAlpha(it[6], geo.opacity); geoTouched++; }
          else if (kind === 'rect') { it[5] = mulAlpha(it[5], geo.opacity); geoTouched++; }
          else if (kind === 'text' || kind === 'label' || kind === 'glyph') {
            it[it.length - 1] = mulAlpha(it[it.length - 1], geo.opacity);
            geoTouched++;
          } else if (kind === 'border') {
            it[it.length - 1] = mulAlpha(it[it.length - 1], geo.opacity);
            geoTouched++;
          }
        }
        if (emphasis && (kind === 'text' || kind === 'label') && typeof it[it.length - 1] === 'number') {
          var tc = unpack(it[it.length - 1]);
          if (tc[0] + tc[1] + tc[2] < 600) {
            tc[3] = 255;
            it[it.length - 1] = packRgba(tc);
            geoTouched++;
          }
        }
      }
    }
    L.uxStates = true;
    L.uxStamped = stamp.stamped;
    L.uxTouched = touched;
    L.uxGeoTouched = geoTouched;
    return L;
  };

  function unpack(c) {
    if (typeof c !== 'number') return [255, 255, 255, 255];
    return [c & 255, (c >> 8) & 255, (c >> 16) & 255, (c >> 24) & 255];
  }
  function packRgba(a) {
    return (a[0] & 255) | ((a[1] & 255) << 8) | ((a[2] & 255) << 16) | ((a[3] & 255) << 24);
  }
  function over(fg, bg) {
    var a = fg[3] / 255;
    return [
      Math.round(fg[0] * a + bg[0] * (1 - a)),
      Math.round(fg[1] * a + bg[1] * (1 - a)),
      Math.round(fg[2] * a + bg[2] * (1 - a)),
      255
    ];
  }

  V.uxStateOf = stateOf;
  V.uxStampTree = stampTree;
  V.uxInferState = inferState;
  V.uxScaleHit = scaleHit;
  V.UX_WASH = WASH;
  V.UX_RING = RING;
  V.UX_GEO = GEO;
  root.JRViews = V;
})(typeof window !== 'undefined' ? window : globalThis);
