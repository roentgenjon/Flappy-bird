const Storage = (() => {
  const KEY_SCORES = 'flappy_scores';
  const KEY_PLAYER = 'flappy_player';
  const KEY_PROGRESS = 'flappy_progress';
  const MAX_ENTRIES = 100;

  function load(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('Storage failed:', e);
    }
  }

  function getScores() {
    return load(KEY_SCORES, []);
  }

  function addScore(name, score) {
    const scores = getScores();
    const entry = {
      name: name || 'Anonym',
      score,
      date: new Date().toISOString(),
      ts: Date.now()
    };
    scores.push(entry);
    scores.sort((a, b) => b.score - a.score);
    if (scores.length > MAX_ENTRIES) scores.length = MAX_ENTRIES;
    save(KEY_SCORES, scores);
    return entry;
  }

  function getHighscore() {
    const scores = getScores();
    return scores.length ? scores[0].score : 0;
  }

  function getPlayerHighscore(name) {
    if (!name) return 0;
    const scores = getScores().filter(s => s.name === name);
    return scores.length ? Math.max(...scores.map(s => s.score)) : 0;
  }

  function getTodayScores() {
    const today = new Date().toDateString();
    return getScores().filter(s => new Date(s.date).toDateString() === today);
  }

  function getPlayerName() {
    return load(KEY_PLAYER, '');
  }

  function setPlayerName(name) {
    save(KEY_PLAYER, name);
  }

  function getProgress() {
    return load(KEY_PROGRESS, {
      totalGames: 0,
      totalScore: 0,
      bestScore: 0,
      lastScore: 0,
    });
  }

  function updateProgress(score) {
    const p = getProgress();
    p.totalGames += 1;
    p.totalScore += score;
    p.lastScore = score;
    if (score > p.bestScore) p.bestScore = score;
    save(KEY_PROGRESS, p);
    return p;
  }

  function clearAll() {
    localStorage.removeItem(KEY_SCORES);
    localStorage.removeItem(KEY_PROGRESS);
  }

  return {
    getScores,
    addScore,
    getHighscore,
    getPlayerHighscore,
    getTodayScores,
    getPlayerName,
    setPlayerName,
    getProgress,
    updateProgress,
    clearAll,
  };
})();
