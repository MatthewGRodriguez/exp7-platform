/* PlatformChromeJR profile-photo consumer (art pass).
 * Circular clipped JRDI image on reserved bar avatar; exclusive initials/soft-disc on absent/failure.
 * Pending: neither initials nor photo. DOM account/key overlays unchanged. PAT never in image URLs.
 */
(function (root) {
  'use strict';
  var BAR_H = 44;
  var AVATAR = 36;
  var state = {
    on: false,
    appsOn: false,
    login: null,
    initials: '?',
    avatarUrl: null,
    avatarHandle: null,
    avatarMode: 'initials', /* initials | photo | pending */
    barView: null,
    appsView: null,
    drawing: false,
    appsDrawing: false,
    avatarNodeId: null,
    loadGen: 0,
    unmounted: false
  };

  function $(id) { return document.getElementById(id); }

  function paint() {
    var J = root.JRender;
    var fn = J && J.Images && J.Images.exclusiveAvatarPaint;
    return fn ? fn(state.avatarMode) : {
      mode: state.avatarMode,
      showInitials: state.avatarMode === 'initials',
      showPhoto: state.avatarMode === 'photo',
      showSoftDisc: state.avatarMode === 'initials',
      label: state.avatarMode === 'initials' ? state.initials : ''
    };
  }

  function setBarMode(on) {
    state.on = !!on;
    var chrome = $('topChrome');
    if (chrome) chrome.classList.toggle('jr-on', state.on);
  }

  function setAppsMode(on) {
    state.appsOn = !!on;
    var ov = $('appsOverlay');
    if (ov) ov.classList.toggle('jr-on', state.appsOn);
  }

  function parseApp(html) {
    return new DOMParser().parseFromString('<div id="app">' + html + '</div>', 'text/html').getElementById('app');
  }

  function barHtml() {
    var p = paint();
    var label = p.showInitials ? (state.initials || '?') : '';
    var bg = p.showSoftDisc ? 'background:#eef1f6;' : 'background:transparent;';
    /* Exclusive: photo has no initials text; pending has neither; soft-disc only with initials. */
    return '' +
      '<div class="ja-comp" data-plat="bar" style="background:#ffffff;min-height:' + BAR_H + 'px">' +
      '<div class="ja-bar" style="padding:4px 8px;gap:8px">' +
      '<button type="button" data-jv-act="plat:back" class="ja-joy" data-jr-state="idle" style="min-width:36px;min-height:36px">&larr;</button>' +
      '<button type="button" data-jv-act="plat:avatar" class="ja-joy" data-jr-state="' + p.mode +
      '" aria-busy="' + (p.mode === 'pending' ? 'true' : 'false') +
      '" style="min-width:' + AVATAR + 'px;min-height:' + AVATAR + 'px;border-radius:999px;' + bg + '">' +
      label + '</button>' +
      '<span class="ja-dim">Exp7</span>' +
      '</div></div>';
  }

  function appsHtml() {
    var apps = [
      { id: 'exp7', label: 'Exp7', hint: 'Planner / atlas' },
      { id: 'budget', label: 'Budget', hint: 'Calendar | Board | Plan' }
    ];
    var cur = (root.__platUi && root.__platUi.mountedAppId) || (root.UI && root.UI.mountedAppId) || '';
    var h = '<div class="ja-comp" data-plat="apps" style="background:#f6f7f9;padding:12px">';
    h += '<div class="ja-section"><b>Apps</b></div>';
    apps.forEach(function (a) {
      var on = cur === a.id ? ' on' : '';
      var st = cur === a.id ? 'selected' : 'idle';
      h += '<div class="ja-section" style="margin-top:10px">' +
        '<button type="button" data-jv-act="plat:app:' + a.id + '" data-jr-state="' + st + '" class="ja-joy' + on + '" style="min-width:12rem;text-align:left">' +
        '<b>' + a.label + '</b> | ' + a.hint + '</button></div>';
    });
    h += '</div>';
    return h;
  }

  function wireViewActs(view) {
    view.onact = function (el, act) {
      if (act !== 'jv') return;
      var a = el.getAttribute('data-jv-act') || '';
      if (typeof root.__platformChromeAct === 'function') root.__platformChromeAct(a);
    };
  }

  function findAvatarNode(view) {
    if (!view || !view.L || !view.L.nodes) return null;
    for (var i = 0; i < view.L.nodes.length; i++) {
      var n = view.L.nodes[i];
      if (n && n.el && n.el.getAttribute && n.el.getAttribute('data-jv-act') === 'plat:avatar') return n;
    }
    return null;
  }

  function avatarBounds(node) {
    if (!node) return null;
    var hit = null, box = null;
    for (var i = 0; i < (node.items || []).length; i++) {
      var it = node.items[i];
      if (it[0] === 'hit') hit = it;
      if ((it[0] === 'rrect' || it[0] === 'rect') && !box) box = it;
    }
    var src = hit || box;
    if (!src) return { x: 8 + 36 + 8, y: 4, w: AVATAR, h: AVATAR };
    return { x: src[1], y: src[2], w: src[3], h: src[4] };
  }

  function clearPhotoOverlay() {
    var view = state.barView;
    if (view && view.r && view.r.images) {
      if (state.avatarNodeId != null) view.r.images.clear(state.avatarNodeId);
      else view.r.images.clear();
    }
    state.avatarNodeId = null;
  }

  function placePhotoOverlay() {
    var view = state.barView;
    var p = paint();
    if (!p.showPhoto || !view || !view.r || !view.r.images) {
      clearPhotoOverlay();
      return false;
    }
    if (!state.avatarHandle || state.avatarHandle.state !== 'ready') {
      clearPhotoOverlay();
      return false;
    }
    var node = findAvatarNode(view);
    if (!node) return false;
    var b = avatarBounds(node);
    state.avatarNodeId = node.id;
    view.r.images.set(node.id, {
      handle: state.avatarHandle,
      x: b.x, y: b.y, w: b.w, h: b.h,
      alpha: 1,
      clip: 'circle',
      dx: 0, dy: 0
    });
    try { view.r.request && view.r.request(); view.r.draw && view.r.draw(); } catch (_) {}
    return true;
  }

  function freeHandle() {
    if (!state.avatarHandle) return;
    try {
      var J = root.JRender;
      var gc = root.JRViews && root.JRViews.gc && root.JRViews.gc();
      if (J && J.Images && gc) J.Images.storeFor(gc).free(state.avatarHandle, true);
    } catch (_) {}
    state.avatarHandle = null;
  }

  async function ensureAvatarHandle(url) {
    var J = root.JRender;
    if (!J || !J.Images) return null;
    var check = J.Images.sanitizeUrl(url);
    if (!check.ok) return null;
    var gc = root.JRViews && root.JRViews.gc && root.JRViews.gc();
    if (!gc) return null;
    var store = J.Images.storeFor(gc);
    freeHandle();
    var h = await store.load(check.url, { timeoutMs: 12000, force: true });
    if (h.state !== 'ready') {
      store.free(h, true);
      return null;
    }
    state.avatarHandle = h;
    return h;
  }

  function hookParallax() {
    try {
      var ctl = state.barView && state.barView._slabs;
      if (!ctl || ctl._avatarPhotoHook) return;
      ctl._avatarPhotoHook = true;
      var prevTick = ctl.tick.bind(ctl);
      ctl.tick = function (t) {
        var dirty = prevTick(t);
        if (state.avatarMode === 'photo' && state.barView && state.barView.r && state.barView.r.images && state.avatarNodeId != null) {
          var C = root.EXP7_SLAB_CONFIG, k = (C && C.front && C.front.outer) || 0;
          var xy = this.active() ? this.xy : [0, 0];
          /* Parallax: shift * z/(D-z) approximated by Exp7Slabs front factor on companion node. */
          state.barView.r.images.shift(state.avatarNodeId, xy[0] * k, xy[1] * k);
        }
        return dirty;
      };
    } catch (_) {}
  }

  async function drawBar() {
    if (state.unmounted || state.drawing) return;
    state.drawing = true;
    try {
      if (!root.JRViews || !root.JRender) throw new Error('JRViews/JRender missing');
      await root.JRViews.boot();
      if (state.unmounted) return;
      var host = $('jrChromeHost');
      var cv = $('jrChromeCanvas');
      if (!host || !cv) throw new Error('jrChromeHost/canvas missing');
      var W = Math.max(1, Math.round(host.clientWidth || root.innerWidth || 360));
      if (!state.barView) {
        state.barView = new root.JRViews.View();
        wireViewActs(state.barView);
      }
      if (state.avatarUrl && state.avatarMode !== 'photo') state.avatarMode = 'pending';
      if (!state.avatarUrl) {
        state.avatarMode = 'initials';
        clearPhotoOverlay();
      }
      var doc = parseApp(barHtml());
      await state.barView.show(cv, doc, W);
      if (state.unmounted) return;
      setBarMode(true);
      if (state.avatarUrl) {
        var gen = ++state.loadGen;
        try {
          var h = await ensureAvatarHandle(state.avatarUrl);
          if (state.unmounted || gen !== state.loadGen) return;
          if (h) {
            state.avatarMode = 'photo';
            doc = parseApp(barHtml());
            await state.barView.show(cv, doc, W);
            placePhotoOverlay();
          } else {
            state.avatarMode = 'initials';
            clearPhotoOverlay();
            doc = parseApp(barHtml());
            await state.barView.show(cv, doc, W);
          }
        } catch (e) {
          if (gen !== state.loadGen || state.unmounted) return;
          state.avatarMode = 'initials';
          clearPhotoOverlay();
          try {
            doc = parseApp(barHtml());
            await state.barView.show(cv, doc, W);
          } catch (_) {}
        }
      }
      try { if (root.Exp7Slabs && root.Exp7Slabs.notify) root.Exp7Slabs.notify(); } catch (e) {}
      hookParallax();
    } catch (e) {
      setBarMode(false);
      root.__platformChromeJrError = String((e && e.message) || e);
      try { console.warn('PlatformChromeJR bar:', root.__platformChromeJrError); } catch (x) {}
    } finally {
      state.drawing = false;
    }
  }

  async function drawApps() {
    if (state.unmounted || state.appsDrawing) return;
    state.appsDrawing = true;
    try {
      if (!root.JRViews || !root.JRender) throw new Error('JRViews/JRender missing');
      await root.JRViews.boot();
      var host = $('jrAppsHost');
      if (!host) throw new Error('jrAppsHost missing');
      var cv = host.querySelector('canvas');
      if (!cv) {
        cv = document.createElement('canvas');
        host.appendChild(cv);
      }
      var W = Math.max(1, Math.round(host.clientWidth || root.innerWidth || 360));
      if (!state.appsView) {
        state.appsView = new root.JRViews.View();
        wireViewActs(state.appsView);
      }
      var doc = parseApp(appsHtml());
      await state.appsView.show(cv, doc, W);
      setAppsMode(true);
      try { if (root.Exp7Slabs && root.Exp7Slabs.notify) root.Exp7Slabs.notify(); } catch (e) {}
    } catch (e) {
      setAppsMode(false);
      root.__platformChromeJrError = String((e && e.message) || e);
      try { console.warn('PlatformChromeJR apps:', root.__platformChromeJrError); } catch (x) {}
    } finally {
      state.appsDrawing = false;
    }
  }

  function setAvatarInfo(url, login) {
    state.login = login || null;
    var s = String(login || '').replace(/[^A-Za-z0-9]/g, '');
    state.initials = (s.slice(0, 2) || '?').toUpperCase();
    var J = root.JRender;
    var next = null;
    if (url && J && J.Images) {
      var c = J.Images.sanitizeUrl(url);
      next = c.ok ? c.url : null;
    } else if (url && typeof url === 'string' && url.indexOf('https://') === 0) {
      next = url;
    }
    var same = next === state.avatarUrl;
    state.avatarUrl = next;
    state.avatarMode = next ? 'pending' : 'initials';
    state.loadGen++;
    if (!next) {
      freeHandle();
      clearPhotoOverlay();
    } else if (!same) {
      /* Update: drop previous photo immediately so exclusive pending holds. */
      clearPhotoOverlay();
    }
    if (state.on && !state.unmounted) drawBar();
  }

  function unmount() {
    state.unmounted = true;
    state.loadGen++;
    clearPhotoOverlay();
    freeHandle();
    setBarMode(false);
    setAppsMode(false);
    state.barView = null;
    state.appsView = null;
    state.avatarMode = 'initials';
  }

  async function onContextLost() {
    clearPhotoOverlay();
    state.avatarMode = state.avatarUrl ? 'pending' : 'initials';
    try {
      var gc = root.JRViews && root.JRViews.gc && root.JRViews.gc();
      if (gc && gc._images) await gc._images.recover();
    } catch (_) {}
    if (!state.unmounted && state.on) return drawBar();
  }

  function start() {
    state.unmounted = false;
    var run = function () {
      if (!state.unmounted) {
        drawBar();
        if (root.UI && root.UI.appsOpen) drawApps();
      }
    };
    addEventListener('resize', run);
    if (root.visualViewport) visualViewport.addEventListener('resize', run);
    addEventListener('jrender-devicelost', function () { onContextLost(); });
    return drawBar();
  }

  root.PlatformChromeJR = {
    start: start,
    redraw: drawBar,
    redrawApps: drawApps,
    setAvatarInfo: setAvatarInfo,
    unmount: unmount,
    onContextLost: onContextLost,
    active: function () { return !!state.on; },
    appsActive: function () { return !!state.appsOn; },
    avatarMode: function () { return state.avatarMode; },
    avatarPaint: function () { return paint(); },
    error: function () { return root.__platformChromeJrError || null; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
