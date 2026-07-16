(function () {
  'use strict';

  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  // ---------------------------------------------------------------
  // Device / preference detection for performance
  // ---------------------------------------------------------------
  const isMobile =
    window.matchMedia('(max-width: 768px)').matches ||
    /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  const reduceMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  // Fewer noise octaves + lower resolution on phones = big GPU savings
  const OCTAVES = isMobile ? 3 : 5;
  const DPR_CAP = isMobile ? 1.0 : 1.5;
  // Throttle mobile to ~30fps to halve GPU work / battery drain
  const FRAME_INTERVAL = isMobile ? 1000 / 30 : 0;

  const gl =
    canvas.getContext('webgl', { antialias: !isMobile, alpha: false }) ||
    canvas.getContext('experimental-webgl', { antialias: false, alpha: false });

  // ---------------------------------------------------------------
  // Fallback: if WebGL is unavailable, paint a static dark gradient
  // ---------------------------------------------------------------
  if (!gl) {
    const ctx = canvas.getContext('2d');
    function fallbackResize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const g = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      g.addColorStop(0, '#0a1330');
      g.addColorStop(1, '#0d0d1a');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    window.addEventListener('resize', fallbackResize);
    fallbackResize();
    return;
  }

  // ---------------------------------------------------------------
  // Shaders
  // ---------------------------------------------------------------
  const vertexSrc = `
    attribute vec2 a_position;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  // Flowing aurora / gradient-mesh via fractal Brownian motion (fbm).
  // OCTAVES is injected at compile time so phones do less work.
  const fragmentSrc = `
    precision highp float;

    uniform vec2  u_resolution;
    uniform float u_time;

    vec2 hash(vec2 p) {
      p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
      return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
    }

    float noise(vec2 p) {
      const float K1 = 0.366025404;
      const float K2 = 0.211324865;
      vec2 i = floor(p + (p.x + p.y) * K1);
      vec2 a = p - i + (i.x + i.y) * K2;
      float m = step(a.y, a.x);
      vec2 o = vec2(m, 1.0 - m);
      vec2 b = a - o + K2;
      vec2 c = a - 1.0 + 2.0 * K2;
      vec3 h = max(0.5 - vec3(dot(a, a), dot(b, b), dot(c, c)), 0.0);
      vec3 n = h * h * h * h * vec3(
        dot(a, hash(i + 0.0)),
        dot(b, hash(i + o)),
        dot(c, hash(i + 1.0))
      );
      return dot(n, vec3(70.0));
    }

    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      mat2 rot = mat2(1.6, 1.2, -1.2, 1.6);
      for (int i = 0; i < ${OCTAVES}; i++) {
        v += a * noise(p);
        p = rot * p;
        a *= 0.5;
      }
      return v;
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution.xy;
      vec2 p = uv;
      p.x *= u_resolution.x / u_resolution.y;

      float t = u_time * 0.06;

      vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3 - t)));
      vec2 r = vec2(
        fbm(p + 1.4 * q + vec2(1.7, 9.2) + 0.15 * t),
        fbm(p + 1.4 * q + vec2(8.3, 2.8) - 0.12 * t)
      );
      float f = fbm(p + 1.8 * r);

      vec3 cBase   = vec3(0.035, 0.055, 0.13);
      vec3 cMid    = vec3(0.10,  0.22,  0.60);
      vec3 cHi     = vec3(0.25,  0.55,  1.0);
      vec3 cAccent = vec3(0.00,  0.75,  0.78);

      vec3 col = cBase;
      col = mix(col, cMid,    clamp(f * f * 2.2, 0.0, 1.0));
      col = mix(col, cHi,     clamp(length(q) * 0.9, 0.0, 1.0));
      col = mix(col, cAccent, clamp(r.x * 0.45, 0.0, 0.55));

      float vig = smoothstep(1.25, 0.25, length(uv - 0.5));
      col *= 0.55 + 0.45 * vig;

      float grain = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
      col += (grain - 0.5) * 0.02;

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.log('[v0] shader compile error:', gl.getShaderInfoLog(s));
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  const vs = compile(gl.VERTEX_SHADER, vertexSrc);
  const fs = compile(gl.FRAGMENT_SHADER, fragmentSrc);
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.log('[v0] program link error:', gl.getProgramInfoLog(program));
    return;
  }
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW
  );
  const posLoc = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  const uResolution = gl.getUniformLocation(program, 'u_resolution');
  const uTime = gl.getUniformLocation(program, 'u_time');

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    const w = Math.floor(window.innerWidth * dpr);
    const h = Math.floor(window.innerHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  window.addEventListener('resize', resize);
  resize();

  function drawFrame(timeSeconds) {
    gl.uniform2f(uResolution, canvas.width, canvas.height);
    gl.uniform1f(uTime, timeSeconds);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  // ---------------------------------------------------------------
  // Reduced motion: draw a single static frame, then stop.
  // ---------------------------------------------------------------
  if (reduceMotion) {
    drawFrame(12.0); // a pleasing static "moment" in the animation
    return;
  }

  // ---------------------------------------------------------------
  // Animation loop with:
  //  - pause when tab/page is hidden (saves battery + CPU/GPU)
  //  - optional frame throttling on mobile (~30fps)
  // ---------------------------------------------------------------
  const start = performance.now();
  let last = 0;
  let running = true;
  let rafId = null;

  function render(now) {
    if (!running) return;
    rafId = requestAnimationFrame(render);

    if (FRAME_INTERVAL > 0 && now - last < FRAME_INTERVAL) return;
    last = now;

    resize();
    drawFrame((now - start) / 1000);
  }

  function play() {
    if (running) return;
    running = true;
    last = 0;
    rafId = requestAnimationFrame(render);
  }

  function pause() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pause();
    else play();
  });

  rafId = requestAnimationFrame(render);
})();
