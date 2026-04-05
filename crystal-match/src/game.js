import { sdk } from './sdk.js';

const GRID_SIZE = 8;
const COLORS = ['#f43f5e', '#10b981', '#3b82f6', '#f59e0b', '#d946ef', '#06b6d4'];

export class CrystalMatch {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.grid = [];
        this.selectedGem = null;
        this.cursorPos = { r: 3, c: 3 };
        this.isAnimating = false;
        this.score = 0;
        this.combo = 1;
        this.timeLeft = 60; 
        this.particles = [];
        this.floatingTexts = [];
        this.gameOver = false;
        this.lastUpdate = 0;
        this.shakeTime = 0;
        this.cellSize = 60;

        this.resize();
        this.initGrid();
        this.setupEventListeners();
        this.animate(0);
        this.startTimer();
        window.addEventListener('resize', () => this.resize());
        sdk.ready();
    }

    resize() {
        const containerWidth = Math.min(window.innerWidth - 30, 480);
        this.cellSize = containerWidth / GRID_SIZE;
        this.canvas.width = containerWidth;
        this.canvas.height = this.cellSize * 9; 
        
        for (let r = 0; r < GRID_SIZE; r++) {
            if (!this.grid[r]) continue;
            for (let c = 0; c < GRID_SIZE; c++) {
                const gem = this.grid[r][c];
                gem.targetX = c * this.cellSize;
                gem.targetY = r * this.cellSize;
                gem.x = gem.targetX;
                gem.y = gem.targetY;
            }
        }
    }

    initGrid() {
        for (let r = 0; r < GRID_SIZE; r++) {
            this.grid[r] = [];
            for (let c = 0; c < GRID_SIZE; c++) {
                this.grid[r][c] = this.createGem(r, c);
            }
        }
        while (this.findMatches().length > 0) {
            this.shuffleGrid();
        }
    }

    createGem(r, c) {
        return {
            type: Math.floor(Math.random() * COLORS.length),
            x: c * this.cellSize,
            y: -this.cellSize * 5 + (r * this.cellSize), 
            targetX: c * this.cellSize,
            targetY: r * this.cellSize,
            isMatching: false,
            scale: 1,
            alpha: 1
        };
    }

    shuffleGrid() {
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                this.grid[r][c].type = Math.floor(Math.random() * COLORS.length);
            }
        }
    }

    setupEventListeners() {
        const getPointerPos = (e) => {
             const rect = this.canvas.getBoundingClientRect();
             const scaleX = this.canvas.width / rect.width;
             const scaleY = this.canvas.height / rect.height;
             return {
                 x: (e.clientX - rect.left) * scaleX,
                 y: (e.clientY - rect.top) * scaleY
             };
        };

        // Mouse support (desktop)
        this.canvas.addEventListener('mousedown', (e) => {
             const pos = getPointerPos(e);
             this.handlePointer(pos.x, pos.y);
        });
        // Touch handled externally in main.js (swipe detection)
    }

    handlePointer(x, y) {
        if (this.isAnimating || this.gameOver) return;

        const c = Math.floor(x / this.cellSize);
        const r = Math.floor(y / this.cellSize);

        if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) return;

        if (!this.selectedGem) {
            this.selectedGem = { r, c };
        } else {
            const dr = Math.abs(this.selectedGem.r - r);
            const dc = Math.abs(this.selectedGem.c - c);

            if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
                this.swapGems(this.selectedGem, { r, c });
                this.selectedGem = null;
            } else {
                this.selectedGem = { r, c };
            }
        }
    }

    moveCursor(dr, dc) {
        if (this.gameOver) return;
        const newR = this.cursorPos.r + dr;
        const newC = this.cursorPos.c + dc;
        if (newR >= 0 && newR < GRID_SIZE && newC >= 0 && newC < GRID_SIZE) {
            this.cursorPos = { r: newR, c: newC };
        }
    }

    actionCursor() {
        if (this.gameOver || this.isAnimating) return;
        const { r, c } = this.cursorPos;

        if (!this.selectedGem) {
            this.selectedGem = { r, c };
        } else {
            const dr = Math.abs(this.selectedGem.r - r);
            const dc = Math.abs(this.selectedGem.c - c);

            if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
                this.swapGems(this.selectedGem, { r, c });
                this.selectedGem = null;
            } else {
                this.selectedGem = { r, c };
            }
        }
    }

    async swapGems(p1, p2, isUndo = false) {
        this.isAnimating = true;
        
        const gem1 = this.grid[p1.r][p1.c];
        const gem2 = this.grid[p2.r][p2.c];
        
        gem1.targetX = p2.c * this.cellSize;
        gem1.targetY = p2.r * this.cellSize;
        gem2.targetX = p1.c * this.cellSize;
        gem2.targetY = p1.r * this.cellSize;

        [this.grid[p1.r][p1.c], this.grid[p2.r][p2.c]] = [this.grid[p2.r][p2.c], this.grid[p1.r][p1.c]];

        await new Promise(res => setTimeout(res, 300));

        if (!isUndo) {
            const matchesDetailed = this.findMatchesWithDetails();
            if (matchesDetailed.length > 0) {
                this.processMatchesDetailed(matchesDetailed);
            } else {
                this.swapGems(p1, p2, true);
            }
        } else {
            this.isAnimating = false;
        }
    }

    findMatchesWithDetails() {
        const matches = [];
        for (let r = 0; r < GRID_SIZE; r++) {
            let rowMatch = [{ r, c: 0, type: this.grid[r][0].type }];
            for (let c = 1; c < GRID_SIZE; c++) {
                if (this.grid[r][c].type === rowMatch[0].type) {
                    rowMatch.push({ r, c, type: this.grid[r][c].type });
                } else {
                    if (rowMatch.length >= 3) matches.push([...rowMatch]);
                    rowMatch = [{ r, c, type: this.grid[r][c].type }];
                }
            }
            if (rowMatch.length >= 3) matches.push(rowMatch);
        }
        for (let c = 0; c < GRID_SIZE; c++) {
            let colMatch = [{ r: 0, c, type: this.grid[0][c].type }];
            for (let r = 1; r < GRID_SIZE; r++) {
                if (this.grid[r][c].type === colMatch[0].type) {
                    colMatch.push({ r, c, type: this.grid[r][c].type });
                } else {
                    if (colMatch.length >= 3) matches.push([...colMatch]);
                    colMatch = [{ r, c, type: this.grid[r][c].type }];
                }
            }
            if (colMatch.length >= 3) matches.push(colMatch);
        }
        return matches;
    }

    findMatches() {
        const set = new Set();
        this.findMatchesWithDetails().forEach(match => {
            match.forEach((m) => set.add(`${m.r},${m.c}`));
        });
        return Array.from(set).map(s => { const [r,c] = s.split(',').map(Number); return {r,c}; });
    }

    async processMatchesDetailed(matchesArr) {
        let totalMatched = 0;
        
        matchesArr.forEach(match => {
            totalMatched += match.length;
            const center = match[Math.floor(match.length / 2)];
            
            match.forEach((m) => {
                const g = this.grid[m.r][m.c];
                if (g.isPrismatic) this.clearCross(m.r, m.c);
                else if (g.isRowBlast) this.clearRow(m.r);
            });

            if (match.length >= 5) {
                this.grid[center.r][center.c].isPrismatic = true; 
                this.addFloatingText(center.c * this.cellSize, center.r * this.cellSize, "ULTRA BLAST!");
            } else if (match.length === 4) {
                this.grid[center.r][center.c].isRowBlast = true;
                this.addFloatingText(center.c * this.cellSize, center.r * this.cellSize, "LINE BLAST!");
            }

            match.forEach((m) => this.grid[m.r][m.c].isMatching = true);
        });

        this.score += totalMatched * 10 * this.combo;
        this.shakeTime = 0.3;
        await this.processFinalize();
    }

    clearCross(row, col) {
        for (let c = 0; c < GRID_SIZE; c++) this.grid[row][c].isMatching = true;
        for (let r = 0; r < GRID_SIZE; r++) this.grid[r][col].isMatching = true;
        this.shakeTime = 0.7;
        this.score += 250;
    }

    clearRow(row) {
        for (let c = 0; c < GRID_SIZE; c++) this.grid[row][c].isMatching = true;
        this.shakeTime = 0.4;
        this.score += 100;
    }

    async processFinalize() {
        for (let c = 0; c < GRID_SIZE; c++) {
            let emptySpaces = 0;
            for (let r = GRID_SIZE - 1; r >= 0; r--) {
                if (this.grid[r][c].isMatching) {
                    this.createParticles(c * this.cellSize, r * this.cellSize, COLORS[this.grid[r][c].type]);
                    emptySpaces++;
                } else if (emptySpaces > 0) {
                    const gem = this.grid[r][c];
                    this.grid[r + emptySpaces][c] = gem;
                    gem.targetY = (r + emptySpaces) * this.cellSize;
                }
            }
            for (let i = 0; i < emptySpaces; i++) this.grid[i][c] = this.createGem(i, c);
        }

        await new Promise(res => setTimeout(res, 400));
        
        const newMatches = this.findMatches();
        if (newMatches.length > 0) {
            this.combo++;
            this.processMatchesDetailed(this.findMatchesWithDetails());
        } else {
            this.combo = 1;
            this.isAnimating = false;
        }
    }

    createParticles(x, y, color) {
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: x + this.cellSize/2, y: y + this.cellSize/2,
                vx: (Math.random() - 0.5) * 15,
                vy: (Math.random() - 0.5) * 15,
                size: Math.random() * 6 + 2, alpha: 1, color
            });
        }
    }

    addFloatingText(x, y, text) {
        this.floatingTexts.push({ x, y, text, alpha: 1 });
    }

    startTimer() {
        const itv = setInterval(() => {
            if (this.gameOver) { clearInterval(itv); return; }
            this.timeLeft--;
            if (this.timeLeft <= 0) this.handleGameOver();
        }, 1000);
    }

    handleGameOver() {
        this.gameOver = true;
        this.isAnimating = true;
        sdk.submitScore({ score: this.score, metadata: { game_id: 'crystal-match', category: 'Puzzle' } });
    }

    animate(time) {
        const dt = (time - this.lastUpdate) / 1000;
        this.lastUpdate = time;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        if (this.shakeTime > 0) {
            this.ctx.translate((Math.random() - 0.5) * 15, (Math.random() - 0.5) * 15);
            this.shakeTime -= dt;
        }

        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                const gem = this.grid[r][c];
                gem.x += (gem.targetX - gem.x) * 0.25;
                gem.y += (gem.targetY - gem.y) * 0.25;
                if (gem.isMatching) gem.scale *= 0.75;

                this.ctx.save();
                this.ctx.translate(gem.x + this.cellSize / 2, gem.y + this.cellSize / 2);

                if (this.selectedGem?.r === r && this.selectedGem?.c === c) {
                     this.ctx.lineWidth = 5;
                     this.ctx.strokeStyle = "#fff";
                     this.ctx.strokeRect(-this.cellSize/2 + 5, -this.cellSize/2 + 5, this.cellSize - 10, this.cellSize - 10);
                     this.ctx.shadowBlur = 15; this.ctx.shadowColor = "#fff";
                }

                if (this.cursorPos?.r === r && this.cursorPos?.c === c && !this.gameOver) {
                     this.ctx.lineWidth = 3;
                     this.ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
                     this.ctx.setLineDash([4, 4]);
                     this.ctx.strokeRect(-this.cellSize/2 + 2, -this.cellSize/2 + 2, this.cellSize - 4, this.cellSize - 4);
                     this.ctx.setLineDash([]);
                }

                this.ctx.scale(gem.scale, gem.scale);
                
                if (gem.isPrismatic) {
                    this.ctx.shadowBlur = 40; this.ctx.shadowColor = "#fff";
                    this.ctx.fillStyle = "#fff";
                    this.ctx.beginPath(); this.ctx.rotate(time / 300);
                    for (let i = 0; i < 10; i++) { 
                        this.ctx.rotate(Math.PI / 5); 
                        this.ctx.lineTo(0, this.cellSize / 2 - 2); 
                        this.ctx.lineTo(5, 0); 
                    }
                } else if (gem.isRowBlast) {
                    this.ctx.shadowBlur = 25; this.ctx.shadowColor = COLORS[gem.type];
                    this.ctx.fillStyle = COLORS[gem.type];
                    this.ctx.beginPath();
                    for (let i = 0; i < 6; i++) {
                         const a = (Math.PI/3) * i;
                         this.ctx.lineTo(Math.cos(a) * (this.cellSize/2 - 6), Math.sin(a) * (this.cellSize/2 - 6));
                    }
                } else {
                    this.ctx.shadowBlur = 15; this.ctx.shadowColor = COLORS[gem.type];
                    this.ctx.fillStyle = COLORS[gem.type];
                    this.ctx.beginPath(); this.ctx.arc(0, 0, (this.cellSize / 2) * 0.85, 0, Math.PI * 2);
                }
                this.ctx.fill();
                this.ctx.restore();
            }
        }
        this.ctx.restore();

        // Particles
        this.particles = this.particles.filter(p => (p.alpha -= 0.02) > 0);
        this.particles.forEach(p => {
            p.x += p.vx; p.y += p.vy;
            this.ctx.globalAlpha = p.alpha;
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(p.x, p.y, p.size, p.size);
        });

        // Floating combo texts
        this.floatingTexts = this.floatingTexts.filter(t => (t.alpha -= 0.02) > 0);
        this.floatingTexts.forEach(t => {
            t.y -= 2;
            this.ctx.globalAlpha = t.alpha;
            this.ctx.fillStyle = '#f472b6';
            this.ctx.font = "bold 18px 'Inter'";
            this.ctx.textAlign = "center";
            this.ctx.fillText(t.text, t.x + this.cellSize/2, t.y);
        });

        this.ctx.globalAlpha = 1;
        if (this.gameOver) {
            this.ctx.fillStyle = "rgba(2, 6, 23, 0.95)"; 
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = "#fff"; 
            this.ctx.textAlign = "center";
            
            this.ctx.font = "italic 900 64px 'Outfit'"; 
            this.ctx.shadowBlur = 30; this.ctx.shadowColor = "#38bdf8";
            this.ctx.fillText("MISSION", this.canvas.width/2, this.canvas.height/2 - 40);
            this.ctx.fillText("COMPLETE", this.canvas.width/2, this.canvas.height/2 + 30);
            
            this.ctx.shadowBlur = 0;
            this.ctx.font = "900 24px 'Inter'"; 
            this.ctx.fillStyle = "rgba(255,255,255,0.6)";
            this.ctx.fillText(`TOTAL SCORE: ${this.score}`, this.canvas.width/2, this.canvas.height/2 + 100);
            
            this.ctx.fillStyle = "#38bdf8";
            this.ctx.font = "900 12px 'Outfit'";
            this.ctx.fillText("RANKING SUBMITTED", this.canvas.width/2, this.canvas.height/2 + 130);
        }

        requestAnimationFrame((t) => this.animate(t));
    }
}
