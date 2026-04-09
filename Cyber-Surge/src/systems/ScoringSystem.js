// Scoring System - Handles score, coins, combos, and near-misses
export class ScoringSystem {
    constructor(engine) {
        this.engine = engine;
        
        this.score = 0;
        this.coins = 0;
        this.distance = 0;
        
        this.combo = 0;
        this.comboMultiplier = 1;
        this.maxComboMultiplier = 8;
        this.comboDecayTime = 2;
        this.comboTimer = 0;
        
        this.lastActionTime = 0;
        this.actionsSinceLastScore = 0;
    }
    
    update(dt) {
        this.distance += this.engine.currentSpeed * dt;
        
        this.score += this.engine.currentSpeed * dt * 0.1;
        
        if (this.comboTimer > 0) {
            this.comboTimer -= dt;
            if (this.comboTimer <= 0) {
                this.combo = 0;
                this.comboMultiplier = 1;
            }
        }
        
        this.engine.ui.updateScore(this.getScore(), this.coins, this.comboMultiplier);
    }
    
    addScore(base, reason = 'default') {
        let points = base * this.comboMultiplier;
        
        if (reason === 'powerup') points *= 2;
        if (reason === 'nearmiss') points *= 3;
        
        this.score += points;
        
        this.combo++;
        this.comboTimer = this.comboDecayTime;
        
        if (this.combo > 3) {
            this.comboMultiplier = Math.min(
                Math.floor(this.combo / 3) + 1,
                this.maxComboMultiplier
            );
        }
        
        this.actionsSinceLastScore++;
        this.lastActionTime = this.engine.elapsedTime;
    }
    
    addCoins(amount) {
        this.coins += amount;
        this.addScore(10, 'coin');
    }
    
    recordNearMiss() {
        this.addScore(25, 'nearmiss');
        this.engine.effects.addNearMiss();
        this.engine.audio.playNearMiss();
    }
    
    breakCombo() {
        this.combo = 0;
        this.comboMultiplier = 1;
        this.comboTimer = 0;
    }
    
    getScore() {
        return Math.floor(this.score);
    }
    
    getScoreData() {
        return {
            score: this.getScore(),
            coins: this.coins,
            distance: Math.floor(this.distance),
            combo: this.combo,
            comboMultiplier: this.comboMultiplier
        };
    }
    
    reset() {
        this.score = 0;
        this.coins = 0;
        this.distance = 0;
        this.combo = 0;
        this.comboMultiplier = 1;
        this.comboTimer = 0;
    }
}
