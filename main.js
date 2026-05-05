(() => {
  // Screen management
  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  }

  // Player name
  const nameInput = document.getElementById('player-name');
  nameInput.value = Storage.getPlayerName();

  function getPlayerName() {
    const n = nameInput.value.trim();
    return n || 'Anonym';
  }

  // Update start screen best score
  function refreshStartScreen() {
    const name = getPlayerName();
    Storage.setPlayerName(name);
    const best = Storage.getPlayerHighscore(name) || Storage.getHighscore();
    const bestDisplay = document.getElementById('best-score-display');
    const bestVal = document.getElementById('best-score-value');
    if (best > 0) {
      bestDisplay.classList.remove('hidden');
      bestVal.textContent = best;
    } else {
      bestDisplay.classList.add('hidden');
    }
  }

  nameInput.addEventListener('input', refreshStartScreen);
  refreshStartScreen();

  // Init game
  const canvas = document.getElementById('game-canvas');
  Game.init(canvas);

  // Set canvas size to fill screen
  function resizeCanvas() {
    const gameScreen = document.getElementById('screen-game');
    const w = gameScreen.clientWidth;
    const h = gameScreen.clientHeight;
    const scale = Math.min(w / 400, h / 600);
    canvas.style.width = Math.floor(400 * scale) + 'px';
    canvas.style.height = Math.floor(600 * scale) + 'px';
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // Game over callback
  onGameOver = (score) => {
    const name = getPlayerName();
    const progress = Storage.updateProgress(score);
    Storage.addScore(name, score);

    const prevBest = progress.bestScore - (score > progress.bestScore - score ? 0 : score);
    const isNewBest = score >= progress.bestScore;

    document.getElementById('final-score').textContent = score;
    document.getElementById('final-best').textContent = progress.bestScore;

    const badge = document.getElementById('new-highscore-badge');
    if (isNewBest && score > 0) {
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }

    // Medal
    const medal = document.getElementById('medal');
    medal.className = 'medal';
    if (score >= 40) {
      medal.classList.add('platinum');
      medal.textContent = '✦';
      medal.classList.remove('hidden');
    } else if (score >= 20) {
      medal.classList.add('gold');
      medal.textContent = '★';
      medal.classList.remove('hidden');
    } else if (score >= 10) {
      medal.classList.add('silver');
      medal.textContent = '★';
      medal.classList.remove('hidden');
    } else if (score >= 5) {
      medal.classList.add('bronze');
      medal.textContent = '★';
      medal.classList.remove('hidden');
    } else {
      medal.classList.add('hidden');
    }

    showScreen('screen-gameover');
  };

  // === Button handlers ===

  document.getElementById('btn-start').addEventListener('click', () => {
    const name = getPlayerName();
    Storage.setPlayerName(name);
    Leaderboard.setPlayer(name);
    showScreen('screen-game');
    resizeCanvas();
    Game.start();
  });

  document.getElementById('btn-leaderboard').addEventListener('click', () => {
    Leaderboard.setPlayer(getPlayerName());
    Leaderboard.refresh();
    showScreen('screen-leaderboard');
  });

  document.getElementById('btn-retry').addEventListener('click', () => {
    showScreen('screen-game');
    resizeCanvas();
    Game.start();
  });

  document.getElementById('btn-menu').addEventListener('click', () => {
    refreshStartScreen();
    showScreen('screen-start');
  });

  document.getElementById('btn-leaderboard2').addEventListener('click', () => {
    Leaderboard.setPlayer(getPlayerName());
    Leaderboard.refresh();
    showScreen('screen-leaderboard');
  });

  document.getElementById('btn-back').addEventListener('click', () => {
    refreshStartScreen();
    showScreen('screen-start');
  });

  document.getElementById('btn-pause').addEventListener('click', () => {
    Game.togglePause();
  });

  document.getElementById('btn-resume').addEventListener('click', () => {
    Game.resume();
  });

  document.getElementById('btn-quit').addEventListener('click', () => {
    document.getElementById('pause-overlay').classList.add('hidden');
    refreshStartScreen();
    showScreen('screen-start');
  });

  // Init leaderboard tabs
  Leaderboard.init();
})();
