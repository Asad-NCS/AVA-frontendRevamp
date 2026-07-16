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

  /* ----------------------------------------------------------------
     TUBE RENDERER
     Draws a thick bezier path as a 3D-looking tube/pipe by layering:
       1. Outer glow  (wide, dark, alpha ~0.18)
       2. Shadow band (dark navy, simulates underside)
       3. Core sweep  (bright blue, simulates top highlight)
       4. Specular    (near-white thin line, simulates gloss reflection)
  ---------------------------------------------------------------- */
  function drawTube(pts, radius, time, phaseOffset) {
    const R = radius;
    const wobble = 0.92 + Math.sin(time * 0.4 + phaseOffset) * 0.08;
    const r = R * wobble;

    // Build the bezier path through the control points
    function makePath() {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length - 2; i++) {
        const mx = (pts[i].x + pts[i + 1].x) / 2;
        const my = (pts[i].y + pts[i + 1].y) / 2;
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
      }
      const l = pts.length;
      ctx.quadraticCurveTo(pts[l - 2].x, pts[l - 2].y, pts[l - 1].x, pts[l - 1].y);
    }

    // 1. Outer glow — soft halo
    ctx.save();
    makePath();
    ctx.lineWidth = r * 3.2;
    ctx.strokeStyle = 'rgba(30, 50, 220, 0.12)';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();

    // 2. Dark shadow band (bottom half of tube)
    ctx.save();
    makePath();
    ctx.lineWidth = r * 1.85;
    ctx.strokeStyle = 'rgba(5, 8, 60, 0.88)';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();

    // 3. Core tube — vibrant blue
    ctx.save();
    makePath();
    ctx.lineWidth = r * 1.55;
    ctx.strokeStyle = 'rgba(40, 80, 240, 0.95)';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();

    // 4. Mid-tone layer — electric blue
    ctx.save();
    makePath();
    ctx.lineWidth = r * 1.0;
    ctx.strokeStyle = 'rgba(80, 130, 255, 0.70)';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();

    // 5. Specular highlight — narrow bright streak on top
    ctx.save();
    makePath();
    ctx.lineWidth = r * 0.28;
    ctx.strokeStyle = 'rgba(180, 210, 255, 0.55)';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  }

  /* ----------------------------------------------------------------
     TWO TUBES — one primary S-curve, one secondary smaller arc.
     Control points are animated slowly so the snake drifts.
  ---------------------------------------------------------------- */
  function getPrimary(time) {
    // S-curve: enters top-right, sweeps down through centre, exits bottom-left
    const drift = Math.sin(time * 0.18) * 0.06;
    return [
      { x: W * (1.05 + drift),          y: H * (-0.05) },
      { x: W * (0.80 + drift * 0.5),    y: H * 0.18 },
      { x: W * (0.62 + Math.sin(time * 0.22) * 0.04), y: H * 0.34 },
      { x: W * (0.50 + Math.cos(time * 0.19) * 0.05), y: H * 0.50 },
      { x: W * (0.36 + Math.sin(time * 0.21) * 0.04), y: H * 0.66 },
      { x: W * (0.18 - drift * 0.5),    y: H * 0.82 },
      { x: W * (-0.08 - drift),          y: H * 1.04 },
    ];
  }

  function getSecondary(time) {
    // A second tube — top-left to right, offset in time phase
    const drift = Math.cos(time * 0.14) * 0.05;
    return [
      { x: W * (1.08),                   y: H * (0.55 + drift) },
      { x: W * (0.82),                   y: H * (0.44 + Math.sin(time * 0.17) * 0.04) },
      { x: W * (0.60),                   y: H * (0.60 + drift * 0.6) },
      { x: W * (0.38),                   y: H * (0.72 + Math.cos(time * 0.20) * 0.04) },
      { x: W * (0.15),                   y: H * (0.62 + drift) },
      { x: W * (-0.06),                  y: H * (0.50 + drift * 0.5) },
    ];
  }

  function draw() {
    // Near-black background — matches reference site's #0d0d0d
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(0, 0, W, H);

    const radius = Math.min(W, H) * 0.072;

    // Secondary tube behind primary (thinner)
    drawTube(getSecondary(t), radius * 0.62, t, 2.4);

    // Primary dominant S-curve
    drawTube(getPrimary(t), radius, t, 0.0);

    t += 0.005;
    requestAnimationFrame(draw);
  }

  draw();
})();
