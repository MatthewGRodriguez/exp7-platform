/*! model_tools_3d.js — MODEL TOOLS orbit scene (minimal WebGL, Safari-friendly, no CDN) · easy175 Fusion-esc 3D BP */
(function (global) {
  'use strict';

  var state = null;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function deg(r) { return r * Math.PI / 180; }

  function mat4Identity() {
    return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
  }
  function mat4Perspective(out, fovy, aspect, near, far) {
    var f = 1 / Math.tan(fovy / 2);
    var nf = 1 / (near - far);
    out[0] = f / aspect; out[1] = 0; out[2] = 0; out[3] = 0;
    out[4] = 0; out[5] = f; out[6] = 0; out[7] = 0;
    out[8] = 0; out[9] = 0; out[10] = (far + near) * nf; out[11] = -1;
    out[12] = 0; out[13] = 0; out[14] = 2 * far * near * nf; out[15] = 0;
    return out;
  }
  function mat4LookAt(out, eye, center, up) {
    var ex = eye[0], ey = eye[1], ez = eye[2];
    var zx = ex - center[0], zy = ey - center[1], zz = ez - center[2];
    var zl = 1 / Math.hypot(zx, zy, zz); zx *= zl; zy *= zl; zz *= zl;
    var xx = up[1] * zz - up[2] * zy;
    var xy = up[2] * zx - up[0] * zz;
    var xz = up[0] * zy - up[1] * zx;
    var xl = Math.hypot(xx, xy, xz) || 1; xx /= xl; xy /= xl; xz /= xl;
    var yx = zy * xz - zz * xy;
    var yy = zz * xx - zx * xz;
    var yz = zx * xy - zy * xx;
    out[0] = xx; out[1] = yx; out[2] = zx; out[3] = 0;
    out[4] = xy; out[5] = yy; out[6] = zy; out[7] = 0;
    out[8] = xz; out[9] = yz; out[10] = zz; out[11] = 0;
    out[12] = -(xx * ex + xy * ey + xz * ez);
    out[13] = -(yx * ex + yy * ey + yz * ez);
    out[14] = -(zx * ex + zy * ey + zz * ez);
    out[15] = 1;
    return out;
  }
  function mat4Multiply(out, a, b) {
    var a00=a[0],a01=a[1],a02=a[2],a03=a[3];
    var a10=a[4],a11=a[5],a12=a[6],a13=a[7];
    var a20=a[8],a21=a[9],a22=a[10],a23=a[11];
    var a30=a[12],a31=a[13],a32=a[14],a33=a[15];
    var b0,b1,b2,b3;
    b0=b[0];b1=b[1];b2=b[2];b3=b[3];
    out[0]=b0*a00+b1*a10+b2*a20+b3*a30;
    out[1]=b0*a01+b1*a11+b2*a21+b3*a31;
    out[2]=b0*a02+b1*a12+b2*a22+b3*a32;
    out[3]=b0*a03+b1*a13+b2*a23+b3*a33;
    b0=b[4];b1=b[5];b2=b[6];b3=b[7];
    out[4]=b0*a00+b1*a10+b2*a20+b3*a30;
    out[5]=b0*a01+b1*a11+b2*a21+b3*a31;
    out[6]=b0*a02+b1*a12+b2*a22+b3*a32;
    out[7]=b0*a03+b1*a13+b2*a23+b3*a33;
    b0=b[8];b1=b[9];b2=b[10];b3=b[11];
    out[8]=b0*a00+b1*a10+b2*a20+b3*a30;
    out[9]=b0*a01+b1*a11+b2*a21+b3*a31;
    out[10]=b0*a02+b1*a12+b2*a22+b3*a32;
    out[11]=b0*a03+b1*a13+b2*a23+b3*a33;
    b0=b[12];b1=b[13];b2=b[14];b3=b[15];
    out[12]=b0*a00+b1*a10+b2*a20+b3*a30;
    out[13]=b0*a01+b1*a11+b2*a21+b3*a31;
    out[14]=b0*a02+b1*a12+b2*a22+b3*a32;
    out[15]=b0*a03+b1*a13+b2*a23+b3*a33;
    return out;
  }
  function mat4Translate(out, a, v) {
    var t = mat4Identity();
    t[12]=v[0]; t[13]=v[1]; t[14]=v[2];
    return mat4Multiply(out, a, t);
  }
  function mat4Scale(out, a, v) {
    var s = mat4Identity();
    s[0]=v[0]; s[5]=v[1]; s[10]=v[2];
    return mat4Multiply(out, a, s);
  }

  function compile(gl, type, src) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      var info = gl.getShaderInfoLog(sh);
      gl.deleteShader(sh);
      throw new Error('shader: ' + info);
    }
    return sh;
  }
  function program(gl, vs, fs) {
    var p = gl.createProgram();
    gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs));
    gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      throw new Error('link: ' + gl.getProgramInfoLog(p));
    }
    return p;
  }

  var VS = [
    'attribute vec3 aPos;',
    'attribute vec3 aColor;',
    'uniform mat4 uMVP;',
    'varying vec3 vColor;',
    'void main(){',
    '  vColor = aColor;',
    '  gl_Position = uMVP * vec4(aPos, 1.0);',
    '}'
  ].join('\n');
  var FS = [
    'precision mediump float;',
    'varying vec3 vColor;',
    'void main(){ gl_FragColor = vec4(vColor, 1.0); }'
  ].join('\n');

  function hexToRgb(hex) {
    var h = String(hex || '#4ea1ff').replace('#', '');
    if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    var n = parseInt(h, 16);
    if (!isFinite(n)) return [0.3, 0.63, 1];
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }

  function buildGrid(half, step) {
    var positions = [];
    var colors = [];
    var cAxisX = [0.75, 0.28, 0.28];
    var cAxisZ = [0.28, 0.55, 0.85];
    var cGrid = [0.22, 0.26, 0.34];
    for (var i = -half; i <= half; i += step) {
      var isAxis = i === 0;
      var cx = isAxis ? cAxisZ : cGrid;
      var cz = isAxis ? cAxisX : cGrid;
      // line along X (fixed z=i)
      positions.push(-half, 0, i, half, 0, i);
      colors.push(cx[0], cx[1], cx[2], cx[0], cx[1], cx[2]);
      // line along Z (fixed x=i)
      positions.push(i, 0, -half, i, 0, half);
      colors.push(cz[0], cz[1], cz[2], cz[0], cz[1], cz[2]);
    }
    return { pos: new Float32Array(positions), col: new Float32Array(colors), n: positions.length / 3 };
  }

  function buildMarkerMesh(rgb, selected) {
    // simple pyramid (base + tip) as triangle list
    var s = selected ? 0.55 : 0.4;
    var h = selected ? 1.35 : 1.05;
    var top = [0, h, 0];
    var base = [[-s,0,-s],[s,0,-s],[s,0,s],[-s,0,s]];
    var faces = [[0,1,2],[0,2,3]]; // base
    var sides = [[0,1,'t'],[1,2,'t'],[2,3,'t'],[3,0,'t']];
    var pos = [];
    var col = [];
    var bright = selected ? 1.15 : 1;
    var r = clamp(rgb[0]*bright,0,1), g = clamp(rgb[1]*bright,0,1), b = clamp(rgb[2]*bright,0,1);
    var baseC = [r*0.55, g*0.55, b*0.55];
    faces.forEach(function (f) {
      f.forEach(function (i) {
        pos.push(base[i][0], base[i][1], base[i][2]);
        col.push(baseC[0], baseC[1], baseC[2]);
      });
    });
    sides.forEach(function (sdef) {
      var a = base[sdef[0]], c = base[sdef[1]];
      pos.push(a[0],a[1],a[2], c[0],c[1],c[2], top[0],top[1],top[2]);
      col.push(r,g,b, r,g,b, clamp(r*1.25,0,1), clamp(g*1.25,0,1), clamp(b*1.25,0,1));
    });
    return { pos: new Float32Array(pos), col: new Float32Array(col), n: pos.length / 3 };
  }

  function buildBoxMesh(rgb, selected, sx, sy, sz) {
    sx = sx != null ? sx : (selected ? 0.7 : 0.55);
    sy = sy != null ? sy : (selected ? 0.7 : 0.55);
    sz = sz != null ? sz : (selected ? 0.7 : 0.55);
    var hx = sx / 2, hy = sy / 2, hz = sz / 2;
    var v = [
      [-hx,-hy,-hz],[hx,-hy,-hz],[hx,hy,-hz],[-hx,hy,-hz],
      [-hx,-hy,hz],[hx,-hy,hz],[hx,hy,hz],[-hx,hy,hz]
    ];
    var faces = [
      [0,1,2],[0,2,3], [4,6,5],[4,7,6],
      [0,4,5],[0,5,1], [2,6,7],[2,7,3],
      [0,3,7],[0,7,4], [1,5,6],[1,6,2]
    ];
    var pos = [], col = [];
    var bright = selected ? 1.12 : 1;
    var r = clamp(rgb[0]*bright,0,1), g = clamp(rgb[1]*bright,0,1), b = clamp(rgb[2]*bright,0,1);
    faces.forEach(function (f, fi) {
      var shade = 0.75 + 0.08 * (fi % 4);
      f.forEach(function (i) {
        pos.push(v[i][0], v[i][1], v[i][2]);
        col.push(clamp(r*shade,0,1), clamp(g*shade,0,1), clamp(b*shade,0,1));
      });
    });
    return { pos: new Float32Array(pos), col: new Float32Array(col), n: pos.length / 3 };
  }

  function buildSegmentLines(ents) {
    var pos = [], col = [];
    (ents || []).forEach(function (ent) {
      if (!ent || ent.enabled === false) return;
      var isSeg = ent.kind === 'world_segment' || ent._compType === 'segment' || (ent.pos2 != null);
      if (!isSeg) return;
      var a = ent.pos || { x:0,y:0,z:0 };
      var b = ent.pos2 || { x: Number(ent.x2)||0, y: Number(ent.y2)||0, z: Number(ent.z2)||0 };
      var rgb = hexToRgb(ent.color || '#7dcfff');
      pos.push(Number(a.x)||0, Number(a.y)||0, Number(a.z)||0);
      pos.push(Number(b.x)||0, Number(b.y)||0, Number(b.z)||0);
      col.push(rgb[0], rgb[1], rgb[2], rgb[0], rgb[1], rgb[2]);
    });
    return { pos: new Float32Array(pos), col: new Float32Array(col), n: pos.length / 3 };
  }

  function buildGizmoLines(origin) {
    var o = origin || { x:0, y:0, z:0 };
    var ox = Number(o.x)||0, oy = Number(o.y)||0, oz = Number(o.z)||0;
    var L = 1.8;
    var pos = [
      ox, oy, oz, ox+L, oy, oz,
      ox, oy, oz, ox, oy+L, oz,
      ox, oy, oz, ox, oy, oz+L
    ];
    var col = [
      0.95,0.35,0.35, 0.95,0.35,0.35,
      0.35,0.9,0.4, 0.35,0.9,0.4,
      0.35,0.55,0.95, 0.35,0.55,0.95
    ];
    return { pos: new Float32Array(pos), col: new Float32Array(col), n: 6 };
  }

  function worldBounds(ents) {
    var minX=Infinity, minY=Infinity, minZ=Infinity, maxX=-Infinity, maxY=-Infinity, maxZ=-Infinity, n=0;
    function acc(x,y,z){
      x=Number(x)||0; y=Number(y)||0; z=Number(z)||0;
      if (x<minX) minX=x; if (y<minY) minY=y; if (z<minZ) minZ=z;
      if (x>maxX) maxX=x; if (y>maxY) maxY=y; if (z>maxZ) maxZ=z;
      n++;
    }
    (ents||[]).forEach(function(ent){
      if (!ent || ent.enabled === false) return;
      var p = ent.pos || {};
      acc(p.x, p.y, p.z);
      if (ent.pos2) acc(ent.pos2.x, ent.pos2.y, ent.pos2.z);
    });
    if (!n) return { min:[-5,0,-5], max:[5,2,5], size:10, center:[0,0,0] };
    var cx=(minX+maxX)/2, cy=(minY+maxY)/2, cz=(minZ+maxZ)/2;
    var size = Math.max(maxX-minX, maxY-minY, maxZ-minZ, 2);
    return { min:[minX,minY,minZ], max:[maxX,maxY,maxZ], size:size, center:[cx,cy,cz] };
  }

  function projectPoint(mvp, x, y, z, w, h) {
    var m = mvp;
    var X = m[0]*x + m[4]*y + m[8]*z + m[12];
    var Y = m[1]*x + m[5]*y + m[9]*z + m[13];
    var Z = m[2]*x + m[6]*y + m[10]*z + m[14];
    var W = m[3]*x + m[7]*y + m[11]*z + m[15];
    if (Math.abs(W) < 1e-6) return null;
    var ndcX = X / W, ndcY = Y / W, ndcZ = Z / W;
    if (ndcZ < -1 || ndcZ > 1) return null;
    return { x: (ndcX * 0.5 + 0.5) * w, y: (1 - (ndcY * 0.5 + 0.5)) * h, z: ndcZ };
  }

  function rayGround(mx, my, canvas, eye, target, fov, aspect) {
    // NDC
    var rect = canvas.getBoundingClientRect();
    var nx = ((mx - rect.left) / rect.width) * 2 - 1;
    var ny = 1 - ((my - rect.top) / rect.height) * 2;
    // camera basis
    var forward = [target[0]-eye[0], target[1]-eye[1], target[2]-eye[2]];
    var fl = Math.hypot(forward[0], forward[1], forward[2]) || 1;
    forward[0]/=fl; forward[1]/=fl; forward[2]/=fl;
    var up = [0,1,0];
    var right = [forward[1]*up[2]-forward[2]*up[1], forward[2]*up[0]-forward[0]*up[2], forward[0]*up[1]-forward[1]*up[0]];
    var rl = Math.hypot(right[0], right[1], right[2]) || 1;
    right[0]/=rl; right[1]/=rl; right[2]/=rl;
    up = [right[1]*forward[2]-right[2]*forward[1], right[2]*forward[0]-right[0]*forward[2], right[0]*forward[1]-right[1]*forward[0]];
    var tan = Math.tan(fov / 2);
    var dir = [
      forward[0] + right[0]*nx*tan*aspect + up[0]*ny*tan,
      forward[1] + right[1]*nx*tan*aspect + up[1]*ny*tan,
      forward[2] + right[2]*nx*tan*aspect + up[2]*ny*tan
    ];
    var dl = Math.hypot(dir[0], dir[1], dir[2]) || 1;
    dir[0]/=dl; dir[1]/=dl; dir[2]/=dl;
    if (Math.abs(dir[1]) < 1e-6) return null;
    var t = -eye[1] / dir[1];
    if (t < 0) return null;
    return { x: eye[0] + dir[0]*t, y: 0, z: eye[2] + dir[2]*t };
  }

  function ensureOverlay(canvas) {
    var parent = canvas.parentNode;
    if (!parent) return null;
    parent.style.position = parent.style.position || 'relative';
    var ov = parent.querySelector('.mt3d-overlay');
    if (!ov) {
      ov = document.createElement('canvas');
      ov.className = 'mt3d-overlay';
      ov.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;';
      parent.appendChild(ov);
    }
    return ov;
  }

  function mount(canvasEl, opts) {
    opts = opts || {};
    unmount();
    if (!canvasEl) throw new Error('ModelTools3D.mount: no canvas');
    var gl = canvasEl.getContext('webgl', { antialias: true, alpha: false }) ||
             canvasEl.getContext('experimental-webgl', { antialias: true, alpha: false });
    if (!gl) throw new Error('WebGL unavailable');

    var prog = program(gl, VS, FS);
    var aPos = gl.getAttribLocation(prog, 'aPos');
    var aColor = gl.getAttribLocation(prog, 'aColor');
    var uMVP = gl.getUniformLocation(prog, 'uMVP');

    var gridHalf = (opts.gridSize != null ? opts.gridSize : 20);
    var grid = buildGrid(gridHalf, 1);
    var gridBufPos = gl.createBuffer();
    var gridBufCol = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gridBufPos); gl.bufferData(gl.ARRAY_BUFFER, grid.pos, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, gridBufCol); gl.bufferData(gl.ARRAY_BUFFER, grid.col, gl.STATIC_DRAW);

    var markerBufPos = gl.createBuffer();
    var markerBufCol = gl.createBuffer();

    var overlay = ensureOverlay(canvasEl);

    state = {
      canvas: canvasEl,
      gl: gl,
      prog: prog,
      aPos: aPos,
      aColor: aColor,
      uMVP: uMVP,
      grid: grid,
      gridBufPos: gridBufPos,
      gridBufCol: gridBufCol,
      gridHalf: gridHalf,
      showAxes: opts.showAxes !== false,
      markerBufPos: markerBufPos,
      markerBufCol: markerBufCol,
      entities: [],
      mode: opts.mode || 'navigate',
      selectedId: null,
      yaw: deg(-35),
      pitch: deg(42),
      dist: 28,
      target: [0, 0, 0],
      fov: deg(50),
      keys: {},
      dragging: false,
      dragBtn: 0,
      lastX: 0,
      lastY: 0,
      raf: 0,
      overlay: overlay,
      onPlace: opts.onPlace || null,
      onSelect: opts.onSelect || null,
      onChange: opts.onChange || null,
      onMove: opts.onMove || null,
      gizmo: opts.gizmo || null, /* null|move|rotate|scale — translate implemented */
      measureLabel: opts.measureLabel || null, /* {a:{x,y,z}, b:{x,y,z}, text} */
      measureLive: null,
      lineBufPos: gl.createBuffer(),
      lineBufCol: gl.createBuffer(),
      gizmoBufPos: gl.createBuffer(),
      gizmoBufCol: gl.createBuffer(),
      destroyed: false
    };

    if (opts.camera) setCamera(opts.camera);
    resize();
    bindEvents();
    loop();
    return api;
  }

  function unmount() {
    if (!state) return;
    state.destroyed = true;
    if (state.raf) cancelAnimationFrame(state.raf);
    unbindEvents();
    try {
      var gl = state.gl;
      if (gl) {
        gl.deleteBuffer(state.gridBufPos);
        gl.deleteBuffer(state.gridBufCol);
        gl.deleteBuffer(state.markerBufPos);
        gl.deleteBuffer(state.markerBufCol);
        try { if (state.lineBufPos) gl.deleteBuffer(state.lineBufPos); } catch (_l1) {}
        try { if (state.lineBufCol) gl.deleteBuffer(state.lineBufCol); } catch (_l2) {}
        try { if (state.gizmoBufPos) gl.deleteBuffer(state.gizmoBufPos); } catch (_g1) {}
        try { if (state.gizmoBufCol) gl.deleteBuffer(state.gizmoBufCol); } catch (_g2) {}
        gl.deleteProgram(state.prog);
      }
    } catch (_e) {}
    if (state.overlay && state.overlay.parentNode) {
      try { state.overlay.parentNode.removeChild(state.overlay); } catch (_o) {}
    }
    state = null;
  }

  function eyeFromOrbit() {
    var s = state;
    var cp = Math.cos(s.pitch), sp = Math.sin(s.pitch);
    var cy = Math.cos(s.yaw), sy = Math.sin(s.yaw);
    return [
      s.target[0] + s.dist * cp * sy,
      s.target[1] + s.dist * sp,
      s.target[2] + s.dist * cp * cy
    ];
  }

  function resize() {
    if (!state) return;
    var c = state.canvas;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = Math.max(2, Math.floor(c.clientWidth * dpr));
    var h = Math.max(2, Math.floor(c.clientHeight * dpr));
    if (c.width !== w || c.height !== h) {
      c.width = w; c.height = h;
    }
    if (state.overlay) {
      state.overlay.width = w;
      state.overlay.height = h;
    }
    state.gl.viewport(0, 0, w, h);
  }

  function setEntities(list) {
    if (!state) return;
    state.entities = Array.isArray(list) ? list.slice() : [];
  }
  function getEntities() {
    return state ? state.entities.slice() : [];
  }
  function setMode(mode) {
    if (!state) return;
    state.mode = mode || 'navigate';
    state.canvas.style.cursor = mode === 'place' ? 'crosshair' : (mode === 'select' ? 'pointer' : 'grab');
  }
  function setSelectedId(id) {
    if (!state) return;
    state.selectedId = id || null;
  }
  function setGridSize(n) {
    if (!state) return;
    n = Math.max(4, Math.min(80, Number(n) || 20));
    state.gridHalf = n;
    state.grid = buildGrid(n, 1);
    var gl = state.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, state.gridBufPos); gl.bufferData(gl.ARRAY_BUFFER, state.grid.pos, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, state.gridBufCol); gl.bufferData(gl.ARRAY_BUFFER, state.grid.col, gl.STATIC_DRAW);
  }
  function setShowAxes(on) {
    if (!state) return;
    state.showAxes = !!on;
  }
  function getCamera() {
    if (!state) return null;
    return {
      yaw: state.yaw,
      pitch: state.pitch,
      dist: state.dist,
      target: state.target.slice()
    };
  }
  function setCamera(cam) {
    if (!state || !cam) return;
    function asRad(v, isYaw) {
      var n = Number(v);
      if (!isFinite(n)) return isYaw ? state.yaw : state.pitch;
      if (cam._rad) return n;
      // defaults in WB are degrees (-35, 42)
      if (Math.abs(n) > Math.PI + 0.01) return n * Math.PI / 180;
      // ambiguous small numbers: treat as degrees if |n|<=90 and not flagged
      if (!cam._rad && Math.abs(n) <= 90) return n * Math.PI / 180;
      return n;
    }
    if (cam.yaw != null) state.yaw = asRad(cam.yaw, true);
    if (cam.pitch != null) state.pitch = clamp(asRad(cam.pitch, false), deg(8), deg(85));
    if (cam.dist != null) state.dist = Number(cam.dist) || state.dist;
    if (Array.isArray(cam.target) && cam.target.length >= 3) {
      state.target = [Number(cam.target[0])||0, Number(cam.target[1])||0, Number(cam.target[2])||0];
    }
  }

  function drawBuffer(bufPos, bufCol, n, mode) {
    var gl = state.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, bufPos);
    gl.enableVertexAttribArray(state.aPos);
    gl.vertexAttribPointer(state.aPos, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, bufCol);
    gl.enableVertexAttribArray(state.aColor);
    gl.vertexAttribPointer(state.aColor, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(mode, 0, n);
  }

  function render() {
    if (!state || state.destroyed) return;
    resize();
    var gl = state.gl;
    var c = state.canvas;
    var aspect = c.width / Math.max(1, c.height);
    var eye = eyeFromOrbit();
    var proj = mat4Perspective(mat4Identity(), state.fov, aspect, 0.1, 500);
    var view = mat4LookAt(mat4Identity(), eye, state.target, [0,1,0]);
    var vp = mat4Multiply(mat4Identity(), proj, view);

    gl.clearColor(0.07, 0.09, 0.12, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.useProgram(state.prog);
    gl.uniformMatrix4fv(state.uMVP, false, vp);
    drawBuffer(state.gridBufPos, state.gridBufCol, state.grid.n, gl.LINES);

    // segments as lines
    var segs = buildSegmentLines(state.entities);
    if (segs.n > 0) {
      gl.uniformMatrix4fv(state.uMVP, false, vp);
      gl.bindBuffer(gl.ARRAY_BUFFER, state.lineBufPos); gl.bufferData(gl.ARRAY_BUFFER, segs.pos, gl.DYNAMIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, state.lineBufCol); gl.bufferData(gl.ARRAY_BUFFER, segs.col, gl.DYNAMIC_DRAW);
      drawBuffer(state.lineBufPos, state.lineBufCol, segs.n, gl.LINES);
    }

    // entities (points / fields / non-segment markers)
    state.entities.forEach(function (ent) {
      if (!ent || ent.enabled === false) return;
      var isSeg = ent.kind === 'world_segment' || ent._compType === 'segment' || (ent.pos2 != null && ent.kind === 'world_segment');
      if (ent.kind === 'world_segment' || ent._compType === 'segment') return; /* drawn as lines */
      var pos = ent.pos || { x:0, y:0, z:0 };
      var rgb = hexToRgb(ent.color);
      var selected = ent.id === state.selectedId;
      var mesh = (ent.kind === 'world_field' || ent._compType === 'field')
        ? buildBoxMesh(rgb, selected, Number(ent.sizeX)||1.1, Number(ent.sizeY)||0.85, Number(ent.sizeZ)||1.1)
        : buildMarkerMesh(rgb, selected);
      var model = mat4Identity();
      mat4Translate(model, model, [Number(pos.x)||0, Number(pos.y)||0, Number(pos.z)||0]);
      var mvp = mat4Multiply(mat4Identity(), vp, model);
      gl.uniformMatrix4fv(state.uMVP, false, mvp);
      gl.bindBuffer(gl.ARRAY_BUFFER, state.markerBufPos); gl.bufferData(gl.ARRAY_BUFFER, mesh.pos, gl.DYNAMIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, state.markerBufCol); gl.bufferData(gl.ARRAY_BUFFER, mesh.col, gl.DYNAMIC_DRAW);
      drawBuffer(state.markerBufPos, state.markerBufCol, mesh.n, gl.TRIANGLES);
    });

    // translate gizmo at selected component
    if (state.gizmo === 'move' && state.selectedId) {
      var selEnt = null;
      state.entities.forEach(function (e) { if (e && e.id === state.selectedId) selEnt = e; });
      if (selEnt) {
        var gz = buildGizmoLines(selEnt.pos || { x:0,y:0,z:0 });
        gl.uniformMatrix4fv(state.uMVP, false, vp);
        gl.bindBuffer(gl.ARRAY_BUFFER, state.gizmoBufPos); gl.bufferData(gl.ARRAY_BUFFER, gz.pos, gl.DYNAMIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, state.gizmoBufCol); gl.bufferData(gl.ARRAY_BUFFER, gz.col, gl.DYNAMIC_DRAW);
        drawBuffer(state.gizmoBufPos, state.gizmoBufCol, gz.n, gl.LINES);
      }
    }

    // labels on overlay
    var ov = state.overlay;
    if (ov) {
      var ctx = ov.getContext('2d');
      ctx.clearRect(0, 0, ov.width, ov.height);
      ctx.font = '600 12px JetBrains Mono, ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      state.entities.forEach(function (ent) {
        if (!ent || ent.enabled === false) return;
        var pos = ent.pos || { x:0, y:0, z:0 };
        var lift = (ent.kind === 'world_field' || ent._compType === 'field') ? 0.9 : 1.4;
        var p = projectPoint(vp, Number(pos.x)||0, (Number(pos.y)||0) + lift, Number(pos.z)||0, ov.width, ov.height);
        if (!p) return;
        var label = String(ent.name || ent.kind || ent.id || '?');
        var dimBadge = (ent.kind === 'factor' && ent.dim) ? String(ent.dim) : '';
        if (!dimBadge && ent.kind === 'jmethod') dimBadge = 'JM';
        if (ent.kind === 'world_segment' || ent._compType === 'segment') dimBadge = dimBadge || 'SEG';
        if (ent.kind === 'world_field' || ent._compType === 'field') dimBadge = dimBadge || 'FLD';
        if (dimBadge && label.indexOf(dimBadge) < 0) label = '[' + dimBadge + '] ' + label;
        var pad = 4;
        var tw = ctx.measureText(label).width;
        ctx.fillStyle = 'rgba(8,12,18,0.72)';
        ctx.fillRect(p.x - tw/2 - pad, p.y - 14 - pad, tw + pad*2, 14 + pad);
        ctx.fillStyle = ent.id === state.selectedId ? '#ffe08a' : '#e8eef8';
        ctx.fillText(label, p.x, p.y);
        if (dimBadge) {
          var bw = ctx.measureText(dimBadge).width + 8;
          var bx = p.x - bw / 2;
          var by = p.y - 30;
          ctx.fillStyle = ent.color || '#4ea1ff';
          ctx.fillRect(bx, by, bw, 14);
          ctx.fillStyle = '#0b1220';
          ctx.font = '700 11px JetBrains Mono, ui-monospace, monospace';
          ctx.fillText(dimBadge, p.x, by + 12);
          ctx.font = '600 12px JetBrains Mono, ui-monospace, monospace';
        }
      });
      // live measure.distance label
      var ml = state.measureLive || state.measureLabel;
      if (ml && ml.a && ml.b) {
        var mx = ((Number(ml.a.x)||0) + (Number(ml.b.x)||0)) / 2;
        var my = ((Number(ml.a.y)||0) + (Number(ml.b.y)||0)) / 2 + 0.6;
        var mz = ((Number(ml.a.z)||0) + (Number(ml.b.z)||0)) / 2;
        var mp = projectPoint(vp, mx, my, mz, ov.width, ov.height);
        if (mp) {
          var mtxt = ml.text != null ? String(ml.text) : (
            'd=' + (Math.hypot(
              (Number(ml.a.x)||0)-(Number(ml.b.x)||0),
              (Number(ml.a.y)||0)-(Number(ml.b.y)||0),
              (Number(ml.a.z)||0)-(Number(ml.b.z)||0)
            )).toFixed(3)
          );
          var mtw = ctx.measureText(mtxt).width;
          ctx.fillStyle = 'rgba(224,175,104,0.92)';
          ctx.fillRect(mp.x - mtw/2 - 6, mp.y - 16, mtw + 12, 18);
          ctx.fillStyle = '#1a1208';
          ctx.fillText(mtxt, mp.x, mp.y);
        }
      }
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(180,200,230,0.85)';
      var gizmoNote = state.gizmo ? (' · gizmo:' + state.gizmo) : '';
      ctx.fillText('mode: ' + state.mode + gizmoNote + ' · drag orbit · scroll zoom · select+Move translate', 10, 18);
    }
  }

  function panLocal(dx, dz) {
    var s = state;
    var cy = Math.cos(s.yaw), sy = Math.sin(s.yaw);
    // right = (cy, 0, -sy)? with eye from yaw: right along yaw+90
    s.target[0] += dx * cy + dz * sy;
    s.target[2] += -dx * sy + dz * cy;
  }

  function tickKeys() {
    if (!state) return;
    var k = state.keys;
    var step = 0.35;
    if (k.KeyW || k.ArrowUp) panLocal(0, -step);
    if (k.KeyS || k.ArrowDown) panLocal(0, step);
    if (k.KeyA || k.ArrowLeft) panLocal(-step, 0);
    if (k.KeyD || k.ArrowRight) panLocal(step, 0);
  }

  function loop() {
    if (!state || state.destroyed) return;
    tickKeys();
    render();
    state.raf = requestAnimationFrame(loop);
  }

  function pickEntity(clientX, clientY) {
    if (!state) return null;
    var eye = eyeFromOrbit();
    var aspect = state.canvas.width / Math.max(1, state.canvas.height);
    var hit = rayGround(clientX, clientY, state.canvas, eye, state.target, state.fov, aspect);
    if (!hit) return null;
    var best = null, bestD = 1.2;
    state.entities.forEach(function (ent) {
      if (!ent || ent.enabled === false) return;
      var p = ent.pos || { x:0,y:0,z:0 };
      var d = Math.hypot((Number(p.x)||0) - hit.x, (Number(p.z)||0) - hit.z);
      if (d < bestD) { bestD = d; best = ent; }
    });
    return best;
  }

  function onPointerDown(e) {
    if (!state) return;
    state.dragging = true;
    state.dragBtn = e.button;
    state.lastX = e.clientX;
    state.lastY = e.clientY;
    if (state.mode === 'navigate') state.canvas.style.cursor = 'grabbing';
  }
  function onPointerMove(e) {
    if (!state || !state.dragging) return;
    var dx = e.clientX - state.lastX;
    var dy = e.clientY - state.lastY;
    state.lastX = e.clientX;
    state.lastY = e.clientY;
    /* translate gizmo: drag selected component on ground plane */
    if (state.dragBtn === 0 && state.gizmo === 'move' && state.selectedId && !e.shiftKey) {
      var eyeM = eyeFromOrbit();
      var aspectM = state.canvas.width / Math.max(1, state.canvas.height);
      var hitM = rayGround(e.clientX, e.clientY, state.canvas, eyeM, state.target, state.fov, aspectM);
      if (hitM) {
        var entM = null;
        state.entities.forEach(function (en) { if (en && en.id === state.selectedId) entM = en; });
        if (entM) {
          if (!entM.pos) entM.pos = { x:0, y:0, z:0 };
          entM.pos.x = Math.round(hitM.x * 10) / 10;
          entM.pos.z = Math.round(hitM.z * 10) / 10;
          if (state.onMove) state.onMove(entM, entM.pos);
          if (state.onChange) state.onChange(entM);
        }
      }
      return;
    }
    if (state.dragBtn === 2 || (state.dragBtn === 0 && e.shiftKey) || state.mode === 'navigate' && e.buttons === 2) {
      panLocal(-dx * 0.04, -dy * 0.04);
    } else if (state.dragBtn === 0 && state.mode === 'navigate') {
      state.yaw -= dx * 0.007;
      state.pitch = clamp(state.pitch + dy * 0.005, deg(8), deg(85));
    }
  }
  function onPointerUp(e) {
    if (!state) return;
    var wasDrag = state.dragging;
    state.dragging = false;
    if (state.mode === 'navigate') state.canvas.style.cursor = 'grab';
    if (!wasDrag) return;
    // click (small move) for place/select
    var moved = Math.hypot(e.clientX - state.lastX, e.clientY - state.lastY);
    // lastX updated during move — use a threshold via detail: track start separately
  }
  // better click tracking
  var _downX = 0, _downY = 0;
  function onPointerDown2(e) {
    _downX = e.clientX; _downY = e.clientY;
    onPointerDown(e);
    try { state.canvas.setPointerCapture(e.pointerId); } catch (_c) {}
  }
  function onPointerUp2(e) {
    if (!state) return;
    state.dragging = false;
    if (state.mode === 'navigate') state.canvas.style.cursor = 'grab';
    var dist = Math.hypot(e.clientX - _downX, e.clientY - _downY);
    if (dist > 6) return;
    if (e.button !== 0) return;
    if (state.mode === 'place') {
      var eye = eyeFromOrbit();
      var aspect = state.canvas.width / Math.max(1, state.canvas.height);
      var hit = rayGround(e.clientX, e.clientY, state.canvas, eye, state.target, state.fov, aspect);
      if (hit && state.onPlace) state.onPlace(hit);
    } else if (state.mode === 'select' || state.gizmo === 'move') {
      var ent = pickEntity(e.clientX, e.clientY);
      state.selectedId = ent ? ent.id : state.selectedId;
      if (ent && state.onSelect) state.onSelect(ent);
      else if (!ent && state.mode === 'select' && state.onSelect) state.onSelect(null);
    }
  }
  function onWheel(e) {
    if (!state) return;
    e.preventDefault();
    var f = e.deltaY > 0 ? 1.08 : 0.92;
    state.dist = clamp(state.dist * f, 4, 120);
  }
  function onContext(e) { e.preventDefault(); }
  function onKeyDown(e) {
    if (!state) return;
    state.keys[e.code] = true;
  }
  function onKeyUp(e) {
    if (!state) return;
    state.keys[e.code] = false;
  }
  function onResize() { resize(); }

  function bindEvents() {
    var c = state.canvas;
    c.addEventListener('pointerdown', onPointerDown2);
    c.addEventListener('pointermove', onPointerMove);
    c.addEventListener('pointerup', onPointerUp2);
    c.addEventListener('pointercancel', onPointerUp2);
    c.addEventListener('wheel', onWheel, { passive: false });
    c.addEventListener('contextmenu', onContext);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('resize', onResize);
    setMode(state.mode);
  }
  function unbindEvents() {
    if (!state) return;
    var c = state.canvas;
    c.removeEventListener('pointerdown', onPointerDown2);
    c.removeEventListener('pointermove', onPointerMove);
    c.removeEventListener('pointerup', onPointerUp2);
    c.removeEventListener('pointercancel', onPointerUp2);
    c.removeEventListener('wheel', onWheel);
    c.removeEventListener('contextmenu', onContext);
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('resize', onResize);
  }

  function setGizmo(g) {
    if (!state) return;
    state.gizmo = g || null;
    if (g === 'move') {
      state.mode = 'select';
      state.canvas.style.cursor = 'move';
    }
  }
  function setMeasureLabel(lab) {
    if (!state) return;
    state.measureLabel = lab || null;
    state.measureLive = lab || null;
  }
  function fitGridToEntities() {
    if (!state) return;
    var b = worldBounds(state.entities);
    var half = Math.max(4, Math.ceil(b.size * 0.75 + 2));
    setGridSize(half);
    state.target = [b.center[0], 0, b.center[2]];
    state.dist = clamp(b.size * 2.2 + 8, 6, 120);
    return b;
  }
  var api = {
    mount: mount,
    unmount: unmount,
    setEntities: setEntities,
    getEntities: getEntities,
    setMode: setMode,
    setSelectedId: setSelectedId,
    setGridSize: setGridSize,
    setShowAxes: setShowAxes,
    getCamera: getCamera,
    setCamera: setCamera,
    setGizmo: setGizmo,
    setMeasureLabel: setMeasureLabel,
    fitGridToEntities: fitGridToEntities,
    worldBounds: function () { return state ? worldBounds(state.entities) : null; },
    getSelectedId: function () { return state ? state.selectedId : null; },
    getGizmo: function () { return state ? state.gizmo : null; },
    isMounted: function () { return !!state; }
  };

  global.ModelTools3D = api;
})(typeof window !== 'undefined' ? window : this);
