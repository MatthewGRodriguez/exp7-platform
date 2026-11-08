/* Coherent UX state washes for JRViews layout - retains Exp7 light language.
 * Stamps data-jr-state from existing classes onto universal Cal/Board/Plan/chrome
 * controls before layout, then applies wash/ring hierarchy. No builder forks.
 * Not a second renderer - only JRViews->JRender DL items are restyled.
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
    pressed: [36, 88, 166, 26],
    selected: [36, 88, 166, 32],
    dragging: [36, 88, 166, 20],
    'drop-pending': [117, 81, 15, 24],
    invalid: [170, 0, 0, 20],
    settling: [36, 88, 166, 12],
    disabled: [154, 163, 178, 48],
    loading: [244, 246, 250, 255],
    empty: [244, 246, 250, 255],
    error: [170, 0, 0, 16],
    photo: null,
    pending: null
  };

  var RING = {
    focus: [36, 88, 166, 255],
    selected: [117, 81, 15, 255],
    invalid: [170, 0, 0, 255],
    'drop-pending': [117, 81, 15, 255],
    pressed: [36, 88, 166, 200]
  };

  var INTERACTIVE = 'button,.ja-joy,.ja-chip,.ja-alt,.ja-sw,.ja-tog,.ja-day,[data-jv-act],[data-day],.ja-brow,.ja-prow';

  function inferState(el) {
    if (!el || el.nodeType !== 1) return 'idle';
    if (el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true') return 'disabled';
    if (el.getAttribute('aria-invalid') === 'true' || el.classList.contains('invalid') || el.classList.contains('err')) return 'invalid';
    if (el.classList.contains('dragging') || el.getAttribute('data-drag') === '1') return 'dragging';
    if (el.classList.contains('drop') || el.getAttribute('data-drop') === 'pending') return 'drop-pending';
    var ds = el.getAttribute('data-jr-state');
    if (ds && WASH[ds] !== undefined) return ds;
    if (el.classList.contains('on') || el.getAttribute('data-sm') === 'selected' || el.getAttribute('aria-selected') === 'true' || el.getAttribute('aria-current') === 'page' || el.getAttribute('aria-current') === 'true') return 'selected';
    if (el.classList.contains('hov') || el.getAttribute('data-hov') === '1' || el.matches && el.matches(':focus')) return el.matches && el.matches(':focus') ? 'focus' : 'hover';
    if (el.classList.contains('empty')) return 'empty';
    if (el.classList.contains('loading')) return 'loading';
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
      /* Typography / spacing hierarchy cues without rebrand: selected/focus get slightly bolder border via class. */
      if (st === 'selected' || st === 'focus') el.setAttribute('data-jr-emphasis', '1');
      else el.removeAttribute('data-jr-emphasis');
    }
    return { stamped: n };
  }

  function stateOf(el) {
    if (!el || el.nodeType !== 1) return 'idle';
    var ds = el.getAttribute('data-jr-state');
    if (ds && WASH[ds] !== undefined) return ds;
    return inferState(el);
  }

  var origLayout = V.layout;
  V.layout = function (rootEl, width, opt) {
    opt = opt || {};
    var stamp = stampTree(rootEl);
    var L = origLayout(rootEl, width, opt);
    if (!L || !L.nodes) return L;
    var touched = 0;
    for (var i = 0; i < L.nodes.length; i++) {
      var n = L.nodes[i];
      if (!n.el) continue;
      var st = stateOf(n.el);
      var wash = WASH[st];
      var ring = RING[st];
      var interactive = n.el.matches && n.el.matches(INTERACTIVE);
      if (!interactive && !n.el.hasAttribute('data-jr-state')) continue;
      for (var j = 0; j < n.items.length; j++) {
        var it = n.items[j];
        if (wash && (it[0] === 'rrect' || it[0] === 'rect') && st !== 'idle' && st !== 'photo' && st !== 'pending') {
          if (it[0] === 'rrect') it[6] = packRgba(over(wash, unpack(it[6])));
          else if (it[0] === 'rect') it[5] = packRgba(over(wash, unpack(it[5])));
          touched++;
        }
        if (ring && it[0] === 'border' && (st === 'focus' || st === 'selected' || st === 'invalid' || st === 'drop-pending' || st === 'pressed')) {
          it[it.length - 1] = packRgba(ring);
          touched++;
        }
      }
    }
    L.uxStates = true;
    L.uxStamped = stamp.stamped;
    L.uxTouched = touched;
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
  V.UX_WASH = WASH;
  V.UX_RING = RING;
  root.JRViews = V;
})(typeof window !== 'undefined' ? window : globalThis);
