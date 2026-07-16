(function () {
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

  // Wave lines — inspired by the user's reference image
  const LINES = 18;
  const COLORS = [
    '138, 43, 226',   // blueviolet
    '80,  0, 200',    // deep purple
    '0,  120, 255',   // blue
    '100, 60, 240',   // medium purple
    '0,  180, 220',   // teal
  ];

  function wave(x, i, time) {
    const freq  = 0.0018 + i * 0.0003;
    const amp   = 55 + i * 10;
    const speed = 0.4 + i * 0.07;
    const phase = (i * Math.PI * 2) / LINES;
    return Math.sin(x * freq + time * speed + phase) * amp
         + Math.sin(x * freq * 2.1 + time * speed * 0.7 + phase) * (amp * 0.4);
  }

  function draw() {
    // Dark base
    ctx.fillStyle = '#07071a';
    ctx.fillRect(0, 0, W, H);

    const midY = H * 0.5;

    for (let i = 0; i < LINES; i++) {
      const colorIdx = i % COLORS.length;
      const alpha    = 0.18 + (i / LINES) * 0.22;
      const lineW    = 1.2 + (i % 4) * 0.5;

      ctx.beginPath();
      ctx.strokeStyle = `rgba(${COLORS[colorIdx]}, ${alpha.toFixed(2)})`;
      ctx.lineWidth   = lineW;
      ctx.shadowColor = `rgba(${COLORS[colorIdx]}, 0.4)`;
      ctx.shadowBlur  = 8 + i * 1.5;

      for (let x = 0; x <= W; x += 3) {
        const y = midY + wave(x, i, t) + (i - LINES / 2) * 18;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
    t += 0.012;
    requestAnimationFrame(draw);
  }

  draw();
})();
