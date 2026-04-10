import { BLOCK_TYPE, POWERUP_TYPE } from './state.js';

let shakeIntensity = 0;
let shakeDuration = 0;
let shakeTimer = 0;
let shakeOffsetX = 0;
let shakeOffsetY = 0;

export function setShake(intensity, duration) {
  shakeIntensity = intensity;
  shakeDuration = duration;
  shakeTimer = duration;
}

export function updateShake(dt) {
  if (shakeTimer > 0) {
    shakeTimer -= dt;
    const ratio = shakeTimer / shakeDuration;
    const mag = shakeIntensity * ratio;
    shakeOffsetX = (Math.random() - 0.5) * 2 * mag;
    shakeOffsetY = (Math.random() - 0.5) * 2 * mag;
    if (shakeTimer <= 0) {
      shakeOffsetX = 0;
      shakeOffsetY = 0;
    }
  }
}

export function applyShake(ctx) {
  ctx.translate(shakeOffsetX, shakeOffsetY);
}

export function drawBackground(ctx, w, h) {
  ctx.fillStyle = '#0a0a2e';
  ctx.fillRect(-10, -10, w + 20, h + 20);
}

export function drawBlock(ctx, block) {
  const { x, y, w, h, color, type, hp, maxHp } = block;

  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = type === BLOCK_TYPE.ITEM ? 15 : 8;

  const radius = 4;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fillStyle = color;
  ctx.fill();

  ctx.shadowBlur = 0;

  if (type === BLOCK_TYPE.ITEM) {
    const time = performance.now() / 1000;
    const shimmer = Math.sin(time * 4 + x) * 0.3 + 0.3;
    ctx.globalAlpha = shimmer;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  if (type === BLOCK_TYPE.HARD && hp < maxHp) {
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.3, y);
    ctx.lineTo(x + w * 0.5, y + h * 0.5);
    ctx.lineTo(x + w * 0.7, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + w * 0.5, y + h * 0.5);
    ctx.lineTo(x + w * 0.4, y + h);
    ctx.stroke();
  }

  ctx.globalAlpha = 0.4;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(x + 2, y + 2, w - 4, h * 0.35, [radius, radius, 0, 0]);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.restore();
}

export function drawPaddle(ctx, paddle) {
  ctx.save();
  ctx.shadowColor = '#ffffff';
  ctx.shadowBlur = 12;

  const radius = paddle.h / 2;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(paddle.x, paddle.y, paddle.w, paddle.h, radius);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#aaddff';
  ctx.beginPath();
  ctx.roundRect(paddle.x + 3, paddle.y + 2, paddle.w - 6, paddle.h * 0.4, [radius, radius, 0, 0]);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.restore();
}

export function drawBall(ctx, ball) {
  for (let i = 0; i < ball.trail.length; i++) {
    const t = ball.trail[i];
    const alpha = (i / ball.trail.length) * 0.3;
    const size = ball.r * (i / ball.trail.length) * 0.8;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#aaccff';
    ctx.beginPath();
    ctx.arc(t.x, t.y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.save();
  ctx.shadowColor = '#ffffff';
  ctx.shadowBlur = 15;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.globalAlpha = 0.5;
  ctx.fillStyle = '#ccddff';
  ctx.beginPath();
  ctx.arc(ball.x - ball.r * 0.2, ball.y - ball.r * 0.2, ball.r * 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.restore();
}

export function drawPowerUp(ctx, pu) {
  const colors = ['#06d6a0', '#ff3e6c', '#118ab2'];
  const labels = ['W', 'M', 'S'];
  const color = colors[pu.type];
  const label = labels[pu.type];
  const size = pu.size || 14;

  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(pu.x, pu.y, size, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${size}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, pu.x, pu.y + 1);

  ctx.restore();
}

export function drawHUD(ctx, game) {
  const w = game.width;
  const fontSize = Math.max(w * 0.04, 14);

  ctx.save();
  ctx.shadowBlur = 0;

  ctx.font = `bold ${fontSize}px Arial`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(`SCORE: ${game.score}`, 10, 10);

  ctx.textAlign = 'right';
  let livesText = '';
  for (let i = 0; i < game.lives; i++) livesText += '\u2665 ';
  ctx.fillStyle = '#ff3e6c';
  ctx.fillText(livesText.trim(), w - 10, 10);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffe74c';
  ctx.fillText(`STAGE ${game.stage}`, w / 2, 10);

  if (game.combo >= 2) {
    const comboSize = fontSize * 0.8;
    ctx.font = `bold ${comboSize}px Arial`;
    ctx.fillStyle = '#ffe74c';
    ctx.globalAlpha = 0.8;
    const mult = game.combo < 4 ? '1.5' : game.combo < 6 ? '2' : '3';
    ctx.fillText(`COMBO x${mult}`, w / 2, 10 + fontSize + 4);
    ctx.globalAlpha = 1;
  }

  if (game.comboPopup.timer > 0) {
    const pop = game.comboPopup;
    const alpha = Math.min(pop.timer * 2, 1);
    ctx.globalAlpha = alpha;
    const popSize = fontSize * 1.2;
    ctx.font = `bold ${popSize}px Arial`;
    ctx.fillStyle = '#ffe74c';
    ctx.shadowColor = '#ffe74c';
    ctx.shadowBlur = 10;
    ctx.fillText(pop.text, pop.x, pop.y - (1 - pop.timer) * 30);
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  const powerTexts = [];
  if (game.activePowers.wide > 0) {
    powerTexts.push(`WIDE ${Math.ceil(game.activePowers.wide)}s`);
  }
  if (game.activePowers.slow > 0) {
    powerTexts.push(`SLOW ${Math.ceil(game.activePowers.slow)}s`);
  }
  if (powerTexts.length > 0) {
    const pwSize = fontSize * 0.65;
    ctx.font = `bold ${pwSize}px Arial`;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#06d6a0';
    for (let i = 0; i < powerTexts.length; i++) {
      ctx.fillText(powerTexts[i], 10, 10 + fontSize + 6 + i * (pwSize + 2));
    }
  }

  ctx.restore();
}
