const particles = [];
const stars = [];
let flashAlpha = 0;

class Particle {
  constructor(x, y, vx, vy, color, life, size) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.life = life;
    this.maxLife = life;
    this.size = size;
  }
}

export function initStars(w, h) {
  stars.length = 0;
  for (let i = 0; i < 60; i++) {
    stars.push({
      x: Math.random() * w,
      y: Math.random() * h,
      size: Math.random() * 2 + 0.5,
      speed: Math.random() * 15 + 5,
      alpha: Math.random() * 0.5 + 0.2
    });
  }
}

export function emitBlockBreak(x, y, color, count) {
  const n = count || 12;
  for (let i = 0; i < n; i++) {
    const angle = (Math.PI * 2 / n) * i + Math.random() * 0.5;
    const speed = Math.random() * 200 + 80;
    particles.push(new Particle(
      x, y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      color,
      Math.random() * 0.4 + 0.3,
      Math.random() * 4 + 2
    ));
  }
}

export function emitPowerUpCollect(x, y) {
  for (let i = 0; i < 20; i++) {
    const angle = (Math.PI * 2 / 20) * i;
    const speed = Math.random() * 150 + 50;
    particles.push(new Particle(
      x, y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      '#ffffff',
      Math.random() * 0.3 + 0.2,
      Math.random() * 3 + 2
    ));
  }
}

export function triggerFlash() {
  flashAlpha = 0.4;
}

export function updateParticles(dt, w, h) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 200 * dt;
    p.life -= dt;
    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }

  for (let i = 0; i < stars.length; i++) {
    const s = stars[i];
    s.y += s.speed * dt;
    if (s.y > h) {
      s.y = -2;
      s.x = Math.random() * w;
    }
  }

  if (flashAlpha > 0) {
    flashAlpha -= dt * 2;
    if (flashAlpha < 0) flashAlpha = 0;
  }
}

export function drawStars(ctx, w, h) {
  for (let i = 0; i < stars.length; i++) {
    const s = stars[i];
    ctx.globalAlpha = s.alpha;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function drawParticles(ctx) {
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const alpha = p.life / p.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

export function drawFlash(ctx, w, h) {
  if (flashAlpha > 0) {
    ctx.globalAlpha = flashAlpha;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1;
  }
}
