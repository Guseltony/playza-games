import * as THREE from 'three';

export class UIManager {
    constructor(engine) {
        this.engine = engine;
        this.container = engine.container;
        this.elements = {};
        this.createUI();
    }
    
    createUI() {
        this.createStartScreen();
        this.createHUD();
        this.createGameOverScreen();
        this.createPauseScreen();
    }
    
    createStartScreen() {
        const startScreen = document.createElement('div');
        startScreen.id = 'start-screen';
        startScreen.className = 'game-screen';
        startScreen.innerHTML = `
            <div class="title-container">
                <h1 class="game-title">PLAYZA RUNNER</h1>
                <p class="subtitle">Endless Adventure</p>
            </div>
            <div class="controls-info">
                <div class="control-item">
                    <span class="key">←</span> / <span class="key">A</span>
                    <span>Move Left</span>
                </div>
                <div class="control-item">
                    <span class="key">→</span> / <span class="key">D</span>
                    <span>Move Right</span>
                </div>
                <div class="control-item">
                    <span class="key">↑</span> / <span class="key">W</span> / <span class="key">SPACE</span>
                    <span>Jump</span>
                </div>
                <div class="control-item">
                    <span class="key">↓</span> / <span class="key">S</span>
                    <span>Slide</span>
                </div>
            </div>
            <button class="start-btn" id="start-btn">TAP TO START</button>
        `;
        
        this.container.appendChild(startScreen);
        this.elements.startScreen = startScreen;
        
        document.getElementById('start-btn').addEventListener('click', () => {
            this.engine.start();
        });
    }
    
    createHUD() {
        const hud = document.createElement('div');
        hud.id = 'game-hud';
        hud.className = 'hud hidden';
        
        hud.innerHTML = `
            <div class="score-container">
                <div class="score">
                    <span class="label">SCORE</span>
                    <span class="value" id="score-value">0</span>
                </div>
                <div class="coins">
                    <span class="coin-icon">🪙</span>
                    <span class="value" id="coins-value">0</span>
                </div>
            </div>
            <div class="combo-container">
                <span class="combo" id="combo-display">COMBO x1</span>
            </div>
            <div class="powerups-container" id="powerups-display"></div>
        `;
        
        this.container.appendChild(hud);
        this.elements.hud = hud;
    }
    
    createGameOverScreen() {
        const gameOver = document.createElement('div');
        gameOver.id = 'game-over';
        gameOver.className = 'game-screen hidden';
        
        gameOver.innerHTML = `
            <div class="game-over-content">
                <h1 class="game-over-title">GAME OVER</h1>
                <div class="final-stats">
                    <div class="stat-item">
                        <span class="stat-label">Final Score</span>
                        <span class="stat-value" id="final-score">0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Distance</span>
                        <span class="stat-value" id="final-distance">0m</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Coins</span>
                        <span class="stat-value" id="final-coins">0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Best Combo</span>
                        <span class="stat-value" id="final-combo">x1</span>
                    </div>
                </div>
                <button class="restart-btn" id="restart-btn">PLAY AGAIN</button>
            </div>
        `;
        
        this.container.appendChild(gameOver);
        this.elements.gameOver = gameOver;
        
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.engine.start();
        });
    }
    
    createPauseScreen() {
        const pause = document.createElement('div');
        pause.id = 'pause-screen';
        pause.className = 'pause-screen hidden';
        
        pause.innerHTML = `
            <div class="pause-content">
                <h1>PAUSED</h1>
                <button class="resume-btn" id="resume-btn">RESUME</button>
            </div>
        `;
        
        this.container.appendChild(pause);
        this.elements.pause = pause;
        
        document.getElementById('resume-btn').addEventListener('click', () => {
            this.engine.pause();
        });
    }
    
    showGame() {
        this.elements.startScreen.classList.add('hidden');
        this.elements.gameOver.classList.add('hidden');
        this.elements.hud.classList.remove('hidden');
    }
    
    hideGame() {
        this.elements.hud.classList.add('hidden');
    }
    
    showGameOver(data) {
        this.elements.hud.classList.add('hidden');
        this.elements.gameOver.classList.remove('hidden');
        
        document.getElementById('final-score').textContent = data.score.toLocaleString();
        document.getElementById('final-distance').textContent = data.distance + 'm';
        document.getElementById('final-coins').textContent = data.coins;
        document.getElementById('final-combo').textContent = 'x' + data.comboMultiplier;
    }
    
    showPause(isPaused) {
        if (isPaused) {
            this.elements.pause.classList.remove('hidden');
        } else {
            this.elements.pause.classList.add('hidden');
        }
    }
    
    updateScore(score, coins, combo) {
        const scoreEl = document.getElementById('score-value');
        const coinsEl = document.getElementById('coins-value');
        const comboEl = document.getElementById('combo-display');
        
        if (scoreEl) scoreEl.textContent = score.toLocaleString();
        if (coinsEl) coinsEl.textContent = coins;
        if (comboEl) {
            comboEl.textContent = `COMBO x${combo}`;
            comboEl.classList.toggle('active', combo > 1);
        }
    }
    
    updatePowerUps(active, timers) {
        const container = document.getElementById('powerups-display');
        if (!container) return;
        
        container.innerHTML = '';
        
        const icons = { magnet: '🧲', speed: '⚡', shield: '🛡️', jetpack: '🚀', slowmo: '🕒' };
        
        Object.keys(active).forEach(type => {
            if (active[type] && timers[type] > 0) {
                const el = document.createElement('div');
                el.className = 'powerup-indicator';
                el.innerHTML = `
                    <span class="icon">${icons[type] || '⭐'}</span>
                    <div class="timer-bar">
                        <div class="timer-fill" style="width: ${(timers[type] / 10) * 100}%"></div>
                    </div>
                `;
                container.appendChild(el);
            }
        });
    }
    
    reset() {
        this.elements.startScreen.classList.remove('hidden');
        this.elements.gameOver.classList.add('hidden');
        this.elements.hud.classList.add('hidden');
        this.elements.pause.classList.add('hidden');
    }
}
