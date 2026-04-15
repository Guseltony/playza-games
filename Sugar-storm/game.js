const CELL_SIZE = 78;
const BOARD_SIZE = 8;
const CANDY_TYPES = ["strawberry", "blueberry", "lemon", "mint", "grape", "orange"];
const BOARD_PIXELS = CELL_SIZE * BOARD_SIZE;
const CANDY_COLORS = {
  strawberry: "#ff5d8f",
  blueberry: "#4fb3ff",
  lemon: "#ffd33d",
  mint: "#53d98d",
  grape: "#8f6fff",
  orange: "#ff9c3d",
};

const SPECIALS = {
  STRIPED_H: "stripedH",
  STRIPED_V: "stripedV",
  WRAPPED: "wrapped",
  COLOR_BOMB: "colorBomb",
  INGREDIENT: "ingredient",
};

const LEVELS = [
  { moves: 24, target: 4200, goals: { strawberry: 14, lemon: 12 }, jellyTargets: 0 },
  { moves: 22, target: 6500, goals: { blueberry: 15, mint: 14 }, jellyTargets: 0 },
  { moves: 20, target: 8800, goals: { grape: 16, orange: 16 }, jellyTargets: 0 },
  { moves: 19, target: 10200, goals: { strawberry: 15, blueberry: 15 }, jellyTargets: 0 },
  { moves: 18, target: 11800, goals: { lemon: 16, grape: 16 }, jellyTargets: 8 },
];

const BOARD_SHAPES = [
  {
    name: "Classic",
    mask: [
      "11111111",
      "11111111",
      "11111111",
      "11111111",
      "11111111",
      "11111111",
      "11111111",
      "11111111",
    ],
  },
  {
    name: "Diamond",
    mask: [
      "00011000",
      "00111100",
      "01111110",
      "11111111",
      "11111111",
      "01111110",
      "00111100",
      "00011000",
    ],
  },
  {
    name: "Twin Towers",
    mask: [
      "11011011",
      "11011011",
      "11111111",
      "11111111",
      "11111111",
      "11111111",
      "11011011",
      "11011011",
    ],
  },
  {
    name: "Hourglass",
    mask: [
      "11111111",
      "01111110",
      "00111100",
      "00011000",
      "00011000",
      "00111100",
      "01111110",
      "11111111",
    ],
  },
];

class SugarStormGame {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");

    this.scoreValue = document.getElementById("scoreValue");
    this.movesValue = document.getElementById("movesValue");
    this.levelValue = document.getElementById("levelValue");
    this.targetValue = document.getElementById("targetValue");
    this.chainValue = document.getElementById("chainValue");
    this.boardTypeValue = document.getElementById("boardTypeValue");
    this.goalList = document.getElementById("goalList");
    this.messageLine = document.getElementById("messageLine");
    this.infoButton = document.getElementById("infoButton");
    this.shuffleCount = document.getElementById("shuffleCount");
    this.mobileInfoPanel = document.getElementById("mobileInfoPanel");

    this.overlay = document.getElementById("overlay");
    this.overlayKicker = document.getElementById("overlayKicker");
    this.overlayTitle = document.getElementById("overlayTitle");
    this.overlayText = document.getElementById("overlayText");
    this.overlayButton = document.getElementById("overlayButton");

    this.shuffleButton = document.getElementById("shuffleButton");
    this.screenOverlay = document.getElementById("screenOverlay");
    this.screenKicker = document.getElementById("screenKicker");
    this.screenTitle = document.getElementById("screenTitle");
    this.screenText = document.getElementById("screenText");
    this.screenButton = document.getElementById("screenButton");
    this.mapStrip = document.getElementById("mapStrip");

    this.board = [];
    this.selected = null;
    this.hintCells = [];
    this.hintTimer = 0;
    this.messageTimer = 0;
    this.particles = [];
    this.isBusy = false;
    this.isGameOver = false;
    this.levelComplete = false;
    this.levelIndex = 0;
    this.totalScore = 0;
    this.movesLeft = 0;
    this.levelTarget = 0;
    this.goalState = {};
    this.lastTimestamp = 0;
    this.shape = BOARD_SHAPES[0];
    this.chainMultiplier = 1;
    this.jellyGrid = [];
    this.jellyRemaining = 0;
    this.blockerGrid = [];
    this.blockerRemaining = 0;
    this.ingredientRemaining = 0;
    this.started = false;
    this.audioContext = null;
    this.popupTexts = [];
    this.stageMode = "Standard";
    this.carryMoves = 0;
    this.carrySpecials = [];
    this.shufflesLeft = 2;

    this.setupEvents();
    this.buildBoardPreview();
    this.renderMapStrip();
    this.showScreen("Sugar Storm Smash", "Endless Sweet Run", "Beat the opening stages, then continue forever through generated levels with harder targets, shape changes, jelly tiles, and extra pressure.", "Start Run");
    this.resizeCanvas();
    window.addEventListener("resize", () => this.resizeCanvas());
    requestAnimationFrame((timestamp) => this.tick(timestamp));
  }

  setupEvents() {
    this.canvas.addEventListener("click", (event) => this.handlePointer(event.clientX, event.clientY));
    this.canvas.addEventListener(
      "touchstart",
      (event) => {
        event.preventDefault();
        const touch = event.touches[0];
        this.handlePointer(touch.clientX, touch.clientY);
      },
      { passive: false },
    );

    this.shuffleButton.addEventListener("click", () => {
      if (!this.isBusy && !this.isGameOver && this.shufflesLeft > 0) {
        this.shufflesLeft -= 1;
        this.shuffleBoard(true);
        this.syncHud();
      }
    });
    this.infoButton.addEventListener("click", () => {
      this.mobileInfoPanel.classList.toggle("hidden");
    });
    this.screenButton.addEventListener("click", () => {
      this.unlockAudio();
      this.started = true;
      this.hideScreen();
      this.startLevel(0, true);
    });

    this.overlayButton.addEventListener("click", () => {
      if (this.levelComplete) {
        this.startLevel(this.levelIndex + 1, false);
      } else {
        this.restartGame();
      }
    });
  }

  buildBoardPreview() {
    this.shape = BOARD_SHAPES[0];
    this.board = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
    for (let row = 0; row < BOARD_SIZE; row += 1) {
      for (let col = 0; col < BOARD_SIZE; col += 1) {
        this.board[row][col] = this.createPiece(this.randomCandyType(), row, col);
      }
    }
    this.jellyGrid = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0));
    this.blockerGrid = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0));
  }

  renderMapStrip() {
    if (!this.mapStrip) {
      return;
    }
    this.mapStrip.innerHTML = "";
    const level = this.levelIndex + 1 || 1;
    const nodes = [
      `Lv ${Math.max(1, level - 1)}`,
      `Lv ${level}`,
      this.stageMode === "Standard" ? this.shape.name : this.stageMode,
      level >= 4 ? "Endless" : "Opening",
      `Target ${Math.round(this.levelTarget / 100) * 100 || 4200}`,
    ];
    nodes.forEach((label, index) => {
      const item = document.createElement("div");
      item.className = `map-node${index % 2 ? " alt" : ""}${index === 1 ? " current" : ""}`;
      item.textContent = label;
      this.mapStrip.appendChild(item);
    });
  }

  showScreen(kicker, title, text, buttonLabel) {
    this.screenKicker.textContent = kicker;
    this.screenTitle.textContent = title;
    this.screenText.textContent = text;
    this.screenButton.textContent = buttonLabel;
    this.screenOverlay.classList.remove("hidden");
  }

  hideScreen() {
    this.screenOverlay.classList.add("hidden");
  }

  unlockAudio() {
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
      }
    }
    if (this.audioContext?.state === "suspended") {
      this.audioContext.resume();
    }
  }

  playTone(freq, duration, type = "sine", volume = 0.03) {
    if (!this.audioContext) {
      return;
    }
    const now = this.audioContext.currentTime;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(this.audioContext.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  resizeCanvas() {
    const rect = this.canvas.getBoundingClientRect();
    const ratio = Math.max(1, Math.min(window.devicePixelRatio || 1, 2.5));
    const scaleX = rect.width / BOARD_PIXELS;
    const scaleY = rect.height / BOARD_PIXELS;
    this.canvas.width = Math.floor(rect.width * ratio);
    this.canvas.height = Math.floor(rect.height * ratio);
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = "high";
    this.ctx.setTransform(ratio * scaleX, 0, 0, ratio * scaleY, 0, 0);
  }

  restartGame() {
    this.totalScore = 0;
    this.carryMoves = 0;
    this.carrySpecials = [];
    this.startLevel(0, true);
  }

  startLevel(index, resetScore) {
    if (resetScore) {
      this.totalScore = 0;
    }

    const config = LEVELS[index] || this.makeGeneratedLevel(index);
    this.shape = this.pickShape(index);
    this.stageMode = config.stageMode || "Standard";
    this.levelIndex = index;
    this.movesLeft = config.moves + this.carryMoves;
    this.levelTarget = config.target;
    this.goalState = { ...config.goals };
    this.jellyRemaining = 0;
    this.blockerRemaining = 0;
    this.ingredientRemaining = config.ingredientGoal || 0;
    this.selected = null;
    this.hintCells = [];
    this.hintTimer = 0;
    this.messageTimer = 0;
    this.particles = [];
    this.isBusy = false;
    this.isGameOver = false;
    this.levelComplete = false;
    this.chainMultiplier = 1;
    this.shufflesLeft = 2;
    this.mobileInfoPanel.classList.add("hidden");
    this.hideOverlay();
    this.buildBoard();
    this.applyCarrySpecials();
    this.seedJelly(config.jellyTargets || 0);
    this.seedBlockers(config.blockerCount || 0);
    this.ensureIngredientOnBoard();
    this.renderMapStrip();
    this.carryMoves = 0;
    this.setMessage(`Level ${index + 1}: ${this.stageMode} on ${this.shape.name}. Reach ${config.target.toLocaleString()} and clear the board goals.`);
    this.syncHud();
  }

  makeGeneratedLevel(index) {
    const goalCount = index >= 16 ? 4 : index >= 8 ? 3 : 2;
    const goalTypes = Array.from({ length: goalCount }, (_, offset) => CANDY_TYPES[(index + offset * 2) % CANDY_TYPES.length]);
    let stageMode = "Standard";
    let moves = Math.max(16, 24 - Math.min(index, 8));
    let target = 4200 + index * 2200;
    let jellyTargets = index >= 4 ? Math.min(18, 4 + index) : 0;
    let blockerCount = index >= 6 ? Math.min(16, 4 + index) : 0;
    let ingredientGoal = index >= 7 && (index + 1) % 6 === 0 ? Math.min(3, 1 + Math.floor(index / 10)) : 0;
    const goals = {};
    goalTypes.forEach((type, offset) => {
      goals[type] = Math.max(10, 14 + Math.min(index, 8) - offset * 2);
    });

    if ((index + 1) % 5 === 0) {
      stageMode = "Rush";
      moves = Math.max(12, moves - 3);
      target += 1800;
      jellyTargets += 2;
    } else if ((index + 1) % 7 === 0) {
      stageMode = "Jelly Flood";
      jellyTargets = Math.min(24, jellyTargets + 6);
    } else if ((index + 1) % 10 === 0) {
      stageMode = "Boss Mix";
      target += 2600;
      blockerCount = Math.min(22, blockerCount + 8);
      ingredientGoal = Math.max(ingredientGoal, 2);
      moves = Math.max(12, moves - 2);
    }

    return {
      moves,
      target,
      goals,
      jellyTargets,
      blockerCount,
      ingredientGoal,
      stageMode,
    };
  }

  pickShape(index) {
    if (index < 4) {
      return BOARD_SHAPES[0];
    }

    if (index < 7) {
      return BOARD_SHAPES[1];
    }

    if (index < 10) {
      return BOARD_SHAPES[3];
    }

    if (index < 13) {
      return BOARD_SHAPES[2];
    }

    const cycle = [
      BOARD_SHAPES[1],
      BOARD_SHAPES[1],
      BOARD_SHAPES[3],
      BOARD_SHAPES[2],
      BOARD_SHAPES[3],
      BOARD_SHAPES[2],
    ];
    return cycle[(index - 13) % cycle.length];
  }

  isPlayableCell(row, col) {
    return this.shape.mask[row][col] === "1";
  }

  seedJelly(count) {
    this.jellyGrid = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0));
    const active = this.allCells();
    for (let i = active.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [active[i], active[j]] = [active[j], active[i]];
    }
    const selected = active.slice(0, Math.min(count, active.length));
    selected.forEach(({ row, col }) => {
      this.jellyGrid[row][col] = 1;
    });
    this.jellyRemaining = selected.length;
  }

  seedBlockers(count) {
    this.blockerGrid = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0));
    const active = this.allCells().filter(({ row, col }) => !this.board[row][col]?.special);
    for (let i = active.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [active[i], active[j]] = [active[j], active[i]];
    }
    const selected = active.slice(0, Math.min(count, active.length));
    selected.forEach(({ row, col }, index) => {
      this.blockerGrid[row][col] = index % 3 === 0 ? 2 : 1;
    });
    this.blockerRemaining = selected.length;
  }

  ensureIngredientOnBoard() {
    if (this.ingredientRemaining <= 0 || this.board.flat().some((piece) => piece?.special === SPECIALS.INGREDIENT)) {
      return;
    }

    const topCells = [];
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      for (let row = 0; row < BOARD_SIZE; row += 1) {
        if (this.isPlayableCell(row, col) && !this.blockerGrid[row]?.[col]) {
          topCells.push({ row, col });
          break;
        }
      }
    }

    if (!topCells.length) {
      return;
    }

    const spawn = topCells[Math.floor(Math.random() * topCells.length)];
    const piece = this.createPiece("ingredient", spawn.row, spawn.col, SPECIALS.INGREDIENT);
    piece.drawRow = -1.2;
    this.board[spawn.row][spawn.col] = piece;
  }

  collectIngredientsAtBottom() {
    let collected = 0;
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      let bottomRow = -1;
      for (let row = BOARD_SIZE - 1; row >= 0; row -= 1) {
        if (this.isPlayableCell(row, col)) {
          bottomRow = row;
          break;
        }
      }
      if (bottomRow < 0) {
        continue;
      }

      const piece = this.board[bottomRow][col];
      if (piece?.special === SPECIALS.INGREDIENT) {
        this.spawnPopup("Drop!", { row: bottomRow, col }, "#fff7b0");
        this.spawnParticles([{ row: bottomRow, col }]);
        this.board[bottomRow][col] = null;
        this.ingredientRemaining = Math.max(0, this.ingredientRemaining - 1);
        collected += 1;
      }
    }

    if (collected > 0) {
      this.playTone(310, 0.18, "square", 0.04);
      this.dropPieces();
      this.fillNewPieces();
      this.ensureIngredientOnBoard();
      this.syncHud();
    }
  }

  applyCarrySpecials() {
    if (!this.carrySpecials.length) {
      return;
    }

    const cells = this.allCells().filter(({ row, col }) => !this.blockerGrid[row]?.[col]);
    for (let i = cells.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [cells[i], cells[j]] = [cells[j], cells[i]];
    }

    this.carrySpecials.forEach((carry, index) => {
      const cell = cells[index];
      if (!cell) {
        return;
      }
      const piece = this.board[cell.row][cell.col];
      piece.special = carry.special;
      piece.type = carry.special === SPECIALS.COLOR_BOMB ? "colorBomb" : carry.type;
      piece.scale = 1.2;
    });

    this.carrySpecials = [];
  }

  captureCarryover() {
    this.carryMoves = Math.max(0, this.movesLeft);
    this.carrySpecials = this.board
      .flat()
      .filter((piece) => this.isPowerSpecial(piece))
      .map((piece) => ({ special: piece.special, type: piece.type }))
      .slice(0, 6);
  }

  buildBoard() {
    this.board = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));

    for (let row = 0; row < BOARD_SIZE; row += 1) {
      for (let col = 0; col < BOARD_SIZE; col += 1) {
        if (!this.isPlayableCell(row, col)) {
          continue;
        }
        let piece = this.createPiece(this.randomCandyType(), row, col);
        while (this.wouldMatchOnSpawn(row, col, piece.type)) {
          piece = this.createPiece(this.randomCandyType(), row, col);
        }
        this.board[row][col] = piece;
      }
    }

    if (!this.findPossibleMove()) {
      this.shuffleBoard(false);
    }
  }

  createPiece(type, row, col, special = null) {
    return {
      type,
      row,
      col,
      drawRow: row,
      drawCol: col,
      scale: 1,
      pulse: Math.random() * Math.PI * 2,
      special,
    };
  }

  randomCandyType() {
    return CANDY_TYPES[Math.floor(Math.random() * CANDY_TYPES.length)];
  }

  wouldMatchOnSpawn(row, col, type) {
    const left1 = this.board[row][col - 1];
    const left2 = this.board[row][col - 2];
    if (left1 && left2 && left1.type === type && left2.type === type) {
      return true;
    }

    const up1 = this.board[row - 1]?.[col];
    const up2 = this.board[row - 2]?.[col];
    return Boolean(up1 && up2 && up1.type === type && up2.type === type);
  }

  syncHud() {
    this.scoreValue.textContent = this.totalScore.toLocaleString();
    this.movesValue.textContent = this.movesLeft;
    this.levelValue.textContent = this.levelIndex + 1;
    this.targetValue.textContent = this.levelTarget.toLocaleString();
    this.chainValue.textContent = `x${this.chainMultiplier}`;
    this.boardTypeValue.textContent = this.shape.name;
    this.shuffleCount.textContent = this.shufflesLeft;
    this.shuffleButton.disabled = this.shufflesLeft <= 0;
    this.renderGoals();
  }

  renderGoals() {
    this.goalList.innerHTML = "";

    if (this.ingredientRemaining > 0) {
      const item = document.createElement("div");
      item.className = "goal-item";
      item.innerHTML = `<div class="goal-left"><span class="goal-badge" style="background: linear-gradient(135deg, #fff7d1, #ff9c3d)"></span><strong>Drop</strong></div><span>${this.ingredientRemaining} left</span>`;
      this.goalList.appendChild(item);
    }

    if (this.blockerRemaining > 0) {
      const item = document.createElement("div");
      item.className = "goal-item";
      item.innerHTML = `<div class="goal-left"><span class="goal-badge" style="background: linear-gradient(135deg, #b9b4cf, #6e628f)"></span><strong>Crates</strong></div><span>${this.blockerRemaining} left</span>`;
      this.goalList.appendChild(item);
    }

    if (this.jellyRemaining > 0) {
      const item = document.createElement("div");
      item.className = "goal-item";
      item.innerHTML = `<div class="goal-left"><span class="goal-badge" style="background: linear-gradient(135deg, #8fd3ff, #ffffff)"></span><strong>Jelly</strong></div><span>${this.jellyRemaining} left</span>`;
      this.goalList.appendChild(item);
    }

    Object.entries(this.goalState).forEach(([type, count]) => {
      const item = document.createElement("div");
      item.className = "goal-item";

      const left = document.createElement("div");
      left.className = "goal-left";

      const badge = document.createElement("span");
      badge.className = "goal-badge";
      badge.style.background = CANDY_COLORS[type];

      const label = document.createElement("strong");
      label.textContent = this.capitalize(type);

      const remaining = document.createElement("span");
      remaining.textContent = count <= 0 ? "Done" : `${count} left`;

      left.appendChild(badge);
      left.appendChild(label);
      item.appendChild(left);
      item.appendChild(remaining);
      this.goalList.appendChild(item);
    });
  }

  setMessage(message) {
    this.messageLine.textContent = message;
    this.messageTimer = 4.5;
  }

  handlePointer(clientX, clientY) {
    if (this.isBusy || this.isGameOver) {
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const cell = rect.width / BOARD_SIZE;
    const col = Math.floor(x / cell);
    const row = Math.floor(y / cell);

    if (!this.isInside(row, col)) {
      return;
    }

    if (!this.board[row][col]) {
      this.selected = null;
      return;
    }

    this.hintTimer = 0;
    this.hintCells = [];

    if (!this.selected) {
      this.selected = { row, col };
      return;
    }

    if (this.selected.row === row && this.selected.col === col) {
      this.selected = null;
      return;
    }

    if (this.isAdjacent(this.selected.row, this.selected.col, row, col)) {
      this.attemptSwap(this.selected.row, this.selected.col, row, col);
      this.selected = null;
      return;
    }

    this.selected = { row, col };
  }

  isInside(row, col) {
    return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
  }

  isAdjacent(r1, c1, r2, c2) {
    return Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;
  }

  async attemptSwap(r1, c1, r2, c2) {
    this.isBusy = true;
    this.chainMultiplier = 1;
    const a = this.board[r1][c1];
    const b = this.board[r2][c2];

    this.swapPieces(a, b);
    await this.wait(140);

    const combo = this.resolveDirectCombo(a, b);
    const matches = this.findMatches();

    if (!combo && matches.length === 0) {
      this.swapPieces(a, b);
      await this.wait(140);
      this.setMessage("That move needs a better combo.");
      this.syncHud();
      this.isBusy = false;
      return;
    }

    this.movesLeft -= 1;
    this.syncHud();

    if (combo) {
      await this.resolveEffects(combo);
      await this.runCascadeLoop();
    } else {
      await this.resolveMatches(matches, [a, b]);
      await this.runCascadeLoop();
    }

    this.checkGameState();
    this.isBusy = false;
  }

  resolveDirectCombo(a, b) {
    if (this.isPowerSpecial(a) && this.isPowerSpecial(b) && a.special === SPECIALS.COLOR_BOMB && b.special === SPECIALS.COLOR_BOMB) {
      return this.allCells();
    }

    if (a.special === SPECIALS.COLOR_BOMB) {
      return this.collectTypeCells(b.type, true);
    }

    if (b.special === SPECIALS.COLOR_BOMB) {
      return this.collectTypeCells(a.type, true);
    }

    if (this.isPowerSpecial(a) || this.isPowerSpecial(b)) {
      return [
        { row: a.row, col: a.col },
        { row: b.row, col: b.col },
      ];
    }

    return null;
  }

  collectTypeCells(type, includeBombs) {
    const result = [];
    for (let row = 0; row < BOARD_SIZE; row += 1) {
      for (let col = 0; col < BOARD_SIZE; col += 1) {
        const piece = this.board[row][col];
        if (!piece) {
          continue;
        }
        if (piece.type === type || (includeBombs && piece.special === SPECIALS.COLOR_BOMB)) {
          result.push({ row, col });
        }
      }
    }
    return result;
  }

  isPowerSpecial(piece) {
    return piece && [
      SPECIALS.STRIPED_H,
      SPECIALS.STRIPED_V,
      SPECIALS.WRAPPED,
      SPECIALS.COLOR_BOMB,
    ].includes(piece.special);
  }

  async runCascadeLoop() {
    while (true) {
      const matches = this.findMatches();
      if (!matches.length) {
        break;
      }
      this.chainMultiplier += 1;
      this.syncHud();
      await this.resolveMatches(matches, null);
    }
  }

  findMatches() {
    const groups = [];

    for (let row = 0; row < BOARD_SIZE; row += 1) {
      let streak = [{ row, col: 0 }];
      for (let col = 1; col <= BOARD_SIZE; col += 1) {
        const current = col < BOARD_SIZE ? this.board[row][col] : null;
        const prev = this.board[row][col - 1];
        const same = current && prev && current.type === prev.type && !current.special && !prev.special;
        if (same) {
          streak.push({ row, col });
        } else {
          if (streak.length >= 3) {
            groups.push(streak);
          }
          streak = col < BOARD_SIZE ? [{ row, col }] : [];
        }
      }
    }

    for (let col = 0; col < BOARD_SIZE; col += 1) {
      let streak = [{ row: 0, col }];
      for (let row = 1; row <= BOARD_SIZE; row += 1) {
        const current = row < BOARD_SIZE ? this.board[row][col] : null;
        const prev = this.board[row - 1][col];
        const same = current && prev && current.type === prev.type && !current.special && !prev.special;
        if (same) {
          streak.push({ row, col });
        } else {
          if (streak.length >= 3) {
            groups.push(streak);
          }
          streak = row < BOARD_SIZE ? [{ row, col }] : [];
        }
      }
    }

    return groups;
  }

  async resolveMatches(matchGroups, preferredPieces) {
    const clusters = this.mergeMatchGroups(matchGroups);
    const removals = new Map();
    const upgrades = [];

    for (const cluster of clusters) {
      cluster.cells.forEach((cell) => removals.set(`${cell.row},${cell.col}`, cell));
      const upgrade = this.chooseSpecial(cluster, preferredPieces);
      if (upgrade) {
        removals.delete(`${upgrade.row},${upgrade.col}`);
        upgrades.push(upgrade);
      }
    }

    upgrades.forEach((upgrade) => {
      const piece = this.board[upgrade.row][upgrade.col];
      piece.special = upgrade.special;
      if (upgrade.special === SPECIALS.COLOR_BOMB) {
        piece.type = "colorBomb";
      }
      piece.scale = 1.25;
    });

    await this.resolveEffects(Array.from(removals.values()));
  }

  mergeMatchGroups(groups) {
    const merged = [];
    const used = new Set();

    for (let i = 0; i < groups.length; i += 1) {
      if (used.has(i)) {
        continue;
      }

      const cells = new Map();
      const rows = new Map();
      const cols = new Map();
      const stack = [i];

      while (stack.length) {
        const idx = stack.pop();
        if (used.has(idx)) {
          continue;
        }
        used.add(idx);

        groups[idx].forEach((cell) => {
          const key = `${cell.row},${cell.col}`;
          cells.set(key, cell);
          rows.set(cell.row, (rows.get(cell.row) || 0) + 1);
          cols.set(cell.col, (cols.get(cell.col) || 0) + 1);
        });

        for (let j = i + 1; j < groups.length; j += 1) {
          if (used.has(j)) {
            continue;
          }
          const intersects = groups[j].some((cell) => cells.has(`${cell.row},${cell.col}`));
          if (intersects) {
            stack.push(j);
          }
        }
      }

      merged.push({ cells: Array.from(cells.values()), rows, cols });
    }

    return merged;
  }

  chooseSpecial(cluster, preferredPieces) {
    const rowMax = Math.max(...cluster.rows.values());
    const colMax = Math.max(...cluster.cols.values());
    let special = null;

    if (rowMax >= 5 || colMax >= 5) {
      special = SPECIALS.COLOR_BOMB;
    } else if (rowMax >= 3 && colMax >= 3 && cluster.cells.length >= 5) {
      special = SPECIALS.WRAPPED;
    } else if (rowMax === 4) {
      special = SPECIALS.STRIPED_H;
    } else if (colMax === 4) {
      special = SPECIALS.STRIPED_V;
    }

    if (!special) {
      return null;
    }

    let anchor = null;
    if (preferredPieces) {
      anchor = preferredPieces.find((piece) => cluster.cells.some((cell) => cell.row === piece.row && cell.col === piece.col));
    }

    if (!anchor) {
      anchor = cluster.cells[Math.floor(cluster.cells.length / 2)];
    }

    return { row: anchor.row, col: anchor.col, special };
  }

  async resolveEffects(initialCells) {
    const pending = [...initialCells];
    const visited = new Set();
    const removals = new Map();

    while (pending.length) {
      const cell = pending.pop();
      const key = `${cell.row},${cell.col}`;
      if (visited.has(key) || !this.isInside(cell.row, cell.col)) {
        continue;
      }
      visited.add(key);

      const piece = this.board[cell.row][cell.col];
      if (!piece) {
        continue;
      }

      if (piece.special !== SPECIALS.INGREDIENT && this.blockerGrid[cell.row]?.[cell.col] > 0) {
        this.blockerGrid[cell.row][cell.col] -= 1;
        if (this.blockerGrid[cell.row][cell.col] === 0) {
          this.blockerRemaining = Math.max(0, this.blockerRemaining - 1);
        }
        this.spawnPopup("Crack!", cell, "#efe7ff");
        continue;
      }

      if (piece.special === SPECIALS.INGREDIENT) {
        continue;
      }

      removals.set(key, cell);

      if (piece.special === SPECIALS.STRIPED_H) {
        for (let col = 0; col < BOARD_SIZE; col += 1) {
          pending.push({ row: cell.row, col });
        }
      } else if (piece.special === SPECIALS.STRIPED_V) {
        for (let row = 0; row < BOARD_SIZE; row += 1) {
          pending.push({ row, col: cell.col });
        }
      } else if (piece.special === SPECIALS.WRAPPED) {
        for (let row = cell.row - 1; row <= cell.row + 1; row += 1) {
          for (let col = cell.col - 1; col <= cell.col + 1; col += 1) {
            pending.push({ row, col });
          }
        }
      } else if (piece.special === SPECIALS.COLOR_BOMB) {
        this.collectTypeCells(this.pickDominantType(), false).forEach((target) => pending.push(target));
      }
    }

    const removedCells = Array.from(removals.values());
    this.collectRewards(removedCells);
    this.spawnParticles(removedCells);

    removedCells.forEach((cell) => {
      this.board[cell.row][cell.col] = null;
    });

    await this.wait(170);
    this.dropPieces();
    this.fillNewPieces();
    this.collectIngredientsAtBottom();
    this.ensureIngredientOnBoard();
    await this.wait(220);
  }

  pickDominantType() {
    const counts = Object.fromEntries(CANDY_TYPES.map((type) => [type, 0]));
    this.allCells().forEach(({ row, col }) => {
      const piece = this.board[row][col];
      if (piece && CANDY_TYPES.includes(piece.type)) {
        counts[piece.type] += 1;
      }
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  }

  collectRewards(cells) {
    const comboBonus = Math.max(0, cells.length - 3) * 45;
    const chainBonus = 1 + (this.chainMultiplier - 1) * 0.35;
    cells.forEach(({ row, col }) => {
      const piece = this.board[row][col];
      if (!piece) {
        return;
      }
      this.totalScore += Math.round((120 + comboBonus) * chainBonus);
      if (this.goalState[piece.type] !== undefined && this.goalState[piece.type] > 0) {
        this.goalState[piece.type] -= 1;
      }
      if (this.jellyGrid[row]?.[col] > 0) {
        this.jellyGrid[row][col] = 0;
        this.jellyRemaining = Math.max(0, this.jellyRemaining - 1);
      }
    });

    if (cells.length) {
      this.playTone(420 + cells.length * 16, 0.12 + Math.min(0.18, cells.length * 0.01), "triangle", 0.03);
    }
    if (cells.length >= 4) {
      this.spawnPopup(
        `Combo x${this.chainMultiplier}`,
        cells[Math.floor(cells.length / 2)],
        cells.length >= 7 ? "#fff29b" : "#ffffff",
      );
    }
    if (cells.length >= 6) {
      this.setMessage(`Tasty combo. You crushed ${cells.length} candies at x${this.chainMultiplier}.`);
    }

    this.syncHud();
  }

  spawnParticles(cells) {
    cells.forEach(({ row, col }) => {
      const piece = this.board[row][col];
      if (!piece) {
        return;
      }
      for (let i = 0; i < 8; i += 1) {
        this.particles.push({
          x: col * CELL_SIZE + CELL_SIZE / 2,
          y: row * CELL_SIZE + CELL_SIZE / 2,
          vx: (Math.random() - 0.5) * 150,
          vy: (Math.random() - 0.5) * 150,
          size: 3 + Math.random() * 5,
          life: 0.7 + Math.random() * 0.25,
          color: CANDY_COLORS[piece.type] || "#ffffff",
        });
      }
    });
  }

  spawnPopup(text, cell, color = "#ffffff") {
    if (!cell) {
      return;
    }
    this.popupTexts.push({
      text,
      x: cell.col * CELL_SIZE + CELL_SIZE / 2,
      y: cell.row * CELL_SIZE + CELL_SIZE / 2,
      life: 1.05,
      color,
    });
  }

  dropPieces() {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const activeRows = [];
      for (let row = 0; row < BOARD_SIZE; row += 1) {
        if (this.isPlayableCell(row, col)) {
          activeRows.push(row);
        }
      }

      const pieces = [];
      activeRows.forEach((row) => {
        const piece = this.board[row][col];
        if (piece) {
          pieces.push(piece);
        }
        this.board[row][col] = null;
      });

      let index = pieces.length - 1;
      for (let i = activeRows.length - 1; i >= 0; i -= 1) {
        const targetRow = activeRows[i];
        if (index < 0) {
          break;
        }
        const piece = pieces[index];
        this.board[targetRow][col] = piece;
        piece.row = targetRow;
        piece.col = col;
        index -= 1;
      }
    }
  }

  fillNewPieces() {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      for (let row = 0; row < BOARD_SIZE; row += 1) {
        if (!this.isPlayableCell(row, col) || this.board[row][col]) {
          continue;
        }
        const piece = this.createPiece(this.randomCandyType(), row, col);
        piece.drawRow = -1 - Math.random() * 2 - (col % 2) * 0.3;
        this.board[row][col] = piece;
      }
    }
  }

  checkGameState() {
    if (
      this.totalScore >= this.levelTarget &&
      Object.values(this.goalState).every((value) => value <= 0) &&
      this.jellyRemaining <= 0 &&
      this.blockerRemaining <= 0 &&
      this.ingredientRemaining <= 0
    ) {
      this.levelComplete = true;
      this.isGameOver = true;
      this.captureCarryover();
      this.showOverlay("Sugar Rush!", this.levelIndex + 1 >= 4 ? "Level Complete" : "Stage Clear", this.levelIndex + 1 >= 4 ? "You cleared the board. The endless run keeps going with a new challenge." : "You cleared the objectives and smashed the target score.", "Next Level");
      return;
    }

    if (this.movesLeft <= 0) {
      this.levelComplete = false;
      this.isGameOver = true;
      this.showOverlay("Close One", "Out of Moves", "Restart and chase a stronger combo chain.", "Play Again");
      return;
    }

    if (!this.findPossibleMove()) {
      this.shuffleBoard(true);
    }
  }

  showOverlay(kicker, title, text, buttonLabel) {
    this.overlayKicker.textContent = kicker;
    this.overlayTitle.textContent = title;
    this.overlayText.textContent = text;
    this.overlayButton.textContent = buttonLabel;
    this.overlay.classList.remove("hidden");
  }

  hideOverlay() {
    this.overlay.classList.add("hidden");
  }

  findPossibleMove() {
    for (let row = 0; row < BOARD_SIZE; row += 1) {
      for (let col = 0; col < BOARD_SIZE; col += 1) {
        const piece = this.board[row][col];
        if (!piece) {
          continue;
        }

        for (const [dr, dc] of [[0, 1], [1, 0]]) {
          const nextRow = row + dr;
          const nextCol = col + dc;
          if (!this.isInside(nextRow, nextCol)) {
            continue;
          }

          const target = this.board[nextRow][nextCol];
          if (!target) {
            continue;
          }
          if (this.isPowerSpecial(piece) || this.isPowerSpecial(target)) {
            this.hintCells = [{ row, col }, { row: nextRow, col: nextCol }];
            return true;
          }

          this.swapPieces(piece, target);
          const works = this.findMatches().length > 0;
          this.swapPieces(piece, target);

          if (works) {
            this.hintCells = [{ row, col }, { row: nextRow, col: nextCol }];
            return true;
          }
        }
      }
    }

    this.hintCells = [];
    return false;
  }

  shuffleBoard(showMessage) {
    const basePieces = this.board.flat().filter(Boolean);
    do {
      const pieces = [...basePieces];
      for (let i = pieces.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
      }

      for (let row = 0; row < BOARD_SIZE; row += 1) {
        for (let col = 0; col < BOARD_SIZE; col += 1) {
          if (!this.isPlayableCell(row, col)) {
            this.board[row][col] = null;
            continue;
          }
          const piece = pieces.shift();
          piece.row = row;
          piece.col = col;
          this.board[row][col] = piece;
        }
      }
    } while (this.findMatches().length > 0 || !this.findPossibleMove());

    if (showMessage) {
      this.setMessage("Board shuffled. Fresh candy combos are ready.");
    }
  }

  swapPieces(a, b) {
    const row = a.row;
    const col = a.col;
    this.board[a.row][a.col] = b;
    this.board[b.row][b.col] = a;
    a.row = b.row;
    a.col = b.col;
    b.row = row;
    b.col = col;
  }

  allCells() {
    const cells = [];
    for (let row = 0; row < BOARD_SIZE; row += 1) {
      for (let col = 0; col < BOARD_SIZE; col += 1) {
        if (this.isPlayableCell(row, col)) {
          cells.push({ row, col });
        }
      }
    }
    return cells;
  }

  tick(timestamp) {
    const delta = Math.min(0.033, (timestamp - this.lastTimestamp) / 1000 || 0.016);
    this.lastTimestamp = timestamp;
    this.update(delta);
    this.draw();
    requestAnimationFrame((next) => this.tick(next));
  }

  update(delta) {
    this.hintTimer += delta;
    if (this.messageTimer > 0) {
      this.messageTimer -= delta;
    } else if (!this.isGameOver) {
      this.messageLine.textContent =
        this.hintTimer > 8 && this.hintCells.length
          ? "Hint: the glowing candies can make a strong move."
          : "Match 4 or 5 to create special candy powers.";
    }

    this.board.flat().filter(Boolean).forEach((piece) => {
      piece.drawRow += (piece.row - piece.drawRow) * Math.min(1, delta * 14);
      piece.drawCol += (piece.col - piece.drawCol) * Math.min(1, delta * 14);
      piece.scale += (1 - piece.scale) * Math.min(1, delta * 10);
      piece.pulse += delta * 2;
      if (Math.abs(piece.row - piece.drawRow) < 0.002) {
        piece.drawRow = piece.row;
      }
      if (Math.abs(piece.col - piece.drawCol) < 0.002) {
        piece.drawCol = piece.col;
      }
      if (Math.abs(1 - piece.scale) < 0.003) {
        piece.scale = 1;
      }
    });

    this.particles = this.particles.filter((particle) => particle.life > 0);
    this.particles.forEach((particle) => {
      particle.life -= delta;
      particle.x += particle.vx * delta;
      particle.y += particle.vy * delta;
      particle.vy += 170 * delta;
    });

    this.popupTexts = this.popupTexts.filter((popup) => popup.life > 0);
    this.popupTexts.forEach((popup) => {
      popup.life -= delta;
      popup.y -= 34 * delta;
    });

    if (this.hintTimer > 8 && !this.hintCells.length) {
      this.findPossibleMove();
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, BOARD_PIXELS, BOARD_PIXELS);
    this.drawBoardBackground(ctx);
    this.drawGrid(ctx);
    this.board.flat().filter(Boolean).forEach((piece) => this.drawPiece(ctx, piece));
    this.drawParticles(ctx);
    this.drawPopups(ctx);
  }

  drawBoardBackground(ctx) {
    const gradient = ctx.createLinearGradient(0, 0, 0, BOARD_PIXELS);
    gradient.addColorStop(0, "rgba(255,255,255,0.18)");
    gradient.addColorStop(1, "rgba(255,255,255,0.03)");
    ctx.fillStyle = gradient;
    this.roundRect(ctx, 0, 0, BOARD_PIXELS, BOARD_PIXELS, 24);
    ctx.fill();
  }

  drawGrid(ctx) {
    for (let row = 0; row < BOARD_SIZE; row += 1) {
      for (let col = 0; col < BOARD_SIZE; col += 1) {
        const x = col * CELL_SIZE + 5;
        const y = row * CELL_SIZE + 5;
        if (!this.isPlayableCell(row, col)) {
          ctx.fillStyle = "rgba(34, 27, 66, 0.44)";
          this.roundRect(ctx, x + 4, y + 4, CELL_SIZE - 18, CELL_SIZE - 18, 16);
          ctx.fill();
          continue;
        }
        ctx.fillStyle = (row + col) % 2 === 0 ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.05)";
        this.roundRect(ctx, x, y, CELL_SIZE - 10, CELL_SIZE - 10, 18);
        ctx.fill();
        if (this.jellyGrid[row]?.[col] > 0) {
          const jellyGradient = ctx.createLinearGradient(x, y, x + CELL_SIZE, y + CELL_SIZE);
          jellyGradient.addColorStop(0, "rgba(214, 248, 255, 0.88)");
          jellyGradient.addColorStop(1, "rgba(110, 201, 255, 0.45)");
          ctx.fillStyle = jellyGradient;
          this.roundRect(ctx, x + 6, y + 6, CELL_SIZE - 22, CELL_SIZE - 22, 14);
          ctx.fill();
          ctx.strokeStyle = "rgba(255,255,255,0.9)";
          ctx.lineWidth = 2.5;
          this.roundRect(ctx, x + 6, y + 6, CELL_SIZE - 22, CELL_SIZE - 22, 14);
          ctx.stroke();
          ctx.fillStyle = "rgba(255,255,255,0.72)";
          ctx.beginPath();
          ctx.ellipse(x + CELL_SIZE * 0.42, y + CELL_SIZE * 0.34, 11, 5, -0.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "rgba(66, 154, 214, 0.95)";
          ctx.font = '700 12px "Fredoka", sans-serif';
          ctx.textAlign = "center";
          ctx.fillText("JELLY", x + CELL_SIZE / 2, y + CELL_SIZE - 14);
        }
        if (this.blockerGrid[row]?.[col] > 0) {
          ctx.fillStyle = this.blockerGrid[row][col] > 1 ? "rgba(88, 72, 124, 0.88)" : "rgba(132, 116, 166, 0.82)";
          this.roundRect(ctx, x + 10, y + 10, CELL_SIZE - 30, CELL_SIZE - 30, 12);
          ctx.fill();
          ctx.strokeStyle = "rgba(255,255,255,0.52)";
          ctx.lineWidth = 2;
          this.roundRect(ctx, x + 10, y + 10, CELL_SIZE - 30, CELL_SIZE - 30, 12);
          ctx.stroke();
        }
      }
    }

    if (this.selected && this.board[this.selected.row]?.[this.selected.col]) {
      ctx.strokeStyle = "#fff7d8";
      ctx.lineWidth = 4;
      this.roundRect(ctx, this.selected.col * CELL_SIZE + 6, this.selected.row * CELL_SIZE + 6, CELL_SIZE - 12, CELL_SIZE - 12, 18);
      ctx.stroke();
    }

    if (this.hintTimer > 8) {
      ctx.save();
      ctx.strokeStyle = "rgba(255,245,157,0.85)";
      ctx.lineWidth = 4;
      this.hintCells.forEach((cell, index) => {
        ctx.globalAlpha = 0.55 + Math.sin(performance.now() / 180 + index) * 0.25;
        this.roundRect(ctx, cell.col * CELL_SIZE + 8, cell.row * CELL_SIZE + 8, CELL_SIZE - 16, CELL_SIZE - 16, 16);
        ctx.stroke();
      });
      ctx.restore();
    }
  }

  drawPiece(ctx, piece) {
    const x = piece.drawCol * CELL_SIZE + CELL_SIZE / 2;
    const y = piece.drawRow * CELL_SIZE + CELL_SIZE / 2;
    const radius = 25 * piece.scale;
    const color = piece.special === SPECIALS.COLOR_BOMB ? "#2b2b36" : CANDY_COLORS[piece.type];

    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = 0.24;
    ctx.fillStyle = "#2c2c4f";
    ctx.beginPath();
    ctx.ellipse(0, 22, 22, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.shadowColor = color;
    ctx.shadowBlur = 11 + Math.sin(piece.pulse * 2) * 2.5;

    if (piece.special === SPECIALS.INGREDIENT) {
      this.drawIngredient(ctx, radius);
    } else if (piece.special === SPECIALS.COLOR_BOMB) {
      this.drawColorBomb(ctx, radius);
    } else {
      this.drawCandyShape(ctx, piece.type, color, radius);
    }

    if (piece.special === SPECIALS.STRIPED_H || piece.special === SPECIALS.STRIPED_V) {
      this.drawStripedOverlay(ctx, radius, piece.special === SPECIALS.STRIPED_H);
    } else if (piece.special === SPECIALS.WRAPPED) {
      this.drawWrappedOverlay(ctx, radius);
    }

    ctx.restore();
  }

  drawCandyShape(ctx, type, color, radius) {
    const gradient = ctx.createRadialGradient(-radius * 0.35, -radius * 0.45, radius * 0.2, 0, 0, radius * 1.1);
    gradient.addColorStop(0, "#fff7ef");
    gradient.addColorStop(0.2, color);
    gradient.addColorStop(1, this.shade(color, -20));
    ctx.fillStyle = gradient;
    ctx.strokeStyle = this.shade(color, -34);
    ctx.lineWidth = 1.6;
    ctx.lineJoin = "round";

    if (type === "strawberry") {
      ctx.beginPath();
      ctx.moveTo(0, -radius);
      ctx.bezierCurveTo(radius, -radius * 0.8, radius * 0.95, radius * 0.5, 0, radius * 1.05);
      ctx.bezierCurveTo(-radius * 0.95, radius * 0.5, -radius, -radius * 0.8, 0, -radius);
      ctx.fill();
      ctx.stroke();
    } else if (type === "blueberry") {
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (type === "lemon") {
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * 1.08, radius * 0.82, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (type === "mint") {
      ctx.beginPath();
      ctx.moveTo(0, -radius);
      ctx.lineTo(radius * 0.95, 0);
      ctx.lineTo(0, radius);
      ctx.lineTo(-radius * 0.95, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (type === "grape") {
      for (const [dx, dy, r] of [[-10, -8, 11], [10, -8, 11], [0, 6, 12], [-12, 12, 10], [12, 12, 10]]) {
        ctx.beginPath();
        ctx.arc(dx, dy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    } else {
      ctx.beginPath();
      ctx.roundRect(-radius, -radius * 0.8, radius * 2, radius * 1.6, 16);
      ctx.fill();
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(255,255,255,0.38)";
    ctx.beginPath();
    ctx.ellipse(-radius * 0.24, -radius * 0.4, radius * 0.26, radius * 0.12, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.beginPath();
    ctx.ellipse(radius * 0.1, radius * 0.18, radius * 0.36, radius * 0.18, 0.25, 0, Math.PI * 2);
    ctx.fill();
  }

  drawStripedOverlay(ctx, radius, horizontal) {
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 5;
    for (let i = -2; i <= 2; i += 1) {
      ctx.beginPath();
      if (horizontal) {
        ctx.moveTo(-radius * 0.9, i * 7);
        ctx.lineTo(radius * 0.9, i * 7);
      } else {
        ctx.moveTo(i * 7, -radius * 0.9);
        ctx.lineTo(i * 7, radius * 0.9);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  drawWrappedOverlay(ctx, radius) {
    ctx.save();
    ctx.strokeStyle = "rgba(255,244,186,0.95)";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.9, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-radius * 0.75, -radius * 0.25);
    ctx.lineTo(radius * 0.75, radius * 0.25);
    ctx.moveTo(radius * 0.75, -radius * 0.25);
    ctx.lineTo(-radius * 0.75, radius * 0.25);
    ctx.stroke();
    ctx.restore();
  }

  drawColorBomb(ctx, radius) {
    ctx.fillStyle = "#252535";
    ctx.strokeStyle = "rgba(255,255,255,0.24)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    const dots = ["#ff5d8f", "#ffd33d", "#4fb3ff", "#53d98d", "#ff9c3d", "#8f6fff"];
    dots.forEach((dot, index) => {
      const angle = (Math.PI * 2 * index) / dots.length;
      ctx.fillStyle = dot;
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * radius * 0.55, Math.sin(angle) * radius * 0.55, radius * 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(-radius * 0.28, -radius * 0.35, radius * 0.16, 0, Math.PI * 2);
    ctx.fill();
  }

  drawIngredient(ctx, radius) {
    ctx.fillStyle = "#ffb347";
    ctx.strokeStyle = "#e38c38";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.82, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#fff1b3";
    ctx.beginPath();
    ctx.arc(-radius * 0.18, -radius * 0.22, radius * 0.24, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#6ba34e";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, -radius * 0.78);
    ctx.quadraticCurveTo(radius * 0.18, -radius * 1.08, radius * 0.38, -radius * 0.92);
    ctx.stroke();
  }

  drawParticles(ctx) {
    this.particles.forEach((particle) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, particle.life);
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  drawPopups(ctx) {
    this.popupTexts.forEach((popup) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, popup.life);
      ctx.fillStyle = popup.color;
      ctx.strokeStyle = "rgba(72, 39, 84, 0.55)";
      ctx.lineWidth = 6;
      ctx.font = '700 22px "Baloo 2", sans-serif';
      ctx.textAlign = "center";
      ctx.strokeText(popup.text, popup.x, popup.y);
      ctx.fillText(popup.text, popup.x, popup.y);
      ctx.restore();
    });
  }

  roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
  }

  shade(color, amount) {
    const value = color.replace("#", "");
    const num = parseInt(value, 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 255) + amount));
    const b = Math.max(0, Math.min(255, (num & 255) + amount));
    return `rgb(${r}, ${g}, ${b})`;
  }

  capitalize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  wait(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }
}

window.addEventListener("DOMContentLoaded", () => {
  new SugarStormGame();
});
