let targetX = -1;
let tapped = false;
let inputActive = false;
let clickPos = null;

export function initInput(canvas) {
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    targetX = touch.clientX - rect.left;
    tapped = true;
    clickPos = { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    inputActive = true;
  }, { passive: false });

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    targetX = touch.clientX - rect.left;
    inputActive = true;
  }, { passive: false });

  canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    inputActive = false;
  }, { passive: false });

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    targetX = e.clientX - rect.left;
    inputActive = true;
  });

  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    tapped = true;
    clickPos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    targetX = e.clientX - rect.left;
    inputActive = true;
  });

  let keysDown = {};
  window.addEventListener('keydown', (e) => {
    keysDown[e.key] = true;
    if (e.key === ' ' || e.key === 'ArrowUp') {
      tapped = true;
    }
  });
  window.addEventListener('keyup', (e) => {
    keysDown[e.key] = false;
  });

  const getKeyboardInput = () => keysDown;
  window._blockFeverKeys = keysDown;
}

export function getTargetX() {
  return targetX;
}

export function consumeTap() {
  if (tapped) {
    tapped = false;
    return true;
  }
  return false;
}

export function getClickPos() {
  const pos = clickPos;
  clickPos = null;
  return pos;
}

export function isInputActive() {
  return inputActive;
}

export function getKeysDown() {
  return window._blockFeverKeys || {};
}
