(function () {
  'use strict';

  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H, t = 0;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  /* ------------------------------------------------------------------
     BLOBS — thick organic closed-curve shapes that drift slowly.
     Inspired by adventures.studio's bold swooping blue/indigo shapes.
  ------------------------------------------------------------------ */
  const blobs = [
    {
      // Large primary sweep — deep royal blue, upper-right
      color: '25, 75, 210',
      alphaCore: 0.72,
      scaleW: 1.05,
      scaleH: 0.72,
      originX: 0.52,
      originY: 0.18,
      driftAmpX: 0.10,
      driftAmpY: 0.08,
      driftSpeedX: 0.065,
      driftSpeedY: 0.048,
      phaseX: 0.0,
      phaseY: 0.6,
      breathSpeed: 0.22,
    },
    {
      // Wide indigo sweep — lower-left, overlaps primary
      color: '50, 15, 175',
      alphaCore: 0.62,
      scaleW: 0.98,
      scaleH: 0.62,
      originX: -0.02,
      originY: 0.54,
      driftAmpX: 0.08,
      driftAmpY: 0.07,
      driftSpeedX: 0.053,
      driftSpeedY: 0.041,
      phaseX: 1.8,
      phaseY: 3.2,
      breathSpeed: 0.19,
    },
    {
      // Teal-blue mid accent
      color: '0, 110, 200',
      alphaCore: 0.42,
      scaleW: 0.72,
      scaleH: 0.44,
      originX: 0.24,
      originY: 0.44,
      driftAmpX: 0.12,
      driftAmpY: 0.09,
      driftSpeedX: 0.082,
      driftSpeedY: 0.063,
      phaseX: 3.1,
      phaseY: 0.9,
      breathSpeed: 0.26,
    },
    {
      // Dark navy depth layer — fills shadow behind blobs
      color: '8, 20, 110',
      alphaCore: 0.85,
      scaleW: 1.35,
      scaleH: 0.85,
      originX: 0.22,
      originY: 0.05,
      driftAmpX: 0.05,
      driftAmpY: 0.04,
      driftSpeedX: 0.038,
      driftSpeedY: 0.029,
      phaseX: 5.0,
      phaseY: 1.4,
      breathSpeed: 0.14,
    },
  ];

  /* ------------------------------------------------------------------
     Draw one organic blob using 6 equidistant perturbed ellipse points
     connected with catmull-rom cubic beziers.
  ------------------------------------------------------------------ */
  function drawBlob(b, time) {
    const bW = W * b.scaleW;
    const bH = H * b.scaleH;

    const cx = W * b.originX + Math.sin(time * b.driftSpeedX + b.phaseX) * W * b.driftAmpX;
    const cy = H * b.originY + Math.cos(time * b.driftSpeedY + b.phaseY) * H * b.driftAmpY;

    const N = 6;
    const pts = [];

    for (let i = 0; i < N; i++) {
      const angle  = (i / N) * Math.PI * 2;
      const wobble = 1.0 + Math.sin(time * b.breathSpeed + i * 1.3) * 0.12;
      pts.push({
        x: cx + Math.cos(angle) * bW * 0.5 * wobble,
        y: cy + Math.sin(angle) * bH * 0.5 * wobble,
      });
    }

    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const p0 = pts[(i - 1 + N) % N];
      const p1 = pts[i];
      const p2 = pts[(i + 1) % N];
      const p3 = pts[(i + 2) % N];

      if (i === 0) ctx.moveTo(p1.x, p1.y);

      const tension = 0.4;
      const cp1x = p1.x + (p2.x - p0.x) * tension / 2;
      const cp1y = p1.y + (p2.y - p0.y) * tension / 2;
      const cp2x = p2.x - (p3.x - p1.x) * tension / 2;
      const cp2y = p2.y - (p3.y - p1.y) * tension / 2;

      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
    }
    ctx.closePath();

    const radius = Math.max(bW, bH) * 0.62;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    grad.addColorStop(0.0, 'rgba(' + b.color + ', ' + b.alphaCore + ')');
    grad.addColorStop(0.5, 'rgba(' + b.color + ', ' + (b.alphaCore * 0.45).toFixed(2) + ')');
    grad.addColorStop(1.0, 'rgba(' + b.color + ', 0)');

    ctx.fillStyle = grad;
    ctx.fill();
  }

  /* ------------------------------------------------------------------
     Render loop
  ------------------------------------------------------------------ */
  function draw() {
    ctx.fillStyle = '#06061a';
    ctx.fillRect(0, 0, W, H);

    // Back-to-front: navy depth → indigo base → teal accent → primary blue
    drawBlob(blobs[3], t);
    drawBlob(blobs[1], t);
    drawBlob(blobs[2], t);
    drawBlob(blobs[0], t);

    t += 0.007;
    requestAnimationFrame(draw);
  }

  draw();
})();
