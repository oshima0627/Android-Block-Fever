export const SCREEN = {
  TITLE: 0,
  PLAYING: 1,
  GAME_OVER: 2,
  STAGE_CLEAR: 3
};

export const BLOCK_TYPE = {
  NORMAL: 0,
  HARD: 1,
  ITEM: 2
};

export const POWERUP_TYPE = {
  WIDE: 0,
  MULTI: 1,
  SLOW: 2
};

export const BLOCK_COLORS = [
  '#ff3e6c',
  '#ffe74c',
  '#06d6a0',
  '#118ab2',
  '#8338ec',
  '#ff6f00'
];

export const COLS = 8;
export const BLOCK_GAP = 4;

export function getDifficulty(stage) {
  if (stage <= 3) {
    return {
      speedMult: 1.0,
      minRows: 3,
      maxRows: 4,
      hardPercent: 0,
      itemPercent: 0.15
    };
  } else if (stage <= 6) {
    return {
      speedMult: 1.2,
      minRows: 4,
      maxRows: 5,
      hardPercent: 0.20,
      itemPercent: 0.10
    };
  } else if (stage <= 9) {
    return {
      speedMult: 1.4,
      minRows: 5,
      maxRows: 6,
      hardPercent: 0.35,
      itemPercent: 0.08
    };
  }
  return {
    speedMult: 1.5,
    minRows: 6,
    maxRows: 6,
    hardPercent: 0.50,
    itemPercent: 0.06
  };
}

export function createGame() {
  return {
    screen: SCREEN.TITLE,
    width: 0,
    height: 0,
    score: 0,
    lives: 3,
    stage: 1,
    combo: 0,
    maxCombo: 0,
    hiScore: parseInt(localStorage.getItem('blockFeverHiScore')) || 0,
    newRecord: false,
    gameOverCount: 0,

    paddle: { x: 0, y: 0, w: 0, h: 0, baseW: 0, targetX: 0 },
    balls: [],
    blocks: [],
    powerUps: [],

    activePowers: {
      wide: 0,
      slow: 0
    },

    ballOnPaddle: true,
    stageClearTimer: 0,
    stageClearBonus: 0,

    fadeAlpha: 0,
    fadeDir: 0,
    fadeCallback: null,

    comboPopup: { text: '', timer: 0, x: 0, y: 0 }
  };
}

export function initDimensions(game) {
  const w = game.width;
  const h = game.height;
  const paddleW = Math.max(w * 0.22, 60);
  const paddleH = Math.max(w * 0.03, 12);
  game.paddle.baseW = paddleW;
  game.paddle.w = game.activePowers.wide > 0 ? paddleW * 1.5 : paddleW;
  game.paddle.h = paddleH;
  game.paddle.y = h * 0.78;
  if (game.paddle.x === 0) {
    game.paddle.x = w / 2 - game.paddle.w / 2;
    game.paddle.targetX = game.paddle.x;
  }
}

export function generateBlocks(game) {
  const w = game.width;
  const diff = getDifficulty(game.stage);
  const rows = diff.minRows + Math.floor(Math.random() * (diff.maxRows - diff.minRows + 1));

  const blockW = (w - (COLS + 1) * BLOCK_GAP) / COLS;
  const blockH = blockW * 0.38;
  const topOffset = game.height * 0.08 + 10;

  game.blocks = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < COLS; c++) {
      const bx = BLOCK_GAP + c * (blockW + BLOCK_GAP);
      const by = topOffset + r * (blockH + BLOCK_GAP);

      let type = BLOCK_TYPE.NORMAL;
      let hp = 1;
      let color = BLOCK_COLORS[(r + c) % BLOCK_COLORS.length];

      const rand = Math.random();
      if (rand < diff.hardPercent) {
        type = BLOCK_TYPE.HARD;
        hp = 2;
        color = '#c0c0c0';
      } else if (rand < diff.hardPercent + diff.itemPercent) {
        type = BLOCK_TYPE.ITEM;
        hp = 1;
        color = '#ffd700';
      }

      game.blocks.push({
        x: bx, y: by, w: blockW, h: blockH,
        hp: hp, maxHp: hp, type: type, color: color
      });
    }
  }
}

export function createBall(game) {
  const w = game.width;
  const r = Math.max(w * 0.018, 8);
  const baseSpeed = game.height * 0.45;
  const diff = getDifficulty(game.stage);
  const speed = baseSpeed * diff.speedMult;

  return {
    x: game.paddle.x + game.paddle.w / 2,
    y: game.paddle.y - r - 1,
    vx: 0,
    vy: -speed,
    r: r,
    speed: speed,
    trail: []
  };
}

export function resetBallToPaddle(game) {
  game.balls = [];
  const ball = createBall(game);
  game.balls.push(ball);
  game.ballOnPaddle = true;
  game.combo = 0;
}

export function launchBall(game) {
  if (!game.ballOnPaddle || game.balls.length === 0) return;
  game.ballOnPaddle = false;
  const ball = game.balls[0];
  const angle = (Math.random() - 0.5) * Math.PI / 6;
  ball.vx = ball.speed * Math.sin(angle);
  ball.vy = -ball.speed * Math.cos(angle);
}

export function getComboMultiplier(combo) {
  if (combo < 2) return 1;
  if (combo < 4) return 1.5;
  if (combo < 6) return 2;
  return 3;
}

export function getBlockScore(type) {
  if (type === BLOCK_TYPE.NORMAL) return 10;
  if (type === BLOCK_TYPE.HARD) return 25;
  if (type === BLOCK_TYPE.ITEM) return 15;
  return 10;
}

export function saveHiScore(game) {
  if (game.score > game.hiScore) {
    game.hiScore = game.score;
    game.newRecord = true;
    localStorage.setItem('blockFeverHiScore', game.hiScore.toString());
  }
}
