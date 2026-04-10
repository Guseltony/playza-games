// ----------------------------- DICTIONARY & PUZZLE DATA ---------------------------------
const WORD_DICT = new Set([
  "word",
  "ring",
  "cat",
  "bat",
  "dog",
  "fun",
  "sun",
  "game",
  "move",
  "play",
  "yard",
  "lamp",
  "moon",
  "star",
  "comet",
  "bright",
  "night",
  "light",
  "orbit",
  "mars",
  "nova",
  "quest",
  "cross",
  "puzzle",
  "swipe",
  "bonus",
  "cool",
  "zing",
  "hero",
  "gold",
  "wind",
  "fire",
  "water",
  "earth",
  "king",
  "queen",
  "wing",
  "sing",
  "bing",
  "test",
  "best",
  "rest",
  "fast",
  "last",
  "bold",
  "cold",
  "hold",
  "gold",
  "tree",
  "free",
]);

// 20 Level definitions
const LEVELS = [
  {
    // Level 1
    required: ["cat", "bat"],
    gridCols: 5,
    gridRows: 5,
    placements: [
      { word: "cat", row: 1, col: 1, dir: "H" },
      { word: "bat", row: 0, col: 2, dir: "V" }, // a is at (1,2)
    ],
    lettersPool: ["c", "a", "t", "b", "m", "o"],
  },
  {
    // Level 2
    required: ["fun", "sun"],
    gridCols: 5,
    gridRows: 5,
    placements: [
      { word: "fun", row: 1, col: 1, dir: "H" },
      { word: "sun", row: 0, col: 2, dir: "V" }, // u is at (1,2)
    ],
    lettersPool: ["f", "u", "n", "s", "k", "y"],
  },
  {
    // Level 3
    required: ["word", "ring"],
    gridCols: 6,
    gridRows: 6,
    placements: [
      { word: "word", row: 1, col: 1, dir: "H" },
      { word: "ring", row: 1, col: 3, dir: "V" }, // r is at (1,3)
    ],
    lettersPool: ["w", "o", "r", "d", "i", "n", "g", "s", "t"],
  },
  {
    // Level 4 (The previous buggy one - fixed crossing at M)
    required: ["comet", "moon"],
    gridCols: 6,
    gridRows: 6,
    placements: [
      { word: "comet", row: 1, col: 0, dir: "H" },
      { word: "moon", row: 1, col: 2, dir: "V" }, // m is at (1,2) for both
    ],
    lettersPool: ["c", "o", "m", "e", "t", "o", "n", "m", "s", "a"],
  },
  {
    // Level 5
    required: ["play", "yard"],
    gridCols: 6,
    gridRows: 6,
    placements: [
      { word: "play", row: 1, col: 1, dir: "H" },
      { word: "yard", row: 1, col: 4, dir: "V" }, // y is at (1,4)
    ],
    lettersPool: ["p", "l", "a", "y", "a", "r", "d", "e", "n"],
  },
  {
    // Level 6
    required: ["star", "mars"],
    gridCols: 6,
    gridRows: 6,
    placements: [
      { word: "star", row: 1, col: 1, dir: "H" },
      { word: "mars", row: 0, col: 3, dir: "V" }, // a is at (1,3)
    ],
    lettersPool: ["s", "t", "a", "r", "m", "s", "v", "e"],
  },
  {
    // Level 7
    required: ["quest", "test"],
    gridCols: 6,
    gridRows: 6,
    placements: [
      { word: "quest", row: 1, col: 1, dir: "H" },
      { word: "test", row: 1, col: 5, dir: "V" }, // t is at (1,5)
    ],
    lettersPool: ["q", "u", "e", "s", "t", "e", "s", "v", "n", "t"],
  },
  {
    // Level 8
    required: ["light", "night"],
    gridCols: 6,
    gridRows: 6,
    placements: [
      { word: "light", row: 1, col: 1, dir: "H" },
      { word: "night", row: 0, col: 2, dir: "V" }, // i is at (1,2)
    ],
    lettersPool: ["l", "i", "g", "h", "t", "n", "d", "a"],
  },
  {
    // Level 9
    required: ["fire", "water"],
    gridCols: 6,
    gridRows: 6,
    placements: [
      { word: "fire", row: 4, col: 0, dir: "H" },
      { word: "water", row: 0, col: 2, dir: "V" }, // r is at (4,2)
    ],
    lettersPool: ["f", "i", "r", "e", "w", "a", "t", "s", "p"],
  },
  {
    // Level 10
    required: ["king", "queen"],
    gridCols: 7,
    gridRows: 7,
    placements: [
      { word: "king", row: 1, col: 3, dir: "H" }, // n at 1,5
      { word: "queen", row: 1, col: 5, dir: "V" }, // n at 5,5 -> Wait, queen V goes down. q=1,5 u=2,5 e=3,5 e=4,5 n=5,5. king n is at 1,5. So king crosses queen at N. But king row 1 col 3: k(1,3) i(1,4) n(1,5) g(1,6). Queen starts at 1,5 (q=1,5). Mismatch! N vs Q.
      // Let's use E instead. queen(u=2,5 e=3,5). Let's make king cross at E. Not possible, no E in king.
      // Let's cross at N. queen ends in N (index 4). King has N (index 2).
      // king: 4,1 H (k=4,1 i=4,2 n=4,3 g=4,4). queen: 0,3 V (q=0,3 u=1,3 e=2,3 e=3,3 n=4,3). Perfect!
    ],
  },
  {
    // Level 11
    required: ["bold", "cold"],
    gridCols: 6,
    gridRows: 6,
    placements: [
      { word: "bold", row: 1, col: 1, dir: "H" },
      { word: "cold", row: 0, col: 2, dir: "V" }, // o at 1,2
    ],
    lettersPool: ["b", "o", "l", "d", "c", "a", "r"],
  },
  {
    // Level 12
    required: ["tree", "free"],
    gridCols: 6,
    gridRows: 6,
    placements: [
      { word: "tree", row: 1, col: 1, dir: "H" },
      { word: "free", row: 0, col: 2, dir: "V" }, // r at 1,2
    ],
    lettersPool: ["t", "r", "e", "f", "d", "s"],
  },
  {
    // Level 13
    required: ["game", "move"],
    gridCols: 6,
    gridRows: 6,
    placements: [
      { word: "game", row: 1, col: 1, dir: "H" },
      { word: "move", row: 0, col: 3, dir: "V" }, // m at 1,3
    ],
    lettersPool: ["g", "a", "m", "e", "o", "v", "s", "t"],
  },
  {
    // Level 14
    required: ["wing", "sing"],
    gridCols: 6,
    gridRows: 6,
    placements: [
      { word: "wing", row: 1, col: 1, dir: "H" },
      { word: "sing", row: 0, col: 2, dir: "V" }, // i at 1,2
    ],
    lettersPool: ["w", "i", "n", "g", "s", "a", "d"],
  },
  {
    // Level 15
    required: ["fast", "last"],
    gridCols: 6,
    gridRows: 6,
    placements: [
      { word: "fast", row: 1, col: 1, dir: "H" },
      { word: "last", row: 0, col: 2, dir: "V" }, // a at 1,2
    ],
    lettersPool: ["f", "a", "s", "t", "l", "e", "r"],
  },
  {
    // Level 16
    required: ["best", "rest"],
    gridCols: 6,
    gridRows: 6,
    placements: [
      { word: "best", row: 1, col: 1, dir: "H" },
      { word: "rest", row: 0, col: 2, dir: "V" }, // e at 1,2
    ],
    lettersPool: ["b", "e", "s", "t", "r", "o", "u"],
  },
  {
    // Level 17
    required: ["cross", "swipe"],
    gridCols: 7,
    gridRows: 7,
    placements: [
      { word: "cross", row: 1, col: 1, dir: "H" }, // s at 1,5
      { word: "swipe", row: 1, col: 5, dir: "V" }, // s at 1,5
    ],
    lettersPool: ["c", "r", "o", "s", "w", "i", "p", "e", "n"],
  },
  {
    // Level 18
    required: ["bonus", "nova"],
    gridCols: 7,
    gridRows: 7,
    placements: [
      { word: "bonus", row: 2, col: 1, dir: "H" }, // n at 2,3
      { word: "nova", row: 2, col: 3, dir: "V" }, // n at 2,3
    ],
    lettersPool: ["b", "o", "n", "u", "s", "v", "a", "r"],
  },
  {
    // Level 19
    required: ["bright", "light"],
    gridCols: 7,
    gridRows: 7,
    placements: [
      { word: "bright", row: 3, col: 0, dir: "H" }, // i at 3,2
      { word: "light", row: 2, col: 2, dir: "V" }, // i at 3,2
    ],
    lettersPool: ["b", "r", "i", "g", "h", "t", "l", "e"],
  },
  {
    // Level 20
    required: ["puzzle", "game"],
    gridCols: 7,
    gridRows: 7,
    placements: [
      { word: "puzzle", row: 3, col: 0, dir: "H" }, // e at 3,5
      { word: "game", row: 0, col: 5, dir: "V" }, // e at 3,5
    ],
    lettersPool: ["p", "u", "z", "l", "e", "g", "a", "m", "o"],
  },
];

// Re-adjust King bounds just in case
LEVELS[9].placements = [
  { word: "king", row: 4, col: 1, dir: "H" },
  { word: "queen", row: 0, col: 3, dir: "V" },
];
LEVELS[9].lettersPool = ["k", "i", "n", "g", "q", "u", "e", "e", "o"]; // fix pool size if needed

let currentLevelIdx = 0; // 0-index
let currentLevel = null;
let gridModel = []; // 2D: { letter: '', isFixed: false, belongsToWords: [] }
let solvedWordsSet = new Set(); // solved required words (string)
let totalRequiredWords = 0;
let score = 0;
let combo = 0;
let hintsLeft = 3;
let selectedIndices = []; // indices in current wheel letters array
let wheelLetters = []; // array of char
let wheelElements = []; // DOM refs
let isDragging = false;
let canvasCtx = null;
let wheelContainerRect = null;
let animationFrameReq = null;
let successSound, errorSound, swipeSound, levelCompleteSound;
let audioEnabled = true;

// helper sounds (web audio)
function playBeep(type) {
  if (!audioEnabled) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    let freq = 800;
    let duration = 0.12;
    if (type === "success") {
      freq = 1200;
      duration = 0.2;
      gain.gain.value = 0.3;
    } else if (type === "error") {
      freq = 400;
      duration = 0.18;
      gain.gain.value = 0.25;
    } else if (type === "swipe") {
      freq = 900;
      duration = 0.05;
      gain.gain.value = 0.1;
    } else if (type === "complete") {
      freq = 1400;
      duration = 0.35;
      gain.gain.value = 0.4;
    }
    osc.frequency.value = freq;
    gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    console.log("audio err");
  }
}

// Build grid from placements
function buildGridFromLevel(level) {
  const rows = level.gridRows;
  const cols = level.gridCols;
  const grid = Array(rows)
    .fill()
    .map(() =>
      Array(cols)
        .fill()
        .map(() => ({ letter: "", isFixed: false, belongsTo: null })),
    );

  const usedCells = new Set();
  level.placements.forEach((pl) => {
    const word = pl.word;
    const len = word.length;
    for (let i = 0; i < len; i++) {
      let r = pl.row,
        c = pl.col;
      if (pl.dir === "H") c = pl.col + i;
      else r = pl.row + i;
      if (r >= 0 && r < rows && c >= 0 && c < cols) {
        const key = `${r},${c}`;
        usedCells.add(key);
        if (!grid[r][c].letter) grid[r][c].letter = word[i];
        else if (grid[r][c].letter !== word[i]) console.warn("conflict");
        grid[r][c].isFixed = true;
        if (!grid[r][c].belongsTo) grid[r][c].belongsTo = [];
        grid[r][c].belongsTo.push(word);
      }
    }
  });

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (!usedCells.has(`${i},${j}`)) grid[i][j].isFixed = false;
    }
  }
  return { grid, usedCells };
}

function renderGridUI() {
  const gridContainer = document.getElementById("crosswordGrid");
  const rows = currentLevel.gridRows;
  const cols = currentLevel.gridCols;
  gridContainer.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  gridContainer.innerHTML = "";
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const cell = gridModel[i][j];
      const isHidden = !cell.isFixed && !cell.letter;
      const div = document.createElement("div");
      div.className = "grid-cell";
      if (isHidden) div.classList.add("hidden-cell");
      if (cell.letter && cell.isFixed && cell.filledLetter) {
        div.textContent = cell.filledLetter.toUpperCase();
      } else if (cell.isFixed && !cell.filledLetter) {
        div.textContent = "";
      } else if (!cell.isFixed) {
        div.textContent = "";
      } else {
        div.textContent = "";
      }
      gridContainer.appendChild(div);
    }
  }
  updateProgressBar();
}

function updateProgressBar() {
  const solved = Array.from(solvedWordsSet);
  const total = totalRequiredWords;
  const percent = total === 0 ? 0 : (solved.length / total) * 100;
  document.getElementById("progressFill").style.width = `${percent}%`;
  document.getElementById("progressPercent").innerText =
    `${Math.floor(percent)}%`;
  if (solved.length === total && total > 0) {
    levelCompleteCelebration();
  }
}

function levelCompleteCelebration() {
  playBeep("complete");
  const msgDiv = document.getElementById("feedbackMsg");
  msgDiv.innerHTML = "🎉 LEVEL COMPLETE! 🎉 +200 BONUS";
  score += 200;
  updateScoreUI();
  createConfetti();
  setTimeout(() => {
    if (currentLevelIdx + 1 < LEVELS.length) {
      currentLevelIdx++;
      loadLevel(currentLevelIdx);
    } else {
      msgDiv.innerHTML = "🏆 YOU BEAT THE GAME! 🏆 Play Daily soon!";
      // Send message to parent that the game is fully beaten out of levels
      if (window.parent !== window) {
        window.parent.postMessage({ type: "GAME_COMPLETE", score: score }, "*");
      }
    }
  }, 1800);
}

function createConfetti() {
  for (let i = 0; i < 40; i++) {
    const conf = document.createElement("div");
    conf.style.position = "fixed";
    conf.style.width = "8px";
    conf.style.height = "8px";
    conf.style.background = `hsl(${Math.random() * 360}, 80%, 60%)`;
    conf.style.left = Math.random() * window.innerWidth + "px";
    conf.style.top = "-20px";
    conf.style.pointerEvents = "none";
    conf.style.zIndex = "999";
    conf.style.borderRadius = "50%";
    document.body.appendChild(conf);
    let fall = 0;
    const interval = setInterval(() => {
      fall += 5;
      conf.style.top = fall + "px";
      if (fall > window.innerHeight) {
        clearInterval(interval);
        conf.remove();
      }
    }, 20);
    setTimeout(() => {
      if (conf) conf.remove();
    }, 2000);
  }
}

function updateScoreUI() {
  document.getElementById("scoreValue").innerText = score;
  document.getElementById("comboValue").innerText = combo;
}

function submitWord(word) {
  if (word.length < 3) {
    showFeedback("⚠️ Too short!", true);
    resetSelection();
    return false;
  }
  const lowerWord = word.toLowerCase();
  if (!WORD_DICT.has(lowerWord)) {
    showFeedback("❌ Not a word!", true);
    resetSelection();
    combo = 0;
    updateScoreUI();
    return false;
  }
  let isRequired = false;
  let solvedWordMatch = null;
  for (let req of currentLevel.required) {
    if (req.toLowerCase() === lowerWord && !solvedWordsSet.has(req)) {
      isRequired = true;
      solvedWordMatch = req;
      break;
    }
  }
  if (isRequired) {
    const placement = currentLevel.placements.find(
      (p) => p.word.toLowerCase() === solvedWordMatch.toLowerCase(),
    );
    if (placement) {
      const wordChars = placement.word.split("");
      for (let i = 0; i < wordChars.length; i++) {
        let r = placement.row,
          c = placement.col;
        if (placement.dir === "H") c = placement.col + i;
        else r = placement.row + i;
        if (gridModel[r] && gridModel[r][c]) {
          gridModel[r][c].filledLetter = wordChars[i];
        }
      }
      solvedWordsSet.add(solvedWordMatch);
      renderGridUI();
      animateWordFlash(placement);
      playBeep("success");
      showFeedback(
        `✅ +${word.length * 10 + combo * 5} ${word.toUpperCase()}!`,
        false,
      );
      let points = word.length * 10 + combo * 5;
      score += points;
      combo++;
      updateScoreUI();
      resetSelection();
      return true;
    }
  } else {
    playBeep("success");
    let points = word.length * 8 + combo * 3;
    score += points;
    combo++;
    updateScoreUI();
    showFeedback(`✨ BONUS! +${points} ✨`, false);
    resetSelection();
    return true;
  }
  resetSelection();
  return false;
}

function animateWordFlash(placement) {
  const cells = document.querySelectorAll(".grid-cell");
  setTimeout(() => {
    const gridDivs = document.querySelectorAll(".grid-cell");
    gridDivs.forEach((div) => div.classList.add("glow-complete"));
    setTimeout(
      () => gridDivs.forEach((div) => div.classList.remove("glow-complete")),
      400,
    );
  }, 50);
}

function showFeedback(msg, isError) {
  const fb = document.getElementById("feedbackMsg");
  fb.innerText = msg;
  if (isError) {
    fb.style.color = "#ff8a7a";
    document.querySelector(".game-container").classList.add("shake-effect");
    setTimeout(
      () =>
        document
          .querySelector(".game-container")
          .classList.remove("shake-effect"),
      400,
    );
    playBeep("error");
  } else {
    fb.style.color = "#cafc6e";
    setTimeout(() => {
      if (fb.innerText === msg) fb.style.color = "#facc15";
    }, 800);
  }
  setTimeout(() => {
    if (fb.innerText === msg) fb.innerText = "✨ SWIPE letters to form words!";
  }, 1500);
}

function positionWheelLetters() {
  const wheelDiv = document.getElementById("lettersWheel");
  const btns = Array.from(wheelDiv.children);
  const count = btns.length;
  const radius = 120;
  const centerX = 140,
    centerY = 140;
  btns.forEach((btn, idx) => {
    const angle = (idx / count) * Math.PI * 2 - Math.PI / 2;
    const x = centerX + radius * Math.cos(angle) - 28;
    const y = centerY + radius * Math.sin(angle) - 28;
    btn.style.left = `${x}px`;
    btn.style.top = `${y}px`;
    btn.style.position = "absolute";
  });
}

function buildWheel(lettersArray) {
  const container = document.getElementById("lettersWheel");
  container.innerHTML = "";
  wheelElements = [];
  lettersArray.forEach((ch, idx) => {
    const btn = document.createElement("div");
    btn.className = "letter-btn";
    btn.textContent = ch.toUpperCase();
    btn.setAttribute("data-idx", idx);
    btn.setAttribute("data-letter", ch);
    container.appendChild(btn);
    wheelElements.push(btn);
  });
  positionWheelLetters();
  attachWheelEvents();
  drawLinesClean();
}

function attachWheelEvents() {
  const btns = wheelElements;
  const startDrag = (e, startIdx) => {
    isDragging = true;
    selectedIndices = [startIdx];
    highlightSelected();
    drawLines();
    playBeep("swipe");
  };
  const onMove = (e) => {
    if (!isDragging) return;
    const elem = document
      .elementsFromPoint(e.clientX, e.clientY)
      .find((el) => el.classList && el.classList.contains("letter-btn"));
    if (elem) {
      const idx = parseInt(elem.getAttribute("data-idx"));
      if (!selectedIndices.includes(idx)) {
        selectedIndices.push(idx);
        highlightSelected();
        drawLines();
        playBeep("swipe");
      }
    }
    drawLines();
  };
  const endDrag = () => {
    if (isDragging && selectedIndices.length > 0) {
      const word = selectedIndices.map((i) => wheelLetters[i]).join("");
      submitWord(word);
    }
    resetSelection();
    isDragging = false;
    drawLinesClean();
  };
  btns.forEach((btn, idx) => {
    btn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      startDrag(e, idx);
    });
    btn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      startDrag(e, idx);
    });
  });
  window.addEventListener("pointermove", onMove);
  window.addEventListener("touchmove", onMove);
  window.addEventListener("pointerup", endDrag);
  window.addEventListener("touchend", endDrag);
}

function highlightSelected() {
  wheelElements.forEach((el, i) => {
    if (selectedIndices.includes(i)) el.classList.add("selected");
    else el.classList.remove("selected");
  });
}

function drawLines() {
  if (!canvasCtx) return;
  const canvas = document.getElementById("wheelCanvas");
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
  const ctx = canvasCtx;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (selectedIndices.length < 2) return;
  const points = [];
  for (let idx of selectedIndices) {
    const btn = wheelElements[idx];
    if (!btn) continue;
    const btnRect = btn.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    const centerX = (btnRect.left + btnRect.right) / 2 - canvasRect.left;
    const centerY = (btnRect.top + btnRect.bottom) / 2 - canvasRect.top;
    points.push({ x: centerX, y: centerY });
  }
  ctx.beginPath();
  ctx.strokeStyle = "#facc15";
  ctx.lineWidth = 5;
  ctx.shadowBlur = 8;
  ctx.shadowColor = "cyan";
  ctx.lineCap = "round";
  for (let i = 0; i < points.length - 1; i++) {
    ctx.beginPath();
    ctx.moveTo(points[i].x, points[i].y);
    ctx.lineTo(points[i + 1].x, points[i + 1].y);
    ctx.stroke();
  }
  points.forEach((p) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 9, 0, Math.PI * 2);
    ctx.fillStyle = "#facc15aa";
    ctx.fill();
  });
}

function drawLinesClean() {
  if (canvasCtx) {
    const canvas = document.getElementById("wheelCanvas");
    const ctx = canvasCtx;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

function resetSelection() {
  selectedIndices = [];
  highlightSelected();
  drawLinesClean();
}

function shuffleWheel() {
  for (let i = wheelLetters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [wheelLetters[i], wheelLetters[j]] = [wheelLetters[j], wheelLetters[i]];
  }
  buildWheel(wheelLetters);
  resetSelection();
  showFeedback("🃏 Letters shuffled!", false);
}

function hintAction() {
  if (hintsLeft <= 0) {
    showFeedback("No hints left!", true);
    return;
  }
  const unsolved = currentLevel.required.filter((r) => !solvedWordsSet.has(r));
  if (unsolved.length === 0) return;
  const targetWord = unsolved[0];
  const placement = currentLevel.placements.find((p) => p.word === targetWord);
  if (placement) {
    for (let i = 0; i < placement.word.length; i++) {
      let r = placement.row,
        c = placement.col;
      if (placement.dir === "H") c = placement.col + i;
      else r = placement.row + i;
      const neededLetter = placement.word[i];
      const wheelIdx = wheelLetters.findIndex((l) => l === neededLetter);
      if (wheelIdx !== -1 && !gridModel[r][c]?.filledLetter) {
        wheelElements[wheelIdx].style.transform = "scale(1.2)";
        wheelElements[wheelIdx].style.transition = "0.1s";
        setTimeout(() => {
          if (wheelElements[wheelIdx])
            wheelElements[wheelIdx].style.transform = "";
        }, 500);
        hintsLeft--;
        showFeedback(`🔍 Hint: '${neededLetter.toUpperCase()}' needed!`, false);
        return;
      }
    }
  }
  hintsLeft--;
  showFeedback(`💡 Try forming "${targetWord.toUpperCase()}"`, false);
}

function loadLevel(levelIndex) {
  currentLevel = LEVELS[levelIndex];
  totalRequiredWords = currentLevel.required.length;
  solvedWordsSet.clear();
  const { grid, usedCells } = buildGridFromLevel(currentLevel);
  gridModel = grid.map((row) =>
    row.map((cell) => ({
      ...cell,
      filledLetter: null,
      letter: cell.letter,
    })),
  );
  for (let i = 0; i < gridModel.length; i++) {
    for (let j = 0; j < gridModel[0].length; j++) {
      if (gridModel[i][j].isFixed && gridModel[i][j].letter)
        gridModel[i][j].filledLetter = null;
    }
  }
  renderGridUI();
  let letters = [...currentLevel.lettersPool];
  wheelLetters = letters.sort(() => Math.random() - 0.5);
  buildWheel(wheelLetters);
  resetSelection();
  score = Math.max(score, 0);
  combo = 0;
  hintsLeft = 3;
  updateScoreUI();
  document.getElementById("levelValue").innerText = levelIndex + 1;
  showFeedback(`Level ${levelIndex + 1}: Find words!`, false);
  updateProgressBar();
}

function initGame() {
  canvasCtx = document.getElementById("wheelCanvas").getContext("2d");
  currentLevelIdx = 0;
  loadLevel(0);
  document
    .getElementById("shuffleBtn")
    .addEventListener("click", () => shuffleWheel());
  document
    .getElementById("hintBtn")
    .addEventListener("click", () => hintAction());
  window.addEventListener("resize", () => {
    positionWheelLetters();
    drawLinesClean();
  });
}

initGame();
