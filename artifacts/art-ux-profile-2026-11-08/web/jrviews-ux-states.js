/* Coherent UX state washes for JRViews layout - retains Exp7 light language.
 * Applies data-jr-state / .on / [disabled] / aria-invalid hierarchy without forking builders.
 */
(function (root) {
  'use strict';
  var V = root.JRViews;
  var T = root.EXP7_LIGHT_THEME;
  if (!V || !V.layout || !T) return;

  var WASH = {
    idle: null,
    hover: [36, 88, 166, 10],
    focus: [36, 88, 166, 16],
    pressed: [36, 88, 166, 22],
    selected: [36, 88, 166, 28],
    dragging: [36, 88, 166, 18],
    'drop-pending': [117, 81, 15, 22],
    invalid: [170, 0, 0, 18],
    settling: [36, 88, 166, 12],
    disabled: [154, 163, 178, 40],
    loading: [244, 246, 250, 255],
    empty: [244, 246, 250, 255],
    error: [170, 0, 0, 14],
    photo: null
  };

  var RING = {
    focus: [36, 88, 166, 255],
    selected: [117, 81, 15, 255],
    invalid: [170, 0, 0, 255],
    'drop-pending': [117, 81, 15, 255]
  };

  function stateOf(el) {
    if (!el || el.nodeType !== 1) return 'idle';
    if (el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true') return 'disabled';
    if (el.getAttribute('aria-invalid') === 'true' || el.classList.contains('invalid')) return 'invalid';
    var ds = el.getAttribute('data-jr-state');
    if (ds && WASH[ds] !== undefined) return ds;
    if (el.classList.contains('on') || el.getAttribute('data-sm') === 'selected' || el.getAttribute('aria-selected') === 'true') return 'selected';
    if (el.classList.contains('hov') || el.getAttribute('data-hov') === '1') return 'hover';
    return 'idle';
  }

  /* Patch style resolution used during layout by wrapping layout once. */
  var origLayout = V.layout;
  V.layout = function (rootEl, width, opt) {
    opt = opt || {};
    var L = origLayout(rootEl, width, opt);
    if (!L || !L.nodes) return L;
    for (var i = 0; i < L.nodes.length; i++) {
      var n = L.nodes[i];
      if (!n.el) continue;
      var st = stateOf(n.el);
      var wash = WASH[st];
      var ring = RING[st];
      if (!wash && !ring) continue;
      /* Reinforce existing items: prefer first rrect/rect fill toward wash; border toward ring. */
      for (var j = 0; j < n.items.length; j++) {
        var it = n.items[j];
        if (wash && (it[0] === 'rrect' || it[0] === 'rect') && st !== 'idle') {
          /* Soft wash: only when element opted into data-jr-state or selected/disabled/invalid */
          if (n.el.hasAttribute('data-jr-state') || st === 'selected' || st === 'disabled' || st === 'invalid' || st === 'hover') {
            if (it[0] === 'rrect') it[6] = packRgba(over(wash, unpack(it[6])));
            else if (it[0] === 'rect') it[5] = packRgba(over(wash, unpack(it[5])));
          }
        }
        if (ring && it[0] === 'border' && (st === 'focus' || st === 'selected' || st === 'invalid' || st === 'drop-pending')) {
          it[it.length - 1] = packRgba(ring);
        }
      }
    }
    L.uxStates = true;
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
  V.UX_WASH = WASH;
  root.JRViews = V;
})(typeof window !== 'undefined' ? window : globalThis);
