/*!
 * Alaksa Wedding — scroll story (assets/js/story.js)
 *
 * One particle cloud morphs through four shapes while the visitor scrolls:
 *   0 camera lens with aperture blades
 *   1 two interlocked wedding rings with a diamond
 *   2 dotted globe facing Sulawesi, beacon on Makassar & Gowa
 *   3 Alaksa star emblem with the "ALAKSA" wordmark
 *
 * Plain WebGL, no libraries. The DOM overlay (AF reticle, city labels) is
 * pinned to the same 3D space through project(), so it follows the particles
 * while staying crisp HTML. No WebGL → the static star and the readable
 * chapters remain (class .no-gl on #story).
 *
 * Where to edit
 *   CFG       particle counts, timing, layout
 *   CHAPTERS  timeline names + camera readouts per chapter
 *   Chapter copy lives in index.html (#story).
 */
(function () {
  'use strict';

  var story = document.getElementById('story');
  if (!story) return;
  var canvas = document.getElementById('storyGl');
  var stage = story.querySelector('.story-stage');

  var isMobile = window.matchMedia('(max-width: 860px)').matches;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var CFG = {
    count: isMobile ? 6500 : 15000,
    fov: 35,
    camZ: 6,
    pointSize: isMobile ? 2.1 : 2.4,
    lerp: 0.075,            // how fast the morph follows the scroll
    sway: 0.22,             // idle yaw sway (radians)
    mouseTilt: 0.18
  };

  var CHAPTERS = [
    { name: 'INTRO',   iso: 'ISO 400', f: 'f/1.8' },
    { name: 'SESI',    iso: 'ISO 800', f: 'f/2.8' },
    { name: 'WILAYAH', iso: 'ISO 200', f: 'f/4.0' },
    { name: 'BOOKING', iso: 'ISO 100', f: 'f/1.4' }
  ];

  // Makassar faces the camera on the globe; Gowa sits just south-east of it.
  var CITY = { lat: -5.14, lon: 119.42 };

  var chapters = story.querySelectorAll('.chapter');
  var tlTc = document.getElementById('tlTc');
  var tlName = document.getElementById('tlName');
  var tlFill = document.getElementById('tlFill');
  var tlHead = document.getElementById('tlHead');
  var vfAf = document.getElementById('vfAf');
  var vfIso = document.getElementById('vfIso');
  var vfF = document.getElementById('vfF');
  var lbls = story.querySelectorAll('.vf-lbl');

  /* ------------------------------------------------------------------
     Shape generators — each returns Float32Array(count * 3)
     ------------------------------------------------------------------ */
  var N = CFG.count;
  var rnd = Math.random;
  var TAU = Math.PI * 2;

  function lens() {
    var out = new Float32Array(N * 3), i = 0;
    function put(x, y, z) { if (i < N) { out[i * 3] = x; out[i * 3 + 1] = y; out[i * 3 + 2] = z; i++; } }
    var R = 1.05, depth = 0.55;
    // barrel: rings along z
    var nb = Math.floor(N * 0.30);
    for (var k = 0; k < nb; k++) {
      var a = rnd() * TAU, ring = Math.floor(rnd() * 7) / 6;
      var z = -depth + ring * depth * 1.0 + (rnd() - 0.5) * 0.015;
      var r = R * (1 - ring * 0.08);
      put(Math.cos(a) * r, Math.sin(a) * r, z);
    }
    // knurled focus ring (short dashes)
    var nk = Math.floor(N * 0.10);
    for (k = 0; k < nk; k++) {
      var seg = Math.floor(rnd() * 72), aa = seg / 72 * TAU;
      var zz = -0.25 + rnd() * 0.22;
      put(Math.cos(aa) * (R + 0.04), Math.sin(aa) * (R + 0.04), zz);
    }
    // front rim
    var nr = Math.floor(N * 0.10);
    for (k = 0; k < nr; k++) {
      var b = rnd() * TAU, rr = 0.92 + rnd() * 0.12;
      put(Math.cos(b) * rr, Math.sin(b) * rr, 0.02);
    }
    // aperture blades: 6 edges from a hexagon opening, extended to the rim
    var r0 = 0.3, rimR = 0.9, blades = 6;
    var nbl = Math.floor(N * 0.30);
    for (k = 0; k < nbl; k++) {
      var j = Math.floor(rnd() * blades);
      var a0 = j / blades * TAU + 0.3, a1 = (j + 1) / blades * TAU + 0.3;
      var vx = Math.cos(a0) * r0, vy = Math.sin(a0) * r0;
      var dx = Math.cos(a1) * r0 - vx, dy = Math.sin(a1) * r0 - vy;
      var len = Math.hypot(dx, dy); dx /= len; dy /= len;
      // solve |v + t d| = rimR for t > 0
      var bq = vx * dx + vy * dy, cq = vx * vx + vy * vy - rimR * rimR;
      var tmax = -bq + Math.sqrt(bq * bq - cq);
      var t = rnd() * tmax;
      if (rnd() < 0.62) {
        put(vx + dx * t, vy + dy * t, 0.05);
      } else {
        // light fill on the blade surface (between this edge and the next blade)
        var s = rnd(), px = vx + dx * t, py = vy + dy * t;
        var ang = Math.atan2(py, px), pr = Math.hypot(px, py);
        var fr = pr + (rimR - pr) * s * 0.9;
        put(Math.cos(ang + s * 0.25) * fr, Math.sin(ang + s * 0.25) * fr, 0.05 + s * 0.02);
      }
    }
    // glass: sparse curved disc behind the blades
    while (i < N) {
      var g = Math.sqrt(rnd()) * 0.85, ga = rnd() * TAU;
      put(Math.cos(ga) * g, Math.sin(ga) * g, -0.15 - (0.85 - g) * 0.25);
    }
    return out;
  }

  function rings() {
    var out = new Float32Array(N * 3), i = 0;
    function put(x, y, z) { out[i * 3] = x; out[i * 3 + 1] = y; out[i * 3 + 2] = z; i++; }
    var R = 0.72, r = 0.075, off = 0.42;
    var nDiamond = Math.floor(N * 0.12);
    var nRing = Math.floor((N - nDiamond) / 2);
    // ring A: plane XY centred at -off
    for (var k = 0; k < nRing; k++) {
      var u = rnd() * TAU, v = rnd() * TAU;
      var cx = (R + r * Math.cos(v)) * Math.cos(u), cy = (R + r * Math.cos(v)) * Math.sin(u), cz = r * Math.sin(v);
      put(cx - off, cy, cz);
    }
    // ring B: plane XZ centred at +off (links through ring A)
    for (k = 0; k < nRing; k++) {
      u = rnd() * TAU; v = rnd() * TAU;
      cx = (R + r * Math.cos(v)) * Math.cos(u); cz = (R + r * Math.cos(v)) * Math.sin(u); cy = r * Math.sin(v);
      put(cx + off, cy, cz);
    }
    // diamond (octahedron edges + facets) sitting on top of ring A
    var D = [-off, R + 0.2, 0], s = 0.17;
    var V = [[0, s * 1.25, 0], [0, -s * 1.1, 0], [s, 0.05, 0], [-s, 0.05, 0], [0, 0.05, s], [0, 0.05, -s]];
    var E = [[0, 2], [0, 3], [0, 4], [0, 5], [1, 2], [1, 3], [1, 4], [1, 5], [2, 4], [4, 3], [3, 5], [5, 2]];
    while (i < N) {
      var e = E[Math.floor(rnd() * E.length)], t = rnd();
      var a = V[e[0]], b = V[e[1]];
      var j = rnd() < 0.7 ? 0 : 0.02;
      put(D[0] + a[0] + (b[0] - a[0]) * t + (rnd() - 0.5) * j,
          D[1] + a[1] + (b[1] - a[1]) * t + (rnd() - 0.5) * j,
          D[2] + a[2] + (b[2] - a[2]) * t + (rnd() - 0.5) * j);
    }
    // tilt the pair so both rings read in 3D
    rotateArr(out, 0.35, -0.5, 0.12);
    return out;
  }

  function sph(lat, lon, r) {
    // Makassar's longitude is moved to face the camera (+z)
    var la = lat * Math.PI / 180, lo = (lon - CITY.lon) * Math.PI / 180;
    return [Math.cos(la) * Math.sin(lo) * r, Math.sin(la) * r, Math.cos(la) * Math.cos(lo) * r];
  }

  function globe() {
    var out = new Float32Array(N * 3), i = 0, R = 1.05;
    function put(p) { out[i * 3] = p[0]; out[i * 3 + 1] = p[1]; out[i * 3 + 2] = p[2]; i++; }
    // Fibonacci dot sphere
    var nf = Math.floor(N * 0.62), ga = Math.PI * (3 - Math.sqrt(5));
    for (var k = 0; k < nf; k++) {
      var y = 1 - (k / (nf - 1)) * 2, rr = Math.sqrt(1 - y * y), th = ga * k;
      put([Math.cos(th) * rr * R, y * R, Math.sin(th) * rr * R]);
    }
    // latitude / longitude lines
    var nl = Math.floor(N * 0.18);
    for (k = 0; k < nl; k++) {
      if (rnd() < 0.5) put(sph(Math.round((rnd() * 2 - 1) * 4) * 18, rnd() * 360, R * 1.002));
      else put(sph(rnd() * 180 - 90, Math.round(rnd() * 12) * 30 + CITY.lon, R * 1.002));
    }
    // pulse rings around Makassar (flat on the surface)
    var nrng = Math.floor(N * 0.1);
    for (k = 0; k < nrng; k++) {
      var ringR = [1.5, 3.2, 5][Math.floor(rnd() * 3)], a = rnd() * TAU;
      put(sph(CITY.lat + Math.sin(a) * ringR, CITY.lon + Math.cos(a) * ringR, R * 1.004));
    }
    // beacon rising from the city
    while (i < N) {
      var h = Math.pow(rnd(), 1.6) * 0.75;
      var p = sph(CITY.lat, CITY.lon, R + h);
      var sp = 0.012 * (1 - h);
      put([p[0] + (rnd() - 0.5) * sp, p[1] + (rnd() - 0.5) * sp, p[2]]);
    }
    rotateArr(out, -0.28, 0.32, 0);
    return out;
  }
  var GLOBE_TILT = [-0.28, 0.32, 0];

  function emblem() {
    var W = 600, H = 640, c = document.createElement('canvas');
    c.width = W; c.height = H;
    var x = c.getContext('2d');
    x.fillStyle = '#fff'; x.strokeStyle = '#fff';
    // four-point star from the logo
    var cx = 300, cy = 255, Rs = 235, rs = 26;
    x.beginPath();
    for (var k = 0; k < 8; k++) {
      var a = k / 8 * TAU - Math.PI / 2, rr = k % 2 ? rs : Rs;
      x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
    }
    x.closePath(); x.fill();
    x.lineWidth = 3;
    x.beginPath(); x.arc(cx, cy, 150, 0, TAU); x.stroke();
    // wordmark
    x.font = '400 92px "Cormorant Garamond", Georgia, serif';
    x.textAlign = 'center'; x.textBaseline = 'middle';
    if ('letterSpacing' in x) { x.letterSpacing = '18px'; }
    x.fillText('ALAKSA', cx + 9, 575);
    var d = x.getImageData(0, 0, W, H).data, pts = [];
    for (var py = 0; py < H; py += 2) for (var px = 0; px < W; px += 2) if (d[(py * W + px) * 4 + 3] > 120) pts.push(px, py);
    var out = new Float32Array(N * 3), n = pts.length / 2, S = 2.3 / W;
    for (var i = 0; i < N; i++) {
      var j = Math.floor(rnd() * n) * 2;
      var ox = pts[j] + rnd() * 2, oy = pts[j + 1] + rnd() * 2;
      out[i * 3] = (ox - W / 2) * S;
      out[i * 3 + 1] = -(oy - H / 2) * S;
      out[i * 3 + 2] = (rnd() - 0.5) * 0.08 + (oy < 520 ? Math.max(0, 1 - Math.hypot(ox - cx, oy - cy) / Rs) * 0.25 : 0);
    }
    return out;
  }

  function rotateArr(arr, rx, ry, rz) {
    for (var i = 0; i < arr.length; i += 3) {
      var p = rot([arr[i], arr[i + 1], arr[i + 2]], rx, ry, rz);
      arr[i] = p[0]; arr[i + 1] = p[1]; arr[i + 2] = p[2];
    }
  }
  function rot(p, rx, ry, rz) {
    var x = p[0], y = p[1], z = p[2], c, s, t;
    c = Math.cos(rx); s = Math.sin(rx); t = y * c - z * s; z = y * s + z * c; y = t;
    c = Math.cos(ry); s = Math.sin(ry); t = x * c + z * s; z = -x * s + z * c; x = t;
    c = Math.cos(rz); s = Math.sin(rz); t = x * c - y * s; y = x * s + y * c; x = t;
    return [x, y, z];
  }

  /* ------------------------------------------------------------------
     WebGL
     ------------------------------------------------------------------ */
  var VS = [
    'precision highp float;',
    'attribute vec3 aP0; attribute vec3 aP1; attribute vec3 aP2; attribute vec3 aP3;',
    'attribute vec4 aR;',
    'uniform float uT; uniform float uTime; uniform float uSize; uniform float uScale; uniform float uDpr;',
    'uniform vec2 uOff; uniform vec2 uRot; uniform float uAspect; uniform float uFocal; uniform float uCamZ;',
    'varying float vA;',
    'vec3 pick(float k){ return k < .5 ? aP0 : k < 1.5 ? aP1 : k < 2.5 ? aP2 : aP3; }',
    'void main(){',
    '  float seg = clamp(floor(uT), 0., 2.);',
    '  float f = clamp(uT - seg, 0., 1.);',
    '  float d = aR.z * .35;',
    '  float g = smoothstep(0., 1., clamp((f - d) / .65, 0., 1.));',
    '  vec3 a = pick(seg), b = pick(seg + 1.);',
    '  vec3 p = mix(a, b, g);',
    '  float burst = sin(g * 3.14159);',
    '  vec3 dir = normalize(vec3(sin(aR.x * 91.7), cos(aR.x * 47.3), sin(aR.x * 13.1 + 1.)));',
    '  p += dir * burst * (.35 + aR.z * .6);',
    '  p += .012 * vec3(sin(uTime * .9 + aR.x * 40.), cos(uTime * .7 + aR.x * 30.), sin(uTime * .8 + aR.x * 20.));',
    '  float cy = cos(uRot.x), sy = sin(uRot.x), cx = cos(uRot.y), sx = sin(uRot.y);',
    '  p = vec3(p.x * cy + p.z * sy, p.y, -p.x * sy + p.z * cy);',
    '  p = vec3(p.x, p.y * cx - p.z * sx, p.y * sx + p.z * cx);',
    '  p = p * uScale + vec3(uOff, 0.);',
    '  float z = uCamZ - p.z;',
    '  gl_Position = vec4(p.x * uFocal / uAspect / z, p.y * uFocal / z, 0., 1.);',
    '  gl_PointSize = uSize * uDpr * aR.y * (uCamZ / z);',
    '  vA = aR.w * (.75 + .25 * sin(uTime * 2. + aR.x * 60.)) * (1. - burst * .35);',
    '}'
  ].join('\n');

  var FS = [
    'precision mediump float;',
    'uniform vec3 uColor; varying float vA;',
    'void main(){',
    '  vec2 c = gl_PointCoord - .5; float r = length(c);',
    '  float a = smoothstep(.5, .1, r) * vA;',
    '  if (a < .01) discard;',
    '  gl_FragColor = vec4(uColor, a);',
    '}'
  ].join('\n');

  var gl, prog, U = {}, shapes = null;
  var state = { t: 0, target: 0, time: 0, mx: 0, my: 0, smx: 0, smy: 0, visible: true, running: false, chapter: -1, p: 0 };
  var view = { w: 1, h: 1, dpr: 1, aspect: 1, focal: 1, scale: 1, off: [0, 0] };

  function fail() { story.classList.add('no-gl'); }

  function initGL() {
    try {
      gl = canvas.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: false, powerPreference: 'high-performance' });
    } catch (e) { gl = null; }
    if (!gl) return false;

    function sh(type, src) {
      var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; }
      return s;
    }
    var vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) return false;
    prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false;
    gl.useProgram(prog);

    ['aP0', 'aP1', 'aP2', 'aP3'].forEach(function (name, k) { buf(name, shapes[k], 3); });
    var R = new Float32Array(N * 4);
    for (var i = 0; i < N; i++) {
      var hot = rnd() < 0.09;
      R[i * 4] = rnd();
      R[i * 4 + 1] = hot ? 1.6 + rnd() * 0.8 : 0.7 + rnd() * 0.6;
      R[i * 4 + 2] = rnd();
      R[i * 4 + 3] = hot ? 0.95 : 0.3 + rnd() * 0.4;
    }
    buf('aR', R, 4);

    ['uT', 'uTime', 'uSize', 'uScale', 'uDpr', 'uOff', 'uRot', 'uAspect', 'uFocal', 'uCamZ', 'uColor'].forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);

    canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); state.running = false; fail(); });
    return true;
  }

  function buf(name, data, size) {
    var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, name); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
  }

  function resize() {
    var r = stage.getBoundingClientRect();
    view.dpr = Math.min(window.devicePixelRatio || 1, 2);
    view.w = r.width; view.h = r.height; view.aspect = r.width / r.height;
    canvas.width = Math.round(r.width * view.dpr); canvas.height = Math.round(r.height * view.dpr);
    if (gl) gl.viewport(0, 0, canvas.width, canvas.height);
    view.focal = 1 / Math.tan(CFG.fov * Math.PI / 360);
    // visible world size at z = 0
    var visH = 2 * CFG.camZ / view.focal, visW = visH * view.aspect;
    isMobile = view.w <= 860;
    if (isMobile) {
      view.scale = Math.min(1, (visW * 0.8) / 2.5);
      view.off = [0, visH * 0.24];
    } else {
      view.scale = Math.min(1.12, (visH * 0.62) / 2.3);
      view.off = [Math.min(visW * 0.22, 2.1), 0.05];
    }
  }

  // project a shape-space point to screen px (mirrors the vertex shader)
  function project(p) {
    var cy = Math.cos(state.yaw), sy = Math.sin(state.yaw), cx = Math.cos(state.pitch), sx = Math.sin(state.pitch);
    var x = p[0] * cy + p[2] * sy, y = p[1], z = -p[0] * sy + p[2] * cy;
    var y2 = y * cx - z * sx, z2 = y * sx + z * cx;
    x = x * view.scale + view.off[0]; y2 = y2 * view.scale + view.off[1]; z2 *= view.scale;
    var zz = CFG.camZ - z2;
    return { x: (x * view.focal / view.aspect / zz * 0.5 + 0.5) * view.w, y: (0.5 - y2 * view.focal / zz * 0.5) * view.h, front: z2 > -0.2 };
  }

  var cityPt = rot(sph(CITY.lat, CITY.lon, 1.05), GLOBE_TILT[0], GLOBE_TILT[1], GLOBE_TILT[2]);
  var AF_POINTS = [[0, 0, 0.05], null, cityPt, [0, 0.36, 0.2]];

  /* ------------------------------------------------------------------
     Scroll → progress, chapters, timeline
     ------------------------------------------------------------------ */
  function readScroll() {
    var r = story.getBoundingClientRect();
    var total = r.height - window.innerHeight;
    var p = Math.min(1, Math.max(0, -r.top / Math.max(1, total)));
    state.p = p;
    var s = p * 3, i = Math.min(2, Math.floor(s)), f = s - i;
    var hold = f < 0.3 ? 0 : f > 0.7 ? 1 : (f - 0.3) / 0.4;
    state.target = p >= 1 ? 3 : i + hold;
    var ch = Math.min(3, Math.round(s));
    if (ch !== state.chapter) setChapter(ch);
    // timeline
    tlFill.style.width = (p * 100) + '%';
    tlHead.style.left = (p * 100) + '%';
    var frames = Math.round(p * 32 * 24), ff = frames % 24, ss = Math.floor(frames / 24);
    tlTc.textContent = '00:00:' + pad(ss) + ':' + pad(ff);
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function setChapter(ch) {
    state.chapter = ch;
    for (var k = 0; k < chapters.length; k++) chapters[k].classList.toggle('is-on', k === ch);
    tlName.textContent = CHAPTERS[ch].name;
    vfIso.textContent = CHAPTERS[ch].iso;
    vfF.textContent = CHAPTERS[ch].f;
    if (vfAf) { vfAf.classList.remove('is-lock'); clearTimeout(setChapter.tm); setChapter.tm = setTimeout(function () { vfAf.classList.add('is-lock'); }, 700); }
  }

  /* ------------------------------------------------------------------
     Render loop
     ------------------------------------------------------------------ */
  var last = 0;
  function frame(now) {
    if (!state.running) return;
    requestAnimationFrame(frame);
    var dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
    if (!reduce) state.time += dt;
    state.t += (state.target - state.t) * (reduce ? 1 : CFG.lerp);
    state.smx += (state.mx - state.smx) * 0.05; state.smy += (state.my - state.smy) * 0.05;
    // idle sway + mouse tilt; the rings (chapter 1) swing a little wider
    var ringBoost = Math.max(0, 1 - Math.abs(state.t - 1) * 2);
    state.yaw = Math.sin(state.time * 0.25) * CFG.sway + Math.sin(state.time * 0.5) * 0.3 * ringBoost + state.smx * CFG.mouseTilt;
    state.pitch = state.smy * CFG.mouseTilt * 0.7;

    var light = document.documentElement.getAttribute('data-theme') === 'light';
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    if (light) gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); else gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.uniform1f(U.uT, state.t);
    gl.uniform1f(U.uTime, state.time);
    gl.uniform1f(U.uSize, CFG.pointSize);
    gl.uniform1f(U.uScale, view.scale);
    gl.uniform1f(U.uDpr, view.dpr);
    gl.uniform2f(U.uOff, view.off[0], view.off[1]);
    gl.uniform2f(U.uRot, state.yaw, state.pitch);
    gl.uniform1f(U.uAspect, view.aspect);
    gl.uniform1f(U.uFocal, view.focal);
    gl.uniform1f(U.uCamZ, CFG.camZ);
    if (light) gl.uniform3f(U.uColor, 0.06, 0.06, 0.06); else gl.uniform3f(U.uColor, 0.96, 0.95, 0.92);
    gl.drawArrays(gl.POINTS, 0, N);

    overlay();
  }

  function overlay() {
    var near = Math.abs(state.t - Math.round(state.t)) < 0.12;
    var k = Math.round(state.t);
    var pt = AF_POINTS[k];
    if (k === 1) pt = rot([-0.42, 0.92, 0], 0.35, -0.5, 0.12); // diamond
    if (vfAf) {
      if (near && pt) {
        var s = project(pt);
        vfAf.style.transform = 'translate(' + (s.x - vfAf.parentNode.offsetLeft) + 'px,' + (s.y - stageTop()) + 'px) translate(-50%,-50%)';
        vfAf.classList.add('is-on');
      } else vfAf.classList.remove('is-on');
    }
    var showCity = Math.abs(state.t - 2) < 0.15;
    if (showCity) {
      var c = project(cityPt);
      var base = stageTop();
      var left = vfAf.parentNode.offsetLeft;
      lbls[0].style.transform = 'translate(' + (c.x - left + 22) + 'px,' + (c.y - base - 34) + 'px)';
      lbls[1].style.transform = 'translate(' + (c.x - left + 34) + 'px,' + (c.y - base + 12) + 'px)';
    }
    lbls[0].classList.toggle('is-on', showCity);
    lbls[1].classList.toggle('is-on', showCity);
  }
  function stageTop() { return vfAf.parentNode.offsetTop; }

  function start() { if (!state.running && state.visible) { state.running = true; last = performance.now(); requestAnimationFrame(frame); } }
  function stop() { state.running = false; }

  /* ------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------ */
  function boot() {
    shapes = [lens(), rings(), globe(), emblem()];
    if (!initGL()) { fail(); return; }
    resize();
    readScroll();
    window.addEventListener('resize', function () { resize(); readScroll(); });
    window.addEventListener('scroll', readScroll, { passive: true });
    window.addEventListener('pointermove', function (e) {
      state.mx = (e.clientX / window.innerWidth) * 2 - 1;
      state.my = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        state.visible = en[0].isIntersecting;
        if (state.visible) start(); else stop();
      }).observe(story);
    }
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });
    start();
  }

  // chapters + timeline work even without WebGL
  setChapter(0);
  window.addEventListener('scroll', function () { if (!gl) readScroll(); }, { passive: true });

  var fontReady = document.fonts && document.fonts.load
    ? Promise.race([document.fonts.load('400 92px "Cormorant Garamond"'), new Promise(function (r) { setTimeout(r, 1500); })])
    : Promise.resolve();
  fontReady.then(boot, boot);
})();
