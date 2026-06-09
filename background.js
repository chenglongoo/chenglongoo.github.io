(() => {
  const canvas = document.getElementById("signal-canvas");
  if (!canvas) return;

  const context = canvas.getContext("2d");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let particles = [];
  let animationFrame = 0;

  function createParticles() {
    const count = Math.min(44, Math.max(18, Math.floor(window.innerWidth / 32)));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.14,
      vy: (Math.random() - 0.5) * 0.14
    }));
  }

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * ratio;
    canvas.height = window.innerHeight * ratio;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    createParticles();
    draw(true);
  }

  function draw(staticFrame = false) {
    context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    context.lineWidth = 1;

    particles.forEach((point, index) => {
      if (!staticFrame) {
        point.x += point.vx;
        point.y += point.vy;
        if (point.x < 0 || point.x > window.innerWidth) point.vx *= -1;
        if (point.y < 0 || point.y > window.innerHeight) point.vy *= -1;
      }

      context.beginPath();
      context.arc(point.x, point.y, 1.3, 0, Math.PI * 2);
      context.fillStyle = "rgba(44, 120, 130, 0.28)";
      context.fill();

      for (let next = index + 1; next < particles.length; next += 1) {
        const other = particles[next];
        const distance = Math.hypot(point.x - other.x, point.y - other.y);
        if (distance < 120) {
          context.beginPath();
          context.moveTo(point.x, point.y);
          context.lineTo(other.x, other.y);
          context.strokeStyle = `rgba(31, 90, 106, ${0.075 - distance / 1800})`;
          context.stroke();
        }
      }
    });

    if (!staticFrame && !document.hidden && !reducedMotion.matches) {
      animationFrame = window.requestAnimationFrame(() => draw(false));
    }
  }

  function syncAnimation() {
    window.cancelAnimationFrame(animationFrame);
    if (document.hidden || reducedMotion.matches) {
      draw(true);
      return;
    }
    draw(false);
  }

  resize();
  syncAnimation();
  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", syncAnimation);
  reducedMotion.addEventListener("change", syncAnimation);
})();
