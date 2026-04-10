let audioCtx = null;

export function initAudio() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function ensureCtx() {
  if (!audioCtx) initAudio();
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playTone(freq, duration, type, volume, freqEnd) {
  ensureCtx();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  if (freqEnd) {
    osc.frequency.exponentialRampToValueAtTime(freqEnd, audioCtx.currentTime + duration);
  }
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + duration);
}

function playNoise(duration, volume) {
  ensureCtx();
  const bufferSize = audioCtx.sampleRate * duration;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * volume;
  }
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  source.connect(gain);
  gain.connect(audioCtx.destination);
  source.start();
}

export function playSound(type) {
  switch (type) {
    case 'blockBreak':
      playTone(800, 0.1, 'square', 0.15);
      playTone(1200, 0.08, 'square', 0.1);
      break;
    case 'hardHit':
      playTone(400, 0.08, 'triangle', 0.15);
      break;
    case 'paddle':
      playTone(300, 0.06, 'sine', 0.12);
      break;
    case 'wall':
      playTone(200, 0.04, 'sine', 0.08);
      break;
    case 'loseLife':
      playTone(400, 0.3, 'sawtooth', 0.15, 100);
      playNoise(0.2, 0.1);
      break;
    case 'item':
      playTone(600, 0.1, 'sine', 0.15);
      setTimeout(() => playTone(900, 0.1, 'sine', 0.15), 80);
      setTimeout(() => playTone(1200, 0.15, 'sine', 0.15), 160);
      break;
    case 'gameOver':
      playTone(500, 0.2, 'sawtooth', 0.15, 200);
      setTimeout(() => playTone(300, 0.3, 'sawtooth', 0.15, 100), 200);
      setTimeout(() => playTone(150, 0.5, 'sawtooth', 0.12, 50), 450);
      break;
    case 'stageClear':
      playTone(523, 0.12, 'square', 0.12);
      setTimeout(() => playTone(659, 0.12, 'square', 0.12), 100);
      setTimeout(() => playTone(784, 0.12, 'square', 0.12), 200);
      setTimeout(() => playTone(1047, 0.25, 'square', 0.15), 300);
      break;
    case 'newRecord':
      playTone(784, 0.15, 'square', 0.12);
      setTimeout(() => playTone(988, 0.15, 'square', 0.12), 120);
      setTimeout(() => playTone(1175, 0.15, 'square', 0.12), 240);
      setTimeout(() => playTone(1568, 0.3, 'square', 0.15), 360);
      setTimeout(() => playTone(1175, 0.15, 'square', 0.1), 560);
      setTimeout(() => playTone(1568, 0.4, 'square', 0.15), 680);
      break;
    case 'launch':
      playTone(400, 0.08, 'sine', 0.1, 800);
      break;
    case 'combo':
      playTone(1000, 0.06, 'sine', 0.1);
      playTone(1400, 0.08, 'sine', 0.08);
      break;
  }
}
