/* JRender host Image / bitmap ABI (JRDI) - real WebGPU only, shared GPUContext.
 * Not a wasm DL op: shipped wasm rejects unknown ops; textures live on the host.
 * Documented in art/api/IMAGE-ABI.md. ASCII only.
 */
(function (root) {
  'use strict';
  var J = root.JRender;
  if (!J) return;

  var MAX_EDGE = 256;
  var MAX_TEXELS = MAX_EDGE * MAX_EDGE;
  var MAX_ENTRIES = 32;
  var MAGIC = 'JRDI';
  var VERSION = 1;

  /* Public GitHub avatar hosts only - never PAT/query secrets in URL. */
  var ALLOW_HOSTS = {
    'avatars.githubusercontent.com': 1,
    'avatars0.githubusercontent.com': 1,
    'avatars1.githubusercontent.com': 1,
    'avatars2.githubusercontent.com': 1,
    'avatars3.githubusercontent.com': 1,
    'github.com': 1,
    'raw.githubusercontent.com': 1
  };

  function fail(code, msg, cause) {
    var e = new Error('JRender.Images: ' + code + (msg ? ' (' + msg + ')' : ''));
    e.code = code;
    if (cause) e.cause = cause;
    return e;
  }

  function sanitizeUrl(url) {
    if (url == null || url === '') return { ok: false, reason: 'absent' };
    if (typeof url !== 'string') return { ok: false, reason: 'not-string' };
    var s = url.trim();
    if (!/^https:\/\//i.test(s)) return { ok: false, reason: 'non-https' };
    if (/[?#]/.test(s) && /(?:^|[?#&])(?:token|access_token|pat|authorization|key)=/i.test(s)) {
      return { ok: false, reason: 'secret-query' };
    }
    /* Prefer URL when present; fall back to regex for Node/vm without URL. */
    var host = null;
    if (typeof URL === 'function') {
      try { host = new URL(s).hostname.toLowerCase(); } catch (e) {
        return { ok: false, reason: 'bad-url' };
      }
    } else {
      var m = /^https:\/\/([^\/?#]+)/i.exec(s);
      if (!m) return { ok: false, reason: 'bad-url' };
      host = m[1].toLowerCase();
      if (host.indexOf('@') >= 0) return { ok: false, reason: 'bad-url' };
    }
    if (!ALLOW_HOSTS[host]) return { ok: false, reason: 'host-not-allowed' };
    /* Strip query/hash for cache key stability; GitHub avatars work without them. */
    if (typeof URL === 'function') {
      try {
        var u = new URL(s);
        u.search = '';
        u.hash = '';
        s = u.toString();
      } catch (_) {}
    } else {
      s = s.replace(/[?#].*$/, '');
    }
    return { ok: true, url: s, host: host };
  }

  function nextId(store) {
    store._seq = (store._seq + 1) >>> 0 || 1;
    return store._seq;
  }

  function ImageHandle(store, id) {
    this.store = store;
    this.id = id;
    this.state = 'empty'; /* empty|loading|ready|error|freed */
    this.url = null;
    this.w = 0;
    this.h = 0;
    this.refs = 0;
    this.tex = null;
    this.view = null;
    this.bg = null;
    this.error = null;
    this.gen = 0;
  }

  function ImageStore(gc) {
    this.gc = gc;
    this.map = new Map();
    this.byUrl = new Map();
    this._seq = 1;
    this.bytes = 0;
    this.peak = 0;
    this.loads = 0;
    this.errors = 0;
    this.frees = 0;
    this.recoveries = 0;
    this.sampler = null;
    this.pipe = null;
    this.mod = null;
    this.bgl = null;
    this.ub = null;
  }

  ImageStore.prototype._ensurePipe = function (fmt) {
    var gc = this.gc, dev = gc.dev;
    if (!dev || gc.lost) throw fail('device-lost', 'no device for image pipe');
    if (this.pipe && this._fmt === fmt) return this.pipe;
    var code = [
      'struct U { vp: vec4f, scene: vec4f };',
      '@group(0) @binding(0) var<uniform> u: U;',
      '@group(0) @binding(1) var samp: sampler;',
      '@group(0) @binding(2) var tex: texture_2d<f32>;',
      'struct VOut { @builtin(position) p: vec4f, @location(0) uv: vec2f, @location(1) a: f32 };',
      '@vertex fn vs(@location(0) pos: vec2f, @location(1) uv: vec2f, @location(2) a: f32) -> VOut {',
      '  var o: VOut;',
      '  let sx = pos.x * u.scene.z + u.scene.x;',
      '  let sy = pos.y * u.scene.w + u.scene.y;',
      '  let ndc = vec2f((sx / u.vp.x) * 2.0 - 1.0, 1.0 - (sy / u.vp.y) * 2.0);',
      '  o.p = vec4f(ndc, 0.0, 1.0); o.uv = uv; o.a = a; return o;',
      '}',
      '@fragment fn fs(i: VOut) -> @location(0) vec4f {',
      '  let d = length(i.uv - vec2f(0.5, 0.5));',
      '  if (d > 0.5) { discard; }',
      '  let edge = smoothstep(0.5, 0.47, d);',
      '  let c = textureSample(tex, samp, i.uv);',
      '  return vec4f(c.rgb, c.a * i.a * edge);',
      '}'
    ].join('\n');
    this.mod = dev.createShaderModule({ code: code });
    this.bgl = dev.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: {} },
        { binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
        { binding: 2, visibility: GPUShaderStage.FRAGMENT, texture: {} }
      ]
    });
    var pl = dev.createPipelineLayout({ bindGroupLayouts: [this.bgl] });
    var BLEND = {
      color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
      alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' }
    };
    this.pipe = dev.createRenderPipeline({
      layout: pl,
      multisample: { count: 4 },
      primitive: { topology: 'triangle-list', cullMode: 'none' },
      vertex: {
        module: this.mod,
        entryPoint: 'vs',
        buffers: [{
          arrayStride: 20,
          attributes: [
            { shaderLocation: 0, offset: 0, format: 'float32x2' },
            { shaderLocation: 1, offset: 8, format: 'float32x2' },
            { shaderLocation: 2, offset: 16, format: 'float32' }
          ]
        }]
      },
      fragment: {
        module: this.mod,
        entryPoint: 'fs',
        targets: [{ format: fmt, blend: BLEND }]
      }
    });
    this.sampler = dev.createSampler({ magFilter: 'linear', minFilter: 'linear', addressModeU: 'clamp-to-edge', addressModeV: 'clamp-to-edge' });
    this.ub = dev.createBuffer({ size: 32, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    this._fmt = fmt;
    return this.pipe;
  };

  ImageStore.prototype._evictIfNeeded = function () {
    if (this.map.size < MAX_ENTRIES) return;
    var victim = null;
    for (var h of this.map.values()) {
      if (h.refs <= 0 && h.state !== 'loading') { victim = h; break; }
    }
    if (victim) this.free(victim, true);
  };

  ImageStore.prototype._uploadBitmap = function (handle, bmp) {
    var gc = this.gc, dev = gc.dev;
    if (!dev || gc.lost) throw fail('device-lost');
    var w = bmp.width | 0, h = bmp.height | 0;
    if (w < 1 || h < 1) throw fail('bad-bitmap', 'empty');
    var scale = 1;
    var edge = Math.max(w, h);
    if (edge > MAX_EDGE) scale = MAX_EDGE / edge;
    var tw = Math.max(1, Math.round(w * scale));
    var th = Math.max(1, Math.round(h * scale));
    if (tw * th > MAX_TEXELS) throw fail('too-large', tw + 'x' + th);
    /* Draw through canvas to get RGBA + optional downscale (CORS-safe when bitmap is clean). */
    var cv = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(tw, th) : document.createElement('canvas');
    cv.width = tw; cv.height = th;
    var ctx = cv.getContext('2d', { willReadFrequently: false });
    if (!ctx) throw fail('no-2d');
    ctx.clearRect(0, 0, tw, th);
    ctx.drawImage(bmp, 0, 0, tw, th);
    var tex = dev.createTexture({
      size: [tw, th],
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
    });
    if (typeof createImageBitmap === 'function' && cv.transferToImageBitmap) {
      /* prefer copyExternalImageToTexture when available */
    }
    try {
      dev.queue.copyExternalImageToTexture(
        { source: cv },
        { texture: tex },
        [tw, th]
      );
    } catch (e) {
      /* Fallback: read pixels (may throw if tainted - treat as CORS error). */
      var imgData;
      try { imgData = ctx.getImageData(0, 0, tw, th); } catch (te) {
        tex.destroy();
        throw fail('cors-tainted', 'canvas tainted; use public CORS avatar URLs only', te);
      }
      dev.queue.writeTexture({ texture: tex }, imgData.data, { bytesPerRow: tw * 4 }, [tw, th]);
    }
    if (handle.tex) {
      try { handle.tex.destroy(); } catch (_) {}
      this.bytes -= handle.w * handle.h * 4;
    }
    handle.tex = tex;
    handle.view = tex.createView();
    handle.w = tw;
    handle.h = th;
    handle.bg = null;
    this.bytes += tw * th * 4;
    if (this.bytes > this.peak) this.peak = this.bytes;
  };

  ImageStore.prototype.load = async function (src, opts) {
    opts = opts || {};
    this._evictIfNeeded();
    var urlInfo = null;
    var key = null;
    if (typeof src === 'string' || src == null) {
      urlInfo = sanitizeUrl(src);
      if (!urlInfo.ok) {
        var h0 = new ImageHandle(this, nextId(this));
        h0.state = urlInfo.reason === 'absent' ? 'empty' : 'error';
        h0.error = urlInfo.reason;
        h0.refs = 1;
        this.map.set(h0.id, h0);
        this.errors++;
        return h0;
      }
      key = urlInfo.url;
      if (this.byUrl.has(key)) {
        var exist = this.byUrl.get(key);
        exist.refs++;
        return exist;
      }
    }
    var handle = new ImageHandle(this, nextId(this));
    handle.refs = 1;
    handle.state = 'loading';
    handle.url = key;
    handle.gen++;
    var gen = handle.gen;
    this.map.set(handle.id, handle);
    if (key) this.byUrl.set(key, handle);
    this.loads++;
    try {
      var bmp;
      if (src && typeof src === 'object' && (src.close || src.width)) {
        bmp = src;
      } else {
        var ctrl = typeof AbortController === 'function' ? new AbortController() : null;
        var timer = null;
        if (ctrl && opts.timeoutMs) timer = setTimeout(function () { try { ctrl.abort(); } catch (_) {} }, opts.timeoutMs | 0);
        var res = await fetch(key, {
          mode: 'cors',
          credentials: 'omit',
          referrerPolicy: 'no-referrer',
          signal: ctrl && ctrl.signal
        });
        if (timer) clearTimeout(timer);
        if (!res.ok) throw fail('http-' + res.status, 'fetch failed');
        var blob = await res.blob();
        if (!/^image\//i.test(blob.type || 'image/png') && blob.type) {
          /* some CDNs omit type; still try decode */
        }
        bmp = await createImageBitmap(blob, { colorSpaceConversion: 'default', premultiplyAlpha: 'none' });
      }
      if (handle.gen !== gen || handle.state === 'freed') {
        try { bmp.close && bmp.close(); } catch (_) {}
        return handle;
      }
      this._uploadBitmap(handle, bmp);
      try { bmp.close && bmp.close(); } catch (_) {}
      handle.state = 'ready';
      handle.error = null;
    } catch (e) {
      handle.state = 'error';
      handle.error = (e && e.code) || (e && e.message) || String(e);
      this.errors++;
      if (key && this.byUrl.get(key) === handle) this.byUrl.delete(key);
    }
    return handle;
  };

  ImageStore.prototype.patch = async function (handle, src, opts) {
    opts = opts || {};
    if (!handle || handle.state === 'freed') throw fail('freed');
    handle.gen++;
    var gen = handle.gen;
    var oldUrl = handle.url;
    if (oldUrl && this.byUrl.get(oldUrl) === handle) this.byUrl.delete(oldUrl);
    handle.state = 'loading';
    handle.error = null;
    handle.url = null;
    try {
      var bmp = null;
      if (typeof src === 'string' || src == null) {
        var urlInfo = sanitizeUrl(src);
        if (!urlInfo.ok) {
          handle.state = urlInfo.reason === 'absent' ? 'empty' : 'error';
          handle.error = urlInfo.reason;
          if (handle.tex) {
            try { handle.tex.destroy(); } catch (_) {}
            this.bytes -= handle.w * handle.h * 4;
            handle.tex = null; handle.view = null; handle.w = 0; handle.h = 0;
          }
          return handle;
        }
        handle.url = urlInfo.url;
        this.byUrl.set(handle.url, handle);
        var ctrl = typeof AbortController === 'function' ? new AbortController() : null;
        var timer = null;
        if (ctrl && opts.timeoutMs) timer = setTimeout(function () { try { ctrl.abort(); } catch (_) {} }, opts.timeoutMs | 0);
        var res = await fetch(handle.url, {
          mode: 'cors', credentials: 'omit', referrerPolicy: 'no-referrer',
          signal: ctrl && ctrl.signal
        });
        if (timer) clearTimeout(timer);
        if (!res.ok) throw fail('http-' + res.status);
        var blob = await res.blob();
        bmp = await createImageBitmap(blob, { colorSpaceConversion: 'default', premultiplyAlpha: 'none' });
      } else {
        bmp = src;
      }
      if (handle.gen !== gen || handle.state === 'freed') {
        try { bmp && bmp.close && bmp.close(); } catch (_) {}
        return handle;
      }
      this._uploadBitmap(handle, bmp);
      try { bmp && bmp.close && bmp.close(); } catch (_) {}
      handle.state = 'ready';
      handle.error = null;
    } catch (e) {
      handle.state = 'error';
      handle.error = (e && e.code) || (e && e.message) || String(e);
      this.errors++;
    }
    return handle;
  };

  ImageStore.prototype.retain = function (handle) {
    if (!handle || handle.state === 'freed') return;
    handle.refs++;
  };

  ImageStore.prototype.free = function (handle, force) {
    if (!handle || handle.state === 'freed') return;
    handle.refs = Math.max(0, handle.refs - 1);
    if (!force && handle.refs > 0) return;
    handle.state = 'freed';
    handle.gen++;
    if (handle.url && this.byUrl.get(handle.url) === handle) this.byUrl.delete(handle.url);
    if (handle.tex) {
      try { handle.tex.destroy(); } catch (_) {}
      this.bytes -= handle.w * handle.h * 4;
      handle.tex = null; handle.view = null;
    }
    this.map.delete(handle.id);
    this.frees++;
  };

  ImageStore.prototype.recover = async function () {
    this.recoveries++;
    this.pipe = null; this.mod = null; this.bgl = null; this.sampler = null; this.ub = null; this._fmt = null;
    var pending = [];
    for (var h of this.map.values()) {
      if (h.url && (h.state === 'ready' || h.state === 'error' || h.state === 'loading')) {
        h.tex = null; h.view = null; h.bg = null; h.state = 'loading';
        pending.push(this.patch(h, h.url, { timeoutMs: 15000 }));
      }
    }
    await Promise.all(pending);
  };

  ImageStore.prototype.destroy = function () {
    for (var h of [...this.map.values()]) this.free(h, true);
    this.pipe = null; this.mod = null; this.ub = null; this.sampler = null;
  };

  /* Per-renderer image layer: overlays tied to companion DL node ids for hit/parallax. */
  function ImageLayer(renderer) {
    this.r = renderer;
    this.nodes = new Map(); /* nodeId -> { handle, x,y,w,h, alpha, clip, dx, dy, exclusiveTextId } */
    this.vb = null;
  }

  ImageLayer.prototype.set = function (nodeId, desc) {
    if (!desc || !desc.handle) {
      this.nodes.delete(nodeId | 0);
      return;
    }
    this.nodes.set(nodeId | 0, {
      handle: desc.handle,
      x: +desc.x || 0,
      y: +desc.y || 0,
      w: +desc.w || 0,
      h: +desc.h || 0,
      alpha: desc.alpha == null ? 1 : +desc.alpha,
      clip: desc.clip || 'circle',
      dx: +desc.dx || 0,
      dy: +desc.dy || 0
    });
  };

  ImageLayer.prototype.clear = function (nodeId) {
    if (nodeId == null) this.nodes.clear();
    else this.nodes.delete(nodeId | 0);
  };

  ImageLayer.prototype.shift = function (nodeId, dx, dy) {
    var n = this.nodes.get(nodeId | 0);
    if (n) { n.dx = +dx || 0; n.dy = +dy || 0; }
  };

  ImageLayer.prototype.draw = function (pass, dpr) {
    var r = this.r;
    var store = r._imageStore;
    if (!store || !this.nodes.size || !pass) return 0;
    if (!r.dev || r.lost || r.hidden) return 0;
    try { store._ensurePipe(r.fmt || 'bgra8unorm'); } catch (e) { return 0; }
    var nDraw = 0;
    var d = dpr || r.dpr || 1;
    for (var e of r.entries) {
      nDraw += this._drawEntry(pass, store, e, d);
    }
    return nDraw;
  };

  ImageLayer.prototype._drawEntry = function (pass, store, e, d) {
    var r = this.r, n = 0;
    if (!e || !e.scene) return 0;
    var verts = [];
    for (var [id, node] of this.nodes) {
      var h = node.handle;
      if (!h || h.state !== 'ready' || !h.view) continue;
      var x = (node.x + node.dx) * d;
      var y = (node.y + node.dy) * d;
      var w = node.w * d, hh = node.h * d;
      var a = node.alpha;
      /* CSS px relative to scene; shader maps via uniform */
      var x0 = node.x + node.dx, y0 = node.y + node.dy, x1 = x0 + node.w, y1 = y0 + node.h;
      verts.push({ h: h, x0: x0, y0: y0, x1: x1, y1: y1, a: a });
    }
    if (!verts.length) return 0;
    var cssW = e.w, cssH = e.h;
    var u = new Float32Array([
      r.c.width / d, r.c.height / d, 0, 0,
      e.x, e.y, 1, 1
    ]);
    /* vp = css canvas size; scene offset */
    u[0] = r.c.width / (r.dpr || d);
    u[1] = r.c.height / (r.dpr || d);
    u[4] = e.x; u[5] = e.y; u[6] = 1; u[7] = 1;
    r.dev.queue.writeBuffer(store.ub, 0, u);
    for (var i = 0; i < verts.length; i++) {
      var v = verts[i];
      var data = new Float32Array([
        v.x0, v.y0, 0, 0, v.a,
        v.x1, v.y0, 1, 0, v.a,
        v.x1, v.y1, 1, 1, v.a,
        v.x0, v.y0, 0, 0, v.a,
        v.x1, v.y1, 1, 1, v.a,
        v.x0, v.y1, 0, 1, v.a
      ]);
      var vb = r.dev.createBuffer({ size: data.byteLength, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST });
      r.dev.queue.writeBuffer(vb, 0, data);
      var bg = r.dev.createBindGroup({
        layout: store.bgl,
        entries: [
          { binding: 0, resource: { buffer: store.ub } },
          { binding: 1, resource: store.sampler },
          { binding: 2, resource: v.h.view }
        ]
      });
      var vx = Math.round(e.x * d), vy = Math.round(e.y * d);
      var vw = Math.round(e.w * d), vh = Math.round(e.h * d);
      var cx = Math.max(0, vx), cy = Math.max(0, vy);
      var cw = Math.min(r.c.width, vx + vw) - cx, chh = Math.min(r.c.height, vy + vh) - cy;
      if (cw <= 0 || chh <= 0) { vb.destroy(); continue; }
      pass.setViewport(vx, vy, vw, vh, 0, 1);
      pass.setScissorRect(cx, cy, cw, chh);
      pass.setPipeline(store.pipe);
      pass.setBindGroup(0, bg);
      pass.setVertexBuffer(0, vb);
      pass.draw(6, 1, 0, 0);
      vb.destroy();
      n++;
    }
    return n;
  };

  function attachToRenderer(renderer, store) {
    if (!renderer || renderer._imageStore) return renderer;
    renderer._imageStore = store;
    renderer.images = new ImageLayer(renderer);
    /* Replace draw to composite images inside the same render pass (before end). */
    renderer.draw = function () {
      if (!this.msaa || this.hidden || this.lost) return 0;
      for (var e of this.entries) if (e.scene.h) this.sync(e.scene);
      this.ca.resolveTarget = this.ctx.getCurrentTexture().createView();
      var enc = this.dev.createCommandEncoder(), p = enc.beginRenderPass(this.rp);
      var n = 0, d = this.dpr;
      for (var e2 of this.entries) {
        var g = e2.scene.gpu;
        if (!e2.scene.h || !g.ranges.length) continue;
        var vx = Math.round(e2.x * d), vy = Math.round(e2.y * d), vw = Math.round(e2.w * d), vh = Math.round(e2.h * d);
        var cx = Math.max(0, vx), cy = Math.max(0, vy), cw = Math.min(this.c.width, vx + vw) - cx, chh = Math.min(this.c.height, vy + vh) - cy;
        if (cw <= 0 || chh <= 0) continue;
        p.setViewport(vx, vy, vw, vh, 0, 1); p.setScissorRect(cx, cy, cw, chh); p.setPipeline(this.pipe); p.setBindGroup(0, g.bg); p.setVertexBuffer(0, g.vb);
        for (var i = 0; i < g.ranges.length; i += 2) { p.draw(g.ranges[i + 1], 1, g.ranges[i], 0); n++; }
      }
      if (this.images) n += this.images.draw(p, d) || 0;
      p.end(); this.dev.queue.submit([enc.finish()]); this.draws = n; this.cursorSync(); return n;
    };
    var prevRecover = renderer.recover && renderer.recover.bind(renderer);
    if (renderer.recover) {
      renderer.recover = async function () {
        if (prevRecover) await prevRecover();
        if (this._imageStore) await this._imageStore.recover();
      };
    }
    return renderer;
  }

  function storeFor(gc) {
    if (!gc) throw fail('no-context');
    if (!gc._images) {
      gc._images = new ImageStore(gc);
      var prevDestroy = gc.destroy && gc.destroy.bind(gc);
      gc.destroy = function () {
        if (this._images) this._images.destroy();
        if (prevDestroy) prevDestroy();
      };
      var prevRecover = gc.recover && gc.recover.bind(gc);
      if (gc.recover) {
        gc.recover = async function () {
          if (prevRecover) await prevRecover();
          if (this._images) await this._images.recover();
        };
      }
    }
    return gc._images;
  }

  /* Hook Renderer.init - every renderer has r.gc (shared or owned). */
  var R = J.Renderer;
  if (R && R.init) {
    var origInit = R.init.bind(R);
    R.init = async function (o) {
      var r = await origInit(o);
      if (r && r.gc) attachToRenderer(r, storeFor(r.gc));
      return r;
    };
  }

  J.Images = {
    MAGIC: MAGIC,
    VERSION: VERSION,
    MAX_EDGE: MAX_EDGE,
    MAX_ENTRIES: MAX_ENTRIES,
    sanitizeUrl: sanitizeUrl,
    storeFor: storeFor,
    attachToRenderer: attachToRenderer,
    allowHosts: Object.keys(ALLOW_HOSTS)
  };
  J.ImageStore = ImageStore;
  J.ImageHandle = ImageHandle;
  J.ImageLayer = ImageLayer;

  root.JRender = J;
})(typeof globalThis !== 'undefined' ? globalThis : this);
