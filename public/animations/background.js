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

    // 1. Soft outer glow — TIGHT, not screen-filling
    ctx.save();
    makePath();
    ctx.lineWidth = r * 1.7;
    ctx.strokeStyle = 'rgba(90, 150, 255, 0.22)';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();

    // 2. Dark base of the tube (bottom shadow)
    ctx.save();
    makePath();
    ctx.lineWidth = r * 1.05;
    ctx.strokeStyle = 'rgba(20, 45, 120, 0.95)';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();

    // 3. Core tube — solid bright blue (the defined line)
    ctx.save();
    makePath();
    ctx.lineWidth = r * 0.85;
    ctx.strokeStyle = 'rgba(70, 130, 255, 1.0)';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();

    // 4. Top highlight — lighter blue, offset up for 3D roundness
    ctx.save();
    makePath();
    ctx.lineWidth = r * 0.42;
    ctx.strokeStyle = 'rgba(140, 195, 255, 0.95)';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();

    // 5. Specular streak — thin white gloss
    ctx.save();
    makePath();
    ctx.lineWidth = r * 0.14;
    ctx.strokeStyle = 'rgba(225, 240, 255, 0.9)';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  }

  function getPrimary() {
    const d  = Math.sin(t * 0.17) * 0.055;
    const d2 = Math.cos(t * 0.21) * 0.045;
    return [
      { x: W * (1.10 + d),                          y: H * -0.06 },
      { x: W * (0.84 + d * 0.5),                    y: H *  0.14 },
      { x: W * (0.66 + d2),                          y: H *  0.30 },
      { x: W * (0.52 + Math.cos(t * 0.19) * 0.04),  y: H *  0.48 },
      { x: W * (0.36 - d2),                          y: H *  0.66 },
      { x: W * (0.16 - d * 0.5),                     y: H *  0.84 },
      { x: W * (-0.10 - d),                          y: H *  1.06 },
    ];
  }

  function getSecondary() {
    const d  = Math.cos(t * 0.13) * 0.05;
    const d2 = Math.sin(t * 0.18) * 0.04;
    return [
      { x: W *  1.10,  y: H * (0.50 + d) },
      { x: W *  0.82,  y: H * (0.40 + d2) },
      { x: W *  0.60,  y: H * (0.56 + d * 0.7) },
      { x: W *  0.38,  y: H * (0.68 + d2) },
      { x: W *  0.16,  y: H * (0.58 + d) },
      { x: W * -0.10,  y: H * (0.46 + d * 0.5) },
    ];
  }

  function draw() {
    ctx.fillStyle = '#0d1427';
    ctx.fillRect(0, 0, W, H);

    // Thin, defined tube — radius much smaller than before
    const radius = Math.min(W, H) * 0.032;

    drawTube(getSecondary(), radius * 0.6, 2.5);
    drawTube(getPrimary(), radius, 0.0);

    t += 0.005;
    requestAnimationFrame(draw);
  }

  draw();
})();
