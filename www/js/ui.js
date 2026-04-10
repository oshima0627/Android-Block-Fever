let fadeAlpha = 0;
let fadeDir = 0;
let fadeCallback = null;
let fadeMidCallback = null;

export function startFade(midCb, endCb) {
  fadeAlpha = 0;
  fadeDir = 1;
  fadeMidCallback = midCb;
  fadeCallback = endCb;
}

export function updateFade(dt) {
  if (fadeDir === 0) return;

  fadeAlpha += fadeDir * dt * (1 / 0.3);

  if (fadeDir === 1 && fadeAlpha >= 1) {
    fadeAlpha = 1;
    fadeDir = -1;
    if (fadeMidCallback) {
      fadeMidCallback();
      fadeMidCallback = null;
    }
  } else if (fadeDir === -1 && fadeAlpha <= 0) {
    fadeAlpha = 0;
    fadeDir = 0;
    if (fadeCallback) {
      fadeCallback();
      fadeCallback = null;
    }
  }
}

export function isFading() {
  return fadeDir !== 0;
}

export function drawFade(ctx, w, h) {
  if (fadeAlpha > 0) {
    ctx.globalAlpha = fadeAlpha;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1;
  }
}

export function drawTitleScreen(ctx, w, h, hiScore) {
  const time = performance.now() / 1000;

  const titleSize = Math.max(w * 0.12, 36);
  ctx.save();

  ctx.font = `bold ${titleSize}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const glowPulse = Math.sin(time * 2) * 5 + 15;
  ctx.shadowColor = '#ff3e6c';
  ctx.shadowBlur = glowPulse;
  ctx.fillStyle = '#ff3e6c';
  ctx.fillText('BLOCK', w / 2, h * 0.28);

  ctx.shadowColor = '#ffe74c';
  ctx.shadowBlur = glowPulse;
  ctx.fillStyle = '#ffe74c';
  ctx.fillText('FEVER', w / 2, h * 0.28 + titleSize * 1.05);

  ctx.shadowBlur = 0;

  const subSize = Math.max(w * 0.04, 14);
  ctx.font = `${subSize}px Arial`;
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = 0.7;
  ctx.fillText(`HI-SCORE: ${hiScore}`, w / 2, h * 0.48);
  ctx.globalAlpha = 1;

  const btnW = Math.min(w * 0.55, 220);
  const btnH = Math.max(w * 0.12, 44);
  const btnX = w / 2 - btnW / 2;
  const btnY = h * 0.56;

  const btnPulse = Math.sin(time * 3) * 3 + 8;
  ctx.shadowColor = '#ffe74c';
  ctx.shadowBlur = btnPulse;
  ctx.strokeStyle = '#ffe74c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(btnX, btnY, btnW, btnH, 8);
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.font = `bold ${Math.max(w * 0.06, 20)}px Arial`;
  ctx.fillStyle = '#ffe74c';
  ctx.fillText('START', w / 2, btnY + btnH / 2);

  const helpSize = Math.max(w * 0.032, 12);
  ctx.font = `${helpSize}px Arial`;
  ctx.fillStyle = '#888888';
  ctx.globalAlpha = 0.6;
  ctx.fillText('\u2190 \u2192  Drag or Arrow Keys', w / 2, h * 0.75);
  ctx.fillText('Tap / Space to Launch Ball', w / 2, h * 0.75 + helpSize + 8);
  ctx.globalAlpha = 1;

  ctx.restore();
}

export function drawGameOverScreen(ctx, w, h, score, hiScore, isNewRecord, canReward) {
  ctx.save();

  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, w, h);

  const time = performance.now() / 1000;
  const titleSize = Math.max(w * 0.09, 28);

  ctx.font = `bold ${titleSize}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#ff3e6c';
  ctx.shadowBlur = 10;
  ctx.fillStyle = '#ff3e6c';
  ctx.fillText('GAME OVER', w / 2, h * 0.25);
  ctx.shadowBlur = 0;

  if (isNewRecord) {
    const recSize = Math.max(w * 0.06, 18);
    ctx.font = `bold ${recSize}px Arial`;
    const recPulse = Math.sin(time * 5) > 0 ? 1 : 0.4;
    ctx.globalAlpha = recPulse;
    ctx.shadowColor = '#ffe74c';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#ffe74c';
    ctx.fillText('NEW RECORD!', w / 2, h * 0.33);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  const scoreSize = Math.max(w * 0.05, 16);
  ctx.font = `${scoreSize}px Arial`;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`SCORE: ${score}`, w / 2, h * 0.41);
  ctx.fillStyle = '#aaaaaa';
  ctx.fillText(`HI-SCORE: ${hiScore}`, w / 2, h * 0.41 + scoreSize + 8);

  const btnW = Math.min(w * 0.6, 240);
  const btnH = Math.max(w * 0.11, 40);

  if (canReward) {
    const rwdY = h * 0.55;
    ctx.shadowColor = '#06d6a0';
    ctx.shadowBlur = 8;
    ctx.strokeStyle = '#06d6a0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(w / 2 - btnW / 2, rwdY, btnW, btnH, 8);
    ctx.stroke();
    ctx.shadowBlur = 0;

    const rwdTextSize = Math.max(w * 0.038, 13);
    ctx.font = `bold ${rwdTextSize}px Arial`;
    ctx.fillStyle = '#06d6a0';
    ctx.fillText('\u25b6 Watch Ad for +1 Life', w / 2, rwdY + btnH / 2);
  }

  const rstY = canReward ? h * 0.67 : h * 0.58;
  const rstPulse = Math.sin(time * 3) * 3 + 8;
  ctx.shadowColor = '#ffe74c';
  ctx.shadowBlur = rstPulse;
  ctx.strokeStyle = '#ffe74c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(w / 2 - btnW / 2, rstY, btnW, btnH, 8);
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.font = `bold ${Math.max(w * 0.05, 18)}px Arial`;
  ctx.fillStyle = '#ffe74c';
  ctx.fillText('RESTART', w / 2, rstY + btnH / 2);

  ctx.restore();
}

export function getGameOverButtons(w, h, canReward) {
  const btnW = Math.min(w * 0.6, 240);
  const btnH = Math.max(w * 0.11, 40);
  const buttons = {};

  if (canReward) {
    buttons.reward = {
      x: w / 2 - btnW / 2, y: h * 0.55,
      w: btnW, h: btnH
    };
    buttons.restart = {
      x: w / 2 - btnW / 2, y: h * 0.67,
      w: btnW, h: btnH
    };
  } else {
    buttons.restart = {
      x: w / 2 - btnW / 2, y: h * 0.58,
      w: btnW, h: btnH
    };
  }

  return buttons;
}

export function getTitleStartButton(w, h) {
  const btnW = Math.min(w * 0.55, 220);
  const btnH = Math.max(w * 0.12, 44);
  return {
    x: w / 2 - btnW / 2,
    y: h * 0.56,
    w: btnW,
    h: btnH
  };
}

export function drawStageClear(ctx, w, h, stage, bonus, timer) {
  ctx.save();

  const alpha = Math.min(timer * 2, 1);
  ctx.globalAlpha = alpha;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fillRect(0, 0, w, h);

  const titleSize = Math.max(w * 0.08, 26);
  ctx.font = `bold ${titleSize}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#06d6a0';
  ctx.shadowBlur = 15;
  ctx.fillStyle = '#06d6a0';
  ctx.fillText(`STAGE ${stage} CLEAR!`, w / 2, h * 0.4);
  ctx.shadowBlur = 0;

  const bonusSize = Math.max(w * 0.045, 15);
  ctx.font = `${bonusSize}px Arial`;
  ctx.fillStyle = '#ffe74c';
  ctx.fillText(`BONUS: +${bonus}`, w / 2, h * 0.5);

  ctx.globalAlpha = 1;
  ctx.restore();
}
