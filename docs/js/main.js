import {
  SCREEN, BLOCK_TYPE, POWERUP_TYPE,
  createGame, initDimensions, generateBlocks,
  createBall, resetBallToPaddle, launchBall,
  getComboMultiplier, getBlockScore, saveHiScore, getDifficulty,
  getStageName
} from './state.js';
import { initAudio, playSound } from './sound.js';
import {
  initStars, emitBlockBreak, emitPowerUpCollect, triggerFlash,
  updateParticles, drawStars, drawParticles, drawFlash
} from './particles.js';
import { initInput, getTargetX, consumeTap, getClickPos, getKeysDown } from './input.js';
import {
  drawBackground, drawBlock, drawPaddle, drawBall, drawPowerUp,
  drawHUD, setShake, updateShake, applyShake
} from './renderer.js';
import {
  drawTitleScreen, drawGameOverScreen, drawStageClear, drawFade,
  startFade, updateFade, isFading,
  getGameOverButtons, getTitleStartButton
} from './ui.js';
import { initAds, showBanner, showInterstitial, showRewarded } from './ads.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const game = createGame();
let lastTime = 0;
let rewardUsed = false;

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  game.width = w;
  game.height = h;
  initDimensions(game);
  initStars(w, h);
}

function pointInRect(px, py, rect) {
  return px >= rect.x && px <= rect.x + rect.w &&
         py >= rect.y && py <= rect.y + rect.h;
}

function circleRectOverlap(cx, cy, cr, rx, ry, rw, rh) {
  const closestX = Math.max(rx, Math.min(cx, rx + rw));
  const closestY = Math.max(ry, Math.min(cy, ry + rh));
  const dx = cx - closestX;
  const dy = cy - closestY;
  return dx * dx + dy * dy < cr * cr;
}

function startGame() {
  initAudio();
  game.screen = SCREEN.PLAYING;
  game.score = 0;
  game.lives = 3;
  game.stage = 1;
  game.combo = 0;
  game.newRecord = false;
  game.activePowers = { wide: 0, slow: 0 };
  rewardUsed = false;
  initDimensions(game);
  generateBlocks(game);
  resetBallToPaddle(game);
  showBanner();
}

function nextStage() {
  game.stage++;
  game.activePowers = { wide: 0, slow: 0 };
  initDimensions(game);
  generateBlocks(game);
  resetBallToPaddle(game);
}

function loseLife() {
  game.lives--;
  playSound('loseLife');
  setShake(6, 0.3);

  if (game.lives <= 0) {
    gameOver();
  } else {
    game.activePowers = { wide: 0, slow: 0 };
    initDimensions(game);
    resetBallToPaddle(game);
  }
}

function gameOver() {
  saveHiScore(game);
  game.screen = SCREEN.GAME_OVER;
  game.gameOverCount++;
  if (game.newRecord) {
    playSound('newRecord');
  } else {
    playSound('gameOver');
  }
}

function restartAfterGameOver() {
  const shouldShowAd = game.gameOverCount % 3 === 0;
  if (shouldShowAd) {
    showInterstitial();
  }
  startFade(() => {
    startGame();
  }, null);
}

function rewardExtraLife() {
  showRewarded(() => {
    game.lives = 1;
    game.screen = SCREEN.PLAYING;
    rewardUsed = true;
    game.activePowers = { wide: 0, slow: 0 };
    initDimensions(game);
    resetBallToPaddle(game);
  });
}

function spawnPowerUp(x, y) {
  const type = Math.floor(Math.random() * 3);
  const fallSpeed = game.height * 0.15;
  game.powerUps.push({
    x: x,
    y: y,
    type: type,
    vy: fallSpeed,
    size: Math.max(game.width * 0.03, 12)
  });
}

function activatePowerUp(type) {
  playSound('item');
  triggerFlash();

  switch (type) {
    case POWERUP_TYPE.WIDE:
      game.activePowers.wide = 15;
      game.paddle.w = game.paddle.baseW * 1.5;
      break;
    case POWERUP_TYPE.MULTI:
      if (game.balls.length > 0) {
        const src = game.balls[0];
        for (let i = 0; i < 2; i++) {
          const angle = (i === 0 ? -1 : 1) * Math.PI / 4;
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);
          const newBall = createBall(game);
          newBall.x = src.x;
          newBall.y = src.y;
          const sp = src.speed;
          newBall.vx = src.vx * cos - src.vy * sin;
          newBall.vy = src.vx * sin + src.vy * cos;
          const mag = Math.sqrt(newBall.vx * newBall.vx + newBall.vy * newBall.vy);
          newBall.vx = (newBall.vx / mag) * sp;
          newBall.vy = (newBall.vy / mag) * sp;
          newBall.trail = [];
          game.balls.push(newBall);
        }
        game.ballOnPaddle = false;
      }
      break;
    case POWERUP_TYPE.SLOW:
      game.activePowers.slow = 10;
      for (const ball of game.balls) {
        const mag = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
        const targetSpeed = ball.speed * 0.6;
        if (mag > 0) {
          ball.vx = (ball.vx / mag) * targetSpeed;
          ball.vy = (ball.vy / mag) * targetSpeed;
        }
      }
      break;
  }
}

function enforceMinAngle(ball) {
  const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
  if (speed === 0) return;
  const minVyRatio = 0.35;
  const absVyRatio = Math.abs(ball.vy) / speed;
  if (absVyRatio < minVyRatio) {
    const sign = ball.vy >= 0 ? 1 : -1;
    ball.vy = sign * speed * minVyRatio;
    const remainX = Math.sqrt(speed * speed - ball.vy * ball.vy);
    ball.vx = (ball.vx >= 0 ? 1 : -1) * remainX;
  }
}

function updatePaddle(dt) {
  const keys = getKeysDown();
  const paddle = game.paddle;
  const keySpeed = game.width * 0.8;

  if (keys['ArrowLeft']) {
    paddle.targetX = paddle.x - keySpeed * dt;
  }
  if (keys['ArrowRight']) {
    paddle.targetX = paddle.x + keySpeed * dt;
  }

  const tx = getTargetX();
  if (tx >= 0) {
    paddle.targetX = tx - paddle.w / 2;
  }

  paddle.targetX = Math.max(0, Math.min(game.width - paddle.w, paddle.targetX));
  paddle.x += (paddle.targetX - paddle.x) * Math.min(1, dt * 20);
  paddle.x = Math.max(0, Math.min(game.width - paddle.w, paddle.x));
}

function updateBalls(dt) {
  const w = game.width;
  const h = game.height;
  const paddle = game.paddle;

  for (let i = game.balls.length - 1; i >= 0; i--) {
    const ball = game.balls[i];

    ball.trail.push({ x: ball.x, y: ball.y });
    if (ball.trail.length > 8) ball.trail.shift();

    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    if (ball.x - ball.r < 0) {
      ball.x = ball.r;
      ball.vx = Math.abs(ball.vx);
      enforceMinAngle(ball);
      playSound('wall');
    }
    if (ball.x + ball.r > w) {
      ball.x = w - ball.r;
      ball.vx = -Math.abs(ball.vx);
      enforceMinAngle(ball);
      playSound('wall');
    }
    if (ball.y - ball.r < 0) {
      ball.y = ball.r;
      ball.vy = Math.abs(ball.vy);
      playSound('wall');
    }

    if (ball.y + ball.r > h) {
      game.balls.splice(i, 1);
      if (game.balls.length === 0) {
        loseLife();
      }
      continue;
    }

    if (ball.vy > 0 && circleRectOverlap(ball.x, ball.y, ball.r,
        paddle.x, paddle.y, paddle.w, paddle.h)) {
      ball.y = paddle.y - ball.r;
      const relativeHit = ((ball.x - paddle.x) / paddle.w) * 2 - 1;
      const clampedHit = Math.max(-0.9, Math.min(0.9, relativeHit));
      const angle = clampedHit * (Math.PI * 50 / 180);
      const currentSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
      ball.vx = currentSpeed * Math.sin(angle);
      ball.vy = -currentSpeed * Math.cos(angle);
      enforceMinAngle(ball);
      game.combo = 0;
      playSound('paddle');
    }

    for (let j = game.blocks.length - 1; j >= 0; j--) {
      const block = game.blocks[j];
      if (!circleRectOverlap(ball.x, ball.y, ball.r,
          block.x, block.y, block.w, block.h)) continue;

      const bcx = block.x + block.w / 2;
      const bcy = block.y + block.h / 2;
      const dx = ball.x - bcx;
      const dy = ball.y - bcy;

      const overlapX = (block.w / 2 + ball.r) - Math.abs(dx);
      const overlapY = (block.h / 2 + ball.r) - Math.abs(dy);

      if (overlapX < overlapY) {
        ball.vx = Math.abs(ball.vx) * (dx > 0 ? 1 : -1);
        ball.x += (dx > 0 ? overlapX : -overlapX) * 0.5;
      } else {
        ball.vy = Math.abs(ball.vy) * (dy > 0 ? 1 : -1);
        ball.y += (dy > 0 ? overlapY : -overlapY) * 0.5;
      }
      enforceMinAngle(ball);

      block.hp--;
      if (block.hp <= 0) {
        game.combo++;
        if (game.combo > game.maxCombo) game.maxCombo = game.combo;
        const mult = getComboMultiplier(game.combo);
        const points = Math.floor(getBlockScore(block.type) * mult);
        game.score += points;

        emitBlockBreak(
          block.x + block.w / 2,
          block.y + block.h / 2,
          block.color,
          15
        );
        setShake(3, 0.1);
        playSound('blockBreak');

        if (game.combo >= 2) {
          game.comboPopup = {
            text: `x${mult} +${points}`,
            timer: 1.0,
            x: block.x + block.w / 2,
            y: block.y + block.h / 2
          };
          playSound('combo');
        }

        if (block.type === BLOCK_TYPE.ITEM) {
          spawnPowerUp(block.x + block.w / 2, block.y + block.h / 2);
        }

        game.blocks.splice(j, 1);
      } else {
        playSound('hardHit');
        setShake(2, 0.05);
      }

      break;
    }
  }
}

function updatePowerUps(dt) {
  const paddle = game.paddle;

  for (let i = game.powerUps.length - 1; i >= 0; i--) {
    const pu = game.powerUps[i];
    pu.y += pu.vy * dt;

    if (circleRectOverlap(pu.x, pu.y, pu.size,
        paddle.x, paddle.y, paddle.w, paddle.h)) {
      emitPowerUpCollect(pu.x, pu.y);
      activatePowerUp(pu.type);
      game.powerUps.splice(i, 1);
      continue;
    }

    if (pu.y - pu.size > game.height) {
      game.powerUps.splice(i, 1);
    }
  }
}

function updateActivePowers(dt) {
  if (game.activePowers.wide > 0) {
    game.activePowers.wide -= dt;
    if (game.activePowers.wide <= 0) {
      game.activePowers.wide = 0;
      game.paddle.w = game.paddle.baseW;
      game.paddle.x = Math.min(game.paddle.x, game.width - game.paddle.w);
    }
  }

  if (game.activePowers.slow > 0) {
    game.activePowers.slow -= dt;
    if (game.activePowers.slow <= 0) {
      game.activePowers.slow = 0;
      const diff = getDifficulty(game.stage);
      const baseSpeed = game.height * 0.45 * diff.speedMult;
      for (const ball of game.balls) {
        const mag = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
        if (mag > 0) {
          ball.vx = (ball.vx / mag) * baseSpeed;
          ball.vy = (ball.vy / mag) * baseSpeed;
        }
        ball.speed = baseSpeed;
      }
    }
  }
}

function checkStageClear() {
  if (game.blocks.length === 0 && game.screen === SCREEN.PLAYING) {
    game.screen = SCREEN.STAGE_CLEAR;
    game.stageClearBonus = game.lives * 100;
    game.score += game.stageClearBonus;
    game.stageClearTimer = 2.5;
    playSound('stageClear');
  }
}

function update(dt) {
  updateFade(dt);
  updateShake(dt);
  updateParticles(dt, game.width, game.height);

  if (game.comboPopup.timer > 0) {
    game.comboPopup.timer -= dt;
  }

  if (game.screen === SCREEN.TITLE) {
    const tap = consumeTap();
    const click = getClickPos();
    if (tap || click) {
      const btn = getTitleStartButton(game.width, game.height);
      if (tap && !click) {
        startFade(() => { startGame(); }, null);
      } else if (click && pointInRect(click.x, click.y, btn)) {
        startFade(() => { startGame(); }, null);
      }
    }
  } else if (game.screen === SCREEN.PLAYING) {
    if (isFading()) return;

    updatePaddle(dt);

    if (game.ballOnPaddle) {
      const ball = game.balls[0];
      if (ball) {
        ball.x = game.paddle.x + game.paddle.w / 2;
        ball.y = game.paddle.y - ball.r - 1;
      }

      if (consumeTap()) {
        launchBall(game);
        playSound('launch');
      }
    } else {
      updateBalls(dt);
      updatePowerUps(dt);
      updateActivePowers(dt);
      checkStageClear();
    }
  } else if (game.screen === SCREEN.STAGE_CLEAR) {
    game.stageClearTimer -= dt;
    if (game.stageClearTimer <= 0 && !isFading()) {
      startFade(() => { nextStage(); game.screen = SCREEN.PLAYING; }, null);
    }
  } else if (game.screen === SCREEN.GAME_OVER) {
    const click = getClickPos();
    const tap = consumeTap();

    if (click) {
      const canReward = !rewardUsed;
      const buttons = getGameOverButtons(game.width, game.height, canReward);

      if (buttons.reward && pointInRect(click.x, click.y, buttons.reward)) {
        rewardExtraLife();
      } else if (buttons.restart && pointInRect(click.x, click.y, buttons.restart)) {
        restartAfterGameOver();
      }
    }
  }
}

function render() {
  const w = game.width;
  const h = game.height;

  ctx.save();
  applyShake(ctx);

  drawBackground(ctx, w, h);
  drawStars(ctx, w, h);

  if (game.screen === SCREEN.TITLE) {
    drawTitleScreen(ctx, w, h, game.hiScore);
  } else if (game.screen === SCREEN.PLAYING || game.screen === SCREEN.STAGE_CLEAR) {
    for (const block of game.blocks) {
      drawBlock(ctx, block);
    }
    for (const pu of game.powerUps) {
      drawPowerUp(ctx, pu);
    }
    drawPaddle(ctx, game.paddle);
    for (const ball of game.balls) {
      drawBall(ctx, ball);
    }
    drawParticles(ctx);
    drawHUD(ctx, game);

    if (game.screen === SCREEN.STAGE_CLEAR) {
      drawStageClear(ctx, w, h, game.stage, game.stageClearBonus, 2.5 - game.stageClearTimer, getStageName(game.stage));
    }

    if (game.ballOnPaddle) {
      const time = performance.now() / 1000;
      const alpha = Math.sin(time * 3) * 0.3 + 0.7;
      ctx.globalAlpha = alpha;
      const fontSize = Math.max(w * 0.04, 14);
      ctx.font = `${fontSize}px Arial`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('TAP TO LAUNCH', w / 2, game.paddle.y - 40);
      ctx.globalAlpha = 0.5;
      const nameSize = Math.max(w * 0.035, 12);
      ctx.font = `${nameSize}px Arial`;
      ctx.fillStyle = '#ffe74c';
      ctx.fillText(getStageName(game.stage), w / 2, game.paddle.y - 40 - fontSize - 4);
      ctx.globalAlpha = 1;
    }
  } else if (game.screen === SCREEN.GAME_OVER) {
    for (const block of game.blocks) {
      drawBlock(ctx, block);
    }
    drawPaddle(ctx, game.paddle);
    drawParticles(ctx);
    drawGameOverScreen(ctx, w, h, game.score, game.hiScore, game.newRecord, !rewardUsed);
  }

  drawFlash(ctx, w, h);
  drawFade(ctx, w, h);

  ctx.restore();
}

function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;

  update(dt);
  render();

  requestAnimationFrame(gameLoop);
}

function init() {
  resizeCanvas();
  initInput(canvas);
  initAds();

  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('orientationchange', () => {
    setTimeout(resizeCanvas, 100);
  });

  lastTime = performance.now();
  requestAnimationFrame(gameLoop);
}

init();
