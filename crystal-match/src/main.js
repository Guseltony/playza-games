import { CrystalMatch } from './game.js'

document.querySelector('#app').innerHTML = `
  <div class="game-container">
    <div class="hud animate-in slide-in-from-top-4 duration-700">
      <h1 class="gradient-text">Crystal Match</h1>
      <p class="subtitle tracking-[0.3em]">Pure Arcade Action</p>
    </div>

    <div class="stats-bar" id="stats-bar" style="display:none">
      <div class="stat-card">
        <span class="stat-label">Score</span>
        <span class="stat-value" id="ui-score">0</span>
      </div>
      <div class="combo-badge" id="combo-badge">
        <span class="stat-label">Combo</span>
        <span class="stat-value" id="ui-combo">x1</span>
      </div>
      <div class="stat-card timer-card" id="timer-card">
        <span class="stat-label">Time</span>
        <span class="stat-value" id="ui-timer">60</span>
      </div>
    </div>

    <div class="canvas-wrapper relative" id="canvas-wrapper">
      <canvas id="gameCanvas" width="480" height="480"></canvas>
      
      <div id="start-overlay" class="overlay">
        <div class="overlay-content">
          <h2 class="text-3xl font-black mb-4 italic">READY?</h2>
          <p class="text-xs opacity-60 mb-8 font-bold leading-relaxed uppercase tracking-widest">Match 3 or more crystals<br>to score massive points!</p>
          <button id="startBtn" class="btn-primary glow-pulse">START MISSION</button>
        </div>
      </div>
    </div>

    <p class="swipe-hint">👆 Tap & swipe gems or use D-Pad to match</p>

    <div class="mobile-dpad">
      <button class="dpad-btn up" id="dpad-up">▲</button>
      <div class="dpad-row">
        <button class="dpad-btn left" id="dpad-left">◀</button>
        <button class="dpad-btn action" id="dpad-action">🎯</button>
        <button class="dpad-btn right" id="dpad-right">▶</button>
      </div>
      <button class="dpad-btn down" id="dpad-down">▼</button>
    </div>
  </div>
`

const canvas = document.querySelector('#gameCanvas');
const uiScore = document.querySelector('#ui-score');
const uiCombo = document.querySelector('#ui-combo');
const uiTimer = document.querySelector('#ui-timer');
const timerCard = document.querySelector('#timer-card');
const statsBar = document.querySelector('#stats-bar');
const comboBadge = document.querySelector('#combo-badge');

let game;

// Extend CrystalMatch to push stats to the DOM
function createGame(canvas) {
  game = new CrystalMatch(canvas);

  const _origAnimate = game.animate.bind(game);
  const _patchedAnimate = (time) => {
    _origAnimate(time);
    // Push live stats
    if (uiScore) uiScore.textContent = game.score.toLocaleString();
    if (uiCombo) {
      uiCombo.textContent = `x${game.combo}`;
      comboBadge.style.display = game.combo > 1 ? 'block' : 'flex';
      comboBadge.style.opacity = game.combo > 1 ? '1' : '0.4';
    }
    if (uiTimer) {
      uiTimer.textContent = game.timeLeft;
      if (game.timeLeft <= 10) timerCard.classList.add('warning');
      else timerCard.classList.remove('warning');
    }
  };
  game.animate = _patchedAnimate;
  // Restart the animation loop with our patched version
  game._animFrameId = requestAnimationFrame(game.animate);
}

// Touch swipe support
let touchStartX = 0, touchStartY = 0;
let touchStartCol = -1, touchStartRow = -1;

canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  const touch = e.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  touchStartCol = Math.floor((touch.clientX - rect.left) * scaleX / (game?.cellSize || 60));
  touchStartRow = Math.floor((touch.clientY - rect.top)  * scaleY / (game?.cellSize || 60));
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
  if (!game || game.isAnimating || game.gameOver) return;
  const touch = e.changedTouches[0];
  const dx = touch.clientX - touchStartX;
  const dy = touch.clientY - touchStartY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const endCol = Math.floor((touch.clientX - rect.left) * scaleX / game.cellSize);
  const endRow = Math.floor((touch.clientY - rect.top)  * scaleY / game.cellSize);

  if (dist < 10) {
    // Treat as tap — use handlePointer
    game.handlePointer(
      (touch.clientX - rect.left) * scaleX,
      (touch.clientY - rect.top)  * scaleY
    );
    return;
  }

  // Swipe gesture: determine direction and target neighbour
  if (touchStartCol < 0 || touchStartRow < 0) return;
  const GRID = 8;
  let targetRow = touchStartRow, targetCol = touchStartCol;

  if (Math.abs(dx) > Math.abs(dy)) {
    targetCol = dx > 0 ? touchStartCol + 1 : touchStartCol - 1;
  } else {
    targetRow = dy > 0 ? touchStartRow + 1 : touchStartRow - 1;
  }

  if (targetRow >= 0 && targetRow < GRID && targetCol >= 0 && targetCol < GRID) {
    game.selectedGem = null;
    game.swapGems({ r: touchStartRow, c: touchStartCol }, { r: targetRow, c: targetCol });
  }
}, { passive: false });

document.querySelector('#startBtn').addEventListener('click', () => {
  document.querySelector('#start-overlay').classList.add('hidden');
  statsBar.style.display = 'flex';
  createGame(canvas);
});

// D-Pad Bindings
document.querySelector('#dpad-up').addEventListener('click', () => game?.moveCursor?.(-1, 0));
document.querySelector('#dpad-down').addEventListener('click', () => game?.moveCursor?.(1, 0));
document.querySelector('#dpad-left').addEventListener('click', () => game?.moveCursor?.(0, -1));
document.querySelector('#dpad-right').addEventListener('click', () => game?.moveCursor?.(0, 1));
document.querySelector('#dpad-action').addEventListener('click', () => game?.actionCursor?.());
