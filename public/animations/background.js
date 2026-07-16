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
     Draws a thick bezier path as a 3D-looking glowing tube by layering
     5 strokes from wide→narrow:
       1. Outer glow  — wide, dark blue, very transparent
       2. Shadow band — dark navy, simulates cylinder underside
       3. Core        — bright royal blue, the dominant color
       4. Mid tone    — lighter electric blue
       5. Specular    — thin near-white streak, simulates gloss
  ---------------------------------------------------------------- */
  function drawTube(pts, radius, phaseOffset) {
    const wobble = 0.94 + Math.sin(t * 0.38 + phaseOffset) * 0.06;
    const r = radius * wobble;

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

    // 1. Outer glow
    ctx.save();
    makePath();
    ctx.lineWidth = r * 3.4;
    ctx.strokeStyle = 'rgba(30, 55, 230, 0.11)';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();

    // 2. Dark shadow band
    ctx.save();
    makePath();
    ctx.lineWidth = r * 1.9;
    ctx.strokeStyle = 'rgba(4, 6, 55, 0.92)';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();

    // 3. Core — vibrant royal blue
    ctx.save();
    makePath();
    ctx.lineWidth = r * 1.55;
    ctx.strokeStyle = 'rgba(35, 75, 245, 0.97)';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();

    // 4. Mid highlight — lighter electric blue
    ctx.save();
    makePath();
    ctx.lineWidth = r * 0.95;
    ctx.strokeStyle = 'rgba(80, 130, 255, 0.72)';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();

    // 5. Specular streak
    ctx.save();
    makePath();
    ctx.lineWidth = r * 0.26;
    ctx.strokeStyle = 'rgba(190, 215, 255, 0.50)';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  }

  /* ----------------------------------------------------------------
     CONTROL POINTS — animated slowly so the tubes drift organically.
     Primary:   dominant S-curve, top-right → bottom-left.
     Secondary: smaller arc, right-mid → left-mid, opposite phase.
  ---------------------------------------------------------------- */
  function getPrimary() {
    const d  = Math.sin(t * 0.17) * 0.055;
    const d2 = Math.cos(t * 0.21) * 0.045;
    return [
      { x: W * (1.06 + d),                          y: H * -0.04 },
      { x: W * (0.82 + d * 0.5),                    y: H *  0.16 },
      { x: W * (0.64 + d2),                          y: H *  0.32 },
      { x: W * (0.50 + Math.cos(t * 0.19) * 0.04),  y: H *  0.50 },
      { x: W * (0.36 - d2),                          y: H *  0.68 },
      { x: W * (0.18 - d * 0.5),                     y: H *  0.84 },
      { x: W * (-0.06 - d),                          y: H *  1.04 },
    ];
  }

  function getSecondary() {
    const d  = Math.cos(t * 0.13) * 0.05;
    const d2 = Math.sin(t * 0.18) * 0.04;
    return [
      { x: W *  1.08,  y: H * (0.52 + d) },
      { x: W *  0.80,  y: H * (0.42 + d2) },
      { x: W *  0.60,  y: H * (0.58 + d * 0.7) },
      { x: W *  0.40,  y: H * (0.70 + d2) },
      { x: W *  0.18,  y: H * (0.60 + d) },
      { x: W * -0.06,  y: H * (0.48 + d * 0.5) },
    ];
  }

  /* ----------------------------------------------------------------
     RENDER LOOP
     No getImageData, no per-pixel ops — stays at 60fps.
  ---------------------------------------------------------------- */
  function draw() {
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(0, 0, W, H);

    const radius = Math.min(W, H) * 0.074;

    // Secondary behind primary (thinner)
    drawTube(getSecondary(), radius * 0.62, 2.5);

    // Primary S-curve — the dominant design element
    drawTube(getPrimary(), radius, 0.0);

    t += 0.005;
    requestAnimationFrame(draw);
  }

  draw();
})();
