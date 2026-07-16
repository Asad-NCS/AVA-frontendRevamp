// Animated Gradient Mesh Background
// Premium animation inspired by user's wave reference, but more sophisticated

class GradientMeshBackground {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.time = 0;
    this.particles = [];
    this.gradients = [];

    this.resizeCanvas();
    this.initParticles();
    this.animate();

    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  initParticles() {
    // Create gradient control points that will animate
    const count = 5;
    this.gradients = [];

    for (let i = 0; i < count; i++) {
      this.gradients.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        color: this.getGradientColor(i / count),
        radius: 200 + Math.random() * 300,
      });
    }
  }

  getGradientColor(t) {
    // Purple → Blue → Teal color palette
    const colors = [
      'rgba(157, 78, 221, 0.3)',    // Purple #9d4edd
      'rgba(58, 134, 255, 0.3)',    // Blue #3a86ff
      'rgba(0, 200, 200, 0.3)',     // Teal #00c8c8
      'rgba(100, 50, 200, 0.25)',   // Dark purple
      'rgba(80, 180, 220, 0.25)',   // Light blue
    ];
    const index = Math.floor(t * colors.length) % colors.length;
    return colors[index];
  }

  drawBlurredGradient(x, y, radius, color) {
    // Create a radial gradient for smooth blending
    const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius);

    // Parse the color to get the RGB values and vary the alpha
    gradient.addColorStop(0, color.replace('0.3', '0.6'));
    gradient.addColorStop(0.5, color.replace('0.3', '0.2'));
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  animate = () => {
    // Clear canvas
    this.ctx.fillStyle = '#0a0a0f';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Update gradient positions
    this.gradients.forEach((grad) => {
      grad.x += grad.vx;
      grad.y += grad.vy;

      // Bounce off edges
      if (grad.x < 0 || grad.x > this.width) grad.vx *= -1;
      if (grad.y < 0 || grad.y > this.height) grad.vy *= -1;

      // Clamp to bounds
      grad.x = Math.max(0, Math.min(this.width, grad.x));
      grad.y = Math.max(0, Math.min(this.height, grad.y));
    });

    // Draw gradients with blending
    this.ctx.globalCompositeOperation = 'lighter';
    this.gradients.forEach((grad) => {
      this.drawBlurredGradient(grad.x, grad.y, grad.radius, grad.color);
    });

    // Reset composite operation
    this.ctx.globalCompositeOperation = 'source-over';

    // Add subtle noise overlay for texture
    this.addNoiseOverlay();

    this.time += 0.0005;
    requestAnimationFrame(this.animate);
  };

  addNoiseOverlay() {
    // Add subtle noise for texture
    const imageData = this.ctx.getImageData(0, 0, this.width, this.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 5;
      data[i] += noise;     // R
      data[i + 1] += noise; // G
      data[i + 2] += noise; // B
      // data[i + 3] is alpha, leave it alone
    }

    this.ctx.putImageData(imageData, 0, 0);
  }
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new GradientMeshBackground('bg-canvas');
  });
} else {
  new GradientMeshBackground('bg-canvas');
}
