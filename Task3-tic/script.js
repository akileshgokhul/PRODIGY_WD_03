/* ========== setup form elements ========== */
const setupPanel     = document.getElementById('setupPanel');
const playerNameIn   = document.getElementById('playerName');
const modeSelect     = document.getElementById('mode');
const diffSelect     = document.getElementById('difficulty');
const timeLimitIn    = document.getElementById('timeLimit');
const startBtn       = document.getElementById('startBtn');

/* ========== in‑game elements ========== */
const gameArea       = document.getElementById('gameArea');
const playerLabel    = document.getElementById('playerLabel');
const opponentLabel  = document.getElementById('opponentLabel');
const boardEl        = document.getElementById('board');
const statusEl       = document.getElementById('status');
const timerEl        = document.getElementById('timeLeft');
const scoreXEl       = document.getElementById('scoreX');
const scoreOEl       = document.getElementById('scoreO');
const rematchBtn     = document.getElementById('rematchBtn');
const newGameBtn     = document.getElementById('newGameBtn');

/* ========== game state ========== */
let mode, difficulty, timeLimit;
let gameState, currentPlayer, gameActive;
let scoreX = 0, scoreO = 0;
let timerId, timeRemaining;

/* ========== constants ========== */
const winPatterns = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

/* ========== pre‑game handler ========== */
startBtn.onclick = () => {
  mode       = modeSelect.value;           // ai | pvp
  difficulty = diffSelect.value;           // easy | medium | hard
  timeLimit  = parseInt(timeLimitIn.value,10) || 10;

  playerLabel.textContent   = playerNameIn.value.trim() || 'You';
  opponentLabel.textContent = mode === 'ai' ? 'AI' : 'Player O';

  setupPanel.hidden = true;
  gameArea.hidden   = false;

  scoreX = scoreO = 0;
  updateScore();
  newRound();
};

/* ========== new round / board ========== */
function newRound() {
  boardEl.innerHTML = '';
  gameState   = Array(9).fill('');
  currentPlayer = 'X';
  gameActive  = true;
  statusEl.textContent = `${playerLabel.textContent}'s turn`;
  timeRemaining = timeLimit;
  timerEl.textContent = timeRemaining;
  renderBoard();
  startTimer();
  if (mode === 'ai' && currentPlayer === 'O') aiMove();
}

function renderBoard() {
  gameState.forEach((_, i) => {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.index = i;
    cell.onclick = handleMove;
    boardEl.appendChild(cell);
  });
}

function handleMove(e) {
  const idx = +e.currentTarget.dataset.index;
  if (!gameActive || gameState[idx]) return;
  makeMove(idx, currentPlayer);
  if (checkOutcome()) return;

  switchTurn();
  if (mode === 'ai' && currentPlayer === 'O') {
    setTimeout(aiMove, 400);
  }
}

/* ========== move helpers ========== */
function makeMove(idx, player) {
  gameState[idx] = player;
  boardEl.children[idx].textContent = player;
}

function switchTurn() {
  currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
  statusEl.textContent = `${currentPlayer === 'X' ? playerLabel.textContent : opponentLabel.textContent}'s turn`;
  restartTimer();
}

function checkOutcome() {
  if (isWinner('X') || isWinner('O') || isDraw()) {
    stopTimer();
    gameActive = false;
    if (isWinner('X'))      { scoreX++; updateScore(); statusEl.textContent = `${playerLabel.textContent} wins 🎉`; }
    else if (isWinner('O')) { scoreO++; updateScore(); statusEl.textContent = `${opponentLabel.textContent} wins 🏆`; }
    else                    { statusEl.textContent = "It's a draw 🤝"; }
    return true;
  }
  return false;
}

function isWinner(p) {
  return winPatterns.some(([a,b,c]) => gameState[a]===p && gameState[b]===p && gameState[c]===p);
}
function isDraw() { return gameState.every(Boolean); }

/* ========== score & buttons ========== */
function updateScore() {
  scoreXEl.textContent = scoreX;
  scoreOEl.textContent = scoreO;
}
rematchBtn.onclick = newRound;
newGameBtn.onclick = () => { stopTimer(); gameArea.hidden = true; setupPanel.hidden = false; };

/* ========== AI logic ========== */
function aiMove() {
  if (!gameActive) return;
  let idx;
  if (difficulty === 'easy') {
    idx = randomMove();
  } else if (difficulty === 'medium') {
    idx = smartRandom();
  } else {
    idx = minimax(gameState.slice(), 'O').index;
  }
  makeMove(idx, 'O');
  if (!checkOutcome()) switchTurn();
}
function randomMove() {
  const avail = gameState.map((v,i)=>v?null:i).filter(v=>v!==null);
  return avail[Math.floor(Math.random()*avail.length)];
}
function smartRandom() {
  // try to win, else block, else random
  for (let p of ['O','X']) {
    for (let [a,b,c] of winPatterns) {
      const line=[gameState[a],gameState[b],gameState[c]];
      if (line.filter(v=>v===p).length===2 && line.includes('')) {
        return [a,b,c][line.indexOf('')];
      }
    }
  }
  return randomMove();
}
function minimax(state, player) {
  const avail = state.map((v,i)=>v?null:i).filter(v=>v!==null);
  if (winnerState(state,'X')) return {score:-10};
  if (winnerState(state,'O')) return {score:10};
  if (!avail.length)          return {score:0};

  const moves=[];
  for (let idx of avail) {
    const move = {index: idx};
    state[idx]=player;
    const res = minimax(state, player==='O'?'X':'O');
    move.score = res.score;
    state[idx]='';
    moves.push(move);
  }
  const best = player==='O'
    ? moves.reduce((a,b)=>b.score>a.score?b:a)
    : moves.reduce((a,b)=>b.score<a.score?b:a);
  return best;
}
function winnerState(st,p){return winPatterns.some(([a,b,c])=>st[a]===p&&st[b]===p&&st[c]===p);}

/* ========== move timer ========== */
function startTimer() {
  timerEl.textContent = timeRemaining;
  timerId = setInterval(()=>{
    timeRemaining--;
    timerEl.textContent = timeRemaining;
    if (timeRemaining===0) {
      clearInterval(timerId);
      statusEl.textContent = `${currentPlayer === 'X' ? playerLabel.textContent : opponentLabel.textContent} ran out of time ⏱`;
      gameActive=false;
      if (currentPlayer==='X'){scoreO++;}else{scoreX++;}
      updateScore();
    }
  },1000);
}
function restartTimer(){stopTimer();timeRemaining=timeLimit;startTimer();}
function stopTimer(){clearInterval(timerId);}

/* ========== particles.js ========== */
